// Cloudflare Pages Function — /api/fetch-ical?url=<encoded-ical-url>
// Server-side proxy to bypass CORS for Booking.com / Airbnb iCal URLs

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const icalUrl = url.searchParams.get("url");

  const jsonErr = (msg, status = 400) => new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

  if (!icalUrl) return jsonErr("url manquant");
  if (!/^https?:\/\//i.test(icalUrl)) return jsonErr("URL invalide");

  try {
    const res = await fetch(icalUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; iCal-Proxy/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return jsonErr(`HTTP ${res.status}`, 502);
    const text = await res.text();
    if (!text.includes("VCALENDAR")) return jsonErr("Format iCal invalide", 422);
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return jsonErr(err.message, 502);
  }
}
