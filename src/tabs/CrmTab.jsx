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

function fmt(n) {
  return Number(n || 0).toLocaleString("fr-FR") + "€";
}
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function parseBiens(raw) {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
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

function DetailPanel({ client, onClose, onSave }) {
  const [notes, setNotes] = useState(client.notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const biens = parseBiens(client.biens);
  const tags  = parseTags(client.tags);

  async function save() {
    setSaving(true);
    try {
      await fetchJSON(`/api/crm-clients?id=${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      onSave({ ...client, notes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert("Erreur sauvegarde: " + e.message);
    } finally {
      setSaving(false);
    }
  }

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

      {/* Contact */}
      <section style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--c-muted,#94a3b8)", letterSpacing: 1, marginBottom: 8 }}>Contact</h3>
        {client.email && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>Email : </span>
            <a href={`mailto:${client.email}`} style={{ color: "#38bdf8", fontSize: 13 }}>{client.email}</a>
          </div>
        )}
        {client.mobile && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>Tél : </span>
            <a href={`tel:${client.mobile}`} style={{ color: "#34d399", fontSize: 13 }}>{client.mobile}</a>
          </div>
        )}
        {client.adresse && <div style={{ fontSize: 12, color: "#64748b" }}>{client.adresse}, {client.ville} {client.pays}</div>}
        {!client.email && !client.mobile && <div style={{ fontSize: 13, color: "#475569" }}>Pas de contact disponible</div>}
      </section>

      {/* Stats */}
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
          Premier séjour : <span style={{ color: "#94a3b8" }}>{fmtDate(client.premier_sejour)}</span>
          {" · "}
          Dernier : <span style={{ color: "#94a3b8" }}>{fmtDate(client.dernier_sejour)}</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
          Biens : {biens.map(b => <span key={b} style={{ marginRight: 6, color: "#94a3b8" }}>{b}</span>)}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
          Canal : <span style={{ color: CANAL_COLOR[client.canal_principal] || "#94a3b8" }}>
            {CANAL_LABEL[client.canal_principal] || client.canal_principal}
          </span>
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--c-muted,#94a3b8)", letterSpacing: 1, marginBottom: 8 }}>Notes</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes privées sur ce client…"
          style={{
            width: "100%", minHeight: 100, background: "#ffffff08", border: "1px solid #ffffff15",
            borderRadius: 8, padding: 10, color: "#f1f5f9", fontSize: 13, resize: "vertical",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={save}
          disabled={saving}
          style={{
            marginTop: 8, padding: "8px 16px", background: "var(--c-coral,#e76f51)",
            color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          {saving ? "Sauvegarde…" : saved ? "✓ Sauvegardé" : "Sauvegarder"}
        </button>
      </section>
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
  const [exporting, setExporting]     = useState(false);

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
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.prenom || "").toLowerCase().includes(q) ||
        (c.nom    || "").toLowerCase().includes(q) ||
        (c.email  || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, search, segFilter]);

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
          <button
            onClick={exportCsv}
            disabled={exporting || !clients?.length}
            style={{ padding: "8px 16px", background: "#334155", color: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
          >
            {exporting ? "Export…" : "⬇ Export CSV"}
          </button>
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
        />
      )}
    </div>
  );
}
