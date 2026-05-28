/**
 * A/B Testing — infrastructure MVP
 *
 * Split 50/50 via cookie first-party `ab_<testName>` (30 jours)
 * + tracking GA4 event `ab_variant` (test_name + variant).
 *
 * USAGE
 * -----
 *   import { getVariant, trackConversion } from "@/utils/abTest";
 *
 *   // 1. Assigner une variante (au mount du composant)
 *   const variant = getVariant("cta_homepage"); // "A" ou "B"
 *
 *   // 2. Rendre conditionnellement
 *   return <Button>{variant === "B" ? "VÉRIFIER LES DISPOS" : "RÉSERVER"}</Button>;
 *
 *   // 3. Tracker la conversion liée (clic, soumission, etc.)
 *   <Button onClick={() => { trackConversion("cta_homepage"); navigate(...); }}>
 *
 * GA4 — analyse côté Google Analytics
 * -----
 *   Exploration > Free form report
 *   Dimensions : test_name, ab_variant
 *   Métrique  : Total users + Conversions
 *   Comparer A vs B → significativité via taux de conversion
 *
 * RGPD — Consent Mode v2
 * -----
 *   Le cookie ab_* est strictement nécessaire (assignation aléatoire pour
 *   uniformiser l'UX). Les events GA4 ne partent QUE si l'utilisateur a
 *   accepté analytics_storage (déjà géré dans index.html).
 *
 * INTERDICTIONS
 * -----
 *   - Ne pas tester plusieurs variables à la fois (1 test = 1 variable)
 *   - Ne pas arrêter un test avant 14 jours OU 2× la taille minimale
 *   - Toujours définir AVANT le test : KPI primaire + critère d'arrêt
 */

const COOKIE_PREFIX = "ab_";
const COOKIE_DAYS = 30;

/**
 * Lit un cookie par nom.
 * @param {string} name
 * @returns {string|null}
 */
function readCookie(name) {
  if (typeof document === "undefined") return null;
  const re = new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]+)`);
  const m = document.cookie.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Écrit un cookie first-party SameSite=Lax.
 * @param {string} name
 * @param {string} value
 * @param {number} days
 */
function writeCookie(name, value, days = COOKIE_DAYS) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Hash déterministe (assignation stable si on veut pondérer).
 * Pour l'instant : 50/50 pur aléatoire.
 */
function pickVariant() {
  return Math.random() < 0.5 ? "A" : "B";
}

/**
 * Récupère ou assigne la variante pour un test donné.
 * Émet l'event GA4 `ab_variant` à la PREMIÈRE assignation seulement.
 *
 * @param {string} testName  Identifiant unique du test (ex: "cta_homepage")
 * @returns {"A"|"B"}        Variante assignée (stable sur 30 jours)
 */
export function getVariant(testName) {
  // SSR safe : si pas de document, retourne toujours A (contrôle)
  if (typeof document === "undefined") return "A";

  const key = COOKIE_PREFIX + testName;
  let variant = readCookie(key);

  if (variant !== "A" && variant !== "B") {
    variant = pickVariant();
    writeCookie(key, variant);

    // Envoi GA4 — uniquement à la première assignation, et si gtag dispo
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      try {
        window.gtag("event", "ab_variant_assigned", {
          test_name: testName,
          ab_variant: variant,
        });
      } catch { /* silent */ }
    }
  }

  return variant;
}

/**
 * Force une variante (utile pour debug ou démo).
 * À ne pas appeler en prod sauf depuis console.
 * @param {string} testName
 * @param {"A"|"B"} variant
 */
export function forceVariant(testName, variant) {
  if (variant !== "A" && variant !== "B") return;
  writeCookie(COOKIE_PREFIX + testName, variant);
}

/**
 * Tracke un événement de conversion lié à un test.
 * À appeler quand l'utilisateur fait l'action mesurée (clic, soumission, etc.).
 *
 * @param {string} testName              Le même nom que getVariant()
 * @param {object} [extraParams]         Paramètres additionnels GA4
 */
export function trackConversion(testName, extraParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const variant = readCookie(COOKIE_PREFIX + testName) || "unassigned";
  try {
    window.gtag("event", "ab_conversion", {
      test_name: testName,
      ab_variant: variant,
      ...extraParams,
    });
  } catch { /* silent */ }
}

/**
 * Retourne toutes les variantes A/B actives (debug / cockpit admin).
 * @returns {Record<string, "A"|"B">}
 */
export function listActiveVariants() {
  if (typeof document === "undefined") return {};
  const out = {};
  document.cookie.split("; ").forEach(c => {
    const [k, v] = c.split("=");
    if (k && k.startsWith(COOKIE_PREFIX) && (v === "A" || v === "B")) {
      out[k.slice(COOKIE_PREFIX.length)] = v;
    }
  });
  return out;
}

/**
 * Reset une variante (utile pour debug).
 * @param {string} testName
 */
export function resetVariant(testName) {
  writeCookie(COOKIE_PREFIX + testName, "", -1);
}

// Expose à window pour debug en console (uniquement en dev / prod admin)
if (typeof window !== "undefined") {
  window.__abTest = { getVariant, forceVariant, trackConversion, listActiveVariants, resetVariant };
}
