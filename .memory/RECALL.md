# RECALL — Rappel contextuel (quoi remonte, quand)

> Niveau 2 de la mémoire. Table **domaine → ce qu'il FAUT se rappeler AVANT d'agir**.
> Règle : avant de toucher un domaine, lire sa ligne + `grep` dans LEARNINGS.md / BLOCKERS.md.
> (Ajouté 2026-06-04 — pollinisation croisée depuis patrimoine-dashboard.)

| Quand tu touches… | RAPPELLE-TOI (sinon ça casse) | Réf |
|---|---|---|
| **Un fait de bien** (prix/capacité/nom/coord/SEO) | `src/data/biens.js` = **source unique** (4 consommateurs : `functions/[slug].js`, `prerender.mjs`, `_biens.js`, `PublicSite.jsx`). Ne jamais coder un fait en dur ailleurs. | LEARNINGS |
| **Nomenclature** | Seuls **Amaryllis & Iguana = « villas »** · **Iguana `bookable:false`** (bail long). | CLAUDE.md |
| **Logique métier** (pricing/occupancy/resaDedup/coherenceRules/rmOccupancyAdjust) | **Répercuter le MIROIR** GAS (`appscript/*.gs`) **ET** Worker (`workers/ical-sync`) — ils ne peuvent pas importer de module Node → **drift silencieux non testé** si oublié. | LEARNINGS · BLOCKERS |
| **État de la prod** | CF Pages = **upload direct wrangler, PAS git-connecté**. Ne JAMAIS déduire la prod de `origin/main` (a été à 70 commits de retard). | LEARNINGS |
| **SEO / CSP / tracking** | Tout domaine tracking chargé doit être dans `public/_headers` (CSP). Meta : `seoTitle` ≤60c, `seoDesc` ≤158c. | audit-invariants INV4/INV5 |
| **Agents IA / contenu** | Grounding RAG sur les **faits** (`_biens.js`) · `agent-lessons` = fact-check par regex · `agents-eval` = LLM-juge. Ne pas laisser un agent inventer un fait de bien. | CLAUDE.md |
| **Avant un deploy** | `scripts/deploy-pages.sh` = gate (**tests rouges bloquent**) + `audit-invariants.mjs` post-smoke (non bloquant). Skill `/auditeur` pour l'audit riche manuel. | DECISIONS |
| **Lint** | Doc dit « ~557 erreurs » mais c'est **périmé** (~0 erreur aujourd'hui) → envisager de réintégrer le lint au gate. | BLOCKERS |
| **Mémoire** | 3 niveaux : `.memory/` (vif) · `PROJECT_MEMORY.md` (long terme) · `docs/` (livrables). Archiver le journal daté dans `docs/_archive/` au-delà de ~10 entrées. | LEARNINGS |
| **Skills / capacités** | **Consulter la LISTE des skills** (Skill tool) avant de déclarer qu'une capacité manque — un `grep ~/.claude/skills` ne suffit pas. | LEARNINGS |

| **BLOCKERS.md — items à proposer** | ⚠️ **VÉRIFIER LE CODE AVANT DE PROPOSER.** Un item BLOCKERS peut être stale (fix appliqué mais entrée non fermée). Règle : avant de proposer un item, grep/read 30s pour confirmer qu'il est encore ouvert. Exemples stales vus : beds24Amount, iCal null guard, smoke test Playwright → déjà fixés sans fermeture. **Ne jamais proposer un item BLOCKERS sans preuve que le problème existe encore dans le code.** | LEARNINGS |

## ⚙️ Règle fermeture immédiate des blockers
**Quand tu fixes quelque chose** → fermer l'entrée BLOCKERS.md dans le MÊME acte que le fix, pas en clôture de session. Si le fix est dans le code (commit), l'entrée BLOCKERS est ✅ dans le même élan.

## Règle de tenue
Nouvelle LEARNING/BLOCKER rattachée à un domaine → **mettre à jour sa ligne ici** pour garder le rappel déclenchable par contexte.
