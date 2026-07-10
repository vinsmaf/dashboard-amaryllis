import { describe, it, expect } from "vitest";
import { daysInMonth, last12Months, buildRevenueSummary, computeAdr } from "./revenueSummary.js";

const BIENS = ["amaryllis", "nogent"];
const REF = new Date("2026-07-10T12:00:00Z"); // aligné sur "aujourd'hui" du projet

// Fixture minimale : amaryllis a des données 2025 (juil-déc) et 2026 (jan-juil), nogent rien.
const YEARS = {
  2025: {
    amaryllis: {
      ca: [0, 0, 0, 0, 0, 0, 1000, 2000, 0, 0, 0, 3100],
      nuits: [0, 0, 0, 0, 0, 0, 10, 20, 0, 0, 0, 31],
      charges: [0, 0, 0, 0, 0, 0, 300, 300, 0, 0, 0, 300],
      cashflow: [0, 0, 0, 0, 0, 0, 700, 1700, 0, 0, 0, 2800],
    },
  },
  2026: {
    amaryllis: {
      ca: [500, 0, 0, 0, 0, 0, 4800],
      nuits: [5, 0, 0, 0, 0, 0, 1],
      charges: [300, 300, 300, 300, 300, 300, 300],
      cashflow: [200, -300, -300, -300, -300, -300, 4500],
    },
    muscade: { cashflow: [725, 725, 725, 725, 725, 725, 725] },
    t4_amaryllis: { charges: [440, 440, 440, 440, 440, 440, 440], cashflow: [-440, -440, -440, -440, -440, -440, -440] },
  },
};

describe("daysInMonth", () => {
  it("mois à 31 jours", () => expect(daysInMonth(2026, 7)).toBe(31));
  it("mois à 30 jours", () => expect(daysInMonth(2026, 6)).toBe(30));
  it("février année bissextile", () => expect(daysInMonth(2028, 2)).toBe(29));
  it("février année non bissextile", () => expect(daysInMonth(2026, 2)).toBe(28));
});

describe("last12Months", () => {
  it("12 mois glissants se terminant au mois courant, chronologique", () => {
    const months = last12Months(REF);
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ year: 2025, month: 8 });
    expect(months[11]).toEqual({ year: 2026, month: 7 });
  });
  it("passage d'année (refDate en janvier)", () => {
    const months = last12Months(new Date("2026-01-15T12:00:00Z"));
    expect(months[0]).toEqual({ year: 2025, month: 2 });
    expect(months[11]).toEqual({ year: 2026, month: 1 });
  });
});

describe("computeAdr — garde-fou de plausibilité", () => {
  it("cas normal : dans la fourchette [0.3x, 3x] du prix de base", () => {
    expect(computeAdr(2800, 10, 280)).toBe(280); // = prix de base pile
  });
  it("séjour à cheval sur 2 mois (nuits quasi nulles, ca plein) -> null", () => {
    // reproduit le cas réel vérifié en live : Amaryllis juillet 2026, ca=4800/nuits=1 (prix base 280)
    expect(computeAdr(4800, 1, 280)).toBeNull();
  });
  it("trop bas (promo agressive hors fourchette) -> null", () => {
    expect(computeAdr(50, 10, 280)).toBeNull(); // 5€/nuit < 0.3×280=84
  });
  it("nuits = 0 -> null (division par zéro évitée)", () => {
    expect(computeAdr(1000, 0, 280)).toBeNull();
  });
  it("pas de prix de base (bien patrimoine, ex. Muscade/T4) -> toujours null", () => {
    expect(computeAdr(1000, 10, undefined)).toBeNull();
  });
  it("ca ou nuits null -> null", () => {
    expect(computeAdr(null, 10, 280)).toBeNull();
    expect(computeAdr(1000, null, 280)).toBeNull();
  });
});

describe("buildRevenueSummary — forme du payload", () => {
  const out = buildRevenueSummary(YEARS, BIENS, REF, "2026-07-10T12:00:00.000Z");

  it("champs top-level", () => {
    expect(out.version).toBe(1);
    expect(out.generated_at).toBe("2026-07-10T12:00:00.000Z");
    expect(out.months).toHaveLength(12);
    expect(out.ytd).toBeTypeOf("object");
  });

  it("chaque mois a les 6 champs attendus pour chaque bien location", () => {
    const m = out.months[0];
    expect(m).toHaveProperty("total_ca");
    expect(m).toHaveProperty("total_nuits");
    expect(m).toHaveProperty("total_charges");
    expect(m).toHaveProperty("total_cashflow");
    BIENS.forEach((id) => {
      const fields = Object.keys(m.par_bien[id]).sort();
      expect(fields).toEqual(["adr", "ca", "cashflow", "charges", "nuits", "occ"]);
    });
  });

  it("mois le plus ancien = 2025-08, le plus récent = 2026-07", () => {
    expect(out.months[0].month).toBe("2025-08");
    expect(out.months[11].month).toBe("2026-07");
  });

  it("Muscade et T4 Amaryllis toujours présents, même si absents du bienIds appelant", () => {
    const juil2026 = out.months.find((m) => m.month === "2026-07");
    expect(juil2026.par_bien).toHaveProperty("muscade");
    expect(juil2026.par_bien).toHaveProperty("t4_amaryllis");
  });
});

describe("buildRevenueSummary — cas de calcul réel", () => {
  const out = buildRevenueSummary(YEARS, BIENS, REF, "2026-07-10T12:00:00.000Z");

  it("août 2025 (20 nuits/31j) : ca, nuits, occ, charges, cashflow corrects pour amaryllis", () => {
    const aout2025 = out.months.find((m) => m.month === "2025-08");
    expect(aout2025.par_bien.amaryllis.ca).toBe(2000);
    expect(aout2025.par_bien.amaryllis.nuits).toBe(20);
    expect(aout2025.par_bien.amaryllis.occ).toBeCloseTo(64.5, 1); // 20/31*100
    expect(aout2025.par_bien.amaryllis.charges).toBe(300);
    expect(aout2025.par_bien.amaryllis.cashflow).toBe(1700);
  });

  it("bien sans données (nogent) -> ca/nuits/occ/charges/cashflow/adr tous null ou 0, jamais de crash", () => {
    const aout2025 = out.months.find((m) => m.month === "2025-08");
    expect(aout2025.par_bien.nogent).toEqual({ ca: 0, nuits: null, occ: null, charges: null, cashflow: null, adr: null });
  });

  it("juillet 2026 : adr absurde (4800€/1 nuit) mis à null par le garde-fou de plausibilité", () => {
    const juil2026 = out.months.find((m) => m.month === "2026-07");
    expect(juil2026.par_bien.amaryllis.ca).toBe(4800);
    expect(juil2026.par_bien.amaryllis.nuits).toBe(1);
    expect(juil2026.par_bien.amaryllis.adr).toBeNull();
  });

  it("Muscade (bail long) : ca/nuits/occ/charges null, cashflow = valeur carry-forward du Sheet", () => {
    const juil2026 = out.months.find((m) => m.month === "2026-07");
    expect(juil2026.par_bien.muscade).toEqual({ ca: null, nuits: null, occ: null, charges: null, cashflow: 725, adr: null });
  });

  it("T4 Amaryllis (résidence perso) : ca=0 CONNU (pas null), charges/cashflow réels, adr toujours null", () => {
    const juil2026 = out.months.find((m) => m.month === "2026-07");
    expect(juil2026.par_bien.t4_amaryllis).toEqual({ ca: 0, nuits: null, occ: null, charges: 440, cashflow: -440, adr: null });
  });

  it("total_charges/total_cashflow incluent Muscade+T4 ; total_ca/total_nuits restent scopés aux biens location", () => {
    const juil2026 = out.months.find((m) => m.month === "2026-07");
    // total_ca = amaryllis(4800) + nogent(0) uniquement (Muscade/T4 hors périmètre location)
    expect(juil2026.total_ca).toBe(4800);
    expect(juil2026.total_nuits).toBe(1);
    // total_charges = amaryllis(300) + nogent(null->0) + muscade(null->0) + t4(440)
    expect(juil2026.total_charges).toBe(740);
    // total_cashflow = amaryllis(4500) + nogent(0) + muscade(725) + t4(-440)
    expect(juil2026.total_cashflow).toBe(4785);
  });

  it("YTD 2026 : nuits agrège uniquement les mois où la donnée est connue (jamais null->0 silencieux)", () => {
    // amaryllis 2026 jan-juil : nuits connus tous les mois (5,0,0,0,0,0,1) -> somme 6
    expect(out.ytd.par_bien.amaryllis.nuits).toBe(6);
    expect(out.ytd.par_bien.amaryllis.ca).toBe(500 + 4800);
    // Muscade : nuits jamais connu sur la fenêtre YTD -> null, pas 0
    expect(out.ytd.par_bien.muscade.nuits).toBeNull();
    expect(out.ytd.par_bien.muscade.occ).toBeNull();
    expect(out.ytd.par_bien.muscade.cashflow).toBe(725 * 7);
  });

  it("année absente des données (yearsData) -> mois à zéro/null, pas de crash", () => {
    const outVide = buildRevenueSummary({}, BIENS, REF);
    expect(outVide.months).toHaveLength(12);
    expect(outVide.months[0].total_ca).toBe(0);
    expect(outVide.ytd.total_ca).toBe(0);
    expect(outVide.months[0].par_bien.muscade).toEqual({ ca: null, nuits: null, occ: null, charges: null, cashflow: null, adr: null });
  });
});
