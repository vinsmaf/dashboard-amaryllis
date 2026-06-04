# ADR — Décisions structurantes (locatif-dashboard)

> 1 entrée par décision qui engage la suite. Format 5 lignes : **Choix · Alternatives refusées · Conséquences attendues · Périmètre · Statut**.
> Décisions d'archi détaillées (specs complets) → `../docs/superpowers/specs/README.md` (ADR-001→010). Ici = log curaté de session.

---

## ADR-S-001 · 2026-06-04 · Rituel de clôture = skill `/cloture-session` + système `.memory/`
1. **Choix** : capturer la mémoire de fin de session via une **skill déclenchée manuellement** (`/cloture-session`), qui écrit dans un dossier `.memory/` indexé (CONTEXT/ADR/LEARNINGS/BLOCKERS/ITERATIONS_LOG), calqué sur patrimoine-dashboard.
2. **Alternatives refusées** : (a) un **agent autonome** qui devinerait « la session est finie » → mauvais timing, écarté ; (b) **regonfler PROJECT_MEMORY.md** qu'on venait de dégraisser → écarté ; (c) 1 seul fichier `docs/JOURNAL-SESSIONS.md` → remplacé par le standard `.memory/` déjà éprouvé sur l'autre projet (cohérence inter-projets).
3. **Conséquences attendues** : 3 rubriques (décision/apprentissages/frictions) produites à chaque clôture, au même endroit, en format court ; `.memory/INDEX.md` devient le point d'entrée de début de session.
4. **Périmètre** : `.memory/*` (nouveau), pointeurs depuis `PROJECT_MEMORY.md`.
5. **Statut** : **acté** (Vincent a choisi « 1 fichier unique » mais le standard `.memory/` retenu pour aligner les 2 projets — à confirmer s'il préfère vraiment le fichier plat).

## ADR-S-005 · 2026-06-04 · Consolidation mémoire périodique = cron + filet SessionStart (ceinture + bretelles)
1. **Choix** : entretien périodique de `.memory/` via la skill `/consolidation` (fusionne/archive/promeut/réorganise), déclenchée par DEUX mécanismes complémentaires : (a) **cron** routine `/schedule` hebdo (lundi ~6h Martinique, mode *propose sans committer*) ; (b) **filet SessionStart** : `session-context.mjs` nudge si dernière consolidation > 7 j (lit `.memory/.last-consolidation`, sinon retombe sur « Dernière MAJ » de CONTEXT).
2. **Alternatives refusées** : tout miser sur le cron (backend claude.ai des routines était KO le 2026-06-04 → fragile) ; tout miser sur le nudge (semi-auto, ne fire qu'au démarrage de session).
3. **Conséquences attendues** : la mémoire est jardinée même si l'un des deux canaux tombe. **⚠️ Convention : à CHAQUE exécution de `/consolidation`, écrire la date du jour (AAAA-MM-JJ) dans `.memory/.last-consolidation`** pour réarmer le compteur du nudge.
4. **Périmètre** : `scripts/session-context.mjs` (nudge), `.memory/.last-consolidation` (marqueur, amorcé 2026-06-04), routine `/schedule` (à créer — cf. BLOCKERS, bloquée backend).
5. **Statut** : filet **acté** (testé : 0 nudge à J0, nudge à J+30) ; cron **en attente** (relancer `/schedule`).

## ADR-S-004 · 2026-06-04 · Rappel mémoire automatique = hook SessionStart (niveau 2 étanche)
1. **Choix** : un hook **`SessionStart`** (`.claude/settings.json` projet) exécute `scripts/session-context.mjs`, qui injecte au démarrage de chaque session l'état frais (`.memory/CONTEXT.md`) + les rappels ouverts (`.memory/BLOCKERS.md`). Transforme le « rappel » de convention en **mécanisme**.
2. **Alternatives refusées** : compter sur Claude pour ouvrir `.memory/INDEX.md` (non fiable, déjà oublié 2× cette session) ; mettre le rappel dans CLAUDE.md (statique, ne reflète pas l'état frais).
3. **Conséquences attendues** : 3 niveaux de mémoire étanches (stockage ✅ / rappel ✅ désormais mécanisé / décision ✅). Le script sort en silence (exit 0) si `.memory/` absent → inoffensif sur les autres machines/projets.
4. **Périmètre** : `.claude/settings.json` (nouveau, hook seul), `scripts/session-context.mjs` (nouveau).
5. **Statut** : **acté** (JSON validé jq, commande exit 0). ⚠️ Prise en compte : nécessite un `/hooks` ou un redémarrage la 1ʳᵉ fois (le watcher ne surveillait pas `.claude/` sans settings au démarrage).

## ADR-S-003 · 2026-06-04 · Auditeur = skill manuelle + script déterministe non bloquant au deploy
1. **Choix** : 2 niveaux d'audit. (a) skill **`auditeur`** (LLM, manuelle, audit riche avec escalation `.memory/`) ; (b) **`scripts/audit-invariants.mjs`** déterministe greffé dans `deploy-pages.sh` (post-smoke), **non bloquant** (exit 0 toujours), écrit `docs/_audits/AUDIT-latest.md`.
2. **Alternatives refusées** : appeler la skill LLM depuis bash (impossible) ; rendre l'audit **bloquant** au deploy (risque de faux FAIL qui bloque une prod saine — refusé par Vincent, « non-bloquant »).
3. **Conséquences attendues** : chaque déploiement vérifie les invariants d'archi (source unique, miroirs, CSP, meta, mémoire) sans jamais bloquer ; rapport rolling gitignoré ; les rapports datés manuels restent suivis. Réintégration au gate bloquant possible plus tard si les verdicts s'avèrent fiables.
4. **Périmètre** : `scripts/audit-invariants.mjs` (nouveau), `scripts/deploy-pages.sh` (bloc non-bloquant + `SKIP_AUDIT`), `.gitignore`, CLAUDE.md.
5. **Statut** : **acté** (testé : verdict 🟢 PASS, exit 0).

## ADR-S-002 · 2026-06-04 · Gouvernance doc : index + ADR formalisés + PROJECT_MEMORY dégraissé
1. **Choix** : corriger CLAUDE.md (suppression du faux « There are no tests »), créer `docs/INDEX.md` (carte de ~47 docs) et `docs/superpowers/specs/README.md` (index ADR 001→010 avec statut), extraire le journal historique de PROJECT_MEMORY (52KB→35KB) vers `docs/_archive/`.
2. **Alternatives refusées** : laisser PROJECT_MEMORY grossir indéfiniment ; garder les ADR implicites (specs non indexés, statut illisible).
3. **Conséquences attendues** : un dev (ou agent) sans contexte retrouve n'importe quel doc en 5 s ; PROJECT_MEMORY reste lean en préservant secrets/footguns/contraintes ; les décisions d'archi ont un statut traçable.
4. **Périmètre** : `CLAUDE.md`, `docs/INDEX.md`, `docs/superpowers/specs/README.md`, `PROJECT_MEMORY.md`, `docs/_archive/PROJECT_MEMORY-journal-2026-05.md`. Commit `347f4b3`.
5. **Statut** : **acté + poussé** sur origin/main (docs-only, aucun déploiement).
