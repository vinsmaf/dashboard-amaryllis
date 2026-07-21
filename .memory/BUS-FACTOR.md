# Bus factor — composants critiques non-réparables sans Claude

> Analyse du 2026-07-21 (pré-mortem AGENDA). Objectif : identifier ce qui bloquerait Vincent
> SEUL (sans IA) en cas de panne, et réduire ce risque — pas juste le documenter.
> Méthode : lecture intégrale des fichiers + grep exhaustif D1, comparé à `ARCHITECTURE.md`.

## Priorité (du plus au moins bloquant sans IA)

### 1. `functions/api/agents-run.js` (1 959 lignes, 28 agents) — le plus opaque
- **Zéro test** (`agents-run.test.js` n'existe pas), seul gros fichier du repo dans ce cas.
- Mélange prompt engineering (flou, non testé) + code déterministe fragile (dédup Jaccard maison
  lignes 569-611, seuils choisis à la main sans commentaire justificatif).
- **5 blocs "miroir" non trackés** (`PLAYBOOK_DIGEST`/`FISCAL_CONTEXT`/`VOYAGEUR_INSIGHTS_DIGEST`/
  `VINCENT_PROFILE_DIGEST`) portant des chiffres business (ex. CF H1 2026/bien) qui périment
  silencieusement — 5e classe de drift, distincte des miroirs GAS déjà documentés en §13.3.
- Règles par bien codées en dur en chaîne ternaire (ex. "piscine à débordement" → Amaryllis
  uniquement) — un 8e bien futur casse silencieusement (chaîne vide, pas d'erreur) si on oublie.
- **Fix concret (pas juste "documenter mieux")** : sortir les 4 blocs `*_DIGEST`/`*_CONTEXT` vers
  `functions/api/_digests/*.md` (fichiers texte importés au build) — les rend grep-ables/diffables
  indépendamment du JS, et permet un test de fraîcheur (pattern déjà utilisé par
  `biens-consistency.test.js`).

### 2. Apps Script `appscript/SCRIPT_SHEETS.js` (1 639 lignes) — environnement séparé
- Déployé via `clasp`, pas git/wrangler — pipeline CI ne le valide jamais, pas de tests possibles.
- Bug silencieux déjà vécu : `BIENS_MAP[i].cfRow` pointait sur la mauvaise ligne/colonne du Sheet,
  a biaisé le cashflow affiché en prod pendant une durée indéterminée avant détection.
- **🎯 Piège actif à corriger — quasi zéro risque** : `SCRIPT_SHEETS.gs` existe EN DOUBLE à la
  racine du repo, copie divergente obsolète déjà documentée dans CLAUDE.md ("ne pas s'y fier").
  Un humain qui cherche "SCRIPT_SHEETS" par le nom le plus court éditerait le fichier mort.
  **Fix = supprimer ce fichier racine.** Prêt à exécuter sur ton feu vert.

### 3. Schéma D1 (77 tables réelles, pas ~50 comme l'affichait ARCHITECTURE.md)
- Pas complexe unitairement (chaque `CREATE TABLE` est trivial) — le problème est l'**absence de
  vue d'ensemble fiable** : 3 mécanismes DDL jamais unifiés (migration SQL historique, migrations
  numérotées, dizaines de `CREATE TABLE IF NOT EXISTS` inline dans les endpoints).
- 9 tables présentes en code, 100% absentes d'ARCHITECTURE.md (`app_config`, `beds24_notified`,
  `beds24_poststay_log`, `email_field_overrides`, `newsletter_subscribers`, `own_ota_listings`,
  `parity_checks`, `reclamations`, `rm_zone_snapshots`, `sync_heartbeat`).
- Piège de migration déjà vécu : `agents-actions.js` recrée une table sans contrainte, copie,
  **DROP** l'originale, puis renomme — un pattern qui détruit une table de prod si une étape
  échoue à mi-parcours (pas de rollback).
- **Fix concret, 15 min** : script `npm run schema:dump` (`wrangler d1 execute ... SELECT sql FROM
  sqlite_master`) committé dans `docs/d1-schema-live.sql` — remplace l'inventaire à main levée par
  un artefact généré depuis la prod réelle, exécutable en CI pour détecter le drift.

### 4. Worker crons `workers/ical-sync/index.js` (4 480 lignes, 8 branches cron) — le moins opaque
- Le mieux documenté des 4 au niveau "quoi tourne quand" (ARCHITECTURE.md §12, tableau à jour).
- Séquencement inter-tâches fragile (ex. `rm-price-digest` doit lire APRÈS le recalcul de
  `rm-auto-update` dans le même cron) documenté uniquement en commentaire inline, pas dans
  ARCHITECTURE.md — risque de casse silencieuse si quelqu'un réordonne sans savoir pourquoi.
- Chaque sous-tâche isolée en `try/catch` par design (évite qu'une erreur en bloque d'autres) →
  erreurs avalées vers `console.error`, invisibles sauf `wrangler tail`.
- **Fix concret** : éclater en 8 fichiers (`crons/daily-9h.js` etc.), `index.js` réduit à un
  `switch(event.cron)` de dispatch — extraction mécanique du pattern `runXxx()` déjà existant.

## Écartés malgré leur taille (le tri compte, pas juste la taille)
- `src/PublicSite.jsx` (10 872 lignes) — majoritairement JSX/copie répétée par bien, pas de
  logique opaque, un humain s'y retrouve par recherche de texte.
- `scripts/deploy-pages.sh` (374 lignes) — complexe mais chaque garde-fou est commenté avec sa
  raison + son ADR, lisible linéairement. Contre-exemple de complexité opaque.

## Action immédiate proposée (zéro risque, en attente du feu vert Vincent)
Supprimer `SCRIPT_SHEETS.gs` (racine) — fichier mort déjà documenté comme dangereux, aucun usage,
`rm` simple. Les 3 autres fixes (digests externalisés, dump schéma D1, éclatement crons) sont des
chantiers, pas des quick wins — à cadrer un par un si Vincent veut les prendre.
