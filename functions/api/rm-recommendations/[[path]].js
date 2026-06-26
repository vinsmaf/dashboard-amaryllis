// Cloudflare Pages Function — /api/rm-recommendations
// CRUD + full pricing engine for Revenue Manager recommendations
import { occupancyAdjustment } from "../../../src/utils/rmOccupancyAdjust.js";
import { BIENS } from "../../../src/data/biens.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

// ---------------------------------------------------------------------------
// Pricing Engine
// ---------------------------------------------------------------------------

/**
 * Find which seasonal profile applies to a given date for a property.
 * Returns the profile with the highest priority that covers the date.
 */
export function findSeasonalProfile(profiles, dateStr) {
  const matching = profiles.filter(
    (p) => p.is_active && dateStr >= p.date_start && dateStr <= p.date_end
  );
  if (!matching.length) return null;
  return matching.sort((a, b) => b.priority - a.priority)[0];
}

/**
 * Get the base price from the property given a season type.
 */
export function getBasePrice(property, seasonType) {
  switch (seasonType) {
    case "peak": return property.base_price_high; // use high as proxy for peak
    case "high": return property.base_price_high;
    case "mid":  return property.base_price_mid;
    case "low":  return property.base_price_low;
    default:     return property.base_price_mid;
  }
}

/**
 * Get the recommended min_stay from the property given a season type.
 */
export function getMinStay(property, seasonType) {
  switch (seasonType) {
    case "peak":
    case "high": return property.min_stay_high;
    case "mid":  return property.min_stay_mid;
    case "low":  return property.min_stay_low;
    default:     return property.min_stay_default;
  }
}

/**
 * Compute percentile of a sorted array.
 */
export function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

/**
 * Calculate a single date's pricing recommendation.
 * Returns an object ready to be inserted into rm_recommendations.
 */
export function calcDateReco({
  property,
  dateStr,
  profiles,
  rules,
  overridesMap,
  holidayMap,
  eventsForDate,
  signalMap,
  today,
  ownOccupancy = null,
  bookedDates = null,
  calFloorCents = 0,
}) {
  const dateObj = new Date(dateStr + "T00:00:00Z");
  const dow = dateObj.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const leadTimeDays = Math.round((dateObj.getTime() - new Date(today + "T00:00:00Z").getTime()) / 86400000);
  const isBooked = bookedDates && typeof bookedDates.has === "function" ? bookedDates.has(dateStr) : false;
  const isWeekend = dow === 5 || dow === 6 ? 1 : 0;

  // 1. Seasonal profile
  const profile = findSeasonalProfile(profiles, dateStr);
  const seasonType = profile ? profile.season_type : "mid";
  const profileFound = !!profile;

  // 2. Base price
  let basePrice = profile
    ? (profile.base_price_override || getBasePrice(property, seasonType))
    : getBasePrice(property, "mid");

  let minStay = profile
    ? (profile.min_stay_override || getMinStay(property, seasonType))
    : property.min_stay_default;

  // Track adjustments
  let adjWeekend = 0;
  let adjHoliday = 0;
  let adjEvent = 0;
  let adjLeadTime = 0;
  let adjMarket = 0;
  let adjGapFill = 0;

  const factors = [];

  // 3. Apply pricing rules (sorted by priority asc)
  const activeRules = rules
    .filter((r) => {
      if (!r.is_active) return false;
      if (r.property_id && r.property_id !== property.id) return false;
      if (r.valid_from && dateStr < r.valid_from) return false;
      if (r.valid_until && dateStr > r.valid_until) return false;
      return true;
    })
    .sort((a, b) => a.priority - b.priority);

  for (const rule of activeRules) {
    // Check season condition
    if (rule.condition_season) {
      const seasons = rule.condition_season.split(",").map((s) => s.trim());
      if (!seasons.includes(seasonType)) continue;
    }

    // Check DOW condition
    if (rule.condition_dow) {
      const dows = rule.condition_dow.split(",").map((d) => parseInt(d.trim(), 10));
      if (!dows.includes(dow)) continue;
    }

    // Check lead time condition
    if (rule.condition_lead_time_min !== null && rule.condition_lead_time_min !== undefined) {
      if (leadTimeDays < rule.condition_lead_time_min) continue;
    }
    if (rule.condition_lead_time_max !== null && rule.condition_lead_time_max !== undefined) {
      if (leadTimeDays > rule.condition_lead_time_max) continue;
    }

    // Compute raw adjustment
    let rawAdj = 0;
    if (rule.adjustment_type === "fixed_cents") {
      rawAdj = rule.adjustment_value;
    } else if (rule.adjustment_type === "percent") {
      rawAdj = Math.round((basePrice * rule.adjustment_value) / 100);
    } else if (rule.adjustment_type === "replace") {
      basePrice = rule.adjustment_value;
      continue;
    }

    // Apply max_adjustment cap
    if (rule.max_adjustment_cents && Math.abs(rawAdj) > rule.max_adjustment_cents) {
      rawAdj = rawAdj > 0 ? rule.max_adjustment_cents : -rule.max_adjustment_cents;
    }

    // Bucket into the right adjustment bucket
    if (rule.rule_type === "weekend_uplift") {
      adjWeekend += rawAdj;
      factors.push({ rule: rule.name, adj: rawAdj, type: "weekend" });
    } else if (rule.rule_type === "holiday_uplift") {
      // Only apply if there's actually a holiday this date (checked below)
      // Will be applied after holiday check
    } else if (rule.rule_type === "event_uplift") {
      // Only apply if there's an event this date (checked below)
    } else if (rule.rule_type === "lead_time_discount") {
      adjLeadTime += rawAdj;
      factors.push({ rule: rule.name, adj: rawAdj, type: "lead_time" });
    } else if (rule.rule_type === "far_out_markup") {
      adjLeadTime += rawAdj;
      factors.push({ rule: rule.name, adj: rawAdj, type: "far_out" });
    }
  }

  // 4. Holiday check
  const holiday = holidayMap[dateStr];
  let isHoliday = 0;
  let holidayName = null;
  if (holiday) {
    isHoliday = 1;
    holidayName = holiday.name;
    // Find holiday_uplift rule
    const holidayRule = activeRules.find((r) => r.rule_type === "holiday_uplift");
    if (holidayRule && holidayRule.adjustment_type === "percent") {
      const adj = Math.round((basePrice * holidayRule.adjustment_value) / 100);
      adjHoliday += adj;
      factors.push({ rule: holidayRule.name, adj, type: "holiday", holiday: holiday.name });
    }
  }

  // 5. Event check
  let isEvent = 0;
  let eventName = null;
  if (eventsForDate.length > 0) {
    isEvent = 1;
    eventName = eventsForDate[0].name;
    // Apply event_uplift
    const eventRule = activeRules.find((r) => r.rule_type === "event_uplift");
    if (eventRule && eventRule.adjustment_type === "percent") {
      // Check if this property is in affects_properties
      let affected = true;
      try {
        const ap = JSON.parse(eventsForDate[0].affects_properties || "[]");
        if (ap.length > 0 && !ap.includes(property.id)) affected = false;
      } catch (_) {}
      if (affected) {
        const adj = Math.round((basePrice * eventRule.adjustment_value) / 100);
        adjEvent += adj;
        factors.push({ rule: eventRule.name, adj, type: "event", event: eventName });
      }
    }
  }

  // 6. Check override
  const override = overridesMap[dateStr];
  let overridePriceCents = null;
  let overrideMinStay = null;
  let overrideReason = null;
  if (override) {
    if (override.override_type === "price" && override.is_active) {
      overridePriceCents = override.value_cents;
    } else if (override.override_type === "min_stay" && override.is_active) {
      overrideMinStay = override.value_int;
    }
    overrideReason = override.reason;
  }

  // 7. Market signal adjustment
  const signal = signalMap[dateStr];
  if (signal) {
    if ((signal.market_pressure_score || 0) > 70) {
      const adj = Math.round(basePrice * 0.05);
      adjMarket += adj;
      factors.push({ type: "market_high", adj, pressure: signal.market_pressure_score });
    } else if ((signal.market_pressure_score || 0) < 30) {
      const adj = Math.round(basePrice * -0.05);
      adjMarket += adj;
      factors.push({ type: "market_low", adj, pressure: signal.market_pressure_score });
    }
    // RM-01 — uplift scarcité marché : quand la rareté est élevée, monter le prix
    const scarcity = signal.scarcity_score || 0;
    if (scarcity > 85) {
      const adj = Math.round(basePrice * 0.10);
      adjMarket += adj;
      factors.push({ type: "scarcity_very_high", adj, scarcity });
    } else if (scarcity > 70) {
      const adj = Math.round(basePrice * 0.05);
      adjMarket += adj;
      factors.push({ type: "scarcity_high", adj, scarcity });
    }
  }

  // 7b. Ajustement selon NOTRE occupation réelle (advisory — phase 2)
  let adjOccupancy = 0;
  let occInfo = null;
  if (ownOccupancy && !isBooked) {
    occInfo = occupancyAdjustment({ rate30: ownOccupancy.rate30 ?? null, rate90: ownOccupancy.rate90 ?? null, leadTimeDays, basePriceCents: basePrice });
    if (occInfo.adjCents) {
      adjOccupancy += occInfo.adjCents;
      factors.push({ type: "own_occupancy", adj: occInfo.adjCents, label: occInfo.label, rate: occInfo.rate });
    }
  }

  // 8. Gap fill — non implémenté (RM-04 rejeté)
  const isOrphan = false;

  // 9. Final price computation
  let finalPrice = basePrice + adjWeekend + adjHoliday + adjEvent + adjLeadTime + adjMarket + adjGapFill + adjOccupancy;

  // Override price wins if set
  const effectivePrice = overridePriceCents !== null ? overridePriceCents : finalPrice;
  const effectiveMinStay = overrideMinStay !== null ? overrideMinStay : minStay;

  // Clamp to [price_min, price_max]
  // Plancher à 5 couches : price_min D1 / base_price_low D1 / prix biens.js / basePrice saisonnier / CalendrierTarifs du jour.
  // La 4e couche garantit que le RM ne recommande jamais SOUS le prix de base de la saison courante —
  // les règles de discount (lead_time, occupation) peuvent monter mais jamais descendre sous ce plancher.
  const siteMinCents = (BIENS[property.id]?.prix || 0) * 100;
  const hardFloor = Math.max(property.price_min || 0, property.base_price_low || 0, siteMinCents, basePrice, calFloorCents);
  const isFloorClamped = effectivePrice < hardFloor;
  const clampedPrice = Math.max(hardFloor, Math.min(property.price_max || Infinity, effectivePrice));

  // 10. Confidence score
  let confidence = 50;
  if (signal && (signal.data_confidence || 0) > 60) confidence += 20;
  if (profileFound) confidence += 10;
  if (leadTimeDays > 30) confidence += 10;
  if (!signal) confidence -= 20;
  if (adjGapFill < 0) confidence -= 10;
  confidence = Math.max(0, Math.min(100, confidence));

  // 11. Vacancy risk score
  let vacancyRisk = 20;
  if (leadTimeDays < 14) {
    vacancyRisk = 80 + Math.min(19, 14 - leadTimeDays);
  } else if (leadTimeDays < 30) {
    vacancyRisk = 50 + Math.round(((30 - leadTimeDays) / 16) * 29);
  } else if (signal && signal.availability_rate !== null) {
    vacancyRisk = Math.round((signal.availability_rate || 0.5) * 40);
  }
  vacancyRisk = Math.max(0, Math.min(100, vacancyRisk + (occInfo ? occInfo.vacancyDelta : 0)));

  // 12. Premium opportunity
  let premiumOpportunity = 0;
  if (signal && (signal.scarcity_score || 0) > 70) {
    premiumOpportunity = 75 + Math.min(24, (signal.scarcity_score - 70));
  } else if (isHoliday || isEvent) {
    premiumOpportunity = 60 + (isHoliday ? 10 : 0) + (isEvent ? 10 : 0);
  } else if (signal) {
    premiumOpportunity = Math.max(0, (signal.premium_opportunity || 0));
  }
  premiumOpportunity = Math.max(0, Math.min(100, premiumOpportunity + (occInfo ? occInfo.premiumDelta : 0)));

  // Date déjà vendue : pas de risque vacance ni d'opportunité (la reco devient indicative).
  if (isBooked) { vacancyRisk = 0; premiumOpportunity = 0; }

  // 13. Alert flags
  const alertFlags = [];
  if (vacancyRisk > 70) alertFlags.push("vacancy_risk_high");
  if (premiumOpportunity > 70) alertFlags.push("premium_opportunity");
  if (leadTimeDays < 7 && vacancyRisk > 60) alertFlags.push("last_minute_unbooked");
  if (isBooked) alertFlags.push("already_booked");
  if (occInfo && occInfo.label) alertFlags.push("own_" + occInfo.label);
  if (isHoliday) alertFlags.push(`holiday:${holidayName}`);
  if (isEvent) alertFlags.push(`event:${eventName}`);
  if (isFloorClamped) alertFlags.push("floor_clamped");

  // 14. Summary FR
  const priceFmt = (clampedPrice / 100).toFixed(0);
  const seasonLabel = { low: "basse saison", mid: "mi-saison", high: "haute saison", peak: "pleine saison" }[seasonType] || seasonType;
  let summary = `${dateStr} — ${priceFmt}€/nuit (${seasonLabel}`;
  if (isWeekend) summary += ", week-end";
  if (isHoliday) summary += `, ${holidayName}`;
  if (isEvent) summary += `, ${eventName}`;
  summary += `)`;
  if (isBooked) summary += " 🔒 déjà réservé";
  if (vacancyRisk > 70) summary += " ⚠️ risque vacance";
  if (premiumOpportunity > 70) summary += " ✨ opportunité premium";
  if (isFloorClamped) summary += " 🔒 plancher saisonnier";
  if (occInfo && occInfo.label) summary += ` · occupation ${Math.round((occInfo.rate || 0) * 100)}% → ${occInfo.pct > 0 ? "+" : ""}${Math.round(occInfo.pct * 100)}%${occInfo.suggestMinStay ? " (min-stay réduit conseillé)" : ""}`;

  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    property_id: property.id,
    date: dateStr,
    calculated_at: now,
    recommended_price_cents: clampedPrice,
    recommended_min_stay: effectiveMinStay,
    base_price_cents: basePrice,
    adj_weekday_cents: isWeekend ? 0 : 0,
    adj_weekend_cents: adjWeekend,
    adj_holiday_cents: adjHoliday,
    adj_event_cents: adjEvent,
    adj_lead_time_cents: adjLeadTime,
    adj_market_cents: adjMarket,
    adj_gap_fill_cents: adjGapFill,
    adj_premium_cents: 0,
    confidence_score: confidence,
    market_pressure_score: signal ? signal.market_pressure_score : null,
    vacancy_risk_score: vacancyRisk,
    premium_opportunity: premiumOpportunity,
    status: "pending",
    override_price_cents: overridePriceCents,
    override_min_stay: overrideMinStay,
    override_reason: overrideReason,
    currently_published_cents: null,
    alert_flags: JSON.stringify(alertFlags),
    season_type: seasonType,
    is_weekend: isWeekend,
    is_holiday: isHoliday,
    holiday_name: holidayName,
    is_event: isEvent,
    event_name: eventName,
    lead_time_days: leadTimeDays,
    summary_fr: summary,
    factors_json: JSON.stringify(factors),
    reviewed_at: null,
    published_at: null,
    created_at: now,
    updated_at: now,
  };
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleGet(request, db) {
  const url = new URL(request.url);
  const property_id = url.searchParams.get("property_id");
  const from = url.searchParams.get("from") || new Date().toISOString().slice(0, 10);
  const to = url.searchParams.get("to") || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const status = url.searchParams.get("status");

  if (!property_id) return json({ error: "property_id required" }, 400);

  let q = `SELECT * FROM rm_recommendations WHERE property_id = ? AND date >= ? AND date <= ?`;
  const binds = [property_id, from, to];
  if (status) {
    q += ` AND status = ?`;
    binds.push(status);
  }
  q += ` ORDER BY date ASC`;

  const { results } = await db.prepare(q).bind(...binds).all();
  return json({ recommendations: results, count: results.length });
}

async function handleCalculate(db, body) {
  const { property_id, daily_floors } = body;
  if (!property_id) return json({ error: "property_id required" }, 400);

  const today = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

  // Load all needed data in parallel
  const [propRes, profilesRes, rulesRes, overridesRes, holidaysRes, eventsRes, signalsRes] =
    await Promise.all([
      db.prepare(`SELECT * FROM rm_properties WHERE id = ? AND is_active = 1`).bind(property_id).first(),
      db.prepare(`SELECT * FROM rm_seasonal_profiles WHERE property_id = ? AND is_active = 1`).bind(property_id).all(),
      db.prepare(`SELECT * FROM rm_pricing_rules WHERE (property_id = ? OR property_id IS NULL) AND is_active = 1`).bind(property_id).all(),
      db.prepare(`SELECT * FROM rm_overrides WHERE property_id = ? AND is_active = 1 AND date >= ? AND date <= ?`).bind(property_id, today, endDate).all(),
      db.prepare(`SELECT * FROM rm_holidays WHERE date >= ? AND date <= ?`).bind(today, endDate).all(),
      db.prepare(`SELECT * FROM rm_events WHERE date_start <= ? AND date_end >= ?`).bind(endDate, today).all(),
      db.prepare(`SELECT * FROM rm_market_signals WHERE property_id = ? AND signal_date >= ? AND signal_date <= ?`).bind(property_id, today, endDate).all(),
    ]);

  if (!propRes) return json({ error: "Property not found or inactive" }, 404);

  const profiles = profilesRes.results || [];
  const rules = rulesRes.results || [];
  const overrides = overridesRes.results || [];
  const holidays = holidaysRes.results || [];
  const events = eventsRes.results || [];
  const signals = signalsRes.results || [];

  // Build fast lookup maps
  const overridesMap = {};
  for (const o of overrides) overridesMap[o.date] = o;

  const holidayMap = {};
  for (const h of holidays) holidayMap[h.date] = h;

  const signalMap = {};
  for (const s of signals) signalMap[s.signal_date] = s;

  // Notre occupation réelle (dernier snapshot 30d/90d) — phase 2 : alimente le moteur
  let ownOccupancy = null;
  try {
    const { results: occRows } = await db.prepare(
      "SELECT period_type, occupancy_rate FROM rm_kpi_snapshots WHERE property_id=? AND period_type IN ('30d','90d') ORDER BY snapshot_date DESC"
    ).bind(property_id).all();
    const seenOcc = {};
    for (const r of (occRows || [])) { if (!(r.period_type in seenOcc)) seenOcc[r.period_type] = r.occupancy_rate; }
    ownOccupancy = { rate30: seenOcc["30d"] ?? null, rate90: seenOcc["90d"] ?? null };
  } catch {}

  // Dates déjà réservées du bien (neutralise les recos sur ces dates) — fail-soft
  let bookedDates = null;
  try {
    const av = await fetch(`https://villamaryllis.com/api/get-availability?bienId=${encodeURIComponent(property_id)}`);
    const j = await av.json();
    if (Array.isArray(j.blockedDates)) bookedDates = new Set(j.blockedDates);
  } catch {}

  // Generate all dates from today to today+365
  const dates = [];
  const cur = new Date(today + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  // Build events-by-date lookup
  const eventsByDate = {};
  for (const d of dates) {
    eventsByDate[d] = events.filter((e) => d >= e.date_start && d <= e.date_end);
  }

  // Calculate recommendations
  const recos = dates.map((dateStr) =>
    calcDateReco({
      property: propRes,
      dateStr,
      profiles,
      rules,
      overridesMap,
      holidayMap,
      eventsForDate: eventsByDate[dateStr] || [],
      signalMap,
      today,
      ownOccupancy,
      bookedDates,
      calFloorCents: daily_floors && daily_floors[dateStr] ? daily_floors[dateStr] * 100 : 0,
    })
  );

  // Upsert in batches
  const upsertSQL = `
    INSERT INTO rm_recommendations
      (id, property_id, date, calculated_at, recommended_price_cents, recommended_min_stay,
       base_price_cents, adj_weekday_cents, adj_weekend_cents, adj_holiday_cents, adj_event_cents,
       adj_lead_time_cents, adj_market_cents, adj_gap_fill_cents, adj_premium_cents,
       confidence_score, market_pressure_score, vacancy_risk_score, premium_opportunity,
       status, override_price_cents, override_min_stay, override_reason, currently_published_cents,
       alert_flags, season_type, is_weekend, is_holiday, holiday_name, is_event, event_name,
       lead_time_days, summary_fr, factors_json, reviewed_at, published_at, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(property_id, date) DO UPDATE SET
      calculated_at = excluded.calculated_at,
      recommended_price_cents = excluded.recommended_price_cents,
      recommended_min_stay = excluded.recommended_min_stay,
      base_price_cents = excluded.base_price_cents,
      adj_weekend_cents = excluded.adj_weekend_cents,
      adj_holiday_cents = excluded.adj_holiday_cents,
      adj_event_cents = excluded.adj_event_cents,
      adj_lead_time_cents = excluded.adj_lead_time_cents,
      adj_market_cents = excluded.adj_market_cents,
      adj_gap_fill_cents = excluded.adj_gap_fill_cents,
      confidence_score = excluded.confidence_score,
      market_pressure_score = excluded.market_pressure_score,
      vacancy_risk_score = excluded.vacancy_risk_score,
      premium_opportunity = excluded.premium_opportunity,
      alert_flags = excluded.alert_flags,
      season_type = excluded.season_type,
      is_weekend = excluded.is_weekend,
      is_holiday = excluded.is_holiday,
      holiday_name = excluded.holiday_name,
      is_event = excluded.is_event,
      event_name = excluded.event_name,
      lead_time_days = excluded.lead_time_days,
      summary_fr = excluded.summary_fr,
      factors_json = excluded.factors_json,
      updated_at = excluded.updated_at
  `;

  const CHUNK = 50;
  let processed = 0;
  for (let i = 0; i < recos.length; i += CHUNK) {
    const chunk = recos.slice(i, i + CHUNK);
    const stmts = chunk.map((r) =>
      db.prepare(upsertSQL).bind(
        r.id, r.property_id, r.date, r.calculated_at,
        r.recommended_price_cents, r.recommended_min_stay, r.base_price_cents,
        r.adj_weekday_cents, r.adj_weekend_cents, r.adj_holiday_cents, r.adj_event_cents,
        r.adj_lead_time_cents, r.adj_market_cents, r.adj_gap_fill_cents, r.adj_premium_cents,
        r.confidence_score, r.market_pressure_score, r.vacancy_risk_score, r.premium_opportunity,
        r.status, r.override_price_cents, r.override_min_stay, r.override_reason,
        r.currently_published_cents, r.alert_flags, r.season_type, r.is_weekend,
        r.is_holiday, r.holiday_name, r.is_event, r.event_name, r.lead_time_days,
        r.summary_fr, r.factors_json, r.reviewed_at, r.published_at, r.created_at, r.updated_at
      )
    );
    await db.batch(stmts);
    processed += chunk.length;
  }

  return json({ ok: true, property_id, dates_calculated: processed });
}

async function handleApprove(db, body) {
  const { property_id, date, price_override, min_stay_override, reason } = body;
  if (!property_id || !date) return json({ error: "property_id and date required" }, 400);

  const now = Date.now();
  const existing = await db
    .prepare(`SELECT * FROM rm_recommendations WHERE property_id = ? AND date = ?`)
    .bind(property_id, date)
    .first();
  if (!existing) return json({ error: "Recommendation not found" }, 404);

  const newStatus = price_override || min_stay_override ? "overridden" : "approved";
  await db
    .prepare(
      `UPDATE rm_recommendations SET
        status = ?, override_price_cents = ?, override_min_stay = ?, override_reason = ?,
        reviewed_at = ?, updated_at = ?
       WHERE property_id = ? AND date = ?`
    )
    .bind(
      newStatus,
      price_override || null,
      min_stay_override || null,
      reason || null,
      now, now,
      property_id, date
    )
    .run();

  const updated = await db
    .prepare(`SELECT * FROM rm_recommendations WHERE property_id = ? AND date = ?`)
    .bind(property_id, date)
    .first();

  return json({ ok: true, recommendation: updated });
}

async function handleReject(db, body) {
  const { property_id, date, reason } = body;
  if (!property_id || !date) return json({ error: "property_id and date required" }, 400);

  const now = Date.now();
  await db
    .prepare(
      `UPDATE rm_recommendations SET status = 'rejected', override_reason = ?, reviewed_at = ?, updated_at = ?
       WHERE property_id = ? AND date = ?`
    )
    .bind(reason || null, now, now, property_id, date)
    .run();

  return json({ ok: true });
}

async function handleDeleteOverride(db, url) {
  const property_id = url.searchParams.get("property_id");
  const date = url.searchParams.get("date");
  if (!property_id || !date) return json({ error: "property_id and date required" }, 400);

  const now = Date.now();
  await db
    .prepare(
      `UPDATE rm_recommendations SET
        status = 'pending', override_price_cents = NULL, override_min_stay = NULL,
        override_reason = NULL, reviewed_at = NULL, updated_at = ?
       WHERE property_id = ? AND date = ?`
    )
    .bind(now, property_id, date)
    .run();

  return json({ ok: true });
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
  const path = url.pathname; // e.g. /api/rm-recommendations/calculate

  try {
    if (request.method === "GET") {
      return handleGet(request, db);
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));

      if (path.endsWith("/calculate")) return handleCalculate(db, body);
      if (path.endsWith("/approve"))   return handleApprove(db, body);
      if (path.endsWith("/reject"))    return handleReject(db, body);

      return json({ error: "Unknown POST action. Use /calculate, /approve, or /reject" }, 400);
    }

    if (request.method === "DELETE") {
      if (path.endsWith("/override")) return handleDeleteOverride(db, url);
      return json({ error: "Unknown DELETE action" }, 400);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err.message, stack: err.stack }, 500);
  }
}
