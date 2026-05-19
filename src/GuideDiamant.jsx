// Guide Le Diamant Martinique — /guide-le-diamant

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const BASE  = "https://villamaryllis.com";

const sections = [
  {
    emoji: "🗿",
    titre: "Le Rocher du Diamant — l'incontournable",
    contenu: [
      {
        nom: "Histoire et légende",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Diamond_Rock.jpg/960px-Diamond_Rock.jpg",
        texte: "Ce rocher volcanique de 175 mètres surgit de la mer à 1 km des côtes, face au village du Diamant. Les Anglais l'occupèrent en 1804, le baptisant HMS Diamond Rock — seul rocher jamais enrôlé comme navire de guerre dans la Royal Navy. Battu par les Français en 1805, il reste l'un des sites historiques les plus fascinants des Antilles.",
      },
      {
        nom: "Plongée et snorkeling",
        img: null,
        texte: "Le Rocher du Diamant est classé parmi les meilleurs spots de plongée des Caraïbes. Tombants à 40 m, grottes sous-marines, tortues, barracudas, raies pastenagues et coraux en parfait état. Plusieurs clubs de plongée organisent des sorties depuis les plages du Diamant.",
      },
      {
        nom: "Vue depuis la terre",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_01.jpg/960px-Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_01.jpg",
        texte: "La plage du Diamant offre l'un des panoramas les plus emblématiques de Martinique — 3 km de sable doré face au rocher. Magnifique au coucher du soleil, quand le ciel vire à l'orange et que la silhouette du rocher se découpe sur la mer.",
      },
    ],
  },
  {
    emoji: "🏖️",
    titre: "Les plages du Diamant",
    contenu: [
      {
        nom: "Grande Plage du Diamant",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg/960px-Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg",
        texte: "La plus longue plage de Martinique (3 km). Sable fin, eau turquoise, vue directe sur le rocher. Attention aux courants — baignade déconseillée par fort vent, la plage est exposée à la houle. Idéale pour les promenades au lever du soleil.",
      },
      {
        nom: "Anse Cafard",
        img: null,
        texte: "Au nord du bourg, cette anse calme abrite le Mémorial de l'Anse Cafard — 20 statues de pierre blanche commémorant le naufrage d'un navire négrier en 1830. Site solennel et poignant, vue panoramique sur le rocher et les îlets.",
      },
      {
        nom: "Petite Anse",
        img: null,
        texte: "Plage plus protégée, idéale pour la baignade et le snorkeling. Accès par un sentier depuis le bourg. Moins fréquentée, eau claire, fond rocheux avec poissons tropicaux.",
      },
    ],
  },
  {
    emoji: "🍽️",
    titre: "Restaurants et adresses",
    contenu: [
      {
        nom: "Le Belem",
        img: null,
        texte: "Restaurant les pieds dans le sable face au rocher. Poissons et fruits de mer frais du jour, ti-punch artisanal, ambiance créole décontractée. Coucher de soleil exceptionnel depuis la terrasse.",
      },
      {
        nom: "La Plage du Diamant",
        img: null,
        texte: "Snack-restaurant sur la grande plage, idéal pour un déjeuner créole entre deux baignades. Accras, boudin, colombo, poisson grillé — cuisine simple et généreuse.",
      },
      {
        nom: "Marché local",
        img: null,
        texte: "Tous les samedis matin, le marché du bourg propose légumes créoles, épices, rhums artisanaux et pâtisseries locales. Une immersion dans la vie martiniquaise authentique.",
      },
    ],
  },
  {
    emoji: "🚗",
    titre: "Accès depuis Sainte-Luce",
    contenu: [
      {
        nom: "Distance et itinéraire",
        img: null,
        texte: "Le Diamant est à 15 minutes en voiture depuis Sainte-Luce via la N6. Traversée de Rivière-Pilote, puis descente vers la côte caraïbe. Route pittoresque à travers les champs de canne à sucre.",
      },
      {
        nom: "Combiner avec d'autres sites",
        img: null,
        texte: "En une journée depuis Sainte-Luce : matin plongée au Rocher du Diamant, déjeuner sur la plage, après-midi Sainte-Anne ou Grande Anse d'Arlet. Circuit idéal pour explorer le sud de l'île.",
      },
    ],
  },
];

export default function GuideDiamant() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Guide Le Diamant Martinique : rocher, plages et plongée",
        "description": "Tout sur Le Diamant en Martinique : le Rocher du Diamant (plongée, histoire), les plus belles plages et les meilleures adresses. À 15 min de Sainte-Luce.",
        "url": `${BASE}/guide-le-diamant`,
        "image": `${BASE}/photos/iguana/01.webp`,
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
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Diamond_Rock.jpg/960px-Diamond_Rock.jpg"
            alt="Rocher du Diamant, Martinique"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(14,59,58,0.65)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
            <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 14 }}>Guide de voyage · Résidence Amaryllis</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 5vw, 50px)", letterSpacing: "0.05em", color: IVORY, textTransform: "uppercase", margin: "0 0 14px", lineHeight: 1.15 }}>
              Le Diamant,<br />Martinique
            </h1>
            <p style={{ color: "rgba(250,245,233,0.8)", fontSize: 15, maxWidth: 520, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Rocher mythique, plongée exceptionnelle et plages sauvages — à 15 minutes de nos villas à Sainte-Luce.
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

          {/* Maillage interne — villas avec vue Diamant */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 16px" }}>Villas idéalement situées</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "iguana", name: "Villa Iguana", desc: "Vue directe sur le Rocher du Diamant · Piscine eau salée · À partir de 180€/nuit" },
                { id: "mabouya", name: "Mabouya", desc: "Vue mer panoramique · Jacuzzi privatif · À partir de 110€/nuit" },
                { id: "amaryllis", name: "Villa Amaryllis", desc: "Piscine à débordement · Vue océan · Jacuzzi · À partir de 280€/nuit" },
              ].map(v => (
                <a key={v.id} href={`/${v.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10, padding: "16px 20px", textDecoration: "none" }}>
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 3 }}>{v.name}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, color: TEXT, opacity: 0.75 }}>{v.desc}</div>
                  </div>
                  <span style={{ color: CORAL, fontSize: 18, flexShrink: 0, marginLeft: 12 }}>›</span>
                </a>
              ))}
            </div>
          </div>

          <div style={{ background: NAVY, borderRadius: 16, padding: "40px 32px", textAlign: "center", marginBottom: 40 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>Base idéale</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px" }}>Séjourner à Sainte-Luce</h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 15, maxWidth: 500, margin: "0 auto 28px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              À 15 min du Diamant, nos villas avec piscine et vue mer sont la base parfaite pour explorer le sud de la Martinique.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>Voir toutes nos villas</a>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/guide" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>← Guide Sainte-Luce</a>
            <a href="/guide-sainte-anne" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>Guide Sainte-Anne →</a>
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
