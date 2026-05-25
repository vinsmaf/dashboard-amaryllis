// Guide Les Trois-Îlets Martinique — /guide-trois-ilets
// Design immersif v2 — village créole & naissance de l'Impératrice

import SEOMeta from "./SEOMeta.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG  = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg/960px-Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg";
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

        {/* HEADER */}
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 17, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <a href="/guide" style={{ color: "rgba(250,245,233,.55)", textDecoration: "none", fontSize: 12, letterSpacing: "0.08em" }}>← Tous les guides</a>
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
                35 min de Sainte-Luce · Presqu'île du Diamant
              </p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 6vw, 56px)", letterSpacing: "0.06em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px", lineHeight: 1.05 }}>
                Les<br />Trois-Îlets
              </h1>
              <p style={{ color: "rgba(250,245,233,.85)", fontSize: "clamp(15px, 2vw, 18px)", maxWidth: 500, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Village créole, Musée de la Pagerie, marina face à Fort-de-France — et la plage d'Anse Mitan.
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
            <a href="/guide" style={{ color: MUTED, textDecoration: "none", fontSize: 13, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>
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
