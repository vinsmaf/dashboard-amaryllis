// Net RevPAR par bien & canal — multi-années
// 2025 : ventilation exacte canal · 2026 : reconstruit depuis biens.revpar · 2022-2024 : hist + ~15% estimé
// Fonctionnalités : max théorique 100% direct · pace 2026 vs 2025 · évolution RevPAR net 2022→2026

import { useState } from "react";
import { REVENUS_CANAL_2025 } from "../data/revenusCanal.js";
import { AIRBNB_COMM_PAR_BIEN, BOOKING_COMM, FRAIS_STRIPE } from "../config/canauxCommissions.js";

// ── Constantes ────────────────────────────────────────────────────────────────
const NUITS_AN  = 365;
const COMM_EST  = 0.15; // blended OTA estimé pour années sans détail canal
const DAYS      = [31,28,31,30,31,30,31,31,30,31,30,31]; // 2026
const CY        = new Date().getFullYear();
const CM        = new Date().getMonth(); // 0-indexed, juin=5

const BIENS = [
  { id: "amaryllis",   label: "Villa Amaryllis", prix: 280 },
  { id: "zandoli",    label: "Zandoli",          prix: 110 },
  { id: "geko",       label: "Géko",             prix: 110 },
  { id: "mabouya",    label: "Mabouya",          prix: 70  },
  { id: "schoelcher", label: "Schœlcher",        prix: 90  },
  { id: "nogent",     label: "Nogent",           prix: 90  },
  { id: "iguana",     label: "Villa Iguana",     prix: 180, long: true },
];

const YEARS = [2026, 2025, 2024, 2023, 2022];
const ACOL  = { 2022:"#475569", 2023:"#0284c7", 2024:"#7c3aed", 2025:"#059669", 2026:"#f59e0b" };
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jui","Jul","Aoû","Sep","Oct","Nov","Déc"];

const fmt  = v => new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(v))+" €";
const fmtJ = v => fmt(v)+"/j";
const pct  = v => (v*100).toFixed(1)+" %";

const card = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"14px 16px" };
const th   = { padding:"8px 10px", color:"#64748b", fontWeight:600, fontSize:12, textAlign:"right" };
const td   = (i) => ({ padding:"10px 10px", borderBottom:"1px solid rgba(255,255,255,0.04)", background: i%2===0?"rgba(255,255,255,0.01)":"transparent" });

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcNet(brut, canal, bienId) {
  if (!brut) return { brut:0, comm:0, net:0, taux:0 };
  const taux = canal==="airbnb"  ? (AIRBNB_COMM_PAR_BIEN[bienId]??0.15)
             : canal==="booking" ? BOOKING_COMM
             : canal==="direct"  ? FRAIS_STRIPE : 0;
  return { brut, comm:brut*taux, net:brut*(1-taux), taux };
}

// Reconstruit hist[2026] depuis biens.revpar si manquant
function build2026(biensArr) {
  const r = {};
  for (const b of (biensArr||[])) {
    if (b?.revpar) r[b.id] = b.revpar.map((v,i) => Math.round((v||0)*(DAYS[i]||30)));
  }
  return r;
}

// Net RevPAR estimé (hist sans détail canal)
function estNetRevpar(arr) {
  return ((arr||[]).reduce((s,v)=>s+(v||0),0) * (1-COMM_EST)) / NUITS_AN;
}

// Net RevPAR réel 2025 (données canal précises)
function realNetRevpar2025(id) {
  const c = REVENUS_CANAL_2025[id]||{};
  const net = calcNet(c.airbnb||0,"airbnb",id).net + calcNet(c.booking||0,"booking",id).net
            + calcNet(c.direct||0,"direct",id).net + (c.parking||0);
  return net/NUITS_AN;
}

// Résumé canal 2025 pour max théorique
function canal2025Summary(id) {
  const c = REVENUS_CANAL_2025[id]||{};
  const ab = calcNet(c.airbnb||0,"airbnb",id);
  const bk = calcNet(c.booking||0,"booking",id);
  const dr = calcNet(c.direct||0,"direct",id);
  const brut = ab.brut+bk.brut+dr.brut+(c.parking||0);
  const comm = ab.comm+bk.comm+dr.comm;
  return { brut, comm, net:brut-comm, txDirect: brut>0?dr.brut/brut:0, ...{ ab,bk,dr } };
}

// ── Section Max Théorique ─────────────────────────────────────────────────────
function MaxSection({ rows }) { // rows: [{id, label, brut, net}]
  const totalSaved = rows.reduce((s,r) => s + r.brut*(1-FRAIS_STRIPE) - r.net, 0);
  return (
    <div style={{ ...card, marginTop:20, borderColor:"rgba(250,204,21,0.18)", background:"rgba(250,204,21,0.03)" }}>
      <div style={{ fontWeight:700, color:"#fbbf24", marginBottom:12, fontSize:14 }}>
        🎯 Max théorique si 100% direct (Stripe 1,5%)
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
        {rows.filter(r=>r.brut>0).map(r => {
          const maxNet  = r.brut*(1-FRAIS_STRIPE);
          const maxRvp  = maxNet/NUITS_AN;
          const gap     = maxNet - r.net;
          const actRvp  = r.net/NUITS_AN;
          return (
            <div key={r.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 14px", minWidth:150 }}>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>{r.label}</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#fbbf24" }}>{fmtJ(maxRvp)}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>actuel {fmtJ(actRvp)}</div>
              <div style={{ fontSize:11, color:"#f87171", marginTop:2 }}>+{fmt(gap)}/an à récupérer</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize:12, color:"#94a3b8" }}>
        Commissions récupérables totales : <strong style={{ color:"#fbbf24" }}>{fmt(totalSaved)}/an</strong>
      </div>
    </div>
  );
}

// ── View 2025 — canal complet ─────────────────────────────────────────────────
function View2025() {
  const rows = BIENS.filter(b=>!b.long).map(b => {
    const s = canal2025Summary(b.id);
    return { ...b, ...s, revparNet: s.net/NUITS_AN };
  });
  const gBrut = rows.reduce((s,r)=>s+r.brut,0);
  const gComm = rows.reduce((s,r)=>s+r.comm,0);
  const gNet  = gBrut-gComm;
  const gainSim = rows.reduce((s,r) => {
    const t = AIRBNB_COMM_PAR_BIEN[r.id]??0.15;
    return s+(r.ab.brut+r.bk.brut)*0.20*(Math.max(t,BOOKING_COMM)-FRAIS_STRIPE);
  },0);

  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"CA brut 2025",        val:fmt(gBrut),          color:"#94a3b8" },
          { label:"Commissions OTA",      val:fmt(gComm), sub:pct(gComm/gBrut), color:"#f87171" },
          { label:"Net réel",             val:fmt(gNet),           color:"#34d399" },
          { label:"Max 100% direct",      val:fmt(gBrut*(1-FRAIS_STRIPE)), sub:`+${fmt(gBrut*(1-FRAIS_STRIPE)-gNet)} potentiel`, color:"#fbbf24" },
        ].map(k=>(
          <div key={k.label} style={card}>
            <div style={{ fontSize:10, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>{k.label}</div>
            <div style={{ fontSize:19, fontWeight:700, color:k.color }}>{k.val}</div>
            {k.sub&&<div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              <th style={{ ...th, textAlign:"left" }}>Bien</th>
              {["Airbnb","Booking.com","Direct"].map(c=>(
                <th key={c} colSpan={3} style={{ ...th, textAlign:"center" }}>{c}</th>
              ))}
              <th style={th}>Net total</th>
              <th style={th}>RevPAR net/j</th>
              <th style={th}>% Direct</th>
              <th style={th}>Max direct</th>
            </tr>
            <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <th></th>
              {["airbnb","booking","direct"].flatMap(c=>[
                <th key={c+"b"} style={{ ...th, fontSize:10, fontWeight:400, color:"#475569" }}>Brut</th>,
                <th key={c+"c"} style={{ ...th, fontSize:10, fontWeight:400, color:"#475569" }}>Comm.</th>,
                <th key={c+"n"} style={{ ...th, fontSize:10, fontWeight:400, color:"#475569" }}>Net</th>,
              ])}
              <th></th><th></th><th></th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>{
              const isAlert = r.txDirect<0.30;
              const maxRvp = r.brut*(1-FRAIS_STRIPE)/NUITS_AN;
              return (
                <tr key={r.id} style={{ background:i%2===0?"rgba(255,255,255,0.01)":"transparent" }}>
                  <td style={{ padding:"10px 10px", fontWeight:600, color:"#cbd5e1", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    {r.label}<div style={{ fontSize:11, color:"#64748b", fontWeight:400 }}>{r.prix}€/nuit</div>
                  </td>
                  {[{c:r.ab},{c:r.bk},{c:r.dr}].map(({c},ci)=>[
                    <td key={ci+"b"} style={{ ...td(i), color:"#94a3b8" }}>{c.brut>0?fmt(c.brut):"—"}</td>,
                    <td key={ci+"c"} style={{ ...td(i), color:"#f87171", fontSize:11 }}>{c.brut>0&&`-${fmt(c.comm)}`}</td>,
                    <td key={ci+"n"} style={{ ...td(i), color:"#10b981" }}>{c.brut>0?fmt(c.net):"—"}</td>,
                  ])}
                  <td style={{ ...td(i), fontWeight:700, color:"#f1f5f9" }}>{fmt(r.net)}</td>
                  <td style={{ ...td(i), color:"#34d399" }}>{fmt(r.revparNet)}</td>
                  <td style={td(i)}>
                    <span style={{ background:isAlert?"rgba(239,68,68,0.12)":"rgba(16,185,129,0.12)", color:isAlert?"#f87171":"#34d399", borderRadius:6, padding:"3px 8px", fontSize:12, fontWeight:600 }}>
                      {pct(r.txDirect)}
                    </span>
                  </td>
                  <td style={{ ...td(i), color:"#fbbf24", fontSize:12 }}>{fmt(maxRvp)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <MaxSection rows={rows.map(r=>({ id:r.id, label:r.label, brut:r.brut, net:r.net }))} />

      <div style={{ ...card, marginTop:20, borderColor:"rgba(16,185,129,0.2)", background:"rgba(16,185,129,0.04)" }}>
        <div style={{ fontWeight:700, color:"#34d399", marginBottom:8, fontSize:14 }}>
          💡 Simulation : +20% de direct sur les canaux OTA
        </div>
        <p style={{ color:"#94a3b8", fontSize:13, margin:0, lineHeight:1.7 }}>
          Si 20% du volume OTA bascule en direct : gain net estimé <strong style={{ color:"#34d399" }}>{fmt(gainSim)}/an</strong>.
        </p>
        <div style={{ marginTop:10, display:"flex", gap:10, flexWrap:"wrap" }}>
          {rows.filter(r=>r.txDirect<0.30).map(r=>{
            const t=AIRBNB_COMM_PAR_BIEN[r.id]??0.15;
            const g=(r.ab.brut+r.bk.brut)*0.20*(Math.max(t,BOOKING_COMM)-FRAIS_STRIPE);
            return (
              <span key={r.id} style={{ background:"rgba(248,113,113,0.1)", borderRadius:6, padding:"4px 10px", fontSize:12, color:"#f87171" }}>
                ⚠ {r.label} — {pct(r.txDirect)} direct · +{fmt(g)}/an
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── View Hist + 2026 ──────────────────────────────────────────────────────────
function ViewHist({ year, hist, biensArr }) {
  const is2026 = year === CY;

  // Source de données : hist[year] || reconstruit depuis biens.revpar si 2026
  let yearData = hist?.[year] || {};
  if (is2026 && Object.keys(yearData).length === 0) yearData = build2026(biensArr);

  const activeBiens = BIENS.filter(b => {
    if (is2026 && b.long) return false; // Iguana = bail long en 2026
    const arr = yearData[b.id];
    return arr && arr.some(v => v > 0);
  });

  const rows = activeBiens.map(b => {
    const arr = yearData[b.id] || [];
    const brut = arr.reduce((s,v)=>s+(v||0),0);
    const comm = Math.round(brut * COMM_EST);
    const net  = brut - comm;
    const maxNet  = Math.round(brut * (1-FRAIS_STRIPE));
    const maxIdx  = arr.indexOf(Math.max(...arr));
    const zeroCount = arr.filter(v=>!v).length;
    return { ...b, arr, brut, comm, net, revparNet:net/NUITS_AN, maxNet, maxRevpar:maxNet/NUITS_AN, maxIdx, zeroCount };
  });

  const gBrut = rows.reduce((s,r)=>s+r.brut,0);
  const gComm = rows.reduce((s,r)=>s+r.comm,0);
  const gNet  = gBrut-gComm;
  const gMax  = Math.round(gBrut*(1-FRAIS_STRIPE));

  // Pace H1 2026 vs H1 2025 (seulement si 2026)
  let paceRows = [];
  if (is2026) {
    const h25 = hist?.[2025] || {};
    const nMois = CM + 1; // nombre de mois disponibles (ex. juin = 6)
    paceRows = activeBiens.map(b => {
      const v26 = (yearData[b.id]||[]).slice(0, nMois).reduce((s,v)=>s+(v||0),0);
      const v25 = (h25[b.id]||[]).slice(0, nMois).reduce((s,v)=>s+(v||0),0);
      const delta = v26 - v25;
      const deltaPct = v25 > 0 ? delta/v25 : null;
      return { ...b, v26, v25, delta, deltaPct };
    });
  }

  const periodo = is2026 ? `Jan–${MONTHS[CM]} 2026` : String(year);

  return (
    <>
      {/* KPI */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:`CA brut ${periodo}`,   val:fmt(gBrut),   color:"#94a3b8" },
          { label:"Commissions ~15%",      val:fmt(gComm), sub:pct(gComm/gBrut), color:"#f87171" },
          { label:"Net estimé",            val:fmt(gNet),    color:"#34d399" },
          { label:"Max 100% direct",       val:fmt(gMax),  sub:`+${fmt(gMax-gNet)} potentiel`, color:"#fbbf24" },
        ].map(k=>(
          <div key={k.label} style={card}>
            <div style={{ fontSize:10, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>{k.label}</div>
            <div style={{ fontSize:19, fontWeight:700, color:k.color }}>{k.val}</div>
            {k.sub&&<div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Notice */}
      <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, padding:"9px 14px", marginBottom:18, fontSize:12, color:"#fbbf24" }}>
        ⚠ Ventilation canal indisponible pour {year}{is2026?" (YTD)":""}. Commission estimée ~15% blended.
        {is2026&&" Données issues de biens.revpar si Sheets non synchronisé."}
      </div>

      {/* Tableau */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              <th style={{ ...th, textAlign:"left" }}>Bien</th>
              <th style={th}>CA brut</th>
              <th style={th}>Comm. ~15%</th>
              <th style={th}>Net estimé</th>
              <th style={th}>RevPAR net/j</th>
              <th style={th}>Max direct/j</th>
              <th style={th}>Meilleur mois</th>
              <th style={th}>Mois vides</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={r.id}>
                <td style={{ ...td(i), fontWeight:600, color:"#cbd5e1", textAlign:"left" }}>
                  {r.label}<div style={{ fontSize:11, color:"#64748b", fontWeight:400 }}>{r.prix}€/nuit</div>
                </td>
                <td style={{ ...td(i), color:"#94a3b8" }}>{fmt(r.brut)}</td>
                <td style={{ ...td(i), color:"#f87171", fontSize:12 }}>-{fmt(r.comm)}</td>
                <td style={{ ...td(i), fontWeight:700, color:"#f1f5f9" }}>{fmt(r.net)}</td>
                <td style={{ ...td(i), color:"#34d399" }}>{fmt(r.revparNet)}</td>
                <td style={{ ...td(i), color:"#fbbf24", fontSize:12 }}>{fmt(r.maxRevpar)}</td>
                <td style={{ ...td(i), color:"#60a5fa", fontSize:12 }}>{MONTHS[r.maxIdx]} ({fmt(r.arr[r.maxIdx])})</td>
                <td style={td(i)}>
                  {r.zeroCount>0
                    ? <span style={{ background:"rgba(239,68,68,0.1)", color:"#f87171", borderRadius:5, padding:"2px 7px", fontSize:11 }}>{r.zeroCount} mois</span>
                    : <span style={{ color:"#10b981", fontSize:11 }}>✓ complet</span>}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop:"2px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.03)", fontWeight:700 }}>
              <td style={{ padding:"12px 10px", color:"#f1f5f9" }}>TOTAL</td>
              <td style={{ padding:"12px 10px", textAlign:"right", color:"#94a3b8" }}>{fmt(gBrut)}</td>
              <td style={{ padding:"12px 10px", textAlign:"right", color:"#f87171" }}>-{fmt(gComm)}</td>
              <td style={{ padding:"12px 10px", textAlign:"right", color:"#f1f5f9" }}>{fmt(gNet)}</td>
              <td style={{ padding:"12px 10px", textAlign:"right", color:"#34d399" }}>{fmt(gNet/NUITS_AN)}</td>
              <td style={{ padding:"12px 10px", textAlign:"right", color:"#fbbf24" }}>{fmt(gMax/NUITS_AN)}</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pace 2026 vs 2025 */}
      {is2026 && paceRows.length > 0 && (
        <div style={{ ...card, marginTop:20, borderColor:"rgba(245,158,11,0.2)", background:"rgba(245,158,11,0.03)" }}>
          <div style={{ fontWeight:700, color:"#f59e0b", marginBottom:12, fontSize:14 }}>
            📈 Pace Jan–{MONTHS[CM]} 2026 vs 2025
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ ...th, textAlign:"left" }}>Bien</th>
                <th style={th}>Jan–{MONTHS[CM]} 2025</th>
                <th style={th}>Jan–{MONTHS[CM]} 2026</th>
                <th style={th}>Δ</th>
                <th style={th}>%</th>
              </tr>
            </thead>
            <tbody>
              {paceRows.map((r,i) => {
                const up = r.delta >= 0;
                return (
                  <tr key={r.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background:i%2===0?"rgba(255,255,255,0.01)":"transparent" }}>
                    <td style={{ padding:"9px 10px", fontWeight:600, color:"#cbd5e1" }}>{r.label}</td>
                    <td style={{ padding:"9px 10px", textAlign:"right", color:"#94a3b8" }}>{fmt(r.v25)}</td>
                    <td style={{ padding:"9px 10px", textAlign:"right", color:"#f1f5f9", fontWeight:600 }}>{fmt(r.v26)}</td>
                    <td style={{ padding:"9px 10px", textAlign:"right", color: up?"#34d399":"#f87171", fontWeight:600 }}>
                      {up?"+":""}{fmt(r.delta)}
                    </td>
                    <td style={{ padding:"9px 10px", textAlign:"right" }}>
                      {r.deltaPct!==null
                        ? <span style={{ background: up?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:up?"#34d399":"#f87171", borderRadius:6, padding:"3px 8px", fontSize:12, fontWeight:700 }}>
                            {up?"+":""}{(r.deltaPct*100).toFixed(1)}%
                          </span>
                        : "—"}
                    </td>
                  </tr>
                );
              })}
              {(() => {
                const tot26 = paceRows.reduce((s,r)=>s+r.v26,0);
                const tot25 = paceRows.reduce((s,r)=>s+r.v25,0);
                const dTot = tot26-tot25;
                const dPct = tot25>0?dTot/tot25:null;
                const up = dTot>=0;
                return (
                  <tr style={{ borderTop:"2px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.03)", fontWeight:700 }}>
                    <td style={{ padding:"10px 10px", color:"#f1f5f9" }}>TOTAL</td>
                    <td style={{ padding:"10px 10px", textAlign:"right", color:"#94a3b8" }}>{fmt(tot25)}</td>
                    <td style={{ padding:"10px 10px", textAlign:"right", color:"#f1f5f9" }}>{fmt(tot26)}</td>
                    <td style={{ padding:"10px 10px", textAlign:"right", color:up?"#34d399":"#f87171" }}>{up?"+":""}{fmt(dTot)}</td>
                    <td style={{ padding:"10px 10px", textAlign:"right" }}>
                      {dPct!==null&&<span style={{ background:up?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:up?"#34d399":"#f87171", borderRadius:6, padding:"3px 8px", fontSize:12, fontWeight:700 }}>
                        {up?"+":""}{(dPct*100).toFixed(1)}%
                      </span>}
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Section Évolution RevPAR net 2022→2026 ────────────────────────────────────
function EvolutionSection({ hist, biensArr }) {
  const built2026 = build2026(biensArr);
  const yearsAvail = YEARS.filter(y => {
    if (y === 2025) return true;
    const d = y === CY ? built2026 : hist?.[y];
    return d && Object.values(d).some(arr => (arr||[]).some(v=>v>0));
  });

  const biens = BIENS.filter(b => !b.long); // Iguana = bail fixe, hors comparaison

  // Net RevPAR estimé par bien/an
  function getRevpar(bienId, y) {
    if (y === 2025) return realNetRevpar2025(bienId);
    const src = y === CY ? built2026 : hist?.[y];
    return estNetRevpar(src?.[bienId]);
  }

  return (
    <div style={{ ...card, marginTop:28, borderColor:"rgba(255,255,255,0.10)" }}>
      <div style={{ fontWeight:700, color:"#f1f5f9", marginBottom:12, fontSize:14 }}>
        📊 Évolution RevPAR net/j par bien — {yearsAvail[yearsAvail.length-1]}→{yearsAvail[0]}
      </div>
      <p style={{ color:"#64748b", fontSize:12, margin:"0 0 14px" }}>
        2025 : données réelles canal · Autres années : estimé à 15% commission blended · 2026 = YTD annualisé
      </p>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              <th style={{ ...th, textAlign:"left" }}>Bien</th>
              {yearsAvail.map(y => (
                <th key={y} style={{ ...th, color:ACOL[y] }}>
                  {y}{y===CY?" ⬡":""}
                </th>
              ))}
              <th style={{ ...th, color:"#64748b" }}>Tendance</th>
            </tr>
          </thead>
          <tbody>
            {biens.map((b,i) => {
              const vals = yearsAvail.map(y => getRevpar(b.id, y));
              const max  = Math.max(...vals.filter(v=>v>0));
              const prev = vals[1] || 0; // 2025 ou année précédente
              const curr = vals[0];      // 2026 ou année courante
              const trend = prev>0 ? ((curr-prev)/prev*100).toFixed(0) : null;
              return (
                <tr key={b.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background:i%2===0?"rgba(255,255,255,0.01)":"transparent" }}>
                  <td style={{ padding:"10px 10px", fontWeight:600, color:"#cbd5e1" }}>{b.label}</td>
                  {vals.map((v,vi) => {
                    const isBest = v>0 && v===max;
                    const isZero = v===0;
                    return (
                      <td key={vi} style={{ padding:"10px 10px", textAlign:"right", color: isZero?"#475569": isBest?"#fbbf24":"#94a3b8", fontWeight:isBest?700:400 }}>
                        {isZero ? "—" : fmt(v)}
                      </td>
                    );
                  })}
                  <td style={{ padding:"10px 10px", textAlign:"right" }}>
                    {trend!==null && (
                      <span style={{ background: Number(trend)>=0?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)", color:Number(trend)>=0?"#34d399":"#f87171", borderRadius:6, padding:"3px 8px", fontSize:12, fontWeight:700 }}>
                        {Number(trend)>=0?"+":""}{trend}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ color:"#475569", fontSize:11, marginTop:10, marginBottom:0 }}>
        ⬡ YTD = annualisé sur base des mois disponibles · 🏆 Meilleure année = jaune
      </p>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function NetRevParTab({ hist = {}, biens: biensArr = [] }) {
  const [year, setYear] = useState(2025);
  const accent = ACOL[year] || "#059669";

  return (
    <div style={{ padding:"24px 20px", maxWidth:1060, margin:"0 auto", color:"#e2e8f0" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"baseline", gap:16, flexWrap:"wrap", marginBottom:6 }}>
        <h2 style={{ fontSize:20, fontWeight:700, margin:0, color:"#f1f5f9" }}>
          Net RevPAR par bien &amp; canal
        </h2>
        <div style={{ display:"flex", gap:6 }}>
          {YEARS.map(y=>(
            <button key={y} onClick={()=>setYear(y)} style={{
              padding:"4px 14px", borderRadius:20, fontSize:13, fontWeight:700, cursor:"pointer",
              border: y===year ? `2px solid ${ACOL[y]}` : "2px solid transparent",
              background: y===year ? `${ACOL[y]}22` : "rgba(255,255,255,0.04)",
              color: y===year ? ACOL[y] : "#64748b",
              transition:"all 0.15s",
            }}>{y}{y===CY?" YTD":""}</button>
          ))}
        </div>
      </div>
      <p style={{ color:"#64748b", fontSize:13, marginBottom:24 }}>
        {year===2025
          ? "Ventilation exacte : REVENUS_CANAL_2025 · Airbnb par bien · Booking 17% · Direct Stripe 1,5%"
          : year===CY
          ? `Source : sync Sheets 2026 YTD · Reconstruction depuis biens.revpar si Sheets non synchronisé`
          : `Source : données mensuelles ${year} · Commission estimée ~15% blended`}
      </p>

      {year===2025
        ? <View2025 />
        : <ViewHist year={year} hist={hist} biensArr={biensArr} />}

      {/* Section évolution — toujours visible */}
      <EvolutionSection hist={hist} biensArr={biensArr} />

      <p style={{ color:"#475569", fontSize:11, marginTop:16 }}>
        {year===2025
          ? "Iguana exclu (bail long 1 800€/mois) · Parking inclus dans le brut mais hors commission"
          : year===CY
          ? "Iguana exclu (bail long depuis oct 2024) · Données YTD Jan–"+(MONTHS[CM])
          : "Iguana inclus (court terme avant bail oct 2024)"}
      </p>
    </div>
  );
}
