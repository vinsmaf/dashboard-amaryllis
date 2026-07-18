// Digest hebdo RM — logique pure (testée par rmPriceDigest.test.js).
//
// Le moteur RM stocke une recommandation par bien par jour sur ~14 mois glissants
// (2500+ lignes), quasi jamais revues une par une par Vincent. Ce module ne filtre
// PAS pour décider à sa place — il isole les écarts SIGNIFICATIFS entre le prix
// recommandé et le prix RÉELLEMENT affiché sur le site, sur la fenêtre où une
// correction a encore un effet (lead time court). RM reste 100% advisory : aucun
// prix n'est modifié ici, seul le signal "regarde ça" est produit.

import { getBien } from "../data/biens.js";

const round0 = (n) => Math.round(Number(n) || 0);

function safeParseFlags(raw) {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

/**
 * Résout le prix RÉELLEMENT affiché pour bienId à une date — même règle de résolution
 * que le site public (PublicSite.jsx) : dailyPricesMap[date] ?? bien.prix (fallback).
 * `dailyPricesByBien` : { [bienId]: { "YYYY-MM-DD": prix } }.
 */
export function resolveLivePrice(bienId, date, dailyPricesByBien) {
  const daily = dailyPricesByBien?.[bienId]?.[date];
  if (daily != null) return Number(daily);
  const bien = getBien(bienId);
  return bien ? bien.prix : null;
}

/**
 * Filtre les recommandations RM (status pending) pour ne garder que les écarts
 * significatifs vs le prix live, dans la fenêtre actionnable.
 * `recos` : lignes rm_recommendations { property_id, date, recommended_price_cents,
 *   lead_time_days, alert_flags, vacancy_risk_score, premium_opportunity }.
 * Exclut les dates déjà vendues (alert_flags: already_booked) — reco indicative, pas actionnable.
 */
export function computeSignificantGaps(recos, dailyPricesByBien, { thresholdPct = 0.12, maxLeadDays = 30 } = {}) {
  const gaps = [];
  for (const r of recos || []) {
    if (r?.lead_time_days != null && r.lead_time_days > maxLeadDays) continue;
    if (r?.lead_time_days != null && r.lead_time_days < 0) continue; // date passée, bruit
    const flags = safeParseFlags(r?.alert_flags);
    if (flags.includes("already_booked")) continue;

    const live = resolveLivePrice(r?.property_id, r?.date, dailyPricesByBien);
    if (live == null || live <= 0) continue;
    const reco = round0((r?.recommended_price_cents || 0) / 100);
    if (reco <= 0) continue;

    const diffEur = reco - live;
    const pct = diffEur / live;
    if (Math.abs(pct) < thresholdPct) continue;

    gaps.push({
      property_id: r.property_id,
      date: r.date,
      live_price: live,
      recommended_price: reco,
      diff_eur: round0(diffEur),
      diff_pct: Math.round(pct * 100),
      lead_time_days: r.lead_time_days ?? null,
      vacancy_risk_score: r.vacancy_risk_score ?? null,
      premium_opportunity: r.premium_opportunity ?? null,
      direction: diffEur > 0 ? "hausse" : "baisse",
    });
  }
  // Plus gros écart € d'abord — le plus impactant à traiter en premier.
  gaps.sort((a, b) => Math.abs(b.diff_eur) - Math.abs(a.diff_eur));
  return gaps;
}

/** Regroupe les écarts par bien (compteur total + top N lignes) pour l'affichage du digest. */
export function groupGapsByProperty(gaps, maxPerProperty = 3) {
  const byProp = {};
  for (const g of gaps || []) {
    (byProp[g.property_id] ||= []).push(g);
  }
  const result = {};
  for (const [prop, list] of Object.entries(byProp)) {
    result[prop] = { total: list.length, top: list.slice(0, maxPerProperty) };
  }
  return result;
}
