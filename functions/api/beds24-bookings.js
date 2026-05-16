// Cloudflare Pages Function — GET /api/beds24-bookings
// Proxy sécurisé vers l'API Beds24 v1 — clés jamais exposées au navigateur

const BEDS24_URL = "https://api.beds24.com/json/getBookings";
const PROP_ID    = "158192";
const PAGE_SIZE  = 1000; // max Beds24

export async function onRequestGet(context) {
  const { request, env } = context;

  const apiKey  = env.BEDS24_API_KEY;
  const propKey = env.BEDS24_PROP_KEY;
  if (!apiKey || !propKey) {
    return json({ error: "BEDS24_API_KEY ou BEDS24_PROP_KEY manquante" }, 500);
  }

  const url    = new URL(request.url);
  const params = url.searchParams;

  // Filtres optionnels transmis par l'admin
  const filters = {};
  const pick = (key) => { const v = params.get(key); if (v) filters[key] = v; };
  pick("arrivalFrom");
  pick("arrivalTo");
  pick("departureFrom");
  pick("departureTo");
  pick("modifiedFrom");
  pick("modifiedTo");
  // status : "0"=nouveau, "1"=confirmé, "2"=annulé, "4"=paiement en attente, "99"=tous
  const statusFilter = params.get("status"); // "" = pas de filtre

  const auth = { apiKey, propKey };

  // ── Pagination : boucle jusqu'à récupérer toutes les réservations ──
  let allBookings = [];
  let offset      = 0;
  let pageCount   = 0;
  const MAX_PAGES = 20; // protection : 20 × 1000 = 20 000 réservations max

  try {
    while (pageCount < MAX_PAGES) {
      const body = {
        authentication: auth,
        propId:  PROP_ID,
        firstId: String(offset),
        numId:   String(PAGE_SIZE),
        ...filters,
      };

      const res = await fetch(BEDS24_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error(`[beds24] HTTP ${res.status}: ${txt}`);
        return json({ error: `Beds24 HTTP ${res.status}`, detail: txt }, 502);
      }

      const data = await res.json();

      // Beds24 retourne un tableau de réservations ou un objet d'erreur
      if (!Array.isArray(data)) {
        console.error("[beds24] réponse inattendue:", JSON.stringify(data));
        return json({ error: "Réponse Beds24 invalide", detail: data }, 502);
      }

      allBookings = allBookings.concat(data);
      pageCount++;

      // Fin de pagination : moins de PAGE_SIZE résultats → on a tout
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  } catch (err) {
    console.error("[beds24] fetch error:", err.message);
    return json({ error: err.message }, 502);
  }

  // ── Normalisation & filtre statut ──
  const normalize = (b) => ({
    bookingId:  b.bookId,
    firstName:  b.firstName  || "",
    lastName:   b.lastName   || "",
    guestName:  `${b.firstName || ""} ${b.lastName || ""}`.trim() || "—",
    email:      b.guestEmail  || "",
    phone:      b.guestPhone  || "",
    arrival:    b.firstNight  || "",          // YYYY-MM-DD (1ère nuit)
    departure:  departureDateFrom(b.lastNight), // lastNight + 1 jour = départ réel
    lastNight:  b.lastNight   || "",
    nights:     nightsCount(b.firstNight, b.lastNight),
    status:     b.status,
    statusLabel: statusLabel(b.status),
    roomId:     b.roomId      || "",
    unitId:     b.unitId      || "",
    channel:    b.referer     || b.icalInfoUrl || "",
    channelLabel: channelLabel(b.referer),
    price:      parseFloat(b.price)      || 0,
    currency:   b.currency               || "EUR",
    notes:      b.guestNote              || "",
    createdOn:  b.createdOn              || "",
    modifiedOn: b.modifiedOn             || "",
    numGuests:  parseInt(b.numGuests)    || 1,
  });

  let bookings = allBookings.map(normalize);

  // Filtre statut côté serveur si demandé
  if (statusFilter && statusFilter !== "99") {
    bookings = bookings.filter(b => String(b.status) === statusFilter);
  }

  // Tri : arrivée décroissante par défaut
  bookings.sort((a, b) => (b.arrival > a.arrival ? 1 : -1));

  return json({
    bookings,
    total:     bookings.length,
    propId:    PROP_ID,
    fetchedAt: new Date().toISOString(),
    pages:     pageCount,
  });
}

// ── Test de connexion : GET /api/beds24-bookings?test=1 ──────────────
// Retourne les 5 dernières réservations pour vérifier que la clé fonctionne
export async function onRequest(context) {
  if (new URL(context.request.url).searchParams.get("test") === "1") {
    // même logique mais numId=5
    const { env } = context;
    const apiKey  = env.BEDS24_API_KEY;
    const propKey = env.BEDS24_PROP_KEY;
    if (!apiKey || !propKey) return json({ ok: false, error: "Clés manquantes" }, 500);

    try {
      const res = await fetch(BEDS24_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          authentication: { apiKey, propKey },
          propId:  PROP_ID,
          firstId: "0",
          numId:   "5",
        }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        return json({ ok: true, sample: data.length, propId: PROP_ID });
      }
      return json({ ok: false, error: data }, 400);
    } catch (err) {
      return json({ ok: false, error: err.message }, 502);
    }
  }
  // Sinon déléguer au GET handler
  return onRequestGet(context);
}

// ── Helpers ──────────────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function departureDateFrom(lastNight) {
  if (!lastNight) return "";
  const d = new Date(lastNight + "T12:00:00Z");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function nightsCount(firstNight, lastNight) {
  if (!firstNight || !lastNight) return 0;
  const a = new Date(firstNight + "T12:00:00Z");
  const b = new Date(lastNight  + "T12:00:00Z");
  return Math.round((b - a) / 86400000) + 1;
}

function statusLabel(code) {
  const labels = {
    "0":  "Nouveau",
    "1":  "Confirmé",
    "2":  "Annulé",
    "3":  "Demande",
    "4":  "Paiement en attente",
    "5":  "Fermé",
    "90": "Bloqué",
    "99": "Archivé",
  };
  return labels[String(code)] || `Statut ${code}`;
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
