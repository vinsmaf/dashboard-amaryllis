// Cloudflare Pages Function — GET /api/weather?loc=martinique|nogent
// Proxy sécurisé vers OpenWeatherMap — clé jamais exposée au navigateur
// Cache HTTP 30min côté Cloudflare CDN

const LOCATIONS = {
  martinique: { lat: 14.47,  lon: -60.92, label: "Sainte-Luce" },
  nogent:     { lat: 48.836, lon: 2.481,  label: "Nogent-sur-Marne" },
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const apiKey = env.OPENWEATHER_API_KEY;
  if (!apiKey) return json({ error: "OPENWEATHER_API_KEY manquante" }, 500);

  const url    = new URL(request.url);
  const locKey = url.searchParams.get("loc") || "martinique";
  const loc    = LOCATIONS[locKey] || LOCATIONS.martinique;

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&appid=${apiKey}&units=metric&lang=fr`,
      { cf: { cacheTtl: 1800, cacheEverything: true } }
    );
    if (!res.ok) return json({ error: "OpenWeatherMap error" }, 502);
    const d = await res.json();

    return json({
      loc:      loc.label,
      temp:     Math.round(d.main.temp),
      feels:    Math.round(d.main.feels_like),
      humidity: d.main.humidity,
      wind:     Math.round(d.wind.speed * 3.6), // m/s → km/h
      desc:     d.weather[0].description,
      icon:     d.weather[0].icon,
      id:       d.weather[0].id,
    });
  } catch (err) {
    return json({ error: err.message }, 502);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control":               "public, max-age=1800",
    },
  });
}
