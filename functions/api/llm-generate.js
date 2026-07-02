// Cloudflare Pages Function — POST /api/llm-generate?secret=POSTSTAY_SECRET
// Proxy générique vers callLLM (cascade multi-provider Groq/Cloudflare/Mistral/Cerebras)
// pour les appelants serveur-à-serveur (le Worker ne peut pas importer _llm.js — codebase
// séparée). Contrat volontairement identique à /api/ai-summary ({prompt,maxTokens}→{text})
// pour permettre un simple changement d'URL côté appelant.
//
// Différence clé avec /api/ai-summary : celui-ci dépend d'ANTHROPIC_API_KEY (absente en
// prod → 500 systématique) et n'a AUCUN fallback. Ce endpoint utilise la cascade résiliente
// déjà utilisée par toute la fleet d'agents — c'est la voie fiable pour du texte généré.
//
// Interne uniquement (Worker → Pages Function) : gaté par secret, pas d'accès navigateur.

import { callLLM } from "./_llm.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json" },
});
const MAX_TOKENS_CAP = 2000;

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Body JSON invalide" }, 400); }

  const { prompt, maxTokens = 500, tier = "smart" } = body;
  if (!prompt || typeof prompt !== "string") {
    return json({ error: "Champ 'prompt' requis" }, 400);
  }

  const r = await callLLM(env, {
    tier, max_tokens: Math.min(maxTokens, MAX_TOKENS_CAP), temperature: 0.4,
    logSource: "llm-generate", messages: [{ role: "user", content: prompt }],
  });

  if (!r.ok) return json({ error: "Toute la cascade a échoué", errors: r.errors }, 502);
  return json({ text: r.text, provider: r.provider, model: r.model });
}
