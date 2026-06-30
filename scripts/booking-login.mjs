/**
 * booking-login.mjs
 * Connexion manuelle à l'extranet Booking.com (headful).
 * À lancer UNE seule fois pour sauvegarder la session.
 * Gère la 2FA (OTP email) côté humain.
 *
 * Usage : node scripts/booking-login.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import readline from 'readline';

const __dir = dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = join(__dir, '../.booking-session.json');
const DEV_VARS = join(__dir, '../.dev.vars');

// Charge les vars locales si présentes
function loadDevVars() {
  if (!existsSync(DEV_VARS)) return;
  for (const line of readFileSync(DEV_VARS, 'utf8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim().replace(/^["'](.*)["']$/, '$1');
      if (k && !process.env[k]) process.env[k] = v;
    }
  }
}
loadDevVars();

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function main() {
  console.log('\n🔑 Booking.com — Connexion manuelle\n');
  console.log('Le navigateur va s\'ouvrir. Connectez-vous normalement (email + mot de passe + 2FA si demandé).');
  console.log('Une fois sur le tableau de bord de l\'extranet, revenez ici et appuyez sur Entrée.\n');

  const email = process.env.BOOKING_EMAIL || await prompt('Email Booking.com : ');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'fr-FR',
  });

  const page = await context.newPage();

  // Pré-remplir l'email si fourni
  await page.goto('https://account.booking.com/sign-in', { waitUntil: 'domcontentloaded' });

  if (email) {
    try {
      await page.fill('input[name="loginname"], input[type="email"]', email, { timeout: 5000 });
      console.log(`Email pré-rempli : ${email}`);
    } catch (_) {
      console.log('(Remplissez l\'email manuellement dans le navigateur)');
    }
  }

  // Attente que l'utilisateur finisse la connexion
  await prompt('\n✅ Une fois connecté sur l\'extranet Booking.com, appuyez sur Entrée : ');

  const currentUrl = page.url();
  console.log('URL actuelle :', currentUrl);

  if (currentUrl.includes('sign-in') || currentUrl.includes('login')) {
    console.error('❌ Il semble que vous ne soyez pas encore connecté. Relancez le script.');
    await browser.close();
    process.exit(1);
  }

  // Sauvegarde la session
  const cookies = await context.cookies();
  const storageState = await context.storageState();

  const session = {
    savedAt: new Date().toISOString(),
    url: currentUrl,
    cookies,
    storageState,
  };

  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
  console.log(`\n✅ Session sauvegardée dans : ${SESSION_FILE}`);
  console.log('Vous pouvez maintenant lancer : node scripts/booking-scraper.mjs\n');

  await browser.close();
}

main().catch(err => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
