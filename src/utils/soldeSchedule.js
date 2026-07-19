// src/utils/soldeSchedule.js
// Logique pure du DÉBIT AUTOMATIQUE du solde d'un devis (acompte + solde en 2 fois).
//
// Contexte : les résas normales du tunnel prélèvent le solde toutes seules (carte enregistrée
// → `payment_schedule` → `charge-balance.js` en off-session). Les devis (Payment Link) n'en
// bénéficiaient pas : leur solde partait par simple lien email + relances, avec auto-annulation
// à J-15 si impayé. Ce module fournit les 2 valeurs qui permettent de brancher un devis sur le
// rail existant, en encapsulant deux pièges qui coûtent cher :
//
//   1. UNITÉ — `payment_schedule.balance_amount` est en EUROS (charge-balance fait `×100` avant
//      d'appeler Stripe), alors que les montants d'un devis sont en CENTIMES. Poser les centimes
//      tels quels débiterait 100× trop (4 012 € → 401 200 €).
//   2. DATE VIDE — charge-balance sélectionne `WHERE status='pending' AND due_date <= <today>`.
//      En SQLite la comparaison est TEXTUELLE : `"" <= "2026-07-19"` vaut VRAI. Un `due_date`
//      vide/invalide déclencherait donc un débit IMMÉDIAT au lieu de J-30. D'où `soldeDueDate`
//      qui renvoie "" en cas d'entrée douteuse, et `canArmAutoDebit` qui REFUSE d'armer dans ce
//      cas (on retombe alors sur le mode lien+relances, dégradé mais sans danger).

// Nombre de jours avant l'arrivée où le solde est prélevé (aligné sur le J-30 du mode lien).
export const SOLDE_DAYS_BEFORE_CHECKIN = 30;

// "YYYY-MM-DD" (checkin) → "YYYY-MM-DD" (date de prélèvement), ou "" si l'entrée est inexploitable.
// Le "" est un refus explicite : l'appelant NE DOIT PAS armer le débit auto avec cette valeur.
export function soldeDueDate(checkin, daysBefore = SOLDE_DAYS_BEFORE_CHECKIN) {
  if (typeof checkin !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(checkin)) return "";
  const t = Date.parse(`${checkin}T00:00:00Z`);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t - daysBefore * 86400000);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// Centimes (devis) → euros entiers (payment_schedule.balance_amount). 0 si invalide/négatif.
export function balanceEurosFromCents(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n / 100);
}

// Garde-fou unique : peut-on armer le débit automatique du solde pour ce devis ?
// Exige un type "acompte", un solde réel, et une date d'échéance VALIDE et STRICTEMENT dans le
// futur par rapport à la référence (sinon le prélèvement partirait immédiatement).
export function canArmAutoDebit({ type, soldeCents, checkin, today }) {
  if (type !== "acompte") return false;
  const euros = balanceEurosFromCents(soldeCents);
  if (euros <= 0) return false;
  const due = soldeDueDate(checkin);
  if (!due) return false;
  const ref = typeof today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(today)
    ? today
    : new Date().toISOString().slice(0, 10);
  return due > ref; // comparaison lexicographique sûre sur du ISO YYYY-MM-DD
}
