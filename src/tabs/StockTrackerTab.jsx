/**
 * StockTrackerTab — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState } from "react";
import { useAppData } from "../AppDataContext.jsx";

export default function StockTrackerTab() {
  const { biens, mob } = useAppData();
  const [stocks, setStocks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STOCK_KEY) || "{}"); } catch { return {}; }
  });
  const [selBien, setSelBien] = useState(biens[0]?.id || "");

  function getStock(bienId, cat, item) { return stocks[bienId]?.[cat]?.[item] || { qty: 0, min: 2, max: 10 }; }
  function setField(bienId, cat, item, field, val) {
    setStocks(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[bienId]) next[bienId] = {};
      if (!next[bienId][cat]) next[bienId][cat] = {};
      if (!next[bienId][cat][item]) next[bienId][cat][item] = { qty: 0, min: 2, max: 10 };
      next[bienId][cat][item][field] = Number(val);
      try { localStorage.setItem(STOCK_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const allAlerts = biens.flatMap(b => STOCK_DEFAULTS.flatMap(c => c.items.map(item => {
    const s = getStock(b.id, c.cat, item);
    return s.qty < s.min ? { bienId: b.id, bienNom: b.nom, cat: c.cat, item, qty: s.qty, min: s.min } : null;
  }))).filter(Boolean);

  const cardBase = { background: "#1e293b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16, overflow: "hidden" };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>📦 Stock tracker</h2>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>Niveaux de stock par logement · alertes sous le seuil minimum</p>
      </div>

      {allAlerts.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#f87171", fontWeight: 700, marginBottom: 6 }}>⚠️ {allAlerts.length} article{allAlerts.length > 1 ? "s" : ""} sous le seuil minimum</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allAlerts.map((a, i) => (
              <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                {a.bienNom} · {a.item} ({a.qty}/{a.min})
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {biens.map(b => (
          <button key={b.id} onClick={() => setSelBien(b.id)}
            style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: selBien === b.id ? "#0ea5e9" : "rgba(255,255,255,0.06)", color: selBien === b.id ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {b.emoji || "🏠"} {b.nom}
          </button>
        ))}
      </div>

      {STOCK_DEFAULTS.map(cat => (
        <div key={cat.cat} style={cardBase}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{cat.cat}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "#475569", fontWeight: 600 }}>Article</th>
                  <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 10, color: "#475569", fontWeight: 600, width: 70 }}>Qté</th>
                  <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 10, color: "#475569", fontWeight: 600, width: 60 }}>Min</th>
                  <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 10, color: "#475569", fontWeight: 600, width: 60 }}>Max</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "#475569", fontWeight: 600, width: 100 }}>État</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map(item => {
                  const s = getStock(selBien, cat.cat, item);
                  const pct = s.max > 0 ? Math.min(100, Math.round(s.qty / s.max * 100)) : 0;
                  const color = s.qty < s.min ? "#ef4444" : s.qty < s.min * 1.5 ? "#f59e0b" : "#10b981";
                  return (
                    <tr key={item} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#e2e8f0" }}>{item}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        <input type="number" min="0" value={s.qty}
                          onChange={e => setField(selBien, cat.cat, item, "qty", e.target.value)}
                          style={{ width: 52, padding: "4px 6px", borderRadius: 6, border: `1px solid ${color}44`, background: "#0f172a", color, fontSize: 12, textAlign: "center" }} />
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        <input type="number" min="0" value={s.min}
                          onChange={e => setField(selBien, cat.cat, item, "min", e.target.value)}
                          style={{ width: 44, padding: "4px 4px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#94a3b8", fontSize: 11, textAlign: "center" }} />
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        <input type="number" min="0" value={s.max}
                          onChange={e => setField(selBien, cat.cat, item, "max", e.target.value)}
                          style={{ width: 44, padding: "4px 4px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#94a3b8", fontSize: 11, textAlign: "center" }} />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
                          </div>
                          <span style={{ fontSize: 10, color, fontWeight: 600, minWidth: 28 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
