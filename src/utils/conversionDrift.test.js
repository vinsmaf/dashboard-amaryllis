import { describe, it, expect } from "vitest";
import { conversionRate, detectConversionDrop, worstStepDrop, findWorstBienForStep } from "./conversionDrift.js";

describe("conversionRate", () => {
  it("calcule purchase/viewItem", () => {
    expect(conversionRate(10, 100)).toBeCloseTo(0.1);
  });
  it("retourne null si viewItem = 0", () => {
    expect(conversionRate(0, 0)).toBeNull();
  });
});

describe("detectConversionDrop", () => {
  it("détecte une baisse > 30%", () => {
    const current = { viewItem: 200, purchase: 5 };   // 2.5%
    const previous = { viewItem: 200, purchase: 10 }; // 5%
    const res = detectConversionDrop(current, previous);
    expect(res).not.toBeNull();
    expect(res.dropPct).toBeLessThanOrEqual(-30);
  });

  it("ignore une baisse < 30%", () => {
    const current = { viewItem: 200, purchase: 9 };
    const previous = { viewItem: 200, purchase: 10 };
    expect(detectConversionDrop(current, previous)).toBeNull();
  });

  it("ignore si volume insuffisant (anti-bruit)", () => {
    const current = { viewItem: 5, purchase: 0 };
    const previous = { viewItem: 5, purchase: 2 };
    expect(detectConversionDrop(current, previous)).toBeNull();
  });

  it("retourne null si pas de snapshot précédent", () => {
    expect(detectConversionDrop({ viewItem: 100, purchase: 5 }, null)).toBeNull();
  });

  it("retourne null si previousRate = 0 (division par zéro évitée)", () => {
    const current = { viewItem: 100, purchase: 5 };
    const previous = { viewItem: 100, purchase: 0 };
    expect(detectConversionDrop(current, previous)).toBeNull();
  });

  it("seuil personnalisable", () => {
    const current = { viewItem: 100, purchase: 9 };
    const previous = { viewItem: 100, purchase: 10 };
    expect(detectConversionDrop(current, previous, { dropThreshold: 0.05 })).not.toBeNull();
  });
});

describe("worstStepDrop", () => {
  it("détecte une baisse sur add_payment_info→purchase", () => {
    const current = { beginCheckout: 100, addPaymentInfo: 80, purchase: 20 };  // 25%
    const previous = { beginCheckout: 100, addPaymentInfo: 80, purchase: 40 }; // 50%
    const res = worstStepDrop(current, previous);
    expect(res).not.toBeNull();
    expect(res.step).toBe("api_to_purchase");
    expect(res.dropPct).toBeLessThanOrEqual(-30);
  });

  it("détecte une baisse sur begin_checkout→add_payment_info", () => {
    const current = { beginCheckout: 100, addPaymentInfo: 20, purchase: 15 };  // 20%
    const previous = { beginCheckout: 100, addPaymentInfo: 50, purchase: 15 }; // 50%
    const res = worstStepDrop(current, previous);
    expect(res).not.toBeNull();
    expect(res.step).toBe("bc_to_api");
  });

  it("renvoie le maillon le PLUS dégradé quand les 2 étapes baissent", () => {
    const current = { beginCheckout: 100, addPaymentInfo: 30, purchase: 5 };   // bc→api: 30%, api→purchase: 16.7%
    const previous = { beginCheckout: 100, addPaymentInfo: 80, purchase: 40 }; // bc→api: 80%, api→purchase: 50%
    const res = worstStepDrop(current, previous);
    // bc→api chute de -62.5%, api→purchase chute de -66.7% (plus fort)
    expect(res.step).toBe("api_to_purchase");
  });

  it("ignore une baisse < seuil", () => {
    const current = { beginCheckout: 100, addPaymentInfo: 80, purchase: 38 };
    const previous = { beginCheckout: 100, addPaymentInfo: 80, purchase: 40 };
    expect(worstStepDrop(current, previous)).toBeNull();
  });

  it("ignore si volume insuffisant (anti-bruit)", () => {
    const current = { beginCheckout: 5, addPaymentInfo: 2, purchase: 0 };
    const previous = { beginCheckout: 5, addPaymentInfo: 4, purchase: 3 };
    expect(worstStepDrop(current, previous)).toBeNull();
  });

  it("exclut add_payment_info→purchase si achats hors tunnel (purchase > addPaymentInfo)", () => {
    // Cas WhatsApp/devis : purchase dépasse add_payment_info, ratio non interprétable
    const current = { beginCheckout: 100, addPaymentInfo: 20, purchase: 50 };
    const previous = { beginCheckout: 100, addPaymentInfo: 60, purchase: 55 };
    const res = worstStepDrop(current, previous);
    // seule bc_to_api reste exploitable (100→20 vs 100→60, grosse baisse)
    expect(res?.step).toBe("bc_to_api");
  });

  it("retourne null si pas de snapshot précédent", () => {
    expect(worstStepDrop({ beginCheckout: 100, addPaymentInfo: 50, purchase: 10 }, null)).toBeNull();
  });

  it("seuil et volume personnalisables", () => {
    const current = { beginCheckout: 20, addPaymentInfo: 15, purchase: 5 };
    const previous = { beginCheckout: 20, addPaymentInfo: 16, purchase: 6 };
    expect(worstStepDrop(current, previous, { minVolume: 30 })).toBeNull(); // volume trop bas pour le seuil custom
    expect(worstStepDrop(current, previous, { minVolume: 10, dropThreshold: 0.05 })).not.toBeNull();
  });
});

describe("findWorstBienForStep", () => {
  const rows = [
    { eventName: "begin_checkout", "customEvent:bien_id": "amaryllis", eventCount: 50 },
    { eventName: "add_payment_info", "customEvent:bien_id": "amaryllis", eventCount: 40 }, // 80%
    { eventName: "begin_checkout", "customEvent:bien_id": "mabouya", eventCount: 30 },
    { eventName: "add_payment_info", "customEvent:bien_id": "mabouya", eventCount: 6 },    // 20% ← pire
    { eventName: "add_payment_info", "customEvent:bien_id": "mabouya", eventCount: 3 },     // 3 sur purchase (ignoré ici)
    { eventName: "purchase", "customEvent:bien_id": "mabouya", eventCount: 3 },
  ];

  it("désigne le bien le moins performant sur begin_checkout→add_payment_info", () => {
    expect(findWorstBienForStep(rows, "bc_to_api")).toBe("mabouya");
  });

  it("ignore un bien sous le volume minimum", () => {
    const lowVolume = [
      { eventName: "begin_checkout", "customEvent:bien_id": "nogent", eventCount: 2 },
      { eventName: "add_payment_info", "customEvent:bien_id": "nogent", eventCount: 0 },
    ];
    expect(findWorstBienForStep(lowVolume, "bc_to_api")).toBeNull();
  });

  it("retourne null si funnelByBien vide/absent (best-effort, jamais de faux positif)", () => {
    expect(findWorstBienForStep([], "bc_to_api")).toBeNull();
    expect(findWorstBienForStep(null, "bc_to_api")).toBeNull();
    expect(findWorstBienForStep(undefined, "bc_to_api")).toBeNull();
  });

  it("retourne null pour une étape inconnue", () => {
    expect(findWorstBienForStep(rows, "etape-inexistante")).toBeNull();
  });
});
