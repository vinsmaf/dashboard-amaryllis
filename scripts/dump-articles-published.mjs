#!/usr/bin/env node
// Régénère scripts/articles-published.json depuis D1 (slugs des articles publiés).
// À lancer après tout changement de statut d'article (publication/dépublication
// via l'admin) pour que le sitemap (scripts/prerender.mjs) reste aligné sur D1.
//
// Usage : node scripts/dump-articles-published.mjs
// Requiert wrangler authentifié (accès D1 revenue-manager).

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const out = execSync(
  `npx wrangler d1 execute revenue-manager --remote --json --command "SELECT slug FROM seo_articles WHERE status='published' ORDER BY slug"`,
  { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
);

// wrangler --json renvoie un tableau [{ results: [{slug}], ... }]
const parsed = JSON.parse(out);
const rows = Array.isArray(parsed) ? (parsed[0]?.results ?? []) : (parsed.results ?? []);
const slugs = [...new Set(rows.map(r => r.slug).filter(Boolean))].sort();

const dest = path.resolve("scripts/articles-published.json");
fs.writeFileSync(dest, JSON.stringify(slugs, null, 2) + "\n", "utf8");
console.log(`✅ ${slugs.length} slugs publiés → scripts/articles-published.json`);
