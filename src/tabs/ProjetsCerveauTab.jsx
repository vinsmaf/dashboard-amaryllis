// src/tabs/ProjetsCerveauTab.jsx — État d'avancement des projets piloté par le second cerveau
import { useState, useEffect } from "react";

const C = {
  live:    { bg: "rgba(16,185,129,0.15)", border: "#10b981", dot: "#10b981", label: "LIVE" },
  planned: { bg: "rgba(99,102,241,0.12)", border: "#6366f1", dot: "#6366f1", label: "PLANIFIÉ" },
  done:    { bg: "rgba(100,116,139,0.12)", border: "#475569", dot: "#475569", label: "FAIT" },
  wip:     { bg: "rgba(245,158,11,0.12)", border: "#f59e0b", dot: "#f59e0b", label: "EN COURS" },
};

const VAGUES = [
  {
    num: 1,
    titre: "ChatWidget service-client",
    desc: "Mistral FR · grounding faits · escalade ntfy cas sensibles · kill-switch CHAT_DISABLED",
    statut: "live",
    date: "15/06/2026",
    autonomie: "Semi-auto",
    gardeFou: "Escalade litige/punaises/remboursement → ntfy humain · kill-switch instant",
    livrable: "Chat répondant 24h/7j aux voyageurs sur dispo, prix, équipements, accès",
  },
  {
    num: 2,
    titre: "Veille concurrentielle autonome",
    desc: "Scrape concurrents → signaux marché → reco RM préparée · interne only",
    statut: "planned",
    date: "28/06/2026",
    autonomie: "AUTO complet",
    gardeFou: "Interne uniquement · ne touche jamais un prix (RM = advisory)",
    livrable: "Rapport hebdo concurrence + reco RM prête à appliquer",
  },
  {
    num: 3,
    titre: "Réponses aux avis",
    desc: "Auto-rédige · auto-publie ≥4★ positif · escalade négatif/litige",
    statut: "planned",
    date: "05/07/2026",
    autonomie: "Semi-auto encadré",
    gardeFou: "Dry-run avant activation · déclencheur strict (≥4★ + sentiment positif) · négatif → humain",
    livrable: "Réponses publiées auto sur avis positifs, 0 intervention sur négatifs",
  },
  {
    num: 4,
    titre: "Rapports business autonomes",
    desc: "Résas directes · CA · par bien · arrivées 7j → push ntfy · data-analyst lecture seule",
    statut: "live",
    date: "14/06/2026",
    autonomie: "AUTO complet",
    gardeFou: "Interne · lecture seule D1 · aucune action outward sauf ntfy à l'hôte",
    livrable: "Brief business quotidien en ntfy · endpoint /api/rapport-business",
    note: "En avance sur planning (attendu 12/07). Test autonomie one-shot 18h MTQ ce soir.",
  },
];

const CRONS = [
  {
    id: "rapport-business-amaryllis-18h",
    label: "Rapport business V4 — test autonomie",
    schedule: "One-shot 14/06/2026 18h MTQ",
    enabled: true,
    oneshot: true,
    projet: "V4",
  },
  {
    id: "consolidation-memoire-hebdo",
    label: "Consolidation mémoire second cerveau",
    schedule: "Lundi 6h MTQ",
    enabled: true,
    projet: "Cerveau",
  },
  {
    id: "point-ads-hebdo",
    label: "Point Ads hebdo (Meta + Google)",
    schedule: "Lundi 7h MTQ",
    enabled: true,
    projet: "Ads",
  },
  {
    id: "autopsie-trading-hebdo",
    label: "Autopsie trading paper",
    schedule: "Lundi 8h23 MTQ",
    enabled: true,
    projet: "Trading",
  },
  {
    id: "rappel-mensuel-snapshots-finary",
    label: "Snapshots crypto + sync Finary",
    schedule: "1er du mois 7h",
    enabled: true,
    projet: "Patrimoine",
  },
];

const JALONS = [
  { date: "2026-06-27", label: "Revue 7j agent V1 — mesure temps gagné + incidents", urgent: true, projet: "V1" },
  { date: "2026-06-28", label: "Lancement Vague 2 — veille concurrentielle (autonome)", projet: "V2" },
  { date: "2026-07-05", label: "Lancement Vague 3 — réponses avis (dry-run first)", projet: "V3" },
  { date: "2026-07-12", label: "Vague 4 cron quotidien — rapports business récurrents", projet: "V4" },
];

const ENDPOINT = "https://villamaryllis.com/api/rapport-business";

const s = {
  wrap: { padding: "20px 24px", maxWidth: 1100, margin: "0 auto" },
  h1:   { fontSize: 20, fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px" },
  sub:  { fontSize: 12, color: "#64748b", margin: "0 0 28px" },
  sec:  { marginBottom: 32 },
  sh:   { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 },
  card: (col) => ({
    background: col.bg,
    border: `1px solid ${col.border}40`,
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 10,
    position: "relative",
  }),
  dot:  (color) => ({
    width: 8, height: 8, borderRadius: "50%", background: color,
    display: "inline-block", marginRight: 7, flexShrink: 0,
    boxShadow: `0 0 6px ${color}`,
  }),
  badge: (col) => ({
    fontSize: 10, fontWeight: 700, color: col.dot,
    background: `${col.dot}18`, border: `1px solid ${col.dot}40`,
    borderRadius: 4, padding: "2px 7px", letterSpacing: "0.06em",
  }),
  num: {
    position: "absolute", top: 14, right: 14,
    fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.06)",
  },
  title: { fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 },
  desc:  { fontSize: 12, color: "#94a3b8", marginBottom: 8, lineHeight: 1.5 },
  meta:  { fontSize: 11, color: "#64748b", marginBottom: 2 },
  note:  { fontSize: 11, color: "#f59e0b", marginTop: 8, padding: "4px 8px", background: "rgba(245,158,11,0.08)", borderRadius: 4 },
  row:   { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cron:  {
    background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8, padding: "10px 14px", marginBottom: 8,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
  },
  jalon: (urgent) => ({
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "10px 14px", borderRadius: 8, marginBottom: 8,
    background: urgent ? "rgba(245,158,11,0.08)" : "rgba(15,23,42,0.5)",
    border: `1px solid ${urgent ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.06)"}`,
  }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" },
};

function StatusBadge({ statut }) {
  const col = C[statut] || C.planned;
  return <span style={s.badge(col)}>{col.label}</span>;
}

function VagueCard({ v }) {
  const col = C[v.statut] || C.planned;
  return (
    <div style={s.card(col)}>
      <div style={s.num}>V{v.num}</div>
      <div style={{ ...s.row, marginBottom: 8 }}>
        <span style={s.dot(col.dot)} />
        <span style={s.title}>Vague {v.num} — {v.titre}</span>
        <StatusBadge statut={v.statut} />
      </div>
      <div style={s.desc}>{v.desc}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
        <div style={s.meta}><b style={{ color: "#64748b" }}>Autonomie :</b> <span style={{ color: "#cbd5e1" }}>{v.autonomie}</span></div>
        <div style={s.meta}><b style={{ color: "#64748b" }}>Date :</b> <span style={{ color: "#cbd5e1" }}>{v.date}</span></div>
        <div style={{ ...s.meta, gridColumn: "1/-1" }}><b style={{ color: "#64748b" }}>Garde-fou :</b> <span style={{ color: "#94a3b8" }}>{v.gardeFou}</span></div>
        <div style={{ ...s.meta, gridColumn: "1/-1" }}><b style={{ color: "#64748b" }}>Livrable :</b> <span style={{ color: "#94a3b8" }}>{v.livrable}</span></div>
      </div>
      {v.note && <div style={s.note}>⚡ {v.note}</div>}
    </div>
  );
}

function daysUntil(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d - now) / 86400000);
}

export default function ProjetsCerveauTab() {
  const [lastReport, setLastReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("brain_last_report");
    if (cached) try { setLastReport(JSON.parse(cached)); } catch {}
  }, []);

  async function fetchReport() {
    setLoading(true);
    try {
      const token = prompt("Token RAPPORT_TOKEN ?");
      if (!token) return;
      const r = await fetch(`${ENDPOINT}?token=${token}`);
      const d = await r.json();
      setLastReport(d);
      try { sessionStorage.setItem("brain_last_report", JSON.stringify(d)); } catch {}
    } catch (e) {
      alert("Erreur : " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <h2 style={s.h1}>Second cerveau — État des projets</h2>
      <p style={s.sub}>Tableau de bord des agents IA et de la roadmap d'autonomisation • Mis à jour manuellement via PROJETS.md</p>

      {/* PROJET PRINCIPAL */}
      <div style={s.sec}>
        <div style={s.sh}>Projet actif — Délégation agents IA</div>
        <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc", marginBottom: 4 }}>Objectif</div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
            Passer ≥1 agent Amaryllis en « auto-appliqué avec garde-fou » pour <b style={{ color: "#e2e8f0" }}>réduire le temps opératoire de Vincent</b> sur la conciergerie.
            <br/>Critère de succès : 1 agent autonome en prod · ≥1 tâche/jour sans intervention · 0 incident sur 7 jours.
          </div>
          <div style={{ ...s.row, marginTop: 10, gap: 6 }}>
            {[["en profiter", "#10b981"], ["liberté", "#6366f1"], ["réversible", "#0ea5e9"], ["sécuriser", "#f59e0b"]].map(([l, c]) => (
              <span key={l} style={{ fontSize: 10, fontWeight: 600, color: c, background: `${c}18`, border: `1px solid ${c}30`, borderRadius: 4, padding: "2px 7px" }}>{l}</span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12, fontSize: 12, color: "#64748b" }}>
          Roadmap d'extension — <b style={{ color: "#94a3b8" }}>Claude décide du timing et lance chaque vague à son jalon, sans redemander</b>
        </div>
        {VAGUES.map(v => <VagueCard key={v.num} v={v} />)}
      </div>

      {/* GRID CRONS + JALONS */}
      <div style={s.grid2}>
        {/* CRONS */}
        <div style={s.sec}>
          <div style={s.sh}>Tâches planifiées actives</div>
          {CRONS.map(c => (
            <div key={c.id} style={s.cron}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={s.dot(c.enabled ? "#10b981" : "#475569")} />
                <div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{c.schedule}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {c.oneshot && <span style={{ ...s.badge(C.wip), fontSize: 9 }}>ONE-SHOT</span>}
                <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b", background: "rgba(100,116,139,0.15)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: 4, padding: "2px 6px" }}>{c.projet}</span>
              </div>
            </div>
          ))}
        </div>

        {/* JALONS */}
        <div style={s.sec}>
          <div style={s.sh}>Jalons à venir</div>
          {JALONS.map(j => {
            const d = daysUntil(j.date);
            return (
              <div key={j.date} style={s.jalon(j.urgent)}>
                <div style={{ flexShrink: 0, minWidth: 52, textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: d <= 7 ? "#f59e0b" : "#6366f1" }}>{d}j</div>
                  <div style={{ fontSize: 9, color: "#475569" }}>{j.date.slice(5).replace("-", "/")}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 2 }}>{j.label}</div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#6366f1", background: "rgba(99,102,241,0.12)", borderRadius: 3, padding: "1px 5px" }}>{j.projet}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RAPPORT BUSINESS LIVE */}
      <div style={s.sec}>
        <div style={s.sh}>Dernier rapport business (V4 · /api/rapport-business)</div>
        <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: 16 }}>
          {lastReport ? (
            <>
              <div style={{ ...s.row, marginBottom: 10, justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>
                  ✓ {lastReport.today} · provider: {lastReport.provider} · notifié: {lastReport.notified ? "oui" : "non"}
                </div>
                <button onClick={fetchReport} disabled={loading} style={{ fontSize: 11, color: "#64748b", background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: 5, padding: "3px 10px", cursor: "pointer" }}>
                  {loading ? "…" : "↻ Actualiser"}
                </button>
              </div>
              <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: 12 }}>
                {lastReport.report}
              </div>
              {lastReport.stats?.parBien?.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {lastReport.stats.parBien.map(b => (
                    <span key={b} style={{ fontSize: 11, color: "#94a3b8", background: "rgba(100,116,139,0.12)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: 4, padding: "3px 8px" }}>{b}</span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#475569" }}>Pas encore de rapport chargé · test autonomie prévu 18h MTQ ce soir</span>
              <button onClick={fetchReport} disabled={loading} style={{ fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 5, padding: "5px 14px", cursor: "pointer" }}>
                {loading ? "…" : "Charger rapport"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GARDE-FOUS GLOBAUX */}
      <div style={s.sec}>
        <div style={s.sh}>Garde-fous communs (non négociables)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
          {[
            ["🔍", "Grounding sur _biens.js", "Jamais inventer un fait — faits = source unique"],
            ["🚫", "0 action outward irréversible", "Aucune publication/envoi sans déclencheur strict ou clic Vincent"],
            ["🔔", "Escalade ntfy", "Cas sensibles → push ntfy à l'hôte, jamais de réponse auto"],
            ["⚡", "Kill-switch", "CHAT_DISABLED=1 → désactivation sans redéploiement (KV prévu)"],
            ["📖", "RM = advisory only", "Recommandations préparées, Vincent applique — jamais auto"],
            ["📋", "Paper trading first", "Trading-bot : papier obligatoire avant capital réel"],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 15, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
