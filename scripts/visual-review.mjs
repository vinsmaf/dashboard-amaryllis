#!/usr/bin/env node
// Revue visuelle automatisée — parcourt les pages clés, capture screenshots +
// erreurs console + heuristiques de mise en page, et (optionnel) remonte les
// problèmes dans l'inbox bugs (/api/client-errors) pour le triage hebdo.
//
// Usage :
//   node scripts/visual-review.mjs                  # crawl prod, screenshots locaux
//   BASE_URL=http://localhost:5173 node scripts/visual-review.mjs
//   node scripts/visual-review.mjs --report --secret=POSTSTAY_SECRET   # remonte dans l'inbox
//
// Détecte notamment : débordement horizontal (bug responsive) et éléments
// `position:sticky/fixed` plus hauts que la fenêtre (bug "bas coupé" — vécu sur
// le calendrier de réservation).

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = (process.env.BASE_URL || "https://villamaryllis.com").replace(/\/$/, "");
const REPORT = process.argv.includes("--report");
const SECRET = (process.argv.find(a => a.startsWith("--secret=")) || "").split("=")[1] || process.env.POSTSTAY_SECRET || "";

const PAGES = [
  "/", "/amaryllis", "/zandoli", "/iguana", "/geko", "/mabouya", "/schoelcher", "/nogent",
  "/le-diamant", "/guide-le-diamant", "/conditions-generales",
];
const VIEWPORTS = [
  { name: "desktop", width: 1366, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];

// Bruit tiers/navigateur — pas des bugs de l'app, jamais remonté.
const NOISE = [
  /Content Security Policy|Refused to (connect|load|execute)/i,
  /cloudflareinsights|google-analytics|googletagmanager|sentry\.io|doubleclick|facebook|connect\.facebook/i,
  /ERR_BLOCKED_BY_ORB|net::ERR_ABORTED|upload\.wikimedia/i,
  /Failed to load resource.*\b40[34]\b/i, // favicon/analytics 403/404 tiers
  /ResizeObserver loop/i,
];
const isNoise = (s) => NOISE.some(re => re.test(s));

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const outDir = `bug-reports/visual-${stamp}`;
mkdirSync(outDir, { recursive: true });

// Heuristiques exécutées dans la page → renvoie les problèmes de layout détectés.
function layoutProbe() {
  const issues = [];
  const vw = window.innerWidth, vh = window.innerHeight;
  // 1) Débordement horizontal (scroll latéral indésirable)
  const sw = document.documentElement.scrollWidth;
  if (sw > vw + 2) issues.push(`Débordement horizontal : contenu ${sw}px > fenêtre ${vw}px (scroll latéral)`);
  // 2) Éléments sticky/fixed plus hauts que la fenêtre → bas inatteignable
  for (const el of document.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if ((cs.position === "sticky" || cs.position === "fixed") && el.getBoundingClientRect) {
      const h = el.getBoundingClientRect().height;
      if (h > vh + 8 && el.offsetParent !== null) {
        const id = el.id ? "#" + el.id : (el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : el.tagName.toLowerCase());
        issues.push(`Élément ${cs.position} « ${id} » haut de ${Math.round(h)}px > fenêtre ${vh}px (bas potentiellement coupé)`);
        break; // un seul suffit à signaler
      }
    }
  }
  return issues;
}

async function postIssue(kind, message, path) {
  if (!REPORT) return;
  try {
    await fetch(`${BASE}/api/client-errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, message: `[revue visuelle] ${message}`, path, url: BASE + path, ua: "visual-review-bot", viewport: "auto" }),
    });
  } catch { /* noop */ }
}

const summary = [];
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  for (const path of PAGES) {
    const page = await ctx.newPage();
    const consoleErrors = [];
    const add = (s) => { if (s && !isNoise(s)) consoleErrors.push(s.slice(0, 300)); };
    page.on("console", m => { if (m.type() === "error") add(m.text()); });
    page.on("pageerror", e => add("pageerror: " + (e.message || "")));
    page.on("requestfailed", r => {
      const f = r.failure();
      if (f) add(`requête échouée : ${r.url().slice(0, 120)} (${f.errorText})`);
    });

    let layoutIssues = [];
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(800);
      layoutIssues = await page.evaluate(layoutProbe);
      const file = `${outDir}/${vp.name}${path.replace(/\//g, "_") || "_home"}.png`;
      await page.screenshot({ path: file, fullPage: true });
    } catch (e) {
      consoleErrors.push("navigation: " + (e.message || "").slice(0, 200));
    }

    const problems = [...consoleErrors, ...layoutIssues];
    if (problems.length) {
      summary.push({ vp: vp.name, path, problems });
      // On ne remonte les heuristiques layout qu'en desktop (mobile = bcp de faux positifs sticky).
      // kind=console → dédoublonné par empreinte (un problème récurrent incrémente le compteur
      // au lieu de créer une ligne chaque semaine).
      for (const li of layoutIssues) if (vp.name === "desktop") await postIssue("console", li, path);
      for (const ce of consoleErrors) await postIssue("console", ce, path);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();

// Rapport
const reportPath = `${outDir}/rapport.json`;
writeFileSync(reportPath, JSON.stringify({ base: BASE, stamp, summary }, null, 2));

console.log(`\n🔍 Revue visuelle — ${BASE}`);
console.log(`📸 Screenshots : ${outDir}/`);
if (!summary.length) {
  console.log("✅ Aucun problème détecté (console + layout).");
} else {
  console.log(`⚠️  ${summary.length} page(s)/viewport(s) avec problèmes :\n`);
  for (const s of summary) {
    console.log(`  • [${s.vp}] ${s.path}`);
    for (const p of s.problems) console.log(`      - ${p}`);
  }
  if (REPORT) console.log(`\n📨 Problèmes remontés dans l'inbox bugs (→ triage hebdo).`);
  else console.log(`\n💡 Relance avec --report --secret=… pour les pousser dans l'inbox bugs.`);
}
console.log(`📄 Rapport : ${reportPath}\n`);
