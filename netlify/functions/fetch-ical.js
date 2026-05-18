// No imports needed — uses native fetch (Node 18+, available on Netlify)

export const handler = async (event) => {
  const jsonHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };

  const url = event.queryStringParameters?.url;
  if (!url) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: "url manquant" }) };
  }

  const ICAL_HOSTS = ["ics.booking.com", "airbnb.com", "www.airbnb.com", "calendar.google.com"];
  let parsedUrl;
  try { parsedUrl = new URL(url); } catch {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: "URL invalide" }) };
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol) || !ICAL_HOSTS.includes(parsedUrl.hostname)) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: "URL non autorisée" }) };
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; iCal-Proxy/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) {
      return { statusCode: 502, headers: jsonHeaders, body: JSON.stringify({ error: `HTTP ${res.status}` }) };
    }
    const text = await res.text();
    if (!text.includes("VCALENDAR")) {
      return { statusCode: 422, headers: jsonHeaders, body: JSON.stringify({ error: "Format iCal invalide" }) };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/calendar; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
      body: text,
    };
  } catch (err) {
    return { statusCode: 502, headers: jsonHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
