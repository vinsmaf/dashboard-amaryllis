// Guide Martinique en famille — /guide-martinique-en-famille-sud — SEO P0

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
  .gf-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(14,59,58,0.10) 0%, rgba(14,59,58,0.08) 40%, rgba(14,59,58,0.88) 100%);
  }
  .gf-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(250,245,233,0.13); border: 1px solid rgba(250,245,233,0.25);
    border-radius: 100px; padding: 8px 16px;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
    color: rgba(250,245,233,0.9); letter-spacing: 0.04em; white-space: nowrap;
    backdrop-filter: blur(6px);
  }
  .gf-section { margin-bottom: 56px; }
  .gf-section-label {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px;
    letter-spacing: 0.35em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px;
  }
  .gf-section h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(26px, 4vw, 38px);
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 28px; line-height: 1.1;
  }
  .gf-prose {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(17px, 2.2vw, 20px); line-height: 1.85; color: ${TEXT}; max-width: 700px; margin-bottom: 32px;
  }
  .gf-highlight {
    background: linear-gradient(135deg, #0a2e2d 0%, #0e3b3a 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px; overflow: hidden; margin-bottom: 56px;
  }
  .gf-highlight-head { padding: 36px 40px 28px; border-bottom: 1px solid rgba(250,245,233,0.08); }
  .gf-highlight-body { padding: 32px 40px 40px; display: flex; flex-direction: column; gap: 20px; }
  .gf-hl-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 22px 26px;
  }
  .gf-hl-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 13px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .gf-hl-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }
  .gf-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 48px; }
  .gf-info { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 22px; }
  .gf-info-label { font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 6px; }
  .gf-info-value { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 400; color: ${NAVY}; line-height: 1.5; }
  .gf-activite { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 24px; margin-bottom: 12px; display: flex; gap: 16px; align-items: flex-start; }
  .gf-activite-icon { font-size: 30px; line-height: 1; flex-shrink: 0; }
  .gf-activite-title { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: ${NAVY}; margin-bottom: 6px; }
  .gf-activite-text { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; line-height: 1.7; color: ${MUTED}; margin: 0; }
  .gf-villa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-bottom: 48px; }
  .gf-villa-card {
    background: #fff; border: 1px solid ${SAND}; border-radius: 16px; overflow: hidden;
    text-decoration: none; display: block; transition: transform 0.2s, box-shadow 0.2s;
  }
  .gf-villa-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(14,59,58,0.12); }
  .gf-villa-card img { width: 100%; height: 180px; object-fit: cover; display: block; }
  .gf-villa-card-body { padding: 18px 20px; }
  .gf-villa-card-body h3 { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: ${NAVY}; margin: 0 0 6px; }
  .gf-villa-card-body p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; line-height: 1.6; color: ${MUTED}; margin: 0 0 12px; }
  .gf-villa-card-cta { font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${CORAL}; }
  .gf-faq-item { border-bottom: 1px solid ${SAND}; padding: 24px 0; }
  .gf-faq-item:last-child { border-bottom: none; }
  .gf-faq-q { font-family: 'Jost', sans-serif; font-size: 16px; font-weight: 500; color: ${NAVY}; margin-bottom: 12px; }
  .gf-faq-a { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; line-height: 1.8; color: ${TEXT}; margin: 0; }
  .gf-tip {
    background: linear-gradient(135deg, rgba(212,160,23,0.08) 0%, rgba(212,160,23,0.04) 100%);
    border: 1px solid rgba(212,160,23,0.25); border-radius: 12px; padding: 20px 24px; margin-bottom: 16px;
  }
  .gf-tip-label { font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: ${GOLD}; margin-bottom: 8px; }
  .gf-tip p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; line-height: 1.7; color: ${TEXT}; margin: 0; }
  @media (max-width: 640px) {
    .gf-highlight-head, .gf-highlight-body { padding: 24px 20px; }
    .gf-hl-item { padding: 18px 18px; }
    .gf-grid2 { grid-template-columns: 1fr; }
    .gf-villa-grid { grid-template-columns: 1fr; }
  }
`;

const villas = [
  {
    id: "zandoli",
    nom: "Zandoli",
    desc: "5 personnes · Piscine partagée · Jardin tropical",
    photo: "https://villamaryllis.com/photos/zandoli/01.webp",
  },
  {
    id: "geko",
    nom: "Géko",
    desc: "4 personnes · Piscine partagée · Cadre naturel",
    photo: "https://villamaryllis.com/photos/geko/01.webp",
  },
  {
    id: "amaryllis",
    nom: "Villa Amaryllis",
    desc: "8 personnes · Piscine privée · Vue mer panoramique",
    photo: "https://villamaryllis.com/photos/amaryllis/01.webp",
  },
];

const plages = [
  {
    name: "Plage des Salines (Sainte-Anne)",
    desc: "Régulièrement classée parmi les plus belles plages des Caraïbes. Eau translucide, sable poudré, cocotiers. Peu de vagues — parfaite pour les jeunes enfants. À 25 min de Sainte-Luce.",
  },
  {
    name: "Anse Corps de Garde",
    desc: "Plage abritée à seulement 10 minutes de la résidence Amaryllis. Eaux calmes peu profondes, idéales pour les bébés et les premiers bains. Quelques petits restaurants de bord de mer.",
  },
  {
    name: "Anse Michel",
    desc: "Crique sauvage entre Sainte-Luce et Le Marin. Sable fin, eau cristalline, très peu de monde en semaine. Les enfants adorent chasser les petits poissons dans les rochers.",
  },
  {
    name: "Plage du Gros Raisins (Sainte-Luce)",
    desc: "La plage principale de Sainte-Luce, à 5 minutes de la résidence. Lagon peu profond côté gauche, idéal pour les familles. Filet de volley, coin ombragé, accès facile en voiture.",
  },
];

const activites = [
  {
    icon: "🤿",
    title: "Snorkeling débutant aux Anses d'Arlet",
    desc: "Les Anses d'Arlet offrent l'un des snorkelings les plus accessibles de Martinique. Eau transparente, tortues marines en surface, coraux colorés — à partir de 6 ans avec palmes. Masques en location sur place (2-3€).",
  },
  {
    icon: "🌿",
    title: "Savane des Esclaves",
    desc: "Reconstitution d'un village martiniquais du XVIIIe siècle, entouré de nature tropicale. Les enfants adorent les cases, les animaux, les démonstrations de cuisine créole. À 20 min de Sainte-Luce.",
  },
  {
    icon: "🌸",
    title: "Jardin de la Balata",
    desc: "Jardin suspendu dans la forêt tropicale humide, ponts de lianes, fleurs de toutes les couleurs, perroquets. Visite de 1h30 à 2h, facilement accessible avec enfants. À 40 min.",
  },
  {
    icon: "🚤",
    title: "Bateau à fond de verre",
    desc: "Excursion idéale dès 3 ans : observer les fonds marins sans se mouiller, tortues, poissons tropicaux, coraux. Départs depuis Sainte-Luce et Le Marin (30 min). Durée 1h30.",
  },
  {
    icon: "🐢",
    title: "Observation des tortues marines",
    desc: "Les eaux de Sainte-Luce et des Anses d'Arlet abritent des tortues vertes et caouannes. En palmes-masque dès 7-8 ans, les enfants peuvent les observer de tout près. Sortie mémorable garantie.",
  },
  {
    icon: "🏖️",
    title: "Écomusée de la Martinique",
    desc: "À Anse Figuier, à 5 min de la résidence. Histoire créole, faune tropicale, jardins — accessible et ludique pour les 6-12 ans. Entrée enfants réduite.",
  },
];

const faqs = [
  {
    q: "La Martinique est-elle safe pour voyager avec des enfants ?",
    a: "Oui, tout à fait. La Martinique est un département français avec des infrastructures médicales solides, des plages surveillées en haute saison et un cadre de vie très familial. Sainte-Luce est une commune particulièrement calme et accueillante pour les familles.",
  },
  {
    q: "Quelle est la meilleure plage avec un bébé ou un tout-petit ?",
    a: "L'Anse Corps de Garde (10 min de la résidence) est la plus adaptée aux bébés : eau plate, peu profonde, sans courant. Les Salines à Sainte-Anne (25 min) est parfaite pour les enfants plus grands grâce à son lagon calme et son sable doux.",
  },
  {
    q: "À quelle distance se trouvent les plages depuis la résidence Amaryllis ?",
    a: "La plage du Gros Raisins est à 5 minutes en voiture. L'Anse Corps de Garde à 10 minutes. Les Salines de Sainte-Anne à 25 minutes. Toutes les plages du Sud Martinique sont accessibles en moins de 30 minutes.",
  },
  {
    q: "Faut-il louer une voiture avec des enfants en Martinique ?",
    a: "La voiture est indispensable en Martinique, surtout en famille. Les transports en commun sont limités. Louez dès l'aéroport (Aimé Césaire, 25 min de Sainte-Luce) — comptez 35 à 60€/jour selon le modèle. Les sièges bébé peuvent être réservés à l'avance.",
  },
  {
    q: "Quelle est la meilleure période pour un séjour en famille en Martinique ?",
    a: "La saison sèche (décembre à avril) est idéale : temps ensoleillé, mer calme, moins de moustiques. Les vacances de Noël, Pâques et les mois de juillet-août sont également populaires. Évitez septembre-octobre (pic de la saison cyclonique).",
  },
];

export default function GuideEnFamille() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <ReadingProgressBar ctaHref="/" />
      <SEOMeta
        title="Martinique en famille — Guide complet Sud 2026 | Sainte-Luce"
        description="Plages idéales, activités, logements adaptés : notre guide complet pour un séjour en famille dans le Sud Martinique. Nos villas à Sainte-Luce à partir de 70€/nuit."
        canonical="/guide-martinique-en-famille-sud"
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Martinique en famille — Guide complet Sud 2026 | Sainte-Luce",
        "description": "Plages idéales, activités, logements adaptés : notre guide complet pour un séjour en famille dans le Sud Martinique.",
        "author": { "@type": "Organization", "name": "Amaryllis Locations", "url": "https://villamaryllis.com" },
        "publisher": { "@type": "Organization", "name": "Amaryllis Locations", "url": "https://villamaryllis.com" },
        "url": "https://villamaryllis.com/guide-martinique-en-famille-sud",
        "inLanguage": "fr",
        "about": { "@type": "TouristDestination", "name": "Sud Martinique" },
      }) }} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        {/* HERO */}
        <div style={{ position: "relative", height: "clamp(420px, 65vh, 680px)", overflow: "hidden", background: NAVY }}>
          <img
            src="/photos/sainte-luce.jpg"
            alt="Famille sur une plage du Sud Martinique — Sainte-Luce"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div className="gf-hero-overlay" />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 40px 48px", maxWidth: 860, margin: "0 auto" }}>
            <a href="/guide-hub" style={{
              fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(250,245,233,0.6)", textDecoration: "none", display: "inline-block", marginBottom: 20,
            }}>← Tous les guides</a>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, margin: "0 0 14px" }}>Guide famille · Sud Martinique</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(32px, 6vw, 64px)", letterSpacing: "0.05em", textTransform: "uppercase", color: IVORY, margin: "0 0 24px", lineHeight: 1.05 }}>
              Martinique<br />en famille
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }} className="gf-badges">
              {[
                { icon: "🏖️", label: "Plages calmes pour enfants" },
                { icon: "🤿", label: "Snorkeling débutant" },
                { icon: "🐢", label: "Tortues marines" },
                { icon: "🌿", label: "Nature tropicale" },
                { icon: "🏊", label: "Piscine privée" },
              ].map(b => (
                <span key={b.label} className="gf-badge">{b.icon} {b.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* INTRO */}
          <div className="gf-section">
            <p className="gf-section-label">Le Sud Martinique en famille</p>
            <h2>Pourquoi le Sud<br />est idéal avec des enfants</h2>
            <p className="gf-prose">
              Le Sud Martinique réunit tout ce qu'une famille recherche pour des vacances réussies : des plages aux eaux calmes et peu profondes, des activités accessibles dès le plus jeune âge, un cadre naturel exceptionnel et des logements adaptés à toutes les configurations familiales. Sainte-Luce, commune balnéaire à 25 minutes de l'aéroport, est souvent citée comme le meilleur point de chute famille de l'île.
            </p>
            <p className="gf-prose">
              Contrairement au nord de l'île, plus montagneux et accidenté, le Sud offre des routes faciles, des commodités proches (supermarchés, pharmacies, médecin) et une succession de plages accessibles en voiture en moins de 30 minutes. Les enfants découvrent les tortues marines, le snorkeling en eaux translucides, les jardins tropicaux — souvenirs garantis pour longtemps.
            </p>
            <div className="gf-grid2">
              {[
                { label: "Idéal pour", value: "Familles avec enfants de 0 à 14 ans" },
                { label: "Plage la plus proche", value: "Corps de Garde — 10 min de la résidence" },
                { label: "Distance aéroport", value: "Aimé Césaire — 25 min en voiture" },
                { label: "Budget logement", value: "À partir de 70€/nuit (Mabouya, 2p)" },
                { label: "Meilleure période", value: "Déc – Avr (saison sèche) · Jul – Août" },
                { label: "Activité phare enfants", value: "Snorkeling tortues · Bateau fond de verre" },
              ].map(item => (
                <div key={item.label} className="gf-info">
                  <div className="gf-info-label">{item.label}</div>
                  <div className="gf-info-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PLAGES */}
          <div className="gf-highlight">
            <div className="gf-highlight-head">
              <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Sélection famille</p>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "0.08em", textTransform: "uppercase", color: IVORY, margin: 0, lineHeight: 1.1 }}>
                Les plages tranquilles<br />pour les enfants
              </h2>
            </div>
            <div className="gf-highlight-body">
              {plages.map(item => (
                <div key={item.name} className="gf-hl-item">
                  <h4>{item.name}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVITÉS */}
          <div className="gf-section">
            <p className="gf-section-label">À faire en famille</p>
            <h2>Activités adaptées<br />aux enfants</h2>
            <p className="gf-prose">
              Le Sud Martinique regorge d'activités pensées pour les familles. Des excursions en bateau accessibles dès 3 ans aux balades en forêt tropicale, chaque âge trouvera son bonheur. Voici notre sélection d'incontournables famille.
            </p>
            {activites.map(a => (
              <div key={a.title} className="gf-activite">
                <div className="gf-activite-icon">{a.icon}</div>
                <div>
                  <div className="gf-activite-title">{a.title}</div>
                  <p className="gf-activite-text">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* LOGEMENTS */}
          <div className="gf-section">
            <p className="gf-section-label">Résidence Amaryllis — Sainte-Luce</p>
            <h2>Logements famille<br />avec piscine à Sainte-Luce</h2>
            <p className="gf-prose">
              Nos villas sont idéalement situées à Sainte-Luce, au sein de la résidence Amaryllis. Piscine privée ou partagée, terrasse tropicale, jardin sécurisé — tout est pensé pour que parents et enfants profitent pleinement de leurs vacances.
            </p>
            <div className="gf-villa-grid">
              {villas.map(v => (
                <a key={v.id} href={`/${v.id}`} className="gf-villa-card">
                  <img src={v.photo} alt={`${v.nom} — villa famille à Sainte-Luce Martinique`} loading="lazy" />
                  <div className="gf-villa-card-body">
                    <h3>{v.nom}</h3>
                    <p>{v.desc}</p>
                    <div className="gf-villa-card-cta">Voir la villa →</div>
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

          {/* PRATIQUE FAMILLE */}
          <div className="gf-section">
            <p className="gf-section-label">Conseils pratiques</p>
            <h2>Voyager en famille<br />en Martinique</h2>
            <p className="gf-prose">
              La Martinique est une destination très accessible pour les familles. Quelques conseils de vos hôtes sur place pour profiter au maximum de votre séjour.
            </p>
            <div className="gf-tip">
              <div className="gf-tip-label">Voiture indispensable</div>
              <p>La voiture est le moyen de transport incontournable en famille. Réservez dès l'aéroport Aimé Césaire (25 min de Sainte-Luce) — les agences Europcar, Hertz et des loueurs locaux compétitifs sont sur place. Prévoyez un siège auto si nécessaire, à réserver à l'avance.</p>
            </div>
            <div className="gf-tip">
              <div className="gf-tip-label">Crème solaire bio obligatoire</div>
              <p>Les récifs coralliens de Martinique sont protégés. Utilisez des crèmes solaires sans oxybenzonne ni octinoxate (biodégradables). Marques Altapharma, Sun Secure Bio, Biore UV disponibles en pharmacie sur place. Le soleil antillais est fort — SPF 50+ pour les enfants.</p>
            </div>
            <div className="gf-tip">
              <div className="gf-tip-label">Moustiques & précautions</div>
              <p>La Martinique peut connaître des épisodes de dengue. Équipez-vous en répulsifs (DEET ou Icaridine pour enfants de plus de 2 ans). Les logements Amaryllis disposent de moustiquaires. Évitez les mares d'eau stagnante à proximité des zones habitées.</p>
            </div>
            <div className="gf-grid2" style={{ marginTop: 24 }}>
              {[
                { label: "Supermarché", value: "Leader Price & Carrefour Market — 5 min de la résidence" },
                { label: "Pédiatre / médecin", value: "Cabinet médical au bourg de Sainte-Luce" },
                { label: "Urgences", value: "Hôpital de Rivière-Pilote — 15 min" },
                { label: "Pharmacie", value: "Au bourg de Sainte-Luce · Ouverte lundi–samedi" },
              ].map(item => (
                <div key={item.label} className="gf-info">
                  <div className="gf-info-label">{item.label}</div>
                  <div className="gf-info-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="gf-section">
            <p className="gf-section-label">Questions fréquentes</p>
            <h2>Martinique en famille :<br />vos questions</h2>
            {faqs.map(item => (
              <div key={item.q} className="gf-faq-item">
                <div className="gf-faq-q">{item.q}</div>
                <p className="gf-faq-a">{item.a}</p>
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
              Votre famille mérite<br />le meilleur de la Martinique
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>
              Piscine privée, jardin tropical, terrasse vue mer — nos villas à Sainte-Luce accueillent les familles de 2 à 8 personnes, à partir de 70€ la nuit.
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
          villaId="zandoli"
          lieu="le Sud Martinique"
          tempsRoute=""
          copy="La résidence parfaite pour votre famille : Zandoli (5 personnes) ou villa Amaryllis (8 personnes), piscine privée, à Sainte-Luce."
        />

        <MaillageCluster currentSlug="guide-martinique-en-famille-sud" />

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm context="guide-en-famille" />
        </div>

        {/* FOOTER */}
        <div style={{ background: NAVY, padding: "32px 24px", textAlign: "center" }}>
          <a href="/" style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: "rgba(250,245,233,0.5)", textDecoration: "none", letterSpacing: "0.15em", textTransform: "uppercase" }}>← Retour à l'accueil</a>
        </div>

      </div>
    </>
  );
}
