// Moteur d'auto-rédaction des guides voyageurs (property_guides D1) — logique PURE, testée.
// Règle de sûreté ABSOLUE : l'IA ne réécrit QUE la prose d'accueil/marketing. Les champs
// CRITIQUES (wifi, code d'accès, horaires, adresse, contacts, distances/infos pratiques) sont
// INTOUCHABLES — une hallucination sur le code d'accès = voyageur bloqué dehors.
//
// Le merge ne reprend que les champs éditables VALIDÉS (fact-check OK) ; tout le reste du guide
// est préservé à l'identique. Si l'IA tente de modifier un champ protégé → rejet.

import { factCheckCaption } from "./_factcheck.js";

// Champs que l'IA a le droit de réécrire (prose pure, aucun fait technique).
export const EDITABLE_FIELDS = ["welcome_message", "tagline"];

// Champs CRITIQUES — jamais modifiés automatiquement (toute divergence = rejet).
export const PROTECTED_FIELDS = [
  "property_id", "wifi_ssid", "wifi_password", "code_acces", "address", "maps_url",
  "checkin_time", "checkout_time", "contacts", "property_name",
];

/**
 * Valide une proposition de réécriture d'un guide.
 * @param {object} original   le guide actuel
 * @param {object} improved   la proposition de l'IA (champs réécrits)
 * @param {string} bienId     pour le fact-check conscient du bien
 * @param {Array}  learnedRules règles fact-check apprises (agent_lessons)
 * @returns {{ok:boolean, fails:string[], changed:string[]}}
 */
export function validateGuideEdit(original, improved, bienId = null, learnedRules = []) {
  const fails = [];
  const changed = [];
  if (!improved || typeof improved !== "object") return { ok: false, fails: ["proposition vide"], changed };

  // 1. Aucun champ protégé ne doit avoir été modifié
  for (const k of PROTECTED_FIELDS) {
    if (k in improved && JSON.stringify(improved[k]) !== JSON.stringify(original[k])) {
      fails.push(`champ protégé modifié: ${k}`);
    }
  }

  // 2. Les champs éditables proposés : fact-check + non vides + longueur raisonnable
  for (const k of EDITABLE_FIELDS) {
    if (!(k in improved)) continue;
    const val = improved[k];
    if (typeof val !== "string" || !val.trim()) { fails.push(`${k} vide ou non texte`); continue; }
    if (val.length > 1500) { fails.push(`${k} trop long (${val.length})`); continue; }
    const errs = factCheckCaption(val, learnedRules, bienId);
    if (errs.length) { fails.push(`${k} fact-check: ${errs.map((e) => e.reason).slice(0, 2).join(" · ")}`); continue; }
    if (val !== original[k]) changed.push(k);
  }

  return { ok: fails.length === 0 && changed.length > 0, fails, changed };
}

/**
 * Fusionne la proposition validée dans le guide original : ne reprend QUE les champs éditables
 * qui ont changé, préserve tout le reste à l'identique.
 */
export function mergeGuide(original, improved, changedFields) {
  const out = { ...original };
  for (const k of changedFields) {
    if (EDITABLE_FIELDS.includes(k) && k in improved) out[k] = improved[k];
  }
  return out;
}
