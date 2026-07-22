// Logique pure — Social Growth Manager (agent de croissance des abonnés réseaux sociaux).
// Aucune I/O, aucun LLM : mesure déterministe et testable. Importé directement par les
// Cloudflare Functions (functions/api/social-insights.js, social-growth-agent.js) et par l'UI admin.
//
// Modèle calqué sur l'agent budget pub (src/utils/adBudgetAgent.js) : la logique métier vit ici,
// testée en vitest ; les endpoints ne font que l'I/O (fetch APIs, D1) autour.
//
// Plateformes : Facebook + Instagram (mesurables via META_PAGE_TOKEN), YouTube (subscriberCount
// via Data API si configuré), GBP (bloqué tant que l'accès API Google n'est pas approuvé).

export const SOCIAL_PLATFORMS = ["facebook", "instagram", "youtube", "gbp"];

export const PLATFORM_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  gbp: "Google Business Profile",
};

// ── Dates ────────────────────────────────────────────────────────────────────
// Toutes les dates sont des chaînes ISO "YYYY-MM-DD" (UTC), comparables lexicographiquement.

export function isoDaysBefore(isoDate, n) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// Valeur d'abonnés au plus proche (et antérieure ou égale) d'une date cible, dans une série.
// series : [{ date:"YYYY-MM-DD", followers:Number }, ...] (ordre quelconque).
// Retourne le nombre d'abonnés du dernier point <= targetDate, ou null si aucun.
export function followersAt(series, targetDate) {
  if (!Array.isArray(series) || !series.length || !targetDate) return null;
  let best = null;
  for (const p of series) {
    if (!p || typeof p.date !== "string" || typeof p.followers !== "number") continue;
    if (p.date <= targetDate && (!best || p.date > best.date)) best = p;
  }
  return best ? best.followers : null;
}

function round1(n) {
  return n == null ? null : Math.round(n * 10) / 10;
}

// ── Croissance par plateforme ────────────────────────────────────────────────
// series : historique d'une plateforme. asOf : date du dernier snapshot ("YYYY-MM-DD").
// Retourne les abonnés courants + variation 7j / 30j (absolue et %) — null si données absentes.
export function computePlatformGrowth(series, asOf) {
  const current = followersAt(series, asOf);
  const ref7  = followersAt(series, isoDaysBefore(asOf, 7));
  const ref30 = followersAt(series, isoDaysBefore(asOf, 30));

  const delta7  = current != null && ref7  != null ? current - ref7  : null;
  const delta30 = current != null && ref30 != null ? current - ref30 : null;
  const pct30   = delta30 != null && ref30 > 0 ? (delta30 / ref30) * 100 : null;

  return {
    current,
    delta_7d: delta7,
    delta_30d: delta30,
    growth_30d_pct: round1(pct30),
  };
}

// Nombre d'abonnés à gagner sur le mois pour atteindre la cible % (base = abonnés courants).
export function neededMonthlyFollowers(current, targetPct) {
  if (current == null || current <= 0 || !(targetPct > 0)) return null;
  return Math.ceil((current * targetPct) / 100);
}

// Verdict de la croissance mensuelle réelle vs la cible % mensuelle.
//  - "ahead"    : croissance >= cible
//  - "on_track" : croissance >= 70 % de la cible (dans la marge)
//  - "behind"   : en dessous
//  - "no_data"  : pas assez d'historique (< 30 j de recul)
export function targetVerdict(growth, targetPct) {
  if (!growth || growth.growth_30d_pct == null || !(targetPct > 0)) {
    return { verdict: "no_data", gap_pct: null };
  }
  const actual = growth.growth_30d_pct;
  const gap = round1(actual - targetPct);
  let verdict;
  if (actual >= targetPct) verdict = "ahead";
  else if (actual >= targetPct * 0.7) verdict = "on_track";
  else verdict = "behind";
  return { verdict, gap_pct: gap };
}

// ── Santé d'une plateforme (honnêteté de la mesure, comme le `health` de l'agent pub) ──
// cfg : { configured:bool, blocked:bool, error:(string|null) }
//  - "error"          : l'appel API a échoué
//  - "pending_access" : intégration prévue mais accès non encore accordé (ex. GBP)
//  - "not_configured" : secret/ID manquant (ex. YouTube channel non renseigné)
//  - "measurable"     : on lit une vraie valeur
export function platformHealth(cfg = {}) {
  if (cfg.error) return "error";
  if (cfg.blocked) return "pending_access";
  if (!cfg.configured) return "not_configured";
  return "measurable";
}

// ── Synthèse multi-plateformes ───────────────────────────────────────────────
// platforms : [{ platform, health, growth, verdict, current }]
// Ne totalise QUE les plateformes réellement mesurables (jamais un chiffre inventé).
export function summarizeGrowth(platforms = []) {
  const measurable = platforms.filter(p => p.health === "measurable" && typeof p.current === "number");
  const totalFollowers = measurable.reduce((s, p) => s + p.current, 0);
  const totalDelta30 = measurable.reduce(
    (s, p) => s + (p.growth && typeof p.growth.delta_30d === "number" ? p.growth.delta_30d : 0),
    0,
  );
  const behind = platforms.filter(p => p.verdict === "behind").map(p => p.platform);
  const pending = platforms.filter(p => p.health === "pending_access" || p.health === "not_configured").map(p => p.platform);

  return {
    total_followers: totalFollowers,
    total_delta_30d: totalDelta30,
    measurable_count: measurable.length,
    behind_platforms: behind,
    pending_platforms: pending,
  };
}
