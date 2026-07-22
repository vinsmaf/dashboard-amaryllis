import { describe, it, expect } from "vitest";
import {
  isBannedTactic,
  buildGrowthFacts,
  sanitizeRecos,
  assembleDigest,
  planEditorialSlots,
} from "./socialGrowthAgent.js";

describe("isBannedTactic", () => {
  it("détecte l'achat d'abonnés", () => {
    expect(isBannedTactic("Acheter 1000 abonnés Instagram")).toBe(true);
    expect(isBannedTactic("buy followers on a cheap site")).toBe(true);
  });
  it("détecte le faux engagement / bots / follow-unfollow", () => {
    expect(isBannedTactic("Utiliser des bots pour liker")).toBe(true);
    expect(isBannedTactic("technique follow/unfollow massive")).toBe(true);
    expect(isBannedTactic("faux engagement via comptes")).toBe(true);
  });
  it("détecte le boost payant (décision de Vincent, hors périmètre agent)", () => {
    expect(isBannedTactic("Booster le post avec un budget pub de 20€")).toBe(true);
    expect(isBannedTactic("sponsoriser la publication")).toBe(true);
  });
  it("laisse passer les tactiques organiques légitimes", () => {
    expect(isBannedTactic("Publier 3 Reels par semaine avec un CTA s'abonner")).toBe(false);
    expect(isBannedTactic("Répondre à tous les commentaires sous 2h")).toBe(false);
    expect(isBannedTactic("Collaborer avec un créateur local (cross-promo organique)")).toBe(false);
  });
});

describe("buildGrowthFacts", () => {
  const platforms = [
    { platform: "instagram", health: "measurable", current: 1055, growth: { delta_30d: 40, growth_30d_pct: 3.9 }, verdict: "on_track", needed_monthly: 53 },
    { platform: "youtube", health: "not_configured", current: null, growth: {}, verdict: "no_data", needed_monthly: null },
  ];
  it("aplatit les plateformes en faits + liste mesurables/non-mesurables", () => {
    const f = buildGrowthFacts(platforms, { instagram: { saves_30d: 12 } }, { reel: 4, post: 3, total: 7 }, 5);
    expect(f.objectif_mensuel_pct).toBe(5);
    expect(f.plateformes[0].abonnes).toBe(1055);
    expect(f.plateformes[0].croissance_30j_pct).toBe(3.9);
    expect(f.mesurables).toEqual(["instagram"]);
    expect(f.non_mesurables).toEqual(["youtube"]);
    expect(f.engagement_30j.instagram.saves_30d).toBe(12);
    expect(f.cadence_editoriale_a_venir.reel).toBe(4);
  });
});

describe("sanitizeRecos — garde-fous honnêteté", () => {
  const known = ["facebook", "instagram", "youtube"];

  it("écarte les recos sur une plateforme inconnue", () => {
    const out = sanitizeRecos({ recos: [{ platform: "tiktok", priority: "high", actions: ["poster"] }] }, known);
    expect(out.recos).toHaveLength(0);
    expect(out.dropped.some((d) => d.reason === "plateforme inconnue")).toBe(true);
  });

  it("supprime les ACTIONS à tactique bannie mais garde les organiques", () => {
    const out = sanitizeRecos({
      recos: [{
        platform: "instagram", priority: "high", diagnosis: "sous l'objectif",
        actions: ["Acheter 500 abonnés", "Publier 3 Reels/semaine", "Répondre aux DM sous 2h"],
      }],
    }, known);
    expect(out.recos).toHaveLength(1);
    expect(out.recos[0].actions).toEqual(["Publier 3 Reels/semaine", "Répondre aux DM sous 2h"]);
    expect(out.dropped.some((d) => d.reason === "tactique bannie")).toBe(true);
  });

  it("écarte une reco entièrement composée de tactiques bannies", () => {
    const out = sanitizeRecos({
      recos: [{ platform: "facebook", priority: "high", actions: ["acheter des abonnés", "utiliser des bots"] }],
    }, known);
    expect(out.recos).toHaveLength(0);
  });

  it("borne priorité, nb d'actions (≤3) et nb de recos (≤4), trie high d'abord", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      platform: "instagram", priority: i === 5 ? "high" : "low",
      actions: ["a1", "a2", "a3", "a4"],
    }));
    const out = sanitizeRecos({ recos: many }, known);
    expect(out.recos.length).toBeLessThanOrEqual(4);
    expect(out.recos[0].priority).toBe("high"); // le high remonte en tête
    expect(out.recos[0].actions.length).toBe(3); // ≤ 3 actions
  });

  it("priorité invalide → 'med' par défaut", () => {
    const out = sanitizeRecos({ recos: [{ platform: "youtube", priority: "URGENT", actions: ["publier une vidéo"] }] }, known);
    expect(out.recos[0].priority).toBe("med");
  });

  it("null-safe sur entrée LLM malformée", () => {
    expect(sanitizeRecos(null, known).recos).toEqual([]);
    expect(sanitizeRecos({}, known).recos).toEqual([]);
    expect(sanitizeRecos({ recos: "pas un tableau" }, known).recos).toEqual([]);
  });
});

describe("planEditorialSlots — passerelle vers le calendrier éditorial", () => {
  const known = new Set(["amaryllis", "zandoli", "geko"]);
  const dates = ["2026-07-25", "2026-07-26", "2026-07-27", "2026-07-28"];

  it("transforme un plan valide en créneaux datés libres", () => {
    const { slots } = planEditorialSlots(
      [{ bien: "zandoli", format: "reel", theme: "lifestyle", angle: "vue mer au réveil", cta: "S'abonner" }],
      { candidateDates: dates, occupied: new Set(), knownBiens: known, maxNew: 2 },
    );
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ bien_id: "zandoli", format: "reel", theme: "lifestyle", scheduled_ymd: "2026-07-25" });
    expect(slots[0].brief).toContain("croissance —");
  });

  it("saute les dates déjà occupées (n'empile pas sur l'existant)", () => {
    const { slots } = planEditorialSlots(
      [{ bien: "geko", format: "post", theme: "info", angle: "astuce locale" }],
      { candidateDates: dates, occupied: new Set(["2026-07-25", "2026-07-26"]), knownBiens: known, maxNew: 2 },
    );
    expect(slots[0].scheduled_ymd).toBe("2026-07-27");
  });

  it("respecte le cap maxNew et n'assigne pas deux fois la même date", () => {
    const plan = [
      { bien: "amaryllis", format: "reel", angle: "a1" },
      { bien: "zandoli", format: "reel", angle: "a2" },
      { bien: "geko", format: "reel", angle: "a3" },
    ];
    const { slots } = planEditorialSlots(plan, { candidateDates: dates, knownBiens: known, maxNew: 2 });
    expect(slots).toHaveLength(2);
    expect(new Set(slots.map((s) => s.scheduled_ymd)).size).toBe(2);
  });

  it("écarte bien inconnu / format invalide / angle vide / tactique bannie", () => {
    const { slots, dropped } = planEditorialSlots(
      [
        { bien: "tiktokville", format: "reel", angle: "x" },
        { bien: "amaryllis", format: "tiktok", angle: "x" },
        { bien: "zandoli", format: "reel", angle: "" },
        { bien: "geko", format: "reel", angle: "acheter des abonnés pas cher" },
      ],
      { candidateDates: dates, knownBiens: known, maxNew: 5 },
    );
    expect(slots).toHaveLength(0);
    expect(dropped.map((d) => d.reason)).toEqual(
      expect.arrayContaining(["bien inconnu", "format invalide", "angle vide", "tactique bannie"]),
    );
  });

  it("theme invalide → 'lifestyle' par défaut ; null-safe sur entrée absente", () => {
    const { slots } = planEditorialSlots([{ bien: "geko", format: "post", theme: "n'importe quoi", angle: "ok" }], { candidateDates: dates, knownBiens: known });
    expect(slots[0].theme).toBe("lifestyle");
    expect(planEditorialSlots(null, { candidateDates: dates, knownBiens: known }).slots).toEqual([]);
  });

  it("s'arrête proprement quand plus aucune date n'est libre", () => {
    const { slots, dropped } = planEditorialSlots(
      [{ bien: "geko", format: "reel", angle: "a" }],
      { candidateDates: ["2026-07-25"], occupied: new Set(["2026-07-25"]), knownBiens: known, maxNew: 2 },
    );
    expect(slots).toHaveLength(0);
    expect(dropped.some((d) => d.reason === "aucun créneau libre")).toBe(true);
  });
});

describe("assembleDigest", () => {
  it("construit un headline avec les plateformes mesurables + les recos", () => {
    const facts = buildGrowthFacts([
      { platform: "instagram", health: "measurable", current: 1055, growth: { delta_30d: 40, growth_30d_pct: 3.9 }, verdict: "behind", needed_monthly: 53 },
    ], {}, {}, 5);
    const recos = sanitizeRecos({ recos: [{ platform: "instagram", priority: "high", diagnosis: "sous l'objectif de 5%", actions: ["Publier 3 Reels/semaine"] }] }, ["instagram"]);
    const d = assembleDigest(facts, recos);
    expect(d.title).toContain("sous l'objectif");
    expect(d.headline).toContain("Instagram 1055");
    expect(d.body).toContain("Publier 3 Reels/semaine");
    expect(d.has_recos).toBe(true);
  });

  it("headline honnête quand l'historique est insuffisant", () => {
    const facts = buildGrowthFacts([
      { platform: "instagram", health: "measurable", current: 1055, growth: { delta_30d: null, growth_30d_pct: null }, verdict: "no_data" },
    ], {}, {}, 5);
    const d = assembleDigest(facts, { recos: [], dropped: [] });
    expect(d.headline).toMatch(/historique/i);
    expect(d.has_recos).toBe(false);
  });
});
