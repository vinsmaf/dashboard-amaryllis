// Cloudflare Pages Function — /api/rm-competitors
// Competitor management, snapshots, and market signal recalculation

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function median(sorted) {
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function mean(arr) {
  if (!arr.length) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleList(db, url) {
  const property_id = url.searchParams.get("property_id");
  if (!property_id) return json({ error: "property_id required" }, 400);

  const [setsRes, listingsRes] = await Promise.all([
    db.prepare(`SELECT * FROM rm_competitor_sets WHERE property_id = ? ORDER BY is_default DESC, name`).bind(property_id).all(),
    db
      .prepare(
        `SELECT cl.*, cs.name as set_name
         FROM rm_competitor_listings cl
         JOIN rm_competitor_sets cs ON cs.id = cl.set_id
         WHERE cl.property_id = ?
         ORDER BY cl.is_active DESC, cl.similarity_score DESC`
      )
      .bind(property_id)
      .all(),
  ]);

  const sets = setsRes.results || [];
  const listings = listingsRes.results || [];

  // Attach listings to sets
  const setsWithListings = sets.map((s) => ({
    ...s,
    listings: listings.filter((l) => l.set_id === s.id),
  }));

  // Also return flat competitors array (UI-friendly) with listing_id alias
  const competitors = listings.map(l => ({
    ...l,
    listing_id: l.platform_listing_id, // alias for UI
    area_km: l.distance_km,
    standing: l.standing_estimated,
  }));

  return json({ competitor_sets: setsWithListings, competitors, total_listings: listings.length });
}

async function handleSnapshot(db, body) {
  const { property_id, snapshots } = body;
  if (!property_id || !Array.isArray(snapshots) || !snapshots.length) {
    return json({ error: "property_id and snapshots[] required" }, 400);
  }

  const now = Date.now();
  const insertSQL = `
    INSERT INTO rm_competitor_snapshots
      (id, listing_id, snapshot_date, observed_at, price_cents, is_available,
       min_stay_observed, source, apify_run_id, confidence, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT DO NOTHING
  `;

  const stmts = snapshots.map((s) =>
    db.prepare(insertSQL).bind(
      crypto.randomUUID(),
      s.listing_id,
      s.date,
      now,
      s.price_cents !== undefined ? s.price_cents : null,
      s.is_available !== undefined ? (s.is_available ? 1 : 0) : null,
      s.min_stay_observed || null,
      s.source || "manual",
      s.apify_run_id || null,
      s.confidence || "medium",
      now
    )
  );

  const CHUNK = 80;
  let inserted = 0;
  for (let i = 0; i < stmts.length; i += CHUNK) {
    await db.batch(stmts.slice(i, i + CHUNK));
    inserted += Math.min(CHUNK, stmts.length - i);
  }

  return json({ ok: true, inserted, property_id });
}

async function handleRecalculateSignals(db, body) {
  const { property_id, horizon_days = 180 } = body;
  if (!property_id) return json({ error: "property_id required" }, 400);

  const today = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + horizon_days * 86400000).toISOString().slice(0, 10);
  const now = Date.now();

  // Get all active listings in the default set for this property
  const { results: listings } = await db
    .prepare(
      `SELECT cl.id, cl.similarity_score
       FROM rm_competitor_listings cl
       JOIN rm_competitor_sets cs ON cs.id = cl.set_id
       WHERE cl.property_id = ? AND cl.is_active = 1 AND cs.is_default = 1`
    )
    .bind(property_id)
    .all();

  if (!listings || listings.length === 0) {
    return json({ ok: true, property_id, message: "No active competitor listings found", signals_created: 0 });
  }

  const listingIds = listings.map((l) => l.id);
  const listingMap = {};
  for (const l of listings) listingMap[l.id] = l;

  // Get all snapshots in range for these listings
  const placeholders = listingIds.map(() => "?").join(",");
  const { results: snapshots } = await db
    .prepare(
      `SELECT listing_id, snapshot_date, price_cents, is_available, confidence
       FROM rm_competitor_snapshots
       WHERE listing_id IN (${placeholders}) AND snapshot_date >= ? AND snapshot_date <= ?
       ORDER BY snapshot_date ASC`
    )
    .bind(...listingIds, today, endDate)
    .all();

  // Group snapshots by date
  const byDate = {};
  for (const s of snapshots) {
    if (!byDate[s.snapshot_date]) byDate[s.snapshot_date] = [];
    byDate[s.snapshot_date].push(s);
  }

  // Generate all dates
  const dates = [];
  const cur = new Date(today + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const upsertSQL = `
    INSERT INTO rm_market_signals
      (id, property_id, signal_date, calculated_at,
       competitors_total, competitors_with_data, competitors_available, competitors_unavailable,
       availability_rate, price_median_cents, price_mean_cents, price_p25_cents, price_p75_cents,
       price_min_cents, price_max_cents, high_sim_price_median,
       market_pressure_score, scarcity_score, premium_opportunity, vacancy_risk,
       data_confidence, market_label, alert_flags, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(property_id, signal_date) DO UPDATE SET
      calculated_at = excluded.calculated_at,
      competitors_total = excluded.competitors_total,
      competitors_with_data = excluded.competitors_with_data,
      competitors_available = excluded.competitors_available,
      competitors_unavailable = excluded.competitors_unavailable,
      availability_rate = excluded.availability_rate,
      price_median_cents = excluded.price_median_cents,
      price_mean_cents = excluded.price_mean_cents,
      price_p25_cents = excluded.price_p25_cents,
      price_p75_cents = excluded.price_p75_cents,
      price_min_cents = excluded.price_min_cents,
      price_max_cents = excluded.price_max_cents,
      high_sim_price_median = excluded.high_sim_price_median,
      market_pressure_score = excluded.market_pressure_score,
      scarcity_score = excluded.scarcity_score,
      premium_opportunity = excluded.premium_opportunity,
      vacancy_risk = excluded.vacancy_risk,
      data_confidence = excluded.data_confidence,
      market_label = excluded.market_label,
      alert_flags = excluded.alert_flags
  `;

  const signalStmts = [];

  for (const dateStr of dates) {
    const daySnaps = byDate[dateStr] || [];
    const total = listingIds.length;
    const withData = daySnaps.length;
    const available = daySnaps.filter((s) => s.is_available === 1).length;
    const unavailable = daySnaps.filter((s) => s.is_available === 0).length;

    const availRate = withData > 0 ? +(available / withData).toFixed(3) : null;

    const prices = daySnaps
      .filter((s) => s.price_cents !== null && s.price_cents > 0)
      .map((s) => s.price_cents)
      .sort((a, b) => a - b);

    const priceMedian = median(prices);
    const priceMean = mean(prices);
    const priceP25 = percentile(prices, 25);
    const priceP75 = percentile(prices, 75);
    const priceMin = prices.length ? prices[0] : null;
    const priceMax = prices.length ? prices[prices.length - 1] : null;

    // High-similarity price median (similarity_score >= 70)
    const highSimSnaps = daySnaps.filter((s) => {
      const listing = listingMap[s.listing_id];
      return listing && (listing.similarity_score || 0) >= 70 && s.price_cents > 0;
    }).map((s) => s.price_cents).sort((a, b) => a - b);
    const highSimMedian = median(highSimSnaps);

    // Market scores
    const pressure = availRate !== null ? Math.round((1 - availRate) * 100) : null;

    let scarcity = 20;
    if (availRate !== null) {
      if (availRate < 0.3) scarcity = 90;
      else if (availRate < 0.5) scarcity = 70;
      else if (availRate < 0.7) scarcity = 50;
    }

    const premiumOpp = Math.max(0, scarcity - 10);

    let vacancyRisk = 15;
    if (availRate !== null) {
      if (availRate > 0.7) vacancyRisk = 70;
      else if (availRate > 0.5) vacancyRisk = 40;
    }

    let marketLabel = "balanced";
    if (pressure !== null) {
      if (pressure > 70) marketLabel = "strong";
      else if (pressure < 40) marketLabel = "weak";
    }

    const dataConfidence = total > 0 ? Math.min(100, Math.round((withData / total) * 100)) : 0;

    const alertFlags = [];
    if (pressure !== null && pressure > 80) alertFlags.push("high_demand");
    if (vacancyRisk > 60) alertFlags.push("low_demand");

    signalStmts.push(
      db.prepare(upsertSQL).bind(
        crypto.randomUUID(), property_id, dateStr, now,
        total, withData, available, unavailable,
        availRate, priceMedian, priceMean, priceP25, priceP75,
        priceMin, priceMax, highSimMedian,
        pressure, scarcity, premiumOpp, vacancyRisk,
        dataConfidence, marketLabel, JSON.stringify(alertFlags), now
      )
    );
  }

  const CHUNK = 50;
  let created = 0;
  for (let i = 0; i < signalStmts.length; i += CHUNK) {
    await db.batch(signalStmts.slice(i, i + CHUNK));
    created += Math.min(CHUNK, signalStmts.length - i);
  }

  return json({ ok: true, property_id, signals_created: created, dates_range: `${today} → ${endDate}` });
}

async function handleGetSignals(db, url) {
  const property_id = url.searchParams.get("property_id");
  const from = url.searchParams.get("from") || new Date().toISOString().slice(0, 10);
  const to = url.searchParams.get("to") || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  if (!property_id) return json({ error: "property_id required" }, 400);

  const { results } = await db
    .prepare(
      `SELECT * FROM rm_market_signals
       WHERE property_id = ? AND signal_date >= ? AND signal_date <= ?
       ORDER BY signal_date ASC`
    )
    .bind(property_id, from, to)
    .all();

  return json({ signals: results || [], count: (results || []).length });
}

// ---------------------------------------------------------------------------
// CSV import — charge competitors depuis /competitors/{property_id}.csv
// Format attendu (lignes commençant par # ignorées) :
// listing_id,name,platform,capacity,bedrooms,bathrooms,has_pool,has_sea_view,area_km,standing,notes,similarity_score,priority
// ---------------------------------------------------------------------------

function parseCSV(text) {
  const rows = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    // Skip header line
    if (line.startsWith("listing_id")) continue;
    // Split on comma, respecting quoted fields
    const cols = line.split(",").map(c => c.trim());
    if (cols.length < 6) continue;
    const listing_id  = cols[0] || "";
    const name        = cols[1] || "";
    const platform    = cols[2] || "airbnb";
    const capacity    = cols[3] || "0";
    const bedrooms    = cols[4] || "0";
    const bathrooms   = cols[5] || "0";
    const has_pool    = cols[6] || "0";
    const has_sea_view = cols[7] || "0";
    const area_km     = cols[8] || "0";
    const standing    = cols[9] || "standard";
    const notes       = cols[10] || "";
    // New optional columns: similarity_score (col 11) and priority (col 12)
    const similarity_score = cols[11] ? parseInt(cols[11]) : null;
    const priority         = cols[12] || null;
    if (!listing_id || !name) continue;
    rows.push({
      listing_id: listing_id.trim(),
      name: name.trim(),
      platform: platform.trim(),
      capacity: parseInt(capacity) || 0,
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseFloat(bathrooms) || 0,
      has_pool: parseInt(has_pool) || 0,
      has_sea_view: parseInt(has_sea_view) || 0,
      area_km: parseFloat(area_km) || 0,
      standing: standing.trim(),
      notes: notes.trim(),
      similarity_score,
      priority,
    });
  }
  return rows;
}

async function handleImportListings(db, body) {
  const { property_id, csv_content } = body;
  if (!property_id) return json({ error: "property_id required" }, 400);
  if (!csv_content)  return json({ error: "csv_content required" }, 400);

  const rows = parseCSV(csv_content);
  if (!rows.length) return json({ error: "No valid rows found in CSV" }, 400);

  // Find or create the default competitor set for this property
  let setRow = await db
    .prepare(`SELECT id FROM rm_competitor_sets WHERE property_id = ? AND is_default = 1`)
    .bind(property_id)
    .first();

  const now = Date.now();
  if (!setRow) {
    const setId = crypto.randomUUID();
    await db
      .prepare(`INSERT INTO rm_competitor_sets (id, property_id, name, is_default, created_at, updated_at)
                VALUES (?, ?, ?, 1, ?, ?)`)
      .bind(setId, property_id, "Concurrents principaux", now, now)
      .run();
    setRow = { id: setId };
  }
  const set_id = setRow.id;

  // Upsert each listing — match actual schema column names
  let imported = 0;
  let errors = [];
  for (const row of rows) {
    try {
      // Similarity score : use CSV-provided value when available, fallback to standing-based estimate
      const simScore = (row.similarity_score != null && row.similarity_score > 0)
        ? row.similarity_score
        : (row.standing === "premium" ? 75 : row.standing === "standard" ? 55 : 35);
      const listingUrl = `https://www.airbnb.com/rooms/${row.listing_id}`;
      const listingId = crypto.randomUUID();

      // Upsert listing (INSERT OR REPLACE to handle re-imports)
      await db
        .prepare(`INSERT OR REPLACE INTO rm_competitor_listings
                    (id, set_id, property_id, platform, platform_listing_id, url,
                     name, capacity, bedrooms, bathrooms, has_pool, has_sea_view,
                     distance_km, standing_estimated, similarity_score, is_active, notes, created_at, updated_at)
                  VALUES (
                    COALESCE((SELECT id FROM rm_competitor_listings WHERE property_id=? AND platform_listing_id=?), ?),
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`)
        .bind(
          property_id, row.listing_id, listingId,
          set_id, property_id,
          row.platform, row.listing_id, listingUrl,
          row.name, row.capacity, row.bedrooms, row.bathrooms,
          row.has_pool, row.has_sea_view, row.area_km,
          row.standing, simScore, row.notes, now, now
        )
        .run();

      // Retrieve the actual listing id (may be existing)
      const savedListing = await db
        .prepare(`SELECT id FROM rm_competitor_listings WHERE property_id = ? AND platform_listing_id = ?`)
        .bind(property_id, row.listing_id)
        .first();
      const savedListingId = savedListing?.id || listingId;

      // Auto-create scraping config if none exists (needed for Apify scraper)
      const existingCfg = await db
        .prepare(`SELECT id FROM rm_scraping_configs WHERE listing_id = ?`)
        .bind(savedListingId)
        .first();
      if (!existingCfg) {
        await db
          .prepare(`INSERT OR IGNORE INTO rm_scraping_configs
                      (id, listing_id, platform, platform_listing_id, scrape_url,
                       apify_actor_id, scrape_horizon_days,
                       is_active, consecutive_errors, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 365, 1, 0, ?, ?)`)
          .bind(
            crypto.randomUUID(), savedListingId,
            row.platform, row.listing_id, listingUrl,
            "dtrungtin~airbnb-scraper", now, now
          )
          .run();
      }

      imported++;
    } catch (e) {
      errors.push(`${row.listing_id}: ${e.message}`);
    }
  }

  return json({ ok: true, property_id, imported, total: rows.length, errors });
}

async function handleExportListings(db, url) {
  const property_id = url.searchParams.get("property_id");
  if (!property_id) return json({ error: "property_id required" }, 400);

  const { results } = await db
    .prepare(`SELECT * FROM rm_competitor_listings WHERE property_id = ? AND is_active = 1 ORDER BY similarity_score DESC`)
    .bind(property_id)
    .all();

  const lines = [
    `# Concurrents Airbnb — ${property_id}`,
    `# listing_id,name,platform,capacity,bedrooms,bathrooms,has_pool,has_sea_view,area_km,standing,notes,similarity_score,priority`,
    `listing_id,name,platform,capacity,bedrooms,bathrooms,has_pool,has_sea_view,area_km,standing,notes,similarity_score,priority`,
  ];
  const getPriority = (score) => {
    if (score >= 95) return "direct_premium";
    if (score >= 85) return "direct";
    if (score >= 70) return "secondary";
    if (score >= 50) return "tertiary";
    return "ignore";
  };
  for (const r of results || []) {
    lines.push([
      r.platform_listing_id, r.name, r.platform, r.capacity, r.bedrooms, r.bathrooms,
      r.has_pool, r.has_sea_view, r.distance_km, r.standing_estimated, r.notes || "",
      r.similarity_score || 0, getPriority(r.similarity_score || 0),
    ].join(","));
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${property_id}-competitors.csv"`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (request.method === "GET") {
      if (path.endsWith("/signals"))  return handleGetSignals(db, url);
      if (path.endsWith("/export"))   return handleExportListings(db, url);
      return handleList(db, url);
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (path.endsWith("/snapshot"))             return handleSnapshot(db, body);
      if (path.endsWith("/recalculate-signals"))  return handleRecalculateSignals(db, body);
      if (path.endsWith("/import-listings"))      return handleImportListings(db, body);
      return json({ error: "Unknown POST action. Use /snapshot, /recalculate-signals or /import-listings" }, 400);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err.message, stack: err.stack }, 500);
  }
}
