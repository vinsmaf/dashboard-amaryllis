// debug step 4 — tester context.env avec onRequest

export async function onRequest(context) {
  try {
    const env = context.env;
    const apiKey = env?.GOOGLE_PLACES_API_KEY;
    return new Response(
      JSON.stringify({ ok: true, hasEnv: !!env, hasKey: !!apiKey }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
}
