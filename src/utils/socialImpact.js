// src/utils/socialImpact.js — boucle de feedback du Social Growth Manager (logique pure, testable).
// Mesure l'impact des publications sociales sur les ABONNÉS : pour chaque publication, compare
// le total d'abonnés (FB+IG mesurables) des `windowDays` jours SUIVANTS (J+1..J+N) à la baseline
// des `windowDays` jours PRÉCÉDENTS (J-N..J-1). Le jour J lui-même est neutre.
//
// Symétrique de src/utils/agentsImpact.js (delta sessions GA4) — même architecture, même
// vocabulaire (avant/après/delta/incomplete), mais delta d'ABONNÉS au lieu de sessions.
// Consommé par functions/api/social-impact.js.

export { normalizeGa4Date, toYMD, addDays } from "./agentsImpact.js";
import { toYMD, addDays } from "./agentsImpact.js";

const GROWTH_AGENT_MARKER = "source:growth-agent";

// Un post est-il issu de la passerelle éditoriale de l'agent (vs planification manuelle/rotation) ?
export function isGrowthAgentSourced(brief) {
  return String(brief || "").includes(GROWTH_AGENT_MARKER);
}

function sumWindow(followersByDate, days) {
  // Jour sans snapshot (avant le déploiement du tracking, ou trou) → 0 (traité comme absent, pas comme 0 abonné réel).
  return days.reduce((s, d) => s + (Number(followersByDate[d]) || 0), 0);
}

function pctDelta(before, after) {
  if (before > 0) return Math.round(((after - before) / before) * 1000) / 10;
  return after > 0 ? null : 0;
}

/**
 * Calcule l'impact abonnés de chaque publication + un résumé agrégé (global + growth-agent seul).
 *
 * @param {Array<object>} publications — [{ id, publishedAt (unix sec), bien_id, format, brief, ... }]
 * @param {object} followersByDate — { "YYYY-MM-DD": totalFollowersFbPlusIg }
 * @param {object} [opts]
 * @param {number} [opts.windowDays=2]
 * @param {string} [opts.today] — "YYYY-MM-DD" UTC, défaut = aujourd'hui
 * @returns {{ publications: Array<object>, summary: object, growthAgentSummary: object }}
 */
export function computeSocialImpacts(publications, followersByDate, opts = {}) {
  const windowDays = opts.windowDays || 2;
  const today = opts.today || toYMD(Math.floor(Date.now() / 1000));
  const followers = followersByDate || {};

  const out = (publications || [])
    .filter((p) => p && Number(p.publishedAt) > 0)
    .map((p) => {
      const day = toYMD(Number(p.publishedAt));
      const beforeDays = [];
      const afterDays = [];
      for (let i = windowDays; i >= 1; i--) beforeDays.push(addDays(day, -i));
      for (let i = 1; i <= windowDays; i++) afterDays.push(addDays(day, i));

      const followersAvant = sumWindow(followers, beforeDays) / windowDays;
      const followersApres = sumWindow(followers, afterDays) / windowDays;
      const delta = Math.round((followersApres - followersAvant) * 10) / 10;
      const incomplete = afterDays[afterDays.length - 1] >= today;

      return {
        ...p,
        date: day,
        growthAgent: isGrowthAgentSourced(p.brief),
        followersAvant: Math.round(followersAvant * 10) / 10,
        followersApres: Math.round(followersApres * 10) / 10,
        delta,
        deltaPct: incomplete ? null : pctDelta(followersAvant, followersApres),
        incomplete,
      };
    });

  const summarize = (list) => {
    const complete = list.filter((p) => !p.incomplete);
    const pcts = complete.map((p) => p.deltaPct).filter((v) => v !== null);
    let best = null, worst = null;
    for (const p of complete) {
      if (!best || p.delta > best.delta) best = p;
      if (!worst || p.delta < worst.delta) worst = p;
    }
    const brief = (p) => (p ? { id: p.id, date: p.date, bien_id: p.bien_id, format: p.format, delta: p.delta, deltaPct: p.deltaPct } : null);
    return {
      count: list.length,
      completeCount: complete.length,
      incompleteCount: list.length - complete.length,
      avgDelta: complete.length ? Math.round((complete.reduce((s, p) => s + p.delta, 0) / complete.length) * 10) / 10 : null,
      avgDeltaPct: pcts.length ? Math.round((pcts.reduce((s, v) => s + v, 0) / pcts.length) * 10) / 10 : null,
      best: brief(best),
      worst: brief(worst),
    };
  };

  return {
    publications: out,
    summary: summarize(out),
    growthAgentSummary: summarize(out.filter((p) => p.growthAgent)),
  };
}
