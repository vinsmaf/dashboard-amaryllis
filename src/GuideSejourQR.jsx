// Page /guide-sejour-qr — planche imprimable de QR codes, un par bien, pointant vers
// /guide-sejour/<bien> (le livret d'accueil numérique). Destinée à être imprimée par Vincent
// et affichée physiquement dans chaque logement (livret d'accueil papier, cadre, etc.).
// Réutilise le pattern QRCode.toDataURL déjà établi dans TvScreen.jsx.
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { ALL_BIENS } from "./data/biens.js";
import SEOMeta from "./SEOMeta.jsx";

const NAVY = "#1f2a3d";
const CORAL = "#c47254";
const IVORY = "#fffdf8";
const MUTED = "#7c8593";

function Qr({ value, size = 220 }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: size, color: { dark: NAVY, light: "#ffffff" } })
      .then((d) => { if (alive) setSrc(d); }).catch(() => {});
    return () => { alive = false; };
  }, [value, size]);
  if (!src) return <div style={{ width: size, height: size }} />;
  return <img src={src} alt="QR code" width={size} height={size} style={{ display: "block" }} />;
}

function BienCard({ bien }) {
  const url = `https://villamaryllis.com/guide-sejour/${bien.id}`;
  return (
    <div style={{
      background: "#fff", border: `1px solid #ece6d9`, borderRadius: 14,
      padding: "28px 24px", textAlign: "center", breakInside: "avoid",
    }}>
      <div style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 19, color: NAVY, marginBottom: 4 }}>
        {bien.nom}
      </div>
      <div style={{ fontSize: 12, color: CORAL, letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>
        Guide du séjour
      </div>
      <Qr value={url} />
      <div style={{ fontSize: 11, color: MUTED, marginTop: 14, wordBreak: "break-all" }}>
        {url.replace("https://", "")}
      </div>
    </div>
  );
}

export default function GuideSejourQR() {
  return (
    <div style={{ minHeight: "100vh", background: "#f6f1e7", fontFamily: "'Jost',system-ui,sans-serif" }}>
      <SEOMeta title="QR codes — Guides de séjour" canonical="/guide-sejour-qr" />
      <style>{`
        @media print {
          .qr-noprint { display: none !important; }
          body { background: #fff !important; }
          .qr-page { background: #fff !important; padding: 0 !important; }
          .qr-grid { gap: 14px !important; }
        }
      `}</style>

      <div className="qr-noprint" style={{ background: NAVY, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ color: IVORY, fontSize: 14 }}>
          Planche imprimable — un QR code par bien, vers son guide de séjour numérique.
        </div>
        <button
          onClick={() => window.print()}
          style={{
            background: CORAL, color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Jost',sans-serif",
          }}
        >
          🖨️ Imprimer
        </button>
      </div>

      <div className="qr-page" style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 48px" }}>
        <div className="qr-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {ALL_BIENS.map((bien) => <BienCard key={bien.id} bien={bien} />)}
        </div>
      </div>
    </div>
  );
}
