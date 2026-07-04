# 🧭 OPERATING MODEL — Standard commun aux projets de Vincent

> **Fichier identique dans `locatif-dashboard` ET `patrimoine-dashboard`.** Toute évolution du standard
> se réplique dans les deux repos. C'est le « mode de fonctionnement serein » partagé : un seul jeu de
> règles, deux applications.
> Dernière synchro : **2026-07-03** (revue Cowork — 4 cerveaux audités : locatif, patrimoine, trading-bot, life-os).

Les deux projets sont des **jumeaux d'outillage** : React 19 + Vite, Cloudflare Pages Functions,
Google Apps Script/Sheets, vitest, déploiement wrangler avec garde-fou anti-projet-croisé. Ils
partagent donc le même **mode de fonctionnement**, décrit ici une fois pour toutes.

---

## 1. Mémoire structurée `.memory/` — standard à 8 entrées

| Fichier | Niveau | Rôle |
|---|---|---|
| `INDEX.md` | — | point d'entrée : quel fichier lire quand |
| `CONTEXT.md` | — | état courant + chiffres frais (à rafraîchir chaque session) |
| `ADR.md` | 3 | décisions prises (5 lignes : choix / alternatives / conséquences / périmètre / statut) |
| `DECISIONS.md` | 3 | **moteur de décision** : critères déterministes par type de décision récurrent |
| `LEARNINGS.md` | — | pièges réutilisables (1 puce = 1 leçon) |
| `RECALL.md` | 2 | **rappel just-in-time** : domaine → quoi se rappeler avant d'y toucher |
| `BLOCKERS.md` | — | frictions / dettes / décisions différées + statut |
| `ITERATIONS_LOG.md` | — | journal des sessions (rolling, récent en haut) |
| `.last-consolidation` | — | date ISO de la dernière passe `/consolidation` (réarme le nudge) |

**Archives profondes** (hors `.memory/`, pas à relire intégralement) : `PROJECT_MEMORY.md` (long terme,
**à garder ≤ ~40 KB** — archiver le journal daté dans `docs/_archive/`), `docs/INDEX.md` (carte de toute
la doc), `docs/ERREURS-LOG.md` / `ERRORS_LOG.md` (journal d'erreurs exhaustif).

## 2. Les 3 niveaux de mémoire — tous étanches

1. **Stockage** — tout est gardé (PROJECT_MEMORY, docs/, `docs/_archive/`, git, D1/KV).
2. **Rappel** — *mécanisé*, pas conventionnel : hook **SessionStart** (`scripts/session-context.mjs`)
   injecte `CONTEXT.md` + rappels ouverts + nudge consolidation au démarrage. Complété par `RECALL.md` (par domaine).
3. **Décision** — `ADR.md` (prises) + `DECISIONS.md` (critères déterministes) + déclencheurs datés dans `BLOCKERS.md`.

## 3. Les 4 rituels (skills)

| Skill | Rôle | Métaphore | Cadence |
|---|---|---|---|
| `/cloture-session` | capture (décision / apprentissages / frictions) | on écrit | fin de session |
| `/auditeur` | constat déterministe PASS/RISK/FAIL + escalation | on inspecte | avant deploy/clôture |
| `/consolidation` | fusionner / archiver / promouvoir / réorganiser `.memory/` | on jardine | hebdo (cron + nudge >7j) |
| *(hook SessionStart)* | rappel mémoire automatique | on se souvient | chaque démarrage |

## 4. Discipline de déploiement

- **Gate bloquant** avant tout deploy : `build && lint && test` (patrimoine) / `test → build` (locatif).
  Standard cible commun : **tests + lint + build verts**, sinon pas de deploy.
- **Garde-fou anti-projet-croisé** : un script refuse de déployer vers l'autre projet CF Pages.
- **Smoke test post-deploy** : pages clés 200, bundle servi en JS, endpoints vivants.
- **Audit d'invariants** déterministe et **non bloquant** au deploy → rapport `docs/_audits/`.
- CF Pages = **upload direct wrangler, PAS git-connecté** → ne jamais déduire la prod de `origin/main`.

## 5. Principes d'architecture des données

- **Source unique des faits** : un module canonique fait foi, tout le monde l'importe
  (`src/data/biens.js` ici ; `PATRIMOINE_SOURCE` + seeds là).
- **Carte source-de-vérité déclarative** : chaque donnée déclare son origine (`seed` prioritaire vs `sheet`/`live`).
- **Totaux dérivés dynamiquement**, jamais codés en dur.
- **⚠️ Drift des miroirs** (faiblesse partagée) : la logique pure (`src/utils/*`) est **dupliquée à la main**
  en GAS/Worker (pas d'import Node). Toujours répercuter le miroir dans le même commit.

## 6. La boucle de fonctionnement serein (cycle d'une session)

```
  ouverture ──▶ [hook SessionStart injecte CONTEXT + rappels + nudge]
      │
   travail ───▶ [consulter RECALL/DECISIONS avant d'agir sur un domaine]
      │
   contrôle ──▶ [/auditeur ou audit-invariants avant un deploy ; gate tests]
      │
   clôture ───▶ [/cloture-session : décision→ADR, learning→LEARNINGS+RECALL, friction→BLOCKERS]
      │
  entretien ─▶ [/consolidation hebdo : fusionne/archive/promeut + réécrit .last-consolidation]
```

---

## 7. Matrice de conformité (rafraîchie 2026-07-03 — voir aussi trading-bot/life-os en annexe §9)

| Élément du standard | 🏠 locatif | 💰 patrimoine |
|---|---|---|
| `.memory/` 8 fichiers + `.last-consolidation` | ✅ | ✅ (RECALL/DECISIONS présents) |
| `docs/INDEX.md` (carte doc) | ✅ | ❌ docs éparpillés (toujours vrai au 03/07) |
| Index ADR formel (specs/plans) | ✅ | ⚠️ ADR.md seul |
| Hook SessionStart (rappel auto) | ✅ | ✅ **comblé** (`scripts/session-context.mjs` en place) |
| Audit invariants au deploy + `docs/_audits/` | ✅ | ✅ **comblé** (`audit-invariants.mjs` dans `npm run deploy`, écrit `docs/_audits/AUDIT-latest.md`) |
| Smoke test post-deploy | ✅ 7 checks | ⚠️ keepalive seul |
| PROJECT_MEMORY ≤ ~40 KB | ✅ 35 KB | ✅ **comblé** (≈16 KB, dégraissé depuis 139 KB) |
| Carte source-de-vérité déclarative | ⚠️ seed ad-hoc (toujours vrai) | ✅ `PATRIMOINE_SOURCE` |
| Totaux dérivés dynamiquement | ⚠️ partiel | ✅ |
| Lint dans le gate | ❌ exclu (mais ≈0 erreur aujourd'hui — prêt à réactiver, cf BLOCKERS) | ✅ (`check-lint-critical.mjs` dans le gate deploy) |
| Keepalive proactif (session/token fragile) | ❌ | ✅ Finary cron |
| Profondeur de tests (nb fichiers `*.test.js`) | 23 | 86 |
| Cron `/consolidation` hebdo | ✅ **comblé 2026-07-03** — tâche planifiée Cowork (contourne le blocage backend noté dans BLOCKERS/ADR-749) | ✅ **comblé 2026-07-03** — idem |
| **Drift des miroirs GAS/Worker** | ❌ non couvert | ❌ non couvert |

## 8. Backlog de synchronisation (qui copie quoi)

**➡️ patrimoine adopte de locatif :** ~~(1) hook SessionStart~~ ✅ fait · (2) `docs/INDEX.md` (toujours ouvert) ·
~~(3) dégraisser PROJECT_MEMORY~~ ✅ fait (16 KB) · ~~(4) audit d'invariants au deploy~~ ✅ fait.

**⬅️ locatif adopte de patrimoine :** (1) carte source-de-vérité déclarative (champs canoniques vs Sheet, toujours ouvert) ·
(2) réintégrer le lint au gate (≈0 erreur aujourd'hui, toujours ouvert — le plus facile à fermer) · (3) keepalive proactif tokens fragiles
(META_PAGE_TOKEN ~60j, Beds24, toujours ouvert) · (4) monter la couverture de tests (23 vs 86 fichiers, écart qui se creuse).

**🤝 chantier commun le plus rentable :** **tuer le drift des miroirs GAS/Worker** — un test de cohérence
qui extrait la fonction des deux côtés et compare la logique normalisée (ou une génération de code depuis
le module pur). À concevoir une fois, appliquer dans les deux repos. Toujours ouvert au 03/07.

## 9. Extension du standard aux 2 autres cerveaux de Vincent (2026-07-03)

Le standard `.memory/` (§1-2) n'est plus réservé à locatif/patrimoine — il s'étend, **adapté au contexte
de chaque projet** (pas de copier-coller aveugle) :

| Projet | État au 03/07 | Adaptation |
|---|---|---|
| **trading-bot** | 6/8 fichiers déjà là (INDEX/CONTEXT/ADR/LEARNINGS/BLOCKERS/ITERATIONS_LOG) + un `AUDIT-2026-06-15.md` en plus. Manquait RECALL.md/DECISIONS.md/`.last-consolidation`/hook SessionStart. | Comblé le 03/07 — voir `.memory/` du repo. Pas de contrainte privacy (données de marché, pas personnelles). |
| **life-os** | Aucun `.memory/` — charte `SKILL.md` + agents + données **gitignorées** (`health/`, `journal/`, `second-brain/`). | `.memory/` créé mais **scopé au système** (quelles routines marchent, décisions d'architecture vie-os) — **jamais** de chiffre santé, conformément aux règles absolues déjà écrites dans son `CLAUDE.md`. Pas de pont vers locatif/patrimoine (domaine isolé, volontaire). |

**Rituel `/consolidation` hebdo** : jusqu'ici bloqué faute de backend cron (cf. §8 historique + BLOCKERS).
Résolu via **tâche planifiée Cowork** (`mcp__scheduled-tasks`) — une passe hebdomadaire qui relit les 4
`.memory/`, signale le stale (BLOCKERS jamais fermés, `.last-consolidation` > 7j) et propose des fusions/archivages.
Ce n'est PAS un remplacement des rituels `/cloture-session` et `/auditeur` (ceux-ci restent des skills
globaux `~/.claude/`, hors de portée de cette session Cowork qui n'a accès qu'aux 4 dossiers projet).

## Règle de tenue
Ce fichier est **identique dans les deux repos**. Toute évolution du standard (nouveau rituel, nouveau
fichier mémoire, nouvelle discipline) se réplique dans les deux. La **matrice de conformité** (§7) se met
à jour quand un écart est comblé. Suivi des ports : `.memory/BLOCKERS.md` de chaque repo.
