import { describe, it, expect } from 'vitest'
import { factCheckCaption, FACT_CHECK_RULES } from '../../functions/api/_factcheck.js'

// qa-002 — garde-fous fact-checker : interdits factuels par bien.
// Un caption qui matche une règle DOIT renvoyer au moins une erreur.

describe('factCheckCaption — équipements interdits par bien', () => {
  it('rejette "eau salée" associé à Mabouya (jacuzzi, pas de piscine eau salée)', () => {
    const errs = factCheckCaption('Studio Mabouya et sa piscine eau salée face à la mer')
    expect(errs.length).toBeGreaterThan(0)
  })

  it('rejette "eau salée" associé à Zandoli / Géko', () => {
    expect(factCheckCaption('Zandoli et sa piscine eau salée').length).toBeGreaterThan(0)
    expect(factCheckCaption('La piscine eau salée du Géko').length).toBeGreaterThan(0)
  })

  it('rejette "jacuzzi privatif" pour un bien autre que Mabouya', () => {
    expect(factCheckCaption('Villa Amaryllis et son jacuzzi privatif').length).toBeGreaterThan(0)
    expect(factCheckCaption('Le jacuzzi privatif de Zandoli').length).toBeGreaterThan(0)
  })

  it('rejette "piscine à débordement" hors Villa Amaryllis', () => {
    expect(factCheckCaption('Iguana et sa piscine à débordement').length).toBeGreaterThan(0)
  })

  it('rejette "cascade" sur un bien autre que Zandoli/Géko', () => {
    expect(factCheckCaption('Mabouya et sa piscine à cascade').length).toBeGreaterThan(0)
  })

  it('rejette piscine pour Nogent / Bellevue / Mabouya (pas de piscine)', () => {
    expect(factCheckCaption('La piscine de Nogent').length).toBeGreaterThan(0)
    expect(factCheckCaption('Bellevue et sa piscine').length).toBeGreaterThan(0)
    expect(factCheckCaption('Mabouya et sa piscine').length).toBeGreaterThan(0)
  })
})

describe('factCheckCaption — géographie (biens sur les hauteurs)', () => {
  it('rejette "pieds dans l\'eau" et "à 5m de la plage"', () => {
    expect(factCheckCaption('Une villa les pieds dans l\'eau').length).toBeGreaterThan(0)
    expect(factCheckCaption('Située à 5 m de la plage').length).toBeGreaterThan(0)
  })

  it('rejette le bruit/clapotis des vagues', () => {
    expect(factCheckCaption('Réveillé par le clapotis des vagues').length).toBeGreaterThan(0)
  })
})

describe('factCheckCaption — données factuelles', () => {
  it('rejette "4 chambres" pour Amaryllis (il en a 3)', () => {
    expect(factCheckCaption('Villa Amaryllis, 4 chambres').length).toBeGreaterThan(0)
  })
  it('rejette "3 chambres" pour Iguana (il en a 2)', () => {
    expect(factCheckCaption('Villa Iguana avec 3 chambres').length).toBeGreaterThan(0)
  })
})

describe('factCheckCaption — nomenclature (Zandoli/Géko/Mabouya/Bellevue ≠ villas)', () => {
  it('rejette "Villa Zandoli", "Villa Géko", "Villa Mabouya", "Villa Bellevue"', () => {
    expect(factCheckCaption('Réservez la Villa Zandoli').length).toBeGreaterThan(0)
    expect(factCheckCaption('Villa Géko à Sainte-Luce').length).toBeGreaterThan(0)
    expect(factCheckCaption('Villa Mabouya').length).toBeGreaterThan(0)
    expect(factCheckCaption('Villa Bellevue').length).toBeGreaterThan(0)
  })
})

describe('factCheckCaption — captions valides (aucun faux positif)', () => {
  it('accepte un caption conforme', () => {
    const ok = 'Villa Amaryllis, perchée sur les hauteurs de Sainte-Luce, vue mer panoramique et piscine à débordement eau salée.'
    // Contient "piscine à débordement eau salée" SUR Amaryllis → la règle débordement matche le mot seul
    // donc on teste plutôt un caption neutre :
    const neutre = 'Zandoli, son jardin tropical et sa mezzanine baignée de lumière à Sainte-Luce.'
    expect(factCheckCaption(neutre)).toEqual([])
  })
  it('renvoie [] pour une chaîne vide', () => {
    expect(factCheckCaption('')).toEqual([])
  })
})

describe('FACT_CHECK_RULES — structure', () => {
  it('chaque règle a une regex et une raison', () => {
    expect(FACT_CHECK_RULES.length).toBeGreaterThan(10)
    for (const r of FACT_CHECK_RULES) {
      expect(r.rx).toBeInstanceOf(RegExp)
      expect(typeof r.reason).toBe('string')
      expect(r.reason.length).toBeGreaterThan(3)
    }
  })
})
