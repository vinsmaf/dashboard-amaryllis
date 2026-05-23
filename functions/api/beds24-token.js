// Cloudflare Pages Function — GET /api/beds24-token
// Retourne un access token Beds24 (valid 24h) pour usage interne.
// À SUPPRIMER après le nettoyage des réservations test.

const BEDS24_AUTH_TOKEN = "https://beds24.com/api/v2/authentication/token";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.BEDS24_REFRESH_TOKEN) {
    return new Response(JSON.stringify({ error: "BEDS24_REFRESH_TOKEN manquant" }), { status: 500, headers: CORS });
  }
  try {
    const res  = await fetch(BEDS24_AUTH_TOKEN, { headers: { refreshToken: env.BEDS24_REFRESH_TOKEN } });
    const data = await res.json();
    if (!data.token) return new Response(JSON.stringify({ error: "Auth échouée", raw: data }), { status: 500, headers: CORS });
    return new Response(JSON.stringify({ token: data.token }), { status: 200, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}
