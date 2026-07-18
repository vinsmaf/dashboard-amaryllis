import { describe, it, expect } from "vitest";
import {
  isAllowedPath,
  extractJsonArray,
  normalizeClassification,
  hasSupportingKeywords,
  applyKeywordGuard,
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

describe("hasSupportingKeywords", () => {
  it("rejette un item Core Web Vitals classé à tort en live_meta (bug réel vu en prod, traf-051)", () => {
    const text = "Optimiser les pages de propriétés pour améliorer les scores Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms)";
    expect(hasSupportingKeywords(text, "live_meta", { path: "/amaryllis" })).toBe(false);
  });

  it("accepte un live_meta réellement à propos de meta/title/SEO", () => {
    const text = "Compléter GuideArlet avec balisage SEO : title, meta, H1-H3, schema LocalBusiness";
    expect(hasSupportingKeywords(text, "live_meta", { path: "/amaryllis" })).toBe(true);
  });

  it("accepte un ga4_event si le nom d'event apparaît dans le texte", () => {
    const text = "Ajouter event view_item_list sur la homepage";
    expect(hasSupportingKeywords(text, "ga4_event", { eventName: "view_item_list" })).toBe(true);
  });

  it("rejette un ga4_event si le nom d'event n'apparaît nulle part", () => {
    const text = "Mettre en place des indicateurs de performance clés pour les actions marketing";
    expect(hasSupportingKeywords(text, "ga4_event", { eventName: "view_item_list" })).toBe(false);
  });

  it("accepte un jsonld_schema si le schemaType ou le mot json-ld apparaît", () => {
    expect(hasSupportingKeywords("Ajouter JSON-LD VacationRental dans les pages prérendues", "jsonld_schema", { path: "/amaryllis", schemaType: "VacationRental" })).toBe(true);
    expect(hasSupportingKeywords("Enrichir le schema FAQPage complet", "jsonld_schema", { path: "/amaryllis", schemaType: "FAQPage" })).toBe(true);
  });

  it("rejette un jsonld_schema sans aucun appui textuel", () => {
    expect(hasSupportingKeywords("Créer des packages promotionnels basse saison", "jsonld_schema", { path: "/amaryllis", schemaType: "VacationRental" })).toBe(false);
  });
});

describe("applyKeywordGuard", () => {
  it("rétrograde en checkable:false une classification sans appui textuel, laisse les autres intactes", () => {
    const itemsById = new Map([
      ["traf-051", "Optimiser les pages de propriétés pour améliorer les scores Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms)"],
      ["seo-002", "Compléter GuideArlet avec balisage SEO : title, meta, H1-H3, schema LocalBusiness"],
    ]);
    const classified = [
      { id: "traf-051", checkable: true, checkType: "live_meta", params: { path: "/amaryllis" } },
      { id: "seo-002", checkable: true, checkType: "live_meta", params: { path: "/amaryllis" } },
    ];
    const out = applyKeywordGuard(classified, itemsById);
    expect(out[0]).toEqual({ id: "traf-051", checkable: false, checkType: null, params: null });
    expect(out[1]).toEqual({ id: "seo-002", checkable: true, checkType: "live_meta", params: { path: "/amaryllis" } });
  });

  it("laisse passer les entrées déjà checkable:false sans y toucher", () => {
    const out = applyKeywordGuard([{ id: "x-1", checkable: false, checkType: null, params: null }], new Map());
    expect(out).toEqual([{ id: "x-1", checkable: false, checkType: null, params: null }]);
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
