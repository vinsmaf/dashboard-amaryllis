// Cloudflare Pages Function — POST /api/sheets-proxy
// Proxy serveur → Apps Script pour éviter les CORS sur les gros payloads
// Le APPS_SCRIPT_URL peut venir de l'env OU du header X-Script-Url (depuis admin)

export async function onRequestPost(context) {
  const { request, env } = context;

  // URL Apps Script : env Cloudflare en priorité, sinon header envoyé par l'admin
  const scriptUrl = env.APPS_SCRIPT_URL || request.headers.get("X-Script-Url");
  if (!scriptUrl) return json({ error: "APPS_SCRIPT_URL manquante" }, 500);

  let body;
  try { body = await request.text(); }
  catch { return json({ error: "Body invalide" }, 400); }

  try {
    const res = await fetch(scriptUrl, {
      method:   "POST",
      headers:  { "Content-Type": "application/json" },
      body,
      redirect: "follow",
    });
    const text = await res.text();
    // Retourner la réponse Apps Script telle quelle
    return new Response(text, {
      status: res.ok ? 200 : 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return json({ error: err.message }, 502);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Script-Url",
    },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
