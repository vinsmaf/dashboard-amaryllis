const CACHE = "amaryllis-v5";
const ASSETS = ["/", "/index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  // Supprimer TOUS les anciens caches (y compris v1..v4)
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Détecte un asset JS/CSS servi par erreur en HTML (cache empoisonné par un
// fallback SPA 200). Dans ce cas on refait un fetch en bypassant le cache HTTP.
function looksLikeHtmlForAsset(url, res) {
  const isAsset = /\.(js|css|mjs)$/i.test(url.pathname);
  if (!isAsset) return false;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("text/html");
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // ── Assets versionnés : garde-fou anti-empoisonnement ────────────────────
  // Si la réponse est du HTML alors qu'on attend du JS/CSS, on re-fetch en
  // forçant le réseau (cache: 'reload') pour évincer la copie corrompue.
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (looksLikeHtmlForAsset(url, res)) {
          return fetch(e.request, { cache: "reload" });
        }
        return res;
      }).catch(() => fetch(e.request, { cache: "reload" }))
    );
    return;
  }

  // Ne pas intercepter les APIs ni les domaines externes
  if (url.pathname.startsWith("/api/") ||
      url.hostname.includes("google") ||
      url.hostname.includes("airbnb") ||
      url.hostname.includes("booking") ||
      url.hostname.includes("corsproxy") ||
      url.hostname.includes("allorigins")) return;

  // Stratégie network-first pour le reste (HTML, images locales)
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && res.type !== "opaque") {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
