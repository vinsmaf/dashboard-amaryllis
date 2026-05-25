// Cloudflare Pages Function — GET /api/get-config
// Retourne la configuration admin : Apps Script URL + URLs iCal Airbnb.
// Tout est stocké comme secret Cloudflare Pages — jamais exposé dans le bundle JS.

export async function onRequestGet(context) {
  const { env } = context;

  // URLs iCal Airbnb par bien — noms des variables Cloudflare existantes
  const icalAirbnb = {};
  const icalVarMap = {
    amaryllis:  "ICAL_AMARYLLIS",
    schoelcher: "ICAL_SCHOELCHER",
    geko:       "ICAL_GEKO",
    mabouya:    "ICAL_MABOUYA",
    zandoli:    "ICAL_ZANDOLI",
    iguana:     "ICAL_IGUANA",
    nogent:     "ICAL_NOGENT",
  };
  for (const [bienId, envKey] of Object.entries(icalVarMap)) {
    if (env[envKey]) icalAirbnb[bienId] = env[envKey];
  }

  const data = {
    ok: true,
    scriptUrl:   env.APPS_SCRIPT_URL || "",
    icalAirbnb:  Object.keys(icalAirbnb).length > 0 ? icalAirbnb : null,
  };
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
