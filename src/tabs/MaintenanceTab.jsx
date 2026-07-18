/**
 * MaintenanceTab — suivi maintenance préventive des 7 biens
 * D1 table `maintenance` via /api/maintenance (Bearer auth)
 */
import { useState, useEffect, useCallback } from "react";
import { useAppData } from "../AppDataContext.jsx";
import { fetchJSON } from "../lib/apiFetch.js";

const CAT = [
  { id: "clim",        label: "Climatisation", icon: "🌬️" },
  { id: "piscine",     label: "Piscine",        icon: "🏊" },
  { id: "jacuzzi",     label: "Jacuzzi",        icon: "💆" },
  { id: "jardin",      label: "Jardin",         icon: "🌿" },
  { id: "plomberie",   label: "Plomberie",      icon: "🚰" },
  { id: "electricite", label: "Électricité",    icon: "⚡" },
  { id: "structure",   label: "Structure",      icon: "🏗️" },
  { id: "qualite",     label: "Contrôle qualité", icon: "✅" },
  { id: "autre",       label: "Autre",          icon: "🔧" },
];
const CAT_MAP = Object.fromEntries(CAT.map(c => [c.id, c]));

const STATUS = [
  { id: "a_planifier", label: "À planifier", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { id: "planifie",    label: "Planifiée",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { id: "fait",        label: "Faite",       color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
];
const ST_MAP = Object.fromEntries(STATUS.map(s => [s.id, s]));

const EMPTY_FORM = {
  bien_id: "", category: "clim", titre: "", prestataire: "",
  cost: "", status: "a_planifier", scheduled_at: "", done_at: "", next_due_at: "", notes: "",
  photos: [], video_url: "",
};

// Photos — mêmes réglages que EtatDesLieux.jsx (compression client, dataURL JPEG).
const MAX_PHOTOS = 4;
const MAX_DIM = 1280;
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function parsePhotos(raw) {
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}

// Cadence par défaut pour les catégories récurrentes — sert à suggérer la
// prochaine échéance en un clic (clim tous les 6 mois, piscine tous les 15 jours).
const DEFAULT_INTERVAL = {
  clim:    { days: 180, label: "+6 mois" },
  piscine: { days: 15,  label: "+15 jours" },
};

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDaysStr(dateStr, days) {
  const d = new Date((dateStr || todayStr()) + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr + "T12:00:00") - new Date()) / 86400000);
  return diff;
}
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, j] = d.split("-");
  return `${j}/${m}/${y}`;
}
function fmtCost(c) {
  if (!c) return null;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(c);
}

export default function MaintenanceTab() {
  const { biens, mob } = useAppData();
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterBien, setFB]     = useState("tous");
  const [filterCat,  setFC]     = useState("tous");
  const [filterSt,   setFS]     = useState("tous");
  const [showForm,   setShowForm] = useState(false);
  const [form,       setForm]   = useState(EMPTY_FORM);
  const [editId,     setEditId] = useState(null);
  const [saving,     setSaving] = useState(false);
  const [err,        setErr]    = useState(null);
  const [drawing,    setDrawing] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchJSON("/api/maintenance", { timeout: 10000 });
      if (d.ok) setRecords(d.records);
    } catch (e) { console.warn("[maintenance] load", e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Reconduction automatique : quand une entrée récurrente passe à "Fait" avec
  // une "Prochaine échéance" renseignée, on recrée la même intervention en
  // "À planifier" à cette date — pour ne jamais perdre le fil (clim, piscine…).
  async function createFollowUp(rec) {
    try {
      await fetchJSON("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bien_id: rec.bien_id, category: rec.category, titre: rec.titre, prestataire: rec.prestataire || "",
          status: "a_planifier", scheduled_at: rec.next_due_at, notes: "",
        }),
      });
    } catch (e) { console.warn("[maintenance] reconduction", e.message); }
  }

  async function save() {
    if (!form.titre.trim()) { setErr("Le titre est requis."); return; }
    setSaving(true); setErr(null);
    try {
      const wasFait = editId ? records.find(r => r.id === editId)?.status === "fait" : false;
      const body = { ...form, cost: parseInt(form.cost) || 0 };
      const opts = { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
      if (editId) await fetchJSON(`/api/maintenance?id=${editId}`, { ...opts, method: "PATCH" });
      else await fetchJSON("/api/maintenance", { ...opts, method: "POST" });
      if (body.status === "fait" && !wasFait && body.next_due_at) await createFollowUp(body);
      await load();
      closeForm();
    } catch (e) { setErr(e.message || "Erreur"); }
    setSaving(false);
  }

  async function markFait(id) {
    try {
      const rec = records.find(r => r.id === id);
      await fetchJSON(`/api/maintenance?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "fait", done_at: todayStr() }),
      });
      if (rec?.next_due_at) await createFollowUp(rec);
      await load();
    } catch (e) { window.alert("Erreur : " + e.message); }
  }

  async function del(id) {
    if (!window.confirm("Supprimer cette entrée ?")) return;
    try {
      await fetchJSON(`/api/maintenance?id=${id}`, { method: "DELETE" });
      setRecords(rs => rs.filter(r => r.id !== id));
    } catch (e) { window.alert("Erreur : " + e.message); }
  }

  async function addPhotos(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const room = MAX_PHOTOS - form.photos.length;
    if (room <= 0) { setErr(`Maximum ${MAX_PHOTOS} photos.`); return; }
    setProcessingPhoto(true); setErr(null);
    try {
      const compressed = await Promise.all(files.slice(0, room).map(compressImage));
      setForm(f => ({ ...f, photos: [...f.photos, ...compressed] }));
    } catch (e) { setErr(e.message || "Erreur lors du traitement d'une photo."); }
    setProcessingPhoto(false);
  }
  function removePhoto(i) {
    setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }));
  }

  async function drawQualityCheck() {
    setDrawing(true);
    try {
      const d = await fetchJSON("/api/quality-check-draw", { method: "POST" });
      if (d.drawn) await load();
      else window.alert("Aucun bien éligible pour l'instant (tous déjà contrôlés récemment ou en cours).");
    } catch (e) { window.alert("Erreur : " + e.message); }
    setDrawing(false);
  }

  function openEdit(rec) {
    setForm({ ...EMPTY_FORM, ...rec, cost: rec.cost ? String(rec.cost) : "", photos: parsePhotos(rec.photos), video_url: rec.video_url || "" });
    setEditId(rec.id);
    setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setErr(null); }

  const bienLabel = (id) => {
    if (!id || id === "tous") return "Tous les biens";
    return biens.find(b => b.id === id)?.nom || id;
  };

  // ── Filtrage ─────────────────────────────────────────────────────────────
  const filtered = records.filter(r => {
    if (filterBien !== "tous" && r.bien_id !== filterBien) return false;
    if (filterCat  !== "tous" && r.category !== filterCat)  return false;
    if (filterSt   !== "tous" && r.status   !== filterSt)   return false;
    return true;
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const aPlanifier = records.filter(r => r.status === "a_planifier").length;
  const planifiees = records.filter(r => r.status === "planifie").length;
  const now = todayStr().slice(0, 7);
  const faitesMois = records.filter(r => r.status === "fait" && r.done_at?.startsWith(now)).length;
  const coutAnnuel = records.filter(r => r.status === "fait" && r.done_at?.startsWith(todayStr().slice(0, 4))).reduce((s, r) => s + (r.cost || 0), 0);

  // ── Styles ───────────────────────────────────────────────────────────────
  const card  = { background: "#1e293b", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" };
  const inp   = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, boxSizing: "border-box" };
  const lbl   = { fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3, display: "block" };
  const sel   = { ...inp, cursor: "pointer" };
  const btn   = (col = "#3b82f6") => ({ padding: "8px 16px", borderRadius: 8, border: "none", background: col, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" });

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0 40px" }}>

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>🛠️ Maintenance préventive</h2>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>Suivi des interventions récurrentes — clim, piscine, jardin…</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={drawQualityCheck} disabled={drawing} title="Tire un bien au hasard pour un contrôle qualité surprise" style={{ ...btn(drawing ? "#334155" : "#22c55e") }}>
            {drawing ? "Tirage…" : "🎲 Contrôle qualité"}
          </button>
          <button onClick={() => { setShowForm(s => !s); setEditId(null); setForm(EMPTY_FORM); }} style={btn("#0ea5e9")}>
            + Nouvelle entrée
          </button>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "À planifier",      val: aPlanifier, color: "#f59e0b" },
          { label: "Planifiées",       val: planifiees,  color: "#3b82f6" },
          { label: "Faites ce mois",   val: faitesMois,  color: "#22c55e" },
          { label: "Coût annuel",      val: fmtCost(coutAnnuel) || "—", color: "#94a3b8" },
        ].map(k => (
          <div key={k.label} style={{ ...card, textAlign: "center", padding: "14px 10px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Formulaire ajout / édition ───────────────────────────────────── */}
      {showForm && (
        <div style={{ ...card, borderColor: "rgba(14,165,233,0.3)", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "#0ea5e9", fontWeight: 700 }}>{editId ? "Modifier" : "Nouvelle entrée"}</span>
            <button onClick={closeForm} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Bien</label>
              <select style={sel} value={form.bien_id} onChange={e => setForm(f => ({ ...f, bien_id: e.target.value }))}>
                <option value="tous">Tous les biens</option>
                {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Catégorie</label>
              <select style={sel} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CAT.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: mob ? "" : "span 2" }}>
              <label style={lbl}>Titre *</label>
              <input style={inp} value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Ex : Nettoyage filtres clim Villa Amaryllis" />
            </div>
            <div>
              <label style={lbl}>Prestataire</label>
              <input style={inp} value={form.prestataire} onChange={e => setForm(f => ({ ...f, prestataire: e.target.value }))} placeholder="Nom / société" />
            </div>
            <div>
              <label style={lbl}>Coût (€)</label>
              <input style={inp} type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label style={lbl}>Statut</label>
              <select style={sel} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Date prévue</label>
              <input style={inp} type="date" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
            {(form.status === "fait" || editId) && (
              <div>
                <label style={lbl}>Date réalisée</label>
                <input style={inp} type="date" value={form.done_at} onChange={e => setForm(f => ({ ...f, done_at: e.target.value }))} />
              </div>
            )}
            <div>
              <label style={lbl}>Prochaine échéance</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input style={inp} type="date" value={form.next_due_at} onChange={e => setForm(f => ({ ...f, next_due_at: e.target.value }))} />
                {DEFAULT_INTERVAL[form.category] && (
                  <button
                    type="button"
                    title="Suggérer la prochaine échéance"
                    onClick={() => setForm(f => ({ ...f, next_due_at: addDaysStr(f.done_at || f.scheduled_at, DEFAULT_INTERVAL[f.category].days) }))}
                    style={{ padding: "0 10px", borderRadius: 8, border: "1px solid rgba(14,165,233,0.3)", background: "rgba(14,165,233,0.08)", color: "#0ea5e9", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    🔄 {DEFAULT_INTERVAL[form.category].label}
                  </button>
                )}
              </div>
            </div>
            <div style={{ gridColumn: mob ? "" : "span 2" }}>
              <label style={lbl}>Notes</label>
              <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observations, référence prestataire, devis…" />
            </div>
            <div style={{ gridColumn: mob ? "" : "span 2" }}>
              <label style={lbl}>Photos ({form.photos.length}/{MAX_PHOTOS})</label>
              {form.photos.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {form.photos.map((p, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={p} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)" }} />
                      <button type="button" onClick={() => removePhoto(i)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: "#ef4444", color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: "18px", padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              {form.photos.length < MAX_PHOTOS && (
                <label style={{ ...btn("#334155"), display: "inline-flex", alignItems: "center", background: "transparent", border: "1px dashed rgba(255,255,255,0.2)", color: "#94a3b8", cursor: "pointer" }}>
                  {processingPhoto ? "Traitement…" : "📷 Ajouter des photos"}
                  <input type="file" accept="image/*" multiple capture="environment" style={{ display: "none" }} onChange={e => { addPhotos(e.target.files); e.target.value = ""; }} disabled={processingPhoto} />
                </label>
              )}
            </div>
            <div style={{ gridColumn: mob ? "" : "span 2" }}>
              <label style={lbl}>Vidéo (lien externe)</label>
              <input style={inp} value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="Lien Google Photos, WhatsApp, YouTube non listé…" />
            </div>
          </div>
          {err && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={save} disabled={saving} style={btn(saving ? "#334155" : "#0ea5e9")}>
              {saving ? "Enregistrement…" : editId ? "Enregistrer" : "Ajouter"}
            </button>
            <button onClick={closeForm} style={{ ...btn("#334155"), background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Filtres ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <select style={{ ...sel, width: "auto", flex: "1 1 160px" }} value={filterBien} onChange={e => setFB(e.target.value)}>
          <option value="tous">Tous les biens</option>
          {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
        <select style={{ ...sel, width: "auto", flex: "1 1 140px" }} value={filterCat} onChange={e => setFC(e.target.value)}>
          <option value="tous">Toutes catégories</option>
          {CAT.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select style={{ ...sel, width: "auto", flex: "1 1 130px" }} value={filterSt} onChange={e => setFS(e.target.value)}>
          <option value="tous">Tous statuts</option>
          {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {(filterBien !== "tous" || filterCat !== "tous" || filterSt !== "tous") && (
          <button onClick={() => { setFB("tous"); setFC("tous"); setFS("tous"); }} style={{ ...btn("#334155"), background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", flex: "none" }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Liste ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: 40 }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "#64748b", padding: 40 }}>
          {records.length === 0
            ? <>Aucune entrée. Cliquez sur <strong style={{ color: "#0ea5e9" }}>+ Nouvelle entrée</strong> pour commencer.</>
            : "Aucune entrée pour ces filtres."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(rec => {
            const st  = ST_MAP[rec.status]  || ST_MAP.a_planifier;
            const cat = CAT_MAP[rec.category] || CAT_MAP.autre;
            const days = rec.scheduled_at ? daysUntil(rec.scheduled_at) : null;
            const overdue = days !== null && days < 0 && rec.status !== "fait";
            const urgent  = days !== null && days >= 0 && days <= 14 && rec.status !== "fait";

            return (
              <div key={rec.id} style={{ ...card, borderColor: overdue ? "rgba(239,68,68,0.3)" : urgent ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {/* Icône catégorie */}
                  <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{cat.icon}</div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{rec.titre}</span>
                      {/* Badge statut */}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>
                        {st.label}
                      </span>
                      {overdue && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>⚠ En retard</span>}
                      {urgent  && !overdue && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>⏰ Urgent</span>}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>🏠 {bienLabel(rec.bien_id)}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{cat.icon} {cat.label}</span>
                      {rec.prestataire && <span style={{ fontSize: 11, color: "#64748b" }}>👷 {rec.prestataire}</span>}
                      {rec.cost > 0 && <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtCost(rec.cost)}</span>}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 4 }}>
                      {rec.scheduled_at && (
                        <span style={{ fontSize: 11, color: overdue ? "#ef4444" : urgent ? "#f59e0b" : "#64748b" }}>
                          📅 Prévue : {fmtDate(rec.scheduled_at)}{days !== null && rec.status !== "fait" ? ` (${days < 0 ? `${Math.abs(days)}j de retard` : days === 0 ? "aujourd'hui" : `dans ${days}j`})` : ""}
                        </span>
                      )}
                      {rec.done_at    && <span style={{ fontSize: 11, color: "#22c55e" }}>✅ Faite le {fmtDate(rec.done_at)}</span>}
                      {rec.next_due_at && <span style={{ fontSize: 11, color: "#64748b" }}>🔄 Prochaine : {fmtDate(rec.next_due_at)}</span>}
                    </div>
                    {rec.notes && <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, fontStyle: "italic" }}>{rec.notes}</div>}
                    {(() => {
                      const photos = parsePhotos(rec.photos);
                      return (photos.length > 0 || rec.video_url) && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
                          {photos.map((p, i) => <img key={i} src={p} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)" }} />)}
                          {rec.video_url && (
                            <a href={rec.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#0ea5e9", textDecoration: "none" }}>🎥 Vidéo</a>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: mob ? "column" : "row", gap: 6, flexShrink: 0 }}>
                    {rec.status !== "fait" && (
                      <button onClick={() => markFait(rec.id)} title="Marquer comme faite" style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
                        ✓ Fait
                      </button>
                    )}
                    <button onClick={() => openEdit(rec)} title="Modifier" style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>
                      ✏️
                    </button>
                    <button onClick={() => del(rec.id)} title="Supprimer" style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ textAlign: "center", color: "#475569", fontSize: 11, marginTop: 16 }}>
          {filtered.length} entrée{filtered.length > 1 ? "s" : ""}
          {filtered.length !== records.length ? ` (sur ${records.length} au total)` : ""}
        </div>
      )}
    </div>
  );
}
