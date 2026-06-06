// GuideExplorer.jsx — /explorer — Hub carte interactive Sud Martinique

import { useState, useCallback, useRef, useEffect } from "react";
import SEOMeta from "./SEOMeta.jsx";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* ─── WeatherPill (Sainte-Luce) ─────────────────────────────── */
const WMO_ICON = { 0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",80:"🌦️",81:"🌧️",82:"⛈️",95:"⛈️",96:"⛈️",99:"⛈️" };
function WeatherPill() {
  const [wx, setWx] = useState(null);
  useEffect(() => {
    try { const c = sessionStorage.getItem("wx_sl"); if (c) { setWx(JSON.parse(c)); return; } } catch {}
    fetch("https://api.open-meteo.com/v1/forecast?latitude=14.472&longitude=-60.933&current=temperature_2m,weathercode&timezone=America%2FMartinique")
      .then(r => r.json()).then(d => {
        const v = { t: Math.round(d.current.temperature_2m), c: d.current.weathercode };
        setWx(v);
        try { sessionStorage.setItem("wx_sl", JSON.stringify(v)); } catch {}
      }).catch(() => {});
  }, []);
  if (!wx) return null;
  return (
    <span style={{
      fontSize: 11, fontFamily: "'Jost',sans-serif", fontWeight: 300,
      color: "rgba(250,245,233,0.65)", whiteSpace: "nowrap", letterSpacing: "0.04em"
    }}>
      {WMO_ICON[wx.c] ?? "🌡️"} {wx.t}°C · Sainte-Luce
    </span>
  );
}

/* ─── Palette ─────────────────────────────────────────────── */
const NAVY  = "#0e3b3a";
const CORAL = "#c47254";
const GOLD  = "#c9a673";
const IVORY = "#faf5e9";
const CREAM = "#f4ecdc";
const SAND  = "#e0d4bc";
const MUTED = "#7a6b5a";

/* ─── Villas sur la carte (Martinique uniquement) ───────────── */
const VILLAS = [
  { id:"amaryllis",  nom:"Villa Amaryllis", coords:[14.4732,-60.9196], couleur:"#10b981", prix:280, photo:"/photos/amaryllis/01.webp"  },
  { id:"zandoli",    nom:"Zandoli",         coords:[14.4725,-60.9201], couleur:"#3b82f6", prix:110, photo:"/photos/zandoli/01.webp"    },
  { id:"geko",       nom:"Géko",            coords:[14.4718,-60.9188], couleur:"#f59e0b", prix:110, photo:"/photos/geko/01.webp"       },
  { id:"mabouya",    nom:"Mabouya",         coords:[14.4729,-60.9194], couleur:"#ec4899", prix:70, photo:"/photos/mabouya/01.webp"    },
  { id:"iguana",     nom:"Villa Iguana",    coords:[14.4741,-60.9209], couleur:"#6366f1", prix:null, photo:"/photos/iguana/01.webp"    },
  { id:"schoelcher", nom:"Bellevue",        coords:[14.6121,-61.0887], couleur:"#8b5cf6", prix:90,  photo:"/photos/schoelcher/01.webp" },
];

/* ─── Données destinations ────────────────────────────────────────────────
 * zone   : "Sud" | "Centre" | "Nord" (sélecteur géographique)
 * tags   : catégories d'activité (filtres) — voir FILTERS
 * distFrom : temps de route estimé (minutes) depuis chaque villa
 * photo  : URL (Wikimedia/Unsplash) — fallback dégradé+emoji si vide ou cassée
 * guideToCreate : true = guide dédié à créer (href temporaire vers guide proche)
 * ────────────────────────────────────────────────────────────────────────── */
const DESTINATIONS = [
  /* ══════════ SUD ══════════ */
  {
    id: "sainte-anne", nom: "Les Salines & Sainte-Anne", emoji: "🏖️", zone: "Sud",
    accroche: "Sept kilomètres de sable blanc et un lagon turquoise qui s'étend jusqu'à l'horizon.",
    lat: 14.378, lng: -60.876, tags: ["Plages", "Famille", "Couple"],
    must: "Les Salines au lever du jour — arriver avant 9h pour avoir la plage à soi.",
    href: "/guide-sainte-anne", photo: "https://villamaryllis.com/photos/amaryllis/01.webp", isMust: true,
    distFrom: { amaryllis:15, zandoli:15, geko:14, mabouya:14, iguana:16, schoelcher:45 },
  },
  {
    id: "arlet", nom: "Les Anses d'Arlet", emoji: "🐢", zone: "Sud",
    accroche: "Tortues marines garanties à la nage, dans une eau claire comme le verre.",
    lat: 14.490, lng: -61.085, tags: ["Snorkeling", "Famille", "Plages"],
    must: "Le spot ultime pour nager avec les tortues — y aller en semaine, tôt le matin.",
    href: "/guide-arlet", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Ponton_et_%C3%89glise_Saint-Henri_des_Anses-d'Arlet.jpg", isMust: true,
    distFrom: { amaryllis:25, zandoli:24, geko:25, mabouya:25, iguana:25, schoelcher:55 },
  },
  {
    id: "diamant", nom: "Le Diamant & son Rocher", emoji: "🗿", zone: "Sud",
    accroche: "Le rocher mythique se dresse face à la plage la plus dramatique de l'île.",
    lat: 14.477, lng: -61.030, tags: ["Plages", "Snorkeling", "Couple"],
    must: "Plonger autour du Rocher du Diamant — visibilité 30m+ en saison sèche.",
    href: "/guide-le-diamant", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Rocher_du_Diamant_Martinique.jpg", isMust: true,
    distFrom: { amaryllis:20, zandoli:21, geko:20, mabouya:20, iguana:22, schoelcher:42 },
  },
  {
    id: "cap110", nom: "Mémorial Cap 110", emoji: "🗽", zone: "Sud",
    accroche: "Quinze statues face à l'océan, en mémoire des victimes de la traite négrière. Bouleversant.",
    lat: 14.469, lng: -61.045, tags: ["Histoire", "Culture", "Couple"],
    must: "Y aller en fin de journée : la lumière rasante sublime les silhouettes face au large.",
    href: "/guide-cap-110-anse-caffard-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Statues-diamant-stephfr.jpg", guideToCreate: true,
    distFrom: { amaryllis:22, zandoli:22, geko:21, mabouya:21, iguana:23, schoelcher:44 },
  },
  {
    id: "trois-rivieres", nom: "Distillerie Trois Rivières", emoji: "🥃", zone: "Sud",
    accroche: "Rhum agricole AOC et son moulin emblématique, à quelques minutes de la villa.",
    lat: 14.456, lng: -60.928, tags: ["Rhum", "Gastronomie", "Culture"],
    must: "La dégustation des vieux millésimes — et ramener une cuvée de la Toussaint introuvable ailleurs.",
    href: "/guide-distilleries-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Distillerie_Trois-Rivieres_Maritinique.jpg", isMust: true,
    distFrom: { amaryllis:8, zandoli:8, geko:7, mabouya:7, iguana:9, schoelcher:50 },
  },
  {
    id: "le-marin", nom: "Marina du Marin", emoji: "⛵", zone: "Sud",
    accroche: "La plus grande marina des Petites Antilles : voiliers, restos les pieds dans l'eau, ambiance.",
    lat: 14.468, lng: -60.869, tags: ["Gastronomie", "Couple", "Famille"],
    must: "Apéro au coucher du soleil sur le port, puis poisson grillé chez un des ti-punch du quai.",
    href: "/guide-marina-du-marin-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Bay_of_le_Marin,_South_Martinique.jpg", guideToCreate: true,
    distFrom: { amaryllis:12, zandoli:12, geko:11, mabouya:11, iguana:13, schoelcher:48 },
  },
  {
    id: "trois-ilets", nom: "Les Trois-Îlets", emoji: "⚓", zone: "Sud",
    accroche: "Village créole, distilleries de rhum, et le coucher de soleil le plus photographié de l'île.",
    lat: 14.534, lng: -61.038, tags: ["Culture", "Gastronomie", "Couple"],
    must: "Le village des pêcheurs au coucher du soleil + dîner au Pignon sur Mer.",
    href: "/guide-trois-ilets", photo: "/photos/trois-ilets.avif",
    distFrom: { amaryllis:35, zandoli:35, geko:34, mabouya:34, iguana:36, schoelcher:30 },
  },
  {
    id: "savane-esclaves", nom: "La Savane des Esclaves", emoji: "🛖", zone: "Sud",
    accroche: "Un village reconstitué pour comprendre l'histoire et l'âme de la Martinique d'antan.",
    lat: 14.546, lng: -61.012, tags: ["Histoire", "Culture", "Famille"],
    must: "La visite guidée par Gilbert Larose, passionnante — réserver à l'avance.",
    href: "/guide-savane-des-esclaves-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Savane_des_esclaves-entr%C3%A9e.JPG", guideToCreate: true,
    distFrom: { amaryllis:38, zandoli:38, geko:37, mabouya:37, iguana:39, schoelcher:32 },
  },
  {
    id: "pointe-bout", nom: "Pointe du Bout & Anse Mitan", emoji: "🛥️", zone: "Sud",
    accroche: "Plages chics, navette pour Fort-de-France et farniente face à la baie.",
    lat: 14.551, lng: -61.052, tags: ["Plages", "Couple", "Famille"],
    must: "La navette maritime jusqu'à Fort-de-France : 20 min, vue imprenable, zéro embouteillage.",
    href: "/guide-pointe-du-bout-anse-mitan-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Pointe_du_Bout.JPG", guideToCreate: true,
    distFrom: { amaryllis:40, zandoli:40, geko:39, mabouya:39, iguana:41, schoelcher:28 },
  },

  /* ══════════ CENTRE ══════════ */
  {
    id: "balata", nom: "Jardin de Balata", emoji: "🌺", zone: "Centre",
    accroche: "Trois mille espèces tropicales et des ponts suspendus dans la canopée. Féérique.",
    lat: 14.665, lng: -61.060, tags: ["Nature", "Famille", "Couple"],
    must: "Les passerelles dans les arbres au-dessus du jardin — vertige et vue à 360°.",
    href: "/guide-jardin-de-balata-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Jardin_Balata_1.JPG", guideToCreate: true, isMust: true,
    distFrom: { amaryllis:55, zandoli:55, geko:54, mabouya:54, iguana:56, schoelcher:15 },
  },
  {
    id: "clement", nom: "Habitation Clément", emoji: "🏛️", zone: "Centre",
    accroche: "Rhum d'exception, maison créole classée et fondation d'art contemporain dans un parc.",
    lat: 14.606, lng: -60.910, tags: ["Rhum", "Culture", "Histoire"],
    must: "La maison de maître et le chai de vieillissement, puis l'art contemporain dans le parc.",
    href: "/guide-habitation-clement-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Hab-Clement-Maison.jpg", guideToCreate: true, isMust: true,
    distFrom: { amaryllis:50, zandoli:50, geko:49, mabouya:49, iguana:51, schoelcher:35 },
  },
  {
    id: "fonds-blancs", nom: "Fonds Blancs & Baignoire de Joséphine", emoji: "🤍", zone: "Centre",
    accroche: "Des bancs de sable blanc en pleine mer où l'on a pied dans une eau translucide.",
    lat: 14.617, lng: -60.870, tags: ["Plages", "Famille", "Couple"],
    must: "Excursion en bateau depuis Le François — ti-punch les pieds dans l'eau turquoise.",
    href: "/guide-francois-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Baignoire_de_Josephine.jpg", isMust: true,
    distFrom: { amaryllis:55, zandoli:55, geko:54, mabouya:54, iguana:56, schoelcher:40 },
  },
  {
    id: "fort-de-france", nom: "Fort-de-France", emoji: "🏰", zone: "Centre",
    accroche: "La bibliothèque Schœlcher, le Fort Saint-Louis et le grand marché aux épices.",
    lat: 14.602, lng: -61.067, tags: ["Culture", "Histoire", "Gastronomie"],
    must: "Le marché couvert le matin pour les épices et le rhum arrangé, puis La Savane.",
    href: "/guide-fort-de-france-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Biblioteque_Schoelcher.JPG", guideToCreate: true,
    distFrom: { amaryllis:45, zandoli:45, geko:44, mabouya:44, iguana:46, schoelcher:12 },
  },
  {
    id: "caravelle", nom: "Presqu'île de la Caravelle", emoji: "🥾", zone: "Centre",
    accroche: "Une randonnée côtière sauvage jusqu'au phare, entre mangrove et falaises atlantiques.",
    lat: 14.766, lng: -60.876, tags: ["Nature", "Famille"],
    must: "La boucle du sentier de la Caravelle (2h) — vues spectaculaires sur l'Atlantique.",
    href: "/guide-presquile-caravelle-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Phare_de_la_caravelle_2.JPG", guideToCreate: true,
    distFrom: { amaryllis:70, zandoli:70, geko:69, mabouya:69, iguana:71, schoelcher:45 },
  },

  /* ══════════ NORD ══════════ */
  {
    id: "montagne-pelee", nom: "Montagne Pelée", emoji: "🌋", zone: "Nord",
    accroche: "Le volcan mythique de l'île, inscrit à l'UNESCO. L'ascension la plus emblématique.",
    lat: 14.812, lng: -61.165, tags: ["Nature"],
    must: "Partir à l'aube par l'Aileron pour atteindre le sommet avant les nuages (3-4h A/R).",
    href: "/guide-montagne-pelee-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Montagne_Pel%C3%A9e.JPG", guideToCreate: true, isMust: true,
    distFrom: { amaryllis:85, zandoli:85, geko:84, mabouya:84, iguana:86, schoelcher:50 },
  },
  {
    id: "saint-pierre", nom: "Saint-Pierre", emoji: "🌋", zone: "Nord",
    accroche: "Le « petit Paris des Antilles » figé par l'éruption de 1902. Ruines et mémoire.",
    lat: 14.742, lng: -61.176, tags: ["Histoire", "Culture"],
    must: "Le théâtre en ruines et le cachot de Cyparis, seul survivant de l'éruption.",
    href: "/guide-saint-pierre-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Saint-Pierre_(Martinique)_avec_Montage_Pel%C3%A9e.JPG", isMust: true,
    distFrom: { amaryllis:75, zandoli:75, geko:74, mabouya:74, iguana:76, schoelcher:35 },
  },
  {
    id: "depaz", nom: "Distillerie Depaz", emoji: "🥃", zone: "Nord",
    accroche: "Au pied de la Pelée, un château créole et un rhum né d'une terre volcanique unique.",
    lat: 14.755, lng: -61.171, tags: ["Rhum", "Histoire", "Culture"],
    must: "Le château Depaz et sa vue sur la mer des Caraïbes — la cuvée Plantation en souvenir.",
    href: "/guide-distillerie-depaz-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Ch%C3%A2teau_Depaz.jpg", guideToCreate: true,
    distFrom: { amaryllis:78, zandoli:78, geko:77, mabouya:77, iguana:79, schoelcher:38 },
  },
  {
    id: "gorges-falaise", nom: "Gorges de la Falaise", emoji: "🏞️", zone: "Nord",
    accroche: "Une marche aquatique dans un canyon de la forêt tropicale jusqu'à une cascade.",
    lat: 14.808, lng: -61.124, tags: ["Nature", "Famille"],
    must: "La remontée dans la rivière jusqu'à la cascade — guide obligatoire, sensations garanties.",
    href: "/guide-gorges-de-la-falaise-martinique", photo: "/photos/dest-gorges-falaise.webp", guideToCreate: true,
    distFrom: { amaryllis:80, zandoli:80, geko:79, mabouya:79, iguana:81, schoelcher:55 },
  },
  {
    id: "anse-couleuvre", nom: "Anse Couleuvre", emoji: "🏝️", zone: "Nord",
    accroche: "Une plage de sable noir sauvage au bout de la route, lovée dans la forêt du Prêcheur.",
    lat: 14.812, lng: -61.225, tags: ["Plages", "Nature", "Snorkeling"],
    must: "Le snorkeling le long des roches volcaniques + la rando vers la cascade Couleuvre.",
    href: "/guide-anse-couleuvre-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Anse_Couleuvre.jpg", guideToCreate: true,
    distFrom: { amaryllis:95, zandoli:95, geko:94, mabouya:94, iguana:96, schoelcher:55 },
  },
  {
    id: "grand-riviere", nom: "Grand-Rivière", emoji: "🌊", zone: "Nord",
    accroche: "Le village du bout du monde, coincé entre l'océan et les pitons. Authentique et brut.",
    lat: 14.875, lng: -61.170, tags: ["Nature", "Gastronomie"],
    must: "Déjeuner de poisson frais face à la mer, puis le sentier vers Anse Couleuvre (avec guide).",
    href: "/guide-grand-riviere-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Martinique_-_Grand-Rivi%C3%A8re.jpg", guideToCreate: true,
    distFrom: { amaryllis:100, zandoli:100, geko:99, mabouya:99, iguana:101, schoelcher:65 },
  },
  {
    id: "carbet", nom: "Le Carbet", emoji: "🎨", zone: "Nord",
    accroche: "Là où débarqua Christophe Colomb et où peignit Gauguin. Plages de sable noir paisibles.",
    lat: 14.708, lng: -61.183, tags: ["Plages", "Histoire", "Culture"],
    must: "Le centre d'interprétation Gauguin, puis baignade tranquille sur la plage du Coin.",
    href: "/guide-le-carbet-martinique", photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Plage_du_Carbet,_Martinique_(janvier_1982).jpg", guideToCreate: true,
    distFrom: { amaryllis:70, zandoli:70, geko:69, mabouya:69, iguana:71, schoelcher:35 },
  },
];

/* Catégories d'activité (filtres) */
const ZONES = ["Sud", "Centre", "Nord"];

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  /* La page /explorer scrolle normalement (shell plein écran + sections sous le pli) */
  html, body, #root { height: auto; min-height: 100%; margin: 0; padding: 0; }
  body { font-family: 'Jost', sans-serif; background: ${NAVY}; }

  /* ── Leaflet overrides ── */
  .leaflet-popup-content-wrapper {
    padding: 0 !important;
    border-radius: 16px !important;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,.28) !important;
    border: none !important;
  }
  .leaflet-popup-content { margin: 0 !important; width: 220px !important; }
  .leaflet-popup-tip-container { display: none; }
  .leaflet-container { font-family: 'Jost', sans-serif !important; background: #0e2020 !important; }
  .leaflet-control-attribution { font-size: 10px !important; background: rgba(255,255,255,.7) !important; }
  .ge-map-wrap .leaflet-top.leaflet-left { top: 14px; left: 14px; }
  .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 18px rgba(0,0,0,.25) !important; border-radius: 12px !important; overflow: hidden; }
  .leaflet-control-zoom a {
    font-family: 'Jost', sans-serif !important;
    background: rgba(255,255,255,.95) !important; color: ${NAVY} !important;
    width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 19px !important;
    border-bottom: 1px solid ${SAND} !important;
  }
  .leaflet-control-zoom a:hover { background: ${CREAM} !important; color: ${CORAL} !important; }
  .ge-marker-dot:hover { transform: scale(1.22); z-index: 999; }
  .ge-marker-selected { z-index: 1000 !important; }

  /* ── Shell plein écran (robuste : flex-shrink:0 pour ne pas être comprimé par #root flex) ── */
  .ge-wrap {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    flex-shrink: 0;
    overflow: hidden;
    position: relative;
  }

  /* ── Top bar (glass, slim) ── */
  .ge-header {
    background: linear-gradient(180deg, ${NAVY} 0%, #0c3433 100%);
    padding: 0 24px;
    height: 56px;
    display: flex;
    align-items: center;
    gap: 22px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(250,245,233,0.08);
    z-index: 20;
  }
  .ge-brand { text-decoration: none; display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
  .ge-brand .b1 {
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: 15px;
    letter-spacing: .4em; text-transform: uppercase; color: ${IVORY}; line-height: 1;
  }
  .ge-brand .b2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 8px;
    letter-spacing: .42em; text-transform: uppercase; color: rgba(250,245,233,.5); line-height: 1;
  }
  .ge-title {
    flex: 1; color: ${IVORY}; font-size: 13px; font-weight: 200;
    letter-spacing: .3em; text-transform: uppercase;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ge-title em {
    font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400;
    color: ${GOLD}; letter-spacing: .02em; text-transform: none; margin-left: 6px;
  }
  .ge-guides-link {
    flex-shrink: 0; color: ${IVORY}; text-decoration: none; font-size: 12px; font-weight: 400;
    letter-spacing: .06em; padding: 7px 14px; border: 1px solid rgba(250,245,233,.22);
    border-radius: 999px; transition: all .18s; white-space: nowrap;
  }
  .ge-guides-link:hover { background: rgba(250,245,233,.1); border-color: ${GOLD}; color: ${GOLD}; }

  /* ── Body : rail (gauche) + carte dominante (droite) ── */
  .ge-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }

  /* ── Carte ── */
  .ge-map-wrap { flex: 1; min-width: 0; min-height: 0; position: relative; order: 2; }
  .ge-map-wrap .leaflet-container { width: 100%; height: 100%; }
  /* Ombre intérieure pour détacher la carte du rail */
  .ge-map-wrap::after {
    content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 400;
    box-shadow: inset 8px 0 24px -16px rgba(0,0,0,.5);
  }

  /* ── Rail (panneau latéral gauche) ── */
  .ge-panel {
    width: 416px;
    flex-shrink: 0;
    order: 1;
    min-height: 0;
    overflow-y: auto;
    background: ${IVORY};
    border-right: 1px solid ${SAND};
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
    scrollbar-color: ${SAND} transparent;
  }
  .ge-panel::-webkit-scrollbar { width: 8px; }
  .ge-panel::-webkit-scrollbar-thumb { background: ${SAND}; border-radius: 8px; }

  /* ── Barre de filtres (en tête du rail, sticky) ── */
  .ge-filters {
    position: sticky; top: 0; z-index: 12;
    background: ${IVORY};
    padding: 14px 16px 12px;
    border-bottom: 1px solid ${SAND};
    flex-shrink: 0;
  }
  .ge-filters-count {
    font-size: 10px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase;
    color: ${MUTED}; margin-bottom: 10px; display: flex; align-items: baseline; gap: 7px;
  }
  .ge-filters-count b { color: ${CORAL}; font-size: 16px; font-weight: 600; letter-spacing: 0; }
  .ge-chips { display: flex; gap: 7px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .ge-chips::-webkit-scrollbar { display: none; }
  .ge-chip {
    padding: 7px 15px; border-radius: 999px; border: 1px solid ${SAND}; background: white;
    color: ${MUTED}; font-size: 12px; font-weight: 400; cursor: pointer; white-space: nowrap;
    transition: all .18s; font-family: 'Jost', sans-serif; line-height: 1; letter-spacing: .04em;
  }
  .ge-chip:hover { border-color: ${CORAL}; color: ${NAVY}; }
  .ge-chip.active { background: ${NAVY}; border-color: ${NAVY}; color: white; box-shadow: 0 3px 10px rgba(14,59,58,.22); }

  /* Sélecteur de zone (segmenté) */
  .ge-zones { display: flex; gap: 0; background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 10px; padding: 3px; margin-bottom: 11px; }
  .ge-zone {
    flex: 1; padding: 7px 6px; border: none; background: transparent; cursor: pointer;
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: .04em;
    color: ${MUTED}; border-radius: 8px; transition: all .18s; white-space: nowrap;
  }
  .ge-zone:hover { color: ${NAVY}; }
  .ge-zone.active { background: white; color: ${CORAL}; box-shadow: 0 2px 8px rgba(14,59,58,.12); font-weight: 600; }

  .ge-dest-list { padding: 4px 0 4px; flex: 1; }

  /* ── Carte destination (fiche POI enrichie) ── */
  .ge-card {
    margin: 12px 14px 0;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(14,59,58,0.05);
    cursor: pointer;
    transition: box-shadow .25s, transform .25s, border-color .2s;
    border: 1px solid ${SAND};
    position: relative;
  }
  .ge-card:hover { box-shadow: 0 10px 30px rgba(14,59,58,0.16); transform: translateY(-3px); border-color: ${GOLD}; }
  .ge-card.selected {
    border-color: ${CORAL};
    box-shadow: 0 0 0 2px ${CORAL}, 0 12px 32px rgba(196,114,84,0.22);
    transform: none;
  }
  .ge-card.selected::before {
    content: "📍 Affiché sur la carte"; position: absolute; z-index: 5;
    top: 12px; left: 12px;
    background: ${CORAL}; color: white; font-size: 9px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px;
    box-shadow: 0 4px 14px rgba(196,114,84,.5); white-space: nowrap; pointer-events: none;
  }
  /* La sélection prime sur le badge "Incontournable" (évite le chevauchement) */
  .ge-card.selected .ge-card-badge { display: none; }
  .ge-card-photo {
    height: 152px; position: relative; overflow: hidden;
    background: linear-gradient(135deg, ${NAVY} 0%, #16524f 55%, #1d6b5f 100%);
  }
  .ge-card-photo-img {
    position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
    z-index: 1; transition: transform .5s ease;
  }
  .ge-card:hover .ge-card-photo-img { transform: scale(1.06); }
  /* Filigrane emoji visible derrière l'image — sert de fallback si pas de photo */
  .ge-card-photo-emoji {
    position: absolute; inset: 0; z-index: 0; display: flex; align-items: center; justify-content: center;
    font-size: 60px; opacity: .35; filter: drop-shadow(0 4px 12px rgba(0,0,0,.4));
  }
  .ge-card-photo::after {
    z-index: 2;
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(14,59,58,.15) 0%, transparent 35%, rgba(14,59,58,0.82) 100%);
    pointer-events: none;
  }
  .ge-card-badge {
    position: absolute; top: 12px; left: 12px; z-index: 2;
    background: rgba(196,114,84,0.96); color: white; font-size: 9px; font-weight: 700;
    letter-spacing: .16em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px;
    box-shadow: 0 3px 10px rgba(0,0,0,.25);
  }
  .ge-card-pin {
    position: absolute; top: 10px; right: 10px; z-index: 3;
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(6px); color: ${MUTED};
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    font-size: 16px; border: none; transition: all .2s; box-shadow: 0 2px 8px rgba(0,0,0,.18);
  }
  .ge-card-pin:hover { transform: scale(1.14); color: ${CORAL}; }
  .ge-card-pin.pinned { background: ${GOLD}; color: white; }
  .ge-card-photo-name {
    position: absolute; bottom: 12px; left: 14px; right: 52px; z-index: 2; color: white;
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 15px; letter-spacing: .07em;
    text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    text-shadow: 0 2px 8px rgba(0,0,0,.4);
  }
  .ge-card-body { padding: 14px 16px 16px; }
  .ge-card-accroche {
    font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 16px;
    line-height: 1.45; color: ${NAVY}; margin: 0 0 12px;
  }
  .ge-card-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 11px; }
  .ge-card-tag {
    background: ${CREAM}; border: 1px solid ${SAND}; padding: 3px 9px; border-radius: 5px;
    font-size: 10px; color: ${MUTED}; letter-spacing: .03em;
  }
  .ge-card-must {
    background: rgba(201,166,115,0.10); border-left: 2px solid ${GOLD};
    padding: 8px 12px; border-radius: 0 8px 8px 0;
    font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14px;
    color: ${NAVY}; margin-bottom: 13px; line-height: 1.45;
  }
  /* ── Distances depuis les villas : barres visuelles ── */
  .ge-card-distances { border-top: 1px solid ${SAND}; padding-top: 12px; }
  .ge-card-dist-lbl {
    font-weight: 600; font-size: 9px; letter-spacing: .18em; text-transform: uppercase;
    color: ${MUTED}; margin-bottom: 9px; display: flex; align-items: center; gap: 6px;
  }
  .ge-card-dist-row { display: flex; align-items: center; gap: 9px; padding: 5px 0; color: ${NAVY}; font-size: 12px; }
  .ge-card-dist-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 2px rgba(255,255,255,.8); }
  .ge-card-dist-nm { width: 64px; font-weight: 500; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ge-card-dist-bar { flex: 1; height: 6px; border-radius: 6px; background: ${CREAM}; overflow: hidden; }
  .ge-card-dist-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg, ${GOLD}, ${CORAL}); }
  .ge-card-dist-min { color: ${CORAL}; font-weight: 600; width: 46px; text-align: right; flex-shrink: 0; }

  /* ── Popup (dans la carte) ── */
  .ge-popup { width: 220px; font-family: 'Jost', sans-serif; }
  .ge-popup-photo {
    height: 110px; position: relative; overflow: hidden;
    background: linear-gradient(135deg, ${NAVY} 0%, #16524f 55%, #1d6b5f 100%);
  }
  .ge-popup-photo-emoji { position: absolute; inset: 0; z-index: 0; display: flex; align-items: center; justify-content: center; font-size: 46px; opacity: .4; }
  .ge-popup-photo-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; }
  .ge-popup-photo::after {
    content: "";
    position: absolute;
    inset: 0; z-index: 2;
    background: linear-gradient(180deg, transparent 50%, rgba(14,59,58,0.6));
  }
  .ge-popup-body { padding: 12px 14px 14px; }
  .ge-popup-name {
    font-weight: 500;
    font-size: 14px;
    color: ${NAVY};
    letter-spacing: .06em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .ge-popup-accroche {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 13px;
    color: ${NAVY};
    line-height: 1.4;
    margin-bottom: 10px;
  }
  .ge-popup-cta {
    display: block;
    width: 100%;
    text-align: center;
    background: ${CORAL};
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 8px;
    border-radius: 6px;
    text-decoration: none;
    letter-spacing: .1em;
    text-transform: uppercase;
    transition: background .15s;
    border: none;
    cursor: pointer;
    box-sizing: border-box;
  }
  .ge-popup-cta:hover { background: #a85a3f; }

  /* ── Villa popup ── */
  .ge-villa-popup { width: 220px; font-family: 'Jost', sans-serif; }
  .ge-villa-popup-photo {
    height: 100px;
    background: ${NAVY} center/cover;
    position: relative;
  }
  .ge-villa-popup-body { padding: 12px 14px 14px; }
  .ge-villa-popup-name {
    font-weight: 600;
    font-size: 13px;
    color: ${NAVY};
    margin-bottom: 3px;
  }
  .ge-villa-popup-prix {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 12px;
    color: ${MUTED};
    margin-bottom: 10px;
    line-height: 1.4;
  }
  .ge-villa-popup-cta {
    display: block;
    text-align: center;
    background: ${NAVY};
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 7px;
    border-radius: 6px;
    text-decoration: none;
    letter-spacing: .04em;
    transition: background .15s;
  }
  .ge-villa-popup-cta:hover { background: ${CORAL}; }

  /* ── Trip Builder ── */
  .ge-trip {
    position: sticky;
    bottom: 0;
    z-index: 10;
    background: ${NAVY};
    color: ${IVORY};
    border-top: 1px solid rgba(250,245,233,0.10);
    padding: 16px 18px;
    box-shadow: 0 -8px 24px rgba(14,59,58,0.30);
    isolation: isolate;
  }
  .ge-trip-pre {
    font-size: 9px;
    font-weight: 300;
    letter-spacing: .38em;
    text-transform: uppercase;
    color: ${GOLD};
    margin-bottom: 8px;
  }
  .ge-trip-h3 {
    font-size: 17px;
    font-weight: 200;
    letter-spacing: .06em;
    color: ${IVORY};
    margin: 0 0 12px;
  }
  .ge-trip-h3 em {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    color: ${CORAL};
    font-weight: 400;
  }
  .ge-trip-pins {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 12px;
    min-height: 22px;
  }
  .ge-trip-empty {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 13px;
    color: rgba(250,245,233,0.5);
  }
  .ge-pin-chip {
    background: rgba(250,245,233,0.10);
    border: 1px solid rgba(250,245,233,0.20);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 400;
    color: ${IVORY};
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .ge-pin-chip button {
    background: none;
    border: none;
    color: rgba(250,245,233,0.5);
    cursor: pointer;
    padding: 0;
    font-size: 13px;
    line-height: 1;
  }
  .ge-trip-reco {
    background: rgba(250,245,233,0.05);
    border: 1px solid rgba(250,245,233,0.10);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ge-trip-reco-photo {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: ${NAVY} center/cover no-repeat;
    flex-shrink: 0;
  }
  .ge-trip-reco-text {
    flex: 1;
    font-size: 12px;
    color: rgba(250,245,233,0.85);
    line-height: 1.4;
  }
  .ge-trip-reco-text strong { color: ${IVORY}; font-weight: 600; }
  .ge-trip-reco-text em {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    color: ${GOLD};
  }
  .ge-trip-reco-cta {
    background: ${CORAL};
    color: white;
    border: none;
    padding: 9px 14px;
    border-radius: 6px;
    font-family: 'Jost', sans-serif;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: .1em;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(196,114,84,0.40);
    white-space: nowrap;
    transition: background .15s;
    flex-shrink: 0;
  }
  .ge-trip-reco-cta:hover { background: #a85a3f; }

  /* ── Mobile ── */
  @media (max-width: 900px) {
    .ge-wrap { height: auto; overflow: visible; }
    .ge-header { height: 52px; padding: 0 16px; gap: 12px; position: sticky; top: 0; }
    .ge-title { font-size: 10px; letter-spacing: .16em; }
    .ge-body { flex-direction: column; height: auto; overflow: visible; }
    /* Carte en haut, collée sous le header pendant le scroll des fiches */
    .ge-map-wrap {
      order: 1; flex: none; height: 52vh; min-height: 320px;
      position: sticky; top: 52px; z-index: 5;
    }
    .ge-map-wrap::after { box-shadow: inset 0 -8px 20px -14px rgba(0,0,0,.5); }
    .ge-panel {
      order: 2; width: 100%; overflow: visible;
      border-right: none; border-top: 1px solid ${SAND};
      box-shadow: 0 -10px 30px rgba(14,59,58,.12);
    }
    .ge-filters { top: 52px; }
    .ge-trip { position: static; }
    .ge-weather { display: none; }
  }
`;

/* ─── Marqueur destination ───────────────────────────────────────────
 * Par défaut : pastille ronde compacte (emoji) — déclutte la carte.
 * Sélectionné : pill nommée complète, mise en avant.
 * Couleur de l'anneau par zone (Sud=coral, Centre=gold, Nord=navy). */
const ZONE_COLOR = { Sud: CORAL, Centre: GOLD, Nord: "#2c4a6a" };
function makeDestIcon(dest, isSelected) {
  if (isSelected) {
    const html = `<div style="background:${CORAL};color:#fff;border:2px solid #fff;padding:6px 13px;border-radius:100px;font-size:12px;font-family:'Jost',sans-serif;font-weight:600;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.4);transform:scale(1.05);cursor:pointer;z-index:1000">
      <span style="font-size:14px">${dest.emoji}</span><span style="letter-spacing:.01em">${dest.nom}</span>
    </div>`;
    const w = Math.min(Math.max(dest.nom.length * 7.8 + 56, 100), 240);
    return L.divIcon({ html, className: "ge-marker-selected", iconSize: [w, 36], iconAnchor: [w / 2, 36] });
  }
  const ring = dest.isMust ? CORAL : (ZONE_COLOR[dest.zone] || NAVY);
  const html = `<div class="ge-marker-dot" style="width:32px;height:32px;border-radius:50%;background:#fff;border:2.5px solid ${ring};display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 9px rgba(0,0,0,0.35);cursor:pointer;transition:transform .15s">${dest.emoji}</div>`;
  return L.divIcon({ html, className: "", iconSize: [32, 32], iconAnchor: [16, 32] });
}

/* ─── Marqueur villa (teardrop coloré) ───────────────────────── */
function makeVillaIcon(villa) {
  const html = `<div style="background:${villa.couleur};color:#fff;border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:26px;height:26px;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:11px">🏠</span></div>`;
  return L.divIcon({ html, className: "", iconSize: [26, 26], iconAnchor: [13, 26] });
}

/* ─── Pan carte vers destination sélectionnée ───────────────── */
function MapPan({ dest, markerRefs }) {
  const map = useMap();
  useEffect(() => {
    if (!dest) return;
    map.setView([dest.lat + 0.007, dest.lng], 13, { animate: true, duration: 0.8 });
    const mk = markerRefs?.current?.[dest.id];
    if (mk) setTimeout(() => mk.openPopup(), 420);
  }, [dest, map, markerRefs]);
  return null;
}

/* ─── Trip Builder ───────────────────────────────────────────── */
function TripBuilder({ pinned, onUnpin }) {
  const pinnedList = [...pinned].map(id => DESTINATIONS.find(d => d.id === id)).filter(Boolean);
  const hasPins = pinnedList.length > 0;
  const nights = Math.max(pinnedList.length, 3);
  const total  = (nights * 280).toLocaleString("fr-FR");

  return (
    <div className="ge-trip">
      <div className="ge-trip-pre">— Mon parcours</div>
      {hasPins ? (
        <div className="ge-trip-h3">
          {pinnedList.length} destination{pinnedList.length > 1 ? "s" : ""} · <em>{nights} nuits suggérées</em>
        </div>
      ) : (
        <div className="ge-trip-h3">Composez votre <em>séjour</em></div>
      )}

      <div className="ge-trip-pins">
        {hasPins ? pinnedList.map(d => (
          <span key={d.id} className="ge-pin-chip">
            {d.emoji} {d.nom}
            <button onClick={() => onUnpin(d.id)} title="Retirer">×</button>
          </span>
        )) : (
          <span className="ge-trip-empty">Épinglez ★ vos destinations préférées pour composer un séjour</span>
        )}
      </div>

      {hasPins && (
        <div className="ge-trip-reco">
          <div
            className="ge-trip-reco-photo"
            style={{ backgroundImage: "url(/photos/amaryllis/01.webp)" }}
          />
          <div className="ge-trip-reco-text">
            On vous recommande <strong>Villa Amaryllis</strong><br />
            <em>{nights} nuits · {total}€ — vos destinations à moins de 30 min</em>
          </div>
          <button
            className="ge-trip-reco-cta"
            onClick={() => window.location.href = "/amaryllis"}
          >
            Réserver →
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Composant principal ────────────────────────────────────── */
export default function GuideExplorer() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [zone, setZone]                 = useState("Tous");
  const [selected, setSelected]         = useState(null);
  const [pinned, setPinned]             = useState(new Set());
  const cardRefs = useRef({});
  const markerRefs = useRef({});

  const FILTERS = ["Tous", "Plages", "Snorkeling", "Nature", "Rhum", "Histoire", "Culture", "Gastronomie", "Famille", "Couple"];

  const visible = DESTINATIONS.filter(d =>
    (activeFilter === "Tous" || d.tags.includes(activeFilter)) &&
    (zone === "Tous" || d.zone === zone)
  );

  const handleSelect = useCallback((dest) => {
    setSelected(prev => prev?.id === dest.id ? null : dest);
    setTimeout(() => {
      const el = cardRefs.current[dest.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 120);
  }, []);

  const handlePin = useCallback((id, e) => {
    e?.stopPropagation();
    setPinned(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleUnpin = useCallback((id) => {
    setPinned(prev => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SEOMeta
        title="Carte interactive des activités en Martinique — Plages, tortues, rhum | Amaryllis"
        description="Carte interactive des lieux cultes de Martinique : filtrez par zone et par activité (plages, snorkeling, rhum, rando), épinglez vos spots et composez votre séjour."
        canonical="/explorer"
        image="https://villamaryllis.com/photos/amaryllis/01.webp"
      />

      <div className="ge-wrap">

        {/* ── Header ── */}
        <header className="ge-header">
          <a href="/" className="ge-brand">
            <span className="b1">Amaryllis</span>
            <span className="b2">Locations d'exception</span>
          </a>
          <div className="ge-title">
            Carte des activités <em>— filtrez, épinglez, composez votre séjour</em>
          </div>
          <a href="/guide-hub" className="ge-guides-link">📖 Tous les guides</a>
          <span className="ge-weather"><WeatherPill /></span>
        </header>

        {/* ── Corps : rail (filtres + fiches) + carte ── */}
        <div className="ge-body">

          {/* CARTE SATELLITE */}
          <div className="ge-map-wrap">
            <MapContainer
              center={[14.62, -61.02]}
              zoom={10}
              scrollWheelZoom
              style={{ width: "100%", height: "100%" }}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
                maxZoom={19}
              />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                attribution=""
                opacity={0.85}
              />

              {selected && <MapPan dest={selected} markerRefs={markerRefs} />}

              {/* Marqueurs villas */}
              {VILLAS.map(villa => (
                <Marker
                  key={villa.id}
                  position={villa.coords}
                  icon={makeVillaIcon(villa)}
                >
                  <Popup closeButton={false} maxWidth={240} minWidth={220}>
                    <div className="ge-villa-popup">
                      <div
                        className="ge-villa-popup-photo"
                        style={{ backgroundImage: `url(${villa.photo})` }}
                      />
                      <div className="ge-villa-popup-body">
                        <div className="ge-villa-popup-name">{villa.nom}</div>
                        <div className="ge-villa-popup-prix">
                          {villa.prix === null
                            ? "Location longue durée"
                            : `À partir de ${villa.prix}€ / nuit · réservation directe`}
                        </div>
                        <a href={`/${villa.id}`} className="ge-villa-popup-cta">Voir la villa →</a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Marqueurs destinations */}
              {visible.map(dest => (
                <Marker
                  key={dest.id}
                  position={[dest.lat, dest.lng]}
                  icon={makeDestIcon(dest, selected?.id === dest.id)}
                  eventHandlers={{ click: () => handleSelect(dest) }}
                  ref={m => { if (m) markerRefs.current[dest.id] = m; }}
                >
                  <Popup closeButton={false} maxWidth={240} minWidth={220}>
                    <div className="ge-popup">
                      <div className="ge-popup-photo">
                        <span className="ge-popup-photo-emoji" aria-hidden>{dest.emoji}</span>
                        {dest.photo && (
                          <img className="ge-popup-photo-img" src={dest.photo} alt={dest.nom} loading="lazy"
                               onError={e => { e.currentTarget.style.display = "none"; }} />
                        )}
                      </div>
                      <div className="ge-popup-body">
                        <div className="ge-popup-name">{dest.emoji} {dest.nom}</div>
                        <div className="ge-popup-accroche">{dest.accroche}</div>
                        <a href={dest.href} className="ge-popup-cta">Voir le guide →</a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* RAIL : filtres (sticky) + fiches POI */}
          <aside className="ge-panel">
            {/* Filtres */}
            <div className="ge-filters">
              <div className="ge-filters-count">
                <b>{visible.length}</b> {visible.length > 1 ? "lieux à découvrir" : "lieu"}
                {activeFilter !== "Tous" && <span>· {activeFilter}</span>}
                {zone !== "Tous" && <span>· {zone}</span>}
              </div>
              {/* Sélecteur de zone (segmenté) */}
              <div className="ge-zones">
                {["Tous", ...ZONES].map(z => (
                  <button
                    key={z}
                    className={`ge-zone${zone === z ? " active" : ""}`}
                    onClick={() => { setZone(z); setSelected(null); }}
                  >
                    {z === "Tous" ? "🗺️ Toute l'île" : z}
                  </button>
                ))}
              </div>
              {/* Catégories d'activité */}
              <div className="ge-chips">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    className={`ge-chip${activeFilter === f ? " active" : ""}`}
                    onClick={() => { setActiveFilter(f); setSelected(null); }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="ge-dest-list">
              {visible.map(dest => {
                const isPinned = pinned.has(dest.id);
                const isSelected = selected?.id === dest.id;
                // 3 villas les plus proches
                const closeVillas = VILLAS
                  .map(v => ({ ...v, min: dest.distFrom[v.id] ?? null }))
                  .filter(v => v.min !== null)
                  .sort((a, b) => a.min - b.min)
                  .slice(0, 3);

                return (
                  <div
                    key={dest.id}
                    ref={el => (cardRefs.current[dest.id] = el)}
                    className={`ge-card${isSelected ? " selected" : ""}`}
                    onClick={() => handleSelect(dest)}
                  >
                    {/* Photo + overlay (fallback dégradé+emoji si pas de photo ou URL cassée) */}
                    <div className="ge-card-photo">
                      <span className="ge-card-photo-emoji" aria-hidden>{dest.emoji}</span>
                      {dest.photo && (
                        <img
                          className="ge-card-photo-img"
                          src={dest.photo}
                          alt={dest.nom}
                          loading="lazy"
                          onError={e => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                      {dest.isMust && (
                        <span className="ge-card-badge">Incontournable</span>
                      )}
                      <button
                        className={`ge-card-pin${isPinned ? " pinned" : ""}`}
                        onClick={e => handlePin(dest.id, e)}
                        title={isPinned ? "Retirer du parcours" : "Ajouter au parcours"}
                      >
                        {isPinned ? "★" : "☆"}
                      </button>
                      <div className="ge-card-photo-name">
                        <span style={{ marginRight: 6 }}>{dest.emoji}</span>
                        {dest.nom}
                      </div>
                    </div>

                    {/* Corps */}
                    <div className="ge-card-body">
                      <div className="ge-card-accroche">{dest.accroche}</div>
                      <div className="ge-card-tags">
                        {dest.tags.map(t => <span key={t} className="ge-card-tag">{t}</span>)}
                      </div>
                      <div className="ge-card-must">★ {dest.must}</div>

                      {/* Distances depuis chaque villa — barres visuelles */}
                      <div className="ge-card-distances">
                        <div className="ge-card-dist-lbl">🚗 Temps de route depuis nos villas</div>
                        {closeVillas.map(v => (
                          <div key={v.id} className="ge-card-dist-row">
                            <span className="ge-card-dist-dot" style={{ background: v.couleur }} />
                            <span className="ge-card-dist-nm">{v.nom}</span>
                            <span className="ge-card-dist-bar">
                              <span className="ge-card-dist-fill" style={{ width: `${Math.min(100, Math.round((v.min / 45) * 100))}%` }} />
                            </span>
                            <span className="ge-card-dist-min">{v.min} min</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trip Builder (sticky bas du panel) */}
            <TripBuilder pinned={pinned} onUnpin={handleUnpin} />
          </aside>

        </div>
      </div>

      {/* ── Séminaires ── */}
      <section style={{ background: "#f5efe0", padding: "56px 0", borderTop: "1px solid #e8dcc8" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>
          <a href="/seminaires" style={{ textDecoration: "none", display: "block" }}>
            <div
              style={{ background: "linear-gradient(135deg, #0e3b3a 0%, #163f3e 100%)", borderRadius: 18, padding: "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", transition: "transform 0.2s, box-shadow 0.2s" }}
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
                  Villa Amaryllis en exclusivité — 3 chambres, piscine débordement, terrasse 100 m² vue mer. Idéal pour séminaires jusqu&apos;à 8 personnes. Devis sous 24h.
                </p>
              </div>
              <div style={{ flexShrink: 0 }}>
                <span style={{ display: "inline-block", padding: "13px 28px", background: "#c47254", color: "#faf5e9", borderRadius: 10, fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Voir l&apos;offre →
                </span>
              </div>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
