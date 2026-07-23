import { describe, it, expect } from "vitest";
import {
  TARGET_MIX,
  VARIATION_TYPES,
  computeMixRatios,
  nextVariationType,
  pickConceptToIterate,
  buildMixInstruction,
} from "./contentMix.js";

const item = (t) => ({ variation_type: t });

describe("TARGET_MIX", () => {
  it("respecte la règle 30/20/50 et somme à 1", () => {
    expect(TARGET_MIX.new_concept).toBe(0.30);
    expect(TARGET_MIX.minor_iteration).toBe(0.20);
    expect(TARGET_MIX.major_iteration).toBe(0.50);
    const sum = VARIATION_TYPES.reduce((s, t) => s + TARGET_MIX[t], 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("computeMixRatios", () => {
  it("compte et ratio-ise les items classifiés", () => {
    const { total, counts, ratios } = computeMixRatios([
      item("new_concept"), item("major_iteration"), item("major_iteration"), item("minor_iteration"),
    ]);
    expect(total).toBe(4);
    expect(counts).toEqual({ new_concept: 1, minor_iteration: 1, major_iteration: 2 });
    expect(ratios.major_iteration).toBe(0.5);
    expect(ratios.new_concept).toBe(0.25);
  });

  it("ignore les items non classifiés (contenu antérieur à la règle)", () => {
    const { total, counts } = computeMixRatios([
      item("new_concept"), { variation_type: null }, {}, null, { variation_type: "n_importe_quoi" },
    ]);
    expect(total).toBe(1);
    expect(counts.new_concept).toBe(1);
  });

  it("historique vide → total 0, ratios à 0 (jamais NaN)", () => {
    const { total, ratios } = computeMixRatios([]);
    expect(total).toBe(0);
    for (const t of VARIATION_TYPES) expect(ratios[t]).toBe(0);
  });
});

describe("nextVariationType", () => {
  it("démarrage (historique vide ou trop court) → new_concept (rien à itérer)", () => {
    expect(nextVariationType([])).toBe("new_concept");
    expect(nextVariationType([item("new_concept")])).toBe("new_concept");
    expect(nextVariationType([item("new_concept"), item("new_concept")])).toBe("new_concept");
  });

  it("historique 100% nouveaux concepts → réclame l'itération MAJEURE (le poste le plus sous-investi)", () => {
    // C'est exactement le biais que la règle corrige : on produit du neuf en boucle.
    const hist = Array.from({ length: 6 }, () => item("new_concept"));
    expect(nextVariationType(hist)).toBe("major_iteration");
  });

  it("historique saturé en itérations majeures → bascule sur du nouveau concept", () => {
    const hist = Array.from({ length: 6 }, () => item("major_iteration"));
    expect(nextVariationType(hist)).toBe("new_concept");
  });

  it("mix déjà à la cible → produit le type dont l'écart reste le plus grand", () => {
    // 10 items pile à 30/20/50 : tous les écarts valent 0 → premier type dans l'ordre canonique.
    const hist = [
      ...Array.from({ length: 3 }, () => item("new_concept")),
      ...Array.from({ length: 2 }, () => item("minor_iteration")),
      ...Array.from({ length: 5 }, () => item("major_iteration")),
    ];
    expect(nextVariationType(hist)).toBe("new_concept");
  });

  it("réclame l'itération MINEURE quand c'est elle la plus en retard", () => {
    // 4 new (0.4) / 0 minor (0) / 6 major (0.6) → écarts : -0.10 / +0.20 / -0.10
    const hist = [
      ...Array.from({ length: 4 }, () => item("new_concept")),
      ...Array.from({ length: 6 }, () => item("major_iteration")),
    ];
    expect(nextVariationType(hist)).toBe("minor_iteration");
  });

  it("converge vers la cible : simuler 30 décisions successives approche 30/20/50", () => {
    const hist = [];
    for (let i = 0; i < 30; i++) hist.push(item(nextVariationType(hist)));
    const { ratios } = computeMixRatios(hist);
    expect(ratios.major_iteration).toBeGreaterThan(0.40);
    expect(ratios.new_concept).toBeLessThan(0.45); // le bootstrap gonfle le neuf au départ
    expect(ratios.minor_iteration).toBeGreaterThan(0.10);
  });
});

describe("pickConceptToIterate", () => {
  const A = { concept_id: "a", bien_id: "zandoli", theme: "preuve", angle: "avis 5 étoiles", impactDelta: 2, createdAt: 100 };
  const B = { concept_id: "b", bien_id: "geko", theme: "reve", angle: "coucher de soleil", impactDelta: 9, createdAt: 50 };
  const C = { concept_id: "c", bien_id: "amaryllis", theme: "detail", angle: "la piscine", impactDelta: null, createdAt: 900 };

  it("choisit le concept au MEILLEUR impact mesuré, pas le plus récent", () => {
    expect(pickConceptToIterate([A, B, C]).concept_id).toBe("b");
  });

  it("sans aucun impact mesuré → retombe sur le plus récent", () => {
    const picked = pickConceptToIterate([
      { concept_id: "x", createdAt: 10 }, { concept_id: "y", createdAt: 999 },
    ]);
    expect(picked.concept_id).toBe("y");
  });

  it("un impact négatif reste préféré à un impact absent (on sait au moins qu'il a été mesuré)", () => {
    const picked = pickConceptToIterate([
      { concept_id: "mesure", impactDelta: -3, createdAt: 1 },
      { concept_id: "inconnu", createdAt: 999 },
    ]);
    expect(picked.concept_id).toBe("mesure");
  });

  it("aucun concept → null (jamais d'itération fantôme)", () => {
    expect(pickConceptToIterate([])).toBeNull();
    expect(pickConceptToIterate([{}, null])).toBeNull();
  });
});

describe("buildMixInstruction", () => {
  const concept = { concept_id: "abc", bien_id: "zandoli", theme: "preuve", angle: "le retour d'un habitué" };
  const mixState = { total: 5, counts: { new_concept: 4, minor_iteration: 0, major_iteration: 1 } };

  it("new_concept : demande explicitement du neuf", () => {
    const txt = buildMixInstruction("new_concept", null, mixState);
    expect(txt).toContain("NOUVEAU CONCEPT");
    expect(txt).toContain("5 derniers contenus");
  });

  it("minor_iteration : nomme le concept et interdit la duplication", () => {
    const txt = buildMixInstruction("minor_iteration", concept, mixState);
    expect(txt).toContain("ITÉRATION MINEURE");
    expect(txt).toContain("le retour d'un habitué");
    expect(txt).toContain("hook");
    expect(txt).toContain("pas une duplication");
  });

  it("major_iteration : impose UN SEUL élément à faire varier, de façon déterministe", () => {
    const a = buildMixInstruction("major_iteration", concept, mixState);
    const b = buildMixInstruction("major_iteration", concept, mixState);
    expect(a).toBe(b); // déterministe (pas de Math.random)
    expect(a).toContain("ITÉRATION MAJEURE");
    expect(a).toContain("UN SEUL élément majeur");
    expect(a).toContain("PAS une duplication");
  });

  it("itération demandée mais aucun concept disponible → repli sur du neuf (jamais d'itération dans le vide)", () => {
    const txt = buildMixInstruction("major_iteration", null, mixState);
    expect(txt).toContain("NOUVEAU CONCEPT");
    expect(txt).not.toContain("ITÉRATION MAJEURE");
  });

  it("historique vide → annonce le démarrage sans inventer de chiffres", () => {
    const txt = buildMixInstruction("new_concept", null, { total: 0, counts: {} });
    expect(txt).toContain("démarrage");
    expect(txt).not.toContain("derniers contenus");
  });
});
