// Cloudflare Pages Function — GET /api/beds24-prices
// Dérive les tarifs journaliers de Nogent (propId 158192) depuis les réservations Beds24.
// L'API inventory V2 de Beds24 retourne 500 pour ce compte → on utilise les bookings.
// Retourne { ok, nogent: { "YYYY-MM-DD": prix, ... }, source: "bookings", fetchedAt }

const BEDS24_BOOKINGS_URL = "https://beds24.com/api/v2/bookings";
const PROP_ID = "158192";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet(context) {
  try {
    return await _handle(context);
  } catch (fatal) {
    return json({ error: "Fatal: " + String(fatal?.message || fatal) }, 500);
  }
}

async function _handle(context) {
  const { env } = context;

  const token = env.BEDS24_TOKEN;
  if (!token) {
    return json({ error: "BEDS24_TOKEN manquant" }, 500);
  }

  // Récupérer les réservations futures confirmées (arrivée à partir d'aujourd'hui)
  const today = new Date().toISOString().slice(0, 10);

  let allBookings = [];
  let page = 0;
  const MAX_PAGES = 10;

  while (page < MAX_PAGES) {
    const qp = new URLSearchParams({
      propId:       PROP_ID,
      arrivalFrom:  today,
      pageNum:      page,
      numId:        100,
    });

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${BEDS24_BOOKINGS_URL}?${qp}`, {
        headers: { token },
        signal: controller.signal,
      }).finally(() => clearTimeout(tid));

      if (!res.ok) {
        const txt = await res.text();
        return json({ error: `Beds24 HTTP ${res.status}`, detail: txt.slice(0, 400) }, 502);
      }

      const data = await res.json();
      if (!data.success) {
        return json({ error: data.error || "Erreur Beds24 V2" }, 502);
      }

      allBookings = allBookings.concat(data.data || []);
      page++;
      if (!data.pages?.nextPageExists) break;
    } catch (err) {
      return json({ error: err.message || "Fetch error" }, 502);
    }
  }

  // Filtrer : réservations confirmées uniquement (pas annulées)
  const confirmed = allBookings.filter(b => b.status !== "cancelled" && b.status !== "black");

  // Dériver un tarif journalier pour chaque nuit couverte par les réservations
  // prix / nbNuits = ADR → on applique à chaque date du séjour
  const nogent = {};
  for (const b of confirmed) {
    if (!b.arrival || !b.departure || !b.price) continue;
    const price = parseFloat(b.price);
    if (isNaN(price) || price <= 0) continue;

    const arrival   = new Date(b.arrival   + "T12:00:00Z");
    const departure = new Date(b.departure + "T12:00:00Z");
    const nights    = Math.round((departure - arrival) / 86400000);
    if (nights <= 0) continue;

    const pricePerNight = Math.round(price / nights);
    if (pricePerNight <= 0) continue;

    // Attribuer le prix à chaque nuit du séjour
    for (let i = 0; i < nights; i++) {
      const d = new Date(arrival);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      // Si plusieurs réservations couvrent la même date (impossible normalement) → garder la première
      if (!nogent[dateStr]) {
        nogent[dateStr] = pricePerNight;
      }
    }
  }

  return json({
    ok:           true,
    nogent,
    source:       "bookings", // N.B. l'API inventory V2 Beds24 retourne 500 pour ce compte
    propId:       PROP_ID,
    bookingCount: confirmed.length,
    count:        Object.keys(nogent).length,
    fetchedAt:    new Date().toISOString(),
  });
}

export async function onRequest(context) {
  return onRequestGet(context);
}
