# RECALL — Rappel contextuel (quoi remonte, quand)

> Niveau 2 de la mémoire. Table **domaine → ce qu'il FAUT se rappeler AVANT d'agir**.
> Règle : avant de toucher un domaine, lire sa ligne + `grep` dans LEARNINGS.md / BLOCKERS.md.
> (Ajouté 2026-06-04 — pollinisation croisée depuis patrimoine-dashboard.)

| Quand tu touches… | RAPPELLE-TOI (sinon ça casse) | Réf |
|---|---|---|
| **La structure du système** (ajout/déplacement d'une route, page, API function, table, cron, intégration, flux) | Lire d'abord `.memory/ARCHITECTURE.md` (carte vivante : schémas Mermaid, inventaire D1, table des crons). **La mettre à jour à la clôture** (cloture-session §4a) — un nouveau `functions/api/X.js` ou cron absent du doc = oubli. | ARCHITECTURE.md |
| **Réservations / annulations / revenus** | Lire **`.memory/FLUX-RESAS.md`** (pipeline validé 27/06 — 4 canaux, anti-patterns, commandes curl). En résumé : Airbnb/Booking = Worker iCal hourly auto · Direct = stripe-webhook + annulation via `deleteReservation` (1 appel, rebuild intégré @74) · Beds24 = webhook Nogent. **cancelReservations_** (Worker) = 1 appel GAS direct, ok. JAMAIS `revenus2026FromMonth(ignoreMemo:true)` = BLOQUÉ. | FLUX-RESAS.md · LEARNINGS |
| **biens.js / source unique biens** (prix/capacite/coords/SEO) | `src/data/biens.js` = **source unique** (4 consommateurs : `functions/[slug].js`, `prerender.mjs`, `_biens.js`, `PublicSite.jsx`). Ne jamais coder un fait en dur ailleurs. | LEARNINGS |
| **Nomenclature** | Seuls **Amaryllis & Iguana = « villas »** · **Iguana `bookable:false`** (bail long). | CLAUDE.md |
| **Logique métier** (pricing/occupancy/resaDedup/coherenceRules/rmOccupancyAdjust) | **Répercuter le MIROIR** GAS (`appscript/*.gs`) **ET** Worker (`workers/ical-sync`) — ils ne peuvent pas importer de module Node → **drift silencieux non testé** si oublié. **⭐ MÉTA-D : deux copies du même concept divergent toujours. À chaque duplication, nommer explicitement la source et le mécanisme de sync (audit-invariants le vérifie).** | LEARNINGS · BLOCKERS · CROSS-LEARNINGS MÉTA-D |
| **État de la prod** | CF Pages = **upload direct wrangler, PAS git-connecté**. Ne JAMAIS déduire la prod de `origin/main` (a été à 70 commits de retard). **⭐ MÉTA-A : c'est toujours la couche finale (runtime CF) qui a l'autorité — build local, worktree, alias preview peuvent tous tromper. Vérifier sur le domaine canonique uniquement (curl), pas sur l'alias ni en local.** | LEARNINGS · CROSS-LEARNINGS MÉTA-A |
| **Déployer (prod vs preview)** | 🚨 `wrangler pages deploy` SANS `--branch` prend la **branche git courante** → depuis un **worktree** (`claude/*`), ça déploie en **PREVIEW de branche** (`<branche>.dashboard-amaryllis.pages.dev`), **PAS villamaryllis.com**. Le smoke testait l'alias → faux positif total (vécu 2026-06-20, plusieurs fois). **Corrigé** : `deploy-pages.sh` force `DEPLOY_BRANCH=main` + check « ancrage prod » (villamaryllis.com sert le bundle local, sinon FAIL). `npm run deploy:pages` = TOUJOURS la prod. Preview délibéré : `DEPLOY_BRANCH=x`. | LEARNINGS · ADR |
| **Funnel / trafic / conversion / revenu / SEO (tout chiffre VOLATIL)** | 🔴 **JAMAIS un chiffre figé de `.memory`** — ils périment et mentent (MÉTA-A/ADR-G-001 ; vécu 2026-06-20, funnel du 04/06 faux d'un facteur ~4-10). Source unique live = **`npm run funnel`** (lit `/api/analytics`, GA4 30j, public sans auth) ou onglet admin Analytics. **Lancer `npm run funnel` AVANT toute reco conversion/pricing/roadmap.** | CONTEXT · CROSS-LEARNINGS MÉTA-A |
| **SEO / CSP / tracking** | Tout domaine tracking chargé doit être dans `public/_headers` (CSP). Meta : `seoTitle` ≤60c, `seoDesc` ≤158c. | audit-invariants INV4/INV5 |
| **Agents IA / contenu** | Grounding RAG sur les **faits** (`_biens.js`) · `agent-lessons` = fact-check par regex · `agents-eval` = LLM-juge. Ne pas laisser un agent inventer un fait de bien. | CLAUDE.md |
| **Pricing / canal OTA / conversion / fidélisation / acquisition** | Consulter `~/.claude/memory/PLAYBOOK-LOCATIF.md` (modèles **RM-01→26** : last-room-value, NET RevPAR, billboard effect, CAC vs commission, LTV, cluster Sainte-Luce…). Digest bakée dans `agents-run.js` (`PLAYBOOK_DIGEST`). **RM advisory only** — jamais changer un prix seul. | PLAYBOOK-LOCATIF |
| **Nouvelle table D1 / `initTable()`** | 🔴 `db.exec()` (D1) découpe l'entrée par **saut de ligne** — un `CREATE TABLE` en template literal multi-lignes classique casse le Worker (500/1101) sur CHAQUE requête, GET compris. Toujours construire le DDL en **une seule ligne** par concaténation `+` (cf. `client-errors.js`/`voyageur-feedback.js`/`maintenance.js`). | LEARNINGS 2026-07-01 |
| **Avant un deploy** | 🔴 **Claude = JAMAIS `npm run deploy:pages`** (drift prod≠main garanti avec 2 instances). Toujours : `git push origin main` → CI auto-deploy. `deploy-pages.sh` = urgence Vincent seul (CI cassée). Gate CI : tests rouges bloquent + smoke 20s+retry. | ADR-DEPLOY-001 |
| **Lint** | Doc dit « ~557 erreurs » mais c'est **périmé** (~0 erreur aujourd'hui) → envisager de réintégrer le lint au gate. | BLOCKERS |
| **Mémoire** | 3 niveaux : `.memory/` (vif) · `PROJECT_MEMORY.md` (long terme) · `docs/` (livrables). Archiver le journal daté dans `docs/_archive/` au-delà de ~10 entrées. | LEARNINGS |
| **Skills / capacités** | **Consulter la LISTE des skills** (Skill tool) avant de déclarer qu'une capacité manque — un `grep ~/.claude/skills` ne suffit pas. | LEARNINGS |
| **Workflow multi-agents** | Donner les **chemins ABSOLUS** dans les prompts agents — le worktree (cwd session) peut être périmé → verdict faux NO_GO vécu 2026-06-18. | LEARNINGS |

| **BLOCKERS.md — items à proposer** | ⚠️ **VÉRIFIER LE CODE AVANT DE PROPOSER.** Un item BLOCKERS peut être stale (fix appliqué mais entrée non fermée). Règle : avant de proposer un item, grep/read 30s pour confirmer qu'il est encore ouvert. Exemples stales vus : beds24Amount, iCal null guard, smoke test Playwright → déjà fixés sans fermeture. **Ne jamais proposer un item BLOCKERS sans preuve que le problème existe encore dans le code.** | LEARNINGS |

## ⚙️ Règle fermeture immédiate des blockers
**Quand tu fixes quelque chose** → fermer l'entrée BLOCKERS.md dans le MÊME acte que le fix, pas en clôture de session. Si le fix est dans le code (commit), l'entrée BLOCKERS est ✅ dans le même élan.

## Règle de tenue
Nouvelle LEARNING/BLOCKER rattachée à un domaine → **mettre à jour sa ligne ici** pour garder le rappel déclenchable par contexte.
