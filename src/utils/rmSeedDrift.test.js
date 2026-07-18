import { describe, it, expect } from "vitest";
import { computeSeedAverage, computeSeedDrift } from "./rmSeedDrift.js";

const SEED = {
  amaryllis: {
    "2026-01-01": 300,
    "2026-01-02": 300,
    "2026-01-03": 400,
    "2026-01-04": 400,
  },
};

describe("computeSeedAverage", () => {
  it("moyenne les prix seed sur la fenêtre inclusive", () => {
    const r = computeSeedAverage("amaryllis", "2026-01-01", "2026-01-04", SEED);
    expect(r.avg).toBe(350);
    expect(r.coverageDays).toBe(4);
    expect(r.totalDays).toBe(4);
  });

  it("bien sans seed du tout → avg null", () => {
    const r = computeSeedAverage("inconnu", "2026-01-01", "2026-01-04", SEED);
    expect(r.avg).toBe(null);
    expect(r.coverageDays).toBe(0);
  });

  it("fenêtre hors couverture seed → avg null mais totalDays compté", () => {
    const r = computeSeedAverage("amaryllis", "2099-01-01", "2099-01-03", SEED);
    expect(r.avg).toBe(null);
    expect(r.totalDays).toBe(3);
  });

  it("couverture partielle → moyenne uniquement sur les dates trouvées", () => {
    const r = computeSeedAverage("amaryllis", "2025-12-31", "2026-01-02", SEED);
    // 2025-12-31 absent du seed, 01-01 et 01-02 présents (300 chacun)
    expect(r.avg).toBe(300);
    expect(r.coverageDays).toBe(2);
    expect(r.totalDays).toBe(3);
  });
});

describe("computeSeedDrift", () => {
  it("détecte un écart significatif au-dessus du seuil", () => {
    const profiles = [{
      property_id: "amaryllis", name: "Haute saison", season_type: "high",
      date_start: "2026-01-01", date_end: "2026-01-04", base_price_override: 50000, // 500€ vs seed avg 350€ → +43%
    }];
    const { drifted, noCoverage } = computeSeedDrift(profiles, SEED, { thresholdPct: 0.15 });
    expect(noCoverage).toEqual([]);
    expect(drifted.length).toBe(1);
    expect(drifted[0].seed_avg).toBe(350);
    expect(drifted[0].rm_override).toBe(500);
    expect(drifted[0].diff_pct).toBe(43);
  });

  it("ignore un écart sous le seuil", () => {
    const profiles = [{
      property_id: "amaryllis", name: "Haute saison", season_type: "high",
      date_start: "2026-01-01", date_end: "2026-01-04", base_price_override: 36000, // 360€ vs 350€ → +3%
    }];
    const { drifted } = computeSeedDrift(profiles, SEED, { thresholdPct: 0.15 });
    expect(drifted).toEqual([]);
  });

  it("reporte séparément un profil sans couverture seed (jamais un faux drift)", () => {
    const profiles = [{
      property_id: "amaryllis", name: "Hors saison seed", season_type: "low",
      date_start: "2099-01-01", date_end: "2099-01-03", base_price_override: 30000,
    }];
    const { drifted, noCoverage } = computeSeedDrift(profiles, SEED, { thresholdPct: 0.15 });
    expect(drifted).toEqual([]);
    expect(noCoverage.length).toBe(1);
    expect(noCoverage[0].property_id).toBe("amaryllis");
  });

  it("trie par écart % absolu décroissant", () => {
    const profiles = [
      { property_id: "amaryllis", name: "A", date_start: "2026-01-01", date_end: "2026-01-04", base_price_override: 40000 }, // +14%… sous seuil large
      { property_id: "amaryllis", name: "B", date_start: "2026-01-01", date_end: "2026-01-04", base_price_override: 70000 }, // +100%
    ];
    const { drifted } = computeSeedDrift(profiles, SEED, { thresholdPct: 0.10 });
    expect(drifted[0].name).toBe("B");
  });

  it("aucun profil → tout vide", () => {
    expect(computeSeedDrift([], SEED)).toEqual({ drifted: [], noCoverage: [] });
    expect(computeSeedDrift(null, SEED)).toEqual({ drifted: [], noCoverage: [] });
  });
});
