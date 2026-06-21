import { useEffect, useState, useCallback } from "react";

const tok = () => sessionStorage.getItem("ldb_tok") || "";
const apiFetch = (url, opts = {}) =>
  fetch(url, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers || {}) } });

const STATUS_LABEL = { pending: "À valider", approved: "Approuvé", published: "Publié", failed: "Échec", drafted: "Brouillon", rejected: "Rejeté" };
const STATUS_COLOR = { pending: "#f59e0b", approved: "#10b981", published: "#6366f1", failed: "#ef4444", drafted: "#64748b", rejected: "#ef4444" };

function ScoreBadge({ score }) {
  if (score == null) return null;
  const color = score >= 75 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <span style={{ background: color, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "2px 8px", letterSpacing: "0.02em" }}>
      {score}/100
    </span>
  );
}

function ReelCard({ draft, onAction, onVideoUrlSet }) {
  const [captionOpen, setCaptionOpen] = useState(false);
  const [videoInput, setVideoInput] = useState("");
  const [videoInputOpen, setVideoInputOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [acting, setActing] = useState(false);

  let payload = {};
  try { payload = JSON.parse(draft.payload || "{}"); } catch {}
  const reviews = payload.reviews || {};
  const plan    = payload.plan    || {};
  const caption = payload.caption || "";
  const videoUrl = payload.videoUrl;

  const BIEN_NAMES = {
    amaryllis: "Villa Amaryllis", iguana: "Villa Iguana",
    zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya",
    schoelcher: "Schœlcher", nogent: "Nogent",
  };
  const bienName = BIEN_NAMES[payload.bienId] || payload.bienId || "—";

  const scheduledDate = payload.scheduledAt
    ? new Date(payload.scheduledAt * 1000).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
    : null;

  function downloadPlan() {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reel-plan-${payload.bienId || "bien"}-${draft.id}.json`;
    a.click();
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(caption);
    setCopying(true);
    setTimeout(() => setCopying(false), 1500);
  }

  async function doAction(action) {
    setActing(true);
    await onAction(draft.id, action);
    setActing(false);
  }

  async function saveVideoUrl() {
    if (!videoInput.trim()) return;
    await onVideoUrlSet(draft.id, videoInput.trim(), payload);
    setVideoInputOpen(false);
    setVideoInput("");
  }

  return (
    <div style={{ background: "var(--c-surface, #1e293b)", border: "1px solid var(--c-border, #334155)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18 }}>🎬</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--c-text, #f1f5f9)" }}>{bienName}</span>
        {scheduledDate && <span style={{ fontSize: 12, color: "var(--c-muted, #94a3b8)" }}>{scheduledDate}</span>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <ScoreBadge score={reviews.score} />
          <span style={{ background: STATUS_COLOR[draft.status] || "#64748b", color: "#fff", fontSize: 11, fontWeight: 600, borderRadius: 99, padding: "2px 8px" }}>
            {STATUS_LABEL[draft.status] || draft.status}
          </span>
        </div>
      </div>

      {/* Plan summary */}
      {plan.clips && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 12, color: "var(--c-muted, #94a3b8)" }}>
          <span>📸 {plan.clips.length} clips</span>
          <span>·</span>
          <span>{plan.clips.map(c => c.kenburns).join(" → ")}</span>
          <span>·</span>
          <span>{plan.fps || 30}fps · {plan.width}×{plan.height}</span>
        </div>
      )}

      {/* Reason (si score < seuil) */}
      {reviews.reason && reviews.verdict === "reject" && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#fca5a5" }}>
          ⚠️ {reviews.reason}
        </div>
      )}

      {/* Caption */}
      <div>
        <button
          onClick={() => setCaptionOpen(o => !o)}
          style={{ background: "none", border: "none", color: "var(--c-muted, #94a3b8)", cursor: "pointer", fontSize: 12, padding: 0, display: "flex", alignItems: "center", gap: 4 }}
        >
          {captionOpen ? "▾" : "▸"} Caption ({caption.length} caractères)
        </button>
        {captionOpen && (
          <pre style={{ marginTop: 8, padding: 12, background: "var(--c-bg, #0f172a)", borderRadius: 8, fontSize: 12, whiteSpace: "pre-wrap", color: "var(--c-text, #f1f5f9)", lineHeight: 1.6, maxHeight: 260, overflowY: "auto" }}>
            {caption}
          </pre>
        )}
      </div>

      {/* Vidéo player (si videoUrl rempli) */}
      {videoUrl && (
        <video
          src={videoUrl}
          controls
          style={{ width: "100%", maxWidth: 180, height: 320, objectFit: "cover", borderRadius: 8, background: "#000", alignSelf: "center" }}
        />
      )}

      {/* Champ videoUrl */}
      {videoInputOpen ? (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={videoInput}
            onChange={e => setVideoInput(e.target.value)}
            placeholder="https://... (URL publique du MP4)"
            style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--c-border, #334155)", background: "var(--c-bg, #0f172a)", color: "var(--c-text, #f1f5f9)", fontSize: 13 }}
          />
          <button onClick={saveVideoUrl} style={{ padding: "6px 12px", borderRadius: 6, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}>Sauver</button>
          <button onClick={() => setVideoInputOpen(false)} style={{ padding: "6px 10px", borderRadius: 6, background: "transparent", color: "var(--c-muted, #94a3b8)", border: "1px solid var(--c-border, #334155)", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
      ) : null}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* Approve / Reject — si en attente ou brouillon */}
        {(draft.status === "pending" || draft.status === "drafted") && (
          <>
            <button
              onClick={() => doAction("approve")}
              disabled={acting}
              style={{ padding: "6px 14px", borderRadius: 8, background: "#10b981", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              ✅ Approuver
            </button>
            <button
              onClick={() => doAction("reject")}
              disabled={acting}
              style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", color: "#ef4444", border: "1px solid #ef4444", cursor: "pointer", fontSize: 13 }}
            >
              ❌ Rejeter
            </button>
          </>
        )}

        {/* Publier sur Instagram — si approuvé */}
        {draft.status === "approved" && (
          <button
            onClick={() => doAction("execute")}
            disabled={acting}
            style={{ padding: "6px 14px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: acting ? "wait" : "pointer", fontSize: 13, fontWeight: 600 }}
          >
            {acting ? "Publication…" : "🚀 Publier sur Instagram"}
          </button>
        )}

        {/* Plan JSON */}
        {plan.clips && (
          <button
            onClick={downloadPlan}
            style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", color: "var(--c-muted, #94a3b8)", border: "1px solid var(--c-border, #334155)", cursor: "pointer", fontSize: 13 }}
            title="node render.mjs --plan <fichier> --out reel.mp4"
          >
            📥 Plan JSON
          </button>
        )}

        {/* Copy caption */}
        <button
          onClick={copyCaption}
          style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", color: "var(--c-muted, #94a3b8)", border: "1px solid var(--c-border, #334155)", cursor: "pointer", fontSize: 13 }}
        >
          {copying ? "✓ Copié" : "📋 Caption"}
        </button>

        {/* Remplir videoUrl */}
        {draft.status !== "published" && (
          <button
            onClick={() => setVideoInputOpen(o => !o)}
            style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", color: videoUrl ? "#10b981" : "var(--c-muted, #94a3b8)", border: `1px solid ${videoUrl ? "#10b981" : "var(--c-border, #334155)"}`, cursor: "pointer", fontSize: 13 }}
          >
            {videoUrl ? "🎥 Changer vidéo" : "🎥 Ajouter vidéo"}
          </button>
        )}
      </div>

      {/* Hint render */}
      {!videoUrl && draft.status === "approved" && (
        <div style={{ fontSize: 11, color: "var(--c-muted, #94a3b8)", fontStyle: "italic" }}>
          ↳ Render : <code>node containers/reel-render/render.mjs --plan &lt;plan.json&gt; --out reel.mp4</code>
          <br />puis upload le MP4, colle l'URL publique ci-dessus.
        </div>
      )}
    </div>
  );
}

const BIENS = ["amaryllis","iguana","zandoli","geko","mabouya","schoelcher","nogent"];
const BIEN_LABELS = { amaryllis:"Villa Amaryllis", iguana:"Villa Iguana", zandoli:"Zandoli", geko:"Géko", mabouya:"Mabouya", schoelcher:"Schœlcher", nogent:"Nogent" };

function NewReelForm({ onCreated }) {
  const [open, setOpen]       = useState(false);
  const [bienId, setBienId]   = useState("amaryllis");
  const [theme, setTheme]     = useState("luxe et sérénité");
  const [variante, setVariante] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult]   = useState(null);

  async function create() {
    setCreating(true);
    setResult(null);
    try {
      const r = await apiFetch("/api/reel-gen", {
        method: "POST",
        body: JSON.stringify({ bienId, theme, variante }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setResult(d);
      setTimeout(() => { setOpen(false); setResult(null); onCreated(); }, 2000);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setCreating(false);
    }
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{ padding: "8px 18px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
    >
      + Nouveau Reel
    </button>
  );

  return (
    <div style={{ background: "var(--c-surface, #1e293b)", border: "1px solid #6366f1", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--c-text, #f1f5f9)" }}>🎬 Créer un Reel</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "0 0 auto" }}>
          <label style={{ fontSize: 12, color: "var(--c-muted, #94a3b8)" }}>Bien</label>
          <select value={bienId} onChange={e => setBienId(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--c-border, #334155)", background: "var(--c-bg, #0f172a)", color: "var(--c-text, #f1f5f9)", fontSize: 13 }}>
            {BIENS.map(b => <option key={b} value={b}>{BIEN_LABELS[b]}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 12, color: "var(--c-muted, #94a3b8)" }}>Thème</label>
          <input value={theme} onChange={e => setTheme(e.target.value)}
            placeholder="luxe et sérénité, piscine, coucher de soleil…"
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--c-border, #334155)", background: "var(--c-bg, #0f172a)", color: "var(--c-text, #f1f5f9)", fontSize: 13 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 120 }}>
          <label style={{ fontSize: 12, color: "var(--c-muted, #94a3b8)" }}>Angle (optionnel)</label>
          <input value={variante} onChange={e => setVariante(e.target.value)}
            placeholder="famille, couple, télétravail…"
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--c-border, #334155)", background: "var(--c-bg, #0f172a)", color: "var(--c-text, #f1f5f9)", fontSize: 13 }} />
        </div>
      </div>

      {result && !result.error && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid #10b981", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#6ee7b7" }}>
          ✅ Draft créé (score {result.score}/100 · {result.verdict === "approve" ? "auto-approuvé" : "à valider"})
        </div>
      )}
      {result?.error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#fca5a5" }}>
          ✗ {result.error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={create} disabled={creating || !theme.trim()}
          style={{ padding: "8px 18px", borderRadius: 8, background: creating ? "#4f46e5" : "#6366f1", color: "#fff", border: "none", cursor: creating ? "wait" : "pointer", fontSize: 13, fontWeight: 600 }}>
          {creating ? "Génération…" : "Générer"}
        </button>
        <button onClick={() => setOpen(false)}
          style={{ padding: "8px 14px", borderRadius: 8, background: "transparent", color: "var(--c-muted, #94a3b8)", border: "1px solid var(--c-border, #334155)", cursor: "pointer", fontSize: 13 }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function ReelsTab() {
  const [drafts, setDrafts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch("/api/agent-drafts?type=reel_post&limit=50");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setDrafts((d.drafts || []).sort((a, b) => b.created_at - a.created_at));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAction(id, action) {
    await apiFetch(`/api/agent-drafts?id=${id}&action=${action}`, { method: "PATCH" });
    load();
  }

  async function handleVideoUrlSet(id, videoUrl, currentPayload) {
    await apiFetch(`/api/agent-drafts?id=${id}&action=edit`, {
      method: "PATCH",
      body: JSON.stringify({ payload: { ...currentPayload, videoUrl } }),
    });
    load();
  }

  const filtered = filter === "all" ? drafts : drafts.filter(d => d.status === filter);
  const counts   = drafts.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {});

  const FILTERS = [
    { id: "all",       label: "Tous", count: drafts.length },
    { id: "pending",   label: "À valider", count: counts.pending || 0 },
    { id: "drafted",   label: "Brouillons", count: counts.drafted || 0 },
    { id: "approved",  label: "Approuvés", count: counts.approved || 0 },
    { id: "published", label: "Publiés", count: counts.published || 0 },
  ].filter(f => f.id === "all" || f.count > 0);

  return (
    <div style={{ padding: "24px 20px", maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--c-text, #f1f5f9)" }}>🎬 Reels Instagram</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--c-muted, #94a3b8)" }}>
            Drafts générés par l'agent éditorial — valider, render, publier.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <NewReelForm onCreated={load} />
          <button
            onClick={load}
            style={{ padding: "8px 14px", borderRadius: 8, background: "transparent", border: "1px solid var(--c-border, #334155)", color: "var(--c-muted, #94a3b8)", cursor: "pointer", fontSize: 13 }}
          >
            ↻
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "6px 14px", borderRadius: 99, fontSize: 13, cursor: "pointer",
              background: filter === f.id ? "var(--c-navy, #1e40af)" : "transparent",
              color: filter === f.id ? "#fff" : "var(--c-muted, #94a3b8)",
              border: `1px solid ${filter === f.id ? "var(--c-navy, #1e40af)" : "var(--c-border, #334155)"}`,
              fontWeight: filter === f.id ? 600 : 400,
            }}
          >
            {f.label} {f.count > 0 && <span style={{ opacity: 0.7, fontSize: 11 }}>({f.count})</span>}
          </button>
        ))}
      </div>

      {/* Workflow hint */}
      {drafts.length === 0 && !loading && !error && (
        <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--c-muted, #94a3b8)", border: "1px dashed var(--c-border, #334155)", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Aucun draft Reel</div>
          <div style={{ fontSize: 13 }}>
            Les Reels sont générés automatiquement à J-2 depuis le planning éditorial<br />
            (entrées <code>format=reel</code>, cron 12h UTC).
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 16, color: "#fca5a5", fontSize: 13 }}>
          Erreur : {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--c-muted, #94a3b8)" }}>Chargement…</div>
      )}

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map(d => (
          <ReelCard
            key={d.id}
            draft={d}
            onAction={handleAction}
            onVideoUrlSet={handleVideoUrlSet}
          />
        ))}
      </div>

      {/* Workflow guide */}
      {drafts.length > 0 && (
        <details style={{ marginTop: 32, color: "var(--c-muted, #94a3b8)", fontSize: 12 }}>
          <summary style={{ cursor: "pointer", userSelect: "none" }}>📖 Workflow render → publication</summary>
          <ol style={{ marginTop: 12, lineHeight: 2, paddingLeft: 20 }}>
            <li>Le cron J-2 génère un draft + score le caption</li>
            <li>Si score ≥ 75 → auto-approuvé (sinon : valider manuellement ici)</li>
            <li>Télécharger le plan JSON → <code>node containers/reel-render/render.mjs --plan plan.json --out reel.mp4</code></li>
            <li>Uploader le MP4 sur R2 (ou tout hébergement public)</li>
            <li>Coller l'URL dans "Ajouter vidéo"</li>
            <li>Le cron horaire publie automatiquement à l'heure programmée</li>
          </ol>
        </details>
      )}
    </div>
  );
}
