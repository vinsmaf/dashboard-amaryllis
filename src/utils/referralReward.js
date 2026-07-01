// src/utils/referralReward.js
// Barème parrainage (Phase 3 fidélité, validé par Vincent 2026-07-01) — réutilisé par
// functions/api/crm-lifecycle.js (génération du code filleul) et
// functions/api/stripe-webhook.js (récompense du parrain une fois le code utilisé).
// Constantes centralisées pour ne jamais avoir 2 chiffres différents dans 2 fichiers.

// Ce que reçoit le FILLEUL sur sa 1ère résa directe (code à usage unique).
export const REFERRAL_FILLEUL_REWARD = { type: "percent", value: 10, validityDays: 60 };

// Ce que reçoit le PARRAIN une fois que son filleul a réservé (code à usage unique).
// Valeur fixe (~1 nuit, approximation volontairement simple) — reste sous la commission
// OTA évitée (~15-18%) sur une résa directe moyenne.
export const REFERRAL_PARRAIN_REWARD = { type: "amount_eur", value: 100, validityDays: 90 };

/** Construit la note stockée sur la ligne promo_codes, pour traçabilité en admin. */
export function referralNote(kind, clientLabel) {
  return kind === "filleul"
    ? `Parrainage — code filleul (parrain: ${clientLabel})`
    : `Parrainage — récompense parrain (${clientLabel})`;
}
