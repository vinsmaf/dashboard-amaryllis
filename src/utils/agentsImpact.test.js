import { describe, it, expect } from "vitest";
import { computeImpacts, normalizeGa4Date, toYMD, addDays } from "./agentsImpact.js";

// Helper : unix sec pour un jour UTC à midi (évite tout effet de bord de minuit)
const ts = ymd => Math.floor(new Date(ymd + "T12:00:00Z").getTime() / 1000);

describe("normalizeGa4Date", () => {
  it("convertit le format GA4 YYYYMMDD", () => {
    expect(normalizeGa4Date("20260701")).toBe("2026-07-01");
  });
  it("laisse passer une date déjà normalisée", () => {
    expect(normalizeGa4Date("2026-07-01")).toBe("2026-07-01");
  });
  it("tolère null/undefined", () => {
    expect(normalizeGa4Date(null)).toBe("");
  });
});

describe("toYMD / addDays", () => {
  it("toYMD en UTC", () => { expect(toYMD(ts("2026-06-15"))).toBe("2026-06-15"); });
  it("addDays franchit les mois", () => {
    expect(addDays("2026-06-30", 2)).toBe("2026-07-02");
    expect(addDays("2026-07-01", -2)).toBe("2026-06-29");
  });
});

describe("computeImpacts — cas nominal", () => {
  const sessions = {
    "2026-06-13": 10, "2026-06-14": 20, // avant (J-2, J-1)
    "2026-06-15": 999,                   // jour J — neutre, ignoré
    "2026-06-16": 40, "2026-06-17": 50,  // après (J+1, J+2)
  };
  const pubs = [{ id: 1, publishedAt: ts("2026-06-15"), platform: "both" }];

  it("fenêtres J-2..J-1 vs J+1..J+2, jour J exclu", () => {
    const { publications } = computeImpacts(pubs, sessions, { today: "2026-06-25" });
    expect(publications[0]).toMatchObject({
      id: 1, date: "2026-06-15",
      sessionsAvant: 30, sessionsApres: 90,
      delta: 60, deltaPct: 200, incomplete: false,
    });
  });

  it("conserve les champs passthrough (canaux, etc.)", () => {
    const { publications } = computeImpacts(pubs, sessions, { today: "2026-06-25" });
    expect(publications[0].platform).toBe("both");
  });

  it("summary : count, moyenne, best/worst", () => {
    const twoPubs = [
      { id: 1, publishedAt: ts("2026-06-15") },
      { id: 2, publishedAt: ts("2026-06-18") }, // avant: 16+17=90, après: 19+20 absents → 0
    ];
    const { summary } = computeImpacts(twoPubs, sessions, { today: "2026-06-25" });
    expect(summary.count).toBe(2);
    expect(summary.completeCount).toBe(2);
    expect(summary.avgDelta).toBe((60 + -90) / 2);
    expect(summary.best).toMatchObject({ id: 1, delta: 60 });
    expect(summary.worst).toMatchObject({ id: 2, delta: -90 });
  });
});

describe("computeImpacts — publication récente sans recul", () => {
  it("marquée incomplete et exclue du summary si J+2 n'est pas révolu", () => {
    const pubs = [{ id: 7, publishedAt: ts("2026-06-20") }];
    // today = J+2 → la fenêtre après inclut aujourd'hui (données partielles)
    const { publications, summary } = computeImpacts(pubs, { "2026-06-19": 5 }, { today: "2026-06-22" });
    expect(publications[0].incomplete).toBe(true);
    expect(publications[0].deltaPct).toBeNull();
    expect(summary.completeCount).toBe(0);
    expect(summary.incompleteCount).toBe(1);
    expect(summary.avgDelta).toBeNull();
    expect(summary.best).toBeNull();
  });

  it("complète dès que J+2 est strictement passé", () => {
    const pubs = [{ id: 7, publishedAt: ts("2026-06-20") }];
    const { publications } = computeImpacts(pubs, {}, { today: "2026-06-23" });
    expect(publications[0].incomplete).toBe(false);
  });
});

describe("computeImpacts — jours manquants GA4", () => {
  it("jours absents traités comme 0", () => {
    const pubs = [{ id: 3, publishedAt: ts("2026-06-15") }];
    const { publications } = computeImpacts(pubs, { "2026-06-16": 12 }, { today: "2026-06-25" });
    expect(publications[0].sessionsAvant).toBe(0);
    expect(publications[0].sessionsApres).toBe(12);
  });
});

describe("computeImpacts — baseline 0", () => {
  it("baseline 0 + hausse → deltaPct null (pas Infinity), delta correct", () => {
    const pubs = [{ id: 4, publishedAt: ts("2026-06-15") }];
    const { publications, summary } = computeImpacts(pubs, { "2026-06-16": 30 }, { today: "2026-06-25" });
    expect(publications[0].delta).toBe(30);
    expect(publications[0].deltaPct).toBeNull();
    // exclue de avgDeltaPct mais pas de avgDelta
    expect(summary.avgDeltaPct).toBeNull();
    expect(summary.avgDelta).toBe(30);
  });

  it("0 avant / 0 après → deltaPct 0", () => {
    const pubs = [{ id: 5, publishedAt: ts("2026-06-15") }];
    const { publications } = computeImpacts(pubs, {}, { today: "2026-06-25" });
    expect(publications[0].deltaPct).toBe(0);
  });
});

describe("computeImpacts — entrées invalides", () => {
  it("ignore les publications sans publishedAt", () => {
    const { publications, summary } = computeImpacts(
      [{ id: 9 }, null, { id: 10, publishedAt: 0 }],
      {},
      { today: "2026-06-25" }
    );
    expect(publications).toHaveLength(0);
    expect(summary.count).toBe(0);
  });

  it("tolère listes/maps null", () => {
    const { summary } = computeImpacts(null, null, { today: "2026-06-25" });
    expect(summary.count).toBe(0);
  });
});
