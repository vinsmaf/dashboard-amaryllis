# LEARNINGS — Enseignements réutilisables (locatif-dashboard)

> Pièges déjà rencontrés + comment les éviter. 1 entrée = 1 leçon actionnable « la prochaine fois ».
> Le journal d'erreurs exhaustif reste `../docs/ERREURS-LOG.md`.

## Inventaire des capacités (skills/agents)
- **Un `grep` par mots-clés sur `~/.claude/skills/` ne suffit PAS à inventorier les skills disponibles.** La skill `/cloture-session` existait déjà mais vivait hors de ce dossier → mon grep a conclu à tort « ça n'existe pas ». **La prochaine fois : consulter la LISTE des skills disponibles (system-reminder / Skill tool) avant de déclarer qu'une capacité manque, et avant d'en construire une nouvelle.**

## Édition de fichiers
- **Un linter modifie les fichiers entre `Read` et `Edit`** (vu sur `PROJECT_MEMORY.md` : Edit a échoué « file modified since read »). **La prochaine fois : re-`Read` juste avant l'`Edit` sur les gros fichiers .md, ou faire l'edit immédiatement après le read.**
- **Le quoting shell casse sur les apostrophes françaises** dans un `node -e '...'` (l'apostrophe de « L'état » ferme le quote). **La prochaine fois : écrire le script Node dans un fichier `/tmp/*.js` puis `node fichier.js`, plutôt que `-e` inline.**

## Architecture du projet (rappels qui font gagner du temps)
- **`src/data/biens.js` = source unique des FAITS des 7 biens.** Changer un prix/capacité/note/coord = éditer CE fichier uniquement (consommé par functions/[slug].js, prerender.mjs, _biens.js, PublicSite.jsx). Ne plus jamais coder un fait de bien en dur ailleurs.
- **Pattern « logique pure testée + miroir GAS/Worker »** : la logique métier vit dans `src/utils/*.js` (testée vitest) PUIS est dupliquée inline dans Apps Script (clasp) et le Worker (esbuild) qui ne peuvent pas importer de modules Node. Modules concernés : pricing, coherenceRules, resaDedup, occupancy, rmOccupancyAdjust. **La prochaine fois que tu modifies un de ces utils : répercuter le miroir, sinon drift silencieux (cf. BLOCKERS).**
- **CF Pages = upload direct via wrangler, PAS git-connecté.** Pousser sur GitHub ne déclenche aucun déploiement (juste la CI). **Ne jamais déduire l'état de la prod depuis l'état de origin/main** (historiquement 70 commits de retard alors que la prod était à jour).

## Gouvernance mémoire
- **3 niveaux de mémoire à ne pas confondre** : `.memory/` (vive, curatée, début de session) · `PROJECT_MEMORY.md` (long terme détaillé) · `docs/` (livrables + index). Garder chacun dans son rôle ; archiver le journal daté dans `docs/_archive/` quand il dépasse ~10 entrées.
