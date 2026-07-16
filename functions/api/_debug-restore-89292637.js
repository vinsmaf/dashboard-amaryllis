// DIAGNOSTIC TEMPORAIRE — à supprimer dès la cause racine du bug restoreGuest trouvée.
// Bisection du payload PUT Beds24 pour LA SEULE résa 89292637 (Ines Dali/Nogent) —
// bookingId volontairement figé en dur pour ne pas ouvrir un accès d'écriture arbitraire.
const BEDS24_V2_BOOKINGS = "https://beds24.com/api/v2/bookings";
const BOOKING_ID = "89292637";

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }
  const token = env.BEDS24_TOKEN;
  const body = await request.json().catch(() => ({}));
  const fields = body.fields || {};
  const payload = [{ id: BOOKING_ID, ...fields }];

  const res = await fetch(BEDS24_V2_BOOKINGS, {
    method: "PUT",
    headers: { token, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  return new Response(JSON.stringify({ sentPayload: payload, httpStatus: res.status, response: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
