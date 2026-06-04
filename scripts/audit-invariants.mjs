#!/usr/bin/env node
// Audit d'invariants — version DÉTERMINISTE et NON BLOQUANTE de la skill `auditeur`.
// Greffé dans scripts/deploy-pages.sh (post-smoke-test). Ne fait JAMAIS échouer le
// déploiement (exit 0 toujours). La skill LLM `auditeur` reste pour l'audit riche manuel ;
// ce script garde les invariants d'architecture sous contrôle à chaque déploiement.
//
// Vérifie : source unique des biens · miroirs GAS/Worker · CSP vs tracking ·
//           longueurs meta SEO · présence de la mémoire structurée.
// Sortie : résumé console + rapport rolling docs/_audits/AUDIT-latest.md.
// Désactiver : SKIP_AUDIT=1 npm run deploy:pages

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";

const ROOT = process.cwd();
const read = (p) => { try { return readFileSync(`${ROOT}/${p}`, "utf8"); } catch { return null; } };
const checks = [];
const add = (dim, status, evidence) => checks.push({ dim, status, evidence });

// ── INV1 — Source unique des biens : les 4 consommateurs importent src/data/biens.js
{
  const consumers = ["functions/[slug].js", "scripts/prerender.mjs", "functions/api/_biens.js", "src/PublicSite.jsx"];
  const missing = consumers.filter((f) => { const s = read(f); return !s || !/data\/biens(\.js)?["']/.test(s); });
  add("INV1 source unique des biens", missing.length ? "FAIL" : "PASS",
    missing.length ? `n'importent pas le canonique : ${missing.join(", ")}` : "les 4 consommateurs importent src/data/biens.js");
}

// ── INV2 — Miroirs de logique pure présents (GAS + Worker)
{
  const gasDedup = ["appscript/SCRIPT_SHEETS.js", "appscript/REVENUS_AUTO_2026.gs"].some((f) => /dedupKey|contentKey/i.test(read(f) || ""));
  const worker = read("workers/ical-sync/index.js") || "";
  const workerOcc = /runOccupancySnapshot|nightsBooked/.test(worker);
  const ok = gasDedup && workerOcc;
  add("INV2 miroirs GAS/Worker", ok ? "PASS" : "RISK",
    ok ? "resaDedup→appscript & occupancy→worker présents (synchro manuelle, cf. BLOCKERS)"
       : `miroir manquant : ${!gasDedup ? "dedup GAS " : ""}${!workerOcc ? "occupancy Worker" : ""}`.trim());
}

// ── INV4 — CSP : tout domaine tracking chargé doit être dans public/_headers
{
  const headers = read("public/_headers") || "";
  const required = ["googletagmanager.com", "google-analytics.com", "connect.facebook.net", "www.facebook.com", "js.stripe.com"];
  const missing = required.filter((d) => !headers.includes(d));
  add("INV4 CSP vs tracking", missing.length ? "FAIL" : "PASS",
    missing.length ? `domaines absents du CSP : ${missing.join(", ")}` : "tous les domaines tracking présents dans _headers");
}

// ── INV5 — Longueurs meta SEO dans le canonique
{
  const src = read("src/data/biens.js") || "";
  const re = /(seoTitle|seoDesc)\s*:\s*(["'`])([\s\S]*?)\2/g;
  let m; const bad = [];
  while ((m = re.exec(src))) { const lim = m[1] === "seoTitle" ? 60 : 158; if (m[3].length > lim) bad.push(`${m[1]} ${m[3].length}c>${lim}`); }
  add("INV5 meta SEO ≤ limites", bad.length ? "RISK" : "PASS",
    bad.length ? `dépassements : ${bad.join(" · ")}` : "seoTitle ≤60c & seoDesc ≤158c");
}

// ── INV6 — Mémoire structurée présente + PROJECT_MEMORY pas obèse
{
  const mem = [".memory/INDEX.md", ".memory/CONTEXT.md", ".memory/ADR.md", ".memory/LEARNINGS.md", ".memory/BLOCKERS.md", ".memory/ITERATIONS_LOG.md"];
  const missing = mem.filter((f) => { const s = read(f); return !s || s.trim().length === 0; });
  const pmBytes = (read("PROJECT_MEMORY.md") || "").length;
  const tooBig = pmBytes > 60000;
  const status = missing.length ? "FAIL" : (tooBig ? "RISK" : "PASS");
  add("INV6 mémoire structurée", status,
    missing.length ? `fichiers absents/vides : ${missing.join(", ")}`
      : `.memory complet · PROJECT_MEMORY ${pmBytes}o${tooBig ? " (>60Ko : à dégraisser)" : ""}`);
}

// ── Verdict global = pire dimension
const rank = { PASS: 0, RISK: 1, FAIL: 2 };
const worst = checks.reduce((w, c) => (rank[c.status] > rank[w] ? c.status : w), "PASS");
const emoji = { PASS: "🟢", RISK: "🟡", FAIL: "🔴" };

// ── Restitution console (non bloquante)
console.log(`   🕵️  Audit invariants : ${emoji[worst]} ${worst}`);
for (const c of checks) if (c.status !== "PASS") console.log(`      ${emoji[c.status]} ${c.dim} — ${c.evidence}`);

// ── Rapport rolling
try {
  mkdirSync(`${ROOT}/docs/_audits`, { recursive: true });
  const stamp = new Date().toISOString();
  const rows = checks.map((c) => `| ${c.dim} | ${emoji[c.status]} ${c.status} | ${c.evidence} |`).join("\n");
  const md = `# 🕵️ AUDIT invariants (auto, au déploiement) — ${stamp}

> Généré par \`scripts/audit-invariants.mjs\` (déterministe, non bloquant). Pour l'audit riche : skill \`auditeur\`.

## Verdict global : ${emoji[worst]} ${worst}

| Dimension | Statut | Preuve |
|---|---|---|
${rows}

${worst === "FAIL" ? "🔴 **Au moins un invariant cassé** — à corriger (le déploiement n'a PAS été bloqué, mais ne pas laisser traîner). Escalader dans \`.memory/BLOCKERS.md\`.\n" : worst === "RISK" ? "🟡 Dettes/risques mineurs — déployable, voir \`.memory/BLOCKERS.md\`.\n" : "🟢 RAS.\n"}`;
  writeFileSync(`${ROOT}/docs/_audits/AUDIT-latest.md`, md);
  console.log("      → rapport : docs/_audits/AUDIT-latest.md");
} catch (e) {
  console.log(`      ⚠️  rapport non écrit (${e.message})`);
}

process.exit(0); // NON BLOQUANT par contrat
