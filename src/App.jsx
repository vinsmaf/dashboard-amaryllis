import { useState, useEffect, useCallback, useRef, useMemo, Component } from "react";
import { fetchWithTimeout, fetchJSON } from "./lib/apiFetch.js";
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
import CpaCanalTab from "./tabs/CpaCanalTab.jsx";
import CalendrierTarifs from "./tabs/CalendrierTarifs.jsx";
import Beds24Admin from "./tabs/Beds24Admin.jsx";
import LivretQR from "./tabs/LivretQR.jsx";
import Travaux from "./tabs/Travaux.jsx";
import Prestataires from "./tabs/Prestataires.jsx";
import Cautions from "./tabs/Cautions.jsx";
import AdminChatTab from "./tabs/AdminChatTab.jsx";
import DevisEditor from "./tabs/DevisEditor.jsx";
import InterventionsTab from "./tabs/InterventionsTab.jsx";
import StockTrackerTab from "./tabs/StockTrackerTab.jsx";
import LingeTab from "./tabs/LingeTab.jsx";
import InventaireTab from "./tabs/InventaireTab.jsx";
import ConversionTab from "./tabs/ConversionTab.jsx";
import OrchestratorTab from "./tabs/OrchestratorTab.jsx";
import SocialTab from "./tabs/SocialTab.jsx";
import ApprobationsTab from "./tabs/ApprobationsTab.jsx";
import EditorialCalendarTab from "./tabs/EditorialCalendarTab.jsx";
import CroissanceTab from "./tabs/CroissanceTab.jsx";
import SEOAuditTab from "./tabs/SEOAuditTab.jsx";
import AvisTab from "./tabs/AvisTab.jsx";
import BugReporter from "./components/BugReporter.jsx";
import BugsTab from "./tabs/BugsTab.jsx";
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
export const POSTES_CHARGES = [
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
export function AlertCard({ severity = "warn", title, body, action, onAction }) {
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
export function ChannelChip({ channel, value }) {
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
  // Lecture via le proxy serveur /api/sheets-proxy : le fetch direct vers
  // script.google.com renvoie un 302 cross-origin (→ googleusercontent.com) qui
  // casse le CORS côté navigateur. Le proxy fait le fetch côté serveur (no CORS)
  // et renvoie le JSON tel quel. (action "read" = forwarding POST classique.)
  const res = await fetch("/api/sheets-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Script-Url": scriptUrl },
    body: JSON.stringify({ action: "read" }),
  });
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
export const BIEN_NAMES_ADMIN = {
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
export const BIEN_IDS = Object.keys(DEFAULT_PRIX);
// Garde-fous tarifaires par bien : [min, max] en €
export const PRIX_LIMITS = {
  amaryllis:  [200, 800],
  zandoli:    [100, 300],
  iguana:     [50,  600],
  geko:       [100, 300],
  mabouya:    [60,  150],
  schoelcher: [90,  160],
  nogent:     [70,  300],
};

export const MOIS_CAL = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
// Logements actifs sur le site direct (hors Iguana et Nogent)
export const CAL_BIEN_IDS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];

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
        // arch-009 : on stocke le token de session signé (HMAC, expire) — plus
        // jamais le mot de passe en clair. Fallback sur val pour rétro-compat
        // si un ancien backend ne renvoie pas encore de token.
        sessionStorage.setItem("ldb_tok", data.token || val);
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
export const STATUS_OPTIONS = [
  { v: "",   l: "Tous statuts" },
  { v: "1",  l: "✅ Confirmé" },
  { v: "0",  l: "🆕 Nouveau" },
  { v: "3",  l: "📩 Demande" },
  { v: "4",  l: "⏳ Paiement en attente" },
  { v: "2",  l: "❌ Annulé" },
];

export const CHANNEL_COLORS = {
  "Airbnb":       "#ff5a5f",
  "Booking.com":  "#003580",
  "Expedia":      "#ffc72c",
  "Direct":       "#10b981",
  "Beds24 Direct":"#0ea5e9",
};


// ============================================================================
// ANALYTICS
// ============================================================================

// ============================================================================
// LIVRET QR CODES
// ============================================================================

// ============================================================================
// TRAVAUX
// ============================================================================
export const TRAVAUX_KEY = "amaryllis_travaux";
export const TRAVAUX_PRIORITIES = ["urgent", "haute", "normale", "faible"];
export const TRAVAUX_STATUSES = ["todo", "en_cours", "done"];
export const TRAVAUX_PRIO_COLORS = { urgent: "#ef4444", haute: "#f59e0b", normale: "#0ea5e9", faible: "#64748b" };
export const TRAVAUX_PRIO_LABELS = { urgent: "🔴 Urgent", haute: "🟠 Haute", normale: "🔵 Normale", faible: "⚫ Faible" };
export const TRAVAUX_STATUS_COLORS = { todo: "#64748b", en_cours: "#f59e0b", done: "#10b981" };
export const TRAVAUX_STATUS_LABELS = { todo: "À faire", en_cours: "En cours", done: "Terminé" };


// ============================================================================
// APP
// ============================================================================
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(PWD_KEY) === "ok");
  const [role,   setRole]   = useState(() => sessionStorage.getItem("admin_role") || "admin");
  const [tab, setTabRaw] = useState(() => { try { return localStorage.getItem("admin_tab") || "planning"; } catch { return "planning"; } });
  const setTab = useCallback((t) => { setTabRaw(t); try { localStorage.setItem("admin_tab", t); } catch {} }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bugsBadge, setBugsBadge] = useState(0);
  useEffect(() => {
    if (!authed || role === "menage") return;
    fetchJSON("/api/client-errors?stats=1", { timeout: 8000 })
      .then(d => {
        const n = (d?.groups || []).filter(g => g.status === "new").reduce((s, g) => s + (g.n || 0), 0);
        setBugsBadge(n);
      })
      .catch(() => {});
  }, [authed, role, tab]);
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
    fetchJSON("/api/get-config", { timeout: 8000 })
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
      fetchJSON("/api/ical-config", { timeout: 8000 })
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

  // Auto-sync à l'affichage : dès que scriptUrl est dispo, on recharge une fois
  // automatiquement depuis Sheets (résas directes + données) sans bouton.
  // Garde-fou : ne tourne qu'une seule fois par montage (ref), fail-open.
  const autoSyncDone = useRef(false);
  useEffect(() => {
    if (!scriptUrl || autoSyncDone.current) return;
    autoSyncDone.current = true;
    doSync();
  }, [scriptUrl, doSync]);

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
        const b24data = await fetchJSON("/api/beds24-bookings", {
          timeout: 15000,
          headers: { Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || "") },
        });
        {
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
      const data = await fetchJSON("/api/sheets-proxy", {
        method: "POST",
        timeout: 30000, // import complet : opération potentiellement longue
        headers: { "Content-Type": "application/json", "X-Script-Url": scriptUrl },
        body: JSON.stringify({ action: "importAllReservations", reservations: allResas }),
      });
      setGlobalSyncStatus(data.ok ? "ok" : "error");
      addToast(data.ok ? "Synchro Sheets réussie ✓" : "Synchro Sheets : réponse inattendue", data.ok ? "success" : "error");
      // Reset après 5s
      setTimeout(() => setGlobalSyncStatus("idle"), 5000);
    } catch (e) {
      console.error("syncAllToSheets:", e);
      setGlobalSyncStatus("error");
      addToast("Synchro Sheets échouée — " + (e?.message || "erreur inconnue"), "error");
      setTimeout(() => setGlobalSyncStatus("idle"), 5000);
    }
  }, [scriptUrl, reservations, addToast]);

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
        { id: "inventaire",    icon: "📦", label: "Inventaire" },
        { id: "stocks",        icon: "📦", label: "Stocks (legacy)" },
        { id: "linge",         icon: "🛏️",  label: "Linge (legacy)" },
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
        { id: "avis",        icon: "⭐", label: "Avis" },
      ],
    },
    {
      id: "finance", label: "Finance",
      items: [
        { id: "charges",     icon: "💰", label: "Charges" },
        { id: "pilotage",    icon: "💼", label: "Pilotage" },
        { id: "cpa-canal",   icon: "💸", label: "CPA canal" },
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
        { id: "croissance", icon: "📈", label: "Croissance audience" },
        { id: "seo-audit", icon: "🔍", label: "SEO Audit" },
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
        { id: "bugs", icon: "🐞", label: "Bugs", badge: bugsBadge > 0 ? bugsBadge : null, badgeColor: "#ef4444" },
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
      <BugReporter />

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
            {/* key={tab} : un crash isole l'onglet courant et se réinitialise au changement d'onglet */}
            <LocalErrorBoundary key={tab}>
            {tab === "planning" && <Planning />}
            {tab === "cockpit" && <Cockpit />}
            {tab === "previsionnel" && <Previsionnel />}
            {tab === "charges" && <Charges />}
            {tab === "pilotage" && <Pilotage />}
            {tab === "cpa-canal" && <CpaCanalTab />}
            {tab === "historique" && <Historique />}
            {tab === "revenue"  && <RevenueManagerPro />}
            {tab === "tarifs" && <Tarifs />}
            {tab === "analytics" && <AnalyticsTab />}
            {tab === "menage" && <MenageTab />}
            {tab === "prestataires"   && <Prestataires />}
            {tab === "messages" && <MessageTemplates />}
            {tab === "emails" && <EmailSync mob={mob} />}
            {tab === "cautions" && <Cautions />}
            {tab === "travaux"  && <Travaux />}
            {tab === "livrets"  && <LivretEditor />}
            {tab === "devis"    && <DevisEditor />}
            {tab === "guides" && <GuideEditor mob={mob} />}
            {tab === "agents" && <AgentsKanban mob={mob} />}
            {tab === "bugs" && <BugsTab />}
            {tab === "social"        && <SocialTab />}
            {tab === "approbations"  && <ApprobationsTab />}
            {tab === "editorial"     && <EditorialCalendarTab />}
            {tab === "croissance"    && <CroissanceTab />}
            {tab === "seo-audit"     && <SEOAuditTab />}
            {tab === "chat-admin"    && <AdminChatTab />}
            {tab === "orchestrateur" && <OrchestratorTab />}
            {tab === "interventions" && <InterventionsTab />}
            {tab === "inventaire"    && <InventaireTab />}
            {tab === "stocks"        && <StockTrackerTab />}
            {tab === "linge"         && <LingeTab />}
            {tab === "conversion"    && <ConversionTab />}
            {tab === "avis"          && <AvisTab />}
            </LocalErrorBoundary>
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

export const BIENS_CAUTION = [
  { id: "amaryllis",  nom: "Villa Amaryllis",     depot: 1500 },
  { id: "zandoli",    nom: "Zandoli",              depot: 700  },
  { id: "iguana",     nom: "Villa Iguana",         depot: 500  },
  { id: "geko",       nom: "Géko",                depot: 500  },
  { id: "mabouya",    nom: "Mabouya",              depot: 500  },
  { id: "schoelcher", nom: "Bellevue Schœlcher",   depot: 1000 },
  { id: "nogent",     nom: "Appartement Nogent",   depot: 500  },
];

// ── Carnet prestataires ───────────────────────────────────────────────────────
export const PRESTATAIRES_KEY = "amaryllis_prestataires_v1";
export const PREST_CATEGORIES = [
  { id: "menage",      label: "Ménage",       icon: "🧹" },
  { id: "plomberie",   label: "Plomberie",    icon: "🔧" },
  { id: "electricite", label: "Électricité",  icon: "⚡" },
  { id: "jardinage",   label: "Jardinage",    icon: "🌿" },
  { id: "piscine",     label: "Piscine",      icon: "🏊" },
  { id: "serrurerie",  label: "Serrurerie",   icon: "🔑" },
  { id: "peinture",    label: "Peinture",     icon: "🎨" },
  { id: "autre",       label: "Autre",        icon: "📌" },
];
export const PREST_BIEN_LABELS = { amaryllis: "Villa Amaryllis", geko: "Géko", mabouya: "Mabouya", zandoli: "Zandoli", schoelcher: "Schœlcher", iguana: "Villa Iguana", nogent: "Nogent" };



// ─── Devis Editor ────────────────────────────────────────────────────────────

export const BIENS_DEVIS = [
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
export const ADMIN_SHORTCUTS = [
  { icon: "📊", label: "Résumé de la semaine",       prompt: "Fais-moi un résumé de la situation de mes locations cette semaine : réservations en cours, taux d'occupation global, points d'attention." },
  { icon: "✉️", label: "Email de bienvenue",          prompt: "Rédige un email de bienvenue chaleureux pour un voyageur qui arrive demain à la Villa Amaryllis. Ton : professionnel et chaleureux." },
  { icon: "📝", label: "Description Airbnb",          prompt: "Propose une description optimisée pour Airbnb de la Villa Amaryllis : accrocheuse, avec les mots-clés pertinents, max 500 mots." },
  { icon: "💡", label: "Conseil revenue management",  prompt: "Donne-moi 3 conseils concrets pour améliorer le RevPAR de mes villas en Martinique ce trimestre." },
  { icon: "📱", label: "Post Instagram",              prompt: "Rédige un post Instagram engageant pour promouvoir la Villa Amaryllis en été. Ton aspirationnel, 3 hashtags max." },
  { icon: "🔍", label: "Analyse basse saison",        prompt: "Comment optimiser le remplissage de mes villas en basse saison (septembre-novembre) ? Stratégies tarifaires, canaux, offres." },
];



/* ═══════════════════════════════════════════════════════════════════
   log-003 — INTERVENTIONS TAB
   Suivi des interventions / travaux prestataires, stocké en localStorage
═══════════════════════════════════════════════════════════════════ */
export const INTER_KEY = "ldb_interventions_v1";
export const INTER_TYPES = ["Ménage", "Plomberie", "Électricité", "Jardinage", "Piscine", "Climatisation", "Serrurerie", "Peinture", "Électroménager", "Autre"];
export const INTER_STATUS = [
  { v: "todo",       label: "À planifier", color: "#f59e0b" },
  { v: "scheduled",  label: "Planifiée",   color: "#0ea5e9" },
  { v: "done",       label: "Terminée",    color: "#10b981" },
  { v: "cancelled",  label: "Annulée",     color: "#64748b" },
];

/* ═══════════════════════════════════════════════════════════════════
   log-004 — STOCK TRACKER TAB
   Niveaux min/max par propriété, alertes sous le seuil
═══════════════════════════════════════════════════════════════════ */
export const STOCK_KEY = "ldb_stocks_v1";
export const STOCK_DEFAULTS = [
  { cat: "Linge", items: ["Draps 2p", "Draps 1p", "Taies d'oreiller", "Serviettes bain", "Serviettes main", "Peignoirs"] },
  { cat: "Cuisine", items: ["Éponges", "Liquide vaisselle", "Sacs poubelle", "Papier essuie-tout", "Café capsules", "Thé sachets"] },
  { cat: "Salle de bain", items: ["Gel douche", "Shampoing", "Savon", "PQ rouleaux", "Coton-tiges"] },
  { cat: "Piscine / Jardin", items: ["Chlore tablettes", "Anticalcaire", "Crème solaire (stock)", "Brassards enfants"] },
];

/* ═══════════════════════════════════════════════════════════════════
   log-006 — LINGE TAB
   Dashboard rotation linge : stock draps/serviettes par logement
═══════════════════════════════════════════════════════════════════ */
export const LINGE_KEY = "ldb_linge_v1";
export const LINGE_SETS = ["Draps 2 personnes", "Draps 1 personne", "Serviettes bain", "Serviettes main", "Housses de couette", "Oreillers housses", "Tapis de bain"];
export const LINGE_STATES = [
  { v: "propre",   label: "Propre",    color: "#10b981", icon: "✓" },
  { v: "utilise",  label: "Utilisé",   color: "#f59e0b", icon: "≈" },
  { v: "lavage",   label: "Au lavage", color: "#0ea5e9", icon: "↺" },
  { v: "manque",   label: "Manquant",  color: "#ef4444", icon: "!" },
];

/* ═══════════════════════════════════════════════════════════════════
   data-008 — CONVERSION TAB
   Taux de conversion par canal de réservation
═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   ORCHESTRATEUR TAB — interface multi-agents avec mémoire
   Coordonne les 23 agents via claude-sonnet, stocke les runs en D1
═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   SOCIAL TAB — Instagram + Facebook publishing
═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   APPROBATIONS TAB — Review & publish AI-generated drafts
═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   EDITORIAL CALENDAR TAB — Planning de publication FB + IG 30 jours
═══════════════════════════════════════════════════════════════ */
