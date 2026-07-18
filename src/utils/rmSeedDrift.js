// Garde-fou permanent — détecte la dérive entre rm_seasonal_profiles.base_price_override
// (modèle saisonnier propre au Revenue Manager) et le prix RÉELLEMENT calibré par Vincent
// dans SEED_DAILY_PRICES (src/seedPrices.js). Ces deux couches sont indépendantes : rien ne
// garantit qu'elles restent synchronisées quand l'une est mise à jour sans l'autre.
//
// Trouvé et corrigé une première fois le 2026-07-18 (drift jusqu'à +50% Jan-Avr, -45% Sep-Déc
// selon le bien) — ce module empêche que la dérive redevienne invisible avec le temps.

function datesBetween(startIso, endIso) {
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  const out = [];
  for (let t = start; t <= end; t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

const round0 = (n) => Math.round(Number(n) || 0);

/** Moyenne des prix seed calibrés pour un bien sur une fenêtre de dates [start, end] inclus. */
export function computeSeedAverage(propertyId, dateStart, dateEnd, seedByBien) {
  const seed = seedByBien?.[propertyId];
  if (!seed) return { avg: null, coverageDays: 0, totalDays: 0 };
  const dates = datesBetween(dateStart, dateEnd);
  const found = dates.map((d) => seed[d]).filter((v) => v != null).map(Number);
  if (found.length === 0) return { avg: null, coverageDays: 0, totalDays: dates.length };
  const avg = found.reduce((a, b) => a + b, 0) / found.length;
  return { avg: round0(avg), coverageDays: found.length, totalDays: dates.length };
}

/**
 * Compare chaque profil saisonnier RM au prix seed réellement calibré sur la même fenêtre.
 * `profiles` : lignes rm_seasonal_profiles { id, property_id, name, season_type, date_start,
 *   date_end, base_price_override (cents) }. `seedByBien` : SEED_DAILY_PRICES.
 * Un profil sans aucune date couverte par le seed est reporté séparément (`no_coverage`),
 * jamais compté comme un drift — on ne peut pas juger une comparaison qu'on ne peut pas faire.
 */
export function computeSeedDrift(profiles, seedByBien, { thresholdPct = 0.15 } = {}) {
  const drifted = [];
  const noCoverage = [];
  for (const p of profiles || []) {
    if (p?.base_price_override == null || !p?.date_start || !p?.date_end) continue;
    const { avg, coverageDays, totalDays } = computeSeedAverage(p.property_id, p.date_start, p.date_end, seedByBien);
    const overrideEur = round0(p.base_price_override / 100);
    if (avg == null) {
      noCoverage.push({ property_id: p.property_id, name: p.name, date_start: p.date_start, date_end: p.date_end, totalDays });
      continue;
    }
    const diffEur = overrideEur - avg;
    const diffPct = avg > 0 ? diffEur / avg : 0;
    const entry = {
      property_id: p.property_id,
      name: p.name,
      season_type: p.season_type,
      date_start: p.date_start,
      date_end: p.date_end,
      seed_avg: avg,
      rm_override: overrideEur,
      diff_eur: round0(diffEur),
      diff_pct: Math.round(diffPct * 100),
      coverage_days: coverageDays,
      total_days: totalDays,
    };
    if (Math.abs(diffPct) >= thresholdPct) drifted.push(entry);
  }
  drifted.sort((a, b) => Math.abs(b.diff_pct) - Math.abs(a.diff_pct));
  return { drifted, noCoverage };
}
