import { describe, it, expect } from "vitest";
import { normalizeInsightRow, parseInsights, aggregateInsights, measurementHealth, acquisitionMer } from "./metaAdsInsights.js";

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

// ── Doctrine métriques 2026-07-23 (Vincent) : piloter sur couverture unique / CPMR /
//    CPC sortant / MER d'acquisition, pas sur impressions / CPM / CTR / ROAS.
describe("métriques de pilotage (doctrine 2026-07-23)", () => {
  const row = {
    campaign_name: "Amaryllis",
    spend: "100", impressions: "10000", reach: "2500", clicks: "300",
    outbound_clicks: [{ action_type: "outbound_click", value: "50" }],
  };

  it("couverture unique et répétition : impressions ≠ personnes touchées", () => {
    const n = normalizeInsightRow(row);
    expect(n.reach).toBe(2500);
    expect(n.frequency).toBe(4); // 10000 / 2500 → chaque personne a vu la pub 4 fois
  });

  it("CPMR = CPM × répétition = coût pour 1000 personnes RÉELLEMENT touchées", () => {
    const n = normalizeInsightRow(row);
    expect(n.cpm).toBe(10);    // 100€ / 10000 impressions × 1000
    expect(n.cpmr).toBe(40);   // 100€ / 2500 personnes × 1000
    expect(n.cpmr).toBeCloseTo(n.cpm * n.frequency, 6); // l'identité tient
  });

  it("le CPMR monte quand l'audience sature, alors que le CPM ne bouge pas", () => {
    const frais = normalizeInsightRow({ ...row, reach: "5000" });  // audience qui tourne
    const sature = normalizeInsightRow({ ...row, reach: "1000" }); // on repaye les mêmes gens
    expect(frais.cpm).toBe(sature.cpm);            // aveugle à la saturation
    expect(sature.cpmr).toBeGreaterThan(frais.cpmr); // le CPMR, lui, la voit
  });

  it("CPC sortant : seuls les clics ayant quitté Meta comptent", () => {
    const n = normalizeInsightRow(row);
    expect(n.outboundClicks).toBe(50);
    expect(n.outboundCpc).toBe(2);  // 100€ / 50 clics sortants
    expect(n.cpc).toBeCloseTo(0.33, 2); // le CPC global flatte : 300 clics dont 250 sans intention
  });

  it("CPA implicite = CPC sortant / taux de conversion supposé, hypothèse exposée", () => {
    const n = normalizeInsightRow(row, { assumedCvr: 0.02 });
    expect(n.impliedCpa).toBe(100); // 2€ / 2%
    expect(n.assumedCvr).toBe(0.02); // l'hypothèse reste lisible à côté du chiffre
    expect(normalizeInsightRow(row, { assumedCvr: 0.05 }).impliedCpa).toBe(40);
  });

  it("aucune division par zéro : sans couverture ni clic sortant, les KPIs sont null (pas 0)", () => {
    const n = normalizeInsightRow({ spend: "50", impressions: "0", reach: "0" });
    expect(n.cpmr).toBeNull();
    expect(n.frequency).toBeNull();
    expect(n.outboundCpc).toBeNull();
    expect(n.impliedCpa).toBeNull();
  });

  it("agrégat : la couverture n'est PAS additive et le dit (plafond, donc CPMR plancher)", () => {
    const rows = [normalizeInsightRow(row), normalizeInsightRow({ ...row, reach: "1500" })];
    const agg = aggregateInsights(rows);
    expect(agg.reachSum).toBe(4000);
    expect(agg.reachIsDeduplicated).toBe(false); // la même personne peut être dans 2 campagnes
    expect(agg.cpmrFloor).toBe(50); // 200€ / 4000 × 1000 — vrai CPMR ≥ celui-ci
    expect(agg.outboundCpc).toBe(2); // 200€ / 100 clics sortants
  });
});

describe("acquisitionMer", () => {
  it("mesure le revenu des NOUVEAUX clients par euro dépensé", () => {
    expect(acquisitionMer({ newCustomerRevenue: 3000, adSpend: 600 })).toMatchObject({ mer: 5, verdict: "fort" });
    expect(acquisitionMer({ newCustomerRevenue: 900, adSpend: 600 })).toMatchObject({ mer: 1.5, verdict: "viable" });
  });

  it("sous 1, la pub détruit de la valeur — verdict explicite", () => {
    expect(acquisitionMer({ newCustomerRevenue: 300, adSpend: 600 }).verdict).toBe("destructeur");
  });

  it("sans dépense → null, jamais un ratio inventé", () => {
    expect(acquisitionMer({ newCustomerRevenue: 3000, adSpend: 0 })).toMatchObject({ mer: null, verdict: "no_spend" });
  });
});
