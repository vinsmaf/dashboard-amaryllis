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
    filterPrix:     "💶 Budget :",
    addFav:         "Cliquez sur ♡ sur une villa pour l'ajouter",

    // Section villas
    sectionTitle:   "Villas & locations en Martinique",
    sectionSub:     "Toutes nos villas avec piscine à Sainte-Luce se réservent en direct, sans frais de service. Location vacances Martinique vue mer, jacuzzi privatif, piscine à débordement — réservez en direct et économisez jusqu'à 15% par rapport aux plateformes.",
    nResults:       (n) => `${n} villa${n !== 1 ? "s" : ""} disponible${n !== 1 ? "s" : ""}`,

    // État vide — grille sans résultats
    noResultEyebrow: "Aucune disponibilité",
    noResultTitle:   "Aucun bien trouvé",
    noResultBody:    "Ajustez vos filtres ou contactez-nous — nous trouverons la meilleure option pour vous.",
    noResultCta:     "Nous contacter",

    // Card villa
    guests:         "pers.",
    rooms:          "ch.",
    from:           "À partir de",
    perNight:       "/nuit",
    book:           "Réserver",
    viewMore:       "Voir plus →",
    seeDetail:      "Voir le détail",
    longTermShort:  "Location longue durée",
    longTermOnly:   "Location longue durée uniquement",
    viewPhotosDetails: "Voir photos & détails →",
    contactLongStay:   "Contact long séjour →",
    directOwnerPay:    "Réservation directe propriétaire · Paiement sécurisé Stripe",
    compare:        "Comparer",
    removeCompare:  "Retirer",
    maxCompare:     "Maximum 3 logements atteint",

    // Comparateur barre
    addMore:        (n) => `Ajoutez jusqu'à ${n} logement${n > 1 ? "s" : ""} de plus`,
    maxReached:     "✓ Maximum atteint — 3/3",
    compareBtn:     (n) => `Comparer ${n} logements →`,
    clearAll:       "Tout effacer",

    // Réassurance — bandeau "Réservez en direct" (3 chiffres + comparatif)
    whyEyebrow:     "Sans intermédiaire",
    whyTitle:       "Réservez en direct",
    whyStat1n:      "0 €",
    whyStat1l:      "Frais de service",
    whyStat1d:      "Le prix affiché est le prix payé — aucune commission de plateforme.",
    whyStat2n:      "−15 %",
    whyStat2l:      "En réservation directe",
    whyStat2d:      "Nos tarifs directs sont en moyenne 15 % moins chers que sur les plateformes.",
    whyStat3n:      "24h/24",
    whyStat3l:      "Vos hôtes en direct",
    whyStat3d:      "WhatsApp, téléphone ou message — notre équipe répond avant, pendant et après votre séjour.",
    whyCta:         "Voir les logements",
    whySecure:      "🔒 Paiement sécurisé par Stripe",
    reviewTitle:    "Des séjours plébiscités par nos voyageurs",
    reviewNote:     "Note moyenne · 117 avis vérifiés",
    reviewQuote:    "\"Vue extraordinaire, piscine à débordement parfaite. Un endroit hors du temps face aux Caraïbes. On reviendra sans hésiter !\"",
    reviewAuthor:   "— Sophie M. 🇫🇷, Villa Amaryllis · Avr. 2025",

    // Avis
    reviewsLabel:   "avis",
    reviewsAirbnb:  "avis Airbnb",

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
    filterPrix:     "💶 Budget:",
    addFav:         "Click ♡ on a villa to save it",

    // Section villas
    sectionTitle:   "Villas & rentals in Martinique",
    sectionSub:     "All our pool villas in Sainte-Luce are booked directly, with no service fees. Sea-view vacation rentals, private jacuzzi, infinity pool — book direct and save up to 15% vs. platforms.",
    nResults:       (n) => `${n} villa${n !== 1 ? "s" : ""} available`,

    // Empty state — no results grid
    noResultEyebrow: "No availability",
    noResultTitle:   "No properties found",
    noResultBody:    "Adjust your filters or contact us — we'll find the best option for you.",
    noResultCta:     "Contact us",

    // Card villa
    guests:         "guests",
    rooms:          "bd.",
    from:           "From",
    perNight:       "/night",
    book:           "Book now",
    viewMore:       "View more →",
    seeDetail:      "See details",
    longTermShort:  "Long-term rental",
    longTermOnly:   "Long-term rental only",
    viewPhotosDetails: "View photos & details →",
    contactLongStay:   "Long-stay enquiry →",
    directOwnerPay:    "Direct owner booking · Secure Stripe payment",
    compare:        "Compare",
    removeCompare:  "Remove",
    maxCompare:     "Maximum 3 properties reached",

    // Comparateur barre
    addMore:        (n) => `Add up to ${n} more propert${n > 1 ? "ies" : "y"}`,
    maxReached:     "✓ Maximum reached — 3/3",
    compareBtn:     (n) => `Compare ${n} properties →`,
    clearAll:       "Clear all",

    // Réassurance — "Book directly" band (3 stats + comparison)
    whyEyebrow:     "No middleman",
    whyTitle:       "Book directly",
    whyStat1n:      "€0",
    whyStat1l:      "Service fees",
    whyStat1d:      "The price you see is the price you pay — no platform commission.",
    whyStat2n:      "−15%",
    whyStat2l:      "On direct booking",
    whyStat2d:      "Our direct rates run about 15% lower than on booking platforms.",
    whyStat3n:      "24/7",
    whyStat3l:      "Your hosts, direct",
    whyStat3d:      "WhatsApp, phone or message — our team answers before, during and after your stay.",
    whyCta:         "See the properties",
    whySecure:      "🔒 Secure payment via Stripe",
    reviewTitle:    "Loved by our guests",
    reviewNote:     "Average rating · 117 verified reviews",
    reviewQuote:    "\"Extraordinary view, perfect infinity pool. A timeless place facing the Caribbean. We'll be back without hesitation!\"",
    reviewAuthor:   "— Sophie M. 🇫🇷, Villa Amaryllis · Apr. 2025",

    // Avis
    reviewsLabel:   "reviews",
    reviewsAirbnb:  "Airbnb reviews",

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
      // Détection navigateur — fallback avant la réponse geo
      const nav = navigator.language?.slice(0, 2).toLowerCase();
      return nav === "en" ? "en" : "fr";
    } catch { return "fr"; }
  });

  // Détection géo via Cloudflare CF-IPCountry — seulement si l'user n'a pas de préférence sauvée
  useEffect(() => {
    try {
      if (localStorage.getItem("amaryllis_lang")) return; // préférence explicite → respecter
    } catch {}
    fetch("/api/geo")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.suggestedLang) return;
        setLangState(d.suggestedLang);
        // On ne sauvegarde PAS en localStorage — laisse la détection se refaire à chaque visite
      })
      .catch(() => {});
  }, []);

  function setLang(l) {
    setLangState(l);
    try { localStorage.setItem("amaryllis_lang", l); } catch {} // choix manuel → persisté
    // GA4 — track lang_switch (seulement si changement effectif)
    if (l !== lang && typeof window !== "undefined" && typeof window.gtag === "function") {
      try {
        window.gtag("event", "lang_switch", {
          from_lang: lang,
          target_lang: l,
          page_path: window.location.pathname,
        });
      } catch { /* silent */ }
    }
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
