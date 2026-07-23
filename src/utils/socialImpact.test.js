import { describe, it, expect } from "vitest";
import { isGrowthAgentSourced, computeSocialImpacts } from "./socialImpact.js";

// helpers dates
const YMD = (s) => Math.floor(new Date(`${s}T12:00:00Z`).getTime() / 1000);

describe("isGrowthAgentSourced", () => {
  it("détecte le marqueur source:growth-agent dans le brief", () => {
    expect(isGrowthAgentSourced("croissance — reel vue mer · source:growth-agent")).toBe(true);
    expect(isGrowthAgentSourced("inspiration — rotation normale")).toBe(false);
    expect(isGrowthAgentSourced(null)).toBe(false);
  });
});

describe("computeSocialImpacts", () => {
  // Abonnés totaux (FB+IG) par jour
  const followers = {
    "2026-07-08": 1390, "2026-07-09": 1391, // avant (baseline J-2/J-1)
    "2026-07-10": 1392,                      // jour J (neutre)
    "2026-07-11": 1398, "2026-07-12": 1402, // après (J+1/J+2)
  };

  it("calcule le delta abonnés avant/après (moyennes des fenêtres)", () => {
    const pubs = [{ id: 1, publishedAt: YMD("2026-07-10"), bien_id: "zandoli", format: "reel", brief: "x · source:growth-agent" }];
    const { publications } = computeSocialImpacts(pubs, followers, { windowDays: 2, today: "2026-07-20" });
    const p = publications[0];
    expect(p.followersAvant).toBe(1390.5); // (1390+1391)/2
    expect(p.followersApres).toBe(1400);   // (1398+1402)/2
    expect(p.delta).toBe(9.5);
    expect(p.growthAgent).toBe(true);
    expect(p.incomplete).toBe(false);
  });

  it("marque incomplete tant que la fenêtre après n'est pas révolue (deltaPct=null)", () => {
    const pubs = [{ id: 2, publishedAt: YMD("2026-07-19"), bien_id: "geko", format: "post", brief: "" }];
    const { publications } = computeSocialImpacts(pubs, followers, { windowDays: 2, today: "2026-07-20" });
    expect(publications[0].incomplete).toBe(true);
    expect(publications[0].deltaPct).toBe(null);
  });

  it("exclut les publications incomplètes des agrégats du summary", () => {
    const pubs = [
      { id: 1, publishedAt: YMD("2026-07-10"), bien_id: "zandoli", format: "reel", brief: "source:growth-agent" },
      { id: 2, publishedAt: YMD("2026-07-19"), bien_id: "geko", format: "post", brief: "" }, // incomplète
    ];
    const { summary } = computeSocialImpacts(pubs, followers, { windowDays: 2, today: "2026-07-20" });
    expect(summary.count).toBe(2);
    expect(summary.completeCount).toBe(1);
    expect(summary.incompleteCount).toBe(1);
    expect(summary.avgDelta).toBe(9.5);
  });

  it("isole un résumé SPÉCIFIQUE aux posts de l'agent (growthAgentSummary)", () => {
    const pubs = [
      { id: 1, publishedAt: YMD("2026-07-10"), bien_id: "zandoli", format: "reel", brief: "source:growth-agent" }, // agent
      { id: 3, publishedAt: YMD("2026-07-10"), bien_id: "amaryllis", format: "post", brief: "rotation normale" },  // manuel
    ];
    const { summary, growthAgentSummary } = computeSocialImpacts(pubs, followers, { windowDays: 2, today: "2026-07-20" });
    expect(summary.count).toBe(2);            // tous
    expect(growthAgentSummary.count).toBe(1); // seulement l'agent
    expect(growthAgentSummary.best.id).toBe(1);
  });

  it("Δ% : baseline 0 → null (non calculable), pas d'Infinity", () => {
    const f = { "2026-07-11": 5, "2026-07-12": 7 }; // rien avant
    const pubs = [{ id: 1, publishedAt: YMD("2026-07-10"), bien_id: "x", format: "reel", brief: "" }];
    const { publications } = computeSocialImpacts(pubs, f, { windowDays: 2, today: "2026-07-20" });
    expect(publications[0].deltaPct).toBe(null);
  });

  it("null-safe sur entrées vides", () => {
    const { publications, summary } = computeSocialImpacts(null, null, { today: "2026-07-20" });
    expect(publications).toEqual([]);
    expect(summary.count).toBe(0);
    expect(summary.avgDelta).toBe(null);
  });

  it("ignore une publication sans publishedAt valide", () => {
    const pubs = [{ id: 9, publishedAt: 0, bien_id: "x", brief: "" }];
    expect(computeSocialImpacts(pubs, followers, { today: "2026-07-20" }).publications).toHaveLength(0);
  });
});
