// Cloudflare Pages Function — GET /api/rm-dashboard
// Main dashboard data for the Revenue Manager module

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  // sec : données RM sensibles (KPIs/prix) → admin uniquement.
  const { ok: authOk } = await verifyBearer(request, env);
  if (!authOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  const url = new URL(request.url);
  const property_id = url.searchParams.get("property_id");
  if (!property_id) return json({ error: "property_id is required" }, 400);

  const today = new Date().toISOString().slice(0, 10);
  const date90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const date30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  try {
    // Run all queries in parallel
    const [propertyRes, recoRes, kpiRes, signalsRes, allPropsRes] = await Promise.all([
      // Property info
      db
        .prepare(
          `SELECT p.*,
            (SELECT COUNT(*) FROM rm_seasonal_profiles WHERE property_id = p.id AND is_active = 1) as profile_count
           FROM rm_properties p WHERE p.id = ?`
        )
        .bind(property_id)
        .first(),

      // Recommendations for next 90 days
      db
        .prepare(
          `SELECT date, recommended_price_cents, recommended_min_stay, status,
                  confidence_score, vacancy_risk_score, premium_opportunity,
                  market_pressure_score, season_type, is_weekend, is_holiday, is_event,
                  holiday_name, event_name, lead_time_days, summary_fr, alert_flags,
                  override_price_cents, currently_published_cents
           FROM rm_recommendations
           WHERE property_id = ? AND date >= ? AND date <= ?
           ORDER BY date ASC`
        )
        .bind(property_id, today, date90)
        .all(),

      // KPI snapshot (most recent)
      db
        .prepare(
          `SELECT * FROM rm_kpi_snapshots
           WHERE property_id = ? AND period_type = '30d'
           ORDER BY snapshot_date DESC LIMIT 1`
        )
        .bind(property_id)
        .first(),

      // Market signals for next 30 days
      db
        .prepare(
          `SELECT signal_date, market_pressure_score, scarcity_score, premium_opportunity,
                  vacancy_risk, market_label, availability_rate, price_median_cents,
                  data_confidence, competitors_with_data, competitors_total, alert_flags
           FROM rm_market_signals
           WHERE property_id = ? AND signal_date >= ? AND signal_date <= ?
           ORDER BY signal_date ASC`
        )
        .bind(property_id, today, date30)
        .all(),

      // All active properties (for sidebar/selector)
      db
        .prepare(
          `SELECT id, name, short_name, type, positioning, is_active FROM rm_properties WHERE is_active = 1 ORDER BY name`
        )
        .all(),
    ]);

    if (!propertyRes) return json({ error: "Property not found" }, 404);

    // Occupation réelle — dernier snapshot 30d & 90d par bien
    let occupancy = null;
    try {
      const { results } = await db
        .prepare(
          "SELECT period_type, occupancy_rate, nights_sold, nights_available, snapshot_date FROM rm_kpi_snapshots " +
            "WHERE property_id=? AND period_type IN ('30d','90d') ORDER BY snapshot_date DESC"
        )
        .bind(property_id)
        .all();
      const seen = {};
      for (const r of (results || [])) { if (!seen[r.period_type]) seen[r.period_type] = r; }
      occupancy = { d30: seen["30d"] || null, d90: seen["90d"] || null };
    } catch {}

    const recommendations = recoRes.results || [];

    // Compute KPIs from recommendations
    const pending = recommendations.filter((r) => r.status === "pending").length;
    const approved = recommendations.filter((r) => r.status === "approved").length;
    const published = recommendations.filter((r) => r.status === "published").length;

    const withPrice = recommendations.filter((r) => r.recommended_price_cents > 0);
    const avgRecoPrice =
      withPrice.length > 0 ? Math.round(withPrice.reduce((s, r) => s + r.recommended_price_cents, 0) / withPrice.length) : 0;

    // Alerts = recommendations with non-null alert_flags
    const alerts = recommendations.filter((r) => r.alert_flags && r.alert_flags !== "[]" && r.alert_flags !== "null");

    // Top opportunities: vacancy_risk_score > 60 OR premium_opportunity > 70
    const opportunities = recommendations
      .filter((r) => (r.vacancy_risk_score || 0) > 60 || (r.premium_opportunity || 0) > 70)
      .sort((a, b) => {
        const scoreA = Math.max(a.vacancy_risk_score || 0, a.premium_opportunity || 0);
        const scoreB = Math.max(b.vacancy_risk_score || 0, b.premium_opportunity || 0);
        return scoreB - scoreA;
      })
      .slice(0, 5);

    // Market signals summary
    const signals = signalsRes.results || [];
    const signalsSummary = {
      total_days: signals.length,
      avg_pressure: signals.length > 0 ? Math.round(signals.reduce((s, x) => s + (x.market_pressure_score || 0), 0) / signals.length) : null,
      avg_availability_rate: signals.length > 0 ? +(signals.reduce((s, x) => s + (x.availability_rate || 0), 0) / signals.length).toFixed(3) : null,
      strong_days: signals.filter((s) => s.market_label === "strong").length,
      weak_days: signals.filter((s) => s.market_label === "weak").length,
      signals,
    };

    return json({
      property: propertyRes,
      recommendations,
      opportunities,
      kpis: {
        avg_reco_price_cents: avgRecoPrice,
        pending,
        approved,
        published,
        total_90d: recommendations.length,
        alerts_count: alerts.length,
        ...(kpiRes || {}),
      },
      market_signals: signalsSummary,
      occupancy,
      all_properties: allPropsRes.results || [],
      generated_at: Date.now(),
    });
  } catch (err) {
    return json({ error: err.message, stack: err.stack }, 500);
  }
}
