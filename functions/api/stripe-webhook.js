// Cloudflare Pages Function — POST /api/stripe-webhook
// Reçoit les événements Stripe et notifie l'hôte par email
//
// Événements gérés :
//   payment_intent.succeeded    → confirme la réservation Beds24 correspondante
//   checkout.session.completed  → caution voyageur sécurisée
//
// Secret à ajouter dans Cloudflare Pages :
//   STRIPE_WEBHOOK_SECRET (obtenu dans Stripe Dashboard → Webhooks)

const BEDS24_V2_BOOKINGS = "https://beds24.com/api/v2/bookings";
const BEDS24_AUTH_TOKEN  = "https://beds24.com/api/v2/authentication/token";

// GA4 — server-side event via Measurement Protocol
// Doc : https://developers.google.com/analytics/devguides/collection/protocol/ga4
// Requiert un API Secret créé dans GA4 Admin → Data Streams → Mesurement Protocol API secrets
async function ga4Event(env, eventName, params = {}, clientId = null) {
  const measurementId = "G-N9BM709ZBL";
  const apiSecret = env.GA4_API_SECRET;
  if (!apiSecret) {
    console.log(`[ga4] GA4_API_SECRET manquant — event "${eventName}" ignoré`);
    return;
  }
  // client_id stable mais anonymisé : on prend le bookingId Stripe (unique, non-PII)
  const cid = clientId || `srv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: cid,
          non_personalized_ads: true,
          events: [{ name: eventName, params }],
        }),
      }
    );
  } catch (e) {
    console.error(`[ga4] Erreur envoi event ${eventName}:`, e.message);
  }
}

// Échange le refreshToken contre un access token Beds24 (valable 24h)
async function getBeds24Token(env) {
  if (env.BEDS24_REFRESH_TOKEN) {
    const res  = await fetch(BEDS24_AUTH_TOKEN, { headers: { refreshToken: env.BEDS24_REFRESH_TOKEN } });
    const data = await res.json();
    if (!data.token) throw new Error("Beds24 refresh token invalide ou expiré");
    return data.token;
  }
  if (env.BEDS24_TOKEN) return env.BEDS24_TOKEN;
  throw new Error("BEDS24_TOKEN ou BEDS24_REFRESH_TOKEN manquant");
}

// Confirme une réservation Beds24 (passe le status à "confirmed")
async function confirmBeds24Booking(bookingId, env) {
  const token = await getBeds24Token(env);
  const res = await fetch(BEDS24_V2_BOOKINGS, {
    method:  "PATCH",
    headers: { token, "Content-Type": "application/json" },
    body:    JSON.stringify([{ id: bookingId, status: "confirmed" }]),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Beds24 PATCH échoué (${res.status}): ${JSON.stringify(data)}`);
  console.log(`[webhook] Beds24 booking ${bookingId} → confirmed`, JSON.stringify(data));
  return data;
}

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json" },
});

const NOMS = {
  amaryllis:  "Villa Amaryllis",
  schoelcher: "Bellevue Schœlcher",
  geko:       "Géko",
  mabouya:    "Mabouya",
  zandoli:    "Zandoli",
  iguana:     "Villa Iguana",
  nogent:     "Appartement Nogent",
};

// Vérification signature Stripe (HMAC SHA-256)
async function verifyStripeSignature(body, sigHeader, secret) {
  if (!sigHeader || !secret) return false;

  // Parser robuste : split sur la première "=" seulement
  const parts = {};
  for (const part of sigHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx !== -1) parts[part.slice(0, idx)] = part.slice(idx + 1);
  }
  const timestamp = parts.t;
  const sig = parts.v1;
  if (!timestamp || !sig) return false;

  // Tolérance 5 minutes
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) return false;

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  return expected === sig;
}

async function sendEmail(env, { subject, html, to }) {
  if (!env.RESEND_API_KEY) {
    console.error("[webhook] RESEND_API_KEY absent — email non envoyé");
    return;
  }
  const recipient = to || env.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM || "Amaryllis <notifications@mail.villamaryllis.com>",
      to: Array.isArray(recipient) ? recipient : [recipient],
      subject,
      html,
    }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    console.error(`[webhook] Resend erreur ${r.status}:`, err);
  }
}

// Email de confirmation automatique envoyé au voyageur après paiement
async function sendConfirmationToGuest(env, { bienNom, voyageur, email, checkin, checkout, amount, bookingId }) {
  if (!email || !email.includes("@")) {
    console.log("[webhook] Pas d'email voyageur — confirmation non envoyée");
    return;
  }
  await sendEmail(env, {
    to: email,
    subject: `✅ Réservation confirmée — ${bienNom}`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d0">
        <!-- Header -->
        <div style="background:#0e3b3a;padding:36px 32px;text-align:center">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;color:rgba(250,245,233,0.6);text-transform:uppercase">Amaryllis Locations</p>
          <h1 style="margin:0;font-size:26px;color:#faf5e9;font-weight:300">Réservation confirmée</h1>
          <p style="margin:12px 0 0;font-size:28px">✅</p>
        </div>

        <!-- Body -->
        <div style="padding:32px">
          <p style="font-size:16px;color:#0e3b3a;margin-top:0">Bonjour ${voyageur},</p>
          <p style="font-size:14px;color:#4a3f35;line-height:1.7">
            Votre paiement a bien été reçu et votre séjour à <strong>${bienNom}</strong> est confirmé.
            Nous avons hâte de vous accueillir !
          </p>

          <!-- Récapitulatif -->
          <div style="background:#f8f5ef;border-radius:12px;padding:20px 24px;margin:24px 0">
            <p style="margin:0 0 14px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7a6b5a;font-weight:700">Récapitulatif de votre séjour</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:7px 0;color:#7a6b5a;width:45%">Propriété</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${bienNom}</td></tr>
              <tr><td style="padding:7px 0;color:#7a6b5a">Arrivée</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${checkin}</td></tr>
              <tr><td style="padding:7px 0;color:#7a6b5a">Départ</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${checkout}</td></tr>
              <tr><td style="padding:7px 0;color:#7a6b5a">Montant payé</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${amount}</td></tr>
              ${bookingId ? `<tr><td style="padding:7px 0;color:#7a6b5a">N° réservation</td><td style="padding:7px 0;font-size:12px;color:#5a4a3a">${bookingId}</td></tr>` : ""}
            </table>
          </div>

          <!-- Check-in info -->
          <div style="border-left:3px solid #14b8a6;padding-left:16px;margin:20px 0">
            <p style="margin:0 0 6px;font-weight:700;color:#0e3b3a;font-size:14px">📍 Informations d'arrivée</p>
            <p style="margin:0;font-size:13px;color:#4a3f35;line-height:1.6">
              Check-in à partir de <strong>17h00</strong> · Check-out avant <strong>12h00</strong><br/>
              Vous recevrez les instructions d'accès et le code de la boîte à clés par email dans les 24h avant votre arrivée.
            </p>
          </div>

          <p style="font-size:13px;color:#4a3f35;line-height:1.7">
            Pour toute question, n'hésitez pas à nous contacter directement :<br/>
            📱 WhatsApp : <a href="https://wa.me/33610880772" style="color:#0e3b3a;font-weight:700">+33 6 10 88 07 72</a><br/>
            ✉️ Email : <a href="mailto:contact@villamaryllis.com" style="color:#0e3b3a;font-weight:700">contact@villamaryllis.com</a>
          </p>

          <p style="font-size:14px;color:#0e3b3a;margin-bottom:0">À très bientôt,<br/><strong>L'équipe Amaryllis Locations</strong></p>
        </div>

        <!-- Footer -->
        <div style="background:#f8f5ef;padding:16px 32px;text-align:center;border-top:1px solid #e8e0d0">
          <p style="margin:0;font-size:11px;color:#7a6b5a">Amaryllis Locations · <a href="https://villamaryllis.com" style="color:#7a6b5a">villamaryllis.com</a> · contact@villamaryllis.com</p>
        </div>
      </div>
    `,
  });
  console.log(`[webhook] Email confirmation envoyé → ${email}`);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  // Vérification de signature HMAC — OBLIGATOIRE (STRIPE_WEBHOOK_SECRET requis en production)
  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET non configuré — requête rejetée pour sécurité");
    return json({ error: "Webhook not configured" }, 503);
  }
  const valid = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    console.error("[webhook] Signature Stripe invalide — possible tentative de fraude");
    return json({ error: "Invalid signature" }, 400);
  }

  let event;
  try { event = JSON.parse(rawBody); }
  catch { return json({ error: "Invalid JSON" }, 400); }

  // ── payment_intent.succeeded → confirmer Beds24 + email voyageur ────────────
  if (event.type === "payment_intent.succeeded") {
    const pi        = event.data?.object;
    const meta      = pi?.metadata || {};
    const bookingId = meta.bookingId || meta.beds24Id || "";
    const bienId    = meta.bienId    || "";
    const bienNom   = NOMS[bienId]   || bienId || "Amaryllis Locations";
    const voyageur  = meta.voyageur  || meta.nom || "";
    const guestEmail = meta.email    || "";
    const checkin   = meta.checkin   || "?";
    const checkout  = meta.checkout  || "?";
    const amount    = pi?.amount     ? `${(pi.amount / 100).toFixed(0)} €` : "?";

    // 1. Confirmer la réservation Beds24
    if (bookingId) {
      try {
        await confirmBeds24Booking(bookingId, env);
        console.log(`[webhook] Réservation Beds24 ${bookingId} confirmée via webhook`);
      } catch (e) {
        // On logue l'erreur mais on retourne 200 pour éviter les retries Stripe infinis
        console.error(`[webhook] Erreur confirmation Beds24 ${bookingId}:`, e.message);
      }
    } else {
      console.log("[webhook] payment_intent.succeeded sans bookingId — Beds24 ignoré");
    }

    // 2. Email de confirmation au voyageur
    await sendConfirmationToGuest(env, { bienNom, voyageur, email: guestEmail, checkin, checkout, amount, bookingId });

    // 3. GA4 server-side — event "booking_completed" (la conversion macro la plus précieuse)
    await ga4Event(env, "booking_completed", {
      bien_id: bienId || "unknown",
      booking_id: bookingId || "unknown",
      value: pi?.amount ? pi.amount / 100 : 0,
      currency: pi?.currency?.toUpperCase() || "EUR",
      channel: meta.channel || "direct",
      checkin,
      checkout,
    }, `booking-${bookingId || pi.id}`);

    return json({ ok: true, type: event.type });
  }

  // ── checkout.session.completed → caution sécurisée ──────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;

    // Les metadata sont directement sur payment_intent_data de la session Checkout
    // (passées lors de la création dans caution-checkout.js)
    // Pas besoin de re-fetch le PaymentIntent séparément
    const meta = session?.metadata || {};

    const type = meta.type;
    if (type !== "caution") return json({ ok: true, ignored: true });

    const bienId   = meta.bienId   || "?";
    const voyageur = meta.voyageur || "voyageur";
    const checkin  = meta.checkin  || "?";
    const checkout = meta.checkout || "?";
    const amount   = session.amount_total ? `${(session.amount_total / 100).toFixed(0)} €` : "?";
    const bienNom  = NOMS[bienId] || bienId;

    console.log(`[webhook] Caution sécurisée: ${bienNom} — ${voyageur} — ${amount}`);

    await sendEmail(env, {
      subject: `🔒 Caution sécurisée — ${bienNom} (${voyageur})`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f8f5ef;padding:32px 24px;border-radius:12px">
          <h2 style="color:#0e3b3a;margin-top:0">🔒 Caution sécurisée</h2>
          <p>La caution de <strong>${amount}</strong> pour <strong>${voyageur}</strong> a bien été pré-autorisée.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0">
            <tr><td style="padding:8px 0;color:#5a4a3a">Bien</td><td style="padding:8px 0;font-weight:700;color:#0e3b3a">${bienNom}</td></tr>
            <tr><td style="padding:8px 0;color:#5a4a3a">Voyageur</td><td style="padding:8px 0;font-weight:700;color:#0e3b3a">${voyageur}</td></tr>
            <tr><td style="padding:8px 0;color:#5a4a3a">Séjour</td><td style="padding:8px 0;font-weight:700;color:#0e3b3a">${checkin} → ${checkout}</td></tr>
            <tr><td style="padding:8px 0;color:#5a4a3a">Montant bloqué</td><td style="padding:8px 0;font-weight:700;color:#0e3b3a">${amount}</td></tr>
            <tr><td style="padding:8px 0;color:#5a4a3a">Libération auto</td><td style="padding:8px 0;color:#14b8a6;font-weight:700">J+3 après ${checkout}</td></tr>
          </table>
          <p style="font-size:13px;color:#7a6b5a">La CB du voyageur n'est PAS débitée. En cas de dommage, connecte-toi à l'admin → Cautions pour débiter le montant souhaité.</p>
          <a href="https://villamaryllis.com/admin" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#0e3b3a;color:#faf5e9;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">Ouvrir l'admin →</a>
        </div>
      `,
    });
  }

  return json({ ok: true, type: event.type });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
}
