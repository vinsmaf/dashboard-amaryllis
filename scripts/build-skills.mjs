#!/usr/bin/env node
/**
 * Build script : extrait les skills Amaryllis depuis ~/.claude/skills/*-amaryllis/SKILL.md
 * et génère functions/api/_skills.js avec leur contenu inline.
 *
 * À lancer après chaque modification d'un skill :
 *   node scripts/build-skills.mjs
 *
 * Le fichier généré _skills.js est commité et déployé avec les Functions Cloudflare.
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const SKILLS_DIR  = join(homedir(), ".claude", "skills");
const OUTPUT_FILE = join(process.cwd(), "functions", "api", "_skills.js");

const AGENT_TO_SKILL = {
  "community-manager":          "community-manager-amaryllis",
  "revenue-manager":            "revenue-manager-amaryllis",
  "crm-manager":                "crm-manager-amaryllis",
  "seo-content-writer":         "seo-content-writer-amaryllis",
  "traffic-manager":            "traffic-manager-amaryllis",
  "commercial-publicite":       "commercial-publicite-amaryllis",
  "responsable-service-client": "responsable-service-client-amaryllis",
  "photographe-da":             "photographe-da-amaryllis",
  "responsable-logistique":     "responsable-logistique-amaryllis",
  "webdesigner":                "webdesigner-amaryllis",
  "chef-produit-web":           "chef-produit-web-amaryllis",
  "consultant-ebusiness":       "consultant-ebusiness-amaryllis",
  "data-analyst":               "data-analyst-amaryllis",
  "developpeur-multimedia":     "developpeur-multimedia-amaryllis",
  "juriste-compliance":         "juriste-compliance-amaryllis",
  "architecte-reseau":          "architecte-reseau-amaryllis",
  "webmaster":                  "webmaster-amaryllis",
};

/**
 * Extrait le corps du skill (sans frontmatter YAML, sans titre H1)
 * et retourne une version condensée pour économiser tokens.
 */
function extractCore(markdown) {
  // Retirer le frontmatter YAML
  let content = markdown.replace(/^---\n[\s\S]*?\n---\n/, "");
  // Retirer le titre H1 d'intro
  content = content.replace(/^# .+\n\n/, "");
  return content.trim();
}

async function main() {
  console.log("📚 Build skills → functions/api/_skills.js");
  console.log(`Source : ${SKILLS_DIR}`);

  const skillsMap = {};
  let total = 0;
  let totalBytes = 0;

  for (const [agentId, skillName] of Object.entries(AGENT_TO_SKILL)) {
    const skillPath = join(SKILLS_DIR, skillName, "SKILL.md");
    try {
      const raw = await readFile(skillPath, "utf8");
      const core = extractCore(raw);
      skillsMap[agentId] = core;
      total++;
      totalBytes += core.length;
      console.log(`  ✓ ${agentId} ← ${skillName} (${(core.length / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.warn(`  ⚠ ${agentId} ← ${skillName} introuvable : ${e.message}`);
    }
  }

  const output = `// ⚠️ FICHIER GÉNÉRÉ AUTOMATIQUEMENT — ne pas éditer à la main.
// Source : ~/.claude/skills/*-amaryllis/SKILL.md
// Régénérer avec : node scripts/build-skills.mjs
//
// Ce fichier est importé par agents-run.js pour injecter le skill métier
// de chaque agent dans son prompt système.

export const AGENT_SKILLS = ${JSON.stringify(skillsMap, null, 2)};

export function getSkillForAgent(agentId) {
  return AGENT_SKILLS[agentId] || null;
}
`;

  await writeFile(OUTPUT_FILE, output, "utf8");

  console.log(`\n✅ Généré : ${OUTPUT_FILE}`);
  console.log(`   ${total} skills, ${(totalBytes / 1024).toFixed(1)} KB total`);
}

main().catch(err => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});
