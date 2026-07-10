// GET  /api/parity-check                → état du dernier contrôle (admin ou ?secret=)
// POST /api/parity-check  { dry?: true } → lance le contrôle (admin ou ?secret=POSTSTAY_SECRET)
//
// Contrôle de parité tarifaire quotidien : compare le prix RÉELLEMENT affiché sur le site direct
// (source /api/site-config?type=prices — celle éditée depuis l'onglet Tarifs, PAS le prix de base
// biens.js ni la reco RM) au prix affiché sur la fiche Booking.com publique de chaque bien
// (scrapé via Firecrawl, même mécanisme que fc-competitors-scan.js). Alerte ntfy si direct > OTA +5%.
//
// Nogent exclu : son prix direct vient déjà de Beds24 (source unique avec Booking), parité
// garantie par construction — pas de comparaison possible/utile.
// Airbnb exclu : pas d'accès fiable aux prix de nos propres annonces (voir functions/api/airbnb-test.js,
// jamais activé — secrets absents, nécessiterait de stocker le mot de passe Airbnb réel en secret).

import { verifyBearer } from "./_adminauth.js";

const FIRECRAWL_SCRAPE = "https://api.firecrawl.dev/v1/scrape";
const REF_OFFSET_DAYS = 14; // date de comparaison : J+14 (assez proche pour être défini, assez loin pour éviter le bruit dernière-minute)
const ALERT_THRESHOLD_PCT = 5;

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DDL = `
CREATE TABLE IF NOT EXISTS own_ota_listings (
  bien_id     TEXT NOT NULL,
  platform    TEXT NOT NULL DEFAULT 'booking',
  url         TEXT NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (bien_id, platform)
);
CREATE TABLE IF NOT EXISTS parity_checks (
  id                 TEXT PRIMARY KEY,
  bien_id            TEXT NOT NULL,
  platform           TEXT NOT NULL,
  compare_date       TEXT NOT NULL,
  direct_price_cents INTEGER,
  ota_price_cents    INTEGER,
  ecart_pct          REAL,
  alerted            INTEGER NOT NULL DEFAULT 0,
  checked_at         INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_parity_bien ON parity_checks(bien_id, checked_at);
`;

// Seed initial — URLs Booking.com publiques fournies par Vincent 2026-07-10.
const SEED_LISTINGS = [
  { bien_id: "amaryllis",  url: "https://www.booking.com/hotel/mq/villa-amaryllis-luxurious-pool-sea-view-beach.fr.html" },
  { bien_id: "schoelcher", url: "https://www.booking.com/hotel/mq/appartement-de-standing-vue-mer-schoelcher.fr.html" },
  { bien_id: "zandoli",    url: "https://www.booking.com/hotel/mq/t2-paisible-jacuzzi-jardin.fr.html" },
  { bien_id: "mabouya",    url: "https://www.booking.com/hotel/mq/studio-vue-mer-jacuzzi-jardin.fr.html" },
  { bien_id: "geko",       url: "https://www.booking.com/hotel/mq/geko-piscine-jardin-paisible.fr.html" },
];

async function ensureSeeded(db) {
  for (const s of DDL.split(";").filter((s) => s.trim())) await db.prepare(s).run();
  const { results } = await db.prepare("SELECT COUNT(*) n FROM own_ota_listings").all();
  if (results?.[0]?.n > 0) return;
  for (const l of SEED_LISTINGS) {
    await db.prepare(
      "INSERT INTO own_ota_listings (bien_id, platform, url) VALUES (?, 'booking', ?) ON CONFLICT DO NOTHING"
    ).bind(l.bien_id, l.url).run();
  }
}

const PRICE_SCHEMA = {
  type: "object",
  properties: {
    price_per_night: { type: "number", description: "Prix affiché par nuit en euros (hors frais de service)" },
    title:           { type: "string", description: "Titre du logement" },
  },
};

async function scrapePrice(apiKey, url) {
  const res = await fetch(FIRECRAWL_SCRAPE, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      url,
      formats: ["json"],
      jsonOptions: {
        prompt: "Page de logement Booking.com. Extrais le prix par nuit en euros affiché par défaut (le prix de base, sans frais de service) et le titre. Si le prix n'est pas visible, retourne null.",
        schema: PRICE_SCHEMA,
      },
      proxy: "stealth",
      waitFor: 6000,
    }),
  });
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  const data = await res.json();
  return data?.data?.json || null;
}

function refDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + REF_OFFSET_DAYS);
  return d.toISOString().slice(0, 10);
}

async function authOk(request, env) {
  const secretOk = !!env.POSTSTAY_SECRET && new URL(request.url).searchParams.get("secret") === env.POSTSTAY_SECRET;
  if (secretOk) return true;
  const { ok } = await verifyBearer(request, env);
  return ok;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);
  if (!(await authOk(request, env))) return json({ error: "Non autorisé" }, 401);

  await ensureSeeded(db);

  const { results: listings } = await db.prepare(
    "SELECT bien_id, platform, url, is_active FROM own_ota_listings ORDER BY bien_id"
  ).all();
  const { results: lastChecks } = await db.prepare(
    `SELECT bien_id, platform, compare_date, direct_price_cents, ota_price_cents, ecart_pct, alerted, checked_at
     FROM parity_checks WHERE checked_at = (SELECT MAX(checked_at) FROM parity_checks c2 WHERE c2.bien_id = parity_checks.bien_id)
     ORDER BY checked_at DESC`
  ).all();

  return json({ ok: true, listings, last_checks: lastChecks });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);
  if (!(await authOk(request, env))) return json({ error: "Non autorisé" }, 401);

  const apiKey = env.FIRECRAWL_API_KEY;
  if (!apiKey) return json({ error: "FIRECRAWL_API_KEY absent" }, 503);

  let body = {};
  try { body = await request.json(); } catch {}
  const dry = !!body.dry;

  await ensureSeeded(db);

  const { results: listings } = await db.prepare(
    "SELECT bien_id, platform, url FROM own_ota_listings WHERE is_active = 1"
  ).all();
  if (!listings?.length) return json({ ok: true, scanned: 0, message: "Aucune fiche active" });

  // Prix direct réel (onglet Tarifs) — même mécanisme que le site public (site-config type=prices).
  const siteConfigRes = await fetch(new URL("/api/site-config?type=prices", request.url));
  const siteConfig = siteConfigRes.ok ? await siteConfigRes.json() : { config: {} };
  const directPrices = siteConfig.config || {};
  const compareDate = refDate();

  if (dry) {
    return json({
      ok: true, dry: true, compare_date: compareDate,
      would_check: listings.map((l) => ({
        bien_id: l.bien_id, url: l.url,
        direct_price: directPrices[l.bien_id]?.[compareDate] ?? null,
      })),
    });
  }

  const now = Date.now();
  const results = [];
  const alerts = [];

  for (const listing of listings) {
    try {
      const extracted = await scrapePrice(apiKey, listing.url);
      const otaPrice = extracted?.price_per_night;
      const otaCents = otaPrice && otaPrice > 5 ? Math.round(otaPrice * 100) : null;
      const directPrice = directPrices[listing.bien_id]?.[compareDate];
      const directCents = directPrice ? Math.round(directPrice * 100) : null;

      let ecartPct = null;
      let alerted = 0;
      if (otaCents && directCents) {
        ecartPct = ((directCents - otaCents) / otaCents) * 100;
        if (ecartPct > ALERT_THRESHOLD_PCT) {
          alerted = 1;
          alerts.push({ bien_id: listing.bien_id, direct: directCents / 100, ota: otaCents / 100, ecart_pct: Math.round(ecartPct * 10) / 10 });
        }
      }

      await db.prepare(`
        INSERT INTO parity_checks (id, bien_id, platform, compare_date, direct_price_cents, ota_price_cents, ecart_pct, alerted, checked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), listing.bien_id, listing.platform, compareDate, directCents, otaCents, ecartPct, alerted, now).run();

      results.push({ bien_id: listing.bien_id, direct_price: directCents ? directCents / 100 : null, ota_price: otaCents ? otaCents / 100 : null, ecart_pct: ecartPct !== null ? Math.round(ecartPct * 10) / 10 : null, status: "ok" });
    } catch (err) {
      results.push({ bien_id: listing.bien_id, status: "error", error: err.message });
    }
  }

  // Alerte ntfy — 1 seule notification groupée (évite le rate-limit ntfy.sh vécu 2026-07-09).
  if (alerts.length > 0 && env.NTFY_TOPIC) {
    const lines = alerts.map((a) => `• ${a.bien_id} : direct ${a.direct}€ vs Booking ${a.ota}€ (+${a.ecart_pct}%)`);
    lines.push(`Date comparée : ${compareDate}`);
    try {
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: {
          Title: `🔴 Parité tarifaire — ${alerts.length} bien${alerts.length > 1 ? "s" : ""} au-dessus de Booking`,
          Priority: "4",
          Tags: "warning,moneybag",
          "Content-Type": "text/plain; charset=utf-8",
        },
        body: lines.join("\n"),
      });
    } catch { /* fail-silent, log D1 déjà fait */ }
  }

  return json({ ok: true, compare_date: compareDate, scanned: results.filter((r) => r.status === "ok").length, errors: results.filter((r) => r.status === "error").length, alerts: alerts.length, results });
}
