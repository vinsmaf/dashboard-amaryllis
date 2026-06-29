// Cloudflare Pages Function — /api/qa-run
// Trigger manuel d'une session QA.
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
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";

  const batches = [];
  if (type === "weekly"  || type === "all") batches.push({ agents: QA_WEEKLY,  label: "hebdo"   });
  if (type === "monthly" || type === "all") batches.push({ agents: QA_MONTHLY, label: "mensuel" });
  if (!batches.length) return json({ error: "type invalide (weekly|monthly|all)" }, 400);

  const now = Math.floor(Date.now() / 1000);
  const dateStr = new Date(now * 1000).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const results = [];

  for (const { agents, label } of batches) {
    const brief = `SESSION QA MANUELLE — ${label.toUpperCase()} — ${dateStr}
Site : https://villamaryllis.com — 7 biens (Amaryllis, Zandoli, Géko, Mabouya, Schœlcher, Nogent, Iguana-bail)

MISSION selon TON domaine spécifique :
— Tester les flux critiques, détecter les régressions récentes.
— Vérifier les endpoints, formulaires, emails, calendriers, paiements.
— Identifier les anomalies silencieuses (rien ne crash mais quelque chose dérive).

SORTIE ATTENDUE : liste de findings (titre · sévérité critique/moyen/faible · action concrète).
Ne rapporter QUE ce qui est cassé, dégradé ou à risque.`;

    let okCount = 0, errorCount = 0;
    try {
      const res = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agents, brief, source: `qa_${label}_manual` }),
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
      fetch(`https://ntfy.sh/${topic}`, {
        method: "POST",
        headers: { Title: `🔍 QA ${label} manuelle`, Priority: "default", Tags: "mag" },
        body: `${dateStr}\n${okCount}/${agents.length} agents OK → Admin > Agents`,
      }).catch(() => {});
    }

    results.push({ label, agents: agents.length, ok_count: okCount, error_count: errorCount });
  }

  return json({ ok: true, results });
}
