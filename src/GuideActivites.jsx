// 10 meilleures activités à Sainte-Luce — /activites-sainte-luce

import SEOMeta from "./SEOMeta.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const BASE  = "https://villamaryllis.com";

const activites = [
  {
    num: 1,
    emoji: "🏖️",
    tag: "Se déplacer dans les environs",
    nom: "Se promener sur la plage de Sainte-Luce",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Anse_Corps_de_Garde_-_Le_D%C3%A9sert.jpg/960px-Anse_Corps_de_Garde_-_Le_D%C3%A9sert.jpg",
    texte: "La plage de Sainte-Luce (Anse Corps de Garde) est un croissant de sable blond bordé de cocotiers, avec une eau cristalline et des vues magnifiques sur la mer des Caraïbes. Idéale pour une matinée de baignade, du snorkeling léger ou simplement se poser au soleil. Des snacks locaux, des transats et des locations de kayak sont disponibles sur place. À 7 minutes de la résidence.",
  },
  {
    num: 2,
    emoji: "🌿",
    tag: "À ne pas manquer",
    nom: "Visiter le parc national de la Mangrove",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Presqu%27%C3%AEle_de_la_Caravelle_%28Martinique%29_-_mangrove_5.jpg/960px-Presqu%27%C3%AEle_de_la_Caravelle_%28Martinique%29_-_mangrove_5.jpg",
    texte: "La mangrove de Sainte-Luce est un écosystème préservé fascinant à explorer en kayak ou à pied sur les sentiers aménagés. Hérons, crabes, poissons et oiseaux tropicaux nichent dans ce milieu unique entre terre et mer. Un dépaysement total à quelques minutes du bourg — idéal en fin d'après-midi quand la lumière est dorée.",
  },
  {
    num: 3,
    emoji: "⛵",
    tag: "Réservez avant de partir",
    nom: "Excursion en bateau aux îles environnantes",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Grande_Anse_d%27_Arlet_%2847001622912%29.jpg/960px-Grande_Anse_d%27_Arlet_%2847001622912%29.jpg",
    texte: "Participez à une excursion en catamaran pour explorer les îlets du Sud : Cabrit, Hardy, Burgaux. Vous pourrez admirer raies manta, dauphins et tortues de mer dans des eaux turquoise préservées. Déjeuner barbecue à bord inclus dans la plupart des formules. Départ depuis la marina du Marin (15 min). Comptez 80–100€/personne — réservez à l'avance en haute saison.",
  },
  {
    num: 4,
    emoji: "🎣",
    tag: "Se déplacer dans les environs",
    nom: "Le village de pêcheurs et ses spécialités",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Sainte-Luce.jpg/960px-Sainte-Luce.jpg",
    texte: "Sainte-Luce est un vrai village créole avec un port de pêche actif. Rendez-vous au marché du bourg le samedi matin pour découvrir les spécialités locales : poisson grillé au feu de bois, langouste, lambi (conque), accras de morue. Les restaurants du front de mer servent le poisson du jour pêché quelques heures plus tôt — une fraîcheur incomparable.",
  },
  {
    num: 5,
    emoji: "🥾",
    tag: "Se déplacer dans les environs",
    nom: "Randonnée panoramique dans les montagnes",
    img: null,
    texte: "Les hauteurs de Sainte-Luce et de Rivière-Pilote offrent des sentiers de randonnée avec des vues à 360° sur la mer des Caraïbes et les alentours. Le sentier des crêtes entre Sainte-Luce et Rivière-Pilote est accessible à tous les niveaux. Partez tôt le matin pour éviter la chaleur et profiter de la lumière sur la mer. Chaussures de marche recommandées.",
  },
  {
    num: 6,
    emoji: "🗿",
    tag: "Se déplacer dans les environs",
    nom: "Vestiges historiques de l'esclavage à l'Anse-Cafard",
    img: null,
    texte: "Le Mémorial de l'Anse-Cafard, à 15 minutes en voiture, est un site solennel et poignant : 20 statues de pierre blanche commémorent le naufrage d'un bateau négrier en 1830. Perchées sur la falaise face au Rocher du Diamant, ces silhouettes enchaînées et penchées vers l'Afrique constituent l'un des mémoriaux les plus émouvants des Antilles. Entrée libre.",
  },
  {
    num: 7,
    emoji: "🤿",
    tag: "Réservez avant de partir",
    nom: "Plongée, planche à voile, kayak et paddle",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Diamond_Rock.jpg/960px-Diamond_Rock.jpg",
    texte: "Le sud de la Martinique est un terrain de jeu nautique exceptionnel. Plongée au Rocher du Diamant (tombants à 40 m, grottes, tortues), planche à voile aux Salines grâce aux alizés constants, kayak et paddle depuis Corps de Garde. Plusieurs clubs de plongée opèrent depuis Sainte-Luce. Baptême de plongée : 60–80€. Paddle/kayak en autonomie : 15–20€/h.",
  },
  {
    num: 8,
    emoji: "🎭",
    tag: "À ne pas manquer",
    nom: "Musée de la Canne à sucre — Maison de la Canne",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Trois_Rivi%C3%A8res_001.jpg/960px-Trois_Rivi%C3%A8res_001.jpg",
    texte: "La Maison de la Canne à Rivière-Pilote (10 min) retrace l'histoire de la production sucrière et du rhum en Martinique depuis la colonisation. Collections d'outils authentiques, maquettes d'habitations, documents et récits historiques. Une visite essentielle pour comprendre l'économie et la culture de l'île. Couplée avec la visite de la distillerie Trois-Rivières toute proche.",
  },
  {
    num: 9,
    emoji: "🏛️",
    tag: "Coutumes et culture",
    nom: "Excursion à Fort-de-France",
    img: null,
    texte: "À 35 minutes de Sainte-Luce, Fort-de-France vaut une demi-journée : la Bibliothèque Schoelcher (chef-d'œuvre d'architecture Art Nouveau), le marché couvert (épices, fruits exotiques, textiles créoles), le Parc Floral et le front de mer. La statue de Joséphine de Beauharnais, décapitée par les habitants, est un symbole fort de la mémoire collective martiniquaise.",
  },
  {
    num: 10,
    emoji: "🎶",
    tag: "Se déplacer dans les environs",
    nom: "Vie nocturne et musique live",
    img: null,
    texte: "Sainte-Luce s'anime le soir, surtout le week-end. Plusieurs bars de bord de mer proposent de la musique live créole, du zouk et du reggae. La Pointe du Bout (30 min) offre des boîtes de nuit plus animées. Les soirées martiniquaises sont chaleureuses et festives — une excellente façon de rencontrer les habitants et de finir la journée en beauté.",
  },
];

const conseils = [
  { titre: "🚗 Location de voiture", texte: "Indispensable. Réservez à l'aéroport Aimé Césaire (35 min). Budget 40–70€/jour." },
  { titre: "🕗 Timing", texte: "Plages avant 9h en haute saison, activités nautiques le matin, coucher de soleil au Diamant le soir." },
  { titre: "💰 Budget activités", texte: "Catamaran 80–100€/pers · Plongée 60–80€ · Distilleries gratuites · Kayak 15€/h." },
  { titre: "🌡️ Météo & mer", texte: "Eau à 27°C toute l'année. Saison sèche déc–avril idéale. Alizés constants rafraîchissent." },
];

export default function GuideActivites() {
  return (
    <>
      <SEOMeta title="10 activités incontournables à Sainte-Luce Martinique | Amaryllis" description="Les 10 meilleures activités depuis nos villas : snorkeling avec les tortues, randonnée Montravail, rhum Trois-Rivières, catamaran, cuisine créole. Sélection testée par vos hôtes." canonical="/activites-sainte-luce" image="https://villamaryllis.com/photos/amaryllis/01.webp" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            "headline": "10 activités incontournables à Sainte-Luce, Martinique",
            "description": "Notre sélection des 10 meilleures activités à ne pas manquer à Sainte-Luce : plage, mangrove, excursion en bateau, plongée au Rocher du Diamant, musée de la Canne, Fort-de-France. Guide rédigé par vos hôtes.",
            "url": `${BASE}/activites-sainte-luce`,
            "image": `${BASE}/photos/amaryllis/01.webp`,
            "author": { "@id": `${BASE}/#organization` },
            "publisher": { "@id": `${BASE}/#organization` },
          },
          {
            "@type": "ItemList",
            "name": "10 activités à Sainte-Luce Martinique",
            "numberOfItems": 10,
            "itemListElement": activites.map((a, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "name": a.nom,
              "description": a.texte,
            })),
          },
        ],
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <a href="/guide" style={{ color: IVORY, textDecoration: "none", fontSize: 13, letterSpacing: "0.08em", opacity: 0.7 }}>← Guide Sainte-Luce</a>
          </div>
        </header>

        {/* Hero avec photo */}
        <div style={{ position: "relative", height: 320, overflow: "hidden" }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Anse_Corps_de_Garde_-_Le_D%C3%A9sert.jpg/960px-Anse_Corps_de_Garde_-_Le_D%C3%A9sert.jpg"
            alt="Anse Corps de Garde, Sainte-Luce, Martinique"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(14,59,58,0.65)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
            <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 14 }}>Guide de voyage · Sélection de vos hôtes</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 5vw, 50px)", letterSpacing: "0.05em", color: IVORY, textTransform: "uppercase", margin: "0 0 14px", lineHeight: 1.15 }}>
              10 activités à ne pas manquer<br />à Sainte-Luce
            </h1>
            <p style={{ color: "rgba(250,245,233,0.8)", fontSize: 15, maxWidth: 560, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Notre sélection personnelle après des années à accueillir des voyageurs dans la résidence Amaryllis.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 64 }}>
            {activites.map((a) => (
              <div key={a.num} style={{ background: "#fff", border: `1px solid ${SAND}`, borderRadius: 12, overflow: "hidden" }}>
                {a.img && (
                  <img
                    src={a.img}
                    alt={a.nom}
                    style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
                    loading="lazy"
                  />
                )}
                <div style={{ padding: "24px 28px", display: "flex", gap: 18, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, width: 44, height: 44, background: NAVY, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: IVORY, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 17 }}>
                    {a.num}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{a.emoji}</span>
                      <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 16, color: NAVY, margin: 0 }}>{a.nom}</h2>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, color: NAVY, letterSpacing: "0.06em" }}>{a.tag}</span>
                    </div>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: TEXT, margin: 0 }}>{a.texte}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Conseils pratiques */}
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 20 }}>
            Conseils pratiques
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 64 }}>
            {conseils.map((c) => (
              <div key={c.titre} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: NAVY, marginBottom: 6 }}>{c.titre}</div>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.65, color: TEXT, margin: 0 }}>{c.texte}</p>
              </div>
            ))}
          </div>

          {/* Maillage interne — villas à proximité des activités */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 16px" }}>Nos villas — base idéale pour tout explorer</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {[
                { id: "amaryllis", name: "Villa Amaryllis", desc: "8 pers. · Piscine à débordement · Vue mer · À partir de 280€/nuit" },
                { id: "zandoli",   name: "Zandoli",         desc: "5 pers. · Piscine privée · Vue mer · À partir de 220€/nuit" },
                { id: "iguana",    name: "Villa Iguana",    desc: "Piscine eau salée · Vue Diamant · Location longue durée" },
                { id: "geko",      name: "Géko",            desc: "4 pers. · Piscine · Jardin · À partir de 150€/nuit" },
                { id: "mabouya",   name: "Mabouya",         desc: "2 pers. · Jacuzzi privatif · À partir de 110€/nuit" },
                { id: "schoelcher",name: "Bellevue",        desc: "4 pers. · Vue baie Fort-de-France · À partir de 100€/nuit" },
              ].map(v => (
                <a key={v.id} href={`/${v.id}`} style={{ display: "flex", flexDirection: "column", background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10, padding: "14px 16px", textDecoration: "none" }}>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: NAVY, marginBottom: 3 }}>{v.name} ›</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: TEXT, opacity: 0.75, lineHeight: 1.4 }}>{v.desc}</div>
                </a>
              ))}
            </div>
          </div>

          {/* CTA villas */}
          <div style={{ background: NAVY, borderRadius: 16, padding: "40px 32px", textAlign: "center", marginBottom: 40 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>Base idéale pour tout explorer</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 26, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 14px" }}>Nos villas à Sainte-Luce</h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 15, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Piscine privée, vue mer, réservation directe sans frais. Toutes ces activités sont à moins de 35 minutes.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>Voir les disponibilités</a>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/guide" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>← Guide Sainte-Luce</a>
            <a href="/guide-proximite" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>Activités proches de la villa →</a>
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
