// Cloudflare Pages Function — POST /api/ai-summary
// Proxy sécurisé vers l'API Anthropic — clé jamais exposée au navigateur

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: "ANTHROPIC_API_KEY manquante dans les variables Cloudflare" }, 500);
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
        model:      "claude-haiku-4-5",   // rapide + peu coûteux pour les résumés
        max_tokens: maxTokens,
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
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
