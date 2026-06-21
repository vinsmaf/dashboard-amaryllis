#!/usr/bin/env node
/**
 * scripts/reel-video-upload.mjs
 * Upload une vidéo Reel → public/videos/reel-{bienId}.mp4 → deploy rapide → URL publique
 *
 * Usage :
 *   node scripts/reel-video-upload.mjs <bienId> <fichierVideo>
 *   npm run reel:video amaryllis ~/Downloads/reel-best.mp4
 *
 * Résultat : https://villamaryllis.com/videos/reel-{bienId}.mp4
 */

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, extname } from "node:path";

const SITE_URL   = "https://villamaryllis.com";
const VALID_BIENS = ["amaryllis", "iguana", "zandoli", "geko", "mabouya", "schoelcher", "nogent"];

const [,, bienId, videoArg] = process.argv;

if (!bienId || !videoArg) {
  console.error("Usage: node scripts/reel-video-upload.mjs <bienId> <videoFile>");
  console.error("Biens valides:", VALID_BIENS.join(", "));
  process.exit(1);
}
if (!VALID_BIENS.includes(bienId)) {
  console.error(`❌ bienId invalide "${bienId}". Valides : ${VALID_BIENS.join(", ")}`);
  process.exit(1);
}

const videoSrc = resolve(videoArg.replace(/^~/, process.env.HOME));
if (!existsSync(videoSrc)) {
  console.error(`❌ Fichier introuvable : ${videoSrc}`);
  process.exit(1);
}
if (extname(videoSrc).toLowerCase() !== ".mp4") {
  console.error("❌ Seul le format .mp4 est accepté pour Instagram Reels.");
  process.exit(1);
}

const destDir  = "public/videos";
const destName = `reel-${bienId}.mp4`;
const destPath = `${destDir}/${destName}`;

mkdirSync(destDir, { recursive: true });
copyFileSync(videoSrc, destPath);
console.log(`✓ Copié → ${destPath}`);

console.log("🚀 Déploiement en cours (SKIP_TESTS=1)…");
execSync(`SKIP_TESTS=1 SKIP_AUDIT=1 bash scripts/deploy-pages.sh`, { stdio: "inherit" });

const url = `${SITE_URL}/videos/${destName}`;
console.log(`\n✅ Vidéo en ligne : ${url}`);
console.log(`\n📋 URL à coller dans le draft Reel : ${url}`);
