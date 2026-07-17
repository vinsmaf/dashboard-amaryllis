import { describe, it, expect } from "vitest";
import {
  toEpochSeconds,
  bucketByWeek,
  computeTrend,
  findAutomationCandidates,
  computeDelegationIndex,
  WEEK_SEC,
} from "./delegation.js";

const NOW = 1_752_800_000; // 2025-07-18 ~00:53 UTC — figé : le test ne doit pas dépendre de l'heure réelle

describe("toEpochSeconds — normalisation des 3 formats d'horodatage du projet", () => {
  it("laisse les secondes intactes", () => {
    expect(toEpochSeconds(1_752_800_000)).toBe(1_752_800_000);
  });

  it("convertit les millisecondes en secondes (rm_recommendations.reviewed_at, emails_log.sent_at)", () => {
    expect(toEpochSeconds(1_752_800_000_000)).toBe(1_752_800_000);
  });

  it("parse le texte ISO SQLite sans fuseau comme de l'UTC, pas comme l'heure locale du runtime", () => {
    // "2026-07-17 12:00:00" sans Z : Date() le lirait en heure locale (variable selon la machine).
    expect(toEpochSeconds("2026-07-17 12:00:00")).toBe(Date.parse("2026-07-17T12:00:00Z") / 1000);
  });

  it("recale +4h les horodatages écrits en heure Martinique (suggestion_acks.acked_at)", () => {
    const local = toEpochSeconds("2026-07-17 12:00:00", { isMartiniqueLocal: true });
    const utc = toEpochSeconds("2026-07-17 12:00:00");
    expect(local - utc).toBe(4 * 3600);
  });

  it("accepte un nombre passé en chaîne (D1 renvoie parfois du texte)", () => {
    expect(toEpochSeconds("1752800000")).toBe(1_752_800_000);
  });

  it("rejette null, vide, NaN, négatif et texte non parsable", () => {
    expect(toEpochSeconds(null)).toBeNull();
    expect(toEpochSeconds("")).toBeNull();
    expect(toEpochSeconds(0)).toBeNull();
    expect(toEpochSeconds(-5)).toBeNull();
    expect(toEpochSeconds("pas une date")).toBeNull();
    expect(toEpochSeconds(undefined)).toBeNull();
  });
});

describe("bucketByWeek", () => {
  it("range chaque acte dans la bonne semaine glissante", () => {
    const acts = [
      { kind: "prix_rm", at: NOW - 100 },              // semaine 0
      { kind: "prix_rm", at: NOW - WEEK_SEC - 100 },   // semaine 1
      { kind: "email", at: NOW - 2 * WEEK_SEC - 100 }, // semaine 2
    ];
    const b = bucketByWeek(acts, { now: NOW, weeks: 4 });
    expect(b[0].total).toBe(1);
    expect(b[1].total).toBe(1);
    expect(b[2].total).toBe(1);
    expect(b[3].total).toBe(0);
    expect(b[0].byKind).toEqual({ prix_rm: 1 });
    expect(b[2].byKind).toEqual({ email: 1 });
  });

  it("exclut ce qui est hors fenêtre et les dates futures (horloge décalée)", () => {
    const acts = [
      { kind: "vieux", at: NOW - 50 * WEEK_SEC },
      { kind: "futur", at: NOW + 5000 },
      { kind: "ok", at: NOW - 10 },
    ];
    const b = bucketByWeek(acts, { now: NOW, weeks: 4 });
    expect(b.reduce((s, x) => s + x.total, 0)).toBe(1);
    expect(b[0].byKind).toEqual({ ok: 1 });
  });

  it("ignore les actes sans horodatage exploitable", () => {
    const b = bucketByWeek([{ kind: "x", at: null }, { kind: "y" }], { now: NOW, weeks: 2 });
    expect(b.reduce((s, x) => s + x.total, 0)).toBe(0);
  });
});

describe("computeTrend — orienté délégation (baisse = bon signe)", () => {
  const mk = (totals) => totals.map((t, i) => ({ weekIndex: i, total: t, byKind: {} }));

  it("détecte une baisse de charge manuelle", () => {
    const t = computeTrend(mk([2, 2, 2, 2, 10, 10, 10, 10]), { half: 4 });
    expect(t.recentAvg).toBe(2);
    expect(t.previousAvg).toBe(10);
    expect(t.deltaPct).toBe(-80);
    expect(t.direction).toBe("down");
  });

  it("détecte une hausse", () => {
    const t = computeTrend(mk([10, 10, 10, 10, 2, 2, 2, 2]), { half: 4 });
    expect(t.deltaPct).toBe(400);
    expect(t.direction).toBe("up");
  });

  it("qualifie de stable une variation sous 10%", () => {
    expect(computeTrend(mk([10, 10, 10, 10, 10, 10, 10, 11]), { half: 4 }).direction).toBe("flat");
  });

  it("ne fabrique pas un pourcentage quand la période de référence est vide", () => {
    const t = computeTrend(mk([5, 5, 5, 5, 0, 0, 0, 0]), { half: 4 });
    expect(t.deltaPct).toBeNull(); // surtout pas Infinity affiché comme "+∞ %"
    expect(t.direction).toBe("up");
  });

  it("renvoie unknown si l'historique est trop court", () => {
    expect(computeTrend(mk([3]), { half: 4 }).direction).toBe("unknown");
  });
});

describe("findAutomationCandidates — fréquence ET régularité", () => {
  it("retient un acte fréquent et régulier", () => {
    const buckets = Array.from({ length: 4 }, (_, i) => ({
      weekIndex: i, total: 5, byKind: { prix_journalier: 5 },
    }));
    const c = findAutomationCandidates(buckets, { minPerWeek: 3, minWeeksPresent: 3 });
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ kind: "prix_journalier", total: 20, perWeek: 5, weeksPresent: 4 });
  });

  it("écarte un pic ponctuel malgré un volume élevé (one-shot, pas une routine)", () => {
    const buckets = [
      { weekIndex: 0, total: 40, byKind: { migration: 40 } },
      { weekIndex: 1, total: 0, byKind: {} },
      { weekIndex: 2, total: 0, byKind: {} },
      { weekIndex: 3, total: 0, byKind: {} },
    ];
    // 10/semaine en moyenne mais présent 1 seule semaine → pas un candidat
    expect(findAutomationCandidates(buckets, { minPerWeek: 3, minWeeksPresent: 3 })).toEqual([]);
  });

  it("écarte un acte régulier mais rare", () => {
    const buckets = Array.from({ length: 4 }, (_, i) => ({
      weekIndex: i, total: 1, byKind: { rare: 1 },
    }));
    expect(findAutomationCandidates(buckets, { minPerWeek: 3, minWeeksPresent: 3 })).toEqual([]);
  });

  it("trie par volume total décroissant", () => {
    const buckets = Array.from({ length: 4 }, (_, i) => ({
      weekIndex: i, total: 9, byKind: { a: 4, b: 5 },
    }));
    const c = findAutomationCandidates(buckets, { minPerWeek: 3, minWeeksPresent: 3 });
    expect(c.map((x) => x.kind)).toEqual(["b", "a"]);
  });
});

describe("computeDelegationIndex", () => {
  it("assemble volume, tendance et candidats", () => {
    const acts = [];
    for (let w = 0; w < 8; w++) {
      const n = w < 4 ? 3 : 8; // 4 dernières semaines plus légères → tendance à la baisse
      for (let i = 0; i < n; i++) acts.push({ kind: "prix_rm", at: NOW - w * WEEK_SEC - 60 });
    }
    const idx = computeDelegationIndex(acts, { now: NOW, weeks: 8 });
    expect(idx.thisWeek).toBe(3);
    expect(idx.total).toBe(44);
    expect(idx.byKind).toEqual({ prix_rm: 44 });
    expect(idx.trend.direction).toBe("down");
    expect(idx.candidates[0].kind).toBe("prix_rm");
  });

  it("reste cohérent sans aucun acte (base vide / démarrage)", () => {
    const idx = computeDelegationIndex([], { now: NOW, weeks: 8 });
    expect(idx.total).toBe(0);
    expect(idx.thisWeek).toBe(0);
    expect(idx.candidates).toEqual([]);
    expect(idx.trend.direction).toBe("flat");
    expect(idx.buckets).toHaveLength(8);
  });
});
