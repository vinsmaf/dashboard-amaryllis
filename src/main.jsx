import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PublicSite from './PublicSite.jsx'
import Landing from './Landing.jsx'
import Guide from './Guide.jsx'

const path = window.location.pathname;

// Routes valides connues — tout le reste redirige vers /
const BIEN_IDS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];
const KNOWN = ["/", "/merci", "/devis", "/guide"];
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
} else {
  Component = PublicSite;  // handles /devis and / and /merci internally
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Component />
  </StrictMode>,
)
