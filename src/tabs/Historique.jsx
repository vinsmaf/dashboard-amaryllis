/**
 * Historique — analyse historique 2022→courant : annuel, mensuel, cumul, heatmap, canal, rentabilité.
 * Extrait de src/App.jsx (refactor 2026, batch B/3).
 */
import { useState } from "react";
import { ResponsiveContainer, BarChart, LineChart, ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie } from "recharts";
import { MOIS, SAISONNALITE, TT, ANNEE_COLORS, HIST_SEED, REVENUS_CANAL_2025, ComparatifContent, fmt, fmtK } from "../App.jsx";
import { sumN } from "../utils/calculations.js";
import { useAppData } from "../AppDataContext.jsx";

const CC = { airbnb: "#FF5A5F", booking: "#0ea5e9", direct: "#10b981", parking: "#a855f7" };

export default function Historique() {
  const { biens, n, mob, hist = HIST_SEED } = useAppData();
  const [selBien, setSelBien] = useState("all");
  const [selView, setSelView] = useState("annuel");

  const cy2 = new Date().getFullYear();
  const ytd26 = biens.reduce((s, b) => s + sumN(b.revenus, n), 0);
  const histYearsAll = Object.keys(hist).map(Number).filter(y => y < cy2 && (hist[y]?.total || []).some(v => v > 0)).sort();
  const annualTotals = [
    ...histYearsAll.map(y => ({ year: y, rev: (hist[y]?.total || []).reduce((s, v) => s + v, 0) })),
    { year: cy2, rev: ytd26, ytd: true },
  ];
  annualTotals.forEach((a, i) => {
    if (i > 0) a.evo = ((a.rev - annualTotals[i - 1].rev) / annualTotals[i - 1].rev * 100).toFixed(1);
  });

  const getMonthly = (id) => MOIS.map((_, m) => ({
    mois: MOIS[m],
    ...Object.fromEntries(histYearsAll.map(y => [y, ((id === "all" ? hist[y]?.total : hist[y]?.[id]) || [])[m] || 0])),
    [cy2]: id === "all" ? biens.reduce((s, b) => s + (b.revenus[m] || 0), 0) : (biens.find(b => b.id === id)?.revenus[m] || 0),
  }));

  const bienEvol = biens.map(b => ({
    nom: b.nom.replace("Villa ", "").replace("T2 ", ""),
    emoji: b.emoji,
    ...Object.fromEntries(histYearsAll.map(y => [y, hist[y]?.[b.id]?.reduce((s, v) => s + v, 0) || 0])),
    [cy2]: sumN(b.revenus, n),
  }));

  const prevYear3 = cy2 - 1;
  const cumulData = MOIS.map((_, m) => ({
    mois: MOIS[m],
    [prevYear3]: (hist[prevYear3]?.total || []).slice(0, m + 1).reduce((s, v) => s + v, 0),
    [cy2]: biens.reduce((s, b) => s + b.revenus.slice(0, m + 1).reduce((ss, v) => ss + (v || 0), 0), 0),
  }));

  // Cumul depuis première année connue
  const totalParAnnee = Object.fromEntries([
    ...histYearsAll.map(y => [y, (hist[y]?.total || []).reduce((s, v) => s + v, 0)]),
    [cy2, ytd26],
  ]);
  const totalDepuis2022 = Object.values(totalParAnnee).reduce((s, v) => s + v, 0);
  const cumulHistorique = [];
  let running = 0;
  [...histYearsAll, cy2].forEach(y => {
    running += totalParAnnee[y] || 0;
    cumulHistorique.push({ annee: String(y) + (y === cy2 ? " YTD" : ""), annuel: totalParAnnee[y] || 0, cumul: running });
  });
  const moyenneAnnuelle = histYearsAll.length > 0 ? histYearsAll.reduce((s, y) => s + (totalParAnnee[y] || 0), 0) / histYearsAll.length : ytd26;
  const proj2026Rev = n > 0 ? Math.round(ytd26 / n * 12) : 0;

  // Cashflow cumulé depuis 2022 — données réelles extraites du Google Sheets (revenus locatif YYYY)
  const cf26 = biens.reduce((s, b) => s + sumN(b.cashflow, n), 0);
  const proj2026Cf = n > 0 ? Math.round(cf26 / n * 12) : 0;
  const cashflowParAnnee = {
    2022: 38427,
    2023: 49076,
    2024: 61956,
    2025: 71814,
    2026: cf26,
  };
  const cashflowDepuis2022 = Object.values(cashflowParAnnee).reduce((s, v) => s + v, 0);
  const cashflowCumul = [];
  let runningCf = 0;
  [2022, 2023, 2024, 2025, 2026].forEach(y => {
    runningCf += cashflowParAnnee[y];
    cashflowCumul.push({ annee: String(y) + (y === 2026 ? " YTD" : ""), annuel: cashflowParAnnee[y], cumul: runningCf, ytd: y === 2026 });
  });
  const cfMoyenAnnuel = (cashflowParAnnee[2022] + cashflowParAnnee[2023] + cashflowParAnnee[2024] + cashflowParAnnee[2025]) / 4;

  return (
    <div>
      {/* Bandeau cumul depuis le début */}
      <div style={{ background: "linear-gradient(135deg,rgba(14,165,233,0.12),rgba(99,102,241,0.08))", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 14, padding: mob ? 14 : 18, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Revenus totaux depuis 2022
            </div>
            <div style={{ fontSize: mob ? 26 : 32, fontWeight: 800, color: "#0ea5e9", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
              {fmt(totalDepuis2022)}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
              Sur {Math.round((4 * 12 + n) / 12 * 10) / 10} années · Moyenne annuelle {fmt(Math.round(moyenneAnnuelle))}
            </div>
            <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4, fontWeight: 600 }}>
              ≈ {fmt(proj2026Rev)} projeté fin 2026 <span style={{ fontWeight: 400, color: "#64748b" }}>({n}m × 12)</span>
            </div>
          </div>
          <div style={{ flex: mob ? "1 1 100%" : 1, maxWidth: mob ? "100%" : 480, minWidth: 240 }}>
            <ResponsiveContainer width="100%" height={mob ? 90 : 100}>
              <BarChart data={cumulHistorique} barSize={mob ? 28 : 36}>
                <XAxis dataKey="annee" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={TT} formatter={(v, k) => [fmt(v), k === "cumul" ? "Cumul" : "Annuel"]} />
                <Bar dataKey="cumul" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                  {cumulHistorique.map((_, i) => (
                    <Cell key={i} fill={i === cumulHistorique.length - 1 ? "#f59e0b" : "#0ea5e9"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {cumulHistorique.map((c, i) => (
            <div key={i} style={{ flex: 1, minWidth: 90, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>Fin {c.annee}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-mono)" }}>{fmtK(c.cumul)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bandeau cumul CASHFLOW depuis le début */}
      <div style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(34,197,94,0.06))", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14, padding: mob ? 14 : 18, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Cashflow cumulé depuis 2022
            </div>
            <div style={{ fontSize: mob ? 26 : 32, fontWeight: 800, color: cashflowDepuis2022 >= 0 ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
              {cashflowDepuis2022 >= 0 ? "+" : ""}{fmt(cashflowDepuis2022)}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
              Moyenne annuelle {fmt(Math.round(cfMoyenAnnuel))} · {((cashflowDepuis2022 / totalDepuis2022) * 100).toFixed(0)}% des revenus
            </div>
            <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4, fontWeight: 600 }}>
              ≈ {fmt(proj2026Cf)} projeté fin 2026 <span style={{ fontWeight: 400, color: "#64748b" }}>({n}m × 12)</span>
            </div>
          </div>
          <div style={{ flex: mob ? "1 1 100%" : 1, maxWidth: mob ? "100%" : 480, minWidth: 240 }}>
            <ResponsiveContainer width="100%" height={mob ? 90 : 100}>
              <BarChart data={cashflowCumul} barSize={mob ? 28 : 36}>
                <XAxis dataKey="annee" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={TT} formatter={(v, k) => [fmt(v), k === "cumul" ? "Cumul CF" : "CF annuel"]} />
                <Bar dataKey="cumul" radius={[4, 4, 0, 0]}>
                  {cashflowCumul.map((c, i) => (
                    <Cell key={i} fill={c.ytd ? "#f59e0b" : "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {cashflowCumul.map((c, i) => (
            <div key={i} style={{ flex: 1, minWidth: 90, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>Fin {c.annee}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.cumul >= 0 ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)" }}>
                {c.cumul >= 0 ? "+" : ""}{fmtK(c.cumul)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards annuelles */}
      <div style={{ display: "flex", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
        {annualTotals.map(a => (
          <div key={a.year} style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.04)", border: `1px solid ${ANNEE_COLORS[a.year]}44`, borderTop: `3px solid ${ANNEE_COLORS[a.year]}`, borderRadius: 11, padding: "11px 12px" }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{a.year}{a.ytd ? " YTD" : ""}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-mono)" }}>{fmtK(a.rev)}</div>
            {a.evo && <div style={{ fontSize: 10, color: parseFloat(a.evo) >= 0 ? "#10b981" : "#ef4444", marginTop: 2 }}>{parseFloat(a.evo) >= 0 ? "+" : ""}{a.evo}%</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
        {[{ id: "annuel", l: "Annuel" }, { id: "mensuel", l: "Mensuel" }, { id: "cumul", l: `Cumul ${String(prevYear3).slice(-2)}/${String(cy2).slice(-2)}` }, { id: "heatmap", l: "🌡 Saisonnalité" }, { id: "canal", l: "🏷 Canal 2025" }, { id: "rentabilite", l: "💼 Rentabilité" }, { id: "vs2025", l: `📊 vs ${prevYear3}` }].map(v => (
          <button key={v.id} onClick={() => setSelView(v.id)} style={{ padding: "6px 13px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: selView === v.id ? "#0ea5e9" : "rgba(255,255,255,0.06)", color: selView === v.id ? "#fff" : "#94a3b8" }}>{v.l}</button>
        ))}
        {selView === "mensuel" && (
          <select value={selBien} onChange={(e) => setSelBien(e.target.value)} style={{ padding: "5px 9px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 11 }}>
            <option value="all">Tous</option>
            {biens.map(b => <option key={b.id} value={b.id}>{b.emoji} {b.nom}</option>)}
          </select>
        )}
      </div>

      {selView === "annuel" && (
        <>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Revenus annuels 2022→2026</div>
            <ResponsiveContainer width="100%" height={mob ? 130 : 170}>
              <BarChart data={annualTotals} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip contentStyle={TT} formatter={(v) => [fmt(v), "Revenus"]} />
                <Bar dataKey="rev" radius={[5, 5, 0, 0]}>
                  {annualTotals.map((a, i) => <Cell key={i} fill={ANNEE_COLORS[a.year]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Évolution par bien</div>
            <ResponsiveContainer width="100%" height={mob ? 160 : 210}>
              <BarChart data={bienEvol} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="nom" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
                <Legend wrapperStyle={{ fontSize: 9, color: "#94a3b8" }} />
                {[2022, 2023, 2024, 2025, 2026].map(y => (
                  <Bar key={y} dataKey={y} name={String(y)} fill={ANNEE_COLORS[y]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {selView === "mensuel" && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>
            Mensuel {selBien === "all" ? "tous biens" : biens.find(b => b.id === selBien)?.nom}
          </div>
          <ResponsiveContainer width="100%" height={mob ? 160 : 220}>
            <LineChart data={getMonthly(selBien)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mois" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              {[2022, 2023, 2024, 2025, 2026].map(y => (
                <Line
                  key={y} type="monotone" dataKey={y} name={String(y)} stroke={ANNEE_COLORS[y]}
                  strokeWidth={y === 2026 ? 2.5 : 1.5}
                  strokeDasharray={y === 2026 ? "5 3" : undefined}
                  dot={y === 2026 ? { fill: ANNEE_COLORS[y], r: 3 } : false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {selView === "cumul" && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Cumulés {prevYear3} vs {cy2}</div>
          <ResponsiveContainer width="100%" height={mob ? 150 : 200}>
            <LineChart data={cumulData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mois" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip contentStyle={TT} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Line type="monotone" dataKey={prevYear3} name={String(prevYear3)} stroke={ANNEE_COLORS[prevYear3] || "#64748b"} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey={cy2} name={String(cy2)} stroke={ANNEE_COLORS[cy2] || "#f59e0b"} strokeWidth={2.5} strokeDasharray="5 3" dot={{ fill: ANNEE_COLORS[cy2] || "#f59e0b", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MOIS.slice(0, n).map((_, m) => {
              const d = cumulData[m];
              const delta = d[cy2] - d[prevYear3];
              return (
                <div key={m} style={{ flex: 1, minWidth: 50, background: "rgba(255,255,255,0.03)", borderRadius: 7, padding: "6px 7px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>{MOIS[m]}</div>
                  <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: delta >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                    {delta >= 0 ? "+" : ""}{fmtK(delta)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selView === "heatmap" && (() => {
        const cellColor = (pct) => {
          if (pct >= 80) return "#10b981";
          if (pct >= 60) return "#22c55e";
          if (pct >= 40) return "#f59e0b";
          if (pct >= 20) return "#fb923c";
          return "#ef4444";
        };
        return (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, fontWeight: 600 }}>
              Heatmap de saisonnalité — taux d'occupation moyen historique
            </div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 540 }}>
                <div style={{ display: "grid", gridTemplateColumns: `100px repeat(12, 1fr)`, gap: 2, marginBottom: 3 }}>
                  <div />
                  {MOIS.map((m, i) => (
                    <div key={i} style={{ fontSize: 9, color: "#64748b", textAlign: "center", fontWeight: 600 }}>{m}</div>
                  ))}
                </div>
                {biens.map(b => {
                  const data = SAISONNALITE[b.id] || [];
                  return (
                    <div key={b.id} style={{ display: "grid", gridTemplateColumns: `100px repeat(12, 1fr)`, gap: 2, marginBottom: 2 }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4, paddingRight: 4 }}>
                        <span>{b.emoji}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.nom.replace("Villa ", "").replace("T2 ", "")}</span>
                      </div>
                      {data.map((pct, i) => (
                        <div
                          key={i}
                          title={`${MOIS[i]} : ${pct}% d'occupation`}
                          style={{
                            height: 28,
                            background: cellColor(pct),
                            opacity: 0.3 + (pct / 100) * 0.7,
                            borderRadius: 3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 9,
                            color: "#fff",
                            fontWeight: 600,
                          }}
                        >{pct}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: "#64748b" }}>Légende :</span>
                {[
                  { l: "0-20%", c: "#ef4444" },
                  { l: "20-40%", c: "#fb923c" },
                  { l: "40-60%", c: "#f59e0b" },
                  { l: "60-80%", c: "#22c55e" },
                  { l: "≥80%", c: "#10b981" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#94a3b8" }}>
                    <span style={{ width: 12, height: 12, borderRadius: 2, background: s.c, display: "inline-block" }} />
                    {s.l}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 8, fontSize: 11, color: "#cbd5e1" }}>
              💡 <strong>Lecture :</strong> les mois rouge/orange sont à privilégier pour les promotions et early bookings.
              Les mois verts sont à pricer haut. La basse saison martiniquaise reste mai-octobre selon les biens.
            </div>
          </div>
        );
      })()}

      {selView === "semaine" && (() => {
        // Analyse des réservations chargées par jour de semaine
        // À défaut de données réservation chargées, utilise une estimation des tendances connues
        const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
        // Estimation basée sur les pratiques locatives saisonnières en Martinique
        const occupationParJour = [
          { jour: "Lun", taux: 45, prix: 88 },
          { jour: "Mar", taux: 42, prix: 88 },
          { jour: "Mer", taux: 48, prix: 92 },
          { jour: "Jeu", taux: 55, prix: 95 },
          { jour: "Ven", taux: 78, prix: 115 },
          { jour: "Sam", taux: 82, prix: 125 },
          { jour: "Dim", taux: 70, prix: 110 },
        ];
        return (
          <div>
            <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 9, padding: "9px 13px", marginBottom: 14, fontSize: 11, color: "#cbd5e1" }}>
              ⚠ Vue indicative — basée sur les patterns courants en location saisonnière. Pour des chiffres exacts par bien, le détail jour-par-jour serait à extraire de tes iCal et reservations.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Taux d'occupation par jour de semaine</div>
                <ResponsiveContainer width="100%" height={mob ? 180 : 220}>
                  <BarChart data={occupationParJour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="jour" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v + "%"} />
                    <Tooltip contentStyle={TT} formatter={(v) => [v + "%", "Occupation"]} />
                    <Bar dataKey="taux" radius={[4, 4, 0, 0]}>
                      {occupationParJour.map((d, i) => (
                        <Cell key={i} fill={d.taux >= 70 ? "#10b981" : d.taux >= 50 ? "#f59e0b" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>ADR estimé par jour de semaine</div>
                <ResponsiveContainer width="100%" height={mob ? 180 : 220}>
                  <BarChart data={occupationParJour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="jour" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v + "€"} />
                    <Tooltip contentStyle={TT} formatter={(v) => [v + " €", "ADR"]} />
                    <Bar dataKey="prix" radius={[4, 4, 0, 0]} fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 9, fontSize: 11, color: "#cbd5e1" }}>
              💡 <strong>Vendredi-samedi-dimanche</strong> représentent typiquement 60-70% du volume hebdomadaire en location saisonnière.
              Pour optimiser, baisser les prix lundi-jeudi (-15 à -25%) peut remplir des nuits qui sinon resteraient vides.
            </div>
          </div>
        );
      })()}

      {selView === "canal" && (() => {
        const canaux = ["airbnb", "booking", "direct", "parking"];
        const canalLabels = { airbnb: "Airbnb", booking: "Booking.com", direct: "Direct", parking: "Parking" };
        const totals = canaux.reduce((acc, c) => {
          acc[c] = Object.values(REVENUS_CANAL_2025).reduce((s, b) => s + (b[c] || 0), 0);
          return acc;
        }, {});
        const total2025 = Object.values(totals).reduce((s, v) => s + v, 0);
        const pieData = canaux.filter(c => totals[c] > 0).map(c => ({ name: canalLabels[c], value: totals[c], c: CC[c] }));
        const bienData = biens.map(b => {
          const d = REVENUS_CANAL_2025[b.id] || {};
          return { nom: b.nom.replace("Villa ", "").replace("T2 ", ""), emoji: b.emoji, ...Object.fromEntries(canaux.map(c => [canalLabels[c], d[c] || 0])) };
        });
        return (
          <div>
            {/* KPIs canal */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              {pieData.map(d => (
                <div key={d.name} style={{ flex: 1, minWidth: 110, background: `${d.c}11`, border: `1px solid ${d.c}44`, borderTop: `3px solid ${d.c}`, borderRadius: 11, padding: "11px 13px" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>{d.name}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-mono)" }}>{fmtK(d.value)}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{((d.value / total2025) * 100).toFixed(0)}% du total</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {/* Pie canal */}
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Répartition canal 2025</div>
                <ResponsiveContainer width="100%" height={mob ? 180 : 220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={mob ? 40 : 55} outerRadius={mob ? 75 : 95} paddingAngle={2}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.c} />)}
                    </Pie>
                    <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#94a3b8" }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: d.c, display: "inline-block" }} />
                        {d.name}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>{fmt(d.value)} <span style={{ color: "#64748b" }}>({((d.value / total2025) * 100).toFixed(0)}%)</span></span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Stacked bar par bien */}
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Canal par bien 2025</div>
                <ResponsiveContainer width="100%" height={mob ? 200 : 260}>
                  <BarChart data={bienData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                    <YAxis type="category" dataKey="nom" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                    <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
                    {canaux.filter(c => totals[c] > 0).map(c => <Bar key={c} dataKey={canalLabels[c]} stackId="a" fill={CC[c]} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ padding: "9px 13px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8, fontSize: 11, color: "#cbd5e1" }}>
              ⚡ Données 2025 réelles (source Google Sheets). La décomposition canal n'est pas disponible pour les années antérieures.
            </div>
          </div>
        );
      })()}

      {selView === "rentabilite" && (() => {
        const years = [...histYearsAll, cy2];
        const rentData = years.map(y => {
          const rev = totalParAnnee[y] || 0;
          const cf  = cashflowParAnnee[y] || 0;
          const ch  = Math.max(rev - cf, 0);
          return { annee: String(y) + (y === cy2 ? " YTD" : ""), revenus: rev, charges: ch, cashflow: cf, ytd: y === cy2 };
        });
        const rentTrend = years.map(y => {
          const rev = totalParAnnee[y] || 0;
          const cf  = cashflowParAnnee[y] || 0;
          return { annee: String(y) + (y === cy2 ? " YTD" : ""), marge: rev > 0 ? Math.round((cf / rev) * 100) : 0 };
        });
        return (
          <div>
            {/* KPIs rentabilité */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              {[
                { l: "Revenus cumulés", v: totalDepuis2022, c: "#0ea5e9" },
                { l: "Charges cumulées", v: totalDepuis2022 - cashflowDepuis2022, c: "#ef4444" },
                { l: "Cashflow cumulé", v: cashflowDepuis2022, c: "#10b981" },
                { l: "Marge nette moy.", v: null, pct: ((cashflowDepuis2022 / totalDepuis2022) * 100).toFixed(0) + "%", c: "#f59e0b" },
              ].map((k, i) => (
                <div key={i} style={{ flex: 1, minWidth: 110, background: `${k.c}11`, border: `1px solid ${k.c}33`, borderRadius: 11, padding: "11px 13px" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>{k.l}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: k.c, fontFamily: "var(--font-mono)" }}>{k.v != null ? fmtK(k.v) : k.pct}</div>
                </div>
              ))}
            </div>
            {/* Barres empilées revenus / charges / cashflow */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Revenus / Charges / Cashflow par année</div>
              <ResponsiveContainer width="100%" height={mob ? 180 : 240}>
                <ComposedChart data={rentData} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="annee" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                  <Bar dataKey="charges"  name="Charges"  fill="#ef4444" stackId="a" />
                  <Bar dataKey="cashflow" name="Cashflow" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="revenus" name="Revenus totaux" stroke="#0ea5e9" strokeWidth={2.5} dot={{ fill: "#0ea5e9", r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Taux de marge par année */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Taux de marge nette (cashflow / revenus)</div>
              <ResponsiveContainer width="100%" height={mob ? 120 : 150}>
                <BarChart data={rentTrend} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="annee" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} domain={[0, 70]} />
                  <Tooltip contentStyle={TT} formatter={(v) => [v + " %", "Marge nette"]} />
                  <Bar dataKey="marge" radius={[5, 5, 0, 0]}>
                    {rentTrend.map((d, i) => <Cell key={i} fill={d.marge >= 50 ? "#10b981" : d.marge >= 40 ? "#f59e0b" : "#ef4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Tableau récap */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Synthèse par année</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Année", "Revenus", "Charges", "Cashflow", "Marge"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: h === "Année" ? "left" : "right", fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rentData.map((r, i) => {
                    const marge = r.revenus > 0 ? ((r.cashflow / r.revenus) * 100).toFixed(0) : 0;
                    const margeColor = marge >= 50 ? "#10b981" : marge >= 40 ? "#f59e0b" : "#ef4444";
                    return (
                      <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "9px 12px", fontWeight: 600, color: r.ytd ? "#f59e0b" : "#e2e8f0", fontSize: 11 }}>{r.annee}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "#0ea5e9" }}>{fmt(r.revenus)}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "#ef4444" }}>{fmt(r.charges)}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "#10b981", fontWeight: 600 }}>{fmt(r.cashflow)}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: margeColor, fontWeight: 700 }}>{marge}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {selView === "vs2025" && <ComparatifContent biens={biens} n={n} mob={mob} hist={hist} prevYear={prevYear3} />}
    </div>
  );
}
