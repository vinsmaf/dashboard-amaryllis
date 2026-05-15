const ICAL_ENV = {
  amaryllis:  "ICAL_AMARYLLIS",
  schoelcher: "ICAL_SCHOELCHER",
  geko:       "ICAL_GEKO",
  mabouya:    "ICAL_MABOUYA",
  iguana:     "ICAL_IGUANA",
  zandoli:    "ICAL_ZANDOLI",
  nogent:     "ICAL_NOGENT",
};

function parseIcal(text) {
  const blocked = new Set();
  for (const ev of text.split("BEGIN:VEVENT").slice(1)) {
    const s = ev.match(/DTSTART(?:;[^:]+)?:(\d{8})/);
    const e = ev.match(/DTEND(?:;[^:]+)?:(\d{8})/);
    if (!s || !e) continue;
    const fmt = (d) => `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
    let cur = new Date(fmt(s[1]) + "T12:00:00Z");
    const end = new Date(fmt(e[1]) + "T12:00:00Z");
    while (cur < end) {
      blocked.add(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  return Array.from(blocked).sort();
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const bienId = url.searchParams.get("bienId");

  const hdrs = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=900",
  };
  const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: hdrs });

  if (!bienId) return json({ error: "bienId requis" }, 400);
  const envKey = ICAL_ENV[bienId];
  if (!envKey) return json({ error: "bienId inconnu" }, 404);
  const icalUrl = env[envKey];
  if (!icalUrl) return json({ error: "URL iCal non configurée" }, 500);

  try {
    const r = await fetch(icalUrl);
    const text = await r.text();
    return json({ blockedDates: parseIcal(text) });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
