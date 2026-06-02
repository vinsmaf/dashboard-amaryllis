#!/usr/bin/env node
// Revue de code du diff → /api/code-review (→ inbox bugs).
// Lancé par deploy-pages.sh après un déploiement sain. Non bloquant.
//
//   POSTSTAY_SECRET=… node scripts/code-review-diff.mjs
//
// Diff analysé : changements non commités (git diff HEAD) ; si vide, le dernier
// commit (HEAD~1..HEAD). Couvre les 2 workflows (déploiement avec ou sans commit).

import { execSync } from "node:child_process";

const BASE = (process.env.BASE_URL || "https://villamaryllis.com").replace(/\/$/, "");
const SECRET = process.env.POSTSTAY_SECRET || "";
const DIFF_MAX = 16000;
const PATHS = ["src", "functions", "workers", "scripts"];

if (!SECRET) {
  console.log("   ℹ️  POSTSTAY_SECRET absent → revue de code ignorée.");
  process.exit(0);
}

function sh(cmd) { try { return execSync(cmd, { encoding: "utf8" }); } catch { return ""; } }

let label = "modifications non commitées";
let diff = sh(`git diff HEAD -- ${PATHS.join(" ")}`).trim();
if (!diff) {
  diff = sh(`git diff HEAD~1 HEAD -- ${PATHS.join(" ")}`).trim();
  label = "dernier commit : " + sh("git log -1 --pretty=%s").trim().slice(0, 80);
}
if (!diff) { console.log("   ✓ Aucun changement de code à relire."); process.exit(0); }
if (diff.length > DIFF_MAX) diff = diff.slice(0, DIFF_MAX);

try {
  const r = await fetch(`${BASE}/api/code-review?post=1&secret=${encodeURIComponent(SECRET)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ diff, label }),
  });
  const d = await r.json().catch(() => ({}));
  if (!d.ok) { console.log("   ⚠️  Revue de code indisponible:", JSON.stringify(d).slice(0, 160)); process.exit(0); }
  const f = d.findings || [];
  if (!f.length) {
    console.log(`   ✅ Revue de code (${label}) : aucun bug probable détecté.`);
  } else {
    console.log(`   🐞 Revue de code (${label}) : ${f.length} point(s) → inbox bugs :`);
    const order = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
    f.sort((a, b) => order[a.severity] - order[b.severity]);
    for (const x of f.slice(0, 8)) console.log(`      - [${x.severity}] ${x.file} : ${x.title}`);
  }
} catch (e) {
  console.log("   ⚠️  Revue de code échouée (non bloquant):", (e.message || "").slice(0, 120));
}
