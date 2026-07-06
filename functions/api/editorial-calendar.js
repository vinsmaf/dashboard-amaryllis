// Cloudflare Pages Function — /api/editorial-calendar
// Planning éditorial Facebook + Instagram pour Amaryllis Locations.
// Auto-init de la table éditoriale + CRUD complet.
//
// GET    ?from=YYYY-MM-DD&to=YYYY-MM-DD → liste des entrées (public — contenu non sensible :
//         thèmes/captions/horaires de publication, aucune donnée client/financière)
// GET    ?id=N → 1 entrée
// POST   { ...entry } → créer une entrée               (auth requise)
// POST   ?action=seed_30days → seed 30 entrées          (auth requise)
// PATCH  ?id=N → mettre à jour                          (auth requise)
// DELETE ?id=N → supprimer                              (auth requise)
//
// sec (2026-07-06) : ce endpoint alimente l'auto-publication FB/IG (le Worker
// publie les entrées "approved") — les écritures (POST/PATCH/DELETE) exigeaient
// AUCUNE auth. Corrigé : Bearer admin (session ldb_tok, cf. contacts.js) OU
// ?secret=POSTSTAY_SECRET (utilisé par workers/ical-sync/index.js). GET reste
// public : la charte éditoriale n'expose rien de confidentiel.

import { verifyBearer } from "./_adminauth.js";

async function checkWriteAuth(request, env) {
  if (!env.ADMIN_PASSWORD && !env.ADMIN_PWD && !env.POSTSTAY_SECRET) return true; // dev, rien de configuré
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET) return true;
  const { ok } = await verifyBearer(request, env);
  return ok;
}

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const DDL = `
CREATE TABLE IF NOT EXISTS editorial_calendar (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  scheduled_at  INTEGER NOT NULL,          -- timestamp unix (jour de publication)
  platform      TEXT NOT NULL,             -- 'fb' | 'ig' | 'both'
  publish_hour  TEXT NOT NULL,             -- "13h30" pour visualisation
  bien_id       TEXT NOT NULL,             -- amaryllis | zandoli | iguana | geko | mabouya | schoelcher | nogent
  theme         TEXT NOT NULL,             -- inspiration | preuve | detail | reve | conversion | lifestyle | info
  variante      TEXT,                      -- V1 | V2 | V3 | V4 + libellé
  format        TEXT,                      -- reel | carrousel | post | story
  photo_url     TEXT,                      -- /photos/{bien}/XX.webp
  cta           TEXT,                      -- "Réserver" | "Découvrir" | etc.
  brief         TEXT,                      -- consigne libre pour community-manager
  draft_id      INTEGER,                   -- FK vers agent_drafts.id quand généré
  status        TEXT NOT NULL DEFAULT 'planned', -- planned | generating | drafted | approved | published | failed | skipped
  result        TEXT,                      -- JSON détails après publication
  published_at  INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_cal_scheduled ON editorial_calendar(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_cal_status    ON editorial_calendar(status);
CREATE INDEX IF NOT EXISTS idx_cal_bien      ON editorial_calendar(bien_id);
`;

async function ensureTable(db) {
  try { for (const s of DDL.split(";").filter(Boolean)) await db.prepare(s).run(); } catch {}
}

// ── Plan canonique 30 jours (sera adapté à la date de départ) ──────────────
const WEEKLY_TEMPLATE = [
  // [theme, variantes ordonnées V1..V4, fb_hour, ig_hour, format prioritaire]
  { day: 1, theme: "inspiration",  fb: "12h00", ig: "18h30", format: "reel",      cta: "Voir la visite" },        // Lundi
  { day: 2, theme: "preuve",       fb: "11h30", ig: "19h00", format: "carrousel", cta: "Voir la visite" },        // Mardi
  { day: 3, theme: "detail",       fb: "11h30", ig: "12h30", format: "reel",      cta: "Découvrir" },             // Mercredi
  { day: 4, theme: "reve",         fb: "13h30", ig: "19h30", format: "reel",      cta: "Réserver" },              // Jeudi
  { day: 5, theme: "conversion",   fb: "14h00", ig: "13h00", format: "carrousel", cta: "Réserver maintenant" },   // Vendredi
  { day: 6, theme: "lifestyle",    fb: "12h00", ig: "10h30", format: "carrousel", cta: "Sauvegarder pour plus tard" }, // Samedi
  { day: 7, theme: "info",         fb: "12h30", ig: "18h00", format: "post",      cta: "Voir la visite" },        // Dimanche
];

const VARIANTES = {
  inspiration: [
    "V1 Imaginez votre réveil",
    "V2 Six heures du matin face à la mer",
    "V3 Lever de soleil chambre baignée de lumière",
    "V4 Vue depuis la terrasse à l'aube",
  ],
  preuve: [
    "V1 Citation avis 5★ + photo",
    "V2 X voyageurs · 4,X étoiles",
    "V3 Avant/après saison sèche vs verte",
    "V4 Témoignage anonyme storifié",
  ],
  detail: [
    "V1 Focus piscine",
    "V2 Focus terrasse / coin lecture",
    "V3 Focus suite parentale ou cuisine",
    "V4 Focus équipement signature",
  ],
  reve: [
    "V1 Un week-end parfait à [Bien]",
    "V2 Le rituel du matin",
    "V3 Quand la nuit tombe",
    "V4 3 instants à ne pas manquer",
  ],
  conversion: [
    "V1 Dispo weekend prochain",
    "V2 Offre inter-saison 4+1",
    "V3 Pack 3 jours + transferts",
    "V4 Tarif direct -10% vs OTA",
  ],
  lifestyle: [
    "V1 5 plages secrètes à proximité",
    "V2 Marché local du samedi",
    "V3 Restaurants signature 15 min",
    "V4 Plongée / kitesurf / catamaran",
  ],
  info: [
    "V1 Comparatif inter vs haute saison",
    "V2 Que mettre dans la valise",
    "V3 Quand partir selon votre profil",
    "V4 Comment se déplacer",
  ],
};

// Biens exclus du planning éditorial (loués à l'année, indisponibles, etc.)
// Configurable via body.excluded_biens ou par défaut ci-dessous
const DEFAULT_EXCLUDED_BIENS = ["iguana"]; // Villa Iguana : louée à l'année

// Rotation des biens — INVARIANT : à 1 post/jour, chaque bien revient tous les
// N jours (N = biens disponibles, 6 en général) → jamais 2 posts du même bien
// à <4j d'intervalle (règle anti-doublon du gate, cf. _editorialGate.js).
// L'ancienne séquence pondérée (amaryllis 8×/30j) créait des écarts de 2-3j
// → escalades systématiques du gate → soirées sans post (incident 07-01/07-02).
const FULL_SEQUENCE = [
  "amaryllis", "zandoli", "mabouya", "schoelcher", "geko", "nogent",
];

function pickBienForDay(ts, excludedSet) {
  // Index STABLE dérivé de la date (jours epoch) — pas de curseur remis à zéro
  // entre deux reseeds hebdo : deux runs différents alignent la même rotation,
  // donc pas de doublon à la frontière entre l'ancien et le nouveau seed.
  const available = FULL_SEQUENCE.filter(b => !excludedSet.has(b));
  if (available.length === 0) return null;
  return available[Math.floor(ts / 86400) % available.length];
}

// Récupère les biens occupés sur la période (depuis Beds24 via API interne)
async function fetchOccupiedBiens(env, fromTs, toTs) {
  const occupied = new Set();
  try {
    const siteUrl = env.SITE_URL || "https://villamaryllis.com";
    const fromYMD = new Date(fromTs * 1000).toISOString().slice(0, 10);
    const toYMD   = new Date(toTs * 1000).toISOString().slice(0, 10);
    // Si > 80% de la période est bloquée par des réservations, on skip ce bien
    // Sources : Beds24 pour Nogent, iCal Airbnb/Booking pour les autres
    const BIENS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];
    for (const bien of BIENS) {
      try {
        const r = await fetch(`${siteUrl}/api/get-availability?bienId=${bien}`, { headers: { "User-Agent": "editorial-cron" } });
        if (!r.ok) continue;
        const data = await r.json();
        const busy = (data.busyDays || []).filter(d => {
          const dt = new Date(d).getTime() / 1000;
          return dt >= fromTs && dt <= toTs;
        });
        const periodDays = Math.max(1, Math.ceil((toTs - fromTs) / 86400));
        if (busy.length / periodDays > 0.8) occupied.add(bien);
      } catch {}
    }
  } catch {}
  return occupied;
}

function dateToUnix(yyyymmdd) {
  return Math.floor(new Date(yyyymmdd + "T00:00:00Z").getTime() / 1000);
}

function unixToYMD(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

async function handleSeed30Days(env, db, body) {
  const startDate = body.start_date || new Date().toISOString().slice(0, 10);
  const startTs   = dateToUnix(startDate);
  const startDay  = new Date(startTs * 1000).getUTCDay();
  const endTs     = startTs + 30 * 86400;

  // ── Exclusions :
  //   1. Defaults (Iguana loué à l'année)
  //   2. Body.excluded_biens si fourni
  //   3. Biens occupés > 80% sur la période (auto-detect via Beds24/iCal)
  const excludedManual  = new Set([...DEFAULT_EXCLUDED_BIENS, ...(body.excluded_biens || [])]);
  const skipOccupancy   = body.skip_occupancy_check === true;
  const autoExcluded    = skipOccupancy ? new Set() : await fetchOccupiedBiens(env, startTs, endTs);
  const excludedSet     = new Set([...excludedManual, ...autoExcluded]);

  // Anti-doublon : skip dates déjà planifiées
  let existingDates = new Set();
  try {
    const { results } = await db.prepare(
      "SELECT scheduled_at FROM editorial_calendar WHERE scheduled_at >= ? AND scheduled_at < ?"
    ).bind(startTs, endTs).all();
    existingDates = new Set((results || []).map(r => unixToYMD(r.scheduled_at)));
  } catch {}

  let inserted = 0, skipped = 0;
  const entries = [];

  for (let i = 0; i < 30; i++) {
    const ts   = startTs + i * 86400;
    const date = unixToYMD(ts);
    if (existingDates.has(date)) { skipped++; continue; }

    const bienId = pickBienForDay(ts, excludedSet);
    if (!bienId) { skipped++; continue; } // tous les biens exclus

    const dow       = (startDay + i) % 7;
    const tplDay    = dow === 0 ? 7 : dow;
    const tpl       = WEEKLY_TEMPLATE.find(t => t.day === tplDay) || WEEKLY_TEMPLATE[0];
    const weekIdx   = Math.floor(i / 7);
    const variante  = VARIANTES[tpl.theme][weekIdx % 4];
    const photoNum  = String((i % 12) + 1).padStart(2, "0");
    const photoUrl  = `https://villamaryllis.com/photos/${bienId}/${photoNum}.webp`;
    const brief     = `${tpl.theme} ${variante.split(" ")[0]} — ${bienId} — format ${tpl.format}`;

    try {
      await db.prepare(`
        INSERT INTO editorial_calendar
          (scheduled_at, platform, publish_hour, bien_id, theme, variante, format, photo_url, cta, brief, status, created_at, updated_at)
        VALUES (?, 'both', ?, ?, ?, ?, ?, ?, ?, ?, 'planned', unixepoch(), unixepoch())
      `).bind(ts, `FB ${tpl.fb} · IG ${tpl.ig}`, bienId, tpl.theme, variante, tpl.format, photoUrl, tpl.cta, brief).run();
      inserted++;
      entries.push({ date, bien_id: bienId, theme: tpl.theme, variante, format: tpl.format });
    } catch (e) {}
  }

  return json({
    ok: true, inserted, skipped,
    excluded_biens: [...excludedSet],
    excluded_reason: {
      manual: [...excludedManual],
      auto_occupied: [...autoExcluded],
    },
    message: `${inserted} jours planifiés${skipped ? ` (${skipped} skippés)` : ""}${excludedSet.size ? ` · biens exclus: ${[...excludedSet].join(", ")}` : ""}`,
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  await ensureTable(db);

  const url = new URL(request.url);
  const now = Math.floor(Date.now() / 1000);

  // ── GET ────────────────────────────────────────────────────────────────
  if (request.method === "GET") {
    const id = url.searchParams.get("id");
    if (id) {
      const row = await db.prepare("SELECT * FROM editorial_calendar WHERE id = ?").bind(parseInt(id)).first();
      return json({ entry: row });
    }
    const from = url.searchParams.get("from"); // YYYY-MM-DD
    const to   = url.searchParams.get("to");
    const status = url.searchParams.get("status");
    const bien   = url.searchParams.get("bien_id");

    let q = "SELECT * FROM editorial_calendar WHERE 1=1";
    const params = [];
    if (from) { q += " AND scheduled_at >= ?"; params.push(dateToUnix(from)); }
    if (to)   { q += " AND scheduled_at <= ?"; params.push(dateToUnix(to) + 86399); }
    if (status) { q += " AND status = ?"; params.push(status); }
    if (bien)   { q += " AND bien_id = ?"; params.push(bien); }
    q += " ORDER BY scheduled_at ASC LIMIT 200";
    try {
      const { results } = await db.prepare(q).bind(...params).all();
      return json({ entries: results || [], total: (results || []).length });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── POST / PATCH / DELETE : auth requise (Bearer admin ou ?secret=POSTSTAY_SECRET) ──
  if (request.method !== "GET" && !(await checkWriteAuth(request, env))) {
    return json({ error: "Non autorisé" }, 401);
  }

  // ── POST ───────────────────────────────────────────────────────────────
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const action = url.searchParams.get("action");
    if (action === "seed_30days") return handleSeed30Days(env, db, body);

    // Création unitaire
    const { scheduled_at, platform = "both", publish_hour, bien_id, theme, variante, format, photo_url, cta, brief } = body;
    if (!scheduled_at || !bien_id || !theme) return json({ error: "scheduled_at, bien_id, theme requis" }, 400);
    try {
      const ts = typeof scheduled_at === "string" ? dateToUnix(scheduled_at) : scheduled_at;
      const r = await db.prepare(`
        INSERT INTO editorial_calendar
          (scheduled_at, platform, publish_hour, bien_id, theme, variante, format, photo_url, cta, brief, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned', ?, ?)
      `).bind(ts, platform, publish_hour || "", bien_id, theme, variante || "", format || "", photo_url || "", cta || "", brief || "", now, now).run();
      return json({ ok: true, id: r.meta?.last_row_id });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── PATCH ──────────────────────────────────────────────────────────────
  if (request.method === "PATCH") {
    const id = parseInt(url.searchParams.get("id"));
    if (!id) return json({ error: "id requis" }, 400);
    const body = await request.json().catch(() => ({}));
    const fields = [];
    const vals = [];
    for (const k of ["scheduled_at","platform","publish_hour","bien_id","theme","variante","format","photo_url","cta","brief","status","draft_id","result"]) {
      if (body[k] !== undefined) { fields.push(`${k} = ?`); vals.push(body[k]); }
    }
    if (!fields.length) return json({ error: "rien à mettre à jour" }, 400);
    fields.push("updated_at = ?"); vals.push(now);
    vals.push(id);
    try {
      await db.prepare(`UPDATE editorial_calendar SET ${fields.join(", ")} WHERE id = ?`).bind(...vals).run();
      return json({ ok: true });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── DELETE ─────────────────────────────────────────────────────────────
  if (request.method === "DELETE") {
    const id = parseInt(url.searchParams.get("id"));
    const purgeAll = url.searchParams.get("all") === "true";
    if (purgeAll) {
      await db.prepare("DELETE FROM editorial_calendar WHERE status IN ('planned','skipped')").run();
      return json({ ok: true, purged: "all planned" });
    }
    if (!id) return json({ error: "id requis" }, 400);
    await db.prepare("DELETE FROM editorial_calendar WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
}
