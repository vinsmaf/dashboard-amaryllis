/**
 * AnalyticsTab — vue Google Analytics (GA4) 30 derniers jours.
 * Extrait de src/App.jsx (refactor 2026, batch B/3).
 */
import { useState, useEffect } from "react";
import { ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { TT } from "../App.jsx";
import { useAppData } from "../AppDataContext.jsx";

export default function AnalyticsTab() {
  const { mob } = useAppData();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 28 }}>📊</div>
      <div style={{ color: "#64748b", fontSize: 13 }}>Chargement Analytics…</div>
    </div>
  );

  if (error) return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 20, marginTop: 12 }}>
      <div style={{ fontWeight: 700, color: "#f87171", marginBottom: 6 }}>⚠ Analytics non disponible</div>
      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{error}</div>
      {error.includes("non configuré") && (
        <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8", lineHeight: 1.8 }}>
          <b style={{ color: "#e2e8f0" }}>Configuration requise :</b><br />
          1. Google Cloud → créer un Service Account → télécharger le JSON<br />
          2. GA4 Admin → Gestion des accès → ajouter l'email du service account (Lecteur)<br />
          3. Ajouter les secrets Cloudflare : <code style={{ color: "#f59e0b" }}>GA4_PROPERTY_ID</code>, <code style={{ color: "#f59e0b" }}>GA4_CLIENT_EMAIL</code>, <code style={{ color: "#f59e0b" }}>GA4_PRIVATE_KEY</code>
        </div>
      )}
    </div>
  );

  if (!data) return null;

  // ── Agrégats overview (dateRange 0 = 30j, dateRange 1 = 30j précédents) ──
  const agg = (range) => {
    const rows = (data.overview || []).filter(r => r.dateRange === `date_range_${range}`);
    // Si pas de dateRange dans la réponse (rapport simple), on prend tout
    const all = rows.length > 0 ? rows : (data.overview || []);
    return all.reduce((a, r) => ({
      sessions:    a.sessions    + (r.sessions    || 0),
      users:       a.users       + (r.totalUsers  || 0),
      pageviews:   a.pageviews   + (r.screenPageViews || 0),
      bounceRate:  a.bounceRate  + (r.bounceRate  || 0) / Math.max(all.length, 1),
      avgDuration: a.avgDuration + (r.averageSessionDuration || 0) / Math.max(all.length, 1),
    }), { sessions: 0, users: 0, pageviews: 0, bounceRate: 0, avgDuration: 0 });
  };

  const cur  = agg(0);
  const prev = agg(1);
  const delta = (c, p) => p > 0 ? Math.round((c - p) / p * 100) : null;

  // Trier l'overview par date pour le graphe
  const overviewByDate = [...(data.overview || [])]
    .filter(r => !r.dateRange || r.dateRange === "date_range_0")
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .map(r => ({ date: r.date ? `${r.date.slice(6,8)}/${r.date.slice(4,6)}` : "?", sessions: r.sessions || 0, users: r.totalUsers || 0 }));

  // ── Devices ──
  const totalDevSessions = (data.devices || []).reduce((s, r) => s + (r.sessions || 0), 0);
  const devColors = { desktop: "#0ea5e9", mobile: "#10b981", tablet: "#f59e0b" };

  // ── Top sources ──
  const topSources = [...(data.sources || [])]
    .map(r => ({
      label: r.sessionSource === "(direct)" ? "Direct" : `${r.sessionSource}`,
      medium: r.sessionMedium,
      sessions: r.sessions || 0,
    }))
    .slice(0, 8);
  const maxSrc = Math.max(...topSources.map(s => s.sessions), 1);

  // ── Top pages ──
  const topPages = [...(data.pages || [])]
    .map(r => ({ path: r.pagePath || "/", sessions: r.sessions || 0, users: r.totalUsers || 0, duration: Math.round(r.averageSessionDuration || 0) }))
    .slice(0, 12);
  const maxPage = Math.max(...topPages.map(p => p.sessions), 1);

  // ── Funnel de conversion (data-046) ──
  const funnel = data.funnel || [];
  const sumEvent = (name) => funnel.filter(r => r.eventName === name).reduce((s, r) => s + (r.eventCount || 0), 0);
  const fVi = sumEvent("view_item"), fBc = sumEvent("begin_checkout"), fPu = sumEvent("purchase"), fLead = sumEvent("generate_lead");
  const tauxBC = fVi ? Math.round(fBc / fVi * 100) : 0;
  const tauxPU = fBc ? Math.round(fPu / fBc * 100) : 0;
  const tauxGlobal = fVi ? (fPu / fVi * 100).toFixed(1) : "0";
  const hasFunnel = (fVi + fBc + fPu + fLead) > 0;

  // ── Top pays ──
  const topCountries = (data.countries || []).slice(0, 6);
  const maxCountry = Math.max(...topCountries.map(c => c.sessions || 0), 1);

  const fmt2 = n => n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(Math.round(n));
  const fmtDur = s => `${Math.floor(s/60)}m${Math.round(s%60).toString().padStart(2,"0")}s`;

  const KPI = ({ label, value, prev: p, color = "#0ea5e9", suffix = "" }) => {
    const d = p !== undefined ? delta(value, p) : null;
    return (
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{fmt2(value)}{suffix}</div>
        {d !== null && (
          <div style={{ fontSize: 10, color: d >= 0 ? "#10b981" : "#ef4444", marginTop: 3 }}>
            {d >= 0 ? "▲" : "▼"} {Math.abs(d)}% vs 30j préc.
          </div>
        )}
      </div>
    );
  };

  const srcColor = (medium) => {
    if (medium === "organic")  return "#10b981";
    if (medium === "referral") return "#f59e0b";
    if (medium === "social")   return "#6366f1";
    if (medium === "(none)")   return "#0ea5e9";
    return "#64748b";
  };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>📊 Google Analytics — 30 derniers jours</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 18 }}>Propriété G-N9BM709ZBL · {data.overview?.length || 0} jours de données</div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        <KPI label="Sessions"   value={cur.sessions}    prev={prev.sessions}    color="#0ea5e9" />
        <KPI label="Visiteurs"  value={cur.users}       prev={prev.users}       color="#10b981" />
        <KPI label="Pages vues" value={cur.pageviews}   prev={prev.pageviews}   color="#6366f1" />
        <KPI label="Rebond"     value={Math.round(cur.bounceRate * 100)} suffix="%" color="#f59e0b" />
        <KPI label="Durée moy." value={cur.avgDuration} color="#ec4899" suffix="" />
      </div>

      {/* Tunnel de conversion (data-046) */}
      {hasFunnel && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: mob ? 12 : 18, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>🛒 Tunnel de conversion — 30j</div>
          <div style={{ display: "flex", alignItems: "stretch", gap: 8, flexWrap: mob ? "wrap" : "nowrap" }}>
            {[
              { label: "view_item", desc: "Fiche vue", v: fVi, color: "#0ea5e9" },
              { taux: tauxBC, label: "begin_checkout", desc: "Checkout", v: fBc, color: "#f59e0b" },
              { taux: tauxPU, label: "purchase", desc: "Achat", v: fPu, color: "#10b981" },
            ].map((step, i) => (
              <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: mob ? "100%" : 0 }}>
                {i > 0 && (
                  <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>
                    → {step.taux}%
                  </div>
                )}
                <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${step.color}33`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{step.desc}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: step.color, fontFamily: "var(--font-mono)" }}>{fmt2(step.v)}</div>
                  <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{step.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 10 }}>
            Conversion globale view_item → purchase : <strong style={{ color: "#10b981" }}>{tauxGlobal}%</strong>
            {fLead > 0 && <> · {fmt2(fLead)} leads (generate_lead)</>}
            . Funnel global GA4 (ventilation par bien possible une fois la dimension custom bien_id déclarée — voir data-049).
          </div>
        </div>
      )}

      {/* Graphe sessions / jour */}
      {overviewByDate.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: mob ? 12 : 18, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>Trafic quotidien — 30j</div>
          <ResponsiveContainer width="100%" height={mob ? 110 : 140}>
            <ComposedChart data={overviewByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(overviewByDate.length / 7)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="sessions" fill="rgba(14,165,233,0.3)" radius={[2,2,0,0]} name="Sessions" />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={1.5} dot={false} name="Visiteurs" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 16 }}>

        {/* Appareils */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>📱 Appareils</div>
          {(data.devices || []).map(d => {
            const pct = totalDevSessions > 0 ? Math.round(d.sessions / totalDevSessions * 100) : 0;
            const cat = d.deviceCategory || "other";
            const color = devColors[cat] || "#64748b";
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: "#e2e8f0", textTransform: "capitalize" }}>{cat === "desktop" ? "💻 Desktop" : cat === "mobile" ? "📱 Mobile" : "📟 Tablette"}</span>
                  <span style={{ color, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{pct}% · {fmt2(d.sessions)}</span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                  <div style={{ height: 5, width: pct + "%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Pays */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>🌍 Pays visiteurs</div>
          {topCountries.map((c, i) => {
            const pct = Math.round((c.sessions || 0) / maxCountry * 100);
            return (
              <div key={c.country || i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: "#e2e8f0" }}>{c.country || "—"}</span>
                  <span style={{ color: "#0ea5e9", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmt2(c.sessions || 0)}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: 4, width: pct + "%", background: "#0ea5e9", borderRadius: 2, opacity: 0.6 + 0.4 * pct / 100 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources de trafic */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>🔗 Sources de trafic</div>
        <div style={{ display: "grid", gap: 7 }}>
          {topSources.map((s, i) => {
            const pct = Math.round(s.sessions / maxSrc * 100);
            const color = srcColor(s.medium);
            const medLabel = s.medium === "(none)" ? "direct" : s.medium === "organic" ? "organique" : s.medium;
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: "#e2e8f0" }}>{s.label} <span style={{ color: "#64748b", fontSize: 9 }}>/ {medLabel}</span></span>
                  <span style={{ color, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmt2(s.sessions)}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: 4, width: pct + "%", background: color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top pages */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden" }}>
        <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>📄 Pages les plus visitées</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)" }}>
              {["Page", "Sessions", "Visiteurs", "Durée moy."].map(h => (
                <th key={h} style={{ padding: "7px 14px", textAlign: "left", fontSize: 9, color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topPages.map((p, i) => {
              const pct = Math.round(p.sessions / maxPage * 100);
              // Détecter le type de page
              const isBien  = ["/amaryllis","/zandoli","/iguana","/geko","/mabouya","/schoelcher","/nogent"].some(b => p.path.startsWith(b));
              const isGuide = p.path.startsWith("/guide") || p.path.startsWith("/explorer") || p.path.startsWith("/activites");
              const isAdmin = p.path.startsWith("/admin");
              const badge = isBien ? { l: "Villa", c: "#10b981" } : isGuide ? { l: "Guide", c: "#6366f1" } : isAdmin ? { l: "Admin", c: "#f59e0b" } : { l: "Page", c: "#475569" };
              return (
                <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 8, padding: "2px 5px", borderRadius: 4, background: badge.c + "22", color: badge.c, fontWeight: 700, whiteSpace: "nowrap" }}>{badge.l}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{p.path.length > 40 ? p.path.slice(0,38) + "…" : p.path}</span>
                    </div>
                    <div style={{ height: 3, marginTop: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                      <div style={{ height: 3, width: pct + "%", background: badge.c, borderRadius: 2, opacity: 0.5 }} />
                    </div>
                  </td>
                  <td style={{ padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 12, color: "#0ea5e9", fontWeight: 600 }}>{fmt2(p.sessions)}</td>
                  <td style={{ padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 11, color: "#64748b" }}>{fmt2(p.users)}</td>
                  <td style={{ padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 11, color: "#64748b" }}>{fmtDur(p.duration)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
