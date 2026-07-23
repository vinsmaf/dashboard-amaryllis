// src/utils/audienceSaturation.js — Détection de sur-pression publicitaire par segment d'audience.
//
// Règle Vincent (2026-07-23), côté Meta : dans Ads Manager → Campagnes → Répartition →
// « Par segment d'audience », lire la RÉPÉTITION sur 30 jours par type d'audience.
//   • répétition > 10 sur les CLIENTS EXISTANTS = contre-productif. Ces gens connaissent déjà
//     la marque et ont vu la pub plus de 10 fois en un mois : on repaye pour rien.
//   • 5 à 10 suffit largement.
//   → on peut baisser le budget sans abîmer les performances, et réallouer ailleurs.
//
// Cohérent avec le CPMR (`metaAdsInsights.js`) : CPMR = CPM × répétition. Une répétition qui
// grimpe EST la saturation que le CPMR chiffre en euros. Ce module la traduit en décision.

// Au-delà : contre-productif, on paye pour ré-exposer des gens déjà largement touchés.
export const FREQ_MAX = 10;
// En dessous : la pression est faible, il reste de la marge (si la performance la justifie).
export const FREQ_SUFFISANT = 5;

// Libellés lisibles des segments renvoyés par Meta (clé technique → français).
export const SEGMENT_LABELS = {
  existing_customers: "Clients existants",
  engaged_audience: "Audience engagée",
  new_audience: "Nouvelles audiences",
  new_customers: "Nouveaux clients",
};

// Segments qui connaissent DÉJÀ la marque : c'est là que la sur-répétition coûte le plus cher,
// parce qu'on paye pour convaincre des gens déjà convaincus.
const SEGMENTS_CONNAISSENT_LA_MARQUE = new Set(["existing_customers", "engaged_audience"]);

function round(n, d = 2) {
  return Number.isFinite(n) ? Number(n.toFixed(d)) : null;
}

export function segmentLabel(key) {
  return SEGMENT_LABELS[key] || String(key || "—");
}

// Analyse un segment. `row` : { segment, spend, impressions, reach } (frequency recalculée
// depuis impressions/reach — jamais reprise telle quelle : c'est le ratio qui fait foi).
export function segmentSaturation(row = {}) {
  const segment = String(row.segment || "").toLowerCase();
  const spend = Number(row.spend) || 0;
  const impressions = Number(row.impressions) || 0;
  const reach = Number(row.reach) || 0;
  const frequency = reach > 0 ? round(impressions / reach) : null;
  const connaitLaMarque = SEGMENTS_CONNAISSENT_LA_MARQUE.has(segment);

  if (frequency === null) {
    return { segment, label: segmentLabel(segment), spend: round(spend), reach, impressions,
      frequency: null, verdict: "non_mesurable", connaitLaMarque,
      note: "Couverture nulle ou absente — répétition incalculable." };
  }

  let verdict, note, reductionPct = null, budgetCible = null, economieEstimee = null;

  if (frequency > FREQ_MAX) {
    verdict = "sature";
    // Pour ramener la répétition à FREQ_MAX à couverture constante, il faut diviser les
    // impressions par (frequency / FREQ_MAX) — donc, en première approche, le budget aussi.
    reductionPct = round((1 - FREQ_MAX / frequency) * 100, 1);
    budgetCible = round(spend * (FREQ_MAX / frequency));
    economieEstimee = round(spend - budgetCible);
    note = `Répétition ${frequency} sur la fenêtre : ces personnes ont vu la publicité ${Math.round(frequency)} fois. ` +
      `Au-delà de ${FREQ_MAX}, c'est contre-productif${connaitLaMarque ? " — et ce segment connaît déjà la marque" : ""}. ` +
      `Baisser le budget d'environ ${reductionPct} % ramènerait la répétition vers ${FREQ_MAX} sans réduire le nombre de personnes touchées. ` +
      `Estimation linéaire : la couverture peut aussi baisser un peu, donc à recontrôler après ajustement.`;
  } else if (frequency >= FREQ_SUFFISANT) {
    verdict = "optimal";
    note = `Répétition ${frequency} — dans la zone ${FREQ_SUFFISANT}-${FREQ_MAX}, c'est suffisant. Ne rien changer.`;
  } else {
    verdict = "sous_expose";
    note = `Répétition ${frequency} — sous ${FREQ_SUFFISANT}. Pression faible : il reste de la marge, à condition que la performance la justifie.`;
  }

  return { segment, label: segmentLabel(segment), spend: round(spend), reach, impressions,
    frequency, verdict, connaitLaMarque, reductionPct, budgetCible, economieEstimee, note };
}

// Audit complet : quels segments sont saturés, combien on peut récupérer, et quoi en faire.
export function auditAudienceFrequency(rows = []) {
  const segments = (rows || []).filter(Boolean).map(segmentSaturation);
  const satures = segments.filter((s) => s.verdict === "sature");
  const economieTotale = round(satures.reduce((sum, s) => sum + (s.economieEstimee || 0), 0));
  const depenseTotale = round(segments.reduce((sum, s) => sum + (s.spend || 0), 0));

  const actions = satures
    .sort((a, b) => (b.economieEstimee || 0) - (a.economieEstimee || 0))
    .map((s) => ({
      segment: s.segment,
      label: s.label,
      action: "baisser_budget",
      de: s.spend,
      vers: s.budgetCible,
      economie: s.economieEstimee,
      priorite: s.connaitLaMarque ? "haute" : "normale",
    }));

  let note;
  if (!segments.length) {
    note = "Aucune donnée par segment d'audience — répartition indisponible sur cette fenêtre.";
  } else if (!satures.length) {
    note = `Aucun segment au-dessus d'une répétition de ${FREQ_MAX} : la pression publicitaire est saine, rien à couper ici.`;
  } else {
    note = `${satures.length} segment(s) au-dessus d'une répétition de ${FREQ_MAX} — environ ${economieTotale} € récupérables sur la fenêtre ` +
      `(${depenseTotale ? round((economieTotale / depenseTotale) * 100, 1) : 0} % de la dépense analysée), à réallouer plutôt qu'à ré-exposer les mêmes personnes.`;
  }

  return { segments, satures: satures.length, economieEstimee: economieTotale, depenseAnalysee: depenseTotale, actions, note };
}
