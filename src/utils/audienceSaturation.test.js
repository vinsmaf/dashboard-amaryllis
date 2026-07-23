import { describe, it, expect } from "vitest";
import {
  FREQ_MAX, FREQ_SUFFISANT, segmentLabel, segmentSaturation, auditAudienceFrequency,
} from "./audienceSaturation.js";

// Cas réel cité par Vincent : nouvelles audiences à 4,90 · clients existants à 23,75.
const NOUVELLES = { segment: "new_audience", spend: 300, reach: 10000, impressions: 49000 };   // freq 4,90
const EXISTANTS = { segment: "existing_customers", spend: 300, reach: 400, impressions: 9500 }; // freq 23,75

describe("seuils", () => {
  it("répétition > 10 = contre-productif, 5-10 suffit", () => {
    expect(FREQ_MAX).toBe(10);
    expect(FREQ_SUFFISANT).toBe(5);
  });
});

describe("segmentSaturation", () => {
  it("recalcule la répétition depuis impressions/couverture (pas de valeur reprise telle quelle)", () => {
    expect(segmentSaturation(NOUVELLES).frequency).toBe(4.9);
    expect(segmentSaturation(EXISTANTS).frequency).toBe(23.75);
  });

  it("nouvelles audiences à 4,90 → sous-exposé, on ne coupe rien", () => {
    const s = segmentSaturation(NOUVELLES);
    expect(s.verdict).toBe("sous_expose");
    expect(s.economieEstimee).toBeNull();
  });

  it("clients existants à 23,75 → saturé, avec une baisse de budget chiffrée", () => {
    const s = segmentSaturation(EXISTANTS);
    expect(s.verdict).toBe("sature");
    expect(s.reductionPct).toBe(57.9);      // 1 − 10/23,75
    expect(s.budgetCible).toBe(126.32);     // 300 × 10/23,75
    expect(s.economieEstimee).toBe(173.68);
    expect(s.connaitLaMarque).toBe(true);   // priorité : on repaye des gens déjà convaincus
  });

  it("annonce l'estimation comme telle, jamais comme un fait acquis", () => {
    expect(segmentSaturation(EXISTANTS).note).toMatch(/estimation linéaire/i);
  });

  it("zone 5-10 → optimal, aucune action", () => {
    const s = segmentSaturation({ segment: "engaged_audience", spend: 100, reach: 1000, impressions: 7000 });
    expect(s.frequency).toBe(7);
    expect(s.verdict).toBe("optimal");
    expect(s.economieEstimee).toBeNull();
  });

  it("frontière : exactement 10 reste optimal, 10,01 bascule en saturé", () => {
    expect(segmentSaturation({ segment: "x", spend: 10, reach: 100, impressions: 1000 }).verdict).toBe("optimal");
    expect(segmentSaturation({ segment: "x", spend: 10, reach: 100, impressions: 1001 }).verdict).toBe("sature");
  });

  it("couverture nulle → non mesurable, jamais une division par zéro déguisée", () => {
    const s = segmentSaturation({ segment: "new_audience", spend: 50, reach: 0, impressions: 900 });
    expect(s.verdict).toBe("non_mesurable");
    expect(s.frequency).toBeNull();
  });

  it("libellés lisibles, et repli propre sur une clé inconnue", () => {
    expect(segmentLabel("existing_customers")).toBe("Clients existants");
    expect(segmentLabel("segment_inconnu_meta")).toBe("segment_inconnu_meta");
  });
});

describe("auditAudienceFrequency", () => {
  it("chiffre l'économie et priorise les segments qui connaissent déjà la marque", () => {
    const a = auditAudienceFrequency([NOUVELLES, EXISTANTS]);
    expect(a.satures).toBe(1);
    expect(a.economieEstimee).toBe(173.68);
    expect(a.depenseAnalysee).toBe(600);
    expect(a.actions).toHaveLength(1);
    expect(a.actions[0]).toMatchObject({ segment: "existing_customers", action: "baisser_budget", priorite: "haute" });
  });

  it("classe les actions par économie décroissante", () => {
    const gros = { segment: "existing_customers", spend: 1000, reach: 500, impressions: 15000 }; // freq 30
    const petit = { segment: "new_audience", spend: 50, reach: 100, impressions: 1500 };          // freq 15
    const a = auditAudienceFrequency([petit, gros]);
    expect(a.actions[0].segment).toBe("existing_customers");
    expect(a.actions[0].economie).toBeGreaterThan(a.actions[1].economie);
  });

  it("aucune saturation → le dit clairement plutôt que d'inventer une coupe", () => {
    const a = auditAudienceFrequency([NOUVELLES]);
    expect(a.satures).toBe(0);
    expect(a.economieEstimee).toBe(0);
    expect(a.actions).toHaveLength(0);
    expect(a.note).toMatch(/pression publicitaire est saine/);
  });

  it("aucune donnée → note honnête, pas un audit vide qui ressemble à un feu vert", () => {
    const a = auditAudienceFrequency([]);
    expect(a.note).toMatch(/indisponible/);
    expect(a.segments).toHaveLength(0);
  });
});
