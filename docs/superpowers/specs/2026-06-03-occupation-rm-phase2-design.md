# Design — Occupation réelle → moteur de reco RM (phase 2 : agir)

**Date :** 2026-06-03 · Suite de phase 1 (occupation persistée dans `rm_kpi_snapshots`).

## 0. Problème
Le moteur `calcDateReco` (rm-recommendations) calcule `vacancy_risk`/`premium_opportunity`/`adj_market` **uniquement depuis les concurrents** (`rm_market_signals`). Notre occupation réelle (désormais en `rm_kpi_snapshots`) n'est pas exploitée → le RM ne sait pas qu'un bien est plein (tenir/monter) ou vide (last-minute).

## 1. Solution (advisory — le RM recommande, Vincent publie)
1. **Logique pure testée** : `src/utils/rmOccupancyAdjust.js` :
   - `pickRate(rate30, rate90, leadTimeDays)` → la bonne fenêtre (≤30j→rate30 ; 30-90j→rate90 ; >90j→null).
   - `occupancyAdjustment({ rate30, rate90, leadTimeDays, basePriceCents })` → `{ adjCents, vacancyDelta, premiumDelta, label, suggestMinStay, pct, rate }`.
   **Barème (validé)** : ≥85% → +10% (premium+30, vacancy−20) ; 70-85% → +5% (premium+15, vacancy−10) ; 15-30% → −7% (vacancy+15) ; ≤15% → −12% (vacancy+30, suggère min-stay réduit) ; sinon 0.
2. **`calcDateReco`** : nouveau param `ownOccupancy {rate30, rate90}`. Après le signal marché, applique `occupancyAdjustment` → `adjOccupancy` ajouté à `finalPrice` (toujours clampé `[price_min, price_max]`), `vacancyRisk`/`premiumOpportunity` ajustés des deltas, un `factor` `own_occupancy` + alert_flag + note dans `summary_fr` (« occupation 30j 0% → −12% »).
3. **Endpoint recompute** : charge l'occupation du bien (dernier snapshot 30d/90d de `rm_kpi_snapshots`) une fois avant la boucle, passe `ownOccupancy` à chaque `calcDateReco`.

## 2. Garde-fous
- **Advisory** : la reco reste `status:"pending"` ; Claude/RM ne publie pas les prix.
- Prix **clampé** `[price_min, price_max]` (inchangé).
- Ne s'applique **que si** on a la donnée (rate non null) et lead-time ≤ 90j.
- Logique pure **testée** (gate + CI). `calcDateReco` est exporté → testable aussi.
- Conservateur : magnitudes bornées (±12% max), traçable (factors + summary).

## 3. Périmètre
INCLUS : `rmOccupancyAdjust.js` + tests ; injection dans `calcDateReco` ; chargement occupation dans le recompute. EXCLU : auto-publication (jamais), modélisation fine multi-fenêtres, gap-fill.

## 4. Critère d'acceptation
`rmOccupancyAdjust.js` testé (fenêtres + barème + bornes) ; après recompute d'un bien, les recos des dates ≤90j portent un facteur `own_occupancy` cohérent (ex. Mabouya 0% → −12% + vacancy_risk élevé ; Schœlcher 100% → +10% + premium) ; prix toujours dans `[min,max]` ; reste advisory. Gate vert.
