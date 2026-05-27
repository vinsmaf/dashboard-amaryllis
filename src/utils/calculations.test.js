import { describe, it, expect } from 'vitest'
import {
  sumN, avgN,
  todayStr, addDays, diffDays,
  computeRevenusFromResas,
  computeOccupation, computeADR, computeRevPAR,
  statutBien,
} from './calculations.js'

describe('sumN', () => {
  it('somme les n premières valeurs', () => {
    expect(sumN([1, 2, 3, 4, 5], 3)).toBe(6)
  })
  it('ignore null/undefined', () => {
    expect(sumN([1, null, 3, undefined, 5], 5)).toBe(9)
  })
  it('retourne 0 sur tableau vide ou null', () => {
    expect(sumN([], 5)).toBe(0)
    expect(sumN(null, 5)).toBe(0)
  })
  it('tronque si n > length', () => {
    expect(sumN([1, 2, 3], 99)).toBe(6)
  })
})

describe('avgN', () => {
  it('moyenne des valeurs strictement positives', () => {
    expect(avgN([100, 200, 300], 3)).toBe(200)
  })
  it('exclut les zéros (mois non commercialisés)', () => {
    expect(avgN([100, 0, 0, 200], 4)).toBe(150)
  })
  it('retourne 0 si rien de positif', () => {
    expect(avgN([0, 0, 0], 3)).toBe(0)
    expect(avgN([], 3)).toBe(0)
  })
})

describe('dates', () => {
  it('todayStr est au format YYYY-MM-DD', () => {
    const d = new Date('2026-05-27T14:00:00')
    expect(todayStr(d)).toBe('2026-05-27')
  })
  it('addDays gère les passages de mois', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
  })
  it('addDays gère les nombres négatifs', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('diffDays calcule la différence en jours', () => {
    expect(diffDays('2026-05-01', '2026-05-08')).toBe(7)
  })
  it('diffDays robuste au changement d\'heure été/hiver', () => {
    // Passage à l'heure d'été 2026 (dernier dimanche de mars)
    expect(diffDays('2026-03-28', '2026-04-04')).toBe(7)
  })
})

describe('computeRevenusFromResas', () => {
  const resas = [
    { bienId: 'amaryllis', checkin: '2026-01-15', montant: 1500 },
    { bienId: 'amaryllis', checkin: '2026-01-22', montant: 800 },
    { bienId: 'amaryllis', checkin: '2026-03-10', montant: 2000 },
    { bienId: 'zandoli',   checkin: '2026-01-05', montant: 900 },
    { bienId: 'amaryllis', checkin: '2025-12-30', montant: 5000 }, // mauvaise année → exclu
    { bienId: 'amaryllis', checkin: '2026-04-01', montant: 0 },    // montant 0 → exclu
    { bienId: 'amaryllis', checkin: null,         montant: 100 },  // pas de date → exclu
  ]

  it('agrège par bien et par mois', () => {
    const r = computeRevenusFromResas(resas, 2026)
    expect(r.amaryllis[0]).toBe(2300)   // janvier
    expect(r.amaryllis[2]).toBe(2000)   // mars
    expect(r.zandoli[0]).toBe(900)
  })
  it('filtre par année', () => {
    const r = computeRevenusFromResas(resas, 2025)
    expect(r.amaryllis?.[11]).toBe(5000)
    expect(r.zandoli).toBeUndefined()
  })
  it('arrondit les montants à l\'entier', () => {
    const r = computeRevenusFromResas([
      { bienId: 'x', checkin: '2026-06-01', montant: 123.456 },
    ], 2026)
    expect(r.x[5]).toBe(123)
  })
  it('retourne un objet vide sur tableau vide ou null', () => {
    expect(computeRevenusFromResas([], 2026)).toEqual({})
    expect(computeRevenusFromResas(null, 2026)).toEqual({})
  })
})

describe('computeOccupation', () => {
  it('calcule le taux en %', () => {
    expect(computeOccupation(15, 30)).toBe(50)
  })
  it('retourne 0 si pas de dispo', () => {
    expect(computeOccupation(10, 0)).toBe(0)
    expect(computeOccupation(10, null)).toBe(0)
  })
  it('cap à 100% logique (15/15)', () => {
    expect(computeOccupation(15, 15)).toBe(100)
  })
})

describe('computeADR', () => {
  it('calcule revenu/nuits', () => {
    expect(computeADR(3000, 10)).toBe(300)
  })
  it('retourne 0 si pas de nuits', () => {
    expect(computeADR(1000, 0)).toBe(0)
  })
})

describe('computeRevPAR', () => {
  it('calcule revenu/dispo', () => {
    expect(computeRevPAR(1500, 30)).toBe(50)
  })
  it('cohérent avec ADR × occupation/100', () => {
    const revenu = 5000, dispo = 30, occupees = 20
    const adr = computeADR(revenu, occupees)
    const occ = computeOccupation(occupees, dispo)
    const revpar = computeRevPAR(revenu, dispo)
    expect(revpar).toBeCloseTo(adr * (occ / 100), 5)
  })
  it('retourne 0 si pas de dispo', () => {
    expect(computeRevPAR(1000, 0)).toBe(0)
  })
})

describe('statutBien (replique App.jsx 1:1)', () => {
  // N (mois courant) est dynamique — on construit des tableaux remplis sur 12 mois
  // pour que sumN/avgN voient des valeurs significatives quelle que soit N.
  const fill = (val) => new Array(12).fill(val)
  const make = ({ cf = 0, occ = 0, rev = 0 } = {}) => ({
    cashflow: fill(cf),
    occ:      fill(occ),
    revenus:  fill(rev),
  })

  it('green si cashflow > 0 ET occupation > 50%', () => {
    expect(statutBien(make({ cf: 100, occ: 60, rev: 1000 }))).toBe('green')
  })
  it('yellow si cashflow > 0 mais occupation faible', () => {
    expect(statutBien(make({ cf: 100, occ: 30, rev: 1000 }))).toBe('yellow')
  })
  it('red si cashflow < -500', () => {
    expect(statutBien(make({ cf: -600, occ: 80, rev: 1000 }))).toBe('red')
  })
  it('red si revenus YTD nuls (cf = 0)', () => {
    expect(statutBien(make({ cf: 0, occ: 80, rev: 0 }))).toBe('red')
  })
  it('yellow par défaut (zone tampon)', () => {
    // cf cumulé doit être > -500 ET revenus > 0 → yellow
    // valeurs par mois faibles pour rester sous le seuil quel que soit N
    expect(statutBien(make({ cf: -20, occ: 30, rev: 50 }))).toBe('yellow')
  })
  it('robuste face à bien null/undefined fields', () => {
    expect(statutBien({})).toBe('red')           // ytd = 0 → red
    expect(statutBien({ cashflow: null })).toBe('red')
  })
})
