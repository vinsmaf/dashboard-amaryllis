// Guide Randonnées Martinique — /guide-randonnees-martinique
// Design immersif v2 — sentiers, sommets & forêts tropicales

import SEOMeta from "./SEOMeta.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG  = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Montagne_Pel%C3%A9e_Martinique_2.jpg/960px-Montagne_Pel%C3%A9e_Martinique_2.jpg";
const CARAVELLE_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Presqu%27%C3%AEle_de_la_Caravelle_Martinique.jpg/960px-Presqu%27%C3%AEle_de_la_Caravelle_Martinique.jpg";

const badges = [
  { icon: "🌋", label: "Montagne Pelée 1 397 m", must: true },
  { icon: "🦜", label: "Réserve Caravelle", must: true },
  { icon: "🐢", label: "Anse Noire & tortues" },
  { icon: "🌿", label: "Forêt de Montravail — 10 min" },
  { icon: "🏔️", label: "Pitons du Carbet" },
];

const spots = [
  {
    must: true,
    emoji: "🌋",
    titre: "Montagne Pelée — le sommet de la Martinique",
    accroche: "À 1 397 mètres d'altitude, la Pelée n'est pas seulement le point culminant de l'île : c'est un volcan actif dont l'éruption de 1902 a effacé la ville de Saint-Pierre en quelques minutes. Gravir son cratère, c'est marcher sur l'histoire et embrasser l'île entière du regard.",
    img: null,
    contenu: [
      {
        nom: "La randonnée",
        texte: "Départ depuis le parking de l'Aileron (commune de Morne Rouge), à environ 1h15 de Sainte-Luce. Le sentier principal monte en 2h30 à 3h (aller) à travers une végétation qui change radicalement d'altitude en altitude : forêt tropicale humide, puis landes d'altitude battues par les nuages, puis roche volcanique nue. Le retour prend environ 2h. Comptez une journée complète.",
      },
      {
        nom: "Ce qu'on voit au sommet",
        texte: "Par temps clair (plutôt le matin, avant que les nuages s'installent), la vue porte jusqu'à la Dominique au nord et à Sainte-Lucie au sud. On distingue l'ensemble du relief martiniquais — les Pitons du Carbet, la baie de Fort-de-France, la presqu'île de la Caravelle. Le cratère Dolomieu, endormi, impressionne par son silence.",
      },
      {
        nom: "Équipement & conseils",
        texte: "La météo change très vite en altitude. Emportez imperméable léger, chaussures de randonnée fermées (le sentier peut être glissant et boueux), 1,5 litre d'eau minimum par personne, coupe-vent et en-cas. Départ conseillé avant 7h pour maximiser la visibilité au sommet. Ne tentez pas la montée si des nuages bas couvrent le massif depuis le départ — la visibilité peut tomber à moins de 5 mètres.",
      },
    ],
  },
  {
    must: true,
    emoji: "🦜",
    titre: "Presqu'île de la Caravelle — réserve naturelle & château Dubuc",
    accroche: "Classée réserve naturelle régionale, la Caravelle est l'une des randonnées les plus complètes de Martinique : mangrove, forêt sèche, falaises battues par l'Atlantique, plages sauvages, et les ruines romantiques du château Dubuc.",
    img: CARAVELLE_IMG,
    contenu: [
      {
        nom: "Le sentier principal",
        texte: "Depuis le parking de la Pointe Caracoli (commune de Trinité, 1h de Sainte-Luce), le sentier de la Caravelle fait environ 12 km aller-retour pour 2h30 à 3h de marche. Le chemin longe les deux côtes de la presqu'île : côté Nord-Atlantique avec ses falaises et ses eaux turquoise, côté baie avec la mangrove et les pélicans. Niveau facile à modéré, bien balisé.",
      },
      {
        nom: "Le château Dubuc",
        texte: "Au bout de la presqu'île, les ruines du château Dubuc (XVIIe–XVIIIe siècle) se dressent sur un promontoire face à l'Atlantique. Ancienne habitation sucrière, le domaine est également lié à une légende de contrebande et de naufrageurs. L'accès aux ruines est payant (~3€), géré par le Conservatoire du Littoral. Prévoir 45 min de visite sur place.",
      },
      {
        nom: "Faune & plages",
        texte: "La réserve abrite une biodiversité remarquable : frégates, pélicans bruns, crabes violonistes dans la mangrove, iguanes. Deux petites plages sauvages s'intercalent sur le parcours — idéales pour une pause baignade. L'eau côté baie est plus calme, côté Atlantique déconseillée à la natation en raison des courants.",
      },
    ],
  },
  {
    must: false,
    emoji: "🌊",
    titre: "Anse Noire & Anse Dufour — sentier côtier et tortues",
    accroche: null,
    img: null,
    contenu: [
      {
        nom: "Le sentier",
        texte: "Ces deux anses du sud-ouest martiniquais (commune des Anses-d'Arlet) sont reliées par un sentier côtier de 20 minutes. L'Anse Dufour s'ouvre sur une baie de sable gris où des bateaux de pêche colorés restent amarrés — ambiance authentique. L'Anse Noire, 10 minutes plus loin, doit son nom à sa plage de sable volcanique sombre, bordée de cocotiers. Paysage saisissant.",
      },
      {
        nom: "Les tortues",
        texte: "L'Anse Noire est l'un des spots de snorkeling les plus accessibles de Martinique pour observer des tortues marines. Elles fréquentent régulièrement la baie et s'approchent sans crainte des nageurs. À moins de 20 mètres du bord, dans 2 à 4 mètres d'eau. Masque et tuba suffisent. La meilleure heure : tôt le matin, avant l'arrivée des groupes.",
      },
      {
        nom: "Infos pratiques",
        texte: "Parking à Anse Dufour (arriver tôt, places limitées). Snacks et restaurants de poisson à Anse Dufour. Depuis Sainte-Luce : 40 à 45 min par la D7 puis la D37 via Les Anses-d'Arlet. La combinaison sentier + snorkeling tient en 2h, parfaite pour une demi-journée.",
      },
    ],
  },
  {
    must: false,
    emoji: "🌿",
    titre: "Forêt de Montravail — la randonnée du voisinage",
    accroche: null,
    img: null,
    contenu: [
      {
        nom: "À 10 minutes des villas",
        texte: "La forêt domaniale de Montravail est la randonnée la plus proche de nos villas à Sainte-Luce. Le massif couvre plusieurs centaines d'hectares de forêt tropicale humide sur les hauteurs de Sainte-Luce et de Rivière-Pilote. Sentiers balisés, ombre permanente, température agréable même en plein été. Idéal pour une sortie matinale avant la plage.",
      },
      {
        nom: "Les sentiers",
        texte: "Plusieurs circuits courts (1h à 2h) permettent d'explorer la forêt à son rythme. Le sentier principal part du parking de Montravail et monte progressivement à travers bambouseraies, fougères arborescentes et kapokiers centenaires. Biodiversité riche : colibris, anolis, bananes sauvages. Niveau facile, accessible avec des enfants équipés de bonnes chaussures.",
      },
      {
        nom: "La distillerie Trois-Rivières",
        texte: "À quelques minutes en voiture depuis Montravail, la distillerie Trois-Rivières (Sainte-Luce) propose des visites guidées de ses champs de canne et de son atelier de distillation. Rhum agricole AOC Martinique. Boutique et dégustation sur place. Une belle demi-journée nature + culture locale.",
      },
    ],
  },
  {
    must: false,
    emoji: "🏔️",
    titre: "Les Pitons du Carbet — massif central & biodiversité",
    accroche: null,
    img: null,
    contenu: [
      {
        nom: "Le massif",
        texte: "Les cinq Pitons du Carbet forment le cœur montagneux de la Martinique, s'élevant jusqu'à 1 196 mètres (Piton Lacroix). Situés au centre de l'île, ils sont visibles depuis presque partout — et visibles depuis nos villas par temps clair. Le massif abrite la forêt tropicale la plus dense de l'île, classée en réserve biologique intégrale.",
      },
      {
        nom: "Les randonnées",
        texte: "L'accès principal se fait depuis la route de la Trace (N3), entre Fort-de-France et Morne Rouge. Le sentier du Piton Boucher (970 m, 3h aller-retour) est le plus accessible. Les Pitons supérieurs exigent une condition physique solide, un guide recommandé hors saison sèche, et une bonne connaissance des conditions météo locales — le massif reçoit parmi les plus fortes pluviométries de l'île.",
      },
      {
        nom: "Faune & flore",
        texte: "La biodiversité des Pitons est exceptionnelle : orchidées endémiques, bromeliaceae, anolis à crête (espèce protégée), martinets à gorge blanche. Les botanistes et ornithologues font régulièrement du massif une destination en soi. Prévoir équipement imperméable complet — les nuages peuvent s'installer en quelques minutes même par beau temps côtier.",
      },
    ],
  },
];

const pratique = [
  { icon: "🌋", label: "Montagne Pelée", valeur: "Départ Aileron (Morne Rouge) · 1h15 de Sainte-Luce · 3–5h · Niveau moyen-difficile" },
  { icon: "🦜", label: "Presqu'île Caravelle", valeur: "Départ Pointe Caracoli (Trinité) · 1h de Sainte-Luce · 2h30–3h · Niveau facile-moyen" },
  { icon: "🌊", label: "Anse Noire & Dufour", valeur: "Parking Anse Dufour · 40 min de Sainte-Luce · 1–2h · Niveau facile" },
  { icon: "🌿", label: "Forêt de Montravail", valeur: "10 min des villas · 1–2h · Niveau facile · Idéal avec enfants" },
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
  .gt-must-accroche {
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
  .gt-must-texte {
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
  .gt-item-texte {
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

export default function GuideRandonnees() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta title="Randonnées Martinique — Montagne Pelée, Caravelle, Sentiers | Amaryllis" description="Meilleures randonnées en Martinique : Montagne Pelée (1397m), Presqu'île de la Caravelle, forêt tropicale. Niveaux débutant à expert. Depuis Sainte-Luce." canonical="/guide-randonnees-martinique" image="https://villamaryllis.com/photos/randonnees-martinique.avif" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Randonnées Martinique — Montagne Pelée, Caravelle, Forêt de Montravail et Pitons du Carbet",
        "description": "Guide complet des randonnées en Martinique depuis Sainte-Luce : Montagne Pelée (1397m), Presqu'île de la Caravelle, Anse Noire, Forêt de Montravail, Pitons du Carbet.",
        "url": `${BASE}/guide-randonnees-martinique`,
        "image": HERO_IMG,
        "author": { "@type": "Organization", "name": "Amaryllis Locations", "url": BASE },
        "publisher": { "@type": "Organization", "name": "Amaryllis Locations", "url": BASE },
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        {/* HEADER */}
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 17, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <a href="/guide-hub" style={{ color: "rgba(250,245,233,.55)", textDecoration: "none", fontSize: 12, letterSpacing: "0.08em" }}>← Tous les guides</a>
          </div>
        </header>

        {/* HERO */}
        <div style={{
          position: "relative", height: "min(90vh, 620px)", overflow: "hidden",
          backgroundImage: `url(${HERO_IMG})`,
          backgroundSize: "cover", backgroundPosition: "center 40%",
          backgroundColor: "#0a2e2d",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(14,59,58,.15) 0%, rgba(14,59,58,.82) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 28px 48px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>
              <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: "'Jost', sans-serif" }}>
                Depuis Sainte-Luce · Tous niveaux
              </p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 6vw, 56px)", letterSpacing: "0.06em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px", lineHeight: 1.05 }}>
                Randonnées<br />Martinique
              </h1>
              <p style={{ color: "rgba(250,245,233,.85)", fontSize: "clamp(15px, 2vw, 18px)", maxWidth: 500, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Montagne Pelée, Presqu'île de la Caravelle, forêt de Montravail — les plus beaux sentiers de l'île, à portée de vos villas.
              </p>
            </div>
          </div>
        </div>

        {/* CONTENU */}
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "52px 24px 80px" }}>

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
          <div style={{ background: NAVY, borderRadius: 16, padding: "36px 28px", textAlign: "center", marginBottom: 48 }}>
            <p style={{ color: CORAL, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Jost', sans-serif" }}>Base idéale</p>
            <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 22, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 12px" }}>
              Sainte-Luce — au cœur du sud
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
            <a href="/activites-sainte-luce" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>
              ← Activités Sainte-Luce
            </a>
            <a href="/guide-hub" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>
              Tous les guides →
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ background: NAVY, padding: "20px 24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,.35)", fontSize: 12, margin: 0, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,.35)", textDecoration: "none" }}>villamaryllis.com</a>
          </p>
        </div>
      </div>
    </>
  );
}
