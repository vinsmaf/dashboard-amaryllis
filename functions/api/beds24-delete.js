// Cloudflare Pages Function — POST /api/beds24-delete
// Supprime une liste de réservations Beds24 par leurs IDs.
// Body: { bookingIds: [87199890, 87199892, ...] }
// Usage temporaire pour nettoyer les réservations test.

const BEDS24_V2_BOOKINGS = "https://beds24.com/api/v2/bookings";
const BEDS24_AUTH_TOKEN  = "https://beds24.com/api/v2/authentication/token";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

async function getAccessToken(refreshToken) {
  const res  = await fetch(BEDS24_AUTH_TOKEN, { headers: { refreshToken } });
  const data = await res.json();
  if (!data.token) throw new Error("Refresh token invalide");
  return data.token;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let token;
  if (env.BEDS24_REFRESH_TOKEN) {
    try { token = await getAccessToken(env.BEDS24_REFRESH_TOKEN); }
    catch (e) { return json({ error: `Auth échouée: ${e.message}` }, 500); }
  } else {
    return json({ error: "BEDS24_REFRESH_TOKEN manquant" }, 500);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const { bookingIds } = body;
  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return json({ error: "bookingIds requis (array)" }, 400);
  }

  const results = { deleted: [], failed: [] };

  for (const id of bookingIds) {
    try {
      const res = await fetch(`${BEDS24_V2_BOOKINGS}/${id}`, {
        method: "DELETE",
        headers: { token },
      });
      if (res.ok || res.status === 404) {
        results.deleted.push(id);
      } else {
        const err = await res.text().catch(() => res.status);
        results.failed.push({ id, error: err });
      }
    } catch (e) {
      results.failed.push({ id, error: e.message });
    }
  }

  return json({
    ok: true,
    deletedCount: results.deleted.length,
    failedCount:  results.failed.length,
    ...results,
  });
}
