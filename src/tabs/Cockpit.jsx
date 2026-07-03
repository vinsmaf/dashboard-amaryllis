/**
 * Cockpit — tableau de bord principal (onglet par défaut).
 *
 * Extrait de src/App.jsx (refactor 2026, étape B/1).
 * Comporte les alertes en tête + les KPIs temps réel + les cartes par bien
 * + le tableau RevPAR cible/réel + le score de performance.
 *
 * Comportement préservé strictement (refactor pur). Voir docs/REFACTOR_2026.md.
 */
import { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// Helpers partagés exportés depuis App.jsx (temporaire — seront migrés vers utils/)
import { Gauge, fmt, fmtK, MOIS, DOT, TT } from "../App.jsx";
import { sumN, avgN, statutBien } from "../utils/calculations.js";
import { useAppData } from "../AppDataContext.jsx";
import { fetchJSON } from "../lib/apiFetch.js";

// ── Spark — micrograph trend (uniquement utilisé dans Cockpit) ──────────────
function Spark({ data = [], color = "#0ea5e9", w = 68, h = 26 }) {
  const valid = data.filter(v => v > 0);
  if (valid.length < 2) return <div style={{ width: w, height: h }} />;
  const mn = Math.min(...valid);
  const mx = Math.max(...valid);
  const rng = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = v > 0 ? h - ((v - mn) / rng) * (h - 4) - 2 : h;
    return `${x},${y}`;
  }).join(" ");
  const last = valid[valid.length - 1];
  const prev = valid[valid.length - 2];
  const trend = last >= prev ? "#10b981" : "#ef4444";
  const lastY = h - ((last - mn) / rng) * (h - 4) - 2;
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" opacity={0.6} />
      <circle cx={w - 2} cy={lastY} r={2.5} fill={trend} />
    </svg>
  );
}

// ── PBar — barre de progression ──────────────────────────────────────────────
function PBar({ pct, label, color }) {
  const c = color || (pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#0ea5e9");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: c, fontWeight: 600 }}>{Math.round(Math.min(pct, 999))}%</span>
      </div>
      <div style={{ height: 5, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: c, borderRadius: 3, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

// ── RevCell — cellule éditable inline pour saisie revenus ───────────────────
function RevCell({ bienId, month, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const start = () => { setDraft(String(value)); setEditing(true); };
  const commit = () => {
    const v = parseFloat(draft);
    if (!isNaN(v) && v !== value) onSave(bienId, month, v);
    setEditing(false);
  };
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        style={{ width: 52, padding: "1px 4px", background: "#0f172a", border: "1px solid #0ea5e9", borderRadius: 4, color: "#e2e8f0", fontSize: 10, fontFamily: "var(--font-mono)", textAlign: "right" }}
      />
    );
  }
  return (
    <span onClick={start} title="Cliquer pour modifier" style={{ cursor: "text", color: value > 0 ? "#94a3b8" : "#334155", fontSize: 10, fontFamily: "var(--font-mono)" }}>
      {value > 0 ? fmt(value) : "–"}
    </span>
  );
}

// ── YieldAlerts — alertes rendement 14j ──────────────────────────────────────
function YieldAlerts({ biens, reservations, mob }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const in14  = new Date(today.getTime() + 14 * 86400000);
  const in30  = new Date(today.getTime() + 30 * 86400000);

  const alerts = biens.filter(b => b.type !== "long").map(b => {
    const resas = reservations.filter(r => r.bienId === b.id && r.checkin && r.checkout);
    const booked = (end) => {
      let n = 0;
      resas.forEach(r => {
        const ci = new Date(r.checkin + "T12:00:00Z"), co = new Date(r.checkout + "T12:00:00Z");
        const s = ci < today ? today : ci, e = co > end ? end : co;
        if (e > s) n += (e - s) / 86400000;
      });
      return n;
    };
    const occ14 = Math.round(booked(in14) / 14 * 100);
    const occ30 = Math.round(booked(in30) / 30 * 100);
    let level, advice;
    if (occ14 === 0)      { level = "danger";  advice = "Aucune résa · baisser le prix"; }
    else if (occ14 < 30)  { level = "warning"; advice = `${occ14}% · vérifier les prix`; }
    else if (occ14 >= 90) { level = "success"; advice = `${occ14}% complet · possibilité d'augmenter`; }
    else                  { level = "ok";       advice = `${occ14}% · dans la norme`; }
    return { b, occ14, occ30, level, advice };
  });

  const relevant = alerts.filter(a => a.level !== "ok");
  if (relevant.length === 0) return null;

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        ⚡ Alertes rendement — 14 prochains jours
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
        {alerts.map(({ b, occ14, occ30, level, advice }) => {
          const color = level === "danger" ? "#ef4444" : level === "warning" ? "#f59e0b" : level === "success" ? "#10b981" : "#475569";
          const icon  = level === "danger" ? "🔴" : level === "warning" ? "🟡" : level === "success" ? "🟢" : "⚪";
          return (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{b.emoji || icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.nom.replace("Villa ", "")}</div>
                <div style={{ fontSize: 10, color, marginTop: 1 }}>{icon} {advice}</div>
                <div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>30j : {occ30}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── NogentCashflowAlert — alerte spécifique Nogent ───────────────────────────
function NogentCashflowAlert({ biens, mob }) {
  const nogent = biens.find(b => b.id === "nogent");
  if (!nogent) return null;

  const CONCIERGERIE_MENSUEL = 714; // ~8 575 € / 12 mois estimés
  const moisActuel = new Date().getMonth();
  const cfSlice  = nogent.cashflow.slice(0, moisActuel + 1);
  const revSlice = nogent.revenus.slice(0, moisActuel + 1);

  const cfYTD  = cfSlice.reduce((s, v) => s + (v || 0), 0);
  const revYTD = revSlice.reduce((s, v) => s + (v || 0), 0);
  const chargesYTD = (nogent.charges || 1330) * (moisActuel + 1);
  const conciergerieYTD = CONCIERGERIE_MENSUEL * (moisActuel + 1);

  // Compter les mois négatifs
  let consecutiveNeg = 0;
  for (let i = cfSlice.length - 1; i >= 0; i--) {
    if ((cfSlice[i] || 0) < 0) consecutiveNeg++;
    else break;
  }
  const totalNegMonths = cfSlice.filter(v => (v || 0) < 0).length;
  if (totalNegMonths === 0) return null;

  const revMoyen = revYTD / (moisActuel + 1);
  const breakeven = nogent.charges || 1330;
  const cfSimAuto = cfYTD + Math.round(conciergerieYTD * 0.7);

  return (
    <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        🏙️ Alerte Nogent — {consecutiveNeg >= 2 ? `Cashflow négatif ${consecutiveNeg} mois consécutifs` : `${totalNegMonths} mois en cashflow négatif YTD`}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { l: "CF YTD",          v: `${cfYTD >= 0 ? "+" : ""}${cfYTD.toLocaleString("fr-FR")} €`,               c: cfYTD >= 0 ? "#10b981" : "#ef4444" },
          { l: "Revenus YTD",     v: `${revYTD.toLocaleString("fr-FR")} €`,                                        c: "#0ea5e9" },
          { l: "Charges YTD",     v: `−${chargesYTD.toLocaleString("fr-FR")} €`,                                   c: "#f59e0b" },
          { l: "Conciergerie est.",v: `−${conciergerieYTD.toLocaleString("fr-FR")} €`,                              c: "#f87171" },
        ].map(k => (
          <div key={k.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: "10px 13px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{k.l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: k.c, fontFamily: "var(--font-mono)" }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10, lineHeight: 1.7 }}>
        <strong style={{ color: "#e2e8f0" }}>Breakeven :</strong> {breakeven.toLocaleString("fr-FR")} €/mois de revenus pour couvrir les charges.
        {" "}Revenu moyen actuel : <strong style={{ color: revMoyen >= breakeven ? "#10b981" : "#ef4444" }}>{Math.round(revMoyen).toLocaleString("fr-FR")} €/mois</strong>
        {revMoyen < breakeven ? ` — déficit moyen de ${Math.round(breakeven - revMoyen).toLocaleString("fr-FR")} €/mois.` : "."}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontWeight: 700, color: "#10b981", fontSize: 11, marginBottom: 4 }}>💡 Simulation : réduire conciergerie de 70%</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            CF simulé YTD : <strong style={{ color: cfSimAuto >= 0 ? "#10b981" : "#f59e0b", fontFamily: "var(--font-mono)" }}>{cfSimAuto >= 0 ? "+" : ""}{cfSimAuto.toLocaleString("fr-FR")} €</strong>
            {" · "}gain annuel : <strong style={{ color: "#10b981" }}>+{Math.round(CONCIERGERIE_MENSUEL * 0.7 * 12).toLocaleString("fr-FR")} €</strong>
          </div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>→ Renégocier le contrat ou passer en ménages uniquement (self check-in)</div>
        </div>
        <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontWeight: 700, color: "#0ea5e9", fontSize: 11, marginBottom: 4 }}>📊 Dépendance Booking.com estimée : ~79%</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Concentration sur un seul canal → risque algorithmique et commission 15%.</div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>→ Activer Airbnb + réservations directes pour diversifier (objectif : Booking &lt; 50%)</div>
        </div>
      </div>
    </div>
  );
}

// ── AmaryllisBaseSaisonAlert — alerte basse saison Villa Amaryllis ──────────
function AmaryllisBaseSaisonAlert({ biens, mob }) {
  const amaryllis = biens.find(b => b.id === "amaryllis");
  if (!amaryllis) return null;

  const moisActuel = new Date().getMonth();
  const MOIS_COURTS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  const alertsMois = [];
  for (let i = moisActuel; i < 12; i++) {
    const occ = amaryllis.occ[i] || 0;
    const adr = amaryllis.adr[i] || 0;
    if (occ > 0 && occ < 35) {
      const reduction = occ < 15 ? 35 : 20;
      alertsMois.push({ mois: MOIS_COURTS[i], idx: i, occ, adr, reduction });
    }
  }

  if (alertsMois.length === 0) return null;

  const emailTemplate = `Objet : Offre exclusive — Villa Amaryllis disponible en ${alertsMois.map(m => m.mois).join(" / ")}

Bonjour,

Nous avons des disponibilités à la Villa Amaryllis en ${alertsMois.map(m => m.mois).join(" et ")}.

En tant que voyageur fidèle, nous vous réservons un tarif préférentiel −20 % sur ces périodes.

✅ Piscine privée chauffée  · Vue mer Caraïbes
🌿 Jardin tropical 2 000 m² · Accès direct plage
📍 Sainte-Luce, Martinique

Réservation directe (sans commission) :
→ villamaryllis.com/amaryllis

Répondez à ce message pour un devis personnalisé.

Belle journée,
L'équipe Amaryllis Locations`;

  return (
    <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        🌴 Basse saison Amaryllis — {alertsMois.length} mois à risque (occ &lt; 35%)
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill, minmax(170px, 1fr))", gap: 8, marginBottom: 12 }}>
        {alertsMois.map(({ mois, occ, adr, reduction }) => (
          <div key={mois} style={{ background: "rgba(245,158,11,0.08)", border: `1px solid ${occ < 15 ? "rgba(239,68,68,0.35)" : "rgba(245,158,11,0.25)"}`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 12, marginBottom: 3 }}>{mois}</div>
            <div style={{ fontSize: 11, color: occ < 15 ? "#ef4444" : "#f59e0b" }}>
              {occ < 15 ? "🔴" : "🟡"} {occ.toFixed(0)}% occ{adr > 0 ? ` · ${adr}€/nuit` : ""}
            </div>
            {adr > 0 && (
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                Prix suggéré −{reduction}% : <strong style={{ color: "#10b981" }}>{Math.round(adr * (1 - reduction / 100))}€/nuit</strong>
              </div>
            )}
          </div>
        ))}
      </div>

      <details>
        <summary style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, cursor: "pointer", userSelect: "none", marginBottom: 6 }}>
          📧 Template email last-minute — voyageurs fidèles
        </summary>
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 14px", marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "#94a3b8", lineHeight: 1.8, whiteSpace: "pre-wrap", userSelect: "all" }}>
          {emailTemplate}
        </div>
      </details>
    </div>
  );
}

// ── Cockpit — composant principal ────────────────────────────────────────────
export default function Cockpit() {
  const { biens, n, mob, onUpdateRevenu, reservations = [] } = useAppData();
  const BIEN_COLORS = { nogent: "#0ea5e9", amaryllis: "#10b981", iguana: "#6366f1", geko: "#f59e0b", zandoli: "#3b82f6", mabouya: "#ec4899", schoelcher: "#8b5cf6" };
  const tc = { court: "#0ea5e9", long: "#10b981", moyen: "#f59e0b" };
  const tl = { court: "Court", long: "Long", moyen: "Moyen" };

  // Occupation RÉELLE à venir (30j glissants, par bien) — distincte de l'"Occ."
  // historique de la carte (moyenne Sheet) : ici on lit le dernier snapshot
  // rm_kpi_snapshots, calculé par le Worker depuis les nuits déjà réservées.
  const [occForward, setOccForward] = useState({});
  useEffect(() => {
    fetchJSON("/api/occupancy-stats")
      .then(d => {
        const map = {};
        (d?.properties || []).forEach(p => { map[p.property_id] = p; });
        setOccForward(map);
      })
      .catch(() => {});
  }, []);

  const monthly = useMemo(() => MOIS.slice(0, Math.min(n + 2, 8)).map((_, i) => {
    const row = { m: MOIS[i] };
    biens.forEach(b => { row[b.id] = i < n ? (b.revenus[i] || 0) : 0; });
    return row;
  }), [biens, n]);

  // ── Métriques temps réel ─────────────────────────────────────────────────
  const { occ30j, cumulData, ytdTotal, revparActuel, bookedNights30, avail30, curMonth } = useMemo(() => {
    const todayTs = new Date();
    const d30Ts = new Date(todayTs - 30 * 86400000);
    const shortTermBiens = biens.filter(b => b.type !== "long");
    let bookedNights30 = 0;
    shortTermBiens.forEach(b => {
      reservations.filter(r => r.bienId === b.id).forEach(r => {
        if (!r.checkin || !r.checkout) return;
        const ci = new Date(r.checkin + "T12:00:00Z");
        const co = new Date(r.checkout + "T12:00:00Z");
        const s = ci < d30Ts ? d30Ts : ci;
        const e = co > todayTs ? todayTs : co;
        if (e > s) bookedNights30 += (e - s) / 86400000;
      });
    });
    const avail30 = shortTermBiens.length * 30;
    const occ30j = avail30 > 0 ? Math.min(Math.round(bookedNights30 / avail30 * 100), 100) : 0;
    const curMonth = todayTs.getMonth();
    const revparActuel = shortTermBiens.reduce((s, b) => s + (b.revpar[curMonth] || 0), 0)
      / Math.max(shortTermBiens.length, 1);
    let cum = 0;
    const cumulData = MOIS.slice(0, n).map((m, i) => {
      const mensuel = biens.reduce((s, b) => s + (b.revenus[i] || 0), 0);
      cum += mensuel;
      return { m, mensuel, cumul: cum };
    });
    return { occ30j, cumulData, ytdTotal: cum, revparActuel, bookedNights30, avail30, curMonth };
  }, [biens, n, reservations]);

  return (
    <div>
      {/* <AISummary biens={biens} n={n} /> — désactivé (nécessite crédit API Anthropic) */}
      <YieldAlerts biens={biens} reservations={reservations} mob={mob} />
      <NogentCashflowAlert biens={biens} mob={mob} />
      <AmaryllisBaseSaisonAlert biens={biens} mob={mob} />

      {/* ── KPIs temps réel ── */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "CA YTD", value: fmtK(biens.reduce((s, b) => s + sumN(b.revenus, n), 0)), sub: `${n} mois`, color: "#0ea5e9" },
          { label: "CF YTD", value: fmtK(biens.reduce((s, b) => s + sumN(b.cashflow, n), 0)), sub: "cashflow net", color: biens.reduce((s, b) => s + sumN(b.cashflow, n), 0) >= 0 ? "#10b981" : "#ef4444" },
          { label: "Occ. 30j", value: `${occ30j}%`, sub: `${Math.round(bookedNights30)}/${avail30} nuits`, color: occ30j >= 60 ? "#10b981" : occ30j >= 40 ? "#f59e0b" : "#ef4444" },
          { label: "RevPAR mois", value: `${revparActuel.toFixed(0)}€`, sub: MOIS[curMonth], color: "#f59e0b" },
        ].map(k => (
          <div key={k.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: "var(--font-mono)" }}>{k.value}</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── CA cumulé YTD ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: mob ? 12 : 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
          <span>CA cumulé {new Date().getFullYear()}</span>
          <span style={{ fontSize: 12, color: "#0ea5e9", fontFamily: "var(--font-mono)" }}>{fmtK(ytdTotal)} total</span>
        </div>
        <ResponsiveContainer width="100%" height={mob ? 100 : 130}>
          <ComposedChart data={cumulData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="m" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
            <Tooltip contentStyle={TT} formatter={(v, k) => [fmt(v), k === "cumul" ? "Cumulé" : "Mensuel"]} />
            <Bar dataKey="mensuel" fill="rgba(14,165,233,0.25)" radius={[3,3,0,0]} name="Mensuel" />
            <Line type="monotone" dataKey="cumul" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Cumulé" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: mob ? 12 : 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, fontWeight: 600 }}>Revenus mensuels {new Date().getFullYear()}</div>
        <ResponsiveContainer width="100%" height={mob ? 130 : 165}>
          <BarChart data={monthly} barSize={mob ? 22 : 28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="m" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
            <Tooltip contentStyle={TT} formatter={(v, k) => [fmt(v), biens.find(b => b.id === k)?.nom || k]} />
            <Legend wrapperStyle={{ fontSize: 9, color: "#94a3b8" }} iconSize={8} />
            {biens.map((b, idx) => (
              <Bar key={b.id} dataKey={b.id} name={b.nom.replace("Villa ", "").replace("T2 ", "")} stackId="a" fill={BIEN_COLORS[b.id] || "#64748b"} radius={idx === biens.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
        {biens.map(b => {
          const ytdB = sumN(b.revenus, n);
          const cfB = sumN(b.cashflow, n);
          const occ = avgN(b.occ, n);
          const adr = avgN(b.adr, n);
          const rvp = avgN(b.revpar, n);
          const s = statutBien(b);
          const pp = Math.round(b.rev2025 / 12 * n);
          const pct = pp > 0 ? Math.min((ytdB / pp) * 100, 150) : 0;

          return (
            <div key={b.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 13, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 19 }}>{b.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 13 }}>{b.nom}</div>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 8, background: tc[b.type] + "22", color: tc[b.type], fontWeight: 600 }}>
                      {tl[b.type]}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Spark data={b.revenus.slice(0, n)} color={DOT[s]} w={60} h={24} />
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: DOT[s] }} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-mono)" }}>{fmtK(ytdB)}</div>
                  <div style={{ fontSize: 11, color: cfB >= 0 ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)" }}>
                    {cfB >= 0 ? "+" : ""}{fmtK(cfB)} CF
                  </div>
                  {(() => {
                    const p25 = Math.round(b.rev2025 / 12 * n);
                    const delta = p25 > 0 ? ((ytdB - p25) / p25 * 100).toFixed(0) : null;
                    if (delta === null) return null;
                    const up = parseFloat(delta) >= 0;
                    return <div style={{ fontSize: 10, color: up ? "#10b981" : "#ef4444", marginTop: 2 }}>{up ? "▲" : "▼"} {up ? "+" : ""}{delta}% vs 2025</div>;
                  })()}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <Gauge pct={occ} size={50} />
                    <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>Occ.</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b", fontFamily: "var(--font-mono)" }}>{adr.toFixed(0)}€</div>
                    <div style={{ fontSize: 9, color: "#64748b" }}>ADR</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{rvp.toFixed(0)}€</div>
                    <div style={{ fontSize: 9, color: "#64748b" }}>RevPAR</div>
                  </div>
                </div>
              </div>

              <PBar pct={pct} label={`vs prorata 2025 (${fmtK(pp)})`} />

              {occForward[b.id] && (
                <div style={{ marginTop: 8 }}>
                  <PBar
                    pct={occForward[b.id].occupancy_pct || 0}
                    label={`🔮 30j à venir (${occForward[b.id].nights_sold}/${occForward[b.id].nights_available} nuits)`}
                  />
                </div>
              )}

              {onUpdateRevenu && (
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "3px 4px" }}>
                  {MOIS.slice(0, Math.max(n, 1)).map((m, i) => (
                    <div key={m} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: "#475569", marginBottom: 1 }}>{m}</div>
                      <RevCell bienId={b.id} month={i + 1} value={b.revenus[i] || 0} onSave={onUpdateRevenu} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── rev-008 : RevPAR cible vs réel ─────────────────────────────────── */}
      {(() => {
        // Cibles RevPAR 2025 définies par bien (basées sur le potentiel marché / historique)
        const REVPAR_CIBLES = {
          amaryllis:  160,  // villa premium vue mer, piscine
          zandoli:    100,  // villa familiale résidence
          geko:        80,  // villa compact résidence
          mabouya:     70,  // studio résidence — actuellement sous-performant (23€ YTD)
          iguana:      90,  // villa plage privée — longue durée, hors logique RevPAR court terme
          schoelcher:  65,  // T2 moyen terme — sous-performant (35€ YTD)
          nogent:      82,  // T2 Île-de-France
        };
        const courtBiens = biens.filter(b => b.type !== "long");
        const rows = courtBiens.map(b => {
          const rvpActuel = avgN(b.revpar, n);
          const cible     = REVPAR_CIBLES[b.id] || b.revpar2025 || 80;
          const ratio     = cible > 0 ? (rvpActuel / cible) : 0;
          const pct       = Math.min(Math.round(ratio * 100), 120);
          const color     = pct >= 90 ? "#10b981" : pct >= 65 ? "#f59e0b" : "#ef4444";
          const gap       = cible - rvpActuel;
          return { b, rvpActuel, cible, pct, color, gap };
        });
        return (
          <div style={{ marginTop: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: mob ? 12 : 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 14 }}>📊 RevPAR — réel vs cible {new Date().getFullYear()}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rows.map(({ b, rvpActuel, cible, pct, color, gap }) => (
                <div key={b.id} style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "140px 1fr 100px", gap: 8, alignItems: "center" }}>
                  {/* Label bien */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 15 }}>{b.emoji}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{b.nom.replace("Villa ", "").replace("T2 ", "")}</div>
                      <div style={{ fontSize: 10, color: color, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {rvpActuel.toFixed(0)}€ <span style={{ color: "#475569", fontWeight: 400 }}>/ {cible}€ cible</span>
                      </div>
                    </div>
                  </div>
                  {/* Barre de progression */}
                  <div style={{ position: "relative", height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "visible" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(pct, 100)}%`,
                      background: color,
                      borderRadius: 4,
                      transition: "width 0.6s ease",
                    }} />
                    {/* Marqueur cible à 100% */}
                    <div style={{ position: "absolute", top: -3, left: "100%", width: 2, height: 14, background: "rgba(255,255,255,0.2)", borderRadius: 1 }} />
                  </div>
                  {/* Pct + gap */}
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "var(--font-mono)" }}>{pct}%</span>
                    {gap > 0 && (
                      <div style={{ fontSize: 10, color: "#ef4444", fontFamily: "var(--font-mono)" }}>−{gap.toFixed(0)}€/nuit</div>
                    )}
                    {gap <= 0 && (
                      <div style={{ fontSize: 10, color: "#10b981" }}>✓ Cible atteinte</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Alerte sous-performers */}
            {rows.filter(r => r.pct < 65).length > 0 && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>⚠️ Sous-performances critiques (&lt;65% de la cible)</div>
                {rows.filter(r => r.pct < 65).map(r => (
                  <div key={r.b.id} style={{ fontSize: 11, color: "#fca5a5" }}>
                    {r.b.emoji} <strong>{r.b.nom}</strong> : {r.rvpActuel.toFixed(0)}€ vs {r.cible}€ cible — manque {r.gap.toFixed(0)}€/nuit de RevPAR
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Score de performance ── */}
      <div style={{ marginTop: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: mob ? 12 : 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 14 }}>🏅 Score de performance</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
          {biens.map(b => {
            const ytdB = sumN(b.revenus, n);
            const occ = avgN(b.occ, n);
            const pp = Math.round(b.rev2025 / 12 * n);
            // 40 pts occupation
            const occScore = occ >= 80 ? 40 : occ >= 60 ? 30 : occ >= 40 ? 20 : occ >= 20 ? 10 : 5;
            // 30 pts revenu vs target
            const revRatio = pp > 0 ? (ytdB / pp) : 0;
            const revScore = revRatio >= 1 ? 30 : revRatio >= 0.8 ? 22 : revRatio >= 0.6 ? 15 : revRatio >= 0.3 ? 7 : 3;
            // 20 pts régularité (coeff de variation faible = bien)
            const revs = b.revenus.slice(0, n).filter(v => v > 0);
            const mean = revs.length > 0 ? revs.reduce((s, v) => s + v, 0) / revs.length : 0;
            const variance = revs.length > 1 ? revs.reduce((s, v) => s + (v - mean) ** 2, 0) / revs.length : 0;
            const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
            const regScore = cv < 0.2 ? 20 : cv < 0.35 ? 15 : cv < 0.5 ? 10 : 5;
            // 10 pts activité récente (résa dans les 60 prochains jours)
            const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
            const d60 = new Date(todayD.getTime() + 60 * 86400000);
            const hasRecent = reservations.some(r => r.bienId === b.id && r.checkin && new Date(r.checkin + "T12:00:00") >= todayD && new Date(r.checkin + "T12:00:00") <= d60);
            const recentScore = hasRecent ? 10 : 0;
            const total = occScore + revScore + regScore + recentScore;
            const scoreColor = total >= 80 ? "#10b981" : total >= 60 ? "#0ea5e9" : total >= 40 ? "#f59e0b" : "#ef4444";
            const scoreLabel = total >= 80 ? "Excellent" : total >= 60 ? "Bon" : total >= 40 ? "Moyen" : "Faible";
            return (
              <div key={b.id} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{b.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{b.nom}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 10, color: scoreColor, fontWeight: 700 }}>{scoreLabel}</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor, fontFamily: "var(--font-mono)" }}>{total}</span>
                    <span style={{ fontSize: 9, color: "#64748b" }}>/100</span>
                  </div>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ height: "100%", width: `${total}%`, background: scoreColor, borderRadius: 4, transition: "width 0.6s" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
                  {[
                    { label: "Occ.", value: occScore, max: 40, color: "#0ea5e9" },
                    { label: "Revenu", value: revScore, max: 30, color: "#10b981" },
                    { label: "Régularité", value: regScore, max: 20, color: "#8b5cf6" },
                    { label: "Activité", value: recentScore, max: 10, color: "#f59e0b" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 3 }}>
                        <div style={{ height: "100%", width: `${(s.value / s.max) * 100}%`, background: s.color, borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 8, color: "#64748b" }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: s.color, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{s.value}/{s.max}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
