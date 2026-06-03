import { describe, it, expect } from "vitest";
import { getDiscount, discountLabel, computeStayTotal } from "./pricing.js";

describe("getDiscount — bornes", () => {
  it("0% sous 7 nuits", () => { expect(getDiscount(1)).toBe(0); expect(getDiscount(6)).toBe(0); });
  it("5% à 7 nuits", () => { expect(getDiscount(7)).toBe(0.05); expect(getDiscount(13)).toBe(0.05); });
  it("10% à 14 nuits", () => { expect(getDiscount(14)).toBe(0.10); expect(getDiscount(27)).toBe(0.10); });
  it("15% à 28 nuits", () => { expect(getDiscount(28)).toBe(0.15); expect(getDiscount(60)).toBe(0.15); });
});

describe("discountLabel", () => {
  it("semaine / 2 semaines / mensuel", () => {
    expect(discountLabel(6)).toBe("semaine");
    expect(discountLabel(14)).toBe("2 semaines");
    expect(discountLabel(28)).toBe("mensuel");
  });
});

describe("computeStayTotal", () => {
  it("0 nuit -> tout à 0", () => {
    expect(computeStayTotal([], 60)).toEqual({ nights: 0, rawTotal: 0, discountRate: 0, discountAmt: 0, total: 0 });
  });
  it("3 nuits à 100 sans remise + ménage 60", () => {
    const r = computeStayTotal([100, 100, 100], 60);
    expect(r.rawTotal).toBe(300); expect(r.discountRate).toBe(0); expect(r.total).toBe(360);
  });
  it("7 nuits à 200 -> -5% arrondi + ménage", () => {
    const r = computeStayTotal(Array(7).fill(200), 50);
    expect(r.rawTotal).toBe(1400); expect(r.discountRate).toBe(0.05);
    expect(r.discountAmt).toBe(70); expect(r.total).toBe(1400 - 70 + 50);
  });
  it("prix nuitées variables (Beds24)", () => {
    const r = computeStayTotal([180, 220, 200], 0);
    expect(r.rawTotal).toBe(600); expect(r.total).toBe(600);
  });
  it("arrondi de la remise (banker-free, Math.round)", () => {
    const r = computeStayTotal(Array(14).fill(111), 0); // 1554 * 0.10 = 155.4 -> 155
    expect(r.discountAmt).toBe(155); expect(r.total).toBe(1554 - 155);
  });
});
