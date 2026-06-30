// booking-scraper.mjs
// Scrape les réservations Booking.com depuis l'extranet (headless).
// Utilise le profil Chrome persistant créé par booking-login.mjs.
// Pousse les nouvelles résas vers /api/airbnb-email-import (D1 direct_bookings).
//
// Usage : node scripts/booking-scraper.mjs [--days=90] [--dry]
// Cron  : toutes les 6h — ajouter dans crontab -e :
//   0 */6 * * * cd ~/locatif-dashboard && node scripts/booking-scraper.mjs >> /tmp/booking-scraper.log 2>&1

import { chromium } from 'playwright';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { homedir } from 'os';

const __dir = dirname(fileURLToPath(import.meta.url));
const DEV_VARS   = join(__dir, '../.dev.vars');
const STATE_FILE = join(__dir, '../.booking-state.json');

// Même profil que booking-login.mjs
const PROFILE_DIR = join(homedir(), '.booking-scraper-profile');

// ── Env ──────────────────────────────────────────────────────────────────────
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

const WEBHOOK = process.env.BOOKING_WEBHOOK_URL
  || `https://villamaryllis.com/api/airbnb-email-import?secret=${process.env.ZAPIER_WEBHOOK_SECRET}`;

const ARGS    = Object.fromEntries(process.argv.slice(2).map(a => a.replace('--','').split('=')));
const DAYS    = parseInt(ARGS.days || process.env.BOOKING_DAYS || '90', 10);
const DRY_RUN = 'dry' in ARGS;

// ── Mapping bien ─────────────────────────────────────────────────────────────
const BIENS = [
  { id: 'amaryllis',  kw: ['amaryllis'] },
  { id: 'iguana',     kw: ['iguana'] },
  { id: 'geko',       kw: ['géko', 'geko', 'gecko'] },
  { id: 'zandoli',    kw: ['zandoli'] },
  { id: 'mabouya',    kw: ['mabouya'] },
  { id: 'schoelcher', kw: ['schœlcher', 'schoelcher', 'bellevue schœlcher', 'bellevue schoelcher'] },
  { id: 'nogent',     kw: ['nogent', 'portes de paris', 'standing aux portes', 'suresnes'] },
];

function guessBien(name = '') {
  const lower = name.toLowerCase();
  for (const b of BIENS) if (b.kw.some(k => lower.includes(k))) return b.id;
  return 'unknown';
}

// ── Idempotence locale ───────────────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); }
  catch (_) { return { pushed: [] }; }
}
function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function toISO(d) {
  if (!d) return '';
  if (d instanceof Date) return d.toISOString().split('T')[0];
  const m = String(d).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return String(d).split('T')[0];
}

// ── Push vers D1 ─────────────────────────────────────────────────────────────
async function pushToD1(payload) {
  if (DRY_RUN) {
    console.log('[dry]', JSON.stringify(payload));
    return { ok: true, dry: true };
  }
  const resp = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
}

// ── Extraction depuis réponses API interceptées ──────────────────────────────
function extractFromApiResponse(data) {
  const candidates = [
    data?.result,
    data?.reservations,
    data?.bookings,
    data?.data?.reservations,
    data?.data,
  ].filter(Array.isArray);

  if (!candidates.length) return [];

  return candidates[0].map(item => {
    const id = String(item.id || item.reservation_id || item.booking_id || item.bv_id || '');
    if (!id) return null;

    const guestParts = [
      item.booker?.first_name, item.booker?.last_name,
      item.guest?.first_name,  item.guest?.last_name,
      item.guest_name, item.customer_name,
    ].filter(Boolean);

    const guestName     = guestParts.join(' ').trim() || 'Voyageur Booking';
    const propertyName  = item.hotel_name || item.property_name
      || item.room?.property_name || item.accommodation?.name || '';
    const checkin       = toISO(item.checkin  || item.arrival_date  || item.check_in  || item.dates?.checkin);
    const checkout      = toISO(item.checkout || item.departure_date || item.check_out || item.dates?.checkout);
    const totalNet      = parseFloat(
      item.host_amount || item.hotel_amount || item.payout_amount
      || item.price?.hotel_amount || item.price?.total
      || item.commission?.hotel_revenue || 0
    ) || 0;
    const nbGuests = parseInt(item.number_of_guests || item.guests?.total || item.adults || 1, 10);

    return { canal: 'Booking.com', confirmCode: id, guestName,
             bienId: guessBien(propertyName), checkin, checkout, totalNet, nbGuests,
             source: 'booking-scraper' };
  }).filter(Boolean);
}

// ── Extraction DOM (fallback) ─────────────────────────────────────────────────
async function extractFromDOM(page) {
  return page.evaluate(() => {
    const results = [];
    const rows = document.querySelectorAll(
      '[data-reservation-id], [data-booking-id], ' +
      'tr.res-row, .bui-table__body .bui-table__row, ' +
      'div[class*="ReservationRow"], div[class*="reservation-row"]'
    );

    rows.forEach(row => {
      const id = row.dataset.reservationId || row.dataset.bookingId || '';
      const guestEl = row.querySelector(
        '[class*="guest-name"], [class*="GuestName"], [data-testid="guest-name"], .bui-table__cell:first-child'
      );
      const guestName    = guestEl?.innerText?.trim() || '';
      const dateEls      = row.querySelectorAll('[class*="date"], time, [datetime]');
      const dates        = [...dateEls].map(el => el.getAttribute('datetime') || el.innerText.trim()).filter(Boolean);
      const amountEl     = row.querySelector('[class*="amount"], [class*="price"], [class*="total"]');
      const amount       = amountEl?.innerText?.trim() || '';
      const propEl       = row.querySelector('[class*="property-name"], [class*="PropertyName"]');
      const propertyName = propEl?.innerText?.trim() || '';

      if (id || guestName) results.push({ id, guestName, dates, amount, propertyName });
    });

    // Fallback numéros dans le texte
    if (!results.length) {
      const ids = [...new Set((document.body.innerText.match(/\b\d{10,13}\b/g) || []))];
      ids.forEach(id => results.push({ id, guestName: '', dates: [], amount: '', propertyName: '' }));
    }

    return results;
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const ts = new Date().toISOString();
  console.log(`\n[booking-scraper] ${ts} — DAYS=${DAYS}${DRY_RUN ? ' DRY' : ''}`);

  if (!existsSync(PROFILE_DIR)) {
    console.error('[booking-scraper] ❌ Profil non trouvé. Lance d\'abord : node scripts/booking-login.mjs');
    process.exit(1);
  }

  const state         = loadState();
  const alreadyPushed = new Set(state.pushed || []);

  // Utilise le même profil persistant que le login → aucun transfert de cookies
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
    ignoreDefaultArgs: ['--enable-automation'],
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'fr-FR',
  });

  const page = context.pages()[0] || await context.newPage();

  // Intercept les appels API JSON
  const apiData = [];
  page.on('response', async (response) => {
    const url = response.url();
    const ct  = response.headers()['content-type'] || '';
    if (!ct.includes('json')) return;
    if (url.includes('/reservations') || url.includes('/bookings') ||
        url.includes('extranet_ng') || url.includes('fresa/extranet')) {
      try {
        const data = await response.json();
        if (data && typeof data === 'object') apiData.push({ url: url.split('?')[0], data });
      } catch (_) {}
    }
  });

  try {
    const today  = new Date();
    const past   = new Date(today); past.setDate(past.getDate() - 7);
    const future = new Date(today); future.setDate(future.getDate() + DAYS);
    const fmt    = d => d.toISOString().split('T')[0].replace(/-/g, '');

    const listUrl = `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/booking-list.html?lang=fr&source=nav&upcoming=0&date_type=arrival&date_from=${fmt(past)}&date_to=${fmt(future)}`;

    console.log('[booking-scraper] Navigation :', listUrl.split('?')[0]);
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const currentUrl = page.url();
    console.log('[booking-scraper] URL chargée :', currentUrl);

    // Détection session expirée (page login)
    if (currentUrl.includes('sign-in') || currentUrl.includes('/login')
        || currentUrl.includes('account.booking.com')) {
      await page.screenshot({ path: '/tmp/booking-session-expired.png', fullPage: true });
      console.error('[booking-scraper] ❌ Session expirée. Relance : node scripts/booking-login.mjs');
      await context.close();
      process.exit(1);
    }

    await page.waitForTimeout(4000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/booking-last-run.png', fullPage: true });

    // ── Extraction ──────────────────────────────────────────────────────────
    let reservations = [];

    for (const { url, data } of apiData) {
      const extracted = extractFromApiResponse(data);
      if (extracted.length > 0) {
        console.log(`[booking-scraper] API ${url} → ${extracted.length} résa(s)`);
        reservations.push(...extracted);
      }
    }

    if (reservations.length === 0) {
      console.log('[booking-scraper] Pas d\'API interceptée → extraction DOM...');
      const domItems = await extractFromDOM(page);
      console.log(`[booking-scraper] DOM → ${domItems.length} élément(s)`);
      reservations = domItems.map(item => ({
        canal: 'Booking.com',
        confirmCode: item.id,
        guestName: item.guestName || 'Voyageur Booking',
        bienId: guessBien(item.propertyName),
        checkin:  item.dates[0] || '',
        checkout: item.dates[1] || '',
        totalNet: parseFloat((item.amount.match(/[\d,.]+/) || ['0'])[0].replace(',', '.')) || 0,
        nbGuests: 1,
        source: 'booking-scraper-dom',
      }));
    }

    const unique = reservations.filter(r => r.confirmCode && !alreadyPushed.has(r.confirmCode));
    console.log(`[booking-scraper] ${reservations.length} total, ${unique.length} nouvelle(s)`);

    let pushed = 0, errors = 0;
    for (const resa of unique) {
      const result = await pushToD1(resa);
      if (result.ok) {
        pushed++;
        alreadyPushed.add(resa.confirmCode);
        console.log(`[booking-scraper] ✅ ${resa.confirmCode} — ${resa.guestName} (${resa.bienId}) ${resa.checkin}→${resa.checkout}`);
      } else {
        errors++;
        console.error(`[booking-scraper] ❌ ${resa.confirmCode}:`, result.error || result);
      }
    }

    state.pushed  = [...alreadyPushed];
    state.lastRun = ts;
    saveState(state);
    console.log(`[booking-scraper] Terminé — ${pushed} poussée(s), ${errors} erreur(s)\n`);

  } finally {
    await context.close();
  }
}

main().catch(err => {
  console.error('[booking-scraper] Fatal:', err.message);
  process.exit(1);
});
