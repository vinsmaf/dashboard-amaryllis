import { describe, it, expect } from "vitest";
import { conversionRate, detectConversionDrop } from "./conversionDrift.js";

describe("conversionRate", () => {
  it("calcule purchase/viewItem", () => {
    expect(conversionRate(10, 100)).toBeCloseTo(0.1);
  });
  it("retourne null si viewItem = 0", () => {
    expect(conversionRate(0, 0)).toBeNull();
  });
});

describe("detectConversionDrop", () => {
  it("détecte une baisse > 30%", () => {
    const current = { viewItem: 200, purchase: 5 };   // 2.5%
    const previous = { viewItem: 200, purchase: 10 }; // 5%
    const res = detectConversionDrop(current, previous);
    expect(res).not.toBeNull();
    expect(res.dropPct).toBeLessThanOrEqual(-30);
  });

  it("ignore une baisse < 30%", () => {
    const current = { viewItem: 200, purchase: 9 };
    const previous = { viewItem: 200, purchase: 10 };
    expect(detectConversionDrop(current, previous)).toBeNull();
  });

  it("ignore si volume insuffisant (anti-bruit)", () => {
    const current = { viewItem: 5, purchase: 0 };
    const previous = { viewItem: 5, purchase: 2 };
    expect(detectConversionDrop(current, previous)).toBeNull();
  });

  it("retourne null si pas de snapshot précédent", () => {
    expect(detectConversionDrop({ viewItem: 100, purchase: 5 }, null)).toBeNull();
  });

  it("retourne null si previousRate = 0 (division par zéro évitée)", () => {
    const current = { viewItem: 100, purchase: 5 };
    const previous = { viewItem: 100, purchase: 0 };
    expect(detectConversionDrop(current, previous)).toBeNull();
  });

  it("seuil personnalisable", () => {
    const current = { viewItem: 100, purchase: 9 };
    const previous = { viewItem: 100, purchase: 10 };
    expect(detectConversionDrop(current, previous, { dropThreshold: 0.05 })).not.toBeNull();
  });
});
