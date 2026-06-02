/**
 * OrchestratorTab — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState, useEffect } from "react";
import { adminFetch } from "../lib/apiFetch.js";
import { useAppData } from "../AppDataContext.jsx";

export default function OrchestratorTab() {
  const { mob } = useAppData();
  const [runs,     setRuns]     = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [running,  setRunning]  = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [memAgent, setMemAgent] = useState("all");
  const [initDone, setInitDone] = useState(false);

  // Charge les runs et les mémoires
  async function loadData() {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/orchestrator").then(r => r.json()),
        fetch("/api/agent-memory").then(r => r.json()),
      ]);
      setRuns(r1.runs || []);
      setMemories(r2.memories || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  // Déclenche une orchestration
  async function triggerOrchestration() {
    setRunning(true);
    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual", event_data: { source: "admin_dashboard", ts: Date.now() } }),
      });
      const data = await res.json();
      if (data.run) {
        setRuns(prev => [data.run, ...prev.slice(0, 19)]);
        setExpanded(data.run.id);
      }
    } catch {}
    setRunning(false);
    await loadData();
  }

  // Initialise les tables D1 (si première utilisation)
  async function initTables() {
    try {
      await adminFetch("/api/agents-actions?action=init", { method: "POST" });
      setInitDone(true);
      await loadData();
    } catch {}
  }

  const oCard = { background: "#1e293b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 10, overflow: "hidden" };
  const PRIO_COLOR = { critique: "#ef4444", haute: "#f59e0b", moyenne: "#0ea5e9", basse: "#64748b" };

  // Agents par catégorie pour la visualisation réseau
  const AGENT_GROUPS = [
    { label: "Juridique & Sécurité", color: "#ef4444", agents: ["juriste-compliance", "architecte-reseau"] },
    { label: "Tech & Infra",         color: "#0ea5e9", agents: ["webmaster", "developpeur-multimedia", "qa-tester", "prompt-engineer"] },
    { label: "Revenu & Commerce",    color: "#10b981", agents: ["revenue-manager", "consultant-ebusiness", "commercial-publicite", "veille-concurrentielle"] },
    { label: "Acquisition",          color: "#f59e0b", agents: ["traffic-manager", "data-analyst", "seo-content-writer", "seo-local", "growth-experiments"] },
    { label: "Client & CRM",         color: "#a855f7", agents: ["crm-manager", "responsable-service-client", "community-manager", "voyageur-research"] },
    { label: "Ops & Logistique",     color: "#64748b", agents: ["responsable-logistique", "photographe-da", "webdesigner", "chef-produit-web"] },
  ];

  const filteredMems = memAgent === "all" ? memories : memories.filter(m => m.agent === memAgent);
  const agentList = [...new Set(memories.map(m => m.agent))].sort();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#f1f5f9" }}>🧠 Orchestrateur multi-agents</h2>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>
            Claude Sonnet coordonne les 23 agents · mémoire persistante D1 · décisions cross-fonctionnelles
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={initTables} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer" }}>
            ⚙️ Init D1
          </button>
          <button onClick={loadData} disabled={loading} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
            {loading ? "⟳" : "↺ Actualiser"}
          </button>
          <button onClick={triggerOrchestration} disabled={running}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: running ? "#334155" : "linear-gradient(135deg,#7c3aed,#0ea5e9)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: running ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {running ? "⏳ Orchestration en cours…" : "▶ Déclencher l'orchestration"}
          </button>
        </div>
      </div>

      {/* Architecture réseau agents */}
      <div style={{ ...oCard, marginBottom: 16, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Architecture du réseau d'agents</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(3, 1fr)", gap: 8 }}>
          {AGENT_GROUPS.map(g => (
            <div key={g.label} style={{ background: `${g.color}0d`, border: `1px solid ${g.color}33`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: g.color, fontWeight: 700, marginBottom: 6 }}>{g.label}</div>
              {g.agents.map(a => {
                const mem = memories.filter(m => m.agent === a);
                return (
                  <div key={a} style={{ fontSize: 10, color: "#94a3b8", padding: "2px 0", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: mem.length > 0 ? g.color : "#334155", display: "inline-block", flexShrink: 0 }} />
                    {a.replace("responsable-", "").replace("-", " ")}
                    {mem.length > 0 && <span style={{ color: g.color, fontSize: 9 }}>·{mem.length}mem</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "#334155", marginTop: 8 }}>
          🟢 Agent avec mémoire active · ⚫ Agent sans mémoire (non encore analysé)
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "3fr 2fr", gap: 12 }}>

        {/* Colonne gauche : runs d'orchestration */}
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Runs d'orchestration ({runs.length})
          </div>

          {runs.length === 0 ? (
            <div style={{ ...oCard, padding: "32px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🧠</div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 6 }}>Aucun run d'orchestration</div>
              <div style={{ fontSize: 11, color: "#334155" }}>Clique "Déclencher l'orchestration" pour lancer la première analyse coordonnée</div>
            </div>
          ) : runs.map(run => {
            const isExp = expanded === run.id;
            const date  = new Date(run.created_at * 1000).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
            const dur   = run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—";

            let urgences  = [];
            let synergies = [];
            let decisions = [];
            try { urgences  = JSON.parse(run.urgences  || "[]"); } catch {}
            try { synergies = JSON.parse(run.synergies || "[]"); } catch {}
            try { decisions = JSON.parse(run.decisions || "[]"); } catch {}

            return (
              <div key={run.id} style={oCard}>
                <div onClick={() => setExpanded(isExp ? null : run.id)}
                  style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: run.status === "done" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: run.status === "done" ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                        {run.status === "done" ? "✓ Terminé" : "⟳ En cours"}
                      </span>
                      <span style={{ fontSize: 10, color: "#475569" }}>{run.trigger}</span>
                      <span style={{ fontSize: 10, color: "#334155" }}>{dur}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{date}</div>
                    {run.summary && <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 6, lineHeight: 1.5 }}>{run.summary.slice(0, 160)}{run.summary.length > 160 ? "…" : ""}</div>}
                  </div>
                  <span style={{ color: "#475569", fontSize: 14, flexShrink: 0 }}>{isExp ? "▲" : "▼"}</span>
                </div>

                {isExp && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px" }}>
                    {run.summary && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>SYNTHÈSE</div>
                        <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}>{run.summary}</div>
                      </div>
                    )}
                    {urgences.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 600, marginBottom: 6 }}>🚨 URGENCES ({urgences.length})</div>
                        {urgences.map((u, i) => (
                          <div key={i} style={{ fontSize: 11, color: "#fca5a5", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <strong style={{ color: "#f87171" }}>{u.action_id}</strong> — {u.raison}
                          </div>
                        ))}
                      </div>
                    )}
                    {synergies.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: "#a855f7", fontWeight: 600, marginBottom: 6 }}>🔗 SYNERGIES ({synergies.length})</div>
                        {synergies.map((s, i) => (
                          <div key={i} style={{ fontSize: 11, color: "#c4b5fd", padding: "4px 0" }}>
                            <strong>{(s.agents || []).join(" + ")}</strong> — {s.opportunite}
                          </div>
                        ))}
                      </div>
                    )}
                    {decisions.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 600, marginBottom: 6 }}>⚡ DÉCISIONS ({decisions.length})</div>
                        {decisions.map((d, i) => (
                          <div key={i} style={{ fontSize: 11, color: "#7dd3fc", padding: "4px 8px", background: "rgba(14,165,233,0.06)", borderRadius: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", marginRight: 6 }}>{d.type}</span>
                            {d.details}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Colonne droite : mémoires agents */}
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Mémoire agents ({memories.length} entrées)
          </div>

          {/* Filtre agent */}
          <select value={memAgent} onChange={e => setMemAgent(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 11, marginBottom: 10, cursor: "pointer" }}>
            <option value="all">Tous les agents</option>
            {agentList.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {filteredMems.length === 0 ? (
            <div style={{ ...oCard, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#475569" }}>Aucune mémoire — lance un run d'agents pour alimenter la mémoire</div>
            </div>
          ) : (
            <div style={oCard}>
              {filteredMems.map((m, i) => {
                let val = m.value;
                try { const parsed = JSON.parse(m.value); val = parsed.action || parsed; } catch {}
                const date = m.created_at ? new Date(m.created_at * 1000).toLocaleDateString("fr-FR") : "—";
                return (
                  <div key={i} style={{ padding: "9px 14px", borderBottom: i < filteredMems.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 600 }}>{m.key}</span>
                      <span style={{ fontSize: 9, color: "#334155" }}>{date}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{m.agent}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, wordBreak: "break-word" }}>
                      {typeof val === "string" ? val.slice(0, 120) : JSON.stringify(val).slice(0, 120)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info migration */}
          <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8, fontSize: 10, color: "#78716c" }}>
            <div style={{ color: "#f59e0b", fontWeight: 600, marginBottom: 4 }}>ℹ️ Première utilisation</div>
            Si les tables D1 ne sont pas encore créées en production, clique "⚙️ Init D1" pour les initialiser. Les tables <code style={{ color: "#94a3b8" }}>agent_memory</code> et <code style={{ color: "#94a3b8" }}>orchestrator_runs</code> seront créées sans toucher aux données existantes.
          </div>
        </div>
      </div>
    </div>
  );
}
