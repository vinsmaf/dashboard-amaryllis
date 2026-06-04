// src/utils/tvScreen.js
// Logique pure de l'écran TV (testable sans DOM).

export function parseTvParams(search) {
  const q = new URLSearchParams(search || "");
  const clean = (v) => { const s = (v || "").trim(); return s.length ? s : null; };
  return {
    tv: q.get("tv") === "1",
    guest: clean(q.get("guest")),
    du: clean(q.get("du")),
    au: clean(q.get("au")),
  };
}

// Payload QR « se connecter au WiFi » (format de.fr standard).
export function wifiQrPayload(ssid, password) {
  if (!ssid) return null;
  const esc = (s) => String(s).replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:WPA;S:${esc(ssid)};P:${esc(password || "")};;`;
}

// URL absolue de production (pour les QR).
export function absUrl(path) {
  const base = "https://villamaryllis.com";
  return path.startsWith("http") ? path : base + (path.startsWith("/") ? path : "/" + path);
}
