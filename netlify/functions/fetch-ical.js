import https from "https";
import http  from "http";

function fetchUrl(url, redirects = 0) {
  if (redirects > 5) return Promise.reject(new Error("Too many redirects"));
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; iCal-Proxy/1.0)" } }, (res) => {
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

export const handler = async (event) => {
  const headers = {
    "Content-Type": "text/calendar; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };

  const url = event.queryStringParameters?.url;
  if (!url) {
    return { statusCode: 400, headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ error: "url manquant" }) };
  }

  if (!/^https?:\/\//i.test(url)) {
    return { statusCode: 400, headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ error: "URL invalide" }) };
  }

  try {
    const text = await fetchUrl(url);
    if (!text.includes("VCALENDAR")) {
      return { statusCode: 422, headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ error: "Format iCal invalide" }) };
    }
    return { statusCode: 200, headers, body: text };
  } catch (err) {
    return { statusCode: 502, headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ error: err.message }) };
  }
};
