/**
 * AdBudgetTab (onglet « 💰 Budget Pub ») — écran de l'agent budget pub.
 *
 * ADVISORY STRICT : affiche la vision budget par bien (CAC plafond RM-08), les perfs
 * Meta + Google Ads et leur santé de mesure, et le bouton « Connecter Google Ads » (OAuth).
 * L'agent recommande, ne dépense/ne modifie RIEN — l'activation reste manuelle (Ads Manager).
 * Source : /api/ad-budget-agent (lecture seule, Bearer admin).
 */
import { useState, useEffect } from "react";
import { adminFetch } from "../lib/apiFetch.js";

function adminToken() { return sessionStorage.getItem("ldb_tok") || ""; }

const CARD = { background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 };
const TH = { padding: "4px 8px", textAlign: "left", opacity: 0.6, fontWeight: 600 };
const TD = { padding: "6px 8px" };

function HealthPill({ h }) {
  if (!h) return null;
  const map = { ok: ["#10b981", "Mesuré ✓"], traffic_only: ["#f59e0b", "Trafic seul"], no_spend: ["#64748b", "En pause"] };
  const [c, t] = map[h.status] || ["#64748b", h.status || "—"];
  return <span style={{ fontSize: 11, fontWeight: 700, color: c, background: c + "22", padding: "2px 8px", borderRadius: 6 }}>{t}</span>;
}

const VERDICT = { scale: ["#10b981", "↑ Augmenter"], hold: ["#3b82f6", "= Maintenir"], cut: ["#ef4444", "↓ Réduire"], collecting: ["#f59e0b", "Collecte…"], idle: ["#64748b", "Inactif"], unmapped: ["#64748b", "—"] };

export default function AdBudgetTab() {
  const [budget, setBudget] = useState(600);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true); setErr(null);
    adminFetch(`/api/ad-budget-agent?budget=${budget}&window=30d`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setErr("Chargement impossible."); setLoading(false); });
  }, [budget]);

  function connectGoogleAds() {
    window.location.href = `/api/gmail-oauth-start?provider=googleads&token=${encodeURIComponent(adminToken())}`;
  }

  const vb = data?.visionBudget?.allocation || [];
  const meta = data?.measurement?.meta;
  const google = data?.measurement?.googleAds;

  return (
    <div style={{ color: "#e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>💰 Budget Pub</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.65 }}>Agent <b>advisory</b> — recommande, ne dépense rien. Plafond réparti par bien selon la commission OTA évitée (RM-08).</p>
        </div>
        <label style={{ fontSize: 13 }}>Plafond mensuel&nbsp;
          <select value={budget} onChange={(e) => setBudget(+e.target.value)} style={{ background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 8, padding: "6px 10px" }}>
            {[300, 450, 600, 900, 1200].map((v) => <option key={v} value={v}>{v} €</option>)}
          </select>
        </label>
      </div>

      {loading ? <div style={{ opacity: 0.6 }}>Chargement…</div> : err ? <div style={{ color: "#ef4444" }}>{err}</div> : (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Vision budget par bien */}
          <div style={CARD}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Vision budget — {budget} €/mois</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr><th style={TH}>Bien</th><th style={TH}>CAC max / résa</th><th style={TH}>Budget / mois</th></tr></thead>
                <tbody>
                  {vb.map((a) => (
                    <tr key={a.id} style={{ borderTop: "1px solid #ffffff10", opacity: a.monthlyBudget > 0 ? 1 : 0.5 }}>
                      <td style={TD}>{a.nom}</td>
                      <td style={TD}>{a.cacCeiling} €</td>
                      <td style={{ ...TD, fontWeight: 700, color: a.monthlyBudget > 0 ? "#10b981" : "#64748b" }}>{a.monthlyBudget > 0 ? a.monthlyBudget + " €" : "— (trop mince)"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Connexions + santé mesure */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
            <div style={CARD}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>📘 Meta Ads</h3>
                <HealthPill h={meta?.health} />
              </div>
              <p style={{ fontSize: 12, opacity: 0.65, margin: "8px 0 0" }}>{meta?.available ? (meta.health?.message || "") : (meta?.note || "Non configuré")}</p>
            </div>
            <div style={CARD}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>🔍 Google Ads</h3>
                {google?.ok ? <HealthPill h={google?.health} /> : null}
              </div>
              <p style={{ fontSize: 12, opacity: 0.65, margin: "8px 0 10px" }}>
                {google?.ok ? (google.health?.message || "") : (typeof google?.error === "string" ? google.error : "Non connecté")}
                {google?.hint ? " — " + google.hint : ""}
              </p>
              {!google?.ok && !google?.connected && (
                <button onClick={connectGoogleAds} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Connecter Google Ads</button>
              )}
            </div>
          </div>

          {/* Arbitrage Meta par ad set (quand des perfs existent) */}
          {meta?.available && meta.adsets?.length > 0 && (
            <div style={CARD}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Arbitrage Meta (30 j)</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr><th style={TH}>Ad set</th><th style={TH}>Dépense</th><th style={TH}>CAC réel</th><th style={TH}>Reco</th></tr></thead>
                  <tbody>
                    {meta.adsets.map((a, i) => {
                      const [c, t] = VERDICT[a.verdict] || ["#64748b", a.verdict];
                      return (
                        <tr key={i} style={{ borderTop: "1px solid #ffffff10" }}>
                          <td style={TD}>{a.adset}</td>
                          <td style={TD}>{a.spend} €</td>
                          <td style={TD}>{a.realCac != null ? a.realCac + " €" : "—"}</td>
                          <td style={{ ...TD, color: c, fontWeight: 700 }}>{t}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p style={{ fontSize: 11, opacity: 0.5, margin: 0 }}>{data?.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
