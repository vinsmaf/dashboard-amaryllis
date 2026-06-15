// Attribution tracking — capture UTM params + fbclid + gclid à l'arrivée sur le site
// et les persiste en sessionStorage pour les injecter dans les metadata Stripe.
//
// Règle : le premier clic de la session fait foi (last-click model simple).
// Stripe metadata → visible dans Dashboard + webhook → traçable par résa.

const KEY = "aml_attribution";

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export function captureAttribution() {
  // Ne capturer qu'une fois par session
  try { if (sessionStorage.getItem(KEY)) return; } catch { return; }

  const params = new URLSearchParams(window.location.search);
  const attr = {};

  // UTM params
  for (const k of UTM_PARAMS) {
    const v = params.get(k);
    if (v) attr[k] = v;
  }

  // fbclid → source = facebook / medium = paid_social (+ id de clic brut conservé pour la CAPI)
  const fbclid = params.get("fbclid");
  if (fbclid) {
    attr.channel   = "meta";
    attr.utm_source = attr.utm_source || "facebook";
    attr.utm_medium = attr.utm_medium || "paid_social";
    attr.fbclid = fbclid;
  }

  // gclid → source = google / medium = cpc (+ id de clic brut conservé pour l'attribution serveur)
  const gclid = params.get("gclid");
  if (gclid) {
    attr.channel    = "google";
    attr.utm_source = attr.utm_source || "google";
    attr.utm_medium = attr.utm_medium || "cpc";
    attr.gclid = gclid;
  }

  // Déduction canal si UTM présents sans fbclid/gclid
  if (!attr.channel && attr.utm_medium) {
    if (["cpc", "paid", "paid_search", "paidsearch"].includes(attr.utm_medium)) {
      attr.channel = attr.utm_source?.includes("google") ? "google" : "paid";
    } else if (["paid_social", "social", "facebook", "instagram"].includes(attr.utm_medium)) {
      attr.channel = "meta";
    }
  }

  // Toujours stocker (même vide → accès direct)
  if (Object.keys(attr).length === 0) attr.channel = "direct";

  try { sessionStorage.setItem(KEY, JSON.stringify(attr)); } catch { /* */ }
}

// Retourne les champs à injecter dans metadata Stripe (strings uniquement, max 500c chacune).
// Inclut l'attribution (utm/channel/gclid/fbclid) ET les cookies d'identité Meta (_fbp/_fbc),
// lus À CHAUD à l'appel : le Pixel ne les pose qu'après consentement, donc ils sont souvent
// absents du snapshot d'arrivée. Les transmettre à la CAPI fait monter l'Event Match Quality
// de ~15-40 % à ~60-75 % (levier #1 d'attribution Meta à faible volume).
export function getAttributionMetadata() {
  const meta = {};
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const attr = JSON.parse(raw);
      if (attr.channel)      meta.channel      = String(attr.channel).slice(0, 100);
      if (attr.utm_source)   meta.utm_source   = String(attr.utm_source).slice(0, 100);
      if (attr.utm_medium)   meta.utm_medium   = String(attr.utm_medium).slice(0, 100);
      if (attr.utm_campaign) meta.utm_campaign = String(attr.utm_campaign).slice(0, 100);
      if (attr.gclid)        meta.gclid        = String(attr.gclid).slice(0, 200);
      if (attr.fbclid)       meta.fbclid       = String(attr.fbclid).slice(0, 200);
    }
  } catch { /* */ }
  // Cookies Meta lus à chaud (≠ snapshot d'arrivée). _fbc reconstruit depuis fbclid si absent.
  try {
    const rd = (n) => (document.cookie.match(new RegExp("(^|; )" + n + "=([^;]+)")) || [])[2] || "";
    const fbp = rd("_fbp");
    const fbc = rd("_fbc") || (meta.fbclid ? `fb.1.${Date.now()}.${meta.fbclid}` : "");
    if (fbp) meta.fbp = fbp.slice(0, 200);
    if (fbc) meta.fbc = fbc.slice(0, 200);
  } catch { /* */ }
  return meta;
}
