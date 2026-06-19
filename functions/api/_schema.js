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
