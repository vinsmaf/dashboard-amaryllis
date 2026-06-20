// Cloudflare Pages Function — POST /api/manage-deposit
// action: "capture" | "cancel" | "list" | "history"
// 🔒 Admin UNIQUEMENT : capture/annule des cautions Stripe LIVE (argent réel)
//    et liste la PII voyageur. Gate verifyBearer obligatoire (sinon n'importe qui
//    connaissant un paymentIntentId pourrait encaisser/annuler une caution).

import { verifyBearer } from "./_adminauth.js";

const ALLOWED_ORIGINS = ["https://villamaryllis.com", "https://www.villamaryllis.com", "https://dashboard-amaryllis.pages.dev"];

function corsOrigin(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.some(o => origin === o) || origin.endsWith(".dashboard-amaryllis.pages.dev");
  return allowed ? origin : "https://villamaryllis.com";
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // 🔒 Gate admin — endpoint mutateur d'argent réel (Stripe LIVE) + PII voyageur
  const auth = await verifyBearer(request, env);
  if (!auth.ok) return json({ error: "Non autorisé" }, 401, request);

  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500, request);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400, request); }

  const { action, paymentIntentId, amount } = body;

  if (action === "list") {
    // List all pre-authorized deposits (requires_capture)
    try {
      const res = await fetch(
        "https://api.stripe.com/v1/payment_intents/search?query=status%3A%27requires_capture%27%20AND%20metadata%5B%27type%27%5D%3A%27deposit%27&limit=50",
        { headers: { Authorization: `Bearer ${sk}` } }
      );
      const parsed = await res.json();
      if (parsed.error) return json({ error: parsed.error.message }, 400, request);
      return json({ ok: true, data: parsed.data || [] }, 200, request);
    } catch (err) {
      return json({ error: err.message }, 500, request);
    }
  }

  // action: "history" — toutes les cautions (tous statuts), filtrable par bienId.
  // Lecture seule, sert à vérifier qu'une caution a bien été libérée (canceled).
  if (action === "history") {
    try {
      let q = "metadata%5B%27type%27%5D%3A%27deposit%27";
      if (body.bienId) q += `%20AND%20metadata%5B%27bienId%27%5D%3A%27${encodeURIComponent(body.bienId)}%27`;
      const res = await fetch(
        `https://api.stripe.com/v1/payment_intents/search?query=${q}&limit=50`,
        { headers: { Authorization: `Bearer ${sk}` } }
      );
      const parsed = await res.json();
      if (parsed.error) return json({ error: parsed.error.message }, 400, request);
      const data = (parsed.data || []).map(pi => ({
        id: pi.id, status: pi.status, amount: pi.amount, created: pi.created,
        canceled_at: pi.canceled_at, capture_method: pi.capture_method,
        bienId: pi.metadata?.bienId, voyageur: pi.metadata?.voyageur,
        checkin: pi.metadata?.checkin, checkout: pi.metadata?.checkout,
      }));
      return json({ ok: true, data }, 200, request);
    } catch (err) {
      return json({ error: err.message }, 500, request);
    }
  }

  if (!paymentIntentId) return json({ error: "paymentIntentId requis" }, 400, request);

  let url;
  if (action === "capture") {
    url = `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/capture`;
  } else if (action === "cancel") {
    url = `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/cancel`;
  } else {
    return json({ error: "Action invalide (capture | cancel | list)" }, 400, request);
  }

  const capturePayload = action === "capture" && amount
    ? new URLSearchParams({ amount_to_capture: String(Math.round(amount * 100)) }).toString()
    : "";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: capturePayload,
    });
    const parsed = await res.json();
    if (parsed.error) return json({ error: parsed.error.message }, 400, request);
    return json({ ok: true, status: parsed.status }, 200, request);
  } catch (err) {
    return json({ error: err.message }, 500, request);
  }
}

export function onRequestOptions({ request }) {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": corsOrigin(request),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Vary": "Origin",
    },
  });
}

function json(data, status = 200, request = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": corsOrigin(request),
      "Vary": "Origin",
    },
  });
}
