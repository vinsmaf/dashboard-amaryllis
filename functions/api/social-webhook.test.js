import { describe, it, expect } from "vitest";
import { extractComments, decideReply, finalizeReply } from "./social-webhook.js";

describe("extractComments — parsing webhook Meta", () => {
  it("extrait un commentaire Facebook (feed/comment/add)", () => {
    const body = { entry: [{ changes: [{ field: "feed", value: { item: "comment", verb: "add", comment_id: "123_456", message: "Je cherche une location à Sainte-Luce", from: { id: "999" }, post_id: "p1" } }] }] };
    const out = extractComments(body);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ platform: "fb", commentId: "123_456", text: "Je cherche une location à Sainte-Luce", fromId: "999", postId: "p1" });
  });

  it("ignore les events feed non-commentaires (like, edit, status)", () => {
    const body = { entry: [{ changes: [
      { field: "feed", value: { item: "like", verb: "add", post_id: "p1" } },
      { field: "feed", value: { item: "comment", verb: "edited", comment_id: "x" } },
      { field: "feed", value: { item: "status", verb: "add", post_id: "p2" } },
    ] }] };
    expect(extractComments(body)).toHaveLength(0);
  });

  it("extrait un commentaire Instagram (field=comments)", () => {
    const body = { entry: [{ changes: [{ field: "comments", value: { id: "ig789", text: "dispo en août ?", from: { id: "u2" } } }] }] };
    const out = extractComments(body);
    expect(out[0]).toMatchObject({ platform: "ig", commentId: "ig789", text: "dispo en août ?", fromId: "u2" });
  });

  it("robuste au payload vide / malformé", () => {
    expect(extractComments({})).toEqual([]);
    expect(extractComments({ entry: [{}] })).toEqual([]);
    expect(extractComments(null)).toEqual([]);
  });
});

describe("finalizeReply — garde-fous de l'accroche générée par l'agent", () => {
  it("accepte une accroche propre et y ajoute le lien", () => {
    const r = finalizeReply("Bonjour et bienvenue, nous serions ravis de vous accueillir en Martinique", "fr");
    expect(r).toContain("villamaryllis.com");
    expect(r).toMatch(/^Bonjour et bienvenue/);
  });
  it("retire les guillemets parasites du modèle", () => {
    expect(finalizeReply('"Avec plaisir, découvrez nos logements"', "fr")).toMatch(/^Avec plaisir/);
  });
  it("REJETTE (→ null) si l'accroche invente un prix", () => {
    expect(finalizeReply("Dès 110€ la nuit en Martinique !", "fr")).toBeNull();
    expect(finalizeReply("Nos tarifs commencent à 90 euros", "fr")).toBeNull();
  });
  it("REJETTE si l'accroche affirme une disponibilité", () => {
    expect(finalizeReply("Oui c'est disponible en août, réservez vite", "fr")).toBeNull();
  });
  it("REJETTE si l'accroche contient déjà un lien", () => {
    expect(finalizeReply("Voyez villamaryllis.com pour nos villas", "fr")).toBeNull();
    expect(finalizeReply("Allez sur https://exemple.fr", "fr")).toBeNull();
  });
  it("REJETTE si vide ou trop longue", () => {
    expect(finalizeReply("", "fr")).toBeNull();
    expect(finalizeReply("a".repeat(230), "fr")).toBeNull();
  });
});

describe("decideReply — garde-fous", () => {
  const selfIds = ["PAGE_ID", "IG_ID"];
  it("répond à un vrai lead confiant qui n'est pas nous", () => {
    expect(decideReply({ lead: true, confidence: 0.8, fromId: "999", text: "je cherche une villa", selfIds })).toBe(true);
  });
  it("ne répond JAMAIS à nos propres commentaires (anti-boucle)", () => {
    expect(decideReply({ lead: true, confidence: 0.95, fromId: "PAGE_ID", text: "merci !", selfIds })).toBe(false);
    expect(decideReply({ lead: true, confidence: 0.95, fromId: "IG_ID", text: "à bientôt", selfIds })).toBe(false);
  });
  it("ne répond pas si confiance < 0,7", () => {
    expect(decideReply({ lead: true, confidence: 0.5, fromId: "999", text: "peut-être", selfIds })).toBe(false);
  });
  it("ne répond pas si lead=false", () => {
    expect(decideReply({ lead: false, confidence: 0.99, fromId: "999", text: "spam", selfIds })).toBe(false);
  });
  it("ne répond pas à un texte vide/trop court", () => {
    expect(decideReply({ lead: true, confidence: 0.9, fromId: "999", text: "ok", selfIds })).toBe(false);
    expect(decideReply({ lead: true, confidence: 0.9, fromId: "999", text: "", selfIds })).toBe(false);
  });
});
