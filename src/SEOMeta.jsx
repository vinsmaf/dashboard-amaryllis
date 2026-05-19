// SEOMeta.jsx — meta tags dynamiques pour toutes les pages
// Met à jour title, description, canonical, Open Graph et Twitter Card
// Compatible React 19 + SPA sans SSR

import { useEffect } from "react";

const BASE         = "https://villamaryllis.com";
const DEFAULT_IMG  = `${BASE}/photos/amaryllis/01.webp`;
const DEFAULT_TITLE = "Amaryllis — Location villa Martinique avec piscine | Réservation directe";
const DEFAULT_DESC  = "Louez directement nos villas à Sainte-Luce, Martinique. Piscine à débordement, vue mer, jacuzzi privatif. À partir de 110€/nuit. Sans frais de service Airbnb.";

/**
 * @param {string}  title       - <title> de la page
 * @param {string}  description - meta description
 * @param {string}  canonical   - path absolu ex: "/guide-arlet"
 * @param {string}  image       - URL absolue pour OG image
 * @param {string}  type        - og:type ("website" | "article")
 */
export default function SEOMeta({
  title,
  description,
  canonical = "/",
  image,
  type = "website",
}) {
  useEffect(() => {
    const t   = title       || DEFAULT_TITLE;
    const d   = description || DEFAULT_DESC;
    const c   = `${BASE}${canonical.startsWith("/") ? canonical : "/" + canonical}`;
    const img = image       || DEFAULT_IMG;

    /* ── Helpers ── */
    const byId  = (id)  => document.getElementById(id);
    const byQS  = (sel) => document.querySelector(sel);
    const set   = (el, attr, val) => { if (el) el.setAttribute(attr, val); };

    /* ── Title ── */
    document.title = t;

    /* ── Meta description ── */
    set(byQS('meta[name="description"]'), "content", d);

    /* ── Canonical ── */
    set(byId("canonical"), "href", c);

    /* ── Open Graph ── */
    set(byId("og-title"),       "content", t);
    set(byId("og-description"), "content", d);
    set(byId("og-url"),         "content", c);
    set(byId("og-image"),       "content", img);
    set(byQS('meta[property="og:type"]'), "content", type);

    /* ── Twitter Card ── */
    set(byId("tw-title"),       "content", t);
    set(byId("tw-description"), "content", d);
    set(byId("tw-image"),       "content", img);
  }, [title, description, canonical, image, type]);

  return null;
}
