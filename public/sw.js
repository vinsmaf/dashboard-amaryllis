// KILL SWITCH — ce Service Worker se désinscrit lui-même et purge tous les caches.
// Raison : l'ancien SW (cache HTML network-first) a servi des documents périmés
// (ex. un 404.html déployé brièvement resté en cache pour /admin). Pour un site de
// réservation + dashboard admin, la fiabilité prime sur le mode hors-ligne PWA.
// Chaque navigateur qui récupère ce sw.js va : vider les caches, se désinscrire,
// puis recharger ses onglets → site frais garanti, plus aucune interférence SW.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // 1. Purger tous les caches
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    // 2. Se désinscrire
    await self.registration.unregister();
    // 3. Recharger tous les onglets contrôlés pour repartir sans SW
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) {
      client.navigate(client.url);
    }
  })());
});

// Pass-through total — on n'intercepte plus rien (réseau direct).
self.addEventListener("fetch", () => {});
