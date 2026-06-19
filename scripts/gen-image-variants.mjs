#!/usr/bin/env node
/**
 * web-010 / media-011 — Génère des variantes responsive statiques des photos.
 *
 * Contexte : Cloudflare Image Resizing (/cdn-cgi/image/...) n'est PAS activé sur
 * ce compte (404). Le srcset de RImg retombait donc sur l'original plein format
 * → chaque visiteur téléchargeait des webp de 300-550 Ko, même sur mobile.
 *
 * Ce script pré-génère, pour chaque /public/photos/**\/*.webp, des variantes
 *   {nom}-480w.webp / -800w.webp / -1200w.webp / -1600w.webp
 * (jamais d'agrandissement). cfImg() pointe ensuite vers ces fichiers statiques.
 *
 * Idempotent : ne régénère pas une variante déjà à jour (mtime).
 * Lancé automatiquement avant `vite build`.
 */
import sharp from "sharp";
import { readdir, stat, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PHOTOS_DIR = join(ROOT, "public", "photos");

const WIDTHS = [480, 800, 1200, 1600];
const QUALITY = { 480: 74, 800: 82, 1200: 84, 1600: 88 };
const VARIANT_RE = /-\d+w\.webp$/i;

async function* walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name.toLowerCase().endsWith(".webp") && !VARIANT_RE.test(e.name)) yield p;
  }
}

async function fresh(srcPath, outPath) {
  try {
    const [a, b] = await Promise.all([stat(srcPath), stat(outPath)]);
    return b.mtimeMs >= a.mtimeMs;
  } catch { return false; }
}

let generated = 0, skipped = 0, dropped = 0, originals = 0;
const manifest = {}; // "/photos/x/02.webp" -> [480, 800] (largeurs réellement disponibles)
for await (const src of walk(PHOTOS_DIR)) {
  originals++;
  const dir = dirname(src);
  const name = basename(src, ".webp");
  const origSize = (await stat(src)).size;
  for (const w of WIDTHS) {
    const out = join(dir, `${name}-${w}w.webp`);
    if (await fresh(src, out)) { skipped++; continue; }
    // jamais agrandir (withoutEnlargement). On encode en mémoire pour comparer.
    const buf = await sharp(src)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY[w] })
      .toBuffer();
    // On ne garde la variante QUE si elle est plus légère que l'original.
    if (buf.length < origSize * 0.95) {
      await writeFile(out, buf);
      generated++;
    } else {
      await unlink(out).catch(() => {}); // nettoie une variante oversize existante
      dropped++;
    }
  }
  // Manifeste : VRAIES largeurs pixel de chaque variante (pas les cibles théoriques).
  // withoutEnlargement = un fichier -1200w.webp peut faire 455px si la source est petite.
  // Enregistrer la cible (1200) au lieu de la vraie largeur (455) fait mentir le srcset
  // → le navigateur croit avoir du 1200px, reçoit du 455px, upscale → flou.
  const rel = "/photos/" + src.slice(PHOTOS_DIR.length + 1).split(sep).join("/");
  const seen = new Set();
  const actualWidths = [];
  for (const w of WIDTHS) {
    const varPath = join(dir, `${name}-${w}w.webp`);
    if (!existsSync(varPath)) continue;
    const { width: aw } = await sharp(varPath).metadata();
    if (!seen.has(aw)) { seen.add(aw); actualWidths.push(aw); }
  }
  actualWidths.sort((a, b) => a - b);
  if (actualWidths.length) manifest[rel] = actualWidths;
}

// Écrit le manifeste consommé par <RImg> (src/primitives.jsx) — bundlé par vite.
const sortedManifest = Object.fromEntries(Object.keys(manifest).sort().map(k => [k, manifest[k]]));
await writeFile(join(ROOT, "src", "data", "imageVariants.json"), JSON.stringify(sortedManifest, null, 0) + "\n");

console.log(`🖼  Variantes images : ${originals} originaux · ${generated} générées · ${skipped} à jour · ${dropped} ignorées (>= original) · manifeste ${Object.keys(manifest).length} images`);
