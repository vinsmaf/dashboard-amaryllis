/**
 * InventaireTab — gestion unifiée stocks + linge + consommables.
 *
 * Remplace les onglets séparés Stocks et Linge avec :
 * - Vue tableau par bien × catégorie
 * - Seuils min/max + status (ok / warning / critique / rupture)
 * - Prédiction ETA rupture basée sur conso 30j
 * - Mouvements rapides (consommer / réapprovisionner) avec historique
 * - Alertes visuelles + bouton init seed
 *
 * Implémente log-008 (Option B).
 */
import { useState, useEffect, useMemo } from "react";
import { useAppData } from "../AppDataContext.jsx";

const CATEGORIES = [
  { id: "linge",      label: "🛏  Linge",       color: "#0ea5e9" },
  { id: "hygiene",    label: "🧴 Hygiène",      color: "#10b981" },
  { id: "cuisine",    label: "🍽  Cuisine",      color: "#f59e0b" },
  { id: "entretien",  label: "🧹 Entretien",    color: "#a855f7" },
  { id: "bien_etre",  label: "✨ Bien-être",    color: "#ec4899" },
  { id: "piscine",    label: "🌊 Piscine",      color: "#06b6d4" },
];

const STATUS_LABELS = {
  rupture:  { label: "RUPTURE",  color: "#dc2626", bg: "rgba(220,38,38,0.18)" },
  critique: { label: "Critique", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  warning:  { label: "Bientôt",  color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  ok:       { label: "OK",       color: "#10b981", bg: "rgba(16,185,129,0.08)" },
};

// Le stock mutualisé MQ est représenté par le bien virtuel "_general".
// Nogent (géré par conciergerie externe) est exclu du système.
const VIRTUAL_GENERAL = { id: "_general", emoji: "🏬", nom: "Stock général MQ" };

function adminToken() {
  return sessionStorage.getItem("ldb_tok") || "";
}

export default function InventaireTab() {
  const { biens = [] } = useAppData();
  const [bienId, setBienId] = useState("_general");
  const [catFilter, setCatFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ alerts: 0, warnings: 0, total: 0 });
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ bien_id: bienId });
      if (catFilter !== "all") q.set("category", catFilter);
      const r = await fetch(`/api/inventory?${q}`);
      const d = await r.json();
      if (d.error) { setError(d.error); setItems([]); }
      else {
        setError(null);
        setItems(d.items || []);
        setStats({ alerts: d.alerts || 0, warnings: d.warnings || 0, total: d.total || 0 });
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, [bienId, catFilter]);

  const initSeed = async () => {
    if (!confirm("Initialiser la base inventaire avec items par défaut (linge, hygiène, cuisine, entretien) sur les 7 biens ?")) return;
    setSeeding(true);
    try {
      const r = await fetch(`/api/inventory?action=init`, { method: "POST", headers: { Authorization: `Bearer ${adminToken()}` } });
      const d = await r.json();
      if (d.error) alert("Erreur : " + d.error);
      else alert(d.alreadySeeded ? `Tables déjà initialisées (${d.existingItems} items existants)` : `✓ ${d.inserted} items créés sur 7 biens`);
      loadItems();
    } catch (e) { alert("Erreur : " + e.message); }
    finally { setSeeding(false); }
  };

  const recordMovement = async (item, delta, reason) => {
    const r = await fetch(`/api/inventory?action=movement&id=${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken()}` },
      body: JSON.stringify({ delta, reason }),
    });
    const d = await r.json();
    if (d.error) alert("Erreur : " + d.error);
    else loadItems();
  };

  const updateQty = async (item, newQty) => {
    const delta = newQty - item.qty_current;
    if (delta === 0) return;
    await recordMovement(item, delta, "inventory_adjust");
  };

  const deleteItem = async (item) => {
    if (!confirm(`Supprimer "${item.item_name}" ?`)) return;
    await fetch(`/api/inventory?id=${item.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken()}` } });
    loadItems();
  };

  // Group items by category for display
  const byCategory = useMemo(() => {
    const groups = {};
    for (const it of items) {
      if (!groups[it.category]) groups[it.category] = [];
      groups[it.category].push(it);
    }
    return groups;
  }, [items]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
          📦 Inventaire — Stocks · Linge · Consommables
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Gestion unifiée par bien avec seuils min/max, alertes et prédictions ETA rupture.
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
        <KPI label="Items"       value={stats.total}    color="#0ea5e9" />
        <KPI label="🚨 Critique" value={stats.alerts}   color={stats.alerts > 0 ? "#ef4444" : "#475569"} />
        <KPI label="⚠️ Warning"  value={stats.warnings} color={stats.warnings > 0 ? "#f59e0b" : "#475569"} />
        <KPI label="✓ OK"        value={Math.max(0, stats.total - stats.alerts - stats.warnings)} color="#10b981" />
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#64748b", marginRight: 4 }}>Stock :</span>
        {/* Stock mutualisé MQ en premier — par défaut */}
        <button onClick={() => setBienId(VIRTUAL_GENERAL.id)} style={{
          padding: "5px 11px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 11,
          fontWeight: bienId === VIRTUAL_GENERAL.id ? 700 : 400,
          background: bienId === VIRTUAL_GENERAL.id ? "#10b981" : "rgba(16,185,129,0.12)",
          color: bienId === VIRTUAL_GENERAL.id ? "#fff" : "#10b981",
        }}>
          {VIRTUAL_GENERAL.emoji} {VIRTUAL_GENERAL.nom}
        </button>
        <span style={{ fontSize: 10, color: "#475569", margin: "0 4px" }}>·</span>
        <span style={{ fontSize: 10, color: "#64748b" }}>Équipements bien :</span>
        {biens.filter(b => b.id !== "nogent").map(b => (
          <button key={b.id} onClick={() => setBienId(b.id)} style={{
            padding: "5px 11px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 11,
            fontWeight: bienId === b.id ? 700 : 400,
            background: bienId === b.id ? "#6366f1" : "rgba(255,255,255,0.06)",
            color: bienId === b.id ? "#fff" : "#94a3b8",
          }}>
            {b.emoji} {b.nom.replace("Villa ","").replace("T2 ","")}
          </button>
        ))}
      </div>
      {/* Note Nogent */}
      <div style={{ fontSize: 10, color: "#475569", marginBottom: 12, fontStyle: "italic" }}>
        ℹ️ Nogent : géré par une conciergerie externe — hors système.
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#64748b", marginRight: 4 }}>Cat. :</span>
        <button onClick={() => setCatFilter("all")} style={{
          padding: "5px 11px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 10,
          fontWeight: catFilter === "all" ? 700 : 400,
          background: catFilter === "all" ? "#0ea5e9" : "rgba(255,255,255,0.06)",
          color: catFilter === "all" ? "#fff" : "#94a3b8",
        }}>Toutes</button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCatFilter(c.id)} style={{
            padding: "5px 11px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 10,
            fontWeight: catFilter === c.id ? 700 : 400,
            background: catFilter === c.id ? c.color : "rgba(255,255,255,0.06)",
            color: catFilter === c.id ? "#fff" : "#94a3b8",
          }}>{c.label}</button>
        ))}
        <span style={{ flex: 1 }} />
        <button onClick={() => setShowCreate(s => !s)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px dashed #334155", background: "none", color: "#0ea5e9", cursor: "pointer", fontSize: 11 }}>+ Ajouter</button>
        <button onClick={initSeed} disabled={seeding} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #334155", background: "rgba(168,85,247,0.1)", color: "#a855f7", cursor: "pointer", fontSize: 11 }}>
          {seeding ? "⟳ Init…" : "🌱 Init seed"}
        </button>
      </div>

      {showCreate && <CreateItemForm bienId={bienId} onCreated={() => { setShowCreate(false); loadItems(); }} />}

      {error && <Alert>⚠ {error}</Alert>}

      {loading ? (
        <div style={{ padding: 24, color: "#64748b", textAlign: "center" }}>Chargement…</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "#64748b", background: "rgba(255,255,255,0.02)", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
          <div style={{ marginBottom: 8 }}>Aucun item pour {bienId}{catFilter !== "all" ? ` · ${catFilter}` : ""}.</div>
          <div style={{ fontSize: 11, color: "#475569" }}>Clique "🌱 Init seed" pour créer la base par défaut, ou "+ Ajouter" un item manuellement.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Object.entries(byCategory).map(([cat, list]) => (
            <CategorySection
              key={cat}
              cat={cat}
              items={list}
              onMovement={recordMovement}
              onUpdate={updateQty}
              onDelete={deleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Composants ─────────────────────────────────────────────────────────────

function KPI({ label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "11px 13px" }}>
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{value}</div>
    </div>
  );
}

function Alert({ children }) {
  return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#fca5a5" }}>
      {children}
    </div>
  );
}

function CategorySection({ cat, items, onMovement, onUpdate, onDelete }) {
  const meta = CATEGORIES.find(c => c.id === cat) || { label: cat, color: "#64748b" };
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
        {meta.label} · {items.length}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(it => <ItemRow key={it.id} item={it} onMovement={onMovement} onUpdate={onUpdate} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

function ItemRow({ item, onMovement, onUpdate, onDelete }) {
  const status = STATUS_LABELS[item.status] || STATUS_LABELS.ok;
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.qty_current);

  useEffect(() => { setVal(item.qty_current); }, [item.qty_current]);

  const save = () => {
    const n = parseInt(val);
    if (!isNaN(n)) onUpdate(item, n);
    setEditing(false);
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 110px 90px 90px 110px auto",
      gap: 10, alignItems: "center",
      padding: "9px 12px",
      background: status.bg,
      border: `1px solid ${status.color}22`,
      borderLeft: `3px solid ${status.color}`,
      borderRadius: 8,
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{item.item_name}</div>
        <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{item.unit} · {item.conso_30d || 0} consommés 30j</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>Stock</div>
        {editing ? (
          <input
            type="number"
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={save}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setVal(item.qty_current); setEditing(false); } }}
            style={{ width: 60, padding: "3px 5px", background: "#0f172a", border: "1px solid #0ea5e9", borderRadius: 5, color: "#e2e8f0", fontSize: 13, textAlign: "center", fontFamily: "var(--font-mono)" }}
          />
        ) : (
          <span onClick={() => setEditing(true)} title="Cliquer pour modifier" style={{ cursor: "pointer", fontSize: 16, fontWeight: 700, color: status.color, fontFamily: "var(--font-mono)" }}>
            {item.qty_current}
          </span>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>Min</div>
        <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{item.qty_min}</span>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>Max</div>
        <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{item.qty_max}</span>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>ETA rupture</div>
        <span style={{ fontSize: 11, color: item.eta_rupture_days !== null && item.eta_rupture_days < 7 ? "#ef4444" : "#94a3b8", fontFamily: "var(--font-mono)" }}>
          {item.eta_rupture_days === null ? "—" : `${item.eta_rupture_days}j`}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={() => onMovement(item, -1, "consume")} title="Consommer 1" style={btnIcon("#ef4444")}>−1</button>
        <button onClick={() => onMovement(item, +1, "resupply")} title="Réappro +1" style={btnIcon("#10b981")}>+1</button>
        <button onClick={() => onMovement(item, item.qty_max - item.qty_current, "resupply")} title="Réappro au max" style={btnIcon("#0ea5e9")}>↑Max</button>
        <button onClick={() => onDelete(item)} title="Supprimer" style={btnIcon("#475569")}>🗑</button>
      </div>
    </div>
  );
}

function btnIcon(color) {
  return {
    padding: "4px 9px", borderRadius: 6, border: `1px solid ${color}33`,
    background: `${color}11`, color, fontSize: 11, fontWeight: 600, cursor: "pointer",
    fontFamily: "var(--font-mono)",
  };
}

function CreateItemForm({ bienId, onCreated }) {
  const [form, setForm] = useState({ category: "linge", item_name: "", unit: "pièce", qty_current: 0, qty_min: 0, qty_max: 0 });
  const submit = async () => {
    if (!form.item_name) return alert("Nom requis");
    const r = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken()}` },
      body: JSON.stringify({ ...form, bien_id: bienId, qty_current: parseInt(form.qty_current), qty_min: parseInt(form.qty_min), qty_max: parseInt(form.qty_max) }),
    });
    const d = await r.json();
    if (d.error) alert("Erreur : " + d.error);
    else onCreated();
  };
  return (
    <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 90px 70px 70px 70px auto", gap: 8, alignItems: "center" }}>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={input}>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <input placeholder="Nom de l'item" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} style={input} />
        <input placeholder="Unité" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={input} />
        <input type="number" placeholder="Stock" value={form.qty_current} onChange={e => setForm({ ...form, qty_current: e.target.value })} style={input} />
        <input type="number" placeholder="Min" value={form.qty_min} onChange={e => setForm({ ...form, qty_min: e.target.value })} style={input} />
        <input type="number" placeholder="Max" value={form.qty_max} onChange={e => setForm({ ...form, qty_max: e.target.value })} style={input} />
        <button onClick={submit} style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: "#6366f1", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Créer</button>
      </div>
    </div>
  );
}

const input = {
  padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)",
  background: "#0f172a", color: "#e2e8f0", fontSize: 11, outline: "none", boxSizing: "border-box",
};
