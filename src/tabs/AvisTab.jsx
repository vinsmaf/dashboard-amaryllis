/**
 * AvisTab — modération des avis voyageurs (Airbnb) stockés en D1.
 * Source : GET /api/voyageur-feedback (admin). Masquer/afficher : PATCH ?action=moderate.
 * Les avis "masqués" (hidden=1) sont exclus du site public (?action=public + ?action=stats).
 */
import { useState, useEffect, useMemo } from "react";
import { useAppData } from "../AppDataContext.jsx";
import { fetchJSON } from "../lib/apiFetch.js";
import { mdToHtml } from "../utils/mdToHtml.js";

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
  const [draftBusy, setDraftBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMd, setReportMd] = useState(null); // null = pas encore chargé
  const [reportLoading, setReportLoading] = useState(false);

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

  // Vague 3 (délégation) — génère les brouillons de réponse pour les avis pas
  // encore traités (draft_status='none'). DRY-RUN : rien n'est publié, Vincent
  // copie-colle manuellement (pas d'API d'écriture Google/Airbnb branchée).
  async function generateDrafts() {
    setDraftBusy(true);
    try {
      const d = await fetchJSON("/api/voyageur-feedback?action=draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (d.generated) {
        addToast(`${d.generated} brouillon(s) généré(s)${d.failed ? ` (${d.failed} échec(s))` : ""}`, "success");
        const fresh = await fetchJSON("/api/voyageur-feedback");
        setRows(fresh.reviews || []);
      } else {
        addToast("Aucun nouvel avis à traiter", "info");
      }
    } catch (e) {
      addToast(e.message || "Échec de la génération", "error");
    } finally {
      setDraftBusy(false);
    }
  }

  async function setDraftStatus(id, status) {
    setRows(rs => rs.map(x => x.id === id ? { ...x, draft_status: status } : x)); // optimiste
    try {
      await fetchJSON("/api/voyageur-feedback?action=draft-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch (e) {
      addToast(e.message || "Échec de la mise à jour", "error");
    }
  }

  function copyDraft(text) {
    navigator.clipboard?.writeText(text).then(
      () => addToast("Brouillon copié", "success"),
      () => addToast("Impossible de copier — sélectionne le texte manuellement", "error")
    );
  }

  async function toggleReport() {
    const next = !reportOpen;
    setReportOpen(next);
    if (next && reportMd === null && !reportLoading) {
      setReportLoading(true);
      try {
        const d = await fetchJSON("/api/voyageur-feedback?action=report");
        setReportMd(d.markdown || "Rapport indisponible.");
      } catch (e) {
        setReportMd(null);
        addToast(e.message || "Échec du chargement du rapport", "error");
      } finally {
        setReportLoading(false);
      }
    }
  }

  const pendingDrafts = (rows || []).filter(r => r.draft_status === "pending").length;

  // ── styles ────────────────────────────────────────────────────────────
  const card = { background: "#1e293b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 14, marginBottom: 12 };
  const sel = { padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, cursor: "pointer" };
  const chip = { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.07)", color: "#cbd5e1" };

  if (err && !rows) return <div style={{ maxWidth: 820, margin: "0 auto", color: "#fca5a5" }}>Erreur : {err}</div>;
  if (rows === null) return <div style={{ maxWidth: 820, margin: "0 auto", color: "#94a3b8" }}>Chargement des avis…</div>;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ ...card, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.25)" }}>
        <button
          onClick={toggleReport}
          style={{ ...sel, width: "100%", textAlign: "left", background: "transparent", border: "none", padding: 0, display: "flex", alignItems: "center", gap: 8, color: "#7dd3fc", fontWeight: 600 }}>
          <span>{reportOpen ? "▾" : "▸"}</span>
          📋 Rapport Voix du Voyageur (baseline historique, 116 avis codés)
        </button>
        {reportOpen && (
          <div style={{ marginTop: 12, color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
            {reportLoading && <em style={{ color: "#64748b" }}>Chargement…</em>}
            {!reportLoading && reportMd && (
              <>
                <style>{`
                  .voyageur-report h1{font-size:18px;margin:0 0 8px;color:#f1f5f9}
                  .voyageur-report h2{font-size:15px;margin:20px 0 8px;color:#7dd3fc;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:5px}
                  .voyageur-report h3{font-size:13px;margin:14px 0 6px;color:#e2e8f0}
                  .voyageur-report p{margin:6px 0}
                  .voyageur-report blockquote{color:#94a3b8;border-left:3px solid rgba(255,255,255,0.15);margin:6px 0;padding:2px 10px;font-style:italic}
                  .voyageur-report code{background:#0f172a;padding:1px 5px;border-radius:4px;color:#7dd3fc;font-size:12px}
                  .voyageur-report ul{margin:6px 0;padding-left:18px}
                  .voyageur-report li{margin:2px 0}
                  .voyageur-report table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12px}
                  .voyageur-report th,.voyageur-report td{border:1px solid rgba(255,255,255,0.1);padding:5px 8px;text-align:left}
                  .voyageur-report th{background:#0f172a;color:#7dd3fc}
                `}</style>
                <div
                  className="voyageur-report"
                  dangerouslySetInnerHTML={{ __html: mdToHtml(reportMd) }}
                />
              </>
            )}
          </div>
        )}
      </div>

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
          <button
            onClick={generateDrafts}
            disabled={draftBusy}
            style={{ ...sel, background: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.4)", opacity: draftBusy ? 0.6 : 1 }}
            title="Génère un brouillon de réponse (LLM) pour les avis pas encore traités — dry-run, rien n'est publié">
            {draftBusy ? "…" : "🪄 Générer les brouillons"}
          </button>
        </div>
      </div>

      {pendingDrafts > 0 && (
        <div style={{ ...card, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 13, color: "#c7d2fe" }}>
          📝 {pendingDrafts} brouillon(s) prêt(s) à copier-coller — aucune publication automatique (pas d'API d'écriture Google/Airbnb branchée).
        </div>
      )}

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

          {r.draft_status && r.draft_status !== "none" && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ ...chip, background: r.classification === "auto" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: r.classification === "auto" ? "var(--c-success-light)" : "#fca5a5" }}>
                  {r.classification === "auto" ? "🟢 éligible auto (futur)" : "🔴 à traiter toi-même"}
                </span>
                {r.draft_status === "sent" && <span style={{ ...chip, background: "rgba(16,185,129,0.15)", color: "var(--c-success-light)" }}>✅ envoyée</span>}
                {r.draft_status === "dismissed" && <span style={{ ...chip, color: "#64748b" }}>ignoré</span>}
              </div>
              <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.5, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 10, whiteSpace: "pre-wrap" }}>
                {r.draft_reply}
              </div>
              {r.draft_status === "pending" && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => copyDraft(r.draft_reply)} style={{ ...sel, fontSize: 12, padding: "4px 10px" }}>📋 Copier</button>
                  <button onClick={() => setDraftStatus(r.id, "sent")} style={{ ...sel, fontSize: 12, padding: "4px 10px", color: "#86efac" }}>✅ Envoyée</button>
                  <button onClick={() => setDraftStatus(r.id, "dismissed")} style={{ ...sel, fontSize: 12, padding: "4px 10px", color: "#94a3b8" }}>✕ Ignorer</button>
                </div>
              )}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
