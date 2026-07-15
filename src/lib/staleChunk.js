// Détection des erreurs de "chunk périmé" (déploiement qui invalide un bundle en cache
// navigateur) — partagé entre main.jsx (auto-reload de récupération) et bugCapture.js
// (suppression du signalement : ce n'est pas un vrai bug, pas la peine de le remonter).
export const STALE_CHUNK_PATTERNS = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|is not a valid JavaScript MIME type|'text\/html' is not a valid|expected a JavaScript module|Failed to load resource|Loading chunk \d+ failed|ChunkLoadError|Unable to preload CSS/i;

// "Cannot read properties of undefined (reading 'default')" survient aussi quand un chunk lazy
// périmé résout un module corrompu après déploiement (vu en prod sur /rates et /mabouya, chunks
// recharts/vendor — bug-f55e5d8e8dc49258) — mais ce message est TROP générique pour matcher seul
// (un vrai bug de destructuring le produit aussi). On ne le traite comme "chunk périmé" QUE si la
// stack référence un asset buildé (/assets/*.js), sinon on laisse remonter normalement.
const GENERIC_UNDEFINED_DEFAULT = /Cannot read properties of undefined \(reading 'default'\)/i;
const ASSET_CHUNK_STACK = /\/assets\/[^)"'\s]+\.js/i;

export const isStaleChunkError = (msg, stack) =>
  STALE_CHUNK_PATTERNS.test(msg) || (GENERIC_UNDEFINED_DEFAULT.test(msg) && ASSET_CHUNK_STACK.test(stack || ""));
