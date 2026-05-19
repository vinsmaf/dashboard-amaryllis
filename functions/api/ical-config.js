// functions/api/ical-config.js
// Renvoie les URLs iCal Booking.com depuis les secrets Cloudflare
// (non sensibles — ce sont des liens publics de calendrier)

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET" },
    });
  }

  const { env } = context;

  return json({
    ok: true,
    booking: {
      amaryllis:  env.ICAL_BOOKING_AMARYLLIS  || "",
      geko:       env.ICAL_BOOKING_GEKO       || "",
      mabouya:    env.ICAL_BOOKING_MABOUYA    || "",
      schoelcher: env.ICAL_BOOKING_SCHOELCHER || "",
      zandoli:    env.ICAL_BOOKING_ZANDOLI    || "",
    },
  });
}
