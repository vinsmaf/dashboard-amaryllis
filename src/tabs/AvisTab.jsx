/**
 * AvisTab — modération des avis voyageurs (Airbnb) stockés en D1.
 * Source : GET /api/voyageur-feedback (admin). Masquer/afficher : PATCH ?action=moderate.
 * Les avis "masqués" (hidden=1) sont exclus du site public (?action=public + ?action=stats).
 */
import { useState, useEffect, useMemo } from "react";
import { useAppData } from "../AppDataContext.jsx";
import { fetchJSON } from "../lib/apiFetch.js";

// Retire les balises HTML (les textes Airbnb contiennent des <br/>).
function clean(t) {
  return String(t || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const LANG_FLAG = { fr: "🇫🇷", en: "🇬🇧", de: "🇩🇪", es: "🇪🇸", it: "🇮🇹", nl: "🇳🇱", da: "🇩🇰", pt: "🇵🇹" };

export default function AvisTab() {
  const { biens = [], addToast } = useAppData();
  const [rows, setRows] = useState(null);   // null = loading
  const [err, setErr] = useState(null);
  const [bienFilter, setBienFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all"); // "all" | "low" | "1".."5"
  const [sortLow, setSortLow] = useState(false);           // tri par note croissante
  const [showHidden, setShowHidden] = useState(true);
  const [busy, setBusy] = useState({});      // id -> bool (PATCH en cours)

  const nomOf = useMemo(() => Object.fromEntries(biens.map(b => [b.id, b.nom])), [biens]);

  useEffect(() => {
    let alive = true;
    fetchJSON("/api/voyageur-feedback")
      .then(d => { if (alive) setRows(d.reviews || []); })
      .catch(e => {
        if (!alive) return;
        const msg = e.status === 401
          ? "Session admin expirée — déconnecte-toi puis reconnecte-toi pour recharger les avis."
          : e.message;
        setErr(msg); addToast(msg, "error");
      });
    return () => { alive = false; };
  }, [addToast]);

  // Agrégats par bien (sur les avis NON masqués = ce que voit le public).
  const stats = useMemo(() => {
    const m = {};
    (rows || []).forEach(r => {
      const k = r.bien_id;
      if (!m[k]) m[k] = { bien_id: k, n: 0, hidden: 0, sum: 0 };
      if (r.hidden) m[k].hidden++;
      else { m[k].n++; m[k].sum += Number(r.rating) || 0; }
    });
    return Object.values(m).map(s => ({ ...s, avg: s.n ? (s.sum / s.n) : 0 }))
      .sort((a, z) => z.n - a.n);
  }, [rows]);

  const totalVisible = stats.reduce((s, x) => s + x.n, 0);
  const totalHidden = stats.reduce((s, x) => s + x.hidden, 0);
  // Avis "faibles" (≤ 3★) — pour les repérer vite.
  const lowCount = (rows || []).filter(r => (Number(r.rating) || 0) <= 3).length;

  const filtered = useMemo(() => {
    let r = rows || [];
    if (bienFilter !== "all") r = r.filter(x => x.bien_id === bienFilter);
    if (!showHidden) r = r.filter(x => !x.hidden);
    if (ratingFilter === "low") r = r.filter(x => (Number(x.rating) || 0) <= 3);
    else if (ratingFilter !== "all") r = r.filter(x => Math.round(Number(x.rating) || 0) === Number(ratingFilter));
    const byDate = (a, z) => String(z.review_date || "").localeCompare(String(a.review_date || ""));
    const byRating = (a, z) => (Number(a.rating) || 0) - (Number(z.rating) || 0) || byDate(a, z);
    return [...r].sort(sortLow ? byRating : byDate);
  }, [rows, bienFilter, showHidden, ratingFilter, sortLow]);

  async function toggle(r) {
    const next = r.hidden ? 0 : 1;
    setBusy(b => ({ ...b, [r.id]: true }));
    // maj optimiste
    setRows(rs => rs.map(x => x.id === r.id ? { ...x, hidden: next } : x));
    try {
      await fetchJSON("/api/voyageur-feedback?action=moderate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, hidden: !!next }),
      });
      addToast(next ? "Avis masqué du site public" : "Avis ré-affiché", "success");
    } catch (e) {
      setRows(rs => rs.map(x => x.id === r.id ? { ...x, hidden: r.hidden } : x)); // rollback
      addToast(e.message || "Échec de la modération", "error");
    } finally {
      setBusy(b => { const c = { ...b }; delete c[r.id]; return c; });
    }
  }

  // ── styles ────────────────────────────────────────────────────────────
  const card = { background: "#1e293b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 14, marginBottom: 12 };
  const sel = { padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, cursor: "pointer" };
  const chip = { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.07)", color: "#cbd5e1" };

  if (err && !rows) return <div style={{ maxWidth: 820, margin: "0 auto", color: "#fca5a5" }}>Erreur : {err}</div>;
  if (rows === null) return <div style={{ maxWidth: 820, margin: "0 auto", color: "#94a3b8" }}>Chargement des avis…</div>;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: 20 }}>⭐ Avis voyageurs</h2>
          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
            {totalVisible} affichés sur le site · {totalHidden} masqués · {rows.length} au total
            {lowCount > 0 && (
              <button
                onClick={() => { setRatingFilter(ratingFilter === "low" ? "all" : "low"); setSortLow(true); }}
                style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(239,68,68,0.4)", background: ratingFilter === "low" ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.12)", color: "#fca5a5", cursor: "pointer" }}
                title="Afficher uniquement les avis ≤ 3★">
                ⚠️ {lowCount} avis ≤ 3★
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select style={sel} value={bienFilter} onChange={e => setBienFilter(e.target.value)}>
            <option value="all">Tous les biens</option>
            {stats.map(s => <option key={s.bien_id} value={s.bien_id}>{nomOf[s.bien_id] || s.bien_id} ({s.n + s.hidden})</option>)}
          </select>
          <select style={sel} value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} title="Filtrer par note">
            <option value="all">Toutes les notes</option>
            <option value="low">≤ 3★ (à surveiller)</option>
            <option value="5">5★</option>
            <option value="4">4★</option>
            <option value="3">3★</option>
            <option value="2">2★</option>
            <option value="1">1★</option>
          </select>
          <button style={{ ...sel, background: sortLow ? "#334155" : "#0f172a" }} onClick={() => setSortLow(v => !v)} title="Trier par note croissante">
            {sortLow ? "↑ Notes basses d'abord" : "📅 Plus récents d'abord"}
          </button>
          <button style={{ ...sel, background: showHidden ? "#334155" : "#0f172a" }} onClick={() => setShowHidden(v => !v)}>
            {showHidden ? "👁 Masqués visibles" : "🙈 Masqués cachés"}
          </button>
        </div>
      </div>

      {/* Synthèse par bien */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 10, marginBottom: 18 }}>
        {stats.map(s => (
          <div key={s.bien_id} style={{ ...card, marginBottom: 0, padding: 12, cursor: "pointer", outline: bienFilter === s.bien_id ? "2px solid #f59e0b" : "none" }}
            onClick={() => setBienFilter(bienFilter === s.bien_id ? "all" : s.bien_id)}>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{nomOf[s.bien_id] || s.bien_id}</div>
            <div style={{ color: "#fbbf24", fontSize: 18, fontWeight: 700, marginTop: 2 }}>{s.avg ? s.avg.toFixed(2) : "—"} ★</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>{s.n} publics{s.hidden ? ` · ${s.hidden} masqués` : ""}</div>
          </div>
        ))}
      </div>

      {/* Liste des avis */}
      {filtered.length === 0 && <div style={{ color: "#94a3b8" }}>Aucun avis pour ce filtre.</div>}
      {filtered.map(r => {
        const low = (Number(r.rating) || 0) <= 3;
        return (
        <div key={r.id} style={{ ...card, opacity: r.hidden ? 0.55 : 1, borderLeft: low ? "3px solid #ef4444" : card.border }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ color: low ? "#f87171" : "#fbbf24", fontWeight: 700 }}>{"★".repeat(Math.round(r.rating || 0))}<span style={{ color: "#475569" }}>{"★".repeat(5 - Math.round(r.rating || 0))}</span></span>
            <strong style={{ color: "#e2e8f0", fontSize: 14 }}>{r.prenom || "Voyageur"}</strong>
            <span style={chip}>{nomOf[r.bien_id] || r.bien_id}</span>
            <span style={chip}>{LANG_FLAG[r.lang] || r.lang || "?"}</span>
            <span style={{ ...chip, background: "transparent", color: "#64748b" }}>{r.review_date}</span>
            {r.hidden ? <span style={{ ...chip, background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>masqué</span> : null}
            <button
              onClick={() => toggle(r)}
              disabled={!!busy[r.id]}
              style={{ marginLeft: "auto", ...sel, fontSize: 12, padding: "4px 10px", opacity: busy[r.id] ? 0.5 : 1, color: r.hidden ? "#86efac" : "#fca5a5" }}>
              {busy[r.id] ? "…" : (r.hidden ? "↩ Afficher" : "🚫 Masquer")}
            </button>
          </div>
          <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 }}>{clean(r.review_text) || <em style={{ color: "#64748b" }}>(note sans texte)</em>}</div>
        </div>
        );
      })}
    </div>
  );
}
