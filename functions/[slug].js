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
  title: "Location grande capacité Martinique — 11 pers., Sainte-Luce",
  desc: "Louez 3 logements ensemble à Sainte-Luce (Zandoli, Géko, Mabouya) : jusqu'à 11 personnes, piscines privées, en direct sans frais. Devis rapide.",
  image: `${BASE}/photos/zandoli/01.webp`,
  url: `${BASE}/location-groupe-sainte-luce`,
};

const SCHOELCHER_APPART = {
  title: "Location appartement vue mer Schœlcher — dès 100€/nuit",
  desc: "Appartement vue mer à Schœlcher, Martinique : panorama sur la baie de Fort-de-France, dernier étage, 2 pers. Réservation directe dès 100€/nuit, sans frais.",
  image: `${BASE}/photos/schoelcher/01.webp`,
  url: `${BASE}/location-appartement-vue-mer-schoelcher`,
};

// ── Guides destination/hub non couverts par les constantes ci-dessus ──────────
// title ≤60c (mot-clé en tête), desc ≤158c. Contenu FIDÈLE aux composants
// (src/Guide*.jsx). FAQ factuelle. Mappés vers un handler générique (Article +
// FAQPage + BreadcrumbList). Garder cohérent avec scripts/prerender.mjs (ROUTES).
const WIKI_ARLET = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Grande_Anse_d%27_Arlet_%2847001622912%29.jpg/960px-Grande_Anse_d%27_Arlet_%2847001622912%29.jpg";
const GUIDE_META = {
  "guide-distilleries-martinique": {
    title: "Distilleries de Rhum Martinique — AOC | Amaryllis",
    desc: "Visitez les meilleures distilleries de rhum agricole AOC en Martinique : JM, Clément, Saint-James, Depaz, Trois-Rivières. Guide depuis Sainte-Luce.",
    faq: [
      { q: "Quelles distilleries visiter en Martinique depuis Sainte-Luce ?", a: "Trois-Rivières est à 5 min de Sainte-Luce. À découvrir aussi : l'Habitation Clément (musée et jardins), Saint-James à Sainte-Marie, JM à Macouba et Depaz au pied de la Montagne Pelée." },
      { q: "Le rhum martiniquais a-t-il une AOC ?", a: "Oui, le rhum agricole de Martinique bénéficie d'une AOC depuis 1996 : il est distillé à partir de pur jus de canne fraîche, et non de mélasse." },
      { q: "Peut-on visiter les distilleries en une journée ?", a: "Oui, un circuit en une journée est possible. Les boutiques proposent dégustations et ventes directes ; pensez à un conducteur désigné." },
    ],
  },
  "guide-gastronomie-martinique": {
    title: "Gastronomie Martinique — Cuisine Créole | Amaryllis",
    desc: "Saveurs créoles martiniquaises : langouste, blaff, ti-punch, accras. Marchés locaux, restaurants à Sainte-Luce. Guide gastronomique complet.",
    faq: [
      { q: "Quelles sont les spécialités à goûter en Martinique ?", a: "La langouste grillée et le blaff de poisson sont les deux incontournables. À découvrir aussi : accras de morue, colombo, et le ti-punch au rhum agricole." },
      { q: "Où trouver de la langouste près de Sainte-Luce ?", a: "Plusieurs restaurants de Sainte-Luce et des environs servent la langouste grillée fraîche ; les marchés locaux comme celui du Marin (le samedi) sont aussi une bonne adresse." },
      { q: "Qu'est-ce qu'un vrai ti-punch ?", a: "Le ti-punch se prépare avec du rhum agricole blanc AOC, un trait de sirop de canne et un zeste de citron vert. Chacun le dose « à sa main ». " },
    ],
  },
  "guide-plongee-martinique": {
    title: "Plongée Martinique — Épaves & tortues | Amaryllis",
    desc: "Meilleurs spots de plongée et snorkeling en Martinique : épaves de Saint-Pierre, tortues d'Arlet, Rocher du Diamant. Guide complet depuis Sainte-Luce.",
    faq: [
      { q: "Où voir des tortues en Martinique ?", a: "Aux Anses-d'Arlet (Anse Dufour et Anse Noire), les tortues marines sont quasi garanties en snorkeling, idéalement tôt le matin et sans équipement lourd." },
      { q: "Que sont les épaves de Saint-Pierre ?", a: "Lors de l'éruption de la Montagne Pelée en 1902, plusieurs navires ont coulé en rade de Saint-Pierre. Ces épaves forment aujourd'hui un site de plongée unique aux Caraïbes." },
      { q: "Le Rocher du Diamant est-il accessible en plongée ?", a: "Oui, mais c'est un site réservé aux plongeurs confirmés (faune pélagique, courants). Des clubs PADI/FFESSM organisent les sorties." },
    ],
  },
  "guide-randonnees-martinique": {
    title: "Randonnées Martinique — Pelée & Caravelle | Amaryllis",
    desc: "Meilleures randonnées en Martinique : Montagne Pelée (1397 m), presqu'île de la Caravelle, forêt tropicale. Niveaux débutant à expert. Depuis Sainte-Luce.",
    faq: [
      { q: "Quelles sont les meilleures randonnées en Martinique ?", a: "La Montagne Pelée (1 397 m) pour les sportifs, la réserve naturelle de la Caravelle et son château Dubuc pour tous, et la Forêt de Montravail à 10 min de Sainte-Luce." },
      { q: "Y a-t-il une randonnée facile près de Sainte-Luce ?", a: "Oui, la Forêt de Montravail est à 10 minutes : sentiers ombragés en forêt tropicale, accessibles en famille." },
      { q: "L'ascension de la Montagne Pelée est-elle difficile ?", a: "C'est une randonnée exigeante (dénivelé important, météo changeante au sommet). Partez tôt, bien équipé, par temps dégagé." },
    ],
  },
  "guide-trois-ilets": {
    title: "Guide Les Trois-Îlets Martinique — Pagerie | Amaryllis",
    desc: "Guide Trois-Îlets depuis Sainte-Luce (35 min) : Musée de la Pagerie (naissance de Joséphine), village créole, marina face à Fort-de-France.",
    faq: [
      { q: "Que visiter aux Trois-Îlets ?", a: "Le Musée de la Pagerie (lieu de naissance de l'impératrice Joséphine), le village créole et sa marina, et les plages de l'Anse Mitan et de l'Anse à l'Âne." },
      { q: "À quelle distance sont les Trois-Îlets de Sainte-Luce ?", a: "Environ 35 minutes en voiture depuis Sainte-Luce. La commune fait face à Fort-de-France, accessible aussi par navette maritime." },
    ],
  },
  "guide-saint-pierre-martinique": {
    title: "Saint-Pierre Martinique — Pompéi des Caraïbes",
    desc: "Visitez Saint-Pierre, la ville fantôme de Martinique : ruines de 1902, épaves de plongée uniques, musée Frank Perret. Guide depuis Sainte-Luce (1h).",
    faq: [
      { q: "Pourquoi Saint-Pierre est appelée la Pompéi des Caraïbes ?", a: "L'éruption de la Montagne Pelée le 8 mai 1902 a détruit la ville en quelques minutes. Les ruines visibles aujourd'hui témoignent de cette catastrophe." },
      { q: "Que voir à Saint-Pierre ?", a: "Les ruines de la ville, le musée Frank Perret (vulcanologie et mémoire de 1902), et les épaves sous-marines, site de plongée exceptionnel." },
      { q: "À quelle distance est Saint-Pierre de Sainte-Luce ?", a: "Environ 1 heure de route, le long de la côte caraïbe au nord de Fort-de-France." },
    ],
  },
  "guide-francois-martinique": {
    title: "Le François Martinique — Fonds Blancs | Amaryllis",
    desc: "Découvrez les Fonds Blancs du François : piscines naturelles, sable blanc immergé, ti-punch en mer. Guide complet depuis Sainte-Luce (35 min).",
    faq: [
      { q: "Que sont les Fonds Blancs du François ?", a: "Des hauts-fonds de sable blanc immergés au large du François : on s'y baigne dans une eau peu profonde et turquoise, souvent lors d'une sortie en bateau avec ti-punch." },
      { q: "Quelle spécialité goûter au François ?", a: "Le chatrou (poulpe) et la langouste fraîche sont les spécialités locales. Le marché aux poissons est une bonne adresse." },
      { q: "Que faire d'autre au François ?", a: "Du kayak ou du paddle dans la mangrove, et la visite des fonds blancs en bateau. La commune est à environ 35 min de Sainte-Luce." },
    ],
  },
  "guide-arlet": {
    title: "Guide Anses-d'Arlet Martinique — Tortues | Amaryllis",
    desc: "Les Anses-d'Arlet (25 min de Sainte-Luce) : nager avec des tortues marines garanties tôt le matin. Village de pêcheurs, snorkeling, restaurants.",
    image: WIKI_ARLET,
    faq: [
      { q: "Peut-on nager avec des tortues aux Anses-d'Arlet ?", a: "Oui, c'est le must absolu : les tortues marines sont quasi garanties en snorkeling, surtout tôt le matin avant l'affluence." },
      { q: "À quelle distance sont les Anses-d'Arlet de Sainte-Luce ?", a: "Environ 25 minutes en voiture. Le village de pêcheurs et sa plage avec l'église face à la mer sont emblématiques." },
    ],
  },
  "meilleure-saison-martinique": {
    title: "Meilleure saison Martinique — Quand partir ? | Amaryllis",
    desc: "Quand partir en Martinique ? Mois par mois : météo, mer, pluies, activités. Saison sèche déc–avr vs hivernage juin–oct. Avis d'un hôte local.",
    faq: [
      { q: "Quelle est la meilleure période pour aller en Martinique ?", a: "La saison sèche (« carême »), de décembre à avril, offre une mer calme, peu de pluie et une excellente visibilité. Mars est souvent considéré comme le meilleur mois." },
      { q: "Faut-il éviter la saison des pluies ?", a: "L'hivernage (juin à octobre) apporte des averses, surtout en septembre, pic de l'hivernage. Le risque cyclonique reste statistiquement faible mais existe." },
      { q: "Peut-on partir en Martinique à Noël ?", a: "Oui, décembre marque le retour de la saison sèche : c'est une période idéale pour les fêtes, mais aussi la plus demandée." },
    ],
  },
  "reservation-directe-martinique": {
    title: "Réservation directe Martinique — Sans frais | Amaryllis",
    desc: "Réservez vos villas en Martinique en direct, sans frais Airbnb ni Booking : −15% en moyenne, contact hôte, paiement Stripe sécurisé. Dès 85€/nuit.",
    faq: [
      { q: "Pourquoi réserver en direct plutôt que par Airbnb ou Booking ?", a: "La réservation directe supprime les frais de service des plateformes (jusqu'à −15% en moyenne), avec un contact direct avec l'hôte et les mêmes garanties." },
      { q: "Le paiement en direct est-il sécurisé ?", a: "Oui, les paiements sont traités par Stripe, plateforme de paiement sécurisée. Une caution peut être demandée par pré-autorisation." },
      { q: "Quelle est la politique d'annulation ?", a: "Les conditions d'annulation sont précisées dans les CGV et lors de la réservation. Contactez l'hôte pour toute question sur vos dates." },
    ],
  },
  "sainte-luce-martinique": {
    title: "Location villa Sainte-Luce Martinique — piscine & vue mer",
    desc: "Louez une villa à Sainte-Luce, Martinique : piscine privée, vue mer, dès 110€/nuit en direct sans frais. Plages, activités et conseils de vos hôtes.",
    image: `${BASE}/photos/iguana/01.webp`,
    faq: [
      { q: "Pourquoi choisir Sainte-Luce pour ses vacances en Martinique ?", a: "Sainte-Luce, dans le sud de la Martinique, offre des plages de sable blanc (Gros Raisin, Corps de Garde), des fonds marins pour le snorkeling et une position centrale pour explorer le sud." },
      { q: "Quels logements proposez-vous à Sainte-Luce ?", a: "Plusieurs villas et logements sur les hauteurs de Sainte-Luce : Amaryllis (piscine à débordement), Zandoli, Géko et le studio Mabouya, tous avec vue mer ou jardin tropical." },
      { q: "Les plages sont-elles loin des logements ?", a: "Les plages de Sainte-Luce sont accessibles en quelques minutes en voiture depuis les hauteurs où se situent les logements." },
    ],
  },
  "guide-hub": {
    title: "Que faire dans le Sud de la Martinique | Amaryllis",
    desc: "Le guide de nos hôtes à Sainte-Luce : coups de cœur, guides de destination par zone et conseils d'initiés pour le Sud de la Martinique.",
    faq: [
      { q: "Que faire dans le Sud de la Martinique ?", a: "Les Salines à Sainte-Anne, nager avec les tortues aux Anses-d'Arlet, plonger face au Rocher du Diamant, visiter les Trois-Îlets : tout est à moins de 30 min de Sainte-Luce." },
      { q: "Quels sont les coups de cœur de vos hôtes ?", a: "Les plages secrètes, la distillerie Trois-Rivières et les sentiers tropicaux des environs, testés et approuvés par vos hôtes." },
    ],
  },
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

  // Handler générique — guides destination/hub (table GUIDE_META).
  // Construit Article + FAQPage + BreadcrumbList (Guides → page), puis renvoie
  // via le MÊME mécanisme que les handlers voisins (context.next + injectMeta).
  if (GUIDE_META[slug]) {
    const g = GUIDE_META[slug];
    const url = `${BASE}/${slug}`;
    const image = g.image || `${BASE}/photos/amaryllis/01.webp`;
    const ld = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": g.title,
        "description": g.desc,
        "url": url,
        "image": image,
        "author": { "@id": `${BASE}/#organization` },
        "publisher": { "@id": `${BASE}/#organization` },
      },
    ];
    if (g.faq && g.faq.length) {
      ld.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": g.faq.map(({ q, a }) => ({
          "@type": "Question",
          "name": q,
          "acceptedAnswer": { "@type": "Answer", "text": a },
        })),
      });
    }
    ld.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Guides", "item": `${BASE}/guide-hub` },
        { "@type": "ListItem", "position": 2, "name": g.title, "item": url },
      ],
    });
    const meta = buildMeta(g.title, g.desc, url, image);
    const resp = await context.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, JSON.stringify(ld)), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Unknown slug — let Cloudflare handle (will redirect to / via _redirects)
  return context.next();
}
