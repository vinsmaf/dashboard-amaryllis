import { useState, useEffect } from "react";
import { fetchJSON } from "../lib/apiFetch.js";

const S = {
  page: { padding: "24px", maxWidth: 900, margin: "0 auto" },
  h1: { fontSize: 20, fontWeight: 700, color: "var(--c-fg-1)", marginBottom: 6 },
  sub: { fontSize: 13, color: "var(--c-fg-4)", marginBottom: 24 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  card: { background: "var(--c-bg-elevated)", border: "1px solid var(--c-border)", borderRadius: 10, padding: "16px 20px" },
  label: { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "var(--c-fg-4)", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" },
  val: { fontSize: 14, color: "var(--c-fg-2)", lineHeight: 1.5 },
  big: { fontSize: 22, fontWeight: 800, color: "var(--c-fg-1)" },
  dot: (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }),
  badge: (color) => ({ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: color + "22", color }),
  feedRow: { fontFamily: "monospace", fontSize: 12, padding: "3px 0", color: "var(--c-danger, #ef4444)" },
  refreshBtn: { fontSize: 12, color: "var(--c-fg-4)", background: "none", border: "1px solid var(--c-border)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", marginLeft: 8 },
  noData: { fontSize: 13, color: "var(--c-fg-4)", textAlign: "center", padding: 32 },
  note: { fontSize: 11, color: "var(--c-fg-4)", marginTop: 8 },
};

const GREEN = "#10b981", AMBER = "#f59e0b", RED = "#ef4444";

function statusColor(healthy) { return healthy === true ? GREEN : healthy === false ? RED : "var(--c-fg-4)"; }

function relativeTime(minutes) {
  if (minutes == null) return "—";
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  return `il y a ${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, "0") : ""}`;
}

export default function SyncHealthTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetchJSON("/api/sync-health")
      .then((d) => { if (!cancelled) { if (d.error) throw new Error(d.error); setData(d); } })
      .catch((e) => { if (!cancelled) setErr(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  if (loading) return <div style={S.page}><div style={S.noData}>Chargement…</div></div>;
  if (err) return <div style={S.page}><div style={{ ...S.noData, color: RED }}>Erreur : {err}</div></div>;
  if (!data) return null;

  const { heartbeat, coherence, cancellations7d, beds24Token } = data;

  return (
    <div style={S.page}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h2 style={S.h1}>🔄 Santé synchro</h2>
        <button style={S.refreshBtn} onClick={() => setTick((t) => t + 1)}>↻ Rafraîchir</button>
      </div>
      <p style={S.sub}>Pipeline de résas — 4 canaux (Airbnb, Booking.com, Beds24 Nogent, Direct). Actualisé au chargement.</p>

      <div style={S.grid}>
        {/* Heartbeat cron */}
        <div style={S.card}>
          <div style={S.label}>
            <span>Sync iCal (cron 10 min)</span>
            <span style={S.badge(statusColor(heartbeat?.healthy))}>
              <span style={S.dot(statusColor(heartbeat?.healthy))} />
              {heartbeat?.healthy ? "OK" : heartbeat ? "Alerte" : "—"}
            </span>
          </div>
          {heartbeat ? (
            <div style={S.val}>
              Dernier run {relativeTime(heartbeat.ageMinutes)}<br />
              {heartbeat.eventsCount} évt · {heartbeat.newCount} nouveau(x) · {heartbeat.cancelledCount} annulation(s) · {heartbeat.directCount} direct
              {heartbeat.failedFeeds?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {heartbeat.failedFeeds.map((f, i) => (
                    <div key={i} style={S.feedRow}>❌ {f.bienId}/{f.canal} — {f.error}</div>
                  ))}
                </div>
              )}
            </div>
          ) : <div style={S.val}>Aucune donnée — le Worker n'a pas encore tourné depuis ce déploiement.</div>}
        </div>

        {/* Cohérence */}
        <div style={S.card}>
          <div style={S.label}>
            <span>Cohérence résas</span>
            <span style={S.badge(coherence.criticalCount > 0 ? RED : coherence.openCount > 0 ? AMBER : GREEN)}>
              <span style={S.dot(coherence.criticalCount > 0 ? RED : coherence.openCount > 0 ? AMBER : GREEN)} />
              {coherence.openCount} ouverte(s)
            </span>
          </div>
          <div style={S.val}>
            {coherence.openCount === 0 ? "Aucune anomalie ouverte." : (
              coherence.recent.map((r, i) => (
                <div key={i} style={{ fontSize: 12, padding: "3px 0" }}>
                  {r.severity === "critique" ? "🔴" : "🟡"} {r.message}
                </div>
              ))
            )}
          </div>
          <p style={S.note}>Depuis le check quotidien (cron 9h UTC) — onglet 🐞 Bugs pour le détail.</p>
        </div>

        {/* Annulations 7j */}
        <div style={S.card}>
          <div style={S.label}><span>Annulations 7 jours</span></div>
          <div style={S.big}>
            {(cancellations7d?.direct.count || 0) + (cancellations7d?.nogent.count || 0)}
          </div>
          <div style={S.val}>
            Direct : {cancellations7d?.direct.count || 0} (~{(cancellations7d?.direct.eur || 0).toLocaleString("fr-FR")}€) ·
            {" "}Nogent : {cancellations7d?.nogent.count || 0} (~{(cancellations7d?.nogent.eur || 0).toLocaleString("fr-FR")}€)
          </div>
          <p style={S.note}>Airbnb/Booking : voir le rapport hebdomadaire (montant non transmis par iCal).</p>
        </div>

        {/* Token Beds24 */}
        <div style={S.card}>
          <div style={S.label}>
            <span>Token Beds24</span>
            <span style={S.badge(statusColor(beds24Token?.healthy))}>
              <span style={S.dot(statusColor(beds24Token?.healthy))} />
              {beds24Token ? `${beds24Token.expiresInDays}j` : "—"}
            </span>
          </div>
          <div style={S.val}>
            {beds24Token
              ? (beds24Token.healthy ? "Expire dans plus de 7 jours." : "⚠️ Expire bientôt — vérifier la rotation auto.")
              : "Donnée indisponible."}
          </div>
        </div>
      </div>
    </div>
  );
}
