// debug step 5 — tester fetch vers Google

export async function onRequest(context) {
  try {
    const apiKey = context.env.GOOGLE_PLACES_API_KEY;
    const PLACE_ID = "ChIJWbeKdLghQIwRCppz2lJ39Jk";
    const fields = "rating,userRatingCount,reviews,displayName";
    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=fr`;

    const raw = await fetch(url, {
      headers: {
        "X-Goog-FieldMask": fields,
        "X-Goog-Api-Key": apiKey,
      },
    });

    const text = await raw.text();
    return new Response(
      JSON.stringify({ ok: raw.ok, status: raw.status, body: text.slice(0, 300) }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
}
