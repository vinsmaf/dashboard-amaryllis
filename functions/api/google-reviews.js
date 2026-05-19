// functions/api/google-reviews.js — debug step 2

export async function onRequestGet(context) {
  try {
    const apiKey = context.env.GOOGLE_PLACES_API_KEY;
    return new Response(
      JSON.stringify({ ok: true, hasKey: !!apiKey, keyLen: apiKey?.length }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}
