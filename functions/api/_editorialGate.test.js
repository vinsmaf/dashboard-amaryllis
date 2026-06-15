import { describe, it, expect } from "vitest";
import { evaluateGate, parsePhotoUrl } from "./_editorialGate.js";

// Whitelist de test : Vincent a coché ces photos
const ALLOWED = { amaryllis: ["01", "03", "07"], mabouya: ["02", "05"] };

// Un draft « parfait » de référence (passe tous les filtres)
const BASE = {
  caption: "Réveil face à la piscine.\n\nLumière douce sur la terrasse de la Villa Amaryllis.\n\nRéservez sur https://villamaryllis.com/amaryllis ⤴️\n\n#AmaryllisLocations #Martinique",
  imageUrl: "https://villamaryllis.com/photos/amaryllis/03.webp",
  channels: ["ig", "fb"],
  score: 90,
  verdict: "approve",
  allowedPhotosByBien: ALLOWED,
  recentBienPosts: [],
};

describe("parsePhotoUrl", () => {
  it("extrait bien + base depuis une URL absolue", () => {
    expect(parsePhotoUrl("https://villamaryllis.com/photos/amaryllis/03.webp")).toEqual({ bien: "amaryllis", base: "03" });
  });
  it("extrait depuis une URL relative et normalise le numéro", () => {
    expect(parsePhotoUrl("/photos/mabouya/5.webp")).toEqual({ bien: "mabouya", base: "05" });
  });
  it("retourne null si pas une photo", () => {
    expect(parsePhotoUrl("https://exemple.com/img.png")).toBeNull();
    expect(parsePhotoUrl("")).toBeNull();
    expect(parsePhotoUrl(null)).toBeNull();
  });
});

describe("evaluateGate — cas passant", () => {
  it("PASS quand tout est conforme", () => {
    const r = evaluateGate(BASE);
    expect(r.pass).toBe(true);
    expect(r.fails).toEqual([]);
    expect(r.bien).toBe("amaryllis");
    expect(r.photoBase).toBe("03");
  });
});

describe("evaluateGate — fact-check conscient du bien", () => {
  it("PASS : « piscine à débordement » est légitime pour amaryllis (pas un faux positif)", () => {
    const r = evaluateGate({
      ...BASE,
      caption: "Plongez dans la piscine à débordement eau salée de la Villa Amaryllis.\n\nRéservez ⤴️",
    });
    expect(r.fails.some((f) => f.filter === "mots_interdits")).toBe(false);
    expect(r.pass).toBe(true);
  });
  it("FAIL : « Quatre suites » pour amaryllis (qui a 3 chambres)", () => {
    const r = evaluateGate({ ...BASE, caption: "Quatre suites baignées de lumière à la Villa Amaryllis." });
    expect(r.fails.some((f) => f.filter === "mots_interdits")).toBe(true);
  });
  it("PASS : « quatre » sans rapport aux chambres n'est pas flaggé hors amaryllis", () => {
    const r = evaluateGate({
      ...BASE, imageUrl: "https://villamaryllis.com/photos/mabouya/02.webp", expectedBien: "mabouya",
      caption: "Quatre chambres ? Non, un studio cosy pour deux au Studio Mabouya.",
    });
    // onlyFor:[amaryllis] → la règle nb-chambres ne s'applique pas à mabouya
    expect(r.fails.some((f) => f.reason?.includes("3 chambres"))).toBe(false);
  });
  it("PASS : hashtag #AmaryllisLocations ne déclenche pas les règles équipement (cascade légitime zandoli)", () => {
    const r = evaluateGate({
      ...BASE, imageUrl: "https://villamaryllis.com/photos/zandoli/01.webp", expectedBien: "zandoli",
      caption: "Détente près de la cascade de Zandoli.\n\nRéservez ⤴️\n\n#AmaryllisLocations #Martinique",
    });
    expect(r.fails.some((f) => f.filter === "mots_interdits")).toBe(false);
  });
  it("FAIL : « villa » employé pour un bien non-villa (schoelcher)", () => {
    const r = evaluateGate({
      ...BASE, imageUrl: "https://villamaryllis.com/photos/schoelcher/03.webp", expectedBien: "schoelcher",
      caption: "Réservez votre villa à Bellevue.\n\n#AmaryllisLocations",
    });
    expect(r.fails.some((f) => f.filter === "mots_interdits")).toBe(true);
  });
  it("PASS : « Villa Amaryllis » est correct (amaryllis EST une villa)", () => {
    const r = evaluateGate({ ...BASE, caption: "Bienvenue à la Villa Amaryllis.\n\nRéservez ⤴️" });
    expect(r.fails.some((f) => f.filter === "mots_interdits")).toBe(false);
    expect(r.pass).toBe(true);
  });
  it("FAIL : « piscine à débordement » attribuée à un autre bien (mabouya)", () => {
    const r = evaluateGate({
      ...BASE,
      imageUrl: "https://villamaryllis.com/photos/mabouya/02.webp",
      expectedBien: "mabouya",
      caption: "Détente dans la piscine à débordement du Studio Mabouya.",
    });
    expect(r.fails.some((f) => f.filter === "mots_interdits")).toBe(true);
  });
});

describe("evaluateGate — chaque filtre qui bloque", () => {
  it("FAIL mots interdits (fact-check)", () => {
    const r = evaluateGate({ ...BASE, caption: "Les pieds dans l'eau à la Villa Amaryllis." });
    expect(r.pass).toBe(false);
    expect(r.fails.some((f) => f.filter === "mots_interdits")).toBe(true);
  });

  it("FAIL photo non whitelistée", () => {
    const r = evaluateGate({ ...BASE, imageUrl: "https://villamaryllis.com/photos/amaryllis/99.webp" });
    expect(r.pass).toBe(false);
    expect(r.fails.some((f) => f.filter === "photo")).toBe(true);
  });

  it("FAIL photo absente", () => {
    const r = evaluateGate({ ...BASE, imageUrl: "" });
    expect(r.pass).toBe(false);
    expect(r.fails.some((f) => f.filter === "photo")).toBe(true);
  });

  it("FAIL channels incomplets (ig seul → FB serait zappé)", () => {
    const r = evaluateGate({ ...BASE, channels: ["ig"] });
    expect(r.pass).toBe(false);
    expect(r.fails.some((f) => f.filter === "forme")).toBe(true);
  });

  it("FAIL doublon (bien publié < 7j)", () => {
    const r = evaluateGate({ ...BASE, recentBienPosts: ["amaryllis"] });
    expect(r.pass).toBe(false);
    expect(r.fails.some((f) => f.filter === "doublon")).toBe(true);
  });

  it("FAIL score sous le seuil", () => {
    const r = evaluateGate({ ...BASE, score: 72 });
    expect(r.pass).toBe(false);
    expect(r.fails.some((f) => f.filter === "score")).toBe(true);
  });

  it("FAIL verdict needs_edits malgré bon score", () => {
    const r = evaluateGate({ ...BASE, verdict: "needs_edits" });
    expect(r.pass).toBe(false);
    expect(r.fails.some((f) => f.filter === "verdict")).toBe(true);
  });

  it("FAIL photo d'un autre bien que le bien attendu", () => {
    const r = evaluateGate({ ...BASE, expectedBien: "mabouya" });
    expect(r.pass).toBe(false);
    expect(r.fails.some((f) => f.filter === "photo")).toBe(true);
  });

  it("cumule plusieurs échecs", () => {
    const r = evaluateGate({ ...BASE, caption: "pieds dans l'eau", score: 10, channels: [] });
    expect(r.pass).toBe(false);
    expect(r.fails.length).toBeGreaterThanOrEqual(3);
  });
});
