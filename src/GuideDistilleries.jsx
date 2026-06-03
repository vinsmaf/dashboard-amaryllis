// Guide Distilleries de Rhum Martinique — /guide-distilleries-martinique
// Design immersif v2 — rhum agricole AOC & terroir martiniquais

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";

// Noms canoniques des biens pour le maillage interne SEO ("villa" = Amaryllis + Iguana uniquement).
const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Studio Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Rhum_J.M_distillery%2C_Macouba%2C_Martinique.jpg/960px-Rhum_J.M_distillery%2C_Macouba%2C_Martinique.jpg";

// FAQ visible — IDENTIQUE au JSON-LD de functions/[slug].js (slug guide-distilleries-martinique).
const FAQ = [
  { q: "Quelles distilleries visiter en Martinique depuis Sainte-Luce ?", a: "Trois-Rivières est à 5 min de Sainte-Luce. À découvrir aussi : l'Habitation Clément (musée et jardins), Saint-James à Sainte-Marie, JM à Macouba et Depaz au pied de la Montagne Pelée." },
  { q: "Le rhum martiniquais a-t-il une AOC ?", a: "Oui, le rhum agricole de Martinique bénéficie d'une AOC depuis 1996 : il est distillé à partir de pur jus de canne fraîche, et non de mélasse." },
  { q: "Peut-on visiter les distilleries en une journée ?", a: "Oui, un circuit en une journée est possible. Les boutiques proposent dégustations et ventes directes ; pensez à un conducteur désigné." },
];

const badges = [
  { icon: "🥃", label: "AOC Martinique", must: true },
  { icon: "🌿", label: "Trois-Rivières à 5 min" },
  { icon: "🏛️", label: "Musées & habitations" },
  { icon: "🚗", label: "Circuit en une journée" },
  { icon: "🎁", label: "Boutiques & dégustations" },
];

const spots = [
  {
    must: true,
    emoji: "🥃",
    titre: "Distillerie JM — le rhum d'altitude de Macouba",
    accroche: "Au bout de la route du nord, dans le village de Macouba, la distillerie JM produit l'un des rhums agricoles les plus réputés au monde. Ici, la canne pousse à flanc de montagne, à quelques centaines de mètres de la mer.",
    img: null,
    contenu: [
      {
        nom: "Pourquoi JM est unique",
        texte: "Fondée en 1845, la distillerie J.M est nichée dans le nord sauvage de la Martinique, à Macouba, là où le massif de la Montagne Pelée rencontre l'Atlantique. La canne à sucre pousse sur des terres volcaniques riches, irriguées par les pluies tropicales — un terroir sans équivalent dans la Caraïbe. La distillerie est l'une des rares à produire en colonne créole continue depuis plus d'un siècle. Le résultat : des rhums d'une complexité aromatique exceptionnelle, reconnus dans les concours internationaux.",
      },
      {
        nom: "La visite",
        texte: "La visite guidée (environ 1h30) emmène dans les champs, la salle de broyage de la canne fraîche, puis dans le chai de vieillissement où reposent les barriques de chêne. La dégustation finale propose les cuvées JM classiques ainsi que des rhums vieillis hors d'âge. Tarif adulte ~10€. Ouvert en semaine 9h–17h, samedi 9h–13h. Réservation conseillée en haute saison.",
      },
      {
        nom: "Le trajet depuis Sainte-Luce",
        texte: "Comptez environ 1h15 depuis Sainte-Luce (N5 → N1 vers le nord, puis D10 vers Macouba). La route finale est sinueuse et spectaculaire — falaises, bananiers, vues sur l'Atlantique. À combiner avec un déjeuner à Grand-Rivière (terminus de la route du nord) et le retour par la côte caraïbe pour une journée de circuit complet.",
      },
    ],
  },
  {
    must: false,
    emoji: "🏛️",
    titre: "Habitation Clément — musée, jardins & art contemporain",
    accroche: null,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Habitation_Cl%C3%A9ment_-_Le_Fran%C3%A7ois_-_Martinique.jpg/960px-Habitation_Cl%C3%A9ment_-_Le_Fran%C3%A9ois_-_Martinique.jpg",
    contenu: [
      {
        nom: "Une habitation coloniale devenue musée",
        texte: "L'Habitation Clément, au François (côte Atlantique), est l'une des plus belles propriétés historiques de Martinique. L'ancienne distillerie est désormais un musée immersif consacré au rhum agricole et à l'histoire créole. Le domaine de 12 hectares abrite un parc botanique remarquable, une collection de bouteilles historiques et une série d'œuvres d'art contemporain intégrées dans le paysage.",
      },
      {
        nom: "Ce qu'on y voit",
        texte: "La visite comprend la maison de maître (mobilier créole d'époque), les chais de vieillissement avec leurs rangées de barriques, le jardin tropical avec arbres centenaires, et un espace d'exposition permanent sur l'histoire du rhum AOC. Des expositions temporaires d'artistes caribéens y sont organisées tout au long de l'année. Comptez 2h minimum. Tarif adulte ~12€. Ouvert 7j/7, 9h–17h.",
      },
      {
        nom: "Le rhum Clément",
        texte: "La production est aujourd'hui réalisée à la distillerie Simon (même groupe), mais l'Habitation reste le cœur symbolique de la marque. La boutique propose l'ensemble des cuvées Clément — dont les millésimés vieillis plus de dix ans — à des prix équivalents à la distillerie, sans la majoration des cavistes.",
      },
    ],
  },
  {
    must: false,
    emoji: "⛵",
    titre: "Distillerie Saint-James — musée du rhum & barriques de Sainte-Marie",
    accroche: null,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Saint-James_distillery_Martinique_2013.jpg/960px-Saint-James_distillery_Martinique_2013.jpg",
    contenu: [
      {
        nom: "La plus ancienne marque exportée",
        texte: "Fondée en 1765 par des religieux, Saint-James est la marque de rhum martiniquais la plus ancienne à avoir été exportée vers l'Europe. L'ancienne distillerie de Sainte-Marie (côte Atlantique, nord de l'île) abrite aujourd'hui un musée consacré à l'histoire du rhum — transport maritime, distillation, évolution des techniques sur deux siècles.",
      },
      {
        nom: "Le musée",
        texte: "La collection comprend des alambics d'époque, des locomotives de plantation, des maquettes de navires négriers et de navires marchands. La scénographie est sobre et documentée. Idéal pour comprendre la place du rhum dans l'économie martiniquaise avant la visite d'une distillerie en activité. Tarif adulte ~5€. Dégustation comprise. Ouvert lun–sam 9h–18h.",
      },
      {
        nom: "À proximité : la distillerie en activité",
        texte: "La production Saint-James a été relocalisée à Sainte-Marie dans une distillerie moderne. Certaines visites combinent le musée historique et le site de production actuel. Renseignez-vous à l'accueil pour le planning des tours en saison (jan–août, pic de production de la canne).",
      },
    ],
  },
  {
    must: false,
    emoji: "🌋",
    titre: "Distillerie Depaz — au pied de la Montagne Pelée",
    accroche: null,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Distillerie_Depaz_-_Saint-Pierre_-_Martinique.jpg/960px-Distillerie_Depaz_-_Saint-Pierre_-_Martinique.jpg",
    contenu: [
      {
        nom: "Un décor de film",
        texte: "Construite sur les flancs de la Montagne Pelée, à Saint-Pierre, la distillerie Depaz est l'une des plus photogéniques de Martinique. Le château Belle-Vue qui la domine a été reconstruit après l'éruption de 1902 qui avait détruit Saint-Pierre et tué 30 000 personnes. Aujourd'hui, la propriété cultive sa canne sur des terres fertilisées par des siècles de cendres volcaniques.",
      },
      {
        nom: "La visite & le rhum",
        texte: "La visite guidée (1h) montre l'ensemble du processus de transformation de la canne fraîche en rhum agricole. La gamme Depaz comprend des blancs à 50° et 55°, des rhums paille et ambrés, ainsi que des cuvées réservées vieillies en fûts de chêne blanc. La salle de dégustation offre une vue directe sur la montagne. Tarif adulte ~8€. Ouvert lun–sam 9h–17h30.",
      },
      {
        nom: "Combiner avec Saint-Pierre",
        texte: "Saint-Pierre, à 2 km, est une étape incontournable : c'était la capitale culturelle de la Martinique avant l'éruption. Le musée vulcanologique et les épaves sous-marines (plongée possible) complètent parfaitement la visite de Depaz. Prévoyez la journée entière pour ce secteur nord-caraïbe.",
      },
    ],
  },
  {
    must: false,
    emoji: "🌿",
    titre: "Distillerie Trois-Rivières — à 5 min de vos villas",
    accroche: null,
    img: null,
    contenu: [
      {
        nom: "La distillerie du quartier",
        texte: "Installée à Sainte-Luce depuis le XVIIe siècle, la distillerie Trois-Rivières est la plus proche des villas Amaryllis — moins de 5 minutes en voiture. Elle produit l'un des rhums agricoles AOC les plus primés de la Caraïbe, à partir de cannes cultivées sur les hauteurs de la commune. C'est l'escale parfaite pour une fin d'après-midi avant de rentrer à la villa.",
      },
      {
        nom: "Visite & boutique",
        texte: "La visite libre (gratuite) permet de parcourir les chais, observer les colonnes de distillation et lire la frise historique. La visite guidée (~1h, ~6€) ajoute une dégustation commentée des différentes gammes : blanc, paille, ambré, vieux. La boutique propose les rhums en exclusivité distillerie ainsi que des rhums arrangés et des coffrets cadeaux. Ouvert lun–sam 9h–12h30 et 14h–17h30.",
      },
      {
        nom: "Un rhum de terroir volcan-mer",
        texte: "Le terroir de Sainte-Luce est particulier : la canne pousse sur des pentes douces exposées aux alizés, avec un ensoleillement intense et une faible pluviométrie. Cela donne des rhums agricoles plus ronds, moins végétaux que ceux du nord — idéaux en ti' punch ou en cocktail. Les cuvées Cœur de Canne et Rhum Vieux XO sont les signatures de la maison à ne pas manquer.",
      },
    ],
  },
];

const pratique = [
  { icon: "🚗", label: "Trois-Rivières depuis villas", valeur: "5 min (Sainte-Luce, D7)" },
  { icon: "🗺️", label: "Circuit complet (JM + Clément)", valeur: "Journée entière · ~150 km aller" },
  { icon: "🕘", label: "Horaires généraux", valeur: "Lun–Sam · 9h–17h · Fermé dim sauf fêtes" },
  { icon: "💶", label: "Budget visites", valeur: "5€ à 12€/personne · dégustations incluses" },
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

export default function GuideDistilleries() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta title="Distilleries de Rhum Martinique — Rhum Agricole AOC | Amaryllis" description="Visitez les meilleures distilleries de rhum agricole en Martinique : JM, Clément, Saint-James, Depaz, Trois-Rivières. Guide complet depuis Sainte-Luce." canonical="/guide-distilleries-martinique" image="https://villamaryllis.com/photos/distilleries-martinique.avif" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Distilleries de Rhum Agricole Martinique — Guide : JM, Clément, Saint-James, Depaz, Trois-Rivières",
        "description": "Guide complet des distilleries de rhum agricole AOC en Martinique depuis Sainte-Luce : JM (Macouba), Habitation Clément, Saint-James, Depaz (Saint-Pierre), Trois-Rivières.",
        "url": `${BASE}/guide-distilleries-martinique`,
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
                AOC Martinique · 5 distilleries à visiter
              </p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 6vw, 56px)", letterSpacing: "0.06em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px", lineHeight: 1.05 }}>
                Distilleries<br />de Rhum
              </h1>
              <p style={{ color: "rgba(250,245,233,.85)", fontSize: "clamp(15px, 2vw, 18px)", maxWidth: 500, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                JM, Clément, Saint-James, Depaz, Trois-Rivières — le rhum agricole AOC au cœur du voyage en Martinique.
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
              Sainte-Luce — à 5 min de Trois-Rivières
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
        {/* FAQ visible (cohérence avec le JSON-LD) */}
        <section style={{ maxWidth: 760, margin: "48px auto", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 30, color: NAVY, textAlign: "center", margin: "0 0 24px" }}>Questions fréquentes</h2>
          {FAQ.map((f, i) => (
            <details key={i} style={{ borderTop: `1px solid ${SAND}`, padding: "14px 0" }}>
              <summary style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 15, color: NAVY, cursor: "pointer" }}>{f.q}</summary>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: MUTED, lineHeight: 1.6, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </section>
        <MaillageCluster currentSlug="guide-distilleries-martinique" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
