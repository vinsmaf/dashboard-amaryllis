import { describe, it, expect } from "vitest";
import { MEASUREMENT_TIERS, financeKpis, declaredAttribution, compareAttributions } from "./adFinanceKpis.js";

describe("MEASUREMENT_TIERS", () => {
  it("seuls finance et déclaratif autorisent une décision business", () => {
    expect(MEASUREMENT_TIERS.plateforme.decision_business).toBe(false);
    expect(MEASUREMENT_TIERS.finance.decision_business).toBe(true);
    expect(MEASUREMENT_TIERS.declaratif.decision_business).toBe(true);
  });

  it("le niveau plateforme contient bien les métriques dont on se méfie", () => {
    expect(MEASUREMENT_TIERS.plateforme.metriques).toEqual(expect.arrayContaining(["roas", "ctr", "cpm"]));
  });
});

describe("financeKpis (niveau 2)", () => {
  const base = { adSpend: 600, newCustomers: 10, newCustomerRevenue: 9000, lifetimeRevenue: 60000, lifetimeCustomers: 50 };

  it("calcule CAC blended, MER, LTV et LTV/CAC", () => {
    const k = financeKpis(base);
    expect(k.blendedCac).toBe(60);       // 600 € / 10 nouveaux clients
    expect(k.acquisitionMer).toBe(15);   // 9000 € / 600 €
    expect(k.ltv).toBe(1200);            // 60000 € / 50 clients
    expect(k.ltvSurCac).toBe(20);        // 1200 / 60
    expect(k.verdict).toBe("rentable");
  });

  it("LTV/CAC sous 3 → viable, pas rentable : pas de marge pour scaler", () => {
    const k = financeKpis({ ...base, adSpend: 6000, newCustomerRevenue: 9000, lifetimeRevenue: 15000, lifetimeCustomers: 50 });
    expect(k.ltvSurCac).toBeLessThan(3);
    expect(k.verdict).toBe("viable");
  });

  it("MER sous 1 ET LTV faible → non rentable, dit que la pub détruit de la valeur", () => {
    const k = financeKpis({ ...base, newCustomerRevenue: 300, lifetimeRevenue: 3000, lifetimeCustomers: 50 });
    expect(k.acquisitionMer).toBeLessThan(1);
    expect(k.verdict).toBe("non_rentable");
    expect(k.note).toMatch(/détruit de la valeur/);
  });

  it("un LTV/CAC flatteur ne masque JAMAIS un MER sous 1 → payback différé, pas 'rentable'", () => {
    const k = financeKpis({ ...base, newCustomerRevenue: 300 }); // MER 0,5 mais LTV/CAC 20
    expect(k.acquisitionMer).toBeLessThan(1);
    expect(k.ltvSurCac).toBeGreaterThanOrEqual(3);
    expect(k.verdict).toBe("payback_differe");
    expect(k.note).toMatch(/trésorerie/i);
  });

  it("dépense sans aucun nouveau client → verdict dédié (pas une division par zéro masquée)", () => {
    const k = financeKpis({ ...base, newCustomers: 0, newCustomerRevenue: 0 });
    expect(k.verdict).toBe("aucun_nouveau_client");
    expect(k.blendedCac).toBeNull();
  });

  it("aucune dépense → no_spend, aucun ratio inventé", () => {
    const k = financeKpis({ adSpend: 0, newCustomers: 4, newCustomerRevenue: 2000 });
    expect(k.verdict).toBe("no_spend");
    expect(k.acquisitionMer).toBeNull();
    expect(k.blendedCac).toBeNull();
  });

  it("entrée vide → ne jette pas et ne fabrique aucun chiffre", () => {
    const k = financeKpis();
    expect(k.verdict).toBe("no_spend");
    expect(k.ltv).toBeNull();
    expect(k.ltvSurCac).toBeNull();
  });
});

describe("declaredAttribution (niveau 3)", () => {
  it("ventile les réponses en parts et classe par volume", () => {
    const d = declaredAttribution([
      { source: "google", count: 12 }, { source: "instagram", count: 6 },
      { source: "bouche-a-oreille", count: 2 },
    ]);
    expect(d.total).toBe(20);
    expect(d.canaux[0]).toMatchObject({ source: "google", count: 12, part: 60 });
    expect(d.exploitable).toBe(true);
  });

  it("normalise la casse/espaces et cumule les doublons", () => {
    const d = declaredAttribution([{ source: " Google " }, { source: "google" }, { source: "GOOGLE" }]);
    expect(d.canaux).toHaveLength(1);
    expect(d.canaux[0].count).toBe(3);
  });

  it("sous 20 réponses → NON exploitable, on refuse de faire lire un % pour un signal", () => {
    const d = declaredAttribution([{ source: "google", count: 3 }]);
    expect(d.exploitable).toBe(false);
    expect(d.note).toMatch(/trop peu/);
  });

  it("ignore les entrées vides ou à compte nul", () => {
    const d = declaredAttribution([{ source: "" }, { source: "google", count: 0 }, null]);
    expect(d.total).toBe(0);
    expect(d.canaux).toHaveLength(0);
  });
});

describe("compareAttributions (niveau 3 vs niveau 1)", () => {
  const declared = declaredAttribution([
    { source: "google", count: 14 }, { source: "meta", count: 4 }, { source: "bouche-a-oreille", count: 12 },
  ]);

  it("repère un canal que les plateformes surestiment largement", () => {
    // Meta s'attribue 40% des conversions ; 13% seulement des clients le déclarent.
    const c = compareAttributions(declared, { meta: 40, google: 30 });
    expect(c.comparable).toBe(true);
    expect(c.surestimes_par_les_plateformes).toContain("meta");
  });

  it("repère un canal sous-estimé (le bouche-à-oreille, invisible des plateformes)", () => {
    const c = compareAttributions(declared, { "bouche-a-oreille": 0, meta: 40 });
    expect(c.sousestimes_par_les_plateformes).toContain("bouche-a-oreille");
  });

  it("échantillon insuffisant → refuse la comparaison plutôt que de conclure", () => {
    const c = compareAttributions(declaredAttribution([{ source: "google", count: 2 }]), { google: 90 });
    expect(c.comparable).toBe(false);
  });
});
