// src/utils/agentsImpact.js — boucle de feedback agents IA (logique pure, testable).
// Mesure l'impact des publications sociales sur le trafic : pour chaque publication,
// compare les sessions GA4 des `windowDays` jours SUIVANT la publication (J+1..J+N)
// à la baseline des `windowDays` jours PRÉCÉDENTS (J-N..J-1). Le jour J lui-même
// est neutre (exclu des deux fenêtres : trafic partiel des deux côtés).
//
// Consommé par functions/api/agents-impact.js (endpoint GET /api/agents-impact).
// Pattern repo : logique pure ici + tests vitest dans agentsImpact.test.js.

// "20260701" (format dimension `date` GA4) → "2026-07-01". Laisse passer les
// dates déjà normalisées.
export function normalizeGa4Date(raw) {
  const s = String(raw || "");
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return s;
}

// Timestamp unix (secondes) → "YYYY-MM-DD" (UTC).
export function toYMD(unixSec) {
  return new Date(unixSec * 1000).toISOString().slice(0, 10);
}

// "YYYY-MM-DD" + n jours → "YYYY-MM-DD" (UTC, pas de DST).
export function addDays(ymd, n) {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function sumWindow(sessionsByDate, days) {
  // Jour absent de GA4 (pas de trafic / données pas encore consolidées) → 0.
  return days.reduce((s, d) => s + (Number(sessionsByDate[d]) || 0), 0);
}

// Δ% : baseline 0 + hausse → null (non calculable, pas Infinity) ; 0/0 → 0.
function pctDelta(before, after) {
  if (before > 0) return Math.round(((after - before) / before) * 1000) / 10;
  return after > 0 ? null : 0;
}

/**
 * Calcule l'impact de chaque publication + un résumé agrégé.
 *
 * @param {Array<object>} publications — [{ id, publishedAt (unix sec), ...passthrough }]
 * @param {object} sessionsByDate — { "YYYY-MM-DD": sessions }
 * @param {object} [opts]
 * @param {number} [opts.windowDays=2] — taille des fenêtres avant/après
 * @param {string} [opts.today] — "YYYY-MM-DD" (UTC) ; défaut = aujourd'hui.
 *   Une publication est `incomplete` tant que J+windowDays n'est pas un jour
 *   entièrement révolu (données GA4 partielles) → exclue des agrégats du summary.
 * @returns {{ publications: Array<object>, summary: object }}
 */
export function computeImpacts(publications, sessionsByDate, opts = {}) {
  const windowDays = opts.windowDays || 2;
  const today = opts.today || toYMD(Math.floor(Date.now() / 1000));
  const sessions = sessionsByDate || {};

  const out = (publications || [])
    .filter(p => p && Number(p.publishedAt) > 0)
    .map(p => {
      const day = toYMD(Number(p.publishedAt));
      const beforeDays = [];
      const afterDays = [];
      for (let i = windowDays; i >= 1; i--) beforeDays.push(addDays(day, -i));
      for (let i = 1; i <= windowDays; i++) afterDays.push(addDays(day, i));

      const sessionsAvant = sumWindow(sessions, beforeDays);
      const sessionsApres = sumWindow(sessions, afterDays);
      const delta = sessionsApres - sessionsAvant;
      // Complète ssi le dernier jour de la fenêtre "après" est STRICTEMENT passé.
      const incomplete = afterDays[afterDays.length - 1] >= today;

      return {
        ...p,
        date: day,
        sessionsAvant,
        sessionsApres,
        delta,
        deltaPct: incomplete ? null : pctDelta(sessionsAvant, sessionsApres),
        incomplete,
      };
    });

  const complete = out.filter(p => !p.incomplete);
  const pcts = complete.map(p => p.deltaPct).filter(v => v !== null);

  let best = null, worst = null;
  for (const p of complete) {
    if (!best || p.delta > best.delta) best = p;
    if (!worst || p.delta < worst.delta) worst = p;
  }
  const brief = p => p ? { id: p.id, date: p.date, delta: p.delta, deltaPct: p.deltaPct } : null;

  return {
    publications: out,
    summary: {
      count: out.length,
      completeCount: complete.length,
      incompleteCount: out.length - complete.length,
      avgDelta: complete.length
        ? Math.round((complete.reduce((s, p) => s + p.delta, 0) / complete.length) * 10) / 10
        : null,
      avgDeltaPct: pcts.length
        ? Math.round((pcts.reduce((s, v) => s + v, 0) / pcts.length) * 10) / 10
        : null,
      best: brief(best),
      worst: brief(worst),
    },
  };
}
