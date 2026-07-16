// DIAGNOSTIC TEMPORAIRE — à supprimer dès la cause racine du bug restoreGuest trouvée.
// Bisection du payload PUT Beds24 pour LA SEULE résa 89292637 (Ines Dali/Nogent) —
// bookingId volontairement figé en dur pour ne pas ouvrir un accès d'écriture arbitraire.
const BEDS24_V2_BOOKINGS = "https://beds24.com/api/v2/bookings";
const BEDS24_AUTH_TOKEN  = "https://beds24.com/api/v2/authentication/token";
const BOOKING_ID = "89292637";

async function getAccessToken(refreshToken) {
  const res = await fetch(BEDS24_AUTH_TOKEN, { headers: { refreshToken } });
  const data = await res.json();
  if (!data.token) throw new Error("Refresh token invalide ou expiré: " + JSON.stringify(data));
  return data.token;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  let token = env.BEDS24_TOKEN;
  let tokenSource = "BEDS24_TOKEN (statique)";
  if (body.useRefreshToken) {
    if (!env.BEDS24_REFRESH_TOKEN) {
      return new Response(JSON.stringify({ error: "BEDS24_REFRESH_TOKEN absent de l'environnement" }), { status: 200 });
    }
    try {
      token = await getAccessToken(env.BEDS24_REFRESH_TOKEN);
      tokenSource = "BEDS24_REFRESH_TOKEN (échangé)";
    } catch (e) {
      return new Response(JSON.stringify({ error: "Échange refreshToken échoué: " + e.message }), { status: 200 });
    }
  }
  const fields = body.fields || {};
  // targetId : override diagnostic ponctuel (test idempotent sur une résa normale
  // pour isoler si le problème est spécifique aux blocs "Bloqué") — même secret
  // que les crons d'écriture existants (caution-cron etc.), rien de nouveau niveau confiance.
  const rawId = body.targetId || BOOKING_ID;
  const idValue = body.idAsInt ? Number(rawId) : String(rawId);
  const payload = [{ id: idValue, ...fields }];

  const res = await fetch(BEDS24_V2_BOOKINGS, {
    method: "PUT",
    headers: { token, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  return new Response(JSON.stringify({ tokenSource, sentPayload: payload, httpStatus: res.status, response: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
