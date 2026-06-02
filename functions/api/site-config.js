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
      const key  = type === "prices" ? "daily_prices" : type === "base_prices" ? "base_prices" : "min_nights_config";
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
    if (request.method === "POST") {
      const body    = await request.json();
      const key     = body.type === "prices" ? "daily_prices" : body.type === "base_prices" ? "base_prices" : "min_nights_config";
      const cfg     = body.config || {};
      const cfgStr  = JSON.stringify(cfg);
      const ok = (h) => new Response(h, { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

      // 1) Voie principale : POST du body à Apps Script (doPost lit
      //    e.postData.contents) → AUCUNE limite de longueur d'URL.
      //    Indispensable pour les gros catalogues de prix (toutes dates éditées).
      try {
        const res  = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "setConfig", key, config: cfg }),
          redirect: "follow",
        });
        const text = await res.text();
        const d = JSON.parse(text);            // throw si HTML
        if (d && d.ok) return ok(text);        // succès → on s'arrête
      } catch { /* on tente le repli ci-dessous */ }

      // 2) Repli (petits payloads uniquement) : ancien transport par URL.
      //    Ne tente que si l'URL reste raisonnable (< 6000 car.).
      if (cfgStr.length < 6000) {
        try {
          const params = new URLSearchParams({ action: "setConfig", key, config: cfgStr });
          const res2   = await fetch(`${scriptUrl}?${params}`, { redirect: "follow" });
          const text2  = await res2.text();
          JSON.parse(text2);
          return ok(text2);
        } catch { /* tombe sur l'erreur générique */ }
      }

      return json({ ok: false, error: `Apps Script non-JSON (payload ${cfgStr.length} car.)` });
    }
  } catch (e) {
    return json({ ok: false, error: String(e) });
  }

  return json({ ok: false, error: "Method not allowed" });
}
