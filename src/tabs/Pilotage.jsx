/**
 * Pilotage — analyse canaux + commissions + cashflow projeté.
 * Inclut CanalLivePerf (utilisé uniquement par Pilotage).
 * Extrait de src/App.jsx (refactor 2026, batch B/4).
 */
import { useState } from "react";
import { ResponsiveContainer, BarChart, LineChart, ComposedChart, PieChart, Pie, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { MOIS, TT, REVENUS_CANAL_2025, CHARGES_2025, POSTES_CHARGES, fmt, fmtK } from "../App.jsx";
import { sumN, avgN } from "../utils/calculations.js";
import { useAppData } from "../AppDataContext.jsx";
import { commissionTaux, airbnbComm, BOOKING_COMM } from "../config/canauxCommissions.js";

// ── CanalLivePerf — uniquement utilisé par Pilotage ──────────────────────────
function CanalLivePerf({ biens, reservations, mob }) {
  // Commission calculée PAR réservation (taux Airbnb variable selon le bien :
  // 3% Géko/Zandoli/Mabouya/Bellevue, 15% Villa ; Booking 17% ; Direct 0%).
  const CANAL_CONF = {
    airbnb:       { label: "Airbnb",       color: "#FF5A5F" },
    booking:      { label: "Booking.com",  color: "#0ea5e9" },
    direct:       { label: "Direct",       color: "#10b981" },
    beds24:       { label: "Beds24",       color: "#a855f7" },
  };
  const normalize = c => {
    if (!c) return "autre";
    const l = c.toLowerCase();
    if (l.includes("airbnb"))  return "airbnb";
    if (l.includes("booking")) return "booking";
    if (l.includes("direct"))  return "direct";
    if (l.includes("beds24"))  return "beds24";
    return "autre";
  };

  const stats = {};
  reservations.forEach(r => {
    if (!r.montant || r.montant <= 0 || !r.checkin || !r.checkout) return;
    const canal = normalize(r.canal);
    if (!stats[canal]) stats[canal] = { count: 0, brut: 0, nights: 0, commission: 0 };
    const ci = new Date(r.checkin + "T12:00:00Z"), co = new Date(r.checkout + "T12:00:00Z");
    const nights = Math.max(1, Math.round((co - ci) / 86400000));
    stats[canal].count++;
    stats[canal].brut += r.montant;
    stats[canal].nights += nights;
    stats[canal].commission += r.montant * commissionTaux(canal, r.bienId); // per-bien Airbnb
  });

  const rows = Object.entries(stats)
    .map(([canal, s]) => {
      const conf = CANAL_CONF[canal] || { label: canal, color: "#64748b" };
      const commission = Math.round(s.commission);
      const net = s.brut - commission;
      const adr = s.nights > 0 ? Math.round(s.brut / s.nights) : 0;
      const comm = s.brut > 0 ? commission / s.brut : 0; // taux effectif (Airbnb = mix 3%/15%)
      return { canal, ...conf, ...s, commission, net, adr, comm };
    })
    .sort((a, b) => b.brut - a.brut);

  const totalBrut = rows.reduce((s, r) => s + r.brut, 0);
  const totalComm = rows.reduce((s, r) => s + r.commission, 0);
  const totalNet  = rows.reduce((s, r) => s + r.net, 0);

  if (rows.length === 0) return (
    <div style={{ color: "#475569", fontSize: 12, padding: 16 }}>Aucune donnée de réservation disponible. Synchronisez l'iCal ou Beds24.</div>
  );

  return (
    <div>
      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "CA brut total",   value: `${(totalBrut/1000).toFixed(1)}k€`, color: "#0ea5e9" },
          { label: "Commissions",     value: `${(totalComm/1000).toFixed(1)}k€`, color: "#ef4444" },
          { label: "Net perçu",       value: `${(totalNet/1000).toFixed(1)}k€`,  color: "#10b981" },
          { label: "Taux comm. moy.", value: totalBrut > 0 ? `${Math.round(totalComm/totalBrut*100)}%` : "—", color: "#f59e0b" },
        ].map(k => (
          <div key={k.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color, fontFamily: "var(--font-mono)" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Par canal */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(r => (
          <div key={r.canal} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{r.label}</span>
              <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>{r.count} résa · {r.nights} nuits</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {[
                { l: "CA brut",    v: `${r.brut.toLocaleString("fr-FR")}€`,       c: "#e2e8f0" },
                { l: "Commission", v: r.comm > 0 ? `-${r.commission.toLocaleString("fr-FR")}€ (${Math.round(r.comm*100)}%)` : "0€", c: r.comm > 0 ? "#f87171" : "#64748b" },
                { l: "Net",        v: `${r.net.toLocaleString("fr-FR")}€`,         c: "#10b981" },
                { l: "ADR/nuit",   v: `${r.adr}€`,                                 c: "#f59e0b" },
              ].map(k => (
                <div key={k.l}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{k.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: k.c, fontFamily: "var(--font-mono)" }}>{k.v}</div>
                </div>
              ))}
            </div>
            {/* Barre progression */}
            <div style={{ marginTop: 10, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
              <div style={{ height: 3, width: `${totalBrut > 0 ? Math.round(r.brut/totalBrut*100) : 0}%`, background: r.color, borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 9, color: "#475569", marginTop: 3 }}>
              {totalBrut > 0 ? Math.round(r.brut/totalBrut*100) : 0}% du CA total
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 9, color: "#334155", marginTop: 10 }}>
        Commissions estimées : Airbnb 3% (frais hôte) · Booking 15% · Direct 0%. Basé sur les données iCal + Beds24 synchronisées.
      </div>
    </div>
  );
}

// ── Pilotage — composant principal ─────────────────────────────────────────
export default function Pilotage() {
  const { biens, n, mob, reservations = [] } = useAppData();
  const [view, setView] = useState("canal-live");
  const PIE_COLORS = ["#0ea5e9", "#FF5A5F", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4"];

  // ===== CANAUX =====
  const canalTotaux = { airbnb: 0, booking: 0, direct: 0, parking: 0 };
  let airbnbCommission2025 = 0; // Airbnb : taux PAR BIEN (3% vs 15%)
  Object.entries(REVENUS_CANAL_2025).forEach(([bienId, b]) => {
    canalTotaux.airbnb += b.airbnb;
    canalTotaux.booking += b.booking;
    canalTotaux.direct += b.direct;
    canalTotaux.parking += b.parking || 0;
    airbnbCommission2025 += (b.airbnb || 0) * airbnbComm(bienId);
  });
  const totalCanal = canalTotaux.airbnb + canalTotaux.booking + canalTotaux.direct + canalTotaux.parking;

  // Commissions estimées — Airbnb per-bien (3%/15%), Booking 17% partout
  const commissionParCanal = {
    airbnb: airbnbCommission2025,
    booking: canalTotaux.booking * BOOKING_COMM,
    direct: 0,
    parking: 0,
  };
  const totalCommissions = Object.values(commissionParCanal).reduce((s, v) => s + v, 0);
  const netParCanal = {
    airbnb: canalTotaux.airbnb - commissionParCanal.airbnb,
    booking: canalTotaux.booking - commissionParCanal.booking,
    direct: canalTotaux.direct,
    parking: canalTotaux.parking,
  };

  const canalData = [
    { name: "Airbnb",  brut: canalTotaux.airbnb,  net: netParCanal.airbnb,  commission: commissionParCanal.airbnb,  color: "#FF5A5F" },
    { name: "Booking", brut: canalTotaux.booking, net: netParCanal.booking, commission: commissionParCanal.booking, color: "#0ea5e9" },
    { name: "Direct",  brut: canalTotaux.direct,  net: netParCanal.direct,  commission: 0,                          color: "#10b981" },
  ];
  if (canalTotaux.parking > 0) canalData.push({ name: "Parking", brut: canalTotaux.parking, net: canalTotaux.parking, commission: 0, color: "#a855f7" });

  const bienCanalData = biens.map(b => {
    const d = REVENUS_CANAL_2025[b.id] || { airbnb: 0, booking: 0, direct: 0 };
    return {
      nom: b.nom.replace("Villa ", "").replace("T2 ", ""),
      emoji: b.emoji,
      Airbnb: d.airbnb,
      Booking: d.booking,
      Direct: d.direct,
    };
  });

  // ===== FISCAL =====
  const ytd = biens.reduce((s, b) => s + sumN(b.revenus, n), 0);
  const projAnnuelle = n > 0 ? Math.round(ytd * 12 / n) : 0;
  // Sépare LMNP (court terme + moyen) et location nue (long terme)
  const revenusLocCourt = biens.filter(b => b.type !== "long").reduce((s, b) => s + sumN(b.revenus, n), 0);
  const revenusLocLong = biens.filter(b => b.type === "long").reduce((s, b) => s + sumN(b.revenus, n), 0);
  const projCourt = n > 0 ? Math.round(revenusLocCourt * 12 / n) : 0;
  const projLong = n > 0 ? Math.round(revenusLocLong * 12 / n) : 0;
  // Plafonds 2026 (France)
  const PLAFOND_MICRO_BIC_CLASSIQUE = 77700;
  const PLAFOND_MICRO_BIC_CLASSE = 15000;
  const PLAFOND_TVA_BIC = 91900;
  const ABATTEMENT_MICRO_BIC_CLASSE = 0.30;
  const ABATTEMENT_MICRO_BIC_CLASSIQUE = 0.50;
  // Si meublé classé (chambres d'hôtes/gîtes) : abattement 71% jusqu'à 188 700€
  const seuils = [
    { name: "Micro-BIC meublé (non classé)", plafond: PLAFOND_MICRO_BIC_CLASSE, info: "Abattement 30%", current: projCourt, color: "#ef4444" },
    { name: "Micro-BIC classique (location nue)", plafond: PLAFOND_MICRO_BIC_CLASSIQUE, info: "Abattement 50%", current: projLong, color: "#0ea5e9" },
    { name: "Franchise TVA BIC", plafond: PLAFOND_TVA_BIC, info: "Au-delà : TVA obligatoire", current: projAnnuelle, color: "#f59e0b" },
  ];
  const revenusImposables = Math.round(projCourt * (1 - ABATTEMENT_MICRO_BIC_CLASSE) + projLong * (1 - ABATTEMENT_MICRO_BIC_CLASSIQUE));

  // ===== DÉTAIL CHARGES PAR POSTE =====
  const chargeTotals = {};
  POSTES_CHARGES.forEach(p => {
    chargeTotals[p.k] = biens.reduce((s, b) => s + ((CHARGES_2025[b.id] || {})[p.k] || 0), 0);
  });
  const totalCharges2025 = Object.values(chargeTotals).reduce((s, v) => s + v, 0);
  const chargeBreakdown = POSTES_CHARGES
    .map(p => ({ ...p, value: chargeTotals[p.k] }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value);
  const bienChargeStack = biens.map(b => {
    const c = CHARGES_2025[b.id] || {};
    const row = { nom: b.nom.replace("Villa ", "").replace("T2 ", ""), emoji: b.emoji };
    POSTES_CHARGES.forEach(p => { row[p.l] = c[p.k] || 0; });
    return row;
  });

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "canal-live", l: "⚡ Canaux live" },
          { id: "canaux",     l: "💼 Canaux 2025" },
          { id: "marche",     l: "🎯 Marché" },
          { id: "fiscal",     l: "📋 Fiscal" },
          { id: "conseil",    l: "🎓 Conseil" },
          { id: "detail",     l: "📊 Charges" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600,
            background: view === v.id ? "#0ea5e9" : "rgba(255,255,255,0.06)",
            color: view === v.id ? "#fff" : "#94a3b8",
          }}>{v.l}</button>
        ))}
      </div>

      {view === "canal-live" && (
        <CanalLivePerf biens={biens} reservations={reservations} mob={mob} />
      )}

      {view === "canaux" && (
        <div>
          {/* KPIs canaux */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {canalData.map(c => (
              <div key={c.name} style={{ flex: 1, minWidth: 120, background: c.color + "11", border: `1px solid ${c.color}44`, borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{c.name}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: c.color, fontFamily: "var(--font-mono)" }}>{fmtK(c.brut)}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                  {((c.brut / totalCanal) * 100).toFixed(0)}% du total
                  {c.commission > 0 && <span> · -{fmtK(c.commission)} commission</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Pie répartition + bar par bien */}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 2fr", gap: 14, marginBottom: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Répartition par canal (brut)</div>
              <ResponsiveContainer width="100%" height={mob ? 160 : 200}>
                <PieChart>
                  <Pie data={canalData} dataKey="brut" nameKey="name" cx="50%" cy="50%" innerRadius={mob ? 35 : 45} outerRadius={mob ? 65 : 80} paddingAngle={2}>
                    {canalData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: "#10b981", marginTop: 8, padding: "6px 10px", background: "rgba(16,185,129,0.08)", borderRadius: 7 }}>
                💡 Direct = {((canalTotaux.direct / totalCanal) * 100).toFixed(0)}% — pas de commission
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Mix par bien</div>
              <ResponsiveContainer width="100%" height={mob ? 200 : 240}>
                <BarChart data={bienCanalData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <YAxis type="category" dataKey="nom" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                  <Bar dataKey="Airbnb" stackId="a" fill="#FF5A5F" />
                  <Bar dataKey="Booking" stackId="a" fill="#0ea5e9" />
                  <Bar dataKey="Direct" stackId="a" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insight commissions */}
          <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 11, padding: "12px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Commissions plateformes estimées 2025</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444", fontFamily: "var(--font-mono)" }}>{fmt(Math.round(totalCommissions))}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
              Airbnb ~15% sur {fmtK(canalTotaux.airbnb)} + Booking ~17% sur {fmtK(canalTotaux.booking)}
            </div>
            <div style={{ fontSize: 11, color: "#10b981", marginTop: 6 }}>
              💡 Si tu basculais 30% de l'Airbnb/Booking en direct → ~{fmt(Math.round(totalCommissions * 0.3))} économisés/an
            </div>
          </div>
        </div>
      )}

      {view === "marche" && (() => {
        // Benchmark précis par bien — comparables réels avec attributs IDENTIQUES
        // Source : Booking.com, semaine 4-11 juillet 2026 (haute saison été)
        const BENCHMARKS = {
          amaryllis: {
            label: "Villa T4 · 3 ch · piscine privée · vue mer · 120m²",
            zone: "Sainte-Luce",
            adrActuel: 312,
            adrBooking: 467,
            mediane: 308,
            top: 467,
            min: 193,
            comparables: [
              { nom: "Villa Amaryllis (la tienne)", type: "4⭐", adr: 467, score: 9.6, reviews: 9, atout: "Piscine + vue mer + plage", mine: true },
              { nom: "Villa Les Lucioles", type: "Anse Mabouya", adr: 404, score: null, reviews: 0, atout: "300m plage, jardin clôturé" },
              { nom: "Villa Beauregard", type: "4⭐", adr: 317, score: 9.4, reviews: 10, atout: "Piscine vue, billard" },
              { nom: "Libre Lune (ta voisine)", type: "4⭐", adr: 321, score: 10, reviews: 3, atout: "Même lotissement Clos de Bellevue" },
              { nom: "Villa Corazon", type: "4⭐", adr: 308, score: 9.4, reviews: 6, atout: "Piscine eau salée + vue" },
              { nom: "Villa Vamos a la Playa", type: "3⭐", adr: 263, score: 9.0, reviews: 2, atout: "5 min plage à pied" },
              { nom: "Villa Ti Paradis", type: "4⭐", adr: 232, score: 9.0, reviews: 8, atout: "Piscine, climatisation" },
              { nom: "Villa Mango", type: "4⭐", adr: 209, score: 8.7, reviews: 23, atout: "150m plage" },
              { nom: "KORN LAMBIS", type: "4⭐", adr: 193, score: 8.6, reviews: 16, atout: "Quartier Les Coteaux" },
              { nom: "Villa la Cécilia", type: "3⭐", adr: 141, score: 7.7, reviews: 10, atout: "Piscine basique" },
            ],
          },
          geko: {
            label: "T2 · 1 ch · piscine privée · sans vue mer · 45m²",
            zone: "Sainte-Luce",
            adrActuel: 139,
            mediane: 130,
            top: 180,
            min: 100,
            note: "T2 avec piscine PRIVÉE rare à Sainte-Luce — benchmark estimé entre studios à piscine partagée et villas 1ch",
            comparables: [
              { nom: "Studio Corail (piscine + jacuzzi)", type: "3⭐", adr: 103, score: 9.5, reviews: 30, atout: "Piscine partagée + jacuzzi" },
              { nom: "Studio de rêve P&V", type: "4⭐", adr: 107, score: 9.0, reviews: 34, atout: "Village vacances rénové" },
              { nom: "TROPIC Premium vue mer", type: "4⭐", adr: 124, score: 9.0, reviews: 14, atout: "Vue mer P&V" },
              { nom: "Studio Tropical vue mer", type: "4⭐", adr: 121, score: 9.5, reviews: 53, atout: "Hôtelier vue mer" },
              { nom: "Vacances972", type: "4⭐", adr: 123, score: 7.8, reviews: 26, atout: "Piscine partagée résidence" },
              { nom: "Babzou apt vue mer P&V", type: "4⭐", adr: 130, score: 9.1, reviews: 8, atout: "Vue mer" },
              { nom: "Appart Hotel terrasse vue mer", type: "3⭐", adr: 130, score: 8.7, reviews: 56, atout: "Piscine + terrasse" },
            ],
          },
          zandoli: {
            label: "T2 · 1 ch · piscine privée · vue jardin/mer · 50m²",
            zone: "Sainte-Luce",
            adrActuel: 132,
            mediane: 145,
            top: 200,
            min: 110,
            note: "Avec piscine privée + vue mer, positionné au-dessus du marché standard",
            comparables: [
              { nom: "Studio Tropical vue mer", type: "4⭐", adr: 121, score: 9.5, reviews: 53, atout: "Vue mer mais piscine partagée" },
              { nom: "Babzou apt vue mer P&V", type: "4⭐", adr: 130, score: 9.1, reviews: 8, atout: "Vue mer" },
              { nom: "Appart Hotel terrasse vue mer", type: "3⭐", adr: 130, score: 8.7, reviews: 56, atout: "Terrasse vue mer" },
              { nom: "TROPIC Premium vue mer", type: "4⭐", adr: 124, score: 9.0, reviews: 14, atout: "Premium vue mer" },
              { nom: "Studio Corail", type: "3⭐", adr: 103, score: 9.5, reviews: 30, atout: "Piscine + jacuzzi partagés" },
            ],
          },
          mabouya: {
            label: "Studio · jacuzzi privé · vue mer · 30m²",
            zone: "Sainte-Luce",
            adrActuel: 82,
            mediane: 115,
            top: 140,
            min: 60,
            note: "Jacuzzi privé + vue mer = différenciation forte, ton ADR est très en-dessous du potentiel",
            comparables: [
              { nom: "Studio cosy 50m plage", type: "—", adr: 58, score: null, reviews: 0, atout: "Proche plage, basique" },
              { nom: "Studio Antigua 03", type: "4⭐", adr: 62, score: 9.2, reviews: 26, atout: "Village vacances" },
              { nom: "2 T1 Hibiscus et Colibris", type: "3⭐", adr: 63, score: 9.1, reviews: 78, atout: "Bord plage" },
              { nom: "Studio Corail", type: "3⭐", adr: 103, score: 9.5, reviews: 30, atout: "Piscine + jacuzzi partagés" },
              { nom: "Studio de rêve P&V", type: "4⭐", adr: 107, score: 9.0, reviews: 34, atout: "Rénové 2025" },
              { nom: "Studio Tropical vue mer", type: "4⭐", adr: 121, score: 9.5, reviews: 53, atout: "Vue mer + résidence hôtelière" },
              { nom: "Babzou vue mer P&V", type: "4⭐", adr: 130, score: 9.1, reviews: 8, atout: "Vue mer haut de gamme" },
            ],
          },
          schoelcher: {
            label: "T2 · 1 ch · vue mer exceptionnelle · sans piscine · 40m²",
            zone: "Schœlcher",
            adrActuel: 93,
            mediane: 100,
            top: 125,
            min: 47,
            comparables: [
              { nom: "Bel appartement Studiotel", type: "4⭐", adr: 61, score: 8.7, reviews: 27, atout: "Sans vue mer" },
              { nom: "Le Coin Détente", type: "4⭐", adr: 70, score: 8.8, reviews: 8, atout: "Bord plage" },
              { nom: "Mon petit cocon", type: "3⭐", adr: 84, score: 8.0, reviews: 89, atout: "Madiana plage" },
              { nom: "3soleils", type: "4⭐", adr: 91, score: 9.5, reviews: 30, atout: "Standing" },
              { nom: "F2 avec vue mer", type: "4⭐", adr: 100, score: 8.8, reviews: 6, atout: "Vue mer + ascenseur" },
              { nom: "Élégant F2 pieds dans l'eau", type: "3⭐", adr: 125, score: 9.4, reviews: 13, atout: "Pieds dans l'eau" },
              { nom: "F2 Stay in Cluny (FdF)", type: "3⭐", adr: 100, score: 9.7, reviews: 34, atout: "Piscine extérieure" },
            ],
          },
          nogent: {
            label: "T2 · 1 ch · terrasse + jardin privé · 45m²",
            zone: "Nogent-sur-Marne",
            adrActuel: 98,
            mediane: 135,
            top: 161,
            min: 69,
            note: "Terrasse + jardin privé = atout très rare en banlieue parisienne. Très probablement sous-coté.",
            comparables: [
              { nom: "Appt Champigny", type: "3⭐", adr: 69, score: 8.3, reviews: 3, atout: "Basique" },
              { nom: "Appart'hotel Vacancéole", type: "3⭐", adr: 75, score: 7.4, reviews: 884, atout: "Quai de Marne (volume)" },
              { nom: "Cozy Marne", type: "3⭐", adr: 117, score: 8.7, reviews: 3, atout: "Climatisation" },
              { nom: "Studios Albri", type: "3⭐", adr: 134, score: 9.1, reviews: 90, atout: "Parking, animations" },
              { nom: "Studio Urbain Spa", type: "—", adr: 138, score: null, reviews: 0, atout: "Jacuzzi + jardin" },
              { nom: "Appt Standing Portes de Paris", type: "3⭐", adr: 154, score: 8.7, reviews: 47, atout: "Jardin + terrasse" },
              { nom: "Charmant appartement", type: "3⭐", adr: 161, score: 9.0, reviews: 19, atout: "Centre Strasbourg" },
            ],
          },
        };

        // Mapping bien → benchmark
        const BIEN_TO_BENCH = {
          amaryllis: "amaryllis",
          geko: "geko",
          zandoli: "zandoli",
          mabouya: "mabouya",
          schoelcher: "schoelcher",
          nogent: "nogent",
        };

        // Calcul positionnement par bien
        const biensWithBench = biens.filter(b => b.type !== "long" && BIEN_TO_BENCH[b.id]).map(b => {
          const bench = BENCHMARKS[BIEN_TO_BENCH[b.id]];
          const adrActuel = avgN(b.adr, n) || b.adr2025 || bench.adrActuel;
          const ratio = bench.mediane > 0 ? adrActuel / bench.mediane : 1;
          const positionnement = ratio < 0.8 ? "sous-coté" : ratio < 1.05 ? "aligné" : ratio < 1.3 ? "premium" : "haut-marché";
          const couleurPos = ratio < 0.8 ? "#10b981" : ratio < 1.05 ? "#0ea5e9" : ratio < 1.3 ? "#f59e0b" : "#ef4444";
          return { ...b, bench, adrActuel, ratio, positionnement, couleurPos };
        });

        return (
          <div>
            {/* Disclaimer source */}
            <div style={{ background: "linear-gradient(135deg,rgba(14,165,233,0.1),rgba(99,102,241,0.06))", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 13, padding: "13px 16px", marginBottom: 18, fontSize: 11, color: "#cbd5e1", lineHeight: 1.6 }}>
              📊 <strong>Source :</strong> Booking.com pour la semaine du 4-11 juillet 2026 (haute saison été — typiquement +15-25% vs moyenne annuelle).
              Filtres appliqués par bien : <strong>nombre de chambres, type de piscine (privée vs partagée), vue mer, équipements</strong>.
              <br/>🎯 <strong>Ta Villa Amaryllis est listée sur Booking</strong> à 467€/nuit en juillet (note 9.6/10, 9 avis), top tier du marché Sainte-Luce.
            </div>

            {/* Synthèse positionnement */}
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>
              📍 Positionnement par bien (médiane comparables même catégorie)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {biensWithBench.map(b => (
                <div key={b.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 11, border: `1px solid ${b.couleurPos}33`, borderLeft: `3px solid ${b.couleurPos}`, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span style={{ fontSize: 19 }}>{b.emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 2 }}>{b.nom}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{b.bench.label} · {b.bench.zone}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 8, background: b.couleurPos + "22", color: b.couleurPos, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {b.positionnement}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, alignItems: "center", flexWrap: "wrap", marginBottom: 7 }}>
                    <div>
                      <span style={{ color: "#64748b" }}>Ton ADR moyen : </span>
                      <span style={{ color: "#f59e0b", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{Math.round(b.adrActuel)}€</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Médiane marché : </span>
                      <span style={{ color: "#0ea5e9", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{b.bench.mediane}€</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Range : </span>
                      <span style={{ color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{b.bench.min}-{b.bench.top}€</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Écart : </span>
                      <span style={{ color: b.couleurPos, fontWeight: 700 }}>{b.ratio >= 1 ? "+" : ""}{Math.round((b.ratio - 1) * 100)}%</span>
                    </div>
                  </div>
                  {/* Position bar */}
                  <div style={{ position: "relative", height: 8, background: "linear-gradient(to right, #10b981 0%, #0ea5e9 35%, #f59e0b 65%, #ef4444 100%)", borderRadius: 4, marginTop: 8 }}>
                    {/* Médiane marker */}
                    <div style={{ position: "absolute", left: `${Math.min(((b.bench.mediane - b.bench.min) / (b.bench.top - b.bench.min)) * 100, 100)}%`, top: -3, width: 2, height: 14, background: "#fff", transform: "translateX(-50%)" }} />
                    {/* Position du bien */}
                    <div style={{ position: "absolute", left: `${Math.min(Math.max(((b.adrActuel - b.bench.min) / (b.bench.top - b.bench.min)) * 100, 0), 100)}%`, top: -5, width: 14, height: 18, background: b.couleurPos, borderRadius: 7, transform: "translateX(-50%)", border: "2px solid #0a0f1e" }} title={`${Math.round(b.adrActuel)}€`} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginTop: 4 }}>
                    <span>{b.bench.min}€</span>
                    <span style={{ color: "#94a3b8" }}>médiane {b.bench.mediane}€</span>
                    <span>{b.bench.top}€</span>
                  </div>
                  {b.bench.note && (
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 7, fontStyle: "italic" }}>
                      💡 {b.bench.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Lectures stratégiques */}
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>
              💡 Lectures stratégiques par bien
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {biensWithBench.filter(b => b.ratio < 0.8).map(b => (
                <div key={`low-${b.id}`} style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", borderLeft: "3px solid #10b981", borderRadius: 9, padding: "11px 14px" }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, marginBottom: 4 }}>
                    {b.emoji} {b.nom} · sous-coté de {Math.round((1 - b.ratio) * 100)}%
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.5 }}>
                    Tu pratiques <strong>{Math.round(b.adrActuel)}€</strong> alors que la médiane des biens équivalents est <strong>{b.bench.mediane}€</strong>.
                    Si ton occupation est déjà bonne (&gt;65%), tu peux probablement passer à <strong style={{ color: "#10b981" }}>{Math.round(b.bench.mediane * 0.9)}-{Math.round(b.bench.mediane)}€</strong> sans perdre de réservations.
                    Gain potentiel annuel : <strong style={{ color: "#10b981" }}>~{fmt(Math.round((b.bench.mediane - b.adrActuel) * 365 * 0.5))}</strong> (à 50% occupation).
                  </div>
                </div>
              ))}
              {biensWithBench.filter(b => b.ratio >= 1.3).map(b => (
                <div key={`high-${b.id}`} style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderLeft: "3px solid #ef4444", borderRadius: 9, padding: "11px 14px" }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, marginBottom: 4 }}>
                    {b.emoji} {b.nom} · au-dessus du marché de +{Math.round((b.ratio - 1) * 100)}%
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.5 }}>
                    Vérifie ton taux d'occupation. Si faible (&lt;50%), une baisse à <strong style={{ color: "#f59e0b" }}>{Math.round(b.bench.mediane * 1.1)}€</strong> (10% au-dessus du marché) pourrait remplir et augmenter le RevPAR.
                    Si occupation OK, garde — c'est justifié.
                  </div>
                </div>
              ))}
              {biensWithBench.filter(b => b.ratio >= 0.8 && b.ratio < 1.3).map(b => (
                <div key={`ok-${b.id}`} style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.2)", borderLeft: "3px solid #0ea5e9", borderRadius: 9, padding: "11px 14px" }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, marginBottom: 4 }}>
                    {b.emoji} {b.nom} · bien positionné
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.5 }}>
                    Ton prix est cohérent avec le marché. Focus sur la <strong>conversion</strong> : photos pro, descriptions optimisées, accumulation d'avis 9+ pour pouvoir monter de 10-15% plus tard.
                  </div>
                </div>
              ))}
            </div>

            {/* Comparables détaillés par bien */}
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>
              🏘 Comparables détaillés par bien
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
              {biensWithBench.map(b => (
                <details key={`det-${b.id}`} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 11, padding: "10px 14px" }}>
                  <summary style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", cursor: "pointer" }}>
                    {b.emoji} {b.nom} — {b.bench.comparables.length} comparables ({b.bench.zone})
                  </summary>
                  <div style={{ overflowX: "auto", marginTop: 10 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                          {["Nom", "Type", "ADR/nuit", "Note", "Avis", "Atout"].map(h => (
                            <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.bench.comparables.map((c, i) => (
                          <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: c.mine ? "rgba(245,158,11,0.08)" : "transparent" }}>
                            <td style={{ padding: "7px 8px", color: c.mine ? "#f59e0b" : "#e2e8f0", fontSize: 11, fontWeight: c.mine ? 700 : 500 }}>
                              {c.mine && "⭐ "}{c.nom}
                            </td>
                            <td style={{ padding: "7px 8px", color: "#94a3b8", fontSize: 10 }}>{c.type}</td>
                            <td style={{ padding: "7px 8px", color: "#0ea5e9", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{c.adr}€</td>
                            <td style={{ padding: "7px 8px", color: c.score >= 9 ? "#10b981" : c.score >= 8 ? "#f59e0b" : "#94a3b8", fontSize: 11, fontFamily: "var(--font-mono)" }}>{c.score || "—"}</td>
                            <td style={{ padding: "7px 8px", color: "#64748b", fontSize: 10 }}>{c.reviews || "—"}</td>
                            <td style={{ padding: "7px 8px", color: "#94a3b8", fontSize: 10 }}>{c.atout}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>

            {/* Saisonnalité */}
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>
              🌴 Saisonnalité Martinique — repères de pricing
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 14, marginBottom: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginBottom: 6 }}>🟢 HAUTE saison (+20-40%)</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: "#cbd5e1", lineHeight: 1.7 }}>
                    <li>Dec 15 → Jan 5 : fêtes de fin d'année</li>
                    <li>Fév-Mars : carnaval + vacances scolaires</li>
                    <li>Avril-Pâques : vacances européennes</li>
                    <li>Juillet-août : été métropolitain</li>
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, marginBottom: 6 }}>🔴 BASSE saison (-15-25%)</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: "#cbd5e1", lineHeight: 1.7 }}>
                    <li>Mai-juin : période d'épargne ménages</li>
                    <li>Septembre-octobre : saison cyclonique</li>
                    <li>Novembre 1er → 15 décembre : creux pré-fêtes</li>
                    <li>Lundi-jeudi hors vacances scolaires</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 9, fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>
              ⚠ Snapshot juillet 2026 (haute saison). Pour une tarification dynamique continue, considérer PriceLabs ou Beyond Pricing (~25€/mois/bien).
            </div>
          </div>
        );
      })()}

      {view === "fiscal" && (
        <div>
          {/* KPIs fiscaux */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 140, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Projection annuelle 2026</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#0ea5e9", fontFamily: "var(--font-mono)" }}>{fmt(projAnnuelle)}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>YTD {fmt(ytd)} extrapolé</div>
            </div>
            <div style={{ flex: 1, minWidth: 140, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Court+moyen terme</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#f59e0b", fontFamily: "var(--font-mono)" }}>{fmt(projCourt)}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Régime BIC meublé non classé</div>
            </div>
            <div style={{ flex: 1, minWidth: 140, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Location longue (Iguana)</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#10b981", fontFamily: "var(--font-mono)" }}>{fmt(projLong)}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Régime micro-foncier ou réel</div>
            </div>
            <div style={{ flex: 1, minWidth: 140, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Base imposable estimée</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#a855f7", fontFamily: "var(--font-mono)" }}>{fmt(revenusImposables)}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Après abattements</div>
            </div>
          </div>

          {/* Seuils */}
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>Seuils fiscaux 2026</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {seuils.map((s, i) => {
              const pct = Math.min((s.current / s.plafond) * 100, 110);
              const alert = pct >= 90;
              const warn = pct >= 70;
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${alert ? "#ef444466" : warn ? "#f59e0b44" : "#33415544"}`, borderRadius: 11, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{s.info}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: alert ? "#ef4444" : warn ? "#f59e0b" : "#10b981", fontFamily: "var(--font-mono)" }}>
                        {fmt(s.current)} / {fmt(s.plafond)}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{pct.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: alert ? "#ef4444" : warn ? "#f59e0b" : "#10b981", borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                  {alert && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>⚠ Plafond dépassé ou imminent — basculer en régime réel</div>}
                </div>
              );
            })}
          </div>

          <div style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 11, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 600, marginBottom: 6 }}>💡 À retenir</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: "#cbd5e1", lineHeight: 1.6 }}>
              <li>Au-delà de 15 000€/an en meublé non classé, abattement micro-BIC tombe à 30%</li>
              <li>Le classement "meublé de tourisme" remonte l'abattement à 71% jusqu'à 188 700€</li>
              <li>Au-delà de 23 000€ et &gt; 50% des revenus globaux → statut LMP (Loueur en Meublé Pro)</li>
              <li>Régime réel : déduction des charges réelles + amortissement du bien → souvent plus avantageux au-delà de 40-50k€</li>
            </ul>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 8, fontStyle: "italic" }}>
              Ces informations sont indicatives — consulte un comptable pour ta situation.
            </div>
          </div>
        </div>
      )}

      {view === "conseil" && (() => {
        // Analyse de la situation
        const projCT = projCourt;
        const projLT = projLong;
        const projTotal = projAnnuelle;
        const biensCT = biens.filter(b => b.type !== "long");
        const biensLT = biens.filter(b => b.type === "long");
        // Pour chaque bien CT, projection annuelle individuelle
        const projParBien = biens.map(b => ({
          ...b,
          proj: n > 0 ? Math.round(sumN(b.revenus, n) * 12 / n) : 0,
        }));
        const biensAuDessusDe15k = projParBien.filter(b => b.type !== "long" && b.proj > 15000);
        const estLMP = projTotal >= 23000;

        return (
          <div>
            {/* Bandeau analyse situation */}
            <div style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.12),rgba(99,102,241,0.06))", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 14, padding: 18, marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                🎯 Analyse de ta situation
              </div>
              <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.7 }}>
                Avec une projection de <strong style={{ color: "#0ea5e9" }}>{fmt(projTotal)}</strong> de revenus locatifs en 2026 :
              </div>
              <ul style={{ margin: "10px 0 0", paddingLeft: 20, fontSize: 12, color: "#cbd5e1", lineHeight: 1.8 }}>
                <li>
                  <strong>Statut probable : {estLMP ? "LMP (Loueur Meublé Professionnel)" : "LMNP"}</strong>
                  {estLMP && <span style={{ color: "#94a3b8" }}> — recettes &gt; 23 000€. À confirmer : doivent aussi représenter &gt; 50% du revenu global du foyer.</span>}
                </li>
                <li>
                  <strong>{biensAuDessusDe15k.length} bien(s) court terme au-dessus de 15 000€</strong> ({biensAuDessusDe15k.map(b => b.nom.replace("Villa ", "").replace("T2 ", "")).join(", ")}).
                  {" "}Si non classés en meublé de tourisme → <span style={{ color: "#ef4444" }}>régime réel obligatoire</span> (loi Le Meur 2024).
                </li>
                <li>
                  <strong>Iguana (location longue)</strong> : régime micro-foncier ou réel foncier. Plafond micro-foncier 15 000€, abattement 30%.
                </li>
              </ul>
            </div>

            {/* Tableau comparatif des régimes */}
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>
              📊 Comparatif des régimes fiscaux (revenus 2025-2026)
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden", marginBottom: 18 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 740 }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Régime</th>
                      <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 10, color: "#64748b", fontWeight: 600 }}>Plafond CA</th>
                      <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 10, color: "#64748b", fontWeight: 600 }}>Abattement</th>
                      <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 10, color: "#64748b", fontWeight: 600 }}>Charges déductibles</th>
                      <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 10, color: "#64748b", fontWeight: 600 }}>Cotis. sociales</th>
                      <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 10, color: "#64748b", fontWeight: 600 }}>Pour qui</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 12px", fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: "#e2e8f0" }}>Micro-BIC</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>Meublé non classé</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#ef4444", fontWeight: 600 }}>15 000€</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#ef4444" }}>30%</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>Non</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>17.2% PS</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#64748b" }}>Petits volumes, pas de charges</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 12px", fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: "#e2e8f0" }}>Micro-BIC</div>
                        <div style={{ fontSize: 9, color: "#10b981" }}>Meublé classé ⭐ (1-5⭐)</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#0ea5e9", fontWeight: 600 }}>83 600€</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#0ea5e9" }}>50%</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>Non</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>17.2% PS</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#64748b" }}>Bons biens, simplicité</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(16,185,129,0.04)" }}>
                      <td style={{ padding: "10px 12px", fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: "#10b981" }}>LMNP au RÉEL ⭐</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>Recommandé &gt;30k€</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 600 }}>Pas de plafond</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#10b981" }}>—</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#10b981" }}>✓ Toutes + amortissement</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>17.2% PS</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#64748b" }}>Crédit, charges, gros CA</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(245,158,11,0.04)" }}>
                      <td style={{ padding: "10px 12px", fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: "#f59e0b" }}>LMP (Pro)</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>&gt;23k€ ET &gt;50% revenus</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#f59e0b", fontWeight: 600 }}>Pas de plafond</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#f59e0b" }}>Réel obligatoire</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#10b981" }}>✓ + déficit imputable</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#ef4444" }}>URSSAF ~35-40%</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#64748b" }}>Activité principale</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 12px", fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: "#e2e8f0" }}>Location nue</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>Micro-foncier</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#94a3b8" }}>15 000€</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#94a3b8" }}>30%</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>Non</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>17.2% PS</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#64748b" }}>Iguana (long terme)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommandations personnalisées */}
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>
              ✅ Actions recommandées pour ta situation
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              {[
                {
                  priorite: "🔴 Urgent",
                  c: "#ef4444",
                  bg: "rgba(239,68,68,0.06)",
                  titre: "Faire classer tes 6 meublés de tourisme",
                  desc: "Avec la loi Le Meur, le non-classé est à 15k€/30%. Le classement (1 à 5 étoiles via Atout France) te redonne 83 600€/50% en micro-BIC. Coût ~150-250€ par bien, valable 5 ans. ROI : énorme — passe de 30% à 50% d'abattement.",
                  action: "Contacter un organisme accrédité (Atout France) pour visite. 4-6 semaines de délai."
                },
                {
                  priorite: "🔴 Urgent",
                  c: "#ef4444",
                  bg: "rgba(239,68,68,0.06)",
                  titre: "Confirmer ton statut LMP/LMNP",
                  desc: `Avec ${fmt(projTotal)} de recettes, tu dépasses 23k€. Tu passes en LMP SI ces recettes représentent plus de 50% des revenus d'activité de ton foyer (salaires + BIC + BNC). Le LMP entraîne des cotisations URSSAF (~35-40%) mais avantage : déficit déductible des revenus globaux et exonération IFI.`,
                  action: "Vérifier ton revenu global N-1 avec ton comptable. Si LMP avéré : déclaration P0i auprès de l'INPI (gratuit, 15 jours)."
                },
                {
                  priorite: "🟠 Important",
                  c: "#f59e0b",
                  bg: "rgba(245,158,11,0.06)",
                  titre: "Passer au régime RÉEL si pas déjà fait",
                  desc: `Tu as ~5 700€/mois de charges fixes + ~14k€/an de commissions plateformes + amortissement potentiel ~5-7k€/an par bien sur 25-30 ans. Total déductible probablement &gt;60% des revenus → bien au-dessus du 50% du micro-BIC classé. Le réel + amortissement peut souvent ramener l'imposition à zéro pendant plusieurs années.`,
                  action: "Option à exercer avant la déclaration de printemps. Compta spécialisé LMNP/LMP : 800-1 500€/an."
                },
                {
                  priorite: "🟡 À planifier",
                  c: "#eab308",
                  bg: "rgba(234,179,8,0.06)",
                  titre: "Anticiper la plus-value à la revente",
                  desc: "Depuis la loi de finances 2025, les amortissements pratiqués en LMNP au réel sont REINTÉGRÉS dans le calcul de la plus-value imposable lors de la revente. Si tu prévois de garder &lt; 22 ans, ça pèse. Au-delà de 22 ans : exonération IR ; au-delà de 30 ans : exonération totale.",
                  action: "Définir ta stratégie de sortie par bien. Pour les biens à garder 30+ ans : foncer sur le réel sans hésiter."
                },
                {
                  priorite: "🟢 Optimisation",
                  c: "#10b981",
                  bg: "rgba(16,185,129,0.06)",
                  titre: "Engager un expert-comptable spécialisé LMP",
                  desc: "À ton niveau de revenus (>150k€), un comptable LMP-spécialisé devient indispensable. Il calcule l'amortissement optimal, gère la TVA si tu approches 91 900€, optimise les déductions, sécurise face à l'URSSAF. Coût ~1 000-2 000€/an, retour souvent x5-10 en économie d'impôts.",
                  action: "Cabinets spécialisés : Jedeclaremonmeuble.com, ComptaBoss, Decla.fr, ou comptable local LMP."
                },
                {
                  priorite: "🟢 Optimisation",
                  c: "#10b981",
                  bg: "rgba(16,185,129,0.06)",
                  titre: "Surveiller le seuil TVA à 91 900€ par bien",
                  desc: "Le seuil de franchise de TVA s'applique par activité. En location de tourisme avec prestations para-hôtelières (ménage, linge, accueil...), tu peux être assujetti à la TVA dès 91 900€. Heureusement, sans para-hôtelier, location meublée pure = pas de TVA quel que soit le CA.",
                  action: "Vérifier ce que tu factures (ménage inclus ? draps ? café d'accueil ?) pour savoir si tu rentres dans la para-hôtellerie."
                },
              ].map((r, i) => (
                <div key={i} style={{ background: r.bg, border: `1px solid ${r.c}33`, borderLeft: `3px solid ${r.c}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{r.titre}</div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: r.c + "22", color: r.c, fontWeight: 600, whiteSpace: "nowrap" }}>{r.priorite}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.6, marginBottom: 6 }}>{r.desc}</div>
                  <div style={{ fontSize: 11, color: r.c, fontWeight: 600, padding: "5px 9px", background: "rgba(0,0,0,0.2)", borderRadius: 6, display: "inline-block" }}>
                    👉 {r.action}
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 9 }}>
              ❓ FAQ rapide
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
              {[
                {
                  q: "C'est quoi la différence concrète entre LMNP et LMP ?",
                  a: "LMNP : tu déclares en BIC sur ta 2042-C-PRO, pas de cotisations URSSAF (juste 17.2% prélèvements sociaux). LMP : tu déclares pareil mais tu paies l'URSSAF (~35-40% sur le bénéfice), tu peux imputer le déficit sur ton revenu global, tu es exonéré d'IFI, et en cas de revente la plus-value est en BIC pro (régime des plus-values pro avec exonérations possibles après 5 ans d'activité)."
                },
                {
                  q: "Comment je sais si je suis classé LMP ?",
                  a: "C'est automatique selon ta situation. Les 2 conditions cumulatives : recettes locatives ≥ 23 000€/an ET recettes ≥ 50% des autres revenus d'activité du foyer (salaires, autres BIC, BNC...). Les revenus de capitaux (dividendes, fonciers nus, plus-values) ne comptent pas. Si l'une des conditions n'est pas remplie, tu restes LMNP."
                },
                {
                  q: "Faut-il créer une SCI pour mes locations ?",
                  a: "SCI = location nue ou IS. SCI à l'IR ne peut pas louer en meublé sans risquer la requalification. SCI à l'IS peut louer meublé sans LMP mais : double imposition (IS puis dividendes), pas d'abattement plus-value pour durée détention, comptabilité lourde. Pour 90% des cas : SCI = mauvaise idée pour location meublée. Reste en nom propre."
                },
                {
                  q: "Combien ça coûte un classement meublé de tourisme ?",
                  a: "150-250€ par bien (organisme accrédité), valable 5 ans. Visite ~1h, check d'une grille de 112 critères, attribution 1 à 5 étoiles. Démarche via Atout France (atout-france.fr). Indispensable pour rester en micro-BIC au-delà de 15 000€."
                },
                {
                  q: "L'amortissement c'est quoi exactement ?",
                  a: "Au régime réel uniquement. Tu peux 'amortir' comptablement la valeur de ton bien sur 25-30 ans (immobilier) et de ton mobilier sur 5-10 ans. Exemple : bien acheté 200k€ → amortissement de ~7 000€/an déductible des revenus locatifs. Mais cet amortissement est REINTEGRÉ dans la plus-value imposable au moment de la revente depuis 2025."
                },
                {
                  q: "Et la SARL de famille ?",
                  a: "C'est la seule structure qui permet de louer en meublé tout en restant à l'IR (et éviter la double imposition de la SCI à l'IS). Avantage : transmission facilitée, plusieurs associés. Inconvénient : comptabilité commerciale, formalisme. À étudier si tu prévois de transmettre ou d'associer tes enfants."
                },
              ].map((f, i) => (
                <details key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <summary style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", cursor: "pointer" }}>{f.q}</summary>
                  <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.6, marginTop: 8, paddingLeft: 4 }}>{f.a}</div>
                </details>
              ))}
            </div>

            {/* Disclaimer */}
            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "11px 14px", fontSize: 11, color: "#cbd5e1", lineHeight: 1.6 }}>
              ⚠ <strong>Important :</strong> ces informations sont indicatives et basées sur la législation française 2026 (loi Le Meur du 19/11/2024, loi de finances 2025-2026). Elles ne remplacent pas un conseil personnalisé. Vu l'ampleur de ton activité (&gt;160k€/an), un expert-comptable spécialisé LMNP/LMP est <strong>indispensable</strong> — l'économie d'impôts dépasse largement le coût (~1 000-2 000€/an).
            </div>
          </div>
        );
      })()}

      {view === "detail" && (
        <div>
          {/* KPI total charges */}
          <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Total charges 2025 (annuel)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444", fontFamily: "var(--font-mono)" }}>{fmt(totalCharges2025)}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Soit {fmt(Math.round(totalCharges2025 / 12))}/mois</div>
          </div>

          {/* Camembert détail postes + stacked bar par bien */}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Répartition par poste</div>
              <ResponsiveContainer width="100%" height={mob ? 180 : 220}>
                <PieChart>
                  <Pie data={chargeBreakdown} dataKey="value" nameKey="l" cx="50%" cy="50%" innerRadius={mob ? 35 : 50} outerRadius={mob ? 70 : 90} paddingAngle={1}>
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
                    <span style={{ color: "#64748b", fontFamily: "var(--font-mono)" }}>{fmtK(d.value)} ({((d.value / totalCharges2025) * 100).toFixed(0)}%)</span>
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
                  {POSTES_CHARGES.map(p => (
                    <Bar key={p.k} dataKey={p.l} stackId="a" fill={p.c} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tableau matriciel */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              Détail matriciel par bien et poste (annuel 2025)
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
