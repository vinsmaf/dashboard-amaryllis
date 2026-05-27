import { useState, useEffect, useCallback, useRef, useMemo, Component } from "react";
import EmailSync from "./EmailSync.jsx";
import RevenueManagerPro from "./RevenueManagerPro.jsx";
import GuideEditor from "./GuideEditor.jsx";
import LivretEditor from "./LivretEditor.jsx";
import AgentsKanban from "./AgentsKanban.jsx";
import Cockpit from "./tabs/Cockpit.jsx";
import Planning from "./tabs/Planning.jsx";
import Previsionnel from "./tabs/Previsionnel.jsx";
import Historique from "./tabs/Historique.jsx";
import Charges from "./tabs/Charges.jsx";
import MenageTab from "./tabs/MenageTab.jsx";
import MessageTemplates from "./tabs/MessageTemplates.jsx";
import Tarifs from "./tabs/Tarifs.jsx";
import AnalyticsTab from "./tabs/AnalyticsTab.jsx";
import MinNightsConfig from "./tabs/MinNightsConfig.jsx";
import Pilotage from "./tabs/Pilotage.jsx";
import CalendrierTarifs from "./tabs/CalendrierTarifs.jsx";
import { AppDataProvider } from "./AppDataContext.jsx";
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
export const MOIS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
export const MOIS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
export const N = new Date().getMonth() + 1; // mois écoulés dans l'année en cours
export const CC = { airbnb: "#FF5A5F", booking: "#0ea5e9", direct: "#10b981", autre: "#a855f7" };
export const CB = { airbnb: "rgba(255,90,95,0.15)", booking: "rgba(14,165,233,0.15)", direct: "rgba(16,185,129,0.15)", autre: "rgba(168,85,247,0.15)" };

export const HIST_SEED = {
  2022: { total:[5220,9525,4160,8912,8339,7557,9724,13351,6095,8373,9149,16656], nogent:[660,0,0,1354,3344,3277,3113,2683,3285,2863,3037,3192], amaryllis:[0,4965,0,4048,1500,1470,3801,5987,0,2700,3302,7548], iguana:[0,0,0,0,0,0,0,1871,0,0,0,3106], geko:[0,0,0,0,0,0,0,0,0,0,0,0], zandoli:[0,0,0,0,0,0,0,0,0,0,0,0], mabouya:[0,0,0,0,0,0,0,0,0,0,0,0], schoelcher:[0,0,0,0,0,0,0,0,0,0,0,0] },
  2023: { total:[16412,12562,10148,13133,8953,6844,11042,12827,4775,6735,7320,10979], nogent:[2709,2445,2556,2588,2343,2261,2606,1875,2904,2861,2462,2651], amaryllis:[8387,5767,3935,6132,3847,764,5481,5133,0,2574,3126,5448], iguana:[1924,1995,1747,645,602,1622,340,2387,571,0,382,1227], geko:[1482,445,0,1858,252,262,704,1522,0,0,50,353], zandoli:[1631,1680,1440,2233,1700,1275,0,190,965,0,1100,3700], mabouya:[0,0,0,0,0,0,0,0,0,0,0,0], schoelcher:[0,0,0,0,0,0,0,0,0,0,0,0] },
  2024: { total:[19042,19532,15426,8606,5140,3528,14373,11950,1551,14062,10198,19933], nogent:[890,1273,1192,188,1864,987,865,0,243,2066,1388,1549], amaryllis:[6487,11216,8087,6417,1475,0,7178,7785,0,6095,2085,9989], iguana:[3199,2889,3013,0,0,397,1018,1085,0,0,3400,1090], geko:[0,0,0,0,0,0,0,0,0,518,1656,1606], zandoli:[2322,1801,970,0,0,343,2539,2811,670,2951,718,2824], mabouya:[1635,1791,242,0,0,0,472,269,0,154,330,517], schoelcher:[3209,562,1922,2000,1800,1800,2300,0,638,2279,622,2358] },
  2025: { total:[17094,27053,12558,15822,10516,8726,11183,18561,5258,7684,8662,18214], nogent:[1671,1813,1379,2561,2367,2231,2653,1984,2223,2374,1628,2419], amaryllis:[3365,11820,1604,6895,0,0,1650,6843,0,0,0,5824], iguana:[2300,2300,2300,2300,1800,1800,1800,1800,1800,1800,1800,1800], geko:[0,4420,1990,1207,1628,2097,2062,1332,741,1438,1932,1175], zandoli:[7393,2770,2770,2213,4475,2159,2716,2817,331,1372,1012,3248], mabouya:[923,2086,140,567,247,0,302,1312,164,700,609,1400], schoelcher:[1442,1844,2375,80,0,439,0,2474,0,0,1681,2347] },
};

export const ANNEE_COLORS = { 2022: "#475569", 2023: "#0284c7", 2024: "#7c3aed", 2025: "#059669", 2026: "#f59e0b" };
export const DOT = { green: "#10b981", yellow: "#f59e0b", red: "#ef4444" };

// ─── DONNÉES DÉTAILLÉES 2025 (extraites Google Sheets) ─────────────────────
// Charges annuelles par poste et par bien
export const CHARGES_2025 = {
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
export const REVENUS_CANAL_2025 = {
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
export const SAISONNALITE = {
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
export const fmt = (v) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v) + " €";
export const fmtK = (v) => v >= 1000 ? (v / 1000).toFixed(1) + "k€" : Math.round(v) + "€";
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

export const TT = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#cbd5e1" };

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

export function Gauge({ pct = 0, size = 52 }) {
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

// Spark, PBar : extraits dans src/tabs/Cockpit.jsx (refactor 2026)

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

// ============================================================================
// COMPUTE REVENUS FROM RESERVATIONS
// ============================================================================
export function computeRevenusFromResas(reservations, year = new Date().getFullYear()) {
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
// RevCell, Cockpit : extraits dans src/tabs/Cockpit.jsx (refactor 2026)

// ============================================================================
// PLANNING
// ============================================================================

// ============================================================================
// PRÉVISIONNEL
// ============================================================================

// ============================================================================
// HISTORIQUE
// ============================================================================

// ============================================================================
// PILOTAGE (Canaux / Fiscal / Détail charges)
// ── MinNightsConfig — sous-composant UI admin ────────────────────
export const MIN_NIGHTS_DEFAULTS_ADMIN = {
  amaryllis: 4, geko: 3, zandoli: 3, schoelcher: 3, mabouya: 2, nogent: 1, iguana: 0,
};
const BIEN_NAMES_ADMIN = {
  amaryllis: "Villa Amaryllis", geko: "Géko", zandoli: "Zandoli",
  schoelcher: "Bellevue", mabouya: "Mabouya", nogent: "Appt. Nogent", iguana: "Villa Iguana",
};


// ============================================================================

// ============================================================================
// CHARGES
// ============================================================================

// ============================================================================
// COMPARATIF
// ============================================================================
export function ComparatifContent({ biens, n, mob, hist = HIST_SEED, prevYear = new Date().getFullYear() - 1 }) {
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


// ============================================================================
// REVENUE MANAGER — inspiré PriceLabs
// ============================================================================

// YieldAlerts, NogentCashflowAlert, AmaryllisBaseSaisonAlert :
// extraits dans src/tabs/Cockpit.jsx (refactor 2026)

// ============================================================================
// CANAL LIVE PERFORMANCE — depuis les réservations iCal/Beds24 réelles
// ============================================================================

// ============================================================================
// MÉNAGE TAB — planning de ménage dédié
// ============================================================================

// ============================================================================
// MESSAGES — templates de communication voyageur
// ============================================================================

// ============================================================================
// ============================================================================
// TARIFS (gestion des prix publics)
// ============================================================================
export const DEFAULT_PRIX = { amaryllis: 280, zandoli: 220, iguana: 180, geko: 150, mabouya: 110, schoelcher: 100, nogent: 85 };
export const BIEN_LABELS = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", iguana: "Villa Iguana", geko: "Géko", mabouya: "Mabouya", schoelcher: "T2 Schœlcher", nogent: "T2 Nogent-sur-Marne" };
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


export const SEASONAL_KEY = "amaryllis_seasonal_periods";
export const SEASON_COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#0ea5e9","#a855f7","#ec4899","#14b8a6"];
export const SEASON_COLOR_LABELS = ["Indigo","Ambre","Émeraude","Rouge","Bleu","Violet","Rose","Teal"];

export const DEFAULT_SEASONS = [
  { id: "noel25",   nom: "Noël / Jour de l'an", couleur: "#ef4444", debut: "2025-12-20", fin: "2026-01-05", mult: 1.40, biens: ["amaryllis","zandoli","iguana","geko","mabouya","schoelcher"] },
  { id: "vac_fev",  nom: "Vacances Février",    couleur: "#f59e0b", debut: "2026-02-07", fin: "2026-02-22", mult: 1.20, biens: ["nogent"] },
  { id: "paques26", nom: "Pâques 2026",          couleur: "#10b981", debut: "2026-04-02", fin: "2026-04-18", mult: 1.15, biens: ["amaryllis","zandoli","iguana","geko","mabouya","schoelcher","nogent"] },
  { id: "ete26",    nom: "Été 2026",             couleur: "#6366f1", debut: "2026-07-01", fin: "2026-08-31", mult: 1.30, biens: ["amaryllis","zandoli","iguana","geko","mabouya","schoelcher"] },
  { id: "noel26",   nom: "Noël / Jour de l'an", couleur: "#ef4444", debut: "2026-12-20", fin: "2027-01-05", mult: 1.40, biens: ["amaryllis","zandoli","iguana","geko","mabouya","schoelcher"] },
];


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
        sessionStorage.setItem("ldb_tok", val); // arch-008 : token pour Bearer auth
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
      const res = await fetch(`/api/beds24-bookings?${params}`, {
        headers: { Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || "") },
      });
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
      const res = await fetch("/api/beds24-bookings?test=1", {
        headers: { Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || "") },
      });
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
        const b24 = await fetch("/api/beds24-bookings", {
          headers: { Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || "") },
        });
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
        { id: "interventions", icon: "🔨", label: "Interventions" },
        { id: "stocks",        icon: "📦", label: "Stocks" },
        { id: "linge",         icon: "🛏️",  label: "Linge" },
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
        { id: "conversion",  icon: "💳", label: "Conversion" },
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
      id: "marketing", label: "Marketing",
      items: [
        { id: "social", icon: "📣", label: "Réseaux sociaux" },
        { id: "approbations", icon: "📥", label: "Approbations" },
        { id: "editorial", icon: "📅", label: "Planning éditorial" },
      ],
    },
    {
      id: "ia", label: "Intelligence Artificielle",
      items: [
        { id: "chat-admin",    icon: "✨", label: "Assistant IA" },
        { id: "orchestrateur", icon: "🧠", label: "Orchestrateur" },
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

          {/* Contenu de l'onglet — données partagées via AppDataContext */}
          <AppDataProvider value={{
            biens, n, mob, hist, reservations,
            scriptUrl, icalUrls, icalUrlsBooking,
            saveRes, saveUrls, saveUrlsBooking,
            addToast,
            onUpdateRevenu, onApplyRevenusFromResas, pushReservationsToScript,
          }}>
          <div style={{ padding: mob ? "12px" : "18px 24px", flex: 1, paddingBottom: "calc(76px + env(safe-area-inset-bottom))" }}>
            {tab === "planning" && <Planning />}
            {tab === "cockpit" && <Cockpit />}
            {tab === "previsionnel" && <Previsionnel />}
            {tab === "charges" && <Charges />}
            {tab === "pilotage" && <Pilotage />}
            {tab === "historique" && <Historique />}
            {tab === "revenue"  && <RevenueManagerPro />}
            {tab === "tarifs" && <Tarifs />}
            {tab === "analytics" && <AnalyticsTab />}
            {tab === "menage" && <MenageTab />}
            {tab === "prestataires"   && <Prestataires biens={biens} mob={mob} />}
            {tab === "messages" && <MessageTemplates />}
            {tab === "emails" && <EmailSync mob={mob} />}
            {tab === "cautions" && <Cautions />}
            {tab === "travaux"  && <Travaux biens={biens} mob={mob} />}
            {tab === "livrets"  && <LivretEditor />}
            {tab === "devis"    && <DevisEditor />}
            {tab === "guides" && <GuideEditor mob={mob} />}
            {tab === "agents" && <AgentsKanban mob={mob} />}
            {tab === "social"        && <SocialTab mob={mob} />}
            {tab === "approbations"  && <ApprobationsTab mob={mob} />}
            {tab === "editorial"     && <EditorialCalendarTab mob={mob} />}
            {tab === "chat-admin"    && <LocalErrorBoundary><AdminChatTab biens={biens} reservations={reservations} addToast={addToast} /></LocalErrorBoundary>}
            {tab === "orchestrateur" && <OrchestratorTab mob={mob} />}
            {tab === "interventions" && <InterventionsTab biens={biens} mob={mob} />}
            {tab === "stocks"        && <StockTrackerTab  biens={biens} mob={mob} />}
            {tab === "linge"         && <LingeTab         biens={biens} mob={mob} />}
            {tab === "conversion"    && <ConversionTab    biens={biens} reservations={reservations} mob={mob} />}
          </div>
          </AppDataProvider>
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
    phone: "",
    montantSejour: "",
    fraisMenage: "",
    avecDepot: true,
    depotCustom: "",
  });
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  // ebiz-005 : Stripe Payment Link
  const [stripeLink, setStripeLink]       = useState("");
  const [stripeCopied, setStripeCopied]   = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError]     = useState("");

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

  // ebiz-005 : génère un vrai Stripe Payment Link
  const generateStripeLink = async () => {
    if (!total || !form.checkin || !form.checkout) return;
    setStripeLoading(true);
    setStripeError("");
    setStripeLink("");
    try {
      const nights = form.checkin && form.checkout
        ? Math.round((new Date(form.checkout) - new Date(form.checkin)) / 86400000)
        : null;
      const res = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || ""),
        },
        body: JSON.stringify({
          amount:    Math.round(total * 100), // centimes
          bienId:    form.bienId,
          bienNom:   bien?.nom || form.bienId,
          checkin:   form.checkin,
          checkout:  form.checkout,
          voyageur:  form.voyageur,
          email:     form.email,
          nights,
          type:      "total",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Erreur Stripe");
      setStripeLink(data.url);
    } catch (err) {
      setStripeError(err.message);
    } finally {
      setStripeLoading(false);
    }
  };

  const copyStripe = () => {
    navigator.clipboard.writeText(stripeLink);
    setStripeCopied(true);
    setTimeout(() => setStripeCopied(false), 2000);
  };

  // Partage WhatsApp avec le lien Stripe
  const shareWA = () => {
    if (!stripeLink) return;
    const fmtDate = (iso) => {
      if (!iso) return "?";
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    };
    const nights = form.checkin && form.checkout
      ? Math.round((new Date(form.checkout) - new Date(form.checkin)) / 86400000)
      : null;
    const msg = [
      `Bonjour ${form.voyageur ? form.voyageur.split(" ")[0] : ""},`,
      ``,
      `Voici votre lien de paiement sécurisé pour votre séjour à ${bien?.nom || form.bienId} :`,
      `📅 ${fmtDate(form.checkin)} → ${fmtDate(form.checkout)}${nights ? ` (${nights} nuit${nights > 1 ? "s" : ""})` : ""}`,
      `💶 Total : ${total.toLocaleString("fr-FR")} €`,
      ``,
      `🔒 Paiement sécurisé Stripe :`,
      stripeLink,
      ``,
      `En cas de question, n'hésitez pas à me contacter.`,
      `Amaryllis Locations`,
    ].join("\n");
    const phone = form.phone.replace(/[^0-9+]/g, "");
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
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
          <div style={{ gridColumn: "1/-1" }}>
            <label style={label}>WhatsApp voyageur (optionnel)</label>
            <input type="tel" placeholder="+596 696 00 00 00" value={form.phone} onChange={e => set("phone", e.target.value)} style={inp} />
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

      {/* Boutons de génération */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={generate} disabled={!total}
          style={{ padding: "12px 22px", borderRadius: 10, border: "none", background: total ? "#0ea5e9" : "#334155", color: "#fff", fontSize: 13, fontWeight: 700, cursor: total ? "pointer" : "default" }}>
          🔗 Lien devis interne
        </button>

        {/* ebiz-005 : Stripe Payment Link */}
        <button
          onClick={generateStripeLink}
          disabled={!total || !form.checkin || !form.checkout || stripeLoading}
          style={{
            padding: "12px 22px", borderRadius: 10, border: "none",
            background: (!total || !form.checkin || !form.checkout) ? "#334155" : stripeLoading ? "#334155" : "#7c3aed",
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: (!total || !form.checkin || !form.checkout || stripeLoading) ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {stripeLoading ? "⏳ Création…" : "💳 Lien paiement Stripe"}
        </button>
      </div>

      {/* Devis interne */}
      {link && (
        <div style={{ ...card, borderColor: "#10b981", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginBottom: 8 }}>✓ Devis interne (page Amaryllis)</div>
          <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#7dd3fc", wordBreak: "break-all", marginBottom: 10 }}>{link}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copy} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: copied ? "#10b981" : "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {copied ? "✓ Copié !" : "📋 Copier"}
            </button>
            <a href={link} target="_blank" rel="noopener noreferrer"
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              🔗 Ouvrir
            </a>
          </div>
        </div>
      )}

      {/* ebiz-005 : Stripe Payment Link */}
      {stripeError && (
        <div style={{ ...card, borderColor: "#ef4444", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>⚠️ Erreur Stripe</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{stripeError}</div>
        </div>
      )}
      {stripeLink && (
        <div style={{ ...card, borderColor: "#7c3aed", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, marginBottom: 8 }}>💳 Lien Stripe prêt — paiement direct en {(total).toLocaleString("fr-FR")} €</div>
          <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#c4b5fd", wordBreak: "break-all", marginBottom: 10 }}>{stripeLink}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={copyStripe} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: stripeCopied ? "#10b981" : "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {stripeCopied ? "✓ Copié !" : "📋 Copier"}
            </button>
            <button onClick={shareWA} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#25d366", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <span>📱</span> Envoyer via WhatsApp
            </button>
            <a href={stripeLink} target="_blank" rel="noopener noreferrer"
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              🔗 Tester
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   log-003 — INTERVENTIONS TAB
   Suivi des interventions / travaux prestataires, stocké en localStorage
═══════════════════════════════════════════════════════════════════ */
const INTER_KEY = "ldb_interventions_v1";
const INTER_TYPES = ["Ménage", "Plomberie", "Électricité", "Jardinage", "Piscine", "Climatisation", "Serrurerie", "Peinture", "Électroménager", "Autre"];
const INTER_STATUS = [
  { v: "todo",       label: "À planifier", color: "#f59e0b" },
  { v: "scheduled",  label: "Planifiée",   color: "#0ea5e9" },
  { v: "done",       label: "Terminée",    color: "#10b981" },
  { v: "cancelled",  label: "Annulée",     color: "#64748b" },
];
function InterventionsTab({ biens, mob }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem(INTER_KEY) || "[]"); } catch { return []; } });
  const [form, setForm] = useState({ bienId: biens[0]?.id || "", type: "Ménage", date: "", prestataire: "", cost: "", notes: "", status: "todo" });
  const [show, setShow] = useState(false);
  const [filter, setFilter] = useState("all");

  function save(arr) { setItems(arr); try { localStorage.setItem(INTER_KEY, JSON.stringify(arr)); } catch {} }
  function add() {
    if (!form.date || !form.bienId) return;
    save([{ id: Date.now(), ...form }, ...items]);
    setForm(f => ({ ...f, date: "", prestataire: "", cost: "", notes: "", status: "todo" }));
    setShow(false);
  }
  function toggle(id, field, val) { save(items.map(i => i.id === id ? { ...i, [field]: val } : i)); }
  function del(id) { if (window.confirm("Supprimer cette intervention ?")) save(items.filter(i => i.id !== id)); }

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const stats = INTER_STATUS.map(s => ({ ...s, count: items.filter(i => i.status === s.v).length }));

  const card = { background: "#1e293b", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 };
  const inp  = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, boxSizing: "border-box" };
  const lbl  = { fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3, display: "block" };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>🔨 Suivi des interventions</h2>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>{items.length} intervention{items.length !== 1 ? "s" : ""} enregistrée{items.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShow(s => !s)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          + Nouvelle
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.v} onClick={() => setFilter(filter === s.v ? "all" : s.v)} style={{ ...card, marginBottom: 0, textAlign: "center", cursor: "pointer", borderColor: filter === s.v ? s.color : "rgba(255,255,255,0.06)", padding: "12px 8px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire ajout */}
      {show && (
        <div style={{ ...card, borderColor: "rgba(14,165,233,0.3)", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 700, marginBottom: 12 }}>Nouvelle intervention</div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Logement</label>
              <select value={form.bienId} onChange={e => setForm(f => ({ ...f, bienId: e.target.value }))} style={inp}>
                {biens.map(b => <option key={b.id} value={b.id}>{b.emoji || "🏠"} {b.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                {INTER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Prestataire</label>
              <input type="text" placeholder="Nom / contact" value={form.prestataire} onChange={e => setForm(f => ({ ...f, prestataire: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Coût (€)</label>
              <input type="number" placeholder="0" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Statut</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>
                {INTER_STATUS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: mob ? "1" : "1/-1" }}>
              <label style={lbl}>Notes</label>
              <input type="text" placeholder="Détails, références, …" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inp} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={add} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓ Enregistrer</button>
            <button onClick={() => setShow(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 24px", color: "#475569" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔨</div>
          <div style={{ fontSize: 13 }}>{filter === "all" ? "Aucune intervention enregistrée" : "Aucune intervention dans cette catégorie"}</div>
        </div>
      ) : filtered.map(item => {
        const b = biens.find(x => x.id === item.bienId);
        const st = INTER_STATUS.find(s => s.v === item.status) || INTER_STATUS[0];
        return (
          <div key={item.id} style={card}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{item.type}</span>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{b?.emoji || "🏠"} {b?.nom || item.bienId}</span>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: `${st.color}22`, color: st.color, fontWeight: 600 }}>{st.label}</span>
                  {item.cost > 0 && <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>{Number(item.cost).toLocaleString("fr-FR")} €</span>}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  📅 {item.date}{item.prestataire && ` · 👷 ${item.prestataire}`}
                </div>
                {item.notes && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, fontStyle: "italic" }}>{item.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <select value={item.status} onChange={e => toggle(item.id, "status", e.target.value)}
                  style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 10, cursor: "pointer" }}>
                  {INTER_STATUS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
                </select>
                <button onClick={() => del(item.id)} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.12)", color: "#f87171", fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   log-004 — STOCK TRACKER TAB
   Niveaux min/max par propriété, alertes sous le seuil
═══════════════════════════════════════════════════════════════════ */
const STOCK_KEY = "ldb_stocks_v1";
const STOCK_DEFAULTS = [
  { cat: "Linge", items: ["Draps 2p", "Draps 1p", "Taies d'oreiller", "Serviettes bain", "Serviettes main", "Peignoirs"] },
  { cat: "Cuisine", items: ["Éponges", "Liquide vaisselle", "Sacs poubelle", "Papier essuie-tout", "Café capsules", "Thé sachets"] },
  { cat: "Salle de bain", items: ["Gel douche", "Shampoing", "Savon", "PQ rouleaux", "Coton-tiges"] },
  { cat: "Piscine / Jardin", items: ["Chlore tablettes", "Anticalcaire", "Crème solaire (stock)", "Brassards enfants"] },
];
function StockTrackerTab({ biens, mob }) {
  const [stocks, setStocks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STOCK_KEY) || "{}"); } catch { return {}; }
  });
  const [selBien, setSelBien] = useState(biens[0]?.id || "");

  function getStock(bienId, cat, item) { return stocks[bienId]?.[cat]?.[item] || { qty: 0, min: 2, max: 10 }; }
  function setField(bienId, cat, item, field, val) {
    setStocks(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[bienId]) next[bienId] = {};
      if (!next[bienId][cat]) next[bienId][cat] = {};
      if (!next[bienId][cat][item]) next[bienId][cat][item] = { qty: 0, min: 2, max: 10 };
      next[bienId][cat][item][field] = Number(val);
      try { localStorage.setItem(STOCK_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const allAlerts = biens.flatMap(b => STOCK_DEFAULTS.flatMap(c => c.items.map(item => {
    const s = getStock(b.id, c.cat, item);
    return s.qty < s.min ? { bienId: b.id, bienNom: b.nom, cat: c.cat, item, qty: s.qty, min: s.min } : null;
  }))).filter(Boolean);

  const cardBase = { background: "#1e293b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16, overflow: "hidden" };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>📦 Stock tracker</h2>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>Niveaux de stock par logement · alertes sous le seuil minimum</p>
      </div>

      {allAlerts.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#f87171", fontWeight: 700, marginBottom: 6 }}>⚠️ {allAlerts.length} article{allAlerts.length > 1 ? "s" : ""} sous le seuil minimum</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allAlerts.map((a, i) => (
              <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                {a.bienNom} · {a.item} ({a.qty}/{a.min})
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {biens.map(b => (
          <button key={b.id} onClick={() => setSelBien(b.id)}
            style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: selBien === b.id ? "#0ea5e9" : "rgba(255,255,255,0.06)", color: selBien === b.id ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {b.emoji || "🏠"} {b.nom}
          </button>
        ))}
      </div>

      {STOCK_DEFAULTS.map(cat => (
        <div key={cat.cat} style={cardBase}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{cat.cat}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "#475569", fontWeight: 600 }}>Article</th>
                  <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 10, color: "#475569", fontWeight: 600, width: 70 }}>Qté</th>
                  <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 10, color: "#475569", fontWeight: 600, width: 60 }}>Min</th>
                  <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 10, color: "#475569", fontWeight: 600, width: 60 }}>Max</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "#475569", fontWeight: 600, width: 100 }}>État</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map(item => {
                  const s = getStock(selBien, cat.cat, item);
                  const pct = s.max > 0 ? Math.min(100, Math.round(s.qty / s.max * 100)) : 0;
                  const color = s.qty < s.min ? "#ef4444" : s.qty < s.min * 1.5 ? "#f59e0b" : "#10b981";
                  return (
                    <tr key={item} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#e2e8f0" }}>{item}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        <input type="number" min="0" value={s.qty}
                          onChange={e => setField(selBien, cat.cat, item, "qty", e.target.value)}
                          style={{ width: 52, padding: "4px 6px", borderRadius: 6, border: `1px solid ${color}44`, background: "#0f172a", color, fontSize: 12, textAlign: "center" }} />
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        <input type="number" min="0" value={s.min}
                          onChange={e => setField(selBien, cat.cat, item, "min", e.target.value)}
                          style={{ width: 44, padding: "4px 4px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#94a3b8", fontSize: 11, textAlign: "center" }} />
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        <input type="number" min="0" value={s.max}
                          onChange={e => setField(selBien, cat.cat, item, "max", e.target.value)}
                          style={{ width: 44, padding: "4px 4px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#94a3b8", fontSize: 11, textAlign: "center" }} />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
                          </div>
                          <span style={{ fontSize: 10, color, fontWeight: 600, minWidth: 28 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   log-006 — LINGE TAB
   Dashboard rotation linge : stock draps/serviettes par logement
═══════════════════════════════════════════════════════════════════ */
const LINGE_KEY   = "ldb_linge_v1";
const LINGE_SETS  = ["Draps 2 personnes", "Draps 1 personne", "Serviettes bain", "Serviettes main", "Housses de couette", "Oreillers housses", "Tapis de bain"];
const LINGE_STATES = [
  { v: "propre",   label: "Propre",    color: "#10b981", icon: "✓" },
  { v: "utilise",  label: "Utilisé",   color: "#f59e0b", icon: "≈" },
  { v: "lavage",   label: "Au lavage", color: "#0ea5e9", icon: "↺" },
  { v: "manque",   label: "Manquant",  color: "#ef4444", icon: "!" },
];
function LingeTab({ biens, mob }) {
  const [data, setData] = useState(() => { try { return JSON.parse(localStorage.getItem(LINGE_KEY) || "{}"); } catch { return {}; } });
  const [sel, setSel] = useState(biens[0]?.id || "");
  const [log, setLog] = useState([]);

  function getEntry(bienId, set) { return data[bienId]?.[set] || { qty: 0, state: "propre" }; }
  function setField(bienId, set, field, val) {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[bienId]) next[bienId] = {};
      if (!next[bienId][set]) next[bienId][set] = { qty: 0, state: "propre" };
      next[bienId][set][field] = val;
      try { localStorage.setItem(LINGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    if (field === "state") {
      const b = biens.find(x => x.id === bienId);
      setLog(prev => [{ ts: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), msg: `${b?.nom || bienId} · ${set} → ${val}` }, ...prev.slice(0, 9)]);
    }
  }

  const totalPropre = biens.reduce((acc, b) => acc + LINGE_SETS.filter(s => getEntry(b.id, s).state === "propre").length, 0);
  const totalLavage = biens.reduce((acc, b) => acc + LINGE_SETS.filter(s => getEntry(b.id, s).state === "lavage").length, 0);
  const totalManque = biens.reduce((acc, b) => acc + LINGE_SETS.filter(s => getEntry(b.id, s).state === "manque").length, 0);

  const lingeCard = { background: "#1e293b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>🛏️ Rotation linge</h2>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>Suivi du stock de linge par logement · état en temps réel</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Sets propres", val: totalPropre, color: "#10b981" },
          { label: "Au lavage",    val: totalLavage, color: "#0ea5e9" },
          { label: "Manquants",    val: totalManque, color: "#ef4444" },
        ].map(k => (
          <div key={k.label} style={{ ...lingeCard, marginBottom: 0, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {biens.map(b => {
          const manque = LINGE_SETS.filter(s => getEntry(b.id, s).state === "manque").length;
          return (
            <button key={b.id} onClick={() => setSel(b.id)}
              style={{ position: "relative", padding: "6px 14px", borderRadius: 20, border: "none", background: sel === b.id ? "#0ea5e9" : "rgba(255,255,255,0.06)", color: sel === b.id ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {b.emoji || "🏠"} {b.nom}
              {manque > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 99, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{manque}</span>}
            </button>
          );
        })}
      </div>

      <div style={lingeCard}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#f1f5f9", fontWeight: 600 }}>
          {biens.find(b => b.id === sel)?.emoji || "🏠"} {biens.find(b => b.id === sel)?.nom}
        </div>
        {LINGE_SETS.map(set => {
          const e = getEntry(sel, set);
          const st = LINGE_STATES.find(s => s.v === e.state) || LINGE_STATES[0];
          return (
            <div key={set} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 12, color: "#e2e8f0" }}>{set}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" min="0" value={e.qty} onChange={ev => setField(sel, set, "qty", Number(ev.target.value))}
                  style={{ width: 48, padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, textAlign: "center" }} />
                <span style={{ fontSize: 10, color: "#64748b" }}>sets</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {LINGE_STATES.map(s => (
                  <button key={s.v} onClick={() => setField(sel, set, "state", s.v)}
                    title={s.label}
                    style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${e.state === s.v ? s.color : "rgba(255,255,255,0.08)"}`, background: e.state === s.v ? `${s.color}22` : "transparent", color: e.state === s.v ? s.color : "#475569", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                    {s.icon}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 10, minWidth: 64, color: st.color, fontWeight: 600 }}>{st.label}</span>
            </div>
          );
        })}
      </div>

      {log.length > 0 && (
        <div style={{ ...lingeCard, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Journal de la session</div>
          {log.map((l, i) => <div key={i} style={{ fontSize: 10, color: "#94a3b8", padding: "2px 0" }}><span style={{ color: "#475569" }}>{l.ts}</span> {l.msg}</div>)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   data-008 — CONVERSION TAB
   Taux de conversion par canal de réservation
═══════════════════════════════════════════════════════════════════ */
function ConversionTab({ biens, reservations, mob }) {
  const [period, setPeriod] = useState("12");

  const cutoff = (() => {
    const d = new Date();
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
          <option value="3">3 derniers mois</option>
          <option value="6">6 derniers mois</option>
          <option value="12">12 derniers mois</option>
          <option value="24">24 derniers mois</option>
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

/* ═══════════════════════════════════════════════════════════════════
   ORCHESTRATEUR TAB — interface multi-agents avec mémoire
   Coordonne les 17 agents via claude-sonnet, stocke les runs en D1
═══════════════════════════════════════════════════════════════════ */
function OrchestratorTab({ mob }) {
  const [runs,     setRuns]     = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [running,  setRunning]  = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [memAgent, setMemAgent] = useState("all");
  const [initDone, setInitDone] = useState(false);

  // Charge les runs et les mémoires
  async function loadData() {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/orchestrator").then(r => r.json()),
        fetch("/api/agent-memory").then(r => r.json()),
      ]);
      setRuns(r1.runs || []);
      setMemories(r2.memories || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  // Déclenche une orchestration
  async function triggerOrchestration() {
    setRunning(true);
    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual", event_data: { source: "admin_dashboard", ts: Date.now() } }),
      });
      const data = await res.json();
      if (data.run) {
        setRuns(prev => [data.run, ...prev.slice(0, 19)]);
        setExpanded(data.run.id);
      }
    } catch {}
    setRunning(false);
    await loadData();
  }

  // Initialise les tables D1 (si première utilisation)
  async function initTables() {
    try {
      await fetch("/api/agents-actions?action=init", { method: "POST" });
      setInitDone(true);
      await loadData();
    } catch {}
  }

  const oCard = { background: "#1e293b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 10, overflow: "hidden" };
  const PRIO_COLOR = { critique: "#ef4444", haute: "#f59e0b", moyenne: "#0ea5e9", basse: "#64748b" };

  // Agents par catégorie pour la visualisation réseau
  const AGENT_GROUPS = [
    { label: "Juridique & Sécurité", color: "#ef4444", agents: ["juriste-compliance", "architecte-reseau"] },
    { label: "Tech & Infra",         color: "#0ea5e9", agents: ["webmaster", "developpeur-multimedia"] },
    { label: "Revenu & Commerce",    color: "#10b981", agents: ["revenue-manager", "consultant-ebusiness", "commercial-publicite"] },
    { label: "Acquisition",          color: "#f59e0b", agents: ["traffic-manager", "data-analyst", "seo-content-writer"] },
    { label: "Client & CRM",         color: "#a855f7", agents: ["crm-manager", "responsable-service-client", "community-manager"] },
    { label: "Ops & Logistique",     color: "#64748b", agents: ["responsable-logistique", "photographe-da", "webdesigner", "chef-produit-web"] },
  ];

  const filteredMems = memAgent === "all" ? memories : memories.filter(m => m.agent === memAgent);
  const agentList = [...new Set(memories.map(m => m.agent))].sort();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#f1f5f9" }}>🧠 Orchestrateur multi-agents</h2>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>
            Claude Sonnet coordonne les 17 agents · mémoire persistante D1 · décisions cross-fonctionnelles
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={initTables} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer" }}>
            ⚙️ Init D1
          </button>
          <button onClick={loadData} disabled={loading} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
            {loading ? "⟳" : "↺ Actualiser"}
          </button>
          <button onClick={triggerOrchestration} disabled={running}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: running ? "#334155" : "linear-gradient(135deg,#7c3aed,#0ea5e9)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: running ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {running ? "⏳ Orchestration en cours…" : "▶ Déclencher l'orchestration"}
          </button>
        </div>
      </div>

      {/* Architecture réseau agents */}
      <div style={{ ...oCard, marginBottom: 16, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Architecture du réseau d'agents</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(3, 1fr)", gap: 8 }}>
          {AGENT_GROUPS.map(g => (
            <div key={g.label} style={{ background: `${g.color}0d`, border: `1px solid ${g.color}33`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: g.color, fontWeight: 700, marginBottom: 6 }}>{g.label}</div>
              {g.agents.map(a => {
                const mem = memories.filter(m => m.agent === a);
                return (
                  <div key={a} style={{ fontSize: 10, color: "#94a3b8", padding: "2px 0", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: mem.length > 0 ? g.color : "#334155", display: "inline-block", flexShrink: 0 }} />
                    {a.replace("responsable-", "").replace("-", " ")}
                    {mem.length > 0 && <span style={{ color: g.color, fontSize: 9 }}>·{mem.length}mem</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "#334155", marginTop: 8 }}>
          🟢 Agent avec mémoire active · ⚫ Agent sans mémoire (non encore analysé)
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "3fr 2fr", gap: 12 }}>

        {/* Colonne gauche : runs d'orchestration */}
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Runs d'orchestration ({runs.length})
          </div>

          {runs.length === 0 ? (
            <div style={{ ...oCard, padding: "32px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🧠</div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 6 }}>Aucun run d'orchestration</div>
              <div style={{ fontSize: 11, color: "#334155" }}>Clique "Déclencher l'orchestration" pour lancer la première analyse coordonnée</div>
            </div>
          ) : runs.map(run => {
            const isExp = expanded === run.id;
            const date  = new Date(run.created_at * 1000).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
            const dur   = run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—";

            let urgences  = [];
            let synergies = [];
            let decisions = [];
            try { urgences  = JSON.parse(run.urgences  || "[]"); } catch {}
            try { synergies = JSON.parse(run.synergies || "[]"); } catch {}
            try { decisions = JSON.parse(run.decisions || "[]"); } catch {}

            return (
              <div key={run.id} style={oCard}>
                <div onClick={() => setExpanded(isExp ? null : run.id)}
                  style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: run.status === "done" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: run.status === "done" ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                        {run.status === "done" ? "✓ Terminé" : "⟳ En cours"}
                      </span>
                      <span style={{ fontSize: 10, color: "#475569" }}>{run.trigger}</span>
                      <span style={{ fontSize: 10, color: "#334155" }}>{dur}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{date}</div>
                    {run.summary && <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 6, lineHeight: 1.5 }}>{run.summary.slice(0, 160)}{run.summary.length > 160 ? "…" : ""}</div>}
                  </div>
                  <span style={{ color: "#475569", fontSize: 14, flexShrink: 0 }}>{isExp ? "▲" : "▼"}</span>
                </div>

                {isExp && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px" }}>
                    {run.summary && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>SYNTHÈSE</div>
                        <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}>{run.summary}</div>
                      </div>
                    )}
                    {urgences.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 600, marginBottom: 6 }}>🚨 URGENCES ({urgences.length})</div>
                        {urgences.map((u, i) => (
                          <div key={i} style={{ fontSize: 11, color: "#fca5a5", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <strong style={{ color: "#f87171" }}>{u.action_id}</strong> — {u.raison}
                          </div>
                        ))}
                      </div>
                    )}
                    {synergies.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: "#a855f7", fontWeight: 600, marginBottom: 6 }}>🔗 SYNERGIES ({synergies.length})</div>
                        {synergies.map((s, i) => (
                          <div key={i} style={{ fontSize: 11, color: "#c4b5fd", padding: "4px 0" }}>
                            <strong>{(s.agents || []).join(" + ")}</strong> — {s.opportunite}
                          </div>
                        ))}
                      </div>
                    )}
                    {decisions.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 600, marginBottom: 6 }}>⚡ DÉCISIONS ({decisions.length})</div>
                        {decisions.map((d, i) => (
                          <div key={i} style={{ fontSize: 11, color: "#7dd3fc", padding: "4px 8px", background: "rgba(14,165,233,0.06)", borderRadius: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", marginRight: 6 }}>{d.type}</span>
                            {d.details}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Colonne droite : mémoires agents */}
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Mémoire agents ({memories.length} entrées)
          </div>

          {/* Filtre agent */}
          <select value={memAgent} onChange={e => setMemAgent(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 11, marginBottom: 10, cursor: "pointer" }}>
            <option value="all">Tous les agents</option>
            {agentList.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {filteredMems.length === 0 ? (
            <div style={{ ...oCard, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#475569" }}>Aucune mémoire — lance un run d'agents pour alimenter la mémoire</div>
            </div>
          ) : (
            <div style={oCard}>
              {filteredMems.map((m, i) => {
                let val = m.value;
                try { const parsed = JSON.parse(m.value); val = parsed.action || parsed; } catch {}
                const date = m.created_at ? new Date(m.created_at * 1000).toLocaleDateString("fr-FR") : "—";
                return (
                  <div key={i} style={{ padding: "9px 14px", borderBottom: i < filteredMems.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 600 }}>{m.key}</span>
                      <span style={{ fontSize: 9, color: "#334155" }}>{date}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{m.agent}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, wordBreak: "break-word" }}>
                      {typeof val === "string" ? val.slice(0, 120) : JSON.stringify(val).slice(0, 120)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info migration */}
          <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8, fontSize: 10, color: "#78716c" }}>
            <div style={{ color: "#f59e0b", fontWeight: 600, marginBottom: 4 }}>ℹ️ Première utilisation</div>
            Si les tables D1 ne sont pas encore créées en production, clique "⚙️ Init D1" pour les initialiser. Les tables <code style={{ color: "#94a3b8" }}>agent_memory</code> et <code style={{ color: "#94a3b8" }}>orchestrator_runs</code> seront créées sans toucher aux données existantes.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SOCIAL TAB — Instagram + Facebook publishing
═══════════════════════════════════════════════════════════════ */
function SocialTab({ mob }) {
  const [status, setStatus]   = useState(null);
  const [posts, setPosts]     = useState({ ig: [], fb: [] });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingPosts, setLoadingPosts]   = useState(true);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [channels, setChannels] = useState(["ig", "fb"]);
  const [publishing, setPublishing] = useState(false);
  const [pubResult, setPubResult] = useState(null);
  const [view, setView] = useState("composer"); // composer | feed

  useEffect(() => {
    fetch("/api/social?action=status")
      .then(r => r.json()).then(setStatus).catch(() => setStatus({ error: true }))
      .finally(() => setLoadingStatus(false));
    fetch("/api/social?action=posts&limit=9")
      .then(r => r.json()).then(setPosts).catch(() => setPosts({ ig: [], fb: [] }))
      .finally(() => setLoadingPosts(false));
  }, []);

  async function publish() {
    if (!caption.trim()) return;
    setPublishing(true); setPubResult(null);
    try {
      const r = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", caption, imageUrl: imageUrl.trim() || undefined, channels }),
      });
      const d = await r.json();
      setPubResult(d);
      if (d.ok) { setCaption(""); setImageUrl(""); }
    } catch (e) {
      setPubResult({ error: e.message });
    } finally {
      setPublishing(false);
    }
  }

  function toggleChannel(ch) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  }

  const card = { background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px", marginBottom: 14 };
  const label = { fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 };
  const inp = { width: "100%", background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, padding: "10px 12px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" };

  // ── Status bar ──────────────────────────────────────────────
  function StatusBar() {
    if (loadingStatus) return <div style={{ height: 44, background: "#1e293b", borderRadius: 10, marginBottom: 14, animation: "pulse 1.5s infinite" }} />;
    const s = status || {};
    const daysLeft = s.token?.expiresIn;
    const tokenColor = daysLeft > 14 ? "#10b981" : daysLeft > 5 ? "#f59e0b" : "#ef4444";
    return (
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {/* Facebook */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 14px", flex: 1, minWidth: 160 }}>
          <span style={{ fontSize: 18 }}>📘</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{s.page?.name || "Facebook"}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{s.page?.followers_count?.toLocaleString("fr-FR") || "—"} abonnés</div>
          </div>
          <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: s.page?.id ? "#10b981" : "#ef4444" }} />
        </div>
        {/* Instagram */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 14px", flex: 1, minWidth: 160 }}>
          <span style={{ fontSize: 18 }}>📸</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>
              {s.ig?.username ? `@${s.ig.username}` : "@amaryllislocations"}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{s.ig?.followers_count?.toLocaleString("fr-FR") || "—"} abonnés</div>
          </div>
          <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: s.ig ? "#10b981" : "#f59e0b" }} />
        </div>
        {/* Token expiry */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 14px", minWidth: 130 }}>
          <span style={{ fontSize: 16 }}>🔑</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokenColor }}>
              {daysLeft != null ? `${daysLeft}j restants` : "Token"}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Expire dans</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Sub-tabs ─────────────────────────────────────────────────
  const subTabs = [{ id: "composer", l: "✍️ Composer" }, { id: "feed", l: "📸 Feed" }];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: mob ? "8px 0" : "12px 0" }}>
      <StatusBar />

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
            background: view === t.id ? "rgba(99,102,241,0.2)" : "transparent",
            color: view === t.id ? "#818cf8" : "#64748b",
            outline: view === t.id ? "1px solid rgba(99,102,241,0.3)" : "none",
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── COMPOSER ── */}
      {view === "composer" && (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 320px", gap: 14, alignItems: "start" }}>
          {/* Left — form */}
          <div>
            <div style={card}>
              <div style={label}>Légende / Caption</div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Découvrez la vue imprenable depuis Villa Amaryllis… 🌊☀️ #Martinique #LocationLuxe"
                rows={5}
                style={{ ...inp, minHeight: 120 }}
                maxLength={2200}
              />
              <div style={{ textAlign: "right", fontSize: 10, color: caption.length > 2000 ? "#ef4444" : "#475569", marginTop: 4 }}>
                {caption.length}/2200
              </div>
            </div>

            <div style={card}>
              <div style={label}>URL de l'image</div>
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/…  ou  https://villamaryllis.com/…"
                style={{ ...inp, resize: "none" }}
              />
              <div style={{ fontSize: 10, color: "#475569", marginTop: 6 }}>
                💡 L'image doit être accessible publiquement (HTTPS). Instagram l'héberge ensuite sur ses serveurs.
              </div>
            </div>

            <div style={card}>
              <div style={label}>Canaux de publication</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ id: "ig", label: "📸 Instagram", color: "#e1306c" }, { id: "fb", label: "📘 Facebook", color: "#1877f2" }].map(ch => (
                  <button key={ch.id} onClick={() => toggleChannel(ch.id)} style={{
                    padding: "8px 18px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: channels.includes(ch.id) ? `1px solid ${ch.color}` : "1px solid rgba(255,255,255,0.1)",
                    background: channels.includes(ch.id) ? `${ch.color}22` : "transparent",
                    color: channels.includes(ch.id) ? ch.color : "#64748b",
                  }}>{ch.label}</button>
                ))}
              </div>
            </div>

            <button
              onClick={publish}
              disabled={publishing || !caption.trim() || channels.length === 0}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: publishing || !caption.trim() ? "not-allowed" : "pointer",
                border: "none",
                background: publishing || !caption.trim() ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: publishing || !caption.trim() ? "#475569" : "#fff",
                transition: "opacity 0.2s",
              }}
            >
              {publishing ? "Publication en cours…" : "🚀 Publier maintenant"}
            </button>

            {pubResult && (
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: pubResult.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${pubResult.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                {pubResult.ok
                  ? <div style={{ color: "#10b981", fontWeight: 700 }}>✅ Publié avec succès !</div>
                  : <div style={{ color: "#ef4444", fontWeight: 700 }}>❌ {pubResult.error || "Erreur de publication"}</div>
                }
                {pubResult.results && Object.entries(pubResult.results).map(([ch, r]) => (
                  <div key={ch} style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {ch.toUpperCase()}: {r.ok ? `✅ ID ${r.id}` : `❌ ${r.error}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — preview */}
          <div>
            <div style={{ ...card, position: "sticky", top: 12 }}>
              <div style={label}>Aperçu</div>
              <div style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🌺</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>amaryllislocations</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Martinique · À l'instant</div>
                  </div>
                </div>
                {/* Image */}
                {imageUrl ? (
                  <img src={imageUrl} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
                ) : (
                  <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg,#1e293b,#0f172a)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 36, opacity: 0.3 }}>🏝️</span>
                    <span style={{ fontSize: 11, color: "#334155" }}>Aucune image</span>
                  </div>
                )}
                {/* Caption */}
                <div style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>amaryllislocations </span>
                  <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {caption || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Votre légende…</span>}
                  </span>
                </div>
                {/* Likes */}
                <div style={{ padding: "6px 12px 10px", fontSize: 11, color: "#64748b", display: "flex", gap: 14 }}>
                  <span>❤️ 0 J'aime</span>
                  <span>💬 0 commentaires</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FEED ── */}
      {view === "feed" && (
        <div>
          {loadingPosts ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3 }}>
              {Array(9).fill(0).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1/1", background: "#1e293b", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : posts.ig.length === 0 && posts.fb.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune publication récente</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Les posts Instagram/Facebook apparaîtront ici</div>
            </div>
          ) : (
            <div>
              {posts.ig.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>📸 Instagram récents</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8 }}>
                    {posts.ig.map(p => (
                      <a key={p.id} href={p.permalink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <div style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.2s" }}>
                          {(p.media_url || p.thumbnail_url) && (
                            <img src={p.media_url || p.thumbnail_url} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                          )}
                          <div style={{ padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {p.caption || "—"}
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 10, color: "#475569" }}>
                              <span>❤️ {p.like_count || 0}</span>
                              <span>💬 {p.comments_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {posts.fb.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>📘 Facebook récents</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {posts.fb.map(p => (
                      <div key={p.id} style={card}>
                        {p.full_picture && <img src={p.full_picture} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} />}
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{p.message?.slice(0, 200) || "—"}</div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 6 }}>{new Date(p.created_time).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APPROBATIONS TAB — Review & publish AI-generated drafts
═══════════════════════════════════════════════════════════════ */
function ApprobationsTab({ mob }) {
  const [drafts, setDrafts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("pending");
  const [acting, setActing]     = useState(null);
  const [toast, setToast]       = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editPayload, setEditPayload] = useState(null);

  async function loadDrafts() {
    setLoading(true);
    try {
      const r = await fetch(`/api/agent-drafts?status=${filter === "all" ? "" : filter}&limit=100`);
      const d = await r.json();
      setDrafts(d.drafts || []);
    } catch (e) {
      setToast({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDrafts(); }, [filter]);

  async function act(id, action) {
    setActing(id);
    try {
      const r = await fetch(`/api/agent-drafts?id=${id}&action=${action}`, { method: "PATCH" });
      const d = await r.json();
      const msgs = {
        approve: "✅ Approuvé",
        reject:  "🚫 Rejeté",
        publish: d.ok ? "🚀 Publié avec succès !" : `❌ Échec : ${d.result?.error || "erreur"}`,
        improve: d.ok ? `🎯 Amélioré ! ${d.previous_score || 0}/100 → ${d.new_score || "?"}/100` : `❌ Échec amélioration: ${d.error || ""}`,
      };
      setToast({ message: msgs[action] || "OK", success: d.ok });
      loadDrafts();
    } catch (e) {
      setToast({ error: e.message });
    } finally {
      setActing(null);
      setTimeout(() => setToast(null), 5000);
    }
  }

  async function saveEdit(id) {
    try {
      await fetch(`/api/agent-drafts?id=${id}&action=edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: editPayload }),
      });
      setEditingId(null);
      setEditPayload(null);
      setToast({ message: "💾 Modifications sauvées", success: true });
      loadDrafts();
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setToast({ error: e.message });
    }
  }

  const counts = drafts.reduce((acc, d) => ({ ...acc, [d.status]: (acc[d.status]||0) + 1 }), {});
  const filters = [
    { id: "pending",   label: "🟡 En attente",   color: "#f59e0b" },
    { id: "approved",  label: "✅ Approuvés",    color: "#10b981" },
    { id: "published", label: "🚀 Publiés",      color: "#6366f1" },
    { id: "rejected",  label: "🚫 Rejetés",      color: "#64748b" },
    { id: "failed",    label: "❌ Échecs",       color: "#ef4444" },
    { id: "all",       label: "Tous",            color: "#94a3b8" },
  ];

  const btnStyle = (color, outline = false, disabled = false) => ({
    padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer", border: outline ? `1px solid ${color}44` : "none",
    background: outline ? "transparent" : color,
    color: outline ? color : "#fff",
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: mob ? "8px 0" : "12px 0" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>📥 Approbations</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Brouillons générés par les agents IA — relis, modifie, approuve ou publie.
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
            background: filter === f.id ? `${f.color}22` : "transparent",
            color: filter === f.id ? f.color : "#64748b",
            outline: filter === f.id ? `1px solid ${f.color}44` : "none",
          }}>
            {f.label}{filter !== f.id && counts[f.id] > 0 ? ` (${counts[f.id]})` : ""}
          </button>
        ))}
      </div>

      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, padding: "10px 16px", borderRadius: 10, zIndex: 1000,
          background: toast.error ? "rgba(239,68,68,0.95)" : toast.success ? "rgba(16,185,129,0.95)" : "rgba(99,102,241,0.95)",
          color: "#fff", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>{toast.message || toast.error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Chargement…</div>
      ) : drafts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun brouillon</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Lance "Run agents" depuis l'onglet Agents pour générer du contenu</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {drafts.map(d => {
            let payload = {};
            try { payload = JSON.parse(d.payload); } catch {}
            const isEditing = editingId === d.id;
            const editing = isEditing ? (editPayload || payload) : payload;

            return (
              <div key={d.id} style={{
                background: "#1e293b",
                border: `1px solid ${d.status === "pending" ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 18 }}>{d.agent_emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{d.agent_label}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>
                      {d.type === "social_post" ? "📣 Post réseaux sociaux" : d.type === "email_campaign" ? "📧 Email" : d.type}
                      {" · "}{new Date(d.created_at * 1000).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                    background: d.status === "pending" ? "rgba(245,158,11,0.15)" : d.status === "approved" ? "rgba(16,185,129,0.15)" : d.status === "published" ? "rgba(99,102,241,0.15)" : "rgba(100,116,139,0.15)",
                    color: d.status === "pending" ? "#f59e0b" : d.status === "approved" ? "#10b981" : d.status === "published" ? "#6366f1" : d.status === "failed" ? "#ef4444" : "#94a3b8",
                  }}>{d.status}</span>
                </div>

                {d.rationale && (
                  <div style={{ padding: "8px 14px", fontSize: 11, color: "#94a3b8", fontStyle: "italic", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    💭 {d.rationale}
                  </div>
                )}

                {/* Reviews des agents validateurs */}
                {d.reviews && (() => {
                  let r = null; try { r = JSON.parse(d.reviews); } catch {}
                  if (!r) return null;
                  const scoreColor = r.score >= 80 ? "#10b981" : r.score >= 60 ? "#f59e0b" : "#ef4444";
                  const verdictBadge = {
                    approve:     { label: "✅ Approuvé par les agents", color: "#10b981" },
                    needs_edits: { label: "⚠️ Améliorations suggérées",  color: "#f59e0b" },
                    reject:      { label: "🚫 Rejeté par les agents",   color: "#ef4444" },
                  }[r.verdict] || { label: r.verdict, color: "#94a3b8" };
                  return (
                    <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: verdictBadge.color, padding: "2px 8px", borderRadius: 10, background: `${verdictBadge.color}15` }}>
                          {verdictBadge.label}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor }}>
                          Score : {r.score}/100
                        </span>
                        {r.score_after_improve && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981" }}>
                            🎯 Amélioré : {r.previous_score || r.score}/100 → {r.score_after_improve}/100
                          </span>
                        )}
                      </div>
                      {r.traffic_manager && (
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>
                          <span style={{ color: "#e2e8f0" }}>📈 Traffic Manager</span> ({r.traffic_manager.note}/10) — {r.traffic_manager.feedback}
                        </div>
                      )}
                      {r.seo_writer && (
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>
                          <span style={{ color: "#e2e8f0" }}>✍️ SEO Writer</span> ({r.seo_writer.note}/10) — {r.seo_writer.feedback}
                        </div>
                      )}
                      {r.improvement_notes && (
                        <div style={{ fontSize: 10, color: "#fbbf24", marginTop: 5, fontStyle: "italic" }}>
                          🎯 Améliorations : {r.improvement_notes}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {d.type === "social_post" && (
                  <div style={{ padding: "14px", display: "grid", gridTemplateColumns: payload.imageUrl && !mob ? "1fr 200px" : "1fr", gap: 14 }}>
                    <div>
                      {isEditing ? (
                        <textarea
                          value={editing.caption || ""}
                          onChange={e => setEditPayload({ ...editing, caption: e.target.value })}
                          rows={6}
                          style={{ width: "100%", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 12, padding: 10, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }}
                        />
                      ) : (
                        <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{payload.caption}</div>
                      )}
                      {isEditing && (
                        <input
                          value={editing.imageUrl || ""}
                          onChange={e => setEditPayload({ ...editing, imageUrl: e.target.value })}
                          placeholder="URL image"
                          style={{ width: "100%", marginTop: 8, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 11, padding: "8px 10px", fontFamily: "inherit", boxSizing: "border-box" }}
                        />
                      )}
                      <div style={{ display: "flex", gap: 6, marginTop: 8, fontSize: 10, color: "#64748b" }}>
                        {(payload.channels || ["ig","fb"]).map(c => (
                          <span key={c} style={{ padding: "2px 8px", borderRadius: 10, background: "rgba(255,255,255,0.05)" }}>
                            {c === "ig" ? "📸 Instagram" : "📘 Facebook"}
                          </span>
                        ))}
                      </div>
                    </div>
                    {payload.imageUrl && !mob && (
                      <img src={payload.imageUrl} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }} onError={e => { e.target.style.opacity = 0.3; }} />
                    )}
                  </div>
                )}

                {d.type === "email_campaign" && (
                  <div style={{ padding: "14px" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>À: <span style={{ color: "#94a3b8" }}>{payload.to}</span></div>
                    <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, marginBottom: 8 }}>{payload.subject}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", maxHeight: 200, overflow: "auto", padding: 10, background: "#0f172a", borderRadius: 8 }}
                         dangerouslySetInnerHTML={{ __html: payload.html || "" }} />
                  </div>
                )}

                {d.result && (
                  <div style={{ padding: "8px 14px", fontSize: 10, color: d.status === "published" ? "#10b981" : "#ef4444", fontFamily: "var(--font-mono)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {d.status === "published" ? "✅ " : "❌ "}{d.result.slice(0, 200)}
                  </div>
                )}

                {/* Affichage erreurs fact-check si présentes */}
                {(() => {
                  try {
                    const r = JSON.parse(d.reviews || "{}");
                    if (r.fact_check && !r.fact_check.passed) {
                      return (
                        <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderTop: "1px solid rgba(239,68,68,0.2)" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>🚫 Fact-check échec — phrases interdites détectées :</div>
                          {r.fact_check.errors.map((err, i) => (
                            <div key={i} style={{ fontSize: 10, color: "#fca5a5", marginBottom: 3 }}>
                              <strong>"{err.phrase}"</strong> — {err.reason}
                            </div>
                          ))}
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}

                {(d.status === "pending" || d.status === "approved") && (
                  <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "rgba(0,0,0,0.15)", flexWrap: "wrap" }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(d.id)} style={btnStyle("#10b981")}>💾 Sauver</button>
                        <button onClick={() => { setEditingId(null); setEditPayload(null); }} style={btnStyle("#64748b", true)}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <button disabled={acting === d.id} onClick={() => act(d.id, "publish")} style={btnStyle("#6366f1", false, acting === d.id)}>
                          {acting === d.id ? "..." : "🚀 Publier maintenant"}
                        </button>
                        {d.status === "pending" && <button onClick={() => act(d.id, "approve")} style={btnStyle("#10b981", true)}>✅ Approuver</button>}
                        <button disabled={acting === d.id} onClick={() => act(d.id, "improve")} style={btnStyle("#f59e0b", true, acting === d.id)} title="Régénérer en intégrant les retours des agents pour viser 100/100">
                          {acting === d.id ? "..." : "🎯 Améliorer (viser 100/100)"}
                        </button>
                        <button onClick={() => { setEditingId(d.id); setEditPayload(payload); }} style={btnStyle("#64748b", true)}>✏️ Modifier</button>
                        <button onClick={() => act(d.id, "reject")} style={btnStyle("#ef4444", true)}>🚫 Rejeter</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDITORIAL CALENDAR TAB — Planning de publication FB + IG 30 jours
═══════════════════════════════════════════════════════════════ */
function EditorialCalendarTab({ mob }) {
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [seeding, setSeeding]     = useState(false);
  const [generating, setGenerating] = useState(null);
  const [toast, setToast]         = useState(null);
  const [filterBien, setFilterBien] = useState("");
  const [view, setView]           = useState("grid"); // "list" | "grid"

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/editorial-calendar?from=2026-01-01&to=2027-12-31");
      const d = await r.json();
      setEntries(d.entries || []);
    } catch (e) { setToast({ error: e.message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function seed30() {
    if (!confirm("Générer 30 jours de planning à partir d'aujourd'hui ? (les anciens 'planned' seront conservés)")) return;
    setSeeding(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const r = await fetch("/api/editorial-calendar?action=seed_30days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: today }),
      });
      const d = await r.json();
      setToast({ message: `${d.inserted} jours planifiés ✅`, success: true });
      load();
    } catch (e) { setToast({ error: e.message }); }
    finally { setSeeding(false); setTimeout(() => setToast(null), 3500); }
  }

  async function purgeAll() {
    if (!confirm("Supprimer TOUTES les entrées 'planned' ? (les publiées sont conservées)")) return;
    try {
      await fetch("/api/editorial-calendar?all=true", { method: "DELETE" });
      setToast({ message: "Planning vidé", success: true });
      load();
    } catch (e) { setToast({ error: e.message }); }
    setTimeout(() => setToast(null), 2500);
  }

  async function genDraftNow(entry) {
    setGenerating(entry.id);
    try {
      // Brief enrichi pour community-manager
      const brief = `BRIEF CALENDAR (date=${new Date(entry.scheduled_at*1000).toLocaleDateString("fr-FR")}, bien=${entry.bien_id}, thème=${entry.theme}, variante=${entry.variante}, format=${entry.format}, photo=${entry.photo_url}, cta=${entry.cta}). Génère UN draft social_post selon ce brief précis.`;
      // ⚠️ calendar_id passé au serveur → il liera draft_id + status automatiquement
      const r = await fetch("/api/agents-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agents: ["community-manager"], brief, calendar_id: entry.id }),
      });
      const d = await r.json();
      const drafts = d.results?.[0]?.drafts || 0;
      // Pas de PATCH manuel : agents-run.js gère le statut + draft_id côté serveur
      setToast({ message: drafts > 0 ? `Draft généré ✅ (voir Approbations)` : "Échec génération", success: drafts > 0 });
      load();
    } catch (e) { setToast({ error: e.message }); }
    finally { setGenerating(null); setTimeout(() => setToast(null), 3500); }
  }

  const BIENS = [
    { id: "amaryllis",  label: "Villa Amaryllis", color: "#e91e8c" },
    { id: "zandoli",    label: "Zandoli",         color: "#10b981" },
    { id: "iguana",     label: "Villa Iguana",    color: "#f59e0b" },
    { id: "geko",       label: "Géko",            color: "#22c55e" },
    { id: "mabouya",    label: "Studio Mabouya",  color: "#ec4899" },
    { id: "schoelcher", label: "Bellevue",        color: "#3b82f6" },
    { id: "nogent",     label: "Nogent",          color: "#8b5cf6" },
  ];

  const THEMES = {
    inspiration: { color: "#6366f1", emoji: "✨" },
    preuve:      { color: "#10b981", emoji: "⭐" },
    detail:      { color: "#f59e0b", emoji: "💎" },
    reve:        { color: "#ec4899", emoji: "💭" },
    conversion:  { color: "#ef4444", emoji: "🚀" },
    lifestyle:   { color: "#06b6d4", emoji: "🌴" },
    info:        { color: "#94a3b8", emoji: "📋" },
  };

  const STATUS_COLORS = {
    planned:    { c: "#94a3b8", label: "📋 Planifié" },
    generating: { c: "#f59e0b", label: "⏳ En cours" },
    drafted:    { c: "#6366f1", label: "✏️ Draft prêt" },
    approved:   { c: "#10b981", label: "✅ Approuvé" },
    published:  { c: "#22c55e", label: "🚀 Publié" },
    failed:     { c: "#ef4444", label: "❌ Échec" },
    skipped:    { c: "#64748b", label: "🚫 Skippé" },
  };

  const filtered = filterBien
    ? entries.filter(e => e.bien_id === filterBien)
    : entries;

  // Stats de répartition
  const bienCounts = entries.reduce((acc, e) => ({ ...acc, [e.bien_id]: (acc[e.bien_id]||0) + 1 }), {});
  const statusCounts = entries.reduce((acc, e) => ({ ...acc, [e.status]: (acc[e.status]||0) + 1 }), {});

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: mob ? "8px 0" : "12px 0" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>📅 Planning éditorial</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Programme de publications FB + IG sur 30 jours · rotation des 7 biens · variantes thématiques anti-lassitude
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={seed30} disabled={seeding} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
            opacity: seeding ? 0.5 : 1,
          }}>{seeding ? "..." : "🌱 Seed 30 jours"}</button>
          <button onClick={purgeAll} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
            border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444",
          }}>🗑 Vider</button>
        </div>
      </div>

      {/* Stats répartition biens */}
      {entries.length > 0 && (
        <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Rotation des biens ({entries.length} posts)
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {BIENS.map(b => (
              <button
                key={b.id}
                onClick={() => setFilterBien(filterBien === b.id ? "" : b.id)}
                style={{
                  padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
                  background: filterBien === b.id ? b.color : `${b.color}22`,
                  color: filterBien === b.id ? "#fff" : b.color,
                }}
              >
                {b.label} · {bienCounts[b.id] || 0}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, padding: "10px 16px", borderRadius: 10, zIndex: 1000,
          background: toast.error ? "rgba(239,68,68,0.95)" : toast.success ? "rgba(16,185,129,0.95)" : "rgba(99,102,241,0.95)",
          color: "#fff", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>{toast.message || toast.error}</div>
      )}

      {/* Toggle vue Liste / Grille */}
      {entries.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[{ id: "grid", l: "🗓 Grille mois" }, { id: "list", l: "📋 Liste" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
              background: view === v.id ? "rgba(99,102,241,0.2)" : "transparent",
              color: view === v.id ? "#818cf8" : "#64748b",
              outline: view === v.id ? "1px solid rgba(99,102,241,0.3)" : "none",
            }}>{v.l}</button>
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun planning</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Clique "🌱 Seed 30 jours" pour générer le calendrier canonique</div>
        </div>
      ) : view === "grid" ? (
        /* ── VUE GRILLE MOIS ── */
        (() => {
          // Construire une grille basée sur le premier jour du mois affiché (le mois du 1er entry)
          const first = filtered[0];
          const refDate = new Date(first.scheduled_at * 1000);
          const monthStart = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), 1));
          const monthEnd   = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth() + 1, 0));
          const offset     = (monthStart.getUTCDay() + 6) % 7; // lundi=0
          const daysInMonth = monthEnd.getUTCDate();

          // Map "YYYY-MM-DD" → entry
          const entryByDate = {};
          for (const e of filtered) {
            const dt = new Date(e.scheduled_at * 1000);
            const key = dt.toISOString().slice(0, 10);
            entryByDate[key] = e;
          }

          const cells = [];
          for (let i = 0; i < offset; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), d));
            const key = dt.toISOString().slice(0, 10);
            cells.push({ day: d, date: key, entry: entryByDate[key] });
          }

          const monthLabel = refDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
          const dows = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

          return (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 10, textTransform: "capitalize" }}>{monthLabel}</div>
              {/* Header DOW */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
                {dows.map(d => (
                  <div key={d} style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textAlign: "center", textTransform: "uppercase", padding: "4px 0" }}>{d}</div>
                ))}
              </div>
              {/* Cells */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {cells.map((c, i) => {
                  if (!c) return <div key={i} style={{ minHeight: mob ? 60 : 90, background: "transparent" }} />;
                  const e = c.entry;
                  const bien = e ? (BIENS.find(b => b.id === e.bien_id) || { color: "#94a3b8", label: e.bien_id }) : null;
                  const theme = e ? (THEMES[e.theme] || { color: "#94a3b8", emoji: "•" }) : null;
                  const status = e ? (STATUS_COLORS[e.status] || { c: "#94a3b8" }) : null;
                  const isGen = e && generating === e.id;
                  return (
                    <div key={i} style={{
                      minHeight: mob ? 80 : 110, padding: "6px 8px",
                      background: e ? `${bien.color}11` : "rgba(255,255,255,0.02)",
                      border: e ? `1px solid ${bien.color}44` : "1px solid rgba(255,255,255,0.04)",
                      borderRadius: 8, fontSize: 10, position: "relative",
                      display: "flex", flexDirection: "column",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, color: e ? bien.color : "#475569" }}>{c.day}</span>
                        {e && <span style={{ width: 7, height: 7, borderRadius: "50%", background: status.c }} title={status.label} />}
                      </div>
                      {e && (
                        <>
                          <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2, lineHeight: 1.2 }}>
                            {theme.emoji} {bien.label.replace("Villa ","").slice(0, 10)}
                          </div>
                          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>{e.format}</div>
                          {/* Bouton Générer / Régénérer pour planned + failed */}
                          {(e.status === "planned" || e.status === "failed") && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); genDraftNow(e); }}
                              disabled={isGen}
                              style={{
                                marginTop: "auto", padding: "3px 6px", borderRadius: 5, fontSize: 9, fontWeight: 700,
                                border: `1px solid ${bien.color}66`, background: `${bien.color}22`, color: bien.color,
                                cursor: isGen ? "wait" : "pointer", opacity: isGen ? 0.6 : 1,
                                width: "100%",
                              }}
                            >{isGen ? "..." : (e.status === "failed" ? "🔄 Régénérer" : "✏️ Générer")}</button>
                          )}
                          {/* Lien rapide vers Approbations pour les drafts prêts */}
                          {e.status === "drafted" && (
                            <a href="#"
                              onClick={(ev) => { ev.preventDefault(); localStorage.setItem("admin_tab","approbations"); window.location.reload(); }}
                              style={{
                                marginTop: "auto", padding: "3px 6px", borderRadius: 5, fontSize: 9, fontWeight: 700,
                                border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.15)", color: "#818cf8",
                                textAlign: "center", textDecoration: "none", display: "block",
                              }}
                            >📥 Voir draft</a>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: "#64748b", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>💡 Bouton <strong style={{ color: "#e2e8f0" }}>✏️ Générer</strong> visible sur chaque jour planifié → crée le draft via community-manager.</span>
                <span>📥 Bouton <strong style={{ color: "#818cf8" }}>Voir draft</strong> sur jour "drafted" → ouvre Approbations.</span>
              </div>
            </div>
          );
        })()
      ) : (
        /* ── VUE LISTE ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(e => {
            const bien = BIENS.find(b => b.id === e.bien_id) || { color: "#94a3b8", label: e.bien_id };
            const theme = THEMES[e.theme] || { color: "#94a3b8", emoji: "•" };
            const status = STATUS_COLORS[e.status] || { c: "#94a3b8", label: e.status };
            const dt = new Date(e.scheduled_at * 1000);
            const dateStr = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
            return (
              <div key={e.id} style={{
                background: "#1e293b", border: `1px solid ${bien.color}33`, borderRadius: 10, padding: "10px 14px",
                display: "grid", gridTemplateColumns: mob ? "1fr" : "70px 1fr 120px", gap: 12, alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>{dateStr}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{e.publish_hour}</div>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${bien.color}22`, color: bien.color }}>
                      {bien.label}
                    </span>
                    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${theme.color}15`, color: theme.color }}>
                      {theme.emoji} {e.theme}
                    </span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>{e.format}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.variante} · {e.cta}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: status.c }}>{status.label}</span>
                  {(e.status === "planned" || e.status === "failed") && (
                    <button
                      onClick={() => genDraftNow(e)}
                      disabled={generating === e.id}
                      style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer",
                        border: "1px solid #6366f1", background: "transparent", color: "#6366f1",
                        opacity: generating === e.id ? 0.5 : 1,
                      }}
                    >
                      {generating === e.id ? "..." : (e.status === "failed" ? "🔄 Régénérer" : "✏️ Générer")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
