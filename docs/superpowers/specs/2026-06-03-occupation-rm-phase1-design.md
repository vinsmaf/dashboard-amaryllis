# Design — Occupation réelle → Revenue Manager (phase 1 : voir)

**Date :** 2026-06-03 · Pivot robustesse→valeur (post programme Robustesse).

## 0. Problème
Le Revenue Manager recommande des prix **sans connaître l'occupation réelle de nos biens** : `rm_kpi_snapshots` (table prévue) est **jamais peuplée** ; les champs `vacancy_risk`/`scarcity` du moteur viennent des **concurrents**, pas de nous. Pourtant le Worker calcule DÉJÀ l'occupation (iCal `allEvents` → `byProp` dans `runOccupancyAlerts`). Donnée présente, non persistée ni exploitée.

## 1. Solution (phase 1 = visibilité + fondation)
1. **Calcul pur testé** : `src/utils/occupancy.js` — à partir d'événements `{ bienId, checkin, checkout }` (dates "YYYY-MM-DD") :
   - `nightsBookedInWindow(events, bienId, fromStr, toStr)` → nuits réservées (clampées à la fenêtre).
   - `occupancyForWindow(events, bienId, todayStr, horizonDays)` → `{ nightsSold, nightsAvailable, rate }` (rate ∈ [0,1]).
   Pur, mirroir de la logique Worker. Tests vitest (couverts par le gate + CI).
2. **Worker** : nouveau `runOccupancySnapshot(env, allEvents)` dans le cron quotidien (`0 9 * * *`) → pour chaque bien actif, calcule l'occupation **30j et 90j** (`period_type` contraint à '30d'/'90d'/'mtd'/'ytd') et **upsert** dans `rm_kpi_snapshots` (binding D1 `revenue_manager`, actif) : `property_id`=bienId, `snapshot_date`=today, `period_type`, `occupancy_rate`, `nights_sold`, `nights_available`. Réutilise/importe `occupancy.js`.
3. **`rm-dashboard.js`** : ajoute au payload le **dernier snapshot d'occupation** du bien (30j/90j) → le dashboard admin RM peut afficher l'occupation réelle. Affichage minimal dans l'onglet RM (badge « Occupation 30j : X% / 90j : Y% »).

## 2. Périmètre
INCLUS (phase 1) : `occupancy.js` + tests ; `runOccupancySnapshot` (Worker écrit rm_kpi_snapshots) ; `rm-dashboard` expose + affichage minimal. EXCLU (phase 2) : **brancher l'occupation dans le MOTEUR de reco** (modulation prix advisory) — c'est le levier RevPAR, fait ensuite. Aussi exclu : revenus/ADR/RevPAR réels dans le snapshot (phase ultérieure ; ici occupation seule).

## 3. Garde-fous
- RM reste **advisory** (Claude ne change jamais les prix ; phase 1 ne fait qu'AFFICHER l'occupation).
- `property_id` = bienId canonique (cohérent avec le reste).
- Calcul pur testé ; le Worker importe le module pur (sinon mirroir inline, validé au `wrangler deploy --dry-run`).
- Déploiements : Worker via `npm run deploy:worker` ; Pages via `npm run deploy:pages` (gate tests). Idempotent : upsert par `(property_id, snapshot_date, period_type)`.

## 4. Critère d'acceptation
`occupancy.js` testé (fenêtres, clamp, chevauchement) ; après un run Worker, `rm_kpi_snapshots` contient pour chaque bien actif une ligne 30d + 90d du jour (occupancy_rate plausible) ; `rm-dashboard?property_id=X` renvoie l'occupation réelle ; l'onglet RM l'affiche. Le RM « voit » enfin l'occupation. (Phase 2 = l'exploiter dans la reco.)
