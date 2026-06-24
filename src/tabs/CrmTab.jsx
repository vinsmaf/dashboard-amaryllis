/**
 * CrmTab — Base clients Amaryllis Locations
 * Source : GET/PATCH /api/crm-clients
 */
import { useState, useEffect, useMemo } from "react";
import { useAppData } from "../AppDataContext.jsx";
import { fetchJSON } from "../lib/apiFetch.js";

const BIENS = ["amaryllis","iguana","zandoli","geko","mabouya","schoelcher","nogent"];
const CANAL_LABEL = { airbnb: "Airbnb", booking: "Booking", direct: "Direct", inconnu: "Inconnu" };
const CANAL_COLOR = { airbnb: "#ff5a5f", booking: "#003580", direct: "#16a34a", inconnu: "#6b7280" };
const STATUT_LABEL = { locataire: "locataire", prospect: "prospect", longue_duree: "longue durée", a_confirmer: "à confirmer", archive: "archivé" };
const STATUT_COLOR = { locataire: "#38bdf8", prospect: "#f59e0b", longue_duree: "#a78bfa", a_confirmer: "#fb923c", archive: "#64748b" };

function fmt(n) {
  return Number(n || 0).toLocaleString("fr-FR") + "€";
}
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function parseBiens(raw) {
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [String(p)]; }
  catch { return raw.split(/[,;]/).map(s => s.trim()).filter(Boolean); }
}
function parseTags(raw) {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

// Segmentation RFM-light (calcul client-side depuis les champs déjà chargés).
// Récence = dernier_sejour ; un client n'appartient qu'à UN segment (priorité ci-dessous).
function monthsSince(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}
function segmentOf(c) {
  if (parseTags(c.tags).includes("vip") || (c.ltv_total || 0) >= 3000) return "vip";
  if (!c.email && !c.mobile) return "sans-contact";
  const m = monthsSince(c.dernier_sejour);
  if (m <= 6)  return "recent";
  if (m <= 24) return "dormant";
  return "perdu";
}
const SEGMENTS = [
  { id: "recent",       label: "Récents (<6 mois)",     color: "#34d399", hint: "satisfaits → fidéliser" },
  { id: "dormant",      label: "Dormants (6–24 mois)",  color: "#f59e0b", hint: "à réactiver" },
  { id: "perdu",        label: "Perdus (>24 mois)",     color: "#f87171", hint: "win-back" },
  { id: "vip",          label: "VIP / LTV ≥3k€",        color: "#a78bfa", hint: "prioritaire" },
  { id: "sans-contact", label: "Sans contact",          color: "#64748b", hint: "à enrichir" },
];

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "var(--c-card,#1e293b)", borderRadius: 12, padding: "16px 20px", minWidth: 140 }}>
      <div style={{ fontSize: 11, color: "var(--c-muted,#94a3b8)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || "var(--c-text,#f1f5f9)", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--c-muted,#94a3b8)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function TagBadge({ tag }) {
  const COLOR = {
    "récurrent": "#7c3aed",
    "vip": "#b45309",
    "contactable-email": "#0369a1",
    "contactable-tel": "#0f766e",
  };
  return (
    <span style={{
      display: "inline-block", fontSize: 10, padding: "2px 7px", borderRadius: 99,
      background: (COLOR[tag] || "#374151") + "33",
      color: COLOR[tag] || "#9ca3af",
      border: `1px solid ${COLOR[tag] || "#374151"}55`,
      marginRight: 4, marginBottom: 2, fontWeight: 600,
    }}>{tag}</span>
  );
}

function ClientCard({ client, onSelect, selected }) {
  const biens  = parseBiens(client.biens);
  const tags   = parseTags(client.tags);
  const isVip  = tags.includes("vip");
  const isRec  = client.is_recurrent;
  return (
    <div
      onClick={() => onSelect(client)}
      style={{
        background: selected ? "var(--c-navy,#0f172a)" : "var(--c-card,#1e293b)",
        border: selected ? "1.5px solid var(--c-coral,#e76f51)" : `1.5px solid ${isVip ? "#b4530922" : "transparent"}`,
        borderRadius: 10, padding: "14px 16px", cursor: "pointer",
        transition: "all .15s", marginBottom: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--c-text,#f1f5f9)" }}>
            {client.prenom} {client.nom}
          </span>
          {isVip && <span style={{ marginLeft: 8, fontSize: 11, color: "#f59e0b" }}>★ VIP</span>}
          {isRec ? <span style={{ marginLeft: 6, fontSize: 11, color: "#a78bfa" }}>↩ récurrent</span> : null}
        </div>
        <div style={{ fontWeight: 700, color: "#34d399", fontSize: 15 }}>{fmt(client.ltv_total)}</div>
      </div>
      <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{
          fontSize: 11, padding: "1px 7px", borderRadius: 99,
          background: (CANAL_COLOR[client.canal_principal] || "#6b7280") + "33",
          color: CANAL_COLOR[client.canal_principal] || "#9ca3af",
          border: `1px solid ${CANAL_COLOR[client.canal_principal] || "#6b7280"}55`,
        }}>{CANAL_LABEL[client.canal_principal] || client.canal_principal}</span>
        {client.statut && client.statut !== "locataire" && (
          <span style={{
            fontSize: 10, padding: "1px 6px", borderRadius: 99,
            background: (STATUT_COLOR[client.statut] || "#6b7280") + "22",
            color: STATUT_COLOR[client.statut] || "#94a3b8",
            border: `1px solid ${STATUT_COLOR[client.statut] || "#6b7280"}44`,
          }}>{STATUT_LABEL[client.statut] || client.statut}</span>
        )}
        <span style={{ fontSize: 12, color: "var(--c-muted,#94a3b8)" }}>{client.nb_sejours} séjour{client.nb_sejours > 1 ? "s" : ""}</span>
        {biens.map(b => (
          <span key={b} style={{ fontSize: 11, color: "var(--c-muted,#94a3b8)", background: "#ffffff11", padding: "1px 6px", borderRadius: 6 }}>{b}</span>
        ))}
        {client.email && <span style={{ fontSize: 11, color: "#38bdf8" }}>✉ {client.email}</span>}
        {!client.email && client.mobile && <span style={{ fontSize: 11, color: "#34d399" }}>📞 {client.mobile}</span>}
      </div>
      <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
        {tags.map(t => <TagBadge key={t} tag={t} />)}
      </div>
    </div>
  );
}

const INPUT_STYLE = {
  width: "100%", background: "#ffffff08", border: "1px solid #ffffff15",
  borderRadius: 7, padding: "7px 10px", color: "#f1f5f9", fontSize: 13,
  boxSizing: "border-box",
};

function DetailPanel({ client, onClose, onSave, onDelete, allClients }) {
  const [email,  setEmail]  = useState(client.email  || "");
  const [mobile, setMobile] = useState(client.mobile || "");
  const [statut, setStatut] = useState(client.statut || "locataire");
  const [notes,  setNotes]  = useState(client.notes  || "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeQ,  setMergeQ]  = useState("");
  const [mergeTarget, setMergeTarget] = useState(null);
  const biens = parseBiens(client.biens);
  const tags  = parseTags(client.tags);

  async function save() {
    setSaving(true);
    try {
      await fetchJSON(`/api/crm-clients?id=${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || null, mobile: mobile || null, statut, notes }),
      });
      onSave({ ...client, email: email || null, mobile: mobile || null, statut, notes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert("Erreur sauvegarde: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!confirm(`Supprimer ${client.prenom} ${client.nom} ? Cette action est irréversible.`)) return;
    try {
      await fetchJSON(`/api/crm-clients?id=${client.id}`, { method: "DELETE" });
      onDelete(client.id);
    } catch (e) { alert("Erreur suppression: " + e.message); }
  }

  async function doMerge() {
    if (!mergeTarget) return;
    if (!confirm(`Fusionner "${mergeTarget.prenom} ${mergeTarget.nom}" INTO "${client.prenom} ${client.nom}" ? Le doublon sera supprimé.`)) return;
    try {
      await fetchJSON(`/api/guest-contacts?action=merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepId: client.id, dropId: mergeTarget.id }),
      });
      onDelete(mergeTarget.id);
      setMerging(false); setMergeQ(""); setMergeTarget(null);
    } catch (e) { alert("Erreur fusion: " + e.message); }
  }

  const mergeResults = mergeQ.length >= 2
    ? (allClients || []).filter(c => c.id !== client.id && (
        `${c.prenom} ${c.nom}`.toLowerCase().includes(mergeQ.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(mergeQ.toLowerCase()) ||
        (c.mobile || "").includes(mergeQ)
      )).slice(0, 5)
    : [];

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: 380,
      background: "var(--c-navy,#0f172a)", borderLeft: "1px solid #ffffff15",
      padding: 24, overflowY: "auto", zIndex: 100, boxShadow: "-4px 0 24px #00000040",
    }}>
      <button onClick={onClose} style={{ float: "right", background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer" }}>✕</button>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, color: "var(--c-text,#f1f5f9)" }}>{client.prenom} {client.nom}</h2>
      <div style={{ fontSize: 12, color: "var(--c-muted,#94a3b8)", marginBottom: 16 }}>
        {tags.map(t => <TagBadge key={t} tag={t} />)}
      </div>

      {/* Contact éditable */}
      <section style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--c-muted,#94a3b8)", letterSpacing: 1, marginBottom: 8 }}>Contact</h3>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" style={INPUT_STYLE} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>Téléphone</label>
          <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+596 696 00 00 00" style={INPUT_STYLE} />
        </div>
        {client.adresse && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{client.adresse}, {client.ville} {client.pays}</div>}
      </section>

      {/* Statut éditable */}
      <section style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--c-muted,#94a3b8)", letterSpacing: 1, marginBottom: 8 }}>Statut</h3>
        <select value={statut} onChange={e => setStatut(e.target.value)}
          style={{ ...INPUT_STYLE, cursor: "pointer" }}>
          {Object.entries(STATUT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </section>

      {/* Stats (lecture seule) */}
      <section style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--c-muted,#94a3b8)", letterSpacing: 1, marginBottom: 8 }}>Séjours</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "#ffffff08", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>Total séjours</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>{client.nb_sejours}</div>
          </div>
          <div style={{ background: "#ffffff08", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>LTV</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#34d399" }}>{fmt(client.ltv_total)}</div>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
          Premier : <span style={{ color: "#94a3b8" }}>{fmtDate(client.premier_sejour)}</span>
          {" · "}
          Dernier : <span style={{ color: "#94a3b8" }}>{fmtDate(client.dernier_sejour)}</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
          Biens : {biens.map(b => <span key={b} style={{ marginRight: 6, color: "#94a3b8" }}>{b}</span>)}
          {!biens.length && <span style={{ color: "#475569" }}>—</span>}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
          Canal : <span style={{ color: CANAL_COLOR[client.canal_principal] || "#94a3b8" }}>
            {CANAL_LABEL[client.canal_principal] || client.canal_principal || "—"}
          </span>
        </div>
      </section>

      {/* Notes */}
      <section style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--c-muted,#94a3b8)", letterSpacing: 1, marginBottom: 8 }}>Notes</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes privées sur ce client…"
          style={{ ...INPUT_STYLE, minHeight: 90, resize: "vertical" }}
        />
        <button
          onClick={save}
          disabled={saving}
          style={{
            marginTop: 8, padding: "8px 16px", background: "var(--c-coral,#e76f51)",
            color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%",
          }}
        >
          {saving ? "Sauvegarde…" : saved ? "✓ Sauvegardé" : "Sauvegarder"}
        </button>
      </section>

      {/* Fusionner */}
      <section style={{ marginBottom: 20, borderTop: "1px solid #ffffff0f", paddingTop: 16 }}>
        <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--c-muted,#94a3b8)", letterSpacing: 1, marginBottom: 8 }}>Fusionner avec un doublon</h3>
        {!merging ? (
          <button onClick={() => setMerging(true)} style={{
            padding: "6px 12px", background: "#1e293b", color: "#94a3b8",
            border: "1px solid #ffffff15", borderRadius: 7, cursor: "pointer", fontSize: 12,
          }}>Fusionner…</button>
        ) : (
          <div>
            <input
              value={mergeQ}
              onChange={e => { setMergeQ(e.target.value); setMergeTarget(null); }}
              placeholder="Nom, email ou tél du doublon…"
              style={{ ...INPUT_STYLE, marginBottom: 6 }}
              autoFocus
            />
            {mergeResults.map(c => (
              <div key={c.id} onClick={() => setMergeTarget(c)} style={{
                padding: "7px 10px", borderRadius: 7, marginBottom: 4, cursor: "pointer",
                background: mergeTarget?.id === c.id ? "#7c3aed22" : "#ffffff08",
                border: `1px solid ${mergeTarget?.id === c.id ? "#7c3aed" : "transparent"}`,
                fontSize: 13,
              }}>
                <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.prenom} {c.nom}</span>
                {c.email && <span style={{ color: "#64748b", marginLeft: 8, fontSize: 11 }}>{c.email}</span>}
                {c.mobile && <span style={{ color: "#64748b", marginLeft: 8, fontSize: 11 }}>{c.mobile}</span>}
              </div>
            ))}
            {mergeQ.length >= 2 && mergeResults.length === 0 && (
              <div style={{ fontSize: 12, color: "#475569" }}>Aucun résultat</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={doMerge} disabled={!mergeTarget} style={{
                flex: 1, padding: "7px 0", background: mergeTarget ? "#7c3aed" : "#334155",
                color: "#fff", border: "none", borderRadius: 7, cursor: mergeTarget ? "pointer" : "default",
                fontSize: 12, fontWeight: 600,
              }}>Confirmer la fusion</button>
              <button onClick={() => { setMerging(false); setMergeQ(""); setMergeTarget(null); }} style={{
                padding: "7px 12px", background: "transparent", color: "#64748b",
                border: "1px solid #ffffff15", borderRadius: 7, cursor: "pointer", fontSize: 12,
              }}>Annuler</button>
            </div>
          </div>
        )}
      </section>

      {/* Supprimer */}
      <section style={{ borderTop: "1px solid #ffffff0f", paddingTop: 16 }}>
        <button onClick={doDelete} style={{
          width: "100%", padding: "8px 0", background: "transparent",
          color: "#f87171", border: "1px solid #f8717133", borderRadius: 7,
          cursor: "pointer", fontSize: 12, fontWeight: 600,
        }}>Supprimer ce contact</button>
      </section>
    </div>
  );
}

function NewContactModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", mobile: "", statut: "locataire", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function create() {
    if (!form.prenom && !form.nom) return;
    setSaving(true);
    try {
      const d = await fetchJSON("/api/crm-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onCreated(d.id);
    } catch (e) {
      alert("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const field = (label, key, placeholder, type = "text") => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
        placeholder={placeholder} style={INPUT_STYLE} />
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#00000080", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--c-navy,#0f172a)", borderRadius: 14, padding: 28,
        width: 400, maxWidth: "90vw", boxShadow: "0 8px 40px #00000060",
        border: "1px solid #ffffff15",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>Nouveau contact</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          {field("Prénom", "prenom", "Prénom")}
          {field("Nom", "nom", "Nom")}
        </div>
        {field("Email", "email", "email@exemple.com", "email")}
        {field("Téléphone", "mobile", "+596 696 00 00 00", "tel")}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>Statut</label>
          <select value={form.statut} onChange={e => set("statut", e.target.value)} style={{ ...INPUT_STYLE, cursor: "pointer" }}>
            {Object.entries(STATUT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Optionnel…" style={{ ...INPUT_STYLE, minHeight: 60, resize: "vertical" }} />
        </div>
        <button onClick={create} disabled={saving || (!form.prenom && !form.nom)} style={{
          width: "100%", padding: "10px 0", background: "var(--c-coral,#e76f51)",
          color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
          fontSize: 14, fontWeight: 700, opacity: (!form.prenom && !form.nom) ? 0.5 : 1,
        }}>
          {saving ? "Création…" : "Créer le contact"}
        </button>
      </div>
    </div>
  );
}

export default function CrmTab() {
  const { addToast } = useAppData();
  const [clients, setClients]   = useState(null);
  const [total, setTotal]       = useState(0);
  const [err, setErr]           = useState(null);
  const [selected, setSelected] = useState(null);

  // Filtres
  const [search, setSearch]     = useState("");
  const [recOnly, setRecOnly]   = useState(false);
  const [contactOnly, setContactOnly] = useState(false);
  const [bienFilter, setBienFilter]   = useState("");
  const [segFilter, setSegFilter]     = useState(null);
  const [statutFilter, setStatutFilter] = useState("");
  const [exporting, setExporting]     = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  async function load() {
    setErr(null);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (recOnly)      params.set("recurrent", "1");
      if (contactOnly)  params.set("contact", "1");
      if (bienFilter)   params.set("bien", bienFilter);
      const d = await fetchJSON(`/api/crm-clients?${params}`);
      setClients(d.clients || []);
      setTotal(d.total || 0);
    } catch (e) {
      setErr(e.message);
      addToast?.("Erreur chargement CRM : " + e.message, "error");
    }
  }

  useEffect(() => { load(); }, [recOnly, contactOnly, bienFilter]);

  const filtered = useMemo(() => {
    let list = clients || [];
    if (segFilter) list = list.filter(c => segmentOf(c) === segFilter);
    if (statutFilter) list = list.filter(c => (c.statut || "locataire") === statutFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.prenom  || "").toLowerCase().includes(q) ||
        (c.nom     || "").toLowerCase().includes(q) ||
        (c.email   || "").toLowerCase().includes(q) ||
        (c.mobile  || "").replace(/\s/g,"").includes(q.replace(/\s/g,""))
      );
    }
    return list;
  }, [clients, search, segFilter, statutFilter]);

  // Comptage par segment (sur toute la base chargée)
  const segCounts = useMemo(() => {
    const counts = {};
    for (const c of clients || []) {
      const s = segmentOf(c);
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [clients]);

  // KPIs
  const kpis = useMemo(() => {
    const all = clients || [];
    return {
      total:      all.length,
      recurrents: all.filter(c => c.is_recurrent).length,
      contactable:all.filter(c => c.email || c.mobile).length,
      ltv:        all.reduce((s, c) => s + (c.ltv_total || 0), 0),
      vip:        all.filter(c => parseTags(c.tags).includes("vip")).length,
    };
  }, [clients]);

  function exportCsv() {
    if (!clients?.length) return;
    setExporting(true);
    const headers = ["Prénom","Nom","Email","Mobile","Séjours","LTV","Biens","Canal","Premier séjour","Dernier séjour","Tags","Notes"];
    const rows = clients.map(c => [
      c.prenom, c.nom, c.email||"", c.mobile||"",
      c.nb_sejours, c.ltv_total,
      parseBiens(c.biens).join(";"),
      c.canal_principal,
      c.premier_sejour||"", c.dernier_sejour||"",
      parseTags(c.tags).join(";"),
      (c.notes||"").replace(/"/g,'""'),
    ].map(v => `"${v}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["﻿"+csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `crm-clients-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setExporting(false);
  }

  function onSave(updated) {
    setClients(cs => cs.map(c => c.id === updated.id ? updated : c));
    setSelected(updated);
  }

  function onDelete(id) {
    setClients(cs => cs.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const hasDetail = !!selected;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      {/* Main */}
      <div style={{ flex: 1, padding: "24px 24px", overflowY: "auto", marginRight: hasDetail ? 380 : 0 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--c-text,#f1f5f9)" }}>
            👥 CRM Clients
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowNewModal(true)}
              style={{ padding: "8px 14px", background: "var(--c-coral,#e76f51)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
            >+ Contact</button>
            <button
              onClick={exportCsv}
              disabled={exporting || !clients?.length}
              style={{ padding: "8px 16px", background: "#334155", color: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
            >
              {exporting ? "Export…" : "⬇ CSV"}
            </button>
          </div>
        </div>

        {/* KPIs */}
        {clients && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <KpiCard label="Clients" value={kpis.total} />
            <KpiCard label="Récurrents" value={kpis.recurrents} sub={`${Math.round(kpis.recurrents/Math.max(kpis.total,1)*100)}% du total`} color="#a78bfa" />
            <KpiCard label="Contactables" value={kpis.contactable} sub="email ou tel" color="#38bdf8" />
            <KpiCard label="VIP (≥3k€)" value={kpis.vip} color="#f59e0b" />
            <KpiCard label="LTV totale" value={fmt(kpis.ltv)} color="#34d399" />
          </div>
        )}

        {/* Segments (cliquables) — cible des futures séquences CRM */}
        {clients && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            {SEGMENTS.map(s => {
              const n = segCounts[s.id] || 0;
              const active = segFilter === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSegFilter(active ? null : s.id)}
                  title={s.hint}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                    background: active ? s.color + "26" : "#1e293b",
                    border: `1.5px solid ${active ? s.color : "#ffffff12"}`,
                    color: "#f1f5f9", minWidth: 120, transition: "all .15s",
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{n}</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 9.5, color: "#94a3b8" }}>{s.hint}</span>
                </button>
              );
            })}
            {segFilter && (
              <button onClick={() => setSegFilter(null)}
                style={{ alignSelf: "center", padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid #ffffff20", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>
                ✕ tout
              </button>
            )}
          </div>
        )}

        {/* Filtres */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Recherche nom / email…"
            style={{
              padding: "8px 12px", borderRadius: 8, border: "1px solid #ffffff15",
              background: "#1e293b", color: "#f1f5f9", fontSize: 13, width: 220,
            }}
          />
          <select
            value={bienFilter}
            onChange={e => setBienFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ffffff15", background: "#1e293b", color: "#f1f5f9", fontSize: 13 }}
          >
            <option value="">Tous les biens</option>
            {BIENS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            value={statutFilter}
            onChange={e => setStatutFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ffffff15", background: "#1e293b", color: "#f1f5f9", fontSize: 13 }}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", cursor: "pointer" }}>
            <input type="checkbox" checked={recOnly} onChange={e => setRecOnly(e.target.checked)} />
            Récurrents seulement
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", cursor: "pointer" }}>
            <input type="checkbox" checked={contactOnly} onChange={e => setContactOnly(e.target.checked)} />
            Avec contact
          </label>
        </div>

        {/* Résultat count */}
        {clients && (
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            {filtered.length} client{filtered.length > 1 ? "s" : ""}{search ? ` (filtré sur "${search}")` : ""}
            {" · "}triés par LTV décroissante
          </div>
        )}

        {/* Liste */}
        {!clients && !err && (
          <div style={{ color: "#64748b", fontSize: 14, marginTop: 40, textAlign: "center" }}>Chargement…</div>
        )}
        {err && (
          <div style={{ color: "#f87171", fontSize: 14, marginTop: 20 }}>Erreur : {err}</div>
        )}
        {clients && filtered.length === 0 && (
          <div style={{ color: "#64748b", fontSize: 14, marginTop: 40, textAlign: "center" }}>Aucun client trouvé</div>
        )}
        {filtered.map(c => (
          <ClientCard
            key={c.id}
            client={c}
            selected={selected?.id === c.id}
            onSelect={cl => setSelected(sel => sel?.id === cl.id ? null : cl)}
          />
        ))}
      </div>

      {/* Detail */}
      {selected && (
        <DetailPanel
          client={selected}
          onClose={() => setSelected(null)}
          onSave={onSave}
          onDelete={onDelete}
          allClients={clients}
        />
      )}

      {/* Nouveau contact */}
      {showNewModal && (
        <NewContactModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => { setShowNewModal(false); load(); }}
        />
      )}
    </div>
  );
}
