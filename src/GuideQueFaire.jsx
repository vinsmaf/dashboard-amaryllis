// Que faire en Martinique — /que-faire-martinique
// Hub SEO haute-intention : agrège toutes les expériences + liens affiliés + maillage guides

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";
import EncartActivite from "./components/EncartActivite.jsx";
import LienAffilie from "./components/LienAffilie.jsx";
import { ACTIVITES } from "./data/activites.js";
import ReadingProgressBar from "./components/ReadingProgressBar.jsx";
import BridgeVilla from "./components/BridgeVilla.jsx";
import GuideHero from "./components/GuideHero.jsx";
import GuideStickyNav from "./components/GuideStickyNav.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG = "/photos/martinique-panorama.jpg";

const badges = [
  { icon: "🏖️", label: "Plages de sable blanc" },
  { icon: "🐢", label: "Tortues & dauphins" },
  { icon: "🌋", label: "Montagne Pelée" },
  { icon: "🥃", label: "Rhum AOC" },
  { icon: "🤿", label: "Plongée d'exception" },
];

const NAV_SECTIONS = [
  { id: "mer",         label: "🌊 Mer" },
  { id: "nature",      label: "🌿 Nature" },
  { id: "culture",     label: "🥃 Culture" },
  { id: "gastronomie", label: "🍽️ Gastronomie" },
  { id: "pratique",    label: "🚗 Pratique" },
];

const GUIDES_THEMATIQUES = [
  { href: "/guide-sainte-anne",            emoji: "🏖️", nom: "Les Salines & Sainte-Anne",         accroche: "La plus belle plage des Caraïbes" },
  { href: "/guide-arlet",                  emoji: "🐢", nom: "Anses d'Arlet & tortues",            accroche: "Nager avec les tortues marines" },
  { href: "/guide-le-diamant",             emoji: "🗿", nom: "Le Diamant",                          accroche: "Plongée face au Rocher mythique" },
  { href: "/guide-francois-martinique",    emoji: "🤍", nom: "Fonds Blancs du François",           accroche: "Mer à 1 m, piscine naturelle" },
  { href: "/guide-saint-pierre-martinique",emoji: "⛪", nom: "Saint-Pierre",                       accroche: "La Pompéi des Antilles" },
  { href: "/guide-trois-ilets",            emoji: "⚓", nom: "Trois-Îlets",                        accroche: "Village créole & marina" },
  { href: "/guide-plongee-martinique",     emoji: "🤿", nom: "Plongée & snorkeling",               accroche: "Tous les spots du Sud" },
  { href: "/guide-randonnees-martinique",  emoji: "🥾", nom: "Randonnées",                         accroche: "Du littoral au volcan" },
  { href: "/guide-distilleries-martinique",emoji: "🥃", nom: "Distilleries de rhum",               accroche: "Route des rhums AOC" },
  { href: "/guide-gastronomie-martinique", emoji: "🍽️", nom: "Gastronomie créole",                 accroche: "Accras, colombos, langouste" },
  { href: "/location-voiture-martinique-pas-cher", emoji: "🚗", nom: "Location de voiture",        accroche: "Indispensable pour explorer l'île" },
  { href: "/activites-sainte-luce",        emoji: "🌟", nom: "10 activités depuis Sainte-Luce",   accroche: "La sélection de vos hôtes" },
];

const S = {
  section: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "64px 24px 0",
  },
  h2: {
    fontFamily: "'Jost', sans-serif",
    fontWeight: 200,
    fontSize: "clamp(28px, 5vw, 42px)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: NAVY,
    margin: "0 0 8px",
  },
  eyebrow: {
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    fontSize: 11,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: CORAL,
    margin: "0 0 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  divider: {
    width: 22,
    height: 1,
    background: CORAL,
    display: "inline-block",
  },
  lead: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontStyle: "italic",
    fontSize: "clamp(18px, 2.5vw, 22px)",
    color: MUTED,
    lineHeight: 1.7,
    margin: "0 0 32px",
    maxWidth: 640,
  },
  p: {
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    fontSize: 16,
    lineHeight: 1.75,
    color: TEXT,
    margin: "0 0 20px",
  },
  h3: {
    fontFamily: "'Jost', sans-serif",
    fontWeight: 500,
    fontSize: 18,
    color: NAVY,
    margin: "32px 0 8px",
    letterSpacing: "0.02em",
  },
  card: (accent) => ({
    background: "#fff",
    border: `1px solid ${SAND}`,
    borderLeft: `4px solid ${accent || CORAL}`,
    borderRadius: "0 12px 12px 0",
    padding: "20px 24px",
    marginBottom: 20,
  }),
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
    marginTop: 24,
  },
  guideCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "16px 18px",
    background: "#fff",
    border: `1px solid ${SAND}`,
    borderRadius: 12,
    textDecoration: "none",
    color: "inherit",
    transition: "box-shadow .2s",
  },
};

const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };

export default function GuideQueFaire() {
  return (
    <div style={{ background: CREAM, minHeight: "100vh" }} data-surface="site">
      <SEOMeta
        title="Que faire en Martinique — 20 expériences incontournables | Amaryllis"
        description="Notre sélection des meilleures activités en Martinique : nautique, randonnées, culture créole, gastronomie et rhum. Guide complet par vos hôtes de Sainte-Luce."
        canonical={`${BASE}/que-faire-martinique`}
        og={{ image: `${BASE}${HERO_IMG}`, type: "article" }}
        schema={{
          "@context": "https://schema.org",
          "@type": "TouristAttraction",
          name: "Que faire en Martinique",
          description: "Guide complet des meilleures activités en Martinique",
          url: `${BASE}/que-faire-martinique`,
          touristType: ["Cultural", "Nature", "Adventure"],
          geo: { "@type": "GeoCoordinates", latitude: 14.666, longitude: -61.0 },
        }}
      />

      <ReadingProgressBar color={CORAL} />

      <GuideHero
        img={HERO_IMG}
        alt="Martinique — mer turquoise, volcan et végétation tropicale"
        eyebrow="Guide complet"
        title="Que faire en Martinique"
        subtitle="Mer turquoise, volcan, rhum & cuisine créole — tout ce qu'il ne faut pas manquer, sélectionné par vos hôtes."
        badges={badges}
        lang="fr"
        navLogo="/"
        navBack={{ href: "/guide-hub", label: "Tous les guides" }}
      />

      <GuideStickyNav sections={NAV_SECTIONS} />

      {/* ── ACTIVITÉS EN VEDETTE — immédiatement après le hero ── */}
      <div style={{ background: NAVY, padding: "0 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", paddingTop: 32, paddingBottom: 8 }}>
          <EncartActivite
            activites={[ACTIVITES.catamaran, ACTIVITES.tortues]}
            platform="gyg"
            big
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — MER & NAUTIQUE
      ══════════════════════════════════════════════════════ */}
      <section id="mer" style={S.section}>
        <p style={S.eyebrow}><span style={S.divider} />Activités nautiques</p>
        <h2 style={S.h2}>Mer & Nautique</h2>
        <p style={S.lead}>
          La Martinique offre certains des plus beaux spots de plongée et snorkeling des Caraïbes.
          Tortues marines, dauphins, coraux colorés et fonds transparents — l'île est un paradis sous-marin.
        </p>

        <div style={S.card()}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🐢 Nager avec les tortues marines — Anses d'Arlet</h3>
          <p style={S.p}>
            L'Anse Noire (commune des Anses-d'Arlet) est le spot le plus accessible pour observer des tortues marines en snorkeling. Elles se trouvent à moins de 20 mètres du bord, dans 2 à 4 mètres d'eau — masque et tuba suffisent. La meilleure heure : tôt le matin avant l'arrivée des groupes. Depuis nos villas à Sainte-Luce : environ 40 minutes.
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <a href="/guide-arlet" style={{ color: CORAL, fontWeight: 500 }}>→ Guide complet des Anses d'Arlet</a>
          </p>
        </div>

        <div style={S.card()}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>⛵ Catamaran à la journée — dauphins & tortues</h3>
          <p style={S.p}>
            Une journée en catamaran vers les îlets du Sud est l'excursion phare de la Martinique. Vous naviguez vers des zones protégées, snorkelez au-dessus des coraux et avez de grandes chances de croiser des dauphins en liberté. Déjeuner barbecue à bord inclus. Départ depuis la marina du Marin (15 minutes de Sainte-Luce). Réserver à l'avance en haute saison.
          </p>
        </div>

        <div style={S.card()}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🤿 Plongée sous-marine — Rocher du Diamant & épaves</h3>
          <p style={S.p}>
            Le Rocher du Diamant, classé réserve naturelle, est l'un des spots de plongée les plus réputés des Caraïbes. Les épaves de Saint-Pierre — 20 navires coulés lors de l'éruption de la Pelée en 1902 — constituent un site de plongée unique au monde, classé monument historique. Niveaux I et II disponibles, clubs locaux sur toute la côte Sud.
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <a href="/guide-plongee-martinique" style={{ color: CORAL, fontWeight: 500 }}>→ Guide plongée & snorkeling — tous les spots</a>
          </p>
        </div>

        <div style={S.card()}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🤍 Bain de Joséphine & Fonds Blancs (Le François)</h3>
          <p style={S.p}>
            Les fonds blancs du François (côte Atlantique) sont uniques en leur genre : des bancs de sable immaculés affleurent à fleur d'eau, permettant de se baigner dans 50 cm à 1 mètre d'eau, au milieu de l'océan, à 20 minutes en bateau du port du François. Le "Bain de Joséphine" — où l'impératrice venait se baigner — est le plus célèbre. Une expérience irréelle.
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <a href="/guide-francois-martinique" style={{ color: CORAL, fontWeight: 500 }}>→ Guide complet du François & Fonds Blancs</a>
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: "32px auto 0", padding: "0 24px" }}>
        <EncartActivite
          activites={[ACTIVITES.snorkeling, ACTIVITES["fonds-blancs"]]}
          platform="gyg"
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — RANDONNÉES & NATURE
      ══════════════════════════════════════════════════════ */}
      <section id="nature" style={S.section}>
        <p style={S.eyebrow}><span style={S.divider} />Randonnées & Biodiversité</p>
        <h2 style={S.h2}>Nature & Randonnées</h2>
        <p style={S.lead}>
          De la forêt tropicale humide aux sommets volcaniques, la Martinique concentre une biodiversité exceptionnelle sur 1 128 km². Colibris, anolis, iguanes, manchineliers — chaque sentier est une découverte.
        </p>

        <div style={S.card("#2e7d6e")}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🌋 Montagne Pelée — ascension du volcan</h3>
          <p style={S.p}>
            Gravir la Montagne Pelée (1 397 m) est l'expérience nature ultime de la Martinique. Le volcan, qui a détruit Saint-Pierre en 1902, s'impose comme un défi accessible à tout marcheur en bonne forme. Départ depuis le parking de l'Aileron (Morne Rouge), 2h30 à 3h de montée. Au sommet, par temps clair : vue jusqu'à la Dominique et Sainte-Lucie. Départ recommandé avant 7h pour éviter les nuages.
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <a href="/guide-randonnees-martinique" style={{ color: CORAL, fontWeight: 500 }}>→ Guide randonnées complet — tous les sentiers de l'île</a>
          </p>
        </div>

        <div style={S.card("#2e7d6e")}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🦜 Presqu'île de la Caravelle — réserve naturelle</h3>
          <p style={S.p}>
            La Caravelle est la randonnée la plus complète de Martinique : mangrove, forêt sèche, falaises atlantiques, plages sauvages et les ruines romantiques du château Dubuc (XVIIe siècle). 12 km aller-retour, 2h30 à 3h, niveau modéré. Frégates, pélicans bruns, iguanes — la faune est remarquable. Depuis nos villas : 1h via l'A1. Arriver tôt (places de parking limitées).
          </p>
        </div>

        <div style={S.card("#2e7d6e")}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🌿 Forêt de Montravail — à 10 min des villas</h3>
          <p style={S.p}>
            La randonnée de proximité par excellence depuis Sainte-Luce. La forêt domaniale de Montravail offre des sentiers balisés dans une forêt tropicale humide, ombragée même en plein été. Bambouseraies, kapokiers, colibris. Circuits de 1h à 2h, accessibles avec des enfants. À combiner avec la visite de la distillerie Trois-Rivières à quelques minutes.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: "32px auto 0", padding: "0 24px" }}>
        <EncartActivite
          activites={[ACTIVITES["nature-panorama"], ACTIVITES.nord]}
          platform="gyg"
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — CULTURE, HISTOIRE & RHUM
      ══════════════════════════════════════════════════════ */}
      <section id="culture" style={S.section}>
        <p style={S.eyebrow}><span style={S.divider} />Histoire, rhum & patrimoine</p>
        <h2 style={S.h2}>Culture & Rhum</h2>
        <p style={S.lead}>
          La Martinique est la seule île des Caraïbes à produire un rhum sous Appellation d'Origine Contrôlée. Sa culture créole mêle héritage africain, européen et amérindien dans une identité unique.
        </p>

        <div style={S.card("#8b4513")}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🥃 La Route des Distilleries — rhum AOC Martinique</h3>
          <p style={S.p}>
            12 distilleries actives, une seule AOC au monde pour le rhum agricole : la Martinique est unique. La route des distilleries depuis Sainte-Luce commence par Trois-Rivières (5 min), passe par JM, Depaz et Clément. Chaque domaine a sa personnalité, son terroir, ses méthodes. Les visites guidées sont gratuites ou peu coûteuses — dégustations incluses. Prévoir une demi-journée minimum.
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <a href="/guide-distilleries-martinique" style={{ color: CORAL, fontWeight: 500 }}>→ Guide complet des distilleries — carte & infos pratiques</a>
          </p>
        </div>

        <div style={S.card("#8b4513")}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>⛪ Saint-Pierre — la Pompéi des Antilles</h3>
          <p style={S.p}>
            Saint-Pierre était la "Petit Paris des Antilles" — 30 000 habitants, opéra, cathédrale, commerce florissant. Le 8 mai 1902, l'éruption de la Montagne Pelée l'a effacée en 3 minutes. Aujourd'hui, la ville reconstruite coexiste avec les ruines de l'ancienne et ses 20 épaves classées, dont l'une des plus belles pour la plongée dans les Caraïbes. Un lieu chargé d'une émotion particulière.
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <a href="/guide-saint-pierre-martinique" style={{ color: CORAL, fontWeight: 500 }}>→ Guide complet de Saint-Pierre</a>
          </p>
        </div>

        <div style={S.card("#8b4513")}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🤍 Le Mémorial de l'Anse-Caffard — Cap 110</h3>
          <p style={S.p}>
            Sur la falaise du Diamant, 20 sculptures de béton blanc grandeur nature — enchaînées, penchées vers l'Afrique — commémorent les 400 esclaves morts dans le naufrage du navire négrier "L'Hermione" en 1830. L'une des œuvres les plus émouvantes des Caraïbes. Entrée libre, vue imprenable sur le Rocher du Diamant. À 20 minutes de Sainte-Luce.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: "32px auto 0", padding: "0 24px" }}>
        <EncartActivite
          activites={[ACTIVITES.rhum, ACTIVITES["petit-train-banane"]]}
          platform="viator"
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 4 — GASTRONOMIE
      ══════════════════════════════════════════════════════ */}
      <section id="gastronomie" style={S.section}>
        <p style={S.eyebrow}><span style={S.divider} />Cuisine & saveurs créoles</p>
        <h2 style={S.h2}>Gastronomie créole</h2>
        <p style={S.lead}>
          Accras de morue, colombo de poulet, court-bouillon de poisson, langouste grillée et ti-punch au rhum vieux — la cuisine créole est une fête à chaque repas.
        </p>

        <div style={S.card("#b8860b")}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🍽️ Les incontournables de la cuisine martiniquaise</h3>
          <p style={S.p}>
            <strong>Accras de morue</strong> : beignets de morue épicés, la mise en bouche créole par excellence. <strong>Colombo</strong> : le curry des Antilles, à base de porc, poulet ou cabri, avec des légumes du pays. <strong>Blaff</strong> : poisson cuit à l'eau de mer épicée, technique d'une délicatesse remarquable. <strong>Ti-punch</strong> : rhum agricole, citron vert, sucre de canne — à boire le matin selon la tradition, mais surtout à savourer.
          </p>
        </div>

        <div style={S.card("#b8860b")}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🛒 Marchés & étals à ne pas manquer</h3>
          <p style={S.p}>
            Le marché du bourg de Sainte-Luce (samedi matin) est un rendez-vous incontournable : poisson grillé au feu de bois, lambi (conque), accras, fruits exotiques et épices. Le Grand Marché de Fort-de-France (tous les jours) est le plus grand marché couvert des Antilles françaises — 300 étals de fruits, légumes, épices et artisanat. Arriver tôt pour la meilleure sélection et les prix les plus bas.
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <a href="/guide-gastronomie-martinique" style={{ color: CORAL, fontWeight: 500 }}>→ Guide gastronomie créole — restaurants & adresses secrètes</a>
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: "32px auto 0", padding: "0 24px" }}>
        <EncartActivite
          activites={[ACTIVITES["food-tour"], ACTIVITES.vanille]}
          platform="viator"
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 5 — PRATIQUE
      ══════════════════════════════════════════════════════ */}
      <section id="pratique" style={S.section}>
        <p style={S.eyebrow}><span style={S.divider} />Se déplacer & organiser</p>
        <h2 style={S.h2}>Infos pratiques</h2>
        <p style={S.lead}>
          La Martinique se visite en voiture. Les transports en commun (TCM) couvrent les grandes villes mais pas les sites naturels. Prévoyez votre location dès l'arrivée.
        </p>

        <div style={S.card(NAVY)}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>🚗 Location de voiture — indispensable</h3>
          <p style={S.p}>
            Sans voiture, les plus beaux sites de l'île (Pelée, Caravelle, Anses d'Arlet, Fonds Blancs) sont inaccessibles. Réservez avant votre arrivée — l'offre est limitée en haute saison. Les routes sont en bon état, la signalisation claire. Comptez 30 à 90 minutes selon les destinations depuis Sainte-Luce.
          </p>
          <div style={{ margin: "16px 0 0" }}>
            <LienAffilie partenaire="discoverCars" utmContent="guide-que-faire-pratique">
              Comparer les prix de location →
            </LienAffilie>
          </div>
          <p style={{ ...S.p, fontSize: 13, color: MUTED, marginTop: 12, marginBottom: 0 }}>
            <a href="/location-voiture-martinique-pas-cher" style={{ color: MUTED }}>→ Guide complet : louer une voiture en Martinique pas cher</a>
          </p>
        </div>

        <div style={S.card(NAVY)}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>☀️ Quelle saison pour visiter ?</h3>
          <p style={S.p}>
            La Martinique se visite toute l'année. La saison sèche (janvier–juin) offre les meilleures conditions : ciel bleu, mer calme, visibilité sous-marine excellente. La saison humide (juillet–novembre) est moins fréquentée mais tout aussi belle — des averses tropicales courtes, une végétation luxuriante et des prix plus bas. Les mois de juillet–août restent agréables malgré la chaleur.
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <a href="/meilleure-saison-martinique" style={{ color: CORAL, fontWeight: 500 }}>→ Guide complet : la meilleure saison pour visiter la Martinique</a>
          </p>
        </div>

        <div style={S.card(NAVY)}>
          <h3 style={{ ...S.h3, margin: "0 0 8px" }}>✈️ Comment venir ?</h3>
          <p style={S.p}>
            Vol direct depuis Paris (CDG, Orly) en 8h30. Vols directs depuis Lyon, Nantes, Bordeaux et d'autres villes françaises en saison. L'aéroport Aimé Césaire (FDF) est à 30 minutes de Sainte-Luce. Les compagnies opèrent Air France, Corsair, Air Caraïbes et French Bee.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MAILLAGE INTERNE — Tous les guides
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...S.section, paddingTop: 56 }}>
        <p style={S.eyebrow}><span style={S.divider} />Explorer plus loin</p>
        <h2 style={{ ...S.h2, marginBottom: 24 }}>Tous nos guides Martinique</h2>
        <div style={S.grid}>
          {GUIDES_THEMATIQUES.map((g) => (
            <a
              key={g.href}
              href={g.href}
              style={S.guideCard}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(14,59,58,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{g.emoji}</span>
              <div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 3 }}>{g.nom}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: MUTED }}>{g.accroche}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BRIDGE VILLA + NEWSLETTER
      ══════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 860, margin: "56px auto 0", padding: "0 24px" }}>
        <BridgeVilla context="que-faire-martinique" />
      </div>

      <div style={{ maxWidth: 860, margin: "48px auto 0", padding: "0 24px 80px" }}>
        <NewsletterForm dark={false} />
      </div>
        <MaillageCluster currentSlug="que-faire-martinique" bienNames={BIEN_NAMES} />
    </div>
  );
}
