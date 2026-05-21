// Cloudflare Pages Function — POST /api/rm-init
// Initializes the Revenue Manager database (creates tables + seeds data)

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const DDL = `
CREATE TABLE IF NOT EXISTS rm_properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  type TEXT NOT NULL CHECK(type IN ('court','moyen','long')),
  capacity INTEGER NOT NULL DEFAULT 4,
  bedrooms INTEGER,
  bathrooms INTEGER,
  location TEXT,
  latitude REAL,
  longitude REAL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  timezone TEXT NOT NULL DEFAULT 'America/Martinique',
  base_price_low INTEGER NOT NULL DEFAULT 30000,
  base_price_mid INTEGER NOT NULL DEFAULT 40000,
  base_price_high INTEGER NOT NULL DEFAULT 50000,
  price_min INTEGER NOT NULL DEFAULT 20000,
  price_max INTEGER NOT NULL DEFAULT 90000,
  min_stay_default INTEGER NOT NULL DEFAULT 4,
  min_stay_low INTEGER NOT NULL DEFAULT 3,
  min_stay_mid INTEGER NOT NULL DEFAULT 4,
  min_stay_high INTEGER NOT NULL DEFAULT 5,
  min_stay_last_minute INTEGER NOT NULL DEFAULT 2,
  positioning TEXT NOT NULL DEFAULT 'premium' CHECK(positioning IN ('budget','standard','premium','luxury')),
  beds24_property_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rm_seasonal_profiles (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES rm_properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  season_type TEXT NOT NULL CHECK(season_type IN ('low','mid','high','peak')),
  date_start TEXT NOT NULL,
  date_end TEXT NOT NULL,
  year INTEGER NOT NULL,
  priority INTEGER NOT NULL DEFAULT 10,
  base_price_override INTEGER,
  min_stay_override INTEGER,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_seasonal_property ON rm_seasonal_profiles(property_id, year);
CREATE INDEX IF NOT EXISTS idx_seasonal_dates ON rm_seasonal_profiles(date_start, date_end);

CREATE TABLE IF NOT EXISTS rm_pricing_rules (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES rm_properties(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  params TEXT NOT NULL DEFAULT '{}',
  adjustment_type TEXT NOT NULL CHECK(adjustment_type IN ('fixed_cents','percent','replace')),
  adjustment_value REAL NOT NULL DEFAULT 0,
  condition_season TEXT,
  condition_lead_time_min INTEGER,
  condition_lead_time_max INTEGER,
  condition_dow TEXT,
  max_adjustment_cents INTEGER,
  priority INTEGER NOT NULL DEFAULT 50,
  is_active INTEGER NOT NULL DEFAULT 1,
  valid_from TEXT,
  valid_until TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rules_property ON rm_pricing_rules(property_id, is_active);

CREATE TABLE IF NOT EXISTS rm_overrides (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES rm_properties(id),
  date TEXT NOT NULL,
  override_type TEXT NOT NULL CHECK(override_type IN ('price','min_stay','block')),
  value_cents INTEGER,
  value_int INTEGER,
  reason TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_overrides_property_date ON rm_overrides(property_id, date);

CREATE TABLE IF NOT EXISTS rm_competitor_sets (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES rm_properties(id),
  name TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 1,
  min_similarity_score INTEGER DEFAULT 40,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rm_competitor_listings (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL REFERENCES rm_competitor_sets(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('airbnb','booking','vrbo','other')),
  platform_listing_id TEXT,
  url TEXT,
  name TEXT NOT NULL,
  internal_label TEXT,
  area TEXT,
  latitude REAL,
  longitude REAL,
  distance_km REAL,
  capacity INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  property_type TEXT,
  has_pool INTEGER DEFAULT 0,
  has_sea_view INTEGER DEFAULT 0,
  has_ac INTEGER DEFAULT 0,
  has_garden INTEGER DEFAULT 0,
  standing_estimated TEXT,
  review_score REAL,
  review_count INTEGER,
  similarity_score INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_listings_set ON rm_competitor_listings(set_id, is_active);

CREATE TABLE IF NOT EXISTS rm_competitor_snapshots (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES rm_competitor_listings(id) ON DELETE CASCADE,
  snapshot_date TEXT NOT NULL,
  observed_at INTEGER NOT NULL,
  price_cents INTEGER,
  is_available INTEGER,
  min_stay_observed INTEGER,
  source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','csv','apify','api')),
  apify_run_id TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK(confidence IN ('low','medium','high')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snapshots_listing_date ON rm_competitor_snapshots(listing_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON rm_competitor_snapshots(snapshot_date);

CREATE TABLE IF NOT EXISTS rm_market_signals (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  signal_date TEXT NOT NULL,
  calculated_at INTEGER NOT NULL,
  competitors_total INTEGER NOT NULL DEFAULT 0,
  competitors_with_data INTEGER NOT NULL DEFAULT 0,
  competitors_available INTEGER NOT NULL DEFAULT 0,
  competitors_unavailable INTEGER NOT NULL DEFAULT 0,
  availability_rate REAL,
  price_median_cents INTEGER,
  price_mean_cents INTEGER,
  price_p25_cents INTEGER,
  price_p75_cents INTEGER,
  price_min_cents INTEGER,
  price_max_cents INTEGER,
  high_sim_price_median INTEGER,
  market_pressure_score INTEGER,
  scarcity_score INTEGER,
  premium_opportunity INTEGER,
  vacancy_risk INTEGER,
  data_confidence INTEGER,
  market_label TEXT,
  alert_flags TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(property_id, signal_date)
);
CREATE INDEX IF NOT EXISTS idx_signals_property_date ON rm_market_signals(property_id, signal_date);

CREATE TABLE IF NOT EXISTS rm_holidays (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'MQ',
  holiday_type TEXT NOT NULL,
  impact_level TEXT NOT NULL DEFAULT 'medium' CHECK(impact_level IN ('low','medium','high','peak')),
  uplift_suggestion_percent INTEGER DEFAULT 0,
  year INTEGER NOT NULL,
  UNIQUE(date, name, country)
);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON rm_holidays(date);

CREATE TABLE IF NOT EXISTS rm_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_start TEXT NOT NULL,
  date_end TEXT NOT NULL,
  location TEXT,
  event_type TEXT,
  impact_level TEXT NOT NULL DEFAULT 'medium' CHECK(impact_level IN ('low','medium','high','peak')),
  affects_properties TEXT,
  uplift_suggestion_percent INTEGER DEFAULT 0,
  min_stay_suggestion INTEGER,
  notes TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_dates ON rm_events(date_start, date_end);

CREATE TABLE IF NOT EXISTS rm_recommendations (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES rm_properties(id),
  date TEXT NOT NULL,
  calculated_at INTEGER NOT NULL,
  recommended_price_cents INTEGER NOT NULL,
  recommended_min_stay INTEGER NOT NULL,
  base_price_cents INTEGER NOT NULL,
  adj_weekday_cents INTEGER DEFAULT 0,
  adj_weekend_cents INTEGER DEFAULT 0,
  adj_holiday_cents INTEGER DEFAULT 0,
  adj_event_cents INTEGER DEFAULT 0,
  adj_lead_time_cents INTEGER DEFAULT 0,
  adj_market_cents INTEGER DEFAULT 0,
  adj_gap_fill_cents INTEGER DEFAULT 0,
  adj_premium_cents INTEGER DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 50,
  market_pressure_score INTEGER,
  vacancy_risk_score INTEGER,
  premium_opportunity INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','overridden','published','expired')),
  override_price_cents INTEGER,
  override_min_stay INTEGER,
  override_reason TEXT,
  currently_published_cents INTEGER,
  alert_flags TEXT,
  season_type TEXT,
  is_weekend INTEGER DEFAULT 0,
  is_holiday INTEGER DEFAULT 0,
  holiday_name TEXT,
  is_event INTEGER DEFAULT 0,
  event_name TEXT,
  lead_time_days INTEGER,
  summary_fr TEXT,
  factors_json TEXT,
  reviewed_at INTEGER,
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(property_id, date)
);
CREATE INDEX IF NOT EXISTS idx_reco_property_date ON rm_recommendations(property_id, date);
CREATE INDEX IF NOT EXISTS idx_reco_status ON rm_recommendations(status, property_id);
CREATE INDEX IF NOT EXISTS idx_reco_vacancy ON rm_recommendations(vacancy_risk_score DESC);

CREATE TABLE IF NOT EXISTS rm_published_rates (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  date TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  min_stay INTEGER NOT NULL,
  published_at INTEGER NOT NULL,
  published_by TEXT NOT NULL DEFAULT 'admin',
  recommendation_id TEXT,
  UNIQUE(property_id, date)
);
CREATE INDEX IF NOT EXISTS idx_published_property_date ON rm_published_rates(property_id, date);

CREATE TABLE IF NOT EXISTS rm_scraping_configs (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES rm_competitor_listings(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_listing_id TEXT NOT NULL,
  scrape_url TEXT NOT NULL,
  scraping_service TEXT NOT NULL DEFAULT 'apify',
  apify_actor_id TEXT DEFAULT 'dtrungtin/airbnb-scraper',
  scrape_frequency TEXT NOT NULL DEFAULT 'weekly',
  scrape_horizon_days INTEGER NOT NULL DEFAULT 180,
  last_scraped_at INTEGER,
  last_error TEXT,
  consecutive_errors INTEGER DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(listing_id)
);

CREATE TABLE IF NOT EXISTS rm_kpi_snapshots (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  snapshot_date TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('30d','90d','mtd','ytd')),
  total_revenue_cents INTEGER,
  adr_cents INTEGER,
  occupancy_rate REAL,
  revpar_cents INTEGER,
  nights_sold INTEGER,
  nights_available INTEGER,
  bookings_count INTEGER,
  avg_reco_price_cents INTEGER,
  avg_published_price_cents INTEGER,
  active_opportunities INTEGER DEFAULT 0,
  active_vacancy_risks INTEGER DEFAULT 0,
  calculated_at INTEGER NOT NULL,
  UNIQUE(property_id, snapshot_date, period_type)
);
`;

// Split DDL into individual statements (each CREATE TABLE / CREATE INDEX)
function parseDDL(sql) {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function runSeed(db) {
  const now = Date.now();

  const properties = [
    ["amaryllis", "Villa Amaryllis", "Amaryllis", "court", 8, 4, 2, "Sainte-Luce, Martinique", 14.47, -60.917, "EUR", "America/Martinique", 30000, 40000, 50000, 20000, 90000, 4, 3, 4, 5, 2, "premium", null, 1, now, now],
    ["zandoli", "Zandoli", "Zandoli", "court", 6, 3, 2, "Sainte-Luce, Martinique", 14.468, -60.919, "EUR", "America/Martinique", 15000, 22000, 28000, 10000, 50000, 3, 2, 3, 4, 2, "premium", null, 1, now, now],
    ["geko", "Geko", "Géko", "court", 4, 2, 1, "Sainte-Luce, Martinique", 14.467, -60.92, "EUR", "America/Martinique", 12000, 18000, 22000, 8000, 40000, 3, 2, 3, 4, 2, "standard", null, 1, now, now],
    ["mabouya", "Mabouya", "Mabouya", "court", 3, 1, 1, "Sainte-Luce, Martinique", 14.466, -60.921, "EUR", "America/Martinique", 7000, 9000, 11000, 5000, 18000, 2, 2, 2, 3, 1, "standard", null, 1, now, now],
    ["iguana", "Villa Iguana", "Iguana", "long", 4, 2, 1, "Sainte-Luce, Martinique", 14.465, -60.922, "EUR", "America/Martinique", 60000, 60000, 60000, 50000, 75000, 30, 30, 30, 30, 30, "standard", null, 1, now, now],
    ["schoelcher", "T2 Schoelcher", "Schoelcher", "moyen", 4, 2, 1, "Schoelcher, Martinique", 14.617, -61.093, "EUR", "America/Martinique", 7000, 9000, 11000, 5000, 18000, 3, 2, 3, 5, 2, "standard", null, 1, now, now],
    ["nogent", "T2 Nogent", "Nogent", "court", 4, 2, 1, "Nogent-sur-Marne, Île-de-France", 48.836, 2.483, "EUR", "Europe/Paris", 8000, 10000, 13000, 6000, 22000, 1, 1, 2, 3, 1, "standard", null, 1, now, now],
  ];

  const propSQL = `INSERT OR IGNORE INTO rm_properties VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const propStmts = properties.map((p) => db.prepare(propSQL).bind(...p));

  // Seasonal profiles
  const spSQL = `INSERT OR IGNORE INTO rm_seasonal_profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const seasons = [
    // Amaryllis
    ["sp_am_peak_1", "amaryllis", "Noël / Nouvel An 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 60000, 5, null, 1, now, now],
    ["sp_am_high_1", "amaryllis", "Haute saison 2025 (jan-avr)", "high", "2025-01-06", "2025-04-30", 2025, 80, 50000, 5, null, 1, now, now],
    ["sp_am_low_1", "amaryllis", "Basse saison mai-juin 2025", "low", "2025-05-01", "2025-06-30", 2025, 10, 30000, 3, null, 1, now, now],
    ["sp_am_mid_1", "amaryllis", "Moyenne saison été 2025", "mid", "2025-07-01", "2025-09-15", 2025, 50, 40000, 4, null, 1, now, now],
    ["sp_am_low_2", "amaryllis", "Basse saison automne 2025", "low", "2025-09-16", "2025-12-19", 2025, 10, 30000, 3, null, 1, now, now],
    ["sp_am_peak_2", "amaryllis", "Noël / Nouvel An 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 60000, 5, null, 1, now, now],
    ["sp_am_high_2", "amaryllis", "Haute saison 2026 (jan-avr)", "high", "2026-01-06", "2026-04-30", 2026, 80, 50000, 5, null, 1, now, now],
    ["sp_am_low_3", "amaryllis", "Basse saison mai-juin 2026", "low", "2026-05-01", "2026-06-30", 2026, 10, 30000, 3, null, 1, now, now],
    ["sp_am_mid_2", "amaryllis", "Moyenne saison été 2026", "mid", "2026-07-01", "2026-09-15", 2026, 50, 40000, 4, null, 1, now, now],
    ["sp_am_low_4", "amaryllis", "Basse saison automne 2026", "low", "2026-09-16", "2026-12-19", 2026, 10, 30000, 3, null, 1, now, now],
    // Zandoli
    ["sp_za_peak_1", "zandoli", "Noël / Nouvel An 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 35000, 4, null, 1, now, now],
    ["sp_za_high_1", "zandoli", "Haute saison 2025", "high", "2025-01-06", "2025-04-30", 2025, 80, 28000, 4, null, 1, now, now],
    ["sp_za_low_1", "zandoli", "Basse saison mai-juin 2025", "low", "2025-05-01", "2025-06-30", 2025, 10, 15000, 2, null, 1, now, now],
    ["sp_za_mid_1", "zandoli", "Été 2025", "mid", "2025-07-01", "2025-09-15", 2025, 50, 22000, 3, null, 1, now, now],
    ["sp_za_low_2", "zandoli", "Automne 2025", "low", "2025-09-16", "2025-12-19", 2025, 10, 15000, 2, null, 1, now, now],
    ["sp_za_peak_2", "zandoli", "Noël 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 35000, 4, null, 1, now, now],
    ["sp_za_high_2", "zandoli", "Haute 2026", "high", "2026-01-06", "2026-04-30", 2026, 80, 28000, 4, null, 1, now, now],
    ["sp_za_low_3", "zandoli", "Basse 2026 mai-juin", "low", "2026-05-01", "2026-06-30", 2026, 10, 15000, 2, null, 1, now, now],
    ["sp_za_mid_2", "zandoli", "Été 2026", "mid", "2026-07-01", "2026-09-15", 2026, 50, 22000, 3, null, 1, now, now],
    ["sp_za_low_4", "zandoli", "Automne 2026", "low", "2026-09-16", "2026-12-19", 2026, 10, 15000, 2, null, 1, now, now],
    // Geko
    ["sp_gk_peak_1", "geko", "Noël 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 27000, 4, null, 1, now, now],
    ["sp_gk_high_1", "geko", "Haute 2025", "high", "2025-01-06", "2025-04-30", 2025, 80, 22000, 3, null, 1, now, now],
    ["sp_gk_low_1", "geko", "Basse 2025", "low", "2025-05-01", "2025-06-30", 2025, 10, 12000, 2, null, 1, now, now],
    ["sp_gk_mid_1", "geko", "Été 2025", "mid", "2025-07-01", "2025-09-15", 2025, 50, 18000, 3, null, 1, now, now],
    ["sp_gk_low_2", "geko", "Automne 2025", "low", "2025-09-16", "2025-12-19", 2025, 10, 12000, 2, null, 1, now, now],
    ["sp_gk_peak_2", "geko", "Noël 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 27000, 4, null, 1, now, now],
    ["sp_gk_high_2", "geko", "Haute 2026", "high", "2026-01-06", "2026-04-30", 2026, 80, 22000, 3, null, 1, now, now],
    ["sp_gk_low_3", "geko", "Basse 2026", "low", "2026-05-01", "2026-06-30", 2026, 10, 12000, 2, null, 1, now, now],
    ["sp_gk_mid_2", "geko", "Été 2026", "mid", "2026-07-01", "2026-09-15", 2026, 50, 18000, 3, null, 1, now, now],
    ["sp_gk_low_4", "geko", "Automne 2026", "low", "2026-09-16", "2026-12-19", 2026, 10, 12000, 2, null, 1, now, now],
    // Mabouya
    ["sp_mb_peak_1", "mabouya", "Noël 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 14000, 3, null, 1, now, now],
    ["sp_mb_high_1", "mabouya", "Haute 2025", "high", "2025-01-06", "2025-04-30", 2025, 80, 11000, 2, null, 1, now, now],
    ["sp_mb_low_1", "mabouya", "Basse 2025", "low", "2025-05-01", "2025-06-30", 2025, 10, 7000, 2, null, 1, now, now],
    ["sp_mb_mid_1", "mabouya", "Été 2025", "mid", "2025-07-01", "2025-09-15", 2025, 50, 9000, 2, null, 1, now, now],
    ["sp_mb_low_2", "mabouya", "Automne 2025", "low", "2025-09-16", "2025-12-19", 2025, 10, 7000, 2, null, 1, now, now],
    ["sp_mb_peak_2", "mabouya", "Noël 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 14000, 3, null, 1, now, now],
    ["sp_mb_high_2", "mabouya", "Haute 2026", "high", "2026-01-06", "2026-04-30", 2026, 80, 11000, 2, null, 1, now, now],
    ["sp_mb_low_3", "mabouya", "Basse 2026", "low", "2026-05-01", "2026-06-30", 2026, 10, 7000, 2, null, 1, now, now],
    ["sp_mb_mid_2", "mabouya", "Été 2026", "mid", "2026-07-01", "2026-09-15", 2026, 50, 9000, 2, null, 1, now, now],
    ["sp_mb_low_4", "mabouya", "Automne 2026", "low", "2026-09-16", "2026-12-19", 2026, 10, 7000, 2, null, 1, now, now],
    // Schoelcher
    ["sp_sc_peak_1", "schoelcher", "Noël 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 14000, 5, null, 1, now, now],
    ["sp_sc_high_1", "schoelcher", "Haute 2025", "high", "2025-01-06", "2025-04-30", 2025, 80, 11000, 3, null, 1, now, now],
    ["sp_sc_low_1", "schoelcher", "Basse 2025", "low", "2025-05-01", "2025-06-30", 2025, 10, 7000, 2, null, 1, now, now],
    ["sp_sc_mid_1", "schoelcher", "Été 2025", "mid", "2025-07-01", "2025-09-15", 2025, 50, 9000, 3, null, 1, now, now],
    ["sp_sc_low_2", "schoelcher", "Automne 2025", "low", "2025-09-16", "2025-12-19", 2025, 10, 7000, 2, null, 1, now, now],
    ["sp_sc_peak_2", "schoelcher", "Noël 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 14000, 5, null, 1, now, now],
    ["sp_sc_high_2", "schoelcher", "Haute 2026", "high", "2026-01-06", "2026-04-30", 2026, 80, 11000, 3, null, 1, now, now],
    ["sp_sc_low_3", "schoelcher", "Basse 2026", "low", "2026-05-01", "2026-06-30", 2026, 10, 7000, 2, null, 1, now, now],
    ["sp_sc_mid_2", "schoelcher", "Été 2026", "mid", "2026-07-01", "2026-09-15", 2026, 50, 9000, 3, null, 1, now, now],
    ["sp_sc_low_4", "schoelcher", "Automne 2026", "low", "2026-09-16", "2026-12-19", 2026, 10, 7000, 2, null, 1, now, now],
    // Nogent
    ["sp_no_peak_1", "nogent", "Noël 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 16000, 3, null, 1, now, now],
    ["sp_no_high_1", "nogent", "Haute saison été 2025", "high", "2025-07-01", "2025-08-31", 2025, 80, 13000, 2, null, 1, now, now],
    ["sp_no_mid_1", "nogent", "Moyenne saison printemps 2025", "mid", "2025-03-01", "2025-06-30", 2025, 50, 10000, 1, null, 1, now, now],
    ["sp_no_mid_2", "nogent", "Moyenne saison automne 2025", "mid", "2025-09-01", "2025-12-19", 2025, 50, 10000, 1, null, 1, now, now],
    ["sp_no_low_1", "nogent", "Basse saison jan-fév 2025", "low", "2025-01-06", "2025-02-28", 2025, 10, 8000, 1, null, 1, now, now],
    ["sp_no_peak_2", "nogent", "Noël 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 16000, 3, null, 1, now, now],
    ["sp_no_high_2", "nogent", "Haute été 2026", "high", "2026-07-01", "2026-08-31", 2026, 80, 13000, 2, null, 1, now, now],
    ["sp_no_mid_3", "nogent", "Printemps 2026", "mid", "2026-03-01", "2026-06-30", 2026, 50, 10000, 1, null, 1, now, now],
    ["sp_no_mid_4", "nogent", "Automne 2026", "mid", "2026-09-01", "2026-12-19", 2026, 50, 10000, 1, null, 1, now, now],
    ["sp_no_low_2", "nogent", "Basse jan-fév 2026", "low", "2026-01-06", "2026-02-28", 2026, 10, 8000, 1, null, 1, now, now],
  ];
  const spStmts = seasons.map((s) => db.prepare(spSQL).bind(...s));

  // Pricing rules
  const ruleSQL = `INSERT OR IGNORE INTO rm_pricing_rules VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const rules = [
    ["rule_am_we", "amaryllis", "weekend_uplift", "Surcharge week-end Amaryllis", null, '{"days":[5,6]}', "fixed_cents", 2000, "low,mid,high,peak", null, null, "5,6", 5000, 20, 1, null, null, now, now],
    ["rule_za_we", "zandoli", "weekend_uplift", "Surcharge week-end Zandoli", null, '{"days":[5,6]}', "fixed_cents", 1500, null, null, null, "5,6", 3000, 20, 1, null, null, now, now],
    ["rule_gk_we", "geko", "weekend_uplift", "Surcharge week-end Géko", null, '{"days":[5,6]}', "fixed_cents", 1000, null, null, null, "5,6", 2000, 20, 1, null, null, now, now],
    ["rule_mb_we", "mabouya", "weekend_uplift", "Surcharge week-end Mabouya", null, '{"days":[5,6]}', "fixed_cents", 800, null, null, null, "5,6", 1500, 20, 1, null, null, now, now],
    ["rule_sc_we", "schoelcher", "weekend_uplift", "Surcharge week-end Schoelcher", null, '{"days":[5,6]}', "fixed_cents", 1000, null, null, null, "5,6", 2000, 20, 1, null, null, now, now],
    ["rule_no_we", "nogent", "weekend_uplift", "Surcharge week-end Nogent", null, '{"days":[5,6]}', "fixed_cents", 1500, null, null, null, "5,6", 3000, 20, 1, null, null, now, now],
    ["rule_holiday_mq", null, "holiday_uplift", "Surcharge jours fériés Martinique", null, "{}", "percent", 20.0, null, null, null, null, null, 10, 1, null, null, now, now],
    ["rule_event_mq", null, "event_uplift", "Surcharge événements locaux", null, "{}", "percent", 25.0, null, null, null, null, null, 10, 1, null, null, now, now],
    ["rule_lm_7", null, "lead_time_discount", "Remise last-minute J-0 à J-7", null, '{"max_days":7}', "percent", -25.0, null, 0, 7, null, null, 30, 1, null, null, now, now],
    ["rule_lm_14", null, "lead_time_discount", "Remise last-minute J-8 à J-14", null, '{"max_days":14}', "percent", -15.0, null, 8, 14, null, null, 30, 1, null, null, now, now],
    ["rule_far_out", null, "far_out_markup", "Majoration réservation lointaine", null, '{"min_days":120}', "percent", 5.0, null, 120, null, null, null, 40, 1, null, null, now, now],
  ];
  const ruleStmts = rules.map((r) => db.prepare(ruleSQL).bind(...r));

  // Holidays
  const holSQL = `INSERT OR IGNORE INTO rm_holidays VALUES (?,?,?,?,?,?,?,?)`;
  const holidays = [
    ["h_nj_2025", "2025-01-01", "Jour de l'An", "MQ", "national_holiday", "high", 15, 2025],
    ["h_ep_2025", "2025-03-04", "Mardi Gras Martinique", "MQ", "local_event", "peak", 30, 2025],
    ["h_vm_2025", "2025-04-18", "Vendredi Saint", "MQ", "national_holiday", "high", 20, 2025],
    ["h_pa_2025", "2025-04-21", "Lundi de Pâques", "MQ", "national_holiday", "high", 20, 2025],
    ["h_ft_2025", "2025-05-01", "Fête du Travail", "MQ", "national_holiday", "medium", 10, 2025],
    ["h_ve_2025", "2025-05-08", "Victoire 1945", "MQ", "national_holiday", "medium", 10, 2025],
    ["h_as_2025", "2025-05-29", "Ascension", "MQ", "national_holiday", "medium", 15, 2025],
    ["h_pe_2025", "2025-06-09", "Lundi de Pentecôte", "MQ", "national_holiday", "medium", 10, 2025],
    ["h_ba_2025", "2025-07-14", "Fête Nationale", "MQ", "national_holiday", "high", 20, 2025],
    ["h_ao_2025", "2025-08-15", "Assomption", "MQ", "national_holiday", "high", 20, 2025],
    ["h_to_2025", "2025-11-01", "Toussaint", "MQ", "national_holiday", "medium", 10, 2025],
    ["h_ar_2025", "2025-11-11", "Armistice", "MQ", "national_holiday", "medium", 5, 2025],
    ["h_no_2025", "2025-12-25", "Noël", "MQ", "national_holiday", "peak", 40, 2025],
    ["h_nj_2026", "2026-01-01", "Jour de l'An", "MQ", "national_holiday", "high", 15, 2026],
    ["h_ft_2026", "2026-05-01", "Fête du Travail", "MQ", "national_holiday", "medium", 10, 2026],
    ["h_ba_2026", "2026-07-14", "Fête Nationale", "MQ", "national_holiday", "high", 20, 2026],
    ["h_ao_2026", "2026-08-15", "Assomption", "MQ", "national_holiday", "high", 20, 2026],
    ["h_to_2026", "2026-11-01", "Toussaint", "MQ", "national_holiday", "medium", 10, 2026],
    ["h_no_2026", "2026-12-25", "Noël", "MQ", "national_holiday", "peak", 40, 2026],
    ["h_nj_fr_2025", "2025-01-01", "Jour de l'An", "FR", "national_holiday", "high", 15, 2025],
    ["h_pa_fr_2025", "2025-04-21", "Lundi de Pâques", "FR", "national_holiday", "medium", 10, 2025],
    ["h_ft_fr_2025", "2025-05-01", "Fête du Travail", "FR", "national_holiday", "medium", 10, 2025],
    ["h_ba_fr_2025", "2025-07-14", "Fête Nationale", "FR", "national_holiday", "high", 20, 2025],
    ["h_ao_fr_2025", "2025-08-15", "Assomption", "FR", "national_holiday", "medium", 10, 2025],
    ["h_no_fr_2025", "2025-12-25", "Noël", "FR", "national_holiday", "peak", 30, 2025],
    ["h_nj_fr_2026", "2026-01-01", "Jour de l'An", "FR", "national_holiday", "high", 15, 2026],
    ["h_ba_fr_2026", "2026-07-14", "Fête Nationale", "FR", "national_holiday", "high", 20, 2026],
    ["h_no_fr_2026", "2026-12-25", "Noël", "FR", "national_holiday", "peak", 30, 2026],
  ];
  const holStmts = holidays.map((h) => db.prepare(holSQL).bind(...h));

  // Events
  const evSQL = `INSERT OR IGNORE INTO rm_events VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
  const events = [
    ["ev_yoles_2025", "Tour des Yoles Rondes 2025", "2025-08-08", "2025-08-16", "Martinique", "sport", "peak", '["amaryllis","zandoli","geko","mabouya","schoelcher"]', 35, 5, "Course de voile traditionnelle, tourisme fort", now],
    ["ev_yoles_2026", "Tour des Yoles Rondes 2026", "2026-08-07", "2026-08-15", "Martinique", "sport", "peak", '["amaryllis","zandoli","geko","mabouya","schoelcher"]', 35, 5, null, now],
    ["ev_carn_2025", "Carnaval Martinique 2025", "2025-02-28", "2025-03-05", "Martinique", "festival", "peak", '["amaryllis","zandoli","geko","mabouya","schoelcher"]', 30, 5, "Carnaval majeur", now],
    ["ev_carn_2026", "Carnaval Martinique 2026", "2026-02-13", "2026-02-18", "Martinique", "festival", "peak", '["amaryllis","zandoli","geko","mabouya","schoelcher"]', 30, 5, null, now],
  ];
  const evStmts = events.map((e) => db.prepare(evSQL).bind(...e));

  // Run all seeds in batches (D1 batch max ~100 stmts at once)
  const allStmts = [...propStmts, ...spStmts, ...ruleStmts, ...holStmts, ...evStmts];
  const CHUNK = 80;
  for (let i = 0; i < allStmts.length; i += CHUNK) {
    await db.batch(allStmts.slice(i, i + CHUNK));
  }
  return allStmts.length;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "POST only" }, 405);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  try {
    // Execute DDL statements one by one
    const statements = parseDDL(DDL);
    let tables_created = 0;
    for (const stmt of statements) {
      await db.prepare(stmt).run();
      if (stmt.toUpperCase().startsWith("CREATE TABLE")) tables_created++;
    }

    // Run seed data
    const seeded = await runSeed(db);

    return json({ ok: true, tables_created, seed_statements: seeded });
  } catch (err) {
    return json({ ok: false, error: err.message, stack: err.stack }, 500);
  }
}
