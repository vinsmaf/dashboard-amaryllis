// Onglet admin — Réclamations voyageurs.
// Source : /api/reclamations. PATCH pour mettre à jour statut/geste/notes.

import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../lib/apiFetch.js";

const STATUT = {
  ouvert:    { emoji: "🔴", label: "Ouvert",    color: "#ef4444" },
  en_cours:  { emoji: "🟡", label: "En cours",  color: "#f59e0b" },
  resolu:    { emoji: "✅", label: "Résolu",     color: "#22c55e" },
  ferme:     { emoji: "⬜", label: "Fermé",     color: "#94a3b8" },
};

const PRIORITE = {
  urgente:  { emoji: "🚨", label: "Urgente",  color: "#ef4444" },
  haute:    { emoji: "🔶", label: "Haute",    color: "#f97316" },
  normale:  { emoji: "🔵", label: "Normale",  color: "#3b82f6" },
  basse:    { emoji: "⬇️", label: "Basse",   color: "#94a3b8" },
};

const CANAL = {
  poststay: "📧 Post-séjour",
  contact:  "📬 Formulaire",
  direct:   "📞 Direct",
  airbnb:   "🏠 Airbnb",
};

const BIENS_LABELS = {
  amaryllis: "Amaryllis", zandoli: "Zandoli", geko: "Géko",
  mabouya: "Mabouya", schoelcher: "Schœlcher", nogent: "Nogent", iguana: "Iguana",
};

const fmtDate = ts => ts ? new Date(ts * 1000).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const json = d => Response.json(d);

export default function ReclamationsTab() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState(null);
  const [fStatut, setFStatut] = useState("ouvert");
  const [fBien, setFBien]     = useState("");
  const [open, setOpen]       = useState(null); // id de la réclamation dépliée
  const [editing, setEditing] = useState({}); // id → {notes_internes, geste_commercial}

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (fStatut) qs.set("statut", fStatut);
    if (fBien)   qs.set("bien", fBien);
    adminFetch(`/api/reclamations?${qs}`, { timeout: 10000 })
      .then(r => r.json())
      .then(d => { setItems(d?.items || []); setErr(null); })
      .catch(e => { setItems([]); if (e?.status !== 401) setErr(e?.message || "Erreur de chargement"); })
      .finally(() => setLoading(false));
  }, [fStatut, fBien]);

  useEffect(() => { load(); }, [load]);

  const patch = useCallback(async (id, body) => {
    try {
      await adminFetch(`/api/reclamations?id=${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      load();
    } catch { /* noop */ }
  }, [load]);

  const saveEdit = useCallback(async (id) => {
    const e = editing[id] || {};
    await patch(id, e);
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, [editing, patch]);

  const s = {
    header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" },
    badge:  (color) => ({ background: color + "20", color, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }),
    card:   { background: "var(--c-surface, #1e2a38)", border: "1px solid var(--c-border, #334155)", borderRadius: 12, marginBottom: 12, overflow: "hidden" },
    top:    { display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", cursor: "pointer" },
    meta:   { fontSize: 12, color: "var(--c-muted, #94a3b8)", marginTop: 2 },
    body:   { padding: "0 16px 16px", borderTop: "1px solid var(--c-border, #334155)" },
    sel:    { background: "var(--c-surface, #1e2a38)", color: "var(--c-text, #e2e8f0)", border: "1px solid var(--c-border, #334155)", borderRadius: 6, padding: "5px 10px", fontSize: 13 },
    ta:     { width: "100%", background: "var(--c-bg, #0f1923)", color: "var(--c-text, #e2e8f0)", border: "1px solid var(--c-border, #334155)", borderRadius: 6, padding: "8px 10px", fontSize: 13, resize: "vertical", minHeight: 64, boxSizing: "border-box" },
    btn:    (c) => ({ background: c, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }),
    empty:  { textAlign: "center", padding: "60px 0", color: "var(--c-muted, #94a3b8)", fontSize: 14 },
  };

  const counts = items.reduce((acc, i) => { acc[i.statut] = (acc[i.statut] || 0) + 1; return acc; }, {});

  return (
    <div style={{ padding: 24 }}>
      {/* En-tête + filtres */}
      <div style={s.header}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--c-text, #e2e8f0)" }}>😤 Réclamations</h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
          {Object.entries(STATUT).map(([k, v]) => (
            <button key={k} onClick={() => setFStatut(fStatut === k ? "" : k)}
              style={{ ...s.badge(v.color), cursor: "pointer", border: fStatut === k ? `2px solid ${v.color}` : "2px solid transparent", opacity: fStatut && fStatut !== k ? 0.5 : 1 }}>
              {v.emoji} {v.label} {counts[k] ? `(${counts[k]})` : ""}
            </button>
          ))}
        </div>
        <select style={s.sel} value={fBien} onChange={e => setFBien(e.target.value)}>
          <option value="">Tous les biens</option>
          {Object.entries(BIENS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={load} style={s.btn("#334155")}>↻</button>
      </div>

      {err && <div style={{ background: "#3b0a0a", color: "#fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>{err}</div>}

      {loading && <div style={s.empty}>Chargement…</div>}

      {!loading && items.length === 0 && (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          Aucune réclamation {fStatut ? `"${STATUT[fStatut]?.label}"` : ""}
        </div>
      )}

      {!loading && items.map(item => {
        const isOpen = open === item.id;
        const p = PRIORITE[item.priorite] || PRIORITE.normale;
        const st = STATUT[item.statut] || STATUT.ouvert;
        const ed = editing[item.id] || {};

        return (
          <div key={item.id} style={s.card}>
            <div style={s.top} onClick={() => setOpen(isOpen ? null : item.id)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={s.badge(st.color)}>{st.emoji} {st.label}</span>
                  <span style={s.badge(p.color)}>{p.emoji} {p.label}</span>
                  {item.bien_id && <span style={s.badge("#6366f1")}>{BIENS_LABELS[item.bien_id] || item.bien_id}</span>}
                  <span style={{ fontSize: 12, color: "var(--c-muted, #94a3b8)" }}>{CANAL[item.canal] || item.canal}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text, #e2e8f0)" }}>{item.objet}</div>
                <div style={s.meta}>
                  {item.voyageur_nom || item.voyageur_email || "Anonyme"} · {fmtDate(item.created_at)}
                </div>
              </div>
              <div style={{ fontSize: 16, color: "var(--c-muted, #94a3b8)" }}>{isOpen ? "▲" : "▼"}</div>
            </div>

            {isOpen && (
              <div style={s.body}>
                {/* Description */}
                <div style={{ padding: "12px 0 16px", fontSize: 14, color: "var(--c-text, #e2e8f0)", lineHeight: 1.7, whiteSpace: "pre-wrap", borderBottom: "1px solid var(--c-border, #334155)" }}>
                  {item.description}
                </div>

                {/* Infos */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, padding: "12px 0", borderBottom: "1px solid var(--c-border, #334155)", fontSize: 12, color: "var(--c-muted, #94a3b8)" }}>
                  {item.voyageur_email && <div><b>Email :</b> {item.voyageur_email}</div>}
                  {item.booking_id    && <div><b>Résa :</b> {item.booking_id}</div>}
                  {item.resolved_at   && <div><b>Résolu le :</b> {fmtDate(item.resolved_at)}</div>}
                </div>

                {/* Geste commercial */}
                <div style={{ padding: "12px 0 0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-muted, #94a3b8)", marginBottom: 4 }}>Geste commercial</label>
                      <textarea style={s.ta} rows={2}
                        defaultValue={item.geste_commercial || ""}
                        onChange={e => setEditing(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), geste_commercial: e.target.value } }))}
                        placeholder="Ex : remboursement 50€, nuit offerte…" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-muted, #94a3b8)", marginBottom: 4 }}>Notes internes</label>
                      <textarea style={s.ta} rows={2}
                        defaultValue={item.notes_internes || ""}
                        onChange={e => setEditing(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), notes_internes: e.target.value } }))}
                        placeholder="Contexte, actions prises…" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select style={s.sel} value={item.statut}
                      onChange={e => patch(item.id, { statut: e.target.value })}>
                      {Object.entries(STATUT).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                    </select>
                    <select style={s.sel} value={item.priorite}
                      onChange={e => patch(item.id, { priorite: e.target.value })}>
                      {Object.entries(PRIORITE).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                    </select>
                    {Object.keys(ed).length > 0 && (
                      <button style={s.btn("#16a34a")} onClick={() => saveEdit(item.id)}>💾 Enregistrer</button>
                    )}
                    {item.voyageur_email && (
                      <a href={`mailto:${item.voyageur_email}?subject=Votre réclamation — ${item.objet}`}
                        style={{ ...s.btn("#2563eb"), textDecoration: "none" }}>
                        📧 Répondre
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
