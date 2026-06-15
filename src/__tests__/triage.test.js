import { describe, it, expect } from "vitest";
import { isVague, isDuplicate, classifyRisk, triageAction } from "../../functions/api/_triage.js";

describe("isVague", () => {
  it("rejette une action à verbe mou sans cible concrète", () => {
    expect(isVague("Mettre en place un système de suivi des interventions")).toBe(true);
    expect(isVague("Améliorer l'expérience utilisateur")).toBe(true);
    expect(isVague("Optimiser les métadonnées des images")).toBe(true);
  });
  it("garde une action concrète (bien nommé / chiffre / endpoint)", () => {
    expect(isVague("Créer template post last-minute Géko à 119€/nuit")).toBe(false);
    expect(isVague("Configurer scrape Apify hebdo via cron Worker rm-scrape")).toBe(false);
    expect(isVague("Améliorer distribution Mabouya (RevPAR 23€, mois à 0€)")).toBe(false);
  });
  it("traite une chaîne vide comme vague", () => {
    expect(isVague("")).toBe(true);
  });
});

describe("isDuplicate", () => {
  const existing = [
    { id: "traf-007", action: "Corriger 11 meta titles > 60 caractères tronqués par Google" },
    { id: "cm-002", action: "Créer calendrier éditorial Instagram juin 2026" },
  ];
  it("détecte un quasi-doublon (mêmes mots-clés)", () => {
    const r = isDuplicate("Corriger les meta titles trop longs tronqués dans Google", existing);
    expect(r).toBe("traf-007");
  });
  it("ne confond pas deux actions distinctes", () => {
    expect(isDuplicate("Recompresser les photos Nogent trop lourdes", existing)).toBe(null);
  });
});

describe("classifyRisk", () => {
  it("blocked : catégorie sensible", () => {
    expect(classifyRisk({ category: "legal", action: "Vérifier déclarations meublé", effort: "2h" })).toBe("blocked");
    expect(classifyRisk({ category: "ads", action: "Lancer campagne", effort: "2h" })).toBe("blocked");
    expect(classifyRisk({ category: "revenue", action: "Optimiser séjours min", effort: "2h" })).toBe("blocked");
  });
  it("blocked : mot-clé argent/légal/pub même si catégorie neutre", () => {
    expect(classifyRisk({ category: "content", action: "Appliquer le prix de Zandoli", effort: "1h" })).toBe("blocked");
    expect(classifyRisk({ category: "seo", action: "Publier la fiche GBP Nogent", effort: "1h" })).toBe("blocked");
  });
  it("auto : content/seo léger sans mot-clé bloquant", () => {
    expect(classifyRisk({ category: "seo", action: "Rédiger meta description Mabouya", effort: "1h" })).toBe("auto");
    expect(classifyRisk({ category: "content", action: "Créer post Instagram Géko", effort: "2h" })).toBe("auto");
  });
  it("review : tout le reste (défaut)", () => {
    expect(classifyRisk({ category: "ops", action: "Organiser rotation ménage", effort: "4h" })).toBe("review");
    expect(classifyRisk({ category: "seo", action: "Rédiger 12 guides destination longue traîne", effort: "8h" })).toBe("review");
  });
  it("blocked : refonte/structure (charte graphique, 2026-06-15)", () => {
    expect(classifyRisk({ category: "seo", action: "Refondre architecture du site", effort: "8h" })).toBe("blocked");
  });
});

describe("triageAction", () => {
  const existing = [{ id: "cm-002", action: "Créer calendrier éditorial Instagram juin 2026" }];
  it("rejette une action vague (keep=false, reason=vague)", () => {
    const r = triageAction({ category: "ops", action: "Améliorer les process" }, existing);
    expect(r.keep).toBe(false);
    expect(r.reason).toBe("vague");
  });
  it("rejette un doublon (keep=false, reason=duplicate, dupOf)", () => {
    const r = triageAction({ category: "content", action: "Créer un calendrier éditorial Instagram pour juin 2026" }, existing);
    expect(r.keep).toBe(false);
    expect(r.reason).toBe("duplicate");
    expect(r.dupOf).toBe("cm-002");
  });
  it("garde une action concrète avec son risk", () => {
    const r = triageAction({ category: "seo", action: "Rédiger meta description Mabouya", effort: "1h" }, existing);
    expect(r.keep).toBe(true);
    expect(r.risk).toBe("auto");
  });
});

describe("triage robustesse (entrées malformées)", () => {
  it("triageAction(null) ne jette pas et rejette", () => {
    expect(() => triageAction(null)).not.toThrow();
    expect(triageAction(null).keep).toBe(false);
    expect(triageAction(null).reason).toBe("invalide");
  });
  it("triageAction({}) sans champs → rejeté (court)", () => {
    const r = triageAction({});
    expect(r.keep).toBe(false);
  });
  it("classifyRisk(null) → review (pas de throw)", () => {
    expect(() => classifyRisk(null)).not.toThrow();
    expect(classifyRisk(null)).toBe("review");
  });
  it("classifyRisk({}) sans champs → review", () => {
    expect(classifyRisk({})).toBe("review");
  });
  it("isDuplicate avec liste vide → null", () => {
    expect(isDuplicate("Créer post Instagram Mabouya 110€", [])).toBe(null);
  });
});
