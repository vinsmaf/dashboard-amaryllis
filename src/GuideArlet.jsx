// Guide Grande Anse d'Arlet Martinique — /guide-arlet
// Design immersif v2 — tortues en héros absolu

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

const HERO_IMG = "https://villamaryllis.com/photos/arlet-tortue.webp";

const badges = [
  { icon: "🐢", label: "Tortues garanties" },
  { icon: "📍", label: "35-40 min de Sainte-Luce" },
  { icon: "🤿", label: "Snorkeling facile" },
  { icon: "👨‍👩‍👧", label: "Idéal en famille" },
  { icon: "🎣", label: "Village de pêcheurs" },
];

const spots = [
  {
    must: true,
    emoji: "🐢",
    titre: "Les tortues marines — le must absolu",
    accroche: "Nager avec des tortues marines à 2 mètres du bord. Sans bouteille. Sans guide.",
    img: null,
    contenu: [
      {
        nom: "Pourquoi ici, pourquoi maintenant",
        texte: "Grande Anse d'Arlet abrite l'un des seuls spots de Martinique où les tortues marines viennent se nourrir régulièrement dans les herbiers juste sous la plage. L'eau est peu profonde (1 à 4 m), la visibilité excellente, et les tortues — habituées à la présence humaine discrète — ne fuient pas. Un masque et un tuba suffisent.",
      },
      {
        nom: "Comment maximiser ses chances",
        texte: "Arrivez tôt — entre 7h et 9h du matin, les tortues sont quasi-certaines. Entrez dans l'eau côté gauche de la plage, vers la pointe rocheuse. Restez immobile, à la surface, sans tenter de les toucher ni de plonger vers elles. Elles remontent respirer toutes les 5 à 10 minutes — attendez simplement. C'est l'une des expériences les plus émouvantes des Caraïbes.",
      },
      {
        nom: "Matériel",
        texte: "Location de masque et tuba sur la plage (5-8€/personne). Veillez à ne pas utiliser de crème solaire à base de filtres chimiques — elle abîme les coraux et perturbe les tortues. Préférez une crème minérale ou restez à l'ombre.",
      },
    ],
  },
  {
    must: false,
    emoji: "🏖️",
    titre: "La plage et le village",
    accroche: null,
    img: HERO_IMG,
    contenu: [
      {
        nom: "La plage aux bœufs — une image iconique",
        texte: "Grande Anse d'Arlet est l'une des images les plus photographiées de la Martinique : arc de sable blond, petite église créole au bord de l'eau, cocotiers, et parfois des bœufs qui se baignent dans la mer. Eau calme, fond de sable, baignade familiale parfaite.",
      },
      {
        nom: "Petite Anse d'Arlet — la plage sauvage",
        texte: "15 minutes à pied au nord. Moins fréquentée, fond rocheux, excellente pour le snorkeling en dehors de la grande plage. Idéale tôt le matin ou en fin d'après-midi quand la lumière est dorée.",
      },
      {
        nom: "Le village de pêcheurs",
        texte: "L'un des derniers villages de pêcheurs actifs de Martinique. Le matin, les yoles colorées rentrent au port avec dorades, thons et langoustes. Certains pêcheurs vendent directement sur la plage. Une authenticité rare dans les Caraïbes.",
      },
    ],
  },
  {
    must: false,
    emoji: "🤿",
    titre: "Plongée et activités nautiques",
    accroche: null,
    img: null,
    contenu: [
      {
        nom: "Plongée sous-marine",
        texte: "Clubs de plongée sur place avec des sites variés : tombants couverts de gorgones, épaves peu profondes, bancs de poissons tropicaux. Le site 'Les Abymes' (25 m) est accessible dès le niveau 1. Comptez 45-55€ la plongée encadrée.",
      },
      {
        nom: "Kayak de mer",
        texte: "Location de kayaks sur la plage. Le tour de la pointe entre Grande Anse et Petite Anse (30 min aller-retour) offre une vue unique sur le village depuis la mer et des spots de snorkeling inaccessibles à pied.",
      },
    ],
  },
  {
    must: false,
    emoji: "🍽️",
    titre: "Où manger",
    accroche: null,
    img: null,
    contenu: [
      {
        nom: "Le Ti Sable — les pieds dans le sable",
        texte: "Face à la plage, poisson frais du jour — langouste grillée, thon mi-cuit, daurade créole. Ambiance décontractée, service chaleureux. Réservation conseillée en haute saison.",
      },
      {
        nom: "Chez Nana — l'institution locale",
        texte: "Tenu par la même famille depuis trois générations. Cuisine créole généreuse, prix honnêtes. Accras, fricassée de chatrou (poulpe), punch coco maison. Le vrai Arlet.",
      },
      {
        nom: "Noix de coco fraîches",
        texte: "Plusieurs vendeurs sur la plage : noix de coco fraîches, acras, boudins à emporter. Le snack parfait après la baignade.",
      },
    ],
  },
];

const cssStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }

  .guide-arlet-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(250,245,233,0.13); border: 1px solid rgba(250,245,233,0.25);
    border-radius: 100px; padding: 8px 16px;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
    color: rgba(250,245,233,0.9); letter-spacing: 0.04em; white-space: nowrap;
    backdrop-filter: blur(6px);
  }
  .guide-arlet-badge.must {
    background: rgba(196,114,84,0.3); border-color: rgba(196,114,84,0.6);
    color: #faf5e9; font-weight: 600;
  }

  .must-card {
    background: linear-gradient(135deg, #0a2e2d 0%, #0e3b3a 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3);
    border-radius: 20px; overflow: hidden;
    margin-bottom: 64px;
  }
  .must-card-header {
    padding: 36px 40px 28px;
    border-bottom: 1px solid rgba(250,245,233,0.08);
  }
  .must-card-body { padding: 32px 40px 40px; display: flex; flex-direction: column; gap: 20px; }
  .must-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 22px 26px;
  }
  .must-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 13px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .must-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }

  .regular-section { margin-bottom: 56px; }
  .regular-card {
    background: #fff; border: 1px solid ${SAND}; border-radius: 14px; overflow: hidden;
    margin-bottom: 16px;
  }
  .regular-card img { width: 100%; height: 240px; object-fit: cover; display: block; }
  .regular-card-body { padding: 24px 28px; }
  .regular-card-body h3 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 15px;
    color: ${NAVY}; margin: 0 0 10px; letter-spacing: 0.04em;
  }
  .regular-card-body p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${TEXT}; margin: 0;
  }

  .practical-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 48px;
  }
  .practical-item {
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 22px;
  }
  .practical-item .pi-label {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.25em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 6px;
  }
  .practical-item .pi-value {
    font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 400; color: ${NAVY};
  }

  @media (max-width: 640px) {
    .must-card-header, .must-card-body { padding: 24px 20px; }
    .must-item { padding: 18px 18px; }
    .practical-grid { grid-template-columns: 1fr; }
    .regular-card img { height: 180px; }
    .badges-row { gap: 8px !important; }
    .guide-arlet-badge { font-size: 11px; padding: 7px 12px; }
  }
`;

export default function GuideArlet() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
<SEOMeta title="Anses d'Arlet Martinique — Tortues marines | Amaryllis" description="Les Anses d'Arlet (35-40 min de Sainte-Luce) : le seul spot de Martinique où nager avec des tortues marines garanties tôt le matin. Village de pêcheurs, snorkeling, restaurants." canonical="/guide-arlet" image="https://villamaryllis.com/photos/arlet-tortue.webp" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Grande Anse d'Arlet Martinique : nager avec les tortues marines",
        "description": "Le guide complet de Grande Anse d'Arlet : comment voir les tortues marines garanties, snorkeling, village de pêcheurs et restaurants créoles. À 35-40 min de Sainte-Luce.",
        "url": `${BASE}/guide-arlet`,
        "image": HERO_IMG,
        "author": { "@id": `${BASE}/#organization` },
        "publisher": { "@id": `${BASE}/#organization` },
      })}} />
      {/* seo-002 : FAQPage JSON-LD — rich snippets Google */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Peut-on vraiment voir des tortues marines à Arlet ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui. Grande Anse d'Arlet est l'un des seuls spots de Martinique où les tortues marines viennent se nourrir régulièrement dans les herbiers juste sous la plage. Arrivez entre 7h et 9h du matin, entrez dans l'eau côté gauche de la plage (vers la pointe rocheuse) avec un simple masque et un tuba — aucune bouteille ni guide nécessaires."
            }
          },
          {
            "@type": "Question",
            "name": "À quelle heure aller à Arlet pour voir les tortues ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Le meilleur créneau est entre 7h et 9h du matin. Les tortues remontent régulièrement respirer (toutes les 5 à 10 minutes). Restez immobile à la surface sans tenter de les toucher."
            }
          },
          {
            "@type": "Question",
            "name": "C'est loin d'Arlet depuis Sainte-Luce ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Non, seulement 35 à 40 minutes en voiture via la N6 vers Le Diamant puis la côte caraïbe. Nos villas à Sainte-Luce sont donc une base idéale pour visiter Arlet, Le Diamant (15 min) ou Les Salines (25-30 min)."
            }
          },
          {
            "@type": "Question",
            "name": "Faut-il un équipement de plongée pour voir les tortues à Arlet ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Non, un simple masque et un tuba suffisent — l'eau est peu profonde (1 à 4 m) et la visibilité excellente. Vous pouvez louer le matériel sur la plage pour 5 à 8 € par personne. Utilisez de préférence une crème solaire minérale pour protéger les coraux."
            }
          },
          {
            "@type": "Question",
            "name": "Où se garer à Grande Anse d'Arlet ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Un parking se trouve à l'entrée du village. Il est payant en haute saison (2 à 3 €). Arrivez tôt le matin pour trouver facilement une place et profiter des meilleures conditions pour les tortues."
            }
          }
        ]
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

        <GuideHero
          img={HERO_IMG}
          alt="Grande Anse d'Arlet — plage et tortues marines, Martinique"
          eyebrow="Guide de voyage · Résidence Amaryllis"
          title="Grande Anse d'Arlet"
          subtitle="L'endroit de Martinique où vous nagez avec les tortues marines — à 2 mètres du bord, sans équipement spécial."
          badges={badges}
          navBack={{ href: "/guide-hub", label: "Tous les guides" }}
        />

        {/* ── CONTENU ── */}
        <div id="spots" style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 80px" }}>

          {spots.map((spot, si) => {
            if (spot.must) {
              return (
                <div key={si} className="must-card">
                  <div className="must-card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <span style={{ fontSize: 32 }}>{spot.emoji}</span>
                      <span style={{ background: CORAL, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100 }}>Must absolu</span>
                    </div>
                    <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 4vw, 34px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 14px", lineHeight: 1.15 }}>
                      {spot.titre}
                    </h2>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, lineHeight: 1.65, color: "rgba(250,245,233,0.75)", margin: 0, fontStyle: "italic" }}>
                      {spot.accroche}
                    </p>
                  </div>
                  <div className="must-card-body">
                    {spot.contenu.map((item, ii) => (
                      <div key={ii} className="must-item">
                        <h4>{item.nom}</h4>
                        <p>{item.texte}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div key={si} className="regular-section">
                <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                  <span>{spot.emoji}</span><span>{spot.titre}</span>
                </h2>
                {spot.contenu.map((item, ii) => (
                  <div key={ii} className="regular-card">
                    {ii === 0 && spot.img && (
                      <WikiImg src={spot.img} alt={item.nom} loading="lazy" />
                    )}
                    <div className="regular-card-body">
                      <h3>{item.nom}</h3>
                      <p>{item.texte}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <div id="activites">
            <EncartActivite activites={[ACTIVITES.catamaran, ACTIVITES.dauphins]} />
          </div>
          <EncartActivite activites={[ACTIVITES.tortues, ACTIVITES.snorkeling]} />

          {/* ── INFOS PRATIQUES ── */}
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 20 }}>
            🗓️ Infos pratiques
          </h2>
          <div className="practical-grid">
            {[
              { label: "Depuis Sainte-Luce", value: "35-40 minutes — N6 vers Le Diamant puis côte caraïbe" },
              { label: "Meilleur moment", value: "7h–9h du matin pour les tortues · Coucher de soleil pour les photos" },
              { label: "Parking", value: "Entrée du village, payant en haute saison (2–3€)" },
              { label: "Snorkeling", value: "Location masque + tuba sur la plage · 5–8€/pers." },
            ].map(item => (
              <div key={item.label} className="practical-item">
                <div className="pi-label">{item.label}</div>
                <div className="pi-value">{item.value}</div>
              </div>
            ))}
          </div>

          <BridgeVilla
  villaId="amaryllis"
  lieu="Grande Anse d'Arlet"
  tempsRoute="35-40 min"
  copy="Organisez ces journées à Arlet depuis la Villa Amaryllis : à 35-40 min par la côte caraïbe, piscine à débordement et vue mer au retour, réservation en direct sans commission."
/>
          <div id="programme">
          <ProgrammeSejour
  jours={[
    {
      jour: "Jour 1",
      titre: "Tortues au lever du jour & village de pêcheurs",
      matin: "Départ tôt de Sainte-Luce pour être à Grande Anse d'Arlet entre 7h et 9h. Snorkeling au-dessus des herbiers côté gauche de la plage, vers la pointe rocheuse, pour nager avec les tortues vertes (masque + tuba loués sur place, 5-8€).",
      apresMidi: "Déjeuner de poisson frais les pieds dans le sable (Le Ti Sable ou Chez Nana), puis baignade familiale sur l'arc de sable et balade dans le village de pêcheurs ; 15 min à pied vers Petite Anse d'Arlet pour un second spot de snorkeling plus sauvage.",
      soir: "Retour vers la villa pour le coucher de soleil sur la côte caraïbe.",
    },
    {
      jour: "Jour 2",
      titre: "Journée en mer — dauphins, voile & îlets",
      matin: "Embarquement pour une sortie catamaran à la journée sur la côte caraïbe : observation des dauphins en liberté, navigation à la voile et arrêts snorkeling au-dessus des coraux.",
      apresMidi: "Suite de la croisière vers les îlets du Sud, déjeuner à bord et baignade dans les eaux peu profondes avant le retour au port.",
    },
  ]}
/>
          </div>

          {/* ── MAILLAGE VILLAS ── */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 16px" }}>Nos villas à 35-40 min d'Arlet</p>
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

          {/* ── CTA ── */}
          <div style={{ background: NAVY, borderRadius: 20, padding: "44px 36px", textAlign: "center", marginBottom: 40 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>Base idéale pour le sud</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px" }}>Nos villas à Sainte-Luce</h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 15, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Arlet à 35-40 min, Le Diamant à 15 min, Les Salines à 25-30 min. Piscine privée, vue mer, réservation directe.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "15px 36px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>Voir toutes nos villas</a>
          </div>

          {/* ── NAV BAS DE PAGE ── */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/guide-sainte-anne" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>← Guide Sainte-Anne</a>
            <a href="/guide-hub"             style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>Tous les guides</a>
            <a href="/guide-le-diamant"  style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>Guide Le Diamant →</a>
          </div>
        </div>

                <BlocAffilie slug="arlet" />
        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-arlet" />
        </div>

        <div style={{ background: NAVY, padding: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,0.4)", fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,0.4)", textDecoration: "none" }}>villamaryllis.com</a>
            {" · "}
            <span style={{ fontSize: 11, opacity: 0.7 }}>Photos © Wikimedia Commons (CC BY-SA)</span>
          </p>
        </div>
        <MaillageCluster currentSlug="guide-arlet" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
