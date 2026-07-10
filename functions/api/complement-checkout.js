// Cloudflare Pages Function — POST /api/complement-checkout
// Crée une Stripe Checkout Session de PAIEMENT (capture immédiate) pour un COMPLÉMENT de prix
// — typiquement un changement de logement ou une sur-occupation après réservation.
//
// Particularité clé : `setup_future_usage=off_session` + `customer_creation=always` →
// la carte du voyageur est ENREGISTRÉE. Le webhook (kind="complement") s'en sert alors pour
// programmer la caution différée (posée à J-2 par le cron, comme une nouvelle résa) sans
// recréer ni la réservation (déjà en D1) ni une fausse conversion publicitaire.

import { rateLimit } from "./_ratelimit.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const NOMS = {
  amaryllis:  "Villa Amaryllis",
  schoelcher: "Bellevue Schœlcher",
  geko:       "Géko",
  mabouya:    "Mabouya",
  zandoli:    "Zandoli",
  iguana:     "Villa Iguana",
  nogent:     "Appartement Nogent",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500);

  // SEC audit Fable 5 2026-07-09, Lot 2 : rate-limit anti-abus (60/h/IP, fail-open comme ailleurs).
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rl = await rateLimit(env.revenue_manager, { key: `complement-checkout:${ip}`, limit: 60, windowSec: 3600 });
  if (!rl.ok) {
    return json({ error: "Trop de requêtes — réessayez dans un instant", retryAfter: rl.retryAfter }, 429);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const {
    bienId,
    voyageur = "",
    email = "",
    checkin = "",
    checkout = "",
    amount,         // en euros (ex : 628)
    label = "",     // libellé optionnel (ex : "Changement Mabouya → Zandoli")
  } = body;

  if (!bienId || !amount || amount < 1) {
    return json({ error: "bienId et amount (€) requis" }, 400);
  }
  if (!NOMS[bienId]) {
    return json({ error: `bienId inconnu: ${bienId}` }, 400);
  }
  // Plafond de sécurité : un complément reste un ajustement, pas un séjour complet.
  if (amount > 5000) {
    return json({ error: "Montant complément > 5000€ — vérifier (sécurité)" }, 400);
  }

  const amountCents = Math.round(amount * 100);
  const bienNom = NOMS[bienId];
  const descLabel = label || `Complément de réservation — ${bienNom}`;

  const payload = new URLSearchParams({
    mode: "payment",
    // Enregistre la carte pour la caution différée posée à J-2 par le cron.
    // ⚠️ customer_creation:always est OBLIGATOIRE : sans lui, Stripe ne crée PAS le Customer
    // même avec setup_future_usage (vécu 2026-06-19 : paiement Cambier réussi mais customer=null
    // → caution off-session impossible). En Checkout mode=payment les deux sont COMPATIBLES
    // (niveaux différents : customer_creation sur la Session, setup_future_usage sur le PI).
    "customer_creation": "always",
    "payment_intent_data[setup_future_usage]": "off_session",
    // kind=complement → le webhook encaisse + programme la caution, SANS recréer la résa.
    "payment_intent_data[metadata][kind]": "complement",
    "payment_intent_data[metadata][bienId]": bienId,
    "payment_intent_data[metadata][checkin]": checkin,
    "payment_intent_data[metadata][checkout]": checkout,
    "payment_intent_data[metadata][voyageur]": voyageur,
    "payment_intent_data[metadata][email]": email,
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(amountCents),
    "line_items[0][price_data][product_data][name]": descLabel,
    "line_items[0][price_data][product_data][description]":
      `Complément à régler pour votre séjour ${bienNom}${checkin ? ` du ${checkin} au ${checkout}` : ""}. La caution sera pré-autorisée automatiquement 2 jours avant votre arrivée (carte non débitée).`,
    "line_items[0][quantity]": "1",
    "success_url": "https://villamaryllis.com/?complement=ok",
    "cancel_url": "https://villamaryllis.com/?complement=cancelled",
    "locale": "fr",
  });

  if (email) payload.set("customer_email", email);

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sk}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });
    const parsed = await res.json();
    if (parsed.error) return json({ error: parsed.error.message }, 400);

    return json({
      ok: true,
      url: parsed.url,
      session_id: parsed.id,
      amount_eur: amount,
      bienId,
      checkin,
      checkout,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
