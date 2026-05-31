// functions/api/_triage.js
// Helper PUR de triage des actions agents — aucune I/O, testable en isolation.

// Verbes "mous" en tête d'action (signal de vague)
const SOFT_VERBS = [
  "améliorer", "optimiser", "mettre en place un système", "développer une stratégie",
  "renforcer", "envisager", "explorer", "réfléchir", "analyser les", "mieux ", "divers",
];

// Marqueurs de concret : bien nommé, chiffre, %, €, endpoint/outil connu
const CONCRETE_RE = /\d|€|%|\b(Nogent|Amaryllis|Zandoli|Mabouya|Géko|Geko|Schoelcher|Schœlcher|Iguana)\b|\b(GA4|D1|GBP|Airbnb|Stripe|Beds24|Apify|RAG|cron|Worker|RevPAR|ADR)\b/i;

export function isVague(action) {
  const t = String(action || "").trim().toLowerCase();
  if (!t) return true;
  const hasSoftVerb = SOFT_VERBS.some(v => t.startsWith(v) || t.slice(0, 35).includes(v));
  const hasConcrete = CONCRETE_RE.test(action || "");
  return hasSoftVerb && !hasConcrete;
}

const STOPWORDS = new Set(["les","des","le","la","de","du","un","une","et","a","à","pour","sur","dans","par","avec","ou","au","aux","en","plus","via"]);

function tokens(s) {
  return new Set(
    String(s || "").toLowerCase()
      .match(/[a-zàâéèêîôûç0-9]+/g)
      ?.filter(w => w.length > 2 && !STOPWORDS.has(w)) || []
  );
}

// Jaccard ≥ 0.55 → considéré doublon. Retourne l'id existant, sinon null.
export function isDuplicate(action, existingActions, threshold = 0.55) {
  const a = tokens(action);
  if (a.size === 0) return null;
  for (const ex of existingActions || []) {
    const b = tokens(ex.action);
    if (b.size === 0) continue;
    const inter = [...a].filter(w => b.has(w)).length;
    const union = new Set([...a, ...b]).size;
    if (union > 0 && inter / union >= threshold) return ex.id;
  }
  return null;
}

export const BLOCKED_CATEGORIES = new Set(["legal", "ads", "revenue"]);
export const BLOCKED_KEYWORDS = [
  "prix", "tarif", "appliquer", "publier prix", "dépense", "budget", "campagne",
  "lancer", "google ads", "meta ads", "caution", "stripe", "paiement", "rgpd",
  "cgv", "déclaration", "contrat", "supprimer", "gbp", "fiche google",
];
const AUTO_CATEGORIES = new Set(["content", "seo"]);

function effortHours(effort) {
  const e = String(effort || "").toLowerCase();
  if (e.includes("30min")) return 0.5;
  const m = e.match(/^(\d+)\s*h/);
  return m ? Number(m[1]) : 99;
}

// Ordre impératif : blocked → auto → review. Tolère une entrée null/undefined.
export function classifyRisk(action) {
  if (!action || typeof action !== "object") return "review";
  const cat = (action.category || "").toLowerCase();
  const text = (action.action || "").toLowerCase();
  if (BLOCKED_CATEGORIES.has(cat)) return "blocked";
  if (BLOCKED_KEYWORDS.some(k => text.includes(k))) return "blocked";
  if (AUTO_CATEGORIES.has(cat) && effortHours(action.effort) <= 2) return "auto";
  return "review";
}

// Orchestrateur : décide keep + risk + raison. Ordre : vague → court → doublon → classify.
// vague avant court : une action à verbe mou doit être étiquetée "vague" même si elle est courte.
// court n'exclut PAS une action concrète (chiffre, €, % ou bien nommé via CONCRETE_RE).
export function triageAction(action, existingActions = []) {
  if (!action || typeof action !== "object") return { keep: false, reason: "invalide" };
  const text = String(action.action || "").trim();
  if (isVague(text)) return { keep: false, reason: "vague" };
  if (text.length < 45 && !CONCRETE_RE.test(text)) return { keep: false, reason: "court" };
  const dupOf = isDuplicate(text, existingActions);
  if (dupOf) return { keep: false, reason: "duplicate", dupOf };
  return { keep: true, risk: classifyRisk(action) };
}
