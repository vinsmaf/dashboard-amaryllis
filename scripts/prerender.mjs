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
import { GUIDES_POI } from "../src/data/guidesPoi.js";

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

/* ── JSON-LD FAQPage par bien (rich snippet "People also ask" Google) ─ */
function buildFAQLd(faqs) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a },
    })),
  }, null, 2);
}

// FAQ par bien — 5 questions stratégiques par propriété pour décrocher
// les rich snippets "People also ask" dans Google FR.
const FAQS_PAR_BIEN = {
  amaryllis: [
    { q: "Quel est le prix de la Villa Amaryllis en Martinique ?", a: "La Villa Amaryllis se loue à partir de 280€/nuit en réservation directe — sans frais Airbnb (jusqu'à 14% d'économie). Le prix varie selon la saison : haute saison décembre-avril, basse saison juillet-octobre." },
    { q: "La Villa Amaryllis a-t-elle une piscine ?", a: "Oui — la Villa Amaryllis dispose d'une piscine à débordement eau salée de 4×7 mètres avec vue mer 180° sur la baie de Sainte-Luce. C'est la seule propriété à débordement du portfolio." },
    { q: "Combien de personnes peut accueillir la Villa Amaryllis ?", a: "La Villa Amaryllis accueille jusqu'à 8 personnes dans 3 chambres climatisées, avec 3,5 salles de bain et une terrasse de 100 m² face à la mer." },
    { q: "Comment réserver la Villa Amaryllis sans passer par Airbnb ?", a: "Directement sur villamaryllis.com/amaryllis — paiement sécurisé Stripe, contact WhatsApp direct avec l'hôte, économies jusqu'à 14% vs Airbnb." },
    { q: "Où se trouve la Villa Amaryllis ?", a: "Sur les hauteurs de Sainte-Luce, sud de la Martinique. À 20 minutes des plages des Salines et de Sainte-Anne, à 35 minutes de l'aéroport, dans la résidence Amaryllis avec vue Caraïbes 180°." },
  ],
  zandoli: [
    { q: "Quel est le prix de Zandoli en Martinique ?", a: "Zandoli se loue à partir de 220€/nuit en direct sur villamaryllis.com — sans frais Airbnb." },
    { q: "Zandoli a-t-elle une piscine privée ?", a: "Oui — Zandoli dispose de sa propre piscine privative avec cascade, située dans la résidence Amaryllis à Sainte-Luce." },
    { q: "Combien de personnes peut accueillir Zandoli ?", a: "Zandoli accueille jusqu'à 5 personnes dans 2 chambres + mezzanine, avec jardin tropical et vue mer." },
    { q: "Où se trouve Zandoli ?", a: "Sur les hauteurs de Sainte-Luce, dans la résidence Amaryllis, à 5-7 minutes des plages du sud Martinique." },
    { q: "Zandoli accepte-t-elle les animaux ?", a: "Oui, Zandoli accepte les animaux (supplément 40€/séjour, 2 maximum). Mentionnez-le à la réservation." },
  ],
  iguana: [
    { q: "Villa Iguana a-t-elle une piscine en eau salée ?", a: "Oui — Villa Iguana dispose de l'unique piscine eau salée non chlorée de la résidence Amaryllis. Nager dedans, c'est nager comme dans la mer : pas de chlore, eau douce et vivante." },
    { q: "Combien de personnes peut accueillir Villa Iguana ?", a: "Villa Iguana accueille jusqu'à 6 personnes dans 2 chambres climatisées. Idéale pour les longs séjours et les familles." },
    { q: "Quelle est la vue depuis Villa Iguana ?", a: "Depuis la terrasse de Villa Iguana, la vue embrasse le Rocher du Diamant et la mer des Caraïbes. Un cadre rare, sur les hauteurs de Sainte-Luce." },
    { q: "Villa Iguana est-elle disponible en courte durée ?", a: "Villa Iguana est principalement orientée location longue durée. Pour une réservation, contactez-nous directement via villamaryllis.com pour étudier les dates." },
    { q: "Où se trouve Villa Iguana ?", a: "Dans la résidence Amaryllis à Sainte-Luce, sud Martinique. Vue panoramique sur le Rocher du Diamant et la mer Caraïbes." },
  ],
  geko: [
    { q: "Quel est le prix de Géko en Martinique ?", a: "Géko se loue à partir de 150€/nuit en réservation directe sur villamaryllis.com — sans frais Airbnb." },
    { q: "Géko a-t-elle une piscine ?", a: "Oui — Géko dispose de sa propre piscine privative avec cascade, dans la résidence Amaryllis à Sainte-Luce sur les hauteurs." },
    { q: "Combien de personnes peut accueillir Géko ?", a: "Géko accueille jusqu'à 4 personnes — idéal pour les couples ou petites familles. Climatisation, cuisine extérieure, barbecue." },
    { q: "Où se trouve Géko ?", a: "Sur les hauteurs de Sainte-Luce, dans la résidence Amaryllis, à 7 minutes des plages du sud." },
    { q: "Quelle est la différence entre Géko et Zandoli ?", a: "Zandoli a 2 chambres + mezzanine pour 5 personnes (220€/nuit). Géko est un cocon 4 personnes (150€/nuit). Les deux ont leur propre piscine privative avec cascade." },
  ],
  mabouya: [
    { q: "Quel est le prix du studio Mabouya en Martinique ?", a: "Studio Mabouya se loue à partir de 110€/nuit en réservation directe sur villamaryllis.com — l'option la plus accessible du portfolio." },
    { q: "Mabouya a-t-il un jacuzzi privatif ?", a: "Oui — Studio Mabouya dispose d'un jacuzzi privatif en terrasse avec vue mer. C'est le seul logement de la résidence Amaryllis à proposer un jacuzzi privé." },
    { q: "Mabouya est-il adapté pour un couple ?", a: "Absolument — Studio Mabouya est notre studio romantique par excellence : lit queen-size 160×200, jacuzzi privé, terrasse vue mer, intimité totale à flanc de colline." },
    { q: "Combien de personnes peut accueillir Mabouya ?", a: "Studio Mabouya accueille 2 personnes maximum. Pensé pour les couples en escapade romantique." },
    { q: "Où se trouve le studio Mabouya ?", a: "Dans la résidence Amaryllis à Sainte-Luce, Martinique. Sur les hauteurs avec vue mer panoramique." },
  ],
  schoelcher: [
    { q: "Quel est le prix de l'appartement Bellevue à Schœlcher ?", a: "Bellevue se loue à partir de 100€/nuit en réservation directe — option idéale pour un séjour économique en Martinique." },
    { q: "Quelle est la vue depuis Bellevue ?", a: "Vue panoramique sur la baie de Fort-de-France et les Trois-Îlets depuis les hauteurs de Schœlcher. Une des vues les plus dégagées du portfolio." },
    { q: "Combien de personnes peut accueillir Bellevue ?", a: "Bellevue accueille jusqu'à 2 personnes — idéal pour un séjour calme et économique en couple." },
    { q: "Où se trouve l'appartement Bellevue ?", a: "À Schœlcher, sur les hauteurs avec vue baie de Fort-de-France. À 5 minutes des plages." },
    { q: "Bellevue a-t-il une piscine ?", a: "Non, Bellevue n'a pas de piscine. C'est un appartement vue baie idéal pour les voyageurs cherchant un séjour calme et économique. Les plages de Schœlcher sont à 5 minutes." },
  ],
  nogent: [
    { q: "Quel est le prix de l'appartement Nogent-sur-Marne ?", a: "L'appartement de Nogent-sur-Marne se loue à partir de 85€/nuit — sans commission Airbnb." },
    { q: "Combien de temps pour aller à Paris depuis Nogent ?", a: "20 minutes en RER A jusqu'à Châtelet-Les Halles. Idéal pour séjour business ou touristique à Paris sans payer les tarifs parisiens." },
    { q: "L'appartement Nogent a-t-il un jardin ?", a: "Oui — l'appartement dispose d'un jardin et d'une terrasse privatifs, en bord de Marne. Calme et nature à 20 min de Paris." },
    { q: "Combien de personnes peut accueillir Nogent ?", a: "L'appartement Nogent accueille 2 personnes — idéal pour un séjour business ou un couple visitant Paris." },
    { q: "Où se trouve l'appartement Nogent ?", a: "À Nogent-sur-Marne (Val-de-Marne), bord de Marne, à 20 minutes du centre de Paris en RER A." },
  ],
};

/* ── Métadonnées par route ──────────────────────────────────────────── */
const ROUTES = [

  /* ── Accueil ── */
  {
    path: "/",
    title: "Amaryllis — Location villa Martinique avec piscine | Réservation directe",
    desc:  "Louez directement nos villas et appartements en Martinique (Sainte-Luce, Schœlcher) et à Nogent-sur-Marne. Piscine, vue mer, sans frais Airbnb. Dès 85€/nuit.",
    image: `${BASE}/photos/amaryllis/01.webp`,
    h1:    "Locations de vacances en Martinique & à Nogent — réservation directe",
    lcpPreload: true,
  },

  /* ── Propriétés ── */
  {
    path: "/amaryllis",
    title: "Villa Amaryllis Sainte-Luce — piscine vue mer Martinique",
    desc:  "Villa Amaryllis à Sainte-Luce : piscine à débordement, vue Caraïbes 180°, 3 chambres, 8 personnes. Dès 280€/nuit en direct, sans frais Airbnb.",
    image: `${BASE}/photos/amaryllis/01.webp`,
    lcpPreload: true,
    jsonld: buildVacationRentalLd({ id: "amaryllis", nom: "Villa Amaryllis", desc: "Villa Amaryllis à Sainte-Luce, Martinique. Piscine à débordement eau salée 4×7 m, vue Caraïbes 180° depuis les hauteurs. 3 chambres, 8 personnes.", prix: 280, capacite: 8, chambres: 3, rating: 4.94, reviews: 89, coords: { lat: 14.4728, lng: -60.9204 }, photos: ["/photos/amaryllis/01.webp","/photos/amaryllis/02.webp","/photos/amaryllis/03.webp","/photos/amaryllis/04.webp","/photos/amaryllis/05.webp","/photos/amaryllis/06.webp","/photos/amaryllis/07.webp","/photos/amaryllis/08.webp"] }),
    faqld: buildFAQLd(FAQS_PAR_BIEN.amaryllis),
  },
  {
    path: "/zandoli",
    title: "Zandoli Sainte-Luce — logement piscine cascade Martinique",
    desc:  "Zandoli à Sainte-Luce : piscine privative à cascade, mezzanine, jardin tropical. 5 personnes. Dès 220€/nuit en réservation directe.",
    image: `${BASE}/photos/zandoli/01.webp`,
    jsonld: buildVacationRentalLd({ id: "zandoli", nom: "Zandoli", desc: "Zandoli à Sainte-Luce, Martinique. Piscine privative avec cascade, mezzanine, jardin tropical. 5 personnes.", prix: 220, capacite: 5, chambres: 2, rating: 4.5, reviews: 34, coords: { lat: 14.4730, lng: -60.9196 }, photos: ["/photos/zandoli/01.webp","/photos/zandoli/02.webp","/photos/zandoli/03.webp","/photos/zandoli/04.webp"] }),
    faqld: buildFAQLd(FAQS_PAR_BIEN.zandoli),
  },
  {
    path: "/iguana",
    title: "Villa Iguana Martinique — vue Rocher du Diamant",
    desc:  "Villa Iguana à Sainte-Luce : piscine eau salée, vue panoramique sur le Rocher du Diamant. 6 personnes. Réservation directe propriétaire.",
    image: `${BASE}/photos/iguana/01.webp`,
    jsonld: buildVacationRentalLd({ id: "iguana", nom: "Villa Iguana", desc: "Villa Iguana à Sainte-Luce, Martinique. Piscine eau salée (non chlorée, unique de la résidence), vue panoramique sur le Rocher du Diamant. 6 personnes. Location longue durée.", capacite: 6, chambres: 2, rating: 4.75, reviews: 42, coords: { lat: 14.4725, lng: -60.9192 }, photos: ["/photos/iguana/01.webp","/photos/iguana/02.webp","/photos/iguana/03.webp","/photos/iguana/04.webp"], bookable: false }),
    faqld: buildFAQLd(FAQS_PAR_BIEN.iguana),
  },
  {
    path: "/geko",
    title: "Géko Sainte-Luce — cocon piscine cascade Martinique",
    desc:  "Cocon Géko à Sainte-Luce : piscine privative à cascade, jardin tropical, sur les hauteurs. 4 personnes. Dès 150€/nuit en réservation directe.",
    image: `${BASE}/photos/geko/01.webp`,
    jsonld: buildVacationRentalLd({ id: "geko", nom: "Géko", desc: "Cocon Géko à Sainte-Luce, Martinique. Piscine privative avec cascade, jardin tropical, sur les hauteurs. 4 personnes.", prix: 150, capacite: 4, chambres: 1, rating: 4.83, reviews: 28, coords: { lat: 14.4732, lng: -60.9196 }, photos: ["/photos/geko/01.webp","/photos/geko/02.webp","/photos/geko/03.webp","/photos/geko/04.webp"] }),
    faqld: buildFAQLd(FAQS_PAR_BIEN.geko),
  },
  {
    path: "/mabouya",
    title: "Studio Mabouya Martinique — jacuzzi privatif vue mer",
    desc:  "Studio Mabouya à Sainte-Luce : seul jacuzzi privatif vue mer de la résidence. Idéal couple, terrasse privée, plages à 5 min. Dès 110€/nuit.",
    image: `${BASE}/photos/mabouya/01.webp`,
    jsonld: buildVacationRentalLd({ id: "mabouya", nom: "Studio Mabouya", desc: "Seul studio avec jacuzzi privatif vue mer de la résidence Amaryllis à Sainte-Luce, Martinique. Terrasse privée, jardin tropical fleuri. Idéal couple, escapade romantique.", prix: 110, capacite: 2, chambres: 1, rating: 4.55, reviews: 31, coords: { lat: 14.4732, lng: -60.9196 }, photos: ["/photos/mabouya/01.webp","/photos/mabouya/02.webp","/photos/mabouya/03.webp","/photos/mabouya/04.webp"] }),
    faqld: buildFAQLd(FAQS_PAR_BIEN.mabouya),
  },
  {
    path: "/schoelcher",
    title: "Bellevue Schœlcher — appart vue baie Fort-de-France",
    desc:  "Appartement Bellevue à Schœlcher : vue sur la baie de Fort-de-France, 2 personnes, à 10 min du centre. Réservation directe dès 100€/nuit.",
    image: `${BASE}/photos/schoelcher/01.webp`,
    jsonld: buildVacationRentalLd({ id: "schoelcher", nom: "Bellevue Schœlcher", desc: "Appartement Bellevue à Schœlcher, Martinique. Vue sur la baie de Fort-de-France et Trois-Îlets depuis les hauteurs. 2 personnes.", prix: 100, capacite: 2, chambres: 1, rating: 4.8, reviews: 18, coords: { lat: 14.6167, lng: -61.1333 }, photos: ["/photos/schoelcher/01.webp","/photos/schoelcher/02.webp","/photos/schoelcher/03.webp","/photos/schoelcher/04.webp"], isMartinique: true }),
    faqld: buildFAQLd(FAQS_PAR_BIEN.schoelcher),
  },
  {
    path: "/nogent",
    title: "Appart Nogent-sur-Marne — bord de Marne, Paris 20 min",
    desc:  "Appartement de standing à Nogent-sur-Marne : jardin privatif, home cinéma, bord de Marne. RER A, Paris en 20 min. Dès 85€/nuit en direct.",
    image: `${BASE}/photos/nogent/01.webp`,
    jsonld: buildVacationRentalLd({ id: "nogent", nom: "Appartement Nogent-sur-Marne", desc: "Appartement de standing à Nogent-sur-Marne. Jardin privatif, home cinéma, bord de Marne. RER A : Paris en 20 min.", prix: 85, capacite: 2, chambres: 1, rating: 4.8, reviews: 18, coords: { lat: 48.8374, lng: 2.4836 }, photos: ["/photos/nogent/01.webp","/photos/nogent/02.webp","/photos/nogent/03.webp","/photos/nogent/04.webp","/photos/nogent/05.webp","/photos/nogent/06.webp"], isMartinique: false }),
    faqld: buildFAQLd(FAQS_PAR_BIEN.nogent),
  },

  /* ── Pages thématiques ── */
  {
    path: "/avis",
    title: "Avis voyageurs — 4,79★ · 97 avis vérifiés | Amaryllis",
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
    path: "/guide-hub",
    title: "Que faire dans le Sud de la Martinique | Amaryllis",
    desc:  "Le guide de nos hôtes à Sainte-Luce : coups de cœur, guides de destination par zone et conseils d'initiés pour le Sud de la Martinique.",
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
    title: "Guide Anses d'Arlet Martinique — Tortues marines | Amaryllis",
    desc:  "Les Anses d'Arlet (25 min de Sainte-Luce) : nager avec des tortues marines garanties tôt le matin. Village de pêcheurs, snorkeling, restaurants.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Grande_Anse_d%27_Arlet_%2847001622912%29.jpg/960px-Grande_Anse_d%27_Arlet_%2847001622912%29.jpg",
  },
  {
    path: "/guide-trois-ilets",
    title: "Guide Les Trois-Îlets Martinique — Pagerie | Amaryllis",
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
    title: "Carte interactive des activités en Martinique | Amaryllis",
    desc:  "Carte des lieux cultes de Martinique : filtrez par zone et activité (plages, snorkeling, rhum, rando), épinglez vos spots et composez votre séjour.",
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
    title: "Réservation directe Martinique — Sans frais | Amaryllis",
    desc:  "Réservez directement vos villas en Martinique sans frais Airbnb ni Booking. Économisez 12–18%, flexibilité maximale, paiement sécurisé Stripe.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/location-groupe-sainte-luce",
    title: "Location grand groupe Martinique — jusqu'à 11 personnes, Sainte-Luce",
    desc:  "Réunissez jusqu'à 11 proches en réservant Zandoli, Géko et Mabouya ensemble à Sainte-Luce. Résidence privée, piscines, réservation directe sans frais. Devis et paiement rapides.",
    image: `${BASE}/photos/zandoli/01.webp`,
  },
  {
    path: "/location-appartement-vue-mer-schoelcher",
    title: "Location appartement vue mer Schœlcher — Martinique",
    desc:  "Appartement de standing à Schœlcher : vue panoramique sur la baie de Fort-de-France, dernier étage, 2 personnes, à 10 min du centre. Réservation directe sans frais.",
    image: `${BASE}/photos/schoelcher/01.webp`,
  },
  {
    path: "/plus-belles-plages-sud-martinique",
    title: "Plus belles plages du Sud de la Martinique",
    desc:  "Sable blanc, eau turquoise, tortues : découvrez les plus belles plages du Sud de la Martinique, toutes à moins de 40 min de Sainte-Luce.",
    image: `${BASE}/photos/amaryllis/05.webp`,
  },
  {
    path: "/meilleure-saison-martinique",
    title: "Meilleure saison Martinique — Quand partir ? | Amaryllis",
    desc:  "Quand partir en Martinique ? Mois par mois : météo, mer, pluies, activités. Saison sèche déc–avr vs hivernage juin–oct. Avis d'un hôte local.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/seminaires",
    title: "Séminaires Martinique — Villa vue mer | Amaryllis",
    desc:  "Louez la Villa Amaryllis pour votre séminaire en Martinique : exclusivité totale, piscine débordement, terrasse vue mer, Starlink. Dès 1 960€ HT / 2 nuits.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/location-villa-martinique-piscine",
    title: "Location Villa Martinique avec Piscine | Amaryllis",
    desc:  "Louez une villa avec piscine privative à Sainte-Luce, Martinique : débordement eau salée, cascade ou jacuzzi. Dès 110€/nuit — sans frais Airbnb.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },

  /* ── Nouveaux guides destinations ── */
  {
    path: "/guide-distilleries-martinique",
    title: "Distilleries de Rhum Martinique — AOC | Amaryllis",
    desc:  "Visitez les meilleures distilleries de rhum agricole AOC en Martinique : JM, Clément, Saint-James, Depaz, Trois-Rivières. Guide depuis Sainte-Luce.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-francois-martinique",
    title: "Le François Martinique — Fonds Blancs | Amaryllis",
    desc:  "Découvrez les Fonds Blancs du François : piscines naturelles, sable blanc immergé, ti-punch en mer. Guide complet depuis Sainte-Luce (35 min).",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-saint-pierre-martinique",
    title: "Saint-Pierre Martinique — Pompéi des Caraïbes | Amaryllis",
    desc:  "Visitez Saint-Pierre, la ville fantôme de Martinique : ruines de 1902, épaves de plongée uniques, musée Perret. Guide complet depuis Sainte-Luce (1h).",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-randonnees-martinique",
    title: "Randonnées Martinique — Pelée & Caravelle | Amaryllis",
    desc:  "Meilleures randonnées en Martinique : Montagne Pelée (1397m), Presqu'île de la Caravelle, forêt tropicale. Niveaux débutant à expert. Depuis Sainte-Luce.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-gastronomie-martinique",
    title: "Gastronomie Martinique — Cuisine Créole | Amaryllis",
    desc:  "Saveurs créoles martiniquaises : langouste, blaff, ti-punch, accras. Marchés locaux, restaurants à Sainte-Luce. Guide gastronomique complet.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },
  {
    path: "/guide-plongee-martinique",
    title: "Plongée Martinique — Épaves, Snorkeling, Tortues | Amaryllis",
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
    desc:  "CGV de villamaryllis.com : réservation directe, annulation, caution, responsabilités. Locations Amaryllis en Martinique et Île-de-France.",
    image: `${BASE}/photos/amaryllis/01.webp`,
  },

  /* ── Guides lieux cultes (générés depuis src/data/guidesPoi.js) ── */
  ...GUIDES_POI.map(g => ({
    path:  g.slug,
    title: `${g.metaTitle} | Amaryllis`,
    desc:  g.metaDescription,
    image: g.photo || `${BASE}/photos/amaryllis/01.webp`,
    faqld: buildFAQLd(g.faq || []),
  })),
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

// Échappe le HTML pour injection sûre dans le body
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Liens internes vers les 7 biens — maillage interne crawlable, présent sur chaque page.
const NAV_BIENS = [
  ["/amaryllis", "Villa Amaryllis"], ["/zandoli", "Zandoli"], ["/iguana", "Villa Iguana"],
  ["/geko", "Géko"], ["/mabouya", "Studio Mabouya"], ["/schoelcher", "Bellevue Schœlcher"],
  ["/nogent", "Appartement Nogent"],
];

// Bloc SEO fallback injecté dans #root : <h1> + intro + maillage interne.
// React le REMPLACE au montage (donc invisible pour l'utilisateur), mais Googlebot
// le lit au crawl initial → corps de page enfin non vide. Résout le frein SEO n°1.
function buildSeoBody({ h1, title, desc, routePath }) {
  const heading = h1 || title || "Amaryllis Locations";
  const links = NAV_BIENS
    .filter(([p]) => p !== routePath)
    .map(([p, n]) => `<a href="${p}">${esc(n)}</a>`)
    .join(" · ");
  return `<div id="root"><div data-prerender-seo>` +
    `<h1>${esc(heading)}</h1>` +
    `<p>${esc(desc)}</p>` +
    `<nav aria-label="Nos locations"><a href="/">Accueil</a> · ${links} · <a href="/explorer">Guides Martinique</a></nav>` +
    `</div></div>`;
}

function patchHtml(tmpl, { path: routePath, title, desc, image, h1 = null, noindex = false, jsonld = null, faqld = null, lang = "fr", lcpPreload = false }) {
  const url = `${BASE}${routePath}`;
  let html = tmpl;

  /* Corps SEO fallback dans #root (remplacé par React au runtime) */
  html = html.replace(/<div id="root">\s*<\/div>/, buildSeoBody({ h1, title, desc, routePath }));

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

  /* JSON-LD FAQPage — injecté juste avant </head> pour rich snippet "People also ask" */
  if (faqld) {
    html = html.replace(
      /<\/head>/,
      `<script type="application/ld+json" id="ld-faq">\n${faqld}\n</script>\n</head>`
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

  // Cas accueil "/" → écrit dist/index.html (le template racine, avec contenu SEO)
  if (slug === "") {
    fs.writeFileSync(path.join(DIST, "index.html"), html, "utf8");
    count++;
    console.log(`  ✓ ${route.path} (index.html)`);
    continue;
  }

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
