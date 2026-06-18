// Cloudflare Pages Function — POST /api/create-payment-intent

// Enregistre un "panier" en D1 dès la création du PaymentIntent.
// Sert à la relance panier abandonné (cron send-relance-panier) si le paiement
// n'aboutit pas. Fail-silent : ne bloque jamais la création du PaymentIntent.
async function storeAbandonedCart(env, paymentIntentId, m = {}) {
  const db = env.revenue_manager;
  const email = String(m.email || "").trim();
  if (!db || !paymentIntentId || !email.includes("@") || !m.checkin) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS abandoned_carts (
      payment_intent_id TEXT PRIMARY KEY, email TEXT, prenom TEXT,
      bien_id TEXT, type TEXT, logements TEXT, checkin TEXT, checkout TEXT,
      guests TEXT, phone TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      relance_sent INTEGER DEFAULT 0)`).run();
    // Migration idempotente : ajoute phone aux tables créées avant ce champ (RM-10 — capture
    // du tél des NON-acheteurs pour relance). Le tél reste optionnel (NULL si non saisi).
    try { await db.prepare(`ALTER TABLE abandoned_carts ADD COLUMN phone TEXT`).run(); } catch { /* colonne déjà présente */ }
    const prenom = String(m.voyageur || "").trim().split(/\s+/)[0] || "";
    await db.prepare(`INSERT INTO abandoned_carts
        (payment_intent_id, email, prenom, bien_id, type, logements, checkin, checkout, guests, phone)
      VALUES (?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(payment_intent_id) DO UPDATE SET
        email=excluded.email, prenom=excluded.prenom, bien_id=excluded.bien_id,
        type=excluded.type, logements=excluded.logements,
        checkin=excluded.checkin, checkout=excluded.checkout, guests=excluded.guests,
        phone=COALESCE(excluded.phone, abandoned_carts.phone)`)
      .bind(paymentIntentId, email, prenom, m.bienId || "", m.type || "", m.logements || "", m.checkin || "", m.checkout || "", m.guests || "", String(m.phone || "").trim() || null).run();
  } catch (e) { console.error("[cart] D1:", e.message); }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const { amount, currency = "eur", metadata = {}, bookingId = "", payPlan = "full" } = body;
  if (!currency || currency !== "eur")
    return json({ error: "Devise non autorisée" }, 400);
  if (!amount || amount < 50) return json({ error: "Montant invalide" }, 400);
  if (amount > 500000)
    return json({ error: "Montant hors limites" }, 400);

  // Enregistrement de la carte (off-session) pour TOUTES les résas directes munies d'un email :
  // c'est ce qui permet de poser la CAUTION automatiquement avant l'arrivée (caution-cron) ET de
  // prélever le solde 2×. Requiert un Customer Stripe.
  //  - Paiement 2× : le Customer est INDISPENSABLE (le solde est débité dessus) → échec = on bloque.
  //  - Paiement 1× : souhaitable mais non bloquant → en cas d'échec, on continue le paiement SANS
  //    carte enregistrée (la caution retombera sur le lien manuel). On ne casse jamais le flux argent.
  const wantSavedCard = !!metadata.email || payPlan === "2x";
  let customerId = "";
  if (wantSavedCard) {
    try {
      const cRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: metadata.email || "",
          name:  metadata.voyageur || "",
          "metadata[bienId]": metadata.bienId || "",
        }).toString(),
      });
      const c = await cRes.json();
      if (c.error) {
        if (payPlan === "2x") return json({ error: c.error.message }, 400);
        console.error("[customer] création échouée (1x → on continue sans carte enregistrée):", c.error.message);
      } else {
        customerId = c.id;
      }
    } catch (e) {
      if (payPlan === "2x") return json({ error: "Création client Stripe échouée: " + e.message }, 500);
      console.error("[customer] exception (1x → on continue sans carte enregistrée):", e.message);
    }
  }

  const payload = new URLSearchParams({
    amount: String(Math.round(amount)),
    currency,
    "automatic_payment_methods[enabled]": "true",
    "metadata[bienId]":    metadata.bienId   || "",
    "metadata[checkin]":   metadata.checkin  || "",
    "metadata[checkout]":  metadata.checkout || "",
    "metadata[voyageur]":  metadata.voyageur || "",
    "metadata[email]":     metadata.email    || "",
    "metadata[phone]":     metadata.phone    || "",
    "metadata[bookingId]": bookingId || metadata.bookingId || metadata.beds24Id || "",
    // Réservation groupée (offre résidence — plusieurs logements, 1 paiement)
    "metadata[type]":      metadata.type      || "",
    "metadata[logements]": metadata.logements || "",
    "metadata[bienIds]":   metadata.bienIds   || "",
    "metadata[guests]":    metadata.guests    || "",
    // Attribution + identité → relayées au webhook pour la CAPI Meta (match quality) et
    // l'attribution Google Ads serveur. Seuls les champs réellement présents sont posés.
    ...attribMeta(metadata),
    // Carte enregistrée (off-session) dès qu'un Customer existe → caution auto avant l'arrivée + solde 2×.
    // Déclenche l'authentification 3DS au paiement (on-session) si la banque l'exige → fiabilise les
    // opérations off-session ultérieures.
    ...(customerId ? { customer: customerId, setup_future_usage: "off_session" } : {}),
    // Paiement en 2 fois : metadata échéancier (le débit du solde lit ces champs).
    ...(payPlan === "2x" ? {
      "metadata[pay_plan]":       "2x",
      "metadata[balance_amount]": String(metadata.balance_amount || ""),
      "metadata[due_date]":       String(metadata.due_date || ""),
      "metadata[full_total]":     String(metadata.full_total || ""),
    } : {}),
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sk}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });
    const parsed = await res.json();
    if (parsed.error) {
      console.error(JSON.stringify({
        level: "error",
        fn: "create-payment-intent",
        msg: parsed.error.message,
        bienId:   metadata.bienId   || "",
        checkin:  metadata.checkin  || "",
        checkout: metadata.checkout || "",
        amount,
        ts: new Date().toISOString(),
      }));
      return json({ error: parsed.error.message }, 400);
    }
    console.log(JSON.stringify({
      level: "info",
      fn: "create-payment-intent",
      msg: "payment intent créé",
      paymentIntentId: parsed.id,
      amount,
      currency,
      bienId:   metadata.bienId   || "",
      checkin:  metadata.checkin  || "",
      checkout: metadata.checkout || "",
      ts: new Date().toISOString(),
    }));
    await storeAbandonedCart(env, parsed.id, metadata).catch(() => {});
    return json({ clientSecret: parsed.client_secret, customerId });
  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      fn: "create-payment-intent",
      msg: err.message,
      ts: new Date().toISOString(),
    }));
    return json({ error: err.message }, 500);
  }
}

export function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// N'ajoute au payload Stripe que les champs d'attribution/identité réellement présents
// (CAPI match quality Meta + attribution Google Ads). Évite d'encombrer la metadata de clés vides.
function attribMeta(m = {}) {
  const out = {};
  const put = (k, v) => { const s = String(v ?? "").trim(); if (s) out[`metadata[${k}]`] = s.slice(0, 480); };
  put("fbp", m.fbp); put("fbc", m.fbc); put("fbclid", m.fbclid); put("gclid", m.gclid);
  put("channel", m.channel);
  put("utm_source", m.utm_source); put("utm_medium", m.utm_medium); put("utm_campaign", m.utm_campaign);
  put("phone", m.phone); put("prenom", m.prenom); put("nom", m.nom);
  return out;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
