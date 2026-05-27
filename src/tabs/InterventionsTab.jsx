/**
 * InterventionsTab — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState } from "react";
import { useAppData } from "../AppDataContext.jsx";

export default function InterventionsTab() {
  const { biens, mob } = useAppData();
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem(INTER_KEY) || "[]"); } catch { return []; } });
  const [form, setForm] = useState({ bienId: biens[0]?.id || "", type: "Ménage", date: "", prestataire: "", cost: "", notes: "", status: "todo" });
  const [show, setShow] = useState(false);
  const [filter, setFilter] = useState("all");

  function save(arr) { setItems(arr); try { localStorage.setItem(INTER_KEY, JSON.stringify(arr)); } catch {} }
  function add() {
    if (!form.date || !form.bienId) return;
    save([{ id: Date.now(), ...form }, ...items]);
    setForm(f => ({ ...f, date: "", prestataire: "", cost: "", notes: "", status: "todo" }));
    setShow(false);
  }
  function toggle(id, field, val) { save(items.map(i => i.id === id ? { ...i, [field]: val } : i)); }
  function del(id) { if (window.confirm("Supprimer cette intervention ?")) save(items.filter(i => i.id !== id)); }

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const stats = INTER_STATUS.map(s => ({ ...s, count: items.filter(i => i.status === s.v).length }));

  const card = { background: "#1e293b", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 };
  const inp  = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, boxSizing: "border-box" };
  const lbl  = { fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3, display: "block" };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>🔨 Suivi des interventions</h2>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>{items.length} intervention{items.length !== 1 ? "s" : ""} enregistrée{items.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShow(s => !s)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          + Nouvelle
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.v} onClick={() => setFilter(filter === s.v ? "all" : s.v)} style={{ ...card, marginBottom: 0, textAlign: "center", cursor: "pointer", borderColor: filter === s.v ? s.color : "rgba(255,255,255,0.06)", padding: "12px 8px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire ajout */}
      {show && (
        <div style={{ ...card, borderColor: "rgba(14,165,233,0.3)", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 700, marginBottom: 12 }}>Nouvelle intervention</div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Logement</label>
              <select value={form.bienId} onChange={e => setForm(f => ({ ...f, bienId: e.target.value }))} style={inp}>
                {biens.map(b => <option key={b.id} value={b.id}>{b.emoji || "🏠"} {b.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                {INTER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Prestataire</label>
              <input type="text" placeholder="Nom / contact" value={form.prestataire} onChange={e => setForm(f => ({ ...f, prestataire: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Coût (€)</label>
              <input type="number" placeholder="0" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Statut</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>
                {INTER_STATUS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: mob ? "1" : "1/-1" }}>
              <label style={lbl}>Notes</label>
              <input type="text" placeholder="Détails, références, …" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inp} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={add} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓ Enregistrer</button>
            <button onClick={() => setShow(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 24px", color: "#475569" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔨</div>
          <div style={{ fontSize: 13 }}>{filter === "all" ? "Aucune intervention enregistrée" : "Aucune intervention dans cette catégorie"}</div>
        </div>
      ) : filtered.map(item => {
        const b = biens.find(x => x.id === item.bienId);
        const st = INTER_STATUS.find(s => s.v === item.status) || INTER_STATUS[0];
        return (
          <div key={item.id} style={card}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{item.type}</span>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{b?.emoji || "🏠"} {b?.nom || item.bienId}</span>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: `${st.color}22`, color: st.color, fontWeight: 600 }}>{st.label}</span>
                  {item.cost > 0 && <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>{Number(item.cost).toLocaleString("fr-FR")} €</span>}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  📅 {item.date}{item.prestataire && ` · 👷 ${item.prestataire}`}
                </div>
                {item.notes && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, fontStyle: "italic" }}>{item.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <select value={item.status} onChange={e => toggle(item.id, "status", e.target.value)}
                  style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 10, cursor: "pointer" }}>
                  {INTER_STATUS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
                </select>
                <button onClick={() => del(item.id)} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.12)", color: "#f87171", fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
