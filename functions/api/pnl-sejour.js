// Cloudflare Pages Function — GET /api/pnl-sejour
// I-03 — P&L par séjour (pas CA par séjour). Décompose chaque réservation en coûts variables
// directs (commission OTA réelle, frais Stripe, coût ménage) → marge de CONTRIBUTION par séjour.
//
// FAIT uniquement : la marge de contribution est un fait (coûts variables attribuables au séjour).
// L'allocation de charges FIXES (curseur €/nuit) est une HYPOTHÈSE, appliquée côté client seulement.
// Advisory pur, lecture seule, aucun LLM.

import { verifyBearer } from "./_adminauth.js";
import { pnlAllStays } from "../../src/utils/pnlSejour.js";

// Lit les réservations réelles via le proxy Sheet (bénéficie de son cache KV — même source que
// /api/ota-cost, pas de 2e appel Apps Script de 32s si le dashboard a déjà chargé). [] si indispo.
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

  const nowYear = new Date().getUTCFullYear();
  const requestedYear = url.searchParams.get("year") || String(nowYear);

  const origin = url.origin;
  const reservations = await fetchReservations(origin, env);
  if (reservations.length === 0) {
    return json({ error: "Réservations indisponibles (Sheet muet) — recharge le dashboard puis réessaie." }, 503);
  }

  // Années réellement présentes (checkin 20xx) pour piloter le sélecteur d'année du front.
  const ys = new Set();
  for (const r of reservations) {
    const y = String(r?.checkin || "").slice(0, 4);
    if (/^20\d\d$/.test(y)) ys.add(y);
  }
  const yearsAvailable = [...ys].sort().reverse();
  const year = ys.has(requestedYear) ? requestedYear : (yearsAvailable[0] || requestedYear);

  const pnl = pnlAllStays(reservations, year); // fraisMenage = table réelle par défaut

  return json({
    version: 1,
    generated_at: new Date().toISOString(),
    annee_reference: Number(year) || nowYear,
    annees_disponibles: yearsAvailable,
    ...pnl,            // { stays, global, parCanal, parBien, year } — tout est FAIT
    blind_spots: [
      "Le coût « ménage » est le tarif de ménage par bien (table fraisMenage), proxy du coût réel payé au prestataire — pas une facture ligne à ligne.",
      "La marge affichée est une marge de CONTRIBUTION (après coûts variables directs), pas un net final : les charges fixes (assurance, énergie, prêt, taxe) ne sont PAS déduites ici — active le curseur €/nuit pour une estimation.",
      "Les blocs iCal « CLOSED - Not available » et les annulations sont exclus ; un séjour OTA sans montant importé (0€) est aussi exclu et n'apparaît donc pas.",
    ],
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" },
  });
}
