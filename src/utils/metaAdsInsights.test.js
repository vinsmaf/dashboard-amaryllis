import { describe, it, expect } from "vitest";
import { normalizeInsightRow, parseInsights, aggregateInsights, measurementHealth } from "./metaAdsInsights.js";

describe("normalizeInsightRow", () => {
  it("extrait spend/clics + vues de page + achats + revenu depuis les actions Meta", () => {
    const row = {
      campaign_name: "C1 — TOFU",
      campaign_id: "123",
      spend: "40.00", impressions: "2000", clicks: "80", ctr: "4", cpc: "0.5",
      actions: [
        { action_type: "link_click", value: "70" },
        { action_type: "landing_page_view", value: "50" },
        { action_type: "offsite_conversion.fb_pixel_purchase", value: "2" },
      ],
      action_values: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "2240" }],
    };
    const n = normalizeInsightRow(row);
    expect(n.name).toBe("C1 — TOFU");
    expect(n.spend).toBe(40);
    expect(n.landingPageViews).toBe(50);
    expect(n.purchases).toBe(2);
    expect(n.revenue).toBe(2240);
    expect(n.costPerLandingView).toBe(0.8); // 40/50
    expect(n.cpa).toBe(20); // 40/2
    expect(n.roas).toBe(56); // 2240/40
  });

  it("ne casse pas quand il n'y a ni actions ni achats (campagne trafic sans conversion)", () => {
    const n = normalizeInsightRow({ campaign_name: "X", spend: "10", impressions: "500", clicks: "10" });
    expect(n.purchases).toBe(0);
    expect(n.revenue).toBe(0);
    // ROAS = revenu/spend = 0/10 = 0 (dépensé, rien rapporté — chiffre réel, jamais NaN).
    expect(n.roas).toBe(0);
    // CPA/coût-par-vue = spend / 0 → division impossible → null (pas 0 trompeur).
    expect(n.cpa).toBeNull();
    expect(n.costPerLandingView).toBeNull();
  });
});

describe("aggregateInsights", () => {
  it("somme les totaux et recalcule les ratios sur les totaux (pas une moyenne de ratios)", () => {
    const rows = parseInsights([
      { campaign_name: "A", spend: "30", impressions: "1000", clicks: "40", actions: [{ action_type: "landing_page_view", value: "30" }] },
      { campaign_name: "B", spend: "10", impressions: "1000", clicks: "10", actions: [{ action_type: "landing_page_view", value: "10" }] },
    ]);
    const t = aggregateInsights(rows);
    expect(t.spend).toBe(40);
    expect(t.landingPageViews).toBe(40);
    expect(t.costPerLandingView).toBe(1); // 40/40, pas (30/30 + 10/10)/2
  });
});

describe("measurementHealth", () => {
  it("no_spend quand rien n'a tourné (campagnes en pause)", () => {
    const h = measurementHealth({ spend: 0, purchases: 0, revenue: 0 });
    expect(h.status).toBe("no_spend");
    expect(h.canComputeRoas).toBe(false);
  });

  it("traffic_only quand il y a de la dépense mais 0 achat tracké — ne pas arbitrer sur le ROAS", () => {
    const h = measurementHealth({ spend: 40, purchases: 0, revenue: 0 });
    expect(h.status).toBe("traffic_only");
    expect(h.canComputeRoas).toBe(false);
  });

  it("ok quand dépense ET conversions trackées", () => {
    const h = measurementHealth({ spend: 40, purchases: 2, revenue: 2240 });
    expect(h.status).toBe("ok");
    expect(h.canComputeRoas).toBe(true);
  });
});
