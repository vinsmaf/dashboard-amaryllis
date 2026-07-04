#!/usr/bin/env node
// Génère functions/api/_featureDigest.js — un résumé statique et COMMITTÉ (pas régénéré
// à chaque build, contrairement à _biens.js) des endpoints/onglets déjà existants.
//
// But : donner à agents-triage.js un moyen bon marché de repérer "cette recommandation
// décrit probablement une feature déjà construite" SANS accès live au repo (impossible
// depuis un Worker/Function Cloudflare) ni appel API externe (pas de nouveau secret).
//
// ⚠️ Snapshot, pas une source vivante — à régénérer périodiquement (ex. à la clôture de
// session, ou quand le digest semble périmé), PAS à chaque déploiement : un digest manquant
// casserait l'import dans agents-triage.js et donc TOUTE la bundle Functions. En committant
// le résultat, un oubli de régénération dégrade juste la fraîcheur, jamais le build.
//
// Usage : node scripts/generate-feature-digest.mjs

import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const API_DIR = join(ROOT, "functions", "api");
const TABS_DIR = join(ROOT, "src", "tabs");

function extractHeader(filePath) {
  const lines = readFileSync(filePath, "utf8").split("\n").slice(0, 6);
  const first = lines.find(l => l.startsWith("// Cloudflare Pages Function"));
  if (!first) return null;
  const desc = lines.find((l, i) => i > 0 && l.startsWith("//") && !l.includes("Cloudflare Pages Function"));
  const route = (first.match(/\/api\/[a-zA-Z0-9_-]+/) || [])[0] || "";
  return { route, desc: desc ? desc.replace(/^\/\/\s*/, "").trim() : "" };
}

function endpointsDigest() {
  const files = readdirSync(API_DIR).filter(f => f.endsWith(".js") && !f.endsWith(".test.js"));
  const lines = [];
  for (const f of files.sort()) {
    const h = extractHeader(join(API_DIR, f));
    if (h && h.route) lines.push(`${h.route} (${f})${h.desc ? " — " + h.desc : ""}`);
  }
  return lines;
}

function tabsDigest() {
  if (!statSync(TABS_DIR, { throwIfNoEntry: false })) return [];
  return readdirSync(TABS_DIR).filter(f => f.endsWith(".jsx")).sort().map(f => f.replace(/\.jsx$/, ""));
}

const endpoints = endpointsDigest();
const tabs = tabsDigest();

const out = `// GÉNÉRÉ par scripts/generate-feature-digest.mjs — snapshot périodique (PAS live, PAS à chaque build).
// But : donner à agents-triage.js un signal bon marché "ça ressemble à une feature déjà construite"
// sans accès repo live (impossible depuis un Worker) ni appel API externe (pas de nouveau secret).
// Régénérer manuellement (node scripts/generate-feature-digest.mjs) quand le digest semble périmé —
// un oubli dégrade juste la fraîcheur du signal, ne casse jamais le build (fichier committé).
// Dernière génération : ${new Date().toISOString().slice(0, 10)}

export const ENDPOINTS_DIGEST = ${JSON.stringify(endpoints, null, 2)};

export const ADMIN_TABS_DIGEST = ${JSON.stringify(tabs, null, 2)};
`;

writeFileSync(join(API_DIR, "_featureDigest.js"), out);
console.log(`✓ _featureDigest.js généré — ${endpoints.length} endpoints, ${tabs.length} onglets admin`);
