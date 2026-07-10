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

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";

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

// ── INV7 — Documentation des endpoints : chaque functions/api/*.js réel doit apparaître dans CLAUDE.md
// (évite la dette constatée le 2026-07-04 : 119 commits ajoutant des endpoints vs 21 touchant CLAUDE.md)
{
  const claudeMd = read("CLAUDE.md") || "";
  const files = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(`${ROOT}/${dir}`, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".js") && !e.name.startsWith("_") && !e.name.endsWith(".test.js")) files.push(p);
    }
  };
  walk("functions/api");
  // Route réelle : functions/api/foo.js → foo · functions/api/foo/[[path]].js ou [file].js → foo (dossier parent)
  const routeName = (p) => p.replace(/^functions\/api\//, "").replace(/\.js$/, "").split("/")[0];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
  const missing = [...new Set(files.map(routeName))]
    .filter((name) => !new RegExp(`/api/${esc(name)}(?![a-zA-Z0-9_-])`).test(claudeMd));
  add("INV7 doc endpoints (CLAUDE.md)", missing.length ? "RISK" : "PASS",
    missing.length ? `${missing.length} route(s) sans doc : ${missing.slice(0, 8).map((n) => `/api/${n}`).join(", ")}${missing.length > 8 ? "…" : ""}`
      : `${files.length} fichiers, toutes les routes référencées dans CLAUDE.md`);
}

// ── INV8 — tout endpoint d'écriture doit être authentifié (SEC audit Fable 5 2026-07-09, Lot 5)
// Tout functions/api/*.js exposant POST/PUT/PATCH/DELETE doit référencer verifyBearer OU une
// variable *_SECRET. Exceptions explicites : webhooks signés (vérif de signature, pas de Bearer)
// et endpoints publics volontairement ouverts mais rate-limités.
{
  const EXCEPTIONS = new Set([
    "functions/api/beds24-webhook.js",
    "functions/api/stripe-webhook.js",
    "functions/api/airbnb-email-import.js",
    "functions/api/social-webhook.js",
    "functions/api/contact.js",
    "functions/api/chat.js",
    "functions/api/sign-contract.js",
    "functions/api/service-checkout.js",
    "functions/api/newsletter-subscribe.js",
    "functions/api/newsletter-confirm.js",
    "functions/api/newsletter-unsubscribe.js",
    "functions/api/client-errors.js",
    "functions/api/reclamations.js",
    "functions/api/create-payment-intent.js",
    "functions/api/create-deposit-intent.js",
    "functions/api/caution-checkout.js",
    "functions/api/complement-checkout.js",
    // Vague B (ERREURS-LOG.md 2026-06-01) : publics par design, protégés par rate-limit
    // SEUL (jamais d'auth admin) — choix de sécurité déjà validé, pas un manque.
    "functions/api/admin-auth.js",   // émet le token lui-même, ne peut pas en exiger un
    "functions/api/ai-summary.js",
    "functions/api/beds24-create.js",
    "functions/api/beds24-manage.js",
  ]);
  const files = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(`${ROOT}/${dir}`, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".js") && !e.name.endsWith(".test.js")) files.push(p);
    }
  };
  walk("functions/api");
  const WRITE_METHOD = /onRequestPost|onRequestPut|onRequestPatch|onRequestDelete|method\s*===\s*["'](POST|PUT|PATCH|DELETE)["']/;
  const PROTECTED = /verifyBearer|[A-Z][A-Z0-9_]*_(SECRET|TOKEN)\b/;
  const offenders = files.filter((f) => {
    if (EXCEPTIONS.has(f)) return false;
    const src = read(f) || "";
    return WRITE_METHOD.test(src) && !PROTECTED.test(src);
  });
  add("INV8 auth sur endpoints d'écriture", offenders.length ? "FAIL" : "PASS",
    offenders.length ? `${offenders.length} endpoint(s) d'écriture sans verifyBearer/*_SECRET : ${offenders.slice(0, 8).join(", ")}${offenders.length > 8 ? "…" : ""}`
      : `${files.length} fichiers scannés, tous les endpoints d'écriture sont protégés ou explicitement whitelistés (${EXCEPTIONS.size} exceptions)`);
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
