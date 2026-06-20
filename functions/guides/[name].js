// Les guides JSON statiques ont été retirés pour sécurité (codes d'accès).
// Les données sont désormais stockées en D1 et accessibles via /api/guides.
// Cette Function prend priorité sur toute réponse CDN cachée pour ces URLs.
export function onRequest() {
  return new Response(null, { status: 404 });
}
