// Cloudflare Pages Function — GET/POST /api/site-config
// Proxy bidirectionnel vers Google Apps Script (PropertiesService)
// Stocke la configuration du site : séjour minimum par bien et par période

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  // Preflight CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const scriptUrl = env.APPS_SCRIPT_URL;
  if (!scriptUrl) return json({ ok: false, error: "APPS_SCRIPT_URL manquante" });

  try {
    // ── GET : lecture de la config ────────────────────────────────
    if (request.method === "GET") {
      const url  = new URL(request.url);
      const type = url.searchParams.get("type") || "config";
      const key  = type === "prices" ? "daily_prices" : "min_nights_config";
      const res  = await fetch(`${scriptUrl}?action=getConfig&key=${encodeURIComponent(key)}`, { redirect: "follow" });
      const text = await res.text();
      try {
        JSON.parse(text);
        return new Response(text, {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch {
        // Apps Script a retourné du HTML (session expirée, etc.)
        return json({ ok: true, config: {} });
      }
    }

    // ── POST : sauvegarde de la config ────────────────────────────
    // ⚠️ Apps Script redirige les POST et supprime le body — on envoie
    //    un GET avec le config encodé en paramètre URL à la place.
    if (request.method === "POST") {
      const body    = await request.json();
      const key     = body.type === "prices" ? "daily_prices" : "min_nights_config";
      const cfgStr  = JSON.stringify(body.config || {});
      const params  = new URLSearchParams({ action: "setConfig", key, config: cfgStr });
      const res     = await fetch(`${scriptUrl}?${params}`, { redirect: "follow" });
      const text    = await res.text();
      try {
        JSON.parse(text);
        return new Response(text, {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch {
        return json({ ok: false, error: "Apps Script non-JSON response" });
      }
    }
  } catch (e) {
    return json({ ok: false, error: String(e) });
  }

  return json({ ok: false, error: "Method not allowed" });
}
