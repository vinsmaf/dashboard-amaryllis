#!/usr/bin/env node
// scripts/triage-backlog-once.mjs
// Nettoyage rétroactif (one-shot) du backlog agents avec le classifieur _triage.js.
//
// Lit les actions backlog depuis l'API prod, calcule le verdict triage LOCALEMENT,
// et écrit le résultat en D1 via wrangler (génère un fichier SQL appliqué en --remote).
//
// Usage :
//   node scripts/triage-backlog-once.mjs            → DRY-RUN (audit, n'écrit rien)
//   node scripts/triage-backlog-once.mjs --apply    → génère + applique le SQL en prod
//
// Réversible : les actions vague/doublon passent en status='bloqué' + note ; rien n'est supprimé.

import { triageAction } from "../functions/api/_triage.js";
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const BASE = "https://villamaryllis.com";
const APPLY = process.argv.includes("--apply");

// 1. Récupérer le backlog. agents-actions est désormais admin-only → passer le secret
//    partagé via la variable d'env : POSTSTAY_SECRET=xxx node scripts/triage-backlog-once.mjs
const SECRET = process.env.POSTSTAY_SECRET || "";
const res = await fetch(`${BASE}/api/agents-actions${SECRET ? `?secret=${encodeURIComponent(SECRET)}` : ""}`);
if (!res.ok) { console.error("Fetch agents-actions échoué:", res.status, "(POSTSTAY_SECRET défini ?)"); process.exit(1); }
const data = await res.json();
const all = data.actions || [];
const backlog = all.filter(a => a.status === "backlog");
const active = all.filter(a => ["backlog", "a-planifier"].includes(a.status));

console.log(`Backlog: ${backlog.length} actions | actives totales: ${active.length}`);

// 2. Calculer le verdict pour chaque action backlog
const sqlEsc = (s) => String(s).replace(/'/g, "''");
const lines = [];
let nBlocked = 0, nRisk = 0;
const byReason = { vague: 0, court: 0, duplicate: 0, invalide: 0 };

// ⚠️ Les "doublons" Jaccard sont sur-déclenchés sur des phrases de structure
// identique mais à cible différente (bien/lieu/jour-nuit). On NE bloque PAS les
// doublons automatiquement — on les signale pour revue manuelle. On ne bloque
// QUE les "vague"/"court" (haute confiance). Tout le reste reçoit son risk.
const dupesToReview = [];
for (const a of backlog) {
  const others = active.filter(x => x.id !== a.id);
  const v = triageAction(a, others);
  if (!v.keep && (v.reason === "vague" || v.reason === "court" || v.reason === "invalide")) {
    byReason[v.reason] = (byReason[v.reason] || 0) + 1;
    nBlocked++;
    const note = `triage auto 31/05 : ${v.reason}`;
    console.log(`  [BLOQUÉ:${v.reason}] ${a.id} — ${(a.action || "").slice(0, 60)}`);
    lines.push(`UPDATE agent_actions SET status='bloqué', notes='${sqlEsc(note)}', risk='blocked' WHERE id='${sqlEsc(a.id)}';`);
  } else {
    // keep OU doublon présumé → on classe par risque (recalculé proprement), pas de blocage
    const risk = (v.risk) || (await import("../functions/api/_triage.js")).classifyRisk(a);
    if (!v.keep && v.reason === "duplicate") dupesToReview.push(`${a.id} ~ ${v.dupOf}`);
    nRisk++;
    lines.push(`UPDATE agent_actions SET risk='${sqlEsc(risk)}' WHERE id='${sqlEsc(a.id)}';`);
  }
}

console.log(`\nRésumé : ${nBlocked} bloquées (${JSON.stringify(byReason)}), ${nRisk} classées (risk).`);
if (dupesToReview.length) {
  console.log(`\n⚠️ ${dupesToReview.length} doublons PRÉSUMÉS — NON bloqués (revue manuelle, faux positifs probables : cibles différentes) :`);
  dupesToReview.forEach(d => console.log(`   ${d}`));
}

if (!APPLY) {
  console.log("\nDRY-RUN — aucune modification. Relancer avec --apply pour exécuter.");
  process.exit(0);
}

// 3. Appliquer via wrangler D1 (--remote) en un seul fichier SQL
const sqlFile = "/tmp/triage-backlog.sql";
writeFileSync(sqlFile, lines.join("\n") + "\n");
console.log(`\nApplication de ${lines.length} UPDATE via wrangler...`);
execSync(`npx wrangler d1 execute revenue-manager --remote --file=${sqlFile}`, { stdio: "inherit" });
console.log("APPLIQUÉ.");
