import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

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

const path = window.location.pathname;

const BIEN_IDS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];
const KNOWN = ["/", "/merci", "/devis", "/guide", "/guide-le-diamant", "/guide-sainte-anne", "/villa-rental-martinique", "/activites-sainte-luce", "/guide-proximite"];
const isKnown = KNOWN.includes(path)
  || path.startsWith("/admin")
  || path.startsWith("/landing")
  || path.startsWith("/api/")
  || BIEN_IDS.some(id => path === `/${id}`);

if (!isKnown) {
  window.location.replace("/");
}

let Component;
if (path.startsWith("/admin")) {
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
} else {
  Component = PublicSite;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0e3b3a" }} />}>
      <Component />
    </Suspense>
  </StrictMode>,
)
