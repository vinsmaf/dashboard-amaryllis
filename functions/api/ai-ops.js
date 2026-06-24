// Cloudflare Pages Function — /api/ai-ops
// AGENT AI-OPS : gère en continu les sources d'IA GRATUITES des agents Amaryllis.
//   - Auto-DÉCOUVRE les modèles réellement dispo par provider (/v1/models)
//   - CHOISIT le meilleur modèle par provider×tier (classement) — détecte morts/nouveaux
//   - TESTE la santé (succès/latence) de chaque modèle choisi, en isolation
//   - ÉCRIT un "plan" en D1 (ai_ops) que _llm.js applique EN LIVE (bascule sans redéploiement)
//   - DÉSACTIVE les providers totalement KO ; se RAFRAÎCHIT seul si > 20 h (sans intervention)
//   - Prêt à ACCUEILLIR de nouveaux providers (ex. Gemini : poser GEMINI_API_KEY)
//
// GET  /api/ai-ops?secret=POSTSTAY_SECRET            → état (plan + santé + découverte), refresh si périmé
// POST /api/ai-ops?secret=... {action:'refresh'|'reset'}
// Cron conseillé : GET .../api/ai-ops?secret=... 1×/jour.

import { callLLM, MODELS } from "./_llm.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const TIERS = ["fast", "medium", "smart"];
const KEY_OF = {
  groq: "GROQ_API_KEY", cloudflare: "CF_AI_TOKEN", mistral: "MISTRAL_API_KEY",
  cerebras: "CEREBRAS_API_KEY", gemini: "GEMINI_API_KEY",
};
const MODELS_URL = {
  groq:     "https://api.groq.com/openai/v1/models",
  cerebras: "https://api.cerebras.ai/v1/models",
  mistral:  "https://api.mistral.ai/v1/models",
  gemini:   "https://generativelanguage.googleapis.com/v1beta/openai/models",
};
// Cloudflare AI : pas de liste OpenAI-compatible simple → modèles curés (stables).
const STATIC_CF = {
  fast:   "@cf/meta/llama-3.1-8b-instruct-fast",
  medium: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  smart:  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
};
// Classement de préférence par tier (sous-chaînes, meilleur → moins bon).
const RANK = {
  // Ordre : meilleur en tête. Substring match → le plus spécifique d'abord.
  fast:   ["llama-3.1-8b-instant", "gemini-2.0-flash-lite", "llama-3.1-8b", "gpt-oss-20b", "ministral-8b-2512", "ministral-8b-latest", "mistral-small-2506", "mistral-small-latest", "llama-3.2-3b", "qwen3-32b"],
  medium: ["llama-3.3-70b-versatile", "gemini-2.0-flash", "mistral-medium-2604", "mistral-medium-3.5", "mistral-medium-latest", "qwen3-32b", "gpt-oss-20b", "llama-3.3-70b", "gpt-oss-120b", "mistral-small-2506", "mistral-small-latest"],
  smart:  ["gpt-oss-120b", "gemini-2.5-flash", "qwen3-32b", "llama-3.3-70b-versatile", "llama-3.3-70b", "mistral-large-2512", "mistral-large-latest", "magistral-medium-2509", "magistral-medium-latest", "zai-glm-4.7"],
};

// Exclut les modèles non conversationnels (embeddings, audio, ocr, modération, garde…)
const isChat = (id) => !/embed|ocr|tts|whisper|voxtral|moderation|guard|transcribe|realtime|rerank|prompt-guard|vision-preview/i.test(id);

function chooseModel(avail, tier) {
  const chat = (avail || []).filter(isChat);
  for (const s of RANK[tier]) { const m = chat.find(id => id.includes(s)); if (m) return m; }
  return null;
}

// ── D1 store (table ai_ops) ─────────────────────────────────────────────────
async function ensure(env) {
  await env.revenue_manager.prepare(
    "CREATE TABLE IF NOT EXISTS ai_ops (k TEXT PRIMARY KEY, v TEXT, updated_at INTEGER)"
  ).run();
}
async function getJSON(env, k) {
  try { const r = await env.revenue_manager.prepare("SELECT v FROM ai_ops WHERE k=?").bind(k).first(); return r?.v ? JSON.parse(r.v) : null; }
  catch { return null; }
}
async function setJSON(env, k, v) {
  await env.revenue_manager.prepare(
    "INSERT INTO ai_ops (k,v,updated_at) VALUES (?,?,unixepoch()) ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at"
  ).bind(k, JSON.stringify(v)).run();
}

// ── Découverte des modèles dispo par provider ───────────────────────────────
async function discover(env) {
  const out = {};
  for (const [p, url] of Object.entries(MODELS_URL)) {
    const key = env[KEY_OF[p]];
    if (!key) { out[p] = { skip: "no key" }; continue; }
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      const d = await r.json();
      out[p] = (d.data || []).map(m => m.id).sort();
    } catch (e) { out[p] = { error: e.message }; }
  }
  out.cloudflare = Object.values(STATIC_CF);
  return out;
}

// ── Construit le plan : choix modèles + test santé + persistance ────────────
async function buildPlan(env) {
  const discovery = await discover(env);
  const models = {};
  for (const p of Object.keys(KEY_OF)) {
    if (!env[KEY_OF[p]]) continue;                       // pas de clé → provider ignoré
    if (p === "cloudflare") { models[p] = { ...STATIC_CF }; continue; }
    const avail = Array.isArray(discovery[p]) ? discovery[p] : [];
    const pick = {};
    for (const tier of TIERS) pick[tier] = chooseModel(avail, tier) || MODELS[p]?.[tier];
    models[p] = pick;
  }

  // Test santé de chaque modèle choisi (en isolation, budget suffisant pour modèles à raisonnement)
  const checks = [];
  for (const p of Object.keys(models)) for (const tier of TIERS) {
    const model = models[p][tier];
    if (!model) continue;
    checks.push((async () => {
      const t0 = Date.now();
      const r = await callLLM(env, {
        provider: p, cascade: [p], tier, model,
        max_tokens: 200, temperature: 0, timeoutMs: 12000,
        messages: [{ role: "user", content: "Réponds uniquement par le mot: OK" }],
      });
      return { p, tier, model, ok: r.ok, ms: Date.now() - t0, error: r.ok ? undefined : (r.errors?.slice(-1)[0]?.error || "échec") };
    })());
  }
  const results = await Promise.all(checks);
  const health = {};
  for (const r of results) { (health[r.p] ||= {})[r.tier] = { ok: r.ok, ms: r.ms, model: r.model, error: r.error }; }

  // Un provider dont TOUS les tiers échouent est désactivé (skip cascade)
  const disabled = Object.keys(health).filter(p => TIERS.every(t => health[p][t] && !health[p][t].ok));

  const plan = {
    models, disabled, health,
    discovery: Object.fromEntries(Object.entries(discovery).map(([k, v]) => [k, Array.isArray(v) ? v.length : v])),
    ts: Date.now(),
  };
  await setJSON(env, "plan", plan);
  await setJSON(env, "discovery", { ...discovery, ts: Date.now() });
  return plan;
}

export async function maybeRefresh(env) {
  const plan = await getJSON(env, "plan");
  if (!plan || (Date.now() - (plan.ts || 0)) > 20 * 3600 * 1000) return await buildPlan(env);
  return plan;
}

function authed(env, url) {
  return env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!authed(env, url)) return json({ error: "Non autorisé" }, 401);
  if (!env.revenue_manager) return json({ error: "D1 indisponible" }, 503);
  await ensure(env);
  const plan = await maybeRefresh(env);
  const okCount = Object.values(plan.health || {}).reduce((s, t) => s + Object.values(t).filter(x => x.ok).length, 0);
  const total = Object.values(plan.health || {}).reduce((s, t) => s + Object.keys(t).length, 0);
  return json({
    ok: true, okCount, total,
    activeProviders: Object.keys(plan.models || {}).filter(p => !plan.disabled?.includes(p)),
    disabled: plan.disabled,
    age_h: Math.round((Date.now() - plan.ts) / 36e5 * 10) / 10,
    plan,
  });
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (!authed(env, url)) return json({ error: "Non autorisé" }, 401);
  if (!env.revenue_manager) return json({ error: "D1 indisponible" }, 503);
  await ensure(env);
  const body = await request.json().catch(() => ({}));
  if (body.action === "refresh") return json({ ok: true, plan: await buildPlan(env) });
  if (body.action === "reset") {
    await env.revenue_manager.prepare("DELETE FROM ai_ops WHERE k IN ('plan','discovery')").run();
    return json({ ok: true, reset: true });
  }
  return json({ error: "action inconnue (refresh | reset)" }, 400);
}
