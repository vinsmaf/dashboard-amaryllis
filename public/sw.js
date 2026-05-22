const CACHE = "amaryllis-v4";
const ASSETS = ["/", "/index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  // Supprimer TOUS les anciens caches (y compris v1, v2)
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Ne jamais cacher les assets versionnés (hash dans le nom) ni les APIs
  if (url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/api/") ||
      url.hostname.includes("google") ||
      url.hostname.includes("airbnb") ||
      url.hostname.includes("booking") ||
      url.hostname.includes("corsproxy") ||
      url.hostname.includes("allorigins")) return;

  // Stratégie network-first pour les autres ressources
  e.respondWith(
    fetch(e.request).then(res => {
      // Ne cacher que les réponses valides (pas les fallbacks HTML pour les assets)
      if (res.ok && res.type !== "opaque") {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
