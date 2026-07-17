import { describe, it, expect } from "vitest";
import {
  decideAction, parseIntent, isDisabled, conciergeMode, maxPromoEur,
  ACTIONS, DEFAULT_MAX_PROMO_EUR,
} from "./conciergeRules.js";

// Contexte nominal : voyageur identifié, résa rattachée, mode live.
const LIVE = { mode: "live", maxPromoEur: 50, hasGuest: true, hasBooking: true };

describe("decideAction — le défaut est de PROPOSER, pas d'exécuter", () => {
  it("exécute un geste promo valide en live", () => {
    const d = decideAction({ action: ACTIONS.PROMO, amountEur: 30, rationale: "clim en panne 1 nuit" }, LIVE);
    expect(d.execute).toBe(true);
    expect(d.escalate).toBe(false);
    expect(d.params.amountEur).toBe(30);
  });

  it("n'exécute JAMAIS un remboursement, même petit et justifié", () => {
    const d = decideAction({ action: ACTIONS.REFUND, amountEur: 10 }, LIVE);
    expect(d.execute).toBe(false);
    expect(d.escalate).toBe(true);
  });

  it("n'exécute JAMAIS une intervention prestataire", () => {
    const d = decideAction({ action: ACTIONS.INTERVENTION, category: "plomberie" }, LIVE);
    expect(d.execute).toBe(false);
    expect(d.escalate).toBe(true);
    expect(d.params.categorie).toBe("plomberie");
  });

  it("n'exécute JAMAIS l'achat d'un service", () => {
    expect(decideAction({ action: ACTIONS.SERVICE, serviceId: "late-early" }, LIVE).execute).toBe(false);
  });
});

describe("decideAction — plafond", () => {
  it("escalade au-delà du plafond SANS écrêter en silence", () => {
    const d = decideAction({ action: ACTIONS.PROMO, amountEur: 500 }, LIVE);
    expect(d.execute).toBe(false);
    expect(d.escalate).toBe(true);
    expect(d.reason).toContain("500");
    expect(d.params.amountEur).toBe(500); // le montant demandé est conservé pour que Vincent juge
  });

  it("accepte pile le plafond", () => {
    expect(decideAction({ action: ACTIONS.PROMO, amountEur: 50 }, LIVE).execute).toBe(true);
  });

  it("respecte un plafond abaissé", () => {
    const d = decideAction({ action: ACTIONS.PROMO, amountEur: 30 }, { ...LIVE, maxPromoEur: 20 });
    expect(d.execute).toBe(false);
  });

  it("rejette les montants invalides ou hostiles", () => {
    for (const bad of [0, -50, NaN, null, undefined, "beaucoup", Infinity]) {
      const d = decideAction({ action: ACTIONS.PROMO, amountEur: bad }, LIVE);
      expect(d.execute, `montant ${bad}`).toBe(false);
    }
  });
});

describe("decideAction — un geste doit être nominatif", () => {
  it("refuse un geste si le voyageur n'est pas identifié", () => {
    const d = decideAction({ action: ACTIONS.PROMO, amountEur: 20 }, { ...LIVE, hasGuest: false });
    expect(d.execute).toBe(false);
    expect(d.reason).toContain("nominatif");
  });

  it("refuse un geste sans réservation rattachée", () => {
    const d = decideAction({ action: ACTIONS.PROMO, amountEur: 20 }, { ...LIVE, hasBooking: false });
    expect(d.execute).toBe(false);
  });
});

describe("decideAction — mode shadow (défaut)", () => {
  it("n'exécute rien en shadow, même une promo parfaitement valide", () => {
    const d = decideAction({ action: ACTIONS.PROMO, amountEur: 30 }, { ...LIVE, mode: "shadow" });
    expect(d.execute).toBe(false);
    expect(d.escalate).toBe(true);
  });

  it("n'envoie pas la réponse en shadow", () => {
    expect(decideAction({ action: ACTIONS.REPLY_ONLY, message: "Bonjour" }, { ...LIVE, mode: "shadow" }).execute).toBe(false);
  });

  it("shadow est le défaut quand le mode n'est pas précisé", () => {
    expect(decideAction({ action: ACTIONS.PROMO, amountEur: 10 }, { hasGuest: true, hasBooking: true }).execute).toBe(false);
  });
});

describe("decideAction — intentions inconnues ou hostiles (le LLM n'est pas fiable)", () => {
  it("escalade une action inventée par le modèle", () => {
    const d = decideAction({ action: "wire_transfer", amountEur: 10000 }, LIVE);
    expect(d.execute).toBe(false);
    expect(d.action).toBe(ACTIONS.ESCALATE);
  });

  it("escalade sur intention vide, nulle ou malformée", () => {
    for (const bad of [null, undefined, {}, { action: null }, { action: "" }, { action: 42 }]) {
      const d = decideAction(bad, LIVE);
      expect(d.execute, JSON.stringify(bad)).toBe(false);
      expect(d.action).toBe(ACTIONS.ESCALATE);
    }
  });

  it("honore une escalade demandée par l'agent lui-même", () => {
    const d = decideAction({ action: ACTIONS.ESCALATE, rationale: "voyageur très remonté" }, LIVE);
    expect(d.escalate).toBe(true);
    expect(d.reason).toContain("remonté");
  });

  it("tronque une justification démesurée (pas de payload géant en base)", () => {
    const d = decideAction({ action: ACTIONS.PROMO, amountEur: 10, rationale: "x".repeat(5000) }, LIVE);
    expect(d.params.note.length).toBeLessThanOrEqual(200);
  });
});

describe("parseIntent — le modèle bavarde souvent autour du JSON", () => {
  it("parse du JSON propre", () => {
    expect(parseIntent('{"action":"promo_code","amountEur":20}')).toEqual({ action: "promo_code", amountEur: 20 });
  });

  it("extrait le JSON noyé dans du texte", () => {
    expect(parseIntent('Voici ma décision :\n```json\n{"action":"escalate"}\n```\nVoilà.')).toEqual({ action: "escalate" });
  });

  it("renvoie null si rien d'exploitable", () => {
    expect(parseIntent("je ne sais pas trop")).toBeNull();
    expect(parseIntent("")).toBeNull();
    expect(parseIntent(null)).toBeNull();
    expect(parseIntent("{cassé")).toBeNull();
  });
});

describe("kill-switch et config", () => {
  it("accepte '1' ET 'true' (social-webhook ne gère que '1' — piège connu)", () => {
    expect(isDisabled({ CONCIERGE_DISABLED: "1" })).toBe(true);
    expect(isDisabled({ CONCIERGE_DISABLED: "true" })).toBe(true);
    expect(isDisabled({ CONCIERGE_DISABLED: "0" })).toBe(false);
    expect(isDisabled({})).toBe(false);
    expect(isDisabled(null)).toBe(false);
  });

  it("shadow par défaut, live seulement si explicite", () => {
    expect(conciergeMode({})).toBe("shadow");
    expect(conciergeMode({ CONCIERGE_MODE: "live" })).toBe("live");
    expect(conciergeMode({ CONCIERGE_MODE: "LIVE" })).toBe("shadow"); // strict : pas de casse tolérée
    expect(conciergeMode(null)).toBe("shadow");
  });

  it("borne le plafond même si la variable d'env est absurde", () => {
    expect(maxPromoEur({})).toBe(DEFAULT_MAX_PROMO_EUR);
    expect(maxPromoEur({ CONCIERGE_MAX_PROMO_EUR: "30" })).toBe(30);
    expect(maxPromoEur({ CONCIERGE_MAX_PROMO_EUR: "99999" })).toBe(200); // borne dure
    expect(maxPromoEur({ CONCIERGE_MAX_PROMO_EUR: "-10" })).toBe(DEFAULT_MAX_PROMO_EUR);
    expect(maxPromoEur({ CONCIERGE_MAX_PROMO_EUR: "abc" })).toBe(DEFAULT_MAX_PROMO_EUR);
  });
});
