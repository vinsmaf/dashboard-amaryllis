// Helper partagé — adresse expéditeur Resend robuste.
//
// ⚠️ DEUX pièges historiques qui faisaient échouer des emails silencieusement :
//   1) La var d'env RESEND_FROM pouvait valoir "Amaryllis <notifications@>" (domaine
//      manquant) → Resend rejette TOUT avec "Domain not verified".
//   2) Le domaine RÉELLEMENT vérifié dans Resend est `villamaryllis.com` (racine,
//      DKIM `resend._domainkey.villamaryllis.com` + SPF `_spf.resend.com`).
//      `mail.villamaryllis.com` n'a JAMAIS été vérifié (aucun DNS) → tout `from`
//      en @mail.villamaryllis.com échouait.
//
// resendFrom() valide donc la présence d'un vrai domaine FQDN dans RESEND_FROM ;
// sinon il retombe sur `fallback` (par défaut une adresse @villamaryllis.com vérifiée).
// Toujours passer un fallback en @villamaryllis.com (jamais @mail.villamaryllis.com).
export function resendFrom(env, fallback = "Amaryllis <contact@villamaryllis.com>") {
  const f = env && env.RESEND_FROM;
  return (f && /@[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(f)) ? f : fallback;
}
