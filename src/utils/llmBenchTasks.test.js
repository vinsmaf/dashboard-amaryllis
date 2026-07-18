import { describe, it, expect } from "vitest";
import { BENCH_TASKS } from "./llmBenchTasks.js";

const byKey = Object.fromEntries(BENCH_TASKS.map((t) => [t.key, t]));

describe("extraction_json", () => {
  it("accepte une extraction correcte", () => {
    expect(byKey.extraction_json.check('{"ville":"Sainte-Luce","budget":250}')).toBe(true);
  });
  it("accepte avec du texte autour du JSON", () => {
    expect(byKey.extraction_json.check('Voici : {"ville":"Sainte-Luce","budget":250} merci')).toBe(true);
  });
  it("refuse un budget faux", () => {
    expect(byKey.extraction_json.check('{"ville":"Sainte-Luce","budget":300}')).toBe(false);
  });
  it("refuse un JSON invalide", () => {
    expect(byKey.extraction_json.check("pas de json")).toBe(false);
  });
});

describe("resume_court", () => {
  it("accepte une phrase courte", () => {
    expect(byKey.resume_court.check("Séjour magnifique malgré un wifi un peu lent le soir.")).toBe(true);
  });
  it("refuse un texte trop long (>20 mots)", () => {
    const long = new Array(25).fill("mot").join(" ");
    expect(byKey.resume_court.check(long)).toBe(false);
  });
  it("refuse une réponse vide", () => {
    expect(byKey.resume_court.check("")).toBe(false);
  });
});

describe("redaction_instagram", () => {
  it("accepte 1-2 phrases avec emoji", () => {
    expect(byKey.redaction_instagram.check("Plongez dans notre piscine à débordement 🌴 Le paradis vous attend.")).toBe(true);
  });
  it("refuse sans emoji", () => {
    expect(byKey.redaction_instagram.check("Une piscine magnifique vous attend.")).toBe(false);
  });
});

describe("classification_lead", () => {
  it("accepte LEAD exact", () => {
    expect(byKey.classification_lead.check("LEAD")).toBe(true);
    expect(byKey.classification_lead.check(" lead ")).toBe(true);
  });
  it("refuse AUTRE ou une phrase", () => {
    expect(byKey.classification_lead.check("AUTRE")).toBe(false);
    expect(byKey.classification_lead.check("Oui c'est un lead intéressant")).toBe(false);
  });
});

describe("calcul_pricing", () => {
  it("accepte 654.5 ou arrondis proches", () => {
    expect(byKey.calcul_pricing.check("654.5")).toBe(true);
    expect(byKey.calcul_pricing.check("Le total est de 654€")).toBe(true);
    expect(byKey.calcul_pricing.check("655")).toBe(true);
  });
  it("refuse un mauvais calcul", () => {
    expect(byKey.calcul_pricing.check("770")).toBe(false);
  });
});
