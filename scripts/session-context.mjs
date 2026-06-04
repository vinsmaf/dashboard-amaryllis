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

let out = "🧠 RAPPEL MÉMOIRE (injecté au démarrage — .memory/) — lis avant d'agir :\n\n";
out += context.trim();
if (reminders.length) {
  out += "\n\n---\n\n### ⏰ Rappels ouverts (.memory/BLOCKERS.md)\n\n" + reminders.join("\n\n");
}
out += "\n\n_(Détail complet : .memory/INDEX.md · décisions : .memory/ADR.md · pièges : .memory/LEARNINGS.md)_";

process.stdout.write(out);
