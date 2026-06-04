/**
 * ApprobationsTab — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState, useEffect } from "react";
import { adminFetch } from "../lib/apiFetch.js";
import { useAppData } from "../AppDataContext.jsx";

export default function ApprobationsTab() {
  const { mob } = useAppData();
  const [drafts, setDrafts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("pending");
  const [acting, setActing]     = useState(null);
  const [toast, setToast]       = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editPayload, setEditPayload] = useState(null);
  const [pickerBien, setPickerBien] = useState("amaryllis");

  async function loadDrafts() {
    setLoading(true);
    try {
      const r = await adminFetch(`/api/agent-drafts?status=${filter === "all" ? "" : filter}&limit=100`);
      const d = await r.json();
      setDrafts(d.drafts || []);
    } catch (e) {
      setToast({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDrafts(); }, [filter]);

  async function act(id, action) {
    setActing(id);
    try {
      const r = await adminFetch(`/api/agent-drafts?id=${id}&action=${action}`, { method: "PATCH" });
      const d = await r.json();
      const msgs = {
        approve: "✅ Approuvé",
        reject:  "🚫 Rejeté",
        publish: d.ok ? "🚀 Publié avec succès !" : `❌ Échec : ${d.result?.error || "erreur"}`,
        improve: d.ok ? `🎯 Amélioré ! ${d.previous_score || 0}/100 → ${d.new_score || "?"}/100` : `❌ Échec amélioration: ${d.error || ""}`,
      };
      setToast({ message: msgs[action] || "OK", success: d.ok });
      loadDrafts();
    } catch (e) {
      setToast({ error: e.message });
    } finally {
      setActing(null);
      setTimeout(() => setToast(null), 5000);
    }
  }

  async function saveEdit(id) {
    try {
      await adminFetch(`/api/agent-drafts?id=${id}&action=edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: editPayload }),
      });
      setEditingId(null);
      setEditPayload(null);
      setToast({ message: "💾 Modifications sauvées", success: true });
      loadDrafts();
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setToast({ error: e.message });
    }
  }

  const counts = drafts.reduce((acc, d) => ({ ...acc, [d.status]: (acc[d.status]||0) + 1 }), {});
  const filters = [
    { id: "pending",   label: "🟡 En attente",   color: "#f59e0b" },
    { id: "approved",  label: "✅ Approuvés",    color: "#10b981" },
    { id: "published", label: "🚀 Publiés",      color: "#6366f1" },
    { id: "rejected",  label: "🚫 Rejetés",      color: "#64748b" },
    { id: "failed",    label: "❌ Échecs",       color: "#ef4444" },
    { id: "all",       label: "Tous",            color: "#94a3b8" },
  ];

  const btnStyle = (color, outline = false, disabled = false) => ({
    padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer", border: outline ? `1px solid ${color}44` : "none",
    background: outline ? "transparent" : color,
    color: outline ? color : "#fff",
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: mob ? "8px 0" : "12px 0" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>📥 Approbations</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Brouillons générés par les agents IA — relis, modifie, approuve ou publie.
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
            background: filter === f.id ? `${f.color}22` : "transparent",
            color: filter === f.id ? f.color : "#64748b",
            outline: filter === f.id ? `1px solid ${f.color}44` : "none",
          }}>
            {f.label}{filter !== f.id && counts[f.id] > 0 ? ` (${counts[f.id]})` : ""}
          </button>
        ))}
      </div>

      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, padding: "10px 16px", borderRadius: 10, zIndex: 1000,
          background: toast.error ? "rgba(239,68,68,0.95)" : toast.success ? "rgba(16,185,129,0.95)" : "rgba(99,102,241,0.95)",
          color: "#fff", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>{toast.message || toast.error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Chargement…</div>
      ) : drafts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun brouillon</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Lance "Run agents" depuis l'onglet Agents pour générer du contenu</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {drafts.map(d => {
            let payload = {};
            try { payload = JSON.parse(d.payload); } catch {}
            const isEditing = editingId === d.id;
            const editing = isEditing ? (editPayload || payload) : payload;

            return (
              <div key={d.id} style={{
                background: "#1e293b",
                border: `1px solid ${d.status === "pending" ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 18 }}>{d.agent_emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{d.agent_label}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>
                      {d.type === "social_post" ? "📣 Post réseaux sociaux" : d.type === "email_campaign" ? "📧 Email" : d.type}
                      {" · "}{new Date(d.created_at * 1000).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                    background: d.status === "pending" ? "rgba(245,158,11,0.15)" : d.status === "approved" ? "rgba(16,185,129,0.15)" : d.status === "published" ? "rgba(99,102,241,0.15)" : "rgba(100,116,139,0.15)",
                    color: d.status === "pending" ? "#f59e0b" : d.status === "approved" ? "#10b981" : d.status === "published" ? "#6366f1" : d.status === "failed" ? "#ef4444" : "#94a3b8",
                  }}>{d.status}</span>
                </div>

                {d.rationale && (
                  <div style={{ padding: "8px 14px", fontSize: 11, color: "#94a3b8", fontStyle: "italic", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    💭 {d.rationale}
                  </div>
                )}

                {/* Reviews des agents validateurs */}
                {d.reviews && (() => {
                  let r = null; try { r = JSON.parse(d.reviews); } catch {}
                  if (!r) return null;
                  const scoreColor = r.score >= 80 ? "#10b981" : r.score >= 60 ? "#f59e0b" : "#ef4444";
                  const verdictBadge = {
                    approve:     { label: "✅ Approuvé par les agents", color: "#10b981" },
                    needs_edits: { label: "⚠️ Améliorations suggérées",  color: "#f59e0b" },
                    reject:      { label: "🚫 Rejeté par les agents",   color: "#ef4444" },
                  }[r.verdict] || { label: r.verdict, color: "#94a3b8" };
                  return (
                    <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: verdictBadge.color, padding: "2px 8px", borderRadius: 10, background: `${verdictBadge.color}15` }}>
                          {verdictBadge.label}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor }}>
                          Score : {r.score}/100
                        </span>
                        {r.score_after_improve && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981" }}>
                            🎯 Amélioré : {r.previous_score || r.score}/100 → {r.score_after_improve}/100
                          </span>
                        )}
                      </div>
                      {r.traffic_manager && (
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>
                          <span style={{ color: "#e2e8f0" }}>📈 Traffic Manager</span> ({r.traffic_manager.note}/10) — {r.traffic_manager.feedback}
                        </div>
                      )}
                      {r.seo_writer && (
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>
                          <span style={{ color: "#e2e8f0" }}>✍️ SEO Writer</span> ({r.seo_writer.note}/10) — {r.seo_writer.feedback}
                        </div>
                      )}
                      {r.improvement_notes && (
                        <div style={{ fontSize: 10, color: "#fbbf24", marginTop: 5, fontStyle: "italic" }}>
                          🎯 Améliorations : {r.improvement_notes}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {d.type === "social_post" && (
                  <div style={{ padding: "14px", display: "grid", gridTemplateColumns: payload.imageUrl && !mob ? "1fr 200px" : "1fr", gap: 14 }}>
                    <div>
                      {isEditing ? (
                        <textarea
                          value={editing.caption || ""}
                          onChange={e => setEditPayload({ ...editing, caption: e.target.value })}
                          rows={6}
                          style={{ width: "100%", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 12, padding: 10, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }}
                        />
                      ) : (
                        <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{payload.caption}</div>
                      )}
                      {isEditing && (
                        <input
                          value={editing.imageUrl || ""}
                          onChange={e => setEditPayload({ ...editing, imageUrl: e.target.value })}
                          placeholder="URL image"
                          style={{ width: "100%", marginTop: 8, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 11, padding: "8px 10px", fontFamily: "inherit", boxSizing: "border-box" }}
                        />
                      )}
                      {isEditing && (
                        <div style={{ marginTop: 10, padding: 10, background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>📷 Changer la photo</span>
                            <select
                              value={pickerBien}
                              onChange={e => setPickerBien(e.target.value)}
                              style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#e2e8f0", fontSize: 11, padding: "4px 8px", fontFamily: "inherit", cursor: "pointer" }}
                            >
                              {["amaryllis","zandoli","iguana","geko","mabouya","schoelcher","nogent"].map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(nn => {
                              const fullUrl = `https://villamaryllis.com/photos/${pickerBien}/${nn}.webp`;
                              const selected = editing.imageUrl === fullUrl;
                              return (
                                <img
                                  key={nn}
                                  src={`/photos/${pickerBien}/${nn}-480w.webp`}
                                  alt=""
                                  onClick={() => setEditPayload({ ...editing, imageUrl: fullUrl })}
                                  onError={e => { e.target.style.display = "none"; }}
                                  style={{
                                    width: 68, height: 68, flexShrink: 0, objectFit: "cover", borderRadius: 8, cursor: "pointer",
                                    border: selected ? "2px solid #6366f1" : "2px solid transparent",
                                    boxShadow: selected ? "0 0 0 2px rgba(99,102,241,0.35)" : "none",
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 6, marginTop: 8, fontSize: 10, color: "#64748b" }}>
                        {(payload.channels || ["ig","fb"]).map(c => (
                          <span key={c} style={{ padding: "2px 8px", borderRadius: 10, background: "rgba(255,255,255,0.05)" }}>
                            {c === "ig" ? "📸 Instagram" : "📘 Facebook"}
                          </span>
                        ))}
                      </div>
                    </div>
                    {payload.imageUrl && !mob && (
                      <img src={payload.imageUrl} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }} onError={e => { e.target.style.opacity = 0.3; }} />
                    )}
                  </div>
                )}

                {d.type === "email_campaign" && (
                  <div style={{ padding: "14px" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>À: <span style={{ color: "#94a3b8" }}>{payload.to}</span></div>
                    <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, marginBottom: 8 }}>{payload.subject}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", maxHeight: 200, overflow: "auto", padding: 10, background: "#0f172a", borderRadius: 8 }}
                         dangerouslySetInnerHTML={{ __html: payload.html || "" }} />
                  </div>
                )}

                {d.result && (
                  <div style={{ padding: "8px 14px", fontSize: 10, color: d.status === "published" ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {d.status === "published" ? "✅ " : "❌ "}{d.result.slice(0, 200)}
                  </div>
                )}

                {/* Affichage erreurs fact-check si présentes */}
                {(() => {
                  try {
                    const r = JSON.parse(d.reviews || "{}");
                    if (r.fact_check && !r.fact_check.passed) {
                      return (
                        <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderTop: "1px solid rgba(239,68,68,0.2)" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>🚫 Fact-check échec — phrases interdites détectées :</div>
                          {r.fact_check.errors.map((err, i) => (
                            <div key={i} style={{ fontSize: 10, color: "#fca5a5", marginBottom: 3 }}>
                              <strong>"{err.phrase}"</strong> — {err.reason}
                            </div>
                          ))}
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}

                {(d.status === "pending" || d.status === "approved") && (
                  <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "rgba(0,0,0,0.15)", flexWrap: "wrap" }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(d.id)} style={btnStyle("#10b981")}>💾 Sauver</button>
                        <button onClick={() => { setEditingId(null); setEditPayload(null); }} style={btnStyle("#64748b", true)}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <button disabled={acting === d.id} onClick={() => act(d.id, "publish")} style={btnStyle("#6366f1", false, acting === d.id)}>
                          {acting === d.id ? "..." : "🚀 Publier maintenant"}
                        </button>
                        {d.status === "pending" && <button onClick={() => act(d.id, "approve")} style={btnStyle("#10b981", true)}>✅ Approuver</button>}
                        <button disabled={acting === d.id} onClick={() => act(d.id, "improve")} style={btnStyle("#f59e0b", true, acting === d.id)} title="Régénérer en intégrant les retours des agents pour viser 100/100">
                          {acting === d.id ? "..." : "🎯 Améliorer (viser 100/100)"}
                        </button>
                        <button onClick={() => { setEditingId(d.id); setEditPayload(payload); setPickerBien(payload.imageUrl?.match(/photos\/([a-z]+)/)?.[1] || "amaryllis"); }} style={btnStyle("#64748b", true)}>✏️ Modifier</button>
                        <button onClick={() => act(d.id, "reject")} style={btnStyle("#ef4444", true)}>🚫 Rejeter</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
