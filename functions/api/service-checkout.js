// Cloudflare Pages Function — POST /api/service-checkout
// Achat d'un SERVICE additionnel par le voyageur (depuis /services/<bien> ou le QR de l'écran TV).
// PUBLIC, mais le PRIX est validé CÔTÉ SERVEUR depuis le catalogue `extras[]` du livret
// (le client ne peut pas trafiquer le montant). Crée un Stripe Payment Link et le renvoie.
//
// Body : { bien: string, serviceId: string, contact?: string, email?: string }
// Réponse : { ok, url, label, amountEur }
//
// Au paiement → Stripe émet checkout.session.completed (metadata type=service) →
// stripe-webhook.js notifie l'hôte + enregistre la commande en D1 `service_orders`.

import { rateLimit } from "./_ratelimit.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://villamaryllis.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const BIEN_LABELS = {
  amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko",
  mabouya: "Studio Mabouya", schoelcher: "Appartement Bellevue", nogent: "Appartement Nogent",
};

// Lit le catalogue extras[] du bien depuis D1 (fallback : fichier statique).
async function loadExtras(env, origin, bien) {
  try {
    const db = env.revenue_manager;
    if (db) {
      const row = await db.prepare("SELECT content_json FROM property_guides WHERE property_id = ?").bind(bien).first();
      if (row && row.content_json) {
        const g = JSON.parse(row.content_json);
        if (Array.isArray(g.extras)) return g.extras;
      }
    }
  } catch { /* ignore */ }
  try {
    const res = await fetch(new URL(`/guides/${bien}.json`, origin));
    if (res.ok) { const g = await res.json(); if (Array.isArray(g.extras)) return g.extras; }
  } catch { /* ignore */ }
  return [];
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return json({ error: "Paiement indisponible" }, 500);

  // Anti-abus : 12 créations / 10 min / IP.
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "?";
    const rl = await rateLimit(env.revenue_manager, { key: `svc:${ip}`, limit: 12, windowSec: 600 });
    if (rl && rl.blocked) return json({ error: "Trop de tentatives, réessayez plus tard." }, 429);
  } catch { /* fail-open */ }

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  const bien = String(body.bien || "").trim().toLowerCase();
  const serviceId = String(body.serviceId || "").trim();
  const contact = String(body.contact || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160);

  if (!BIEN_LABELS[bien]) return json({ error: "Logement inconnu" }, 400);
  if (!serviceId) return json({ error: "Service requis" }, 400);

  // ── Prix validé serveur depuis le catalogue ──────────────────────────────
  const extras = await loadExtras(env, new URL(request.url).origin, bien);
  const svc = extras.find((e) => e.id === serviceId);
  if (!svc) return json({ error: "Service indisponible pour ce logement" }, 404);
  const price = Number(svc.price);
  if (!Number.isFinite(price) || price < 1 || price > 5000) return json({ error: "Prix invalide" }, 400);
  const amount = Math.round(price * 100); // centimes

  const bienNom = BIEN_LABELS[bien];
  const productName = `${svc.label} — ${bienNom}`;
  const productDesc = `${svc.desc || ""}${contact ? ` · ${contact}` : ""}`.slice(0, 250) || svc.label;

  const stripe = (path, params) => fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  }).then((r) => r.json());

  try {
    const product = await stripe("products", {
      name: productName, description: productDesc,
      "metadata[type]": "service", "metadata[bienId]": bien, "metadata[serviceId]": serviceId,
    });
    if (!product.id) throw new Error("product");

    const priceObj = await stripe("prices", { product: product.id, unit_amount: String(amount), currency: "eur" });
    if (!priceObj.id) throw new Error("price");

    const link = await stripe("payment_links", {
      "line_items[0][price]": priceObj.id,
      "line_items[0][quantity]": "1",
      "payment_method_types[0]": "card",
      "after_completion[type]": "redirect",
      "after_completion[redirect][url]": `https://villamaryllis.com/services/${bien}?paid=1`,
      "metadata[type]": "service",
      "metadata[bienId]": bien,
      "metadata[bienNom]": bienNom,
      "metadata[serviceId]": serviceId,
      "metadata[serviceLabel]": svc.label,
      "metadata[contact]": contact,
      "metadata[email]": email,
      ...(email ? { customer_creation: "always" } : {}),
    });
    if (!link.url) throw new Error("payment_link");

    return json({ ok: true, url: link.url, label: svc.label, amountEur: (amount / 100).toFixed(0) });
  } catch (err) {
    return json({ error: `Paiement indisponible (${err.message})` }, 502);
  }
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return onRequestOptions();
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS });
}
