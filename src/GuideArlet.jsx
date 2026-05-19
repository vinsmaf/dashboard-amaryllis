// Guide Grande Anse d'Arlet Martinique — /guide-arlet

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
    titre: "Grande Anse d'Arlet — la plage aux bœufs",
    contenu: [
      {
        nom: "La plage emblématique",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Grande_Anse_d%27_Arlet_%2847001622912%29.jpg/960px-Grande_Anse_d%27_Arlet_%2847001622912%29.jpg",
        texte: "La Grande Anse d'Arlet est l'une des images les plus iconiques de la Martinique : une plage de sable blond en arc de cercle, une petite église créole au bord de l'eau, des bœufs qui se baignent dans la mer. Eau calme et cristalline, idéale pour la baignade en famille. Le village de pêcheurs conserve un charme authentique rare dans les Caraïbes.",
      },
      {
        nom: "Le village de pêcheurs",
        img: null,
        texte: "Arlet est l'un des derniers villages de pêcheurs actifs de Martinique. Le matin, les yoles colorées rentrent au port chargées de dorades, thons et langoustes. Les pêcheurs vendent leur prise directement sur la plage. Une atmosphère unique, loin du tourisme de masse.",
      },
      {
        nom: "Petite Anse d'Arlet",
        img: null,
        texte: "À 15 minutes à pied au nord, la Petite Anse offre une plage plus sauvage et moins fréquentée. Snorkeling excellent sur les fonds rocheux, eau turquoise, quelques restaurants de plage. Idéale tôt le matin ou en fin d'après-midi.",
      },
    ],
  },
  {
    emoji: "🤿",
    titre: "Snorkeling et plongée",
    contenu: [
      {
        nom: "Le cimetière marin — tortues garanties",
        img: null,
        texte: "Le site de snorkeling le plus réputé de la côte Caraïbe. Des tortues marines viennent régulièrement se nourrir à quelques mètres du bord. Eau peu profonde (2–5 m), fond de sable et roche, visibilité exceptionnelle. Pas besoin de palmes ni de bouteille — juste un masque.",
      },
      {
        nom: "Plongée sous-marine",
        img: null,
        texte: "Plusieurs clubs proposent des plongées autour d'Arlet : tombants couverts de gorgones, épaves peu profondes, bancs de poissons tropicaux. Le site 'Les Abymes' à 25 m est accessible dès le niveau 1. Compter 45–55€ la plongée encadrée.",
      },
      {
        nom: "Kayak et paddle",
        img: null,
        texte: "Location de kayaks et stand-up paddles sur la plage. Faire le tour de la pointe entre Grande Anse et Petite Anse en kayak (30 min) offre une vue unique sur le village et la côte. Eaux calmes protégées du vent par la pointe.",
      },
    ],
  },
  {
    emoji: "🍽️",
    titre: "Restaurants et adresses",
    contenu: [
      {
        nom: "Le Ti Sable",
        img: null,
        texte: "Les pieds dans le sable face à la plage. Poisson frais du jour — langouste grillée, thon mi-cuit, daurade créole — accompagnés de riz colombo et bananes flambées. Réservation conseillée en haute saison. Ambiance décontractée, service chaleureux.",
      },
      {
        nom: "Chez Nana",
        img: null,
        texte: "Institution locale tenue par la même famille depuis trois générations. Cuisine créole généreuse, prix honnêtes. La meilleure option pour un déjeuner authentique sans se ruiner. Accras en entrée, fricassée de chatrou (poulpe), punch coco maison.",
      },
      {
        nom: "Les marchands de noix de coco",
        img: null,
        texte: "Sur la plage, plusieurs vendeurs proposent noix de coco fraîches, acras et boudins créoles à emporter. Le snack parfait après la baignade — fraîcheur garantie, prix modeste.",
      },
    ],
  },
  {
    emoji: "🚗",
    titre: "Accès depuis Sainte-Luce",
    contenu: [
      {
        nom: "Itinéraire — 25 minutes",
        img: null,
        texte: "Prendre la N6 vers Le Diamant, puis longer la côte caraïbe via les Anses-d'Arlet. Route pittoresque avec vues sur mer, petits villages de pêcheurs et cocotiers. Parking à l'entrée du village (payant en haute saison, prévoir 2–3€).",
      },
      {
        nom: "Journée idéale depuis Sainte-Luce",
        img: null,
        texte: "Départ 8h → Grande Anse d'Arlet pour la baignade et le snorkeling du matin (les tortues sont là tôt) → déjeuner poisson frais sur la plage → sieste sous les cocotiers → retour via Le Diamant pour le coucher de soleil face au Rocher.",
      },
    ],
  },
];

export default function GuideArlet() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Guide Grande Anse d'Arlet Martinique : plage, tortues et snorkeling",
        "description": "Tout sur Grande Anse d'Arlet en Martinique : la plage aux bœufs, snorkeling avec les tortues, restaurants créoles et village de pêcheurs. À 25 min de Sainte-Luce.",
        "url": `${BASE}/guide-arlet`,
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
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Grande_Anse_d%27_Arlet_%2847001622912%29.jpg/960px-Grande_Anse_d%27_Arlet_%2847001622912%29.jpg"
            alt="Grande Anse d'Arlet, Martinique"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 60%" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(14,59,58,0.6)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
            <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 14 }}>Guide de voyage · Résidence Amaryllis</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 5vw, 50px)", letterSpacing: "0.05em", color: IVORY, textTransform: "uppercase", margin: "0 0 14px", lineHeight: 1.15 }}>
              Grande Anse<br />d'Arlet
            </h1>
            <p style={{ color: "rgba(250,245,233,0.8)", fontSize: 15, maxWidth: 520, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Plage aux bœufs, tortues marines en snorkeling, village de pêcheurs authentique — à 25 minutes de nos villas.
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
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 16px" }}>Nos villas à 25 min d'Arlet</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "amaryllis", name: "Villa Amaryllis", desc: "Piscine à débordement · Vue mer · Jacuzzi · 8 personnes · À partir de 280€/nuit" },
                { id: "iguana",    name: "Villa Iguana",    desc: "Piscine eau salée · Vue Diamant · Location longue durée" },
                { id: "zandoli",   name: "Zandoli",         desc: "Piscine privée · Vue mer · Jardin tropical · 5 personnes · À partir de 220€/nuit" },
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
              À 25 min d'Arlet, 15 min du Diamant, 20 min des Salines. Piscine, vue mer, réservation directe sans frais.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>Voir toutes nos villas</a>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/guide-sainte-anne" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>← Guide Sainte-Anne</a>
            <a href="/guide-le-diamant" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>Guide Le Diamant →</a>
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
