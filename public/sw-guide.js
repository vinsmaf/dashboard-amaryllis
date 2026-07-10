// Service Worker scoped à /guide-sejour/ — cache offline du livret d'accueil PWA.
// Enregistré uniquement depuis GuideSejour.jsx (scope: "/guide-sejour/"), jamais globalement.
// Stratégie : network-first avec repli cache, pour ne servir du contenu périmé
// que si le réseau est indisponible (voyageur en zone blanche/avion).
const CACHE_NAME = "guide-sejour-v2";
// /assets/ : bundle JS/CSS fingerprinté par le build Vite — sans ça, la page HTML pouvait être
// servie hors-ligne mais restait blanche (le bundle qui l'hydrate n'était jamais mis en cache).
const SCOPED_PATHS = ["/guide-sejour/", "/api/guides", "/assets/"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("guide-sejour-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const inScope = SCOPED_PATHS.some((p) => url.pathname.startsWith(p));
  if (!inScope || event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
