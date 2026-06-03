// src/utils/rmOccupancyAdjust.js — ajustement prix conseillé selon NOTRE occupation réelle (advisory, pur).
// rate30/rate90 ∈ [0,1] ou null ; leadTimeDays = jours avant la date ; basePriceCents = prix de base (cents).
export function pickRate(rate30, rate90, leadTimeDays) {
  if (leadTimeDays <= 30) return rate30 == null ? null : rate30;
  if (leadTimeDays <= 90) return rate90 == null ? null : rate90;
  return null;
}

export function occupancyAdjustment({ rate30 = null, rate90 = null, leadTimeDays = 0, basePriceCents = 0 }) {
  const rate = pickRate(rate30, rate90, leadTimeDays);
  const none = { adjCents: 0, vacancyDelta: 0, premiumDelta: 0, label: null, suggestMinStay: false, pct: 0, rate: null };
  if (rate == null) return none;
  let pct = 0, vacancyDelta = 0, premiumDelta = 0, suggestMinStay = false, label = null;
  if (rate >= 0.85)      { pct = 0.10;  premiumDelta = 30; vacancyDelta = -20; label = "occ_high"; }
  else if (rate >= 0.70) { pct = 0.05;  premiumDelta = 15; vacancyDelta = -10; label = "occ_mid_high"; }
  else if (rate <= 0.15) { pct = -0.12; vacancyDelta = 30; suggestMinStay = true; label = "occ_very_low"; }
  else if (rate <= 0.30) { pct = -0.07; vacancyDelta = 15; label = "occ_low"; }
  const adjCents = Math.round(basePriceCents * pct);
  return { adjCents, vacancyDelta, premiumDelta, label, suggestMinStay, pct, rate };
}
