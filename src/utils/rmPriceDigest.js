// Digest hebdo RM — logique pure (testée par rmPriceDigest.test.js).
//
// Le moteur RM stocke une recommandation par bien par jour sur ~14 mois glissants
// (2500+ lignes), quasi jamais revues une par une par Vincent. Ce module ne filtre
// PAS pour décider à sa place — il isole les écarts SIGNIFICATIFS entre le prix
// recommandé et le prix RÉELLEMENT affiché sur le site, sur la fenêtre où une
// correction a encore un effet (lead time court). RM reste 100% advisory : aucun
// prix n'est modifié ici, seul le signal "regarde ça" est produit.

import { getBien } from "../data/biens.js";
import { SEED_DAILY_PRICES } from "../seedPrices.js";

const round0 = (n) => Math.round(Number(n) || 0);

function safeParseFlags(raw) {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

/**
 * Résout le prix RÉELLEMENT affiché pour bienId à une date — même règle de résolution
 * que le site public (`loadDailyPrices()` dans PublicSite.jsx, PAS juste bien.prix) :
 * override serveur (site-config) ?? seed calibré (SEED_DAILY_PRICES) ?? bien.prix (dernier filet).
 *
 * ⚠️ Piège vécu 2026-07-18 : ce module ignorait `SEED_DAILY_PRICES` et comparait les recos RM
 * au prix flat bien.prix (280€ pour Amaryllis) — alors que le vrai prix affiché aux visiteurs
 * suit un calendrier saisonnier déjà calibré (ex. 430€ mi-août, pas 280€). Résultat : un écart
 * de "+121%" annoncé à Vincent qui était en réalité +26% une fois comparé au bon prix. Toujours
 * comparer une reco à CE calcul, jamais à bien.prix seul — cf. CLAUDE.md §1bis.
 * `dailyPricesByBien` : { [bienId]: { "YYYY-MM-DD": prix } } — overrides serveur (site-config).
 */
export function resolveLivePrice(bienId, date, dailyPricesByBien) {
  const override = dailyPricesByBien?.[bienId]?.[date];
  if (override != null) return Number(override);
  const seedPrice = SEED_DAILY_PRICES?.[bienId]?.[date];
  if (seedPrice != null) return Number(seedPrice);
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
