// Onglet admin 🐞 Bugs — inbox des erreurs JS captées en prod + reports manuels.
// Tri par statut/type, push vers le backlog agents, capture d'écran des reports.

import { useState, useEffect, useCallback } from "react";
import { fetchJSON, adminFetch } from "../lib/apiFetch.js";

const KIND = {
  error:     { emoji: "💥", label: "Erreur JS",   color: "#ef4444" },
  rejection: { emoji: "⛔", label: "Promesse",    color: "#f97316" },
  console:   { emoji: "🟡", label: "console.error", color: "#eab308" },
  report:    { emoji: "🙋", label: "Report",       color: "#3b82f6" },
};
const STATUS = {
  new:     { label: "🆕 Nouveau",  color: "#ef4444" },
  triaged: { label: "👀 Trié",     color: "#eab308" },
  backlog: { label: "📋 Backlog",  color: "#3b82f6" },
  ignored: { label: "🔕 Ignoré",   color: "#64748b" },
  fixed:   { label: "✅ Corrigé",  color: "#22c55e" },
};
const SEVS = ["critique", "haute", "moyenne", "basse"];
const fmtDate = (ts) => ts ? new Date(ts * 1000).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export default function BugsTab() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fStatus, setFStatus] = useState("new");
  const [fKind, setFKind] = useState("");
  const [shots, setShots] = useState({});   // id → dataURL (chargé à la demande)
  const [zoom, setZoom] = useState(null);
  const [sev, setSev] = useState({});        // id → gravité choisie avant push backlog

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (fStatus) qs.set("status", fStatus);
    if (fKind) qs.set("kind", fKind);
    fetchJSON(`/api/client-errors?${qs}`, { timeout: 10000 })
      .then(d => { setItems(d?.items || []); setErr(null); })
      .catch(e => { setItems([]); if (e?.status !== 401) setErr(e?.message || "Erreur de chargement"); })
      .finally(() => setLoading(false));
  }, [fStatus, fKind]);
  useEffect(() => { load(); }, [load]);

  const patch = useCallback(async (id, body) => {
    try {
      await adminFetch(`/api/client-errors?id=${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      load();
    } catch { /* noop */ }
  }, [load]);

  const viewShot = useCallback(async (id) => {
    if (shots[id]) { setZoom(shots[id]); return; }
    try {
      const d = await fetchJSON("/api/client-errors?screenshots=1", { timeout: 15000 });
      const map = {};
      (d?.items || []).forEach(it => { if (it.screenshot) map[it.id] = it.screenshot; });
      setShots(map);
      if (map[id]) setZoom(map[id]);
    } catch { /* noop */ }
  }, [shots]);

  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>🐞 Bugs</h2>
        <span style={{ fontSize: 12, color: "#64748b" }}>Erreurs captées en prod + reports manuels → triables vers le backlog</span>
      </div>
      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px" }}>
        L'agent de triage hebdo (lundi) classe et pousse automatiquement les bugs récurrents. Ici tu peux aussi trier à la main.
      </p>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[["new", "🆕 Nouveaux"], ["backlog", "📋 Backlog"], ["fixed", "✅ Corrigés"], ["ignored", "🔕 Ignorés"], ["", "Tous"]].map(([v, l]) => (
          <button key={v} onClick={() => setFStatus(v)} style={chip(fStatus === v)}>{l}</button>
        ))}
        <span style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        {[["", "Tous types"], ["report", "🙋 Reports"], ["error", "💥 Erreurs"], ["console", "🟡 console"]].map(([v, l]) => (
          <button key={v} onClick={() => setFKind(v)} style={chip(fKind === v)}>{l}</button>
        ))}
        <button onClick={load} style={{ ...chip(false), marginLeft: "auto" }}>⟳ Rafraîchir</button>
      </div>

      {loading ? <div style={{ color: "#64748b", fontSize: 13 }}>Chargement…</div>
        : err ? <div style={{ color: "#f87171", fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "12px 14px" }}>⚠️ Erreur de chargement : {err}. <button onClick={load} style={{ ...chip(false), marginLeft: 6 }}>Réessayer</button></div>
        : items.length === 0 ? <div style={{ color: "#22c55e", fontSize: 14, padding: "20px 0" }}>✓ Aucun bug dans ce filtre.</div>
        : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map(it => {
            const k = KIND[it.kind] || KIND.error;
            const st = STATUS[it.status] || STATUS.new;
            return (
              <div key={it.id} style={{ background: "#0f172a", border: `1px solid rgba(255,255,255,0.08)`, borderLeft: `3px solid ${k.color}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: k.color }}>{k.emoji} {k.label}</span>
                  <span style={{ fontSize: 11, color: st.color, fontWeight: 600 }}>{st.label}</span>
                  {it.count > 1 && <span style={{ fontSize: 10, background: "rgba(239,68,68,0.15)", color: "#f87171", borderRadius: 6, padding: "1px 6px", fontWeight: 700 }}>×{it.count}</span>}
                  {it.severity && <span style={{ fontSize: 10, color: "#94a3b8" }}>· {it.severity}</span>}
                  <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto" }}>{fmtDate(it.last_seen)}</span>
                </div>
                <div style={{ fontSize: 13, color: "#e2e8f0", marginTop: 5, wordBreak: "break-word" }}>{it.message}</div>
                {it.comment && it.comment !== it.message && <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 3, fontStyle: "italic" }}>💬 {it.comment}</div>}
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  {it.path && <span title={it.url}>📄 {it.path}</span>}
                  {it.viewport && <span> · 🖥 {it.viewport}</span>}
                  {it.backlog_id && <span> · 📋 {it.backlog_id}</span>}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {Number(it.has_shot) === 1 && (
                    <button onClick={() => viewShot(it.id)} style={btn("#334155")}>📷 Capture</button>
                  )}
                  {it.status !== "backlog" && (
                    <>
                      <select value={sev[it.id] || it.severity || "moyenne"} onChange={e => setSev(s => ({ ...s, [it.id]: e.target.value }))}
                        style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 11, padding: "4px 6px" }}>
                        {SEVS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => patch(it.id, { tobacklog: true, severity: sev[it.id] || it.severity || "moyenne" })} style={btn("#2563eb")}>→ Backlog</button>
                    </>
                  )}
                  {it.status !== "fixed"   && <button onClick={() => patch(it.id, { status: "fixed" })} style={btn("#16a34a")}>✅ Corrigé</button>}
                  {it.status !== "ignored" && <button onClick={() => patch(it.id, { status: "ignored" })} style={btn("#475569")}>🔕 Ignorer</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {zoom && (
        <div onClick={() => setZoom(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <img src={zoom} alt="capture" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)" }} />
        </div>
      )}
    </div>
  );
}

const chip = (active) => ({
  background: active ? "#2563eb" : "#1e293b", color: active ? "#fff" : "#94a3b8",
  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
});
const btn = (bg) => ({ background: bg, color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" });
