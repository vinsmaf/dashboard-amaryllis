import { describe, it, expect } from "vitest";
import { computeTier, parseBiensField, TIER_DEFS } from "./loyaltyTiers.js";

describe("parseBiensField", () => {
  it("parse un JSON string standard", () => {
    expect(parseBiensField('["nogent","geko"]')).toEqual(["nogent", "geko"]);
  });
  it("gère un array déjà parsé", () => {
    expect(parseBiensField(["amaryllis"])).toEqual(["amaryllis"]);
  });
  it("retourne [] si absent", () => {
    expect(parseBiensField(null)).toEqual([]);
    expect(parseBiensField(undefined)).toEqual([]);
    expect(parseBiensField("")).toEqual([]);
  });
  it("fallback CSV si pas du JSON valide", () => {
    expect(parseBiensField("nogent, geko")).toEqual(["nogent", "geko"]);
  });
});

describe("computeTier", () => {
  it("retourne null si 0 séjour", () => {
    expect(computeTier({ nb_sejours: 0, biens: '["nogent"]' })).toBeNull();
  });
  it("Bronze dès 1 séjour", () => {
    const t = computeTier({ nb_sejours: 1, biens: '["nogent"]' });
    expect(t.id).toBe("bronze");
  });
  it("Argent dès 2 séjours", () => {
    const t = computeTier({ nb_sejours: 2, biens: '["geko"]' });
    expect(t.id).toBe("argent");
  });
  it("Or dès 3 séjours", () => {
    const t = computeTier({ nb_sejours: 3, biens: '["amaryllis"]' });
    expect(t.id).toBe("or");
  });
  it("Or reste Or au-delà de 3 séjours", () => {
    const t = computeTier({ nb_sejours: 12, biens: '["amaryllis"]' });
    expect(t.id).toBe("or");
  });
  it("exclut un client dont TOUS les séjours sont Iguana (bail long Joël Bailleul)", () => {
    expect(computeTier({ nb_sejours: 3, biens: '["iguana"]' })).toBeNull();
  });
  it("n'exclut PAS un client qui a séjourné à Iguana ET ailleurs", () => {
    const t = computeTier({ nb_sejours: 2, biens: '["iguana","geko"]' });
    expect(t.id).toBe("argent");
  });
  it("gère biens vide/absent sans planter", () => {
    expect(computeTier({ nb_sejours: 2, biens: null })).toEqual(expect.objectContaining({ id: "argent" }));
    expect(computeTier({ nb_sejours: 0 })).toBeNull();
  });

  it("TIER_DEFS est trié du plus haut seuil au plus bas (ordre requis par computeTier)", () => {
    for (let i = 1; i < TIER_DEFS.length; i++) {
      expect(TIER_DEFS[i - 1].seuil).toBeGreaterThan(TIER_DEFS[i].seuil);
    }
  });
});
