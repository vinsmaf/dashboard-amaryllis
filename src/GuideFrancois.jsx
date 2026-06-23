// Guide Le François Martinique — /guide-francois-martinique
// Design immersif v2 — Fonds Blancs & piscines naturelles

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";
import BlocAffilie from "./components/BlocAffilie.jsx";
import ReadingProgressBar from "./components/ReadingProgressBar.jsx";
import GuideHero from "./components/GuideHero.jsx";
import GuideStickyNav from "./components/GuideStickyNav.jsx";
import BridgeVilla from "./components/BridgeVilla.jsx";
import ProgrammeSejour from "./components/ProgrammeSejour.jsx";
import EncartActivite from "./components/EncartActivite.jsx";
import { ACTIVITES } from "./data/activites.js";

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

const HERO_IMG  = "/photos/fonds-blancs.jpg";
const MANGROVE_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg/960px-Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg";

const badges = [
  { icon: "🏊", label: "Fonds Blancs", must: true },
  { icon: "📍", label: "35 min de Sainte-Luce" },
  { icon: "🦞", label: "Langouste & chatrou frais" },
  { icon: "🚣", label: "Kayak en mangrove" },
  { icon: "🥃", label: "Ti-punch en mer" },
];

const spots = [
  {
    must: true,
    emoji: "🏊",
    titre: "Les Fonds Blancs — les piscines naturelles du François",
    accroche: "Au large du François, des bancs de sable blanc émergent à fleur d'eau : l'Atlantique y devient turquoise, tiède, translucide. C'est l'une des expériences les plus singulières de Martinique.",
    img: null,
    contenu: [
      {
        nom: "Ce que vous y trouvez",
        texte: "Les Fonds Blancs sont des hauts-fonds calcaires situés à environ 3 km du bourg du François. L'eau y est si peu profonde (30 cm à 1 m selon les marées) que l'on peut s'y tenir debout en pleine mer, entouré d'une eau d'un bleu-vert irréel. Le sable blanc immergé réfléchit la lumière vers la surface, créant cet effet de piscine naturelle à ciel ouvert qui a rendu le site célèbre bien au-delà de la Martinique.",
      },
      {
        nom: "Comment s'y rendre",
        texte: "L'accès se fait exclusivement en bateau depuis le bourg du François. Plusieurs prestataires proposent des excursions : comptez entre 20 et 35€ par personne pour une demi-journée (environ 3h), bateau partagé. Les sorties privées sont possibles (~120–180€ pour le bateau entier). Départ depuis le quai du François, 10–15 min de navigation. Réservation conseillée en haute saison (décembre–avril, juillet–août).",
      },
      {
        nom: "Conseils pratiques",
        texte: "Privilégiez le matin (8h–12h) : la mer est plus calme, la lumière idéale pour les photos, et les groupes moins nombreux. Apportez votre crème solaire biodégradable (les formules classiques sont fortement déconseillées sur cet écosystème fragile), des chaussures aquatiques si votre peau est sensible au sable corallien, et une glacière — certains prestataires servent le ti-punch directement sur le banc de sable.",
      },
    ],
  },
  {
    must: false,
    emoji: "🦞",
    titre: "Le marché aux poissons & le rhum punch en mer",
    accroche: null,
    img: HERO_IMG,
    contenu: [
      {
        nom: "Le bord de mer du François",
        texte: "Le quai du François réunit chaque matin pêcheurs, poissonniers et habitants dans une atmosphère authentiquement antillaise. Langoustes vivantes, daurades, thons, lambi (conque) : l'arrivée des barques entre 6h et 9h est un moment de vie locale à ne pas manquer. Plusieurs tables simples proposent du poisson grillé ou des acras dès le matin.",
      },
      {
        nom: "Le ti-punch sur l'eau",
        texte: "Une tradition spécifique au François : certains prestataires servent le rhum punch directement à bord, voire sur les Fonds Blancs eux-mêmes. Rhum agricole AOC martiniquais, citron vert, sirop de canne — dans l'eau jusqu'aux genoux, face à la côte atlantique. C'est l'image d'Épinal de la Martinique côté Atlantique, et elle est méritée.",
      },
      {
        nom: "Où déjeuner",
        texte: "Le Bord de Mer (bord de quai, ambiance locale, poisson frais du jour) et quelques lolos dans le bourg proposent des menus complets pour 12 à 18€. La spécialité : le court-bouillon de poisson, plat créole emblématique que peu d'endroits réussissent aussi bien qu'ici, loin des zones touristiques saturées.",
      },
    ],
  },
  {
    must: false,
    emoji: "🚣",
    titre: "Kayak & paddle dans la mangrove",
    accroche: null,
    img: MANGROVE_IMG,
    contenu: [
      {
        nom: "Un écosystème à part",
        texte: "La baie du François est bordée d'une mangrove dense — l'une des plus étendues de Martinique. En kayak ou en stand-up paddle, on s'y glisse entre les palétuviers dont les racines aériennes plongent dans une eau sombre et tranquille. Hérons garde-boeufs, aigrettes, martins-pêcheurs : la biodiversité y est remarquable, surtout en début et fin de journée.",
      },
      {
        nom: "Où louer du matériel",
        texte: "Plusieurs prestataires au bord du quai proposent la location de kayak simple ou double (environ 10–15€/h) et de SUP (12–18€/h). Aucune expérience préalable requise — la mangrove est abritée du vent et les conditions sont quasi toujours calmes. Prévoir environ 2h pour explorer les chenaux principaux à un rythme tranquille.",
      },
      {
        nom: "Ce que vous croiserez",
        texte: "Outre les oiseaux, attendez-vous à croiser des bernard-l'hermite sur les racines exposées, des mulets argentés dans les chenaux peu profonds et, selon la saison, des tortues qui viennent se reposer à l'ombre des palétuviers. La mangrove est un nursery naturel pour de nombreuses espèces marines : c'est ici que se reproduit une partie de la faune que l'on retrouve ensuite sur les récifs coralliens.",
      },
    ],
  },
  {
    must: false,
    emoji: "🦐",
    titre: "Spécialité : chatrou (poulpe) et langouste fraîche",
    accroche: null,
    img: null,
    contenu: [
      {
        nom: "Le chatrou — plat emblématique du François",
        texte: "Le chatrou est le nom créole du poulpe. Pêché localement, il est préparé en fricassée — mijoté avec des oignons, du piment antillais, du thym et du rhum, jusqu'à ce que sa chair devienne tendre et caramélisée. C'est le plat identitaire du François, bien plus présent ici que dans le reste de l'île. Plusieurs restaurants du bourg en proposent le week-end ; appelez avant pour vérifier la disponibilité.",
      },
      {
        nom: "La langouste vivante",
        texte: "Le François est l'un des rares bourgs de Martinique où l'on peut acheter des langoustes directement aux pêcheurs le matin au quai. Prix indicatif : 25 à 40€ le kilo selon la taille et la saison (moins chère en basse saison, août–novembre). Plusieurs restaurants acceptent de cuisiner votre achat — une pratique courante ici, à négocier directement avec l'établissement.",
      },
      {
        nom: "Le marché du samedi matin",
        texte: "Le samedi est le meilleur jour pour combiner marché, poissonnerie et restaurant. Le bourg est animé dès 7h, les arrivages les plus variés, et plusieurs stands proposent des spécialités maison — accras de morue, boudin créole, tourments d'amour. Prévoyez d'arriver tôt si vous ciblez la langouste ou le chatrou : ils partent vite.",
      },
    ],
  },
];

const pratique = [
  { icon: "🚗", label: "Depuis Sainte-Luce", valeur: "35 min (N1 direction Le Robert → Le François)" },
  { icon: "⛵", label: "Excursion Fonds Blancs", valeur: "20–35€/pers · départ quai du François" },
  { icon: "🕗", label: "Marché aux poissons", valeur: "Lun–Sam dès 6h · samedi recommandé" },
  { icon: "🅿️", label: "Parking", valeur: "Gratuit bourg · place limitée le samedi matin" },
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

export default function GuideFrancois() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta title="Le François Martinique — Fonds Blancs & Piscines Naturelles | Amaryllis" description="Découvrez les Fonds Blancs du François : piscines naturelles, sable blanc immergé, ti-punch en mer. Guide complet depuis Sainte-Luce (35 min)." canonical="/guide-francois-martinique" image="https://villamaryllis.com/photos/francois.avif" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Le François Martinique — Guide : Fonds Blancs, piscines naturelles et saveurs locales",
        "description": "Guide complet du François depuis Sainte-Luce : Fonds Blancs (piscines naturelles), marché aux poissons, kayak en mangrove, chatrou et langouste fraîche. À 35 min de nos villas.",
        "url": `${BASE}/guide-francois-martinique`,
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
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 17, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <a href="/guide-hub" style={{ color: "rgba(250,245,233,.55)", textDecoration: "none", fontSize: 12, letterSpacing: "0.08em" }}>← Tous les guides</a>
          </div>
        </header>

        <GuideHero
          img={HERO_IMG}
          alt="Fonds Blancs du François, Martinique"
          eyebrow="35 min de Sainte-Luce · Côte Atlantique"
          title="Le François"
          subtitle="Fonds Blancs, piscines naturelles au large, marché de pêcheurs, kayak en mangrove — la Martinique atlantique dans toute son authenticité."
          badges={badges}
        />

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
          <div id="activites">
            <EncartActivite activites={[ACTIVITES["fonds-blancs"]]} />
          </div>

          {/* SPOTS */}
          <EncartActivite activites={[ACTIVITES["ilets-chancel"]]} />
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

          <EncartActivite activites={[ACTIVITES.catamaran]} />
          <EncartActivite activites={[ACTIVITES["fonds-blancs"], ACTIVITES["ilets-chancel"]]} />

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

          <BridgeVilla
  villaId="amaryllis"
  lieu="Le François"
  tempsRoute="35-40 min"
  copy="Faites du sud votre camp de base : depuis nos villas de Sainte-Luce, avec piscine privée et vue mer, Le François est à 35-40 min de route. Réservez en direct, sans frais de plateforme, et rentrez chaque soir au calme."
/>
          <div id="programme">
          <ProgrammeSejour
  jours={[
    {
      jour: "Jour 1",
      titre: "Les Fonds Blancs et le bourg du François",
      matin: "Départ depuis votre villa de Sainte-Luce (35-40 min) vers le quai du François. Excursion en bateau vers les Fonds Blancs : baignade dans les piscines naturelles, sable blanc immergé et ti-punch servi à bord.",
      apresMidi: "Retour au bourg pour déjeuner au bord de mer (court-bouillon de poisson, chatrou ou langouste achetée au quai et cuisinée sur place).",
      soir: "Retour à Sainte-Luce, apéritif au coucher du soleil depuis la terrasse de la villa.",
    },
    {
      jour: "Jour 2",
      titre: "Îlets sauvages et mangrove",
      matin: "Sortie vers les îlets du François : iguanes, coraux et fonds transparents, puis exploration en kayak ou paddle dans la mangrove de la baie.",
      apresMidi: "Marché aux poissons (le samedi de préférence) et flânerie sur le bord de mer atlantique avant de reprendre la route vers le sud.",
    },
  ]}
/>
          </div>

          {/* CTA LOGEMENT */}
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
            <a href="/guide-trois-ilets" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>
              ← Guide Les Trois-Îlets
            </a>
            <a href="/guide-hub" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>
              Tous les guides →
            </a>
          </div>
        </div>

                <BlocAffilie slug="francois" />
        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-francois" />
        </div>

        {/* FOOTER */}
        <div style={{ background: NAVY, padding: "20px 24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,.35)", fontSize: 12, margin: 0, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,.35)", textDecoration: "none" }}>villamaryllis.com</a>
          </p>
        </div>
        <MaillageCluster currentSlug="guide-francois-martinique" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
