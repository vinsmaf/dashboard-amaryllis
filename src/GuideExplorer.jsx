// GuideExplorer.jsx — /explorer — Hub carte interactive Sud Martinique

import { useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* ─── Palette ────────────────────────────────────────────────── */
const NAVY  = "#1a2b4a";
const CORAL = "#e05a2b";
const SAND  = "#faf5e9";

/* ─── Inject Leaflet CSS fixes + page CSS ─────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;600;700&display=swap');

  body { margin: 0; background: ${SAND}; font-family: 'Jost', sans-serif; }

  /* Leaflet popup override */
  .leaflet-popup-content-wrapper {
    padding: 0 !important;
    border-radius: 14px !important;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,.22) !important;
    border: none !important;
  }
  .leaflet-popup-content { margin: 0 !important; width: auto !important; }
  .leaflet-popup-tip-container { display: none; }
  .leaflet-container { font-family: 'Jost', sans-serif !important; }
  .leaflet-control-attribution { font-size: 10px !important; }

  /* Marker hover */
  .ge-marker:hover { transform: scale(1.08); transition: transform .15s; }

  /* Layout */
  .ge-wrap {
    display: flex;
    height: 100vh;
    overflow: hidden;
    flex-direction: column;
  }
  .ge-header {
    background: ${NAVY};
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
    z-index: 10;
  }
  .ge-back {
    color: rgba(250,245,233,.55);
    text-decoration: none;
    font-size: 13px;
    font-weight: 300;
    letter-spacing: .06em;
    transition: color .2s;
  }
  .ge-back:hover { color: ${SAND}; }
  .ge-title {
    color: ${SAND};
    font-size: 18px;
    font-weight: 600;
    letter-spacing: .04em;
    flex: 1;
  }
  .ge-subtitle {
    color: rgba(250,245,233,.45);
    font-size: 12px;
    font-weight: 300;
  }

  /* Filter bar */
  .ge-filters {
    background: white;
    padding: 10px 20px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    flex-shrink: 0;
    border-bottom: 1px solid #e8edf3;
    scrollbar-width: none;
  }
  .ge-filters::-webkit-scrollbar { display: none; }
  .ge-chip {
    padding: 6px 16px;
    border-radius: 100px;
    border: 1.5px solid #d0d8e3;
    background: white;
    color: ${NAVY};
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    white-space: nowrap;
    transition: all .18s;
    font-family: 'Jost', sans-serif;
  }
  .ge-chip:hover { border-color: ${CORAL}; color: ${CORAL}; }
  .ge-chip.active {
    background: ${CORAL};
    border-color: ${CORAL};
    color: white;
    font-weight: 600;
  }

  /* Main content: map + panel */
  .ge-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Map */
  .ge-map-wrap {
    flex: 1;
    position: relative;
  }
  .ge-map-wrap .leaflet-container {
    width: 100%;
    height: 100%;
  }

  /* Side panel */
  .ge-panel {
    width: 340px;
    flex-shrink: 0;
    overflow-y: auto;
    background: ${SAND};
    border-left: 1px solid #e2e9f0;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scrollbar-width: thin;
    scrollbar-color: #c8d0dc transparent;
  }
  .ge-panel-count {
    font-size: 11px;
    font-weight: 300;
    color: rgba(26,43,74,.5);
    letter-spacing: .06em;
    text-transform: uppercase;
    padding: 0 4px;
  }

  /* Destination card in panel */
  .ge-card {
    background: white;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,.07);
    cursor: pointer;
    transition: box-shadow .2s, transform .2s;
    text-decoration: none;
    display: block;
    border: 2px solid transparent;
  }
  .ge-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,.13);
    transform: translateY(-2px);
    border-color: ${CORAL};
  }
  .ge-card.selected {
    border-color: ${CORAL};
    box-shadow: 0 4px 20px rgba(224,90,43,.2);
  }
  .ge-card-photo {
    height: 140px;
    background-size: cover;
    background-position: center;
    position: relative;
  }
  .ge-card-photo-empty {
    height: 80px;
    background: linear-gradient(135deg, ${NAVY} 0%, #2a4a7a 100%);
  }
  .ge-card-ribbon {
    position: absolute;
    top: 10px;
    left: 10px;
    background: ${CORAL};
    color: white;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 100px;
  }
  .ge-card-body {
    padding: 12px 14px 14px;
  }
  .ge-card-name {
    font-size: 15px;
    font-weight: 600;
    color: ${NAVY};
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .ge-card-accroche {
    font-size: 12px;
    color: rgba(26,43,74,.65);
    font-weight: 300;
    line-height: 1.5;
    margin-bottom: 8px;
  }
  .ge-card-must {
    background: #fff5f1;
    border-left: 3px solid ${CORAL};
    padding: 6px 10px;
    font-size: 11px;
    color: ${CORAL};
    font-weight: 600;
    border-radius: 0 6px 6px 0;
    margin-bottom: 10px;
  }
  .ge-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ge-card-dist {
    font-size: 11px;
    color: rgba(26,43,74,.45);
    font-weight: 300;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .ge-card-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .ge-card-tag {
    font-size: 10px;
    background: #eef1f6;
    color: rgba(26,43,74,.65);
    padding: 2px 8px;
    border-radius: 100px;
    font-weight: 400;
  }
  .ge-card-cta {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: ${NAVY};
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: 7px 14px;
    border-radius: 100px;
    text-decoration: none;
    margin-top: 10px;
    transition: background .18s;
  }
  .ge-card-cta:hover { background: ${CORAL}; }

  /* Popup card (in map) */
  .ge-popup {
    width: 240px;
    font-family: 'Jost', sans-serif;
  }
  .ge-popup-photo {
    height: 110px;
    background-size: cover;
    background-position: center;
    position: relative;
  }
  .ge-popup-photo-empty {
    height: 60px;
    background: linear-gradient(135deg, ${NAVY} 0%, #2a4a7a 100%);
  }
  .ge-popup-body { padding: 10px 12px 12px; }
  .ge-popup-name {
    font-size: 14px;
    font-weight: 600;
    color: ${NAVY};
    margin-bottom: 3px;
  }
  .ge-popup-accroche {
    font-size: 11px;
    color: rgba(26,43,74,.6);
    font-weight: 300;
    margin-bottom: 7px;
    line-height: 1.4;
  }
  .ge-popup-must {
    background: #fff5f1;
    border-left: 3px solid ${CORAL};
    padding: 5px 8px;
    font-size: 10px;
    color: ${CORAL};
    font-weight: 600;
    border-radius: 0 5px 5px 0;
    margin-bottom: 8px;
  }
  .ge-popup-cta {
    display: block;
    text-align: center;
    background: ${NAVY};
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 7px;
    border-radius: 8px;
    text-decoration: none;
    letter-spacing: .04em;
    transition: background .15s;
  }
  .ge-popup-cta:hover { background: ${CORAL}; }

  /* Mobile */
  @media (max-width: 768px) {
    .ge-wrap { height: auto; overflow: visible; }
    .ge-body { flex-direction: column; height: auto; }
    .ge-map-wrap { height: 55vh; flex: none; }
    .ge-panel {
      width: 100%;
      border-left: none;
      border-top: 1px solid #e2e9f0;
      overflow-y: visible;
      max-height: none;
      padding: 16px 12px;
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
    distance: "25 min de Sainte-Luce",
    tags: ["Snorkeling", "Famille", "Plages", "Culture"],
    must: "Le spot ultime pour nager avec les tortues",
    href: "/guide-arlet",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Anses-d%27Arlet.jpg/800px-Anses-d%27Arlet.jpg",
    isMust: true,
  },
  {
    id: "sainte-anne",
    nom: "Sainte-Anne",
    emoji: "🏖️",
    accroche: "La plus belle plage des Caraïbes — Les Salines",
    lat: 14.441, lng: -60.886,
    distance: "15 min de Sainte-Luce",
    tags: ["Plages", "Famille", "Couple", "Gastronomie"],
    must: "Les Salines — à voir absolument avant 9h",
    href: "/guide-sainte-anne",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Les_Salines.jpg/800px-Les_Salines.jpg",
    isMust: true,
  },
  {
    id: "diamant",
    nom: "Le Diamant",
    emoji: "🗿",
    accroche: "Le Rocher mythique & plages sauvages",
    lat: 14.468, lng: -61.024,
    distance: "20 min de Sainte-Luce",
    tags: ["Plages", "Snorkeling", "Culture", "Couple"],
    must: "Plonger autour du Rocher du Diamant",
    href: "/guide-le-diamant",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Diamond_Rock%2C_Martinique.jpg/800px-Diamond_Rock%2C_Martinique.jpg",
    isMust: true,
  },
  {
    id: "sainte-luce",
    nom: "Sainte-Luce",
    emoji: "🏡",
    accroche: "Votre base idéale au cœur du Sud Martinique",
    lat: 14.472, lng: -60.933,
    distance: "votre base",
    tags: ["Plages", "Gastronomie", "Famille", "Snorkeling"],
    must: "Ti Sable & nos plages de sable blanc",
    href: "/",
    photo: null,
    isBase: true,
  },
  {
    id: "trois-ilets",
    nom: "Les Trois-Îlets",
    emoji: "⚓",
    accroche: "Village créole charmant & Musée de la Pagerie",
    lat: 14.534, lng: -61.022,
    distance: "35 min de Sainte-Luce",
    tags: ["Culture", "Gastronomie", "Famille", "Couple"],
    must: "Le village des pêcheurs au coucher du soleil",
    href: "/guide-trois-ilets",
    photo: null,
  },
];

/* ─── Create custom DivIcon ───────────────────────────────────── */
function makeIcon(dest, isSelected) {
  const { emoji, nom, isMust, isBase } = dest;
  const bg     = isBase ? NAVY : isMust ? CORAL : (isSelected ? NAVY : "white");
  const color  = isBase || isMust || isSelected ? "white" : NAVY;
  const border = isBase ? NAVY : isMust ? CORAL : (isSelected ? NAVY : "#c8d4e0");
  const shadow = isSelected || isMust ? "0 3px 14px rgba(0,0,0,.35)" : "0 2px 8px rgba(0,0,0,.2)";
  const scale  = isSelected ? "scale(1.1)" : "scale(1)";
  const html = `<div class="ge-marker" style="background:${bg};color:${color};border:2px solid ${border};padding:5px 12px 5px 10px;border-radius:100px;font-size:12px;font-family:'Jost',sans-serif;font-weight:600;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;box-shadow:${shadow};transform:${scale};transition:transform .15s;cursor:pointer">
    <span style="font-size:14px">${emoji}</span><span style="letter-spacing:.02em">${isBase ? "Vous êtes ici" : nom}</span>
  </div>`;
  const w = isBase ? 140 : Math.min(Math.max(nom.length * 7.5 + 50, 90), 200);
  return L.divIcon({ html, className: "", iconSize: [w, 34], iconAnchor: [w / 2, 34] });
}

/* ─── Composant pour panning sur sélection ───────────────────── */
function MapController({ selected }) {
  const map = useMap();
  if (selected) {
    map.setView([selected.lat + 0.008, selected.lng], 13, { animate: true });
  }
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

  const handleMarkerClick = useCallback((dest) => {
    setSelected(dest);
    // scroll card into view
    setTimeout(() => {
      const el = cardRefs.current[dest.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }, []);

  // SEO
  const title    = "Explorer le Sud Martinique — Carte interactive des destinations";
  const desc     = "Carte interactive des plus belles destinations du Sud Martinique depuis Sainte-Luce : plages, snorkeling, tortues marines, culture créole. Filtrez par activité.";
  const canonical = "https://locations-sainte-luce.fr/explorer";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* SEO */}
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "TouristDestination",
        "name": "Sud Martinique — Explorer depuis Sainte-Luce",
        "description": desc,
        "url": canonical,
      })}} />

      <div className="ge-wrap">

        {/* ── Header ── */}
        <header className="ge-header">
          <a href="/guide" className="ge-back">← Guides</a>
          <div>
            <div className="ge-title">🗺️ Explorer le Sud Martinique</div>
            <div className="ge-subtitle">Cliquez une destination pour découvrir</div>
          </div>
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

        {/* ── Body : carte + panel ── */}
        <div className="ge-body">

          {/* MAP */}
          <div className="ge-map-wrap">
            <MapContainer
              center={[14.48, -60.975]}
              zoom={11}
              scrollWheelZoom
              style={{ width: "100%", height: "100%" }}
              zoomControl
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {selected && <MapController selected={selected} />}
              {visible.map(dest => (
                <Marker
                  key={dest.id}
                  position={[dest.lat, dest.lng]}
                  icon={makeIcon(dest, selected?.id === dest.id)}
                  eventHandlers={{ click: () => handleMarkerClick(dest) }}
                >
                  <Popup closeButton={false} maxWidth={260} minWidth={240}>
                    <div className="ge-popup">
                      {dest.photo
                        ? <div className="ge-popup-photo" style={{ backgroundImage: `url(${dest.photo})` }}>
                            {dest.isMust && <div style={{ position: "absolute", top: 8, left: 8, background: CORAL, color: "white", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100 }}>Incontournable</div>}
                          </div>
                        : <div className="ge-popup-photo-empty" />
                      }
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

          {/* SIDE PANEL */}
          <aside className="ge-panel">
            <div className="ge-panel-count">
              {visible.length} destination{visible.length > 1 ? "s" : ""}
              {activeFilter !== "Tous" ? ` · ${activeFilter}` : ""}
            </div>

            {visible.map(dest => (
              <a
                key={dest.id}
                ref={el => cardRefs.current[dest.id] = el}
                href={dest.href}
                className={`ge-card${selected?.id === dest.id ? " selected" : ""}`}
                onClick={e => { e.preventDefault(); handleMarkerClick(dest); }}
              >
                {dest.photo
                  ? <div className="ge-card-photo" style={{ backgroundImage: `url(${dest.photo})` }}>
                      {dest.isMust && <div className="ge-card-ribbon">Incontournable</div>}
                      {dest.isBase && <div className="ge-card-ribbon" style={{ background: NAVY }}>📍 Votre logement</div>}
                    </div>
                  : <div className="ge-card-photo-empty">
                      {dest.isBase && <div style={{ padding: "12px 14px", color: "rgba(250,245,233,.6)", fontSize: 12, fontWeight: 300, letterSpacing: ".04em" }}>📍 Votre logement</div>}
                    </div>
                }
                <div className="ge-card-body">
                  <div className="ge-card-name">
                    <span>{dest.emoji}</span>
                    <span>{dest.nom}</span>
                  </div>
                  <div className="ge-card-accroche">{dest.accroche}</div>
                  <div className="ge-card-must">✦ {dest.must}</div>
                  <div className="ge-card-footer">
                    <div className="ge-card-dist">🕐 {dest.distance}</div>
                    <div className="ge-card-tags">
                      {dest.tags.slice(0, 2).map(t => (
                        <span key={t} className="ge-card-tag">{t}</span>
                      ))}
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
