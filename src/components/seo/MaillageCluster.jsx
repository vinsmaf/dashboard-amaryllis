// src/components/seo/MaillageCluster.jsx
// Bloc de maillage interne SEO : "À lire aussi" (guides du cluster) + "Où loger"
// (biens du cluster). Ancres descriptives. Piloté par seoClusters.
import { CLUSTER_GUIDES, CLUSTER_BIENS, GUIDE_LABELS, clusterForGuide, clusterForBien } from "../../data/seoClusters.js";

export default function MaillageCluster({ currentSlug = null, bienId = null, bienNames = {} }) {
  const cluster = currentSlug ? clusterForGuide(currentSlug) : clusterForBien(bienId);
  const guides = (CLUSTER_GUIDES[cluster] || []).filter((s) => s !== currentSlug).slice(0, 5);
  const biens  = (CLUSTER_BIENS[cluster] || []).filter((id) => id !== bienId).slice(0, 4);
  if (guides.length === 0 && biens.length === 0) return null;

  const linkStyle = { color: "#0e6b63", textDecoration: "none", fontWeight: 600 };
  return (
    <nav aria-label="Liens utiles" style={{ maxWidth: 1100, margin: "48px auto", padding: "0 20px" }}>
      {guides.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>À lire aussi</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {guides.map((s) => (
              <li key={s}><a href={`/${s}`} style={linkStyle}>{GUIDE_LABELS[s] || s}</a></li>
            ))}
          </ul>
        </div>
      )}
      {biens.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Où loger dans le secteur</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {biens.map((id) => (
              <li key={id}><a href={`/${id}`} style={linkStyle}>{bienNames[id] || id}</a></li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
