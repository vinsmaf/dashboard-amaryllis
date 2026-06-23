// Guide.jsx — /guide-hub — Hub Martinique v3 · filtrable zone/type/distance
import { useState, useEffect } from "react";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import SEOMeta from "./SEOMeta.jsx";
import { FAQAccordion } from "./primitives.jsx";
import { GUIDES_INDEX } from "./data/guidesIndex.js";
import { GUIDE_HUB_SECTIONS } from "./data/guideHubSections.js";
import LienAffilie from "./components/LienAffilie.jsx";

const BASE = "https://villamaryllis.com";

/* ─── Filtres ──────────────────────────────────────────────── */
const ZONES = [
  { key: "tous",        label: "Toute la Martinique" },
  { key: "sud",         label: "🌴 Sud" },
  { key: "centre",      label: "🏙️ Centre" },
  { key: "nord",        label: "🌋 Nord" },
  { key: "thematiques", label: "✨ Par envie" },
];

const FILTER_TYPES = [
  { key: "Plage",       emoji: "🏖️" },
  { key: "Mer",         emoji: "🤿", label: "Mer & Plongée" },
  { key: "Nature",      emoji: "🌿" },
  { key: "Randonnée",   emoji: "🥾" },
  { key: "Culture",     emoji: "🏛️" },
  { key: "Histoire",    emoji: "⛪" },
  { key: "Rhum",        emoji: "🥃" },
  { key: "Gastronomie", emoji: "🍽️" },
];

// ⚠️ Iguana exclu : bookable:false (locataire longue durée Joël Bailleul)
const VILLA_OPTS = [
  { id: "amaryllis",  nom: "Villa Amaryllis" },
  { id: "zandoli",    nom: "Zandoli" },
  { id: "geko",       nom: "Géko" },
  { id: "mabouya",    nom: "Mabouya" },
  { id: "schoelcher", nom: "Apt Bellevue" },
];

const ZONE_LABELS = { sud: "Sud", centre: "Centre", nord: "Nord", thematiques: "Par envie" };

const DIST_OPTS = [
  { max: 999, label: "Toutes distances" },
  { max: 30,  label: "< 30 min" },
  { max: 60,  label: "< 1 h" },
];

/* ─── Guides aplatis avec zone ──────────────────────────────── */
const ALL_GUIDES = GUIDES_INDEX.flatMap(group =>
  group.items.map(item => ({ ...item, zone: group.zone }))
);

/* Slides uniques pour le carrousel hero (photo + lien vers le guide) */
const HERO_SLIDES = (() => {
  const seen = new Set();
  return ALL_GUIDES.filter(g => {
    if (seen.has(g.photo)) return false;
    seen.add(g.photo);
    return true;
  }).map(g => ({ photo: g.photo, href: g.href, nom: g.nom }));
})();

/* ─── FAQ ───────────────────────────────────────────────────── */
const faqs = [
  { q: "Combien coûte la location d'une villa à Sainte-Luce ?", a: "À partir de 70 €/nuit (Mabouya, jacuzzi privatif) jusqu'à 280 €/nuit (Villa Amaryllis, piscine à débordement eau salée 4×7 m, vue mer 180°, 3 chambres, 8 personnes). En réservant directement, vous évitez les frais Airbnb — jusqu'à 15 % d'économie." },
  { q: "Quelle villa choisir avec piscine à débordement ?", a: "La Villa Amaryllis est notre propriété phare : piscine infinity eau salée 4×7 m, terrasse 100 m² vue Caraïbe 180°, 3 chambres climatisées, 8 personnes. Zandoli et Géko offrent chacune une piscine privative à cascade dès 110 €/nuit. Iguana propose la seule piscine eau salée non chlorée de la résidence." },
  { q: "Comment réserver sans passer par Airbnb ?", a: "Directement sur villamaryllis.com — sélectionnez votre logement, choisissez vos dates, payez par carte (Stripe sécurisé). Contact direct WhatsApp avec l'hôte inclus." },
  { q: "Peut-on venir avec des animaux ?", a: "Oui, la Villa Amaryllis et la Villa Iguana acceptent les animaux (supplément 40 €/séjour, max 2 animaux). Mentionnez-le à la réservation." },
  { q: "Meilleure période pour visiter la Martinique ?", a: "Décembre–avril (saison sèche, alizés, mer calme) — le meilleur mais il faut réserver 3 à 6 mois à l'avance. Juillet–août reste animé. Octobre–novembre : tarifs bas mais risque cyclonique faible." },
  { q: "Y a-t-il le WiFi dans vos villas ?", a: "Oui, toutes les propriétés disposent du WiFi Starlink haut débit inclus dans le tarif. Pas de supplément." },
];

/* ─── CSS ───────────────────────────────────────────────────── */
const CSS = `
  body { margin: 0; background: #faf5e9; }

  /* ── Top bar ── */
  .g2-top {
    background: #0e3b3a; color: #faf5e9; height: 60px; padding: 0 24px;
    display: flex; align-items: center; gap: 22px;
  }
  .g2-top .brand { text-decoration: none; display: flex; flex-direction: column; gap: 1px; flex-shrink: 0; }
  .g2-top .brand .b1 { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 14px; letter-spacing: 0.38em; text-transform: uppercase; color: #faf5e9; line-height: 1; }
  .g2-top .brand .b2 { font-family: 'Jost', sans-serif; font-weight: 300; font-size: 8px; letter-spacing: 0.42em; text-transform: uppercase; color: rgba(250,245,233,0.5); line-height: 1; }
  .g2-top .pagetitle { flex: 1; text-align: center; font-family: 'Jost', sans-serif; font-weight: 200; font-size: 13px; letter-spacing: 0.32em; text-transform: uppercase; color: #faf5e9; margin: 0; }
  .g2-top .pagetitle em { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400; color: #c9a673; letter-spacing: 0.02em; text-transform: none; margin-left: 6px; }
  .g2-top .explorer-link { color: rgba(250,245,233,0.65); text-decoration: none; font-family: 'Jost', sans-serif; font-weight: 300; font-size: 12px; letter-spacing: 0.1em; white-space: nowrap; }
  .g2-top .explorer-link:hover { color: #faf5e9; }

  /* ── Hero ── */
  .g2-hero { position: relative; height: 520px; overflow: hidden; }
  .g2-hero .carousel-slide {
    position: absolute; inset: -24px; display: block;
    background-color: #0e2020; background-size: cover; background-position: center;
    opacity: 0; transition: opacity 1.4s ease-in-out; cursor: pointer;
  }
  .g2-hero .carousel-slide.active {
    opacity: 1;
    animation: kenburns 22s ease-in-out infinite alternate;
  }
  @keyframes kenburns { 0% { transform: scale(1.04); } 100% { transform: scale(1.10) translate(-12px, -4px); } }
  @media (prefers-reduced-motion: reduce) { .g2-hero .carousel-slide.active { animation: none; transform: scale(1.04); } }
  .g2-hero::after {
    content: ""; position: absolute; inset: 0;
    background:
      linear-gradient(90deg, rgba(14,59,58,0.55) 0%, rgba(14,59,58,0.12) 50%, rgba(14,59,58,0) 70%),
      linear-gradient(180deg, rgba(14,59,58,0.30) 0%, rgba(14,59,58,0) 35%, rgba(14,59,58,0.74) 100%);
  }
  .g2-hero-content { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; justify-content: center; padding: 0 64px; color: #faf5e9; }
  .g2-hero-content .pre { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 18px; letter-spacing: 0.04em; color: #c9a673; margin-bottom: 22px; }
  .g2-hero-content h1 { font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(40px, 7vw, 88px); letter-spacing: 0.14em; text-transform: uppercase; color: #faf5e9; line-height: 0.98; margin: 0 0 22px; max-width: 800px; }
  .g2-hero-content h1 em { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400; color: #c9a673; letter-spacing: 0; text-transform: none; }
  .g2-hero-content .lede { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: clamp(17px, 1.6vw, 22px); line-height: 1.55; color: rgba(250,245,233,0.92); max-width: 560px; margin: 0; }
  .g2-hero-content .hero-cta { display: inline-block; margin-top: 30px; align-self: flex-start; background: #c47254; color: #fff; text-decoration: none; padding: 15px 34px; border-radius: 8px; font-family: 'Jost', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; box-shadow: 0 6px 24px rgba(0,0,0,0.28); transition: transform 0.2s, background 0.2s; }
  .g2-hero-content .hero-cta:hover { transform: translateY(-2px); background: #b3633f; }

  /* ── Bandeau réassurance ── */
  .g2-trust { background: #0e3b3a; border-top: 1px solid rgba(250,245,233,0.08); }
  .g2-trust-row { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 10px 28px; padding: 14px 28px; font-family: 'Jost', sans-serif; font-weight: 300; font-size: 12.5px; letter-spacing: 0.03em; color: rgba(250,245,233,0.72); }
  .g2-trust-row span { white-space: nowrap; }
  .g2-trust-row b { color: #c9a673; font-weight: 500; }
  .g2-trust-row span + span { border-left: 1px solid rgba(250,245,233,0.14); padding-left: 28px; }
  @media (max-width: 760px) { .g2-trust-row span + span { border-left: none; padding-left: 0; } }

  /* ── Container ── */
  .g2-ctn { max-width: 1260px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }

  /* ── Filter bar ── */
  .g2-filter {
    position: sticky; top: 0; z-index: 56;
    background: rgba(250,245,233,0.97); backdrop-filter: blur(14px);
    border-bottom: 1px solid #e8e0d0;
    box-shadow: 0 2px 14px rgba(14,59,58,0.07);
  }
  .g2-filter-row {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 24px; overflow-x: auto; scrollbar-width: none;
  }
  .g2-filter-row::-webkit-scrollbar { display: none; }
  .g2-filter-row + .g2-filter-row { border-top: 1px solid #f0e8d8; padding-top: 6px; padding-bottom: 8px; }
  .g2-filter-sep { width: 1px; height: 18px; background: #e0d4bc; flex-shrink: 0; margin: 0 3px; }

  /* Zone tab */
  .gz-tab {
    flex-shrink: 0; white-space: nowrap; padding: 5px 14px; border-radius: 100px;
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 12px; letter-spacing: 0.04em;
    cursor: pointer; border: 1px solid #d8cfc0; background: transparent; color: #7a6b5a;
    transition: all 0.15s;
  }
  .gz-tab.active { background: #0e3b3a; color: #faf5e9; border-color: #0e3b3a; font-weight: 400; }
  .gz-tab:hover:not(.active) { border-color: #0e3b3a; color: #0e3b3a; }

  /* Type chip */
  .gtype-chip {
    flex-shrink: 0; white-space: nowrap; display: flex; align-items: center; gap: 5px;
    padding: 4px 12px; border-radius: 100px;
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px; letter-spacing: 0.04em;
    cursor: pointer; border: 1px solid #d8cfc0; background: transparent; color: #7a6b5a;
    transition: all 0.15s;
  }
  .gtype-chip.active { background: #c47254; color: #fff; border-color: #c47254; font-weight: 400; }
  .gtype-chip:hover:not(.active) { border-color: #c47254; color: #c47254; }

  /* Distance btn */
  .gdist-btn {
    flex-shrink: 0; white-space: nowrap; padding: 4px 12px; border-radius: 100px;
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px; letter-spacing: 0.04em;
    cursor: pointer; border: 1px solid #d8cfc0; background: transparent; color: #7a6b5a;
    transition: all 0.15s;
  }
  .gdist-btn.active { background: #1b2a4a; color: #fff; border-color: #1b2a4a; font-weight: 400; }
  .gdist-btn:hover:not(.active) { border-color: #1b2a4a; color: #1b2a4a; }

  /* Villa select */
  .gvilla-lbl { flex-shrink: 0; font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #7a6b5a; white-space: nowrap; }
  .gvilla-sel {
    flex-shrink: 0; padding: 4px 10px; border-radius: 100px;
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px;
    border: 1px solid #d8cfc0; background: #fff; color: #0e3b3a; cursor: pointer;
  }

  /* Result count */
  .gc-bar { display: flex; align-items: center; gap: 10px; padding: 18px 0 12px; }
  .gc-count { font-family: 'Jost', sans-serif; font-weight: 300; font-size: 13px; color: #7a6b5a; letter-spacing: 0.03em; }
  .gc-count b { color: #0e3b3a; font-weight: 500; }
  .gc-reset {
    background: none; border: 1px solid #e0d4bc; border-radius: 100px;
    padding: 3px 12px; font-family: 'Jost', sans-serif; font-size: 11px;
    color: #7a6b5a; cursor: pointer; transition: all 0.15s; letter-spacing: 0.04em;
  }
  .gc-reset:hover { border-color: #c47254; color: #c47254; }

  /* Guide card grid */
  .gc-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 16px; padding: 0 0 96px;
  }
  @media (max-width: 1100px) { .gc-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 720px)  { .gc-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 420px)  { .gc-grid { grid-template-columns: 1fr; } }

  /* Guide card */
  .gc {
    display: flex; flex-direction: column;
    background: #fff; border: 1px solid #e0d4bc; border-radius: 14px;
    overflow: hidden; text-decoration: none; color: inherit;
    transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s;
    box-shadow: 0 3px 18px rgba(14,59,58,0.05);
  }
  .gc:hover { transform: translateY(-4px); box-shadow: 0 18px 46px rgba(14,59,58,0.14); }
  .gc-photo { height: 176px; position: relative; flex-shrink: 0; overflow: hidden; }
  .gc-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .gc-photo::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 45%, rgba(14,59,58,0.60)); }
  .gc-zone-badge {
    position: absolute; top: 10px; left: 10px; z-index: 2;
    background: rgba(14,59,58,0.72); backdrop-filter: blur(6px);
    color: rgba(250,245,233,0.92); font-size: 9px; font-weight: 500;
    letter-spacing: 0.16em; text-transform: uppercase; padding: 2px 9px; border-radius: 100px;
    font-family: 'Jost', sans-serif;
  }
  .gc-dist-badge {
    position: absolute; top: 10px; right: 10px; z-index: 2;
    background: #c47254; color: #fff;
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    padding: 2px 9px; border-radius: 100px;
  }
  .gc-body { padding: 14px 16px 10px; flex: 1; display: flex; flex-direction: column; gap: 5px; }
  .gc-name {
    font-family: 'Jost', sans-serif; font-weight: 400; font-size: 14px;
    letter-spacing: 0.04em; color: #0e3b3a; line-height: 1.25;
    display: flex; align-items: flex-start; gap: 7px;
  }
  .gc-name-emoji { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .gc-accroche { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 13px; color: #7a6b5a; line-height: 1.4; }
  .gc-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
  .gc-tag { background: #f4ecdc; border: 1px solid #e0d4bc; padding: 1px 7px; border-radius: 3px; font-family: 'Jost', sans-serif; font-size: 9px; color: #7a6b5a; letter-spacing: 0.04em; }
  .gc-foot { border-top: 1px solid #e8e0d0; padding: 10px 16px; font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.10em; text-transform: uppercase; color: #c47254; }
  .gc:hover .gc-foot { color: #0e3b3a; }

  /* Empty state */
  .gc-empty { grid-column: 1/-1; text-align: center; padding: 60px 20px; }
  .gc-empty p { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 19px; color: #7a6b5a; margin: 0 0 18px; }

  /* ── Contenu long-forme ── */
  .g2-longform { max-width: 820px; margin: 0 auto; padding: 0 0 72px; }
  .g2-lf-block { margin-bottom: 36px; }
  .g2-lf-block h2 { font-family: 'Jost', sans-serif; font-weight: 300; font-size: 22px; letter-spacing: 0.02em; color: #0e3b3a; margin: 0 0 12px; padding-left: 14px; border-left: 3px solid #c47254; }
  .g2-lf-block p { font-family: 'Cormorant Garamond', serif; font-size: 18px; line-height: 1.7; color: #3a3530; margin: 0; }
  .g2-lf-block a { color: #c47254; text-decoration: underline; text-underline-offset: 2px; }
  .g2-lf-block a:hover { color: #0e3b3a; }
  .g2-lf-block strong { color: #0e3b3a; font-weight: 600; }

  /* ── Newsletter ── */
  .g2-news { background: linear-gradient(135deg, #0e3b3a 0%, #163f3e 100%); padding: 60px 0; }
  .g2-news-inner { max-width: 640px; margin: 0 auto; text-align: center; }
  .g2-news-pre { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 17px; color: #c9a673; margin-bottom: 12px; }
  .g2-news h2 { font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(24px, 4vw, 34px); letter-spacing: 0.06em; text-transform: uppercase; color: #faf5e9; margin: 0 0 14px; }
  .g2-news h2 em { font-family: 'Cormorant Garamond', serif; font-style: italic; color: #c47254; letter-spacing: 0; text-transform: none; }
  .g2-news p { font-family: 'Cormorant Garamond', serif; font-size: 18px; line-height: 1.6; color: rgba(250,245,233,0.82); margin: 0 0 26px; }
  .g2-news-form { display: flex; gap: 10px; max-width: 480px; margin: 0 auto; flex-wrap: wrap; }
  .g2-news-form input { flex: 1; min-width: 200px; padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(250,245,233,0.25); background: rgba(250,245,233,0.06); color: #faf5e9; font-family: 'Jost', sans-serif; font-size: 14px; }
  .g2-news-form input::placeholder { color: rgba(250,245,233,0.45); }
  .g2-news-form input:focus { outline: none; border-color: #c9a673; }
  .g2-news-form button { background: #c47254; color: #fff; border: none; padding: 14px 26px; border-radius: 8px; cursor: pointer; font-family: 'Jost', sans-serif; font-weight: 600; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; transition: background 0.2s, transform 0.2s; white-space: nowrap; }
  .g2-news-form button:hover:not(:disabled) { background: #b3633f; transform: translateY(-2px); }
  .g2-news-form button:disabled { opacity: 0.6; cursor: default; }
  .g2-news-ok { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 19px; color: #c9a673; padding: 14px 0; }
  .g2-news-err { font-size: 13px; margin-top: 10px; font-family: 'Jost', sans-serif; color: #e8927c; }
  .g2-news-legal { font-family: 'Jost', sans-serif; font-size: 11px; color: rgba(250,245,233,0.45); margin-top: 14px; letter-spacing: 0.04em; }

  /* ── CTA carte interactive ── */
  .g2-map-cta { background: linear-gradient(135deg, #091f1f 0%, #0e3b3a 100%); border-radius: 16px; padding: 28px 32px; margin-bottom: 80px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
  .g2-map-cta .lnk { display: inline-flex; align-items: center; gap: 8px; background: #c47254; color: white; text-decoration: none; padding: 12px 26px; border-radius: 100px; font-size: 13px; font-weight: 600; font-family: 'Jost', sans-serif; letter-spacing: 0.06em; white-space: nowrap; transition: background .2s; }
  .g2-map-cta .lnk:hover { background: #a85a3f; }

  /* ── Section hôtes ── */
  .g2-host { background: #0e3b3a; color: #faf5e9; padding: 96px 0; position: relative; overflow: hidden; }
  .g2-host::before { content: ""; position: absolute; inset: -40px; background: url('/photos/amaryllis/11.webp') center/cover; opacity: 0.12; filter: blur(2px); }
  .g2-host-grid { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1.3fr; gap: 56px; align-items: center; }
  .g2-host-portrait { aspect-ratio: 16/9; background: #0e2020 url('/photos/hosts.webp') center top/cover; border-radius: 18px; box-shadow: 0 24px 64px rgba(0,0,0,0.40); position: relative; }
  .g2-host-portrait::after { content: ""; position: absolute; inset: 0; border-radius: 18px; border: 1px solid rgba(201,166,115,0.4); }
  .g2-host-text .pre { font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px; letter-spacing: 0.55em; text-transform: uppercase; color: #c9a673; margin-bottom: 22px; }
  .g2-host-text h3 { font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(30px, 4.4vw, 50px); letter-spacing: 0.10em; text-transform: uppercase; color: #faf5e9; line-height: 1.05; margin: 0 0 28px; }
  .g2-host-text h3 em { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400; color: #c47254; letter-spacing: 0; text-transform: none; }
  .g2-host-text p { font-family: 'Cormorant Garamond', serif; font-size: 19px; line-height: 1.75; color: rgba(250,245,233,0.85); margin: 0 0 18px; }
  .g2-host-text p em { color: #c9a673; font-style: italic; }
  .g2-host-signoff { margin-top: 28px; display: flex; align-items: center; gap: 14px; border-top: 1px solid rgba(250,245,233,0.15); padding-top: 22px; }
  .g2-host-signoff .name { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 22px; color: #c9a673; }
  .g2-host-signoff .role { font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(250,245,233,0.6); border-left: 1px solid rgba(250,245,233,0.2); padding-left: 14px; }

  /* ── Final CTA ── */
  .g2-final { background: #f4ecdc; padding: 96px 0; text-align: center; }
  .g2-final .pre { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 11px; letter-spacing: 0.55em; text-transform: uppercase; color: #c47254; margin-bottom: 20px; }
  .g2-final h3 { font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(28px, 4.4vw, 46px); letter-spacing: 0.10em; text-transform: uppercase; color: #0e3b3a; margin: 0 0 18px; line-height: 1.05; }
  .g2-final h3 em { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400; color: #c47254; letter-spacing: 0; text-transform: none; }
  .g2-final p { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 19px; color: #7a6b5a; max-width: 540px; margin: 0 auto 36px; line-height: 1.55; }
  .g2-final .actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .btn-coral { background: #c47254; color: #fff; border: none; padding: 16px 32px; border-radius: 6px; font-family: 'Jost', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; box-shadow: 0 4px 18px rgba(196,114,84,0.40); transition: transform 0.2s, box-shadow 0.2s, background 0.2s; text-decoration: none; display: inline-block; }
  .btn-coral:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(196,114,84,0.5); background: #b3633f; }
  .btn-wa { background: #25D366; color: #fff; padding: 16px 28px; border-radius: 6px; text-decoration: none; font-family: 'Jost', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; box-shadow: 0 4px 22px rgba(37,211,102,0.40); display: inline-block; }
  .btn-wa:hover { background: #1fb856; }

  /* ── Savoir avant de partir ── */
  .g2-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
  .g2-info-card { background: rgba(250,245,233,0.06); border: 1px solid rgba(250,245,233,0.1); border-radius: 12px; padding: 18px 20px; }

  /* ── Footer ── */
  .g2-footer { background: #0e3b3a; padding: 24px; text-align: center; }
  .g2-footer p { color: rgba(250,245,233,0.4); font-size: 13px; margin: 0; font-family: 'Jost', sans-serif; }
  .g2-footer a { color: rgba(250,245,233,0.4); text-decoration: none; }

  /* ── Mobile ── */
  @media (max-width: 960px) {
    .g2-hero { height: 420px; }
    .g2-hero-content { padding: 0 24px; }
    .g2-host-grid { grid-template-columns: 1fr; gap: 32px; }
    .g2-host-portrait { max-width: 100%; margin: 0 auto; aspect-ratio: 16/9; }
  }
  @media (max-width: 640px) {
    .g2-top h1 { font-size: 11px; letter-spacing: 0.18em; }
    .g2-top .explorer-link { display: none; }
  }
`;

/* ─── GuideCard ─────────────────────────────────────────────── */
function GuideCard({ g, villa }) {
  const dist = g.dist?.[villa];
  return (
    <a href={g.href} className="gc">
      <div className="gc-photo">
        <img src={g.photo} alt={g.nom} loading="lazy" />
        <span className="gc-zone-badge">{ZONE_LABELS[g.zone] || g.zone}</span>
        {dist !== undefined && <span className="gc-dist-badge">{dist} min</span>}
      </div>
      <div className="gc-body">
        <div className="gc-name">
          <span className="gc-name-emoji" aria-hidden>{g.emoji}</span>
          {g.nom}
        </div>
        {g.accroche && <div className="gc-accroche">{g.accroche}</div>}
        {g.types && (
          <div className="gc-tags">
            {g.types.map(t => <span key={t} className="gc-tag">{t}</span>)}
          </div>
        )}
      </div>
      <div className="gc-foot">Découvrir →</div>
    </a>
  );
}

/* ─── Newsletter ─────────────────────────────────────────────── */
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");

  const submit = async (e) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) { setState("err"); return; }
    setState("sending");
    try {
      const r = await fetch("/api/newsletter-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "guide-hub" }),
      });
      const d = await r.json().catch(() => ({}));
      setState(r.ok && d.ok ? "ok" : "err");
    } catch { setState("err"); }
  };

  return (
    <section className="g2-news">
      <div className="g2-ctn g2-news-inner">
        <div className="g2-news-pre">— Avant de partir</div>
        <h2>Recevez notre <em>guide PDF du Sud</em></h2>
        <p>Adresses d'initiés, criques secrètes, tables sans touristes — notre carnet personnel, gratuit, dans votre boîte mail.</p>
        {state === "ok" ? (
          <div className="g2-news-ok">✓ C'est noté ! Vous recevrez le guide très vite. À bientôt en Martinique.</div>
        ) : (
          <form className="g2-news-form" onSubmit={submit}>
            <input type="email" required placeholder="votre@email.com" value={email}
              onChange={e => { setEmail(e.target.value); if (state === "err") setState("idle"); }}
              aria-label="Votre adresse email" />
            <button type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Envoi…" : "Recevoir le guide →"}
            </button>
          </form>
        )}
        {state === "err" && <div className="g2-news-err">Une erreur est survenue — vérifiez votre email ou réessayez.</div>}
        <div className="g2-news-legal">Pas de spam. Désinscription en un clic. En vous inscrivant, vous acceptez notre <a href="/politique-confidentialite" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>politique de confidentialité</a>.</div>
      </div>
    </section>
  );
}

/* ─── Composant principal ────────────────────────────────────── */
const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };

export default function Guide() {
  const [filterZone, setFilterZone] = useState("tous");
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterDist, setFilterDist] = useState(999);
  const [filterVilla, setFilterVilla] = useState("amaryllis");
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const toggleType = (key) =>
    setFilterTypes(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);

  const shown = ALL_GUIDES.filter(g => {
    if (filterZone !== "tous" && g.zone !== filterZone) return false;
    if (filterTypes.length > 0 && !filterTypes.some(t => g.types?.includes(t))) return false;
    if (filterDist < 999) {
      const d = g.dist?.[filterVilla];
      if (d !== undefined && d > filterDist) return false;
    }
    return true;
  });

  const hasFilter = filterZone !== "tous" || filterTypes.length > 0 || filterDist < 999;

  const reset = () => { setFilterZone("tous"); setFilterTypes([]); setFilterDist(999); };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SEOMeta
        title="Guides Martinique — Toute l'île par vos hôtes | Amaryllis"
        description="27 guides de destination en Martinique : plages, randonnées, rhum, gastronomie, volcan. Du Sud aux hauteurs du Nord — filtrez par zone, type et distance depuis votre villa."
        canonical="/guide-hub"
        image="https://villamaryllis.com/photos/martinique-panorama.jpg"
        type="website"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "FAQPage",
            "mainEntity": faqs.map(f => ({
              "@type": "Question", "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a },
            })),
          },
          {
            "@type": "CollectionPage",
            "name": "Guides Martinique — Toute l'île par vos hôtes",
            "description": "27 guides de destination en Martinique — Sud, Centre, Nord, thématiques.",
            "url": `${BASE}/guide-hub`,
            "image": `${BASE}/photos/martinique-panorama.jpg`,
            "publisher": { "@id": `${BASE}/#organization` },
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${BASE}/` },
              { "@type": "ListItem", "position": 2, "name": "Guides Martinique", "item": `${BASE}/guide-hub` },
            ],
          },
          {
            "@type": "ItemList",
            "name": "Guides de destination — Martinique",
            "itemListElement": ALL_GUIDES.map((it, i) => ({
              "@type": "ListItem", "position": i + 1, "name": it.nom, "url": `${BASE}${it.href}`,
            })),
          },
        ],
      })}} />

      {/* ── Top bar ── */}
      <header className="g2-top">
        <a className="brand" href="/">
          <span className="b1">Amaryllis</span>
          <span className="b2">Locations d'exception</span>
        </a>
        <div className="pagetitle">Guides Martinique <em>par vos hôtes</em></div>
        <a className="explorer-link" href="/explorer">🗺️ Carte →</a>
      </header>

      {/* ── Hero ── */}
      <section className="g2-hero">
        {HERO_SLIDES.map((slide, i) => (
          <a
            key={slide.photo}
            href={slide.href}
            className={`carousel-slide${heroIdx === i ? " active" : ""}`}
            style={{ backgroundImage: `url(${slide.photo})` }}
            aria-label={slide.nom}
          />
        ))}
        <div className="g2-hero-content">
          <div className="pre">— 27 guides rédigés par vos hôtes</div>
          <h1>La <em>Martinique</em></h1>
          <p className="lede">Du Rocher du Diamant aux pentes de la Pelée — chaque coin de l'île a sa propre histoire. Nos guides vous y emmènent, avec les adresses que seuls les locaux connaissent.</p>
          <a href="/" className="hero-cta" data-cta-reservation>Voir nos 7 villas →</a>
        </div>
      </section>

      {/* ── Trust band ── */}
      <div className="g2-trust">
        <div className="g2-ctn g2-trust-row">
          <span><b>27 guides</b> · toute la Martinique</span>
          <span>Du Sud au <b>volcan</b> — l'île entière</span>
          <span>Hôtes locaux · conseils d'<b>initiés</b></span>
          <span>Filtrez par commune, type, distance</span>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="g2-filter">
        {/* Row 1 : Zones */}
        <div className="g2-filter-row">
          {ZONES.map(z => (
            <button key={z.key} className={`gz-tab${filterZone === z.key ? " active" : ""}`}
              onClick={() => setFilterZone(z.key)}>
              {z.label}
            </button>
          ))}
        </div>
        {/* Row 2 : Types + Distance + Villa */}
        <div className="g2-filter-row">
          {FILTER_TYPES.map(ft => (
            <button key={ft.key}
              className={`gtype-chip${filterTypes.includes(ft.key) ? " active" : ""}`}
              onClick={() => toggleType(ft.key)}>
              <span aria-hidden>{ft.emoji}</span>{ft.label || ft.key}
            </button>
          ))}
          <span className="g2-filter-sep" />
          {DIST_OPTS.map(d => (
            <button key={d.max}
              className={`gdist-btn${filterDist === d.max ? " active" : ""}`}
              onClick={() => setFilterDist(d.max)}>
              {d.label}
            </button>
          ))}
          {filterDist < 999 && (
            <>
              <span className="g2-filter-sep" />
              <span className="gvilla-lbl">depuis</span>
              <select className="gvilla-sel" value={filterVilla}
                onChange={e => setFilterVilla(e.target.value)}>
                {VILLA_OPTS.map(v => (
                  <option key={v.id} value={v.id}>{v.nom}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* ── Guides filtrés ── */}
      <div className="g2-ctn">
        <div className="gc-bar">
          <span className="gc-count">
            <b>{shown.length}</b> guide{shown.length > 1 ? "s" : ""} ·{" "}
            {filterZone === "tous" ? "toute la Martinique" : ZONE_LABELS[filterZone]}
            {filterTypes.length > 0 && ` · ${filterTypes.join(", ")}`}
          </span>
          {hasFilter && (
            <button className="gc-reset" onClick={reset}>Réinitialiser</button>
          )}
        </div>
        <div className="gc-grid">
          {shown.map(g => <GuideCard key={g.href} g={g} villa={filterVilla} />)}
          {shown.length === 0 && (
            <div className="gc-empty">
              <p>Aucun guide pour ces critères — essayez une autre combinaison.</p>
              <button className="btn-coral" onClick={reset}>Réinitialiser les filtres</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Contenu long-forme ── */}
      <div className="g2-ctn">
        <div className="g2-longform">
          {GUIDE_HUB_SECTIONS.map(s => (
            <section key={s.h2} className="g2-lf-block">
              <h2>{s.h2}</h2>
              <div dangerouslySetInnerHTML={{ __html: s.html }} />
            </section>
          ))}
        </div>
      </div>

      {/* ── Newsletter ── */}
      <NewsletterForm />

      {/* ── CTA carte interactive ── */}
      <div className="g2-ctn">
        <div className="g2-map-cta">
          <div>
            <p style={{ color:"#c47254", fontSize:11, letterSpacing:"0.25em", textTransform:"uppercase", margin:"0 0 6px", fontFamily:"'Jost',sans-serif", fontWeight:300 }}>
              Nouveau
            </p>
            <p style={{ color:"#faf5e9", fontFamily:"'Jost',sans-serif", fontWeight:300, fontSize:20, letterSpacing:"0.05em", margin:"0 0 5px" }}>
              🗺️ Carte interactive du Sud Martinique
            </p>
            <p style={{ color:"rgba(250,245,233,0.6)", fontSize:13, margin:0, fontFamily:"'Jost',sans-serif", fontWeight:300 }}>
              Filtrez par activité · Épinglez vos spots · Composez votre séjour
            </p>
          </div>
          <a href="/explorer" className="lnk">Ouvrir la carte →</a>
        </div>
      </div>

      {/* ── Section hôtes ── */}
      <section className="g2-host">
        <div className="g2-ctn">
          <div className="g2-host-grid">
            <div className="g2-host-portrait" />
            <div className="g2-host-text">
              <div className="pre">— Vos hôtes locaux</div>
              <h3>Martiniquais, <em>et fiers de vous le faire vivre</em></h3>
              <p>
                Vincent et Céline gèrent ces villas <em>depuis plusieurs années</em>. Nés en Martinique, nous y avons grandi — et c'est cette île que nous avons envie de vous transmettre, pas une brochure.
              </p>
              <p>
                Pas d'agence anonyme, pas de gestionnaire à 6 000 km. Quand vous arrivez, c'est nous qui vous accueillons. Quand vous avez une question le soir, c'est notre numéro WhatsApp qui répond — souvent en quelques minutes, toujours dans la même journée.
              </p>
              <p>
                Nous connaissons <em>la</em> table où dîner sans touriste, <em>la</em> crique où la mer est lisse à 7 h du matin, <em>le</em> guide qui sait où voir les tortues. Tout ça ne se met pas dans un guide papier — on vous le raconte sur place.
              </p>
              <div className="g2-host-signoff">
                <span className="name">Vincent &amp; Céline</span>
                <span className="role">Vos hôtes · Sainte-Luce, Martinique</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="g2-final">
        <div className="g2-ctn">
          <div className="pre">Prêt à explorer</div>
          <h3>Posez vos valises, <em>on s'occupe du reste</em></h3>
          <p>Choisissez votre villa, on vous envoie notre guide personnalisé du Sud — adresses, horaires, contacts locaux — 48 h avant votre arrivée.</p>
          <div className="actions">
            <a href="/" className="btn-coral" data-cta-reservation>Voir nos villas →</a>
            <a href="https://wa.me/33610880772" target="_blank" rel="noopener noreferrer" className="btn-wa">WhatsApp — on en parle</a>
          </div>
        </div>
      </section>

      {/* ── Séminaires ── */}
      <section style={{ background: "#f5efe0", padding: "56px 0", borderTop: "1px solid #e8dcc8" }}>
        <div className="g2-ctn">
          <a href="/seminaires" style={{ textDecoration: "none", display: "block" }}>
            <div style={{ background: "linear-gradient(135deg, #0e3b3a 0%, #163f3e 100%)", borderRadius: 18, padding: "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(14,59,58,0.22)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c47254", marginBottom: 10 }}>Entreprises &amp; équipes</div>
                <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.06em", textTransform: "uppercase", color: "#faf5e9", margin: "0 0 10px", lineHeight: 1.1 }}>
                  Séminaire en villa<br /><em style={{ fontStyle: "normal", fontWeight: 400, color: "#c47254" }}>face aux Caraïbes</em>
                </h3>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.65, color: "rgba(250,245,233,0.72)", margin: 0, maxWidth: 460 }}>
                  Villa Amaryllis en exclusivité — 3 chambres, piscine débordement, terrasse 100 m² vue mer. Idéal pour séminaires jusqu'à 8 personnes. Devis sous 24 h.
                </p>
              </div>
              <span style={{ display: "inline-block", padding: "13px 28px", background: "#c47254", color: "#faf5e9", borderRadius: 10, fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Voir l'offre →
              </span>
            </div>
          </a>
        </div>
      </section>

      {/* ── Savoir avant de partir ── */}
      <div style={{ background: "linear-gradient(135deg,#091f1f 0%,#0e3b3a 100%)", padding: "72px 0" }}>
        <div className="g2-ctn">
          <h2 style={{ fontFamily: "'Jost',sans-serif", fontWeight: 200, fontSize: 26, letterSpacing: "0.08em", textTransform: "uppercase", color: "#faf5e9", margin: "0 0 28px" }}>
            🌴 Savoir avant de partir
          </h2>
          <div className="g2-info-grid">
            {[
              { label: "Aéroport",        value: "Fort-de-France (FDF) — vols directs Paris (8h), Miami (4h)" },
              { label: "Voiture",          value: <><span>Indispensable — location 40–70 €/jour. </span><LienAffilie partenaire="discoverCars" utmContent="guide-savoir-avant" showDisclosure={false} style={{ display: "inline" }}>Comparer les offres →</LienAffilie></> },
              { label: "Excursions",       value: <><span>Mer, plongée, distilleries, randonnées. </span><LienAffilie partenaire="getYourGuide" utmContent="guide-savoir-avant-excursions" showDisclosure={false} style={{ display: "inline" }}>Voir toutes les activités →</LienAffilie></> },
              { label: "Meilleure saison", value: "Déc–Avr (sec, alizés, mer calme) · Réservez 3–6 mois avant" },
              { label: "Monnaie & langue", value: "Euro (€) · Français · Créole martiniquais" },
            ].map(item => (
              <div key={item.label} className="g2-info-card">
                <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c47254", marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "rgba(250,245,233,0.8)", lineHeight: 1.5 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ background: "#faf5e9", padding: "72px 0" }}>
        <div className="g2-ctn">
          <h2 style={{ fontFamily: "'Jost',sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0e3b3a", marginBottom: 28 }}>
            Questions fréquentes
          </h2>
          <div style={{ background: "#f4ecdc", border: "1px solid #e0d4bc", borderRadius: 16, padding: "4px 24px" }}>
            {faqs.map((faq, i) => (
              <FAQAccordion key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="g2-footer">
        <p>© {new Date().getFullYear()} Amaryllis Locations · <a href="/">villamaryllis.com</a></p>
      </footer>
        <MaillageCluster currentSlug="guide-hub" bienNames={BIEN_NAMES} />
    </>
  );
}
