// Cloudflare Pages Function — /:slug
// Intercepts property and guide URLs to inject SEO meta tags server-side
// so Googlebot sees correct title/description/og without waiting for JS execution

const BASE = "https://villamaryllis.com";

const BIENS = {
  amaryllis: {
    nom: "Villa Amaryllis",
    lieu: "Sainte-Luce, Martinique",
    prix: 280,
    desc: "Perchée sur les hauteurs de Sainte-Luce, la Villa Amaryllis offre une piscine à débordement eau salée (4×7 m), une terrasse de 100 m² face à la mer des Caraïbes et un jardin tropical luxuriant. 3 chambres climatisées, 8 personnes. Réservation directe sans frais.",
    amenities: ["Piscine à débordement eau salée", "Vue mer 180°", "Terrasse 100 m²", "Wifi Starlink", "Parking", "3 chambres climatisées"],
    rating: "4.94",
    reviews: 33,
  },
  zandoli: {
    nom: "Zandoli",
    lieu: "Sainte-Luce, Martinique",
    prix: 220,
    desc: "Villa contemporaine nichée dans un jardin luxuriant à Sainte-Luce, avec piscine privative à cascade, mezzanine, vue mer et terrasse au coucher du soleil. WiFi Starlink, Netflix, lave-linge. 5 personnes.",
    amenities: ["Piscine privative avec cascade", "Mezzanine", "Vue mer", "Jardin tropical", "Wifi Starlink", "Netflix"],
    rating: "4.5",
    reviews: 16,
  },
  iguana: {
    nom: "Villa Iguana",
    lieu: "Sainte-Luce, Martinique",
    prix: 180,
    desc: "Villa sur deux niveaux dans la résidence Amaryllis à Sainte-Luce, avec piscine eau salée, vue sur le Rocher du Diamant et jardin fleuri. 2 chambres, 6 personnes, parking privatif.",
    amenities: ["Piscine eau salée", "Vue Diamant", "Vue mer", "Wifi Starlink", "Parking"],
    rating: "4.92",
    reviews: 25,
  },
  geko: {
    nom: "Géko",
    lieu: "Sainte-Luce, Martinique",
    prix: 150,
    desc: "Cocon tropical avec piscine privative à cascade et jardin luxuriant au sein de la résidence Amaryllis à Sainte-Luce. Climatisation, cuisine extérieure, barbecue. À 7 min des plages. 4 personnes.",
    amenities: ["Piscine privative avec cascade", "Jardin tropical", "Climatisation", "Cuisine extérieure"],
    rating: "4.83",
    reviews: 24,
  },
  mabouya: {
    nom: "Mabouya — Studio jacuzzi vue mer",
    lieu: "Sainte-Luce, Martinique",
    prix: 110,
    desc: "Studio romantique avec jacuzzi privatif et vue mer enchanteresse à flanc de colline à Sainte-Luce. Jardin fleuri, terrasse privée, calme absolu. Idéal pour un séjour en couple dès 110€/nuit.",
    amenities: ["Jacuzzi privatif", "Vue mer", "Jardin fleuri", "Terrasse privée"],
    rating: "4.55",
    reviews: 11,
  },
  schoelcher: {
    nom: "Bellevue — Schœlcher",
    lieu: "Schœlcher, Martinique",
    prix: 100,
    desc: "Appartement de standing au dernier étage avec vue panoramique sur la mer des Caraïbes et la baie de Fort-de-France depuis Schœlcher. Brise marine, calme, à 5 min des plages. Dès 100€/nuit.",
    amenities: ["Vue panoramique mer", "Dernier étage", "Résidence sécurisée", "Parking"],
    rating: "4.8",
    reviews: 30,
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
  title: "Guide Sainte-Luce Martinique : plages & activités",
  desc: "Visiter Sainte-Luce en Martinique : meilleures plages (Anse Corps de Garde, Gros Raisin), restaurants créoles, plongée, distilleries et conseils pratiques.",
  image: `${BASE}/photos/amaryllis/01.webp`,
  url: `${BASE}/guide`,
};

const GUIDE_DIAMANT = {
  title: "Guide Le Diamant Martinique : rocher, plages et plongée",
  desc: "Tout sur Le Diamant en Martinique : le Rocher du Diamant (plongée, histoire), les plus belles plages et les meilleures adresses. À 15 min de Sainte-Luce.",
  image: `${BASE}/photos/iguana/01.webp`,
  url: `${BASE}/guide-le-diamant`,
};

const GUIDE_SAINTE_ANNE = {
  title: "Guide Sainte-Anne Martinique : plages & activités",
  desc: "Sainte-Anne en Martinique : Grande Anse des Salines (plus belle plage des Caraïbes), kitesurf, catamaran aux îlets, restaurants. À 20 min de Sainte-Luce.",
  image: `${BASE}/photos/amaryllis/05.webp`,
  url: `${BASE}/guide-sainte-anne`,
};

const GUIDE_EN = {
  title: "Villa Rental Martinique — Book Direct, No Airbnb Fees",
  desc: "Rent a luxury villa in Martinique with private pool and ocean view. Direct booking, no service fees. Sainte-Luce, Schœlcher. From €85/night.",
  image: `${BASE}/photos/amaryllis/02.webp`,
  url: `${BASE}/villa-rental-martinique`,
};

const GUIDE_ACTIVITES = {
  title: "10 activités incontournables à Sainte-Luce, Martinique",
  desc: "Les 10 activités incontournables à Sainte-Luce : plage, mangrove, bateau, plongée au Rocher du Diamant, distilleries. Guide rédigé par vos hôtes.",
  image: `${BASE}/photos/amaryllis/01.webp`,
  url: `${BASE}/activites-sainte-luce`,
};

const GUIDE_PROXIMITE = {
  title: "À proximité de la Villa Amaryllis — Sainte-Luce",
  desc: "Les meilleures adresses à moins de 15 min de la résidence Amaryllis : Anse Corps de Garde, Forêt de Montravail, distillerie Trois-Rivières, tortues marines.",
  image: `${BASE}/photos/amaryllis/01.webp`,
  url: `${BASE}/guide-proximite`,
};

// traf-013/019/025 — titres ≤60c (mot-clé en tête) + descriptions ≤158c (prix gardé en desc + JSON-LD)
const SEO = {
  amaryllis:  { title: "Villa Amaryllis Sainte-Luce — piscine vue mer Martinique", desc: "Villa Amaryllis à Sainte-Luce : piscine à débordement, vue Caraïbes 180°, 3 chambres, 8 personnes. Dès 280€/nuit en direct, sans frais Airbnb." },
  zandoli:    { title: "Zandoli Sainte-Luce — logement piscine cascade Martinique", desc: "Zandoli à Sainte-Luce : piscine privative à cascade, mezzanine, jardin tropical. 5 personnes. Dès 220€/nuit en réservation directe." },
  iguana:     { title: "Villa Iguana Martinique — vue Rocher du Diamant", desc: "Villa Iguana à Sainte-Luce : piscine eau salée, vue panoramique sur le Rocher du Diamant. 6 personnes. Réservation directe propriétaire." },
  geko:       { title: "Géko Sainte-Luce — cocon piscine cascade Martinique", desc: "Cocon Géko à Sainte-Luce : piscine privative à cascade, jardin tropical, sur les hauteurs. 4 personnes. Dès 150€/nuit en réservation directe." },
  mabouya:    { title: "Studio Mabouya Martinique — jacuzzi privatif vue mer", desc: "Studio Mabouya à Sainte-Luce : seul jacuzzi privatif vue mer de la résidence. Idéal couple, terrasse privée, plages à 5 min. Dès 110€/nuit." },
  schoelcher: { title: "Bellevue Schœlcher — appart vue baie Fort-de-France", desc: "Appartement Bellevue à Schœlcher : vue sur la baie de Fort-de-France, 2 personnes, à 10 min du centre. Réservation directe dès 100€/nuit." },
  nogent:     { title: "Appart Nogent-sur-Marne — bord de Marne, Paris 20 min", desc: "Appartement de standing à Nogent-sur-Marne : jardin privatif, home cinéma, bord de Marne. RER A, Paris en 20 min. Dès 85€/nuit en direct." },
};

const GROUP_STAY = {
  title: "Location grand groupe Martinique — 11 pers, Sainte-Luce",
  desc: "Réunissez jusqu'à 11 proches : Zandoli, Géko et Mabouya ensemble à Sainte-Luce. Résidence privée, piscines, réservation directe sans frais. Devis rapide.",
  image: `${BASE}/photos/zandoli/01.webp`,
  url: `${BASE}/location-groupe-sainte-luce`,
};

const SCHOELCHER_APPART = {
  title: "Location appartement vue mer Schœlcher — Martinique",
  desc: "Appartement de standing à Schœlcher : vue panoramique sur la baie de Fort-de-France, dernier étage, à 10 min du centre. Réservation directe sans frais.",
  image: `${BASE}/photos/schoelcher/01.webp`,
  url: `${BASE}/location-appartement-vue-mer-schoelcher`,
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
    const title = SEO[slug]?.title || `${bien.nom} — Location ${bien.lieu} à partir de ${bien.prix}€/nuit`;
    const desc = SEO[slug]?.desc || (bien.desc.slice(0, 155) + (bien.desc.length > 155 ? "…" : ""));

    // Compteur/note d'avis DYNAMIQUES depuis D1 (avis réels non masqués) → toujours
    // à jour sans re-synchroniser les 5 sources. Fallback sur la valeur codée (iguana/
    // nogent sans scrape, ou erreur D1) : ne casse jamais la page.
    let ratingValue = bien.rating, reviewCount = bien.reviews;
    let reviewLd = [];
    try {
      const db = context.env && context.env.revenue_manager;
      if (db) {
        const row = await db.prepare(
          "SELECT COUNT(*) n, ROUND(AVG(rating),2) avg FROM voyageur_feedback WHERE bien_id=? AND hidden=0"
        ).bind(slug).first();
        if (row && row.n > 0) { reviewCount = row.n; ratingValue = String(row.avg); }
        // 3 vrais avis (non masqués, avec texte) → schema.org Review (rich snippet).
        const { results } = await db.prepare(
          "SELECT prenom, rating, review_text, review_date FROM voyageur_feedback " +
          "WHERE bien_id=? AND hidden=0 AND review_text IS NOT NULL AND review_text!='' " +
          "ORDER BY rating DESC, review_date DESC LIMIT 3"
        ).bind(slug).all();
        reviewLd = (results || []).map(r => ({
          "@type": "Review",
          "author": { "@type": "Person", "name": r.prenom || "Voyageur" },
          "reviewRating": { "@type": "Rating", "ratingValue": String(r.rating || 5), "bestRating": "5" },
          "reviewBody": String(r.review_text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500),
          ...(r.review_date ? { "datePublished": r.review_date } : {}),
        }));
      }
    } catch { /* fallback valeurs codées */ }

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
        "ratingValue": ratingValue,
        "reviewCount": reviewCount,
        "bestRating": "5",
      },
      ...(reviewLd.length ? { "review": reviewLd } : {}),
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

  // Handle /guide-le-diamant
  if (slug === "guide-le-diamant") {
    const g = GUIDE_DIAMANT;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` },
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Handle /guide-sainte-anne
  if (slug === "guide-sainte-anne") {
    const g = GUIDE_SAINTE_ANNE;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` },
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Handle /villa-rental-martinique
  if (slug === "villa-rental-martinique") {
    const g = GUIDE_EN;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "inLanguage": "en",
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` },
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Handle /activites-sainte-luce
  if (slug === "activites-sainte-luce") {
    const g = GUIDE_ACTIVITES;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` },
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Handle /guide-proximite
  if (slug === "guide-proximite") {
    const g = GUIDE_PROXIMITE;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` },
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Handle /location-groupe-sainte-luce
  if (slug === "location-groupe-sainte-luce") {
    const g = GROUP_STAY;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "about": { "@type": "LodgingBusiness", "name": "Résidence Amaryllis", "url": BASE },
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Handle /location-appartement-vue-mer-schoelcher
  if (slug === "location-appartement-vue-mer-schoelcher") {
    const g = SCHOELCHER_APPART;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Apartment",
      "name": "Bellevue — appartement de standing à Schœlcher",
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "numberOfRooms": 1,
      "occupancy": { "@type": "QuantitativeValue", "maxValue": 2 },
      "address": { "@type": "PostalAddress", "addressLocality": "Schœlcher", "addressRegion": "Martinique", "addressCountry": "FR" },
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Handle /plus-belles-plages-sud-martinique
  if (slug === "plus-belles-plages-sud-martinique") {
    const g = {
      title: "Plus belles plages du Sud de la Martinique",
      desc: "Sable blanc, eau turquoise, tortues : découvrez les plus belles plages du Sud de la Martinique, toutes à moins de 40 min de Sainte-Luce.",
      image: `${BASE}/photos/amaryllis/05.webp`,
      url: `${BASE}/plus-belles-plages-sud-martinique`,
    };
    const ldJson = JSON.stringify({
      "@context": "https://schema.org", "@type": "Article",
      "headline": g.title, "description": g.desc, "url": g.url, "image": g.image,
      "author": { "@id": `${BASE}/#organization` }, "publisher": { "@id": `${BASE}/#organization` },
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Unknown slug — let Cloudflare handle (will redirect to / via _redirects)
  return context.next();
}
