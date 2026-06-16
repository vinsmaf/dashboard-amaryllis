// Onglet admin 🐞 Bugs — inbox des erreurs JS captées en prod + reports manuels.
// Tri statut/type/fréquence, compteurs, triage en masse, stack inline, captures.

import { useState, useEffect, useCallback, useMemo } from "react";
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
  const [counts, setCounts] = useState({});   // status → nb d'entrées (via /stats)
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fStatus, setFStatus] = useState("new");
  const [fKind, setFKind] = useState("");
  const [sortBy, setSortBy] = useState("date"); // "date" | "count"
  const [shots, setShots] = useState({});   // id → dataURL (chargé à la demande)
  const [zoom, setZoom] = useState(null);
  const [sev, setSev] = useState({});        // id → gravité choisie avant push backlog
  const [sel, setSel] = useState(() => new Set()); // ids sélectionnés (triage en masse)
  const [open, setOpen] = useState({});      // id → stack dépliée

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

  const loadStats = useCallback(() => {
    fetchJSON("/api/client-errors?stats=1", { timeout: 10000 })
      .then(d => {
        const c = {};
        (d?.groups || []).forEach(g => { c[g.status] = (c[g.status] || 0) + (g.n || 0); });
        c.__all = Object.values(c).reduce((s, n) => s + n, 0);
        setCounts(c);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const refresh = useCallback(() => { load(); loadStats(); }, [load, loadStats]);
  // Changer de filtre vide la sélection (évite des ids périmés) — fait dans le handler, pas un effet.
  const pickStatus = (v) => { setFStatus(v); setSel(new Set()); };
  const pickKind = (v) => { setFKind(v); setSel(new Set()); };

  const patch = useCallback(async (id, body) => {
    try {
      await adminFetch(`/api/client-errors?id=${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      refresh();
    } catch { /* noop */ }
  }, [refresh]);

  const bulk = useCallback(async (status) => {
    const ids = [...sel];
    if (!ids.length) return;
    try {
      await adminFetch("/api/client-errors", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, status }),
      });
      setSel(new Set());
      refresh();
    } catch { /* noop */ }
  }, [sel, refresh]);

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

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sortBy === "count") arr.sort((a, b) => (b.count || 0) - (a.count || 0) || (b.last_seen || 0) - (a.last_seen || 0));
    else arr.sort((a, b) => (b.last_seen || 0) - (a.last_seen || 0));
    return arr;
  }, [items, sortBy]);

  const allSelected = sorted.length > 0 && sorted.every(it => sel.has(it.id));
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(sorted.map(it => it.id)));
  const toggleOne = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>🐞 Bugs</h2>
        <span style={{ fontSize: 12, color: "#64748b" }}>Erreurs captées en prod + reports manuels → triables vers le backlog</span>
      </div>
      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px" }}>
        L'agent de triage hebdo (lundi) classe et pousse automatiquement les bugs récurrents. Ici tu peux aussi trier à la main (sélection multiple).
      </p>

      {/* Filtres statut (avec compteurs) */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {[["new", "🆕 Nouveaux"], ["triaged", "👀 Triés"], ["backlog", "📋 Backlog"], ["fixed", "✅ Corrigés"], ["ignored", "🔕 Ignorés"], ["", "Tous"]].map(([v, l]) => {
          const n = v === "" ? counts.__all : counts[v];
          return (
            <button key={v} onClick={() => pickStatus(v)} style={chip(fStatus === v)}>
              {l}{n != null && <span style={{ marginLeft: 6, opacity: 0.7 }}>{n}</span>}
            </button>
          );
        })}
        <button onClick={refresh} style={{ ...chip(false), marginLeft: "auto" }}>⟳ Rafraîchir</button>
      </div>

      {/* Filtres type + tri */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        {[["", "Tous types"], ["report", "🙋 Reports"], ["error", "💥 Erreurs"], ["console", "🟡 console"]].map(([v, l]) => (
          <button key={v} onClick={() => pickKind(v)} style={chip(fKind === v)}>{l}</button>
        ))}
        <span style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <span style={{ fontSize: 11, color: "#64748b" }}>Tri</span>
        <button onClick={() => setSortBy("date")} style={chip(sortBy === "date")}>🕒 Récents</button>
        <button onClick={() => setSortBy("count")} style={chip(sortBy === "count")}>🔥 Fréquence</button>
      </div>

      {/* Barre de triage en masse */}
      {sorted.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10, padding: "8px 12px", background: sel.size ? "rgba(37,99,235,0.12)" : "transparent", border: sel.size ? "1px solid rgba(37,99,235,0.35)" : "1px solid transparent", borderRadius: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            Tout ({sorted.length})
          </label>
          {sel.size > 0 && (
            <>
              <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{sel.size} sélectionné{sel.size > 1 ? "s" : ""}</span>
              <button onClick={() => bulk("ignored")} style={btn("#475569")}>🔕 Ignorer</button>
              <button onClick={() => bulk("fixed")} style={btn("#16a34a")}>✅ Corrigé</button>
              <button onClick={() => bulk("triaged")} style={btn("#a16207")}>👀 Trié</button>
              <button onClick={() => setSel(new Set())} style={{ ...btn("#1e293b"), color: "#94a3b8" }}>Annuler</button>
            </>
          )}
        </div>
      )}

      {loading ? <div style={{ color: "#64748b", fontSize: 13 }}>Chargement…</div>
        : err ? <div style={{ color: "#f87171", fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "12px 14px" }}>⚠️ Erreur de chargement : {err}. <button onClick={refresh} style={{ ...chip(false), marginLeft: 6 }}>Réessayer</button></div>
        : sorted.length === 0 ? <div style={{ color: "#22c55e", fontSize: 14, padding: "20px 0" }}>✓ Aucun bug dans ce filtre.</div>
        : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map(it => {
            const k = KIND[it.kind] || KIND.error;
            const st = STATUS[it.status] || STATUS.new;
            const checked = sel.has(it.id);
            return (
              <div key={it.id} style={{ background: checked ? "#13213b" : "#0f172a", border: `1px solid ${checked ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`, borderLeft: `3px solid ${k.color}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleOne(it.id)} style={{ cursor: "pointer" }} />
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

                {it.stack && open[it.id] && (
                  <pre style={{ fontSize: 10.5, color: "#94a3b8", background: "#0b1120", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "8px 10px", marginTop: 6, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{it.stack}</pre>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {it.stack && (
                    <button onClick={() => setOpen(o => ({ ...o, [it.id]: !o[it.id] }))} style={btn("#334155")}>{open[it.id] ? "▾ Stack" : "▸ Stack"}</button>
                  )}
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
