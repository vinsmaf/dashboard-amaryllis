/**
 * LivretQR — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState } from "react";
import { useAppData } from "../AppDataContext.jsx";

export default function LivretQR() {
  const { biens, mob } = useAppData();
  const [copied, setCopied] = useState(null);
  const copyUrl = (id, url) => {
    navigator.clipboard.writeText(url).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); }).catch(() => {});
  };

  const LIVRET_ITEMS = biens.map(b => ({
    ...b,
    url: `https://villamaryllis.com/${b.id}`,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://villamaryllis.com/${b.id}`)}&color=e2e8f0&bgcolor=0f172a&margin=10`,
  }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>📱 QR Codes — Pages de réservation directe</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>À imprimer et déposer dans chaque logement. Le voyageur scanne → réserve directement sans commission.</div>
        </div>
        <button onClick={() => window.print()} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🖨 Imprimer tous</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
        {LIVRET_ITEMS.map(b => (
          <div key={b.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{b.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginBottom: 12 }}>{b.nom}</div>
            <img
              src={b.qrUrl}
              alt={`QR ${b.nom}`}
              loading="lazy"
              style={{ width: 160, height: 160, borderRadius: 10, display: "block", margin: "0 auto 10px", border: "1px solid rgba(255,255,255,0.06)" }}
            />
            <div style={{ fontSize: 9, color: "#475569", wordBreak: "break-all", marginBottom: 8, lineHeight: 1.4 }}>{b.url}</div>
            <button
              onClick={() => copyUrl(b.id, b.url)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 7, border: `1px solid ${copied === b.id ? "#10b981" : "rgba(255,255,255,0.1)"}`, background: copied === b.id ? "rgba(16,185,129,0.12)" : "transparent", color: copied === b.id ? "#10b981" : "#0ea5e9", fontSize: 10, fontWeight: 600, cursor: "pointer" }}
            >{copied === b.id ? "✓ Copié !" : "📋 Copier l'URL"}</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 10, padding: "10px 14px", fontSize: 11, color: "#94a3b8" }}>
        💡 <strong>Astuce :</strong> Imprimez le QR sur une carte plastifiée A5 ou un cadre photo et posez-le sur la table basse. "Réservez directement ici — sans frais de service" = +15% de marge sur les réservations directes.
      </div>
    </div>
  );
}
