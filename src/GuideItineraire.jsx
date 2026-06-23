// Page /guide-itineraire-une-semaine-sud-martinique — SEO TOFU itinéraire

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";
import ReadingProgressBar from "./components/ReadingProgressBar.jsx";
import BridgeVilla from "./components/BridgeVilla.jsx";
import GuideHero from "./components/GuideHero.jsx";
import GuideStickyNav from "./components/GuideStickyNav.jsx";
import EncartActivite from "./components/EncartActivite.jsx";
import LienAffilie from "./components/LienAffilie.jsx";
import { ACTIVITES } from "./data/activites.js";

const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8e0d0";
const MUTED = "#8a8070";
const GOLD  = "#d4a017";

const BASE = "https://villamaryllis.com";
const HERO_IMG = "/photos/martinique-panorama.jpg";

const JOURS = [
  {
    num: 1,
    titre: "Arrivée & premières saveurs",
    emoji: "✈️",
    couleur: CORAL,
    matin: "Atterrissage à Aimé-Césaire (Fort-de-France) en matinée. Récupérez votre voiture de location — indispensable pour toute la semaine. Route vers Sainte-Luce (~45 min), installation à la villa.",
    apresmidi: "Plage du Corps de Garde, à 10 minutes à pied : eaux calmes, sable doré, idéale pour décrocher. Première baignade. Goûtez un planteur au bar de plage.",
    soir: "Découverte du bourg de Sainte-Luce : quelques restaurants de poisson sur le front de mer. Incontournable : un rhum Trois-Rivières, distillé à 2 km de votre villa.",
    distance: "45 min depuis l'aéroport",
    tips: ["Location de voiture = réserver avant d'arriver (budget 40-60€/j)", "Supermarché Leader Price à Sainte-Luce pour le frigo du séjour", "Premiers planteurs à ne pas rater — les locaux les servent maison"],
  },
  {
    num: 2,
    titre: "Les Salines & Sainte-Anne",
    emoji: "🏖️",
    couleur: "#16a34a",
    matin: "Départ tôt pour les Salines (15 min) : la plage la plus emblématique de Martinique. Arrivez avant 10h pour avoir les palmiers pour vous seul. Eau turquoise, sable fin — prévoyez la matinée entière.",
    apresmidi: "Déjeuner à Sainte-Anne, charmant village au bord de l'eau. Essayez les accras de morue et le féroce d'avocat. Après le repas, Anse Michel (10 min) pour le snorkeling : fonds coralliens intacts.",
    soir: "Coucher de soleil au bord de l'eau à Sainte-Anne avant de rentrer. La lumière y est particulièrement belle en fin de journée.",
    distance: "15 min de Sainte-Luce",
    tips: ["Les Salines : stationnement payant en haute saison (2€), arrivez tôt", "Sainte-Anne = village piéton le week-end, préférez la semaine", "Anse Michel : masque de snorkeling conseillé (5€/j en location)"],
  },
  {
    num: 3,
    titre: "Le Diamant & la Savane",
    emoji: "💎",
    couleur: "#0ea5e9",
    matin: "Route vers Le Diamant (20 min). Promenade face au Rocher du Diamant, l'emblème de Martinique. Plage du Diamant : vagues et grand large, bonne pour la marche mais moins pour la baignade (courants). Café sur place avec vue imprenable.",
    apresmidi: "La Savane des Esclaves à Rivière-Pilote (15 min) : site culturel incontournable. Reconstitution d'un village d'esclaves du XVIIIe siècle, jardin créole, musée en plein air. Compter 1h30. Entrée ~10€/adulte.",
    soir: "Retour côté Diamant pour le coucher de soleil — le rocher prend des couleurs dorées. C'est l'un des plus beaux panoramas de la côte caraïbe.",
    distance: "20 min de Sainte-Luce",
    tips: ["La Savane des Esclaves : site privé, visite guidée recommandée", "Coucher de soleil Diamant = une heure avant (vérifier l'heure sur Google)", "Le rocher a servi de fort britannique au XVIIIe — histoire fascinante"],
  },
  {
    num: 4,
    titre: "Tortues & Grande Anse d'Arlet",
    emoji: "🐢",
    couleur: "#7c3aed",
    matin: "Grande excursion mer : Anses d'Arlet (25 min). Le village est l'un des plus photogéniques de Martinique. Plongée avec les tortues marines devant l'église — elles nagent à 2 mètres sous la surface, à 50 m du bord. Spectacle garanti.",
    apresmidi: "Déjeuner sur la plage directement depuis les barques de pêcheurs (poisson grillé, accras). Grande Anse, à 5 min, offre 1 km de sable noir volcanique et une mer calme idéale pour la sieste.",
    soir: "Apéro face à la mer avant le retour. Photographiez l'église d'Arlet au soleil couchant — carte postale assurée.",
    distance: "25 min de Sainte-Luce",
    tips: ["Tortues d'Arlet : visibles toute l'année, matin = moins de monde", "Grande Anse : sable sombre et eau chaude — très différent des Salines", "Parking payant au village (~3€), arrivez à pied depuis le bout de route"],
  },
  {
    num: 5,
    titre: "Route du Rhum & Habitation Clément",
    emoji: "🥃",
    couleur: GOLD,
    matin: "Journée dédiée au rhum agricole AOC Martinique. Départ pour la distillerie Trois-Rivières (10 min de Sainte-Luce) : visite gratuite du moulin et des chais. Dégustation de rhums blancs et vieux. Boutique excellente.",
    apresmidi: "Habitation Clément au François (35 min) : le domaine le plus complet de Martinique. Musée de l'Histoire créole, collections d'art contemporain dans les anciens bâtiments coloniaux, jardin botanique de 10 ha. Chef-d'œuvre architectural. Compter 2-3h.",
    soir: "Dîner dans l'un des restaurants de la côte atlantique au François — poisson et langouste avec vue sur les fonds blancs.",
    distance: "Trois-Rivières 10 min · Habitation Clément 35 min",
    tips: ["Trois-Rivières : visite + dégustation offerte, boutique excellente", "Clément : entrée ~15€/adulte, réservation en ligne recommandée", "Distillerie Saint-James (Sainte-Marie) en option pour les amateurs"],
  },
  {
    num: 6,
    titre: "Nord : Saint-Pierre & Montagne Pelée",
    emoji: "🌋",
    couleur: "#dc2626",
    matin: "Grande journée au Nord (1h15 depuis Sainte-Luce). Saint-Pierre, l'ancienne capitale de la Martinique, détruite par l'éruption de 1902. Musée du Volcan, ruines de l'opéra et du théâtre, épaves à plonger au large. Ville fantôme habitée — atmosphère unique.",
    apresmidi: "Montagne Pelée : montée jusqu'au refuge Estrade (départ Morne-Rouge). Randonnée 3h A/R, niveau moyen. Vue panoramique au-dessus des nuages si le temps est clair. Gorges de la Falaise (alternative douce) : randonnée aquatique dans les gorges avec canyoning guidé (~35€).",
    soir: "Retour via la côte caraïbe par Le Carbet et Le Marin — grande route côtière panoramique.",
    distance: "1h15 de Sainte-Luce",
    tips: ["Saint-Pierre : prévoir 2h minimum pour l'histoire et les ruines", "Pelée : démarrer à 7h pour éviter les nuages du milieu de journée", "Gorges de la Falaise : 3 km dans la rivière — prévoir claquettes fermées"],
  },
  {
    num: 7,
    titre: "Marina du Marin & Dernier Coucher de Soleil",
    emoji: "⛵",
    couleur: "#0891b2",
    matin: "Détente matinale — profitez du jardin ou de la piscine une dernière fois. Marché du Marin (samedi matin, 20 min) : épices, vanille, poissons, fruits exotiques. Meilleur marché alimentaire du Sud.",
    apresmidi: "Marina du Marin (20 min) : la plus grande marina des Antilles françaises. Promenade, déjeuner au bord de l'eau. Excursion optionnelle en catamaran (60-80€/pers) : fonds blancs du François ou Sainte-Anne. Réservation possible le matin même en basse saison.",
    soir: "Dernier coucher de soleil depuis la terrasse ou la plage de Sainte-Luce. Apéro planteur, préparation des valises. Départ le lendemain tôt.",
    distance: "Marin 20 min",
    tips: ["Marché du Marin : samedi matin uniquement, arriver à 8h", "Catamaran 1/2 journée : réserver la veille via les prestataires du Marin", "Dernière balade dans Sainte-Luce le soir — ambiance créole authentique"],
  },
];

const FAQ = [
  { q: "Combien de temps faut-il pour faire le tour du Sud Martinique ?", a: "Une semaine est idéale pour visiter le Sud sans se précipiter. 5 jours suffisent pour les essentiels (Salines, Diamant, Arlet, rhum). 10 jours permettent d'explorer aussi le Centre et le Nord." },
  { q: "Faut-il louer une voiture pour cet itinéraire ?", a: "Oui, la voiture est indispensable. Les transports en commun (minibus) couvrent les routes principales mais restent imprévisibles. Budget 40-60€/j selon la saison et le type de véhicule." },
  { q: "Peut-on faire la Montagne Pelée en famille ?", a: "La randonnée jusqu'au sommet est physique (3h A/R, 1200 m). Avec des enfants, préférez les Gorges de la Falaise (randonnée aquatique, accessible dès 8 ans) ou la forêt de Montravail (sentiers faciles)." },
  { q: "Cet itinéraire fonctionne-t-il en saison des pluies ?", a: "Oui, mais adaptez les journées selon la météo. Les averses tropicales sont courtes (20-30 min). Sainte-Pierre et la Savane des Esclaves fonctionnent par tous les temps. Évitez la Pelée en septembre-octobre." },
];

const css = `
  .gi-day-card {
    background: ${CREAM};
    border: 1px solid ${SAND};
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 32px;
  }
  .gi-day-header {
    padding: 24px 28px 20px;
    display: flex;
    align-items: flex-start;
    gap: 20px;
  }
  .gi-day-num {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${MUTED};
    margin-bottom: 4px;
  }
  .gi-day-title {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    font-size: clamp(20px, 3vw, 28px);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${NAVY};
    margin: 0;
    line-height: 1.1;
  }
  .gi-day-body {
    padding: 0 28px 24px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
  }
  .gi-slot {
    background: #fff;
    border: 1px solid ${SAND};
    border-radius: 10px;
    padding: 16px 18px;
  }
  .gi-slot-label {
    font-family: 'Jost', sans-serif;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: ${MUTED};
    margin-bottom: 8px;
  }
  .gi-slot-text {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 15px;
    line-height: 1.65;
    color: ${TEXT};
    margin: 0;
  }
  .gi-tips {
    padding: 0 28px 24px;
  }
  .gi-tips-title {
    font-family: 'Jost', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${CORAL};
    margin-bottom: 10px;
  }
  .gi-tip {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 6px;
  }
  .gi-tip-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${CORAL};
    flex-shrink: 0;
    margin-top: 7px;
  }
  .gi-tip-text {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    color: ${MUTED};
    line-height: 1.55;
  }
  .gi-section-label {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: ${CORAL};
    margin-bottom: 10px;
  }
  .gi-h2 {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    font-size: clamp(26px, 4vw, 38px);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${NAVY};
    margin: 0 0 32px;
    line-height: 1.1;
  }
  @media (max-width: 680px) {
    .gi-day-body { grid-template-columns: 1fr; }
    .gi-day-header { flex-direction: column; gap: 10px; }
  }
`;

export default function GuideItineraire() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Itinéraire 7 jours Martinique Sud — Programme jour par jour 2026"
        description="7 jours dans le Sud Martinique : notre programme détaillé jour par jour depuis Sainte-Luce. Plages, tortues, rhum, randonnée — le meilleur du Sud."
        canonical="/guide-itineraire-une-semaine-sud-martinique"
        image={HERO_IMG}
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Itinéraire 7 jours Martinique Sud — Programme jour par jour",
        "description": "7 jours dans le Sud Martinique : programme détaillé depuis Sainte-Luce. Plages, tortues, rhum, Pelée.",
        "url": `${BASE}/guide-itineraire-une-semaine-sud-martinique`,
        "image": HERO_IMG,
        "author": { "@type": "Organization", "name": "Résidence Amaryllis", "url": BASE },
        "publisher": { "@id": `${BASE}/#organization` },
        "datePublished": "2026-01-01",
        "dateModified": "2026-06-01",
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <ReadingProgressBar ctaHref="/" />
        <GuideStickyNav
          links={[
            { label: "Programme", href: "#programme" },
            { label: "Conseils", href: "#conseils" },
          ]}
        />

        <GuideHero
          img={HERO_IMG}
          alt="Vue panoramique Martinique Sud depuis Sainte-Luce"
          eyebrow="Itinéraire · 7 jours · Sud Martinique"
          title="Une semaine dans le Sud Martinique"
          subtitle="Programme jour par jour depuis Sainte-Luce — plages, tortues, rhum et couchers de soleil caraïbes."
          badges={[]}
          navBack={{ href: "/guide-hub", label: "Tous les guides" }}
        />

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* RÉCAPITULATIF */}
          <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, borderRadius: 16, padding: "32px 36px", marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, margin: "0 0 10px" }}>L'essentiel en un coup d'œil</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(17px, 2.3vw, 21px)", lineHeight: 1.75, color: IVORY, margin: "0 0 24px" }}>
              7 jours à partir de <strong style={{ color: CORAL }}>Sainte-Luce</strong>, camp de base idéal au cœur du Sud. Voiture indispensable. Aucun aller-retour inutile — les étapes sont organisées par proximité géographique.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Départ", val: "Sainte-Luce", icon: "📍" },
                { label: "Voiture", val: "Indispensable", icon: "🚗" },
                { label: "Budget excursions", val: "~60-100€/j", icon: "💶" },
                { label: "Rythme", val: "1 grande sortie/j", icon: "🗓️" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(250,245,233,0.07)", border: "1px solid rgba(250,245,233,0.12)", borderRadius: 10, padding: "12px 18px", minWidth: 120 }}>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,245,233,0.5)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 600, color: IVORY }}>{s.icon} {s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PROGRAMME JOURS */}
          <div id="programme" style={{ marginBottom: 16 }}>
            <p className="gi-section-label">Programme détaillé</p>
            <h2 className="gi-h2">7 jours, jour par jour</h2>
          </div>

          {JOURS.map(j => (
            <div key={j.num} className="gi-day-card">
              <div className="gi-day-header">
                <div style={{ fontSize: 36, lineHeight: 1 }}>{j.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div className="gi-day-num">Jour {j.num}</div>
                  <h3 className="gi-day-title">{j.titre}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: j.couleur }} />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED }}>{j.distance}</span>
                  </div>
                </div>
              </div>
              <div className="gi-day-body">
                <div className="gi-slot">
                  <div className="gi-slot-label">Matin</div>
                  <p className="gi-slot-text">{j.matin}</p>
                </div>
                <div className="gi-slot">
                  <div className="gi-slot-label">Après-midi</div>
                  <p className="gi-slot-text">{j.apresmidi}</p>
                </div>
                <div className="gi-slot">
                  <div className="gi-slot-label">Soir</div>
                  <p className="gi-slot-text">{j.soir}</p>
                </div>
              </div>
              <div className="gi-tips">
                <div className="gi-tips-title">Conseils pratiques</div>
                {j.tips.map((t, i) => (
                  <div key={i} className="gi-tip">
                    <div className="gi-tip-dot" />
                    <span className="gi-tip-text">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* CARTE DISTANCES */}
          <div id="conseils" style={{ background: `linear-gradient(135deg, #0a2e2d 0%, ${NAVY} 60%, #163f3e 100%)`, border: `1px solid rgba(196,114,84,0.3)`, borderRadius: 20, padding: "44px 40px", marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, margin: "0 0 12px" }}>Depuis Sainte-Luce</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3.5vw, 34px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 24px", lineHeight: 1.1 }}>
              Distances clés<br />tout est proche
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { lieu: "Aéroport Martinique", dist: "45 min", icon: "✈️" },
                { lieu: "Les Salines", dist: "15 min", icon: "🏖️" },
                { lieu: "Le Diamant", dist: "20 min", icon: "💎" },
                { lieu: "Anses d'Arlet", dist: "25 min", icon: "🐢" },
                { lieu: "Sainte-Anne", dist: "15 min", icon: "⛵" },
                { lieu: "Marina du Marin", dist: "20 min", icon: "🚢" },
                { lieu: "Habitation Clément", dist: "35 min", icon: "🥃" },
                { lieu: "Saint-Pierre", dist: "1h15", icon: "🌋" },
                { lieu: "Fort-de-France", dist: "40 min", icon: "🏙️" },
              ].map(d => (
                <div key={d.lieu} style={{ background: "rgba(250,245,233,0.05)", border: "1px solid rgba(250,245,233,0.08)", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{d.icon}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: IVORY, fontWeight: 500, marginBottom: 4 }}>{d.lieu}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 700, color: CORAL }}>{d.dist}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CONSEILS GÉNÉRAUX */}
          <div style={{ marginBottom: 64 }}>
            <p className="gi-section-label">Préparer son séjour</p>
            <h2 className="gi-h2">Ce qu'on conseille<br />à chaque voyageur</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { titre: "Réservez la voiture en amont", texte: "Les agences Martinique sont souvent à court de véhicules en haute saison (déc-avr, juil-août). Réservez 3-4 semaines avant depuis la métropole. Budget 40-60€/j pour une citadine.", icon: "🚗" },
                { titre: "Cash et carte Visa", texte: "La plupart des restaurants acceptent les cartes mais les petits stands de bord de route fonctionnent cash. Retirez 100-200€ à l'aéroport à l'arrivée.", icon: "💳" },
                { titre: "Crème solaire & moustique", texte: "L'UV Index dépasse 11 en saison. Crème indice 50 obligatoire. Répulsif anti-moustiques pour les sorties nature et les couchers de soleil — l'hivernage amplifie les risques.", icon: "☀️" },
                { titre: "Horaires locaux", texte: "La Martinique vit à son rythme. Certains restaurants ferment entre 14h et 19h, les marchés se terminent avant midi. Adaptez votre planning à ce rythme créole.", icon: "⏰" },
              ].map(c => (
                <div key={c.titre} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 14, padding: "24px 24px" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 600, color: NAVY, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>{c.titre}</div>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.7, color: TEXT, margin: 0 }}>{c.texte}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, marginBottom: 14 }}>Réservez votre base</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 4vw, 42px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 16px", lineHeight: 1.1 }}>
              Faites de Sainte-Luce<br />votre point de départ
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: MUTED, maxWidth: 480, margin: "0 auto 32px" }}>
              Piscine, jardin tropical, 10 min des Salines — le meilleur emplacement pour vivre cet itinéraire.
            </p>
            <a href="/" style={{
              display: "inline-block", padding: "15px 40px",
              background: NAVY, color: IVORY, borderRadius: 10,
              textDecoration: "none", fontFamily: "'Jost', sans-serif",
              fontSize: 13, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              Voir les disponibilités
            </a>
          </div>

        </div>

        {/* Réserver les excursions de l'itinéraire (affilié) */}
        <div style={{ maxWidth: 760, margin: "48px auto", padding: "0 24px" }}>
          <EncartActivite activites={[ACTIVITES.catamaran, ACTIVITES["diamant-bateau"]]} platform="viator" variant="navy" />
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, lineHeight: 1.7, color: "#3a2e22", marginTop: 24 }}>
            🚗 Cet itinéraire suppose une voiture de location — indispensable pour relier les plages et villages du Sud.
            Comparez les loueurs de l'aéroport avec <LienAffilie partenaire="discoverCars" utmContent="guide-itineraire-voiture" showDisclosure={false} style={{ display: "inline" }}>DiscoverCars</LienAffilie> (20–30 % moins cher en réservant à l'avance).
          </p>
        </div>

        <BridgeVilla
          villaId="amaryllis"
          lieu="le Sud Martinique"
          tempsRoute=""
          copy="Villa Amaryllis : votre base de séjour pour cet itinéraire. Sainte-Luce, piscine privée, à 15 min de toutes les grandes plages."
        />

        {/* FAQ */}
        <section style={{ maxWidth: 760, margin: "48px auto", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 30, color: NAVY, textAlign: "center", margin: "0 0 24px" }}>Questions fréquentes</h2>
          {FAQ.map((f, i) => (
            <details key={i} style={{ borderTop: `1px solid ${SAND}`, padding: "14px 0" }}>
              <summary style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 15, color: NAVY, cursor: "pointer" }}>{f.q}</summary>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: MUTED, lineHeight: 1.6, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </section>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-itineraire" />
        </div>

        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/", label: "Villas" },
              { href: "/sainte-luce-martinique", label: "Sainte-Luce" },
              { href: "/guide-sainte-anne", label: "Les Salines" },
              { href: "/meilleure-saison-martinique", label: "Quand partir" },
              { href: "/guide-budget-vacances-martinique", label: "Budget" },
              { href: "/guide-hub", label: "Explorer" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Résidence Amaryllis · Sainte-Luce, Martinique</p>
        </footer>

        <MaillageCluster currentSlug="guide-itineraire-une-semaine-sud-martinique" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
