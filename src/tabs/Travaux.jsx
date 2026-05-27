/**
 * Travaux — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState } from "react";
import { TRAVAUX_KEY, TRAVAUX_PRIORITIES, TRAVAUX_PRIO_COLORS, TRAVAUX_PRIO_LABELS, TRAVAUX_STATUSES, TRAVAUX_STATUS_COLORS, TRAVAUX_STATUS_LABELS } from "../App.jsx";
import { useAppData } from "../AppDataContext.jsx";

export default function Travaux() {
  const { biens, mob } = useAppData();
  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem(TRAVAUX_KEY) || "[]"); } catch { return []; } });
  const [filterBien,   setFilterBien]   = useState("all");
  const [filterPrio,   setFilterPrio]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const emptyForm = { bienId: biens[0]?.id || "", titre: "", description: "", priorite: "normale", status: "todo", dateCible: "", cout: "", tags: "" };
  const [form, setForm] = useState(emptyForm);

  const saveTasks = (list) => { setTasks(list); try { localStorage.setItem(TRAVAUX_KEY, JSON.stringify(list)); } catch {} };

  const submitForm = () => {
    if (!form.titre.trim()) return;
    if (editId !== null) {
      saveTasks(tasks.map(t => t.id === editId ? { ...t, ...form } : t));
    } else {
      saveTasks([...tasks, { ...form, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10) }]);
    }
    setShowForm(false); setEditId(null); setForm(emptyForm);
  };

  const delTask = (id) => saveTasks(tasks.filter(t => t.id !== id));
  const togStatus = (id) => saveTasks(tasks.map(t => t.id === id
    ? { ...t, status: t.status === "todo" ? "en_cours" : t.status === "en_cours" ? "done" : "todo" }
    : t));
  const openEdit = (t) => {
    setForm({ bienId: t.bienId, titre: t.titre, description: t.description || "", priorite: t.priorite, status: t.status, dateCible: t.dateCible || "", cout: t.cout || "", tags: t.tags || "" });
    setEditId(t.id); setShowForm(true);
  };

  const prioOrder = { urgent: 0, haute: 1, normale: 2, faible: 3 };
  const filtered = tasks
    .filter(t => filterBien   === "all" || t.bienId   === filterBien)
    .filter(t => filterPrio   === "all" || t.priorite === filterPrio)
    .filter(t => filterStatus === "all" || t.status   === filterStatus)
    .sort((a, b) => prioOrder[a.priorite] - prioOrder[b.priorite]);

  const stats     = { todo: tasks.filter(t => t.status === "todo").length, en_cours: tasks.filter(t => t.status === "en_cours").length, done: tasks.filter(t => t.status === "done").length };
  const totalCout = tasks.filter(t => t.status !== "done").reduce((s, t) => s + (parseFloat(t.cout) || 0), 0);

  return (
    <div>
      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "À faire",        value: stats.todo,                                         color: "#64748b" },
          { label: "En cours",       value: stats.en_cours,                                     color: "#f59e0b" },
          { label: "Terminés",       value: stats.done,                                         color: "#10b981" },
          { label: "Budget restant", value: totalCout > 0 ? `${totalCout.toFixed(0)} €` : "—", color: "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "var(--font-mono)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filtres + bouton ajouter ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <select value={filterBien} onChange={e => setFilterBien(e.target.value)} style={{ padding: "6px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 11, cursor: "pointer" }}>
          <option value="all">Tous les biens</option>
          {biens.map(b => <option key={b.id} value={b.id}>{b.emoji} {b.nom}</option>)}
        </select>
        <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)} style={{ padding: "6px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 11, cursor: "pointer" }}>
          <option value="all">Toutes priorités</option>
          {TRAVAUX_PRIORITIES.map(p => <option key={p} value={p}>{TRAVAUX_PRIO_LABELS[p]}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "6px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 11, cursor: "pointer" }}>
          <option value="all">Tous statuts</option>
          {TRAVAUX_STATUSES.map(s => <option key={s} value={s}>{TRAVAUX_STATUS_LABELS[s]}</option>)}
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Ajouter</button>
        </div>
      </div>

      {/* ── Liste ── */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#334155", fontSize: 13 }}>
          {tasks.length === 0 ? "Aucune tâche. Cliquez sur + Ajouter." : "Aucun résultat pour ces filtres."}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
        {filtered.map(t => {
          const bien = biens.find(b => b.id === t.bienId);
          const pc   = TRAVAUX_PRIO_COLORS[t.priorite];
          const sc   = TRAVAUX_STATUS_COLORS[t.status];
          const done = t.status === "done";
          return (
            <div key={t.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)"}`, borderLeft: `3px solid ${pc}`, borderRadius: 12, padding: 14, opacity: done ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: done ? "#64748b" : "#e2e8f0", textDecoration: done ? "line-through" : "none", wordBreak: "break-word" }}>{t.titre}</div>
                  {bien && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{bien.emoji} {bien.nom}</div>}
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                  <button onClick={() => togStatus(t.id)} title="Changer statut" style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${sc}33`, background: `${sc}18`, color: sc, fontSize: 9, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{TRAVAUX_STATUS_LABELS[t.status]}</button>
                  <button onClick={() => openEdit(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0ea5e9", fontSize: 13, padding: "2px 4px" }}>✎</button>
                  <button onClick={() => delTask(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 12, padding: "2px 4px" }}>✕</button>
                </div>
              </div>
              {t.description && <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, lineHeight: 1.4 }}>{t.description}</div>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: `${pc}18`, color: pc, fontWeight: 600 }}>{TRAVAUX_PRIO_LABELS[t.priorite]}</span>
                {t.dateCible && <span style={{ fontSize: 9, color: "#94a3b8" }}>📅 {t.dateCible}</span>}
                {t.cout      && <span style={{ fontSize: 9, color: "#f59e0b" }}>💰 {t.cout} €</span>}
                {t.tags && t.tags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => (
                  <span key={tag} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 5, background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>{tag}</span>
                ))}
                {t.createdAt && <span style={{ fontSize: 8, color: "#334155", marginLeft: "auto" }}>créé {t.createdAt}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal formulaire ── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={() => { setShowForm(false); setEditId(null); }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 22, width: "100%", maxWidth: 420, maxHeight: "calc(90vh - env(safe-area-inset-bottom))", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>{editId !== null ? "✎ Modifier la tâche" : "🔧 Nouvelle tâche"}</div>
            {[
              { l: "Logement",                  k: "bienId",      t: "select", opts: biens.map(b => ({ v: b.id, l: `${b.emoji} ${b.nom}` })) },
              { l: "Titre *",                   k: "titre",       t: "text",   ph: "Ex : Réparation robinet cuisine" },
              { l: "Description",               k: "description", t: "text",   ph: "Détails du problème…" },
              { l: "Priorité",                  k: "priorite",    t: "select", opts: TRAVAUX_PRIORITIES.map(p => ({ v: p, l: TRAVAUX_PRIO_LABELS[p] })) },
              { l: "Statut",                    k: "status",      t: "select", opts: TRAVAUX_STATUSES.map(s => ({ v: s, l: TRAVAUX_STATUS_LABELS[s] })) },
              { l: "Date cible",                k: "dateCible",   t: "date" },
              { l: "Coût estimé (€)",           k: "cout",        t: "number", ph: "0" },
              { l: "Tags (séparés par virgule)", k: "tags",        t: "text",   ph: "plomberie, urgent, cuisine" },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 9 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2, textTransform: "uppercase" }}>{f.l}</div>
                {f.t === "select" ? (
                  <select value={form[f.k]} onChange={e => setForm(x => ({ ...x, [f.k]: e.target.value }))} style={{ width: "100%", padding: "7px 9px", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12 }}>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : (
                  <input type={f.t} placeholder={f.ph || ""} value={form[f.k]} onChange={e => setForm(x => ({ ...x, [f.k]: e.target.value }))} style={{ width: "100%", padding: "7px 9px", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
              <button onClick={submitForm} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{editId !== null ? "Enregistrer" : "Ajouter"}</button>
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #334155", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
