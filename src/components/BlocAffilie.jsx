// Bloc d'activités contextuelles — inséré dans chaque guide avant la Newsletter.
// Liens GYG + Viator ciblés selon le sujet du guide + DiscoverCars si voiture utile.

const NAVY   = "#1b2a4a";
const IVORY  = "#faf5e9";
const SAND   = "#e8e0d0";
const CORAL  = "#c8614a";
const MUTED  = "#8a8070";

const GYG_BASE    = "https://www.getyourguide.com/martinique-l169136/?partner_id=DNI7ML3&q=";
const VIATOR_BASE = "https://www.viator.com";
const DC_URL      = "https://www.discovercars.com/fr/martinique?a_aid=vinsmaf";

const CONFIGS = {
  arlet: {
    titre: "Réserver vos activités à Anse d'Arlet",
    desc: "Spot n°1 pour nager avec les tortues — excursions disponibles à la journée ou demi-journée.",
    activites: [
      { label: "Nager avec les tortues marines",       icon: "🐢", q: "tortues+arlet+martinique",    viator: "/tours/Martinique/Sea-Turtles-and-snorkeling/d4316-90901P5" },
      { label: "Snorkeling & coraux",                  icon: "🤿", q: "snorkeling+martinique",         viator: "/tours/Martinique/Boat-Trip-for-Snorkeling-Discovery-of-Corals/d4316-330665P1" },
      { label: "Excursion en catamaran",               icon: "⛵", q: "catamaran+martinique",          viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
    ],
    voiture: true,
  },
  "sainte-anne": {
    titre: "Réserver vos activités à Sainte-Anne",
    desc: "Base idéale pour les Salines et les excursions en catamaran vers les fonds blancs.",
    activites: [
      { label: "Catamaran aux Salines — dauphins & tortues", icon: "⛵", q: "catamaran+salines+martinique", viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
      { label: "Bain de Joséphine & fonds blancs",          icon: "🏝️", q: "fond+blanc+martinique",         viator: "/tours/Martinique/Bathtub-of-Josephine-and-Islands-Half-day-Boat-trip/d4316-5578749P1" },
      { label: "Snorkeling & Anse Coralienne",               icon: "🤿", q: "snorkeling+martinique",         viator: "/tours/Martinique/Sea-Turtles-and-snorkeling/d4316-90901P5" },
    ],
    voiture: true,
  },
  plongee: {
    titre: "Réserver vos excursions plongée & snorkeling",
    desc: "Martinique compte parmi les meilleures destinations plongée des Caraïbes.",
    activites: [
      { label: "Snorkeling & découverte des coraux",     icon: "🤿", q: "snorkeling+coraux+martinique", viator: "/tours/Martinique/Boat-Trip-for-Snorkeling-Discovery-of-Corals/d4316-330665P1" },
      { label: "Plongée & catamaran privé",              icon: "🚤", q: "plongee+catamaran+martinique", viator: "/tours/Trois-Ilets/Diving-and-Snorkeling-Catamaran-Private-Tour-in-Martinique/d50929-350808P2549" },
      { label: "Nager avec les tortues marines",         icon: "🐢", q: "tortues+martinique",           viator: "/tours/Martinique/Sea-Turtles-and-snorkeling/d4316-90901P5" },
    ],
    voiture: true,
  },
  francois: {
    titre: "Réserver vos activités au François",
    desc: "Capitale des fonds blancs et des ilets sauvages — le Bain de Joséphine vous attend.",
    activites: [
      { label: "Bain de Joséphine & fonds blancs",      icon: "🏝️", q: "fond+blanc+francois+martinique", viator: "/tours/Martinique/Bathtub-of-Josephine-and-Islands-Half-day-Boat-trip/d4316-5578749P1" },
      { label: "Ilets sauvages & iguanes de Chancel",   icon: "🦎", q: "ilet+chancel+martinique",         viator: "/tours/Martinique/Discover-the-Splendid-Universe-of-Islands-and-Seabed/d4316-5526744P1" },
      { label: "Excursion dauphins en catamaran",        icon: "🐬", q: "dauphins+martinique",             viator: "/tours/Martinique/Dolphin-run/d4316-135726P1" },
    ],
    voiture: true,
  },
  diamant: {
    titre: "Réserver vos activités au Diamant",
    desc: "Panoramas grandioses et Anse Noire pour les tortues — le sud Martinique à son meilleur.",
    activites: [
      { label: "Anse Noire & Anse Dufour — tortues",    icon: "🐢", q: "tortues+anse+noire+martinique",  viator: "/tours/Martinique/Sea-Turtles-and-snorkeling/d4316-90901P5" },
      { label: "Snorkeling & Anse Coralienne",          icon: "🤿", q: "snorkeling+martinique",           viator: "/tours/Martinique/Boat-Trip-for-Snorkeling-Discovery-of-Corals/d4316-330665P1" },
      { label: "Circuit sud — Rocher Diamant & rum",    icon: "🏔️", q: "circuit+sud+diamant+martinique",  viator: "/tours/Sainte-Luce/Swimming-and-walking-tour-in-Martinique-beach-and-waterfall/d50956-5573354P5" },
    ],
    voiture: true,
  },
  "trois-ilets": {
    titre: "Réserver vos activités aux Trois-Îlets",
    desc: "Base nautique des Caraïbes — catamarans, dauphins, kayaks au départ des Trois-Îlets.",
    activites: [
      { label: "Catamaran dauphins & tortues — journée", icon: "⛵", q: "catamaran+dauphins+martinique", viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
      { label: "Observation des dauphins en mer",        icon: "🐬", q: "dauphins+martinique",            viator: "/tours/Martinique/Dolphin-run/d4316-135726P1" },
      { label: "Plongée & snorkeling privé catamaran",   icon: "🤿", q: "plongee+catamaran+martinique",   viator: "/tours/Trois-Ilets/Diving-and-Snorkeling-Catamaran-Private-Tour-in-Martinique/d50929-350808P2549" },
    ],
    voiture: true,
  },
  "sainte-luce": {
    titre: "Réserver vos activités à Sainte-Luce",
    desc: "Les coraux et les tortues de Sainte-Luce comptent parmi les plus beaux de l'île.",
    activites: [
      { label: "Snorkeling — coraux & tortues marines",  icon: "🤿", q: "snorkeling+tortues+sainte+luce", viator: "/tours/Martinique/Boat-Trip-for-Snorkeling-Discovery-of-Corals/d4316-330665P1" },
      { label: "Catamaran & Anse Coralienne",            icon: "⛵", q: "catamaran+martinique",             viator: "/tours/Martinique/Sea-Turtles-and-snorkeling/d4316-90901P5" },
      { label: "Bateau & ilets du sud Martinique",       icon: "🏝️", q: "ilets+sud+martinique",             viator: "/tours/Martinique/Discover-the-Splendid-Universe-of-Islands-and-Seabed/d4316-5526744P1" },
    ],
    voiture: true,
  },
  distilleries: {
    titre: "Réserver votre circuit rhum",
    desc: "Martinique, seule île au monde avec une AOC pour son rhum agricole — les distilleries se visitent en circuit.",
    activites: [
      { label: "Circuit distilleries — dégustation guidée", icon: "🥃", q: "rhum+distillerie+martinique",  viator: "/tours/Fort-de-France/Rum-Production-Private-Tour-in-Martinique/d50911-350808P2550" },
      { label: "Habitation Clément & circuit vanille",      icon: "🌿", q: "clement+vanille+martinique",    viator: "/tours/Fort-de-France/Vanilla-Tour/d50911-5603024P5" },
      { label: "Tour nord — Saint-Pierre & Pelée",          icon: "🌋", q: "nord+saint+pierre+martinique",  viator: "/tours/Martinique/North-Island-Tour/d4316-60987P1" },
    ],
    voiture: true,
    voitureNote: "Indispensable pour relier les distilleries — elles sont réparties sur toute l'île.",
  },
  "saint-pierre": {
    titre: "Réserver vos excursions dans le Nord",
    desc: "Le nord de la Martinique se découvre en circuit guidé — Saint-Pierre, Pelée, cascades.",
    activites: [
      { label: "Tour nord — Saint-Pierre, forêt tropicale",  icon: "🌋", q: "saint+pierre+nord+martinique",  viator: "/tours/Martinique/North-Island-Tour/d4316-60987P1" },
      { label: "Circuit Nord complet — rum, plage noire",    icon: "🏖️", q: "circuit+nord+martinique",         viator: "/tours/Martinique/North-Tour/d4316-207697P1" },
      { label: "Cascades & forêt tropicale — guide expert",  icon: "🌿", q: "cascades+foret+martinique",        viator: "/tours/Fort-de-France/Caribbean-Northern-Circuit/d50911-5603024P2" },
    ],
    voiture: true,
  },
  randonnees: {
    titre: "Réserver vos excursions nature",
    desc: "Randonnées guidées — Montagne Pelée, cascades, mangrove et sentiers panoramiques.",
    activites: [
      { label: "Tour nord — Pelée, forêt, cascades",      icon: "🌿", q: "randonnee+nord+martinique",   viator: "/tours/Fort-de-France/Caribbean-Northern-Circuit/d50911-5603024P2" },
      { label: "Circuit panoramas & biodiversité",         icon: "🏔️", q: "panorama+nature+martinique",   viator: "/tours/Martinique/Nature-and-Panorama-Tour/d4316-100493P1" },
      { label: "Mangrove & vanille — producteurs locaux",  icon: "🌱", q: "mangrove+vanille+martinique",  viator: "/tours/Fort-de-France/Vanilla-Tour/d50911-5603024P5" },
    ],
    voiture: true,
  },
  gastronomie: {
    titre: "Réserver vos expériences culinaires",
    desc: "Tour gastronomique, marchés créoles, circuit vanille & rhum — Martinique est une île à déguster.",
    activites: [
      { label: "Tour gastronomique Fort-de-France",    icon: "🍽️", q: "gastronomie+fort+de+france",       viator: "/tours/Martinique/Fort-de-France-Food-Tasting-and-Cultural-Walking-Tour/d4316-30485P31" },
      { label: "Circuit vanille & producteurs locaux", icon: "🌿", q: "vanille+producteurs+martinique",    viator: "/tours/Fort-de-France/Vanilla-Tour/d50911-5603024P5" },
      { label: "Dégustation rhum AOC en distillerie",  icon: "🥃", q: "rhum+degustation+martinique",       viator: "/tours/Fort-de-France/Rum-Production-Private-Tour-in-Martinique/d50911-350808P2550" },
    ],
    voiture: true,
  },
  explorer: {
    titre: "Réserver vos excursions",
    desc: "Tours guidés pour explorer le meilleur de la Martinique — nord, sud, mer ou terre.",
    activites: [
      { label: "Circuit nord complet — Pelée & Saint-Pierre", icon: "🌋", q: "circuit+nord+martinique",     viator: "/tours/Martinique/North-Island-Tour/d4316-60987P1" },
      { label: "Catamaran dauphins & tortues — journée",      icon: "⛵", q: "catamaran+dauphins+tortues",  viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
      { label: "Tour panoramique nature & biodiversité",      icon: "🏔️", q: "panorama+nature+martinique",  viator: "/tours/Martinique/Nature-and-Panorama-Tour/d4316-100493P1" },
    ],
    voiture: true,
  },
  activites: {
    titre: "Réserver vos activités en Martinique",
    desc: "Excursions sélectionnées — mer, terre, culture — disponibles toute l'année.",
    activites: [
      { label: "Catamaran — dauphins & tortues",          icon: "⛵", q: "catamaran+martinique",    viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
      { label: "Snorkeling & coraux",                     icon: "🤿", q: "snorkeling+martinique",   viator: "/tours/Martinique/Boat-Trip-for-Snorkeling-Discovery-of-Corals/d4316-330665P1" },
      { label: "Circuits nord & sud — culture & nature",  icon: "🗺️", q: "circuit+martinique",      viator: "/tours/Martinique/North-Island-Tour/d4316-60987P1" },
    ],
    voiture: true,
  },
  "meilleure-saison": {
    titre: "Réserver vos activités",
    desc: "Quelle que soit la saison, la Martinique offre mer, nature et culture toute l'année.",
    activites: [
      { label: "Catamaran & excursions en mer",           icon: "⛵", q: "catamaran+mer+martinique",     viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
      { label: "Randonnées & nature en saison sèche",     icon: "🌿", q: "randonnee+nature+martinique",  viator: "/tours/Martinique/Nature-and-Panorama-Tour/d4316-100493P1" },
      { label: "Circuit culturel & rhum",                 icon: "🥃", q: "circuit+culture+rhum",         viator: "/tours/Fort-de-France/Caribbean-Northern-Circuit/d50911-5603024P2" },
    ],
    voiture: true,
  },
  "villa-piscine": {
    titre: "Réserver vos excursions",
    desc: "Combinez villa avec piscine et journées en mer — le duo parfait pour Martinique.",
    activites: [
      { label: "Catamaran dauphins & tortues",           icon: "⛵", q: "catamaran+dauphins+martinique", viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
      { label: "Snorkeling & nage avec les tortues",     icon: "🐢", q: "snorkeling+tortues+martinique", viator: "/tours/Martinique/Sea-Turtles-and-snorkeling/d4316-90901P5" },
      { label: "Circuit nord — forêt & Saint-Pierre",   icon: "🌋", q: "circuit+nord+martinique",        viator: "/tours/Martinique/North-Island-Tour/d4316-60987P1" },
    ],
    voiture: true,
  },
  seminaires: {
    titre: "Activités team building & groupes",
    desc: "Catamaran privatif, circuits culturels, sorties en mer — idéal pour les groupes.",
    activites: [
      { label: "Catamaran privatif — dauphins & plongée", icon: "⛵", q: "catamaran+prive+martinique",  viator: "/tours/Trois-Ilets/Diving-and-Snorkeling-Catamaran-Private-Tour-in-Martinique/d50929-350808P2549" },
      { label: "Tour privé & circuit sur mesure",         icon: "🗺️", q: "tour+prive+martinique",        viator: "/tours/Fort-de-France/Half-Day-Private-Custom-Tour-of-Martinique/d50911-350808P2541" },
      { label: "Dégustation rhum & circuit culturel",     icon: "🥃", q: "rhum+circuit+groupe",           viator: "/tours/Fort-de-France/Rum-Production-Private-Tour-in-Martinique/d50911-350808P2550" },
    ],
    voiture: true,
  },
  sejour: {
    titre: "Réserver vos activités",
    desc: "Les incontournables pour un séjour réussi en Martinique — à réserver à l'avance.",
    activites: [
      { label: "Catamaran dauphins & tortues",         icon: "⛵", q: "catamaran+martinique",        viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
      { label: "Bain de Joséphine & fonds blancs",     icon: "🏝️", q: "fond+blanc+martinique",       viator: "/tours/Martinique/Bathtub-of-Josephine-and-Islands-Half-day-Boat-trip/d4316-5578749P1" },
      { label: "Circuit nord — Pelée, rhum, plage",    icon: "🌋", q: "circuit+nord+saint+pierre",   viator: "/tours/Martinique/North-Island-Tour/d4316-60987P1" },
    ],
    voiture: true,
  },
  proximite: {
    titre: "Activités à proximité de vos villas",
    desc: "Snorkeling, tortues, catamarans — les meilleures excursions partent à quelques minutes.",
    activites: [
      { label: "Snorkeling & coraux à proximité",      icon: "🤿", q: "snorkeling+martinique",         viator: "/tours/Martinique/Boat-Trip-for-Snorkeling-Discovery-of-Corals/d4316-330665P1" },
      { label: "Catamaran en mer des Caraïbes",        icon: "⛵", q: "catamaran+martinique",           viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
      { label: "Nager avec les tortues marines",       icon: "🐢", q: "tortues+nage+martinique",        viator: "/tours/Martinique/Sea-Turtles-and-snorkeling/d4316-90901P5" },
    ],
    voiture: true,
  },
  en: {
    titre: "Book your activities in Martinique",
    desc: "Best excursions — catamarans, sea turtles, dolphins, rum distilleries.",
    activites: [
      { label: "Catamaran — dolphins & sea turtles",    icon: "⛵", q: "catamaran+dolphins+martinique",  viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
      { label: "Snorkeling — corals & turtles",         icon: "🤿", q: "snorkeling+martinique",          viator: "/tours/Martinique/Boat-Trip-for-Snorkeling-Discovery-of-Corals/d4316-330665P1" },
      { label: "North island tour — rum, volcano",      icon: "🌋", q: "north+tour+martinique",          viator: "/tours/Martinique/North-Island-Tour/d4316-60987P1" },
    ],
    voiture: true,
    voitureLabel: "Compare car rental offers →",
  },
  poi: {
    titre: "Réserver vos excursions",
    desc: "Tous les sites visités existent en version guidée — avec transport et expert local inclus.",
    activites: [
      { label: "Tour guidé circuit nord — expert local", icon: "🗺️", q: "circuit+nord+guide+martinique", viator: "/tours/Martinique/North-Island-Tour/d4316-60987P1" },
      { label: "Catamaran dauphins & tortues",           icon: "⛵", q: "catamaran+martinique",           viator: "/tours/Martinique/Full-day-EN-Catamaran-Martinique-Dolphins-and-Turtles/d4316-90901P10" },
      { label: "Circuit panoramas & nature",             icon: "🏔️", q: "panorama+nature+martinique",    viator: "/tours/Martinique/Nature-and-Panorama-Tour/d4316-100493P1" },
    ],
    voiture: true,
  },
};

export default function BlocAffilie({ slug }) {
  const cfg = CONFIGS[slug];
  if (!cfg) return null;

  const { titre, desc, activites, voiture, voitureNote, voitureLabel } = cfg;
  const dcLabel = voitureLabel || "Comparer les offres voiture →";
  const dcNote  = voitureNote  || "Location de voiture indispensable pour explorer l'île à votre rythme.";

  return (
    <div style={{ padding: "48px 24px 32px", background: IVORY, borderTop: `1px solid ${SAND}` }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: CORAL, margin: "0 0 8px" }}>
          Activités & excursions
        </p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 28, color: NAVY, margin: "0 0 8px", lineHeight: 1.2 }}>
          {titre}
        </h2>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 15, color: MUTED, margin: "0 0 28px", lineHeight: 1.6 }}>
          {desc}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: voiture ? 24 : 0 }}>
          {activites.map((act, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{act.icon}</div>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: NAVY, margin: "0 0 12px", lineHeight: 1.4 }}>
                {act.label}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a
                  href={GYG_BASE + act.q}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  style={{ fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 400, color: CORAL, textDecoration: "none", border: `1px solid ${CORAL}`, borderRadius: 6, padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  GetYourGuide →
                </a>
                <a
                  href={`${VIATOR_BASE}${act.viator}?pid=P00306913&mcid=42383&medium=link`}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  style={{ fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 400, color: MUTED, textDecoration: "none", border: `1px solid ${SAND}`, borderRadius: 6, padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  Viator →
                </a>
              </div>
            </div>
          ))}
        </div>

        {voiture && (
          <div style={{ background: `${NAVY}08`, border: `1px solid ${SAND}`, borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: NAVY, margin: "0 0 4px" }}>
                🚗 Location de voiture
              </p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: MUTED, margin: 0 }}>
                {dcNote}
              </p>
            </div>
            <a
              href={DC_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 13, color: "#fff", background: NAVY, textDecoration: "none", borderRadius: 8, padding: "10px 18px", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {dcLabel}
            </a>
          </div>
        )}

        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: SAND, margin: "12px 0 0", textAlign: "right" }}>
          Liens sponsorisés · commission sans frais supplémentaires pour vous
        </p>
      </div>
    </div>
  );
}
