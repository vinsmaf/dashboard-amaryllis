// booking-login.mjs
// Connexion manuelle à l'extranet Booking.com via profil Chrome persistant.
// À lancer UNE seule fois (ou quand la session expire).
// Le profil est réutilisé tel quel par booking-scraper.mjs (headless).
//
// Usage : node scripts/booking-login.mjs

import { chromium } from 'playwright';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { homedir } from 'os';
import readline from 'readline';

const __dir  = dirname(fileURLToPath(import.meta.url));
const DEV_VARS = join(__dir, '../.dev.vars');

// Profil Chrome persistant (partagé avec booking-scraper.mjs)
export const PROFILE_DIR = join(homedir(), '.booking-scraper-profile');

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
  console.log('\n🔑 Booking.com Extranet — Connexion (profil persistant)\n');
  console.log('Profil Chrome :', PROFILE_DIR);
  console.log('Le navigateur va s\'ouvrir → connectez-vous sur l\'extranet Booking.com.');
  console.log('Attendez d\'être bien sur le tableau de bord, puis revenez ici.\n');

  mkdirSync(PROFILE_DIR, { recursive: true });

  // Profil persistant = le même répertoire utilisé par le scraper
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
    ignoreDefaultArgs: ['--enable-automation'],
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: null, // plein écran natif
    locale: 'fr-FR',
  });

  const page = context.pages()[0] || await context.newPage();

  // Aller directement sur la page de login extranet partenaire
  await page.goto('https://admin.booking.com', { waitUntil: 'domcontentloaded' });

  await prompt('✅ Une fois sur le tableau de bord de l\'extranet, appuyez sur Entrée : ');

  const currentUrl = page.url();
  console.log('URL finale :', currentUrl);

  if (!currentUrl.includes('admin.booking.com') && !currentUrl.includes('extranet')) {
    console.error('❌ Vous ne semblez pas être sur l\'extranet. Relancez et complétez la connexion.');
    await context.close();
    process.exit(1);
  }

  // Ferme proprement (le profil est déjà sauvé sur disque)
  await context.close();

  console.log('\n✅ Profil sauvegardé dans :', PROFILE_DIR);
  console.log('Lancez maintenant : node scripts/booking-scraper.mjs --dry\n');
}

main().catch(err => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
