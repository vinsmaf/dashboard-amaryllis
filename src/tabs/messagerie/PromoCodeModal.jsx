// src/tabs/messagerie/PromoCodeModal.jsx
// Mini modal : génère un code promo via /api/promo-codes puis callback parent.
import { useState } from "react";

const BIENS = [
  { id: "amaryllis",  label: "Villa Amaryllis" },
  { id: "zandoli",    label: "Zandoli" },
  { id: "geko",       label: "Géko" },
  { id: "mabouya",    label: "Mabouya" },
  { id: "schoelcher", label: "Schœlcher" },
  { id: "nogent",     label: "Nogent" },
];

function formatExpiresDate(days) {
  const d = new Date(Date.now() + days * 86400_000);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PromoCodeModal({ isOpen, onClose, defaultBienId, defaultForEmail, onGenerated }) {
  const [type, setType] = useState("percent");
  const [value, setValue] = useState("10");
  const [validityDays, setValidityDays] = useState("14");
  const [bienId, setBienId] = useState(defaultBienId || "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function generate() {
    setGenerating(true);
    setError(null);
    const token = sessionStorage.getItem("ldb_tok") || "";
    try {
      const r = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          type,
          value: parseInt(value, 10),
          validity_days: parseInt(validityDays, 10),
          bien_id: bienId || null,
          for_email: defaultForEmail || null,
          note: `Compositeur admin · ${new Date().toLocaleDateString("fr-FR")}`,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setError(data.error || "Erreur génération");
        setGenerating(false);
        return;
      }
      // Texte affichage : "−10% sur votre séjour · valable jusqu'au DD/MM/YYYY"
      const valLabel = type === "percent" ? `−${value}%` : `−${value}€`;
      const text = `${valLabel} sur votre séjour · valable jusqu'au ${formatExpiresDate(parseInt(validityDays, 10))}`;
      onGenerated(data.code, text);
      onClose();
    } catch (e) {
      setError(e.message);
      setGenerating(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: "92vw", background: "#0f172a", color: "#e2e8f0", padding: "24px 28px", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>🎁 Générer un code promo</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Type</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["percent", "amount_eur"].map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: type === t ? 700 : 400,
                  background: type === t ? "#6366f1" : "rgba(255,255,255,0.06)", color: type === t ? "#fff" : "#94a3b8" }}>
                {t === "percent" ? "Pourcentage %" : "Montant fixe €"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Valeur</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" value={value} onChange={e => setValue(e.target.value)} min="1" max={type === "percent" ? 99 : 9999}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <span style={{ fontSize: 12, color: "#64748b" }}>{type === "percent" ? "%" : "€"}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Validité (jours)</div>
            <input type="number" value={validityDays} onChange={e => setValidityDays(e.target.value)} min="1" max="365"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Bien concerné</div>
          <select value={bienId} onChange={e => setBienId(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
            <option value="">Tous les biens</option>
            {BIENS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 7, padding: "8px 12px", fontSize: 11, color: "#f87171", marginBottom: 14 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={generating}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={generate} disabled={generating || !value || !validityDays}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 12, fontWeight: 700, cursor: generating ? "default" : "pointer", opacity: generating ? 0.6 : 1 }}>
            {generating ? "…" : "Générer & insérer"}
          </button>
        </div>
      </div>
    </div>
  );
}
