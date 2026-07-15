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
//   type      : "acompte"|"solde"|"total"|"group" (défaut: "total")
//   bienId    : "groupe" pour une résa multi-logements (Résidence) — dans ce cas fournir aussi :
//   bienIds   : string?  — CSV des logements ("zandoli,geko") pour bloquer leurs calendriers iCal
//   logements : string?  — libellé affiché ("Zandoli + Géko"), utilisé comme bienNom par défaut
//   guests    : string?  — nombre de voyageurs
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
    bienNom   = "",
    checkin   = "",
    checkout  = "",
    voyageur  = "",
    email     = "",
    nights    = null,
    beds24Id  = "",
    type      = "total",           // "acompte" | "solde" | "total" | "group"
    totalAmount = null,            // centimes — total du séjour (si acompte/solde)
    soldeAmount = null,            // centimes — solde restant dû (si acompte)
    pct         = null,            // % de l'acompte (ex: 40) — affichage
    bienIds     = "",              // "zandoli,geko" — résa groupée multi-logements (bienId="groupe")
    logements   = "",              // "Zandoli + Géko" — libellé affiché (résa groupée)
    guests      = "",              // nombre de voyageurs (résa groupée)
  } = body;

  const resolvedBienNom = bienNom || logements || BIEN_LABELS[bienId] || bienId;

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
  const productName = `${resolvedBienNom}`;
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
        "metadata[bienIds]":     bienIds,
        "metadata[logements]":   logements,
        "metadata[guests]":      String(guests || ""),
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
    // Résa groupée (bienId="groupe") : pas de route /groupe — renvoyer vers la page dédiée.
    "after_completion[redirect][url]": bienId === "groupe"
      ? `https://villamaryllis.com/location-groupe-sainte-luce?payment=success`
      : `https://villamaryllis.com/${bienId}?payment=success`,
    "metadata[bienId]":    bienId,
    "metadata[bienIds]":   bienIds,
    "metadata[logements]": logements,
    "metadata[guests]":    String(guests || ""),
    "metadata[checkin]":   checkin,
    "metadata[checkout]":  checkout,
    "metadata[voyageur]":  voyageur,
    "metadata[beds24Id]":  beds24Id,
    "metadata[type]":      type,
    "metadata[total]":     String(totalAmount || amount),
    "metadata[solde]":     String(soldeAmount || 0),
    "metadata[email]":     email || "",
    // metadata[...] ci-dessus ne s'attache qu'à l'objet Payment Link — Stripe ne le propage
    // JAMAIS automatiquement au PaymentIntent résultant. stripe-webhook.js lit pi.metadata,
    // donc sans payment_intent_data[metadata][...] la résa est invisible au pipeline auto
    // (nécessitait jusqu'ici une réconciliation manuelle à chaque paiement par lien).
    // bienIds/logements/guests : lus par stripe-webhook.js pour bloquer le calendrier iCal de
    // CHAQUE logement de la résa groupée (group_biens), pas seulement bienId="groupe".
    "payment_intent_data[metadata][bienId]":    bienId,
    "payment_intent_data[metadata][bienIds]":   bienIds,
    "payment_intent_data[metadata][logements]": logements,
    "payment_intent_data[metadata][guests]":    String(guests || ""),
    "payment_intent_data[metadata][checkin]":  checkin,
    "payment_intent_data[metadata][checkout]": checkout,
    "payment_intent_data[metadata][voyageur]": voyageur,
    "payment_intent_data[metadata][beds24Id]": beds24Id,
    "payment_intent_data[metadata][type]":     type,
    "payment_intent_data[metadata][total]":    String(totalAmount || amount),
    "payment_intent_data[metadata][solde]":    String(soldeAmount || 0),
    "payment_intent_data[metadata][email]":    email || "",
    // Canal humain (devis WhatsApp) — jamais de sessionStorage/cookie sur ce flux, donc
    // pas d'utm/gclid/fbclid possibles ; le tag statique évite que ces ventes réapparaissent
    // en "Unassigned" côté GA4/reporting funnel.
    "payment_intent_data[metadata][channel]":  "whatsapp-devis",
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
