// src/components/seo/MaillageCluster.jsx
// Bloc de maillage interne SEO : "Où loger" (biens du cluster, en mini-cartes photo)
// + "À lire aussi" (guides du cluster). Faits biens (nom/prix/note/photo) tirés de la
// source canonique src/data/biens.js. Piloté par seoClusters. Style sobre/premium.
import { CLUSTER_GUIDES, CLUSTER_BIENS, GUIDE_LABELS, clusterForGuide, clusterForBien } from "../../data/seoClusters.js";
import { BIENS as CANON } from "../../data/biens.js";

const MC_HEAD = { fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "#9a8a74", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 };
const MC_TICK = { width: 18, height: 1, background: "#c47254", display: "inline-block", flexShrink: 0 };

export default function MaillageCluster({ currentSlug = null, bienId = null, bienNames = {} }) {
  const cluster = currentSlug ? clusterForGuide(currentSlug) : clusterForBien(bienId);
  const guides = (CLUSTER_GUIDES[cluster] || []).filter((s) => s !== currentSlug).slice(0, 5);
  const biens  = (CLUSTER_BIENS[cluster] || []).filter((id) => id !== bienId).slice(0, 4);
  if (guides.length === 0 && biens.length === 0) return null;

  return (
    <nav aria-label="Liens utiles" style={{ maxWidth: 1100, margin: "32px auto 8px", padding: "20px 20px 0", borderTop: "1px solid #e0d4bc" }}>
      <style>{`
        .mc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:36px}
        .mc-card{display:flex;align-items:center;gap:12px;padding:8px 10px;margin:0 -10px;border-radius:12px;text-decoration:none;transition:background .2s ease}
        .mc-card:hover{background:#f4ecdc}
        .mc-thumb{width:56px;height:56px;flex-shrink:0;border-radius:10px;object-fit:cover;background:#e0d4bc;display:block}
        .mc-txt{display:flex;flex-direction:column;min-width:0}
        .mc-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:500;line-height:1.2;color:#0e3b3a;margin:0}
        .mc-meta{font-family:'Jost',sans-serif;font-size:12px;color:#7a6b5a;margin-top:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .mc-star{color:#c9a84c}
        .mc-guides{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px}
        .mc-guide{display:inline-flex;align-items:baseline;gap:6px;font-family:'Jost',sans-serif;font-size:14px;color:#0e6b63;text-decoration:none;line-height:1.9;background-image:linear-gradient(#0e6b63,#0e6b63);background-size:0 1px;background-position:0 1.5em;background-repeat:no-repeat;transition:background-size .25s ease}
        .mc-guide:hover{background-size:100% 1px}
        .mc-guide::before{content:"\\203A";color:#c47254;font-size:13px}
      `}</style>
      <div className="mc-grid">
        {biens.length > 0 && (
          <div>
            <h2 style={MC_HEAD}><span style={MC_TICK} />Où loger dans le secteur</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {biens.map((id) => {
                const b = CANON[id] || {};
                const nom = bienNames[id] || b.nom || id;
                return (
                  <a key={id} href={`/${id}`} className="mc-card">
                    <img className="mc-thumb" src={`/photos/${id}/01.webp`} alt="" loading="lazy" decoding="async" width={56} height={56} />
                    <span className="mc-txt">
                      <span className="mc-name">{nom}</span>
                      <span className="mc-meta">
                        {b.rating ? <span className="mc-star">★ {String(b.rating).replace(".", ",")}</span> : null}
                        {b.rating && b.prix ? <span style={{ opacity: 0.5 }}>·</span> : null}
                        {b.prix ? <span>dès {b.prix}€<span style={{ opacity: 0.7 }}> /nuit</span></span> : null}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
        {guides.length > 0 && (
          <div>
            <h2 style={MC_HEAD}><span style={MC_TICK} />À lire aussi</h2>
            <ul className="mc-guides">
              {guides.map((s) => (
                <li key={s}><a href={`/${s}`} className="mc-guide">{GUIDE_LABELS[s] || s}</a></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
