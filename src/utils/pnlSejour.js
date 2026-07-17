// I-03 — P&L par séjour (pas CA par séjour) : logique pure (testée par pnlSejour.test.js).
//
// Le CA brut d'un séjour ment : deux séjours au même prix nuit ne rapportent pas pareil.
// Un séjour Booking paie 17% de commission + le ménage ; un direct ne paie que ~1,5% Stripe.
// Un séjour court se fait manger par le coût de ménage FIXE (180€ à l'Amaryllis).
//
// Séparation stricte FAIT vs HYPOTHÈSE (doctrine Vincent, cf. otaCost.js) :
//  · marge de contribution = FAIT (CA − commission réelle − Stripe − ménage). Coûts VARIABLES,
//    directement attribuables au séjour, aucun arbitrage.
//  · allocation de charges fixes = HYPOTHÈSE (curseur €/nuit) — répartir une charge mensuelle
//    sur un séjour dépend d'une méthode choisie, jamais un fait. Calculée côté client, off par défaut.

import { commissionTaux, FRAIS_STRIPE } from "../config/canauxCommissions.js";
import { fraisMenage as fraisMenageDefaut } from "../config/fraisMenage.js";
import { normCanal } from "./otaCost.js";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Un séjour est-il réel (pas un bloc iCal « CLOSED - Not available », pas une annulation) ?
export function isSejourReel(r) {
  const montant = Number(r?.montant) || 0;
  if (montant <= 0) return false;
  const status = String(r?.status || "").toLowerCase();
  if (status.includes("annul") || status.includes("cancel")) return false;
  const notes = String(r?.notes || "").toLowerCase();
  if (notes.includes("closed") || notes.includes("not available")) return false;
  return true;
}

/**
 * P&L d'UN séjour (FAIT). Décompose le CA brut en ses coûts variables directs.
 * `resa` : { bienId, canal, montant, nights, ... }
 * `fraisMenageFn` : (bienId) → coût ménage (injectable pour test ; défaut = table réelle).
 * Retourne { ca, commission, stripe, menage, marge, margePct, canal, nights, margeParNuit }.
 */
export function pnlOneStay(resa, { fraisMenageFn = fraisMenageDefaut } = {}) {
  const ca = round2(resa?.montant);
  const canal = normCanal(resa?.canal);
  const bienId = resa?.bienId;
  const nights = Math.max(0, Number(resa?.nights) || 0);

  const commission = round2(ca * commissionTaux(canal, bienId));
  const stripe = round2(canal === "direct" ? ca * FRAIS_STRIPE : 0);
  const menage = round2(fraisMenageFn(bienId));

  const marge = round2(ca - commission - stripe - menage);
  return {
    id: resa?.id,
    bienId,
    voyageur: resa?.voyageur,
    checkin: resa?.checkin,
    canal,
    nights,
    ca,
    commission,
    stripe,
    menage,
    marge,                                          // marge de CONTRIBUTION (FAIT)
    margePct: ca > 0 ? Math.round((marge / ca) * 100) : 0,
    margeParNuit: nights > 0 ? round2(marge / nights) : null,
  };
}

// Cumule une ligne de P&L dans un accumulateur { ca, commission, stripe, menage, marge, count, nights }.
function accumule(acc, p) {
  acc.ca += p.ca; acc.commission += p.commission; acc.stripe += p.stripe;
  acc.menage += p.menage; acc.marge += p.marge; acc.nights += p.nights; acc.count += 1;
  return acc;
}
const vide = () => ({ ca: 0, commission: 0, stripe: 0, menage: 0, marge: 0, count: 0, nights: 0 });
function cloture(acc) {
  return {
    ca: round2(acc.ca), commission: round2(acc.commission), stripe: round2(acc.stripe),
    menage: round2(acc.menage), marge: round2(acc.marge), count: acc.count, nights: acc.nights,
    margePct: acc.ca > 0 ? Math.round((acc.marge / acc.ca) * 100) : 0,
    margeParNuit: acc.nights > 0 ? round2(acc.marge / acc.nights) : null,
  };
}

/**
 * P&L de TOUS les séjours d'une année (FAIT). Filtre les blocs iCal / annulations, calcule chaque
 * séjour, et agrège par canal et par bien. `year` : "2025" | "2026" | null (= toutes années).
 */
export function pnlAllStays(reservations, year, opts = {}) {
  const stays = [];
  const global = vide();
  const parCanal = {};
  const parBien = {};

  for (const r of reservations || []) {
    if (!isSejourReel(r)) continue;
    if (year && String(r?.checkin || "").slice(0, 4) !== String(year)) continue;
    const p = pnlOneStay(r, opts);
    stays.push(p);
    accumule(global, p);
    accumule((parCanal[p.canal] ||= vide()), p);
    if (p.bienId) accumule((parBien[p.bienId] ||= vide()), p);
  }

  // Tri par marge décroissante (le plus rentable d'abord) — pratique pour l'UI.
  stays.sort((a, b) => b.marge - a.marge);

  const canaux = {};
  for (const [k, v] of Object.entries(parCanal)) canaux[k] = cloture(v);
  const biens = {};
  for (const [k, v] of Object.entries(parBien)) biens[k] = cloture(v);

  return { stays, global: cloture(global), parCanal: canaux, parBien: biens, year: year ? String(year) : null };
}

/**
 * Alloue une charge fixe (€/nuit) à chaque séjour → « net après charges fixes » (HYPOTHÈSE réglable).
 * Le curseur €/nuit est saisi par l'utilisateur (défaut 0 = off). On soustrait `fixePerNuit × nights`
 * à la marge de contribution. Étiqueté ESTIMÉ dans l'UI — jamais fondu dans le FAIT.
 */
export function appliqueChargesFixes(pnl, fixePerNuit) {
  const f = Math.max(0, Number(fixePerNuit) || 0);
  if (f === 0) return pnl; // off : rien à estimer
  const stays = pnl.stays.map((s) => {
    const chargeFixe = round2(f * s.nights);
    const netEstime = round2(s.marge - chargeFixe);
    return { ...s, chargeFixe, netEstime, netPctEstime: s.ca > 0 ? Math.round((netEstime / s.ca) * 100) : 0 };
  });
  const netGlobal = round2(stays.reduce((sum, s) => sum + (s.netEstime ?? s.marge), 0));
  return { ...pnl, stays, fixePerNuit: f, netGlobalEstime: netGlobal };
}
