// src/utils/revenueSummary.js
// Agrégation CA/nuits/occupation/charges/cashflow/adr par mois par bien — PUR, testable.
// Consommé par functions/api/revenue-summary.js (endpoint /api/revenue-summary).
// `yearsData` = sortie de l'action Apps Script "revenueSummarySource" :
//   { [year]: { [bienId]: { ca, nuits, charges, cashflow: number[12] | null } } }  (index 0 = janvier)
import { computeOccupation } from "./calculations.js";
import { ALL_BIENS } from "../data/biens.js";

const round2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const sum0 = (v) => v || 0; // pour les totaux : null/undefined compte pour 0

// Prix de base par bien (src/data/biens.js) — sert de garde-fou de plausibilité pour adr.
const BASE_PRICE = Object.fromEntries(ALL_BIENS.map((b) => [b.id, b.prix]));

// Entités patrimoine hors location villamaryllis.com (confirmées par Vincent 2026-07-10) :
// pas dans src/data/biens.js, pas de prix canonique → adr toujours null pour elles.
//   - muscade      : bail long (location à l'année) — ca non décomposé dans le Sheet (null, pas 0).
//   - t4_amaryllis : résidence principale de Vincent — jamais louée, ca=0 CONNU (pas absent).
const PATRIMOINE_EXTRA = [
  { id: "muscade", caDefault: null },
  { id: "t4_amaryllis", caDefault: 0 },
];

// Nombre de jours calendaires du mois (1-12) — même convention que le Sheet
// ("jours dispos" = jours du mois, jamais ajusté pour une mise en ligne partielle).
export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// 12 mois glissants se terminant au mois de refDate (inclus), du plus ancien au plus récent.
export function last12Months(refDate = new Date()) {
  const y = refDate.getUTCFullYear();
  const m = refDate.getUTCMonth() + 1; // 1-12
  const out = [];
  for (let i = 11; i >= 0; i--) {
    let mm = m - i;
    let yy = y;
    while (mm < 1) { mm += 12; yy -= 1; }
    out.push({ year: yy, month: mm });
  }
  return out;
}

// ADR = ca/nuits, borné à [0.3×, 3×] le prix de base du bien (src/data/biens.js) — au-delà,
// renvoie null plutôt qu'un chiffre trompeur. Nécessaire car le CA d'un séjour est attribué
// à 100% sur son mois d'ARRIVÉE alors que les nuits sont réparties par occupation RÉELLE
// (cf. appscript/REVENUS_AUTO_2026.gs applyOne_) — un séjour à cheval sur 2 mois peut donner
// un ca/nuits ponctuel sans rapport avec un vrai prix de nuitée (vérifié en live 2026-07-10 :
// Amaryllis juillet 2026 = 4800€/1 nuit). Pas de prix canonique (Muscade/T4) → toujours null.
export function computeAdr(ca, nuits, prixBase) {
  if (ca == null || nuits == null || nuits <= 0 || !prixBase) return null;
  const raw = ca / nuits;
  if (raw < prixBase * 0.3 || raw > prixBase * 3) return null;
  return raw;
}

function buildEntity(id, bienData, month, dispos) {
  const extra = PATRIMOINE_EXTRA.find((e) => e.id === id);
  const ca = bienData?.ca?.[month - 1] ?? (extra ? extra.caDefault : 0);
  const nuits = bienData?.nuits?.[month - 1] ?? null;
  const charges = bienData?.charges?.[month - 1] ?? null;
  const cashflow = bienData?.cashflow?.[month - 1] ?? null;
  const occ = nuits == null ? null : computeOccupation(nuits, dispos);
  const adr = computeAdr(ca, nuits, BASE_PRICE[id]);
  return {
    ca: round2(ca), nuits, occ: round1(occ),
    charges: round2(charges), cashflow: round2(cashflow), adr: round2(adr),
  };
}

// { version, generated_at, months, ytd } — voir CLAUDE.md pour le schéma exposé.
// `bienIds` = biens "location" à inclure (normalement ALL_BIENS.map(b=>b.id)) — les entités
// patrimoine (Muscade/T4) sont TOUJOURS incluses en plus, indépendamment de ce paramètre.
export function buildRevenueSummary(yearsData, bienIds, refDate = new Date(), generatedAt = refDate.toISOString()) {
  const entityIds = [...new Set([...bienIds, ...PATRIMOINE_EXTRA.map((e) => e.id)])];

  const months = last12Months(refDate).map(({ year, month }) => {
    const yearData = yearsData[year] || yearsData[String(year)] || {};
    const dispos = daysInMonth(year, month);
    const par_bien = {};
    let total_ca = 0, total_nuits = 0, total_charges = 0, total_cashflow = 0;
    entityIds.forEach((id) => {
      const e = buildEntity(id, yearData[id], month, dispos);
      par_bien[id] = e;
      // Les totaux CA/nuits restent scopés aux biens location (comportement B1 v1 inchangé) ;
      // charges/cashflow couvrent TOUTES les entités (c'est le point de la vue patrimoine).
      if (bienIds.includes(id)) { total_ca += sum0(e.ca); total_nuits += sum0(e.nuits); }
      total_charges += sum0(e.charges);
      total_cashflow += sum0(e.cashflow);
    });
    return {
      month: `${year}-${String(month).padStart(2, "0")}`,
      par_bien,
      total_ca: round2(total_ca), total_nuits,
      total_charges: round2(total_charges), total_cashflow: round2(total_cashflow),
    };
  });

  const ytdYear = refDate.getUTCFullYear();
  const ytdMonths = months.filter((m) => m.month.startsWith(`${ytdYear}-`));
  const ytdParBien = {};
  entityIds.forEach((id) => {
    let ca = 0, nuits = 0, dispo = 0, charges = 0, cashflow = 0, nuitsKnown = false;
    ytdMonths.forEach((m) => {
      const e = m.par_bien[id];
      ca += sum0(e.ca); charges += sum0(e.charges); cashflow += sum0(e.cashflow);
      if (e.nuits != null) { nuits += e.nuits; nuitsKnown = true; }
      dispo += daysInMonth(ytdYear, parseInt(m.month.slice(5, 7), 10));
    });
    const occ = nuitsKnown ? computeOccupation(nuits, dispo) : null;
    ytdParBien[id] = {
      ca: round2(ca), nuits: nuitsKnown ? nuits : null, occ: round1(occ),
      charges: round2(charges), cashflow: round2(cashflow),
      adr: round2(computeAdr(ca, nuitsKnown ? nuits : null, BASE_PRICE[id])),
    };
  });

  return {
    version: 1,
    generated_at: generatedAt,
    months,
    ytd: {
      par_bien: ytdParBien,
      total_ca: round2(ytdMonths.reduce((s, m) => s + m.total_ca, 0)),
      total_nuits: ytdMonths.reduce((s, m) => s + m.total_nuits, 0),
      total_charges: round2(ytdMonths.reduce((s, m) => s + sum0(m.total_charges), 0)),
      total_cashflow: round2(ytdMonths.reduce((s, m) => s + sum0(m.total_cashflow), 0)),
    },
  };
}
