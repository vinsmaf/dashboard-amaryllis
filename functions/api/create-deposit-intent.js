// Cloudflare Pages Function — POST /api/create-deposit-intent
// Creates a PaymentIntent with capture_method: "manual" (pre-authorization)

import { MAX_CAUTION } from "./caution-checkout.js";
import { rateLimit } from "./_ratelimit.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500);

  // SEC audit Fable 5 2026-07-09, Lot 2 : rate-limit anti-abus (60/h/IP, fail-open).
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rl = await rateLimit(env.revenue_manager, { key: `create-deposit-intent:${ip}`, limit: 60, windowSec: 3600 });
  if (!rl.ok) {
    return json({ error: "Trop de requêtes — réessayez dans un instant", retryAfter: rl.retryAfter }, 429);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const { amount, currency = "eur", metadata = {} } = body;
  if (!amount || amount < 50) return json({ error: "Montant invalide" }, 400);

  // Plafond par bien (SEC audit Fable 5 2026-07-09, Lot 2 — aucune limite haute avant, contrairement
  // à caution-checkout.js qui a la même finalité). Réutilise la même table.
  const maxCaution = MAX_CAUTION[metadata.bienId] ?? 500;
  if (amount / 100 > maxCaution) {
    return json({ error: `Montant maximum autorisé pour ${metadata.bienId || "ce bien"}: ${maxCaution}€` }, 400);
  }

  const payload = new URLSearchParams({
    amount: String(Math.round(amount)),
    currency,
    capture_method: "manual",
    // Caution = CARTE UNIQUEMENT (pas de Link). Sinon Stripe Link auto-remplit une
    // carte enregistrée déjà refusée → écran d'erreur anxiogène sur l'étape caution
    // ("moyen de paiement a échoué" / "erreur de traitement") même quand le séjour est
    // déjà payé. Vécu résa Antoine FENAERT (Zandoli, 2026-06-17). Carte fraîche = pas d'autofill cassé.
    "payment_method_types[0]": "card",
    "metadata[type]":     "deposit",
    "metadata[bienId]":   metadata.bienId   || "",
    "metadata[checkin]":  metadata.checkin  || "",
    "metadata[checkout]": metadata.checkout || "",
    "metadata[voyageur]": metadata.voyageur || "",
    "metadata[email]":    metadata.email    || "",
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });
    const parsed = await res.json();
    if (parsed.error) return json({ error: parsed.error.message }, 400);
    return json({ clientSecret: parsed.client_secret, id: parsed.id });
  } catch (err) {
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
