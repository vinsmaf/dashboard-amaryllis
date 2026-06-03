// Guide Gastronomie Martinique — /guide-gastronomie-martinique
// Cuisine créole, restaurants & marchés depuis Sainte-Luce

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

const HERO_IMG  = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Accras_de_morue.jpg/960px-Accras_de_morue.jpg";
const MARCHE_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Marche_couvert_de_la_Martinique.jpg/960px-Marche_couvert_de_la_Martinique.jpg";
const FRUITS_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Tropical_fruits.jpg/960px-Tropical_fruits.jpg";

const badges = [
  { icon: "🦞", label: "Langouste & blaff", must: true },
  { icon: "🥃", label: "Rhum agricole AOC", must: true },
  { icon: "🛒", label: "Marché du Marin — sam." },
  { icon: "🍌", label: "Fruits tropicaux" },
  { icon: "🍽️", label: "Restaurants à Sainte-Luce" },
];

const spots = [
  {
    must: true,
    emoji: "🦞",
    titre: "La langouste grillée & le blaff — les deux spécialités à ne pas manquer",
    accroche: "Deux plats résument à eux seuls la cuisine de mer martiniquaise : la langouste grillée au feu de bois et le blaff de poissons, bouillon parfumé aux épices créoles qui réveille tous les sens.",
    img: null,
    contenu: [
      {
        nom: "La langouste grillée",
        texte: "La langouste des Caraïbes (Panulirus argus), plus douce et charnue que son homologue bretonne, est pêchée localement de novembre à avril. Elle se prépare au charbon de bois, badigeonnée d'un beurre citronné aux herbes créoles. À Sainte-Luce, plusieurs restaurants la proposent directement sur la plage. Comptez entre 35 et 60 € selon la taille. Hors saison, préférez le vivaneau rouge (snapper) ou le thon local — tout aussi remarquables.",
      },
      {
        nom: "Le blaff",
        texte: "Le blaff est un court-bouillon de poisson frais poché dans un bouillon épicé : thym, cive, piment, girofle, citron vert, feuilles de bois d'Inde (laurier antillais). Le nom vient du bruit que fait le poisson en tombant dans l'eau bouillante. C'est un plat délicat, rafraîchissant, profondément ancré dans la cuisine populaire martiniquaise. On le trouve dans les restaurants créoles traditionnels et les lolos — petits snacks de bord de route. Tarif habituel : 12 à 18 €.",
      },
      {
        nom: "Où les trouver près de Sainte-Luce",
        texte: "Le bourg de Sainte-Luce concentre plusieurs bonnes adresses le long du front de mer. Pour la langouste grillée au meilleur rapport qualité-prix, dirigez-vous vers les lolos de l'Anse Corps de Garde (5 min en voiture), ouverts le week-end seulement. Le marché couvert de Sainte-Anne (à 20 min) propose aussi des poissons frais entiers à emporter — parfaits si votre villa est équipée d'un barbecue.",
      },
    ],
  },
  {
    must: true,
    emoji: "🥃",
    titre: "Le ti-punch et la culture du rhum martiniquais",
    accroche: "Le rhum de Martinique est le seul rhum au monde à bénéficier d'une Appellation d'Origine Contrôlée (AOC) française. Une exception qui se comprend au premier verre.",
    img: null,
    contenu: [
      {
        nom: "Rhum agricole AOC — ce qui le distingue",
        texte: "Contrairement aux rhums des autres îles fabriqués à partir de mélasse (résidu de la production de sucre), le rhum agricole martiniquais est distillé directement à partir du jus de canne fraîchement pressé. Ce procédé produit un alcool plus végétal, plus aromatique, plus complexe. L'AOC Martinique — obtenue en 1996 — encadre strictement les variétés de canne, les méthodes de distillation, les zones de production et les teneurs en alcool. Il existe moins de dix distilleries sur l'île.",
      },
      {
        nom: "Le ti-punch — les règles non écrites",
        texte: "Le ti-punch (\"petit punch\") est le rituel quotidien de Martinique. Sa composition officielle : rhum blanc agricole, sucre de canne liquide, zeste et jus de citron vert. L'ordre d'assemblage fait débat mais la règle d'or est immuable : chacun prépare son verre lui-même. La formule locale \"chacun prépare sa mort\" traduit cette liberté absolue sur les proportions. Il se boit à toute heure — mais jamais pressé.",
      },
      {
        nom: "Les distilleries à visiter depuis Sainte-Luce",
        texte: "Trois-Rivières (5 min) est la plus proche de nos villas. Elle propose des visites guidées du lundi au samedi, avec dégustation incluse dans le tarif (~8 €). La vue sur le Rocher du Diamant depuis les champs de canne vaut le déplacement à elle seule. La Mauny (15 min vers Le Marin) est plus touristique mais dispose d'un espace muséographique complet sur l'histoire du rhum aux Antilles. Saint-James, à Sainte-Marie (45 min, côte atlantique), possède le musée du rhum le plus documenté de l'île.",
      },
    ],
  },
  {
    must: false,
    emoji: "🛒",
    titre: "Les marchés créoles",
    accroche: null,
    img: MARCHE_IMG,
    contenu: [
      {
        nom: "Le marché du Marin — le samedi matin",
        texte: "À 15 min de Sainte-Luce, le marché de Le Marin est l'un des plus animés du Sud. Il se tient le samedi matin dès 6h sur la place principale. Vous y trouverez : légumes pays (christophines, ignames, madères, giraumons), épices fraîches, herbes aromatiques créoles (cive, thym pays, bois d'Inde), poissons et crustacés, fruits exotiques et préparations maison (pâtes d'épices, sauces chien, boudins créoles). Les prix sont deux à trois fois inférieurs à ceux des supermarchés. Arrivez tôt — les meilleures pièces partent avant 8h.",
      },
      {
        nom: "Le marché couvert de Fort-de-France",
        texte: "La Grand'Marché de Fort-de-France (rue Isambert) est la référence absolue pour les épices et les produits transformés. Ouvert du lundi au samedi. Les étals du rez-de-chaussée proposent les épices en vrac — mélange colombo, cannelle, vanille de Martinique, clous de girofle, muscade — à des prix défiant toute concurrence. À l'étage, les vendeuses cuisinent en direct : accras de morue, bokits, tourments d'amour. Prévoir environ 1h30 de visite.",
      },
      {
        nom: "Le marché de Sainte-Anne",
        texte: "Plus modeste mais très local, le marché de Sainte-Anne (20 min de Sainte-Luce) se tient le dimanche matin. Idéal pour un approvisionnement rapide en produits frais sans faire la route jusqu'à Fort-de-France. Les vendeurs locaux proposent souvent des préparations familiales introuvables ailleurs : confiture de coco, sirop de groseille-pays, punch maison.",
      },
    ],
  },
  {
    must: false,
    emoji: "🍌",
    titre: "Fruits et légumes tropicaux — ce qu'il faut goûter",
    accroche: null,
    img: FRUITS_IMG,
    contenu: [
      {
        nom: "Les légumes créoles incontournables",
        texte: "La christophine (chayote) se prépare en gratin ou sautée au beurre — c'est le légume du quotidien martiniquais. Le giraumon (courge locale) entre dans les soupes et les ragoûts. L'igname et le madère (variété de taro) remplacent la pomme de terre dans la plupart des recettes. La canne à sucre fraîche se grignotait autrefois entre les champs — vous en trouverez en morceaux sur les marchés, à sucer directement.",
      },
      {
        nom: "Les fruits à découvrir absolument",
        texte: "La maracudja (fruit de la passion local) est plus parfumée et plus acide que les variétés importées — en jus, c'est une révélation. La sapotille (nèfle des Tropiques) a une chair brune sucrée, proche du caramel. Le corossol produit un jus épais, légèrement acidulé, aux propriétés rafraîchissantes réputées. Les bananes martiniquaises — variétés figue et poyo — sont incomparables avec les fruits exportés. Cuites au four avec de la cannelle, elles constituent le dessert créole le plus simple et le plus juste.",
      },
      {
        nom: "Où acheter — conseil pratique",
        texte: "Les supermarchés (Champion, Super U) proposent une bonne sélection de produits locaux mais à prix standard. Pour le meilleur choix et les meilleurs prix : les marchés (voir ci-dessus) ou les petits commerces en bord de route, souvent tenus par des particuliers qui vendent leur propre production. Ces points de vente informels n'ont pas de panneau — repérez les caisses de fruits posées au bord de la nationale.",
      },
    ],
  },
  {
    must: false,
    emoji: "🍽️",
    titre: "Restaurants recommandés à Sainte-Luce et alentours",
    accroche: null,
    img: null,
    contenu: [
      {
        nom: "Les lolos de l'Anse Corps de Garde — budget",
        texte: "À 5 min de Sainte-Luce, l'Anse Corps de Garde réunit plusieurs lolos (snacks créoles) ouverts le week-end sur la plage. Atmosphère familiale, tables en plastique sous les cocotiers, poisson grillé ou blaff du jour à moins de 15 €. Pas de réservation, pas de carte bancaire — espèces uniquement. C'est l'expérience la plus authentique et la moins touristique du coin.",
      },
      {
        nom: "Restaurant Ti Bòdmer — milieu de gamme",
        texte: "Face à la mer sur le front de mer de Sainte-Luce, Ti Bòdmer propose une carte courte mais soignée de cuisine créole traditionnelle. La matoutou de crabes (spécialité du Carnaval préparée toute l'année ici), le colombo de cabri et les accras sont systématiquement au rendez-vous. Service détendu, vue sur la baie. Comptez 20 à 30 € par personne hors boissons. Réservation conseillée le week-end.",
      },
      {
        nom: "Domaine de l'Anse Caritan — gastronomique",
        texte: "À 10 min de Sainte-Luce vers Sainte-Anne, le restaurant de cet hôtel propose une cuisine créole gastronomique avec des produits de pêche locale. Cadre élégant en terrasse sur la mer, carte des rhums élaborée, service attentionné. Compter 45 à 65 € par personne. La meilleure table du secteur pour une occasion particulière. Réservation indispensable.",
      },
      {
        nom: "Snack Chez Gégé — petit déjeuner et déjeuner",
        texte: "Cette petite cantine familiale en retrait du bourg de Sainte-Luce ouvre dès 6h30 pour les travailleurs locaux. Café martiniquais fort, pain au beurre, accras du matin, plat du jour (menu ouvrier à environ 10 €). Aucun intérêt touristique apparent — et c'est exactement ce qui en fait l'adresse idéale pour se mêler à la vie locale le temps d'un repas.",
      },
    ],
  },
];

const pratique = [
  { icon: "🛒", label: "Marché du Marin", valeur: "Sam. dès 6h · 15 min de Sainte-Luce" },
  { icon: "🏭", label: "Distillerie Trois-Rivières", valeur: "Lun–Sam · Visite ~8€ · 5 min" },
  { icon: "🦞", label: "Saison langouste", valeur: "Novembre → Avril (pêche locale)" },
  { icon: "💶", label: "Budget repas", valeur: "Lolo ~12€ · Créole ~25€ · Gastro ~55€" },
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

export default function GuideGastronomie() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta title="Gastronomie Martinique — Cuisine Créole, Restaurants & Marchés | Amaryllis" description="Saveurs créoles martiniquaises : langouste, blaff, ti-punch, accras. Marchés locaux, restaurants à Sainte-Luce. Guide gastronomique complet." canonical="/guide-gastronomie-martinique" image="https://villamaryllis.com/photos/gastronomie-martinique.avif" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Gastronomie Martinique — Cuisine Créole, Restaurants & Marchés depuis Sainte-Luce",
        "description": "Guide complet de la gastronomie martiniquaise : langouste grillée, blaff, ti-punch, rhum agricole AOC, marchés créoles, restaurants à Sainte-Luce et alentours.",
        "url": `${BASE}/guide-gastronomie-martinique`,
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
                Sainte-Luce · Sud Martinique
              </p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 6vw, 56px)", letterSpacing: "0.06em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px", lineHeight: 1.05 }}>
                Gastronomie<br />Créole
              </h1>
              <p style={{ color: "rgba(250,245,233,.85)", fontSize: "clamp(15px, 2vw, 18px)", maxWidth: 500, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Langouste grillée, blaff de poissons, ti-punch au rhum agricole AOC — la table martiniquaise depuis Sainte-Luce.
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
              Villas à Sainte-Luce
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
              ← Activités à Sainte-Luce
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
        <MaillageCluster currentSlug="guide-gastronomie-martinique" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
