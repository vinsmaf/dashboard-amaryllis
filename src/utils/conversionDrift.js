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

// ── Détection d'un maillon faible dans le tunnel (rituel quotidien "1 action/j") ──
// Signal 10 de kpi-sentinel.js. Distinct de detectConversionDrop (vue globale
// view_item→purchase) : ici on regarde CHAQUE étape interne du tunnel
// (begin_checkout→add_payment_info, add_payment_info→purchase) pour désigner UN
// maillon précis à corriger, pas juste "la conversion globale a baissé".
//
// Garde anti-bruit : même logique que detectConversionDrop (volume mini + seuil de
// baisse relative), appliquée à CHAQUE étape indépendamment.
//
// Garde "achats hors tunnel" (WhatsApp/devis) : si purchase > add_payment_info sur
// l'une des deux périodes, le ratio add_payment_info→purchase n'est mathématiquement
// pas interprétable (cf. scripts/funnel.mjs) — cette étape est exclue du diagnostic
// plutôt que de produire un faux signal ou un ratio >100%.

const STEPS = [
  { key: "bc_to_api", from: "beginCheckout", to: "addPaymentInfo", label: "begin_checkout → add_payment_info" },
  { key: "api_to_purchase", from: "addPaymentInfo", to: "purchase", label: "add_payment_info → purchase" },
];

/**
 * @param {{beginCheckout:number, addPaymentInfo:number, purchase:number}} current
 * @param {{beginCheckout:number, addPaymentInfo:number, purchase:number}} previous
 * @param {{ minVolume?: number, dropThreshold?: number }} [opts]
 * @returns {{ step:string, label:string, dropPct:number, currentRate:number, previousRate:number } | null}
 *   Le maillon qui s'est le PLUS dégradé (dropPct le plus négatif) parmi les étapes exploitables, ou null.
 */
export function worstStepDrop(current, previous, opts = {}) {
  const minVolume = opts.minVolume ?? 10; // plus permissif que MIN_VIEW_ITEM : les étapes basses du tunnel ont naturellement moins de volume
  const dropThreshold = opts.dropThreshold ?? 0.3;
  if (!current || !previous) return null;

  // achats hors tunnel (ex: lien de paiement WhatsApp) → add_payment_info→purchase non interprétable
  const skipApiToPurchase =
    current.purchase > current.addPaymentInfo || previous.purchase > previous.addPaymentInfo;

  let worst = null;
  for (const step of STEPS) {
    if (step.key === "api_to_purchase" && skipApiToPurchase) continue;
    const curFrom = current[step.from], curTo = current[step.to];
    const prevFrom = previous[step.from], prevTo = previous[step.to];
    if (curFrom < minVolume || prevFrom < minVolume) continue;

    const currentRate = conversionRate(curTo, curFrom);
    const previousRate = conversionRate(prevTo, prevFrom);
    if (currentRate === null || previousRate === null || previousRate === 0) continue;

    const dropPct = (currentRate - previousRate) / previousRate;
    if (dropPct > -dropThreshold) continue;

    if (!worst || dropPct < worst.dropPct) {
      worst = { step: step.key, label: step.label, dropPct, currentRate, previousRate };
    }
  }
  if (!worst) return null;
  return { ...worst, dropPct: Math.round(worst.dropPct * 100) };
}

// Événements GA4 réels (funnelByBien) pour chaque étape "from"/"to" de STEPS ci-dessus.
const STEP_EVENTS = {
  bc_to_api: { from: "begin_checkout", to: "add_payment_info" },
  api_to_purchase: { from: "add_payment_info", to: "purchase" },
};

/**
 * Désigne le bien le plus en cause sur UNE étape du tunnel, à partir des lignes brutes
 * `funnelByBien` de GA4 (`{eventName, "customEvent:bien_id", eventCount}`, cf. analytics.js
 * data-funnel-bien). Best-effort : la dimension custom bien_id peut être vide/partielle
 * (mise en place récente) — retourne null plutôt que de deviner.
 *
 * @param {Array<{eventName:string, "customEvent:bien_id":string, eventCount:number}>} rows
 * @param {"bc_to_api"|"api_to_purchase"} step
 * @param {{ minVolume?: number }} [opts]
 * @returns {string|null} bien_id le moins performant sur cette étape, ou null
 */
export function findWorstBienForStep(rows, step, opts = {}) {
  const minVolume = opts.minVolume ?? 5;
  const events = STEP_EVENTS[step];
  if (!Array.isArray(rows) || !rows.length || !events) return null;

  const byBien = {};
  for (const r of rows) {
    const bien = r["customEvent:bien_id"];
    if (!bien) continue;
    if (r.eventName === events.from) byBien[bien] = { ...(byBien[bien] || {}), from: r.eventCount };
    if (r.eventName === events.to) byBien[bien] = { ...(byBien[bien] || {}), to: r.eventCount };
  }

  let worstBien = null, worstRate = Infinity;
  for (const [bien, counts] of Object.entries(byBien)) {
    const from = counts.from || 0, to = counts.to || 0;
    if (from < minVolume) continue;
    const rate = conversionRate(to, from);
    if (rate === null) continue;
    if (rate < worstRate) { worstRate = rate; worstBien = bien; }
  }
  return worstBien;
}
