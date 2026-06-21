/**
 * EditorialCalendarTab — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState, useEffect } from "react";
import { adminFetch } from "../lib/apiFetch.js";
import { MOIS } from "../App.jsx";
import { useAppData } from "../AppDataContext.jsx";

export default function EditorialCalendarTab() {
  const { mob } = useAppData();
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [seeding, setSeeding]     = useState(false);
  const [generating, setGenerating] = useState(null);
  const [toast, setToast]         = useState(null);
  const [filterBien, setFilterBien] = useState("");
  const [view, setView]           = useState("grid"); // "list" | "grid"
  const [monthOffset, setMonthOffset] = useState(0); // navigation mois (0 = mois courant)

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/editorial-calendar?from=2026-01-01&to=2027-12-31");
      const d = await r.json();
      setEntries(d.entries || []);
    } catch (e) { setToast({ error: e.message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function seed30() {
    if (!confirm("Générer 30 jours de planning à partir d'aujourd'hui ? (les anciens 'planned' seront conservés)")) return;
    setSeeding(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const r = await fetch("/api/editorial-calendar?action=seed_30days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: today }),
      });
      const d = await r.json();
      setToast({ message: `${d.inserted} jours planifiés ✅`, success: true });
      load();
    } catch (e) { setToast({ error: e.message }); }
    finally { setSeeding(false); setTimeout(() => setToast(null), 3500); }
  }

  async function purgeAll() {
    if (!confirm("Supprimer TOUTES les entrées 'planned' ? (les publiées sont conservées)")) return;
    try {
      await fetch("/api/editorial-calendar?all=true", { method: "DELETE" });
      setToast({ message: "Planning vidé", success: true });
      load();
    } catch (e) { setToast({ error: e.message }); }
    setTimeout(() => setToast(null), 2500);
  }

  async function genDraftNow(entry) {
    setGenerating(entry.id);
    try {
      // Brief enrichi pour community-manager
      const brief = `BRIEF CALENDAR (date=${new Date(entry.scheduled_at*1000).toLocaleDateString("fr-FR")}, bien=${entry.bien_id}, thème=${entry.theme}, variante=${entry.variante}, format=${entry.format}, photo=${entry.photo_url}, cta=${entry.cta}). Génère UN draft social_post selon ce brief précis.`;
      // ⚠️ calendar_id passé au serveur → il liera draft_id + status automatiquement
      const r = await adminFetch("/api/agents-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agents: ["community-manager"], brief, calendar_id: entry.id }),
      });
      const d = await r.json();
      const drafts = d.results?.[0]?.drafts || 0;
      // Pas de PATCH manuel : agents-run.js gère le statut + draft_id côté serveur
      setToast({ message: drafts > 0 ? `Draft généré ✅ (voir Approbations)` : "Échec génération", success: drafts > 0 });
      load();
    } catch (e) { setToast({ error: e.message }); }
    finally { setGenerating(null); setTimeout(() => setToast(null), 3500); }
  }

  const BIENS = [
    { id: "amaryllis",  label: "Villa Amaryllis", color: "#e91e8c" },
    { id: "zandoli",    label: "Zandoli",         color: "#10b981" },
    { id: "iguana",     label: "Villa Iguana",    color: "#f59e0b" },
    { id: "geko",       label: "Géko",            color: "#22c55e" },
    { id: "mabouya",    label: "Mabouya",  color: "#ec4899" },
    { id: "schoelcher", label: "Bellevue",        color: "#3b82f6" },
    { id: "nogent",     label: "Nogent",          color: "#8b5cf6" },
  ];

  const THEMES = {
    inspiration: { color: "#6366f1", emoji: "✨" },
    preuve:      { color: "#10b981", emoji: "⭐" },
    detail:      { color: "#f59e0b", emoji: "💎" },
    reve:        { color: "#ec4899", emoji: "💭" },
    conversion:  { color: "#ef4444", emoji: "🚀" },
    lifestyle:   { color: "#06b6d4", emoji: "🌴" },
    info:        { color: "#94a3b8", emoji: "📋" },
  };

  const STATUS_COLORS = {
    planned:    { c: "#94a3b8", label: "📋 Planifié" },
    generating: { c: "#f59e0b", label: "⏳ En cours" },
    drafted:    { c: "#6366f1", label: "✏️ Draft prêt" },
    approved:   { c: "#10b981", label: "✅ Approuvé" },
    published:  { c: "#22c55e", label: "🚀 Publié" },
    failed:     { c: "#ef4444", label: "❌ Échec" },
    skipped:    { c: "#64748b", label: "🚫 Skippé" },
  };

  const filtered = filterBien
    ? entries.filter(e => e.bien_id === filterBien)
    : entries;

  // Stats de répartition
  const bienCounts = entries.reduce((acc, e) => ({ ...acc, [e.bien_id]: (acc[e.bien_id]||0) + 1 }), {});
  const statusCounts = entries.reduce((acc, e) => ({ ...acc, [e.status]: (acc[e.status]||0) + 1 }), {});

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: mob ? "8px 0" : "12px 0" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>📅 Planning éditorial</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Programme de publications FB + IG sur 30 jours · rotation des 7 biens · variantes thématiques anti-lassitude
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={seed30} disabled={seeding} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
            opacity: seeding ? 0.5 : 1,
          }}>{seeding ? "..." : "🌱 Seed 30 jours"}</button>
          <button onClick={purgeAll} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
            border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444",
          }}>🗑 Vider</button>
        </div>
      </div>

      {/* Stats répartition biens */}
      {entries.length > 0 && (
        <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Rotation des biens ({entries.length} posts)
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {BIENS.map(b => (
              <button
                key={b.id}
                onClick={() => setFilterBien(filterBien === b.id ? "" : b.id)}
                style={{
                  padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
                  background: filterBien === b.id ? b.color : `${b.color}22`,
                  color: filterBien === b.id ? "#fff" : b.color,
                }}
              >
                {b.label} · {bienCounts[b.id] || 0}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, padding: "10px 16px", borderRadius: 10, zIndex: 1000,
          background: toast.error ? "rgba(239,68,68,0.95)" : toast.success ? "rgba(16,185,129,0.95)" : "rgba(99,102,241,0.95)",
          color: "#fff", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>{toast.message || toast.error}</div>
      )}

      {/* Toggle vue Liste / Grille */}
      {entries.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[{ id: "grid", l: "🗓 Grille mois" }, { id: "list", l: "📋 Liste" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
              background: view === v.id ? "rgba(99,102,241,0.2)" : "transparent",
              color: view === v.id ? "#818cf8" : "#64748b",
              outline: view === v.id ? "1px solid rgba(99,102,241,0.3)" : "none",
            }}>{v.l}</button>
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun planning</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Clique "🌱 Seed 30 jours" pour générer le calendrier canonique</div>
        </div>
      ) : view === "grid" ? (
        /* ── VUE GRILLE MOIS ── */
        (() => {
          // Mois affiché = mois courant + offset de navigation (flèches ← →)
          const nowD = new Date();
          const refDate = new Date(Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() + monthOffset, 1));
          const monthStart = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), 1));
          const monthEnd   = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth() + 1, 0));
          const offset     = (monthStart.getUTCDay() + 6) % 7; // lundi=0
          const daysInMonth = monthEnd.getUTCDate();

          // Map "YYYY-MM-DD" → entry
          const entryByDate = {};
          for (const e of filtered) {
            const dt = new Date(e.scheduled_at * 1000);
            const key = dt.toISOString().slice(0, 10);
            entryByDate[key] = e;
          }

          const cells = [];
          for (let i = 0; i < offset; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), d));
            const key = dt.toISOString().slice(0, 10);
            cells.push({ day: d, date: key, entry: entryByDate[key] });
          }

          // timeZone UTC : refDate est construit en UTC (comme la grille) — sans ça,
          // en Martinique (UTC-4) le 1er du mois UTC bascule au mois précédent en local.
          const monthLabel = refDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
          const dows = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <button onClick={() => setMonthOffset(o => o - 1)} title="Mois précédent"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>←</button>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", textTransform: "capitalize", minWidth: 150, textAlign: "center" }}>{monthLabel}</div>
                <button onClick={() => setMonthOffset(o => o + 1)} title="Mois suivant"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>→</button>
                {monthOffset !== 0 && (
                  <button onClick={() => setMonthOffset(0)} style={{ background: "transparent", border: "none", color: "#818cf8", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>aujourd'hui</button>
                )}
              </div>
              {/* Header DOW */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
                {dows.map(d => (
                  <div key={d} style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textAlign: "center", textTransform: "uppercase", padding: "4px 0" }}>{d}</div>
                ))}
              </div>
              {/* Cells */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {cells.map((c, i) => {
                  if (!c) return <div key={i} style={{ minHeight: mob ? 60 : 90, background: "transparent" }} />;
                  const e = c.entry;
                  const bien = e ? (BIENS.find(b => b.id === e.bien_id) || { color: "#94a3b8", label: e.bien_id }) : null;
                  const theme = e ? (THEMES[e.theme] || { color: "#94a3b8", emoji: "•" }) : null;
                  const status = e ? (STATUS_COLORS[e.status] || { c: "#94a3b8" }) : null;
                  const isGen = e && generating === e.id;
                  return (
                    <div key={i} style={{
                      minHeight: mob ? 80 : 110, padding: "6px 8px",
                      background: e ? `${bien.color}11` : "rgba(255,255,255,0.02)",
                      border: e ? `1px solid ${bien.color}44` : "1px solid rgba(255,255,255,0.04)",
                      borderRadius: 8, fontSize: 10, position: "relative",
                      display: "flex", flexDirection: "column",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, color: e ? bien.color : "#475569" }}>{c.day}</span>
                        {e && <span style={{ width: 7, height: 7, borderRadius: "50%", background: status.c }} title={status.label} />}
                      </div>
                      {e && (
                        <>
                          <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2, lineHeight: 1.2 }}>
                            {theme.emoji} {bien.label.replace("Villa ","").slice(0, 10)}
                          </div>
                          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>{e.format}</div>
                          {/* Bouton Générer / Régénérer pour planned + failed */}
                          {(e.status === "planned" || e.status === "failed") && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); genDraftNow(e); }}
                              disabled={isGen}
                              style={{
                                marginTop: "auto", padding: "3px 6px", borderRadius: 5, fontSize: 9, fontWeight: 700,
                                border: `1px solid ${bien.color}66`, background: `${bien.color}22`, color: bien.color,
                                cursor: isGen ? "wait" : "pointer", opacity: isGen ? 0.6 : 1,
                                width: "100%",
                              }}
                            >{isGen ? "..." : (e.status === "failed" ? "🔄 Régénérer" : "✏️ Générer")}</button>
                          )}
                          {/* Lien rapide vers Approbations pour les drafts prêts */}
                          {e.status === "drafted" && (
                            <a href="#"
                              onClick={(ev) => { ev.preventDefault(); localStorage.setItem("admin_tab","approbations"); window.location.reload(); }}
                              style={{
                                marginTop: "auto", padding: "3px 6px", borderRadius: 5, fontSize: 9, fontWeight: 700,
                                border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.15)", color: "#818cf8",
                                textAlign: "center", textDecoration: "none", display: "block",
                              }}
                            >📥 Voir draft</a>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: "#64748b", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>💡 Bouton <strong style={{ color: "#e2e8f0" }}>✏️ Générer</strong> visible sur chaque jour planifié → crée le draft via community-manager.</span>
                <span>📥 Bouton <strong style={{ color: "#818cf8" }}>Voir draft</strong> sur jour "drafted" → ouvre Approbations.</span>
              </div>
            </div>
          );
        })()
      ) : (
        /* ── VUE LISTE ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(e => {
            const bien = BIENS.find(b => b.id === e.bien_id) || { color: "#94a3b8", label: e.bien_id };
            const theme = THEMES[e.theme] || { color: "#94a3b8", emoji: "•" };
            const status = STATUS_COLORS[e.status] || { c: "#94a3b8", label: e.status };
            const dt = new Date(e.scheduled_at * 1000);
            const dateStr = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
            return (
              <div key={e.id} style={{
                background: "#1e293b", border: `1px solid ${bien.color}33`, borderRadius: 10, padding: "10px 14px",
                display: "grid", gridTemplateColumns: mob ? "1fr" : "70px 1fr 120px", gap: 12, alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>{dateStr}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{e.publish_hour}</div>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${bien.color}22`, color: bien.color }}>
                      {bien.label}
                    </span>
                    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${theme.color}15`, color: theme.color }}>
                      {theme.emoji} {e.theme}
                    </span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>{e.format}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.variante} · {e.cta}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: status.c }}>{status.label}</span>
                  {(e.status === "planned" || e.status === "failed") && (
                    <button
                      onClick={() => genDraftNow(e)}
                      disabled={generating === e.id}
                      style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer",
                        border: "1px solid #6366f1", background: "transparent", color: "#6366f1",
                        opacity: generating === e.id ? 0.5 : 1,
                      }}
                    >
                      {generating === e.id ? "..." : (e.status === "failed" ? "🔄 Régénérer" : "✏️ Générer")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
