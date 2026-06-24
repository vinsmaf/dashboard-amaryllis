/**
 * Charges — analyse charges réelles YTD + budget par poste.
 * Vue unifiée : sous-onglets "Réel YTD" et "Budget par poste".
 */
import { useState } from "react";
import { ResponsiveContainer, ComposedChart, BarChart, Bar, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { MOIS, TT, CHARGES_2025, POSTES_CHARGES, fmt, fmtK } from "../App.jsx";
import { sumN } from "../utils/calculations.js";
import { useAppData } from "../AppDataContext.jsx";

const SUB_TAB_STYLE = (active) => ({
  padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer",
  fontSize: 12, fontWeight: 600,
  background: active ? "#ef4444" : "rgba(255,255,255,0.06)",
  color: active ? "#fff" : "#94a3b8",
});

export default function Charges() {
  const { biens, n, mob } = useAppData();
  const [sub, setSub] = useState("reel");

  // ── Données réelles YTD ─────────────────────────────────────────────────
  // Charges = budget CHARGES_2025 proratisé (seule source fiable — rev-cashflow est trop volatile)
  const chargesByBien = biens.map(b => {
    const budgetAnnuel = Object.values(CHARGES_2025[b.id] || {}).reduce((s, v) => s + v, 0);
    const chargesYTD   = Math.round(budgetAnnuel / 12 * n);
    const revenusYTD   = sumN(b.revenus, n);
    const cashflowYTD  = sumN(b.cashflow, n);
    const ratio        = revenusYTD > 0 ? (chargesYTD / revenusYTD) * 100 : (chargesYTD > 0 ? 100 : 0);
    return { ...b, budgetAnnuel, chargesYTD, revenusYTD, cashflowYTD, ratio };
  });

  const chargesYTDTotal    = chargesByBien.reduce((s, b) => s + b.chargesYTD, 0);
  const revenusYTDTotal    = chargesByBien.reduce((s, b) => s + b.revenusYTD, 0);
  const cashflowYTDTotal   = chargesByBien.reduce((s, b) => s + b.cashflowYTD, 0);
  const budgetAnnuelTotal  = chargesByBien.reduce((s, b) => s + b.budgetAnnuel, 0);
  const ratioGlobal        = revenusYTDTotal > 0 ? (chargesYTDTotal / revenusYTDTotal) * 100 : 0;
  const budgetMensuel      = Math.round(budgetAnnuelTotal / 12);

  const PIE_COLORS = ["#0ea5e9", "#FF5A5F", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4"];
  const pieData = chargesByBien
    .map(b => ({ name: b.nom.replace("Villa ", "").replace("T2 ", ""), value: b.chargesYTD, emoji: b.emoji }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Graphe mensuel : cashflow réel par mois + ligne budget charges
  const monthlyData = MOIS.map((mois, i) => {
    const cf = chargesByBien.reduce((s, b) => s + (b.cashflow[i] || 0), 0);
    return { mois, cashflow: i < n ? Math.round(cf) : null, budget: budgetMensuel };
  });

  const alerts = [];
  chargesByBien.forEach(b => {
    const monthsDeficit = b.cashflow.slice(0, n).filter(v => v < 0).length;
    if (monthsDeficit >= 3) alerts.push({ sev: "danger", emoji: b.emoji, bien: b.nom, msg: `Cashflow négatif ${monthsDeficit} mois sur ${n}` });
    if (b.ratio > 90 && b.revenusYTD > 1000) alerts.push({ sev: "warning", emoji: b.emoji, bien: b.nom, msg: `Taux de charges budget ${b.ratio.toFixed(0)}% — marge très faible` });
    if (cashflowYTDTotal < 0) alerts.push({ sev: "danger", emoji: "⚠️", bien: "Global", msg: `Cashflow global négatif YTD : ${fmt(cashflowYTDTotal)}` });
  });
  const seen = new Set();
  const alertsUniq = alerts.filter(a => { const k = a.bien + a.msg; return seen.has(k) ? false : (seen.add(k), true); });
  const sevColors = { danger: "#ef4444", warning: "#f59e0b", info: "#0ea5e9" };
  const sevBg    = { danger: "rgba(239,68,68,0.07)", warning: "rgba(245,158,11,0.07)", info: "rgba(14,165,233,0.07)" };

  // ── Données budget par poste (CHARGES_2025 statiques) ───────────────────
  const chargeTotals = {};
  POSTES_CHARGES.forEach(p => {
    chargeTotals[p.k] = biens.reduce((s, b) => s + ((CHARGES_2025[b.id] || {})[p.k] || 0), 0);
  });
  const totalCharges2025 = Object.values(chargeTotals).reduce((s, v) => s + v, 0);
  const chargeBreakdown  = POSTES_CHARGES.map(p => ({ ...p, value: chargeTotals[p.k] })).filter(d => d.value > 0);
  const bienChargeStack  = biens.map(b => {
    const c = CHARGES_2025[b.id] || {};
    const row = { nom: b.nom.replace("Villa ", "").replace("T2 ", "") };
    POSTES_CHARGES.forEach(p => { row[p.l] = c[p.k] || 0; });
    return row;
  });

  return (
    <div>
      {/* Sous-onglets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button style={SUB_TAB_STYLE(sub === "reel")}   onClick={() => setSub("reel")}>📈 Réel YTD</button>
        <button style={SUB_TAB_STYLE(sub === "budget")} onClick={() => setSub("budget")}>📋 Budget par poste</button>
      </div>

      {/* ── Vue 1 : Réel YTD ──────────────────────────────────────────────── */}
      {sub === "reel" && (
        <div>
          {/* KPIs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 130, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Budget charges YTD</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#ef4444", fontFamily: "var(--font-mono)" }}>{fmt(chargesYTDTotal)}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{ratioGlobal.toFixed(1)}% des revenus</div>
            </div>
            <div style={{ flex: 1, minWidth: 130, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Budget charges annuel</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#f59e0b", fontFamily: "var(--font-mono)" }}>{fmt(budgetAnnuelTotal)}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{fmt(budgetMensuel)}/mois</div>
            </div>
            <div style={{ flex: 1, minWidth: 130, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Cashflow YTD</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: cashflowYTDTotal >= 0 ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)" }}>{fmt(cashflowYTDTotal)}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Disponible après charges</div>
            </div>
            <div style={{ flex: 1, minWidth: 130, background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Revenus YTD</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#0ea5e9", fontFamily: "var(--font-mono)" }}>{fmt(revenusYTDTotal)}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Sur {n} mois</div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "2fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Cashflow mensuel vs budget charges</div>
              <ResponsiveContainer width="100%" height={mob ? 160 : 200}>
                <ComposedChart data={monthlyData} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="mois" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Tooltip contentStyle={TT} formatter={(v) => v != null ? [fmt(v)] : ["—"]} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                  <Bar dataKey="cashflow" name="Cashflow mensuel" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((d, i) => <Cell key={i} fill={d.cashflow == null ? "#1e293b" : d.cashflow >= 0 ? "#10b981" : "#ef4444"} />)}
                  </Bar>
                  <Line type="monotone" dataKey="budget" name="Budget charges/mois" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Répartition des charges YTD</div>
              <ResponsiveContainer width="100%" height={mob ? 160 : 200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={mob ? 35 : 45} outerRadius={mob ? 65 : 80} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#94a3b8" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], display: "inline-block" }} />
                      {d.emoji} {d.name}
                    </span>
                    <span style={{ color: "#64748b", fontFamily: "var(--font-mono)" }}>{fmtK(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tableau ratio */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              Ratio coût par bien — vert &lt; 60%, orange 60-90%, rouge &gt; 90%
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Bien", "Type", "Revenus YTD", "Charges YTD", "Cashflow", "Ratio", "Statut"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chargesByBien.slice().sort((a, b) => b.ratio - a.ratio).map(b => {
                    const ratioColor = b.ratio < 60 ? "#10b981" : b.ratio < 90 ? "#f59e0b" : "#ef4444";
                    const tl = { court: "Court", long: "Long", moyen: "Moyen" };
                    return (
                      <tr key={b.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "9px 10px", fontWeight: 600, color: "#e2e8f0", fontSize: 11 }}>{b.emoji} {b.nom}</td>
                        <td style={{ padding: "9px 10px", fontSize: 10, color: "#64748b" }}>{tl[b.type]}</td>
                        <td style={{ padding: "9px 10px", color: "#0ea5e9", fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmt(b.revenusYTD)}</td>
                        <td style={{ padding: "9px 10px", color: "#ef4444", fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmt(b.chargesYTD)}</td>
                        <td style={{ padding: "9px 10px", color: b.cashflowYTD >= 0 ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>
                          {b.cashflowYTD >= 0 ? "+" : ""}{fmt(b.cashflowYTD)}
                        </td>
                        <td style={{ padding: "9px 10px", color: ratioColor, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700 }}>{b.ratio.toFixed(0)}%</td>
                        <td style={{ padding: "9px 10px" }}>
                          <div style={{ display: "inline-block", width: 50, height: 5, background: "#1e293b", borderRadius: 3, overflow: "hidden", verticalAlign: "middle" }}>
                            <div style={{ height: "100%", width: `${Math.min(b.ratio, 100)}%`, background: ratioColor }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertes */}
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>🚨 Alertes ({alerts.length})</div>
          {alertsUniq.length === 0 ? (
            <div style={{ padding: 18, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 11, textAlign: "center", fontSize: 13, color: "#10b981" }}>
              ✓ Aucune anomalie détectée
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {alertsUniq.slice(0, 8).map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  background: sevBg[a.sev], border: `1px solid ${sevColors[a.sev]}33`,
                  borderLeft: `3px solid ${sevColors[a.sev]}`, borderRadius: 9,
                }}>
                  <span style={{ fontSize: 16 }}>{a.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{a.bien}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.msg}</div>
                  </div>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 8, background: sevColors[a.sev] + "22", color: sevColors[a.sev], fontWeight: 600, textTransform: "uppercase" }}>
                    {a.sev === "danger" ? "Critique" : a.sev === "warning" ? "À surveiller" : "Info"}
                  </span>
                </div>
              ))}
              {alertsUniq.length > 8 && <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", padding: 6 }}>+ {alertsUniq.length - 8} autres alertes</div>}
            </div>
          )}
        </div>
      )}

      {/* ── Vue 2 : Budget par poste ──────────────────────────────────────── */}
      {sub === "budget" && (
        <div>
          {/* KPI total */}
          <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Total charges 2025 (annuel)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444", fontFamily: "var(--font-mono)" }}>{fmt(totalCharges2025)}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Soit {fmt(Math.round(totalCharges2025 / 12))}/mois</div>
          </div>

          {/* Pie par poste + Stacked bar par bien */}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Répartition par poste</div>
              <ResponsiveContainer width="100%" height={mob ? 180 : 220}>
                <PieChart>
                  <Pie data={chargeBreakdown} dataKey="value" nameKey="l" cx="50%" cy="50%"
                    innerRadius={mob ? 35 : 50} outerRadius={mob ? 70 : 90} paddingAngle={1}>
                    {chargeBreakdown.map((d, i) => <Cell key={i} fill={d.c} />)}
                  </Pie>
                  <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4, maxHeight: 110, overflowY: "auto" }}>
                {chargeBreakdown.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#94a3b8" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: d.c, display: "inline-block" }} />
                      {d.l}
                    </span>
                    <span style={{ color: "#64748b", fontFamily: "var(--font-mono)" }}>{fmtK(d.value)} ({totalCharges2025 > 0 ? ((d.value / totalCharges2025) * 100).toFixed(0) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Charges empilées par bien</div>
              <ResponsiveContainer width="100%" height={mob ? 200 : 280}>
                <BarChart data={bienChargeStack} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <YAxis type="category" dataKey="nom" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
                  {POSTES_CHARGES.map(p => <Bar key={p.k} dataKey={p.l} stackId="a" fill={p.c} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tableau matriciel */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              Détail par bien et poste — annuel 2025
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Bien</th>
                    {POSTES_CHARGES.map(p => (
                      <th key={p.k} style={{ padding: "8px 6px", textAlign: "right", fontSize: 9, color: p.c, fontWeight: 600 }}>{p.l}</th>
                    ))}
                    <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 9, color: "#e2e8f0", fontWeight: 600 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {biens.map(b => {
                    const c = CHARGES_2025[b.id] || {};
                    const tot = POSTES_CHARGES.reduce((s, p) => s + (c[p.k] || 0), 0);
                    return (
                      <tr key={b.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "9px 10px", fontWeight: 600, color: "#e2e8f0", fontSize: 11 }}>{b.emoji} {b.nom.replace("Villa ", "").replace("T2 ", "")}</td>
                        {POSTES_CHARGES.map(p => (
                          <td key={p.k} style={{ padding: "9px 6px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 10, color: (c[p.k] || 0) > 0 ? "#94a3b8" : "#334155" }}>
                            {c[p.k] > 0 ? fmtK(c[p.k]) : "—"}
                          </td>
                        ))}
                        <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "#ef4444", fontWeight: 700 }}>{fmtK(tot)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "10px 10px", fontWeight: 700, color: "#e2e8f0", fontSize: 11 }}>TOTAL</td>
                    {POSTES_CHARGES.map(p => (
                      <td key={p.k} style={{ padding: "10px 6px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: p.c, fontWeight: 700 }}>
                        {chargeTotals[p.k] > 0 ? fmtK(chargeTotals[p.k]) : "—"}
                      </td>
                    ))}
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "#ef4444", fontWeight: 800 }}>{fmtK(totalCharges2025)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
