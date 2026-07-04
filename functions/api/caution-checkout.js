// Cloudflare Pages Function — POST /api/caution-checkout
// Crée une Stripe Checkout Session en pré-autorisation (capture_method: manual)
// Retourne une URL hébergée par Stripe → hôte l'envoie au voyageur
// Le voyageur entre sa CB → fonds bloqués mais pas débités

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

// Montants maximum autorisés par bien (en euros)
const MAX_CAUTION = {
  amaryllis:  1500,
  schoelcher: 1000,
  zandoli:    700,
  iguana:     500,
  geko:       500,
  mabouya:    500,
  nogent:     500,
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const {
    bienId,
    voyageur = "",
    email = "",
    checkin = "",
    checkout,
    amount, // en euros (ex: 1500)
  } = body;

  if (!bienId || !checkout || !amount || amount < 50) {
    return json({ error: "bienId, checkout et amount (€) requis" }, 400);
  }
  if (!NOMS[bienId]) {
    return json({ error: `bienId inconnu: ${bienId}` }, 400);
  }
  const maxCaution = MAX_CAUTION[bienId] ?? 500;
  if (amount > maxCaution) {
    return json({ error: `Montant maximum autorisé pour ${bienId}: ${maxCaution}€` }, 400);
  }

  const amountCents = Math.round(amount * 100);
  const bienNom = NOMS[bienId] || bienId;

  // Expiration du lien : 24h (max autorisé par Stripe Checkout Sessions — un
  // essai à 72h renvoie "expires_at timestamp must be less than 24 hours").
  const expiresAt = Math.floor(Date.now() / 1000) + 23 * 3600;

  const payload = new URLSearchParams({
    mode: "payment",
    // Caution = carte uniquement (cohérent avec create-deposit-intent) : pas de Link
    // qui réaffiche une carte enregistrée déjà refusée.
    "payment_method_types[0]": "card",
    "payment_intent_data[capture_method]": "manual",
    "payment_intent_data[metadata][type]": "deposit",
    "payment_intent_data[metadata][bienId]": bienId,
    "payment_intent_data[metadata][checkin]": checkin,
    "payment_intent_data[metadata][checkout]": checkout,
    "payment_intent_data[metadata][voyageur]": voyageur,
    "payment_intent_data[metadata][email]": email,
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(amountCents),
    "line_items[0][price_data][product_data][name]": `Caution — ${bienNom}`,
    "line_items[0][price_data][product_data][description]":
      `Préautorisation de caution. Votre carte ne sera PAS débitée. Les fonds seront libérés automatiquement 3 jours après votre départ (${checkout}).`,
    "line_items[0][quantity]": "1",
    "success_url": "https://villamaryllis.com/?caution=ok",
    "cancel_url": "https://villamaryllis.com/?caution=cancelled",
    "expires_at": String(expiresAt),
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
      expires_at: expiresAt,
      amount_eur: amount,
      bienId,
      checkout,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
