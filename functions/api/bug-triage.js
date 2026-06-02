// Cloudflare Pages Function — /api/bug-triage
// Agent de triage hebdo des bugs. Lit les bugs "new" récents (client_errors),
// les classe par gravité via LLM, ignore le bruit, pousse les vrais au backlog
// (agent_actions), et renvoie un résumé que le Worker envoie en digest (lundi).
//
//   GET|POST /api/bug-triage?secret=POSTSTAY_SECRET   (ou token admin)
//   ?dry=1  → simule (classe + résume) sans rien écrire.
//
// Appelé par le cron Worker du lundi (runBugTriage). Idempotent : ne traite
// que le statut 'new', donc relançable sans doublonner.

import { verifyBearer } from "./_adminauth.js";
import { callLLM } from "./_llm.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const SEVS = ["critique", "haute", "moyenne", "basse"];

// Extrait le premier tableau JSON d'une réponse LLM (tolère le texte autour).
function extractJsonArray(text) {
  if (!text) return null;
  const a = text.indexOf("["), b = text.lastIndexOf("]");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const db = env.revenue_manager;
  if (!db) return json({ ok: false, error: "DB indisponible" }, 500);

  // Auth : secret (cron) ou token admin
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ ok: false, error: "Non autorisé" }, 401);

  const dry = url.searchParams.get("dry") === "1";
  const since = Math.floor(Date.now() / 1000) - 8 * 86400;

  // 1) Bugs nouveaux récents
  const { results: bugs } = await db.prepare(
    "SELECT id, kind, message, path, comment, count FROM client_errors " +
    "WHERE status='new' AND last_seen>=? ORDER BY count DESC, last_seen DESC LIMIT 60"
  ).bind(since).all();

  if (!bugs || bugs.length === 0) {
    return json({ ok: true, triaged: 0, ignored: 0, created: 0, summary: "🐞 Triage bugs : aucun nouveau bug cette semaine. ✓" });
  }

  // 2) Classement LLM (un seul appel, batch compact)
  const list = bugs.map(b => `[${b.id}] (${b.kind}, vu ${b.count}×) ${b.message}${b.path ? ` | page ${b.path}` : ""}${b.comment ? ` | note: ${b.comment}` : ""}`).join("\n");
  const prompt = [
    { role: "system", content: "Tu es un ingénieur QA pour un site de location de villas (React/Cloudflare). On te donne une liste de bugs captés en production. Pour CHAQUE bug, décide : gravité (critique=bloque réservation/paiement, haute=fonction cassée, moyenne=gêne visible, basse=cosmétique) et s'il faut l'ignorer (bruit navigateur, extension, faux positif, non actionnable). Réponds UNIQUEMENT par un tableau JSON, un objet par bug, format strict : [{\"id\":\"...\",\"severity\":\"critique|haute|moyenne|basse\",\"ignore\":true|false,\"title\":\"résumé court actionnable en français\"}]. Aucun texte autour." },
    { role: "user", content: list },
  ];
  const llm = await callLLM(env, { tier: "medium", messages: prompt, logSource: "bug-triage", timeoutMs: 25000 });
  const verdicts = extractJsonArray(llm.text) || [];
  const byId = {};
  for (const v of verdicts) { if (v && v.id) byId[v.id] = v; }

  // 3) Application
  let created = 0, ignored = 0, kept = 0;
  const createdItems = [];
  for (const b of bugs) {
    const v = byId[b.id] || {};
    const ignore = v.ignore === true;
    let sev = SEVS.includes(v.severity) ? v.severity : "moyenne";
    const title = (v.title && String(v.title).slice(0, 160)) || b.message;

    if (ignore) {
      ignored++;
      if (!dry) await db.prepare("UPDATE client_errors SET status='ignored', severity=? WHERE id=?").bind(sev, b.id).run();
      continue;
    }
    // Critiques : on garde 'new' + flag gravité pour que tu les voies en rouge tout en haut,
    // mais on crée AUSSI l'action backlog. Les autres passent en 'backlog'.
    const bid = "bug-" + b.id;
    const action = `🐞 ${b.kind === "report" ? "Report" : "Erreur"} — ${title}${b.path ? ` (page ${b.path})` : ""}`;
    const notes = [b.comment ? `Note : ${b.comment}` : "", `Occurrences : ${b.count}`, "Source : agent de triage bugs"].filter(Boolean).join("\n");
    if (!dry) {
      await db.prepare(
        "INSERT INTO agent_actions (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, notes) " +
        "VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET priority=excluded.priority, action=excluded.action, status='backlog', updated_at=unixepoch()"
      ).bind(bid, "webmaster", "Webmaster", "🔧", "bug", action, sev, "1h", "backlog", notes).run();
      await db.prepare("UPDATE client_errors SET status='backlog', severity=?, backlog_id=? WHERE id=?").bind(sev, bid, b.id).run();
    }
    created++;
    createdItems.push({ sev, title, count: b.count });
  }

  // 4) Résumé pour le digest
  const order = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
  createdItems.sort((a, b) => (order[a.sev] - order[b.sev]) || (b.count - a.count));
  const top = createdItems.slice(0, 6).map(i => `  • [${i.sev}] ${i.title}${i.count > 1 ? ` (×${i.count})` : ""}`).join("\n");
  const crit = createdItems.filter(i => i.sev === "critique").length;
  const summary =
    `🐞 Triage bugs — ${bugs.length} analysé${bugs.length > 1 ? "s" : ""} : ` +
    `${created} → backlog, ${ignored} ignoré${ignored > 1 ? "s" : ""}${crit ? `, ⚠️ ${crit} CRITIQUE${crit > 1 ? "S" : ""}` : ""}.` +
    (top ? `\n${top}` : "");

  return json({ ok: true, dry, analyzed: bugs.length, created, ignored, kept, llm_provider: llm.provider, summary });
}
