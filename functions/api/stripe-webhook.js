import { resendFrom } from "./_email.js";
import { sendEmail as sendEmailHelper } from "./_sendEmail.js";
import { capiPurchase } from "./_metaCapi.js";
// Cloudflare Pages Function — POST /api/stripe-webhook
// Reçoit les événements Stripe et notifie l'hôte par email
//
// Événements gérés :
//   payment_intent.succeeded    → confirme la réservation Beds24 correspondante
//   checkout.session.completed  → caution voyageur sécurisée
//
// Secret à ajouter dans Cloudflare Pages :
//   STRIPE_WEBHOOK_SECRET (obtenu dans Stripe Dashboard → Webhooks)

// DDL idempotent — échéancier des paiements en 2 fois (acompte déjà payé, solde à venir).
async function ensurePaymentScheduleTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS payment_schedule (
    deposit_pi_id     TEXT PRIMARY KEY,
    bien_id           TEXT,
    bien_nom          TEXT,
    email             TEXT,
    prenom            TEXT,
    customer_id       TEXT,
    payment_method_id TEXT,
    balance_amount    INTEGER,
    currency          TEXT DEFAULT 'eur',
    checkin           TEXT,
    checkout          TEXT,
    due_date          TEXT,
    status            TEXT DEFAULT 'pending',
    balance_pi_id     TEXT,
    attempts          INTEGER DEFAULT 0,
    last_error        TEXT,
    created_at        INTEGER NOT NULL DEFAULT (unixepoch())
  )`).run();
}

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
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: cid,
          non_personalized_ads: true,
          events: [{ name: eventName, params }],
        }),
      }
    );
    if (!res.ok) console.warn(`[ga4] HTTP ${res.status} pour event "${eventName}"`);
    else console.log(`[ga4] event "${eventName}" envoyé (${res.status})`);
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

async function sendEmail(env, { subject, html, to, booking_id, bien_id, category = "internal", template = "stripe_confirmation" }) {
  if (!env.RESEND_API_KEY) {
    console.error("[webhook] RESEND_API_KEY absent — email non envoyé");
    return;
  }
  const recipient = to || env.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
  const toArr = Array.isArray(recipient) ? recipient : String(recipient).split(",").map(s => s.trim()).filter(Boolean);
  const result = await sendEmailHelper(env, {
    to: toArr,
    subject,
    html,
    template,
    category,
    booking_id: booking_id || null,
    bien_id: bien_id || null,
  });
  if (!result.ok) {
    console.error(`[webhook] Resend erreur:`, result.error);
  }
}

// Formate une date ISO (YYYY-MM-DD) en JJ/MM/AAAA pour l'affichage FR.
const fmtFrDate = (iso) => /^\d{4}-\d{2}-\d{2}/.test(iso || "") ? iso.slice(0, 10).split("-").reverse().join("/") : (iso || "?");

// Email de confirmation automatique envoyé au voyageur après paiement
async function sendConfirmationToGuest(env, { bienNom, voyageur, email, checkin, checkout, amount, bookingId, twoX = null }) {
  if (!email || !email.includes("@")) {
    console.log("[webhook] Pas d'email voyageur — confirmation non envoyée");
    return;
  }
  // Paiement en 2 fois : on remplace la ligne « Montant payé » par le détail acompte/solde
  // et on ajoute un encart rappelant le prélèvement automatique du solde à J-30.
  const montantRows = twoX
    ? `<tr><td style="padding:7px 0;color:#7a6b5a;width:45%">Acompte payé</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${twoX.acompte} €</td></tr>
              <tr><td style="padding:7px 0;color:#7a6b5a">Solde restant</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${twoX.solde} €</td></tr>
              <tr><td style="padding:7px 0;color:#7a6b5a">Total du séjour</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${twoX.total} €</td></tr>`
    : `<tr><td style="padding:7px 0;color:#7a6b5a">Montant payé</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${amount}</td></tr>`;
  const twoXNote = twoX
    ? `<div style="background:rgba(20,184,166,0.10);border-left:3px solid #14b8a6;border-radius:8px;padding:14px 18px;margin:20px 0">
            <p style="margin:0;font-size:13px;color:#0e3b3a;line-height:1.6">💳 <strong>Paiement en 2 fois</strong> — le solde de <strong>${twoX.solde} €</strong> sera prélevé automatiquement sur votre carte le <strong>${fmtFrDate(twoX.dueDate)}</strong> (30 jours avant votre arrivée). Vous n'avez aucune démarche à effectuer.</p>
          </div>`
    : "";
  await sendEmail(env, {
    to: email,
    subject: `✅ Réservation confirmée — ${bienNom}`,
    booking_id: bookingId || null,
    bien_id: null,
    category: "client",
    template: "stripe_confirmation",
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
              ${montantRows}
              ${bookingId ? `<tr><td style="padding:7px 0;color:#7a6b5a">N° réservation</td><td style="padding:7px 0;font-size:12px;color:#5a4a3a">${bookingId}</td></tr>` : ""}
            </table>
          </div>
          ${twoXNote}

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

// Alerte hôte (email + ntfy) — FALLBACK fiable côté serveur. Le front-end `notify-booking`
// envoie déjà cette alerte juste après paiement, MAIS il ne tourne pas si le voyageur quitte
// la page (ex: bug sur la page caution) → l'hôte n'était alors jamais prévenu. Ce relais
// garantit l'alerte. Dédup atomique via `host_notified` : un seul des deux flux émet (le
// premier qui passe `0 → 1` gagne ; D1 sérialise les UPDATE → jamais de double notification).
async function notifyHostOnce(env, { paymentIntentId, bienId, bienNom, voyageur, email, checkin, checkout, amount, twoX = null }) {
  const db = env.revenue_manager;
  if (db) {
    try {
      const claim = await db.prepare(
        "UPDATE direct_bookings SET host_notified=1 WHERE payment_intent_id=? AND host_notified=0"
      ).bind(paymentIntentId).run();
      if (!claim?.meta?.changes) return; // déjà notifié par le front-end notify-booking → on s'arrête
    } catch { /* colonne absente (avant migration) → fail-open : on notifie quand même */ }
  }
  const montantRows = twoX
    ? `<tr><td style="padding:4px 16px 4px 0">Acompte payé</td><td style="padding:4px 0;font-weight:700">${twoX.acompte} €</td></tr>
       <tr><td style="padding:4px 16px 4px 0">Solde (auto le ${fmtFrDate(twoX.dueDate)})</td><td style="padding:4px 0;font-weight:700">${twoX.solde} €</td></tr>
       <tr><td style="padding:4px 16px 4px 0">Total séjour</td><td style="padding:4px 0;font-weight:700">${twoX.total} €</td></tr>`
    : `<tr><td style="padding:4px 16px 4px 0">Montant payé</td><td style="padding:4px 0;font-weight:700">${amount}</td></tr>`;
  const ligne = `${voyageur || "Voyageur"} · ${checkin} → ${checkout} · ${twoX ? `acompte ${twoX.acompte}€ / total ${twoX.total}€` : amount}`;
  try {
    await sendEmail(env, {
      to: env.NOTIFICATION_EMAIL || "vinsmaf@hotmail.com,contact@villamaryllis.com",
      subject: `🎉 NOUVELLE RÉSA — ${bienNom}`,
      booking_id: paymentIntentId, bien_id: bienId, category: "internal", template: "notify_booking_host",
      html: `<div style="font-family:Georgia,serif;color:#2b2b2b;line-height:1.7">
        <h2 style="color:#0e3b3a">🎉 Nouvelle réservation directe</h2>
        <p style="font-size:16px"><strong>${bienNom}</strong></p>
        <table style="font-size:15px;border-collapse:collapse">
          <tr><td style="padding:4px 16px 4px 0">Voyageur</td><td><strong>${voyageur || "—"}</strong></td></tr>
          <tr><td style="padding:4px 16px 4px 0">Email</td><td>${email || "—"}</td></tr>
          <tr><td style="padding:4px 16px 4px 0">Dates</td><td>${checkin} → ${checkout}</td></tr>
          ${montantRows}
        </table>
        <p style="font-size:13px;color:#0e7a5a;margin-top:14px">✅ Dates bloquées automatiquement sur Airbnb + Booking (sync iCal).</p>
      </div>`,
    });
  } catch (e) { console.error("[webhook] alerte hôte:", e.message); }
  if (env.NTFY_TOPIC) {
    try {
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: { Title: `🎉 NOUVELLE RESA - ${bienNom}`, Priority: "high", Tags: "tada,money_with_wings" },
        body: ligne,
      });
    } catch { /* fail-silent */ }
  }
}

// Stocke une réservation DIRECTE en D1 (pour emails pré-arrivée / post-séjour).
// Fail-silent : ne casse jamais le webhook.
async function storeDirectBooking(env, { paymentIntentId, email, voyageur, bienId, bienNom, checkin, checkout }) {
  const db = env.revenue_manager;
  if (!db || !email || !email.includes("@") || !checkin) return;
  try {
    // Table partagée avec notify-booking.js (clé = payment_intent_id).
    await db.prepare(`CREATE TABLE IF NOT EXISTS direct_bookings (
      payment_intent_id TEXT PRIMARY KEY, bien_nom TEXT, voyageur TEXT,
      total INTEGER, depot INTEGER, checkin TEXT, checkout TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      email TEXT, prenom TEXT, bien_id TEXT,
      prearrivee_sent INTEGER DEFAULT 0, poststay_sent INTEGER DEFAULT 0,
      host_notified INTEGER DEFAULT 0
    )`).run();
    const prenom = String(voyageur || "").trim().split(/\s+/)[0] || "";
    // Clé stable : pi.id si dispo, sinon fallback déterministe (évite les doublons).
    const pid = paymentIntentId || `direct-${email}-${checkin}`;
    // Upsert : fusionne avec la ligne créée par notify-booking (même payment_intent_id),
    // en y ajoutant l'email/prénom indispensables aux emails pré-arrivée / post-séjour.
    await db.prepare(`INSERT INTO direct_bookings
        (payment_intent_id, email, prenom, bien_id, bien_nom, voyageur, checkin, checkout)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(payment_intent_id) DO UPDATE SET
        email=excluded.email, prenom=excluded.prenom, bien_id=excluded.bien_id,
        bien_nom=excluded.bien_nom, checkout=excluded.checkout`)
      .bind(pid, email, prenom, bienId || "", bienNom || "", voyageur || "", checkin, checkout || "").run();
  } catch (e) {
    console.error("[direct-booking] D1:", e.message);
  }
}

// Persiste l'échéancier d'un paiement en 2 fois après réussite de l'acompte.
async function storePaymentSchedule(env, pi) {
  const db = env.revenue_manager;
  if (!db || !pi || pi.metadata?.pay_plan !== "2x") return;
  try {
    await ensurePaymentScheduleTable(db);
    const balance = parseInt(pi.metadata.balance_amount || "0", 10); // euros
    if (!balance || !pi.customer || !pi.payment_method) {
      console.warn("[webhook] 2x schedule incomplet", pi.id, !!pi.customer, !!pi.payment_method, balance);
      return;
    }
    const prenom = String(pi.metadata.voyageur || "").trim().split(/\s+/)[0] || "";
    await db.prepare(`INSERT INTO payment_schedule
        (deposit_pi_id, bien_id, bien_nom, email, prenom, customer_id, payment_method_id,
         balance_amount, currency, checkin, checkout, due_date, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'pending')
      ON CONFLICT(deposit_pi_id) DO NOTHING`)
      .bind(
        pi.id, pi.metadata.bienId || "", pi.metadata.bienNom || pi.metadata.logements || "",
        pi.metadata.email || "", prenom, pi.customer, pi.payment_method,
        balance, pi.currency || "eur",
        pi.metadata.checkin || "", pi.metadata.checkout || "", pi.metadata.due_date || ""
      ).run();
    console.log("[webhook] payment_schedule créé", pi.id, "solde", balance, "due", pi.metadata.due_date);
  } catch (e) { console.error("[webhook] payment_schedule:", e.message); }
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

    // ── Réservation GROUPÉE (offre résidence : plusieurs logements iCal, pas Beds24) ──
    // Ces logements (Sainte-Luce) ne se bloquent pas automatiquement → alerte hôte impérative.
    if (meta.type === "group") {
      const logements = meta.logements || "Zandoli + Géko + Mabouya";
      const guests    = meta.guests || "?";
      try {
        await sendEmail(env, {
          subject: `🚨 Résa GROUPÉE payée — BLOQUER les calendriers (${logements})`,
          booking_id: pi.id,
          bien_id: "groupe",
          category: "internal",
          template: "stripe_group_host",
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
            <h2 style="color:#0e3b3a">Réservation groupée payée ✅ — action requise</h2>
            <p style="font-size:14px;color:#b91c1c"><strong>Bloquez immédiatement</strong> les calendriers Airbnb/Booking des logements ci-dessous pour éviter une double réservation (ils ne se bloquent pas automatiquement) :</p>
            <p style="font-size:18px;font-weight:700;color:#0e3b3a">${logements}</p>
            <table style="font-size:14px;color:#4a3f35">
              <tr><td style="padding:4px 0">Voyageur</td><td style="padding:4px 0;font-weight:700">${voyageur || "?"}</td></tr>
              <tr><td style="padding:4px 0">Email</td><td style="padding:4px 0">${guestEmail || "?"}</td></tr>
              <tr><td style="padding:4px 0">Dates</td><td style="padding:4px 0;font-weight:700">${checkin} → ${checkout}</td></tr>
              <tr><td style="padding:4px 0">Voyageurs</td><td style="padding:4px 0">${guests}</td></tr>
              <tr><td style="padding:4px 0">Montant payé</td><td style="padding:4px 0;font-weight:700">${amount}</td></tr>
              <tr><td style="padding:4px 0">Paiement</td><td style="padding:4px 0;font-size:12px">${pi.id}</td></tr>
            </table>
          </div>`,
        });
      } catch (e) { console.error("[webhook] alerte hôte groupe:", e.message); }
      await sendConfirmationToGuest(env, { bienNom: logements, voyageur, email: guestEmail, checkin, checkout, amount, bookingId: pi.id });
      // grpValue déclaré au scope du bloc « groupe » : réutilisé plus bas par capiPurchase (L~364).
      // (Résa groupée = toujours paiement intégral, pas de 2× → pi.amount fait foi.)
      const grpValue = pi?.amount ? pi.amount / 100 : 0;
      {
        await ga4Event(env, "purchase", {
          transaction_id: pi.id, value: grpValue, currency: "EUR",
          items: [{ item_id: "groupe", item_name: logements || "Réservation groupe", price: grpValue, quantity: 1 }],
          channel: "direct-groupe",
        }, `booking-${pi.id}`);
        await ga4Event(env, "booking_completed", { bien_id: "groupe", booking_id: pi.id, value: grpValue, currency: "EUR", channel: "direct-groupe", checkin });
      }
      await storeDirectBooking(env, { paymentIntentId: pi.id, email: guestEmail, voyageur, bienId: "groupe", bienNom: logements, checkin, checkout });
      await capiPurchase(env, { eventId: pi.id, value: grpValue, email: guestEmail, bienId: "groupe", bienNom: logements || "Réservation groupe" });
      return json({ received: true, group: true });
    }

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

    // Paiement en 2 fois : détail acompte/solde pour le mail voyageur ET l'alerte hôte.
    const twoX = meta.pay_plan === "2x" ? {
      acompte: Math.round((pi.amount || 0) / 100),
      solde: parseInt(meta.balance_amount || "0", 10),
      total: parseInt(meta.full_total || "0", 10) || (Math.round((pi.amount || 0) / 100) + parseInt(meta.balance_amount || "0", 10)),
      dueDate: meta.due_date || "",
    } : null;

    // 2. Email de confirmation au voyageur
    await sendConfirmationToGuest(env, { bienNom, voyageur, email: guestEmail, checkin, checkout, amount, bookingId, twoX });

    // 2b. Stocke la résa DIRECTE en D1 → permet les emails pré-arrivée (J-3) et post-séjour (J+1)
    await storeDirectBooking(env, { paymentIntentId: pi.id, email: guestEmail, voyageur, bienId, bienNom, checkin, checkout });

    // 2b-bis. Alerte hôte fiable (relais serveur, dédup atomique avec le front-end notify-booking)
    await notifyHostOnce(env, { paymentIntentId: pi.id, bienId, bienNom, voyageur, email: guestEmail, checkin, checkout, amount, twoX });

    // 2c. Si paiement en 2 fois, persiste le solde à prélever (off-session) en D1
    await storePaymentSchedule(env, pi).catch(() => {});

    // 3. GA4 server-side — fiable (immunisé au Consent Mode, contrairement au gtag client).
    // ⚠️ Paiement en 2 fois : la conversion pub (GA4 purchase + Meta CAPI) doit refléter la
    // VALEUR TOTALE de la réservation, pas l'acompte 30% — sinon le ROAS est sous-compté et
    // Google/Meta optimisent sur une valeur fausse. `full_total` (euros) est posé en metadata
    // par create-payment-intent. Le solde débité plus tard (charge-balance) NE refire AUCUN
    // event → la valeur totale est comptée UNE seule fois, à la confirmation (acompte). Le
    // client (Merci.jsx / BookingModal) envoie déjà `total` → même event_id, valeur cohérente.
    const isTwoX = pi?.metadata?.pay_plan === "2x";
    const fullTotal2x = parseInt(pi?.metadata?.full_total || "0", 10);
    const piValue = (isTwoX && fullTotal2x > 0) ? fullTotal2x : (pi?.amount ? pi.amount / 100 : 0);
    const piCur = pi?.currency?.toUpperCase() || "EUR";
    const txId = bookingId || pi.id;
    // 3a. "purchase" : événement e-commerce STANDARD GA4 → à marquer comme conversion clé.
    //     GA4 dédoublonne par transaction_id, donc cohabite sans risque avec le purchase client.
    await ga4Event(env, "purchase", {
      transaction_id: txId,
      value: piValue,
      currency: piCur,
      items: [{ item_id: bienId || "unknown", item_name: bienNom || bienId || "Réservation directe", price: piValue, quantity: 1 }],
      channel: meta.channel || "direct",
    }, `booking-${txId}`);
    // 3b. "booking_completed" : conservé pour l'historique / rapports existants.
    await ga4Event(env, "booking_completed", {
      bien_id: bienId || "unknown",
      booking_id: bookingId || "unknown",
      value: piValue,
      currency: piCur,
      channel: meta.channel || "direct",
      checkin,
      checkout,
    }, `booking-${txId}`);

    // 3c. Meta CAPI (server-side) — déduplication via event_id = pi.id (même valeur que Pixel client)
    await capiPurchase(env, { eventId: pi.id, value: piValue, currency: piCur, email: guestEmail, bienId, bienNom });

    // 4. Incrémenter le code promo s'il y en avait un (best-effort, n'échoue jamais)
    if (meta.promo_code && env.revenue_manager) {
      try {
        await env.revenue_manager.prepare(
          "UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ? AND used_count < max_uses"
        ).bind(meta.promo_code).run();
        console.log(`[webhook] promo_code ${meta.promo_code} → used_count +1`);
      } catch (e) {
        console.error(`[webhook] erreur incrément promo_code:`, e.message);
      }
    }

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

    // ── Service additionnel payé (écran TV / page /services) → notif hôte + D1 ──
    if (type === "service") {
      const bienNom = meta.bienNom || NOMS[meta.bienId] || meta.bienId || "?";
      const label   = meta.serviceLabel || "Service";
      const amount  = session.amount_total ? `${(session.amount_total / 100).toFixed(0)} €` : "?";
      const contact = meta.contact || "";
      const email   = session.customer_details?.email || meta.email || "";
      try {
        const db = env.revenue_manager;
        if (db) {
          await db.prepare(`CREATE TABLE IF NOT EXISTS service_orders (
            id TEXT PRIMARY KEY, bien_id TEXT, bien_nom TEXT, service_id TEXT, service_label TEXT,
            amount INTEGER, contact TEXT, email TEXT, status TEXT,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run();
          await db.prepare(`INSERT OR REPLACE INTO service_orders
            (id, bien_id, bien_nom, service_id, service_label, amount, contact, email, status)
            VALUES (?,?,?,?,?,?,?,?,?)`).bind(
            session.id, meta.bienId || "?", bienNom, meta.serviceId || "?", label,
            session.amount_total || 0, contact, email, "paye"
          ).run();
        }
      } catch (e) { console.warn("[webhook] service_orders:", e.message); }
      await sendEmail(env, {
        subject: `🛎️ Service vendu — ${label} · ${bienNom} (${amount})`,
        booking_id: session.id,
        bien_id: meta.bienId || null,
        category: "internal",
        template: "stripe_service_host",
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#0e3b3a">🛎️ Nouveau service payé</h2>
          <p><strong>${label}</strong> — <strong>${amount}</strong><br>Logement : <strong>${bienNom}</strong>${contact ? `<br>Note du voyageur : ${contact}` : ""}${email ? `<br>Email : ${email}` : ""}</p>
          <p style="font-size:13px;color:#7a6b5a">À honorer auprès du voyageur. Détails dans Stripe + admin.</p></div>`,
      }).catch(() => {});
      // Push mobile instantané (ntfy)
      try {
        if (env.NTFY_TOPIC) {
          await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
            method: "POST",
            headers: { Title: `Service vendu — ${label}`, Tags: "money_with_wings", Priority: "high" },
            body: `${bienNom} · ${amount}${contact ? ` · ${contact}` : ""}`,
          });
        }
      } catch { /* non bloquant */ }
      return json({ ok: true, type: "service" });
    }

    // ── Acompte / solde (Payment Links devis) → maj statut devis_paiements ──
    if (type === "acompte" || type === "solde") {
      // id du devis = lien d'acompte (= row id). Pour le solde, le cron a mis devisId.
      const devisId = type === "solde" ? (meta.devisId || session.payment_link) : session.payment_link;
      const db = env.revenue_manager;
      if (db && devisId) {
        try {
          await db.prepare("UPDATE devis_paiements SET status=? WHERE id=?")
            .bind(type === "acompte" ? "acompte_paye" : "solde_paye", devisId).run();
        } catch (e) { console.warn("[webhook] devis_paiements update:", e.message); }
      }
      const bienNom = NOMS[meta.bienId] || meta.bienId || "?";
      const montant = session.amount_total ? `${(session.amount_total / 100).toFixed(0)} €` : "?";
      await sendEmail(env, {
        subject: `💶 ${type === "acompte" ? "Acompte" : "Solde"} payé — ${bienNom} (${meta.voyageur || "voyageur"})`,
        booking_id: devisId || null,
        bien_id: meta.bienId || null,
        category: "internal",
        template: "stripe_acompte_solde_host",
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px"><h2 style="color:#0e3b3a">💶 ${type === "acompte" ? "Acompte reçu" : "Solde reçu — séjour soldé ✅"}</h2><p><strong>${bienNom}</strong> — ${meta.voyageur || "voyageur"}<br>${meta.checkin || "?"} → ${meta.checkout || "?"}<br>Montant : <strong>${montant}</strong></p></div>`,
      }).catch(() => {});
      return json({ ok: true, type, devis: devisId });
    }

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
      booking_id: session.id,
      bien_id: bienId || null,
      category: "internal",
      template: "stripe_caution_host",
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
