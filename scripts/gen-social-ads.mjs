// Rend les maquettes sociales "Claude Design" (social/*.html) en images PNG
// prêtes pour Meta/Instagram Ads.
//   - .frame.sq  -> 1080×1080 (post principal + slides carrousel)  [deviceScaleFactor 2]
//   - .frame.st  -> 1080×1920 (story)                              [deviceScaleFactor 2.5]
// Les photos relatives (../assets/photos/...) sont réécrites vers la prod
// (https://villamaryllis.com/photos/<bien>/NN.webp) pour charger par le réseau.
//
// Usage : node scripts/gen-social-ads.mjs
//   SOCIAL_DIR=/tmp/amaryllis-social/social  (défaut)
//   OUT=~/Downloads/meta-ads/social          (défaut)
//   FILES="villa-amaryllis.html studio-mabouya.html" (défaut)

import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const SOCIAL_DIR = process.env.SOCIAL_DIR || "/tmp/amaryllis-social/social";
const OUT = process.env.OUT || path.join(os.homedir(), "Downloads", "meta-ads", "social");
const BASE = process.env.SOCIAL_BASE || "https://villamaryllis.com";
const FILES = (process.env.FILES || "villa-amaryllis.html studio-mabouya.html").split(/\s+/);

mkdirSync(OUT, { recursive: true });

// Réécrit les chemins photos relatifs -> URLs absolues prod.
function rewritePhotos(html) {
  return html
    // ../assets/photos/<bien>/NN.(jpg|jpeg|webp|png) -> /photos/<bien>/NN.webp
    .replace(/\.\.\/assets\/photos\/([a-z]+)\/(\d+)\.(?:jpg|jpeg|webp|png)/g,
      (_m, bien, nn) => `${BASE}/photos/${bien}/${nn}.webp`)
    // ../assets/photos/<bien>-NN.(jpg|jpeg|webp|png) -> /photos/<bien>/NN.webp
    .replace(/\.\.\/assets\/photos\/([a-z]+)-(\d+)\.(?:jpg|jpeg|webp|png)/g,
      (_m, bien, nn) => `${BASE}/photos/${bien}/${nn}.webp`);
}

// slug de sortie depuis le nom de fichier
function slugOf(file) {
  return file.replace(/\.html$/, "")
    .replace(/^villa-/, "").replace(/^studio-/, "");
}

const browser = await chromium.launch();

async function renderFile(file) {
  const src = path.join(SOCIAL_DIR, file);
  if (!existsSync(src)) { console.warn(`⚠️  absent: ${src}`); return 0; }
  const slug = slugOf(file);
  const rewritten = rewritePhotos(readFileSync(src, "utf8"));
  const renderPath = path.join(SOCIAL_DIR, `__render-${file}`);
  writeFileSync(renderPath, rewritten);
  const fileUrl = "file://" + renderPath;

  let count = 0;

  for (const pass of [
    { sel: ".frame.sq", dsf: 2, w: 540, h: 540, label: "carre" },
    { sel: ".frame.st", dsf: 2.5, w: 432, h: 768, label: "story" },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 2000 }, deviceScaleFactor: pass.dsf });
    const page = await ctx.newPage();
    await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1200); // fonts + bg images
    const frames = page.locator(pass.sel);
    const n = await frames.count();
    let sqIdx = 0;
    for (let i = 0; i < n; i++) {
      const el = frames.nth(i);
      const cls = (await el.getAttribute("class")) || "";
      let name;
      if (cls.includes("story")) name = `${slug}-story.png`;
      else if (cls.includes("d1")) name = `${slug}-post.png`;
      else { sqIdx++; name = `${slug}-carrousel-${sqIdx}.png`; }
      const out = path.join(OUT, name);
      await el.screenshot({ path: out });
      console.log(`✅ ${name}`);
      count++;
    }
    await ctx.close();
  }
  return count;
}

let total = 0;
for (const f of FILES) total += await renderFile(f);
await browser.close();
console.log(`\n🎨 ${total} visuels rendus dans ${OUT}`);
