// PropertyMap.jsx — carte Leaflet pour les fiches logements
// Isolé dans son propre fichier pour éviter que l'import Leaflet
// ne pollue le chunk PublicSite.jsx (module dynamique global).

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default function PropertyMap({ bien, height = 280 }) {
  const { coords, nom, couleur } = bien;
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

  return (
    <MapContainer
      center={[coords.lat, coords.lng]}
      zoom={15}
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
    </MapContainer>
  );
}
