// src/utils/revenueSummary.js
// Agrégation CA/nuits/occupation par mois par bien — PUR, testable.
// Consommé par functions/api/revenue-summary.js (endpoint /api/revenue-summary).
// `yearsData` = sortie de l'action Apps Script "revenueSummarySource" :
//   { [year]: { [bienId]: { ca: number[12], nuits: number[12] } } }  (index 0 = janvier)
import { computeOccupation } from "./calculations.js";

const round2 = (v) => Math.round((v || 0) * 100) / 100;
const round1 = (v) => Math.round((v || 0) * 10) / 10;

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

// { version, generated_at, months, ytd } — voir CLAUDE.md pour le schéma exposé.
export function buildRevenueSummary(yearsData, bienIds, refDate = new Date(), generatedAt = refDate.toISOString()) {
  const months = last12Months(refDate).map(({ year, month }) => {
    const yearData = yearsData[year] || yearsData[String(year)] || {};
    const dispos = daysInMonth(year, month);
    const par_bien = {};
    let total_ca = 0;
    let total_nuits = 0;
    bienIds.forEach((id) => {
      const bien = yearData[id];
      const ca = bien?.ca?.[month - 1] || 0;
      const nuits = bien?.nuits?.[month - 1] || 0;
      par_bien[id] = { ca: round2(ca), nuits, occ: round1(computeOccupation(nuits, dispos)) };
      total_ca += ca;
      total_nuits += nuits;
    });
    return { month: `${year}-${String(month).padStart(2, "0")}`, par_bien, total_ca: round2(total_ca), total_nuits };
  });

  const ytdYear = refDate.getUTCFullYear();
  const ytdMonths = months.filter((m) => m.month.startsWith(`${ytdYear}-`));
  const ytdParBien = {};
  bienIds.forEach((id) => {
    let ca = 0, nuits = 0, dispo = 0;
    ytdMonths.forEach((m) => {
      ca += m.par_bien[id].ca;
      nuits += m.par_bien[id].nuits;
      dispo += daysInMonth(ytdYear, parseInt(m.month.slice(5, 7), 10));
    });
    ytdParBien[id] = { ca: round2(ca), nuits, occ: round1(computeOccupation(nuits, dispo)) };
  });

  return {
    version: 1,
    generated_at: generatedAt,
    months,
    ytd: {
      par_bien: ytdParBien,
      total_ca: round2(ytdMonths.reduce((s, m) => s + m.total_ca, 0)),
      total_nuits: ytdMonths.reduce((s, m) => s + m.total_nuits, 0),
    },
  };
}
