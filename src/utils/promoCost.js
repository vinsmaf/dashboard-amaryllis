// src/utils/promoCost.js — Le vrai coût d'une remise (doctrine Vincent, 2026-07-23).
//
// Une promo de -20 % ne coûte PAS 20 %. Elle coûte trois fois :
//
//  1. COÛT DE MARGE, non linéaire. La remise sort intégralement du profit, pas du chiffre.
//     Exemple : prix 100 €, marge brute 60 % → coût 40 €, profit 60 €. Avec -20 % : prix 80 €,
//     coût toujours 40 €, profit 40 €. Passer de 60 à 40, ce n'est pas -20 %, c'est **-33 %**.
//     Règle générale : compression du profit = remise / marge brute.
//
//  2. COÛT COMPORTEMENTAL. On apprend au client à attendre la promo. Les clients acquis en
//     remise rachètent significativement moins au prix normal.
//
//  3. COÛT ALGORITHMIQUE. On signale à Meta que nos acheteurs sont des profils sensibles à la
//     remise ; l'algorithme part alors chercher davantage de ce profil. Une campagne qui a l'air
//     rentable et qui pousse du volume dégrade en réalité la marge ET la qualité de l'audience.
//
// Module PUR : il chiffre le coût n°1 et rappelle explicitement les coûts n°2 et n°3, qui ne se
// calculent pas mais doivent peser dans la décision.

function round(n, d = 2) {
  return Number.isFinite(n) ? Number(n.toFixed(d)) : null;
}

/**
 * Chiffre l'impact d'une remise sur la marge.
 * @param {number} price          prix normal (€)
 * @param {number} grossMarginPct marge brute au prix normal, en % (ex. 60)
 * @param {number} discountPct    remise consentie, en % (ex. 20)
 */
export function discountMarginImpact({ price, grossMarginPct, discountPct } = {}) {
  const p = Number(price) || 0;
  const m = Number(grossMarginPct) || 0;
  const d = Number(discountPct) || 0;
  if (p <= 0 || m <= 0 || d <= 0) {
    return { valide: false, note: "Prix, marge brute et remise doivent être strictement positifs." };
  }

  const coutUnitaire = round(p * (1 - m / 100));
  const profitAvant = round(p - coutUnitaire);
  const prixRemise = round(p * (1 - d / 100));
  const profitApres = round(prixRemise - coutUnitaire);

  // Le cœur de la règle : la remise se prélève sur le profit, donc son poids relatif est
  // amplifié par l'inverse de la marge. compression = remise / marge.
  const compressionPct = round((1 - profitApres / profitAvant) * 100, 1);

  // Volume qu'il faudrait vendre EN PLUS juste pour retrouver le même profit total.
  const volumeCompensateur = profitApres > 0 ? round(profitAvant / profitApres, 2) : null;
  const ventesSupplementairesPct = volumeCompensateur != null ? round((volumeCompensateur - 1) * 100, 1) : null;

  const venteAPerte = profitApres < 0;
  const profitAneanti = profitApres === 0;

  return {
    valide: true,
    prixNormal: round(p),
    prixRemise,
    coutUnitaire,
    profitAvant,
    profitApres,
    compressionPct,
    volumeCompensateur,
    ventesSupplementairesPct,
    venteAPerte,
    resume: venteAPerte
      ? `Remise de ${d} % sur une marge de ${m} % : chaque vente se fait À PERTE (${profitApres} € par vente).`
      : profitAneanti
        ? `Remise de ${d} % sur une marge de ${m} % : le profit tombe à zéro.`
        : `Remise de ${d} % sur une marge de ${m} % : le profit passe de ${profitAvant} € à ${profitApres} € par vente, ` +
          `soit une compression de ${compressionPct} % — pas ${d} %. Il faudrait vendre ${ventesSupplementairesPct} % de volume en plus ` +
          `pour ne rien perdre.`,
  };
}

// Les deux coûts qui ne se chiffrent pas mais qui doivent peser dans la décision.
export const COUTS_CACHES = [
  {
    id: "comportemental",
    libelle: "Vous apprenez au client à attendre la promo",
    detail: "Les clients acquis en remise rachètent significativement moins au prix normal. Le coût ne s'arrête pas à la vente en cours.",
  },
  {
    id: "algorithmique",
    libelle: "Vous entraînez l'algorithme à chercher des chasseurs de promo",
    detail: "Meta apprend que vos acheteurs sont sensibles à la remise et va prospecter davantage ce profil. La campagne peut sembler rentable en volume tout en dégradant la marge ET la qualité de l'audience.",
  },
];

// Verdict complet : le chiffre + les deux coûts non chiffrables, toujours rendus ensemble.
export function promoVerdict({ price, grossMarginPct, discountPct } = {}) {
  const impact = discountMarginImpact({ price, grossMarginPct, discountPct });
  if (!impact.valide) return { ...impact, coutsCaches: COUTS_CACHES };

  let niveau;
  if (impact.venteAPerte) niveau = "interdit";
  else if (impact.compressionPct >= 50) niveau = "lourd";
  else if (impact.compressionPct >= 30) niveau = "significatif";
  else niveau = "acceptable";

  return { ...impact, niveau, coutsCaches: COUTS_CACHES };
}

// Remise maximale supportable pour ne pas dépasser une compression de profit donnée.
// compression = remise / marge → remise = compression × marge.
export function remiseMaxPourCompression({ grossMarginPct, compressionMaxPct = 25 } = {}) {
  const m = Number(grossMarginPct) || 0;
  const c = Number(compressionMaxPct) || 0;
  if (m <= 0 || c <= 0) return null;
  return round(Math.min((c / 100) * m, m), 1);
}
