import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react"
import './index.css'
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
const Avis            = lazy(() => import('./Avis.jsx'))
const NotFound        = lazy(() => import('./NotFound.jsx'))
const GuestGuide      = lazy(() => import('./GuestGuide.jsx'))
const Merci           = lazy(() => import('./Merci.jsx'))

const path = window.location.pathname;
const params = new URLSearchParams(window.location.search);
const cautionParam = params.get("caution"); // "ok" | "cancelled"

const BIEN_IDS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];
const KNOWN = ["/", "/merci", "/devis", "/guide", "/explorer", "/guide-le-diamant", "/guide-sainte-anne", "/villa-rental-martinique", "/activites-sainte-luce", "/guide-proximite", "/guide-arlet", "/guide-trois-ilets", "/avis"];
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
} else if (path === "/avis") {
  Component = Avis;
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
        </Suspense>
      </LangProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
