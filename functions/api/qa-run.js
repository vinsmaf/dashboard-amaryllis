// Cloudflare Pages Function — /api/qa-run
// Déclenche manuellement une session QA.
// ?type=weekly (défaut) | monthly | all
// Auth : Bearer CLAUDE_SECRET ou ?secret=POSTSTAY_SECRET

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const QA_WEEKLY  = ["qa-tester", "webmaster", "data-analyst", "prompt-engineer", "crm-manager"];
const QA_MONTHLY = ["architecte-reseau", "seo-local", "developpeur-multimedia"];

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  const type = url.searchParams.get("type") || "weekly";
  const db = env.revenue_manager;
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const now = Math.floor(Date.now() / 1000);

  const batches = [];
  if (type === "weekly" || type === "all")  batches.push({ agents: QA_WEEKLY,  kvKey: "qa_session:weekly",  label: "hebdo" });
  if (type === "monthly" || type === "all") batches.push({ agents: QA_MONTHLY, kvKey: "qa_session:monthly", label: "mensuel" });
  if (!batches.length) return json({ error: "type invalide (weekly|monthly|all)" }, 400);

  const results = [];

  for (const batch of batches) {
    const { agents, kvKey, label } = batch;
    const defaultWindow = label === "mensuel" ? 30 * 86400 : 7 * 86400;

    let lastSession = { ts: now - defaultWindow };
    try {
      const raw = await env.ICAL_STORE.get(kvKey, { type: "json" });
      if (raw?.ts) lastSession = raw;
    } catch { /* première session */ }

    const sinceLast = lastSession.ts;
    let newActions = 0, resolvedActions = 0;
    try {
      const [nr, dr] = await Promise.all([
        db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE created_at > ? AND status NOT IN ('done','ignored')").bind(sinceLast).first(),
        db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE updated_at > ? AND status IN ('done','ignored')").bind(sinceLast).first(),
      ]);
      newActions = nr?.n ?? 0;
      resolvedActions = dr?.n ?? 0;
    } catch { /* D1 error */ }

    const dateStr = new Date(now * 1000).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const lastDateStr = new Date(sinceLast * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

    const brief = `SESSION QA ${label.toUpperCase()} — ${dateStr}
Site : https://villamaryllis.com — 7 biens (Amaryllis, Zandoli, Géko, Mabouya, Schœlcher, Nogent, Iguana-bail)
Dernière QA : ${lastDateStr} | Delta : +${newActions} actions créées, ${resolvedActions} résolues depuis.

MISSION selon TON domaine spécifique :
— Tester les flux critiques, détecter les régressions vs la dernière session.
— Vérifier les endpoints, formulaires, emails, calendriers, paiements.
— Identifier les anomalies silencieuses (rien ne crash mais quelque chose dérive).

SORTIE ATTENDUE : liste de findings (titre · sévérité critique/moyen/faible · action concrète).
Ne rapporter QUE ce qui est cassé, dégradé ou à risque.`;

    let okCount = 0, errorCount = 0;
    try {
      const res = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agents, brief, source: `qa_${label}` }),
      });
      const data = await res.json().catch(() => ({}));
      okCount = data.ok_count ?? 0;
      errorCount = data.error_count ?? 0;
    } catch (e) {
      results.push({ label, error: e.message });
      continue;
    }

    const topic = env.NTFY_TOPIC;
    if (topic) {
      await fetch(`https://ntfy.sh/${topic}`, {
        method: "POST",
        headers: { Title: `🔍 QA ${label} manuelle`, Priority: "default", Tags: "mag" },
        body: `${dateStr}\n+${newActions} actions · ${resolvedActions} résolues depuis ${lastDateStr}\n${okCount}/${agents.length} agents OK`,
      }).catch(() => {});
    }

    await env.ICAL_STORE.put(kvKey, JSON.stringify({
      ts: now, agents, new_actions: newActions, resolved: resolvedActions,
      summary: `${okCount}/${agents.length} agents · +${newActions} delta`,
    })).catch(() => {});

    results.push({ label, agents: agents.length, ok_count: okCount, error_count: errorCount, delta: { new_actions: newActions, resolved: resolvedActions }, last_session: lastDateStr });
  }

  return json({ ok: true, results });
}
