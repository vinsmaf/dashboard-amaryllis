// Guide activités à proximité de la Villa Amaryllis — /guide-proximite

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const BASE  = "https://villamaryllis.com";

const lieux = [
  {
    emoji: "🏖️",
    nom: "Anse Corps de Garde",
    tag: "Plage la plus proche",
    reco: 18,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Anse_Corps_de_Garde_-_Le_D%C3%A9sert.jpg/960px-Anse_Corps_de_Garde_-_Le_D%C3%A9sert.jpg",
    texte: "L'Anse Corps de Garde est installée sur le littoral de Sainte-Luce, à environ 2 kilomètres du bourg et 7 minutes de la résidence. Il s'agit d'une plage de sable blond piquée de cocotiers offrant d'appréciables zones ombragées. Très fréquentée toute l'année par les riverains et les touristes, elle propose transats, snacks, location de kayak et une eau turquoise calme idéale pour les familles.",
  },
  {
    emoji: "🌊",
    nom: "Anse Mabouya",
    tag: "Plage & sports nautiques",
    reco: null,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg",
    texte: "L'Anse Mabouya est une plage préservée de Sainte-Luce, célèbre pour ses eaux cristallines et sa belle vue sur la mer. Entourée de palmiers et de végétation luxuriante, elle offre un cadre tropical idéal pour se détendre loin de l'agitation. La plage de sable blanc est également appréciée des amateurs de sports nautiques — planche à voile, plongée en apnée, snorkeling au milieu des poissons tropicaux.",
  },
  {
    emoji: "🌿",
    nom: "Forêt Domaniale de Montravail",
    tag: "Randonnée & nature",
    reco: null,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Presqu%27%C3%AEle_de_la_Caravelle_%28Martinique%29_-_mangrove_5.jpg/960px-Presqu%27%C3%AEle_de_la_Caravelle_%28Martinique%29_-_mangrove_5.jpg",
    texte: "La forêt de Montravail est un lieu idyllique situé dans la commune de Sainte-Luce, à quelques minutes de la résidence. C'est un endroit incontournable pour les amateurs de randonnée et de nature : sentiers balisés, cascades rafraîchissantes, et une faune et flore locales remarquables. Idéale pour une matinée fraîche avant la plage — prévoyez bonnes chaussures et eau.",
  },
  {
    emoji: "🥃",
    nom: "Plantation Trois-Rivières",
    tag: "Culture & dégustation",
    reco: 60,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Trois-Rivi%C3%A8res_-_Martinique.jpg/960px-Trois-Rivi%C3%A8res_-_Martinique.jpg",
    texte: "La plantation Trois-Rivières est une ancienne habitation sucrière devenue musée et distillerie de rhum agricole AOC. Visite gratuite des installations historiques : anciennes distilleries, champs de canne à sucre, moulins et bâtiments coloniaux. Dégustation commentée de rhums agricoles vieux et blancs, boutique avec des éditions introuvables en métropole. À 8 minutes de la résidence. Ouvert lundi–samedi 9h–17h.",
  },
  {
    emoji: "🛒",
    nom: "Centre commercial — Corps de Garde",
    tag: "Commodités",
    reco: 55,
    img: null,
    texte: "Le centre commercial de Corps de Garde est le plus proche de la résidence, à 7 minutes. Supermarché bien achalandé, boulangerie, pharmacie, banque et divers commerces. Idéal pour vos courses quotidiennes — produits locaux (rhum, épices, fruits tropicaux), produits frais et tout le nécessaire pour profiter de votre séjour. Parking gratuit, ouvert 7j/7.",
  },
  {
    emoji: "🐢",
    nom: "Nager avec les tortues de mer",
    tag: "À ne pas manquer",
    reco: null,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Tortue_verte_%28Chelonia_mydas%29_regagnant_la_mer_%28Ifremer_00570-68187%29.jpg/960px-Tortue_verte_%28Chelonia_mydas%29_regagnant_la_mer_%28Ifremer_00570-68187%29.jpg",
    texte: "La Martinique offre la possibilité unique de nager avec les tortues vertes et les tortues de mer, dans des lieux tels que Les Salines, Anse Dufour et Anse Noire. Il est important de respecter les règles de conduite et d'utiliser des prestataires locaux certifiés. Vérifiez les horaires et modalités d'inscription à l'avance. Une expérience inoubliable — la rencontre avec ces animaux dans leur environnement naturel.",
  },
];

const infos = [
  { emoji: "📍", titre: "Position idéale", texte: "Toutes ces adresses sont à moins de 15 minutes à pied ou en voiture depuis la résidence." },
  { emoji: "🚗", titre: "Voiture recommandée", texte: "Pour les plages éloignées et les excursions. Location possible à l'aéroport ou sur place." },
  { emoji: "📶", titre: "WiFi Starlink", texte: "Connexion haut débit incluse. Parfait pour préparer vos sorties ou travailler depuis la villa." },
  { emoji: "📞", titre: "Contact hôte", texte: "Vos hôtes sont joignables par WhatsApp pour tout conseil ou recommandation personnalisée." },
];

export default function GuideProximite() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Guide des activités à proximité de la Villa Amaryllis — Sainte-Luce, Martinique",
        "description": "Les meilleures adresses à moins de 15 minutes de la résidence Amaryllis : Anse Corps de Garde, Anse Mabouya, Forêt de Montravail, distillerie Trois-Rivières, nager avec les tortues. Guide rédigé par vos hôtes.",
        "url": `${BASE}/guide-proximite`,
        "image": `${BASE}/photos/amaryllis/01.webp`,
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
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Sainte-Luce.jpg/960px-Sainte-Luce.jpg"
            alt="Sainte-Luce, Martinique"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(14,59,58,0.65)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
            <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 14 }}>Guide des hôtes · Résidence Amaryllis</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 5vw, 50px)", letterSpacing: "0.05em", color: IVORY, textTransform: "uppercase", margin: "0 0 14px", lineHeight: 1.15 }}>
              À proximité<br />de la résidence
            </h1>
            <p style={{ color: "rgba(250,245,233,0.8)", fontSize: 15, maxWidth: 520, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Plages, forêt tropicale, distillerie — tout en moins de 15 minutes autour de la Villa Amaryllis.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* Infos pratiques */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 56 }}>
            {infos.map((info) => (
              <div key={info.titre} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{info.emoji}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: NAVY, marginBottom: 6 }}>{info.titre}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, lineHeight: 1.65, color: TEXT }}>{info.texte}</div>
              </div>
            ))}
          </div>

          {/* Lieux */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 64 }}>
            {lieux.map((lieu, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${SAND}`, borderRadius: 12, overflow: "hidden" }}>
                {lieu.img && (
                  <img
                    src={lieu.img}
                    alt={lieu.nom}
                    style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
                    loading="lazy"
                  />
                )}
                <div style={{ padding: "24px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{lieu.emoji}</span>
                    <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 17, color: NAVY, margin: 0 }}>{lieu.nom}</h2>
                    <span style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, color: NAVY, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{lieu.tag}</span>
                    {lieu.reco && (
                      <span style={{ fontSize: 12, color: CORAL, fontFamily: "'Jost', sans-serif" }}>👍 {lieu.reco} recommandé par les habitants</span>
                    )}
                  </div>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: TEXT, margin: 0 }}>{lieu.texte}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ background: NAVY, borderRadius: 16, padding: "40px 32px", textAlign: "center", marginBottom: 40 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>Réservation directe</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 26, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 14px" }}>Séjourner à la résidence</h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 15, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Villas avec piscine, vue mer et jacuzzi — à portée de toutes ces adresses. Sans frais de service Airbnb.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>Voir les villas</a>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/activites-sainte-luce" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>← Top 10 activités</a>
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
