// Guide Sainte-Anne Martinique — /guide-sainte-anne — v2 immersif

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";
import ReadingProgressBar from "./components/ReadingProgressBar.jsx";
import GuideHero from "./components/GuideHero.jsx";
import GuideStickyNav from "./components/GuideStickyNav.jsx";
import BridgeVilla from "./components/BridgeVilla.jsx";
import ProgrammeSejour from "./components/ProgrammeSejour.jsx";

// Noms canoniques des biens pour le maillage interne SEO ("villa" = Amaryllis + Iguana uniquement).
const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };
import WikiImg from "./WikiImg.jsx";
import BlocAffilie from "./components/BlocAffilie.jsx";
import EncartActivite from "./components/EncartActivite.jsx";
import { ACTIVITES } from "./data/activites.js";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG = "/photos/sainte-anne.jpg";

const badges = [
  { icon: "🏖️", label: "Plus belle plage des Caraïbes" },
  { icon: "📍", label: "20 min de Sainte-Luce" },
  { icon: "⛵", label: "Catamaran aux îlets" },
  { icon: "🪁", label: "Kitesurf & windsurf" },
  { icon: "🤿", label: "Snorkeling & tortues" },
];

const css = `
  .gs-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(250,245,233,0.13); border: 1px solid rgba(250,245,233,0.25);
    border-radius: 100px; padding: 8px 16px;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
    color: rgba(250,245,233,0.9); letter-spacing: 0.04em; white-space: nowrap;
    backdrop-filter: blur(6px);
  }
  .gs-badge.must { background: rgba(196,114,84,0.3); border-color: rgba(196,114,84,0.6); font-weight: 600; }

  .gs-must {
    background: linear-gradient(135deg, #0a2e2d 0%, #0e3b3a 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px; overflow: hidden; margin-bottom: 64px;
  }
  .gs-must-head { padding: 36px 40px 28px; border-bottom: 1px solid rgba(250,245,233,0.08); }
  .gs-must-body { padding: 32px 40px 40px; display: flex; flex-direction: column; gap: 20px; }
  .gs-must-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 22px 26px;
  }
  .gs-must-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 13px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .gs-must-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }

  .gs-section { margin-bottom: 56px; }
  .gs-card { background: #fff; border: 1px solid ${SAND}; border-radius: 14px; overflow: hidden; margin-bottom: 16px; }
  .gs-card img { width: 100%; height: 240px; object-fit: cover; display: block; }
  .gs-card-body { padding: 24px 28px; }
  .gs-card-body h3 { font-family: 'Jost', sans-serif; font-weight: 500; font-size: 15px; color: ${NAVY}; margin: 0 0 10px; letter-spacing: 0.04em; }
  .gs-card-body p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; line-height: 1.75; color: ${TEXT}; margin: 0; }

  .gs-day {
    background: linear-gradient(135deg, ${CREAM} 0%, #ede5d4 100%);
    border: 1px solid ${SAND}; border-radius: 16px; padding: 32px 36px; margin-bottom: 56px;
  }
  .gs-day-steps { display: flex; flex-direction: column; gap: 0; margin-top: 20px; }
  .gs-day-step { display: flex; gap: 18px; align-items: flex-start; padding: 16px 0; border-bottom: 1px solid rgba(232,220,200,0.6); }
  .gs-day-step:last-child { border-bottom: none; padding-bottom: 0; }
  .gs-day-time { font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; color: ${CORAL}; min-width: 52px; padding-top: 3px; text-transform: uppercase; }
  .gs-day-text { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; line-height: 1.65; color: ${TEXT}; }

  .gs-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 48px; }
  .gs-info { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 22px; }
  .gs-info-label { font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 6px; }
  .gs-info-value { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 400; color: ${NAVY}; line-height: 1.5; }

  @media (max-width: 640px) {
    .gs-must-head, .gs-must-body { padding: 24px 20px; }
    .gs-must-item { padding: 18px 18px; }
    .gs-grid2 { grid-template-columns: 1fr; }
    .gs-day { padding: 24px 20px; }
    .gs-card img { height: 180px; }
    .gs-badges { gap: 8px !important; }
    .gs-badge { font-size: 11px; padding: 7px 12px; }
  }
`;

export default function GuideSainteAnne() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
<SEOMeta title="Sainte-Anne Martinique — Les Salines | Amaryllis" description="Guide Sainte-Anne depuis Sainte-Luce (20 min) : Les Salines avant 9h, kitesurf, catamaran, restaurants créoles. La plage incontournable du Sud Martinique." canonical="/guide-sainte-anne" image="https://villamaryllis.com/photos/amaryllis/01.webp" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Guide Sainte-Anne Martinique : Les Salines, kitesurf et catamaran",
        "description": "La Grande Anse des Salines, plus belle plage des Caraïbes. Kitesurf, catamaran aux îlets, restaurants créoles. À 20 min de Sainte-Luce.",
        "url": `${BASE}/guide-sainte-anne`,
        "image": HERO_IMG,
        "author": { "@id": `${BASE}/#organization` },
        "publisher": { "@id": `${BASE}/#organization` },
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <ReadingProgressBar ctaHref="/" />
        <GuideStickyNav
          links={[
            { label: "Spots", href: "#spots" },
            { label: "Activités", href: "#activites" },
            { label: "Programme", href: "#programme" },
          ]}
        />

        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <a href="/guide-hub" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.6 }}>Explorer Martinique</a>
              <a href="/guide-hub" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.7 }}>← Tous les guides</a>
            </div>
          </div>
        </header>

        <GuideHero
          img={HERO_IMG}
          alt="Grande Anse des Salines, Sainte-Anne, Martinique"
          eyebrow="Guide de voyage · Résidence Amaryllis"
          title="Sainte-Anne & Les Salines"
          subtitle="La plus belle plage des Caraïbes. Les îlets turquoise. Le meilleur kitesurf des Antilles. À 20 minutes de nos villas."
          badges={badges}
        />

        <div id="spots" style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 80px" }}>

          {/* MUST ABSOLU — LES SALINES */}
          <div className="gs-must">
            <div className="gs-must-head">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 32 }}>🏖️</span>
                <span style={{ background: CORAL, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100 }}>Must absolu</span>
              </div>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 4vw, 34px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 14px", lineHeight: 1.15 }}>
                Grande Anse des Salines
              </h2>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, lineHeight: 1.65, color: "rgba(250,245,233,0.75)", margin: 0, fontStyle: "italic" }}>
                Sable blanc poudreux, cocotiers sur l'eau, mer turquoise — classée parmi les dix plus belles plages du monde.
              </p>
            </div>
            <div className="gs-must-body">
              {[
                { titre: "Pourquoi c'est unique", texte: "Les Salines combinent tout ce qu'on cherche : sable immaculé à grain très fin, cocotiers inclinés sur l'eau qui donnent cette silhouette si photographiée, lagon naturellement calme grâce à l'Îlet Cabrit qui brise les vagues. L'eau est turquoise et chaude toute l'année. C'est objectivement l'une des plus belles plages des Caraïbes — et c'est à 20 minutes de nos villas." },
                { titre: "Arrivez avant 9h — impératif", texte: "En juillet-août et pendant les fêtes, la plage est bondée dès 10h. Arrivez au lever du soleil : vous avez la plage pour vous seul pendant 1 à 2 heures. La lumière du matin sur les cocotiers est aussi incomparable pour les photos. Parking gratuit à cette heure-là — il sera plein à 9h30 en haute saison." },
                { titre: "Le lagon et l'Îlet Cabrit", texte: "Entre la plage et l'Îlet Cabrit (500 m au large), un lagon peu profond regorge de poissons tropicaux, raies et tortues. L'eau y est encore plus calme qu'en plage ouverte. Location de masque/tuba à l'entrée de la plage (5€). En catamaran depuis le Marin, vous pouvez y déjeuner à bord avec barbecue les pieds dans l'eau." },
              ].map(item => (
                <div key={item.titre} className="gs-must-item">
                  <h4>{item.titre}</h4>
                  <p>{item.texte}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="activites">
            <EncartActivite activites={[ACTIVITES.tortues]} />
          </div>

          {/* JOURNÉE IDÉALE */}
          <div className="gs-day">
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 6px" }}>Programme</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 24, letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: 0 }}>La journée idéale</h2>
            <div className="gs-day-steps">
              {[
                { time: "7h00", text: "Départ de Sainte-Luce — 20 min sur la N6 vers Sainte-Anne. La route longe la côte caraïbe." },
                { time: "7h30", text: "Arrivée aux Salines — plage vide, lumière dorée, parking gratuit. Baignade et photos." },
                { time: "10h00", text: "Snorkeling dans le lagon côté Îlet Cabrit — poissons tropicaux et tortues." },
                { time: "12h30", text: "Déjeuner au bourg de Sainte-Anne — poisson grillé au Bakoua ou snacks créoles à l'entrée des Salines." },
                { time: "14h30", text: "Kitesurf à la pointe des Salines (cours débutants) — ou catamaran depuis le Marin pour les îlets du Sud." },
                { time: "17h30", text: "Retour via Le Diamant pour le coucher de soleil face au Rocher. Cocktail de bienvenue à la villa." },
              ].map(step => (
                <div key={step.time} className="gs-day-step">
                  <div className="gs-day-time">{step.time}</div>
                  <div className="gs-day-text">{step.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AUTRES PLAGES */}
          <EncartActivite activites={[ACTIVITES.snorkeling]} />
          <div className="gs-section">
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <span>🌊</span><span>Les autres plages</span>
            </h2>
            {[
              { nom: "Plage du bourg de Sainte-Anne", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Grande_Anse_des_Salines_%28Sainte-Anne%2C_Martinique%29_-_01.jpg/960px-Grande_Anse_des_Salines_%28Sainte-Anne%2C_Martinique%29_-_01.jpg", texte: "Plage familiale en plein cœur du village. Transats, restaurants de plage, artisans locaux. Eau calme protégée. Idéale pour un après-midi détendu avec enfants, à deux pas des boutiques." },
              { nom: "Anse Meunier — la plage secrète", img: null, texte: "Accessible à pied depuis les Salines (15 min). Peu connue des touristes, eau cristalline, rochers et végétation tropicale. Le coin idéal pour ceux qui fuient la foule — même en haute saison." },
            ].map(item => (
              <div key={item.nom} className="gs-card">
                {item.img && <WikiImg src={item.img} alt={item.nom} loading="lazy" />}
                <div className="gs-card-body">
                  <h3>{item.nom}</h3>
                  <p>{item.texte}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ACTIVITÉS NAUTIQUES */}
          <div className="gs-section">
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <span>⛵</span><span>Activités nautiques</span>
            </h2>
            {[
              { nom: "Catamaran aux îlets du Sud — l'excursion incontournable", texte: "Journée complète depuis le Marin ou Sainte-Anne. Snorkeling sur les îlets préservés, déjeuner barbecue à bord, baignade dans des criques turquoise inaccessibles par la route. 80–100€/personne. Réservation recommandée 48h à l'avance en haute saison." },
              { nom: "Kitesurf & windsurf — spot de référence", texte: "La pointe des Salines est l'un des meilleurs spots de kitesurf des Antilles grâce aux alizés constants et réguliers. Écoles sur place pour débutants (stage 3 jours ~350€), location de matériel pour confirmés. Vent garanti de décembre à mai." },
            ].map(item => (
              <div key={item.nom} className="gs-card">
                <div className="gs-card-body">
                  <h3>{item.nom}</h3>
                  <p>{item.texte}</p>
                </div>
              </div>
            ))}
          </div>

          <EncartActivite activites={[ACTIVITES.catamaran, ACTIVITES.dauphins]} />

          {/* OÙ MANGER */}
          <EncartActivite activites={[ACTIVITES["diamant-bateau"]]} platform="gyg" />
          <div className="gs-section">
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <span>🍽️</span><span>Où manger</span>
            </h2>
            {[
              { nom: "Le Bakoua — institution locale", texte: "Sur la plage du bourg. Poisson du jour grillé au feu de bois, rhum arrangé maison, ambiance créole typique. Déjeuner en terrasse les pieds dans le sable. Prix raisonnables, qualité constante." },
              { nom: "Les Tamariniers — gastronomie créole", texte: "Restaurant gastronomique avec terrasse vue mer. Cuisine raffinée mêlant saveurs locales et techniques modernes. Idéal pour un dîner en amoureux. Réservation impérative." },
              { nom: "Snacks des Salines", texte: "À l'entrée de la plage des Salines, plusieurs snacks créoles proposent accras, brochettes et jus de coco frais. Déjeuner typique à 12-15€, idéal entre deux baignades." },
            ].map(item => (
              <div key={item.nom} className="gs-card">
                <div className="gs-card-body">
                  <h3>{item.nom}</h3>
                  <p>{item.texte}</p>
                </div>
              </div>
            ))}
          </div>

          {/* INFOS PRATIQUES */}
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 20 }}>
            🗓️ Infos pratiques
          </h2>
          <div className="gs-grid2">
            {[
              { label: "Depuis Sainte-Luce", value: "20 min — N6 direction Sainte-Anne, côte caraïbe" },
              { label: "Meilleur moment", value: "7h–9h pour les Salines · Après-midi pour les activités nautiques" },
              { label: "Parking Salines", value: "Gratuit le matin · Payant à partir de 9h30 en haute saison (2€)" },
              { label: "Catamaran", value: "Réservez 48h à l'avance · Départ depuis Le Marin (15 min)" },
            ].map(item => (
              <div key={item.label} className="gs-info">
                <div className="gs-info-label">{item.label}</div>
                <div className="gs-info-value">{item.value}</div>
              </div>
            ))}
          </div>

          <BridgeVilla
  villaId="amaryllis"
  lieu="Sainte-Anne / Les Salines"
  tempsRoute="25-30 min"
  copy="Organisez ces journées depuis la Villa Amaryllis, à Sainte-Luce : 25 à 30 minutes des Salines, piscine à débordement face à la mer pour rentrer se rafraîchir après la plage. Réservez en direct, sans frais d'intermédiaire."
/>
          <div id="programme">
          <ProgrammeSejour
  jours={[
    {
      jour: "Jour 1",
      titre: "Les Salines au lever du jour",
      matin: "Départ de Sainte-Luce vers 7h (25 à 30 min par la N6). Arrivée aux Salines avant la foule : plage déserte, lumière dorée, baignade et photos. Snorkeling dans le lagon côté Îlet Cabrit (poissons tropicaux, raies, parfois tortues).",
      apresMidi: "Déjeuner au bourg de Sainte-Anne (poisson grillé au Bakoua) puis sortie snorkeling encadrée pour explorer les plus beaux fonds en toute sécurité.",
      soir: "Retour par Le Diamant pour le coucher de soleil face au Rocher, cocktail à la villa.",
    },
    {
      jour: "Jour 2",
      titre: "Le Sud vu de la mer",
      matin: "Embarquement pour une sortie bateau Rocher du Diamant & Salines : approche du Rocher mythique, baignade et snorkeling dans des criques inaccessibles par la route.",
      apresMidi: "Retour à la pointe des Salines pour une initiation kitesurf (alizés réguliers de décembre à mai) ou détente à l'Anse Meunier, la plage secrète à 15 min à pied des Salines.",
      soir: "Dîner créole aux Tamariniers, terrasse vue mer.",
    },
  ]}
/>
          </div>

          {/* MAILLAGE VILLAS */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 16px" }}>Nos villas à 20 min de Sainte-Anne</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "amaryllis", name: "Villa Amaryllis", desc: "Piscine à débordement · Vue mer · Jacuzzi · 8 personnes · À partir de 280€/nuit" },
                { id: "zandoli",   name: "Zandoli",         desc: "Piscine privée · Vue mer · Jardin tropical · 5 personnes · À partir de 110€/nuit" },
                { id: "geko",      name: "Géko",            desc: "Piscine privée · Jardin tropical · 4 personnes · À partir de 110€/nuit" },
                { id: "mabouya",   name: "Mabouya",         desc: "Jacuzzi privatif · Vue mer · Romantique · 2 personnes · À partir de 70€/nuit" },
              ].map(v => (
                <a key={v.id} href={`/${v.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10, padding: "14px 18px", textDecoration: "none" }}>
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 2 }}>{v.name}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: TEXT, opacity: 0.75 }}>{v.desc}</div>
                  </div>
                  <span style={{ color: CORAL, fontSize: 18, flexShrink: 0, marginLeft: 12 }}>›</span>
                </a>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ background: NAVY, borderRadius: 20, padding: "44px 36px", textAlign: "center", marginBottom: 40 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>Base idéale pour le sud</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px" }}>Nos villas à Sainte-Luce</h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 15, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              À 20 min des Salines, 15 min du Diamant, 25 min d'Arlet. Piscine privée, vue mer, réservation directe sans frais.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "15px 36px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>Voir toutes nos villas</a>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/guide-le-diamant" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>← Guide Le Diamant</a>
            <a href="/guide-hub"            style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>Tous les guides</a>
            <a href="/guide-arlet"      style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>Guide Arlet →</a>
          </div>
        </div>

                <BlocAffilie slug="sainte-anne" />
        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-sainte-anne" />
        </div>

        <div style={{ background: NAVY, padding: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,0.4)", fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,0.4)", textDecoration: "none" }}>villamaryllis.com</a>
            {" · "}
            <span style={{ fontSize: 11, opacity: 0.7 }}>Photos © Wikimedia Commons (CC BY-SA)</span>
          </p>
        </div>
        <MaillageCluster currentSlug="guide-sainte-anne" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
