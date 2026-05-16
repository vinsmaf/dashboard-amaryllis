import { useState, useEffect, useRef, useCallback } from "react";

// ── Brand palette (from logos.jsx) ──────────────────────────────
const WEEKLY_DISCOUNT = 0.05; // -5% à partir de 7 nuits

const MIN_NIGHTS = {
  amaryllis:  4,
  geko:       3,
  zandoli:    3,
  schoelcher: 3,
  mabouya:    2,
  nogent:     1,
  iguana:     0,
};

const FRAIS_MENAGE = {
  nogent:     45,
  amaryllis:  180,
  geko:       70,
  schoelcher: 70,
  zandoli:    70,
  mabouya:    50,
  iguana:     0,
};

// Biens désactivés à la réservation (ex: longue durée)
const BOOKING_DISABLED = new Set(["iguana"]);

const IVORY  = "#faf5e9";  // paper — main background
const CREAM  = "#f4ecdc";  // cream — card/modal background
const NAVY   = "#0e3b3a";  // ink — deep antillean teal, primary text & header
const CORAL  = "#c47254";  // muted coral — accent, CTAs
const SAND   = "#e0d4bc";  // borders, dividers (derived from cream)
const TEXT   = "#0e3b3a";  // same as ink for body text
const MUTED  = "#7a6b5a";  // warm brown for secondary text
const GOLD   = "#c9a673";  // sand/gold — star ratings, accents

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
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
    @keyframes slideInLeft  { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
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
    ::selection { background:rgba(196,114,84,0.2); color:#0e3b3a; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:#faf5e9; }
    ::-webkit-scrollbar-thumb { background:rgba(196,114,84,0.3); border-radius:2px; }
  `;
  document.head.appendChild(s);
}

const STRIPE_PK = "pk_test_51N1fVbAM2ySp09YCENcn4NcGi4xM7BzNCra9HU3ildZKLAHPzCOsY6ItlpxrttT1owXCUSKQrfPrIXsZSWPLrQsd00SDmMsWvX";

const AB = "https://a0.muscache.com/im/pictures/";

const BIENS = [
  {
    id: "amaryllis",
    nom: "Villa Amaryllis",
    airbnbTitle: "Villa Amaryllis - Luxe & sérénité Vue Mer, Piscine",
    lieu: "Sainte-Luce, Martinique",
    tag: "⭐ Coup de cœur Airbnb",
    desc: "Perchée sur les hauteurs de Sainte-Luce, bercée par les alizés, la Villa Amaryllis vous invite à un séjour d'exception. Piscine à débordement d'eau salée, jacuzzi privatif, terrasse 100m² face à la mer des Caraïbes et à l'île Sainte-Lucie. Les plages de sable blanc à 5 min.",
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
    amenities: ["Piscine débordement", "Jacuzzi privé", "Vue océan", "Wifi 127 Mb/s", "Parking", "Animaux OK"],
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
    desc: "Cocon tropical niché à Sainte-Luce avec 2 chambres dont une mezzanine au charme unique. Piscine privée, terrasse ensoleillée, vue mer. Netflix, Disney+, lave-linge inclus. Plages et distilleries à proximité.",
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
    amenities: ["Piscine privée", "Vue mer", "Jardin", "Netflix/Disney+", "Lave-linge", "Wifi 123 Mb/s"],
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
    desc: "Villa avec piscine d'eau salée et vue imprenable sur la baie et le rocher du Diamant. 2 chambres, terrasse panoramique. Wifi 126 Mb/s, parking inclus, animaux acceptés.",
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
    amenities: ["Piscine eau salée", "Vue Diamant", "Vue océan", "Wifi 126 Mb/s", "Parking", "Animaux OK"],
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
    desc: "Refuge paisible au sein de la résidence Amaryllis. Jardin tropical luxuriant, piscine rafraîchissante, brise des alizés. À 7 min des plages de sable blanc. Clim, TV, lave-linge inclus.",
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
    amenities: ["Piscine", "Jardin tropical", "Climatisation", "Lave-linge", "TV", "Wifi 128 Mb/s"],
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
    desc: "Havre de paix à flanc de colline avec jacuzzi privatif, jardin fleuri et vue mer enchanteresse. Idéal pour une escapade romantique ou ressourçante. Plages et distilleries à quelques minutes.",
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
    amenities: ["Jacuzzi privatif", "Vue mer", "Jardin fleuri", "Wifi 81 Mb/s", "Parking", "Animaux OK"],
    avis: [
      { nom: "Élise & Romain", pays: "🇫🇷", note: 5, texte: "Weekend romantique parfait ! Le jacuzzi privatif sous les étoiles avec vue mer est juste magique. Jardin fleuri superbe, endroit très paisible.", date: "Avr. 2025" },
      { nom: "Sarah W.", pays: "🇺🇸", note: 5, texte: "Hidden gem! The private jacuzzi with ocean views made every evening unforgettable. The flowering garden is gorgeous. Perfect romantic escape.", date: "Mars 2025" },
      { nom: "Jean-Paul M.", pays: "🇫🇷", note: 4, texte: "Très beau logement avec un jacuzzi privatif et une vue mer agréable. Jardin entretenu, hôte sympathique. Idéal pour un séjour en couple.", date: "Fév. 2025" },
    ],
  },
  {
    id: "schoelcher",
    nom: "T2 Schœlcher",
    airbnbTitle: "Appartement de standing calme, splendide vue mer",
    lieu: "Schœlcher, Martinique",
    tag: null,
    desc: "Appartement de standing calme avec splendide vue sur la baie, proche de Fort-de-France. Terrasse, parking, TV HD. Idéal pour découvrir le nord de la Martinique.",
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
    amenities: ["Vue baie", "Terrasse", "TV HD", "Wifi", "Parking", "Animaux OK"],
    avis: [
      { nom: "Isabelle T.", pays: "🇫🇷", note: 5, texte: "Appartement très bien situé avec une vue splendide sur la baie de Fort-de-France. Calme, propre, bien équipé. Idéal pour explorer le nord de la Martinique.", date: "Avr. 2025" },
      { nom: "Dirk H.", pays: "🇳🇱", note: 5, texte: "Amazing view over the bay! The apartment is quiet, clean and has everything you need. Great location to explore the north of Martinique. Highly recommended.", date: "Mars 2025" },
      { nom: "Monique R.", pays: "🇫🇷", note: 5, texte: "Logement de standing avec une vue exceptionnelle. Hôte très accueillant et réactif. La terrasse face à la baie est un vrai bonheur le matin.", date: "Fév. 2025" },
    ],
  },
  {
    id: "nogent",
    nom: "T2 Nogent-sur-Marne",
    airbnbTitle: "Appartement de standing avec jardin, proche Paris",
    lieu: "Nogent-sur-Marne, Île-de-France",
    tag: null,
    desc: "Bel appartement T2 lumineux avec jardin au bord de la Marne. Décoré avec soin, calme et verdure à 20 min de Paris par le RER A.",
    prix: 85,
    capacite: 3,
    chambres: 1,
    lits: 1,
    sdb: "1",
    rating: null,
    reviews: null,
    couleur: "#64748b",
    photos: [
      AB+"35de3bd4-d391-4b8b-9b8d-7b2d07fdb0b7.jpg",
    ],
    amenities: ["Bord Marne", "Jardin", "RER A (20 min Paris)", "Parking", "Wifi"],
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

  useEffect(() => {
    const t1 = setTimeout(() => setLifting(true), 1800);
    const t2 = setTimeout(() => onDone(), 2700);
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

function CalendarMonth({ year, month, checkin, checkout, hovered, blockedDates, onSelect, onHover, dailyPricesMap = {}, basePrice = 0, minNights = 1 }) {
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
          const disabled = blocked || past || belowMin || !ds;

          let bg = "transparent";
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
                if (!disabled && checkin && !checkout) onHover(ds);
                if (!disabled && ds) setHoveredCell(ds);
              }}
              onMouseLeave={() => setHoveredCell(null)}
              onClick={() => !disabled && onSelect(ds)}
              style={{
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                cursor: disabled ? "not-allowed" : "pointer",
                background: bg,
                color: blocked ? "#D4C8BC" : past ? "#D4C8BC" : belowMin ? "#D4C8BC" : color,
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
              {hoveredCell === ds && !disabled && ds && (() => {
                const p = dailyPricesMap[ds] ?? basePrice;
                if (!p) return null;
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
                  }}>{p}€/nuit</div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateRangePicker({ checkin, checkout, blockedDates = [], onChange, dailyPricesMap = {}, basePrice = 0, minNights = 1 }) {
  const todayStr = today();
  const initY = new Date().getFullYear();
  const initM = new Date().getMonth();
  const [offset, setOffset] = useState(0);
  const [hovered, setHovered] = useState(null);

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
        <button onClick={() => setOffset(o => o + 1)} style={iconBtn}>›</button>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <CalendarMonth year={y1} month={m1} checkin={checkin} checkout={checkout} hovered={hovered} blockedDates={blockedDates} onSelect={handleSelect} onHover={setHovered} dailyPricesMap={dailyPricesMap} basePrice={basePrice} minNights={minNights} />
        <CalendarMonth year={y2} month={m2} checkin={checkin} checkout={checkout} hovered={hovered} blockedDates={blockedDates} onSelect={handleSelect} onHover={setHovered} dailyPricesMap={dailyPricesMap} basePrice={basePrice} minNights={minNights} />
      </div>
      {checkin && checkout && (
        <div style={{ marginTop: 12, textAlign: "right" }}>
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

// ── Booking Modal ────────────────────────────────────────────────
function BookingModal({ bien, blockedDates, loadingAvail, onClose }) {
  const [step, setStep] = useState(1);
  const [checkin, setCheckin] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", tel: "", message: "" });
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const elRef = useRef(null);

  const nights = checkin && checkout ? dateDiff(checkin, checkout) : 0;

  const dailyPricesMap = (() => {
    try { return JSON.parse(localStorage.getItem("amaryllis_daily_prices") || "{}")[bien.id] || {}; } catch { return {}; }
  })();

  // Total basé sur les prix journaliers réels, avec remise semaine -5%
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
  const hasWeeklyDiscount = nights >= 7;
  const discountAmount = hasWeeklyDiscount ? Math.round(rawTotal * WEEKLY_DISCOUNT) : 0;
  const fraisMenage = FRAIS_MENAGE[bien.id] ?? 0;
  const total = rawTotal - discountAmount + fraisMenage;
  const minNights = MIN_NIGHTS[bien.id] ?? 1;
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

  async function goToPayment() {
    setPaying(true); setPayError("");
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total * 100, currency: "eur", metadata: { bienId: bien.id, checkin, checkout, voyageur: `${form.prenom} ${form.nom}` } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const el = stripe.elements({ clientSecret: data.clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } } });
      const pe = el.create("payment");
      setElements(el);
      setStep(3);
      setTimeout(() => pe.mount("#spe"), 100);
    } catch (e) { setPayError(e.message); }
    setPaying(false);
  }

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true); setPayError("");
    const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: window.location.origin + "/merci" } });
    if (error) setPayError(error.message);
    setPaying(false);
  }

  const steps = ["Dates", "Coordonnées", "Paiement"];

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
        maxHeight: "92vh", overflowY: "auto",
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
            <DateRangePicker checkin={checkin} checkout={checkout} blockedDates={blockedDates} onChange={(ci, co) => { setCheckin(ci); setCheckout(co); }} dailyPricesMap={dailyPricesMap} basePrice={bien.prix} minNights={minNights} />

            {nights > 0 ? (
              <div style={{
                marginTop: 24,
                background: belowMin ? "rgba(239,68,68,0.04)" : "rgba(200,85,61,0.04)",
                border: `1px solid ${belowMin ? "rgba(239,68,68,0.25)" : SAND}`,
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
              }}>
                <div>
                  <div style={{ color: MUTED, fontSize: 13 }}>{formatDateLong(checkin)} → {formatDateLong(checkout)}</div>
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
                      {hasWeeklyDiscount && (
                        <div style={{ fontSize: 13, color: CORAL, marginTop: 2, fontWeight: 600 }}>
                          🎁 Réduction semaine −{discountAmount}€ ({Math.round(WEEKLY_DISCOUNT * 100)}%)
                        </div>
                      )}
                      <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginTop: 6 }}>{total}€</div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => !belowMin && setStep(2)}
                  style={{
                    ...btnPrimary,
                    background: belowMin ? SAND : CORAL,
                    color: belowMin ? MUTED : "#fff",
                    cursor: belowMin ? "not-allowed" : "pointer",
                    opacity: belowMin ? 0.6 : 1,
                  }}
                >
                  Continuer →
                </button>
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
              <span>{formatDateLong(checkin)} → {formatDateLong(checkout)}</span>
              <span style={{ fontWeight: 700, color: NAVY }}>
                {nights} nuits · {total}€
                {hasWeeklyDiscount && <span style={{ fontSize: 11, color: CORAL, marginLeft: 6 }}>−{Math.round(WEEKLY_DISCOUNT * 100)}% semaine</span>}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FormField label="Prénom *" value={form.prenom} onChange={v => setForm(f => ({ ...f, prenom: v }))} />
              <FormField label="Nom *" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} />
              <FormField label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" style={{ gridColumn: "1/-1" }} />
              <FormField label="Téléphone" value={form.tel} onChange={v => setForm(f => ({ ...f, tel: v }))} type="tel" style={{ gridColumn: "1/-1" }} />
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
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", multiline, style }) {
  const [focused, setFocused] = useState(false);
  const s = {
    background: IVORY,
    border: `1px solid ${focused ? CORAL + "88" : SAND}`,
    borderRadius: 10,
    color: TEXT,
    padding: "11px 14px",
    width: "100%",
    fontSize: 14,
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
        : <input type={type} style={s} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />}
    </div>
  );
}

// ── Property Card ────────────────────────────────────────────────
function BienCard({ bien, onDetail, onBook }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const photos = bien.photos || [];
  const currentPhoto = photos[photoIdx] || "";

  function prev(e) { e.stopPropagation(); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); }
  function next(e) { e.stopPropagation(); setPhotoIdx(i => (i + 1) % photos.length); }

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
      {/* Photo section */}
      <div style={{ position: "relative", height: 260, overflow: "hidden", background: "#0e2020" }}>

        {currentPhoto ? (
          <img
            key={photoIdx}
            src={currentPhoto}
            alt={bien.nom}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              display: "block",
              transition: "opacity 0.3s",
            }}
          />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🏡</div>
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
            <button onClick={prev} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "none", color: NAVY, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4, lineHeight: 1 }}>←</button>
            <button onClick={next} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "none", color: NAVY, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4, lineHeight: 1 }}>→</button>
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
            {bien.tag}
          </div>
        )}

        {/* Price badge */}
        <div style={{
          position: "absolute", bottom: 14, right: 14, zIndex: 2,
          background: "rgba(14,59,58,0.85)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "8px 14px", textAlign: "right",
        }}>
          <div style={{ fontSize: 11, color: "rgba(250,247,242,0.5)", marginBottom: 1, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.05em" }}>À partir de</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{bien.prix}€</div>
          <div style={{ fontSize: 11, color: "rgba(250,247,242,0.6)" }}>/ nuit</div>
        </div>
      </div>

      {/* Info section */}
      <div style={{ padding: "20px 22px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Location */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: CORAL, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
          {bien.lieu}
        </div>

        {/* Name */}
        <div style={{ fontWeight: 800, fontSize: 21, color: NAVY, marginBottom: 10 }}>{bien.nom}</div>

        {/* Rating row */}
        {bien.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: MUTED }}>
            <span style={{ color: GOLD }}>★ {bien.rating}</span>
            <span>·</span>
            {bien.reviews && <span>{bien.reviews} avis</span>}
            <span>·</span>
            <span>{bien.capacite} pers.</span>
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
        }}>{bien.desc}</p>

        {/* Amenities */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {bien.amenities.map(a => (
            <span key={a} style={{
              background: CREAM,
              border: `1px solid ${SAND}`,
              borderRadius: 5, fontSize: 11, color: MUTED, padding: "3px 8px",
            }}>{a}</span>
          ))}
        </div>

        {/* CTA row */}
        <div style={{ display: "flex", gap: 8 }}>
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
            Voir plus →
          </button>
          {BOOKING_DISABLED.has(bien.id) ? (
            <div style={{
              flex: 2, background: "rgba(14,59,58,0.06)", border: `1px solid ${SAND}`,
              color: MUTED, borderRadius: 6, padding: "11px 20px",
              fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11,
              letterSpacing: "0.06em", textAlign: "center", textTransform: "uppercase",
            }}>
              Location longue durée
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onBook(bien); }}
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
              Réserver
            </button>
          )}
        </div>
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
function PropertyDetail({ bien, onClose, onBook }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = bien.photos || [];

  const goPrev = () => setPhotoIdx(i => (i - 1 + photos.length) % photos.length);
  const goNext = () => setPhotoIdx(i => (i + 1) % photos.length);

  // Clavier : Échap ferme la fiche, ← → naviguent
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, photos.length]);

  // Auto-avance 5 s — reset à chaque changement de photo
  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(goNext, 5000);
    return () => clearInterval(t);
  }, [photoIdx, photos.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      background: IVORY,
      display: "flex", flexDirection: "column",
      animation: "bloomIn 0.3s cubic-bezier(0.23,1,0.32,1) both",
    }}>
      {/* Top bar */}
      <div style={{
        height: 56, background: NAVY, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", gap: 16,
      }}>
        <button
          onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "rgba(250,245,233,0.7)", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, letterSpacing: "0.1em", padding: 0 }}
        >
          ← Retour
        </button>
        <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 13, letterSpacing: "0.45em", color: "#faf5e9", textTransform: "uppercase", flex: 1, textAlign: "center" }}>
          {bien.nom}
        </div>
        <button
          onClick={() => onBook(bien)}
          style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 5, padding: "9px 22px", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12, letterSpacing: "0.12em", cursor: "pointer", textTransform: "uppercase", flexShrink: 0 }}
        >
          À partir de {bien.prix}€/nuit
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", minHeight: 0 }}>

        {/* ─── LEFT: photo gallery ─── */}
        <div style={{ flex: "0 0 58%", display: "flex", flexDirection: "column", background: "#061616", minHeight: 0, position: "relative" }}>
          {/* Main image — contain centré, s'adapte à la fenêtre */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
            {photos[photoIdx] && (
              <img
                key={photoIdx}
                src={photos[photoIdx]}
                alt={bien.nom}
                style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", display: "block", transition: "opacity 0.3s", objectFit: "contain" }}
              />
            )}
            {/* Compteur */}
            <div style={{ position: "absolute", bottom: 14, right: 16, background: "rgba(14,59,58,0.65)", color: "#faf5e9", fontSize: 11, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 20, zIndex: 2 }}>
              {photoIdx + 1} / {photos.length}
            </div>
          </div>
          {/* Flèches — conteneur pleine largeur, un bouton à chaque bout */}
          {photos.length > 1 && (
            <div style={{
              position: "absolute", left: 0, right: 0,
              top: "50%", transform: "translateY(-50%)",
              display: "flex", justifyContent: "space-between",
              padding: "0 16px", zIndex: 10, pointerEvents: "none",
            }}>
              {[["←", goPrev], ["→", goNext]].map(([label, fn]) => (
                <button key={label} onClick={fn} style={{
                  pointerEvents: "auto",
                  background: "rgba(250,245,233,0.18)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(250,245,233,0.35)", color: "#faf5e9",
                  width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
                  fontSize: 20, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  lineHeight: 1, flexShrink: 0,
                }}>{label}</button>
              ))}
            </div>
          )}
          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div style={{ height: 76, display: "flex", gap: 2, padding: "2px", flexShrink: 0, overflowX: "auto" }}>
              {photos.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setPhotoIdx(i)}
                  style={{ flex: "0 0 auto", width: 110, cursor: "pointer", overflow: "hidden", opacity: i === photoIdx ? 1 : 0.45, transition: "opacity 0.2s", outline: i === photoIdx ? `2px solid ${CORAL}` : "none", outlineOffset: -2 }}
                >
                  <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── RIGHT: info panel ─── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "36px 40px 48px" }}>

          {/* Location */}
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>
            {bien.lieu}
          </div>

          {/* Property name */}
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 38, letterSpacing: "0.1em", textTransform: "uppercase", color: NAVY, margin: "0 0 14px", lineHeight: 1.1 }}>
            {bien.nom}
          </h2>

          {/* Rating + stats */}
          {bien.rating && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", color: MUTED, fontSize: 13, marginBottom: 22 }}>
              <span style={{ color: GOLD }}>★ {bien.rating}</span>
              {bien.reviews && <span>· {bien.reviews} avis</span>}
              <span>· {bien.capacite} voyageurs</span>
              <span>· {bien.chambres} chambre{bien.chambres > 1 ? "s" : ""}</span>
              <span>· {bien.sdb} sdb</span>
            </div>
          )}

          <div style={{ height: 1, background: SAND, marginBottom: 26 }} />

          {/* Description */}
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, lineHeight: 1.8, color: TEXT, margin: "0 0 32px" }}>
            {bien.desc}
          </p>

          {/* Amenities */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 14 }}>Équipements</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {bien.amenities.map(a => (
                <span key={a} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 4, fontSize: 12, color: TEXT, padding: "6px 14px", fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>{a}</span>
              ))}
            </div>
          </div>

          {/* Reviews */}
          {bien.avis && bien.avis.length > 0 && (
            <>
              <div style={{ height: 1, background: SAND, marginBottom: 26 }} />
              <div style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginBottom: 20 }}>Avis voyageurs</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {bien.avis.map((av, i) => (
                  <div key={i} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "18px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: NAVY, fontSize: 13 }}>{av.nom}</span>
                        <span style={{ color: MUTED, fontSize: 12, marginLeft: 7 }}>{av.pays}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ color: GOLD, fontSize: 11 }}>{"★".repeat(av.note)}</span>
                        <span style={{ color: MUTED, fontSize: 11, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>{av.date}</span>
                      </div>
                    </div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 16, lineHeight: 1.7, color: TEXT, margin: 0 }}>{av.texte}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Bottom CTA */}
          <div style={{ height: 1, background: SAND, margin: "36px 0 28px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: MUTED, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>À partir de</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 36, color: NAVY, lineHeight: 1 }}>
                  {bien.prix}€<span style={{ fontSize: 14, fontWeight: 300, color: MUTED, marginLeft: 6 }}>/ nuit</span>
                </div>
              </div>
              {bien.rating && (
                <div style={{ color: MUTED, fontSize: 12, marginTop: 4, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>★ {bien.rating} · {bien.reviews} avis Airbnb</div>
              )}
            </div>
            <button
              onClick={() => onBook(bien)}
              style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 6, padding: "16px 40px", fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 13, letterSpacing: "0.12em", cursor: "pointer", textTransform: "uppercase" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              Réserver →
            </button>
          </div>
        </div>
      </div>
    </div>
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
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: NAVY, fontWeight: 600 }}>
            À partir de {selected?.prix}€<span style={{ fontWeight: 300, color: MUTED, fontSize: 11 }}> / nuit</span>
          </span>
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
const CAROUSEL_DELAY = 6000;

function HeroCarousel({ biens, onDetail, onBook }) {
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
    <div style={{ position: "relative", height: "calc(100vh - 62px)", minHeight: 520, overflow: "hidden", background: "#072626" }}>
      {/* Animated shader wallpaper */}
      <ShaderBg />

      {/* Property photo — right half, masked to fade into shader */}
      {photo && (
        <img
          key={`photo-${animKey}`}
          src={photo}
          alt={bien.nom}
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
        <h1 style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 200,
          fontSize: "clamp(28px, 4vw, 60px)", letterSpacing: "0.08em",
          textTransform: "uppercase", color: "#faf5e9",
          margin: "0 0 10px", lineHeight: 1.05,
        }}>
          {bien.nom}
        </h1>
        {bien.rating && (
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: "rgba(250,245,233,0.55)", marginBottom: 14, letterSpacing: "0.05em" }}>
            <span style={{ color: GOLD }}>★ {bien.rating}</span>
            {bien.reviews ? ` · ${bien.reviews} avis` : ""}
            {` · ${bien.capacite} voyageurs`}
          </div>
        )}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
          fontSize: 16, color: "rgba(250,245,233,0.65)", lineHeight: 1.65,
          margin: "0 0 22px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {bien.desc}
        </p>
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
              Réserver — {bien.prix}€ / nuit
            </button>
          ) : (
            <div style={{ background: "rgba(250,245,233,0.08)", border: "1px solid rgba(250,245,233,0.2)", borderRadius: 8, padding: "14px 24px", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, letterSpacing: "0.12em", color: "rgba(250,245,233,0.5)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Location longue durée
            </div>
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
            Voir photos &amp; détails →
          </button>
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
        {(bien.amenities || []).slice(0, 5).map((a, i) => (
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
            onClick={() => goTo((idx - 1 + BIENS.length) % BIENS.length)}
            style={{ background: "rgba(250,245,233,0.08)", border: "1px solid rgba(250,245,233,0.18)", color: "#faf5e9", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", transition: "background 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(250,245,233,0.16)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(250,245,233,0.08)"; }}
          >‹</button>
          <button
            onClick={() => goTo((idx + 1) % BIENS.length)}
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

// ── Contact Section ──────────────────────────────────────────────
const WA_NUMBER = "33610880772";
const EMAIL = "vinsmaf@hotmail.com";

function FooterSection() {
  const [form, setForm] = useState({ nom: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const subject = encodeURIComponent(`Contact Amaryllis — ${form.nom}`);
    const body = encodeURIComponent(`Bonjour,\n\n${form.message}\n\n—\n${form.nom}\n${form.email}`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
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
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.15em", textTransform: "uppercase", color: "#faf5e9", marginBottom: 10 }}>Message préparé</div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 15, color: "rgba(250,245,233,0.5)", lineHeight: 1.6, margin: "0 0 24px" }}>
                Votre client mail s'est ouvert avec le message.
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
                <ContactField label="Votre nom" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} required dark />
                <ContactField label="Votre email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required dark />
              </div>
              <ContactField label="Votre message" value={form.message} onChange={v => setForm(f => ({ ...f, message: v }))} multiline required style={{ marginBottom: 22 }} dark />
              <button type="submit"
                style={{ width: "100%", background: CORAL, color: "#fff", border: "none", borderRadius: 6, padding: "13px 24px", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, letterSpacing: "0.15em", cursor: "pointer", textTransform: "uppercase", transition: "opacity 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >Envoyer le message →</button>
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
          <span style={{ fontSize: 11, color: "rgba(250,245,233,0.22)", fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>🔒 Paiement sécurisé Stripe</span>
          <a href="/admin" style={{ fontSize: 10, color: "rgba(250,245,233,0.15)", textDecoration: "none", letterSpacing: "0.1em", fontFamily: "'Jost', sans-serif" }}>Admin</a>
        </div>
      </div>
    </footer>
  );
}

function ContactField({ label, value, onChange, type = "text", multiline, required, style, dark }) {
  const [focused, setFocused] = useState(false);
  const s = dark ? {
    background: "rgba(250,245,233,0.06)",
    border: `1px solid ${focused ? "rgba(196,114,84,0.5)" : "rgba(250,245,233,0.12)"}`,
    borderRadius: 8, color: "#faf5e9", padding: "11px 14px", width: "100%",
    fontSize: 13, outline: "none", fontFamily: "'Jost', sans-serif", fontWeight: 300,
    resize: "vertical", transition: "border-color 0.2s", boxSizing: "border-box",
  } : {
    background: CREAM,
    border: `1px solid ${focused ? NAVY + "60" : SAND}`,
    borderRadius: 8, color: TEXT, padding: "11px 14px", width: "100%",
    fontSize: 13, outline: "none", fontFamily: "'Jost', sans-serif", fontWeight: 300,
    resize: "vertical", transition: "border-color 0.2s", boxSizing: "border-box",
  };
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 10, color: dark ? "rgba(250,245,233,0.4)" : MUTED, marginBottom: 6, fontFamily: "'Jost', sans-serif", fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</label>
      {multiline
        ? <textarea rows={4} style={s} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} required={required} />
        : <input type={type} style={s} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} required={required} />}
    </div>
  );
}

// ── Thank you page ───────────────────────────────────────────────
function MerciPage() {
  return (
    <div style={{ minHeight: "100vh", background: IVORY, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, textAlign: "center", padding: 32 }}>
      <div>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `rgba(200,85,61,0.1)`, border: `2px solid ${CORAL}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 28px" }}>✓</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12, color: NAVY }}>Réservation confirmée !</h1>
        <p style={{ color: MUTED, fontSize: 16, maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Merci pour votre réservation. Un email de confirmation vous sera envoyé dans quelques minutes.
        </p>
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
    { label: "Accueil", href: "#top" },
    { label: "Nos propriétés", href: "#properties" },
    { label: "Contact", href: "#contact" },
    { label: "Réservations", href: "#properties" },
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
function HoverContact({ light = false, direction = "up" }) {
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
      <span style={{
        fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300,
        color: baseColor, cursor: "default",
        borderBottom: `1px dotted ${dotColor}`,
        letterSpacing: "0.05em",
        paddingBottom: 1,
      }}>
        Contact
      </span>

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

// ── Main ─────────────────────────────────────────────────────────
export default function PublicSite() {
  const [selectedBien, setSelectedBien] = useState(null);
  const [detailBien, setDetailBien] = useState(null);
  const [filterLieu, setFilterLieu] = useState("all");
  const [scrolled, setScrolled] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [priceOverrides, setPriceOverrides] = useState(loadPriceOverrides);
  const [curtainDone, setCurtainDone] = useState(false);

  // Listen for admin price updates in same tab
  useEffect(() => {
    const fn = () => setPriceOverrides(loadPriceOverrides());
    window.addEventListener("amaryllis_prices_updated", fn);
    return () => window.removeEventListener("amaryllis_prices_updated", fn);
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Biens with live price overrides from admin
  const biensList = BIENS.map(b => ({ ...b, prix: priceOverrides[b.id] ?? b.prix }));

  async function openBien(bien) {
    if (BOOKING_DISABLED.has(bien.id)) return; // longue durée — réservation désactivée
    setDetailBien(null);
    setSelectedBien(bien);
    setBlockedDates([]);
    setLoadingAvail(true);
    try {
      // Pass Booking.com iCal URL from admin localStorage so the server can fetch it
      // (admin and public site share the same domain → same localStorage)
      let apiUrl = `/api/get-availability?bienId=${bien.id}`;
      try {
        const bookingUrls = JSON.parse(localStorage.getItem("ical_urls_booking") || "{}");
        if (bookingUrls[bien.id]) {
          apiUrl += `&bookingUrl=${encodeURIComponent(bookingUrls[bien.id])}`;
        }
      } catch {}
      const r = await fetch(apiUrl);
      if (r.ok) {
        const d = await r.json();
        setBlockedDates(d.blockedDates || []);
      }
    } catch (_) {}
    setLoadingAvail(false);
  }

  const path = window.location.pathname;
  if (path === "/merci") return <MerciPage />;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const lieux = [
    { key: "all", label: "Tous" },
    { key: "Martinique", label: "Martinique" },
    { key: "Île-de-France", label: "Île-de-France" },
  ];

  const filtered = filterLieu === "all" ? biensList : biensList.filter(b => b.lieu.includes(filterLieu));

  return (
    <div id="top" style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, -apple-system, sans-serif" }}>
      {!curtainDone && <Curtain onDone={() => setCurtainDone(true)} />}

      {/* ── NAVIGATION ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{
          height: 62, background: NAVY,
          padding: "0 28px",
          display: "flex", alignItems: "center",
          borderBottom: "1px solid rgba(250,245,233,0.07)",
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 20 }}>
            {/* Logo menu */}
            <LogoDropdown />

            {/* Separator */}
            <div style={{ width: 1, height: 20, background: "rgba(250,245,233,0.12)", flexShrink: 0 }} />

            {/* Property selector — fills center */}
            <div style={{ flex: 1 }}>
              <PropertyDropdown onSelect={setDetailBien} />
            </div>

            {/* Right: contact + admin */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
              <HoverContact direction="down" />
              <div style={{ width: 1, height: 16, background: "rgba(250,245,233,0.1)" }} />
              <a href="/admin" style={{ fontSize: 10, color: "rgba(250,247,242,0.25)", textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Jost', sans-serif" }}>Admin</a>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO CAROUSEL ── */}
      <HeroCarousel biens={biensList} onDetail={setDetailBien} onBook={openBien} />

      {/* ── QUICK BOOK ── */}
      <QuickBook biens={biensList} onBook={openBien} />

      {/* ── PROPERTIES SECTION ── */}
      <div id="properties" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px", background: IVORY }}>

        {/* Section header + filters */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: 32, fontWeight: 200, letterSpacing: "0.15em", textTransform: "uppercase", color: NAVY, margin: "0 0 24px" }}>Nos propriétés</h2>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {lieux.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterLieu(key)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 20,
                  border: `1px solid ${filterLieu === key ? CORAL + "88" : SAND}`,
                  background: filterLieu === key ? `rgba(200,85,61,0.08)` : "transparent",
                  color: filterLieu === key ? CORAL : MUTED,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: filterLieu === key ? 700 : 400,
                  transition: "all 0.2s",
                  letterSpacing: 0.5,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: SAND }} />
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24 }}>
          {filtered.map(b => (
            <BienCard key={b.id} bien={b} onDetail={setDetailBien} onBook={openBien} />
          ))}
        </div>
      </div>

      {/* ── FOOTER + CONTACT ── */}
      <FooterSection />

      {/* ── PROPERTY DETAIL ── */}
      {detailBien && !selectedBien && (
        <PropertyDetail bien={detailBien} onClose={() => setDetailBien(null)} onBook={openBien} />
      )}

      {/* ── BOOKING MODAL ── */}
      {selectedBien && (
        <BookingModal bien={selectedBien} blockedDates={blockedDates} loadingAvail={loadingAvail} onClose={() => setSelectedBien(null)} />
      )}

      {/* Sticky mobile CTA */}
      {isMobile && !selectedBien && !detailBien && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
          background: NAVY, borderTop: "1px solid rgba(250,245,233,0.1)",
          padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, color: "rgba(250,245,233,0.45)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Villa Amaryllis</div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14, color: "#faf5e9" }}>
              À partir de {biensList.find(b => b.id === "amaryllis")?.prix ?? 280}€<span style={{ fontWeight: 300, fontSize: 11, color: "rgba(250,245,233,0.5)" }}> / nuit</span>
            </div>
          </div>
          <button
            onClick={() => openBien(biensList.find(b => b.id === "amaryllis") || biensList[0])}
            style={{
              background: CORAL, border: "none", color: "#fff",
              borderRadius: 8, padding: "12px 24px",
              fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12,
              letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >Réserver →</button>
        </div>
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
