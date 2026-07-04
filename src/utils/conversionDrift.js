// Logique pure : détecte une baisse significative du taux de conversion (funnel
// view_item → purchase, GA4) entre 2 snapshots. Utilisée par kpi-sentinel.js
// (signal 9 — monitoring conversion/revenus, arch-monitoring).
//
// Garde anti-bruit : sous un seuil de volume (view_item), le taux de conversion
// est trop volatil pour être un signal fiable — on ne compare pas.

const MIN_VIEW_ITEM = 30; // volume minimum pour que le % soit statistiquement lisible

export function conversionRate(purchase, viewItem) {
  if (!viewItem) return null;
  return purchase / viewItem;
}

/**
 * @param {{viewItem:number, purchase:number}} current
 * @param {{viewItem:number, purchase:number}} previous
 * @param {{ minViewItem?: number, dropThreshold?: number }} [opts] dropThreshold = baisse relative (0.3 = -30%)
 * @returns {{ dropPct: number, currentRate: number, previousRate: number } | null}
 */
export function detectConversionDrop(current, previous, opts = {}) {
  const minViewItem = opts.minViewItem ?? MIN_VIEW_ITEM;
  const dropThreshold = opts.dropThreshold ?? 0.3;

  if (!current || !previous) return null;
  if (current.viewItem < minViewItem || previous.viewItem < minViewItem) return null;

  const currentRate = conversionRate(current.purchase, current.viewItem);
  const previousRate = conversionRate(previous.purchase, previous.viewItem);
  if (currentRate === null || previousRate === null || previousRate === 0) return null;

  const dropPct = (currentRate - previousRate) / previousRate;
  if (dropPct > -dropThreshold) return null;

  return { dropPct: Math.round(dropPct * 100), currentRate, previousRate };
}
