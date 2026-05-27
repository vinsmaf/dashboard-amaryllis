/**
 * Previsionnel — objectif annuel + projection annuelle + projection N+1.
 * Extrait de src/App.jsx (refactor 2026, batch B/3).
 */
import { useState } from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { MOIS, TT, HIST_SEED, fmt, fmtK } from "../App.jsx";
import { sumN, avgN } from "../utils/calculations.js";
import { useAppData } from "../AppDataContext.jsx";

export default function Previsionnel() {
  const { biens, n, mob, hist = HIST_SEED } = useAppData();
  const [objectif, setObjectif] = useState(200000);
  const [scenario, setScenario] = useState("realiste");

  const cy = new Date().getFullYear();
  const prevYear = cy - 1;
  const prevYear2 = cy - 2;
  const totalPrevYear  = (hist[prevYear]?.total  || []).reduce((s, v) => s + v, 0);
  const totalPrevYear2 = (hist[prevYear2]?.total || []).reduce((s, v) => s + v, 0);

  const poidsAnnuels = MOIS.map((_, m) =>
    [cy - 3, cy - 2, cy - 1].map(y => hist[y]?.total[m] || 0).reduce((s, v) => s + v, 0) / 3
  );
  const totalPoids = poidsAnnuels.reduce((s, v) => s + v, 0);
  const poidsNorm = poidsAnnuels.map(v => v / totalPoids);
  const ytd = biens.reduce((s, b) => s + sumN(b.revenus, n), 0);
  const poidsYTD = poidsNorm.slice(0, n).reduce((s, v) => s + v, 0);
  const projBase = poidsYTD > 0 ? ytd / poidsYTD : ytd * (12 / n);
  const facteurs = { pessimiste: 0.85, realiste: 1, optimiste: 1.18 };
  const projAnnuelle = projBase * facteurs[scenario];
  const projMensuelle = MOIS.map((_, m) =>
    m < n ? biens.reduce((s, b) => s + (b.revenus[m] || 0), 0) : Math.round(projAnnuelle * poidsNorm[m])
  );
  const gap = objectif - projAnnuelle;
  const progressPct = Math.min((projAnnuelle / objectif) * 100, 100).toFixed(1);
  const chartData = MOIS.map((_, m) => ({
    mois: MOIS[m],
    reel: m < n ? projMensuelle[m] : null,
    proj: m >= n ? projMensuelle[m] : null,
    obj: Math.round(objectif * poidsNorm[m]),
    hPrev: hist[prevYear]?.total[m] || 0,
  }));

  const recoBiens = biens.filter(b => b.type !== "long").map(b => {
    const tot25 = hist[prevYear]?.[b.id]?.reduce((s, v) => s + v, 0) || 0;
    const tot25all = biens.reduce((s, bb) => s + (hist[prevYear]?.[bb.id]?.reduce((ss, v) => ss + v, 0) || 0), 0);
    const part = tot25all > 0 ? tot25 / tot25all : 0;
    const ytdBien = sumN(b.revenus, n);
    const adrActuel = avgN(b.adr, n) || 0;
    const occMoy = Math.min(avgN(b.occ, n) / 100, 0.65) || 0.5;
    const nuitsRestantes = Math.round(31 * (12 - n) * occMoy);
    const objectifBien = objectif * part;
    const gapBien = objectifBien - ytdBien;
    const adrNecessaire = nuitsRestantes > 0 ? Math.round(gapBien / nuitsRestantes) : 0;
    const hausseNecessaire = adrActuel > 0 ? Math.round(((adrNecessaire / adrActuel) - 1) * 100) : 0;
    return { ...b, ytdBien, objectifBien, adrActuel, adrNecessaire, hausseNecessaire };
  });

  const scs = { pessimiste: { l: "Pessimiste", c: "#ef4444", d: "-15%" }, realiste: { l: "Réaliste", c: "#0ea5e9", d: "Tendance" }, optimiste: { l: "Optimiste", c: "#10b981", d: "+18%" } };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, marginBottom: 10 }}>🎯 Objectif annuel 2026</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <input type="range" min={150000} max={300000} step={5000} value={objectif} onChange={(e) => setObjectif(Number(e.target.value))} style={{ flex: 1, accentColor: "#0ea5e9" }} />
            <input type="number" value={objectif} onChange={(e) => setObjectif(Number(e.target.value))} style={{ width: 95, padding: "5px 7px", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#0ea5e9", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", textAlign: "right" }} />
            <span style={{ color: "#64748b", fontSize: 12 }}>€</span>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#64748b" }}>
            {totalPrevYear  > 0 && <span>+{((objectif / totalPrevYear  - 1) * 100).toFixed(0)}% vs {prevYear}</span>}
            {totalPrevYear2 > 0 && <span>+{((objectif / totalPrevYear2 - 1) * 100).toFixed(0)}% vs {prevYear2}</span>}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, marginBottom: 10 }}>📊 Scénario</div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(scs).map(([k, v]) => (
              <button key={k} onClick={() => setScenario(k)} style={{ flex: 1, padding: "9px 5px", borderRadius: 8, border: `1px solid ${v.c}44`, background: scenario === k ? v.c + "22" : "none", color: scenario === k ? v.c : "#64748b", cursor: "pointer", fontSize: 10, fontWeight: 600, textAlign: "center" }}>
                <div style={{ fontSize: 11, marginBottom: 1 }}>{v.l}</div>
                <div style={{ fontSize: 9, opacity: 0.7 }}>{v.d}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 9, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 110, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>YTD réel</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-mono)" }}>{fmt(ytd)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{(ytd / objectif * 100).toFixed(1)}% de l'objectif</div>
        </div>
        <div style={{ flex: 1, minWidth: 110, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Projection {scenario}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-mono)" }}>{fmt(Math.round(projAnnuelle))}</div>
          <div style={{ fontSize: 11, color: gap <= 0 ? "#10b981" : "#ef4444", marginTop: 2 }}>
            {gap > 0 ? `Manque ${fmt(Math.round(gap))}` : `+${fmt(Math.round(-gap))} au-dessus`}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Progression objectif</div>
          <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: parseFloat(progressPct) >= 100 ? "#10b981" : parseFloat(progressPct) >= 80 ? "#f59e0b" : "#0ea5e9", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-mono)" }}>{progressPct}%</div>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, fontWeight: 600 }}>Projection mensuelle vs objectif vs {prevYear}</div>
        <ResponsiveContainer width="100%" height={mob ? 150 : 200}>
          <ComposedChart data={chartData} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="mois" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
            <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
            <Bar dataKey="reel" name="Réalisé" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="proj" name="Projeté" fill="#0ea5e9" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
            <Bar dataKey="hPrev" name={String(prevYear)} fill="#334155" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="obj" name="Objectif" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>Ajustements de prix recommandés</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
        {recoBiens.map((b, i) => {
          const ok = b.hausseNecessaire <= 0;
          const warn = b.hausseNecessaire > 30;
          const c = ok ? "#10b981" : warn ? "#ef4444" : "#f59e0b";
          return (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${c}33`, borderLeft: `3px solid ${c}`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 16 }}>{b.emoji}</span>
              <div style={{ flex: 1, minWidth: 90 }}>
                <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 12 }}>{b.nom}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Objectif : {fmt(Math.round(b.objectifBien))}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>ADR actuel</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{Math.round(b.adrActuel)}€</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>ADR cible</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: "var(--font-mono)" }}>{b.adrNecessaire > 0 ? b.adrNecessaire + "€" : "OK"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>Hausse</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: "var(--font-mono)" }}>
                  {ok ? "✓ OK" : b.hausseNecessaire > 0 ? `+${b.hausseNecessaire}%` : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Projection nette par bien */}
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>💶 Projection nette annuelle par bien ({scenario})</div>
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden", marginBottom: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              {["Bien", "Proj. revenus", "Charges fixes", "Net projeté", "Ratio charges"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {biens.map(b => {
              const part = ytd > 0 ? (sumN(b.revenus, n) / ytd) : (1 / biens.length);
              const projBien = Math.round(projAnnuelle * part);
              const chargesFixes = b.charges * 12;
              const net = projBien - chargesFixes;
              const ratio = projBien > 0 ? (chargesFixes / projBien * 100).toFixed(0) : "—";
              const c = net >= 0 ? "#10b981" : "#ef4444";
              return (
                <tr key={b.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "9px 10px", fontSize: 11 }}>{b.emoji} {b.nom.replace("Villa ", "").replace("T2 ", "")}</td>
                  <td style={{ padding: "9px 10px", color: "#0ea5e9", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>{fmt(projBien)}</td>
                  <td style={{ padding: "9px 10px", color: "#ef4444", fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmt(chargesFixes)}</td>
                  <td style={{ padding: "9px 10px", color: c, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{net >= 0 ? "+" : ""}{fmt(net)}</td>
                  <td style={{ padding: "9px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(parseInt(ratio), 100)}%`, background: parseInt(ratio) > 80 ? "#ef4444" : parseInt(ratio) > 50 ? "#f59e0b" : "#10b981" }} />
                      </div>
                      <span style={{ fontSize: 9, color: "#64748b", fontFamily: "var(--font-mono)" }}>{ratio}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
              <td style={{ padding: "10px", fontWeight: 700, color: "#e2e8f0", fontSize: 11 }}>TOTAL</td>
              <td style={{ padding: "10px", color: "#0ea5e9", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{fmt(Math.round(projAnnuelle))}</td>
              <td style={{ padding: "10px", color: "#ef4444", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{fmt(biens.reduce((s, b) => s + b.charges * 12, 0))}</td>
              <td style={{ padding: "10px", color: "#10b981", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 800 }}>
                {(() => { const t = Math.round(projAnnuelle) - biens.reduce((s, b) => s + b.charges * 12, 0); return (t >= 0 ? "+" : "") + fmt(t); })()}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Projection N+1 (2027) ── */}
      {(() => {
        // CAGR dynamique basé sur hist
        const histYears = Object.keys(hist).map(Number).filter(y => (hist[y]?.total || []).some(v => v > 0)).sort();
        const firstHistYear = histYears[0] || (cy - 4);
        const revFirst = (hist[firstHistYear]?.total || []).reduce((s, v) => s + v, 0);
        const nbAns = prevYear - firstHistYear;
        const deltaLinRaw = nbAns > 0 && totalPrevYear > 0 ? (totalPrevYear - revFirst) / nbAns : 10000;
        const proj26 = Math.round(projAnnuelle);
        const proj27_real = Math.round(proj26 + deltaLinRaw);
        const proj27_pess = Math.round(proj26 * 1.03);
        const proj27_opt  = Math.round(proj26 * 1.18);
        const nextYear = cy + 1;
        const chartData27 = MOIS.map((_, m) => ({
          mois: MOIS[m],
          [String(prevYear)]: hist[prevYear]?.total[m] || 0,
          [`${cy} proj.`]: Math.round(projAnnuelle * poidsNorm[m]),
          [`${nextYear} réaliste`]: Math.round(proj27_real * poidsNorm[m]),
        }));
        const chargesAnnuelles2027 = biens.reduce((s, b) => s + b.charges * 12, 0) * 1.03;
        const cf27 = proj27_real - chargesAnnuelles2027;
        return (
          <div style={{ marginTop: 24, background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 14, padding: mob ? 14 : 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#a855f7", marginBottom: 4 }}>🔮 Projection {nextYear} — N+1</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
              Basée sur la tendance {firstHistYear}–{cy} (+{(deltaLinRaw/1000).toFixed(0)}k€/an en moyenne) et la saisonnalité historique.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Pessimiste +3%", value: proj27_pess, color: "#ef4444" },
                { label: "Réaliste (tendance)", value: proj27_real, color: "#a855f7" },
                { label: "Optimiste +18%", value: proj27_opt, color: "#10b981" },
              ].map(s => (
                <div key={s.label} style={{ background: `${s.color}11`, border: `1px solid ${s.color}33`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "var(--font-mono)" }}>{fmtK(s.value)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 120, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>CF projeté 2027</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: cf27 >= 0 ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)" }}>{cf27 >= 0 ? "+" : ""}{fmtK(cf27)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 120, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>CAGR {firstHistYear}→{nextYear}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#a855f7", fontFamily: "var(--font-mono)" }}>
                  {revFirst > 0 && nextYear > firstHistYear
                    ? (Math.pow(proj27_real / revFirst, 1 / (nextYear - firstHistYear)) - 1).toFixed(1).replace(".", ",") + " %/an"
                    : "—"}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 120, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Revenus cumulés {firstHistYear}-{nextYear}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b", fontFamily: "var(--font-mono)" }}>
                  {fmtK(histYears.reduce((s, y) => s + (hist[y]?.total || []).reduce((a, v) => a + v, 0), 0) + proj26 + proj27_real)}
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={mob ? 130 : 165}>
              <ComposedChart data={chartData27}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mois" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
                <Legend wrapperStyle={{ fontSize: 9, color: "#94a3b8" }} />
                <Bar dataKey={String(prevYear)} fill="rgba(14,165,233,0.25)" name={`${prevYear} réel`} radius={[2,2,0,0]} />
                <Line type="monotone" dataKey={`${cy} proj.`} stroke="#0ea5e9" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey={`${nextYear} réaliste`} stroke="#a855f7" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      })()}
    </div>
  );
}
