#!/usr/bin/env node
/**
 * Import CRM clients → D1 crm_clients
 * Sources : Rentila XLSX + TSV historiques + CSV Airbnb
 * Dédoublonne par nom normalisé, calcule LTV + récurrence.
 *
 * Usage:
 *   node scripts/import-crm.mjs          # import réel
 *   node scripts/import-crm.mjs --dry    # dry-run (affiche sans insérer)
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createHash } from "crypto";

const __dir = dirname(fileURLToPath(import.meta.url));
const DRY   = process.argv.includes("--dry");

// ── Helpers ─────────────────────────────────────────────────────────────────
function normalize(s) {
  if (!s) return "";
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ").trim();
}

function nameKey(s) {
  const parts = normalize(s).split(" ").filter(p => p.length > 1);
  if (parts.length < 2) return null;
  return parts.slice().sort().join("|");
}

function makeId(prenom, nom) {
  const raw = normalize(`${prenom} ${nom}`);
  return "crm-" + createHash("md5").update(raw).digest("hex").slice(0, 12);
}

// ── 1. Charger Rentila XLSX ──────────────────────────────────────────────────
let rentila = [];
try {
  // Python fallback (openpyxl)
  const raw = execSync(
    `python3 -c "
import openpyxl, json
wb = openpyxl.load_workbook('/Users/vincentsalomon/Downloads/Rentila-Locataires.xlsx')
ws = wb.active
h = [cell.value for cell in next(ws.iter_rows(min_row=1,max_row=1))]
rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    rows.append(dict(zip(h, row)))
print(json.dumps(rows))
"`, { encoding: "utf8" }
  );
  rentila = JSON.parse(raw);
  console.log(`✅ Rentila: ${rentila.length} locataires`);
} catch (e) {
  console.error("❌ Impossible de lire Rentila XLSX:", e.message);
  process.exit(1);
}

// ── 2. Charger TSV ──────────────────────────────────────────────────────────
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

function toBienId(logement) {
  const l = (logement || "").toLowerCase();
  if (l.includes("amaryllis")) return "amaryllis";
  if (l.includes("iguana"))    return "iguana";
  if (l.includes("zandoli"))   return "zandoli";
  if (l.includes("géko") || l.includes("geko")) return "geko";
  if (l.includes("mabouya"))   return "mabouya";
  if (l.includes("nogent") || l.includes("proche paris") || l.includes("jardin, proche")) return "nogent";
  if (l.includes("schoel") || l.includes("calme, splendide") || l.includes("appartement de standing")) return "schoelcher";
  return l.slice(0, 20);
}

const reservations = [];

for (const row of parseTsv(resolve(__dir, "airbnb-historique.tsv"))) {
  if (!row["code de confirmation"]) continue;
  reservations.push({
    id: row["code de confirmation"],
    voyageur: row["voyageur"],
    bienId: toBienId(row["logement"]),
    canal: "airbnb",
    checkin: row["arrivée"],
    checkout: row["départ"],
    montant: parseFloat(row["montant"]) || 0,
  });
}
for (const row of parseTsv(resolve(__dir, "booking-historique.tsv"))) {
  const id = row["id réservation"] || row["id reservation"];
  if (!id) continue;
  reservations.push({
    id,
    voyageur: row["nom du client"],
    bienId: toBienId(row["logement"]),
    canal: "booking",
    checkin: row["arrivée"],
    checkout: row["départ"],
    montant: parseFloat(row["montant"]) || 0,
  });
}
for (const row of parseTsv(resolve(__dir, "direct-historique.tsv"))) {
  if (!row["id"]) continue;
  reservations.push({
    id: row["id"],
    voyageur: row["nom du client"],
    bienId: toBienId(row["logement"]),
    canal: "direct",
    checkin: row["arrivée"],
    checkout: row["départ"],
    montant: parseFloat(row["montant"]) || 0,
  });
}

// ── 3. Charger CSV Airbnb ────────────────────────────────────────────────────
function parseCsvLine(line) {
  const fields = []; let current = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current); current = "";
    } else current += ch;
  }
  fields.push(current);
  return fields;
}
function fmtDate(d) {
  if (!d) return "";
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1]}-${m[2]}`;
  return d;
}

const seenIds = new Set(reservations.map(r => r.id));
for (const csvPath of [
  "/Users/vincentsalomon/Downloads/airbnb_01_2022-06_2026.csv",
  "/Users/vincentsalomon/Downloads/airbnb_01_2022-06_2026 (1).csv",
]) {
  try {
    const lines = readFileSync(csvPath, "utf8").split("\n").filter(l => l.trim());
    const headers = parseCsvLine(lines[0]);
    for (const line of lines.slice(1)) {
      const vals = parseCsvLine(line);
      const row = Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] || "").trim()]));
      if (row["Type"] !== "Réservation") continue;
      const rid = row["Code de confirmation"];
      if (!rid || seenIds.has(rid)) continue;
      seenIds.add(rid);
      const montant = parseFloat((row["Revenus bruts"] || "0").replace(/\s/g, "").replace(",", ".")) || 0;
      reservations.push({
        id: rid,
        voyageur: row["Voyageur"],
        bienId: toBienId(row["Logement"]),
        canal: "airbnb",
        checkin: fmtDate(row["Date de début"]),
        checkout: fmtDate(row["Date de fin"]),
        montant,
      });
    }
  } catch (e) { /* fichier absent */ }
}

console.log(`📋 Réservations totales: ${reservations.length}`);

// ── 4. Agréger par client ────────────────────────────────────────────────────
const clientMap = new Map(); // nameKey → { ...data, resas: [] }

for (const resa of reservations) {
  const k = nameKey(resa.voyageur);
  if (!k) continue;
  if (!clientMap.has(k)) {
    clientMap.set(k, { nameKey: k, voyageur: resa.voyageur, resas: [] });
  }
  clientMap.get(k).resas.push(resa);
}

// ── 5. Croiser avec Rentila ──────────────────────────────────────────────────
const rentilaByKey = new Map();
for (const r of rentila) {
  const prenom = String(r["Prénom"] || "").trim();
  const nom    = String(r["Nom"] || "").trim();
  const k = nameKey(`${prenom} ${nom}`);
  if (k) rentilaByKey.set(k, r);
}

// ── 6. Construire les enregistrements CRM ────────────────────────────────────
const clients = [];

// A. Tous les clients Rentila (avec ou sans résa dans notre historique)
for (const r of rentila) {
  const prenom = String(r["Prénom"] || "").trim();
  const nom    = String(r["Nom"] || "").trim();
  if (!prenom && !nom) continue;

  const k    = nameKey(`${prenom} ${nom}`);
  const data = k ? clientMap.get(k) : null;
  const resas = data ? data.resas : [];

  const biens   = [...new Set(resas.map(r => r.bienId))];
  const canaux  = resas.map(r => r.canal);
  const canalCount = {};
  for (const c of canaux) canalCount[c] = (canalCount[c] || 0) + 1;
  const canalPrincipal = Object.entries(canalCount).sort((a,b) => b[1]-a[1])[0]?.[0] || "direct";
  const dates = resas.map(r => r.checkin).filter(Boolean).sort();
  const ltv   = resas.reduce((s, r) => s + r.montant, 0);

  // Bien loué dans Rentila → on essaie de l'identifier
  const bienRentila = String(r["Bien loué"] || "").trim();
  const bienIdRentila = toBienId(bienRentila);
  const biensFinal = biens.length > 0 ? biens : (bienIdRentila ? [bienIdRentila] : []);

  const tags = [];
  if (resas.length >= 2) tags.push("récurrent");
  if (r["E-mail"]) tags.push("contactable-email");
  if (r["Mobile"] || r["Téléphone"]) tags.push("contactable-tel");
  if (ltv >= 3000) tags.push("vip");

  clients.push({
    id: makeId(prenom, nom),
    prenom,
    nom,
    email: r["E-mail"] || null,
    mobile: r["Mobile"] || r["Téléphone"] || null,
    adresse: r["Adresse"] || null,
    ville: r["Ville"] || null,
    pays: r["Pays"] || null,
    nb_sejours: resas.length,
    ltv_total: Math.round(ltv),
    premier_sejour: dates[0] || null,
    dernier_sejour: dates[dates.length - 1] || null,
    biens: JSON.stringify(biensFinal),
    canal_principal: canalPrincipal,
    is_recurrent: resas.length >= 2 ? 1 : 0,
    source: "rentila",
    notes: r["Notes"] || null,
    tags: JSON.stringify(tags),
  });
}

// B. Récurrents NON dans Rentila (≥2 séjours, avec LTV)
const rentilaKeys = new Set(clients.map(c => nameKey(`${c.prenom} ${c.nom}`)).filter(Boolean));
for (const [k, data] of clientMap.entries()) {
  if (data.resas.length < 2) continue;
  if (rentilaKeys.has(k)) continue; // déjà dans Rentila

  const parts = k.split("|").sort((a,b) => b.length - a.length);
  const nom    = parts[0] ? (parts[0].charAt(0).toUpperCase() + parts[0].slice(1)) : "";
  const prenom = parts[1] ? (parts[1].charAt(0).toUpperCase() + parts[1].slice(1)) : "";

  const resas = data.resas;
  const biens = [...new Set(resas.map(r => r.bienId))];
  const canaux = resas.map(r => r.canal);
  const canalCount = {};
  for (const c of canaux) canalCount[c] = (canalCount[c] || 0) + 1;
  const canalPrincipal = Object.entries(canalCount).sort((a,b) => b[1]-a[1])[0]?.[0] || "inconnu";
  const dates = resas.map(r => r.checkin).filter(Boolean).sort();
  const ltv   = resas.reduce((s, r) => s + r.montant, 0);

  const tags = ["récurrent"];
  if (ltv >= 3000) tags.push("vip");

  clients.push({
    id: makeId(prenom, nom),
    prenom,
    nom,
    email: null,
    mobile: null,
    adresse: null,
    ville: null,
    pays: null,
    nb_sejours: resas.length,
    ltv_total: Math.round(ltv),
    premier_sejour: dates[0] || null,
    dernier_sejour: dates[dates.length - 1] || null,
    biens: JSON.stringify(biens),
    canal_principal: canalPrincipal,
    is_recurrent: 1,
    source: "historique",
    notes: null,
    tags: JSON.stringify(tags),
  });
}

// ── 7. Stats ─────────────────────────────────────────────────────────────────
console.log(`\n📊 BASE CRM :`);
console.log(`  Total clients       : ${clients.length}`);
console.log(`  Avec email          : ${clients.filter(c => c.email).length}`);
console.log(`  Avec tel            : ${clients.filter(c => c.mobile).length}`);
console.log(`  Récurrents          : ${clients.filter(c => c.is_recurrent).length}`);
console.log(`  VIP (LTV ≥ 3000€)  : ${clients.filter(c => c.ltv_total >= 3000).length}`);
console.log(`  LTV totale          : ${clients.reduce((s,c) => s+c.ltv_total, 0).toLocaleString("fr-FR")}€`);
console.log(`\nTop 10 LTV :`);
clients.sort((a,b) => b.ltv_total - a.ltv_total).slice(0, 10).forEach(c => {
  const contact = c.email ? "✉️" : (c.mobile ? "📞" : "");
  console.log(`  ${c.prenom} ${c.nom} | ${c.nb_sejours}x | ${c.ltv_total}€ | ${JSON.parse(c.biens).join(",")} ${contact}`);
});

if (DRY) {
  console.log("\n✅ Mode --dry : aucun insert. Relancer sans --dry pour importer.");
  process.exit(0);
}

// ── 8. Insert D1 via wrangler (par batch de 50) ──────────────────────────────
console.log(`\n📤 Import D1 (${clients.length} clients)...`);

const BATCH = 20;
let inserted = 0, updated = 0;

for (let i = 0; i < clients.length; i += BATCH) {
  const batch = clients.slice(i, i + BATCH);

  // Construire un UPSERT multi-valeurs
  const placeholders = batch.map(() =>
    "(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))"
  ).join(",\n");

  const values = batch.flatMap(c => [
    c.id, c.prenom, c.nom, c.email, c.mobile,
    c.adresse, c.ville, c.pays,
    c.nb_sejours, c.ltv_total, c.premier_sejour, c.dernier_sejour,
    c.biens, c.canal_principal, c.is_recurrent,
    c.source, c.notes, c.tags,
  ]);

  const sql = `INSERT INTO crm_clients
    (id,prenom,nom,email,mobile,adresse,ville,pays,nb_sejours,ltv_total,
     premier_sejour,dernier_sejour,biens,canal_principal,is_recurrent,
     source,notes,tags,created_at,updated_at)
  VALUES ${placeholders}
  ON CONFLICT(id) DO UPDATE SET
    nb_sejours=excluded.nb_sejours, ltv_total=excluded.ltv_total,
    premier_sejour=excluded.premier_sejour, dernier_sejour=excluded.dernier_sejour,
    biens=excluded.biens, canal_principal=excluded.canal_principal,
    is_recurrent=excluded.is_recurrent, tags=excluded.tags,
    updated_at=datetime('now')`;

  // Wrangler ne supporte pas les bindings via CLI → on utilise un fichier SQL temp
  const { writeFileSync, unlinkSync } = await import("fs");
  const tmpFile = `/tmp/crm_batch_${i}.sql`;

  // Échapper les valeurs manuellement pour le SQL
  const escaped = values.map(v => {
    if (v === null || v === undefined) return "NULL";
    return `'${String(v).replace(/'/g, "''")}'`;
  });

  let sqlFilled = sql;
  for (const val of escaped) {
    sqlFilled = sqlFilled.replace("?", val);
  }

  writeFileSync(tmpFile, sqlFilled);
  try {
    execSync(
      `cd /Users/vincentsalomon/locatif-dashboard && npx wrangler d1 execute revenue_manager --remote --file=${tmpFile} 2>&1`,
      { encoding: "utf8", stdio: "pipe" }
    );
    inserted += batch.length;
    process.stdout.write(`  ✓ batch ${Math.floor(i/BATCH)+1}/${Math.ceil(clients.length/BATCH)} (${batch.length} clients)\n`);
  } catch (e) {
    console.error(`  ✗ batch ${Math.floor(i/BATCH)+1} ERREUR:`, e.message.slice(0, 200));
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

console.log(`\n🏁 Terminé — ${inserted} clients importés dans D1 crm_clients`);
