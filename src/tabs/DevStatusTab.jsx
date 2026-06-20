import { useState, useEffect } from "react";

const S = {
  page: { padding: "24px", maxWidth: 900, margin: "0 auto" },
  h1: { fontSize: 20, fontWeight: 700, color: "var(--c-fg-1)", marginBottom: 6 },
  sub: { fontSize: 13, color: "var(--c-fg-4)", marginBottom: 24 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  card: { background: "var(--c-bg-elevated)", border: "1px solid var(--c-border)", borderRadius: 10, padding: "16px 20px" },
  cardFull: { background: "var(--c-bg-elevated)", border: "1px solid var(--c-border)", borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
  label: { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "var(--c-fg-4)", textTransform: "uppercase", marginBottom: 10 },
  val: { fontSize: 14, color: "var(--c-fg-2)", lineHeight: 1.5 },
  mono: { fontFamily: "monospace", fontSize: 13, color: "var(--c-fg-1)" },
  badge: (color) => ({ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: color + "22", color }),
  dot: (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }),
  commitRow: { display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--c-border)" },
  commitHash: { fontFamily: "monospace", fontSize: 11, color: "var(--c-fg-4)", minWidth: 56, paddingTop: 2 },
  commitMsg: { fontSize: 13, color: "var(--c-fg-2)", flex: 1 },
  commitDate: { fontSize: 11, color: "var(--c-fg-4)", whiteSpace: "nowrap" },
  fileRow: { fontFamily: "monospace", fontSize: 12, padding: "3px 0", color: "var(--c-warning)", borderBottom: "1px solid var(--c-border)" },
  refreshBtn: { fontSize: 12, color: "var(--c-fg-4)", background: "none", border: "1px solid var(--c-border)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", marginLeft: 8 },
  noData: { fontSize: 13, color: "var(--c-fg-4)", textAlign: "center", padding: 32 },
};

function relativeTime(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function DevStatusTab() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [tick, setTick] = useState(0);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/build-info.json?_=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInfo(data);
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tick]);

  if (loading) return <div style={S.page}><div style={S.noData}>Chargement…</div></div>;
  if (err) return <div style={S.page}><div style={{ ...S.noData, color: "var(--c-danger)" }}>Pas de données ({err}). Lance un <code>npm run build</code> d'abord.</div></div>;
  if (!info) return null;

  const uncommittedLines = info.uncommitted ? info.uncommitted.split('\n').filter(Boolean) : [];
  const isClean = uncommittedLines.length === 0;
  const isMain = info.branch === "main";

  return (
    <div style={S.page}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h2 style={S.h1}>⚙️ État du déploiement</h2>
        <button style={S.refreshBtn} onClick={() => setTick(t => t + 1)}>↻ Rafraîchir</button>
      </div>
      <p style={S.sub}>
        Capture git au moment du build · builté {relativeTime(info.builtAt)} ({fmtDate(info.builtAt)})
      </p>

      {/* Row 1: commit + propreté */}
      <div style={S.grid}>
        {/* Commit déployé */}
        <div style={S.card}>
          <div style={S.label}>Commit en prod</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={S.mono}>{info.shortHash}</span>
            <span style={S.badge(isMain ? "#10b981" : "#f59e0b")}>{info.branch}</span>
          </div>
          <div style={{ fontSize: 14, color: "var(--c-fg-1)", marginBottom: 6, fontWeight: 500 }}>{info.message}</div>
          <div style={{ fontSize: 12, color: "var(--c-fg-4)" }}>{fmtDate(info.authorDate)}</div>
        </div>

        {/* Propreté au build */}
        <div style={{ ...S.card, borderColor: isClean ? "rgba(16,185,129,0.35)" : "rgba(245,158,11,0.35)" }}>
          <div style={S.label}>Propreté au build</div>
          {isClean ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={S.dot("#10b981")} />
              <span style={{ fontSize: 14, color: "#10b981", fontWeight: 600 }}>Worktree propre</span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={S.dot("#f59e0b")} />
                <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: 600 }}>
                  {uncommittedLines.length} fichier{uncommittedLines.length > 1 ? "s" : ""} non commité{uncommittedLines.length > 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ maxHeight: 120, overflowY: "auto" }}>
                {uncommittedLines.map((line, i) => (
                  <div key={i} style={S.fileRow}>{line}</div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Build info compacte */}
      <div style={{ ...S.cardFull, display: "flex", gap: 32, flexWrap: "wrap" }}>
        <div>
          <div style={S.label}>Hash complet</div>
          <div style={{ ...S.mono, fontSize: 11, color: "var(--c-fg-4)" }}>{info.hash}</div>
        </div>
        <div>
          <div style={S.label}>Build</div>
          <div style={S.val}>{fmtDate(info.builtAt)}</div>
        </div>
        <div>
          <div style={S.label}>Worker</div>
          <div style={{ ...S.val, color: "var(--c-fg-4)" }}>
            Déploiement séparé ·{" "}
            <code style={{ fontSize: 11 }}>npx wrangler deploy</code>
          </div>
        </div>
        <div>
          <div style={S.label}>Ancrage</div>
          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: "var(--c-info)" }}
          >
            CF Dashboard ↗
          </a>
        </div>
      </div>

      {/* Historique commits */}
      {info.recentCommits?.length > 0 && (
        <div style={S.cardFull}>
          <div style={S.label}>Historique récent</div>
          {info.recentCommits.map((c, i) => (
            <div key={i} style={{ ...S.commitRow, borderBottom: i < info.recentCommits.length - 1 ? "1px solid var(--c-border)" : "none" }}>
              <span style={S.commitHash}>{c.shortHash}</span>
              <span style={S.commitMsg}>{c.message}</span>
              <span style={S.commitDate}>{fmtDate(c.date)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Aide */}
      <div style={{ fontSize: 12, color: "var(--c-fg-5)", marginTop: 8 }}>
        💡 Cette page reflète l'état git <em>au moment du build</em>. Pour voir l'état live du worktree, lance{" "}
        <code>git status</code> dans le terminal. Pour déployer :{" "}
        <code>npm run deploy:pages</code> (depuis <code>~/locatif-dashboard</code>).
      </div>
    </div>
  );
}
