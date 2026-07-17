// Cloudflare Pages Function — GET /api/ota-cost
// I-04 — Le vrai coût des OTA. Produit les FAITS (réels), le front applique les hypothèses.
//
// Deux faits, tous deux réels :
//  1. Commission OTA payée (CA par canal 2025 réel × taux réel) — depuis REVENUS_CANAL_2025.
//  2. Segmentation clients : réactivables (email réel) vs captifs OTA (fidèles sans email,
//     jamais recontactables en direct) — comptée en D1 `crm_clients`.
//
// Aucune hypothèse ici : le manque à gagner de réactivation (curseur) est calculé côté client.
// Advisory pur, lecture seule, aucun LLM.

import { verifyBearer } from "./_adminauth.js";
import { REVENUS_CANAL_2025 } from "../../src/data/revenusCanal.js";
import { airbnbComm, BOOKING_COMM } from "../../src/config/canauxCommissions.js";
import { segmentClients, commissionOta, commissionFromReservations } from "../../src/utils/otaCost.js";

// Lit les réservations réelles via le proxy Sheet (bénéficie de son cache KV — pas de 2e appel
// Apps Script de 32s si le dashboard a déjà chargé). Retourne [] si indisponible → fallback seed.
async function fetchReservations(origin, env) {
  try {
    const res = await fetch(`${origin}/api/sheets-proxy?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    });
    const d = await res.json();
    return Array.isArray(d?.reservations) ? d.reservations : [];
  } catch { return []; }
}

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const secretOk = !!env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  if (!secretOk) {
    const { ok } = await verifyBearer(request, env);
    if (!ok) return json({ error: "Non autorisé" }, 401);
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  // Année demandée (défaut : année courante si dispo, sinon 2025).
  const nowYear = new Date().getUTCFullYear();
  const year = url.searchParams.get("year") || String(nowYear);

  // ── FAIT 1 : commission OTA réelle depuis les RÉSERVATIONS VIVANTES du Sheet ──
  // (Remplace le seed statique REVENUS_CANAL_2025, qui sous-estimait Booking de ~21% — 2026-07-18.)
  const rates = { airbnbComm, bookingComm: BOOKING_COMM };
  const origin = new URL(request.url).origin;
  const reservations = await fetchReservations(origin, env);

  let commission, commissionSource, yearsAvailable = [];
  if (reservations.length > 0) {
    // Années réellement présentes dans les données (checkin 20xx), pour piloter le sélecteur UI.
    const ys = new Set();
    for (const r of reservations) {
      const y = String(r?.checkin || "").slice(0, 4);
      if (/^20\d\d$/.test(y)) ys.add(y);
    }
    yearsAvailable = [...ys].sort().reverse();
    const useYear = ys.has(year) ? year : (yearsAvailable[0] || year);
    commission = commissionFromReservations(reservations, useYear, rates);
    commissionSource = "reservations_live";
  } else {
    // Fallback : le Sheet n'a pas répondu → seed statique 2025 (avec avertissement).
    commission = commissionOta(REVENUS_CANAL_2025, rates);
    commission.year = "2025";
    commissionSource = "seed_2025_fallback";
    yearsAvailable = ["2025"];
  }

  // ── FAIT 2 : segmentation clients depuis crm_clients ──
  let segment;
  let valeurSejourMoyen = 600; // défaut prudent, raffiné ci-dessous si les données le permettent
  try {
    const { results } = await db.prepare(
      "SELECT canal_principal, email, ltv_total, nb_sejours FROM crm_clients"
    ).all();
    segment = segmentClients(results || []);

    // Valeur séjour moyenne dérivée des captifs OTA (LTV cumulée / nb séjours) — un pré-remplissage
    // honnête du curseur, basé sur les données réelles plutôt qu'un nombre en l'air.
    const otaRows = (results || []).filter(
      (c) => ["airbnb", "booking"].includes(String(c.canal_principal || "").toLowerCase())
    );
    const ltvSum = otaRows.reduce((s, c) => s + (Number(c.ltv_total) || 0), 0);
    const nights = otaRows.reduce((s, c) => s + (Number(c.nb_sejours) || 0), 0);
    if (nights > 0) valeurSejourMoyen = Math.round(ltvSum / nights);
  } catch (e) {
    return json({ error: `Lecture crm_clients échouée: ${e.message}` }, 500);
  }

  const blind_spots = [
    "Le manque à gagner de réactivation est une PROJECTION réglable (curseur taux de réactivation), pas un fait — la valorisation dépend de tes hypothèses.",
    "Les clients OTA « captifs » sont ceux dont crm_clients n'a aucun email exploitable ; un email réel jamais importé les ferait basculer en réactivables.",
  ];
  if (commissionSource === "seed_2025_fallback") {
    blind_spots.unshift("⚠️ Le Sheet n'a pas répondu : chiffres de commission tirés du seed statique 2025 (qui sous-estime Booking) — recharge pour obtenir les données vivantes.");
  } else if (commission.year !== String(nowYear)) {
    blind_spots.unshift(`Année en cours (${nowYear}) partielle : ${commission.year} est affichée comme dernière année de référence complète.`);
  }

  return json({
    version: 1,
    generated_at: new Date().toISOString(),
    annee_reference: Number(commission.year) || 2025,
    annees_disponibles: yearsAvailable,       // pilote le sélecteur d'année du front
    source_commission: commissionSource,      // "reservations_live" | "seed_2025_fallback"
    commission,          // FAIT (données vivantes du Sheet)
    segment,             // FAIT
    // Pré-remplissage du curseur (dérivé des données), le front reste libre de le changer.
    hint: { valeurSejourMoyen, tauxCommissionOta: Math.round(commission.tauxMoyenOta * 1000) / 1000 },
    blind_spots,
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" },
  });
}
