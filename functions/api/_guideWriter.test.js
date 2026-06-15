import { describe, it, expect } from "vitest";
import { validateGuideEdit, mergeGuide, EDITABLE_FIELDS, PROTECTED_FIELDS } from "./_guideWriter.js";

const ORIGINAL = {
  property_id: "amaryllis",
  property_name: "Villa Amaryllis",
  tagline: "Villa avec piscine privée · Sainte-Luce",
  welcome_message: "Bienvenue ! Voici votre séjour.",
  wifi_ssid: "VillaAmaryllis",
  wifi_password: "amaryllis",
  code_acces: "1983#",
  checkin_time: "17h",
  checkout_time: "12h",
  contacts: [{ label: "Vincent", phone: "+33 6 10 88 07 72" }],
};

describe("validateGuideEdit — sûreté des champs critiques", () => {
  it("OK quand seuls les champs éditables changent (fact-check propre)", () => {
    const improved = { welcome_message: "Bienvenue à la Villa Amaryllis ! Toute l'équipe vous souhaite un séjour inoubliable." };
    const r = validateGuideEdit(ORIGINAL, improved, "amaryllis");
    expect(r.ok).toBe(true);
    expect(r.changed).toContain("welcome_message");
  });

  it("REJET si l'IA tente de modifier le code d'accès", () => {
    const improved = { welcome_message: "Bienvenue !", code_acces: "0000#" };
    const r = validateGuideEdit(ORIGINAL, improved, "amaryllis");
    expect(r.ok).toBe(false);
    expect(r.fails.some((f) => f.includes("code_acces"))).toBe(true);
  });

  it("REJET si l'IA change le wifi ou les contacts", () => {
    expect(validateGuideEdit(ORIGINAL, { wifi_password: "hacked" }, "amaryllis").ok).toBe(false);
    expect(validateGuideEdit(ORIGINAL, { contacts: [{ label: "X", phone: "000" }] }, "amaryllis").ok).toBe(false);
  });

  it("REJET si le texte réécrit contient un fait faux (fact-check bien-aware)", () => {
    const improved = { welcome_message: "Bienvenue dans vos quatre suites de la Villa Amaryllis." };
    const r = validateGuideEdit(ORIGINAL, improved, "amaryllis");
    expect(r.ok).toBe(false);
    expect(r.fails.some((f) => f.includes("fact-check"))).toBe(true);
  });

  it("REJET si rien n'a changé (pas d'amélioration)", () => {
    const r = validateGuideEdit(ORIGINAL, { welcome_message: ORIGINAL.welcome_message }, "amaryllis");
    expect(r.ok).toBe(false);
  });

  it("ignore un champ non éditable hors protégé (ni appliqué ni bloquant)", () => {
    const r = validateGuideEdit(ORIGINAL, { welcome_message: "Nouveau message d'accueil chaleureux.", emoji: "🏖️" }, "amaryllis");
    expect(r.ok).toBe(true); // emoji ni protégé ni éditable → ignoré au merge
  });
});

describe("mergeGuide — préserve tout sauf les champs validés", () => {
  it("applique seulement les champs changés, garde le reste intact", () => {
    const improved = { welcome_message: "Nouveau message.", tagline: "Nouvelle accroche.", code_acces: "9999#" };
    const merged = mergeGuide(ORIGINAL, improved, ["welcome_message", "tagline"]);
    expect(merged.welcome_message).toBe("Nouveau message.");
    expect(merged.tagline).toBe("Nouvelle accroche.");
    expect(merged.code_acces).toBe("1983#");        // protégé, préservé
    expect(merged.wifi_password).toBe("amaryllis"); // intact
  });
  it("ne reprend jamais un champ hors EDITABLE même listé dans changedFields", () => {
    const merged = mergeGuide(ORIGINAL, { code_acces: "9999#" }, ["code_acces"]);
    expect(merged.code_acces).toBe("1983#");
  });
});

describe("invariants de configuration", () => {
  it("aucun champ n'est à la fois éditable et protégé", () => {
    expect(EDITABLE_FIELDS.filter((f) => PROTECTED_FIELDS.includes(f))).toEqual([]);
  });
});
