/**
 * PRICING ENGINE
 * Pure function — no side effects, fully testable
 * All monetary values in EUROS (not centimes) for readability
 * The API layer converts to/from centimes
 */

import { PROPERTY_CONFIGS } from './rmConfig.js';

/**
 * Main entry point
 * @param {Object} params
 * @param {string} params.propertyId
 * @param {string} params.date - 'YYYY-MM-DD'
 * @param {Object} params.seasonalProfile - {season_type, base_price_override}
 * @param {Object|null} params.holiday - {name, uplift_suggestion_percent, impact_level}
 * @param {Object|null} params.event - {name, uplift_suggestion_percent, impact_level}
 * @param {Object|null} params.marketSignal - {market_pressure_score, scarcity_score, premium_opportunity, availability_rate, price_median_cents, data_confidence}
 * @param {boolean} params.isBooked - already booked
 * @param {boolean} params.isGap - is an unfilllable gap
 * @param {number} params.gapLength - length of gap in nights
 * @param {Object|null} params.override - {override_type, value_cents, value_int}
 * @param {Array} params.activeRules - [{rule_type, adjustment_type, adjustment_value, condition_season, condition_lead_time_min, condition_lead_time_max, condition_dow, max_adjustment_cents}]
 * @param {string} params.today - 'YYYY-MM-DD' (for lead time calculation)
 * @returns {Object} recommendation
 */
export function calculateDayPrice(params) {
  const {
    propertyId, date, seasonalProfile, holiday = null, event = null,
    marketSignal = null, isBooked = false, isGap = false, gapLength = 0,
    override = null, activeRules = [], today
  } = params;

  const config = PROPERTY_CONFIGS[propertyId];
  if (!config) throw new Error(`Unknown property: ${propertyId}`);

  // --- Lead time ---
  const todayDate = new Date(today + 'T12:00:00Z');
  const targetDate = new Date(date + 'T12:00:00Z');
  const leadTimeDays = Math.round((targetDate - todayDate) / 86400000);

  // --- Season ---
  const seasonType = seasonalProfile?.season_type ?? getSeasonFromDate(date, config);
  const basePrice = seasonalProfile?.base_price_override
    ? seasonalProfile.base_price_override / 100
    : config.basePrices[seasonType] ?? config.basePrices.low;

  // --- Day of week ---
  const dow = targetDate.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dow === 5 || dow === 6; // Fri, Sat

  // --- Adjustments ---
  const factors = [];
  factors.push({ key: 'base_season', label: `Prix base ${SEASONS_LABELS[seasonType]}`, value: basePrice, type: 'base' });

  let totalAdjustment = 0;
  let adjWeekend = 0, adjHoliday = 0, adjEvent = 0, adjLeadTime = 0, adjMarket = 0, adjGap = 0, adjPremium = 0;

  // Weekend uplift
  if (isWeekend && config.weekendUplift > 0) {
    const rulesForWeekend = activeRules.filter(r => r.rule_type === 'weekend_uplift' && (!r.property_id || r.property_id === propertyId));
    if (rulesForWeekend.length > 0) {
      const rule = rulesForWeekend[0];
      adjWeekend = applyRule(rule, basePrice);
    } else {
      adjWeekend = config.weekendUplift;
    }
    if (adjWeekend !== 0) {
      factors.push({ key: 'weekend_uplift', label: `Surcharge ${dow === 5 ? 'vendredi' : 'samedi'}`, value: adjWeekend, type: adjWeekend > 0 ? 'positive' : 'negative' });
      totalAdjustment += adjWeekend;
    }
  }

  // Holiday uplift
  if (holiday) {
    const pct = holiday.uplift_suggestion_percent ?? config.holidayUpliftPct;
    adjHoliday = Math.round(basePrice * pct / 100);
    factors.push({ key: 'holiday_uplift', label: `Jour férié : ${holiday.name}`, value: adjHoliday, type: 'positive' });
    totalAdjustment += adjHoliday;
  }

  // Event uplift
  if (event) {
    const pct = event.uplift_suggestion_percent ?? config.eventUpliftPct;
    adjEvent = Math.round(basePrice * pct / 100);
    factors.push({ key: 'event_uplift', label: `Événement : ${event.name}`, value: adjEvent, type: 'positive' });
    totalAdjustment += adjEvent;
  }

  // Lead time adjustment
  if (leadTimeDays >= 0 && leadTimeDays <= 14) {
    const discPct = leadTimeDays <= 7 ? config.lastMinuteDiscount7 : config.lastMinuteDiscount14;
    adjLeadTime = -Math.round(basePrice * discPct / 100);
    const label = leadTimeDays <= 7 ? `Last-minute J+${leadTimeDays} (−${discPct}%)` : `Promo 14j J+${leadTimeDays} (−${discPct}%)`;
    factors.push({ key: 'lead_time_discount', label, value: adjLeadTime, type: 'negative' });
    totalAdjustment += adjLeadTime;
  } else if (leadTimeDays >= 120 && config.farOutMarkupPct > 0) {
    adjLeadTime = Math.round(basePrice * config.farOutMarkupPct / 100);
    factors.push({ key: 'far_out_markup', label: `Réservation anticipée J+${leadTimeDays} (+${config.farOutMarkupPct}%)`, value: adjLeadTime, type: 'positive' });
    totalAdjustment += adjLeadTime;
  }

  // Market signal adjustment
  if (marketSignal && marketSignal.data_confidence >= 40) {
    const pressure = marketSignal.market_pressure_score ?? 50;
    if (pressure > 70) {
      adjMarket = Math.round(basePrice * 0.08);
      factors.push({ key: 'market_pressure', label: `Marché tendu (${Math.round(marketSignal.competitors_unavailable||0)}/${Math.round(marketSignal.competitors_total||0)} concurrents non dispo)`, value: adjMarket, type: 'positive' });
    } else if (pressure < 30) {
      adjMarket = -Math.round(basePrice * 0.05);
      factors.push({ key: 'market_weak', label: `Marché faible (beaucoup de disponibilités)`, value: adjMarket, type: 'negative' });
    }
    totalAdjustment += adjMarket;
  }

  // Gap fill
  if (isGap && gapLength > 0 && gapLength < (config.minStay[seasonType] || 3)) {
    adjGap = -Math.round(basePrice * config.gapFillDiscountPct / 100);
    factors.push({ key: 'gap_fill', label: `Trou invendable (${gapLength} nuit${gapLength > 1 ? 's' : ''}) — réduction pour remplir`, value: adjGap, type: 'negative' });
    totalAdjustment += adjGap;
  }

  // Premium positioning
  if (config.positioning === 'premium' || config.positioning === 'luxury') {
    if (config.premiumPositioningPct > 0) {
      adjPremium = Math.round(basePrice * config.premiumPositioningPct / 100);
      factors.push({ key: 'premium_positioning', label: `Positionnement premium`, value: adjPremium, type: 'positive' });
      totalAdjustment += adjPremium;
    }
  }

  // --- Raw price before clamp ---
  let rawPrice = Math.round(basePrice + totalAdjustment);

  // --- Check override ---
  let finalPrice = rawPrice;
  let overrideApplied = false;
  if (override && override.override_type === 'price' && override.value_cents) {
    finalPrice = override.value_cents / 100;
    overrideApplied = true;
    factors.push({ key: 'manual_override', label: `Override manuel admin`, value: finalPrice - rawPrice, type: 'override' });
  }

  // --- Clamp to min/max (guard-rails — inviolable) ---
  const clampedPrice = Math.round(Math.max(config.priceMin, Math.min(config.priceMax, finalPrice)));
  if (clampedPrice !== finalPrice) {
    factors.push({ key: 'guardrail', label: clampedPrice < finalPrice ? `Garde-fou MAX appliqué (${config.priceMax}€)` : `Garde-fou MIN appliqué (${config.priceMin}€)`, value: clampedPrice - finalPrice, type: 'guardrail' });
  }

  // --- Recommended min stay ---
  const recommendedMinStay = calculateMinStay({ config, seasonType, leadTimeDays, isGap, gapLength, override, marketSignal });

  // --- Confidence score ---
  const confidenceScore = calculateConfidence({ seasonalProfile, marketSignal, leadTimeDays, isGap, holiday, event, override });

  // --- Risk scores ---
  const vacancyRisk = calculateVacancyRisk({ leadTimeDays, isBooked, marketSignal });
  const premiumOpportunity = calculatePremiumOpportunity({ marketSignal, holiday, event, seasonType });

  // --- Alert flags ---
  const alertFlags = [];
  if (vacancyRisk >= 75) alertFlags.push('vacancy_danger');
  else if (vacancyRisk >= 50) alertFlags.push('vacancy_warning');
  if (premiumOpportunity >= 70) alertFlags.push('premium_opportunity');
  if (isGap) alertFlags.push('gap_detected');
  if (overrideApplied) alertFlags.push('manual_override_active');

  // --- Summary ---
  const summaryParts = [
    `${clampedPrice}€ recommandés`,
    seasonType !== 'low' ? `(${SEASONS_LABELS[seasonType]})` : '(basse saison)',
  ];
  if (isWeekend && adjWeekend > 0) summaryParts.push(`+${adjWeekend}€ week-end`);
  if (holiday) summaryParts.push(`+${adjHoliday}€ jour férié`);
  if (event) summaryParts.push(`+${adjEvent}€ ${event.name}`);
  if (adjLeadTime < 0) summaryParts.push(`${adjLeadTime}€ last-minute`);
  if (adjMarket > 0) summaryParts.push(`+${adjMarket}€ marché tendu`);

  const summaryFr = summaryParts.join(' · ');

  // Add final result to factors
  factors.push({ key: 'recommended_total', label: 'Prix recommandé final', value: clampedPrice, type: 'result' });

  return {
    propertyId,
    date,
    recommendedPriceCents: clampedPrice * 100,
    recommendedMinStay,
    basePriceCents: basePrice * 100,
    adjWeekendCents: adjWeekend * 100,
    adjHolidayCents: adjHoliday * 100,
    adjEventCents: adjEvent * 100,
    adjLeadTimeCents: adjLeadTime * 100,
    adjMarketCents: adjMarket * 100,
    adjGapFillCents: adjGap * 100,
    adjPremiumCents: adjPremium * 100,
    confidenceScore,
    vacancyRiskScore: vacancyRisk,
    premiumOpportunity,
    marketPressureScore: marketSignal?.market_pressure_score ?? null,
    seasonType,
    isWeekend,
    isHoliday: !!holiday,
    holidayName: holiday?.name ?? null,
    isEvent: !!event,
    eventName: event?.name ?? null,
    leadTimeDays,
    overrideApplied,
    overridePriceCents: override?.value_cents ?? null,
    overrideMinStay: override?.value_int ?? null,
    alertFlags,
    summaryFr,
    factorsJson: JSON.stringify(factors),
    isBooked,
    isGap,
  };
}

function applyRule(rule, basePrice) {
  if (rule.adjustment_type === 'fixed_cents') return rule.adjustment_value / 100;
  if (rule.adjustment_type === 'percent') return Math.round(basePrice * rule.adjustment_value / 100);
  return 0;
}

function calculateMinStay({ config, seasonType, leadTimeDays, isGap, gapLength, override, marketSignal }) {
  if (override?.override_type === 'min_stay' && override.value_int) return override.value_int;
  if (leadTimeDays <= 7) return config.minStay.last_minute;
  if (isGap && gapLength > 0) return Math.max(1, gapLength);
  const pressure = marketSignal?.market_pressure_score ?? 50;
  const base = config.minStay[seasonType] ?? config.minStay.default;
  if (pressure > 75 && (seasonType === 'high' || seasonType === 'peak')) return Math.min(base + 1, 7);
  return base;
}

function calculateConfidence({ seasonalProfile, marketSignal, leadTimeDays, isGap, holiday, event, override }) {
  let score = 50;
  if (seasonalProfile) score += 15;
  if (marketSignal) {
    if (marketSignal.data_confidence >= 70) score += 20;
    else if (marketSignal.data_confidence >= 40) score += 10;
    else score -= 10;
  } else {
    score -= 15;
  }
  if (leadTimeDays > 30) score += 5;
  if (leadTimeDays > 90) score += 5;
  if (holiday || event) score += 10;
  if (isGap) score -= 10;
  if (override) score += 5; // manual override = high confidence it'll be used
  return Math.max(10, Math.min(100, score));
}

function calculateVacancyRisk({ leadTimeDays, isBooked, marketSignal }) {
  if (isBooked) return 0;
  if (leadTimeDays < 0) return 0; // past
  let risk = 20;
  if (leadTimeDays <= 3) risk = 90;
  else if (leadTimeDays <= 7) risk = 75;
  else if (leadTimeDays <= 14) risk = 60;
  else if (leadTimeDays <= 30) risk = 40;
  // Adjust with market signal
  if (marketSignal) {
    const avail = marketSignal.availability_rate ?? 0.5;
    if (avail < 0.3) risk = Math.max(0, risk - 20); // scarce market = less worry
    else if (avail > 0.7) risk = Math.min(100, risk + 15); // oversupply = more worry
  }
  return Math.round(risk);
}

function calculatePremiumOpportunity({ marketSignal, holiday, event, seasonType }) {
  let score = 0;
  if (seasonType === 'peak') score += 40;
  else if (seasonType === 'high') score += 25;
  if (holiday?.impact_level === 'peak') score += 30;
  else if (holiday?.impact_level === 'high') score += 20;
  if (event?.impact_level === 'peak') score += 30;
  else if (event?.impact_level === 'high') score += 20;
  if (marketSignal?.scarcity_score >= 70) score += 25;
  else if (marketSignal?.scarcity_score >= 50) score += 15;
  return Math.min(100, score);
}

function getSeasonFromDate(date, config) {
  // Fallback if no seasonal profile found — infer from month
  const month = parseInt(date.slice(5, 7));
  const country = config.country;
  if (country === 'MQ') {
    if ([12, 1, 2, 3, 4].includes(month)) return 'high'; // Martinique peak winter
    if ([7, 8, 9].includes(month)) return 'mid'; // Summer
    return 'low';
  } else {
    if ([7, 8].includes(month)) return 'high'; // France summer
    if ([12, 1].includes(month)) return month === 12 ? 'peak' : 'low';
    if ([3, 4, 5, 6, 9, 10, 11].includes(month)) return 'mid';
    return 'low';
  }
}

const SEASONS_LABELS = { low: 'basse saison', mid: 'moyenne saison', high: 'haute saison', peak: 'saison pic' };

/**
 * Batch calculate recommendations for N dates
 */
export function calculateBatch(params) {
  const { propertyId, dates, seasonalProfiles, holidays, events, marketSignals, bookedDates, gaps, overrides, rules, today } = params;

  const bookedSet = new Set(bookedDates || []);
  const overrideMap = {};
  (overrides || []).forEach(o => { overrideMap[o.date] = o; });
  const holidayMap = {};
  (holidays || []).forEach(h => { holidayMap[h.date] = h; });
  const eventMap = {};
  (events || []).forEach(ev => {
    for (let d = new Date(ev.date_start + 'T12:00:00Z'); d <= new Date(ev.date_end + 'T12:00:00Z'); d.setDate(d.getDate() + 1)) {
      const ds = d.toISOString().slice(0, 10);
      eventMap[ds] = ev;
    }
  });
  const signalMap = {};
  (marketSignals || []).forEach(s => { signalMap[s.signal_date] = s; });
  const gapMap = {};
  (gaps || []).forEach(g => { gapMap[g.date] = g; });

  const profilesSorted = [...(seasonalProfiles || [])].sort((a, b) => b.priority - a.priority);

  return dates.map(date => {
    const seasonalProfile = profilesSorted.find(p =>
      p.property_id === propertyId && date >= p.date_start && date <= p.date_end && p.is_active
    ) ?? null;

    return calculateDayPrice({
      propertyId,
      date,
      seasonalProfile,
      holiday: holidayMap[date] ?? null,
      event: eventMap[date] ?? null,
      marketSignal: signalMap[date] ?? null,
      isBooked: bookedSet.has(date),
      isGap: !!(gapMap[date]?.is_gap),
      gapLength: gapMap[date]?.gap_length ?? 0,
      override: overrideMap[date] ?? null,
      activeRules: rules || [],
      today,
    });
  });
}
