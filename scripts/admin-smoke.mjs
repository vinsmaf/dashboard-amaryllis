#!/usr/bin/env node
// Smoke test Playwright ciblé /admin — vérifie que React charge et render
// sans pageerror ni console.error critique (import circulaire, chunk 404…).
//
// Usage :
//   node scripts/admin-smoke.mjs                         # cible prod
//   BASE_URL=http://localhost:5173 node scripts/admin-smoke.mjs
//
// Exit 0 = OK  |  Exit 1 = crash détecté
//
// Ne nécessite PAS de connexion : /admin affiche le formulaire de login
// si non authentifié, ce qui suffit pour valider le chargement du bundle React.

import { chromium } from "playwright";

const BASE  = (process.env.BASE_URL || "https://villamaryllis.com").replace(/\/$/, "");
const URL   = `${BASE}/admin`;
const TIMEOUT = 20_000; // ms — large pour CDN distant

// Bruit attendu — jamais traité comme erreur fatale.
// "Failed to load resource" = réponse HTTP 4xx/5xx loggée par le navigateur :
//   - 401 sur /api/check-auth → attendu (pas de token)
//   - 404 favicon / analytics tiers → bruit
// On ne cherche PAS les erreurs réseau ici ; on cherche les crashes JS (pageerror)
// et les erreurs de module (import circulaire, chunk manquant).
const NOISE = [
  /Failed to load resource/i,              // erreurs réseau normales (401 auth, 404 favicon…)
  /Content Security Policy|Refused to (connect|load|execute)/i,
  /cloudflareinsights|google-analytics|googletagmanager|sentry\.io|doubleclick|facebook/i,
  /ERR_BLOCKED_BY_ORB|net::ERR_ABORTED/i,
  /favicon|apple-touch-icon/i,
];
const isNoise = (s) => NOISE.some(re => re.test(s));

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];

  // Capture erreurs JS non rattrapées (import circulaire, chunk manquant…)
  page.on("pageerror", (err) => {
    if (!isNoise(err.message)) errors.push(`pageerror: ${err.message}`);
  });

  // Capture console.error (React error boundary, etc.)
  page.on("console", (msg) => {
    if (msg.type() === "error" && !isNoise(msg.text())) {
      errors.push(`console.error: ${msg.text()}`);
    }
  });

  // Capture réponses réseau en erreur sur les assets du bundle (chunk 404)
  page.on("response", (res) => {
    const url = res.url();
    const status = res.status();
    if (status >= 400 && url.includes("/assets/") && !isNoise(url)) {
      errors.push(`asset ${status}: ${url.split("/assets/")[1]?.slice(0, 60)}`);
    }
  });

  await page.goto(URL, { waitUntil: "load", timeout: TIMEOUT });
  // Attendre que React monte (max 5s supplémentaires)
  await page.waitForSelector("#root", { timeout: 5_000 }).catch(() => {});

  // Vérifier qu'un élément React est présent dans le DOM (preuve de render)
  const hasReactRoot = await page.evaluate(() =>
    !!document.querySelector("#root") || !!document.querySelector("[data-reactroot]")
  );

  if (!hasReactRoot) {
    errors.push("Aucun #root React trouvé — le bundle ne s'est pas monté");
  }

  await browser.close();

  if (errors.length > 0) {
    console.error(`❌ /admin — ${errors.length} erreur(s) détectée(s) :`);
    for (const e of errors) console.error(`   • ${e}`);
    process.exit(1);
  }

  console.log(`✅ /admin — React chargé sans erreur JS (${URL})`);
  process.exit(0);

} catch (err) {
  if (browser) await browser.close().catch(() => {});
  console.error(`❌ admin-smoke échoué : ${err.message}`);
  process.exit(1);
}
