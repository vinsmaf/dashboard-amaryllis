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
    // Si la réponse est du JSON valide → la retourner telle quelle
    try {
      JSON.parse(text);
      return new Response(text, {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } catch (_) {
      // Apps Script a retourné du HTML (erreur) → encapsuler pour debug
      return json({
        error: "Apps Script returned non-JSON",
        status: res.status,
        preview: text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400),
      }, 502);
    }
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
