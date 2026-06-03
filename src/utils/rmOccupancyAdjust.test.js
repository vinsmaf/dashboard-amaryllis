import { describe, it, expect } from "vitest";
import { pickRate, occupancyAdjustment } from "./rmOccupancyAdjust.js";

describe("pickRate", () => {
  it("≤30j -> rate30", () => { expect(pickRate(0.5, 0.9, 10)).toBe(0.5); expect(pickRate(0.5, 0.9, 30)).toBe(0.5); });
  it("30-90j -> rate90", () => { expect(pickRate(0.5, 0.9, 31)).toBe(0.9); expect(pickRate(0.5, 0.9, 90)).toBe(0.9); });
  it(">90j -> null", () => { expect(pickRate(0.5, 0.9, 120)).toBe(null); });
  it("rate null -> null", () => { expect(pickRate(null, 0.9, 10)).toBe(null); });
});

describe("occupancyAdjustment — barème", () => {
  const base = 20000; // 200€
  it("≥85% -> +10% premium", () => {
    const r = occupancyAdjustment({ rate30: 0.9, leadTimeDays: 10, basePriceCents: base });
    expect(r.adjCents).toBe(2000); expect(r.premiumDelta).toBe(30); expect(r.vacancyDelta).toBe(-20); expect(r.label).toBe("occ_high");
  });
  it("70-85% -> +5%", () => {
    expect(occupancyAdjustment({ rate30: 0.75, leadTimeDays: 10, basePriceCents: base }).adjCents).toBe(1000);
  });
  it("30-70% -> neutre", () => {
    const r = occupancyAdjustment({ rate30: 0.5, leadTimeDays: 10, basePriceCents: base });
    expect(r.adjCents).toBe(0); expect(r.label).toBe(null);
  });
  it("15-30% -> -7%", () => {
    expect(occupancyAdjustment({ rate30: 0.2, leadTimeDays: 10, basePriceCents: base }).adjCents).toBe(-1400);
  });
  it("≤15% -> -12% + min-stay", () => {
    const r = occupancyAdjustment({ rate30: 0.0, leadTimeDays: 10, basePriceCents: base });
    expect(r.adjCents).toBe(-2400); expect(r.vacancyDelta).toBe(30); expect(r.suggestMinStay).toBe(true); expect(r.label).toBe("occ_very_low");
  });
  it("utilise rate90 pour lead-time 30-90j", () => {
    const r = occupancyAdjustment({ rate30: 0.0, rate90: 0.9, leadTimeDays: 60, basePriceCents: base });
    expect(r.label).toBe("occ_high"); // 90j window
  });
  it("pas de donnée -> 0", () => {
    expect(occupancyAdjustment({ rate30: null, rate90: null, leadTimeDays: 10, basePriceCents: base }).adjCents).toBe(0);
  });
});
