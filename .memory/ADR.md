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

## ADR-S-002 · 2026-06-04 · Gouvernance doc : index + ADR formalisés + PROJECT_MEMORY dégraissé
1. **Choix** : corriger CLAUDE.md (suppression du faux « There are no tests »), créer `docs/INDEX.md` (carte de ~47 docs) et `docs/superpowers/specs/README.md` (index ADR 001→010 avec statut), extraire le journal historique de PROJECT_MEMORY (52KB→35KB) vers `docs/_archive/`.
2. **Alternatives refusées** : laisser PROJECT_MEMORY grossir indéfiniment ; garder les ADR implicites (specs non indexés, statut illisible).
3. **Conséquences attendues** : un dev (ou agent) sans contexte retrouve n'importe quel doc en 5 s ; PROJECT_MEMORY reste lean en préservant secrets/footguns/contraintes ; les décisions d'archi ont un statut traçable.
4. **Périmètre** : `CLAUDE.md`, `docs/INDEX.md`, `docs/superpowers/specs/README.md`, `PROJECT_MEMORY.md`, `docs/_archive/PROJECT_MEMORY-journal-2026-05.md`. Commit `347f4b3`.
5. **Statut** : **acté + poussé** sur origin/main (docs-only, aucun déploiement).
