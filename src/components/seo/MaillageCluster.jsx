// src/components/seo/MaillageCluster.jsx
// Maillage interne SEO compact : "Où loger" (biens du cluster en pastilles photo)
// + "À lire aussi" (guides en liens). Faits biens tirés de la source canonique
// src/data/biens.js. Layout compact (pastilles qui s'enroulent, 2 colonnes desktop).
import { useState, useEffect } from "react";
import { CLUSTER_GUIDES, CLUSTER_BIENS, GUIDE_LABELS, clusterForGuide, clusterForBien } from "../../data/seoClusters.js";
import { BIENS as CANON } from "../../data/biens.js";

const MC_HEAD = { fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "#9a8a74", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 };
const MC_TICK = { width: 18, height: 1, background: "#c47254", display: "inline-block", flexShrink: 0 };

export default function MaillageCluster({ currentSlug = null, bienId = null, bienNames = {} }) {
  // Desktop : déplié en permanence. Mobile : replié (accordéon natif <details>).
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width:760px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener ? mq.addEventListener("change", sync) : mq.addListener(sync);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", sync) : mq.removeListener(sync); };
  }, []);

  const cluster = currentSlug ? clusterForGuide(currentSlug) : clusterForBien(bienId);
  const guides = (CLUSTER_GUIDES[cluster] || []).filter((s) => s !== currentSlug).slice(0, 5);
  const biens  = (CLUSTER_BIENS[cluster] || []).filter((id) => id !== bienId).slice(0, 4);
  if (guides.length === 0 && biens.length === 0) return null;

  return (
    <nav aria-label="Liens utiles" style={{ maxWidth: 1100, margin: "24px auto 4px", padding: "16px 20px 0", borderTop: "1px solid #e0d4bc" }}>
      <style>{`
        /* Mobile : accordéon replié (1 ligne). Desktop : tout déplié, résumé masqué. */
        .mc-summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.14em;color:#9a8a74;padding:4px 0}
        .mc-summary::-webkit-details-marker{display:none}
        .mc-summary::before{content:"";width:18px;height:1px;background:#c47254;display:inline-block;flex-shrink:0}
        .mc-summary::after{content:"\\25BE";margin-left:auto;color:#9a8a74;font-size:10px;transition:transform .2s ease}
        .mc-details[open] .mc-summary::after{transform:rotate(180deg)}
        .mc-wrap{padding-top:12px}
        .mc-grid{display:grid;grid-template-columns:1fr;gap:18px}
        @media(min-width:760px){
          .mc-summary{display:none}
          .mc-wrap{padding-top:0}
          .mc-grid{grid-template-columns:1.15fr 1fr;gap:40px;align-items:start}
        }
        .mc-cards{display:flex;flex-wrap:wrap;gap:8px}
        .mc-card{display:inline-flex;align-items:center;gap:9px;padding:5px 14px 5px 5px;border-radius:999px;background:#f4ecdc;text-decoration:none;transition:background .2s ease}
        .mc-card:hover{background:#ece0c8}
        .mc-thumb{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#e0d4bc;display:block;flex-shrink:0}
        .mc-name{font-family:'Jost',sans-serif;font-size:13px;font-weight:600;color:#0e3b3a;white-space:nowrap}
        .mc-price{font-family:'Jost',sans-serif;font-size:12px;color:#7a6b5a;white-space:nowrap}
        .mc-guides{display:flex;flex-wrap:wrap;gap:6px 16px}
        .mc-guide{display:inline-flex;align-items:baseline;gap:5px;font-family:'Jost',sans-serif;font-size:13px;color:#0e6b63;text-decoration:none;background-image:linear-gradient(#0e6b63,#0e6b63);background-size:0 1px;background-position:0 1.35em;background-repeat:no-repeat;transition:background-size .25s ease}
        .mc-guide:hover{background-size:100% 1px}
        .mc-guide::before{content:"\\203A";color:#c47254;font-size:12px}
      `}</style>
      <details className="mc-details" open={isDesktop}>
      <summary className="mc-summary">Dans le secteur</summary>
      <div className="mc-wrap">
      <div className="mc-grid">
        {biens.length > 0 && (
          <div>
            <h2 style={MC_HEAD}><span style={MC_TICK} />Où loger dans le secteur</h2>
            <div className="mc-cards">
              {biens.map((id) => {
                const b = CANON[id] || {};
                const nom = bienNames[id] || b.nom || id;
                return (
                  <a key={id} href={`/${id}`} className="mc-card">
                    <img className="mc-thumb" src={`/photos/${id}/01.webp`} alt="" loading="lazy" decoding="async" width={36} height={36} />
                    <span className="mc-name">{nom}</span>
                    {b.prix ? <span className="mc-price">dès {b.prix}€</span> : null}
                  </a>
                );
              })}
            </div>
          </div>
        )}
        {guides.length > 0 && (
          <div>
            <h2 style={MC_HEAD}><span style={MC_TICK} />À lire aussi</h2>
            <div className="mc-guides">
              {guides.map((s) => (
                <a key={s} href={`/${s}`} className="mc-guide">{GUIDE_LABELS[s] || s}</a>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
      </details>
    </nav>
  );
}
