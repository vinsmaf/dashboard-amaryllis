// src/utils/priceGuard.js
// Détection NON BLOQUANTE d'un montant de réservation anormalement bas.
//
// Le serveur ne peut PAS valider le prix exact d'une résa : les prix nuitées sont
// dynamiques (saison/RM, résolus côté client) et les codes promo vont jusqu'à -99%
// (functions/api/promo-codes.js). Une VRAIE résa peut donc légitimement coûter quelques
// euros → AUCUN seuil de REJET n'est sûr (on casserait de vraies réservations).
// On se contente de SIGNALER à l'hôte (alerte, jamais de rejet) un montant très en
// dessous de la référence du bien, pour vérification / annulation manuelle.
//
// Pur & testable. Fail-safe : bien inconnu, nuits ≤ 0 ou montant ≤ 0 → pas d'alerte.
import { getBien } from "../data/biens.js";

// Fractions de (nuits × prix de base) sous lesquelles on alerte. Volontairement TRÈS
// basses : on ne veut signaler QUE les montants grossièrement anormaux (≈ −80 % et plus),
// jamais une remise durée (−15 %) ou une promo normale. Pour le 2×, l'acompte = 30 % du
// total → seuil proportionnellement plus bas.
const RATIO_FULL = 0.20;
const RATIO_2X = 0.06;

export function nightsBetween(checkin, checkout) {
  if (!checkin || !checkout) return 0;
  const a = new Date(checkin + "T12:00:00Z");
  const b = new Date(checkout + "T12:00:00Z");
  const n = Math.round((b - a) / 86400000);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Renvoie { low, refEur, nights }. `amountEur` = montant réellement débité (l'acompte si 2×).
// `payPlan` = "full" | "2x". low=true seulement si le montant est anormalement bas.
export function lowAmountInfo({ bienId, checkin, checkout, amountEur, payPlan = "full" }) {
  const bien = getBien(bienId);
  const nights = nightsBetween(checkin, checkout);
  const amt = Number(amountEur) || 0;
  if (!bien || !bien.prix || nights <= 0) return { low: false, refEur: 0, nights };
  const ratio = payPlan === "2x" ? RATIO_2X : RATIO_FULL;
  const refEur = nights * bien.prix;
  return { low: amt > 0 && amt < refEur * ratio, refEur, nights };
}
