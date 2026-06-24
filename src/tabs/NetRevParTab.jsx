// data-060 — Net RevPAR par bien et par canal (commissions réelles incluses)
// 2025 : ventilation exacte airbnb/booking/direct (REVENUS_CANAL_2025)
// 2022-2024 : totaux depuis HIST_SEED (prop hist) + commission estimée ~15%

import { useState } from "react";
import { REVENUS_CANAL_2025 } from "../data/revenusCanal.js";
import { AIRBNB_COMM_PAR_BIEN, BOOKING_COMM, FRAIS_STRIPE } from "../config/canauxCommissions.js";

const NUITS_AN = 365;
const COMM_ESTIMEE = 0.15; // blended OTA ~2022-2024 (quasi pas de direct)

// Biens à afficher — Iguana inclus pour les années passées (court terme avant bail Joël oct 2024)
const BIENS_2025 = [
  { id: "amaryllis",  label: "Villa Amaryllis", prix: 280 },
  { id: "zandoli",   label: "Zandoli",          prix: 110 },
  { id: "geko",      label: "Géko",             prix: 110 },
  { id: "mabouya",   label: "Mabouya",          prix: 70  },
  { id: "schoelcher",label: "Schœlcher",        prix: 90  },
  { id: "nogent",    label: "Nogent",           prix: 90  },
];
const BIENS_HIST = [
  ...BIENS_2025,
  { id: "iguana", label: "Villa Iguana", prix: 180 },
];
const BIEN_LABEL = Object.fromEntries([...BIENS_HIST].map(b => [b.id, b.label]));
const BIEN_PRIX  = Object.fromEntries([...BIENS_HIST].map(b => [b.id, b.prix]));

const YEARS = [2025, 2024, 2023, 2022];
const ANNEE_COLORS = { 2022: "#475569", 2023: "#0284c7", 2024: "#7c3aed", 2025: "#059669" };

const fmt = (v) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(v)) + " €";
const pct = (v) => (v * 100).toFixed(1) + " %";

function calcNet(brut, canal, bienId) {
  if (brut === 0) return { brut: 0, comm: 0, net: 0, taux: 0 };
  let taux = 0;
  if (canal === "airbnb")  taux = AIRBNB_COMM_PAR_BIEN[bienId] ?? 0.15;
  if (canal === "booking") taux = BOOKING_COMM;
  if (canal === "direct")  taux = FRAIS_STRIPE;
  const comm = brut * taux;
  return { brut, comm, net: brut - comm, taux };
}

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 10,
  padding: "14px 16px",
};

// ── Vue 2025 — ventilation exacte par canal ───────────────────────────────────
function View2025() {
  const rows = BIENS_2025.map(b => {
    const canal = REVENUS_CANAL_2025[b.id] || {};
    const airbnb  = calcNet(canal.airbnb  || 0, "airbnb",  b.id);
    const booking = calcNet(canal.booking || 0, "booking", b.id);
    const direct  = calcNet(canal.direct  || 0, "direct",  b.id);
    const totalBrut = airbnb.brut + booking.brut + direct.brut + (canal.parking || 0);
    const totalComm = airbnb.comm + booking.comm + direct.comm;
    const totalNet  = totalBrut - totalComm;
    const revparNet = b.prix > 0 ? totalNet / NUITS_AN : 0;
    const txDirect  = totalBrut > 0 ? direct.brut / totalBrut : 0;
    return { b, airbnb, booking, direct, totalBrut, totalComm, totalNet, revparNet, txDirect };
  });

  const grandBrut = rows.reduce((s, r) => s + r.totalBrut, 0);
  const grandComm = rows.reduce((s, r) => s + r.totalComm, 0);
  const grandNet  = grandBrut - grandComm;

  const gainSim = rows.reduce((s, r) => {
    const airbnbTaux = AIRBNB_COMM_PAR_BIEN[r.b.id] ?? 0.15;
    return s + (r.airbnb.brut + r.booking.brut) * 0.20 * (Math.max(airbnbTaux, BOOKING_COMM) - FRAIS_STRIPE);
  }, 0);

  return (
    <>
      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "CA brut 2025", val: fmt(grandBrut), color: "#94a3b8" },
          { label: "Commissions OTA", val: fmt(grandComm), sub: pct(grandComm / grandBrut), color: "#f87171" },
          { label: "Net réel", val: fmt(grandNet), sub: `+${fmt(gainSim)} potentiel direct`, color: "#34d399" },
        ].map(k => (
          <div key={k.label} style={card}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.val}</div>
            {k.sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Tableau canal complet */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>Bien</th>
              {["Airbnb", "Booking.com", "Direct"].map(c => (
                <th key={c} colSpan={3} style={{ textAlign: "center", padding: "8px 6px", color: "#64748b", fontWeight: 600 }}>{c}</th>
              ))}
              <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>Net total</th>
              <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>RevPAR net/j</th>
              <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>% Direct</th>
            </tr>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <th></th>
              {["airbnb", "booking", "direct"].map(canal => [
                <th key={canal+"brut"} style={{ textAlign: "right", padding: "4px 6px", color: "#475569", fontSize: 11, fontWeight: 400 }}>Brut</th>,
                <th key={canal+"comm"} style={{ textAlign: "right", padding: "4px 6px", color: "#475569", fontSize: 11, fontWeight: 400 }}>Comm.</th>,
                <th key={canal+"net"}  style={{ textAlign: "right", padding: "4px 6px", color: "#475569", fontSize: 11, fontWeight: 400 }}>Net</th>,
              ])}
              <th></th><th></th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isAlert = row.txDirect < 0.30;
              return (
                <tr key={row.b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <td style={{ padding: "10px 10px", fontWeight: 600, color: "#cbd5e1" }}>
                    {row.b.label}
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>{row.b.prix}€/nuit</div>
                  </td>
                  {/* Airbnb */}
                  <td style={{ textAlign: "right", padding: "10px 6px", color: "#94a3b8" }}>{row.airbnb.brut > 0 ? fmt(row.airbnb.brut) : "—"}</td>
                  <td style={{ textAlign: "right", padding: "10px 6px", color: "#f87171", fontSize: 11 }}>
                    {row.airbnb.brut > 0 && (<>{`-${fmt(row.airbnb.comm)}`}<div style={{ fontSize: 10, color: "#64748b" }}>{pct(row.airbnb.taux)}</div></>)}
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 6px", color: "#10b981" }}>{row.airbnb.brut > 0 ? fmt(row.airbnb.net) : "—"}</td>
                  {/* Booking */}
                  <td style={{ textAlign: "right", padding: "10px 6px", color: "#94a3b8" }}>{row.booking.brut > 0 ? fmt(row.booking.brut) : "—"}</td>
                  <td style={{ textAlign: "right", padding: "10px 6px", color: "#f87171", fontSize: 11 }}>
                    {row.booking.brut > 0 && (<>{`-${fmt(row.booking.comm)}`}<div style={{ fontSize: 10, color: "#64748b" }}>{pct(row.booking.taux)}</div></>)}
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 6px", color: "#10b981" }}>{row.booking.brut > 0 ? fmt(row.booking.net) : "—"}</td>
                  {/* Direct */}
                  <td style={{ textAlign: "right", padding: "10px 6px", color: "#94a3b8" }}>{row.direct.brut > 0 ? fmt(row.direct.brut) : "—"}</td>
                  <td style={{ textAlign: "right", padding: "10px 6px", color: "#f87171", fontSize: 11 }}>
                    {row.direct.brut > 0 && (<>{`-${fmt(row.direct.comm)}`}<div style={{ fontSize: 10, color: "#64748b" }}>{pct(row.direct.taux)}</div></>)}
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 6px", color: "#10b981" }}>{row.direct.brut > 0 ? fmt(row.direct.net) : "—"}</td>
                  {/* Totaux */}
                  <td style={{ textAlign: "right", padding: "10px 10px", fontWeight: 700, color: "#f1f5f9" }}>{fmt(row.totalNet)}</td>
                  <td style={{ textAlign: "right", padding: "10px 10px", color: "#34d399" }}>{fmt(row.revparNet)}</td>
                  <td style={{ textAlign: "right", padding: "10px 10px" }}>
                    <span style={{ background: isAlert ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", color: isAlert ? "#f87171" : "#34d399", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 600 }}>
                      {pct(row.txDirect)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {/* Ligne totaux */}
            <tr style={{ borderTop: "2px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)", fontWeight: 700 }}>
              <td style={{ padding: "12px 10px", color: "#f1f5f9" }}>TOTAL</td>
              <td colSpan={3} style={{ textAlign: "right", padding: "12px 6px", color: "#94a3b8" }}>{fmt(rows.reduce((s,r) => s + r.airbnb.brut, 0))}</td>
              <td colSpan={3} style={{ textAlign: "right", padding: "12px 6px", color: "#94a3b8" }}>{fmt(rows.reduce((s,r) => s + r.booking.brut, 0))}</td>
              <td colSpan={3} style={{ textAlign: "right", padding: "12px 6px", color: "#94a3b8" }}>{fmt(rows.reduce((s,r) => s + r.direct.brut, 0))}</td>
              <td style={{ textAlign: "right", padding: "12px 10px", color: "#f1f5f9" }}>{fmt(grandNet)}</td>
              <td style={{ textAlign: "right", padding: "12px 10px", color: "#34d399" }}>{fmt(grandNet / NUITS_AN)}</td>
              <td style={{ textAlign: "right", padding: "12px 10px", color: "#94a3b8" }}>{pct(rows.reduce((s,r) => s + r.direct.brut, 0) / grandBrut)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Simulation gain direct */}
      <div style={{ ...card, marginTop: 24, borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.04)" }}>
        <div style={{ fontWeight: 700, color: "#34d399", marginBottom: 8, fontSize: 14 }}>
          💡 Simulation : +20% de direct sur les canaux OTA
        </div>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
          Si 20% du volume Airbnb/Booking bascule en direct (commission OTA → Stripe 1,5%) :
          gain net estimé <strong style={{ color: "#34d399" }}>{fmt(gainSim)}/an</strong>.
        </p>
        <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {rows.filter(r => r.txDirect < 0.30).map(r => {
            const airbnbTaux = AIRBNB_COMM_PAR_BIEN[r.b.id] ?? 0.15;
            const g = (r.airbnb.brut + r.booking.brut) * 0.20 * (Math.max(airbnbTaux, BOOKING_COMM) - FRAIS_STRIPE);
            return (
              <span key={r.b.id} style={{ background: "rgba(248,113,113,0.1)", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#f87171" }}>
                ⚠ {r.b.label} — {pct(r.txDirect)} direct · potentiel +{fmt(g)}/an
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Vue années historiques — totaux + commission estimée ──────────────────────
function ViewHist({ year, hist }) {
  const yearData = hist?.[year] || {};
  const biens = BIENS_HIST.filter(b => {
    const arr = yearData[b.id];
    return arr && arr.some(v => v > 0);
  });

  const rows = biens.map(b => {
    const arr = yearData[b.id] || [];
    const brut = arr.reduce((s, v) => s + (v || 0), 0);
    const comm = Math.round(brut * COMM_ESTIMEE);
    const net  = brut - comm;
    const prix = BIEN_PRIX[b.id] || b.prix;
    const revparNet = prix > 0 ? net / NUITS_AN : 0;
    return { b, brut, comm, net, revparNet, arr };
  });

  const grandBrut = rows.reduce((s, r) => s + r.brut, 0);
  const grandComm = rows.reduce((s, r) => s + r.comm, 0);
  const grandNet  = grandBrut - grandComm;

  const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jui","Jul","Aoû","Sep","Oct","Nov","Déc"];

  return (
    <>
      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: `CA brut ${year}`, val: fmt(grandBrut), color: "#94a3b8" },
          { label: "Commissions estimées ~15%", val: fmt(grandComm), sub: pct(grandComm / grandBrut), color: "#f87171" },
          { label: "Net estimé", val: fmt(grandNet), sub: fmt(grandNet / NUITS_AN) + "/j RevPAR net", color: "#34d399" },
        ].map(k => (
          <div key={k.label} style={card}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.val}</div>
            {k.sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Notice estimation */}
      <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "center", gap: 8 }}>
        <span>⚠</span>
        <span>Ventilation canal non disponible pour {year}. Commission estimée à <strong>~15%</strong> (blended OTA — quasi pas de réservation directe cette année-là).</span>
      </div>

      {/* Tableau simplifié */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>Bien</th>
              <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>CA brut</th>
              <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>Comm. estimée</th>
              <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>Net estimé</th>
              <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>RevPAR net/j</th>
              <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600, fontSize: 11 }}>Meilleur mois</th>
              <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600, fontSize: 11 }}>Mois vides</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const maxIdx = row.arr.indexOf(Math.max(...row.arr));
              const zeroCount = row.arr.filter(v => !v).length;
              return (
                <tr key={row.b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <td style={{ padding: "10px 10px", fontWeight: 600, color: "#cbd5e1" }}>
                    {BIEN_LABEL[row.b.id] || row.b.label}
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>{BIEN_PRIX[row.b.id] || row.b.prix}€/nuit</div>
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 10px", color: "#94a3b8" }}>{fmt(row.brut)}</td>
                  <td style={{ textAlign: "right", padding: "10px 10px", color: "#f87171", fontSize: 12 }}>
                    -{fmt(row.comm)}
                    <div style={{ fontSize: 10, color: "#64748b" }}>15%</div>
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 10px", fontWeight: 700, color: "#f1f5f9" }}>{fmt(row.net)}</td>
                  <td style={{ textAlign: "right", padding: "10px 10px", color: "#34d399" }}>{fmt(row.revparNet)}</td>
                  <td style={{ textAlign: "right", padding: "10px 10px", color: "#60a5fa", fontSize: 12 }}>
                    {MONTHS[maxIdx]} ({fmt(row.arr[maxIdx])})
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 10px" }}>
                    {zeroCount > 0 ? (
                      <span style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", borderRadius: 5, padding: "2px 7px", fontSize: 11 }}>{zeroCount} mois</span>
                    ) : (
                      <span style={{ color: "#10b981", fontSize: 11 }}>✓ complet</span>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)", fontWeight: 700 }}>
              <td style={{ padding: "12px 10px", color: "#f1f5f9" }}>TOTAL</td>
              <td style={{ textAlign: "right", padding: "12px 10px", color: "#94a3b8" }}>{fmt(grandBrut)}</td>
              <td style={{ textAlign: "right", padding: "12px 10px", color: "#f87171" }}>-{fmt(grandComm)}</td>
              <td style={{ textAlign: "right", padding: "12px 10px", color: "#f1f5f9" }}>{fmt(grandNet)}</td>
              <td style={{ textAlign: "right", padding: "12px 10px", color: "#34d399" }}>{fmt(grandNet / NUITS_AN)}</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function NetRevParTab({ hist = {} }) {
  const [year, setYear] = useState(2025);
  const accent = ANNEE_COLORS[year] || "#059669";

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1040, margin: "0 auto", color: "#e2e8f0" }}>
      {/* En-tête + sélecteur */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#f1f5f9" }}>
          Net RevPAR par bien &amp; canal
        </h2>
        <div style={{ display: "flex", gap: 6 }}>
          {YEARS.map(y => (
            <button key={y} onClick={() => setYear(y)} style={{
              padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer",
              border: y === year ? `2px solid ${ANNEE_COLORS[y]}` : "2px solid transparent",
              background: y === year ? `${ANNEE_COLORS[y]}22` : "rgba(255,255,255,0.04)",
              color: y === year ? ANNEE_COLORS[y] : "#64748b",
              transition: "all 0.15s",
            }}>{y}</button>
          ))}
        </div>
      </div>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
        {year === 2025
          ? "Source : REVENUS_CANAL_2025 · Airbnb par bien · Booking 17% · Direct Stripe 1,5%"
          : `Source : données mensuelles ${year} · Commission estimée ~15% blended (ventilation canal indisponible)`}
      </p>

      {year === 2025
        ? <View2025 />
        : <ViewHist year={year} hist={hist} />
      }

      <p style={{ color: "#475569", fontSize: 11, marginTop: 16 }}>
        {year === 2025
          ? "Données 2025 YTD · Iguana exclu (bail long 3 400€/mois) · Parking inclus dans le brut mais hors commission"
          : `Revenus ${year} depuis Google Sheets · Iguana inclus (court terme avant bail oct 2024)`}
      </p>
    </div>
  );
}
