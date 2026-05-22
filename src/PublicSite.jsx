import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { loadDailyPrices, applyServerPriceOverrides } from "./seedPrices.js";
import SEOMeta from "./SEOMeta.jsx";
import { Reveal } from "./useReveal.jsx";
import { useLang, LangToggle } from "./i18n.jsx";

// ── Brand palette (from logos.jsx) ──────────────────────────────
// Remises par durée de séjour (appliquées sur le sous-total)
function getDiscount(nights) {
  if (nights >= 28) return 0.15; // -15% pour 28+ nuits
  if (nights >= 14) return 0.10; // -10% pour 14+ nuits
  if (nights >= 7)  return 0.05; // -5%  pour 7+  nuits
  return 0;
}
function discountLabel(nights) {
  if (nights >= 28) return "mensuel";
  if (nights >= 14) return "2 semaines";
  return "semaine";
}

// Valeurs par défaut — surchargées par la config admin (séjour minimum)
const MIN_NIGHTS_DEFAULT = {
  amaryllis:  4,
  geko:       3,
  zandoli:    3,
  schoelcher: 3,
  mabouya:    2,
  nogent:     1,
  iguana:     0,
};

function loadMinNightsConfig() {
  try { return JSON.parse(localStorage.getItem("amaryllis_min_nights_v2") || "{}"); }
  catch { return {}; }
}
function saveMinNightsConfig(cfg) {
  try { localStorage.setItem("amaryllis_min_nights_v2", JSON.stringify(cfg)); } catch {}
}

// ── Cache module-level + listeners pour réactivité cross-composant ──
let _mnCfg = loadMinNightsConfig();
const _mnListeners = new Set();

function _refreshMnCache() {
  _mnCfg = loadMinNightsConfig();
  _mnListeners.forEach(fn => fn(_mnCfg));
}

// Écoute les changements depuis l'admin (même onglet) et autres onglets
if (typeof window !== "undefined") {
  window.addEventListener("amaryllis_config_updated", _refreshMnCache); // même onglet
  window.addEventListener("storage", e => {
    if (!e.key || e.key === "amaryllis_min_nights_v2") _refreshMnCache();
  });
}

/**
 * Hook React — force un re-render quand la config min-nuits change.
 * Utiliser dans les composants qui affichent ou vérifient le minimum.
 */
function useMinNights() {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick(n => n + 1);
    _mnListeners.add(fn);
    return () => _mnListeners.delete(fn);
  }, []);
}

/**
 * Retourne le séjour minimum pour un bien à une date de check-in donnée.
 * Lit depuis le cache module-level (toujours à jour via les listeners).
 * @param {string} bienId
 * @param {string|null} checkinDate  YYYY-MM-DD ou null
 */
function getMinNights(bienId, checkinDate) {
  const cfg     = _mnCfg;
  const bienCfg = cfg[bienId];
  const fallback = MIN_NIGHTS_DEFAULT[bienId] ?? 1;
  if (!bienCfg) return fallback;
  if (checkinDate && Array.isArray(bienCfg.periods) && bienCfg.periods.length) {
    for (const p of bienCfg.periods) {
      if (checkinDate >= p.from && checkinDate <= p.to) return p.min;
    }
  }
  return bienCfg.default ?? fallback;
}

const FRAIS_MENAGE = {
  nogent:     45,
  amaryllis:  180,
  geko:       70,
  schoelcher: 70,
  zandoli:    70,
  mabouya:    50,
  iguana:     0,
};

// Voyageurs inclus dans le prix de base — au-delà : supplément
const BASE_GUESTS      = { amaryllis: 6, zandoli: 4 };   // inclus dans le tarif de base
const EXTRA_GUEST_RATE = { amaryllis: 50, zandoli: 30 }; // €/personne supplémentaire/nuit

// Animaux — forfait par séjour, max 2
const PET_SUPPLEMENT = 40; // € / séjour (1 ou 2 animaux = même forfait)
const MAX_PETS       = 2;
// Biens où les animaux sont interdits (pas de sélecteur)
const PETS_FORBIDDEN = new Set(["nogent"]);

// Biens désactivés à la réservation (ex: longue durée)
const BOOKING_DISABLED = new Set(["iguana"]);
// Biens sans affichage de prix (location longue durée)
const PRICE_HIDDEN = new Set(["iguana"]);

const IVORY  = "var(--c-ivory)";  // paper — main background
const CREAM  = "var(--c-cream)";  // cream — card/modal background
const NAVY   = "var(--c-navy)";   // ink — deep antillean teal, primary text & header
const CORAL  = "var(--c-coral)";  // muted coral — accent, CTAs
const SAND   = "var(--c-sand)";   // borders, dividers
const TEXT   = "var(--c-text)";   // body text
const MUTED  = "var(--c-muted)";  // secondary text
const GOLD   = "var(--c-gold)";   // star ratings, accents

// ── CSS Animations ────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("__site_styles")) {
  // Google Fonts — Jost (display) + Cormorant Garamond (serif/italic)
  if (!document.getElementById("__site_fonts")) {
    const link = document.createElement("link");
    link.id = "__site_fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;0,700;1,300&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap";
    document.head.appendChild(link);
  }
  const s = document.createElement("style");
  s.id = "__site_styles";
  s.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideUpFull { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
    .skeleton { background: linear-gradient(90deg,#e8e0d4 25%,#f4ecdc 50%,#e8e0d4 75%); background-size:800px 100%; animation:shimmer 1.4s infinite linear; border-radius:6px; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes slideInRight { from { opacity:0; clip-path:inset(0); transform:translateX(28px); } to { opacity:1; transform:translateX(0); } }
    @keyframes slideInLeft  { from { opacity:0; clip-path:inset(0); transform:translateX(-28px); } to { opacity:1; transform:translateX(0); } }
    @keyframes floatLeaf { 0%,100% { transform:translateY(0) rotate(-3deg); } 50% { transform:translateY(-12px) rotate(3deg); } }
    @keyframes bloomIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
    @keyframes organicMorph {
      0%,100% { border-radius:60% 40% 30% 70%/60% 30% 70% 40%; transform:scale(1) rotate(0deg); }
      25%      { border-radius:30% 60% 70% 40%/50% 60% 30% 60%; transform:scale(1.06) rotate(3deg); }
      50%      { border-radius:50% 50% 20% 80%/25% 80% 20% 75%; transform:scale(0.96) rotate(-2deg); }
      75%      { border-radius:70% 30% 60% 40%/70% 50% 60% 30%; transform:scale(1.03) rotate(2deg); }
    }
    @keyframes carouselProgress { from { transform:scaleX(0); } to { transform:scaleX(1); } }
    @keyframes ctaPulse { 0%,100% { box-shadow:0 4px 22px rgba(196,114,84,0.4); } 50% { box-shadow:0 6px 36px rgba(196,114,84,0.7); } }
    @keyframes curtainLift { 0% { transform:translateY(0); } 100% { transform:translateY(-100%); } }
    @keyframes curtainFadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes curtainPetalSpin { from { transform:rotate(0deg) scale(1); } 50% { transform:rotate(180deg) scale(1.08); } to { transform:rotate(360deg) scale(1); } }
    .map-grid { display:grid; grid-template-columns:1fr 300px; gap:20px; align-items:start; }
    .map-grid-map { border-radius:16px; overflow:hidden; border:1px solid #e0d4bc; height:480px; box-shadow:0 4px 20px rgba(0,0,0,0.07); }
    @media (max-width:700px) {
      .map-grid { grid-template-columns:1fr; }
      .map-grid-map { height:300px; }
    }
    input[type="date"]::-webkit-calendar-picker-indicator { opacity:0.55; cursor:pointer; filter:invert(0.25) sepia(0.3); }
    input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity:0.9; }
    ::selection { background:rgba(196,114,84,0.2); color:#0e3b3a; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:#faf5e9; }
    ::-webkit-scrollbar-thumb { background:rgba(196,114,84,0.3); border-radius:2px; }
  `;
  document.head.appendChild(s);
}

const STRIPE_PK = "pk_live_51QAsyQDstT3IRAj26eVHpBuMZI8UllaKGCCJUNAW5O9BfC3NqzVJwhrgfF0VndNMWPph0vijKomm24OwrTXCG58N00Co6GOWh1";
const WA_NUMBER = "33610880772";
const WA_MSG_DEFAULT = encodeURIComponent("Bonjour, je souhaite obtenir des informations sur une location Amaryllis.");

const DEPOSIT_AMOUNTS = {
  amaryllis: 1500,
  zandoli:   700,
  iguana:    500,
  geko:      500,
  mabouya:   500,
  schoelcher: 1000,
  nogent:    500,
};

const AB = "https://a0.muscache.com/im/pictures/";

const BIENS = [
  {
    id: "amaryllis",
    nom: "Villa Amaryllis",
    airbnbTitle: "Villa Amaryllis - Luxe & sérénité Vue Mer, Piscine",
    lieu: "Sainte-Luce, Martinique",
    tag: "⭐ Coup de cœur Airbnb",
    tagEn: "⭐ Airbnb Guest Favourite",
    desc: "Perchée sur les hauteurs de Sainte-Luce, bercée par les alizés et le parfum des fleurs tropicales, la Villa Amaryllis vous invite à un séjour d'exception. Dès l'arrivée, vous êtes accueillis dans un univers élégant et chaleureux, pensé dans les moindres détails pour que vos vacances soient reposantes et inoubliables. Notre équipe sur place, attentionnée et discrète, veille à ce que chaque instant soit parfait.",
    descEn: "Perched on the heights of Sainte-Luce, caressed by trade winds and tropical flowers, Villa Amaryllis invites you to an exceptional stay. From the moment you arrive, you are welcomed into an elegant, warm setting crafted to the last detail so your holiday is restful and unforgettable. Our discreet, attentive on-site team ensures every moment is perfect.",
    descFull: [
      { titre: "Les chambres", texte: "La villa dispose de trois chambres spacieuses. Chaque chambre est dotée d'un lit king-size pour un sommeil réparateur, d'une salle de bain privative avec douche à l'italienne, vasque en pierre naturelle et WC suspendu, d'un accès direct à la grande terrasse avec vue sur la mer, et de la climatisation pour un confort optimal en toutes saisons." },
      { titre: "Les espaces de vie", texte: "Les pièces à vivre allient convivialité et sérénité : salon lumineux avec canapé confortable et vue mer, salle à manger pour 8 convives baignée de lumière, cuisine américaine entièrement équipée — réfrigérateur, plaques à induction, four combiné, micro-ondes, lave-vaisselle, cafetière, toaster. Tout est prêt pour cuisiner comme à la maison, ou pour accueillir un chef à domicile." },
      { titre: "Les extérieurs", texte: "L'atout majeur de la villa, ce sont ses espaces extérieurs dignes d'une carte postale. Terrasse en bois Cumaru de 100 m², parfaite pour les petits-déjeuners face à la mer ou les apéros au coucher du soleil. Piscine lagon naturel (4×7 m, profondeur 1,35 m) à débordement avec plage immergée, chauffée par le soleil. Jardin tropical fleuri invitant à la détente. Carbet traditionnel en feuille de latanier, équipé d'un hamac, d'un salon d'extérieur et d'une table pour 8 — le lieu idéal pour vos soirées ou vos pauses lecture à l'ombre. Barbecue à gaz avec tout le nécessaire pour préparer poissons frais, langoustes et grillades." },
      { titre: "Équipements & services", texte: "Wifi Starlink haut débit dans toute la propriété. TV connectée. Linge de maison fourni (draps, serviettes, torchons). Espace buanderie. Transats au bord de la piscine." },
      { titre: "Accès", texte: "Vous disposez d'un accès privatif et sécurisé à l'ensemble de la propriété, pour une intimité totale. Parking privé sur place. Chemin bien entretenu menant directement à la villa. Accès libre à la piscine lagon naturel à débordement, à la terrasse en bois Cumaru, au carbet traditionnel en feuille de latanier et au jardin tropical fleuri. La villa est entièrement climatisée et ventilée naturellement. Wifi Starlink disponible dans toute la propriété. Système d'alarme et éclairage extérieur automatique pour votre sécurité." },
      { titre: "Votre hôte", texte: "Nous mettons un point d'honneur à ce que votre séjour à la Villa Amaryllis soit parfait. Avant et pendant votre voyage, nous restons entièrement disponibles par message ou téléphone pour répondre à toutes vos questions. Accueil personnalisé sur place par notre hôte référent, avec remise des clés et visite complète de la villa. Lors de votre arrivée, nous vous remettons un guide d'accueil avec nos meilleures adresses, bons plans restaurants et idées d'activités locales. Présents si vous avez besoin, mais toujours discrets afin que vous profitiez pleinement de votre intimité." },
      { titre: "Informations pratiques", items: [
        { label: "Check-in / Check-out", texte: "Check-in à partir de 17h, check-out avant 12h. Early check-in et late check-out possibles selon disponibilité (supplément 80 €)." },
        { label: "Règlement", texte: "Villa non-fumeur. Événements, fiestas et réceptions interdits. Seuls les voyageurs inscrits sur la réservation sont autorisés." },
        { label: "Capacité", texte: "6 voyageurs inclus dans le tarif de base. Possibilité d'accueillir jusqu'à 8 personnes avec un supplément de 50 € par voyageur supplémentaire par nuit." },
        { label: "Animaux", texte: "Bienvenus, jusqu'à 2 maximum — supplément 40 € par séjour." },
        { label: "Dépôt de garantie", texte: "1 500 € en cas de dommages constatés après le départ." },
        { label: "Transport", texte: "Une voiture automatique est recommandée pour profiter pleinement de la région." },
        { label: "Ménage", texte: "La villa est nettoyée et désinfectée en profondeur entre chaque séjour." },
        { label: "Support", texte: "Notre équipe est joignable 24h/24 en cas d'urgence ou de besoin particulier." },
      ]},
    ],
    prix: 280,
    capacite: 8,
    chambres: 3,
    lits: 3,
    sdb: "3,5",
    rating: "4,94",
    reviews: 33,
    couleur: "#e91e8c",
    photos: [
      "/photos/amaryllis/01.webp",
      "/photos/amaryllis/02.webp",
      "/photos/amaryllis/03.webp",
      "/photos/amaryllis/04.webp",
      "/photos/amaryllis/05.webp",
      "/photos/amaryllis/06.webp",
      "/photos/amaryllis/07.webp",
      "/photos/amaryllis/08.webp",
      "/photos/amaryllis/09.webp",
      "/photos/amaryllis/10.webp",
      "/photos/amaryllis/11.webp",
      "/photos/amaryllis/12.webp",
      "/photos/amaryllis/13.webp",
      "/photos/amaryllis/14.webp",
      "/photos/amaryllis/15.webp",
      "/photos/amaryllis/16.webp",
      "/photos/amaryllis/17.webp",
      "/photos/amaryllis/18.webp",
      "/photos/amaryllis/19.webp",
      "/photos/amaryllis/20.webp",
      "/photos/amaryllis/21.webp",
      "/photos/amaryllis/22.webp",
    ],
    coords: { lat: 14.4732, lng: -60.9196 },
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3863.107902087125!2d-60.943493625540455!3d14.478492985993562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c4021b8748ab759%3A0x99f47752da739a0a!2svilla%20Amaryllis!5e0!3m2!1sfr!2sfr!4v1779046798123!5m2!1sfr!2sfr",
    amenities: ["Piscine à débordement", "Jacuzzi privé", "Vue océan", "Wifi Starlink", "Parking", "Animaux OK"],
    amenitiesEn: ["Infinity pool", "Private jacuzzi", "Ocean view", "Starlink WiFi", "Parking", "Pets welcome"],
    avis: [
      { nom: "Sophie M.", pays: "🇫🇷", note: 5, texte: "Vue extraordinaire, piscine à débordement parfaite et hôte très réactif. Un endroit hors du temps face aux Caraïbes. On reviendra sans hésiter !", date: "Avr. 2025" },
      { nom: "James K.", pays: "🇬🇧", note: 5, texte: "Stunning villa with incredible Caribbean views. The salt water infinity pool and private jacuzzi are exceptional. Best Airbnb we've ever stayed in — period.", date: "Mars 2025" },
      { nom: "Marie-Claire D.", pays: "🇫🇷", note: 5, texte: "Séjour magique en famille. La terrasse de 100m² face à la mer est un rêve éveillé. Tout était impeccable, de l'accueil aux moindres détails de décoration.", date: "Fév. 2025" },
    ],
  },
  {
    id: "zandoli",
    nom: "Zandoli",
    airbnbTitle: "Zandoli : détente tropicale, piscine, jardin, vue mer",
    lieu: "Sainte-Luce, Martinique",
    tag: null,
    desc: "Bienvenue à Zandoli, cocon tropical niché au cœur d'un jardin luxuriant sur les hauteurs paisibles de Sainte-Luce. Réveillez-vous face à la mer des Caraïbes dans cet appartement lumineux et décoré avec soin. Plages de sable blanc, distilleries et randonnées à proximité vous invitent à vivre l'expérience martiniquaise authentique. Après vos escapades, admirez le coucher de soleil et laissez la brise chaude et le chant des oiseaux vous bercer.",
    descEn: "Welcome to Zandoli, a tropical cocoon nestled in a lush garden on the peaceful heights of Sainte-Luce. Wake up facing the Caribbean Sea in this bright, tastefully decorated apartment. White sand beaches, rum distilleries and hiking trails invite you to experience authentic Martinique. After your adventures, admire the sunset and let the warm breeze and birdsong soothe you.",
    descFull: [
      { titre: "L'hébergement", texte: "Zandoli dispose de 2 chambres dont une en mezzanine au charme unique, idéal pour familles, couples ou amis souhaitant goûter à la douceur de vivre caribéenne." },
      { titre: "Espace de vie", texte: "Un salon convivial s'ouvre sur une terrasse ensoleillée où vous pourrez savourer vos repas ou un café face au jardin tropical et à la douce brise. La cuisine équipée vous offre tout le nécessaire pour préparer vos plats préférés. Le linge de maison est fourni — draps, serviettes, torchons — pour faciliter votre séjour." },
      { titre: "Piscine & extérieurs", texte: "La pièce maîtresse de votre séjour : une piscine privée avec cascade apaisante, parfaite pour la baignade et la détente sous le soleil martiniquais. La terrasse attenante avec sa grande table vous accueille pour des moments conviviaux, bercés par le chant des oiseaux tropicaux. Le barbecue à gaz 2 feux avec accessoires inclus promet des soirées gourmandes sous les étoiles." },
      { titre: "Équipements & services", texte: "Wifi Starlink haut débit dans toute la propriété. Netflix et Disney+ inclus. Lave-linge. Jardin tropical luxuriant. Parking intérieur sécurisé. Linge de maison fourni." },
      { titre: "Votre hôte", texte: "L'équipe Amaryllis est toujours là pour vous — avant votre arrivée, pendant votre séjour, et même après. Nous répondons rapidement à vos questions, vous conseillons sur les meilleures découvertes autour de Sainte-Luce et vous aidons pour tout ce dont vous aurez besoin. Un contact simple et chaleureux, pour que vous vous sentiez accompagnés sans perdre votre liberté." },
      { titre: "Informations pratiques", items: [
        { label: "Animaux", texte: "Bienvenus, jusqu'à 2 maximum — supplément 40 € par séjour." },
        { label: "Check-in / Check-out", texte: "Check-in à partir de 17h, check-out avant 12h. Early/late possible selon disponibilité (supplément 50 €)." },
        { label: "Fumeurs", texte: "Non-fumeur à l'intérieur. Autorisé sur la terrasse et dans le jardin." },
        { label: "Stationnement", texte: "Une place de parking intérieur sécurisé réservée." },
        { label: "Dépôt de garantie", texte: "700 € en cas de dommages constatés après le départ." },
        { label: "Capacité", texte: "4 voyageurs inclus dans le tarif de base. Possibilité d'accueillir 1 voyageur supplémentaire avec un supplément de 30 € par nuit." },
        { label: "Connexion", texte: "Wifi Starlink dans toute la propriété. Espace de travail dédié inclus." },
        { label: "Accès", texte: "Le logement comporte des marches ou escaliers. Accueil en personne par l'équipe Amaryllis." },
      ]},
    ],
    prix: 220,
    capacite: 5,
    chambres: 2,
    lits: 3,
    sdb: "1",
    rating: "4,5",
    reviews: 16,
    couleur: "#06b6d4",
    photos: [
      "/photos/zandoli/01.webp",
      "/photos/zandoli/02.webp",
      "/photos/zandoli/03.webp",
      "/photos/zandoli/04.webp",
      "/photos/zandoli/05.webp",
      "/photos/zandoli/06.webp",
      "/photos/zandoli/07.webp",
      "/photos/zandoli/08.webp",
      "/photos/zandoli/09.webp",
      "/photos/zandoli/10.webp",
      "/photos/zandoli/11.webp",
      "/photos/zandoli/12.webp",
      "/photos/zandoli/13.webp",
      "/photos/zandoli/14.webp",
      "/photos/zandoli/15.webp",
    ],
    coords: { lat: 14.4725, lng: -60.9201 },
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.822862640186!2d-60.92853662554015!3d14.49485608597908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c4021b73b656873%3A0xdb94b0a0ad33a741!2sresidence%20Amaryllis!5e0!3m2!1sfr!2sfr!4v1779046858310!5m2!1sfr!2sfr",
    amenities: ["Piscine privée", "Vue mer", "Wifi Starlink", "Netflix/Disney+", "Lave-linge", "Jardin", "Animaux OK"],
    amenitiesEn: ["Private pool", "Sea view", "Starlink WiFi", "Netflix/Disney+", "Washer", "Garden", "Pets welcome"],
    avis: [
      { nom: "Lucie B.", pays: "🇫🇷", note: 5, texte: "Cocon parfait ! La mezzanine est charmante, la piscine délicieuse, et la vue sur la mer au réveil est inoubliable. Hôte très disponible.", date: "Avr. 2025" },
      { nom: "Thomas & Ana", pays: "🇩🇪", note: 5, texte: "Wunderbar! Tropical garden, private pool, sea view — everything we dreamed of. Very clean and well-equipped. We'll be back next winter.", date: "Janv. 2025" },
      { nom: "Camille R.", pays: "🇫🇷", note: 4, texte: "Très bel appartement, bien équipé et bien situé. La mezzanine est idéale pour les enfants. Netflix et lave-linge ont été très appréciés.", date: "Déc. 2024" },
    ],
  },
  {
    id: "iguana",
    nom: "Villa Iguana",
    airbnbTitle: "Villa Iguana, vue mer et rocher du Diamant, piscine",
    lieu: "Sainte-Luce, Martinique",
    tag: null,
    desc: "Bienvenue en Martinique, au sein de la résidence Amaryllis. Bercée par la douceur de vivre, la Villa Iguana se situe sur les hauteurs de Sainte-Luce, dans une résidence calme et fleurie. La villa aménagée avec goût s'étend sur deux niveaux et offre un cadre idéal pour un séjour ressourçant entre nature, vue mer et confort moderne.",
    descEn: "Welcome to Martinique, within the Amaryllis residence. Lulled by the island's gentle pace, Villa Iguana sits on the heights of Sainte-Luce in a peaceful, flower-filled residence. The tastefully furnished two-level villa offers an ideal setting for a restorative stay combining nature, ocean views and modern comfort.",
    descFull: [
      { titre: "À l'étage", texte: "Une terrasse panoramique donnant sur la mer des Caraïbes, le Rocher du Diamant et l'île de Sainte-Lucie, en communication directe avec la cuisine et le salon — table, 6 chaises et hamac pour vos moments de détente. Un espace de vie avec canapé convertible, table basse et TV. Une cuisine toute équipée — réfrigérateur, plaques de cuisson, four combiné, micro-ondes, cafetière, toaster." },
      { titre: "Au rez-de-chaussée", texte: "Deux chambres climatisées avec lit Queen Size 160×200, tables de chevet et grands dressings avec penderie. Une salle de bain fonctionnelle avec douche et WC." },
      { titre: "Les extérieurs", texte: "Un grand jardin fleuri avec table et chaises pour savourer un café ou un petit-déjeuner en plein air. Une piscine hors-sol de 3,66 m de diamètre. Un espace barbecue à gaz 2 feux avec tous les accessoires fournis. Deux places de parking extérieures privatives." },
      { titre: "Équipements & services", texte: "Wifi Starlink dans toute la propriété. Linge de maison fourni — draps, serviettes, torchons de cuisine. Animaux bienvenus." },
      { titre: "Votre hôte", texte: "L'équipe Amaryllis est à votre écoute avant, pendant et après votre séjour. Nous répondons rapidement à vos questions, vous conseillons sur les meilleures découvertes autour de Sainte-Luce et vous aidons pour tout ce dont vous aurez besoin. Une communication chaleureuse et humaine, pour que vous vous sentiez accompagnés sans perdre votre liberté." },
      { titre: "Informations pratiques", items: [
        { label: "Animaux", texte: "Bienvenus, jusqu'à 2 maximum — supplément 40 € par séjour." },
        { label: "Check-in / Check-out", texte: "Check-in à partir de 17h, check-out avant 12h. Early/late possible selon disponibilité (supplément 50 €)." },
        { label: "Fumeurs", texte: "Non-fumeur à l'intérieur. Autorisé dans les espaces extérieurs." },
        { label: "Stationnement", texte: "2 places de parking extérieures privatives." },
        { label: "Dépôt de garantie", texte: "500 € en cas de dommages constatés après le départ." },
        { label: "Capacité", texte: "6 voyageurs max — 2 chambres Queen Size + canapé convertible." },
        { label: "Niveaux", texte: "Étage : salon, cuisine, terrasse. Rez-de-chaussée : chambres et salle de bain." },
        { label: "Tranquillité", texte: "Fêtes et événements interdits. Visiteurs extérieurs non autorisés. Silence entre 22h et 7h." },
        { label: "Connexion", texte: "Wifi Starlink dans toute la propriété." },
      ]},
    ],
    prix: 180,
    capacite: 6,
    chambres: 2,
    lits: 3,
    sdb: "1",
    rating: "4,75",
    reviews: 4,
    couleur: "#22c55e",
    photos: [
      "/photos/iguana/01.webp",
      "/photos/iguana/02.webp",
      "/photos/iguana/03.webp",
      "/photos/iguana/04.webp",
      "/photos/iguana/05.webp",
      "/photos/iguana/06.webp",
      "/photos/iguana/07.webp",
      "/photos/iguana/08.webp",
      "/photos/iguana/09.webp",
      "/photos/iguana/10.webp",
      "/photos/iguana/11.webp",
      "/photos/iguana/12.webp",
      "/photos/iguana/13.webp",
      "/photos/iguana/14.webp",
      "/photos/iguana/15.webp",
    ],
    coords: { lat: 14.4718, lng: -60.9188 },
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.822862640186!2d-60.92853662554015!3d14.49485608597908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c4021b73b656873%3A0xdb94b0a0ad33a741!2sresidence%20Amaryllis!5e0!3m2!1sfr!2sfr!4v1779046858310!5m2!1sfr!2sfr",
    amenities: ["Piscine eau salée", "Vue Diamant", "Vue océan", "Wifi Starlink", "Parking", "Animaux OK"],
    amenitiesEn: ["Saltwater pool", "Diamond Rock view", "Ocean view", "Starlink WiFi", "Parking", "Pets welcome"],
    avis: [
      { nom: "Pierre & Claire", pays: "🇫🇷", note: 5, texte: "Vue imprenable sur le rocher du Diamant ! La piscine d'eau salée est un vrai plus. Villa propre, bien équipée, accueil aux petits soins.", date: "Avr. 2025" },
      { nom: "Rachel T.", pays: "🇬🇧", note: 5, texte: "What a view! Waking up to see the Diamond Rock every morning was magical. The saltwater pool felt like swimming in the sea itself. Perfect.", date: "Mars 2025" },
      { nom: "Laurent D.", pays: "🇫🇷", note: 5, texte: "Superbe villa avec une vue panoramique exceptionnelle. Très calme, très propre. La terrasse est parfaite pour les levers de soleil. Je recommande vivement.", date: "Fév. 2025" },
    ],
  },
  {
    id: "geko",
    nom: "Géko",
    airbnbTitle: "Géko, détente, zen, piscine & jardin tropical",
    lieu: "Sainte-Luce, Martinique",
    tag: null,
    desc: "Bienvenue à Géko, votre refuge paisible au sein de la résidence fleurie Amaryllis sur les hauteurs de Sainte-Luce. Laissez-vous séduire par le jardin tropical luxuriant, la piscine rafraîchissante et la douce brise des alizés. À seulement 7 minutes des plages de sable blanc et du bourg animé de Sainte-Luce, Géko offre un séjour alliant confort moderne, nature apaisante et découverte authentique de la Martinique. Un cocon tropical où chaque détail est pensé pour votre confort et votre bien-être.",
    descEn: "Welcome to Géko, your peaceful retreat within the flower-filled Amaryllis residence on the heights of Sainte-Luce. Let yourself be seduced by the lush tropical garden, refreshing pool and gentle trade winds. Just 7 minutes from white sand beaches and the lively village of Sainte-Luce, Géko blends modern comfort, soothing nature and authentic Martinique discovery. A tropical cocoon where every detail is designed for your comfort and well-being.",
    descFull: [
      { titre: "Les espaces", texte: "Le séjour cosy dispose d'un canapé convertible, d'une table basse et d'une TV, parfait pour vos soirées détente. La chambre climatisée, équipée d'un lit queen-size 160×200 et de rangements, vous promet des nuits reposantes. La salle de bain moderne avec douche à l'italienne et WC est idéale pour un moment de fraîcheur après une journée au soleil." },
      { titre: "Les extérieurs", texte: "Savourez vos repas sur la terrasse couverte communiquant avec la cuisine extérieure — réfrigérateur, plaques, four, micro-ondes, cafetière, grille-pain. Flânez dans le grand jardin tropical, détendez-vous dans la piscine privée et profitez du salon extérieur pour une lecture ou un apéritif au coucher du soleil. Des soirées barbecue à gaz viendront parfaire vos moments conviviaux." },
      { titre: "Équipements & services", texte: "Linge de maison fourni. Wifi haut débit Starlink dans toute la propriété. Place de parking privée sur place. Accès autonome." },
      { titre: "Pourquoi Géko", texte: "Parce que Géko est plus qu'un logement : c'est une expérience. Un écrin de verdure alliant confort moderne et charme tropical, un point de départ idéal entre plages de sable blanc, distilleries emblématiques et marchés créoles colorés. Dès votre arrivée, franchissez le portillon privé qui ouvre les portes de votre havre de paix. Un parking privé vous est réservé juste en face, votre entrée indépendante préserve votre intimité." },
      { titre: "Votre hôte", texte: "Votre confort et votre sérénité sont notre priorité du premier contact au départ. Avant votre arrivée, nous répondons à toutes vos questions et partageons nos coups de cœur locaux. Lors de l'accueil, nous vous accompagnons pour une prise en main simple et autonome. Pendant votre séjour, nous restons disponibles — souvent en moins de 30 minutes. Nous cultivons une communication chaleureuse et humaine, pour que vous viviez un séjour en toute confiance." },
      { titre: "Informations pratiques", items: [
        { label: "Animaux", texte: "Bienvenus, jusqu'à 2 maximum — supplément 40 € par séjour." },
        { label: "Check-in / Check-out", texte: "Check-in à partir de 17h, check-out avant 12h. Early/late possible selon disponibilité (supplément 50 €)." },
        { label: "Fumeurs", texte: "Non-fumeur à l'intérieur. Fumer autorisé sur la terrasse et dans le jardin." },
        { label: "Stationnement", texte: "Une place de parking intérieur réservée." },
        { label: "Dépôt de garantie", texte: "500 € en cas de dommages constatés après le départ." },
        { label: "Tranquillité", texte: "Visiteurs extérieurs non autorisés. Silence requis entre 22h et 7h." },
        { label: "Connexion", texte: "Wifi haut débit Starlink dans toute la propriété." },
      ]},
    ],
    prix: 150,
    capacite: 4,
    chambres: 1,
    lits: 2,
    sdb: "1",
    rating: "4,83",
    reviews: 23,
    couleur: "#f59e0b",
    photos: [
      "/photos/geko/01.webp",
      "/photos/geko/02.webp",
      "/photos/geko/03.webp",
      "/photos/geko/04.webp",
      "/photos/geko/05.webp",
      "/photos/geko/06.webp",
      "/photos/geko/07.webp",
      "/photos/geko/08.webp",
      "/photos/geko/09.webp",
      "/photos/geko/10.webp",
      "/photos/geko/11.webp",
      "/photos/geko/12.webp",
      "/photos/geko/13.webp",
      "/photos/geko/14.webp",
      "/photos/geko/15.webp",
    ],
    coords: { lat: 14.4729, lng: -60.9194 },
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.822862640186!2d-60.92853662554015!3d14.49485608597908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c4021b73b656873%3A0xdb94b0a0ad33a741!2sresidence%20Amaryllis!5e0!3m2!1sfr!2sfr!4v1779046858310!5m2!1sfr!2sfr",
    amenities: ["Piscine privée", "Jardin tropical", "Climatisation", "Wifi Starlink", "Lave-linge", "Animaux OK"],
    amenitiesEn: ["Private pool", "Tropical garden", "Air conditioning", "Starlink WiFi", "Washer", "Pets welcome"],
    avis: [
      { nom: "Sandrine L.", pays: "🇫🇷", note: 5, texte: "Un vrai cocon dans un jardin tropical magnifique. La piscine est bien entretenue et la brise des alizés rend la clim presque superflue. On adore !", date: "Mai 2025" },
      { nom: "Marco F.", pays: "🇮🇹", note: 5, texte: "Piccolo paradiso caraibico! Il giardino tropicale è stupendo, la piscina fresca e pulita. Posizione tranquilla a pochi minuti dalla spiaggia. Torneremo!", date: "Avr. 2025" },
      { nom: "Nathalie C.", pays: "🇫🇷", note: 5, texte: "Refuge parfait pour se ressourcer. Jardin luxuriant, piscine fraîche, tout était propre et bien équipé. L'hôte répond très rapidement. Parfait !", date: "Mars 2025" },
    ],
  },
  {
    id: "mabouya",
    nom: "Mabouya",
    airbnbTitle: "Mabouya | Jacuzzi privatif, Jardin fleuri, vue mer",
    lieu: "Sainte-Luce, Martinique",
    tag: null,
    desc: "Bienvenue au studio Mabouya, votre havre de paix à flanc de colline avec jacuzzi privatif, jardin fleuri et vue mer enchanteresse. Idéal pour une escapade romantique ou ressourçante, Mabouya est une expérience caribéenne tout simplement. Relaxez-vous dans votre jacuzzi privé, savourez votre café au cœur d'un jardin tropical et laissez-vous bercer par le calme et les parfums des fleurs exotiques. Chaque détail a été pensé pour votre bien-être.",
    descEn: "Welcome to the Mabouya studio, your hillside haven of peace with a private jacuzzi, flower garden and enchanting ocean views. Ideal for a romantic or rejuvenating escape, Mabouya is simply a Caribbean experience. Unwind in your private jacuzzi, savour morning coffee in a tropical garden and let the calm and exotic flower scents soothe your senses. Every detail has been crafted for your well-being.",
    descFull: [
      { titre: "L'hébergement", texte: "L'appartement a été aménagé avec goût et raffinement, conçu pour offrir confort et sérénité. Une terrasse privée avec vue imprenable sur la mer des Caraïbes, parfaite pour des moments de détente inoubliables. L'espace de vie climatisé comprend un grand lit queen-size 160×200, une TV moderne et une commode élégante pour votre rangement." },
      { titre: "Extérieurs & espaces de vie", texte: "Le jardin fleuri luxuriant est un véritable havre de paix. La cuisine extérieure entièrement équipée vous permet de préparer vos repas en profitant de l'air frais, avec un barbecue au charbon et tous les accessoires nécessaires pour des soirées conviviales. Votre jacuzzi privé vous offre des instants de pur bien-être, en harmonie avec la nature environnante." },
      { titre: "Équipements & services", texte: "Salle de bain moderne avec grande douche à l'italienne. Linge de maison complet fourni. Place de parking privée et sécurisée au sein de la résidence Amaryllis. Wifi Starlink. Animaux bienvenus." },
      { titre: "Pourquoi Mabouya", texte: "Parce qu'ici, chaque détail est pensé pour que votre séjour soit une véritable expérience d'évasion : vue mer, jardin tropical, jacuzzi privé, calme absolu et proximité des plus belles plages et distilleries de Martinique. Le studio vous est entièrement privatisé. Situated sur les hauteurs de Sainte-Luce, les plages — Anse Mabouya, Anse Gros Raisin — sont accessibles en quelques minutes à pied ou en voiture." },
      { titre: "Votre hôte", texte: "L'équipe Amaryllis est à votre écoute avant, pendant et après votre séjour — conseils sur les plages paradisiaques, restaurants locaux ou activités uniques. Nous privilégions une communication fluide, chaleureuse et réactive pour vous garantir une expérience sans stress et mémorable. Notre mission : faire de votre séjour un moment d'évasion inoubliable." },
      { titre: "Informations pratiques", items: [
        { label: "Check-in / Check-out", texte: "Early check-in et late check-out possibles selon disponibilité — supplément 30 €." },
        { label: "Animaux", texte: "Bienvenus, jusqu'à 2 maximum — supplément 40 € par séjour." },
        { label: "Capacité", texte: "2 personnes maximum." },
        { label: "Fumeurs", texte: "Logement non-fumeur." },
        { label: "Dépôt de garantie", texte: "500 € en cas de dommages constatés après le départ." },
        { label: "Tranquillité", texte: "Fêtes et événements non autorisés. Silence entre 22h et 8h." },
        { label: "Stationnement", texte: "Parking privé et sécurisé inclus." },
        { label: "Équipements inclus", texte: "Linge de maison, produits d'accueil et wifi Starlink fournis." },
      ]},
    ],
    prix: 110,
    capacite: 2,
    chambres: 1,
    lits: 1,
    sdb: "1",
    rating: "4,55",
    reviews: 11,
    couleur: "#84cc16",
    photos: [
      "/photos/mabouya/01.webp",
      "/photos/mabouya/02.webp",
      "/photos/mabouya/03.webp",
      "/photos/mabouya/04.webp",
      "/photos/mabouya/05.webp",
      "/photos/mabouya/06.webp",
      "/photos/mabouya/07.webp",
      "/photos/mabouya/08.webp",
      "/photos/mabouya/09.webp",
      "/photos/mabouya/10.webp",
      "/photos/mabouya/11.webp",
      "/photos/mabouya/12.webp",
    ],
    coords: { lat: 14.4741, lng: -60.9209 },
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.822862640186!2d-60.92853662554015!3d14.49485608597908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c4021b73b656873%3A0xdb94b0a0ad33a741!2sresidence%20Amaryllis!5e0!3m2!1sfr!2sfr!4v1779046858310!5m2!1sfr!2sfr",
    amenities: ["Jacuzzi privatif", "Vue mer", "Jardin fleuri", "Wifi Starlink", "Parking", "Animaux OK"],
    amenitiesEn: ["Private jacuzzi", "Ocean view", "Flower garden", "Starlink WiFi", "Parking", "Pets welcome"],
    avis: [
      { nom: "Élise & Romain", pays: "🇫🇷", note: 5, texte: "Weekend romantique parfait ! Le jacuzzi privatif sous les étoiles avec vue mer est juste magique. Jardin fleuri superbe, endroit très paisible.", date: "Avr. 2025" },
      { nom: "Sarah W.", pays: "🇺🇸", note: 5, texte: "Hidden gem! The private jacuzzi with ocean views made every evening unforgettable. The flowering garden is gorgeous. Perfect romantic escape.", date: "Mars 2025" },
      { nom: "Jean-Paul M.", pays: "🇫🇷", note: 4, texte: "Très beau logement avec un jacuzzi privatif et une vue mer agréable. Jardin entretenu, hôte sympathique. Idéal pour un séjour en couple.", date: "Fév. 2025" },
    ],
  },
  {
    id: "schoelcher",
    nom: "Bellevue",
    airbnbTitle: "Appartement de standing calme, splendide vue mer",
    lieu: "Schœlcher, Martinique",
    tag: null,
    desc: "Imaginez… Au réveil, depuis la terrasse, une vue imprenable sur la mer des Caraïbes, la baie de Fort-de-France et les Trois-Îlets. Situé dans un quartier calme de Schœlcher, cet appartement de standing vous offre un cadre idéal pour découvrir le nord de la Martinique. À 1 minute à pied d'un petit centre commercial, et à 5 minutes en voiture des plages, Bellevue combine tranquillité et proximité de tout. Dernier étage d'une résidence sécurisée : brise marine, calme absolu et couchers de soleil inoubliables.",
    descEn: "Imagine… waking up on your terrace to sweeping views of the Caribbean Sea, the Bay of Fort-de-France and the Trois-Îlets. Located in a quiet neighbourhood of Schœlcher, this upscale apartment is an ideal base to explore northern Martinique. A 1-minute walk from shops and 5 minutes by car from the beaches, Bellevue combines tranquility with having everything nearby. Top floor of a secure residence: sea breeze, absolute calm and unforgettable sunsets.",
    descFull: [
      { titre: "L'hébergement", texte: "L'appartement dispose d'une chambre avec lit double, d'une salle de bain moderne avec douche, et d'un salon-séjour lumineux avec accès direct à la grande terrasse orientée plein ouest — le lieu idéal pour vos soirées face au spectacle du soleil sur la baie." },
      { titre: "Équipements", texte: "TV HD, wifi haut débit, cuisine équipée, lave-linge, climatisation, parking privé. Le linge de maison (draps, serviettes, torchons) est inclus : vous n'avez rien à apporter." },
      { titre: "Accès & proximité", texte: "L'appartement est au 4ème et dernier étage d'une résidence sécurisée avec ascenseur. Une place de parking privative vous est réservée, accès libre 24h/24. À 1 minute à pied : centre commercial, boulangerie, médecin, kiné, pharmacie. À 5 minutes en voiture : plages de sable blanc, restaurants et activités nautiques. Fort-de-France en 15 minutes." },
      { titre: "Votre hôte", texte: "L'équipe Amaryllis met un point d'honneur à ce que votre séjour soit parfait. Avant votre arrivée, nous vous transmettons toutes les informations utiles : accès, stationnement, équipements et nos meilleures adresses locales. Pendant votre séjour, nous restons disponibles par messagerie et WhatsApp — toujours dans le respect de votre intimité." },
      { titre: "Informations pratiques", items: [
        { label: "Animaux", texte: "Bienvenus, jusqu'à 2 maximum — supplément 40 € par séjour." },
        { label: "Check-in / Check-out", texte: "Check-in à partir de 17h, check-out avant 12h. Early/late possible selon disponibilité (supplément 50 €)." },
        { label: "Fumeurs", texte: "Non-fumeur à l'intérieur. Autorisé sur la terrasse." },
        { label: "Stationnement", texte: "Une place de parking privative en résidence réservée." },
        { label: "Dépôt de garantie", texte: "1 000 € en cas de dommages constatés après le départ." },
        { label: "Capacité", texte: "2 voyageurs maximum — 1 chambre avec lit double." },
        { label: "Tranquillité", texte: "Fêtes et réceptions non autorisées. Silence entre 22h et 7h." },
        { label: "Étagement", texte: "4ème et dernier étage avec ascenseur." },
        { label: "Connexion", texte: "Wifi haut débit dans tout l'appartement." },
      ]},
    ],
    prix: 100,
    capacite: 2,
    chambres: 1,
    lits: 1,
    sdb: "1",
    rating: "4,8",
    reviews: 30,
    couleur: "#8b5cf6",
    photos: [
      "/photos/schoelcher/01.webp",
      "/photos/schoelcher/02.webp",
      "/photos/schoelcher/03.webp",
      "/photos/schoelcher/04.webp",
      "/photos/schoelcher/05.webp",
      "/photos/schoelcher/06.webp",
      "/photos/schoelcher/07.webp",
      "/photos/schoelcher/08.webp",
      "/photos/schoelcher/09.webp",
      "/photos/schoelcher/10.webp",
      "/photos/schoelcher/11.webp",
      "/photos/schoelcher/12.webp",
      "/photos/schoelcher/13.webp",
      "/photos/schoelcher/14.webp",
      "/photos/schoelcher/15.webp",
    ],
    coords: { lat: 14.6121, lng: -61.0887 },
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2905.414139928121!2d-61.10181910968834!3d14.634222460364626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c6aa753fde6522f%3A0x414570ed7905d25c!2sR%C3%A9sidence%20Belle%20Vue!5e0!3m2!1sfr!2sfr!4v1779047169810!5m2!1sfr!2sfr",
    amenities: ["Vue baie", "Terrasse", "TV HD", "Wifi", "Parking", "Animaux OK"],
    amenitiesEn: ["Bay view", "Terrace", "HD TV", "WiFi", "Parking", "Pets welcome"],
    avis: [
      { nom: "Isabelle T.", pays: "🇫🇷", note: 5, texte: "Appartement très bien situé avec une vue splendide sur la baie de Fort-de-France. Calme, propre, bien équipé. Idéal pour explorer le nord de la Martinique.", date: "Avr. 2025" },
      { nom: "Dirk H.", pays: "🇳🇱", note: 5, texte: "Amazing view over the bay! The apartment is quiet, clean and has everything you need. Great location to explore the north of Martinique. Highly recommended.", date: "Mars 2025" },
      { nom: "Monique R.", pays: "🇫🇷", note: 5, texte: "Logement de standing avec une vue exceptionnelle. Hôte très accueillant et réactif. La terrasse face à la baie est un vrai bonheur le matin.", date: "Fév. 2025" },
    ],
  },
  {
    id: "nogent",
    nom: "Appartement aux Portes de Paris",
    airbnbTitle: "Appartement de standing avec jardin, proche Paris",
    lieu: "Nogent-sur-Marne, Île-de-France",
    tag: null,
    desc: "Laissez-vous séduire par un appartement élégant, niché au sein d'une résidence luxueuse aux portes de Paris. Havre de paix alliant calme, confort et style — parfait pour des voyageurs en quête d'évasion urbaine sans sacrifier la quiétude. Ce T2 de 39 m² baigné de lumière naturelle à Nogent-sur-Marne, à seulement quelques minutes de Paris, a été pensé dans les moindres détails pour rendre votre séjour absolument magique.",
    descEn: "Be seduced by an elegant apartment nestled within a luxurious residence at the gates of Paris. A haven of peace combining calm, comfort and style — perfect for travellers seeking urban escape without sacrificing serenity. This sun-drenched 39 m² flat in Nogent-sur-Marne, just minutes from Paris, has been crafted to the last detail to make your stay absolutely magical.",
    descFull: [
      { titre: "L'hébergement", texte: "Votre cocon chic dispose d'une grande chambre avec lit King Size, d'un dressing spacieux et d'une TV. Le confort est digne d'un hôtel haut de gamme, dans un cadre élégant et apaisant." },
      { titre: "Espace de vie", texte: "La cuisine ultra-équipée invite à créer de délicieux repas, tandis que le salon lumineux s'ouvre sur l'extérieur. La connexion entre intérieur et extérieur est fluide, idéale pour savourer chaque moment en toute convivialité." },
      { titre: "Jardin & terrasse", texte: "Un jardin et une terrasse 100% privés — votre coin de paradis vert au cœur de la ville. Matins tranquilles au soleil, dîners sous les étoiles ou détente sur un transat. Le barbecue est à votre disposition pour des instants gourmands." },
      { titre: "Accès & proximité", texte: "Arrivée ultra simple via boîte à clé sécurisée — récupérez vos clés en toute autonomie, à l'heure qui vous arrange, même tard le soir. À deux pas : supérette ouverte tard et toutes les commodités du quartier. La gare RER A vous emmène au cœur de Paris en 20 minutes. Le bord de Marne est à quelques minutes à pied." },
      { titre: "Votre hôte", texte: "L'équipe Amaryllis est à votre disposition 24h/24 et 7j/7. Dès votre réservation, vous recevrez un message d'accueil chaleureux avec toutes les informations clés. La Fine Conciergerie locale vous offre un service premium : assistance personnalisée, réservations sur mesure, conseils exclusifs et interventions rapides. Envie de découvrir les secrets de Nogent et Paris ? Nous vous proposons des recommandations exclusives et un accès aux meilleures adresses locales." },
      { titre: "Informations pratiques", items: [
        { label: "Check-in / Check-out", texte: "Check-in à partir de 17h, check-out avant 12h. Accès autonome 24h/24 via boîte à clé. Instructions transmises avant l'arrivée." },
        { label: "Fumeurs", texte: "Non-fumeur à l'intérieur. Autorisé dans le jardin et sur la terrasse." },
        { label: "Animaux", texte: "Animaux non admis." },
        { label: "Stationnement", texte: "Parking public sécurisé à proximité, accessible à pied." },
        { label: "Dépôt de garantie", texte: "500 € en cas de dommages constatés après le départ." },
        { label: "Capacité", texte: "2 voyageurs maximum — 1 chambre avec lit King Size. Superficie : 39 m²." },
        { label: "Tranquillité", texte: "Résidence calme et sécurisée. Silence entre 22h et 8h. Fêtes et réceptions non autorisées." },
        { label: "Équipements inclus", texte: "Wifi, home cinéma, éclairage intelligent, lave-linge, cuisine équipée, barbecue, climatisation. Linge de maison fourni." },
        { label: "Connexion", texte: "Wifi ultra-rapide dans tout l'appartement." },
      ]},
    ],
    prix: 85,
    capacite: 2,
    chambres: 1,
    lits: 1,
    sdb: "1",
    rating: null,
    reviews: null,
    couleur: "#64748b",
    photos: [
      "/photos/nogent/01.webp",
      "/photos/nogent/02.webp",
      "/photos/nogent/03.webp",
      "/photos/nogent/04.webp",
      "/photos/nogent/05.webp",
      "/photos/nogent/06.webp",
      "/photos/nogent/07.webp",
      "/photos/nogent/08.webp",
      "/photos/nogent/09.webp",
      "/photos/nogent/10.webp",
      "/photos/nogent/11.webp",
      "/photos/nogent/12.webp",
      "/photos/nogent/13.webp",
      "/photos/nogent/14.webp",
      "/photos/nogent/15.webp",
      "/photos/nogent/16.webp",
      "/photos/nogent/17.webp",
      "/photos/nogent/18.webp",
      "/photos/nogent/19.webp",
      "/photos/nogent/20.webp",
    ],
    beds24Url: "https://beds24.com/booking2.php?propid=158192&referer=iframe",
    coords: { lat: 48.8374, lng: 2.4836 },
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d463.17188664330297!2d2.4757244130102185!3d48.83615034492648!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e60d41b4fd90d1%3A0x4f6c2445f955ea44!2s21%20Gd%20Rue%20Charles%20de%20Gaulle%2C%2094130%20Nogent-sur-Marne!5e0!3m2!1sfr!2sfr!4v1779047281540!5m2!1sfr!2sfr",
    amenities: ["Bord Marne", "Jardin", "RER A (20 min Paris)", "Parking", "Wifi"],
    amenitiesEn: ["Riverside", "Garden", "RER A (20 min Paris)", "Parking", "WiFi"],
    avis: [
      { nom: "Aurélie F.", pays: "🇫🇷", note: 5, texte: "Appartement lumineux et très bien décoré au bord de la Marne. Calme absolu tout en étant à 20 min de Paris. Le jardin est charmant. Parfait pour se ressourcer.", date: "Avr. 2025" },
      { nom: "Oliver M.", pays: "🇬🇧", note: 5, texte: "Lovely flat with a garden right by the river. Peaceful, well-decorated and only 20 minutes from central Paris. The host was very welcoming and helpful.", date: "Mars 2025" },
    ],
  },
];

// ── Price helpers ─────────────────────────────────────────────────
function loadPriceOverrides() {
  try { return JSON.parse(localStorage.getItem("amaryllis_prices") || "{}"); }
  catch { return {}; }
}

function Curtain({ onDone }) {
  const [lifting, setLifting] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    const t1 = setTimeout(() => setLifting(true), 700);
    const t2 = setTimeout(() => onDoneRef.current(), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0e3b3a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: lifting ? "curtainLift 0.9s cubic-bezier(0.76,0,0.24,1) forwards" : "curtainFadeIn 0.4s ease forwards",
      pointerEvents: lifting ? "none" : "auto",
    }}>
      {/* Amaryllis mark */}
      <div style={{ marginBottom: 24, animation: "curtainPetalSpin 2.5s ease-in-out infinite" }}>
        <svg width="64" height="64" viewBox="-50 -50 100 100">
          {[0,60,120,180,240,300].map(rot => (
            <g key={rot} transform={`rotate(${rot})`}>
              <path d="M 0 0 L 0 -38 L 8 -20 Z" fill="#c47254" opacity="0.9" />
            </g>
          ))}
          <circle cx="0" cy="0" r="4" fill="#c9a673" />
        </svg>
      </div>
      <div style={{
        fontFamily: "'Jost', sans-serif", fontWeight: 200,
        fontSize: "clamp(24px, 6vw, 48px)",
        letterSpacing: "0.28em", textTransform: "uppercase",
        color: "#faf5e9", lineHeight: 1, marginBottom: 10,
      }}>Amaryllis</div>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
        fontSize: 15, color: "#c9a673", letterSpacing: "0.08em", opacity: 0.8,
      }}>Locations d'exception</div>
    </div>
  );
}

// ── Utilities ────────────────────────────────────────────────────
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(ds, n) {
  const d = new Date(ds + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function dateDiff(a, b) {
  return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
}
function formatDateLong(ds) {
  if (!ds) return "";
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}
function formatDateShort(ds) {
  if (!ds) return "";
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ── Calendar ─────────────────────────────────────────────────────
const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function CalendarMonth({ year, month, checkin, checkout, hovered, blockedDates, onSelect, onHover, dailyPricesMap = {}, basePrice = 0, minNights = 1, readOnly = false, gapDates = {} }) {
  const todayStr = today();
  const [hoveredCell, setHoveredCell] = useState(null);
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDow = (firstDay.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  // ── Heatmap : calcul min/max sur les jours libres du mois ─────────
  const freePrices = cells
    .filter(ds => ds && ds >= todayStr && !blockedDates.includes(ds))
    .map(ds => dailyPricesMap[ds] ?? basePrice)
    .filter(p => p > 0);
  const heatMin = freePrices.length ? Math.min(...freePrices) : 0;
  const heatMax = freePrices.length ? Math.max(...freePrices) : 0;
  const heatRange = heatMax - heatMin;

  function heatBg(ds) {
    if (!ds || !heatRange || ds < todayStr || blockedDates.includes(ds)) return null;
    const p = dailyPricesMap[ds] ?? basePrice;
    if (!p) return null;
    const t = Math.max(0, Math.min(1, (p - heatMin) / heatRange));
    // t=0 → vert (bon prix), t=1 → corail (prix élevé)
    if (t <= 0.35)  return `rgba(20,184,166,${0.22 - t * 0.3})`; // teal-vert
    if (t >= 0.65)  return `rgba(196,114,84,${0.10 + (t - 0.65) * 0.38})`; // corail
    return null; // milieu : fond neutre
  }
  // ──────────────────────────────────────────────────────────────────

  function isBelowMin(ds) {
    if (!checkin || checkout || !ds || ds <= checkin) return false;
    const n = Math.round((new Date(ds) - new Date(checkin)) / 86400000);
    return n < minNights;
  }

  function getState(ds) {
    if (!ds) return "empty";
    if (ds < todayStr) return "past";
    if (blockedDates.includes(ds)) return "blocked";
    if (isBelowMin(ds)) return "belowmin";
    if (ds === checkin) return "checkin";
    if (ds === checkout) return "checkout";
    const end = checkout || hovered;
    if (checkin && end && ds > checkin && ds < end) return "range";
    return "free";
  }

  return (
    <div style={{ flex: "1 1 240px" }}>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, marginBottom: 12, color: NAVY }}>
        {MONTHS_FR[month]} {year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, color: MUTED, padding: "4px 0", fontWeight: 600 }}>{w}</div>
        ))}
        {cells.map((ds, i) => {
          const state = getState(ds);
          const isCI = state === "checkin";
          const isCO = state === "checkout";
          const inRange = state === "range";
          const blocked = state === "blocked";
          const past = state === "past";
          const belowMin = state === "belowmin";
          const isFree = state === "free";
          const disabled = blocked || past || belowMin || !ds;

          let bg = isFree ? (heatBg(ds) ?? "transparent") : "transparent";
          let color = "#94a3b8";
          let borderRadius = "8px";
          let fontWeight = 400;

          if (isCI || isCO) { bg = CORAL; color = "#fff"; fontWeight = 700; }
          else if (inRange) { bg = `rgba(200,85,61,0.10)`; color = "#7A3020"; borderRadius = "0"; }
          if (isCI) borderRadius = "8px 0 0 8px";
          if (isCO) borderRadius = "0 8px 8px 0";

          return (
            <div
              key={i}
              onMouseEnter={() => {
                if (readOnly) return;
                if (!disabled && checkin && !checkout) onHover(ds);
                if (!disabled && ds) setHoveredCell(ds);
              }}
              onMouseLeave={() => { if (!readOnly) setHoveredCell(null); }}
              onClick={() => { if (!readOnly && !disabled) onSelect(ds); }}
              style={{
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                cursor: readOnly ? "default" : disabled ? "not-allowed" : "pointer",
                background: bg,
                color: blocked ? "#D4C8BC" : past ? "#D4C8BC" : belowMin ? "#D4C8BC" : isFree ? NAVY : color,
                borderRadius,
                fontWeight,
                textDecoration: blocked ? "line-through" : "none",
                opacity: past ? 0.4 : belowMin ? 0.35 : 1,
                position: "relative",
                transition: "background 0.1s",
                userSelect: "none",
              }}
            >
              {ds ? parseInt(ds.split("-")[2]) : ""}
              {/* Badge remise gap — visible en permanence sur les dates remisées */}
              {ds && gapDates[ds] && !disabled && (
                <div style={{
                  position: "absolute", top: 2, right: 2,
                  background: "#14b8a6", color: "#fff",
                  fontSize: 7, fontWeight: 800,
                  padding: "1px 3px", borderRadius: 3,
                  lineHeight: 1.2, pointerEvents: "none",
                  fontFamily: "'Jost', sans-serif",
                }}>-{gapDates[ds]}%</div>
              )}
              {hoveredCell === ds && !disabled && ds && (() => {
                const p = dailyPricesMap[ds] ?? basePrice;
                if (!p) return null;
                const gap = gapDates[ds];
                return (
                  <div style={{
                    position: "absolute", bottom: "calc(100% + 5px)", left: "50%",
                    transform: "translateX(-50%)",
                    background: "#0e3b3a", color: "#faf5e9",
                    fontSize: 10, fontWeight: 700,
                    padding: "3px 7px", borderRadius: 5,
                    whiteSpace: "nowrap", zIndex: 50,
                    pointerEvents: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                    fontFamily: "'Jost', sans-serif",
                  }}>{p}€/nuit{gap ? ` (-${gap}%)` : ""}</div>
                );
              })()}
            </div>
          );
        })}
      </div>
      {/* Légende heatmap */}
      {heatRange > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 9, color: MUTED, fontFamily: "'Jost',sans-serif", letterSpacing: "0.06em" }}>{heatMin}€</span>
          <div style={{ width: 64, height: 5, borderRadius: 3, background: "linear-gradient(to right, rgba(20,184,166,0.5), transparent 40%, transparent 60%, rgba(196,114,84,0.55))" }} />
          <span style={{ fontSize: 9, color: MUTED, fontFamily: "'Jost',sans-serif", letterSpacing: "0.06em" }}>{heatMax}€</span>
        </div>
      )}
    </div>
  );
}

function DateRangePicker({ checkin, checkout, blockedDates = [], onChange, dailyPricesMap = {}, basePrice = 0, minNights = 1, gapDates = {} }) {
  const todayStr = today();
  const initY = new Date().getFullYear();
  const initM = new Date().getMonth();
  const [offset, setOffset] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);

  const m1 = (initM + offset) % 12;
  const y1 = initY + Math.floor((initM + offset) / 12);
  const m2 = (initM + offset + 1) % 12;
  const y2 = initY + Math.floor((initM + offset + 1) / 12);

  function handleSelect(ds) {
    if (!checkin || (checkin && checkout)) {
      onChange(ds, null);
    } else if (ds <= checkin) {
      onChange(ds, null);
    } else {
      // Bloquer si le séjour est inférieur au minimum
      const n = Math.round((new Date(ds) - new Date(checkin)) / 86400000);
      if (n < minNights) return;
      // Check no blocked date strictly between checkin and ds
      let cur = addDays(checkin, 1);
      let hasBlocked = false;
      while (cur < ds) {
        if (blockedDates.includes(cur)) { hasBlocked = true; break; }
        cur = addDays(cur, 1);
      }
      if (hasBlocked) onChange(ds, null);
      else onChange(checkin, ds);
    }
    setHovered(null);
  }

  const canPrev = offset > 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => canPrev && setOffset(o => o - 1)} style={{ ...iconBtn, opacity: canPrev ? 1 : 0.2 }}>‹</button>
        <div style={{ fontSize: 13, color: MUTED }}>
          {!checkin ? "Choisir la date d'arrivée" : !checkout ? "Choisir la date de départ" : `${formatDateShort(checkin)} → ${formatDateShort(checkout)}`}
        </div>
        <button onClick={() => setOffset(o => Math.min(o + 1, 20))} style={iconBtn}>›</button>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <CalendarMonth year={y1} month={m1} checkin={checkin} checkout={checkout} hovered={hovered} blockedDates={blockedDates} onSelect={handleSelect} onHover={setHovered} dailyPricesMap={dailyPricesMap} basePrice={basePrice} minNights={minNights} gapDates={gapDates} />
        {!isMobile && <CalendarMonth year={y2} month={m2} checkin={checkin} checkout={checkout} hovered={hovered} blockedDates={blockedDates} onSelect={handleSelect} onHover={setHovered} dailyPricesMap={dailyPricesMap} basePrice={basePrice} minNights={minNights} gapDates={gapDates} />}
      </div>
      {/* Légende disponibilité */}
      <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif" }}>
          <span style={{ width: 22, height: 22, background: "#fff", border: `1px solid ${SAND}`, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: NAVY, fontWeight: 500 }}>8</span>
          Disponible
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif" }}>
          <span style={{ width: 22, height: 22, background: "#f0ebe3", border: `1px solid ${SAND}`, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#bbb", fontWeight: 400, textDecoration: "line-through" }}>8</span>
          Indisponible
        </span>
      </div>

      {checkin && checkout && (
        <div style={{ marginTop: 10, textAlign: "right" }}>
          <button onClick={() => { onChange(null, null); setHovered(null); }} style={{ fontSize: 12, color: MUTED, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Effacer les dates
          </button>
        </div>
      )}
    </div>
  );
}

const iconBtn = {
  background: "none",
  border: `1px solid ${SAND}`,
  color: MUTED,
  width: 32, height: 32, borderRadius: 8, cursor: "pointer",
  fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
};

// ── Shader Background (canvas) ───────────────────────────────────
function ShaderBg({ style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let rid, t = 0;

    function resize() {
      const r = Math.min(window.devicePixelRatio || 1, 2);
      c.width = c.offsetWidth * r;
      c.height = c.offsetHeight * r;
      ctx.scale(r, r);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    // Brand-colored blobs: ink base + coral / sand / cream
    const BLOBS = [
      { ox: 0.28, oy: 0.42, fx: 0.20, fy: 0.16, sp: 0.70, sq: 0.55, r: 0.60, rgb: "196,114,84",  a: 0.38 },
      { ox: 0.72, oy: 0.32, fx: 0.16, fy: 0.22, sp: 1.10, sq: 0.65, r: 0.52, rgb: "201,166,115", a: 0.26 },
      { ox: 0.50, oy: 0.78, fx: 0.24, fy: 0.18, sp: 0.55, sq: 1.00, r: 0.48, rgb: "7,38,38",     a: 0.70 },
      { ox: 0.14, oy: 0.58, fx: 0.12, fy: 0.14, sp: 1.40, sq: 0.80, r: 0.32, rgb: "244,236,220", a: 0.07 },
      { ox: 0.86, oy: 0.64, fx: 0.14, fy: 0.20, sp: 0.85, sq: 1.30, r: 0.40, rgb: "196,114,84",  a: 0.18 },
    ];

    function draw() {
      t += 0.0028;
      const w = c.offsetWidth, h = c.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0e3b3a";
      ctx.fillRect(0, 0, w, h);
      for (const b of BLOBS) {
        const bx = (b.ox + b.fx * Math.sin(t * b.sp + b.ox * 5)) * w;
        const by = (b.oy + b.fy * Math.cos(t * b.sq + b.oy * 4)) * h;
        const br = b.r * Math.max(w, h) * 0.72;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0,   `rgba(${b.rgb},${b.a})`);
        g.addColorStop(0.5, `rgba(${b.rgb},${b.a * 0.28})`);
        g.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      rid = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(rid); ro.disconnect(); };
  }, []);

  return (
    <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", ...style }} />
  );
}

// ── Organic Loader ────────────────────────────────────────────────
function OrganicLoader({ size = 32, color = CORAL }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: size, height: size,
        background: color,
        animation: "organicMorph 2.4s ease-in-out infinite",
        flexShrink: 0,
      }} />
    </div>
  );
}

// ── Beds24 Modal (Nogent — réservation + paiement Stripe) ────────
function Beds24Modal({ bien, checkin, checkout, onClose }) {
  // phase 1 = iframe Beds24, phase 2 = formulaire + montant, phase 3 = Stripe Elements
  const [phase, setPhase] = useState(1);
  const [phase1Confirmed, setPhase1Confirmed] = useState(false);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "" });
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const spRef = useRef(null);

  // ── Suivi réservation Beds24 pour annulation automatique ──
  const [bookingId, setBookingId] = useState(null);      // ID Beds24 une fois trouvé
  const [findingBooking, setFindingBooking] = useState(false);
  const paymentDoneRef = useRef(false);                  // vrai dès que Stripe confirme
  const bookingIdRef   = useRef(null);                   // ref stable pour le cleanup

  // Annule la réservation Beds24 (best-effort)
  const cancelBeds24Booking = async (id) => {
    if (!id) return;
    try {
      await fetch("/api/beds24-manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", bookingId: id }),
      });
    } catch {}
  };

  // Confirme la réservation Beds24 (best-effort)
  const confirmBeds24Booking = async (id) => {
    if (!id) return;
    try {
      await fetch("/api/beds24-manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", bookingId: id }),
      });
    } catch {}
  };

  // Quand le composant se démonte : annuler si pas payé et booking trouvé
  useEffect(() => {
    return () => {
      if (!paymentDoneRef.current && bookingIdRef.current) {
        cancelBeds24Booking(bookingIdRef.current);
      }
    };
  }, []);

  // Dates locales : props si pré-sélectionnées, sinon saisies en phase 2
  const [localCheckin,  setLocalCheckin]  = useState(checkin  || "");
  const [localCheckout, setLocalCheckout] = useState(checkout || "");

  const nights = localCheckin && localCheckout ? dateDiff(localCheckin, localCheckout) : 0;
  const rawTotal = nights > 0 ? nights * bien.prix : 0;
  const fraisMenage = FRAIS_MENAGE[bien.id] ?? 0;
  const discountRate = getDiscount(nights);
  const discountAmt  = Math.round(rawTotal * discountRate);
  // fraisMenage inclus seulement si les dates sont connues
  const computedTotal = nights > 0 ? rawTotal - discountAmt + fraisMenage : 0;
  const [amount, setAmount] = useState(() => computedTotal || 0);

  // Recalcul automatique du montant quand les dates changent
  useEffect(() => {
    if (computedTotal > 0) setAmount(computedTotal);
  }, [computedTotal]);

  useEffect(() => { if (window.Stripe) setStripe(window.Stripe(STRIPE_PK)); }, []);

  // Mount Stripe Elements once phase 3 renders
  useEffect(() => {
    if (phase === 3 && elements) {
      const pe = elements.getElement("payment");
      if (pe) pe.mount("#b24-spe");
    }
  }, [phase, elements]);

  const stripeAppearance = { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } };

  async function goToStripe() {
    if (!stripe) return;
    setPaying(true); setPayError(""); setFindingBooking(true);

    // Variables locales — ne pas lire le state React après des await
    let finalAmount  = amount;          // prix calculé localement (si dates props)
    let finalCheckin  = localCheckin;
    let finalCheckout = localCheckout;

    try {
      // ── 1. Chercher la réservation Beds24 → récupérer prix + dates réels ──
      try {
        const fr = await fetch("/api/beds24-manage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action:   "find",
            email:    form.email,
            lastName: form.nom.trim(),
            checkin:  localCheckin || undefined,
          }),
        });
        const fd = await fr.json();
        if (fd.ok && fd.bookingId) {
          setBookingId(fd.bookingId);
          bookingIdRef.current = fd.bookingId;
          // Prix Beds24 — source de vérité
          if (fd.price > 0) {
            finalAmount = Math.round(fd.price);
            setAmount(finalAmount);
          }
          // Dates Beds24 — source de vérité
          if (fd.arrival)   { finalCheckin  = fd.arrival;   setLocalCheckin(fd.arrival); }
          if (fd.departure) { finalCheckout = fd.departure; setLocalCheckout(fd.departure); }
        }
      } catch (findErr) {
        console.warn("[beds24-find] échec:", findErr.message);
        // Non bloquant — on utilise le prix calculé localement si dispo
      }
      setFindingBooking(false);

      // ── 2. Validation du montant ──
      if (!finalAmount || finalAmount < 50) {
        // Tenter le calcul local à partir des dates Beds24 récupérées
        if (finalCheckin && finalCheckout) {
          const n = dateDiff(finalCheckin, finalCheckout);
          if (n > 0) {
            const raw = n * bien.prix;
            const disc = Math.round(raw * getDiscount(n));
            finalAmount = raw - disc + (FRAIS_MENAGE[bien.id] ?? 0);
            setAmount(finalAmount);
          }
        }
        if (!finalAmount || finalAmount < 50) {
          throw new Error("Impossible de déterminer le montant. Vérifiez que votre réservation Beds24 est bien confirmée, puis réessayez.");
        }
      }

      // ── 3. Créer le PaymentIntent Stripe ──
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:   finalAmount * 100,
          currency: "eur",
          metadata: {
            bienId:   bien.id,
            checkin:  finalCheckin,
            checkout: finalCheckout,
            voyageur: `${form.prenom} ${form.nom}`.trim(),
            email:    form.email,
            beds24Id: bookingIdRef.current || "",
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const el = stripe.elements({ clientSecret: data.clientSecret, appearance: stripeAppearance });
      el.create("payment");
      setElements(el);
      setPhase(3);

    } catch (e) {
      setPayError(e.message);
    } finally {
      setPaying(false);
      setFindingBooking(false);
    }
  }

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true); setPayError("");
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/merci" },
      redirect: "if_required",
    });
    if (error) {
      // Paiement échoué : annuler la réservation Beds24
      setPayError(error.message);
      if (bookingIdRef.current) {
        await cancelBeds24Booking(bookingIdRef.current);
        bookingIdRef.current = null;
        setBookingId(null);
        setPayError(error.message + " — Votre réservation Beds24 a été annulée. Vous pouvez recommencer.");
      }
      setPaying(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      paymentDoneRef.current = true;                        // empêche l'annulation au démontage
      await confirmBeds24Booking(bookingIdRef.current);    // confirmer côté Beds24
      if (window.gtag) window.gtag("event", "purchase", {
        transaction_id: paymentIntent.id, currency: "EUR", value: amount,
        items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights || 1 }],
      });
      window.location.href = "/merci";
    }
    setPaying(false);
  }

  // amount n'est pas requis ici : il sera récupéré/validé dans goToStripe()
  const formOk = form.email.includes("@") && form.nom.trim().length > 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(6,22,22,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}
    >
      <div
        style={{ background: IVORY, borderRadius: 12, overflow: "hidden", width: "100%", maxWidth: phase === 1 ? 860 : 500, maxHeight: "calc(92vh - env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.45)", transition: "max-width 0.3s ease" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${SAND}`, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, marginBottom: 4 }}>
              {phase === 1 ? "Réservation" : phase === 2 ? "Paiement — étape 1/2" : "Paiement — étape 2/2"}
            </div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase", color: NAVY }}>
              {bien.nom}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: NAVY, opacity: 0.5, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Phase 1 — Beds24 iframe */}
        {phase === 1 && (
          <>
            {/* Instruction étape 1 */}
            <div style={{ padding: "10px 24px", background: "rgba(196,114,84,0.07)", borderBottom: `1px solid ${SAND}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ background: CORAL, color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>1</span>
              <span style={{ fontSize: 12, color: NAVY, fontWeight: 600 }}>Remplissez et validez le formulaire de réservation ci-dessous</span>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <iframe src={bien.beds24Url} width="100%" height="100%" style={{ border: "none", display: "block", minHeight: "600px" }} title="Réservation Beds24" />
            </div>

            {/* Étape 2 — visible seulement après confirmation par checkbox */}
            <div style={{ padding: "14px 24px", borderTop: `1px solid ${SAND}`, background: IVORY, flexShrink: 0 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={!!phase1Confirmed}
                  onChange={e => setPhase1Confirmed(e.target.checked)}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: CORAL, cursor: "pointer", flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: NAVY, lineHeight: 1.4 }}>
                  <strong>Ma réservation est confirmée</strong> — j'ai cliqué sur le bouton de réservation dans le formulaire ci-dessus et reçu une confirmation
                </span>
              </label>
              <button
                onClick={() => setPhase(2)}
                disabled={!phase1Confirmed}
                style={{ width: "100%", padding: "13px", borderRadius: 9, border: "none", background: phase1Confirmed ? CORAL : SAND, color: phase1Confirmed ? "#fff" : MUTED, fontWeight: 700, fontSize: 14, cursor: phase1Confirmed ? "pointer" : "not-allowed", letterSpacing: "0.02em", transition: "background 0.2s, color 0.2s" }}
              >
                Procéder au paiement →
              </button>
            </div>
          </>
        )}

        {/* Phase 2 — Coordonnées + montant */}
        {phase === 2 && (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

            {/* Dates du séjour — lecture seule */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              {[["Arrivée", localCheckin], ["Départ", localCheckout]].map(([label, val]) => (
                <div key={label} style={{ flex: 1, background: val ? "rgba(196,114,84,0.06)" : "rgba(255,255,255,0.04)", borderRadius: 8, border: `1px solid ${val ? "rgba(196,114,84,0.25)" : SAND}`, padding: "9px 12px" }}>
                  <div style={{ fontSize: 10, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: val ? NAVY : MUTED }}>
                    {val ? new Date(val + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </div>
                </div>
              ))}
            </div>
            {!localCheckin && !localCheckout && (
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 12, padding: "8px 12px", background: "rgba(245,158,11,0.08)", borderRadius: 7, border: "1px solid rgba(245,158,11,0.2)" }}>
                ℹ️ Les dates seront récupérées automatiquement depuis votre réservation Beds24 lors de la validation
              </div>
            )}

            {/* Récapitulatif séjour — affiché dès que les dates sont connues */}
            {nights > 0 && (
              <div style={{ background: "rgba(196,114,84,0.07)", border: `1px solid rgba(196,114,84,0.22)`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: CORAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Récapitulatif</div>
                <div style={{ fontSize: 12, color: NAVY, fontWeight: 600, marginBottom: 8 }}>
                  {bien.nom} · {localCheckin} → {localCheckout} ({nights} nuit{nights > 1 ? "s" : ""})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED }}>
                    <span>Hébergement ({nights} × {bien.prix} €)</span><span>{rawTotal} €</span>
                  </div>
                  {discountAmt > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#10b981" }}>
                      <span>Remise séjour (−{Math.round(discountRate * 100)}%)</span><span>−{discountAmt} €</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED }}>
                    <span>Frais de ménage</span><span>{fraisMenage} €</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: NAVY, borderTop: `1px solid ${SAND}`, paddingTop: 6, marginTop: 2 }}>
                    <span>Total calculé</span><span>{computedTotal} €</span>
                  </div>
                </div>
              </div>
            )}

            {/* Coordonnées */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>Prénom</label>
                <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Jean" style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${SAND}`, background: IVORY, color: NAVY, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>Nom *</label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Dupont" style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${SAND}`, background: IVORY, color: NAVY, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>E-mail *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jean.dupont@email.com" style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${SAND}`, background: IVORY, color: NAVY, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Montant — récupéré depuis Beds24 au clic sur Continuer */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>Montant à régler</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: amount > 0 ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.04)", borderRadius: 9, border: `2px solid ${amount > 0 ? "rgba(16,185,129,0.3)" : SAND}`, padding: "12px 16px" }}>
                <span style={{ flex: 1, fontSize: 22, fontWeight: 800, color: amount > 0 ? NAVY : MUTED }}>
                  {amount > 0 ? `${amount} €` : "Calculé automatiquement →"}
                </span>
                {amount > 0 && <span style={{ fontSize: 11, color: MUTED }}>confirmé par Beds24</span>}
              </div>
            </div>

            {payError && <div style={{ color: "#e53e3e", fontSize: 12, marginBottom: 12, background: "rgba(229,62,62,0.08)", borderRadius: 7, padding: "8px 12px" }}>{payError}</div>}

            <button
              onClick={goToStripe}
              disabled={paying || !formOk || !stripe}
              style={{ width: "100%", padding: "13px", borderRadius: 9, border: "none", background: formOk && !paying && stripe ? CORAL : SAND, color: formOk && !paying && stripe ? "#fff" : MUTED, fontWeight: 700, fontSize: 14, cursor: formOk && !paying ? "pointer" : "not-allowed", transition: "background 0.2s" }}
            >
              {findingBooking ? "Récupération du prix…" : paying ? "Préparation du paiement…" : "Continuer →"}
            </button>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: MUTED }}>🔒 Paiement sécurisé par Stripe</div>
            <button onClick={() => setPhase(1)} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>
              ← Retour au formulaire de réservation
            </button>
          </div>
        )}

        {/* Phase 3 — Stripe Elements */}
        {phase === 3 && (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            <div style={{ background: "rgba(196,114,84,0.07)", border: `1px solid rgba(196,114,84,0.22)`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{bien.nom}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{form.prenom} {form.nom} · {form.email}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: CORAL }}>{amount} €</div>
            </div>

            <div id="b24-spe" ref={spRef} style={{ marginBottom: 16 }} />

            {payError && <div style={{ color: "#e53e3e", fontSize: 12, marginBottom: 12, background: "rgba(229,62,62,0.08)", borderRadius: 7, padding: "8px 12px" }}>{payError}</div>}

            <button
              onClick={handlePay}
              disabled={paying || !stripe || !elements}
              style={{ width: "100%", padding: "13px", borderRadius: 9, border: "none", background: paying ? SAND : CORAL, color: paying ? MUTED : "#fff", fontWeight: 700, fontSize: 14, cursor: paying ? "not-allowed" : "pointer" }}
            >
              {paying ? "Traitement en cours…" : `Confirmer le paiement · ${amount} €`}
            </button>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: MUTED }}>🔒 Vos données bancaires sont chiffrées · Aucune donnée n'est stockée sur nos serveurs</div>
            <button onClick={() => { setPhase(2); setElements(null); }} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>
              ← Modifier les informations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Devis PDF (HTML print) ────────────────────────────────────────
function generateDevis({ bien, checkin, checkout, nights, rawTotal, discountRate, discountAmount, fraisMenage, extraGuestSuppl = 0, extraGuests = 0, petSuppl = 0, nbPets = 0, total, depositAmt }) {
  const validUntil = new Date(Date.now() + 48 * 3600 * 1000).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const ref = `AMR-${bien.id.slice(0,3).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const hasDiscount = discountRate > 0;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Devis — ${bien.nom}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background:#fff; color:#0e3b3a; font-size:14px; }
    .page { max-width:720px; margin:0 auto; padding:40px 40px 60px; }

    /* Header */
    .header { background:#0e3b3a; color:#fff; border-radius:12px; padding:28px 32px; margin-bottom:28px; display:flex; justify-content:space-between; align-items:flex-start; }
    .header-brand { }
    .header-brand .logo { font-size:22px; font-weight:200; letter-spacing:0.25em; text-transform:uppercase; }
    .header-brand .tagline { font-size:11px; opacity:0.6; margin-top:3px; letter-spacing:1px; text-transform:uppercase; }
    .header-doc { text-align:right; }
    .header-doc .doc-title { font-size:26px; font-weight:800; letter-spacing:-0.5px; }
    .header-doc .doc-ref { font-size:11px; opacity:0.55; margin-top:4px; }
    .header-doc .doc-date { font-size:11px; opacity:0.55; margin-top:2px; }

    /* Property */
    .property-section { display:flex; gap:20px; margin-bottom:24px; align-items:flex-start; }
    .property-photo { width:140px; height:94px; object-fit:cover; border-radius:8px; flex-shrink:0; border:1px solid #e0d4bc; }
    .property-info .name { font-size:20px; font-weight:700; color:#0e3b3a; }
    .property-info .location { font-size:12px; color:#7a6b5a; margin-top:3px; }
    .property-info .dates { margin-top:10px; font-size:13px; color:#0e3b3a; background:#f4ecdc; border-radius:7px; padding:8px 12px; display:inline-block; }
    .property-info .dates strong { color:#c47254; }

    /* Table */
    .table-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#7a6b5a; margin-bottom:10px; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    thead th { background:#0e3b3a; color:#fff; padding:10px 14px; text-align:left; font-size:12px; font-weight:600; }
    thead th:last-child { text-align:right; }
    tbody tr { border-bottom:1px solid #e0d4bc; }
    tbody tr:last-child { border-bottom:none; }
    tbody td { padding:11px 14px; font-size:13px; color:#0e3b3a; }
    tbody td:last-child { text-align:right; font-weight:600; }
    tbody tr.discount td { color:#c47254; }
    tbody tr.total-row { background:#faf5e9; }
    tbody tr.total-row td { font-size:15px; font-weight:800; padding:14px; }
    tbody tr.total-row td:last-child { color:#c47254; font-size:18px; }

    /* Deposit */
    .deposit-box { background:#fffbeb; border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:14px 18px; margin-bottom:24px; }
    .deposit-box .dep-title { font-weight:700; color:#92400e; font-size:13px; margin-bottom:4px; }
    .deposit-box .dep-desc { font-size:12px; color:#78350f; line-height:1.5; }

    /* Validity */
    .validity-box { background:#f0fdf4; border:1px solid rgba(34,197,94,0.25); border-radius:10px; padding:14px 18px; margin-bottom:24px; }
    .validity-box .val-title { font-weight:700; color:#166534; font-size:13px; margin-bottom:4px; }
    .validity-box .val-desc { font-size:12px; color:#15803d; }

    /* Contact */
    .contact-section { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:28px; }
    .contact-item { background:#f4ecdc; border-radius:7px; padding:10px 14px; font-size:12px; color:#0e3b3a; flex:1; min-width:160px; }
    .contact-item .label { font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#7a6b5a; margin-bottom:3px; }

    /* Footer */
    .footer { border-top:1px solid #e0d4bc; padding-top:16px; font-size:11px; color:#7a6b5a; text-align:center; line-height:1.6; }
    .badge { display:inline-block; background:#0e3b3a; color:#fff; border-radius:20px; padding:4px 12px; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }

    @media print {
      body { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
      .page { padding:20px; }
      .no-print { display:none; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Print button (hidden on print) -->
  <div class="no-print" style="text-align:right; margin-bottom:16px;">
    <button onclick="window.print()" style="background:#0e3b3a;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;">
      🖨 Enregistrer en PDF
    </button>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="header-brand">
      <div class="logo">Amaryllis</div>
      <div class="tagline">Locations de prestige · Martinique &amp; Île-de-France</div>
    </div>
    <div class="header-doc">
      <div class="doc-title">DEVIS</div>
      <div class="doc-ref">Réf. ${ref}</div>
      <div class="doc-date">Émis le ${today}</div>
    </div>
  </div>

  <!-- Property -->
  <div class="property-section">
    <img class="property-photo" src="https://villamaryllis.com${bien.photos[0]}" alt="${bien.nom}" />
    <div class="property-info">
      <div class="name">${bien.nom}</div>
      <div class="location">📍 ${bien.lieu}</div>
      <div class="dates">
        <strong>Arrivée :</strong> ${formatDateLong(checkin)} &nbsp;→&nbsp; <strong>Départ :</strong> ${formatDateLong(checkout)}
        &nbsp;·&nbsp; <strong>${nights} nuit${nights > 1 ? "s" : ""}</strong>
      </div>
    </div>
  </div>

  <!-- Price table -->
  <div class="table-title">Détail du tarif</div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Détail</th>
        <th>Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Hébergement</td>
        <td style="color:#7a6b5a;font-size:12px;">${nights} nuit${nights > 1 ? "s" : ""} · tarif dynamique</td>
        <td>${rawTotal}€</td>
      </tr>
      ${hasDiscount ? `<tr class="discount">
        <td>Réduction ${discountLabel(nights)} (−${Math.round(discountRate * 100)}%)</td>
        <td style="color:#c47254;font-size:12px;">Réduction séjour prolongé</td>
        <td>−${discountAmount}€</td>
      </tr>` : ""}
      ${fraisMenage > 0 ? `<tr>
        <td>Frais de ménage</td>
        <td style="color:#7a6b5a;font-size:12px;">Nettoyage fin de séjour</td>
        <td>${fraisMenage}€</td>
      </tr>` : ""}
      ${extraGuestSuppl > 0 ? `<tr>
        <td>Supplément voyageurs</td>
        <td style="color:#7a6b5a;font-size:12px;">${extraGuests} pers. suppl. × ${nights} nuit${nights > 1 ? "s" : ""} × ${EXTRA_GUEST_RATE[bien.id] ?? 50}€</td>
        <td>${extraGuestSuppl}€</td>
      </tr>` : ""}
      ${petSuppl > 0 ? `<tr>
        <td>Animaux (${nbPets})</td>
        <td style="color:#7a6b5a;font-size:12px;">Forfait séjour — max 2 animaux</td>
        <td>${petSuppl}€</td>
      </tr>` : ""}
      <tr class="total-row">
        <td colspan="2">TOTAL SÉJOUR</td>
        <td>${total}€</td>
      </tr>
    </tbody>
  </table>

  ${depositAmt > 0 ? `<div class="deposit-box">
    <div class="dep-title">🔒 Dépôt de garantie — ${depositAmt}€</div>
    <div class="dep-desc">Ce montant sera pré-autorisé sur votre carte bancaire au moment de la réservation. Il ne sera pas débité et sera libéré automatiquement après votre départ si aucun dommage n'est constaté.</div>
  </div>` : ""}

  <div class="validity-box">
    <div class="val-title">✅ Validité du devis — 48 heures</div>
    <div class="val-desc">Ce devis est valable jusqu'au ${validUntil}. Les disponibilités et tarifs ne sont garantis qu'au moment de la réservation.</div>
  </div>

  <!-- Contact -->
  <div class="table-title">Nous contacter</div>
  <div class="contact-section">
    <div class="contact-item"><div class="label">WhatsApp / Téléphone</div>+33 6 10 88 07 72</div>
    <div class="contact-item"><div class="label">Email</div>contact@villamaryllis.com</div>
    <div class="contact-item"><div class="label">Site web</div>villamaryllis.com</div>
    <div class="contact-item"><div class="label">Réservation directe</div>Sans frais de service Airbnb</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="badge">Réservation directe · Zéro frais Airbnb</div><br/>
    Amaryllis Locations · villamaryllis.com · contact@villamaryllis.com<br/>
    Tarifs indicatifs. Le total définitif est confirmé au moment de la réservation.
  </div>

</div>
<script>
  // Auto-print dès que la popup est ouverte depuis le site
  if (window.opener) { setTimeout(() => window.print(), 700); }
</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ── Booking Modal ────────────────────────────────────────────────
function BookingModal({ bien, blockedDates, loadingAvail, onClose, initialCheckin = null, initialCheckout = null }) {
  useMinNights(); // re-render when admin changes min nights
  const [step, setStep] = useState(1);
  const [checkin, setCheckin] = useState(initialCheckin);
  const [checkout, setCheckout] = useState(initialCheckout);
  const [nbGuests, setNbGuests] = useState(1);
  const [nbPets, setNbPets] = useState(0);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", tel: "", message: "" });
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [depositElements, setDepositElements] = useState(null);
  const [depositPaying, setDepositPaying] = useState(false);
  const [depositError, setDepositError] = useState("");
  const elRef = useRef(null);
  const depositAmt = DEPOSIT_AMOUNTS[bien.id] ?? 0;

  const nights = checkin && checkout ? dateDiff(checkin, checkout) : 0;

  const [dailyPricesMap, setDailyPricesMap] = useState(() => {
    try { return loadDailyPrices()[bien.id] || {}; } catch { return {}; }
  });
  const [gapDates, setGapDates] = useState({});

  useEffect(() => {
    const refresh = () => {
      try { setDailyPricesMap(loadDailyPrices()[bien.id] || {}); } catch {}
    };
    const storageRefresh = (e) => { if (!e.key || e.key === "amaryllis_prices") refresh(); };
    window.addEventListener("amaryllis_prices_updated", refresh); // même onglet
    window.addEventListener("storage", storageRefresh);           // autres onglets
    return () => {
      window.removeEventListener("amaryllis_prices_updated", refresh);
      window.removeEventListener("storage", storageRefresh);
    };
  }, [bien.id]);

  // Remises gap depuis le worker (trous de calendrier)
  useEffect(() => {
    fetch("https://amaryllis-ical-sync.vinsmaf.workers.dev/gap-prices")
      .then(r => r.json())
      .then(data => {
        const bienGaps = data[bien.id] || {};
        if (Object.keys(bienGaps).length > 0) {
          setGapDates(bienGaps);
          setDailyPricesMap(prev => {
            const base = { ...prev };
            const seed = (() => { try { return loadDailyPrices()[bien.id] || {}; } catch { return {}; } })();
            for (const [date, pct] of Object.entries(bienGaps)) {
              const basePrice = seed[date] ?? bien.prix;
              base[date] = Math.round(basePrice * (1 - pct / 100));
            }
            return base;
          });
        }
      })
      .catch(() => {});
  }, [bien.id, bien.prix]);

  // Total basé sur les prix journaliers réels
  const rawTotal = (() => {
    if (!checkin || !checkout || nights === 0) return 0;
    let sum = 0;
    let cur = checkin;
    for (let i = 0; i < nights; i++) {
      sum += dailyPricesMap[cur] ?? bien.prix;
      cur = addDays(cur, 1);
    }
    return sum;
  })();
  const discountRate   = getDiscount(nights);
  const hasDiscount    = discountRate > 0;
  const discountAmount = hasDiscount ? Math.round(rawTotal * discountRate) : 0;
  const fraisMenage = FRAIS_MENAGE[bien.id] ?? 0;
  // Supplément voyageurs supplémentaires (ex : Amaryllis 7e et 8e voyageur = +50€/pers./nuit)
  const baseGuests      = BASE_GUESTS[bien.id] ?? bien.capacite;
  const extraGuestRate  = EXTRA_GUEST_RATE[bien.id] ?? 0;
  const extraGuests     = Math.max(0, nbGuests - baseGuests);
  const extraGuestSuppl = extraGuests * extraGuestRate * nights;
  const petSuppl        = nbPets > 0 ? PET_SUPPLEMENT : 0;
  const total = rawTotal - discountAmount + fraisMenage + extraGuestSuppl + petSuppl;
  const minNights = getMinNights(bien.id, checkin);
  const belowMin = nights > 0 && nights < minNights;

  const formOk = form.prenom && form.nom && form.email && form.email.includes("@");

  useEffect(() => {
    if (window.Stripe) setStripe(window.Stripe(STRIPE_PK));
  }, []);

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const stripeAppearance = { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } };

  async function goToPayment() {
    setPaying(true); setPayError("");
    try {
      // Payment intent
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total * 100, currency: "eur", metadata: { bienId: bien.id, checkin, checkout, voyageur: `${form.prenom} ${form.nom}`, email: form.email } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Deposit intent (pre-auth) — store clientSecret for use in step 4 / merci page
      if (depositAmt) {
        const dr = await fetch("/api/create-deposit-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: depositAmt * 100, currency: "eur", metadata: { bienId: bien.id, checkin, checkout, voyageur: `${form.prenom} ${form.nom}`, email: form.email } }),
        });
        const dd = await dr.json();
        if (!dd.error && dd.clientSecret) {
          sessionStorage.setItem("deposit_cs", dd.clientSecret);
          sessionStorage.setItem("deposit_amt", String(depositAmt));
          sessionStorage.setItem("deposit_bien", bien.nom);
          sessionStorage.setItem("deposit_checkin", checkin || "");
          sessionStorage.setItem("deposit_checkout", checkout || "");
        }
      }

      const el = stripe.elements({ clientSecret: data.clientSecret, appearance: stripeAppearance });
      el.create("payment"); // mount happens in useEffect after step renders
      setElements(el);
      setStep(3);
    } catch (e) { setPayError(e.message); }
    setPaying(false);
  }

  async function goToDeposit() {
    const cs = sessionStorage.getItem("deposit_cs");
    if (!cs) { window.location.href = "/merci"; return; }
    const el2 = stripe.elements({ clientSecret: cs, appearance: stripeAppearance });
    el2.create("payment"); // mount happens in useEffect after step renders
    setDepositElements(el2);
    setStep(4);
  }

  // Mount Stripe elements after React renders the target divs
  useEffect(() => {
    if (step === 3 && elements) {
      const pe = elements.getElement("payment");
      if (pe) pe.mount("#spe");
    }
  }, [step, elements]);

  useEffect(() => {
    if (step === 4 && depositElements) {
      const pe = depositElements.getElement("payment");
      if (pe) pe.mount("#spe-deposit");
    }
  }, [step, depositElements]);

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true); setPayError("");
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/merci" },
      redirect: "if_required",
    });
    if (error) { setPayError(error.message); setPaying(false); return; }
    // No redirect needed (non-3DS card) → proceed to deposit step or finish
    if (paymentIntent?.status === "succeeded") {
      if (window.gtag) window.gtag("event", "purchase", {
        transaction_id: paymentIntent.id,
        currency: "EUR",
        value: total,
        items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights }],
      });
      if (depositAmt && sessionStorage.getItem("deposit_cs")) {
        await goToDeposit();
      } else {
        window.location.href = "/merci";
      }
    }
    setPaying(false);
  }

  async function handleDeposit() {
    if (!stripe || !depositElements) return;
    setDepositPaying(true); setDepositError("");
    const { error } = await stripe.confirmPayment({
      elements: depositElements,
      confirmParams: { return_url: window.location.origin + "/merci?deposit=1" },
      redirect: "if_required",
    });
    if (error) setDepositError(error.message);
    setDepositPaying(false);
  }

  const steps = depositAmt ? ["Dates", "Coordonnées", "Paiement", "Caution"] : ["Dates", "Coordonnées", "Paiement"];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(14,59,58,0.75)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{
        background: CREAM,
        border: `1px solid ${SAND}`,
        borderRadius: 20,
        padding: "32px",
        maxWidth: 680, width: "100%",
        maxHeight: "calc(92vh - env(safe-area-inset-bottom))", overflowY: "auto",
        position: "relative",
        boxShadow: `0 24px 64px rgba(14,59,58,0.15)`,
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: CORAL, fontWeight: 700, letterSpacing: 3, marginBottom: 6, textTransform: "uppercase" }}>RÉSERVATION DIRECTE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{bien.nom}</div>
            <div style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>📍 {bien.lieu}</div>
          </div>
          <button
            aria-label="Fermer"
            onClick={onClose}
            style={{
              background: SAND, border: `1px solid ${SAND}`,
              color: MUTED, width: 36, height: 36, borderRadius: 10,
              cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32, alignItems: "center" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flex: i < steps.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: step > i + 1 ? CORAL : step === i + 1 ? CORAL : "rgba(27,40,86,0.06)",
                  border: `1px solid ${step >= i + 1 ? CORAL : SAND}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: step > i + 1 ? "#fff" : step === i + 1 ? "#fff" : MUTED,
                  transition: "background 0.3s",
                }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? NAVY : MUTED }}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > i + 1 ? CORAL : SAND, transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 — Dates */}
        {step === 1 && (
          <>
            {loadingAvail && (
              <div style={{ textAlign: "center", padding: "8px 0 4px", color: MUTED, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <OrganicLoader size={18} color={CORAL} />
                Chargement des disponibilités…
              </div>
            )}
            <DateRangePicker checkin={checkin} checkout={checkout} blockedDates={blockedDates} onChange={(ci, co) => { setCheckin(ci); setCheckout(co); }} dailyPricesMap={dailyPricesMap} basePrice={bien.prix} minNights={minNights} gapDates={gapDates} />

            {/* Sélecteur voyageurs — affiché si le bien a une capacité > 1 */}
            {bien.capacite > 1 && (
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "14px 18px" }}>
                <span style={{ fontSize: 18 }}>👥</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: "'Jost', sans-serif" }}>Voyageurs</div>
                  {extraGuestRate > 0 && (
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
                      {baseGuests} inclus · {extraGuestRate}€/pers. supplémentaire/nuit (max {bien.capacite})
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setNbGuests(g => Math.max(1, g - 1))}
                    style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${SAND}`, background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, lineHeight: 1 }}
                  >−</button>
                  <span style={{ fontSize: 16, fontWeight: 700, color: NAVY, minWidth: 20, textAlign: "center" }}>{nbGuests}</span>
                  <button
                    onClick={() => setNbGuests(g => Math.min(bien.capacite, g + 1))}
                    style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${SAND}`, background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, lineHeight: 1 }}
                  >+</button>
                </div>
              </div>
            )}

            {/* Sélecteur animaux — masqué si animaux interdits */}
            {!PETS_FORBIDDEN.has(bien.id) && (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "14px 18px" }}>
                <span style={{ fontSize: 18 }}>🐾</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: "'Jost', sans-serif" }}>Animaux</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>Max {MAX_PETS} · {PET_SUPPLEMENT}€ forfait/séjour si 1 ou 2 animaux</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setNbPets(p => Math.max(0, p - 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${SAND}`, background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, lineHeight: 1 }}>−</button>
                  <span style={{ fontSize: 16, fontWeight: 700, color: NAVY, minWidth: 20, textAlign: "center" }}>{nbPets}</span>
                  <button onClick={() => setNbPets(p => Math.min(MAX_PETS, p + 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${SAND}`, background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, lineHeight: 1 }}>+</button>
                </div>
              </div>
            )}

            {nights > 0 ? (
              <div style={{
                marginTop: 16,
                background: belowMin ? "rgba(239,68,68,0.04)" : "rgba(200,85,61,0.04)",
                border: `1px solid ${belowMin ? "rgba(239,68,68,0.25)" : SAND}`,
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: MUTED, fontSize: 13 }}>{formatDateLong(checkin)} → {formatDateLong(checkout)}</span>
                    {!belowMin && (
                      <span style={{
                        background: "rgba(196,114,84,0.12)", border: `1px solid rgba(196,114,84,0.25)`,
                        borderRadius: 20, padding: "2px 10px",
                        fontSize: 11, fontWeight: 700, color: CORAL,
                        fontFamily: "'Jost', sans-serif", whiteSpace: "nowrap",
                      }}>
                        = {nights} nuit{nights > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {belowMin ? (
                    <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginTop: 6 }}>
                      ⚠ Séjour minimum : {minNights} nuits pour ce bien
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>{nights} nuit{nights > 1 ? "s" : ""} — sous-total {rawTotal}€</div>
                      {fraisMenage > 0 && (
                        <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>🧹 Frais de ménage {fraisMenage}€</div>
                      )}
                      {hasDiscount && (
                        <div style={{ fontSize: 13, color: CORAL, marginTop: 2, fontWeight: 600 }}>
                          🎁 Réduction {discountLabel(nights)} −{discountAmount}€ (−{Math.round(discountRate * 100)}%)
                        </div>
                      )}
                      {extraGuestSuppl > 0 && (
                        <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
                          👥 Supplément {extraGuests} voyageur{extraGuests > 1 ? "s" : ""} suppl. +{extraGuestSuppl}€
                        </div>
                      )}
                      {petSuppl > 0 && (
                        <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
                          🐾 Animaux ({nbPets}) +{petSuppl}€ forfait séjour
                        </div>
                      )}
                      <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginTop: 6 }}>{total}€</div>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
                  <button
                    onClick={() => {
                      if (belowMin) return;
                      if (window.gtag) window.gtag("event", "begin_checkout", {
                        currency: "EUR", value: total,
                        items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights }],
                      });
                      setStep(2);
                    }}
                    style={{
                      ...btnPrimary,
                      background: belowMin ? SAND : CORAL,
                      color: belowMin ? MUTED : "#fff",
                      cursor: belowMin ? "not-allowed" : "pointer",
                      opacity: belowMin ? 0.6 : 1,
                    }}
                  >
                    Réserver →
                  </button>
                  {!belowMin && (
                    <button
                      onClick={() => generateDevis({ bien, checkin, checkout, nights, rawTotal, discountRate, discountAmount, fraisMenage, extraGuestSuppl, extraGuests, petSuppl, nbPets, total, depositAmt })}
                      title="Télécharger le devis PDF"
                      style={{
                        background: "transparent", border: `1px solid ${SAND}`,
                        color: MUTED, borderRadius: 8, padding: "9px 14px",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = SAND; e.currentTarget.style.color = MUTED; }}
                    >
                      📄 Devis PDF
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 24, textAlign: "center", color: MUTED, fontSize: 14, padding: "20px 0" }}>
                Sélectionnez vos dates d'arrivée et de départ
              </div>
            )}
          </>
        )}

        {/* STEP 2 — Form */}
        {step === 2 && (
          <>
            <div style={{
              background: "rgba(200,85,61,0.04)",
              border: `1px solid ${SAND}`,
              borderRadius: 12, padding: "14px 18px", marginBottom: 24,
              fontSize: 14, color: MUTED,
              display: "flex", justifyContent: "space-between",
            }}>
              <span>{formatDateLong(checkin)} → {formatDateLong(checkout)} · {nbGuests} voyageur{nbGuests > 1 ? "s" : ""}</span>
              <span style={{ fontWeight: 700, color: NAVY }}>
                {nights} nuits · {total}€
                {hasDiscount && <span style={{ fontSize: 11, color: CORAL, marginLeft: 6 }}>−{Math.round(discountRate * 100)}% {discountLabel(nights)}</span>}
                {extraGuestSuppl > 0 && <span style={{ fontSize: 11, color: MUTED, marginLeft: 6 }}>+{extraGuestSuppl}€ suppl.</span>}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FormField label="Prénom *" value={form.prenom} onChange={v => setForm(f => ({ ...f, prenom: v }))} autoComplete="given-name" />
              <FormField label="Nom *" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} autoComplete="family-name" />
              <FormField label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" autoComplete="email" style={{ gridColumn: "1/-1" }} />
              <FormField label="Téléphone" value={form.tel} onChange={v => setForm(f => ({ ...f, tel: v }))} type="tel" autoComplete="tel" style={{ gridColumn: "1/-1" }} />
              <FormField label="Message (optionnel)" value={form.message} onChange={v => setForm(f => ({ ...f, message: v }))} multiline style={{ gridColumn: "1/-1" }} />
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "space-between" }}>
              <button onClick={() => setStep(1)} style={btnBack}>← Retour</button>
              <button
                onClick={goToPayment}
                disabled={!formOk || paying || !stripe}
                style={{
                  ...btnPrimary,
                  background: formOk && !paying && stripe ? CORAL : SAND,
                  color: "#fff",
                  opacity: formOk && !paying && stripe ? 1 : 0.5,
                  cursor: formOk && !paying && stripe ? "pointer" : "not-allowed",
                }}
              >
                {paying ? "Chargement…" : `Payer ${total}€ →`}
              </button>
            </div>
            {payError && <div style={errStyle}>⚠ {payError}</div>}
          </>
        )}

        {/* STEP 3 — Payment */}
        {step === 3 && (
          <>
            <div style={{
              background: "rgba(200,85,61,0.04)",
              border: `1px solid ${SAND}`,
              borderRadius: 12, padding: "14px 18px", marginBottom: 24,
              fontSize: 14, color: MUTED,
              display: "flex", justifyContent: "space-between",
            }}>
              <span>{form.prenom} {form.nom} · {formatDateLong(checkin)} → {formatDateLong(checkout)}</span>
              <span style={{ fontWeight: 700, color: NAVY }}>{total}€</span>
            </div>
            <div id="spe" style={{ marginBottom: 24 }} />
            <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
              <button onClick={() => setStep(2)} style={btnBack}>← Retour</button>
              <button
                onClick={handlePay}
                disabled={paying}
                style={{
                  ...btnPrimary,
                  background: paying ? SAND : CORAL,
                  color: "#fff",
                  opacity: paying ? 0.6 : 1,
                }}
              >
                {paying ? "Traitement…" : `✓ Confirmer et payer ${total}€`}
              </button>
            </div>
            {payError && <div style={errStyle}>⚠ {payError}</div>}
            <div style={{ marginTop: 16, textAlign: "center", color: MUTED, fontSize: 12 }}>🔒 Paiement sécurisé par Stripe</div>
          </>
        )}

        {/* STEP 4 — Deposit pre-auth */}
        {step === 4 && (
          <>
            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
              <div style={{ fontWeight: 700, color: "#92400e", fontSize: 14, marginBottom: 6 }}>🔒 Dépôt de garantie — {depositAmt.toLocaleString("fr-FR")} €</div>
              <div style={{ color: "#78350f", fontSize: 13, lineHeight: 1.6 }}>
                Ce montant sera <strong>bloqué</strong> sur votre carte mais <strong>non débité</strong>. Il sera libéré automatiquement après votre départ, sans démarche de votre part, si aucun dommage n'est constaté.
              </div>
            </div>
            <div id="spe-deposit" style={{ marginBottom: 24 }} />
            <button
              onClick={handleDeposit}
              disabled={depositPaying}
              style={{ ...btnPrimary, width: "100%", background: depositPaying ? SAND : "#d97706", color: "#fff", opacity: depositPaying ? 0.6 : 1 }}
            >
              {depositPaying ? "Traitement…" : `🔒 Valider le blocage de la caution — ${depositAmt.toLocaleString("fr-FR")} €`}
            </button>
            {depositError && <div style={errStyle}>⚠ {depositError}</div>}
            <div style={{ marginTop: 16, textAlign: "center", color: MUTED, fontSize: 12 }}>
              🔒 Pré-autorisation sécurisée · Aucun débit si aucun dommage · Libération automatique après votre séjour
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", multiline, style, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const s = {
    background: IVORY,
    border: `1px solid ${focused ? "rgba(196,114,84,0.53)" : SAND}`,
    borderRadius: 10,
    color: TEXT,
    padding: "11px 14px",
    width: "100%",
    fontSize: 16,
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {multiline
        ? <textarea rows={3} style={s} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        : <input type={type} autoComplete={autoComplete} style={s} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />}
    </div>
  );
}

// ── Property Card ────────────────────────────────────────────────
function BienCard({ bien, onDetail, onBook, isFavorite = false, onToggleFavorite, isCompared = false, onToggleCompare, compareDisabled = false }) {
  const { t, lang } = useLang();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const photos = bien.photos || [];
  const currentPhoto = photos[photoIdx] || "";
  const touchStartX = useRef(null);

  function prev(e) { e.stopPropagation(); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); }
  function next(e) { e.stopPropagation(); setPhotoIdx(i => (i + 1) % photos.length); }

  // Swipe tactile
  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? setPhotoIdx(i => (i + 1) % photos.length) : setPhotoIdx(i => (i - 1 + photos.length) % photos.length); }
    touchStartX.current = null;
  }

  // Prix minimum sur les 90 prochains jours (indicateur "À partir de")
  const minPrix = useMemo(() => {
    try {
      const map = loadDailyPrices()[bien.id] || {};
      const now = new Date(); let min = Infinity;
      for (let i = 0; i < 90; i++) {
        const d = new Date(now); d.setDate(now.getDate() + i);
        const ds = d.toISOString().slice(0, 10);
        const p = map[ds]; if (p !== undefined && p < min) min = p;
      }
      return min === Infinity ? bien.prix : min;
    } catch { return bien.prix; }
  }, [bien.id, bien.prix]);

  // Auto-avance toutes les 5 s — se réinitialise à chaque navigation manuelle
  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => setPhotoIdx(i => (i + 1) % photos.length), 5000);
    return () => clearInterval(t);
  }, [photoIdx, photos.length]);

  return (
    <div
      onClick={() => onDetail(bien)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${SAND}`,
        transition: "all 0.4s cubic-bezier(0.23,1,0.32,1)",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered
          ? "0 20px 48px rgba(14,59,58,0.12)"
          : "0 2px 16px rgba(14,59,58,0.06)",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
      }}
    >
      {/* Photo section — aspect ratio 3:2 */}
      <div
        style={{ position: "relative", paddingBottom: "66.6%", overflow: "hidden", background: "#0e2020" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      >
        {/* Skeleton placeholder */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0e2020 0%, #193535 100%)" }} />

        {currentPhoto ? (
          <img
            key={photoIdx}
            src={currentPhoto}
            alt={`${bien.nom} — ${bien.lieu} — photo ${photoIdx + 1}`}
            loading={photoIdx === 0 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={photoIdx === 0 ? "high" : "low"}
            onLoad={e => { e.currentTarget.style.opacity = "1"; }}
            style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%", objectFit: "cover",
              display: "block",
              opacity: 0,
              transition: "opacity 0.5s ease",
            }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🏡</div>
        )}

        {/* 2px coral line on hover */}
        {hovered && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: CORAL, zIndex: 2 }} />
        )}

        {/* Dark overlay gradient bottom */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(14,59,58,0.6) 0%, transparent 50%)" }} />

        {/* Carousel nav — toujours visibles */}
        {photos.length > 1 && (
          <>
            <button aria-label="Photo précédente" onClick={prev} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "none", color: NAVY, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4, lineHeight: 1 }}>←</button>
            <button aria-label="Photo suivante" onClick={next} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "none", color: NAVY, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4, lineHeight: 1 }}>→</button>
          </>
        )}

        {/* Dots */}
        {photos.length > 1 && (
          <div style={{ position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4, zIndex: 2 }}>
            {photos.map((_, i) => (
              <div
                key={i}
                onClick={e => { e.stopPropagation(); setPhotoIdx(i); }}
                style={{
                  width: i === photoIdx ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === photoIdx ? CORAL : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        )}

        {/* Tag badge */}
        {bien.tag && (
          <div style={{
            position: "absolute", top: 16, right: 14, zIndex: 3,
            background: "rgba(200,85,61,0.9)",
            color: "#fff", fontSize: 10, fontWeight: 700,
            padding: "4px 10px", borderRadius: 20, letterSpacing: 0.5,
            textTransform: "uppercase",
          }}>
            {lang === "fr" ? bien.tag : (bien.tagEn || bien.tag)}
          </div>
        )}

        {/* Badge "Réservation directe" */}
        {!PRICE_HIDDEN.has(bien.id) && (
          <div style={{
            position: "absolute", top: bien.tag ? 50 : 16, right: 14, zIndex: 3,
            background: "rgba(22,163,74,0.92)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#fff", fontSize: 10, fontWeight: 700,
            padding: "4px 10px", borderRadius: 20, letterSpacing: 0.4,
            fontFamily: "'Jost', sans-serif",
            textTransform: "uppercase",
          }}>
            ✓ Direct −15%
          </div>
        )}

        {/* Bouton favori */}
        {onToggleFavorite && (
          <button
            onClick={e => onToggleFavorite(e, bien.id)}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            style={{
              position: "absolute", top: 14, left: 14, zIndex: 4,
              width: 34, height: 34, borderRadius: "50%",
              background: isFavorite ? "rgba(232,89,138,0.92)" : "rgba(255,255,255,0.82)",
              backdropFilter: "blur(8px)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, lineHeight: 1,
              transition: "transform 0.18s, background 0.18s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              transform: isFavorite ? "scale(1.08)" : "scale(1)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = isFavorite ? "scale(1.08)" : "scale(1)"; }}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        )}

        {/* Urgency / Populaire badge — peak season (June–Sep) for popular properties */}
        {(() => {
          const month = new Date().getMonth(); // 0-indexed: May=4, June=5, Sep=8
          const isPopular = ["amaryllis", "zandoli"].includes(bien.id);
          const isPeak = month >= 5 && month <= 8;
          if (!isPopular || !isPeak) return null;
          return (
            <div style={{
              position: "absolute", top: 14, right: 52, zIndex: 3,
              background: "rgba(239,68,68,0.88)",
              backdropFilter: "blur(6px)",
              color: "#fff", fontSize: 10, fontWeight: 700,
              padding: "4px 10px", borderRadius: 20, letterSpacing: 0.3,
              fontFamily: "'Jost', sans-serif",
              whiteSpace: "nowrap",
            }}>
              🔥 Populaire ce mois
            </div>
          );
        })()}

        {/* Price badge */}
        {PRICE_HIDDEN.has(bien.id) ? (
          <div style={{
            position: "absolute", bottom: 14, right: 14, zIndex: 2,
            background: "rgba(14,59,58,0.85)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "8px 14px", textAlign: "right",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.04em", fontFamily: "'Jost', sans-serif" }}>{t("longTermShort")}</div>
          </div>
        ) : (() => {
          const airbnbNuit = Math.round(minPrix * 1.15);
          const economieSemaine = Math.round(minPrix * 7 * 0.15 / 5) * 5; // arrondi à 5€
          return (
            <div style={{
              position: "absolute", bottom: 14, right: 14, zIndex: 2,
              background: "rgba(14,59,58,0.85)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "8px 14px", textAlign: "right",
            }}>
              <div style={{ fontSize: 11, color: "rgba(250,247,242,0.5)", marginBottom: 1, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.05em" }}>{t("from")}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{minPrix}€</div>
              <div style={{ fontSize: 11, color: "rgba(250,247,242,0.45)", textDecoration: "line-through", marginBottom: 2 }}>≈ {airbnbNuit}€ Airbnb</div>
              <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 600, fontFamily: "'Jost', sans-serif", letterSpacing: "0.04em" }}>
                −{economieSemaine}€ / semaine
              </div>
            </div>
          );
        })()}
      </div>

      {/* Info section */}
      <div style={{ padding: "20px 22px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Location */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: CORAL, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
          {bien.lieu}
        </div>

        {/* Name */}
        <div
          onClick={e => { e.stopPropagation(); onDetail(bien); }}
          style={{ fontWeight: 800, fontSize: 21, color: NAVY, marginBottom: 10, cursor: "pointer", transition: "color 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.color = CORAL; }}
          onMouseLeave={e => { e.currentTarget.style.color = NAVY; }}
        >{bien.nom}</div>

        {/* Rating row */}
        {bien.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: MUTED }}>
            <span style={{ color: GOLD }}>★ {bien.rating}</span>
            <span>·</span>
            {bien.reviews && <span>{bien.reviews} {t("reviewsLabel")}</span>}
            <span>·</span>
            <span>{bien.capacite} {t("guests")}</span>
            <span>·</span>
            <span>{bien.lits} lit{bien.lits > 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Description */}
        <p style={{
          color: MUTED, fontSize: 13, lineHeight: 1.65,
          margin: "0 0 14px",
          flex: 1,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{lang === "fr" ? bien.desc : (bien.descEn || bien.desc)}</p>

        {/* Amenities */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {(lang === "fr" ? bien.amenities : (bien.amenitiesEn || bien.amenities)).map(a => (
            <span key={a} style={{
              background: CREAM,
              border: `1px solid ${SAND}`,
              borderRadius: 5, fontSize: 11, color: MUTED, padding: "3px 8px",
            }}>{a}</span>
          ))}
        </div>

        {/* CTA row */}
        <div style={{ display: "flex", gap: 8 }}>
          {onToggleCompare && (
            <button
              onClick={e => { if (!compareDisabled) onToggleCompare(e, bien.id); else e.stopPropagation(); }}
              title={isCompared ? "Retirer de la comparaison" : compareDisabled ? "Maximum 3 logements atteint" : "Ajouter à la comparaison"}
              disabled={compareDisabled && !isCompared}
              style={{
                flexShrink: 0, width: 36, height: 36,
                background: isCompared ? NAVY : "transparent",
                border: `1px solid ${isCompared ? NAVY : compareDisabled ? "#e0d4bc55" : SAND}`,
                borderRadius: 6, cursor: compareDisabled && !isCompared ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, transition: "all 0.15s",
                color: isCompared ? "#fff" : compareDisabled ? "#c4b89a66" : MUTED,
                opacity: compareDisabled && !isCompared ? 0.45 : 1,
              }}
              onMouseEnter={e => { if (!isCompared && !compareDisabled) e.currentTarget.style.borderColor = NAVY; }}
              onMouseLeave={e => { if (!isCompared && !compareDisabled) e.currentTarget.style.borderColor = SAND; }}
            >
              {isCompared ? "✓" : "⊕"}
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDetail(bien); }}
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${SAND}`,
              color: NAVY,
              borderRadius: 6,
              padding: "11px 14px",
              fontFamily: "'Jost', sans-serif",
              fontWeight: 300,
              fontSize: 12,
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "border-color 0.2s",
              textTransform: "uppercase",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = SAND; }}
          >
            {t("viewMore")}
          </button>
          {BOOKING_DISABLED.has(bien.id) ? (
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Bonjour, je suis intéressé(e) par Villa Iguana pour une location longue durée à Sainte-Luce, Martinique. Pouvez-vous m'indiquer vos conditions et disponibilités ? Merci.")}`}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                flex: 2, background: NAVY, border: "none", color: "#faf5e9",
                borderRadius: 6, padding: "11px 20px",
                fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12,
                letterSpacing: "0.08em", cursor: "pointer",
                textTransform: "uppercase", textAlign: "center", textDecoration: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              Contact →
            </a>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); if (window.gtag) window.gtag("event", "select_item", { item_list_id: "villas", items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix || 0, currency: "EUR" }] }); onBook(bien); }}
              style={{
                flex: 2, background: CORAL, border: "none", color: "#fff",
                borderRadius: 6, padding: "11px 20px",
                fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12,
                letterSpacing: "0.08em", cursor: "pointer", transition: "opacity 0.2s",
                textTransform: "uppercase",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {t("book")}
            </button>
          )}
        </div>
        {!BOOKING_DISABLED.has(bien.id) && (
          <div style={{ marginTop: 8, fontSize: 11, color: MUTED, textAlign: "center", fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.02em" }}>
            {t("banner1")}
          </div>
        )}
        {BOOKING_DISABLED.has(bien.id) && (
          <div style={{ marginTop: 8, fontSize: 11, color: MUTED, textAlign: "center", fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.02em" }}>
            {t("longTermOnly")}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontSize: 13 }}>
      <span>{icon}</span> {label}
    </div>
  );
}

// ── Property Detail (full-screen) ───────────────────────────────
function PropertyDetail({ bien, onClose, onBook, blockedDates = [], loadingAvail = false, isPage = false }) {
  useMinNights(); // re-render when admin changes min nights
  const { t, lang } = useLang();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFull, setShowFull] = useState(false);
  const [calCheckin, setCalCheckin] = useState(null);
  const [calCheckout, setCalCheckout] = useState(null);
  const [calHovered, setCalHovered] = useState(null);
  const [calOffset, setCalOffset] = useState(0);
  const [showAlerte, setShowAlerte] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const infoPanelRef = useRef(null);
  const photos = bien.photos || [];
  const touchStartXDetail = useRef(null);

  function onDetailTouchStart(e) { touchStartXDetail.current = e.touches[0].clientX; }
  function onDetailTouchEnd(e) {
    if (touchStartXDetail.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXDetail.current;
    if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); }
    touchStartXDetail.current = null;
  }

  // Prix journaliers — réactifs (se mettent à jour si l'admin sync les prix)
  const [dailyPricesMap, setDailyPricesMap] = useState(() => {
    try { return loadDailyPrices()[bien.id] || {}; } catch { return {}; }
  });
  const [gapDates, setGapDates] = useState({}); // { date: discountPct }

  useEffect(() => {
    const refresh = () => {
      try { setDailyPricesMap(loadDailyPrices()[bien.id] || {}); } catch {}
    };
    const storageRefresh = (e) => { if (!e.key || e.key === "amaryllis_prices") refresh(); };
    window.addEventListener("amaryllis_prices_updated", refresh); // même onglet
    window.addEventListener("storage", storageRefresh);           // autres onglets
    return () => {
      window.removeEventListener("amaryllis_prices_updated", refresh);
      window.removeEventListener("storage", storageRefresh);
    };
  }, [bien.id]);

  // Récupérer les remises gap depuis le worker (trous de calendrier)
  useEffect(() => {
    fetch("https://amaryllis-ical-sync.vinsmaf.workers.dev/gap-prices")
      .then(r => r.json())
      .then(data => {
        const bienGaps = data[bien.id] || {};
        if (Object.keys(bienGaps).length > 0) {
          setGapDates(bienGaps);
          setDailyPricesMap(prev => {
            const base = { ...prev };
            const seed = (() => { try { return loadDailyPrices()[bien.id] || {}; } catch { return {}; } })();
            for (const [date, pct] of Object.entries(bienGaps)) {
              const basePrice = seed[date] ?? bien.prix;
              base[date] = Math.round(basePrice * (1 - pct / 100));
            }
            return base;
          });
        }
      })
      .catch(() => {});
  }, [bien.id, bien.prix]);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Calcul prix sélection calendrier (utilisé top bar + corps) ──
  const calNights = calCheckin && calCheckout ? dateDiff(calCheckin, calCheckout) : 0;
  const calRawTotal = useMemo(() => {
    if (!calNights || !calCheckin) return 0;
    let sum = 0, cur = calCheckin;
    for (let i = 0; i < calNights; i++) { sum += dailyPricesMap[cur] ?? bien.prix; cur = addDays(cur, 1); }
    return sum;
  }, [calNights, calCheckin, dailyPricesMap, bien.prix]);
  const calDiscountRate   = getDiscount(calNights);
  const calDiscountAmount = calDiscountRate > 0 ? Math.round(calRawTotal * calDiscountRate) : 0;
  const calFrais  = FRAIS_MENAGE[bien.id] ?? 0;
  const calTotal  = calRawTotal - calDiscountAmount + calFrais;
  const calBelowMin = calNights > 0 && calNights < getMinNights(bien.id, calCheckin);

  const goPrev = useCallback(() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const goNext = useCallback(() => setPhotoIdx(i => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") {
        if (lightboxOpen) setLightboxOpen(false);
        else onClose();
      }
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, lightboxOpen, goPrev, goNext]);

  // Auto-avance 5 s — reset à chaque changement de photo, pause en lightbox
  useEffect(() => {
    if (photos.length <= 1 || lightboxOpen) return;
    const t = setInterval(goNext, 5000);
    return () => clearInterval(t);
  }, [photoIdx, photos.length, lightboxOpen, goNext]);

  useEffect(() => {
    if (isPage) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isPage]);

  // Sticky bar scroll listener
  useEffect(() => {
    const panel = infoPanelRef.current;
    if (!panel) return;
    const handler = () => setShowStickyBar(panel.scrollTop > 200);
    panel.addEventListener("scroll", handler, { passive: true });
    return () => panel.removeEventListener("scroll", handler);
  }, []);

  const arrowBtn = (label, fn) => (
    <button key={label} aria-label={label === "←" ? "Photo précédente" : "Photo suivante"} onClick={e => { e.stopPropagation(); fn(); }} style={{
      pointerEvents: "auto",
      background: "rgba(250,245,233,0.18)", backdropFilter: "blur(8px)",
      border: "1px solid rgba(250,245,233,0.35)", color: "#faf5e9",
      width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
      fontSize: 20, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
      lineHeight: 1, flexShrink: 0,
    }}>{label}</button>
  );

  return (
    <div style={{
      ...(isPage
        ? { position: "relative", height: "100dvh" }
        : { position: "fixed", inset: 0, zIndex: 900, animation: "slideUpFull 0.38s cubic-bezier(0.23,1,0.32,1) both" }
      ),
      background: IVORY,
      display: "flex", flexDirection: "column",
    }}>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          onTouchStart={onDetailTouchStart}
          onTouchEnd={onDetailTouchEnd}
          style={{
            position: "fixed", inset: 0, zIndex: 1100,
            background: "rgba(0,0,0,0.96)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {photos[photoIdx] && (
            <img
              src={photos[photoIdx]}
              alt={`${bien.nom} — ${bien.lieu} — photo ${photoIdx + 1}`}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block", userSelect: "none" }}
            />
          )}
          {/* Close */}
          <button
            aria-label="Fermer"
            onClick={() => setLightboxOpen(false)}
            style={{
              position: "absolute", top: 18, right: 20,
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", width: 44, height: 44, borderRadius: "50%",
              cursor: "pointer", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
          {/* Counter */}
          <div style={{
            position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.55)", fontSize: 12,
            fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.1em",
            background: "rgba(0,0,0,0.4)", padding: "4px 14px", borderRadius: 20,
          }}>
            {photoIdx + 1} / {photos.length}
          </div>
          {/* Arrows */}
          {photos.length > 1 && (
            <>
              <button aria-label="Photo précédente" onClick={e => { e.stopPropagation(); goPrev(); }} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", width: 52, height: 52, borderRadius: "50%", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
              <button aria-label="Photo suivante" onClick={e => { e.stopPropagation(); goNext(); }} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", width: 52, height: 52, borderRadius: "50%", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
            </>
          )}
        </div>
      )}

      {/* Top bar */}
      <div style={{
        height: 56, background: NAVY, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", gap: 12,
      }}>
        {isPage ? (
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(250,245,233,0.7)", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, letterSpacing: "0.1em", textDecoration: "none", flexShrink: 0 }}>← Accueil</a>
        ) : (
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "rgba(250,245,233,0.7)", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, letterSpacing: "0.1em", padding: 0, flexShrink: 0 }}>← Retour</button>
        )}
        <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: isMobile ? 11 : 13, letterSpacing: isMobile ? "0.2em" : "0.45em", color: "#faf5e9", textTransform: "uppercase", flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {bien.nom}
        </div>
        {isPage && !PRICE_HIDDEN.has(bien.id) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, padding: "3px 10px", flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>✓ -15% DIRECT</span>
          </div>
        )}
        {typeof navigator !== "undefined" && (
          <button
            aria-label="Partager"
            onClick={async () => {
              const url = `https://villamaryllis.com/${bien.id}`;
              if (navigator.share) {
                try { await navigator.share({ title: bien.nom, text: bien.desc?.slice(0, 100), url }); } catch {}
              } else {
                try {
                  await navigator.clipboard.writeText(url);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                } catch {}
              }
            }}
            style={{ background: "none", border: `1px solid rgba(250,245,233,0.22)`, borderRadius: 8, padding: isMobile ? "6px 10px" : "7px 14px", fontFamily: "'Jost', sans-serif", fontSize: 11, color: "rgba(250,245,233,0.7)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap", transition: "border-color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.22)"; }}
          >
            {shareCopied ? "✓ Copié !" : "📤 Partager"}
          </button>
        )}
        {!BOOKING_DISABLED.has(bien.id) ? (
          <button
            onClick={() => calCheckin && calCheckout && !calBelowMin ? onBook(bien, calCheckin, calCheckout) : onBook(bien)}
            style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 5, padding: isMobile ? "8px 14px" : "9px 22px", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12, letterSpacing: "0.12em", cursor: "pointer", textTransform: "uppercase", flexShrink: 0, whiteSpace: "nowrap" }}
          >
            {calCheckin && calCheckout && !calBelowMin
              ? `${calNights} nuits · ${calTotal}€`
              : isMobile ? `${bien.prix}€/nuit` : `À partir de ${bien.prix}€/nuit`}
          </button>
        ) : (
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour, je suis intéressé par ${bien.nom} pour un séjour longue durée.`)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ background: "transparent", color: IVORY, border: `1px solid rgba(250,245,233,0.3)`, borderRadius: 5, padding: isMobile ? "8px 14px" : "9px 22px", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12, letterSpacing: "0.12em", cursor: "pointer", textTransform: "uppercase", flexShrink: 0, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Contact →
          </a>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div ref={infoPanelRef} style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

        {/* ── Sticky mini-bar — appears after scrolling 200px ── */}
        {showStickyBar && !BOOKING_DISABLED.has(bien.id) && !bien.beds24Url && (
          <div style={{ position: "sticky", top: 0, zIndex: 50, background: IVORY, borderBottom: `1px solid ${SAND}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", animation: "fadeIn 0.2s ease" }}>
            <div>
              <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Jost', sans-serif", fontSize: 14 }}>{bien.nom}</span>
              {!PRICE_HIDDEN.has(bien.id) && (
                <>
                  <span style={{ marginLeft: 12, color: CORAL, fontWeight: 700, fontSize: 14 }}>{bien.prix}€</span>
                  <span style={{ color: MUTED, fontSize: 11, marginLeft: 4 }}>/nuit</span>
                </>
              )}
            </div>
            <button onClick={() => onBook(bien)} style={{ background: CORAL, border: "none", color: "#fff", borderRadius: 8, padding: "9px 20px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer", letterSpacing: "0.05em" }}>
              Réserver →
            </button>
          </div>
        )}

        {/* ── PHOTO SECTION ── */}
        {isMobile ? (
          /* Mobile: carousel */
          <div style={{ position: "relative", height: "min(70vw, 380px)", background: "#061616", flexShrink: 0 }}>
            <div
              onClick={() => photos.length > 0 && setLightboxOpen(true)}
              onTouchStart={onDetailTouchStart}
              onTouchEnd={onDetailTouchEnd}
              style={{ position: "absolute", inset: 0, cursor: "zoom-in" }}
            >
              {photos[photoIdx] && (
                <img
                  key={photoIdx}
                  src={photos[photoIdx]}
                  alt={`${bien.nom} — ${bien.lieu} — photo ${photoIdx + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>
            {/* Compteur */}
            <div style={{ position: "absolute", bottom: 12, right: 14, background: "rgba(14,59,58,0.65)", color: "#faf5e9", fontSize: 11, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 20, zIndex: 2 }}>
              {photoIdx + 1} / {photos.length}
            </div>
            {/* Arrows */}
            {photos.length > 1 && (
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", display: "flex", justifyContent: "space-between", padding: "0 14px", zIndex: 10, pointerEvents: "none" }}>
                {[["←", goPrev], ["→", goNext]].map(([label, fn]) => arrowBtn(label, fn))}
              </div>
            )}
          </div>
        ) : (
          /* Desktop: mosaic */
          <div style={{ position: "relative", display: "flex", height: "clamp(380px, 52vh, 560px)", gap: 4, background: "#061616", flexShrink: 0 }}>
            {/* Grande photo gauche */}
            <div
              style={{ flex: "0 0 60%", position: "relative", cursor: "zoom-in", overflow: "hidden" }}
              onClick={() => { setPhotoIdx(0); setLightboxOpen(true); }}
            >
              {photos[0] && (
                <img
                  src={photos[0]}
                  alt={`${bien.nom} — photo principale`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                />
              )}
              {/* Overlay gradient + titre sur la grande photo */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 32px", pointerEvents: "none" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>{bien.lieu}</div>
                <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 3vw, 42px)", letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", margin: "0 0 10px", lineHeight: 1.1 }}>{bien.nom}</h2>
                {bien.rating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#fff", fontFamily: "'Jost', sans-serif", fontWeight: 500 }}>★ {bien.rating} · {bien.reviews} avis</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "'Jost', sans-serif" }}>{bien.capacite} voyageurs · {bien.chambres} chambres</span>
                    {bien.tag && <span style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "rgba(255,255,255,0.85)", fontFamily: "'Jost', sans-serif" }}>{bien.tag}</span>}
                  </div>
                )}
              </div>
            </div>
            {/* Grille 2×2 droite */}
            <div style={{ flex: "0 0 40%", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 4 }}>
              {[1, 2, 3, 4].map(idx => (
                photos[idx] ? (
                  <div
                    key={idx}
                    style={{ position: "relative", overflow: "hidden", cursor: "zoom-in" }}
                    onClick={() => { setPhotoIdx(idx); setLightboxOpen(true); }}
                  >
                    <img
                      src={photos[idx]}
                      alt={`${bien.nom} — photo ${idx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                    />
                  </div>
                ) : (
                  <div key={idx} style={{ background: "#0a2424" }} />
                )
              ))}
            </div>
            {/* Bouton "Voir toutes les photos" */}
            <button
              onClick={() => setLightboxOpen(true)}
              style={{
                position: "absolute", bottom: 16, right: 16,
                background: "rgba(0,0,0,0.62)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8,
                color: "#fff", padding: "9px 18px",
                fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12,
                letterSpacing: "0.08em", cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.82)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.62)"; }}
            >
              📷 Voir toutes les photos ({photos.length})
            </button>
          </div>
        )}

        {/* ── Content area ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", gap: 56, alignItems: "flex-start" }}>

          {/* ── Left column ── */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 32, paddingBottom: 64 }}>

            {/* Location + titre — masqués sur desktop (déjà dans l'overlay photo) */}
            {isMobile && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>
                  {bien.lieu}
                </div>
                <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.1em", textTransform: "uppercase", color: NAVY, margin: "0 0 14px", lineHeight: 1.1 }}>
                  {bien.nom}
                </h2>
              </>
            )}

            {/* Rating + stats — masqués sur desktop (déjà dans l'overlay photo) */}
            {bien.rating && isMobile && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", color: MUTED, fontSize: 13, marginBottom: 22 }}>
                <span style={{ color: GOLD }}>★ {bien.rating}</span>
                {bien.reviews && <span>· {bien.reviews} {t("reviewsLabel")}</span>}
                <span>· {bien.capacite} {t("guests")}</span>
                <span>· {bien.chambres} {t("rooms")}</span>
                <span>· {bien.sdb} sdb</span>
              </div>
            )}

            {/* Stats bar — desktop uniquement (titre déjà dans l'overlay photo) */}
            {!isMobile && bien.rating && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", color: MUTED, fontSize: 13, marginBottom: 22, paddingBottom: 22, borderBottom: `1px solid ${SAND}` }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>★ {bien.rating}</span>
                {bien.reviews && <span>· {bien.reviews} {t("reviewsLabel")}</span>}
                <span>· {bien.capacite} {t("guests")}</span>
                <span>· {bien.chambres} {t("rooms")}</span>
                <span>· {bien.sdb} sdb</span>
              </div>
            )}

            {isMobile && <div style={{ height: 1, background: SAND, marginBottom: 26 }} />}

            {/* Description */}
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 17 : 19, fontWeight: 400, lineHeight: 1.85, color: TEXT, margin: 0 }}>
                {lang === "fr" ? bien.desc : (bien.descEn || bien.desc)}
              </p>

              {bien.descFull && showFull && (
                <div style={{ marginTop: 32 }}>
                  {/* Decorative separator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
                    <div style={{ flex: 1, height: 1, background: SAND }} />
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: bien.couleur || MUTED, opacity: 0.6 }} />
                    <div style={{ width: 3, height: 3, borderRadius: "50%", background: SAND }} />
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: bien.couleur || MUTED, opacity: 0.6 }} />
                    <div style={{ flex: 1, height: 1, background: SAND }} />
                  </div>

                  {/* Narrative sections */}
                  {bien.descFull.filter(s => !s.items).map((s, i) => (
                    <div key={i} style={{ marginBottom: 26, paddingLeft: 18, borderLeft: s.titre ? `2px solid ${(bien.couleur || "#8a7a6a")}28` : "2px solid transparent" }}>
                      {s.titre && (
                        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, letterSpacing: "0.42em", textTransform: "uppercase", color: bien.couleur || MUTED, fontWeight: 600, marginBottom: 9 }}>{s.titre}</div>
                      )}
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 15 : 17, fontWeight: 400, lineHeight: 1.8, color: TEXT, margin: 0 }}>{s.texte}</p>
                    </div>
                  ))}

                  {/* Informations pratiques */}
                  {bien.descFull.find(s => s.items) && (
                    <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 8, padding: isMobile ? "20px 18px" : "24px 28px", marginTop: 12 }}>
                      <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, letterSpacing: "0.42em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 20 }}>
                        {bien.descFull.find(s => s.items).titre || "Informations pratiques"}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "14px 0" : "16px 40px" }}>
                        {bien.descFull.find(s => s.items).items.map((it, j) => (
                          <div key={j}>
                            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, marginBottom: 5 }}>{it.label}</div>
                            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: TEXT, lineHeight: 1.65 }}>{it.texte}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Toggle */}
              {bien.descFull && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24 }}>
                  <div style={{ flex: 1, height: 1, background: SAND }} />
                  <button
                    onClick={() => setShowFull(v => !v)}
                    style={{ background: "none", border: `1px solid ${SAND}`, borderRadius: 4, padding: "7px 20px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = SAND; e.currentTarget.style.color = MUTED; }}
                  >
                    {showFull ? "Réduire" : "Lire la suite"}
                  </button>
                  <div style={{ flex: 1, height: 1, background: SAND }} />
                </div>
              )}
            </div>

            {/* Amenities */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 14 }}>{lang === "fr" ? "Équipements" : "Amenities"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(lang === "fr" ? bien.amenities : (bien.amenitiesEn || bien.amenities)).map(a => (
                  <span key={a} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 4, fontSize: 12, color: TEXT, padding: "6px 14px", fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>{a}</span>
                ))}
              </div>
            </div>

            {/* Disponibilités — always in left column (mobile: always; desktop: if booking enabled) */}
            {!BOOKING_DISABLED.has(bien.id) && !bien.beds24Url && (() => {
              const minNights = getMinNights(bien.id, calCheckin);
              const calNightsLocal = calCheckin && calCheckout ? dateDiff(calCheckin, calCheckout) : 0;
              const calBelowMinLocal = calNightsLocal > 0 && calNightsLocal < minNights;
              const now = new Date();
              const baseY = now.getFullYear(), baseM = now.getMonth();
              const y1 = baseY + Math.floor((baseM + calOffset) / 12);
              const m1 = (baseM + calOffset) % 12;
              const y2 = baseY + Math.floor((baseM + calOffset + 1) / 12);
              const m2 = (baseM + calOffset + 1) % 12;

              const handleSelect = (ds) => {
                if (!calCheckin || (calCheckin && calCheckout)) {
                  setCalCheckin(ds); setCalCheckout(null);
                } else if (ds <= calCheckin) {
                  setCalCheckin(ds); setCalCheckout(null);
                } else {
                  const n = Math.round((new Date(ds) - new Date(calCheckin)) / 86400000);
                  if (n < minNights) return;
                  let cur = addDays(calCheckin, 1);
                  let blocked = false;
                  while (cur < ds) { if (blockedDates.includes(cur)) { blocked = true; break; } cur = addDays(cur, 1); }
                  setCalCheckout(blocked ? null : ds);
                  if (blocked) setCalCheckin(ds);
                }
                setCalHovered(null);
              };

              const calendarBlock = (
                <>
                  {/* Instruction / résumé dates */}
                  <div style={{ fontSize: 12, color: MUTED, fontFamily: "'Jost', sans-serif", marginBottom: 12 }}>
                    {!calCheckin
                      ? `Cliquez sur une date d'arrivée${minNights > 1 ? ` (séjour min. ${minNights} nuits)` : ""}`
                      : !calCheckout
                        ? "Cliquez sur une date de départ"
                        : `${formatDateShort(calCheckin)} → ${formatDateShort(calCheckout)}`}
                  </div>

                  {/* Navigation ‹ › */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <button aria-label="Mois précédent" onClick={() => setCalOffset(o => Math.max(0, o - 1))} style={{ ...iconBtn, opacity: calOffset > 0 ? 1 : 0.2 }}>‹</button>
                    <button aria-label="Mois suivant" onClick={() => setCalOffset(o => Math.min(o + 1, 20))} style={iconBtn}>›</button>
                  </div>

                  {/* Calendriers */}
                  <div style={{ display: "flex", gap: isMobile ? 0 : 24, flexDirection: isMobile ? "column" : "row", flexWrap: "wrap" }}>
                    {[{ year: y1, month: m1 }, { year: y2, month: m2 }].map(({ year, month }) => (
                      <CalendarMonth
                        key={`${year}-${month}`}
                        year={year} month={month}
                        checkin={calCheckin} checkout={calCheckout} hovered={calHovered}
                        blockedDates={blockedDates}
                        minNights={minNights}
                        dailyPricesMap={dailyPricesMap}
                        basePrice={bien.prix}
                        onSelect={handleSelect}
                        onHover={setCalHovered}
                        gapDates={gapDates}
                      />
                    ))}
                  </div>

                  {/* Légende disponibilité */}
                  <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif" }}>
                      <span style={{ width: 22, height: 22, background: "#fff", border: `1px solid ${SAND}`, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: NAVY, fontWeight: 500 }}>8</span>
                      Disponible
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif" }}>
                      <span style={{ width: 22, height: 22, background: "#f0ebe3", border: `1px solid ${SAND}`, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#bbb", fontWeight: 400, textDecoration: "line-through" }}>8</span>
                      Indisponible
                    </span>
                  </div>

                  {/* Alerte disponibilité */}
                  <div style={{ marginTop: 14 }}>
                    <button onClick={() => setShowAlerte(true)} style={{ background: "none", border: "none", color: MUTED, fontSize: 11, fontFamily: "'Jost', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0, textDecoration: "underline", textDecorationColor: SAND }}>
                      🔔 Être alerté des disponibilités
                    </button>
                  </div>

                  {calBelowMinLocal && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
                      ⚠ Séjour minimum : {minNights} nuits pour ce logement
                    </div>
                  )}
                </>
              );

              /* On mobile, show full calendar + price summary in left column.
                 On desktop, show ONLY the calendar section (price summary lives in sticky widget). */
              return (
                <>
                  <div style={{ height: 1, background: SAND, marginBottom: 26 }} />
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 14 }}>{lang === "fr" ? "Disponibilités" : "Availability"}</div>
                    {loadingAvail ? (
                      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                        {[0,1].map(col => (
                          <div key={col} style={{ flex: "1 1 200px" }}>
                            <div className="skeleton" style={{ height: 16, width: 120, margin: "0 auto 14px" }} />
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                              {Array.from({ length: 35 }, (_, i) => (
                                <div key={i} className="skeleton" style={{ height: 30, opacity: 0.4 + (i % 7) * 0.1 }} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : calendarBlock}

                    {/* Price summary — mobile only (desktop has sticky widget) */}
                    {isMobile && calCheckin && calCheckout && !calBelowMinLocal && (
                      <div style={{ marginTop: 18, background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "16px 20px" }}>
                        <div style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>
                          {calNights} nuit{calNights > 1 ? "s" : ""} — sous-total {calRawTotal}€
                        </div>
                        {calFrais > 0 && (
                          <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>🧹 Frais de ménage {calFrais}€</div>
                        )}
                        {calDiscountRate > 0 && (
                          <div style={{ fontSize: 13, color: CORAL, fontWeight: 600, marginBottom: 4 }}>
                            🎁 Réduction {discountLabel(calNights)} −{calDiscountAmount}€ (−{Math.round(calDiscountRate * 100)}%)
                          </div>
                        )}
                        <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginTop: 8, marginBottom: 6 }}>
                          Total : {calTotal}€
                        </div>
                        <div style={{ fontSize: 11, color: "#16a34a", fontFamily: "'Jost', sans-serif", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 5 }}>
                          💰 Vous économisez ~{Math.round(calTotal * 0.15 / 5) * 5}€ vs Airbnb en réservant en direct
                        </div>
                        <button
                          onClick={() => onBook(bien, calCheckin, calCheckout)}
                          style={{ width: "100%", background: CORAL, border: "none", color: "#fff", borderRadius: 8, padding: "12px 0", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 14px rgba(196,114,84,0.3)" }}
                        >
                          Réserver ces dates →
                        </button>
                        <button
                          onClick={() => { setCalCheckin(null); setCalCheckout(null); }}
                          style={{ display: "block", margin: "10px auto 0", fontSize: 11, color: MUTED, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                        >
                          Effacer les dates
                        </button>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Localisation */}
            {bien.coords && (
              <>
                <div style={{ height: 1, background: SAND, marginBottom: 26 }} />
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 14 }}>Localisation</div>
                  <div style={{ fontSize: 13, color: TEXT, fontFamily: "'Jost', sans-serif", fontWeight: 300, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: CORAL }}>📍</span> {bien.lieu}
                    <span style={{ color: SAND, fontSize: 11, marginLeft: 4 }}>· Position approximative</span>
                  </div>
                  <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${SAND}`, lineHeight: 0 }}>
                    <iframe
                      title={`Carte ${bien.nom}`}
                      src={bien.mapsEmbed || `https://maps.google.com/maps?q=${bien.coords.lat},${bien.coords.lng}&z=14&output=embed`}
                      width="100%"
                      height={isMobile ? "220" : "280"}
                      style={{ border: 0, display: "block" }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${bien.coords.lat},${bien.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: CORAL, fontFamily: "'Jost', sans-serif", fontWeight: 400, letterSpacing: "0.06em", textDecoration: "none" }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                  >
                    Voir sur Google Maps →
                  </a>
                </div>
              </>
            )}

            {/* Avis voyageurs */}
            {bien.avis && bien.avis.length > 0 && (
              <>
                <div style={{ height: 1, background: SAND, marginBottom: 26 }} />
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 18 }}>
                    Avis voyageurs · ★ {bien.rating} · {bien.reviews} avis Airbnb
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {bien.avis.map((a, i) => (
                      <div key={i} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", color: IVORY, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                            {a.nom[0]}
                          </div>
                          <div>
                            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: NAVY }}>{a.nom} {a.pays}</div>
                            <div style={{ fontSize: 11, color: GOLD }}>{"★".repeat(a.note)} <span style={{ color: MUTED, fontWeight: 300 }}>{a.date}</span></div>
                          </div>
                        </div>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, lineHeight: 1.7, color: TEXT, margin: 0, fontStyle: "italic" }}>"{a.texte}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Reviews Google — Villa Amaryllis uniquement */}
            {bien.id === "amaryllis" && (
              <>
                <div style={{ height: 1, background: SAND, marginBottom: 26 }} />
                <GoogleReviews compact />
              </>
            )}

            {/* Bottom CTA */}
            <div style={{ height: 1, background: SAND, margin: "36px 0 28px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                {PRICE_HIDDEN.has(bien.id) ? (
                  <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 16, color: NAVY }}>{t("longTermShort")}</div>
                ) : (
                  <>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: MUTED, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>{t("from")}</div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 36, color: NAVY, lineHeight: 1 }}>
                      {bien.prix}€<span style={{ fontSize: 14, fontWeight: 300, color: MUTED, marginLeft: 6 }}>{t("perNight")}</span>
                    </div>
                  </>
                )}
                {bien.rating && (
                  <div style={{ color: MUTED, fontSize: 12, marginTop: 4, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>★ {bien.rating} · {bien.reviews} {t("reviewsAirbnb")}</div>
                )}
              </div>
              {!BOOKING_DISABLED.has(bien.id) ? (
                <button
                  onClick={() => onBook(bien)}
                  style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 6, padding: "16px 40px", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 13, letterSpacing: "0.12em", cursor: "pointer", textTransform: "uppercase" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  {t("book")} →
                </button>
              ) : (
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour, je suis intéressé par ${bien.nom} pour un séjour longue durée.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ background: NAVY, color: IVORY, border: "none", borderRadius: 6, padding: "16px 32px", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 13, letterSpacing: "0.12em", cursor: "pointer", textTransform: "uppercase", textDecoration: "none" }}
                >
                  Contacter →
                </a>
              )}
            </div>
          </div>

          {/* ── Right column: sticky booking widget (desktop only) ── */}
          {!isMobile && !BOOKING_DISABLED.has(bien.id) && !bien.beds24Url && (
            <div style={{ width: 380, flexShrink: 0, position: "sticky", top: 24, alignSelf: "flex-start", paddingTop: 40, paddingBottom: 40 }}>
              <div style={{
                background: IVORY, border: `1px solid ${SAND}`, borderRadius: 16,
                boxShadow: "0 8px 40px rgba(14,40,58,0.10), 0 2px 8px rgba(14,40,58,0.06)",
                overflow: "hidden",
              }}>
                {/* Widget header */}
                <div style={{ padding: "24px 24px 20px" }}>
                  {!PRICE_HIDDEN.has(bien.id) && (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 30, color: NAVY, lineHeight: 1 }}>{bien.prix}€</span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: MUTED }}>/nuit</span>
                    </div>
                  )}
                  {bien.rating && (
                    <div style={{ fontSize: 12, color: MUTED, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
                      <span style={{ color: GOLD }}>★ {bien.rating}</span>
                      {bien.reviews && <span style={{ marginLeft: 6 }}>· {bien.reviews} avis</span>}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: SAND }} />

                {/* Mini calendar */}
                <div style={{ padding: "20px 16px 16px" }}>
                  {loadingAvail ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[120, 80, 100].map((w, i) => (
                        <div key={i} className="skeleton" style={{ height: 14, width: w, margin: "0 auto" }} />
                      ))}
                    </div>
                  ) : (() => {
                    const minNights = getMinNights(bien.id, calCheckin);
                    const calBelowMinLocal = calNights > 0 && calNights < minNights;
                    const now = new Date();
                    const baseY = now.getFullYear(), baseM = now.getMonth();
                    const y1 = baseY + Math.floor((baseM + calOffset) / 12);
                    const m1 = (baseM + calOffset) % 12;

                    const handleSelect = (ds) => {
                      if (!calCheckin || (calCheckin && calCheckout)) {
                        setCalCheckin(ds); setCalCheckout(null);
                      } else if (ds <= calCheckin) {
                        setCalCheckin(ds); setCalCheckout(null);
                      } else {
                        const n = Math.round((new Date(ds) - new Date(calCheckin)) / 86400000);
                        if (n < minNights) return;
                        let cur = addDays(calCheckin, 1);
                        let blocked = false;
                        while (cur < ds) { if (blockedDates.includes(cur)) { blocked = true; break; } cur = addDays(cur, 1); }
                        setCalCheckout(blocked ? null : ds);
                        if (blocked) setCalCheckin(ds);
                      }
                      setCalHovered(null);
                    };

                    return (
                      <>
                        {/* Instruction */}
                        <div style={{ fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif", marginBottom: 10, textAlign: "center" }}>
                          {!calCheckin
                            ? `Choisissez vos dates${minNights > 1 ? ` (min. ${minNights} nuits)` : ""}`
                            : !calCheckout
                              ? "Date de départ ?"
                              : `${formatDateShort(calCheckin)} → ${formatDateShort(calCheckout)}`}
                        </div>
                        {/* Nav */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <button aria-label="Mois précédent" onClick={() => setCalOffset(o => Math.max(0, o - 1))} style={{ ...iconBtn, opacity: calOffset > 0 ? 1 : 0.2 }}>‹</button>
                          <button aria-label="Mois suivant" onClick={() => setCalOffset(o => Math.min(o + 1, 20))} style={iconBtn}>›</button>
                        </div>
                        {/* Single month in widget */}
                        <CalendarMonth
                          key={`widget-${y1}-${m1}`}
                          year={y1} month={m1}
                          checkin={calCheckin} checkout={calCheckout} hovered={calHovered}
                          blockedDates={blockedDates}
                          minNights={minNights}
                          dailyPricesMap={dailyPricesMap}
                          basePrice={bien.prix}
                          onSelect={handleSelect}
                          onHover={setCalHovered}
                        />
                        {calBelowMinLocal && (
                          <div style={{ marginTop: 8, fontSize: 11, color: "#ef4444", fontWeight: 600, textAlign: "center" }}>
                            ⚠ Séjour min. {minNights} nuits
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Price summary — shown when dates selected */}
                {calCheckin && calCheckout && calNights > 0 && (() => {
                  const minNights = getMinNights(bien.id, calCheckin);
                  const calBelowMinLocal = calNights > 0 && calNights < minNights;
                  if (calBelowMinLocal) return null;
                  return (
                    <>
                      <div style={{ height: 1, background: SAND }} />
                      <div style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, marginBottom: 6 }}>
                          <span>{bien.prix}€ × {calNights} nuit{calNights > 1 ? "s" : ""}</span>
                          <span>{calRawTotal}€</span>
                        </div>
                        {calFrais > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, marginBottom: 6 }}>
                            <span>🧹 Ménage</span><span>{calFrais}€</span>
                          </div>
                        )}
                        {calDiscountRate > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: CORAL, fontWeight: 600, marginBottom: 6 }}>
                            <span>🎁 {discountLabel(calNights)}</span><span>−{calDiscountAmount}€</span>
                          </div>
                        )}
                        <div style={{ height: 1, background: SAND, margin: "10px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: NAVY, fontSize: 16 }}>
                          <span>Total</span><span>{calTotal}€</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, marginTop: 6 }}>
                          💰 ~{Math.round(calTotal * 0.15 / 5) * 5}€ économisés vs Airbnb
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Reserve button */}
                <div style={{ padding: "0 24px 24px" }}>
                  <button
                    onClick={() => calCheckin && calCheckout ? onBook(bien, calCheckin, calCheckout) : onBook(bien)}
                    style={{
                      width: "100%", background: CORAL, border: "none", color: "#fff",
                      borderRadius: 10, padding: "14px 0",
                      fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13,
                      letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(196,114,84,0.28)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                  >
                    {calCheckin && calCheckout ? "Réserver ces dates →" : "Réserver →"}
                  </button>
                  {calCheckin && calCheckout && (
                    <button
                      onClick={() => { setCalCheckin(null); setCalCheckout(null); }}
                      style={{ display: "block", margin: "10px auto 0", fontSize: 11, color: MUTED, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Effacer les dates
                    </button>
                  )}
                  <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
                    <button onClick={() => setShowAlerte(true)} style={{ background: "none", border: "none", color: MUTED, fontSize: 11, fontFamily: "'Jost', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0, textDecoration: "underline", textDecorationColor: SAND }}>
                      🔔 M'alerter des disponibilités
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showAlerte && <AlerteDispoModal bien={bien} checkin={calCheckin} checkout={calCheckout} onClose={() => setShowAlerte(false)} />}

      {/* ── FAQ chatbot flottant ── */}
      <FaqChatbot bien={bien} />
    </div>
  );
}

// ── FAQ Chatbot flottant ─────────────────────────────────────────
const FAQ_CHATBOT_ITEMS = [
  { tags: ["réserver","réservation","book","comment"], q: "Comment réserver ?", a: "Choisissez vos dates dans le calendrier ci-dessus, puis cliquez « Réserver ». Paiement sécurisé par carte Stripe — sans intermédiaire ni frais de service." },
  { tags: ["arrivée","check-in","checkin","heure","clé"], q: "À quelle heure est-il possible d'arriver ?", a: "L'arrivée est fixée à 16h. Un départ tardif ou une arrivée anticipée peuvent être arrangés selon les disponibilités — contactez directement l'hôte." },
  { tags: ["départ","checkout","check-out","heure"], q: "À quelle heure faut-il quitter ?", a: "Le départ se fait avant 11h. Un late check-out est possible sur demande selon les disponibilités du jour." },
  { tags: ["wifi","internet","connexion","réseau","password"], q: "Y a-t-il le WiFi ?", a: "Oui, toutes nos propriétés disposent du WiFi Starlink haut débit (ou fibre), inclus dans le tarif. Le code vous sera transmis à votre arrivée." },
  { tags: ["animaux","chien","chat","pet","animal"], q: "Les animaux de compagnie sont-ils acceptés ?", a: "Les animaux de compagnie ne sont généralement pas acceptés dans nos propriétés. Si vous avez une situation particulière, contactez l'hôte directement pour en discuter." },
  { tags: ["parking","voiture","garage","stationnement"], q: "Y a-t-il un parking ?", a: "Oui, toutes nos villas en Martinique disposent d'un stationnement privé et sécurisé. Pour l'appartement Nogent, un parking à proximité est disponible." },
  { tags: ["remise","réduction","discount","semaine","long"], q: "Y a-t-il des remises pour les longs séjours ?", a: "Oui ! −5% pour 7 nuits ou plus, −10% pour 14 nuits, −15% pour 28 nuits. Ces remises s'appliquent automatiquement dans le calculateur." },
  { tags: ["piscine","bain","baignade","jacuzzi"], q: "Quelle propriété a une piscine ou jacuzzi ?", a: "Villa Amaryllis (piscine débordement + jacuzzi), Géko, Zandoli et Mabouya (piscines privées). Consultez chaque fiche pour les équipements détaillés." },
  { tags: ["annulation","rembours","annuler","cancel"], q: "Quelle est la politique d'annulation ?", a: "Annulation gratuite jusqu'à 14 jours avant l'arrivée. Au-delà, 50% de la somme est retenu. Pour les séjours réservés moins de 14j à l'avance, l'acompte est non remboursable." },
  { tags: ["paiement","carte","caution","dépôt","stripe"], q: "Comment se passe le paiement et la caution ?", a: "Paiement par carte bancaire sécurisé via Stripe. Un dépôt de garantie (caution) en pré-autorisation est demandé séparément — votre carte n'est pas débitée, les fonds sont juste bloqués." },
  { tags: ["ménage","nettoyage","propre","linge","serviette"], q: "Le ménage et le linge sont-ils inclus ?", a: "Le linge de lit et les serviettes sont fournis. Un ménage de fin de séjour est inclus. Un service de ménage en cours de séjour peut être arrangé en option." },
  { tags: ["bébé","enfant","lit","chaise","famille"], q: "Avez-vous du matériel bébé ?", a: "Un lit bébé et une chaise haute peuvent être mis à disposition sur demande — mentionnez-le lors de votre réservation ou contactez l'hôte à l'avance." },
];

function FaqChatbot({ bien }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const filtered = query.trim().length < 2
    ? FAQ_CHATBOT_ITEMS
    : FAQ_CHATBOT_ITEMS.filter(item => {
        const q = query.toLowerCase();
        return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q) || item.tags.some(t => t.includes(q));
      });

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Questions fréquentes"
        style={{
          position: "fixed", bottom: 90, right: 20, zIndex: 200,
          width: 52, height: 52, borderRadius: "50%",
          background: open ? CORAL : NAVY,
          border: `2px solid ${open ? CORAL : "rgba(250,245,233,0.3)"}`,
          color: "#faf5e9", fontSize: 22, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.25s, transform 0.2s",
          transform: open ? "rotate(45deg)" : "none",
        }}
      >{open ? "✕" : "?"}</button>

      {/* Panneau FAQ */}
      {open && (
        <div style={{
          position: "fixed", bottom: 155, right: 14, zIndex: 200,
          width: Math.min(window.innerWidth - 28, 370),
          maxHeight: "55vh", borderRadius: 16,
          background: "rgba(14,24,35,0.97)",
          border: "1px solid rgba(250,245,233,0.12)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          fontFamily: "system-ui,sans-serif",
        }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>💬 Questions fréquentes</div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setExpanded(null); }}
              placeholder="Tapez votre question…"
              style={{ width: "100%", padding: "8px 11px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "6px 0" }}>
            {filtered.length === 0 && (
              <div style={{ padding: "16px 16px", fontSize: 12, color: "#64748b", textAlign: "center" }}>
                Aucune réponse trouvée.<br />
                <a href="https://wa.me/33610880772" target="_blank" rel="noopener noreferrer" style={{ color: "#25D366", fontWeight: 600 }}>📱 Contactez-nous sur WhatsApp</a>
              </div>
            )}
            {filtered.map((item, i) => (
              <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{ width: "100%", textAlign: "left", padding: "11px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", lineHeight: 1.4 }}>{item.q}</span>
                  <span style={{ color: CORAL, fontSize: 14, flexShrink: 0, transition: "transform 0.15s", transform: expanded === i ? "rotate(45deg)" : "none", display: "inline-block" }}>+</span>
                </button>
                {expanded === i && (
                  <div style={{ padding: "0 16px 12px", fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{item.a}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 8, justifyContent: "center" }}>
            <a href="https://wa.me/33610880772" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#25D366", textDecoration: "none", fontWeight: 600 }}>💬 WhatsApp</a>
            <span style={{ fontSize: 10, color: "#334155" }}>·</span>
            <a href="mailto:contact@villamaryllis.com" style={{ fontSize: 10, color: "#0ea5e9", textDecoration: "none" }}>✉ Email</a>
          </div>
        </div>
      )}
    </>
  );
}

// ── Benefits Strip ───────────────────────────────────────────────
const BENEFITS = [
  { icon: "🏊", label: "Piscine infinity" },
  { icon: "🌊", label: "Vue mer 180°" },
  { icon: "🛁", label: "Jacuzzi privatif" },
  { icon: "🏝", label: "Plages à 5 min" },
  { icon: "⭐", label: "Coup de cœur Airbnb" },
];

function BenefitsStrip() {
  return (
    <div style={{
      background: NAVY, borderBottom: `1px solid rgba(250,245,233,0.07)`,
      padding: "0 32px",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "flex-start",
        gap: "clamp(16px, 4vw, 56px)", flexWrap: "wrap",
        padding: "18px 0",
      }}>
        {BENEFITS.map(({ icon, label }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(250,245,233,0.6)", whiteSpace: "nowrap",
            }}>{label}</span>
            {i < BENEFITS.length - 1 && (
              <span style={{ marginLeft: "clamp(8px, 2vw, 28px)", color: "rgba(250,245,233,0.12)", fontSize: 14 }}>·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quick Book ────────────────────────────────────────────────────
// ── Exit Intent Modal ────────────────────────────────────────────
// ── Alerte disponibilité ─────────────────────────────────────────
function AlerteDispoModal({ bien, checkin: initCheckin, checkout: initCheckout, onClose }) {
  const [email, setEmail]       = useState("");
  const [nom, setNom]           = useState("");
  const [checkin, setCheckin]   = useState(initCheckin || "");
  const [checkout, setCheckout] = useState(initCheckout || "");
  const [sent, setSent]         = useState(false);
  const [sending, setSending]   = useState(false);
  const [err, setErr]           = useState(false);
  const todayVal = today();

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const canSubmit = email && checkin && checkout && checkout > checkin;

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true); setErr(false);
    const message = `ALERTE DISPONIBILITÉ — ${bien.nom}\nDates souhaitées : du ${checkin} au ${checkout}\nEmail : ${email}${nom ? "\nNom : " + nom : ""}`;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom || "Alerte dispo", email, message }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
        if (window.gtag) window.gtag("event", "generate_lead", { method: "alerte_dispo", item_id: bien.id, item_name: bien.nom });
      } else { setErr(true); }
    } catch { setErr(true); }
    setSending(false);
  }

  const inputStyle = { border: `1px solid ${SAND}`, borderRadius: 8, padding: "10px 14px", fontFamily: "'Jost', sans-serif", fontSize: 13, color: NAVY, outline: "none", background: "#fff", width: "100%", boxSizing: "border-box", colorScheme: "light" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2100, background: "rgba(6,22,22,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: IVORY, borderRadius: 16, padding: "36px 32px", maxWidth: 440, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.28)", animation: "slideUpFull 0.28s ease" }}>
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 18, color: NAVY, marginBottom: 8 }}>Alerte enregistrée !</div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: MUTED, lineHeight: 1.7, margin: "0 0 6px" }}>
              Nous vous préviendrons dès que <strong>{bien.nom}</strong> se libère.
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12, color: CORAL, margin: "0 0 20px" }}>
              📅 {checkin} → {checkout}
            </p>
            <button onClick={onClose} style={{ background: CORAL, border: "none", color: "#fff", borderRadius: 8, padding: "11px 28px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Fermer</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 17, color: NAVY, marginBottom: 4 }}>🔔 Être alerté des disponibilités</div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: MUTED, lineHeight: 1.65, margin: "0 0 20px" }}>
              Recevez un email dès que <strong>{bien.nom}</strong> se libère sur vos dates.
            </p>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Arrivée *</div>
                  <input type="date" value={checkin} min={todayVal} onChange={e => { setCheckin(e.target.value); if (checkout && e.target.value >= checkout) setCheckout(""); }}
                    style={inputStyle} required />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Départ *</div>
                  <input type="date" value={checkout} min={checkin || todayVal} onChange={e => setCheckout(e.target.value)}
                    style={inputStyle} required />
                </div>
              </div>
              {/* Contact */}
              <input type="text" placeholder="Votre prénom (optionnel)" value={nom} onChange={e => setNom(e.target.value)} autoComplete="given-name" style={inputStyle} />
              <input type="email" placeholder="Votre email *" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />
              {err && <div style={{ fontSize: 11, color: CORAL, fontFamily: "'Jost', sans-serif" }}>Erreur — contactez-nous sur WhatsApp.</div>}
              <button type="submit" disabled={sending || !canSubmit}
                style={{ background: !canSubmit || sending ? SAND : NAVY, border: "none", color: !canSubmit || sending ? MUTED : "#faf5e9", borderRadius: 8, padding: "12px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: !canSubmit || sending ? "not-allowed" : "pointer", transition: "background 0.15s" }}>
                {sending ? "Envoi…" : "M'alerter →"}
              </button>
            </form>
            <button onClick={onClose} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", textDecoration: "underline", fontFamily: "'Jost', sans-serif" }}>Annuler</button>
          </>
        )}
      </div>
    </div>
  );
}

function ComparatorModal({ biens, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const rows = [
    { label: "Photo",       render: b => <img src={b.photos[0]} alt={b.nom} style={{ width:"100%", height:110, objectFit:"cover", borderRadius:8, display:"block" }} /> },
    { label: "Logement",    render: b => <span style={{ fontWeight:600, color:NAVY, fontSize:13 }}>{b.nom}</span> },
    { label: "Lieu",        render: b => <span style={{ fontSize:12, color:MUTED }}>{b.lieu}</span> },
    { label: "Note",        render: b => <span style={{ fontSize:13, color:GOLD, fontWeight:600 }}>★ {b.rating} <span style={{ color:MUTED, fontWeight:400, fontSize:11 }}>({b.reviews} avis)</span></span> },
    { label: "Prix / nuit", render: b => PRICE_HIDDEN.has(b.id) ? <span style={{ fontSize:12, color:MUTED, fontStyle:"italic" }}>Longue durée</span> : <span style={{ fontSize:15, fontWeight:700, color:CORAL }}>{b.prix}€</span> },
    { label: "Capacité",    render: b => <span style={{ fontSize:13, color:TEXT }}>👥 {b.capacite} pers.</span> },
    { label: "Chambres",    render: b => <span style={{ fontSize:13, color:TEXT }}>🛏 {b.chambres} ch. · {b.sdb} SDB</span> },
    { label: "Frais ménage",render: b => <span style={{ fontSize:13, color:TEXT }}>{FRAIS_MENAGE[b.id] ? `${FRAIS_MENAGE[b.id]}€` : "Inclus"}</span> },
    { label: "Séjour min.", render: b => { const mn = getMinNights(b.id); return <span style={{ fontSize:13, color:TEXT }}>{mn > 0 ? `${mn} nuits` : "Pas de minimum"}</span>; } },
    { label: "Équipements", render: b => (
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        {(b.amenities || []).slice(0,4).map(a => (
          <span key={a} style={{ fontSize:11, color:MUTED }}>✓ {a}</span>
        ))}
      </div>
    )},
    { label: "Réserver",    render: b => (
      <span style={{ display:"inline-block", background:CORAL, color:"#fff", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"center", width:"100%", boxSizing:"border-box" }}
        onClick={() => { onClose(); document.getElementById(`cta-${b.id}`)?.click(); }}>
        Réserver →
      </span>
    )},
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(14,59,58,0.65)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px 8px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:IVORY, borderRadius:16, width:"100%", maxWidth:860, maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 60px rgba(0,0,0,0.35)", animation:"bloomIn 0.25s ease" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px 16px", borderBottom:`1px solid ${SAND}`, position:"sticky", top:0, background:IVORY, zIndex:1 }}>
          <h2 style={{ margin:0, fontSize:18, color:NAVY, fontFamily:"'Jost', sans-serif", fontWeight:600 }}>Comparer les logements</h2>
          <button aria-label="Fermer" onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:MUTED, lineHeight:1, padding:4 }}>×</button>
        </div>

        {/* Table */}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
            <colgroup>
              <col style={{ width:110 }} />
              {biens.map(b => <col key={b.id} />)}
            </colgroup>
            <tbody>
              {rows.map(row => (
                <tr key={row.label} style={{ borderBottom:`1px solid ${SAND}` }}>
                  <td style={{ padding:"12px 16px", fontSize:11, color:MUTED, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", verticalAlign:"top", background:"rgba(224,212,188,0.15)", whiteSpace:"nowrap" }}>
                    {row.label}
                  </td>
                  {biens.map(b => (
                    <td key={b.id} style={{ padding:"12px 16px", verticalAlign:"top", textAlign:"center" }}>
                      {row.render(b)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ExitIntentModal({ onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(6,22,22,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.25s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: IVORY, borderRadius: 16, padding: "40px 36px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", animation: "slideUpFull 0.3s ease" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🌴</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 24, color: NAVY, marginBottom: 8, lineHeight: 1.3 }}>
          Avant de partir…
        </div>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: MUTED, lineHeight: 1.7, margin: "0 0 24px" }}>
          Une question sur nos villas en Martinique ? Notre équipe répond en moins d'une heure — même le week-end.
        </p>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG_DEFAULT}`}
          target="_blank" rel="noopener noreferrer"
          onClick={onClose}
          style={{ display: "block", background: "#25D366", color: "#fff", borderRadius: 8, padding: "14px 24px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.08em", textDecoration: "none", textTransform: "uppercase", marginBottom: 12 }}
        >
          💬 Nous écrire sur WhatsApp
        </a>
        <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 12, fontFamily: "'Jost', sans-serif", textDecoration: "underline" }}>
          Non merci, je continue
        </button>
      </div>
    </div>
  );
}

// ── Recherche par dates ──────────────────────────────────────────
// Filtre select style NAVY
function NavySelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange} style={{
      background: "rgba(250,245,233,0.06)", border: "1px solid rgba(250,245,233,0.1)",
      borderRadius: 8, padding: "10px 36px 10px 16px", color: "#faf5e9",
      fontSize: 13, fontFamily: "'Jost', sans-serif", outline: "none", cursor: "pointer",
      appearance: "none", WebkitAppearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23faf5e9' stroke-opacity='.4' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
    }}>
      {children}
    </select>
  );
}

function SearchByDates({ biens, onBook, onDetail }) {
  const [checkin, setCheckin]   = useState("");
  const [checkout, setCheckout] = useState("");
  const [minGuests, setMinGuests] = useState("0");   // "0" = pas de filtre
  const [minChambres, setMinChambres] = useState("0");
  const [results, setResults]   = useState(null); // null = pas lancé
  const [loading, setLoading]   = useState(false);
  const [alerteTarget, setAlerteTarget] = useState(null); // { bien, checkin, checkout }
  const searchAbortRef = useRef(null);

  const todayVal = today();

  // Candidats : logements réservables (hors BOOKING_DISABLED et beds24)
  const candidates = biens.filter(b => !BOOKING_DISABLED.has(b.id) && !b.beds24Url);

  async function search() {
    if (!checkin || !checkout || checkout <= checkin) return;

    // Abort any in-flight search before starting a new one
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const ctrl = new AbortController();
    searchAbortRef.current = ctrl;

    setLoading(true);
    setResults(null);

    const nights = dateDiff(checkin, checkout);
    const allPrices = loadDailyPrices();

    // Charger les URLs iCal depuis localStorage (mêmes que PropertyDetail)
    let bookingUrls = {};
    try { bookingUrls = JSON.parse(localStorage.getItem("ical_urls_booking") || "{}"); } catch {}

    // Fetch dispo en parallèle pour tous les candidats
    const availMap = {}; // bienId → blockedDates[]
    await Promise.all(
      candidates.map(async b => {
        try {
          let url = `/api/get-availability?bienId=${b.id}`;
          if (bookingUrls[b.id]) url += `&bookingUrl=${encodeURIComponent(bookingUrls[b.id])}`;
          const r = await fetch(url, { signal: ctrl.signal });
          if (r.ok) { const d = await r.json(); availMap[b.id] = d.blockedDates || []; }
          else availMap[b.id] = [];
        } catch (e) {
          if (e.name !== "AbortError") availMap[b.id] = [];
        }
      })
    );

    // If aborted, don't update state
    if (ctrl.signal.aborted) return;

    // Construire résultats
    const gFilter = parseInt(minGuests, 10);
    const cFilter = parseInt(minChambres, 10);

    const res = candidates.map(b => {
      const blocked = availMap[b.id] || [];
      const minN = getMinNights(b.id, checkin);

      // Vérifier capacité
      if (gFilter > 0 && b.capacite < gFilter) return null;
      if (cFilter > 0 && b.chambres < cFilter) return null;

      // Vérifier séjour minimum
      const belowMin = nights < minN;

      // Vérifier disponibilité : aucune date dans la plage ne doit être bloquée
      // (on vérifie du checkin inclus au checkout exclu)
      let isAvailable = true;
      if (!belowMin) {
        let cur = checkin;
        for (let i = 0; i < nights; i++) {
          if (blocked.includes(cur)) { isAvailable = false; break; }
          cur = addDays(cur, 1);
        }
      }

      // Calculer prix
      const map = allPrices[b.id] || {};
      let sum = 0, cur = checkin;
      for (let i = 0; i < nights; i++) { sum += map[cur] ?? b.prix; cur = addDays(cur, 1); }
      const disc = getDiscount(nights);
      const discAmt = disc > 0 ? Math.round(sum * disc) : 0;
      const frais = FRAIS_MENAGE[b.id] ?? 0;
      const total = sum - discAmt + frais;

      return { bien: b, nights, total, rawTotal: sum, discAmt, frais, belowMin, minN, isAvailable };
    }).filter(Boolean);

    // Trier : disponibles + conformes séjour min en premier (par prix), ensuite indispos
    res.sort((a, b) => {
      const aOk = a.isAvailable && !a.belowMin;
      const bOk = b.isAvailable && !b.belowMin;
      if (aOk && !bOk) return -1;
      if (!aOk && bOk) return 1;
      if (aOk && bOk) return a.total - b.total;
      return 0;
    });

    setResults(res);
    setLoading(false);
  }

  const [open, setOpen] = useState(false);
  const canSearch = checkin && checkout && checkout > checkin;
  const availableCount = results ? results.filter(r => r.isAvailable && !r.belowMin).length : 0;

  // Fermer et réinitialiser
  function reset() { setCheckin(""); setCheckout(""); setResults(null); setOpen(false); }

  return (
    <div style={{ background: IVORY, borderBottom: `1px solid ${SAND}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>

        {/* Trigger — ligne discrète */}
        <button
          onClick={() => { setOpen(o => !o); if (open) { setResults(null); } }}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "13px 0", cursor: "pointer", textAlign: "left" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.45 }}>
            <circle cx="6.5" cy="6.5" r="5" stroke={NAVY} strokeWidth="1.5"/>
            <line x1="10.5" y1="10.5" x2="15" y2="15" stroke={NAVY} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED }}>
            Rechercher par dates
          </span>
          {results && !open && (
            <span style={{ marginLeft: 6, fontSize: 10, color: CORAL, fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em" }}>
              · {availableCount} disponible{availableCount > 1 ? "s" : ""}
            </span>
          )}
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ marginLeft: "auto", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.35 }}>
            <path d="M1 1l4 4 4-4" stroke={NAVY} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Panel dépliable */}
        {open && (
          <div style={{ paddingBottom: 20, animation: "fadeUp 0.18s ease" }}>
            {/* Filtres */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 0 }}>
              {/* Arrivée */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 7, padding: "8px 14px", border: `1px solid ${SAND}` }}>
                <span style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Arrivée</span>
                <input type="date" value={checkin} min={todayVal} onChange={e => { setCheckin(e.target.value); setResults(null); }}
                  style={{ background: "none", border: "none", color: NAVY, fontSize: 13, fontFamily: "'Jost', sans-serif", outline: "none", cursor: "pointer", colorScheme: "light" }} />
              </div>

              <div style={{ color: SAND, fontSize: 16, fontWeight: 300 }}>→</div>

              {/* Départ */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 7, padding: "8px 14px", border: `1px solid ${SAND}` }}>
                <span style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Départ</span>
                <input type="date" value={checkout} min={checkin || todayVal} onChange={e => { setCheckout(e.target.value); setResults(null); }}
                  style={{ background: "none", border: "none", color: NAVY, fontSize: 13, fontFamily: "'Jost', sans-serif", outline: "none", cursor: "pointer", colorScheme: "light" }} />
              </div>

              {/* Voyageurs */}
              <select value={minGuests} onChange={e => { setMinGuests(e.target.value); setResults(null); }} style={{
                background: "#fff", border: `1px solid ${SAND}`, borderRadius: 7, padding: "8px 32px 8px 14px",
                color: minGuests === "0" ? MUTED : NAVY, fontSize: 12, fontFamily: "'Jost', sans-serif", outline: "none", cursor: "pointer",
                appearance: "none", WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237a6b5a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
              }}>
                <option value="0">Voyageurs</option>
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} voyageur{n > 1 ? "s" : ""}</option>)}
              </select>

              {/* Chambres */}
              <select value={minChambres} onChange={e => { setMinChambres(e.target.value); setResults(null); }} style={{
                background: "#fff", border: `1px solid ${SAND}`, borderRadius: 7, padding: "8px 32px 8px 14px",
                color: minChambres === "0" ? MUTED : NAVY, fontSize: 12, fontFamily: "'Jost', sans-serif", outline: "none", cursor: "pointer",
                appearance: "none", WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237a6b5a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
              }}>
                <option value="0">Chambres</option>
                {[1,2,3].map(n => <option key={n} value={n}>{n} chambre{n > 1 ? "s" : ""}</option>)}
              </select>

              {/* Bouton recherche */}
              <button onClick={search} disabled={!canSearch || loading}
                style={{ background: canSearch && !loading ? NAVY : SAND, border: "none", color: canSearch && !loading ? "#faf5e9" : MUTED, borderRadius: 7, padding: "9px 20px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: (!canSearch || loading) ? "not-allowed" : "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 7, transition: "background 0.15s" }}>
                {loading
                  ? <><span style={{ display: "inline-block", width: 11, height: 11, border: "1.5px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Vérification…</>
                  : "Vérifier →"}
              </button>

              {results && (
                <button onClick={reset} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 11, fontFamily: "'Jost', sans-serif", textDecoration: "underline", opacity: 0.6 }}>Effacer</button>
              )}
            </div>

            {/* Résultats */}
            {results && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {availableCount === 0
                    ? "Aucun logement disponible pour ces critères"
                    : `${availableCount} logement${availableCount > 1 ? "s" : ""} disponible${availableCount > 1 ? "s" : ""}`}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {results.map(({ bien, nights, total, rawTotal, discAmt, frais, belowMin, minN, isAvailable }) => {
                    const unavailable = !isAvailable || belowMin;
                    return (
                      <div key={bien.id} style={{
                        background: unavailable ? "rgba(14,59,58,0.02)" : "#fff",
                        border: `1px solid ${unavailable ? SAND : "rgba(14,59,58,0.12)"}`,
                        borderRadius: 9, padding: "12px 16px", minWidth: 175, flex: "1 1 175px", maxWidth: 255,
                        opacity: unavailable ? 0.45 : 1,
                        transition: "opacity 0.2s, box-shadow 0.2s",
                        boxShadow: unavailable ? "none" : "0 1px 6px rgba(14,59,58,0.06)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12, color: NAVY, lineHeight: 1.2 }}>{bien.nom}</div>
                          <div style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", textAlign: "right", lineHeight: 1.4, marginLeft: 6, flexShrink: 0 }}>
                            {bien.capacite} pers · {bien.chambres} ch.
                          </div>
                        </div>

                        {!isAvailable ? (
                          <div>
                            <div style={{ fontSize: 10, color: "#ef4444", fontFamily: "'Jost', sans-serif", marginBottom: 6 }}>Indisponible</div>
                            <button onClick={() => setAlerteTarget({ bien, checkin, checkout })} style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", background: "none", border: `1px solid ${SAND}`, borderRadius: 5, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                              🔔 M'alerter
                            </button>
                          </div>
                        ) : belowMin ? (
                          <div style={{ fontSize: 10, color: "#f97316", fontFamily: "'Jost', sans-serif" }}>Min. {minN} nuits</div>
                        ) : (
                          <>
                            <div style={{ fontSize: 20, fontWeight: 700, color: CORAL, lineHeight: 1, margin: "4px 0 1px" }}>{total.toLocaleString("fr-FR")}€</div>
                            <div style={{ fontSize: 10, color: MUTED, marginBottom: 1, fontFamily: "'Jost', sans-serif" }}>
                              {nights} nuit{nights > 1 ? "s" : ""}
                              {discAmt > 0 && ` · −${discAmt}€`}
                              {frais > 0 && ` · +${frais}€ ménage`}
                            </div>
                            <div style={{ fontSize: 10, color: MUTED, marginBottom: 4, fontFamily: "'Jost', sans-serif", opacity: 0.7 }}>
                              = {Math.round((rawTotal - (discAmt || 0)) / nights)}€/nuit moy.
                            </div>
                            {/* Badge économie Airbnb */}
                            <div style={{ fontSize: 10, color: "#16a34a", fontFamily: "'Jost', sans-serif", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                              <span>💰</span>
                              <span>−{Math.round(total * 0.15 / 5) * 5}€ vs Airbnb</span>
                            </div>
                            <div style={{ display: "flex", gap: 5 }}>
                              <button onClick={() => onDetail(bien)} style={{ flex: 1, background: IVORY, border: `1px solid ${SAND}`, color: NAVY, borderRadius: 5, padding: "5px 8px", fontSize: 10, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Voir</button>
                              <button onClick={() => onBook(bien, checkin, checkout)} style={{ flex: 1, background: CORAL, border: "none", color: "#fff", borderRadius: 5, padding: "5px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Réserver</button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {alerteTarget && <AlerteDispoModal bien={alerteTarget.bien} checkin={alerteTarget.checkin} checkout={alerteTarget.checkout} onClose={() => setAlerteTarget(null)} />}
    </div>
  );
}

/* ─── WeatherPill — pill discret dans le header ─────────────── */
const WMO_ICON = {
  0:"☀️", 1:"🌤️", 2:"⛅", 3:"☁️", 45:"🌫️", 48:"🌫️",
  51:"🌦️", 53:"🌦️", 55:"🌧️", 61:"🌧️", 63:"🌧️", 65:"🌧️",
  80:"🌦️", 81:"🌧️", 82:"⛈️", 95:"⛈️", 96:"⛈️", 99:"⛈️",
};
function WeatherPill() {
  const [wx, setWx] = useState(null);
  useEffect(() => {
    try {
      const c = sessionStorage.getItem("wx_sl");
      if (c) { setWx(JSON.parse(c)); return; }
    } catch {}
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=14.472&longitude=-60.933" +
      "&current=temperature_2m,weathercode&timezone=America%2FMartinique"
    )
      .then(r => r.json())
      .then(d => {
        const v = { t: Math.round(d.current.temperature_2m), c: d.current.weathercode };
        setWx(v);
        try { sessionStorage.setItem("wx_sl", JSON.stringify(v)); } catch {}
      })
      .catch(() => {});
  }, []);
  if (!wx) return null;
  return (
    <span style={{
      display: "flex", alignItems: "center", gap: 4,
      fontSize: 12, fontFamily: "'Jost',sans-serif", fontWeight: 300,
      color: "rgba(250,245,233,0.6)", letterSpacing: "0.03em",
      whiteSpace: "nowrap",
    }}>
      {WMO_ICON[wx.c] ?? "🌡️"} {wx.t}°C
    </span>
  );
}

function QuickBook({ biens, onBook }) {
  const amaryllis = biens.find(b => b.id === "amaryllis") || biens[0];
  const [selectedId, setSelectedId] = useState(amaryllis?.id || biens[0]?.id);
  const selected = biens.find(b => b.id === selectedId) || biens[0];

  return (
    <div style={{
      background: CREAM, borderBottom: `1px solid ${SAND}`,
      padding: "0 32px",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        display: "flex", alignItems: "center", gap: 16,
        padding: "20px 0", flexWrap: "wrap",
      }}>
        {/* Label */}
        <div style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 11,
          letterSpacing: "0.35em", textTransform: "uppercase", color: MUTED,
          flexShrink: 0, whiteSpace: "nowrap",
        }}>Réserver</div>

        {/* Property selector */}
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 13,
            color: NAVY, background: "#fff", border: `1px solid ${SAND}`,
            borderRadius: 8, padding: "10px 14px", outline: "none",
            cursor: "pointer", flexShrink: 0,
            appearance: "none", WebkitAppearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a6b5a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
            paddingRight: 36,
          }}
        >
          {biens.map(b => (
            <option key={b.id} value={b.id}>{b.nom} — {b.lieu}</option>
          ))}
        </select>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: SAND, flexShrink: 0 }} />

        {/* Price + rating */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
          {selected && PRICE_HIDDEN.has(selected.id) ? (
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: MUTED, fontStyle: "italic" }}>Location longue durée</span>
          ) : (
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: NAVY, fontWeight: 600 }}>
              À partir de {selected?.prix}€<span style={{ fontWeight: 300, color: MUTED, fontSize: 11 }}> / nuit</span>
            </span>
          )}
          {selected?.rating && (
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: MUTED }}>
              <span style={{ color: GOLD }}>★</span> {selected.rating} · {selected.reviews} avis
            </span>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* CTA */}
        <button
          onClick={() => onBook(selected)}
          style={{
            background: CORAL, border: "none", color: "#fff",
            borderRadius: 8, padding: "13px 32px",
            fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12,
            letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
            flexShrink: 0, whiteSpace: "nowrap",
            transition: "opacity 0.2s, transform 0.15s",
            boxShadow: "0 4px 18px rgba(196,114,84,0.3)",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          Vérifier les disponibilités →
        </button>
      </div>
    </div>
  );
}

// ── Hero Carousel ────────────────────────────────────────────────
const CAROUSEL_DELAY = 8000;

function HeroCarousel({ biens, onDetail, onBook }) {
  const { t, lang } = useLang();
  const [idx, setIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const idxRef = useRef(0);
  const timerRef = useRef(null);

  function goTo(next) {
    idxRef.current = next;
    setIdx(next);
    setAnimKey(k => k + 1);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => goTo((idxRef.current + 1) % biens.length), CAROUSEL_DELAY);
  }

  useEffect(() => {
    timerRef.current = setTimeout(() => goTo((idxRef.current + 1) % biens.length), CAROUSEL_DELAY);
    return () => clearTimeout(timerRef.current);
  }, []);

  const bien = biens[idx];
  const photo = bien.photos && bien.photos[0];

  return (
    <div style={{ position: "relative", height: "calc(100svh - 62px)", minHeight: 520, overflow: "hidden", background: "#072626" }}>
      {/* Animated shader wallpaper */}
      <ShaderBg />

      {/* Property photo — right half, masked to fade into shader */}
      {photo && (
        <img
          key={`photo-${animKey}`}
          src={photo}
          alt={`${bien.nom} — ${bien.lieu}`}
          style={{
            position: "absolute",
            right: 0, top: 0, bottom: 0,
            width: "62%", height: "100%",
            objectFit: "cover", objectPosition: "center top",
            display: "block",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 18%, rgba(0,0,0,0.82) 38%, black 55%)",
            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 18%, rgba(0,0,0,0.82) 38%, black 55%)",
            opacity: 0.82,
            filter: "saturate(1.18) contrast(1.06) brightness(1.02)",
            animation: "fadeIn 0.9s ease both",
            zIndex: 1,
          }}
        />
      )}

      {/* Text scrim */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        background: "linear-gradient(to right, rgba(7,38,38,0.72) 0%, rgba(7,38,38,0.55) 35%, rgba(7,38,38,0.15) 65%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Content — left, remonté */}
      <div
        key={`text-${animKey}`}
        style={{
          position: "absolute", left: "8vw", top: "44%",
          transform: "translateY(-50%)",
          maxWidth: "clamp(280px, 42vw, 500px)",
          zIndex: 4,
          animation: "slideInLeft 0.65s cubic-bezier(0.23,1,0.32,1) both",
        }}
      >
        <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: CORAL, letterSpacing: "0.55em", textTransform: "uppercase", marginBottom: 12 }}>
          {bien.lieu}
        </div>
        <h1
          onClick={() => onDetail(bien)}
          style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 200,
            fontSize: "clamp(28px, 4vw, 60px)", letterSpacing: "0.08em",
            textTransform: "uppercase", color: "#faf5e9",
            margin: "0 0 10px", lineHeight: 1.05,
            cursor: "pointer", transition: "opacity 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {bien.nom}
        </h1>
        {bien.rating && (
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: "rgba(250,245,233,0.55)", marginBottom: 14, letterSpacing: "0.05em" }}>
            <span style={{ color: GOLD }}>★ {bien.rating}</span>
            {bien.reviews ? ` · ${bien.reviews} ${t("reviewsLabel")}` : ""}
            {` · ${bien.capacite} ${t("guests")}`}
          </div>
        )}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
          fontSize: 16, color: "rgba(250,245,233,0.65)", lineHeight: 1.65,
          margin: "0 0 22px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {lang === "fr" ? bien.desc : (bien.descEn || bien.desc)}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {/* Primary CTA */}
            {!BOOKING_DISABLED.has(bien.id) ? (
              <button
                onClick={() => onBook(bien)}
                style={{
                  background: CORAL, border: "none", color: "#fff",
                  borderRadius: 8, padding: "14px 32px",
                  fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.12em",
                  cursor: "pointer", textTransform: "uppercase",
                  animation: "ctaPulse 2.8s ease-in-out infinite",
                  transition: "opacity 0.2s, transform 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {t("searchBtn")}
              </button>
            ) : (
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Bonjour, je suis intéressé(e) par Villa Iguana pour une location longue durée à Sainte-Luce, Martinique. Pouvez-vous m'indiquer vos conditions et disponibilités ? Merci.")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", background: "rgba(250,245,233,0.08)", border: "1px solid rgba(250,245,233,0.3)", borderRadius: 8, padding: "14px 24px", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, letterSpacing: "0.12em", color: "#faf5e9", textTransform: "uppercase", whiteSpace: "nowrap", textDecoration: "none", transition: "background 0.2s" }}
              >
                {t("contactLongStay")}
              </a>
            )}
            {/* Secondary CTA */}
            <button
              onClick={() => onDetail(bien)}
              style={{
                background: "transparent", border: "1px solid rgba(250,245,233,0.35)", color: "#faf5e9",
                borderRadius: 8, padding: "14px 24px",
                fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, letterSpacing: "0.12em",
                cursor: "pointer", textTransform: "uppercase", whiteSpace: "nowrap",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(250,245,233,0.08)"; e.currentTarget.style.borderColor = "rgba(250,245,233,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(250,245,233,0.35)"; }}
            >
              {t("viewPhotosDetails")}
            </button>
          </div>
          {!BOOKING_DISABLED.has(bien.id) && (
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: "rgba(250,245,233,0.45)", letterSpacing: "0.06em" }}>
              {t("directOwnerPay")}
            </span>
          )}
        </div>
      </div>

      {/* Top-left: amenities + voir photos — sur la photo */}
      <div
        key={`topleft-${animKey}`}
        style={{
          position: "absolute", top: 20, left: 20, zIndex: 5,
          display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
          animation: "fadeIn 0.9s ease both",
        }}
      >
        {(lang === "fr" ? (bien.amenities || []) : (bien.amenitiesEn || bien.amenities || [])).slice(0, 5).map((a, i) => (
          <div key={i} style={{
            background: "rgba(7,38,38,0.58)", backdropFilter: "blur(14px)",
            border: "1px solid rgba(250,245,233,0.12)",
            borderRadius: 20, padding: "5px 14px",
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "rgba(250,245,233,0.75)", whiteSpace: "nowrap",
          }}>{a}</div>
        ))}
      </div>

      {/* Bottom nav: dots + arrows */}
      <div style={{ position: "absolute", bottom: 28, left: "8vw", right: "8vw", zIndex: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Dots */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {biens.map((b, i) => (
            <button
              key={b.id}
              onClick={() => goTo(i)}
              title={b.nom}
              style={{
                width: i === idx ? 28 : 7, height: 7, borderRadius: 4,
                background: i === idx ? CORAL : "rgba(250,245,233,0.28)",
                border: "none", cursor: "pointer", padding: 0,
                transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)",
              }}
            />
          ))}
        </div>
        {/* Arrows + counter */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "rgba(250,245,233,0.35)", letterSpacing: "0.1em" }}>
            {String(idx + 1).padStart(2, "0")} / {String(biens.length).padStart(2, "0")}
          </span>
          <button
            aria-label="Photo précédente"
            onClick={() => goTo((idx - 1 + biens.length) % biens.length)}
            style={{ background: "rgba(250,245,233,0.08)", border: "1px solid rgba(250,245,233,0.18)", color: "#faf5e9", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", transition: "background 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(250,245,233,0.16)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(250,245,233,0.08)"; }}
          >‹</button>
          <button
            aria-label="Photo suivante"
            onClick={() => goTo((idx + 1) % biens.length)}
            style={{ background: "rgba(250,245,233,0.08)", border: "1px solid rgba(250,245,233,0.18)", color: "#faf5e9", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", transition: "background 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(250,245,233,0.16)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(250,245,233,0.08)"; }}
          >›</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(250,245,233,0.08)", zIndex: 5 }}>
        <div
          key={`bar-${animKey}`}
          style={{
            height: "100%", background: CORAL, transformOrigin: "left",
            animation: `carouselProgress ${CAROUSEL_DELAY}ms linear both`,
          }}
        />
      </div>
    </div>
  );
}

// ── FAQ Section ──────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Comment réserver sans passer par Airbnb ?",
    a: "Directement sur ce site : sélectionnez votre villa, choisissez vos dates et payez par carte (Stripe sécurisé). Vous économisez les frais de service Airbnb — jusqu'à 14% du prix — et vous avez un contact direct avec l'hôte.",
  },
  {
    q: "Quel est le prix d'une villa avec piscine à Sainte-Luce Martinique ?",
    a: "Nos villas avec piscine sont à partir de 150€/nuit (Géko) jusqu'à 280€/nuit pour la Villa Amaryllis avec piscine à débordement vue mer. Des réductions semaine sont disponibles (-5% à partir de 7 nuits).",
  },
  {
    q: "Peut-on louer une villa avec jacuzzi privatif en Martinique ?",
    a: "Oui ! La Villa Amaryllis dispose d'un jacuzzi privatif en plus de la piscine à débordement. Le studio Mabouya est entièrement dédié au romantisme avec jacuzzi privé et vue mer à partir de 110€/nuit.",
  },
  {
    q: "Y a-t-il des logements disponibles en Île-de-France ?",
    a: "Oui, notre Appartement aux Portes de Paris à Nogent-sur-Marne (94) offre un cadre calme à 15 min du centre de Paris, idéal pour les séjours professionnels ou le tourisme parisien à partir de 85€/nuit.",
  },
  {
    q: "Est-ce que le WiFi est inclus dans toutes les locations ?",
    a: "Oui, toutes nos propriétés disposent du WiFi Starlink haut débit (ou fibre), inclus sans supplément. Connexion stable même dans les hauteurs de Sainte-Luce.",
  },
];

/* ─── GoogleReviews ──────────────────────────────────────────────
   Affiche les avis Google en temps réel via /api/google-reviews
   Fallback : avis statiques si l'API n'est pas configurée
──────────────────────────────────────────────────────────────── */
const STATIC_REVIEWS = [
  { author: "Sophie M.", avatar: null, rating: 5, text: "Vue extraordinaire, piscine à débordement parfaite. Un endroit hors du temps face aux Caraïbes. On reviendra sans hésiter !", time: "il y a 2 mois" },
  { author: "Thomas L.", avatar: null, rating: 5, text: "Villa magnifique, très bien équipée. L'accueil était parfait et la piscine à débordement est tout simplement incroyable. Nous recommandons vivement !", time: "il y a 3 mois" },
  { author: "Marie & Pierre", avatar: null, rating: 5, text: "Séjour parfait ! La vue est époustouflante, la villa très confortable. Les propriétaires sont très réactifs et aux petits soins. À refaire sans hésitation.", time: "il y a 4 mois" },
  { author: "Emma R.", avatar: null, rating: 5, text: "Logement de rêve ! Tout était parfait, de la propreté à l'équipement. La piscine est magnifique et la vue sur la mer est à couper le souffle.", time: "il y a 5 mois" },
  { author: "Jean-Paul B.", avatar: null, rating: 4, text: "Très belle villa avec une vue imprenable. Quelques petits détails à améliorer mais globalement un excellent séjour. La piscine est top !", time: "il y a 6 mois" },
];

/* ─── TestimonialsSection ─────────────────────────────────────────
   Bandeau d'avis clients sélectionnés, entre le hero et QuickBook
──────────────────────────────────────────────────────────────── */
const CURATED_TESTIMONIALS = [
  { nom: "Sophie M.",      pays: "🇫🇷", note: 5, texte: "Vue extraordinaire, piscine à débordement parfaite et hôte très réactif. Un endroit hors du temps face aux Caraïbes. On reviendra sans hésiter !", villa: "Villa Amaryllis", villaId: "amaryllis", date: "Avr. 2025" },
  { nom: "Pierre & Claire",pays: "🇫🇷", note: 5, texte: "Vue imprenable sur le rocher du Diamant ! La piscine d'eau salée est un vrai plus. Villa propre, bien équipée, accueil aux petits soins.", villa: "Villa Iguana",    villaId: "iguana",    date: "Avr. 2025" },
  { nom: "Élise & Romain", pays: "🇫🇷", note: 5, texte: "Weekend romantique parfait ! Le jacuzzi privatif sous les étoiles avec vue mer est juste magique. Jardin fleuri superbe, endroit très paisible.", villa: "Studio Mabouya",  villaId: "mabouya",   date: "Avr. 2025" },
  { nom: "Lucie B.",       pays: "🇫🇷", note: 5, texte: "Cocon parfait ! La mezzanine est charmante, la piscine délicieuse, et la vue sur la mer au réveil est inoubliable. Hôte très disponible.", villa: "Zandoli",          villaId: "zandoli",   date: "Avr. 2025" },
];

function TestimonialsSection({ onDetail }) {
  const { t } = useLang();
  return (
    <div style={{ background: NAVY, padding: "56px 28px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 12 }}>
            Avis vérifiés Airbnb · 4.9 ★
          </div>
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 4vw, 30px)", letterSpacing: "0.14em", textTransform: "uppercase", color: IVORY, margin: 0 }}>
            Ce que disent nos hôtes
          </h2>
        </div>

        {/* Cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {CURATED_TESTIMONIALS.map((r, i) => (
            <Reveal key={r.nom} delay={i * 0.08} style={{
              background: "rgba(250,245,233,0.05)",
              border: "1px solid rgba(250,245,233,0.1)",
              borderRadius: 14,
              padding: "24px 22px 20px",
              display: "flex", flexDirection: "column", gap: 14,
              cursor: onDetail ? "pointer" : "default",
              transition: "border-color 0.25s, background 0.25s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(232,105,74,0.45)"; e.currentTarget.style.background = "rgba(250,245,233,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.1)"; e.currentTarget.style.background = "rgba(250,245,233,0.05)"; }}
            onClick={() => onDetail && onDetail({ id: r.villaId })}
            >
              {/* Stars */}
              <div style={{ display: "flex", gap: 3 }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ fontSize: 13, color: i <= r.note ? "#f5a623" : "rgba(250,245,233,0.2)" }}>★</span>
                ))}
              </div>

              {/* Quote */}
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 14, color: "rgba(250,245,233,0.8)", lineHeight: 1.65, margin: 0, flex: 1 }}>
                &ldquo;{r.texte}&rdquo;
              </p>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderTop: "1px solid rgba(250,245,233,0.08)", paddingTop: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, color: IVORY }}>
                    {r.pays} {r.nom}
                  </div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: CORAL, marginTop: 2, letterSpacing: "0.03em" }}>
                    {r.villa}
                  </div>
                </div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "rgba(250,245,233,0.35)", flexShrink: 0 }}>
                  {r.date}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Overall score */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: "rgba(250,245,233,0.4)", letterSpacing: "0.05em" }}>
            ✓ Tous les avis proviennent de voyageurs vérifiés via Airbnb &amp; Booking.com
          </span>
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= rating ? "#f5a623" : "#ddd", lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

function GoogleReviews({ compact = false }) {
  const [data, setData]   = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/google-reviews")
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const reviews = data?.reviews?.length ? data.reviews : STATIC_REVIEWS;
  const rating  = data?.rating ?? 4.8;
  const total   = data?.userRatingsTotal ?? 117;
  const isLive  = !!data?.reviews?.length;

  const inner = (
    <>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: compact ? 20 : 40 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>
            Avis Google · Villa Amaryllis{isLive && <span style={{ marginLeft: 8, background: "#e8f5e9", color: "#2e7d32", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20 }}>● Live</span>}
          </div>
          {!compact && (
            <h2 style={{ fontFamily: "'Jost',sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.12em", textTransform: "uppercase", color: NAVY, margin: "0 0 10px" }}>
              Ce que disent nos hôtes
            </h2>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "'Jost',sans-serif", fontWeight: 800, fontSize: compact ? 32 : 42, color: NAVY, lineHeight: 1 }}>{rating}</span>
            <div>
              <StarRating rating={Math.round(rating)} size={compact ? 13 : 16} />
              <div style={{ fontFamily: "'Jost',sans-serif", fontWeight: 300, fontSize: 12, color: MUTED, marginTop: 3 }}>
                {total.toLocaleString("fr-FR")} avis vérifiés
              </div>
            </div>
          </div>
        </div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJWbeKdLghQIwRCppz2lJ39Jk" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: MUTED, fontFamily: "'Jost',sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, border: `1px solid ${SAND}`, borderRadius: 8, padding: "8px 14px", transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = NAVY}
          onMouseLeave={e => e.currentTarget.style.borderColor = SAND}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Voir sur Google Maps
        </a>
      </div>

      {/* Grille avis */}
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
        {reviews.slice(0, compact ? 3 : 5).map((r, i) => (
            <Reveal key={i} delay={i * 0.07} style={{
              background: CREAM, border: `1px solid ${SAND}`, borderRadius: 14,
              padding: "22px 22px 20px", display: "flex", flexDirection: "column", gap: 12,
            }}>
              {/* Header avis */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {r.avatar
                  ? <img src={r.avatar} alt={r.author} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} onError={e => e.currentTarget.style.display = "none"} />
                  : <div style={{ width: 40, height: 40, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#faf5e9", fontSize: 16, fontWeight: 600 }}>{r.author?.[0] ?? "?"}</span>
                    </div>
                }
                <div>
                  <div style={{ fontFamily: "'Jost',sans-serif", fontWeight: 600, fontSize: 13, color: NAVY }}>{r.author}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <StarRating rating={r.rating} size={12} />
                    <span style={{ fontSize: 11, color: MUTED, fontFamily: "'Jost',sans-serif" }}>{r.time}</span>
                  </div>
                </div>
                {isLive && (
                  <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
              </div>
              {/* Texte */}
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 13, color: MUTED, lineHeight: 1.65, margin: 0, flex: 1 }}>
                "{r.text?.length > 220 ? r.text.slice(0, 220) + "…" : r.text}"
              </p>
            </Reveal>
          ))}
        </div>
    </>
  );

  if (compact) return <div>{inner}</div>;

  return (
    <section style={{ background: IVORY, padding: "72px 24px 80px", borderTop: `1px solid ${SAND}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {inner}
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(null);

  return (
    <section style={{ background: CREAM, padding: "72px 24px" }}>
      {/* JSON-LD FAQ Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQ_ITEMS.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      })}} />

      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: CORAL, textAlign: "center", marginBottom: 12 }}>Questions fréquentes</p>
        <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, textAlign: "center", margin: "0 0 12px" }}>
          Location villa Martinique
        </h2>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, color: TEXT, textAlign: "center", marginBottom: 40, opacity: 0.75 }}>
          Tout ce que vous devez savoir avant de réserver.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQ_ITEMS.map((faq, i) => (
            <div
              key={i}
              style={{ background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10, overflow: "hidden" }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}
              >
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: NAVY, letterSpacing: "0.02em", lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ color: CORAL, fontSize: 20, flexShrink: 0, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
              </button>
              {open === i && (
                <p style={{ margin: 0, padding: "0 24px 20px", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.8, color: TEXT }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Lien vers le guide */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <a href="/guide" style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: NAVY, textDecoration: "none", borderBottom: `1px solid ${CORAL}`, paddingBottom: 2 }}>
            Lire notre guide complet Sainte-Luce →
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Contact Section ──────────────────────────────────────────────
const EMAIL = "vinsmaf@hotmail.com";

function FooterSection() {
  const [form, setForm] = useState({ nom: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentError, setSentError] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setSentError(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: form.nom, email: form.email, message: form.message }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
        setForm({ nom: "", email: "", message: "" });
        if (window.gtag) window.gtag("event", "generate_lead", { method: "contact_form" });
      } else {
        setSentError(true);
      }
    } catch {
      setSentError(true);
    }
    setSending(false);
  }

  const waMsg = encodeURIComponent("Bonjour, je souhaite obtenir des informations sur une location Amaryllis.");

  return (
    <footer id="contact" style={{ background: "#072626" }}>
      {/* ── Contact ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 32px 48px", display: "flex", gap: 64, flexWrap: "wrap", alignItems: "flex-start", borderBottom: "1px solid rgba(250,245,233,0.08)" }}>

        {/* Left: info */}
        <div style={{ flex: "1 1 280px" }}>
          <svg width="36" height="36" viewBox="0 0 92 92" style={{ marginBottom: 20, opacity: 0.85 }}>
            <g transform="translate(46 46)" fill="none">
              {[0, 60, 120, 180, 240, 300].map((rot, i) => (
                <g key={i} transform={`rotate(${rot})`}>
                  <path d="M 0 0 L 0 -38 L 8 -20 Z" fill={CORAL} />
                </g>
              ))}
              <circle r="3" fill={GOLD} />
            </g>
          </svg>

          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 10, letterSpacing: "0.5em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Contact</div>
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 30, letterSpacing: "0.1em", textTransform: "uppercase", color: "#faf5e9", margin: "0 0 14px", lineHeight: 1.1 }}>
            Parlons de<br />votre séjour
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontStyle: "italic", color: "rgba(250,245,233,0.5)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 300 }}>
            Réservation, disponibilités, questions — nous répondons dans les 24h.
          </p>

          <a href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            onClick={() => { if (window.gtag) window.gtag("event", "generate_lead", { method: "whatsapp" }); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#25D366", color: "#fff", borderRadius: 6, padding: "12px 22px", marginBottom: 12, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", transition: "opacity 0.2s", width: "100%", maxWidth: 260, boxSizing: "border-box" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", maxWidth: 260 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(250,245,233,0.35)" strokeWidth="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <HoverContact light />
          </div>

        </div>

        {/* Right: form */}
        <div style={{ flex: "1 1 360px", maxWidth: 500 }}>
          {sent ? (
            <div style={{ background: "rgba(250,245,233,0.04)", border: "1px solid rgba(250,245,233,0.1)", borderRadius: 16, padding: "48px 36px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.15em", textTransform: "uppercase", color: "#faf5e9", marginBottom: 10 }}>Message envoyé</div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 15, color: "rgba(250,245,233,0.5)", lineHeight: 1.6, margin: "0 0 24px" }}>
                Nous vous répondrons dans les 24h.
              </p>
              <button onClick={() => setSent(false)} style={{ background: "none", border: "1px solid rgba(250,245,233,0.2)", color: "rgba(250,245,233,0.5)", borderRadius: 6, padding: "10px 20px", fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>
                Nouveau message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: "rgba(250,245,233,0.04)", border: "1px solid rgba(250,245,233,0.08)", borderRadius: 16, padding: "36px" }}>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(250,245,233,0.3)", marginBottom: 24 }}>
                Formulaire de contact
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <ContactField label="Votre nom" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} required dark autoComplete="name" />
                <ContactField label="Votre email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required dark autoComplete="email" />
              </div>
              <ContactField label="Votre message" value={form.message} onChange={v => setForm(f => ({ ...f, message: v }))} multiline required style={{ marginBottom: 22 }} dark />
              {sentError && (
                <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(196,114,84,0.15)", border: "1px solid rgba(196,114,84,0.3)", borderRadius: 6, fontFamily: "'Jost', sans-serif", fontSize: 12, color: CORAL }}>
                  Erreur d'envoi — contactez-nous sur WhatsApp.
                </div>
              )}
              <button type="submit" disabled={sending}
                style={{ width: "100%", background: CORAL, color: "#fff", border: "none", borderRadius: 6, padding: "13px 24px", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, letterSpacing: "0.15em", cursor: sending ? "default" : "pointer", textTransform: "uppercase", transition: "opacity 0.2s", opacity: sending ? 0.6 : 1 }}
                onMouseEnter={e => { if (!sending) e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={e => { if (!sending) e.currentTarget.style.opacity = "1"; }}
              >{sending ? "Envoi en cours…" : "Envoyer le message →"}</button>
            </form>
          )}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="16" height="16" viewBox="0 0 92 92">
            <g transform="translate(46 46)" fill="none">
              {[0, 60, 120, 180, 240, 300].map((rot, i) => (
                <g key={i} transform={`rotate(${rot})`}><path d="M 0 0 L 0 -38 L 8 -20 Z" fill="#f4ecdc" /></g>
              ))}
              <circle r="2.5" fill={GOLD} />
            </g>
          </svg>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "rgba(250,245,233,0.28)", letterSpacing: "0.05em" }}>
            © Amaryllis 2026 — Tous droits réservés
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 11, color: "rgba(250,245,233,0.35)", fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>🔒 Réservation directe propriétaire · Paiement sécurisé Stripe</span>
        </div>
      </div>
    </footer>
  );
}

function ContactField({ label, value, onChange, type = "text", multiline, required, style, dark, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const s = dark ? {
    background: "rgba(250,245,233,0.06)",
    border: `1px solid ${focused ? "rgba(196,114,84,0.5)" : "rgba(250,245,233,0.12)"}`,
    borderRadius: 8, color: "#faf5e9", padding: "11px 14px", width: "100%",
    fontSize: 16, outline: "none", fontFamily: "'Jost', sans-serif", fontWeight: 300,
    resize: "vertical", transition: "border-color 0.2s", boxSizing: "border-box",
  } : {
    background: CREAM,
    border: `1px solid ${focused ? "rgba(14,59,58,0.38)" : SAND}`,
    borderRadius: 8, color: TEXT, padding: "11px 14px", width: "100%",
    fontSize: 16, outline: "none", fontFamily: "'Jost', sans-serif", fontWeight: 300,
    resize: "vertical", transition: "border-color 0.2s", boxSizing: "border-box",
  };
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 10, color: dark ? "rgba(250,245,233,0.4)" : MUTED, marginBottom: 6, fontFamily: "'Jost', sans-serif", fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</label>
      {multiline
        ? <textarea rows={4} style={s} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} required={required} />
        : <input type={type} autoComplete={autoComplete} style={s} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} required={required} />}
    </div>
  );
}

// ── Thank you page ───────────────────────────────────────────────
function MerciPage() {
  const params = new URLSearchParams(window.location.search);
  const depositDone = params.get("deposit") === "1";
  const paymentRedirected = !!params.get("payment_intent");
  const depositCs = sessionStorage.getItem("deposit_cs");
  const depositAmt = Number(sessionStorage.getItem("deposit_amt") || 0);
  const depositBien = sessionStorage.getItem("deposit_bien") || "";

  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  // Payment redirected via 3DS + deposit pending → mount deposit form
  const showDepositForm = paymentRedirected && depositCs && !depositDone;

  useEffect(() => {
    if (window.Stripe) setStripe(window.Stripe(STRIPE_PK));
  }, []);

  useEffect(() => {
    if (!showDepositForm || !stripe || !depositCs) return;
    const appearance = { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } };
    const el = stripe.elements({ clientSecret: depositCs, appearance });
    el.create("payment").mount("#spe-merci-deposit");
    setElements(el);
  }, [showDepositForm, stripe, depositCs]);

  async function handleDepositMerci() {
    if (!stripe || !elements) return;
    setPaying(true); setError("");
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/merci?deposit=1" },
      redirect: "if_required",
    });
    if (err) setError(err.message);
    setPaying(false);
  }

  // Deposit completed → clear sessionStorage
  useEffect(() => {
    if (depositDone) {
      sessionStorage.removeItem("deposit_cs");
      sessionStorage.removeItem("deposit_amt");
      sessionStorage.removeItem("deposit_bien");
      sessionStorage.removeItem("deposit_checkin");
      sessionStorage.removeItem("deposit_checkout");
    }
  }, [depositDone]);

  // Purchase event pour les paiements 3DS redirigés vers /merci
  useEffect(() => {
    if (paymentRedirected && !depositDone && window.gtag) {
      const pi = params.get("payment_intent");
      window.gtag("event", "purchase", {
        transaction_id: pi,
        currency: "EUR",
        value: 0, // montant inconnu après redirect, GA4 compte quand même la conversion
      });
    }
  }, []);

  if (showDepositForm) {
    return (
      <div style={{ minHeight: "100vh", background: IVORY, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(200,85,61,0.1)", border: `2px solid ${CORAL}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 20px" }}>✓</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: NAVY, marginBottom: 8 }}>Paiement confirmé !</h1>
            <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>Une dernière étape : le dépôt de garantie pour <strong>{depositBien}</strong>.</p>
          </div>
          <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: "#92400e", fontSize: 14, marginBottom: 6 }}>🔒 Dépôt de garantie — {depositAmt.toLocaleString("fr-FR")} €</div>
            <div style={{ color: "#78350f", fontSize: 13, lineHeight: 1.6 }}>
              Montant <strong>bloqué</strong> mais <strong>non débité</strong>. Libéré automatiquement après votre départ sans dommages.
            </div>
          </div>
          <div id="spe-merci-deposit" style={{ marginBottom: 24 }} />
          <button
            onClick={handleDepositMerci}
            disabled={paying}
            style={{ ...btnPrimary, width: "100%", background: paying ? SAND : "#d97706", color: "#fff", opacity: paying ? 0.6 : 1 }}
          >
            {paying ? "Traitement…" : `🔒 Valider le blocage — ${depositAmt.toLocaleString("fr-FR")} €`}
          </button>
          {error && <div style={{ ...errStyle, marginTop: 12 }}>⚠ {error}</div>}
          <div style={{ marginTop: 16, textAlign: "center", color: MUTED, fontSize: 12 }}>🔒 Pré-autorisation sécurisée · Aucun débit sans dommage constaté</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: IVORY, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, textAlign: "center", padding: 32 }}>
      <div>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `rgba(200,85,61,0.1)`, border: `2px solid ${CORAL}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 28px" }}>✓</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12, color: NAVY }}>Réservation confirmée !</h1>
        <p style={{ color: MUTED, fontSize: 16, maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Merci pour votre réservation. Un email de confirmation vous sera envoyé dans quelques minutes.
        </p>
        {depositDone && (
          <p style={{ color: "#92400e", fontSize: 14, maxWidth: 380, margin: "-20px auto 28px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 16px" }}>
            🔒 Dépôt de garantie bloqué · Libéré automatiquement après votre séjour
          </p>
        )}
        <a href="/" style={{ ...btnPrimary, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, background: CORAL, color: "#fff" }}>← Retour à l'accueil</a>
      </div>
    </div>
  );
}

// ── Logo Nav Dropdown ─────────────────────────────────────────────
function LogoDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const NAV = [
    { label: "🏠  Accueil",            href: "/" },
    { label: "🏡  Nos propriétés",     href: "/#properties" },
    { label: "⭐  Nos avis",           href: "/avis" },
    { label: "🗺️  Guide Martinique",   href: "/guide" },
    { label: "📍  Carte interactive",  href: "/explorer" },
    { label: "❓  FAQ",                href: "/#faq" },
    { label: "💬  Contactez-nous",     href: "/#contact" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <svg width="30" height="30" viewBox="0 0 92 92">
          <g transform="translate(46 46)" stroke="#f4ecdc" strokeWidth="1" fill="none">
            {[0, 60, 120, 180, 240, 300].map((rot, i) => (
              <g key={i} transform={`rotate(${rot})`}>
                <path d="M 0 0 L 0 -38 L 8 -20 Z" fill="#f4ecdc" />
                <path d="M 0 0 L 0 -38 L -8 -20 Z" fill="none" stroke="#f4ecdc" strokeWidth="0.8" />
              </g>
            ))}
            <circle r="3" fill="#c9a673" />
          </g>
        </svg>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 15, letterSpacing: "0.55em", color: "#faf5e9", textTransform: "uppercase" }}>AMARYLLIS</div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 9, color: "rgba(250,245,233,0.4)", letterSpacing: "0.35em", textTransform: "uppercase", marginTop: 2 }}>LOCATIONS D'EXCEPTION</div>
        </div>
        <span style={{ fontSize: 9, color: "rgba(250,245,233,0.35)", marginLeft: -4, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 14px)", left: 0,
          background: "#0e3b3a",
          border: "1px solid rgba(250,245,233,0.1)",
          borderRadius: 14, padding: "8px",
          zIndex: 500, minWidth: 220,
          boxShadow: "0 20px 56px rgba(0,0,0,0.45)",
          animation: "fadeUp 0.18s ease both",
        }}>
          <div style={{ position: "absolute", top: -5, left: 24, transform: "rotate(45deg)", width: 10, height: 10, background: "#0e3b3a", borderTop: "1px solid rgba(250,245,233,0.1)", borderLeft: "1px solid rgba(250,245,233,0.1)" }} />
          {NAV.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              style={{
                display: "block", padding: "11px 16px",
                color: "rgba(250,245,233,0.8)",
                textDecoration: "none",
                fontFamily: "'Jost', sans-serif", fontWeight: 300,
                fontSize: 13, letterSpacing: "0.08em",
                borderRadius: 8, transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(196,114,84,0.12)"; e.currentTarget.style.color = "#faf5e9"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(250,245,233,0.8)"; }}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Property Dropdown (header) ────────────────────────────────────
function PropertyDropdown({ onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent",
          border: "1px solid rgba(250,245,233,0.18)",
          color: "rgba(250,245,233,0.75)",
          borderRadius: 20, padding: "5px 16px",
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 11, letterSpacing: "0.12em",
          cursor: "pointer", textTransform: "uppercase",
          transition: "all 0.18s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(196,114,84,0.5)"; e.currentTarget.style.color = "#faf5e9"; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = "rgba(250,245,233,0.18)"; e.currentTarget.style.color = "rgba(250,245,233,0.75)"; } }}
      >
        Nos propriétés
        <span style={{ fontSize: 9, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", left: 0,
          background: "#0e3b3a",
          border: "1px solid rgba(250,245,233,0.1)",
          borderRadius: 14, padding: "8px",
          zIndex: 500, minWidth: 280,
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          animation: "fadeUp 0.18s ease both",
        }}>
          {BIENS.map(b => (
            <button
              key={b.id}
              onClick={() => { onSelect(b); setOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "transparent", border: "none",
                color: "rgba(250,245,233,0.8)", borderRadius: 8,
                padding: "10px 14px", cursor: "pointer",
                textAlign: "left", transition: "background 0.15s",
                gap: 12,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(196,114,84,0.12)"; e.currentTarget.style.color = "#faf5e9"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(250,245,233,0.8)"; }}
            >
              <div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, letterSpacing: "0.05em" }}>{b.nom}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: "rgba(250,245,233,0.4)", letterSpacing: "0.05em", marginTop: 2 }}>{b.lieu}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hover Contact Preview ─────────────────────────────────────────
function HoverContact({ light = false, direction = "up", pill = false }) {
  const [show, setShow] = useState(false);
  const waMsg = encodeURIComponent("Bonjour, je souhaite obtenir des informations sur une location Amaryllis.");
  const baseColor = light ? "rgba(14,59,58,0.75)" : "rgba(250,245,233,0.6)";
  const dotColor  = light ? "rgba(14,59,58,0.35)" : "rgba(250,245,233,0.25)";

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {pill ? (
        <span style={{
          fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 600,
          color: "#faf5e9", cursor: "pointer",
          border: "1px solid rgba(250,245,233,0.3)",
          borderRadius: 20, padding: "6px 16px",
          letterSpacing: "0.06em", display: "inline-block",
          transition: "border-color 0.2s, background 0.2s",
          background: show ? "rgba(250,245,233,0.08)" : "transparent",
        }}>
          Contact
        </span>
      ) : (
      <span style={{
        fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300,
        color: baseColor, cursor: "default",
        borderBottom: `1px dotted ${dotColor}`,
        letterSpacing: "0.05em",
        paddingBottom: 1,
      }}>
        Contact
      </span>
      )}

      {show && (
        <div style={{
          position: "absolute",
          ...(direction === "down"
            ? { top: "calc(100% + 10px)" }
            : { bottom: "calc(100% + 10px)" }),
          left: "50%",
          transform: "translateX(-50%)",
          background: "#0e3b3a",
          border: "1px solid rgba(250,245,233,0.1)",
          borderRadius: 12, padding: "14px 16px",
          minWidth: 210, zIndex: 600,
          boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
          animation: "fadeUp 0.15s ease both",
          pointerEvents: "all",
        }}>
          {/* Arrow */}
          {direction === "up" && (
            <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: "#0e3b3a", borderRight: "1px solid rgba(250,245,233,0.1)", borderBottom: "1px solid rgba(250,245,233,0.1)" }} />
          )}
          {direction === "down" && (
            <div style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: "#0e3b3a", borderTop: "1px solid rgba(250,245,233,0.1)", borderLeft: "1px solid rgba(250,245,233,0.1)" }} />
          )}

          <a
            href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 9, color: "#faf5e9", textDecoration: "none", padding: "7px 0", borderBottom: "1px solid rgba(250,245,233,0.08)", fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, letterSpacing: "0.05em" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <a
            href={`mailto:${EMAIL}`}
            style={{ display: "flex", alignItems: "center", gap: 9, color: "#faf5e9", textDecoration: "none", padding: "7px 0 0", fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, letterSpacing: "0.05em" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(250,245,233,0.7)" strokeWidth="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email
          </a>
        </div>
      )}
    </div>
  );
}

// ── Devis Page ───────────────────────────────────────────────────
function DevisPage() {
  const params = new URLSearchParams(window.location.search);
  let data = null;
  try { data = JSON.parse(atob(params.get("d") || "")); } catch {}

  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [depElements, setDepElements] = useState(null);
  const [step, setStep] = useState(1); // 1=paiement 2=caution 3=done
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const appearance = { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } };

  useEffect(() => {
    if (window.Stripe) setStripe(window.Stripe(STRIPE_PK));
  }, []);

  useEffect(() => {
    if (!stripe || !data) return;
    const totalCents = Math.round((data.total || 0) * 100);
    if (totalCents < 50) return;
    (async () => {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: totalCents, currency: "eur", metadata: { bienId: data.bienId, checkin: data.checkin, checkout: data.checkout, voyageur: data.voyageur, email: data.email, type: "devis" } }),
        });
        const json = await res.json();
        if (json.error) { setError(json.error); return; }
        if (data.depot) {
          const dr = await fetch("/api/create-deposit-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: Math.round(data.depot * 100), currency: "eur", metadata: { bienId: data.bienId, checkin: data.checkin, checkout: data.checkout, voyageur: data.voyageur, email: data.email } }),
          });
          const dj = await dr.json();
          if (!dj.error && dj.clientSecret) {
            sessionStorage.setItem("deposit_cs", dj.clientSecret);
            sessionStorage.setItem("deposit_amt", String(data.depot));
            sessionStorage.setItem("deposit_bien", data.bienNom || data.bienId);
          }
        }
        const el = stripe.elements({ clientSecret: json.clientSecret, appearance });
        el.create("payment");
        setElements(el);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [stripe]); // data is decoded from URL at render and never changes

  useEffect(() => {
    if (step === 1 && elements) { const pe = elements.getElement("payment"); if (pe) pe.mount("#dp-pay"); }
    if (step === 2 && depElements) { const pe = depElements.getElement("payment"); if (pe) pe.mount("#dp-dep"); }
  }, [step, elements, depElements]);

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true); setError("");
    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/merci" },
      redirect: "if_required",
    });
    if (err) { setError(err.message); setPaying(false); return; }
    if (paymentIntent?.status === "succeeded") {
      const cs = sessionStorage.getItem("deposit_cs");
      if (data?.depot && cs) {
        const el2 = stripe.elements({ clientSecret: cs, appearance });
        el2.create("payment");
        setDepElements(el2);
        setStep(2);
      } else {
        window.location.href = "/merci";
      }
    }
    setPaying(false);
  }

  async function handleDeposit() {
    if (!stripe || !depElements) return;
    setPaying(true); setError("");
    const { error: err } = await stripe.confirmPayment({
      elements: depElements,
      confirmParams: { return_url: window.location.origin + "/merci?deposit=1" },
      redirect: "if_required",
    });
    if (err) { setError(err.message); }
    setPaying(false);
  }

  const fmtEur = v => v?.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  if (!data) return (
    <div style={{ minHeight: "100vh", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif" }}>
      <div style={{ textAlign: "center", color: NAVY }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 18 }}>Lien de devis invalide ou expiré.</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "Georgia,serif", padding: "40px 16px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: CORAL, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Devis personnalisé</div>
          <h1 style={{ fontSize: 26, color: NAVY, margin: 0 }}>{data.bienNom || data.bienId}</h1>
          {data.checkin && <div style={{ fontSize: 13, color: "#78716c", marginTop: 6 }}>{data.checkin} → {data.checkout}</div>}
          {data.voyageur && <div style={{ fontSize: 13, color: "#78716c" }}>Pour {data.voyageur}</div>}
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", marginBottom: 24, border: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Récapitulatif</div>
          {data.montantSejour > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#44403c", marginBottom: 6 }}><span>Séjour</span><span>{fmtEur(data.montantSejour)}</span></div>}
          {data.fraisMenage > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#44403c", marginBottom: 6 }}><span>Frais de ménage</span><span>{fmtEur(data.fraisMenage)}</span></div>}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: NAVY }}><span>Total</span><span>{fmtEur(data.total)}</span></div>
          {data.depot > 0 && <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(245,158,11,0.08)", borderRadius: 8, fontSize: 12, color: "#92400e" }}>🔒 Dépôt de garantie {fmtEur(data.depot)} — bloqué mais non débité</div>}
        </div>

        {step === 1 && (
          <>
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", marginBottom: 20, border: "1px solid rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>Paiement du séjour</div>
              <div id="dp-pay" />
            </div>
            {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}
            <button onClick={handlePay} disabled={paying || !elements} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: paying ? "#94a3b8" : CORAL, color: "#fff", fontSize: 15, fontWeight: 700, cursor: paying ? "default" : "pointer" }}>
              {paying ? "⏳ Traitement…" : `Payer ${fmtEur(data.total)}`}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: "#92400e", fontSize: 14, marginBottom: 6 }}>🔒 Dépôt de garantie — {fmtEur(data.depot)}</div>
              <div style={{ color: "#78350f", fontSize: 13, lineHeight: 1.6 }}>Ce montant sera <strong>bloqué</strong> sur votre carte mais <strong>non débité</strong>. Il sera libéré automatiquement à la fin de votre séjour si aucun dommage n'est constaté.</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", marginBottom: 20, border: "1px solid rgba(0,0,0,0.08)" }}>
              <div id="dp-dep" />
            </div>
            {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}
            <button onClick={handleDeposit} disabled={paying || !depElements} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: paying ? "#94a3b8" : "#f59e0b", color: "#fff", fontSize: 15, fontWeight: 700, cursor: paying ? "default" : "pointer" }}>
              {paying ? "⏳ Traitement…" : `🔒 Valider le dépôt — ${fmtEur(data.depot)}`}
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#a8a29e" }}>
          Paiement sécurisé · Stripe · SSL
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
// ── Cookie Consent Banner ─────────────────────────────────────────
function CookieBanner() {
  const key = "amaryllis_consent";
  const [visible, setVisible] = useState(() => !localStorage.getItem(key));

  function accept() {
    localStorage.setItem(key, "granted");
    if (window.gtag) window.gtag("consent", "update", { analytics_storage: "granted" });
    setVisible(false);
  }

  function refuse() {
    localStorage.setItem(key, "denied");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 2000,
      background: NAVY, borderTop: `2px solid ${CORAL}`,
      padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, flexWrap: "wrap",
    }}>
      <p style={{ color: "rgba(250,245,233,0.8)", fontSize: 13, margin: 0, maxWidth: 680, lineHeight: 1.6, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
        Nous utilisons Google Analytics pour mesurer la fréquentation du site et améliorer votre expérience. Aucune donnée n'est revendue à des tiers.{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: CORAL, textDecoration: "none" }}>En savoir plus</a>
      </p>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button onClick={refuse} style={{
          background: "transparent", border: `1px solid rgba(250,245,233,0.3)`,
          color: "rgba(250,245,233,0.6)", borderRadius: 6, padding: "8px 18px",
          fontSize: 12, fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em",
          textTransform: "uppercase", cursor: "pointer",
        }}>Refuser</button>
        <button onClick={accept} style={{
          background: CORAL, border: "none", color: "#fff",
          borderRadius: 6, padding: "8px 18px",
          fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
        }}>Accepter</button>
      </div>
    </div>
  );
}

// ── Leaflet loader (CDN, pas de npm install) ──────────────────────────────────
let leafletLoaded = false;
let leafletLoadCallbacks = [];
function loadLeaflet(cb) {
  if (window.L) { cb(); return; }
  if (leafletLoaded) { leafletLoadCallbacks.push(cb); return; }
  leafletLoaded = true;
  // CSS
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
  // JS
  const script = document.createElement("script");
  script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  script.onload = () => {
    leafletLoadCallbacks.forEach(fn => fn());
    leafletLoadCallbacks = [];
    cb();
  };
  document.head.appendChild(script);
}

function MapSection({ biens, onDetail }) {
  const [zone, setZone] = useState("martinique");
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markersRef = useRef([]);

  const martiniqueBiens = biens.filter(b => b.lieu?.includes("Martinique"));
  const idfBiens = biens.filter(b => !b.lieu?.includes("Martinique"));
  const activeBiens = zone === "martinique" ? martiniqueBiens : idfBiens;

  useEffect(() => {
    if (!mapRef.current) return;
    loadLeaflet(() => {
      const L = window.L;
      // Détruire la carte existante si zone change
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
        markersRef.current = [];
      }
      if (!mapRef.current) return;

      const center = zone === "martinique"
        ? [14.4730, -60.9195]
        : [48.8374, 2.4836];
      const zoom = zone === "martinique" ? 15 : 15;

      const map = L.map(mapRef.current, {
        center, zoom,
        zoomControl: true,
        scrollWheelZoom: false,
      });
      instanceRef.current = map;

      // Satellite ESRI
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles © Esri",
        maxZoom: 19,
      }).addTo(map);
      // Labels CartoDB par-dessus
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
        pane: "shadowPane",
      }).addTo(map);

      activeBiens.forEach(b => {
        if (!b.coords) return;
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background:${b.couleur || CORAL};
            color:#fff;
            border:2.5px solid #fff;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            width:34px;height:34px;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="transform:rotate(45deg);font-size:14px;line-height:1">🏠</span>
          </div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -36],
        });

        const popup = L.popup({ maxWidth: 220, className: "amaryllis-popup" }).setContent(`
          <div style="font-family:'Jost',system-ui,sans-serif;padding:4px 0;">
            <img src="${b.photos[0]}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;display:block;margin-bottom:8px;" />
            <div style="font-weight:700;font-size:14px;color:#0e3b3a;margin-bottom:2px;">${b.nom}</div>
            <div style="font-size:11px;color:#7a6b5a;margin-bottom:6px;">${b.lieu}</div>
            <div style="font-size:13px;color:#c47254;font-weight:700;margin-bottom:8px;">${PRICE_HIDDEN.has(b.id) ? "Location longue durée" : `À partir de ${b.prix}€ / nuit`}</div>
            <button onclick="window.__mapOpenDetail('${b.id}')" style="
              width:100%;padding:8px;border:none;border-radius:7px;
              background:#0e3b3a;color:#fff;font-size:12px;font-weight:600;cursor:pointer;">
              Voir le logement →
            </button>
          </div>
        `);

        const marker = L.marker([b.coords.lat, b.coords.lng], { icon })
          .bindPopup(popup)
          .addTo(map);
        markersRef.current.push(marker);
      });

      // Bridge pour les boutons dans les popups Leaflet
      window.__mapOpenDetail = (id) => {
        const b = biens.find(x => x.id === id);
        if (b) onDetail(b);
      };
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
      delete window.__mapOpenDetail;
    };
  }, [zone, activeBiens.map(b => b.id).join(",")]);

  // Ajoute le style popup Leaflet custom une seule fois
  useEffect(() => {
    if (document.getElementById("__leaflet_popup_style")) return;
    const s = document.createElement("style");
    s.id = "__leaflet_popup_style";
    s.textContent = `.amaryllis-popup .leaflet-popup-content-wrapper { border-radius:12px; padding:0; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.18); } .amaryllis-popup .leaflet-popup-content { margin:12px; width:196px !important; } .amaryllis-popup .leaflet-popup-tip { background:#fff; }`;
    document.head.appendChild(s);
  }, []);

  return (
    <section style={{ padding: "60px 0", background: IVORY }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: CORAL, fontFamily: "'Jost', sans-serif", fontWeight: 600, marginBottom: 6 }}>Nos adresses</div>
            <h2 style={{ margin: 0, fontSize: "clamp(22px,4vw,32px)", color: NAVY, fontFamily: "'Jost', sans-serif", fontWeight: 600, letterSpacing: "-0.5px" }}>Où nous trouver</h2>
          </div>
          {/* Zone toggle */}
          <div style={{ display: "flex", background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, overflow: "hidden" }}>
            {[
              { key: "martinique", label: "🌴 Martinique", count: martiniqueBiens.length },
              { key: "idf", label: "🗼 Île-de-France", count: idfBiens.length },
            ].map(({ key, label, count }) => (
              <button key={key} onClick={() => setZone(key)}
                style={{
                  padding: "9px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  fontFamily: "'Jost', sans-serif",
                  background: zone === key ? NAVY : "transparent",
                  color: zone === key ? "#fff" : MUTED,
                  transition: "all 0.18s",
                }}>
                {label} <span style={{ fontSize: 11, opacity: 0.7 }}>({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Layout : carte + liste logements */}
        <div className="map-grid">
          {/* Carte */}
          <div className="map-grid-map">
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          </div>

          {/* Liste des logements de la zone */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
              {activeBiens.length} logement{activeBiens.length > 1 ? "s" : ""} dans cette zone
            </div>
            {activeBiens.map(b => (
              <button key={b.id} onClick={() => onDetail(b)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, background: "#fff",
                  border: `1px solid ${SAND}`, borderRadius: 10, padding: "10px 12px",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.boxShadow = "0 2px 12px rgba(14,59,58,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = SAND; e.currentTarget.style.boxShadow = "none"; }}>
                <img src={b.photos[0]} alt={b.nom} style={{ width: 52, height: 52, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: NAVY, fontFamily: "'Jost', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.nom}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{b.lieu}</div>
                  <div style={{ fontSize: 12, color: CORAL, fontWeight: 700, marginTop: 2 }}>{PRICE_HIDDEN.has(b.id) ? "Location longue durée" : `À partir de ${b.prix}€ / nuit`}</div>
                </div>
                <span style={{ color: MUTED, fontSize: 16, flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PublicSite() {
  const { t } = useLang();
  const [selectedBien, setSelectedBien] = useState(null);
  const [bookingInitialDates, setBookingInitialDates] = useState({ checkin: null, checkout: null });
  const [beds24Bien, setBeds24Bien] = useState(null);
  const [beds24Dates, setBeds24Dates] = useState({ checkin: null, checkout: null });
  const [detailBien, setDetailBien] = useState(null);
  const [filterLieu, setFilterLieu] = useState("all");
  const [showFavorites, setShowFavorites] = useState(false);
  const [filterGuests, setFilterGuests] = useState(0);
  const [themeFilter, setThemeFilter] = useState("tout");
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("amaryllis_favorites") || "[]")); }
    catch { return new Set(); }
  });
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("amaryllis_dark") === "1"; } catch { return false; }
  });
  const [blockedDates, setBlockedDates] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const fetchAbortRef = useRef(null);
  const [priceOverrides, setPriceOverrides] = useState(loadPriceOverrides);
  const [curtainDone, setCurtainDone] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const exitShown = useRef(!!sessionStorage.getItem("amaryllis_exit_shown"));
  const [compareIds, setCompareIds] = useState(new Set());
  const [showComparator, setShowComparator] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("amaryllis_recent") || "[]"); } catch { return []; }
  });

  // Charger la config séjour minimum depuis le serveur au démarrage → met à jour le cache
  useEffect(() => {
    fetch("/api/site-config")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.config && Object.keys(d.config).length) {
          saveMinNightsConfig(d.config);
          _refreshMnCache(); // met à jour le cache + notifie tous les composants
        }
      })
      .catch(() => {});
  }, []);

  // Charger les tarifs depuis le serveur au démarrage → fusionne dans localStorage
  useEffect(() => {
    fetch("/api/site-config?type=prices")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.config && Object.keys(d.config).length) {
          applyServerPriceOverrides(d.config); // merge + dispatch amaryllis_prices_updated
        }
      })
      .catch(() => {});
  }, []);

  // Listen for admin price updates — même onglet ET autres onglets (cross-tab)
  useEffect(() => {
    const fn = () => setPriceOverrides(loadPriceOverrides());
    const storageFn = (e) => { if (!e.key || e.key === "amaryllis_prices") fn(); };
    window.addEventListener("amaryllis_prices_updated", fn); // même onglet
    window.addEventListener("storage", storageFn);           // autres onglets
    return () => {
      window.removeEventListener("amaryllis_prices_updated", fn);
      window.removeEventListener("storage", storageFn);
    };
  }, []);

  // Biens with live price overrides from admin
  const biensList = BIENS.map(b => ({ ...b, prix: priceOverrides[b.id] ?? b.prix }));

  // Fetch availability for a bien (used by detail view + booking modal)
  async function fetchAvailability(bienId) {
    // Abort any in-flight request before starting a new one
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;

    setBlockedDates([]);
    setLoadingAvail(true);
    try {
      let apiUrl = `/api/get-availability?bienId=${bienId}`;
      try {
        const bookingUrls = JSON.parse(localStorage.getItem("ical_urls_booking") || "{}");
        if (bookingUrls[bienId]) apiUrl += `&bookingUrl=${encodeURIComponent(bookingUrls[bienId])}`;
      } catch {}
      const r = await fetch(apiUrl, { signal: ctrl.signal });
      if (r.ok) {
        const d = await r.json();
        setBlockedDates(d.blockedDates || []);
      }
    } catch (e) {
      if (e.name !== "AbortError") { /* ignore aborted requests */ }
    }
    setLoadingAvail(false);
  }

  // Open property detail — updates URL + all SEO meta + fetches availability
  function openDetail(bien) {
    if (bien?.id) {
      window.location.href = `/${bien.id}`;
      return;
    }
    setDetailBien(bien);
    if (bien) {
      // Track recently viewed
      setRecentlyViewed(prev => {
        const next = [bien.id, ...prev.filter(id => id !== bien.id)].slice(0, 3);
        try { localStorage.setItem("amaryllis_recent", JSON.stringify(next)); } catch {}
        return next;
      });
      const url = `https://villamaryllis.com/${bien.id}`;
      const img = `https://villamaryllis.com/photos/${bien.id}/01.webp`;
      const isMartinique = bien.lieu?.includes("Martinique");
      const keyFeatures = (bien.amenities || []).slice(0, 3).join(", ");
      const priceStr = PRICE_HIDDEN.has(bien.id) ? "Location longue durée" : `À partir de ${bien.prix}€/nuit`;
      const title = isMartinique
        ? `${bien.nom} — Location villa ${keyFeatures ? `(${keyFeatures}) ` : ""}à ${bien.lieu.split(",")[0]} | ${priceStr}`
        : `${bien.nom} — ${bien.lieu} | Amaryllis — ${priceStr}`;
      const desc = bien.desc.slice(0, 155) + (bien.desc.length > 155 ? "…" : "");

      window.history.pushState({}, "", "/" + bien.id);
      document.title = title;

      const setMeta = (sel, attr, val) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
      setMeta('meta[name="description"]', "content", desc);
      setMeta('#canonical', "href", url);
      setMeta('#og-title', "content", title);
      setMeta('#og-description', "content", desc);
      setMeta('#og-url', "content", url);
      setMeta('#og-image', "content", img);
      setMeta('#tw-title', "content", title);
      setMeta('#tw-description', "content", desc);
      setMeta('#tw-image', "content", img);

      // JSON-LD Accommodation riche pour la propriété
      const ld = document.getElementById("ld-main");
      if (ld) {
        const locality = bien.lieu.split(",")[0]?.trim();
        ld.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "VacationRental",
              "@id": url,
              "name": bien.nom,
              "url": url,
              "description": bien.desc.slice(0, 300),
              "image": (bien.photos || []).slice(0, 8).map(p => ({
                "@type": "ImageObject",
                "url": `https://villamaryllis.com${p}`,
                "contentUrl": `https://villamaryllis.com${p}`,
              })),
              "address": {
                "@type": "PostalAddress",
                "addressLocality": locality,
                "addressRegion": isMartinique ? "Martinique" : "Île-de-France",
                "addressCountry": isMartinique ? "MQ" : "FR",
                "postalCode": isMartinique ? "97228" : "94130",
              },
              ...(bien.coords ? { "geo": { "@type": "GeoCoordinates", "latitude": bien.coords.lat, "longitude": bien.coords.lng } } : {}),
              ...(bien.rating ? {
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": bien.rating.replace(",", "."),
                  "reviewCount": bien.reviews || 1,
                  "bestRating": "5",
                  "worstRating": "1"
                }
              } : bien.id === "amaryllis" ? {
                "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5", "reviewCount": "20", "bestRating": "5", "worstRating": "1" }
              } : {}),
              ...(bien.chambres ? { "numberOfRooms": String(bien.chambres) } : {}),
              "accommodationCategory": isMartinique ? "Villa" : "Appartement",
              "amenityFeature": (bien.amenities || []).map(e => ({ "@type": "LocationFeatureSpecification", "name": e, "value": true })),
              "petsAllowed": (bien.amenities || []).some(a => /animaux/i.test(a)),
              "occupancy": { "@type": "QuantitativeValue", "maxValue": bien.capacite },
              "checkinTime": "17:00",
              "checkoutTime": "12:00",
              ...(!PRICE_HIDDEN.has(bien.id) ? {
                "offers": {
                  "@type": "Offer",
                  "price": bien.prix,
                  "priceCurrency": "EUR",
                  "priceSpecification": {
                    "@type": "UnitPriceSpecification",
                    "price": bien.prix,
                    "priceCurrency": "EUR",
                    "unitText": "nuit",
                  },
                  "description": `À partir de ${bien.prix}€/nuit — réservation directe sans frais de service`,
                  "url": url,
                  "availability": "https://schema.org/InStock",
                  "seller": { "@id": "https://villamaryllis.com/#organization" },
                }
              } : {}),
              "tourBookingPage": url,
              "provider": { "@id": "https://villamaryllis.com/#organization" },
              "isPartOf": { "@id": "https://villamaryllis.com/#organization" }
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://villamaryllis.com/" },
                { "@type": "ListItem", "position": 2, "name": bien.nom, "item": url }
              ]
            },
            {
              "@type": ["Organization", "LodgingBusiness"],
              "@id": "https://villamaryllis.com/#organization",
              "name": "Amaryllis Locations",
              "url": "https://villamaryllis.com",
              "telephone": "+33610880772",
              "email": "contact@villamaryllis.com",
              "priceRange": "€€€",
              "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5", "reviewCount": "20", "bestRating": "5", "worstRating": "1" }
            }
          ]
        });
      }

      // GA4 — vue fiche villa (funnel : view_item → begin_checkout → purchase)
      if (window.gtag) window.gtag("event", "view_item", {
        item_list_id: "villas",
        items: [{ item_id: bien.id, item_name: bien.nom, item_category: bien.lieu?.split(",")[0]?.trim() || "Martinique", price: bien.prix || 0, currency: "EUR" }],
      });

      if (!BOOKING_DISABLED.has(bien.id) && !bien.beds24Url) fetchAvailability(bien.id);
    } else {
      const homeTitle = "Amaryllis — Location villa Martinique avec piscine | Réservation directe";
      const homeDesc = "Louez directement nos villas et appartements en Martinique (Sainte-Luce, Schœlcher) et en Île-de-France. Piscine à débordement, vue mer, jacuzzi privatif. Sans frais de service Airbnb.";

      window.history.pushState({}, "", "/");
      document.title = homeTitle;

      const setMeta = (sel, attr, val) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
      setMeta('meta[name="description"]', "content", homeDesc);
      setMeta('#canonical', "href", "https://villamaryllis.com/");
      setMeta('#og-title', "content", homeTitle);
      setMeta('#og-description', "content", homeDesc);
      setMeta('#og-url', "content", "https://villamaryllis.com/");
      setMeta('#og-image', "content", "https://villamaryllis.com/photos/amaryllis/01.webp");
      setMeta('#tw-title', "content", homeTitle);
      setMeta('#tw-description', "content", homeDesc);
      setMeta('#tw-image', "content", "https://villamaryllis.com/photos/amaryllis/01.webp");

      // Restaurer le JSON-LD global (home)
      const ld = document.getElementById("ld-main");
      if (ld) {
        ld.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["Organization", "LodgingBusiness"],
              "@id": "https://villamaryllis.com/#organization",
              "name": "Amaryllis Locations",
              "url": "https://villamaryllis.com",
              "telephone": "+33610880772",
              "email": "contact@villamaryllis.com",
              "priceRange": "€€€",
              "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5", "reviewCount": "20", "bestRating": "5", "worstRating": "1" }
            },
            { "@type": "WebSite", "@id": "https://villamaryllis.com/#website", "url": "https://villamaryllis.com", "name": "Amaryllis Locations" }
          ]
        });
      }

      setBlockedDates([]);
    }
  }

  async function openBien(bien, initialCheckin = null, initialCheckout = null) {
    if (BOOKING_DISABLED.has(bien.id)) return;
    if (bien.beds24Url) {
      openDetail(null);
      setBeds24Bien(bien);
      setBeds24Dates({ checkin: initialCheckin, checkout: initialCheckout });
      return;
    }
    openDetail(null);
    setBookingInitialDates({ checkin: initialCheckin, checkout: initialCheckout });
    setSelectedBien(bien);
    await fetchAvailability(bien.id);
  }

  function toggleCompare(e, id) {
    e.stopPropagation();
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 3) { next.add(id); }
      return next;
    });
  }

  function toggleFavorite(e, id) {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("amaryllis_favorites", JSON.stringify([...next]));
      return next;
    });
  }

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "";
    try { localStorage.setItem("amaryllis_dark", darkMode ? "1" : "0"); } catch {}
  }, [darkMode]);

  // Exit intent — desktop : souris sort par le haut après 10s sur la page
  useEffect(() => {
    let ready = false;
    const t = setTimeout(() => { ready = true; }, 10000);
    const fn = (e) => {
      if (!ready || exitShown.current || e.clientY > 10) return;
      exitShown.current = true;
      sessionStorage.setItem("amaryllis_exit_shown", "1");
      setShowExitIntent(true);
    };
    document.addEventListener("mouseleave", fn);
    return () => { clearTimeout(t); document.removeEventListener("mouseleave", fn); };
  }, []);

  // Auto-open property detail if URL matches a bien ID (e.g. /amaryllis)
  useEffect(() => {
    const pathId = window.location.pathname.slice(1);
    if (pathId && pathId !== "merci" && pathId !== "devis") {
      const match = BIENS.find(b => b.id === pathId);
      if (match) {
        const withPrice = { ...match, prix: loadPriceOverrides()[match.id] ?? match.prix };
        setDetailBien(withPrice);
        if (!BOOKING_DISABLED.has(match.id) && !match.beds24Url) fetchAvailability(match.id);
      }
    }
  }, []);

  // Back button — fermer la fiche / modale quand l'utilisateur appuie sur Retour
  useEffect(() => {
    const onPop = () => {
      setDetailBien(null);
      setSelectedBien(null);
      setBookingInitialDates({ checkin: null, checkout: null });
      setBlockedDates([]);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const path = window.location.pathname;
  if (path === "/merci") return <MerciPage />;
  if (path === "/devis") return <DevisPage />;

  // ── Mode page propriété directe ──────────────────────────────
  const _directPathId = window.location.pathname.slice(1);
  const _directBien = _directPathId ? BIENS.find(b => b.id === _directPathId) : null;
  if (_directBien) {
    const directBienWithPrice = { ..._directBien, prix: loadPriceOverrides()[_directBien.id] ?? _directBien.prix };
    return (
      <div style={{ background: IVORY, fontFamily: "'Jost', system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
        <SEOMeta
          title={`${_directBien.nom} — ${_directBien.lieu} — Réservation directe`}
          description={`Réservez ${_directBien.nom} à ${_directBien.lieu}. ${_directBien.capacite} voyageurs. À partir de ${directBienWithPrice.prix}€/nuit. Réservation directe sans commission Airbnb.`}
          canonical={`/${_directBien.id}`}
          image={`https://villamaryllis.com/photos/${_directBien.id}/01.webp`}
        />
        <PropertyDetail
          bien={directBienWithPrice}
          isPage={true}
          onClose={() => { window.location.href = "/"; }}
          onBook={openBien}
          blockedDates={blockedDates}
          loadingAvail={loadingAvail}
        />
        {selectedBien && (
          <BookingModal
            bien={selectedBien}
            blockedDates={blockedDates}
            loadingAvail={loadingAvail}
            onClose={() => { setSelectedBien(null); setBookingInitialDates({ checkin: null, checkout: null }); }}
            initialCheckin={bookingInitialDates.checkin}
            initialCheckout={bookingInitialDates.checkout}
          />
        )}
        {beds24Bien && <Beds24Modal bien={beds24Bien} checkin={beds24Dates.checkin} checkout={beds24Dates.checkout} onClose={() => { setBeds24Bien(null); setBeds24Dates({ checkin: null, checkout: null }); }} />}
      </div>
    );
  }

  const lieux = [
    { key: "all", label: t("filterAll") },
    { key: "Martinique", label: t("martinique") },
    { key: "Île-de-France", label: t("idf") },
  ];

  const THEME_FILTERS = {
    "tout":       () => true,
    "vue-mer":    b => (b.amenities || []).some(a => /vue/i.test(a)),
    "piscine":    b => (b.amenities || []).some(a => /piscine|jacuzzi/i.test(a)),
    "famille":    b => b.capacite >= 5,
    "couple":     b => b.capacite <= 2,
    "martinique": b => (b.lieu || "").includes("Martinique"),
    "idf":        b => (b.lieu || "").includes("Île-de-France"),
  };

  const filtered = biensList
    .filter(b => filterLieu === "all" || b.lieu.includes(filterLieu))
    .filter(b => !showFavorites || favorites.has(b.id))
    .filter(b => filterGuests === 0 || b.capacite >= filterGuests)
    .filter(b => (THEME_FILTERS[themeFilter] || (() => true))(b));

  /* ── SEO dynamique par bien ── */
  const _pathId  = window.location.pathname.slice(1);
  const _metaBien = _pathId ? BIENS.find(b => b.id === _pathId) : null;

  return (
    <div id="top" style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
      <SEOMeta
        title={_metaBien ? `${_metaBien.nom} — Villa Martinique, piscine vue mer | Amaryllis` : undefined}
        description={_metaBien ? `Réservez ${_metaBien.nom} à ${_metaBien.lieu}. Piscine, vue mer, jacuzzi privatif. ${_metaBien.capacite} voyageurs. À partir de ${_metaBien.prix}€/nuit. Réservation directe sans frais Airbnb.` : undefined}
        canonical={_metaBien ? `/${_metaBien.id}` : "/"}
        image={_metaBien ? `https://villamaryllis.com/photos/${_metaBien.id}/01.webp` : undefined}
      />
      {/* H1 SEO — visible uniquement pour les moteurs de recherche */}
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
        Location villa Martinique avec piscine — Amaryllis, réservation directe sans frais
      </h1>

      {!curtainDone && <Curtain onDone={() => setCurtainDone(true)} />}
      <CookieBanner />

      {/* ── NAVIGATION ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{
          height: 62,
          background: scrolled ? NAVY : "rgba(7,18,42,0.45)",
          backdropFilter: scrolled ? "none" : "blur(6px)",
          WebkitBackdropFilter: scrolled ? "none" : "blur(6px)",
          padding: "0 28px",
          display: "flex", alignItems: "center",
          borderBottom: scrolled ? "1px solid rgba(250,245,233,0.07)" : "none",
          transition: "background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease",
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 20 }}>
            {/* Logo menu */}
            <LogoDropdown />

            {/* Separator */}
            <div style={{ width: 1, height: 20, background: "rgba(250,245,233,0.12)", flexShrink: 0 }} />

            {/* Property selector — fills center */}
            <div style={{ flex: 1 }}>
              <PropertyDropdown onSelect={openDetail} />
            </div>

            {/* Right: liens + contact CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
              <a href="/guide" style={{ fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300, color: "rgba(250,245,233,0.6)", textDecoration: "none", letterSpacing: "0.08em", whiteSpace: "nowrap", display: window.innerWidth < 860 ? "none" : "block", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#faf5e9"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(250,245,233,0.6)"}
              >
                {t("exploreLink")}
              </a>
              <a href="/avis" style={{ fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300, color: "rgba(250,245,233,0.6)", textDecoration: "none", letterSpacing: "0.08em", whiteSpace: "nowrap", display: window.innerWidth < 860 ? "none" : "block", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#faf5e9"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(250,245,233,0.6)"}
              >
                Avis
              </a>
              <LangToggle />
              {/* CTA Contact — pill */}
              <HoverContact direction="down" pill /></div>
          </div>
        </div>
      </header>

      {/* ── SEARCH BY DATES ── */}
      <SearchByDates biens={biensList} onBook={openBien} onDetail={openDetail} />

      {/* ── HERO CAROUSEL ── */}
      <HeroCarousel biens={biensList} onDetail={openDetail} onBook={openBien} />

      {/* ── TRUST STRIP ── */}
      <div style={{ background: CREAM, borderBottom: `1px solid ${SAND}`, padding: "10px 28px", textAlign: "center" }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: MUTED, letterSpacing: "0.04em" }}>
          ✓ Paiement 100% sécurisé Stripe &nbsp;·&nbsp; ✓ Réservation directe − zéro frais Airbnb &nbsp;·&nbsp; ✓ Assistance 7j/7 par WhatsApp
        </span>
      </div>

      {/* ── DIRECT BOOKING BANNER ── */}
      <div style={{ background: "#072626", borderBottom: "1px solid rgba(250,245,233,0.07)", padding: "13px 28px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
          {[
            t("banner1"), t("banner2"), t("banner3"),
          ].map(t => (
            <span key={t} style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: "rgba(250,245,233,0.55)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection onDetail={openDetail} />

      {/* ── QUICK BOOK ── */}
      <QuickBook biens={biensList} onBook={openBien} />

      {/* ── PROPERTIES SECTION ── */}
      <div id="properties" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px", background: IVORY }}>

        {/* Section header + filters */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: 32, fontWeight: 200, letterSpacing: "0.15em", textTransform: "uppercase", color: NAVY, margin: "0 0 12px" }}>
            {t("sectionTitle")}
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 15, color: MUTED, lineHeight: 1.7, margin: "0 0 32px", maxWidth: 720 }}>
            {t("sectionSub")}
          </p>

          {/* ── Filtres thématiques ── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
            {[
              { key: "tout",       label: "Tout",              icon: "✦" },
              { key: "vue-mer",    label: "Vue mer",           icon: "🌊" },
              { key: "piscine",    label: "Piscine / Jacuzzi", icon: "🏊" },
              { key: "famille",    label: "Famille (5+)",      icon: "👨‍👩‍👧" },
              { key: "couple",     label: "Couple",            icon: "💑" },
              { key: "martinique", label: "Martinique",        icon: "🌴" },
              { key: "idf",        label: "Île-de-France",     icon: "🏙️" },
            ].map(({ key, label, icon }) => {
              const active = themeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => { setThemeFilter(key); setShowFavorites(false); }}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 20,
                    border: `1px solid ${active ? CORAL : SAND}`,
                    background: active ? CORAL : "transparent",
                    color: active ? "#fff" : MUTED,
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: active ? 600 : 400,
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: 5,
                    letterSpacing: 0.3,
                  }}
                >
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
            {lieux.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFilterLieu(key); setShowFavorites(false); }}
                style={{
                  padding: "8px 20px",
                  borderRadius: 20,
                  border: `1px solid ${filterLieu === key && !showFavorites ? "rgba(196,114,84,0.53)" : SAND}`,
                  background: filterLieu === key && !showFavorites ? `rgba(200,85,61,0.08)` : "transparent",
                  color: filterLieu === key && !showFavorites ? CORAL : MUTED,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: filterLieu === key && !showFavorites ? 700 : 400,
                  transition: "all 0.2s",
                  letterSpacing: 0.5,
                }}
              >
                {label}
              </button>
            ))}
            {/* Séparateur */}
            <div style={{ width: 1, height: 18, background: SAND, margin: "0 4px" }} />
            {/* Chip Favoris */}
            <button
              onClick={() => { setShowFavorites(f => !f); }}
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                border: `1px solid ${showFavorites ? "#e8598a88" : SAND}`,
                background: showFavorites ? "rgba(232,89,138,0.08)" : "transparent",
                color: showFavorites ? "#e8598a" : MUTED,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: showFavorites ? 700 : 400,
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 14 }}>{showFavorites ? "♥" : "♡"}</span>
              {t("filterFav")}
              {favorites.size > 0 && (
                <span style={{
                  background: showFavorites ? "#e8598a" : SAND,
                  color: showFavorites ? "#fff" : MUTED,
                  borderRadius: 10, fontSize: 10, fontWeight: 700,
                  padding: "1px 6px", lineHeight: 1.5,
                  transition: "all 0.2s",
                }}>
                  {favorites.size}
                </span>
              )}
            </button>
            {/* Message si aucun favori et filtre actif */}
            {showFavorites && favorites.size === 0 && (
              <span style={{ fontSize: 12, color: MUTED, fontFamily: "'Jost',sans-serif", fontStyle: "italic" }}>
                {t("addFav")}
              </span>
            )}
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: SAND, margin: "0 0 16px" }} />

          {/* ── Filtre voyageurs ── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 32 }}>
            <span style={{ fontSize: 12, color: MUTED, fontFamily: "'Jost',sans-serif", fontWeight: 500, letterSpacing: "0.06em", marginRight: 4 }}>
              {t("filterGuests")}
            </span>
            {[
              { key: 0, label: t("guestAll") },
              { key: 2, label: "2+" },
              { key: 4, label: "4+" },
              { key: 6, label: "6+" },
              { key: 8, label: "8+" },
            ].map(({ key, label }) => {
              const active = filterGuests === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilterGuests(key)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: `1px solid ${active ? "rgba(14,59,58,0.6)" : SAND}`,
                    background: active ? NAVY : "transparent",
                    color: active ? IVORY : MUTED,
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "'Jost',sans-serif",
                    fontWeight: active ? 600 : 400,
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                </button>
              );
            })}
            {filterGuests > 0 && (
              <span style={{ fontSize: 11, color: MUTED, fontStyle: "italic", marginLeft: 4 }}>
                {t("nResults", filtered.length)}
              </span>
            )}
          </div>
        </div>

        {/* ── Reassurance block ── */}
        <div style={{ marginBottom: 52 }}>
          <Reveal anim="fadeUp" delay={0} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 14, padding: "28px 28px 24px", maxWidth: 560 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, marginBottom: 14 }}>{t("whyTitle")}</div>
            {[
              ["💰", t("why1t"), t("why1d")],
              ["⚡", t("why2t"), t("why2d")],
              ["🎯", t("why3t"), t("why3d")],
              ["🔒", t("why4t"), t("why4d")],
            ].map(([icon, title, text]) => (
              <div key={title} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, color: NAVY, marginBottom: 2 }}>{title}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{text}</div>
                </div>
              </div>
            ))}
          </Reveal>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24 }}>
          {filtered.map((b, i) => (
            <Reveal key={b.id} delay={Math.min(i * 0.08, 0.4)}>
              <BienCard bien={b} onDetail={openDetail} onBook={openBien} isFavorite={favorites.has(b.id)} onToggleFavorite={toggleFavorite} isCompared={compareIds.has(b.id)} onToggleCompare={toggleCompare} compareDisabled={compareIds.size >= 3 && !compareIds.has(b.id)} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── CARTE ── */}
      <Reveal anim="fadeIn" threshold={0.05}>
        <MapSection biens={biensList} onDetail={openDetail} />
      </Reveal>

      {/* ── RÉCEMMENT CONSULTÉS ── */}
      {recentlyViewed.length > 0 && !detailBien && (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED, marginBottom: 16 }}>
            Récemment consultés
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {recentlyViewed.map(id => {
              const b = biensList.find(x => x.id === id);
              if (!b) return null;
              return (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", transition: "box-shadow 0.15s" }}
                  onClick={() => openDetail(b)}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(14,59,58,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
                  <img src={b.photos[0]} alt={b.nom} style={{ width: 48, height: 48, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, color: NAVY }}>{b.nom}</div>
                    {!PRICE_HIDDEN.has(b.id) && (
                      <div style={{ fontSize: 12, color: CORAL, fontWeight: 600 }}>À partir de {b.prix}€/nuit</div>
                    )}
                  </div>
                  <span style={{ color: CORAL, fontSize: 13, marginLeft: 4 }}>Voir →</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FAQ + GUIDE ── */}
      <Reveal anim="fadeUp" threshold={0.08}>
        <FaqSection />
      </Reveal>

      {/* ── FOOTER + CONTACT ── */}
      <FooterSection />

      {/* ── PROPERTY DETAIL ── */}
      {detailBien && !selectedBien && (
        <PropertyDetail bien={detailBien} onClose={() => openDetail(null)} onBook={openBien} blockedDates={blockedDates} loadingAvail={loadingAvail} />
      )}

      {/* ── BEDS24 MODAL (Nogent) ── */}
      {beds24Bien && (
        <Beds24Modal bien={beds24Bien} checkin={beds24Dates.checkin} checkout={beds24Dates.checkout} onClose={() => { setBeds24Bien(null); setBeds24Dates({ checkin: null, checkout: null }); }} />
      )}

      {/* ── BOOKING MODAL ── */}
      {selectedBien && (
        <BookingModal bien={selectedBien} blockedDates={blockedDates} loadingAvail={loadingAvail} onClose={() => { setSelectedBien(null); setBookingInitialDates({ checkin: null, checkout: null }); }} initialCheckin={bookingInitialDates.checkin} initialCheckout={bookingInitialDates.checkout} />
      )}

      {/* ── EXIT INTENT ── */}
      {showExitIntent && !detailBien && !selectedBien && (
        <ExitIntentModal onClose={() => setShowExitIntent(false)} />
      )}

      {/* ── COMPARATEUR — barre sticky ── */}
      {compareIds.size >= 2 && !detailBien && !selectedBien && !showComparator && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 700,
          background: NAVY, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px", boxShadow: "0 -4px 24px rgba(0,0,0,0.25)",
          animation: "slideUpFull 0.25s ease",
          gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            {[...compareIds].map(id => {
              const b = biensList.find(x => x.id === id);
              return b ? (
                <div key={id} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.1)", borderRadius:6, padding:"4px 10px" }}>
                  <img src={b.photos[0]} alt={b.nom} style={{ width:28, height:28, borderRadius:4, objectFit:"cover" }} />
                  <span style={{ fontSize:13, fontWeight:500 }}>{b.nom}</span>
                  <button onClick={e => toggleCompare(e, id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:16, lineHeight:1, padding:"0 2px" }}>×</button>
                </div>
              ) : null;
            })}
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {compareIds.size < 3 ? (
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>
                {t("addMore", 3 - compareIds.size)}
              </span>
            ) : (
              <span style={{ fontSize:12, color: CORAL, fontWeight: 600 }}>
                {t("maxReached")}
              </span>
            )}
            <button
              onClick={() => setShowComparator(true)}
              style={{ background:CORAL, border:"none", color:"#fff", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
              {t("compareBtn", compareIds.size)}
            </button>
            <button
              onClick={() => setCompareIds(new Set())}
              style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.25)", color:"rgba(255,255,255,0.7)", borderRadius:8, padding:"9px 14px", fontSize:12, cursor:"pointer" }}>
              {t("clearAll")}
            </button>
          </div>
        </div>
      )}

      {/* ── COMPARATEUR — modal ── */}
      {showComparator && (
        <ComparatorModal
          biens={[...compareIds].map(id => biensList.find(b => b.id === id)).filter(Boolean)}
          onClose={() => setShowComparator(false)}
        />
      )}

      {/* ── WHATSAPP FLOTTANT ── visible homepage (après scroll) ET sur la fiche villa */}
      {!selectedBien && !beds24Bien && (scrolled || detailBien) && (
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${detailBien ? encodeURIComponent(`Bonjour, j'ai une question sur ${detailBien.nom} à Sainte-Luce. `) : WA_MSG_DEFAULT}`}
          target="_blank" rel="noopener noreferrer"
          title="Nous contacter sur WhatsApp"
          style={{
            position: "fixed", bottom: showComparator ? 84 : 24, right: 22, zIndex: 950,
            width: 54, height: 54, borderRadius: "50%",
            background: "#25D366",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 18px rgba(37,211,102,0.45)",
            textDecoration: "none",
            animation: "fadeIn 0.4s ease",
            transition: "transform 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────
const btnPrimary = {
  border: "none", borderRadius: 6,
  padding: "13px 26px",
  fontWeight: 700, fontSize: 14,
  cursor: "pointer",
  transition: "opacity 0.2s, transform 0.1s",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  letterSpacing: 1, textTransform: "uppercase",
};
const btnBack = {
  background: "transparent",
  border: `1px solid ${SAND}`,
  color: MUTED, borderRadius: 6,
  padding: "13px 20px",
  fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const errStyle = {
  color: CORAL, marginTop: 14, fontSize: 13,
  background: "rgba(200,85,61,0.06)",
  border: `1px solid rgba(200,85,61,0.2)`,
  borderRadius: 8, padding: "10px 14px",
};
