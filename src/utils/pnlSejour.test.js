import { describe, it, expect } from "vitest";
import { isSejourReel, pnlOneStay, pnlAllStays, appliqueChargesFixes } from "./pnlSejour.js";

// fraisMenage injecté pour des tests déterministes indépendants de la table réelle.
const menage = (bien) => ({ amaryllis: 180, geko: 70, nogent: 45 }[bien] ?? 0);
const opts = { fraisMenageFn: menage };

describe("isSejourReel — filtre blocs iCal / annulations", () => {
  it("accepte un vrai séjour payé", () => {
    expect(isSejourReel({ montant: 500, status: "Confirmé" })).toBe(true);
  });
  it("rejette un bloc iCal CLOSED (montant 0)", () => {
    expect(isSejourReel({ montant: 0, status: "Confirmé", notes: "CLOSED - Not available" })).toBe(false);
  });
  it("rejette une annulation", () => {
    expect(isSejourReel({ montant: 500, status: "Annulé" })).toBe(false);
    expect(isSejourReel({ montant: 500, status: "cancelled" })).toBe(false);
  });
  it("rejette montant nul ou négatif", () => {
    expect(isSejourReel({ montant: 0 })).toBe(false);
    expect(isSejourReel({ montant: -10 })).toBe(false);
  });
});

describe("pnlOneStay — décompose le CA en coûts variables (FAIT)", () => {
  it("séjour Booking : commission 17% + ménage, pas de Stripe", () => {
    const p = pnlOneStay({ bienId: "geko", canal: "booking", montant: 1000, nights: 5 }, opts);
    expect(p.commission).toBe(170);   // 1000 × 17%
    expect(p.stripe).toBe(0);          // pas direct
    expect(p.menage).toBe(70);
    expect(p.marge).toBe(1000 - 170 - 70); // 760
    expect(p.margePct).toBe(76);
    expect(p.margeParNuit).toBe(152);
  });

  it("séjour direct : Stripe 1,5%, pas de commission OTA", () => {
    const p = pnlOneStay({ bienId: "geko", canal: "direct", montant: 1000, nights: 5 }, opts);
    expect(p.commission).toBe(0);
    expect(p.stripe).toBe(15);         // 1000 × 1,5%
    expect(p.menage).toBe(70);
    expect(p.marge).toBe(1000 - 15 - 70); // 915
  });

  it("séjour Airbnb Amaryllis : commission 15% par bien + ménage 180€", () => {
    const p = pnlOneStay({ bienId: "amaryllis", canal: "airbnb", montant: 2000, nights: 7 }, opts);
    expect(p.commission).toBe(300);    // 2000 × 15%
    expect(p.menage).toBe(180);
    expect(p.marge).toBe(2000 - 300 - 180); // 1520
  });

  it("le ménage FIXE écrase un séjour court à l'Amaryllis (le point du chantier)", () => {
    const court = pnlOneStay({ bienId: "amaryllis", canal: "booking", montant: 280, nights: 1 }, opts);
    // 280 − 47,6 (17%) − 180 = 52,4 → seulement 19% de marge sur une nuit
    expect(court.marge).toBeCloseTo(52.4, 1);
    expect(court.margePct).toBe(19);
  });

  it("CA nul → ratios à 0/null, pas de division par zéro (le ménage reste un coût)", () => {
    const p = pnlOneStay({ bienId: "geko", canal: "booking", montant: 0, nights: 0 }, opts);
    expect(p.marge).toBe(-70);     // 0 CA mais 70€ de ménage engagé → marge négative
    expect(p.margePct).toBe(0);    // garde anti-division par zéro
    expect(p.margeParNuit).toBe(null);
  });
});

describe("pnlAllStays — agrégation par canal et par bien", () => {
  const resas = [
    { id: "1", bienId: "geko", canal: "booking", montant: 1000, nights: 5, checkin: "2025-06-01", status: "Confirmé" },
    { id: "2", bienId: "geko", canal: "direct",  montant: 1000, nights: 5, checkin: "2025-07-01", status: "Confirmé" },
    { id: "3", bienId: "amaryllis", canal: "airbnb", montant: 2000, nights: 7, checkin: "2025-08-01", status: "Confirmé" },
    { id: "4", bienId: "geko", canal: "booking", montant: 500, nights: 2, checkin: "2026-01-01", status: "Confirmé" }, // autre année
    { id: "5", bienId: "geko", canal: "booking", montant: 0, nights: 28, checkin: "2025-03-01", status: "Confirmé", notes: "CLOSED - Not available" }, // bloc
  ];

  it("filtre l'année, les blocs, et agrège", () => {
    const r = pnlAllStays(resas, "2025", opts);
    expect(r.stays.length).toBe(3);        // #4 (2026) et #5 (bloc) exclus
    expect(r.global.ca).toBe(4000);
    // marges : booking 760, direct 915, airbnb 1520 → total 3195
    expect(r.global.marge).toBe(3195);
    expect(r.parCanal.booking.count).toBe(1);
    expect(r.parCanal.direct.marge).toBe(915);
    expect(r.parBien.geko.count).toBe(2);   // booking + direct
  });

  it("trie les séjours par marge décroissante", () => {
    const r = pnlAllStays(resas, "2025", opts);
    expect(r.stays[0].marge).toBe(1520);   // airbnb amaryllis en tête
    expect(r.stays[r.stays.length - 1].marge).toBe(760); // booking geko en dernier
  });

  it("year null → toutes années", () => {
    const r = pnlAllStays(resas, null, opts);
    expect(r.stays.length).toBe(4);        // seul le bloc CLOSED exclu
  });

  it("le CA ment : direct nette plus que booking à CA identique", () => {
    const r = pnlAllStays(resas, "2025", opts);
    expect(r.parCanal.direct.ca).toBe(r.parCanal.booking.ca); // 1000 = 1000
    expect(r.parCanal.direct.marge).toBeGreaterThan(r.parCanal.booking.marge); // 915 > 760
  });
});

describe("appliqueChargesFixes — allocation €/nuit (HYPOTHÈSE)", () => {
  const resas = [
    { id: "1", bienId: "geko", canal: "direct", montant: 1000, nights: 5, checkin: "2025-06-01", status: "Confirmé" },
  ];
  it("off (0) → renvoie le P&L intact, aucun champ estimé", () => {
    const pnl = pnlAllStays(resas, "2025", opts);
    const out = appliqueChargesFixes(pnl, 0);
    expect(out.stays[0].netEstime).toBeUndefined();
    expect(out.netGlobalEstime).toBeUndefined();
  });
  it("30€/nuit × 5 nuits = 150 déduits de la marge de contribution", () => {
    const pnl = pnlAllStays(resas, "2025", opts);
    const out = appliqueChargesFixes(pnl, 30);
    // marge contribution = 1000 − 15 − 70 = 915 ; net = 915 − 150 = 765
    expect(out.stays[0].chargeFixe).toBe(150);
    expect(out.stays[0].netEstime).toBe(765);
    expect(out.netGlobalEstime).toBe(765);
  });
  it("refuse un curseur négatif (clampé à 0 = off)", () => {
    const pnl = pnlAllStays(resas, "2025", opts);
    expect(appliqueChargesFixes(pnl, -5).stays[0].netEstime).toBeUndefined();
  });
});
