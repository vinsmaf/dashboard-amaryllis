# LEARNINGS — Enseignements réutilisables (locatif-dashboard)

> Pièges déjà rencontrés + comment les éviter. 1 entrée = 1 leçon actionnable « la prochaine fois ».
> Le journal d'erreurs exhaustif reste `../docs/ERREURS-LOG.md`.

## Inventaire des capacités (skills/agents)
- **⚠️ ERREUR RÉPÉTÉE 3× DANS LA MÊME SESSION (2026-06-04).** J'ai conclu « ça n'existe pas » pour `/cloture-session`, PUIS `/auditeur`, PUIS `/consolidation` — les trois existaient déjà — parce que je grepais `~/.claude/skills/` au lieu de **lire la LISTE des skills disponibles** (system-reminder / Skill tool). Le grep ne voit pas les skills hébergées ailleurs. **RÈGLE DURE : avant de dire qu'une capacité manque OU d'en construire une, TOUJOURS scanner la liste des skills disponibles.** (Cf. RECALL.md, ligne « Skills / capacités ».)
- **Une skill (LLM) ne peut pas être appelée depuis bash.** Pour automatiser au déploiement un audit/une consolidation, il faut une **version déterministe en script** (`scripts/audit-invariants.mjs`) ; la skill reste pour le riche manuel. Pattern : skill = jugement piloté ; script = invariants déterministes greffés au gate.
- **Un hook `SessionStart` dans un repo sans `.claude/settings.json` préexistant ne se charge qu'après `/hooks` ou un redémarrage** (le watcher ne surveillait pas `.claude/` au démarrage). Le hook est correct, mais inerte la 1ʳᵉ fois.

## Édition de fichiers
- **Un linter modifie les fichiers entre `Read` et `Edit`** (vu sur `PROJECT_MEMORY.md` : Edit a échoué « file modified since read »). **La prochaine fois : re-`Read` juste avant l'`Edit` sur les gros fichiers .md, ou faire l'edit immédiatement après le read.**
- **Le quoting shell casse sur les apostrophes françaises** dans un `node -e '...'` (l'apostrophe de « L'état » ferme le quote). **La prochaine fois : écrire le script Node dans un fichier `/tmp/*.js` puis `node fichier.js`, plutôt que `-e` inline.**

## CI / outillage
- **`wrangler ≥ 4.94` exige Node ≥ 22.** La CI GitHub était en Node 20 → l'étape `wrangler pages functions build` plantait (exit 1) **uniquement en CI** (local en Node 22 = OK). Fix : `node-version: "22"` dans `.github/workflows/ci.yml`. **Garder la version Node de la CI alignée sur l'env de dev.**
- **La CI ne tournait quasi jamais** (on pousse rarement sur GitHub car CF Pages = upload direct) → une casse latente n'est visible qu'au moment où on se met à pousser souvent. Pousser régulièrement = détecter tôt.
- **Lire un log CI sans `gh` ni token** : l'API GitHub publique donne le job/étape en échec (`/actions/runs/<id>/jobs`), mais le LOG détaillé nécessite auth → l'ouvrir dans le **navigateur** (Chrome MCP, déjà loggé sur GitHub) et `get_page_text` sur la page du run. Plus rapide que d'installer gh.

## Architecture du projet (rappels qui font gagner du temps)
- **`src/data/biens.js` = source unique des FAITS des 7 biens.** Changer un prix/capacité/note/coord = éditer CE fichier uniquement (consommé par functions/[slug].js, prerender.mjs, _biens.js, PublicSite.jsx). Ne plus jamais coder un fait de bien en dur ailleurs.
- **Pattern « logique pure testée + miroir GAS/Worker »** : la logique métier vit dans `src/utils/*.js` (testée vitest) PUIS est dupliquée inline dans Apps Script (clasp) et le Worker (esbuild) qui ne peuvent pas importer de modules Node. Modules concernés : pricing, coherenceRules, resaDedup, occupancy, rmOccupancyAdjust. **La prochaine fois que tu modifies un de ces utils : répercuter le miroir, sinon drift silencieux (cf. BLOCKERS).**
- **CF Pages = upload direct via wrangler, PAS git-connecté.** Pousser sur GitHub ne déclenche aucun déploiement (juste la CI). **Ne jamais déduire l'état de la prod depuis l'état de origin/main** (historiquement 70 commits de retard alors que la prod était à jour).

## Gouvernance mémoire
- **3 niveaux de mémoire à ne pas confondre** : `.memory/` (vive, curatée, début de session) · `PROJECT_MEMORY.md` (long terme détaillé) · `docs/` (livrables + index). Garder chacun dans son rôle ; archiver le journal daté dans `docs/_archive/` quand il dépasse ~10 entrées.
