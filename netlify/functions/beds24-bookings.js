// Netlify Function — GET /api/beds24-bookings

const BEDS24_V2_URL = "https://beds24.com/api/v2/bookings";
const PROP_ID = "158192";
const PAGE_SIZE = 100;

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function resp(data, statusCode = 200) {
  return { statusCode, headers: CORS, body: JSON.stringify(data) };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "GET, OPTIONS" } };
  }

  const token = process.env.BEDS24_TOKEN;
  if (!token) return resp({ error: "BEDS24_TOKEN manquant" }, 500);

  const params = event.queryStringParameters || {};

  if (params.test === "1") {
    try {
      const res = await fetch("https://beds24.com/api/v2/authentication/details", {
        headers: { token },
      });
      const data = await res.json();
      if (data.validToken) return resp({ ok: true, propId: PROP_ID, expiresIn: data.token?.expiresIn });
      return resp({ ok: false, error: "Token invalide", raw: data }, 400);
    } catch (err) {
      return resp({ ok: false, error: err.message }, 502);
    }
  }

  const qp = new URLSearchParams({ propId: PROP_ID });
  ["arrivalFrom","arrivalTo","departureFrom","departureTo","modifiedFrom","modifiedTo"].forEach(k => {
    if (params[k]) qp.set(k, params[k]);
  });
  const statusFilter = params.status;

  let allBookings = [];
  let pageNum = 0;
  const MAX_PAGES = 50;

  try {
    while (pageNum < MAX_PAGES) {
      qp.set("pageNum", pageNum);
      qp.set("numId", PAGE_SIZE);
      const res = await fetch(`${BEDS24_V2_URL}?${qp}`, { headers: { token } });
      if (!res.ok) {
        const txt = await res.text();
        return resp({ error: `Beds24 HTTP ${res.status}`, detail: txt.slice(0, 500) }, 502);
      }
      let data;
      try { data = await res.json(); } catch { return resp({ error: "Réponse non-JSON de Beds24 V2" }, 502); }
      if (!data.success) return resp({ error: data.error || "Erreur Beds24 V2", raw: data }, 502);
      allBookings = allBookings.concat(data.data || []);
      pageNum++;
      if (!data.pages?.nextPageExists) break;
    }
  } catch (err) {
    return resp({ error: err.message }, 502);
  }

  const normalize = (b) => ({
    bookingId:    b.id,
    firstName:    b.firstName  || "",
    lastName:     b.lastName   || "",
    guestName:    `${b.firstName || ""} ${b.lastName || ""}`.trim() || "—",
    email:        b.email      || "",
    phone:        b.phone || b.mobile || "",
    arrival:      b.arrival    || "",
    departure:    b.departure  || "",
    lastNight:    lastNightFrom(b.departure),
    nights:       nightsCount(b.arrival, b.departure),
    status:       statusCodeFrom(b.status),
    statusLabel:  statusLabel(b.status),
    roomId:       b.roomId     || "",
    unitId:       b.unitId     || "",
    channel:      b.referer    || b.channel || "",
    channelLabel: channelLabel(b.referer || b.channel),
    price:        parseFloat(b.price) || 0,
    currency:     "EUR",
    notes:        b.comments   || b.notes || "",
    createdOn:    b.bookingTime  || "",
    modifiedOn:   b.modifiedTime || "",
    numGuests:    (b.numAdult || 1) + (b.numChild || 0),
  });

  let bookings = allBookings.map(normalize);
  if (statusFilter && statusFilter !== "99") {
    bookings = bookings.filter(b => String(b.status) === statusFilter);
  }
  bookings.sort((a, b) => (b.arrival > a.arrival ? 1 : -1));

  return resp({ bookings, total: bookings.length, propId: PROP_ID, fetchedAt: new Date().toISOString(), pages: pageNum });
};

function lastNightFrom(departure) {
  if (!departure) return "";
  const d = new Date(departure + "T12:00:00Z");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nightsCount(arrival, departure) {
  if (!arrival || !departure) return 0;
  const a = new Date(arrival + "T12:00:00Z");
  const b = new Date(departure + "T12:00:00Z");
  return Math.round((b - a) / 86400000);
}

function statusCodeFrom(status) {
  return ({ new: 0, confirmed: 1, cancelled: 2, request: 3, black: 90, closed: 5, archived: 99 })[status] ?? 0;
}

function statusLabel(status) {
  return ({ new: "Nouveau", confirmed: "Confirmé", cancelled: "Annulé", request: "Demande", black: "Bloqué", closed: "Fermé", archived: "Archivé" })[status] || status || "Inconnu";
}

function channelLabel(referer) {
  if (!referer) return "Direct";
  const r = referer.toLowerCase();
  if (r.includes("airbnb"))  return "Airbnb";
  if (r.includes("booking")) return "Booking.com";
  if (r.includes("expedia")) return "Expedia";
  if (r.includes("vrbo"))    return "VRBO";
  if (r.includes("beds24"))  return "Beds24 Direct";
  if (r.includes("direct"))  return "Direct";
  return referer;
}
