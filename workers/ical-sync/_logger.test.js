import { describe, it, expect } from "vitest";
import { redactName } from "./_logger.js";

describe("redactName", () => {
  it("garde uniquement l'initiale du prénom", () => {
    expect(redactName("Jean Dupont")).toBe("J.");
  });
  it("gère un nom sans espace", () => {
    expect(redactName("Marie")).toBe("M.");
  });
  it("gère null/undefined/vide sans throw", () => {
    expect(redactName(null)).toBe("?");
    expect(redactName(undefined)).toBe("?");
    expect(redactName("")).toBe("?");
  });
  it("ignore les espaces superflus", () => {
    expect(redactName("  Sophie Martin  ")).toBe("S.");
  });
});
