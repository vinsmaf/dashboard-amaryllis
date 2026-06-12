// Logique pure du paiement en 2 fois (acompte 30% + solde à J-30). Testable sans DOM/Stripe.
// ⚠️ Les montants sont en EUROS entiers (comme finalTotal côté UI). Stripe = ×100 ailleurs.

const DEPOSIT_RATE = 0.30;
export const MIN_TOTAL_2X = 800;     // sous ce total, option masquée
export const MIN_DAYS_AHEAD = 35;    // arrivée doit être > 35 j pour laisser le temps du débit J-30
export const BALANCE_LEAD_DAYS = 30; // solde débité à arrivée - 30 j

export function depositAmount(total) {
  return Math.round(Number(total) * DEPOSIT_RATE);
}

export function balanceAmount(total) {
  return Math.round(Number(total)) - depositAmount(total);
}

// "2026-08-15" -> "2026-07-16" (arrivée - 30 j). Calcul UTC pour éviter les décalages.
export function balanceDueDate(checkinIso) {
  const d = new Date(checkinIso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - BALANCE_LEAD_DAYS);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso, toIso) {
  const a = new Date(fromIso + "T12:00:00Z");
  const b = new Date(toIso + "T12:00:00Z");
  return Math.round((b - a) / 86400000);
}

export function isTwoPartEligible({ total, checkin, today }) {
  if (!total || !checkin || !today) return false;
  if (Number(total) < MIN_TOTAL_2X) return false;
  if (daysBetween(today, checkin) <= MIN_DAYS_AHEAD) return false;
  return true;
}
