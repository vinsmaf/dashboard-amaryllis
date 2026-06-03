# Design — Contrôles de cohérence données auto (chantier 2 Robustesse)

**Date :** 2026-06-03 · Programme Robustesse, chantier 2 (entrée 2).

## 0. Problème
Aucun monitoring passif ne détecte les incohérences de données (doublons/chevauchements de résas, totaux aberrants, bien inconnu). Les bugs de ce type (ex. « ami coco comptée 3 fois ») ne se voient qu'à l'œil, après coup.

## 1. Solution
Un **moteur de règles pur** + un **endpoint cron** qui le passe sur les réservations et **alerte**.

- **`src/utils/coherenceRules.js`** (PUR, testable, source-agnostique) : `checkReservations(reservations, { validBiens })` → liste de findings `{ rule, severity, bien, message, key }`. Reservations normalisées : `{ id, bien, voyageur, total, depot, checkin, checkout }`.
  Règles phase 1 :
  1. `dates_invalides` (haute) — checkin/checkout manquants ou checkin ≥ checkout.
  2. `total_aberrant` (haute) — total ≤ 0, depot < 0, depot > total, ou total > borne saine (50 000 €).
  3. `bien_inconnu` (moyenne) — `bien` ne mappe à aucun id/nom canonique (`src/data/biens.js`).
  4. `double_booking` (**critique**) — deux résas du **même bien** avec dates qui se chevauchent.
- **`functions/api/coherence-check.js`** (cron, GET `?secret=POSTSTAY_SECRET`, `?dry=1` pour simuler) : lit `direct_bookings` (D1 `revenue_manager`) → normalise → `checkReservations` (validBiens depuis le canonique) → **écrit chaque finding dans l'inbox `client_errors`** (`kind:"coherence"`, dédup via `clientErrorFingerprint`, sévérité posée) → si ≥1 finding **critique**, **push ntfy** (résumé). Retourne un JSON `{ ok, checked, findings, critical }`.

**Source phase 1 = `direct_bookings`** (pipeline argent qu'on contrôle, zéro dépendance externe). Le moteur étant source-agnostique, la phase 2 (hors périmètre) pourra y injecter les résas Sheet/Beds24/iCal pour la réconciliation cross-source.

## 2. Alerte & visibilité
- Findings → table `client_errors` (`kind:"coherence"`, `severity` critique/haute/moyenne) → visibles dans l'onglet **🐞 Bugs** admin (`BugsTab.jsx`), dédupliqués (même bug = compteur).
- Critique (double-booking) → **ntfy** (`NTFY_TOPIC`, Priority high) en plus.

## 3. Périmètre
INCLUS : `coherenceRules.js` + tests + `coherence-check.js` (source `direct_bookings`) + écriture inbox + ntfy + `?dry=1`. EXCLU : réconciliation Sheet↔D1 revenus + résas iCal/Beds24 cross-source (phase 2, nécessite Worker/KV) ; branchement occupation→RM (feature, pas un check). **Activation du cron = action Vincent** (cron-job.org GET quotidien `?secret=`).

## 4. Garde-fous
- Règles **pures** → testées vitest (couvertes par le gate de déploiement).
- `?dry=1` ne touche RIEN (pas d'écriture/alerte) — pour tester en prod.
- Fail-soft : une erreur de lecture D1 ne casse pas (log + 200 avec `error`), comme les autres crons.
- Endpoint protégé par `?secret=POSTSTAY_SECRET` (pattern cron existant). Déploiement `npm run deploy:pages`.

## 5. Critère d'acceptation
`coherenceRules.js` testé (chaque règle, bornes de chevauchement) ; `GET /api/coherence-check?secret=...&dry=1` renvoie un JSON de findings sans rien écrire ; en mode normal, écrit les findings dans `client_errors` (kind coherence) et push ntfy si critique ; gate de déploiement vert. Un double-booking direct ou un total aberrant déclenche désormais une alerte automatique.
