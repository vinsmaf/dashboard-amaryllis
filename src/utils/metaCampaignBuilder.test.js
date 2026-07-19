import { describe, it, expect } from "vitest";
import {
  buildCampaignPayload,
  buildTargeting,
  buildAdSetPayload,
  buildCreativePayload,
  buildAdPayload,
  checkResolution,
} from "./metaCampaignBuilder.js";
import { CAMPAIGNS } from "../config/metaCampaignBrief.js";

const a1 = CAMPAIGNS.c1_tofu.adsets.find((a) => a.key === "a1_amaryllis");

describe("buildCampaignPayload", () => {
  it("est toujours créé en PAUSED, jamais actif", () => {
    const p = buildCampaignPayload(CAMPAIGNS.c1_tofu);
    expect(p.status).toBe("PAUSED");
    expect(p.objective).toBe("OUTCOME_TRAFFIC");
    expect(p.special_ad_categories).toEqual([]);
  });
});

describe("buildTargeting", () => {
  it("inclut geo/âge de base même sans intérêts/régions résolus", () => {
    const t = buildTargeting(a1, [], []);
    expect(t.geo_locations).toEqual({ countries: ["FR"] });
    expect(t.age_min).toBe(30);
    expect(t.age_max).toBe(60);
    expect(t.interests).toBeUndefined();
    expect(t.excluded_geo_locations).toBeUndefined();
  });

  it("ajoute les intérêts et exclusions régionales résolus", () => {
    const interests = [{ id: "123", name: "Martinique", matchedName: "Martinique" }];
    const regions = [{ key: "R1", name: "Martinique", matchedName: "Martinique" }];
    const t = buildTargeting(a1, interests, regions);
    expect(t.interests).toEqual([{ id: "123", name: "Martinique" }]);
    expect(t.excluded_geo_locations).toEqual({ regions: [{ key: "R1", name: "Martinique" }] });
  });
});

describe("buildAdSetPayload", () => {
  it("reste PAUSED avec le budget en centimes du brief", () => {
    const p = buildAdSetPayload(a1, "cmp_123", { geo_locations: { countries: ["FR"] } });
    expect(p.status).toBe("PAUSED");
    expect(p.campaign_id).toBe("cmp_123");
    expect(p.daily_budget).toBe(300);
    expect(p.optimization_goal).toBe("LANDING_PAGE_VIEWS");
  });
});

describe("buildCreativePayload", () => {
  it("mappe le copy du brief sur object_story_spec.link_data", () => {
    const p = buildCreativePayload(a1, "page_1");
    expect(p.object_story_spec.page_id).toBe("page_1");
    expect(p.object_story_spec.link_data.link).toBe("https://villamaryllis.com/amaryllis");
    expect(p.object_story_spec.link_data.message).toContain("villa privée");
    expect(p.object_story_spec.link_data.call_to_action.type).toBe("LEARN_MORE");
  });
});

describe("buildAdPayload", () => {
  it("lie l'ad set et la créative, reste PAUSED", () => {
    const p = buildAdPayload(a1, "adset_1", "creative_1");
    expect(p.status).toBe("PAUSED");
    expect(p.adset_id).toBe("adset_1");
    expect(p.creative).toEqual({ creative_id: "creative_1" });
  });
});

describe("checkResolution", () => {
  it("signale les intérêts jamais résolus, ne masque rien en silence", () => {
    const r = checkResolution(
      ["Martinique", "Caraïbes", "IntrouvableXYZ"],
      [
        { matchedName: "Martinique" },
        { matchedName: "Caraïbes" },
      ]
    );
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(["IntrouvableXYZ"]);
  });

  it("complet quand tout est résolu", () => {
    const r = checkResolution(["Martinique"], [{ matchedName: "Martinique" }]);
    expect(r.complete).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it("gère une liste vide sans erreur", () => {
    const r = checkResolution([], []);
    expect(r.complete).toBe(true);
  });
});
