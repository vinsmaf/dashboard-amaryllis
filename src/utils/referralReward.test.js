import { describe, it, expect } from "vitest";
import { REFERRAL_FILLEUL_REWARD, REFERRAL_PARRAIN_REWARD, referralNote } from "./referralReward.js";

describe("barème parrainage", () => {
  it("filleul : -10% valable 60 jours", () => {
    expect(REFERRAL_FILLEUL_REWARD).toEqual({ type: "percent", value: 10, validityDays: 60 });
  });
  it("parrain : 100€ créditée valable 90 jours", () => {
    expect(REFERRAL_PARRAIN_REWARD).toEqual({ type: "amount_eur", value: 100, validityDays: 90 });
  });
});

describe("referralNote", () => {
  it("note distincte filleul vs parrain", () => {
    expect(referralNote("filleul", "Jean Dupont")).toBe("Parrainage — code filleul (parrain: Jean Dupont)");
    expect(referralNote("parrain", "Jean Dupont")).toBe("Parrainage — récompense parrain (Jean Dupont)");
  });
});
