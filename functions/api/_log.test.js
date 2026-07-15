import { describe, it, expect } from "vitest";
import { redactName, redactEmail } from "./_log.js";

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

describe("redactEmail", () => {
  it("garde le premier caractère + le domaine complet", () => {
    expect(redactEmail("jean.dupont@example.com")).toBe("j***@example.com");
  });
  it("gère null/undefined/vide/sans @ sans throw", () => {
    expect(redactEmail(null)).toBe("?");
    expect(redactEmail(undefined)).toBe("?");
    expect(redactEmail("")).toBe("?");
    expect(redactEmail("pas-un-email")).toBe("?");
  });
});
