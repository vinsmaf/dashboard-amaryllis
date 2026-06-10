// Helper — Meta Conversions API (CAPI) server-side
// Envoie un event Purchase côté serveur pour fiabiliser le tracking (iOS / adblock).
// Déduplication : event_id = payment_intent_id (même valeur que le Pixel client dans Merci.jsx).
// Doc : https://developers.facebook.com/docs/marketing-api/conversions-api
//
// Secret requis (CF Pages) : META_CAPI_TOKEN
//   → Meta Business → Gestionnaire d'événements → Sources de données → ton Pixel → Paramètres → Conversions API → Générer un token d'accès
// Pixel ID : hardcodé (1648064656415946) — même valeur que src/lib/metaPixel.js

const PIXEL_ID = "1648064656415946";
const CAPI_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

async function sha256hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Envoie un event Purchase vers la CAPI Meta.
 * Best-effort : ne rejamais en cas d'erreur (ne bloque pas le webhook Stripe).
 *
 * @param {object} env  - Cloudflare env (doit avoir META_CAPI_TOKEN)
 * @param {object} opts
 * @param {string}  opts.eventId   - payment_intent_id (déduplication avec le Pixel client)
 * @param {number}  opts.value     - montant en € (ex. 420.00)
 * @param {string}  [opts.currency] - devise (défaut "EUR")
 * @param {string}  [opts.email]   - email voyageur (haché SHA-256 avant envoi)
 * @param {string}  [opts.bienId]  - id du bien (ex. "amaryllis")
 * @param {string}  [opts.bienNom] - nom lisible (ex. "Villa Amaryllis")
 * @param {string}  [opts.sourceUrl] - URL de la page purchase (défaut /merci)
 */
export async function capiPurchase(env, { eventId, value, currency = "EUR", email, bienId, bienNom, sourceUrl }) {
  if (!env.META_CAPI_TOKEN) return; // pas configuré → silencieux

  const userData = {};
  if (email) {
    try { userData.em = [await sha256hex(email.trim().toLowerCase())]; } catch { /* */ }
  }

  const payload = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: sourceUrl || "https://villamaryllis.com/merci",
      action_source: "website",
      user_data: userData,
      custom_data: {
        value,
        currency,
        ...(bienId ? { content_ids: [bienId], content_type: "product" } : {}),
        ...(bienNom ? { content_name: bienNom } : {}),
      },
    }],
  };

  try {
    const res = await fetch(`${CAPI_URL}?access_token=${env.META_CAPI_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[CAPI] Purchase error:", res.status, txt.slice(0, 200));
    } else {
      console.log("[CAPI] Purchase OK event_id:", eventId, "value:", value);
    }
  } catch (e) {
    console.error("[CAPI] fetch failed:", e.message);
  }
}
