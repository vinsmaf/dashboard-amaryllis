// functions/api/google-reviews.js
// Proxy sécurisé vers Google Places API — masque la clé API côté serveur
// Cache Cloudflare 6h pour limiter la facturation Google

const CACHE_TTL = 6 * 60 * 60; // 6 heures en secondes

export async function onRequestGet(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const apiKey  = context.env.GOOGLE_PLACES_API_KEY;
  const placeId = context.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return Response.json(
      { ok: false, error: "Google Places non configuré (GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID manquants)" },
      { status: 503, headers: corsHeaders }
    );
  }

  // Utilise le Cache API Cloudflare pour limiter les appels Google (facturation)
  const cache    = caches.default;
  const cacheKey = new Request(`https://places.googleapis.com/cache/${placeId}`);
  const cached   = await cache.match(cacheKey);
  if (cached) {
    const data = await cached.json();
    return Response.json({ ok: true, cached: true, ...data }, { headers: corsHeaders });
  }

  // Appel Google Places API
  const url = `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}` +
    `&fields=name,rating,user_ratings_total,reviews` +
    `&reviews_sort=most_relevant` +
    `&language=fr` +
    `&key=${apiKey}`;

  let gRes;
  try {
    gRes = await fetch(url);
  } catch (e) {
    return Response.json({ ok: false, error: "Erreur réseau Google" }, { status: 502, headers: corsHeaders });
  }

  const gData = await gRes.json();

  if (gData.status !== "OK") {
    return Response.json(
      { ok: false, error: `Google: ${gData.status} — ${gData.error_message || ""}` },
      { status: 502, headers: corsHeaders }
    );
  }

  const result = gData.result || {};
  const payload = {
    name:              result.name ?? "",
    rating:            result.rating ?? null,
    userRatingsTotal:  result.user_ratings_total ?? 0,
    reviews: (result.reviews ?? []).map(r => ({
      author:    r.author_name,
      avatar:    r.profile_photo_url,
      rating:    r.rating,
      text:      r.text,
      time:      r.relative_time_description,
      lang:      r.language,
    })),
  };

  // Mise en cache 6h
  const responseToCache = new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${CACHE_TTL}` },
  });
  context.waitUntil(cache.put(cacheKey, responseToCache));

  return Response.json({ ok: true, cached: false, ...payload }, { headers: corsHeaders });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
