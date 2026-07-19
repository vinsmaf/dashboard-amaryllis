import { describe, it, expect } from "vitest";
import { soldeDueDate, balanceEurosFromCents, canArmAutoDebit, SOLDE_DAYS_BEFORE_CHECKIN } from "./soldeSchedule.js";

describe("soldeDueDate", () => {
  it("calcule J-30 avant l'arrivée", () => {
    expect(soldeDueDate("2027-02-21")).toBe("2027-01-22");
    expect(SOLDE_DAYS_BEFORE_CHECKIN).toBe(30);
  });

  it("gère le passage d'année et les mois courts", () => {
    expect(soldeDueDate("2027-01-15")).toBe("2026-12-16");
    expect(soldeDueDate("2027-03-05")).toBe("2027-02-03"); // février
  });

  it("renvoie '' (refus explicite) sur une entrée invalide — JAMAIS une date bancale", () => {
    // Critique : un due_date vide passerait le filtre SQL `due_date <= today` ("" <= date = VRAI
    // en SQLite) et déclencherait un débit IMMÉDIAT. On refuse donc explicitement.
    for (const bad of ["", null, undefined, 42, "21/02/2027", "2027-2-21", "pas-une-date", {}]) {
      expect(soldeDueDate(bad)).toBe("");
    }
  });
});

describe("balanceEurosFromCents — le piège du ×100", () => {
  it("convertit les centimes du devis en euros pour payment_schedule", () => {
    // 401200 centimes = 4012 € ; poser 401200 tel quel ferait débiter 401 200 € au client.
    expect(balanceEurosFromCents(401200)).toBe(4012);
    expect(balanceEurosFromCents(267400)).toBe(2674);
  });

  it("renvoie 0 sur une valeur invalide, nulle ou négative", () => {
    for (const bad of [0, -100, null, undefined, "abc", NaN, Infinity]) {
      expect(balanceEurosFromCents(bad)).toBe(0);
    }
  });
});

describe("canArmAutoDebit — garde-fou avant d'armer un prélèvement réel", () => {
  const base = { type: "acompte", soldeCents: 401200, checkin: "2027-02-21", today: "2026-07-19" };

  it("arme quand tout est valide et l'échéance est dans le futur", () => {
    expect(canArmAutoDebit(base)).toBe(true);
  });

  it("n'arme QUE pour un acompte (jamais total/solde/group)", () => {
    for (const type of ["total", "solde", "group", "", undefined]) {
      expect(canArmAutoDebit({ ...base, type })).toBe(false);
    }
  });

  it("n'arme pas sans solde réel", () => {
    expect(canArmAutoDebit({ ...base, soldeCents: 0 })).toBe(false);
    expect(canArmAutoDebit({ ...base, soldeCents: null })).toBe(false);
  });

  it("n'arme pas si le checkin est invalide (sinon due_date vide → débit immédiat)", () => {
    expect(canArmAutoDebit({ ...base, checkin: "" })).toBe(false);
    expect(canArmAutoDebit({ ...base, checkin: "21/02/2027" })).toBe(false);
  });

  it("n'arme pas si l'échéance est déjà passée ou aujourd'hui — anti débit immédiat", () => {
    // Arrivée dans 10 jours → J-30 est dans le passé : armer prélèverait le solde sur-le-champ.
    expect(canArmAutoDebit({ ...base, checkin: "2026-07-29", today: "2026-07-19" })).toBe(false);
    // Échéance pile aujourd'hui → refusée aussi (strictement futur exigé).
    expect(canArmAutoDebit({ ...base, checkin: "2026-08-18", today: "2026-07-19" })).toBe(false);
  });
});
