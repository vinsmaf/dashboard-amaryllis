// Cloudflare Pages Function — GET /api/send-relance-panier
// crm-016 — Relance panier abandonné pour les RÉSERVATIONS DIRECTES.
//
// Un "panier" est créé en D1 (abandoned_carts) dès qu'un PaymentIntent est généré
// (functions/api/create-payment-intent.js). Si le paiement n'aboutit pas dans les
// heures qui suivent, ce cron envoie le template "relance-panier" — sauf si la
// réservation a finalement été payée (présence dans direct_bookings).
//
// Auth : ?secret=<POSTSTAY_SECRET>
// Appelé par le Worker (workers/ical-sync/index.js, branche */10 * * * *) toutes les 10 min —
// pas un cron-job.org externe (corrigé 2026-07-16, ce commentaire disait "toutes les heures").
//
// Séquence 2 relances :
//   Relance 1 (30 min) : relance_sent=0 + panier âgé 30min–72h  → relance_sent=1
//   Relance 2 (J+3)    : relance_sent=1 + panier âgé 48h–96h    → relance_sent=3
// La fenêtre étendue à 72h évite de rater les paniers si le cron saute une heure.

import { sendGuestEmail } from "./send-guest-email.js";
import { redactEmail } from "./_log.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const NOMS = {
  amaryllis: "Villa Amaryllis", iguana: "Villa Iguana", zandoli: "Zandoli",
  geko: "Géko", mabouya: "Mabouya", bellevue: "Appartement Bellevue",
  schoelcher: "Bellevue Schœlcher", nogent: "Appartement Nogent", groupe: "Résidence Amaryllis",
};

// Preuve sociale par bien (source : src/data/biens.js — mettre à jour à chaque maj)
const RATINGS = {
  amaryllis: { note: "4,9", avis: "33" },
  zandoli:   { note: "4,5", avis: "16" },
  geko:      { note: "4,8", avis: "24" },
  mabouya:   { note: "4,6", avis: "11" },
  schoelcher:{ note: "4,8", avis: "30" },
  nogent:    { note: "4,8", avis: "18" },
};

// Frais de service Airbnb voyageur ≈ 14 % — économie directe
const AIRBNB_FEE_RATE = 0.14;

const SITE = "https://villamaryllis.com";

function lienReprise(c) {
  const q = new URLSearchParams();
  if (c.checkin) q.set("checkin", c.checkin);
  if (c.checkout) q.set("checkout", c.checkout);
  q.set("utm_source", "email");
  q.set("utm_medium", "email");
  q.set("utm_campaign", "relance-panier");
  if (c.type === "group") {
    if (c.guests) q.set("guests", c.guests);
    return `${SITE}/location-groupe-sainte-luce?${q.toString()}`;
  }
  const bien = c.bien_id && NOMS[c.bien_id] ? c.bien_id : "amaryllis";
  return `${SITE}/${bien}?${q.toString()}`;
}

// Relance 1 : 30 min → 72h après création (fenêtre large = rattrape si cron saute)
const R1_MIN = 30 * 60;
const R1_MAX = 72 * 3600;
// Relance 2 : 48h → 96h après création (envoyée seulement si relance 1 déjà faite)
const R2_MIN = 48 * 3600;
const R2_MAX = 96 * 3600;

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

    // Migration idempotente si table existe sans amount_eur
    try { await db.prepare(`ALTER TABLE abandoned_carts ADD COLUMN amount_eur INTEGER DEFAULT 0`).run(); } catch { /* déjà présente */ }

    // Candidats relance 1 : jamais relancés, dans la fenêtre 30min–72h
    const { results: cands1 } = await db.prepare(
      `SELECT rowid AS rid, * FROM abandoned_carts
       WHERE relance_sent = 0 AND email IS NOT NULL AND email != ''
         AND created_at <= unixepoch() - ?
         AND created_at >= unixepoch() - ?`
    ).bind(R1_MIN, R1_MAX).all();

    // Candidats relance 2 : relance 1 déjà faite, dans la fenêtre 48h–96h
    const { results: cands2 } = await db.prepare(
      `SELECT rowid AS rid, * FROM abandoned_carts
       WHERE relance_sent = 1 AND email IS NOT NULL AND email != ''
         AND created_at <= unixepoch() - ?
         AND created_at >= unixepoch() - ?`
    ).bind(R2_MIN, R2_MAX).all();

    let sent = 0, failed = 0, convertis = 0;

    async function envoyerRelance(c, relanceNum) {
      // Exclure les paniers finalement payés (présents dans direct_bookings).
      const paye = await db.prepare(
        "SELECT 1 FROM direct_bookings WHERE payment_intent_id = ? OR (email = ? AND checkin = ?) LIMIT 1"
      ).bind(c.payment_intent_id, c.email, c.checkin).first();
      if (paye) {
        await db.prepare("UPDATE abandoned_carts SET relance_sent = 2 WHERE rowid = ?").bind(c.rid).run();
        convertis++;
        return;
      }

      const bienNom = c.type === "group"
        ? (c.logements || "Résidence Amaryllis")
        : (NOMS[c.bien_id] || "votre logement");

      // Preuve sociale
      const rating = RATINGS[c.bien_id] || { note: "4,8", avis: "20" };

      // Prix et économie directe vs Airbnb
      const prixTotal = c.amount_eur > 0 ? c.amount_eur : null;
      const savings = prixTotal ? Math.round(prixTotal * AIRBNB_FEE_RATE) : null;
      const prixStr = prixTotal ? `${prixTotal.toLocaleString("fr-FR")} €` : "";
      const savingsStr = savings ? `${savings} €` : "";

      // Blocs HTML conditionnels (le moteur de templates ne supporte que {{var}})
      const prixBlock = prixTotal
        ? `<tr><td style="font-size:18px; color:#1f2a3d; font-weight:bold; padding-top:4px;">Total : ${prixStr}</td></tr>`
        : "";
      const savingsBlock = savings
        ? `<tr><td style="padding:12px 32px 8px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1f2a3d; border-radius:8px;">
<tr><td style="padding:16px 20px; font-size:15px; color:#fffdf8; line-height:1.7;">
<span style="font-size:13px; color:#c47254; letter-spacing:2px; text-transform:uppercase; display:block; margin-bottom:8px;">Pourquoi réserver en direct ?</span>
✓ &nbsp;Vous économisez <strong style="color:#c47254;">~${savingsStr}</strong> de frais de service Airbnb<br>
✓ &nbsp;Paiement sécurisé Stripe, confirmation immédiate<br>
✓ &nbsp;Contact direct avec l'équipe en cas de question
</td></tr>
</table>
</td></tr>`
        : "";

      // Relance 2 : sujet légèrement différent pour éviter les filtres anti-spam
      const subject = relanceNum === 2
        ? `${c.prenom ? c.prenom + ", " : ""}vos dates au ${bienNom} sont encore disponibles`
        : `Votre séjour à ${bienNom} vous attend — finalisez en 2 minutes`;

      const r = await sendGuestEmail(env, url.origin, {
        template: "relance-panier",
        to: c.email,
        subject,
        vars: {
          prenom: c.prenom || "",
          bien_nom: bienNom,
          checkin: c.checkin || "",
          checkout: c.checkout || "",
          lien_reprise: lienReprise(c),
          prix_block: prixBlock,
          savings_block: savingsBlock,
          note_google: rating.note,
          avis_count: rating.avis,
          unsubscribe: "mailto:contact@villamaryllis.com?subject=Desabonnement%20relances",
        },
      });
      if (r.ok) {
        // relance_sent=1 après R1, relance_sent=3 après R2 (2 = converti, réservé)
        const nextStatus = relanceNum === 2 ? 3 : 1;
        await db.prepare("UPDATE abandoned_carts SET relance_sent = ? WHERE rowid = ?").bind(nextStatus, c.rid).run();
        sent++;
      } else {
        console.error(`[relance-panier] R${relanceNum} échec ${redactEmail(c.email)}: ${r.error}`);
        failed++;
      }
    }

    for (const c of cands1 || []) {
      try { await envoyerRelance(c, 1); }
      catch (e) { console.error(`[relance-panier] R1 exception ${c.email ? redactEmail(c.email) : c.rid}: ${e.message}`); failed++; }
    }
    for (const c of cands2 || []) {
      try { await envoyerRelance(c, 2); }
      catch (e) { console.error(`[relance-panier] R2 exception ${c.email ? redactEmail(c.email) : c.rid}: ${e.message}`); failed++; }
    }

    return json({
      ok: true,
      candidats_r1: (cands1 || []).length,
      candidats_r2: (cands2 || []).length,
      sent, failed, convertis,
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
