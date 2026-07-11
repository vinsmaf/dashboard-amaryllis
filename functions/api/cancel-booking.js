// Cloudflare Pages Function — POST /api/cancel-booking
// 🔒 Admin UNIQUEMENT : annule une réservation directe (Stripe LIVE, argent réel).
//
// Body : { paymentIntentId, refundAmount? }
//   paymentIntentId : PI Stripe de la résa (direct_bookings.payment_intent_id, PAS le "direct-" préfixé)
//   refundAmount    : montant à rembourser en EUROS (0 ou absent = pas de remboursement).
//                     Décidé par l'admin (politique CGV = indicatif, jamais appliqué seul).
//
// Orchestration :
//   1. Charge la résa (direct_bookings) — 404 si introuvable ou déjà annulée.
//   2. Remboursement Stripe partiel/total si refundAmount > 0 (refunds.create).
//   3. Libère la caution pré-autorisée si une existe (caution_schedule → cancelHold).
//   4. Annule côté Beds24 si Nogent (seul bien synchronisé Beds24 — cf. règle absolue).
//   5. Marque direct_bookings.status='cancelled' (libère les dates côté get-availability).
//   6. Événement GA4 "booking_cancelled" (Measurement Protocol, même client_id que le purchase).
//   7. Envoie l'email d'annulation au voyageur.
//
// Chaque étape est best-effort et rapportée dans la réponse — un échec partiel (ex. Beds24
// injoignable) ne doit pas bloquer le reste ni cacher l'information à l'admin.

import { verifyBearer } from "./_adminauth.js";
import { cancelHold } from "./_caution.js";
import { sendGuestEmail } from "./send-guest-email.js";
import { ga4Event } from "./_ga4event.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const fmtDate = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || "?";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

async function refundPayment(sk, paymentIntentId, amountEur) {
  const body = new URLSearchParams({ payment_intent: paymentIntentId });
  if (amountEur > 0) body.set("amount", String(Math.round(amountEur * 100)));
  const res = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const parsed = await res.json();
  if (parsed.error) return { ok: false, error: parsed.error.message };
  return { ok: true, refundId: parsed.id, status: parsed.status };
}

async function releaseCaution(db, sk, bookingPiId) {
  const row = await db.prepare(
    "SELECT status, caution_pi_id FROM caution_schedule WHERE booking_pi_id = ?"
  ).bind(bookingPiId).first();
  if (!row) return { ok: true, skipped: "aucune caution associée" };
  if (row.status === "released" || row.status === "failed") return { ok: true, skipped: `déjà ${row.status}` };
  if (row.status === "held" && row.caution_pi_id) {
    await cancelHold(sk, row.caution_pi_id);
  }
  await db.prepare("UPDATE caution_schedule SET status='released' WHERE booking_pi_id = ?").bind(bookingPiId).run();
  return { ok: true, previousStatus: row.status };
}

// Beds24 = Nogent UNIQUEMENT (règle absolue) — les biens Martinique ne sont jamais poussés
// vers Beds24, donc rien à annuler côté Beds24 pour eux.
async function cancelBeds24IfNogent(origin, bienId, email, checkin) {
  if (bienId !== "nogent") return { ok: true, skipped: "bien non synchronisé Beds24" };
  try {
    const findRes = await fetch(`${origin}/api/beds24-manage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "find", email, checkin }),
    });
    const found = await findRes.json();
    if (!found.ok || !found.bookingId) return { ok: false, error: found.error || "résa Beds24 introuvable" };
    const cancelRes = await fetch(`${origin}/api/beds24-manage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", bookingId: found.bookingId }),
    });
    const cancelled = await cancelRes.json();
    if (!cancelled.ok) return { ok: false, error: cancelled.error || "annulation Beds24 échouée" };
    return { ok: true, bookingId: found.bookingId };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const auth = await verifyBearer(request, env);
  if (!auth.ok) return json({ error: "Non autorisé" }, 401);

  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non liée" }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const { paymentIntentId, refundAmount = 0 } = body;
  if (!paymentIntentId) return json({ error: "paymentIntentId requis" }, 400);

  // Migration idempotente — cf. pattern établi (notify-booking.js, direct-bookings.js).
  try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN status TEXT DEFAULT 'confirmed'`).run(); } catch { /* déjà présente */ }
  try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN cancelled_at INTEGER`).run(); } catch { /* déjà présente */ }
  try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN refund_amount INTEGER`).run(); } catch { /* déjà présente */ }
  try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN refund_id TEXT`).run(); } catch { /* déjà présente */ }

  const booking = await db.prepare(
    "SELECT * FROM direct_bookings WHERE payment_intent_id = ?"
  ).bind(paymentIntentId).first();
  if (!booking) return json({ error: "Réservation introuvable" }, 404);
  if (booking.status === "cancelled") return json({ error: "Réservation déjà annulée" }, 409);

  const result = { refund: null, caution: null, beds24: null, email: null };

  // 1. Remboursement Stripe (si demandé)
  if (refundAmount > 0) {
    result.refund = await refundPayment(sk, paymentIntentId, refundAmount);
    if (!result.refund.ok) return json({ error: "Remboursement Stripe échoué : " + result.refund.error, result }, 502);
  } else {
    result.refund = { ok: true, skipped: "aucun remboursement demandé" };
  }

  // 2. Libération de la caution pré-autorisée
  try {
    result.caution = await releaseCaution(db, sk, paymentIntentId);
  } catch (e) {
    result.caution = { ok: false, error: e.message };
  }

  // 3. Annulation Beds24 (Nogent uniquement)
  const url = new URL(request.url);
  try {
    result.beds24 = await cancelBeds24IfNogent(url.origin, booking.bien_id, booking.email, booking.checkin);
  } catch (e) {
    result.beds24 = { ok: false, error: e.message };
  }

  // 4. Marquage annulé — toujours fait, même si une brique annexe a échoué (le voyageur
  // ne doit pas rester bloqué en "confirmé" à cause d'un souci Beds24/caution).
  await db.prepare(
    "UPDATE direct_bookings SET status='cancelled', cancelled_at=unixepoch(), refund_amount=?, refund_id=? WHERE payment_intent_id=?"
  ).bind(Math.round(refundAmount) || 0, result.refund?.refundId || null, paymentIntentId).run();

  // 5. Événement de suivi GA4 — même client_id que le purchase d'origine (booking.ga_client_id)
  // pour permettre l'analyse "quel canal d'acquisition annule le plus" à côté des achats.
  await ga4Event(env, "booking_cancelled", {
    bien_id: booking.bien_id,
    booking_id: paymentIntentId,
    value: Math.round(refundAmount) || 0,
    currency: "EUR",
    channel: booking.channel || "direct",
    refunded: refundAmount > 0,
  }, booking.ga_client_id || `booking-${paymentIntentId}`);

  // 6. Email d'annulation au voyageur
  if (booking.email) {
    const refundLine = refundAmount > 0
      ? `Un remboursement de <strong>${Math.round(refundAmount)}&nbsp;€</strong> a été initié sur votre moyen de paiement (délai bancaire habituel : 5 à 10 jours).`
      : `Conformément à notre politique d'annulation, aucun remboursement n'est applicable pour cette annulation.`;
    result.email = await sendGuestEmail(env, url.origin, {
      template: "annulation",
      to: booking.email,
      subject: `Annulation de votre réservation à ${booking.bien_nom}`,
      vars: {
        prenom: booking.prenom || "",
        bien_nom: booking.bien_nom || "",
        checkin: fmtDate(booking.checkin),
        checkout: fmtDate(booking.checkout),
        refund_line: refundLine,
        wa_hote: "33610880772",
      },
    });
  } else {
    result.email = { ok: false, skipped: "pas d'email voyageur" };
  }

  return json({ ok: true, paymentIntentId, result });
}

export function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
