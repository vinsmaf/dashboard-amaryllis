// Cloudflare Pages Function — /api/client-errors
// Inbox auto-hébergée des bugs : erreurs JS captées en prod (site + admin)
// ET reports manuels ("Signaler un bug"). Alimente l'onglet admin 🐞 Bugs
// et l'agent de triage hebdo (functions/api/bug-triage.js).
//
//   • POST  /api/client-errors            → PUBLIC (rate-limité) : enregistre une erreur/report
//   • GET   /api/client-errors            → admin OU ?secret= : liste / stats
//   • PATCH /api/client-errors?id=...      → admin : change statut/gravité ou pousse au backlog
//
// Stockage : table D1 client_errors (binding revenue_manager). Dédoublonnage
// par empreinte stable (kind + message normalisé + chemin) → compteur d'occurrences.

import { verifyBearer } from "./_adminauth.js";
import { rateLimit } from "./_ratelimit.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://villamaryllis.com",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

// Bruit navigateur connu — jamais enregistré (extensions, in-app FB/IG, etc.)
const NOISE = [
  /ResizeObserver loop/i,
  /Non-Error promise rejection/i,
  /^Script error\.?$/i,
  /Failed to fetch.*chrome-extension/i,
  /Load failed$/i, // souvent requêtes annulées (navigation)
  /Java(Script)? exception.*instagram|fbav|fb_iab/i,
  // Artefacts navigateurs in-app / autofill iOS-WebKit (gestionnaires de mots de passe,
  // navigateurs Facebook/Instagram) — variables injectées hors de notre code.
  /_AutofillCallbackHandler/i,
  /webkit\.messageHandlers/i,
  /Can't find variable: (_Autofill|webkit|gmo|__gCrWeb|instantSearch)/i,
  // Réseau transitoire (jamais un bug de code) : connexions coupées/réinitialisées/timeout.
  // Couvre aussi le bruit du crawler "[revue visuelle]" (net::ERR_* + page.goto Timeout/networkidle).
  /net::ERR_/i,
  /page\.goto.*Timeout|waiting until "networkidle"/i,
  // Chargement de chunk/lazy après déploiement — bénin (l'auto-reload stale-chunk le gère).
  /Importing a module script failed|(Failed to fetch|error loading) dynamically imported module/i,
  // Navigateurs in-app (WebView Android Instagram/Facebook) : pont JS détruit, hors notre code.
  /postMessage.*Java object is gone/i,
  // Loader Google API (gapi) injecté par extension/compte Google côté client — pas notre code.
  /Jsloader error/i,
];
const SCREENSHOT_MAX = 180_000; // ~180 Ko base64 max (downscalé côté client)

export async function ensureClientErrorsTable(db) { return ensureTable(db); }
async function ensureTable(db) {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS client_errors (" +
    "id TEXT PRIMARY KEY," +              // empreinte stable (anti-doublon)
    "kind TEXT NOT NULL," +              // error | rejection | console | report
    "message TEXT," +
    "stack TEXT," +
    "path TEXT," +                       // pathname (regroupement)
    "url TEXT," +
    "ua TEXT," +
    "viewport TEXT," +                   // "1280x800"
    "comment TEXT," +                    // pour les reports manuels
    "screenshot TEXT," +                 // dataURL JPEG downscalé (reports)
    "severity TEXT," +                   // rempli par l'agent : critique|haute|moyenne|basse
    "status TEXT NOT NULL DEFAULT 'new'," + // new | triaged | backlog | ignored | fixed
    "count INTEGER NOT NULL DEFAULT 1," +
    "backlog_id TEXT," +                 // id de l'action agent_actions créée
    "first_seen INTEGER NOT NULL DEFAULT (unixepoch())," +
    "last_seen INTEGER NOT NULL DEFAULT (unixepoch())" +
    ")"
  );
  await db.exec("CREATE INDEX IF NOT EXISTS idx_cerr_status ON client_errors(status)");
  await db.exec("CREATE INDEX IF NOT EXISTS idx_cerr_last ON client_errors(last_seen)");
}

function clip(s, n) { return s == null ? null : String(s).slice(0, n); }

// Normalise un message pour regrouper les variantes (chiffres, ids, urls).
function normalize(msg) {
  return String(msg || "")
    .toLowerCase()
    .replace(/https?:\/\/[^\s)]+/g, "·url·")
    .replace(/0x[0-9a-f]+/g, "·hex·")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{20,}/g, "·uuid·")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

export async function clientErrorFingerprint(kind, msg, path) { return fingerprint(kind, msg, path); }
async function fingerprint(kind, msg, path) {
  const data = `${kind}|${normalize(msg)}|${path || ""}`;
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(data));
  return [...new Uint8Array(buf)].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return onRequestOptions();
  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 500);
  await ensureTable(db);
  const url = new URL(request.url);

  // ── POST : enregistrement (PUBLIC, rate-limité) ───────────────────
  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

    const kind = ["error", "rejection", "console", "report"].includes(body.kind) ? body.kind : "error";
    const message = clip(body.message, 600) || "(sans message)";
    if (kind !== "report" && NOISE.some(re => re.test(message))) return json({ ok: true, ignored: true });

    // Rate-limit par IP (fail-open) — un report manuel reste prioritaire mais borné.
    const ip = request.headers.get("CF-Connecting-IP") || "?";
    const rl = await rateLimit(db, { key: `cerr:${ip}`, limit: kind === "report" ? 10 : 40, windowSec: 600 });
    if (rl && rl.ok === false) return json({ ok: true, throttled: true });

    let path = clip(body.path, 200);
    if (!path && body.url) { try { path = new URL(body.url).pathname; } catch {} }
    const id = await fingerprint(kind === "report" ? `report:${Date.now()}` : kind, message, path);
    let screenshot = null;
    if (kind === "report" && typeof body.screenshot === "string" && body.screenshot.startsWith("data:image")) {
      screenshot = body.screenshot.length <= SCREENSHOT_MAX ? body.screenshot : null;
    }

    // Upsert : même empreinte → on incrémente le compteur (sauf reports, toujours uniques).
    const existing = kind === "report" ? null
      : await db.prepare("SELECT id, status FROM client_errors WHERE id=?").bind(id).first();
    if (existing) {
      await db.prepare(
        "UPDATE client_errors SET count=count+1, last_seen=unixepoch(), url=?, ua=?, viewport=?, " +
        "status=CASE WHEN status IN ('ignored','fixed') THEN status ELSE 'new' END WHERE id=?"
      ).bind(clip(body.url, 300), clip(body.ua, 300), clip(body.viewport, 20), id).run();
      return json({ ok: true, id, deduped: true });
    }
    await db.prepare(
      "INSERT INTO client_errors (id, kind, message, stack, path, url, ua, viewport, comment, screenshot) " +
      "VALUES (?,?,?,?,?,?,?,?,?,?)"
    ).bind(
      id, kind, message, clip(body.stack, 4000), path, clip(body.url, 300),
      clip(body.ua, 300), clip(body.viewport, 20), clip(body.comment, 1200), screenshot
    ).run();
    return json({ ok: true, id });
  }

  // ── À partir d'ici : lecture/écriture réservée admin ou secret ─────
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  // ── GET : liste / stats ───────────────────────────────────────────
  if (request.method === "GET") {
    if (url.searchParams.get("stats") === "1") {
      const since = Math.floor(Date.now() / 1000) - 7 * 86400;
      const rows = (await db.prepare(
        "SELECT status, kind, severity, COUNT(*) n, SUM(count) occ FROM client_errors GROUP BY status, kind, severity"
      ).all()).results || [];
      const week = (await db.prepare(
        "SELECT COUNT(*) n, SUM(count) occ FROM client_errors WHERE last_seen>=?"
      ).bind(since).first()) || {};
      return json({ ok: true, groups: rows, last7days: week });
    }
    const status = url.searchParams.get("status");
    const kind = url.searchParams.get("kind");
    const withShot = url.searchParams.get("screenshots") === "1";
    const cols = withShot
      ? "*"
      : "id,kind,message,stack,path,url,ua,viewport,comment,severity,status,count,backlog_id,first_seen,last_seen,(screenshot IS NOT NULL) AS has_shot";
    const conds = [], binds = [];
    if (status) { conds.push("status=?"); binds.push(status); }
    if (kind) { conds.push("kind=?"); binds.push(kind); }
    const where = conds.length ? "WHERE " + conds.join(" AND ") : "";
    const q = `SELECT ${cols} FROM client_errors ${where} ORDER BY last_seen DESC LIMIT 400`;
    const { results } = await db.prepare(q).bind(...binds).all();
    return json({ ok: true, items: results || [] });
  }

  // ── PATCH : statut / gravité / push backlog ───────────────────────
  if (request.method === "PATCH") {
    const id = url.searchParams.get("id");
    let body = {};
    try { body = await request.json(); } catch {}

    // ── Bulk : { ids:[...], status, severity? } → 1 seule requête (triage en masse) ──
    const VALID_ST = ["new", "triaged", "backlog", "ignored", "fixed"];
    if (Array.isArray(body.ids) && body.ids.length) {
      const ids = body.ids.slice(0, 500).filter(x => typeof x === "string");
      if (!ids.length) return json({ error: "ids vides" }, 400);
      const sets = [], binds = [];
      if (body.status && VALID_ST.includes(body.status)) { sets.push("status=?"); binds.push(body.status); }
      if (body.severity) { sets.push("severity=?"); binds.push(body.severity); }
      if (!sets.length) return json({ error: "rien à modifier (status/severity)" }, 400);
      const ph = ids.map(() => "?").join(",");
      await db.prepare(`UPDATE client_errors SET ${sets.join(", ")} WHERE id IN (${ph})`).bind(...binds, ...ids).run();
      return json({ ok: true, updated: ids.length });
    }

    if (!id) return json({ error: "id requis (query string)" }, 400);

    if (body.tobacklog) {
      const row = await db.prepare("SELECT * FROM client_errors WHERE id=?").bind(id).first();
      if (!row) return json({ error: "introuvable" }, 404);
      const sev = body.severity || row.severity || "moyenne";
      const prio = ["critique", "haute", "moyenne", "basse"].includes(sev) ? sev : "moyenne";
      const bid = "bug-" + id;
      const label = (row.kind === "report" ? "🐞 Report" : "🐞 Erreur JS");
      const action = `${label} — ${clip(row.message, 160)}${row.path ? ` (page ${row.path})` : ""}`;
      const notes = [row.comment ? `Commentaire : ${row.comment}` : "", row.stack ? `Stack : ${clip(row.stack, 500)}` : "", `Occurrences : ${row.count}`].filter(Boolean).join("\n");
      await db.prepare(
        "INSERT INTO agent_actions (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, notes) " +
        "VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET priority=excluded.priority, status='backlog', updated_at=unixepoch()"
      ).bind(bid, "webmaster", "Webmaster", "🔧", "bug", action, prio, "1h", "backlog", notes).run();
      await db.prepare("UPDATE client_errors SET status='backlog', severity=?, backlog_id=? WHERE id=?").bind(prio, bid, id).run();
      return json({ ok: true, backlog_id: bid });
    }

    const sets = [], binds = [];
    if (body.status) { sets.push("status=?"); binds.push(body.status); }
    if (body.severity) { sets.push("severity=?"); binds.push(body.severity); }
    if (!sets.length) return json({ error: "rien à modifier" }, 400);
    binds.push(id);
    await db.prepare(`UPDATE client_errors SET ${sets.join(", ")} WHERE id=?`).bind(...binds).run();
    return json({ ok: true });
  }

  return json({ error: "Méthode non autorisée" }, 405);
}
