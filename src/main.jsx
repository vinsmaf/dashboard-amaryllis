import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react"
import './index.css'
import './tokens.css'
import { LangProvider } from './i18n.jsx'

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
const Avis             = lazy(() => import('./Avis.jsx'))
const Faq              = lazy(() => import('./Faq.jsx'))
const MentionsLegales          = lazy(() => import('./MentionsLegales.jsx'))
const PolitiqueConfidentialite = lazy(() => import('./PolitiqueConfidentialite.jsx'))
const ConditionsGenerales      = lazy(() => import('./ConditionsGenerales.jsx'))
const NotFound                 = lazy(() => import('./NotFound.jsx'))
import CookieBanner from './CookieBanner.jsx'
import ChatWidget from './ChatWidget.jsx'
const GuestGuide      = lazy(() => import('./GuestGuide.jsx'))
const Merci           = lazy(() => import('./Merci.jsx'))

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

const BIEN_IDS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];
const KNOWN = ["/", "/merci", "/devis", "/guide", "/explorer", "/guide-le-diamant", "/guide-sainte-anne", "/villa-rental-martinique", "/activites-sainte-luce", "/guide-proximite", "/guide-arlet", "/guide-trois-ilets", "/guide-plongee-martinique", "/guide-saint-pierre-martinique", "/guide-francois-martinique", "/guide-distilleries-martinique", "/guide-randonnees-martinique", "/guide-gastronomie-martinique", "/avis", "/faq", "/mentions-legales", "/politique-confidentialite", "/conditions-generales", "/sainte-luce-martinique", "/reservation-directe-martinique", "/meilleure-saison-martinique", "/seminaires", "/guide-nogent-sur-marne", "/location-villa-martinique-piscine"];
const isKnown = KNOWN.includes(path)
  || path.startsWith("/admin")
  || path.startsWith("/landing")
  || path.startsWith("/bienvenue")
  || path.startsWith("/api/")
  || BIEN_IDS.some(id => path === `/${id}`);

let Component;
if (!isKnown) {
  Component = NotFound;
} else if (path.startsWith("/admin")) {
  Component = App;
} else if (path.startsWith("/landing")) {
  Component = Landing;
} else if (path === "/guide") {
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
    <Sentry.ErrorBoundary fallback={<p>Une erreur est survenue.</p>} showDialog>
      <LangProvider>
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0e3b3a" }} />}>
          {cautionParam ? <CautionPage status={cautionParam} /> : <Component />}
          {!cautionParam && !path.startsWith("/admin") && <CookieBanner />}
          {!cautionParam && !path.startsWith("/admin") && !path.startsWith("/landing") && !path.startsWith("/bienvenue") && <ChatWidget />}
        </Suspense>
      </LangProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
