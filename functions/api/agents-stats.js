// Cloudflare Pages Function — GET /api/agents-stats
// #7 Observabilité agents : un seul appel = vue d'ensemble pour piloter l'équipe IA.
//   - backlog par statut + par agent (qui a du grain à moudre)
//   - impacts mesurés récents (boucle de feedback action_outcomes)
//   - usage LLM réel 7j (provider/modèle/latence/tentatives) depuis llm_outputs
//   - plan modèles actif (AI-Ops) + santé
//   - score qualité moyen récent (llm_evals, alimenté par /api/agents-eval)
//
// Auth : ?secret=POSTSTAY_SECRET  OU Bearer admin (token de session)

import { verifyBearer } from "./_adminauth.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const rows = async (db, sql, ...b) => { try { const r = await db.prepare(sql).bind(...b).all(); return r.results || []; } catch { return []; } };
const one = async (db, sql, ...b) => { try { return await db.prepare(sql).bind(...b).first(); } catch { return null; } };

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: bearerOk } = await verifyBearer(request, env);
  if (!secretOk && !bearerOk) {
    return json({ error: "Non autorisé" }, 401);
  }
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  const weekAgo = "unixepoch() - 604800";

  const [byStatus, byAgent, outcomes, llmUsage, evals, plan] = await Promise.all([
    rows(db, "SELECT status, COUNT(*) n FROM agent_actions GROUP BY status ORDER BY n DESC"),
    rows(db, "SELECT agent, agent_label, COUNT(*) n FROM agent_actions WHERE status IN ('a-planifier','backlog') GROUP BY agent ORDER BY n DESC LIMIT 25"),
    rows(db, "SELECT agent, impact_label, COUNT(*) n FROM action_outcomes WHERE measured_at IS NOT NULL GROUP BY agent, impact_label ORDER BY n DESC LIMIT 20"),
    rows(db, `SELECT provider, model, COUNT(*) calls, ROUND(AVG(output_len)) avg_len, ROUND(AVG(attempts),2) avg_try, MAX(datetime(created_at,'unixepoch')) last
              FROM llm_outputs WHERE created_at > ${weekAgo} GROUP BY provider, model ORDER BY calls DESC`),
    rows(db, `SELECT source, ROUND(AVG(global),1) avg_global, COUNT(*) n FROM llm_evals WHERE created_at > ${weekAgo} GROUP BY source ORDER BY avg_global ASC LIMIT 25`),
    one(db, "SELECT v FROM ai_ops WHERE k='plan'"),
  ]);

  let modelPlan = null;
  try { const p = plan?.v ? JSON.parse(plan.v) : null; if (p) modelPlan = { models: p.models, disabled: p.disabled, age_h: Math.round((Date.now() - (p.ts || 0)) / 36e5 * 10) / 10, healthOk: Object.values(p.health || {}).reduce((s, t) => s + Object.values(t).filter(x => x.ok).length, 0) }; } catch {}

  return json({
    ok: true,
    generated_at: new Date().toISOString().slice(0, 16).replace("T", " "),
    backlog: { par_statut: byStatus, par_agent_ouvert: byAgent },
    feedback_impacts: outcomes,
    llm_usage_7j: llmUsage,
    qualite_7j: evals,
    modeles_actifs: modelPlan,
  });
}
