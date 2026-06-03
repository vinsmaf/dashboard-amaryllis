import { describe, it, expect } from "vitest";
import { airbnbComm, commissionTaux, AIRBNB_COMM_DEFAUT, BOOKING_COMM, FRAIS_STRIPE } from "./canauxCommissions.js";

describe("airbnbComm — par bien", () => {
  it("15% pour amaryllis et nogent", () => { expect(airbnbComm("amaryllis")).toBe(0.15); expect(airbnbComm("nogent")).toBe(0.15); });
  it("3% pour geko/zandoli/mabouya/schoelcher/iguana", () => {
    ["geko","zandoli","mabouya","schoelcher","iguana"].forEach(id => expect(airbnbComm(id)).toBe(0.03));
  });
  it("défaut 15% pour bien inconnu", () => { expect(airbnbComm("inconnu")).toBe(AIRBNB_COMM_DEFAUT); expect(AIRBNB_COMM_DEFAUT).toBe(0.15); });
});

describe("commissionTaux — par canal", () => {
  it("airbnb = taux par bien", () => { expect(commissionTaux("airbnb","amaryllis")).toBe(0.15); expect(commissionTaux("airbnb","geko")).toBe(0.03); });
  it("booking = 17% partout", () => { expect(commissionTaux("booking","geko")).toBe(0.17); expect(BOOKING_COMM).toBe(0.17); });
  it("direct/beds24/autre = 0%", () => { expect(commissionTaux("direct","amaryllis")).toBe(0); expect(commissionTaux("beds24","geko")).toBe(0); });
});

describe("net encaissé", () => {
  it("net direct = total - frais Stripe", () => {
    const total = 1000; const net = total * (1 - FRAIS_STRIPE);
    expect(FRAIS_STRIPE).toBe(0.015); expect(net).toBe(985);
  });
  it("net Airbnb amaryllis = total * (1 - 0.15)", () => {
    expect(1000 * (1 - commissionTaux("airbnb","amaryllis"))).toBe(850);
  });
});
