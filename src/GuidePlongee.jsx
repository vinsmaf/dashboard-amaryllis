// Guide Plongée & Snorkeling Martinique — /guide-plongee-martinique
// Design immersif v2 — épaves, tortues, fonds marins

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";
import BlocAffilie from "./components/BlocAffilie.jsx";
import ReadingProgressBar from "./components/ReadingProgressBar.jsx";
import BridgeVilla from "./components/BridgeVilla.jsx";
import EncartActivite from "./components/EncartActivite.jsx";
import { ACTIVITES } from "./data/activites.js";
import GuideHero from "./components/GuideHero.jsx";
import GuideStickyNav from "./components/GuideStickyNav.jsx";

// Noms canoniques des biens pour le maillage interne SEO ("villa" = Amaryllis + Iguana uniquement).
const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG  = "/photos/plongee.jpg";
const EPAVES_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Rocher_du_Diamant.jpg/960px-Rocher_du_Diamant.jpg";
const CLUBS_IMG  = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg";

const badges = [
  { icon: "🐠", label: "Tortues garanties à Arlet", must: true },
  { icon: "🚢", label: "18 épaves à Saint-Pierre", must: true },
  { icon: "📍", label: "20 min de Sainte-Luce" },
  { icon: "🤿", label: "Snorkeling sans équipement" },
  { icon: "🏫", label: "Clubs PADI / FFESSM certifiés" },
];

const spots = [
  {
    must: true,
    emoji: "🐠",
    titre: "Anse Dufour & Anse Noire — snorkeling accessible, tortues garanties",
    accroche: "Deux criques jumelles séparées par un sentier de dix minutes. Anse Noire doit son nom à son sable volcanique gris-noir, Anse Dufour à ses eaux turquoise habitées en permanence par des tortues vertes et des poissons-perroquets. L'une des expériences de snorkeling les plus accessibles de toute la Martinique — sans bateau, sans équipement si vous en louez sur place.",
    img: null,
    contenu: [
      {
        nom: "Les tortues — où, quand, comment",
        texte: "Les tortues vertes (Chelonia mydas) fréquentent Anse Dufour toute l'année. Elles se nourrissent des herbiers juste sous la surface, à trois ou quatre mètres de la plage. L'idéal : arriver avant 9h, quand l'eau est encore calme et la lumière rasante. Approchez lentement, ne les touchez pas, ne vous mettez pas entre elles et la surface — elles remontent respirer toutes les 20 à 30 minutes. En semaine vous serez seuls avec elles ; le week-end, la plage est plus fréquentée.",
      },
      {
        nom: "Anse Noire — le sable volcanique et les coraux",
        texte: "Dix minutes de sentier depuis Anse Dufour (panneaux balisés). Le sable noir, d'origine volcanique, est une rareté aux Antilles. Les coraux en bonne santé débutent à deux mètres, avec des gorgonaies, des éponges tonneau et des poissons-chirurgiens bleus. La crique est étroite, encaissée entre les falaises — ambiance sauvage préservée. Un seul restaurant de plage sert le déjeuner (Ti-Sable), arrivez avant 13h pour avoir une table.",
      },
      {
        nom: "Infos pratiques",
        texte: "Depuis Sainte-Luce, comptez 20 minutes par la D7 vers Les Anses-d'Arlet puis la route de la côte. Parking à l'entrée du village d'Arlet (~2€, très fréquenté le week-end). Location de masques et tubas au snack de la plage ou au village. Pas de bouteilles d'oxygène ici — c'est du snorkeling pur, idéal pour tous niveaux dès 6 ans.",
      },
    ],
  },
  {
    must: true,
    emoji: "🚢",
    titre: "Les épaves de Saint-Pierre — 18 navires coulés en une nuit",
    accroche: "Le 8 mai 1902, l'éruption de la Montagne Pelée a rayé de la carte la ville de Saint-Pierre en quelques minutes, faisant 30 000 morts. Dans la baie, 18 navires au mouillage ont sombré simultanément. Aujourd'hui, ces épaves entre 5 et 55 mètres de fond constituent l'un des sites de plongée les plus remarquables des Caraïbes — coraux colonisés, murènes, barracudas, raies pastenagues.",
    img: null,
    contenu: [
      {
        nom: "Les épaves majeures",
        texte: "Le Tamaya (12–24 m) est le plus accessible, idéal pour les plongeurs niveau 1 ou Open Water. Le Roraima (15–55 m) est le plus grand et le plus impressionnant — sa proue est reconnaissable depuis la surface. Le Gabrielle (45–55 m) est réservé aux plongeurs confirmés (niveau 3 ou Rescue). Toutes les épaves sont couvertes de coraux durs et mous après 120 ans de colonisation — c'est un récif artificiel exceptionnel.",
      },
      {
        nom: "Organisation de la plongée",
        texte: "Les épaves se plongent obligatoirement avec un club local — la navigation en bateau est indispensable, aucune n'est accessible à la nage depuis le bord. La plupart des clubs de Saint-Pierre proposent des sorties matin (8h30 départ) ou après-midi (13h30). Comptez 2 plongées sur des épaves différentes par sortie, 55–75€ selon le club. Le niveau minimum recommandé est Open Water PADI ou niveau 1 FFESSM pour les épaves peu profondes. Réservation 24h à l'avance indispensable.",
      },
      {
        nom: "Saint-Pierre, ville morte",
        texte: "Le trajet depuis Sainte-Luce est long (1h15 par la côte Caraïbe) mais il traverse Fond-Saint-Denis, les hauteurs boisées du Nord, et la descente sur Saint-Pierre est spectaculaire. La ville elle-même mérite une demi-journée : musée du Vulcanisme, ruines du théâtre, cellule du seul survivant Cyparis. Combinez plongée le matin et visite de la ville l'après-midi.",
      },
    ],
  },
  {
    must: false,
    emoji: "🦈",
    titre: "Le Rocher du Diamant — faune pélagique et coraux",
    accroche: null,
    img: EPAVES_IMG,
    contenu: [
      {
        nom: "Un site pour plongeurs confirmés",
        texte: "Le Rocher du Diamant est visible depuis Sainte-Luce par temps clair — ce monolithe de 175 mètres de haut émerge à 2 km de la côte. Sous la surface, il décroche en parois verticales jusqu'à 60 mètres. La faune pélagique y est exceptionnelle : bancs de carangues, barracudas solitaires, requins nourrices sous les surplombs, raies aigle de passage. Réservé au niveau 2 FFESSM ou Advanced PADI minimum.",
      },
      {
        nom: "Les conditions de plongée",
        texte: "Le Rocher est exposé aux alizés et au courant de la côte Atlantique — les conditions sont parfois sportives. Les clubs locaux ne proposent ce site que par mer calme (Beaufort 3 ou moins). En janvier-février, la houle peut rendre la sortie impossible plusieurs jours consécutifs. En revanche, de mars à juin, les conditions sont idéales et la visibilité dépasse souvent 25 mètres. La sortie bateau depuis Sainte-Luce dure 15 minutes.",
      },
      {
        nom: "Snorkeling depuis le bord à Anse Cafard",
        texte: "Pour ceux qui ne plongent pas en bouteille, Anse Cafard, à 5 minutes du Diamant, offre un snorkeling correct avec vue permanente sur le Rocher. Fonds entre 2 et 5 mètres, poissons tropicaux colorés, quelques coraux têtes-de-salade. La plage est peu fréquentée en semaine. C'est aussi le site du Mémorial de l'Anse Cafard, les 20 statues de béton blanc commémorant un naufrage négrier de 1830.",
      },
    ],
  },
  {
    must: false,
    emoji: "🤿",
    titre: "Snorkeling depuis les plages de Sainte-Luce",
    accroche: null,
    img: null,
    contenu: [
      {
        nom: "Anse Corps de Garde — la plage des tortues de Sainte-Luce",
        texte: "À 10 minutes à pied des villas Amaryllis, Anse Corps de Garde est la plage principale de Sainte-Luce. Les tortues marines y sont régulièrement observées en matinée, attirées par les herbiers de posidonie. Snorkeling possible directement depuis le bord, eau calme protégée par la barrière de corail. Profondeur entre 1 et 4 mètres — idéal pour les enfants avec adulte. Louer le matériel au spot nautique de la plage (~8€ la demi-journée).",
      },
      {
        nom: "Anse Gros Raisin & Pointe Pomme",
        texte: "À 5 minutes en voiture vers l'est. La Pointe Pomme marque l'extrémité de la baie et offre des fonds légèrement plus profonds (4–8 m) avec des formations coralliennes intactes. Moins fréquentée qu'Anse Corps de Garde. Pas de service sur place — apportez votre eau et votre matériel ou louez-le en amont. Meilleure visibilité l'après-midi quand les particules sédimentaires sont retombées.",
      },
      {
        nom: "Conseils pour un snorkeling réussi",
        texte: "Entrez dans l'eau doucement pour ne pas soulever de sable. Portez une crème solaire minérale (les filtres chimiques détruisent les coraux — certains sont désormais interdits en Martinique). En Martinique, l'eau est à 28°C toute l'année, aucune combinaison nécessaire. Si vous n'avez pas votre propre matériel, les villas Amaryllis disposent de masques et tubas à disposition des hôtes — demandez à l'arrivée.",
      },
    ],
  },
  {
    must: false,
    emoji: "🏫",
    titre: "Clubs de plongée recommandés",
    accroche: null,
    img: CLUBS_IMG,
    contenu: [
      {
        nom: "Plongée Passion — Sainte-Luce (le plus proche)",
        texte: "Situé à 10 minutes des villas, c'est le club de référence pour les hôtes Amaryllis. Certifié FFESSM et PADI. Sorties Rocher du Diamant (2 plongées, ~70€), demi-journée snorkeling guidé Anse Dufour (35€ transport inclus), baptêmes dès 8 ans (45€). Réservation par téléphone ou WhatsApp, réponse rapide. Matériel fourni (combinaison, détendeur, ordinateur). Niveau 1 à niveau 3, cours de formation disponibles sur la semaine.",
      },
      {
        nom: "Alpha Plongée — Les Anses-d'Arlet",
        texte: "Spécialiste du snorkeling guidé avec les tortues d'Anse Dufour. La sortie signature (2h, 30€ par personne) comprend le transport en bateau semi-rigide, le matériel et un guide naturaliste qui explique le comportement des tortues. Départ 8h30, retour 10h30 — parfait avant la plage. Sorties bouteilles également disponibles sur le Rocher et les petites épaves locales. Ouvert 7j/7 en haute saison.",
      },
      {
        nom: "Planète Bleue — Saint-Pierre (épaves)",
        texte: "Le club le plus reconnu pour les épaves de Saint-Pierre. Géré par des moniteurs avec 20 ans d'expérience sur ces sites. Sorties matinales 2 épaves (8h30–12h30, 65€ matériel inclus). Possibilité de combiner avec une nuit sur place (hôtels de charme à Saint-Pierre). Ils organisent également des stages photo sous-marine de 3 jours en partenariat avec des photographes professionnels. Réservation en ligne sur leur site.",
      },
    ],
  },
];

const pratique = [
  { icon: "🚗", label: "Depuis Sainte-Luce", valeur: "Anse Dufour 20 min · Saint-Pierre 1h15 · Diamant 15 min" },
  { icon: "🌡️", label: "Température de l'eau", valeur: "28°C toute l'année · Aucune combinaison requise" },
  { icon: "👁️", label: "Visibilité moyenne", valeur: "15–25 m · Meilleure mars–juin" },
  { icon: "📅", label: "Meilleure saison", valeur: "Mars à juin · Mer calme · Faune abondante" },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;600;700&family=Cormorant+Garamond:wght@300;400;500&display=swap');
  body { margin: 0; }

  /* badges */
  .gt-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 16px; border-radius: 100px;
    font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 400;
    border: 1.5px solid rgba(14,59,58,.18);
    background: white; color: ${NAVY};
    letter-spacing: .02em;
  }
  .gt-badge.must {
    background: ${CORAL}; color: white;
    border-color: ${CORAL}; font-weight: 600;
  }

  /* must card */
  .gt-must {
    background: linear-gradient(135deg, #0a2e2d 0%, #0e3b3a 100%);
    border-radius: 18px; padding: 36px 32px; margin-bottom: 32px;
    color: ${IVORY};
  }
  .gt-must-label {
    display: inline-flex; align-items: center; gap: 8px;
    background: ${CORAL}; color: white;
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 700;
    letter-spacing: .18em; text-transform: uppercase;
    padding: 5px 14px; border-radius: 100px; margin-bottom: 18px;
  }
  .gt-must-titre {
    font-family: 'Jost', sans-serif; font-weight: 200;
    font-size: clamp(20px, 4vw, 28px);
    letter-spacing: .05em; margin: 0 0 10px; color: ${IVORY};
  }
  .gt-must .gt-must-accroche {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 17px; line-height: 1.7; color: rgba(250,245,233,.8);
    margin: 0 0 24px;
  }
  .gt-must-item { margin-bottom: 20px; }
  .gt-must-item:last-child { margin-bottom: 0; }
  .gt-must-nom {
    font-family: 'Jost', sans-serif; font-weight: 600; font-size: 13px;
    color: ${CORAL}; text-transform: uppercase; letter-spacing: .1em;
    margin-bottom: 7px;
  }
  .gt-must .gt-must-texte {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 16px; line-height: 1.75; color: rgba(250,245,233,.82);
  }

  /* regular card */
  .gt-card {
    background: ${CREAM}; border: 1px solid ${SAND};
    border-radius: 16px; padding: 28px 28px 24px;
    margin-bottom: 24px;
  }
  .gt-card-header {
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
  }
  .gt-card-emoji { font-size: 22px; }
  .gt-card-titre {
    font-family: 'Jost', sans-serif; font-weight: 400;
    font-size: 18px; letter-spacing: .04em; color: ${NAVY}; margin: 0;
  }
  .gt-item { margin-bottom: 18px; }
  .gt-item:last-child { margin-bottom: 0; }
  .gt-item-nom {
    font-family: 'Jost', sans-serif; font-weight: 600; font-size: 12px;
    text-transform: uppercase; letter-spacing: .1em; color: ${CORAL};
    margin-bottom: 6px;
  }
  .gt-card .gt-item-texte {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 17px; line-height: 1.75; color: ${TEXT};
  }
  .gt-card-img {
    width: 100%; height: 220px; object-fit: cover; border-radius: 10px;
    display: block; margin-bottom: 20px;
  }

  /* pratique grid */
  .gt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px; margin-bottom: 48px;
  }
  .gt-grid-item {
    background: ${CREAM}; border: 1px solid ${SAND};
    border-radius: 12px; padding: 18px 20px;
  }
  .gt-grid-label {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: .18em; text-transform: uppercase; color: ${CORAL};
    margin-bottom: 5px;
  }
  .gt-grid-icon { font-size: 18px; margin-bottom: 8px; }
  .gt-grid-val {
    font-family: 'Jost', sans-serif; font-size: 13px;
    color: ${NAVY}; line-height: 1.5;
  }

  @media (max-width: 720px) {
    .gt-must { padding: 26px 20px; }
    .gt-card { padding: 22px 18px; }
    .gt-card-img { height: 170px; }
    .gt-grid { grid-template-columns: 1fr 1fr; }
  }
`;

export default function GuidePlongee() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta title="Plongée Martinique — Épaves, Snorkeling, Tortues | Amaryllis Sainte-Luce" description="Meilleurs spots de plongée et snorkeling en Martinique : épaves de Saint-Pierre, tortues d'Arlet, Rocher du Diamant. Guide complet depuis Sainte-Luce." canonical="/guide-plongee-martinique" image="https://villamaryllis.com/photos/plongee-martinique.avif" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Plongée & Snorkeling en Martinique — Épaves de Saint-Pierre, Tortues, Rocher du Diamant",
        "description": "Guide complet plongée et snorkeling en Martinique depuis Sainte-Luce : épaves de Saint-Pierre, tortues d'Anse Dufour, Rocher du Diamant, clubs certifiés PADI/FFESSM.",
        "url": `${BASE}/guide-plongee-martinique`,
        "image": HERO_IMG,
        "author": { "@type": "Organization", "name": "Amaryllis Locations", "url": BASE },
        "publisher": { "@type": "Organization", "name": "Amaryllis Locations", "url": BASE },
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <ReadingProgressBar ctaHref="/" />
        <GuideStickyNav
          links={[
            { label: "Spots", href: "#spots" },
            { label: "Activités", href: "#activites" },
          ]}
        />

        {/* HEADER */}

        <GuideHero
          img={HERO_IMG}
          alt="Plongée et snorkeling en Martinique — épaves et fonds marins"
          eyebrow="Depuis Sainte-Luce · Côte Caraïbe Martinique"
          title="Plongée & Snorkeling"
          subtitle="Épaves de Saint-Pierre, tortues d'Anse Dufour, Rocher du Diamant — le guide complet des fonds marins martiniquais."
          badges={badges}
          navBack={{ href: "/guide-hub", label: "Tous les guides" }}
        />

        {/* ACTIVITÉ EN VEDETTE — immédiatement après le hero */}
        <div style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", paddingTop: 32, paddingBottom: 8 }}>
            <EncartActivite activites={[ACTIVITES["plongee-cata-prive"], ACTIVITES.snorkeling]} platform="viator" big />
          </div>
        </div>

        {/* CONTENU */}
        <div id="spots" style={{ maxWidth: 680, margin: "0 auto", padding: "52px 24px 80px" }}>

          {/* BADGES */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 48 }}>
            {badges.map(b => (
              <span key={b.label} className={`gt-badge${b.must ? " must" : ""}`}>
                <span>{b.icon}</span>{b.label}
              </span>
            ))}
          </div>

          {/* SPOTS */}
          {spots.map(spot => spot.must ? (
            <div key={spot.titre} className="gt-must">
              <div className="gt-must-label">✦ Must absolu</div>
              <h2 className="gt-must-titre">{spot.emoji} {spot.titre}</h2>
              <p className="gt-must-accroche">{spot.accroche}</p>
              {spot.contenu.map(c => (
                <div key={c.nom} className="gt-must-item">
                  <div className="gt-must-nom">{c.nom}</div>
                  <p className="gt-must-texte">{c.texte}</p>
                </div>
              ))}
            </div>
          ) : (
            <div key={spot.titre} className="gt-card">
              {spot.img && (
                <img src={spot.img} alt={spot.titre} className="gt-card-img" loading="lazy"
                  onError={e => { e.currentTarget.style.display = "none"; }} />
              )}
              <div className="gt-card-header">
                <span className="gt-card-emoji">{spot.emoji}</span>
                <h2 className="gt-card-titre">{spot.titre}</h2>
              </div>
              {spot.contenu.map(c => (
                <div key={c.nom} className="gt-item">
                  <div className="gt-item-nom">{c.nom}</div>
                  <p className="gt-item-texte">{c.texte}</p>
                </div>
              ))}
            </div>
          ))}

          <div id="activites">
            <EncartActivite activites={[ACTIVITES.snorkeling]} />
          </div>
          <EncartActivite activites={[ACTIVITES.tortues, ACTIVITES["plongee-cata-prive"]]} />

          {/* INFOS PRATIQUES */}
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, margin: "0 0 20px" }}>
            Infos pratiques
          </h2>
          <div className="gt-grid">
            {pratique.map(p => (
              <div key={p.label} className="gt-grid-item">
                <div className="gt-grid-icon">{p.icon}</div>
                <div className="gt-grid-label">{p.label}</div>
                <div className="gt-grid-val">{p.valeur}</div>
              </div>
            ))}
          </div>

          {/* CTA LOGEMENT */}
          <EncartActivite activites={[ACTIVITES["diamant-bateau"]]} platform="gyg" />
          <BridgeVilla
  villaId="amaryllis"
  lieu="Plongée & Snorkeling"
  tempsRoute="Anse Corps de Garde à 10 min · Rocher du Diamant 15 min en bateau · Saint-Pierre 1h15"
  copy="Faites de Sainte-Luce votre camp de base : masques et tubas à disposition, tortues d'Anse Corps de Garde à dix minutes à pied, et les clubs PADI les plus proches de l'île. Réservez votre villa en direct, sans commission, et organisez chaque sortie au gré de la météo."
/>
          <div style={{ background: NAVY, borderRadius: 16, padding: "36px 28px", textAlign: "center", marginBottom: 48 }}>
            <p style={{ color: CORAL, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Jost', sans-serif" }}>Base idéale</p>
            <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 22, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 12px" }}>
              Sainte-Luce — à 20 min des spots
            </h3>
            <p style={{ color: "rgba(250,245,233,.65)", fontSize: 14, maxWidth: 420, margin: "0 auto 22px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Villas avec piscine privée · Vue mer · Jacuzzi · Masques et tubas disponibles. À partir de 110€/nuit, réservation directe sans frais.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "13px 30px", borderRadius: 8, fontSize: 12, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Jost', sans-serif" }}>
              Voir les villas
            </a>
          </div>

          {/* NAVIGATION */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <a href="/guide-arlet" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>
              ← Guide Arlet & Tortues
            </a>
            <a href="/guide-hub" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>
              Tous les guides →
            </a>
          </div>
        </div>

                <BlocAffilie slug="plongee" />
        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-plongee" />
        </div>

        {/* FOOTER */}
        <div style={{ background: NAVY, padding: "20px 24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,.35)", fontSize: 12, margin: 0, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,.35)", textDecoration: "none" }}>villamaryllis.com</a>
          </p>
        </div>
        <MaillageCluster currentSlug="guide-plongee-martinique" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
