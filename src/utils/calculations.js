/**
 * Calculs métier purs pour Amaryllis Locations.
 *
 * EXTRAIT progressif depuis src/App.jsx pendant le refactor 2026.
 * Source unique de vérité pour les KPIs : occupation, ADR, RevPAR, cashflow.
 *
 * Toutes les fonctions sont PURES (pas d'effets de bord, pas de Date.now sauf
 * paramètre explicite). Testées dans calculations.test.js.
 */

// ── Helpers tableau ─────────────────────────────────────────────────────────

/**
 * Somme des n premières valeurs d'un tableau (valeurs nulles/undefined ignorées).
 * Utilisé pour "revenus YTD à n mois" (n = mois écoulés sur l'année courante).
 */
export const sumN = (arr, n) => (arr || []).slice(0, n).reduce((s, v) => s + (v || 0), 0);

/**
 * Moyenne des valeurs STRICTEMENT POSITIVES sur les n premières positions.
 * Utilisé pour ADR moyen (un mois à 0 = mois non commercialisé, on l'exclut).
 */
export const avgN = (arr, n) => {
  const valid = (arr || []).slice(0, n).filter(x => x > 0);
  return valid.length ? valid.reduce((s, x) => s + x, 0) / valid.length : 0;
};

// ── Helpers dates (format YYYY-MM-DD) ───────────────────────────────────────

/**
 * Date du jour en format YYYY-MM-DD (timezone locale).
 * Paramètre `now` optionnel pour les tests.
 */
export const todayStr = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

/**
 * Ajoute n jours à une date YYYY-MM-DD → retourne YYYY-MM-DD.
 * Utilise T12:00:00 pour éviter les pièges DST.
 */
export const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * Différence en jours entre deux dates YYYY-MM-DD (b - a).
 * Robuste face au DST grâce à T12:00:00.
 */
export const diffDays = (a, b) =>
  Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);

// ── Réservations → revenus mensuels par bien ────────────────────────────────

/**
 * Agrège les revenus mensuels par bien à partir d'une liste de réservations.
 * Filtre : montant > 0 + année cible + mois valide.
 *
 * @param {Array<{bienId, checkin, montant}>} reservations
 * @param {number} year — année à filtrer (par défaut année courante)
 * @returns {Record<bienId, number[12]>}
 */
export function computeRevenusFromResas(reservations, year = new Date().getFullYear()) {
  const map = {};
  (reservations || []).forEach(r => {
    if (!r.montant || r.montant <= 0) return;
    if (!r.checkin || r.checkin.slice(0, 4) !== String(year)) return;
    const month = parseInt(r.checkin.slice(5, 7)) - 1;
    if (month < 0 || month > 11) return;
    if (!map[r.bienId]) map[r.bienId] = new Array(12).fill(0);
    map[r.bienId][month] += Math.round(r.montant);
  });
  return map;
}

// ── KPIs locatifs : occupation, ADR, RevPAR ─────────────────────────────────

/**
 * Taux d'occupation (%) — nuits occupées / nuits disponibles × 100.
 * Renvoie 0 si dispo ≤ 0.
 */
export const computeOccupation = (nuitsOccupees, nuitsDispo) => {
  if (!nuitsDispo || nuitsDispo <= 0) return 0;
  return (nuitsOccupees / nuitsDispo) * 100;
};

/**
 * ADR (Average Daily Rate) — revenu / nuits occupées.
 * Renvoie 0 si pas de nuits occupées.
 */
export const computeADR = (revenu, nuitsOccupees) => {
  if (!nuitsOccupees || nuitsOccupees <= 0) return 0;
  return revenu / nuitsOccupees;
};

/**
 * RevPAR (Revenue Per Available Room) — revenu / nuits disponibles.
 * Équivalent algébrique : ADR × (occupation / 100).
 */
export const computeRevPAR = (revenu, nuitsDispo) => {
  if (!nuitsDispo || nuitsDispo <= 0) return 0;
  return revenu / nuitsDispo;
};

// ── Statut bien (cashflow agrégé sur n mois) ────────────────────────────────

/**
 * Classifie un bien selon son cashflow cumulé sur n mois.
 *  - "ok"   : cashflow ≥ 0
 *  - "warn" : cashflow entre -1000 et 0
 *  - "ko"   : cashflow < -1000
 */
export const statutBien = (bien, n) => {
  const cf = sumN(bien?.cashflow, n);
  if (cf >= 0) return "ok";
  if (cf > -1000) return "warn";
  return "ko";
};
