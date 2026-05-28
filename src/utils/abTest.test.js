import { describe, it, expect, beforeEach, vi } from "vitest";
import { getVariant, forceVariant, resetVariant, listActiveVariants } from "./abTest.js";

// Setup minimal document.cookie pour jsdom
beforeEach(() => {
  // Reset all cookies
  document.cookie.split(";").forEach(c => {
    const name = c.split("=")[0].trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
  // Stub gtag pour qu'il ne plante pas
  window.gtag = vi.fn();
});

describe("abTest — getVariant", () => {
  it("retourne 'A' ou 'B'", () => {
    const v = getVariant("test_simple");
    expect(["A", "B"]).toContain(v);
  });

  it("est stable sur plusieurs appels (même cookie)", () => {
    const v1 = getVariant("test_stable");
    const v2 = getVariant("test_stable");
    const v3 = getVariant("test_stable");
    expect(v1).toBe(v2);
    expect(v2).toBe(v3);
  });

  it("envoie un event GA4 ab_variant_assigned à la 1ère assignation", () => {
    getVariant("test_event");
    expect(window.gtag).toHaveBeenCalledWith("event", "ab_variant_assigned", expect.objectContaining({
      test_name: "test_event",
      ab_variant: expect.stringMatching(/^[AB]$/),
    }));
  });

  it("n'envoie PAS d'event GA4 si la variante est déjà assignée", () => {
    getVariant("test_no_dup");
    window.gtag.mockClear();
    getVariant("test_no_dup");
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("isole les tests entre eux", () => {
    forceVariant("test_x", "A");
    forceVariant("test_y", "B");
    expect(getVariant("test_x")).toBe("A");
    expect(getVariant("test_y")).toBe("B");
  });
});

describe("abTest — forceVariant / resetVariant", () => {
  it("forceVariant écrit la variante exacte", () => {
    forceVariant("test_force", "B");
    expect(getVariant("test_force")).toBe("B");
  });

  it("forceVariant ignore les valeurs invalides", () => {
    forceVariant("test_invalid", "Z");
    const v = getVariant("test_invalid"); // sera assigné aléatoirement
    expect(["A", "B"]).toContain(v);
  });

  it("resetVariant supprime le cookie", () => {
    forceVariant("test_reset", "A");
    resetVariant("test_reset");
    // Nouvelle assignation après reset
    window.gtag.mockClear();
    getVariant("test_reset");
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });
});

describe("abTest — listActiveVariants", () => {
  it("liste les tests actifs", () => {
    forceVariant("test_a", "A");
    forceVariant("test_b", "B");
    const list = listActiveVariants();
    expect(list.test_a).toBe("A");
    expect(list.test_b).toBe("B");
  });
});

describe("abTest — distribution 50/50 (échantillon)", () => {
  it("distribue ~50/50 sur 200 assignations indépendantes", () => {
    let aCount = 0, bCount = 0;
    for (let i = 0; i < 200; i++) {
      resetVariant(`dist_${i}`);
      const v = getVariant(`dist_${i}`);
      if (v === "A") aCount++; else bCount++;
    }
    // tolérance large : ±25% sur 200 tirages
    expect(aCount).toBeGreaterThan(75);
    expect(bCount).toBeGreaterThan(75);
  });
});
