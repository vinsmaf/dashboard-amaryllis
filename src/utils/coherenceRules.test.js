import { describe, it, expect } from "vitest";
import { checkReservations } from "./coherenceRules.js";

const BIENS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent", "bellevue"];
// Fixture saine : la caution (dépôt) est fixe par bien et peut dépasser le total de séjour (court séjour + bien cher).
const ok = { id: "a1", bien: "Villa Amaryllis", voyageur: "Sophie", total: 1200, depot: 500, checkin: "2026-07-01", checkout: "2026-07-08" };

describe("checkReservations", () => {
  it("résa saine -> 0 finding", () => {
    expect(checkReservations([ok], { validBiens: BIENS })).toEqual([]);
  });
  it("résa saine : dépôt > total (caution fixe > court séjour) -> 0 finding", () => {
    // Ex : Mabouya 110€/nuit, caution 500€ — 1 nuit = total 110€ < dépôt 500€ : légitime.
    expect(checkReservations([{ ...ok, total: 110, depot: 500 }], { validBiens: BIENS })).toEqual([]);
  });
  it("dates invalides (checkin >= checkout)", () => {
    const f = checkReservations([{ ...ok, checkin: "2026-07-08", checkout: "2026-07-01" }], { validBiens: BIENS });
    expect(f.some((x) => x.rule === "dates_invalides")).toBe(true);
  });
  it("dates manquantes", () => {
    const f = checkReservations([{ ...ok, checkin: "", checkout: "" }], { validBiens: BIENS });
    expect(f.some((x) => x.rule === "dates_invalides")).toBe(true);
  });
  it("total <= 0 -> total_aberrant", () => {
    expect(checkReservations([{ ...ok, total: 0 }], { validBiens: BIENS }).some((x) => x.rule === "total_aberrant")).toBe(true);
  });
  it("total absurde (> borne)", () => {
    expect(checkReservations([{ ...ok, total: 99999 }], { validBiens: BIENS }).some((x) => x.rule === "total_aberrant")).toBe(true);
  });
  it("bien inconnu", () => {
    expect(checkReservations([{ ...ok, bien: "Chalet Mystère" }], { validBiens: BIENS }).some((x) => x.rule === "bien_inconnu")).toBe(true);
  });
  it("noms d'affichage variés reconnus (Mabouya, Bellevue)", () => {
    expect(checkReservations([{ ...ok, bien: "Mabouya" }], { validBiens: BIENS }).some((x) => x.rule === "bien_inconnu")).toBe(false);
    expect(checkReservations([{ ...ok, bien: "Bellevue Schœlcher" }], { validBiens: BIENS }).some((x) => x.rule === "bien_inconnu")).toBe(false);
  });
  it("double-booking : chevauchement même bien", () => {
    const a = { ...ok, id: "a", checkin: "2026-07-01", checkout: "2026-07-08" };
    const b = { ...ok, id: "b", checkin: "2026-07-05", checkout: "2026-07-10" };
    const f = checkReservations([a, b], { validBiens: BIENS });
    expect(f.filter((x) => x.rule === "double_booking")).toHaveLength(1);
  });
  it("PAS de double-booking si dates jointives (checkout == checkin)", () => {
    const a = { ...ok, id: "a", checkin: "2026-07-01", checkout: "2026-07-08" };
    const b = { ...ok, id: "b", checkin: "2026-07-08", checkout: "2026-07-12" };
    expect(checkReservations([a, b], { validBiens: BIENS }).some((x) => x.rule === "double_booking")).toBe(false);
  });
  it("PAS de double-booking si biens différents", () => {
    const a = { ...ok, id: "a", bien: "Villa Amaryllis", checkin: "2026-07-01", checkout: "2026-07-08" };
    const b = { ...ok, id: "b", bien: "Zandoli", checkin: "2026-07-03", checkout: "2026-07-06" };
    expect(checkReservations([a, b], { validBiens: BIENS }).some((x) => x.rule === "double_booking")).toBe(false);
  });
});
