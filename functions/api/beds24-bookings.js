// Cloudflare Pages Function — GET /api/beds24-bookings
// Proxy sécurisé vers l'API Beds24 V2 — token jamais exposé au navigateur

const BEDS24_V2_URL = "https://beds24.com/api/v2/bookings";
const PROP_ID = "158192";
const PAGE_SIZE = 100; // max raisonnable pour V2

export async function onRequestGet(context) {
  const { request, env } = context;

  const token = env.BEDS24_TOKEN;
  if (!token) {
    return json({ error: "BEDS24_TOKEN manquant dans les variables Cloudflare" }, 500);
  }

  const url = new URL(request.url);
  const params = url.searchParams;

  // ── Test de connexion ─────────────────────────────────────────────────
  if (params.get("test") === "1") {
    try {
      const res = await fetch("https://beds24.com/api/v2/authentication/details", {
        headers: { token },
      });
      const data = await res.json();
      if (data.validToken) {
        return json({ ok: true, propId: PROP_ID, expiresIn: data.token?.expiresIn });
      }
      return json({ ok: false, error: "Token invalide", raw: data }, 400);
    } catch (err) {
      return json({ ok: false, error: err.message }, 502);
    }
  }

  // ── Filtres optionnels ────────────────────────────────────────────────
  const qp = new URLSearchParams({ propId: PROP_ID });
  const pick = (v2key, paramKey) => {
    const v = params.get(paramKey || v2key);
    if (v) qp.set(v2key, v);
  };
  pick("arrivalFrom");
  pick("arrivalTo");
  pick("departureFrom");
  pick("departureTo");
  pick("modifiedFrom");
  pick("modifiedTo");

  const statusFilter = params.get("status");

  // ── Pagination ────────────────────────────────────────────────────────
  let allBookings = [];
  let pageNum = 0;
  const MAX_PAGES = 50;

  try {
    while (pageNum < MAX_PAGES) {
      qp.set("pageNum", pageNum);
      qp.set("numId", PAGE_SIZE);

      const res = await fetch(`${BEDS24_V2_URL}?${qp}`, {
        headers: { token },
      });

      if (!res.ok) {
        const txt = await res.text();
        return json({ error: `Beds24 HTTP ${res.status}`, detail: txt.slice(0, 500) }, 502);
      }

      let data;
      try { data = await res.json(); }
      catch (_) {
        return json({ error: "Réponse non-JSON de Beds24 V2" }, 502);
      }

      if (!data.success) {
        return json({ error: data.error || "Erreur Beds24 V2", raw: data }, 502);
      }

      allBookings = allBookings.concat(data.data || []);
      pageNum++;

      if (!data.pages?.nextPageExists) break;
    }
  } catch (err) {
    return json({ error: err.message }, 502);
  }

  // ── Normalisation ─────────────────────────────────────────────────────
  const normalize = (b) => ({
    bookingId:    b.id,
    firstName:    b.firstName   || "",
    lastName:     b.lastName    || "",
    guestName:    `${b.firstName || ""} ${b.lastName || ""}`.trim() || "—",
    email:        b.email       || "",
    phone:        b.phone || b.mobile || "",
    arrival:      b.arrival     || "",
    departure:    b.departure   || "",
    lastNight:    lastNightFrom(b.departure),
    nights:       nightsCount(b.arrival, b.departure),
    status:       statusCodeFrom(b.status),
    statusLabel:  statusLabel(b.status),
    roomId:       b.roomId      || "",
    unitId:       b.unitId      || "",
    channel:      b.referer     || b.channel || "",
    channelLabel: channelLabel(b.referer || b.channel),
    price:        parseFloat(b.price)   || 0,
    currency:     "EUR",
    notes:        b.comments    || b.notes || "",
    createdOn:    b.bookingTime  || "",
    modifiedOn:   b.modifiedTime || "",
    numGuests:    (b.numAdult || 1) + (b.numChild || 0),
  });

  let bookings = allBookings.map(normalize);

  // Filtre statut
  if (statusFilter && statusFilter !== "99") {
    bookings = bookings.filter(b => String(b.status) === statusFilter);
  }

  // Tri : arrivée décroissante
  bookings.sort((a, b) => (b.arrival > a.arrival ? 1 : -1));

  return json({
    bookings,
    total:     bookings.length,
    propId:    PROP_ID,
    fetchedAt: new Date().toISOString(),
    pages:     pageNum,
  });
}

export async function onRequest(context) {
  return onRequestGet(context);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

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

// V2 status (string) → code numérique compatible avec l'UI existante
function statusCodeFrom(status) {
  const map = {
    "new":       0,
    "confirmed": 1,
    "cancelled": 2,
    "request":   3,
    "black":     90,
    "closed":    5,
    "archived":  99,
  };
  return map[status] ?? 0;
}

function statusLabel(status) {
  const labels = {
    "new":       "Nouveau",
    "confirmed": "Confirmé",
    "cancelled": "Annulé",
    "request":   "Demande",
    "black":     "Bloqué",
    "closed":    "Fermé",
    "archived":  "Archivé",
  };
  return labels[status] || status || "Inconnu";
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
