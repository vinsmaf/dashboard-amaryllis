# Design — Imports réservations idempotents + audit locale FR (chantier 2)

**Date :** 2026-06-03 · Programme Robustesse, chantier 2 (entrée 3).

## 0. Problème
Le dédoublonnage des réservations est **uniquement par `id`** à deux endroits Apps Script :
- `importAllReservations_` (`appscript/SCRIPT_SHEETS.js` ~l.508) — `existingIds[id]`.
- Memo d'idempotence revenus (`appscript/REVENUS_AUTO_2026.gs` ~l.161) — `processed[id]`.

La même nuitée arrivée avec des **ids différents** (manuel `uuid`, iCal `uid`, `beds24-<id>`, ou ré-import) crée des **lignes/comptages doublons** → revenus surévalués (classe « ami coco comptée 3×»).

Le bug **locale FR** (#ERROR! virgule/point) est **déjà corrigé** (`appendCell_` REVENUS_AUTO l.87 `.replace(".", ",")`). Reste un **audit** + un helper `frNum_()` si cas résiduel.

## 1. Solution
**Clé de dédoublonnage stable par contenu** = `bienId|checkin|checkout` (normalisés). Une nuitée ne peut pas être légitimement double-bookée → collision de clé = même séjour (sinon = `double_booking`, détecté par le contrôle de cohérence). On déduplique par **id OU clé-contenu**.

1. **Logique pure testée** : `src/utils/resaDedup.js` — `dedupKey({ bienId, checkin, checkout })` (normalise : bienId lowercased trimmé, dates → `YYYY-MM-DD`) + `dedupeReservations(list)` (garde 1 par clé). Tests vitest (couverts par le gate). **Mirroir inline dans le GAS** (GAS ne peut pas importer Node — la fonction pure est la *spec testée*).
2. **`importAllReservations_`** : indexer l'existant par id ET par clé-contenu ; une résa entrante trouvée par l'un ou l'autre → **mise à jour** de la ligne existante au lieu d'un `appendRow`. Map label→id (inverse de `BIEN_LABELS`) pour caler la clé sur les lignes existantes (col Propriété = label).
3. **REVENUS_AUTO `scanSheet_`/baseline** : `processed` keyé sur la **clé-contenu** (`bienId|arrivee|depart`) au lieu de l'`id` → même séjour compté **une seule fois** quel que soit l'id/onglet. Le memo `id_traite` stocke désormais des clés-contenu (rétro-compat : on additionne, un ancien id dans le memo reste inerte).
4. **Audit locale** : `grep` des écritures décimales→cellule-formule ; ajouter `frNum_(n)` (renvoie `String` à virgule) si un cas non couvert est trouvé ; sinon RAS (déjà patché).

## 2. Contrainte & déploiement (honnête)
- Le **GAS ne se teste pas en vitest** (globals `SpreadsheetApp`) ni en local → on **teste la logique pure**, le GAS la mirroir à l'identique. Changement **conservateur** : la dédup-contenu ne peut que *réduire* des doublons, jamais sur-compter.
- Déploiement : **`clasp push -f`** (les 2 `.gs` sont dans le même projet `1PJVUdEra`). ⚠️ Le trigger 15 min REVENUS_AUTO prend le HEAD **immédiatement** ; l'import web-app nécessite **`clasp deploy -i AKfycbw-t5kd_0f3OsEoDkOJHzYPHIBhWzz34aj7yagP57-Cj-7pLj6TiuRaUuusrCwAiA30Gg`**.
- **Vérification = action partagée** : après déploiement, **un sync manuel + check du Sheet** (« Toutes les Réservations » sans nouveau doublon ; onglet revenus cohérent). Je ne peux pas le faire de façon fiable → Vincent confirme. **Rollback** : `git checkout <SHA> -- appscript/ && clasp push -f && clasp deploy -i <id>`.

## 3. Périmètre
INCLUS : `resaDedup.js` + tests ; dédup-contenu dans `importAllReservations_` + memo REVENUS_AUTO ; audit locale (+ helper si besoin) ; clasp push + deploy ; checklist de vérif. EXCLU : refonte du mapping label↔id (on réutilise l'existant), réconciliation cross-source Beds24/iCal (déjà couverte côté cohérence).

## 4. Critère d'acceptation
`resaDedup.js` testé (clé stable, normalisation dates/bien, dédup) ; `importAllReservations_` ne crée plus de doublon pour une même nuitée à id différent (met à jour la ligne existante) ; REVENUS_AUTO ne compte un séjour qu'une fois (clé-contenu) ; audit locale fait ; déployé via clasp ; Vincent confirme via un sync que les résas s'importent toujours et sans doublon. Rollback documenté.
