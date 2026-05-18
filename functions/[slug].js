// Cloudflare Pages Function — /:slug
// Intercepts property and guide URLs to inject SEO meta tags server-side
// so Googlebot sees correct title/description/og without waiting for JS execution

const BASE = "https://villamaryllis.com";

const BIENS = {
  amaryllis: {
    nom: "Villa Amaryllis",
    lieu: "Sainte-Luce, Martinique",
    prix: 280,
    desc: "Perchée sur les hauteurs de Sainte-Luce, la Villa Amaryllis offre piscine à débordement eau salée (4×7 m), terrasse de 100 m² face à la mer des Caraïbes, jacuzzi privatif et jardin tropical. 3 chambres, 8 personnes. Réservation directe sans frais.",
    amenities: ["Piscine à débordement", "Jacuzzi privé", "Vue mer", "Wifi Starlink", "Parking", "3 chambres"],
    rating: "4.94",
    reviews: 33,
  },
  zandoli: {
    nom: "Zandoli",
    lieu: "Sainte-Luce, Martinique",
    prix: 220,
    desc: "Appartement tropical niché dans un jardin luxuriant à Sainte-Luce, avec piscine privée, vue mer et terrasse au coucher du soleil. WiFi Starlink, Netflix, lave-linge. Idéal pour un séjour en couple ou en famille.",
    amenities: ["Piscine privée", "Vue mer", "Jardin tropical", "Wifi Starlink", "Netflix"],
    rating: "4.9",
    reviews: 28,
  },
  iguana: {
    nom: "Villa Iguana",
    lieu: "Sainte-Luce, Martinique",
    prix: 180,
    desc: "Villa sur deux niveaux dans la résidence Amaryllis à Sainte-Luce, avec piscine eau salée, vue sur le Rocher du Diamant et jardin fleuri. 2 chambres, 4 personnes, parking privatif.",
    amenities: ["Piscine eau salée", "Vue Diamant", "Vue mer", "Wifi Starlink", "Parking"],
    rating: "4.92",
    reviews: 25,
  },
  geko: {
    nom: "Géko",
    lieu: "Sainte-Luce, Martinique",
    prix: 150,
    desc: "Cocon tropical avec piscine privée et jardin luxuriant au sein de la résidence Amaryllis à Sainte-Luce. Climatisation, cuisine extérieure, barbecue. À 7 min des plages. 2 personnes.",
    amenities: ["Piscine privée", "Jardin tropical", "Climatisation", "Cuisine extérieure"],
    rating: "4.93",
    reviews: 20,
  },
  mabouya: {
    nom: "Mabouya — Studio jacuzzi vue mer",
    lieu: "Sainte-Luce, Martinique",
    prix: 110,
    desc: "Studio romantique avec jacuzzi privatif et vue mer enchanteresse à flanc de colline à Sainte-Luce. Jardin fleuri, terrasse privée, calme absolu. Idéal pour un séjour en couple dès 110€/nuit.",
    amenities: ["Jacuzzi privatif", "Vue mer", "Jardin fleuri", "Terrasse privée"],
    rating: "4.95",
    reviews: 18,
  },
  schoelcher: {
    nom: "Bellevue — Schœlcher",
    lieu: "Schœlcher, Martinique",
    prix: 100,
    desc: "Appartement de standing au dernier étage avec vue panoramique sur la mer des Caraïbes et la baie de Fort-de-France depuis Schœlcher. Brise marine, calme, à 5 min des plages. Dès 100€/nuit.",
    amenities: ["Vue panoramique mer", "Dernier étage", "Résidence sécurisée", "Parking"],
    rating: "4.88",
    reviews: 15,
  },
  nogent: {
    nom: "Appartement aux Portes de Paris",
    lieu: "Nogent-sur-Marne, Île-de-France",
    prix: 85,
    desc: "Appartement calme à Nogent-sur-Marne, à 15 minutes du centre de Paris en RER A. Idéal pour séjours professionnels et touristiques en Île-de-France. WiFi, tout équipé. Dès 85€/nuit.",
    amenities: ["15 min Paris RER A", "Wifi", "Calme", "Tout équipé"],
    rating: "4.85",
    reviews: 12,
  },
};

const GUIDE = {
  title: "Guide Sainte-Luce Martinique : plages, restaurants et activités",
  desc: "Tout ce qu'il faut savoir pour visiter Sainte-Luce en Martinique : les meilleures plages (Anse Corps de Garde, Gros Raisin), restaurants créoles, activités (plongée, distilleries, catamaran) et conseils pratiques.",
  image: `${BASE}/photos/amaryllis/01.webp`,
  url: `${BASE}/guide`,
};

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMeta(title, desc, url, image) {
  const t = escHtml(title);
  const d = escHtml(desc);
  const u = escHtml(url);
  const img = escHtml(image);
  return { title: t, desc: d, url: u, image: img };
}

function injectMeta(html, { title, desc, url, image }, ldJson) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${desc}" />`)
    .replace(/<link id="canonical"[^>]*>/, `<link id="canonical" rel="canonical" href="${url}" />`)
    .replace(/<meta id="og-title"[^>]*>/, `<meta id="og-title" property="og:title" content="${title}" />`)
    .replace(/<meta id="og-description"[^>]*>/, `<meta id="og-description" property="og:description" content="${desc}" />`)
    .replace(/<meta id="og-url"[^>]*>/, `<meta id="og-url" property="og:url" content="${url}" />`)
    .replace(/<meta id="og-image"[^>]*>/, `<meta id="og-image" property="og:image" content="${image}" />`)
    .replace(/<meta id="tw-title"[^>]*>/, `<meta id="tw-title" name="twitter:title" content="${title}" />`)
    .replace(/<meta id="tw-description"[^>]*>/, `<meta id="tw-description" name="twitter:description" content="${desc}" />`)
    .replace(/<meta id="tw-image"[^>]*>/, `<meta id="tw-image" name="twitter:image" content="${image}" />`)
    .replace(/<script type="application\/ld\+json" id="ld-main">[\s\S]*?<\/script>/, `<script type="application/ld+json" id="ld-main">${ldJson}</script>`);
}

export async function onRequest(context) {
  const { params, request } = context;
  const slug = params.slug;

  // Handle property pages
  if (BIENS[slug]) {
    const bien = BIENS[slug];
    const url = `${BASE}/${slug}`;
    const image = `${BASE}/photos/${slug}/01.webp`;
    const title = `${bien.nom} — Location ${bien.lieu} à partir de ${bien.prix}€/nuit`;
    const desc = bien.desc.slice(0, 155) + (bien.desc.length > 155 ? "…" : "");

    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      "@id": url,
      "name": bien.nom,
      "url": url,
      "description": bien.desc,
      "image": image,
      "priceRange": `À partir de ${bien.prix}€/nuit`,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": bien.rating,
        "reviewCount": bien.reviews,
        "bestRating": "5",
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": bien.lieu.split(",")[0]?.trim(),
        "addressRegion": bien.lieu.includes("Martinique") ? "Martinique" : "Île-de-France",
        "addressCountry": "FR",
      },
      "amenityFeature": bien.amenities.map(a => ({
        "@type": "LocationFeatureSpecification",
        "name": a,
      })),
      "provider": { "@id": `${BASE}/#organization` },
    });

    const meta = buildMeta(title, desc, url, image);

    // Fetch the base index.html via the next handler (static serving)
    const resp = await context.next();
    const html = await resp.text();
    const modified = injectMeta(html, meta, ldJson);

    return new Response(modified, {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Handle /guide
  if (slug === "guide") {
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": GUIDE.title,
      "description": GUIDE.desc,
      "url": GUIDE.url,
      "image": GUIDE.image,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` },
    });

    const meta = buildMeta(GUIDE.title, GUIDE.desc, GUIDE.url, GUIDE.image);
    const resp = await context.next();
    const html = await resp.text();
    const modified = injectMeta(html, meta, ldJson);

    return new Response(modified, {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Unknown slug — let Cloudflare handle (will redirect to / via _redirects)
  return context.next();
}
