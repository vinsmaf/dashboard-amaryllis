// functions/api/google-reviews.js
// Proxy sécurisé → Google Places API v1 (nouvelle API)

const PLACE_ID = "ChIJWbeKdLghQIwRCppz2lJ39Jk";

export async function onRequestGet(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const apiKey = context.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Response.json(
      { ok: false, error: "GOOGLE_PLACES_API_KEY manquant" },
      { status: 503, headers: corsHeaders }
    );
  }

  // Appel Places API v1
  const fields = "rating,userRatingCount,reviews,displayName";
  const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=fr`;

  let raw;
  try {
    raw = await fetch(url, {
      headers: {
        "X-Goog-FieldMask": fields,
        "X-Goog-Api-Key": apiKey,
      },
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: "Erreur réseau Google" },
      { status: 502, headers: corsHeaders }
    );
  }

  if (!raw.ok) {
    const err = await raw.text();
    return Response.json(
      { ok: false, error: `Google ${raw.status}: ${err}` },
      { status: 502, headers: corsHeaders }
    );
  }

  const place = await raw.json();

  const payload = {
    name:             place.displayName?.text ?? "Amaryllis Locations",
    rating:           place.rating ?? null,
    userRatingsTotal: place.userRatingCount ?? 0,
    reviews: (place.reviews ?? []).map(r => ({
      author: r.authorAttribution?.displayName ?? "Anonyme",
      avatar: r.authorAttribution?.photoUri ?? null,
      rating: r.rating,
      text:   r.text?.text ?? "",
      time:   r.relativePublishTimeDescription ?? "",
      lang:   r.text?.languageCode ?? "fr",
    })),
  };

  return Response.json(
    { ok: true, ...payload },
    {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=21600", // cache CDN 6h
      },
    }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
