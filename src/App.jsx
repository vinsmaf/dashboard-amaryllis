import { useState, useEffect, useCallback, useRef, useMemo, Component } from "react";
import EmailSync from "./EmailSync.jsx";
import RevenueManagerPro from "./RevenueManagerPro.jsx";
import GuideEditor from "./GuideEditor.jsx";
import LivretEditor from "./LivretEditor.jsx";
import AgentsKanban from "./AgentsKanban.jsx";
import { SEED_DAILY_PRICES, loadDailyPrices, saveDailyPrices, loadPriceOverrides, applyServerPriceOverrides } from "./seedPrices.js";
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";

// ============================================================================
// DONNÉES
// ============================================================================
const SEED_BIENS = [
  { id: "nogent", nom: "T2 Nogent", emoji: "🏙️", type: "court", charges: 1330, rev2025: 25281, occ2025: 70.7, adr2025: 98, revpar2025: 69,
    revenus: [2329,1457,1373,2357,2280,472,660,0,0,0,0,0],
    cashflow: [-32,-370,-552,506,949,-859,-670,0,0,0,0,0],
    occ: [64.5,67.9,48.4,83.3,54.8,13.3,0,0,0,0,0,0],
    adr: [116,77,92,94,134,118,0,0,0,0,0,0],
    revpar: [75,52,44,79,74,16,21,0,0,0,0,0] },
  { id: "amaryllis", nom: "Villa Amaryllis", emoji: "🌴", type: "court", charges: 1682, rev2025: 38001, occ2025: 33.4, adr2025: 312, revpar2025: 104,
    revenus: [11984,9266,4938,7474,1149,1575,4800,0,0,0,0,2805],
    cashflow: [10302,7584,3257,5792,-333,92,3177,0,0,0,0,0],
    occ: [83.9,82.1,64.5,76.7,12.9,13.3,3.2,41.9,0,0,0,0],
    adr: [461,403,247,325,287,394,4800,0,0,0,0,0],
    revpar: [387,331,159,249,37,52,155,0,0,0,0,0] },
  { id: "iguana", nom: "Villa Iguana", emoji: "🦎", type: "long", charges: 404, rev2025: 23600, occ2025: 100, adr2025: 65, revpar2025: 65,
    revenus: [1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800],
    cashflow: [1396,1396,1396,1396,1439,1439,1439,1439,1439,1439,1439,1439],
    occ: [100,100,100,100,100,100,100,100,100,100,100,100],
    adr: [58,64,58,60,58,60,58,58,60,58,60,58],
    revpar: [58,64,58,60,58,60,58,58,60,58,60,58] },
  { id: "geko", nom: "Geko", emoji: "🦗", type: "court", charges: 376, rev2025: 19937, occ2025: 39.2, adr2025: 139, revpar2025: 55,
    revenus: [2586,3498,2736,1662,1154,0,950,0,0,0,0,0],
    cashflow: [2285,3122,2360,1286,778,-376,574,0,0,0,0,0],
    occ: [51.6,82.1,58.1,53.3,45.2,0,22.6,22.6,0,0,0,0],
    adr: [162,152,152,104,82,0,136,0,0,0,0,0],
    revpar: [83,125,88,55,37,0,31,0,0,0,0,0] },
  { id: "zandoli", nom: "Zandoli", emoji: "🌊", type: "court", charges: 376, rev2025: 32656, occ2025: 67.7, adr2025: 132, revpar2025: 89,
    revenus: [2426,3034,3046,3486,887,0,900,0,0,0,0,0],
    cashflow: [2125,2658,2670,3110,511,-376,524,0,0,0,0,0],
    occ: [51.6,92.9,64.5,76.7,25.8,0,16.1,3.2,0,0,0,0],
    adr: [152,117,152,152,111,0,180,0,0,0,0,0],
    revpar: [78,108,98,116,29,0,29,0,0,0,0,0] },
  { id: "mabouya", nom: "Mabouya", emoji: "🏠", type: "court", charges: 376, rev2025: 8450, occ2025: 28.2, adr2025: 82, revpar2025: 23,
    revenus: [1116,3060,0,0,0,1500,1500,1800,1800,1500,1200,1200],
    cashflow: [815,2684,-376,-376,-376,1124,1124,1424,1424,1124,824,824],
    occ: [87.1,82.8,100,100,6.5,50,55,60,60,50,42,42],
    adr: [41,128,0,0,0,95,95,100,100,95,90,90],
    revpar: [36,109,0,0,0,48,52,60,60,48,38,38] },
  { id: "schoelcher", nom: "T2 Schoelcher", emoji: "🏢", type: "moyen", charges: 1190, rev2025: 12680, occ2025: 37.3, adr2025: 93, revpar2025: 35,
    revenus: [1871,3076,2370,2415,1300,1300,1600,0,0,0,0,0],
    cashflow: [681,1886,1181,1226,110,110,410,0,0,0,0,0],
    occ: [51.6,69.0,87.1,56.7,100,100,83.9,83.9,0,0,0,0],
    adr: [117,154,88,142,42,43,62,0,0,0,0,0],
    revpar: [60,110,76,81,42,43,52,0,0,0,0,0] },
];

// URLs iCal Airbnb : chargées depuis /api/get-config (Cloudflare env vars)
// Plus de tokens dans le bundle JS public.
// Fallback : objet vide → l'utilisateur saisit les URLs manuellement dans Planning.
const ICAL_DEFAULTS = {};

const FILE_ID = "1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U";
const MOIS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
const MOIS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const N = new Date().getMonth() + 1; // mois écoulés dans l'année en cours
const CC = { airbnb: "#FF5A5F", booking: "#0ea5e9", direct: "#10b981", autre: "#a855f7" };
const CB = { airbnb: "rgba(255,90,95,0.15)", booking: "rgba(14,165,233,0.15)", direct: "rgba(16,185,129,0.15)", autre: "rgba(168,85,247,0.15)" };

const HIST_SEED = {
  2022: { total:[5220,9525,4160,8912,8339,7557,9724,13351,6095,8373,9149,16656], nogent:[660,0,0,1354,3344,3277,3113,2683,3285,2863,3037,3192], amaryllis:[0,4965,0,4048,1500,1470,3801,5987,0,2700,3302,7548], iguana:[0,0,0,0,0,0,0,1871,0,0,0,3106], geko:[0,0,0,0,0,0,0,0,0,0,0,0], zandoli:[0,0,0,0,0,0,0,0,0,0,0,0], mabouya:[0,0,0,0,0,0,0,0,0,0,0,0], schoelcher:[0,0,0,0,0,0,0,0,0,0,0,0] },
  2023: { total:[16412,12562,10148,13133,8953,6844,11042,12827,4775,6735,7320,10979], nogent:[2709,2445,2556,2588,2343,2261,2606,1875,2904,2861,2462,2651], amaryllis:[8387,5767,3935,6132,3847,764,5481,5133,0,2574,3126,5448], iguana:[1924,1995,1747,645,602,1622,340,2387,571,0,382,1227], geko:[1482,445,0,1858,252,262,704,1522,0,0,50,353], zandoli:[1631,1680,1440,2233,1700,1275,0,190,965,0,1100,3700], mabouya:[0,0,0,0,0,0,0,0,0,0,0,0], schoelcher:[0,0,0,0,0,0,0,0,0,0,0,0] },
  2024: { total:[19042,19532,15426,8606,5140,3528,14373,11950,1551,14062,10198,19933], nogent:[890,1273,1192,188,1864,987,865,0,243,2066,1388,1549], amaryllis:[6487,11216,8087,6417,1475,0,7178,7785,0,6095,2085,9989], iguana:[3199,2889,3013,0,0,397,1018,1085,0,0,3400,1090], geko:[0,0,0,0,0,0,0,0,0,518,1656,1606], zandoli:[2322,1801,970,0,0,343,2539,2811,670,2951,718,2824], mabouya:[1635,1791,242,0,0,0,472,269,0,154,330,517], schoelcher:[3209,562,1922,2000,1800,1800,2300,0,638,2279,622,2358] },
  2025: { total:[17094,27053,12558,15822,10516,8726,11183,18561,5258,7684,8662,18214], nogent:[1671,1813,1379,2561,2367,2231,2653,1984,2223,2374,1628,2419], amaryllis:[3365,11820,1604,6895,0,0,1650,6843,0,0,0,5824], iguana:[2300,2300,2300,2300,1800,1800,1800,1800,1800,1800,1800,1800], geko:[0,4420,1990,1207,1628,2097,2062,1332,741,1438,1932,1175], zandoli:[7393,2770,2770,2213,4475,2159,2716,2817,331,1372,1012,3248], mabouya:[923,2086,140,567,247,0,302,1312,164,700,609,1400], schoelcher:[1442,1844,2375,80,0,439,0,2474,0,0,1681,2347] },
};

const ANNEE_COLORS = { 2022: "#475569", 2023: "#0284c7", 2024: "#7c3aed", 2025: "#059669", 2026: "#f59e0b" };
const DOT = { green: "#10b981", yellow: "#f59e0b", red: "#ef4444" };

// ─── DONNÉES DÉTAILLÉES 2025 (extraites Google Sheets) ─────────────────────
// Charges annuelles par poste et par bien
const CHARGES_2025 = {
  nogent:     { conciergerie: 8575, credit: 15129, electricite: 495,  taxes: 1290, charges_copro: 1913, internet: 480, assurance: 0,   eau: 0,   syndic: 0 },
  amaryllis:  { conciergerie: 0,    credit: 16658, electricite: 2206, taxes: 1259, charges_copro: 0,    internet: 492, assurance: 328, eau: 696, syndic: 0 },
  iguana:     { conciergerie: 0,    credit: 3332,  electricite: 759,  taxes: 0,    charges_copro: 0,    internet: 38,  assurance: 0,   eau: 192, syndic: 0 },
  geko:       { conciergerie: 0,    credit: 3332,  electricite: 950,  taxes: 0,    charges_copro: 0,    internet: 38,  assurance: 0,   eau: 252, syndic: 0 },
  zandoli:    { conciergerie: 0,    credit: 3332,  electricite: 950,  taxes: 0,    charges_copro: 0,    internet: 38,  assurance: 0,   eau: 252, syndic: 0 },
  mabouya:    { conciergerie: 0,    credit: 3332,  electricite: 950,  taxes: 0,    charges_copro: 0,    internet: 38,  assurance: 0,   eau: 252, syndic: 0 },
  schoelcher: { conciergerie: 0,    credit: 9564,  electricite: 624,  taxes: 1608, charges_copro: 0,    internet: 629, assurance: 300, eau: 234, syndic: 1320 },
};
const POSTES_CHARGES = [
  { k: "credit",        l: "Crédit",         c: "#ef4444" },
  { k: "conciergerie",  l: "Conciergerie",   c: "#a855f7" },
  { k: "taxes",         l: "Taxes foncières", c: "#f59e0b" },
  { k: "charges_copro", l: "Charges copro",  c: "#06b6d4" },
  { k: "syndic",        l: "Syndic",         c: "#ec4899" },
  { k: "electricite",   l: "Électricité",    c: "#eab308" },
  { k: "eau",           l: "Eau",            c: "#0ea5e9" },
  { k: "internet",      l: "Internet",       c: "#10b981" },
  { k: "assurance",     l: "Assurance",      c: "#6366f1" },
];

// Revenus par canal 2025
const REVENUS_CANAL_2025 = {
  nogent:     { airbnb: 3822,  booking: 20008, direct: 153,   parking: 1320, total: 25303 },
  amaryllis:  { airbnb: 9447,  booking: 14989, direct: 13565, parking: 0,    total: 38001 },
  iguana:     { airbnb: 0,     booking: 0,     direct: 23600, parking: 0,    total: 23600 },
  geko:       { airbnb: 10839, booking: 3858,  direct: 5324,  parking: 0,    total: 20021 },
  zandoli:    { airbnb: 3333,  booking: 8242,  direct: 21701, parking: 0,    total: 33276 },
  mabouya:    { airbnb: 2075,  booking: 3615,  direct: 2760,  parking: 0,    total: 8450  },
  schoelcher: { airbnb: 4746,  booking: 5914,  direct: 2020,  parking: 0,    total: 12680 },
};

// Occupation mensuelle moyenne historique pour heatmap saisonnalité
// Issue des données 2023-2025, par bien et par mois (en %)
const SAISONNALITE = {
  nogent:     [70,75,68,75,75,70,75,65,70,72,68,72],
  amaryllis:  [82,80,65,75,40,30,45,60,30,45,30,55],
  iguana:     [100,100,100,100,100,100,100,100,100,100,100,100],
  geko:       [40,75,55,50,45,35,50,50,30,45,55,40],
  zandoli:    [60,80,55,70,40,30,50,60,30,50,45,55],
  mabouya:    [55,75,40,50,15,25,40,50,30,40,40,45],
  schoelcher: [55,65,75,55,40,40,40,55,30,40,50,55],
};

// ============================================================================
// UTILS
// ============================================================================
const sumN = (arr, n = N) => (arr || []).slice(0, n).reduce((s, v) => s + (v || 0), 0);
const avgN = (arr, n = N) => {
  const valid = (arr || []).slice(0, n).filter(x => x > 0);
  return valid.length ? valid.reduce((s, x) => s + x, 0) / valid.length : 0;
};
const fmt = (v) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v) + " €";
const fmtK = (v) => v >= 1000 ? (v / 1000).toFixed(1) + "k€" : Math.round(v) + "€";
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const diffDays = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);

const TT = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#cbd5e1" };

const statutBien = (b) => {
  const cf = sumN(b.cashflow);
  const occ = avgN(b.occ);
  const ytd = sumN(b.revenus);
  if (cf > 0 && occ > 50) return "green";
  if (cf < -500 || ytd === 0) return "red";
  return "yellow";
};

// ============================================================================
// COMPOSANTS DE BASE
// ============================================================================

function Gauge({ pct = 0, size = 52 }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(Math.max(pct, 0) / 100, 1) * circ;
  const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={color} fontSize={10} fontWeight="700">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

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

// ── AlertCard — alerte admin (warn / danger / info) ──────────────────────────
function AlertCard({ severity = "warn", title, body, action, onAction }) {
  const colors = {
    warn:   { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  fg: "#fbbf24", icon: "⚠" },
    danger: { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   fg: "#fca5a5", icon: "⚠" },
    info:   { bg: "rgba(14,165,233,0.08)",  border: "rgba(14,165,233,0.25)",  fg: "#7dd3fc", icon: "ℹ" },
  };
  const c = colors[severity] || colors.warn;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ color: c.fg, fontSize: 14, flexShrink: 0 }}>{c.icon}</span>
      <div style={{ flex: 1, fontFamily: "'Jost', sans-serif", fontSize: 12, lineHeight: 1.4, color: c.fg }}>
        <strong style={{ color: "#f1f5f9", fontWeight: 600 }}>{title}</strong>
        {body && <> · {body}</>}
      </div>
      {action && (
        <button onClick={onAction} style={{ background: "transparent", border: `1px solid ${c.border}`, color: c.fg, borderRadius: 6, padding: "5px 12px", fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
          {action}
        </button>
      )}
    </div>
  );
}

// ── ChannelChip — pill coloré par canal de réservation ───────────────────────
function _hexToRgb(hex) {
  if (!hex || hex[0] !== "#") return "100,116,139";
  let h = hex.slice(1);
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  if (isNaN(r)||isNaN(g)||isNaN(b)) return "100,116,139";
  return `${r},${g},${b}`;
}
function ChannelChip({ channel, value }) {
  const CHIP_COLORS = { airbnb: "#FF5A5F", "Airbnb": "#FF5A5F", booking: "#0ea5e9", "Booking.com": "#003580", direct: "#10b981", "Direct": "#10b981", "Beds24 Direct": "#0ea5e9", autre: "#a855f7" };
  const color = CHIP_COLORS[channel] || "#64748b";
  const rgb = _hexToRgb(color);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `rgba(${rgb},0.15)`, border: `1px solid rgba(${rgb},0.3)`, color, borderRadius: 4, padding: "3px 9px", fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 600 }}>
      {channel}{value !== undefined && <span style={{ color: "#94a3b8", fontWeight: 400 }}>· {value}</span>}
    </span>
  );
}

// ============================================================================
// SYNC GOOGLE SHEETS via Apps Script web app
// ============================================================================
// Apps Script à coller dans Extensions > Apps Script du Google Sheet :
//
// function doGet() {
//   const ss = SpreadsheetApp.getActiveSpreadsheet();
//   const sheet = ss.getSheetByName('revenus locatif 2026');
//   const getVals = (row, startCol, numCols) =>
//     sheet.getRange(row, startCol, 1, numCols).getValues()[0]
//       .map(v => typeof v === 'number' ? Math.round(v * 100) / 100 : 0);
//   const BIENS = [
//     { id: 'nogent',     revRow: 6,  occRow: 69,  adrRow: 70,  revparRow: 72,  cfRow: 122 },
//     { id: 'amaryllis',  revRow: 10, occRow: 76,  adrRow: 77,  revparRow: 78,  cfRow: 131 },
//     { id: 'iguana',     revRow: 14, occRow: 82,  adrRow: 83,  revparRow: 84,  cfRow: 138 },
//     { id: 'geko',       revRow: 18, occRow: 88,  adrRow: 89,  revparRow: 90,  cfRow: 145 },
//     { id: 'zandoli',   revRow: 22, occRow: 94,  adrRow: 95,  revparRow: 96,  cfRow: 152 },
//     { id: 'mabouya',   revRow: 26, occRow: 100, adrRow: 101, revparRow: 102, cfRow: 159 },
//     { id: 'schoelcher', revRow: 31, occRow: 106, adrRow: 107, revparRow: 108, cfRow: 169 },
//   ];
//   const nogentRevs = getVals(6, 3, 12);
//   const moisActifs = nogentRevs.filter(v => v > 0).length || new Date().getMonth() + 1;
//   const result = {
//     moisActifs,
//     biens: BIENS.map(b => ({
//       id: b.id,
//       revenus: getVals(b.revRow, 3, 12),
//       occ: getVals(b.occRow, 3, 12).map(v => v / 100),
//       adr: getVals(b.adrRow, 3, 12),
//       revpar: getVals(b.revparRow, 3, 12),
//       cashflow: getVals(b.cfRow, 2, 12),
//     }))
//   };
//   return ContentService.createTextOutput(JSON.stringify(result))
//     .setMimeType(ContentService.MimeType.JSON);
// }
//
// Déployer : Déployer > Nouveau déploiement > Type: Application Web
//            Exécuter en tant que: Moi | Accès: Tout le monde
//            → copier l'URL de déploiement dans le dashboard

async function syncFromSheets(biens, scriptUrl) {
  if (!scriptUrl) throw new Error("URL Apps Script non configurée");
  const res = await fetch(scriptUrl, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error("Réponse HTML reçue — vérifiez que le déploiement Apps Script a Accès : « Tout le monde » (pas « avec un compte Google »)");
  }
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("JSON invalide : " + text.slice(0, 80)); }
  if (data.error) throw new Error("Apps Script : " + data.error);
  return {
    biens: biens.map(b => {
      const found = (data.biens || []).find(x => x.id === b.id);
      if (!found) return b;
      return {
        ...b,
        revenus: found.revenus || b.revenus,
        cashflow: found.cashflow || b.cashflow,
        occ: (found.occ || b.occ).map(v => v > 1.5 ? v : Math.round(v * 1000) / 10),
        adr: found.adr || b.adr,
        revpar: found.revpar || b.revpar,
      };
    }),
    moisActifs: data.moisActifs || N,
    lastSync: new Date().toLocaleString("fr-FR"),
    hist: data.hist || null,
    reservations: data.reservations || [],
  };
}

// ============================================================================
// PARSER ICAL
// ============================================================================
function parseICS(text, bienId, canal = "airbnb") {
  return text.split("BEGIN:VEVENT").slice(1).map(block => {
    const get = (key) => {
      const m = block.match(new RegExp(key + "[^:]*:([^\\r\\n]+)"));
      return m ? m[1].trim() : "";
    };
    const cleanDate = (s) => {
      const d = s.replace(/T.*/, "");
      return d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;
    };
    const extractTime = (raw) => {
      // Try time from DTSTART/DTEND field itself: T160000 or T160000Z
      const tMatch = raw.match(/T(\d{2})(\d{2})/);
      if (tMatch) return `${tMatch[1]}:${tMatch[2]}`;
      return "";
    };

    const rawDtStart = get("DTSTART");
    const rawDtEnd   = get("DTEND");
    const ci = cleanDate(rawDtStart);
    const co = cleanDate(rawDtEnd);
    const sum = get("SUMMARY");
    if (!ci || !co) return null;
    // Filter Airbnb auto-block events ("not available", "Blocked")
    if (/not available|blocked/i.test(sum) && canal !== "booking") return null;
    // Filter Booking.com calendar closures by duration:
    // Booking.com uses identical format (CLOSED - Not available) for real reservations AND manual blocks.
    // Real vacation reservations are ≤ 30 nights. Longer = calendar closure, not a guest.
    if (canal === "booking") {
      const nights = Math.round((new Date(co + "T12:00:00Z") - new Date(ci + "T12:00:00Z")) / 86400000);
      if (nights > 30) return null;
    }

    // Parse DESCRIPTION — Airbnb uses \n literal in iCal
    const desc = get("DESCRIPTION").replace(/\\n/g, "\n");
    const descGet = (patterns) => {
      for (const p of patterns) {
        const m = desc.match(new RegExp(p + "\\s*[:\\-]\\s*([^\\n\\r]+)", "i"));
        if (m) return m[1].trim();
      }
      return "";
    };

    // Extract time from DTSTART/DTEND first, then fallback to DESCRIPTION
    let checkin_time  = extractTime(rawDtStart) || descGet(["Heure d'arrivée","Heure d.arriv[ée]+e","Arrival Time","Check.?in Time","Arrival"]);
    let checkout_time = extractTime(rawDtEnd)   || descGet(["Heure de départ","Heure de depart","Departure Time","Check.?out Time","Departure"]);

    // Normalize "4:00 PM" → "16:00"
    const to24 = (t) => {
      if (!t) return "";
      const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!m) return t;
      let h = parseInt(m[1]), mn = m[2], ap = (m[3] || "").toUpperCase();
      if (ap === "PM" && h < 12) h += 12;
      if (ap === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${mn}`;
    };
    checkin_time  = to24(checkin_time);
    checkout_time = to24(checkout_time);

    const adultStr  = descGet(["Nombre d'adultes","Adults?","Adultes?"]);
    const childStr  = descGet(["Nombre d'enfants","Children?","Enfants?"]);
    const adults    = parseInt(adultStr) || 0;
    const children  = parseInt(childStr) || 0;
    const nb_guests = adults + children || parseInt(descGet(["Guests?","Voyageurs?","Personnes?"])) || 0;

    const phone = descGet(["Téléphone","Telephone","Phone"]);

    const montantRaw = descGet(["Montant total","Montant","Prix total","Total payé","Total","Amount","Payout"]);
    const montant = montantRaw ? parseFloat(montantRaw.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;

    const uid = get("UID");
    const defaultName = canal === "booking" ? "Voyageur Booking" : "Voyageur Airbnb";
    // Booking.com uses SUMMARY:CLOSED — extract booking ID from UID (e.g. "BDC123456@booking.com")
    let voyageur = sum.replace(/^(Réservé|Reserved|Booking|CLOSED)\s*[-–]?\s*/i, "").replace(/\(.*\)/g, "").trim();
    if (!voyageur && canal === "booking" && uid) {
      voyageur = uid.split("@")[0].replace(/^booking[_-]?/i, "").trim();
    }
    voyageur = voyageur || defaultName;

    // Extract booking code from description or UID for Booking.com
    const reservation_code = descGet(["Code de la réservation","Code de reservation","Reservation Code","Confirmation Code","Booking Number","Numéro de réservation"])
      || (canal === "booking" && uid ? uid.split("@")[0] : "");

    return {
      id: uid || `${bienId}-${ci}-${canal}`,
      bienId, voyageur, canal,
      checkin: ci, checkout: co,
      checkin_time, checkout_time, nb_guests,
      reservation_code, phone,
      montant, notes: sum, menage: "",
      menage_done: false, checkin_done: false,
      fromIcal: true,
    };
  }).filter(Boolean);
}

// ============================================================================
// COMPUTE REVENUS FROM RESERVATIONS
// ============================================================================
function computeRevenusFromResas(reservations, year = new Date().getFullYear()) {
  const map = {};
  reservations.forEach(r => {
    if (!r.montant || r.montant <= 0) return;
    if (!r.checkin || r.checkin.slice(0, 4) !== String(year)) return;
    const month = parseInt(r.checkin.slice(5, 7)) - 1;
    if (month < 0 || month > 11) return;
    if (!map[r.bienId]) map[r.bienId] = new Array(12).fill(0);
    map[r.bienId][month] += Math.round(r.montant);
  });
  return map;
}

// ============================================================================
// TODAY BANNER
// ============================================================================
function TodayBanner({ biens, n, reservations, onTab, mob }) {
  const td = todayStr();
  const tm = addDays(td, 1);
  const moisCourant = new Date().getMonth();
  const revMois = biens.reduce((s, b) => s + (b.revenus[moisCourant] || 0), 0);
  const ytdTotal = biens.reduce((s, b) => s + sumN(b.revenus, n), 0);
  const cfTotal = biens.reduce((s, b) => s + sumN(b.cashflow, n), 0);
  const objMois = n > 0 ? Math.round(ytdTotal / n) : 0;
  const pctMois = objMois > 0 ? Math.min((revMois / objMois) * 100, 100) : 0;

  const actions = [];
  reservations.forEach(r => {
    const b = biens.find(x => x.id === r.bienId);
    if (!b) return;
    if (r.checkin === td) actions.push({ icon: "🔑", txt: `Check-in ${b.nom} — ${r.voyageur}`, c: "#10b981" });
    if (r.checkout === td) actions.push({ icon: "🚪", txt: `Check-out ${b.nom}`, c: "#ef4444" });
    if (r.checkout === td && !r.menage_done) actions.push({ icon: "🧹", txt: `Ménage ${b.nom}`, c: "#a855f7" });
    if (r.checkin === tm) actions.push({ icon: "⏰", txt: `Arrivée demain — ${b.nom}`, c: "#f59e0b" });
  });

  const sorted = [...biens].sort((a, b) => sumN(b.revenus, n) - sumN(a.revenus, n));
  const top = sorted[0];
  const flop = sorted[sorted.length - 1];

  return (
    <div style={{ background: "linear-gradient(135deg,#0f172a,#1a2744)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: mob ? "10px 12px" : "10px 22px" }}>
      <div style={{ display: "flex", gap: mob ? 8 : 16, alignItems: "stretch", flexWrap: "wrap" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(14,165,233,0.08)", borderRadius: 10, border: "1px solid rgba(14,165,233,0.15)", flex: mob ? "1 1 42%" : "none" }}>
          <Gauge pct={pctMois} size={44} />
          <div>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {MOIS_FULL[moisCourant]} — objectif
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0ea5e9", fontFamily: "var(--font-mono)" }}>
              {fmtK(revMois)}
              <span style={{ fontSize: 10, color: "#64748b", fontWeight: 400 }}> / {fmtK(objMois)}</span>
            </div>
          </div>
        </div>

        <div style={{
          flex: 1, minWidth: mob ? 160 : 220, padding: "8px 14px",
          background: actions.length ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)",
          borderRadius: 10,
          border: `1px solid ${actions.length ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)"}`
        }}>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
            Actions aujourd'hui
          </div>
          {actions.length === 0 ? (
            <div style={{ fontSize: 12, color: "#10b981" }}>✓ Rien à faire</div>
          ) : (
            actions.slice(0, 2).map((a, i) => (
              <div key={i} style={{ fontSize: 11, color: a.c, display: "flex", alignItems: "center", gap: 4 }}>
                <span>{a.icon}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.txt}</span>
              </div>
            ))
          )}
          {actions.length > 2 && (
            <div style={{ fontSize: 10, color: "#64748b", cursor: "pointer", marginTop: 2 }} onClick={() => onTab("planning")}>
              +{actions.length - 2} autres →
            </div>
          )}
        </div>

        {!mob && top && (
          <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Ce mois</div>
            <div style={{ fontSize: 12, color: "#10b981", marginBottom: 2 }}>
              🏆 {top.nom} — {fmtK(sumN(top.revenus, n))}
            </div>
            <div style={{ fontSize: 12, color: sumN(flop?.revenus, n) === 0 ? "#ef4444" : "#f59e0b" }}>
              ⚠ {flop?.nom} — {fmtK(sumN(flop?.revenus, n))}
            </div>
          </div>
        )}

        {!mob && (
          <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>YTD · Cashflow</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-mono)" }}>{fmtK(ytdTotal)}</div>
            <div style={{ fontSize: 12, color: cfTotal >= 0 ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)" }}>{fmtK(cfTotal)} CF</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// AI SUMMARY
// ============================================================================
function AISummary({ biens, n }) {
  const [txt, setTxt] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const MOIS_NOMS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
      const periodeLabel = n >= 2 ? `${MOIS_NOMS[0]}–${MOIS_NOMS[n-1]} ${year}` : `${MOIS_NOMS[0]} ${year}`;
      const prochainLabel = n < 11 ? `${MOIS_NOMS[n]}–${MOIS_NOMS[Math.min(n+1,11)]}` : "fin d'année";
      const ctx = biens.map(b =>
        `${b.nom}: ${fmt(sumN(b.revenus, n))} revenus, cashflow ${fmt(sumN(b.cashflow, n))}, occupation moyenne ${avgN(b.occ, n).toFixed(0)}%, ADR ${avgN(b.adr, n).toFixed(0)}€`
      ).join("\n");
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Expert gestion locative. Rédige un bilan court et actionnable (3 paragraphes max) en français, basé sur ces données ${periodeLabel}:\n\n${ctx}\n\nFormat: 1) Ce qui performe 2) Ce qui décroche 3) 3 actions concrètes pour ${prochainLabel}. Direct et chiffré.`,
          maxTokens: 500,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setTxt(data.text || "Pas de réponse.");
      setDone(true);
    } catch (e) {
      setTxt("Erreur : " + e.message);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: done ? 12 : 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>🤖 Bilan mensuel IA</div>
        <button
          onClick={generate}
          disabled={loading}
          style={{
            padding: "7px 16px", borderRadius: 8, border: "none",
            background: loading ? "#1e293b" : "linear-gradient(135deg,#0ea5e9,#6366f1)",
            color: "#fff", cursor: loading ? "not-allowed" : "pointer",
            fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {loading ? "Génération…" : "✨ Générer le bilan"}
        </button>
      </div>
      {done && <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{txt}</div>}
      {!done && !loading && (
        <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>
          Génère un bilan personnalisé basé sur tes vraies données.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COCKPIT
// ============================================================================
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

function Cockpit({ biens, n, mob, onUpdateRevenu, reservations = [] }) {
  const BIEN_COLORS = { nogent: "#0ea5e9", amaryllis: "#10b981", iguana: "#6366f1", geko: "#f59e0b", zandoli: "#3b82f6", mabouya: "#ec4899", schoelcher: "#8b5cf6" };
  const tc = { court: "#0ea5e9", long: "#10b981", moyen: "#f59e0b" };
  const tl = { court: "Court", long: "Long", moyen: "Moyen" };

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

// ============================================================================
// PLANNING
// ============================================================================
const EMPTY_FORM = { bienId: "amaryllis", voyageur: "", canal: "booking", checkin: "", checkout: "", checkin_time: "", checkout_time: "", nb_guests: "", montant: "", notes: "", menage: "", reservation_code: "", phone: "", assigne: "" };

function Planning({ biens, mob, reservations, saveRes, icalUrls, saveUrls, icalUrlsBooking, saveUrlsBooking, scriptUrl, onApplyRevenusFromResas, pushReservationsToScript }) {
  const reservationsRef = useRef(reservations);
  useEffect(() => { reservationsRef.current = reservations; }, [reservations]);

  const [showUrls, setShowUrls] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [icalStatus, setIcalStatus] = useState({});
  const [lastIcalSync, setLastIcalSync] = useState(null);
  const [view, setView] = useState("todo");
  const [ganttBienFilter, setGanttBienFilter] = useState(null); // null = all
  const [searchQuery, setSearchQuery] = useState("");
  const [dailyPrices, setDailyPrices] = useState(loadDailyPrices);

  useEffect(() => {
    const handler = () => setDailyPrices(loadDailyPrices());
    window.addEventListener("amaryllis_prices_updated", handler);
    return () => window.removeEventListener("amaryllis_prices_updated", handler);
  }, []);

  // ── Toast system global ──────────────────────────────────────────────────
  // type: "info" | "success" | "error"  (défaut: "info")
  const [resaToasts, setResaToasts] = useState([]);
  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setResaToasts(t => [...t, { id, msg, type }]);
    const delay = type === "error" ? 10000 : 6000;
    setTimeout(() => setResaToasts(t => t.filter(x => x.id !== id)), delay);
  }, []);

  const importIcal = useCallback(async (bienId, canal, url, currentResas) => {
    if (!url) return currentResas;
    const statusKey = `${bienId}_${canal}`;
    setIcalStatus(s => ({ ...s, [statusKey]: "loading" }));
    const tryFetch = async (fetchUrl) => {
      const r = await fetch(fetchUrl, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    };
    try {
      let text = "";
      const proxies = [
        () => tryFetch(`/api/fetch-ical?url=${encodeURIComponent(url)}`),
        () => tryFetch(url),
        scriptUrl ? () => tryFetch(`${scriptUrl}?action=fetchIcal&url=${encodeURIComponent(url)}`) : null,
        () => tryFetch(`https://corsproxy.io/?${encodeURIComponent(url)}`),
        () => tryFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`),
      ].filter(Boolean);
      for (const fn of proxies) {
        try { text = await fn(); if (text.includes("VCALENDAR")) break; } catch {}
      }
      if (!text.includes("VCALENDAR")) throw new Error("Format invalide");
      const newEvents = parseICS(text, bienId, canal);

      // ── Détection nouvelles réservations (comparaison UIDs) ──
      const prevIds = new Set(
        currentResas.filter(r => r.fromIcal && r.bienId === bienId && r.canal === canal).map(r => r.id)
      );
      const trueNew = newEvents.filter(e => !prevIds.has(e.id));
      if (trueNew.length > 0) {
        const bienNom = trueNew[0].bienId.charAt(0).toUpperCase() + trueNew[0].bienId.slice(1);
        addToast(`🔔 ${trueNew.length} nouvelle${trueNew.length > 1 ? "s" : ""} réservation${trueNew.length > 1 ? "s" : ""} — ${bienNom} (${canal})`);
      }

      const merged = [...currentResas.filter(r => !(r.bienId === bienId && r.fromIcal && r.canal === canal)), ...newEvents];
      saveRes(merged);
      setIcalStatus(s => ({ ...s, [statusKey]: `✓ ${newEvents.length}` }));
      setLastIcalSync(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      return merged;
    } catch (e) {
      setIcalStatus(s => ({ ...s, [statusKey]: `⚠ ${e.message}` }));
      return currentResas;
    }
  }, [saveRes, scriptUrl, addToast]);

  // Refs qui suivent les valeurs courantes des URLs iCal — permet à l'effet avec
  // deps [] de toujours lire les URLs à jour, même si elles arrivent après le montage
  // (ex: chargées depuis /api/get-config quelques ms plus tard).
  const icalUrlsRef        = useRef(icalUrls);
  const icalUrlsBookingRef = useRef(icalUrlsBooking);
  const importIcalRef      = useRef(importIcal);
  useEffect(() => { icalUrlsRef.current = icalUrls; },               [icalUrls]);
  useEffect(() => { icalUrlsBookingRef.current = icalUrlsBooking; }, [icalUrlsBooking]);
  useEffect(() => { importIcalRef.current = importIcal; },           [importIcal]);

  // ── Auto-sync au chargement + toutes les heures ──────────────────────────
  useEffect(() => {
    const getSources = () => {
      const srcs = [];
      Object.keys(icalUrlsRef.current).forEach(k => { if (icalUrlsRef.current[k]?.length > 10) srcs.push({ bienId: k, canal: "airbnb", url: icalUrlsRef.current[k] }); });
      Object.keys(icalUrlsBookingRef.current).forEach(k => { if (icalUrlsBookingRef.current[k]?.length > 10) srcs.push({ bienId: k, canal: "booking", url: icalUrlsBookingRef.current[k] }); });
      return srcs;
    };
    const sources = getSources();
    if (sources.length === 0) return;

    // Verrou pour éviter les syncs concurrentes (ex: sync horaire qui démarre
    // pendant que la précédente tourne encore → race condition sur reservationsRef)
    let syncing = false;
    const doSync = async () => {
      if (syncing) return;
      syncing = true;
      try {
        // Relit les sources à chaque tick pour capturer les URLs chargées après le montage
        const currentSources = getSources();
        let current = reservationsRef.current;
        for (const s of currentSources) {
          current = await importIcalRef.current(s.bienId, s.canal, s.url, current) || current;
        }
        if (onApplyRevenusFromResas) onApplyRevenusFromResas(computeRevenusFromResas(current));
        pushReservationsToScript(current);
      } finally {
        syncing = false;
      }
    };

    doSync(); // sync immédiate au chargement
    const interval = setInterval(doSync, 60 * 60 * 1000); // puis toutes les heures
    return () => clearInterval(interval);
  }, []);

  // ── Auto-sync Beds24 (Nogent) dans le Planning ─────────────────────
  const [beds24SyncStatus, setBeds24SyncStatus] = useState("idle"); // idle | loading | ok | error

  const syncBeds24InPlanning = useCallback(async (currentResas) => {
    setBeds24SyncStatus("loading");
    try {
      const res = await fetch("/api/beds24-bookings");
      if (!res.ok) { setBeds24SyncStatus("error"); return currentResas; }
      const data = await res.json();
      if (data.error || !data.bookings) { setBeds24SyncStatus("error"); return currentResas; }
      const beds24 = data.bookings
        .filter(b => b.statusLabel !== "Annulé")
        .map(b => ({
          id:               "beds24-" + b.bookingId,
          bienId:           "nogent",
          voyageur:         b.guestName || "—",
          canal:            b.channelLabel || b.channel || "Beds24",
          checkin:          b.arrival,
          checkout:         b.departure,
          checkin_time:     "",
          checkout_time:    "",
          nb_guests:        b.numGuests || 1,
          montant:          b.price || 0,
          notes:            b.notes || "",
          phone:            b.phone || "",
          reservation_code: String(b.bookingId),
          fromBeds24:       true,
          fromIcal:         false,
          menage_done:      false,
          assigne:          "",
        }));
      const merged = [...(currentResas || reservations).filter(r => !String(r.id).startsWith("beds24-")), ...beds24];
      saveRes(merged);
      setBeds24SyncStatus("ok");
      return merged;
    } catch (_) {
      setBeds24SyncStatus("error");
      return currentResas || reservations;
    }
  }, [saveRes, reservations]);

  useEffect(() => {
    syncBeds24InPlanning(reservationsRef.current);
    const interval = setInterval(() => syncBeds24InPlanning(reservationsRef.current), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openEdit = (r) => {
    setForm({ bienId: r.bienId, voyageur: r.voyageur, canal: r.canal, checkin: r.checkin, checkout: r.checkout, checkin_time: r.checkin_time || "", checkout_time: r.checkout_time || "", nb_guests: r.nb_guests || "", montant: r.montant || "", notes: r.notes || "", menage: r.menage || "", reservation_code: r.reservation_code || "", phone: r.phone || "", assigne: r.assigne || "" });
    setEditId(r.id);
    setShowForm(true);
  };

  const saveForm = () => {
    if (!form.checkin || !form.checkout || !form.voyageur) return;
    const data = { ...form, montant: parseFloat(form.montant) || 0 };
    if (editId !== null) {
      const updated = reservations.map(r => r.id === editId ? { ...r, ...data } : r);
      saveRes(updated);
      if (scriptUrl) {
        const p = new URLSearchParams({ action: "addReservation", id: String(editId), bienId: data.bienId, voyageur: data.voyageur, canal: data.canal, checkin: data.checkin, checkout: data.checkout, montant: String(data.montant), notes: data.notes || "" });
        fetch(`${scriptUrl}?${p}`, { redirect: "follow" }).catch(() => {});
      }
    } else {
      const newR = { id: Date.now(), ...data, menage_done: false, checkin_done: false };
      saveRes([...reservations, newR]);
      if (scriptUrl) {
        const p = new URLSearchParams({ action: "addReservation", id: String(newR.id), bienId: newR.bienId, voyageur: newR.voyageur, canal: newR.canal, checkin: newR.checkin, checkout: newR.checkout, montant: String(newR.montant), notes: newR.notes || "" });
        fetch(`${scriptUrl}?${p}`, { redirect: "follow" }).catch(() => {});
      }
    }
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  };
  const delRes = (id) => {
    saveRes(reservations.filter(r => r.id !== id));
    if (scriptUrl) {
      fetch(`${scriptUrl}?action=deleteReservation&id=${id}`, { redirect: "follow" }).catch(() => {});
    }
  };
  const togRes = (id, field) => saveRes(reservations.map(r => r.id === id ? { ...r, [field]: !r[field] } : r));

  const syncAll = () => {
    const sources = [];
    Object.keys(icalUrls).forEach(k => { if (icalUrls[k]) sources.push({ bienId: k, canal: "airbnb", url: icalUrls[k] }); });
    Object.keys(icalUrlsBooking).forEach(k => { if (icalUrlsBooking[k]) sources.push({ bienId: k, canal: "booking", url: icalUrlsBooking[k] }); });
    let current = reservations;
    (async () => {
      for (const s of sources) {
        current = await importIcal(s.bienId, s.canal, s.url, current) || current;
      }
      if (onApplyRevenusFromResas) onApplyRevenusFromResas(computeRevenusFromResas(current));
      pushReservationsToScript(current);
    })();
  };

  const td = todayStr();
  const tm = addDays(td, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthStart = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  const monthEnd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  // Filtre global par bien (partagé entre toutes les vues)
  const filteredReservations = ganttBienFilter ? reservations.filter(r => r.bienId === ganttBienFilter) : reservations;
  const rMonth = filteredReservations.filter(r => r.checkin <= monthEnd && r.checkout >= monthStart);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const isToday = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` === td;
  const getCell = (bienId, day) => {
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const r = rMonth.find(r => r.bienId === bienId && r.checkin <= ds && r.checkout > ds);
    if (!r) return null;
    return { r, isCI: r.checkin === ds, color: CC[r.canal] || "#64748b", bg: CB[r.canal] || "rgba(100,116,139,0.15)" };
  };

  const todos = [];
  filteredReservations.forEach(r => {
    const b = biens.find(x => x.id === r.bienId);
    if (!b) return;
    const ciSub = [r.voyageur, r.checkin_time ? `🕐 ${r.checkin_time}` : "", r.nb_guests ? `👥 ${r.nb_guests}` : ""].filter(Boolean).join(" · ");
    const coSub = [r.voyageur, r.checkout_time ? `🕐 ${r.checkout_time}` : ""].filter(Boolean).join(" · ");
    if (r.checkin === td) todos.push({ id: `ci-${r.id}`, icon: "🔑", label: `Check-in — ${b.nom}`, sub: ciSub, c: "#10b981", done: r.checkin_done, onT: () => togRes(r.id, "checkin_done"), urgent: true });
    if (r.checkout === td) todos.push({ id: `co-${r.id}`, icon: "🚪", label: `Check-out — ${b.nom}`, sub: coSub, c: "#ef4444", done: false, urgent: true });
    // Ménage : apparaît dès le checkout jusqu'au prochain check-in (ou pendant 7j max)
    const menageWindow = r.checkout <= td && r.checkout >= addDays(td, -7);
    const preCheckin = r.checkin === tm || r.checkin === td;
    if (!r.menage_done && (menageWindow || preCheckin)) {
      const daysBeforeCI = diffDays(td, r.checkin);
      const menUrgent = daysBeforeCI <= 1;
      todos.push({ id: `mn-${r.id}`, icon: "🧹", label: `Ménage — ${b.nom}`, sub: r.assigne ? `👤 ${r.assigne}` : (r.menage || "Prestataire à contacter"), c: "#a855f7", done: r.menage_done, onT: () => togRes(r.id, "menage_done"), urgent: menUrgent });
    }
    if (r.checkin === tm) todos.push({ id: `ci2-${r.id}`, icon: "⏰", label: `Arrivée demain — ${b.nom}`, sub: [r.voyageur, r.checkin_time ? `🕐 ${r.checkin_time}` : "", r.nb_guests ? `👥 ${r.nb_guests}` : ""].filter(Boolean).join(" · "), c: "#f59e0b", done: false, urgent: false });
  });

  return (
    <div>
      {/* ── Toast stack global (bas à droite) ── */}
      {resaToasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column-reverse", gap: 8, maxWidth: 360 }}>
          {resaToasts.map(t => {
            const colors = {
              success: { border: "#22c55e", icon: "✓", accent: "#22c55e" },
              error:   { border: "#ef4444", icon: "✕", accent: "#f87171" },
              info:    { border: "#0ea5e9", icon: "🔔", accent: "#38bdf8" },
            }[t.type] || { border: "#0ea5e9", icon: "🔔", accent: "#38bdf8" };
            return (
              <div key={t.id} style={{
                background: "#0f172a", border: `1px solid ${colors.border}44`,
                borderLeft: `3px solid ${colors.border}`,
                borderRadius: 10, padding: "11px 14px",
                color: "#e2e8f0", fontSize: 12.5, fontWeight: 500,
                boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                animation: "fadeIn 0.25s ease",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <span style={{ fontSize: 14, color: colors.accent, flexShrink: 0, marginTop: 1 }}>{colors.icon}</span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{t.msg}</span>
                <button onClick={() => setResaToasts(x => x.filter(r => r.id !== t.id))}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {[{ id: "todo", l: "✅ To-do" }, { id: "gantt", l: "📅 Calendrier" }, { id: "trous", l: "🕳 Trous" }, { id: "list", l: "📋 Réservations" }, { id: "beds24", l: "🏙️ Beds24 Nogent" }, { id: "minnights", l: "🗓 Nuits min." }].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: view === v.id ? "#0ea5e9" : "rgba(255,255,255,0.06)",
              color: view === v.id ? "#fff" : "#94a3b8",
            }}
          >{v.l}</button>
        ))}
        <button
          onClick={() => setShowForm(true)}
          style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 20, border: "1px dashed #334155", background: "none", color: "#0ea5e9", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
        >+ Ajouter</button>
      </div>

      {/* Filtre par bien — global à toutes les vues */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#475569", marginRight: 2 }}>Bien :</span>
        <button onClick={() => setGanttBienFilter(null)} style={{ padding: "3px 10px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 10, fontWeight: ganttBienFilter === null ? 700 : 400, background: ganttBienFilter === null ? "#6366f1" : "rgba(255,255,255,0.06)", color: ganttBienFilter === null ? "#fff" : "#64748b" }}>Tous</button>
        {biens.map(b => (
          <button key={b.id} onClick={() => setGanttBienFilter(ganttBienFilter === b.id ? null : b.id)} style={{ padding: "3px 10px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 10, fontWeight: ganttBienFilter === b.id ? 700 : 400, background: ganttBienFilter === b.id ? "#6366f1" : "rgba(255,255,255,0.06)", color: ganttBienFilter === b.id ? "#fff" : "#64748b" }}>{b.emoji} {b.nom.replace("Villa ", "").replace("T2 ", "")}</button>
        ))}
      </div>

      {view === "todo" && (
        <div>
          <div style={{ background: "rgba(255,90,95,0.07)", border: "1px solid rgba(255,90,95,0.2)", borderRadius: 11, padding: "11px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                iCal sync
                {Object.values(icalStatus).some(v => v === "loading") && <span style={{ fontSize: 10, color: "#0ea5e9", marginLeft: 6 }}>⟳ Synchro…</span>}
                {!Object.values(icalStatus).some(v => v === "loading") && Object.keys(icalStatus).length > 0 && <span style={{ fontSize: 10, color: "#10b981", marginLeft: 6 }}>✓ Synchronisé</span>}
                {lastIcalSync && <span style={{ fontSize: 9, color: "#475569", marginLeft: 4 }}>sync {lastIcalSync}</span>}
              </span>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: beds24SyncStatus === "loading" ? "#0ea5e9" : beds24SyncStatus === "ok" ? "#10b981" : beds24SyncStatus === "error" ? "#ef4444" : "#64748b" }}>
                  {beds24SyncStatus === "loading" ? "⟳ Beds24…" : beds24SyncStatus === "ok" ? "🏙️ Nogent ✓" : beds24SyncStatus === "error" ? "⚠ Beds24" : "🏙️ Nogent"}
                </span>
                <button onClick={() => syncBeds24InPlanning(reservations)} style={{ padding: "5px 9px", borderRadius: 6, border: "1px solid #334155", background: "none", color: "#a78bfa", cursor: "pointer", fontSize: 10 }}>
                  ⟳
                </button>
                <button onClick={() => setShowUrls(!showUrls)} style={{ padding: "5px 9px", borderRadius: 6, border: "1px solid #334155", background: "none", color: "#64748b", cursor: "pointer", fontSize: 10 }}>
                  {showUrls ? "▲" : "▼"} URLs
                </button>
                <button onClick={syncAll} style={{ padding: "5px 11px", borderRadius: 6, border: "none", background: "#FF5A5F", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  ⟳ Sync
                </button>
              </div>
            </div>
            {showUrls && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 10, color: "#FF5A5F", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Airbnb</div>
                {biens.filter(b => b.type !== "long").map(b => {
                  const sk = `${b.id}_airbnb`;
                  return (
                    <div key={b.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 5, alignItems: "center" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{b.emoji} {b.nom.replace("Villa ", "").replace("T2 ", "")}</div>
                      <input
                        value={icalUrls[b.id] || ""}
                        onChange={(e) => saveUrls({ ...icalUrls, [b.id]: e.target.value })}
                        placeholder="URL iCal Airbnb…"
                        style={{ padding: "5px 7px", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", fontSize: 10, width: "100%", boxSizing: "border-box" }}
                      />
                      <div style={{ fontSize: 10, color: icalStatus[sk]?.startsWith("✓") ? "#10b981" : "#f59e0b", whiteSpace: "nowrap" }}>
                        {icalStatus[sk] || ""}
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>Booking.com</div>
                {biens.filter(b => b.type !== "long").map(b => {
                  const sk = `${b.id}_booking`;
                  return (
                    <div key={b.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 5, alignItems: "center" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{b.emoji} {b.nom.replace("Villa ", "").replace("T2 ", "")}</div>
                      <input
                        value={icalUrlsBooking[b.id] || ""}
                        onChange={(e) => saveUrlsBooking({ ...icalUrlsBooking, [b.id]: e.target.value })}
                        placeholder="URL iCal Booking.com…"
                        style={{ padding: "5px 7px", background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 6, color: "#e2e8f0", fontSize: 10, width: "100%", boxSizing: "border-box" }}
                      />
                      <div style={{ fontSize: 10, color: icalStatus[sk]?.startsWith("✓") ? "#10b981" : "#f59e0b", whiteSpace: "nowrap" }}>
                        {icalStatus[sk] || ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>
            Aujourd'hui & demain — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </div>

          {todos.length === 0 ? (
            <div style={{ padding: 18, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 11, textAlign: "center", fontSize: 13, color: "#10b981" }}>
              ✓ Aucune action urgente
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {todos.map(a => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                  background: a.done ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${a.c}${a.done ? "22" : "44"}`,
                  borderLeft: `3px solid ${a.done ? a.c + "55" : a.c}`,
                  borderRadius: 9, opacity: a.done ? 0.5 : 1
                }}>
                  <span style={{ fontSize: 16 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: a.done ? "#475569" : "#e2e8f0", fontSize: 12, textDecoration: a.done ? "line-through" : "none" }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{a.sub}</div>
                  </div>
                  {a.urgent && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "rgba(239,68,68,0.15)", color: "#ef4444", fontWeight: 600 }}>URGENT</span>}
                  {a.onT && (
                    <button onClick={a.onT} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: a.done ? "rgba(255,255,255,0.05)" : "rgba(16,185,129,0.15)", color: a.done ? "#475569" : "#10b981", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                      {a.done ? "Annuler" : "✓ Fait"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {filteredReservations.filter(r => r.checkin > td && r.checkin <= addDays(td, 7)).length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: "16px 0 8px" }}>7 prochains jours</div>
              {filteredReservations
                .filter(r => r.checkin > td && r.checkin <= addDays(td, 7))
                .sort((a, b) => a.checkin.localeCompare(b.checkin))
                .map(r => {
                  const b = biens.find(x => x.id === r.bienId);
                  return (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", background: "rgba(255,255,255,0.02)", borderRadius: 9, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 5 }}>
                      <span style={{ fontSize: 14 }}>{b?.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{b?.nom} — {r.voyageur}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{r.checkin} → {r.checkout} · {diffDays(r.checkin, r.checkout)}j</div>
                      </div>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: CB[r.canal], color: CC[r.canal], fontWeight: 600 }}>{r.canal}</span>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}

      {view === "gantt" && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 14, overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{MOIS_FULL[viewMonth]} {viewYear}</span>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }} style={{ padding: "3px 9px", borderRadius: 6, border: "1px solid #334155", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>‹</button>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }} style={{ padding: "3px 9px", borderRadius: 6, border: "1px solid #334155", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>›</button>
            </div>
          </div>
          <div style={{ minWidth: 480 }}>
            <div style={{ display: "grid", gridTemplateColumns: `72px repeat(${daysInMonth},1fr)`, gap: 1, marginBottom: 2 }}>
              <div />
              {days.map(d => (
                <div key={d} style={{ fontSize: 9, color: isToday(d) ? "#0ea5e9" : "#475569", textAlign: "center", fontWeight: isToday(d) ? 700 : 400 }}>{d}</div>
              ))}
            </div>
            {(ganttBienFilter ? biens.filter(b => b.id === ganttBienFilter) : biens).map(b => {
              const baseP = DEFAULT_PRIX[b.id] || 0;
              return (
              <div key={b.id}>
                <div style={{ display: "grid", gridTemplateColumns: `72px repeat(${daysInMonth},1fr)`, gap: 1, marginBottom: 1 }}>
                  <div style={{ fontSize: 9, color: "#94a3b8", display: "flex", alignItems: "center", gap: 2, paddingRight: 3 }}>
                    <span>{b.emoji}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.nom.replace("Villa ", "").replace("T2 ", "")}</span>
                  </div>
                  {days.map(d => {
                    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const menR = reservations.find(r => r.bienId === b.id && r.checkout === ds && !r.menage_done);
                    const c = getCell(b.id, d);
                    if (menR && !c) {
                      return <div key={d} onClick={() => togRes(menR.id, "menage_done")} title="🧹 Ménage" style={{ height: 20, background: "rgba(168,85,247,0.2)", borderRadius: 1, cursor: "pointer", border: "1px dashed #a855f733" }} />;
                    }
                    if (!c) {
                      return <div key={d} style={{ height: 20, background: isToday(d) ? "rgba(14,165,233,0.05)" : "rgba(255,255,255,0.02)", borderRadius: 1 }} />;
                    }
                    return (
                      <div
                        key={d}
                        title={`${c.r.voyageur} · ${c.r.checkin}→${c.r.checkout}`}
                        style={{ height: 20, background: c.bg, borderRadius: c.isCI ? 2 : 0, borderLeft: c.isCI ? `2px solid ${c.color}` : "none", borderTop: `1px solid ${c.color}33`, borderBottom: `1px solid ${c.color}33`, overflow: "hidden", position: "relative" }}
                      >
                        {c.isCI && <span style={{ position: "absolute", left: 2, top: 1, fontSize: 7, color: c.color, fontWeight: 700, whiteSpace: "nowrap" }}>{c.r.voyageur.split(" ")[0]}</span>}
                      </div>
                    );
                  })}
                </div>
                {/* Price row */}
                <div style={{ display: "grid", gridTemplateColumns: `72px repeat(${daysInMonth},1fr)`, gap: 1, marginBottom: 3 }}>
                  <div style={{ fontSize: 7, color: "#1e3a4a", display: "flex", alignItems: "center", paddingLeft: 2 }}>€</div>
                  {days.map(d => {
                    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const p = dailyPrices[b.id]?.[ds] ?? null;
                    return (
                      <div key={d} style={{ height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 6, color: p !== null ? (p > baseP * 1.1 ? "#f59e0b" : p < baseP * 0.9 ? "#10b981" : "#0ea5e9") : "#1e3a4a", fontWeight: p !== null ? 700 : 400 }}>
                          {p !== null ? p : baseP}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            {Object.entries(CC).map(([k, c]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: c }} />
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "trous" && (() => {
        const td = todayStr();
        const horizon = 60; // jours à scanner
        const trousByBien = biens.filter(b => b.type !== "long").map(b => {
          const bResas = reservations.filter(r => r.bienId === b.id).sort((a, b) => a.checkin.localeCompare(b.checkin));
          const trous = [];
          let cursor = td;
          const endHorizon = addDays(td, horizon);
          for (const r of bResas) {
            if (r.checkout <= td) continue;
            if (r.checkin > endHorizon) break;
            if (r.checkin > cursor) {
              const days = diffDays(cursor, r.checkin);
              if (days >= 3) {
                trous.push({ start: cursor, end: r.checkin, days });
              }
            }
            if (r.checkout > cursor) cursor = r.checkout;
          }
          if (cursor < endHorizon) {
            const days = diffDays(cursor, endHorizon);
            if (days >= 3) trous.push({ start: cursor, end: endHorizon, days, open: true });
          }
          return { bien: b, trous };
        });
        const totalDaysVides = trousByBien.reduce((s, x) => s + x.trous.reduce((ss, t) => ss + t.days, 0), 0);
        const totalTrous = trousByBien.reduce((s, x) => s + x.trous.length, 0);
        const adrMoyen = biens.filter(b => b.type !== "long").reduce((s, b) => s + avgN(b.adr), 0) / Math.max(biens.filter(b => b.type !== "long").length, 1);
        const revenuPotentielPerdu = Math.round(totalDaysVides * adrMoyen * 0.5);

        const urgenceLabel = (start) => {
          const d = diffDays(td, start);
          if (d <= 7) return { l: "🔴 Imminent", c: "#ef4444", bg: "rgba(239,68,68,0.08)" };
          if (d <= 21) return { l: "🟠 Bientôt", c: "#f59e0b", bg: "rgba(245,158,11,0.07)" };
          return { l: "🔵 Lointain", c: "#0ea5e9", bg: "rgba(14,165,233,0.06)" };
        };

        return (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Jours libres / 60</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444", fontFamily: "var(--font-mono)" }}>{totalDaysVides}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Sur les 60 prochains jours</div>
              </div>
              <div style={{ flex: 1, minWidth: 140, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Trous détectés</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b", fontFamily: "var(--font-mono)" }}>{totalTrous}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Périodes vides &gt; 3 jours</div>
              </div>
              <div style={{ flex: 1, minWidth: 140, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Revenu potentiel</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#0ea5e9", fontFamily: "var(--font-mono)" }}>{fmtK(revenuPotentielPerdu)}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Si 50% remplis à l'ADR moyen</div>
              </div>
            </div>

            {totalTrous === 0 ? (
              <div style={{ padding: 24, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, textAlign: "center", fontSize: 14, color: "#10b981" }}>
                ✓ Aucun trou de plus de 3 jours détecté sur les {horizon} prochains jours
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {trousByBien.filter(x => x.trous.length > 0).map(({ bien, trous }) => (
                  <div key={bien.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 11, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 17 }}>{bien.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{bien.nom}</span>
                      <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>{trous.length} trou{trous.length > 1 ? "s" : ""} · {trous.reduce((s, t) => s + t.days, 0)} jours</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {trous.map((t, i) => {
                        const u = urgenceLabel(t.start);
                        const revPot = Math.round(t.days * avgN(bien.adr) * 0.5);
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: u.bg, border: `1px solid ${u.c}33`, borderLeft: `3px solid ${u.c}`, borderRadius: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>
                                {t.start} → {t.end} {t.open && <span style={{ color: "#64748b", fontSize: 10 }}>(reste de la fenêtre)</span>}
                              </div>
                              <div style={{ fontSize: 10, color: "#64748b" }}>
                                {t.days} jours vides · Revenu potentiel ~{fmtK(revPot)}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: u.c + "22", color: u.c, fontWeight: 600 }}>{u.l}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 9, fontSize: 11, color: "#cbd5e1" }}>
              💡 <strong>Pistes :</strong> baisser le prix de la période, créer une offre "last minute", proposer un séjour à la nuit, contacter d'anciens voyageurs avec promo
            </div>
          </div>
        );
      })()}

      {view === "list" && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden" }}>
          <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              Réservations ({filteredReservations.length}{ganttBienFilter ? ` · ${biens.find(b=>b.id===ganttBienFilter)?.nom || ganttBienFilter}` : ""})
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                placeholder="🔍 Voyageur, bien, canal…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 11, width: 180, outline: "none" }}
              />
              {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>✕</button>}
              <span style={{ fontSize: 10, color: "#10b981" }}>
                {filteredReservations.filter(r => r.fromIcal).length} Airbnb · {filteredReservations.filter(r => !r.fromIcal).length} manuelles
              </span>
            </div>
          </div>
          {(() => {
            const q = searchQuery.toLowerCase().trim();
            const listResas = q
              ? filteredReservations.filter(r => {
                  const bien = biens.find(x => x.id === r.bienId);
                  return (r.voyageur || "").toLowerCase().includes(q)
                    || (r.canal || "").toLowerCase().includes(q)
                    || (bien?.nom || "").toLowerCase().includes(q)
                    || (r.checkin || "").includes(q)
                    || (r.checkout || "").includes(q)
                    || (r.notes || "").toLowerCase().includes(q)
                    || (r.reservation_code || "").toLowerCase().includes(q);
                })
              : filteredReservations;
            if (listResas.length === 0) return (
              <div style={{ padding: 20, textAlign: "center", color: "#475569", fontSize: 12 }}>
                {q ? `Aucun résultat pour "${q}"` : `Aucune réservation${ganttBienFilter ? " pour ce bien" : ""}`}
              </div>
            );
            return (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 660 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Bien", "Voyageur", "Canal", "Arrivée", "Heure CI", "Départ", "Heure CO", "👥", "Nuits", "✅", "🧹", ""].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...listResas].sort((a, b) => a.checkin.localeCompare(b.checkin)).map(r => {
                    const b = biens.find(x => x.id === r.bienId);
                    const isPast = r.checkout < td;
                    const isCurr = r.checkin <= td && r.checkout > td;
                    return (
                      <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", opacity: isPast ? 0.4 : 1, background: isCurr ? "rgba(16,185,129,0.05)" : "transparent" }}>
                        <td style={{ padding: "8px 10px", fontSize: 11 }}>{b?.emoji} {b?.nom}</td>
                        <td style={{ padding: "8px 10px", color: "#e2e8f0", fontSize: 11, fontWeight: 500 }}>
                          {r.voyageur}
                          {r.fromIcal && <span style={{ fontSize: 8, color: "#FF5A5F", marginLeft: 3, padding: "1px 4px", borderRadius: 4, background: "rgba(255,90,95,0.1)" }}>Airbnb</span>}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: CB[r.canal], color: CC[r.canal], fontWeight: 600 }}>{r.canal}</span>
                        </td>
                        <td style={{ padding: "8px 10px", color: "#94a3b8", fontSize: 10, fontFamily: "var(--font-mono)" }}>{r.checkin}</td>
                        <td style={{ padding: "8px 10px", color: "#0ea5e9", fontSize: 10, fontFamily: "var(--font-mono)" }}>{r.checkin_time || "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#94a3b8", fontSize: 10, fontFamily: "var(--font-mono)" }}>{r.checkout}</td>
                        <td style={{ padding: "8px 10px", color: "#f59e0b", fontSize: 10, fontFamily: "var(--font-mono)" }}>{r.checkout_time || "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#64748b", fontSize: 10, textAlign: "center" }}>{r.nb_guests || "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#64748b", fontSize: 11 }}>{diffDays(r.checkin, r.checkout)}j</td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <button onClick={() => togRes(r.id, "checkin_done")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: r.checkin_done ? 1 : 0.2 }}>✅</button>
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <button onClick={() => togRes(r.id, "menage_done")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: r.menage_done ? 1 : 0.2 }}>🧹</button>
                        </td>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                          <button onClick={() => openEdit(r)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0ea5e9", fontSize: 11, marginRight: 4 }}>✎</button>
                          <button onClick={() => delRes(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 11 }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            );
          })()}
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 22, width: "100%", maxWidth: 340, maxHeight: "calc(90vh - env(safe-area-inset-bottom))", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>{editId !== null ? "✎ Modifier réservation" : "Nouvelle réservation"}</div>
            {[
              { l: "Bien", k: "bienId", t: "select", opts: biens.map(b => ({ v: b.id, l: `${b.emoji} ${b.nom}` })) },
              { l: "Voyageur", k: "voyageur", t: "text", ph: "Nom" },
              { l: "Nbre voyageurs", k: "nb_guests", t: "number", ph: "2" },
              { l: "Canal", k: "canal", t: "select", opts: [{ v: "airbnb", l: "Airbnb" }, { v: "booking", l: "Booking" }, { v: "direct", l: "Direct" }, { v: "autre", l: "Autre" }] },
              { l: "Check-in", k: "checkin", t: "date" },
              { l: "Heure arrivée", k: "checkin_time", t: "time" },
              { l: "Check-out", k: "checkout", t: "date" },
              { l: "Heure départ", k: "checkout_time", t: "time" },
              { l: "Montant €", k: "montant", t: "number", ph: "0" },
              { l: "Ménage — prestataire", k: "menage", t: "text", ph: "Nom / contact" },
              { l: "Assigné à", k: "assigne", t: "text", ph: "Assigné à (ménage/conciergerie)…" },
              { l: "Code réservation", k: "reservation_code", t: "text", ph: "HM…" },
              { l: "Téléphone", k: "phone", t: "text", ph: "+596…" },
              { l: "Notes", k: "notes", t: "text", ph: "" },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 9 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2, textTransform: "uppercase" }}>{f.l}</div>
                {f.t === "select" ? (
                  <select value={form[f.k]} onChange={(e) => setForm(x => ({ ...x, [f.k]: e.target.value }))} style={{ width: "100%", padding: "7px 9px", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12 }}>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : (
                  <input type={f.t} placeholder={f.ph || ""} value={form[f.k]} onChange={(e) => setForm(x => ({ ...x, [f.k]: e.target.value }))} style={{ width: "100%", padding: "7px 9px", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
              <button onClick={saveForm} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{editId !== null ? "Enregistrer" : "Ajouter"}</button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #334155", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {view === "beds24" && (
        <Beds24Admin scriptUrl={scriptUrl} reservations={reservations} saveRes={saveRes} addToast={addToast} />
      )}
      {view === "minnights" && <MinNightsConfig />}
    </div>
  );
}

// ============================================================================
// PRÉVISIONNEL
// ============================================================================
function Previsionnel({ biens, n, mob, hist = HIST_SEED }) {
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

// ============================================================================
// HISTORIQUE
// ============================================================================
function Historique({ biens, n, mob, hist = HIST_SEED }) {
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
    ...Object.fromEntries(histYearsAll.map(y => [y, (id === "all" ? hist[y]?.total : hist[y]?.[id] || [])[m] || 0])),
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

// ============================================================================
// PILOTAGE (Canaux / Fiscal / Détail charges)
// ── MinNightsConfig — sous-composant UI admin ────────────────────
const MIN_NIGHTS_DEFAULTS_ADMIN = {
  amaryllis: 4, geko: 3, zandoli: 3, schoelcher: 3, mabouya: 2, nogent: 1, iguana: 0,
};
const BIEN_NAMES_ADMIN = {
  amaryllis: "Villa Amaryllis", geko: "Géko", zandoli: "Zandoli",
  schoelcher: "Bellevue", mabouya: "Mabouya", nogent: "Appt. Nogent", iguana: "Villa Iguana",
};

function MinNightsConfig() {
  // ── Init depuis localStorage ──────────────────────────────────
  function buildFull(raw) {
    const full = {};
    for (const id of Object.keys(MIN_NIGHTS_DEFAULTS_ADMIN)) {
      full[id] = raw[id] ?? { default: MIN_NIGHTS_DEFAULTS_ADMIN[id], periods: [] };
      if (!Array.isArray(full[id].periods)) full[id].periods = [];
    }
    return full;
  }

  const [config, setConfig] = useState(() => {
    try { return buildFull(JSON.parse(localStorage.getItem("amaryllis_min_nights_v2") || "{}")); }
    catch { return buildFull({}); }
  });

  // "idle" | "local" | "syncing" | "synced" | "error"
  const [syncStatus, setSyncStatus] = useState("idle");
  const isFirstRender = useRef(true);
  const localTimer    = useRef(null);
  const serverTimer   = useRef(null);

  // Flag dédié pour ignorer les saves déclenchés par le chargement serveur
  // (distinct de isFirstRender pour éviter le conflit de flags)
  const skipNextSave = useRef(false);

  // ── Charger depuis le serveur au montage (useEffect, pas useState!) ──
  useEffect(() => {
    fetch("/api/site-config")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.config && Object.keys(d.config).length) {
          const full = buildFull(d.config);
          skipNextSave.current = true;  // ce setConfig ne doit pas déclencher un re-save
          setConfig(full);
          localStorage.setItem("amaryllis_min_nights_v2", JSON.stringify(full));
          window.dispatchEvent(new Event("amaryllis_config_updated"));
          setSyncStatus("synced");
        }
      })
      .catch(() => {});
  }, []);

  // ── Auto-save : localStorage immédiat + serveur différé ────────
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (skipNextSave.current) { skipNextSave.current = false; return; }

    // 1. Enregistrement local immédiat (300 ms debounce anti-keystroke)
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      localStorage.setItem("amaryllis_min_nights_v2", JSON.stringify(config));
      window.dispatchEvent(new Event("amaryllis_config_updated")); // même onglet
      setSyncStatus("local");

      // 2. Synchronisation serveur 2,5 s après le dernier changement
      clearTimeout(serverTimer.current);
      serverTimer.current = setTimeout(async () => {
        setSyncStatus("syncing");
        try {
          const r = await fetch("/api/site-config", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ action: "setConfig", config }),
          });
          const d = await r.json();
          setSyncStatus(d.ok ? "synced" : "error");
        } catch { setSyncStatus("error"); }
      }, 2500);
    }, 300);

    return () => { clearTimeout(localTimer.current); clearTimeout(serverTimer.current); };
  }, [config]);

  // ── Mutations ─────────────────────────────────────────────────
  function upDefault(id, v) {
    setConfig(p => ({ ...p, [id]: { ...p[id], default: parseInt(v) || 0 } }));
  }
  function addPeriod(id) {
    const y = new Date().getFullYear();
    setConfig(p => ({
      ...p,
      [id]: { ...p[id], periods: [...p[id].periods, { id: `${Date.now()}`, label: "Nouvelle période", from: `${y}-07-01`, to: `${y}-08-31`, min: 7 }] },
    }));
  }
  function upPeriod(bienId, pid, field, v) {
    setConfig(p => ({
      ...p,
      [bienId]: { ...p[bienId], periods: p[bienId].periods.map(pr => pr.id === pid ? { ...pr, [field]: field === "min" ? (parseInt(v) || 1) : v } : pr) },
    }));
  }
  function rmPeriod(bienId, pid) {
    setConfig(p => ({ ...p, [bienId]: { ...p[bienId], periods: p[bienId].periods.filter(pr => pr.id !== pid) } }));
  }

  // ── Recommandations saisonnières ─────────────────────────────
  // Martinique : haute saison = jul-août + déc 15-jan 5 → 7 nuits
  //              intermédiaire = fév-juin + sept-nov → 4 nuits
  //              Nogent : pas de saisonnalité forte → défaut 1 nuit
  const RECO_PERIODS = {
    amaryllis: [
      { label: "Été (jul–août)",    from: `${new Date().getFullYear()}-07-01`, to: `${new Date().getFullYear()}-08-31`,  min: 7 },
      { label: "Fêtes (déc–jan)",   from: `${new Date().getFullYear()}-12-15`, to: `${new Date().getFullYear() + 1}-01-05`, min: 7 },
      { label: "Saison interm.",    from: `${new Date().getFullYear()}-02-01`, to: `${new Date().getFullYear()}-06-30`,  min: 4 },
    ],
    geko:     [
      { label: "Été (jul–août)",    from: `${new Date().getFullYear()}-07-01`, to: `${new Date().getFullYear()}-08-31`,  min: 7 },
      { label: "Fêtes (déc–jan)",   from: `${new Date().getFullYear()}-12-15`, to: `${new Date().getFullYear() + 1}-01-05`, min: 7 },
      { label: "Saison interm.",    from: `${new Date().getFullYear()}-02-01`, to: `${new Date().getFullYear()}-06-30`,  min: 3 },
    ],
    zandoli:  [
      { label: "Été (jul–août)",    from: `${new Date().getFullYear()}-07-01`, to: `${new Date().getFullYear()}-08-31`,  min: 5 },
      { label: "Fêtes (déc–jan)",   from: `${new Date().getFullYear()}-12-15`, to: `${new Date().getFullYear() + 1}-01-05`, min: 5 },
    ],
    schoelcher: [
      { label: "Été (jul–août)",    from: `${new Date().getFullYear()}-07-01`, to: `${new Date().getFullYear()}-08-31`,  min: 5 },
      { label: "Fêtes (déc–jan)",   from: `${new Date().getFullYear()}-12-15`, to: `${new Date().getFullYear() + 1}-01-05`, min: 5 },
    ],
    mabouya: [
      { label: "Été (jul–août)",    from: `${new Date().getFullYear()}-07-01`, to: `${new Date().getFullYear()}-08-31`,  min: 4 },
      { label: "Fêtes (déc–jan)",   from: `${new Date().getFullYear()}-12-15`, to: `${new Date().getFullYear() + 1}-01-05`, min: 4 },
    ],
    nogent:   [], // Urbain : 1 nuit minimum uniforme, pas de saisonnalité
    iguana:   [],
  };

  const [showReco, setShowReco] = useState(false);

  function applyReco(bienId) {
    const recos = RECO_PERIODS[bienId] || [];
    if (!recos.length) return;
    const newPeriods = recos.map(r => ({ ...r, id: `reco-${Date.now()}-${Math.random().toString(36).slice(2)}` }));
    setConfig(p => ({
      ...p,
      [bienId]: { ...p[bienId], periods: newPeriods },
    }));
  }

  function applyAllReco() {
    setConfig(p => {
      const next = { ...p };
      for (const [bienId, recos] of Object.entries(RECO_PERIODS)) {
        if (!recos.length) continue;
        const newPeriods = recos.map(r => ({ ...r, id: `reco-${Date.now()}-${Math.random().toString(36).slice(2)}` }));
        next[bienId] = { ...next[bienId], periods: newPeriods };
      }
      return next;
    });
  }

  // ── Indicateur de synchronisation ───────────────────────────
  const statusBadge = {
    idle:    null,
    local:   <span style={{ fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>💾 Sauvegardé localement · sync serveur…</span>,
    syncing: <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>⟳ Synchronisation…</span>,
    synced:  <span style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>✓ Synchronisé — visible sur tout le site</span>,
    error:   <span style={{ fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>⚠ Erreur serveur — actif localement seulement</span>,
  }[syncStatus];

  const inp = { padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: 12 };

  return (
    <div>
      {/* Header + statut */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          Les règles sont sauvegardées <strong style={{ color: "#94a3b8" }}>automatiquement</strong> à chaque modification
          et appliquées instantanément dans le widget de réservation.
        </div>
        {statusBadge && <div style={{ flexShrink: 0 }}>{statusBadge}</div>}
      </div>

      {/* ── Panneau recommandations saisonnières ── */}
      <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>💡 Recommandations saisonnières</div>
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.55 }}>
              Haute saison <strong style={{ color: "#e2e8f0" }}>juil–août + déc 15–jan 5</strong> → 7 nuits min sur les grandes villas · saison intermédiaire → 4 nuits · basse saison → défaut.
              <br />Évite les "trous orphelins" non louables entre deux réservations. À appliquer également dans Beds24 pour la synchronisation.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowReco(r => !r)}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.1)", color: "#fbbf24", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >{showReco ? "▲ Masquer" : "▼ Voir le détail"}</button>
            <button
              onClick={applyAllReco}
              style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.5)", background: "rgba(245,158,11,0.18)", color: "#f59e0b", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >⚡ Appliquer à tous</button>
          </div>
        </div>

        {showReco && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {Object.entries(RECO_PERIODS).map(([bienId, recos]) => (
              <div key={bienId} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{BIEN_NAMES_ADMIN[bienId]}</span>
                  {recos.length > 0 && (
                    <button onClick={() => applyReco(bienId)}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(245,158,11,0.4)", background: "none", color: "#fbbf24", cursor: "pointer", fontWeight: 600 }}>
                      Appliquer
                    </button>
                  )}
                </div>
                {recos.length === 0 ? (
                  <div style={{ fontSize: 10, color: "#475569", fontStyle: "italic" }}>Pas de saisonnalité — défaut 1 nuit</div>
                ) : (
                  recos.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", padding: "2px 0" }}>
                      <span>{r.label}</span>
                      <span style={{ fontWeight: 700, color: r.min >= 7 ? "#f59e0b" : r.min >= 4 ? "#38bdf8" : "#94a3b8" }}>{r.min} nuits</span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {Object.keys(MIN_NIGHTS_DEFAULTS_ADMIN).map(bienId => {
        const cfg     = config[bienId] || { default: MIN_NIGHTS_DEFAULTS_ADMIN[bienId], periods: [] };
        const periods = cfg.periods || [];
        return (
          <div key={bienId} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            {/* Header bien */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: periods.length ? 12 : 6, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 13 }}>{BIEN_NAMES_ADMIN[bienId]}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>Défaut :</span>
                <input type="number" min="0" max="30" value={cfg.default} onChange={e => upDefault(bienId, e.target.value)}
                  style={{ ...inp, width: 52, textAlign: "center", fontWeight: 700, fontSize: 14 }} />
                <span style={{ fontSize: 11, color: "#64748b" }}>nuits min.</span>
              </div>
            </div>

            {/* En-têtes colonnes */}
            {periods.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 126px 126px 64px 30px", gap: 6, marginBottom: 5, paddingLeft: 2 }}>
                {["Libellé période", "Début", "Fin", "Min", ""].map(h => (
                  <div key={h} style={{ fontSize: 9, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
                ))}
              </div>
            )}

            {/* Lignes périodes */}
            {periods.map(p => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 126px 126px 64px 30px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input value={p.label} onChange={e => upPeriod(bienId, p.id, "label", e.target.value)} style={inp} placeholder="ex : Été 2025" />
                <input type="date"    value={p.from}  onChange={e => upPeriod(bienId, p.id, "from",  e.target.value)} style={inp} />
                <input type="date"    value={p.to}    onChange={e => upPeriod(bienId, p.id, "to",    e.target.value)} style={inp} />
                <input type="number" min="1" max="30" value={p.min} onChange={e => upPeriod(bienId, p.id, "min", e.target.value)}
                  style={{ ...inp, textAlign: "center", fontWeight: 700 }} />
                <button onClick={() => rmPeriod(bienId, p.id)}
                  style={{ background: "rgba(239,68,68,0.13)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, color: "#ef4444", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "4px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ✕
                </button>
              </div>
            ))}

            <div style={{ display: "flex", gap: 6, marginTop: periods.length ? 4 : 0 }}>
              <button onClick={() => addPeriod(bienId)}
                style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.22)", borderRadius: 6, color: "#38bdf8", cursor: "pointer", fontSize: 11, padding: "5px 12px", fontWeight: 600 }}>
                + Ajouter une période
              </button>
              {(RECO_PERIODS[bienId]?.length > 0) && (
                <button onClick={() => applyReco(bienId)}
                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 6, color: "#f59e0b", cursor: "pointer", fontSize: 11, padding: "5px 12px", fontWeight: 600 }}>
                  ⚡ Reco. saison
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
function Pilotage({ biens, n, mob, reservations = [] }) {
  const [view, setView] = useState("canal-live");
  const PIE_COLORS = ["#0ea5e9", "#FF5A5F", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4"];

  // ===== CANAUX =====
  const canalTotaux = { airbnb: 0, booking: 0, direct: 0, parking: 0 };
  Object.values(REVENUS_CANAL_2025).forEach(b => {
    canalTotaux.airbnb += b.airbnb;
    canalTotaux.booking += b.booking;
    canalTotaux.direct += b.direct;
    canalTotaux.parking += b.parking || 0;
  });
  const totalCanal = canalTotaux.airbnb + canalTotaux.booking + canalTotaux.direct + canalTotaux.parking;

  // Commissions estimées
  const COMMISSIONS = { airbnb: 0.15, booking: 0.17, direct: 0, parking: 0 };
  const commissionParCanal = {
    airbnb: canalTotaux.airbnb * COMMISSIONS.airbnb,
    booking: canalTotaux.booking * COMMISSIONS.booking,
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

// ============================================================================
// CHARGES
// ============================================================================
function Charges({ biens, n, mob }) {
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

// ============================================================================
// COMPARATIF
// ============================================================================
function ComparatifContent({ biens, n, mob, hist = HIST_SEED, prevYear = new Date().getFullYear() - 1 }) {
  const cy = new Date().getFullYear();
  // Revenus annuels de l'année précédente : préfère hist (données réelles Sheets), fallback sur seed
  const prevRevMap = Object.fromEntries(
    biens.map(b => [b.id, hist[prevYear]?.[b.id]?.reduce((s, v) => s + v, 0) || b.rev2025 || 0])
  );

  const rows = biens.map(b => {
    const ytd = sumN(b.revenus, n);
    const pp = Math.round(prevRevMap[b.id] / 12 * n);
    return {
      nom: b.nom.replace("Villa ", "").replace("T2 ", ""),
      ytd, pp,
      delta: ((ytd - pp) / pp * 100).toFixed(1),
      occ25: b.occ2025.toFixed(1),
      occ26: avgN(b.occ, n).toFixed(1),
      adr25: b.adr2025,
      adr26: Math.round(avgN(b.adr, n)),
      rvp25: b.revpar2025,
      rvp26: Math.round(avgN(b.revpar, n)),
    };
  });

  const ytd26total = biens.reduce((s, b) => s + sumN(b.revenus, n), 0);
  const prorata25total = biens.reduce((s, b) => s + Math.round(prevRevMap[b.id] / 12 * n), 0);
  const globalDeltaPct = prorata25total > 0 ? ((ytd26total - prorata25total) / prorata25total * 100).toFixed(1) : "0";
  const isAhead = parseFloat(globalDeltaPct) >= 0;

  return (
    <div>
      {/* Bandeau synthèse global */}
      <div style={{ background: isAhead ? "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,182,212,0.06))" : "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(245,158,11,0.06))", border: `1px solid ${isAhead ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 14, padding: mob ? 14 : 18, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Performance globale Jan→{MOIS[n-1]} {cy} vs prorata {prevYear}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: mob ? 26 : 32, fontWeight: 800, color: isAhead ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)" }}>
                {isAhead ? "▲" : "▼"} {isAhead ? "+" : ""}{globalDeltaPct}%
              </span>
              <span style={{ fontSize: 14, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                {isAhead ? "+" : ""}{fmt(Math.round(ytd26total - prorata25total))}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
              {fmt(ytd26total)} réalisés · prorata {prevYear} : {fmt(prorata25total)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {biens.map(b => {
              const y = sumN(b.revenus, n);
              const p = Math.round(prevRevMap[b.id] / 12 * n);
              const d = p > 0 ? ((y - p) / p * 100).toFixed(0) : "—";
              const up = parseFloat(d) >= 0;
              return (
                <div key={b.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "7px 10px", textAlign: "center", minWidth: 60 }}>
                  <div style={{ fontSize: 14 }}>{b.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: up ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)" }}>{up ? "+" : ""}{d}%</div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>{fmtK(y)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>YTD {cy} vs prorata {prevYear}</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={rows} layout="vertical" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <YAxis type="category" dataKey="nom" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Bar dataKey="ytd" name={`${cy} YTD`} fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              <Bar dataKey="pp" name={`Prorata ${prevYear}`} fill="#334155" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>ADR {prevYear} vs {cy}</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={rows} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="nom" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} formatter={(v) => [v + " €"]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Bar dataKey="adr25" name={`ADR ${prevYear}`} fill="#334155" radius={[4, 4, 0, 0]} />
              <Bar dataKey="adr26" name={`ADR ${cy}`} fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden" }}>
        <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Tableau comparatif détaillé</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                {["Bien", `Rev ${prevYear}`, `YTD ${cy}`, "Δ", `Occ ${String(prevYear).slice(-2)}`, `Occ ${String(cy).slice(-2)}`, `ADR ${String(prevYear).slice(-2)}`, `ADR ${String(cy).slice(-2)}`, `RPar ${String(prevYear).slice(-2)}`, `RPar ${String(cy).slice(-2)}`].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "9px 10px", fontWeight: 600, color: "#e2e8f0", fontSize: 11 }}>{r.nom}</td>
                  <td style={{ padding: "9px 10px", color: "#64748b", fontFamily: "var(--font-mono)", fontSize: 10 }}>{fmt(prevRevMap[biens[i].id])}</td>
                  <td style={{ padding: "9px 10px", color: "#0ea5e9", fontFamily: "var(--font-mono)", fontSize: 10 }}>{fmt(r.ytd)}</td>
                  <td style={{ padding: "9px 10px", color: parseFloat(r.delta) >= 0 ? "#10b981" : "#ef4444", fontSize: 10, fontWeight: 600 }}>
                    {parseFloat(r.delta) >= 0 ? "+" : ""}{r.delta}%
                  </td>
                  <td style={{ padding: "9px 10px", color: "#64748b", fontSize: 10 }}>{r.occ25}%</td>
                  <td style={{ padding: "9px 10px", color: parseFloat(r.occ26) > parseFloat(r.occ25) ? "#10b981" : "#f59e0b", fontSize: 10 }}>{r.occ26}%</td>
                  <td style={{ padding: "9px 10px", color: "#64748b", fontSize: 10 }}>{r.adr25}€</td>
                  <td style={{ padding: "9px 10px", color: r.adr26 > r.adr25 ? "#10b981" : "#f59e0b", fontSize: 10 }}>{r.adr26}€</td>
                  <td style={{ padding: "9px 10px", color: "#64748b", fontSize: 10 }}>{r.rvp25}€</td>
                  <td style={{ padding: "9px 10px", color: r.rvp26 > r.rvp25 ? "#10b981" : "#f59e0b", fontSize: 10 }}>{r.rvp26}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Comparatif({ biens, n, mob }) {
  return <ComparatifContent biens={biens} n={n} mob={mob} />;
}

// ============================================================================
// REVENUE MANAGER — inspiré PriceLabs
// ============================================================================
function RevenueManager({ biens, reservations, hist, mob }) {
  const [view, setView]         = useState("opportunites");
  const [selBien, setSelBien]   = useState("all");
  const dailyPrices             = useMemo(() => { try { return loadDailyPrices(); } catch { return {}; } }, []);

  const today    = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr = today.toISOString().slice(0,10);
  const shortBiens = biens.filter(b => b.type !== "long");
  const visBiens   = selBien === "all" ? shortBiens : shortBiens.filter(b => b.id === selBien);

  // ── Helpers ──────────────────────────────────────────────────────────
  const dateStr  = d => d.toISOString().slice(0,10);
  const addDays  = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const daysDiff = (a, b) => Math.round((b - a) / 86400000);

  // Booked set par bien : Set de dates "YYYY-MM-DD"
  const bookedSets = useMemo(() => {
    const map = {};
    biens.forEach(b => { map[b.id] = new Set(); });
    reservations.forEach(r => {
      if (!r.checkin || !r.checkout || !map[r.bienId]) return;
      const ci = new Date(r.checkin + "T12:00:00Z");
      const co = new Date(r.checkout + "T12:00:00Z");
      for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
        map[r.bienId].add(d.toISOString().slice(0,10));
      }
    });
    return map;
  }, [biens, reservations]);

  // Réservations triées par bien
  const resasByBien = useMemo(() => {
    const map = {};
    biens.forEach(b => { map[b.id] = []; });
    reservations.forEach(r => { if (map[r.bienId]) map[r.bienId].push(r); });
    Object.values(map).forEach(arr => arr.sort((a,z) => a.checkin.localeCompare(z.checkin)));
    return map;
  }, [biens, reservations]);

  // ══════════════════════════════════════════════════════════════════════
  //  VUE 1 — OPPORTUNITÉS  (cœur PriceLabs)
  // ══════════════════════════════════════════════════════════════════════
  const opportunites = useMemo(() => {
    const ops = [];
    visBiens.forEach(b => {
      const booked = bookedSets[b.id] || new Set();
      const resas  = resasByBien[b.id] || [];
      const prices = dailyPrices[b.id] || {};
      const minN   = MIN_NIGHTS_DEFAULTS_ADMIN[b.id] || 3;

      // 1. TROUS ORPHELINS — gaps < min nights entre 2 réservations
      for (let i = 0; i < resas.length - 1; i++) {
        const r1 = resas[i], r2 = resas[i+1];
        if (r1.bienId !== b.id || r2.bienId !== b.id) continue;
        const co = new Date(r1.checkout + "T12:00:00Z");
        const ci = new Date(r2.checkin  + "T12:00:00Z");
        const gap = daysDiff(co, ci);
        if (gap > 0 && gap < minN && co >= today) {
          ops.push({
            bienId: b.id, bienNom: b.nom, bienEmoji: b.emoji || "🏡",
            type: "gap", priority: "high",
            icon: "🔵", color: "#3b82f6",
            label: `Trou isolé : ${gap} nuit${gap>1?"s":""} invendable${gap>1?"s":""}`,
            detail: `${r1.checkout} → ${r2.checkin} (min nights = ${minN})`,
            action: `Réduire min-nuits à ${gap} sur cette fenêtre ou casser le prix à ${Math.round((prices[r1.checkout] || b.prix || 100) * 0.7)}€/nuit`,
            daysAway: daysDiff(today, co),
          });
        }
      }

      // 2. NUITS LAST-MINUTE vides (J-0 à J-14)
      let lmBlock = null;
      for (let i = 0; i <= 14; i++) {
        const ds = dateStr(addDays(today, i));
        if (!booked.has(ds)) {
          if (!lmBlock) lmBlock = { start: ds, count: 0, daysAway: i };
          lmBlock.count++;
          lmBlock.end = ds;
        } else if (lmBlock) {
          const disc = lmBlock.daysAway <= 3 ? 25 : lmBlock.daysAway <= 7 ? 15 : 10;
          const basePrice = prices[lmBlock.start] || b.prix || 100;
          ops.push({
            bienId: b.id, bienNom: b.nom, bienEmoji: b.emoji || "🏡",
            type: "lastminute", priority: lmBlock.daysAway <= 3 ? "urgent" : "high",
            icon: "🔴", color: "#ef4444",
            label: `${lmBlock.count} nuit${lmBlock.count>1?"s":""} vide${lmBlock.count>1?"s":""} — J+${lmBlock.daysAway} à J+${lmBlock.daysAway + lmBlock.count - 1}`,
            detail: `Du ${lmBlock.start} au ${lmBlock.end}`,
            action: `Last-minute : appliquer −${disc}% → ${Math.round(basePrice * (1 - disc/100))}€/nuit`,
            daysAway: lmBlock.daysAway,
          });
          lmBlock = null;
        }
      }
      if (lmBlock) {
        const disc = lmBlock.daysAway <= 3 ? 25 : 15;
        const basePrice = prices[lmBlock.start] || b.prix || 100;
        ops.push({
          bienId: b.id, bienNom: b.nom, bienEmoji: b.emoji || "🏡",
          type: "lastminute", priority: lmBlock.daysAway <= 3 ? "urgent" : "high",
          icon: "🔴", color: "#ef4444",
          label: `${lmBlock.count} nuit${lmBlock.count>1?"s":""} vide${lmBlock.count>1?"s":""} — J+${lmBlock.daysAway} à J+${lmBlock.daysAway + lmBlock.count - 1}`,
          detail: `Du ${lmBlock.start} au ${lmBlock.end}`,
          action: `Last-minute : appliquer −${disc}% → ${Math.round(basePrice * (1 - disc/100))}€/nuit`,
          daysAway: lmBlock.daysAway,
        });
      }

      // 3. FORTE DEMANDE — occ > 85% dans les 30 prochains jours
      let booked30 = 0;
      for (let i = 0; i < 30; i++) { if (booked.has(dateStr(addDays(today, i)))) booked30++; }
      const occ30 = Math.round(booked30 / 30 * 100);
      if (occ30 >= 85) {
        const nextFreeStr = (() => {
          for (let i = 0; i < 60; i++) { const ds = dateStr(addDays(today, i)); if (!booked.has(ds)) return ds; }
          return null;
        })();
        if (nextFreeStr) {
          const basePrice = prices[nextFreeStr] || b.prix || 100;
          ops.push({
            bienId: b.id, bienNom: b.nom, bienEmoji: b.emoji || "🏡",
            type: "demand", priority: "opportunity",
            icon: "🟢", color: "#10b981",
            label: `Forte demande — ${occ30}% d'occupation sur 30 jours`,
            detail: `Prochaine nuit libre : ${nextFreeStr}`,
            action: `Augmenter le tarif de +15-20% → ${Math.round(basePrice * 1.17)}€/nuit`,
            daysAway: 0,
          });
        }
      }

      // 4. WEEKEND PREMIUM — check if weekends are priced higher than weekdays
      let wePrices = [], wdPrices = [];
      for (let i = 7; i <= 60; i++) {
        const d = addDays(today, i);
        const ds = dateStr(d);
        if (booked.has(ds)) continue;
        const p = prices[ds] || b.prix || 0;
        if (p <= 0) continue;
        const dow = d.getDay(); // 0=Sun, 6=Sat
        if (dow === 5 || dow === 6 || dow === 0) wePrices.push(p);
        else wdPrices.push(p);
      }
      if (wePrices.length > 3 && wdPrices.length > 3) {
        const avgWe = Math.round(wePrices.reduce((s,v)=>s+v,0) / wePrices.length);
        const avgWd = Math.round(wdPrices.reduce((s,v)=>s+v,0) / wdPrices.length);
        const premiumPct = Math.round((avgWe - avgWd) / avgWd * 100);
        if (premiumPct < 5) {
          ops.push({
            bienId: b.id, bienNom: b.nom, bienEmoji: b.emoji || "🏡",
            type: "weekend", priority: "medium",
            icon: "🟡", color: "#f59e0b",
            label: `Weekend premium faible : +${premiumPct}% (recommandé +15-20%)`,
            detail: `Ven/Sam/Dim moy. ${avgWe}€ vs semaine ${avgWd}€`,
            action: `Appliquer +${Math.max(15, premiumPct + 10)}% les vendredi-samedi → ${Math.round(avgWd * 1.15)}€`,
            daysAway: -1,
          });
        }
      }
    });

    // Trier : urgent → high → opportunity → medium
    const ORDER = { urgent: 0, high: 1, opportunity: 2, medium: 3 };
    return ops.sort((a, z) => (ORDER[a.priority] ?? 9) - (ORDER[z.priority] ?? 9));
  }, [visBiens, bookedSets, resasByBien, dailyPrices, today]);

  // ══════════════════════════════════════════════════════════════════════
  //  VUE 2 — PACING  (comparaison vs année précédente)
  // ══════════════════════════════════════════════════════════════════════
  const pacingData = useMemo(() => {
    const curMonth  = today.getMonth(); // 0-based
    const curYear   = today.getFullYear();

    return shortBiens.map(b => {
      // Occupation actuelle (mois en cours depuis J1 à aujourd'hui)
      const booked = bookedSets[b.id] || new Set();
      const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
      let bookedThisMonth = 0;
      for (let d = 1; d <= today.getDate(); d++) {
        const ds = `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        if (booked.has(ds)) bookedThisMonth++;
      }
      const occActuel = Math.round(bookedThisMonth / today.getDate() * 100);

      // Occupation historique même mois — via b.occ (données 2025 courantes)
      const histMonthOcc = b.occ?.[curMonth] ?? null; // 0-100, peut être 0

      // CA actuel vs historique — hist[lastYear][bienId][curMonth]
      const caActuel = reservations
        .filter(r => r.bienId === b.id && r.checkin?.startsWith(`${curYear}-${String(curMonth+1).padStart(2,'0')}`))
        .reduce((s, r) => s + (r.montant || 0), 0);
      const lastYear = curYear - 1;
      const caHist = hist?.[lastYear]?.[b.id]?.[curMonth] ?? null;

      const diff = histMonthOcc !== null ? occActuel - histMonthOcc : null;
      const trend = diff === null ? "—" : diff > 5 ? "↑ En avance" : diff < -5 ? "↓ En retard" : "→ Dans la norme";
      const trendColor = diff === null ? "#64748b" : diff > 5 ? "#10b981" : diff < -5 ? "#ef4444" : "#f59e0b";

      return { b, occActuel, histMonthOcc, caActuel, caHist, diff, trend, trendColor, daysInMonth };
    });
  }, [shortBiens, bookedSets, reservations, hist, today]);

  // ══════════════════════════════════════════════════════════════════════
  //  VUE 3 — TENDANCES  (analyse des réservations)
  // ══════════════════════════════════════════════════════════════════════
  const tendances = useMemo(() => {
    const validResas = reservations.filter(r => r.checkin && r.checkout && r.montant > 0);

    // Durées de séjour
    const durees = validResas.map(r => {
      const ci = new Date(r.checkin + "T12:00:00Z"), co = new Date(r.checkout + "T12:00:00Z");
      return Math.max(1, Math.round((co - ci) / 86400000));
    });
    const avgDuree = durees.length ? Math.round(durees.reduce((s,v)=>s+v,0) / durees.length * 10) / 10 : 0;
    const durDist = [
      { label: "1 nuit",    count: durees.filter(d => d === 1).length },
      { label: "2-3 nuits", count: durees.filter(d => d >= 2 && d <= 3).length },
      { label: "4-6 nuits", count: durees.filter(d => d >= 4 && d <= 6).length },
      { label: "7-13 nuits",count: durees.filter(d => d >= 7 && d <= 13).length },
      { label: "14+ nuits", count: durees.filter(d => d >= 14).length },
    ].filter(d => d.count > 0);

    // ADR par jour de la semaine
    const DOW = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
    const dowStats = Array.from({length:7}, () => ({ rev: 0, nights: 0 }));
    validResas.forEach(r => {
      const ci = new Date(r.checkin + "T12:00:00Z"), co = new Date(r.checkout + "T12:00:00Z");
      const nights = Math.max(1, Math.round((co - ci) / 86400000));
      const adr = r.montant / nights;
      for (let d = new Date(ci); d < co; d.setDate(d.getDate()+1)) {
        dowStats[d.getDay()].rev += adr;
        dowStats[d.getDay()].nights++;
      }
    });
    const dowData = DOW.map((l, i) => ({
      label: l, adr: dowStats[i].nights > 0 ? Math.round(dowStats[i].rev / dowStats[i].nights) : 0, nights: dowStats[i].nights,
    }));
    const maxAdr = Math.max(...dowData.map(d => d.adr), 1);

    // Mois les plus performants
    const moisStats = Array.from({length:12}, () => ({ rev: 0, resas: 0 }));
    validResas.forEach(r => {
      const m = parseInt(r.checkin?.slice(5,7)) - 1;
      if (m >= 0 && m < 12) { moisStats[m].rev += r.montant; moisStats[m].resas++; }
    });
    const moisData = MOIS.map((l, i) => ({ label: l, rev: moisStats[i].rev, resas: moisStats[i].resas }))
      .filter(m => m.resas > 0);
    const maxRev = Math.max(...moisData.map(m => m.rev), 1);

    // Canal mix
    const canalMix = {};
    validResas.forEach(r => {
      const c = (r.canal || "autre").toLowerCase().includes("airbnb") ? "Airbnb"
              : (r.canal || "").toLowerCase().includes("booking") ? "Booking"
              : "Autre";
      if (!canalMix[c]) canalMix[c] = { count: 0, rev: 0 };
      canalMix[c].count++;
      canalMix[c].rev += r.montant;
    });

    return { avgDuree, durDist, dowData, maxAdr, moisData, maxRev, canalMix, totalResas: validResas.length };
  }, [reservations]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { id: "opportunites", l: "💡 Opportunités" },
          { id: "pacing",       l: "📈 Pacing" },
          { id: "tendances",    l: "🔬 Tendances" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{ padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: view === v.id ? "#0ea5e9" : "rgba(255,255,255,0.06)", color: view === v.id ? "#fff" : "#94a3b8" }}>
            {v.l}
          </button>
        ))}
        {/* Filtre bien */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[{ id:"all", l:"Tout" }, ...shortBiens.map(b => ({ id: b.id, l: (b.emoji||"") + " " + b.nom.replace("Villa ","") }))].map(o => (
            <button key={o.id} onClick={() => setSelBien(o.id)} style={{ padding: "4px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontSize: 10, background: selBien === o.id ? "rgba(14,165,233,0.2)" : "transparent", color: selBien === o.id ? "#0ea5e9" : "#64748b" }}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── OPPORTUNITÉS ── */}
      {view === "opportunites" && (
        <div>
          {opportunites.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#475569" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              Aucune opportunité détectée — pricing optimal !
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
                {opportunites.length} opportunité{opportunites.length>1?"s":""} détectée{opportunites.length>1?"s":""} — triées par priorité
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {opportunites.map((op, i) => (
                  <div key={i} style={{ background: `${op.color}0d`, border: `1px solid ${op.color}33`, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{op.bienEmoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{op.bienNom.replace("Villa ","")}</span>
                        <span style={{ fontSize: 9, background: `${op.color}22`, color: op.color, borderRadius: 4, padding: "2px 7px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                          {op.priority === "urgent" ? "🚨 Urgent" : op.priority === "high" ? "⚡ Prioritaire" : op.priority === "opportunity" ? "💰 Opportunité" : "ℹ️ Info"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 4 }}>{op.label}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{op.detail}</div>
                      <div style={{ fontSize: 11, color: op.color, fontWeight: 600, background: `${op.color}12`, borderRadius: 6, padding: "6px 10px", display: "inline-block" }}>
                        → {op.action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PACING ── */}
      {view === "pacing" && (
        <div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
            Comparaison occupation actuelle vs même mois année précédente (HIST)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {pacingData.filter(p => selBien === "all" || p.b.id === selBien).map(({ b, occActuel, histMonthOcc, caActuel, caHist, trend, trendColor, daysInMonth }) => (
              <div key={b.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{b.emoji || "🏡"}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{b.nom.replace("Villa ","")}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: trendColor }}>{trend}</span>
                </div>
                {/* Occupation */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 4 }}>
                    <span>Occ. ce mois (à ce jour)</span>
                    <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{occActuel}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${occActuel}%`, background: "#0ea5e9", borderRadius: 2 }} />
                  </div>
                  {histMonthOcc !== null && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginTop: 6, marginBottom: 4 }}>
                        <span>Historique même mois</span>
                        <span>{histMonthOcc}%</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                        <div style={{ height: 4, width: `${histMonthOcc}%`, background: "rgba(255,255,255,0.2)", borderRadius: 2, backgroundImage: "repeating-linear-gradient(90deg,rgba(255,255,255,0.3) 0px,rgba(255,255,255,0.3) 4px,transparent 4px,transparent 8px)" }} />
                      </div>
                    </>
                  )}
                </div>
                {/* CA */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>CA ce mois</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0ea5e9", fontFamily: "var(--font-mono)" }}>{fmtK(caActuel)}</div>
                  </div>
                  {caHist !== null && (
                    <div>
                      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Historique</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#475569", fontFamily: "var(--font-mono)" }}>{fmtK(caHist)}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TENDANCES ── */}
      {view === "tendances" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* KPIs globaux */}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "Réservations", value: tendances.totalResas, color: "#0ea5e9" },
              { label: "Durée moy.",   value: `${tendances.avgDuree} nuits`, color: "#f59e0b" },
              { label: "Meilleur jour", value: tendances.dowData.reduce((a,b) => b.adr > a.adr ? b : a, {label:"—",adr:0}).label, color: "#10b981" },
              { label: "Meilleur mois", value: tendances.moisData.reduce((a,b) => b.rev > a.rev ? b : a, {label:"—",rev:0}).label, color: "#a855f7" },
            ].map(k => (
              <div key={k.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
            {/* Durée de séjour */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>Durée de séjour</div>
              {tendances.durDist.map(d => {
                const pct = Math.round(d.count / tendances.totalResas * 100);
                return (
                  <div key={d.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>
                      <span>{d.label}</span>
                      <span style={{ color: "#e2e8f0" }}>{d.count} · {pct}%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ height: 4, width: `${pct}%`, background: "#0ea5e9", borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ADR par jour de semaine */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>ADR moyen par jour de semaine</div>
              {tendances.dowData.filter(d => d.adr > 0).map(d => (
                <div key={d.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>
                    <span>{d.label}</span>
                    <span style={{ color: "#e2e8f0", fontFamily: "var(--font-mono)" }}>{d.adr}€</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${Math.round(d.adr / tendances.maxAdr * 100)}%`, background: d.label === "Ven" || d.label === "Sam" ? "#f59e0b" : "#3b82f6", borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Revenus par mois */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>Revenus par mois (réservations actuelles)</div>
              {tendances.moisData.map(m => (
                <div key={m.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>
                    <span>{m.label}</span>
                    <span style={{ color: "#e2e8f0", fontFamily: "var(--font-mono)" }}>{fmtK(m.rev)} · {m.resas} résa</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${Math.round(m.rev / tendances.maxRev * 100)}%`, background: "#a855f7", borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Canal mix */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>Mix canal (réservations)</div>
              {Object.entries(tendances.canalMix).map(([canal, s]) => {
                const pct = Math.round(s.count / tendances.totalResas * 100);
                const color = canal === "Airbnb" ? "#FF5A5F" : canal === "Booking" ? "#0ea5e9" : "#10b981";
                return (
                  <div key={canal} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>
                      <span>{canal}</span>
                      <span style={{ color: "#e2e8f0" }}>{s.count} résa · {fmtK(s.rev)} · {pct}%</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ height: 5, width: `${pct}%`, background: color, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// YIELD ALERTS — alertes de remplissage pour le Cockpit
// ============================================================================
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

// ============================================================================
// NOGENT — ALERTE CASHFLOW & ANALYSE CONCIERGERIE
// ============================================================================
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

      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { l: "CF YTD",          v: `${cfYTD >= 0 ? "+" : ""}${cfYTD.toLocaleString("fr-FR")} €`,               c: cfYTD >= 0 ? "#10b981" : "#ef4444" },
          { l: "Revenus YTD",     v: `${revYTD.toLocaleString("fr-FR")} €`,                                        c: "#0ea5e9" },
          { l: "Charges YTD",     v: `−${chargesYTD.toLocaleString("fr-FR")} €`,                                   c: "#f59e0b" },
          { l: "Conciergerie est.",v: `−${conciergerieYTD.toLocaleString("fr-FR")} €`,                              c: "#f87171" },
        ].map(k => (
          <div key={k.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{k.l}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: k.c, fontFamily: "var(--font-mono)" }}>{k.v}</div>
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

// ============================================================================
// AMARYLLIS — ALERTE BASSE SAISON & TEMPLATE EMAIL LAST-MINUTE
// ============================================================================
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

// ============================================================================
// CANAL LIVE PERFORMANCE — depuis les réservations iCal/Beds24 réelles
// ============================================================================
function CanalLivePerf({ biens, reservations, mob }) {
  const CANAL_CONF = {
    airbnb:       { label: "Airbnb",       color: "#FF5A5F", comm: 0.03  },
    booking:      { label: "Booking.com",  color: "#0ea5e9", comm: 0.15  },
    direct:       { label: "Direct",       color: "#10b981", comm: 0     },
    beds24:       { label: "Beds24",       color: "#a855f7", comm: 0     },
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
    if (!stats[canal]) stats[canal] = { count: 0, brut: 0, nights: 0 };
    const ci = new Date(r.checkin + "T12:00:00Z"), co = new Date(r.checkout + "T12:00:00Z");
    const nights = Math.max(1, Math.round((co - ci) / 86400000));
    stats[canal].count++;
    stats[canal].brut += r.montant;
    stats[canal].nights += nights;
  });

  const rows = Object.entries(stats)
    .map(([canal, s]) => {
      const conf = CANAL_CONF[canal] || { label: canal, color: "#64748b", comm: 0 };
      const commission = Math.round(s.brut * conf.comm);
      const net = s.brut - commission;
      const adr = s.nights > 0 ? Math.round(s.brut / s.nights) : 0;
      return { canal, ...conf, ...s, commission, net, adr };
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

// ============================================================================
// MÉNAGE TAB — planning de ménage dédié
// ============================================================================
function MenageCard({ m, saveRes }) {
  const [assigne, setAssigne] = useState(m.resa.assigne || "");
  const windowColor = m.windowHours === null ? "#64748b" : m.windowHours < 4 ? "#ef4444" : m.windowHours < 8 ? "#f59e0b" : "#10b981";
  const fmt = d => d ? d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) : "—";
  const save = (field, val) => saveRes(m.resa.id, field, val);

  return (
    <div style={{ background: m.resa.menage_done ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${m.resa.menage_done ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "14px 16px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
      {/* Done toggle */}
      <button onClick={() => save("menage_done", !m.resa.menage_done)} style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${m.resa.menage_done ? "#10b981" : "#334155"}`, background: m.resa.menage_done ? "#10b981" : "transparent", color: "#fff", fontSize: 15, cursor: "pointer", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {m.resa.menage_done ? "✓" : ""}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{m.bienEmoji} {m.bienNom}</span>
          {m.resa.canal && <span style={{ fontSize: 9, background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "2px 6px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>{m.resa.canal}</span>}
          {m.resa.menage_done && <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700 }}>✓ FAIT</span>}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
          <span>🚪 Sortie : <b style={{ color: "#e2e8f0" }}>{m.resa.voyageur || "—"}</b></span>
          {m.nextResa
            ? <span>🔑 Arrivée : <b style={{ color: "#e2e8f0" }}>{m.nextResa.voyageur || "—"}</b> · <b style={{ color: "#f59e0b" }}>{fmt(m.nextCheckin)}</b></span>
            : <span style={{ color: "#334155" }}>Pas d'arrivée suivante planifiée</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {m.windowHours !== null && (
            <span style={{ fontSize: 11, color: windowColor, fontWeight: 600, background: `${windowColor}18`, borderRadius: 6, padding: "3px 8px" }}>
              ⏱ {m.windowHours}h de fenêtre
            </span>
          )}
          <input
            type="text"
            placeholder="Prestataire / assigné…"
            value={assigne}
            onChange={e => { setAssigne(e.target.value); save("assigne", e.target.value); }}
            style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "5px 10px", color: "#e2e8f0", width: 200 }}
          />
        </div>
      </div>
    </div>
  );
}

function MenageTab({ biens, reservations, saveRes, mob }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const in21  = new Date(today.getTime() + 21 * 86400000);
  const todayStr = today.toISOString().slice(0,10);
  const tomorStr = new Date(today.getTime() + 86400000).toISOString().slice(0,10);

  // Collecte toutes les sorties dans les 21 prochains jours
  const menages = [];
  biens.forEach(b => {
    const bienResas = reservations
      .filter(r => r.bienId === b.id && r.checkout)
      .sort((a, z) => a.checkout.localeCompare(z.checkout));

    bienResas.forEach((r, i) => {
      const coDate = new Date(r.checkout + "T12:00:00"); coDate.setHours(0,0,0,0);
      if (coDate < today || coDate > in21) return;
      const nextResa = bienResas.find((r2, j) => j > i && r2.checkin >= r.checkout);
      const nextCi = nextResa ? (() => { const d = new Date(nextResa.checkin + "T12:00:00"); d.setHours(0,0,0,0); return d; })() : null;
      const windowHours = nextCi ? Math.round((nextCi - coDate) / 3600000) : null;
      menages.push({ bienId: b.id, bienNom: b.nom, bienEmoji: b.emoji || "🏡", resa: r, checkout: coDate, nextResa, nextCheckin: nextCi, windowHours });
    });
  });
  menages.sort((a, z) => a.checkout - z.checkout);

  // Grouper par jour
  const byDay = {};
  menages.forEach(m => {
    const dk = m.checkout.toISOString().slice(0,10);
    if (!byDay[dk]) byDay[dk] = [];
    byDay[dk].push(m);
  });

  const fmt = d => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const done = menages.filter(m => m.resa.menage_done).length;

  // saveRes pour MenageCard : met à jour un champ d'une résa
  const saveMenageField = (id, field, val) => {
    saveRes(reservations.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total 21 jours",   value: menages.length, color: "#a855f7" },
          { label: "Faits",            value: done,           color: "#10b981" },
          { label: "À faire",          value: menages.length - done, color: menages.length - done > 0 ? "#ef4444" : "#475569" },
          { label: "Aujourd'hui",      value: (byDay[todayStr] || []).length, color: "#f59e0b" },
        ].map(k => (
          <div key={k.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: "var(--font-mono)" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {menages.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          Aucun ménage prévu dans les 21 prochains jours
        </div>
      ) : (
        Object.entries(byDay).map(([dk, list]) => {
          const isToday = dk === todayStr, isTomorrow = dk === tomorStr;
          const dateLabel = isToday ? "Aujourd'hui" : isTomorrow ? "Demain" : fmt(new Date(dk + "T12:00:00"));
          return (
            <div key={dk} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#ef4444" : "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                {isToday && <span style={{ background: "#ef4444", borderRadius: 4, padding: "1px 6px", color: "#fff", fontSize: 9 }}>URGENT</span>}
                {dateLabel}
              </div>
              {list.map(m => <MenageCard key={m.resa.id} m={m} saveRes={saveMenageField} />)}
            </div>
          );
        })
      )}
    </div>
  );
}

// ============================================================================
// MESSAGES — templates de communication voyageur
// ============================================================================
function MessageTemplates({ biens, reservations, mob }) {
  const [tplKey, setTplKey]   = useState("welcome");
  const [resaId, setResaId]   = useState(null);
  const [copied, setCopied]   = useState(false);

  const TPLS = {
    welcome: {
      label: "🏡 Bienvenue",
      fn: (r, b) =>
`Bonjour ${r?.voyageur?.split(" ")[0] || ""},

Nous sommes ravis de vous accueillir à ${b?.nom || "notre logement"} du ${r?.checkin || "[dates]"} au ${r?.checkout || "[dates]"}.

Informations pratiques :
• Check-in à partir de 17h
• Code d'accès : [CODE]
• WiFi : [SSID] / Mot de passe : [MDP]
• Guide d'accueil : https://villamaryllis.com

N'hésitez pas à nous contacter si vous avez des questions !

Bonne route et à très bientôt,
Vincent`,
    },
    checkin: {
      label: "🔑 Rappel arrivée",
      fn: (r, b) =>
`Bonjour ${r?.voyageur?.split(" ")[0] || ""},

Votre arrivée à ${b?.nom || ""} est prévue demain.

• Check-in à partir de 17h
• Code d'accès : [CODE]
• Parking : [INFO PARKING]

Si votre heure d'arrivée change, merci de nous prévenir.

À demain !
Vincent`,
    },
    checkout: {
      label: "🚪 Rappel départ",
      fn: (r, b) =>
`Bonjour ${r?.voyageur?.split(" ")[0] || ""},

J'espère que vous passez un excellent séjour à ${b?.nom || ""} !

Petit rappel : le check-out est demain avant 12h.

• Laisser les clés sur la table d'entrée
• Fermer les volets et la porte à clé
• Vider réfrigérateur et poubelles

Merci et à bientôt !
Vincent`,
    },
    review: {
      label: "⭐ Demande d'avis",
      fn: (r, b) =>
`Bonjour ${r?.voyageur?.split(" ")[0] || ""},

Merci beaucoup pour votre séjour à ${b?.nom || ""}. C'était un vrai plaisir de vous accueillir !

Si vous avez apprécié votre séjour, un avis Airbnb nous aide énormément à faire connaître nos logements.

J'espère vous revoir bientôt !
Vincent`,
    },
    devis: {
      label: "💶 Devis direct",
      fn: (r, b) =>
`Bonjour,

Merci pour votre intérêt pour ${b?.nom || "nos logements"}.

Pour une réservation directe (sans frais Airbnb) :
• Prix : [X]€/nuit
• Ménage : [X]€
• Caution : [X]€ (remboursée sous 48h)

Réservez directement : https://villamaryllis.com/${b?.id || ""}

À votre disposition,
Vincent`,
    },
    incident: {
      label: "⚠️ Signalement incident",
      fn: (r, b) =>
`Bonjour ${r?.voyageur?.split(" ")[0] || ""},

J'ai bien pris note de votre signalement concernant ${b?.nom || "le logement"}.

Je prends cela très au sérieux et vais intervenir dès que possible.

Pouvez-vous me préciser :
1. La nature exacte du problème
2. Si vous avez des photos
3. Si cela affecte votre confort immédiatement

Je reviens vers vous dans les plus brefs délais.
Vincent`,
    },
  };

  const upcoming = reservations
    .filter(r => r.checkin >= new Date().toISOString().slice(0,10))
    .sort((a, b) => a.checkin.localeCompare(b.checkin))
    .slice(0, 15);

  const r  = resaId ? reservations.find(x => x.id === resaId) : null;
  const b  = r ? biens.find(x => x.id === r.bienId) : null;
  const tpl = TPLS[tplKey];
  const msg = tpl ? tpl.fn(r, b) : "";

  const copy = () => {
    navigator.clipboard.writeText(msg).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
        Messages types prêts à envoyer — sélectionnez un template, choisissez une réservation (optionnel), copiez.
      </div>

      {/* Template selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(TPLS).map(([k, t]) => (
          <button key={k} onClick={() => setTplKey(k)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", borderColor: tplKey === k ? "#0ea5e9" : "rgba(255,255,255,0.1)", background: tplKey === k ? "rgba(14,165,233,0.15)" : "transparent", color: tplKey === k ? "#0ea5e9" : "#64748b", fontSize: 11, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Réservation selector */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>Pré-remplir avec une réservation :</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setResaId(null)} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: !resaId ? "rgba(255,255,255,0.08)" : "transparent", color: "#94a3b8", cursor: "pointer" }}>
              Générique
            </button>
            {upcoming.slice(0, 10).map(res => {
              const bb = biens.find(x => x.id === res.bienId);
              return (
                <button key={res.id} onClick={() => setResaId(res.id)} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: resaId === res.id ? "rgba(14,165,233,0.15)" : "transparent", color: resaId === res.id ? "#0ea5e9" : "#94a3b8", cursor: "pointer" }}>
                  {bb?.emoji} {res.voyageur?.split(" ")[0] || "?"} · {res.checkin}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Message textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          readOnly value={msg}
          style={{ width: "100%", minHeight: 240, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 70px 14px 14px", color: "#e2e8f0", fontSize: 12, lineHeight: 1.75, fontFamily: "system-ui,sans-serif", resize: "vertical", boxSizing: "border-box" }}
        />
        <button onClick={copy} style={{ position: "absolute", top: 10, right: 10, padding: "5px 12px", borderRadius: 8, border: "none", background: copied ? "rgba(16,185,129,0.25)" : "rgba(14,165,233,0.2)", color: copied ? "#10b981" : "#0ea5e9", fontSize: 10, cursor: "pointer", fontWeight: 700 }}>
          {copied ? "✓ Copié" : "Copier"}
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {r?.phone && (
          <a href={`https://wa.me/${r.phone.replace(/[^0-9+]/g,"")}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, padding: "7px 16px", borderRadius: 8, background: "rgba(37,211,102,0.15)", color: "#25D366", textDecoration: "none", fontWeight: 600 }}>
            📱 WhatsApp
          </a>
        )}
        <a href={`mailto:?subject=Votre séjour à ${b?.nom || "Amaryllis"}&body=${encodeURIComponent(msg)}`}
          style={{ fontSize: 11, padding: "7px 16px", borderRadius: 8, background: "rgba(14,165,233,0.1)", color: "#0ea5e9", textDecoration: "none", fontWeight: 600 }}>
          ✉️ Email
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// ============================================================================
// TARIFS (gestion des prix publics)
// ============================================================================
const DEFAULT_PRIX = { amaryllis: 280, zandoli: 220, iguana: 180, geko: 150, mabouya: 110, schoelcher: 100, nogent: 85 };
const BIEN_LABELS  = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", iguana: "Villa Iguana", geko: "Géko", mabouya: "Mabouya", schoelcher: "T2 Schœlcher", nogent: "T2 Nogent-sur-Marne" };
const BIEN_IDS = Object.keys(DEFAULT_PRIX);
// Garde-fous tarifaires par bien : [min, max] en €
const PRIX_LIMITS = {
  amaryllis:  [200, 800],
  zandoli:    [100, 300],
  iguana:     [50,  600],
  geko:       [100, 300],
  mabouya:    [60,  150],
  schoelcher: [90,  160],
  nogent:     [70,  300],
};

const MOIS_CAL = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
// Logements actifs sur le site direct (hors Iguana et Nogent)
const CAL_BIEN_IDS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];

// Règles saisonnières par défaut — [moisDébut, moisFin] (1=Jan, 12=Déc), inclusif
const DEFAULT_SAISONS = [
  { id: "pic",    label: "Pic",          color: "#ef4444", months: [12, 1]  }, // Déc–Jan
  { id: "haute",  label: "Haute saison", color: "#f59e0b", months: [2, 4]   }, // Fév–Avr
  { id: "mi",     label: "Mi-saison",    color: "#0ea5e9", months: [5, 6]   }, // Mai–Jun
  { id: "basse",  label: "Basse saison", color: "#10b981", months: [7, 11]  }, // Jul–Nov
];

function loadSaisons() {
  try { return JSON.parse(localStorage.getItem("saisons_config") || "null") || DEFAULT_SAISONS; } catch { return DEFAULT_SAISONS; }
}
function saveSaisons(s) { try { localStorage.setItem("saisons_config", JSON.stringify(s)); } catch {} }

function loadSaisonPrix() {
  try { return JSON.parse(localStorage.getItem("saison_prix") || "null") || {}; } catch { return {}; }
}
function saveSaisonPrix(p) { try { localStorage.setItem("saison_prix", JSON.stringify(p)); } catch {} }

function CalendrierTarifs({ reservations = [] }) {
  const [bienId, setBienId] = useState("amaryllis");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [daily, setDaily] = useState(loadDailyPrices);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [bulkPrice, setBulkPrice] = useState("");
  const [syncStatus, setSyncStatus] = useState("idle"); // idle|local|syncing|synced|error
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState("add"); // "add" | "remove"
  const [tooltip, setTooltip] = useState(null); // { x, y, text }
  const [showSaisons, setShowSaisons] = useState(false);
  const [showCopie, setShowCopie] = useState(false);
  const [copieSource, setCopieSource] = useState("");
  const [copieFactor, setCopieFactor] = useState("100");
  const [saisons, setSaisons] = useState(loadSaisons);
  const [saisonPrix, setSaisonPrix] = useState(() => {
    const stored = loadSaisonPrix();
    // init prix par défaut basés sur DEFAULT_PRIX si pas encore défini
    const result = {};
    DEFAULT_SAISONS.forEach(s => {
      result[s.id] = stored[s.id] || {};
    });
    return result;
  });
  const [history, setHistory] = useState([]); // stack of previous daily states (max 10)
  const serverTimer = useRef(null);

  // Cleanup du timer serveur quand le composant Tarifs est démonté
  useEffect(() => { return () => clearTimeout(serverTimer.current); }, []);

  useEffect(() => {
    const stop = () => setIsDragging(false);
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  // Undo : pousse l'état actuel dans l'historique, applique le nouvel état
  function commitChange(next) {
    setHistory(h => [...h.slice(-9), daily]);
    setDaily(next); saveDailyPrices(next); scheduleServerSync();
  }

  // Ctrl+Z + Échap
  useEffect(() => {
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && history.length > 0) {
        e.preventDefault();
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        setDaily(prev); saveDailyPrices(prev); scheduleServerSync();
      }
      if (e.key === "Escape") {
        setSelectedDates(new Set());
        setBulkPrice("");
        setIsDragging(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history]);

  // Charger les overrides depuis le serveur au montage
  useEffect(() => {
    fetch("/api/site-config?type=prices")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.config && Object.keys(d.config).length) {
          applyServerPriceOverrides(d.config);
          setDaily(loadDailyPrices());
          setSyncStatus("synced");
        }
      }).catch(() => {});
  }, []);

  // Rafraîchir si un autre onglet admin modifie les prix
  useEffect(() => {
    const refresh = () => setDaily(loadDailyPrices());
    window.addEventListener("storage", refresh);
    window.addEventListener("amaryllis_prices_updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("amaryllis_prices_updated", refresh);
    };
  }, []);
  const getPrice = (date) => daily[bienId]?.[date] ?? null;
  const basePrice = DEFAULT_PRIX[bienId];

  // Prix N-1 : même jour de l'année précédente
  const getPriceN1 = (date) => {
    const prevDate = date.replace(/^\d{4}/, String(calYear - 1));
    return daily[bienId]?.[prevDate] ?? null;
  };

  const bookedDates = useMemo(() => {
    const set = new Set();
    reservations.filter(r => r.bienId === bienId).forEach(r => {
      if (!r.checkin || !r.checkout) return;
      const cur = new Date(r.checkin + "T12:00:00Z");
      const end = new Date(r.checkout + "T12:00:00Z");
      while (cur < end) {
        set.add(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    });
    return set;
  }, [reservations, bienId]);

  // Sync serveur déboncée 2.5s après chaque modif locale
  function scheduleServerSync() {
    setSyncStatus("local");
    clearTimeout(serverTimer.current);
    serverTimer.current = setTimeout(async () => {
      setSyncStatus("syncing");
      try {
        const overrides = loadPriceOverrides();
        const r = await fetch("/api/site-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "prices", config: overrides }),
        });
        const d = await r.json();
        setSyncStatus(d.ok ? "synced" : "error");
      } catch { setSyncStatus("error"); }
    }, 2500);
  }

  function setDayPrice(date, price) {
    const next = { ...daily, [bienId]: { ...(daily[bienId] || {}), [date]: price } };
    setDaily(next); saveDailyPrices(next); scheduleServerSync();
  }
  function clearDayPrice(date) {
    const bienPrices = { ...(daily[bienId] || {}) };
    delete bienPrices[date];
    const next = { ...daily, [bienId]: bienPrices };
    setDaily(next); saveDailyPrices(next); scheduleServerSync();
  }

  // Applique toutes les règles saisonnières sur l'année courante pour le bien actif
  function applySaisons() {
    const bienPrices = { ...(daily[bienId] || {}) };
    const [pMin, pMax] = PRIX_LIMITS[bienId] || [25, 900];
    for (let m = 1; m <= 12; m++) {
      // Trouver la saison applicable
      const saison = saisons.find(s => {
        const [a, b] = s.months;
        return a <= b ? m >= a && m <= b : m >= a || m <= b; // gère Déc–Jan (wrap)
      });
      if (!saison) continue;
      const prix = saisonPrix[saison.id]?.[bienId];
      if (!prix || prix < pMin || prix > pMax) continue;
      const daysInM = new Date(calYear, m, 0).getDate();
      for (let d = 1; d <= daysInM; d++) {
        const date = `${calYear}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        bienPrices[date] = prix;
      }
    }
    commitChange({ ...daily, [bienId]: bienPrices });
  }
  function applyCopie() {
    if (!copieSource || copieSource === bienId) return;
    const factor = parseFloat(copieFactor) / 100;
    if (!factor || factor <= 0) return;
    const sourcePrices = daily[copieSource] || {};
    const lim = PRIX_LIMITS[bienId] || [25, 900];
    const bienPrices = { ...(daily[bienId] || {}) };
    Object.entries(sourcePrices).forEach(([date, price]) => {
      // Ne copier que les dates de l'année affichée
      if (!date.startsWith(String(calYear))) return;
      const adjusted = Math.round(price * factor);
      const clamped = Math.min(Math.max(adjusted, lim[0]), lim[1]);
      bienPrices[date] = clamped;
    });
    commitChange({ ...daily, [bienId]: bienPrices });
    setShowCopie(false);
  }

  function applyBulk() {
    const price = parseInt(bulkPrice);
    const [pMin, pMax] = PRIX_LIMITS[bienId] || [25, 900];
    if (!price || price < pMin || price > pMax || selectedDates.size === 0) return;
    const bienPrices = { ...(daily[bienId] || {}) };
    for (const d of selectedDates) bienPrices[d] = price;
    commitChange({ ...daily, [bienId]: bienPrices });
    setSelectedDates(new Set()); setBulkPrice("");
  }
  function clearBulk() {
    if (selectedDates.size === 0) return;
    const bienPrices = { ...(daily[bienId] || {}) };
    for (const d of selectedDates) delete bienPrices[d];
    commitChange({ ...daily, [bienId]: bienPrices });
    setSelectedDates(new Set()); setBulkPrice("");
  }
  function toggleDate(date) {
    setSelectedDates(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }
  function handleDateMouseDown(e, date) {
    e.preventDefault();
    const adding = !selectedDates.has(date);
    setDragMode(adding ? "add" : "remove");
    setIsDragging(true);
    setSelectedDates(prev => {
      const next = new Set(prev);
      adding ? next.add(date) : next.delete(date);
      return next;
    });
  }
  function handleDateMouseEnter(date) {
    if (!isDragging) return;
    setSelectedDates(prev => {
      const next = new Set(prev);
      dragMode === "add" ? next.add(date) : next.delete(date);
      return next;
    });
  }

  function priceColor(price) {
    if (price === null) return "rgba(255,255,255,0.04)";
    const ratio = price / basePrice;
    if (ratio < 0.85) return "rgba(16,185,129,0.25)";
    if (ratio > 1.25) return "rgba(239,68,68,0.25)";
    if (ratio > 1.05) return "rgba(245,158,11,0.2)";
    return "rgba(14,165,233,0.15)";
  }
  function priceTextColor(price) {
    if (price === null) return "#334155";
    const ratio = price / basePrice;
    if (ratio < 0.85) return "#10b981";
    if (ratio > 1.25) return "#ef4444";
    if (ratio > 1.05) return "#f59e0b";
    return "#0ea5e9";
  }

  const syncBadge = { idle: null, local: "💾 local", syncing: "⟳ sync...", synced: "✓ serveur", error: "⚠ erreur serveur" }[syncStatus];
  const syncColor = { idle: null, local: "#94a3b8", syncing: "#f59e0b", synced: "#10b981", error: "#ef4444" }[syncStatus];

  // ── Alertes prix sous seuil ───────────────────────────────────────────────
  const belowMinDates = useMemo(() => {
    const [pMin] = PRIX_LIMITS[bienId] || [25, 900];
    const prices = daily[bienId] || {};
    return Object.entries(prices)
      .filter(([date, p]) => date.startsWith(String(calYear)) && typeof p === "number" && p < pMin)
      .map(([date, p]) => ({ date, price: p }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [daily, bienId, calYear]);

  const ntfyAlertSentRef = useRef(false);
  useEffect(() => {
    ntfyAlertSentRef.current = false; // reset quand le bien ou l'année change
  }, [bienId, calYear]);

  useEffect(() => {
    if (ntfyAlertSentRef.current || belowMinDates.length === 0) return;
    ntfyAlertSentRef.current = true;
    const [pMin] = PRIX_LIMITS[bienId] || [25, 900];
    // Appel serveur : email Resend + push ntfy (via NTFY_TOPIC secret)
    fetch("/api/send-prix-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bienId, dates: belowMinDates, minPrice: pMin, year: calYear }),
    }).catch(() => {});
    // Push direct depuis le navigateur si topic configuré localement
    const topic = localStorage.getItem("ntfy_topic");
    if (topic) {
      const sample = belowMinDates.slice(0, 5)
        .map(({ date, price }) => { const [, m, d] = date.split("-"); return `${d}/${m}(${price}€)`; })
        .join(", ");
      const body = `${belowMinDates.length} date${belowMinDates.length > 1 ? "s" : ""} sous ${pMin}€ · ${sample}${belowMinDates.length > 5 ? " …" : ""}`;
      fetch(`https://ntfy.sh/${topic}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Title": `⚠️ Prix sous seuil — ${BIEN_LABELS[bienId]}`,
          "Priority": "high",
          "Tags": "warning,moneybag",
        },
        body,
      }).catch(() => {});
    }
  }, [belowMinDates, bienId, calYear]);

  return (
    <div>
      {/* Tooltip custom */}
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x + 12, top: tooltip.y - 32,
          background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)",
          color: "#e2e8f0", fontSize: 11, padding: "4px 8px", borderRadius: 6,
          pointerEvents: "none", zIndex: 9999, whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
        }}>
          {tooltip.text}
        </div>
      )}
      {/* Bien tabs + navigation année */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CAL_BIEN_IDS.map(id => (
            <button key={id} onClick={() => { setBienId(id); setSelectedDates(new Set()); setBulkPrice(""); }} style={{
              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: bienId === id ? 700 : 400,
              background: bienId === id ? "#0ea5e9" : "rgba(255,255,255,0.06)",
              color: bienId === id ? "#fff" : "#64748b",
            }}>{BIEN_LABELS[id]}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {syncBadge && <span style={{ fontSize: 11, color: syncColor, fontWeight: 600 }}>{syncBadge}</span>}
          {history.length > 0 && (
            <button
              onClick={() => {
                const prev = history[history.length - 1];
                setHistory(h => h.slice(0, -1));
                setDaily(prev); saveDailyPrices(prev); scheduleServerSync();
              }}
              title="Annuler la dernière modification (Ctrl+Z)"
              style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              ↩ Annuler{history.length > 1 ? ` (${history.length})` : ""}
            </button>
          )}
          {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
            <button key={y} onClick={() => { setCalYear(y); setSelectedDates(new Set()); setBulkPrice(""); }} style={{
              padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: calYear === y ? 700 : 400,
              background: calYear === y ? "#6366f1" : "rgba(255,255,255,0.06)",
              color: calYear === y ? "#fff" : "#64748b",
            }}>{y}</button>
          ))}
        </div>
      </div>

      {/* ── Bannière alerte prix sous seuil ── */}
      {belowMinDates.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 15 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>
              {belowMinDates.length} date{belowMinDates.length > 1 ? "s" : ""} en dessous du minimum ({(PRIX_LIMITS[bienId] || [25])[0]}€) — {BIEN_LABELS[bienId]}
            </div>
            <div style={{ fontSize: 11, color: "#fca5a5", lineHeight: 1.8, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
              {belowMinDates.slice(0, 14).map(({ date, price }) => {
                const [, m, d] = date.split("-");
                return <span key={date} style={{ whiteSpace: "nowrap" }}>{d}/{m} <strong>{price}€</strong></span>;
              })}
              {belowMinDates.length > 14 && <span style={{ color: "#f87171" }}>+{belowMinDates.length - 14} autres</span>}
            </div>
          </div>
        </div>
      )}

      {/* Multi-select panel */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", flexWrap: "wrap", minHeight: 44 }}>
        {selectedDates.size === 0 ? (
          <span style={{ fontSize: 11, color: "#64748b" }}>Cliquez sur des dates pour les sélectionner — modifiez-les toutes en même temps</span>
        ) : (
          <>
            <span style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 600 }}>{selectedDates.size} date{selectedDates.size > 1 ? "s" : ""} sélectionnée{selectedDates.size > 1 ? "s" : ""}</span>
            {(() => {
              const [pMin, pMax] = PRIX_LIMITS[bienId] || [25, 900];
              const pv = parseInt(bulkPrice);
              const outOfRange = bulkPrice !== "" && (!pv || pv < pMin || pv > pMax);
              const valid = bulkPrice !== "" && pv >= pMin && pv <= pMax;
              return (<>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <input
                    autoFocus type="number" placeholder={`Prix € (${pMin}–${pMax})`} value={bulkPrice}
                    onChange={e => setBulkPrice(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && applyBulk()}
                    style={{ width: 110, padding: "5px 8px", borderRadius: 7, border: `1px solid ${outOfRange ? "#ef4444" : valid ? "#0ea5e9" : "#334155"}`, background: outOfRange ? "rgba(239,68,68,0.08)" : "#0f172a", color: outOfRange ? "#ef4444" : "#e2e8f0", fontSize: 12, outline: "none" }}
                  />
                  {outOfRange && (
                    <span style={{ fontSize: 9, color: "#ef4444", paddingLeft: 2 }}>
                      {pv < pMin ? `Min ${pMin}€` : `Max ${pMax}€`} pour {BIEN_LABELS[bienId]}
                    </span>
                  )}
                </div>
                <button onClick={applyBulk} disabled={!valid}
                  style={{ padding: "5px 14px", borderRadius: 7, border: "none", background: valid ? "#0ea5e9" : "#334155", color: "#fff", fontSize: 11, fontWeight: 600, cursor: valid ? "pointer" : "not-allowed", alignSelf: "flex-start" }}>
                  Appliquer
                </button>
              </>);
            })()}
            <button onClick={clearBulk}
              style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>
              Effacer prix
            </button>
            <button onClick={() => { setSelectedDates(new Set()); setBulkPrice(""); }}
              style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer" }}>
              Désélectionner
            </button>
          </>
        )}
      </div>

      {/* ── Règles saisonnières ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: showSaisons ? 12 : 0 }}>
          <button onClick={() => setShowSaisons(s => !s)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: showSaisons ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)", color: showSaisons ? "#a5b4fc" : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            🗓 Règles saisonnières {showSaisons ? "▲" : "▼"}
          </button>
          {!showSaisons && saisons.some(s => saisonPrix[s.id]?.[bienId]) && (
            <button onClick={applySaisons} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              ⚡ Appliquer les saisons
            </button>
          )}
        </div>
        {showSaisons && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
              Définissez un prix par saison pour <strong style={{ color: "#94a3b8" }}>{BIEN_LABELS[bienId]}</strong>, puis cliquez "Appliquer" pour remplir tout le calendrier.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 14 }}>
              {saisons.map(s => {
                const [pMin, pMax] = PRIX_LIMITS[bienId] || [25, 900];
                const val = saisonPrix[s.id]?.[bienId] || "";
                const pv = parseInt(val);
                const outOfRange = val !== "" && (!pv || pv < pMin || pv > pMax);
                const [ma, mb] = s.months;
                const mLabel = ma <= mb
                  ? `${MOIS_CAL[ma-1]}–${MOIS_CAL[mb-1]}`
                  : `${MOIS_CAL[ma-1]}–Déc / Jan–${MOIS_CAL[mb-1]}`;
                return (
                  <div key={s.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", border: `1px solid ${s.color}22` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{s.label}</span>
                      <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto" }}>{mLabel}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <input
                        type="number"
                        placeholder={`${pMin}–${pMax} €`}
                        value={val}
                        onChange={e => {
                          const next = { ...saisonPrix, [s.id]: { ...(saisonPrix[s.id] || {}), [bienId]: e.target.value } };
                          setSaisonPrix(next); saveSaisonPrix(next);
                        }}
                        style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: `1px solid ${outOfRange ? "#ef4444" : "rgba(255,255,255,0.1)"}`, background: outOfRange ? "rgba(239,68,68,0.08)" : "#0f172a", color: outOfRange ? "#ef4444" : "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                      />
                      {outOfRange && <span style={{ fontSize: 9, color: "#ef4444" }}>{pv < pMin ? `Min ${pMin}€` : `Max ${pMax}€`}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={applySaisons}
              disabled={!saisons.some(s => { const v = parseInt(saisonPrix[s.id]?.[bienId]); const lim = PRIX_LIMITS[bienId]||[25,900]; return v >= lim[0] && v <= lim[1]; })}
              style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              ⚡ Appliquer sur {calYear}
            </button>
            <span style={{ fontSize: 10, color: "#475569", marginLeft: 10 }}>Les jours déjà personnalisés seront écrasés</span>
          </div>
        )}
      </div>

      {/* ── Copie entre biens ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowCopie(s => !s)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: showCopie ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.03)", color: showCopie ? "#67e8f9" : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            📋 Copier depuis un autre bien {showCopie ? "▲" : "▼"}
          </button>
        </div>
        {showCopie && (
          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 5 }}>Source</div>
              <select
                value={copieSource}
                onChange={e => setCopieSource(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", cursor: "pointer" }}
              >
                <option value="">— Choisir —</option>
                {CAL_BIEN_IDS.filter(id => id !== bienId).map(id => (
                  <option key={id} value={id}>{BIEN_LABELS[id]}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 5 }}>Ajustement %</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number" value={copieFactor} min="1" max="300"
                  onChange={e => setCopieFactor(e.target.value)}
                  style={{ width: 70, padding: "6px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none" }}
                />
                <span style={{ fontSize: 11, color: "#64748b" }}>%</span>
                {parseFloat(copieFactor) !== 100 && (
                  <span style={{ fontSize: 10, color: parseFloat(copieFactor) > 100 ? "#f59e0b" : "#10b981" }}>
                    {parseFloat(copieFactor) > 100 ? `+${Math.round(parseFloat(copieFactor)-100)}%` : `−${Math.round(100-parseFloat(copieFactor))}%`}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {copieSource && (
                <div style={{ fontSize: 10, color: "#475569" }}>
                  Copie les prix {calYear} de <strong style={{ color: "#94a3b8" }}>{BIEN_LABELS[copieSource]}</strong> → <strong style={{ color: "#94a3b8" }}>{BIEN_LABELS[bienId]}</strong>
                  {parseFloat(copieFactor) !== 100 ? ` × ${parseFloat(copieFactor)/100}` : ""}
                  , clampé sur [{(PRIX_LIMITS[bienId]||[25,900])[0]}€–{(PRIX_LIMITS[bienId]||[25,900])[1]}€]
                </div>
              )}
              <button
                onClick={applyCopie}
                disabled={!copieSource || copieSource === bienId}
                style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: copieSource ? "#06b6d4" : "#334155", color: "#fff", fontSize: 12, fontWeight: 700, cursor: copieSource ? "pointer" : "not-allowed", alignSelf: "flex-start" }}>
                📋 Copier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grille des mois */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {Array.from({ length: 12 }, (_, m) => {
          const daysInM = new Date(calYear, m + 1, 0).getDate();
          const firstDow = (new Date(calYear, m, 1).getDay() + 6) % 7; // Mon=0
          const cells = [];
          for (let i = 0; i < firstDow; i++) cells.push(null);
          for (let d = 1; d <= daysInM; d++) cells.push(d);
          const monthDates = Array.from({ length: daysInM }, (_, i) =>
            `${calYear}-${String(m + 1).padStart(2,"0")}-${String(i + 1).padStart(2,"0")}`
          );
          const allSelected = monthDates.every(d => selectedDates.has(d));
          function toggleMonth() {
            setSelectedDates(prev => {
              const next = new Set(prev);
              if (allSelected) monthDates.forEach(d => next.delete(d));
              else monthDates.forEach(d => next.add(d));
              return next;
            });
          }
          return (
            <div key={m} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 10px" }}>
              <div
                onClick={toggleMonth}
                title={allSelected ? "Désélectionner tout le mois" : "Sélectionner tout le mois"}
                style={{ fontSize: 12, fontWeight: 600, color: allSelected ? "#0ea5e9" : "#94a3b8", marginBottom: 8, textAlign: "center", cursor: "pointer", userSelect: "none",
                  borderRadius: 5, padding: "2px 4px", background: allSelected ? "rgba(14,165,233,0.1)" : "transparent",
                  transition: "background 0.15s" }}
              >{MOIS_CAL[m]} {calYear}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, userSelect: "none" }}>
                {["L","M","M","J","V","S","D"].map((d, i) => (
                  <div key={i} style={{ fontSize: 8, color: "#334155", textAlign: "center", paddingBottom: 3 }}>{d}</div>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const date = `${calYear}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  const price = getPrice(date);
                  const priceN1 = getPriceN1(date);
                  const isSelected = selectedDates.has(date);
                  const isBooked = bookedDates.has(date);
                  const effectivePrice = price ?? basePrice;
                  const effectiveN1 = priceN1 ?? basePrice;
                  const n1Diff = priceN1 !== null ? Math.round((effectivePrice - effectiveN1) / effectiveN1 * 100) : null;
                  const n1Arrow = n1Diff === null ? "" : n1Diff > 0 ? "↑" : n1Diff < 0 ? "↓" : "";
                  const n1Color = n1Diff > 0 ? "#10b981" : "#ef4444";
                  const n1Label = n1Diff !== null ? ` · ${calYear - 1}: ${effectiveN1}€ ${n1Arrow}${Math.abs(n1Diff)}%` : "";
                  const tooltipText = `${isBooked ? "🟣 Réservé · " : ""}${price !== null ? `${price}€` : `${basePrice}€ (défaut)`}${n1Label}`;
                  return (
                    <div
                      key={i}
                      onMouseDown={e => handleDateMouseDown(e, date)}
                      onMouseEnter={e => { handleDateMouseEnter(date); setTooltip({ x: e.clientX, y: e.clientY, text: tooltipText }); }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        position: "relative", borderRadius: 3, padding: "3px 1px",
                        background: isSelected ? "rgba(14,165,233,0.3)" : priceColor(price),
                        cursor: "pointer", textAlign: "center", minHeight: 28,
                        border: isSelected ? "1px solid #0ea5e9" : isBooked ? "1px solid rgba(167,139,250,0.4)" : "1px solid transparent",
                        outline: isSelected ? "1px solid #0ea5e940" : "none",
                      }}
                    >
                      <div style={{ fontSize: 9, color: isSelected ? "#0ea5e9" : "#94a3b8", fontWeight: isSelected ? 700 : 500 }}>{d}</div>
                      {price !== null
                        ? <div style={{ fontSize: 8, color: priceTextColor(price), fontWeight: 600 }}>{price}</div>
                        : <div style={{ fontSize: 7, color: "#1e293b" }}>{basePrice}</div>
                      }
                      {/* Indicateur N-1 */}
                      {n1Arrow && (
                        <div style={{ position: "absolute", top: 1, left: 2, fontSize: 6, color: n1Color, fontWeight: 700, lineHeight: 1 }}>{n1Arrow}</div>
                      )}
                      {isBooked && (
                        <div style={{ position: "absolute", bottom: 1, right: 1, width: 4, height: 4, borderRadius: "50%", background: "#a78bfa" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>


      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { color: "rgba(16,185,129,0.25)", label: "Promo (−15%+)" },
          { color: "rgba(14,165,233,0.15)", label: "Standard" },
          { color: "rgba(245,158,11,0.2)", label: "Haute saison (+5%+)" },
          { color: "rgba(239,68,68,0.25)", label: "Pic (+25%+)" },
          { color: "rgba(255,255,255,0.04)", label: "Défaut" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: color, border: "1px solid rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: 10, color: "#475569" }}>{label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "transparent", border: "1px solid rgba(167,139,250,0.4)", position: "relative" }}>
            <span style={{ position: "absolute", bottom: 1, right: 1, width: 3, height: 3, borderRadius: "50%", background: "#a78bfa", display: "block" }} />
          </span>
          <span style={{ fontSize: 10, color: "#475569" }}>Réservé</span>
        </div>
      </div>

      {/* ── Résumé tarifaire : min / moy / max par mois ── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>
          Résumé tarifaire — {BIEN_LABELS[bienId]} {calYear}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Mois","Min €","Moy €","Max €"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", color: "#475569", fontWeight: 600, textAlign: h === "Mois" ? "left" : "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, m) => {
                const daysInM = new Date(calYear, m + 1, 0).getDate();
                const prices2 = [];
                for (let d = 1; d <= daysInM; d++) {
                  const date = `${calYear}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  prices2.push(getPrice(date) ?? (SEED_DAILY_PRICES[bienId]?.[date] ?? basePrice));
                }
                const mn = Math.min(...prices2), mx = Math.max(...prices2);
                const avg = Math.round(prices2.reduce((s, p) => s + p, 0) / prices2.length);
                return (
                  <tr key={m} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "5px 10px", color: "#94a3b8" }}>{MOIS_CAL[m]}</td>
                    <td style={{ padding: "5px 10px", color: "#10b981", textAlign: "right", fontWeight: 600 }}>{mn}</td>
                    <td style={{ padding: "5px 10px", color: "#0ea5e9", textAlign: "right", fontWeight: 600 }}>{avg}</td>
                    <td style={{ padding: "5px 10px", color: "#f59e0b", textAlign: "right", fontWeight: 600 }}>{mx}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const SEASONAL_KEY = "amaryllis_seasonal_periods";
const SEASON_COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#0ea5e9","#a855f7","#ec4899","#14b8a6"];
const SEASON_COLOR_LABELS = ["Indigo","Ambre","Émeraude","Rouge","Bleu","Violet","Rose","Teal"];

const DEFAULT_SEASONS = [
  { id: "noel25",   nom: "Noël / Jour de l'an", couleur: "#ef4444", debut: "2025-12-20", fin: "2026-01-05", mult: 1.40, biens: ["amaryllis","zandoli","iguana","geko","mabouya","schoelcher"] },
  { id: "vac_fev",  nom: "Vacances Février",    couleur: "#f59e0b", debut: "2026-02-07", fin: "2026-02-22", mult: 1.20, biens: ["nogent"] },
  { id: "paques26", nom: "Pâques 2026",          couleur: "#10b981", debut: "2026-04-02", fin: "2026-04-18", mult: 1.15, biens: ["amaryllis","zandoli","iguana","geko","mabouya","schoelcher","nogent"] },
  { id: "ete26",    nom: "Été 2026",             couleur: "#6366f1", debut: "2026-07-01", fin: "2026-08-31", mult: 1.30, biens: ["amaryllis","zandoli","iguana","geko","mabouya","schoelcher"] },
  { id: "noel26",   nom: "Noël / Jour de l'an", couleur: "#ef4444", debut: "2026-12-20", fin: "2027-01-05", mult: 1.40, biens: ["amaryllis","zandoli","iguana","geko","mabouya","schoelcher"] },
];

function Tarifs({ reservations = [] }) {
  const [prices, setPrices] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("amaryllis_prices") || "{}");
      return Object.fromEntries(Object.keys(DEFAULT_PRIX).map(id => [id, stored[id] ?? DEFAULT_PRIX[id]]));
    } catch { return { ...DEFAULT_PRIX }; }
  });
  const [saved, setSaved] = useState(false);

  // ── Seasonal periods ──
  const [seasons, setSeasons] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SEASONAL_KEY) || "null") || DEFAULT_SEASONS; }
    catch { return DEFAULT_SEASONS; }
  });
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [editSeason, setEditSeason]   = useState(null); // null = new
  const [seasonForm, setSeasonForm] = useState({ nom: "", couleur: SEASON_COLORS[0], debut: "", fin: "", mult: 1.2, biens: Object.keys(DEFAULT_PRIX) });
  const [seasonSaved, setSeasonSaved] = useState(false);

  function saveSeasons(next) {
    setSeasons(next);
    localStorage.setItem(SEASONAL_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("amaryllis_seasons_updated", { detail: next }));
    setSeasonSaved(true);
    setTimeout(() => setSeasonSaved(false), 2000);
  }
  function openNewSeason() {
    setEditSeason(null);
    setSeasonForm({ nom: "", couleur: SEASON_COLORS[0], debut: "", fin: "", mult: 1.2, biens: Object.keys(DEFAULT_PRIX) });
    setShowSeasonForm(true);
  }
  function openEditSeason(s) {
    setEditSeason(s.id);
    setSeasonForm({ nom: s.nom, couleur: s.couleur, debut: s.debut, fin: s.fin, mult: s.mult, biens: [...s.biens] });
    setShowSeasonForm(true);
  }
  function submitSeasonForm() {
    if (!seasonForm.nom || !seasonForm.debut || !seasonForm.fin) return;
    const entry = { ...seasonForm, id: editSeason || `s_${Date.now()}` };
    const next = editSeason
      ? seasons.map(s => s.id === editSeason ? entry : s)
      : [...seasons, entry];
    saveSeasons(next);
    setShowSeasonForm(false);
  }
  function deleteSeason(id) {
    saveSeasons(seasons.filter(s => s.id !== id));
  }
  function toggleSeasonBien(bienId) {
    setSeasonForm(f => ({
      ...f,
      biens: f.biens.includes(bienId) ? f.biens.filter(b => b !== bienId) : [...f.biens, bienId],
    }));
  }

  function save() {
    localStorage.setItem("amaryllis_prices", JSON.stringify(prices));
    window.dispatchEvent(new Event("amaryllis_prices_updated"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // helper: is a date within a season?
  const dateInSeason = (dateStr, s) => dateStr >= s.debut && dateStr <= s.fin;
  // effective price for a bien on a given date
  const effectivePrice = (bienId, dateStr) => {
    const base = prices[bienId] || 0;
    const activeSeason = seasons.find(s => s.biens.includes(bienId) && dateInSeason(dateStr, s));
    return activeSeason ? Math.round(base * activeSeason.mult) : base;
  };

  // Preview: next 7 days effective price for each bien
  const today = new Date();
  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  return (
    <div style={{ padding: "16px 0" }}>

      {/* ── Prix de base (barre compacte) ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 18px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Prix de base — site public</div>
          <div style={{ fontSize: 11, color: "#475569" }}>« À partir de X€ / nuit »</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button onClick={save} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: saved ? "#10b981" : "rgba(255,255,255,0.08)", color: saved ? "#fff" : "#94a3b8", fontWeight: 600, fontSize: 11, cursor: "pointer", transition: "background 0.25s" }}>{saved ? "✓ Sauvegardé" : "Sauvegarder"}</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.keys(DEFAULT_PRIX).map(id => (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "7px 10px", border: `1px solid ${prices[id] !== DEFAULT_PRIX[id] ? "#f59e0b33" : "rgba(255,255,255,0.06)"}` }}>
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{BIEN_LABELS[id].replace("Villa ", "").replace("T2 ", "")}</span>
              <input
                type="number" min="0" value={prices[id] ?? ""}
                onChange={e => setPrices(p => ({ ...p, [id]: parseInt(e.target.value) || 0 }))}
                style={{ width: 60, padding: "4px 6px", textAlign: "right", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#e2e8f0", fontSize: 12, outline: "none" }}
              />
              <span style={{ fontSize: 10, color: "#475569" }}>€</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Remises automatiques ── */}
      <div style={{ background: "rgba(196,114,84,0.06)", border: "1px solid rgba(196,114,84,0.2)", borderRadius: 12, padding: "12px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18 }}>🎁</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>Remises automatiques sur le site direct</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>7+ nuits : −5% · 14+ nuits : −10% · 28+ nuits : −15%</div>
        </div>
      </div>

      {/* ── Pricing saisonnier ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px 18px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>🌊</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Périodes tarifaires saisonnières</div>
          <div style={{ fontSize: 11, color: "#475569", flex: 1 }}>Multiplicateurs sur le prix de base</div>
          {seasonSaved && <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>✓ Sauvegardé</span>}
          <button
            onClick={openNewSeason}
            style={{ padding: "6px 13px", borderRadius: 7, border: "none", background: "rgba(99,102,241,0.18)", color: "#818cf8", fontWeight: 700, fontSize: 11, cursor: "pointer" }}
          >+ Ajouter</button>
        </div>

        {seasons.length === 0 && (
          <div style={{ textAlign: "center", color: "#475569", fontSize: 12, padding: "20px 0" }}>Aucune période configurée — cliquez sur « Ajouter »</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {seasons.map(s => {
            const nbBiens = s.biens.length;
            const pct = Math.round((s.mult - 1) * 100);
            const sign = pct >= 0 ? "+" : "";
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "10px 14px", border: `1px solid ${s.couleur}22`, flexWrap: "wrap" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.couleur, flexShrink: 0 }} />
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{s.nom}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.debut} → {s.fin} · {nbBiens} bien{nbBiens > 1 ? "s" : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: pct >= 0 ? "#10b981" : "#ef4444" }}>{sign}{pct}%</span>
                  <span style={{ fontSize: 10, color: "#475569" }}>× {s.mult.toFixed(2)}</span>
                </div>
                {/* Mini preview: prix pour chaque bien concerné */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {s.biens.slice(0, 4).map(bId => (
                    <span key={bId} style={{ fontSize: 10, background: `${s.couleur}22`, color: s.couleur, borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>
                      {BIEN_LABELS[bId]?.replace("Villa ","").replace("T2 ","").slice(0,8)} {Math.round((prices[bId]||0) * s.mult)}€
                    </span>
                  ))}
                  {s.biens.length > 4 && <span style={{ fontSize: 10, color: "#475569" }}>+{s.biens.length - 4}</span>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEditSeason(s)} style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>✏️</button>
                  <button onClick={() => deleteSeason(s.id)} style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Aperçu 7 prochains jours ── */}
        {Object.keys(DEFAULT_PRIX).length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>APERÇU — 7 prochains jours (€/nuit effectif)</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                <thead>
                  <tr>
                    <td style={{ padding: "4px 8px", color: "#475569", fontWeight: 700 }}>Bien</td>
                    {nextDays.map(d => {
                      const activeSeason = seasons.find(s => s.biens.some(() => true) && dateInSeason(d, s));
                      return (
                        <td key={d} style={{ padding: "4px 6px", textAlign: "center", color: activeSeason ? activeSeason.couleur : "#475569", fontWeight: activeSeason ? 700 : 400 }}>
                          {d.slice(5)}
                        </td>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(DEFAULT_PRIX).map(bId => (
                    <tr key={bId} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "4px 8px", color: "#94a3b8", whiteSpace: "nowrap" }}>{BIEN_LABELS[bId]?.replace("Villa ","").replace("T2 ","")}</td>
                      {nextDays.map(d => {
                        const ep = effectivePrice(bId, d);
                        const base = prices[bId] || 0;
                        const boosted = ep !== base;
                        const activeSeason = seasons.find(s => s.biens.includes(bId) && dateInSeason(d, s));
                        return (
                          <td key={d} style={{ padding: "4px 6px", textAlign: "center", fontWeight: boosted ? 700 : 400, color: boosted ? (activeSeason?.couleur || "#10b981") : "#475569", background: boosted ? `${activeSeason?.couleur || "#10b981"}11` : "transparent", borderRadius: 4 }}>
                            {ep}€
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Calendrier des prix (toujours visible) ── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>Calendrier des prix</div>
      <CalendrierTarifs reservations={reservations} />

      {/* ── Modal form période saisonnière ── */}
      {showSeasonForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowSeasonForm(false)}>
          <div style={{ background: "#1e293b", borderRadius: 14, padding: 24, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 18 }}>{editSeason ? "✏️ Modifier la période" : "➕ Nouvelle période tarifaire"}</div>

            {/* Nom */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>Nom de la période</div>
              <input value={seasonForm.nom} onChange={e => setSeasonForm(f => ({ ...f, nom: e.target.value }))} placeholder="ex: Été 2026, Noël 2026…" style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>Début</div>
                <input type="date" value={seasonForm.debut} onChange={e => setSeasonForm(f => ({ ...f, debut: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>Fin</div>
                <input type="date" value={seasonForm.fin} onChange={e => setSeasonForm(f => ({ ...f, fin: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Multiplicateur */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>Multiplicateur de prix — {Math.round((seasonForm.mult - 1) * 100) >= 0 ? "+" : ""}{Math.round((seasonForm.mult - 1) * 100)}% sur le prix de base</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="range" min="0.5" max="3" step="0.05" value={seasonForm.mult} onChange={e => setSeasonForm(f => ({ ...f, mult: parseFloat(e.target.value) }))} style={{ flex: 1, accentColor: seasonForm.couleur }} />
                <input type="number" min="0.5" max="3" step="0.05" value={seasonForm.mult} onChange={e => setSeasonForm(f => ({ ...f, mult: parseFloat(e.target.value) || 1 }))} style={{ width: 64, padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", textAlign: "center" }} />
              </div>
            </div>

            {/* Couleur */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Couleur</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SEASON_COLORS.map((c, i) => (
                  <button key={c} onClick={() => setSeasonForm(f => ({ ...f, couleur: c }))} style={{ width: 26, height: 26, borderRadius: "50%", border: `3px solid ${seasonForm.couleur === c ? "#fff" : "transparent"}`, background: c, cursor: "pointer", flexShrink: 0 }} title={SEASON_COLOR_LABELS[i]} />
                ))}
              </div>
            </div>

            {/* Biens concernés */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Biens concernés ({seasonForm.biens.length}/{Object.keys(DEFAULT_PRIX).length})</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.keys(DEFAULT_PRIX).map(bId => {
                  const active = seasonForm.biens.includes(bId);
                  return (
                    <button key={bId} onClick={() => toggleSeasonBien(bId)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${active ? seasonForm.couleur : "rgba(255,255,255,0.1)"}`, background: active ? `${seasonForm.couleur}22` : "transparent", color: active ? seasonForm.couleur : "#64748b", fontSize: 11, fontWeight: active ? 700 : 400, cursor: "pointer" }}>
                      {BIEN_LABELS[bId]?.replace("Villa ","").replace("T2 ","") || bId}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowSeasonForm(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Annuler</button>
              <button onClick={submitSeasonForm} disabled={!seasonForm.nom || !seasonForm.debut || !seasonForm.fin} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: (!seasonForm.nom || !seasonForm.debut || !seasonForm.fin) ? "#334155" : seasonForm.couleur, color: "#fff", fontSize: 12, fontWeight: 700, cursor: (!seasonForm.nom || !seasonForm.debut || !seasonForm.fin) ? "not-allowed" : "pointer" }}>
                {editSeason ? "Modifier" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// FAB
// ============================================================================
function FAB({ onTab }) {
  const [open, setOpen] = useState(false);
  const acts = [
    { i: "📅", l: "Planning", c: "#0ea5e9", t: "planning" },
    { i: "🎯", l: "Cockpit", c: "#6366f1", t: "cockpit" },
    { i: "🔮", l: "Prévisionnel", c: "#f59e0b", t: "previsionnel" },
    { i: "💰", l: "Charges", c: "#ef4444", t: "charges" },
    { i: "💼", l: "Pilotage", c: "#06b6d4", t: "pilotage" },
    { i: "📈", l: "Historique", c: "#10b981", t: "historique" },
    { i: "📊", l: "vs 2025", c: "#a855f7", t: "vs2025" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 18, right: 18, zIndex: 50 }}>
      {open && (
        <div style={{ position: "absolute", bottom: 58, right: 0, display: "flex", flexDirection: "column", gap: 7, alignItems: "flex-end" }}>
          {acts.map((a, i) => (
            <button
              key={i}
              onClick={() => { onTab(a.t); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 22, border: "none", background: "#1e293b", color: a.c, cursor: "pointer", fontSize: 12, fontWeight: 600, boxShadow: "0 3px 10px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}
            >
              <span style={{ fontSize: 14 }}>{a.i}</span>{a.l}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{ width: 50, height: 50, borderRadius: "50%", border: "none", background: open ? "#334155" : "transparent", cursor: "pointer", boxShadow: open ? "none" : "0 4px 14px rgba(10,46,84,0.25)", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, overflow: "hidden" }}
      >
        {open
          ? <span style={{ color: "#94a3b8", fontSize: 18, fontWeight: 600 }}>✕</span>
          : <img src="/favicon.svg" alt="Amaryllis" style={{ width: 50, height: 50, display: "block" }} />}
      </button>
    </div>
  );
}

// ============================================================================
// PASSWORD GATE
// ============================================================================
const PWD_KEY = "ldb_auth_v1";
const VALID_HASH = "8e4b1a3d9f2c6e7b0a5d3f8c2e1b9a4d"; // sha-lite placeholder

function PasswordGate({ onAuth }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("Mot de passe incorrect");
  const [loading, setLoading] = useState(false);
  const check = async () => {
    if (!val || loading) return;
    setLoading(true);
    setErr(false);
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: val }),
      });
      let data;
      try { data = await res.json(); } catch { data = {}; }
      if (data.ok && data.role) {
        sessionStorage.setItem(PWD_KEY, "ok");
        sessionStorage.setItem("admin_role", data.role);
        onAuth(data.role);
      } else {
        setErrMsg("Mot de passe incorrect");
        setErr(true);
        setTimeout(() => setErr(false), 1200);
      }
    } catch {
      setErrMsg("Erreur réseau — réessaie");
      setErr(true);
      setTimeout(() => setErr(false), 2500);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "36px 32px", width: 320, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Locatif Dashboard</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 24 }}>Accès sécurisé</div>
        <input
          type="password"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && check()}
          placeholder="Mot de passe"
          autoFocus
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${err ? "#ef4444" : "rgba(255,255,255,0.15)"}`, background: "#0f172a", color: "#e2e8f0", fontSize: 14, boxSizing: "border-box", marginBottom: 10, outline: "none", transition: "border 0.2s" }}
        />
        {err && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{errMsg}</div>}
        <button
          onClick={check}
          disabled={loading}
          style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: loading ? "#334155" : "linear-gradient(135deg,#0ea5e9,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", transition: "background 0.2s" }}
        >{loading ? "Connexion..." : "Entrer"}</button>
        <div style={{ fontSize: 10, color: "#334155", marginTop: 16 }}>villamaryllis.com/admin</div>
      </div>
    </div>
  );
}

// ============================================================================
// BEDS24 ADMIN — Réservations Nogent via channel manager
// ============================================================================
const STATUS_OPTIONS = [
  { v: "",   l: "Tous statuts" },
  { v: "1",  l: "✅ Confirmé" },
  { v: "0",  l: "🆕 Nouveau" },
  { v: "3",  l: "📩 Demande" },
  { v: "4",  l: "⏳ Paiement en attente" },
  { v: "2",  l: "❌ Annulé" },
];

const CHANNEL_COLORS = {
  "Airbnb":       "#ff5a5f",
  "Booking.com":  "#003580",
  "Expedia":      "#ffc72c",
  "Direct":       "#10b981",
  "Beds24 Direct":"#0ea5e9",
};

function Beds24Admin({ scriptUrl, reservations = [], saveRes, addToast = () => {} }) {
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [testStatus,  setTestStatus]  = useState(null); // null | "ok" | "error"
  const [syncStatus,  setSyncStatus]  = useState(null); // null | "syncing" | "ok" | "error"
  const [filters,     setFilters]     = useState({
    arrivalFrom:   "",
    arrivalTo:     "",
    departureFrom: "",
    departureTo:   "",
    modifiedFrom:  "",
    status:        "",
  });
  const [fetchInfo, setFetchInfo]  = useState(null); // { total, fetchedAt, pages }
  const [expanded,  setExpanded]   = useState(null); // bookingId en cours

  // ── Fetch bookings ──────────────────────────────────────────────
  async function fetchBookings() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/beds24-bookings?${params}`);
      let data;
      try { data = await res.json(); }
      catch { throw new Error(res.ok ? "Réponse non-JSON du serveur" : `Fonction /api/beds24-bookings introuvable (HTTP ${res.status}) — utilise npm run dev:cf`); }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setBookings(data.bookings || []);
      setFetchInfo({ total: data.total, fetchedAt: data.fetchedAt, pages: data.pages });
    } catch (e) {
      setError(e.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Test connexion ──────────────────────────────────────────────
  async function testConnection() {
    setTestStatus(null);
    try {
      const res = await fetch("/api/beds24-bookings?test=1");
      let data;
      try { data = await res.json(); } catch { setTestStatus("error"); return; }
      setTestStatus(data.ok ? "ok" : "error");
      if (!data.ok && data.error) setError(data.error);
    } catch { setTestStatus("error"); }
  }

  // ── Sync vers Google Sheets ──────────────────────────────────────
  async function syncToSheets() {
    if (!scriptUrl) { addToast("Configure d'abord l'URL Apps Script (bouton ⚙)", "error"); return; }
    if (bookings.length === 0) { addToast("Charge d'abord les réservations", "error"); return; }
    setSyncStatus("syncing");
    try {
      const res  = await fetch("/api/sheets-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Script-Url": scriptUrl },
        body: JSON.stringify({ action: "importBeds24", bookings }),
      });
      const data = await res.json();
      if (data.ok) {
        setSyncStatus("ok");
        addToast(`📊 Sheets — ${data.added || 0} ajoutée(s), ${data.updated || 0} mise(s) à jour`, "success");
      } else {
        setSyncStatus("error");
        addToast(`Sheets — ${data.error || "Erreur Apps Script"}`, "error");
      }
    } catch (e) {
      setSyncStatus("error");
      addToast(`Sheets — ${e.message}`, "error");
    }
  }

  // ── Sync vers Planning (calendrier principal) ────────────────────
  const [planningStatus, setPlanningStatus] = useState(null); // null | "ok" | "error"

  function syncToPlanning() {
    if (!bookings.length) return;
    const beds24Converted = bookings
      .filter(b => b.status !== 2 && b.statusLabel !== "Annulé") // exclure annulés
      .map(b => ({
        id:               "beds24-" + b.bookingId,
        bienId:           "nogent",
        voyageur:         b.guestName || "—",
        canal:            b.channelLabel || b.channel || "Beds24",
        checkin:          b.arrival,
        checkout:         b.departure,
        checkin_time:     "",
        checkout_time:    "",
        nb_guests:        b.numGuests || 1,
        montant:          b.price || 0,
        notes:            b.notes || "",
        phone:            b.phone || "",
        reservation_code: String(b.bookingId),
        fromBeds24:       true,
        fromIcal:         false,
        menage_done:      false,
        assigne:          "",
      }));
    // Remplacer toutes les réservations beds24 existantes, garder les autres
    const autres = reservations.filter(r => !String(r.id).startsWith("beds24-"));
    saveRes([...autres, ...beds24Converted]);
    setPlanningStatus("ok");
    addToast(`📅 ${beds24Converted.length} réservation(s) Beds24 injectée(s) dans le planning`, "success");
    setTimeout(() => setPlanningStatus(null), 3000);
  }

  // ── Sync tarifs depuis Beds24 inventory ─────────────────────────────────
  const [pricesSyncStatus, setPricesSyncStatus] = useState(null); // null | "loading" | "ok" | "error"

  async function syncPricesFromBeds24() {
    setPricesSyncStatus("loading");
    setPricesSyncMsg("");
    try {
      const res = await fetch("/api/beds24-prices");
      let data;
      try { data = await res.json(); }
      catch { throw new Error(`HTTP ${res.status} — réponse non-JSON`); }
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (!data.nogent || Object.keys(data.nogent).length === 0) {
        throw new Error("Aucun tarif reçu de Beds24");
      }
      // Fusionner dans le localStorage local (overrides Beds24 > seed)
      applyServerPriceOverrides({ nogent: data.nogent });
      setPricesSyncStatus("ok");
      const sourceLabel = data.source === "bookings" ? "depuis réservations confirmées" : "depuis inventaire Beds24";
      addToast(`💰 ${Object.keys(data.nogent).length} nuits synced (${data.bookingCount || 0} rés. · ${sourceLabel})`, "success");
      setTimeout(() => { setPricesSyncStatus(null); }, 5000);
    } catch (e) {
      setPricesSyncStatus("error");
      addToast(`Tarifs Beds24 — ${e.message}`, "error");
    }
  }

  // Chargement initial
  useEffect(() => { fetchBookings(); }, []);

  const fmtDate = (d) => d ? new Date(d + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtMoney = (n) => n ? `${Number(n).toLocaleString("fr-FR")} €` : "—";

  return (
    <div style={{ maxWidth: 1200 }}>

      {/* ── En-tête ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>
            🏙️ Beds24 — T2 Nogent-sur-Marne
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            Propriété 158192 · {fetchInfo ? `${fetchInfo.total} réservation(s) · ${new Date(fetchInfo.fetchedAt).toLocaleString("fr-FR")}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Test connexion */}
          <button
            onClick={testConnection}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: testStatus === "ok" ? "#10b981" : testStatus === "error" ? "#ef4444" : "#94a3b8", fontSize: 11, cursor: "pointer" }}
          >
            {testStatus === "ok" ? "✓ Connecté" : testStatus === "error" ? "✗ Échec" : "🔌 Tester"}
          </button>
          <button
            onClick={fetchBookings}
            disabled={loading}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #0ea5e9", background: "rgba(14,165,233,0.12)", color: "#0ea5e9", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {loading ? "⟳ Chargement…" : "⟳ Actualiser"}
          </button>
          <button
            onClick={syncToPlanning}
            disabled={bookings.length === 0}
            title="Injecter les réservations Beds24 dans le calendrier principal"
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #a78bfa", background: "rgba(167,139,250,0.1)", color: planningStatus === "ok" ? "#10b981" : "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {planningStatus === "ok" ? "✓ Ajouté au planning" : "📅 → Planning"}
          </button>
          <button
            onClick={syncPricesFromBeds24}
            disabled={pricesSyncStatus === "loading"}
            title="Lire les tarifs journaliers Beds24 et les synchroniser dans le calendrier des prix"
            style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${pricesSyncStatus === "ok" ? "#10b981" : pricesSyncStatus === "error" ? "#ef4444" : "#f59e0b"}`, background: `rgba(${pricesSyncStatus === "ok" ? "16,185,129" : pricesSyncStatus === "error" ? "239,68,68" : "245,158,11"},0.1)`, color: pricesSyncStatus === "ok" ? "#10b981" : pricesSyncStatus === "error" ? "#ef4444" : "#f59e0b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {pricesSyncStatus === "loading" ? "⟳ Sync tarifs…" : pricesSyncStatus === "ok" ? "✓ Tarifs synced" : pricesSyncStatus === "error" ? "✗ Échec tarifs" : "💰 Sync tarifs"}
          </button>
          <button
            onClick={syncToSheets}
            disabled={syncStatus === "syncing" || bookings.length === 0}
            title="Exporter toutes les réservations visibles vers Google Sheets"
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #10b981", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {syncStatus === "syncing" ? "⟳ Export…" : "📊 → Sheets"}
          </button>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 18px", marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        {[
          { key: "arrivalFrom",   label: "Arrivée from" },
          { key: "arrivalTo",     label: "Arrivée to" },
          { key: "departureFrom", label: "Départ from" },
          { key: "departureTo",   label: "Départ to" },
          { key: "modifiedFrom",  label: "Modifié from" },
        ].map(({ key, label }) => (
          <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
            <input
              type="date"
              value={filters[key]}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
              style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", padding: "5px 9px", fontSize: 12 }}
            />
          </label>
        ))}
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Statut</span>
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", padding: "5px 9px", fontSize: 12, minWidth: 160 }}
          >
            {STATUS_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </label>
        <button
          onClick={fetchBookings}
          style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-end" }}
        >Filtrer</button>
        <button
          onClick={() => {
            setFilters({ arrivalFrom: "", arrivalTo: "", departureFrom: "", departureTo: "", modifiedFrom: "", status: "" });
            setTimeout(fetchBookings, 0);
          }}
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer", alignSelf: "flex-end" }}
        >Réinitialiser</button>
      </div>

      {/* ── Mix de canaux ── */}
      {bookings.length > 0 && (() => {
        const normalize = (c) => {
          if (!c) return "autre";
          const l = String(c).toLowerCase();
          if (l.includes("booking")) return "booking";
          if (l.includes("airbnb"))  return "airbnb";
          if (l.includes("direct"))  return "direct";
          return "autre";
        };
        const canalStats = {};
        bookings.forEach(b => {
          const key = normalize(b.channelLabel || b.channel || "");
          if (!canalStats[key]) canalStats[key] = { count: 0, montant: 0 };
          canalStats[key].count++;
          canalStats[key].montant += b.price || 0;
        });
        const total = bookings.length;
        const canalConf = {
          booking: { label: "Booking.com", color: "#0ea5e9", comm: 15 },
          airbnb:  { label: "Airbnb",      color: "#FF5A5F", comm: 3  },
          direct:  { label: "Direct",      color: "#10b981", comm: 0  },
          autre:   { label: "Autre",       color: "#64748b", comm: 0  },
        };
        const rows = Object.entries(canalStats)
          .map(([k, s]) => ({ key: k, ...canalConf[k], pct: Math.round(s.count / total * 100), ...s }))
          .sort((a, b) => b.count - a.count);
        const bookingPct = canalStats.booking ? Math.round(canalStats.booking.count / total * 100) : 0;
        return (
          <div style={{ background: "#0f172a", border: `1px solid ${bookingPct > 70 ? "rgba(239,68,68,0.3)" : "#1e293b"}`, borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: bookingPct > 70 ? "#ef4444" : "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              📊 Mix de canaux {bookingPct > 70 ? "⚠ Concentration excessive" : ""}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {rows.map(r => (
                <div key={r.key} style={{ background: `${r.color}15`, border: `1px solid ${r.color}40`, borderRadius: 8, padding: "8px 14px", minWidth: 110 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", fontFamily: "var(--font-mono)", marginTop: 2 }}>{r.pct}%</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{r.count} rés. · comm. {r.comm}%</div>
                </div>
              ))}
            </div>
            {bookingPct > 70 && (
              <div style={{ fontSize: 10, color: "#f87171", marginTop: 10 }}>
                ⚠ Dépendance Booking.com trop élevée ({bookingPct}%). Objectif cible : &lt; 50% — activer Airbnb et réservations directes.
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Erreur ── */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 14, color: "#fca5a5", fontSize: 12 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Tableau des réservations ── */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
        {loading ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {["ID", "Client", "Arrivée", "Départ", "Nuits", "Canal", "Statut", "Montant", ""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[60, 80, 45, 70, 55, 90, 40].map((w, i) => (
                  <tr key={i} className="skeleton-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 40, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: `${w}px`, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 68, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 68, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 20, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 50, height: 18, borderRadius: 20 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 50, height: 18, borderRadius: 20 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 48, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 10, height: 12 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>Aucune réservation trouvée</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {["ID", "Client", "Arrivée", "Départ", "Nuits", "Canal", "Statut", "Montant", ""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, idx) => (
                  <>
                    <tr
                      key={b.bookingId}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: expanded === b.bookingId ? "rgba(14,165,233,0.05)" : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                      onClick={() => setExpanded(expanded === b.bookingId ? null : b.bookingId)}
                    >
                      <td style={{ padding: "10px 14px", fontSize: 11, color: "#64748b", fontFamily: "var(--font-mono)" }}>#{b.bookingId}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{b.guestName}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#cbd5e1", whiteSpace: "nowrap" }}>{fmtDate(b.arrival)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#cbd5e1", whiteSpace: "nowrap" }}>{fmtDate(b.departure)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>{b.nights}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                          background: `${CHANNEL_COLORS[b.channelLabel] || "#475569"}22`,
                          color: CHANNEL_COLORS[b.channelLabel] || "#94a3b8",
                          border: `1px solid ${CHANNEL_COLORS[b.channelLabel] || "#475569"}44`,
                          whiteSpace: "nowrap",
                        }}>{b.channelLabel || b.channel || "—"}</span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                          background: b.status === "1" || b.status === 1 ? "rgba(16,185,129,0.15)" : b.status === "2" || b.status === 2 ? "rgba(239,68,68,0.12)" : "rgba(148,163,184,0.1)",
                          color:      b.status === "1" || b.status === 1 ? "#10b981" : b.status === "2" || b.status === 2 ? "#f87171" : "#94a3b8",
                          border:     `1px solid ${b.status === "1" || b.status === 1 ? "rgba(16,185,129,0.3)" : b.status === "2" || b.status === 2 ? "rgba(239,68,68,0.25)" : "rgba(148,163,184,0.15)"}`,
                          whiteSpace: "nowrap",
                        }}>{b.statusLabel}</span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#a3e635", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtMoney(b.price)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#475569" }}>{expanded === b.bookingId ? "▲" : "▼"}</td>
                    </tr>
                    {/* Ligne détail dépliable */}
                    {expanded === b.bookingId && (
                      <tr key={`${b.bookingId}-detail`} style={{ background: "rgba(14,165,233,0.04)", borderBottom: "1px solid rgba(14,165,233,0.1)" }}>
                        <td colSpan={9} style={{ padding: "14px 20px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                            {[
                              { l: "Email",         v: b.email     || "—" },
                              { l: "Téléphone",     v: b.phone     || "—" },
                              { l: "Voyageurs",     v: b.numGuests },
                              { l: "Chambre",       v: b.roomId    || "—" },
                              { l: "Unité",         v: b.unitId    || "—" },
                              { l: "Créé le",       v: fmtDate(b.createdOn) },
                              { l: "Modifié le",    v: fmtDate(b.modifiedOn) },
                              { l: "Canal brut",    v: b.channel   || "—" },
                            ].map(({ l, v }) => (
                              <div key={l}>
                                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{l}</div>
                                <div style={{ fontSize: 12, color: "#cbd5e1" }}>{v}</div>
                              </div>
                            ))}
                            {b.notes && (
                              <div style={{ gridColumn: "1 / -1" }}>
                                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Notes voyageur</div>
                                <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>{b.notes}</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Résumé bas ── */}
      {bookings.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { l: "Total réservations", v: bookings.length },
            { l: "CA total",           v: fmtMoney(bookings.reduce((s, b) => s + (b.price || 0), 0)) },
            { l: "Confirmées",         v: bookings.filter(b => String(b.status) === "1").length },
            { l: "Annulées",           v: bookings.filter(b => String(b.status) === "2").length },
            { l: "Nuits totales",      v: bookings.filter(b => String(b.status) !== "2").reduce((s, b) => s + (b.nights || 0), 0) },
          ].map(({ l, v }) => (
            <div key={l} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 18px", minWidth: 130 }}>
              <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ANALYTICS
// ============================================================================
function AnalyticsTab({ mob }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 28 }}>📊</div>
      <div style={{ color: "#64748b", fontSize: 13 }}>Chargement Analytics…</div>
    </div>
  );

  if (error) return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 20, marginTop: 12 }}>
      <div style={{ fontWeight: 700, color: "#f87171", marginBottom: 6 }}>⚠ Analytics non disponible</div>
      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{error}</div>
      {error.includes("non configuré") && (
        <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8", lineHeight: 1.8 }}>
          <b style={{ color: "#e2e8f0" }}>Configuration requise :</b><br />
          1. Google Cloud → créer un Service Account → télécharger le JSON<br />
          2. GA4 Admin → Gestion des accès → ajouter l'email du service account (Lecteur)<br />
          3. Ajouter les secrets Cloudflare : <code style={{ color: "#f59e0b" }}>GA4_PROPERTY_ID</code>, <code style={{ color: "#f59e0b" }}>GA4_CLIENT_EMAIL</code>, <code style={{ color: "#f59e0b" }}>GA4_PRIVATE_KEY</code>
        </div>
      )}
    </div>
  );

  if (!data) return null;

  // ── Agrégats overview (dateRange 0 = 30j, dateRange 1 = 30j précédents) ──
  const agg = (range) => {
    const rows = (data.overview || []).filter(r => r.dateRange === `date_range_${range}`);
    // Si pas de dateRange dans la réponse (rapport simple), on prend tout
    const all = rows.length > 0 ? rows : (data.overview || []);
    return all.reduce((a, r) => ({
      sessions:    a.sessions    + (r.sessions    || 0),
      users:       a.users       + (r.totalUsers  || 0),
      pageviews:   a.pageviews   + (r.screenPageViews || 0),
      bounceRate:  a.bounceRate  + (r.bounceRate  || 0) / Math.max(all.length, 1),
      avgDuration: a.avgDuration + (r.averageSessionDuration || 0) / Math.max(all.length, 1),
    }), { sessions: 0, users: 0, pageviews: 0, bounceRate: 0, avgDuration: 0 });
  };

  const cur  = agg(0);
  const prev = agg(1);
  const delta = (c, p) => p > 0 ? Math.round((c - p) / p * 100) : null;

  // Trier l'overview par date pour le graphe
  const overviewByDate = [...(data.overview || [])]
    .filter(r => !r.dateRange || r.dateRange === "date_range_0")
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .map(r => ({ date: r.date ? `${r.date.slice(6,8)}/${r.date.slice(4,6)}` : "?", sessions: r.sessions || 0, users: r.totalUsers || 0 }));

  // ── Devices ──
  const totalDevSessions = (data.devices || []).reduce((s, r) => s + (r.sessions || 0), 0);
  const devColors = { desktop: "#0ea5e9", mobile: "#10b981", tablet: "#f59e0b" };

  // ── Top sources ──
  const topSources = [...(data.sources || [])]
    .map(r => ({
      label: r.sessionSource === "(direct)" ? "Direct" : `${r.sessionSource}`,
      medium: r.sessionMedium,
      sessions: r.sessions || 0,
    }))
    .slice(0, 8);
  const maxSrc = Math.max(...topSources.map(s => s.sessions), 1);

  // ── Top pages ──
  const topPages = [...(data.pages || [])]
    .map(r => ({ path: r.pagePath || "/", sessions: r.sessions || 0, users: r.totalUsers || 0, duration: Math.round(r.averageSessionDuration || 0) }))
    .slice(0, 12);
  const maxPage = Math.max(...topPages.map(p => p.sessions), 1);

  // ── Top pays ──
  const topCountries = (data.countries || []).slice(0, 6);
  const maxCountry = Math.max(...topCountries.map(c => c.sessions || 0), 1);

  const fmt2 = n => n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(Math.round(n));
  const fmtDur = s => `${Math.floor(s/60)}m${Math.round(s%60).toString().padStart(2,"0")}s`;

  const KPI = ({ label, value, prev: p, color = "#0ea5e9", suffix = "" }) => {
    const d = p !== undefined ? delta(value, p) : null;
    return (
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{fmt2(value)}{suffix}</div>
        {d !== null && (
          <div style={{ fontSize: 10, color: d >= 0 ? "#10b981" : "#ef4444", marginTop: 3 }}>
            {d >= 0 ? "▲" : "▼"} {Math.abs(d)}% vs 30j préc.
          </div>
        )}
      </div>
    );
  };

  const srcColor = (medium) => {
    if (medium === "organic")  return "#10b981";
    if (medium === "referral") return "#f59e0b";
    if (medium === "social")   return "#6366f1";
    if (medium === "(none)")   return "#0ea5e9";
    return "#64748b";
  };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>📊 Google Analytics — 30 derniers jours</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 18 }}>Propriété G-N9BM709ZBL · {data.overview?.length || 0} jours de données</div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        <KPI label="Sessions"   value={cur.sessions}    prev={prev.sessions}    color="#0ea5e9" />
        <KPI label="Visiteurs"  value={cur.users}       prev={prev.users}       color="#10b981" />
        <KPI label="Pages vues" value={cur.pageviews}   prev={prev.pageviews}   color="#6366f1" />
        <KPI label="Rebond"     value={Math.round(cur.bounceRate * 100)} suffix="%" color="#f59e0b" />
        <KPI label="Durée moy." value={cur.avgDuration} color="#ec4899" suffix="" />
      </div>

      {/* Graphe sessions / jour */}
      {overviewByDate.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: mob ? 12 : 18, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>Trafic quotidien — 30j</div>
          <ResponsiveContainer width="100%" height={mob ? 110 : 140}>
            <ComposedChart data={overviewByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(overviewByDate.length / 7)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="sessions" fill="rgba(14,165,233,0.3)" radius={[2,2,0,0]} name="Sessions" />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={1.5} dot={false} name="Visiteurs" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 16 }}>

        {/* Appareils */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>📱 Appareils</div>
          {(data.devices || []).map(d => {
            const pct = totalDevSessions > 0 ? Math.round(d.sessions / totalDevSessions * 100) : 0;
            const cat = d.deviceCategory || "other";
            const color = devColors[cat] || "#64748b";
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: "#e2e8f0", textTransform: "capitalize" }}>{cat === "desktop" ? "💻 Desktop" : cat === "mobile" ? "📱 Mobile" : "📟 Tablette"}</span>
                  <span style={{ color, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{pct}% · {fmt2(d.sessions)}</span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                  <div style={{ height: 5, width: pct + "%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Pays */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>🌍 Pays visiteurs</div>
          {topCountries.map((c, i) => {
            const pct = Math.round((c.sessions || 0) / maxCountry * 100);
            return (
              <div key={c.country || i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: "#e2e8f0" }}>{c.country || "—"}</span>
                  <span style={{ color: "#0ea5e9", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmt2(c.sessions || 0)}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: 4, width: pct + "%", background: "#0ea5e9", borderRadius: 2, opacity: 0.6 + 0.4 * pct / 100 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources de trafic */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>🔗 Sources de trafic</div>
        <div style={{ display: "grid", gap: 7 }}>
          {topSources.map((s, i) => {
            const pct = Math.round(s.sessions / maxSrc * 100);
            const color = srcColor(s.medium);
            const medLabel = s.medium === "(none)" ? "direct" : s.medium === "organic" ? "organique" : s.medium;
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: "#e2e8f0" }}>{s.label} <span style={{ color: "#64748b", fontSize: 9 }}>/ {medLabel}</span></span>
                  <span style={{ color, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmt2(s.sessions)}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: 4, width: pct + "%", background: color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top pages */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden" }}>
        <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>📄 Pages les plus visitées</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)" }}>
              {["Page", "Sessions", "Visiteurs", "Durée moy."].map(h => (
                <th key={h} style={{ padding: "7px 14px", textAlign: "left", fontSize: 9, color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topPages.map((p, i) => {
              const pct = Math.round(p.sessions / maxPage * 100);
              // Détecter le type de page
              const isBien  = ["/amaryllis","/zandoli","/iguana","/geko","/mabouya","/schoelcher","/nogent"].some(b => p.path.startsWith(b));
              const isGuide = p.path.startsWith("/guide") || p.path.startsWith("/explorer") || p.path.startsWith("/activites");
              const isAdmin = p.path.startsWith("/admin");
              const badge = isBien ? { l: "Villa", c: "#10b981" } : isGuide ? { l: "Guide", c: "#6366f1" } : isAdmin ? { l: "Admin", c: "#f59e0b" } : { l: "Page", c: "#475569" };
              return (
                <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 8, padding: "2px 5px", borderRadius: 4, background: badge.c + "22", color: badge.c, fontWeight: 700, whiteSpace: "nowrap" }}>{badge.l}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{p.path.length > 40 ? p.path.slice(0,38) + "…" : p.path}</span>
                    </div>
                    <div style={{ height: 3, marginTop: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                      <div style={{ height: 3, width: pct + "%", background: badge.c, borderRadius: 2, opacity: 0.5 }} />
                    </div>
                  </td>
                  <td style={{ padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 12, color: "#0ea5e9", fontWeight: 600 }}>{fmt2(p.sessions)}</td>
                  <td style={{ padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 11, color: "#64748b" }}>{fmt2(p.users)}</td>
                  <td style={{ padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 11, color: "#64748b" }}>{fmtDur(p.duration)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// LIVRET QR CODES
// ============================================================================
function LivretQR({ biens, mob }) {
  const [copied, setCopied] = useState(null);
  const copyUrl = (id, url) => {
    navigator.clipboard.writeText(url).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); }).catch(() => {});
  };

  const LIVRET_ITEMS = biens.map(b => ({
    ...b,
    url: `https://villamaryllis.com/${b.id}`,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://villamaryllis.com/${b.id}`)}&color=e2e8f0&bgcolor=0f172a&margin=10`,
  }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>📱 QR Codes — Pages de réservation directe</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>À imprimer et déposer dans chaque logement. Le voyageur scanne → réserve directement sans commission.</div>
        </div>
        <button onClick={() => window.print()} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🖨 Imprimer tous</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
        {LIVRET_ITEMS.map(b => (
          <div key={b.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{b.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginBottom: 12 }}>{b.nom}</div>
            <img
              src={b.qrUrl}
              alt={`QR ${b.nom}`}
              loading="lazy"
              style={{ width: 160, height: 160, borderRadius: 10, display: "block", margin: "0 auto 10px", border: "1px solid rgba(255,255,255,0.06)" }}
            />
            <div style={{ fontSize: 9, color: "#475569", wordBreak: "break-all", marginBottom: 8, lineHeight: 1.4 }}>{b.url}</div>
            <button
              onClick={() => copyUrl(b.id, b.url)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 7, border: `1px solid ${copied === b.id ? "#10b981" : "rgba(255,255,255,0.1)"}`, background: copied === b.id ? "rgba(16,185,129,0.12)" : "transparent", color: copied === b.id ? "#10b981" : "#0ea5e9", fontSize: 10, fontWeight: 600, cursor: "pointer" }}
            >{copied === b.id ? "✓ Copié !" : "📋 Copier l'URL"}</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 10, padding: "10px 14px", fontSize: 11, color: "#94a3b8" }}>
        💡 <strong>Astuce :</strong> Imprimez le QR sur une carte plastifiée A5 ou un cadre photo et posez-le sur la table basse. "Réservez directement ici — sans frais de service" = +15% de marge sur les réservations directes.
      </div>
    </div>
  );
}

// ============================================================================
// TRAVAUX
// ============================================================================
const TRAVAUX_KEY = "amaryllis_travaux";
const TRAVAUX_PRIORITIES = ["urgent", "haute", "normale", "faible"];
const TRAVAUX_STATUSES   = ["todo", "en_cours", "done"];
const TRAVAUX_PRIO_COLORS  = { urgent: "#ef4444", haute: "#f59e0b", normale: "#0ea5e9", faible: "#64748b" };
const TRAVAUX_PRIO_LABELS  = { urgent: "🔴 Urgent", haute: "🟠 Haute", normale: "🔵 Normale", faible: "⚫ Faible" };
const TRAVAUX_STATUS_COLORS = { todo: "#64748b", en_cours: "#f59e0b", done: "#10b981" };
const TRAVAUX_STATUS_LABELS = { todo: "À faire", en_cours: "En cours", done: "Terminé" };

function Travaux({ biens, mob }) {
  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem(TRAVAUX_KEY) || "[]"); } catch { return []; } });
  const [filterBien,   setFilterBien]   = useState("all");
  const [filterPrio,   setFilterPrio]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const emptyForm = { bienId: biens[0]?.id || "", titre: "", description: "", priorite: "normale", status: "todo", dateCible: "", cout: "", tags: "" };
  const [form, setForm] = useState(emptyForm);

  const saveTasks = (list) => { setTasks(list); try { localStorage.setItem(TRAVAUX_KEY, JSON.stringify(list)); } catch {} };

  const submitForm = () => {
    if (!form.titre.trim()) return;
    if (editId !== null) {
      saveTasks(tasks.map(t => t.id === editId ? { ...t, ...form } : t));
    } else {
      saveTasks([...tasks, { ...form, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10) }]);
    }
    setShowForm(false); setEditId(null); setForm(emptyForm);
  };

  const delTask = (id) => saveTasks(tasks.filter(t => t.id !== id));
  const togStatus = (id) => saveTasks(tasks.map(t => t.id === id
    ? { ...t, status: t.status === "todo" ? "en_cours" : t.status === "en_cours" ? "done" : "todo" }
    : t));
  const openEdit = (t) => {
    setForm({ bienId: t.bienId, titre: t.titre, description: t.description || "", priorite: t.priorite, status: t.status, dateCible: t.dateCible || "", cout: t.cout || "", tags: t.tags || "" });
    setEditId(t.id); setShowForm(true);
  };

  const prioOrder = { urgent: 0, haute: 1, normale: 2, faible: 3 };
  const filtered = tasks
    .filter(t => filterBien   === "all" || t.bienId   === filterBien)
    .filter(t => filterPrio   === "all" || t.priorite === filterPrio)
    .filter(t => filterStatus === "all" || t.status   === filterStatus)
    .sort((a, b) => prioOrder[a.priorite] - prioOrder[b.priorite]);

  const stats     = { todo: tasks.filter(t => t.status === "todo").length, en_cours: tasks.filter(t => t.status === "en_cours").length, done: tasks.filter(t => t.status === "done").length };
  const totalCout = tasks.filter(t => t.status !== "done").reduce((s, t) => s + (parseFloat(t.cout) || 0), 0);

  return (
    <div>
      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "À faire",        value: stats.todo,                                         color: "#64748b" },
          { label: "En cours",       value: stats.en_cours,                                     color: "#f59e0b" },
          { label: "Terminés",       value: stats.done,                                         color: "#10b981" },
          { label: "Budget restant", value: totalCout > 0 ? `${totalCout.toFixed(0)} €` : "—", color: "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "var(--font-mono)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filtres + bouton ajouter ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <select value={filterBien} onChange={e => setFilterBien(e.target.value)} style={{ padding: "6px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 11, cursor: "pointer" }}>
          <option value="all">Tous les biens</option>
          {biens.map(b => <option key={b.id} value={b.id}>{b.emoji} {b.nom}</option>)}
        </select>
        <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)} style={{ padding: "6px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 11, cursor: "pointer" }}>
          <option value="all">Toutes priorités</option>
          {TRAVAUX_PRIORITIES.map(p => <option key={p} value={p}>{TRAVAUX_PRIO_LABELS[p]}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "6px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 11, cursor: "pointer" }}>
          <option value="all">Tous statuts</option>
          {TRAVAUX_STATUSES.map(s => <option key={s} value={s}>{TRAVAUX_STATUS_LABELS[s]}</option>)}
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Ajouter</button>
        </div>
      </div>

      {/* ── Liste ── */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#334155", fontSize: 13 }}>
          {tasks.length === 0 ? "Aucune tâche. Cliquez sur + Ajouter." : "Aucun résultat pour ces filtres."}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
        {filtered.map(t => {
          const bien = biens.find(b => b.id === t.bienId);
          const pc   = TRAVAUX_PRIO_COLORS[t.priorite];
          const sc   = TRAVAUX_STATUS_COLORS[t.status];
          const done = t.status === "done";
          return (
            <div key={t.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)"}`, borderLeft: `3px solid ${pc}`, borderRadius: 12, padding: 14, opacity: done ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: done ? "#64748b" : "#e2e8f0", textDecoration: done ? "line-through" : "none", wordBreak: "break-word" }}>{t.titre}</div>
                  {bien && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{bien.emoji} {bien.nom}</div>}
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                  <button onClick={() => togStatus(t.id)} title="Changer statut" style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${sc}33`, background: `${sc}18`, color: sc, fontSize: 9, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{TRAVAUX_STATUS_LABELS[t.status]}</button>
                  <button onClick={() => openEdit(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0ea5e9", fontSize: 13, padding: "2px 4px" }}>✎</button>
                  <button onClick={() => delTask(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 12, padding: "2px 4px" }}>✕</button>
                </div>
              </div>
              {t.description && <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, lineHeight: 1.4 }}>{t.description}</div>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: `${pc}18`, color: pc, fontWeight: 600 }}>{TRAVAUX_PRIO_LABELS[t.priorite]}</span>
                {t.dateCible && <span style={{ fontSize: 9, color: "#94a3b8" }}>📅 {t.dateCible}</span>}
                {t.cout      && <span style={{ fontSize: 9, color: "#f59e0b" }}>💰 {t.cout} €</span>}
                {t.tags && t.tags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => (
                  <span key={tag} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 5, background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>{tag}</span>
                ))}
                {t.createdAt && <span style={{ fontSize: 8, color: "#334155", marginLeft: "auto" }}>créé {t.createdAt}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal formulaire ── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={() => { setShowForm(false); setEditId(null); }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 22, width: "100%", maxWidth: 420, maxHeight: "calc(90vh - env(safe-area-inset-bottom))", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>{editId !== null ? "✎ Modifier la tâche" : "🔧 Nouvelle tâche"}</div>
            {[
              { l: "Logement",                  k: "bienId",      t: "select", opts: biens.map(b => ({ v: b.id, l: `${b.emoji} ${b.nom}` })) },
              { l: "Titre *",                   k: "titre",       t: "text",   ph: "Ex : Réparation robinet cuisine" },
              { l: "Description",               k: "description", t: "text",   ph: "Détails du problème…" },
              { l: "Priorité",                  k: "priorite",    t: "select", opts: TRAVAUX_PRIORITIES.map(p => ({ v: p, l: TRAVAUX_PRIO_LABELS[p] })) },
              { l: "Statut",                    k: "status",      t: "select", opts: TRAVAUX_STATUSES.map(s => ({ v: s, l: TRAVAUX_STATUS_LABELS[s] })) },
              { l: "Date cible",                k: "dateCible",   t: "date" },
              { l: "Coût estimé (€)",           k: "cout",        t: "number", ph: "0" },
              { l: "Tags (séparés par virgule)", k: "tags",        t: "text",   ph: "plomberie, urgent, cuisine" },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 9 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2, textTransform: "uppercase" }}>{f.l}</div>
                {f.t === "select" ? (
                  <select value={form[f.k]} onChange={e => setForm(x => ({ ...x, [f.k]: e.target.value }))} style={{ width: "100%", padding: "7px 9px", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12 }}>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : (
                  <input type={f.t} placeholder={f.ph || ""} value={form[f.k]} onChange={e => setForm(x => ({ ...x, [f.k]: e.target.value }))} style={{ width: "100%", padding: "7px 9px", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
              <button onClick={submitForm} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{editId !== null ? "Enregistrer" : "Ajouter"}</button>
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #334155", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// APP
// ============================================================================
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(PWD_KEY) === "ok");
  const [role,   setRole]   = useState(() => sessionStorage.getItem("admin_role") || "admin");
  const [tab, setTabRaw] = useState(() => { try { return localStorage.getItem("admin_tab") || "planning"; } catch { return "planning"; } });
  const setTab = useCallback((t) => { setTabRaw(t); try { localStorage.setItem("admin_tab", t); } catch {} }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [biens, setBiens] = useState([...SEED_BIENS]);
  const [n, setN] = useState(N);
  const [sync, setSync] = useState({ status: "idle", msg: "Données locales" });
  const [lastSync, setLastSync] = useState(null);
  const [lastSyncTs, setLastSyncTs] = useState(() => { try { const v = localStorage.getItem("last_sync_ts"); return v ? Number(v) : null; } catch { return null; } });
  const [scriptUrl, setScriptUrl] = useState(() => localStorage.getItem("sheets_script_url") || "");

  // Récupérer la config depuis Cloudflare au démarrage :
  // - Apps Script URL
  // - URLs iCal Airbnb (stockées en env var CF, jamais dans le bundle)
  useEffect(() => {
    fetch("/api/get-config")
      .then(r => r.json())
      .then(d => {
        if (d.scriptUrl && !scriptUrl) {
          setScriptUrl(d.scriptUrl);
          try { localStorage.setItem("sheets_script_url", d.scriptUrl); } catch {}
        }
        // Charger les URLs iCal Airbnb depuis l'env CF si disponibles
        if (d.icalAirbnb && Object.keys(d.icalAirbnb).length > 0) {
          setIcalUrls(prev => {
            // Les URLs saisies manuellement (localStorage) ont priorité sur les env vars
            const merged = { ...d.icalAirbnb, ...prev };
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [showScriptSetup, setShowScriptSetup] = useState(false);
  const [showPushSetup, setShowPushSetup] = useState(false);
  const [showRapport, setShowRapport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rapportMois, setRapportMois] = useState(() => new Date().getMonth());
  const [ntfyTopic, setNtfyTopic] = useState(() => localStorage.getItem("ntfy_topic") || "");
  const [hist, setHist] = useState(() => {
    try {
      const cached = localStorage.getItem("hist_v1");
      if (cached) {
        const parsed = JSON.parse(cached);
        // Fusionner avec HIST_SEED pour garantir toutes les années
        return { ...HIST_SEED, ...parsed };
      }
    } catch {}
    return HIST_SEED;
  });
  const [globalSyncStatus, setGlobalSyncStatus] = useState("idle"); // idle | syncing | ok | error
  const [reservations, setReservations] = useState(() => {
    try { const r = localStorage.getItem("reservations_v2"); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const [icalUrls, setIcalUrls] = useState(() => {
    try { const u = localStorage.getItem("ical_urls"); return u ? { ...ICAL_DEFAULTS, ...JSON.parse(u) } : { ...ICAL_DEFAULTS }; } catch { return { ...ICAL_DEFAULTS }; }
  });
  const [icalUrlsBooking, setIcalUrlsBooking] = useState(() => {
    try { const u = localStorage.getItem("ical_urls_booking"); return u ? JSON.parse(u) : {}; } catch { return {}; }
  });
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 640);

  // ── Toast system (App level) ──────────────────────────────────────────────
  const [resaToasts, setResaToasts] = useState([]);
  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setResaToasts(t => [...t, { id, msg, type }]);
    const delay = type === "error" ? 10000 : 6000;
    setTimeout(() => setResaToasts(t => t.filter(x => x.id !== id)), delay);
  }, []);

  // Charger les URLs Booking.com depuis Cloudflare si localStorage vide
  useEffect(() => {
    const hasUrls = Object.values(icalUrlsBooking).some(v => v && v.length > 10);
    if (!hasUrls) {
      fetch("/api/ical-config")
        .then(r => r.json())
        .then(d => {
          if (d.ok && d.booking) {
            const filled = Object.fromEntries(Object.entries(d.booking).filter(([, v]) => v));
            if (Object.keys(filled).length > 0) {
              setIcalUrlsBooking(prev => ({ ...filled, ...prev }));
              try { localStorage.setItem("ical_urls_booking", JSON.stringify({ ...filled, ...icalUrlsBooking })); } catch {}
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setMob(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const saveRes = useCallback((list) => {
    setReservations(list);
    try {
      localStorage.setItem("reservations_v2", JSON.stringify(list));
    } catch (e) {
      console.warn("[saveRes] localStorage quota dépassé ou indisponible :", e.message);
    }
  }, []);

  const saveUrls = useCallback((urls) => {
    setIcalUrls(urls);
    try { localStorage.setItem("ical_urls", JSON.stringify(urls)); } catch (e) {}
  }, []);
  const saveUrlsBooking = useCallback((urls) => {
    setIcalUrlsBooking(urls);
    try { localStorage.setItem("ical_urls_booking", JSON.stringify(urls)); } catch (e) {}
  }, []);

  const doSync = useCallback(async () => {
    if (!scriptUrl) { setShowScriptSetup(true); return; }
    setSync({ status: "loading", msg: "Connexion…" });
    try {
      const f = await syncFromSheets(biens, scriptUrl);
      setBiens(f.biens);
      setN(f.moisActifs || N);
      setLastSync(f.lastSync);
      const ts = Date.now(); setLastSyncTs(ts); try { localStorage.setItem("last_sync_ts", String(ts)); } catch {}
      // Mettre à jour hist depuis Sheets (années passées) + reconstruire l'année courante
      const currentYear = new Date().getFullYear();
      const currentYearData = {
        ...Object.fromEntries(f.biens.map(b => [b.id, b.revenus])),
        total: Array.from({ length: 12 }, (_, m) =>
          f.biens.reduce((s, b) => s + (b.revenus[m] || 0), 0)
        ),
      };
      setHist(prev => {
        const next = {
          ...prev,
          ...(f.hist && Object.keys(f.hist).length > 0 ? f.hist : {}),
          [currentYear]: currentYearData,
        };
        try { localStorage.setItem("hist_v1", JSON.stringify(next)); } catch {}
        return next;
      });
      // ── Restaurer les réservations manquantes depuis Sheets ──────
      // Si le localStorage a été vidé (autre appareil, cache effacé…),
      // les réservations sauvegardées dans l'onglet "réservations" du Sheets
      // sont fusionnées dans l'état local. Les réservations déjà présentes
      // ne sont jamais écrasées (on ne rajoute que celles qui manquent).
      if (f.reservations?.length > 0) {
        setReservations(current => {
          const currentIds = new Set(current.map(r => String(r.id)));
          const toRestore = f.reservations.filter(r => r.checkin && r.checkout && !currentIds.has(String(r.id)));
          if (toRestore.length === 0) return current;
          const merged = [...current, ...toRestore];
          try { localStorage.setItem("reservations_v2", JSON.stringify(merged)); } catch {}
          return merged;
        });
      }
      setSync({ status: "ok", msg: `✓ ${f.lastSync}` });
    } catch (e) {
      setSync({ status: "error", msg: `⚠ ${e.message}` });
    }
  }, [biens, scriptUrl]);

  // ── Sync global : iCal + Beds24 → Google Sheets ──────────────────
  const syncAllToSheets = useCallback(async () => {
    if (!scriptUrl) { alert("Configure d'abord l'URL Apps Script (bouton ⚙)"); return; }
    setGlobalSyncStatus("syncing");
    try {
      // 1. Réservations iCal existantes (toutes propriétés, tous canaux)
      const icalResas = reservations.map(r => ({
        id:        r.id,
        bienId:    r.bienId,
        voyageur:  r.voyageur || "—",
        canal:     r.canal,
        checkin:   r.checkin,
        checkout:  r.checkout,
        nights:    (() => { if (!r.checkin || !r.checkout) return 0; const a = new Date(r.checkin+"T12:00:00Z"), b = new Date(r.checkout+"T12:00:00Z"); return Math.round((b-a)/86400000); })(),
        montant:   r.montant || 0,
        nb_guests: r.nb_guests || 1,
        notes:     r.notes || "",
        source:    r.canal,
        status:    "Confirmé",
      }));

      // 2. Beds24 Nogent (fetch frais depuis l'API)
      let beds24Resas = [];
      try {
        const b24 = await fetch("/api/beds24-bookings");
        if (b24.ok) {
          const b24data = await b24.json();
          beds24Resas = (b24data.bookings || []).map(b => ({
            id:        "beds24-" + b.bookingId,
            bienId:    "nogent",
            voyageur:  b.guestName,
            canal:     b.channelLabel || b.channel || "Beds24",
            checkin:   b.arrival,
            checkout:  b.departure,
            nights:    b.nights,
            montant:   b.price,
            nb_guests: b.numGuests,
            notes:     b.notes || "",
            source:    "Beds24",
            status:    b.statusLabel,
          }));
        }
      } catch (_) {}

      // 3. Fusionner (Beds24 remplace iCal pour Nogent)
      const allResas = [
        ...icalResas.filter(r => r.bienId !== "nogent"), // autres propriétés via iCal
        ...beds24Resas,                                   // Nogent via Beds24
      ];

      // 4. Envoyer via proxy CF (évite CORS browser → Apps Script)
      const res = await fetch("/api/sheets-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Script-Url": scriptUrl },
        body: JSON.stringify({ action: "importAllReservations", reservations: allResas }),
      });
      const data = await res.json();
      setGlobalSyncStatus(data.ok ? "ok" : "error");
      // Reset après 5s
      setTimeout(() => setGlobalSyncStatus("idle"), 5000);
    } catch (e) {
      console.error("syncAllToSheets:", e);
      setGlobalSyncStatus("error");
      setTimeout(() => setGlobalSyncStatus("idle"), 5000);
    }
  }, [scriptUrl, reservations]);

  const onUpdateRevenu = useCallback(async (bienId, month, value) => {
    setBiens(prev => prev.map(b => b.id === bienId
      ? { ...b, revenus: b.revenus.map((r, i) => i === month - 1 ? value : r) }
      : b
    ));
    if (scriptUrl) {
      const p = new URLSearchParams({ action: "updateRevenu", bienId, month: String(month), value: String(value) });
      fetch(`${scriptUrl}?${p}`, { redirect: "follow" }).catch(() => {});
    }
  }, [scriptUrl]);

  const onApplyRevenusFromResas = useCallback((map) => {
    if (!map || Object.keys(map).length === 0) return;
    setBiens(prev => prev.map(b => {
      const computed = map[b.id];
      if (!computed) return b;
      const revenus = b.revenus.map((existing, i) => computed[i] > 0 ? computed[i] : existing);
      return { ...b, revenus };
    }));
  }, []);

  const pushReservationsToScript = useCallback((resas) => {
    if (!scriptUrl || !resas || !resas.length) return;
    const min = resas.map(r => ({ id: r.id, bienId: r.bienId, voyageur: r.voyageur, canal: r.canal, checkin: r.checkin, checkout: r.checkout, checkin_time: r.checkin_time || "", nb_guests: r.nb_guests || 0, phone: r.phone || "" }));
    const p = new URLSearchParams({ action: "syncReservations", data: JSON.stringify(min) });
    fetch(`${scriptUrl}?${p}`, { redirect: "follow" }).catch(() => {});
  }, [scriptUrl]);

  if (!authed) return <PasswordGate onAuth={(r) => { setAuthed(true); setRole(r || "admin"); }} />;

  const ytd = biens.reduce((s, b) => s + sumN(b.revenus, n), 0);
  const cf = biens.reduce((s, b) => s + sumN(b.cashflow, n), 0);

  // Alertes pour badges sur onglets
  const today = todayStr();
  const tomorrow = addDays(today, 1);
  const planningAlerts = reservations.filter(r => {
    const b = biens.find(x => x.id === r.bienId);
    if (!b) return false;
    return r.checkin === today || r.checkin === tomorrow || r.checkout === today ||
      (r.checkout <= today && r.checkout >= addDays(today, -7) && !r.menage_done);
  }).length;

  const biensByCf = biens.filter(b => {
    const cfVal = sumN(b.cashflow, n);
    return cfVal < 0;
  });
  const cockpitAlerts = biensByCf.length;

  const menageBadge = (() => { const today = new Date(); today.setHours(0,0,0,0); return reservations.filter(r => { const co = new Date(r.checkout + "T12:00:00"); co.setHours(0,0,0,0); return co >= today && co <= new Date(today.getTime()+21*86400000) && !r.menage_done; }).length; })();

  const NAV_GROUPS = [
    {
      id: "ops", label: "Opérations",
      items: [
        { id: "planning",      icon: "📅", label: "Planning",    badge: planningAlerts > 0 ? planningAlerts : null, badgeColor: "#f59e0b" },
        { id: "menage",        icon: "🧹", label: "Ménage",      badge: menageBadge > 0    ? menageBadge : null,   badgeColor: "#f59e0b" },
        { id: "prestataires",  icon: "👷", label: "Prestataires" },
        { id: "messages",      icon: "💬", label: "Messages" },
        { id: "emails",        icon: "📧", label: "Emails" },
      ],
    },
    {
      id: "dashboard", label: "Tableau de bord",
      items: [
        { id: "cockpit",     icon: "🎯", label: "Cockpit",     badge: cockpitAlerts > 0 ? "⚠" : null, badgeColor: "#ef4444" },
        { id: "revenue",     icon: "💡", label: "Revenue Mgr" },
        { id: "tarifs",      icon: "🏷️", label: "Tarifs" },
      ],
    },
    {
      id: "analyses", label: "Analyses",
      items: [
        { id: "previsionnel",icon: "🔮", label: "Prévisionnel" },
        { id: "historique",  icon: "📈", label: "Historique" },
        { id: "analytics",   icon: "📊", label: "Analytics" },
      ],
    },
    {
      id: "finance", label: "Finance",
      items: [
        { id: "charges",     icon: "💰", label: "Charges" },
        { id: "pilotage",    icon: "💼", label: "Pilotage" },
        { id: "cautions",    icon: "🔒", label: "Cautions" },
      ],
    },
    {
      id: "tools", label: "Outils",
      items: [
        { id: "travaux",     icon: "🔧", label: "Travaux",    badge: (() => { try { const n = JSON.parse(localStorage.getItem(TRAVAUX_KEY)||"[]").filter(t => t.status !== "done" && t.priorite === "urgent").length; return n > 0 ? n : null; } catch { return null; } })(), badgeColor: "#ef4444" },
        { id: "devis",       icon: "📋", label: "Devis" },
        { id: "livrets",     icon: "📱", label: "QR / Livrets" },
        { id: "guides",      icon: "📖", label: "Guides" },
        { id: "cartographie", icon: "🗺️", label: "Cartographie", href: "/cartographie.html" },
      ],
    },
    {
      id: "ia", label: "Intelligence Artificielle",
      items: [
        { id: "chat-admin", icon: "✨", label: "Assistant IA" },
      ],
    },
    {
      id: "equipe", label: "Équipe",
      items: [
        { id: "agents", icon: "🤖", label: "Agents", badge: null },
      ],
    },
  ];

  // Filtrer la nav selon le rôle (ménage = planning + ménage uniquement)
  const MENAGE_TABS = new Set(["planning", "menage"]);
  const visibleGroups = role === "menage"
    ? [{ id: "ops", label: "Opérations", items: NAV_GROUPS[0].items.filter(i => MENAGE_TABS.has(i.id)) }]
    : NAV_GROUPS;

  const allNavItems = visibleGroups.flatMap(g => g.items);
  const currentNavItem = allNavItems.find(i => i.id === tab);

  /* ── boutons d'action communs (sync, settings…) ── */
  const ActionBtns = () => {
    // Badge source de données
    const srcConfig = {
      idle:    { label: "💾 Seed local", bg: "rgba(100,116,139,0.18)", color: "#94a3b8", border: "rgba(100,116,139,0.3)" },
      loading: { label: "⟳ Chargement…", bg: "rgba(14,165,233,0.12)", color: "#38bdf8", border: "rgba(14,165,233,0.35)" },
      ok:      { label: "📊 Google Sheets", bg: "rgba(16,185,129,0.12)", color: "#10b981", border: "rgba(16,185,129,0.35)" },
      error:   { label: "⚠ Seed local", bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.35)" },
    }[sync.status] || { label: "💾 Seed local", bg: "rgba(100,116,139,0.18)", color: "#94a3b8", border: "rgba(100,116,139,0.3)" };
    const syncAge = lastSyncTs ? Math.floor((Date.now() - lastSyncTs) / 60000) : null; // minutes
    const syncTooltip = lastSyncTs
      ? `Dernière sync : ${new Date(lastSyncTs).toLocaleString("fr-FR")}${sync.status === "error" ? `\n⚠ ${sync.msg}` : ""}`
      : "Jamais synchronisé — données issues du seed local";
    return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {/* Badge source */}
      <span
        title={syncTooltip}
        style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: srcConfig.bg, color: srcConfig.color, border: `1px solid ${srcConfig.border}`, cursor: "help", whiteSpace: "nowrap" }}
      >
        {srcConfig.label}
        {sync.status === "ok" && syncAge !== null && <span style={{ opacity: 0.7, fontWeight: 400 }}> · {syncAge < 60 ? `${syncAge}min` : `${Math.floor(syncAge/60)}h`}</span>}
      </span>
      {/* Avertissement données vieilles */}
      {sync.status === "ok" && lastSyncTs && (Date.now() - lastSyncTs) > 6 * 3600000 && (
        <span title={syncTooltip} style={{ fontSize: 9, color: "#f59e0b", cursor: "help" }}>⚠ {Math.floor((Date.now()-lastSyncTs)/3600000)}h</span>
      )}
      <span style={{ fontSize: 11, fontWeight: 700, color: "#0ea5e9", fontFamily: "var(--font-mono)" }}>{fmtK(ytd)}</span>
      <button onClick={doSync} disabled={sync.status === "loading"} title="Recharger depuis Google Sheets" style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid #0ea5e9", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{sync.status === "loading" ? "⟳…" : "⟳ Actualiser"}</button>
      <button onClick={() => setShowScriptSetup(true)} title="Configurer Apps Script" style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: scriptUrl ? "#10b981" : "#64748b", fontSize: 10, cursor: "pointer" }}>{scriptUrl ? "⚙✓" : "⚙"}</button>
      <button onClick={syncAllToSheets} disabled={globalSyncStatus === "syncing"} title="Sync Sheets" style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.4)", background: globalSyncStatus === "ok" ? "rgba(16,185,129,0.2)" : globalSyncStatus === "error" ? "rgba(239,68,68,0.15)" : "transparent", color: globalSyncStatus === "ok" ? "#10b981" : globalSyncStatus === "error" ? "#f87171" : "#64748b", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>{globalSyncStatus === "syncing" ? "⟳…" : globalSyncStatus === "ok" ? "📊✓" : globalSyncStatus === "error" ? "📊✗" : "📊"}</button>
      <button onClick={() => setShowPushSetup(true)} title="Notifications push" style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: ntfyTopic ? "#f59e0b" : "#64748b", fontSize: 10, cursor: "pointer" }}>{ntfyTopic ? "🔔" : "🔕"}</button>
      <button onClick={() => setShowRapport(true)} title="Rapport mensuel" style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#475569", fontSize: 10, cursor: "pointer" }}>📄</button>
      <button onClick={() => {
        const year = new Date().getFullYear();
        const rows = [["Bien","Voyageur","Canal","Checkin","Checkout","Nuits","Montant €","Notes"]];
        const resas = reservations.filter(r => r.checkin && r.checkin.startsWith(String(year)));
        resas.sort((a, b) => a.checkin.localeCompare(b.checkin)).forEach(r => {
          const b = biens.find(x => x.id === r.bienId);
          const nuits = r.checkin && r.checkout ? Math.round((new Date(r.checkout+"T12:00:00Z") - new Date(r.checkin+"T12:00:00Z")) / 86400000) : "";
          rows.push([b?.nom || r.bienId, r.voyageur || "", r.canal || "", r.checkin || "", r.checkout || "", nuits, r.montant || 0, (r.notes || "").replace(/,/g, " ")]);
        });
        const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        const a = document.createElement("a"); a.href = url; a.download = `reservations_${year}.csv`; a.click(); URL.revokeObjectURL(url);
      }} title={`Exporter réservations ${new Date().getFullYear()} CSV`} style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#475569", fontSize: 10, cursor: "pointer" }}>📥</button>
      <a href="/" target="_blank" rel="noopener noreferrer" title="Site public" style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#475569", fontSize: 10, cursor: "pointer", textDecoration: "none" }}>🌐</a>
      {role === "menage" && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontWeight: 600 }}>🧹 Ménage</span>}
      <button onClick={() => { sessionStorage.removeItem(PWD_KEY); sessionStorage.removeItem("admin_role"); setAuthed(false); setRole("admin"); }} title="Déconnexion" style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#475569", fontSize: 10, cursor: "pointer" }}>🔒</button>
    </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "system-ui,sans-serif", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>

      <TodayBanner biens={biens} n={n} reservations={reservations} onTab={setTab} mob={mob} />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ══ SIDEBAR ════════════════════════════════════════════ */}
        {/* Overlay mobile */}
        {mob && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }} />
        )}

        <aside style={{
          width: 236, flexShrink: 0,
          background: "#080d1a",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
          ...(mob ? {
            position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform .22s ease",
            overflowY: "auto",
          } : {
            position: "sticky", top: 0, height: "100vh", overflowY: "auto",
          }),
        }}>
          {/* Logo */}
          <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: -.3 }}>🏠 Dashboard</div>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>Amaryllis Locations</div>
            </div>
            {mob && <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: "#475569", fontSize: 18, cursor: "pointer", padding: "0 4px" }}>✕</button>}
          </div>

          {/* Groupes de navigation */}
          <nav style={{ flex: 1, padding: "6px 0 16px" }}>
            {visibleGroups.map((group, gi) => (
              <div key={group.id} style={{ marginTop: gi === 0 ? 10 : 4 }}>
                {/* Header de groupe */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 16px 4px",
                  margin: gi === 0 ? 0 : "8px 0 0",
                }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{group.label}</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                </div>
                {/* Items */}
                {group.items.map(item => {
                  const active = tab === item.id;
                  const navStyle = {
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 16px",
                    background: active ? "rgba(14,165,233,0.1)" : "none",
                    border: "none", borderLeft: `3px solid ${active ? "#0ea5e9" : "transparent"}`,
                    cursor: "pointer", textAlign: "left",
                    color: active ? "#e0f2fe" : item.badgeColor && item.badge ? item.badgeColor : "#64748b",
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    transition: "background .1s, color .1s",
                    textDecoration: "none",
                  };
                  const navContent = (
                    <>
                      <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0, opacity: active ? 1 : 0.75 }}>{item.icon}</span>
                      <span style={{ flex: 1, fontSize: 13 }}>{item.label}</span>
                      {item.href && <span style={{ fontSize: 9, opacity: 0.35 }}>↗</span>}
                      {item.badge && (
                        <span style={{ background: item.badgeColor, color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 10, padding: "1px 5px", minWidth: 16, textAlign: "center" }}>{item.badge}</span>
                      )}
                    </>
                  );
                  return item.href ? (
                    <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" style={navStyle}>
                      {navContent}
                    </a>
                  ) : (
                    <button key={item.id} onClick={() => { setTab(item.id); if (mob) setSidebarOpen(false); }} style={navStyle}>
                      {navContent}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Actions en bas de la sidebar */}
          {!mob && (
            <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <ActionBtns />
            </div>
          )}
        </aside>

        {/* ══ CONTENU PRINCIPAL ═════════════════════════════════ */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Topbar mobile */}
          {mob && (
            <div style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 20 }}>
              <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, padding: "5px 9px", color: "#94a3b8", fontSize: 14, cursor: "pointer" }}>☰</button>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", flex: 1 }}>
                {currentNavItem ? `${currentNavItem.icon} ${currentNavItem.label}` : "Dashboard"}
              </span>
              <ActionBtns />
            </div>
          )}

          {/* Contenu de l'onglet */}
          <div style={{ padding: mob ? "12px" : "18px 24px", flex: 1, paddingBottom: "calc(76px + env(safe-area-inset-bottom))" }}>
            {tab === "planning" && <Planning biens={biens} mob={mob} reservations={reservations} saveRes={saveRes} icalUrls={icalUrls} saveUrls={saveUrls} icalUrlsBooking={icalUrlsBooking} saveUrlsBooking={saveUrlsBooking} scriptUrl={scriptUrl} onApplyRevenusFromResas={onApplyRevenusFromResas} pushReservationsToScript={pushReservationsToScript} />}
            {tab === "cockpit" && <Cockpit biens={biens} n={n} mob={mob} onUpdateRevenu={onUpdateRevenu} reservations={reservations} />}
            {tab === "previsionnel" && <Previsionnel biens={biens} n={n} mob={mob} hist={hist} />}
            {tab === "charges" && <Charges biens={biens} n={n} mob={mob} />}
            {tab === "pilotage" && <Pilotage biens={biens} n={n} mob={mob} reservations={reservations} />}
            {tab === "historique" && <Historique biens={biens} n={n} mob={mob} hist={hist} />}
            {tab === "revenue"  && <RevenueManagerPro biens={biens} reservations={reservations} mob={mob} />}
            {tab === "tarifs" && <Tarifs reservations={reservations} />}
            {tab === "analytics" && <AnalyticsTab mob={mob} />}
            {tab === "menage"         && <MenageTab biens={biens} reservations={reservations} saveRes={saveRes} mob={mob} />}
            {tab === "prestataires"   && <Prestataires biens={biens} mob={mob} />}
            {tab === "messages" && <MessageTemplates biens={biens} reservations={reservations} mob={mob} />}
            {tab === "emails" && <EmailSync mob={mob} />}
            {tab === "cautions" && <Cautions />}
            {tab === "travaux"  && <Travaux biens={biens} mob={mob} />}
            {tab === "livrets"  && <LivretEditor />}
            {tab === "devis"    && <DevisEditor />}
            {tab === "guides" && <GuideEditor mob={mob} />}
            {tab === "agents" && <AgentsKanban mob={mob} />}
            {tab === "chat-admin" && <LocalErrorBoundary><AdminChatTab biens={biens} reservations={reservations} addToast={addToast} /></LocalErrorBoundary>}
          </div>
        </div>
      </div>

      <FAB onTab={setTab} />

      <div style={{ padding: "8px 22px", borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: 9, color: "#334155", textAlign: "center" }}>
        Locatif Dashboard · {lastSync ? "Synchro : " + lastSync : "Non synchronisé"}
      </div>

      {/* ── Toast stack global App ── */}
      {resaToasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column-reverse", gap: 8, maxWidth: 360 }}>
          {resaToasts.map(t => {
            const colors = {
              success: { border: "#22c55e", icon: "✓", accent: "#22c55e" },
              error:   { border: "#ef4444", icon: "✕", accent: "#f87171" },
              info:    { border: "#0ea5e9", icon: "🔔", accent: "#38bdf8" },
            }[t.type] || { border: "#0ea5e9", icon: "🔔", accent: "#38bdf8" };
            return (
              <div key={t.id} style={{
                background: "#0f172a", border: `1px solid ${colors.border}44`,
                borderLeft: `3px solid ${colors.border}`,
                borderRadius: 10, padding: "11px 14px",
                color: "#e2e8f0", fontSize: 12.5, fontWeight: 500,
                boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <span style={{ fontSize: 14, color: colors.accent, flexShrink: 0, marginTop: 1 }}>{colors.icon}</span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{t.msg}</span>
                <button onClick={() => setResaToasts(x => x.filter(r => r.id !== t.id))}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {showRapport && (() => {
        const moisLabel = MOIS[rapportMois] || "";
        const yr = new Date().getFullYear();
        const resas = reservations.filter(r => r.checkin && r.checkin.startsWith(`${yr}-${String(rapportMois + 1).padStart(2, "0")}`));
        const rapportBiens = biens.map(b => {
          const rev = b.revenus[rapportMois] || 0;
          const occ = b.occ[rapportMois] || 0;
          const adr = b.adr[rapportMois] || 0;
          const cf = b.cashflow[rapportMois] || 0;
          const resasBien = resas.filter(r => r.bienId === b.id);
          return { ...b, rev, occ, adr, cf, nbResas: resasBien.length, nbNuits: resasBien.reduce((s, r) => { if (!r.checkin || !r.checkout) return s; return s + Math.round((new Date(r.checkout+"T12:00:00Z") - new Date(r.checkin+"T12:00:00Z")) / 86400000); }, 0) };
        });
        const totalRev = rapportBiens.reduce((s, b) => s + b.rev, 0);
        const totalCf = rapportBiens.reduce((s, b) => s + b.cf, 0);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowRapport(false)}>
            <div id="rapport-content" style={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 24, maxWidth: 680, width: "100%", maxHeight: "calc(92vh - env(safe-area-inset-bottom))", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>📄 Rapport mensuel</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Locatif · Villa Maryllis</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select value={rapportMois} onChange={e => setRapportMois(Number(e.target.value))} style={{ padding: "5px 8px", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 11 }}>
                    {MOIS.map((m, i) => <option key={i} value={i}>{m} {yr}</option>)}
                  </select>
                  <button
  onClick={() => {
    const lignes = rapportBiens.filter(b => b.rev > 0).map(b =>
      `${b.emoji} ${b.nom.replace("Villa ","").replace("T2 ","")} : ${fmt(b.rev)} CA · ${b.occ.toFixed(0)}% occ · CF ${b.cf >= 0 ? "+" : ""}${fmt(b.cf)}`
    );
    const texte = [
      `📊 Rapport ${moisLabel} ${yr} — Amaryllis Locations`,
      ``,
      `CA total : ${fmt(totalRev)}`,
      `Cashflow net : ${totalCf >= 0 ? "+" : ""}${fmt(totalCf)}`,
      `Réservations : ${resas.length}`,
      ``,
      ...lignes,
      ``,
      `Généré le ${new Date().toLocaleDateString("fr-FR")} · villamaryllis.com`,
    ].join("\n");
    navigator.clipboard.writeText(texte).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }}
  style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #334155", background: copied ? "rgba(16,185,129,0.15)" : "transparent", color: copied ? "#10b981" : "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
>
  {copied ? "✓ Copié !" : "📋 Copier"}
</button>
                  <button onClick={() => { window.print(); }} style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>🖨 Imprimer / PDF</button>
                  <button onClick={() => setShowRapport(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 18, lineHeight: 1 }}>✕</button>
                </div>
              </div>
              <div style={{ background: "linear-gradient(135deg,rgba(14,165,233,0.1),rgba(99,102,241,0.06))", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "CA " + moisLabel, value: fmt(totalRev), color: "#0ea5e9" },
                  { label: "Cashflow net", value: (totalCf >= 0 ? "+" : "") + fmt(totalCf), color: totalCf >= 0 ? "#10b981" : "#ef4444" },
                  { label: "Réservations", value: resas.length, color: "#f59e0b" },
                ].map(k => (
                  <div key={k.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: "var(--font-mono)" }}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ overflowX: "auto", marginBottom: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                      {["Logement","CA","Occ.","ADR","CF","Rés.","Nuits"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: h === "Logement" ? "left" : "right", fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rapportBiens.map(b => (
                      <tr key={b.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "9px 10px", fontSize: 11, color: "#e2e8f0" }}>{b.emoji} {b.nom}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, color: "#0ea5e9", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmt(b.rev)}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, color: b.occ >= 60 ? "#10b981" : b.occ >= 30 ? "#f59e0b" : "#ef4444", fontFamily: "var(--font-mono)" }}>{b.occ.toFixed(0)}%</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{b.adr.toFixed(0)} €</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, color: b.cf >= 0 ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)" }}>{b.cf >= 0 ? "+" : ""}{fmt(b.cf)}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, color: "#94a3b8" }}>{b.nbResas}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, color: "#94a3b8" }}>{b.nbNuits}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", fontWeight: 700 }}>
                      <td style={{ padding: "9px 10px", fontSize: 11, color: "#e2e8f0" }}>TOTAL</td>
                      <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 12, color: "#0ea5e9", fontFamily: "var(--font-mono)", fontWeight: 800 }}>{fmt(totalRev)}</td>
                      <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, color: "#94a3b8" }}>—</td>
                      <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, color: "#94a3b8" }}>—</td>
                      <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 12, color: totalCf >= 0 ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)", fontWeight: 800 }}>{totalCf >= 0 ? "+" : ""}{fmt(totalCf)}</td>
                      <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, color: "#94a3b8" }}>{resas.length}</td>
                      <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, color: "#94a3b8" }}>{rapportBiens.reduce((s, b) => s + b.nbNuits, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {resas.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Détail des réservations</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {resas.map(r => {
                      const b = biens.find(x => x.id === r.bienId);
                      const nuits = r.checkin && r.checkout ? Math.round((new Date(r.checkout+"T12:00:00Z") - new Date(r.checkin+"T12:00:00Z")) / 86400000) : "?";
                      return (
                        <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 7, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{r.checkin} → {r.checkout}</span>
                          <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>{r.voyageur || "—"}</span>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: CB[r.canal] || "#334155", color: CC[r.canal] || "#94a3b8", fontWeight: 600 }}>{r.canal}</span>
                          <span style={{ fontSize: 10, color: "#64748b" }}>{b?.emoji} {b?.nom?.replace("Villa ", "")}</span>
                          <span style={{ fontSize: 11, color: "#f59e0b", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>{nuits}n · {fmt(r.montant || 0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 16, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: 9, color: "#334155", textAlign: "center" }}>
                Rapport généré le {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · Locatif Dashboard villamaryllis.com
              </div>
            </div>
          </div>
        );
      })()}

      {showPushSetup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowPushSetup(false)}>
          <div style={{ background: "#1e293b", borderRadius: 14, padding: 24, maxWidth: 480, width: "100%", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "calc(90vh - env(safe-area-inset-bottom))", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🔔 Notifications push</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Alerte sur ton téléphone même app fermée — via ntfy.sh (gratuit, sans compte).</div>

            <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, fontSize: 10, color: "#94a3b8", marginBottom: 16, lineHeight: 1.8 }}>
              <b style={{ color: "#e2e8f0" }}>1.</b> Choisis un nom de topic secret ci-dessous (ex: <code style={{ color: "#f59e0b" }}>amaryllis-{Math.random().toString(36).slice(2,8)}</code>)<br />
              <b style={{ color: "#e2e8f0" }}>2.</b> Clique <b style={{ color: "#0ea5e9" }}>S'abonner</b> → autorise les notifications dans le navigateur<br />
              <b style={{ color: "#e2e8f0" }}>3.</b> Sur iPhone : installe l'app <b>ntfy</b> (App Store) et abonne-toi au même topic<br />
              <b style={{ color: "#e2e8f0" }}>4.</b> Enregistre → le Apps Script enverra le push chaque matin
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="ex: amaryllis-mon-topic-secret"
                value={ntfyTopic}
                onChange={e => setNtfyTopic(e.target.value)}
                style={{ flex: 1, padding: "9px 11px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, boxSizing: "border-box" }}
              />
              <button
                onClick={() => { if (ntfyTopic) window.open(`https://ntfy.sh/${ntfyTopic}`, "_blank"); }}
                disabled={!ntfyTopic}
                style={{ padding: "9px 12px", borderRadius: 7, border: "none", background: ntfyTopic ? "#f59e0b" : "#334155", color: ntfyTopic ? "#000" : "#64748b", cursor: ntfyTopic ? "pointer" : "default", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}
              >S'abonner</button>
            </div>

            {ntfyTopic && (
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 10, color: "#f59e0b", marginBottom: 12 }}>
                Topic actif : <code>{ntfyTopic}</code> · Les alertes seront envoyées via ce canal.
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowPushSetup(false)} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Annuler</button>
              <button
                onClick={() => {
                  const t = ntfyTopic.trim();
                  localStorage.setItem("ntfy_topic", t);
                  setNtfyTopic(t);
                  if (scriptUrl && t) {
                    fetch(`${scriptUrl}?action=setNtfyTopic&topic=${encodeURIComponent(t)}`, { redirect: "follow" }).catch(() => {});
                  }
                  setShowPushSetup(false);
                }}
                style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: "#f59e0b", color: "#000", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {showScriptSetup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowScriptSetup(false)}>
          <div style={{ background: "#1e293b", borderRadius: 14, padding: 24, maxWidth: 540, width: "100%", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "calc(90vh - env(safe-area-inset-bottom))", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>⚙ Configurer la sync Google Sheets</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Une seule configuration requise — prend 2 min.</div>

            <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, fontSize: 10, color: "#94a3b8", marginBottom: 16, lineHeight: 1.7 }}>
              <b style={{ color: "#e2e8f0" }}>Étapes :</b><br />
              1. Ouvrir le Google Sheet → <b style={{ color: "#0ea5e9" }}>Extensions &gt; Apps Script</b><br />
              2. Remplacer tout le code par le script (dans le fichier <code style={{ color: "#f59e0b" }}>SCRIPT_SHEETS.gs</code> à la racine du projet)<br />
              3. Cliquer <b style={{ color: "#0ea5e9" }}>Déployer &gt; Nouveau déploiement</b><br />
              4. Type : <b>Application Web</b> · Exécuter en tant que : <b>Moi</b> · Accès : <b style={{ color: "#f59e0b" }}>Tout le monde</b> (⚠ pas "avec un compte Google")<br />
              5. Copier l'URL de déploiement ci-dessous
            </div>

            <input
              type="text"
              placeholder="https://script.google.com/macros/s/…/exec"
              value={scriptUrl}
              onChange={e => setScriptUrl(e.target.value)}
              style={{ width: "100%", padding: "9px 11px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, boxSizing: "border-box", marginBottom: 12 }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowScriptSetup(false)} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Annuler</button>
              <button
                onClick={() => {
                  const url = scriptUrl.trim();
                  if (url) {
                    localStorage.setItem("sheets_script_url", url);
                    setScriptUrl(url);
                    setShowScriptSetup(false);
                    setSync({ status: "idle", msg: "URL configurée — cliquez Sync" });
                  }
                }}
                style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: "#0ea5e9", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >Enregistrer</button>
            </div>

            {/* ── Accès Ménage ── */}
            <div style={{ marginTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>🧹 Accès Ménage (prestataire)</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Mot de passe donnant accès à Planning + Ménage uniquement — sans les données financières.</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>Le mot de passe ménage est configuré côté serveur via la variable <code style={{ background: "#0f172a", padding: "1px 5px", borderRadius: 4, color: "#94a3b8" }}>ADMIN_PWD_MENAGE</code> dans Cloudflare Pages.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cautions (dépôts de garantie pré-autorisés) ────────────────────────────

const BIENS_CAUTION = [
  { id: "amaryllis",  nom: "Villa Amaryllis",     depot: 1500 },
  { id: "zandoli",    nom: "Zandoli",              depot: 700  },
  { id: "iguana",     nom: "Villa Iguana",         depot: 500  },
  { id: "geko",       nom: "Géko",                depot: 500  },
  { id: "mabouya",    nom: "Mabouya",              depot: 500  },
  { id: "schoelcher", nom: "Bellevue Schœlcher",   depot: 1000 },
  { id: "nogent",     nom: "Appartement Nogent",   depot: 500  },
];

// ── Carnet prestataires ───────────────────────────────────────────────────────
const PRESTATAIRES_KEY = "amaryllis_prestataires_v1";
const PREST_CATEGORIES = [
  { id: "menage",      label: "Ménage",       icon: "🧹" },
  { id: "plomberie",   label: "Plomberie",    icon: "🔧" },
  { id: "electricite", label: "Électricité",  icon: "⚡" },
  { id: "jardinage",   label: "Jardinage",    icon: "🌿" },
  { id: "piscine",     label: "Piscine",      icon: "🏊" },
  { id: "serrurerie",  label: "Serrurerie",   icon: "🔑" },
  { id: "peinture",    label: "Peinture",     icon: "🎨" },
  { id: "autre",       label: "Autre",        icon: "📌" },
];
const PREST_BIEN_LABELS = { amaryllis: "Villa Amaryllis", geko: "Géko", mabouya: "Mabouya", zandoli: "Zandoli", schoelcher: "Schœlcher", iguana: "Villa Iguana", nogent: "Nogent" };

function Prestataires({ biens }) {
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PRESTATAIRES_KEY) || "[]"); } catch { return []; }
  });
  const [form, setForm] = useState({ nom: "", tel: "", email: "", categorie: "menage", biens: [], notes: "" });
  const [editing, setEditing] = useState(null); // id en cours de modification
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterBien, setFilterBien] = useState("all");

  const save = (list) => {
    setContacts(list);
    try { localStorage.setItem(PRESTATAIRES_KEY, JSON.stringify(list)); } catch {}
  };

  const submit = () => {
    if (!form.nom.trim()) return;
    if (editing !== null) {
      save(contacts.map(c => c.id === editing ? { ...c, ...form } : c));
      setEditing(null);
    } else {
      save([...contacts, { ...form, id: Date.now(), createdAt: new Date().toISOString() }]);
    }
    setForm({ nom: "", tel: "", email: "", categorie: "menage", biens: [], notes: "" });
    setShowForm(false);
  };

  const edit = (c) => {
    setForm({ nom: c.nom, tel: c.tel || "", email: c.email || "", categorie: c.categorie, biens: c.biens || [], notes: c.notes || "" });
    setEditing(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = (id) => {
    if (!confirm("Supprimer ce contact ?")) return;
    save(contacts.filter(c => c.id !== id));
  };

  const toggleBien = (bienId) => {
    setForm(f => ({
      ...f,
      biens: f.biens.includes(bienId) ? f.biens.filter(b => b !== bienId) : [...f.biens, bienId],
    }));
  };

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.nom.toLowerCase().includes(search.toLowerCase()) || (c.tel || "").includes(search) || (c.notes || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || c.categorie === filterCat;
    const matchBien = filterBien === "all" || (c.biens || []).includes(filterBien);
    return matchSearch && matchCat && matchBien;
  });

  const MUTED = "var(--admin-muted)";
  const CARD_BG = "var(--admin-card)";
  const BORDER = "var(--admin-border)";

  const inputS = {
    background: "var(--admin-bg)", border: `1px solid ${BORDER}`, borderRadius: 8,
    color: "var(--admin-fg)", padding: "9px 12px", fontSize: 13, width: "100%",
    fontFamily: "var(--font-mono)", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: MUTED, marginBottom: 4 }}>Logistique</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--admin-fg)" }}>Carnet de prestataires</div>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ nom: "", tel: "", email: "", categorie: "menage", biens: [], notes: "" }); setShowForm(s => !s); }}
          style={{ background: "#0e3b3a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em" }}
        >
          {showForm && editing === null ? "Annuler" : "+ Ajouter un contact"}
        </button>
      </div>

      {/* ── Formulaire ajout/édition ── */}
      {showForm && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--admin-fg)", marginBottom: 16 }}>
            {editing !== null ? "Modifier le contact" : "Nouveau prestataire"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>NOM *</div>
              <input style={inputS} placeholder="Jean Dupont" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>CATÉGORIE</div>
              <select style={inputS} value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                {PREST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>TÉLÉPHONE</div>
              <input style={inputS} placeholder="+596 696 000 000" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>EMAIL</div>
              <input style={inputS} placeholder="contact@prestataire.fr" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 8, fontWeight: 600, letterSpacing: "0.06em" }}>PROPRIÉTÉS CONCERNÉES</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(PREST_BIEN_LABELS).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => toggleBien(id)}
                  style={{
                    background: form.biens.includes(id) ? "#0e3b3a" : "transparent",
                    border: `1px solid ${form.biens.includes(id) ? "#0e3b3a" : BORDER}`,
                    color: form.biens.includes(id) ? "#fff" : MUTED,
                    borderRadius: 20, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600,
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>NOTES</div>
            <textarea style={{ ...inputS, height: 72, resize: "vertical" }} placeholder="Tarifs, jours disponibles, commentaires…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={submit}
              style={{ background: "#0e3b3a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >{editing !== null ? "Enregistrer" : "Ajouter"}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: "10px 20px", fontSize: 12, cursor: "pointer" }}>Annuler</button>
          </div>
        </div>
      )}

      {/* ── Filtres ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ ...inputS, maxWidth: 220 }} placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...inputS, maxWidth: 160 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">Toutes catégories</option>
          {PREST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select style={{ ...inputS, maxWidth: 160 }} value={filterBien} onChange={e => setFilterBien(e.target.value)}>
          <option value="all">Toutes propriétés</option>
          {Object.entries(PREST_BIEN_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <span style={{ fontSize: 11, color: MUTED, marginLeft: "auto" }}>{filtered.length} contact{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Grille contacts ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: MUTED, padding: "60px 0", fontSize: 14 }}>
          {contacts.length === 0 ? "Aucun prestataire enregistré. Commencez par ajouter un contact." : "Aucun résultat pour ces filtres."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {filtered.map(c => {
            const cat = PREST_CATEGORIES.find(p => p.id === c.categorie);
            return (
              <div key={c.id} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{cat?.icon || "📌"}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--admin-fg)" }}>{c.nom}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{cat?.label}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => edit(c)} title="Modifier" style={{ background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>✏️</button>
                    <button onClick={() => del(c.id)} title="Supprimer" style={{ background: "transparent", border: `1px solid ${BORDER}`, color: "#ef4444", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>🗑</button>
                  </div>
                </div>

                {c.tel && (
                  <a href={`tel:${c.tel}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "#0e3b3a", fontSize: 13, textDecoration: "none", marginBottom: 6 }}>
                    <span>📞</span><span style={{ fontFamily: "var(--font-mono)" }}>{c.tel}</span>
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "#0e3b3a", fontSize: 13, textDecoration: "none", marginBottom: 6 }}>
                    <span>✉️</span><span style={{ fontSize: 12 }}>{c.email}</span>
                  </a>
                )}

                {c.biens && c.biens.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {c.biens.map(b => (
                      <span key={b} style={{ background: "rgba(14,59,58,0.08)", color: "#0e3b3a", borderRadius: 12, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>{PREST_BIEN_LABELS[b] || b}</span>
                    ))}
                  </div>
                )}

                {c.notes && (
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>{c.notes}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Cautions() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionMsg, setActionMsg] = useState({});
  const [captureAmounts, setCaptureAmounts] = useState({});

  // ── Formulaire création ──
  const defaultBien = BIENS_CAUTION[0];
  const [form, setForm] = useState({ bienId: defaultBien.id, voyageur: "", email: "", checkin: "", checkout: "", amount: String(defaultBien.depot) });
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState(null);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const createCaution = async () => {
    if (!form.checkout || !form.amount) return;
    setCreating(true);
    setCreatedLink(null);
    try {
      const res = await fetch("/api/caution-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erreur API");
      setCreatedLink(data.url);
    } catch (e) {
      alert("Erreur : " + e.message);
    }
    setCreating(false);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/manage-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erreur API");
      setDeposits(data.data || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const doAction = async (id, action, amount) => {
    setActionLoading(prev => ({ ...prev, [id]: action }));
    setActionMsg(prev => ({ ...prev, [id]: null }));
    try {
      const body = { action, paymentIntentId: id };
      if (action === "capture" && amount) body.amount = parseFloat(amount);
      const res = await fetch("/api/manage-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setActionMsg(prev => ({ ...prev, [id]: action === "capture" ? "✓ Débité" : "✓ Libéré" }));
      setTimeout(() => load(), 1500);
    } catch (e) {
      setActionMsg(prev => ({ ...prev, [id]: "Erreur : " + e.message }));
    }
    setActionLoading(prev => ({ ...prev, [id]: null }));
  };

  const fmtEur = v => (v / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const fmtDate = ts => new Date(ts * 1000).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const card = { background: "#1e293b", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.06)" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#f1f5f9" }}>🔒 Cautions voyageurs</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Pré-autorisation CB · Libération automatique J+3 après départ · Débiter en cas de dommage</p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: loading ? "#334155" : "#0ea5e9", color: "#fff", cursor: loading ? "default" : "pointer", fontSize: 13, fontWeight: 600 }}>
          {loading ? "⏳…" : "🔄 Rafraîchir"}
        </button>
      </div>

      {/* ── Formulaire création caution ── */}
      <div style={{ background: "#1e293b", borderRadius: 12, padding: "20px 24px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>+ Nouvelle caution</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }}>
          <select value={form.bienId} onChange={e => { setF("bienId", e.target.value); const b = BIENS_CAUTION.find(x => x.id === e.target.value); if (b) setF("amount", String(b.depot)); }}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }}>
            {BIENS_CAUTION.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </select>
          <input placeholder="Nom voyageur" value={form.voyageur} onChange={e => setF("voyageur", e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }} />
          <input type="email" placeholder="Email voyageur" value={form.email} onChange={e => setF("email", e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }} />
          <input type="date" placeholder="Arrivée" value={form.checkin} onChange={e => setF("checkin", e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }} />
          <input type="date" placeholder="Départ" value={form.checkout} onChange={e => setF("checkout", e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }} />
          <input type="number" placeholder="Montant (€)" value={form.amount} onChange={e => setF("amount", e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }} />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={createCaution} disabled={creating || !form.checkout || !form.amount}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: creating ? "#334155" : "#6366f1", color: "#fff", cursor: creating ? "default" : "pointer", fontSize: 13, fontWeight: 600 }}>
            {creating ? "⏳ Génération…" : "🔗 Générer lien Stripe"}
          </button>
          {createdLink && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <a href={createdLink} target="_blank" rel="noopener noreferrer"
                style={{ color: "#a78bfa", fontSize: 12, wordBreak: "break-all", maxWidth: 340 }}>{createdLink}</a>
              <button onClick={() => { navigator.clipboard.writeText(createdLink); }}
                style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #6366f1", background: "transparent", color: "#a78bfa", cursor: "pointer", fontSize: 11, whiteSpace: "nowrap" }}>
                📋 Copier
              </button>
            </div>
          )}
        </div>
        {createdLink && (
          <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
            ✉️ Envoyer ce lien au voyageur via Airbnb ou SMS · Expire dans 72h · Carte bloquée mais non débitée
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: "#1e1215", border: "1px solid #ef4444", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#fca5a5", fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {!loading && deposits.length === 0 && !error && (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔓</div>
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Aucun dépôt en attente</div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>Les dépôts prélevés ou libérés n'apparaissent plus ici</div>
        </div>
      )}

      {deposits.map(d => {
        const m = d.metadata || {};
        const amt = d.amount;
        const busy = actionLoading[d.id];
        const msg = actionMsg[d.id];
        const captureVal = captureAmounts[d.id] ?? "";
        return (
          <div key={d.id} style={{ ...card, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 15, marginBottom: 4 }}>
                  {m.voyageur || "—"} · <span style={{ color: "#f59e0b" }}>{fmtEur(amt)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>
                  {m.bienId || "—"} · {m.checkin ? `${m.checkin} → ${m.checkout}` : ""}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {m.email || ""} · Créé le {fmtDate(d.created)} · <code style={{ color: "#475569", fontSize: 10 }}>{d.id}</code>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {msg && (
                  <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "#10b981" : "#ef4444", fontWeight: 600 }}>{msg}</span>
                )}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="number"
                    placeholder={`Montant max ${(amt / 100).toFixed(0)} €`}
                    value={captureVal}
                    onChange={e => setCaptureAmounts(prev => ({ ...prev, [d.id]: e.target.value }))}
                    style={{ width: 130, padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }}
                  />
                  <button
                    onClick={() => doAction(d.id, "capture", captureVal || (amt / 100))}
                    disabled={!!busy}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: busy === "capture" ? "#334155" : "#ef4444", color: "#fff", cursor: busy ? "default" : "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {busy === "capture" ? "⏳…" : "💳 Débiter"}
                  </button>
                  <button
                    onClick={() => doAction(d.id, "cancel")}
                    disabled={!!busy}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.4)", background: "transparent", color: "#10b981", cursor: busy ? "default" : "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {busy === "cancel" ? "⏳…" : "🔓 Libérer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Devis Editor ────────────────────────────────────────────────────────────

const BIENS_DEVIS = [
  { id: "amaryllis", nom: "Villa Amaryllis", depot: 1500 },
  { id: "zandoli",   nom: "Zandoli",         depot: 700  },
  { id: "iguana",    nom: "Villa Iguana",    depot: 500  },
  { id: "geko",      nom: "Géko",            depot: 500  },
  { id: "mabouya",   nom: "Mabouya",         depot: 500  },
  { id: "schoelcher",nom: "T2 Schoelcher",   depot: 1000 },
  { id: "nogent",    nom: "T2 Nogent",       depot: 500  },
];

// ── LocalErrorBoundary — protège l'admin si un onglet crashe ────────────
class LocalErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, info) { console.error("[AdminTab crash]", e, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>Une erreur est survenue dans cet onglet</div>
          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", background: "#0f172a", padding: "8px 14px", borderRadius: 8, maxWidth: 600, margin: "0 auto 16px", wordBreak: "break-all" }}>
            {this.state.error?.message || String(this.state.error)}
          </div>
          <button onClick={() => this.setState({ error: null })}
            style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
            ↺ Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── AdminChatTab — Assistant IA pour l'admin ─────────────────────────────
const ADMIN_SHORTCUTS = [
  { icon: "📊", label: "Résumé de la semaine",       prompt: "Fais-moi un résumé de la situation de mes locations cette semaine : réservations en cours, taux d'occupation global, points d'attention." },
  { icon: "✉️", label: "Email de bienvenue",          prompt: "Rédige un email de bienvenue chaleureux pour un voyageur qui arrive demain à la Villa Amaryllis. Ton : professionnel et chaleureux." },
  { icon: "📝", label: "Description Airbnb",          prompt: "Propose une description optimisée pour Airbnb de la Villa Amaryllis : accrocheuse, avec les mots-clés pertinents, max 500 mots." },
  { icon: "💡", label: "Conseil revenue management",  prompt: "Donne-moi 3 conseils concrets pour améliorer le RevPAR de mes villas en Martinique ce trimestre." },
  { icon: "📱", label: "Post Instagram",              prompt: "Rédige un post Instagram engageant pour promouvoir la Villa Amaryllis en été. Ton aspirationnel, 3 hashtags max." },
  { icon: "🔍", label: "Analyse basse saison",        prompt: "Comment optimiser le remplissage de mes villas en basse saison (septembre-novembre) ? Stratégies tarifaires, canaux, offres." },
];

function AdminChatTab({ biens = [], reservations = [], addToast = () => {} }) {
  const [messages,    setMessages]    = useState([{ role: "assistant", content: "Bonjour 👋 Je suis votre assistant IA Amaryllis. Je peux vous aider à rédiger des emails, analyser vos performances, créer du contenu marketing, ou répondre à toute question de gestion locative. Par quoi commençons-nous ?" }]);
  const [suggestions, setSuggestions] = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Contexte admin injecté dans chaque message
  const buildContext = useCallback(() => {
    const totalResas = reservations.length;
    const upcoming = reservations.filter(r => r.checkin >= new Date().toISOString().slice(0,10)).slice(0, 5);
    return `\n\n[CONTEXTE ADMIN]\nBiens : ${biens.map(b => `${b.nom} (${b.id})`).join(", ")}\nTotal réservations : ${totalResas}\nProchaines arrivées : ${upcoming.map(r => `${r.voyageur} → ${r.bienId} le ${r.checkin}`).join(" | ") || "aucune"}`;
  }, [biens, reservations]);

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    const userMsg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setSuggestions([]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m, i) =>
            i === 0 ? { ...m, content: m.content + buildContext() } : m
          ).slice(-12),
          mode: "admin",
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        setSuggestions(data.suggestions || []);
      } else {
        addToast(data.error || "Erreur assistant IA", "error");
      }
    } catch (e) {
      addToast(`Erreur réseau : ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, buildContext, addToast]);

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // Rendu d'une ligne avec liens cliquables
  const renderLine = (line, li, arr) => {
    const linkRe = /(villamaryllis\.com\/[\w-]*)/g;
    const parts = line.split(linkRe);
    const isTotal = /total estimé|total :/i.test(line);
    const isHr = line.startsWith("─") || line.trim() === "---";
    if (isHr) return <span key={li} style={{ display: "block", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0" }} />;
    return (
      <span key={li}>
        {parts.map((p, pi) => linkRe.test(p)
          ? <a key={pi} href={`https://${p}`} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "none", borderBottom: "1px solid rgba(56,189,248,0.3)" }}>{p} →</a>
          : <span key={pi} style={isTotal ? { fontWeight: 700, color: "#a3e635" } : {}}>{p}</span>
        )}
        {li < arr.length - 1 && "\n"}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", height: "calc(100vh - 140px)", display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(167,139,250,0.4)", flexShrink: 0 }}>
          <img src="/photos/assistant.png" alt="Assistant IA" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 10%", transform: "scale(2.0)", transformOrigin: "52% 10%" }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>✨ Assistant IA — Mode Admin</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Powered by Groq · Connait vos biens, vos réservations et votre activité</div>
        </div>
        <button onClick={() => { setMessages([{ role: "assistant", content: "Conversation réinitialisée. Comment puis-je vous aider ?" }]); setSuggestions([]); }}
          style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 7, border: "1px solid #334155", background: "none", color: "#64748b", fontSize: 11, cursor: "pointer" }}>
          🗑 Effacer
        </button>
      </div>

      {/* Raccourcis */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {ADMIN_SHORTCUTS.map(s => (
          <button key={s.label} onClick={() => sendMessage(s.prompt)}
            style={{ padding: "5px 11px", borderRadius: 20, border: "1px solid rgba(167,139,250,0.25)", background: "rgba(167,139,250,0.07)", color: "#a78bfa", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(167,139,250,0.18)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(167,139,250,0.07)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.25)"; }}
          >
            <span>{s.icon}</span><span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Zone messages */}
      <div style={{ flex: 1, overflowY: "auto", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(167,139,250,0.3)", flexShrink: 0 }}>
                <img src="/photos/assistant.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 10%", transform: "scale(2.0)", transformOrigin: "52% 10%" }} />
              </div>
            )}
            <div style={{
              maxWidth: "78%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
              background: m.role === "user" ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#1e293b",
              color: "#e2e8f0", fontSize: 13, lineHeight: 1.65,
              border: m.role === "assistant" ? "1px solid #334155" : "none",
              whiteSpace: "pre-wrap",
            }}>
              {m.content.split("\n").map((line, li, arr) => renderLine(line, li, arr))}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(167,139,250,0.3)", flexShrink: 0 }}>
              <img src="/photos/assistant.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 10%", transform: "scale(2.0)", transformOrigin: "52% 10%" }} />
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "4px 16px 16px 16px", padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", display: "inline-block", animation: "skeletonPulse 1.2s ease-in-out infinite", animationDelay: `${d}s` }} />)}
              </div>
            </div>
          </div>
        )}
        {/* Suggestions IA */}
        {!loading && suggestions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 4 }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                style={{ padding: "5px 11px", borderRadius: 20, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#334155"; e.currentTarget.style.color = "#e2e8f0"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "#94a3b8"; }}
              >{s}</button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 10 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez une question, demandez un email, une analyse… (Entrée pour envoyer)"
          rows={2}
          style={{ flex: 1, resize: "none", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#e2e8f0", background: "#0f172a", outline: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", fontFamily: "system-ui, sans-serif" }}
          onFocus={e => e.target.style.borderColor = "#6366f1"}
          onBlur={e => e.target.style.borderColor = "#334155"}
        />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          style={{ width: 42, height: 42, borderRadius: "50%", border: "none", background: (!input.trim() || loading) ? "#1e293b" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", cursor: (!input.trim() || loading) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, transition: "all 0.2s" }}>
          ↑
        </button>
      </div>
    </div>
  );
}

function DevisEditor() {
  const [form, setForm] = useState({
    bienId: "amaryllis",
    checkin: "",
    checkout: "",
    voyageur: "",
    email: "",
    montantSejour: "",
    fraisMenage: "",
    avecDepot: true,
    depotCustom: "",
  });
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const bien = BIENS_DEVIS.find(b => b.id === form.bienId);
  const montant = parseFloat(form.montantSejour) || 0;
  const menage  = parseFloat(form.fraisMenage)   || 0;
  const total   = montant + menage;
  const depot   = form.avecDepot
    ? (parseFloat(form.depotCustom) || bien?.depot || 0)
    : 0;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generate = () => {
    if (!total) return;
    const data = {
      bienId: form.bienId,
      bienNom: bien?.nom || form.bienId,
      checkin: form.checkin,
      checkout: form.checkout,
      voyageur: form.voyageur,
      email: form.email,
      montantSejour: montant,
      fraisMenage: menage,
      total,
      depot,
    };
    const encoded = btoa(JSON.stringify(data));
    setLink(`${window.location.origin}/devis?d=${encoded}`);
  };

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const card = { background: "#1e293b", borderRadius: 12, padding: "20px 24px", border: "1px solid rgba(255,255,255,0.06)" };
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box" };
  const label = { fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, display: "block" };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#f1f5f9" }}>📋 Créer un devis personnalisé</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Génère un lien de paiement sur mesure à envoyer à ton voyageur</p>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={label}>Villa / Appartement</label>
            <select value={form.bienId} onChange={e => set("bienId", e.target.value)} style={inp}>
              {BIENS_DEVIS.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Check-in</label>
            <input type="date" value={form.checkin} onChange={e => set("checkin", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>Check-out</label>
            <input type="date" value={form.checkout} onChange={e => set("checkout", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>Nom du voyageur</label>
            <input type="text" placeholder="Jean Dupont" value={form.voyageur} onChange={e => set("voyageur", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>Email</label>
            <input type="email" placeholder="jean@email.com" value={form.email} onChange={e => set("email", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>Montant séjour (€)</label>
            <input type="number" placeholder="ex: 800" value={form.montantSejour} onChange={e => set("montantSejour", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>Frais de ménage (€)</label>
            <input type="number" placeholder="ex: 80" value={form.fraisMenage} onChange={e => set("fraisMenage", e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(245,158,11,0.06)", borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: form.avecDepot ? 10 : 0 }}>
            <input type="checkbox" id="avecDepot" checked={form.avecDepot} onChange={e => set("avecDepot", e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
            <label htmlFor="avecDepot" style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, cursor: "pointer" }}>
              🔒 Inclure un dépôt de garantie (pré-autorisation)
            </label>
          </div>
          {form.avecDepot && (
            <div>
              <label style={{ ...label, color: "#92400e" }}>Montant du dépôt (€) — défaut : {bien?.depot} €</label>
              <input type="number" placeholder={`${bien?.depot}`} value={form.depotCustom} onChange={e => set("depotCustom", e.target.value)} style={{ ...inp, width: 160 }} />
            </div>
          )}
        </div>
      </div>

      {total > 0 && (
        <div style={{ ...card, marginBottom: 16, borderColor: "rgba(14,165,233,0.3)" }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Récapitulatif du devis</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {montant > 0 && <div><span style={{ fontSize: 11, color: "#64748b" }}>Séjour</span><br /><span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{montant.toLocaleString("fr-FR")} €</span></div>}
            {menage > 0 && <div><span style={{ fontSize: 11, color: "#64748b" }}>Ménage</span><br /><span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{menage.toLocaleString("fr-FR")} €</span></div>}
            <div><span style={{ fontSize: 11, color: "#0ea5e9" }}>Total à payer</span><br /><span style={{ fontSize: 20, fontWeight: 700, color: "#0ea5e9" }}>{total.toLocaleString("fr-FR")} €</span></div>
            {depot > 0 && <div><span style={{ fontSize: 11, color: "#f59e0b" }}>Dépôt (bloqué)</span><br /><span style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>{depot.toLocaleString("fr-FR")} €</span></div>}
          </div>
        </div>
      )}

      <button onClick={generate} disabled={!total}
        style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: total ? "#0ea5e9" : "#334155", color: "#fff", fontSize: 14, fontWeight: 700, cursor: total ? "pointer" : "default", marginBottom: 16 }}>
        🔗 Générer le lien de paiement
      </button>

      {link && (
        <div style={{ ...card, borderColor: "#10b981" }}>
          <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 10 }}>✓ Lien prêt</div>
          <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#7dd3fc", wordBreak: "break-all", marginBottom: 12 }}>{link}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copy} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: copied ? "#10b981" : "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {copied ? "✓ Copié !" : "📋 Copier"}
            </button>
            <a href={link} target="_blank" rel="noopener noreferrer"
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              🔗 Ouvrir
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
