// Guide.jsx — /guide — Hub Martinique v2 · design system Amaryllis

import { useState } from "react";
import SEOMeta from "./SEOMeta.jsx";
import { FAQAccordion } from "./primitives.jsx";
import { GUIDES_INDEX } from "./data/guidesIndex.js";
import { GUIDE_HUB_SECTIONS } from "./data/guideHubSections.js";

const BASE = "https://villamaryllis.com";

/* ─── Villas (pour les distances) ─────────────────────────── */
const VILLAS = [
  { id:"amaryllis",  nom:"Amaryllis",  couleur:"#10b981" },
  { id:"zandoli",    nom:"Zandoli",    couleur:"#3b82f6" },
  { id:"geko",       nom:"Géko",       couleur:"#f59e0b" },
  { id:"mabouya",    nom:"Mabouya",    couleur:"#ec4899" },
  { id:"iguana",     nom:"Iguana",     couleur:"#6366f1" },
  { id:"schoelcher", nom:"Bellevue",   couleur:"#8b5cf6" },
];

/* ─── Destinations ─────────────────────────────────────────── */
const destinations = [
  {
    href: "/guide-sainte-anne",
    photo: "https://villamaryllis.com/photos/amaryllis/01.webp",
    emoji: "🏖️",
    nom: "Sainte-Anne & Les Salines",
    accroche: "La plus belle plage des Caraïbes — arrivez avant 9h",
    tags: ["Plage", "Kitesurf", "Catamaran"],
    must: true,
    distFrom: { amaryllis:15, zandoli:15, geko:14, mabouya:14, iguana:16, schoelcher:45 },
  },
  {
    href: "/guide-arlet",
    photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Ponton_et_%C3%89glise_Saint-Henri_des_Anses-d'Arlet.jpg",
    emoji: "🐢",
    nom: "Anses d'Arlet",
    accroche: "Nager avec les tortues — garanties tôt le matin",
    tags: ["Tortues", "Snorkeling", "Pêcheurs"],
    must: true,
    distFrom: { amaryllis:25, zandoli:24, geko:25, mabouya:25, iguana:25, schoelcher:55 },
  },
  {
    href: "/guide-le-diamant",
    photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Rocher_du_Diamant_Martinique.jpg",
    emoji: "🗿",
    nom: "Le Diamant",
    accroche: "Plongée d'exception face au Rocher mythique",
    tags: ["Plongée", "Histoire", "Coucher de soleil"],
    must: false,
    distFrom: { amaryllis:20, zandoli:21, geko:20, mabouya:20, iguana:22, schoelcher:42 },
  },
  {
    href: "/guide-trois-ilets",
    photo: "/photos/trois-ilets.avif",
    emoji: "⚓",
    nom: "Les Trois-Îlets",
    accroche: "Village créole, marina & coucher de soleil sur la baie",
    tags: ["Culture", "Histoire", "Distillerie"],
    must: false,
    distFrom: { amaryllis:35, zandoli:35, geko:34, mabouya:34, iguana:36, schoelcher:30 },
  },
  {
    href: "/activites-sainte-luce",
    photo: "/photos/amaryllis/05.webp",
    emoji: "🌟",
    nom: "10 activités incontournables",
    accroche: "La sélection de vos hôtes — testée et approuvée",
    tags: ["Excursions", "Nature", "Culture"],
    must: false,
    distFrom: { amaryllis:0, zandoli:0, geko:0, mabouya:0 },
    customDist: "Toutes accessibles en < 30 min depuis vos villas",
  },
  {
    href: "/guide-proximite",
    photo: "/photos/amaryllis/03.webp",
    emoji: "📍",
    nom: "À 15 min de la villa",
    accroche: "Plages secrètes, distillerie Trois-Rivières, sentiers tropicaux",
    tags: ["Plages", "Rhum", "Randonnée"],
    must: false,
    distFrom: { amaryllis:15, zandoli:15, geko:15, mabouya:15 },
    customDist: "Amaryllis · Zandoli · Géko · Mabouya",
  },
];

/* ─── Villas les plus proches d'une destination ─────────────── */
function closestVillas(distFrom, max = 3) {
  return VILLAS
    .map(v => ({ ...v, min: distFrom[v.id] ?? null }))
    .filter(v => v.min !== null)
    .sort((a, b) => a.min - b.min)
    .slice(0, max);
}

/* ─── FAQ ───────────────────────────────────────────────────── */
const faqs = [
  { q: "Combien coûte la location d'une villa à Sainte-Luce ?", a: "À partir de 110€/nuit (Mabouya, jacuzzi privatif) jusqu'à 280€/nuit (Villa Amaryllis, piscine à débordement eau salée 4×7 m, vue mer 180°, 3 chambres, 8 personnes). En réservant directement, vous évitez les frais Airbnb — jusqu'à 14% d'économie." },
  { q: "Quelle villa choisir avec piscine à débordement ?", a: "La Villa Amaryllis est notre propriété phare : piscine infinity eau salée 4×7 m, terrasse 100m² vue Caraïbe 180°, 3 chambres climatisées, 8 personnes. Zandoli et Géko offrent chacune une piscine privative à cascade dès 150€/nuit. Iguana propose la seule piscine eau salée non chlorée de la résidence." },
  { q: "Comment réserver sans passer par Airbnb ?", a: "Directement sur villamaryllis.com — sélectionnez votre logement, choisissez vos dates, payez par carte (Stripe sécurisé). Contact direct WhatsApp avec l'hôte inclus." },
  { q: "Peut-on venir avec des animaux ?", a: "Oui, la Villa Amaryllis et la Villa Iguana acceptent les animaux (supplément 40€/séjour, max 2 animaux). Mentionnez-le à la réservation." },
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
  .g2-top .brand {
    text-decoration: none; display: flex; flex-direction: column;
    gap: 1px; flex-shrink: 0;
  }
  .g2-top .brand .b1 {
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: 14px;
    letter-spacing: 0.38em; text-transform: uppercase; color: #faf5e9; line-height: 1;
  }
  .g2-top .brand .b2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 8px;
    letter-spacing: 0.42em; text-transform: uppercase; color: rgba(250,245,233,0.5); line-height: 1;
  }
  .g2-top .pagetitle {
    flex: 1; text-align: center;
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: 13px;
    letter-spacing: 0.32em; text-transform: uppercase; color: #faf5e9; margin: 0;
  }
  .g2-top .pagetitle em {
    font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400;
    color: #c9a673; letter-spacing: 0.02em; text-transform: none; margin-left: 6px;
  }
  .g2-top .explorer-link {
    color: rgba(250,245,233,0.65); text-decoration: none;
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 12px; letter-spacing: 0.1em;
    white-space: nowrap;
  }
  .g2-top .explorer-link:hover { color: #faf5e9; }

  /* ── Hero ── */
  .g2-hero {
    position: relative; height: 540px; overflow: hidden;
  }
  .g2-hero .bg {
    position: absolute; inset: -24px;
    background: #0e2020 url('https://commons.wikimedia.org/wiki/Special:FilePath/Martinique-11-Les_Salines_Beach.jpg') center/cover;
    animation: kenburns 28s ease-in-out infinite alternate;
  }
  @keyframes kenburns {
    0%   { transform: scale(1.04); }
    100% { transform: scale(1.10) translate(-12px, -4px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .g2-hero .bg { animation: none; transform: scale(1.04); }
  }
  /* Voile bas + voile latéral gauche (style editorial) pour lisibilité du titre */
  .g2-hero::after {
    content: ""; position: absolute; inset: 0;
    background:
      linear-gradient(90deg, rgba(14,59,58,0.55) 0%, rgba(14,59,58,0.12) 50%, rgba(14,59,58,0) 70%),
      linear-gradient(180deg, rgba(14,59,58,0.30) 0%, rgba(14,59,58,0) 35%, rgba(14,59,58,0.74) 100%);
  }
  .g2-hero-content {
    position: absolute; inset: 0; z-index: 2;
    display: flex; flex-direction: column; justify-content: center;
    padding: 0 64px; color: #faf5e9;
  }
  .g2-hero-content .pre {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: 18px; letter-spacing: 0.04em; color: #c9a673; margin-bottom: 22px;
  }
  .g2-hero-content h1 {
    font-family: 'Jost', sans-serif; font-weight: 200;
    font-size: clamp(40px, 7vw, 88px); letter-spacing: 0.14em;
    text-transform: uppercase; color: #faf5e9; line-height: 0.98; margin: 0 0 22px;
    max-width: 800px;
  }
  .g2-hero-content h1 em {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-weight: 400; color: #c9a673; letter-spacing: 0; text-transform: none;
  }
  .g2-hero-content .lede {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: clamp(17px, 1.6vw, 22px); line-height: 1.55;
    color: rgba(250,245,233,0.92); max-width: 560px; margin: 0;
  }
  .g2-hero-content .hero-cta {
    display: inline-block; margin-top: 30px; align-self: flex-start;
    background: #c47254; color: #fff; text-decoration: none;
    padding: 15px 34px; border-radius: 8px;
    font-family: 'Jost', sans-serif; font-weight: 600; font-size: 13px;
    letter-spacing: 0.14em; text-transform: uppercase;
    box-shadow: 0 6px 24px rgba(0,0,0,0.28);
    transition: transform 0.2s, background 0.2s;
  }
  .g2-hero-content .hero-cta:hover { transform: translateY(-2px); background: #b3633f; }

  /* ── Bandeau réassurance ── */
  .g2-trust { background: #0e3b3a; border-top: 1px solid rgba(250,245,233,0.08); }
  .g2-trust-row {
    display: flex; flex-wrap: wrap; justify-content: center; align-items: center;
    gap: 10px 28px; padding: 14px 28px;
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 12.5px;
    letter-spacing: 0.03em; color: rgba(250,245,233,0.72);
  }
  .g2-trust-row span { white-space: nowrap; }
  .g2-trust-row b { color: #c9a673; font-weight: 500; }
  .g2-trust-row span + span { border-left: 1px solid rgba(250,245,233,0.14); padding-left: 28px; }
  @media (max-width: 760px) {
    .g2-trust-row span + span { border-left: none; padding-left: 0; }
  }

  /* ── Container ── */
  .g2-ctn { max-width: 1200px; margin: 0 auto; padding: 0 28px; box-sizing: border-box; }

  /* ── Intro ── */
  .g2-intro {
    padding: 86px 0 56px; max-width: 760px; margin: 0 auto; text-align: center;
  }
  .g2-intro .pre {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px;
    letter-spacing: 0.55em; text-transform: uppercase; color: #c47254; margin-bottom: 18px;
  }
  .g2-intro h2 {
    font-family: 'Jost', sans-serif; font-weight: 200;
    font-size: clamp(26px, 4vw, 38px); letter-spacing: 0.10em;
    text-transform: uppercase; color: #0e3b3a; margin: 0 0 20px; line-height: 1.1;
  }
  .g2-intro h2 em {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-weight: 400; color: #c47254; letter-spacing: 0; text-transform: none;
  }
  .g2-intro p {
    font-family: 'Cormorant Garamond', serif; font-size: 19px;
    line-height: 1.75; color: #0e3b3a; margin: 0;
  }

  /* ── Grille destinations ── */
  .g2-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    padding: 0 0 96px;
  }
  .g2-dcard {
    background: #fff; border: 1px solid #e0d4bc; border-radius: 18px;
    overflow: hidden; cursor: pointer; text-decoration: none;
    transition: transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s;
    box-shadow: 0 4px 24px rgba(14,59,58,0.06);
    display: block; color: inherit;
  }
  .g2-dcard:hover { transform: translateY(-5px); box-shadow: 0 24px 56px rgba(14,59,58,0.18); }
  .g2-dcard .photo {
    position: relative; height: 220px;
    background: #0e2020 center/cover no-repeat;
  }
  .g2-dcard .photo::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 50%, rgba(14,59,58,0.72));
  }
  .g2-dcard .must-badge {
    position: absolute; top: 14px; left: 14px; z-index: 2;
    background: #c47254; color: #fff;
    padding: 4px 12px; border-radius: 999px;
    font-family: 'Jost', sans-serif; font-weight: 700; font-size: 9px;
    letter-spacing: 0.22em; text-transform: uppercase;
  }
  .g2-dcard .photo-name {
    position: absolute; bottom: 16px; left: 20px; right: 20px; z-index: 2; color: #fff;
  }
  .g2-dcard .photo-name .emo { font-size: 18px; margin-right: 6px; }
  .g2-dcard .photo-name .nm {
    font-family: 'Jost', sans-serif; font-weight: 400; font-size: 19px;
    letter-spacing: 0.1em; text-transform: uppercase;
    display: block; margin-bottom: 5px;
  }
  .g2-dcard .photo-name .accroche {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: 14px; line-height: 1.4; color: rgba(255,255,255,0.85);
  }
  .dcard-main { display: block; color: inherit; text-decoration: none; }
  .g2-dcard .tags { display: flex; gap: 5px; flex-wrap: wrap; padding: 16px 20px 14px; }
  .g2-dcard .tag {
    background: #f4ecdc; border: 1px solid #e0d4bc;
    padding: 3px 9px; border-radius: 4px;
    font-family: 'Jost', sans-serif; font-weight: 400; font-size: 10px; color: #7a6b5a;
  }
  .g2-dcard .villas {
    border-top: 1px solid #e0d4bc; margin: 0 20px 18px; padding-top: 12px;
  }
  .g2-dcard .villas-lbl {
    font-family: 'Jost', sans-serif; font-weight: 600; font-size: 9px;
    letter-spacing: 0.22em; text-transform: uppercase; color: #7a6b5a;
    margin-bottom: 8px;
  }
  .g2-dcard .villa-row {
    display: flex; align-items: center; gap: 8px; padding: 5px 0;
    font-family: 'Jost', sans-serif; font-size: 12px;
  }
  .g2-dcard .villa-row .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .g2-dcard .villa-row .vnm { flex: 1; color: #0e3b3a; font-weight: 500; }
  .g2-dcard .villa-row .vmin { color: #c47254; font-weight: 500; }
  /* Lignes villas cliquables → fiche bien (pont inspiration→réservation) */
  a.villa-link { text-decoration: none; color: inherit; border-radius: 6px; margin: 0 -8px; padding: 5px 8px; transition: background 0.15s; }
  a.villa-link:hover { background: #f4ecdc; }
  a.villa-link:hover .vmin::after { content: " →"; }

  /* ── Contenu long-forme ── */
  .g2-longform { max-width: 820px; margin: 0 auto; padding: 0 0 72px; }
  .g2-lf-block { margin-bottom: 36px; }
  .g2-lf-block h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 22px; letter-spacing: 0.02em;
    color: #0e3b3a; margin: 0 0 12px; padding-left: 14px; border-left: 3px solid #c47254;
  }
  .g2-lf-block p { font-family: 'Cormorant Garamond', serif; font-size: 18px; line-height: 1.7; color: #3a3530; margin: 0; }
  .g2-lf-block a { color: #c47254; text-decoration: underline; text-underline-offset: 2px; }
  .g2-lf-block a:hover { color: #0e3b3a; }
  .g2-lf-block strong { color: #0e3b3a; font-weight: 600; }

  /* ── Newsletter / guide PDF ── */
  .g2-news { background: linear-gradient(135deg, #0e3b3a 0%, #163f3e 100%); padding: 60px 0; }
  .g2-news-inner { max-width: 640px; margin: 0 auto; text-align: center; }
  .g2-news-pre { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 17px; color: #c9a673; margin-bottom: 12px; }
  .g2-news h2 { font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(24px, 4vw, 34px); letter-spacing: 0.06em; text-transform: uppercase; color: #faf5e9; margin: 0 0 14px; }
  .g2-news h2 em { font-family: 'Cormorant Garamond', serif; font-style: italic; color: #c47254; letter-spacing: 0; text-transform: none; }
  .g2-news p { font-family: 'Cormorant Garamond', serif; font-size: 18px; line-height: 1.6; color: rgba(250,245,233,0.82); margin: 0 0 26px; }
  .g2-news-form { display: flex; gap: 10px; max-width: 480px; margin: 0 auto; flex-wrap: wrap; }
  .g2-news-form input {
    flex: 1; min-width: 200px; padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(250,245,233,0.25);
    background: rgba(250,245,233,0.06); color: #faf5e9; font-family: 'Jost', sans-serif; font-size: 14px;
  }
  .g2-news-form input::placeholder { color: rgba(250,245,233,0.45); }
  .g2-news-form input:focus { outline: none; border-color: #c9a673; }
  .g2-news-form button {
    background: #c47254; color: #fff; border: none; padding: 14px 26px; border-radius: 8px; cursor: pointer;
    font-family: 'Jost', sans-serif; font-weight: 600; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
    transition: background 0.2s, transform 0.2s; white-space: nowrap;
  }
  .g2-news-form button:hover:not(:disabled) { background: #b3633f; transform: translateY(-2px); }
  .g2-news-form button:disabled { opacity: 0.6; cursor: default; }
  .g2-news-ok { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 19px; color: #c9a673; padding: 14px 0; }
  .g2-news-err { color: #f0a; font-size: 13px; margin-top: 10px; font-family: 'Jost', sans-serif; color: #e8927c; }
  .g2-news-legal { font-family: 'Jost', sans-serif; font-size: 11px; color: rgba(250,245,233,0.45); margin-top: 14px; letter-spacing: 0.04em; }

  /* ── CTA carte interactive ── */
  .g2-map-cta {
    background: linear-gradient(135deg, #091f1f 0%, #0e3b3a 100%);
    border-radius: 16px; padding: 28px 32px; margin-bottom: 80px;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;
  }
  .g2-map-cta .lnk {
    display: inline-flex; align-items: center; gap: 8px;
    background: #c47254; color: white; text-decoration: none;
    padding: 12px 26px; border-radius: 100px; font-size: 13px; font-weight: 600;
    font-family: 'Jost', sans-serif; letter-spacing: 0.06em; white-space: nowrap;
    transition: background .2s;
  }
  .g2-map-cta .lnk:hover { background: #a85a3f; }

  /* ── Index complet des guides ── */
  .g2-index { margin-bottom: 64px; }
  .g2-index-head { text-align: center; max-width: 620px; margin: 0 auto 32px; }
  .g2-index-head h2 { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 28px; letter-spacing: 0.04em; color: #0e3b3a; margin: 8px 0 10px; }
  .g2-index-head h2 em { font-family: 'Cormorant Garamond', serif; font-style: italic; color: #c47254; }
  /* Pastille emoji premium (remplace l'emoji nu) */
  .g2-index-group .gi-emoji {
    width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%;
    background: #f4ecdc; border: 1px solid #e0d4bc;
    display: inline-flex; align-items: center; justify-content: center; font-size: 17px;
    transition: background .15s, border-color .15s, transform .15s;
  }
  .g2-index-group a:hover .gi-emoji { background: #fff; border-color: #c47254; transform: scale(1.08); }
  .g2-index-head p { font-size: 15px; color: #7a6b5a; line-height: 1.6; margin: 0; }
  .g2-index-group { margin-bottom: 26px; }
  .g2-index-group h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 12px; letter-spacing: 0.16em;
    text-transform: uppercase; color: #c47254; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e0d4bc;
  }
  .g2-index-group ul {
    list-style: none; margin: 0; padding: 0;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px 18px;
  }
  .g2-index-group a {
    display: flex; align-items: center; gap: 9px; text-decoration: none;
    color: #0e3b3a; font-size: 15px; font-family: 'Jost', sans-serif; font-weight: 300;
    padding: 8px 10px; border-radius: 8px; transition: background .15s, color .15s;
  }
  .g2-index-group a:hover { background: #f4ecdc; color: #c47254; }
  .g2-index-group .gi-emoji { font-size: 17px; flex-shrink: 0; }

  /* ── Section hôtes ── */
  .g2-host {
    background: #0e3b3a; color: #faf5e9;
    padding: 96px 0; position: relative; overflow: hidden;
  }
  .g2-host::before {
    content: ""; position: absolute; inset: -40px;
    background: url('/photos/amaryllis/11.webp') center/cover;
    opacity: 0.12; filter: blur(2px);
  }
  .g2-host-grid {
    position: relative; z-index: 2;
    display: grid; grid-template-columns: 1fr 1.3fr; gap: 56px; align-items: center;
  }
  .g2-host-portrait {
    aspect-ratio: 16/9;
    background: #0e2020 url('/photos/hosts.webp') center top/cover;
    border-radius: 18px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.40);
    position: relative;
  }
  .g2-host-portrait::after {
    content: ""; position: absolute; inset: 0; border-radius: 18px;
    border: 1px solid rgba(201,166,115,0.4);
  }
  .g2-host-text .pre {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px;
    letter-spacing: 0.55em; text-transform: uppercase; color: #c9a673; margin-bottom: 22px;
  }
  .g2-host-text h3 {
    font-family: 'Jost', sans-serif; font-weight: 200;
    font-size: clamp(30px, 4.4vw, 50px); letter-spacing: 0.10em;
    text-transform: uppercase; color: #faf5e9; line-height: 1.05; margin: 0 0 28px;
  }
  .g2-host-text h3 em {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-weight: 400; color: #c47254; letter-spacing: 0; text-transform: none;
  }
  .g2-host-text p {
    font-family: 'Cormorant Garamond', serif;
    font-size: 19px; line-height: 1.75; color: rgba(250,245,233,0.85); margin: 0 0 18px;
  }
  .g2-host-text p em { color: #c9a673; font-style: italic; }
  .g2-host-signoff {
    margin-top: 28px; display: flex; align-items: center; gap: 14px;
    border-top: 1px solid rgba(250,245,233,0.15); padding-top: 22px;
  }
  .g2-host-signoff .name {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: 22px; color: #c9a673;
  }
  .g2-host-signoff .role {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px;
    letter-spacing: 0.18em; text-transform: uppercase; color: rgba(250,245,233,0.6);
    border-left: 1px solid rgba(250,245,233,0.2); padding-left: 14px;
  }

  /* ── Final CTA ── */
  .g2-final {
    background: #f4ecdc; padding: 96px 0; text-align: center;
  }
  .g2-final .pre {
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: 11px;
    letter-spacing: 0.55em; text-transform: uppercase; color: #c47254; margin-bottom: 20px;
  }
  .g2-final h3 {
    font-family: 'Jost', sans-serif; font-weight: 200;
    font-size: clamp(28px, 4.4vw, 46px); letter-spacing: 0.10em;
    text-transform: uppercase; color: #0e3b3a; margin: 0 0 18px; line-height: 1.05;
  }
  .g2-final h3 em {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-weight: 400; color: #c47254; letter-spacing: 0; text-transform: none;
  }
  .g2-final p {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: 19px; color: #7a6b5a; max-width: 540px; margin: 0 auto 36px; line-height: 1.55;
  }
  .g2-final .actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .btn-coral {
    background: #c47254; color: #fff; border: none;
    padding: 16px 32px; border-radius: 6px;
    font-family: 'Jost', sans-serif; font-weight: 600; font-size: 13px;
    letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer;
    box-shadow: 0 4px 18px rgba(196,114,84,0.40);
    transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
    text-decoration: none; display: inline-block;
  }
  .btn-coral:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(196,114,84,0.5); background: #b3633f; }
  .btn-wa {
    background: #25D366; color: #fff; padding: 16px 28px; border-radius: 6px;
    text-decoration: none;
    font-family: 'Jost', sans-serif; font-weight: 600; font-size: 13px;
    letter-spacing: 0.14em; text-transform: uppercase;
    box-shadow: 0 4px 22px rgba(37,211,102,0.40);
    display: inline-block;
  }
  .btn-wa:hover { background: #1fb856; }

  /* ── FAQ — géré par FAQAccordion (React) ── */

  /* ── Footer ── */
  .g2-footer {
    background: #0e3b3a; padding: 24px; text-align: center;
  }
  .g2-footer p { color: rgba(250,245,233,0.4); font-size: 13px; margin: 0; font-family: 'Jost', sans-serif; }
  .g2-footer a { color: rgba(250,245,233,0.4); text-decoration: none; }

  /* ── Savoir avant de partir ── */
  .g2-info-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;
  }
  .g2-info-card {
    background: rgba(250,245,233,0.06); border: 1px solid rgba(250,245,233,0.1);
    border-radius: 12px; padding: 18px 20px;
  }

  /* ── Mobile ── */
  @media (max-width: 960px) {
    .g2-grid { grid-template-columns: repeat(2, 1fr); }
    .g2-hero { height: 440px; }
    .g2-hero-content { padding: 0 24px; }
    .g2-host-grid { grid-template-columns: 1fr; gap: 32px; }
    .g2-host-portrait { max-width: 100%; margin: 0 auto; aspect-ratio: 16/9; }
  }
  @media (max-width: 640px) {
    .g2-grid { grid-template-columns: 1fr; }
    .g2-top h1 { font-size: 11px; letter-spacing: 0.18em; }
    .g2-top .explorer-link { display: none; }
  }
`;

/* ─── DestCard ──────────────────────────────────────────────── */
function DestCard({ d }) {
  const close = d.customDist
    ? null
    : closestVillas(d.distFrom, 3);

  return (
    <div className="g2-dcard">
      <a className="dcard-main" href={d.href}>
        <div className="photo" style={{ backgroundImage: `url("${d.photo}")` }}>
          {d.must && <span className="must-badge">★ Incontournable</span>}
          <div className="photo-name">
            <span className="nm"><span className="emo">{d.emoji}</span>{d.nom}</span>
            <span className="accroche">{d.accroche}</span>
          </div>
        </div>
        <div className="tags">
          {d.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      </a>
      <div className="villas">
        <div className="villas-lbl">
          {d.customDist ? d.customDist : "Réserver une villa proche →"}
        </div>
        {close && close.map(v => (
          <a key={v.id} className="villa-row villa-link" href={`/${v.id}`}>
            <span className="dot" style={{ background: v.couleur }} />
            <span className="vnm">{v.nom}</span>
            <span className="vmin">{v.min} min</span>
          </a>
        ))}
        {d.customDist && (
          <div className="villa-row">
            <span className="dot" style={{ background: "#10b981" }} />
            <span className="vnm">Amaryllis · Zandoli · Géko · Mabouya</span>
            <span className="vmin">★</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Newsletter / guide PDF (capture lead → /api/contact) ──── */
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | ok | err

  const submit = async (e) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) { setState("err"); return; }
    setState("sending");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: "Abonné guide PDF",
          email,
          message: "Demande du guide PDF du Sud Martinique (opt-in newsletter depuis /guide-hub).",
          source: "newsletter-guide-hub",
        }),
      });
      const d = await r.json().catch(() => ({}));
      setState(r.ok && d.ok !== false ? "ok" : "err");
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
            <input
              type="email" required placeholder="votre@email.com"
              value={email} onChange={e => { setEmail(e.target.value); if (state === "err") setState("idle"); }}
              aria-label="Votre adresse email"
            />
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

/* ─── Composant principal ───────────────────────────────────── */
export default function Guide() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SEOMeta
        title="Que faire dans le Sud de la Martinique — Guide d'initiés | Amaryllis"
        description="Que faire dans le Sud de la Martinique ? Le guide de nos hôtes à Sainte-Luce : nos coups de cœur, tous nos guides de destination par zone et nos conseils d'initiés."
        canonical="/guide-hub"
        image="https://commons.wikimedia.org/wiki/Special:FilePath/Martinique-11-Les_Salines_Beach.jpg"
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
            "name": "Que faire dans le Sud de la Martinique — Le guide de nos hôtes",
            "description": "Les Salines, les tortues d'Arlet, la plongée au Diamant — le guide complet du sud de la Martinique depuis nos villas à Sainte-Luce.",
            "url": `${BASE}/guide-hub`,
            "image": `${BASE}/photos/amaryllis/01.webp`,
            "publisher": { "@id": `${BASE}/#organization` },
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${BASE}/` },
              { "@type": "ListItem", "position": 2, "name": "Guide Martinique", "item": `${BASE}/guide-hub` },
            ],
          },
          {
            "@type": "ItemList",
            "name": "Guides de destination — Martinique",
            "itemListElement": GUIDES_INDEX.flatMap(g => g.items).map((it, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "name": it.nom,
              "url": `${BASE}${it.href}`,
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
        <div className="pagetitle">Le Sud Martinique <em>depuis nos villas</em></div>
        <a className="explorer-link" href="/explorer">🗺️ Carte →</a>
      </header>

      {/* ── Hero Ken Burns ── */}
      <section className="g2-hero">
        <div className="bg" />
        <div className="g2-hero-content">
          <div className="pre">— Carnet de voyage signé par vos hôtes</div>
          <h1>Le sud, <em>depuis votre porte</em></h1>
          <p className="lede">Les Salines à 15 min, les tortues d'Arlet à 25, le Rocher du Diamant à 20. Tout est proche — et personne ne vous l'expliquera mieux que nous.</p>
          <a href="/" className="hero-cta" data-cta-reservation>Voir nos 7 villas →</a>
        </div>
      </section>

      {/* ── Bandeau réassurance ── */}
      <div className="g2-trust">
        <div className="g2-ctn g2-trust-row">
          <span><b>4,9/5</b> · 200+ voyageurs</span>
          <span>Réservation directe <b>sans frais</b> (−14% vs Airbnb)</span>
          <span>Hôtes locaux · accueil en personne</span>
          <span>Réponse WhatsApp en quelques minutes</span>
        </div>
      </div>

      {/* ── Intro ── */}
      <div className="g2-ctn">
        <div className="g2-intro">
          <div className="pre">Nos coups de cœur</div>
          <h2>Le Sud, <em>tel qu'on l'aime</em></h2>
          <p>
            Notre équipe vit ici. Nous sommes nés à Sainte-Luce, nous y avons grandi, nous y avons vu les saisons passer. Ce guide n'est pas une liste de spots Instagram — c'est ce qu'on raconterait à un ami qui débarque demain matin.
          </p>
        </div>
      </div>

      {/* ── Grille destinations (coups de cœur) ── */}
      <div className="g2-ctn">
        <div className="g2-grid">
          {destinations.map(d => <DestCard key={d.href} d={d} />)}
        </div>
      </div>

      {/* ── Index complet des guides (maillage SEO) ── */}
      <div className="g2-ctn">
        <div className="g2-index">
          <div className="g2-index-head">
            <div className="pre">Tous nos guides</div>
            <h2>L'île entière, <em>guide par guide</em></h2>
            <p>Plus de 20 guides de destination, du sud à la pointe nord. Choisissez par zone ou par envie.</p>
          </div>
          {GUIDES_INDEX.map(group => (
            <div key={group.zone} className="g2-index-group">
              <h4>{group.label}</h4>
              <ul>
                {group.items.map(it => (
                  <li key={it.href}>
                    <a href={it.href}><span className="gi-emoji" aria-hidden>{it.emoji}</span>{it.nom}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contenu long-forme (densité SEO + intentions secondaires) ── */}
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

      {/* ── Newsletter / guide PDF ── */}
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
                Vincent et Céline gèrent ces villas <em>depuis trois ans</em>. Nés en Martinique, nous y avons grandi — et c'est cette île que nous avons envie de vous transmettre, pas une brochure.
              </p>
              <p>
                Pas d'agence anonyme, pas de gestionnaire à 6 000 km. Quand vous arrivez, c'est nous qui vous accueillons. Quand vous avez une question le soir, c'est notre numéro WhatsApp qui répond — souvent en quelques minutes, toujours dans la même journée.
              </p>
              <p>
                Nous connaissons <em>la</em> table où dîner sans touriste, <em>la</em> crique où la mer est lisse à 7h du matin, <em>le</em> guide qui sait où voir les tortues. Tout ça ne se met pas dans un guide papier — on vous le raconte sur place.
              </p>
              <div className="g2-host-signoff">
                <span className="name">Vincent &amp; Céline</span>
                <span className="role">Vos hôtes · Sainte-Luce, Martinique</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA (B2C — CTA dominant, avant l'offre B2B séminaires) ── */}
      <section className="g2-final">
        <div className="g2-ctn">
          <div className="pre">Prêt à explorer</div>
          <h3>Posez vos valises, <em>on s'occupe du reste</em></h3>
          <p>Choisissez votre villa, on vous envoie notre guide personnalisé du Sud — adresses, horaires, contacts locaux — 48h avant votre arrivée.</p>
          <div className="actions">
            <a href="/" className="btn-coral" data-cta-reservation>Voir nos villas →</a>
            <a href="https://wa.me/33610880772" target="_blank" rel="noopener noreferrer" className="btn-wa">WhatsApp — on en parle</a>
          </div>
        </div>
      </section>

      {/* ── Séminaires (B2B — sous le CTA principal) ── */}
      <section style={{ background: "#f5efe0", padding: "56px 0", borderTop: "1px solid #e8dcc8" }}>
        <div className="g2-ctn">
          <a href="/seminaires" style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              background: "linear-gradient(135deg, #0e3b3a 0%, #163f3e 100%)",
              borderRadius: 18, padding: "36px 40px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 24, flexWrap: "wrap",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(14,59,58,0.22)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c47254", marginBottom: 10 }}>
                  Entreprises &amp; équipes
                </div>
                <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.06em", textTransform: "uppercase", color: "#faf5e9", margin: "0 0 10px", lineHeight: 1.1 }}>
                  Séminaire en villa<br /><em style={{ fontStyle: "normal", fontWeight: 400, color: "#c47254" }}>face aux Caraïbes</em>
                </h3>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.65, color: "rgba(250,245,233,0.72)", margin: 0, maxWidth: 460 }}>
                  Villa Amaryllis en exclusivité — 3 chambres, piscine débordement, terrasse 100 m² vue mer. Idéal pour séminaires jusqu'à 8 personnes. Devis sous 24h.
                </p>
              </div>
              <div style={{ flexShrink: 0 }}>
                <span style={{
                  display: "inline-block", padding: "13px 28px",
                  background: "#c47254", color: "#faf5e9", borderRadius: 10,
                  fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 500,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                }}>
                  Voir l'offre →
                </span>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* ── Savoir avant de partir ── */}
      <div style={{ background:"linear-gradient(135deg,#091f1f 0%,#0e3b3a 100%)", padding:"72px 0" }}>
        <div className="g2-ctn">
          <h2 style={{ fontFamily:"'Jost',sans-serif", fontWeight:200, fontSize:26, letterSpacing:"0.08em", textTransform:"uppercase", color:"#faf5e9", margin:"0 0 28px" }}>
            🌴 Savoir avant de partir
          </h2>
          <div className="g2-info-grid">
            {[
              { label:"Aéroport",         value:"Fort-de-France (FDF) — vols directs Paris (8h), Miami (4h)" },
              { label:"Voiture",           value:"Indispensable — location 40–70€/jour, réservez à l'avance" },
              { label:"Meilleure saison",  value:"Déc–Avr (sec, alizés, mer calme) · Réservez 3–6 mois avant" },
              { label:"Monnaie & langue",  value:"Euro (€) · Français · Créole martiniquais" },
            ].map(item => (
              <div key={item.label} className="g2-info-card">
                <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"#c47254", marginBottom:6 }}>{item.label}</div>
                <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:"rgba(250,245,233,0.8)", lineHeight:1.5 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ background:"#faf5e9", padding:"72px 0" }}>
        <div className="g2-ctn">
          <h2 style={{ fontFamily:"'Jost',sans-serif", fontWeight:200, fontSize:28, letterSpacing:"0.08em", textTransform:"uppercase", color:"#0e3b3a", marginBottom:28 }}>
            Questions fréquentes
          </h2>
          <div style={{ background:"#f4ecdc", border:"1px solid #e0d4bc", borderRadius:16, padding:"4px 24px" }}>
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
    </>
  );
}
