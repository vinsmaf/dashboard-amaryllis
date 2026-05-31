/**
 * Historique — analyse historique 2022→courant : annuel, mensuel, cumul, heatmap.
 * Extrait de src/App.jsx (refactor 2026, batch B/3).
 */
import { useState } from "react";
import { ResponsiveContainer, BarChart, LineChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { MOIS, SAISONNALITE, TT, ANNEE_COLORS, HIST_SEED, ComparatifContent, fmt, fmtK } from "../App.jsx";
import { sumN } from "../utils/calculations.js";
import { useAppData } from "../AppDataContext.jsx";

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

  // Cashflow cumulé depuis 2022 — données réelles extraites du Google Sheets (revenus locatif YYYY)
  const cf26 = biens.reduce((s, b) => s + sumN(b.cashflow, n), 0);
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
        {[{ id: "annuel", l: "Annuel" }, { id: "mensuel", l: "Mensuel" }, { id: "cumul", l: `Cumul ${String(prevYear3).slice(-2)}/${String(cy2).slice(-2)}` }, { id: "heatmap", l: "🌡 Saisonnalité" }, { id: "semaine", l: "📅 Jour de semaine" }, { id: "vs2025", l: `📊 vs ${prevYear3}` }].map(v => (
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

      {selView === "vs2025" && <ComparatifContent biens={biens} n={n} mob={mob} hist={hist} prevYear={prevYear3} />}
    </div>
  );
}
