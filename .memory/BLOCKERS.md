# BLOCKERS — Frictions, dettes & points bloquants (locatif-dashboard)

> Ce qui reviendra nous embêter si on ne le documente pas. Format : statut · sujet · ce qui débloque.
> 🔴 bloquant fort · 🟡 contourné / dette latente · ✅ levé (gardé un temps pour traçabilité).

## 🟡 Dettes techniques latentes (cassera si on oublie le contexte)
- **Drift du pattern miroir GAS/Worker.** `src/utils/{pricing,coherenceRules,resaDedup,occupancy,rmOccupancyAdjust}.js` sont **dupliqués à la main** dans `appscript/*.gs` et `workers/ical-sync/index.js` (impossible d'importer un module Node là-bas). Modifier l'util sans répercuter le miroir = bug silencieux non couvert par les tests. **Débloque** : checklist « j'ai touché un util → ai-je mis à jour le(s) miroir(s) ? » ; à terme, un test qui compare les deux implémentations.
- **Doublons de docs à arbitrer (créés avant la décision contraire de Vincent).**
  - `docs/google-ads-kit.md` est **remplacé** par `docs/marketing/campagne-google-ads-2026-06.md` (le 2e le dit en en-tête).
  - `docs/google-business-profiles-kit.md` propose de créer 2 fiches GBP Bellevue/Nogent → **contredit** la décision du 02/06 de NE PAS créer de nouvelles fiches. **Débloque** : décision Vincent → archiver les 2 dans `docs/_archive/`.
- **Lint exclu de la CI** (~557 erreurs eslint sur code historique). La CI ne protège pas contre les régressions de style/no-undef. **Débloque** : chantier de nettoyage eslint dédié, puis réintégrer le lint au gate.

## 🔴 Actions humaines (hors dashboard) en attente
- **Déclarations meublé de tourisme** (🔴 urgent, jusqu'à 12 500€ d'enjeu) — Vincent, voir `docs/legal/plan-action-declarations.md`.
- **Confirmer le report « HTTP 401 sur /admin »** (~18:00 le 03/06) — probablement auth transitoire ; Vincent confirme si reproductible.
- **Crédit Beds24** à vérifier ; **prospection netlinking** à envoyer ; **2 dims GA4 custom** à créer (bien_id, niveau_tarifaire).

## 🟡 Vérifs en attente côté Vincent (livré, non re-validé par lui)
- Sync 📊 → onglet « Toutes les Réservations » sans nouveau doublon + revenus cohérents (imports idempotents).
- Meta Pixel : confirmer le flux d'events via Meta Pixel Helper / Events Manager (les beacons /tr ne se voient pas en headless).

## ✅ Levé cette session
- **CLAUDE.md mentait « There are no tests »** → corrigé (suite vitest ~148 tests documentée).
- **PROJECT_MEMORY.md gonflait (52KB)** → dégraissé à 35KB, journal archivé.
- **Pas d'index in-repo des docs / ADR non formalisés** → `docs/INDEX.md` + `docs/superpowers/specs/README.md` créés.

## 📌 Prochaine session (demain matin)
- **Lancement Google Ads + Meta Ads pas-à-pas** : runbook `docs/marketing/RUNBOOK-lancement.md` ouvert, Vincent connecté à Google Ads (226-428-3778) + Meta Business Manager. **Vincent fait les clics, Claude guide.** Bloquant Google : importer la conversion `purchase` (PAS `booking_completed`) avant toute dépense.
