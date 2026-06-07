// functions/assets/[[asset]].js
// Force un vrai 404 quand un chunk JS/CSS demandé n'existe plus en statique.
//
// PROBLÈME résolu :
//   Cloudflare Pages applique le SPA fallback (/* → /index.html 200) sur TOUTES
//   les routes non trouvées, y compris /assets/PublicSite-PERIME.js.
//   Résultat : le navigateur reçoit index.html (text/html) en croyant recevoir
//   du JavaScript → erreur "is not a valid JavaScript MIME type" → page blanche
//   pour les visiteurs ayant un vieux index.html en cache après un deploy.
//
// SOLUTION :
//   Cette function intercepte tous les /assets/*, laisse Cloudflare servir le
//   fichier statique s'il existe (context.next()), et remplace par un vrai 404
//   si le SPA fallback s'est appliqué (signal : content-type text/html alors
//   qu'on demandait un asset .js/.css/.woff2/...).
//
// EFFET : le client (vite:preloadError + filet main.jsx) reçoit une vraie 404,
// déclenche le reload automatique, et récupère le nouvel index.html avec les
// bons hashes de bundles. Plus de page blanche silencieuse.

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Whitelist des extensions assets connues. Si on demande autre chose
  // (ex: /assets/index.html par erreur), on laisse Cloudflare gérer.
  const isAssetExt = /\.(js|mjs|css|map|woff2?|ttf|eot|svg|png|jpe?g|webp|avif|gif|ico|json|wasm)$/i.test(path);
  if (!isAssetExt) return context.next();

  const response = await context.next();

  // Si Cloudflare a servi le fichier statique correctement, le content-type
  // matche l'extension. Si le SPA fallback s'est appliqué, on reçoit text/html
  // pour une URL qui demandait du JS/CSS → c'est notre signal "chunk périmé".
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("text/html")) {
    return new Response(`Asset not found: ${path}`, {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Stale-Chunk": "1",
      },
    });
  }

  return response;
}
