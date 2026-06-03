// src/components/seo/MaillageCluster.jsx
// Bloc de maillage interne SEO : "À lire aussi" (guides du cluster) + "Où loger"
// (biens du cluster). Ancres descriptives. Piloté par seoClusters.
import { CLUSTER_GUIDES, CLUSTER_BIENS, GUIDE_LABELS, clusterForGuide, clusterForBien } from "../../data/seoClusters.js";

export default function MaillageCluster({ currentSlug = null, bienId = null, bienNames = {} }) {
  const cluster = currentSlug ? clusterForGuide(currentSlug) : clusterForBien(bienId);
  const guides = (CLUSTER_GUIDES[cluster] || []).filter((s) => s !== currentSlug).slice(0, 5);
  const biens  = (CLUSTER_BIENS[cluster] || []).filter((id) => id !== bienId).slice(0, 4);
  if (guides.length === 0 && biens.length === 0) return null;

  // Style « pied de page » discret : liens conservés (SEO) mais bloc léger et peu intrusif.
  const linkStyle = { color: "#0e6b63", textDecoration: "none", fontWeight: 500, fontSize: 13 };
  const headStyle = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9a8a74", margin: "0 0 8px" };
  const ulStyle = { listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "6px 16px" };
  return (
    <nav aria-label="Liens utiles" style={{ maxWidth: 1100, margin: "24px auto 8px", padding: "16px 20px 0", borderTop: "1px solid rgba(14,59,58,0.1)" }}>
      {guides.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={headStyle}>À lire aussi</h2>
          <ul style={ulStyle}>
            {guides.map((s) => (
              <li key={s}><a href={`/${s}`} style={linkStyle}>{GUIDE_LABELS[s] || s}</a></li>
            ))}
          </ul>
        </div>
      )}
      {biens.length > 0 && (
        <div>
          <h2 style={headStyle}>Où loger dans le secteur</h2>
          <ul style={ulStyle}>
            {biens.map((id) => (
              <li key={id}><a href={`/${id}`} style={linkStyle}>{bienNames[id] || id}</a></li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
