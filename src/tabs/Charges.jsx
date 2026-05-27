/**
 * Charges — analyse charges réelles vs fixes par bien.
 * Extrait de src/App.jsx (refactor 2026, batch B/3).
 */
import { ResponsiveContainer, ComposedChart, BarChart, Bar, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { MOIS, TT, fmt, fmtK } from "../App.jsx";
import { sumN } from "../utils/calculations.js";
import { useAppData } from "../AppDataContext.jsx";

export default function Charges() {
  const { biens, n, mob } = useAppData();
  // Charges réelles dérivées de revenus - cashflow
  const chargesByBien = biens.map(b => {
    const monthlyCharges = b.revenus.map((rev, i) => Math.max(rev - (b.cashflow[i] || 0), 0));
    const chargesYTD = monthlyCharges.slice(0, n).reduce((s, v) => s + v, 0);
    const chargesFixesAnnuel = b.charges * 12;
    const chargesFixesYTD = b.charges * n;
    const revenusYTD = sumN(b.revenus, n);
    const cashflowYTD = sumN(b.cashflow, n);
    const ratio = revenusYTD > 0 ? (chargesYTD / revenusYTD) * 100 : (chargesYTD > 0 ? 100 : 0);
    return {
      ...b, monthlyCharges, chargesYTD, chargesFixesAnnuel, chargesFixesYTD, revenusYTD, cashflowYTD, ratio
    };
  });

  // KPIs globaux
  const chargesYTDTotal = chargesByBien.reduce((s, b) => s + b.chargesYTD, 0);
  const revenusYTDTotal = chargesByBien.reduce((s, b) => s + b.revenusYTD, 0);
  const chargesFixesAnnuelTotal = chargesByBien.reduce((s, b) => s + b.chargesFixesAnnuel, 0);
  const cashflowYTDTotal = chargesByBien.reduce((s, b) => s + b.cashflowYTD, 0);
  const ratioGlobal = revenusYTDTotal > 0 ? (chargesYTDTotal / revenusYTDTotal) * 100 : 0;

  // Pie data
  const PIE_COLORS = ["#0ea5e9", "#FF5A5F", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4"];
  const pieData = chargesByBien
    .map(b => ({ name: b.nom.replace("Villa ", "").replace("T2 ", ""), value: Math.round(b.chargesYTD), emoji: b.emoji }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Monthly chart (réel vs fixe théorique)
  const totalFixeMensuel = chargesByBien.reduce((s, b) => s + b.charges, 0);
  const monthlyData = MOIS.map((mois, i) => {
    const real = chargesByBien.reduce((s, b) => s + (b.monthlyCharges[i] || 0), 0);
    return { mois, reel: i < n ? Math.round(real) : null, fixe: totalFixeMensuel };
  });

  // Alertes auto
  const alerts = [];
  chargesByBien.forEach(b => {
    const monthsOver = b.monthlyCharges.slice(0, n).filter((c, i) => c > (b.revenus[i] || 0) && (b.revenus[i] || 0) > 0).length;
    if (monthsOver >= 3) {
      alerts.push({
        sev: "danger",
        emoji: b.emoji,
        bien: b.nom,
        msg: `Charges supérieures aux revenus ${monthsOver} mois sur ${n}`,
      });
    }
    if (b.ratio > 90 && b.revenusYTD > 1000) {
      alerts.push({
        sev: "warning",
        emoji: b.emoji,
        bien: b.nom,
        msg: `Taux de charges ${b.ratio.toFixed(0)}% — marge très faible`,
      });
    }
    // Pic mensuel : un mois > 1.5x charges fixes
    b.monthlyCharges.slice(0, n).forEach((c, i) => {
      if (c > b.charges * 1.5 && c > 500) {
        alerts.push({
          sev: "info",
          emoji: b.emoji,
          bien: b.nom,
          msg: `Pic de charges en ${MOIS[i]} : ${Math.round(c)}€ (théorique ${b.charges}€)`,
        });
      }
    });
  });

  const sevColors = { danger: "#ef4444", warning: "#f59e0b", info: "#0ea5e9" };
  const sevBg = { danger: "rgba(239,68,68,0.07)", warning: "rgba(245,158,11,0.07)", info: "rgba(14,165,233,0.07)" };

  return (
    <div>
      {/* KPIs globaux */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 130, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 11, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Charges YTD réelles</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#ef4444", fontFamily: "var(--font-mono)" }}>{fmt(chargesYTDTotal)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{ratioGlobal.toFixed(1)}% des revenus</div>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 11, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Charges fixes annuelles</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#f59e0b", fontFamily: "var(--font-mono)" }}>{fmt(chargesFixesAnnuelTotal)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{fmt(totalFixeMensuel)}/mois théorique</div>
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

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "2fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>
            Charges mensuelles réelles vs théoriques fixes
          </div>
          <ResponsiveContainer width="100%" height={mob ? 160 : 200}>
            <ComposedChart data={monthlyData} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mois" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip contentStyle={TT} formatter={(v) => v != null ? [fmt(v)] : ["—"]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Bar dataKey="reel" name="Charges réelles" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="fixe" name="Charges fixes théoriques" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>
            Répartition des charges YTD
          </div>
          <ResponsiveContainer width="100%" height={mob ? 160 : 200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={mob ? 35 : 45}
                outerRadius={mob ? 65 : 80}
                paddingAngle={2}
              >
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

      {/* Tableau ratio charges/revenus */}
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
              {chargesByBien
                .slice()
                .sort((a, b) => b.ratio - a.ratio)
                .map(b => {
                  const ratioColor = b.ratio < 60 ? "#10b981" : b.ratio < 90 ? "#f59e0b" : "#ef4444";
                  const tl = { court: "Court", long: "Long", moyen: "Moyen" };
                  return (
                    <tr key={b.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "9px 10px", fontWeight: 600, color: "#e2e8f0", fontSize: 11 }}>
                        {b.emoji} {b.nom}
                      </td>
                      <td style={{ padding: "9px 10px", fontSize: 10, color: "#64748b" }}>{tl[b.type]}</td>
                      <td style={{ padding: "9px 10px", color: "#0ea5e9", fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmt(b.revenusYTD)}</td>
                      <td style={{ padding: "9px 10px", color: "#ef4444", fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmt(b.chargesYTD)}</td>
                      <td style={{ padding: "9px 10px", color: b.cashflowYTD >= 0 ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>
                        {b.cashflowYTD >= 0 ? "+" : ""}{fmt(b.cashflowYTD)}
                      </td>
                      <td style={{ padding: "9px 10px", color: ratioColor, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700 }}>
                        {b.ratio.toFixed(0)}%
                      </td>
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
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>
        🚨 Alertes ({alerts.length})
      </div>
      {alerts.length === 0 ? (
        <div style={{ padding: 18, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 11, textAlign: "center", fontSize: 13, color: "#10b981" }}>
          ✓ Aucune anomalie détectée
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {alerts.slice(0, 8).map((a, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: sevBg[a.sev],
              border: `1px solid ${sevColors[a.sev]}33`,
              borderLeft: `3px solid ${sevColors[a.sev]}`,
              borderRadius: 9,
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
          {alerts.length > 8 && (
            <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", padding: 6 }}>
              + {alerts.length - 8} autres alertes
            </div>
          )}
        </div>
      )}
    </div>
  );
}
