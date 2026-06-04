# DECISIONS — Moteur de décision (définir quoi / comment)

> Niveau 3 de la mémoire. Pour chaque **type de décision récurrent** : le **critère
> DÉTERMINISTE** pour trancher. Décisions PRISES → `ADR.md` ; EN ATTENTE → `BLOCKERS.md` ;
> ICI = le **cadre** pour décider. (Ajouté 2026-06-04 — pollinisation croisée depuis patrimoine.)

---

## D1 · Déployer en prod ?
**Critère** : `scripts/deploy-pages.sh` → **tests verts** (bloquant) ET `audit-invariants.mjs` ≠ 🔴.
**Sinon** : tests rouges → ne pas déployer (bypass urgence `SKIP_TESTS=1` à n'utiliser qu'en connaissance de cause). Audit 🔴 → escalader BLOCKERS (déploiement non bloqué mais à corriger vite).

## D2 · Changer un fait de bien (prix, capacité, nom, photo, SEO) ?
**Critère** : éditer **`src/data/biens.js` UNIQUEMENT** (source unique). Jamais en dur dans la prose marketing / les fiches.
**Vérif** : `src/__tests__/biens-consistency.test.js` + INV1 de l'audit.

## D3 · Modifier un util de logique métier ?
**Critère** : l'util est-il **miroité** (pricing/occupancy/resaDedup/coherenceRules/rmOccupancyAdjust) ?
- Oui → **répercuter le miroir** dans `appscript/*.gs` ET `workers/ical-sync/index.js` dans le MÊME commit. Sinon drift silencieux.
- Checklist : « j'ai touché un util miroité → ai-je mis à jour les 2 miroirs ? »

## D4 · Lire / affirmer l'état de la prod ?
**Critère** : CF Pages = upload wrangler direct → **vérifier la prod réelle** (URL / wrangler), **jamais** déduire de `origin/main`.

## D5 · Conseiller vs router vers un pro ?
**Critère** : sujet **réglementé** (déclarations meublé tourisme, fiscalité, juridique DOM, RGPD) → router vers **juriste/comptable** (ou Vincent). Contenu marketing/ops/pricing → OK avec garde-fous.

## D6 · Quoi mémoriser, et où ?
**Critère** : décision engageante → `ADR.md` · piège réutilisable → `LEARNINGS.md` (+ ligne `RECALL.md`) · point en attente → `BLOCKERS.md` · état frais → `CONTEXT.md` · récit → `ITERATIONS_LOG.md` · livrable → `docs/`.
**Archiver** le journal daté dans `docs/_archive/` au-delà de ~10 entrées.

## D7 · Réintégrer le lint au gate CI ?
**Critère** : `npm run lint` confirme **0 erreur** sur la durée (la mention « 557 » est périmée) → **oui, réintégrer** au gate (et corriger la doc). Sinon : chantier de nettoyage d'abord.

---

## Règle de tenue
Nouveau type de décision récurrent → ajouter une entrée `Dn`. Décision ponctuelle importante prise via ces critères → la consigner dans `ADR.md`.
