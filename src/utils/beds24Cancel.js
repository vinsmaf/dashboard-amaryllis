// src/utils/beds24Cancel.js
// ─────────────────────────────────────────────────────────────────────────────
// Qui l'annulation automatique Beds24 a le DROIT de toucher.
//
// Contexte (2026-07-24) : `runCancelUnpaidBeds24Bookings` (Worker, cron */10) annule les
// paniers abandonnés du tunnel direct — résa Beds24 restée `status:"new"` parce que le
// voyageur n'a jamais payé. Elle ne filtrait QUE sur le statut et l'âge, jamais sur le canal.
// Or les résas Booking.com de Nogent arrivent elles aussi en `status:"new"` : le 2026-07-24,
// les 6 réservations dans cet état étaient TOUTES des Booking.com, et zéro venait de notre
// tunnel. Un token capable d'écrire aurait donc annulé de vraies réservations payantes ~4h
// après leur arrivée. Seul le fait que le token du Worker était en lecture seule l'a évité.
//
// Règle posée par Vincent : « le token ne doit toucher qu'aux réservations qui viennent de
// notre côté, pas celles ajoutées sur Beds24 ou ailleurs ».
//
// ⚠️ MIROIR : cette logique est dupliquée à la main dans workers/ical-sync/index.js
// (`runCancelUnpaidBeds24Bookings`) — le Worker n'importe aucun module ES. Garder les deux
// synchronisés (cf. pattern « logique pure testée + miroir » du CLAUDE.md).

/** Valeur de `referer` écrite par functions/api/beds24-create.js sur NOS résas. */
export const DIRECT_REFERER = "direct";

/** Délai avant qu'un panier non payé soit considéré comme abandonné. */
export const THRESHOLD_HOURS = 4;

/**
 * Vrai seulement si la réservation a été créée par NOTRE tunnel.
 * Volontairement une égalité stricte, pas un `includes` : le compte Beds24 de Vincent
 * s'appelle « Louer Premium » et sert à ses saisies manuelles — celles-là ne doivent
 * jamais être annulées automatiquement non plus.
 */
export function isOwnFunnelBooking(booking) {
  return String(booking?.referer ?? "").trim().toLowerCase() === DIRECT_REFERER;
}

/**
 * Âge en heures depuis la création, ou null si non déterminable.
 * Beds24 renvoie `bookingTime` en "YYYY-MM-DD HH:MM:SS" (UTC implicite).
 * Tout format non reconnu → null → jamais annulé (on échoue du côté sûr).
 */
export function bookingAgeHours(booking, nowMs) {
  const raw = booking?.bookingTime;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const ms = new Date(raw.replace(" ", "T") + "Z").getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const hours = (nowMs - ms) / 3600000;
  return Number.isFinite(hours) ? hours : null;
}

/**
 * Décide si une réservation peut être annulée automatiquement.
 * Les 4 conditions sont cumulatives — il suffit d'une seule qui manque pour épargner la résa.
 *
 * @param {object} booking            réservation Beds24 brute (id, status, referer, bookingTime)
 * @param {object} opts
 * @param {number} opts.nowMs         instant de référence
 * @param {number} [opts.thresholdHours]
 * @param {Set<string>} [opts.paidIds] ids Beds24 dont le paiement Stripe est confirmé en D1
 */
export function isCancellableAbandoned(booking, { nowMs, thresholdHours = THRESHOLD_HOURS, paidIds } = {}) {
  if (booking?.status !== "new") return false;      // confirmed / cancelled / black : jamais
  if (!isOwnFunnelBooking(booking)) return false;   // OTA + saisies manuelles : jamais
  if (paidIds && paidIds.has(String(booking.id))) return false; // payé côté Stripe : jamais
  const age = bookingAgeHours(booking, nowMs);
  return age !== null && age >= thresholdHours;
}

/** Partitionne une liste Beds24 en { toCancel, protectedPaid, spared }. */
export function partitionForCancellation(bookings, opts = {}) {
  const list = Array.isArray(bookings) ? bookings : [];
  const paidIds = opts.paidIds;
  const toCancel = [];
  const protectedPaid = [];
  const spared = [];

  for (const b of list) {
    if (isCancellableAbandoned(b, opts)) { toCancel.push(b); continue; }
    // « Payée mais encore new » = échec silencieux de confirmBeds24Booking, pas un abandon :
    // on la remonte à part pour alerter, sans jamais l'annuler.
    const wouldCancelIfUnpaid = isCancellableAbandoned(b, { ...opts, paidIds: undefined });
    if (wouldCancelIfUnpaid && paidIds && paidIds.has(String(b.id))) protectedPaid.push(b);
    else spared.push(b);
  }
  return { toCancel, protectedPaid, spared };
}
