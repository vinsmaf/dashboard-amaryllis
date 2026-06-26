// functions/api/ical-config.js
// Renvoie les URLs iCal Booking.com depuis les secrets Cloudflare.
// Admin uniquement (seul appelant = src/App.jsx via fetchJSON qui injecte le Bearer).

import { verifyBearer } from "./_adminauth.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type,Authorization" },
  });
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "Content-Type,Authorization" },
    });
  }

  const { request, env } = context;

  // Source unique des URLs Booking.com : ce projet Pages. Le Worker
  // amaryllis-ical-sync (store de secrets séparé, sans mot de passe admin) les lit
  // ici au runtime → auth alternative par secret partagé qu'il possède déjà.
  // Évite la divergence vécue : Worker sans secret Booking = résas Booking
  // invisibles au pipeline alors que le calendrier site restait bloqué.
  const secret = new URL(request.url).searchParams.get("secret");
  const secretOk = !!secret && (secret === env.POSTSTAY_SECRET || secret === env.WORKER_SECRET);
  if (!secretOk) {
    const { ok: authOk } = await verifyBearer(request, env);
    if (!authOk) return json({ error: "Non autorisé" }, 401);
  }

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
