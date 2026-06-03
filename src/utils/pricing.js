// src/utils/pricing.js — calculs argent côté voyageur (purs, testables).
// Remises par durée de séjour, appliquées sur le sous-total.
export function getDiscount(nights) {
  if (nights >= 28) return 0.15; // -15% pour 28+ nuits
  if (nights >= 14) return 0.10; // -10% pour 14+ nuits
  if (nights >= 7)  return 0.05; // -5%  pour 7+  nuits
  return 0;
}
export function discountLabel(nights) {
  if (nights >= 28) return "mensuel";
  if (nights >= 14) return "2 semaines";
  return "semaine";
}
// Total séjour : somme des prix nuitées − remise (arrondie) + frais de ménage.
// nightlyPrices : tableau des prix par nuit (déjà résolus depuis Beds24 ou fallback).
export function computeStayTotal(nightlyPrices, fraisMenage = 0) {
  const nights = Array.isArray(nightlyPrices) ? nightlyPrices.length : 0;
  if (nights <= 0) return { nights: 0, rawTotal: 0, discountRate: 0, discountAmt: 0, total: 0 };
  const rawTotal = nightlyPrices.reduce((s, p) => s + (p || 0), 0);
  const discountRate = getDiscount(nights);
  const discountAmt = Math.round(rawTotal * discountRate);
  const total = rawTotal - discountAmt + (fraisMenage || 0);
  return { nights, rawTotal, discountRate, discountAmt, total };
}
