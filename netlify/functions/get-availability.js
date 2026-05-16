import https from "https";
import http  from "http";

// Airbnb iCal URLs (env vars)
const ICAL_AIRBNB = {
  amaryllis:  process.env.ICAL_AMARYLLIS,
  schoelcher: process.env.ICAL_SCHOELCHER,
  geko:       process.env.ICAL_GEKO,
  mabouya:    process.env.ICAL_MABOUYA,
  iguana:     process.env.ICAL_IGUANA,
  zandoli:    process.env.ICAL_ZANDOLI,
  nogent:     process.env.ICAL_NOGENT,
};

// Booking.com iCal URLs (env vars — fallback, can also be passed as query param)
const ICAL_BOOKING = {
  amaryllis:  process.env.ICAL_BOOKING_AMARYLLIS,
  schoelcher: process.env.ICAL_BOOKING_SCHOELCHER,
  geko:       process.env.ICAL_BOOKING_GEKO,
  mabouya:    process.env.ICAL_BOOKING_MABOUYA,
  iguana:     process.env.ICAL_BOOKING_IGUANA,
  zandoli:    process.env.ICAL_BOOKING_ZANDOLI,
  nogent:     process.env.ICAL_BOOKING_NOGENT,
};

function fetchUrl(url, redirects = 0) {
  if (redirects > 5) return Promise.reject(new Error("Too many redirects"));
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function parseIcal(text) {
  const blocked = new Set();
  for (const ev of text.split("BEGIN:VEVENT").slice(1)) {
    const startM = ev.match(/DTSTART(?:;[^:]+)?:(\d{8})/);
    const endM   = ev.match(/DTEND(?:;[^:]+)?:(\d{8})/);
    if (!startM || !endM) continue;
    // All events block dates (Airbnb blocks, Booking.com CLOSED reservations, manual blocks…)
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

async function fetchAndParse(url) {
  if (!url) return new Set();
  try {
    const text = await fetchUrl(url);
    if (!text.includes("VCALENDAR")) return new Set();
    return parseIcal(text);
  } catch {
    return new Set();
  }
}

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=900",
  };

  const bienId = event.queryStringParameters?.bienId;
  if (!bienId) return { statusCode: 400, headers, body: JSON.stringify({ error: "bienId requis" }) };

  const airbnbUrl = ICAL_AIRBNB[bienId];
  // Booking URL: env var first, then param passed from PublicSite localStorage (same-domain admin)
  const bookingUrlParam = event.queryStringParameters?.bookingUrl;
  const bookingUrl = ICAL_BOOKING[bienId]
    || (bookingUrlParam && /^https?:\/\//i.test(bookingUrlParam) ? bookingUrlParam : null);

  if (!airbnbUrl && !bookingUrl) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: "bienId inconnu ou aucune URL iCal configurée" }) };
  }

  try {
    const [airbnbBlocked, bookingBlocked] = await Promise.all([
      fetchAndParse(airbnbUrl),
      fetchAndParse(bookingUrl),
    ]);
    const merged = new Set([...airbnbBlocked, ...bookingBlocked]);
    const blockedDates = Array.from(merged).sort();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ blockedDates, sources: { airbnb: airbnbBlocked.size, booking: bookingBlocked.size } }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
