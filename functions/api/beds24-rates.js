// Cloudflare Pages Function — GET /api/beds24-rates
// Récupère les tarifs journaliers Beds24 pour Nogent (propId=158192, roomId=348880)
// via /inventory/rooms/calendar?includePrices=true
// Retourne un objet plat { "YYYY-MM-DD": price } utilisable directement comme dailyPricesMap.
// Cache CDN 1h (Cloudflare) + TTL localStorage côté client (1h).

const BEDS24_BASE        = "https://beds24.com/api/v2";
const PROP_ID            = "158192";
const ROOM_ID            = "348880";
const BIEN_ID            = "nogent";
const CLEANING_FEE       = 45;         // frais de ménage (ajouté en sus du tarif nuit)
const BOOKING_MULTIPLIER = 1.0;        // Beds24 bookingPageMultiplier est *1.10 pour leur page
                                       // Mettre à 1.10 si vous voulez aligner avec leur booking page

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", // cache CDN 1h, stale 24h
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet(context) {
  const { env } = context;
  const token = env.BEDS24_TOKEN;
  if (!token) return err("BEDS24_TOKEN manquant", 500);

  // Plage : aujourd'hui + 545 jours (~18 mois) — couvre toute la saison visible
  const today   = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 545);
  const startDate = today.toISOString().slice(0, 10);
  const endStr    = endDate.toISOString().slice(0, 10);

  const url = `${BEDS24_BASE}/inventory/rooms/calendar`
    + `?propId=${PROP_ID}&roomId=${ROOM_ID}`
    + `&startDate=${startDate}&endDate=${endStr}`
    + `&includePrices=true`;

  try {
    const res  = await fetch(url, { headers: { token } });
    const data = await res.json();

    if (!data.success) {
      return err(`Beds24 error: ${data.error}`, 502);
    }

    const roomData = data.data?.[0];
    if (!roomData) return err("Aucune donnée room retournée", 502);

    // Décompresser les plages { from, to, price1 } → map plat { "YYYY-MM-DD": price }
    const pricesMap = {};
    for (const range of (roomData.calendar || [])) {
      if (!range.price1 || !range.from || !range.to) continue;
      const price = Math.round(range.price1 * BOOKING_MULTIPLIER);
      const cur   = new Date(range.from + "T12:00:00Z");
      const end   = new Date(range.to   + "T12:00:00Z");
      while (cur <= end) {
        pricesMap[cur.toISOString().slice(0, 10)] = price;
        cur.setDate(cur.getDate() + 1);
      }
    }

    const daysCount = Object.keys(pricesMap).length;
    const prices    = Object.values(pricesMap);
    const minPrice  = prices.length ? Math.min(...prices) : 0;
    const maxPrice  = prices.length ? Math.max(...prices) : 0;

    return new Response(JSON.stringify({
      ok:          true,
      bienId:      BIEN_ID,
      roomId:      ROOM_ID,
      propId:      PROP_ID,
      cleaningFee: CLEANING_FEE,
      prices:      pricesMap,          // { "2026-06-01": 110, ... }
      meta: {
        days:      daysCount,
        startDate,
        endDate:   endStr,
        minPrice,
        maxPrice,
        syncedAt:  new Date().toISOString(),
      },
    }), { status: 200, headers: CORS });

  } catch (e) {
    return err(e.message, 502);
  }
}

function err(msg, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: CORS,
  });
}
