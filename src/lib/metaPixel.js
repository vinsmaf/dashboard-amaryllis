// Meta Pixel (Facebook/Instagram Ads) — chargé UNIQUEMENT après consentement RGPD
// (même logique que GA4 Consent Mode : rien ne se charge ni ne track avant le « oui »
// du bandeau cookies). Inerte tant que META_PIXEL_ID est vide.
//
// ⚠️ RENSEIGNER META_PIXEL_ID : Meta Events Manager → Sources de données → ton Pixel →
//    l'ID est le nombre de ~15-16 chiffres affiché en haut. (C'est public, pas un secret.)
// 2026-06-05 : aligné sur le dataset du compte pub « Amaryllis corp » (act 853205825762332,
// Business 609408700286001) pour que les events on-site alimentent CE pixel → mesure + audiences
// retargeting utilisables par la campagne Meta. (Ancien ID 714189639771397 = autre Business.)
export const META_PIXEL_ID = "1648064656415946";

let _loaded = false;

// Charge le pixel + PageView. Idempotent. No-op si pas d'ID.
export function loadMetaPixel() {
  if (_loaded || typeof window === "undefined" || !META_PIXEL_ID) return;
  _loaded = true;
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  try {
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  } catch { /* */ }
}

// Track sûr : no-op si le pixel n'est pas chargé (pas de consentement / pas d'ID).
export function mpTrack(event, params) {
  try { if (typeof window !== "undefined" && window.fbq) window.fbq("track", event, params || {}); } catch { /* */ }
}

// Au chargement de l'app : si le consentement a déjà été accordé, (re)charge le pixel.
export function initMetaPixelIfConsented() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("amaryllis-cookie-consent") === "granted") {
      loadMetaPixel();
    }
  } catch { /* */ }
}
