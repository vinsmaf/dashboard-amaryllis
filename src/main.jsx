import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PublicSite from './PublicSite.jsx'
import Landing from './Landing.jsx'

const path = window.location.pathname;

// Routes valides connues — tout le reste redirige vers /
const KNOWN = ["/", "/merci"];
const isKnown = KNOWN.includes(path)
  || path.startsWith("/admin")
  || path.startsWith("/landing")
  || path.startsWith("/api/");

if (!isKnown) {
  window.location.replace("/");
}

let Component;
if (path.startsWith("/admin")) {
  Component = App;
} else if (path.startsWith("/landing")) {
  Component = Landing;
} else {
  Component = PublicSite;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Component />
  </StrictMode>,
)
