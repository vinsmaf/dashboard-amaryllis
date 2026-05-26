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
    fast:    "llama-3.1-8b",
    medium:  "llama-3.3-70b",
    smart:   "llama-3.3-70b",
  },
};

// Cascade par défaut : groq → cloudflare → mistral → cerebras
const DEFAULT_CASCADE = ["groq", "cloudflare", "mistral", "cerebras"];

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
  const order = [startWith, ...cascade.filter(p => p !== startWith)];
  const errors = [];

  for (const providerId of order) {
    const provider = PROVIDERS[providerId];
    if (!provider) { errors.push({ provider: providerId, error: "unknown provider" }); continue; }

    const apiKey = env[provider.needsKey];
    if (!apiKey) { errors.push({ provider: providerId, error: `missing ${provider.needsKey}` }); continue; }

    const model = MODELS[providerId]?.[tier];
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
          const text = provider.parseResponse(data);
          if (text) {
            return { ok: true, text, provider: providerId, model, attempts: attempt + 1, errors: errors.length ? errors : undefined };
          }
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
