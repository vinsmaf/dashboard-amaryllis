import { describe, it, expect } from "vitest";
import { resolveLivePrice, computeSignificantGaps, groupGapsByProperty } from "./rmPriceDigest.js";

describe("resolveLivePrice — même résolution que le site public", () => {
  it("priorise le prix journalier s'il existe", () => {
    expect(resolveLivePrice("zandoli", "2026-08-01", { zandoli: { "2026-08-01": 150 } })).toBe(150);
  });
  it("retombe sur bien.prix si pas de prix journalier", () => {
    expect(resolveLivePrice("zandoli", "2026-08-01", {})).toBe(110); // prix de base biens.js
  });
  it("bien inconnu → null", () => {
    expect(resolveLivePrice("inconnu", "2026-08-01", {})).toBe(null);
  });
});

describe("computeSignificantGaps — isole les écarts qui comptent", () => {
  const opts = { thresholdPct: 0.12, maxLeadDays: 30 };

  it("filtre un écart en dessous du seuil (bruit)", () => {
    const recos = [{ property_id: "zandoli", date: "2026-08-01", recommended_price_cents: 11500, lead_time_days: 10 }];
    // live 110, reco 115 → +4.5%, sous le seuil 12%
    expect(computeSignificantGaps(recos, {}, opts)).toEqual([]);
  });

  it("garde un écart significatif (hausse)", () => {
    const recos = [{ property_id: "zandoli", date: "2026-08-01", recommended_price_cents: 15000, lead_time_days: 10, vacancy_risk_score: 20, premium_opportunity: 80 }];
    // live 110, reco 150 → +36%
    const gaps = computeSignificantGaps(recos, {}, opts);
    expect(gaps.length).toBe(1);
    expect(gaps[0].diff_eur).toBe(40);
    expect(gaps[0].diff_pct).toBe(36);
    expect(gaps[0].direction).toBe("hausse");
  });

  it("garde un écart significatif (baisse)", () => {
    const recos = [{ property_id: "zandoli", date: "2026-08-01", recommended_price_cents: 8000, lead_time_days: 10 }];
    // live 110, reco 80 → -27%
    const gaps = computeSignificantGaps(recos, {}, opts);
    expect(gaps[0].direction).toBe("baisse");
    expect(gaps[0].diff_eur).toBe(-30);
  });

  it("exclut les dates déjà vendues (already_booked)", () => {
    const recos = [{ property_id: "zandoli", date: "2026-08-01", recommended_price_cents: 20000, lead_time_days: 10, alert_flags: JSON.stringify(["already_booked"]) }];
    expect(computeSignificantGaps(recos, {}, opts)).toEqual([]);
  });

  it("exclut les dates hors fenêtre actionnable (lead time trop loin)", () => {
    const recos = [{ property_id: "zandoli", date: "2027-06-01", recommended_price_cents: 20000, lead_time_days: 300 }];
    expect(computeSignificantGaps(recos, {}, opts)).toEqual([]);
  });

  it("exclut une date passée (lead_time_days négatif, bruit)", () => {
    const recos = [{ property_id: "zandoli", date: "2026-01-01", recommended_price_cents: 20000, lead_time_days: -5 }];
    expect(computeSignificantGaps(recos, {}, opts)).toEqual([]);
  });

  it("ignore une reco sans prix live résolvable (bien inconnu)", () => {
    const recos = [{ property_id: "inconnu", date: "2026-08-01", recommended_price_cents: 20000, lead_time_days: 10 }];
    expect(computeSignificantGaps(recos, {}, opts)).toEqual([]);
  });

  it("trie par écart € absolu décroissant", () => {
    const recos = [
      { property_id: "zandoli", date: "2026-08-01", recommended_price_cents: 15000, lead_time_days: 10 }, // +40
      { property_id: "geko",    date: "2026-08-02", recommended_price_cents: 20000, lead_time_days: 10 }, // geko base 110 → +90
    ];
    const gaps = computeSignificantGaps(recos, {}, opts);
    expect(gaps[0].property_id).toBe("geko");
    expect(gaps[1].property_id).toBe("zandoli");
  });

  it("liste vide → tableau vide", () => {
    expect(computeSignificantGaps([], {}, opts)).toEqual([]);
    expect(computeSignificantGaps(null, {}, opts)).toEqual([]);
  });
});

describe("groupGapsByProperty — regroupe pour l'affichage", () => {
  it("compte le total mais ne garde que top N par bien", () => {
    const gaps = [
      { property_id: "zandoli", diff_eur: 50 },
      { property_id: "zandoli", diff_eur: 45 },
      { property_id: "zandoli", diff_eur: 40 },
      { property_id: "zandoli", diff_eur: 35 },
      { property_id: "geko", diff_eur: 20 },
    ];
    const grouped = groupGapsByProperty(gaps, 2);
    expect(grouped.zandoli.total).toBe(4);
    expect(grouped.zandoli.top.length).toBe(2);
    expect(grouped.geko.total).toBe(1);
  });
});
