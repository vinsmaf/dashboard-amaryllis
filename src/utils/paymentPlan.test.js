import { describe, it, expect } from "vitest";
import { depositAmount, balanceAmount, balanceDueDate, isTwoPartEligible } from "./paymentPlan.js";

describe("paymentPlan", () => {
  it("acompte = 30% arrondi à l'euro", () => {
    expect(depositAmount(2000)).toBe(600);
    expect(depositAmount(833)).toBe(250); // 249.9 -> 250
  });
  it("solde = total - acompte (somme exacte = total)", () => {
    expect(balanceAmount(2000)).toBe(1400);
    expect(depositAmount(833) + balanceAmount(833)).toBe(833);
  });
  it("date d'échéance = arrivée - 30 jours (ISO yyyy-mm-dd)", () => {
    expect(balanceDueDate("2026-08-15")).toBe("2026-07-16");
  });
  it("éligible si total >= 800 ET arrivée > 35 jours", () => {
    expect(isTwoPartEligible({ total: 2000, checkin: "2026-08-15", today: "2026-06-11" })).toBe(true);
  });
  it("non éligible si total < 800", () => {
    expect(isTwoPartEligible({ total: 700, checkin: "2026-08-15", today: "2026-06-11" })).toBe(false);
  });
  it("non éligible si arrivée <= 35 jours", () => {
    expect(isTwoPartEligible({ total: 2000, checkin: "2026-07-10", today: "2026-06-11" })).toBe(false);
  });
});
