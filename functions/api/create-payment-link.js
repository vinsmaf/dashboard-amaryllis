// Cloudflare Pages Function — POST /api/create-payment-link
// ebiz-005 : Crée un Stripe Payment Link pour devis WhatsApp
//
// Le lien Stripe hébergé ne nécessite aucun widget frontend —
// on l'envoie au voyageur directement dans WhatsApp.
//
// Body (JSON) :
//   amount    : number  — montant en CENTIMES (ex: 45000 = 450€)
//   bienId    : string  — id du bien (amaryllis, nogent…)
//   bienNom   : string  — nom affiché dans la description Stripe
//   checkin   : string  — date d'arrivée YYYY-MM-DD
//   checkout  : string  — date de départ YYYY-MM-DD
//   voyageur  : string  — prénom + nom du voyageur
//   email     : string? — email voyageur (pré-remplit le formulaire Stripe)
//   nights    : number? — nombre de nuits
//   beds24Id  : string? — bookingId Beds24 pour confirmer après paiement
//   type      : "acompte"|"solde"|"total" (défaut: "total")
//
// Réponse : { ok, url, paymentLinkId, amount }
//
// Auth : Bearer ADMIN_PASSWORD (même mécanisme que contacts.js)

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

// arch-009 : accepte un token de session signé OU le mot de passe brut (rétro-compat)
async function checkAuth(request, env) {
  if (!env.ADMIN_PASSWORD && !env.ADMIN_PWD) return true;
  const { ok } = await verifyBearer(request, env);
  return ok;
}

const BIEN_LABELS = {
  amaryllis:  "Villa Amaryllis — Sainte-Luce, Martinique",
  schoelcher: "Bellevue Schœlcher — Martinique",
  geko:       "Géko — Sainte-Luce, Martinique",
  mabouya:    "Mabouya — Sainte-Luce, Martinique",
  zandoli:    "Zandoli — Sainte-Luce, Martinique",
  iguana:     "Villa Iguana — Sainte-Luce, Martinique",
  nogent:     "Appartement Nogent-sur-Marne — Île-de-France",
};

function fmt(iso) {
  if (!iso) return "?";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!(await checkAuth(request, env))) {
    return json({ error: "Non autorisé" }, 401);
  }

  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const {
    amount,                        // centimes
    bienId    = "",
    bienNom   = BIEN_LABELS[bienId] || bienId,
    checkin   = "",
    checkout  = "",
    voyageur  = "",
    email     = "",
    nights    = null,
    beds24Id  = "",
    type      = "total",           // "acompte" | "solde" | "total"
    totalAmount = null,            // centimes — total du séjour (si acompte/solde)
    soldeAmount = null,            // centimes — solde restant dû (si acompte)
    pct         = null,            // % de l'acompte (ex: 40) — affichage
  } = body;

  if (!amount || amount < 500)    return json({ error: "Montant minimum 5€ (500 centimes)" }, 400);
  if (amount > 1500000)           return json({ error: "Montant maximum 15 000€" }, 400);
  if (!bienId)                    return json({ error: "bienId requis" }, 400);
  if (!checkin || !checkout)      return json({ error: "checkin et checkout requis" }, 400);

  // ── Label du type de paiement ─────────────────────────────────────────────
  const pctTxt = pct ? ` ${pct}%` : "";
  const typeLabel = type === "acompte" ? `Acompte${pctTxt}`
                  : type === "solde"   ? "Solde restant"
                  : "Paiement intégral";

  // ── Description du produit affichée sur la page Stripe ───────────────────
  const nightsStr = nights ? ` · ${nights} nuit${nights > 1 ? "s" : ""}` : "";
  const productName = `${bienNom}`;
  const productDesc = `${typeLabel} — ${fmt(checkin)} → ${fmt(checkout)}${nightsStr}${voyageur ? ` · ${voyageur}` : ""}`;

  // ── 1. Créer le Product Stripe (one-time) ────────────────────────────────
  let productId;
  try {
    const pRes = await fetch("https://api.stripe.com/v1/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        name:                    productName,
        description:             productDesc,
        "metadata[bienId]":      bienId,
        "metadata[checkin]":     checkin,
        "metadata[checkout]":    checkout,
        "metadata[voyageur]":    voyageur,
        "metadata[beds24Id]":    beds24Id,
        "metadata[type]":        type,
      }).toString(),
    });
    const p = await pRes.json();
    if (!p.id) throw new Error(JSON.stringify(p));
    productId = p.id;
  } catch (err) {
    return json({ error: `Stripe product error: ${err.message}` }, 502);
  }

  // ── 2. Créer le Price Stripe (one-time, en EUR) ───────────────────────────
  let priceId;
  try {
    const prRes = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        product:      productId,
        unit_amount:  String(Math.round(amount)),
        currency:     "eur",
      }).toString(),
    });
    const pr = await prRes.json();
    if (!pr.id) throw new Error(JSON.stringify(pr));
    priceId = pr.id;
  } catch (err) {
    return json({ error: `Stripe price error: ${err.message}` }, 502);
  }

  // ── 3. Créer le Payment Link ──────────────────────────────────────────────
  const plBody = new URLSearchParams({
    "line_items[0][price]":    priceId,
    "line_items[0][quantity]": "1",
    "payment_method_types[0]": "card",
    "after_completion[type]":  "redirect",
    "after_completion[redirect][url]": `https://villamaryllis.com/${bienId}?payment=success`,
    "metadata[bienId]":    bienId,
    "metadata[checkin]":   checkin,
    "metadata[checkout]":  checkout,
    "metadata[voyageur]":  voyageur,
    "metadata[beds24Id]":  beds24Id,
    "metadata[type]":      type,
    "metadata[total]":     String(totalAmount || amount),
    "metadata[solde]":     String(soldeAmount || 0),
    "metadata[email]":     email || "",
  });

  // Pré-remplir l'email si fourni
  if (email) {
    plBody.set("customer_creation", "always");
  }

  let link;
  try {
    const plRes = await fetch("https://api.stripe.com/v1/payment_links", {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: plBody.toString(),
    });
    link = await plRes.json();
    if (!link.url) throw new Error(JSON.stringify(link));
  } catch (err) {
    return json({ error: `Stripe payment_link error: ${err.message}` }, 502);
  }

  // ── Persistance D1 (best-effort) : trace le devis pour le suivi du solde ──
  // Permet au cron J-30 d'envoyer le lien de solde + relances. Non bloquant.
  try {
    const db = env.revenue_manager;
    if (db && type === "acompte") {
      await db.prepare(`CREATE TABLE IF NOT EXISTS devis_paiements (
        id TEXT PRIMARY KEY, bien_id TEXT, voyageur TEXT, email TEXT,
        checkin TEXT, checkout TEXT,
        total INTEGER, acompte INTEGER, solde INTEGER,
        type TEXT, status TEXT,
        solde_link TEXT, solde_link_sent_at INTEGER,
        beds24_id TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`).run();
      await db.prepare(`INSERT OR REPLACE INTO devis_paiements
        (id, bien_id, voyageur, email, checkin, checkout, total, acompte, solde, type, status, beds24_id, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,unixepoch())`
      ).bind(
        link.id, bienId, voyageur, email, checkin, checkout,
        Math.round(totalAmount || amount), Math.round(amount), Math.round(soldeAmount || 0),
        type, "acompte_attente", beds24Id
      ).run();
    }
  } catch (e) { /* non bloquant */ }

  return json({
    ok:            true,
    url:           link.url,
    paymentLinkId: link.id,
    amount:        Math.round(amount),
    amountEur:     (Math.round(amount) / 100).toFixed(2),
    currency:      "eur",
    bienId,
    checkin,
    checkout,
    voyageur,
    type,
  });
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return onRequestOptions();
  if (context.request.method === "POST")    return onRequestPost(context);
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405, headers: CORS,
  });
}
