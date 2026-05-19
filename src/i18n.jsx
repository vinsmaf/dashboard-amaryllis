// i18n.jsx — Traductions FR / EN pour villamaryllis.com
import { createContext, useContext, useState, useEffect } from "react";

export const LANGS = ["fr", "en"];

export const TR = {
  fr: {
    // Header
    exploreLink:    "Explorer Martinique",
    mapLink:        "🗺️ Carte",
    contactUs:      "Nous contacter",

    // Filtres
    filterAll:      "Tous",
    filterFav:      "Favoris",
    filterGuests:   "👥 Voyageurs :",
    guestAll:       "Tous",
    addFav:         "Cliquez sur ♡ sur une villa pour l'ajouter",

    // Section villas
    sectionTitle:   "Villas & locations en Martinique",
    sectionSub:     "Toutes nos villas avec piscine à Sainte-Luce se réservent en direct, sans frais de service. Location vacances Martinique vue mer, jacuzzi privatif, piscine à débordement — réservez en direct et économisez jusqu'à 20% par rapport aux plateformes.",
    nResults:       (n) => `${n} villa${n !== 1 ? "s" : ""} disponible${n !== 1 ? "s" : ""}`,

    // Card villa
    guests:         "pers.",
    rooms:          "ch.",
    from:           "À partir de",
    perNight:       "/nuit",
    book:           "Réserver",
    seeDetail:      "Voir le détail",
    compare:        "Comparer",
    removeCompare:  "Retirer",
    maxCompare:     "Maximum 3 logements atteint",

    // Comparateur barre
    addMore:        (n) => `Ajoutez jusqu'à ${n} logement${n > 1 ? "s" : ""} de plus`,
    maxReached:     "✓ Maximum atteint — 3/3",
    compareBtn:     (n) => `Comparer ${n} logements →`,
    clearAll:       "Tout effacer",

    // Réassurance
    whyTitle:       "Pourquoi réserver en direct chez Amaryllis ?",
    why1t:          "Tarifs propriétaires",
    why1d:          "Jusqu'à −20% par rapport à Airbnb ou Booking.com — aucune commission plateforme.",
    why2t:          "Réponse en moins de 2h",
    why2d:          "Contact direct WhatsApp ou email — flexibilité sur les dates et services.",
    why3t:          "Séjour sur mesure",
    why3d:          "Ménage, transfert aéroport, panier d'accueil — on s'adapte à vos besoins.",
    why4t:          "Paiement 100% sécurisé",
    why4d:          "Stripe : données protégées, remboursement garanti en cas d'annulation.",
    reviewTitle:    "Des séjours plébiscités par nos voyageurs",
    reviewNote:     "Note moyenne · 117 avis vérifiés",
    reviewQuote:    "\"Vue extraordinaire, piscine à débordement parfaite. Un endroit hors du temps face aux Caraïbes. On reviendra sans hésiter !\"",
    reviewAuthor:   "— Sophie M. 🇫🇷, Villa Amaryllis · Avr. 2025",

    // Bannière booking direct
    banner1:        "✓ Réservation directe chez le propriétaire",
    banner2:        "✓ Sans frais de service Airbnb",
    banner3:        "✓ Paiement sécurisé Stripe",

    // Carte
    mapTitle:       "Où nous trouver",
    martinique:     "Martinique",
    idf:            "Île-de-France",

    // Footer / contact
    contactTitle:   "Contactez-nous",
    directBook:     "Réservation directe",
    noFees:         "Sans frais de service",

    // Météo
    weatherLabel:   "Sainte-Luce · maintenant",

    // Dark mode
    darkOn:         "Mode sombre",
    darkOff:        "Mode clair",

    // Search
    searchTitle:    "Rechercher par dates",
    checkin:        "Arrivée",
    checkout:       "Départ",
    searchBtn:      "Voir les disponibilités",
    nights:         (n) => `${n} nuit${n > 1 ? "s" : ""}`,
  },

  en: {
    // Header
    exploreLink:    "Explore Martinique",
    mapLink:        "🗺️ Map",
    contactUs:      "Contact us",

    // Filtres
    filterAll:      "All",
    filterFav:      "Favorites",
    filterGuests:   "👥 Guests:",
    guestAll:       "All",
    addFav:         "Click ♡ on a villa to save it",

    // Section villas
    sectionTitle:   "Villas & rentals in Martinique",
    sectionSub:     "All our pool villas in Sainte-Luce are booked directly, with no service fees. Sea-view vacation rentals, private jacuzzi, infinity pool — book direct and save up to 20% vs. platforms.",
    nResults:       (n) => `${n} villa${n !== 1 ? "s" : ""} available`,

    // Card villa
    guests:         "guests",
    rooms:          "bd.",
    from:           "From",
    perNight:       "/night",
    book:           "Book now",
    seeDetail:      "See details",
    compare:        "Compare",
    removeCompare:  "Remove",
    maxCompare:     "Maximum 3 properties reached",

    // Comparateur barre
    addMore:        (n) => `Add up to ${n} more propert${n > 1 ? "ies" : "y"}`,
    maxReached:     "✓ Maximum reached — 3/3",
    compareBtn:     (n) => `Compare ${n} properties →`,
    clearAll:       "Clear all",

    // Réassurance
    whyTitle:       "Why book directly with Amaryllis?",
    why1t:          "Owner rates",
    why1d:          "Up to −20% vs Airbnb or Booking.com — zero platform commission.",
    why2t:          "Reply within 2h",
    why2d:          "Direct WhatsApp or email contact — flexible dates and services.",
    why3t:          "Tailored stay",
    why3d:          "Cleaning, airport transfer, welcome basket — we adapt to your needs.",
    why4t:          "100% secure payment",
    why4d:          "Stripe: protected data, guaranteed refund if cancelled.",
    reviewTitle:    "Loved by our guests",
    reviewNote:     "Average rating · 117 verified reviews",
    reviewQuote:    "\"Extraordinary view, perfect infinity pool. A timeless place facing the Caribbean. We'll be back without hesitation!\"",
    reviewAuthor:   "— Sophie M. 🇫🇷, Villa Amaryllis · Apr. 2025",

    // Bannière
    banner1:        "✓ Book directly with the owner",
    banner2:        "✓ No Airbnb service fees",
    banner3:        "✓ Secure Stripe payment",

    // Carte
    mapTitle:       "Find us",
    martinique:     "Martinique",
    idf:            "Île-de-France",

    // Footer
    contactTitle:   "Contact us",
    directBook:     "Direct booking",
    noFees:         "No service fees",

    // Météo
    weatherLabel:   "Sainte-Luce · now",

    // Dark mode
    darkOn:         "Dark mode",
    darkOff:        "Light mode",

    // Search
    searchTitle:    "Search by dates",
    checkin:        "Check-in",
    checkout:       "Check-out",
    searchBtn:      "Check availability",
    nights:         (n) => `${n} night${n > 1 ? "s" : ""}`,
  },
};

/* ── Context ── */
const LangCtx = createContext({ lang: "fr", setLang: () => {}, t: k => TR.fr[k] });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem("amaryllis_lang");
      if (saved && LANGS.includes(saved)) return saved;
      // Détection navigateur
      const nav = navigator.language?.slice(0, 2).toLowerCase();
      return nav === "en" ? "en" : "fr";
    } catch { return "fr"; }
  });

  function setLang(l) {
    setLangState(l);
    try { localStorage.setItem("amaryllis_lang", l); } catch {}
  }

  // t(key, ...args) — args passés aux fonctions de traduction
  function t(key, ...args) {
    const val = TR[lang]?.[key] ?? TR.fr[key] ?? key;
    return typeof val === "function" ? val(...args) : val;
  }

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() { return useContext(LangCtx); }

/* ── Toggle button ── */
export function LangToggle({ style }) {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "fr" ? "en" : "fr")}
      title={lang === "fr" ? "Switch to English" : "Passer en français"}
      style={{
        background: "none", border: "1px solid rgba(250,245,233,0.25)",
        borderRadius: 6, cursor: "pointer",
        fontSize: 11, fontFamily: "'Jost',sans-serif", fontWeight: 600,
        color: "rgba(250,245,233,0.7)", padding: "3px 8px",
        letterSpacing: "0.06em", lineHeight: 1.4,
        transition: "all 0.2s", ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.6)"; e.currentTarget.style.color = "rgba(250,245,233,1)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.25)"; e.currentTarget.style.color = "rgba(250,245,233,0.7)"; }}
    >
      {lang === "fr" ? "EN" : "FR"}
    </button>
  );
}
