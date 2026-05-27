/**
 * LingeTab — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState } from "react";
import { useAppData } from "../AppDataContext.jsx";

export default function LingeTab() {
  const { biens, mob } = useAppData();
  const [data, setData] = useState(() => { try { return JSON.parse(localStorage.getItem(LINGE_KEY) || "{}"); } catch { return {}; } });
  const [sel, setSel] = useState(biens[0]?.id || "");
  const [log, setLog] = useState([]);

  function getEntry(bienId, set) { return data[bienId]?.[set] || { qty: 0, state: "propre" }; }
  function setField(bienId, set, field, val) {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[bienId]) next[bienId] = {};
      if (!next[bienId][set]) next[bienId][set] = { qty: 0, state: "propre" };
      next[bienId][set][field] = val;
      try { localStorage.setItem(LINGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    if (field === "state") {
      const b = biens.find(x => x.id === bienId);
      setLog(prev => [{ ts: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), msg: `${b?.nom || bienId} · ${set} → ${val}` }, ...prev.slice(0, 9)]);
    }
  }

  const totalPropre = biens.reduce((acc, b) => acc + LINGE_SETS.filter(s => getEntry(b.id, s).state === "propre").length, 0);
  const totalLavage = biens.reduce((acc, b) => acc + LINGE_SETS.filter(s => getEntry(b.id, s).state === "lavage").length, 0);
  const totalManque = biens.reduce((acc, b) => acc + LINGE_SETS.filter(s => getEntry(b.id, s).state === "manque").length, 0);

  const lingeCard = { background: "#1e293b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>🛏️ Rotation linge</h2>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>Suivi du stock de linge par logement · état en temps réel</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Sets propres", val: totalPropre, color: "#10b981" },
          { label: "Au lavage",    val: totalLavage, color: "#0ea5e9" },
          { label: "Manquants",    val: totalManque, color: "#ef4444" },
        ].map(k => (
          <div key={k.label} style={{ ...lingeCard, marginBottom: 0, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {biens.map(b => {
          const manque = LINGE_SETS.filter(s => getEntry(b.id, s).state === "manque").length;
          return (
            <button key={b.id} onClick={() => setSel(b.id)}
              style={{ position: "relative", padding: "6px 14px", borderRadius: 20, border: "none", background: sel === b.id ? "#0ea5e9" : "rgba(255,255,255,0.06)", color: sel === b.id ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {b.emoji || "🏠"} {b.nom}
              {manque > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 99, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{manque}</span>}
            </button>
          );
        })}
      </div>

      <div style={lingeCard}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#f1f5f9", fontWeight: 600 }}>
          {biens.find(b => b.id === sel)?.emoji || "🏠"} {biens.find(b => b.id === sel)?.nom}
        </div>
        {LINGE_SETS.map(set => {
          const e = getEntry(sel, set);
          const st = LINGE_STATES.find(s => s.v === e.state) || LINGE_STATES[0];
          return (
            <div key={set} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 12, color: "#e2e8f0" }}>{set}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" min="0" value={e.qty} onChange={ev => setField(sel, set, "qty", Number(ev.target.value))}
                  style={{ width: 48, padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, textAlign: "center" }} />
                <span style={{ fontSize: 10, color: "#64748b" }}>sets</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {LINGE_STATES.map(s => (
                  <button key={s.v} onClick={() => setField(sel, set, "state", s.v)}
                    title={s.label}
                    style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${e.state === s.v ? s.color : "rgba(255,255,255,0.08)"}`, background: e.state === s.v ? `${s.color}22` : "transparent", color: e.state === s.v ? s.color : "#475569", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                    {s.icon}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 10, minWidth: 64, color: st.color, fontWeight: 600 }}>{st.label}</span>
            </div>
          );
        })}
      </div>

      {log.length > 0 && (
        <div style={{ ...lingeCard, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Journal de la session</div>
          {log.map((l, i) => <div key={i} style={{ fontSize: 10, color: "#94a3b8", padding: "2px 0" }}><span style={{ color: "#475569" }}>{l.ts}</span> {l.msg}</div>)}
        </div>
      )}
    </div>
  );
}
