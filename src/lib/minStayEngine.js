/**
 * MIN STAY ENGINE
 * Separate from pricing engine for clarity
 * Handles all gap-fill, last-minute, and seasonal min stay logic
 */

/**
 * Calculate optimal min stay for a date
 */
export function calculateMinStayForDate({ config, date, seasonType, leadTimeDays, gaps, marketSignal, override, adjacentBookings }) {
  // 1. Override has absolute priority (respects price_min guard-rail equivalent)
  if (override?.override_type === 'min_stay' && override.value_int) {
    return {
      value: override.value_int,
      reason: 'override_manuel',
      label: 'Override admin',
      confidence: 100,
    };
  }

  // 2. Long-term rental: always 30
  if (config.minStay.default >= 30) {
    return { value: 30, reason: 'long_term', label: 'Location longue durée', confidence: 100 };
  }

  // 3. Gap fill — special case
  const gap = gaps?.find(g => g.date === date && g.is_gap);
  if (gap && gap.gap_length > 0) {
    const gapMin = Math.max(1, gap.gap_length);
    return {
      value: gapMin,
      reason: 'gap_fill',
      label: `Trou de ${gap.gap_length} nuits entre réservations`,
      confidence: 90,
    };
  }

  // 4. Last-minute
  if (leadTimeDays <= 7) {
    return {
      value: config.minStay.last_minute,
      reason: 'last_minute',
      label: `Last-minute J+${leadTimeDays}`,
      confidence: 85,
    };
  }

  // 5. Season-based
  let baseMin = config.minStay[seasonType] ?? config.minStay.default;

  // 6. Market pressure adjustment
  if (marketSignal?.market_pressure_score >= 75 && (seasonType === 'high' || seasonType === 'peak')) {
    baseMin = Math.min(baseMin + 1, 7);
    return {
      value: baseMin,
      reason: 'market_pressure_high',
      label: `Marché tendu en ${seasonType === 'peak' ? 'saison pic' : 'haute saison'} → min stay renforcé`,
      confidence: 70,
    };
  }

  // 7. Weekend bridge detection (long weekend)
  const dowDate = new Date(date + 'T12:00:00Z').getDay();
  if (adjacentBookings?.isLongWeekend) {
    return {
      value: Math.max(baseMin, 3),
      reason: 'long_weekend',
      label: 'Week-end prolongé / pont → min stay renforcé',
      confidence: 75,
    };
  }

  return {
    value: baseMin,
    reason: `season_${seasonType}`,
    label: `Règle saison ${seasonType === 'low' ? 'basse' : seasonType === 'mid' ? 'moyenne' : seasonType === 'high' ? 'haute' : 'pic'}`,
    confidence: 80,
  };
}

/**
 * Find all gaps in an availability calendar
 * A gap is a sequence of free nights shorter than min_stay between two bookings
 */
export function findGaps(availability, minStay) {
  const gaps = [];
  let gapStart = null;
  let gapCount = 0;

  for (let i = 0; i < availability.length; i++) {
    const day = availability[i];
    if (day.is_available && !day.is_blocked) {
      if (!gapStart) { gapStart = day.date; gapCount = 0; }
      gapCount++;
    } else {
      if (gapStart && gapCount < minStay && gapCount > 0) {
        // It's a gap — mark all dates
        for (let j = i - gapCount; j < i; j++) {
          gaps.push({ date: availability[j].date, is_gap: true, gap_length: gapCount });
        }
      }
      gapStart = null;
      gapCount = 0;
    }
  }
  return gaps;
}
