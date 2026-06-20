#!/usr/bin/env node
/**
 * Enrichit "Toutes les Réservations" avec email + tel depuis Rentila.
 * Recoupement par nom normalisé : Rentila × TSV historiques + CSV Airbnb.
 *
 * Usage :
 *   node scripts/enrich-contacts-sheet.mjs           # envoi réel
 *   node scripts/enrich-contacts-sheet.mjs --dry     # compte les matchs, n'envoie rien
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir  = dirname(fileURLToPath(import.meta.url));
const DRY    = process.argv.includes("--dry");
const GAS_URL = "https://script.google.com/macros/s/AKfycbw-t5kd_0f3OsEoDkOJHzYPHIBhWzz34aj7yagP57-Cj-7pLj6TiuRaUuusrCwAiA30Gg/exec";
const CHUNK_LIMIT = 1800;

// ── Normalisation nom ────────────────────────────────────────────────────────
function normalize(s) {
  if (!s) return "";
  return String(s).toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ").trim();
}
function nameKey(s) {
  const parts = normalize(s).split(" ").filter(p => p.length > 1);
  return parts.length >= 2 ? parts.slice().sort().join("|") : null;
}

// ── 1. Charger Rentila XLSX ──────────────────────────────────────────────────
const rentila = JSON.parse(execSync(
  `python3 -c "
import openpyxl, json
wb = openpyxl.load_workbook('/Users/vincentsalomon/Downloads/Rentila-Locataires.xlsx')
ws = wb.active
h = [cell.value for cell in next(ws.iter_rows(min_row=1,max_row=1))]
rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    rows.append(dict(zip(h, [str(v) if v is not None else '' for v in row])))
print(json.dumps(rows))
"`, { encoding: "utf8" }
));
console.log(`✅ Rentila: ${rentila.length} locataires`);

// Index nom normalisé → contact
const rentilaByKey = new Map();
for (const r of rentila) {
  const prenom = String(r["Prénom"] || "").trim();
  const nom    = String(r["Nom"] || "").trim();
  const k = nameKey(`${prenom} ${nom}`);
  if (!k) continue;
  rentilaByKey.set(k, {
    email: (r["E-mail"] || "").trim(),
    tel:   (r["Mobile"] || r["Téléphone"] || "").trim(),
  });
}
console.log(`   ${rentilaByKey.size} clés de recoupement`);

// ── 2. Charger toutes les réservations (TSV) ─────────────────────────────────
function parseTsv(path) {
  const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
  const headers = lines[0].split("\t").map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split("\t");
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim(); });
    return obj;
  });
}

const reservations = [];
for (const row of parseTsv(resolve(__dir, "airbnb-historique.tsv"))) {
  const id = row["code de confirmation"]; if (!id) continue;
  reservations.push({ id, voyageur: row["voyageur"] });
}
for (const row of parseTsv(resolve(__dir, "booking-historique.tsv"))) {
  const id = row["id réservation"] || row["id reservation"]; if (!id) continue;
  reservations.push({ id, voyageur: row["nom du client"] });
}
for (const row of parseTsv(resolve(__dir, "direct-historique.tsv"))) {
  const id = row["id"]; if (!id) continue;
  reservations.push({ id, voyageur: row["nom du client"] });
}

// CSV Airbnb
function parseCsvLine(line) {
  const fields = []; let cur = "", inq = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inq && line[i+1] === '"') { cur += '"'; i++; } else inq = !inq; }
    else if (ch === ',' && !inq) { fields.push(cur); cur = ""; }
    else cur += ch;
  }
  fields.push(cur); return fields;
}
const seenIds = new Set(reservations.map(r => r.id));
for (const csvPath of [
  "/Users/vincentsalomon/Downloads/airbnb_01_2022-06_2026.csv",
  "/Users/vincentsalomon/Downloads/airbnb_01_2022-06_2026 (1).csv",
]) {
  try {
    const lines = readFileSync(csvPath, "utf8").split("\n");
    const headers = parseCsvLine(lines[0]);
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const vals = parseCsvLine(line);
      const row = Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] || "").trim()]));
      if (row["Type"] !== "Réservation") continue;
      const id = row["Code de confirmation"];
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      reservations.push({ id, voyageur: row["Voyageur"] });
    }
  } catch { /* fichier absent */ }
}
console.log(`📋 Réservations: ${reservations.length}`);

// ── 3. Recoupement nom → contact ─────────────────────────────────────────────
const updates = [];
let noMatch = 0;
for (const resa of reservations) {
  const k = nameKey(resa.voyageur);
  if (!k) { noMatch++; continue; }
  const contact = rentilaByKey.get(k);
  if (!contact || (!contact.email && !contact.tel)) { noMatch++; continue; }
  updates.push({ id: resa.id, email: contact.email || undefined, tel: contact.tel || undefined });
}

console.log(`\n📊 Matchs avec contact : ${updates.length} / ${reservations.length}`);
console.log(`   Sans match           : ${noMatch}`);
if (updates.length > 0) {
  console.log(`\nExemples :`);
  updates.slice(0, 5).forEach(u => {
    const r = reservations.find(x => x.id === u.id);
    console.log(`  ${r?.voyageur} → email:${u.email||'—'} tel:${u.tel||'—'}`);
  });
}

if (DRY) { console.log("\n✅ Mode --dry. Relancer sans --dry pour enrichir."); process.exit(0); }
if (!updates.length) { console.log("Rien à enrichir."); process.exit(0); }

// ── 4. Envoi par chunks GET ──────────────────────────────────────────────────
function buildChunks(items) {
  const chunks = []; let current = [];
  for (const item of items) {
    current.push(item);
    const url = `${GAS_URL}?action=updateContactsById&data=${encodeURIComponent(JSON.stringify(current))}`;
    if (url.length > CHUNK_LIMIT && current.length > 1) {
      chunks.push(current.slice(0, -1));
      current = [item];
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
}

const chunks = buildChunks(updates);
console.log(`\n🔀 ${chunks.length} chunks à envoyer…`);

let totalUpdated = 0, errors = 0;
for (let i = 0; i < chunks.length; i++) {
  const url   = `${GAS_URL}?action=updateContactsById&data=${encodeURIComponent(JSON.stringify(chunks[i]))}`;
  const label = `chunk ${i+1}/${chunks.length} (${chunks[i].length} résas)`;
  try {
    const res  = await fetch(url);
    const text = await res.text();
    const data = JSON.parse(text);
    totalUpdated += data.updated || 0;
    process.stdout.write(`  ✓ ${label} → ${data.updated||0} màj\n`);
  } catch (err) {
    errors++;
    console.error(`  ✗ ${label} ERREUR: ${err.message}`);
  }
}

console.log(`\n🏁 Terminé — ${totalUpdated} lignes enrichies dans "Toutes les Réservations"`);
if (errors) console.error(`   Erreurs : ${errors} chunks`);
