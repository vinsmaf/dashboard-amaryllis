// Invitation directe voyageurs OTA — reco Service Client (2026-07-18).
// Segmentation email exploitable/captif déjà faite par isReactivableEmail (otaCost.js, I-04) ;
// ici la question est différente : quel CANAL utiliser pour recontacter un voyageur OTA sans
// jamais lui envoyer d'email marketing (bounce quasi certain sur adresse proxy + hors du
// périmètre "gestion de séjour" autorisé par les CGU Airbnb/Booking) ? Réponse : le livret
// d'accueil / écran TV, déjà consulté PENDANT le séjour — canal légitime, zéro CGU à violer.
//
// `ctx` = réponse de /api/tv-context ({ source: "direct"|"ota", ... }).
export function shouldShowDirectInvite(ctx) {
  return ctx?.source === "ota";
}
