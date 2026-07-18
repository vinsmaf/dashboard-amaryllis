import { describe, it, expect } from "vitest";
import {
  isAllowedPath,
  extractJsonArray,
  normalizeClassification,
  parseHtmlMeta,
  evaluateLiveMeta,
  evaluateGa4Count,
  hasJsonLdType,
  evaluateJsonLdPresence,
} from "./backlogVerify.js";

describe("isAllowedPath", () => {
  it("accepte les slugs de biens connus + racine + guide-hub", () => {
    expect(isAllowedPath("/amaryllis")).toBe(true);
    expect(isAllowedPath("/nogent")).toBe(true);
    expect(isAllowedPath("/guide-hub")).toBe(true);
    expect(isAllowedPath("/")).toBe(true);
  });

  it("rejette tout ce qui n'est pas dans la whitelist (anti-SSRF)", () => {
    expect(isAllowedPath("/inconnu")).toBe(false);
    expect(isAllowedPath("https://evil.com")).toBe(false);
    expect(isAllowedPath("//evil.com")).toBe(false);
    expect(isAllowedPath(undefined)).toBe(false);
    expect(isAllowedPath(null)).toBe(false);
    expect(isAllowedPath(42)).toBe(false);
  });
});

describe("extractJsonArray", () => {
  it("extrait un tableau JSON entouré de texte", () => {
    const text = 'Voici le résultat :\n[{"id":"seo-099","checkable":true}]\nFin.';
    expect(extractJsonArray(text)).toEqual([{ id: "seo-099", checkable: true }]);
  });

  it("retourne null si aucun tableau", () => {
    expect(extractJsonArray("pas de json ici")).toBeNull();
    expect(extractJsonArray("")).toBeNull();
    expect(extractJsonArray(null)).toBeNull();
  });

  it("retourne null si JSON malformé", () => {
    expect(extractJsonArray("[{invalide}]")).toBeNull();
  });
});

describe("normalizeClassification", () => {
  it("accepte un ga4_event avec un nom d'event valide", () => {
    const out = normalizeClassification([
      { id: "data-003", checkable: true, checkType: "ga4_event", params: { eventName: "view_item_list" } },
    ]);
    expect(out[0]).toEqual({ id: "data-003", checkable: true, checkType: "ga4_event", params: { eventName: "view_item_list" } });
  });

  it("rejette un ga4_event avec un nom d'event suspect (injection)", () => {
    const out = normalizeClassification([
      { id: "x-1", checkable: true, checkType: "ga4_event", params: { eventName: "'; DROP TABLE" } },
    ]);
    expect(out[0].checkable).toBe(false);
  });

  it("accepte un live_meta avec un path whitelisté", () => {
    const out = normalizeClassification([
      { id: "seo-050", checkable: true, checkType: "live_meta", params: { path: "/mabouya" } },
    ]);
    expect(out[0]).toEqual({ id: "seo-050", checkable: true, checkType: "live_meta", params: { path: "/mabouya" } });
  });

  it("rejette un live_meta avec un path hors whitelist", () => {
    const out = normalizeClassification([
      { id: "seo-051", checkable: true, checkType: "live_meta", params: { path: "https://evil.com" } },
    ]);
    expect(out[0].checkable).toBe(false);
  });

  it("accepte un jsonld_schema avec path + schemaType valides", () => {
    const out = normalizeClassification([
      { id: "cpw-004", checkable: true, checkType: "jsonld_schema", params: { path: "/amaryllis", schemaType: "VacationRental" } },
    ]);
    expect(out[0]).toEqual({ id: "cpw-004", checkable: true, checkType: "jsonld_schema", params: { path: "/amaryllis", schemaType: "VacationRental" } });
  });

  it("force checkable:false par défaut si le LLM ne propose pas de checkType reconnu", () => {
    const out = normalizeClassification([
      { id: "cm-030", checkable: true, checkType: "photo_verification", params: {} },
      { id: "cm-041", checkable: false, checkType: null, params: null },
    ]);
    expect(out).toEqual([
      { id: "cm-030", checkable: false, checkType: null, params: null },
      { id: "cm-041", checkable: false, checkType: null, params: null },
    ]);
  });

  it("ignore les entrées sans id, et gère un input non-tableau", () => {
    expect(normalizeClassification([{ checkable: true }])).toEqual([]);
    expect(normalizeClassification(null)).toEqual([]);
    expect(normalizeClassification("pas un tableau")).toEqual([]);
  });
});

describe("parseHtmlMeta", () => {
  it("extrait title et meta description (ordre name puis content)", () => {
    const html = '<html><head><title>Villa Mabouya — studio Martinique</title><meta name="description" content="Studio cosy avec jacuzzi privatif."></head></html>';
    expect(parseHtmlMeta(html)).toEqual({ title: "Villa Mabouya — studio Martinique", description: "Studio cosy avec jacuzzi privatif." });
  });

  it("extrait la meta description avec ordre content puis name", () => {
    const html = '<meta content="Une description." name="description">';
    expect(parseHtmlMeta(html).description).toBe("Une description.");
  });

  it("retourne des chaînes vides si rien trouvé", () => {
    expect(parseHtmlMeta("<html></html>")).toEqual({ title: "", description: "" });
    expect(parseHtmlMeta(null)).toEqual({ title: "", description: "" });
  });
});

describe("evaluateLiveMeta", () => {
  it("vérifie une meta correcte et personnalisée", () => {
    const res = evaluateLiveMeta({ title: "Villa Mabouya — studio Martinique", description: "Studio cosy avec jacuzzi privatif, idéal pour un séjour en amoureux." });
    expect(res.verified).toBe(true);
  });

  it("refuse un titre trop court/absent", () => {
    const res = evaluateLiveMeta({ title: "X", description: "Une description suffisamment longue pour passer le seuil." });
    expect(res.verified).toBe(false);
  });

  it("refuse une description trop longue (tronquée en SERP)", () => {
    const res = evaluateLiveMeta({ title: "Villa Mabouya — studio Martinique", description: "x".repeat(200) });
    expect(res.verified).toBe(false);
  });

  it("refuse une description générique non personnalisée", () => {
    const res = evaluateLiveMeta({ title: "Villa Mabouya — studio Martinique", description: "Amaryllis Locations" });
    expect(res.verified).toBe(false);
  });
});

describe("evaluateGa4Count", () => {
  it("vérifie quand l'event a au moins 1 occurrence", () => {
    expect(evaluateGa4Count("view_item_list", 12).verified).toBe(true);
  });

  it("refuse quand l'event n'a jamais été vu", () => {
    expect(evaluateGa4Count("view_item_list", 0).verified).toBe(false);
  });

  it("seuil personnalisable", () => {
    expect(evaluateGa4Count("purchase", 2, 5).verified).toBe(false);
    expect(evaluateGa4Count("purchase", 5, 5).verified).toBe(true);
  });
});

describe("hasJsonLdType", () => {
  it("détecte un @type simple", () => {
    const html = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"VacationRental","name":"Amaryllis"}</script>';
    expect(hasJsonLdType(html, "VacationRental")).toBe(true);
  });

  it("détecte un @type dans un tableau @type", () => {
    const html = '<script type="application/ld+json">{"@type":["Product","VacationRental"]}</script>';
    expect(hasJsonLdType(html, "VacationRental")).toBe(true);
  });

  it("détecte un @type niché dans @graph", () => {
    const html = '<script type="application/ld+json">{"@graph":[{"@type":"WebPage"},{"@type":"FAQPage","mainEntity":[]}]}</script>';
    expect(hasJsonLdType(html, "FAQPage")).toBe(true);
  });

  it("retourne false si le type est absent", () => {
    const html = '<script type="application/ld+json">{"@type":"WebPage"}</script>';
    expect(hasJsonLdType(html, "VacationRental")).toBe(false);
  });

  it("ignore un bloc JSON-LD malformé sans planter", () => {
    const html = '<script type="application/ld+json">{invalide}</script>';
    expect(hasJsonLdType(html, "VacationRental")).toBe(false);
  });

  it("retourne false si pas de HTML", () => {
    expect(hasJsonLdType(null, "VacationRental")).toBe(false);
    expect(hasJsonLdType("", "VacationRental")).toBe(false);
  });
});

describe("evaluateJsonLdPresence", () => {
  it("reflète le booléen trouvé avec une preuve lisible", () => {
    expect(evaluateJsonLdPresence(true, "VacationRental").verified).toBe(true);
    expect(evaluateJsonLdPresence(false, "VacationRental").verified).toBe(false);
  });
});
