// Logique pure du système de caution différée — le blocage (pré-autorisation) est posé
// off-session peu avant l'arrivée plutôt qu'à la réservation, parce qu'un blocage Stripe
// n'est valide que ~7 jours (prouvé sur le compte : caution Anaïs `capture_before` = +7,0 j).
//
// Testé dans caution.test.js. Importé par les Functions (stripe-webhook, place-caution).
// PAS de miroir GAS/Worker : le Worker ne fait qu'appeler l'endpoint en HTTP (il n'a pas la logique).

// Montant de caution pré-autorisé par bien (€). Valeurs = DEPOSIT_AMOUNTS (src/PublicSite.jsx),
// soit ce qui a réellement été pré-autorisé en prod (Antoine / Anaïs sur Zandoli = 500€).
export const CAUTION_AMOUNTS = {
  amaryllis:  1500,
  zandoli:    500,
  iguana:     500,
  geko:       500,
  mabouya:    500,
  schoelcher: 1000,
  nogent:     500,
};

export function cautionAmountFor(bienId) {
  return CAUTION_AMOUNTS[bienId] ?? 0;
}

// On pose la caution PLACE_DAYS_BEFORE jours avant l'arrivée (buffer de repli si l'auto-hold
// échoue), jamais avant aujourd'hui. Un blocage dure ~7 j → couvre intégralement les séjours
// ≤ 5 nuits jusqu'au départ ; au-delà il peut expirer ~1-2 j avant le départ (repli = re-poser
// via le lien manuel). `checkin` et `today` au format "YYYY-MM-DD". Retourne null si date invalide.
export const PLACE_DAYS_BEFORE = 2;

// Seuil "dernière minute" : si l'arrivée est dans NEAR_LEAD_DAYS jours ou moins, on prend la caution
// TOUT DE SUITE au paiement (inline) — inutile et risqué de la différer à un cron pour une arrivée si
// proche. Au-delà → caution différée (posée à J-2 par le cron). Le tunnel de résa et le webhook
// utilisent ce même seuil pour se répartir le travail sans jamais doublonner.
export const NEAR_LEAD_DAYS = 3;

// Nombre de jours entre `today` et `checkin` (peut être négatif si l'arrivée est passée). null si invalide.
export function leadDays(checkin, today) {
  if (!isISODate(checkin) || !isISODate(today)) return null;
  const a = new Date(checkin + "T00:00:00Z").getTime();
  const b = new Date(today + "T00:00:00Z").getTime();
  return Math.round((a - b) / 86400000);
}

// true = réservation de dernière minute (arrivée ≤ NEAR_LEAD_DAYS) → caution prise au paiement.
export function isNearBooking(checkin, today) {
  const d = leadDays(checkin, today);
  return d !== null && d <= NEAR_LEAD_DAYS;
}

export function placeDateFor(checkin, today) {
  if (!isISODate(checkin) || !isISODate(today)) return null;
  const target = addDaysISO(checkin, -PLACE_DAYS_BEFORE);
  // Jamais dans le passé : si l'arrivée est proche ou passée, on pose dès aujourd'hui.
  return target < today ? today : target;
}

// On re-pose le hold REAUTH_LEAD_DAYS jours avant son expiration (re-autorisation glissante :
// un blocage Stripe ne dure ~7 j, on en repose un neuf avant qu'il tombe → couvre les séjours
// de n'importe quelle durée). Pattern « reauthorization » recommandé par Stripe. Marge de 2 j →
// absorbe un run de cron raté (le cron tourne 1×/j).
export const REAUTH_LEAD_DAYS = 2;
// Libération automatique RELEASE_DAYS_AFTER jours après le départ (cohérent CGV §5 "levée 3 j après départ").
export const RELEASE_DAYS_AFTER = 3;

// Décide l'unique action à mener sur une caution au jour `today`. Pur & déterministe → testable.
// Entrées ("YYYY-MM-DD" sauf status) :
//   status        : 'pending' | 'held' | 'released' | 'captured' | 'failed'
//   placeDate     : date de pose initiale prévue (utilisée si pending)
//   captureBefore : date d'expiration du hold actuel, dérivée du Charge Stripe (utilisée si held)
//   checkout      : date de départ
// Retourne : 'place' | 'reauth' | 'release' | 'noop'
export function decideCautionAction({ status, placeDate, captureBefore, checkout, today }) {
  if (!isISODate(today)) return "noop";

  if (status === "pending") {
    // Ne jamais poser un hold sur un séjour DÉJÀ terminé (ligne pending stale / cron rattrapé tard).
    if (isISODate(checkout) && today >= addDaysISO(checkout, RELEASE_DAYS_AFTER)) return "noop";
    return isISODate(placeDate) && today >= placeDate ? "place" : "noop";
  }

  if (status === "held") {
    // 1) Départ passé depuis RELEASE_DAYS_AFTER → on libère (priorité sur le re-blocage).
    if (isISODate(checkout) && today >= addDaysISO(checkout, RELEASE_DAYS_AFTER)) return "release";
    // 2) Hold sur le point d'expirer ET fenêtre encore utile (jusqu'à la libération) → on re-pose.
    if (isISODate(captureBefore) && today >= addDaysISO(captureBefore, -REAUTH_LEAD_DAYS)) return "reauth";
    return "noop";
  }

  // released / captured / failed → plus rien à faire automatiquement.
  return "noop";
}

function isISODate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  // Rejette les dates au bon format mais irréelles (mois 13, 30 février…) :
  // elles passeraient le regex puis feraient déraper `Date`.
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function addDaysISO(iso, days) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
