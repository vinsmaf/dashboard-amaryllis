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

  // fbclid → source = facebook / medium = paid_social
  const fbclid = params.get("fbclid");
  if (fbclid) {
    attr.channel   = "meta";
    attr.utm_source = attr.utm_source || "facebook";
    attr.utm_medium = attr.utm_medium || "paid_social";
  }

  // gclid → source = google / medium = cpc
  const gclid = params.get("gclid");
  if (gclid) {
    attr.channel    = "google";
    attr.utm_source = attr.utm_source || "google";
    attr.utm_medium = attr.utm_medium || "cpc";
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

// Retourne les champs à injecter dans metadata Stripe (strings uniquement, max 500c chacune)
export function getAttributionMetadata() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return {};
    const attr = JSON.parse(raw);
    const meta = {};
    if (attr.channel)       meta.channel       = String(attr.channel).slice(0, 100);
    if (attr.utm_source)    meta.utm_source    = String(attr.utm_source).slice(0, 100);
    if (attr.utm_medium)    meta.utm_medium    = String(attr.utm_medium).slice(0, 100);
    if (attr.utm_campaign)  meta.utm_campaign  = String(attr.utm_campaign).slice(0, 100);
    return meta;
  } catch { return {}; }
}
