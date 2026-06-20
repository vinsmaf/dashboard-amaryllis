#!/usr/bin/env node
/**
 * Import Airbnb CSV (export financier) → "Toutes les Réservations"
 * Filtre Type=Réservation, dédoublonne par ID, skipRevenueSync=1.
 *
 * Usage :
 *   node scripts/import-airbnb-csv.mjs                          # fichiers par défaut
 *   node scripts/import-airbnb-csv.mjs --dry                    # compte sans envoyer
 *   node scripts/import-airbnb-csv.mjs file1.csv file2.csv      # fichiers custom
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir    = dirname(fileURLToPath(import.meta.url));
const DRY      = process.argv.includes("--dry");
const GAS_URL  = "https://script.google.com/macros/s/AKfycbw-t5kd_0f3OsEoDkOJHzYPHIBhWzz34aj7yagP57-Cj-7pLj6TiuRaUuusrCwAiA30Gg/exec";
const CHUNK_LIMIT = 1800;

// CSV paths — customisables en args sinon défauts Downloads
const csvArgs = process.argv.slice(2).filter(a => !a.startsWith("--"));
const CSV_FILES = csvArgs.length > 0 ? csvArgs : [
  "/Users/vincentsalomon/Downloads/airbnb_01_2022-06_2026.csv",
  "/Users/vincentsalomon/Downloads/airbnb_01_2022-06_2026 (1).csv",
];

// ── Parseur CSV minimal (gère les champs entre guillemets) ───────────────────
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current); current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(path) {
  const lines = readFileSync(path, "utf8").split("\n").filter(l => l.trim());
  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = parseCsvLine(line);
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim(); });
    return obj;
  });
}

// ── Date MM/DD/YYYY → YYYY-MM-DD ────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "";
  // Format MM/DD/YYYY
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1]}-${m[2]}`;
  // Déjà YYYY-MM-DD ?
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return d;
}

// ── Mapping logement → bienId ────────────────────────────────────────────────
function toBienId(logement) {
  const l = (logement || "").toLowerCase();
  if (l.includes("amaryllis"))                       return "amaryllis";
  if (l.includes("iguana"))                          return "iguana";
  if (l.includes("zandoli"))                         return "zandoli";
  if (l.includes("géko") || l.includes("geko"))      return "geko";
  if (l.includes("mabouya"))                         return "mabouya";
  // Nogent AVANT Schœlcher : "Appartement de standing avec jardin, proche Paris"
  if (l.includes("nogent") || l.includes("proche paris") || l.includes("jardin, proche")) return "nogent";
  // Schœlcher : "Appartement de standing calme, splendide vue mer"
  if (l.includes("schoel") || l.includes("calme, splendide") || l.includes("appartement de standing")) return "schoelcher";
  return logement.toLowerCase().trim();
}

// ── Parsing montant (format FR "1 234,56" ou EN "1234.56") ──────────────────
function parseMontant(v) {
  if (!v) return 0;
  // Enlever les espaces insécables et espaces, convertir virgule → point
  const clean = String(v).replace(/\s/g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

// ── Lecture + filtrage des CSV ────────────────────────────────────────────────
const seenIds = new Set();
const reservations = [];

for (const csvPath of CSV_FILES) {
  let rows;
  try {
    rows = parseCsv(csvPath);
    console.log(`📂 ${csvPath.split("/").pop()} → ${rows.length} lignes`);
  } catch (e) {
    console.error(`⚠️  Impossible de lire ${csvPath}: ${e.message}`);
    continue;
  }

  for (const row of rows) {
    const type = row["Type"] || row["type"] || "";
    if (type !== "Réservation") continue; // Ignorer Payout, Versement de résolution

    const id = row["Code de confirmation"] || row["code de confirmation"] || "";
    if (!id || seenIds.has(id)) continue; // Dédoublonnage client-side
    seenIds.add(id);

    const logement  = row["Logement"] || row["logement"] || "";
    const voyageur  = row["Voyageur"] || row["voyageur"] || "—";
    const checkin   = fmtDate(row["Date de début"] || row["date de début"] || "");
    const checkout  = fmtDate(row["Date de fin"]   || row["date de fin"]   || "");
    const nuits     = parseInt(row["Nuits"] || "0") || 0;
    // Revenus bruts = montant total de la réservation (avant frais Airbnb)
    const montant   = parseMontant(row["Revenus bruts"] || row["revenus bruts"] || "0");

    reservations.push({
      id,
      bienId:   toBienId(logement),
      voyageur,
      canal:    "airbnb",
      checkin,
      checkout,
      montant,
      nuits,
      statut:   "Confirmé",
      source:   "Airbnb",
    });
  }
}

// ── Résumé ───────────────────────────────────────────────────────────────────
const byBien = {};
for (const r of reservations) {
  byBien[r.bienId] = (byBien[r.bienId] || 0) + 1;
}

console.log(`\n📋 Total à importer : ${reservations.length} réservations Airbnb`);
Object.entries(byBien).sort((a,b) => b[1]-a[1]).forEach(([b,n]) => console.log(`   ${b}: ${n}`));

if (DRY) {
  console.log("\n✅ Mode --dry : aucun envoi.");
  process.exit(0);
}

// ── Chunking + envoi GET ─────────────────────────────────────────────────────
function buildChunks(items) {
  const chunks = [];
  let current  = [];
  for (const item of items) {
    current.push(item);
    const url = `${GAS_URL}?action=importAllReservations&skipRevenueSync=1&data=${encodeURIComponent(JSON.stringify(current))}`;
    if (url.length > CHUNK_LIMIT && current.length > 1) {
      chunks.push(current.slice(0, -1));
      current = [item];
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
}

const chunks = buildChunks(reservations);
console.log(`\n🔀 ${chunks.length} chunks à envoyer (skipRevenueSync=1 — revenus non touchés)…`);

let totalAdded = 0, totalUpdated = 0, errors = 0;

for (let i = 0; i < chunks.length; i++) {
  const url   = `${GAS_URL}?action=importAllReservations&skipRevenueSync=1&data=${encodeURIComponent(JSON.stringify(chunks[i]))}`;
  const label = `chunk ${i + 1}/${chunks.length} (${chunks[i].length} résas)`;
  try {
    const res  = await fetch(url);
    const text = await res.text();
    const data = JSON.parse(text);
    totalAdded   += data.added   || 0;
    totalUpdated += data.updated || 0;
    process.stdout.write(`  ✓ ${label} → +${data.added || 0} ajoutées, ~${data.updated || 0} màj\n`);
  } catch (err) {
    errors++;
    console.error(`  ✗ ${label} ERREUR: ${err.message}`);
  }
}

console.log(`\n🏁 Terminé`);
console.log(`   Ajoutées    : ${totalAdded}`);
console.log(`   Mises à jour: ${totalUpdated}`);
if (errors) console.error(`   Erreurs     : ${errors} chunks`);
console.log(`\n✅ Revenus 2022-2026 non touchés (skipRevenueSync=1).`);
