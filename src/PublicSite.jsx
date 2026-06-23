import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { getAttributionMetadata } from "./lib/trackingAttribution.js";
import MerciPage from "./Merci.jsx";
import { loadDailyPrices, applyServerPriceOverrides } from "./seedPrices.js";
import SEOMeta from "./SEOMeta.jsx";
import { Reveal } from "./useReveal.jsx";
import { useLang, LangToggle } from "./i18n.jsx";
import { Eyebrow, Display, Editorial, Button, RatingBadge, Icon, ThemeToggle, Chip, StateTile, RImg } from "./primitives.jsx";
import LienAffilie from "./components/LienAffilie.jsx";
import { Curtain } from "./Curtain.jsx";
import { getVariant, trackConversion } from "./utils/abTest.js";
import { depositAmount, balanceAmount, balanceDueDate, isTwoPartEligible } from "./utils/paymentPlan.js";
import { getDiscount, discountLabel } from "./utils/pricing.js";
import { mpTrack } from "./lib/metaPixel.js";
import { ssGet, ssSet } from "./lib/safeStorage.js";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import { BIENS as CANON, isMartinique as isMartiniqueCanon } from "./data/biens.js";

// Noms canoniques des biens pour le maillage interne SEO ("villa" = Amaryllis + Iguana uniquement).
const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };

// A/B test growth-001 : libellé du CTA réservation principal
// Variante A (contrôle) = "RÉSERVER" · Variante B = "VÉRIFIER LES DISPOS"
const CTA_AB_VARIANT = getVariant("cta_label");
const CTA_LABEL_FR = CTA_AB_VARIANT === "B" ? "VÉRIFIER LES DISPOS" : "RÉSERVER";
const PropertyMap = lazy(() => import("./PropertyMap.jsx"));
const VillaAmaryllisReel = lazy(() => import("./components/reel/VillaAmaryllisReel.jsx"));
const GekoReel      = lazy(() => import("./components/reel/GekoReel.jsx"));
const ZandoliReel   = lazy(() => import("./components/reel/ZandoliReel.jsx"));
const MabouaReel    = lazy(() => import("./components/reel/MabouaReel.jsx"));
const SchoelcherReel = lazy(() => import("./components/reel/SchoelcherReel.jsx"));
const NogentReel    = lazy(() => import("./components/reel/NogentReel.jsx"));

// data-049 — niveau tarifaire pour le tracking GA4 ROI (par bien + saison).
// Saison Martinique : haute nov–avr, moyenne juil–août, basse mai/juin/sept/oct.
// Repli sur la gamme de prix du bien si aucune date de séjour n'est connue.
function niveauTarifaire(bien, checkinIso) {
  if (checkinIso) {
    const d = new Date(checkinIso);
    if (!isNaN(d)) {
      const m = d.getMonth() + 1;
      if (m >= 11 || m <= 4) return "haute";
      if (m === 7 || m === 8) return "moyenne";
      return "basse";
    }
  }
  const p = Number(bien?.prix) || 0;
  if (p >= 250) return "premium";
  if (p >= 150) return "intermediaire";
  return "essentiel";
}

// ── Availability cache (module-level, survit aux re-renders) ──────
const _availCache = {}; // { [bienId]: { data: string[], ts: number } }
const AVAIL_CACHE_TTL = 5 * 60 * 1000; // 5 min

// ── Retry utility for availability fetch ────────────────────────
async function fetchWithRetry(url, options = {}, retries = 3, delay = 800) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status >= 500 && i < retries - 1) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
        continue;
      }
      return res;
    } catch (e) {
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay * (i + 1)));
      else throw e;
    }
  }
}

// ── Brand palette (from logos.jsx) ──────────────────────────────
// Remises par durée de séjour : getDiscount / discountLabel importés depuis ./utils/pricing.js

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
const PET_SUPPLEMENT  = 40; // € / séjour (1 ou 2 animaux = même forfait)
const MAX_PETS        = 2;
const EARLY_LATE_FEE  = { amaryllis: 80 }; // €/option · défaut 50€ autres biens
// Biens où les animaux sont interdits (pas de sélecteur)
const PETS_FORBIDDEN = new Set(["nogent"]);

// Biens désactivés à la réservation (ex: longue durée)
const BOOKING_DISABLED = new Set(["iguana"]);
// Biens sans affichage de prix (location longue durée)
const PRICE_HIDDEN = new Set(["iguana"]);
// Biens où l'on masque le bloc "Tarifs prévisionnels" (PricingCalendar) :
// grille saisonnière statique jugée redondante/non dynamique → on s'appuie sur le
// calendrier de disponibilités/réservation qui lit les prix réels (onglet admin Tarifs).
const PRICING_CAL_HIDDEN = new Set(["amaryllis", "geko", "mabouya", "zandoli", "schoelcher", "nogent"]);

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
  // Google Fonts chargées en superset dans index.html via <link rel="stylesheet">
  // — injection dynamique supprimée (évite une double requête fonts.googleapis.com).
  const s = document.createElement("style");
  s.id = "__site_styles";
  s.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideUpFull { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
    .skeleton { background: linear-gradient(90deg,#e8e0d4 25%,#f4ecdc 50%,#e8e0d4 75%); background-size:800px 100%; animation:shimmer 1.4s infinite linear; border-radius:6px; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes lb-fadein { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
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

// cpw-006 : clé chargée depuis /api/get-config (hors bundle) — fallback si fetch échoue
let STRIPE_PK = "";
let PAY_2X_ENABLED = false;
fetch("/api/get-config").then(r => r.json()).then(d => { if (d.stripePk) STRIPE_PK = d.stripePk; if (d.pay2xEnabled) PAY_2X_ENABLED = true; }).catch(() => {});
const WA_NUMBER = "33610880772";
const WA_MSG_DEFAULT = encodeURIComponent("Bonjour, je souhaite obtenir des informations sur une location Amaryllis.");

const DEPOSIT_AMOUNTS = {
  amaryllis: 1500,
  zandoli:   500,
  iguana:    500,
  geko:      500,
  mabouya:   500,
  schoelcher: 1000,
  nogent:    500,
};

const AB = "https://a0.muscache.com/im/pictures/";

// Faits partagés tirés du canonique (source unique). N'inclut PAS `nom` (display PublicSite conservé).
function canonFacts(id) {
  const c = CANON[id];
  return {
    prix: c.prix,
    capacite: c.capacite,
    chambres: c.chambres,
    lieu: `${c.lieu}, ${isMartiniqueCanon(c) ? "Martinique" : "Île-de-France"}`,
    coords: c.coords,
    rating: String(c.rating).replace(".", ","),
    reviews: c.reviews,
    bookable: c.bookable,
  };
}

const BIENS = [
  {
    id: "amaryllis",
    nom: "Villa Amaryllis",
    airbnbTitle: "Villa Amaryllis - Luxe & sérénité Vue Mer, Piscine",
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
        { label: "Transport", texte: "Une voiture automatique est recommandée pour profiter pleinement de la région.", lien: <LienAffilie partenaire="discoverCars" utmContent="homepage-amaryllis-transport" /> },
        { label: "Ménage", texte: "La villa est nettoyée et désinfectée en profondeur entre chaque séjour." },
        { label: "Support", texte: "Notre équipe est joignable 24h/24 en cas d'urgence ou de besoin particulier." },
      ]},
    ],
    lits: 3,
    sdb: "3,5",
    couleur: "#e91e8c",
    photos: [
      "/photos/amaryllis/10.webp",  // hero — vue grand angle villa+piscine (agent photographe)
      "/photos/amaryllis/01.webp",
      "/photos/amaryllis/02.webp",
      "/photos/amaryllis/03.webp",
      "/photos/amaryllis/04.webp",
      "/photos/amaryllis/05.webp",
      "/photos/amaryllis/06.webp",
      "/photos/amaryllis/07.webp",
      "/photos/amaryllis/08.webp",
      "/photos/amaryllis/09.webp",
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
      "/photos/amaryllis/23.webp",
    ],
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3863.107902087125!2d-60.943493625540455!3d14.478492985993562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c4021b8748ab759%3A0x99f47752da739a0a!2svilla%20Amaryllis!5e0!3m2!1sfr!2sfr!4v1779046798123!5m2!1sfr!2sfr",
    amenities: ["Piscine à débordement eau salée", "Vue océan", "Wifi Starlink", "Parking", "Animaux OK"],
    amenitiesEn: ["Salt-water infinity pool", "Ocean view", "Starlink WiFi", "Parking", "Pets welcome"],
    avis: [
      { nom: "Sophie M.", pays: "🇫🇷", note: 5, texte: "Vue extraordinaire, piscine à débordement parfaite et hôte très réactif. Un endroit hors du temps face aux Caraïbes. On reviendra sans hésiter !", date: "Avr. 2025" },
      { nom: "James K.", pays: "🇬🇧", note: 5, texte: "Stunning villa with incredible Caribbean views. The salt water infinity pool is exceptional. Best Airbnb we've ever stayed in — period.", date: "Mars 2025" },
      { nom: "Marie-Claire D.", pays: "🇫🇷", note: 5, texte: "Séjour magique en famille. La terrasse de 100m² face à la mer est un rêve éveillé. Tout était impeccable, de l'accueil aux moindres détails de décoration.", date: "Fév. 2025" },
    ],
    ...canonFacts("amaryllis"),
  },
  {
    id: "zandoli",
    nom: "Zandoli",
    airbnbTitle: "Zandoli : détente tropicale, piscine, jardin, vue mer",
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
        { label: "Dépôt de garantie", texte: "500 € en cas de dommages constatés après le départ." },
        { label: "Capacité", texte: "4 voyageurs inclus dans le tarif de base. Possibilité d'accueillir 1 voyageur supplémentaire avec un supplément de 30 € par nuit." },
        { label: "Connexion", texte: "Wifi Starlink dans toute la propriété. Espace de travail dédié inclus." },
        { label: "Accès", texte: "Le logement comporte des marches ou escaliers. Accueil en personne par l'équipe Amaryllis." },
      ]},
    ],
    lits: 3,
    sdb: "1",
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
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.822862640186!2d-60.92853662554015!3d14.49485608597908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c4021b73b656873%3A0xdb94b0a0ad33a741!2sresidence%20Amaryllis!5e0!3m2!1sfr!2sfr!4v1779046858310!5m2!1sfr!2sfr",
    amenities: ["Piscine privée", "Vue mer", "Wifi Starlink", "Netflix/Disney+", "Lave-linge", "Jardin", "Animaux OK"],
    amenitiesEn: ["Private pool", "Sea view", "Starlink WiFi", "Netflix/Disney+", "Washer", "Garden", "Pets welcome"],
    avis: [
      { nom: "Lucie B.", pays: "🇫🇷", note: 5, texte: "Cocon parfait ! La mezzanine est charmante, la piscine délicieuse, et la vue sur la mer au réveil est inoubliable. Hôte très disponible.", date: "Avr. 2025" },
      { nom: "Thomas & Ana", pays: "🇩🇪", note: 5, texte: "Wunderbar! Tropical garden, private pool, sea view — everything we dreamed of. Very clean and well-equipped. We'll be back next winter.", date: "Janv. 2025" },
      { nom: "Camille R.", pays: "🇫🇷", note: 4, texte: "Très bel appartement, bien équipé et bien situé. La mezzanine est idéale pour les enfants. Netflix et lave-linge ont été très appréciés.", date: "Déc. 2024" },
    ],
    ...canonFacts("zandoli"),
  },
  {
    id: "iguana",
    nom: "Villa Iguana",
    airbnbTitle: "Villa Iguana, vue mer et rocher du Diamant, piscine",
    tag: null,
    desc: "La Villa Iguana possède une piscine d'eau salée — la seule de la résidence. Nager dedans, c'est nager dans la mer : pas de chlore, une eau douce et vivante, le même effet bienfaisant que l'océan. Depuis la terrasse, la vue embrasse le Rocher du Diamant et la mer des Caraïbes. Un cadre rare, sur les hauteurs de Sainte-Luce.",
    descEn: "Villa Iguana features a saltwater pool — the only one in the residence. Swimming in it feels like swimming in the sea: no chlorine, soft living water, the same restorative effect as the ocean itself. The terrace frames a direct view of Diamond Rock and the Caribbean. A rare setting on the heights of Sainte-Luce.",
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
    lits: 3,
    sdb: "1",
    couleur: "#22c55e",
    photos: [
      "/photos/iguana/04.webp",
      "/photos/iguana/06.webp",
      "/photos/iguana/05.webp",
      "/photos/iguana/10.webp",
      "/photos/iguana/07.webp",
      "/photos/iguana/08.webp",
      "/photos/iguana/02.webp",
      "/photos/iguana/03.webp",
      "/photos/iguana/11.webp",
      "/photos/iguana/12.webp",
      "/photos/iguana/13.webp",
      "/photos/iguana/09.webp",
      "/photos/iguana/14.webp",
      "/photos/iguana/15.webp",
    ],
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.822862640186!2d-60.92853662554015!3d14.49485608597908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c4021b73b656873%3A0xdb94b0a0ad33a741!2sresidence%20Amaryllis!5e0!3m2!1sfr!2sfr!4v1779046858310!5m2!1sfr!2sfr",
    amenities: ["Piscine eau salée", "Vue Diamant", "Vue océan", "Wifi Starlink", "Parking", "Animaux OK"],
    amenitiesEn: ["Saltwater pool", "Diamond Rock view", "Ocean view", "Starlink WiFi", "Parking", "Pets welcome"],
    avis: [
      { nom: "Pierre & Claire", pays: "🇫🇷", note: 5, texte: "Vue imprenable sur le rocher du Diamant ! La piscine d'eau salée est un vrai plus. Villa propre, bien équipée, accueil aux petits soins.", date: "Avr. 2025" },
      { nom: "Rachel T.", pays: "🇬🇧", note: 5, texte: "What a view! Waking up to see the Diamond Rock every morning was magical. The saltwater pool felt like swimming in the sea itself. Perfect.", date: "Mars 2025" },
      { nom: "Laurent D.", pays: "🇫🇷", note: 5, texte: "Superbe villa avec une vue panoramique exceptionnelle. Très calme, très propre. La terrasse est parfaite pour les levers de soleil. Je recommande vivement.", date: "Fév. 2025" },
    ],
    ...canonFacts("iguana"),
  },
  {
    id: "geko",
    nom: "Géko",
    airbnbTitle: "Géko, détente, zen, piscine & jardin tropical",
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
    lits: 2,
    sdb: "1",
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
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.822862640186!2d-60.92853662554015!3d14.49485608597908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c4021b73b656873%3A0xdb94b0a0ad33a741!2sresidence%20Amaryllis!5e0!3m2!1sfr!2sfr!4v1779046858310!5m2!1sfr!2sfr",
    amenities: ["Piscine privée", "Jardin tropical", "Climatisation", "Wifi Starlink", "Lave-linge", "Animaux OK"],
    amenitiesEn: ["Private pool", "Tropical garden", "Air conditioning", "Starlink WiFi", "Washer", "Pets welcome"],
    avis: [
      { nom: "Sandrine L.", pays: "🇫🇷", note: 5, texte: "Un vrai cocon dans un jardin tropical magnifique. La piscine est bien entretenue et la brise des alizés rend la clim presque superflue. On adore !", date: "Mai 2025" },
      { nom: "Marco F.", pays: "🇮🇹", note: 5, texte: "Piccolo paradiso caraibico! Il giardino tropicale è stupendo, la piscina fresca e pulita. Posizione tranquilla a pochi minuti dalla spiaggia. Torneremo!", date: "Avr. 2025" },
      { nom: "Nathalie C.", pays: "🇫🇷", note: 5, texte: "Refuge parfait pour se ressourcer. Jardin luxuriant, piscine fraîche, tout était propre et bien équipé. L'hôte répond très rapidement. Parfait !", date: "Mars 2025" },
    ],
    ...canonFacts("geko"),
  },
  {
    id: "mabouya",
    nom: "Mabouya",
    airbnbTitle: "Mabouya — Jacuzzi privatif · Vue mer · Escapade romantique",
    tag: "❤️ Escapade romantique",
    tagEn: "❤️ Romantic Escape",
    desc: "Le seul studio de la résidence avec jacuzzi privatif — rien que pour vous deux. Imaginez une soirée dans votre bain bouillonnant, face à la mer des Caraïbes, dans un jardin fleuri où il fait nuit noire et étoilé. Mabouya, c'est l'adresse secrète des couples en Martinique : intimité totale, calme absolu, plages à 7 minutes. À partir de 70 €/nuit en réservation directe.",
    descEn: "The only studio in the residence with a private jacuzzi — just for the two of you. Picture an evening in your bubbling bath overlooking the Caribbean Sea, in a flower-filled garden under a starry sky. Mabouya is the secret address for couples in Martinique: complete privacy, absolute calm, beaches a 7-minute drive away. From €70/night with direct booking.",
    descFull: [
      { titre: "Votre cocon privatif", texte: "Le studio Mabouya a été pensé pour le couple qui veut tout — et rien partager. Lit queen-size 160×200, climatisation, TV, terrasse privée avec vue mer : votre espace de vie vous appartient entièrement. Seul studio de la résidence Amaryllis à disposer d'un jacuzzi privatif, il occupe une position privilégiée à flanc de colline, enveloppé de végétation tropicale et de silence." },
      { titre: "Le jacuzzi sous les étoiles", texte: "L'atout absolu de Mabouya : votre jacuzzi privatif, niché dans un jardin fleuri luxuriant, avec vue directe sur la mer des Caraïbes. De nuit, avec les étoiles pour seul plafond et le bruit des grenouilles pour seule musique, c'est une expérience à part entière. La cuisine extérieure équipée et le barbecue au charbon complètent l'espace pour des soirées en amoureux parfaitement autonomes." },
      { titre: "Équipements & services", texte: "Grande douche à l'italienne, linge de maison complet (draps, serviettes), produits d'accueil. Wifi Starlink haut débit. Place de parking privée et sécurisée au sein de la résidence. Animaux bienvenus (max 2 — supplément 40 €). Ménage de fin de séjour inclus." },
      { titre: "Pourquoi Mabouya plutôt qu'un hôtel ?", texte: "Pour la même enveloppe qu'une chambre d'hôtel standard, Mabouya vous offre l'exclusivité totale d'un espace privatisé : jacuzzi, jardin tropical, terrasse vue mer, cuisine extérieure. Les plages d'Anse Mabouya et Anse Gros Raisin sont à 7 minutes en voiture. La distillerie Trois-Rivières, le spot de snorkeling aux tortues marines : à 15 minutes. Sans les couloirs, sans les bruits de voisins." },
      { titre: "Votre hôte", texte: "L'équipe Amaryllis est à votre écoute avant, pendant et après votre séjour — conseils sur les plages paradisiaques, restaurants locaux ou activités uniques. Nous privilégions une communication fluide, chaleureuse et réactive pour vous garantir une expérience sans stress et mémorable. Notre mission : faire de votre séjour un moment d'évasion inoubliable." },
      { titre: "Informations pratiques", items: [
        { label: "Check-in / Check-out", texte: "Check-in à partir de 17h, check-out avant 12h. Early/late check-out possibles selon disponibilité — supplément 50 €." },
        { label: "Animaux", texte: "Bienvenus, jusqu'à 2 maximum — supplément 40 € par séjour." },
        { label: "Capacité", texte: "2 personnes maximum." },
        { label: "Fumeurs", texte: "Non-fumeur à l'intérieur. Autorisé en extérieur." },
        { label: "Dépôt de garantie", texte: "500 € (pré-autorisation uniquement, non débité)." },
        { label: "Tranquillité", texte: "Fêtes et événements non autorisés. Silence entre 22h et 8h." },
        { label: "Stationnement", texte: "Parking privé et sécurisé inclus." },
        { label: "Équipements inclus", texte: "Linge de maison, produits d'accueil et wifi Starlink fournis." },
      ]},
    ],
    lits: 1,
    sdb: "1",
    couleur: "#ec4899",
    photos: [
      "/photos/mabouya/13.webp",
      "/photos/mabouya/02.webp",
      "/photos/mabouya/14.webp",
      "/photos/mabouya/15.webp",
      "/photos/mabouya/12.webp",
      "/photos/mabouya/16.webp",
      "/photos/mabouya/03.webp",
      "/photos/mabouya/09.webp",
      "/photos/mabouya/17.webp",
      "/photos/mabouya/11.webp",
      "/photos/mabouya/10.webp",
      "/photos/mabouya/18.webp",
      "/photos/mabouya/04.webp",
      "/photos/mabouya/08.webp",
      "/photos/mabouya/05.webp",
      "/photos/mabouya/01.webp",
      "/photos/mabouya/07.webp",
      "/photos/mabouya/06.webp",
    ],
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.822862640186!2d-60.92853662554015!3d14.49485608597908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c4021b73b656873%3A0xdb94b0a0ad33a741!2sresidence%20Amaryllis!5e0!3m2!1sfr!2sfr!4v1779046858310!5m2!1sfr!2sfr",
    amenities: ["Jacuzzi privatif 🛁", "Vue mer Caraïbes", "Terrasse privée", "Jardin fleuri tropical", "Barbecue charbon", "Wifi Starlink", "Parking privé", "Animaux OK"],
    amenitiesEn: ["Private jacuzzi 🛁", "Caribbean sea view", "Private terrace", "Tropical flower garden", "Charcoal BBQ", "Starlink WiFi", "Private parking", "Pets welcome"],
    avis: [
      { nom: "Élise & Romain", pays: "🇫🇷", note: 5, texte: "Weekend romantique parfait ! Le jacuzzi privatif sous les étoiles avec vue mer est juste magique. Jardin fleuri superbe, endroit très paisible.", date: "Avr. 2025" },
      { nom: "Sarah W.", pays: "🇺🇸", note: 5, texte: "Hidden gem! The private jacuzzi with ocean views made every evening unforgettable. The flowering garden is gorgeous. Perfect romantic escape.", date: "Mars 2025" },
      { nom: "Jean-Paul M.", pays: "🇫🇷", note: 4, texte: "Très beau logement avec un jacuzzi privatif et une vue mer agréable. Jardin entretenu, hôte sympathique. Idéal pour un séjour en couple.", date: "Fév. 2025" },
    ],
    ...canonFacts("mabouya"),
  },
  {
    id: "schoelcher",
    nom: "Bellevue",
    airbnbTitle: "Appartement de standing calme, splendide vue mer",
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
    lits: 1,
    sdb: "1",
    couleur: "#8b5cf6",
    photos: [
      "/photos/schoelcher/16.webp",
      "/photos/schoelcher/05.webp",
      "/photos/schoelcher/17.webp",
      "/photos/schoelcher/03.webp",
      "/photos/schoelcher/18.webp",
      "/photos/schoelcher/11.webp",
      "/photos/schoelcher/08.webp",
      "/photos/schoelcher/13.webp",
      "/photos/schoelcher/19.webp",
      "/photos/schoelcher/02.webp",
      "/photos/schoelcher/22.webp",
      "/photos/schoelcher/07.webp",
      "/photos/schoelcher/20.webp",
      "/photos/schoelcher/04.webp",
      "/photos/schoelcher/21.webp",
      "/photos/schoelcher/10.webp",
      "/photos/schoelcher/12.webp",
      "/photos/schoelcher/09.webp",
      "/photos/schoelcher/06.webp",
      "/photos/schoelcher/14.webp",
      "/photos/schoelcher/23.webp",
      "/photos/schoelcher/15.webp",
      "/photos/schoelcher/01.webp",
    ],
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2905.414139928121!2d-61.10181910968834!3d14.634222460364626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c6aa753fde6522f%3A0x414570ed7905d25c!2sR%C3%A9sidence%20Belle%20Vue!5e0!3m2!1sfr!2sfr!4v1779047169810!5m2!1sfr!2sfr",
    amenities: ["Vue baie", "Terrasse", "TV HD", "Wifi", "Parking", "Animaux OK"],
    amenitiesEn: ["Bay view", "Terrace", "HD TV", "WiFi", "Parking", "Pets welcome"],
    avis: [
      { nom: "Isabelle T.", pays: "🇫🇷", note: 5, texte: "Appartement très bien situé avec une vue splendide sur la baie de Fort-de-France. Calme, propre, bien équipé. Idéal pour explorer le nord de la Martinique.", date: "Avr. 2025" },
      { nom: "Dirk H.", pays: "🇳🇱", note: 5, texte: "Amazing view over the bay! The apartment is quiet, clean and has everything you need. Great location to explore the north of Martinique. Highly recommended.", date: "Mars 2025" },
      { nom: "Monique R.", pays: "🇫🇷", note: 5, texte: "Logement de standing avec une vue exceptionnelle. Hôte très accueillant et réactif. La terrasse face à la baie est un vrai bonheur le matin.", date: "Fév. 2025" },
    ],
    ...canonFacts("schoelcher"),
  },
  {
    id: "nogent",
    nom: "Appartement aux Portes de Paris",
    airbnbTitle: "Appartement de standing avec jardin, proche Paris",
    tag: "🗼 Aux portes de Paris",
    tagEn: "🗼 At the Gates of Paris",
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
    lits: 1,
    sdb: "1",
    couleur: "#6366f1",
    photos: [
      "/photos/nogent/09.webp",
      "/photos/nogent/03.webp",
      "/photos/nogent/05.webp",
      "/photos/nogent/10.webp",
      "/photos/nogent/08.webp",
      "/photos/nogent/06.webp",
      "/photos/nogent/01.webp",
      "/photos/nogent/04.webp",
      "/photos/nogent/19.webp",
      "/photos/nogent/20.webp",
      "/photos/nogent/14.webp",
      "/photos/nogent/15.webp",
      "/photos/nogent/02.webp",
      "/photos/nogent/07.webp",
      "/photos/nogent/11.webp",
      "/photos/nogent/13.webp",
      "/photos/nogent/12.webp",
      "/photos/nogent/18.webp",
      "/photos/nogent/16.webp",
      "/photos/nogent/17.webp",
    ],
    useBeds24: true, // Réservation via notre API beds24-create (plus d'iframe)
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d463.17188664330297!2d2.4757244130102185!3d48.83615034492648!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e60d41b4fd90d1%3A0x4f6c2445f955ea44!2s21%20Gd%20Rue%20Charles%20de%20Gaulle%2C%2094130%20Nogent-sur-Marne!5e0!3m2!1sfr!2sfr!4v1779047281540!5m2!1sfr!2sfr",
    amenities: ["Bord de Marne 🚶", "Jardin privé 🌿", "RER A → Paris 20 min", "Home cinéma", "Climatisation", "Barbecue", "Parking sécurisé", "Wifi ultra-rapide"],
    amenitiesEn: ["Riverside 🚶", "Private garden 🌿", "RER A → Paris 20 min", "Home cinema", "Air conditioning", "BBQ", "Secure parking", "Fast WiFi"],
    avis: [
      { nom: "Aurélie F.", pays: "🇫🇷", note: 5, texte: "Appartement lumineux et très bien décoré au bord de la Marne. Calme absolu tout en étant à 20 min de Paris. Le jardin est charmant. Parfait pour se ressourcer.", date: "Avr. 2025" },
      { nom: "Oliver M.", pays: "🇬🇧", note: 5, texte: "Lovely flat with a garden right by the river. Peaceful, well-decorated and only 20 minutes from central Paris. The host was very welcoming and helpful.", date: "Mars 2025" },
    ],
    ...canonFacts("nogent"),
  },
];

// ── « À proximité » : repères de distance par bien (data extraite des descriptifs
//    + ancrages géographiques du secteur). Affiché sur la fiche, scannable en 2 s. ──
// Géko · Mabouya · Zandoli · Iguana = même résidence à Sainte-Luce (plages accessibles
// en voiture, pas à pied). Proximité partagée.
const RESIDENCE_SAINTE_LUCE = [
  { icon: "🏖️", lieu: "Plages de Sainte-Luce", temps: "7 min en voiture" },
  { icon: "🐢", lieu: "Snorkeling tortues marines", temps: "15 min" },
  { icon: "🥃", lieu: "Distillerie Trois-Rivières", temps: "15 min" },
  { icon: "✈️", lieu: "Aéroport Aimé Césaire", temps: "40 min" },
];
const PROXIMITE = {
  amaryllis: [
    { icon: "🏖️", lieu: "Plages de Sainte-Luce", temps: "5 min en voiture" },
    { icon: "🏘️", lieu: "Bourg de Sainte-Luce (commerces, restos)", temps: "5 min" },
    { icon: "🥃", lieu: "Distillerie Trois-Rivières", temps: "15 min" },
    { icon: "✈️", lieu: "Aéroport Aimé Césaire", temps: "40 min" },
  ],
  geko: RESIDENCE_SAINTE_LUCE,
  mabouya: RESIDENCE_SAINTE_LUCE,
  zandoli: RESIDENCE_SAINTE_LUCE,
  iguana: RESIDENCE_SAINTE_LUCE,
  schoelcher: [
    { icon: "🛒", lieu: "Centre commercial, boulangerie, pharmacie", temps: "1 min à pied" },
    { icon: "🏖️", lieu: "Plages, restaurants, activités nautiques", temps: "5 min en voiture" },
    { icon: "🏙️", lieu: "Fort-de-France", temps: "15 min" },
    { icon: "✈️", lieu: "Aéroport Aimé Césaire", temps: "25 min" },
  ],
  nogent: [
    { icon: "🚇", lieu: "Gare RER A → Paris centre", temps: "20 min" },
    { icon: "🌊", lieu: "Bords de Marne (guinguettes)", temps: "quelques min à pied" },
    { icon: "🌳", lieu: "Bois de Vincennes", temps: "10 min" },
    { icon: "🅿️", lieu: "Parking public sécurisé", temps: "à pied" },
  ],
};

// ── Price helpers ─────────────────────────────────────────────────
function loadPriceOverrides() {
  try { return JSON.parse(localStorage.getItem("amaryllis_prices") || "{}"); }
  catch { return {}; }
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
function nextAvailWindow(blocked, bienId = null) {
  const s = new Set(blocked);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  for (let i = 0; i < 180; i++) {
    const ci = d.toISOString().slice(0, 10);
    if (!s.has(ci)) {
      const minN = bienId ? Math.max(1, getMinNights(bienId, ci)) : 3;
      let ok = true;
      for (let j = 1; j < minN; j++) {
        const n = new Date(d); n.setUTCDate(n.getUTCDate() + j);
        if (s.has(n.toISOString().slice(0, 10))) { ok = false; break; }
      }
      if (ok) return { checkin: ci, checkout: addDays(ci, minN) };
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return null;
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

function CalendarMonth({ year, month, checkin, checkout, hovered, blockedDates, onSelect, onHover, dailyPricesMap = {}, basePrice = 0, minNights = 1, readOnly = false, gapDates = {}, showPrices = true, minCheckin = null }) {
  const todayStr = today();
  const effectiveMin = minCheckin || todayStr;
  const [hoveredCell, setHoveredCell] = useState(null);
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDow = (firstDay.getDay() + 6) % 7;

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  // ── Heatmap : calcul min/max sur les jours libres du mois ─────────
  const freePrices = cells
    .filter(ds => ds && ds >= effectiveMin && !blockedSet.has(ds))
    .map(ds => dailyPricesMap[ds] ?? basePrice)
    .filter(p => p > 0);
  const heatMin = freePrices.length ? Math.min(...freePrices) : 0;
  const heatMax = freePrices.length ? Math.max(...freePrices) : 0;
  const heatRange = heatMax - heatMin;

  function heatBg(ds) {
    if (!ds || !heatRange || ds < effectiveMin || blockedSet.has(ds)) return null;
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
    if (ds < effectiveMin) return "past";
    if (blockedSet.has(ds)) return "blocked";
    if (isBelowMin(ds)) return "belowmin";
    if (ds === checkin) return "checkin";
    if (ds === checkout) return "checkout";
    const end = checkout || hovered;
    if (checkin && end && ds > checkin && ds < end) return "range";
    return "free";
  }

  return (
    <div style={{ flex: "1 1 240px" }}>
      <div style={{ textAlign: "center", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6, color: NAVY }}>
        {MONTHS_FR[month]} {year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: "center", fontSize: 9, color: MUTED, padding: "4px 0", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" }}>{w}</div>
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
          else if (inRange) { bg = "var(--c-cream, #f4ecdc)"; color = NAVY; borderRadius = "0"; }
          if (isCI) borderRadius = "8px 0 0 8px";
          if (isCO) borderRadius = "0 8px 8px 0";
          if (blocked) { bg = "repeating-linear-gradient(135deg, #f4ecdc, #f4ecdc 3px, #e8dcc1 3px, #e8dcc1 6px)"; borderRadius = "6px"; }

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
                height: 30,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                fontSize: 12,
                cursor: readOnly ? "default" : disabled ? "not-allowed" : "pointer",
                background: bg,
                color: blocked ? "#a89878" : past ? "#D4C8BC" : belowMin ? "#D4C8BC" : isFree ? NAVY : color,
                borderRadius,
                fontWeight,
                textDecoration: "none",
                opacity: past ? 0.4 : belowMin ? 0.35 : 1,
                position: "relative",
                transition: "background 0.1s",
                userSelect: "none",
              }}
            >
              {ds ? parseInt(ds.split("-")[2]) : ""}
              {showPrices && isFree && ds && (() => {
                const p = dailyPricesMap[ds] ?? basePrice;
                if (!p) return null;
                return <span style={{ fontSize: 8, lineHeight: 1, color: MUTED, fontFamily: "'Jost',sans-serif", letterSpacing: "0.01em" }}>{p}€</span>;
              })()}
              {/* Badge remise gap — visible en permanence sur les dates remisées */}
              {ds && gapDates[ds] && !disabled && (
                <div style={{
                  position: "absolute", top: 2, right: 2,
                  background: gapDates[ds] < 0 ? "#d97706" : "#14b8a6", color: "#fff",
                  fontSize: 7, fontWeight: 800,
                  padding: "1px 3px", borderRadius: 3,
                  lineHeight: 1.2, pointerEvents: "none",
                  fontFamily: "'Jost', sans-serif",
                }}>{gapDates[ds] < 0 ? `+${-gapDates[ds]}` : `-${gapDates[ds]}`}%</div>
              )}
              {hoveredCell === ds && !disabled && ds && (() => {
                const p = dailyPricesMap[ds] ?? basePrice;
                if (!p) return null;
                const gap = gapDates[ds];
                return (
                  <div style={{
                    position: "absolute", bottom: "calc(100% + 5px)", left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--c-navy)", color: "var(--c-ivory)",
                    fontSize: 10, fontWeight: 700,
                    padding: "3px 7px", borderRadius: 5,
                    whiteSpace: "nowrap", zIndex: 50,
                    pointerEvents: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                    fontFamily: "'Jost', sans-serif",
                  }}>{p}€/nuit{gap ? (gap < 0 ? ` · forte demande +${-gap}%` : ` · tarif direct -${gap}%`) : ""}</div>
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

function DateRangePicker({ checkin, checkout, blockedDates = [], onChange, dailyPricesMap = {}, basePrice = 0, minNights = 1, gapDates = {}, bienNom = "" }) {
  const todayStr = today();
  const minCheckinStr = addDays(todayStr, 1); // 24h minimum avant arrivée
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
      if (ds < minCheckinStr) return; // bloquer aujourd'hui et le passé
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
    <div style={{ background: IVORY, border: `1px solid ${SAND}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => canPrev && setOffset(o => o - 1)} style={{ ...iconBtn, opacity: canPrev ? 1 : 0.2 }}>←</button>
        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: MUTED, letterSpacing: "0.04em" }}>
          {!checkin ? "Choisir la date d'arrivée" : !checkout ? "Choisir la date de départ" : `${formatDateShort(checkin)} → ${formatDateShort(checkout)}`}
        </div>
        <button onClick={() => setOffset(o => Math.min(o + 1, 20))} style={iconBtn}>→</button>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <CalendarMonth year={y1} month={m1} checkin={checkin} checkout={checkout} hovered={hovered} blockedDates={blockedDates} onSelect={handleSelect} onHover={setHovered} dailyPricesMap={dailyPricesMap} basePrice={basePrice} minNights={minNights} gapDates={gapDates} minCheckin={minCheckinStr} />
        {!isMobile && <CalendarMonth year={y2} month={m2} checkin={checkin} checkout={checkout} hovered={hovered} blockedDates={blockedDates} onSelect={handleSelect} onHover={setHovered} dailyPricesMap={dailyPricesMap} basePrice={basePrice} minNights={minNights} gapDates={gapDates} minCheckin={minCheckinStr} />}
      </div>
      {/* Notice 24h */}
      <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef9f0", border: "1px solid #f0e0c0", borderRadius: 8, fontSize: 12, color: "#7a5c2e", fontFamily: "'Jost', sans-serif", lineHeight: 1.5 }}>
        ⏱ Réservation en ligne : minimum 24h à l'avance.{" "}
        Besoin pour <strong>aujourd'hui</strong> ?{" "}
        <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour, je souhaite réserver ${bienNom || "un logement"} pour cette nuit. Est-ce possible ?`)}`} style={{ color: "#25d366", fontWeight: 600, textDecoration: "none" }}>WhatsApp</a>
        {" "}ou{" "}
        <a href="mailto:contact@villamaryllis.com" style={{ color: "#0e3b3a", fontWeight: 600, textDecoration: "none" }}>email</a>.
      </div>
      {/* Légende disponibilité */}
      <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif" }}>
          <span style={{ width: 22, height: 22, background: IVORY, border: `1px solid ${SAND}`, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: NAVY, fontWeight: 500 }}>8</span>
          Disponible
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif" }}>
          <span style={{ width: 22, height: 22, background: "repeating-linear-gradient(135deg, #f4ecdc, #f4ecdc 3px, #e8dcc1 3px, #e8dcc1 6px)", border: `1px solid ${SAND}`, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#a89878", fontWeight: 400 }}>8</span>
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

// ── PricingCalendar — Tarifs journaliers colorés (design-007) ─────────────
// Affiché avant le widget réservation sur les pages propriété.
// Sources : /api/beds24-prices (Nogent) ou /api/rm-recommendations (Martinique).
const PC_TIERS = {
  low:  { bg: "rgba(148,163,184,0.13)", text: "#64748b", border: "#94a3b820", label: "Basse saison" },
  mid:  { bg: "rgba(20,184,166,0.11)",  text: "#0d9488", border: "#14b8a620", label: "Moyenne saison" },
  high: { bg: "rgba(245,158,11,0.15)",  text: "#b45309", border: "#f59e0b25", label: "Haute saison" },
  peak: { bg: "rgba(196,114,84,0.20)",  text: "#c47254", border: "#c4725430", label: "Pic de saison" },
};

function PricingCalendar({ bien, isMobile = false, large = false }) {
  const isNogent = bien.id === "nogent";
  const [pricesMap, setPricesMap] = useState({}); // { "YYYY-MM-DD": { price, tier } }
  const [loading, setLoading] = useState(true);
  const [mOff, setMOff] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const todayStr = new Date().toISOString().slice(0, 10);
    const toStr = new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);

    if (isNogent) {
      fetch("/api/beds24-prices")
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          if (data.ok && data.nogent && Object.keys(data.nogent).length > 0) {
            const base = Math.max(bien.prix || 85, 50);
            const map = {};
            for (const [date, price] of Object.entries(data.nogent)) {
              if (date < todayStr) continue;
              const r = price / base;
              const tier = r >= 1.55 ? "peak" : r >= 1.2 ? "high" : r >= 0.82 ? "mid" : "low";
              map[date] = { price: Math.round(price), tier };
            }
            setPricesMap(map);
          }
          setLoading(false);
        })
        .catch(() => { if (!cancelled) setLoading(false); });
    } else {
      // Fallback statique saisonnier (Martinique) — utilisé si l'API RM ne répond pas
      const buildSeasonalFallback = (base) => {
        const map = {};
        const now2 = new Date();
        for (let d = 0; d < 180; d++) {
          const dt = new Date(now2.getTime() + d * 86400000);
          const ds2 = dt.toISOString().slice(0, 10);
          const m = dt.getMonth();
          let tier, price;
          if (m >= 6 && m <= 8)       { tier = "peak"; price = Math.round(base * 1.55); }
          else if (m === 11 || m === 0){ tier = "peak"; price = Math.round(base * 1.45); }
          else if (m === 1 || m === 5) { tier = "high"; price = Math.round(base * 1.25); }
          else if (m >= 2 && m <= 4)   { tier = "mid";  price = Math.round(base * 1.10); }
          else                          { tier = "low";  price = base; }
          map[ds2] = { price, tier };
        }
        return map;
      };

      fetch(`/api/rm-recommendations?property_id=${bien.id}&from=${todayStr}&to=${toStr}`)
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          const map = {};
          for (const rec of (data.recommendations || [])) {
            if (rec.date && rec.suggested_price) {
              const tier = ["low","mid","high","peak"].includes(rec.season_type) ? rec.season_type : "mid";
              map[rec.date] = { price: Math.round(rec.suggested_price), tier };
            }
          }
          // Si l'API retourne des données → les utiliser, sinon fallback saisonnier
          setPricesMap(Object.keys(map).length > 0 ? map : buildSeasonalFallback(bien.prix || 280));
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setPricesMap(buildSeasonalFallback(bien.prix || 280));
            setLoading(false);
          }
        });
    }
    return () => { cancelled = true; };
  }, [bien.id, isNogent, bien.prix]);

  const hasPrices = Object.keys(pricesMap).length > 0;
  if (!loading && !hasPrices && isNogent) return null; // Nogent sans données → masqué (Martinique a toujours un fallback)

  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const baseY = now.getFullYear(), baseM = now.getMonth();

  const cellH = large && !isMobile ? 56 : 38;
  const dayFs = large && !isMobile ? 14 : 11;
  const priceFs = large && !isMobile ? 11 : 8;
  const headerFs = large && !isMobile ? 14 : 12;
  const weekFs = large && !isMobile ? 9 : 8;
  const cellGap = large && !isMobile ? 4 : 2;

  function renderPricingMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0).getDate();
    const startDow = (firstDay.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDate; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return (
      <div key={`${year}-${month}`} style={{ flex: "1 1 220px" }}>
        <div style={{ textAlign: "center", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: headerFs, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: large ? 14 : 10, color: NAVY }}>
          {MONTHS_FR[month]} {year}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: cellGap }}>
          {WEEKDAYS.map(w => (
            <div key={w} style={{ textAlign: "center", fontSize: weekFs, color: MUTED, padding: "4px 0", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>{w}</div>
          ))}
          {cells.map((ds, i) => {
            if (!ds) return <div key={`e-${i}`} />;
            const isPast = ds < todayStr;
            const data = pricesMap[ds];
            const tc = data ? PC_TIERS[data.tier] : null;
            return (
              <div key={ds} title={data && !isPast ? `${data.price}€/nuit` : undefined} style={{
                height: cellH,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                borderRadius: large ? 8 : 6,
                background: isPast ? "transparent" : (tc?.bg ?? "transparent"),
                border: isPast ? "none" : tc ? `1px solid ${tc.border}` : "none",
                opacity: isPast ? 0.3 : 1,
                transition: "background 0.15s",
              }}>
                <span style={{ fontSize: dayFs, color: isPast ? MUTED : (tc ? tc.text : NAVY), fontWeight: tc && !isPast ? 600 : 400, lineHeight: 1.1 }}>
                  {parseInt(ds.split("-")[2])}
                </span>
                {data && !isPast && (
                  <span style={{ fontSize: priceFs, color: tc?.text ?? MUTED, fontWeight: 500, lineHeight: 1, letterSpacing: "0.02em" }}>
                    {data.price}€
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const y1 = baseY + Math.floor((baseM + mOff) / 12);
  const m1 = (baseM + mOff) % 12;
  const y2 = baseY + Math.floor((baseM + mOff + 1) / 12);
  const m2 = (baseM + mOff + 1) % 12;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Eyebrow color="muted">Tarifs prévisionnels</Eyebrow>
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={() => setMOff(o => Math.max(0, o - 1))} disabled={mOff === 0}
            aria-label="Mois précédent"
            style={{ background: "none", border: `1px solid ${SAND}`, borderRadius: 6, width: 26, height: 26, cursor: mOff > 0 ? "pointer" : "not-allowed", opacity: mOff > 0 ? 1 : 0.3, fontSize: 14, color: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <button onClick={() => setMOff(o => Math.min(o + 1, 10))} aria-label="Mois suivant"
            style={{ background: "none", border: `1px solid ${SAND}`, borderRadius: 6, width: 26, height: 26, cursor: "pointer", fontSize: 14, color: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>
      </div>
      {loading ? (
        <div style={{ display: "flex", gap: large ? 32 : 16, flexWrap: "wrap" }}>
          {[0, 1].map(col => (
            <div key={col} style={{ flex: "1 1 220px" }}>
              <div className="skeleton" style={{ height: large ? 16 : 12, width: 130, margin: "0 auto 14px", borderRadius: 4 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: cellGap }}>
                {Array.from({ length: 35 }, (_, i) => <div key={i} className="skeleton" style={{ height: cellH, borderRadius: large ? 8 : 6, opacity: 0.25 + (i % 5) * 0.06 }} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: isMobile ? 0 : (large ? 32 : 20), flexDirection: isMobile ? "column" : "row", flexWrap: "wrap" }}>
            {renderPricingMonth(y1, m1)}
            {!isMobile && renderPricingMonth(y2, m2)}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {Object.entries(PC_TIERS).map(([tier, tc]) => (
              <span key={tier} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif" }}>
                <span style={{ width: 12, height: 12, background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 3, display: "inline-block" }} />
                {tc.label}
              </span>
            ))}
            <span style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", marginLeft: "auto", fontStyle: "italic" }}>
              Tarifs indicatifs, sujets à révision
            </span>
          </div>
        </>
      )}
    </div>
  );
}

const iconBtn = {
  background: "var(--c-cream, #f4ecdc)",
  border: `1px solid ${SAND}`,
  color: NAVY,
  width: 32, height: 32, borderRadius: 8, cursor: "pointer",
  fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "'Jost', sans-serif",
};

// ── Shader Background (canvas) ───────────────────────────────────
function ShaderBg({ style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let rid = null, t = 0;

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
      ctx.fillStyle = "var(--c-navy)";
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
    return () => { if (rid) cancelAnimationFrame(rid); ro.disconnect(); };
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

// ── Beds24 Modal (Nogent — formulaire natif + paiement Stripe) ────────────
// Option B : plus d'iframe. On crée la réservation Beds24 via notre propre API
// puis on enchaîne directement sur Stripe. Flux : phase 1 (form) → phase 2 (Stripe).
function Beds24Modal({ bien, checkin, checkout, dailyPricesMap = {}, onClose }) {
  const [phase, setPhase] = useState(1);

  // ── Formulaire voyageur ───────────────────────────────────────────────────
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", tel: "", adultes: "2", enfants: "0" });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Dates (pré-remplies depuis les props ou le calendrier) ───────────────
  const [localCheckin,  setLocalCheckin]  = useState(checkin  || "");
  const [localCheckout, setLocalCheckout] = useState(checkout || "");

  // ── Prix calculé depuis les tarifs Beds24 par jour (source de vérité) ────
  // dailyPricesMap est synchro en temps réel depuis /api/beds24-rates
  // Fallback : bien.prix si la date n'est pas dans la map
  const nights = localCheckin && localCheckout ? dateDiff(localCheckin, localCheckout) : 0;
  const rawTotal = useMemo(() => {
    if (nights <= 0) return 0;
    let total = 0;
    const cur = new Date(localCheckin + "T12:00:00Z");
    for (let i = 0; i < nights; i++) {
      const ds = cur.toISOString().slice(0, 10);
      total += dailyPricesMap[ds] ?? bien.prix;
      cur.setDate(cur.getDate() + 1);
    }
    return total;
  }, [localCheckin, nights, dailyPricesMap, bien.prix]);
  const fraisMenage  = FRAIS_MENAGE[bien.id] ?? 0;
  const discountRate = getDiscount(nights);
  const discountAmt  = Math.round(rawTotal * discountRate);
  const computedTotal = nights > 0 ? rawTotal - discountAmt + fraisMenage : 0;
  const [amount, setAmount] = useState(() => computedTotal || 0);
  useEffect(() => { if (computedTotal > 0) setAmount(computedTotal); }, [computedTotal]);

  // ── Stripe ────────────────────────────────────────────────────────────────
  const [stripe,   setStripe]   = useState(null);
  const [elements, setElements] = useState(null);
  const [paying,   setPaying]   = useState(false);
  const [payError, setPayError] = useState("");
  const spRef = useRef(null);
  useEffect(() => { if (window.Stripe && STRIPE_PK) setStripe(window.Stripe(STRIPE_PK)); }, []);
  useEffect(() => {
    if (phase === 2 && elements) {
      const pe = elements.getElement("payment");
      if (pe) pe.mount("#b24-spe");
    }
  }, [phase, elements]);
  const stripeAppearance = { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } };

  // ── Suivi réservation Beds24 (annulation si l'utilisateur ferme sans payer) ─
  // ── Code promo ───────────────────────────────────────────────────────────
  const [promoInput,   setPromoInput]   = useState("");
  const [promoData,    setPromoData]    = useState(null);   // { code, type, value }
  const [promoError,   setPromoError]   = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  async function validatePromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true); setPromoError("");
    try {
      const r = await fetch(`/api/promo-codes?validate=${encodeURIComponent(code)}&bien_id=${bien.id}`);
      const d = await r.json();
      if (d.valid) { setPromoData(d); setPromoError(""); }
      else { setPromoData(null); setPromoError(d.error || "Code invalide"); }
    } catch { setPromoData(null); setPromoError("Impossible de vérifier le code"); }
    finally { setPromoLoading(false); }
  }

  // Réduction promo en €
  const promoDiscountAmt = promoData
    ? promoData.type === "percent"
      ? Math.round(computedTotal * promoData.value / 100)
      : Math.min(promoData.value, computedTotal)
    : 0;
  const finalTotal = computedTotal - promoDiscountAmt;

  const [bookingId,  setBookingId]  = useState(null);
  const [creating,   setCreating]   = useState(false);
  const [createErr,  setCreateErr]  = useState("");
  const paymentDoneRef = useRef(false);
  const bookingIdRef   = useRef(null);

  const cancelBeds24 = async (id) => {
    if (!id) return;
    try {
      await fetch("/api/beds24-manage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", bookingId: id }),
      });
    } catch {}
  };
  const confirmBeds24 = async (id) => {
    if (!id) return;
    try {
      await fetch("/api/beds24-manage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", bookingId: id }),
      });
    } catch {}
  };
  // Cleanup : annuler la réservation Beds24 si l'utilisateur ferme la modal sans payer
  useEffect(() => {
    return () => {
      if (!paymentDoneRef.current && bookingIdRef.current) {
        cancelBeds24(bookingIdRef.current);
      }
    };
  }, []);

  // ── Étape 1 → 2 : créer la réservation Beds24 puis préparer Stripe ────────
  async function handleBook() {
    if (!stripe || !localCheckin || !localCheckout) return;
    setCreating(true); setCreateErr("");

    try {
      // 1. Créer la réservation dans Beds24 via notre API
      const createRes = await fetch("/api/beds24-create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkin:     localCheckin,
          checkout:    localCheckout,
          firstName:   form.prenom.trim() || form.nom.trim(),
          lastName:    form.nom.trim(),
          email:       form.email.trim(),
          phone:       form.tel.trim(),
          numAdult:    parseInt(form.adultes) || 1,
          numChild:    parseInt(form.enfants) || 0,
          localAmount: amount,
        }),
      });
      const cd = await createRes.json();
      if (!cd.ok) throw new Error(cd.error || "Erreur lors de la création de la réservation.");

      setBookingId(cd.bookingId);
      bookingIdRef.current = cd.bookingId;

      // 2. Prix confirmé : Beds24 si Nogent (cd.price > 0), sinon calcul local Martinique
      //    Beds24 = Nogent UNIQUEMENT — pour les biens Martinique cd.price = 0, fallback = amount
      const chargeAmount = cd.price > 0 ? Math.ceil(cd.price) : amount;
      // Recalculer la remise promo sur le montant confirmé
      const promoDeduct = promoData
        ? promoData.type === "percent"
          ? Math.round(chargeAmount * promoData.value / 100)
          : Math.min(promoData.value, chargeAmount)
        : 0;
      const finalAmount = Math.max(50, chargeAmount - promoDeduct); // 50 cts minimum Stripe
      if (finalAmount !== amount) setAmount(finalAmount);

      // 3. Créer le PaymentIntent Stripe
      const piRes = await fetch("/api/create-payment-intent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:    finalAmount * 100,
          currency:  "eur",
          bookingId: cd.bookingId,
          metadata: {
            bienId:      bien.id,
            checkin:     localCheckin,
            checkout:    localCheckout,
            voyageur:    `${form.prenom} ${form.nom}`.trim(),
            email:       form.email.trim(),
            prenom:      form.prenom?.trim() || "",
            nom:         form.nom?.trim() || "",
            phone:       form.tel?.trim() || "",
            beds24Id:    cd.bookingId,
            bookingId:   cd.bookingId,
            promo_code:  promoData?.code || "",
            promo_value: promoDeduct > 0 ? String(promoDeduct) : "",
            ...getAttributionMetadata(),
          },
        }),
      });
      const piData = await piRes.json();
      if (piData.error) throw new Error(piData.error);

      // 4. Préparer Stripe Elements et passer à la phase paiement
      const el = stripe.elements({ clientSecret: piData.clientSecret, appearance: stripeAppearance });
      el.create("payment");
      setElements(el);
      setPhase(2);

    } catch (e) {
      setCreateErr(e.message);
    } finally {
      setCreating(false);
    }
  }

  // ── Étape 2 : confirmer le paiement Stripe ────────────────────────────────
  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true); setPayError("");
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/merci" },
      redirect: "if_required",
    });
    if (error) {
      if (bookingIdRef.current) {
        await cancelBeds24(bookingIdRef.current);
        bookingIdRef.current = null;
        setBookingId(null);
        setPayError(error.message + " — Votre réservation a été annulée. Vous pouvez recommencer.");
      } else {
        setPayError(error.message);
      }
      setPaying(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      paymentDoneRef.current = true;
      await confirmBeds24(bookingIdRef.current);
      // Stocker pi dans pending_purchase pour que Merci.jsx fire l'event avec retry
      // (failsafe : si page-unload tue le beacon gtag inline ci-dessous)
      try {
        const existing = JSON.parse(sessionStorage.getItem("pending_purchase") || "{}");
        sessionStorage.setItem("pending_purchase", JSON.stringify({
          ...existing,
          pi: paymentIntent.id,
          value: amount,
          bien_id: bien.id,
          niveau_tarifaire: niveauTarifaire(bien, localCheckin),
          items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights || 1 }],
        }));
      } catch { /* */ }
      if (window.gtag) {
        const guardKey = `ga_purchase_fired_${paymentIntent.id}`;
        if (!ssGet(guardKey)) {
          ssSet(guardKey, "1");
          window.gtag("event", "purchase", {
            transaction_id: paymentIntent.id, currency: "EUR", value: amount,
            bien_id: bien.id, niveau_tarifaire: niveauTarifaire(bien, localCheckin),
            items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights || 1 }],
          });
          mpTrack("Purchase", { value: amount, currency: "EUR", eventID: paymentIntent.id, content_ids: [bien.id], content_type: "product" });
        }
      }
      window.location.href = "/merci";
    }
    setPaying(false);
  }

  // ── Validation formulaire ────────────────────────────────────────────────
  const datesOk = localCheckin && localCheckout && nights > 0;
  const formOk  = form.nom.trim().length > 1 && form.email.includes("@") && datesOk && stripe;

  // ── Formatage date ────────────────────────────────────────────────────────
  const fmtDate = (iso) => iso
    ? new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const inputStyle = {
    width: "100%", padding: "10px 13px", borderRadius: 8,
    border: `1px solid ${SAND}`, background: IVORY, color: NAVY,
    fontSize: 14, outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 11, color: MUTED, display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(6,22,22,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ background: IVORY, borderRadius: 14, overflow: "hidden", width: "100%", maxWidth: 520, maxHeight: "calc(94vh - env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.45)" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${SAND}`, flexShrink: 0 }}>
          <div>
            <Eyebrow style={{ marginBottom: 4 }}>
              {phase === 1 ? "Réservation directe" : "Paiement sécurisé"}
            </Eyebrow>
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase", color: NAVY }}>
              {bien.nom}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: NAVY, opacity: 0.5, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* ── Phase 1 : formulaire de réservation ── */}
        {phase === 1 && (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

            {/* Récapitulatif tarif */}
            {datesOk ? (
              <>
                {/* Récapitulatif prix */}
                <div style={{ background: "rgba(196,114,84,0.07)", border: `1px solid rgba(196,114,84,0.22)`, borderRadius: 11, padding: "14px 16px", marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: CORAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Votre séjour</div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                    {[["Arrivée", localCheckin], ["Départ", localCheckout]].map(([l, v]) => (
                      <div key={l} style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{fmtDate(v)}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, borderTop: `1px solid ${SAND}`, paddingTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED }}>
                      <span>Hébergement ({nights} nuit{nights > 1 ? "s" : ""}{nights > 0 && rawTotal > 0 ? ` · moy. ${Math.round(rawTotal / nights)} €/nuit` : ""})</span>
                      <span>{rawTotal} €</span>
                    </div>
                    {discountAmt > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#10b981" }}>
                        <span>Remise séjour (−{Math.round(discountRate * 100)}%)</span>
                        <span>−{discountAmt} €</span>
                      </div>
                    )}
                    {fraisMenage > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED }}>
                        <span>Frais de ménage</span><span>{fraisMenage} €</span>
                      </div>
                    )}
                    {promoDiscountAmt > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#10b981", fontWeight: 600 }}>
                        <span>Code promo ({promoData.code})</span>
                        <span>−{promoDiscountAmt} €</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: NAVY, borderTop: `1px solid ${SAND}`, paddingTop: 8, marginTop: 4 }}>
                      <span>Total</span><span>{finalTotal} €</span>
                    </div>
                  </div>
                </div>

                {/* Champ code promo */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoData(null); setPromoError(""); }}
                      onKeyDown={e => e.key === "Enter" && validatePromo()}
                      placeholder="Code promo (optionnel)"
                      maxLength={20}
                      style={{ ...inputStyle, flex: 1, fontSize: 13, letterSpacing: "0.05em" }}
                    />
                    <button
                      onClick={validatePromo}
                      disabled={!promoInput.trim() || promoLoading}
                      style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${SAND}`, background: IVORY, color: NAVY, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      {promoLoading ? "…" : "Appliquer"}
                    </button>
                  </div>
                  {promoData && (
                    <div style={{ fontSize: 11, color: "#10b981", marginTop: 5, fontWeight: 600 }}>
                      ✓ Code valide — {promoData.type === "percent" ? `−${promoData.value}%` : `−${promoData.value} €`} appliqué
                    </div>
                  )}
                  {promoError && (
                    <div style={{ fontSize: 11, color: "#e53e3e", marginTop: 5 }}>{promoError}</div>
                  )}
                </div>
              </>
            ) : (
              /* Sélection des dates si non pré-remplies */
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Arrivée *</label>
                    <input type="date" value={localCheckin} onChange={e => setLocalCheckin(e.target.value)}
                      min={new Date().toISOString().slice(0,10)}
                      style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Départ *</label>
                    <input type="date" value={localCheckout} onChange={e => setLocalCheckout(e.target.value)}
                      min={localCheckin || new Date().toISOString().slice(0,10)}
                      style={inputStyle} />
                  </div>
                </div>
                {localCheckin && localCheckout && nights <= 0 && (
                  <div style={{ fontSize: 11, color: "#e53e3e", marginTop: 6 }}>La date de départ doit être après l'arrivée.</div>
                )}
              </div>
            )}

            {/* Coordonnées */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Prénom</label>
                <input value={form.prenom} onChange={e => setF("prenom", e.target.value)} placeholder="Jean" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nom *</label>
                <input value={form.nom} onChange={e => setF("nom", e.target.value)} placeholder="Dupont" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>E-mail *</label>
              <input type="email" value={form.email} onChange={e => setF("email", e.target.value)} placeholder="jean.dupont@email.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Téléphone</label>
              <input type="tel" value={form.tel} onChange={e => setF("tel", e.target.value)} placeholder="+33 6 12 34 56 78" style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Adultes *</label>
                <input type="number" min="1" max="6" value={form.adultes} onChange={e => setF("adultes", e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Enfants</label>
                <input type="number" min="0" max="6" value={form.enfants} onChange={e => setF("enfants", e.target.value)} style={inputStyle} />
              </div>
            </div>

            {createErr && (
              <div style={{ color: "#e53e3e", fontSize: 12, marginBottom: 14, background: "rgba(229,62,62,0.08)", borderRadius: 8, padding: "10px 14px" }}>
                {createErr}
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={!formOk || creating}
              style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: formOk && !creating ? CORAL : SAND, color: formOk && !creating ? "#fff" : MUTED, fontWeight: 700, fontSize: 15, cursor: formOk && !creating ? "pointer" : "not-allowed", letterSpacing: "0.02em", transition: "background 0.2s" }}
            >
              {creating ? "⏳ Création de la réservation…" : datesOk ? `Réserver et payer ${finalTotal} € →` : "Réserver →"}
            </button>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: MUTED }}>🔒 Paiement sécurisé par Stripe · Réservation confirmée après paiement</div>
          </div>
        )}

        {/* ── Phase 2 : paiement Stripe ── */}
        {phase === 2 && (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            {/* Récap commande */}
            <div style={{ background: "rgba(196,114,84,0.07)", border: `1px solid rgba(196,114,84,0.22)`, borderRadius: 11, padding: "14px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{bien.nom}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
                  {fmtDate(localCheckin)} → {fmtDate(localCheckout)} · {nights} nuit{nights > 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
                  {form.prenom} {form.nom} · {form.email}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: CORAL, flexShrink: 0, marginLeft: 12 }}>{amount} €</div>
            </div>

            <div id="b24-spe" ref={spRef} style={{ marginBottom: 16 }} />

            {payError && (
              <div style={{ color: "#e53e3e", fontSize: 12, marginBottom: 14, background: "rgba(229,62,62,0.08)", borderRadius: 8, padding: "10px 14px" }}>
                {payError}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={paying || !stripe || !elements}
              style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: paying ? SAND : CORAL, color: paying ? MUTED : "#fff", fontWeight: 700, fontSize: 15, cursor: paying ? "not-allowed" : "pointer" }}
            >
              {paying ? "Traitement en cours…" : `Confirmer et payer ${amount} €`}
            </button>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: MUTED }}>🔒 Données bancaires chiffrées · Jamais stockées sur nos serveurs</div>
            <button onClick={() => { setPhase(1); setElements(null); setPayError(""); }} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>
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
  if (!bien?.id) return;
  const validUntil = new Date(Date.now() + 48 * 3600 * 1000).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const ref = `AMR-${bien.id.slice(0,3).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const initPct = Math.round((discountRate || 0) * 100);
  const initDiscLabel = discountRate > 0
    ? `Remise ${discountLabel(nights)} (−${initPct}%)`
    : "Aucune remise";

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
      .no-print { display:none !important; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Top bar (hidden on print) -->
  <div class="no-print" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
    <div style="font-size:13px;color:#7a6b5a;">Devis prêt — enregistrez-le en PDF ou imprimez-le.</div>
    <button onclick="window.print()" style="background:#0e3b3a;color:#fff;border:none;border-radius:8px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:0.04em;">
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
        <td style="color:#7a6b5a;font-size:12px;">${nights} nuit${nights > 1 ? "s" : ""} · ${Math.round(rawTotal / nights)}€/nuit moy.</td>
        <td>${rawTotal}€</td>
      </tr>
      ${discountAmount > 0 ? `<tr class="discount">
        <td>${initDiscLabel}</td>
        <td style="color:#c47254;font-size:12px;">Remise séjour</td>
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
    <div class="dep-desc">Ce montant sera pré-autorisé sur votre carte bancaire avant votre séjour (à la réservation, ou quelques jours avant l'arrivée). Il ne sera pas débité et sera libéré automatiquement après votre départ si aucun dommage n'est constaté.</div>
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
</body>
</html>`;

  const win = window.open("", "_blank", "width=820,height=920");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ── Booking Modal ────────────────────────────────────────────────
// ── Upsells par propriété ──────────────────────────────────────────────────
const UPSELL_CATALOG = {
  _martinique: [
    { id: "courses", label: "Service courses", desc: "Courses livrées à votre arrivée — liste envoyée à votre hôte", price: "+30€ service", icon: "🛒" },
  ],
  nogent: [
    { id: "courses", label: "Service courses", desc: "Courses livrées avant votre arrivée — liste envoyée à votre hôte", price: "+25€ service", icon: "🛒" },
  ],
};
const MARTINIQUE_IDS = new Set(["amaryllis", "geko", "mabouya", "zandoli", "schoelcher", "iguana"]);
function getUpsells(bienId) {
  const base = bienId === "nogent" ? UPSELL_CATALOG.nogent : MARTINIQUE_IDS.has(bienId) ? UPSELL_CATALOG._martinique : [];
  const prixMenage = FRAIS_MENAGE[bienId] ?? 0;
  const menage = prixMenage > 0
    ? [{ id: "menage", label: "Ménage supplémentaire", desc: "Ménage intermédiaire durant votre séjour", price: `+${prixMenage}€`, icon: "🧹" }]
    : [];
  return [...base, ...menage];
}

function BookingModal({ bien, blockedDates, loadingAvail, onClose, initialCheckin = null, initialCheckout = null }) {
  useMinNights(); // re-render when admin changes min nights
  const [step, setStep] = useState(1);
  const [checkin, setCheckin] = useState(initialCheckin);
  const [checkout, setCheckout] = useState(initialCheckout);
  const [nbGuests, setNbGuests] = useState(1);
  const [nbPets, setNbPets] = useState(0);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", tel: "", message: "" });
  const [upsells, setUpsells] = useState({}); // { chef: true, transfert: false, ... }
  const [earlyCheckin, setEarlyCheckin] = useState(false);
  const [lateCheckout, setLateCheckout] = useState(false);
  const [stripe, setStripe] = useState(null);
  const [stripeFailed, setStripeFailed] = useState(false); // Stripe injoignable après ~10s (réseau/adblock) → message au lieu d'un bouton mort
  const [elements, setElements] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const addPaymentInfoFired = useRef(false); // n'émettre add_payment_info qu'une fois (aller-retour étape 2↔3)
  const elRef = useRef(null);
  const depositAmt = DEPOSIT_AMOUNTS[bien.id] ?? 0;
  const [payPlan, setPayPlan] = useState("full");
  const [promoInput,   setPromoInput]   = useState("");
  const [promoData,    setPromoData]    = useState(null);
  const [promoError,   setPromoError]   = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

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

  // Remises gap depuis le worker (trous de calendrier) — avec respect du price_min
  useEffect(() => {
    fetch("https://amaryllis-ical-sync.vinsmaf.workers.dev/gap-prices")
      .then(r => r.json())
      .then(data => {
        const bienGaps = data[bien.id] || {};
        if (Object.keys(bienGaps).length > 0) {
          // Récupérer le price_min depuis rm-properties (public via endpoint /api/rm-properties sans auth = liste)
          // Fallback sur bien.prixMin si disponible, sinon 0 (pas de plancher)
          const applyGaps = (priceMinEuros) => {
            const effectiveGaps = {};
            setDailyPricesMap(prev => {
              const base = { ...prev };
              const seed = (() => { try { return loadDailyPrices()[bien.id] || {}; } catch { return {}; } })();
              for (const [date, pct] of Object.entries(bienGaps)) {
                const basePrice = seed[date] ?? bien.prix;
                const discounted = Math.round(basePrice * (1 - pct / 100));
                // Respecter le plancher
                if (priceMinEuros > 0 && discounted < priceMinEuros) {
                  // Réduire la remise affichée au maximum possible
                  const effectivePct = Math.floor((1 - priceMinEuros / basePrice) * 100);
                  if (effectivePct > 0) {
                    base[date] = priceMinEuros;
                    effectiveGaps[date] = effectivePct;
                  }
                  // sinon pas de remise visible (basePrice <= priceMin)
                } else {
                  base[date] = discounted;
                  effectiveGaps[date] = pct;
                }
              }
              return base;
            });
            if (Object.keys(effectiveGaps).length > 0) setGapDates(effectiveGaps);
          };

          // Essayer de charger le price_min depuis D1 (endpoint public)
          // Fallback : bien.prix (prix affiché sur le site) = plancher absolu
          fetch(`/api/rm-properties?id=${bien.id}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
              const pm = d?.property?.price_min;
              applyGaps(pm ? Math.round(pm / 100) : bien.prix);
            })
            .catch(() => applyGaps(bien.prix));
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
  const earlyLateFee    = EARLY_LATE_FEE[bien.id] ?? 50;
  const earlySuppl      = earlyCheckin  ? earlyLateFee : 0;
  const lateSuppl       = lateCheckout  ? earlyLateFee : 0;
  const baseTotal = rawTotal - discountAmount + fraisMenage + extraGuestSuppl + petSuppl + earlySuppl + lateSuppl;
  const promoDiscountAmt = promoData
    ? promoData.type === "percent"
      ? Math.round(baseTotal * promoData.value / 100)
      : Math.min(promoData.value, baseTotal)
    : 0;
  const total = baseTotal - promoDiscountAmt;
  const todayIso = new Date().toISOString().slice(0, 10);
  const twoPartOk = PAY_2X_ENABLED && isTwoPartEligible({ total, checkin, today: todayIso });
  const minNights = getMinNights(bien.id, checkin);
  const belowMin = nights > 0 && nights < minNights;

  const formOk = form.prenom && form.nom && form.email && form.email.includes("@");

  // Init Stripe — AUTO-SUFFISANT : attend window.Stripe (script async) puis
  // récupère la clé publique (module STRIPE_PK si déjà chargée, sinon fetch direct
  // /api/get-config). Ne dépend plus du timing du fetch module — cause du bouton
  // Payer désactivé quand STRIPE_PK n'était pas encore peuplé au montage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 50 && !window.Stripe; i++) await new Promise(r => setTimeout(r, 200));
      if (cancelled) return;
      if (!window.Stripe) { setStripeFailed(true); return; }
      let pk = STRIPE_PK;
      if (!pk) { try { const c = await fetch("/api/get-config").then(r => r.json()); pk = c.stripePk; } catch { /* ignore */ } }
      if (cancelled) return;
      if (!pk) { setStripeFailed(true); return; }
      setStripe(window.Stripe(pk));
    })();
    return () => { cancelled = true; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const stripeAppearance = { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } };

  async function validatePromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true); setPromoError("");
    try {
      const r = await fetch(`/api/promo-codes?validate=${encodeURIComponent(code)}&bien_id=${bien.id}`);
      const d = await r.json();
      if (d.valid) { setPromoData(d); setPromoError(""); }
      else setPromoError(d.error || "Code invalide");
    } catch { setPromoError("Erreur réseau"); }
    setPromoLoading(false);
  }

  async function goToPayment() {
    setPaying(true); setPayError("");
    try {
      // Résumé des upsells sélectionnés
      const selectedUpsells = getUpsells(bien.id).filter(u => upsells[u.id]);
      const upsellsStr = selectedUpsells.length > 0
        ? selectedUpsells.map(u => `${u.icon} ${u.label} (${u.price})`).join(", ")
        : "";

      // Payment intent
      const isTwoX = twoPartOk && payPlan === "2x";
      const chargeNow = isTwoX ? depositAmount(total) : total;
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: chargeNow * 100,
          currency: "eur",
          payPlan: isTwoX ? "2x" : "full",
          metadata: {
            bienId: bien.id, checkin, checkout,
            voyageur: `${form.prenom} ${form.nom}`, email: form.email,
            prenom: form.prenom?.trim() || "", nom: form.nom?.trim() || "", phone: form.tel?.trim() || "",
            nb_guests: String(nbGuests || 1), nb_pets: String(nbPets || 0),
            ...(earlyCheckin  ? { early_checkin:  "oui" } : {}),
            ...(lateCheckout  ? { late_checkout:  "oui" } : {}),
            ...(upsellsStr ? { upsells: upsellsStr } : {}),
            ...(promoData ? { promo_code: promoData.code, promo_value: String(promoDiscountAmt) } : {}),
            ...(isTwoX ? {
              balance_amount: String(balanceAmount(total)),
              due_date: balanceDueDate(checkin),
              full_total: String(total),
            } : {}),
            ...getAttributionMetadata(),
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Caution : plus de pré-autorisation à la réservation. Elle est posée automatiquement avant
      // l'arrivée (caution-cron, off-session sur la carte enregistrée). Cf. ADR-CAUTION-DEFERRED-001.
      const el = stripe.elements({ clientSecret: data.clientSecret, appearance: stripeAppearance });
      el.create("payment"); // mount happens in useEffect after step renders
      setElements(el);
      setStep(3);
      // add_payment_info — vrai dénominateur de paiement : le voyageur a rempli ses infos,
      // le PaymentIntent est créé, l'écran carte va s'afficher. Isole 2 fuites distinctes
      // (begin_checkout→add_payment_info = formulaire/technique ; add_payment_info→purchase = CB).
      if (!addPaymentInfoFired.current) {
        addPaymentInfoFired.current = true;
        const ckItems = [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights }];
        if (window.gtag) window.gtag("event", "add_payment_info", { bien_id: bien.id, currency: "EUR", value: total, items: ckItems });
        mpTrack("AddPaymentInfo", { value: total, currency: "EUR", content_ids: [bien.id], content_type: "product" });
      }
    } catch (e) { setPayError(e.message); }
    setPaying(false);
  }

  // Mount Stripe elements after React renders the target divs
  useEffect(() => {
    if (step === 3 && elements) {
      const pe = elements.getElement("payment");
      if (pe) pe.mount("#spe");
    }
  }, [step, elements]);

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
      // Mettre à jour pending_purchase avec pi pour fallback Merci.jsx (race page-unload)
      try {
        const existing = JSON.parse(sessionStorage.getItem("pending_purchase") || "{}");
        sessionStorage.setItem("pending_purchase", JSON.stringify({
          ...existing,
          pi: paymentIntent.id,
          value: total,
          bien_id: bien.id,
          niveau_tarifaire: niveauTarifaire(bien, checkin),
          items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights }],
        }));
      } catch { /* */ }
      if (window.gtag) {
        const guardKey = `ga_purchase_fired_${paymentIntent.id}`;
        if (!ssGet(guardKey)) {
          ssSet(guardKey, "1");
          window.gtag("event", "purchase", {
            transaction_id: paymentIntent.id,
            currency: "EUR",
            value: total,
            bien_id: bien.id,
            niveau_tarifaire: niveauTarifaire(bien, checkin),
            items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights }],
          });
          mpTrack("Purchase", { value: total, currency: "EUR", eventID: paymentIntent.id, content_ids: [bien.id], content_type: "product" });
        }
      }
      // Notifier l'hôte des upsells sélectionnés
      const selectedUpsells = getUpsells(bien.id).filter(u => upsells[u.id]);
      if (selectedUpsells.length > 0) {
        const upsellsMsg = selectedUpsells.map(u => `${u.icon} ${u.label} (${u.price})`).join("\n");
        fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: `${form.prenom} ${form.nom}`.trim(),
            email: form.email,
            bien: bien.nom,
            source: "upsell",
            message: `Services demandés après réservation (paiement ${paymentIntent.id}) :\n\n${upsellsMsg}\n\nDates : ${checkin} → ${checkout}`,
          }),
        }).catch(() => {}); // fire-and-forget
      }
      // Paiement réussi → confirmation. La caution est gérée automatiquement avant l'arrivée.
      window.location.href = "/merci";
    }
    setPaying(false);
  }

  const steps = ["Dates", "Coordonnées", "Paiement"];
  const stepLabels = ["Dates", "Vos infos", "Paiement"];
  const nSteps = stepLabels.length;
  const photo0 = bien.photos?.[0] || "";

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(14,59,58,0.72)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 1080,
        background: "#fff",
        borderRadius: 18, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.30)",
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gridTemplateRows: "1fr",
        height: "min(92vh, 860px)",
        position: "relative",
      }}
      className="bm-grid"
      >
      <style>{`
        @media(max-width:860px){.bm-grid{grid-template-columns:1fr!important}.bm-summary{display:none!important}.bm-mob-recap{display:flex!important}}
        .bm-body{overflow-y:auto;min-height:0;height:100%;box-sizing:border-box}
        .bm-summary{overflow-y:auto;min-height:0;height:100%;box-sizing:border-box}
        .bm-mob-recap{display:none}
      `}</style>

      {/* ── LEFT — corps ── */}
      <div className="bm-body" style={{ padding: "28px 28px 28px 32px" }}>

        {/* Barre de progression — paddingRight pour laisser place au ✕ */}
        <div style={{ marginBottom: 28, paddingRight: 52 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {stepLabels.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: step > i + 1 ? "#0e3b3a" : step === i + 1 ? CORAL : SAND,
                transition: "background 0.3s",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {stepLabels.map((lbl, i) => (
              <span key={i} style={{
                fontFamily: "'Jost', sans-serif", fontSize: 9,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: step === i + 1 ? CORAL : MUTED,
                fontWeight: step === i + 1 ? 700 : 400,
              }}>{lbl}</span>
            ))}
          </div>
        </div>

        {/* Bouton fermer */}
        <button onClick={onClose} aria-label="Fermer" style={{
          position: "absolute", top: 18, right: 18,
          background: SAND, border: "none", color: MUTED,
          width: 34, height: 34, borderRadius: 8,
          cursor: "pointer", fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10,
        }}>✕</button>

        {/* ── ÉTAPE 1 — Dates ── */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: 26 }}>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>
                Étape 1 sur {nSteps}
              </div>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, margin: "0 0 6px", lineHeight: 1.1 }}>
                Vos <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 400, color: CORAL, letterSpacing: 0, textTransform: "none" }}>dates</em>
              </h2>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 15, color: MUTED }}>
                Annulation gratuite jusqu'à 7 jours avant l'arrivée.
              </div>
            </div>

            {/* Récap dates si sélectionnées */}
            {checkin && checkout && (
              <div style={{
                background: CREAM, border: `1px solid ${SAND}`,
                borderRadius: 12, padding: "16px 20px",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                marginBottom: 18, alignItems: "center",
              }}>
                {[["Arrivée", formatDateLong(checkin)], ["Départ", formatDateLong(checkout)], ["Durée", `${nights} nuit${nights > 1 ? "s" : ""}`]].map(([lbl, val]) => (
                  <div key={lbl} style={{ padding: "0 14px", borderLeft: lbl !== "Arrivée" ? `1px solid ${SAND}` : "none" }}>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED, marginBottom: 4 }}>{lbl}</div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 15, color: NAVY }}>{val}</div>
                  </div>
                ))}
              </div>
            )}

            {loadingAvail && (
              <div style={{ textAlign: "center", padding: "8px 0 4px", color: MUTED, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <OrganicLoader size={18} color={CORAL} /> Chargement des disponibilités…
              </div>
            )}
            <DateRangePicker checkin={checkin} checkout={checkout} blockedDates={blockedDates} onChange={(ci, co) => { setCheckin(ci); setCheckout(co); if (ci && co && window.gtag) window.gtag("event", "date_selected", { bien_id: bien.id, checkin: ci, checkout: co, context: "booking_modal" }); }} dailyPricesMap={dailyPricesMap} basePrice={bien.prix} minNights={minNights} gapDates={gapDates} bienNom={bien.nom} />

            {/* Voyageurs */}
            {bien.capacite > 1 && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "13px 18px" }}>
                <span style={{ fontSize: 16 }}>👥</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: "'Jost', sans-serif" }}>Voyageurs</div>
                  {extraGuestRate > 0 && <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{baseGuests} inclus · {extraGuestRate}€/pers. suppl./nuit</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setNbGuests(g => Math.max(1, g - 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${SAND}`, background: IVORY, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, lineHeight: 1 }}>−</button>
                  <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, minWidth: 20, textAlign: "center" }}>{nbGuests}</span>
                  <button onClick={() => setNbGuests(g => Math.min(bien.capacite, g + 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${SAND}`, background: IVORY, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, lineHeight: 1 }}>+</button>
                </div>
              </div>
            )}

            {/* Nudge offre groupée — quand on atteint le max d'une villa de la résidence */}
            {["amaryllis","zandoli","geko","mabouya"].includes(bien.id) && nbGuests >= bien.capacite && (
              <a href="/location-groupe-sainte-luce" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "11px 16px", textDecoration: "none", color: NAVY, fontFamily: "'Jost', sans-serif" }}>
                <span style={{ fontSize: 16 }}>👨‍👩‍👧‍👦</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                  Groupe plus nombreux ? La <strong>Résidence Amaryllis</strong> accueille jusqu'à 11 personnes (3 logements) <span style={{ color: CORAL }}>→</span>
                </span>
              </a>
            )}

            {/* Animaux */}
            {!PETS_FORBIDDEN.has(bien.id) && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12, background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "13px 18px" }}>
                <span style={{ fontSize: 16 }}>🐾</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: "'Jost', sans-serif" }}>Animaux</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>Max {MAX_PETS} · {PET_SUPPLEMENT}€ forfait séjour</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setNbPets(p => Math.max(0, p - 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${SAND}`, background: IVORY, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, lineHeight: 1 }}>−</button>
                  <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, minWidth: 20, textAlign: "center" }}>{nbPets}</span>
                  <button onClick={() => setNbPets(p => Math.min(MAX_PETS, p + 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${SAND}`, background: IVORY, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, lineHeight: 1 }}>+</button>
                </div>
              </div>
            )}

            {/* Early check-in / Late check-out */}
            {nights > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { key: "early", label: "Early check-in", desc: "Arrivée avant 17h · selon disponibilité", icon: "🌅", val: earlyCheckin, set: setEarlyCheckin },
                  { key: "late",  label: "Late check-out",  desc: "Départ après 12h · selon disponibilité",  icon: "🌇", val: lateCheckout,  set: setLateCheckout  },
                ].map(opt => (
                  <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 14, background: opt.val ? `${CORAL}08` : CREAM, border: `1px solid ${opt.val ? CORAL : SAND}`, borderRadius: 12, padding: "13px 18px", cursor: "pointer" }}>
                    <input type="checkbox" checked={opt.val} onChange={e => opt.set(e.target.checked)} style={{ width: 16, height: 16, accentColor: CORAL, flexShrink: 0, cursor: "pointer" }} />
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{opt.icon}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, color: NAVY, display: "block" }}>{opt.label}</span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: MUTED }}>{opt.desc}</span>
                    </span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, color: opt.val ? CORAL : MUTED, whiteSpace: "nowrap" }}>+{earlyLateFee}€</span>
                  </label>
                ))}
              </div>
            )}

            {/* Trust row */}
            <div style={{ display: "flex", gap: 18, padding: "14px 0", borderTop: `1px solid ${SAND}`, borderBottom: `1px solid ${SAND}`, margin: "18px 0", flexWrap: "wrap" }}>
              {["Annulation gratuite J-14", "Aucun frais caché", "Réponse hôte < 1h"].map(t => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED }}>
                  <span style={{ color: "#16a34a", fontSize: 13 }}>✓</span>{t}
                </span>
              ))}
            </div>

            {/* CTA */}
            {nights > 0 ? (
              <>
                {/* ── Upsells — services optionnels ── */}
                {(() => {
                  const availUpsells = getUpsells(bien.id);
                  if (availUpsells.length === 0 || !nights) return null;
                  return (
                    <div style={{ borderTop: `1px solid ${SAND}`, paddingTop: 18, marginBottom: 18 }}>
                      <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: "0.35em", textTransform: "uppercase", color: MUTED, marginBottom: 12 }}>
                        Services en option
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {availUpsells.map(u => (
                          <label key={u.id} style={{
                            display: "flex", alignItems: "center", gap: 14,
                            background: upsells[u.id] ? `${CORAL}08` : IVORY,
                            border: `1px solid ${upsells[u.id] ? CORAL : SAND}`,
                            borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                            transition: "all 0.15s",
                          }}>
                            <input
                              type="checkbox"
                              checked={!!upsells[u.id]}
                              onChange={e => setUpsells(prev => ({ ...prev, [u.id]: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: CORAL, flexShrink: 0, cursor: "pointer" }}
                            />
                            <span style={{ fontSize: 22, flexShrink: 0 }}>{u.icon}</span>
                            <span style={{ flex: 1 }}>
                              <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, color: NAVY, display: "block" }}>{u.label}</span>
                              <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: MUTED }}>{u.desc}</span>
                            </span>
                            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, color: upsells[u.id] ? CORAL : MUTED, whiteSpace: "nowrap" }}>{u.price}</span>
                          </label>
                        ))}
                      </div>
                      {Object.values(upsells).some(Boolean) && (
                        <p style={{ fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif", margin: "10px 0 0", fontStyle: "italic" }}>
                          ✓ Votre hôte vous contactera pour confirmer les détails et le tarif exact.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Code promo */}
                {nights > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoData(null); setPromoError(""); }}
                        onKeyDown={e => e.key === "Enter" && validatePromo()}
                        placeholder="Code promo (optionnel)"
                        maxLength={20}
                        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${promoData ? "#10b981" : SAND}`, background: IVORY, fontFamily: "'Jost', sans-serif", fontSize: 13, letterSpacing: "0.05em", color: NAVY, outline: "none" }}
                      />
                      <button onClick={validatePromo} disabled={!promoInput.trim() || promoLoading}
                        style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${SAND}`, background: IVORY, fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 600, color: NAVY, cursor: !promoInput.trim() || promoLoading ? "not-allowed" : "pointer", opacity: !promoInput.trim() || promoLoading ? 0.5 : 1, whiteSpace: "nowrap" }}>
                        {promoLoading ? "…" : "Appliquer"}
                      </button>
                    </div>
                    {promoData && <div style={{ fontSize: 11, color: "#10b981", marginTop: 6, fontFamily: "'Jost', sans-serif" }}>✓ Code valide — −{promoDiscountAmt}€ appliqué</div>}
                    {promoError && <div style={{ fontSize: 11, color: "#e53e3e", marginTop: 6, fontFamily: "'Jost', sans-serif" }}>{promoError}</div>}
                  </div>
                )}

                {belowMin && (
                  <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 12 }}>
                    ⚠ Séjour minimum : {minNights} nuits pour ce bien
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <button onClick={() => generateDevis({ bien, checkin, checkout, nights, rawTotal, discountRate, discountAmount, fraisMenage, extraGuestSuppl, extraGuests, petSuppl, nbPets, total, depositAmt })}
                    style={{ background: "transparent", border: `1px solid ${SAND}`, color: MUTED, borderRadius: 8, padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Jost', sans-serif", letterSpacing: "0.04em" }}>
                    📄 Devis PDF
                  </button>
                  <button
                    onClick={() => {
                      if (belowMin) return;
                      const ckItems = [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights }];
                      if (window.gtag) window.gtag("event", "begin_checkout", { bien_id: bien.id, niveau_tarifaire: niveauTarifaire(bien, checkin), currency: "EUR", value: total, items: ckItems });
                      mpTrack("InitiateCheckout", { value: total, currency: "EUR", content_ids: [bien.id], content_type: "product" });
                      // Contexte pour le purchase fiable sur /merci après redirection 3DS
                      try { sessionStorage.setItem("pending_purchase", JSON.stringify({ value: total, bien_id: bien.id, niveau_tarifaire: niveauTarifaire(bien, checkin), items: ckItems })); } catch { /* */ }
                      setStep(2);
                    }}
                    style={{ background: belowMin ? SAND : CORAL, color: "#fff", border: "none", padding: "14px 30px", borderRadius: 8, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", cursor: belowMin ? "not-allowed" : "pointer", boxShadow: belowMin ? "none" : "0 4px 20px rgba(196,114,84,0.35)", opacity: belowMin ? 0.6 : 1, whiteSpace: "nowrap" }}
                  >{belowMin ? "Continuer →" : `Continuer · ${total}€ →`}</button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
                <div style={{ textAlign: "center", color: MUTED, fontSize: 14 }}>
                  Sélectionnez vos dates d'arrivée et de départ
                </div>
                <button disabled style={{ background: SAND, color: "#fff", border: "none", padding: "14px 30px", borderRadius: 8, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "not-allowed", opacity: 0.6, width: "100%", maxWidth: 320 }}>
                  Choisissez vos dates →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── ÉTAPE 2 — Vos infos ── */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: 26 }}>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Étape 2 sur {nSteps}</div>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, margin: "0 0 6px", lineHeight: 1.1 }}>
                À <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 400, color: CORAL, letterSpacing: 0, textTransform: "none" }}>qui</em> envoyer le récap ?
              </h2>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 15, color: MUTED }}>
                Confirmation + guide d'arrivée personnalisé 48h avant votre séjour.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FormField label="Prénom *" value={form.prenom} onChange={v => setForm(f => ({ ...f, prenom: v }))} autoComplete="given-name" />
              <FormField label="Nom *" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} autoComplete="family-name" />
              <FormField label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" autoComplete="email" style={{ gridColumn: "1/-1" }} />
              <FormField label="Téléphone" value={form.tel} onChange={v => setForm(f => ({ ...f, tel: v }))} type="tel" autoComplete="tel" style={{ gridColumn: "1/-1" }} />
              <FormField label="Message à votre hôte (optionnel)" value={form.message} onChange={v => setForm(f => ({ ...f, message: v }))} multiline style={{ gridColumn: "1/-1" }} />
            </div>

            <div style={{ display: "flex", gap: 16, padding: "12px 0", borderTop: `1px solid ${SAND}`, margin: "18px 0 0", flexWrap: "wrap" }}>
              {["Données chiffrées RGPD", "Jamais de spam — promis"].map(t => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED }}>
                  <span style={{ color: "#16a34a", fontSize: 13 }}>✓</span>{t}
                </span>
              ))}
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 10.5, color: MUTED, margin: "8px 0 0", lineHeight: 1.5 }}>
              En réservant, vous acceptez notre <a href="/politique-confidentialite" target="_blank" rel="noopener" style={{ color: CORAL, textDecoration: "underline" }}>politique de confidentialité</a>. Vos données servent uniquement à gérer votre séjour.
            </p>

            {/* Politique d'annulation */}
            <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "12px 16px", marginTop: 14 }}>
              <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED, marginBottom: 8 }}>
                Politique d'annulation
              </div>
              {[
                ["✓", "#16a34a", "Annulation gratuite jusqu'à J−14 — remboursement intégral"],
                ["◗", MUTED,     "Entre J−14 et J−2 — 50 % remboursé"],
                ["✗", MUTED,     "Moins de 48 h — non remboursable (report possible)"],
                ["🌀", "#0ea5e9", "Vigilance cyclonique orange/rouge — 100 % remboursé"],
              ].map(([icon, color, text]) => (
                <div key={text} style={{ display: "flex", gap: 8, fontFamily: "'Jost', sans-serif", fontSize: 11.5, color: NAVY, marginBottom: 4 }}>
                  <span style={{ width: 16, flexShrink: 0, color }}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {twoPartOk && (
              <div style={{ margin: "14px 0", border: `1px solid ${SAND}`, borderRadius: 12, padding: 12 }}>
                <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", marginBottom: 8 }}>
                  <input type="radio" name="payplan" checked={payPlan === "full"} onChange={() => setPayPlan("full")} />
                  <span style={{ fontSize: 14, color: NAVY }}>Payer la totalité maintenant — <strong>{total} €</strong></span>
                </label>
                <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                  <input type="radio" name="payplan" checked={payPlan === "2x"} onChange={() => setPayPlan("2x")} />
                  <span style={{ fontSize: 14, color: NAVY }}>
                    En 2 fois — <strong>{depositAmount(total)} €</strong> aujourd'hui, puis <strong>{balanceAmount(total)} €</strong> le {balanceDueDate(checkin).split("-").reverse().join("/")}
                  </span>
                </label>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 18, paddingTop: 18, borderTop: `1px solid ${SAND}` }}>
              <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12, letterSpacing: "0.06em" }}>← Retour</button>
              <button
                onClick={goToPayment}
                disabled={!formOk || paying || !stripe}
                style={{ background: formOk && !paying && stripe ? CORAL : SAND, color: "#fff", border: "none", padding: "14px 30px", borderRadius: 8, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", cursor: formOk && !paying && stripe ? "pointer" : "not-allowed", opacity: formOk && !paying && stripe ? 1 : 0.5, boxShadow: formOk && !paying && stripe ? "0 4px 20px rgba(196,114,84,0.35)" : "none" }}
              >{
                paying ? "Préparation du paiement sécurisé…"
                : stripeFailed ? "Paiement indisponible"
                : (formOk && !stripe) ? "Chargement du paiement sécurisé…"
                : payPlan === "2x" && twoPartOk ? `Payer l'acompte ${depositAmount(total)} € →`
                : "Passer au paiement →"
              }</button>
            </div>
            {/* Stripe injoignable (réseau/adblock) : ne pas laisser un bouton mort sans explication */}
            {stripeFailed && <div style={errStyle}>⚠ Le module de paiement n'a pas pu se charger (réseau ou bloqueur de publicité). Réessayez, ou écrivez-nous : on vous envoie un lien de paiement sécurisé.</div>}
            {payError && <div style={errStyle}>⚠ {payError}</div>}
          </>
        )}

        {/* ── ÉTAPE 3 — Paiement ── */}
        {step === 3 && (
          <>
            <div style={{ marginBottom: 26 }}>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Étape 3 sur {nSteps}</div>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, margin: "0 0 6px", lineHeight: 1.1 }}>
                Paiement <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 400, color: CORAL, letterSpacing: 0, textTransform: "none" }}>sécurisé</em>
              </h2>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 15, color: MUTED }}>
                Stripe · cryptage 256-bit{depositAmt > 0 ? ` · une caution de ${depositAmt.toLocaleString("fr-FR")} € sera pré-autorisée ~2 jours avant votre arrivée (jamais débitée).` : "."}
              </div>
            </div>

            {/* Card mock */}
            <div style={{ background: "linear-gradient(135deg, #0e3b3a 0%, #1a4a48 100%)", color: "var(--c-ivory)", borderRadius: 12, padding: "20px 24px", marginBottom: 18, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,166,115,0.4) 0%, transparent 70%)" }} />
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 15, color: "var(--c-gold)", marginBottom: 14 }}>Stripe Secure</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, letterSpacing: "0.18em", color: "rgba(250,245,233,0.92)", marginBottom: 14 }}>•••• •••• •••• ••••</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Jost', sans-serif", fontSize: 11, color: "rgba(250,245,233,0.65)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <span>Titulaire <span style={{ color: "var(--c-ivory)", fontWeight: 500 }}>{(form.prenom + " " + form.nom).toUpperCase().trim() || "—"}</span></span>
                <span>Total <span style={{ color: "var(--c-ivory)", fontWeight: 500 }}>{total}€</span></span>
              </div>
            </div>

            <div id="spe" style={{ marginBottom: 18 }} />

            <div style={{ display: "flex", gap: 16, padding: "12px 0", borderTop: `1px solid ${SAND}`, borderBottom: `1px solid ${SAND}`, margin: "0 0 18px", flexWrap: "wrap" }}>
              {["Paiement Stripe · 256-bit", "Caution libérée auto J+3"].map(t => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED }}>
                  <span style={{ color: "#16a34a", fontSize: 13 }}>🔒</span>{t}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12, letterSpacing: "0.06em" }}>← Retour</button>
              <button onClick={handlePay} disabled={paying} style={{ background: paying ? SAND : CORAL, color: "#fff", border: "none", padding: "15px 32px", borderRadius: 8, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", cursor: paying ? "not-allowed" : "pointer", boxShadow: paying ? "none" : "0 4px 20px rgba(196,114,84,0.35)" }}>
                {paying ? "Traitement…" : `✓ Confirmer et payer ${total}€`}
              </button>
            </div>
            {payError && <div style={errStyle}>⚠ {payError}</div>}
          </>
        )}

        {/* Récap prix mobile sticky — le panneau navy étant masqué <860px, le total reste visible en permanence */}
        {total > 0 && (
          <div className="bm-mob-recap" style={{
            position: "sticky", bottom: 0, marginTop: 16,
            display: "none", flexDirection: "column", gap: 2,
            background: "#0e3b3a", color: "var(--c-ivory)",
            borderRadius: 12, padding: "12px 16px",
            boxShadow: "0 -6px 20px rgba(0,0,0,0.18)",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(250,245,233,0.65)" }}>Total tout compris</span>
              <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 20, color: "var(--c-ivory)" }}>{total}€</span>
            </div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: "#6ee7b7" }}>
              💰 ~−{Math.round(total * 0.15 / 5) * 5}€ vs Airbnb · 0 frais de service
            </div>
          </div>
        )}

      </div>

      {/* ── RIGHT — panneau récap navy ── */}
      <aside className="bm-summary" style={{
        background: "#0e3b3a", color: "var(--c-ivory)",
        padding: 32, display: "flex", flexDirection: "column", gap: 16,
        overflowY: "auto",
      }}>
        {/* Badge */}
        {bien.tag && (
          <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 5, background: "rgba(201,166,115,0.18)", color: "var(--c-gold)", border: "1px solid rgba(201,166,115,0.4)", borderRadius: 999, padding: "5px 12px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            ⭐ {bien.tag}
          </div>
        )}

        {/* Photo */}
        {photo0 && (
          <div style={{ aspectRatio: "4/3", borderRadius: 12, background: `url('${photo0}') center/cover`, flexShrink: 0 }} />
        )}

        {/* Nom + lieu */}
        <div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--c-ivory)", margin: 0 }}>{bien.nom}</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "rgba(250,245,233,0.65)", marginTop: 3 }}>{bien.lieu}</div>
        </div>

        {/* Preuve sociale — maintenue jusqu'au paiement */}
        {bien.rating > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <RatingBadge rating={bien.rating} count={bien.reviews} dark />
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: "rgba(250,245,233,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#6ee7b7" }}>✓</span> Hôte Amaryllis · répond en moins d'1h
            </div>
          </div>
        )}

        <hr style={{ border: "none", borderTop: "1px solid rgba(250,245,233,0.10)", margin: "0" }} />

        {/* Dates + voyageurs */}
        {checkin && checkout && (
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(250,245,233,0.7)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{formatDateLong(checkin)} → {formatDateLong(checkout)}</span>
              <span>{nights} nuit{nights > 1 ? "s" : ""}</span>
            </div>
            <div>{nbGuests} voyageur{nbGuests > 1 ? "s" : ""}{nbPets > 0 ? ` · ${nbPets} animal${nbPets > 1 ? "x" : ""}` : ""}</div>
          </div>
        )}

        <hr style={{ border: "none", borderTop: "1px solid rgba(250,245,233,0.10)", margin: "0" }} />

        {/* Détail prix */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {nights > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(250,245,233,0.7)" }}>
              <span>{nights} nuit{nights > 1 ? "s" : ""}{nights > 0 ? ` · ${Math.round(rawTotal / nights)}€/nuit moy.` : ""}</span><span>{rawTotal}€</span>
            </div>
          )}
          {hasDiscount && (
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: CORAL }}>
              <span>Remise {discountLabel(nights)}</span><span>−{discountAmount}€</span>
            </div>
          )}
          {fraisMenage > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(250,245,233,0.7)" }}>
              <span>Ménage</span><span>{fraisMenage}€</span>
            </div>
          )}
          {extraGuestSuppl > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(250,245,233,0.7)" }}>
              <span>Suppl. voyageurs</span><span>+{extraGuestSuppl}€</span>
            </div>
          )}
          {petSuppl > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(250,245,233,0.7)" }}>
              <span>Animal{nbPets > 1 ? "x" : ""}</span><span>+{petSuppl}€</span>
            </div>
          )}
          {earlySuppl > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(250,245,233,0.7)" }}>
              <span>Early check-in</span><span>+{earlySuppl}€</span>
            </div>
          )}
          {lateSuppl > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(250,245,233,0.7)" }}>
              <span>Late check-out</span><span>+{lateSuppl}€</span>
            </div>
          )}
        </div>

        {nights > 0 && (
          <>
            <hr style={{ border: "none", borderTop: "1px solid rgba(250,245,233,0.10)", margin: "0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(250,245,233,0.65)" }}>Total tout compris</span>
              <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 26, color: "var(--c-ivory)" }}>{total}€</span>
            </div>
            {total > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Jost', sans-serif", fontSize: 12, color: "#6ee7b7" }}>
                <span>💰</span> Économie vs Airbnb ~−{Math.round(total * 0.15 / 5) * 5}€ · 0 frais de service
              </div>
            )}
            {depositAmt > 0 && (
              <div style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.30)", borderRadius: 8, padding: "10px 12px", fontFamily: "'Jost', sans-serif", fontSize: 11, color: "#6ee7b7", display: "flex", gap: 8, alignItems: "center" }}>
                🔒 + {depositAmt.toLocaleString("fr-FR")}€ caution pré-autorisée avant l'arrivée (jamais débitée)
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: "auto", paddingTop: 14, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "rgba(250,245,233,0.45)", lineHeight: 1.5 }}>
          « Notre équipe sur place vous accueille en personne et vous remet un guide d'accueil du Sud. »
        </div>
      </aside>

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

// ── Géo-personnalisation ─────────────────────────────────────────────────────
function useGeo() {
  const [geo, setGeo] = useState(null);
  useEffect(() => {
    const key = "amaryllis_geo";
    try {
      const c = JSON.parse(sessionStorage.getItem(key) || "null");
      // Cache 1h — le pays ne change pas en cours de session
      if (c && Date.now() - c.ts < 60 * 60 * 1000) { setGeo(c.data); return; }
    } catch {}
    fetch("/api/geo")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setGeo(d);
        try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
      })
      .catch(() => {});
  }, []);
  return geo;
}

// ── Météo live ───────────────────────────────────────────────────────────────
const WEATHER_ICONS = {
  // Map OpenWeatherMap icon codes → emoji
  "01": "☀️", "02": "🌤️", "03": "⛅", "04": "☁️",
  "09": "🌧️", "10": "🌦️", "11": "⛈️", "13": "❄️", "50": "🌫️",
};
function weatherEmoji(icon = "") { return WEATHER_ICONS[icon.slice(0, 2)] || "🌡️"; }

function useWeather(loc = "martinique") {
  const [wx, setWx] = useState(null);
  useEffect(() => {
    const key = `amaryllis_wx_${loc}`;
    try {
      const c = JSON.parse(sessionStorage.getItem(key) || "null");
      if (c && Date.now() - c.ts < 30 * 60 * 1000) { setWx(c.data); return; }
    } catch {}
    fetch(`/api/weather?loc=${loc}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d || d.error) return;
        setWx(d);
        try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
      })
      .catch(() => {});
  }, [loc]);
  return wx;
}

function WeatherStrip({ filterLieu }) {
  const loc = filterLieu === "Île-de-France" ? "nogent" : "martinique";
  const wx  = useWeather(loc);
  if (!wx) return null;
  const emoji = weatherEmoji(wx.icon);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "rgba(14,59,58,0.06)",
      border: "1px solid rgba(14,59,58,0.08)",
      borderRadius: 24, padding: "5px 14px",
      fontFamily: "'Jost', sans-serif", fontSize: 12, color: NAVY,
      fontWeight: 400, letterSpacing: "0.01em",
      marginBottom: 16,
    }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span style={{ fontWeight: 600 }}>{wx.loc}</span>
      <span style={{ color: CORAL, fontWeight: 700, fontSize: 14 }}>{wx.temp}°C</span>
      <span style={{ color: MUTED }}>{wx.desc}</span>
      <span style={{ color: MUTED, borderLeft: `1px solid ${SAND}`, paddingLeft: 8 }}>💧 {wx.humidity}%</span>
      <span style={{ color: MUTED }}>🌬 {wx.wind} km/h</span>
    </div>
  );
}

// ── Property Card ────────────────────────────────────────────────
// ── Badge disponibilité temps réel ───────────────────────────────────────────
function useAvailBadge(bienId) {
  const [badge, setBadge] = useState(null);
  const [nudge, setNudge] = useState(null);
  useEffect(() => {
    // Pas de badge pour les biens en location longue durée
    if (BOOKING_DISABLED.has(bienId)) return;
    // Cache 30min en sessionStorage pour ne pas re-fetcher à chaque render
    const cacheKey = `avail_badge_${bienId}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (cached && Date.now() - cached.ts < 30 * 60 * 1000) {
        setBadge(cached.badge);
        setNudge(cached.nudge ?? null);
        return;
      }
    } catch {}

    fetch(`/api/get-availability?bienId=${bienId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.blockedDates) return;
        const blocked = new Set(data.blockedDates);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const ds = (d) => d.toISOString().slice(0, 10);

        // Cherche le prochain créneau libre de 7 nuits consécutives dans les 90 jours
        let nextFree = null, streakStart = null, streak = 0;
        for (let i = 0; i <= 90; i++) {
          const d = new Date(today); d.setDate(today.getDate() + i);
          if (!blocked.has(ds(d))) {
            if (streak === 0) streakStart = d;
            streak++;
            if (streak >= 7 && !nextFree) nextFree = streakStart;
          } else {
            streak = 0; streakStart = null;
          }
        }

        // Compter les jours bloqués dans les 30 prochains jours
        let blocked30 = 0;
        for (let i = 0; i < 30; i++) {
          const d = new Date(today); d.setDate(today.getDate() + i);
          if (blocked.has(ds(d))) blocked30++;
        }

        // Compter les jours bloqués ce mois prochain
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextMonthEnd   = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        let blockedNext = 0, daysNext = 0;
        for (let d = new Date(nextMonthStart); d <= nextMonthEnd; d.setDate(d.getDate() + 1)) {
          daysNext++;
          if (blocked.has(ds(d))) blockedNext++;
        }

        const MOIS_COURT = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
        let b = null;
        if (blocked30 === 0 && !blocked.has(ds(today))) {
          b = { label: "Disponible cette semaine", color: "#10b981", bg: "rgba(16,185,129,0.92)" };
        } else if (blocked30 < 10) {
          b = { label: "Quelques dates libres", color: "#f59e0b", bg: "rgba(245,158,11,0.92)" };
        } else if (nextFree) {
          const diff = Math.round((nextFree - today) / 86400000);
          if (diff <= 7)       b = { label: "Libre dès cette semaine", color: "#10b981", bg: "rgba(16,185,129,0.92)" };
          else if (diff <= 30) b = { label: `Libre dès le ${nextFree.getDate()} ${MOIS_COURT[nextFree.getMonth()]}`, color: "#0ea5e9", bg: "rgba(14,165,233,0.92)" };
          else                 b = { label: `Libre en ${MOIS_COURT[nextFree.getMonth()]}`, color: "#0ea5e9", bg: "rgba(14,165,233,0.92)" };
        } else if (blockedNext / daysNext > 0.8) {
          b = { label: `Très demandé en ${MOIS_COURT[nextMonthStart.getMonth()]}`, color: "#ef4444", bg: "rgba(239,68,68,0.92)" };
        }
        // ── Nudge : week-ends libres dans les 90 prochains jours ─────────────
        // Un "week-end" = samedi + dimanche tous les deux libres
        let freeWeekends = 0;
        for (let i = 0; i <= 90; i++) {
          const d = new Date(today); d.setDate(today.getDate() + i);
          if (d.getDay() === 6) { // samedi
            const sun = new Date(d); sun.setDate(d.getDate() + 1);
            if (!blocked.has(ds(d)) && !blocked.has(ds(sun))) freeWeekends++;
          }
        }
        // Saison haute : juin–septembre (mois 5–8)
        const month = today.getMonth();
        const isPeak = month >= 4 && month <= 8; // mai→sept
        const MOIS_NOM = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
        let n = null;
        if (freeWeekends === 0) {
          n = { label: "⚡ Complet sur 3 mois", color: "#ef4444" };
        } else if (isPeak && freeWeekends <= 2) {
          n = { label: `⚡ Plus que ${freeWeekends} week-end${freeWeekends > 1 ? "s" : ""} libre${freeWeekends > 1 ? "s" : ""} cet été`, color: "#f97316" };
        } else if (isPeak && freeWeekends <= 4) {
          n = { label: `📅 ${freeWeekends} week-ends encore disponibles en ${MOIS_NOM[month <= 6 ? 6 : 7]}`, color: "#f59e0b" };
        } else if (!isPeak && freeWeekends <= 3) {
          n = { label: `📅 ${freeWeekends} week-end${freeWeekends > 1 ? "s" : ""} disponible${freeWeekends > 1 ? "s" : ""} sur 3 mois`, color: "#f59e0b" };
        }
        setBadge(b);
        setNudge(n);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ badge: b, nudge: n, ts: Date.now() })); } catch {}
      })
      .catch(() => {});
  }, [bienId]);
  return { badge, nudge };
}

function BienCard({ bien, onDetail, onBook, onPrefetch, isFavorite = false, onToggleFavorite, isCompared = false, onToggleCompare, compareDisabled = false, geoBadge = null }) {
  const { t, lang } = useLang();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const photos = bien.photos || [];
  const currentPhoto = photos[photoIdx] || "";
  const touchStartX = useRef(null);
  const { badge: availBadge, nudge: availNudge } = useAvailBadge(bien.id);

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
      // Plancher canonique (biens.js = min réel) comme borne : l'accroche n'est
      // jamais au-dessus du vrai prix plancher, même avant le chargement des
      // overrides serveur → cohérence garantie avec les guides/SEO.
      return Math.min(min === Infinity ? bien.prix : min, bien.prix || Infinity);
    } catch { return bien.prix; }
  }, [bien.id, bien.prix]);

  // Tendance prix : compare semaine 1 (j+0…+6) vs semaine 2 (j+7…+13)
  const priceTrend = useMemo(() => {
    if (PRICE_HIDDEN.has(bien.id)) return null;
    try {
      const map = loadDailyPrices()[bien.id] || {};
      const now = new Date();
      const ds = (offset) => { const d = new Date(now); d.setDate(now.getDate() + offset); return d.toISOString().slice(0, 10); };
      const week = (start, len) => {
        let sum = 0, n = 0;
        for (let i = start; i < start + len; i++) { const p = map[ds(i)]; if (p !== undefined) { sum += p; n++; } }
        return n > 0 ? sum / n : null;
      };
      const avg0 = week(0, 7);
      const avg1 = week(7, 7);
      if (!avg0 || !avg1) return null;
      const diff = (avg1 - avg0) / avg0;
      if (diff > 0.10)  return { label: `↗ +${Math.round(diff * 100)}% sem. prochaine`, color: "#fca5a5" };
      if (diff < -0.10) return { label: `↘ −${Math.round(-diff * 100)}% sem. prochaine`, color: "#4ade80" };
      return null;
    } catch { return null; }
  }, [bien.id]);

  // Auto-avance toutes les 5 s — se réinitialise à chaque navigation manuelle
  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => setPhotoIdx(i => (i + 1) % photos.length), 5000);
    return () => clearInterval(t);
  }, [photoIdx, photos.length]);

  return (
    <div
      onClick={() => onDetail(bien)}
      onMouseEnter={() => { setHovered(true); if (onPrefetch) onPrefetch(bien.id); }}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: CREAM,
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
            width="400"
            height="267"
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
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 3 }}>
            <Chip variant="onPhoto">{lang === "fr" ? bien.tag : (bien.tagEn || bien.tag)}</Chip>
          </div>
        )}

        {/* Badge géo-personnalisé */}
        {/* Badge "Réservation directe" */}
        {!PRICE_HIDDEN.has(bien.id) && (
          <div style={{
            position: "absolute", top: 12, right: 14, zIndex: 3,
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

        {/* Availability badge — real-time from iCal */}
        {availBadge && (
          <div style={{
            position: "absolute", bottom: 14, left: 10, zIndex: 5,
            background: availBadge.bg,
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.22)",
            color: "#fff", fontSize: 11, fontWeight: 700,
            padding: "4px 10px", borderRadius: 20,
            letterSpacing: "0.03em",
            fontFamily: "'Jost', sans-serif",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}>
            {availBadge.label}
          </div>
        )}

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
        <Eyebrow style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
          {bien.lieu}
        </Eyebrow>

        {/* Name + rating inline */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div
            onClick={e => { e.stopPropagation(); onDetail(bien); }}
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: NAVY, cursor: "pointer", transition: "color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = CORAL; }}
            onMouseLeave={e => { e.currentTarget.style.color = NAVY; }}
          >{bien.nom}</div>
          {bien.rating && (
            <a href={`/avis?bien=${bien.id}`} onClick={e => e.stopPropagation()} style={{ textDecoration: "none", flexShrink: 0 }}>
              <RatingBadge rating={bien.rating} count={bien.reviews} />
            </a>
          )}
        </div>

        {/* Capacity row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: MUTED }}>
          <Icon name="map-pin" size={12} color={MUTED} />
          <span>{bien.lieu}</span>
          <span style={{ color: SAND }}>·</span>
          <Icon name="users" size={12} color={MUTED} />
          <span>{bien.capacite}</span>
          <span style={{ color: SAND }}>·</span>
          <Icon name="bed" size={12} color={MUTED} />
          <span>{bien.lits}</span>
        </div>

        {/* Amenities — piscine en premier, max 4 */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, marginTop: 4 }}>
          {(lang === "fr" ? (bien.amenities || []) : (bien.amenitiesEn || bien.amenities || [])).slice(0, 4).map(a => (
            <Chip key={a} style={{ fontSize: 11, padding: "3px 8px" }}>{a}</Chip>
          ))}
        </div>

        {/* CTA row — 1 seul CTA principal */}
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
          {BOOKING_DISABLED.has(bien.id) ? (
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Bonjour, je suis intéressé(e) par Villa Iguana pour une location longue durée à Sainte-Luce, Martinique. Pouvez-vous m'indiquer vos conditions et disponibilités ? Merci.")}`}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                flex: 1, background: NAVY, border: "none", color: "var(--c-ivory)",
                borderRadius: 6, padding: "12px 20px",
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
              onClick={e => {
                e.stopPropagation();
                if (window.gtag) window.gtag("event", "select_item", { item_list_id: "villas", items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix || 0, currency: "EUR" }] });
                onDetail(bien);
              }}
              style={{
                flex: 1, background: NAVY, border: "none", color: "#fff",
                borderRadius: 6, padding: "12px 20px",
                fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 13,
                letterSpacing: "0.06em", cursor: "pointer", transition: "opacity 0.2s",
                textTransform: "uppercase",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {lang === "fr" ? "Voir les disponibilités →" : "Check availability →"}
            </button>
          )}
        </div>
        {/* pub-010 : badge économies directes vs OTA */}
        {!BOOKING_DISABLED.has(bien.id) && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
              {t("banner1")}
            </span>
            <span style={{
              fontSize: 10, fontFamily: "'Jost', sans-serif", fontWeight: 600,
              color: "#16a34a", background: "rgba(22,163,74,0.08)",
              border: "1px solid rgba(22,163,74,0.2)",
              borderRadius: 4, padding: "2px 6px", letterSpacing: "0.03em", whiteSpace: "nowrap",
            }}>
              −15% vs Airbnb
            </span>
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

// ── Rebond inter-biens ──────────────────────────────────────────
// Quand le bien consulté est complet sur les dates voulues, on cherche les autres
// logements du parc RÉELLEMENT libres sur la même plage (récupération de demande).
async function findFreeAlternatives({ wantCheckin, wantCheckout, currentBienId, signal }) {
  if (!wantCheckin || !wantCheckout || wantCheckout <= wantCheckin) return [];
  const nights = dateDiff(wantCheckin, wantCheckout);
  if (nights < 1) return [];
  const allPrices = loadDailyPrices();
  let bookingUrls = {};
  try { bookingUrls = JSON.parse(localStorage.getItem("ical_urls_booking") || "{}"); } catch { /* ignore */ }
  const current = BIENS.find(b => b.id === currentBienId);
  const curCanon = CANON[currentBienId];
  const candidates = BIENS.filter(b => {
    if (b.id === currentBienId || BOOKING_DISABLED.has(b.id)) return false;
    // RM-20 : rebond uniquement intra-marché — ne jamais proposer Nogent sur une
    // fiche Martinique (ni l'inverse). Comparaison sur le canonique BRUT (CANON[id]),
    // car BIENS[].lieu est enrichi (« …, Martinique ») et fausserait isMartinique.
    if (curCanon && CANON[b.id] && isMartiniqueCanon(CANON[b.id]) !== isMartiniqueCanon(curCanon)) return false;
    return true;
  });
  const results = await Promise.all(candidates.map(async b => {
    try {
      let url = `/api/get-availability?bienId=${b.id}`;
      if (bookingUrls[b.id]) url += `&bookingUrl=${encodeURIComponent(bookingUrls[b.id])}`;
      const r = await fetch(url, signal ? { signal } : undefined);
      if (!r.ok) return null;
      const d = await r.json();
      const blocked = d.blockedDates || [];
      // Toute la plage [checkin, checkout[ doit être libre
      let cur = wantCheckin;
      for (let i = 0; i < nights; i++) {
        if (blocked.includes(cur)) return null;
        cur = addDays(cur, 1);
      }
      // Séjour minimum respecté ?
      if (nights < getMinNights(b.id, wantCheckin)) return null;
      // Prix total réel
      const map = allPrices[b.id] || {};
      let sum = 0; cur = wantCheckin;
      for (let i = 0; i < nights; i++) { sum += map[cur] ?? b.prix; cur = addDays(cur, 1); }
      const disc = getDiscount(nights);
      const discAmt = disc > 0 ? Math.round(sum * disc) : 0;
      const frais = FRAIS_MENAGE[b.id] ?? 0;
      return { bien: b, nights, total: sum - discAmt + frais };
    } catch { return null; }
  }));
  const free = results.filter(Boolean);
  // Tri : même secteur d'abord, puis prix croissant
  free.sort((a, b) => {
    const aSame = current && a.bien.lieu === current.lieu ? 0 : 1;
    const bSame = current && b.bien.lieu === current.lieu ? 0 : 1;
    if (aSame !== bSame) return aSame - bSame;
    return a.total - b.total;
  });
  return free.slice(0, 3);
}

function ReboundSuggestions({ rebound, currentNom, onDismiss }) {
  if (!rebound) return null;
  const { wantCheckin, wantCheckout, loading, suggestions } = rebound;
  const dateStr = `${formatDateShort(wantCheckin)} → ${formatDateShort(wantCheckout)}`;
  return (
    <div style={{ marginTop: 16, background: CREAM, border: `1px solid ${SAND}`, borderRadius: 14, padding: "16px 18px", animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: NAVY, fontWeight: 600, lineHeight: 1.4 }}>
          {currentNom} n'est pas libre du {dateStr.toLowerCase()}.
          {!loading && suggestions.length > 0 && (
            <span style={{ display: "block", fontWeight: 400, color: MUTED, fontSize: 12, marginTop: 3 }}>
              Mais ces logements le sont — réservez en direct, mêmes dates :
            </span>
          )}
        </div>
        <button onClick={onDismiss} aria-label="Fermer" style={{ background: "none", border: "none", color: MUTED, fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
      </div>

      {loading ? (
        <div style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "center", color: MUTED, fontSize: 12, fontFamily: "'Jost', sans-serif" }}>
          <span className="skeleton" style={{ width: 54, height: 54, borderRadius: 8 }} />
          <span>Recherche d'autres logements disponibles…</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, fontFamily: "'Jost', sans-serif" }}>
          Aucun autre logement libre sur ces dates pour le moment.
        </div>
      ) : (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {suggestions.map(({ bien: b, nights, total }) => (
            <a
              key={b.id}
              href={`/${b.id}?checkin=${wantCheckin}&checkout=${wantCheckout}`}
              style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", background: IVORY, border: `1px solid ${SAND}`, borderRadius: 10, padding: 8, transition: "box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
            >
              <img src={`/photos/${b.id}/01.webp`} alt={b.nom} loading="lazy" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, color: NAVY, fontWeight: 600, lineHeight: 1.1 }}>{b.nom}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED, marginTop: 2 }}>{b.lieu} · {b.capacite} pers.</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 700, color: CORAL }}>{total}€</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, color: MUTED }}>{nights} nuit{nights > 1 ? "s" : ""}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: NAVY, fontWeight: 600, marginTop: 2 }}>Voir →</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Property Detail (full-screen) ───────────────────────────────
function PropertyDetail({ bien, onClose, onBook, blockedDates = [], loadingAvail = false, isPage = false, initialCheckin = null, initialCheckout = null }) {
  useMinNights(); // re-render when admin changes min nights
  const { t, lang } = useLang();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFull, setShowFull] = useState(false);
  const [calCheckin, setCalCheckin] = useState(initialCheckin || null);
  const [calCheckout, setCalCheckout] = useState(initialCheckout || null);
  // Sync when dates arrive async (availability loaded after mount) + navigate calendar to the right month
  useEffect(() => {
    if (initialCheckin && !calCheckin) {
      setCalCheckin(initialCheckin);
      const now = new Date();
      const ci = new Date(initialCheckin + "T12:00:00");
      const off = (ci.getFullYear() - now.getFullYear()) * 12 + (ci.getMonth() - now.getMonth());
      if (off > 0) setCalOffset(off);
    }
    if (initialCheckout && !calCheckout) setCalCheckout(initialCheckout);
  }, [initialCheckin, initialCheckout]); // eslint-disable-line react-hooks/exhaustive-deps
  const [calHovered, setCalHovered] = useState(null);
  const [calOffset, setCalOffset] = useState(0);
  const [showAlerte, setShowAlerte] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [rebound, setRebound] = useState(null);       // { wantCheckin, wantCheckout, loading, suggestions }
  const [reboundReq, setReboundReq] = useState(null);  // { wantCheckin, wantCheckout } — déclencheur
  // Quand le client tente une plage indisponible, on cherche les autres biens libres.
  useEffect(() => {
    if (!reboundReq) return;
    const { wantCheckin, wantCheckout } = reboundReq;
    if (!wantCheckin || !wantCheckout || wantCheckout <= wantCheckin) return;
    const ctrl = new AbortController();
    findFreeAlternatives({ wantCheckin, wantCheckout, currentBienId: bien.id, signal: ctrl.signal })
      .then(suggestions => { if (!ctrl.signal.aborted) setRebound({ wantCheckin, wantCheckout, loading: false, suggestions }); })
      .catch(() => { if (!ctrl.signal.aborted) setRebound(null); });
    return () => ctrl.abort();
  }, [reboundReq, bien.id]);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [googleRevs, setGoogleRevs] = useState(null); // null = pas encore chargé
  const [voyageurRevs, setVoyageurRevs] = useState(null); // vrais avis Airbnb (D1, non masqués)
  const infoPanelRef = useRef(null);
  const photos = bien.photos || [];
  // Filmstrip desktop universel : Amaryllis a un reel à droite (slice dès la photo 2) ;
  // les autres biens ont déjà 2 vignettes (photos 2-3) → le filmstrip enchaîne dès la photo 4 (pas de doublon).
  const filmstripStart = bien.id === "amaryllis" ? 1 : 3;
  const filmstripPhotos = photos.slice(filmstripStart, filmstripStart + 4);
  const touchStartXDetail = useRef(null);

  // Google reviews — Amaryllis (fiche dédiée) + biens de la résidence Sainte-Luce (place=residence).
  // Schœlcher/Nogent n'ont pas de fiche Google → avis statiques.
  useEffect(() => {
    const GOOGLE_PLACE_BY_BIEN = { amaryllis: "amaryllis", zandoli: "residence", geko: "residence", mabouya: "residence" };
    const place = GOOGLE_PLACE_BY_BIEN[bien.id];
    if (!place) { setGoogleRevs(STATIC_REVIEWS); return; }
    fetch(`/api/google-reviews?place=${place}`)
      .then(r => r.json())
      .then(d => { if (d.ok && d.reviews?.length) setGoogleRevs(d.reviews); else setGoogleRevs(STATIC_REVIEWS); })
      .catch(() => setGoogleRevs(STATIC_REVIEWS));
  }, [bien.id]);

  // Vrais avis voyageurs Airbnb (D1, non masqués) — pour tous les biens.
  useEffect(() => {
    let alive = true;
    fetch(`/api/voyageur-feedback?action=public&bien=${encodeURIComponent(bien.id)}&limit=12`)
      .then(r => r.json())
      .then(d => { if (alive && d.ok && d.reviews?.length) setVoyageurRevs(d.reviews); })
      .catch(() => {});
    return () => { alive = false; };
  }, [bien.id]);

  // Signaux dynamiques — disponibilité + nudge + tendance prix
  const { badge: detailAvailBadge, nudge: detailNudge } = useAvailBadge(bien.id);
  const detailPriceTrend = useMemo(() => {
    if (PRICE_HIDDEN.has(bien.id)) return null;
    try {
      const map = loadDailyPrices()[bien.id] || {};
      const now = new Date();
      const dStr = (offset) => { const d = new Date(now); d.setDate(now.getDate() + offset); return d.toISOString().slice(0, 10); };
      const weekAvg = (start, len) => {
        let sum = 0, n = 0;
        for (let i = start; i < start + len; i++) { const p = map[dStr(i)]; if (p !== undefined) { sum += p; n++; } }
        return n > 0 ? sum / n : null;
      };
      const avg0 = weekAvg(0, 7), avg1 = weekAvg(7, 7);
      if (!avg0 || !avg1) return null;
      const diff = (avg1 - avg0) / avg0;
      if (diff > 0.10)  return { label: `↗ +${Math.round(diff * 100)}% la semaine prochaine`, color: CORAL };
      if (diff < -0.10) return { label: `↘ −${Math.round(-diff * 100)}% la semaine prochaine`, color: "#16a34a" };
      return null;
    } catch { return null; }
  }, [bien.id]);

  // Signal de preuve sociale — scarcity/demand basé sur les dates bloquées
  const socialProofMsg = useMemo(() => {
    if (PRICE_HIDDEN.has(bien.id) || loadingAvail) return null;
    try {
      const now = new Date();
      const checkMonth = (y, m) => {
        const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const startDay = (y === now.getFullYear() && m === now.getMonth()) ? now.getDate() : 1;
        let avail = 0;
        for (let d = startDay; d <= daysInMonth; d++) {
          const ds = `${monthStr}-${String(d).padStart(2, "0")}`;
          if (!blockedDates.includes(ds)) avail++;
        }
        return { avail, total: daysInMonth - startDay + 1 };
      };
      // Mois prochain en priorité
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const { avail: nAvail, total: nTotal } = checkMonth(next.getFullYear(), next.getMonth());
      const monthName = next.toLocaleDateString("fr-FR", { month: "long" });
      if (nAvail === 0) return `Complet en ${monthName}`;
      if (nAvail <= 5) return `Plus que ${nAvail} nuit${nAvail > 1 ? "s" : ""} disponible${nAvail > 1 ? "s" : ""} en ${monthName}`;
      const pctBooked = (nTotal - nAvail) / nTotal;
      if (pctBooked >= 0.7) return `${Math.round(pctBooked * 100)}% de ${monthName} déjà réservé`;
      // Mois courant
      const { avail: cAvail, total: cTotal } = checkMonth(now.getFullYear(), now.getMonth());
      const cMonth = now.toLocaleDateString("fr-FR", { month: "long" });
      const cPct = (cTotal - cAvail) / cTotal;
      if (cPct >= 0.7) return `${Math.round(cPct * 100)}% de ${cMonth} déjà réservé`;
      return null;
    } catch { return null; }
  }, [bien.id, blockedDates, loadingAvail]);

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

  // Récupérer les remises gap depuis le worker (trous de calendrier) — avec plancher price_min
  useEffect(() => {
    fetch("https://amaryllis-ical-sync.vinsmaf.workers.dev/gap-prices")
      .then(r => r.json())
      .then(data => {
        const bienGaps = data[bien.id] || {};
        if (Object.keys(bienGaps).length > 0) {
          const applyGaps = (priceMinEuros) => {
            const effectiveGaps = {};
            setDailyPricesMap(prev => {
              const base = { ...prev };
              const seed = (() => { try { return loadDailyPrices()[bien.id] || {}; } catch { return {}; } })();
              for (const [date, pct] of Object.entries(bienGaps)) {
                const basePrice = seed[date] ?? bien.prix;
                const discounted = Math.round(basePrice * (1 - pct / 100));
                if (priceMinEuros > 0 && discounted < priceMinEuros) {
                  const effectivePct = Math.floor((1 - priceMinEuros / basePrice) * 100);
                  if (effectivePct > 0) { base[date] = priceMinEuros; effectiveGaps[date] = effectivePct; }
                } else {
                  base[date] = discounted; effectiveGaps[date] = pct;
                }
              }
              return base;
            });
            if (Object.keys(effectiveGaps).length > 0) setGapDates(effectiveGaps);
          };
          fetch(`/api/rm-properties?id=${bien.id}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => applyGaps(d?.property?.price_min ? Math.round(d.property.price_min / 100) : bien.prix))
            .catch(() => applyGaps(bien.prix));
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
    const handler = () => setShowStickyBar(panel.scrollTop > 120);
    panel.addEventListener("scroll", handler, { passive: true });
    return () => panel.removeEventListener("scroll", handler);
  }, []);

  // Auto-scroll on page load: scroll just enough to show the full booking widget
  // Disable Chrome scroll restoration so the page always starts at top.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  const arrowBtn = (label, fn) => (
    <button key={label} aria-label={label === "←" ? "Photo précédente" : "Photo suivante"} onClick={e => { e.stopPropagation(); fn(); }} style={{
      pointerEvents: "auto",
      background: "rgba(250,245,233,0.18)", backdropFilter: "blur(8px)",
      border: "1px solid rgba(250,245,233,0.35)", color: "var(--c-ivory)",
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
              key={photoIdx}
              src={photos[photoIdx]}
              alt={`${bien.nom} — ${bien.lieu} — photo ${photoIdx + 1}`}
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block", userSelect: "none",
                animation: "lb-fadein 0.22s ease",
              }}
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
        <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: isMobile ? 11 : 13, letterSpacing: isMobile ? "0.2em" : "0.45em", color: "var(--c-ivory)", textTransform: "uppercase", flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {bien.nom}
        </div>
        {isPage && !PRICE_HIDDEN.has(bien.id) && !isMobile && (
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
            style={{ background: "none", border: `1px solid rgba(250,245,233,0.22)`, borderRadius: 8, padding: isMobile ? "6px 8px" : "7px 14px", fontFamily: "'Jost', sans-serif", fontSize: 11, color: "rgba(250,245,233,0.7)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0, whiteSpace: "nowrap", transition: "border-color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.22)"; }}
          >
            {shareCopied ? "✓" : isMobile ? "📤" : "📤 Partager"}
          </button>
        )}
        {!isMobile && <ThemeToggle inline />}
        {!BOOKING_DISABLED.has(bien.id) ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => calCheckin && calCheckout && !calBelowMin ? onBook(bien, calCheckin, calCheckout) : onBook(bien)}
            style={{ flexShrink: 0 }}
          >
            {calCheckin && calCheckout && !calBelowMin
              ? `${calNights} nuits · ${calTotal}€ →`
              : lang === "fr" ? `${CTA_LABEL_FR} · ${bien.prix}€/nuit` : `BOOK · €${bien.prix}/night`}
          </Button>
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

        {/* ── Sticky mini-bar — top (desktop) / fixed bottom (mobile) ── */}
        {/* design-008 : bottom bar fixe sur mobile, sticky top sur desktop */}
        {showStickyBar && !BOOKING_DISABLED.has(bien.id) && (
          <div style={{
            position: isMobile ? "fixed" : "sticky",
            ...(isMobile ? { bottom: 0, left: 0, right: 0, paddingBottom: "max(12px, env(safe-area-inset-bottom))" } : { top: 0 }),
            zIndex: isMobile ? 200 : 50,
            background: IVORY,
            borderTop: isMobile ? `1px solid ${SAND}` : "none",
            borderBottom: isMobile ? "none" : `1px solid ${SAND}`,
            boxShadow: isMobile ? "0 -4px 20px rgba(14,59,58,0.1)" : "none",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: isMobile ? "12px 20px" : "10px 24px",
            animation: "fadeIn 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              {photos[0] && (
                <img src={photos[0]} alt="" loading="lazy" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, color: NAVY, fontFamily: "'Jost', sans-serif", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bien.nom}</span>
                  {bien.rating && !isMobile && (
                    <RatingBadge rating={bien.rating} count={bien.reviews} />
                  )}
                </div>
                {!PRICE_HIDDEN.has(bien.id) && (
                  <>
                    <div>
                      <span style={{ color: CORAL, fontWeight: 700, fontSize: 14 }}>{bien.prix}€</span>
                      <span style={{ color: MUTED, fontSize: 11, marginLeft: 4 }}>/nuit</span>
                    </div>
                    {isMobile && (
                      <div style={{ fontSize: 9, color: "#14b8a6", fontWeight: 600, fontFamily: "'Jost', sans-serif", letterSpacing: "0.02em", marginTop: 2 }}>
                        ✓ {lang === "fr" ? "Prix direct · paiement sécurisé" : "Direct price · secure payment"}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <button data-cta-reservation data-cta-position="header" onClick={() => { trackConversion("cta_label", { position: "header" }); onBook(bien); }} style={{ background: CORAL, border: "none", color: "#fff", borderRadius: 8, padding: "9px 20px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer", letterSpacing: "0.05em" }}>
              {lang === "fr" ? `${CTA_LABEL_FR} →` : "BOOK →"}
            </button>
          </div>
        )}

        {/* ── PHOTO SECTION ── */}
        {isMobile ? (
          /* Mobile: carousel */
          <div style={{ position: "relative", height: "min(62vw, 320px)", background: "#061616", flexShrink: 0 }}>
            <div
              onClick={() => {
                if (photos.length === 0) return;
                setLightboxOpen(true);
                if (window.gtag) window.gtag("event", "view_gallery", { item_id: bien.id, item_name: bien.nom, photo_index: photoIdx });
              }}
              onTouchStart={onDetailTouchStart}
              onTouchEnd={onDetailTouchEnd}
              style={{ position: "absolute", inset: 0, cursor: "zoom-in" }}
            >
              {photos[photoIdx] && (
                <RImg
                  key={photoIdx}
                  src={photos[photoIdx]}
                  alt={`${bien.nom} — ${bien.lieu} — photo ${photoIdx + 1}`}
                  sizes="100vw"
                  loading={photoIdx === 0 ? "eager" : "lazy"}
                  fetchPriority={photoIdx === 0 ? "high" : undefined}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>
            {/* Compteur */}
            <div style={{ position: "absolute", bottom: 12, right: 14, background: "rgba(14,59,58,0.65)", color: "var(--c-ivory)", fontSize: 11, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 20, zIndex: 2 }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 3, background: "#061616", flexShrink: 0 }}>

            {/* ── Rangée héro : photo pleine hauteur gauche + reel/grille droite ── */}
            <div style={{ position: "relative", display: "flex", height: "clamp(300px, 45vh, 460px)", gap: 3 }}>

              {/* ── Photo principale — flex:1, prend tout l'espace restant ── */}
              <div
                style={{ flex: 1, position: "relative", cursor: "zoom-in", overflow: "hidden" }}
                onClick={() => { setPhotoIdx(0); setLightboxOpen(true); }}
              >
                {photos[0] && (
                  <RImg
                    src={photos[0]}
                    alt={`${bien.nom} — photo principale`}
                    sizes="(max-width: 1200px) 72vw, 900px"
                    fetchPriority="high"
                    loading="eager"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", display: "block", transition: "transform 0.4s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                  />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.2) 42%, transparent 62%)", pointerEvents: "none" }} />

                {/* Prix visible dès le premier regard — pill top-right */}
                {bien.prix && (
                  <div style={{
                    position: "absolute", top: 14, right: 14,
                    background: "rgba(14,59,58,0.78)", backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 999, padding: "6px 14px",
                    display: "flex", alignItems: "baseline", gap: 4,
                    pointerEvents: "none",
                  }}>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 18, color: "#faf5e9", letterSpacing: "-0.01em" }}>{bien.prix}€</span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: "0.05em" }}>/nuit</span>
                  </div>
                )}

                {/* Overlay bas : titre + rating + capacité */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 24px", pointerEvents: "none" }}>
                  <Eyebrow style={{ color: "rgba(255,255,255,0.65)", marginBottom: 4 }}>{bien.lieu}</Eyebrow>
                  <Display as="h2" size="md" color="#fff" style={{ marginBottom: 8 }}>{bien.nom}</Display>
                  {bien.rating && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <a href={`/avis?bien=${bien.id}`} style={{ textDecoration: "none" }}><RatingBadge rating={bien.rating} count={bien.reviews} dark /></a>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "'Jost', sans-serif" }}>
                        <Icon name="users" size={13} color="rgba(255,255,255,0.6)" />{bien.capacite}
                        <span style={{ opacity: 0.4 }}>·</span>
                        <Icon name="bed" size={13} color="rgba(255,255,255,0.6)" />{bien.chambres} ch.
                      </span>
                      {bien.tag && <Chip variant="onPhoto">{bien.tag}</Chip>}
                    </div>
                  )}
                </div>

                {/* Bouton "Voir toutes les photos" — dans la photo, pas sur le reel */}
                <button
                  onClick={e => { e.stopPropagation(); setLightboxOpen(true); }}
                  style={{
                    position: "absolute", bottom: 12, right: 12,
                    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.22)", borderRadius: 8,
                    color: "#fff", padding: "8px 16px",
                    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11,
                    letterSpacing: "0.1em", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, zIndex: 4,
                    pointerEvents: "auto",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.78)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.55)"; }}
                >
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {photos.length} photos
                </button>
              </div>

              {/* ── Colonne droite : largeur fixe 320px — reel prend toute la hauteur ── */}
              <div style={{
                flex: "0 0 320px",
                height: "100%",
                overflow: "hidden",
                background: "#050e10",
              }}>
                {bien.id === "amaryllis" ? (
                  /* Reel cinématique plein-hauteur — Villa Amaryllis */
                  <Suspense fallback={
                    <div style={{ width: "100%", height: "100%", background: "radial-gradient(ellipse at top, #0e3b3a 0%, #050608 100%)" }} />
                  }>
                    <VillaAmaryllisReel
                      fillHeight={true}
                      titleText={lang === "fr" ? "L'HORIZON POUR VOUS SEULS" : "YOUR OWN HORIZON"}
                      titleSub={lang === "fr" ? "Vue océan · 3 suites · piscine privée" : "Ocean view · 3 suites · private pool"}
                      hook={lang === "fr"
                        ? "Votre piscine privée. L'Atlantique en face. Rien d'autre."
                        : "Your private pool. The Atlantic ahead. Nothing else."}
                      ctaLabel={lang === "fr" ? "RÉSERVER EN DIRECT" : "BOOK DIRECTLY"}
                      onCta={() => onBook(bien)}
                      price={bien.prix ?? "280"}
                    />
                  </Suspense>
                ) : bien.id === "geko" ? (
                  <Suspense fallback={<div style={{ width:"100%", height:"100%", background:"radial-gradient(ellipse at top, #0e3b3a 0%, #050608 100%)" }} />}>
                    <GekoReel fillHeight={true} onCta={() => onBook(bien)} price={String(bien.prix ?? "110")} />
                  </Suspense>
                ) : bien.id === "zandoli" ? (
                  <Suspense fallback={<div style={{ width:"100%", height:"100%", background:"radial-gradient(ellipse at top, #0e3b3a 0%, #050608 100%)" }} />}>
                    <ZandoliReel fillHeight={true} onCta={() => onBook(bien)} price={String(bien.prix ?? "110")} />
                  </Suspense>
                ) : bien.id === "mabouya" ? (
                  <Suspense fallback={<div style={{ width:"100%", height:"100%", background:"radial-gradient(ellipse at top, #0e3b3a 0%, #050608 100%)" }} />}>
                    <MabouaReel fillHeight={true} onCta={() => onBook(bien)} price={String(bien.prix ?? "70")} />
                  </Suspense>
                ) : bien.id === "schoelcher" ? (
                  <Suspense fallback={<div style={{ width:"100%", height:"100%", background:"radial-gradient(ellipse at top, #0e3b3a 0%, #050608 100%)" }} />}>
                    <SchoelcherReel fillHeight={true} onCta={() => onBook(bien)} price={String(bien.prix ?? "90")} />
                  </Suspense>
                ) : bien.id === "nogent" ? (
                  <Suspense fallback={<div style={{ width:"100%", height:"100%", background:"radial-gradient(ellipse at top, #0e3b3a 0%, #050608 100%)" }} />}>
                    <NogentReel fillHeight={true} onCta={() => onBook(bien)} price={String(bien.prix ?? "90")} />
                  </Suspense>
                ) : (
                  /* Hero court : 2 vignettes empilées (lisibles) plutôt qu'une grille 2×2 minuscule */
                  <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1fr", gridTemplateRows: "1fr 1fr", gap: 3 }}>
                    {[1, 2].map(idx => (
                      photos[idx] ? (
                        <div
                          key={idx}
                          style={{ position: "relative", overflow: "hidden", cursor: "zoom-in" }}
                          onClick={() => { setPhotoIdx(idx); setLightboxOpen(true); }}
                        >
                          <RImg
                            src={photos[idx]}
                            alt={`${bien.nom} — photo ${idx + 1}`}
                            sizes="(max-width: 1024px) 30vw, 240px"
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
                )}
              </div>

            </div>

            {/* ── Filmstrip photos sous le héro (desktop, tous les biens) ── */}
            {filmstripPhotos.length > 0 && (
              <div style={{ display: "flex", height: 110, gap: 3, overflow: "hidden" }}>
                {filmstripPhotos.map((src, i) => (
                  <div
                    key={src}
                    style={{ flex: 1, position: "relative", overflow: "hidden", cursor: "zoom-in" }}
                    onClick={() => { setPhotoIdx(filmstripStart + i); setLightboxOpen(true); }}
                    onMouseEnter={e => { const img = e.currentTarget.querySelector("img"); if (img) img.style.filter = "brightness(1)"; }}
                    onMouseLeave={e => { const img = e.currentTarget.querySelector("img"); if (img) img.style.filter = "brightness(0.82)"; }}
                  >
                    <RImg
                      src={src}
                      alt={`${bien.nom} — photo ${filmstripStart + i + 1}`}
                      sizes="25vw"
                      loading="eager"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.82)", transition: "filter 0.25s" }}
                    />
                    {/* "Voir toutes les photos" sur la dernière vignette */}
                    {i === filmstripPhotos.length - 1 && photos.length > filmstripStart + filmstripPhotos.length && (
                      <div style={{
                        position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                        pointerEvents: "none",
                      }}>
                        <span style={{ fontSize: 20 }}>📷</span>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", color: "#fff", textAlign: "center", lineHeight: 1.4 }}>
                          Voir toutes<br />les photos
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Transition filmstrip → cream ── */}
        {!isMobile && filmstripPhotos.length > 0 && (
          <div style={{ height: 32, background: "linear-gradient(to bottom, #061616, var(--c-cream, #f5ede0))" }} />
        )}

        {/* ── Breakout cream — Calendrier de réservation réel (design-008 v3) ── */}
        {bien.id === "amaryllis" && !PRICE_HIDDEN.has(bien.id) && !BOOKING_DISABLED.has(bien.id) && (
          <div
            id="amaryllis-pricing"
            style={{
              background: "var(--c-cream, #f5ede0)",
              padding: isMobile ? "36px 20px 44px" : "52px 48px 60px",
              scrollMarginTop: 80,
            }}
          >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              {/* Eyebrow */}
              <div style={{
                fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10,
                letterSpacing: "0.22em", textTransform: "uppercase",
                color: "#9a8c7e", marginBottom: 12, textAlign: "center",
              }}>
                {lang === "fr" ? "TARIFS & DISPONIBILITÉS" : "RATES & AVAILABILITY"}
              </div>
              {/* Phrase éditoriale */}
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: "italic", fontSize: isMobile ? 18 : 24,
                color: "#5a5248", lineHeight: 1.5,
                margin: "0 0 32px", textAlign: "center",
              }}>
                {lang === "fr"
                  ? "Réservez en direct et économisez jusqu'à 300€ sur votre séjour."
                  : "Book directly and save up to €300 on your stay."}
              </p>

              {/* ── Trust bar — avantages réservation directe ── */}
              <div style={{
                display: "flex", flexWrap: "wrap", justifyContent: "center",
                gap: isMobile ? "10px 16px" : "8px 28px",
                marginBottom: 24,
              }}>
                {[
                  { icon: "✓", text: lang === "fr" ? "Sans frais Airbnb (−15%)" : "No Airbnb fees (−15%)" },
                  { icon: "✓", text: lang === "fr" ? "Prix direct propriétaire" : "Owner direct price" },
                  { icon: "✓", text: lang === "fr" ? "Paiement 100% sécurisé" : "100% secure payment" },
                  { icon: "✓", text: lang === "fr" ? "Support direct 24h/24" : "24/7 direct support" },
                ].map(item => (
                  <span key={item.text} style={{
                    fontFamily: "'Jost', sans-serif", fontWeight: 400,
                    fontSize: isMobile ? 11 : 12, color: "#6b5e52",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <span style={{ color: "#2d7a5e", fontWeight: 700, fontSize: 13 }}>{item.icon}</span>
                    {item.text}
                  </span>
                ))}
              </div>

              {/* Signal de preuve sociale */}
              {socialProofMsg && (
                <div style={{
                  textAlign: "center", marginBottom: 20,
                  fontFamily: "'Jost', sans-serif", fontWeight: 400,
                  fontSize: 13, letterSpacing: "0.04em",
                  color: CORAL,
                }}>
                  🔥 {socialProofMsg}
                </div>
              )}

              {/* ── Calendrier interactif réel ── */}
              {loadingAvail ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: MUTED, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13 }}>
                  Chargement des disponibilités…
                </div>
              ) : (
                <DateRangePicker
                  checkin={calCheckin}
                  checkout={calCheckout}
                  blockedDates={blockedDates}
                  onChange={(ci, co) => { setCalCheckin(ci); setCalCheckout(co); if (ci && co && window.gtag) window.gtag("event", "date_selected", { bien_id: bien.id, checkin: ci, checkout: co, context: "fiche" }); }}
                  dailyPricesMap={dailyPricesMap}
                  basePrice={bien.prix}
                  minNights={getMinNights(bien.id, calCheckin)}
                  gapDates={gapDates}
                  bienNom={bien.nom}
                />
              )}

              {/* ── Récap complet après sélection des dates (identique au widget bas) ── */}
              {calCheckin && calCheckout && calNights > 0 && !calBelowMin && (
                <div style={{
                  marginTop: 24,
                  background: IVORY,
                  border: `1px solid ${SAND}`,
                  borderRadius: 14,
                  padding: "20px 28px",
                  display: "flex",
                  gap: 32,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}>
                  {/* Détail lignes */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: MUTED, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 12 }}>
                      {lang === "fr" ? "Détail du séjour" : "Stay breakdown"}
                    </div>
                    {/* Dates */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: NAVY, fontFamily: "'Jost', sans-serif", fontWeight: 300, marginBottom: 6 }}>
                      <span>{formatDateShort(calCheckin)} → {formatDateShort(calCheckout)} · {calNights} nuit{calNights > 1 ? "s" : ""}</span>
                      <span>{calRawTotal}€</span>
                    </div>
                    {/* Remise si applicable */}
                    {calDiscountAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#14b8a6", fontFamily: "'Jost', sans-serif", fontWeight: 400, marginBottom: 6 }}>
                        <span>🎁 Remise {discountLabel(calNights)} (−{Math.round(calDiscountRate * 100)}%)</span>
                        <span>−{calDiscountAmount}€</span>
                      </div>
                    )}
                    {/* Frais de ménage */}
                    {calFrais > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, fontFamily: "'Jost', sans-serif", fontWeight: 300, marginBottom: 6 }}>
                        <span>🧹 Frais de ménage</span>
                        <span>{calFrais}€</span>
                      </div>
                    )}
                    <div style={{ height: 1, background: SAND, margin: "10px 0" }} />
                    {/* Total */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: NAVY, letterSpacing: "0.06em", textTransform: "uppercase" }}>Total TTC</span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, color: NAVY, lineHeight: 1 }}>{calTotal}€</span>
                    </div>
                    {/* Économie vs Airbnb */}
                    <div style={{ marginTop: 6, fontSize: 11, color: "#14b8a6", fontFamily: "'Jost', sans-serif", fontWeight: 400 }}>
                      💰 ~{Math.round(calTotal * 0.15 / 5) * 5}€ économisés vs Airbnb (pas de frais de service)
                    </div>
                  </div>
                  {/* CTA */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "center", minWidth: 180 }}>
                    <button
                      onClick={() => onBook(bien, calCheckin, calCheckout)}
                      style={{
                        fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13,
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        color: "var(--c-ivory, #faf5e9)", background: CORAL,
                        border: "none", borderRadius: 999,
                        padding: "14px 28px", cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "background 0.2s, transform 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = NAVY; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = CORAL; e.currentTarget.style.transform = "none"; }}
                    >
                      {lang === "fr" ? "Réserver maintenant" : "Book now"}
                    </button>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: MUTED, textAlign: "center", margin: 0, letterSpacing: "0.04em" }}>
                      {lang === "fr" ? "Réponse sous 24h · 0 frais de service" : "Reply within 24h · No service fee"}
                    </p>
                  </div>
                </div>
              )}

              {/* Sans dates sélectionnées : lien discret vers le bas */}
              {!calCheckin && (
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "#9a8c7e", letterSpacing: "0.06em" }}>
                    {lang === "fr" ? "Réponse garantie sous 24h · Pas de frais de service" : "Response within 24h · No service fee"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Content area ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", gap: 56, alignItems: "flex-start" }}>

          {/* ── Left column ── */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 32, paddingBottom: 64 }}>

            {/* ── Bandeau location longue durée — visible si réservation désactivée ── */}
            {BOOKING_DISABLED.has(bien.id) && (
              <div style={{
                background: "linear-gradient(135deg, rgba(14,59,58,0.07) 0%, rgba(14,59,58,0.04) 100%)",
                border: "1px solid rgba(14,59,58,0.15)",
                borderLeft: "4px solid var(--c-navy)",
                borderRadius: 10,
                padding: "18px 20px",
                marginBottom: 28,
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🏡</span>
                <div>
                  <p style={{ margin: "0 0 6px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY }}>
                    Villa disponible en location longue durée uniquement
                  </p>
                  <p style={{ margin: 0, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                    Cette villa n'est pas proposée à la nuitée. Pour un séjour mensuel ou saisonnier, contactez-nous sur{" "}
                    <a
                      href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par ${bien.nom} pour une location longue durée.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: NAVY, fontWeight: 500, textDecoration: "underline" }}
                    >WhatsApp</a>{" "}
                    ou par email —{" "}
                    <a href="mailto:contact@villamaryllis.com" style={{ color: NAVY, fontWeight: 500, textDecoration: "underline" }}>contact@villamaryllis.com</a>.
                    Nous répondons sous 24h.
                  </p>
                </div>
              </div>
            )}

            {/* ── Bandeau réservation directe ── */}
            {!BOOKING_DISABLED.has(bien.id) && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                background: "rgba(196,114,84,0.07)", border: "1px solid rgba(196,114,84,0.2)",
                borderRadius: 9, padding: "10px 16px", marginBottom: 22,
              }}>
                <span style={{ fontSize: 15 }}>💰</span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 12, color: NAVY, letterSpacing: "0.03em" }}>
                  Réservation directe propriétaire — Économisez jusqu'à 15% vs Airbnb
                </span>
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour, je souhaite réserver ${bien.nom} en direct. Pouvez-vous me confirmer les disponibilités et le tarif ?`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: CORAL, textDecoration: "none", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}
                >
                  💬 Nous contacter →
                </a>
              </div>
            )}

            {/* Location + titre — masqués sur desktop (déjà dans l'overlay photo) */}
            {isMobile && (
              <>
                <Eyebrow style={{ marginBottom: 10 }}>{bien.lieu}</Eyebrow>
                <Display as="h2" size="lg" style={{ margin: "0 0 14px" }}>{bien.nom}</Display>
              </>
            )}

            {/* Rating + stats — masqués sur desktop (déjà dans l'overlay photo) */}
            {bien.rating && isMobile && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", color: MUTED, fontSize: 13, marginBottom: 22 }}>
                <a href={`/avis?bien=${bien.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "inherit", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                >
                  <span style={{ color: GOLD }}>★ {bien.rating}</span>
                  {bien.reviews && <span>· {bien.reviews} {t("reviewsLabel")}</span>}
                </a>
                <span>· {bien.capacite} {t("guests")}</span>
                <span>· {bien.chambres} {t("rooms")}</span>
                <span>· {bien.sdb} sdb</span>
              </div>
            )}

            {/* Stats bar — desktop uniquement (titre déjà dans l'overlay photo) */}
            {!isMobile && bien.rating && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", alignItems: "center", color: MUTED, fontSize: 13, marginBottom: 22, paddingBottom: 22, borderBottom: `1px solid ${SAND}` }}>
                <a href={`/avis?bien=${bien.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "inherit", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                >
                  <span style={{ color: GOLD, fontWeight: 600 }}>★ {bien.rating}</span>
                  {bien.reviews && <span>· {bien.reviews} {t("reviewsLabel")}</span>}
                </a>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>· <Icon name="users" size={13} color={MUTED} />{bien.capacite}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="bed" size={13} color={MUTED} />{bien.chambres} ch.</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="bath" size={13} color={MUTED} />{bien.sdb} sdb</span>
              </div>
            )}

            {isMobile && <div style={{ height: 1, background: SAND, marginBottom: 26 }} />}

            {/* ── Signaux dynamiques ── */}
            {(detailAvailBadge || detailNudge || detailPriceTrend) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, animation: "fadeIn 0.5s ease" }}>
                {detailAvailBadge && (
                  <span style={{
                    background: detailAvailBadge.bg, color: "#fff",
                    fontSize: 11, fontWeight: 700, padding: "5px 12px",
                    borderRadius: 20, fontFamily: "'Jost', sans-serif",
                    letterSpacing: "0.03em",
                  }}>
                    {detailAvailBadge.label}
                  </span>
                )}
                {detailNudge && (
                  <span style={{
                    background: `${detailNudge.color}18`,
                    border: `1px solid ${detailNudge.color}40`,
                    color: detailNudge.color,
                    fontSize: 11, fontWeight: 600, padding: "5px 12px",
                    borderRadius: 20, fontFamily: "'Jost', sans-serif",
                    letterSpacing: "0.01em",
                  }}>
                    {detailNudge.label}
                  </span>
                )}
                {detailPriceTrend && (
                  <span style={{
                    background: `${detailPriceTrend.color}15`,
                    border: `1px solid ${detailPriceTrend.color}35`,
                    color: detailPriceTrend.color,
                    fontSize: 11, fontWeight: 600, padding: "5px 12px",
                    borderRadius: 20, fontFamily: "'Jost', sans-serif",
                    letterSpacing: "0.01em",
                  }}>
                    {detailPriceTrend.label}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: 32 }}>
              <Editorial style={{ fontSize: isMobile ? 17 : 19, lineHeight: 1.85 }}>
                {lang === "fr" ? bien.desc : (bien.descEn || bien.desc)}
              </Editorial>

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
                        <Eyebrow color="muted" tracking="0.42em" style={{ marginBottom: 9, color: bien.couleur || undefined }}>{s.titre}</Eyebrow>
                      )}
                      <Editorial style={{ fontSize: isMobile ? 15 : 17 }}>{s.texte}</Editorial>
                    </div>
                  ))}

                  {/* Informations pratiques */}
                  {bien.descFull.find(s => s.items) && (
                    <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 8, padding: isMobile ? "20px 18px" : "24px 28px", marginTop: 12 }}>
                      <Eyebrow color="muted" tracking="0.42em" style={{ marginBottom: 20 }}>
                        {bien.descFull.find(s => s.items).titre || "Informations pratiques"}
                      </Eyebrow>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "14px 0" : "16px 40px" }}>
                        {bien.descFull.find(s => s.items).items.map((it, j) => (
                          <div key={j}>
                            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, marginBottom: 5 }}>{it.label}</div>
                            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: TEXT, lineHeight: 1.65 }}>{it.texte}</div>
                            {it.lien && <div style={{ marginTop: 6 }}>{it.lien}</div>}
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
              <Eyebrow color="muted" style={{ marginBottom: 14 }}>{lang === "fr" ? "Équipements" : "Amenities"}</Eyebrow>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(lang === "fr" ? bien.amenities : (bien.amenitiesEn || bien.amenities)).map(a => (
                  <Chip key={a}>{a}</Chip>
                ))}
              </div>
            </div>

            {/* ── Lien contextuel SEO in-content (dé-orpheline les landings commerciales) ── */}
            {(() => {
              const aS = { color: CORAL, textDecoration: "underline", fontStyle: "normal" };
              const CTX = {
                amaryllis: <>Amaryllis fait partie de nos <a style={aS} href="/location-villa-martinique-piscine">villas avec piscine en Martinique</a> ; idéale aussi pour <a style={aS} href="/sainte-luce-martinique">séjourner à Sainte-Luce</a>.</>,
                iguana:    <>Découvrez toutes <a style={aS} href="/location-villa-martinique-piscine">nos villas avec piscine à Sainte-Luce</a>, ou comment <a style={aS} href="/sainte-luce-martinique">séjourner à Sainte-Luce</a> côté sud.</>,
                geko:      <>Géko peut se <a style={aS} href="/location-groupe-sainte-luce">réserver avec Zandoli et Mabouya pour un grand groupe</a>, à <a style={aS} href="/sainte-luce-martinique">Sainte-Luce</a>.</>,
                zandoli:   <>Pour une <a style={aS} href="/location-groupe-sainte-luce">location pour un grand groupe à Sainte-Luce</a>, combinez Zandoli avec Géko et Mabouya. Tout sur <a style={aS} href="/sainte-luce-martinique">Sainte-Luce</a>.</>,
                mabouya:   <>Mabouya se <a style={aS} href="/location-groupe-sainte-luce">combine avec 2 logements jusqu'à 11 personnes</a> ; à <a style={aS} href="/sainte-luce-martinique">Sainte-Luce</a>, plages à 7 min en voiture.</>,
                schoelcher:<>En savoir plus sur cet <a style={aS} href="/location-appartement-vue-mer-schoelcher">appartement vue mer à Schœlcher</a>.</>,
              }[bien.id];
              return CTX ? (
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: 15, color: MUTED, margin: "0 0 32px", lineHeight: 1.6 }}>{CTX}</p>
              ) : null;
            })()}

            {/* Tarifs prévisionnels — design-007 : PricingCalendar inline */}
            {/* Sur desktop pour amaryllis : déjà affiché dans le breakout reel — ne pas dupliquer */}
            {!PRICE_HIDDEN.has(bien.id) && !BOOKING_DISABLED.has(bien.id) && !PRICING_CAL_HIDDEN.has(bien.id) && (isMobile || bien.id !== "amaryllis") && (
              <>
                <div style={{ height: 1, background: SAND, marginBottom: 26 }} />
                <PricingCalendar bien={bien} isMobile={isMobile} />
              </>
            )}

            {/* Disponibilités — always in left column (mobile: always; desktop: if booking enabled) */}
            {!BOOKING_DISABLED.has(bien.id) && (() => {
              const minNights = getMinNights(bien.id, calCheckin);
              const calNightsLocal = calCheckin && calCheckout ? dateDiff(calCheckin, calCheckout) : 0;
              const calBelowMinLocal = calNightsLocal > 0 && calNightsLocal < minNights;
              const now = new Date();
              const baseY = now.getFullYear(), baseM = now.getMonth();
              const y1 = baseY + Math.floor((baseM + calOffset) / 12);
              const m1 = (baseM + calOffset) % 12;
              const y2 = baseY + Math.floor((baseM + calOffset + 1) / 12);
              const m2 = (baseM + calOffset + 1) % 12;

              const minCheckinStr = addDays(today(), 1);
              const handleSelect = (ds) => {
                if (!calCheckin || (calCheckin && calCheckout)) {
                  if (ds < minCheckinStr) return; // 24h minimum
                  setCalCheckin(ds); setCalCheckout(null);
                } else if (ds <= calCheckin) {
                  setCalCheckin(ds); setCalCheckout(null);
                } else {
                  const n = Math.round((new Date(ds) - new Date(calCheckin)) / 86400000);
                  if (n < minNights) return;
                  let cur = addDays(calCheckin, 1);
                  let blocked = false;
                  while (cur < ds) { if (blockedDates.includes(cur)) { blocked = true; break; } cur = addDays(cur, 1); }
                  if (blocked) { setRebound({ wantCheckin: calCheckin, wantCheckout: ds, loading: true, suggestions: [] }); setReboundReq({ wantCheckin: calCheckin, wantCheckout: ds }); setCalCheckin(ds); setCalCheckout(null); }
                  else { setCalCheckout(ds); setRebound(null); setReboundReq(null); }
                }
                setCalHovered(null);
              };

              const calendarBlock = (
                <>
                  {/* Social proof mobile */}
                  {socialProofMsg && !calCheckin && (
                    <div style={{ marginBottom: 10, fontSize: 12, color: CORAL, fontFamily: "'Jost', sans-serif", fontWeight: 500 }}>
                      🔥 {socialProofMsg}
                    </div>
                  )}
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
                        minCheckin={minCheckinStr}
                      />
                    ))}
                  </div>

                  {/* Notice 24h */}
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef9f0", border: "1px solid #f0e0c0", borderRadius: 8, fontSize: 12, color: "#7a5c2e", fontFamily: "'Jost', sans-serif", lineHeight: 1.5 }}>
                    ⏱ Réservation en ligne : minimum 24h à l'avance.{" "}
                    Besoin pour <strong>aujourd'hui</strong> ?{" "}
                    <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour, je souhaite réserver ${bien.nom} pour cette nuit. Est-ce possible ?`)}`} style={{ color: "#25d366", fontWeight: 600, textDecoration: "none" }}>WhatsApp</a>
                    {" "}ou{" "}
                    <a href="mailto:contact@villamaryllis.com" style={{ color: "#0e3b3a", fontWeight: 600, textDecoration: "none" }}>email</a>.
                  </div>

                  {/* Légende disponibilité */}
                  <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif" }}>
                      <span style={{ width: 22, height: 22, background: IVORY, border: `1px solid ${SAND}`, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: NAVY, fontWeight: 500 }}>8</span>
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
                  <ReboundSuggestions rebound={rebound} currentNom={bien.nom} onDismiss={() => setRebound(null)} />
                </>
              );

              /* On mobile, show full calendar + price summary in left column.
                 On desktop, the sticky widget already shows the calendar — hide left column duplicate. */
              if (!isMobile) return null;
              return (
                <>
                  <div style={{ height: 1, background: SAND, marginBottom: 26 }} />
                  <div style={{ marginBottom: 32 }}>
                    {/* Trust bar — visible avant sélection dates, uniquement hors Amaryllis (qui a sa propre section) */}
                    {bien.id !== "amaryllis" && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginBottom: 16 }}>
                        {[
                          lang === "fr" ? "Sans frais Airbnb (−15%)" : "No Airbnb fees (−15%)",
                          lang === "fr" ? "Prix direct propriétaire" : "Owner direct price",
                          lang === "fr" ? "Paiement 100% sécurisé" : "100% secure payment",
                        ].map(text => (
                          <span key={text} style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 11, color: "#6b5e52", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: "#2d7a5e", fontWeight: 700, fontSize: 12 }}>✓</span>
                            {text}
                          </span>
                        ))}
                      </div>
                    )}
                    <Eyebrow color="muted" style={{ marginBottom: 14 }}>{lang === "fr" ? "Disponibilités" : "Availability"}</Eyebrow>
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
                          data-cta-reservation data-cta-position="calendar-inline"
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
                  <Eyebrow color="muted" style={{ marginBottom: 14 }}>Localisation</Eyebrow>
                  <div style={{ fontSize: 13, color: TEXT, fontFamily: "'Jost', sans-serif", fontWeight: 300, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: CORAL }}>📍</span> {bien.lieu}
                    <span style={{ color: SAND, fontSize: 11, marginLeft: 4 }}>· Position approximative</span>
                  </div>
                  <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${SAND}` }}>
                    <Suspense fallback={<div style={{ height: isMobile ? 220 : 280, background: "#f0ebe0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#9a8f82" }}>Chargement de la carte…</div>}>
                      <PropertyMap bien={bien} height={isMobile ? 220 : 280} />
                    </Suspense>
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
                  {PROXIMITE[bien.id] && PROXIMITE[bien.id].length > 0 && (
                    <div style={{ marginTop: 18, background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "16px 18px" }}>
                      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: CORAL, marginBottom: 12 }}>
                        {lang === "fr" ? "À proximité" : "Nearby"}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        {PROXIMITE[bien.id].map((p, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Jost', sans-serif" }}>
                            <span style={{ fontSize: 17, width: 22, textAlign: "center", flexShrink: 0 }}>{p.icon}</span>
                            <span style={{ flex: 1, fontSize: 13, color: NAVY, fontWeight: 400 }}>{p.lieu}</span>
                            <span style={{ fontSize: 12, color: MUTED, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{p.temps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Avis voyageurs */}
            {/* ── Avis voyageurs — Airbnb + Google fusionnés ── */}
            {((bien.avis && bien.avis.length > 0) || googleRevs || (voyageurRevs && voyageurRevs.length > 0)) && (() => {
              const stripHtml = (t) => String(t || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
              const frDate = (iso) => { const m = /^(\d{4})-(\d{2})/.exec(iso || ""); return m ? `${MOIS[+m[2] - 1]} ${m[1]}` : (iso || ""); };
              // Source Airbnb : VRAIS avis (D1, non masqués) si dispo, sinon repli sur les avis statiques.
              const airbnbCards = (voyageurRevs && voyageurRevs.length > 0
                ? voyageurRevs.map((a, i) => ({
                    key: `vf-${i}`,
                    initial: (a.prenom || "V")[0],
                    avatar: null,
                    name: a.prenom || "Voyageur",
                    date: frDate(a.review_date),
                    rating: a.rating,
                    text: stripHtml(a.review_text),
                    source: "airbnb",
                  }))
                : (bien.avis || []).map(a => ({
                    key: `ab-${a.nom}`,
                    initial: a.nom[0],
                    avatar: null,
                    name: `${a.nom} ${a.pays || ""}`.trim(),
                    date: a.date,
                    rating: a.note,
                    text: a.texte,
                    source: "airbnb",
                  })));
              // Normalisation Google → format commun
              const gCards = (googleRevs || []).map((r, i) => ({
                key: `g-${i}`,
                initial: r.author?.[0] ?? "?",
                avatar: r.avatar || null,
                name: r.author,
                date: r.time,
                rating: r.rating,
                text: r.text,
                source: "google",
              }));
              const allCards = [...airbnbCards, ...gCards];
              const totalCount = (bien.reviews ?? 0) + (googleRevs ? (googleRevs.length) : 0);
              return (
                <>
                  <div style={{ height: 1, background: SAND, marginBottom: 26 }} />
                  <div style={{ marginBottom: 32 }}>
                    <Eyebrow color="muted" style={{ marginBottom: 18 }}>
                      Avis · ★ {bien.rating} · {totalCount > (bien.reviews ?? 0) ? totalCount : bien.reviews} avis vérifiés
                    </Eyebrow>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {allCards.map(c => (
                        <div key={c.key} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "18px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            {c.avatar
                              ? <img loading="lazy" decoding="async" src={c.avatar} alt={c.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={e => e.currentTarget.style.display = "none"} />
                              : <div style={{ width: 36, height: 36, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", color: IVORY, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                                  {c.initial}
                                </div>
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: NAVY }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: GOLD }}>{"★".repeat(c.rating)}<span style={{ color: MUTED, fontWeight: 300, marginLeft: 5 }}>{c.date}</span></div>
                            </div>
                            {/* Badge source */}
                            {c.source === "google" ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.7 }}>
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                            ) : (
                              <span style={{ fontSize: 9, fontWeight: 700, color: "#ff5a5f", fontFamily: "'Jost', sans-serif", letterSpacing: "0.04em", flexShrink: 0, opacity: 0.8 }}>Airbnb</span>
                            )}
                          </div>
                          <Editorial size="sm">"{c.text?.length > 280 ? c.text.slice(0, 280) + "…" : c.text}"</Editorial>
                        </div>
                      ))}
                    </div>
                    {/* CTA — page avis */}
                    <a
                      href={`/avis?bien=${bien.id}`}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        marginTop: 18,
                        fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13,
                        color: NAVY, textDecoration: "none",
                        border: `1px solid ${SAND}`, borderRadius: 8,
                        padding: "10px 18px",
                        transition: "border-color 0.2s, background 0.2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.background = CREAM; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = SAND; e.currentTarget.style.background = "transparent"; }}
                    >
                      Tous les avis →
                    </a>
                  </div>
                </>
              );
            })()}

            {/* ── Comparatif prix direct vs Airbnb ── */}
            {!PRICE_HIDDEN.has(bien.id) && !BOOKING_DISABLED.has(bien.id) && (() => {
              const airbnbPrice = Math.round(bien.prix * 1.142);
              const saving      = airbnbPrice - bien.prix;
              return (
                <div style={{ background: "linear-gradient(135deg, rgba(14,59,58,0.05) 0%, rgba(14,59,58,0.02) 100%)", border: "1px solid rgba(14,59,58,0.12)", borderRadius: 12, padding: "16px 20px", margin: "28px 0 0" }}>
                  <p style={{ margin: "0 0 12px", fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: NAVY }}>💰 Réservation directe — sans commission</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ background: NAVY, borderRadius: 8, padding: "12px 16px" }}>
                      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: "rgba(250,245,233,0.5)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Ici · Directement</div>
                      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 22, color: "var(--c-ivory)", lineHeight: 1 }}>{bien.prix}€<span style={{ fontSize: 11, fontWeight: 300, marginLeft: 4, color: "rgba(250,245,233,0.6)" }}>/nuit</span></div>
                      <div style={{ marginTop: 6, display: "inline-block", background: "rgba(20,184,166,0.2)", borderRadius: 4, padding: "2px 8px", fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600, color: "#14b8a6" }}>✓ Zéro frais</div>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid var(--c-sand)", borderRadius: 8, padding: "12px 16px" }}>
                      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Sur Airbnb</div>
                      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 22, color: MUTED, lineHeight: 1, textDecoration: "line-through" }}>{airbnbPrice}€<span style={{ fontSize: 11, fontWeight: 300, marginLeft: 4 }}>/nuit</span></div>
                      <div style={{ marginTop: 6, fontFamily: "'Jost', sans-serif", fontSize: 10, color: "#ef4444" }}>+ ~14% de frais service</div>
                    </div>
                  </div>
                  <p style={{ margin: "10px 0 0", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 13, color: NAVY, textAlign: "center" }}>
                    Économisez <strong style={{ color: "#14b8a6" }}>~{saving}€/nuit</strong> en réservant directement
                  </p>
                </div>
              );
            })()}

            {/* Bottom CTA — masqué pour Amaryllis (prix + réservation déjà dans le breakout cream) */}
            {bien.id !== "amaryllis" && (
              <>
                <div style={{ height: 1, background: SAND, margin: "28px 0 28px" }} />
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
                      <a href={`/avis?bien=${bien.id}`} style={{ display: "block", color: MUTED, fontSize: 12, marginTop: 4, fontFamily: "'Jost', sans-serif", fontWeight: 300, textDecoration: "none" }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                      >★ {bien.rating} · {bien.reviews} {t("reviewsAirbnb")}</a>
                    )}
                  </div>
                  {!BOOKING_DISABLED.has(bien.id) ? (
                    <Button variant="primary" size="lg" onClick={() => onBook(bien)}>
                      {t("book")} →
                    </Button>
                  ) : (
                    <Button variant="secondary" size="lg" href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour, je suis intéressé par ${bien.nom} pour un séjour longue durée.`)}`} target="_blank" rel="noopener noreferrer">
                      Contacter →
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Right column: sticky booking widget (desktop only) ── */}
          {!isMobile && BOOKING_DISABLED.has(bien.id) && (
            <div style={{ width: 380, flexShrink: 0, position: "sticky", top: 24, alignSelf: "flex-start", paddingTop: 40, paddingBottom: 40 }}>
              <div style={{
                background: IVORY, border: `1px solid ${SAND}`, borderRadius: 16,
                boxShadow: "0 8px 40px rgba(14,40,58,0.10), 0 2px 8px rgba(14,40,58,0.06)",
                overflow: "hidden",
              }}>
                <div style={{ padding: "28px 28px 24px" }}>
                  <div style={{ display: "inline-block", background: "rgba(14,59,58,0.08)", borderRadius: 6, padding: "4px 10px", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Jost', sans-serif", color: NAVY, marginBottom: 16 }}>
                    Location longue durée
                  </div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: NAVY, lineHeight: 1.7, margin: "0 0 20px" }}>
                    Cette villa est disponible <strong>uniquement en location longue durée</strong> (mensuelle ou saisonnière étendue). Elle n'est pas proposée à la nuitée.
                  </p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: MUTED, lineHeight: 1.6, margin: "0 0 24px" }}>
                    Pour connaître les tarifs et disponibilités, contactez-nous directement — nous répondons sous 24h.
                  </p>
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par ${bien.nom} pour une location longue durée. Pouvez-vous m'indiquer vos conditions et disponibilités ? Merci.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", textAlign: "center", background: NAVY, color: "var(--c-ivory)", borderRadius: 8, padding: "13px 20px", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", marginBottom: 10 }}
                  >
                    📱 Nous contacter sur WhatsApp
                  </a>
                  <a
                    href="mailto:contact@villamaryllis.com"
                    style={{ display: "block", textAlign: "center", background: "transparent", color: NAVY, border: `1px solid ${SAND}`, borderRadius: 8, padding: "12px 20px", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}
                  >
                    ✉️ contact@villamaryllis.com
                  </a>
                </div>
              </div>
            </div>
          )}
          {!isMobile && !BOOKING_DISABLED.has(bien.id) && (
            <div id="booking-section" style={{ width: 380, flexShrink: 0, boxSizing: "border-box", position: "sticky", top: 16, alignSelf: "flex-start", paddingTop: 8, paddingBottom: 8, maxHeight: "calc(100vh - 24px)", overflowY: "auto", overflowX: "hidden" }}>
              <div style={{
                background: IVORY, border: `1px solid ${SAND}`, borderRadius: 16,
                boxShadow: "0 8px 40px rgba(14,40,58,0.10), 0 2px 8px rgba(14,40,58,0.06)",
                overflow: "hidden",
              }}>
                {/* Widget header */}
                <div style={{ padding: "12px 20px 10px" }}>
                  {!PRICE_HIDDEN.has(bien.id) && (() => {
                    const airbnbPrice = Math.round(bien.prix * 1.142);
                    const saving      = airbnbPrice - bien.prix;
                    return (
                      <>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 30, color: NAVY, lineHeight: 1 }}>{bien.prix}€</span>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: MUTED }}>/nuit</span>
                          <span style={{ marginLeft: 4, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 10, color: "#14b8a6", background: "rgba(20,184,166,0.1)", borderRadius: 4, padding: "2px 7px", letterSpacing: "0.05em" }}>DIRECT</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: MUTED, textDecoration: "line-through" }}>{airbnbPrice}€ sur Airbnb</span>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, color: "#14b8a6" }}>−{saving}€/nuit</span>
                        </div>
                      </>
                    );
                  })()}
                  {bien.rating && (
                    <div style={{ fontSize: 12, color: MUTED, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
                      <span style={{ color: GOLD }}>★ {bien.rating}</span>
                      {bien.reviews && <span style={{ marginLeft: 6 }}>· {bien.reviews} avis</span>}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: SAND }} />

                {/* Mini calendar */}
                <div style={{ padding: "8px 14px 8px" }}>
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

                    const minCheckinStr = addDays(today(), 1);
                    const handleSelect = (ds) => {
                      if (!calCheckin || (calCheckin && calCheckout)) {
                        if (ds < minCheckinStr) return; // 24h minimum
                        setCalCheckin(ds); setCalCheckout(null);
                      } else if (ds <= calCheckin) {
                        setCalCheckin(ds); setCalCheckout(null);
                      } else {
                        const n = Math.round((new Date(ds) - new Date(calCheckin)) / 86400000);
                        if (n < minNights) return;
                        let cur = addDays(calCheckin, 1);
                        let blocked = false;
                        while (cur < ds) { if (blockedDates.includes(cur)) { blocked = true; break; } cur = addDays(cur, 1); }
                        if (blocked) { setRebound({ wantCheckin: calCheckin, wantCheckout: ds, loading: true, suggestions: [] }); setReboundReq({ wantCheckin: calCheckin, wantCheckout: ds }); setCalCheckin(ds); setCalCheckout(null); }
                        else { setCalCheckout(ds); setRebound(null); setReboundReq(null); }
                      }
                      setCalHovered(null);
                    };

                    return (
                      <>
                        {/* Social proof */}
                        {socialProofMsg && !calCheckin && (
                          <div style={{ textAlign: "center", marginBottom: 8, fontSize: 11, color: CORAL, fontFamily: "'Jost', sans-serif", fontWeight: 500 }}>
                            🔥 {socialProofMsg}
                          </div>
                        )}
                        {/* Instruction */}
                        <div style={{ fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif", marginBottom: 6, textAlign: "center" }}>
                          {!calCheckin
                            ? `Choisissez vos dates${minNights > 1 ? ` (min. ${minNights} nuits)` : ""}`
                            : !calCheckout
                              ? "Date de départ ?"
                              : `${formatDateShort(calCheckin)} → ${formatDateShort(calCheckout)}`}
                        </div>
                        {/* Nav */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
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
                          minCheckin={minCheckinStr}
                        />
                        {calBelowMinLocal && (
                          <div style={{ marginTop: 8, fontSize: 11, color: "#ef4444", fontWeight: 600, textAlign: "center" }}>
                            ⚠ Séjour min. {minNights} nuits
                          </div>
                        )}
                        <ReboundSuggestions rebound={rebound} currentNom={bien.nom} onDismiss={() => setRebound(null)} />
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
                          <span>{calNights} nuit{calNights > 1 ? "s" : ""}{calNights > 0 ? ` · ${Math.round(calRawTotal / calNights)}€/nuit moy.` : ""}</span>
                          <span>{calRawTotal}€</span>
                        </div>
                        {calFrais > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, marginBottom: 6 }}>
                            <span>🧹 Ménage</span><span>{calFrais}€</span>
                          </div>
                        )}
                        {calDiscountRate > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: CORAL, fontWeight: 600, marginBottom: 6 }}>
                            <span>🎁 {discountLabel(calNights)} (−{Math.round(calDiscountRate * 100)}%)</span><span>−{calDiscountAmount}€</span>
                          </div>
                        )}
                        <div style={{ height: 1, background: SAND, margin: "10px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: NAVY, fontSize: 16 }}>
                          <span>Total</span><span>{calTotal}€</span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Reserve button */}
                <div style={{ padding: "0 24px 16px" }}>
                  <button
                    data-cta-reservation data-cta-position="calendar-main"
                    onClick={() => { trackConversion("cta_label", { position: "calendar-main" }); return calCheckin && calCheckout ? onBook(bien, calCheckin, calCheckout) : onBook(bien); }}
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
                    {calCheckin && calCheckout ? "Réserver ces dates →" : (lang === "fr" ? `${CTA_LABEL_FR} →` : "BOOK →")}
                  </button>
                  {calCheckin && calCheckout && (
                    <button
                      onClick={() => { setCalCheckin(null); setCalCheckout(null); }}
                      style={{ display: "block", margin: "10px auto 0", fontSize: 11, color: MUTED, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Effacer les dates
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Conditions & Garanties — jur-005 + jur-006 ─────────────────────── */}
        {!BOOKING_DISABLED.has(bien.id) && (
          <div style={{ borderTop: `1px solid ${SAND}`, margin: "48px 20px 48px", paddingTop: 40 }}>
            <Eyebrow color="muted" style={{ marginBottom: 20 }}>Conditions &amp; Garanties</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

              {/* Politique d'annulation */}
              <div style={{ background: IVORY, border: `1px solid ${SAND}`, borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>📋</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY, letterSpacing: "0.02em" }}>Politique d'annulation</span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: NAVY, lineHeight: 1.75 }}>
                  <li style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                    <span style={{ color: "#14b8a6", flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span><strong>Annulation gratuite</strong> jusqu'à 14 jours avant l'arrivée — remboursement intégral sous 5–10 jours ouvrés.</span>
                  </li>
                  <li style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                    <span style={{ color: CORAL, flexShrink: 0, marginTop: 1 }}>◗</span>
                    <span><strong>Entre 7 et 14 jours avant</strong> — 50 % du montant total retenu.</span>
                  </li>
                  <li style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                    <span style={{ color: CORAL, flexShrink: 0, marginTop: 1 }}>◗</span>
                    <span><strong>Moins de 7 jours</strong> ou réservation de dernière minute — acompte non remboursable.</span>
                  </li>
                  <li style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: MUTED, flexShrink: 0, marginTop: 1 }}>ℹ</span>
                    <span style={{ color: MUTED }}>Force majeure (catastrophe naturelle, cyclone) : remboursement intégral sur justificatif officiel.</span>
                  </li>
                </ul>
              </div>

              {/* Dépôt de garantie */}
              <div style={{ background: IVORY, border: `1px solid ${SAND}`, borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>🔒</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY, letterSpacing: "0.02em" }}>Dépôt de garantie</span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: NAVY, lineHeight: 1.75 }}>
                  <li style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                    <span style={{ color: "#14b8a6", flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span>La caution est demandée en <strong>pré-autorisation Stripe</strong> — votre carte est enregistrée, <em>aucun montant n'est débité</em>.</span>
                  </li>
                  <li style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                    <span style={{ color: "#14b8a6", flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span>La pré-autorisation est <strong>libérée automatiquement 3 jours</strong> après votre départ, sans intervention de votre part.</span>
                  </li>
                  <li style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                    <span style={{ color: CORAL, flexShrink: 0, marginTop: 1 }}>◗</span>
                    <span>En cas de dommages constatés à l'état des lieux, le montant correspondant peut être capturé dans un délai de 48 h après le départ.</span>
                  </li>
                  <li style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: MUTED, flexShrink: 0, marginTop: 1 }}>ℹ</span>
                    <span style={{ color: MUTED }}>Conforme au droit français (art. L 324-2 Code du tourisme) et à la réglementation Stripe / PSD2.</span>
                  </li>
                </ul>
              </div>
            </div>
            <p style={{ marginTop: 14, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: MUTED, textAlign: "center" }}>
              Questions ? <a href="mailto:contact@villamaryllis.com" style={{ color: CORAL, textDecoration: "none" }}>contact@villamaryllis.com</a>
              {" · "}
              <a href="/conditions-generales" style={{ color: CORAL, textDecoration: "none" }}>Conditions générales</a>
            </p>
          </div>
        )}
      </div>
      {showAlerte && <AlerteDispoModal bien={bien} checkin={calCheckin} checkout={calCheckout} onClose={() => setShowAlerte(false)} />}

      {/* ── FAQ chatbot flottant ── */}
      <FaqChatbot bien={bien} />

      {/* ── Maillage interne SEO (hub & spoke) ── */}
      <MaillageCluster bienId={bien.id} bienNames={BIEN_NAMES} />
    </div>
  );
}

// ── FAQ Chatbot flottant ─────────────────────────────────────────
const FAQ_CHATBOT_ITEMS = [
  { tags: ["réserver","réservation","book","comment"], q: "Comment réserver ?", a: "Choisissez vos dates dans le calendrier ci-dessus, puis cliquez « Réserver ». Paiement sécurisé par carte Stripe — sans intermédiaire ni frais de service." },
  { tags: ["arrivée","check-in","checkin","heure","clé"], q: "À quelle heure est-il possible d'arriver ?", a: "L'arrivée est fixée à 17h. Un départ tardif ou une arrivée anticipée peuvent être arrangés selon les disponibilités — contactez directement l'hôte." },
  { tags: ["départ","checkout","check-out","heure"], q: "À quelle heure faut-il quitter ?", a: "Le départ se fait avant 12h. Un late check-out est possible sur demande selon les disponibilités du jour." },
  { tags: ["wifi","internet","connexion","réseau","password"], q: "Y a-t-il le WiFi ?", a: "Oui, toutes nos propriétés disposent du WiFi Starlink haut débit (ou fibre), inclus dans le tarif. Le code vous sera transmis à votre arrivée." },
  { tags: ["animaux","chien","chat","pet","animal"], q: "Les animaux de compagnie sont-ils acceptés ?", a: "Les animaux de compagnie ne sont généralement pas acceptés dans nos propriétés. Si vous avez une situation particulière, contactez l'hôte directement pour en discuter." },
  { tags: ["parking","voiture","garage","stationnement"], q: "Y a-t-il un parking ?", a: "Oui, toutes nos villas en Martinique disposent d'un stationnement privé et sécurisé. Pour l'appartement Nogent, un parking à proximité est disponible." },
  { tags: ["remise","réduction","discount","semaine","long"], q: "Y a-t-il des remises pour les longs séjours ?", a: "Oui ! −5% pour 7 nuits ou plus, −10% pour 14 nuits, −15% pour 28 nuits. Ces remises s'appliquent automatiquement dans le calculateur." },
  { tags: ["piscine","bain","baignade","jacuzzi"], q: "Quelle propriété a une piscine ou jacuzzi ?", a: "Villa Amaryllis (piscine à débordement eau salée), Iguana (piscine eau salée non chlorée), Zandoli et Géko (chacune sa piscine privative à cascade), Mabouya (jacuzzi privatif). Consultez chaque fiche pour les équipements détaillés." },
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
          color: "var(--c-ivory)", fontSize: 22, cursor: "pointer",
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
        mpTrack("Lead", { value: 0, currency: "EUR", content_ids: [bien.id], content_type: "product" });
      } else { setErr(true); }
    } catch { setErr(true); }
    setSending(false);
  }

  const inputStyle = { border: `1px solid ${SAND}`, borderRadius: 8, padding: "10px 14px", fontFamily: "'Jost', sans-serif", fontSize: 13, color: NAVY, outline: "none", background: IVORY, width: "100%", boxSizing: "border-box", colorScheme: "dark light" };

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
                style={{ background: !canSubmit || sending ? SAND : NAVY, border: "none", color: !canSubmit || sending ? MUTED : "var(--c-ivory)", borderRadius: 8, padding: "12px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: !canSubmit || sending ? "not-allowed" : "pointer", transition: "background 0.15s" }}>
                {sending ? "Envoi…" : "M'alerter →"}
              </button>
              <p style={{ margin: "8px 0 0", fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", lineHeight: 1.5 }}>
                Votre email est utilisé uniquement pour vous alerter de la disponibilité demandée, conformément à notre{" "}
                <a href="/politique-confidentialite" style={{ color: CORAL, textDecoration: "underline" }}>politique de confidentialité</a>. Pas de newsletter sans consentement.
              </p>
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
    { label: "Photo",       render: b => <img loading="lazy" decoding="async" src={b.photos[0]} alt={b.nom} style={{ width:"100%", height:110, objectFit:"cover", borderRadius:8, display:"block" }} /> },
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
        <Editorial size="lg" style={{ color: NAVY, marginBottom: 8, lineHeight: 1.3 }}>
          Avant de partir…
        </Editorial>
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
      borderRadius: 8, padding: "10px 36px 10px 16px", color: "var(--c-ivory)",
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
  const [groupCombos, setGroupCombos] = useState([]); // combinaisons résidence dispo (groupe >8)
  const [loading, setLoading]   = useState(false);
  const [alerteTarget, setAlerteTarget] = useState(null); // { bien, checkin, checkout }
  const searchAbortRef = useRef(null);

  const todayVal = today();

  // Candidats : logements réservables (hors BOOKING_DISABLED et beds24)
  const candidates = biens.filter(b => !BOOKING_DISABLED.has(b.id));

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

    // ── Combos résidence (groupe > 8) : combinaisons Zandoli+Géko+Mabouya réellement libres ──
    let combos = [];
    if (gFilter > 8) {
      const RES = ["zandoli", "geko", "mabouya"];
      const disc = getDiscount(nights);
      const info = {};
      RES.forEach(id => {
        const b = candidates.find(c => c.id === id);
        if (!b) return;
        const blocked = availMap[id] || [];
        let avail = true, c2 = checkin;
        for (let i = 0; i < nights; i++) { if (blocked.includes(c2)) { avail = false; break; } c2 = addDays(c2, 1); }
        const map = allPrices[id] || {};
        let sum = 0; c2 = checkin;
        for (let i = 0; i < nights; i++) { sum += map[c2] ?? b.prix; c2 = addDays(c2, 1); }
        const discAmt = disc > 0 ? Math.round(sum * disc) : 0;
        const frais = FRAIS_MENAGE[id] ?? 0;
        info[id] = { bien: b, avail, total: sum - discAmt + frais, cap: b.capacite };
      });
      const ids = RES.filter(id => info[id]);
      for (let mask = 1; mask < (1 << ids.length); mask++) {
        const sub = ids.filter((_, i) => mask & (1 << i));
        if (sub.some(id => !info[id].avail)) continue;          // une villa prise → combo écarté
        const cap = sub.reduce((s, id) => s + info[id].cap, 0);
        if (cap < gFilter) continue;                            // ne couvre pas le groupe
        const total = sub.reduce((s, id) => s + info[id].total, 0);
        combos.push({ villas: sub.map(id => info[id].bien), cap, total, nights });
      }
      combos.sort((a, b) => a.villas.length - b.villas.length || a.total - b.total); // + petit combo, puis + cher
    }
    setGroupCombos(combos);

    setResults(res);
    setLoading(false);
  }

  const [open, setOpen] = useState(false);
  const canSearch = checkin && checkout && checkout > checkin;
  const availableCount = results ? results.filter(r => r.isAvailable && !r.belowMin).length : 0;
  // >8 voyageurs : aucune villa seule ne suffit (max Amaryllis = 8) → pousser l'offre groupée résidence
  const groupNeeded = parseInt(minGuests || "0", 10) > 8;

  // Fermer et réinitialiser
  function reset() { setCheckin(""); setCheckout(""); setResults(null); setGroupCombos([]); setOpen(false); }

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
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: IVORY, borderRadius: 7, padding: "8px 14px", border: `1px solid ${SAND}` }}>
                <span style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Arrivée</span>
                <input type="date" value={checkin} min={todayVal} onChange={e => { setCheckin(e.target.value); setResults(null); }}
                  style={{ background: "none", border: "none", color: NAVY, fontSize: 13, fontFamily: "'Jost', sans-serif", outline: "none", cursor: "pointer", colorScheme: "light" }} />
              </div>

              <div style={{ color: SAND, fontSize: 16, fontWeight: 300 }}>→</div>

              {/* Départ */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: IVORY, borderRadius: 7, padding: "8px 14px", border: `1px solid ${SAND}` }}>
                <span style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Départ</span>
                <input type="date" value={checkout} min={checkin || todayVal} onChange={e => { setCheckout(e.target.value); setResults(null); }}
                  style={{ background: "none", border: "none", color: NAVY, fontSize: 13, fontFamily: "'Jost', sans-serif", outline: "none", cursor: "pointer", colorScheme: "light" }} />
              </div>

              {/* Voyageurs */}
              <select value={minGuests} onChange={e => { setMinGuests(e.target.value); setResults(null); }} style={{
                background: IVORY, border: `1px solid ${SAND}`, borderRadius: 7, padding: "8px 32px 8px 14px",
                color: minGuests === "0" ? MUTED : NAVY, fontSize: 12, fontFamily: "'Jost', sans-serif", outline: "none", cursor: "pointer",
                appearance: "none", WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237a6b5a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
              }}>
                <option value="0">Voyageurs</option>
                {[1,2,3,4,5,6,7,8,9,10,11].map(n => <option key={n} value={n}>{n} voyageur{n > 1 ? "s" : ""}</option>)}
              </select>

              {/* Chambres */}
              <select value={minChambres} onChange={e => { setMinChambres(e.target.value); setResults(null); }} style={{
                background: IVORY, border: `1px solid ${SAND}`, borderRadius: 7, padding: "8px 32px 8px 14px",
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
                style={{ background: canSearch && !loading ? NAVY : SAND, border: "none", color: canSearch && !loading ? "var(--c-ivory)" : MUTED, borderRadius: 7, padding: "9px 20px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: (!canSearch || loading) ? "not-allowed" : "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 7, transition: "background 0.15s" }}>
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
                {groupNeeded ? (
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, color: NAVY, marginBottom: 4 }}>
                      Pour {minGuests} voyageurs — Résidence Amaryllis
                    </div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11.5, color: MUTED, marginBottom: 12, lineHeight: 1.5 }}>
                      Aucune villa seule n'accueille plus de 8 personnes. Voici les combinaisons de villas libres sur vos dates :
                    </div>
                    {groupCombos.length === 0 ? (
                      <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: "#ef4444", marginBottom: 10 }}>
                          Aucune combinaison entièrement libre sur ces dates.
                        </div>
                        <button
                          onClick={() => { window.location.href = "/location-groupe-sainte-luce"; }}
                          style={{ background: CORAL, border: "none", color: "#fff", borderRadius: 7, padding: "8px 16px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
                        >
                          Demander un devis groupé →
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {groupCombos.map((c, i) => (
                          <div key={i} style={{ background: "#fff", border: `1px solid rgba(14,59,58,0.12)`, borderRadius: 9, padding: "13px 16px", boxShadow: "0 1px 6px rgba(14,59,58,0.06)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: NAVY }}>
                                  {c.villas.map(v => v.nom).join(" + ")}
                                </div>
                                <div style={{ fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif", marginTop: 2 }}>
                                  jusqu'à {c.cap} pers · {c.villas.length} logement{c.villas.length > 1 ? "s" : ""} · {c.nights} nuit{c.nights > 1 ? "s" : ""}
                                </div>
                              </div>
                              <div style={{ fontSize: 19, fontWeight: 700, color: CORAL, lineHeight: 1, whiteSpace: "nowrap" }}>{c.total.toLocaleString("fr-FR")}€</div>
                            </div>
                            <a
                              href={`/location-groupe-sainte-luce?checkin=${checkin}&checkout=${checkout}&guests=${minGuests}`}
                              style={{ display: "inline-block", marginTop: 11, background: CORAL, color: "#fff", textDecoration: "none", borderRadius: 6, padding: "8px 16px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
                            >
                              Réserver cette formule →
                            </a>
                          </div>
                        ))}
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", opacity: 0.8 }}>
                          Paiement unique en ligne · calendriers vérifiés en direct
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                <>
                <div style={{ fontSize: 10, color: MUTED, fontFamily: "'Jost', sans-serif", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {availableCount === 0
                    ? <span style={{ color: "#ef4444" }}>Aucun logement disponible pour ces critères</span>
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
                </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {alerteTarget && <AlerteDispoModal bien={alerteTarget.bien} checkin={alerteTarget.checkin} checkout={alerteTarget.checkout} onClose={() => setAlerteTarget(null)} />}
    </div>
  );
}

/* ─── Configurateur multi-logements (offre groupée résidence) ─────────────── */
function GroupBookingBuilder({ biens }) {
  const RES_IDS = ["zandoli", "geko", "mabouya"];
  const ICONS = { zandoli: "🏊", geko: "🌿", mabouya: "♨️" };
  const resBiens = RES_IDS.map(id => biens.find(b => b.id === id)).filter(Boolean);
  // Pré-remplissage depuis l'URL (?checkin=&checkout=&guests=) — flux recherche → page
  const _gp = (() => { try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); } })();
  const [checkin, setCheckin]   = useState(_gp.get("checkin") || "");
  const [checkout, setCheckout] = useState(_gp.get("checkout") || "");
  const [guests, setGuests]     = useState(() => { const g = parseInt(_gp.get("guests"), 10); return (g >= 1 && g <= 11) ? g : 9; });
  const [selected, setSelected] = useState(() => new Set(RES_IDS));
  const [avail, setAvail]       = useState({});       // id -> true/false (dispo sur la plage)
  const [availLoading, setAvailLoading] = useState(false);
  const [showPay, setShowPay]   = useState(false);
  const abortRef = useRef(null);

  const nights = (checkin && checkout && checkout > checkin) ? dateDiff(checkin, checkout) : 0;
  const todayVal = today();

  useEffect(() => {
    if (!nights) { setAvail({}); return; }
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setAvailLoading(true);
    let bookingUrls = {}; try { bookingUrls = JSON.parse(localStorage.getItem("ical_urls_booking") || "{}"); } catch {}
    Promise.all(resBiens.map(async b => {
      try {
        let url = `/api/get-availability?bienId=${b.id}`;
        if (bookingUrls[b.id]) url += `&bookingUrl=${encodeURIComponent(bookingUrls[b.id])}`;
        const r = await fetch(url, { signal: ctrl.signal });
        const d = r.ok ? await r.json() : {};
        const blocked = d.blockedDates || [];
        let ok = true, cur = checkin;
        for (let i = 0; i < nights; i++) { if (blocked.includes(cur)) { ok = false; break; } cur = addDays(cur, 1); }
        return [b.id, ok];
      } catch (e) { if (e.name === "AbortError") return null; return [b.id, true]; }
    })).then(pairs => {
      if (ctrl.signal.aborted) return;
      const m = {}; pairs.filter(Boolean).forEach(([id, ok]) => { m[id] = ok; });
      setAvail(m); setAvailLoading(false);
    });
    return () => ctrl.abort();
  }, [checkin, checkout, nights]); // eslint-disable-line react-hooks/exhaustive-deps

  const allPrices = loadDailyPrices();
  function bienTotal(b) {
    if (!nights) return 0;
    const map = allPrices[b.id] || {};
    let sum = 0, cur = checkin;
    for (let i = 0; i < nights; i++) { sum += map[cur] ?? b.prix; cur = addDays(cur, 1); }
    const disc = getDiscount(nights); const discAmt = disc > 0 ? Math.round(sum * disc) : 0;
    const frais = FRAIS_MENAGE[b.id] ?? 0;
    return sum - discAmt + frais;
  }

  function toggle(id) {
    if (nights && avail[id] === false) return; // indispo → non sélectionnable
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const selectedBiens = resBiens.filter(b => selected.has(b.id) && !(nights && avail[b.id] === false));
  const totalCap   = selectedBiens.reduce((s, b) => s + b.capacite, 0);
  const totalPrice = nights ? selectedBiens.reduce((s, b) => s + bienTotal(b), 0) : 0;
  const capOk      = totalCap >= guests;
  const canQuote   = nights > 0 && selectedBiens.length > 0 && capOk;

  const mailto = `mailto:contact@villamaryllis.com?subject=${encodeURIComponent(`Réservation groupée Résidence Amaryllis — ${guests} pers`)}&body=${encodeURIComponent(`Bonjour,\n\nJe souhaite réserver la formule groupée suivante (paiement unique) :\n${selectedBiens.map(b => "• " + b.nom).join("\n")}\n\nArrivée : ${checkin ? formatDateLong(checkin) : "—"}\nDépart : ${checkout ? formatDateLong(checkout) : "—"}\nNuits : ${nights}\nVoyageurs : ${guests}\nCapacité totale : ${totalCap} personnes\nTotal estimé : ${totalPrice}€\n\nMerci de me confirmer la disponibilité et de m'envoyer le lien de paiement.`)}`;

  const inputStyle = { border: `1px solid ${SAND}`, borderRadius: 8, padding: "9px 12px", fontFamily: "'Jost', sans-serif", fontSize: 13, color: NAVY, background: "#fff", outline: "none" };

  return (
    <div style={{ background: "#fff", border: `1px solid ${SAND}`, borderRadius: 16, padding: "26px 26px 28px" }}>
      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 4 }}>
        Composez votre séjour groupé
      </div>
      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: MUTED, marginBottom: 20 }}>
        Choisissez vos dates, le nombre de voyageurs et les logements — le prix et la disponibilité se mettent à jour automatiquement.
      </div>

      {/* Dates + voyageurs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, fontFamily: "'Jost', sans-serif" }}>Arrivée</span>
          <input type="date" value={checkin} min={todayVal} onChange={e => { setCheckin(e.target.value); if (checkout && e.target.value >= checkout) setCheckout(""); }} style={inputStyle} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, fontFamily: "'Jost', sans-serif" }}>Départ</span>
          <input type="date" value={checkout} min={checkin || todayVal} onChange={e => setCheckout(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, fontFamily: "'Jost', sans-serif" }}>Voyageurs</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 39 }}>
            <button onClick={() => setGuests(g => Math.max(1, g - 1))} style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${SAND}`, background: IVORY, fontSize: 17, cursor: "pointer", color: NAVY }}>−</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, minWidth: 22, textAlign: "center" }}>{guests}</span>
            <button onClick={() => setGuests(g => Math.min(11, g + 1))} style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${SAND}`, background: IVORY, fontSize: 17, cursor: "pointer", color: NAVY }}>+</button>
          </div>
        </label>
      </div>

      {/* Sélection des logements */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
        {resBiens.map(b => {
          const unavailable = nights > 0 && avail[b.id] === false;
          const isSel = selected.has(b.id) && !unavailable;
          return (
            <div key={b.id} role="button" tabIndex={unavailable ? -1 : 0}
              onClick={() => toggle(b.id)}
              onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && !unavailable) { e.preventDefault(); toggle(b.id); } }}
              style={{ textAlign: "left", cursor: unavailable ? "not-allowed" : "pointer", background: isSel ? "rgba(14,59,58,0.04)" : "#fff", border: `2px solid ${isSel ? NAVY : SAND}`, borderRadius: 12, overflow: "hidden", opacity: unavailable ? 0.5 : 1, padding: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ position: "relative", height: 110 }}>
                <img src={`/photos/${b.id}/01.webp`} alt={b.nom} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: isSel ? NAVY : "rgba(255,255,255,0.85)", border: `1px solid ${isSel ? NAVY : SAND}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13 }}>{isSel ? "✓" : ""}</div>
                {unavailable && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#ef4444", fontFamily: "'Jost', sans-serif" }}>Indisponible</div>}
              </div>
              <div style={{ padding: "11px 14px 13px" }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13.5, color: NAVY }}>{ICONS[b.id]} {b.nom}</div>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif", marginTop: 2 }}>jusqu'à {b.capacite} pers.</div>
                <div style={{ fontSize: 13, color: CORAL, fontWeight: 700, fontFamily: "'Jost', sans-serif", marginTop: 6 }}>
                  {nights > 0 ? `${bienTotal(b).toLocaleString("fr-FR")}€ / ${nights} nuit${nights > 1 ? "s" : ""}` : `${b.prix}€ / nuit`}
                </div>
                <a href={`/${b.id}`} onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif", textDecoration: "underline", marginTop: 6, display: "inline-block" }}>Voir la fiche →</a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Récap + CTA */}
      <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: MUTED }}>
            {selectedBiens.length} logement{selectedBiens.length > 1 ? "s" : ""} · capacité {totalCap} pers.
            {availLoading && " · vérification des disponibilités…"}
          </div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700, fontSize: 22, color: NAVY, lineHeight: 1.1, marginTop: 4 }}>
            {nights > 0 ? `${totalPrice.toLocaleString("fr-FR")}€` : "—"}
            {nights > 0 && <span style={{ fontWeight: 300, fontSize: 12, color: MUTED, marginLeft: 6 }}>total · {nights} nuit{nights > 1 ? "s" : ""}</span>}
          </div>
          {!capOk && selectedBiens.length > 0 && (
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: "#ef4444", marginTop: 4 }}>
              Capacité insuffisante pour {guests} voyageurs — ajoutez un logement.
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <button
            onClick={() => { if (canQuote) setShowPay(true); }}
            disabled={!canQuote}
            style={{ background: canQuote ? CORAL : SAND, color: canQuote ? "#fff" : MUTED, border: "none", padding: "13px 26px", borderRadius: 8, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", cursor: canQuote ? "pointer" : "not-allowed" }}
          >
            Réserver et payer →
          </button>
          <a href={canQuote ? mailto : undefined} target={canQuote ? "_blank" : undefined} rel="noopener noreferrer"
            onClick={e => { if (!canQuote) e.preventDefault(); }}
            style={{ fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif", textDecoration: "underline", pointerEvents: canQuote ? "auto" : "none", opacity: canQuote ? 1 : 0.5 }}>
            ou demander un devis
          </a>
        </div>
      </div>
      <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, color: MUTED, opacity: 0.8, marginTop: 10, textAlign: "center" }}>
        Disponibilités vérifiées en direct · paiement unique sécurisé · réponse sous 2h
      </div>
      {showPay && (
        <GroupPaymentModal
          biens={selectedBiens}
          checkin={checkin}
          checkout={checkout}
          guests={guests}
          nights={nights}
          total={totalPrice}
          onClose={() => setShowPay(false)}
        />
      )}
    </div>
  );
}

/* ─── Paiement unique d'une réservation groupée (capture immédiate + alerte hôte) ─── */
function GroupPaymentModal({ biens, checkin, checkout, guests, nights, total, onClose }) {
  const [step, setStep]   = useState(1); // 1 = infos, 2 = paiement
  const [form, setForm]   = useState({ prenom: "", nom: "", email: "", tel: "" });
  const [stripe, setStripe]     = useState(null);
  const [elements, setElements] = useState(null);
  const [paying, setPaying]     = useState(false);
  const [err, setErr]           = useState("");
  const stripeAppearance = { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } };
  const formOk = form.prenom.trim() && form.nom.trim() && form.email.includes("@");
  const logementsLabel = biens.map(b => b.nom).join(" + ");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 50 && !window.Stripe; i++) await new Promise(r => setTimeout(r, 200));
      if (cancelled || !window.Stripe) return;
      let pk = STRIPE_PK;
      if (!pk) { try { const c = await fetch("/api/get-config").then(r => r.json()); pk = c.stripePk; } catch { /* */ } }
      if (cancelled || !pk) return;
      setStripe(window.Stripe(pk));
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    if (step === 2 && elements) { const pe = elements.getElement("payment"); if (pe) pe.mount("#grp-pe"); }
  }, [step, elements]);

  async function goToPayment() {
    setPaying(true); setErr("");
    try {
      // Re-check dispo de TOUS les logements sélectionnés juste avant paiement (anti double-résa)
      let bookingUrls = {}; try { bookingUrls = JSON.parse(localStorage.getItem("ical_urls_booking") || "{}"); } catch {}
      const checks = await Promise.all(biens.map(async b => {
        try {
          let url = `/api/get-availability?bienId=${b.id}`;
          if (bookingUrls[b.id]) url += `&bookingUrl=${encodeURIComponent(bookingUrls[b.id])}`;
          const r = await fetch(url); const d = r.ok ? await r.json() : {};
          const blocked = d.blockedDates || [];
          let ok = true, cur = checkin;
          for (let i = 0; i < nights; i++) { if (blocked.includes(cur)) { ok = false; break; } cur = addDays(cur, 1); }
          return ok;
        } catch { return true; }
      }));
      if (checks.some(ok => !ok)) { setErr("Un des logements vient d'être réservé sur ces dates. Revenez en arrière pour ajuster votre sélection."); setPaying(false); return; }

      const res = await fetch("/api/create-payment-intent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total * 100, currency: "eur", metadata: { type: "group", bienId: "groupe", bienIds: biens.map(b => b.id).join(","), logements: logementsLabel, checkin, checkout, guests: String(guests), voyageur: `${form.prenom} ${form.nom}`.trim(), email: form.email, prenom: form.prenom?.trim() || "", nom: form.nom?.trim() || "", phone: form.tel?.trim() || "", ...getAttributionMetadata() } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const el = stripe.elements({ clientSecret: data.clientSecret, appearance: stripeAppearance });
      el.create("payment"); setElements(el); setStep(2);
    } catch (e) { setErr(e.message); }
    setPaying(false);
  }

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true); setErr("");
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements, confirmParams: { return_url: window.location.origin + "/merci" }, redirect: "if_required",
    });
    if (error) { setErr(error.message); setPaying(false); return; }
    if (paymentIntent?.status === "succeeded") {
      // Alerte hôte immédiate (en plus du webhook) — bloquer les calendriers
      fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: `${form.prenom} ${form.nom}`.trim(), email: form.email, tel: form.tel, bien: `GROUPE : ${logementsLabel}`, source: "reservation-groupe",
          message: `🚨 RÉSA GROUPÉE PAYÉE (${paymentIntent.id}) — BLOQUER les calendriers Airbnb/Booking de : ${biens.map(b => b.nom).join(", ")}\nDates : ${checkin} → ${checkout} (${nights} nuits)\nVoyageurs : ${guests}\nTotal payé : ${total}€` }),
      }).catch(() => {});
      // Failsafe : si le beacon inline ci-dessous meurt au unload, Merci.jsx refire avec le même eventID.
      try {
        ssSet("pending_purchase", JSON.stringify({
          pi: paymentIntent.id, value: total,
          items: (biens || []).map(b => ({ item_id: b.id, item_name: b.nom, price: b.prix, quantity: nights || 1 })),
        }));
      } catch { /* */ }
      if (window.gtag) {
        const guardKey = `ga_purchase_fired_${paymentIntent.id}`;
        if (!ssGet(guardKey)) {
          ssSet(guardKey, "1");
          try { window.gtag("event", "purchase", { transaction_id: paymentIntent.id, currency: "EUR", value: total, bien_id: biens?.[0]?.id, niveau_tarifaire: niveauTarifaire(biens?.[0], checkin), items: (biens || []).map(b => ({ item_id: b.id, item_name: b.nom, price: b.prix, quantity: nights || 1 })) }); } catch { /* */ }
          mpTrack("Purchase", { value: total, currency: "EUR", eventID: paymentIntent.id, content_ids: (biens || []).map(b => b.id), content_type: "product" });
        }
      }
      window.location.href = "/merci";
      return;
    }
    setPaying(false);
  }

  const lbl = { fontSize: 11, color: MUTED, fontFamily: "'Jost', sans-serif", marginBottom: 4, display: "block" };
  const inp = { width: "100%", border: `1px solid ${SAND}`, borderRadius: 8, padding: "10px 12px", fontFamily: "'Jost', sans-serif", fontSize: 14, color: NAVY, boxSizing: "border-box" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7,18,42,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: IVORY, borderRadius: 16, maxWidth: 460, width: "100%", maxHeight: "92vh", overflowY: "auto", padding: "26px 26px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, color: NAVY }}>Réservation groupée</div>
            <div style={{ fontSize: 12, color: MUTED, fontFamily: "'Jost', sans-serif", marginTop: 2 }}>{logementsLabel}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: MUTED, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Récap */}
        <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontFamily: "'Jost', sans-serif", fontSize: 13, color: NAVY }}>
          <div>{formatDateLong(checkin)} → {formatDateLong(checkout)} · {nights} nuit{nights > 1 ? "s" : ""}</div>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{guests} voyageurs · {biens.length} logement{biens.length > 1 ? "s" : ""}</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: CORAL, marginTop: 6 }}>{total.toLocaleString("fr-FR")}€ <span style={{ fontWeight: 300, fontSize: 12, color: MUTED }}>total</span></div>
        </div>

        {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "10px 12px", fontSize: 12, fontFamily: "'Jost', sans-serif", marginBottom: 14 }}>{err}</div>}

        {step === 1 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><span style={lbl}>Prénom</span><input style={inp} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} /></div>
              <div><span style={lbl}>Nom</span><input style={inp} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><span style={lbl}>Email</span><input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div style={{ marginBottom: 18 }}><span style={lbl}>Téléphone (optionnel)</span><input type="tel" style={inp} value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} /></div>
            <button onClick={goToPayment} disabled={!formOk || !stripe || paying}
              style={{ width: "100%", background: (formOk && stripe && !paying) ? CORAL : SAND, color: (formOk && stripe && !paying) ? "#fff" : MUTED, border: "none", borderRadius: 8, padding: "13px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", cursor: (formOk && stripe && !paying) ? "pointer" : "not-allowed" }}>
              {paying ? "Vérification…" : "Continuer vers le paiement →"}
            </button>
          </>
        ) : (
          <>
            <div id="grp-pe" style={{ marginBottom: 16 }} />
            <button onClick={handlePay} disabled={paying}
              style={{ width: "100%", background: paying ? SAND : CORAL, color: paying ? MUTED : "#fff", border: "none", borderRadius: 8, padding: "13px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", cursor: paying ? "not-allowed" : "pointer" }}>
              {paying ? "Paiement…" : `Payer ${total.toLocaleString("fr-FR")}€`}
            </button>
            <div style={{ fontSize: 10, color: MUTED, textAlign: "center", marginTop: 10, fontFamily: "'Jost', sans-serif" }}>Paiement sécurisé Stripe · un seul règlement pour tous les logements</div>
          </>
        )}
      </div>
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
  const { lang } = useLang();
  // Biens réservables en direct (hors location longue durée)
  const reservables = biens.filter(b => !BOOKING_DISABLED.has(b.id));

  return (
    <div style={{ background: NAVY, padding: "80px 28px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* En-tête émotionnel */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 10,
            letterSpacing: "0.38em", textTransform: "uppercase",
            color: "rgba(250,247,242,0.4)", margin: "0 0 18px",
          }}>
            {lang === "fr" ? "Réservation directe" : "Book direct"}
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 400, fontSize: "clamp(28px, 4vw, 44px)",
            color: IVORY, margin: "0 0 14px", lineHeight: 1.12,
          }}>
            {lang === "fr" ? "Choisissez votre villa" : "Choose your villa"}
          </h2>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13,
            color: "rgba(250,247,242,0.48)", margin: 0, letterSpacing: "0.02em",
          }}>
            {lang === "fr"
              ? "Sans frais de service — économisez jusqu'à 15 % vs Airbnb."
              : "No service fees — save up to 15% vs Airbnb."}
          </p>
        </div>

        {/* Grille de cards compactes */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}>
          {reservables.map(b => {
            const photo = b.photos?.[0] || "";
            const minP = (() => {
              try {
                const map = loadDailyPrices()[b.id] || {};
                const now = new Date(); let min = Infinity;
                for (let i = 0; i < 90; i++) {
                  const d = new Date(now); d.setDate(now.getDate() + i);
                  const p = map[d.toISOString().slice(0, 10)];
                  if (p !== undefined && p < min) min = p;
                }
                return min === Infinity ? b.prix : min;
              } catch { return b.prix; }
            })();

            return (
              <button
                key={b.id}
                onClick={() => onBook(b)}
                style={{
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 12, overflow: "hidden",
                  cursor: "pointer", textAlign: "left", padding: 0,
                  transition: "border-color 0.22s, transform 0.22s, background 0.22s",
                  display: "flex", flexDirection: "column",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = CORAL;
                  e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.055)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Photo */}
                <div style={{ position: "relative", paddingBottom: "62%", overflow: "hidden", background: "#07201f", flexShrink: 0 }}>
                  {photo && (
                    <img
                      src={photo}
                      alt={b.nom}
                      loading="lazy"
                      decoding="async"
                      onLoad={e => { e.currentTarget.style.opacity = "1"; }}
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%", objectFit: "cover",
                        opacity: 0, transition: "opacity 0.45s",
                      }}
                    />
                  )}
                  {/* Direct badge */}
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    background: "rgba(22,163,74,0.9)", backdropFilter: "blur(4px)",
                    color: "#fff", fontSize: 9, fontWeight: 700,
                    padding: "3px 8px", borderRadius: 20,
                    fontFamily: "'Jost', sans-serif", letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}>✓ −15%</div>
                </div>

                {/* Infos */}
                <div style={{ padding: "14px 15px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{
                    fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13.5,
                    color: IVORY, lineHeight: 1.25,
                  }}>{b.nom}</div>
                  <div style={{
                    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11,
                    color: "rgba(250,247,242,0.42)", letterSpacing: "0.02em",
                  }}>{b.lieu}</div>

                  {/* Prix + CTA */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 10 }}>
                    <span style={{
                      fontFamily: "'Jost', sans-serif", fontWeight: 700, fontSize: 15, color: IVORY,
                    }}>
                      {minP}€
                      <span style={{ fontWeight: 300, fontSize: 10, color: "rgba(250,247,242,0.38)", marginLeft: 2 }}>/nuit</span>
                    </span>
                    <span style={{
                      fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 10,
                      color: CORAL, letterSpacing: "0.07em", textTransform: "uppercase",
                    }}>Voir →</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}

// ── Bien Picker Modal ────────────────────────────────────────────
// S'ouvre depuis le hero quand aucun bien n'est encore sélectionné.
// Affiche la liste des propriétés réservables ; cliquer charge le booking.
function BienPickerModal({ biens, onSelect, onClose }) {
  const { t } = useLang();
  const reservables = biens.filter(b => !BOOKING_DISABLED.has(b.id));
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(14,59,58,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--c-ivory)", borderRadius: 16,
          padding: "32px 28px 28px",
          width: "100%", maxWidth: 520,
          maxHeight: "85vh", overflowY: "auto",
          boxShadow: "0 24px 64px rgba(14,59,58,0.22)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <Eyebrow style={{ marginBottom: 8 }}>Réservation directe</Eyebrow>
            <Display size="md">Choisissez votre logement</Display>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", fontSize: 22, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>

        {/* Liste des biens */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reservables.map(b => (
            <button
              key={b.id}
              onClick={() => onSelect(b)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: IVORY, border: "1px solid var(--c-sand)",
                borderRadius: 12, padding: "12px 14px",
                cursor: "pointer", textAlign: "left", width: "100%",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-coral)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(196,114,84,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-sand)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Photo */}
              <img
                src={b.photos?.[0]}
                alt={b.nom}
                width={56} height={56}
                style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--c-navy)", marginBottom: 2 }}>
                  {b.emoji} {b.nom}
                </div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: "var(--c-muted)", marginBottom: 4 }}>
                  {b.lieu}
                </div>
                {b.rating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "var(--c-gold)", fontSize: 11 }}>★</span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--c-navy)" }}>{b.rating}</span>
                    {b.reviews && <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: "var(--c-muted)" }}>· {b.reviews} avis</span>}
                  </div>
                )}
              </div>
              {/* Prix */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 22, color: "var(--c-navy)", lineHeight: 1 }}>{b.prix}€</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, color: "var(--c-muted)" }}>/nuit</div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18, textAlign: "center", fontFamily: "'Jost', sans-serif", fontSize: 11, color: "var(--c-muted)" }}>
          🔒 Paiement sécurisé par Stripe · Sans frais de service
        </div>
      </div>
    </div>
  );
}

// ── Hero Brand ───────────────────────────────────────────────────
function HeroBrand({ biens, onBook }) {
  const { lang } = useLang();
  // growth-003 — A/B hero Amaryllis : A = piscine (actuel), B = salon (07.webp)
  const heroVariant = getVariant("hero_amaryllis");
  const piscinePhoto = biens.find(b => b.id === "amaryllis")?.photos?.[1]
    || biens[0]?.photos?.[0]
    || "";
  const heroPhoto = heroVariant === "B" ? "/photos/amaryllis/07.webp" : piscinePhoto;

  // Mesure d'engagement : conversion = scroll au-delà de 50% (une seule fois)
  const scrollFired = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (scrollFired.current) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= 0.5) {
        scrollFired.current = true;
        trackConversion("hero_amaryllis", { depth: "50pct" });
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      position: "relative",
      height: "clamp(480px, 72vh, 640px)",
      background: `#0e2020 url('${heroPhoto}') center/cover no-repeat`,
      overflow: "hidden",
    }}>
      {/* gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,59,58,0.18) 0%, rgba(14,59,58,0.72) 100%)", pointerEvents: "none" }} />

      {/* top-left chips */}
      <div style={{ position: "absolute", top: 28, left: 32, display: "flex", gap: 10, zIndex: 2 }}>
        <Chip variant="onPhoto">⭐ Coup de cœur Airbnb</Chip>
        <Chip variant="onPhoto">★ 4,94 · 200+ avis</Chip>
      </div>

      {/* bottom content */}
      <div style={{ position: "absolute", bottom: 52, left: 32, right: 32, zIndex: 2 }}>
        <Eyebrow style={{ color: "rgba(250,245,233,0.7)", marginBottom: 16, letterSpacing: "0.55em" }}>
          {lang === "fr" ? "Locations d'exception" : "Premium Holiday Rentals"}
        </Eyebrow>
        <Display size="xl" color="var(--c-ivory)" style={{ marginBottom: 16 }}>
          {lang === "fr" ? "Amaryllis" : "Amaryllis"}
        </Display>
        <Editorial style={{ color: "rgba(250,245,233,0.78)", maxWidth: 560, fontSize: 18, lineHeight: 1.65 }}>
          {lang === "fr"
            ? "Sept locations de prestige en Martinique et en Île-de-France. Réservation directe, sans frais de service."
            : "Seven premium rentals in Martinique and Île-de-France. Book directly, no service fees."}
        </Editorial>
        <div style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => { const el = document.getElementById("properties"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}
          >
            {lang === "fr" ? "Découvrir nos villas" : "Explore villas"}
          </Button>
          <Button variant="onDark" size="lg" onClick={onBook}>
            {lang === "fr" ? "Réserver" : "Book now"}
          </Button>
        </div>
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
        <Eyebrow tracking="0.55em" style={{ marginBottom: 12 }}>{bien.lieu}</Eyebrow>
        <h1
          onClick={() => onDetail(bien)}
          style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 200,
            fontSize: "clamp(34px, 5vw, 64px)", letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--c-ivory)",
            margin: "0 0 10px", lineHeight: 1.05,
            cursor: "pointer", transition: "opacity 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {bien.nom}
        </h1>
        {bien.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: "rgba(250,245,233,0.55)", marginBottom: 14 }}>
            <span style={{ color: GOLD }}>★ {bien.rating}</span>
            {bien.reviews ? <><span style={{ opacity: 0.4 }}>·</span><span>{bien.reviews} {t("reviewsLabel")}</span></> : null}
            <span style={{ opacity: 0.4 }}>·</span>
            <Icon name="users" size={12} color="rgba(250,245,233,0.55)" /><span>{bien.capacite}</span>
          </div>
        )}
        <Editorial size="sm" style={{
          color: "rgba(250,245,233,0.65)", lineHeight: 1.65,
          margin: "0 0 22px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {lang === "fr" ? bien.desc : (bien.descEn || bien.desc)}
        </Editorial>
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
                style={{ display: "inline-block", background: "rgba(250,245,233,0.08)", border: "1px solid rgba(250,245,233,0.3)", borderRadius: 8, padding: "14px 24px", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, letterSpacing: "0.12em", color: "var(--c-ivory)", textTransform: "uppercase", whiteSpace: "nowrap", textDecoration: "none", transition: "background 0.2s" }}
              >
                {t("contactLongStay")}
              </a>
            )}
            {/* Secondary CTA */}
            <button
              onClick={() => onDetail(bien)}
              style={{
                background: "transparent", border: "1px solid rgba(250,245,233,0.35)", color: "var(--c-ivory)",
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
            style={{ background: "rgba(250,245,233,0.08)", border: "1px solid rgba(250,245,233,0.18)", color: "var(--c-ivory)", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", transition: "background 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(250,245,233,0.16)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(250,245,233,0.08)"; }}
          >‹</button>
          <button
            aria-label="Photo suivante"
            onClick={() => goTo((idx + 1) % biens.length)}
            style={{ background: "rgba(250,245,233,0.08)", border: "1px solid rgba(250,245,233,0.18)", color: "var(--c-ivory)", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", transition: "background 0.2s" }}
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
    a: "Directement sur ce site : sélectionnez votre villa, choisissez vos dates et payez par carte (Stripe sécurisé). Vous économisez les frais de service Airbnb — jusqu'à 15% du prix — et vous avez un contact direct avec l'hôte.",
  },
  {
    q: "Quel est le prix d'une villa avec piscine à Sainte-Luce Martinique ?",
    a: "Nos villas avec piscine sont à partir de 110€/nuit (Géko) jusqu'à 280€/nuit pour la Villa Amaryllis avec piscine à débordement vue mer. Des réductions semaine sont disponibles (-5% à partir de 7 nuits).",
  },
  {
    q: "Peut-on louer une villa avec jacuzzi privatif en Martinique ?",
    a: "Oui ! Le studio Mabouya est entièrement dédié au romantisme avec jacuzzi privatif en terrasse et vue mer à partir de 70€/nuit. C'est le seul logement de la résidence à proposer un jacuzzi privé.",
  },
  {
    q: "Y a-t-il des logements disponibles en Île-de-France ?",
    a: "Oui, notre Appartement aux Portes de Paris à Nogent-sur-Marne (94) offre un cadre calme à 15 min du centre de Paris, idéal pour les séjours professionnels ou le tourisme parisien à partir de 90€/nuit.",
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
  { nom: "Élise & Romain", pays: "🇫🇷", note: 5, texte: "Weekend romantique parfait ! Le jacuzzi privatif sous les étoiles avec vue mer est juste magique. Jardin fleuri superbe, endroit très paisible.", villa: "Mabouya",  villaId: "mabouya",   date: "Avr. 2025" },
  { nom: "Lucie B.",       pays: "🇫🇷", note: 5, texte: "Cocon parfait ! La mezzanine est charmante, la piscine délicieuse, et la vue sur la mer au réveil est inoubliable. Hôte très disponible.", villa: "Zandoli",          villaId: "zandoli",   date: "Avr. 2025" },
];

function TestimonialsSection({ onDetail }) {
  const { lang } = useLang();
  return (
    <div style={{ background: IVORY, padding: "80px 28px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Eyebrow style={{ marginBottom: 12 }}>
            {lang === "fr" ? "Ils en parlent" : "What guests say"}
          </Eyebrow>
          <Display size="md" style={{ margin: "0 0 14px" }}>
            {lang === "fr" ? "200 voyageurs, une moyenne de 4,94 ★" : "200 guests, averaging 4.94 ★"}
          </Display>
          <Editorial size="sm" style={{ color: MUTED, maxWidth: 480, margin: "0 auto" }}>
            {lang === "fr"
              ? "Tous les avis proviennent de voyageurs vérifiés via Airbnb & Booking.com."
              : "All reviews from verified guests via Airbnb & Booking.com."}
          </Editorial>
        </div>

        {/* Cards grid — white cards on cream, matching Claude Design ReviewBlock */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {CURATED_TESTIMONIALS.map((r, i) => (
            <Reveal key={r.nom} delay={i * 0.08}>
              <div
                style={{
                  background: CREAM,
                  border: `1px solid ${SAND}`,
                  borderRadius: 14,
                  padding: "22px 22px 20px",
                  display: "flex", flexDirection: "column", gap: 12,
                  cursor: onDetail ? "pointer" : "default",
                  transition: "box-shadow 0.25s, transform 0.25s",
                  height: "100%",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(14,59,58,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                onClick={() => onDetail && onDetail({ id: r.villaId })}
              >
                {/* Author row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: NAVY, color: IVORY,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, flexShrink: 0,
                  }}>{r.nom.charAt(0)}</div>
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: NAVY }}>
                      {r.pays} {r.nom}
                    </div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: MUTED, marginTop: 1 }}>
                      <span style={{ color: GOLD }}>{"★".repeat(r.note)}</span> · {r.date}
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <Editorial size="sm" style={{ fontSize: 15, lineHeight: 1.7, flex: 1 }}>
                  &ldquo;{r.texte}&rdquo;
                </Editorial>

                {/* Villa tag */}
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 11, color: CORAL, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 4 }}>
                  {r.villa}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA vers la page avis complète */}
        <div style={{ textAlign: "center", marginTop: 44 }}>
          <a
            href="/avis"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 28px",
              border: `1.5px solid ${NAVY}`,
              borderRadius: 40,
              fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13,
              color: NAVY, textDecoration: "none",
              letterSpacing: "0.06em", textTransform: "uppercase",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = NAVY; e.currentTarget.style.color = IVORY; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = NAVY; }}
          >
            Lire tous les avis voyageurs →
          </a>
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= rating ? "#f5a623" : SAND, lineHeight: 1 }}>★</span>
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
          <Eyebrow style={{ marginBottom: 10 }}>
            Avis Google · Villa Amaryllis{isLive && <span style={{ marginLeft: 8, background: "#e8f5e9", color: "#2e7d32", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20 }}>● Live</span>}
          </Eyebrow>
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
                  ? <img loading="lazy" decoding="async" src={r.avatar} alt={r.author} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} onError={e => e.currentTarget.style.display = "none"} />
                  : <div style={{ width: 40, height: 40, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "var(--c-ivory)", fontSize: 16, fontWeight: 600 }}>{r.author?.[0] ?? "?"}</span>
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
    <section id="faq" style={{ background: CREAM, padding: "72px 24px", scrollMarginTop: "80px" }}>
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
        <Eyebrow style={{ textAlign: "center", marginBottom: 12 }}>Questions fréquentes</Eyebrow>
        <Display size="md" style={{ textAlign: "center", margin: "0 0 12px" }}>
          Location villa Martinique
        </Display>
        <Editorial style={{ textAlign: "center", marginBottom: 40, opacity: 0.75 }}>
          Tout ce que vous devez savoir avant de réserver.
        </Editorial>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {FAQ_ITEMS.map((faq, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${SAND}` }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}
              >
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: NAVY, letterSpacing: "0.02em", lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ color: CORAL, fontSize: 18, flexShrink: 0, transform: open === i ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.3s ease" }}>+</span>
              </button>
              {open === i && (
                <div style={{ paddingBottom: 22 }}>
                  <Editorial size="md">{faq.a}</Editorial>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Liens bas de section */}
        <div style={{ textAlign: "center", marginTop: 40, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <a href="/faq" style={{ display: "inline-block", background: NAVY, color: "var(--c-ivory)", padding: "12px 28px", borderRadius: 6, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>
            Toutes les questions →
          </a>
          <a href="/guide-hub" style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: NAVY, textDecoration: "none", borderBottom: `1px solid ${CORAL}`, paddingBottom: 2 }}>
            Lire notre guide complet Sainte-Luce →
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Contact Section ──────────────────────────────────────────────
const EMAIL = "contact@villamaryllis.com";

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
        mpTrack("Lead", { value: 0, currency: "EUR" });
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

          <Eyebrow style={{ marginBottom: 10 }}>Contact</Eyebrow>
          <Display size="lg" color="var(--c-ivory)" style={{ margin: "0 0 14px" }}>
            Parlons de<br />votre séjour
          </Display>
          <Editorial style={{ color: "rgba(250,245,233,0.5)", margin: "0 0 32px", maxWidth: 300 }}>
            Réservation, disponibilités, questions — nous répondons dans les 24h.
          </Editorial>

          <a href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            onClick={() => { if (window.gtag) window.gtag("event", "generate_lead", { method: "whatsapp" }); mpTrack("Lead", { value: 0, currency: "EUR" }); }}
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

          {/* ── Réseaux sociaux ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <a
              href="https://www.instagram.com/amaryllislocations/"
              target="_blank" rel="noopener noreferrer"
              title="Instagram — @amaryllislocations"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(250,245,233,0.15)", background: "rgba(250,245,233,0.06)", color: "rgba(250,245,233,0.55)", transition: "all 0.2s", textDecoration: "none" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.4)"; e.currentTarget.style.color = "rgba(250,245,233,0.9)"; e.currentTarget.style.background = "rgba(250,245,233,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.15)"; e.currentTarget.style.color = "rgba(250,245,233,0.55)"; e.currentTarget.style.background = "rgba(250,245,233,0.06)"; }}
            >
              {/* Instagram SVG */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
            </a>
            <a
              href="https://www.facebook.com/Amaryllis.villa"
              target="_blank" rel="noopener noreferrer"
              title="Facebook — Amaryllis Locations"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(250,245,233,0.15)", background: "rgba(250,245,233,0.06)", color: "rgba(250,245,233,0.55)", transition: "all 0.2s", textDecoration: "none" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.4)"; e.currentTarget.style.color = "rgba(250,245,233,0.9)"; e.currentTarget.style.background = "rgba(250,245,233,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.15)"; e.currentTarget.style.color = "rgba(250,245,233,0.55)"; e.currentTarget.style.background = "rgba(250,245,233,0.06)"; }}
            >
              {/* Facebook SVG */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@AmaryllisLocations"
              target="_blank" rel="noopener noreferrer"
              title="YouTube — Amaryllis Locations"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(250,245,233,0.15)", background: "rgba(250,245,233,0.06)", color: "rgba(250,245,233,0.55)", transition: "all 0.2s", textDecoration: "none" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.4)"; e.currentTarget.style.color = "rgba(250,245,233,0.9)"; e.currentTarget.style.background = "rgba(250,245,233,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.15)"; e.currentTarget.style.color = "rgba(250,245,233,0.55)"; e.currentTarget.style.background = "rgba(250,245,233,0.06)"; }}
            >
              {/* YouTube SVG */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="rgba(6,16,15,0.9)"/>
              </svg>
            </a>
            <span style={{ fontSize: 10, color: "rgba(250,245,233,0.25)", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em" }}>
              @amaryllislocations
            </span>
          </div>

        </div>

        {/* Right: form */}
        <div style={{ flex: "1 1 360px", maxWidth: 500 }}>
          {sent ? (
            <div style={{ background: "rgba(250,245,233,0.04)", border: "1px solid rgba(250,245,233,0.1)", borderRadius: 16, padding: "48px 36px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--c-ivory)", marginBottom: 10 }}>Message envoyé</div>
              <Editorial style={{ color: "rgba(250,245,233,0.5)", margin: "0 0 24px" }}>
                Nous vous répondrons dans les 24h.
              </Editorial>
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
              <p style={{ margin: "10px 0 0", fontSize: 10, color: "rgba(250,245,233,0.35)", fontFamily: "'Jost', sans-serif", lineHeight: 1.5 }}>
                En soumettant ce formulaire, vous acceptez que vos données (nom, email, message) soient traitées par Amaryllis Locations pour répondre à votre demande, conformément à notre{" "}
                <a href="/politique-confidentialite" style={{ color: "rgba(250,245,233,0.5)", textDecoration: "underline" }}>politique de confidentialité</a>.
                Elles ne seront pas cédées à des tiers. Droit d'accès et de suppression : contact@villamaryllis.com
              </p>
            </form>
          )}
        </div>
      </div>

      {/* ── Maillage SEO : liens vers landing commerciales + guides (dé-orpheline) ── */}
      <nav aria-label="Plan du site" style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 8px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32, borderBottom: "1px solid rgba(250,245,233,0.08)" }}>
        {[
          { titre: "Locations en Martinique", liens: [
            ["Location villa Sainte-Luce", "/sainte-luce-martinique"],
            ["Villa avec piscine", "/location-villa-martinique-piscine"],
            ["Appartement vue mer Schœlcher", "/location-appartement-vue-mer-schoelcher"],
            ["Location pour groupe", "/location-groupe-sainte-luce"],
            ["Réservation directe sans frais", "/reservation-directe-martinique"],
            ["Séminaires & événements", "/seminaires"],
          ]},
          { titre: "Guides & destinations", liens: [
            ["Le Diamant", "/guide-le-diamant"],
            ["Sainte-Anne & les Salines", "/guide-sainte-anne"],
            ["Activités à Sainte-Luce", "/activites-sainte-luce"],
            ["Plus belles plages du Sud", "/plus-belles-plages-sud-martinique"],
            ["Meilleure saison", "/meilleure-saison-martinique"],
            ["Location voiture pas cher", "/location-voiture-martinique-pas-cher"],
            ["Tout explorer", "/guide-hub"],
          ]},
          { titre: "Nos villas & studios", liens: [
            ["Villa Amaryllis (8 pers.)", "/amaryllis"],
            ["Zandoli (5 pers.)", "/zandoli"],
            ["Villa Iguana (6 pers.)", "/iguana"],
            ["Géko (4 pers.)", "/geko"],
            ["Mabouya (2 pers.)", "/mabouya"],
            ["Tous nos avis", "/avis"],
          ]},
        ].map(col => (
          <div key={col.titre}>
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250,245,233,0.35)", marginBottom: 14 }}>{col.titre}</div>
            {col.liens.map(([label, href]) => (
              <a key={href} href={href} style={{ display: "block", fontFamily: "'Jost', sans-serif", fontSize: 13, color: "rgba(250,245,233,0.6)", textDecoration: "none", padding: "5px 0", transition: "color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "rgba(250,245,233,0.95)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(250,245,233,0.6)"; }}>{label}</a>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Partenaire voiture ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: "1px solid rgba(250,245,233,0.08)" }}>
        <span style={{ fontSize: 11, color: "rgba(250,245,233,0.35)", fontFamily: "'Jost', sans-serif", letterSpacing: "0.06em" }}>🚗 Location de voiture en Martinique :</span>
        <LienAffilie partenaire="discoverCars" utmContent="footer-homepage" showDisclosure={false} style={{ display: "inline" }}>
          Comparer sur DiscoverCars →
        </LienAffilie>
        <span style={{ fontSize: 10, color: "rgba(250,245,233,0.2)", fontFamily: "'Jost', sans-serif" }}>· lien partenaire</span>
      </div>

      {/* ── Bottom bar ── */}
      <FooterBottomBar />
    </footer>
  );
}

function FooterBottomBar() {
  return (
    <div style={{ background: "#072626", borderTop: "1px solid rgba(250,245,233,0.06)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="16" height="16" viewBox="0 0 92 92">
            <g transform="translate(46 46)" fill="none">
              {[0, 60, 120, 180, 240, 300].map((rot, i) => (
                <g key={i} transform={`rotate(${rot})`}><path d="M 0 0 L 0 -38 L 8 -20 Z" fill="var(--c-cream)" /></g>
              ))}
              <circle r="2.5" fill={GOLD} />
            </g>
          </svg>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "rgba(250,245,233,0.28)", letterSpacing: "0.05em" }}>
            © Amaryllis 2026 — Tous droits réservés
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "rgba(250,245,233,0.35)", fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>🔒 Réservation directe propriétaire · Paiement sécurisé Stripe</span>
          {[["CGV", "/conditions-generales"], ["Mentions légales", "/mentions-legales"], ["Confidentialité", "/politique-confidentialite"]].map(([label, href]) => (
            <a key={href} href={href} style={{ fontSize: 11, color: "rgba(250,245,233,0.28)", fontFamily: "'Jost', sans-serif", fontWeight: 300, textDecoration: "none", letterSpacing: "0.05em", transition: "color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(250,245,233,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(250,245,233,0.28)"; }}
            >{label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactField({ label, value, onChange, type = "text", multiline, required, style, dark, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const s = dark ? {
    background: "rgba(250,245,233,0.06)",
    border: `1px solid ${focused ? "rgba(196,114,84,0.5)" : "rgba(250,245,233,0.12)"}`,
    borderRadius: 8, color: "var(--c-ivory)", padding: "11px 14px", width: "100%",
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
    { label: "🗺️  Guide Martinique",   href: "/guide-hub" },
    { label: "📍  Carte interactive",  href: "/explorer" },
    { label: "❓  FAQ",                href: "/faq" },
    { label: "💬  Contactez-nous",     href: "/#contact" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <img
          src="/brand/amaryllis-mark-cream.svg"
          alt="Amaryllis"
          width="36"
          height="36"
          style={{ display: "block" }}
        />
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 15, letterSpacing: "0.55em", color: "var(--c-ivory)", textTransform: "uppercase" }}>AMARYLLIS</div>
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
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(196,114,84,0.12)"; e.currentTarget.style.color = "var(--c-ivory)"; }}
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
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(196,114,84,0.5)"; e.currentTarget.style.color = "var(--c-ivory)"; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = "rgba(250,245,233,0.18)"; e.currentTarget.style.color = "rgba(250,245,233,0.75)"; } }}
      >
        Nos propriétés
        <span style={{ fontSize: 9, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", left: 0,
          background: "var(--c-navy)",
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
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(196,114,84,0.12)"; e.currentTarget.style.color = "var(--c-ivory)"; }}
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
          color: "rgba(250,245,233,0.85)", cursor: "pointer",
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
            style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--c-ivory)", textDecoration: "none", padding: "7px 0", borderBottom: "1px solid rgba(250,245,233,0.08)", fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, letterSpacing: "0.05em" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <a
            href={`mailto:${EMAIL}`}
            style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--c-ivory)", textDecoration: "none", padding: "7px 0 0", fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, letterSpacing: "0.05em" }}
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
// Signature manuscrite « maison » (canvas) — cpw-101
function SignaturePad({ onChange }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0e3b3a";
    const pos = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height)]; };
    const start = (e) => { drawing.current = true; const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
    const move = (e) => { if (!drawing.current) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); e.preventDefault(); };
    const end = () => { if (drawing.current) { drawing.current = false; onChange(c.toDataURL("image/png")); } };
    c.addEventListener("pointerdown", start); c.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    return () => { c.removeEventListener("pointerdown", start); c.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); };
  }, [onChange]);
  const clear = () => { const c = ref.current; if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height); onChange(""); };
  return (
    <div>
      <canvas ref={ref} width={480} height={150}
        style={{ width: "100%", height: 150, background: "#fff", border: "1px dashed #94a3b8", borderRadius: 8, touchAction: "none", cursor: "crosshair" }} />
      <button type="button" onClick={clear}
        style={{ marginTop: 6, background: "transparent", border: "none", color: "#78716c", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
        Effacer la signature
      </button>
    </div>
  );
}

function DevisPage() {
  const params = new URLSearchParams(window.location.search);
  // Décodage direct du payload ?d= (lien long)
  const [data, setData] = useState(() => {
    try { return JSON.parse(atob(params.get("d") || "")); } catch { return null; }
  });
  // Lien court /r/{code} : on récupère le payload côté serveur puis on décode
  const [shortLoading, setShortLoading] = useState(() => !data && /^\/r\/[^/]+/.test(window.location.pathname));

  useEffect(() => {
    if (data) return;
    const m = window.location.pathname.match(/^\/r\/([^/]+)/);
    if (!m) return;
    fetch(`/api/shorten?code=${encodeURIComponent(m[1])}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.d) {
          try { setData(JSON.parse(atob(d.d))); } catch { /* payload corrompu */ }
        }
        setShortLoading(false);
      })
      .catch(() => setShortLoading(false));
  }, []); // eslint-disable-line

  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [depElements, setDepElements] = useState(null);
  const [step, setStep] = useState(1); // 1=paiement 2=caution 3=done
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  // Contrat signé « maison » (cpw-101) — requis avant paiement
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signName, setSignName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [sigData, setSigData] = useState("");

  const appearance = { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } };

  // Init Stripe — AUTO-SUFFISANT : attend window.Stripe (script async) puis
  // récupère la clé publique (module STRIPE_PK si déjà chargée, sinon fetch direct
  // /api/get-config). Ne dépend plus du timing du fetch module — cause du bouton
  // Payer désactivé quand STRIPE_PK n'était pas encore peuplé au montage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 50 && !window.Stripe; i++) await new Promise(r => setTimeout(r, 200));
      if (cancelled || !window.Stripe) return;
      let pk = STRIPE_PK;
      if (!pk) { try { const c = await fetch("/api/get-config").then(r => r.json()); pk = c.stripePk; } catch { /* ignore */ } }
      if (cancelled || !pk) return;
      setStripe(window.Stripe(pk));
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!stripe || !data || elements) return; // elements: évite double-création
    const totalCents = Math.round((data.total || 0) * 100);
    if (totalCents < 50) return;
    (async () => {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: totalCents, currency: "eur", metadata: { bienId: data.bienId, checkin: data.checkin, checkout: data.checkout, voyageur: data.voyageur, email: data.email, type: "devis", ...getAttributionMetadata() } }),
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
            ssSet("deposit_cs", dj.clientSecret);
            ssSet("deposit_amt", String(data.depot));
            ssSet("deposit_bien", data.bienNom || data.bienId);
          }
        }
        const el = stripe.elements({ clientSecret: json.clientSecret, appearance });
        el.create("payment");
        setElements(el);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [stripe, data]); // data peut arriver en async pour les liens courts /r/{code}

  useEffect(() => {
    if (step === 1 && signed && elements) { const pe = elements.getElement("payment"); if (pe) pe.mount("#dp-pay"); }
    if (step === 2 && depElements) { const pe = depElements.getElement("payment"); if (pe) pe.mount("#dp-dep"); }
  }, [step, signed, elements, depElements]);

  async function handleSign() {
    if (!accepted || signName.trim().length < 2 || !sigData) {
      setError("Renseignez votre nom, signez, et cochez l'acceptation."); return;
    }
    setSigning(true); setError("");
    try {
      const res = await fetch("/api/sign-contract", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bienId: data.bienId, bienNom: data.bienNom, checkin: data.checkin, checkout: data.checkout,
          voyageur: data.voyageur, email: data.email, total: data.total,
          nom: signName, signature: sigData, accepted: true,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Erreur lors de la signature");
      setSigned(true);
    } catch (e) { setError(e.message); } finally { setSigning(false); }
  }

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
      // Stocker contexte pour Merci.jsx (tracking purchase fiable avec retry)
      // ⚠️ Flux devis : pas de begin_checkout → pending_purchase créé ici (François Cambier fix)
      try {
        sessionStorage.setItem("pending_purchase", JSON.stringify({
          pi: paymentIntent.id,
          value: data.total,
          bien_id: data.bienId,
          items: [{ item_id: data.bienId, item_name: data.bienNom || data.bienId, price: data.total, quantity: 1 }],
        }));
      } catch { /* */ }
      // 🔔 Alerte hôte fiable (email + push) — déclenchée dès le paiement réussi
      // ⚠️ keepalive:true OBLIGATOIRE : sans ça, le window.location.href = "/merci"
      // ci-dessous annule la requête avant qu'elle parte → notif hôte JAMAIS envoyée.
      // Bug historique 06/2026 (résa François Cambier 1233€ Mabouya : 0 notif reçue).
      fetch("/api/notify-booking", {
        method: "POST", headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          bienId: data.bienId, bienNom: data.bienNom || data.bienId,
          voyageur: data.voyageur, email: data.email,
          total: data.total, depot: data.depot, checkin: data.checkin, checkout: data.checkout,
        }),
      }).catch(() => {});
      const cs = ssGet("deposit_cs");
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

  if (!data && shortLoading) return (
    <div style={{ minHeight: "100vh", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif" }}>
      <div style={{ textAlign: "center", color: NAVY }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 16 }}>Chargement de votre devis…</div>
      </div>
    </div>
  );

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
          <Eyebrow style={{ marginBottom: 8, fontSize: 13 }}>Devis personnalisé</Eyebrow>
          <h1 style={{ fontSize: 26, color: NAVY, margin: 0 }}>{data.bienNom || data.bienId}</h1>
          {data.checkin && <div style={{ fontSize: 13, color: "#78716c", marginTop: 6 }}>{data.checkin} → {data.checkout}</div>}
          {data.voyageur && <div style={{ fontSize: 13, color: "#78716c" }}>Pour {data.voyageur}</div>}
        </div>

        <div style={{ background: CREAM, borderRadius: 14, padding: "20px 24px", marginBottom: 24, border: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Récapitulatif</div>
          {data.montantSejour > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#44403c", marginBottom: 6 }}><span>Séjour</span><span>{fmtEur(data.montantSejour)}</span></div>}
          {data.fraisMenage > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#44403c", marginBottom: 6 }}><span>Frais de ménage</span><span>{fmtEur(data.fraisMenage)}</span></div>}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: NAVY }}><span>Total</span><span>{fmtEur(data.total)}</span></div>
          {data.depot > 0 && <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(245,158,11,0.08)", borderRadius: 8, fontSize: 12, color: "#92400e" }}>🔒 Dépôt de garantie {fmtEur(data.depot)} — bloqué mais non débité</div>}
        </div>

        {/* Étape contrat + signature — requis avant paiement (cpw-101) */}
        {step === 1 && !signed && (
          <>
            <div style={{ background: CREAM, borderRadius: 14, padding: "20px 24px", marginBottom: 20, border: "1px solid rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Contrat de location</div>
              <div style={{ fontSize: 13, color: "#44403c", lineHeight: 1.7, marginBottom: 14 }}>
                En signant, vous confirmez votre réservation de <strong>{data.bienNom || data.bienId}</strong> du <strong>{data.checkin}</strong> au <strong>{data.checkout}</strong> pour <strong>{fmtEur(data.total)}</strong>{data.depot > 0 ? ` (+ dépôt de garantie ${fmtEur(data.depot)} pré-autorisé)` : ""}, et acceptez le contrat de location meublé de tourisme et les <a href="/conditions-generales" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>conditions générales</a> (règlement intérieur, conditions d'annulation, dépôt de garantie).
              </div>
              <label style={{ fontSize: 12, fontWeight: 700, color: NAVY, display: "block", marginBottom: 6 }}>Nom et prénom du signataire</label>
              <input type="text" value={signName} onChange={e => setSignName(e.target.value)} placeholder="ex : Jean Dupont"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", fontSize: 14, boxSizing: "border-box", marginBottom: 12, fontFamily: "Georgia,serif" }} />
              <label style={{ fontSize: 12, fontWeight: 700, color: NAVY, display: "block", marginBottom: 6 }}>Signature manuscrite</label>
              <SignaturePad onChange={setSigData} />
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, fontSize: 13, color: "#44403c", cursor: "pointer" }}>
                <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ marginTop: 3 }} />
                <span>J'ai lu et j'accepte le contrat de location et les conditions générales.</span>
              </label>
            </div>
            {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}
            <button onClick={handleSign} disabled={signing || !accepted || !sigData || signName.trim().length < 2}
              style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: (signing || !accepted || !sigData || signName.trim().length < 2) ? "#94a3b8" : NAVY, color: "#fff", fontSize: 15, fontWeight: 700, cursor: (signing || !accepted || !sigData) ? "default" : "pointer" }}>
              {signing ? "⏳ Signature…" : "✍️ Signer et continuer vers le paiement"}
            </button>
          </>
        )}

        {step === 1 && signed && (
          <>
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#047857" }}>✓ Contrat signé par {signName}. Vous pouvez régler votre séjour.</div>
            <div style={{ background: CREAM, borderRadius: 14, padding: "20px 24px", marginBottom: 20, border: "1px solid rgba(0,0,0,0.08)" }}>
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
            <div style={{ background: CREAM, borderRadius: 14, padding: "20px 24px", marginBottom: 20, border: "1px solid rgba(0,0,0,0.08)" }}>
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
// CNIL : consentement limité à 13 mois max (395 jours)
const CONSENT_TTL_MS = 395 * 24 * 60 * 60 * 1000; // 395 jours en ms

function readConsent() {
  try {
    const raw = localStorage.getItem("amaryllis_consent_v2");
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > CONSENT_TTL_MS) {
      localStorage.removeItem("amaryllis_consent_v2");
      return null; // expiré — re-demander
    }
    return value; // "granted" | "denied"
  } catch { return null; }
}

function writeConsent(value) {
  try { localStorage.setItem("amaryllis_consent_v2", JSON.stringify({ value, ts: Date.now() })); } catch {}
}

function CookieBanner() {
  // DÉSACTIVÉE (2026-06-04) : la bannière globale `src/CookieBanner.jsx` (montée
  // dans main.jsx) fait foi — elle accorde ad_storage + Meta Pixel. L'ancienne
  // bannière inline n'accordait qu'analytics_storage → ad_storage restait denied
  // → conversions Google Ads perdues. On la neutralise (jamais visible) pour
  // supprimer la double-bannière sans toucher aux 4 points de rendu.
  const [visible, setVisible] = useState(false);

  function accept() {
    writeConsent("granted");
    if (window.gtag) window.gtag("consent", "update", { analytics_storage: "granted" });
    setVisible(false);
  }

  function refuse() {
    writeConsent("denied");
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
            <Eyebrow style={{ marginBottom: 6 }}>Nos adresses</Eyebrow>
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
                  display: "flex", alignItems: "center", gap: 10, background: IVORY,
                  border: `1px solid ${SAND}`, borderRadius: 10, padding: "10px 12px",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.boxShadow = "0 2px 12px rgba(14,59,58,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = SAND; e.currentTarget.style.boxShadow = "none"; }}>
                <img loading="lazy" decoding="async" src={b.photos[0]} alt={b.nom} style={{ width: 52, height: 52, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
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
  const { t, lang } = useLang();
  const [selectedBien, setSelectedBien] = useState(null);
  const [showBienPicker, setShowBienPicker] = useState(false);
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
  // Ref pour éviter le double-déclenchement de fetchAvailability en mode _directBien
  const directBienFetchedRef = useRef(false);
  const [priceOverrides, setPriceOverrides] = useState(loadPriceOverrides);
  const [curtainDone, setCurtainDone] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const exitShown = useRef(!!ssGet("amaryllis_exit_shown"));
  const [compareIds, setCompareIds] = useState(new Set());
  const [showComparator, setShowComparator] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("amaryllis_recent") || "[]"); } catch { return []; }
  });

  // ── Géo-personnalisation ─────────────────────────────────────────────────
  const geo = useGeo();

  // ── Reprise de session ────────────────────────────────────────────────────
  const SESSION_KEY = "amaryllis_session_v1";
  const SESSION_TTL = 24 * 60 * 60 * 1000; // 24h
  const [sessionResume, setSessionResume] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!s || Date.now() - s.ts > SESSION_TTL) return null;
      const b = BIENS.find(x => x.id === s.bienId);
      if (!b || BOOKING_DISABLED.has(b.id)) return null;
      return s;
    } catch { return null; }
  });
  function saveSession(bienId, checkin = null, checkout = null) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ bienId, checkin, checkout, ts: Date.now() })); } catch {}
  }
  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setSessionResume(null);
  }

  // Scroll vers #faq après lazy-load (le hash natif rate car le composant n'est pas encore monté)
  useEffect(() => {
    if (window.location.hash === "#faq") {
      const scroll = () => {
        const el = document.getElementById("faq");
        if (el) { el.scrollIntoView({ behavior: "smooth" }); return true; }
        return false;
      };
      if (!scroll()) {
        const t = setTimeout(scroll, 400); // retry après rendu complet
        return () => clearTimeout(t);
      }
    }
  }, []);

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

  // Charger les tarifs JOURNALIERS depuis le serveur au démarrage → fusionne dans localStorage
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

  // [supprimé 2026-06] L'ancien « prix de base » (site-config base_prices) était
  // fusionné ici dans amaryllis_prices avec un format incompatible (nombre vs
  // {date:prix}) → collision/corruption. Source unique désormais = prix journaliers
  // (site-config type=prices, chargés ci-dessus). L'accroche « dès X€ » est calculée
  // (min des prix journaliers) — voir docs/PRICING.md.

  // ── Sync tarifs Beds24 → localStorage (Nogent uniquement, TTL 1h) ──────────
  // Beds24 est la source de vérité pour les prix. Toute modification dans Beds24
  // est répercutée automatiquement sur le site à la prochaine visite (ou après 1h).
  const [beds24RatesMap, setBeds24RatesMap] = useState(() => {
    try { return loadDailyPrices()["nogent"] || {}; } catch { return {}; }
  });
  useEffect(() => {
    const SYNC_KEY = "beds24_rates_synced_at";
    const lastSync = localStorage.getItem(SYNC_KEY);
    const stale    = !lastSync || (Date.now() - Number(lastSync)) > 3600_000; // 1h
    if (!stale) return; // données fraîches, pas besoin de re-fetch

    fetch("/api/beds24-rates")
      .then(r => r.json())
      .then(d => {
        if (!d.ok || !d.prices || !Object.keys(d.prices).length) return;
        // Injecter dans le système de prix existant (merge + dispatch event)
        applyServerPriceOverrides({ [d.bienId]: d.prices });
        // Mettre à jour le state local du modal
        setBeds24RatesMap(d.prices);
        localStorage.setItem(SYNC_KEY, String(Date.now()));
        console.log(`[beds24-rates] sync OK — ${Object.keys(d.prices).length} jours, ${d.meta?.minPrice}–${d.meta?.maxPrice}€/nuit`);
      })
      .catch(e => console.warn("[beds24-rates] sync échouée:", e.message));
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

  // GA4 — view_item_list : liste des propriétés visible sur la homepage
  useEffect(() => {
    if (!window.gtag || detailBien) return; // ne fire que sur la homepage, pas les fiches
    window.gtag("event", "view_item_list", {
      item_list_id:   "villas",
      item_list_name: "Nos propriétés",
      items: biensList.map((b, i) => ({
        item_id:       b.id,
        item_name:     b.nom,
        item_category: b.type === "court" ? "Location courte durée" : "Location longue durée",
        price:         b.prix || 0,
        currency:      "EUR",
        index:         i,
      })),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // une seule fois au montage

  // Fetch availability for a bien (used by detail view + booking modal)
  async function fetchAvailability(bienId) {
    // Cache hit (5 min TTL) → résultat immédiat, pas de spinner
    const cached = _availCache[bienId];
    if (cached && Date.now() - cached.ts < AVAIL_CACHE_TTL) {
      setBlockedDates(cached.data);
      setLoadingAvail(false);
      if (window.gtag) window.gtag("event", "availability_ready", { bien_id: bienId, blocked_count: cached.data.length, cache_hit: true });
      const next = nextAvailWindow(cached.data, bienId);
      if (next) setBookingInitialDates(prev => prev.checkin ? prev : next);
      return;
    }

    // Abort any in-flight request before starting a new one
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;

    setLoadingAvail(true);
    try {
      let apiUrl = `/api/get-availability?bienId=${bienId}`;
      try {
        const bookingUrls = JSON.parse(localStorage.getItem("ical_urls_booking") || "{}");
        if (bookingUrls[bienId]) apiUrl += `&bookingUrl=${encodeURIComponent(bookingUrls[bienId])}`;
      } catch {}
      const r = await fetchWithRetry(apiUrl, { signal: ctrl.signal });
      if (r.ok) {
        const d = await r.json();
        const blocked = d.blockedDates || [];
        _availCache[bienId] = { data: blocked, ts: Date.now() };
        setBlockedDates(blocked);
        if (window.gtag) window.gtag("event", "availability_ready", { bien_id: bienId, blocked_count: blocked.length, cache_hit: false });
        const next = nextAvailWindow(blocked, bienId);
        if (next) setBookingInitialDates(prev => prev.checkin ? prev : next);
      }
    } catch (e) {
      if (e.name !== "AbortError") { /* ignore aborted requests */ }
    }
    setLoadingAvail(false);
  }

  // Précharge silencieuse (hover) — stocke dans le cache module, pas dans le state
  async function prefetchAvailability(bienId) {
    if (BOOKING_DISABLED.has(bienId)) return;
    const cached = _availCache[bienId];
    if (cached && Date.now() - cached.ts < AVAIL_CACHE_TTL) return;
    try {
      let apiUrl = `/api/get-availability?bienId=${bienId}`;
      try {
        const bookingUrls = JSON.parse(localStorage.getItem("ical_urls_booking") || "{}");
        if (bookingUrls[bienId]) apiUrl += `&bookingUrl=${encodeURIComponent(bookingUrls[bienId])}`;
      } catch {}
      const r = await fetch(apiUrl);
      if (r.ok) {
        const d = await r.json();
        _availCache[bienId] = { data: d.blockedDates || [], ts: Date.now() };
      }
    } catch { /* prefetch silencieux — jamais bloquant */ }
  }

  // Open property detail — navigation SPA (pushState), pas de rechargement
  function openDetail(bien) {
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
      window.scrollTo({ top: 0, behavior: "instant" });
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
              "identifier": bien.id,
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
                  "ratingValue": String(bien.rating).replace(",", "."),
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
              "containsPlace": {
                "@type": "Accommodation",
                "additionalType": "EntirePlace",
                ...(bien.chambres ? { "numberOfBedrooms": bien.chambres } : {}),
                "occupancy": { "@type": "QuantitativeValue", "maxValue": bien.capacite },
                "amenityFeature": (bien.amenities || []).map(e => ({ "@type": "LocationFeatureSpecification", "name": e, "value": true })),
              },
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
        bien_id: bien.id, niveau_tarifaire: niveauTarifaire(bien),
        item_list_id: "villas",
        items: [{ item_id: bien.id, item_name: bien.nom, item_category: bien.lieu?.split(",")[0]?.trim() || "Martinique", price: bien.prix || 0, currency: "EUR" }],
      });
      const _vcP = { content_ids: [bien.id], content_name: bien.nom, content_type: "product", value: bien.prix || 0, currency: "EUR" };
      mpTrack("ViewContent", _vcP);
      window.addEventListener("meta-pixel-ready", () => mpTrack("ViewContent", _vcP), { once: true });

      if (!BOOKING_DISABLED.has(bien.id)) fetchAvailability(bien.id);
    } else {
      const homeTitle = "Amaryllis — Location villa Martinique avec piscine | Réservation directe";
      const homeDesc = "Louez directement nos villas et appartements en Martinique (Sainte-Luce, Schœlcher) et en Île-de-France. Piscine à débordement, vue mer, jacuzzi privatif. Sans frais de service Airbnb.";

      window.history.pushState({}, "", "/");
      window.scrollTo({ top: 0, behavior: "instant" });
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
    if (window.gtag) window.gtag("event", "availability_check", { bien_id: bien.id, bien_nom: bien.nom, has_dates: !!(initialCheckin && initialCheckout) });
    saveSession(bien.id, initialCheckin, initialCheckout);
    if (bien.useBeds24) {
      openDetail(null);
      // Fallback : lire les dates depuis l'URL si non fournies par le calendrier
      const _p = new URLSearchParams(window.location.search);
      setBeds24Bien(bien);
      setBeds24Dates({
        checkin:  initialCheckin  || _p.get("checkin")  || null,
        checkout: initialCheckout || _p.get("checkout") || null,
      });
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
      ssSet("amaryllis_exit_shown", "1");
      setShowExitIntent(true);
    };
    document.addEventListener("mouseleave", fn);
    return () => { clearTimeout(t); document.removeEventListener("mouseleave", fn); };
  }, []);

  // Auto-open property detail if URL matches a bien ID (e.g. /amaryllis)
  // Couvre aussi le mode page directe (_directBien) : si l'utilisateur accède directement à
  // /nogent (ou tout autre bien), fetchAvailability est appelé ici au montage pour charger
  // les blockedDates. directBienFetchedRef évite le double-déclenchement.
  useEffect(() => {
    const pathId = window.location.pathname.slice(1);
    if (pathId && pathId !== "merci" && pathId !== "devis") {
      const match = BIENS.find(b => b.id === pathId);
      if (match) {
        const withPrice = { ...match, prix: loadPriceOverrides()[match.id] ?? match.prix };
        setDetailBien(withPrice);
        // GA4 event — view_item (fiche villa consultée)
        if (window.gtag) {
          window.gtag("event", "view_item", {
            currency: "EUR",
            value: withPrice.prix || 0,
            bien_id: match.id,
            niveau_tarifaire: niveauTarifaire(withPrice),
            items: [{
              item_id: match.id,
              item_name: match.nom,
              item_category: match.lieu || "Martinique",
              price: withPrice.prix || 0,
              quantity: 1,
            }],
          });
        }
        // Meta Pixel ViewContent — fires immediately if pixel is loaded (returning visitor),
        // or deferred via meta-pixel-ready for new visitors who consent after page load.
        const vcParams = { content_ids: [match.id], content_name: match.nom, content_type: "product", value: withPrice.prix || 0, currency: "EUR" };
        mpTrack("ViewContent", vcParams);
        const onPixelReady = () => mpTrack("ViewContent", vcParams);
        window.addEventListener("meta-pixel-ready", onPixelReady, { once: true });

        if (!BOOKING_DISABLED.has(match.id) && !directBienFetchedRef.current) {
          directBienFetchedRef.current = true;
          fetchAvailability(match.id);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  if (path === "/devis" || path.startsWith("/r/")) return <DevisPage />;

  // ── Mode page propriété directe ──────────────────────────────
  // Normalise le chemin : /amaryllis/ → amaryllis (trailing slash compatible redirects Cloudflare)
  const _directPathId = window.location.pathname.replace(/\/$/, "").slice(1);
  const _directBien = _directPathId ? BIENS.find(b => b.id === _directPathId) : null;
  if (_directBien) {
    const directBienWithPrice = { ..._directBien, prix: loadPriceOverrides()[_directBien.id] ?? _directBien.prix };
    const _directParams = new URLSearchParams(window.location.search);
    const _directCheckin  = _directParams.get("checkin")  || null;
    const _directCheckout = _directParams.get("checkout") || null;
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
          onClose={() => openDetail(null)}
          onBook={openBien}
          blockedDates={blockedDates}
          loadingAvail={loadingAvail}
          initialCheckin={_directCheckin || bookingInitialDates.checkin}
          initialCheckout={_directCheckout || bookingInitialDates.checkout}
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
        {beds24Bien && <Beds24Modal bien={beds24Bien} checkin={beds24Dates.checkin} checkout={beds24Dates.checkout} dailyPricesMap={beds24RatesMap} onClose={() => { setBeds24Bien(null); setBeds24Dates({ checkin: null, checkout: null }); }} />}
        <FooterBottomBar />
      </div>
    );
  }

  // ── Page dédiée : offre groupée résidence (location grand groupe) ──────────
  if (path === "/location-groupe-sainte-luce") {
    const groupFaq = [
      { q: "Combien de personnes peut accueillir la résidence ?", a: "Jusqu'à 11 personnes en réservant les 3 logements ensemble : Zandoli (5), Géko (4) et Mabouya (2). Vous pouvez aussi n'en combiner que deux selon votre groupe." },
      { q: "Les logements sont-ils proches les uns des autres ?", a: "Oui, Zandoli, Géko et Mabouya sont dans la même résidence sur les hauteurs de Sainte-Luce — idéal pour réunir famille ou amis tout en gardant l'intimité de chacun (chaque logement a sa piscine ou son jacuzzi privatif)." },
      { q: "Comment se passe la réservation et le paiement ?", a: "Sélectionnez vos dates et vos logements ci-dessus : la disponibilité est vérifiée en direct et le prix total s'affiche automatiquement. Vous recevez un devis et un paiement unique sécurisé pour l'ensemble du séjour." },
    ];
    return (
      <div style={{ background: IVORY, fontFamily: "'Jost', system-ui, -apple-system, sans-serif", color: TEXT, overflowX: "hidden" }}>
        <SEOMeta
          title="Location grand groupe Martinique — jusqu'à 11 personnes, Sainte-Luce"
          description="Réunissez jusqu'à 11 proches en réservant Zandoli, Géko et Mabouya ensemble à Sainte-Luce. Résidence privée, piscines, réservation directe sans frais. Devis et paiement rapides."
          canonical="/location-groupe-sainte-luce"
          image="https://villamaryllis.com/photos/zandoli/01.webp"
        />
        <CookieBanner />

        {/* Header minimal */}
        <header style={{ position: "sticky", top: 0, zIndex: 200, background: "#0e3b3a", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, letterSpacing: "0.04em" }}>Amaryllis</a>
          <a href="/" style={{ color: "rgba(250,245,233,0.75)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>← Tous nos logements</a>
        </header>

        {/* Hero */}
        <section style={{ position: "relative", background: `#0e2020 url('/photos/zandoli/01.webp') center/cover no-repeat`, padding: "90px 24px 96px" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,59,58,0.35) 0%, rgba(14,59,58,0.78) 100%)" }} />
          <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(250,245,233,0.7)", marginBottom: 16 }}>Résidence Amaryllis · Sainte-Luce</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: "clamp(30px, 5vw, 52px)", color: IVORY, margin: "0 0 16px", lineHeight: 1.12 }}>
              Location grand groupe en Martinique — jusqu'à 11 personnes
            </h1>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 16, color: "rgba(250,245,233,0.85)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
              Réunissez famille ou amis en réservant ensemble Zandoli, Géko et Mabouya — trois logements de la même résidence privée sur les hauteurs de Sainte-Luce, chacun avec piscine ou jacuzzi.
            </p>
          </div>
        </section>

        {/* Configurateur */}
        <section style={{ padding: "56px 24px", maxWidth: 960, margin: "0 auto" }}>
          <GroupBookingBuilder biens={biensList} />
        </section>

        {/* Argumentaire */}
        <section style={{ background: CREAM, borderTop: `1px solid ${SAND}`, borderBottom: `1px solid ${SAND}`, padding: "56px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28 }}>
            {[
              { icon: "🏡", t: "Toute la résidence pour vous", d: "Privatisez jusqu'à 3 logements voisins : la convivialité d'être ensemble, l'intimité de chacun son espace." },
              { icon: "💧", t: "Piscines & jacuzzi privatifs", d: "Chaque logement a sa propre piscine à cascade ou son jacuzzi vue mer — pas de partage." },
              { icon: "💸", t: "Réservation directe, sans frais", d: "Prix total transparent calculé en direct, paiement unique sécurisé, contact direct avec l'hôte." },
            ].map(x => (
              <div key={x.t} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{x.icon}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 15, color: NAVY, marginBottom: 6 }}>{x.t}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "56px 24px", maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 30, color: NAVY, textAlign: "center", margin: "0 0 28px" }}>Questions fréquentes</h2>
          {groupFaq.map(f => (
            <div key={f.q} style={{ borderTop: `1px solid ${SAND}`, padding: "18px 0" }}>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 6 }}>{f.q}</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: groupFaq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }} />
        </section>

        <FooterSection />
        <FooterBottomBar />
      </div>
    );
  }

  // ── Page SEO : Location appartement vue mer à Schœlcher (seo-030) ──────────
  if (path === "/location-appartement-vue-mer-schoelcher") {
    const bellevue = biensList.find(b => b.id === "schoelcher");
    const schFaq = [
      { q: "L'appartement Bellevue est-il une villa ?", a: "Non — Bellevue est un appartement de standing au dernier étage d'une résidence sécurisée à Schœlcher, et non une villa. Il offre une vue panoramique sur la baie de Fort-de-France pour 2 personnes." },
      { q: "Quelle est la vue depuis l'appartement ?", a: "Une vue dégagée sur la baie de Fort-de-France et les Trois-Îlets, depuis la terrasse du dernier étage. Idéale au coucher du soleil." },
      { q: "Schœlcher est-il bien situé en Martinique ?", a: "Oui — Schœlcher jouxte Fort-de-France (centre à ~10 min), avec plages, université et commerces à proximité. Un bon camp de base pour rayonner sur toute l'île." },
    ];
    return (
      <div style={{ background: IVORY, fontFamily: "'Jost', system-ui, -apple-system, sans-serif", color: TEXT, overflowX: "hidden" }}>
        <SEOMeta
          title="Location appartement vue mer Schœlcher — Martinique"
          description="Appartement de standing à Schœlcher : vue panoramique sur la baie de Fort-de-France, dernier étage, 2 personnes, à 10 min du centre. Réservation directe sans frais."
          canonical="/location-appartement-vue-mer-schoelcher"
          image="https://villamaryllis.com/photos/schoelcher/16.webp"
        />
        <CookieBanner />
        <header style={{ position: "sticky", top: 0, zIndex: 200, background: "#0e3b3a", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, letterSpacing: "0.04em" }}>Amaryllis</a>
          <a href="/" style={{ color: "rgba(250,245,233,0.75)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>← Tous nos logements</a>
        </header>

        <section style={{ position: "relative", background: `#0e2020 url('/photos/schoelcher/16.webp') center/cover no-repeat`, padding: "90px 24px 96px" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,59,58,0.35) 0%, rgba(14,59,58,0.78) 100%)" }} />
          <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(250,245,233,0.7)", marginBottom: 16 }}>Schœlcher · Martinique</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: "clamp(30px, 5vw, 50px)", color: IVORY, margin: "0 0 16px", lineHeight: 1.12 }}>
              Location appartement vue mer à Schœlcher
            </h1>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 16, color: "rgba(250,245,233,0.85)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
              Bellevue — un appartement de standing au dernier étage, avec vue panoramique sur la baie de Fort-de-France et les Trois-Îlets. Pour deux, au calme, à dix minutes du centre.
            </p>
          </div>
        </section>

        <section style={{ padding: "56px 24px", maxWidth: 820, margin: "0 auto" }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 15, color: TEXT, lineHeight: 1.8 }}>
            Perché au dernier étage d'une résidence sécurisée de Schœlcher, l'appartement <strong>Bellevue</strong> ouvre sur l'un des plus beaux panoramas de la côte caraïbe : la baie de Fort-de-France, les Trois-Îlets au loin, et des couchers de soleil qui embrasent l'horizon. Ce n'est pas une villa, mais un <strong>appartement de standing</strong> pensé pour deux — lumineux, calme, raffiné. La brise marine y rend la climatisation presque superflue, et les plages comme le centre-ville sont à quelques minutes.
          </p>
        </section>

        <section style={{ background: CREAM, borderTop: `1px solid ${SAND}`, borderBottom: `1px solid ${SAND}`, padding: "56px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28 }}>
            {[
              { icon: "🌅", t: "Vue baie panoramique", d: "Fort-de-France et les Trois-Îlets depuis votre terrasse, au dernier étage." },
              { icon: "📍", t: "À 10 min du centre", d: "Schœlcher jouxte Fort-de-France : commerces, plages et culture à portée." },
              { icon: "🔑", t: "Réservation directe", d: "Sans frais Airbnb, contact direct avec l'hôte, paiement sécurisé." },
            ].map(x => (
              <div key={x.t} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{x.icon}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 15, color: NAVY, marginBottom: 6 }}>{x.t}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{x.d}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <a href="/schoelcher" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 8, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Voir l'appartement Bellevue{bellevue?.prix ? ` — dès ${bellevue.prix}€/nuit` : ""} →
            </a>
          </div>
        </section>

        <section style={{ padding: "56px 24px", maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 30, color: NAVY, textAlign: "center", margin: "0 0 28px" }}>Questions fréquentes</h2>
          {schFaq.map(f => (
            <div key={f.q} style={{ borderTop: `1px solid ${SAND}`, padding: "18px 0" }}>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 6 }}>{f.q}</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: schFaq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }} />
        </section>

        <FooterSection />
        <FooterBottomBar />
      </div>
    );
  }

  // ── Guide SEO : Les plus belles plages du Sud de la Martinique (seo cluster) ──
  if (path === "/plus-belles-plages-sud-martinique") {
    const plages = [
      { h2: "Les Salines, l'icône dorée de Sainte-Anne", p1: "Au bout de la presqu'île, la plage des Salines déroule plus d'un kilomètre de sable blond bordé de cocotiers penchés vers l'eau. Tôt le matin, vous avez l'impression que cette carte postale n'appartient qu'à vous : la lumière est douce, l'eau translucide et tiède.", p2: "Comptez 30 à 35 minutes depuis Sainte-Luce. Parking gratuit le long de la plage (arrivez avant 10h en haute saison). Stands de boissons et accras, baignade facile au fond sableux, idéale en famille. Pour le snorkeling, préférez les extrémités rocheuses." },
      { h2: "Anse Corps de Garde, le secret tortues de Sainte-Luce", p1: "Juste à votre porte, l'Anse Corps de Garde est l'une de ces plages que les voyageurs gardent jalousement. Sable clair, eau calme protégée, et la promesse certains matins de croiser une tortue verte broutant les herbiers.", p2: "Vous y êtes en 5 à 10 minutes depuis nos logements. Stationnement le long de la route — arrivez tôt le week-end. Masque et tuba dans le sac : les herbiers proches du rivage offrent un snorkeling accessible. Observez les tortues à distance, sans les toucher." },
      { h2: "Le Diamant, le grand large face au Rocher", p1: "Près de quatre kilomètres de sable ouverts sur l'océan, avec en toile de fond le célèbre Rocher du Diamant. Le vent caresse les filaos, les vagues roulent avec énergie, et les couchers de soleil y prennent des teintes spectaculaires.", p2: "À environ 25 minutes de Sainte-Luce, plusieurs accès et parkings le long du bourg. Attention : les courants peuvent être forts, baignez-vous près du rivage. Pas un spot de snorkeling, mais un terrain de jeu magnifique pour la marche et la contemplation au coucher du soleil." },
      { h2: "Grande Anse d'Arlet, le ponton et les tortues du matin", p1: "Lovée entre deux mornes, Grande Anse d'Arlet est un village de pêcheurs aux maisons colorées reflétées dans une eau d'un calme absolu. Le ponton de bois s'avance vers le large, les yoles dansent doucement.", p2: "Environ 35 à 40 minutes depuis Sainte-Luce. Parking à l'entrée du village, venez tôt. Le snorkeling autour du ponton et des rochers est superbe : tortues, poissons multicolores, eau limpide. Petits restaurants les pieds dans le sable." },
      { h2: "Anse Dufour et Anse Noire, les deux sœurs voisines", p1: "Deux criques jumelles au contraste saisissant : Anse Dufour et son sable clair, Anse Noire et son étonnant sable volcanique. L'eau y est calme, ourlée de cocotiers — l'endroit rêvé pour une journée nature, masque sur le visage.", p2: "Environ 35 minutes depuis Sainte-Luce ; parking à Anse Dufour, escalier vers Anse Noire (chaussures conseillées). Snorkeling exceptionnel : tortues vertes fréquentes à Anse Dufour, fonds rocheux poissonneux à Anse Noire." },
      { h2: "Pointe Marin, le sable familial de Sainte-Anne", p1: "À l'entrée du bourg de Sainte-Anne, la Pointe Marin marie l'eau turquoise des Salines au confort d'un véritable village. Cocotiers, sable fin, mer peu profonde et translucide : tout invite à la baignade tranquille.", p2: "Une trentaine de minutes de Sainte-Luce, avec parking, douches, restaurants et clubs nautiques à proximité. Baignade en eau calme au fond progressif, parfaite pour les enfants. Pour le snorkeling, dirigez-vous vers les rochers en bordure." },
      { h2: "Les Trois-Îlets, criques discrètes et vue sur Fort-de-France", p1: "Côté baie de Fort-de-France, les Trois-Îlets égrènent plusieurs petites plages (Anse Mitan, Anse à l'Âne), intimistes, où l'eau calme se teinte de reflets argentés au soleil couchant.", p2: "Environ 40 minutes de route depuis Sainte-Luce. Parkings et navettes maritimes vers Fort-de-France rendent le secteur pratique. Baignade facile et sécurisante, idéale pour une demi-journée tranquille." },
    ];
    const dist = [
      ["Anse Corps de Garde", "~3 km", "5–10 min"], ["Le Diamant", "~18 km", "~25 min"],
      ["Pointe Marin (Sainte-Anne)", "~22 km", "~30 min"], ["Les Salines (Sainte-Anne)", "~25 km", "30–35 min"],
      ["Anse Dufour / Anse Noire", "~28 km", "~35 min"], ["Grande Anse d'Arlet", "~30 km", "35–40 min"],
      ["Les Trois-Îlets", "~32 km", "~40 min"],
    ];
    const plagesFaq = [
      { q: "Quelle est la plus belle plage du Sud de la Martinique ?", a: "Les Salines à Sainte-Anne font figure d'icône, mais l'Anse Corps de Garde à Sainte-Luce et Grande Anse d'Arlet séduisent par leur authenticité et leurs tortues. La plus belle est souvent celle où vous arrivez avant la foule, tôt le matin." },
      { q: "Où nager avec les tortues dans le Sud de la Martinique ?", a: "Grande Anse d'Arlet, Anse Dufour et l'Anse Corps de Garde à Sainte-Luce sont les meilleurs spots. Le matin tôt augmente nettement vos chances. Observez-les à distance, sans les toucher ni les nourrir." },
      { q: "Les plages du Sud sont-elles loin de Sainte-Luce ?", a: "Non : l'Anse Corps de Garde est à 5–10 minutes, et la plupart des grandes plages (Diamant, Salines, Arlet) se trouvent entre 25 et 40 minutes de route." },
      { q: "Quelles plages sont adaptées aux enfants ?", a: "La Pointe Marin et les Salines à Sainte-Anne, ainsi que les criques des Trois-Îlets, offrent une eau calme et peu profonde. Évitez le Diamant, où les courants peuvent être forts." },
      { q: "Faut-il payer pour accéder aux plages et au parking ?", a: "Les plages de Martinique sont publiques et gratuites. Le stationnement est le plus souvent gratuit mais limité : arrivez tôt, surtout le week-end et en haute saison." },
    ];
    const maillage = [
      ["Guide Sainte-Anne et les Salines", "/guide-sainte-anne"], ["Guide Grande Anse d'Arlet", "/guide-arlet"],
      ["Guide du Diamant", "/guide-le-diamant"], ["Carte interactive du Sud", "/explorer"], ["Séjourner à Sainte-Luce", "/sainte-luce-martinique"],
    ];
    return (
      <div style={{ background: IVORY, fontFamily: "'Jost', system-ui, -apple-system, sans-serif", color: TEXT, overflowX: "hidden" }}>
        <SEOMeta
          title="Plus belles plages du Sud de la Martinique"
          description="Sable blanc, eau turquoise, tortues : découvrez les plus belles plages du Sud de la Martinique, toutes à moins de 40 min de Sainte-Luce."
          canonical="/plus-belles-plages-sud-martinique"
          image="https://villamaryllis.com/photos/amaryllis/05.webp"
        />
        <CookieBanner />
        <header style={{ position: "sticky", top: 0, zIndex: 200, background: "#0e3b3a", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, letterSpacing: "0.04em" }}>Amaryllis</a>
          <a href="/explorer" style={{ color: "rgba(250,245,233,0.75)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>Carte des activités →</a>
        </header>

        <section style={{ position: "relative", background: `#0e2020 url('/photos/amaryllis/05.webp') center/cover no-repeat`, padding: "90px 24px 96px" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,59,58,0.35) 0%, rgba(14,59,58,0.78) 100%)" }} />
          <div style={{ position: "relative", maxWidth: 840, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(250,245,233,0.7)", marginBottom: 16 }}>Guide d'initiés · Sud Martinique</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: "clamp(28px, 4.6vw, 48px)", color: IVORY, margin: "0 0 16px", lineHeight: 1.14 }}>
              Les plus belles plages du Sud de la Martinique
            </h1>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 16, color: "rgba(250,245,233,0.85)", maxWidth: 640, margin: "0 auto", lineHeight: 1.65 }}>
              Imaginez le sable frais au lever du jour, l'eau si claire qu'elle semble invisible, et au loin la silhouette du Rocher du Diamant. Des Salines dorées aux criques secrètes d'Anse Noire — depuis Sainte-Luce, vous êtes idéalement placés pour les explorer une à une.
            </p>
          </div>
        </section>

        <section style={{ padding: "48px 24px", maxWidth: 760, margin: "0 auto" }}>
          {plages.map(s => (
            <div key={s.h2} style={{ marginBottom: 36 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 26, color: NAVY, margin: "0 0 12px", lineHeight: 1.2 }}>{s.h2}</h2>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14.5, color: TEXT, lineHeight: 1.75, margin: "0 0 12px" }}>{s.p1}</p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13.5, color: MUTED, lineHeight: 1.7, margin: 0 }}>{s.p2}</p>
            </div>
          ))}
        </section>

        <section style={{ background: CREAM, borderTop: `1px solid ${SAND}`, borderBottom: `1px solid ${SAND}`, padding: "48px 24px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 28, color: NAVY, textAlign: "center", margin: "0 0 10px" }}>Depuis nos logements</h2>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13.5, color: MUTED, textAlign: "center", margin: "0 0 24px" }}>Toutes ces plages rayonnent autour de Sainte-Luce, votre camp de base idéal pour explorer le Sud.</p>
            <div style={{ overflow: "hidden", borderRadius: 12, border: `1px solid ${SAND}`, background: "#fff" }}>
              {dist.map((r, i) => (
                <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", borderTop: i ? `1px solid ${SAND}` : "none", fontFamily: "'Jost', sans-serif", fontSize: 13 }}>
                  <span style={{ color: NAVY, fontWeight: 500 }}>{r[0]}</span>
                  <span style={{ color: MUTED }}>{r[1]} · {r[2]}</span>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13.5, color: TEXT, lineHeight: 1.7, margin: "20px 0 0", textAlign: "center" }}>
              Pour rentrer le soir et savourer le coucher du soleil chez vous, réservez en direct : nos villas <a href="/amaryllis" style={{ color: CORAL }}>Amaryllis</a> et <a href="/iguana" style={{ color: CORAL }}>Iguana</a>, le logement <a href="/zandoli" style={{ color: CORAL }}>Zandoli</a>, le cocon <a href="/geko" style={{ color: CORAL }}>Géko</a> et le studio <a href="/mabouya" style={{ color: CORAL }}>Mabouya</a> vous accueillent à quelques minutes de l'Anse Corps de Garde.
            </p>
          </div>
        </section>

        <section style={{ padding: "48px 24px", maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 28, color: NAVY, textAlign: "center", margin: "0 0 24px" }}>Questions fréquentes</h2>
          {plagesFaq.map(f => (
            <div key={f.q} style={{ borderTop: `1px solid ${SAND}`, padding: "16px 0" }}>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 6 }}>{f.q}</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 12 }}>À lire aussi</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {maillage.map(([label, href]) => (
                <a key={href} href={href} style={{ fontFamily: "'Jost', sans-serif", fontSize: 12.5, color: NAVY, textDecoration: "none", border: `1px solid ${SAND}`, borderRadius: 20, padding: "7px 16px" }}>{label} →</a>
              ))}
            </div>
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: plagesFaq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }} />
        </section>

        <MaillageCluster currentSlug="plus-belles-plages-sud-martinique" bienNames={BIEN_NAMES} />

        <FooterSection />
        <FooterBottomBar />
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
    .filter(b => (THEME_FILTERS[themeFilter] || (() => true))(b))
    // Géo-personnalisation : Nogent en tête pour visiteurs IDF (France métro sans IDF = Martinique en tête)
    .sort((a, b) => {
      if (!geo || filterLieu !== "all") return 0;
      if (geo.isIDF) return a.id === "nogent" ? -1 : b.id === "nogent" ? 1 : 0;
      return 0;
    });

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
          background: scrolled ? "#0e3b3a" : "rgba(7,18,42,0.45)",
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
              <a href="/guide-hub" style={{ fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300, color: "rgba(250,245,233,0.6)", textDecoration: "none", letterSpacing: "0.08em", whiteSpace: "nowrap", display: window.innerWidth < 860 ? "none" : "block", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--c-ivory)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(250,245,233,0.6)"}
              >
                {t("exploreLink")}
              </a>
              <a href="/avis" style={{ fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300, color: "rgba(250,245,233,0.6)", textDecoration: "none", letterSpacing: "0.08em", whiteSpace: "nowrap", display: window.innerWidth < 860 ? "none" : "block", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--c-ivory)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(250,245,233,0.6)"}
              >
                Avis
              </a>
              <a href="/nos-partenaires" style={{ fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300, color: "rgba(250,245,233,0.6)", textDecoration: "none", letterSpacing: "0.08em", whiteSpace: "nowrap", display: window.innerWidth < 860 ? "none" : "block", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--c-ivory)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(250,245,233,0.6)"}
              >
                Bonnes adresses
              </a>
              <a href="/location-voiture-martinique-pas-cher" style={{ fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300, color: "rgba(250,245,233,0.6)", textDecoration: "none", letterSpacing: "0.08em", whiteSpace: "nowrap", display: window.innerWidth < 860 ? "none" : "block", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--c-ivory)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(250,245,233,0.6)"}
              >
                Location voiture
              </a>
              <LangToggle />
              <ThemeToggle inline />
              {/* CTA Contact — pill */}
              <HoverContact direction="down" pill /></div>
          </div>
        </div>
      </header>

      {/* ── HERO BRAND ── */}
      <HeroBrand biens={biensList} onBook={() => setShowBienPicker(true)} />

      {/* ── PROPERTIES SECTION — immédiatement après le hero ── */}
      <div id="properties" style={{ background: IVORY }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 32px 28px" }}>

          {/* Header centré — Claude Design */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Eyebrow style={{ marginBottom: 14 }}>
              {lang === "en" ? "Seven properties" : "Nos sept biens"}
            </Eyebrow>
            <Display size="lg" style={{ margin: "0 0 16px" }}>
              {lang === "en" ? "Choose your stay" : "Choisissez votre séjour"}
            </Display>
            <Editorial size="md" color="var(--c-muted)" style={{ maxWidth: 580, margin: "0 auto" }}>
              {lang === "en"
                ? "From villa with pool to Parisian apartment — each address managed by our team, with the same care."
                : "De la villa avec piscine à l'appartement parisien — chaque adresse est gérée par notre équipe sur place, avec la même exigence."}
            </Editorial>
          </div>

          {/* Barre de recherche par dates */}
          <SearchByDates biens={biensList} onBook={openBien} onDetail={openDetail} />

          {/* ── Filtres thématiques + lieu + favoris — une seule ligne ── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, alignItems: "center", marginTop: 28 }}>
            {/* Thématiques */}
            {[
              { key: "tout",       label: "Tout",              icon: "✦" },
              { key: "vue-mer",    label: "Vue mer",           icon: "🌊" },
              { key: "piscine",    label: "Piscine / Jacuzzi", icon: "🏊" },
              { key: "famille",    label: "Famille (5+)",      icon: "👨‍👩‍👧" },
              { key: "couple",     label: "Couple",            icon: "💑" },
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
            {/* Séparateur visuel */}
            <div style={{ width: 1, height: 20, background: SAND, margin: "0 4px", flexShrink: 0 }} />
            {/* Lieu */}
            {lieux.filter(l => l.key !== "all").map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFilterLieu(f => f === key ? "all" : key); setShowFavorites(false); }}
                style={{
                  padding: "7px 16px",
                  borderRadius: 20,
                  border: `1px solid ${filterLieu === key && !showFavorites ? "rgba(196,114,84,0.53)" : SAND}`,
                  background: filterLieu === key && !showFavorites ? `rgba(200,85,61,0.08)` : "transparent",
                  color: filterLieu === key && !showFavorites ? CORAL : MUTED,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: filterLieu === key && !showFavorites ? 700 : 400,
                  transition: "all 0.2s",
                  letterSpacing: 0.3,
                }}
              >
                {label}
              </button>
            ))}
            {/* Séparateur visuel */}
            <div style={{ width: 1, height: 20, background: SAND, margin: "0 4px", flexShrink: 0 }} />
            {/* Favoris */}
            <button
              onClick={() => { setShowFavorites(f => !f); }}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                border: `1px solid ${showFavorites ? "#e8598a88" : SAND}`,
                background: showFavorites ? "rgba(232,89,138,0.08)" : "transparent",
                color: showFavorites ? "#e8598a" : MUTED,
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'Jost', sans-serif",
                fontWeight: showFavorites ? 700 : 400,
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 13 }}>{showFavorites ? "♥" : "♡"}</span>
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
            {showFavorites && favorites.size === 0 && (
              <span style={{ fontSize: 12, color: MUTED, fontFamily: "'Jost',sans-serif", fontStyle: "italic" }}>
                {t("addFav")}
              </span>
            )}
          </div>

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
              { key: 9, label: "9+ groupe" },
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

          {/* Météo live */}
          <WeatherStrip filterLieu={filterLieu} />

          {/* Grid */}
          {filtered.length === 0 ? (
            filterGuests > 8 ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px 0 56px" }}>
                <div style={{ maxWidth: 520, textAlign: "center", background: CREAM, border: `1px solid ${SAND}`, borderRadius: 14, padding: "28px 26px" }}>
                  <div style={{ fontSize: 30, marginBottom: 10 }}>👨‍👩‍👧‍👦</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 24, color: NAVY, marginBottom: 8, lineHeight: 1.2 }}>
                    Pour un groupe de 9 à 11 personnes
                  </div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: MUTED, marginBottom: 18, lineHeight: 1.55 }}>
                    Aucun logement seul n'accueille plus de 8 personnes. Réunissez votre groupe avec la <strong>Résidence Amaryllis</strong> — Zandoli + Géko + Mabouya, jusqu'à 11 personnes.
                  </div>
                  <button
                    onClick={() => { window.location.href = "/location-groupe-sainte-luce"; }}
                    style={{ background: CORAL, border: "none", color: "#fff", borderRadius: 8, padding: "12px 26px", fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
                  >
                    Voir l'offre groupée →
                  </button>
                </div>
              </div>
            ) : (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0 64px" }}>
              <StateTile
                variant="empty"
                eyebrow={t("noResultEyebrow") || "Aucune disponibilité"}
                title={t("noResultTitle") || "Aucun bien trouvé"}
                body={t("noResultBody") || "Ajustez vos filtres ou contactez-nous pour trouver la meilleure option."}
                action={t("noResultCta") || "Nous contacter"}
                onAction={() => window.location.href = "mailto:contact@villamaryllis.com"}
                style={{ maxWidth: 340 }}
              />
            </div>
            )
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24, paddingBottom: 48 }}>
              {filtered.map((b, i) => (
                <Reveal key={b.id} delay={Math.min(i * 0.08, 0.4)}>
                  <BienCard bien={b} onDetail={openDetail} onBook={openBien} onPrefetch={prefetchAvailability} isFavorite={favorites.has(b.id)} onToggleFavorite={toggleFavorite} isCompared={compareIds.has(b.id)} onToggleCompare={toggleCompare} compareDisabled={compareIds.size >= 3 && !compareIds.has(b.id)} geoBadge={
                    geo?.isIDF && b.id === "nogent" ? "📍 À 15 min de Paris" :
                    geo?.isCaribbean && b.id !== "nogent" ? "🌴 Proche de vous" :
                    null
                  } />
                </Reveal>
              ))}
            </div>
          )}

          {/* ── Reassurance block ── */}
          <div style={{ marginTop: 16, marginBottom: 64 }}>
            <Reveal anim="fadeUp" delay={0} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 14, padding: "28px 28px 24px", maxWidth: 560 }}>
              <Eyebrow style={{ marginBottom: 14 }}>{t("whyTitle")}</Eyebrow>
              {[
                ["🏷️", t("why1t"), t("why1d")],
                ["🎖️", t("why2t"), t("why2d")],
                ["⭐", t("why3t"), t("why3d")],
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

        </div>{/* /maxWidth container */}
      </div>{/* /properties section */}

      {/* ── TESTIMONIALS — fond crème, cards blanches ── */}
      <TestimonialsSection onDetail={openDetail} />

      {/* ── QUICK BOOK ── */}
      <QuickBook biens={biensList} onBook={openBien} />

      {/* ── OFFRE GROUPÉE RÉSIDENCE — pub-008 ── */}
      <div id="offre-groupee" style={{ background: IVORY, borderTop: `1px solid ${SAND}`, padding: "72px 28px", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow style={{ marginBottom: 12 }}>Vous êtes nombreux ?</Eyebrow>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: "clamp(26px, 3.5vw, 40px)", color: NAVY, margin: "0 0 14px", lineHeight: 1.15 }}>
            Réservez la résidence — jusqu'à 11 personnes
          </h2>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: MUTED, maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Zandoli, Géko et Mabouya sont dans la même résidence. Combinez-les pour réunir famille ou amis — chacun sa piscine ou son jacuzzi, dates et prix en direct.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
            {["zandoli", "geko", "mabouya"].map(id => (
              <img key={id} src={`/photos/${id}/01.webp`} alt={id} loading="lazy" style={{ width: 120, height: 84, objectFit: "cover", borderRadius: 10, border: `1px solid ${SAND}` }} />
            ))}
          </div>
          <a href="/location-groupe-sainte-luce" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 8, fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Composer mon séjour groupé →
          </a>
        </div>
      </div>

      {/* ── TRUST STRIP ── */}
      <div style={{ background: CREAM, borderBottom: `1px solid ${SAND}`, padding: "10px 28px", textAlign: "center" }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: MUTED, letterSpacing: "0.04em" }}>
          ✓ Paiement 100% sécurisé Stripe &nbsp;·&nbsp; ✓ Réservation directe − zéro frais Airbnb &nbsp;·&nbsp; ✓ Assistance 7j/7 par WhatsApp
        </span>
      </div>

      {/* ── CARTE ── */}
      <Reveal anim="fadeIn" threshold={0.05}>
        <MapSection biens={biensList} onDetail={openDetail} />
      </Reveal>

      {/* ── RÉCEMMENT CONSULTÉS ── */}
      {recentlyViewed.length > 0 && !detailBien && (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 0" }}>
          <Eyebrow color="muted" style={{ marginBottom: 16 }}>
            Récemment consultés
          </Eyebrow>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {recentlyViewed.map(id => {
              const b = biensList.find(x => x.id === id);
              if (!b) return null;
              return (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, background: IVORY, border: `1px solid ${SAND}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", transition: "box-shadow 0.15s" }}
                  onClick={() => openDetail(b)}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(14,59,58,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
                  <img loading="lazy" decoding="async" src={b.photos[0]} alt={b.nom} style={{ width: 48, height: 48, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
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
        <PropertyDetail bien={detailBien} onClose={() => openDetail(null)} onBook={openBien} blockedDates={blockedDates} loadingAvail={loadingAvail} initialCheckin={bookingInitialDates.checkin} initialCheckout={bookingInitialDates.checkout} />
      )}

      {/* ── BEDS24 MODAL (Nogent) ── */}
      {beds24Bien && (
        <Beds24Modal bien={beds24Bien} checkin={beds24Dates.checkin} checkout={beds24Dates.checkout} onClose={() => { setBeds24Bien(null); setBeds24Dates({ checkin: null, checkout: null }); }} />
      )}

      {/* ── BOOKING MODAL ── */}
      {selectedBien && (
        <BookingModal bien={selectedBien} blockedDates={blockedDates} loadingAvail={loadingAvail} onClose={() => { setSelectedBien(null); setBookingInitialDates({ checkin: null, checkout: null }); }} initialCheckin={bookingInitialDates.checkin} initialCheckout={bookingInitialDates.checkout} />
      )}

      {/* ── BIEN PICKER — sélection propriété depuis le hero ── */}
      {showBienPicker && !selectedBien && !detailBien && (
        <BienPickerModal
          biens={biensList}
          onSelect={b => { setShowBienPicker(false); openBien(b); }}
          onClose={() => setShowBienPicker(false)}
        />
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
                  <img loading="lazy" decoding="async" src={b.photos[0]} alt={b.nom} style={{ width:28, height:28, borderRadius:4, objectFit:"cover" }} />
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

      {/* ── REPRISE DE SESSION ── bouton sticky si session récente et aucun modal ouvert */}
      {sessionResume && !selectedBien && !detailBien && !beds24Bien && (() => {
        const b = BIENS.find(x => x.id === sessionResume.bienId);
        if (!b) return null;
        const { checkin, checkout } = sessionResume;
        const hasDate = checkin && checkout;
        const label = hasDate
          ? `↩ ${b.nom.split(" ").slice(-1)[0]} · ${formatDateShort(checkin)} → ${formatDateShort(checkout)}`
          : `↩ Reprendre — ${b.nom}`;
        return (
          <div style={{
            position: "fixed", bottom: showComparator ? 120 : 88, left: "50%",
            transform: "translateX(-50%)",
            zIndex: 940,
            display: "flex", alignItems: "center", gap: 10,
            background: NAVY,
            color: "#fff",
            borderRadius: 40,
            padding: "10px 18px 10px 16px",
            boxShadow: "0 8px 32px rgba(14,59,58,0.28)",
            cursor: "pointer",
            fontSize: 13, fontFamily: "'Jost', sans-serif", fontWeight: 500,
            whiteSpace: "nowrap",
            animation: "fadeUp 0.4s cubic-bezier(0.23,1,0.32,1)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
          }}>
            <div
              onClick={() => { openBien(b, checkin || null, checkout || null); }}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span style={{ fontSize: 16 }}>🏡</span>
              <span>{label}</span>
              <span style={{
                background: CORAL, color: "#fff", fontSize: 11, fontWeight: 700,
                padding: "2px 10px", borderRadius: 20, marginLeft: 4,
              }}>Réserver</span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); clearSession(); }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 0 0 4px", marginLeft: 2 }}
              title="Fermer"
            >×</button>
          </div>
        );
      })()}

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
