// Santé d'un feed iCal — logique pure testée (icalHealth.test.js).
//
// Contexte (dette pollinisation fermée le 2026-07-18, cross-learning « volume brut vs
// résultat filtré ») : `get-availability.js` détectait déjà un feed MUET (`!text` → degraded,
// fix DISPO-001). Mais un feed qui RÉPOND avec un VCALENDAR valide dont le format des VEVENT
// a changé — au point que le parser n'en extrait AUCUNE nuit — passait pour « aucune date
// bloquée » = « tout est libre ». Servi et mis en cache → surbooking silencieux (Stripe LIVE).
//
// Le discriminant : le VOLUME BRUT (nombre de VEVENT présents dans le texte) vs le RÉSULTAT
// (nuits extraites). Un feed avec des VEVENT mais 0 nuit extraite = parser cassé, pas un
// feed vide. Un feed SANS VEVENT = légitimement vide (bien sans résa sur ce canal, fréquent
// hors-saison) → PAS suspect, sinon on bloquerait à tort tout bien sans réservation.

/** Compte les VEVENT bruts présents dans le texte iCal, avant tout parsing de dates. */
export function countVevents(text) {
  if (!text || typeof text !== "string") return 0;
  const m = text.match(/BEGIN:VEVENT/g);
  return m ? m.length : 0;
}

/**
 * Un feed est-il « suspect de parser mort » ?
 * true UNIQUEMENT si le feed a du contenu VEVENT mais que le parseur n'en a tiré aucune nuit.
 *
 * @param text          le texte du feed (ou null si muet — géré ailleurs, ici false)
 * @param nightsExtracted  taille du Set de nuits renvoyé par le parser sur ce même texte
 *
 * Volontairement PAS suspect quand :
 *  - text est null/vide → c'est le cas « muet », déjà couvert par le degraded existant ;
 *  - 0 VEVENT → feed légitimement vide (aucune résa sur ce canal) ;
 *  - au moins 1 nuit extraite → le parseur fonctionne (une panne de format ferait échouer
 *    TOUS les VEVENT de la même manière, donc nightsExtracted resterait 0).
 *
 * Note : le parseur ne filtre pas par date (un VEVENT passé produit quand même des nuits),
 * donc « VEVENT présents mais 0 nuit » ne peut pas être un simple cas de résas toutes passées.
 */
export function feedSuspect(text, nightsExtracted) {
  return countVevents(text) > 0 && (nightsExtracted | 0) === 0;
}
