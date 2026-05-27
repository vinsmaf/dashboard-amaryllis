// Guide.jsx — /guide — Hub Martinique v2 · design system Amaryllis

import SEOMeta from "./SEOMeta.jsx";
import { FAQAccordion } from "./primitives.jsx";

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
    photo: "/photos/dest-arlet.webp",
    emoji: "🐢",
    nom: "Anses d'Arlet",
    accroche: "Nager avec les tortues — garanties tôt le matin",
    tags: ["Tortues", "Snorkeling", "Pêcheurs"],
    must: true,
    distFrom: { amaryllis:25, zandoli:24, geko:25, mabouya:25, iguana:25, schoelcher:55 },
  },
  {
    href: "/guide-le-diamant",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Diamond_Rock.jpg/960px-Diamond_Rock.jpg",
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
  .g2-top h1 {
    flex: 1; text-align: center;
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: 13px;
    letter-spacing: 0.32em; text-transform: uppercase; color: #faf5e9; margin: 0;
  }
  .g2-top h1 em {
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
    position: absolute; inset: -30px;
    background: #0e2020 url('/photos/amaryllis/05.webp') center/cover;
    animation: kenburns 22s ease-in-out infinite alternate;
  }
  @keyframes kenburns {
    0%   { transform: scale(1.06); }
    100% { transform: scale(1.16) translate(-18px, -6px); }
  }
  .g2-hero::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(14,59,58,0.35) 0%, rgba(14,59,58,0) 30%, rgba(14,59,58,0.72) 100%);
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
  .g2-hero-content h2 {
    font-family: 'Jost', sans-serif; font-weight: 200;
    font-size: clamp(40px, 7vw, 88px); letter-spacing: 0.14em;
    text-transform: uppercase; color: #faf5e9; line-height: 0.98; margin: 0 0 22px;
    max-width: 800px;
  }
  .g2-hero-content h2 em {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-weight: 400; color: #c9a673; letter-spacing: 0; text-transform: none;
  }
  .g2-hero-content .lede {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: clamp(17px, 1.6vw, 22px); line-height: 1.55;
    color: rgba(250,245,233,0.92); max-width: 560px; margin: 0;
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
  .g2-intro h3 {
    font-family: 'Jost', sans-serif; font-weight: 200;
    font-size: clamp(26px, 4vw, 38px); letter-spacing: 0.10em;
    text-transform: uppercase; color: #0e3b3a; margin: 0 0 20px; line-height: 1.1;
  }
  .g2-intro h3 em {
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
  .g2-dcard .body { padding: 16px 20px; }
  .g2-dcard .tags { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 14px; }
  .g2-dcard .tag {
    background: #f4ecdc; border: 1px solid #e0d4bc;
    padding: 3px 9px; border-radius: 4px;
    font-family: 'Jost', sans-serif; font-weight: 400; font-size: 10px; color: #7a6b5a;
  }
  .g2-dcard .villas {
    border-top: 1px solid #e0d4bc; padding-top: 12px;
  }
  .g2-dcard .villas-lbl {
    font-family: 'Jost', sans-serif; font-weight: 600; font-size: 9px;
    letter-spacing: 0.22em; text-transform: uppercase; color: #7a6b5a;
    margin-bottom: 8px;
  }
  .g2-dcard .villa-row {
    display: flex; align-items: center; gap: 8px; padding: 3px 0;
    font-family: 'Jost', sans-serif; font-size: 12px;
  }
  .g2-dcard .villa-row .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .g2-dcard .villa-row .vnm { flex: 1; color: #0e3b3a; font-weight: 500; }
  .g2-dcard .villa-row .vmin { color: #c47254; font-weight: 500; }

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
    background: url('/photos/hosts.webp') center top/cover;
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
    animation: pulse 2.6s ease-in-out infinite;
    text-decoration: none; display: inline-block;
  }
  @keyframes pulse {
    0%,100% { box-shadow: 0 4px 18px rgba(196,114,84,0.40); }
    50%      { box-shadow: 0 6px 32px rgba(196,114,84,0.70); }
  }
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
    <a className="g2-dcard" href={d.href}>
      <div className="photo" style={{ backgroundImage: `url(${d.photo})` }}>
        {d.must && <span className="must-badge">★ Incontournable</span>}
        <div className="photo-name">
          <span className="nm"><span className="emo">{d.emoji}</span>{d.nom}</span>
          <span className="accroche">{d.accroche}</span>
        </div>
      </div>
      <div className="body">
        <div className="tags">
          {d.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
        <div className="villas">
          <div className="villas-lbl">
            {d.customDist ? d.customDist : "Distance depuis nos villas"}
          </div>
          {close && close.map(v => (
            <div key={v.id} className="villa-row">
              <span className="dot" style={{ background: v.couleur }} />
              <span className="vnm">{v.nom}</span>
              <span className="vmin">{v.min} min</span>
            </div>
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
    </a>
  );
}

/* ─── Composant principal ───────────────────────────────────── */
export default function Guide() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SEOMeta
        title="Explorer le Sud Martinique — Guides de destination depuis Sainte-Luce | Amaryllis"
        description="Les Salines, les tortues d'Arlet, le Rocher du Diamant — tous à moins de 25 min de nos villas à Sainte-Luce. Guides immersifs pour explorer le Sud Martinique."
        canonical="/guide"
        image="https://villamaryllis.com/photos/amaryllis/01.webp"
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
            "@type": "Article",
            "headline": "Explorer le Sud Martinique — Guide de voyage depuis Sainte-Luce",
            "description": "Les Salines, les tortues d'Arlet, la plongée au Diamant — le guide complet du sud de la Martinique depuis nos villas à Sainte-Luce.",
            "url": `${BASE}/guide`,
            "image": `${BASE}/photos/amaryllis/05.webp`,
            "author": { "@id": `${BASE}/#organization` },
            "publisher": { "@id": `${BASE}/#organization` },
          },
        ],
      })}} />

      {/* ── Top bar ── */}
      <header className="g2-top">
        <a className="brand" href="/">
          <span className="b1">Amaryllis</span>
          <span className="b2">Locations d'exception</span>
        </a>
        <h1>Le Sud Martinique <em>depuis nos villas</em></h1>
        <a className="explorer-link" href="/explorer">🗺️ Carte →</a>
      </header>

      {/* ── Hero Ken Burns ── */}
      <section className="g2-hero">
        <div className="bg" />
        <div className="g2-hero-content">
          <div className="pre">— Carnet de voyage signé par vos hôtes</div>
          <h2>Le sud, <em>depuis votre porte</em></h2>
          <p className="lede">Les Salines à 15 min, les tortues d'Arlet à 25, le Rocher du Diamant à 20. Tout est proche — et personne ne vous l'expliquera mieux que nous.</p>
        </div>
      </section>

      {/* ── Intro ── */}
      <div className="g2-ctn">
        <div className="g2-intro">
          <div className="pre">Six destinations</div>
          <h3>Le Sud, <em>tel qu'on l'aime</em></h3>
          <p>
            Notre équipe vit ici. Nous sommes nés à Sainte-Luce, nous y avons grandi, nous y avons vu les saisons passer. Ce guide n'est pas une liste de spots Instagram — c'est ce qu'on raconterait à un ami qui débarque demain matin.
          </p>
        </div>
      </div>

      {/* ── Grille destinations ── */}
      <div className="g2-ctn">
        <div className="g2-grid">
          {destinations.map(d => <DestCard key={d.href} d={d} />)}
        </div>
      </div>

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

      {/* ── Séminaires ── */}
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

      {/* ── Final CTA ── */}
      <section className="g2-final">
        <div className="g2-ctn">
          <div className="pre">Prêt à explorer</div>
          <h3>Posez vos valises, <em>on s'occupe du reste</em></h3>
          <p>Choisissez votre villa, on vous envoie notre guide personnalisé du Sud — adresses, horaires, contacts locaux — 48h avant votre arrivée.</p>
          <div className="actions">
            <a href="/" className="btn-coral">Voir nos villas →</a>
            <a href="https://wa.me/33610880772" target="_blank" rel="noopener noreferrer" className="btn-wa">WhatsApp — on en parle</a>
          </div>
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
