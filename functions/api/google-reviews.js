// functions/api/google-reviews.js — debug step 3

export async function onRequest(context) {
  return new Response(
    JSON.stringify({ ok: true, method: context.request.method }),
    { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
  );
}
