import { describe, it, expect } from "vitest";
import { THEMES, THEME_KEYS, buildThemeCodingPrompt, parseThemeCodingResponse } from "./reviewThemes.js";

describe("THEMES taxonomy", () => {
  it("a exactement les 7 thèmes attendus", () => {
    expect(THEME_KEYS.sort()).toEqual(
      ["accueil", "frictions", "localisation", "logement", "piscine", "prix", "reco"].sort()
    );
  });
});

describe("buildThemeCodingPrompt", () => {
  it("inclut chaque avis du lot dans le message user", () => {
    const reviews = [
      { id: "a1", bienNom: "Zandoli", rating: 5, text: "Superbe piscine" },
      { id: "a2", bienNom: "Géko", rating: 4, text: "Accueil top mais wifi lent" },
    ];
    const { messages } = buildThemeCodingPrompt(reviews);
    expect(messages[1].content).toContain("a1");
    expect(messages[1].content).toContain("a2");
    expect(messages[1].content).toContain("Superbe piscine");
    expect(messages[1].content).toContain("wifi lent");
  });

  it("liste la taxonomie fixe dans le system prompt", () => {
    const { messages } = buildThemeCodingPrompt([{ id: "x", bienNom: "Amaryllis", rating: 5, text: "top" }]);
    for (const key of THEME_KEYS) expect(messages[0].content).toContain(`"${key}"`);
  });
});

describe("parseThemeCodingResponse", () => {
  it("parse un tableau JSON valide", () => {
    const text = 'Voici : [{"id":"a1","themes":["piscine","reco"]},{"id":"a2","themes":[]}]';
    const parsed = parseThemeCodingResponse(text, ["a1", "a2"]);
    expect(parsed).toEqual([
      { id: "a1", themes: ["piscine", "reco"] },
      { id: "a2", themes: [] },
    ]);
  });

  it("rejette les ids hors du lot envoyé (anti-hallucination)", () => {
    const text = '[{"id":"a1","themes":["piscine"]},{"id":"INCONNU","themes":["prix"]}]';
    const parsed = parseThemeCodingResponse(text, ["a1"]);
    expect(parsed).toEqual([{ id: "a1", themes: ["piscine"] }]);
  });

  it("filtre les thèmes hors taxonomie (anti-hallucination)", () => {
    const text = '[{"id":"a1","themes":["piscine","THEME_INVENTE"]}]';
    const parsed = parseThemeCodingResponse(text, ["a1"]);
    expect(parsed).toEqual([{ id: "a1", themes: ["piscine"] }]);
  });

  it("renvoie un tableau vide si aucun JSON trouvé", () => {
    expect(parseThemeCodingResponse("désolé, je ne peux pas répondre", ["a1"])).toEqual([]);
  });

  it("renvoie un tableau vide si le JSON est malformé", () => {
    expect(parseThemeCodingResponse("[{id: a1 sans guillemets}]", ["a1"])).toEqual([]);
  });
});
