import { describe, it, expect } from "vitest";
import { randomSuffix, buildPrefix } from "./promoCodeGen.js";

describe("randomSuffix", () => {
  it("génère une chaîne de la longueur demandée", () => {
    expect(randomSuffix(4)).toHaveLength(4);
    expect(randomSuffix(8)).toHaveLength(8);
  });
  it("n'utilise que l'alphabet sans caractères ambigus (0/O/1/I/L)", () => {
    const s = randomSuffix(50);
    expect(s).not.toMatch(/[0O1IL]/);
  });
});

describe("buildPrefix", () => {
  it("dérive le préfixe depuis la partie locale de l'email", () => {
    expect(buildPrefix("jean.dupont@example.com")).toBe("JEANDU");
  });
  it("tronque à 6 caractères", () => {
    expect(buildPrefix("alexandra@example.com")).toBe("ALEXAN");
  });
  it("retombe sur AMARYL si email absent ou vide après nettoyage", () => {
    expect(buildPrefix(null)).toBe("AMARYL");
    expect(buildPrefix(undefined)).toBe("AMARYL");
    expect(buildPrefix("@@@@@@@example.com")).toBe("AMARYL");
  });
});
