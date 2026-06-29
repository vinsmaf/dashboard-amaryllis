// Moteur du « gate de qualité » d'auto-publication réseaux (logique PURE, testée).
// Décide si un draft social_post peut être publié automatiquement SANS validation humaine.
// Tous les filtres sont CUMULATIFS : un seul qui échoue → pass=false → escalade humaine (ntfy).
//
// Garde-fous (du plus dur au plus souple) :
//   1. mots interdits / faits faux  → fact-check déterministe = 0 erreur (BLOQUANT, exigence Vincent)
//   2. photo autorisée              → l'image doit être dans la whitelist que Vincent a cochée
//   3. forme                        → image présente + channels = [ig, fb] + pas de doublon du bien < 7j
//   4. qualité rédactionnelle       → score LLM-juge ≥ minScore (def. 75) ET verdict ≠ "reject"
//
// Le module ne touche JAMAIS la base : toutes les données (whitelist, posts récents, règles
// apprises) sont passées en argument → 100% testable. L'orchestration D1/ntfy est dans
// editorial-gate.js. Réutilise factCheckCaption de _factcheck.js (source unique des faits).

import { factCheckCaption } from "./_factcheck.js";

// Extrait { bien, base } d'une URL photo type ".../photos/amaryllis/03.webp" → { bien:"amaryllis", base:"03" }
export function parsePhotoUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  const m = imageUrl.match(/\/photos\/([a-z]+)\/(\d+)\.webp/i);
  if (!m) return null;
  return { bien: m[1].toLowerCase(), base: String(parseInt(m[2], 10)).padStart(2, "0") };
}

/**
 * Évalue un draft pour l'auto-publication.
 * @param {object} o
 * @param {string} o.caption           texte du post
 * @param {string} o.imageUrl          URL de l'image
 * @param {string[]} o.channels        canaux demandés
 * @param {number} o.score             score LLM-juge (reviews.score)
 * @param {string} o.verdict           verdict LLM-juge (reviews.verdict)
 * @param {Object<string,string[]>} o.allowedPhotosByBien  whitelist { bien: ["01","03",...] }
 * @param {Set<string>|string[]} o.recentBienPosts  bien_id publiés < 7j (anti-doublon)
 * @param {Array} [o.learnedRules]     règles fact-check apprises (agent_lessons)
 * @param {number} [o.minScore=85]
 * @param {string} [o.expectedBien]    bien attendu (depuis le calendrier) — cohérence optionnelle
 * @returns {{pass:boolean, fails:Array<{filter:string,reason:string}>, bien:?string, photoBase:?string, factErrors:Array}}
 */
export function evaluateGate(o) {
  const {
    caption, imageUrl, channels,
    score, verdict,
    allowedPhotosByBien = {},
    recentBienPosts = [],
    learnedRules = [],
    minScore = 85,
    expectedBien = null,
  } = o || {};

  const fails = [];
  const photo = parsePhotoUrl(imageUrl);
  const bien = photo?.bien || expectedBien || null;
  const recentSet = recentBienPosts instanceof Set ? recentBienPosts : new Set(recentBienPosts);

  // ── Filtre 1 — mots interdits / faits faux (BLOQUANT) ───────────────────────
  const factErrors = factCheckCaption(caption || "", learnedRules, bien);
  if (factErrors.length) {
    fails.push({ filter: "mots_interdits", reason: factErrors.map((e) => e.phrase || e.reason).slice(0, 3).join(" · ") });
  }

  // ── Filtre 2 — photo autorisée (whitelist Vincent) ──────────────────────────
  if (!photo) {
    fails.push({ filter: "photo", reason: "image absente ou format inattendu" });
  } else if (expectedBien && photo.bien !== expectedBien) {
    fails.push({ filter: "photo", reason: `photo du bien « ${photo.bien} » ≠ bien attendu « ${expectedBien} »` });
  } else {
    const allowed = allowedPhotosByBien[photo.bien] || [];
    if (!allowed.map((p) => String(parseInt(p, 10)).padStart(2, "0")).includes(photo.base)) {
      fails.push({ filter: "photo", reason: `photo ${photo.bien}/${photo.base} non autorisée (pas dans ta sélection)` });
    }
  }

  // ── Filtre 3 — forme (canaux + anti-doublon) ────────────────────────────────
  const ch = Array.isArray(channels) ? channels.map((c) => String(c).toLowerCase()) : [];
  if (!(ch.includes("ig") && ch.includes("fb"))) {
    fails.push({ filter: "forme", reason: `channels doit = [ig, fb] (reçu : ${ch.join(",") || "vide"})` });
  }
  if (bien && recentSet.has(bien)) {
    fails.push({ filter: "doublon", reason: `${bien} déjà publié dans les 6 derniers jours` });
  }

  // ── Filtre 4 — qualité rédactionnelle (LLM-juge) ────────────────────────────
  const sc = Number(score);
  if (!Number.isFinite(sc) || sc < minScore) {
    fails.push({ filter: "score", reason: `score ${Number.isFinite(sc) ? sc : "?"}/100 < ${minScore}` });
  }
  // "needs_edits" est acceptable si le score passe — seul "reject" bloque.
  if (verdict && verdict === "reject") {
    fails.push({ filter: "verdict", reason: `verdict « ${verdict} » — contenu rejeté par le juge LLM` });
  }

  return { pass: fails.length === 0, fails, bien, photoBase: photo?.base || null, factErrors };
}
