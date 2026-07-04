import { describe, it, expect } from "vitest";
import { diffNewListings } from "./zoneListingsDiff.js";

describe("diffNewListings", () => {
  it("ne signale rien si aucun snapshot précédent (1er scan = baseline)", () => {
    const today = [{ listing_id: "1" }, { listing_id: "2" }];
    expect(diffNewListings(today, null)).toEqual([]);
    expect(diffNewListings(today, undefined)).toEqual([]);
  });

  it("détecte les listings présents aujourd'hui mais absents la semaine dernière", () => {
    const today = [{ listing_id: "1", title: "A" }, { listing_id: "2", title: "B" }, { listing_id: "3", title: "C (nouveau)" }];
    const prev = new Set(["1", "2"]);
    expect(diffNewListings(today, prev)).toEqual([{ listing_id: "3", title: "C (nouveau)" }]);
  });

  it("ne signale rien si le set d'ids précédent est identique", () => {
    const today = [{ listing_id: "1" }, { listing_id: "2" }];
    expect(diffNewListings(today, new Set(["1", "2"]))).toEqual([]);
  });

  it("accepte un tableau d'ids en plus d'un Set", () => {
    const today = [{ listing_id: "1" }, { listing_id: "2" }];
    expect(diffNewListings(today, ["1"])).toEqual([{ listing_id: "2" }]);
  });

  it("ignore les listings sans listing_id exploitable", () => {
    const today = [{ listing_id: "" }, { listing_id: null }, { listing_id: "1" }];
    expect(diffNewListings(today, new Set())).toEqual([{ listing_id: "1" }]);
  });

  it("gère une entrée non-tableau sans planter", () => {
    expect(diffNewListings(null, new Set())).toEqual([]);
    expect(diffNewListings(undefined, new Set())).toEqual([]);
  });
});
