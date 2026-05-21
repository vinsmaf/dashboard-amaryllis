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
  return <span style={{ fontSize: 12, fontFamily: "'Jost',sans-serif", fontWeight: 300, color: "rgba(250,245,233,0.65)", whiteSpace: "nowrap", letterSpacing: "0.03em" }}>{WMO_ICON[wx.c] ?? "🌡️"} {wx.t}°C · Sainte-Luce</span>;
}

/* ─── Palette ────────────────────────────────────────────────── */
const NAVY  = "#1a2b4a";
const CORAL = "#e05a2b";
const SAND  = "#faf5e9";

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;600;700&display=swap');

  /* reset pour que 100vh fonctionne dans les enfants flex */
  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  body { font-family: 'Jost', sans-serif; background: ${SAND}; }

  /* ── Leaflet overrides ── */
  .leaflet-popup-content-wrapper {
    padding: 0 !important;
    border-radius: 14px !important;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,.28) !important;
    border: none !important;
  }
  .leaflet-popup-content { margin: 0 !important; width: auto !important; }
  .leaflet-popup-tip-container { display: none; }
  .leaflet-container { font-family: 'Jost', sans-serif !important; }
  .leaflet-control-attribution {
    font-size: 10px !important;
    background: rgba(255,255,255,.7) !important;
  }
  .leaflet-control-zoom a {
    font-family: 'Jost', sans-serif !important;
  }

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
    padding: 0 24px;
    height: 52px;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;
    z-index: 10;
  }
  .ge-back {
    color: rgba(250,245,233,.5);
    text-decoration: none;
    font-size: 12px;
    font-weight: 300;
    letter-spacing: .06em;
    white-space: nowrap;
    transition: color .2s;
    flex-shrink: 0;
  }
  .ge-back:hover { color: ${SAND}; }
  .ge-title {
    color: ${SAND};
    font-size: 15px;
    font-weight: 600;
    letter-spacing: .04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ge-subtitle {
    color: rgba(250,245,233,.4);
    font-size: 11px;
    font-weight: 300;
    white-space: nowrap;
    margin-left: auto;
    flex-shrink: 0;
  }

  /* ── Filtres ── */
  .ge-filters {
    background: white;
    padding: 8px 20px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    flex-shrink: 0;
    border-bottom: 1px solid #e4eaf2;
    scrollbar-width: none;
    align-items: center;
  }
  .ge-filters::-webkit-scrollbar { display: none; }
  .ge-chip {
    padding: 5px 15px;
    border-radius: 100px;
    border: 1.5px solid #d0d8e3;
    background: white;
    color: ${NAVY};
    font-size: 12px;
    font-weight: 400;
    cursor: pointer;
    white-space: nowrap;
    transition: all .15s;
    font-family: 'Jost', sans-serif;
    line-height: 1;
  }
  .ge-chip:hover { border-color: ${CORAL}; color: ${CORAL}; }
  .ge-chip.active {
    background: ${CORAL};
    border-color: ${CORAL};
    color: white;
    font-weight: 600;
  }

  /* ── Body ── */
  .ge-body {
    display: flex;
    flex: 1;
    min-height: 0;   /* CRITIQUE : empêche l'expansion flex infinie */
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
    width: 320px;
    flex-shrink: 0;
    min-height: 0;
    overflow-y: auto;
    background: ${SAND};
    border-left: 1px solid #dde5ef;
    padding: 14px 14px 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: #c8d4de transparent;
  }
  .ge-panel-count {
    font-size: 10px;
    font-weight: 600;
    color: rgba(26,43,74,.4);
    letter-spacing: .12em;
    text-transform: uppercase;
    padding: 2px 4px;
  }

  /* ── Carte destination ── */
  .ge-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,.07);
    cursor: pointer;
    transition: box-shadow .2s, transform .18s, border-color .15s;
    text-decoration: none;
    display: block;
    border: 2px solid transparent;
    color: inherit;
  }
  .ge-card:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,.13);
    transform: translateY(-2px);
  }
  .ge-card.selected {
    border-color: ${CORAL};
    box-shadow: 0 4px 18px rgba(224,90,43,.2);
    transform: none;
  }
  .ge-card-photo {
    height: 130px;
    background-size: cover;
    background-position: center;
    position: relative;
    background-color: #c8d4de;
  }
  .ge-card-photo-empty {
    height: 54px;
    background: linear-gradient(135deg, ${NAVY} 0%, #2c4a7a 100%);
    display: flex;
    align-items: center;
    padding: 0 14px;
  }
  .ge-card-ribbon {
    position: absolute;
    top: 8px;
    left: 8px;
    background: ${CORAL};
    color: white;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 100px;
  }
  .ge-card-body { padding: 10px 12px 12px; }
  .ge-card-name {
    font-size: 14px;
    font-weight: 600;
    color: ${NAVY};
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
  }
  .ge-card-accroche {
    font-size: 11px;
    color: rgba(26,43,74,.6);
    font-weight: 300;
    line-height: 1.45;
    margin-bottom: 7px;
  }
  .ge-card-must {
    background: #fff4ef;
    border-left: 3px solid ${CORAL};
    padding: 5px 9px;
    font-size: 10px;
    color: ${CORAL};
    font-weight: 600;
    border-radius: 0 5px 5px 0;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  .ge-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ge-card-dist {
    font-size: 10px;
    color: rgba(26,43,74,.4);
    font-weight: 300;
    white-space: nowrap;
  }
  .ge-card-tags { display: flex; gap: 4px; flex-wrap: wrap; }
  .ge-card-tag {
    font-size: 9px;
    background: #edf1f7;
    color: rgba(26,43,74,.6);
    padding: 2px 7px;
    border-radius: 100px;
  }
  .ge-card-cta {
    display: block;
    text-align: center;
    background: ${NAVY};
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 8px;
    border-radius: 7px;
    text-decoration: none;
    letter-spacing: .04em;
    margin-top: 10px;
    transition: background .15s;
  }
  .ge-card-cta:hover { background: ${CORAL}; }

  /* ── Popup (dans la carte) ── */
  .ge-popup { width: 230px; font-family: 'Jost', sans-serif; }
  .ge-popup-photo {
    height: 100px;
    background-size: cover;
    background-position: center;
    background-color: #c8d4de;
    position: relative;
  }
  .ge-popup-photo-empty {
    height: 44px;
    background: linear-gradient(135deg, ${NAVY} 0%, #2c4a7a 100%);
  }
  .ge-popup-badge {
    position: absolute;
    top: 7px; left: 7px;
    background: ${CORAL};
    color: white;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    padding: 2px 9px;
    border-radius: 100px;
  }
  .ge-popup-body { padding: 10px 12px 12px; }
  .ge-popup-name { font-size: 13px; font-weight: 600; color: ${NAVY}; margin-bottom: 3px; }
  .ge-popup-accroche { font-size: 11px; color: rgba(26,43,74,.6); font-weight: 300; margin-bottom: 6px; line-height: 1.4; }
  .ge-popup-must {
    background: #fff4ef;
    border-left: 3px solid ${CORAL};
    padding: 4px 8px;
    font-size: 10px;
    color: ${CORAL};
    font-weight: 600;
    border-radius: 0 4px 4px 0;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  .ge-popup-cta {
    display: block;
    text-align: center;
    background: ${NAVY};
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 7px;
    border-radius: 7px;
    text-decoration: none;
    letter-spacing: .04em;
    transition: background .15s;
  }
  .ge-popup-cta:hover { background: ${CORAL}; }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    html, body, #root { overflow: auto; height: auto; }
    .ge-wrap { height: auto; overflow: visible; }
    .ge-header { height: auto; padding: 12px 16px; gap: 12px; }
    .ge-subtitle { display: none; }
    .ge-body { flex-direction: column; height: auto; overflow: visible; }
    .ge-map-wrap { height: 55vmax; flex: none; min-height: 300px; max-height: 480px; }
    .ge-panel {
      width: 100%;
      border-left: none;
      border-top: 1px solid #dde5ef;
      overflow-y: visible;
      padding: 12px;
    }
  }
`;

/* ─── Données destinations ────────────────────────────────────── */
const DESTINATIONS = [
  {
    id: "arlet",
    nom: "Les Anses d'Arlet",
    emoji: "🐢",
    accroche: "Tortues marines garanties à la nage",
    lat: 14.503, lng: -61.085,
    distance: "25 min",
    tags: ["Snorkeling", "Famille", "Plages"],
    must: "Le spot ultime pour nager avec les tortues",
    href: "/guide-arlet",
    photo: "/photos/arlet-tortue.webp",
    isMust: true,
  },
  {
    id: "sainte-anne",
    nom: "Sainte-Anne",
    emoji: "🏖️",
    accroche: "La plus belle plage des Caraïbes",
    lat: 14.441, lng: -60.886,
    distance: "15 min",
    tags: ["Plages", "Famille", "Couple"],
    must: "Les Salines — arriver avant 9h",
    href: "/guide-sainte-anne",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg",
    isMust: true,
  },
  {
    id: "diamant",
    nom: "Le Diamant",
    emoji: "🗿",
    accroche: "Rocher mythique & plongée d'exception",
    lat: 14.468, lng: -61.024,
    distance: "20 min",
    tags: ["Plages", "Snorkeling", "Couple"],
    must: "Plonger autour du Rocher du Diamant",
    href: "/guide-le-diamant",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Diamond_Rock.jpg/960px-Diamond_Rock.jpg",
    isMust: true,
  },
  {
    id: "sainte-luce",
    nom: "Sainte-Luce",
    emoji: "🏡",
    accroche: "Votre base au cœur du Sud",
    lat: 14.472, lng: -60.933,
    distance: "votre base",
    tags: ["Plages", "Gastronomie", "Famille"],
    must: "Ti Sable & plages de sable blanc",
    href: "/",
    photo: "https://villamaryllis.com/photos/amaryllis/01.webp",
    isBase: true,
  },
  {
    id: "trois-ilets",
    nom: "Les Trois-Îlets",
    emoji: "⚓",
    accroche: "Village créole & Musée de la Pagerie",
    lat: 14.534, lng: -61.022,
    distance: "35 min",
    tags: ["Culture", "Gastronomie", "Couple"],
    must: "Le village des pêcheurs au coucher du soleil",
    href: "/guide-trois-ilets",
    photo: "/photos/trois-ilets.avif",
  },
];

/* ─── Marqueur personnalisé ──────────────────────────────────── */
function makeIcon(dest, isSelected) {
  const { emoji, nom, isMust, isBase } = dest;
  const bg     = isBase ? NAVY : isMust ? CORAL : (isSelected ? "#2c3e6a" : "white");
  const color  = (isBase || isMust || isSelected) ? "white" : NAVY;
  const border = isBase ? NAVY : isMust ? CORAL : (isSelected ? "#2c3e6a" : "#c0ccd8");
  const shadow = (isSelected || isMust) ? "0 3px 14px rgba(0,0,0,.4)" : "0 2px 8px rgba(0,0,0,.22)";
  const scale  = isSelected ? "scale(1.12)" : "scale(1)";
  const label  = isBase ? "Vous êtes ici" : nom;
  const html = `<div style="background:${bg};color:${color};border:2px solid ${border};padding:5px 12px 5px 9px;border-radius:100px;font-size:12px;font-family:'Jost',sans-serif;font-weight:600;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;box-shadow:${shadow};transform:${scale};transition:transform .15s,box-shadow .15s;cursor:pointer">
    <span style="font-size:14px">${emoji}</span><span style="letter-spacing:.01em">${label}</span>
  </div>`;
  const w = Math.min(Math.max(label.length * 7.8 + 52, 90), 210);
  return L.divIcon({ html, className: "", iconSize: [w, 34], iconAnchor: [w / 2, 34] });
}

/* ─── Pan carte vers destination sélectionnée ───────────────── */
function MapPan({ dest }) {
  const map = useMap();
  if (dest) map.setView([dest.lat + 0.007, dest.lng], 13, { animate: true, duration: 0.8 });
  return null;
}

/* ─── Composant principal ────────────────────────────────────── */
export default function GuideExplorer() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [selected, setSelected]         = useState(null);
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SEOMeta
        title="Carte interactive du Sud Martinique — Explorer depuis Sainte-Luce | Amaryllis"
        description="Carte interactive des destinations du Sud Martinique. Filtrez par activité : plages, snorkeling, famille, culture. Tortues d'Arlet, Les Salines, Rocher du Diamant."
        canonical="/explorer"
        image="https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg"
      />

      <div className="ge-wrap">

        {/* ── Header compact ── */}
        <header className="ge-header">
          <a href="/guide" className="ge-back">← Guides</a>
          <div className="ge-title">🗺️ Explorer le Sud Martinique</div>
          <div className="ge-subtitle">Cliquez une destination pour découvrir</div>
          <WeatherPill />
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
              center={[14.48, -60.975]}
              zoom={11}
              scrollWheelZoom
              style={{ width: "100%", height: "100%" }}
            >
              {/* Couche satellite ESRI */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
                maxZoom={18}
              />
              {/* Couche labels par-dessus le satellite */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                attribution=""
                opacity={0.85}
              />

              {selected && <MapPan dest={selected} />}

              {visible.map(dest => (
                <Marker
                  key={dest.id}
                  position={[dest.lat, dest.lng]}
                  icon={makeIcon(dest, selected?.id === dest.id)}
                  eventHandlers={{ click: () => handleSelect(dest) }}
                >
                  <Popup closeButton={false} maxWidth={250} minWidth={230}>
                    <div className="ge-popup">
                      <div className="ge-popup-photo" style={{ backgroundImage: dest.photo ? `url(${dest.photo})` : "none", backgroundColor: dest.photo ? "#c8d4de" : "#1a2b4a" }}>
                        {dest.isMust && <div className="ge-popup-badge">Incontournable</div>}
                        {dest.isBase && <div className="ge-popup-badge" style={{ background: "#1a2b4a" }}>📍 Votre base</div>}
                      </div>
                      <div className="ge-popup-body">
                        <div className="ge-popup-name">{dest.emoji} {dest.nom}</div>
                        <div className="ge-popup-accroche">{dest.accroche}</div>
                        <div className="ge-popup-must">✦ {dest.must}</div>
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
            <div className="ge-panel-count">
              {visible.length} destination{visible.length > 1 ? "s" : ""}
              {activeFilter !== "Tous" ? ` · ${activeFilter}` : ""}
            </div>

            {visible.map(dest => (
              <a
                key={dest.id}
                ref={el => (cardRefs.current[dest.id] = el)}
                href={dest.href}
                className={`ge-card${selected?.id === dest.id ? " selected" : ""}`}
                onClick={e => { e.preventDefault(); handleSelect(dest); }}
              >
                <div className="ge-card-photo" style={{ backgroundImage: dest.photo ? `url(${dest.photo})` : "none", backgroundColor: dest.photo ? "#c8d4de" : "#1a2b4a" }}>
                  {dest.isMust && <div className="ge-card-ribbon">Incontournable</div>}
                  {dest.isBase && <div className="ge-card-ribbon" style={{ background: "#1a2b4a" }}>📍 Votre base</div>}
                </div>
                <div className="ge-card-body">
                  <div className="ge-card-name"><span>{dest.emoji}</span><span>{dest.nom}</span></div>
                  <div className="ge-card-accroche">{dest.accroche}</div>
                  <div className="ge-card-must">✦ {dest.must}</div>
                  <div className="ge-card-footer">
                    <div className="ge-card-dist">🕐 {dest.distance}</div>
                    <div className="ge-card-tags">
                      {dest.tags.slice(0, 2).map(t => <span key={t} className="ge-card-tag">{t}</span>)}
                    </div>
                  </div>
                  {selected?.id === dest.id && (
                    <a href={dest.href} className="ge-card-cta">Voir le guide complet →</a>
                  )}
                </div>
              </a>
            ))}
          </aside>

        </div>
      </div>
    </>
  );
}
