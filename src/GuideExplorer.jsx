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
  { id:"zandoli",    nom:"Zandoli",         coords:[14.4725,-60.9201], couleur:"#3b82f6", prix:220, photo:"/photos/zandoli/01.webp"    },
  { id:"geko",       nom:"Géko",            coords:[14.4718,-60.9188], couleur:"#f59e0b", prix:140, photo:"/photos/geko/01.webp"       },
  { id:"mabouya",    nom:"Mabouya",         coords:[14.4729,-60.9194], couleur:"#ec4899", prix:110, photo:"/photos/mabouya/01.webp"    },
  { id:"iguana",     nom:"Villa Iguana",    coords:[14.4741,-60.9209], couleur:"#6366f1", prix:null, photo:"/photos/iguana/01.webp"    },
  { id:"schoelcher", nom:"Bellevue",        coords:[14.6121,-61.0887], couleur:"#8b5cf6", prix:95,  photo:"/photos/schoelcher/01.webp" },
];

/* ─── Données destinations ────────────────────────────────────── */
const DESTINATIONS = [
  {
    id: "arlet",
    nom: "Les Anses d'Arlet",
    emoji: "🐢",
    accroche: "Tortues marines garanties à la nage, dans une eau claire comme le verre.",
    lat: 14.503, lng: -61.085,
    tags: ["Snorkeling", "Famille", "Plages"],
    must: "Le spot ultime pour nager avec les tortues — y aller en semaine, tôt le matin.",
    href: "/guide-arlet",
    photo: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=600&q=80",
    isMust: true,
    distFrom: { amaryllis:25, zandoli:24, geko:25, mabouya:25, iguana:25, schoelcher:55 },
  },
  {
    id: "sainte-anne",
    nom: "Sainte-Anne",
    emoji: "🏖️",
    accroche: "Sept kilomètres de sable blanc et un lagon turquoise qui s'étend jusqu'à l'horizon.",
    lat: 14.441, lng: -60.886,
    tags: ["Plages", "Famille", "Couple"],
    must: "Les Salines au lever du jour — arriver avant 9h pour avoir la plage à soi.",
    href: "/guide-sainte-anne",
    photo: "https://villamaryllis.com/photos/amaryllis/01.webp",
    isMust: true,
    distFrom: { amaryllis:15, zandoli:15, geko:14, mabouya:14, iguana:16, schoelcher:45 },
  },
  {
    id: "diamant",
    nom: "Le Diamant",
    emoji: "🗿",
    accroche: "Le rocher mythique se dresse face à la plage la plus dramatique de l'île.",
    lat: 14.468, lng: -61.024,
    tags: ["Plages", "Snorkeling", "Couple"],
    must: "Plonger autour du Rocher du Diamant — visibilité 30m+ en saison sèche.",
    href: "/guide-le-diamant",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Diamond_Rock.jpg/960px-Diamond_Rock.jpg",
    isMust: true,
    distFrom: { amaryllis:20, zandoli:21, geko:20, mabouya:20, iguana:22, schoelcher:42 },
  },
  {
    id: "trois-ilets",
    nom: "Les Trois-Îlets",
    emoji: "⚓",
    accroche: "Village créole, distilleries de rhum, et le coucher de soleil le plus photographié de Martinique.",
    lat: 14.534, lng: -61.022,
    tags: ["Culture", "Gastronomie", "Couple"],
    must: "Le village des pêcheurs au coucher du soleil + dîner au Pignon sur Mer.",
    href: "/guide-trois-ilets",
    photo: "/photos/trois-ilets.avif",
    distFrom: { amaryllis:35, zandoli:35, geko:34, mabouya:34, iguana:36, schoelcher:30 },
  },
];

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  /* reset pour que 100vh fonctionne dans les enfants flex */
  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  body { font-family: 'Jost', sans-serif; background: ${IVORY}; }

  /* ── Leaflet overrides ── */
  .leaflet-popup-content-wrapper {
    padding: 0 !important;
    border-radius: 14px !important;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,.2) !important;
    border: none !important;
  }
  .leaflet-popup-content { margin: 0 !important; width: 220px !important; }
  .leaflet-popup-tip-container { display: none; }
  .leaflet-container { font-family: 'Jost', sans-serif !important; }
  .leaflet-control-attribution { font-size: 10px !important; background: rgba(255,255,255,.7) !important; }
  .leaflet-control-zoom a { font-family: 'Jost', sans-serif !important; }

  /* ── Layout ── */
  .ge-wrap {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  /* ── Header ── */
  .ge-header {
    background: ${NAVY};
    padding: 0 22px;
    height: 60px;
    display: flex;
    align-items: center;
    gap: 22px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(250,245,233,0.10);
  }
  .ge-brand {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex-shrink: 0;
  }
  .ge-brand .b1 {
    font-family: 'Jost', sans-serif;
    font-weight: 200;
    font-size: 14px;
    letter-spacing: .38em;
    text-transform: uppercase;
    color: ${IVORY};
    line-height: 1;
  }
  .ge-brand .b2 {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    font-size: 8px;
    letter-spacing: .42em;
    text-transform: uppercase;
    color: rgba(250,245,233,.5);
    line-height: 1;
  }
  .ge-title {
    flex: 1;
    color: ${IVORY};
    font-size: 13px;
    font-weight: 200;
    letter-spacing: .32em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ge-title em {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-weight: 400;
    color: ${GOLD};
    letter-spacing: .02em;
    text-transform: none;
    margin-left: 6px;
  }

  /* ── Filtres ── */
  .ge-filters {
    background: ${CREAM};
    padding: 10px 22px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    flex-shrink: 0;
    border-bottom: 1px solid ${SAND};
    scrollbar-width: none;
    align-items: center;
  }
  .ge-filters::-webkit-scrollbar { display: none; }
  .ge-chip {
    padding: 7px 16px;
    border-radius: 999px;
    border: 1px solid ${SAND};
    background: white;
    color: ${MUTED};
    font-size: 12px;
    font-weight: 400;
    cursor: pointer;
    white-space: nowrap;
    transition: all .2s;
    font-family: 'Jost', sans-serif;
    line-height: 1;
    letter-spacing: .04em;
  }
  .ge-chip:hover { border-color: ${CORAL}; color: ${NAVY}; }
  .ge-chip.active {
    background: ${NAVY};
    border-color: ${NAVY};
    color: white;
    font-weight: 400;
  }

  /* ── Body ── */
  .ge-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  /* ── Carte ── */
  .ge-map-wrap {
    flex: 1;
    min-width: 0;
    min-height: 0;
    position: relative;
  }
  .ge-map-wrap .leaflet-container {
    width: 100%;
    height: 100%;
  }

  /* ── Panel latéral ── */
  .ge-panel {
    width: 420px;
    flex-shrink: 0;
    min-height: 0;
    overflow-y: auto;
    background: ${IVORY};
    border-left: 1px solid ${SAND};
    display: flex;
    flex-direction: column;
  }
  .ge-dest-list { padding: 0 0 4px; flex: 1; }

  /* ── Carte destination ── */
  .ge-card {
    margin: 14px 14px 0;
    background: white;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(14,59,58,0.04);
    cursor: pointer;
    transition: box-shadow .3s, transform .3s, border-color .2s;
    border: 1px solid ${SAND};
  }
  .ge-card:hover {
    box-shadow: 0 6px 24px rgba(14,59,58,0.12);
    transform: translateY(-3px);
  }
  .ge-card.selected {
    border-color: ${CORAL};
    box-shadow: 0 0 0 2px rgba(196,114,84,0.25);
    transform: none;
  }
  .ge-card-photo {
    height: 140px;
    background: #0e2020 center/cover no-repeat;
    position: relative;
    overflow: hidden;
  }
  .ge-card-photo::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 40%, rgba(14,59,58,0.75) 100%);
    pointer-events: none;
  }
  .ge-card-badge {
    position: absolute;
    top: 10px; left: 10px;
    z-index: 2;
    background: rgba(196,114,84,0.95);
    color: white;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 999px;
  }
  .ge-card-pin {
    position: absolute;
    top: 10px; right: 10px;
    z-index: 2;
    width: 32px; height: 32px;
    border-radius: 50%;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(6px);
    color: ${MUTED};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 15px;
    border: none;
    transition: all .2s;
  }
  .ge-card-pin:hover { transform: scale(1.12); color: ${CORAL}; }
  .ge-card-pin.pinned { background: ${GOLD}; color: white; }
  .ge-card-photo-name {
    position: absolute;
    bottom: 10px; left: 12px; right: 52px;
    z-index: 2;
    color: white;
    font-family: 'Jost', sans-serif;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: .08em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ge-card-body { padding: 14px 16px; }
  .ge-card-accroche {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 15px;
    line-height: 1.45;
    color: ${NAVY};
    margin: 0 0 12px;
  }
  .ge-card-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
  .ge-card-tag {
    background: ${CREAM};
    border: 1px solid ${SAND};
    padding: 3px 9px;
    border-radius: 4px;
    font-size: 10px;
    color: ${MUTED};
  }
  .ge-card-must {
    background: rgba(201,166,115,0.10);
    border-left: 2px solid ${GOLD};
    padding: 7px 11px;
    border-radius: 0 6px 6px 0;
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 13px;
    color: ${NAVY};
    margin-bottom: 12px;
    line-height: 1.4;
  }
  .ge-card-distances {
    border-top: 1px solid ${SAND};
    padding-top: 10px;
  }
  .ge-card-dist-lbl {
    font-weight: 600;
    font-size: 9px;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: ${MUTED};
    margin-bottom: 6px;
  }
  .ge-card-dist-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    color: ${NAVY};
    font-size: 12px;
  }
  .ge-card-dist-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ge-card-dist-nm { flex: 1; font-weight: 500; }
  .ge-card-dist-min { color: ${CORAL}; font-weight: 500; }

  /* ── Popup (dans la carte) ── */
  .ge-popup { width: 220px; font-family: 'Jost', sans-serif; }
  .ge-popup-photo {
    height: 110px;
    background: #0e2020 center/cover;
    position: relative;
  }
  .ge-popup-photo::after {
    content: "";
    position: absolute;
    inset: 0;
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
    html, body, #root { overflow: auto; height: auto; }
    .ge-wrap { height: auto; overflow: visible; }
    .ge-header { height: auto; padding: 12px 16px; gap: 12px; }
    .ge-title { font-size: 11px; letter-spacing: .18em; }
    .ge-body { flex-direction: column; height: auto; overflow: visible; }
    .ge-map-wrap { height: 55vmax; flex: none; min-height: 300px; max-height: 480px; }
    .ge-panel {
      width: 100%;
      border-left: none;
      border-top: 1px solid ${SAND};
    }
    .ge-trip { position: static; }
    .ge-weather { display: none; }
  }
`;

/* ─── Marqueur destination (pill) ────────────────────────────── */
function makeDestIcon(dest, isSelected) {
  const bg     = dest.isMust ? CORAL : (isSelected ? "#2c4a6a" : "white");
  const color  = (dest.isMust || isSelected) ? "white" : NAVY;
  const border = dest.isMust ? CORAL : (isSelected ? "#2c4a6a" : "#c0ccd8");
  const scale  = isSelected ? "scale(1.15)" : "scale(1)";
  const html = `<div style="background:${bg};color:${color};border:2px solid ${border};padding:5px 12px;border-radius:100px;font-size:12px;font-family:'Jost',sans-serif;font-weight:600;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.28);transform:${scale};transition:transform .2s,box-shadow .15s;cursor:pointer">
    <span style="font-size:14px">${dest.emoji}</span><span style="letter-spacing:.01em">${dest.nom}</span>
  </div>`;
  const w = Math.min(Math.max(dest.nom.length * 7.8 + 52, 90), 220);
  return L.divIcon({ html, className: "", iconSize: [w, 34], iconAnchor: [w / 2, 34] });
}

/* ─── Marqueur villa (teardrop coloré) ───────────────────────── */
function makeVillaIcon(villa) {
  const html = `<div style="background:${villa.couleur};color:#fff;border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:26px;height:26px;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:11px">🏠</span></div>`;
  return L.divIcon({ html, className: "", iconSize: [26, 26], iconAnchor: [13, 26] });
}

/* ─── Pan carte vers destination sélectionnée ───────────────── */
function MapPan({ dest }) {
  const map = useMap();
  useEffect(() => {
    if (dest) map.setView([dest.lat + 0.007, dest.lng], 13, { animate: true, duration: 0.8 });
  }, [dest, map]);
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
  const [selected, setSelected]         = useState(null);
  const [pinned, setPinned]             = useState(new Set());
  const cardRefs = useRef({});

  const FILTERS = ["Tous", "Plages", "Snorkeling", "Famille", "Couple", "Culture", "Gastronomie"];

  const visible = DESTINATIONS.filter(d =>
    activeFilter === "Tous" || d.tags.includes(activeFilter)
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
        title="Carte interactive du Sud Martinique — Explorer depuis Sainte-Luce | Amaryllis"
        description="Carte interactive des destinations du Sud Martinique. Filtrez par activité : plages, snorkeling, famille, culture. Tortues d'Arlet, Les Salines, Rocher du Diamant."
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
            Explorer le Sud Martinique <em>depuis Sainte-Luce</em>
          </div>
          <span className="ge-weather"><WeatherPill /></span>
        </header>

        {/* ── Filtres ── */}
        <div className="ge-filters">
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

        {/* ── Corps : carte + panel ── */}
        <div className="ge-body">

          {/* CARTE SATELLITE */}
          <div className="ge-map-wrap">
            <MapContainer
              center={[14.485, -60.975]}
              zoom={11}
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

              {selected && <MapPan dest={selected} />}

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
                >
                  <Popup closeButton={false} maxWidth={240} minWidth={220}>
                    <div className="ge-popup">
                      <div
                        className="ge-popup-photo"
                        style={{ backgroundImage: dest.photo ? `url(${dest.photo})` : "none" }}
                      />
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

          {/* PANEL LATÉRAL */}
          <aside className="ge-panel">
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
                    {/* Photo + overlay */}
                    <div
                      className="ge-card-photo"
                      style={{ backgroundImage: dest.photo ? `url(${dest.photo})` : "none" }}
                    >
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

                      {/* Distances depuis chaque villa */}
                      <div className="ge-card-distances">
                        <div className="ge-card-dist-lbl">Distance depuis nos villas</div>
                        {closeVillas.map(v => (
                          <div key={v.id} className="ge-card-dist-row">
                            <span className="ge-card-dist-dot" style={{ background: v.couleur }} />
                            <span className="ge-card-dist-nm">{v.nom}</span>
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
