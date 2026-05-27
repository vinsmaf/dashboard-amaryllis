/**
 * scripts/prerender.mjs
 * Génère un index.html par route dans dist/ avec les meta tags pré-injectés.
 *
 * Cloudflare Pages sert dist/{route}/index.html s'il existe,
 * sinon le catch-all "/* /index.html 200" prend le relais (SPA fallback).
 *
 * Usage : node scripts/prerender.mjs  (après vite build)
 */

import fs   from "node:fs";
import path from "node:path";

const BASE    = "https://villamaryllis.com";
const DIST    = path.resolve("dist");
const TMPL    = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

/* ── JSON-LD VacationRental par propriété ───────────────────────────── */
function buildVacationRentalLd({ id, nom, desc, prix, capacite, chambres, rating, reviews, coords, photos = [], isMartinique = true, bookable = true }) {
  const url = `${BASE}/${id}`;
  const locality = isMartinique ? "Sainte-Luce" : "Nogent-sur-Marne";
  const region   = isMartinique ? "Martinique" : "Île-de-France";
  const country  = isMartinique ? "MQ" : "FR";
  const postal   = isMartinique ? "97228" : "94130";

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VacationRental",
        "@id": url,
        "name": nom,
        "url": url,
        "description": desc.slice(0, 300),
        "image": photos.slice(0, 8).map(p => ({
          "@type": "ImageObject",
          "url": `${BASE}${p}`,
          "contentUrl": `${BASE}${p}`,
        })),
        "address": {
          "@type": "PostalAddress",
          "addressLocality": locality,
          "addressRegion": region,
          "addressCountry": country,
          "postalCode": postal,
        },
        ...(coords ? { "geo": { "@type": "GeoCoordinates", "latitude": coords.lat, "longitude": coords.lng } } : {}),
        ...(rating ? {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": String(rating).replace(",", "."),
            "reviewCount": reviews || 1,
            "bestRating": "5",
            "worstRating": "1",
          }
        } : {}),
        ...(chambres ? { "numberOfRooms": String(chambres) } : {}),
        ...(capacite ? { "occupancy": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": capacite } } : {}),
        ...(bookable && prix ? {
          "priceRange": `À partir de ${prix}€/nuit`,
          "offers": {
            "@type": "Offer",
            "price": prix,
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "url": url,
            "seller": { "@id": `${BASE}/#organization` },
          }
        } : {}),
        "tourBookingPage": bookable ? url : `${BASE}/#contact`,
        "provider": { "@id": `${BASE}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${BASE}/` },
          { "@type": "ListItem", "position": 2, "name": nom, "item": url },
        ]
      },
      {
        "@type": ["Organization", "LodgingBusiness"],
        "@id": `${BASE}/#organization`,
        "name": "Amaryllis Locations",
        "url": BASE,
        "telephone": "+33610880772",
        "email": "contact@villamaryllis.com",
      }
    ]
  };
  return JSON.stringify(ld, null, 2);
}

/* ── Métadonnées par route ──────────────────────────────────────────── */
const ROUTES = [

  /* ── Propriétés ── */
  {
    path: "/amaryllis",
    title: "Villa Amaryllis — Location villa Martinique piscine débordement vue mer | Amaryllis",
    desc:  "Réservez directement la Villa Amaryllis à Sainte-Luce, Martinique. Piscine à débordement eau salée 4×7 m, vue Caraïbes 180°, terrasse 100 m², 3 chambres, 8 personnes. À partir de 280€/nuit sans frais Airbnb.",
    image: `${BASE}/photos/amaryllis/01.webp`,
    lcpPreload: true,
    jsonld: buildVacationRentalLd({ id: "amaryllis", nom: "Villa Amaryllis", desc: "Villa Amaryllis à Sainte-Luce, Martinique. Piscine à débordement eau salée 4×7 m, vue Caraïbes 180° depuis les hauteurs. 3 chambres, 8 personnes.", prix: 280, capacite: 8, chambres: 3, rating: 4.94, reviews: 89, coords: { lat: 14.4728, lng: -60.9204 }, photos: ["/photos/amaryllis/01.webp","/photos/amaryllis/02.webp","/photos/amaryllis/03.webp","/photos/amaryllis/04.webp","/photos/amaryllis/05.webp","/photos/amaryllis/06.webp","/photos/amaryllis/07.webp","/photos/amaryllis/08.webp"] }),
  },
  {
    path: "/zandoli",
    title: "Zandoli — Location villa Martinique piscine cascade | Résidence Amaryllis",
    desc:  "Villa Zandoli à Sainte-Luce, Martinique. Piscine privative avec cascade, mezzanine, jardin tropical. 5 personnes. Réservation directe.",
    image: `${BASE}/photos/zandoli/01.webp`,
    jsonld: buildVacationRentalLd({ id: "zandoli", nom: "Zandoli", desc: "Villa Zandoli à Sainte-Luce, Martinique. Piscine privative avec cascade, mezzanine, jardin tropical. 5 personnes.", prix: 220, capacite: 5, chambres: 2, rating: 4.5, reviews: 34, coords: { lat: 14.4730, lng: -60.9196 }, photos: ["/photos/zandoli/01.webp","/photos/zandoli/02.webp","/photos/zandoli/03.webp","/photos/zandoli/04.webp"] }),
  },
  {
    path: "/iguana",
    title: "Villa Iguana — Location Martinique vue Rocher du Diamant | Résidence Amaryllis",
    desc:  "Villa Iguana à Sainte-Luce. Piscine eau salée, vue panoramique sur le Rocher du Diamant. 6 personnes. Réservation directe propriétaire.",
    image: `${BASE}/photos/iguana/01.webp`,
    jsonld: buildVacationRentalLd({ id: "iguana", nom: "Villa Iguana", desc: "Villa Iguana à Sainte-Luce, Martinique. Piscine eau salée (non chlorée, unique de la résidence), vue panoramique sur le Rocher du Diamant. 6 personnes. Location longue durée.", capacite: 6, chambres: 2, rating: 4.75, reviews: 42, coords: { lat: 14.4725, lng: -60.9192 }, photos: ["/photos/iguana/01.webp","/photos/iguana/02.webp","/photos/iguana/03.webp","/photos/iguana/04.webp"], bookable: false }),
  },
  {
    path: "/geko",
    title: "Géko — Location villa Martinique piscine cascade Sainte-Luce | Résidence Amaryllis",
    desc:  "Cocon Géko à Sainte-Luce, Martinique. Piscine privative avec cascade, jardin tropical. 4 personnes. À partir de 150€/nuit. Réservation directe.",
    image: `${BASE}/photos/geko/01.webp`,
    jsonld: buildVacationRentalLd({ id: "geko", nom: "Géko", desc: "Cocon Géko à Sainte-Luce, Martinique. Piscine privative avec cascade, jardin tropical, sur les hauteurs. 4 personnes.", prix: 150, capacite: 4, chambres: 1, rating: 4.83, reviews: 28, coords: { lat: 14.4732, lng: -60.9196 }, photos: ["/photos/geko/01.webp","/photos/geko/02.webp","/photos/geko/03.webp","/photos/geko/04.webp"] }),
  },
  {
    path: "/mabouya",
    title: "Studio Mabouya — Jacuzzi privatif & vue mer Martinique | Escapade romantique",
    desc:  "Le seul studio de la résidence avec jacuzzi privatif vue mer à Sainte-Luce, Martinique. Exclusivité totale pour 2 personnes. Jardin tropical, terrasse privée, plages à 5 min. Réservation directe dès 110€/nuit.",
    image: `${BASE}/photos/mabouya/01.webp`,
    jsonld: buildVacationRentalLd({ id: "mabouya", nom: "Studio Mabouya", desc: "Seul studio avec jacuzzi privatif vue mer de la résidence Amaryllis à Sainte-Luce, Martinique. Terrasse privée, jardin tropical fleuri. Idéal couple, escapade romantique.", prix: 110, capacite: 2, chambres: 1, rating: 4.55, reviews: 31, coords: { lat: 14.4732, lng: -60.9196 }, photos: ["/photos/mabouya/01.webp","/photos/mabouya/02.webp","/photos/mabouya/03.webp","/photos/mabouya/04.webp"] }),
  },
  {
    path: "/schoelcher",
    title: "Bellevue — Location appartement Schœlcher Martinique vue Fort-de-France",
    desc:  "Appartement Bellevue à Schœlcher, Martinique. Vue sur la baie de Fort-de-France, 4 personnes. À 10 min du centre-ville. Réservation directe.",
    image: `${BASE}/photos/schoelcher/01.webp`,
    jsonld: buildVacationRentalLd({ id: "schoelcher", nom: "Bellevue Schoelcher", desc: "Appartement Bellevue à Schœlcher, Martinique. Vue sur la baie de Fort-de-France et Trois-Îlets depuis les hauteurs. 2 personnes.", prix: 100, capacite: 2, chambres: 1, rating: 4.8, reviews: 18, coords: { lat: 14.6167, lng: -61.1333 }, photos: ["/photos/schoelcher/01.webp","/photos/schoelcher/02.webp","/photos/schoelcher/03.webp","/photos/schoelcher/04.webp"], isMartinique: true }),
  },
  {
    path: "/nogent",
    title: "Appartement Nogent-sur-Marne — Bord de Marne, Paris 20 min | 85€/nuit | Amaryllis",
    desc:  "Appartement de standing à Nogent-sur-Marne — 85 €/nuit. Jardin privatif, home cinéma, bord de Marne. RER A : Paris en 20 min. Réservation directe sans commission Airbnb.",
    image: `${BASE}/photos/nogent/01.webp`,
    jsonld: buildVacationRentalLd({ id: "nogent", nom: "Appartement Nogent-sur-Marne", desc: "Appartement de standing à Nogent-sur-Marne. Jardin privatif, home cinéma, bord de Marne. RER A : Paris en 20 min.", prix: 85, capacite: 2, chambres: 1, rating: 4.8, reviews: 18, coords: { lat: 48.8374, lng: 2.4836 }, photos: ["/photos/nogent/01.webp","/photos/nogent/02.webp","/photos/nogent/03.webp","/photos/nogent/04.webp","/photos/nogent/05.webp","/photos/nogent/06.webp"], isMartinique: false }),
  },

  /* ── Pages thématiques ── */
  {
    path: "/avis",
    title: "Avis voyageurs — 4,79★ · 97 avis vérifiés | Amaryllis Locations",
    desc:  "97 avis authentiques sur nos 7 villas et appartements en Martinique et Île-de-France. Note moyenne 4,79/5. Réservation directe propriétaire.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/faq",
    title: "FAQ — Réservation villas Martinique | Amaryllis",
    desc:  "Toutes les réponses sur la réservation directe, les piscines privées, les annulations, la caution et les services de nos villas en Martinique.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },

  /* ── Guides Martinique ── */
  {
    path: "/guide",
    title: "Guide Martinique — Les meilleures destinations du Sud | Amaryllis",
    desc:  "Guide de voyage Martinique par vos hôtes : Les Salines, Arlet, Le Diamant, Trois-Îlets, Sainte-Luce. Conseils d'initiés pour explorer le Sud Martinique.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-le-diamant",
    title: "Guide Le Diamant Martinique — Rocher, plongée & plages | Amaryllis",
    desc:  "Guide complet du Diamant depuis Sainte-Luce (15 min). Plonger autour du Rocher historique, HMS Diamond Rock, plages sauvages — le must absolu du Sud Martinique.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Diamond_Rock.jpg/960px-Diamond_Rock.jpg",
  },
  {
    path: "/guide-sainte-anne",
    title: "Guide Sainte-Anne Martinique — Les Salines, la plus belle plage des Caraïbes | Amaryllis",
    desc:  "Guide Sainte-Anne depuis Sainte-Luce (20 min) : Les Salines avant 9h, kitesurf, catamaran, restaurants créoles. La plage incontournable du Sud Martinique.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg",
  },
  {
    path: "/guide-arlet",
    title: "Guide Anses d'Arlet Martinique — Nager avec les tortues marines | Amaryllis",
    desc:  "Les Anses d'Arlet (25 min de Sainte-Luce) : nager avec des tortues marines garanties tôt le matin. Village de pêcheurs, snorkeling, restaurants.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Grande_Anse_d%27_Arlet_%2847001622912%29.jpg/960px-Grande_Anse_d%27_Arlet_%2847001622912%29.jpg",
  },
  {
    path: "/guide-trois-ilets",
    title: "Guide Les Trois-Îlets Martinique — Musée Pagerie & marina | Amaryllis",
    desc:  "Guide Trois-Îlets depuis Sainte-Luce (35 min) : Musée de la Pagerie (naissance de Joséphine), village créole, marina face à Fort-de-France.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-proximite",
    title: "Activités à 15 min de Sainte-Luce Martinique — Guide de proximité | Amaryllis",
    desc:  "Les meilleures adresses à moins de 15 minutes : Anse Corps de Garde, Forêt de Montravail, Distillerie Trois-Rivières, snorkeling avec les tortues.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/activites-sainte-luce",
    title: "10 activités incontournables à Sainte-Luce Martinique | Amaryllis",
    desc:  "Les 10 meilleures activités depuis nos villas : snorkeling avec les tortues, randonnée Montravail, rhum Trois-Rivières, catamaran, cuisine créole.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/explorer",
    title: "Carte interactive du Sud Martinique — Explorer depuis Sainte-Luce | Amaryllis",
    desc:  "Carte interactive des destinations du Sud Martinique. Filtrez par activité : plages, snorkeling, famille, culture. Tortues d'Arlet, Les Salines, Rocher du Diamant.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg",
  },

  /* ── Sainte-Luce + Réservation directe ── */
  {
    path: "/sainte-luce-martinique",
    title: "Sainte-Luce Martinique — Villas & Activités | Amaryllis",
    desc:  "Tout sur Sainte-Luce, Martinique : plages, restaurants, activités, transports. Louez une villa avec piscine vue mer à Sainte-Luce dès 120€/nuit.",
    image: `${BASE}/photos/iguana/01.webp`,
  },
  {
    path: "/reservation-directe-martinique",
    title: "Réservation directe Martinique — Sans frais Airbnb | Amaryllis",
    desc:  "Réservez directement vos villas en Martinique sans frais Airbnb ni Booking. Économisez 12–18%, flexibilité maximale, paiement sécurisé Stripe.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/meilleure-saison-martinique",
    title: "Meilleure saison Martinique — Quand partir ? | Amaryllis",
    desc:  "Quand partir en Martinique ? Mois par mois : météo, température mer, pluies, activités. Avis d'un hôte local de Sainte-Luce. Saison sèche déc–avr vs hivernage juin–oct.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/seminaires",
    title: "Séminaires Martinique — Villa vue mer | Amaryllis",
    desc:  "Louez la Villa Amaryllis pour votre séminaire en Martinique. Exclusivité totale, piscine débordement, terrasse 100m² vue mer, Wifi Starlink. Dès 1 960€ HT / 2 nuits.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/location-villa-martinique-piscine",
    title: "Location Villa Martinique avec Piscine — Réservation directe | Amaryllis",
    desc:  "Louez une villa Martinique avec piscine privative à Sainte-Luce. Amaryllis (débordement eau salée 4×7m, 8 pers.), Zandoli & Géko (cascade), Iguana (eau salée), Mabouya (jacuzzi). Dès 110€/nuit — sans frais Airbnb.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },

  /* ── Nouveaux guides destinations ── */
  {
    path: "/guide-distilleries-martinique",
    title: "Distilleries de Rhum Martinique — Rhum Agricole AOC | Amaryllis",
    desc:  "Visitez les meilleures distilleries de rhum agricole en Martinique : JM, Clément, Saint-James, Depaz, Trois-Rivières. Guide complet depuis Sainte-Luce.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-francois-martinique",
    title: "Le François Martinique — Fonds Blancs & Piscines Naturelles | Amaryllis",
    desc:  "Découvrez les Fonds Blancs du François : piscines naturelles, sable blanc immergé, ti-punch en mer. Guide complet depuis Sainte-Luce (35 min).",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-saint-pierre-martinique",
    title: "Saint-Pierre Martinique — Pompéi des Caraïbes, Plongée & Histoire | Amaryllis",
    desc:  "Visitez Saint-Pierre, la ville fantôme de Martinique : ruines de 1902, épaves de plongée uniques, musée Perret. Guide complet depuis Sainte-Luce (1h).",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-randonnees-martinique",
    title: "Randonnées Martinique — Montagne Pelée, Caravelle, Sentiers | Amaryllis",
    desc:  "Meilleures randonnées en Martinique : Montagne Pelée (1397m), Presqu'île de la Caravelle, forêt tropicale. Niveaux débutant à expert. Depuis Sainte-Luce.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-gastronomie-martinique",
    title: "Gastronomie Martinique — Cuisine Créole, Restaurants & Marchés | Amaryllis",
    desc:  "Saveurs créoles martiniquaises : langouste, blaff, ti-punch, accras. Marchés locaux, restaurants à Sainte-Luce. Guide gastronomique complet.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-plongee-martinique",
    title: "Plongée Martinique — Épaves, Snorkeling, Tortues | Amaryllis Sainte-Luce",
    desc:  "Meilleurs spots de plongée et snorkeling en Martinique : épaves de Saint-Pierre, tortues d'Arlet, Rocher du Diamant. Guide complet depuis Sainte-Luce.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },

  /* ── Page EN ── */
  {
    path: "/villa-rental-martinique",
    title: "Villa Rental Martinique — Direct booking | Amaryllis",
    desc:  "Book our Martinique villas directly in Sainte-Luce. Infinity pool, sea view, private jacuzzi. From €110/night. No Airbnb fees. 15 min from Les Salines beach.",
    image: `${BASE}/photos/amaryllis/01.webp`,
    lang:  "en",
  },

  /* ── Légal ── */
  {
    path: "/mentions-legales",
    title: "Mentions légales — Amaryllis Locations",
    desc:  "Mentions légales de villamaryllis.com : éditeur, hébergement, propriété intellectuelle et données personnelles.",
    image: `${BASE}/photos/amaryllis/01.webp`,
    noindex: true,
  },
  {
    path: "/politique-confidentialite",
    title: "Politique de confidentialité & cookies — Amaryllis Locations",
    desc:  "Politique de confidentialité de villamaryllis.com : données collectées, cookies, droits RGPD.",
    image: `${BASE}/photos/amaryllis/01.webp`,
    noindex: true,
  },
  {
    path: "/conditions-generales",
    title: "Conditions Générales de Vente (CGV) — Amaryllis Locations",
    desc:  "CGV de villamaryllis.com : réservation directe, annulation, caution, responsabilités. Applicable à toutes les locations Amaryllis en Martinique et Île-de-France.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
];

/* ── Fonctions de remplacement ───────────────────────────────────────── */

function escapeRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Remplace la valeur d'un attribut sur l'élément portant l'id donné. */
function replaceById(html, id, attr, newVal) {
  // Cible : id="ID" ... attr="..."  (l'ordre des attributs peut varier)
  const re = new RegExp(
    `(id="${escapeRe(id)}"[^>]*?${escapeRe(attr)}=")[^"]*(")`
    + `|`
    + `(${escapeRe(attr)}="[^"]*"([^>]*?)id="${escapeRe(id)}")`,
    "s"
  );
  if (re.test(html)) {
    return html.replace(re, (m, p1, p2, p3, p4) => {
      if (p1 !== undefined) return `${p1}${newVal}${p2}`;
      // attr comes before id
      return `${attr}="${newVal}"${p4}id="${id}"`;
    });
  }
  return html;
}

/** Remplace la valeur d'un attribut sur le premier élément matchant le sélecteur simple. */
function replaceByAttr(html, matchAttr, matchVal, targetAttr, newVal) {
  const re = new RegExp(
    `(${escapeRe(matchAttr)}="${escapeRe(matchVal)}"[^>]*?${escapeRe(targetAttr)}=")[^"]*(")`
    + `|`
    + `(${escapeRe(targetAttr)}="[^"]*"[^>]*?${escapeRe(matchAttr)}="${escapeRe(matchVal)}")`,
    "s"
  );
  return html.replace(re, (m, p1, p2, p3) => {
    if (p1 !== undefined) return `${p1}${newVal}${p2}`;
    return `${targetAttr}="${newVal}"`;
  });
}

function patchHtml(tmpl, { path: routePath, title, desc, image, noindex = false, jsonld = null, lang = "fr", lcpPreload = false }) {
  const url = `${BASE}${routePath}`;
  let html = tmpl;

  /* LCP preload — injecté uniquement sur les pages avec image hero critique */
  if (lcpPreload && image && image.startsWith(BASE + "/photos/")) {
    const localSrc = image.replace(BASE, "");
    // imagesrcset miroir exact du srcset généré par RImg (cfImg widths : 480, 800, 1200, 1600)
    const qualityMap = { 480: 75, 800: 85, 1200: 85, 1600: 90 };
    const srcset = [480, 800, 1200, 1600]
      .map(w => `/cdn-cgi/image/width=${w},format=auto,quality=${qualityMap[w]}${localSrc} ${w}w`)
      .join(", ");
    const preloadTag = `<link rel="preload" as="image" href="/cdn-cgi/image/width=1200,format=auto,quality=85${localSrc}" imagesrcset="${srcset}" imagesizes="(max-width: 1200px) 72vw, 900px" fetchpriority="high" />`;
    html = html.replace("</head>", `  ${preloadTag}\n  </head>`);
  }

  /* hreflang — remplace les 3 balises génériques de index.html par des URLs spécifiques */
  const frUrl   = lang === "en" ? `${BASE}/` : url;
  const enUrl   = lang === "en" ? url : `${BASE}/villa-rental-martinique`;
  html = html.replace(
    /(<link rel="alternate" hreflang="fr" href=")[^"]*/,
    `$1${frUrl}`
  );
  html = html.replace(
    /(<link rel="alternate" hreflang="en" href=")[^"]*/,
    `$1${enUrl}`
  );
  html = html.replace(
    /(<link rel="alternate" hreflang="x-default" href=")[^"]*/,
    `$1${frUrl}`
  );

  /* title */
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  /* meta description */
  html = html.replace(
    /(<meta name="description" content=")[^"]*/,
    `$1${desc}`
  );

  /* canonical */
  html = html.replace(
    /(id="canonical" rel="canonical" href=")[^"]*/,
    `$1${url}`
  );

  /* og:title */
  html = html.replace(
    /(id="og-title" property="og:title" content=")[^"]*/,
    `$1${title}`
  );

  /* og:description */
  html = html.replace(
    /(id="og-description" property="og:description" content=")[^"]*/,
    `$1${desc}`
  );

  /* og:url */
  html = html.replace(
    /(id="og-url" property="og:url" content=")[^"]*/,
    `$1${url}`
  );

  /* og:image */
  html = html.replace(
    /(id="og-image" property="og:image" content=")[^"]*/,
    `$1${image}`
  );

  /* twitter:title */
  html = html.replace(
    /(id="tw-title" name="twitter:title" content=")[^"]*/,
    `$1${title}`
  );

  /* twitter:description */
  html = html.replace(
    /(id="tw-description" name="twitter:description" content=")[^"]*/,
    `$1${desc}`
  );

  /* twitter:image */
  html = html.replace(
    /(id="tw-image" name="twitter:image" content=")[^"]*/,
    `$1${image}`
  );

  /* noindex pour pages légales */
  if (noindex) {
    html = html.replace(
      /<meta name="robots" content="index, follow"[^>]*>/,
      `<meta name="robots" content="noindex, nofollow" />`
    );
  }

  /* JSON-LD VacationRental spécifique à la propriété */
  if (jsonld) {
    html = html.replace(
      /(<script type="application\/ld\+json" id="ld-main">)[\s\S]*?(<\/script>)/,
      `$1\n${jsonld}\n$2`
    );
  }

  return html;
}

/* ── Génération ─────────────────────────────────────────────────────── */

let count = 0;

for (const route of ROUTES) {
  const html = patchHtml(TMPL, route);

  // Stratégie : dist/{route}.html (Cloudflare le sert à /{route} sans extension)
  // + dist/{route}/index.html (fallback avec trailing slash — ex. /amaryllis/)
  const slug = route.path.replace(/^\//, "");

  // Fichier à la racine : /amaryllis.html → servi à /amaryllis
  fs.writeFileSync(path.join(DIST, `${slug}.html`), html, "utf8");

  // Répertoire : /amaryllis/index.html → servi à /amaryllis/
  const dir = path.join(DIST, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  count++;
  console.log(`  ✓ ${route.path}`);
}

console.log(`\n✨ Prérendu terminé — ${count} routes générées`);

/* ── Génération automatique du sitemap.xml ──────────────────────────── */

// Priorité et fréquence par chemin (fallback : 0.7 / monthly)
const SITEMAP_META = {
  "/":                               { priority: "1.0",  changefreq: "weekly"  },
  "/amaryllis":                      { priority: "0.9",  changefreq: "monthly" },
  "/zandoli":                        { priority: "0.9",  changefreq: "monthly" },
  "/iguana":                         { priority: "0.8",  changefreq: "monthly" },
  "/geko":                           { priority: "0.8",  changefreq: "monthly" },
  "/mabouya":                        { priority: "0.8",  changefreq: "monthly" },
  "/schoelcher":                     { priority: "0.7",  changefreq: "monthly" },
  "/nogent":                         { priority: "0.7",  changefreq: "monthly" },
  "/avis":                           { priority: "0.85", changefreq: "weekly"  },
  "/faq":                            { priority: "0.8",  changefreq: "monthly" },
  "/mentions-legales":               { priority: "0.3",  changefreq: "yearly"  },
  "/politique-confidentialite":      { priority: "0.3",  changefreq: "yearly"  },
  "/conditions-generales":           { priority: "0.3",  changefreq: "yearly"  },
  "/villa-rental-martinique":        { priority: "0.9",  changefreq: "monthly" },
  "/guide":                          { priority: "0.85", changefreq: "monthly" },
  "/explorer":                       { priority: "0.8",  changefreq: "monthly" },
  "/guide-arlet":                    { priority: "0.85", changefreq: "monthly" },
  "/guide-sainte-anne":              { priority: "0.85", changefreq: "monthly" },
  "/guide-le-diamant":               { priority: "0.85", changefreq: "monthly" },
  "/guide-trois-ilets":              { priority: "0.8",  changefreq: "monthly" },
  "/activites-sainte-luce":          { priority: "0.8",  changefreq: "monthly" },
  "/guide-proximite":                { priority: "0.75", changefreq: "monthly" },
  "/guide-distilleries-martinique":  { priority: "0.80", changefreq: "monthly" },
  "/guide-francois-martinique":      { priority: "0.80", changefreq: "monthly" },
  "/guide-saint-pierre-martinique":  { priority: "0.80", changefreq: "monthly" },
  "/guide-randonnees-martinique":    { priority: "0.80", changefreq: "monthly" },
  "/guide-gastronomie-martinique":   { priority: "0.80", changefreq: "monthly" },
  "/guide-plongee-martinique":       { priority: "0.80", changefreq: "monthly" },
  "/sainte-luce-martinique":         { priority: "0.9",  changefreq: "monthly" },
  "/meilleure-saison-martinique":    { priority: "0.85", changefreq: "monthly" },
  "/reservation-directe-martinique": { priority: "0.8",  changefreq: "monthly" },
  "/seminaires":                     { priority: "0.75", changefreq: "monthly" },
  "/location-villa-martinique-piscine": { priority: "0.95", changefreq: "monthly" },
};

const today = new Date().toISOString().slice(0, 10);

// Page d'accueil + toutes les routes prérendues
const sitemapEntries = [
  { path: "/", ...SITEMAP_META["/"] },
  ...ROUTES.map(r => ({
    path: r.path,
    ...(SITEMAP_META[r.path] ?? { priority: "0.7", changefreq: "monthly" }),
  })),
];

const xmlLines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
];

for (const { path: p, priority, changefreq } of sitemapEntries) {
  const loc = p === "/" ? `${BASE}/` : `${BASE}${p}`;
  xmlLines.push(
    `\n  <url>`,
    `    <loc>${loc}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    `  </url>`,
  );
}

xmlLines.push("\n</urlset>\n");

const sitemapDest = path.join(DIST, "sitemap.xml");
fs.writeFileSync(sitemapDest, xmlLines.join("\n"), "utf8");
console.log(`🗺  Sitemap généré — ${sitemapEntries.length} URLs → dist/sitemap.xml (lastmod: ${today})`);
