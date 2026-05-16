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

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const bienId = url.searchParams.get("bienId");

  if (!bienId) return json({ error: "bienId requis" }, 400);

  const maps = icalBienMap(env);
  const airbnbUrl = maps.airbnb[bienId];

  // Booking URL: env var first, then param passed from admin localStorage (same domain)
  const bookingUrlParam = url.searchParams.get("bookingUrl");
  const bookingUrl = maps.booking[bienId]
    || (bookingUrlParam && /^https?:\/\//i.test(bookingUrlParam) ? bookingUrlParam : null);

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

  return json({
    blockedDates: Array.from(merged).sort(),
    sources: {
      airbnb:  { ok: !!airbnbText,  count: airbnbBlocked.size },
      booking: { ok: !!bookingText, count: bookingBlocked.size, fromParam: !maps.booking[bienId] && !!bookingUrl },
    },
  });
}
