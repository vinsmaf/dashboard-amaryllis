// I-09 — Runbook de délégation : logique pure (testée par delegation.test.js).
//
// Mesure ce que Vincent fait ENCORE À LA MAIN, à partir des traces DÉJÀ loguées en D1
// (aucune instrumentation intrusive : on ne lit que des actes déjà enregistrés par les
// endpoints admin existants). Cap : délégation totale de l'opérationnel d'ici 2028 —
// cet indice mesure la distance restante, pas la santé du business.
//
// ⚠️ Les sources mélangent 3 formats d'horodatage (piège vérifié 2026-07-17) :
//   - secondes  : action_outcomes.completed_at, reclamations.resolved_at,
//                 agent_lessons.created_at, agent_drafts.approved_at, config_edits.created_at
//   - millisec. : rm_recommendations.reviewed_at, emails_log.sent_at
//   - texte ISO : suggestion_acks.acked_at — écrit en heure MARTINIQUE (datetime('now','-4 hours')),
//                 sans suffixe de fuseau → doit être recalé de +4h pour redevenir de l'UTC réel.

const MS_THRESHOLD = 1e11; // ~1973 en ms, ~5138 en s → au-delà, c'est forcément des millisecondes
const MARTINIQUE_OFFSET_SEC = 4 * 3600;
export const WEEK_SEC = 7 * 24 * 3600;

/**
 * Normalise un horodatage hétérogène (s | ms | texte ISO) en secondes epoch.
 * Retourne null si non interprétable — l'appelant filtre.
 */
export function toEpochSeconds(value, { isMartiniqueLocal = false } = {}) {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.floor(value >= MS_THRESHOLD ? value / 1000 : value);
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && value.trim() !== "") {
      return toEpochSeconds(numeric);
    }
    // SQLite datetime('now') → "YYYY-MM-DD HH:MM:SS" (pas de T, pas de Z) : Date le lit
    // comme de l'heure LOCALE du runtime, ce qui varierait selon la machine. On force l'UTC.
    const iso = value.includes("T") ? value : value.replace(" ", "T");
    const withZone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
    const parsed = Date.parse(withZone);
    if (Number.isNaN(parsed)) return null;
    const sec = Math.floor(parsed / 1000);
    // Valeur écrite en heure Martinique mais stockée sans fuseau → la recaler en UTC.
    return isMartiniqueLocal ? sec + MARTINIQUE_OFFSET_SEC : sec;
  }

  return null;
}

/**
 * Répartit des actes en tranches hebdomadaires glissantes, la plus récente en tête (index 0).
 * `acts` : [{ kind, at }] où `at` est déjà en secondes epoch.
 * Retourne [{ weekIndex, from, to, total, byKind }] de longueur `weeks`.
 */
export function bucketByWeek(acts, { now, weeks = 8 } = {}) {
  const buckets = [];
  for (let i = 0; i < weeks; i++) {
    const to = now - i * WEEK_SEC;
    buckets.push({ weekIndex: i, from: to - WEEK_SEC, to, total: 0, byKind: {} });
  }
  for (const act of acts) {
    if (act?.at == null) continue;
    const age = now - act.at;
    if (age < 0 || age >= weeks * WEEK_SEC) continue; // hors fenêtre (futur ou trop ancien)
    const idx = Math.floor(age / WEEK_SEC);
    const b = buckets[idx];
    b.total += 1;
    b.byKind[act.kind] = (b.byKind[act.kind] || 0) + 1;
  }
  return buckets;
}

/**
 * Tendance : moyenne hebdo des `half` dernières semaines vs les `half` précédentes.
 * Le signe est orienté « délégation » : direction 'down' = Vincent agit moins = ça va dans le bon sens.
 * `deltaPct` = null quand la période de référence est vide (aucune base de comparaison honnête).
 */
export function computeTrend(buckets, { half = 4 } = {}) {
  const recent = buckets.slice(0, half);
  const previous = buckets.slice(half, half * 2);
  if (!recent.length || !previous.length) {
    return { recentAvg: 0, previousAvg: 0, deltaPct: null, direction: "unknown" };
  }
  const avg = (arr) => arr.reduce((s, b) => s + b.total, 0) / arr.length;
  const recentAvg = avg(recent);
  const previousAvg = avg(previous);

  if (previousAvg === 0) {
    return {
      recentAvg,
      previousAvg,
      deltaPct: null, // pas de division par zéro déguisée en "+∞ %"
      direction: recentAvg === 0 ? "flat" : "up",
    };
  }
  const deltaPct = ((recentAvg - previousAvg) / previousAvg) * 100;
  const direction = Math.abs(deltaPct) < 10 ? "flat" : deltaPct < 0 ? "down" : "up";
  return { recentAvg, previousAvg, deltaPct, direction };
}

/**
 * Candidats à l'automatisation : les natures d'acte assez FRÉQUENTES et assez RÉGULIÈRES
 * pour valoir une automatisation. La régularité compte autant que le volume — 40 actes
 * groupés sur une seule semaine est un one-shot, pas une routine à automatiser.
 * `minPerWeek` : moyenne hebdo minimale · `minWeeksPresent` : nb de semaines où l'acte apparaît.
 */
export function findAutomationCandidates(buckets, { minPerWeek = 3, minWeeksPresent = 3 } = {}) {
  const kinds = new Set();
  for (const b of buckets) for (const k of Object.keys(b.byKind)) kinds.add(k);

  const out = [];
  for (const kind of kinds) {
    const total = buckets.reduce((s, b) => s + (b.byKind[kind] || 0), 0);
    const weeksPresent = buckets.filter((b) => (b.byKind[kind] || 0) > 0).length;
    const perWeek = total / buckets.length;
    if (perWeek >= minPerWeek && weeksPresent >= minWeeksPresent) {
      out.push({ kind, total, perWeek: Math.round(perWeek * 10) / 10, weeksPresent });
    }
  }
  return out.sort((a, b) => b.total - a.total);
}

/**
 * Assemble l'indice complet. `acts` : [{ kind, at }] en secondes epoch.
 * Volontairement PAS de score sur 100 : aucun dénominateur honnête n'existe
 * (on ne sait pas ce que Vincent aurait « pu » déléguer). On expose le volume réel,
 * sa tendance, et les candidats — trois faits mesurés, zéro chiffre inventé.
 */
export function computeDelegationIndex(acts, { now, weeks = 8, minPerWeek = 3, minWeeksPresent = 3 } = {}) {
  const buckets = bucketByWeek(acts, { now, weeks });
  const trend = computeTrend(buckets, { half: Math.floor(weeks / 2) });
  const candidates = findAutomationCandidates(buckets, { minPerWeek, minWeeksPresent });
  const totalByKind = {};
  for (const b of buckets) {
    for (const [k, n] of Object.entries(b.byKind)) totalByKind[k] = (totalByKind[k] || 0) + n;
  }
  return {
    weeks,
    thisWeek: buckets[0]?.total ?? 0,
    total: buckets.reduce((s, b) => s + b.total, 0),
    byKind: totalByKind,
    buckets,
    trend,
    candidates,
  };
}
