import { describe, it, expect } from "vitest";
import { cacCeiling, planByBien, allocateBudget, evaluateAdset, planExecutionAction, DEFAULTS } from "./adBudgetAgent.js";

describe("cacCeiling", () => {
  it("Amaryllis (280€/nuit) → ~81€ de CAC max (colle au modèle RM-08 ~50-80€)", () => {
    // 280×4=1120 ; ×(0.16−0.015)=162,4 ; ×0.5 = 81
    expect(cacCeiling({ prix: 280 })).toBe(81);
  });

  it("Mabouya (70€/nuit) → 20€ (4 nuits) : sous le seuil viable 25€ → pas de paid dédié", () => {
    // 70×4=280 ; ×0,145=40,6 ; ×0,5 = 20. Studio = séjours plus courts en réalité (l'hypothèse
    // plate 4 nuits le surestime un peu), mais la conclusion tient : < 25€ → zéro paid.
    expect(cacCeiling({ prix: 70 })).toBe(20);
    expect(cacCeiling({ prix: 70 })).toBeLessThan(DEFAULTS.minViableCac);
  });
});

describe("planByBien", () => {
  it("classe les biens par plafond décroissant et flague worthPaid", () => {
    const plan = planByBien();
    // Amaryllis (280€) en tête, worthPaid ; Mabouya (70€) worthPaid=false.
    const amaryllis = plan.find((p) => p.id === "amaryllis");
    const mabouya = plan.find((p) => p.id === "mabouya");
    expect(amaryllis.worthPaid).toBe(true);
    expect(mabouya.worthPaid).toBe(false);
    expect(plan[0].cacCeiling).toBeGreaterThanOrEqual(plan[plan.length - 1].cacCeiling);
    // Iguana (bail long, bookable:false) exclue.
    expect(plan.find((p) => p.id === "iguana")).toBeUndefined();
  });
});

describe("allocateBudget", () => {
  it("répartit 600€ uniquement sur les biens worthPaid, pondéré par le plafond, somme ≈ budget", () => {
    const { allocation, skippedBiens } = allocateBudget(600);
    const eligible = allocation.filter((a) => a.monthlyBudget > 0);
    // RM-08 : zéro paid sur Mabouya/Bellevue/Nogent (commission évitée trop mince).
    for (const id of ["mabouya", "schoelcher", "nogent"]) {
      expect(allocation.find((a) => a.id === id).monthlyBudget).toBe(0);
      expect(skippedBiens).toContain(id);
    }
    // Seuls les gros tickets (Amaryllis/Zandoli/Géko) sont éligibles.
    expect(new Set(eligible.map((a) => a.id))).toEqual(new Set(["amaryllis", "zandoli", "geko"]));
    // Amaryllis (plafond le plus haut) reçoit la plus grosse part parmi les éligibles.
    const amaryllis = allocation.find((a) => a.id === "amaryllis");
    for (const a of eligible) expect(amaryllis.monthlyBudget).toBeGreaterThanOrEqual(a.monthlyBudget);
    // Somme des budgets ≈ 600 (arrondis près).
    const total = allocation.reduce((s, a) => s + a.monthlyBudget, 0);
    expect(Math.abs(total - 600)).toBeLessThanOrEqual(5);
  });
});

describe("evaluateAdset", () => {
  it("ne juge PAS la rentabilité si le tracking conversion est muet (collecting)", () => {
    const r = evaluateAdset({ spend: 40, purchases: 0 }, 80, false);
    expect(r.verdict).toBe("collecting");
    expect(r.realCac).toBeNull();
  });

  it("scale quand le CAC réel est largement sous le plafond", () => {
    const r = evaluateAdset({ spend: 100, purchases: 4 }, 80, true); // CAC 25 ≤ 0.7×80=56
    expect(r.verdict).toBe("scale");
    expect(r.realCac).toBe(25);
  });

  it("cut quand le CAC réel dépasse le plafond (on paie plus que la commission évitée)", () => {
    const r = evaluateAdset({ spend: 300, purchases: 2 }, 80, true); // CAC 150 > 80
    expect(r.verdict).toBe("cut");
    expect(r.margin).toBe(80 - 150);
  });

  it("idle quand aucune dépense", () => {
    expect(evaluateAdset({ spend: 0, purchases: 0 }, 80, true).verdict).toBe("idle");
  });
});

describe("planExecutionAction", () => {
  it("ne fait RIEN sur un ad set non actif, quel que soit le verdict — jamais d'activation", () => {
    // Garde-fou brique 3 : même un verdict "scale" ne doit jamais réveiller un ad set en pause.
    for (const verdict of ["scale", "cut", "hold", "idle"]) {
      const r = planExecutionAction({ verdict, isActive: false, currentBudgetCents: 500, perBienDailyCeilingCents: 2000 });
      expect(r.action).toBe("none");
    }
  });

  it("pause un ad set actif au verdict cut", () => {
    const r = planExecutionAction({ verdict: "cut", isActive: true, currentBudgetCents: 1000, perBienDailyCeilingCents: 3000 });
    expect(r.action).toBe("pause");
  });

  it("augmente le budget de 20% sur un ad set actif au verdict scale, plafonné au bien", () => {
    const r = planExecutionAction({ verdict: "scale", isActive: true, currentBudgetCents: 1000, perBienDailyCeilingCents: 3000 });
    expect(r.action).toBe("increase_budget");
    expect(r.newBudgetCents).toBe(1200); // +20%, sous le plafond 3000
  });

  it("plafonne l'augmentation au budget mensuel/30 du bien — ne dépasse jamais", () => {
    const r = planExecutionAction({ verdict: "scale", isActive: true, currentBudgetCents: 2900, perBienDailyCeilingCents: 3000 });
    expect(r.action).toBe("increase_budget");
    expect(r.newBudgetCents).toBe(3000); // 2900×1.2=3480, capé à 3000
  });

  it("n'augmente pas si déjà au plafond du bien", () => {
    const r = planExecutionAction({ verdict: "scale", isActive: true, currentBudgetCents: 3000, perBienDailyCeilingCents: 3000 });
    expect(r.action).toBe("none");
  });

  it("hold/idle/collecting/unmapped → aucune action sur un ad set actif", () => {
    for (const verdict of ["hold", "idle", "collecting", "unmapped"]) {
      const r = planExecutionAction({ verdict, isActive: true, currentBudgetCents: 1000, perBienDailyCeilingCents: 3000 });
      expect(r.action).toBe("none");
    }
  });
});

describe("DEFAULTS", () => {
  it("expose des hypothèses surchargeables (pas de magie codée en dur)", () => {
    expect(DEFAULTS.bookingRate).toBe(0.16);
    // Surcharge : une commission plus basse baisse le plafond.
    expect(cacCeiling({ prix: 280 }, { bookingRate: 0.10 })).toBeLessThan(cacCeiling({ prix: 280 }));
  });
});
