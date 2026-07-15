// Capteur d'erreurs front auto-hébergé → POST /api/client-errors
// Couvre site public ET admin. Alimente l'onglet 🐞 Bugs + l'agent de triage.
//
// ⚠️ GARDE-FOU : on ne patche JAMAIS window.fetch (casserait le checkout Stripe).
//    On se contente de window.onerror, unhandledrejection et console.error.
//
// Dédoublonnage + throttle côté client pour ne pas spammer l'endpoint.

import { isStaleChunkError } from "./staleChunk.js";

const ENDPOINT = "/api/client-errors";
const seen = new Set();        // empreintes déjà envoyées dans cette session
let sentCount = 0;             // plafond dur par session
const MAX_PER_SESSION = 25;

// Bruit navigateur connu — on ne remonte pas (doublon du filtre serveur, évite le trafic).
// Testé sur le message ET la stack (ex: MetaMask ne mentionne "chrome-extension" que dans
// sa stack, jamais dans son message "Failed to connect to MetaMask" — trouvé en creusant
// pourquoi ce bruit revenait sans cesse en "new" malgré ce filtre, cf. bug-f653d82ddd9acf0d).
const NOISE = [
  /ResizeObserver loop/i,
  /Non-Error promise rejection/i,
  /^Script error\.?$/i,
  /chrome-extension|moz-extension|safari-extension|safari-web-extension/i,
  /Load failed$/i,
  /fbav|fb_iab|instagram/i,
];

function fp(s) {
  // empreinte courte et stable (chiffres/urls neutralisés)
  return String(s || "")
    .toLowerCase()
    .replace(/https?:\/\/[^\s)]+/g, "·u·")
    .replace(/\d+/g, "#")
    .slice(0, 160);
}

function post(payload) {
  try {
    const body = JSON.stringify({
      url: location.href,
      path: location.pathname,
      ua: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      ...payload,
    });
    // keepalive : survit à une navigation/fermeture d'onglet. PAS de patch global.
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: body.length < 60000, // keepalive plafonne à 64 Ko
    }).catch(() => {});
  } catch { /* never throw from the reporter */ }
}

function report(kind, message, stack) {
  if (sentCount >= MAX_PER_SESSION) return;
  const msg = String(message || "").slice(0, 600);
  if (!msg) return;
  const stackStr = stack ? String(stack) : "";
  if (NOISE.some(re => re.test(msg) || re.test(stackStr))) return;
  if (isStaleChunkError(msg, stackStr)) return; // faux positif connu (bot crawlers, chunk périmé)
  const key = kind + "|" + fp(msg) + "|" + location.pathname;
  if (seen.has(key)) return;
  seen.add(key);
  sentCount++;
  post({ kind, message: msg, stack: stack ? String(stack).slice(0, 4000) : null });
}

let installed = false;
export function installBugCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    // Erreurs de ressources (img/script) → event sans e.error
    if (!e || (!e.error && !e.message)) return;
    const msg = e.message || (e.error && e.error.message) || "Erreur";
    const stack = e.error && e.error.stack;
    report("error", msg, stack);
  });

  window.addEventListener("unhandledrejection", (e) => {
    const r = e && e.reason;
    const msg = (r && (r.message || r.toString && r.toString())) || "Promesse rejetée";
    const stack = r && r.stack;
    report("rejection", msg, stack);
  });

  // console.error : on conserve le comportement natif puis on remonte.
  const orig = console.error.bind(console);
  console.error = (...args) => {
    orig(...args);
    try {
      const msg = args.map(a => (a && a.message) ? a.message : (typeof a === "string" ? a : "")).filter(Boolean).join(" ").slice(0, 600);
      const stack = args.find(a => a && a.stack)?.stack;
      if (msg) report("console", msg, stack);
    } catch { /* noop */ }
  };
}

// Réutilisé par le bouton « Signaler un bug » (capture manuelle).
export function reportManualBug({ comment, screenshot }) {
  try {
    post({ kind: "report", message: comment ? comment.slice(0, 200) : "Report visuel", comment, screenshot });
    return true;
  } catch { return false; }
}
