// Cloudflare Pages Function — GET /api/send-relance-panier
// crm-016 — Relance panier abandonné pour les RÉSERVATIONS DIRECTES.
//
// Un "panier" est créé en D1 (abandoned_carts) dès qu'un PaymentIntent est généré
// (functions/api/create-payment-intent.js). Si le paiement n'aboutit pas dans les
// heures qui suivent, ce cron envoie le template "relance-panier" — sauf si la
// réservation a finalement été payée (présence dans direct_bookings).
//
// Auth : ?secret=<POSTSTAY_SECRET>
// Cron-job.org : GET https://villamaryllis.com/api/send-relance-panier?secret=<SECRET> toutes les heures.
//
// Fenêtre : paniers créés il y a 3 h à 48 h (on ne relance ni trop tôt ni trop tard).

import { sendGuestEmail } from "./send-guest-email.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const NOMS = {
  amaryllis: "Villa Amaryllis", iguana: "Villa Iguana", zandoli: "Zandoli",
  geko: "Géko", mabouya: "Studio Mabouya", bellevue: "Appartement Bellevue",
  schoelcher: "Appartement Bellevue", nogent: "Appartement Nogent", groupe: "Résidence Amaryllis",
};

const SITE = "https://villamaryllis.com";

function lienReprise(c) {
  const q = new URLSearchParams();
  if (c.checkin) q.set("checkin", c.checkin);
  if (c.checkout) q.set("checkout", c.checkout);
  if (c.type === "group") {
    if (c.guests) q.set("guests", c.guests);
    return `${SITE}/location-groupe-sainte-luce?${q.toString()}`;
  }
  const bien = c.bien_id && NOMS[c.bien_id] ? c.bien_id : "amaryllis";
  return `${SITE}/${bien}?${q.toString()}`;
}

const FENETRE_MIN = 3 * 3600;   // ≥ 3 h
const FENETRE_MAX = 48 * 3600;  // ≤ 48 h

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS abandoned_carts (
      payment_intent_id TEXT PRIMARY KEY, email TEXT, prenom TEXT,
      bien_id TEXT, type TEXT, logements TEXT, checkin TEXT, checkout TEXT,
      guests TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      relance_sent INTEGER DEFAULT 0)`).run();

    const { results } = await db.prepare(
      `SELECT rowid AS rid, * FROM abandoned_carts
       WHERE relance_sent = 0 AND email IS NOT NULL AND email != ''
         AND created_at <= unixepoch() - ?
         AND created_at >= unixepoch() - ?`
    ).bind(FENETRE_MIN, FENETRE_MAX).all();

    let sent = 0, failed = 0, convertis = 0;
    for (const c of results || []) {
     try {
      // Exclure les paniers finalement payés (présents dans direct_bookings).
      const paye = await db.prepare(
        "SELECT 1 FROM direct_bookings WHERE payment_intent_id = ? OR (email = ? AND checkin = ?) LIMIT 1"
      ).bind(c.payment_intent_id, c.email, c.checkin).first();
      if (paye) {
        await db.prepare("UPDATE abandoned_carts SET relance_sent = 2 WHERE rowid = ?").bind(c.rid).run();
        convertis++;
        continue;
      }

      const bienNom = c.type === "group"
        ? (c.logements || "Résidence Amaryllis")
        : (NOMS[c.bien_id] || "votre logement");

      const r = await sendGuestEmail(env, url.origin, {
        template: "relance-panier",
        to: c.email,
        subject: `Votre séjour à ${bienNom} vous attend — finalisez en 2 minutes`,
        vars: {
          prenom: c.prenom || "",
          bien_nom: bienNom,
          checkin: c.checkin || "",
          checkout: c.checkout || "",
          lien_reprise: lienReprise(c),
          unsubscribe: "mailto:contact@villamaryllis.com?subject=Desabonnement%20relances",
        },
      });
      if (r.ok) {
        await db.prepare("UPDATE abandoned_carts SET relance_sent = 1 WHERE rowid = ?").bind(c.rid).run();
        sent++;
      } else {
        console.error(`[relance-panier] échec ${c.email}: ${r.error}`);
        failed++;
      }
     } catch (e) {
       console.error(`[relance-panier] exception panier ${c.email || c.rid}: ${e.message}`);
       failed++;
     }
    }
    return json({ ok: true, candidats: (results || []).length, sent, failed, convertis });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
