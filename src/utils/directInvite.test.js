import { describe, it, expect } from "vitest";
import { shouldShowDirectInvite } from "./directInvite.js";

describe("shouldShowDirectInvite", () => {
  it("true pour un séjour OTA", () => {
    expect(shouldShowDirectInvite({ source: "ota", du: "5 juin", au: "10 juin" })).toBe(true);
  });
  it("false pour un séjour direct (a déjà réservé en direct)", () => {
    expect(shouldShowDirectInvite({ source: "direct", guest: "Marie" })).toBe(false);
  });
  it("false si aucun contexte (pas de séjour en cours)", () => {
    expect(shouldShowDirectInvite({})).toBe(false);
    expect(shouldShowDirectInvite(null)).toBe(false);
    expect(shouldShowDirectInvite(undefined)).toBe(false);
  });
});
