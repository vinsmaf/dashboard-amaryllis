import { describe, it, expect } from "vitest";
import { classifyRisk, triageAction, isVague, isDuplicate } from "./_triage.js";

const A = (action, category = "content", effort = "1h") => ({ action, category, effort });

describe("classifyRisk — paiement / revenue (critique)", () => {
  it("bloque la catégorie revenue/ads/legal", () => {
    expect(classifyRisk(A("changer le RevPAR", "revenue"))).toBe("blocked");
    expect(classifyRisk(A("nouvelle créa", "ads"))).toBe("blocked");
    expect(classifyRisk(A("mettre à jour les CGV", "legal"))).toBe("blocked");
  });
  it("bloque les mots-clés paiement/prix", () => {
    expect(classifyRisk(A("ajuster le prix de Mabouya"))).toBe("blocked");
    expect(classifyRisk(A("modifier la config Stripe", "technique"))).toBe("blocked");
    expect(classifyRisk(A("revoir la caution", "ops"))).toBe("blocked");
  });
});

describe("classifyRisk — charte graphique (critique, ajout 2026-06-15)", () => {
  it("bloque les tokens globaux / charte / logo / typo", () => {
    expect(classifyRisk(A("revoir la palette de couleurs dans tokens.css", "ux"))).toBe("blocked");
    expect(classifyRisk(A("changer la typographie du site", "ux"))).toBe("blocked");
    expect(classifyRisk(A("mettre à jour le logo", "content"))).toBe("blocked");
    expect(classifyRisk(A("uniformiser le design system", "technique"))).toBe("blocked");
  });
  it("bloque refonte/structure de page + composants partagés", () => {
    expect(classifyRisk(A("refonte de la page d'accueil", "ux"))).toBe("blocked");
    expect(classifyRisk(A("redesign du hero Amaryllis", "ux"))).toBe("blocked");
    expect(classifyRisk(A("modifier les composants partagés (primitives)", "technique"))).toBe("blocked");
  });
  it("bloque la catégorie design", () => {
    expect(classifyRisk(A("ajuster un espacement", "design"))).toBe("blocked");
  });
  it("NE bloque PAS une feature UX fonctionnelle sans charte", () => {
    expect(classifyRisk(A("Créer un système de filtres pour les propriétés", "ux", "8h"))).toBe("review");
    expect(classifyRisk(A("Implémenter le zoom sur la galerie", "ux", "4h"))).toBe("review");
  });
});

describe("classifyRisk — auto / review", () => {
  it("auto pour content/seo court effort", () => {
    expect(classifyRisk(A("Réécrire le meta-title Mabouya", "seo", "30min"))).toBe("auto");
    expect(classifyRisk(A("Compléter le guide plages Sainte-Luce", "content", "2h"))).toBe("auto");
  });
  it("review si effort > 2h", () => {
    expect(classifyRisk(A("Rédiger 10 guides destination", "content", "8h"))).toBe("review");
  });
  it("review par défaut pour le reste", () => {
    expect(classifyRisk(A("Auditer le tracking GA4", "tracking", "1h"))).toBe("review");
  });
});

describe("triageAction — garde keep + risk", () => {
  it("rejette le vague", () => {
    expect(triageAction(A("améliorer l'expérience")).keep).toBe(false);
  });
  it("garde une action concrète avec son risk", () => {
    const r = triageAction(A("Réécrire le meta-title de Mabouya (≤60c)", "seo", "30min"));
    expect(r.keep).toBe(true);
    expect(r.risk).toBe("auto");
  });
  it("garde une action design en blocked", () => {
    const r = triageAction(A("Refonte complète de la palette tokens.css du site", "ux", "4h"));
    expect(r.keep).toBe(true);
    expect(r.risk).toBe("blocked");
  });
});
