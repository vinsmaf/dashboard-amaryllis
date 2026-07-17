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
import { segmentClients, commissionOta } from "../../src/utils/otaCost.js";

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

  // ── FAIT 1 : commission OTA réelle (2025, seule année ventilée par canal) ──
  const commission = commissionOta(REVENUS_CANAL_2025, { airbnbComm, bookingComm: BOOKING_COMM });

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

  return json({
    version: 1,
    generated_at: new Date().toISOString(),
    // ⚠️ La ventilation par canal n'existe qu'en 2025 (seed réel). Le front DOIT afficher
    // cette année de référence — ne pas laisser croire que c'est du 2026 temps réel.
    annee_reference: 2025,
    commission,          // FAIT
    segment,             // FAIT
    // Pré-remplissage du curseur (dérivé des données), le front reste libre de le changer.
    hint: { valeurSejourMoyen, tauxCommissionOta: Math.round(commission.tauxMoyenOta * 1000) / 1000 },
    blind_spots: [
      "Ventilation du CA par canal : disponible uniquement pour 2025 (seed réel). 2026 n'a qu'un CA total, non ventilé → cet écran reste une photo 2025.",
      "Le manque à gagner de réactivation est une PROJECTION réglable (curseur taux de réactivation), pas un fait — la valorisation dépend de tes hypothèses.",
      "Les clients OTA « captifs » sont ceux dont crm_clients n'a aucun email exploitable ; un email réel jamais importé les ferait basculer en réactivables.",
    ],
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" },
  });
}
