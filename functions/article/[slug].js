// functions/article/[slug].js — Injection meta SEO pour les articles D1
// Intercepte /article/:slug, lit l'article en D1, injecte title/desc/og

const BASE = "https://villamaryllis.com";

function injectMeta(html, { title, desc, url, image }) {
  const og = `
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <link rel="canonical" href="${url}">`;
  const ld = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": desc,
      "url": url,
      "image": image,
      "author": { "@type": "Organization", "name": "Amaryllis Locations" },
      "publisher": { "@type": "Organization", "name": "Amaryllis Locations", "url": BASE },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${BASE}/` },
        { "@type": "ListItem", "position": 2, "name": "Conseils & bons plans", "item": `${BASE}/articles` },
        { "@type": "ListItem", "position": 3, "name": title, "item": url },
      ],
    },
  ]);
  // Retirer les balises du shell prérendu (sinon DOUBLE og:image/title/canonical —
  // le crawler prend souvent la 1ère = celle du shell, périmée). Notre injection fait foi.
  // Regex indépendants de l'ordre des attributs (le shell a `<meta id=… property="og:image">`).
  return html
    .replace(/<title>[^<]*<\/title>/i, "")
    .replace(/<meta\b[^>]*\bname="description"[^>]*>/gi, "")
    .replace(/<meta\b[^>]*\bproperty="og:(?:title|description|url|type|image(?::(?:width|height|alt))?)"[^>]*>/gi, "")
    .replace(/<meta\b[^>]*\bname="twitter:(?:card|title|description|image)"[^>]*>/gi, "")
    .replace(/<link\b[^>]*\brel="canonical"[^>]*>/gi, "")
    .replace("</head>", `${og}\n<script type="application/ld+json">${ld}</script>\n</head>`);
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const slug = params.slug;
  const db = env.revenue_manager;

  // Lire l'article en D1
  if (db) {
    try {
      const row = await db.prepare(
        "SELECT title, meta_title, meta_desc, image_url, status FROM seo_articles WHERE slug = ?"
      ).bind(slug).first();

      if (row && row.status === "published") {
        const title = row.meta_title || row.title;
        const desc = row.meta_desc || `Découvrez ${row.title} — guide pratique Martinique par Amaryllis Locations.`;
        const image = row.image_url || `${BASE}/photos/amaryllis/01.webp`;
        const url = `${BASE}/article/${slug}`;

        const resp = await context.next();
        const html = await resp.text();
        return new Response(injectMeta(html, { title, desc, url, image }), {
          status: 200,
          headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
        });
      }
    } catch { /* continue */ }
  }

  // Article non trouvé → laisser la SPA gérer (affichera 404)
  return context.next();
}
