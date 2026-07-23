// src/utils/contentMix.js — Logique pure de la discipline « 50/20/30 » en production créative
// (doctrine transmise par Vincent, 2026-07-23) :
//
//   30% NOUVEAU CONCEPT   — angle/promesse/offre jamais exploités.
//   20% ITÉRATION MINEURE — même concept, on fait varier hook / CTA / durée.
//   50% ITÉRATION MAJEURE — même concept, angle, offre, promesse ; on fait varier UN élément
//                            majeur (décor, avatar/créateur, ou format vidéo↔statique).
//
// L'erreur que fait la majorité des marques : sur-investir dans les nouveaux concepts et
// sous-exploiter ce qui marche déjà. La règle inverse ce réflexe en le rendant MESURABLE :
// on ne demande pas au LLM de "s'en souvenir" (il dérive vers le neuf comme un humain) — on
// calcule le mix RÉEL sur l'historique et on lui impose explicitement le type manquant.
//
// Consommé par functions/api/social-growth-agent.js et functions/api/reel-gen.js.

export const VARIATION_TYPES = ["new_concept", "minor_iteration", "major_iteration"];

export const TARGET_MIX = {
  new_concept: 0.30,
  minor_iteration: 0.20,
  major_iteration: 0.50,
};

// Éléments qu'une itération MAJEURE doit faire varier — un seul à la fois, jamais un remix flou.
export const MAJOR_ELEMENTS = ["decor", "avatar", "format"];

// En dessous de ce nombre d'items classifiés dans l'historique, impossible de calculer un mix
// significatif ET aucun concept n'a encore de quoi être itéré → on démarre par du neuf.
const BOOTSTRAP_MIN_SAMPLE = 3;

// Calcule les ratios réels sur l'historique récent. `items` : [{ variation_type }, ...].
// Ignore les items sans variation_type (contenu antérieur à l'instauration de la règle).
export function computeMixRatios(items = []) {
  const classified = items.filter((i) => i && VARIATION_TYPES.includes(i.variation_type));
  const total = classified.length;
  const counts = { new_concept: 0, minor_iteration: 0, major_iteration: 0 };
  for (const i of classified) counts[i.variation_type]++;
  const ratios = total > 0
    ? Object.fromEntries(VARIATION_TYPES.map((t) => [t, counts[t] / total]))
    : Object.fromEntries(VARIATION_TYPES.map((t) => [t, 0]));
  return { total, counts, ratios };
}

// Décide quel type produire ENSUITE : celui dont l'écart (cible − réel) est le plus grand,
// c'est-à-dire le plus sous-représenté. Phase de démarrage (< BOOTSTRAP_MIN_SAMPLE items
// classifiés) → 'new_concept' par défaut (rien à itérer tant qu'aucun concept n'existe).
export function nextVariationType(items = []) {
  const { total, ratios } = computeMixRatios(items);
  if (total < BOOTSTRAP_MIN_SAMPLE) return "new_concept";

  let best = null, bestGap = -Infinity;
  for (const t of VARIATION_TYPES) {
    const gap = TARGET_MIX[t] - ratios[t];
    if (gap > bestGap) { bestGap = gap; best = t; }
  }
  return best;
}

// Choisit le MEILLEUR concept existant à itérer (minor/major), à partir de l'impact mesuré
// (delta abonnés, cf. social-impact.js) — jamais au hasard : on double sur ce qui a PROUVÉ,
// pas sur le dernier post publié. `concepts` : [{ concept_id, bien_id, theme, angle,
// impactDelta:(number|null), createdAt:(unix) }]. Retourne null s'il n'existe aucun concept
// encore identifié (première exécution du système — rien à itérer).
export function pickConceptToIterate(concepts = []) {
  const valid = concepts.filter((c) => c && c.concept_id);
  if (!valid.length) return null;

  const withImpact = valid.filter((c) => typeof c.impactDelta === "number");
  const pool = withImpact.length ? withImpact : valid; // faute de mesure, on prend le plus récent

  return [...pool].sort((a, b) => {
    if (withImpact.length) {
      const d = (b.impactDelta ?? -Infinity) - (a.impactDelta ?? -Infinity);
      if (d !== 0) return d;
    }
    return (b.createdAt || 0) - (a.createdAt || 0);
  })[0];
}

// Construit le bloc d'instruction (français) à injecter dans le prompt LLM — explicite,
// actionnable, jamais une simple règle générale que le modèle pourrait ignorer.
// `iterationIndex` fait tourner l'élément majeur d'une itération à l'autre sur un MÊME concept :
// sans lui, itérer 2× le même concept produirait 2× la même consigne — donc une duplication,
// précisément ce que la règle interdit.
export function buildMixInstruction(type, concept, mixState, iterationIndex = 0) {
  const { counts, total } = mixState || { counts: {}, total: 0 };
  const header = total > 0
    ? `Mix actuel sur les ${total} derniers contenus : ${counts.new_concept || 0} nouveau(x) concept(s), ` +
      `${counts.minor_iteration || 0} itération(s) mineure(s), ${counts.major_iteration || 0} itération(s) majeure(s).`
    : "Aucun historique classifié — démarrage de la discipline 50/20/30.";

  if (type === "new_concept") {
    return `${header}\nCette fois : NOUVEAU CONCEPT — un angle/promesse/offre jamais exploité. ` +
      `Invente un concept réellement neuf (pas une variation de l'existant).`;
  }

  if (!concept) {
    // Aucun concept à itérer (système tout neuf) → repli sur du neuf, jamais une itération fantôme.
    return `${header}\nAucun concept antérieur à itérer pour l'instant → produis un NOUVEAU CONCEPT.`;
  }

  if (type === "minor_iteration") {
    return `${header}\nCette fois : ITÉRATION MINEURE sur le concept "${concept.angle}" (${concept.theme}, ` +
      `bien ${concept.bien_id}). Garde le MÊME concept, fais varier UNIQUEMENT le hook, le CTA, ou la durée. ` +
      `Ce n'est pas une duplication : le texte d'accroche doit être différent, l'angle/la promesse reste identique.`;
  }

  // major_iteration
  const element = MAJOR_ELEMENTS[Math.abs(hashSeed(`${concept.concept_id}#${iterationIndex}`)) % MAJOR_ELEMENTS.length];
  const elementLabel = { decor: "le décor", avatar: "l'avatar/le narrateur", format: "le format (vidéo ↔ statique)" }[element];
  return `${header}\nCette fois : ITÉRATION MAJEURE sur le concept "${concept.angle}" (${concept.theme}, ` +
    `bien ${concept.bien_id}). GARDE strictement le même concept, angle, offre et promesse. ` +
    `Fais varier UN SEUL élément majeur : ${elementLabel}. ` +
    `Ce n'est PAS une duplication ni un nouveau concept — le message de fond reste identique.`;
}

// Hash déterministe simple (pas de Math.random — reproductible pour les tests et les retries).
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}
