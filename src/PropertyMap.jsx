// PropertyMap.jsx — carte Leaflet pour les fiches logements
// Isolé dans son propre fichier pour éviter que l'import Leaflet
// ne pollue le chunk PublicSite.jsx (module dynamique global).

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { DESTINATIONS } from "./data/destinations.js";

export default function PropertyMap({ bien, height = 280 }) {
  const { coords, nom, couleur, id } = bien;
  if (!coords) return null;

  const pinIcon = L.divIcon({
    className: "",
    html: `<div style="
      background:${couleur || "#c47254"};
      color:#fff;
      font-family:'Jost',sans-serif;
      font-size:11px;
      font-weight:600;
      padding:5px 9px;
      border-radius:20px;
      white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
      display:flex;align-items:center;gap:5px;
      position:relative;
    ">📍 ${nom}<div style="
      position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
      width:0;height:0;
      border-left:6px solid transparent;
      border-right:6px solid transparent;
      border-top:7px solid ${couleur || "#c47254"};
    "></div></div>`,
    iconSize: [120, 34],
    iconAnchor: [60, 40],
  });

  // POI à proximité : destinations avec un temps de route connu depuis ce bien,
  // triées par distance, les 6 plus proches → marqueurs emoji liés aux guides.
  const nearby = id
    ? DESTINATIONS
        .filter(d => typeof d?.distFrom?.[id] === "number" && typeof d.lat === "number")
        .sort((a, b) => a.distFrom[id] - b.distFrom[id])
        .slice(0, 6)
    : [];

  const poiIcon = (emoji) => L.divIcon({
    className: "",
    html: `<div style="font-size:21px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.45));cursor:pointer;">${emoji}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

  // Cadre la carte sur le bien + ses POI proches (vue secteur). Sinon zoom rue.
  const bounds = nearby.length
    ? L.latLngBounds([[coords.lat, coords.lng], ...nearby.map(d => [d.lat, d.lng])]).pad(0.18)
    : null;

  return (
    <MapContainer
      {...(bounds ? { bounds } : { center: [coords.lat, coords.lng], zoom: 15 })}
      scrollWheelZoom={false}
      zoomControl={true}
      style={{ width: "100%", height, borderRadius: 10, display: "block" }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CartoDB"
        maxZoom={19}
      />
      <Marker position={[coords.lat, coords.lng]} icon={pinIcon} />
      {nearby.map(d => (
        <Marker key={d.id} position={[d.lat, d.lng]} icon={poiIcon(d.emoji)}>
          <Popup>
            <div style={{ padding: "10px 12px", fontFamily: "'Jost', sans-serif", width: 200 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 600, color: "#0e3b3a", lineHeight: 1.15 }}>
                {d.emoji} {d.nom}
              </div>
              <div style={{ fontSize: 12, color: "#7a6b5a", margin: "4px 0 8px" }}>
                🚗 {d.distFrom[id]} min en voiture
              </div>
              <a href={d.href} style={{ fontSize: 12, fontWeight: 600, color: "#c47254", textDecoration: "none" }}>
                Voir le guide →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
