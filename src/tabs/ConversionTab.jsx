/**
 * ConversionTab — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState } from "react";
import { fmt } from "../App.jsx";
import { useAppData } from "../AppDataContext.jsx";

export default function ConversionTab() {
  const { biens, reservations, mob } = useAppData();
  const [period, setPeriod] = useState("12");

  const cutoff = (() => {
    const d = new Date();
    if (period === "ytd") return `${d.getFullYear()}-01-01`;
    d.setMonth(d.getMonth() - parseInt(period, 10));
    return d.toISOString().slice(0, 10);
  })();

  const filtered = reservations.filter(r => r.checkin >= cutoff);

  const CANAL_COLORS = { direct: "#10b981", airbnb: "#f59e0b", booking: "#0ea5e9", autre: "#a855f7" };
  const CANAL_LABELS = { direct: "Réservation directe", airbnb: "Airbnb", booking: "Booking.com", autre: "Autre" };

  const statsMap = {};
  filtered.forEach(r => {
    const raw = (r.canal || "autre").toLowerCase();
    const canal = ["direct", "airbnb", "booking"].find(c => raw.includes(c)) || "autre";
    if (!statsMap[canal]) statsMap[canal] = { canal, count: 0, rev: 0, nights: 0 };
    statsMap[canal].count++;
    statsMap[canal].rev += Number(r.montant) || 0;
    if (r.checkin && r.checkout) {
      statsMap[canal].nights += Math.max(0, Math.round((new Date(r.checkout) - new Date(r.checkin)) / 86400000));
    }
  });

  const stats = Object.values(statsMap).map(s => ({
    ...s,
    label: CANAL_LABELS[s.canal] || s.canal,
    color: CANAL_COLORS[s.canal] || "#64748b",
    avgRev: s.count ? Math.round(s.rev / s.count) : 0,
    avgNights: s.count ? (s.nights / s.count).toFixed(1) : 0,
  })).sort((a, b) => b.rev - a.rev);

  const bienStats = biens.map(b => {
    const resas = filtered.filter(r => r.bienId === b.id);
    const rev = resas.reduce((s, r) => s + (Number(r.montant) || 0), 0);
    const directCount = resas.filter(r => (r.canal || "").toLowerCase() === "direct").length;
    return { ...b, count: resas.length, rev, pctDirect: resas.length ? Math.round(directCount / resas.length * 100) : 0 };
  }).filter(b => b.count > 0).sort((a, z) => z.rev - a.rev);

  const totalRev   = stats.reduce((s, c) => s + c.rev, 0);
  const totalResas = filtered.length;
  const directResas = filtered.filter(r => (r.canal || "").toLowerCase() === "direct").length;

  const convCard = { background: "#1e293b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 };
  const selInp   = { padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, cursor: "pointer" };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>💳 Conversion par canal</h2>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>Répartition des réservations et revenus par source</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} style={selInp}>
          <option value="1">1 mois</option>
          <option value="3">3 mois</option>
          <option value="6">6 mois</option>
          <option value="ytd">Année en cours</option>
          <option value="12">12 mois</option>
          <option value="24">24 mois</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Réservations",   val: totalResas,   color: "#f1f5f9", fmt: v => v },
          { label: "Revenus totaux", val: totalRev,     color: "#10b981", fmt: v => `${v.toLocaleString("fr-FR")} €` },
          { label: "Panier moyen",   val: totalResas ? Math.round(totalRev / totalResas) : 0, color: "#0ea5e9", fmt: v => `${v.toLocaleString("fr-FR")} €` },
          { label: "% direct",       val: totalResas ? Math.round(directResas / totalResas * 100) : 0, color: "#10b981", fmt: v => `${v}%` },
        ].map(k => (
          <div key={k.label} style={{ ...convCard, marginBottom: 0, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.fmt(k.val)}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {stats.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#475569" }}>Aucune réservation sur la période</div>
      ) : (
        <div style={convCard}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Revenus par canal</div>
          <div style={{ padding: "12px 16px" }}>
            {stats.map(s => {
              const pct = totalRev > 0 ? Math.round(s.rev / totalRev * 100) : 0;
              return (
                <div key={s.canal} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.rev.toLocaleString("fr-FR")} € · {pct}%</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: 4, transition: "width 0.4s" }} />
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#64748b" }}>
                    <span>{s.count} réservation{s.count > 1 ? "s" : ""}</span>
                    <span>Moy. {s.avgRev.toLocaleString("fr-FR")} €/séjour</span>
                    <span>Moy. {s.avgNights} nuit{Number(s.avgNights) > 1 ? "s" : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {bienStats.length > 0 && (
        <div style={convCard}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Réservations par logement</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
              <thead>
                <tr>
                  {["Logement", "Réservations", "Revenus", "% Direct"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Logement" ? "left" : "right", fontSize: 10, color: "#475569", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bienStats.map(b => (
                  <tr key={b.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#e2e8f0" }}>{b.emoji || "🏠"} {b.nom}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: "#94a3b8" }}>{b.count}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: "#10b981", fontWeight: 600 }}>{b.rev.toLocaleString("fr-FR")} €</td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: b.pctDirect >= 30 ? "#10b981" : b.pctDirect > 0 ? "#f59e0b" : "#64748b" }}>{b.pctDirect}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: "#334155", textAlign: "center", marginTop: 8 }}>
        Données issues du planning · Pour intégrer les paiements Stripe, enrichir le champ "canal" des réservations avec les metadata PaymentIntent
      </div>
    </div>
  );
}
