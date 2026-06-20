#!/usr/bin/env node
/**
 * Import historique TSV → "Toutes les Réservations" Google Sheets
 * Sans toucher aux onglets "revenus locatif 20XX" (skipRevenueSync=1).
 *
 * Usage :
 *   node scripts/import-historique.mjs
 *   node scripts/import-historique.mjs --dry    (compte les lignes, n'envoie rien)
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir  = dirname(fileURLToPath(import.meta.url));
const DRY    = process.argv.includes("--dry");
const GAS_URL = "https://script.google.com/macros/s/AKfycbw-t5kd_0f3OsEoDkOJHzYPHIBhWzz34aj7yagP57-Cj-7pLj6TiuRaUuusrCwAiA30Gg/exec";
const CHUNK_LIMIT = 1800; // chars URL max Apps Script

// ── Parseur TSV minimal ────────────────────────────────────────────────────────
function parseTsv(path) {
  const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
  const headers = lines[0].split("\t").map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split("\t");
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim(); });
    return obj;
  });
}

// ── Mapping bienId depuis le nom dans le TSV ──────────────────────────────────
function toBienId(label) {
  const l = label.toLowerCase().trim();
  if (l.includes("amaryllis"))  return "amaryllis";
  if (l.includes("iguana"))     return "iguana";
  if (l.includes("zandoli"))    return "zandoli";
  if (l.includes("geko") || l.includes("géko")) return "geko";
  if (l.includes("mabouya"))    return "mabouya";
  if (l.includes("schoel") || l.includes("schoelcher")) return "schoelcher";
  if (l.includes("nogent"))     return "nogent";
  return l;
}

// ── Lecture des 3 fichiers TSV ────────────────────────────────────────────────
const TSVO = {
  airbnb:  resolve(__dir, "airbnb-historique.tsv"),
  booking: resolve(__dir, "booking-historique.tsv"),
  direct:  resolve(__dir, "direct-historique.tsv"),
};

const reservations = [];

// Airbnb : code de confirmation | logement | voyageur | arrivée | départ | montant | statut
for (const row of parseTsv(TSVO.airbnb)) {
  const id = row["code de confirmation"];
  if (!id) continue;
  reservations.push({
    id,
    bienId:   toBienId(row["logement"] || ""),
    voyageur: row["voyageur"] || "—",
    canal:    "airbnb",
    checkin:  row["arrivée"]  || row["arrivee"]  || "",
    checkout: row["départ"]   || row["depart"]   || "",
    montant:  parseFloat(row["montant"]) || 0,
    statut:   row["statut"]  || "Confirmé",
    source:   "Airbnb",
  });
}

// Booking : id réservation | logement | nom du client | arrivée | départ | montant | statut
for (const row of parseTsv(TSVO.booking)) {
  const id = row["id réservation"] || row["id reservation"];
  if (!id) continue;
  reservations.push({
    id,
    bienId:   toBienId(row["logement"] || ""),
    voyageur: row["nom du client"] || "—",
    canal:    "booking",
    checkin:  row["arrivée"]  || row["arrivee"]  || "",
    checkout: row["départ"]   || row["depart"]   || "",
    montant:  parseFloat(row["montant"]) || 0,
    statut:   row["statut"]  || "Confirmé",
    source:   "Booking.com",
  });
}

// Direct : id | logement | nom du client | arrivée | départ | montant | statut
for (const row of parseTsv(TSVO.direct)) {
  const id = row["id"];
  if (!id) continue;
  reservations.push({
    id,
    bienId:   toBienId(row["logement"] || ""),
    voyageur: row["nom du client"] || "—",
    canal:    "direct",
    checkin:  row["arrivée"]  || row["arrivee"]  || "",
    checkout: row["départ"]   || row["depart"]   || "",
    montant:  parseFloat(row["montant"]) || 0,
    statut:   row["statut"]  || "Confirmé",
    source:   "Direct",
  });
}

console.log(`📋 Total à importer : ${reservations.length} réservations`);
console.log(`   Airbnb : ${reservations.filter(r => r.canal === "airbnb").length}`);
console.log(`   Booking: ${reservations.filter(r => r.canal === "booking").length}`);
console.log(`   Direct : ${reservations.filter(r => r.canal === "direct").length}`);

if (DRY) {
  console.log("\n✅ Mode --dry : aucun envoi. Relancer sans --dry pour importer.");
  process.exit(0);
}

// ── Chunking + envoi GET (bypass redirect GAS) ────────────────────────────────
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
console.log(`\n🔀 ${chunks.length} chunks à envoyer…`);

let totalAdded = 0, totalUpdated = 0, errors = 0;

for (let i = 0; i < chunks.length; i++) {
  const url    = `${GAS_URL}?action=importAllReservations&skipRevenueSync=1&data=${encodeURIComponent(JSON.stringify(chunks[i]))}`;
  const label  = `chunk ${i + 1}/${chunks.length} (${chunks[i].length} résas)`;
  try {
    const res  = await fetch(url);
    const text = await res.text();
    const data = JSON.parse(text);
    totalAdded   += data.added   || 0;
    totalUpdated += data.updated || 0;
    process.stdout.write(`  ✓ ${label} → +${data.added || 0} ajoutées, ~${data.updated || 0} mises à jour\n`);
  } catch (err) {
    errors++;
    console.error(`  ✗ ${label} ERREUR : ${err.message}`);
  }
}

console.log(`\n🏁 Terminé`);
console.log(`   Ajoutées  : ${totalAdded}`);
console.log(`   Mises à j : ${totalUpdated}`);
if (errors) console.error(`   Erreurs   : ${errors} chunks`);
console.log(`\n⚠️  Les onglets "revenus locatif 20XX" n'ont PAS été touchés (skipRevenueSync=1).`);
console.log(`   À partir de maintenant, les nouvelles résas s'incrémenteront normalement.`);
