import { describe, it, expect } from "vitest";
import { diffDays, addDays, nightsBookedInWindow, occupancyForWindow } from "./occupancy.js";

const today = "2026-07-01";
const ev = (bienId, checkin, checkout) => ({ bienId, checkin, checkout });

describe("helpers dates", () => {
  it("diffDays", () => { expect(diffDays("2026-07-01", "2026-07-08")).toBe(7); });
  it("addDays", () => { expect(addDays("2026-07-01", 30)).toBe("2026-07-31"); });
});

describe("nightsBookedInWindow", () => {
  const events = [ev("geko", "2026-07-03", "2026-07-06"), ev("geko", "2026-07-20", "2026-07-25"), ev("zandoli", "2026-07-01", "2026-07-31")];
  it("compte les nuits du bon bien dans la fenêtre", () => {
    expect(nightsBookedInWindow(events, "geko", today, addDays(today, 30))).toBe(3 + 5);
  });
  it("clampe une résa qui dépasse la fenêtre", () => {
    expect(nightsBookedInWindow([ev("geko", "2026-06-28", "2026-07-04")], "geko", today, addDays(today, 30))).toBe(3); // 1,2,3 juil
  });
  it("ignore les autres biens", () => {
    expect(nightsBookedInWindow(events, "geko", today, addDays(today, 30))).not.toBe(31);
  });
});

describe("occupancyForWindow", () => {
  it("taux = nuits vendues / horizon", () => {
    const r = occupancyForWindow([ev("geko", "2026-07-01", "2026-07-16")], "geko", today, 30);
    expect(r.nightsSold).toBe(15); expect(r.nightsAvailable).toBe(30); expect(r.rate).toBeCloseTo(0.5, 5);
  });
  it("vide -> 0", () => {
    expect(occupancyForWindow([], "geko", today, 30)).toEqual({ nightsSold: 0, nightsAvailable: 30, rate: 0 });
  });
  it("cap à 1 si sur-réservé (chevauchements)", () => {
    const r = occupancyForWindow([ev("geko", "2026-07-01", "2026-07-31"), ev("geko", "2026-07-01", "2026-07-31")], "geko", today, 30);
    expect(r.rate).toBe(1);
  });
});
