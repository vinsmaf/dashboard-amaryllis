// GA4 — server-side event via Measurement Protocol
// Doc : https://developers.google.com/analytics/devguides/collection/protocol/ga4
// Requiert un API Secret créé dans GA4 Admin → Data Streams → Mesurement Protocol API secrets
// Extrait de stripe-webhook.js (partagé avec cancel-booking.js) — garder ce fichier comme
// source unique plutôt que dupliquer la logique d'envoi Measurement Protocol.
export async function ga4Event(env, eventName, params = {}, clientId = null, sessionId = null) {
  const measurementId = "G-N9BM709ZBL";
  const apiSecret = env.GA4_API_SECRET;
  if (!apiSecret) {
    console.log(`[ga4] GA4_API_SECRET manquant — event "${eventName}" ignoré`);
    return;
  }
  // client_id stable mais anonymisé : on prend le bookingId Stripe (unique, non-PII)
  const cid = clientId || `srv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  // session_id : sans lui, GA4 a du mal à rattacher l'event MP à la session navigateur
  // d'origine (même avec un bon client_id) — engagement_time_msec requis par Google dès
  // qu'on fournit un session_id pour que GA4 le traite comme un event "engagé".
  const eventParams = sessionId ? { ...params, session_id: sessionId, engagement_time_msec: "1" } : params;
  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: cid,
          non_personalized_ads: true,
          events: [{ name: eventName, params: eventParams }],
        }),
      }
    );
    if (!res.ok) console.warn(`[ga4] HTTP ${res.status} pour event "${eventName}"`);
    else console.log(`[ga4] event "${eventName}" envoyé (${res.status})`);
  } catch (e) {
    console.error(`[ga4] Erreur envoi event ${eventName}:`, e.message);
  }
}
