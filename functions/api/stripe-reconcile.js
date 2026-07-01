// GET /api/stripe-reconcile — Bearer admin uniquement
// Rapprochement Stripe : pour chaque virement (payout) reçu sur le compte bancaire,
// détaille les transactions qui le composent (montant brut, frais Stripe, net) et
// tente de rattacher chaque charge à une résa directe (D1 direct_bookings, via
// payment_intent_id) pour afficher le nom du voyageur/bien.
//
// Chantier 3 du plan connecteurs 2026-07 — répond au vrai trou identifié : le rapport
// mensuel existant (Worker, runMonthlyExport) montre le CA enregistré, mais rien ne
// montre ce que Stripe a RÉELLEMENT viré sur le compte bancaire une fois les frais
// déduits. Utilise STRIPE_SECRET_KEY (déjà en secret Cloudflare — aucune config en plus).
//
// Params : ?limit=10 (nb de virements récents, max 50)

import { verifyBearer } from "./_adminauth.js";

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export function centsToEuros(cents) {
  return Math.round((cents || 0)) / 100;
}

const TYPE_LABELS = {
  charge: "Paiement",
  payment: "Paiement",
  payment_refund: "Remboursement",
  refund: "Remboursement",
  adjustment: "Ajustement",
  stripe_fee: "Frais Stripe",
  payout: "Virement",
  payout_cancel: "Virement annulé",
};

/**
 * Transforme une balance_transaction Stripe brute (avec `source` étendu si c'est une
 * charge) en objet lisible, et tente le rattachement à une résa directe via le
 * payment_intent. Fonction pure — testable sans appeler Stripe.
 *
 * `bookingByPI` : Map<payment_intent_id, { voyageur, bien_nom }>
 */
export function parseBalanceTransaction(bt, bookingByPI) {
  const source = bt.source && typeof bt.source === "object" ? bt.source : null;
  const paymentIntentId = source?.payment_intent || null;
  const booking = paymentIntentId ? bookingByPI.get(paymentIntentId) : null;

  return {
    id: bt.id,
    type: bt.type,
    typeLabel: TYPE_LABELS[bt.type] || bt.type,
    amount: centsToEuros(bt.amount),
    fee: centsToEuros(bt.fee),
    net: centsToEuros(bt.net),
    createdAt: bt.created ? bt.created * 1000 : null,
    description: bt.description || null,
    paymentIntentId,
    guestName: booking?.voyageur || null,
    bienNom: booking?.bien_nom || null,
    matched: !!booking,
  };
}

/** Agrège les transactions d'un virement. Fonction pure — testable. */
export function summarizePayoutTransactions(transactions) {
  const charges = transactions.filter(t => t.type === "charge" || t.type === "payment");
  const grossFromCharges = round2(charges.reduce((s, t) => s + t.amount, 0));
  const totalFees = round2(transactions.reduce((s, t) => s + t.fee, 0));
  const matchedCount = charges.filter(t => t.matched).length;
  const unmatchedCount = charges.length - matchedCount;
  return { grossFromCharges, totalFees, matchedCount, unmatchedCount, chargesCount: charges.length };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function stripeFetch(env, path) {
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || `Stripe ${r.status}`);
  return data;
}

export async function onRequestGet({ request, env }) {
  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  if (!env.STRIPE_SECRET_KEY) return json({ error: "STRIPE_SECRET_KEY manquant" }, 503);

  const db = env.revenue_manager;
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit"), 10) || 10));

  try {
    const payoutsData = await stripeFetch(env, `/payouts?limit=${limit}`);
    const payouts = payoutsData.data || [];

    // Bookings connus, pour le matching (chargé une seule fois, pas par virement)
    const bookingByPI = new Map();
    if (db) {
      const { results } = await db.prepare(
        "SELECT payment_intent_id, voyageur, bien_nom FROM direct_bookings WHERE payment_intent_id IS NOT NULL"
      ).all();
      for (const b of results || []) bookingByPI.set(b.payment_intent_id, b);
    }

    const enriched = [];
    for (const payout of payouts) {
      let transactions = [];
      try {
        const btData = await stripeFetch(
          env,
          `/balance_transactions?payout=${payout.id}&limit=100&expand[]=data.source`
        );
        transactions = (btData.data || []).map(bt => parseBalanceTransaction(bt, bookingByPI));
      } catch {
        transactions = [];
      }
      const summary = summarizePayoutTransactions(transactions);

      enriched.push({
        id: payout.id,
        amount: centsToEuros(payout.amount),
        currency: payout.currency,
        status: payout.status,
        arrivalDate: payout.arrival_date ? payout.arrival_date * 1000 : null,
        createdAt: payout.created ? payout.created * 1000 : null,
        ...summary,
        transactions,
      });
    }

    return json({ ok: true, payouts: enriched });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
