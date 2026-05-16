// Cloudflare Pages Function — POST /api/beds24-webhook
// Reçoit les notifications Beds24 en temps réel → transmet à Apps Script

const BEDS24_URL = "https://api.beds24.com/json/getBookings";
const PROP_ID    = "158192";

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey       = env.BEDS24_API_KEY;
  const propKey      = env.BEDS24_PROP_KEY;
  const scriptUrl    = env.APPS_SCRIPT_URL;
  const webhookSecret = env.BEDS24_WEBHOOK_SECRET; // optionnel

  if (!apiKey || !propKey)   return json({ error: "Clés Beds24 manquantes" }, 500);
  if (!scriptUrl)            return json({ error: "APPS_SCRIPT_URL manquante" }, 500);

  // ── Lire le body du webhook Beds24 ──
  let payload;
  try { payload = await request.json(); }
  catch { payload = {}; }

  console.log("[beds24-webhook] reçu:", JSON.stringify(payload));

  // Beds24 envoie { bookId, propId, ... } ou juste une notification de changement
  // On récupère le bookingId depuis le payload (plusieurs formats possibles)
  const bookingId = payload.bookId || payload.bookingId || payload.id;

  let bookings = [];

  if (bookingId) {
    // Récupérer les détails complets de cette réservation
    try {
      const res = await fetch(BEDS24_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          propKey,
          propId:  Number(PROP_ID),
          bookId:  Number(bookingId),
          firstId: 0,
          numId:   1,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data)) bookings = data;
    } catch (err) {
      console.error("[beds24-webhook] fetch booking error:", err.message);
    }
  } else {
    // Pas de bookingId → on récupère les 50 dernières réservations modifiées
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const modifiedFrom = yesterday.toISOString().slice(0, 10);
    try {
      const res = await fetch(BEDS24_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey, propKey,
          propId:       Number(PROP_ID),
          modifiedFrom,
          firstId:      0,
          numId:        50,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data)) bookings = data;
    } catch (err) {
      console.error("[beds24-webhook] fetch recent error:", err.message);
    }
  }

  if (bookings.length === 0) {
    return json({ ok: true, msg: "Webhook reçu, aucune réservation à synchroniser" });
  }

  // ── Normaliser et envoyer à Apps Script ──
  const normalized = bookings.map(normalizeBooking);

  try {
    const r = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "importBeds24", bookings: normalized }),
      redirect: "follow",
    });
    const txt = await r.text();
    console.log("[beds24-webhook] Apps Script response:", txt);
    return json({ ok: true, synced: normalized.length, script: txt });
  } catch (err) {
    console.error("[beds24-webhook] Apps Script error:", err.message);
    return json({ error: err.message }, 502);
  }
}

// ── GET : endpoint de test / vérification Beds24 ──
export async function onRequestGet(context) {
  return json({ ok: true, msg: "Beds24 webhook endpoint actif", prop: PROP_ID });
}

function normalizeBooking(b) {
  const lastNight = b.lastNight || "";
  let departure = "";
  if (lastNight) {
    const d = new Date(lastNight + "T12:00:00Z");
    d.setDate(d.getDate() + 1);
    departure = d.toISOString().slice(0, 10);
  }
  const nights = (() => {
    if (!b.firstNight || !b.lastNight) return 0;
    const a = new Date(b.firstNight + "T12:00:00Z");
    const c = new Date(b.lastNight  + "T12:00:00Z");
    return Math.round((c - a) / 86400000) + 1;
  })();
  return {
    bookingId:   String(b.bookId || ""),
    guestName:   `${b.firstName || ""} ${b.lastName || ""}`.trim() || "—",
    email:       b.guestEmail  || "",
    phone:       b.guestPhone  || "",
    arrival:     b.firstNight  || "",
    departure,
    nights,
    channel:     channelLabel(b.referer),
    price:       parseFloat(b.price) || 0,
    status:      statusLabel(b.status),
    statusCode:  String(b.status),
    createdOn:   b.createdOn   || "",
    modifiedOn:  b.modifiedOn  || "",
    numGuests:   parseInt(b.numGuests) || 1,
    notes:       b.guestNote   || "",
  };
}

function statusLabel(code) {
  const m = { "0":"Nouveau","1":"Confirmé","2":"Annulé","3":"Demande","4":"Paiement en attente","5":"Fermé" };
  return m[String(code)] || `Statut ${code}`;
}

function channelLabel(r) {
  if (!r) return "Direct";
  const s = r.toLowerCase();
  if (s.includes("airbnb"))  return "Airbnb";
  if (s.includes("booking")) return "Booking.com";
  if (s.includes("expedia")) return "Expedia";
  if (s.includes("direct"))  return "Direct";
  return r;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
