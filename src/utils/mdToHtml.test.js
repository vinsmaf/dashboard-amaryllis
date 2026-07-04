import { describe, it, expect } from "vitest";
import { mdToHtml } from "./mdToHtml.js";

describe("mdToHtml", () => {
  it("convertit les titres h1/h2/h3", () => {
    expect(mdToHtml("# Titre")).toBe("<h1>Titre</h1>");
    expect(mdToHtml("## Sous-titre")).toBe("<h2>Sous-titre</h2>");
    expect(mdToHtml("### Section")).toBe("<h3>Section</h3>");
  });

  it("convertit le gras et le code inline", () => {
    expect(mdToHtml("**gras** et `code`")).toBe("<p><strong>gras</strong> et <code>code</code></p>");
  });

  it("convertit une liste à puces", () => {
    expect(mdToHtml("- un\n- deux")).toBe("<ul><li>un</li><li>deux</li></ul>");
  });

  it("convertit une citation", () => {
    expect(mdToHtml("> une citation")).toBe("<blockquote>une citation</blockquote>");
  });

  it("convertit une table markdown", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    expect(mdToHtml(md)).toBe("<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>");
  });

  it("échappe le HTML avant balisage (anti-injection sur du contenu contrôlé)", () => {
    expect(mdToHtml("<script>alert(1)</script>")).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  });

  it("gère une entrée vide/nulle sans planter", () => {
    expect(mdToHtml("")).toBe("");
    expect(mdToHtml(null)).toBe("");
    expect(mdToHtml(undefined)).toBe("");
  });
});
