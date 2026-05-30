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
import { join, dirname, basename } from "node:path";
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
}

console.log(`🖼  Variantes images : ${originals} originaux · ${generated} générées · ${skipped} à jour · ${dropped} ignorées (>= original)`);
