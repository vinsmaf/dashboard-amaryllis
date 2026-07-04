# Méthodologie & Process — Learnings locatif-dashboard

> Discipline de verification, git, gouvernance memoire, skills
> Extrait de `../LEARNINGS.md` le 2026-07-04 (consolidation mémoire — split thématique).
> 19 entrées, triées par date décroissante.

## 🔍 Un grep de vérification trop étroit (casse/phrase exacte) peut simuler une fausse perte de données — 2026-07-04
- **Piège évité** : en vérifiant qu'un pointeur "détail complet → ITERATIONS_LOG.md" (créé en compactant BLOCKERS.md) était honnête, un premier `grep "Apple Business Connect"` a renvoyé 0 résultat — panique momentanée (perte de données ?). En fait le fichier écrit le titre en MAJUSCULES ("APPLE BUSINESS CONNECT — ..."), le grep exact-phrase/casse-sensible ratait donc un contenu bien présent.
- **La prochaine fois** : avant de conclure à une perte de données sur la seule foi d'un grep négatif, élargir la recherche (par date `^- \*\*2026-06-DD`, insensible à la casse, ou lecture directe d'un extrait) — un grep étroit qui ne trouve rien n'est PAS une preuve d'absence, il peut juste mal cibler la formulation réelle.

## 🔴 Vérifier qu'un rapport de sous-agent ("j'ai patché X") a RÉELLEMENT persisté — pas juste son texte de fin — 2026-07-04
- **Piège vécu** : sur 45 patches D1 annoncés comme faits par 16 sous-agents parallèles (triage qualité du backlog agents IA), une re-vérification systématique (re-fetch direct de chaque ID) a trouvé **2 patches sur 45 jamais réellement écrits** (`rep-002`, `sc-024`) malgré un rapport de sous-agent affirmant explicitement "J'ai patché sc-024 et rep-002 en bloqué avec la raison précise" — les deux venaient du MÊME sous-agent/cluster.
- **La prochaine fois** : après une passe multi-agents qui modifie des données (D1, fichiers, API), ne jamais se contenter des rapports textuels de fin de tâche — refaire un passage de vérification indépendant (re-fetch, re-grep) sur l'ÉTAT RÉEL, surtout si le volume est important (>10 écritures). Un taux d'échec de ~4% (2/45) sur des rapports par ailleurs cohérents montre que même un sous-agent qui "raconte" une réussite peut ne pas l'avoir réellement exécutée (échec silencieux d'un appel, ou simple erreur de narration).

## 🧹 Avant d'appliquer un vieux `git stash`, vérifier s'il n'est pas déjà superseded — 2026-07-02
- **Piège évité** : un stash de session passée (observabilité LLM + sécurité + CSP) semblait contenir du travail en attente. Comparaison hunk par hunk avec l'état actuel a montré que TOUT était déjà commité proprement ailleurs (et la version du stash était même parfois une régression — moins de providers, tarifs obsolètes).
- **La prochaine fois** : avant d'appliquer un stash ancien, differ chaque fichier contre l'état courant plutôt que de supposer qu'il contient du travail perdu — un `git stash drop` après vérification est plus sûr qu'un `git stash pop` qui réintroduit du code déjà périmé.

## 🔍 Bug intermittent signalé par Vincent = creuser la cause racine SILENCIEUSE, pas la façade — 2026-07-01/02
- **Piège évité** : "les posts cassent plusieurs fois par semaine" ressemblait à plusieurs petits bugs indépendants (rotation, gate). En creusant plus loin, la cause dominante était UN SEUL point : `generateReelDraft` appelait `/api/ai-summary`, cassé depuis toujours (clé absente) et échouant EN SILENCE (juste un `console.error` que personne ne lit) — le rattrapage automatique (`runEditorialRetry`, qui régénère en format différent) masquait le symptôme en le rendant aléatoire plutôt qu'absent.
- **La prochaine fois** : face à un "ça marche parfois pas", chercher d'abord les échecs SILENCIEUX (try/catch qui avale l'erreur, fallback qui masque le vrai problème) avant de corriger les symptômes de surface un par un — un mécanisme de rattrapage qui fonctionne À MOITIÉ est le signe classique d'une cause racine cachée derrière.

## 🎯 Avant de proposer un barème chiffré (fidélité, promo, seuils), interroger les VRAIES données — pas une moyenne agrégée aveugle — 2026-07-01
- **Piège évité** : en préparant le barème du programme fidélité, `AVG(ltv_total)` groupé par `nb_sejours` montrait un LTV moyen de 9863€ pour les clients "3 séjours" — un chiffre qui aurait fait exploser n'importe quel palier basé dessus. En creusant (`SELECT ... WHERE nb_sejours >= 3`), ce chiffre était en fait UN SEUL client : Joël Bailleul, locataire longue durée Iguana (3400€/mois), pas un vrai repeat customer de courts séjours — sa LTV de 46090€ écrasait la moyenne des 4 autres clients réels (~572-969€ chacun).
- **La prochaine fois** : dès qu'une moyenne groupée sert de base à une décision chiffrée (barème, seuil, tarif), toujours vérifier la liste des lignes individuelles derrière un groupe à faible effectif (n<10) avant de s'y fier — un seul outlier structurel (bail long, résa test, doublon) peut fausser toute la proposition.

## 📅 AGENDA = engagements humains datés seulement, jamais de récurrences auto — 2026-06-30
- **Piège** : 31 items `[QA hebdo/mensuel]` pour des crons automatiques ajoutés dans AGENDA.md → hook session-brain les injectait à T-7j chaque session pendant 6 mois.
- **La prochaine fois** : avant d'ajouter dans AGENDA.md, vérifier : "Est-ce une action que VINCENT doit faire à une date précise ?" Non → zéro entrée AGENDA. Documenter dans le Worker/cron lui-même.

## 🔄 Hook auto-commit brain = ne pas re-commiter après Edit mémoire — 2026-06-30
- **Piège** : après Edit sur `~/.claude/memory/AGENDA.md`, tentative de `git commit` → "nothing to commit" — le hook PostToolUse auto-brain avait déjà tout commité instantanément.
- **La prochaine fois** : après Edit d'un fichier `~/.claude/memory/`, le hook a déjà commité. Juste `git push` si nécessaire pour envoyer sur remote.

## 🔍 Vérifier le code AVANT d'implémenter une "amélioration" — 2026-06-29
- **Piège** : proposer 7 améliorations SEO/perf → 5/7 étaient déjà en place (FAQ Schema, preload hero, Fonts preconnect+swap, Nogent SEO). Implémenter sans vérifier = travail en double ou régression.
- **La prochaine fois** : grep/read EN PARALLÈLE pour chaque item avant de coder. 5 min de vérif évitent 30 min de "fix" inutile.

## 📇 Recouper des contacts : clé = téléphone normalisé, JAMAIS le nom — 2026-06-24
- **Piège vécu** : recouper guest_contacts × Sheet par nom voyageur → faux positifs en cascade (« Ary »→« Gird**ary** Élodie », « lemaya »→« **Jean** François », « Laure »→« **Laure**nt Billon »). Un token de prénom commun suffit à matcher 2 personnes différentes.
- **La prochaine fois** : recoupement/dédoublonnage = **téléphone normalisé (9 derniers chiffres significatifs : retire indicatif +33/+596/+590 et le 0 local → mobiles FR/MQ/GP convergent)** + email exact. Le nom = signal d'appoint à confirmer humainement, jamais clé d'écriture automatique. Surtout ici : contacts WhatsApp nommés « Prénom + Bien » (pas de nom de famille) = inappariables aux noms complets du Sheet.
- **Corollaire fusion** : ne jamais fusionner 2 contacts en masse sur match de nom → fusion manuelle validée (l'onglet montre les candidats, l'humain tranche).

## 🧪 Toujours un dry run avant un envoi réel à des clients — 2026-06-23
- **Vécu** : le dry run `?dry=1` de la campagne winback a révélé **Joel BAILLEUL (locataire à l'année d'Iguana, 3400€/mois)** dans la cible "votre villa vous attend, re-réservez" — envoi gênant évité. Fix : exclure Iguana (`biens NOT LIKE '%iguana%'`, RM-19).
- **La prochaine fois** : tout endpoint d'envoi de masse expose `?dry=1` (liste sans envoi) ; le lancer + relire la cible AVANT le vrai envoi. Les exclusions métier (Iguana bookable:false, locataires longue durée) doivent être dans le WHERE, pas supposées.

## 🤖 Les fix-agents d'un workflow appliquent les findings SANS vérifier les dépendances → re-vérifier soi-même — 2026-06-19
- **Piège (audit ultracode)** : l'agent fix a (a) changé Signal 4 vers `created_at` alors que le finding lui-même disait « check the D1 schema first » (heureusement la colonne existait — vérifié `PRAGMA table_info`) ; (b) appliqué un fix timezone **incohérent** : DDL DEFAULT de `acked_at` mis en MTQ (`-4 hours`), mais l'INSERT force `datetime('now')` (UTC) → le DEFAULT est **mort** (jamais appliqué si l'INSERT fournit la colonne). **La prochaine fois** : après un workflow de fix auto, **relire chaque fichier touché** — surtout schéma D1 (colonne existe ?) et DEFAULT vs INSERT explicite. Fix correct : aligner l'INSERT sur MTQ, pas le DEFAULT.

## 🐞 BugsTab filtre par défaut = "new" → toujours basculer sur "toutes" pour diagnostiquer — 2026-06-19
- **Piège vécu** : Vincent ne voyait qu'1 bug en cours dans le dashboard alors qu'il y en avait 3. Cause : filtre `fStatus = "new"` (état initial, `BugsTab.jsx` L28), et les 2 vrais bugs étaient en `triaged`. **La prochaine fois** : quand on investigate le 🐞 Bugs tab, **toujours ouvrir le filtre sur "toutes" avant de conclure** qu'il n'y a pas de bug actif. Les bugs auto-triagés (agent triage hebdo) passent en `triaged`, jamais en `new`.

## 🤖 Workflow multi-agents : chemins ABSOLUS quand le code vit ailleurs que le cwd — 2026-06-18
- **Piège vécu** : une revue adversariale (Workflow) a rendu un **faux NO_GO** « le code n'existe pas / régression » parce que les agents ont lu, en chemins **relatifs**, le **worktree périmé** (`.claude/worktrees/...` resté à un vieux commit) au lieu du vrai code (édité dans le repo principal `~/locatif-dashboard`, committé sur `main`). Cette session a tout édité via chemins absolus du repo principal → le worktree (cwd de session) ne contient PAS les changements. **La prochaine fois** : dans le prompt des agents de workflow, **donner les chemins ABSOLUS** du vrai code (`/Users/vincentsalomon/locatif-dashboard/...`) et leur dire d'ignorer tout worktree. Sinon leur cwd = worktree → lecture stale → verdict faux. (Corollaire du « relire le vrai code avant de corriger un finding LLM ».)
- **La revue reste utile sur le fond** : même en lisant la mauvaise copie (round 1), elle a sorti 5 vraies faiblesses ; relancée en absolu (round 2), 3 de plus. **Valeur réelle de l'adversarial review sur du code argent** — mais toujours **vérifier chaque finding dans le vrai code** avant de corriger (certains blockers étaient des artefacts de chemin).

## 🏦 Fix chevauchement bail : le 1er virement bancaire = date de démarrage réel — 2026-06-17
- Quand les dates Rentila d'un bail se chevauchent avec le bail suivant, **ouvrir le relevé bancaire** → la date du **1er virement locataire = démarrage effectif du bail** (plus précis que la date Rentila qui couvre parfois la prise de possession). Tronquer la Ligne précédente à `1er virement - 1j` = fix propre, ancré dans la réalité, pas une décision arbitraire. Confirmé sur Joël BAILLEUL (1er virement 04/11/2024 → checkout Ligne 1 = 03/11/2024).
- **Protection overlap lors d'import Rentila** : toujours pull le Sheet avant chaque bien → filtrer sur `checkin|checkout` par bienId → sauter les entrées qui matchent une resa déjà en base (protège les contact data Stripe). L'import `importAllReservations_` overwrite TOUTES les colonnes (y compris email/tél) si le key content match.

## 🚦 Modifications UI publiques = présenter AVANT de déployer — 2026-06-11
- **Règle ferme (rappelée par Vincent)** : tout changement visible sur le site public (UI, CRO, texte, layout) doit être décrit à Vincent **avant de coder et déployer** — même si c'est dans la continuité logique d'un travail en cours.
- **Ce qui s'est passé** : trust bar Amaryllis validée → extension aux autres biens faite et déployée de manière autonome sans présenter le scope. Vincent a demandé une explication après coup.
- **Pattern correct** : décrire ce qu'on propose → attendre go → coder → build+test → `deploie` → prod. Pas de déploiement préemptif "dans la logique du précédent".
- **Exception OK** : fix de bug UI clair (ex: PricingCalendar redondant) peut être décrit brièvement avant deploy sans attendre un go formel.

## ⚠️ BLOCKERS.md stales — vérifier le code avant de proposer — 2026-06-11
- **Pattern répété (3+ fois)** : des entrées BLOCKERS.md semblaient ouvertes mais étaient déjà fixées dans le code (beds24Amount, iCal null guard, smoke test Playwright, total_aberrant). Cause racine : le fix est appliqué mais l'entrée n'est pas fermée dans le même acte.
- **Règle dure** : avant de proposer un item BLOCKERS comme travail à faire, exécuter un grep/read de 30s pour confirmer que le problème existe encore. Si le code a déjà la fix → fermer l'entrée immédiatement.
- **Règle dure** : quand un fix est appliqué → fermer l'entrée BLOCKERS correspondante dans le MÊME élan, pas en clôture de session. Commit de code = fermeture BLOCKERS simultanée.

## 2026-06-05 — Passe sur les bugs (inbox /api/client-errors)
- **L'inbox bugs mélange du SIGNAL et du BRUIT** : les entrées `kind:"console"` préfixées `[revue code]` viennent de l'agent LLM `/api/code-review` (revue du diff au déploiement) → **beaucoup de faux positifs**. Vérifié : tout le cluster `GuestGuide.jsx` (null-deref `buildSlides`/`tvParams`/TvScreen) était DÉJÀ gardé (lignes `if (loading) return` + `if (error || !guide) return` avant tout usage). `service-checkout.js` « exception handling » = déjà try/catch complet. **Règle : toujours relire le code AVANT de "corriger" un finding LLM** — ne jamais le prendre pour argent comptant.
- **`sessionStorage` peut JETER, pas seulement renvoyer null** : accéder à `window.sessionStorage` lève `SecurityError` quand le stockage est bloqué (navigation privée stricte, cookies tiers refusés, iframe sandbox). Un accès **au niveau render** (top de composant, `useRef(!!sessionStorage.getItem(...))`) = **white-screen de toute la page**. Les `localStorage` du projet étaient déjà en `catch {}` ; les `sessionStorage` avaient été oubliés. → helper `safeStorage` (ADR-S-013). Prochaine fois : tout web-storage gardé, surtout en render.
- **Triage des `kind` de l'inbox** : `console`/`[revue code]` = LLM (à vérifier) ; `coherence` = `/api/coherence-check` sur `direct_bookings` = **vraie anomalie data** (ex. résa avec dépôt > total) à traiter côté résa, pas code ; `report` = remontée manuelle (bouton « Signaler un bug »).
- **Un `report` "HTTP 401 sur /admin" n'est pas forcément un bug** : `apiFetch.js` gère déjà le 401 (`notifyUnauthorized` → ré-ouvre la connexion). C'est l'expiration normale du token de session admin, pas un crash.

## Inventaire des capacités (skills/agents)
- **⚠️ ERREUR RÉPÉTÉE 3× DANS LA MÊME SESSION (2026-06-04).** J'ai conclu « ça n'existe pas » pour `/cloture-session`, PUIS `/auditeur`, PUIS `/consolidation` — les trois existaient déjà — parce que je grepais `~/.claude/skills/` au lieu de **lire la LISTE des skills disponibles** (system-reminder / Skill tool). Le grep ne voit pas les skills hébergées ailleurs. **RÈGLE DURE : avant de dire qu'une capacité manque OU d'en construire une, TOUJOURS scanner la liste des skills disponibles.** (Cf. RECALL.md, ligne « Skills / capacités ».)
- **Une skill (LLM) ne peut pas être appelée depuis bash.** Pour automatiser au déploiement un audit/une consolidation, il faut une **version déterministe en script** (`scripts/audit-invariants.mjs`) ; la skill reste pour le riche manuel. Pattern : skill = jugement piloté ; script = invariants déterministes greffés au gate.
- **Un hook `SessionStart` dans un repo sans `.claude/settings.json` préexistant ne se charge qu'après `/hooks` ou un redémarrage** (le watcher ne surveillait pas `.claude/` au démarrage). Le hook est correct, mais inerte la 1ʳᵉ fois.

## Édition de fichiers
- **Un linter modifie les fichiers entre `Read` et `Edit`** (vu sur `PROJECT_MEMORY.md` : Edit a échoué « file modified since read »). **La prochaine fois : re-`Read` juste avant l'`Edit` sur les gros fichiers .md, ou faire l'edit immédiatement après le read.**
- **Le quoting shell casse sur les apostrophes françaises** dans un `node -e '...'` (l'apostrophe de « L'état » ferme le quote). **La prochaine fois : écrire le script Node dans un fichier `/tmp/*.js` puis `node fichier.js`, plutôt que `-e` inline.**

## Architecture du projet (rappels qui font gagner du temps)
- **`src/data/biens.js` = source unique des FAITS des 7 biens.** Changer un prix/capacité/note/coord = éditer CE fichier uniquement (consommé par functions/[slug].js, prerender.mjs, _biens.js, PublicSite.jsx). Ne plus jamais coder un fait de bien en dur ailleurs.
- **Pattern « logique pure testée + miroir GAS/Worker »** : la logique métier vit dans `src/utils/*.js` (testée vitest) PUIS est dupliquée inline dans Apps Script (clasp) et le Worker (esbuild) qui ne peuvent pas importer de modules Node. Modules concernés : pricing, coherenceRules, resaDedup, occupancy, rmOccupancyAdjust. **La prochaine fois que tu modifies un de ces utils : répercuter le miroir, sinon drift silencieux (cf. BLOCKERS).**
- **CF Pages = upload direct via wrangler, PAS git-connecté.** Pousser sur GitHub ne déclenche aucun déploiement (juste la CI). **Ne jamais déduire l'état de la prod depuis l'état de origin/main** (historiquement 70 commits de retard alors que la prod était à jour).

## Gouvernance mémoire
- **3 niveaux de mémoire à ne pas confondre** : `.memory/` (vive, curatée, début de session) · `PROJECT_MEMORY.md` (long terme détaillé) · `docs/` (livrables + index). Garder chacun dans son rôle ; archiver le journal daté dans `docs/_archive/` quand il dépasse ~10 entrées.
