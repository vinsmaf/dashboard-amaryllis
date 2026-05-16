// No imports needed — uses native fetch (Node 18+, available on Netlify)

const ICAL_AIRBNB = {
  amaryllis:  process.env.ICAL_AMARYLLIS,
  schoelcher: process.env.ICAL_SCHOELCHER,
  geko:       process.env.ICAL_GEKO,
  mabouya:    process.env.ICAL_MABOUYA,
  iguana:     process.env.ICAL_IGUANA,
  zandoli:    process.env.ICAL_ZANDOLI,
  nogent:     process.env.ICAL_NOGENT,
};

const ICAL_BOOKING = {
  amaryllis:  process.env.ICAL_BOOKING_AMARYLLIS,
  schoelcher: process.env.ICAL_BOOKING_SCHOELCHER,
  geko:       process.env.ICAL_BOOKING_GEKO,
  mabouya:    process.env.ICAL_BOOKING_MABOUYA,
  iguana:     process.env.ICAL_BOOKING_IGUANA,
  zandoli:    process.env.ICAL_BOOKING_ZANDOLI,
  nogent:     process.env.ICAL_BOOKING_NOGENT,
};

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

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=600",
  };

  const bienId = event.queryStringParameters?.bienId;
  if (!bienId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "bienId requis" }) };
  }

  // Airbnb: env var only
  const airbnbUrl = ICAL_AIRBNB[bienId];

  // Booking.com: env var first, then URL passed from admin localStorage (same domain)
  const bookingUrlParam = event.queryStringParameters?.bookingUrl;
  const bookingUrl = ICAL_BOOKING[bienId]
    || (bookingUrlParam && /^https?:\/\//i.test(bookingUrlParam) ? bookingUrlParam : null);

  if (!airbnbUrl && !bookingUrl) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: "Aucune URL iCal configurée pour ce bien" }) };
  }

  // Fetch both sources in parallel
  const [airbnbText, bookingText] = await Promise.all([
    fetchIcal(airbnbUrl),
    fetchIcal(bookingUrl),
  ]);

  const airbnbBlocked  = airbnbText  ? parseIcal(airbnbText)  : new Set();
  const bookingBlocked = bookingText ? parseIcal(bookingText) : new Set();

  const merged = new Set([...airbnbBlocked, ...bookingBlocked]);
  const blockedDates = Array.from(merged).sort();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      blockedDates,
      sources: {
        airbnb:  { ok: !!airbnbText,  count: airbnbBlocked.size },
        booking: { ok: !!bookingText, count: bookingBlocked.size, fromParam: !ICAL_BOOKING[bienId] && !!bookingUrl },
      },
    }),
  };
};
