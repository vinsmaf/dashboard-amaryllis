// Cloudflare Pages Function — GET /api/occupancy-stats
// Occupation réelle 30 jours glissants, un chiffre par bien actif.
// Lit le dernier snapshot rm_kpi_snapshots (period_type='30d'), écrit par le
// Worker (runOccupancySnapshot, cron horaire) — ne recalcule rien ici.

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);

  // Données RM sensibles (occupation réelle) → admin uniquement, même politique que rm-dashboard.
  const { ok: authOk } = await verifyBearer(request, env);
  if (!authOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  try {
    const { results } = await db.prepare(
      `SELECT s.property_id, s.occupancy_rate, s.nights_sold, s.nights_available, s.snapshot_date,
              p.name, p.short_name
       FROM rm_kpi_snapshots s
       LEFT JOIN rm_properties p ON p.id = s.property_id
       WHERE s.period_type = '30d'
         AND s.snapshot_date = (
           SELECT MAX(snapshot_date) FROM rm_kpi_snapshots
           WHERE property_id = s.property_id AND period_type = '30d'
         )
       ORDER BY s.property_id`
    ).all();

    const properties = (results || []).map(r => ({
      property_id:       r.property_id,
      name:               r.name || r.property_id,
      short_name:         r.short_name || null,
      occupancy_rate:     r.occupancy_rate,
      occupancy_pct:      r.occupancy_rate != null ? Math.round(r.occupancy_rate * 1000) / 10 : null,
      nights_sold:        r.nights_sold,
      nights_available:   r.nights_available,
      snapshot_date:      r.snapshot_date,
    }));

    return json({ ok: true, period: "30d", properties });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
