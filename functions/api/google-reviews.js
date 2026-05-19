// functions/api/google-reviews.js — test minimal

export async function onRequestGet(context) {
  return new Response(JSON.stringify({ ok: true, test: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
