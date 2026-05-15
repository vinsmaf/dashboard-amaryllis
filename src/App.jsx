import { useState, useEffect, useCallback } from "react";
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

const ICAL_DEFAULTS = {
  amaryllis: "https://www.airbnb.fr/calendar/ical/54269844.ics?t=681e7d55c76a4845839d24c0bc18ca94",
  schoelcher: "https://www.airbnb.fr/calendar/ical/24242415.ics?t=400f2712fa95485692d5911972f5533d",
  geko: "https://www.airbnb.fr/calendar/ical/1263155865459755724.ics?t=1c95f057feda4b2fa08519aad1001ca9",
  mabouya: "https://www.airbnb.fr/calendar/ical/1046596752160926069.ics?t=05c0e5dbdd9542878d58aa760416cf4f",
  zandoli: "https://www.airbnb.fr/calendar/ical/792768220924504884.ics?t=cfc774d9c7fa40bfbe5f0757ba06b090",
};

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
    if (/not available|blocked/i.test(sum)) return null;

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

    const reservation_code = descGet(["Code de la réservation","Code de reservation","Reservation Code","Confirmation Code"]);
    const phone = descGet(["Téléphone","Telephone","Phone"]);

    const montantRaw = descGet(["Montant total","Montant","Prix total","Total payé","Total","Amount","Payout"]);
    const montant = montantRaw ? parseFloat(montantRaw.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;

    const defaultName = canal === "booking" ? "Voyageur Booking" : "Voyageur Airbnb";
    const voyageur = sum.replace(/^(Réservé|Reserved|Booking|CLOSED)\s*[-–]?\s*/i, "").replace(/\(.*\)/g, "").trim() || defaultName;

    return {
      id: get("UID") || `${bienId}-${ci}-${canal}`,
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
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0ea5e9", fontFamily: "monospace" }}>
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
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>{fmtK(ytdTotal)}</div>
            <div style={{ fontSize: 12, color: cfTotal >= 0 ? "#10b981" : "#ef4444", fontFamily: "monospace" }}>{fmtK(cfTotal)} CF</div>
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
      const ctx = biens.map(b =>
        `${b.nom}: ${fmt(sumN(b.revenus, n))} revenus, cashflow ${fmt(sumN(b.cashflow, n))}, occupation moyenne ${avgN(b.occ, n).toFixed(0)}%, ADR ${avgN(b.adr, n).toFixed(0)}€`
      ).join("\n");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `Expert gestion locative à la Martinique. Rédige un bilan court et actionnable (3 paragraphes max) en français, basé sur ces données Jan-Mai 2026:\n\n${ctx}\n\nFormat: 1) Ce qui performe 2) Ce qui décroche 3) 3 actions concrètes pour juin-juillet. Direct et chiffré.`
          }],
        }),
      });
      const data = await res.json();
      setTxt(data.content?.[0]?.text || "Pas de réponse.");
      setDone(true);
    } catch (e) {
      setTxt("Erreur : " + e.message);
      setDone(true);
    }
    setLoading(false);
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
        style={{ width: 52, padding: "1px 4px", background: "#0f172a", border: "1px solid #0ea5e9", borderRadius: 4, color: "#e2e8f0", fontSize: 10, fontFamily: "monospace", textAlign: "right" }}
      />
    );
  }
  return (
    <span onClick={start} title="Cliquer pour modifier" style={{ cursor: "text", color: value > 0 ? "#94a3b8" : "#334155", fontSize: 10, fontFamily: "monospace" }}>
      {value > 0 ? fmt(value) : "–"}
    </span>
  );
}

function Cockpit({ biens, n, mob, onUpdateRevenu }) {
  const BIEN_COLORS = { nogent: "#0ea5e9", amaryllis: "#10b981", iguana: "#6366f1", geko: "#f59e0b", zandoli: "#3b82f6", mabouya: "#ec4899", schoelcher: "#8b5cf6" };
  const monthly = MOIS.slice(0, Math.min(n + 2, 8)).map((_, i) => {
    const row = { m: MOIS[i] };
    biens.forEach(b => { row[b.id] = i < n ? (b.revenus[i] || 0) : 0; });
    return row;
  });
  const tc = { court: "#0ea5e9", long: "#10b981", moyen: "#f59e0b" };
  const tl = { court: "Court", long: "Long", moyen: "Moyen" };

  return (
    <div>
      <AISummary biens={biens} n={n} />

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: mob ? 12 : 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, fontWeight: 600 }}>Revenus mensuels 2026</div>
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
                  <div style={{ fontSize: 19, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>{fmtK(ytdB)}</div>
                  <div style={{ fontSize: 11, color: cfB >= 0 ? "#10b981" : "#ef4444", fontFamily: "monospace" }}>
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
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b", fontFamily: "monospace" }}>{adr.toFixed(0)}€</div>
                    <div style={{ fontSize: 9, color: "#64748b" }}>ADR</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", fontFamily: "monospace" }}>{rvp.toFixed(0)}€</div>
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
    </div>
  );
}

// ============================================================================
// PLANNING
// ============================================================================
const EMPTY_FORM = { bienId: "amaryllis", voyageur: "", canal: "booking", checkin: "", checkout: "", checkin_time: "", checkout_time: "", nb_guests: "", montant: "", notes: "", menage: "", reservation_code: "", phone: "" };

function Planning({ biens, mob, reservations, saveRes, icalUrls, saveUrls, icalUrlsBooking, saveUrlsBooking, scriptUrl }) {
  const [showUrls, setShowUrls] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear] = useState(2026);
  const [icalStatus, setIcalStatus] = useState({});
  const [view, setView] = useState("todo");

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
      const merged = [...currentResas.filter(r => !(r.bienId === bienId && r.fromIcal && r.canal === canal)), ...newEvents];
      saveRes(merged);
      setIcalStatus(s => ({ ...s, [statusKey]: `✓ ${newEvents.length}` }));
      return merged;
    } catch (e) {
      setIcalStatus(s => ({ ...s, [statusKey]: `⚠ ${e.message}` }));
      return currentResas;
    }
  }, [saveRes, scriptUrl]);

  useEffect(() => {
    const sources = [];
    Object.keys(icalUrls).forEach(k => { if (icalUrls[k]?.length > 10) sources.push({ bienId: k, canal: "airbnb", url: icalUrls[k] }); });
    Object.keys(icalUrlsBooking).forEach(k => { if (icalUrlsBooking[k]?.length > 10) sources.push({ bienId: k, canal: "booking", url: icalUrlsBooking[k] }); });
    if (sources.length === 0) return;
    let current = reservations;
    (async () => {
      for (const s of sources) {
        current = await importIcal(s.bienId, s.canal, s.url, current) || current;
      }
    })();
  }, []);

  const openEdit = (r) => {
    setForm({ bienId: r.bienId, voyageur: r.voyageur, canal: r.canal, checkin: r.checkin, checkout: r.checkout, checkin_time: r.checkin_time || "", checkout_time: r.checkout_time || "", nb_guests: r.nb_guests || "", montant: r.montant || "", notes: r.notes || "", menage: r.menage || "", reservation_code: r.reservation_code || "", phone: r.phone || "" });
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
    })();
  };

  const td = todayStr();
  const tm = addDays(td, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthStart = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  const monthEnd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const rMonth = reservations.filter(r => r.checkin <= monthEnd && r.checkout >= monthStart);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const isToday = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` === td;
  const getCell = (bienId, day) => {
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const r = rMonth.find(r => r.bienId === bienId && r.checkin <= ds && r.checkout > ds);
    if (!r) return null;
    return { r, isCI: r.checkin === ds, color: CC[r.canal] || "#64748b", bg: CB[r.canal] || "rgba(100,116,139,0.15)" };
  };

  const todos = [];
  reservations.forEach(r => {
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
      todos.push({ id: `mn-${r.id}`, icon: "🧹", label: `Ménage — ${b.nom}`, sub: r.menage || "Prestataire à contacter", c: "#a855f7", done: r.menage_done, onT: () => togRes(r.id, "menage_done"), urgent: menUrgent });
    }
    if (r.checkin === tm) todos.push({ id: `ci2-${r.id}`, icon: "⏰", label: `Arrivée demain — ${b.nom}`, sub: [r.voyageur, r.checkin_time ? `🕐 ${r.checkin_time}` : "", r.nb_guests ? `👥 ${r.nb_guests}` : ""].filter(Boolean).join(" · "), c: "#f59e0b", done: false, urgent: false });
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[{ id: "todo", l: "✅ To-do" }, { id: "gantt", l: "📅 Calendrier" }, { id: "trous", l: "🕳 Trous" }, { id: "list", l: "📋 Réservations" }].map(v => (
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

      {view === "todo" && (
        <div>
          <div style={{ background: "rgba(255,90,95,0.07)", border: "1px solid rgba(255,90,95,0.2)", borderRadius: 11, padding: "11px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                iCal sync
                {Object.values(icalStatus).some(v => v === "loading") && <span style={{ fontSize: 10, color: "#0ea5e9", marginLeft: 6 }}>⟳ Synchro…</span>}
                {!Object.values(icalStatus).some(v => v === "loading") && Object.keys(icalStatus).length > 0 && <span style={{ fontSize: 10, color: "#10b981", marginLeft: 6 }}>✓ Synchronisé</span>}
              </span>
              <div style={{ display: "flex", gap: 5 }}>
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
                <div style={{ fontSize: 10, color: "#003580", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginTop: 4, color: "#60a5fa" }}>Booking.com</div>
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

          {reservations.filter(r => r.checkin > td && r.checkin <= addDays(td, 7)).length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: "16px 0 8px" }}>7 prochains jours</div>
              {reservations
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
              <button onClick={() => setViewMonth(m => (m - 1 + 12) % 12)} style={{ padding: "3px 9px", borderRadius: 6, border: "1px solid #334155", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>‹</button>
              <button onClick={() => setViewMonth(m => (m + 1) % 12)} style={{ padding: "3px 9px", borderRadius: 6, border: "1px solid #334155", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>›</button>
            </div>
          </div>
          <div style={{ minWidth: 480 }}>
            <div style={{ display: "grid", gridTemplateColumns: `72px repeat(${daysInMonth},1fr)`, gap: 1, marginBottom: 2 }}>
              <div />
              {days.map(d => (
                <div key={d} style={{ fontSize: 9, color: isToday(d) ? "#0ea5e9" : "#475569", textAlign: "center", fontWeight: isToday(d) ? 700 : 400 }}>{d}</div>
              ))}
            </div>
            {biens.map(b => (
              <div key={b.id} style={{ display: "grid", gridTemplateColumns: `72px repeat(${daysInMonth},1fr)`, gap: 1, marginBottom: 2 }}>
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
            ))}
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
                <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444", fontFamily: "monospace" }}>{totalDaysVides}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Sur les 60 prochains jours</div>
              </div>
              <div style={{ flex: 1, minWidth: 140, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Trous détectés</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b", fontFamily: "monospace" }}>{totalTrous}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Périodes vides &gt; 3 jours</div>
              </div>
              <div style={{ flex: 1, minWidth: 140, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Revenu potentiel</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#0ea5e9", fontFamily: "monospace" }}>{fmtK(revenuPotentielPerdu)}</div>
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
          <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#94a3b8", fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
            <span>Réservations ({reservations.length})</span>
            <span style={{ fontSize: 10, color: "#10b981" }}>
              {reservations.filter(r => r.fromIcal).length} Airbnb · {reservations.filter(r => !r.fromIcal).length} manuelles
            </span>
          </div>
          {reservations.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#475569", fontSize: 12 }}>Aucune réservation</div>
          ) : (
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
                  {[...reservations].sort((a, b) => a.checkin.localeCompare(b.checkin)).map(r => {
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
                        <td style={{ padding: "8px 10px", color: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}>{r.checkin}</td>
                        <td style={{ padding: "8px 10px", color: "#0ea5e9", fontSize: 10, fontFamily: "monospace" }}>{r.checkin_time || "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}>{r.checkout}</td>
                        <td style={{ padding: "8px 10px", color: "#f59e0b", fontSize: 10, fontFamily: "monospace" }}>{r.checkout_time || "—"}</td>
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
          )}
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 22, width: "100%", maxWidth: 340, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
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
    </div>
  );
}

// ============================================================================
// PRÉVISIONNEL
// ============================================================================
function Previsionnel({ biens, n, mob, hist = HIST_SEED }) {
  const [objectif, setObjectif] = useState(200000);
  const [scenario, setScenario] = useState("realiste");

  const poidsAnnuels = MOIS.map((_, m) =>
    [2023, 2024, 2025].map(y => hist[y]?.total[m] || 0).reduce((s, v) => s + v, 0) / 3
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
    h25: hist[2025]?.total[m] || 0,
  }));

  const recoBiens = biens.filter(b => b.type !== "long").map(b => {
    const tot25 = hist[2025]?.[b.id]?.reduce((s, v) => s + v, 0) || 0;
    const tot25all = biens.reduce((s, bb) => s + (hist[2025]?.[bb.id]?.reduce((ss, v) => ss + v, 0) || 0), 0);
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
            <input type="number" value={objectif} onChange={(e) => setObjectif(Number(e.target.value))} style={{ width: 95, padding: "5px 7px", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#0ea5e9", fontSize: 14, fontWeight: 700, fontFamily: "monospace", textAlign: "right" }} />
            <span style={{ color: "#64748b", fontSize: 12 }}>€</span>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#64748b" }}>
            <span>+{((objectif / 161331 - 1) * 100).toFixed(0)}% vs 2025</span>
            <span>+{((objectif / 143341 - 1) * 100).toFixed(0)}% vs 2024</span>
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
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>{fmt(ytd)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{(ytd / objectif * 100).toFixed(1)}% de l'objectif</div>
        </div>
        <div style={{ flex: 1, minWidth: 110, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Projection {scenario}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>{fmt(Math.round(projAnnuelle))}</div>
          <div style={{ fontSize: 11, color: gap <= 0 ? "#10b981" : "#ef4444", marginTop: 2 }}>
            {gap > 0 ? `Manque ${fmt(Math.round(gap))}` : `+${fmt(Math.round(-gap))} au-dessus`}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Progression objectif</div>
          <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: parseFloat(progressPct) >= 100 ? "#10b981" : parseFloat(progressPct) >= 80 ? "#f59e0b" : "#0ea5e9", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>{progressPct}%</div>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, fontWeight: 600 }}>Projection mensuelle vs objectif vs 2025</div>
        <ResponsiveContainer width="100%" height={mob ? 150 : 200}>
          <ComposedChart data={chartData} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="mois" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
            <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
            <Bar dataKey="reel" name="Réalisé" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="proj" name="Projeté" fill="#0ea5e9" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
            <Bar dataKey="h25" name="2025" fill="#334155" radius={[4, 4, 0, 0]} />
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
                <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", fontFamily: "monospace" }}>{Math.round(b.adrActuel)}€</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>ADR cible</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: "monospace" }}>{b.adrNecessaire > 0 ? b.adrNecessaire + "€" : "OK"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>Hausse</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: "monospace" }}>
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
                  <td style={{ padding: "9px 10px", color: "#0ea5e9", fontFamily: "monospace", fontSize: 11, fontWeight: 600 }}>{fmt(projBien)}</td>
                  <td style={{ padding: "9px 10px", color: "#ef4444", fontFamily: "monospace", fontSize: 11 }}>{fmt(chargesFixes)}</td>
                  <td style={{ padding: "9px 10px", color: c, fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{net >= 0 ? "+" : ""}{fmt(net)}</td>
                  <td style={{ padding: "9px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(parseInt(ratio), 100)}%`, background: parseInt(ratio) > 80 ? "#ef4444" : parseInt(ratio) > 50 ? "#f59e0b" : "#10b981" }} />
                      </div>
                      <span style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>{ratio}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
              <td style={{ padding: "10px", fontWeight: 700, color: "#e2e8f0", fontSize: 11 }}>TOTAL</td>
              <td style={{ padding: "10px", color: "#0ea5e9", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{fmt(Math.round(projAnnuelle))}</td>
              <td style={{ padding: "10px", color: "#ef4444", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{fmt(biens.reduce((s, b) => s + b.charges * 12, 0))}</td>
              <td style={{ padding: "10px", color: "#10b981", fontFamily: "monospace", fontSize: 13, fontWeight: 800 }}>
                {(() => { const t = Math.round(projAnnuelle) - biens.reduce((s, b) => s + b.charges * 12, 0); return (t >= 0 ? "+" : "") + fmt(t); })()}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// HISTORIQUE
// ============================================================================
function Historique({ biens, n, mob, hist = HIST_SEED }) {
  const [selBien, setSelBien] = useState("all");
  const [selView, setSelView] = useState("annuel");

  const ytd26 = biens.reduce((s, b) => s + sumN(b.revenus, n), 0);
  const annualTotals = [
    { year: 2022, rev: 107062 },
    { year: 2023, rev: 121730 },
    { year: 2024, rev: 143341 },
    { year: 2025, rev: 161331 },
    { year: 2026, rev: ytd26, ytd: true },
  ];
  annualTotals.forEach((a, i) => {
    if (i > 0) a.evo = ((a.rev - annualTotals[i - 1].rev) / annualTotals[i - 1].rev * 100).toFixed(1);
  });

  const getMonthly = (id) => MOIS.map((_, m) => ({
    mois: MOIS[m],
    2022: (id === "all" ? hist[2022]?.total : hist[2022]?.[id] || [])[m] || 0,
    2023: (id === "all" ? hist[2023]?.total : hist[2023]?.[id] || [])[m] || 0,
    2024: (id === "all" ? hist[2024]?.total : hist[2024]?.[id] || [])[m] || 0,
    2025: (id === "all" ? hist[2025]?.total : hist[2025]?.[id] || [])[m] || 0,
    2026: id === "all" ? biens.reduce((s, b) => s + (b.revenus[m] || 0), 0) : (biens.find(b => b.id === id)?.revenus[m] || 0),
  }));

  const bienEvol = biens.map(b => ({
    nom: b.nom.replace("Villa ", "").replace("T2 ", ""),
    emoji: b.emoji,
    2022: hist[2022]?.[b.id]?.reduce((s, v) => s + v, 0) || 0,
    2023: hist[2023]?.[b.id]?.reduce((s, v) => s + v, 0) || 0,
    2024: hist[2024]?.[b.id]?.reduce((s, v) => s + v, 0) || 0,
    2025: hist[2025]?.[b.id]?.reduce((s, v) => s + v, 0) || 0,
    2026: sumN(b.revenus, n),
  }));

  const cumulData = MOIS.map((_, m) => ({
    mois: MOIS[m],
    2025: (hist[2025]?.total || []).slice(0, m + 1).reduce((s, v) => s + v, 0),
    2026: biens.reduce((s, b) => s + b.revenus.slice(0, m + 1).reduce((ss, v) => ss + (v || 0), 0), 0),
  }));

  // Cumul depuis 2022
  const totalParAnnee = {
    2022: 107062,
    2023: 121730,
    2024: 143341,
    2025: 161331,
    2026: ytd26,
  };
  const totalDepuis2022 = Object.values(totalParAnnee).reduce((s, v) => s + v, 0);
  const cumulHistorique = [];
  let running = 0;
  [2022, 2023, 2024, 2025, 2026].forEach(y => {
    running += totalParAnnee[y];
    cumulHistorique.push({ annee: String(y) + (y === 2026 ? " YTD" : ""), annuel: totalParAnnee[y], cumul: running });
  });
  const moyenneAnnuelle = (totalParAnnee[2022] + totalParAnnee[2023] + totalParAnnee[2024] + totalParAnnee[2025]) / 4;

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
            <div style={{ fontSize: mob ? 26 : 32, fontWeight: 800, color: "#0ea5e9", fontFamily: "monospace", letterSpacing: "-0.02em" }}>
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
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>{fmtK(c.cumul)}</div>
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
            <div style={{ fontSize: mob ? 26 : 32, fontWeight: 800, color: cashflowDepuis2022 >= 0 ? "#10b981" : "#ef4444", fontFamily: "monospace", letterSpacing: "-0.02em" }}>
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
              <div style={{ fontSize: 13, fontWeight: 700, color: c.cumul >= 0 ? "#10b981" : "#ef4444", fontFamily: "monospace" }}>
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
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>{fmtK(a.rev)}</div>
            {a.evo && <div style={{ fontSize: 10, color: parseFloat(a.evo) >= 0 ? "#10b981" : "#ef4444", marginTop: 2 }}>{parseFloat(a.evo) >= 0 ? "+" : ""}{a.evo}%</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
        {[{ id: "annuel", l: "Annuel" }, { id: "mensuel", l: "Mensuel" }, { id: "cumul", l: "Cumul 25/26" }, { id: "heatmap", l: "🌡 Saisonnalité" }, { id: "semaine", l: "📅 Jour de semaine" }].map(v => (
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
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Cumulés 2025 vs 2026</div>
          <ResponsiveContainer width="100%" height={mob ? 150 : 200}>
            <LineChart data={cumulData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mois" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip contentStyle={TT} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Line type="monotone" dataKey={2025} name="2025" stroke={ANNEE_COLORS[2025]} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey={2026} name="2026" stroke={ANNEE_COLORS[2026]} strokeWidth={2.5} strokeDasharray="5 3" dot={{ fill: ANNEE_COLORS[2026], r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MOIS.slice(0, n).map((_, m) => {
              const d = cumulData[m];
              const delta = d[2026] - d[2025];
              return (
                <div key={m} style={{ flex: 1, minWidth: 50, background: "rgba(255,255,255,0.03)", borderRadius: 7, padding: "6px 7px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>{MOIS[m]}</div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: delta >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
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
    </div>
  );
}

// ============================================================================
// PILOTAGE (Canaux / Fiscal / Détail charges)
// ============================================================================
function Pilotage({ biens, n, mob }) {
  const [view, setView] = useState("canaux");
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
          { id: "canaux",  l: "💼 Canaux" },
          { id: "marche",  l: "🎯 Marché" },
          { id: "fiscal",  l: "📋 Fiscal" },
          { id: "conseil", l: "🎓 Conseil" },
          { id: "detail",  l: "📊 Détail charges" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600,
            background: view === v.id ? "#0ea5e9" : "rgba(255,255,255,0.06)",
            color: view === v.id ? "#fff" : "#94a3b8",
          }}>{v.l}</button>
        ))}
      </div>

      {view === "canaux" && (
        <div>
          {/* KPIs canaux */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {canalData.map(c => (
              <div key={c.name} style={{ flex: 1, minWidth: 120, background: c.color + "11", border: `1px solid ${c.color}44`, borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{c.name}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: c.color, fontFamily: "monospace" }}>{fmtK(c.brut)}</div>
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
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444", fontFamily: "monospace" }}>{fmt(Math.round(totalCommissions))}</div>
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
                      <span style={{ color: "#f59e0b", fontWeight: 700, fontFamily: "monospace" }}>{Math.round(b.adrActuel)}€</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Médiane marché : </span>
                      <span style={{ color: "#0ea5e9", fontWeight: 600, fontFamily: "monospace" }}>{b.bench.mediane}€</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Range : </span>
                      <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{b.bench.min}-{b.bench.top}€</span>
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
                            <td style={{ padding: "7px 8px", color: "#0ea5e9", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>{c.adr}€</td>
                            <td style={{ padding: "7px 8px", color: c.score >= 9 ? "#10b981" : c.score >= 8 ? "#f59e0b" : "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>{c.score || "—"}</td>
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
              <div style={{ fontSize: 19, fontWeight: 700, color: "#0ea5e9", fontFamily: "monospace" }}>{fmt(projAnnuelle)}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>YTD {fmt(ytd)} extrapolé</div>
            </div>
            <div style={{ flex: 1, minWidth: 140, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Court+moyen terme</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#f59e0b", fontFamily: "monospace" }}>{fmt(projCourt)}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Régime BIC meublé non classé</div>
            </div>
            <div style={{ flex: 1, minWidth: 140, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Location longue (Iguana)</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#10b981", fontFamily: "monospace" }}>{fmt(projLong)}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Régime micro-foncier ou réel</div>
            </div>
            <div style={{ flex: 1, minWidth: 140, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Base imposable estimée</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#a855f7", fontFamily: "monospace" }}>{fmt(revenusImposables)}</div>
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
                      <div style={{ fontSize: 13, fontWeight: 700, color: alert ? "#ef4444" : warn ? "#f59e0b" : "#10b981", fontFamily: "monospace" }}>
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
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "monospace", color: "#ef4444", fontWeight: 600 }}>15 000€</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "monospace", color: "#ef4444" }}>30%</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>Non</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>17.2% PS</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#64748b" }}>Petits volumes, pas de charges</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 12px", fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: "#e2e8f0" }}>Micro-BIC</div>
                        <div style={{ fontSize: 9, color: "#10b981" }}>Meublé classé ⭐ (1-5⭐)</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "monospace", color: "#0ea5e9", fontWeight: 600 }}>83 600€</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "monospace", color: "#0ea5e9" }}>50%</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>Non</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>17.2% PS</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#64748b" }}>Bons biens, simplicité</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(16,185,129,0.04)" }}>
                      <td style={{ padding: "10px 12px", fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: "#10b981" }}>LMNP au RÉEL ⭐</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>Recommandé &gt;30k€</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "monospace", color: "#10b981", fontWeight: 600 }}>Pas de plafond</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "monospace", color: "#10b981" }}>—</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#10b981" }}>✓ Toutes + amortissement</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#94a3b8" }}>17.2% PS</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#64748b" }}>Crédit, charges, gros CA</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(245,158,11,0.04)" }}>
                      <td style={{ padding: "10px 12px", fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: "#f59e0b" }}>LMP (Pro)</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>&gt;23k€ ET &gt;50% revenus</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "monospace", color: "#f59e0b", fontWeight: 600 }}>Pas de plafond</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "monospace", color: "#f59e0b" }}>Réel obligatoire</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#10b981" }}>✓ + déficit imputable</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#ef4444" }}>URSSAF ~35-40%</td>
                      <td style={{ padding: "10px 8px", fontSize: 10, color: "#64748b" }}>Activité principale</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 12px", fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: "#e2e8f0" }}>Location nue</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>Micro-foncier</div>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>15 000€</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>30%</td>
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
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444", fontFamily: "monospace" }}>{fmt(totalCharges2025)}</div>
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
                    <span style={{ color: "#64748b", fontFamily: "monospace" }}>{fmtK(d.value)} ({((d.value / totalCharges2025) * 100).toFixed(0)}%)</span>
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
                          <td key={p.k} style={{ padding: "9px 6px", textAlign: "right", fontFamily: "monospace", fontSize: 10, color: (c[p.k] || 0) > 0 ? "#94a3b8" : "#334155" }}>
                            {c[p.k] > 0 ? fmtK(c[p.k]) : "—"}
                          </td>
                        ))}
                        <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", fontSize: 11, color: "#ef4444", fontWeight: 700 }}>{fmtK(tot)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "10px 10px", fontWeight: 700, color: "#e2e8f0", fontSize: 11 }}>TOTAL</td>
                    {POSTES_CHARGES.map(p => (
                      <td key={p.k} style={{ padding: "10px 6px", textAlign: "right", fontFamily: "monospace", fontSize: 11, color: p.c, fontWeight: 700 }}>
                        {chargeTotals[p.k] > 0 ? fmtK(chargeTotals[p.k]) : "—"}
                      </td>
                    ))}
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "#ef4444", fontWeight: 800 }}>{fmtK(totalCharges2025)}</td>
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
          <div style={{ fontSize: 19, fontWeight: 700, color: "#ef4444", fontFamily: "monospace" }}>{fmt(chargesYTDTotal)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{ratioGlobal.toFixed(1)}% des revenus</div>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 11, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Charges fixes annuelles</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#f59e0b", fontFamily: "monospace" }}>{fmt(chargesFixesAnnuelTotal)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{fmt(totalFixeMensuel)}/mois théorique</div>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 11, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Cashflow YTD</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: cashflowYTDTotal >= 0 ? "#10b981" : "#ef4444", fontFamily: "monospace" }}>{fmt(cashflowYTDTotal)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Disponible après charges</div>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 11, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Revenus YTD</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#0ea5e9", fontFamily: "monospace" }}>{fmt(revenusYTDTotal)}</div>
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
                <span style={{ color: "#64748b", fontFamily: "monospace" }}>{fmtK(d.value)}</span>
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
                      <td style={{ padding: "9px 10px", color: "#0ea5e9", fontFamily: "monospace", fontSize: 11 }}>{fmt(b.revenusYTD)}</td>
                      <td style={{ padding: "9px 10px", color: "#ef4444", fontFamily: "monospace", fontSize: 11 }}>{fmt(b.chargesYTD)}</td>
                      <td style={{ padding: "9px 10px", color: b.cashflowYTD >= 0 ? "#10b981" : "#ef4444", fontFamily: "monospace", fontSize: 11, fontWeight: 600 }}>
                        {b.cashflowYTD >= 0 ? "+" : ""}{fmt(b.cashflowYTD)}
                      </td>
                      <td style={{ padding: "9px 10px", color: ratioColor, fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>
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
function Comparatif({ biens, n, mob }) {
  const rows = biens.map(b => {
    const ytd = sumN(b.revenus, n);
    const pp = Math.round(b.rev2025 / 12 * n);
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
  const prorata25total = biens.reduce((s, b) => s + Math.round(b.rev2025 / 12 * n), 0);
  const globalDeltaPct = prorata25total > 0 ? ((ytd26total - prorata25total) / prorata25total * 100).toFixed(1) : "0";
  const isAhead = parseFloat(globalDeltaPct) >= 0;

  return (
    <div>
      {/* Bandeau synthèse global */}
      <div style={{ background: isAhead ? "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,182,212,0.06))" : "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(245,158,11,0.06))", border: `1px solid ${isAhead ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 14, padding: mob ? 14 : 18, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Performance globale Jan→{MOIS[n-1]} 2026 vs prorata 2025</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: mob ? 26 : 32, fontWeight: 800, color: isAhead ? "#10b981" : "#ef4444", fontFamily: "monospace" }}>
                {isAhead ? "▲" : "▼"} {isAhead ? "+" : ""}{globalDeltaPct}%
              </span>
              <span style={{ fontSize: 14, color: "#94a3b8", fontFamily: "monospace" }}>
                {isAhead ? "+" : ""}{fmt(Math.round(ytd26total - prorata25total))}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
              {fmt(ytd26total)} réalisés · prorata 2025 : {fmt(prorata25total)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {biens.map(b => {
              const y = sumN(b.revenus, n);
              const p = Math.round(b.rev2025 / 12 * n);
              const d = p > 0 ? ((y - p) / p * 100).toFixed(0) : "—";
              const up = parseFloat(d) >= 0;
              return (
                <div key={b.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "7px 10px", textAlign: "center", minWidth: 60 }}>
                  <div style={{ fontSize: 14 }}>{b.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: up ? "#10b981" : "#ef4444", fontFamily: "monospace" }}>{up ? "+" : ""}{d}%</div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>{fmtK(y)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>YTD 2026 vs prorata 2025</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={rows} layout="vertical" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <YAxis type="category" dataKey="nom" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Bar dataKey="ytd" name="2026 YTD" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              <Bar dataKey="pp" name="Prorata 2025" fill="#334155" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>ADR 2025 vs 2026</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={rows} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="nom" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} formatter={(v) => [v + " €"]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Bar dataKey="adr25" name="ADR 2025" fill="#334155" radius={[4, 4, 0, 0]} />
              <Bar dataKey="adr26" name="ADR 2026" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
                {["Bien", "Rev 2025", "YTD 2026", "Δ", "Occ 25", "Occ 26", "ADR 25", "ADR 26", "RPar 25", "RPar 26"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "9px 10px", fontWeight: 600, color: "#e2e8f0", fontSize: 11 }}>{r.nom}</td>
                  <td style={{ padding: "9px 10px", color: "#64748b", fontFamily: "monospace", fontSize: 10 }}>{fmt(biens[i].rev2025)}</td>
                  <td style={{ padding: "9px 10px", color: "#0ea5e9", fontFamily: "monospace", fontSize: 10 }}>{fmt(r.ytd)}</td>
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
        style={{ width: 50, height: 50, borderRadius: "50%", border: "none", background: open ? "#334155" : "linear-gradient(135deg,#0ea5e9,#6366f1)", color: "#fff", cursor: "pointer", fontSize: open ? 18 : 20, boxShadow: "0 4px 14px rgba(14,165,233,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {open ? "✕" : "⚡"}
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
  const check = () => {
    // Password is stored as plain-check in localStorage for simplicity
    const stored = localStorage.getItem(PWD_KEY + "_set") || "vibu5Ade";
    if (val === stored) { localStorage.setItem(PWD_KEY, "ok"); onAuth(); }
    else { setErr(true); setTimeout(() => setErr(false), 1200); }
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
        {err && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>Mot de passe incorrect</div>}
        <button
          onClick={check}
          style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >Entrer</button>
        <div style={{ fontSize: 10, color: "#334155", marginTop: 16 }}>dashboardamaryllis.netlify.app</div>
      </div>
    </div>
  );
}

// ============================================================================
// APP
// ============================================================================
export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(PWD_KEY) === "ok");
  const [tab, setTab] = useState("planning");
  const [biens, setBiens] = useState([...SEED_BIENS]);
  const [n, setN] = useState(N);
  const [sync, setSync] = useState({ status: "idle", msg: "Données locales" });
  const [lastSync, setLastSync] = useState(null);
  const [scriptUrl, setScriptUrl] = useState(() => localStorage.getItem("sheets_script_url") || "");
  const [showScriptSetup, setShowScriptSetup] = useState(false);
  const [hist, setHist] = useState(HIST_SEED);
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

  useEffect(() => {
    const handler = () => setMob(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const saveRes = useCallback((list) => {
    setReservations(list);
    try { localStorage.setItem("reservations_v2", JSON.stringify(list)); } catch (e) {}
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
      if (f.hist && Object.keys(f.hist).length > 0) setHist(prev => ({ ...prev, ...f.hist }));
      setSync({ status: "ok", msg: `✓ ${f.lastSync}` });
    } catch (e) {
      setSync({ status: "error", msg: `⚠ ${e.message}` });
    }
  }, [biens, scriptUrl]);

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

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  const ytd = biens.reduce((s, b) => s + sumN(b.revenus, n), 0);
  const cf = biens.reduce((s, b) => s + sumN(b.cashflow, n), 0);

  const TABS = [
    { id: "planning", l: mob ? "📅" : "📅 Planning" },
    { id: "cockpit", l: mob ? "🎯" : "🎯 Cockpit" },
    { id: "previsionnel", l: mob ? "🔮" : "🔮 Prévisionnel" },
    { id: "charges", l: mob ? "💰" : "💰 Charges" },
    { id: "pilotage", l: mob ? "💼" : "💼 Pilotage" },
    { id: "historique", l: mob ? "📈" : "📈 Historique" },
    { id: "vs2025", l: mob ? "📊" : "📊 vs 2025" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "system-ui,sans-serif", color: "#e2e8f0" }}>

      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: mob ? "11px 12px" : "13px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: mob ? 15 : 18, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Locatif <span style={{ color: "#0ea5e9" }}>Dashboard</span>
            </div>
            {!mob && <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>7 biens · Jan→{MOIS[n - 1]} 2026</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: mob ? 8 : 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={doSync} disabled={sync.status === "loading"} style={{ padding: "5px 11px", borderRadius: 7, border: "1px solid #0ea5e9", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {sync.status === "loading" ? "⟳…" : "⟳ Sync"}
                </button>
                <button onClick={() => setShowScriptSetup(true)} title="Configurer Apps Script" style={{ padding: "5px 7px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: scriptUrl ? "#10b981" : "#64748b", fontSize: 11, cursor: "pointer" }}>
                  {scriptUrl ? "⚙✓" : "⚙"}
                </button>
                <button onClick={() => { localStorage.removeItem(PWD_KEY); setAuthed(false); }} title="Déconnexion" style={{ padding: "5px 7px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#475569", fontSize: 11, cursor: "pointer" }}>🔒</button>
              </div>
              {!mob && <span style={{ fontSize: 9, color: sync.status === "error" ? "#ef4444" : sync.status === "ok" ? "#10b981" : "#64748b" }}>{sync.msg}</span>}
            </div>
            {!mob && (
              <>
                <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.1)" }} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>YTD</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0ea5e9", fontFamily: "monospace" }}>{fmtK(ytd)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>Cashflow</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981", fontFamily: "monospace" }}>{fmtK(cf)}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <TodayBanner biens={biens} n={n} reservations={reservations} onTab={setTab} mob={mob} />

      <div style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: `0 ${mob ? 10 : 22}px`, display: "flex", gap: 1, overflowX: "auto" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ padding: mob ? "10px 9px" : "10px 13px", background: "none", border: "none", cursor: "pointer", fontSize: mob ? 11 : 12, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? "#0ea5e9" : "#64748b", borderBottom: tab === t.id ? "2px solid #0ea5e9" : "2px solid transparent", whiteSpace: "nowrap" }}
          >{t.l}</button>
        ))}
      </div>

      <div style={{ padding: mob ? "12px" : "18px 22px", maxWidth: 1200, paddingBottom: 76 }}>
        {tab === "planning" && <Planning biens={biens} mob={mob} reservations={reservations} saveRes={saveRes} icalUrls={icalUrls} saveUrls={saveUrls} icalUrlsBooking={icalUrlsBooking} saveUrlsBooking={saveUrlsBooking} scriptUrl={scriptUrl} />}
        {tab === "cockpit" && <Cockpit biens={biens} n={n} mob={mob} onUpdateRevenu={onUpdateRevenu} />}
        {tab === "previsionnel" && <Previsionnel biens={biens} n={n} mob={mob} hist={hist} />}
        {tab === "charges" && <Charges biens={biens} n={n} mob={mob} />}
        {tab === "pilotage" && <Pilotage biens={biens} n={n} mob={mob} />}
        {tab === "historique" && <Historique biens={biens} n={n} mob={mob} hist={hist} />}
        {tab === "vs2025" && <Comparatif biens={biens} n={n} mob={mob} />}
      </div>

      <FAB onTab={setTab} />

      <div style={{ padding: "8px 22px", borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: 9, color: "#334155", textAlign: "center" }}>
        Locatif Dashboard · {lastSync ? "Synchro : " + lastSync : "Non synchronisé"}
      </div>

      {showScriptSetup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowScriptSetup(false)}>
          <div style={{ background: "#1e293b", borderRadius: 14, padding: 24, maxWidth: 540, width: "100%", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
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
          </div>
        </div>
      )}
    </div>
  );
}
