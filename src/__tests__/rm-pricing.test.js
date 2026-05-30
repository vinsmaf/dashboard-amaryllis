import { describe, it, expect } from 'vitest'
import {
  findSeasonalProfile,
  getBasePrice,
  getMinStay,
  percentile,
  calcDateReco,
} from '../../functions/api/rm-recommendations/[[path]].js'

// qa-001 — moteur de pricing Revenue Manager (fonctions pures).
// Prix en centimes.

const PROPERTY = {
  id: 'amaryllis',
  base_price_high: 28000, base_price_mid: 22000, base_price_low: 18000,
  min_stay_high: 4, min_stay_mid: 3, min_stay_low: 2, min_stay_default: 3,
  price_min: 10000, price_max: 50000,
}

describe('getBasePrice', () => {
  it('peak et high → base_price_high', () => {
    expect(getBasePrice(PROPERTY, 'peak')).toBe(28000)
    expect(getBasePrice(PROPERTY, 'high')).toBe(28000)
  })
  it('mid → base_price_mid, low → base_price_low', () => {
    expect(getBasePrice(PROPERTY, 'mid')).toBe(22000)
    expect(getBasePrice(PROPERTY, 'low')).toBe(18000)
  })
  it('type inconnu → mid', () => {
    expect(getBasePrice(PROPERTY, 'wtf')).toBe(22000)
  })
})

describe('getMinStay', () => {
  it('high → min_stay_high, mid → mid, low → low', () => {
    expect(getMinStay(PROPERTY, 'high')).toBe(4)
    expect(getMinStay(PROPERTY, 'mid')).toBe(3)
    expect(getMinStay(PROPERTY, 'low')).toBe(2)
  })
  it('inconnu → min_stay_default', () => {
    expect(getMinStay(PROPERTY, 'xxx')).toBe(3)
  })
})

describe('percentile', () => {
  const s = [10, 20, 30, 40, 50]
  it('p0 → min, p100 → max, p50 → médiane', () => {
    expect(percentile(s, 0)).toBe(10)
    expect(percentile(s, 100)).toBe(50)
    expect(percentile(s, 50)).toBe(30)
  })
  it('interpolation p25', () => {
    expect(percentile(s, 25)).toBe(20)
  })
  it('tableau vide → 0', () => {
    expect(percentile([], 50)).toBe(0)
  })
})

describe('findSeasonalProfile', () => {
  const profiles = [
    { is_active: 1, date_start: '2026-06-01', date_end: '2026-06-30', season_type: 'high', priority: 1 },
    { is_active: 1, date_start: '2026-06-05', date_end: '2026-06-10', season_type: 'peak', priority: 5 },
    { is_active: 0, date_start: '2026-06-01', date_end: '2026-06-30', season_type: 'low', priority: 10 },
  ]
  it('retourne le profil actif de plus haute priorité couvrant la date', () => {
    expect(findSeasonalProfile(profiles, '2026-06-07').season_type).toBe('peak')
  })
  it('hors de la fenêtre peak → high', () => {
    expect(findSeasonalProfile(profiles, '2026-06-20').season_type).toBe('high')
  })
  it('ignore les profils inactifs', () => {
    // le profil low (priority 10) est inactif → jamais retourné
    expect(findSeasonalProfile(profiles, '2026-06-07').season_type).not.toBe('low')
  })
  it('aucune correspondance → null', () => {
    expect(findSeasonalProfile(profiles, '2026-12-25')).toBeNull()
  })
})

describe('calcDateReco', () => {
  const baseArgs = {
    property: PROPERTY,
    profiles: [{ is_active: 1, date_start: '2026-06-01', date_end: '2026-06-30', season_type: 'high', priority: 1 }],
    rules: [],
    overridesMap: {},
    holidayMap: {},
    eventsForDate: [],
    signalMap: {},
    today: '2026-05-30',
  }

  it('jour de semaine, haute saison, sans règle → prix = base_price_high', () => {
    const r = calcDateReco({ ...baseArgs, dateStr: '2026-06-03' }) // mercredi
    expect(r.base_price_cents).toBe(28000)
    expect(r.recommended_price_cents).toBe(28000)
    expect(r.adj_weekend_cents).toBe(0)
    expect(r.recommended_min_stay).toBe(4)
  })

  it('week-end + règle weekend_uplift +10% → ajustement appliqué', () => {
    const rules = [{
      is_active: 1, property_id: null, rule_type: 'weekend_uplift',
      adjustment_type: 'percent', adjustment_value: 10,
      condition_season: null, condition_dow: '5,6',
      condition_lead_time_min: null, condition_lead_time_max: null,
      priority: 1, valid_from: null, valid_until: null, max_adjustment_cents: null, name: 'WE +10%',
    }]
    const r = calcDateReco({ ...baseArgs, rules, dateStr: '2026-06-06' }) // samedi
    expect(r.adj_weekend_cents).toBe(2800) // 10% de 28000
    expect(r.recommended_price_cents).toBe(30800)
  })

  it('override prix gagne sur le calcul', () => {
    const overridesMap = { '2026-06-03': { override_type: 'price', is_active: true, value_cents: 33000, reason: 'manuel' } }
    const r = calcDateReco({ ...baseArgs, overridesMap, dateStr: '2026-06-03' })
    expect(r.recommended_price_cents).toBe(33000)
  })

  it('clamp au price_max', () => {
    const prop = { ...PROPERTY, price_max: 29000 }
    const rules = [{
      is_active: 1, property_id: null, rule_type: 'weekend_uplift',
      adjustment_type: 'percent', adjustment_value: 10, condition_dow: '5,6',
      condition_season: null, condition_lead_time_min: null, condition_lead_time_max: null,
      priority: 1, valid_from: null, valid_until: null, max_adjustment_cents: null, name: 'WE',
    }]
    const r = calcDateReco({ ...baseArgs, property: prop, rules, dateStr: '2026-06-06' })
    expect(r.recommended_price_cents).toBe(29000) // 30800 plafonné à 29000
  })
})
