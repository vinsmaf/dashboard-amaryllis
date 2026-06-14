import { describe, it, expect } from "vitest";
import { lowAmountInfo, nightsBetween } from "../priceGuard.js";

// Amaryllis = 280€/nuit base. 7 nuits → réf 1960€. Seuil full = 20% = 392€.
describe("priceGuard — lowAmountInfo (alerte montant bas, jamais bloquant)", () => {
  const base = { bienId: "amaryllis", checkin: "2026-08-15", checkout: "2026-08-22" }; // 7 nuits

  it("ne flague PAS un paiement normal (saison haute, prix > base)", () => {
    // 7 nuits à ~409€ + ménage = 2897€ — bien au-dessus de la réf 1960€
    expect(lowAmountInfo({ ...base, amountEur: 2897 }).low).toBe(false);
  });

  it("ne flague PAS un paiement au prix de base", () => {
    expect(lowAmountInfo({ ...base, amountEur: 1960 }).low).toBe(false);
  });

  it("ne flague PAS une grosse remise/promo réaliste (−50%)", () => {
    // ~50% de la réf reste au-dessus du seuil 20%
    expect(lowAmountInfo({ ...base, amountEur: 980 }).low).toBe(false);
  });

  it("FLAGUE un montant grossièrement anormal (payer 50€ pour 7 nuits)", () => {
    const r = lowAmountInfo({ ...base, amountEur: 50 });
    expect(r.low).toBe(true);
    expect(r.refEur).toBe(1960);
    expect(r.nights).toBe(7);
  });

  it("FLAGUE 1€ (exploit montant trafiqué)", () => {
    expect(lowAmountInfo({ ...base, amountEur: 1 }).low).toBe(true);
  });

  it("2× : compare l'acompte (seuil 6%) — acompte normal ~30% non flagué", () => {
    // acompte 30% de ~2897 = 869€ ; seuil 2x = 6% de 1960 = 117,6€
    expect(lowAmountInfo({ ...base, amountEur: 869, payPlan: "2x" }).low).toBe(false);
  });

  it("2× : FLAGUE un acompte trafiqué (1€)", () => {
    expect(lowAmountInfo({ ...base, amountEur: 1, payPlan: "2x" }).low).toBe(true);
  });

  it("fail-safe : bien inconnu (groupe) → jamais d'alerte", () => {
    expect(lowAmountInfo({ bienId: "groupe", checkin: "2026-08-15", checkout: "2026-08-22", amountEur: 1 }).low).toBe(false);
  });

  it("fail-safe : dates manquantes → jamais d'alerte", () => {
    expect(lowAmountInfo({ bienId: "amaryllis", checkin: "", checkout: "", amountEur: 1 }).low).toBe(false);
  });

  it("fail-safe : montant 0/absent → jamais d'alerte", () => {
    expect(lowAmountInfo({ ...base, amountEur: 0 }).low).toBe(false);
  });

  it("nightsBetween calcule le nombre de nuits", () => {
    expect(nightsBetween("2026-08-15", "2026-08-22")).toBe(7);
    expect(nightsBetween("", "2026-08-22")).toBe(0);
  });
});
