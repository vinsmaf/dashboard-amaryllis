// Logique pure : vérification autonome du backlog agent_actions (I-11 — machine qui
// tourne seule). Utilisée par functions/api/backlog-verify.js (cron hebdo, lundi).
//
// Principe : le LLM classifie CHAQUE item backlog en "fait technique vérifiable
// numériquement" (checkable) ou non — jamais le contraire. Un checker DÉTERMINISTE
// (jamais le LLM) tranche vrai/faux à partir de la réalité déployée (page live, GA4).
// Seul un checker positif ferme l'item ; sinon il reste dans le backlog de Vincent.
// Défaut systématique = ne rien fermer en cas de doute (jamais deviner une preuve).

import { ALL_BIENS } from "../data/biens.js";

// ── Chemins autorisés pour un fetch live (whitelist anti-SSRF : le LLM ne doit
// jamais pouvoir faire pointer le checker ailleurs que sur nos propres pages) ──
export const ALLOWED_PATHS = new Set([
  "/", "/guide-hub",
  ...ALL_BIENS.map((b) => `/${b.id}`),
]);

export function isAllowedPath(path) {
  return typeof path === "string" && ALLOWED_PATHS.has(path);
}

// ── Extraction JSON tolérante d'une réponse LLM (tableau) ──────────────────
export function extractJsonArray(text) {
  if (!text) return null;
  const a = text.indexOf("["), b = text.lastIndexOf("]");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

const CHECK_TYPES = new Set(["ga4_event", "live_meta", "jsonld_schema"]);

// Valide et normalise la sortie brute du LLM classifieur — rejette (checkable:false)
// tout ce qui n'a pas un checkType reconnu + des params exploitables. Ne fait AUCUNE
// vérification de réalité ici (c'est le rôle des evaluate*).
export function normalizeClassification(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r.id === "string")
    .map((r) => {
      if (!r.checkable || !CHECK_TYPES.has(r.checkType) || typeof r.params !== "object" || !r.params) {
        return { id: r.id, checkable: false, checkType: null, params: null };
      }
      if (r.checkType === "ga4_event") {
        const eventName = r.params.eventName;
        if (typeof eventName !== "string" || !/^[a-z][a-z0-9_]{1,60}$/.test(eventName)) {
          return { id: r.id, checkable: false, checkType: null, params: null };
        }
        return { id: r.id, checkable: true, checkType: "ga4_event", params: { eventName } };
      }
      if (r.checkType === "live_meta") {
        if (!isAllowedPath(r.params.path)) return { id: r.id, checkable: false, checkType: null, params: null };
        return { id: r.id, checkable: true, checkType: "live_meta", params: { path: r.params.path } };
      }
      // jsonld_schema
      const schemaType = r.params.schemaType;
      if (!isAllowedPath(r.params.path) || typeof schemaType !== "string" || !/^[A-Za-z]{2,40}$/.test(schemaType)) {
        return { id: r.id, checkable: false, checkType: null, params: null };
      }
      return { id: r.id, checkable: true, checkType: "jsonld_schema", params: { path: r.params.path, schemaType } };
    });
}

// ── Parsing HTML minimal (titre + meta description) ────────────────────────
export function parseHtmlMeta(html) {
  if (!html) return { title: "", description: "" };
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const descMatch =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||
    html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  return {
    title: (titleMatch?.[1] || "").trim(),
    description: (descMatch?.[1] || "").trim(),
  };
}

const GENERIC_DESCRIPTIONS = new Set(["", "amaryllis locations", "villamaryllis.com"]);

// ── Checker 1 — meta SEO publiée et dans les bornes (CLAUDE.md : title≤60, desc≤158) ──
export function evaluateLiveMeta({ title, description }, opts = {}) {
  const minTitleLen = opts.minTitleLen ?? 10;
  const maxTitleLen = opts.maxTitleLen ?? 66; // tolérance +10% vs 60
  const minDescLen = opts.minDescLen ?? 20;
  const maxDescLen = opts.maxDescLen ?? 174; // tolérance +10% vs 158

  if (title.length < minTitleLen || title.length > maxTitleLen) {
    return { verified: false, evidence: `title absent ou hors bornes (${title.length}c)` };
  }
  if (description.length < minDescLen || description.length > maxDescLen) {
    return { verified: false, evidence: `description absente ou hors bornes (${description.length}c)` };
  }
  if (GENERIC_DESCRIPTIONS.has(description.trim().toLowerCase())) {
    return { verified: false, evidence: "description générique (non personnalisée)" };
  }
  return { verified: true, evidence: `title ${title.length}c / description ${description.length}c publiées en prod` };
}

// ── Checker 2 — event GA4 réellement remonté (30 derniers jours) ───────────
export function evaluateGa4Count(eventName, count, minCount = 1) {
  const n = Number(count) || 0;
  if (n >= minCount) {
    return { verified: true, evidence: `event "${eventName}" vu ${n}× sur les 30 derniers jours (GA4)` };
  }
  return { verified: false, evidence: `event "${eventName}" absent de GA4 sur les 30 derniers jours` };
}

// ── Checker 3 — schema JSON-LD présent sur la page live ────────────────────
export function hasJsonLdType(html, schemaType) {
  if (!html) return false;
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of blocks) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch { continue; }
    const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ? [parsed, ...parsed["@graph"]] : [parsed];
    for (const node of nodes) {
      const t = node?.["@type"];
      if (t === schemaType || (Array.isArray(t) && t.includes(schemaType))) return true;
    }
  }
  return false;
}

export function evaluateJsonLdPresence(found, schemaType) {
  return found
    ? { verified: true, evidence: `schema "${schemaType}" présent en JSON-LD sur la page live` }
    : { verified: false, evidence: `schema "${schemaType}" absent du JSON-LD de la page live` };
}
