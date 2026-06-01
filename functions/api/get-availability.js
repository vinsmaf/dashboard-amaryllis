// Cloudflare Pages Function — /api/get-availability?bienId=X[&bookingUrl=...]
// env vars accessed via context.env (set in CF Pages dashboard)

function icalBienMap(env) {
  return {
    airbnb: {
      amaryllis:  env.ICAL_AMARYLLIS,
      schoelcher: env.ICAL_SCHOELCHER,
      geko:       env.ICAL_GEKO,
      mabouya:    env.ICAL_MABOUYA,
      iguana:     env.ICAL_IGUANA,
      zandoli:    env.ICAL_ZANDOLI,
      nogent:     env.ICAL_NOGENT,
    },
    booking: {
      amaryllis:  env.ICAL_BOOKING_AMARYLLIS,
      schoelcher: env.ICAL_BOOKING_SCHOELCHER,
      geko:       env.ICAL_BOOKING_GEKO,
      mabouya:    env.ICAL_BOOKING_MABOUYA,
      iguana:     env.ICAL_BOOKING_IGUANA,
      zandoli:    env.ICAL_BOOKING_ZANDOLI,
      nogent:     env.ICAL_BOOKING_NOGENT,
    },
  };
}

async function fetchIcal(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Calendar-Sync/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.includes("VCALENDAR") ? text : null;
  } catch {
    return null;
  }
}

function parseIcal(text) {
  const blocked = new Set();
  for (const ev of text.split("BEGIN:VEVENT").slice(1)) {
    const startM = ev.match(/DTSTART(?:;[^:]+)?:(\d{8})/);
    const endM   = ev.match(/DTEND(?:;[^:]+)?:(\d{8})/);
    if (!startM || !endM) continue;
    const fmt = (s) => `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
    let cur = new Date(fmt(startM[1]) + "T12:00:00Z");
    const end = new Date(fmt(endM[1]) + "T12:00:00Z");
    while (cur < end) {
      blocked.add(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  return blocked;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=600",
    },
  });
}

// ── Beds24 : convertit les réservations en dates bloquées ─────────────────
async function fetchBeds24Blocked(env) {
  const token = env.BEDS24_TOKEN;
  if (!token) return new Set();
  try {
    const today = new Date().toISOString().slice(0, 10);
    // Récupérer toutes les réservations futures (arrivée à partir d'aujourd'hui)
    // + réservations en cours (arrivée dans les 30 derniers jours)
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const qp = new URLSearchParams({
      propId:       "158192",
      arrivalFrom:  since,
      numId:        "200",
    });
    const res  = await fetch(`https://beds24.com/api/v2/bookings?${qp}`, { headers: { token } });
    const data = await res.json();
    if (!data.success) return new Set();

    const blocked = new Set();
    for (const b of (data.data || [])) {
      if (b.status === "cancelled") continue;
      if (!b.arrival || !b.departure) continue;
      // Bloquer toutes les nuits du séjour (arrivée incluse, départ exclu)
      const cur = new Date(b.arrival   + "T12:00:00Z");
      const end = new Date(b.departure + "T12:00:00Z");
      while (cur < end) {
        blocked.add(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
    return blocked;
  } catch {
    return new Set();
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const bienId = url.searchParams.get("bienId");

  if (!bienId) return json({ error: "bienId requis" }, 400);
  const VALID_BIENS = ["amaryllis","zandoli","iguana","geko","mabouya","schoelcher","nogent"];
  if (!VALID_BIENS.includes(bienId))
    return json({ error: "bienId invalide" }, 400);

  // KV cache key for this property
  const cacheKey = `avail_${bienId}`;

  // ── Cas Nogent : disponibilités depuis Beds24 API (pas d'iCal) ───────────
  if (bienId === "nogent") {
    // Check KV cache first
    const cached = env.AVAIL_CACHE ? await env.AVAIL_CACHE.get(cacheKey, "json") : null;
    if (cached) return json({ ...cached, fromCache: true });

    const blocked = await fetchBeds24Blocked(env);
    const result = {
      blockedDates: Array.from(blocked).sort(),
      sources: { beds24: { ok: blocked.size >= 0, count: blocked.size } },
    };

    // Store in KV cache (TTL 6 h — économise les écritures KV ; quota gratuit partagé
    // avec patrimoine-dashboard. Une dispo ne change pas en 10 min.)
    if (env.AVAIL_CACHE) {
      await env.AVAIL_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 21600 });
    }

    return json(result);
  }

  // ── Autres propriétés : iCal Airbnb + Booking.com ────────────────────────

  // Check KV cache first (only when no dynamic bookingUrl param, so cache stays safe)
  const bookingUrlParam = url.searchParams.get("bookingUrl");
  if (!bookingUrlParam) {
    const cached = env.AVAIL_CACHE ? await env.AVAIL_CACHE.get(cacheKey, "json") : null;
    if (cached) return json({ ...cached, fromCache: true });
  }

  const maps = icalBienMap(env);
  const airbnbUrl = maps.airbnb[bienId];

  // Booking URL: env var first, then param passed from admin localStorage (same domain)
  // Restrict to known iCal hostnames to prevent SSRF
  const ICAL_HOSTS = ["ics.booking.com", "airbnb.com", "www.airbnb.com", "calendar.google.com"];
  let bookingUrlSafe = null;
  if (bookingUrlParam) {
    try {
      const parsed = new URL(bookingUrlParam);
      if ((parsed.protocol === "https:" || parsed.protocol === "http:") && ICAL_HOSTS.includes(parsed.hostname)) {
        bookingUrlSafe = bookingUrlParam;
      }
    } catch {}
  }
  const bookingUrl = maps.booking[bienId] || bookingUrlSafe;

  if (!airbnbUrl && !bookingUrl) {
    return json({ error: "Aucune URL iCal configurée pour ce bien" }, 404);
  }

  const [airbnbText, bookingText] = await Promise.all([
    fetchIcal(airbnbUrl),
    fetchIcal(bookingUrl),
  ]);

  const airbnbBlocked  = airbnbText  ? parseIcal(airbnbText)  : new Set();
  const bookingBlocked = bookingText ? parseIcal(bookingText) : new Set();

  const merged = new Set([...airbnbBlocked, ...bookingBlocked]);

  const result = {
    blockedDates: Array.from(merged).sort(),
    sources: {
      airbnb:  { ok: !!airbnbText,  count: airbnbBlocked.size },
      booking: { ok: !!bookingText, count: bookingBlocked.size, fromParam: !maps.booking[bienId] && !!bookingUrl },
    },
  };

  // Store in KV cache only when using env-configured URLs (not dynamic param)
  // TTL 6 h — économise les écritures KV (quota gratuit partagé avec patrimoine-dashboard).
  if (env.AVAIL_CACHE && !bookingUrlSafe) {
    await env.AVAIL_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 21600 });
  }

  return json(result);
}
