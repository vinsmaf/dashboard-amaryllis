// Cloudflare Pages Function — POST /api/beds24-webhook
// Reçoit les notifications Beds24 en temps réel → transmet à Apps Script
//
// Sécurité (arch-053) — vérification d'authenticité du webhook :
//   Configurer le secret Cloudflare `BEDS24_WEBHOOK_SECRET`, puis dans Beds24
//   ajouter le secret à l'URL du webhook : .../api/beds24-webhook?secret=XXXX
//   (ou header X-Webhook-Secret, ou signature HMAC-SHA256 dans X-Signature).
//   Tant que le secret n'est pas configuré → on log un warning mais on accepte
//   (rétro-compatibilité, migration en douceur).

const BEDS24_URL = "https://api.beds24.com/json/getBookings";
const PROP_ID    = "158192";

// Comparaison à temps constant (anti timing-attack)
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// HMAC-SHA256(rawBody, secret) en hex — pour vérifier X-Signature si fourni
async function hmacHex(secret, rawBody) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Retourne { ok:true } si authentifié, sinon { ok:false, reason }
async function verifyWebhook(request, url, rawBody, secret) {
  if (!secret) {
    console.warn("[beds24-webhook] ⚠️ BEDS24_WEBHOOK_SECRET non configuré — webhook NON protégé");
    return { ok: true, unprotected: true };
  }
  // 1. Secret en query param ?secret=
  const qSecret = url.searchParams.get("secret");
  if (qSecret && safeEqual(qSecret, secret)) return { ok: true, via: "query" };
  // 2. Header X-Webhook-Secret
  const hSecret = request.headers.get("X-Webhook-Secret");
  if (hSecret && safeEqual(hSecret, secret)) return { ok: true, via: "header" };
  // 3. Signature HMAC-SHA256 dans X-Signature
  const sigHeader = request.headers.get("X-Signature") || request.headers.get("X-Beds24-Signature");
  if (sigHeader) {
    const expected = await hmacHex(secret, rawBody);
    const provided = sigHeader.replace(/^sha256=/i, "").trim().toLowerCase();
    if (safeEqual(provided, expected)) return { ok: true, via: "hmac" };
  }
  return { ok: false, reason: "secret/signature invalide ou absent" };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const apiKey       = env.BEDS24_API_KEY;
  const propKey      = env.BEDS24_PROP_KEY;
  const scriptUrl    = env.APPS_SCRIPT_URL;
  const webhookSecret = env.BEDS24_WEBHOOK_SECRET; // optionnel (recommandé)

  if (!apiKey || !propKey)   return json({ error: "Clés Beds24 manquantes" }, 500);
  if (!scriptUrl)            return json({ error: "APPS_SCRIPT_URL manquante" }, 500);

  // ── Lire le body brut (nécessaire pour la vérification HMAC) ──
  const rawBody = await request.text();

  // ── Sécurité : vérifier l'authenticité du webhook ──
  const auth = await verifyWebhook(request, url, rawBody, webhookSecret);
  if (!auth.ok) {
    console.warn("[beds24-webhook] 🚫 Webhook rejeté :", auth.reason);
    return json({ error: "Unauthorized" }, 401);
  }

  // ── Parser le payload Beds24 ──
  let payload;
  try { payload = rawBody ? JSON.parse(rawBody) : {}; }
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

  // ── Normaliser → format unifié "Toutes les Réservations" et envoyer à Apps Script ──
  const normalized = bookings.map(normalizeBooking);
  // id "beds24-<bookingId>" identique au sync principal → upsert sans doublon, un seul onglet.
  const reservations = normalized.map((b) => ({
    id:         "beds24-" + b.bookingId,
    bienId:     "nogent",
    voyageur:   b.guestName,
    canal:      b.channel || "Beds24",
    checkin:    b.arrival,
    checkout:   b.departure,
    nights:     b.nights,
    montant:    b.price,
    nb_guests:  b.numGuests,
    notes:      b.notes || "",
    source:     "Beds24",
    status:     b.status || "Confirmé",
    modifiedOn: b.modifiedOn || b.arrival || "",
  }));

  try {
    const r = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "importAllReservations", reservations }),
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
