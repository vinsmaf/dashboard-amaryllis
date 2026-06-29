// Cloudflare Pages Function — GET /api/llm-ping
// Health-check des fournisseurs LLM (Groq / Cloudflare AI / Mistral / Cerebras).
// Teste CHAQUE provider EN ISOLATION (cascade forcée à [provider]) pour révéler
// les échecs silencieux normalement masqués par le fallback. Sans effet de bord.
//
// Auth : ?secret=<POSTSTAY_SECRET>
// Optionnel : ?tier=fast|medium|smart pour ne tester qu'un tier.

import { callLLM } from "./_llm.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const PROVIDERS = ["groq", "cloudflare", "mistral", "cerebras", "deepseek", "openrouter"];
const TIERS = ["fast", "medium", "smart"];

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  // Mode liste : ?list=1 → renvoie les modèles réellement disponibles par provider (OpenAI-compatible /v1/models)
  if (url.searchParams.get("list")) {
    const sources = {
      groq:       { url: "https://api.groq.com/openai/v1/models",      key: env.GROQ_API_KEY },
      cerebras:   { url: "https://api.cerebras.ai/v1/models",          key: env.CEREBRAS_API_KEY },
      mistral:    { url: "https://api.mistral.ai/v1/models",           key: env.MISTRAL_API_KEY },
      deepseek:   { url: "https://api.deepseek.com/v1/models",         key: env.DEEPSEEK_API_KEY },
      openrouter: { url: "https://openrouter.ai/api/v1/models",        key: env.OPENROUTER_API_KEY },
    };
    const out = {};
    for (const [name, s] of Object.entries(sources)) {
      try {
        const r = await fetch(s.url, { headers: { Authorization: `Bearer ${s.key}` } });
        const d = await r.json();
        out[name] = (d.data || []).map(m => m.id).sort();
      } catch (e) { out[name] = { error: e.message }; }
    }
    return json(out);
  }

  const tiers = url.searchParams.get("tier") ? [url.searchParams.get("tier")] : TIERS;

  const results = [];
  for (const provider of PROVIDERS) {
    for (const tier of tiers) {
      const t0 = Date.now();
      const r = await callLLM(env, {
        provider,
        cascade: [provider],            // isolation : pas de fallback
        tier,
        max_tokens: 300,
        temperature: 0,
        timeoutMs: 12000,
        messages: [{ role: "user", content: "Réponds uniquement par le mot: OK" }],
      });
      results.push({
        provider, tier,
        ok: r.ok,
        model: r.model,
        ms: Date.now() - t0,
        text: r.ok ? String(r.text || "").trim().slice(0, 40) : undefined,
        error: r.ok ? undefined : (r.errors?.[r.errors.length - 1]?.error || "échec inconnu"),
      });
    }
  }

  const okCount = results.filter(x => x.ok).length;
  const byProvider = {};
  for (const p of PROVIDERS) {
    const rows = results.filter(x => x.provider === p);
    byProvider[p] = {
      ok: rows.filter(x => x.ok).length,
      total: rows.length,
      avgMs: Math.round(rows.filter(x => x.ok).reduce((s, x) => s + x.ms, 0) / Math.max(1, rows.filter(x => x.ok).length)),
    };
  }
  return json({ ok: true, okCount, total: results.length, byProvider, results });
}
