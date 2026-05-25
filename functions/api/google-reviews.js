// functions/api/google-reviews.js
// Proxy sécurisé → Google Places API v1

const PLACES = {
  amaryllis:  "ChIJWbeKdLghQIwRCppz2lJ39Jk",
  residence:  "ChIJc2hlO7chQIwRQaczraCwlNs",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET" },
    });
  }

  try {
    const apiKey = context.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return json({ ok: false, error: "GOOGLE_PLACES_API_KEY manquant" }, 503);

    const placeKey = new URL(context.request.url).searchParams.get("place") || "amaryllis";
    const placeId  = PLACES[placeKey] ?? PLACES.amaryllis;

    const fields = "displayName,rating,userRatingCount,reviews.rating,reviews.text,reviews.authorAttribution,reviews.relativePublishTimeDescription";
    const url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`;

    const raw = await fetch(url, {
      headers: {
        "X-Goog-FieldMask": fields,
        "X-Goog-Api-Key": apiKey,
      },
      cf: { cacheTtl: 3600, cacheEverything: true },
    });

    if (!raw.ok) {
      const err = await raw.text();
      return json({ ok: false, error: `Google ${raw.status}: ${err.slice(0, 200)}` }, 200);
    }

    const place = await raw.json();

    return json({
      ok: true,
      name:             place.displayName?.text ?? "Amaryllis Locations",
      rating:           place.rating ?? null,
      userRatingsTotal: place.userRatingCount ?? 0,
      reviews: (place.reviews ?? []).map(r => ({
        author: r.authorAttribution?.displayName ?? "Anonyme",
        avatar: r.authorAttribution?.photoUri ?? null,
        rating: r.rating,
        text:   r.text?.text ?? "",
        time:   r.relativePublishTimeDescription ?? "",
      })),
    });

  } catch (e) {
    return json({ ok: false, error: String(e) }, 200);
  }
}
