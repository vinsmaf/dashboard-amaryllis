// ─────────────────────────────────────────────────────────────────────────────
// Abstraction multi-provider pour les agents Amaryllis
// Providers : Groq, Cloudflare Workers AI, Mistral, Cerebras
// Cascade automatique sur erreur (rate limit, model decommissioned, etc.)
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDERS = {
  // Groq — actuel, déjà configuré (GROQ_API_KEY)
  groq: {
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    needsKey: "GROQ_API_KEY",
    headers: (key) => ({ "Content-Type": "application/json", "Authorization": `Bearer ${key}` }),
    body: (model, messages, opts) => JSON.stringify({
      model, messages,
      max_tokens: opts.max_tokens || 2048,
      temperature: opts.temperature ?? 0.3,
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
  },

  // Cloudflare Workers AI — binding env.AI ou REST API
  cloudflare: {
    endpoint: (env, model) => `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/${model}`,
    needsKey: "CF_AI_TOKEN",
    headers: (key) => ({ "Content-Type": "application/json", "Authorization": `Bearer ${key}` }),
    body: (model, messages, opts) => JSON.stringify({
      messages,
      max_tokens: opts.max_tokens || 2048,
      temperature: opts.temperature ?? 0.3,
    }),
    parseResponse: (data) =>
      data.result?.choices?.[0]?.message?.content ||
      data.result?.response ||
      data.response || "",
  },

  // Mistral La Plateforme — modèles français-friendly
  mistral: {
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    needsKey: "MISTRAL_API_KEY",
    headers: (key) => ({ "Content-Type": "application/json", "Authorization": `Bearer ${key}` }),
    body: (model, messages, opts) => JSON.stringify({
      model, messages,
      max_tokens: opts.max_tokens || 2048,
      temperature: opts.temperature ?? 0.3,
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
  },

  // Cerebras — ultra-rapide
  cerebras: {
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    needsKey: "CEREBRAS_API_KEY",
    headers: (key) => ({ "Content-Type": "application/json", "Authorization": `Bearer ${key}` }),
    body: (model, messages, opts) => JSON.stringify({
      model, messages,
      max_tokens: opts.max_tokens || 2048,
      temperature: opts.temperature ?? 0.3,
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
  },

  // Google Gemini — endpoint OpenAI-compatible. Prêt-à-activer : poser GEMINI_API_KEY.
  // (clé gratuite via Google AI Studio — quota généreux, contexte ~1M, multimodal)
  gemini: {
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    needsKey: "GEMINI_API_KEY",
    headers: (key) => ({ "Content-Type": "application/json", "Authorization": `Bearer ${key}` }),
    body: (model, messages, opts) => JSON.stringify({
      model, messages,
      max_tokens: opts.max_tokens || 2048,
      temperature: opts.temperature ?? 0.3,
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
  },
};

// Modèles par provider — actifs vérifiés mai 2026
export const MODELS = {
  groq: {
    fast:    "llama-3.1-8b-instant",
    medium:  "meta-llama/llama-4-scout-17b-16e-instruct",
    smart:   "llama-3.3-70b-versatile",
  },
  cloudflare: {
    fast:    "@cf/meta/llama-3.1-8b-instruct-fast",
    medium:  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    smart:   "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  },
  mistral: {
    fast:    "mistral-small-latest",
    medium:  "mistral-medium-latest",
    smart:   "mistral-large-latest",
  },
  cerebras: {
    // ⚠️ Compte Cerebras : seuls gpt-oss-120b et zai-glm-4.7 sont accessibles
    // (anciens IDs llama-3.x supprimés → 404). Vérifié via /api/llm-ping?list=1 le 2026-05-30.
    fast:    "gpt-oss-120b",
    medium:  "gpt-oss-120b",
    smart:   "zai-glm-4.7",
  },
  gemini: {
    // Activés seulement si GEMINI_API_KEY posée ; l'agent AI-Ops ajuste les IDs réels.
    fast:    "gemini-2.0-flash-lite",
    medium:  "gemini-2.0-flash",
    smart:   "gemini-2.5-flash",
  },
};

// Cascade par défaut : groq → cloudflare → mistral → cerebras → gemini(si clé)
const DEFAULT_CASCADE = ["groq", "cloudflare", "mistral", "cerebras", "gemini"];

// ── Override dynamique piloté par l'agent AI-Ops (table D1 ai_ops, clé 'plan') ──
// Permet de BASCULER de modèle / désactiver un provider défaillant SANS redéploiement.
// Cache module-level 10 min ; fallback transparent sur MODELS statiques si pas de plan.
let _planCache = { at: 0, models: null, disabled: null };
async function activePlan(env) {
  const now = Date.now();
  if (_planCache.at && now - _planCache.at < 600000) return _planCache;
  try {
    const row = await env.revenue_manager?.prepare("SELECT v FROM ai_ops WHERE k='plan'").first();
    const plan = row?.v ? JSON.parse(row.v) : null;
    _planCache = { at: now, models: plan?.models || null, disabled: new Set(plan?.disabled || []) };
  } catch { _planCache = { at: now, models: null, disabled: new Set() }; }
  return _planCache;
}

/**
 * Appel LLM résilient avec cascade automatique.
 * @param {object} env - Cloudflare env (avec les secrets)
 * @param {object} opts - { provider?, tier, messages, max_tokens?, temperature?, cascade?, timeoutMs? }
 * @returns { ok, text, provider, model, attempts, errors? }
 */
export async function callLLM(env, opts) {
  const tier        = opts.tier || "medium";
  const cascade     = opts.cascade || DEFAULT_CASCADE;
  const startWith   = opts.provider || cascade[0];
  const messages    = opts.messages;
  const timeoutMs   = opts.timeoutMs || 22000;

  // Ordonne la cascade en commençant par startWith
  const baseOrder = [startWith, ...cascade.filter(p => p !== startWith)];
  // Plan AI-Ops : retire les providers désactivés (sauf si ça vide tout → garde la base)
  const plan = await activePlan(env);
  const liveOrder = baseOrder.filter(p => !plan.disabled?.has?.(p));
  const order = liveOrder.length ? liveOrder : baseOrder;
  const errors = [];

  for (const providerId of order) {
    const provider = PROVIDERS[providerId];
    if (!provider) { errors.push({ provider: providerId, error: "unknown provider" }); continue; }

    const apiKey = env[provider.needsKey];
    if (!apiKey) { errors.push({ provider: providerId, error: `missing ${provider.needsKey}` }); continue; }

    // Modèle : opts.model (usage isolé) > plan AI-Ops (D1) > MODELS statique
    const model = opts.model || plan.models?.[providerId]?.[tier] || MODELS[providerId]?.[tier];
    if (!model) { errors.push({ provider: providerId, error: `no model for tier=${tier}` }); continue; }

    const endpoint = typeof provider.endpoint === "function"
      ? provider.endpoint(env, model)
      : provider.endpoint;

    // Retry sur 429/rate limit (max 2 fois par provider, puis cascade)
    let res, attempt = 0;
    while (attempt < 2) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers: provider.headers(apiKey),
          body: provider.body(model, messages, opts),
          signal: ctrl.signal,
        });
      } catch (e) {
        clearTimeout(timer);
        errors.push({ provider: providerId, model, error: e.name === "AbortError" ? "timeout" : e.message });
        break; // network error → cascade
      }
      clearTimeout(timer);

      if (res.status === 200) {
        try {
          const data = await res.json();
          let text = provider.parseResponse(data);
          // Sécurise toujours en string non-vide
          if (typeof text !== "string") text = text ? JSON.stringify(text) : "";
          if (text && text.trim()) {
            // prompt-004 — log opt-in des sorties LLM en D1 (analyse a posteriori).
            if (opts.logSource) {
              await logLLMOutput(env, { source: opts.logSource, tier, provider: providerId, model, messages, text, attempts: attempt + 1 });
            }
            return { ok: true, text, provider: providerId, model, attempts: attempt + 1, errors: errors.length ? errors : undefined };
          }
          errors.push({ provider: providerId, model, error: "empty response" });
        } catch (e) {
          errors.push({ provider: providerId, model, error: `parse: ${e.message}` });
        }
        break;
      }

      // Retry sur 429
      if (res.status === 429) {
        attempt++;
        const txt = await res.clone().text().catch(() => "");
        errors.push({ provider: providerId, model, error: `429 try ${attempt}: ${txt.slice(0, 80)}` });
        await new Promise(r => setTimeout(r, 1500 * attempt));
        continue;
      }

      // 400 décommissionné ou autre → cascade direct
      const txt = await res.text().catch(() => "");
      errors.push({ provider: providerId, model, error: `${res.status}: ${txt.slice(0, 120)}` });
      break;
    }
  }

  return { ok: false, text: "", provider: null, model: null, attempts: 0, errors };
}

// prompt-004 — journalise une sortie LLM en D1 (table llm_outputs).
// Opt-in via opts.logSource. Ne casse JAMAIS l'appel LLM (try/catch, fail-silent).
async function logLLMOutput(env, { source, tier, provider, model, messages, text, attempts }) {
  const db = env.revenue_manager;
  if (!db) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS llm_outputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT, tier TEXT, provider TEXT, model TEXT,
      prompt TEXT, output TEXT, output_len INTEGER, attempts INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`).run();
    const lastUser = (messages || []).filter(m => m.role === "user").pop();
    const prompt = (lastUser?.content || "").slice(0, 2000);
    const output = String(text || "").slice(0, 4000);
    await db.prepare(
      "INSERT INTO llm_outputs (source, tier, provider, model, prompt, output, output_len, attempts) VALUES (?,?,?,?,?,?,?,?)"
    ).bind(source, tier || null, provider || null, model || null, prompt, output, String(text || "").length, attempts || 1).run();
    // Purge légère : garde les 2000 dernières lignes (probabiliste pour éviter le surcoût)
    if (Math.random() < 0.05) {
      await db.prepare("DELETE FROM llm_outputs WHERE id < (SELECT MAX(id) - 2000 FROM llm_outputs)").run();
    }
  } catch (e) {
    console.error("[llm-log] erreur D1:", e.message);
  }
}
