/**
 * GET /api/seasonal-update?secret=POSTSTAY_SECRET
 * Agrège rm_kpi_snapshots → seasonal_memory (par bien × mois × année).
 * Appelé le 1er de chaque mois par le cron "0 1 1 * *".
 * Construit une mémoire saisonnière qui s'enrichit au fil des mois.
 * Le sentinel KPI lit seasonal_memory pour comparer au même mois historique.
 *
 * D1 binding : revenue_manager
 */

import { clog, timer } from './_log.js'

const DDL = `CREATE TABLE IF NOT EXISTS seasonal_memory (
  property_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  avg_occupancy REAL,
  avg_revpar_cents INTEGER,
  snapshot_count INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (property_id, month, year)
)`

export async function onRequestGet({ request, env }) {
  const t = timer()
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret') ?? ''
  if (!env.POSTSTAY_SECRET || secret !== env.POSTSTAY_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 })
  }

  const db = env.revenue_manager
  if (!db) return new Response(JSON.stringify({ ok: false, error: 'D1 binding manquant' }), { status: 503 })

  try {
    await db.prepare(DDL).run()
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 })
  }

  // Agréger rm_kpi_snapshots par bien × mois × année (Iguana exclu — bail long)
  const rows = await db.prepare(`
    SELECT property_id,
           CAST(strftime('%m', snapshot_date) AS INTEGER) AS month,
           CAST(strftime('%Y', snapshot_date) AS INTEGER) AS year,
           AVG(occupancy_rate)  AS avg_occ,
           AVG(revpar_cents)    AS avg_revpar,
           COUNT(*)             AS n
    FROM rm_kpi_snapshots
    WHERE period_type = '30d' AND snapshot_date IS NOT NULL AND snapshot_date != ''
      AND property_id IN ('amaryllis','zandoli','geko','mabouya','schoelcher','nogent')
    GROUP BY property_id, month, year
  `).all().then(r => r.results ?? []).catch(e => { clog('seasonal-update', 'error', { step: 'aggregate', err: e.message }); return null })

  if (rows === null) {
    return new Response(JSON.stringify({ ok: false, error: 'aggregate_failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  if (rows.length === 0) {
    clog('seasonal-update', 'warn', { step: 'aggregate', msg: 'Aucune donnée rm_kpi_snapshots — seasonal_memory non mise à jour' })
    return new Response(JSON.stringify({ ok: true, total: 0, upserted: 0, warn: 'no_source_data' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }

  let upserted = 0
  for (const row of rows) {
    if (!row.property_id || !row.month || !row.year) continue
    try {
      await db.prepare(`
        INSERT INTO seasonal_memory (property_id, month, year, avg_occupancy, avg_revpar_cents, snapshot_count, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(property_id, month, year) DO UPDATE SET
          avg_occupancy     = excluded.avg_occupancy,
          avg_revpar_cents  = excluded.avg_revpar_cents,
          snapshot_count    = excluded.snapshot_count,
          updated_at        = excluded.updated_at
      `).bind(
        row.property_id, row.month, row.year,
        row.avg_occ ?? null,
        Math.round(row.avg_revpar ?? 0) || null,
        row.n,
      ).run()
      upserted++
    } catch (e) {
      clog('seasonal-update', 'warn', { property: row.property_id, month: row.month, err: e.message })
    }
  }

  const biens = [...new Set(rows.map(r => r.property_id))].sort()
  const years = [...new Set(rows.map(r => r.year))].sort()
  const months = [...new Set(rows.map(r => r.month))].sort()
  clog('seasonal-update', 'info', { total: rows.length, upserted, biens, years, months, ms: t() })
  return new Response(JSON.stringify({ ok: true, total: rows.length, upserted }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
}
