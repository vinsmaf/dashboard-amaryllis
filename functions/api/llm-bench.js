// functions/api/llm-bench.js — reco agent Prompt Eng. (2026-07-18) : bench cost/qualité
// Groq vs Cerebras vs Mistral sur 5 tâches types (extraction, résumé, réseaux sociaux, tri
// lead, calcul pricing — logique pure src/utils/llmBenchTasks.js). Chaque tâche a un
// vérificateur déterministe (pas de LLM-juge). Réutilise `logLLMTrace` déjà en place dans
// _llm.js (table `llm_traces`) pour le coût/tokens réels, plutôt que ré-estimer.
//
// GET (Bearer admin) → lance le bench sur le tier `?tier=` (défaut medium, celui utilisé
// par la majorité des agents). Outil ponctuel, pas de cron.

import { verifyBearer } from "./_adminauth.js";
import { callLLM } from "./_llm.js";
import { BENCH_TASKS } from "../../src/utils/llmBenchTasks.js";

const PROVIDERS = ["groq", "cerebras", "mistral"];

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequestGet({ request, env }) {
  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  const url = new URL(request.url);
  const tier = url.searchParams.get("tier") || "medium";
  const startTs = Math.floor(Date.now() / 1000) - 1; // marge 1s pour ne pas rater le premier trace

  const results = [];
  for (const task of BENCH_TASKS) {
    for (const provider of PROVIDERS) {
      const t0 = Date.now();
      const r = await callLLM(env, {
        provider,
        cascade: [provider], // isolation : pas de fallback vers un autre provider
        tier,
        max_tokens: 200,
        temperature: 0,
        timeoutMs: 15000,
        logSource: "llm-bench",
        messages: [{ role: "user", content: task.prompt }],
      });
      results.push({
        task: task.key,
        label: task.label,
        provider,
        model: r.model,
        ok: r.ok,
        passed: r.ok ? task.check(r.text) : false,
        latencyMs: Date.now() - t0,
        preview: r.ok ? String(r.text || "").trim().slice(0, 120) : undefined,
        error: r.ok ? undefined : (r.errors?.[r.errors.length - 1]?.error || "échec inconnu"),
      });
    }
  }

  // Coût/tokens réels — logLLMTrace (dans callLLM) les a déjà écrits en D1 pour ce run.
  let traces = [];
  try {
    const { results: rows } = await env.revenue_manager.prepare(
      "SELECT provider, model, input_tokens, output_tokens, cost_usd, latency_ms, ok FROM llm_traces WHERE source='llm-bench' AND created_at >= ?"
    ).bind(startTs).all();
    traces = rows || [];
  } catch { /* si la table n'existe pas encore, byProvider retombe sur les résultats bruts */ }

  const byProvider = {};
  for (const p of PROVIDERS) {
    const rows = results.filter((x) => x.provider === p);
    const pTraces = traces.filter((t) => t.provider === p);
    const passed = rows.filter((x) => x.passed).length;
    byProvider[p] = {
      tasksPassed: passed,
      tasksTotal: rows.length,
      successRatePct: Math.round((passed / rows.length) * 100),
      avgLatencyMs: Math.round(rows.reduce((s, x) => s + x.latencyMs, 0) / rows.length),
      totalCostUsd: Math.round(pTraces.reduce((s, t) => s + (t.cost_usd || 0), 0) * 100000) / 100000,
      avgOutputTokens: pTraces.length ? Math.round(pTraces.reduce((s, t) => s + (t.output_tokens || 0), 0) / pTraces.length) : null,
    };
  }

  return json({ ok: true, tier, byProvider, results });
}
