// Données concurrentielles retirées pour sécurité (intel pricing Airbnb).
// Cette Function prend priorité sur toute réponse CDN cachée pour ces URLs.
export function onRequest() {
  return new Response(null, { status: 404 });
}
