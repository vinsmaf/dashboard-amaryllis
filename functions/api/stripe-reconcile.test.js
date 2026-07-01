// functions/api/stripe-reconcile.test.js
import { describe, it, expect } from "vitest";
import { centsToEuros, parseBalanceTransaction, summarizePayoutTransactions } from "./stripe-reconcile.js";

describe("centsToEuros", () => {
  it("convertit des centimes en euros", () => {
    expect(centsToEuros(150000)).toBe(1500);
    expect(centsToEuros(1099)).toBe(10.99);
  });
  it("gère les valeurs absentes", () => {
    expect(centsToEuros(null)).toBe(0);
    expect(centsToEuros(undefined)).toBe(0);
  });
});

describe("parseBalanceTransaction", () => {
  const bookingByPI = new Map([
    ["pi_123", { voyageur: "Jean Dupont", bien_nom: "Villa Amaryllis" }],
  ]);

  it("rattache une charge à une résa directe connue via payment_intent", () => {
    const bt = {
      id: "txn_1", type: "charge", amount: 150000, fee: 4500, net: 145500,
      created: 1751500000, source: { payment_intent: "pi_123" },
    };
    const parsed = parseBalanceTransaction(bt, bookingByPI);
    expect(parsed.matched).toBe(true);
    expect(parsed.guestName).toBe("Jean Dupont");
    expect(parsed.bienNom).toBe("Villa Amaryllis");
    expect(parsed.amount).toBe(1500);
    expect(parsed.fee).toBe(45);
    expect(parsed.net).toBe(1455);
    expect(parsed.typeLabel).toBe("Paiement");
  });

  it("ne rattache rien si le payment_intent est inconnu", () => {
    const bt = { id: "txn_2", type: "charge", amount: 20000, fee: 600, net: 19400, source: { payment_intent: "pi_999" } };
    const parsed = parseBalanceTransaction(bt, bookingByPI);
    expect(parsed.matched).toBe(false);
    expect(parsed.guestName).toBeNull();
  });

  it("ne plante pas si source est absent (ex: ligne de frais autonome)", () => {
    const bt = { id: "txn_3", type: "stripe_fee", amount: -500, fee: 0, net: -500 };
    const parsed = parseBalanceTransaction(bt, bookingByPI);
    expect(parsed.matched).toBe(false);
    expect(parsed.paymentIntentId).toBeNull();
    expect(parsed.typeLabel).toBe("Frais Stripe");
  });

  it("garde le type brut si pas de libellé connu", () => {
    const bt = { id: "txn_4", type: "topup", amount: 1000, fee: 0, net: 1000 };
    const parsed = parseBalanceTransaction(bt, bookingByPI);
    expect(parsed.typeLabel).toBe("topup");
  });
});

describe("summarizePayoutTransactions", () => {
  it("agrège brut/frais/matched/unmatched sur les charges uniquement", () => {
    const transactions = [
      { type: "charge", amount: 1500, fee: 45, matched: true },
      { type: "charge", amount: 200, fee: 6, matched: false },
      { type: "stripe_fee", amount: -10, fee: 0, matched: false }, // ne compte pas comme "charge"
    ];
    const summary = summarizePayoutTransactions(transactions);
    expect(summary.grossFromCharges).toBe(1700);
    expect(summary.totalFees).toBe(51); // inclut les frais de la ligne stripe_fee aussi (0 ici)
    expect(summary.matchedCount).toBe(1);
    expect(summary.unmatchedCount).toBe(1);
    expect(summary.chargesCount).toBe(2);
  });

  it("gère une liste vide", () => {
    const summary = summarizePayoutTransactions([]);
    expect(summary.grossFromCharges).toBe(0);
    expect(summary.totalFees).toBe(0);
    expect(summary.matchedCount).toBe(0);
    expect(summary.unmatchedCount).toBe(0);
  });

  it("compte aussi le type 'payment' comme une charge (nomenclature Stripe récente)", () => {
    const summary = summarizePayoutTransactions([{ type: "payment", amount: 500, fee: 15, matched: true }]);
    expect(summary.chargesCount).toBe(1);
    expect(summary.grossFromCharges).toBe(500);
  });
});
