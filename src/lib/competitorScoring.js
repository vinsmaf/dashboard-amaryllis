/**
 * COMPETITOR SCORING ENGINE
 * Calculates similarity scores between a reference property and competitors
 * Aggregates competitor snapshots into market signals
 */

/**
 * Calculate similarity score (0-100) between a property and a competitor
 */
export function calculateSimilarityScore(reference, competitor) {
  const weights = {
    area:      25, // Same geographic area (most important)
    capacity:  20, // Similar guest capacity
    pool:      20, // Pool (key differentiator in Martinique)
    sea_view:  15, // Sea view
    bedrooms:  10, // Number of bedrooms
    standing:   5, // Similar standing/positioning
    bathrooms:  3, // Bathrooms
    ac:         2, // AC (near-standard in Martinique)
  };

  let score = 0;

  // Area match (0-25)
  if (competitor.area && reference.location) {
    const compArea = (competitor.area || '').toLowerCase();
    const refLoc = (reference.location || '').toLowerCase();
    // Same commune
    if (compArea.includes(refLoc.split(',')[0].toLowerCase()) || refLoc.includes(compArea)) {
      score += 25;
    } else if (distanceSimilarity(reference.latitude, reference.longitude, competitor.latitude, competitor.longitude) < 5) {
      score += 20; // < 5km
    } else if (distanceSimilarity(reference.latitude, reference.longitude, competitor.latitude, competitor.longitude) < 15) {
      score += 12; // < 15km, same region
    } else {
      score += 5; // Same island/region
    }
  }

  // Capacity (0-20)
  if (competitor.capacity && reference.capacity) {
    const diff = Math.abs(competitor.capacity - reference.capacity);
    if (diff === 0) score += 20;
    else if (diff === 1) score += 16;
    else if (diff === 2) score += 10;
    else if (diff <= 4) score += 5;
  }

  // Pool (0-20)
  if (reference.has_pool) {
    score += competitor.has_pool ? 20 : 0;
  } else {
    score += competitor.has_pool ? 0 : 20; // Both without pool = similar
  }

  // Sea view (0-15)
  if (reference.has_sea_view) {
    score += competitor.has_sea_view ? 15 : 0;
  } else {
    score += competitor.has_sea_view ? 0 : 15;
  }

  // Bedrooms (0-10)
  if (competitor.bedrooms && reference.bedrooms) {
    const diff = Math.abs(competitor.bedrooms - reference.bedrooms);
    if (diff === 0) score += 10;
    else if (diff === 1) score += 6;
    else if (diff === 2) score += 3;
  }

  // Standing (0-5)
  if (competitor.standing_estimated && reference.positioning) {
    const standingMap = { budget: 1, standard: 2, premium: 3, luxury: 4 };
    const refS = standingMap[reference.positioning] || 2;
    const compS = standingMap[competitor.standing_estimated] || 2;
    const diff = Math.abs(refS - compS);
    if (diff === 0) score += 5;
    else if (diff === 1) score += 3;
  }

  // Bathrooms (0-3)
  if (competitor.bathrooms && reference.bathrooms) {
    score += Math.abs(competitor.bathrooms - reference.bathrooms) === 0 ? 3 : 1;
  }

  // AC (0-2) — near-standard in Martinique
  if (competitor.has_ac) score += 2;

  return Math.min(100, Math.round(score));
}

function distanceSimilarity(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Calculate market signals from competitor snapshots for a given date
 * @param {Object} params
 * @param {Array} params.snapshots - [{price_cents, is_available, confidence}]
 * @param {Array} params.listings - [{similarity_score, ...}]
 * @param {number} params.minSimilarityScore
 * @returns {Object} market signal
 */
export function calculateMarketSignal({ snapshots, listings, minSimilarityScore = 40 }) {
  if (!snapshots || snapshots.length === 0) {
    return {
      competitors_total: listings?.length || 0,
      competitors_with_data: 0,
      competitors_available: 0,
      competitors_unavailable: 0,
      availability_rate: null,
      price_median_cents: null,
      price_mean_cents: null,
      price_p25_cents: null,
      price_p75_cents: null,
      price_min_cents: null,
      price_max_cents: null,
      high_sim_price_median: null,
      market_pressure_score: null,
      scarcity_score: null,
      premium_opportunity: null,
      vacancy_risk: null,
      data_confidence: 0,
      market_label: 'insufficient_data',
      alert_flags: [],
    };
  }

  const listingMap = {};
  (listings || []).forEach(l => { listingMap[l.id] = l; });

  // Filter to qualified snapshots (min similarity)
  const qualified = snapshots.filter(s => {
    const listing = listingMap[s.listing_id];
    return listing && listing.similarity_score >= minSimilarityScore && listing.is_active;
  });

  const withPrice = qualified.filter(s => s.price_cents && s.price_cents > 0 && s.is_available !== 0);
  const available = qualified.filter(s => s.is_available === 1);
  const unavailable = qualified.filter(s => s.is_available === 0);

  const prices = withPrice.map(s => s.price_cents).sort((a, b) => a - b);
  const highSim = snapshots.filter(s => {
    const l = listingMap[s.listing_id];
    return l && l.similarity_score >= 65 && s.price_cents > 0 && s.is_available !== 0;
  }).map(s => s.price_cents).sort((a, b) => a - b);

  const availabilityRate = qualified.length > 0 ? available.length / qualified.length : null;
  const pressureScore = availabilityRate !== null ? Math.round((1 - availabilityRate) * 100) : null;
  const scarcityScore = availabilityRate !== null
    ? availabilityRate < 0.3 ? 90 : availabilityRate < 0.5 ? 70 : availabilityRate < 0.7 ? 50 : 20
    : null;
  const dataConfidence = listings?.length > 0
    ? Math.round(Math.min(100, (qualified.length / Math.max(listings.length, 1)) * 100))
    : 0;

  const marketLabel = pressureScore === null ? 'insufficient_data'
    : pressureScore > 70 ? 'strong'
    : pressureScore > 40 ? 'balanced'
    : 'weak';

  const alerts = [];
  if (pressureScore > 70) alerts.push('high_demand');
  if (availabilityRate !== null && availabilityRate > 0.7) alerts.push('oversupply');
  if (prices.length > 0 && scarcityScore >= 70) alerts.push('premium_opportunity');

  return {
    competitors_total: listings?.length || 0,
    competitors_with_data: qualified.length,
    competitors_available: available.length,
    competitors_unavailable: unavailable.length,
    availability_rate: availabilityRate,
    occupancy_rate_apparent: availabilityRate !== null ? 1 - availabilityRate : null,
    price_median_cents: median(prices),
    price_mean_cents: prices.length ? Math.round(prices.reduce((s, v) => s + v, 0) / prices.length) : null,
    price_p25_cents: percentile(prices, 25),
    price_p75_cents: percentile(prices, 75),
    price_min_cents: prices[0] ?? null,
    price_max_cents: prices[prices.length - 1] ?? null,
    price_spread_cents: prices.length > 1 ? (percentile(prices, 75) - percentile(prices, 25)) : null,
    high_sim_count: highSim.length,
    high_sim_price_median: median(highSim),
    market_pressure_score: pressureScore,
    scarcity_score: scarcityScore,
    premium_opportunity: scarcityScore !== null ? Math.max(0, scarcityScore - 10) : null,
    vacancy_risk: availabilityRate !== null ? (availabilityRate > 0.7 ? 70 : availabilityRate > 0.5 ? 40 : 15) : null,
    data_confidence: dataConfidence,
    market_label: marketLabel,
    alert_flags: JSON.stringify(alerts),
  };
}

function median(arr) {
  if (!arr || arr.length === 0) return null;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : Math.round((arr[mid - 1] + arr[mid]) / 2);
}

function percentile(arr, pct) {
  if (!arr || arr.length === 0) return null;
  const idx = Math.ceil((pct / 100) * arr.length) - 1;
  return arr[Math.max(0, Math.min(arr.length - 1, idx))];
}

/**
 * Interpret competitor positioning for a specific date
 */
export function interpretCompetitorPosition(ourPrice, marketSignal) {
  if (!marketSignal || !marketSignal.price_median_cents || !ourPrice) {
    return { label: 'Non comparable', color: '#64748b', pct: null };
  }
  const ourCents = ourPrice * 100;
  const median = marketSignal.price_median_cents;
  const pctVsMedian = Math.round((ourCents - median) / median * 100);

  let label, color;
  if (pctVsMedian > 25) { label = `+${pctVsMedian}% vs marché (premium fort)`; color = '#a855f7'; }
  else if (pctVsMedian > 10) { label = `+${pctVsMedian}% vs marché (premium)`; color = '#10b981'; }
  else if (pctVsMedian > -10) { label = `Dans le marché (${pctVsMedian >= 0 ? '+' : ''}${pctVsMedian}%)`; color = '#0ea5e9'; }
  else if (pctVsMedian > -25) { label = `${pctVsMedian}% vs marché (sous le marché)`; color = '#f59e0b'; }
  else { label = `${pctVsMedian}% vs marché (très bas)`; color = '#ef4444'; }

  return { label, color, pctVsMedian };
}
