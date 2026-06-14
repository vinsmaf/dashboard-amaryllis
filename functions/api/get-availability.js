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

// ── direct_bookings D1 → dates bloquées (résas directes Stripe non sync iCal) ──
// Sans ça, les résas Martinique payées en direct n'apparaissent ni au site public
// ni à l'admin → double-booking garanti tant que Vincent n'a pas bloqué à la main.
async function fetchDirectBlocked(env, bienId) {
  if (!env.revenue_manager || !bienId) return new Set();
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await env.revenue_manager
      // Inclut les résas groupées (offre résidence) dont ce bien fait partie
      // (group_biens = CSV des bien_ids, encadré de virgules pour un match exact).
      .prepare("SELECT checkin, checkout FROM direct_bookings WHERE (bien_id=? OR (bien_id='groupe' AND (',' || group_biens || ',') LIKE '%,' || ? || ',%')) AND checkout>=?")
      .bind(bienId, bienId, today).all();
    const blocked = new Set();
    for (const r of (rows?.results || [])) {
      if (!r.checkin || !r.checkout) continue;
      const cur = new Date(r.checkin   + "T12:00:00Z");
      const end = new Date(r.checkout + "T12:00:00Z");
      while (cur < end) {
        blocked.add(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
    return blocked;
  } catch { return new Set(); }
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

    const [blocked, directBlocked] = await Promise.all([
      fetchBeds24Blocked(env),
      fetchDirectBlocked(env, bienId),
    ]);
    const merged = new Set([...blocked, ...directBlocked]);
    const result = {
      blockedDates: Array.from(merged).sort(),
      sources: {
        beds24: { ok: blocked.size >= 0, count: blocked.size },
        direct: { ok: true, count: directBlocked.size },
      },
    };

    // Cache KV — TTL 1 h pour Nogent (réservable en direct via Beds24 temps réel) :
    // borne la fenêtre de double-réservation à 1 h max même si le webhook Beds24
    // n'est pas (encore) configuré. Le webhook purge ce cache à chaque résa → ~temps réel.
    if (env.AVAIL_CACHE) {
      await env.AVAIL_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
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

  const [airbnbText, bookingText, directBlocked] = await Promise.all([
    fetchIcal(airbnbUrl),
    fetchIcal(bookingUrl),
    fetchDirectBlocked(env, bienId),
  ]);

  const airbnbBlocked  = airbnbText  ? parseIcal(airbnbText)  : new Set();
  const bookingBlocked = bookingText ? parseIcal(bookingText) : new Set();

  const merged = new Set([...airbnbBlocked, ...bookingBlocked, ...directBlocked]);

  const result = {
    blockedDates: Array.from(merged).sort(),
    sources: {
      airbnb:  { ok: !!airbnbText,  count: airbnbBlocked.size },
      booking: { ok: !!bookingText, count: bookingBlocked.size, fromParam: !maps.booking[bienId] && !!bookingUrl },
      direct:  { ok: true,          count: directBlocked.size },
    },
  };

  // Store in KV cache only when using env-configured URLs (not dynamic param)
  // TTL 6 h — économise les écritures KV (quota gratuit partagé avec patrimoine-dashboard).
  if (env.AVAIL_CACHE && !bookingUrlSafe) {
    await env.AVAIL_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 21600 });
  }

  return json(result);
}
