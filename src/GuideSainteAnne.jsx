// Guide Sainte-Anne Martinique — /guide-sainte-anne

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const BASE  = "https://villamaryllis.com";

const sections = [
  {
    emoji: "🏖️",
    titre: "Les plages de Sainte-Anne",
    contenu: [
      {
        nom: "Grande Anse des Salines",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg",
        texte: "La plage la plus belle de Martinique, et l'une des plus belles des Caraïbes. Sable blanc poudreux, cocotiers inclinés sur l'eau, mer turquoise et calme. À l'extrême sud de l'île, accessible depuis Sainte-Luce en 25 minutes. Arrivez tôt en haute saison — c'est la plage la plus fréquentée de l'île.",
      },
      {
        nom: "Plage de Sainte-Anne (bourg)",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Grande_Anse_des_Salines_%28Sainte-Anne%2C_Martinique%29_-_01.jpg/960px-Grande_Anse_des_Salines_%28Sainte-Anne%2C_Martinique%29_-_01.jpg",
        texte: "En plein cœur du village, cette plage familiale et animée offre transats, restaurants, artisans locaux et une eau calme protégée. Idéale pour un après-midi détendu avec enfants, à deux pas des boutiques et restaurants.",
      },
      {
        nom: "Anse Meunier",
        img: null,
        texte: "Plage sauvage et préservée entre Sainte-Anne et Les Salines, accessible à pied. Peu connue des touristes, eau cristalline, rochers, végétation tropicale. Un coin de paradis pour ceux qui cherchent la tranquillité.",
      },
      {
        nom: "Anse du Marin",
        img: null,
        texte: "À proximité de la marina du Marin (15 min), cette plage calme est le point de départ idéal pour des excursions en catamaran vers les îlets du Sud — Îlet Cabrit, Hardy, Burgaux.",
      },
    ],
  },
  {
    emoji: "⛵",
    titre: "Activités nautiques depuis Sainte-Anne",
    contenu: [
      {
        nom: "Catamaran aux îlets du Sud",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Grande_Anse_d%27_Arlet_%2847001622912%29.jpg/960px-Grande_Anse_d%27_Arlet_%2847001622912%29.jpg",
        texte: "L'excursion incontournable de la Martinique. Départ du Marin ou de Sainte-Anne, journée complète aux îlets avec snorkeling, déjeuner barbecue à bord et baignade dans des eaux turquoise préservées. Comptez 80-100€/personne.",
      },
      {
        nom: "Kitesurf et windsurf",
        img: null,
        texte: "La pointe des Salines est l'un des meilleurs spots de kitesurf des Antilles grâce aux alizés constants. Plusieurs écoles proposent des cours pour débutants et des locations pour confirmés.",
      },
      {
        nom: "Snorkeling aux Salines",
        img: null,
        texte: "Le lagon protégé entre les Salines et l'Îlet Cabrit regorge de poissons tropicaux, tortues et coraux. Location de palmes/masque sur place. Eau peu profonde, idéale pour les débutants.",
      },
    ],
  },
  {
    emoji: "🍽️",
    titre: "Restaurants et bonnes tables",
    contenu: [
      {
        nom: "Le Bakoua",
        img: null,
        texte: "Sur la plage du bourg, ambiance créole typique, poisson du jour grillé au feu de bois, rhum arrangé maison. Une institution locale à Sainte-Anne.",
      },
      {
        nom: "Les Tamariniers",
        img: null,
        texte: "Restaurant gastronomique créole avec terrasse vue mer. Cuisine raffinée mêlant saveurs locales et techniques modernes. Idéal pour un dîner en amoureux.",
      },
      {
        nom: "Snacks de plage aux Salines",
        img: null,
        texte: "Plusieurs snacks creoles sont installés à l'entrée de la plage des Salines. Accras, brochettes, jus de coco frais — déjeuner typique et pas cher après la baignade.",
      },
    ],
  },
  {
    emoji: "🗺️",
    titre: "Sainte-Anne depuis Sainte-Luce",
    contenu: [
      {
        nom: "Itinéraire",
        img: null,
        texte: "Sainte-Anne est à 20 minutes de Sainte-Luce via la N6. Trajet agréable le long de la côte caraïbe avec quelques points de vue sur la mer. Prévoir la voiture — les transports en commun sont limités.",
      },
      {
        nom: "Journée idéale",
        img: null,
        texte: "Départ tôt depuis Sainte-Luce → Grande Anse des Salines le matin (avant l'affluence) → déjeuner au bourg de Sainte-Anne → après-midi snorkeling ou catamaran depuis le Marin → retour via Le Diamant au coucher du soleil.",
      },
    ],
  },
];

export default function GuideSainteAnne() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Guide Sainte-Anne Martinique : plages, activités et restaurants",
        "description": "Tout sur Sainte-Anne en Martinique : Grande Anse des Salines (plus belle plage des Caraïbes), kitesurf, catamaran aux îlets et restaurants créoles. À 20 min de Sainte-Luce.",
        "url": `${BASE}/guide-sainte-anne`,
        "image": `${BASE}/photos/amaryllis/05.webp`,
        "author": { "@id": `${BASE}/#organization` },
        "publisher": { "@id": `${BASE}/#organization` },
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <a href="/guide" style={{ color: IVORY, textDecoration: "none", fontSize: 13, letterSpacing: "0.08em", opacity: 0.7 }}>← Guide Sainte-Luce</a>
          </div>
        </header>

        {/* Hero avec photo */}
        <div style={{ position: "relative", height: 300, overflow: "hidden" }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg"
            alt="Grande Anse des Salines, Sainte-Anne, Martinique"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(14,59,58,0.65)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
            <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 14 }}>Guide de voyage · Résidence Amaryllis</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 5vw, 50px)", letterSpacing: "0.05em", color: IVORY, textTransform: "uppercase", margin: "0 0 14px", lineHeight: 1.15 }}>
              Sainte-Anne,<br />Martinique
            </h1>
            <p style={{ color: "rgba(250,245,233,0.8)", fontSize: 15, maxWidth: 520, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              La Grande Anse des Salines, le kitesurf, les îlets du Sud — la perle de la côte caraïbe, à 20 minutes de nos villas.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>
          {sections.map((section, si) => (
            <div key={si} style={{ marginBottom: 64 }}>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 24, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
                <span>{section.emoji}</span><span>{section.titre}</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {section.contenu.map((item, ii) => (
                  <div key={ii} style={{ background: "#fff", border: `1px solid ${SAND}`, borderRadius: 12, overflow: "hidden" }}>
                    {item.img && (
                      <img
                        src={item.img}
                        alt={item.nom}
                        style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
                        loading="lazy"
                      />
                    )}
                    <div style={{ padding: "24px 28px" }}>
                      <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: NAVY, margin: "0 0 10px", letterSpacing: "0.04em" }}>{item.nom}</h3>
                      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: TEXT, margin: 0 }}>{item.texte}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Maillage interne */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 16px" }}>Nos villas à 20 min de Sainte-Anne</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "amaryllis", name: "Villa Amaryllis", desc: "Piscine à débordement · Vue mer · Jacuzzi · 8 personnes · À partir de 280€/nuit" },
                { id: "zandoli",   name: "Zandoli",         desc: "Piscine privée · Vue mer · Jardin tropical · 5 personnes · À partir de 220€/nuit" },
                { id: "iguana",    name: "Villa Iguana",    desc: "Piscine eau salée · Vue Diamant · Location longue durée" },
                { id: "geko",      name: "Géko",            desc: "Piscine privée · Jardin tropical · 4 personnes · À partir de 150€/nuit" },
                { id: "mabouya",   name: "Mabouya",         desc: "Jacuzzi privatif · Vue mer · Romantique · 2 personnes · À partir de 110€/nuit" },
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

          <div style={{ background: NAVY, borderRadius: 16, padding: "40px 32px", textAlign: "center", marginBottom: 40 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>Base idéale pour le sud</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px" }}>Nos villas à Sainte-Luce</h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 15, maxWidth: 500, margin: "0 auto 28px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              À 20 min de Sainte-Anne et des Salines, 15 min du Diamant. Piscine, vue mer, réservation directe sans frais.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>Voir toutes nos villas</a>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/guide-le-diamant" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>← Guide Le Diamant</a>
            <a href="/guide" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>Guide Sainte-Luce →</a>
          </div>
        </div>

        <div style={{ background: NAVY, padding: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,0.4)", fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,0.4)", textDecoration: "none" }}>villamaryllis.com</a>
            {" · "}
            <span style={{ fontSize: 11, opacity: 0.7 }}>Photos © Wikimedia Commons (CC BY-SA)</span>
          </p>
        </div>
      </div>
    </>
  );
}
