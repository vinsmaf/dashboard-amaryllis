# ITERATIONS_LOG — Journal des sessions (rolling)

> 1 entrée par session : date · ce qui a été fait · commits clés. Le plus récent en haut.
> **Archive des sessions antérieures : `../PROJECT_MEMORY.md` + `../docs/_archive/`.**

---

## 2026-06-04 — Audit + cleanup gouvernance/architecture
**Commit `347f4b3` poussé sur origin/main (docs-only, aucun déploiement).**

- **Audit gouvernance** : constitution (CLAUDE.md), agents/skills, fichiers mémoire (ADR, learnings, blockers, iterations log, contexte + indexation). Verdict : gouvernance mature mais CLAUDE.md périmé, PROJECT_MEMORY trop gros, pas d'index in-repo, ADR non formalisés.
- **CLAUDE.md actualisé** : corrigé le faux « There are no tests » → suite vitest ~148 tests + gate deploy + CI ; nouvelle section « Source unique des biens & filet qualité » (biens.js, pattern miroir GAS/Worker, coherence-check, occupation→RM, Meta Pixel/CSP) ; footgun #1 corrigé (plus de prix codés en dur dans [slug].js/prerender).
- **`docs/INDEX.md`** créé (carte d'indexation ~47 docs + fichiers racine).
- **`docs/superpowers/specs/README.md`** créé (index ADR : 10 décisions ADR-001→010, statut + plan lié).
- **`PROJECT_MEMORY.md` dégraissé** 52KB→35KB ; journal historique extrait → `docs/_archive/PROJECT_MEMORY-journal-2026-05.md`.
- **Rituel de clôture** : skill `/cloture-session` (déjà existante) exécutée → création du système **`.memory/`** (INDEX/CONTEXT/ADR/LEARNINGS/BLOCKERS/ITERATIONS_LOG), calqué sur patrimoine-dashboard.

**Décisions** → ADR-S-001 (rituel = skill + `.memory/`), ADR-S-002 (gouvernance doc). **Frictions notées** : drift pattern miroir, doublons docs GBP/Ads à archiver, lint hors CI.

**À suivre** : lancement Google Ads + Meta Ads pas-à-pas (demain matin, Vincent aux commandes).
