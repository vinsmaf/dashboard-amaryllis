/**
 * Shared DDL definitions — imported by kpi-sentinel.js and ack-suggestion.js.
 * Single source of truth to avoid divergence between the two files.
 */

export const DDL_SUGGESTION_ACKS = `CREATE TABLE IF NOT EXISTS suggestion_acks (
  id TEXT PRIMARY KEY,
  signal TEXT,
  status TEXT NOT NULL CHECK(status IN ('done','ignore','later')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  acked_at TEXT NOT NULL DEFAULT (datetime('now', '-4 hours'))
)`

// arch-monitoring : snapshot quotidien du funnel GA4 (30j glissant) — permet à
// kpi-sentinel de détecter une baisse de conversion (signal 9), impossible avec
// scripts/funnel.mjs qui ne persiste jamais rien (ADR-G-001, chiffre volatil).
export const DDL_CONVERSION_SNAPSHOTS = `CREATE TABLE IF NOT EXISTS conversion_snapshots (
  snapshot_date TEXT PRIMARY KEY,
  sessions INTEGER NOT NULL,
  view_item INTEGER NOT NULL,
  purchase INTEGER NOT NULL,
  revenue_cents INTEGER NOT NULL,
  calculated_at INTEGER NOT NULL
)`
