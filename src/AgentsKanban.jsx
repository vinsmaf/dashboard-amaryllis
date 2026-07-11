// AgentsKanban.jsx — Tableau Kanban des actions des agents Amaryllis
// Onglet "Agents" dans l'admin dashboard

import { useState, useEffect, useCallback, useRef } from "react";
import { adminFetch } from "./lib/apiFetch.js";

// ── Constantes ───────────────────────────────────────────────────────────────
const COLUMNS = [
  { id: "backlog",      label: "Backlog",       color: "#64748b", bg: "rgba(100,116,139,0.10)", count_color: "#94a3b8" },
  { id: "a-planifier",  label: "À planifier",   color: "#8b5cf6", bg: "rgba(139,92,246,0.10)",  count_color: "#a78bfa" },
  { id: "en-cours",     label: "En cours",      color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  count_color: "#f59e0b" },
  { id: "fait",         label: "Fait ✓",        color: "#10b981", bg: "rgba(16,185,129,0.10)",  count_color: "#10b981" },
  { id: "bloqué",       label: "Annulé",        color: "#ef4444", bg: "rgba(239,68,68,0.10)",   count_color: "#ef4444" },
];

const PRIORITY_COLORS = {
  critique: { bg: "rgba(239,68,68,0.18)",   text: "#f87171", label: "🔴 Critique" },
  haute:    { bg: "rgba(245,158,11,0.18)",  text: "#fbbf24", label: "🟠 Haute"    },
  moyenne:  { bg: "rgba(99,102,241,0.18)",  text: "#818cf8", label: "🔵 Moyenne"  },
  basse:    { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", label: "⚪ Basse"    },
};

const CATEGORY_LABELS = {
  securite:    "🔐 Sécurité",
  legal:       "⚖️ Légal",
  performance: "⚡ Perf.",
  seo:         "🔍 SEO",
  tracking:    "📡 Tracking",
  business:    "💰 Business",
  conversion:  "🎯 Conversion",
  ux:          "✨ UX",
  ops:         "🔧 Opérations",
  crm:         "📧 CRM",
  content:     "📝 Contenu",
  ads:         "📣 Ads",
  doc:         "📄 Doc",
  technique:   "⚙️ Technique",
  bug:         "🐛 Bug",
};

const ALL_AGENTS = [
  { id: "juriste-compliance",        label: "Juriste",      emoji: "⚖️"  },
  { id: "architecte-reseau",         label: "Archi. Réseau",emoji: "🔌"  },
  { id: "webmaster",                 label: "Webmaster",    emoji: "🖥️" },
  { id: "traffic-manager",           label: "Traffic Mgr",  emoji: "📈"  },
  { id: "data-analyst",              label: "Data Analyst", emoji: "📊"  },
  { id: "revenue-manager",           label: "Revenue Mgr",  emoji: "💡"  },
  { id: "developpeur-multimedia",    label: "Dév. Média",   emoji: "🎬"  },
  { id: "photographe-da",            label: "Photo DA",     emoji: "📸"  },
  { id: "webdesigner",               label: "Webdesigner",  emoji: "🎨"  },
  { id: "chef-produit-web",          label: "Chef Produit", emoji: "🏗️" },
  { id: "community-manager",         label: "Community Mgr",emoji: "📱"  },
  { id: "repondeur-social",          label: "Répondeur Social", emoji: "💬" },
  { id: "commercial-publicite",      label: "Commercial",   emoji: "💼"  },
  { id: "crm-manager",               label: "CRM Manager",  emoji: "📧"  },
  { id: "consultant-ebusiness",      label: "e-Business",   emoji: "🚀"  },
  { id: "responsable-service-client",label: "Service Client",emoji: "🤝" },
  { id: "responsable-logistique",    label: "Logistique",   emoji: "🏠"  },
  { id: "seo-content-writer",        label: "SEO Writer",   emoji: "✍️" },
  { id: "qa-tester",                 label: "QA Tester",    emoji: "🧪"  },
  { id: "growth-experiments",        label: "Growth / A/B", emoji: "🧬"  },
  { id: "veille-concurrentielle",    label: "Veille Conc.", emoji: "🔭"  },
  { id: "prompt-engineer",           label: "Prompt Eng.",  emoji: "🪄"  },
  { id: "seo-local",                 label: "SEO Local",    emoji: "🗺️"  },
  { id: "voyageur-research",         label: "Voy. Research",emoji: "🔬"  },
  { id: "fiscaliste",                label: "Fiscaliste LMP",emoji: "📜"  },
  { id: "controleur-fiscal",         label: "Contrôleur Fiscal", emoji: "🏛️" },
  { id: "comptable",                 label: "Comptable",    emoji: "📒"  },
  { id: "notaire-assurance",         label: "Notaire & Assur.", emoji: "⚖️" },
];

// Détecte le tag "⚠️ VÉRIF[risque]: critique" ajouté par /api/agents-verify
// dans les notes d'une action, pour l'afficher comme badge distinct plutôt
// que noyé dans le texte libre.
function parseVerif(notes) {
  if (!notes) return null;
  const m = notes.match(/⚠️\s*VÉRIF\[(\w+)\]:\s*([^\n]*)/);
  if (!m) return null;
  return { risque: m[1], critique: m[2].trim() };
}
const VERIF_COLORS = {
  haut:  { bg: "rgba(239,68,68,0.18)",  text: "#f87171" },
  moyen: { bg: "rgba(245,158,11,0.18)", text: "#fbbf24" },
};

// ── Utils ────────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return null;
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

// ── Composant Card ────────────────────────────────────────────────────────────
function ActionCard({ action, onStatusChange, mob, impact, userNote, onNoteChange }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(userNote || "");
  // Sync when prop changes (e.g. action just marked fait → outcome row created)
  useEffect(() => { setNote(userNote || ""); }, [userNote]);
  const prio = PRIORITY_COLORS[action.priority] || PRIORITY_COLORS.basse;
  const cat  = CATEGORY_LABELS[action.category] || action.category;
  const ago  = timeAgo(action.last_analyzed);
  const verif = parseVerif(action.notes);
  const verifCol = verif ? (VERIF_COLORS[verif.risque] || VERIF_COLORS.moyen) : null;

  const NEXT_STATUS = {
    "backlog":      ["a-planifier", "en-cours", "fait", "bloqué"],
    "a-planifier":  ["en-cours", "backlog", "bloqué"],
    "en-cours":     ["fait", "a-planifier", "backlog", "bloqué"],
    "fait":         ["backlog"],
    "bloqué":       ["backlog", "a-planifier"],
  };

  return (
    <div style={{
      background: "rgba(30,41,59,0.7)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10,
      padding: "10px 12px",
      marginBottom: 8,
      cursor: "pointer",
      transition: "border-color 0.15s, transform 0.1s",
    }}
      onClick={() => setOpen(o => !o)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 6 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{action.agent_emoji}</span>
        <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, marginTop: 1 }}>{action.agent_label}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexShrink: 0 }}>
          {verif && (
            <span
              title={`Vérification adversariale — risque ${verif.risque} : ${verif.critique}`}
              style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: verifCol.bg, color: verifCol.text, fontWeight: 700 }}
            >
              ⚠️ VÉRIF {verif.risque.toUpperCase()}
            </span>
          )}
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: prio.bg, color: prio.text, fontWeight: 700 }}>
            {action.priority.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Texte action */}
      <p style={{ margin: 0, fontSize: 12, color: "#e2e8f0", lineHeight: 1.4, fontWeight: 500 }}>
        {action.action}
      </p>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "#64748b" }}>
          {cat}
        </span>
        <span style={{ fontSize: 9, color: "#475569" }}>⏱ {action.effort}</span>
        {ago && <span style={{ fontSize: 9, color: "#334155" }}>🤖 analysé il y a {ago}</span>}
        {action.notes && <span style={{ fontSize: 9, color: "#6366f1" }}>📝 note</span>}
        {impact && (() => {
          const up = impact.startsWith("↑"), down = impact.startsWith("↓");
          const c = up ? "#10b981" : down ? "#ef4444" : "#64748b";
          return (
            <span title="Impact mesuré ~14j après complétion (corrélation)" style={{
              fontSize: 9, padding: "1px 6px", borderRadius: 4, fontWeight: 700,
              background: `${c}1a`, color: c,
            }}>
              📈 {impact}
            </span>
          );
        })()}
      </div>

      {/* Détails dépliables */}
      {open && (
        <div
          style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.07)" }}
          onClick={e => e.stopPropagation()}
        >
          {verif && (
            <div style={{ fontSize: 11, padding: "6px 8px", borderRadius: 6, marginBottom: 8, background: verifCol.bg, color: verifCol.text, fontWeight: 600, lineHeight: 1.4 }}>
              ⚠️ Vérification adversariale — risque {verif.risque} : {verif.critique}
            </div>
          )}
          {(() => {
            const rest = (action.notes || "").replace(/⚠️\s*VÉRIF\[\w+\]:[^\n]*/, "").trim();
            return rest ? (
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8, fontStyle: "italic" }}>
                📝 {rest}
              </div>
            ) : null;
          })()}
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 8 }}>
            ID: {action.id} · {new Date(action.created_at * 1000).toLocaleDateString("fr-FR")}
          </div>

          {/* Note d'impact — visible quand "fait" */}
          {action.status === "fait" && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>
                💡 Note d'impact (résultat observé, optionnel)
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                onBlur={() => onNoteChange(action.id, note)}
                placeholder="Ex: +3% taux de clic, délai réduit de 2j, 0 plainte depuis..."
                style={{
                  width: "100%", padding: "6px 8px", borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(15,23,42,0.8)", color: "#e2e8f0",
                  fontSize: 11, resize: "vertical", minHeight: 52,
                  boxSizing: "border-box", fontFamily: "inherit", outline: "none",
                }}
              />
            </div>
          )}

          {/* Boutons de changement de statut */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {(NEXT_STATUS[action.status] || []).map(st => {
              const col = COLUMNS.find(c => c.id === st);
              return (
                <button
                  key={st}
                  onClick={() => onStatusChange(action.id, st)}
                  style={{
                    padding: "4px 10px", borderRadius: 6, border: `1px solid ${col.color}40`,
                    background: col.bg, color: col.color, fontSize: 10, cursor: "pointer", fontWeight: 600,
                  }}
                >
                  → {col.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Panneau observabilité (/api/agents-stats) ──────────────────────────────────
// Branché sur un endpoint backend déjà complet mais jusqu'ici jamais appelé
// par le front : coût LLM 7j, qualité moyenne (llm_evals), modèles actifs.
function StatsPanel({ stats }) {
  if (!stats) return null;
  const costTotal = (stats.llm_cost_daily || []).reduce((s, d) => s + (d.cost || 0), 0)
    || (stats.llm_traces_7j || []).reduce((s, t) => s + (t.cost_total || 0), 0);
  const qualEntries = stats.qualite_7j || [];
  const qualN = qualEntries.reduce((s, q) => s + (q.n || 0), 0);
  const qualAvg = qualN > 0
    ? qualEntries.reduce((s, q) => s + (q.avg_global || 0) * (q.n || 0), 0) / qualN
    : null;
  // p.models est imbriqué { provider: { tier: model } } (voir _llm.js / ai-ops.js).
  const modelsByProvider = stats.modeles_actifs?.models || {};
  const modelChips = Object.entries(modelsByProvider).flatMap(([provider, tiers]) =>
    Object.entries(tiers || {}).map(([tier, model]) => ({ key: `${provider}-${tier}`, label: `${provider}/${tier}: ${model}` }))
  );
  const traces = (stats.llm_traces_7j || []).slice(0, 6);
  const totalErrors = (stats.llm_traces_7j || []).reduce((s, t) => s + (t.errors || 0), 0);

  return (
    <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: traces.length ? 12 : 0 }}>
        <div>
          <div style={{ fontSize: 10, color: "#64748b" }}>💸 Coût LLM (7j)</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>${costTotal.toFixed(4)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#64748b" }}>⭐ Qualité moy. (7j)</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: qualAvg == null ? "#475569" : qualAvg >= 7 ? "#10b981" : qualAvg >= 5 ? "#f59e0b" : "#ef4444" }}>
            {qualAvg == null ? "—" : `${qualAvg.toFixed(1)}/10`} {qualN > 0 && <span style={{ fontSize: 10, color: "#475569", fontWeight: 400 }}>({qualN} évals)</span>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#64748b" }}>❌ Erreurs LLM (7j)</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: totalErrors > 0 ? "#ef4444" : "#10b981" }}>{totalErrors}</div>
        </div>
        {modelChips.length > 0 && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>🧠 Modèles actifs (AI-Ops)</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {modelChips.map(m => (
                <span key={m.key} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: "rgba(99,102,241,0.14)", color: "#a5b4fc" }}>
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {traces.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
          {traces.map((t, i) => (
            <span key={i} title={`latence moy. ${t.avg_latency_ms || "?"}ms`} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>
              {t.provider}/{t.model} · {t.calls} appels{t.errors > 0 ? ` · ⚠️${t.errors}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function AgentsKanban({ mob }) {
  const [actions, setActions]         = useState([]);
  const [stats, setStats]             = useState({});
  const [loading, setLoading]         = useState(true);
  const [initNeeded, setInitNeeded]   = useState(false);
  const [running, setRunning]         = useState(false);
  const [runResult, setRunResult]     = useState(null);
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterPrio, setFilterPrio]   = useState("all");
  const [filterCat, setFilterCat]     = useState("all");
  const [search, setSearch]           = useState("");
  const [lastRun, setLastRun]         = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [liveActive, setLiveActive]   = useState(false);
  const [outcomes, setOutcomes]       = useState({});
  const [userNotes, setUserNotes]     = useState({});
  const [agentStats, setAgentStats]   = useState(null);
  const [statsOpen, setStatsOpen]     = useState(false);
  const runTimeout  = useRef(null);
  const pollRef     = useRef(null);
  const actionsRef  = useRef([]);

  // ── Charger les actions ──────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    try {
      // Attribution causale : impacts mesurés (best-effort, ne bloque pas le load)
      adminFetch("/api/agents-actions?table=outcomes")
        .then(r => r.json())
        .then(o => {
          const impactMap = {};
          const notesMap = {};
          for (const x of (o.outcomes || [])) {
            if (x.impact_label) impactMap[x.action_id] = x.impact_label;
            if (x.user_note)    notesMap[x.action_id]  = x.user_note;
          }
          setOutcomes(impactMap);
          setUserNotes(notesMap);
        })
        .catch(() => {});

      const r = await adminFetch("/api/agents-actions");
      const d = await r.json();
      if (d.hint?.includes("init")) {
        setInitNeeded(true);
        if (!silent) setLoading(false);
        return;
      }
      const incoming = d.actions || [];
      // Stats : toujours mettre à jour (indépendant de l'optimisation actions)
      setStats(d.stats || {});
      // Détecter si les actions ont changé (comparaison par longueur + updated_at max)
      const prevMax = actionsRef.current.reduce((m, a) => Math.max(m, Number(a.updated_at) || 0), 0);
      const nextMax = incoming.reduce((m, a) => Math.max(m, Number(a.updated_at) || 0), 0);
      if (nextMax > prevMax || incoming.length !== actionsRef.current.length) {
        actionsRef.current = incoming;
        setActions(incoming);
      }
      setInitNeeded(false);
      setLastRefresh(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      // silencieux
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ── Polling auto (10s si en-cours, 60s sinon) ────────────────────────────
  const schedulePoll = useCallback(() => {
    if (pollRef.current) clearTimeout(pollRef.current);
    const hasRunning = actionsRef.current.some(a => a.status === "en-cours");
    const delay = hasRunning ? 10_000 : 60_000;
    setLiveActive(hasRunning);
    pollRef.current = setTimeout(async () => {
      if (document.visibilityState !== "hidden") await load(true);
      schedulePoll();
    }, delay);
  }, [load]);

  // ── Observabilité (/api/agents-stats) — chargée à part, rafraîchie moins souvent ──
  const loadAgentStats = useCallback(async () => {
    try {
      const r = await adminFetch("/api/agents-stats");
      const d = await r.json();
      if (d.ok) setAgentStats(d);
    } catch {
      // silencieux — panneau optionnel, ne doit pas bloquer le reste de l'onglet
    }
  }, []);

  useEffect(() => {
    load();
    schedulePoll();
    loadAgentStats();
    const statsInterval = setInterval(loadAgentStats, 120_000);
    const onVisible = () => { if (document.visibilityState === "visible") { load(true); schedulePoll(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(pollRef.current);
      clearTimeout(runTimeout.current);
      clearInterval(statsInterval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, schedulePoll, loadAgentStats]);

  // Re-schedule poll chaque fois que les actions changent (adapte la fréquence)
  useEffect(() => { schedulePoll(); }, [actions, schedulePoll]);

  // ── Initialiser la table D1 ──────────────────────────────────────────────
  const handleInit = async () => {
    setLoading(true);
    try {
      const r = await adminFetch("/api/agents-actions?action=init", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const d = await r.json();
      if (d.ok) await load();
    } catch { setLoading(false); }
  };

  // ── Changer le statut d'une action ───────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    const now = Math.floor(Date.now() / 1000);
    // Optimistic update (local + ref)
    actionsRef.current = actionsRef.current.map(a => a.id === id ? { ...a, status: newStatus, updated_at: now } : a);
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus, updated_at: now } : a));
    await adminFetch(`/api/agents-actions?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    // Recalc stats local
    setStats(prev => {
      const action = actionsRef.current.find(a => a.id === id);
      if (!action) return prev;
      return {
        ...prev,
        [action.status]: Math.max(0, (prev[action.status] || 0) - 1),
        [newStatus]: (prev[newStatus] || 0) + 1,
      };
    });
    // Adapter la fréquence de polling selon le nouveau statut
    schedulePoll();
  };

  // ── Sauvegarder la note d'impact ────────────────────────────────────────
  const handleNoteChange = useCallback(async (id, note) => {
    setUserNotes(prev => ({ ...prev, [id]: note || undefined }));
    await adminFetch(`/api/agents-actions?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_note: note }),
    }).catch(() => {});
  }, []);

  // ── Relancer l'analyse — tous les agents, ou une liste ciblée ────────────
  // Le backend (agents-run.js) accepte déjà `agents: "all"` ou un tableau
  // d'ids ciblés — seul le bouton "relancer un seul agent" manquait côté UI.
  const runAgents = async (agentsPayload) => {
    if (running) return;
    setRunning(true);
    setRunResult(null);
    try {
      const r = await adminFetch("/api/agents-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agents: agentsPayload }),
      });
      const d = await r.json();
      if (d.error === "ANTHROPIC_API_KEY not configured in Cloudflare Pages env vars") {
        setRunResult({ error: "Clé API Anthropic manquante — ajoutez ANTHROPIC_API_KEY dans Cloudflare Pages → Settings → Variables d'environnement" });
      } else {
        setRunResult(d);
        setLastRun(new Date().toLocaleTimeString("fr-FR"));
        await load();
        loadAgentStats();
      }
    } catch (e) {
      setRunResult({ error: e.message });
    } finally {
      setRunning(false);
      runTimeout.current = setTimeout(() => setRunResult(null), 8000);
    }
  };
  const handleRunAll = () => runAgents("all");
  const handleRunOne = () => runAgents([filterAgent]);

  // ── Filtres ──────────────────────────────────────────────────────────────
  const filtered = actions.filter(a => {
    if (filterAgent !== "all" && a.agent !== filterAgent) return false;
    if (filterPrio  !== "all" && a.priority !== filterPrio) return false;
    if (filterCat   !== "all" && a.category !== filterCat) return false;
    if (search && !a.action.toLowerCase().includes(search.toLowerCase())
                && !a.agent_label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const byCol = col => filtered.filter(a => a.status === col);

  // ── Catégories uniques présentes ─────────────────────────────────────────
  const cats = [...new Set(actions.map(a => a.category))].sort();

  // ── Progress ─────────────────────────────────────────────────────────────
  const total     = Object.values(stats).reduce((s, v) => s + v, 0);
  const done      = stats["fait"] || 0;
  const planned   = stats["a-planifier"] || 0;
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
  const pctPlanned = total > 0 ? Math.round(((done + planned) / total) * 100) : 0;

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#64748b" }}>
        <span style={{ fontSize: 28, marginRight: 12, animation: "spin 1s linear infinite" }}>⚙️</span>
        Chargement des actions agents…
      </div>
    );
  }

  if (initNeeded) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
        <h2 style={{ color: "#e2e8f0", fontSize: 18, marginBottom: 8 }}>Base de données non initialisée</h2>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          La table <code style={{ background: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 4 }}>agent_actions</code> n'existe pas encore dans D1.<br />
          Cliquez pour créer la table et charger les <strong style={{ color: "#e2e8f0" }}>70 actions</strong> issues des rapports des {ALL_AGENTS.length} agents.
        </p>
        <button
          onClick={handleInit}
          style={{ padding: "12px 28px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 700 }}
        >
          🚀 Initialiser la base agents
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: mob ? "flex-start" : "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#e2e8f0", fontWeight: 700 }}>
            🤖 Agents — Plan d'action
          </h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{ALL_AGENTS.length} agents · {total} actions · Analyse autonome quotidienne à 9h UTC</span>
            {lastRun && <span style={{ color: "#10b981" }}>· Dernière relance {lastRun}</span>}
            {lastRefresh && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                  background: liveActive ? "#f59e0b" : "#10b981",
                  boxShadow: liveActive ? "0 0 0 2px rgba(245,158,11,0.3)" : "0 0 0 2px rgba(16,185,129,0.25)",
                  animation: liveActive ? "pulse 1.2s ease-in-out infinite" : "none",
                }} />
                <span style={{ color: liveActive ? "#f59e0b" : "#475569", fontSize: 11 }}>
                  {liveActive ? `live 10s · ${lastRefresh}` : `sync 60s · ${lastRefresh}`}
                </span>
              </span>
            )}
          </p>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Bouton stats */}
          <button
            onClick={() => setStatsOpen(o => !o)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
              background: statsOpen ? "rgba(255,255,255,0.08)" : "transparent",
              color: "#94a3b8", fontSize: 12, cursor: "pointer", fontWeight: 600,
            }}
          >
            📊 Stats {statsOpen ? "▲" : "▼"}
          </button>
          {/* Bouton relancer un seul agent — visible quand le filtre Agent est actif */}
          {filterAgent !== "all" && (
            <button
              onClick={handleRunOne}
              disabled={running}
              title={`Relance uniquement ${ALL_AGENTS.find(a => a.id === filterAgent)?.label || filterAgent}, sans toucher aux autres agents`}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.4)",
                background: running ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.18)",
                color: running ? "#64748b" : "var(--c-success-light)", fontSize: 12, cursor: running ? "not-allowed" : "pointer",
                fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
              }}
            >
              🎯 Relancer {ALL_AGENTS.find(a => a.id === filterAgent)?.label || filterAgent}
            </button>
          )}
          {/* Bouton relancer tous les agents */}
          <button
            onClick={handleRunAll}
            disabled={running}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.4)",
              background: running ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.18)",
              color: running ? "#64748b" : "#818cf8", fontSize: 12, cursor: running ? "not-allowed" : "pointer",
              fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {running ? (
              <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span> Analyse en cours…</>
            ) : (
              <><span>🔄</span> Relancer tout</>
            )}
          </button>
        </div>
      </div>

      {/* ── Feedback relance ── */}
      {runResult && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 12,
          background: runResult.error ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
          border: `1px solid ${runResult.error ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
          color: runResult.error ? "#f87171" : "var(--c-success-light)",
        }}>
          {runResult.error
            ? `⚠️ ${runResult.error}`
            : `✅ Analyse terminée — ${runResult.ok_count}/${runResult.agents_run} agents mis à jour · +${runResult.results?.reduce((s, r) => s + (r.inserted || 0), 0) || 0} nouvelles actions`
          }
        </div>
      )}

      {/* ── Panneau stats (observabilité LLM) ── */}
      {statsOpen && <StatsPanel stats={agentStats} />}

      {/* ── Progress global ── */}
      <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Progression globale</span>
          <span style={{ fontSize: 13, color: "#10b981", fontWeight: 700 }}>
            {pct}% fait · {pctPlanned}% traité — {done} / {total} actions
          </span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", display: "flex" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #10b981, var(--c-success-light))", transition: "width 0.5s ease" }} />
          <div style={{ height: "100%", width: `${pctPlanned - pct}%`, background: "linear-gradient(90deg, #8b5cf6, #a78bfa)", transition: "width 0.5s ease" }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
          {COLUMNS.map(col => (
            <span key={col.id} style={{ fontSize: 11, color: col.count_color }}>
              <span style={{ fontWeight: 700 }}>{stats[col.id] || 0}</span> {col.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher…"
          style={{
            padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(15,23,42,0.6)", color: "#e2e8f0", fontSize: 12, width: 180, outline: "none",
          }}
        />
        {/* Agent */}
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.8)", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
          <option value="all">Tous les agents</option>
          {ALL_AGENTS.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>)}
        </select>
        {/* Priorité */}
        <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.8)", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
          <option value="all">Toutes priorités</option>
          <option value="critique">🔴 Critique</option>
          <option value="haute">🟠 Haute</option>
          <option value="moyenne">🔵 Moyenne</option>
          <option value="basse">⚪ Basse</option>
        </select>
        {/* Catégorie */}
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.8)", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
          <option value="all">Toutes catégories</option>
          {cats.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
        </select>

        {(filterAgent !== "all" || filterPrio !== "all" || filterCat !== "all" || search) && (
          <button onClick={() => { setFilterAgent("all"); setFilterPrio("all"); setFilterCat("all"); setSearch(""); }}
            style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer" }}>
            ✕ Reset filtres
          </button>
        )}

        <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>
          {filtered.length} action{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Kanban ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: mob ? "1fr" : "repeat(5, 1fr)",
        gap: 12,
        alignItems: "start",
      }}>
        {COLUMNS.map(col => {
          const cards = byCol(col.id);
          return (
            <div key={col.id} style={{
              background: col.bg,
              border: `1px solid ${col.color}25`,
              borderTop: `3px solid ${col.color}`,
              borderRadius: 10,
              padding: "12px 10px",
              minHeight: 120,
            }}>
              {/* En-tête colonne */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: col.count_color }}>{col.label}</span>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "1px 8px", borderRadius: 10,
                  background: `${col.color}25`, color: col.color,
                }}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              {cards.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#334155", fontSize: 11 }}>
                  Aucune action
                </div>
              ) : (
                cards.map(a => (
                  <ActionCard key={a.id} action={a} onStatusChange={handleStatusChange} mob={mob} impact={outcomes[a.id]} userNote={userNotes[a.id]} onNoteChange={handleNoteChange} />
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* ── Planning priorisé ── */}
      {filtered.filter(a => a.status === "backlog").length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ color: "#94a3b8", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            📋 Planning de traitement recommandé — Backlog par priorité
          </h3>
          <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, width: 30 }}>#</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Agent</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, width: "40%" }}>Action</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Priorité</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Effort</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Catégorie</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .filter(a => a.status === "backlog")
                  .sort((a, b) => {
                    const pOrder = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
                    return (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
                  })
                  .map((a, i) => {
                    const prio = PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.basse;
                    const cat  = CATEGORY_LABELS[a.category] || a.category;
                    return (
                      <tr key={a.id} style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        transition: "background 0.12s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "8px 12px", color: "#475569" }}>{i + 1}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ fontSize: 13, marginRight: 5 }}>{a.agent_emoji}</span>
                          <span style={{ color: "#94a3b8", fontSize: 11 }}>{a.agent_label}</span>
                        </td>
                        <td style={{ padding: "8px 12px", color: "#e2e8f0", lineHeight: 1.4 }}>{a.action}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: prio.bg, color: prio.text, fontWeight: 700 }}>
                            {a.priority.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{a.effort}</td>
                        <td style={{ padding: "8px 12px", color: "#475569", fontSize: 11 }}>{cat}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Note cron ── */}
      <div style={{ marginTop: 20, padding: "10px 14px", borderRadius: 8, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", fontSize: 11, color: "#64748b" }}>
        🤖 <strong style={{ color: "#818cf8" }}>Analyse autonome</strong> — Le Worker Cloudflare déclenche l'analyse de chaque agent quotidiennement à 9h UTC.<br/>
        Prérequis : ajouter <code style={{ background: "rgba(255,255,255,0.06)", padding: "0 4px", borderRadius: 3 }}>ANTHROPIC_API_KEY</code> dans Cloudflare Pages → Settings → Variables d'environnement.
      </div>
    </div>
  );
}
