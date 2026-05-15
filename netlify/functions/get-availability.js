const https = require("https");

const ICAL_URLS = {
  amaryllis:  process.env.ICAL_AMARYLLIS,
  schoelcher: process.env.ICAL_SCHOELCHER,
  geko:       process.env.ICAL_GEKO,
  mabouya:    process.env.ICAL_MABOUYA,
  iguana:     process.env.ICAL_IGUANA,
  zandoli:    process.env.ICAL_ZANDOLI,
  nogent:     process.env.ICAL_NOGENT,
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : require("http");
    mod.get(url, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function parseIcal(text) {
  const blocked = new Set();
  const events = text.split("BEGIN:VEVENT");
  for (const ev of events.slice(1)) {
    // Extract DTSTART and DTEND (DATE or DATETIME)
    const startM = ev.match(/DTSTART(?:;[^:]+)?:(\d{8})/);
    const endM   = ev.match(/DTEND(?:;[^:]+)?:(\d{8})/);
    if (!startM || !endM) continue;

    const fmt = (s) => `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
    let cur = new Date(fmt(startM[1]) + "T12:00:00Z");
    const end = new Date(fmt(endM[1]) + "T12:00:00Z");

    // Block every date from start up to (not including) end
    while (cur < end) {
      blocked.add(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  return Array.from(blocked).sort();
}

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=900", // 15 min cache
  };

  const bienId = event.queryStringParameters?.bienId;
  if (!bienId) return { statusCode: 400, headers, body: JSON.stringify({ error: "bienId requis" }) };

  const icalUrl = ICAL_URLS[bienId];
  if (!icalUrl) return { statusCode: 404, headers, body: JSON.stringify({ error: "bienId inconnu" }) };

  try {
    const icalText = await fetchUrl(icalUrl);
    const blockedDates = parseIcal(icalText);
    return { statusCode: 200, headers, body: JSON.stringify({ blockedDates }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
