// Guide Les Trois-Îlets Martinique — /guide-trois-ilets
// Design immersif v2 — village créole & naissance de l'Impératrice

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";
import BlocAffilie from "./components/BlocAffilie.jsx";
import EncartActivite from "./components/EncartActivite.jsx";
import { ACTIVITES } from "./data/activites.js";
import ReadingProgressBar from "./components/ReadingProgressBar.jsx";
import BridgeVilla from "./components/BridgeVilla.jsx";
import ProgrammeSejour from "./components/ProgrammeSejour.jsx";
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

const HERO_IMG  = "/photos/trois-ilets.avif";
const BEACH_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg";

const badges = [
  { icon: "🏛️", label: "Musée de la Pagerie", must: true },
  { icon: "📍", label: "35 min de Sainte-Luce" },
  { icon: "⚓", label: "Marina & village créole" },
  { icon: "🏖️", label: "Anse Mitan & Anse à l'Âne" },
  { icon: "🎨", label: "Village des potiers" },
];

const spots = [
  {
    must: true,
    emoji: "🏛️",
    titre: "Musée de la Pagerie — la naissance de l'Impératrice",
    accroche: "Joséphine de Beauharnais, future épouse de Napoléon, est née ici. Le domaine où elle a grandi est devenu un musée unique aux Caraïbes.",
    img: null,
    contenu: [
      {
        nom: "Pourquoi c'est exceptionnel",
        texte: "Marie-Josèphe-Rose de Tascher de la Pagerie, dite Joséphine, est née le 23 juin 1763 sur ce domaine sucrier. Devenue impératrice des Français en 1804, elle reste la seule impératrice née en Martinique — et aux Amériques. Le musée conserve son berceau, sa correspondance avec Napoléon, des portraits et des objets personnels d'une grande rareté.",
      },
      {
        nom: "La visite",
        texte: "Le musée est installé dans les ruines de l'ancienne cuisine du domaine. Comptez 45 min à 1h30. Guide disponible sur place (fortement recommandé pour saisir la profondeur historique). Tarif adulte ~6€. Ouvert du mardi au dimanche, 9h–17h. Prévoir de l'eau — le domaine est en plein air sous les tropiques.",
      },
      {
        nom: "Autour du musée",
        texte: "Le village de Trois-Rivières juste à côté abrite les ruines du domaine d'origine et un jardin tropical. De là, vue dégagée sur la baie de Fort-de-France. Souvent beaucoup moins fréquenté que les sites touristiques de la côte — une vraie respiration.",
      },
    ],
  },
  {
    must: false,
    emoji: "⚓",
    titre: "Le village créole & la marina",
    accroche: null,
    img: HERO_IMG,
    contenu: [
      {
        nom: "L'église Notre-Dame-de-la-Bonne-Délivrance",
        texte: "Au cœur du bourg, cette église du XVIIIe siècle où Joséphine a été baptisée est l'un des monuments les plus visités de Martinique. La place centrale avec ses flamboyants et ses cases créoles colorées mérite une heure de flânerie. Marché local le samedi matin.",
      },
      {
        nom: "La marina",
        texte: "Face à la baie de Fort-de-France, la marina des Trois-Îlets offre l'une des plus belles vues de Martinique sur la capitale illuminée au coucher du soleil. Nombreux restaurants de poisson, bars à rhum, boutiques d'artisanat. Point de départ pour les excursions en catamaran vers Fort-de-France (20 min de traversée vs 45 min en voiture).",
      },
      {
        nom: "Le village des potiers",
        texte: "À 2 km du bourg, le hameau de la Poterie regroupe des artisans qui perpétuent une tradition céramique vieille de plusieurs siècles. Vous pouvez assister au tournage et acheter directement aux créateurs. Cadre champêtre, tranquille — un contraste saisissant avec l'agitation de la côte.",
      },
    ],
  },
  {
    must: false,
    emoji: "🏖️",
    titre: "Plages : Anse Mitan & Anse à l'Âne",
    accroche: null,
    img: BEACH_IMG,
    contenu: [
      {
        nom: "Anse Mitan — la plage principale",
        texte: "À 3 km du bourg, Anse Mitan est la plage de villégiature des Trois-Îlets : sable fin, eau calme, rangée de restaurants directement sur le bord de l'eau. Très animée l'été. Parking payant. Idéale pour un déjeuner les pieds dans le sable après la visite du musée.",
      },
      {
        nom: "Anse à l'Âne — plus sauvage",
        texte: "Accessible depuis Anse Mitan par un sentier côtier de 20 min (ou en voiture). Moins fréquentée, fonds marins plus intéressants, snorkeling correct. Un seul snack sur la plage. Ambiance locale préservée.",
      },
      {
        nom: "Golf de l'Impératrice",
        texte: "L'un des deux parcours 18 trous de Martinique, juste derrière la plage. Si vous jouez, la réservation est indispensable en haute saison. Panorama exceptionnel sur la baie depuis le fairway.",
      },
    ],
  },
];

const pratique = [
  { icon: "🚗", label: "Depuis Sainte-Luce", valeur: "35 min (D7 → D9, traverser Rivière-Salée)" },
  { icon: "🕘", label: "Musée de la Pagerie", valeur: "Mar–Dim 9h–17h · ~6€/adulte" },
  { icon: "⛵", label: "Bateau Fort-de-France", valeur: "Vedette depuis la marina · 20 min · ~15€" },
  { icon: "🅿️", label: "Parking", valeur: "Gratuit bourg · Payant Anse Mitan (~2€)" },
  { icon: "📅", label: "Meilleure période", valeur: "Toute l'année · Éviter carnaval (foule) · Musée fermé lundi" },
  { icon: "💶", label: "Budget journée", valeur: "~40–60€/pers (musée + déjeuner + parking + bateau option)" },
  { icon: "🍽️", label: "Restaurant recommandé", valeur: "La Villa Créole (Anse Mitan) · Marine Hôtel (marina, vue baie)" },
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

export default function GuideTroisIlets() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
<SEOMeta title="Les Trois-Îlets Martinique — Pagerie & marina | Amaryllis" description="Guide Trois-Îlets depuis Sainte-Luce (35 min) : Musée de la Pagerie (naissance de Joséphine), village créole, marina face à Fort-de-France, plage Anse Mitan." canonical="/guide-trois-ilets" image="https://villamaryllis.com/photos/trois-ilets.avif" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Les Trois-Îlets Martinique — Guide : Musée de la Pagerie, plages et village créole",
        "description": "Guide complet des Trois-Îlets depuis Sainte-Luce : Musée de la Pagerie (naissance de Joséphine), village créole, marina, Anse Mitan. À 35 min de nos villas.",
        "url": `${BASE}/guide-trois-ilets`,
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
            { label: "Programme", href: "#programme" },
          ]}
        />

        {/* HEADER */}

        <GuideHero
          img={HERO_IMG}
          alt="Les Trois-Îlets Martinique — village créole et marina"
          eyebrow="35 min de Sainte-Luce · Presqu'île du Diamant"
          title="Les Trois-Îlets"
          subtitle="Village créole, Musée de la Pagerie, marina face à Fort-de-France — et la plage d'Anse Mitan."
          badges={badges}
          navBack={{ href: "/guide-hub", label: "Tous les guides" }}
        />

        {/* ACTIVITÉ EN VEDETTE — immédiatement après le hero */}
        <div style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", paddingTop: 32, paddingBottom: 8 }}>
            <EncartActivite activites={[ACTIVITES.catamaran, ACTIVITES.dauphins]} platform="viator" big />
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
            <EncartActivite activites={[ACTIVITES.catamaran, ACTIVITES.dauphins]} />
          </div>

          <div id="programme">
          <ProgrammeSejour
            jours={[
              {
                jour: "Jour 1",
                titre: "Histoire créole & marina au coucher du soleil",
                matin: "Visite guidée du Musée de la Pagerie — berceau de Joséphine de Beauharnais — puis flânerie au village des potiers et à l'église Notre-Dame-de-la-Bonne-Délivrance.",
                apresMidi: "Déjeuner les pieds dans le sable à Anse Mitan, baignade, puis sentier côtier jusqu'à Anse à l'Ane plus sauvage pour un peu de snorkeling.",
                soir: "Apéro face à la baie de Fort-de-France depuis la marina, illuminée au coucher du soleil, dans un bar à rhum local.",
              },
              {
                jour: "Jour 2",
                titre: "Journée en mer vers les îlets du Sud",
                matin: "Embarquement à la marina pour une croisière catamaran : voile vers les îlets, dauphins en liberté et première session snorkeling.",
                apresMidi: "Mouillage et baignade dans les eaux turquoise, déjeuner antillais à bord, retour en fin d'après-midi.",
                soir: "Retour tranquille à la villa à Sainte-Luce pour un dîner sur la terrasse.",
              },
            ]}
          />
          </div>

          <EncartActivite activites={[ACTIVITES["plongee-cata-prive"]]} />

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
          <EncartActivite activites={[{ ...ACTIVITES.rhum, viatorPath: null }]} platform="gyg" />
          <BridgeVilla
            villaId="amaryllis"
            lieu="Les Trois-Îlets"
            tempsRoute="30 min"
            copy="Faites de Sainte-Luce votre camp de base : depuis la Villa Amaryllis, Les Trois-Îlets et sa marina sont à 30 min, et vous rentrez chaque soir à votre piscine privée. Réservez en direct, sans frais d'agence."
          />
          <div style={{ background: NAVY, borderRadius: 16, padding: "36px 28px", textAlign: "center", marginBottom: 48 }}>
            <p style={{ color: CORAL, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Jost', sans-serif" }}>Base idéale</p>
            <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 22, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 12px" }}>
              Sainte-Luce — à 35 min
            </h3>
            <p style={{ color: "rgba(250,245,233,.65)", fontSize: 14, maxWidth: 420, margin: "0 auto 22px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Villas avec piscine privée · Vue mer · Jacuzzi · À partir de 110€/nuit. Réservation directe sans frais.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "13px 30px", borderRadius: 8, fontSize: 12, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Jost', sans-serif" }}>
              Voir les villas
            </a>
          </div>

          {/* NAVIGATION */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <a href="/guide-le-diamant" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>
              ← Guide Le Diamant
            </a>
            <a href="/guide-arlet" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>
              Guide l'Anse d'Arlet →
            </a>
          </div>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <a href="/guide-hub" style={{ color: MUTED, textDecoration: "none", fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em", opacity: 0.7 }}>
              Tous les guides de Martinique
            </a>
          </div>
        </div>

                <BlocAffilie slug="trois-ilets" />
        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-trois-ilets" />
        </div>

        {/* FOOTER */}
        <div style={{ background: NAVY, padding: "20px 24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,.35)", fontSize: 12, margin: 0, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,.35)", textDecoration: "none" }}>villamaryllis.com</a>
          </p>
        </div>
        <MaillageCluster currentSlug="guide-trois-ilets" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
