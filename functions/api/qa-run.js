// Cloudflare Pages Function — /api/qa-run
// Déclenche manuellement la session QA bi-hebdomadaire.
// GET/POST — auth Bearer CLAUDE_SECRET ou ?secret=POSTSTAY_SECRET

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const QA_AGENTS = [
  "qa-tester",
  "architecte-reseau",
  "webmaster",
  "data-analyst",
  "seo-local",
  "developpeur-multimedia",
  "prompt-engineer",
  "crm-manager",
];

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const now = Math.floor(Date.now() / 1000);

  // Charger dernière session depuis KV
  let lastSession = { ts: now - 14 * 86400, summary: "première session" };
  try {
    const raw = await env.ICAL_STORE.get("qa_session:last", { type: "json" });
    if (raw?.ts) lastSession = raw;
  } catch { /* première session */ }

  const sinceLast = lastSession.ts;

  // Delta agent_actions
  let newActions = 0, resolvedActions = 0;
  try {
    const [nr, dr] = await Promise.all([
      db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE created_at > ? AND status NOT IN ('done','ignored')").bind(sinceLast).first(),
      db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE updated_at > ? AND status IN ('done','ignored')").bind(sinceLast).first(),
    ]);
    newActions = nr?.n ?? 0;
    resolvedActions = dr?.n ?? 0;
  } catch { /* D1 error */ }

  const dateStr = new Date(now * 1000).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const lastDateStr = new Date(sinceLast * 1000).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long",
  });

  const brief = `SESSION QA BI-HEBDOMADAIRE — ${dateStr}
Site : https://villamaryllis.com — 7 biens (Amaryllis, Zandoli, Géko, Mabouya, Schœlcher, Nogent, Iguana-bail)
Dernière QA : ${lastDateStr} | Delta : +${newActions} actions créées, ${resolvedActions} résolues depuis.

MISSION selon TON domaine spécifique :
— Tester les flux critiques, détecter les régressions vs il y a 14 jours.
— Vérifier les endpoints, formulaires, emails, calendriers, paiements.
— Identifier les anomalies silencieuses (rien ne crash mais quelque chose dérive).

SORTIE ATTENDUE : liste de findings (titre · sévérité critique/moyen/faible · action concrète).
Ne rapporter QUE ce qui est cassé, dégradé ou à risque.`;

  // Lancer les agents QA
  let okCount = 0, errorCount = 0;
  try {
    const res = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agents: QA_AGENTS, brief, source: "qa_session" }),
    });
    const data = await res.json().catch(() => ({}));
    okCount = data.ok_count ?? 0;
    errorCount = data.error_count ?? 0;
  } catch (e) {
    return json({ error: "agents-run failed: " + e.message }, 500);
  }

  // Notif ntfy
  const topic = env.NTFY_TOPIC;
  if (topic) {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: { Title: "🔍 Session QA manuelle", Priority: "default", Tags: "mag" },
      body: `${dateStr}\n+${newActions} nouvelles actions · ${resolvedActions} résolues depuis le ${lastDateStr}\n${okCount}/${QA_AGENTS.length} agents OK`,
    }).catch(() => {});
  }

  // Sauvegarder session
  await env.ICAL_STORE.put("qa_session:last", JSON.stringify({
    ts: now,
    agents: QA_AGENTS,
    new_actions: newActions,
    resolved: resolvedActions,
    summary: `${okCount}/${QA_AGENTS.length} agents · +${newActions} delta`,
  })).catch(() => {});

  return json({
    ok: true,
    agents: QA_AGENTS.length,
    ok_count: okCount,
    error_count: errorCount,
    delta: { new_actions: newActions, resolved: resolvedActions },
    last_session: lastDateStr,
  });
}
