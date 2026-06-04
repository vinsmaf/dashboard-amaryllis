#!/usr/bin/env node
// Rappel automatique de mémoire vive — branché sur le hook SessionStart (.claude/settings.json).
// Sa sortie stdout est injectée dans le contexte au DÉMARRAGE de chaque session, pour que le
// niveau 2 (rappel) soit un MÉCANISME et plus une simple convention.
//
// Imprime : l'état frais (.memory/CONTEXT.md) + les rappels OUVERTS de .memory/BLOCKERS.md
// (sections « ⏳ Décisions différées » et « 📌 Prochaine session »).
// Robuste : si .memory/ n'existe pas, sort en silence (exit 0) — n'empêche jamais une session.

import { readFileSync } from "node:fs";

const root = process.cwd();
const read = (p) => { try { return readFileSync(`${root}/${p}`, "utf8"); } catch { return null; } };

// Extrait les sections d'un markdown dont le titre `## ` contient l'un des marqueurs donnés,
// jusqu'au prochain `## ` (titre de même niveau).
function sections(md, markers) {
  if (!md) return [];
  const lines = md.split("\n");
  const out = [];
  let capture = false, buf = [];
  for (const line of lines) {
    if (/^##\s/.test(line)) {
      if (capture) { out.push(buf.join("\n").trim()); buf = []; }
      capture = markers.some((m) => line.includes(m));
    }
    if (capture) buf.push(line);
  }
  if (capture && buf.length) out.push(buf.join("\n").trim());
  return out;
}

const context = read(".memory/CONTEXT.md");
if (!context) process.exit(0); // pas de mémoire structurée ici → silence

const blockers = read(".memory/BLOCKERS.md");
const reminders = sections(blockers, ["Décisions différées", "Prochaine session"]);

// Filet « consolidation due » (indépendant du backend de planification) : nudge si la
// dernière consolidation date de plus de 7 jours. Le marqueur est lu dans
// .memory/.last-consolidation (écrit par /consolidation : une date ISO AAAA-MM-JJ).
function consolidationNudge() {
  const lastMatch = (read(".memory/CONTEXT.md") || "").match(/Dernière MAJ\s*:\s*\*\*(\d{4}-\d{2}-\d{2})/);
  const stamp = (read(".memory/.last-consolidation") || "").trim().slice(0, 10);
  // jours écoulés depuis la date donnée, sans dépendre de l'heure locale
  const daysSince = (iso) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return Infinity;
    const then = Date.parse(iso + "T00:00:00Z");
    if (Number.isNaN(then)) return Infinity;
    return Math.floor((Date.now() - then) / 86400000);
  };
  // référence = date de dernière consolidation si connue, sinon dernière MAJ du contexte
  const ref = stamp || (lastMatch ? lastMatch[1] : "");
  const d = daysSince(ref);
  if (d > 7) {
    return `\n\n---\n\n### 🧹 Entretien mémoire\n${stamp ? `Dernière consolidation il y a ${d} j` : "Aucune consolidation enregistrée"} (> 7 j) → pense à lancer **/consolidation** (jardinage : fusionner/archiver/promouvoir/réorganiser .memory/).`;
  }
  return "";
}

let out = "🧠 RAPPEL MÉMOIRE (injecté au démarrage — .memory/) — lis avant d'agir :\n\n";
out += context.trim();
if (reminders.length) {
  out += "\n\n---\n\n### ⏰ Rappels ouverts (.memory/BLOCKERS.md)\n\n" + reminders.join("\n\n");
}
out += consolidationNudge();
out += "\n\n_(Détail complet : .memory/INDEX.md · décisions : .memory/ADR.md · pièges : .memory/LEARNINGS.md)_";

process.stdout.write(out);
