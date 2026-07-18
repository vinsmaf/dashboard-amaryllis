import { describe, it, expect } from "vitest";
import { eligibleBiensForCheck, pickBienForCheck, formatChecklistNotes, CHECKLIST_ITEMS } from "./qualityCheck.js";

const BIENS = [
  { id: "amaryllis", bookable: true },
  { id: "iguana", bookable: false },
  { id: "zandoli", bookable: true },
  { id: "geko", bookable: true },
];

describe("eligibleBiensForCheck", () => {
  it("exclut les biens non bookable (Iguana)", () => {
    const ids = eligibleBiensForCheck(BIENS, []);
    expect(ids).not.toContain("iguana");
    expect(ids).toEqual(expect.arrayContaining(["amaryllis", "zandoli", "geko"]));
  });

  it("exclut un bien avec un contrôle déjà en cours (a_planifier/planifie)", () => {
    const recent = [{ bien_id: "zandoli", status: "a_planifier", created_at: 0 }];
    const ids = eligibleBiensForCheck(BIENS, recent);
    expect(ids).not.toContain("zandoli");
  });

  it("exclut un bien contrôlé récemment (dans la fenêtre cooldown)", () => {
    const now = 1_000_000;
    const recent = [{ bien_id: "geko", status: "fait", created_at: now - 5 * 86400 }];
    const ids = eligibleBiensForCheck(BIENS, recent, { cooldownDays: 21, nowSec: now });
    expect(ids).not.toContain("geko");
  });

  it("réintègre un bien contrôlé il y a longtemps (hors cooldown)", () => {
    const now = 1_000_000;
    const recent = [{ bien_id: "geko", status: "fait", created_at: now - 30 * 86400 }];
    const ids = eligibleBiensForCheck(BIENS, recent, { cooldownDays: 21, nowSec: now });
    expect(ids).toContain("geko");
  });

  it("aucun historique → tous les bookable éligibles", () => {
    expect(eligibleBiensForCheck(BIENS, null).sort()).toEqual(["amaryllis", "geko", "zandoli"]);
  });
});

describe("pickBienForCheck", () => {
  it("retourne null si aucun éligible", () => {
    expect(pickBienForCheck([])).toBe(null);
    expect(pickBienForCheck(null)).toBe(null);
  });

  it("retourne toujours un des éligibles", () => {
    const ids = ["a", "b", "c"];
    for (let i = 0; i < 20; i++) expect(ids).toContain(pickBienForCheck(ids));
  });

  it("respecte un rng injecté (déterministe)", () => {
    expect(pickBienForCheck(["a", "b", "c"], () => 0)).toBe("a");
    expect(pickBienForCheck(["a", "b", "c"], () => 0.99)).toBe("c");
  });
});

describe("formatChecklistNotes", () => {
  it("liste tous les items avec des cases à cocher", () => {
    const txt = formatChecklistNotes();
    for (const item of CHECKLIST_ITEMS) expect(txt).toContain(item);
    expect(txt).toContain("☐");
  });
});
