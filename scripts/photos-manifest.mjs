#!/usr/bin/env node
// Génère public/photos-manifest.json = { bienId: ["01","02",...] }
// Liste les photos de base (NN.webp, sans variant -800w/-1200w) de chaque bien.
// Utilisé par l'UI « Photos publiables » (galerie où Vincent coche les photos
// autorisées à la publication réseaux) — voir EditorialPhotosTab + editorial-photos.js.
// Lancer : node scripts/photos-manifest.mjs  (idéalement au build).

import { readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PHOTOS_DIR = join(ROOT, "public", "photos");
const BIENS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];

const manifest = {};
for (const bien of BIENS) {
  try {
    const files = readdirSync(join(PHOTOS_DIR, bien));
    const bases = files
      .filter((f) => /^\d+\.webp$/.test(f))         // NN.webp uniquement (pas les variants -800w)
      .map((f) => f.replace(/\.webp$/, ""))
      .sort((a, b) => Number(a) - Number(b));
    manifest[bien] = bases;
  } catch {
    manifest[bien] = [];
  }
}

const out = join(ROOT, "public", "photos-manifest.json");
writeFileSync(out, JSON.stringify(manifest) + "\n");
const total = Object.values(manifest).reduce((n, a) => n + a.length, 0);
console.log(`✅ photos-manifest.json — ${total} photos sur ${BIENS.length} biens :`,
  Object.fromEntries(Object.entries(manifest).map(([k, v]) => [k, v.length])));
