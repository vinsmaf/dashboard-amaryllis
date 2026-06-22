// GuideVillaPiscine.jsx — /location-villa-martinique-piscine
// Page pilier SEO · keyword : "location villa martinique avec piscine"

import SEOMeta from "./SEOMeta.jsx";
import WikiImg from "./WikiImg.jsx";
import NewsletterForm from "./NewsletterForm.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG = `${BASE}/photos/amaryllis/02.webp`;

const FAQ_ITEMS = [
  {
    q: "Quelle villa choisir à la Martinique avec piscine privée ?",
    a: "Cela dépend de votre groupe et de votre budget. Pour 8 personnes avec piscine à débordement eau salée et vue mer 180°, la Villa Amaryllis (à partir de 280 €/nuit) est notre propriété phare. Pour 5 personnes avec piscine privative à cascade et un excellent rapport confort/prix, Zandoli propose une mezzanine et vue mer dès 110 €/nuit. Les couples trouveront leur bonheur chez Mabouya (jacuzzi privatif, à partir de 70 €/nuit) ou Géko (piscine privative à cascade, 110 €/nuit pour 4 personnes). Pour une piscine eau salée unique et vue Rocher du Diamant, Iguana (180 €/nuit, 6 personnes).",
  },
  {
    q: "Quelle est la meilleure saison pour louer une villa avec piscine en Martinique ?",
    a: "La saison idéale s'étend de décembre à avril : temps sec, alizés constants, mer calme. La piscine est utilisée toute l'année (eau entre 26 °C et 30 °C en été), mais la baignade en mer est particulièrement agréable de janvier à juin. Juillet-août reste très animé. Pour les tarifs les plus doux, privilégiez mai-juin ou septembre-octobre.",
  },
  {
    q: "Peut-on réserver une villa en Martinique sans passer par Airbnb ?",
    a: "Oui — et c'est l'intérêt de réserver directement sur villamaryllis.com. Vous économisez les frais de service Airbnb (jusqu'à 14 % du total) et vous bénéficiez d'un contact direct WhatsApp avec vos hôtes, d'un guide personnalisé du Sud et d'une flexibilité sur les dates et les conditions.",
  },
  {
    q: "La piscine est-elle disponible toute l'année ?",
    a: "Oui. La piscine de la Villa Amaryllis est eau salée et non chauffée — elle est naturellement à 27-29 °C de juin à novembre, et 25-27 °C de décembre à mai. La piscine de Zandoli est chauffée à 28 °C toute l'année. Géko et Mabouya disposent de piscines non chauffées, agréables en toutes saisons compte tenu du climat tropical.",
  },
  {
    q: "Y a-t-il une voiture de location incluse avec les villas ?",
    a: "La voiture de location n'est pas incluse mais indispensable en Martinique. Nos hôtes vous recommandent des partenaires locaux à tarifs négociés (dès 35 €/jour), et peuvent vous déposer à l'aéroport ou vous accueillir à votre arrivée pour faciliter le check-in. Toutes nos villas disposent d'un parking privatif.",
  },
  {
    q: "Quelles activités peut-on faire depuis les villas de Sainte-Luce ?",
    a: "Sainte-Luce est la base idéale pour explorer le Sud : Les Salines (20 min), Anses d'Arlet et les tortues marines (25 min), le Rocher du Diamant pour la plongée (20 min), la distillerie Trois-Rivières (5 min) et la forêt tropicale de Montravail. En excursion, le catamaran aux îlets du Sud part du Marin à 15 minutes.",
  },
];

const VILLAS = [
  {
    id: "amaryllis",
    nom: "Villa Amaryllis",
    accroche: "La propriété phare — piscine à débordement eau salée, vue Caraïbe 180°",
    capacite: "8 personnes",
    chambres: "3 chambres",
    piscine: "Piscine débordement eau salée (4×7 m)",
    vue: "Vue mer panoramique",
    prix: "À partir de 280 €/nuit",
    highlight: true,
    photo: "/photos/amaryllis/01.webp",
    equip: ["Piscine débordement", "Jacuzzi privatif", "Vue mer 180°", "Terrasse 100 m²", "WiFi Starlink", "Climatisation"],
  },
  {
    id: "zandoli",
    nom: "Zandoli",
    accroche: "Piscine chauffée vue mer — le confort, sans compromis",
    capacite: "5 personnes",
    chambres: "3 chambres",
    piscine: "Piscine privée chauffée",
    vue: "Vue mer",
    prix: "À partir de 110 €/nuit",
    highlight: false,
    photo: "/photos/zandoli/01.webp",
    equip: ["Piscine chauffée", "Vue mer", "Jardin tropical", "Cuisine équipée", "WiFi", "Parking privé"],
  },
  {
    id: "geko",
    nom: "Géko",
    accroche: "Piscine privée dans un jardin tropical — idéale en famille",
    capacite: "4 personnes",
    chambres: "2 chambres",
    piscine: "Piscine privée",
    vue: "Jardin tropical",
    prix: "À partir de 110 €/nuit",
    highlight: false,
    photo: "/photos/geko/01.webp",
    equip: ["Piscine privée", "Jardin tropical", "Terrasse couverte", "Cuisine équipée", "WiFi", "Climatisation"],
  },
  {
    id: "mabouya",
    nom: "Villa Mabouya",
    accroche: "Jacuzzi privatif vue mer — l'adresse romantique du Sud Martinique",
    capacite: "2 personnes",
    chambres: "1 chambre",
    piscine: "Jacuzzi privatif",
    vue: "Vue mer",
    prix: "À partir de 70 €/nuit",
    highlight: false,
    photo: "/photos/mabouya/01.webp",
    equip: ["Jacuzzi privatif", "Vue mer", "Terrasse privée", "Cuisine équipée", "WiFi", "Climatisation"],
  },
];

const css = `
  .gvp-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(250,245,233,0.13); border: 1px solid rgba(250,245,233,0.25);
    border-radius: 100px; padding: 8px 16px;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
    color: rgba(250,245,233,0.9); letter-spacing: 0.04em; white-space: nowrap;
    backdrop-filter: blur(6px);
  }
  .gvp-badge.highlight {
    background: rgba(196,114,84,0.32); border-color: rgba(196,114,84,0.65); font-weight: 600;
  }

  .gvp-section { margin-bottom: 60px; }

  .gvp-lead {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px;
    line-height: 1.78; color: ${TEXT}; margin: 0 0 32px;
  }
  .gvp-lead em { color: ${CORAL}; font-style: italic; }

  .gvp-body {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px;
    line-height: 1.75; color: ${TEXT}; margin: 0 0 22px;
  }

  /* ── Cards villas ── */
  .gvp-villa-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 56px;
  }
  .gvp-villa-card {
    background: #fff; border-radius: 16px; overflow: hidden;
    border: 1px solid ${SAND}; position: relative;
    transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s;
    text-decoration: none; display: block; color: inherit;
  }
  .gvp-villa-card:hover { transform: translateY(-5px); box-shadow: 0 20px 48px rgba(14,59,58,0.14); }
  .gvp-villa-card.featured { grid-column: span 2; display: grid; grid-template-columns: 1.15fr 1fr; }
  .gvp-villa-card img { width: 100%; height: 220px; object-fit: cover; display: block; }
  .gvp-villa-card.featured img { height: 100%; min-height: 280px; }
  .gvp-villa-body { padding: 24px 28px; }
  .gvp-villa-eyebrow {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.28em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 8px;
  }
  .gvp-villa-name {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 20px;
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 8px;
  }
  .gvp-villa-accroche {
    font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic;
    font-size: 16px; line-height: 1.55; color: ${MUTED}; margin: 0 0 18px;
  }
  .gvp-villa-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 18px; }
  .gvp-chip {
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 4px;
    padding: 4px 10px; font-family: 'Jost', sans-serif; font-size: 11px;
    color: ${MUTED}; letter-spacing: 0.04em;
  }
  .gvp-villa-meta {
    display: flex; justify-content: space-between; align-items: flex-end;
    border-top: 1px solid ${SAND}; padding-top: 16px; margin-top: 4px;
  }
  .gvp-villa-price {
    font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 500;
    color: ${NAVY}; letter-spacing: 0.04em;
  }
  .gvp-villa-cta {
    background: ${CORAL}; color: #fff; padding: 9px 20px; border-radius: 6px;
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 500;
    letter-spacing: 0.12em; text-transform: uppercase;
  }
  .gvp-featured-badge {
    position: absolute; top: 14px; left: 14px; z-index: 2;
    background: ${CORAL}; color: #fff; padding: 4px 14px; border-radius: 100px;
    font-family: 'Jost', sans-serif; font-size: 9px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
  }

  /* ── Bloc avantage ── */
  .gvp-avantages {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 56px;
  }
  .gvp-avantage {
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 24px 22px;
  }
  .gvp-avantage-icon { font-size: 26px; margin-bottom: 12px; display: block; }
  .gvp-avantage-title {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 13px;
    color: ${NAVY}; margin: 0 0 8px; letter-spacing: 0.04em;
  }
  .gvp-avantage-text {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px;
    line-height: 1.7; color: ${TEXT}; margin: 0;
  }

  /* ── Tableau comparatif ── */
  .gvp-compare {
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 16px;
    overflow: hidden; margin-bottom: 56px;
  }
  .gvp-compare-head {
    background: ${NAVY}; padding: 24px 28px; border-bottom: 1px solid rgba(250,245,233,0.1);
  }
  .gvp-compare-row {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    padding: 14px 28px; border-bottom: 1px solid ${SAND};
    font-family: 'Jost', sans-serif; font-size: 13px; align-items: center;
  }
  .gvp-compare-row:last-child { border-bottom: none; }
  .gvp-compare-row.header { background: rgba(14,59,58,0.04); font-weight: 600; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: ${MUTED}; }
  .gvp-compare-cell { color: ${TEXT}; }
  .gvp-compare-cell.name { color: ${NAVY}; font-weight: 500; }
  .gvp-compare-cell.price { color: ${CORAL}; font-weight: 500; }

  /* ── Saisons ── */
  .gvp-saisons {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 56px;
  }
  .gvp-saison {
    background: linear-gradient(135deg, #0a2e2d 0%, #0e3b3a 100%);
    border: 1px solid rgba(196,114,84,0.25); border-radius: 14px; padding: 28px 26px;
  }
  .gvp-saison-label {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 700;
    letter-spacing: 0.28em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 8px;
  }
  .gvp-saison-name {
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: 20px;
    letter-spacing: 0.08em; text-transform: uppercase; color: ${IVORY}; margin: 0 0 10px;
  }
  .gvp-saison-text {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px;
    line-height: 1.65; color: rgba(250,245,233,0.75); margin: 0;
  }

  /* ── FAQ ── */
  .gvp-faq-item {
    border-bottom: 1px solid ${SAND}; padding: 20px 0;
  }
  .gvp-faq-item:last-child { border-bottom: none; }
  .gvp-faq-q {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 15px;
    color: ${NAVY}; margin: 0 0 10px; line-height: 1.45;
  }
  .gvp-faq-a {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.72; color: ${TEXT}; margin: 0;
  }

  /* ── CTA final ── */
  .gvp-cta-block {
    background: ${NAVY}; border-radius: 20px; padding: 52px 44px; text-align: center; margin-bottom: 48px;
  }

  /* ── Info grid ── */
  .gvp-info-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;
    margin-bottom: 56px;
  }
  .gvp-info-card {
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 18px 20px;
  }
  .gvp-info-label {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.25em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 6px;
  }
  .gvp-info-value {
    font-family: 'Jost', sans-serif; font-size: 13px; color: ${NAVY}; line-height: 1.5;
  }

  /* ── Nav inter-guides ── */
  .gvp-nav { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-top: 48px; }
  .gvp-nav a {
    padding: 12px 24px; border: 1px solid ${SAND}; border-radius: 8px;
    text-decoration: none; color: ${NAVY}; font-family: 'Jost', sans-serif;
    font-size: 13px; letter-spacing: 0.08em;
    transition: background 0.2s, border-color 0.2s;
  }
  .gvp-nav a:hover { background: ${CREAM}; border-color: ${CORAL}; }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .gvp-villa-grid { grid-template-columns: 1fr; }
    .gvp-villa-card.featured { grid-column: span 1; display: block; }
    .gvp-villa-card.featured img { height: 220px; }
    .gvp-avantages { grid-template-columns: 1fr; }
    .gvp-compare-row { grid-template-columns: 1fr 1fr; }
    .gvp-compare-row .gvp-compare-cell:nth-child(n+3) { display: none; }
    .gvp-compare-row.header .gvp-compare-cell:nth-child(n+3) { display: none; }
    .gvp-saisons { grid-template-columns: 1fr; }
    .gvp-cta-block { padding: 36px 24px; }
  }
  @media (max-width: 480px) {
    .gvp-badge { font-size: 11px; padding: 7px 12px; }
    .gvp-lead { font-size: 18px; }
    .gvp-body { font-size: 17px; }
  }
`;

const JSONLD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ_ITEMS.map(f => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a },
  })),
};

const JSONLD_ARTICLE = {
  "@context": "https://schema.org",
  "@graph": [
    JSONLD_FAQ,
    {
      "@type": "Article",
      "headline": "Location villa Martinique avec piscine — Guide complet 2025",
      "description": "Toutes nos villas avec piscine privée à Sainte-Luce, Martinique. Piscine débordement vue mer, jacuzzi privatif, chauffée ou eau salée. Réservation directe sans frais.",
      "url": `${BASE}/location-villa-martinique-piscine`,
      "image": HERO_IMG,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` },
      "datePublished": "2025-01-01",
      "dateModified": "2025-05-01",
    },
  ],
};

export default function GuideVillaPiscine() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Location Villa Martinique avec Piscine — Réservation Directe | Amaryllis"
        description="4 villas avec piscine privée à Sainte-Luce, Martinique. Piscine à débordement vue mer, jacuzzi privatif, piscine chauffée. À partir de 70 €/nuit. Réservation directe, sans frais de service."
        canonical="/location-villa-martinique-piscine"
        image={HERO_IMG}
        type="article"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_ARTICLE) }}
      />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        {/* ── Header ── */}
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <a href="/guide-hub" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.6 }}>Explorer Martinique</a>
              <a href="/" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.7 }}>← Nos villas</a>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <div style={{ position: "relative", height: "min(90vh, 640px)", overflow: "hidden" }}>
          <WikiImg
            src={HERO_IMG}
            alt="Piscine à débordement vue mer — Villa Amaryllis, Sainte-Luce Martinique"
            loading="eager"
            fetchPriority="high"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 55%" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(14,59,58,0.15) 0%, rgba(14,59,58,0.1) 35%, rgba(14,59,58,0.86) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 32px 52px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
              <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Guide · Locations d'exception Martinique</p>
              <h1 style={{
                fontFamily: "'Jost', sans-serif", fontWeight: 200,
                fontSize: "clamp(28px, 5.5vw, 60px)", letterSpacing: "0.04em",
                color: IVORY, textTransform: "uppercase", margin: "0 0 18px", lineHeight: 1.05,
              }}>
                Location villa<br />Martinique avec piscine
              </h1>
              <p style={{
                color: "rgba(250,245,233,0.9)", fontSize: "clamp(16px, 2.5vw, 20px)",
                maxWidth: 580, margin: "0 0 28px", lineHeight: 1.6,
                fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic",
              }}>
                Quatre propriétés d'exception à Sainte-Luce, chacune avec sa piscine privée — de la villa vue mer avec débordement jusqu'au jacuzzi de couple au-dessus des Caraïbes.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[
                  { label: "Piscine à débordement", highlight: true },
                  { label: "Vue mer garantie" },
                  { label: "Réservation directe" },
                  { label: "Sud Martinique" },
                  { label: "Sainte-Luce" },
                ].map(b => (
                  <span key={b.label} className={`gvp-badge${b.highlight ? " highlight" : ""}`}>{b.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Contenu principal ── */}
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "64px 24px 80px" }}>

          {/* ── Intro éditoriale ── */}
          <div className="gvp-section">
            <p style={{ color: CORAL, fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Pourquoi choisir une villa avec piscine en Martinique</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3.5vw, 32px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 24px", lineHeight: 1.15 }}>
              L'île la plus belle des Antilles — et votre piscine rien qu'à vous
            </h2>
            <p className="gvp-lead">
              La Martinique est une île de contrastes : plages de sable blanc au sud, forêt tropicale au nord, volcans, mangroves et récifs coralliens partout. Mais ce qui fait la différence entre un voyage ordinaire et un séjour inoubliable, c'est souvent <em>ce moment de fin d'après-midi</em>, les pieds dans l'eau de votre piscine privée, quand la lumière dorée du Carbet joue sur la surface et que les alizés font frémir les feuilles des balisiers.
            </p>
            <p className="gvp-body">
              Nos quatre villas avec piscine privée sont toutes situées à Sainte-Luce, une commune paisible du Sud Martinique, à vingt minutes des Salines, vingt-cinq des tortues d'Arlet, vingt du Rocher du Diamant. Un emplacement stratégique pour explorer le meilleur de l'île — et la sérénité absolue une fois la porte de la villa refermée.
            </p>
            <p className="gvp-body">
              Ici, pas d'agence anonyme, pas de gestionnaire injoignable. Vos hôtes — Martiniquais, vivant à Sainte-Luce — vous accueillent en personne, vous transmettent leurs adresses locales et restent disponibles sur WhatsApp pendant tout votre séjour. La réservation directe, en dehors d'Airbnb, vous fait économiser jusqu'à 14 % de frais de service — sans rien perdre en qualité ni en garanties.
            </p>
          </div>

          {/* ── Avantages piscine privée ── */}
          <div className="gvp-section">
            <p style={{ color: CORAL, fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Pourquoi la piscine privée change tout</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 28px", lineHeight: 1.15 }}>
              Les six avantages d'une villa avec piscine aux Antilles
            </h2>
            <div className="gvp-avantages">
              {[
                { icon: "🌊", title: "Intimité absolue", text: "Aucun inconnu dans votre espace de baignade. Vous plongez quand vous voulez, comme vous voulez — à l'aube, en maillot ou sans." },
                { icon: "🌡️", title: "Eau à température idéale", text: "Entre 27 et 30 °C en été, 25-27 °C en hiver. Nos piscines non chauffées profitent naturellement du climat tropical. Zandoli est chauffée toute l'année." },
                { icon: "🌅", title: "Le lever du soleil depuis l'eau", text: "À Sainte-Luce, le soleil se lève côté Atlantique. Certaines matinées, plonger à 7h dans votre piscine vue mer reste un souvenir pour toute une vie." },
                { icon: "👨‍👩‍👧", title: "Sécurité pour les enfants", text: "Pas de mer agitée, pas de courants imprévisibles. Les enfants se baignent en toute sécurité pendant que vous les surveillez depuis la terrasse." },
                { icon: "🥂", title: "Dîners au bord de l'eau", text: "Nos terrasses sont conçues pour que piscine et salle à manger ne forment qu'un seul espace de vie. Dîner dehors, les pieds dans l'eau — c'est possible." },
                { icon: "💆", title: "Récupération après excursions", text: "Journée longue aux Salines ou à Arlet ? La piscine à votre retour efface la fatigue en dix minutes. C'est votre spa privé, sans rendez-vous." },
              ].map(a => (
                <div key={a.title} className="gvp-avantage">
                  <span className="gvp-avantage-icon">{a.icon}</span>
                  <p className="gvp-avantage-title">{a.title}</p>
                  <p className="gvp-avantage-text">{a.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cards villas ── */}
          <div className="gvp-section">
            <p style={{ color: CORAL, fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Nos propriétés</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 28px", lineHeight: 1.15 }}>
              Quatre villas avec piscine privée à Sainte-Luce
            </h2>
            <div className="gvp-villa-grid">
              {VILLAS.map((v, i) => (
                <a
                  key={v.id}
                  href={`/${v.id}`}
                  className={`gvp-villa-card${v.highlight ? " featured" : ""}`}
                >
                  {v.highlight && <span className="gvp-featured-badge">★ Coup de cœur</span>}
                  <img
                    src={v.photo}
                    alt={`${v.piscine} — ${v.nom}, Sainte-Luce Martinique`}
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  <div className="gvp-villa-body">
                    <p className="gvp-villa-eyebrow">{v.capacite} · {v.chambres}</p>
                    <h3 className="gvp-villa-name">{v.nom}</h3>
                    <p className="gvp-villa-accroche">{v.accroche}</p>
                    <div className="gvp-villa-chips">
                      {v.equip.map(e => <span key={e} className="gvp-chip">{e}</span>)}
                    </div>
                    <div className="gvp-villa-meta">
                      <span className="gvp-villa-price">{v.prix}</span>
                      <span className="gvp-villa-cta">Voir la villa →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* ── Comment choisir sa villa ── */}
          <div className="gvp-section">
            <p style={{ color: CORAL, fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Le bon choix selon votre séjour</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 20px", lineHeight: 1.15 }}>
              Quelle villa avec piscine choisir en Martinique ?
            </h2>
            <p className="gvp-body">
              Le choix d'une villa avec piscine dépend de trois variables : la taille du groupe, le type de piscine souhaité, et le rapport qualité-prix. Voici notre guide honnête :
            </p>

            {/* Tableau comparatif */}
            <div className="gvp-compare">
              <div className="gvp-compare-head">
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: IVORY, margin: 0, letterSpacing: "0.06em" }}>Comparatif — villas avec piscine Sainte-Luce</p>
              </div>
              <div className="gvp-compare-row header">
                <div className="gvp-compare-cell">Villa</div>
                <div className="gvp-compare-cell">Capacité</div>
                <div className="gvp-compare-cell">Type de piscine</div>
                <div className="gvp-compare-cell">Vue mer</div>
                <div className="gvp-compare-cell">Prix / nuit</div>
              </div>
              {[
                { name: "Villa Amaryllis", cap: "8 pers.", piscine: "Débordement eau salée 4×7 m", vue: "180° Caraïbes", prix: "dès 280 €" },
                { name: "Zandoli",   cap: "5 pers.", piscine: "Privative à cascade",          vue: "Mer + jardin",   prix: "dès 110 €" },
                { name: "Villa Iguana",    cap: "6 pers.", piscine: "Eau salée non chlorée",        vue: "Rocher Diamant", prix: "dès 180 €" },
                { name: "Géko",      cap: "4 pers.", piscine: "Privative à cascade",          vue: "Jardin tropical",prix: "dès 110 €" },
                { name: "Mabouya",  cap: "2 pers.", piscine: "Jacuzzi privatif",             vue: "Mer terrasse",   prix: "dès 70 €" },
              ].map(row => (
                <div key={row.name} className="gvp-compare-row">
                  <div className="gvp-compare-cell name">{row.name}</div>
                  <div className="gvp-compare-cell">{row.cap}</div>
                  <div className="gvp-compare-cell">{row.piscine}</div>
                  <div className="gvp-compare-cell">{row.vue}</div>
                  <div className="gvp-compare-cell price">{row.prix}</div>
                </div>
              ))}
            </div>

            <p className="gvp-body">
              <strong style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, color: NAVY }}>Pour un séjour en famille ou entre amis (jusqu'à 8 personnes) :</strong> la Villa Amaryllis s'impose. Sa piscine à débordement eau salée 4×7 m — inspirée des hôtels de luxe aux Maldives — offre une sensation de fusion avec la mer Caraïbe. Les trois chambres climatisées, la terrasse de 100 m² face à la baie et le jardin tropical en font la propriété la plus polyvalente du portfolio.
            </p>
            <p className="gvp-body">
              <strong style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, color: NAVY }}>Pour un groupe de 5 personnes avec budget maîtrisé :</strong> Zandoli est le choix le plus cohérent. Sa piscine chauffée garantit une température parfaite même en décembre-janvier, et la vue mer n'a rien à envier à Amaryllis.
            </p>
            <p className="gvp-body">
              <strong style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, color: NAVY }}>Pour un couple en voyage romantique :</strong> Mabouya est taillée pour vous. Son jacuzzi privatif avec vue mer, sa terrasse intime et son tarif accessible (dès 70 €/nuit) en font l'adresse la plus demandée pour les lunes de miel. Géko conviendra aux familles de 4 personnes cherchant calme et verdure sans sacrifier la piscine.
            </p>
          </div>

          {/* ── Meilleures saisons ── */}
          <div className="gvp-section">
            <p style={{ color: CORAL, fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Quand partir</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 28px", lineHeight: 1.15 }}>
              La meilleure saison pour louer une villa avec piscine en Martinique
            </h2>
            <p className="gvp-body">
              Contrairement à ce qu'on pourrait croire, la Martinique se visite toute l'année. La piscine est agréable en toutes saisons — l'eau reste entre 25 et 30 °C selon les mois. Ce qui change, c'est le climat extérieur et l'animation de l'île.
            </p>
            <div className="gvp-saisons">
              {[
                {
                  label: "Haute saison — idéale",
                  name: "Décembre — Avril",
                  text: "La saison sèche. Alizés constants, ciel bleu, mer calme. C'est la période la plus prisée — réservez 3 à 6 mois à l'avance pour les villas avec piscine. Les tarifs sont en haute saison mais la qualité du séjour justifie l'investissement.",
                },
                {
                  label: "Saison carnaval — festive",
                  name: "Janvier — Mars",
                  text: "Le carnaval martiniquais est l'un des plus vibrants des Caraïbes, avec des défilés dans Fort-de-France et des animations dans tous les villages. Une expérience culturelle unique, combinée au confort de votre villa avec piscine le soir.",
                },
                {
                  label: "Intersaison — rapport qualité-prix",
                  name: "Mai — Juin",
                  text: "Quelques averses passagères, une végétation encore plus luxuriante, des tarifs 15 à 25 % inférieurs à la haute saison. La piscine est à son maximum — eau chaude, journées longues. Idéal pour ceux qui veulent éviter la foule.",
                },
                {
                  label: "Été — animé et chaleureux",
                  name: "Juillet — Août",
                  text: "La période familiale par excellence. Chaleur tropicale, eau de piscine entre 28 et 30 °C, ambiance festive. La Martinique est très fréquentée — réservez tôt. Nos villas avec piscine permettent de décompresser loin des plages bondées.",
                },
              ].map(s => (
                <div key={s.name} className="gvp-saison">
                  <p className="gvp-saison-label">{s.label}</p>
                  <p className="gvp-saison-name">{s.name}</p>
                  <p className="gvp-saison-text">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Infos pratiques ── */}
          <div className="gvp-section">
            <p style={{ color: CORAL, fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Infos pratiques</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 28px", lineHeight: 1.15 }}>
              Tout savoir avant de réserver votre villa martinique avec piscine
            </h2>
            <div className="gvp-info-grid">
              {[
                { label: "Aéroport", value: "Fort-de-France Aimé Césaire (FDF) — vols directs Paris (8h), vols via Pointe-à-Pitre" },
                { label: "Voiture de location", value: "Indispensable — prévoir 35 à 65 €/jour. Réservez avant le départ en haute saison." },
                { label: "Distance depuis FDF", value: "Sainte-Luce à 35 min en voiture depuis l'aéroport via l'autoroute A1" },
                { label: "Monnaie", value: "Euro (€) — la Martinique est un département français (DOM)" },
                { label: "Langue", value: "Français · Créole martiniquais. Anglais peu répandu en dehors des zones touristiques." },
                { label: "WiFi", value: "Toutes nos villas disposent du WiFi Starlink haut débit inclus dans le tarif." },
                { label: "Animaux", value: "Acceptés sur demande à la Villa Amaryllis (supplément 40 €/séjour, max 2 animaux)." },
                { label: "Ménage & linge", value: "Linge de maison et serviettes fournis. Ménage de départ inclus. Ménage en milieu de séjour en option." },
              ].map(item => (
                <div key={item.label} className="gvp-info-card">
                  <p className="gvp-info-label">{item.label}</p>
                  <p className="gvp-info-value">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pourquoi Sainte-Luce ── */}
          <div className="gvp-section">
            <p style={{ color: CORAL, fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>L'emplacement</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 20px", lineHeight: 1.15 }}>
              Pourquoi Sainte-Luce est la meilleure base pour explorer le Sud Martinique
            </h2>
            <p className="gvp-body">
              Sainte-Luce est une commune du littoral Atlantique Sud, à la frontière entre la côte caraïbe et la côte atlantique. Ce positionnement central lui confère une qualité rare : moins touristique que Sainte-Anne ou Le Diamant, mais à égale distance de toutes les grandes destinations du Sud.
            </p>
            <p className="gvp-body">
              En vingt minutes vers l'ouest, vous êtes à la plage de Grande Anse des Salines — classée parmi les plus belles des Caraïbes. En vingt-cinq minutes vers le nord-ouest, vous nagez avec les tortues marines de l'anse d'Arlet. La distillerie Trois-Rivières, où le rhum agricole AOC Martinique est produit depuis 1660, est à cinq minutes à pied. La forêt tropicale de Montravail, avec ses sentiers balisés entre fougères arborescentes et balisiers, est à dix minutes.
            </p>
            <p className="gvp-body">
              Depuis votre villa avec piscine à Sainte-Luce, vous explorez l'île entière — et vous rentrez le soir dans votre propre oasis de tranquillité, loin des hôtels animés et des plages bondées.
            </p>
          </div>

          {/* ── FAQ ── */}
          <div className="gvp-section">
            <p style={{ color: CORAL, fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Questions fréquentes</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 24px", lineHeight: 1.15 }}>
              Location villa Martinique avec piscine — tout ce qu'il faut savoir
            </h2>
            <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 16, padding: "4px 28px 16px" }}>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="gvp-faq-item">
                  <p className="gvp-faq-q">{item.q}</p>
                  <p className="gvp-faq-a">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Maillage interne guides ── */}
          <div style={{ marginBottom: 56 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 16px" }}>
              Explorer depuis votre villa
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { href: "/guide-sainte-anne", label: "Guide Sainte-Anne & Les Salines", desc: "La plus belle plage des Caraïbes — à 20 min de nos villas" },
                { href: "/guide-arlet",       label: "Guide Anses d'Arlet",              desc: "Nager avec les tortues marines — garanti tôt le matin" },
                { href: "/guide-le-diamant",  label: "Guide Le Diamant",                 desc: "Plongée et coucher de soleil face au Rocher mythique" },
                { href: "/activites-sainte-luce", label: "Activités à Sainte-Luce",     desc: "Distillerie Trois-Rivières, forêt de Montravail, plages secrètes" },
              ].map(link => (
                <a key={link.href} href={link.href} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10,
                  padding: "14px 18px", textDecoration: "none",
                }}>
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 2 }}>{link.label}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: TEXT, opacity: 0.75 }}>{link.desc}</div>
                  </div>
                  <span style={{ color: CORAL, fontSize: 18, flexShrink: 0, marginLeft: 12 }}>›</span>
                </a>
              ))}
            </div>
          </div>

          {/* ── CTA final ── */}
          <div className="gvp-cta-block">
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>
              Réservation directe · sans frais de service
            </p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 4vw, 34px)", letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px", lineHeight: 1.1 }}>
              Votre villa avec piscine<br />vous attend en Martinique
            </h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 16, maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
              Quatre propriétés avec piscine privée, à partir de 70 €/nuit. Réservez directement — vos hôtes vous répondent sous une heure sur WhatsApp.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/" style={{
                display: "inline-block", background: CORAL, color: "#fff",
                textDecoration: "none", padding: "16px 36px", borderRadius: 8,
                fontSize: 13, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase",
              }}>
                Voir toutes nos villas →
              </a>
              <a
                href="https://wa.me/33610880772"
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-block", background: "#25D366", color: "#fff",
                  textDecoration: "none", padding: "16px 32px", borderRadius: 8,
                  fontSize: 13, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase",
                }}
              >
                WhatsApp — on en parle
              </a>
            </div>
          </div>

          {/* ── Navigation inter-guides ── */}
          <nav className="gvp-nav" aria-label="Navigation guides Martinique">
            <a href="/guide-hub">← Tous les guides</a>
            <a href="/amaryllis">Villa Amaryllis</a>
            <a href="/guide-sainte-anne">Guide Sainte-Anne</a>
            <a href="/guide-arlet">Guide Arlet →</a>
          </nav>

        </div>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-villa-piscine" />
        </div>

        {/* ── Footer ── */}
        <footer style={{ background: NAVY, padding: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,0.4)", fontSize: 13, margin: 0, fontFamily: "'Jost', sans-serif" }}>
            © {new Date().getFullYear()} Amaryllis Locations ·{" "}
            <a href="/" style={{ color: "rgba(250,245,233,0.4)", textDecoration: "none" }}>villamaryllis.com</a>
            {" · "}
            <a href="/mentions-legales" style={{ color: "rgba(250,245,233,0.3)", textDecoration: "none" }}>Mentions légales</a>
          </p>
        </footer>

      </div>
    </>
  );
}
