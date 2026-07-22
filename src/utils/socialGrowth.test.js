import { describe, it, expect } from "vitest";
import {
  isoDaysBefore,
  followersAt,
  computePlatformGrowth,
  neededMonthlyFollowers,
  targetVerdict,
  platformHealth,
  summarizeGrowth,
  SOCIAL_PLATFORMS,
} from "./socialGrowth.js";

describe("isoDaysBefore", () => {
  it("recule du bon nombre de jours en UTC", () => {
    expect(isoDaysBefore("2026-07-22", 7)).toBe("2026-07-15");
    expect(isoDaysBefore("2026-07-22", 30)).toBe("2026-06-22");
  });
  it("traverse correctement une frontière de mois/année", () => {
    expect(isoDaysBefore("2026-01-05", 10)).toBe("2025-12-26");
  });
  it("renvoie null sur date invalide", () => {
    expect(isoDaysBefore("pas-une-date", 7)).toBe(null);
  });
});

describe("followersAt", () => {
  const series = [
    { date: "2026-07-01", followers: 100 },
    { date: "2026-07-10", followers: 120 },
    { date: "2026-07-20", followers: 140 },
  ];
  it("prend le dernier point <= date cible", () => {
    expect(followersAt(series, "2026-07-15")).toBe(120);
    expect(followersAt(series, "2026-07-20")).toBe(140);
    expect(followersAt(series, "2026-07-25")).toBe(140);
  });
  it("renvoie null si aucun point antérieur", () => {
    expect(followersAt(series, "2026-06-30")).toBe(null);
  });
  it("null-safe sur série vide / champs manquants", () => {
    expect(followersAt([], "2026-07-15")).toBe(null);
    expect(followersAt(null, "2026-07-15")).toBe(null);
    expect(followersAt([{ date: "2026-07-01" }], "2026-07-15")).toBe(null); // followers absent
  });
});

describe("computePlatformGrowth", () => {
  const series = [
    { date: "2026-06-22", followers: 1000 },
    { date: "2026-07-15", followers: 1030 },
    { date: "2026-07-22", followers: 1050 },
  ];
  it("calcule current + delta 7j/30j + % mensuel", () => {
    const g = computePlatformGrowth(series, "2026-07-22");
    expect(g.current).toBe(1050);
    expect(g.delta_7d).toBe(20);   // 1050 - 1030
    expect(g.delta_30d).toBe(50);  // 1050 - 1000
    expect(g.growth_30d_pct).toBe(5); // 50/1000 = 5%
  });
  it("renvoie des null quand l'historique est insuffisant", () => {
    const g = computePlatformGrowth([{ date: "2026-07-22", followers: 1050 }], "2026-07-22");
    expect(g.current).toBe(1050);
    expect(g.delta_7d).toBe(null);
    expect(g.delta_30d).toBe(null);
    expect(g.growth_30d_pct).toBe(null);
  });
  it("ne divise pas par zéro (base à 0)", () => {
    const g = computePlatformGrowth([
      { date: "2026-06-22", followers: 0 },
      { date: "2026-07-22", followers: 10 },
    ], "2026-07-22");
    expect(g.delta_30d).toBe(10);
    expect(g.growth_30d_pct).toBe(null); // ref30 = 0 → pas de %
  });
});

describe("neededMonthlyFollowers", () => {
  it("calcule les abonnés à gagner pour la cible %", () => {
    expect(neededMonthlyFollowers(1000, 5)).toBe(50);
    expect(neededMonthlyFollowers(333, 5)).toBe(17); // arrondi au sup
  });
  it("null-safe", () => {
    expect(neededMonthlyFollowers(0, 5)).toBe(null);
    expect(neededMonthlyFollowers(1000, 0)).toBe(null);
    expect(neededMonthlyFollowers(null, 5)).toBe(null);
  });
});

describe("targetVerdict", () => {
  it("ahead quand la croissance atteint ou dépasse la cible", () => {
    expect(targetVerdict({ growth_30d_pct: 6 }, 5).verdict).toBe("ahead");
    expect(targetVerdict({ growth_30d_pct: 5 }, 5).verdict).toBe("ahead");
  });
  it("on_track dans la marge des 70 % de la cible", () => {
    expect(targetVerdict({ growth_30d_pct: 4 }, 5).verdict).toBe("on_track"); // 4 >= 3.5
  });
  it("behind sous la marge", () => {
    expect(targetVerdict({ growth_30d_pct: 2 }, 5).verdict).toBe("behind");
    expect(targetVerdict({ growth_30d_pct: -1 }, 5).verdict).toBe("behind");
  });
  it("no_data sans historique 30j", () => {
    expect(targetVerdict({ growth_30d_pct: null }, 5).verdict).toBe("no_data");
  });
  it("expose l'écart en points vs la cible", () => {
    expect(targetVerdict({ growth_30d_pct: 3 }, 5).gap_pct).toBe(-2);
  });
});

describe("platformHealth", () => {
  it("mappe chaque état", () => {
    expect(platformHealth({ configured: true })).toBe("measurable");
    expect(platformHealth({ configured: false })).toBe("not_configured");
    expect(platformHealth({ configured: true, blocked: true })).toBe("pending_access");
    expect(platformHealth({ configured: true, error: "429" })).toBe("error");
  });
  it("l'erreur prime sur tout", () => {
    expect(platformHealth({ configured: false, blocked: true, error: "boom" })).toBe("error");
  });
});

describe("summarizeGrowth", () => {
  const platforms = [
    { platform: "facebook", health: "measurable", current: 500, growth: { delta_30d: 20 }, verdict: "on_track" },
    { platform: "instagram", health: "measurable", current: 800, growth: { delta_30d: 60 }, verdict: "ahead" },
    { platform: "youtube", health: "not_configured", current: null, growth: {}, verdict: "no_data" },
    { platform: "gbp", health: "pending_access", current: null, growth: {}, verdict: "no_data" },
  ];
  it("ne totalise que les plateformes mesurables", () => {
    const s = summarizeGrowth(platforms);
    expect(s.total_followers).toBe(1300); // 500 + 800, jamais YT/GBP
    expect(s.total_delta_30d).toBe(80);
    expect(s.measurable_count).toBe(2);
  });
  it("liste les plateformes en retard et en attente", () => {
    const withBehind = [...platforms, { platform: "facebook", health: "measurable", current: 100, growth: { delta_30d: 0 }, verdict: "behind" }];
    const s = summarizeGrowth(withBehind);
    expect(s.behind_platforms).toContain("facebook");
    expect(s.pending_platforms).toEqual(expect.arrayContaining(["youtube", "gbp"]));
  });
});

describe("SOCIAL_PLATFORMS", () => {
  it("couvre les 4 plateformes demandées", () => {
    expect(SOCIAL_PLATFORMS).toEqual(["facebook", "instagram", "youtube", "gbp"]);
  });
});
