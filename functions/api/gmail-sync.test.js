// functions/api/gmail-sync.test.js
import { describe, it, expect } from "vitest";
import { parseGmailMessage, decodeBase64Url } from "./gmail-sync.js";

function b64url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

describe("decodeBase64Url", () => {
  it("décode un base64url standard", () => {
    expect(decodeBase64Url(b64url("Bonjour Amaryllis"))).toBe("Bonjour Amaryllis");
  });
  it("retourne une chaîne vide si data est absent", () => {
    expect(decodeBase64Url(null)).toBe("");
    expect(decodeBase64Url(undefined)).toBe("");
  });
  it("ne plante pas sur des données invalides", () => {
    expect(decodeBase64Url("!!!not-base64!!!")).toBe("");
  });
});

describe("parseGmailMessage", () => {
  function makeMsg({ from = "Jean Dupont <jean@example.com>", subject = "Re: Confirmation", body = "Bonjour, merci !" } = {}) {
    return {
      internalDate: "1751500000000",
      snippet: "Bonjour, merci !",
      threadId: "thread-abc",
      payload: {
        headers: [
          { name: "From", value: from },
          { name: "Subject", value: subject },
        ],
        mimeType: "text/plain",
        body: { data: b64url(body) },
      },
    };
  }

  it("extrait l'email et le nom depuis l'en-tête From", () => {
    const parsed = parseGmailMessage(makeMsg());
    expect(parsed.fromEmail).toBe("jean@example.com");
    expect(parsed.fromName).toBe("Jean Dupont");
  });

  it("gère un From sans nom (juste une adresse)", () => {
    const parsed = parseGmailMessage(makeMsg({ from: "marie@example.com" }));
    expect(parsed.fromEmail).toBe("marie@example.com");
    expect(parsed.fromName).toBe("marie@example.com");
  });

  it("normalise l'email en minuscules", () => {
    const parsed = parseGmailMessage(makeMsg({ from: "Jean <JEAN@EXAMPLE.COM>" }));
    expect(parsed.fromEmail).toBe("jean@example.com");
  });

  it("extrait le sujet et le corps texte", () => {
    const parsed = parseGmailMessage(makeMsg({ subject: "Question sur l'arrivée" }));
    expect(parsed.subject).toBe("Question sur l'arrivée");
    expect(parsed.text).toBe("Bonjour, merci !");
  });

  it("parcourt les parts multipart pour trouver text/html et text/plain", () => {
    const msg = {
      internalDate: "1751500000000",
      snippet: "snippet",
      payload: {
        headers: [{ name: "From", value: "a@b.com" }, { name: "Subject", value: "S" }],
        parts: [
          { mimeType: "text/plain", body: { data: b64url("version texte") } },
          { mimeType: "text/html", body: { data: b64url("<p>version html</p>") } },
        ],
      },
    };
    const parsed = parseGmailMessage(msg);
    expect(parsed.text).toBe("version texte");
    expect(parsed.html).toBe("<p>version html</p>");
  });

  it("retombe sur le snippet si aucun corps n'est décodable", () => {
    const msg = {
      internalDate: "1751500000000",
      snippet: "juste le snippet",
      payload: { headers: [{ name: "From", value: "a@b.com" }, { name: "Subject", value: "S" }] },
    };
    const parsed = parseGmailMessage(msg);
    expect(parsed.text).toBe("juste le snippet");
  });

  it("utilise le sujet par défaut si absent", () => {
    const msg = {
      internalDate: "1751500000000",
      payload: { headers: [{ name: "From", value: "a@b.com" }] },
    };
    const parsed = parseGmailMessage(msg);
    expect(parsed.subject).toBe("(sans objet)");
  });
});
