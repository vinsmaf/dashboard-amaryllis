// Cloudflare Pages Function — /api/rm-scrape
// Triggers Apify scraping for competitor listings
// Requires env var: APIFY_TOKEN

import { verifyBearer } from "../_adminauth.js";
import { rateLimit } from "../_ratelimit.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const APIFY_BASE = "https://api.apify.com/v2";
const DEFAULT_ACTOR = "dtrungtin~airbnb-scraper";

/**
 * Trigger a single Apify actor run for a list of URLs.
 */
async function triggerApifyRun(apifyToken, actor, startUrls, maxItems = 365) {
  const actorSlug = actor.replace("/", "~");
  const url = `${APIFY_BASE}/acts/${actorSlug}/runs?token=${apifyToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startUrls: startUrls.map((u) => (typeof u === "string" ? { url: u } : u)),
      maxItems,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify API error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Auto-create rm_scraping_configs for any active listing that doesn't have one yet.
 * Called automatically before each scrape run.
 */
async function ensureScrapingConfigs(db, property_id) {
  const now = Date.now();
  const { results: listings } = await db
    .prepare(`
      SELECT cl.id, cl.platform, cl.platform_listing_id, cl.url
      FROM rm_competitor_listings cl
      LEFT JOIN rm_scraping_configs sc ON sc.listing_id = cl.id
      WHERE cl.property_id = ? AND cl.is_active = 1 AND sc.id IS NULL
    `)
    .bind(property_id)
    .all();

  let created = 0;
  for (const l of listings || []) {
    try {
      await db
        .prepare(`INSERT OR IGNORE INTO rm_scraping_configs
                    (id, listing_id, platform, platform_listing_id, scrape_url,
                     apify_actor_id, scrape_horizon_days,
                     is_active, consecutive_errors, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, 365, 1, 0, ?, ?)`)
        .bind(
          crypto.randomUUID(), l.id,
          l.platform || "airbnb", l.platform_listing_id,
          l.url || `https://www.airbnb.com/rooms/${l.platform_listing_id}`,
          "dtrungtin~airbnb-scraper", now, now
        )
        .run();
      created++;
    } catch (_) { /* ignore individual errors */ }
  }
  return created;
}

async function handlePost(db, env, body) {
  const { property_id, listing_ids } = body;

  if (!property_id) return json({ error: "property_id required" }, 400);

  const apifyToken = env.APIFY_TOKEN;
  if (!apifyToken) return json({ error: "APIFY_TOKEN env var not configured" }, 503);

  // Verify property exists
  const prop = await db.prepare(`SELECT id FROM rm_properties WHERE id = ?`).bind(property_id).first();
  if (!prop) return json({ error: "Property not found" }, 404);

  // Auto-create missing scraping configs for existing listings
  const configsCreated = await ensureScrapingConfigs(db, property_id);

  // Get active scraping configs for this property's listings
  let q, binds;
  if (listing_ids && listing_ids.length > 0) {
    const placeholders = listing_ids.map(() => "?").join(",");
    q = `
      SELECT sc.*, cl.url, cl.platform, cl.property_id, cl.name as listing_name
      FROM rm_scraping_configs sc
      JOIN rm_competitor_listings cl ON cl.id = sc.listing_id
      WHERE sc.is_active = 1 AND cl.property_id = ? AND sc.listing_id IN (${placeholders})
    `;
    binds = [property_id, ...listing_ids];
  } else {
    q = `
      SELECT sc.*, cl.url, cl.platform, cl.property_id, cl.name as listing_name
      FROM rm_scraping_configs sc
      JOIN rm_competitor_listings cl ON cl.id = sc.listing_id
      WHERE sc.is_active = 1 AND cl.property_id = ?
    `;
    binds = [property_id];
  }

  const { results: configs } = await db.prepare(q).bind(...binds).all();

  if (!configs || configs.length === 0) {
    return json({ ok: false, message: "No active scraping configs found for this property", property_id });
  }

  const now = Date.now();
  const runs = [];
  const errors = [];

  // Group configs by actor for batch efficiency
  const byActor = {};
  for (const cfg of configs) {
    const actor = cfg.apify_actor_id || DEFAULT_ACTOR;
    if (!byActor[actor]) byActor[actor] = [];
    byActor[actor].push(cfg);
  }

  for (const [actor, cfgs] of Object.entries(byActor)) {
    const validUrls = cfgs.filter((c) => c.scrape_url || c.url);
    const startUrls = validUrls.map((c) => ({ url: c.scrape_url || c.url }));

    if (!startUrls.length) continue;

    try {
      const result = await triggerApifyRun(apifyToken, actor, startUrls, cfgs[0].scrape_horizon_days || 365);
      const runId = result.data?.id || result.id || null;

      runs.push({
        actor,
        run_id: runId,
        listings: validUrls.map((c) => c.listing_id),
        status: result.data?.status || "RUNNING",
      });

      // Update last_scraped_at and clear errors for each config
      const updateStmts = validUrls.map((c) =>
        db
          .prepare(`UPDATE rm_scraping_configs SET last_scraped_at = ?, last_error = NULL, consecutive_errors = 0, updated_at = ? WHERE id = ?`)
          .bind(now, now, c.id)
      );
      if (updateStmts.length) await db.batch(updateStmts);

    } catch (err) {
      errors.push({ actor, error: err.message, listings: cfgs.map((c) => c.listing_id) });

      // Record error in DB
      const errorStmts = cfgs.map((c) =>
        db
          .prepare(`UPDATE rm_scraping_configs SET last_error = ?, consecutive_errors = consecutive_errors + 1, updated_at = ? WHERE id = ?`)
          .bind(err.message, now, c.id)
      );
      if (errorStmts.length) await db.batch(errorStmts);
    }
  }

  return json({
    ok: errors.length === 0,
    property_id,
    runs,
    errors,
    configs_triggered: configs.length,
    configs_created: configsCreated,
  });
}

async function handleGetStatus(db, url) {
  const property_id = url.searchParams.get("property_id");

  let q, binds;
  if (property_id) {
    q = `
      SELECT sc.*, cl.name as listing_name, cl.platform, cl.url
      FROM rm_scraping_configs sc
      JOIN rm_competitor_listings cl ON cl.id = sc.listing_id
      WHERE cl.property_id = ? AND sc.is_active = 1
      ORDER BY sc.last_scraped_at DESC NULLS LAST
    `;
    binds = [property_id];
  } else {
    q = `
      SELECT sc.*, cl.name as listing_name, cl.platform, cl.url, cl.property_id
      FROM rm_scraping_configs sc
      JOIN rm_competitor_listings cl ON cl.id = sc.listing_id
      WHERE sc.is_active = 1
      ORDER BY sc.last_scraped_at DESC NULLS LAST
      LIMIT 100
    `;
    binds = [];
  }

  const { results } = await db.prepare(q).bind(...binds).all();

  const configs = (results || []).map((c) => ({
    ...c,
    last_scraped_ago_hours: c.last_scraped_at
      ? Math.round((Date.now() - c.last_scraped_at) / 3600000)
      : null,
    health: c.consecutive_errors >= 3 ? "error" : c.consecutive_errors >= 1 ? "warning" : "ok",
  }));

  return json({ configs, count: configs.length });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  // sec : déclenche un scrape Apify (coût $) → admin uniquement + rate-limit sur POST.
  const { ok: authOk } = await verifyBearer(request, env);
  if (!authOk) return json({ error: "Non autorisé" }, 401);
  if (request.method === "POST") {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const rl = await rateLimit(env.revenue_manager, { key: `rmscrape:${ip}`, limit: 6, windowSec: 60 });
    if (!rl.ok) return json({ error: "Trop de scrapes, patientez." }, 429);
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (request.method === "GET") {
      // GET /api/rm-scrape/status or GET /api/rm-scrape
      return handleGetStatus(db, url);
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      return handlePost(db, env, body);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err.message, stack: err.stack }, 500);
  }
}
