// Guide Saint-Pierre Martinique — /guide-saint-pierre-martinique
// Pompéi des Caraïbes : éruption 1902, épaves de plongée, ruines

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";

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

const HERO_IMG  = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Saint-Pierre_Martinique_ruins.jpg/960px-Saint-Pierre_Martinique_ruins.jpg";
const WRECK_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Roraima_wreck_Saint-Pierre_Martinique.jpg/960px-Roraima_wreck_Saint-Pierre_Martinique.jpg";
const RUINS_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Saint-Pierre_theatre_ruins_Martinique.jpg/960px-Saint-Pierre_theatre_ruins_Martinique.jpg";

const badges = [
  { icon: "🌋", label: "Éruption 1902 — 30 000 morts", must: true },
  { icon: "🤿", label: "18 épaves de plongée", must: true },
  { icon: "📍", label: "1h de Sainte-Luce" },
  { icon: "🏛️", label: "Musée Frank Perret" },
  { icon: "🚶", label: "Ruines & théâtre" },
];

const spots = [
  {
    must: true,
    emoji: "🌋",
    titre: "L'éruption de la Montagne Pelée — 8 mai 1902",
    accroche: "En quelques minutes, la ville la plus riche des Antilles françaises — surnommée le « Petit Paris des Caraïbes » — disparut sous une nuée ardente. Trente mille habitants périrent. Un seul homme survécut dans la ville.",
    img: null,
    contenu: [
      {
        nom: "La catastrophe",
        texte: "Le 8 mai 1902 à 7h52, la Montagne Pelée libère une nuée ardente — un mélange de gaz brûlants, de cendres et de roches en fusion — qui dévale à 700 km/h vers Saint-Pierre. La ville entière est anéantie en moins de deux minutes. Aucune autre catastrophe volcanique moderne n'a tué autant de personnes aussi rapidement. Les flammes atteignent 1 000°C et carbonisent tout sur leur passage.",
      },
      {
        nom: "Le seul survivant de la ville",
        texte: "Louis-Auguste Cyparis, un condamné incarcéré dans une cellule de pierre semi-souterraine à la prison de Saint-Pierre, survit miraculeusement — protégé par les épais murs de sa geôle. Gravement brûlé, il est retrouvé quatre jours plus tard, encore vivant. Gracié, il sera ensuite exhibé au cirque Barnum & Bailey aux États-Unis comme le « seul survivant de la catastrophe ». Sa cellule existe encore aujourd'hui et se visite.",
      },
      {
        nom: "Saint-Pierre avant l'éruption",
        texte: "En 1902, Saint-Pierre comptait 30 000 habitants et était le centre économique, culturel et politique de la Martinique. Elle possédait un théâtre à l'italienne, un câble télégraphique transatlantique, une cathédrale, des consulats étrangers et une vie mondaine intense. La ville était la capitale de facto de la Martinique avant Fort-de-France. L'éruption effaça cette métropole caribéenne de la carte en quelques secondes.",
      },
    ],
  },
  {
    must: true,
    emoji: "🤿",
    titre: "Les épaves de plongée — un musée sous-marin unique",
    accroche: "Le 8 mai 1902, dix-huit navires ancrés dans la rade de Saint-Pierre coulèrent en quelques minutes. Cent vingt ans plus tard, ils gisent entre 5 et 55 mètres de fond et constituent l'un des sites de plongée les plus exceptionnels des Caraïbes.",
    img: null,
    contenu: [
      {
        nom: "Pourquoi ces épaves sont uniques",
        texte: "Contrairement à la plupart des épaves de guerre, celles de Saint-Pierre ont coulé intactes — non torpillées, non bombardées. Les coques sont donc préservées dans leur configuration d'époque : canons, ancres, cargaisons, vaisselle, machines à vapeur. La visibilité dans ces eaux est souvent supérieure à 20 mètres. Jacques-Yves Cousteau les a explorées et filmées dans les années 1970, les qualifiant de « merveille sous-marine des Caraïbes ».",
      },
      {
        nom: "Les épaves accessibles",
        texte: "Le Roraima (cargo anglais, 55 m de profondeur — pour plongeurs confirmés), le Tamaya (20 m, accessible aux débutants), le Gabrielle (accessible dès le niveau 1, entre 15 et 28 m) et le Burselem comptent parmi les plus visitées. Plusieurs clubs de plongée proposent des sorties depuis Saint-Pierre même : comptez 45–60€ par plongée, équipement inclus. La saison idéale va de novembre à mai.",
      },
      {
        nom: "Snorkeling et baptêmes",
        texte: "Même sans certification de plongée, certains sites peu profonds (5–8 m) sont accessibles en snorkeling ou en baptême encadré. Le Gabrielle et le Tamaya offrent des parties de coque visibles depuis la surface par eau claire. Les clubs locaux proposent des baptêmes dès 12 ans. Réservation indispensable en haute saison — les spots sont partagés entre plusieurs établissements.",
      },
    ],
  },
  {
    must: false,
    emoji: "🏛️",
    titre: "Le musée Frank Perret",
    accroche: null,
    img: WRECK_IMG,
    contenu: [
      {
        nom: "La collection",
        texte: "Installé dans une demeure du XIXe siècle rescapée des décombres, le musée Frank Perret rassemble les vestiges les plus saisissants de la catastrophe : horloges arrêtées à l'heure exacte de l'éruption (7h52), verres et bouteilles déformés par la chaleur, cloches de cathédrale fondues, objets du quotidien carbonisés. Chaque pièce raconte une vie interrompue net. La collection, constituée par le volcanologue américain Frank Perret dans les années 1930, n'a pas d'équivalent aux Caraïbes.",
      },
      {
        nom: "La visite",
        texte: "Comptez 45 minutes à 1h15. Ouvert du lundi au samedi, 9h–17h. Tarif adulte ~4€. Un guide peut être sollicité sur place — fortement recommandé pour contextualiser les objets. Le musée est situé en plein centre du bourg de Saint-Pierre, à 5 minutes à pied de l'embarcadère.",
      },
      {
        nom: "Autour du musée",
        texte: "Le bourg actuel de Saint-Pierre a été reconstruit sur les ruines de l'ancienne ville. Plusieurs bâtiments historiques ont été partiellement restaurés et coexistent avec les constructions modernes, créant une atmosphère de palimpseste urbain unique. La rue Victor-Hugo longe les façades éventrées de l'ancienne ville — une promenade de quelques centaines de mètres suffit pour saisir l'échelle de la destruction.",
      },
    ],
  },
  {
    must: false,
    emoji: "🚶",
    titre: "Balade dans les ruines de Saint-Pierre",
    accroche: null,
    img: RUINS_IMG,
    contenu: [
      {
        nom: "Le théâtre",
        texte: "Construit en 1786 et agrandi en 1900 sur le modèle du Grand Théâtre de Bordeaux, il accueillait jusqu'à 800 spectateurs. Ses façades et ses arcades de pierre volcanique ont résisté à la nuée ardente — la charpente et les boiseries ont brûlé, mais le gros-oeuvre tient encore. C'est l'une des ruines les plus photographiées de Martinique. Libre d'accès, toujours debout, envahi par la végétation.",
      },
      {
        nom: "La prison de Cyparis",
        texte: "À deux rues du théâtre, la cellule qui sauva la vie du condamné Louis Cyparis est conservée telle quelle. La porte en fer tordue, les murs noircis, l'ouverture étroite qui laissa passer juste assez d'air pour que l'homme survive : tout est visible. C'est l'un des endroits les plus étranges et les plus puissants de la ville.",
      },
      {
        nom: "La cathédrale et les ruines du bourg",
        texte: "Les ruines de la cathédrale du Mouillage, avec ses clochers partiellement écroulés, offrent un panorama sur la baie depuis les hauteurs du bourg. En descendant vers le front de mer, on longe les vestiges d'entrepôts à rhum, d'hôtels particuliers, de la chambre de commerce. Une carte des ruines est disponible à l'Office de tourisme local (gratuite) — indispensable pour ne pas passer à côté des sites les moins signalés.",
      },
    ],
  },
  {
    must: false,
    emoji: "🌿",
    titre: "Montée vers la Montagne Pelée",
    accroche: null,
    img: null,
    contenu: [
      {
        nom: "La randonnée",
        texte: "La Montagne Pelée culmine à 1 397 mètres et reste un volcan actif classé en vigilance permanente. Plusieurs sentiers permettent d'atteindre le sommet ou les flancs depuis les communes de Saint-Pierre (versant nord-ouest) et de Morne-Rouge (versant sud). La montée depuis l'Aileron (accès depuis Morne-Rouge) est la plus fréquentée : comptez 3h aller-retour pour un randonneur d'expérience. Le sentier est balisé mais certains passages restent techniques par temps humide.",
      },
      {
        nom: "Vue et contexte",
        texte: "Par temps dégagé, le sommet offre un panorama à 360° sur l'île, la mer des Caraïbes et, par grande visibilité, jusqu'à la Dominique au nord. On distingue nettement en contrebas la rade de Saint-Pierre et ses eaux sombres où reposent les épaves. Le contraste entre la végétation luxuriante des flancs et la caldera sommitale nue est saisissant.",
      },
      {
        nom: "Précautions",
        texte: "Partez tôt (avant 7h) — les nuages envahissent le sommet dès 10h–11h en saison humide. Prévoir eau, coupe-vent et chaussures de randonnée. Consulter le bulletin d'activité volcanique de l'OVSM avant de partir (ovsm.ipgp.fr). La randonnée est déconseillée en cas de niveau d'alerte jaune ou supérieur — vérifier la veille.",
      },
    ],
  },
];

const pratique = [
  { icon: "🚗", label: "Depuis Sainte-Luce", valeur: "~1h · N1 vers Fort-de-France puis N2 vers Saint-Pierre" },
  { icon: "🤿", label: "Clubs de plongée", valeur: "Plongée 45–60€ · Baptême ~50€ · Réservation obligatoire" },
  { icon: "🏛️", label: "Musée Frank Perret", valeur: "Lun–Sam 9h–17h · ~4€/adulte · Centre-bourg" },
  { icon: "🌋", label: "Ruines & prison", valeur: "Accès libre · Carte gratuite à l'Office de tourisme" },
  { icon: "🌿", label: "Randonnée Pelée", valeur: "Départ Aileron (Morne-Rouge) · 3h A/R · Chaussures obligatoires" },
  { icon: "🅿️", label: "Parking", valeur: "Gratuit front de mer · Arriver avant 9h en haute saison" },
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

export default function GuideSaintPierre() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta title="Saint-Pierre Martinique — Pompéi des Caraïbes, Plongée & Histoire | Amaryllis" description="Visitez Saint-Pierre, la ville fantôme de Martinique : ruines de 1902, épaves de plongée uniques, musée Perret. Guide complet depuis Sainte-Luce (1h)." canonical="/guide-saint-pierre-martinique" image="https://villamaryllis.com/photos/saint-pierre.avif" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Saint-Pierre Martinique — Pompéi des Caraïbes : éruption 1902, épaves de plongée et ruines",
        "description": "Guide complet de Saint-Pierre depuis Sainte-Luce : l'éruption de la Montagne Pelée 1902, les 18 épaves de plongée, le musée Frank Perret, les ruines du théâtre et la prison de Cyparis. À 1h de nos villas.",
        "url": `${BASE}/guide-saint-pierre-martinique`,
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
                1h de Sainte-Luce · Nord Caraïbe
              </p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 6vw, 56px)", letterSpacing: "0.06em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px", lineHeight: 1.05 }}>
                Saint-Pierre<br />Martinique
              </h1>
              <p style={{ color: "rgba(250,245,233,.85)", fontSize: "clamp(15px, 2vw, 18px)", maxWidth: 500, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                La Pompéi des Caraïbes — éruption de 1902, 18 épaves de plongée légendaires, ruines d'une ville engloutie.
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
              Sainte-Luce — à 1h
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

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-saint-pierre" />
        </div>

        {/* FOOTER */}
        <div style={{ background: NAVY, padding: "20px 24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,.35)", fontSize: 12, margin: 0, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,.35)", textDecoration: "none" }}>villamaryllis.com</a>
          </p>
        </div>
        <MaillageCluster currentSlug="guide-saint-pierre-martinique" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
