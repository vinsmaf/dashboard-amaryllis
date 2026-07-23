import { describe, it, expect } from "vitest";
import { discountMarginImpact, promoVerdict, remiseMaxPourCompression, COUTS_CACHES } from "./promoCost.js";

describe("discountMarginImpact — l'exemple canonique de la règle", () => {
  // Prix 100 €, marge brute 60 %, remise 20 % → profit 60 € qui tombe à 40 € = -33 %, pas -20 %.
  const cas = { price: 100, grossMarginPct: 60, discountPct: 20 };

  it("une remise de 20 % comprime le profit de 33 %, pas de 20 %", () => {
    const r = discountMarginImpact(cas);
    expect(r.coutUnitaire).toBe(40);
    expect(r.profitAvant).toBe(60);
    expect(r.prixRemise).toBe(80);
    expect(r.profitApres).toBe(40);
    expect(r.compressionPct).toBe(33.3);
  });

  it("chiffre le volume à vendre en plus juste pour ne rien perdre", () => {
    const r = discountMarginImpact(cas);
    expect(r.volumeCompensateur).toBe(1.5);        // il faut vendre 1,5× plus
    expect(r.ventesSupplementairesPct).toBe(50);   // soit +50 % de volume
  });

  it("l'identité tient : compression = remise / marge", () => {
    for (const [marge, remise] of [[60, 20], [50, 10], [40, 20], [80, 40]]) {
      const r = discountMarginImpact({ price: 100, grossMarginPct: marge, discountPct: remise });
      expect(r.compressionPct).toBeCloseTo((remise / marge) * 100, 1);
    }
  });

  it("plus la marge est faible, plus la même remise fait mal", () => {
    const grosseMarge = discountMarginImpact({ price: 100, grossMarginPct: 80, discountPct: 20 });
    const petiteMarge = discountMarginImpact({ price: 100, grossMarginPct: 30, discountPct: 20 });
    expect(grosseMarge.compressionPct).toBe(25);
    expect(petiteMarge.compressionPct).toBe(66.7);
  });

  it("remise supérieure à la marge → vente à perte, dit sans détour", () => {
    const r = discountMarginImpact({ price: 100, grossMarginPct: 30, discountPct: 40 });
    expect(r.venteAPerte).toBe(true);
    expect(r.profitApres).toBeLessThan(0);
    expect(r.resume).toMatch(/À PERTE/);
    expect(r.volumeCompensateur).toBeNull(); // aucun volume ne rattrape une vente à perte
  });

  it("remise égale à la marge → profit exactement nul", () => {
    const r = discountMarginImpact({ price: 100, grossMarginPct: 25, discountPct: 25 });
    expect(r.profitApres).toBe(0);
    expect(r.resume).toMatch(/tombe à zéro/);
  });

  it("entrées invalides → refuse de calculer plutôt que de sortir un chiffre faux", () => {
    expect(discountMarginImpact({ price: 0, grossMarginPct: 60, discountPct: 20 }).valide).toBe(false);
    expect(discountMarginImpact({ price: 100, grossMarginPct: 0, discountPct: 20 }).valide).toBe(false);
    expect(discountMarginImpact({}).valide).toBe(false);
  });
});

describe("promoVerdict", () => {
  it("gradue la sévérité selon la compression réelle, pas selon le % affiché", () => {
    expect(promoVerdict({ price: 100, grossMarginPct: 80, discountPct: 10 }).niveau).toBe("acceptable"); // 12,5 %
    expect(promoVerdict({ price: 100, grossMarginPct: 60, discountPct: 20 }).niveau).toBe("significatif"); // 33,3 %
    expect(promoVerdict({ price: 100, grossMarginPct: 40, discountPct: 25 }).niveau).toBe("lourd");        // 62,5 %
    expect(promoVerdict({ price: 100, grossMarginPct: 20, discountPct: 30 }).niveau).toBe("interdit");     // à perte
  });

  it("rappelle TOUJOURS les deux coûts non chiffrables avec le chiffre", () => {
    const v = promoVerdict({ price: 100, grossMarginPct: 60, discountPct: 20 });
    expect(v.coutsCaches).toHaveLength(2);
    expect(v.coutsCaches.map((c) => c.id)).toEqual(["comportemental", "algorithmique"]);
  });

  it("les rappelle même quand le calcul est impossible", () => {
    expect(promoVerdict({}).coutsCaches).toEqual(COUTS_CACHES);
  });
});

describe("remiseMaxPourCompression", () => {
  it("borne la remise à une compression de profit acceptable", () => {
    expect(remiseMaxPourCompression({ grossMarginPct: 60, compressionMaxPct: 25 })).toBe(15);
    expect(remiseMaxPourCompression({ grossMarginPct: 40, compressionMaxPct: 25 })).toBe(10);
  });

  it("ne dépasse jamais la marge elle-même (au-delà, c'est la vente à perte)", () => {
    expect(remiseMaxPourCompression({ grossMarginPct: 30, compressionMaxPct: 200 })).toBe(30);
  });

  it("entrées invalides → null", () => {
    expect(remiseMaxPourCompression({ grossMarginPct: 0 })).toBeNull();
    expect(remiseMaxPourCompression({})).toBeNull();
  });
});
