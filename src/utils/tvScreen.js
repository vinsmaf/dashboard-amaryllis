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

export function buildSlides(guide, params = {}) {
  const g = guide || {};
  const pid = g.property_id || "amaryllis";
  const slides = [];

  // 1. Bienvenue — eyebrow « Bienvenue » + titre = prénom OU nom du logement
  // (évite le souci grammatical « à la Villa / au Studio »).
  const welcomeTitle = params.guest || g.property_name || "votre logement";
  const welcomeSub = params.guest && params.du
    ? `Votre séjour du ${params.du}${params.au ? ` au ${params.au}` : ""}`
    : (g.tagline || "");
  slides.push({ id: "welcome", eyebrow: params.guest ? "Bienvenue chez vous" : "Bienvenue",
    title: welcomeTitle, subtitle: welcomeSub,
    body: g.welcome_message || "", signature: g.host_signature || "" });

  // 2. WiFi (sauté si pas de SSID)
  if (g.wifi_ssid) {
    slides.push({ id: "wifi", title: "Connectez-vous au WiFi",
      ssid: g.wifi_ssid, password: g.wifi_password || "",
      qr: wifiQrPayload(g.wifi_ssid, g.wifi_password) });
  }

  // 3. Guide & bonnes adresses (QR -> guide complet sur le téléphone)
  slides.push({ id: "guide", title: "Le meilleur autour de vous",
    subtitle: "Plages, distilleries, tables créoles…",
    qr: absUrl(`/bienvenue/${pid}`), qrLabel: "Ouvrir le guide complet" });

  // 4. Services & extras (vitrine en Phase 1 ; QR -> contact hôte)
  const contact = g.contacts || {};
  const wa = contact.whatsapp ? `https://wa.me/${String(contact.whatsapp).replace(/[^0-9]/g, "")}` : absUrl(`/${pid}`);
  slides.push({ id: "services", title: "Envie d'un petit plus ?",
    subtitle: "Départ tardif · ménage · bouteille de planteur maison…",
    qr: wa, qrLabel: "Demandez à votre hôte" });

  // 5. Infos pratiques (arrivée / départ + teaser départ tardif → vente additionnelle)
  slides.push({ id: "practical", title: "Bon à savoir",
    checkin: g.checkin_time || "17h",
    checkout: g.checkout_time || "12h",
    lateCheckout: "Envie de prolonger ? Un départ tardif est possible selon disponibilité — demandez-le-nous.",
    contact,
    qr: wa, qrLabel: "Contacter l'hôte" });

  // 6. Revenez en direct
  slides.push({ id: "rebook", title: "Revenez quand vous voulez",
    subtitle: "Réservez en direct — jusqu'à 15 % de moins que sur les plateformes",
    qr: absUrl(`/${pid}`), qrLabel: "villamaryllis.com" });

  return slides;
}
