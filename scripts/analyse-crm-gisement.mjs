#!/usr/bin/env node
/**
 * Analyse du gisement CRM — mesure le potentiel réel d'une base clients.
 * Lit les 3 TSV historiques + les 2 CSV Airbnb (union dédupliquée par ID),
 * normalise les noms, regroupe par client, et sort les chiffres qui décident :
 *   - clients uniques
 *   - récurrents (2+, 3+ séjours)
 *   - concentration du CA (top clients)
 *   - récurrence cross-canal (= contactable + repeat prouvé = l'or)
 *   - répartition canal
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Helpers ──────────────────────────────────────────────────────────────────
function stripAccents(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
// Clé de normalisation : maj, sans accents, tokens triés (gère "Nom Prénom" vs "Prénom Nom")
function nameKey(raw) {
  const clean = stripAccents(String(raw || ""))
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = clean.split(" ").filter(t => t.length > 1); // vire initiales seules
  return tokens.sort().join(" ");
}
function toBienId(label) {
  const l = String(label || "").toLowerCase().trim();
  if (l.includes("amaryllis")) return "amaryllis";
  if (l.includes("iguana")) return "iguana";
  if (l.includes("zandoli")) return "zandoli";
  if (l.includes("geko") || l.includes("géko")) return "geko";
  if (l.includes("mabouya")) return "mabouya";
  if (l.includes("nogent") || l.includes("proche paris") || l.includes("jardin, proche")) return "nogent";
  if (l.includes("schoel") || l.includes("calme, splendide") || l.includes("appartement de standing")) return "schoelcher";
  return l;
}
function parseMontant(v) {
  if (!v) return 0;
  return parseFloat(String(v).replace(/\s/g, "").replace(",", ".")) || 0;
}
function parseTsv(path) {
  const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
  const headers = lines[0].split("\t").map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split("\t");
    const o = {};
    headers.forEach((h, i) => { o[h] = (vals[i] || "").trim(); });
    return o;
  });
}
function parseCsvLine(line) {
  const f = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i+1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === "," && !q) { f.push(cur); cur = ""; }
    else cur += c;
  }
  f.push(cur); return f;
}
function parseCsv(path) {
  const lines = readFileSync(path, "utf8").replace(/^﻿/, "").split("\n").filter(l => l.trim());
  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = parseCsvLine(line);
    const o = {};
    headers.forEach((h, i) => { o[h] = (vals[i] || "").trim(); });
    return o;
  });
}

// ── Chargement (dédup par ID, comme le GAS) ──────────────────────────────────
const byId = new Map(); // id -> résa unifiée

function add(id, r) {
  if (!id) return;
  if (!byId.has(id)) byId.set(id, r);
}

// Airbnb TSV
for (const row of parseTsv(resolve(__dir, "airbnb-historique.tsv"))) {
  add(row["code de confirmation"], {
    id: row["code de confirmation"], canal: "airbnb",
    voyageur: row["voyageur"] || "—", bienId: toBienId(row["logement"]),
    checkin: row["arrivée"] || row["arrivee"] || "", montant: parseMontant(row["montant"]),
  });
}
// Airbnb CSV (union par code — complète le TSV)
for (const csv of ["airbnb_01_2022-06_2026.csv", "airbnb_01_2022-06_2026 (1).csv"]) {
  let rows;
  try { rows = parseCsv(`/Users/vincentsalomon/Downloads/${csv}`); } catch { continue; }
  for (const row of rows) {
    if ((row["Type"] || "") !== "Réservation") continue;
    add(row["Code de confirmation"], {
      id: row["Code de confirmation"], canal: "airbnb",
      voyageur: row["Voyageur"] || "—", bienId: toBienId(row["Logement"]),
      checkin: row["Date de début"] || "", montant: parseMontant(row["Revenus bruts"]),
    });
  }
}
// Booking TSV
for (const row of parseTsv(resolve(__dir, "booking-historique.tsv"))) {
  add(row["id réservation"] || row["id reservation"], {
    id: row["id réservation"] || row["id reservation"], canal: "booking",
    voyageur: row["nom du client"] || "—", bienId: toBienId(row["logement"]),
    checkin: row["arrivée"] || row["arrivee"] || "", montant: parseMontant(row["montant"]),
  });
}
// Direct TSV
for (const row of parseTsv(resolve(__dir, "direct-historique.tsv"))) {
  add(row["id"], {
    id: row["id"], canal: "direct",
    voyageur: row["nom du client"] || "—", bienId: toBienId(row["logement"]),
    checkin: row["arrivée"] || row["arrivee"] || "", montant: parseMontant(row["montant"]),
  });
}

const resas = [...byId.values()];

// ── Regroupement par client (clé nom normalisée) ─────────────────────────────
const guests = new Map(); // key -> {noms:Set, sejours, ca, canaux:Set, biens:Set, first, last}
for (const r of resas) {
  const key = nameKey(r.voyageur);
  if (!key) continue;
  if (!guests.has(key)) guests.set(key, {
    key, noms: new Set(), sejours: 0, ca: 0, canaux: new Set(), biens: new Set(), dates: [],
  });
  const g = guests.get(key);
  g.noms.add(r.voyageur.trim());
  g.sejours++;
  g.ca += r.montant;
  g.canaux.add(r.canal);
  g.biens.add(r.bienId);
  if (r.checkin) g.dates.push(r.checkin);
}
const allGuests = [...guests.values()].map(g => ({
  ...g, nomAff: [...g.noms][0],
  first: g.dates.sort()[0] || "?", last: g.dates.sort().slice(-1)[0] || "?",
}));

// ── Stats ────────────────────────────────────────────────────────────────────
const total = resas.length;
const uniques = allGuests.length;
const recurrents = allGuests.filter(g => g.sejours >= 2);
const rec3 = allGuests.filter(g => g.sejours >= 3);
const crossCanal = allGuests.filter(g => g.canaux.size >= 2);
const caTotal = allGuests.reduce((s, g) => s + g.ca, 0);

const byCanal = {};
for (const r of resas) byCanal[r.canal] = (byCanal[r.canal] || 0) + 1;

// Concentration : part du CA des récurrents
const caRecurrents = recurrents.reduce((s, g) => s + g.ca, 0);
const topCA = [...allGuests].sort((a, b) => b.ca - a.ca).slice(0, 15);
const topSejours = [...allGuests].sort((a, b) => b.sejours - a.sejours).slice(0, 15);

// ── Sortie ───────────────────────────────────────────────────────────────────
const eur = n => Math.round(n).toLocaleString("fr-FR") + " €";
console.log("═".repeat(70));
console.log("  GISEMENT CRM — Amaryllis Locations");
console.log("═".repeat(70));
console.log(`\n📦 VOLUME`);
console.log(`   Réservations uniques (dédup ID) : ${total}`);
console.log(`   CA cumulé total                 : ${eur(caTotal)}`);
console.log(`   Répartition canal :`, Object.entries(byCanal).map(([c,n]) => `${c} ${n}`).join(" · "));

console.log(`\n👤 CLIENTS`);
console.log(`   Clients uniques (nom normalisé) : ${uniques}`);
console.log(`   Récurrents 2+ séjours           : ${recurrents.length}  (${(recurrents.length/uniques*100).toFixed(1)}% des clients)`);
console.log(`   Récurrents 3+ séjours           : ${rec3.length}`);
console.log(`   → CA généré par les récurrents  : ${eur(caRecurrents)}  (${(caRecurrents/caTotal*100).toFixed(1)}% du CA)`);

console.log(`\n🎯 RÉCURRENTS CROSS-CANAL (venus via ≥2 canaux = repeat prouvé)`);
console.log(`   Nombre : ${crossCanal.length}`);
crossCanal.sort((a,b)=>b.sejours-a.sejours).slice(0,10).forEach(g =>
  console.log(`   • ${g.nomAff.padEnd(28)} ${g.sejours} séj · ${eur(g.ca).padStart(9)} · ${[...g.canaux].join("+")} · ${[...g.biens].join(",")}`));

console.log(`\n🏆 TOP 15 CLIENTS PAR NB SÉJOURS`);
topSejours.forEach((g,i) =>
  console.log(`   ${String(i+1).padStart(2)}. ${g.nomAff.padEnd(28)} ${g.sejours} séj · ${eur(g.ca).padStart(9)} · ${[...g.canaux].join("+").padEnd(14)} · ${[...g.biens].join(",")}`));

console.log(`\n💰 TOP 15 CLIENTS PAR CA`);
topCA.forEach((g,i) =>
  console.log(`   ${String(i+1).padStart(2)}. ${g.nomAff.padEnd(28)} ${eur(g.ca).padStart(9)} · ${g.sejours} séj · ${[...g.canaux].join("+")}`));

console.log("\n" + "═".repeat(70));
