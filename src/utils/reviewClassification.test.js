import { describe, it, expect } from "vitest";
import { classifyReview, buildReviewReplyPrompt } from "./reviewClassification.js";

describe("classifyReview", () => {
  it("≥4★ → auto", () => {
    expect(classifyReview(5)).toBe("auto");
    expect(classifyReview(4)).toBe("auto");
    expect(classifyReview("4")).toBe("auto");
  });

  it("≤3★ → escalade", () => {
    expect(classifyReview(3)).toBe("escalade");
    expect(classifyReview(2)).toBe("escalade");
    expect(classifyReview(1)).toBe("escalade");
  });

  it("note absente/invalide → escalade (conservateur)", () => {
    expect(classifyReview(null)).toBe("escalade");
    expect(classifyReview(undefined)).toBe("escalade");
    expect(classifyReview(0)).toBe("escalade");
    expect(classifyReview("")).toBe("escalade");
    expect(classifyReview("abc")).toBe("escalade");
    expect(classifyReview(-1)).toBe("escalade");
  });
});

describe("buildReviewReplyPrompt", () => {
  it("inclut le bien, la note et l'avis dans le message user", () => {
    const { messages } = buildReviewReplyPrompt({
      bienNom: "Zandoli", rating: 5, reviewText: "Superbe séjour", classification: "auto",
    });
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain("Zandoli");
    expect(messages[1].content).toContain("5★");
    expect(messages[1].content).toContain("Superbe séjour");
  });

  it("branche 'auto' vs 'escalade' dans le system prompt", () => {
    const auto = buildReviewReplyPrompt({ bienNom: "Géko", rating: 5, reviewText: "Top", classification: "auto" });
    const esc  = buildReviewReplyPrompt({ bienNom: "Géko", rating: 2, reviewText: "Sale", classification: "escalade" });
    expect(auto.messages[0].content).toMatch(/Avis positif/);
    expect(esc.messages[0].content).toMatch(/Avis ≤3★/);
  });

  it("tronque un avis très long à 1000 caractères", () => {
    const long = "x".repeat(2000);
    const { messages } = buildReviewReplyPrompt({ bienNom: "Amaryllis", rating: 5, reviewText: long, classification: "auto" });
    // 1000 chars de texte + guillemets
    expect(messages[1].content.match(/x+/)[0].length).toBe(1000);
  });

  it("gère un avis sans texte (rating seul)", () => {
    const { messages } = buildReviewReplyPrompt({ bienNom: "Mabouya", rating: 4, reviewText: "", classification: "auto" });
    expect(messages[1].content).toContain("Mabouya");
  });

  it("inclut le prénom du voyageur quand fourni — jamais le nom du bien comme un prénom", () => {
    const { messages } = buildReviewReplyPrompt({ bienNom: "Géko", prenom: "Rabia", rating: 5, reviewText: "Top", classification: "auto" });
    expect(messages[1].content).toContain("Rabia");
    expect(messages[0].content).toMatch(/JAMAIS utiliser le nom du bien/);
  });

  it("sans prénom fourni, indique explicitement de ne pas en inventer un", () => {
    const { messages } = buildReviewReplyPrompt({ bienNom: "Géko", rating: 5, reviewText: "Top", classification: "auto" });
    expect(messages[1].content).toMatch(/non renseigné — ne pas nommer/);
  });
});
