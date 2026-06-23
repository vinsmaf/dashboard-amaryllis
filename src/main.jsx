import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react"
import './index.css'
import './tokens.css'
import { LangProvider } from './i18n.jsx'
import { GUIDES_POI_SLUGS } from './data/guidesPoiSlugs.js'
import { installBugCapture } from './lib/bugCapture.js'
import { initMetaPixelIfConsented } from './lib/metaPixel.js'
import { captureAttribution } from './lib/trackingAttribution.js'

// Tag de build (force un nouveau hash de bundle quand nécessaire — survit à la minification)
if (typeof window !== "undefined") window.__BUILD__ = "meta-pixel-2026-06-03";

// Auto-récupération des "chunks périmés" : après un déploiement, l'ancien index.html
// (en cache navigateur) référence des bundles dont le hash n'est plus servi → l'import
// dynamique échoue ("Failed to fetch dynamically imported module") = page blanche.
// On recharge la page une fois pour récupérer la version fraîche. Garde anti-boucle :
// au plus 1 reload / 30 s (si ça échoue encore, c'est un vrai problème réseau, on laisse).
if (typeof window !== "undefined") {
  const RELOAD_TS_KEY = "amaryllis_chunk_reload_ts";
  const recoverFromStaleChunk = (ev) => {
    let last = 0;
    try { last = Number(sessionStorage.getItem(RELOAD_TS_KEY)) || 0; } catch {}
    if (Date.now() - last < 30000) return; // déjà tenté très récemment → on évite la boucle
    try { sessionStorage.setItem(RELOAD_TS_KEY, String(Date.now())); } catch {}
    if (ev && typeof ev.preventDefault === "function") ev.preventDefault();
    window.location.reload();
  };
  // Événement officiel de Vite quand un preload de module échoue.
  window.addEventListener("vite:preloadError", recoverFromStaleChunk);
  // Filet : certains échecs de chunk remontent en promesse rejetée sans passer par l'event Vite.
  // Regex étendue : couvre aussi les cas Safari (MIME type) et Cloudflare SPA fallback (HTML servi à la place du JS).
  const STALE_CHUNK_PATTERNS = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|is not a valid JavaScript MIME type|'text\/html' is not a valid|expected a JavaScript module|Failed to load resource|Loading chunk \d+ failed|ChunkLoadError/i;
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e && e.reason && e.reason.message) || (e && e.reason) || "");
    if (STALE_CHUNK_PATTERNS.test(msg)) {
      recoverFromStaleChunk();
    }
  });
  // Filet console.error : Safari peut logger l'erreur sans rejeter de promesse.
  const _origError = console.error;
  console.error = function (...args) {
    try {
      const msg = args.map(a => (a && a.message) ? a.message : (typeof a === "string" ? a : "")).join(" ");
      if (STALE_CHUNK_PATTERNS.test(msg)) {
        recoverFromStaleChunk();
      }
    } catch { /* noop */ }
    return _origError.apply(console, args);
  };
}

// Capteur de bugs auto-hébergé (→ /api/client-errors → onglet 🐞 Bugs).
// Installé tôt pour attraper aussi les erreurs de boot. Indépendant de Sentry.
installBugCapture()
captureAttribution() // Capture fbclid/gclid/UTM dès l'arrivée → injectés dans metadata Stripe

// Meta Pixel — chargé seulement si le consentement RGPD a déjà été accordé (sinon attend le bandeau).
initMetaPixelIfConsented()

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  environment: import.meta.env.MODE,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1,
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection",
    // Stale chunks post-déploiement — auto-récupérés par onError (reload page).
    // Ces erreurs sont transitoires (~30s après un deploy) et ne nécessitent pas d'alerte.
    /Failed to fetch dynamically imported module/,
    /error loading dynamically imported module/,
    /ChunkLoadError/,
    /Loading chunk \d+ failed/,
    // Bugs du navigateur in-app Facebook/Instagram (Android)
    "Java object is gone",
    "Error invoking postMessage",
    "navigation_performance_logger",
    // Navigateur in-app Facebook/iOS — script injecté par Meta qui tente d'appeler
    // le bridge iOS WKWebView (window.webkit.messageHandlers) non disponible dans ce contexte.
    // Ce n'est pas du code Amaryllis — faux positif 100% lié au navigateur Facebook sur iPhone.
    /window\.webkit\.messageHandlers/,
    /undefined is not an object.*webkit\.messageHandlers/,
    /sendDataToNative/,
  ],
})

// Code splitting — chaque composant est chargé uniquement si la route correspond
const App        = lazy(() => import('./App.jsx'))
const PublicSite = lazy(() => import('./PublicSite.jsx'))
const Landing    = lazy(() => import('./Landing.jsx'))
const Guide      = lazy(() => import('./Guide.jsx'))
const GuideDiamant   = lazy(() => import('./GuideDiamant.jsx'))
const GuideSainteAnne = lazy(() => import('./GuideSainteAnne.jsx'))
const GuideEn        = lazy(() => import('./GuideEn.jsx'))
const GuideActivites = lazy(() => import('./GuideActivites.jsx'))
const GuideProximite = lazy(() => import('./GuideProximite.jsx'))
const GuideArlet     = lazy(() => import('./GuideArlet.jsx'))
const GuideExplorer  = lazy(() => import('./GuideExplorer.jsx'))
const GuidePOI       = lazy(() => import('./GuidePOI.jsx'))
const GuideTroisIlets = lazy(() => import('./GuideTroisIlets.jsx'))
const GuidePlongee             = lazy(() => import('./GuidePlongee.jsx'))
const GuideSaintPierre         = lazy(() => import('./GuideSaintPierre.jsx'))
const GuideFrancois            = lazy(() => import('./GuideFrancois.jsx'))
const GuideDistilleries        = lazy(() => import('./GuideDistilleries.jsx'))
const GuideRandonnees          = lazy(() => import('./GuideRandonnees.jsx'))
const GuideGastronomie         = lazy(() => import('./GuideGastronomie.jsx'))
const GuideSainteLuce          = lazy(() => import('./GuideSainteLuce.jsx'))
const GuideReservationDirecte  = lazy(() => import('./GuideReservationDirecte.jsx'))
const GuideMeilleureSaison     = lazy(() => import('./GuideMeilleureSaison.jsx'))
const GuideSeminaires          = lazy(() => import('./GuideSeminaires.jsx'))
const GuideNogent              = lazy(() => import('./GuideNogent.jsx'))
const GuideVillaPiscine        = lazy(() => import('./GuideVillaPiscine.jsx'))
const Partenaires              = lazy(() => import('./Partenaires.jsx'))
const GuideLocationVoiture     = lazy(() => import('./GuideLocationVoiture.jsx')) // eslint-disable-line react-refresh/only-export-components
const GuideQueFaire            = lazy(() => import('./GuideQueFaire.jsx'))
const Avis             = lazy(() => import('./Avis.jsx'))
const Faq              = lazy(() => import('./Faq.jsx'))
const MentionsLegales          = lazy(() => import('./MentionsLegales.jsx'))
const PolitiqueConfidentialite = lazy(() => import('./PolitiqueConfidentialite.jsx'))
const ConditionsGenerales      = lazy(() => import('./ConditionsGenerales.jsx'))
const NotFound                 = lazy(() => import('./NotFound.jsx'))
const CookieBanner = lazy(() => import('./CookieBanner.jsx')) // eslint-disable-line react-refresh/only-export-components
const ChatWidget   = lazy(() => import('./ChatWidget.jsx'))   // eslint-disable-line react-refresh/only-export-components
const GuestGuide      = lazy(() => import('./GuestGuide.jsx'))
const Services        = lazy(() => import('./Services.jsx'))
const GuideSejour     = lazy(() => import('./GuideSejour.jsx'))
const Merci           = lazy(() => import('./Merci.jsx'))
const Links           = lazy(() => import('./Links.jsx'))
const StoriesTemplate = lazy(() => import('./StoriesTemplate.jsx'))
const MenageGuide     = lazy(() => import('./MenageGuide.jsx'))

// Build ID — exposé pour debug + force un nouveau hash d'asset à chaque déploiement
// (évite le cache immutable empoisonné quand un asset 404 pendant la propagation)
window.__BUILD__ = "2026-05-28-1";

// Normalise les chemins avec trailing slash (/amaryllis/ → /amaryllis)
const path = window.location.pathname.replace(/\/$/, "") || "/";

// Attacher la surface au <body> pour que les tokens CSS s'activent
document.body.dataset.surface = path.startsWith("/admin") ? "admin" : "site";

// Appliquer le thème persisté (mode sombre site)
// On pose data-theme sur <body> (qui porte data-surface) ET <html> (pour l'OS scrollbar)
try {
  const savedTheme = localStorage.getItem("amaryllis-theme");
  if (savedTheme) {
    document.body.dataset.theme = savedTheme;
    document.documentElement.dataset.theme = savedTheme;
  }
} catch {}
const params = new URLSearchParams(window.location.search);
const cautionParam = params.get("caution"); // "ok" | "cancelled"
const tvMode = params.get("tv") === "1"; // écran TV kiosque → pas de bandeau cookies

// ── GA4 — delegated event listeners (couvre tous les éléments présents et futurs) ──
// Helpers
function ga(name, params = {}) {
  if (!window.gtag) return;
  try { window.gtag("event", name, { page_path: window.location.pathname, ...params }); }
  catch { /* silent */ }
}
function bienFromPath() {
  const m = window.location.pathname.match(/^\/(amaryllis|zandoli|iguana|geko|mabouya|schoelcher|nogent)(?:\/|$)/);
  return m ? m[1] : null;
}

// 1. Clics délégués — liens (mail/tel/whatsapp), CTA réservation, ouverture chat
document.addEventListener("click", (e) => {
  if (!window.gtag || !e.target || !e.target.closest) return;

  const link = e.target.closest("a[href]");
  if (link) {
    const href = link.getAttribute("href") || "";
    if (href.includes("wa.me/") || href.includes("api.whatsapp.com")) ga("whatsapp_click", { link_url: href });
    else if (href.startsWith("mailto:")) ga("email_click", { link_url: href });
    else if (href.startsWith("tel:"))    ga("phone_click", { link_url: href });
  }

  // CTA réservation — boutons/liens marqués data-cta-reservation ou pointant vers réservation
  const cta = e.target.closest("[data-cta-reservation], a[href*='#reservation'], a[href*='/devis'], a[href*='beds24.com']");
  if (cta) {
    ga("cta_reservation_click", {
      cta_label: (cta.innerText || cta.textContent || "").trim().slice(0, 50),
      bien_id: bienFromPath(),
    });
  }

  // Ouverture du ChatWidget — bouton avec data-chat-toggle ou aria-label chat/discuter
  const chatBtn = e.target.closest("[data-chat-toggle], [aria-label*='hat' i], [aria-label*='iscuter' i]");
  if (chatBtn) ga("chat_widget_open", { bien_id: bienFromPath() });
}, { passive: true });

// 2. Soumission du formulaire de contact → contact_form_submit
document.addEventListener("submit", (e) => {
  const form = e.target;
  if (!window.gtag || !(form instanceof HTMLFormElement)) return;
  if ((form.action || "").includes("/contact") || form.id === "contact-form" || form.classList.contains("contact-form")) {
    ga("contact_form_submit", { form_id: form.id || "contact", bien_id: bienFromPath() });
  }
}, { passive: true });

// 3. Calendrier — focus sur un champ date → calendar_open (1× par page)
let calendarOpened = false;
document.addEventListener("focusin", (e) => {
  const t = e.target;
  if (!window.gtag || calendarOpened || !t || !t.matches) return;
  if (t.matches("input[type='date'], [data-calendar-trigger]")) {
    calendarOpened = true;
    ga("calendar_open", { bien_id: bienFromPath() });
  }
}, { passive: true });

// 4. Sélection de dates → date_selected
document.addEventListener("change", (e) => {
  const t = e.target;
  if (!window.gtag || !t || !t.matches) return;
  if (t.matches("input[type='date']")) {
    ga("date_selected", { bien_id: bienFromPath(), field_name: t.name || t.id || "date" });
  }
}, { passive: true });

// Scroll depth — événement scroll_50 et scroll_90 (engagement contenu)
(() => {
  const fired = new Set();
  const onScroll = () => {
    if (!window.gtag) return;
    const scrolled = window.scrollY + window.innerHeight;
    const pct = Math.round((scrolled / document.body.scrollHeight) * 100);
    [50, 90].forEach(threshold => {
      if (pct >= threshold && !fired.has(threshold)) {
        fired.add(threshold);
        window.gtag("event", `scroll_${threshold}`, {
          percent_scrolled: threshold,
          page_path: window.location.pathname,
        });
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
})();

const BIEN_IDS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];
const KNOWN = ["/", "/links", "/merci", "/devis", "/guide", "/guide-hub", "/explorer", "/guide-le-diamant", "/guide-sainte-anne", "/villa-rental-martinique", "/activites-sainte-luce", "/guide-proximite", "/guide-arlet", "/guide-trois-ilets", "/guide-plongee-martinique", "/guide-saint-pierre-martinique", "/guide-francois-martinique", "/guide-distilleries-martinique", "/guide-randonnees-martinique", "/guide-gastronomie-martinique", "/avis", "/faq", "/mentions-legales", "/politique-confidentialite", "/conditions-generales", "/sainte-luce-martinique", "/reservation-directe-martinique", "/meilleure-saison-martinique", "/seminaires", "/guide-nogent-sur-marne", "/location-villa-martinique-piscine", "/location-groupe-sainte-luce", "/location-appartement-vue-mer-schoelcher", "/plus-belles-plages-sud-martinique", "/nos-partenaires", "/location-voiture-martinique-pas-cher", "/que-faire-martinique"];
const isKnown = KNOWN.includes(path)
  || GUIDES_POI_SLUGS.includes(path)
  || path.startsWith("/admin")
  || path.startsWith("/landing")
  || path.startsWith("/bienvenue")
  || path.startsWith("/guide-sejour/")
  || path.startsWith("/services/")
  || path.startsWith("/api/")
  || path === "/stories-template"
  || path === "/guide-menage"
  || path.startsWith("/r/")
  || BIEN_IDS.some(id => path === `/${id}`);

let Component;
if (!isKnown) {
  Component = NotFound;
} else if (path.startsWith("/admin")) {
  Component = App;
} else if (path.startsWith("/landing")) {
  Component = Landing;
} else if (path === "/links") {
  Component = Links;
} else if (GUIDES_POI_SLUGS.includes(path)) {
  Component = GuidePOI;
} else if (path === "/guide" || path === "/guide-hub") {
  Component = Guide;
} else if (path === "/guide-le-diamant") {
  Component = GuideDiamant;
} else if (path === "/guide-sainte-anne") {
  Component = GuideSainteAnne;
} else if (path === "/villa-rental-martinique") {
  Component = GuideEn;
} else if (path === "/activites-sainte-luce") {
  Component = GuideActivites;
} else if (path === "/guide-proximite") {
  Component = GuideProximite;
} else if (path === "/guide-arlet") {
  Component = GuideArlet;
} else if (path === "/explorer") {
  Component = GuideExplorer;
} else if (path === "/guide-trois-ilets") {
  Component = GuideTroisIlets;
} else if (path === "/guide-plongee-martinique") {
  Component = GuidePlongee;
} else if (path === "/guide-saint-pierre-martinique") {
  Component = GuideSaintPierre;
} else if (path === "/guide-francois-martinique") {
  Component = GuideFrancois;
} else if (path === "/guide-distilleries-martinique") {
  Component = GuideDistilleries;
} else if (path === "/guide-randonnees-martinique") {
  Component = GuideRandonnees;
} else if (path === "/guide-gastronomie-martinique") {
  Component = GuideGastronomie;
} else if (path === "/sainte-luce-martinique") {
  Component = GuideSainteLuce;
} else if (path === "/reservation-directe-martinique") {
  Component = GuideReservationDirecte;
} else if (path === "/meilleure-saison-martinique") {
  Component = GuideMeilleureSaison;
} else if (path === "/seminaires") {
  Component = GuideSeminaires;
} else if (path === "/guide-nogent-sur-marne") {
  Component = GuideNogent;
} else if (path === "/location-villa-martinique-piscine") {
  Component = GuideVillaPiscine;
} else if (path === "/nos-partenaires") {
  Component = Partenaires;
} else if (path === "/que-faire-martinique") {
  Component = GuideQueFaire;
} else if (path === "/location-voiture-martinique-pas-cher") {
  Component = GuideLocationVoiture;
} else if (path === "/avis") {
  Component = Avis;
} else if (path === "/faq") {
  Component = Faq;
} else if (path === "/mentions-legales") {
  Component = MentionsLegales;
} else if (path === "/politique-confidentialite") {
  Component = PolitiqueConfidentialite;
} else if (path === "/conditions-generales") {
  Component = ConditionsGenerales;
} else if (path === "/merci") {
  Component = Merci;
} else if (path.startsWith("/bienvenue")) {
  Component = GuestGuide;
} else if (path.startsWith("/guide-sejour/")) {
  Component = GuideSejour;
} else if (path.startsWith("/services/")) {
  Component = Services;
} else if (path === "/stories-template") {
  Component = StoriesTemplate;
} else if (path === "/guide-menage") {
  Component = MenageGuide;
} else {
  Component = PublicSite;
}

// ── Page de confirmation caution voyageur ──────────────────────────────────
function CautionPage({ status }) {
  const ok = status === "ok";
  return (
    <div style={{ minHeight: "100vh", background: "#f8f5ef", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>{ok ? "🔒" : "↩️"}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0e3b3a", marginBottom: 12 }}>
          {ok ? "Caution enregistrée" : "Pré-autorisation annulée"}
        </h1>
        <p style={{ fontSize: 15, color: "#5a4a3a", lineHeight: 1.7, marginBottom: 32 }}>
          {ok
            ? "Votre carte a bien été pré-autorisée. Aucun montant ne sera débité — la caution sera libérée automatiquement 3 jours après votre départ."
            : "Vous avez annulé la pré-autorisation. Merci de contacter votre hôte si vous avez des questions."}
        </p>
        <a href="/" style={{ display: "inline-block", padding: "12px 28px", background: "#0e3b3a", color: "#faf5e9", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
          ← Retour au site
        </a>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      onError={(error) => {
        const STALE = /Failed to fetch dynamically imported module|error loading dynamically imported module|ChunkLoadError/i;
        if (!STALE.test(String(error?.message || ""))) return;
        let last = 0;
        try { last = Number(sessionStorage.getItem("amaryllis_chunk_reload_ts")) || 0; } catch { /* noop */ }
        if (Date.now() - last < 30000) return;
        try { sessionStorage.setItem("amaryllis_chunk_reload_ts", String(Date.now())); } catch { /* noop */ }
        window.location.reload();
      }}
      fallback={({ error }) => {
        const STALE = /Failed to fetch dynamically imported module|error loading dynamically imported module|ChunkLoadError/i;
        if (STALE.test(String(error?.message || ""))) {
          return <div style={{ minHeight: "100vh", background: "#0e3b3a" }} />;
        }
        return <p>Une erreur est survenue.</p>;
      }}
      showDialog>
      <LangProvider>
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0e3b3a" }} />}>
          {cautionParam ? <CautionPage status={cautionParam} /> : <Component />}
          {!cautionParam && !tvMode && !path.startsWith("/admin") && <CookieBanner />}
          {!cautionParam && !path.startsWith("/admin") && !path.startsWith("/landing") && !path.startsWith("/bienvenue") && <ChatWidget />}
        </Suspense>
      </LangProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
