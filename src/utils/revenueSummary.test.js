import { describe, it, expect } from "vitest";
import { daysInMonth, last12Months, buildRevenueSummary } from "./revenueSummary.js";

const BIENS = ["amaryllis", "nogent"];
const REF = new Date("2026-07-10T12:00:00Z"); // aligné sur "aujourd'hui" du projet

// Fixture minimale : amaryllis a des données 2025 (juil-déc) et 2026 (jan-juil), nogent rien.
const YEARS = {
  2025: {
    amaryllis: { ca: [0, 0, 0, 0, 0, 0, 1000, 2000, 0, 0, 0, 3100], nuits: [0, 0, 0, 0, 0, 0, 10, 20, 0, 0, 0, 31] },
  },
  2026: {
    amaryllis: { ca: [500, 0, 0, 0, 0, 0, 900], nuits: [5, 0, 0, 0, 0, 0, 9] },
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

describe("buildRevenueSummary — forme du payload", () => {
  const out = buildRevenueSummary(YEARS, BIENS, REF, "2026-07-10T12:00:00.000Z");

  it("champs top-level", () => {
    expect(out.version).toBe(1);
    expect(out.generated_at).toBe("2026-07-10T12:00:00.000Z");
    expect(out.months).toHaveLength(12);
    expect(out.ytd).toBeTypeOf("object");
  });

  it("chaque mois a la forme attendue", () => {
    const m = out.months[0];
    expect(m).toHaveProperty("month");
    expect(m).toHaveProperty("par_bien");
    expect(m).toHaveProperty("total_ca");
    expect(m).toHaveProperty("total_nuits");
    BIENS.forEach((id) => {
      expect(m.par_bien[id]).toHaveProperty("ca");
      expect(m.par_bien[id]).toHaveProperty("nuits");
      expect(m.par_bien[id]).toHaveProperty("occ");
    });
  });

  it("mois le plus ancien = 2025-08, le plus récent = 2026-07", () => {
    expect(out.months[0].month).toBe("2025-08");
    expect(out.months[11].month).toBe("2026-07");
  });
});

describe("buildRevenueSummary — cas de calcul réel", () => {
  const out = buildRevenueSummary(YEARS, BIENS, REF, "2026-07-10T12:00:00.000Z");

  it("août 2025 (20 nuits/31j) : ca, nuits et occ corrects pour amaryllis", () => {
    const aout2025 = out.months.find((m) => m.month === "2025-08");
    expect(aout2025.par_bien.amaryllis.ca).toBe(2000);
    expect(aout2025.par_bien.amaryllis.nuits).toBe(20);
    // occ = 20/31*100 = 64.516... arrondi à 1 décimale = 64.5
    expect(aout2025.par_bien.amaryllis.occ).toBeCloseTo(64.5, 1);
  });

  it("bien sans données (nogent) -> ca=0, nuits=0, occ=0, jamais de crash", () => {
    const aout2025 = out.months.find((m) => m.month === "2025-08");
    expect(aout2025.par_bien.nogent).toEqual({ ca: 0, nuits: 0, occ: 0 });
  });

  it("total_ca / total_nuits = somme des biens du mois", () => {
    const dec2025 = out.months.find((m) => m.month === "2025-12");
    expect(dec2025.total_ca).toBe(3100);
    expect(dec2025.total_nuits).toBe(31);
  });

  it("YTD 2026 = somme jan-juillet (seuls mois avec données dans la fixture : jan + juil)", () => {
    expect(out.ytd.total_ca).toBe(500 + 900);
    expect(out.ytd.total_nuits).toBe(5 + 9);
    expect(out.ytd.par_bien.amaryllis.ca).toBe(1400);
  });

  it("année absente des données (yearsData) -> mois à zéro, pas de crash", () => {
    const outVide = buildRevenueSummary({}, BIENS, REF);
    expect(outVide.months).toHaveLength(12);
    expect(outVide.months[0].total_ca).toBe(0);
    expect(outVide.ytd.total_ca).toBe(0);
  });
});
