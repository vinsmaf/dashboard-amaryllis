// Cloudflare Pages Function — POST /api/ai-summary
// Proxy sécurisé vers l'API Anthropic — clé jamais exposée au navigateur
import { rateLimit } from "./_ratelimit.js";

const CORS_ORIGIN = "https://villamaryllis.com";
const CORS = {
  "Access-Control-Allow-Origin":  CORS_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const MAX_TOKENS_CAP = 800;

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: "ANTHROPIC_API_KEY manquante dans les variables Cloudflare" }, 500);
  }

  const db = env.revenue_manager;
  if (db) {
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
    const rl = await rateLimit(db, { key: `ai-summary:${ip}`, limit: 10, windowSec: 60 });
    if (!rl.ok) return json({ error: "Trop de requêtes" }, 429);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Body JSON invalide" }, 400); }

  const { prompt, maxTokens = 500 } = body;
  if (!prompt || typeof prompt !== "string") {
    return json({ error: "Champ 'prompt' requis" }, 400);
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5",
        max_tokens: Math.min(maxTokens, MAX_TOKENS_CAP),
        messages:   [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return json({ error: data.error?.message || "Erreur Anthropic", status: res.status }, 502);
    }

    return json({ text: data.content?.[0]?.text || "" });
  } catch (err) {
    return json({ error: err.message }, 502);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
