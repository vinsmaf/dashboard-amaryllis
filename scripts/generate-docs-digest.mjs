#!/usr/bin/env node
// Génère functions/api/_docsDigest.js — snapshot statique et COMMITTÉ (comme
// _featureDigest.js) des docs stratégiques de docs/, pour ingestion RAG.
//
// PROBLÈME RÉSOLU (2026-07-04) : aucun agent de la fleet n'avait accès au contenu
// des docs/*.md (ateliers, campagnes, playbooks ponctuels) — seul rag-ingest.js
// alimente le RAG, et il n'ingérait que faits biens + avis Google + captions
// sociales. Un agent (voyageur-research) a donc régénéré à l'identique 4 personas
// déjà définis dans docs/marketing/atelier-acquisition-roi-2026-06.md, faute
// d'accès à ce doc. `files_hint` dans agents-run.js n'est QUE du texte de chemin,
// jamais lu comme contenu — et les Cloudflare Pages Functions n'ont pas d'accès
// filesystem en prod, donc rag-ingest.js ne peut PAS lire docs/*.md au runtime.
// Solution : ce script (dev-time, Node) lit les docs, découpe par section (## ),
// et écrit un module JS statique importable par les Functions (comme _biens.js).
//
// Périmètre volontairement scopé (PAS tout docs/) : dossiers à contenu stratégique
// vivant, exclut docs/superpowers/{specs,plans} (specs dev, hors sujet business)
// et docs/_audits (transitoire, gitignoré de toute façon).
//
// ⚠️ Snapshot, pas une source vivante — à régénérer manuellement quand un doc de
// ce périmètre est ajouté/modifié significativement (cf. skill /cloture-session).
// Un oubli dégrade juste la fraîcheur du RAG, ne casse jamais le build (committé).
//
// Usage : node scripts/generate-docs-digest.mjs

import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS_DIRS = [
  "docs/marketing", "docs/strategie", "docs/revenue-manager",
  "docs/crm", "docs/service-client", "docs/seo", "docs/legal",
];
const MAX_CHUNK_CHARS = 700; // sous la limite de 800 chars du stockage metadata (_rag.js)

// Docs "épinglés" : contenu INTÉGRAL (pas chunké/tronqué) exporté en plus des sections
// RAG — pour un affichage admin complet (ex. AvisTab) ou une injection permanente dans
// le prompt d'agents précis, sans dépendre du hasard de la retrieval RAG. Liste courte
// et volontaire (pas tout docs/) : n'ajouter que des docs vraiment destinés à un accès
// garanti, pas juste "intéressants".
const PINNED_PATHS = ["docs/crm/rapport-voix-voyageur-2026-07.md"];

function walkMd(dir) {
  const abs = join(ROOT, dir);
  let entries;
  try { entries = readdirSync(abs); } catch { return []; }
  const files = [];
  for (const e of entries) {
    const p = join(abs, e);
    if (statSync(p).isDirectory()) files.push(...walkMd(relative(ROOT, p)));
    else if (e.toLowerCase().endsWith(".md")) files.push(relative(ROOT, p));
  }
  return files;
}

// Découpe un doc markdown par titres H2 (## ) ET H3 (### ) — un H2 qui contient
// plusieurs H3 (ex. 4 personas sous "## Le bon public") DOIT être coupé au niveau
// H3, sinon la troncature à MAX_CHUNK_CHARS ne garde que le premier sous-titre et
// perd les suivants (bug trouvé le 2026-07-04 : personas B/C/D disparaissaient).
// Le titre H3 est préfixé du titre H2 parent pour garder le contexte ("H2 › H3").
function splitSections(content) {
  const lines = content.split("\n");
  const sections = [];
  let h2 = "Introduction";
  let current = { title: h2, body: [] };
  const flush = () => { if (current.body.some(l => l.trim())) sections.push(current); };
  for (const line of lines) {
    const m2 = /^##\s+(?!#)(.+)/.exec(line);
    const m3 = /^###\s+(.+)/.exec(line);
    if (m2) {
      flush();
      h2 = m2[1].trim();
      current = { title: h2, body: [] };
    } else if (m3) {
      flush();
      current = { title: `${h2} › ${m3[1].trim()}`, body: [] };
    } else {
      current.body.push(line);
    }
  }
  flush();
  return sections;
}

function docItems(relPath) {
  const content = readFileSync(join(ROOT, relPath), "utf8");
  const sections = splitSections(content);
  const items = [];
  sections.forEach((s, i) => {
    const bodyText = s.body.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!bodyText) return;
    const text = `[${relPath} § ${s.title}] ${bodyText}`.slice(0, MAX_CHUNK_CHARS);
    // Vectorize limite les id à 64 octets — un chemin+titre slugifié dépasse
    // facilement (trouvé en ingérant en prod : "id too long, max 64"). Hash
    // court du chemin (12 hex = 48 bits, collision négligeable sur 33 docs) +
    // index de section, largement sous la limite quelle que soit la longueur
    // du chemin d'origine.
    const pathHash = createHash("sha1").update(relPath).digest("hex").slice(0, 12);
    const id = `doc-${pathHash}-${i}`;
    items.push({ id, text, metadata: { source: "doc", doc: relPath } });
  });
  return items;
}

const allFiles = DOCS_DIRS.flatMap(walkMd).sort();
const items = allFiles.flatMap(docItems);

const pinned = {};
for (const p of PINNED_PATHS) {
  try { pinned[p] = readFileSync(join(ROOT, p), "utf8"); }
  catch { console.warn(`⚠️  PINNED_PATHS: ${p} introuvable, ignoré`); }
}

const out = `// GÉNÉRÉ par scripts/generate-docs-digest.mjs — snapshot périodique (PAS live, PAS à chaque build).
// But : donner au RAG (rag-ingest.js) un accès au contenu des docs stratégiques
// (docs/marketing, strategie, revenue-manager, crm, service-client, seo, legal) —
// sinon invisibles pour toute la fleet d'agents (files_hint = chemins texte
// seulement, jamais le contenu ; pas d'accès filesystem en prod Cloudflare).
// Régénérer manuellement (node scripts/generate-docs-digest.mjs) quand un doc de
// ce périmètre change significativement — un oubli dégrade juste la fraîcheur.
// Dernière génération : ${new Date().toISOString().slice(0, 10)} — ${allFiles.length} docs, ${items.length} sections.

export const DOCS_DIGEST = ${JSON.stringify(items, null, 2)};

// Contenu intégral (non chunké) des docs épinglés — cf. PINNED_PATHS du générateur.
export const PINNED_DOCS = ${JSON.stringify(pinned, null, 2)};
`;

writeFileSync(join(ROOT, "functions", "api", "_docsDigest.js"), out);
console.log(`✓ _docsDigest.js généré — ${allFiles.length} docs, ${items.length} sections`);
