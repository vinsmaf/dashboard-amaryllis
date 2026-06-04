# ADR-011 : Éliminer le drift des miroirs de logique pure (GAS / Worker)

**Status:** Proposed
**Date:** 2026-06-04
**Deciders:** Vincent (sign-off) · Claude (conception, périmètre locatif ; pattern à partager à patrimoine-dashboard)

## Context

La logique métier pure vit dans `src/utils/*.js` (testée vitest) puis est **dupliquée à la main** dans deux runtimes qui ne peuvent pas (croit-on) importer ces modules :
- **Worker** `workers/ical-sync/index.js` : copies inline de `occupancy.js` (`addDays`/`diffDays`/`nightsBooked`) et `rmOccupancyAdjust.js`.
- **Apps Script** `appscript/*.js` : copies de `resaDedup.js` (`dedupKey_`, `normDate_`, `contentKeyRow_`) et de bouts de `pricing.js`.

**Forces en jeu :** modifier l'`util` sans répercuter le miroir = **bug silencieux non couvert par les tests** (les tests vitest ne valident que le module pur, pas sa copie). C'est la **faiblesse n°1 partagée** des deux projets (cf. `docs/OPERATING-MODEL.md` §8). Dev solo → la discipline manuelle finit toujours par lâcher.

**Découverte qui scinde le problème :**
- Le **Worker** se déploie via `wrangler deploy` (esbuild) — qui **bundle les imports** (déjà prouvé : les Pages Functions importent `src/data/biens.js`). Donc **le miroir Worker n'est pas une contrainte, c'est une duplication évitable.**
- Le **GAS** se déploie via `clasp push` qui envoie les fichiers tels quels à un runtime Google **sans système de modules ni bundler** → **seul vrai irréductible.** Mais les fonctions concernées sont **petites, pures (string/date), sans dépendances**.

**Contraintes :** garder `clasp push` (URL de déploiement stable) ; ne pas alourdir le déploiement ; rester rétro-compatible (mêmes résultats au bit près) ; dev solo (préférer le simple et robuste au sophistiqué).

## Decision

**Approche hybride, traiter chaque runtime selon sa vraie contrainte :**
1. **Worker → importer directement** `src/utils/{occupancy,rmOccupancyAdjust}.js` (supprimer les copies inline). esbuild bundle. **Élimine ~50 % de la surface de drift, sans nouvel outillage.**
2. **GAS → générer le miroir depuis le module pur** : un script `scripts/gen-gas-shared.mjs` transpile les modules partagés (strip `export`) vers `appscript/_shared.generated.gs` (en-tête « DO NOT EDIT — généré depuis src/utils/ »), lancé dans `deploy:script`. **`src/utils` devient la source unique ; le GAS en dérive.**
3. **Filet** : un **test de parité** (`src/__tests__/mirror-parity.test.js`) qui charge la fonction générée et la compare au module pur sur des fixtures partagées → casse le build si divergence.

## Options Considered

### Option A : Test de cohérence des miroirs (constat seul)
Un test vitest charge la copie (Worker inline / GAS) via extraction + `eval` en sandbox, et compare au module pur sur des fixtures.

| Dimension | Assessment |
|---|---|
| Complexité | Moyenne (extraire/évaluer du code d'un `.gs`/Worker = fragile) |
| Coût | Faible |
| Robustesse | **Détecte** le drift mais ne l'**empêche** pas (2 copies subsistent) |
| Familiarité équipe | Haute (vitest) |

**Pros :** pas de changement de runtime ; filet immédiat.
**Cons :** la duplication demeure ; l'extraction par parsing est fragile ; ne supprime pas la cause.

### Option B : Génération de code (codegen) — source unique → dérivés
Le module pur est la seule source ; un script génère la copie GAS (et au besoin Worker) au build.

| Dimension | Assessment |
|---|---|
| Complexité | Moyenne (un transform simple : strip `export`, concat) |
| Coût | Faible-moyen (1 script + intégration deploy) |
| Robustesse | **Élevée** : drift structurellement **impossible** côté GAS |
| Familiarité équipe | Moyenne (codegen à maintenir) |

**Pros :** tue la cause ; une seule vérité ; rejouable.
**Cons :** un fichier généré à ne jamais éditer (discipline + en-tête) ; les modules partagés doivent rester GAS-compatibles (déjà le cas : pur, pas d'`import`/Node).

### Option C : Import direct (suppression du miroir)
Le runtime importe le module pur ; le bundler s'en charge.

| Dimension | Assessment |
|---|---|
| Complexité | **Faible** |
| Coût | **Quasi nul** |
| Robustesse | **Maximale** (zéro copie) |
| Familiarité équipe | Haute |

**Pros :** la meilleure solution **quand c'est possible**.
**Cons :** **impossible pour GAS** (pas de bundler dans `clasp push`). Possible pour le Worker (esbuild).

## Trade-off Analysis

La contrainte n'est pas la même selon le runtime, donc **aucune option unique n'est optimale partout** :
- Pour le **Worker**, **C** domine (gratuit, zéro copie) — à condition de valider que `wrangler deploy` bundle bien l'import (très probable : même toolchain que les Functions).
- Pour le **GAS**, **C** est exclu → arbitrage **B vs A**. **B (codegen)** *supprime* la cause ; **A (test)** la *détecte* seulement. Comme les fonctions sont minuscules et déjà pures, le coût de **B** est faible et le gain (drift impossible) élevé → **B gagne**, avec **A en filet** (un test de parité reste utile même avec codegen, pour attraper une régression du générateur).

D'où l'**hybride C (Worker) + B (GAS) + A (filet)**.

## Consequences

**Plus facile :**
- Modifier une règle métier = éditer **un seul** fichier `src/utils/*` ; Worker et GAS suivent (import / regénération).
- L'audit d'invariants (`audit-invariants.mjs` INV2) peut passer de « les miroirs existent » à « zéro miroir manuel + parité verte ».
- Pattern réplicable tel quel dans **patrimoine-dashboard** (même split Worker-importable / GAS-codegen).

**Plus difficile :**
- Un fichier généré `appscript/_shared.generated.gs` à **ne jamais éditer** (mitigé : en-tête explicite + test de parité + le générer dans `deploy:script`).
- Les modules « partagés GAS » doivent rester strictement purs (pas d'`import`, pas d'API Node) — déjà le cas, à maintenir.

**À revisiter :**
- Si un util partagé devient trop complexe pour le transform naïf (ex. dépendances entre utils) → enrichir `gen-gas-shared.mjs` (résolution d'ordre) ou restreindre le périmètre codegen aux feuilles.

## Action Items
1. [ ] **Worker** : remplacer les copies inline par `import { … } from "../../src/utils/occupancy.js"` (+ rmOccupancyAdjust) ; `wrangler deploy` ; **vérifier en prod** que le cron occupation tourne identique.
2. [ ] **Codegen GAS** : écrire `scripts/gen-gas-shared.mjs` (lit les modules partagés, strip `export`, écrit `appscript/_shared.generated.gs` avec en-tête) ; brancher dans le script `deploy:script` (`clasp push` après génération).
3. [ ] **Adapter les call-sites GAS** pour appeler les fonctions générées (remplacer `dedupKey_`/`normDate_`/`contentKeyRow_` inline par les fonctions partagées).
4. [ ] **Filet** : `src/__tests__/mirror-parity.test.js` — fixtures partagées, compare module pur vs fonction générée ; ajouter au gate.
5. [ ] **Audit** : faire évoluer INV2 de `audit-invariants.mjs` (« miroirs présents » → « générés/importés + parité OK »).
6. [ ] **Partager** le pattern à patrimoine-dashboard (mettre à jour `docs/OPERATING-MODEL.md` §8 quand fait).
7. [ ] Mettre à jour CLAUDE.md (le footgun « miroirs manuels » devient « Worker importe / GAS généré »).
