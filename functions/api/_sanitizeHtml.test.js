// functions/api/_sanitizeHtml.test.js
import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./_sanitizeHtml.js";

describe("sanitizeHtml", () => {
  it("strip les <script>...</script> et leur contenu", () => {
    const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    const out = sanitizeHtml(input);
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert");
    expect(out).toContain("<p>Hello</p>");
    expect(out).toContain("<p>World</p>");
  });

  it("strip les attributs onXXX (onclick, onload, onerror, etc.)", () => {
    const input = '<img src="x.jpg" onerror="alert(1)" onclick=\'bad()\'><p onload="x">Hi</p>';
    const out = sanitizeHtml(input);
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onload");
    expect(out).toContain('src="x.jpg"');
  });

  it("remplace href/src javascript: par #", () => {
    const input = '<a href="javascript:alert(1)">Click</a><img src="javascript:bad()">';
    const out = sanitizeHtml(input);
    expect(out).not.toContain("javascript:");
    expect(out).toContain('href="#"');
    expect(out).toContain('src="#"');
  });

  it("laisse intact un HTML d'email normal", () => {
    const input = '<div style="color:red"><p>Bonjour <strong>François</strong></p><a href="https://villamaryllis.com">Lien</a></div>';
    const out = sanitizeHtml(input);
    expect(out).toBe(input);
  });

  it("gère les inputs invalides (null, undefined, vide)", () => {
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(123)).toBe("");
  });
});
