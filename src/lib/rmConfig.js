// Revenue Manager — Master Config & Constants

export const SEASONS = {
  peak: { label: 'Pic', color: '#ef4444', priority: 100 },
  high: { label: 'Haute', color: '#f59e0b', priority: 80 },
  mid:  { label: 'Moyenne', color: '#0ea5e9', priority: 50 },
  low:  { label: 'Basse', color: '#10b981', priority: 10 },
};

export const PROPERTY_CONFIGS = {
  amaryllis: {
    id: 'amaryllis',
    name: 'Villa Amaryllis',
    emoji: '🌴',
    type: 'court',
    capacity: 8,
    location: 'Martinique',
    timezone: 'America/Martinique',
    country: 'MQ',
    basePrices: { low: 300, mid: 400, high: 500, peak: 600 },
    priceMin: 200,
    priceMax: 900,
    minStay: { default: 4, low: 3, mid: 4, high: 5, peak: 5, last_minute: 2 },
    positioning: 'premium',
    weekendUplift: 20, // € fixed
    holidayUpliftPct: 20,
    eventUpliftPct: 25,
    lastMinuteDiscount7: 25, // % max J-0 to J-7
    lastMinuteDiscount14: 15, // % J-8 to J-14
    farOutMarkupPct: 5, // J+120 and beyond
    gapFillDiscountPct: 20,
    premiumPositioningPct: 5,
    confidenceThresholdAutoApply: 70,
  },
  zandoli: {
    id: 'zandoli', name: 'Zandoli', emoji: '🌊', type: 'court', capacity: 6, location: 'Martinique',
    timezone: 'America/Martinique', country: 'MQ',
    basePrices: { low: 150, mid: 220, high: 280, peak: 350 },
    priceMin: 100, priceMax: 500,
    minStay: { default: 3, low: 2, mid: 3, high: 4, peak: 4, last_minute: 2 },
    positioning: 'premium',
    weekendUplift: 15, holidayUpliftPct: 20, eventUpliftPct: 25,
    lastMinuteDiscount7: 25, lastMinuteDiscount14: 15, farOutMarkupPct: 5, gapFillDiscountPct: 20, premiumPositioningPct: 5,
    confidenceThresholdAutoApply: 70,
  },
  geko: {
    id: 'geko', name: 'Geko', emoji: '🦗', type: 'court', capacity: 4, location: 'Martinique',
    timezone: 'America/Martinique', country: 'MQ',
    basePrices: { low: 120, mid: 180, high: 220, peak: 270 },
    priceMin: 80, priceMax: 400,
    minStay: { default: 3, low: 2, mid: 3, high: 4, peak: 4, last_minute: 2 },
    positioning: 'standard',
    weekendUplift: 10, holidayUpliftPct: 15, eventUpliftPct: 20,
    lastMinuteDiscount7: 25, lastMinuteDiscount14: 15, farOutMarkupPct: 5, gapFillDiscountPct: 20, premiumPositioningPct: 0,
    confidenceThresholdAutoApply: 60,
  },
  mabouya: {
    id: 'mabouya', name: 'Mabouya', emoji: '🏠', type: 'court', capacity: 3, location: 'Martinique',
    timezone: 'America/Martinique', country: 'MQ',
    basePrices: { low: 70, mid: 90, high: 110, peak: 140 },
    priceMin: 50, priceMax: 180,
    minStay: { default: 2, low: 2, mid: 2, high: 3, peak: 3, last_minute: 1 },
    positioning: 'standard',
    weekendUplift: 8, holidayUpliftPct: 15, eventUpliftPct: 20,
    lastMinuteDiscount7: 20, lastMinuteDiscount14: 10, farOutMarkupPct: 0, gapFillDiscountPct: 15, premiumPositioningPct: 0,
    confidenceThresholdAutoApply: 60,
  },
  iguana: {
    id: 'iguana', name: 'Villa Iguana', emoji: '🦎', type: 'long', capacity: 4, location: 'Martinique',
    timezone: 'America/Martinique', country: 'MQ',
    basePrices: { low: 600, mid: 600, high: 600, peak: 600 },
    priceMin: 500, priceMax: 750,
    minStay: { default: 30, low: 30, mid: 30, high: 30, peak: 30, last_minute: 30 },
    positioning: 'standard',
    weekendUplift: 0, holidayUpliftPct: 0, eventUpliftPct: 0,
    lastMinuteDiscount7: 0, lastMinuteDiscount14: 0, farOutMarkupPct: 0, gapFillDiscountPct: 0, premiumPositioningPct: 0,
    confidenceThresholdAutoApply: 50,
  },
  schoelcher: {
    id: 'schoelcher', name: 'T2 Schoelcher', emoji: '🏢', type: 'moyen', capacity: 4, location: 'Martinique',
    timezone: 'America/Martinique', country: 'MQ',
    basePrices: { low: 70, mid: 90, high: 110, peak: 140 },
    priceMin: 50, priceMax: 180,
    minStay: { default: 3, low: 2, mid: 3, high: 5, peak: 5, last_minute: 2 },
    positioning: 'standard',
    weekendUplift: 10, holidayUpliftPct: 15, eventUpliftPct: 20,
    lastMinuteDiscount7: 25, lastMinuteDiscount14: 15, farOutMarkupPct: 0, gapFillDiscountPct: 20, premiumPositioningPct: 0,
    confidenceThresholdAutoApply: 60,
  },
  nogent: {
    id: 'nogent', name: 'T2 Nogent', emoji: '🏙️', type: 'court', capacity: 4, location: 'Île-de-France',
    timezone: 'Europe/Paris', country: 'FR',
    basePrices: { low: 80, mid: 100, high: 130, peak: 160 },
    priceMin: 60, priceMax: 220,
    minStay: { default: 1, low: 1, mid: 2, high: 3, peak: 3, last_minute: 1 },
    positioning: 'standard',
    weekendUplift: 15, holidayUpliftPct: 20, eventUpliftPct: 15,
    lastMinuteDiscount7: 20, lastMinuteDiscount14: 10, farOutMarkupPct: 0, gapFillDiscountPct: 15, premiumPositioningPct: 0,
    confidenceThresholdAutoApply: 60,
  },
};

export const CONFIDENCE_THRESHOLDS = {
  auto_apply: 70,
  show_green: 75,
  show_orange: 50,
  show_red: 0,
};

export const ALERT_THRESHOLDS = {
  vacancy_risk_danger: 75,
  vacancy_risk_warning: 50,
  premium_opportunity: 70,
  market_pressure_strong: 70,
  market_pressure_weak: 30,
};
