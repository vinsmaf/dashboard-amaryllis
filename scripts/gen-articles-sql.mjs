#!/usr/bin/env node
// Génère le fichier SQL pour les 30 articles SEO
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(__dirname, "..", "..");

// Lire les 3 fichiers de résultats
const PROJ = "/Users/vincentsalomon/.claude/projects/-Users-vincentsalomon-locatif-dashboard--claude-worktrees-sad-bartik-02a3c2/d38c7e6d-d1ec-4a13-b39f-3fa16408f5f8/tool-results";

function parseFile(fname) {
  const raw = JSON.parse(fs.readFileSync(path.join(PROJ, fname), "utf8"));
  const text = raw[0].text;
  return JSON.parse(text);
}

// Batch 2 inline (articles 11-20 from the session)
const batch2 = JSON.parse(fs.readFileSync("/tmp/batch2.json", "utf8"));

const batch1 = parseFile("toolu_01VqwmwX1ETx1ZtTRVMzjyGN.json");
const batch3 = parseFile("toolu_01XZ2pHPG5NnkpV6BPTxcHV4.json");

const allArticles = [...batch1, ...batch2, ...batch3];

console.log(`Total articles: ${allArticles.length}`);

function esc(s) {
  return (s || "").replace(/'/g, "''");
}

let sql = "-- Articles SEO — 30 mots-clés cibles\n\n";
for (const a of allArticles) {
  sql += `INSERT OR IGNORE INTO seo_articles (slug, title, meta_title, meta_desc, category, content_html, keywords, status, image_url)\nVALUES ('${esc(a.slug)}', '${esc(a.title)}', '${esc(a.meta_title)}', '${esc(a.meta_desc)}', '${esc(a.category)}', '${esc(a.content_html)}', '${esc(a.keywords)}', 'published', '${esc(a.image_url)}');\n\n`;
}

const outFile = path.join(__dirname, "seed-articles-30.sql");
fs.writeFileSync(outFile, sql);
console.log(`✅ SQL écrit dans ${outFile}`);
console.log(`Taille: ${Math.round(sql.length / 1024)} Ko`);
