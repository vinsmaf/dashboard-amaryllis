// Cloudflare Pages Function — POST /api/cache-purge
// arch-011 (Architecte Réseau, BASSE) : /api/analytics passe à un TTL CDN de 1min
// (était 5min, functions/api/analytics.js) — ce endpoint permet de forcer un
// rafraîchissement immédiat sans attendre l'expiration naturelle du cache Cloudflare.
//
// Purge via l'API Cloudflare "Purge Files by URL" (zone-level).
// Auth : Bearer admin (voir _adminauth.js).
// Body (optionnel) : { urls: string[] } — défaut : purge /api/analytics seul.
//
// Secrets requis dans Cloudflare Pages :
//   CLOUDFLARE_API_TOKEN — token avec permission "Zone → Cache Purge → Purge"
//   CLOUDFLARE_ZONE_ID    — Zone ID de villamaryllis.com (Cloudflare dashboard → Overview)

import { verifyBearer } from "./_adminauth.js";

const DEFAULT_URLS = ["https://villamaryllis.com/api/analytics"];

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

export async function onRequestPost(context) {
  const { request, env } = context;

  const { ok: adminOk } = await verifyBearer(request, env);
  if (!adminOk) return json({ error: "Non autorisé" }, 401);

  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ZONE_ID) {
    return json({ error: "Purge CDN non configurée — secrets CLOUDFLARE_API_TOKEN/CLOUDFLARE_ZONE_ID manquants" }, 503);
  }

  const body = await request.json().catch(() => ({}));
  const urls = Array.isArray(body.urls) && body.urls.length ? body.urls : DEFAULT_URLS;

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: urls }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return json({ error: "Purge échouée", details: data.errors || data }, 502);
    }
    return json({ ok: true, purged: urls });
  } catch (err) {
    return json({ error: `exception: ${err.message}` }, 502);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
