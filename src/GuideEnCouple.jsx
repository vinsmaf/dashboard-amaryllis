// Guide Martinique en couple — /guide-martinique-en-couple-sud — SEO P0

import SEOMeta from "./SEOMeta.jsx";
import BridgeVilla from "./components/BridgeVilla.jsx";
import ReadingProgressBar from "./components/ReadingProgressBar.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8e0d0";
const MUTED = "#8a8070";
const GOLD  = "#d4a017";

const css = `
  .gc-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(14,59,58,0.08) 0%, rgba(14,59,58,0.06) 40%, rgba(14,59,58,0.90) 100%);
  }
  .gc-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(250,245,233,0.13); border: 1px solid rgba(250,245,233,0.25);
    border-radius: 100px; padding: 8px 16px;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
    color: rgba(250,245,233,0.9); letter-spacing: 0.04em; white-space: nowrap;
    backdrop-filter: blur(6px);
  }
  .gc-section { margin-bottom: 56px; }
  .gc-section-label {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px;
    letter-spacing: 0.35em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px;
  }
  .gc-section h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(26px, 4vw, 38px);
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 28px; line-height: 1.1;
  }
  .gc-prose {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(17px, 2.2vw, 20px); line-height: 1.85; color: ${TEXT}; max-width: 700px; margin-bottom: 32px;
  }
  .gc-highlight {
    background: linear-gradient(135deg, #0a2e2d 0%, #0e3b3a 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px; overflow: hidden; margin-bottom: 56px;
  }
  .gc-highlight-head { padding: 36px 40px 28px; border-bottom: 1px solid rgba(250,245,233,0.08); }
  .gc-highlight-body { padding: 32px 40px 40px; display: flex; flex-direction: column; gap: 20px; }
  .gc-hl-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 22px 26px;
  }
  .gc-hl-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 13px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .gc-hl-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }
  .gc-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 48px; }
  .gc-info { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 22px; }
  .gc-info-label { font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 6px; }
  .gc-info-value { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 400; color: ${NAVY}; line-height: 1.5; }
  .gc-resto { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 24px; margin-bottom: 12px; }
  .gc-resto-name { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: ${NAVY}; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; }
  .gc-resto-tag { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${CORAL}; background: rgba(196,114,84,0.1); border-radius: 8px; padding: 3px 8px; }
  .gc-resto p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; line-height: 1.7; color: ${MUTED}; margin: 0; }
  .gc-activite { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 24px; margin-bottom: 12px; display: flex; gap: 16px; align-items: flex-start; }
  .gc-activite-icon { font-size: 30px; line-height: 1; flex-shrink: 0; }
  .gc-activite-title { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: ${NAVY}; margin-bottom: 6px; }
  .gc-activite-text { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; line-height: 1.7; color: ${MUTED}; margin: 0; }
  .gc-villa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-bottom: 48px; }
  .gc-villa-card {
    background: #fff; border: 1px solid ${SAND}; border-radius: 16px; overflow: hidden;
    text-decoration: none; display: block; transition: transform 0.2s, box-shadow 0.2s;
  }
  .gc-villa-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(14,59,58,0.12); }
  .gc-villa-card img { width: 100%; height: 180px; object-fit: cover; display: block; }
  .gc-villa-card-body { padding: 18px 20px; }
  .gc-villa-card-body h3 { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: ${NAVY}; margin: 0 0 6px; }
  .gc-villa-card-body p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; line-height: 1.6; color: ${MUTED}; margin: 0 0 12px; }
  .gc-villa-card-cta { font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${CORAL}; }
  .gc-faq-item { border-bottom: 1px solid ${SAND}; padding: 24px 0; }
  .gc-faq-item:last-child { border-bottom: none; }
  .gc-faq-q { font-family: 'Jost', sans-serif; font-size: 16px; font-weight: 500; color: ${NAVY}; margin-bottom: 12px; }
  .gc-faq-a { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; line-height: 1.8; color: ${TEXT}; margin: 0; }
  .gc-sunset {
    background: linear-gradient(135deg, rgba(196,114,84,0.10) 0%, rgba(212,160,23,0.06) 100%);
    border: 1px solid rgba(196,114,84,0.2); border-radius: 16px; padding: 28px 32px; margin-bottom: 16px;
  }
  .gc-sunset-time { font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: ${GOLD}; margin-bottom: 8px; }
  .gc-sunset h4 { font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 500; color: ${NAVY}; margin: 0 0 8px; }
  .gc-sunset p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; line-height: 1.7; color: ${TEXT}; margin: 0; }
  @media (max-width: 640px) {
    .gc-highlight-head, .gc-highlight-body { padding: 24px 20px; }
    .gc-hl-item { padding: 18px 18px; }
    .gc-grid2 { grid-template-columns: 1fr; }
    .gc-villa-grid { grid-template-columns: 1fr; }
  }
`;

const villas = [
  {
    id: "mabouya",
    nom: "Mabouya",
    desc: "Studio privatif 2 personnes · Piscine partagée · Vue tropicale",
    photo: "https://villamaryllis.com/photos/mabouya/01.webp",
  },
  {
    id: "schoelcher",
    nom: "Schœlcher",
    desc: "2 personnes · Terrasse · Vue mer · Piscine partagée",
    photo: "https://villamaryllis.com/photos/schoelcher/01.webp",
  },
  {
    id: "zandoli",
    nom: "Zandoli",
    desc: "5 personnes · Piscine · Jardin tropical · Intimité",
    photo: "https://villamaryllis.com/photos/zandoli/01.webp",
  },
];

const couchers = [
  {
    lieu: "Rocher du Diamant",
    heure: "Coucher de soleil · 18h00–19h00",
    desc: "Face à la mer des Caraïbes, le Rocher du Diamant se teint d'orange et de pourpre au coucher du soleil. L'îlot emblématique se découpe sur un ciel flamboyant — l'un des spectacles les plus impressionnants de la Martinique. Accès direct depuis la plage du Diamant (12 km de Sainte-Luce, 15 min).",
  },
  {
    lieu: "Anse Cafard",
    heure: "Crépuscule · L'heure bleue",
    desc: "La plage de l'Anse Cafard, gardée par les silhouettes blanches du mémorial, offre un coucher de soleil d'une beauté poignante. Les derniers rayons glissent sur la mer Caraïbe, les statues regardent l'horizon — un moment suspendu, intime, inoubliable.",
  },
  {
    lieu: "Terrasse de la résidence Amaryllis",
    heure: "Chaque soir · Vue panoramique",
    desc: "Depuis la terrasse de nos villas, le soleil descend directement sur la mer des Caraïbes. Apéritif avec vue panoramique, ti' Punch ou cocktail maison, sans quitter votre logement. Le meilleur coucher de soleil est souvent celui du retour.",
  },
];

const restaurants = [
  {
    name: "La Chaudière",
    tag: "Romantique · Sainte-Luce",
    desc: "Tables en bord de mer, lumières tamisées, cuisine créole raffinée. Homard, langouste, filets de poissons nobles. L'adresse romantique de Sainte-Luce pour les occasions. Réservation conseillée.",
  },
  {
    name: "Totem — Les Trois-Îlets",
    tag: "Vue mer · Gastronomique",
    desc: "Restaurant gastronomique face au village des Trois-Îlets et la baie de Fort-de-France. Cuisine fusion créole-française, cave à rhum remarquable, service soigné. Idéal pour une grande occasion.",
  },
  {
    name: "La Villa Créole — Les Trois-Îlets",
    tag: "Ambiance · Classique",
    desc: "Institution romantique des Trois-Îlets depuis 1979. Jardin tropical éclairé aux bougies, musique créole, cuisine de saison. Un dîner à la Villa Créole reste dans les mémoires.",
  },
  {
    name: "Soirée à Fort-de-France",
    tag: "Ville · Vivante",
    desc: "Le centre de Fort-de-France propose des restaurants variés, bars à cocktails, clubs de jazz. La Savane (parc central) en soirée, le quartier Terres-Sainville pour les concerts — la capitale martiniquaise s'anime après 19h.",
  },
];

const activites = [
  {
    icon: "⛵",
    title: "Catamaran Marin → Les Saintes",
    desc: "Excursion romantique par excellence : navigation en catamaran depuis Le Marin (20 min de Sainte-Luce), cap sur l'archipel des Saintes. Eaux turquoise, baignade sauvage, déjeuner à bord. Demi-journée ou journée complète.",
  },
  {
    icon: "🤿",
    title: "Snorkeling avec les tortues — Anses d'Arlet",
    desc: "Les Anses d'Arlet sont réputées pour leurs tortues marines que l'on observe à 2 mètres de profondeur, au-dessus des herbiers. Une plongée en palmes-masque en tête-à-tête avec la faune tropicale — romantique et mémorable.",
  },
  {
    icon: "🥾",
    title: "Randonnée Presqu'île de la Caravelle",
    desc: "La Presqu'île de la Caravelle (côté atlantique, 45 min de Sainte-Luce) offre des panoramas sauvages sur l'Atlantique. Sentiers balisés entre mangroves, ruines du château Dubuc et falaises vertigineuses — compter 2 à 3h.",
  },
  {
    icon: "🚀",
    title: "Jet ski & sports nautiques",
    desc: "Location de jet ski, paddle, kayak de mer depuis Sainte-Luce ou Le Marin. Explorer la côte à deux, découvrir des criques secrètes inaccessibles à pied. Formules 30min à la demi-journée disponibles.",
  },
  {
    icon: "🍹",
    title: "Visite de la distillerie Trois-Rivières",
    desc: "La distillerie Trois-Rivières est à 5 minutes de la résidence. Visite des cuves, des champs de canne, dégustation de rhum agricole AOC Martinique. Le plus romantique des apéritifs antillais.",
  },
];

const spas = [
  {
    name: "Espace bien-être Hôtel Amyris — Sainte-Anne",
    desc: "Le spa de l'Hôtel Amyris propose massages en duo, soins du corps aux huiles tropicales, jacuzzi privatif. À 20 min de Sainte-Luce — disponible à la journée sans hébergement.",
  },
  {
    name: "L'Ilet Oscar — Les Trois-Îlets",
    desc: "Salon de massage et soins créoles à Les Trois-Îlets. Massages aux pierres chaudes, enveloppements au beurre de cacao, ambiance zen antillaise. Accès en ferry depuis Fort-de-France (30 min).",
  },
  {
    name: "Massages à domicile — prestataires locaux",
    desc: "Plusieurs masseurs indépendants proposent des prestations à domicile (villa ou résidence). Massages créoles, soins aux huiles essentielles tropicales. Vos hôtes peuvent vous recommander leurs prestataires de confiance.",
  },
];

const faqs = [
  {
    q: "Martinique en janvier ou juillet pour un séjour en couple ?",
    a: "Janvier est idéal : temps sec et ensoleillé, mer calme, pas de cyclones. Juillet offre un côté plus festif (Carnaval de saison) mais des averses tropicales ponctuelles. Les deux périodes sont romantiques — janvier est souvent préféré pour les lunes de miel.",
  },
  {
    q: "Quel budget moyen pour un séjour romantique en Martinique ?",
    a: "Comptez 150 à 250€/jour pour deux : logement (70 à 130€/nuit selon la villa), repas (30 à 80€/repas en restaurant), activités (50 à 150€ la sortie catamaran). Budget recommandé pour une semaine : 1 000 à 1 600€ tout compris hors vols.",
  },
  {
    q: "Y a-t-il des hôtels ou villas adaptés aux lunes de miel en Martinique ?",
    a: "La résidence Amaryllis est particulièrement appréciée des couples : studio Mabouya entièrement privatif, piscine, cadre tropical soigné, discrétion totale. Plusieurs couples nous choisissent pour leur lune de miel ou anniversaire de mariage.",
  },
  {
    q: "Peut-on trouver un séjour romantique pas cher en Martinique ?",
    a: "Oui. En réservant en direct (sans intermédiaire), les villas Amaryllis démarrent à 70€/nuit. Les plus beaux couchers de soleil, plages et snorkelings sont gratuits. Un séjour romantique au vrai prix antillais, sans commission OTA.",
  },
  {
    q: "Martinique : mer des Caraïbes ou Atlantique — quelle côte pour un couple ?",
    a: "La côte Caraïbe (sud et ouest) est la plus recommandée pour les couples : mer calme, eau translucide, couchers de soleil sur la mer. La côte Atlantique (nord-est) est plus sauvage et ventée — parfaite pour une randonnée, moins adaptée à la baignade.",
  },
];

export default function GuideEnCouple() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <ReadingProgressBar ctaHref="/" />
      <SEOMeta
        title="Martinique en couple — Guide romantique Sud 2026 | Sainte-Luce"
        description="Couchers de soleil sur la Caravelle, catamaran, restos de bord de mer : notre guide pour un séjour romantique dans le Sud Martinique."
        canonical="/guide-martinique-en-couple-sud"
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Martinique en couple — Guide romantique Sud 2026 | Sainte-Luce",
        "description": "Couchers de soleil sur la Caravelle, catamaran, restos de bord de mer : notre guide pour un séjour romantique dans le Sud Martinique.",
        "author": { "@type": "Organization", "name": "Amaryllis Locations", "url": "https://villamaryllis.com" },
        "publisher": { "@type": "Organization", "name": "Amaryllis Locations", "url": "https://villamaryllis.com" },
        "url": "https://villamaryllis.com/guide-martinique-en-couple-sud",
        "inLanguage": "fr",
        "about": { "@type": "TouristDestination", "name": "Sud Martinique" },
      }) }} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        {/* HERO */}
        <div style={{ position: "relative", height: "clamp(420px, 65vh, 680px)", overflow: "hidden", background: NAVY }}>
          <img
            src="/photos/sainte-luce.jpg"
            alt="Coucher de soleil romantique sur la mer des Caraïbes — Martinique"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div className="gc-hero-overlay" />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 40px 48px", maxWidth: 860, margin: "0 auto" }}>
            <a href="/guide-hub" style={{
              fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(250,245,233,0.6)", textDecoration: "none", display: "inline-block", marginBottom: 20,
            }}>← Tous les guides</a>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, margin: "0 0 14px" }}>Guide romantique · Sud Martinique</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(32px, 6vw, 64px)", letterSpacing: "0.05em", textTransform: "uppercase", color: IVORY, margin: "0 0 24px", lineHeight: 1.05 }}>
              Martinique<br />en couple
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }} className="gc-badges">
              {[
                { icon: "🌅", label: "Couchers de soleil Caraïbes" },
                { icon: "⛵", label: "Catamaran romantique" },
                { icon: "🍾", label: "Restaurants vue mer" },
                { icon: "🐢", label: "Snorkeling avec les tortues" },
                { icon: "💆", label: "Spa & bien-être" },
              ].map(b => (
                <span key={b.label} className="gc-badge">{b.icon} {b.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* INTRO */}
          <div className="gc-section">
            <p className="gc-section-label">Séjour romantique</p>
            <h2>Le Sud Martinique,<br />île romantique par excellence</h2>
            <p className="gc-prose">
              La Martinique est une destination de rêve pour les couples : eaux turquoise de la mer des Caraïbes, couchers de soleil spectaculaires sur le Rocher du Diamant, restaurants de bord de mer au charme antillais, villas intimes entourées de végétation tropicale. Le Sud de l'île concentre les plus beaux paysages et les meilleures adresses romantiques.
            </p>
            <p className="gc-prose">
              Sainte-Luce est le point de départ idéal : calme, préservée, entourée de criques sauvages, à 15 minutes du Diamant et 25 minutes des Salines. Depuis la résidence Amaryllis, les couchers de soleil sur la mer des Caraïbes se savourent chaque soir depuis votre terrasse privée.
            </p>
            <div className="gc-grid2">
              {[
                { label: "Idéal pour", value: "Couples, lunes de miel, anniversaires" },
                { label: "Ambiance", value: "Calme, intime, nature préservée" },
                { label: "Distance aéroport", value: "Aimé Césaire — 25 min en voiture" },
                { label: "Budget logement couple", value: "À partir de 70€/nuit (studio Mabouya)" },
                { label: "Meilleure période", value: "Déc – Avr (saison sèche · couchers de soleil)" },
                { label: "Moment romantique phare", value: "Coucher de soleil Diamant · Catamaran" },
              ].map(item => (
                <div key={item.label} className="gc-info">
                  <div className="gc-info-label">{item.label}</div>
                  <div className="gc-info-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* COUCHERS DE SOLEIL */}
          <div className="gc-section">
            <p className="gc-section-label">Moments inoubliables</p>
            <h2>Les plus beaux couchers<br />de soleil du Sud</h2>
            <p className="gc-prose">
              La mer des Caraïbes offre les couchers de soleil les plus spectaculaires de l'île : le soleil descend directement sur l'horizon, teignant le ciel de pourpre, d'orange et de rose. Voici nos trois spots secrets pour vivre ces instants en duo.
            </p>
            {couchers.map(item => (
              <div key={item.lieu} className="gc-sunset">
                <div className="gc-sunset-time">{item.heure}</div>
                <h4>{item.lieu}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* RESTAURANTS ROMANTIQUES */}
          <div className="gc-highlight">
            <div className="gc-highlight-head">
              <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Gastronomie</p>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "0.08em", textTransform: "uppercase", color: IVORY, margin: 0, lineHeight: 1.1 }}>
                Restaurants romantiques<br />du Sud Martinique
              </h2>
            </div>
            <div className="gc-highlight-body">
              {restaurants.map(item => (
                <div key={item.name} className="gc-hl-item">
                  <h4>{item.name} — <span style={{ fontWeight: 400, textTransform: "none" }}>{item.tag}</span></h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVITÉS EN DUO */}
          <div className="gc-section">
            <p className="gc-section-label">À faire en duo</p>
            <h2>Activités romantiques<br />en Martinique</h2>
            <p className="gc-prose">
              Le Sud Martinique est une invitation à l'aventure à deux. Voici les activités que nous recommandons à nos couples voyageurs — des sorties qui créent des souvenirs durables.
            </p>
            {activites.map(a => (
              <div key={a.title} className="gc-activite">
                <div className="gc-activite-icon">{a.icon}</div>
                <div>
                  <div className="gc-activite-title">{a.title}</div>
                  <p className="gc-activite-text">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* SPA & BIEN-ÊTRE */}
          <div className="gc-section">
            <p className="gc-section-label">Bien-être & relaxation</p>
            <h2>Spa &amp; massages<br />dans le Sud</h2>
            <p className="gc-prose">
              Après une journée sur l'eau ou en randonnée, l'île offre de belles adresses bien-être. Massages créoles aux huiles tropicales, soins en duo, jacuzzi privatif — quelques sélections pour compléter votre séjour romantique.
            </p>
            {spas.map(s => (
              <div key={s.name} className="gc-resto">
                <div className="gc-resto-name">
                  <span>{s.name}</span>
                </div>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* LOGEMENTS COUPLE */}
          <div className="gc-section">
            <p className="gc-section-label">Résidence Amaryllis — Sainte-Luce</p>
            <h2>Villas &amp; studios<br />pour un séjour en duo</h2>
            <p className="gc-prose">
              Nos villas à Sainte-Luce sont conçues pour l'intimité des couples. Chaque logement dispose d'une terrasse privative, d'une vue dégagée sur le jardin tropical ou la mer, et d'un accès direct à la piscine — dans une résidence calme et sécurisée.
            </p>
            <div className="gc-villa-grid">
              {villas.map(v => (
                <a key={v.id} href={`/${v.id}`} className="gc-villa-card">
                  <img src={v.photo} alt={`${v.nom} — villa couple à Sainte-Luce Martinique`} loading="lazy" />
                  <div className="gc-villa-card-body">
                    <h3>{v.nom}</h3>
                    <p>{v.desc}</p>
                    <div className="gc-villa-card-cta">Voir la villa →</div>
                  </div>
                </a>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <a href="/" style={{
                display: "inline-block", padding: "14px 36px",
                background: NAVY, color: IVORY, borderRadius: 10,
                textDecoration: "none", fontFamily: "'Jost', sans-serif",
                fontSize: 13, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Voir toutes les disponibilités
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="gc-section">
            <p className="gc-section-label">Questions fréquentes</p>
            <h2>Martinique en couple :<br />vos questions</h2>
            {faqs.map(item => (
              <div key={item.q} className="gc-faq-item">
                <div className="gc-faq-q">{item.q}</div>
                <p className="gc-faq-a">{item.a}</p>
              </div>
            ))}
          </div>

          {/* CTA FINAL */}
          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`,
            borderRadius: 20, padding: "52px 40px", textAlign: "center", marginBottom: 56,
          }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Réservation directe</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 4vw, 40px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 18px", lineHeight: 1.1 }}>
              Vivez votre Martinique<br />romantique
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>
              Studio privatif, piscine, couchers de soleil sur les Caraïbes — nos villas à Sainte-Luce accueillent les couples à partir de 70€ la nuit, en réservation directe sans frais.
            </p>
            <a href="/" style={{
              display: "inline-block", padding: "16px 42px",
              background: CORAL, color: IVORY, borderRadius: 10,
              textDecoration: "none", fontFamily: "'Jost', sans-serif",
              fontSize: 14, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              Voir les disponibilités
            </a>
          </div>

        </div>

        <BridgeVilla
          villaId="mabouya"
          lieu="le Sud Martinique"
          tempsRoute=""
          copy="Le studio privatif idéal pour un séjour en duo — Mabouya, piscine, vue tropicale, à Sainte-Luce."
        />

        <MaillageCluster currentSlug="guide-martinique-en-couple-sud" />

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm context="guide-en-couple" />
        </div>

        {/* FOOTER */}
        <div style={{ background: NAVY, padding: "32px 24px", textAlign: "center" }}>
          <a href="/" style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: "rgba(250,245,233,0.5)", textDecoration: "none", letterSpacing: "0.15em", textTransform: "uppercase" }}>← Retour à l'accueil</a>
        </div>

      </div>
    </>
  );
}
