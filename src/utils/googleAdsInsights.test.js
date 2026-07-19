import { describe, it, expect } from "vitest";
import { buildGaql, normalizeGaqlRow, parseGoogleAdsStream, aggregateGoogleAds, googleAdsHealth, GAQL_RANGES } from "./googleAdsInsights.js";

describe("buildGaql", () => {
  it("génère une requête reporting read-only sur campaign, fenêtre paramétrée", () => {
    const q = buildGaql("LAST_7_DAYS");
    expect(q).toContain("FROM campaign");
    expect(q).toContain("metrics.cost_micros");
    expect(q).toContain("DURING LAST_7_DAYS");
    // Aucune mutation.
    expect(q).not.toMatch(/INSERT|UPDATE|REMOVE|mutate/i);
  });
});

describe("normalizeGaqlRow", () => {
  it("convertit cost_micros en euros et dérive CPA/ROAS", () => {
    const row = {
      campaign: { id: "9", name: "Brand", advertisingChannelType: "SEARCH" },
      metrics: { costMicros: "40000000", impressions: "2000", clicks: "100", conversions: "2", conversionsValue: "2240" },
    };
    const n = normalizeGaqlRow(row);
    expect(n.name).toBe("Brand");
    expect(n.spend).toBe(40); // 40_000_000 µ / 1e6
    expect(n.purchases).toBe(2);
    expect(n.revenue).toBe(2240);
    expect(n.cpa).toBe(20);
    expect(n.roas).toBe(56);
  });

  it("gère l'absence de conversions sans NaN", () => {
    const n = normalizeGaqlRow({ campaign: { name: "X" }, metrics: { costMicros: "10000000", clicks: "5" } });
    expect(n.spend).toBe(10);
    expect(n.purchases).toBe(0);
    expect(n.roas).toBe(0); // 0 revenu / 10 = 0
    expect(n.cpa).toBeNull(); // /0 conversion
  });
});

describe("parseGoogleAdsStream", () => {
  it("aplati les batches searchStream (tableau de {results})", () => {
    const stream = [
      { results: [{ campaign: { name: "A" }, metrics: { costMicros: "30000000" } }] },
      { results: [{ campaign: { name: "B" }, metrics: { costMicros: "10000000" } }] },
    ];
    const rows = parseGoogleAdsStream(stream);
    expect(rows.map((r) => r.name)).toEqual(["A", "B"]);
    expect(aggregateGoogleAds(rows).spend).toBe(40);
  });
});

describe("googleAdsHealth", () => {
  it("no_spend / traffic_only / ok", () => {
    expect(googleAdsHealth({ spend: 0, purchases: 0, revenue: 0 }).status).toBe("no_spend");
    expect(googleAdsHealth({ spend: 40, purchases: 0, revenue: 0 }).status).toBe("traffic_only");
    expect(googleAdsHealth({ spend: 40, purchases: 2, revenue: 2240 }).canComputeRoas).toBe(true);
  });
});

describe("GAQL_RANGES", () => {
  it("mappe les fenêtres UI vers les constantes GAQL", () => {
    expect(GAQL_RANGES["30d"]).toBe("LAST_30_DAYS");
    expect(GAQL_RANGES["7d"]).toBe("LAST_7_DAYS");
  });
});
