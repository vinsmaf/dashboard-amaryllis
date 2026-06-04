// Génère une image d'accueil TV statique par logement (PNG 1920×1080).
// Capture le slide d'accueil figé (`?tv=1&slide=0`) de l'écran TV en prod.
// Usage : node scripts/gen-tv-screens.mjs   →   public/tv/<bien>.png
// Sert pour les TV sans navigateur / économiseurs d'écran / diaporama photos.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.TV_BASE || "https://villamaryllis.com";
const BIENS = ["amaryllis", "zandoli", "geko", "mabouya", "schoelcher", "nogent"];
const OUT = path.join(process.cwd(), "public", "tv");
const VP = { width: 1920, height: 1080 };

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1 });
let ok = 0;

for (const bien of BIENS) {
  const page = await ctx.newPage();
  const url = `${BASE}/bienvenue/${bien}?tv=1&slide=0`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2500); // laisse charger photo hero + polices + entrée
    const file = path.join(OUT, `${bien}.png`);
    await page.screenshot({ path: file }); // viewport (pas fullPage) = exactement 1920×1080
    console.log(`  ✓ ${bien} → public/tv/${bien}.png`);
    ok++;
  } catch (e) {
    console.log(`  ✗ ${bien} : ${e.message}`);
  }
  await page.close();
}

await browser.close();
console.log(`\n🖼  ${ok}/${BIENS.length} images d'accueil TV générées → public/tv/`);
