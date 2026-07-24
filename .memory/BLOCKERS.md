# BLOCKERS — Frictions, dettes & points bloquants (locatif-dashboard)

> Ce qui reviendra nous embêter si on ne le documente pas. Format : statut · sujet · ce qui débloque.
> 🔴 bloquant fort · 🟡 contourné / dette latente · ✅ levé (gardé un temps pour traçabilité).
> _Consolidé le 2026-06-20 : ✅ levés dispersés regroupés dans `## Archivé`._

## En cours → ✅ terminé le 2026-07-23 (soir) — 3 doctrines métier codées, 2 commits en attente de déploiement
- **Tâche** : traduire 4 doctrines dictées par Vincent en code testé + doctrine d'agents (mix créatif 30/20/50 · métriques pub · 3 niveaux de mesure · coût réel d'une remise · règle de répétition Meta).
- **Étape** : tout est codé, testé (894 tests verts) et committé. `18531b1`, `3376965`, `cb62a9a`, `d2865f5` **sont en prod et vérifiés en live**. `b02e774` + `cecadcb` **sont poussés mais PAS déployés** (CI bloquée, cf. 🔴 ci-dessus).
- **Prochaine action** : déployer les 2 commits en attente (`I_DEPLOY_CONSCIOUSLY=1 npm run deploy:pages` côté Vincent), puis **sonder le compte Meta réel** avec `GET /api/meta-ads-insights?window=30d&breakdown=audience` (Bearer admin) pour confirmer que le breakdown `user_segment_key` existe bien sur ce compte — c'est la seule inconnue restante du chantier.
- **Contexte critique** : (a) la répétition globale du compte est ≈ **1,16** sur 30 j → **aucune saturation aujourd'hui**, la règle est un garde-fou pour la montée en budget, pas une économie immédiate ; ne pas promettre « des milliers d'euros ». (b) Le niveau 3 (questionnaire) est en prod à **0 réponse** : il devient exploitable à 20 réponses, avant ça toute ventilation est du bruit. (c) Le verdict `rentable` du niveau 2 repose sur **3 nouveaux clients** — échantillon minuscule, et le CAC est *blended* par construction (il ne dit pas que la pub a produit ces 3 clients).

## ✅ « CI bloquée » — FAUX DIAGNOSTIC, c'était mon bug (2026-07-23, résolu le jour même)
- **Ce que j'ai cru** : la CI GitHub ne déployait plus (prod figée sur `d2865f5` pendant ~1 h malgré 2 push). J'ai ouvert un blocker 🔴 « CI bloquée », soupçonné un quota Actions, un workflow désactivé, une concurrency coincée.
- **La vraie cause** : **des backticks imbriqués dans `PLAYBOOK_DIGEST`** (`functions/api/agents-run.js`). Ce digest est un template literal délimité par des backticks ; j'y ai écrit `` `src/utils/promoCost.js` `` et `` `/api/meta-ads-insights?breakdown=audience` `` → la chaîne se referme → `ERROR: Expected ":" but found "src"`. L'étape **« Build Functions »** de la CI échouait donc, et **refusait de déployer**. La CI faisait exactement son travail.
- **Pourquoi invisible** : ni `vitest` ni `npm run build` ne parsent `functions/` — c'est du code Cloudflare Functions, hors bundle front. **Seul `npx wrangler pages functions build` le compile**, et c'était la seule étape de la CI que je n'avais pas rejouée en local.
- **Ce qui m'a mis sur la piste** : Vincent : « côté patrimoine il n'y a pas ce souci ». Pipelines identiques (ADR-146) → ce n'était donc ni le compte, ni le quota, ni GitHub : c'était ce dépôt, donc mon code.
- **Garde-fou pour la suite** : avant tout push touchant `functions/`, lancer `npx wrangler pages functions build --outdir /tmp/fn-build`. Et **jamais de backtick à l'intérieur d'un `*_DIGEST`** (utiliser des guillemets ou rien).
- **Statut** : ✅ levé (commit `a9a9a4c`), les 2 commits en attente sont déployés et vérifiés en live.

## En cours → ✅ terminé le 2026-07-22 — Fix pollinisation fleet (2 écritures muettes rendues observables)
- **Tâche** : `ADR-FLEET-SILENT-WRITES-001`. Suite à un fix côté `patrimoine-dashboard` (write KV terminal fleet sorti d'un catch silencieux, risque de perdre tout un run), vérification du même risque ici. **Verdict : l'hypothèse initiale était partiellement fausse** — architecture différente (D1 par-agent, pas de single-write terminal) donc pas de risque de perte de run complet. Mais 2 catchs muets réels trouvés et corrigés dans `agents-run.js` : `INSERT agent_drafts` (draft LLM perdu sans trace) + `CROSS_BRAIN_KV.put('cross:locatif:signals')` (pont cross-fleet vers patrimoine, mort silencieuse possible).
- **Fichiers ouverts** : aucun — committé (`b4d0ad0`), poussé, déployé (commit en tête Production `dashboard-amaryllis`). 795 tests verts.
- **Contexte critique** : fix mineur (2 lignes), pas de comportement fonctionnel changé — juste `console.error` ajouté sur 2 catchs. Le tag de pollinisation CROSS-LEARNINGS `[à vérifier: locatif]` est fermé (`[appliqué: partiel]`, leçon raffinée pour la prochaine fois : ne pas re-chercher un single-write terminal ici, il n'existe pas).

## En cours → ✅ terminé le 2026-07-22 (nuit) — Ads (Google unifié/UTM/live) + INCIDENT auto-publish social résolu
- **Agent budget pub** : Google Ads intégré au moteur de décision unifié (`ADR-GOOGLE-BUDGET-UNIFIED-001` + pool CAC Canada `ADR-GOOGLE-POOL-CAC-001`) · fix Meta insights `date_preset` périmé → `time_range` (`ADR-META-INSIGHTS-TIMERANGE-001`) · UTM sur landing Meta + `swapCreativeLink` non destructif (`ADR-META-UTM-SWAP-001`) · **passage `AD_AGENT_MODE=live`** (`ADR-AD-AGENT-LIVE-001`, verdicts en `collecting` donc 0 action pour l'instant).
- **Incident auto-publish social** (`ADR-SOCIAL-AUTOPUB-INCIDENT-001`) : posts arrêtés depuis le 18/07 (fact-check factuel "clapotis" ressuscité en boucle bloquant la file) → corrigé (`runEditorialRetry` archive les `blocked:true`, compteur `attempts`). ⚠️ MON timeout 25s intermédiaire a causé 3 doublons FB + 2 IG → retiré, doublons nettoyés (`delete_post` + Vincent sur IG). File repartie.
- **Reste à surveiller** : (a) le reel #242 (22/07) sera tenté après le skip 2h — avec le code sans timeout, il publiera OU failera après 3 essais, PAS de double (guard `published_at`). Vérifier demain qu'il n'a pas fait de double. (b) Première action réelle de l'agent budget `live` quand le tracking conversion Meta remontera.
- **Contexte critique** : le token admin `CLAUDE_SECRET` a été ROTÉ ce jour → nouvelle valeur dans `~/.claude/projects/.../memory/claude_secret.md`. L'ancienne (`0e0917...`) ne marche plus.

## En cours → ✅ terminé le 2026-07-20 — État des lieux ménage Nogent livré + destinataire Nesrine + fixes occupation/GA4
- **État des lieux ménage Nogent** : nouvelle page `/etat-des-lieux-menage` (lien fixe, sans token) pour le personnel de ménage — nom, photos (0-8), remarques libres. Réutilise `sign-contract.js` (type `etat_lieux_menage`). Email alerte étendu à `lafineconciergerie@gmail.com` en plus de Vincent, scopé ménage uniquement. `ADR-ETAT-LIEUX-MENAGE-001` + `ADR-MENAGE-NESRINE-EMAIL-001`. Commits `89b7a60`, `836191d`. Lien à donner à Vincent pour sa démo à Nesrine : `villamaryllis.com/etat-des-lieux-menage`.
- **Fix GA4 double-comptage `purchase`** (client+serveur) — retrait des 4 tirs `gtag` côté client, serveur (`stripe-webhook.js`) reste seule source. `ADR-GA4-DEDUP-001`. Commit `b904d0a`. **Ne pas s'alarmer d'une chute apparente du volume de conversions GA4/Google Ads après ce déploiement — c'est la correction du ×2, pas une régression.**
- **Fix alerte sous-occupation incohérente** : Iguana exclue (bail long, jamais sur le marché), Nogent branché sur Beds24 (jamais alimenté avant → toujours 0% à tort). Mabouya (37%) confirmé PAS un bug — blocage volontaire calendrier Vincent (voyage métropole 24/07→10/08). `ADR-OCCUPANCY-NOGENT-IGUANA-001`. Commit `afa1b5b`, déployé Pages **ET** Worker séparément (`npx wrangler deploy`).
- **Crawlers IA débloqués** : Vincent a désactivé "Block AI training bots" côté Cloudflare Security → Bots (action humaine, hors périmètre code) — vérifié 200 sur GPTBot/ClaudeBot/PerplexityBot/CCBot (étaient 403). Referme le blocker 🔴 2026-07-18 ci-dessous.
- **Fichiers ouverts** : aucun — tout committé et déployé (Pages CI vérifiée sur chaque commit + Worker déployé séparément pour le fix occupation).
- **Contexte critique** : l'outil de preview Claude Browser reste peu fiable pour vérifier visuellement une route React sur ce site (2ᵉ occurrence du symptôme homepage-au-lieu-du-composant, cf. `learnings/AUTOMATION-NAVIGATEUR.md`) — ne pas re-tenter de "corriger" une route sur cette seule base, croiser code + `window.location.href` + au besoin demander une vérif humaine.

## En cours → ✅ terminé le 2026-07-19 (nuit) — AGENT BUDGET PUB brique 3 + campagne Meta recréée + tracking Google élucidé
- **Brique 3 EXÉCUTION livrée & déployée & vérifiée live (shadow)** : `ad-budget-execute.js` — pause/baisse -25%/hausse +20%, **plafond GLOBAL DUR 600€/mois** (`enforceGlobalMonthlyCap`), garde-fous structurels (aucune primitive d'activation/création), shadow par défaut (`AD_AGENT_MODE`), kill-switch `AD_AGENT_DISABLED`, trace D1 `ad_budget_actions`, cron Worker 9h. 22 tests. `ADR-AD-BUDGET-EXECUTE-001`. Commits `28fe5e9`+`bc7f3a0`.
- **Campagne Meta "Amaryllis campagnes"** : recréée propre (A1 Amaryllis 10€ + A3 Géko 5€ carrousels), **ACTIVE et diffuse** (3 niveaux activés par Vincent). Zéro parasite. Commits `900c36b`→`0e0744b`.
- **Reste 2 fils ouverts (non bloquants)** : (a) **passage `AD_AGENT_MODE=live`** — décision de Vincent après avoir vu tourner le shadow quelques jours (lire `ad_budget_actions`). (b) **couper la campagne Google "Canada"** (155€/mois, marché lointain) — question géo posée à Vincent, en attente de sa réponse (manuel dans Google Ads, pas d'écriture API).
- **Contexte critique** : même en `live`, l'agent ne peut PAS activer un ad set en pause / créer une campagne / dépasser 600€ (impossible par construction). Google Ads = lecture seule (aucune primitive mutate). Le "0 conversion Google" est de la **variance sur échantillon minuscule**, pas un bug (tracking sain des 2 côtés depuis 02/06) → NE PAS reproposer "réparer le tracking Google".

## ✅ 2026-07-19 — Google Ads API : OPÉRATIONNEL (branché, lit les données réelles) · tracking conversion élucidé
- **RÉSOLU le 2026-07-19 (soir)** : API activée (projet Cloud **739205709562**), OAuth `googleads` connecté, `/api/google-ads-insights` (API **v21** — v18 était sunset→404) lit les **8 campagnes réelles** (508,91€/30j). **L'accès Basic n'était PAS bloquant** pour la lecture (Explorer + OAuth suffisent). Onglet admin **Budget Pub** (`AdBudgetTab`, Marketing) affiche Meta + Google + vision budget par bien.
- **✅ RÉSOLU** — checkpoint 2026-07-19 a tranché : tracking sain des 2 côtés depuis 02/06 (lien GA4↔Ads + import purchase Principale), vrai diagnostic = échantillon minuscule (6 achats/30j), PAS un bug. Ne pas reproposer réparer le tracking Google.
- **État (historique de la mise en place)** : MCC "Villamaryllis Locations" (**142-194-6270**) créé + compte Ads (**226-428-3778**) lié + accepté · developer token créé (statut **"Accès Explorer"** = test only, ne lit PAS le vrai compte) · **demande d'accès Basic soumise** le 2026-07-19 (formulaire `new_token_application` + PDF de design `~/Desktop/google-ads-api-tool-design.pdf`). Tracking conversion Google Ads (import GA4 `purchase`) déjà en Principale (vérifié 07-12).
- **Débloque** : validation Google de l'accès **Basic** (~5 j, cf. AGENDA ~2026-07-26). ⚠️ Le champ "Google Cloud project number" (champ 2 du formulaire) restait à remplir par Vincent au moment de la clôture — vérifier qu'il a bien pu soumettre (sinon le compléter). Une fois Basic accordé : coder l'intégration API Google Ads (OAuth Ads + lecture perfs → brique 1b), stocker developer token + credentials en **secrets Cloudflare** (jamais en clair). Vincent a explicitement choisi l'automatisation API plutôt que la saisie manuelle.

## En cours → ✅ terminé le 2026-07-18 — GEO : audit visibilité IA + llms.txt auto-généré + blocage Cloudflare trouvé
- **Tâche** : Vincent a demandé "comment apparaître dans les recherches/recos ChatGPT/Perplexity/autres IA" puis "vérifies et mets tout en place au mieux". Audit de l'existant (déjà solide) → 2 corrections livrées + 1 blocage critique trouvé et documenté (hors périmètre code).
- **Fait** : `scripts/generate-llms-txt.mjs` génère `public/llms.txt` depuis `src/data/biens.js` au build (corrige au passage Iguana listée à tort comme réservable). Testé (700/700), buildé, committé (`4655520`, `6511d83`), déployé, vérifié en live. `CLAUDE.md` mis à jour (consommateurs biens.js + footgun #8 GEO).
- **Trouvé, PAS corrigé (hors périmètre code)** : Cloudflare bloque GPTBot/ChatGPT-User/PerplexityBot/ClaudeBot/CCBot en 403 au edge, malgré `robots.txt` qui les autorise — cf. entrée 🔴 ci-dessous + AGENDA (`~/.claude/memory/AGENDA.md`, 2026-07-18 · locatif). Action requise : Vincent, dashboard Cloudflare.
- **Fichiers ouverts** : aucun — tout committé et déployé.
- **Contexte critique** : ne PAS re-proposer de "corriger le contenu SEO" pour ce problème — le contenu (JSON-LD, llms.txt) est déjà solide, le blocage est un réglage de sécurité Cloudflare que Claude ne doit jamais toucher lui-même. Vérifier la levée avec `curl -A "<UA GPTBot>" https://villamaryllis.com/` → doit passer de 403 à 200.

## ✅ 2026-07-18 → fermé 2026-07-20 — Cloudflare bloque GPTBot/PerplexityBot/ClaudeBot/CCBot au niveau du edge (403), malgré un robots.txt qui les autorise explicitement
- **RÉSOLU le 2026-07-20** : Vincent a désactivé le toggle "Block AI training bots" (Security → Bots → Manage AI bot access → "Do not block"). Revérifié en direct : `curl -A "<UA GPTBot>" https://villamaryllis.com/` → 200 (était 403). villamaryllis.com est de nouveau visible pour ChatGPT/Perplexity/Claude/Common Crawl.
- **Constat, vérifié en direct par simulation de requêtes** (`curl -A "<UA GPTBot/PerplexityBot/ClaudeBot/CCBot/ChatGPT-User>" https://villamaryllis.com/`) : les 5 signatures IA testées reçoivent toutes un **403 "Your request was blocked."** (`server: cloudflare`, `content-type: text/plain`, 25 octets) — alors que `robots.txt` dit `Allow: /` pour tous les User-agents et référence même `llms.txt`. Contrôles : Googlebot → 200, Bingbot → 200, UA navigateur → 200, UA inconnu/aléatoire → 200. **Seuls les crawlers IA reconnus sont ciblés** — ce n'est pas un Bot Fight Mode générique, c'est une règle spécifique aux IA (probablement le toggle Cloudflare "AI Scrapers and Crawlers" sous Security → Bots, ou une règle WAF dédiée).
- **Conséquence directe** : villamaryllis.com est actuellement **invisible pour ChatGPT (browsing), Perplexity, Claude et tout modèle entraîné via Common Crawl** — c'est la cause racine de la question de Vincent ("pourquoi je n'apparais pas dans les IA"), bien avant tout sujet de contenu/schema (qui sont déjà solides : JSON-LD FAQPage/VacationRental/Organization+sameAs, llms.txt).
- **Je n'ai PAS pu vérifier/modifier ce réglage moi-même** : le token API `CLOUDFLARE_API_TOKEN` disponible est scopé à la purge de cache uniquement (401 sur `/zones/{id}/bot_management` et `/settings/security_level`) — et modifier un réglage de sécurité reste de toute façon une action que je ne dois jamais faire moi-même, même avec permission.
- **Débloque** : Vincent doit aller dans le dashboard Cloudflare (zone villamaryllis.com) → **Security → Bots** → chercher un toggle "AI Scrapers and Crawlers" / "Block AI Bots" et le désactiver (ou passer en "Allow"). Si absent de cet écran, vérifier **Security → WAF → Managed rules / Custom rules** pour une règle qui matche ces user-agents. Une fois changé, revérifier avec les mêmes commandes `curl -A "..."` ci-dessus (ou redemander à Claude de revérifier).

## ✅ 2026-07-18 → fermé 2026-07-20 — 3 éléments non committés antérieurs à cette session, disposition inconnue
- **Constat** : au démarrage de cette session, `git status` montrait déjà `functions/api/ai-ops.js` modifié (+26 lignes, ajout de candidats gratuits hors RANK pour l'auto-discovery LLM, commentaire "aligné sur patrimoine-dashboard", daté 07-18), `src/data/imageVariants.json` modifié (1 ligne), et un dossier non suivi `_vincent-os-v6-delivery/` (5 fichiers .md, horodatés 09/07 — audit + plan "Vincent OS unifié" + prompts de délégation locatif/patrimoine, probablement lié aux travaux Fable 5 mentionnés dans l'échange sur le second cerveau). Rien de tout ça n'a été touché ni committé par cette session — statut à clarifier avec Vincent (fini et à committer ? brouillon à jeter ? travail d'une autre instance en cours ?).
- **Débloque** : demander à Vincent s'il veut que ces 3 éléments soient committés, revus, ou laissés tels quels.
- **✅ Preuve trouvée 2026-07-20** : `git status --short` sur `functions/api/ai-ops.js` et `src/data/imageVariants.json` = propre (aucune modif locale, donc committé ou annulé) ; `_vincent-os-v6-delivery/` n'existe plus sur le disque. Les 3 éléments sont clarifiés/résorbés.

## En cours → ✅ terminé le 2026-07-18 — Near-miss pricing Schœlcher + idée I-12 (marque blanche)
- **Tâche** : suite du fil pricing — Vincent avait dit "ok go" sur un test "+15%" Schœlcher que Claude avait recommandé en citant l'ADR YTD (87€, `/api/revenue-summary`). Avant d'écrire un override, vérification de la couche seed (`SEED_DAILY_PRICES`) + du live `/api/site-config?type=prices` a montré que le prix EFFECTIF proche (juil-26 août) était déjà 128-154€ — la reco initiale était fondée sur le mauvais chiffre (moyenne YTD, pas le prix réellement affiché). **Aucun override écrit.** Vincent a confirmé que la baisse fin août-septembre (override 20-25€ sous le seed) est volontaire ("septembre très peu de demandes") — pas un bug.
- **Fichiers touchés** : `.memory/learnings/REVENUS-PRICING-GAS.md` (nouvelle entrée datée, addendum à la leçon "3 couches de prix" du même jour). `.memory/ROADMAP-INNOVATIONS.md` (+I-12).
- **Contexte critique** : **un ADR/occupation YTD est un indicateur de TENDANCE, jamais une base de calcul pour une action de prix** — toujours résoudre le prix EFFECTIF proche (override ?? seed ?? flat) à la date cible avant de proposer un %. Deuxième fois le même jour que ce type d'erreur de baseline est attrapé (la 1ère avait généré le garde-fou `ADR-RM-SEED-DRIFT-001`) — signal que ce risque de comparaison bancale est récurrent, pas un accident isolé.
- **Fil séparé, même échange** : discussion stratégique "que développer que tout le monde a besoin" → idée de vendre toute la plateforme en marque blanche (abonnement ou achat unique) à d'autres hosts. Vincent a challengé à raison le réflexe initial de Claude (MM-22 appliqué mécaniquement à "nouveau chantier = distraction"). Verdict : ni l'abonnement ni l'achat unique ne sont zéro-touch en l'état (multi-tenant à construire, onboarding par client, support/decay API) ; seule une vente unique à un opérateur passerait le test. Idée gardée en mémoire (**I-12**, ROADMAP-INNOVATIONS.md), pas cadrée, pas lancée — Vincent : "on garde ça en mémoire on reviendra dessus".

## En cours → ✅ terminé le 2026-07-18 — I-11 backlog-verify : fermeture autonome du backlog vérifiable
- **Tâche** : demande Mode Sosie de Vincent ("développer une machine qui tourne toute seule comme si j'étais là"), partant du constat `delegation-stats` que `action_cochee` est son poste #1 de charge manuelle. Construit `/api/backlog-verify` (LLM classifie → garde sémantique `applyKeywordGuard` → checker déterministe live_meta/ga4_event/jsonld_schema → ferme si positif). Cf. ADR-BACKLOG-AUTOVERIFY-001.
- **Fichiers ouverts** : aucun — tout committé et déployé (`9b5d3e6` puis fix `b57e2f6`).
- **Contexte critique** : le premier dry-run live a révélé un vrai faux positif (item "Core Web Vitals" classé à tort en vérif SEO) — corrigé par `applyKeywordGuard`, mais ça illustre que le prompt LLM seul ne suffit jamais comme garde-fou pour une fermeture automatique, il faut toujours une vérification déterministe de l'ancrage textuel EN PLUS du checker final. Sur le backlog actuel (19 items dans le périmètre seo/tracking/content/technique/performance), 0 fermeture — normal, le backlog est à majorité photos/Reels/témoignages (production physique), pas un échec du système. **Ne pas élargir le périmètre de checkType sans données concrètes montrant que le nouveau type est réellement représenté dans le backlog ouvert** (leçon du faux départ initial sur "seo/content = auto-vérifiable par catégorie"). À revisiter dans quelques semaines : vérifier `delegation-stats.action_cochee` a-t-il baissé, et combien d'items le système a-t-il réellement fermés depuis.

## En cours → ✅ terminé le 2026-07-18 — Garde-fous RM (seed↔RM) + triage exécutable des recos agents
- **Tâche** : 2 fils distincts cette session. (1) Garde-fous permanents après une erreur de diagnostic sur le pricing Amaryllis (cf. ADR-RM-SEED-DRIFT-001). (2) Triage des ~49 recos agents "à planifier" → 5 implémentées, 2 déjà-faites corrigées en D1, 1 déprioritisée par Vincent (cf. ADR-AGENTS-RECOS-BATCH-001).
- **I-01 (chantiers innovation) : cadré mais explicitement mis en attente par Vincent** — proposé de reprendre par I-01 (enchère inversée), question RM auto/advisory/hybride restée sans réponse une première fois (redirection vers le triage recos agents), puis Vincent a demandé "explique I-01 en détails" → design hybride présenté (plancher + fenêtre de dates fixés par Vincent à l'avance, acceptation instantanée dans ces limites, sinon validation manuelle — ne viole pas "RM=advisory only" car c'est Vincent qui pose la règle, pas le RM qui décide). Réponse de Vincent : **"a garder mais pas mettre en place de suite"** — design validé conceptuellement, **implémentation explicitement différée**. Détail à jour : `.memory/ROADMAP-INNOVATIONS.md` section I-01. **Ne pas coder tant que Vincent ne redemande pas explicitement de reprendre ce chantier.**
- **Fichiers ouverts** : aucun — tout committé et déployé (`19c8631`, `ac53b9e`).
- **Contexte critique** : `resolveLivePrice()` (`src/utils/rmPriceDigest.js`) inclut désormais `SEED_DAILY_PRICES` — toute future logique qui compare un prix RM au "prix réel" doit passer par cette fonction, jamais comparer directement à `bien.prix`. Le code promo `AMARYL-FF98` (-15%, invitation directe OTA) expire le ~2027-07-18 (AGENDA). Le TaskList persistant du harness contient des dizaines d'entrées `[completed]` non fiables (couvrant des sessions bien antérieures) — ne jamais s'y fier comme source de vérité sur l'état du code, toujours grep/vérifier en live.

## ✅ 2026-07-18 — Fraîcheur des avis (`voyageur_feedback`) : PAS un problème, Vincent a déjà tous ses avis ailleurs
- **Constat initial** : 4 des 5 biens scrapés (Amaryllis/Mabouya/Schœlcher/Zandoli) n'ont reçu aucun nouvel avis en D1 depuis le 1er juin, alors que le cron du 1er juillet a bien tourné — seul Géko a été mis à jour. Hypothèse plausible trouvée : compte Apify en **plan FREE** (`isPaying:false`), et le run demande jusqu'à 250 avis (50×5 biens) — budget gratuit probablement épuisé après le 1er bien traité.
- **Vincent (2026-07-18)** : "on a déjà tout les avis dans le dashboard" — il a déjà une vue à jour de ses avis par un autre canal (Airbnb directement). **Ne pas re-signaler ce sujet, ne pas proposer de réduire `maxReviewsPerListing` ni d'upgrader Apify sans qu'il en reparle** — la staleness D1 n'est pas un problème business pour lui.

## 🟡 2026-07-18 — `parity-check.js` : le scrape Firecrawl des fiches Booking.com échoue la majorité du temps
- **Constat** : en vérifiant la reco agent #8 (déjà construite depuis le 10/07, pas un nouveau chantier), `parity_checks` en D1 montre `ota_price_cents` NULL sur la quasi-totalité des lignes récentes — 1 seule alerte réussie à ce jour (Amaryllis 2026-07-24, +40%). Le contrôle tourne bien chaque jour (cron Worker) et pose `direct_price_cents` correctement, mais la comparaison n'aboutit presque jamais faute de prix OTA extrait.
- **Débloque** : diagnostiquer pourquoi le scrape échoue (structure de page Booking.com changée ? sélecteur Firecrawl obsolète ? rate-limit ?) — pas fait ici, hors scope de la vérification demandée. Chantier à part si Vincent le priorise.

## En cours → ✅ terminé le 2026-07-16 — Audit fiabilité/vitesse synchro résas (24 agents) : 10 fixes déployés

> Demandé par Vincent ("comment peut-on fiabiliser/accélérer la synchro résa/annulation ?"), traité en 2 temps : audit multi-agents (24 agents, vérification adversariale — la vérif a corrigé plusieurs "fixes rapides" proposés à tort, ex. une piste Nogent visait le mauvais endpoint) puis implémentation un par un avec vérification live à chaque étape (demande explicite Vincent : "vérifie bien que rien ne s'est cassé"). Détail complet des 6 ADR dédiés (`ADR-SYNC-AUDIT-*`) + `.memory/FLUX-RESAS.md` réécrit pour refléter l'état réel.

- **P1 (argent réel)** : cache dispo purgé sur les 4 canaux (fin de la fenêtre de double-booking Stripe 6h) · annulation directe propage enfin au Sheet (upsert "Annulé" + rebuild, avant : Sheet figé "Confirmé" pour toujours) · résa Nogent payée protégée contre une annulation auto à tort (nouvelle colonne `beds24_booking_id` + retry/alerte sur `confirmBeds24Booking`).
- **P2 (fiabilité/vitesse)** : annulations Airbnb/Booking.com → Sheet **réparées** (ne faisaient RIEN depuis toujours — bug transport RESA-001 + `LBL2ID` non déclaré, jamais détecté avant) · résas groupées enfin visibles au check anti-double-booking cross-canal · push Sheet immédiat pour résa directe (vs jusqu'à 10min) · timeout 12s sur le scrape Booking.com (aucun avant, pouvait geler tout le cycle) · `LockService` sur les 4 fonctions d'écriture Apps Script (0 protection avant) · faux positifs "montant aberrant" dégradés sur imports OTA à 0€ (jamais exclus) · `cross_canal.checked` enfin informatif (était toujours = `overlaps`).
- **P3** : commentaires de cadence cron obsolètes corrigés (10min réel vs "hourly"/"15min" documentés à plusieurs endroits) + `docs/booking-sync.md`/`.memory/FLUX-RESAS.md` réécrits.
- **Trouvé au passage, hors scope initial** : `CLAUDE_SECRET` en clair dans `.memory/FLUX-RESAS.md`, committé en git depuis plusieurs commits — retiré du fichier, signalé à Vincent (entrée friction dédiée ci-dessous).
- 11 commits déployés (Pages CI + Worker + Apps Script selon le fichier), 491/493 tests verts tout du long, chaque mécanisme vérifié en live SANS toucher de vraie donnée à risque (UID/id inexistants, ou donnée déjà idempotente re-écrite avec la même valeur).

## 🟡 2026-07-17 — La lecture Sheet (`action:"read"`) prend ~32s : aucun refresh de cache en fond ne peut aboutir

> **Noté à la demande de Vincent** (« ça vaudrait un chantier à part — note-le »), après l'incident CACHE-001 (cache figé 17,5h, `docs/ERREURS-LOG.md`).

**Le fait, mesuré** : `POST /api/sheets-proxy {action:"read"}` prend **~32 s** en live (Apps Script `readAll_` : revenus/occ/adr/revpar/cashflow pour 9 entités × 12 mois + relecture des 706+ lignes de « Toutes les Réservations »). C'est la **cause racine** de CACHE-001 : `context.waitUntil(refreshReadCache(...))` ne peut pas terminer un fetch de 32 s, donc le rafraîchissement en tâche de fond échouait **systématiquement** et le cache restait servi jusqu'au HARD_TTL de 24 h.

**Ce qui est déjà fait (2026-07-17, `7977d0f` + `246c5b0`)** — le symptôme est traité, pas la cause :
- Toute écriture réelle purge le cache (`WRITE_ACTIONS`) → la fraîcheur suit les vrais changements, plus une horloge.
- `purgeReadCache` exposé + appelé par `Planning.jsx` (qui écrit vers Apps Script en direct, hors proxy).
- Purge **conditionnelle** sur le sync (`added > 0` / `cancelled > 0`) : le Worker rejoue tout le catalogue toutes les 10 min, purger à chaque passage rendrait le cache froid en permanence (= 32 s à chaque ouverture — régression rattrapée avant qu'elle ne se voie).
- Échecs de refresh loggués (fini le `.catch(() => {})` muet) + en-tête `X-Cache-Age-Min`.

**Ce qui reste (le chantier)** : tant que la lecture coûte 32 s, deux limites subsistent —
1. après une purge légitime, **le prochain lecteur attend 32 s** ;
2. une simple MAJ de montant par le sync (scrape Booking) n'invalide rien → visible seulement à la purge suivante.

**Pistes non tranchées** (à cadrer avec Vincent, aucune n'est engagée) :
- **Découper l'action `read`** : séparer les résas (rapide) des KPI calculés (lourds) → 2 appels, le dashboard affiche l'essentiel vite.
- **Réchauffer le cache depuis le Worker cron** (pas soumis au budget `waitUntil` d'une Pages Function). ⚠️ **Attention quota Apps Script** — déjà épuisé une fois en testant trop (LEARNINGS 2026-07-15) : une cadence trop agressive casserait la synchro pour tout le monde.
- **Optimiser `readAll_` côté GAS** (lectures groupées plutôt que cellule à cellule).

**⚠️ Vérifier avant de coder** : je n'ai **pas confirmé** que le budget `waitUntil` est bien la cause de l'échec du refresh — c'est une déduction (32 s + échec systématique). Le log ajouté le 2026-07-17 (`msg:"refresh cache en fond échoué"`, avec `cache_age_min` + l'erreur réelle) donnera la **vraie** raison. **Le lire avant d'optimiser quoi que ce soit** — si c'est en fait un quota Apps Script ou un timeout côté GAS, les pistes ci-dessus visent à côté.

## 🟡 2026-07-16 — Nogent : le webhook Beds24 reste le SEUL chemin d'entrée pour une nouvelle résa, sans filet de rattrapage
> Trouvé pendant l'audit synchro (P1.3/vérification adversariale) : si le webhook Beds24 casse un jour (config, panne, secret expiré → 401 fail-closed), rien ne détecte/rattrape automatiquement une nouvelle résa Nogent — Nogent est volontairement exclu du sync iCal du Worker (pas d'iCal côté Beds24). Piste identifiée mais PAS implémentée (la vérification adversariale a montré que le fix initialement proposé visait le mauvais endpoint) : faire appeler par le Worker `/api/beds24-webhook` lui-même (sans body) toutes les 10 min — réutilise le rattrapage 48h déjà écrit dans ce endpoint, sans dupliquer de logique. **Débloque** : nécessite un nouveau secret Worker (`BEDS24_WEBHOOK_SECRET`, store séparé des secrets Pages) — pas codé, en attente que Vincent demande d'y toucher.

## ✅ 2026-07-16 → rotation faite 2026-07-21 — `CLAUDE_SECRET` trouvé en clair dans `.memory/FLUX-RESAS.md`, committé en git depuis plusieurs commits
> Découvert en réécrivant `FLUX-RESAS.md` (P3 de l'audit synchro) — un exemple de commande bash contenait `SECRET="0e091781cd..."` en dur. Retiré du fichier actuel (remplacé par `grep .dev.vars`), mais **l'historique git le contenait toujours** (5 commits touchant ce fichier). **Résolu par rotation** (2026-07-21, décision Vincent) : nouveau `CLAUDE_SECRET` généré (`openssl rand -hex 24`), pushé via `wrangler pages secret put` (prod) + `.dev.vars` local + mémoire `~/.claude/projects/.../memory/claude_secret.md` mis à jour. **Piège trouvé au passage** : un secret Cloudflare Pages mis à jour via `wrangler pages secret put` ne s'applique QU'AU PROCHAIN déploiement — pas au déploiement déjà en ligne (contrairement aux Workers où c'est immédiat). Vérifié : l'ancien secret restait valide (200) et le nouveau échouait (401) jusqu'au push de ce commit qui a redéployé. **L'ancienne valeur exposée dans l'historique git reste lisible** (purge d'historique = décision plus lourde, toujours non faite, mais désormais inoffensive — le secret qu'elle révèle n'est plus valide).

## ✅ 2026-07-15 (nuit) → fermé 2026-07-20 — Audit complet site+dashboard (8 agents parallèles) : 3 failles sécurité actives + 1 bug conversion silencieux site-wide
> Demandé par Vincent avant de dormir ("audit complet et total... pour demain matin"). 8 audits read-only en parallèle (QA fonctionnel, infra, sécurité, SEO, données D1, finances, design, complétude admin) + mes propres checks (secrets/lint/tests). Détail complet + tous les findings mineurs → rapport Artifact + `docs/_audits/AUDIT-COMPLET-2026-07-15.md`. Ici : uniquement ce qui nécessite une décision/action de Vincent.
> **✅ RÉSOLU (items sécu/conversion majeurs)** — `beds24-manage.js` verifyBearer (L6+L192) + vérif paiement Stripe (L112) ; `tv-context.js:110` fuite prénom/dates fermée ; `src/index.css:78` overflow-x:clip ; `PublicSite.jsx` openBien() ne casse plus l'attribution GA4/Meta. 3 sous-items restants (EN, Nogent totaux, politique annulation) restent 🟡 ouverts.

**Sécurité — à traiter en premier, touche le tunnel de paiement réel (donc PAS corrigé cette nuit sans pouvoir tester avec toi) :**
- `functions/api/beds24-manage.js` action `confirm` : aucune vérification de paiement Stripe — 2 requêtes publiques (`beds24-create` puis `beds24-manage confirm`) suffisent à confirmer une résa Nogent gratuite qui bloque les vraies dates.
- Même fichier, action `cancel` : aucune vérification de propriété (IDOR) — un `bookingId` valide (obtenu via l'action `find`) suffit à annuler n'importe quelle résa Nogent réelle et payée.
- `functions/api/tv-context.js` : fuite sans auth du prénom + dates du séjour en cours, **confirmée exploitable en live cette nuit** (`?p=nogent` a renvoyé le vrai prénom d'un vrai voyageur présent). RGPD + risque "détection de logement vacant".
- **Débloque** : session dédiée avec toi pour patcher + tester une vraie réservation Nogent avant de déployer (risque de casser le tunnel de paiement si fait à la légère).
- **✅ Preuve trouvée 2026-07-20 — les 3 failles sécurité sont corrigées** : `functions/api/beds24-manage.js` (commentaire "audit 2026-07-15") vérifie désormais le PaymentIntent Stripe réel avant `confirm` (L97-125) et exige `email`+`lastName` matchés sur une fenêtre 6h avant `cancel` (L127-150, fix IDOR) ; `functions/api/tv-context.js` (commentaire "Sécurité (audit 2026-07-15)") n'accepte plus que les requêtes avec un `Referer` `villamaryllis.com/bienvenue` (L110-127). Les points "Conversion/argent" ci-dessous restent à vérifier un par un.

**Conversion/argent — bugs de code réels, pas juste des constats :**
- ✅ **Fermé, vérifié 2026-07-20** — `src/PublicSite.jsx` `openBien()` (~L9301) appelle `openDetail(null)` qui réinitialise l'URL vers `/` et le `<title>` vers celui de la home à CHAQUE ouverture du récap réservation, sur TOUTES les fiches biens — casse l'attribution GA4/Meta par bien (impacte directement le checkpoint ROAS du 19/07 déjà prévu dans AGENDA) et fait perdre la progression si le voyageur rafraîchit. Fix identifié : ne pas appeler `openDetail(null)` depuis `openBien()`, juste fermer l'overlay localement. **Preuve** : `openBien()` (L9766) utilise désormais `setDetailBien(null)` avec un commentaire explicite "SANS passer par openDetail(null) ... trouvé par audit 2026-07-15".
- ✅ **Fermé, vérifié 2026-07-20** — `src/index.css:72-75` `overflow-x:hidden` sur `<body>` casse silencieusement le header sticky sur TOUT le site (mesuré : `top:-301px` au scroll au lieu de `0`) — le CTA réservation disparaît dès qu'on scroll sur une fiche bien. Fix identifié : `overflow-x:clip` au lieu de `hidden`, ou déplacer sur un wrapper. **Preuve** : `src/index.css:78` = `overflow-x: clip;`.
- Bouton WhatsApp flottant n'apparaît JAMAIS sur les fiches biens chargées directement (`/amaryllis` etc. — donc tout visiteur venant de Google/pub/réseaux), seulement après scroll sur la home. `PublicSite.jsx` ~L10360.
- Nogent affiche 3 totaux différents pour le même séjour (145€ dans le header vs 135€ dans la modale ET sur le bouton payer) — écart de 10€, à re-tester sur d'autres dates/biens pour voir l'ampleur.
- Politique d'annulation contradictoire dans le MÊME flow de réservation (Amaryllis) : "7 jours" affiché en step 1, "J-14" (le vrai) affiché juste en dessous et en step 2 — risque de litige voyageur.
- **628€ reçus (Francois Cambier, Zandoli, lien WhatsApp, séjour EN COURS 05→20/07) jamais enregistré dans `direct_bookings`** — calendrier vérifié SAIN (pas de risque de double-booking, probablement bloqué à la main par toi sur Airbnb/Booking), mais revenus + automatisations voyageur (écran TV, email code d'accès) aveugles à ce séjour. + 2 autres virements Stripe non expliqués (695€ le 03/07, 5€ le 17/05) — à vérifier dans le dashboard Stripe (la clé locale est en mode test, je n'ai pas pu confirmer côté Stripe moi-même).
- Traduction EN très incomplète : les descriptions de logement (chambres/espaces de vie/extérieurs) restent quasi 100% en français même avec le switch EN activé.

**Fiabilité des données — dette memoire trouvée pendant l'audit, déjà corrigée cette nuit :**
- `ARCHITECTURE.md` affirmait à tort un 9ᵉ cron `0 * * * *` (mon propre edit de ce soir, contredit par un commit antérieur du même jour que je n'avais pas vu) — corrigé après détection par l'audit infra. Nouvelle leçon dans `learnings/METHODOLOGIE-PROCESS.md` : toujours revérifier contre le fichier réel, jamais contre son propre résumé de session.
- `ARCHITECTURE.md` §13 citait un vieux trou sécurité (`rm-*`/`agent-memory.js` sans auth) déjà corrigé lors d'audits antérieurs — remplacé par les 3 vrais trous actuels ci-dessus.
- `ARCHITECTURE.md` décrivait `GuestContactsTab.jsx` comme un onglet admin vivant — retiré du menu le 24/06 (délibéré), mais l'API + 88 fiches contacts restent actives sans AUCUNE UI pour les consulter. À trancher : fusionner dans `crm_clients`, rétablir un accès lecture, ou assumer.

**🟡 Dette notable (non urgent, détail dans le rapport complet)** : 3 onglets admin (Interventions/Travaux/Prestataires) tournent en `localStorage` pur sans aucune synchro serveur (perte de données possible, `InterventionsTab` fait doublon avec `MaintenanceTab` qui lui est D1-backed) · logs PII en clair dans 12 lignes/8 fichiers `functions/api/*.js` (le fix du 04/07 n'a couvert que le Worker) · CSP bloque 2 des 5 fallbacks iCal admin, qui envoient en plus des tokens iCal privés à des proxies tiers (à retirer, pas à whitelister) · Iguana double noindex + reste dans le sitemap + JSON-LD contradictoire · robots.txt bloque GPTBot/ClaudeBot/CCBot (probablement un défaut Cloudflare non voulu, contredit le `llms.txt` publié) · lint 738 erreurs (vs ~600 documenté, dette en hausse).

## En cours → ✅ terminé le 2026-07-15 (soir) — Devis groupé Cambier + tri agents + Sentry + SEO articles + Stripe diagnostic
> 6 sujets distincts traités dans la même fenêtre de conversation, tous terminés/déployés/vérifiés — aucun repris de session antérieure, aucun laissé ouvert. Détail complet → `CONTEXT.md` (entrée "2026-07-15 (suite 2)"), 6 ADR dédiés.
- Page `/devis-groupe` + lien court `/rg/` livrés pour le devis groupé François Cambier (4286€, Zandoli+Géko) — Vincent a d'abord reçu un Artifact externe (refusé, "je veux une page web sur le domaine"), corrigé dans la foulée.
- Sentry `beforeSend` ajouté (faux positifs "chunk périmé" post-déploiement) — découverte que Sentry est un pipeline totalement séparé de `bugCapture.js`/`client_errors`.
- 16 items du backlog `agent_actions` triés avec feedback explicite envoyé à 5 agents (demande explicite de Vincent : "toujours expliquer pourquoi") — 2 hallucinations confirmées (SnapLife/Adobe XD, Amazon.fr récidive), memory `feedback_agent_recos.md` corrigée (statut `bloqué`, pas `ignoré`, qui n'existe plus).
- Watchdog `watchdog-taches-planifiees` créé (cron 21h) après découverte qu'une tâche cloud automatique s'était bloquée silencieusement des heures sans alerte — **Vincent doit encore cliquer "Run now" une fois pour pré-approuver les permissions**, sinon le 1er run risque de rester en pause (cf friction ci-dessous).
- 37 articles SEO à 0 impression après 3 semaines : cause trouvée (sitemap jamais relu par Google depuis sa 1ère lecture le 23/06), resoumis manuellement, pages découvertes 64→99. Suivi programmé AGENDA 2026-07-30.
- "Rapprochement Stripe cassé depuis le 07/07" : diagnostiqué comme un non-bug (12 jours sans nouveau paiement direct, compte Stripe sain) — `?balance=1` ajouté à `/api/stripe-reconcile` comme outil de diagnostic permanent.

## En cours → ✅ terminé le 2026-07-17 — I-09 (délégation) + I-10 (concierge) livrés, fix cache, 2 corrections de résas Nogent

> Session « on essait de faire 9 et 10 » (2 des 10 chantiers innovation). Détail complet : `ROADMAP-INNOVATIONS.md` + 3 ADR (`ADR-I09-DELEGATION-001`, `ADR-I10-CONCIERGE-001`, `ADR-CACHE-SHEETS-001`).

- **I-09 livré** (`dc1b28d`) : `/api/delegation-stats` mesure ce que Vincent fait à la main. **Verdict réel : 317 actes/8sem, PLAT, 61% = cocher des actions agents** → re-vérifier dans 4 semaines.
- **I-10 livré** (`e7ccc17`+`b674d43`) : concierge en **shadow** (garde-fous testés en prod). Prérequis prestataires migrés localStorage→D1. Bug WhatsApp corrigé (devinait le bien par mots-clés). **En attente Vincent : bascule `CONCIERGE_MODE=live`.**
- **Fix cache** (`7977d0f`+`246c5b0`+`6c3c292`) : incident CACHE-001 (cache figé 17,5h, chiffres faux). Refresh en fond retiré (Cloudflare l'annule, prouvé), invalidation à l'écriture à la place.
- **Données** : Ines Dali corrigée (1124€ net, 06→20/07) · nouvelle résa Nogent 20-24/07 288€ net espèces (400 brut −40 ménage −20% conciergerie).
- **Résidus non bloquants** (voir frictions ci-dessous) : token Beds24 read-only · concierge en shadow · prestataires pas encore importés côté Vincent · chantier lecture Sheet 32s.

## ✅ 2026-07-24 — Annulation auto Beds24 : filtre de canal posé (le Worker peut recevoir un token d'écriture)

> **Résolu le jour même.** Filtre ajouté : l'annulation automatique ne touche QUE les résas
> dont `referer === "direct"` — la valeur qu'écrit `functions/api/beds24-create.js`, donc
> uniquement notre tunnel. Décision de Vincent, mot pour mot : « le token ne doit toucher
> qu'aux réservations qui viennent de notre côté, pas celles ajoutées sur Beds24 ou ailleurs ».
> Égalité **stricte**, pas un `includes` : « Louer Premium » (compte Beds24 de Vincent, ses
> saisies manuelles) est exclu au même titre que les OTA.
>
> Logique pure + 18 tests : `src/utils/beds24Cancel.js`. ⚠️ **Miroir manuel** dans
> `workers/ical-sync/index.js` (`runCancelUnpaidBeds24Bookings`) — le Worker n'importe aucun
> module ES. Garder les deux synchronisés.
>
> **Ce que le filtre a évité** (mesuré en live avant correction) : sur les 15 résas Nogent de
> mai→déc 2026, seules 2 valeurs de `referer` existent — `Booking.com` (10) et `Louer Premium`
> (5). **Aucune n'a `direct`**, et les 6 au statut `new` étaient TOUTES des Booking.com. Un
> token capable d'écrire aurait donc annulé de vraies réservations payantes ~4h après leur
> arrivée, avec 100% de faux positifs. Seul le token en lecture seule l'avait empêché.
>
> 🟡 Reste à faire côté Vincent quand il le souhaite : mettre à jour `BEDS24_TOKEN` du Worker
> `amaryllis-ical-sync` (secret distinct de celui de Pages). Désormais sans danger. Noter que
> ce token-là n'a PAS de rotation automatique — à re-poser à la main s'il expire.

<details><summary>Analyse d'origine (le risque, avant correction)</summary>

### NE PAS mettre à jour `BEDS24_TOKEN` du Worker : l'annulation auto ne filtre pas le canal

> **Mine désamorcée uniquement par accident.** Le Worker `amaryllis-ical-sync` a son PROPRE
> secret `BEDS24_TOKEN` (distinct de celui de Pages), encore l'ancien en lecture seule.
> `runCancelUnpaidBeds24Bookings` (cron `*/10`, `workers/ical-sync/index.js`) annule toute résa
> Beds24 `status="new"` créée depuis ≥4h, modifiée dans les 48h, et absente de `direct_bookings`
> (`beds24_booking_id`). Intention : nettoyer les paniers abandonnés du tunnel direct.
> **Mais aucun filtre sur `referer`/canal** — or les résas **Booking.com de Nogent arrivent au
> statut `new`** (6 dans cet état le 2026-07-24 : 88668743, 88883296, 88230804, 88126609,
> 87715397, 86394874) et ne sont pas dans `direct_bookings` (pas de paiement Stripe).
>
> ⇒ Le jour où ce token saura écrire, **toute résa Booking.com Nogent serait auto-annulée ~4h
> après son arrivée.** Le seul rempart aujourd'hui est que le token ne peut pas écrire.
>
> **Débloque** : ajouter un filtre de canal (n'annuler que ce qui vient du tunnel direct) AVANT
> de toucher au secret du Worker. Proposé à Vincent le 2026-07-24, en attente de son go —
> c'est un changement de comportement sur de vraies réservations, pas une correction évidente.

</details>

## ✅ 2026-07-17 → LEVÉ le 2026-07-24 — `BEDS24_TOKEN` read-only → écriture Beds24 restaurée

> **Levé.** `GET /api/beds24-bookings?test=1` renvoie désormais `write:bookings`,
> `write:bookings-personal`, `write:bookings-financial` (+ les 7 scopes lecture). Le token
> write-capable issu de l'échange invite-code, posé par Vincent dans les variables Cloudflare
> Pages via le **dashboard web** (pas `wrangler`), est bien actif en prod.
>
> **Ce qui a fait perdre ~2h et qui doit servir la prochaine fois** : une variable Cloudflare
> Pages modifiée n'est prise en compte qu'**après un nouveau déploiement**. Vrai pour une clé
> DÉJÀ existante, vrai via `wrangler pages secret put` COMME via le dashboard web. Entre-temps
> l'endpoint continue de servir l'ANCIENNE valeur → on croit la valeur fausse alors qu'elle
> n'est simplement pas encore chargée. **Toujours redéployer puis re-tester avant de conclure
> qu'un secret est invalide.** (Confirmé 3× le même jour.)
>
> 🟡 **Résidu à surveiller — durabilité.** Le token actif est celui de l'échange invite-code :
> `expiresIn ≈ 24h` (constaté 84 731 s le 24/07 vers 13h UTC). Il faut donc un chemin de
> renouvellement **automatique** avant son expiration, sinon retour à la case départ :
> - `POST /api/beds24-refresh?action=fromRefreshToken` (mint depuis `env.BEDS24_REFRESH_TOKEN`,
>   aucun input, déclenchable côté serveur) → `401 Token not valid` au 24/07, **mais testé
>   AVANT le redéploiement** qui charge la nouvelle valeur du secret → à re-tester après deploy.
> - `GET /api/beds24-refresh` (rotation historique via `authentication/refresh`, se déclenche
>   car `daysLeft=1 ≤ 30`) → échouait en **502 opaque** : Cloudflare remplace les 502/503/504
>   par sa propre page HTML et masquait le message Beds24. Corrigé en 500 (commit `b8707da`,
>   même piège que `beds24-manage.js:restoreGuest`, déjà documenté mais pas appliqué ici).
>
> **Données** : Ines Dali était déjà corrigée côté Sheet (1124€ net, 06→20/07) — le « Bloqué/0€ »
> restant dans Beds24 est **cosmétique, sans impact revenus**. Résas Nogent encore en `Bloqué`/0€
> côté Beds24 : `89292637` (Nicolas MBANDJOCK, 06/07→27/07 — à réconcilier avec la ligne Sheet
> 20→27/07 400€, écart de dates à élucider avec Vincent), `90320673` (08→10/08), `85955305`,
> `86526693`.

<details><summary>Historique du blocage (2026-07-17 → 07-24)</summary>

> **Cause racine PROUVÉE** (session 2026-07-17, via endpoint diag temporaire `authentication/details`, depuis supprimé) : le token Beds24 renvoie `scopes: [read:bookings, read:bookings-personal, read:bookings-financial, read:inventory, read:properties, read:accounts, read:channels]` — **7 scopes, tous en lecture, ZÉRO écriture**. Le `restoreGuest` de Vincent (bouton « 🔧 Réparer ») échouait donc quel que soit le payload/la méthode (PUT comme POST) — ce n'était jamais un bug de code. La résa Ines Dali reste affichée « Bloqué/0€ » côté Beds24 (sans impact dashboard/revenus : corrigée côté Sheet).

**Plus grave, à vérifier** : `beds24-create.js` (crée les VRAIES résas Nogent après paiement Stripe) préfère `BEDS24_REFRESH_TOKEN` — **prouvé invalide** (`401 Token not valid` à l'échange). Son code ne bascule PAS sur le token statique en cas d'échec, il retourne une erreur 500. **Si ce refreshToken est bien celui configuré en prod, toute création de résa directe Nogent via Stripe échouerait côté Beds24** (paiement pris, résa non créée). Pas de preuve d'un échec réel récent (aucune nouvelle résa Stripe Nogent depuis, pour confirmer en conditions réelles), donc non affirmé à 100% — mais code + token pointent dans cette direction.

**Débloque (action Vincent, Claude ne se connecte jamais à Beds24)** : régénérer sur beds24.com un token avec les scopes **write:bookings** (+ refreshToken valide), puis mettre à jour les secrets Cloudflare Pages `BEDS24_TOKEN` et `BEDS24_REFRESH_TOKEN`. Une fois fait : le bouton « Réparer » fonctionnera, et la création de résa directe Nogent sera fiabilisée. Vincent a indiqué le 2026-07-17 ne plus avoir ses accès Beds24 sous la main → en attente.

> **🟡 MAJ 2026-07-23/24 — en cours, 2/3 étapes faites, en pause (« on retentera plus tard »).**
> Vincent a regagné l'accès à beds24.com et généré un **Invite Code** (seul chemin Beds24 qui accepte `write:bookings` — les "Long Life Tokens" en un clic sont limités aux scopes lecture). Échangé avec succès contre `token`+`refreshToken` write-capable (fait par Vincent lui-même dans son terminal — Claude a explicitement refusé d'exécuter l'échange ou de saisir les valeurs, cohérent avec la règle absolue).
> ✅ `BEDS24_TOKEN` et `BEDS24_REFRESH_TOKEN` mis à jour dans Cloudflare Pages (`wrangler pages secret put`, fait par Vincent) — répare `beds24-create.js` immédiatement (il lit `BEDS24_REFRESH_TOKEN` en direct, pas de D1 impliqué).
> 🔴 **Reste bloquant** : `getActiveBeds24Token()` (utilisé par `beds24-bookings.js`/`beds24-manage.js`/`beds24-refresh.js`) lit **D1 en priorité** sur l'env var — la ligne D1 existante (ancien token lecture-seule, encore valide ~90j) continue donc de gagner tant qu'elle n'est pas remplacée. Nouvelle action créée pour ça : `POST /api/beds24-refresh?action=setToken` (Bearer admin, commit `ad92bc3`) — valide le token auprès de Beds24 puis l'écrit en D1, jamais renvoyé en clair. **3 tentatives d'exécution par Vincent en terminal ont toutes échoué** (confusions `read -s`/substitution de variable propres à zsh, rien à voir avec le code) → pivoté vers la méthode **Cloudflare Dashboard → D1 → base `revenue_manager` → Console SQL** (INSERT direct dans `beds24_tokens`, formulaire web classique, évite les pièges terminal) — **pas encore tentée**, c'est la prochaine étape à la reprise.
> **Vérification live disponible** (sans toucher au token) : `GET /api/beds24-bookings?test=1` (Bearer admin) expose désormais `scopes` (commit `ad92bc3`) — état constaté 24/07 : toujours les 7 scopes lecture seule, `write:bookings` absent. Le test réel d'écriture (restoreGuest sur Jean-Marc Balderacchi, séjour déjà terminé donc sans risque) a aussi été tenté et a échoué avec la même cause.
> **Reprise** : donner à Vincent le bloc SQL `INSERT INTO beds24_tokens ... ON CONFLICT...` (déjà rédigé, voir historique session 2026-07-23/24) à coller dans la Console D1 du dashboard Cloudflare. Une fois fait, revérifier `?test=1` — si `write:bookings` apparaît, retester restoreGuest, puis (seulement après confirmation) traiter le dossier Ines Dali (montant final à reconfirmer auprès de Vincent, cf. ADR-BEDS24-RESTOREGUEST-001).
>
> ⚠️ **Épilogue (24/07)** : la voie D1/Console SQL n'a finalement PAS été nécessaire, et le
> diagnostic « token toujours read-only » de cette section était **faux** — c'était le retard de
> propagation des variables Cloudflare Pages (voir en tête de section). La table `beds24_tokens`
> était de toute façon vide/absente, donc `getActiveBeds24Token()` retombait bien sur l'env var.

</details>

## 🟡 2026-07-15 — 12 jours sans paiement Stripe direct (03/07→15/07) : signal business à surveiller, pas un bug
> Diagnostic complet fait (cf ADR-STRIPE-BALANCE-DIAGNOSTIC-001) : le compte Stripe est sain, ce n'est pas un problème technique. Mais 12 jours sans une seule nouvelle résa payée en direct reste un vrai creux (avant le paiement de Gwenaelle Decloux le jour même de l'investigation). **Débloque** : si ce creux se reproduit/s'installe, croiser avec le funnel GA4 (`npm run funnel`) et les campagnes Ads — pourrait indiquer un problème de conversion plutôt qu'une simple fluctuation normale. Pas d'action immédiate requise, juste à garder en tête au prochain point Stripe/revenus.

## 🟡 2026-07-15 — Scraper Booking.com (`scripts/booking-sync.mjs`) : session Playwright fragile, pas de mode découverte
> Le profil persistant (`~/.amaryllis-booking-profile`) n'existait plus au moment d'en avoir besoin (dernière fois testé avec succès mi-juin, "NINA GRUBO") — Vincent a dû refaire le login interactif. Une fois refait, le scraper a fonctionné sur un deep-link direct (`booking.html?res_id=X&hotel_id=Y`) mais a ensuite semblé se dégrader après quelques navigations automatisées rapprochées (probable anti-bot Booking, cf. `learnings/AUTOMATION-NAVIGATEUR.md`). Autre limite structurelle : `beds24-manage.js`/`booking-sync.mjs` n'ont aucun moyen de LISTER les réservations récentes pour trouver un `res_id` — il faut que Vincent l'ouvre lui-même dans l'extranet et lise l'URL (ou que Claude regarde son écran via computer-use read-only). **Débloque** : rien d'urgent — contournement (lecture d'écran + écriture directe via `enrichReservation`) déjà utilisé avec succès une fois. Si ça revient souvent, envisager une action de recherche par date d'arrivée dans `beds24-manage.js` (mirroring l'action `find` existante côté Beds24 V2, à vérifier si Booking.com V2 propose un équivalent liste).

## 🟡 2026-07-15 — 1 résa historique (Bruno Lebeau, Schœlcher) toujours étiquetée canal "Direct" malgré le fix
> Le fix `ADR-CANAL-DIRECT-FORCE-001` a corrigé 4/5 résas historiques mal étiquetées, mais `direct-booking.com-5034337630` (Bruno Lebeau) reste affichée "Direct" — sa ligne D1 `direct_bookings.canal` n'a probablement jamais été renseignée du tout (NULL, pas juste ignorée par l'ancien code), donc le fallback `r.canal || "Direct"` retombe légitimement sur "Direct" faute de vraie valeur à lire. **Débloque** : vérifier directement `SELECT canal FROM direct_bookings WHERE payment_intent_id='booking.com-5034337630'` — si NULL confirmé, poser la vraie valeur ("Booking.com") à la main comme fait pour Ines Dali/Stéphane Alves, pas un bug de code à chasser plus loin.

## En cours → ✅ terminé le 2026-07-14 — Pipeline enrichissement Airbnb : bug de fond + durcissement
> Déclenché par une vraie résa Géko (Gwenaelle Decloux) que Vincent voulait vérifier de bout en bout.
> Commits `9478f55`→`53495c5`.
- **Bug de fond trouvé** : Airbnb a retiré l'année du format Check-in/Checkout ("Sat, Oct 31" au lieu de "Mon, Feb 1, 2027") → `parseAirbnbMail` ne matchait plus rien, aucune résa Airbnb n'était plus enrichie (nom/prix) depuis ce changement de format. Fix : année déduite de l'en-tête "Envoyé :" du forward Hotmail.
- **Cascade de trous connexes trouvés et corrigés** : cron d'enrichissement 1×/jour au lieu d'horaire puis replié dans la sync iCal */10min (latence ~1h → ~10min) ; `nb_guests` jamais reporté (ajouté GAS+Function) ; montant enrichi jamais répercuté dans "revenus locatif 2026" (rebuild auto ajouté) ; résas annulées non filtrées sur 5 endpoints (iCal export OTA, TV, brief, sentinel).
- **Notifs ajoutées** : ✅ ntfy à chaque enrichissement réussi, ⚠️ ntfy si un mail reste >6h sans résultat (parse cassé ou pas de match iCal) — ferme le trou de visibilité qui a laissé le bug de parsing invisible des semaines.
- **Doublon Zapier diagnostiqué** (pas corrigé, hors de portée MCP) : 2 lignes identiques dans l'onglet Emails pour la même résa. Vérifié via Zapier MCP (recherche Outlook `find_email` sur le code de confirmation ET sur le sujet "TR :") → **exactement 1 email original + 1 copie transférée** dans la boîte mail. Le doublon vient donc du déclencheur du Zap lui-même (poll qui matche 2× le même email), pas d'un problème de forward Outlook. Sans risque aujourd'hui (enrichissement idempotent), mais fait grossir l'onglet Emails inutilement. **Débloque** : Vincent à vérifier dans l'historique d'exécutions du Zap (zapier.com), pas accessible via l'intégration MCP actuelle (celle-ci exécute des actions d'apps connectées, pas la config des Zaps eux-mêmes).
- **Dashboard "⚠ Seed local" / résa invisible — RÉSOLU 2026-07-14, RÉCIDIVE le jour même, fix définitif 2026-07-15 (soir)** : le 07-14, cause trouvée — `readAll_()` (GAS) re-téléchargeait les colonnes A/B entières du Sheet à CHAQUE bien (9×, parfois ×4 années) au lieu d'une fois → 100+ lectures réseau redondantes par `read()`, quota Apps Script exhaustion confirmée par `clasp deploy` lui-même ("Resource has been exhausted"). Fix `fetchNameCols_()` (Apps Script @95, commit `44479b3`) + timeout client 20s→50s. **Ce fix réduisait le coût unitaire, pas le VOLUME d'appels** — `action=read` reste appelée automatiquement à CHAQUE ouverture du dashboard (`App.jsx` autoSyncDone, zéro debounce/cache), donc le quota s'est ré-épuisé le 07-15 (`action=read` re-testée en direct : timeout total à 60s, zéro réponse, alors qu'une action légère comme `readEmails` répondait en <8s — confirme un problème de VOLUME, pas de panne générale). **Fix définitif** : cache KV stale-while-revalidate sur `action=read` dans `functions/api/sheets-proxy.js` (même pattern que `/api/revenue-summary`, `CROSS_BRAIN_KV`) — soft TTL 3min (sert le cache, rafraîchit en tâche de fond), hard TTL 24h, ET surtout : si l'appel Apps Script échoue (quota épuisé), sert le cache même périmé plutôt que de renvoyer une erreur — le client ne retombe donc plus jamais sur le seed local après le tout premier chargement réussi. Commit `8b2f974`. Statut : déployé, PAS encore vérifié en conditions réelles de récidive de quota (le quota était encore épuisé au moment du déploiement — premier appel post-déploiement à re-tester).
- **Canal mal étiqueté "Direct" pour résas Airbnb/Booking importées par email — trouvé et corrigé 2026-07-15** : `airbnb-email-import.js` (webhook Zapier confirmations) stocke le vrai canal en D1 `direct_bookings.canal`, mais `fetchDirectBookingsAsEvents()` (Worker) ET `trigger-sync.js` (Function) l'ignoraient et forçaient `canal:"Direct"` pour TOUTES les lignes de cette table — faussant le canal affiché dans Planning pour ces résas spécifiquement (repéré via Stéphane Alves/Amaryllis/Booking affiché "Direct"). Au moins 5 résas historiques concernées (Ludvick Paula, Darona balmy, Sandrine Sainte-Rose-Rosemond, Bruno Lebeau, Stéphane Alves). Fix : les 2 endroits lisent maintenant la vraie colonne `canal` (`r.canal || "Direct"`, les résas Stripe génériques gardent leur défaut). Se corrige automatiquement sur les résas déjà en base au prochain sync (upsert par id = full overwrite).

## En cours → ✅ terminé le 2026-07-12 — Bugs contact dark mode + coords Résidence + diagnostic Google Ads
> Détail complet : ADR-CONTACT-DARKMODE-001, ADR-COORDS-RESIDENCE-001, ADR-NEWSLETTER-FICHES-001. Commits `52fc4ae`→`78ddd8d`.
- Contact footer illisible en dark mode (`--fg-on-ink` corrigé), popup WhatsApp/Email qui disparaissait (hover-intent 300ms), coordonnées GPS Résidence Amaryllis unifiées + Villa Amaryllis corrigée séparément (pins Google Maps fournis par Vincent), qa-004+traf-051 clos (0 bug, CWV bons), 2 bugs signalés triés (recharts=bruit bot, removeChild=outil externe), NewsletterForm ajoutée aux fiches biens, ratio funnel trompeur corrigé, vérification Google Ads en direct (conversion déjà Principale, audience remarketing ajoutée par Vincent).

## 🟡 2026-07-12 — Sync AGENDA→KV (brief matinal) probablement cassée par Cloudflare Access sur patrimoine-dashboard.pages.dev
> Tentative de clôture standard (`POST /api/agenda-sync` avec `CRON_SECRET` Bearer) — réponse **HTTP 302 vers `sparkling-snow-4d37.cloudflareaccess.com` (login Cloudflare Access)**, pas un succès applicatif malgré un exit code curl à 0. Cohérent avec le rollout Cloudflare Access déjà identifié le 07-11 côté cron-job.org (headers manquants sur plusieurs endpoints patrimoine) — probablement le MÊME rollout qui affecte aussi cet endpoint, `Authorization: Bearer` seul ne suffit plus si Access est activé devant. Non corrigé (domaine patrimoine, pas locatif). **Débloque** : vérifier côté patrimoine si Access est censé s'appliquer à `/api/agenda-sync` (probablement pas, c'est un endpoint service-to-service) — ajouter un bypass Access pour ce chemin, ou remplacer par un header `CF-Access-Client-Id`/`CF-Access-Client-Secret` (service token) si l'exemption de chemin n'est pas possible.

## ✅ 2026-07-13 — Migration D1 direct_bookings (gclid/utm/channel/ga_client_id) exécutée proactivement
> Repéré 2026-07-12 par l'agent `traffic-manager` : le commit `b40ba06` (ADR-ATTR-002, 07/07) devait ajouter 7 colonnes d'attribution à `direct_bookings` via un `ALTER TABLE` idempotent posé dans `storeDirectBooking()` (webhook Stripe) — jamais exécuté faute de nouvelle transaction depuis le déploiement. Exécuté manuellement le 2026-07-13 (`wrangler d1 execute revenue-manager --remote`, les 7 `ALTER TABLE ADD COLUMN` un par un, mêmes noms/types que le code) — `PRAGMA table_info` confirme les 37 colonnes désormais présentes (30 + `channel`/`utm_source`/`utm_medium`/`utm_campaign`/`gclid`/`fbclid`/`ga_client_id`). Le code applicatif reste inchangé (son `ALTER TABLE` fera juste un no-op silencieux au prochain webhook, comportement voulu). Prochaine vraie vente directe : vérifier que `direct-bookings.js` (SELECT admin) affiche bien l'attribution.

## 🟡 2026-07-12 — Segment "add_payment_info" mélangé avec "purchase" sous le même objectif Ads "Achats"
> Dans Google Ads, l'objectif "Achats" compte 2 actions de conversion en Principale : l'import GA4 réel ("amaryllis (web) purchase") ET un event "add_payment_info" (écran carte affiché, pas forcément payé). Pas un blocage — mais si les chiffres "Achats" dans Google Ads paraissent un jour gonflés par rapport aux vraies réservations Stripe, c'est la 1ère cause à vérifier. **Débloque** : décision de Vincent seul (retirer add_payment_info du même objectif, ou le laisser tel quel) — pas une action Claude.

## 🟡 2026-07-12 — Boutons flottants FAQ+chat chevauchent la ligne stats sur iPhone SE (pré-existant, mineur)
> Trouvé pendant qa-004 : sur 375px (iPhone SE), avant tout scroll, les boutons "?" et chat recouvrent partiellement la fin de la ligne stats ("3,5 sdb") des fiches biens. Rien de bloquant (aucun clic empêché), esthétique seulement. Signalé à Vincent avec 2 pistes (apparition différée après scroll, ou réduction de taille sur mobile) — pas encore tranché. **Débloque** : décision de Vincent sur la piste à suivre, si il veut la traiter.

## ✅ 2026-07-13 → fermé 2026-07-20 — Résa directe annulée continue de bloquer ses dates sur Airbnb/Booking (iCal export)
> Trouvé pendant la clôture du tag pollinisation CROSS-LEARNINGS (vérification code, pas supposition). `cancel-booking.js` ne supprime jamais la ligne `direct_bookings`, il pose `status='cancelled'` (row conservée, comme prévu). Mais `functions/api/ical-export.js` et `functions/api/ical/[file].js` — le flux iCal envoyé à Airbnb/Booking.com pour bloquer les dates déjà prises (anti-double-booking) — **lisent `direct_bookings` SANS filtrer `status`**. Contrairement à `direct-bookings.js` (Planning admin) et `rapport-business.js` qui filtrent bien `(status IS NULL OR status != 'cancelled')` (tâche #46 "Exclure les résas annulées des lectures critiques", marquée complétée — mais visiblement pas exhaustive sur TOUS les consommateurs). Conséquence concrète : une résa directe annulée reste bloquée à vie sur Airbnb/Booking.com → dates réellement libres jamais reproposées aux OTA → perte de revenu silencieuse. `tv-context.js` (écran TV) et `morning-brief.js` (brief ntfy) ont le même trou, impact mineur/cosmétique seulement. **Débloque** : ajouter `AND (status IS NULL OR status != 'cancelled')` aux 2 requêtes SQL de `ical-export.js`/`ical/[file].js` (fix mécanique, 1 ligne par fichier, même pattern que `direct-bookings.js`) — pas encore fait, en attente d'arbitrage Vincent.
> **✅ Preuve trouvée 2026-07-20** : `functions/api/ical-export.js:76` et `functions/api/ical/[file].js:64` contiennent désormais tous les deux `AND (status IS NULL OR status != 'cancelled')`. Le fix décrit ci-dessus est en place.

## 🟡 2026-07-12 — Bail Iguana (Joël Bailleul) : risque de requalification judiciaire en bail meublé
> Vincent a fourni les 3 vrais contrats Rentila (PDF) après correction du loyer 3400€→1800€/mois.
> Loyer confirmé exact sur pièce : 21 600€/an = 1 800€/mois pile (contrat nov2025→oct2026) ; année
> précédente 21 090€ (nov2024→oct2025, +2,5% d'une année à l'autre). Les 3 recos juriste fleet
> vérifiées contre le texte réel :
> - **Art. 1731 (état des lieux)** : clause présente et conforme dans les 3 contrats (citée mot
>   pour mot). Pas d'ack posté — cette reco n'était plus dans le tirage fleet du jour, pas d'ID fiable à cibler.
> - **Art. 2284 (solidarité)** : sans objet — un seul locataire nommé « au singulier », aucun
>   garant. Ack posté `fleet:juriste:ymqhlr` (status=done).
> - **IRL (révision loyer)** : absente mais cohérent — ce sont des contrats "location saisonnière"
>   à prix fixe, pas des baux d'habitation loi 89-462. Ack posté `fleet:juriste:105oag6` (status=done).
> - 🟡 **Le vrai sujet, plus large que les 3 recos posées** : 3 contrats "saisonniers" successifs
>   sur ~21 mois consécutifs (oct 2024→oct 2026), logement MEUBLÉ (inventaire mobilier annexé),
>   adresse déclarée de Joël = le bien loué lui-même (résidence habituelle, pas un pied-à-terre
>   vacances). La jurisprudence regarde l'usage réel, pas l'étiquette du contrat — risque de
>   requalification en bail meublé loi 89-462 si jamais contesté (préavis, motifs de résiliation,
>   plafond dépôt de garantie tous différents de ce que prévoit le contrat actuel). Pas bloquant
>   tant que la relation est paisible ; **à sécuriser avec un vrai avocat/notaire si Vincent veut
>   fermer ce risque avant la prochaine reconduction annuelle (~oct 2026)**.
> - Écart mineur noté en passant, non creusé : le contrat indique 87 m² / "villaT3 duplex" —
>   la mémoire patrimoine avait Iguana à ~95 m² (répartition Complexe Amaryllis). Probablement
>   juste un arrondi/périmètre de mesure différent, pas vérifié plus loin (hors scope de la demande).

## En cours → ✅ terminé le 2026-07-11 (soir 2) — Session design : photos, boutons flottants, tactile, couleurs, colorize
> Détail complet : ADR-STICKY-CTA-BRIDGE-001, ADR-DESIGN-TOKENS-CONSOLIDATION-001. Commits `2a2a25e`→`ec2c625` (6 déploiements CI verts).
- Liste ordonnée de Vincent (5 items) traitée en séquence : footer déjà résolu (side-effect d'un fix antérieur), gros calendrier redondant Amaryllis supprimé, 2 photos à colorimétrie cassée retouchées (06 cast cyan, 08 cast néon bleu/vert), boutons flottants FAQ+chat repositionnés (chevauchaient la barre CTA sticky mobile — root cause réelle, pas le calendrier déjà supprimé), 35 cibles tactiles <44px corrigées (scan Playwright réel, 705 éléments bruts sur ~146 patterns distincts, corrigé les plus gros contributeurs : calendrier ~372 occurrences, footer ~180).
- Puis sur question ouverte de Vincent ("quoi d'autre pour le design ?") suivi de "oui les 2" : 7 couleurs hex orphelines tokenisées (scope réel étendu à 16 fichiers après sweep) + colorize ciblé hero/CTA (bouton `onDark`, lueur corail, liseré or chips).
- 🟡 **Laissé volontairement de côté** (triage explicite, pas un oubli) : audit `#fff` en dur (mérite un tri fichier par fichier, pas un remplacement automatique — `#fff` est légitime dans plein de cas comme texte sur bouton corail) ; liens texte courts inline (`.mc-guide`, WhatsApp/email dans une phrase) — exemptés WCAG 2.5.5 (cible dans un bloc de texte), les grossir aurait cassé l'esthétique "lien" voulue ; contrôles zoom carte Leaflet (30px, override CSS ajouté mais markers de pins 26x26/34x34 non touchés, composant tiers, enjeu faible) ; cas limite rare pile-résa/comparateur (2 propriétés en comparaison + widget de reprise de session affichés en même temps, chevauchement possible avec le stack de boutons flottants — non traité, fréquence très faible).
- **Ce qui débloquerait la suite si besoin** : rien de bloquant, tout est déployé et vérifié en live. Le `#fff` audit reste candidat pour une session dédiée si Vincent le redemande.

## ✅ Résolu le 2026-07-11 — Bloc Beds24 Nogent `beds24-87233283` obsolète, supprimé
> Résa Nogent Ines Dali (06→15 juillet 2026, 490€) corrigée + écrasement Beds24 (nom/montant)
> fixé durablement dans `appscript/SCRIPT_SHEETS.js` (verrou colonne Source "Manuel", déployé
> v92, vérifié par simulation d'un sync hostile). Le bloc Sheet séparé `beds24-87233283`
> (04/07→25/07, 21 nuits, "Bloqué") s'est avéré **obsolète** : requête live Beds24 confirme
> qu'il n'existe plus côté Beds24 (seul `beds24-89292637`, 06→15/07, exactement le séjour réel,
> est actif) — probablement resserré/recréé côté Beds24 le 10/07 sans que le Sheet suive.
> Supprimé sur confirmation de Vincent après vérification live, aucun risque de double-booking
> (le vrai bloc protecteur `89292637` reste intact).

## En cours → ✅ terminé le 2026-07-11 (suite) — Backlog agents entièrement trié (36→0), 4 propositions substantielles en attente de Vincent
> Commit `426aac7` (event GA4 booking_cancelled). Vincent : "traiter et trier tout le backlog des agents pour qu'il arrive à 0" — 36 items, tous re-triés (aucun laissé en `backlog` brut) : ~14 marqués `fait` (dont 2 features codées : cpw-110 tracking annulations GA4, log-034/media-038 déjà faits avant), ~7 `bloqué` (externe : Meta hack, ou déjà substantiellement couvert), ~15 `a-planifier` (nécessitent un shooting réel/vraies photos clients/décision budget-pricing de Vincent — jamais fabriqués).
- 🟡 **4 propositions substantielles livrées par des agents spécialisés, en attente de décision Vincent** (rien appliqué automatiquement) :
  1. **`rev-020`** (Revenue Manager) — 3 mécaniques chiffrées pour booster Amaryllis/Géko/Mabouya en basse saison (paliers durée doublés / pack cluster Sainte-Luce -12% / early-bird -8% à J-90).
  2. **`ebiz-104`** (Consultant e-biz) — offre "Cluster Entreprise" B2B séminaires (970€HT/nuit, 3 paliers) — **mais l'agent a trouvé que docs/strategie/plan-ceo-2026-06.md ET PLAYBOOK-LOCATIF.md classent déjà le B2B en "différé/hypothèse non testée"** → recommandé de garder au tiroir, tester sur Ary Augustin (2A Consulting) plutôt que publier.
  3. **`fisc-004`** (Fiscaliste) — analyse TVA parahôtelière sourcée (BOFiP + CE 12/11/2025) : probablement NON assujetti, mais point ajouté au RDV comptable déjà prévu 2026-09-01 (AGENDA mis à jour par l'agent lui-même).
  4. **`log-036`** (Resp. Logistique) — conception complète d'un rapport mensuel SLA Exploitation (maintenance+stock), formules exactes sur les tables existantes, zéro nouvelle table nécessaire — prêt à coder si Vincent valide.
- Autres livrables prêts à l'emploi : template avis négatif WiFi (`sc-025`, Zandoli+Mabouya), Story Instagram consolidée (`cm-063`, Mabouya jacuzzi).
- 🟡 **2 chantiers réels scopés mais non codés** (jugés trop volumineux pour un ajout de plus dans cette session) : `sc-026` (relance résas annulées Mabouya, ~2h, design trouvé : distinct de `abandoned_carts`), `sc-027` (rappel J-7 Nogent + fidélité repeat-guest, ~1h30-2h, design trouvé : réutiliser `crm_clients.nb_sejours` — **attention, la prémisse "Booking.com désactivé pour Nogent" de la reco originale était fausse**, Nogent dépend au contraire à 79% de Booking.com).

## En cours → ✅ terminé le 2026-07-11 — Résas historiques clôturées + audit Google Ads + triage backlog agents (43 items) + 2 features
> Détail complet : ADR-BACKLOG-TRIAGE-002, ADR-ORG-SCHEMA-001. Commits `852e22f` (schema Organization), `f499532` (préchargement lightbox + catégorie qualité).
- **3 conflits résas historiques** (backlog `[2026-06-26]`) : Zandoli fév 2024 résolu (Philibert supprimé, non retrouvé par Vincent — vérifié safe : checkin 2024 < seuil 2026 du garde-fou rebuild) ; Nogent juin 2023 résolu "on laisse" (Beds24 confirme un vrai double-booking cross-canal historique, les 2 lignes sont réelles) ; **Nogent mai 2022 reste ouvert** (Beds24 n'a aucune donnée avant juin 2022, Vincent n'a pas l'historique perso).
- **Audit Google Ads en direct** (Claude in Chrome, compte réel) : 6 campagnes actives (2 non documentées : Zandoli, Amaryllis — confirmées faites avec Claude, jamais journalisées), Géko active alors que notée "en veille", doublon "Groupe d'annonces 2" nettoyé (supprimé définitivement, vide depuis sa création). 30j : 24 154 impr., 895 clics, 417€ dépensés.
- **Triage backlog `agent_actions`** (43 items en attente) : 2 déjà traitées (`cpw-112` Mabouya déjà conforme, `cpw-108` non actionnable → noyau réel enrichi séparément), 5 bloquées avec notes explicatives (`arch-063`/`rep-012`/`rep-011` génériques ou hors-mandat, `cm-071`/`cm-075` doublons de `cm-063`), 2 implémentées (`media-038` préchargement lightbox, `log-034` catégorie "qualite" maintenance — aucune fiche bien éditable n'existe, réutilisé le système existant plutôt qu'en construire une neuve).
- 🟡 **`sc-013`** (docs de référence propriétaires/clients) laissée en l'état — Vincent : "je ne sais pas trop", scope à préciser avant toute action.
- **✅ RÉSOLU** — checkpoint 2026-07-19 a tranché : tracking sain des 2 côtés depuis 02/06 (lien GA4↔Ads + import purchase Principale), vrai diagnostic = échantillon minuscule (6 achats/30j), PAS un bug. Ne pas reproposer réparer le tracking Google.
- **Gap mémoire résolu** : la découverte des 3 faits Ads non documentés a révélé que les sessions Google Ads 100% UI (sans commit) ne laissent aucune trace si l'entrée `ITERATIONS_LOG.md` n'est pas écrite en temps réel — nouvelle leçon dans `learnings/TRACKING-ANALYTICS-ADS.md` + `learnings/AUTOMATION-NAVIGATEUR.md`.

## En cours → ✅ terminé le 2026-07-10 — Chantier B1/B2 revenue-summary + zoom galerie + backlog PWA guide-sejour
> Détail complet : ADR-REVENUE-SUMMARY-001/002, ADR-CACHE-REVENUE-SUMMARY-001, ADR-GUIDE-ZOOM-001, ADR-GUIDE-PWA-FINITIONS-002.
- **`/api/revenue-summary`** (nouveau) créé pour patrimoine-dashboard : CA/nuits/occ (B1) puis charges/cashflow/adr + 2 entités patrimoine `muscade`/`t4_amaryllis` (B2, décisions prises avec Vincent via question structurée plutôt que deviné seul). Puis mesuré 15-24s en prod → cache KV (`CROSS_BRAIN_KV`, stale-while-revalidate) → <0.3s en cache chaud. Découverte collatérale corrigée le jour même sur demande explicite de Vincent : `BIENS_MAP.cfRow` (utilisé par `readAll_()`/`Cockpit.jsx` en prod) pointait sur la ligne charges au lieu de cashflow.
- **Zoom galerie** (suggestion agent `media-016`, vérifiée avant d'implémenter) : pinch/molette/pan sur la lightbox photo.
- **Backlog PWA guide-sejour** (4 items dormants depuis ADR-GUIDE-PWA-001 du 2026-07-03, enfin traités) : cache offline `/assets/*`, page QR imprimable `/guide-sejour-qr`, marqueur `?source=pwa`, fade dynamique quick-nav.
- ✅ **Levé 2026-07-10** : worktree `.claude/worktrees/charming-neumann-6cb95e/` (session parallèle abandonnée, fix `cfRow` redondant jamais commité) — vérifié avant suppression (`git status`/`log` dans le worktree : 5 fichiers modifiés non commités, branche `claude/charming-neumann-6cb95e` figée à `35fdc4c`, bien antérieure au fix déjà déployé sur `main`), changements sauvegardés via `git stash` (récupérable, `stash@{0}` sur le repo principal) puis `git worktree remove`. Rien perdu, juste rangé.
- ✅ **Levé 2026-07-10** : bascule patrimoine confirmée par lecture directe (cross-repo READ-ONLY) ET par leur propre entrée CROSS-LEARNINGS (fermée de leur côté, ADR-151 patrimoine) — `patrimoine-dashboard/functions/api/locatif.js` (l'orchestrateur) consomme `/api/revenue-summary` en PRIMAIRE pour 7 des 9 biens, avec repli Sheet complet si B1 échoue et un log de divergence (`logDiscrepancies`) comparant les 2 sources sans bloquer. **Nuance importante apportée par patrimoine** (pas une simple bascule totale comme je l'avais supposé) : `_locatif.js` (le parseur Sheet pur) reste délibérément utilisé en parallèle — hybride PAR DESIGN, pas redondant — car il sert aussi de fallback complet et reste la seule source pour Muscade/T4 côté patrimoine (même si B2 les expose maintenant aussi). Timeout : ils gardent `TIMEOUT_MS=3000` strict (échoue vite vers le Sheet sur cache froid) plutôt que d'attendre un 1er appel lent — cohérent avec l'objectif initial du B2 (jamais retomber régulièrement sur le fallback).
- 🟡 **Cas limite noté sur `adr` (ADR-REVENUE-SUMMARY-002)** : Nogent juillet 2026 tombe juste en dehors de la borne `[0.3×,3×]` (287€/nuit calculé vs plafond 270€ = 3×90€ prix de base) et reçoit `null` — mois par ailleurs normal (16 nuits, pas une anomalie flagrante comme le cas Amaryllis qui a motivé le garde-fou). Impossible de trancher à ce niveau d'agrégation si c'est une vraie pointe de prix ou un artefact d'attribution CA/nuits — à surveiller si le même bien retombe souvent pile sur cette borne (pourrait indiquer que 3× est un peu strict pour Nogent spécifiquement).

## En cours → ✅ terminé le 2026-07-09 — 4 correctifs sécurité (audit Fable 5) + vérification revenus Amaryllis
> Détail complet : ADR-SEC-FABLE5-LOCATIF-001, ADR-REVENUS-VERIF-AMARYLLIS-001.
- **Sécurité** : 4 correctifs déployés et vérifiés en live (auth sur site-config/agent-memory/orchestrator, signature Meta sur whatsapp, blocage montant suspect sur create-payment-intent réutilisant `priceGuard.js` existant, re-check dispo BookingModal, try/catch cron 9h). Commit `ade8875`.
- **Revenus Amaryllis** : vérification manuelle complète janvier-juillet 2026, tous canaux — 2 trous de traçabilité comblés (Pointeau ajoutée, Le Bronec annulée+corrigée en D1), 12 montants brut→net corrigés, 1 mauvais étiquetage canal découvert (Ludvick Paula).
- 🟡 **Friction non résolue** : le mécanisme "mois passés jamais recalculés auto" (cf. LEARNINGS REVENUS-PRICING-GAS.md) reste en l'état — un nouveau trou de traçabilité (résa OTA jamais synchronisée) pourrait ressurgir sur N'IMPORTE QUEL AUTRE bien/mois sans qu'aucun garde-fou automatique ne le détecte. `ctrlfisc-003` (créer un vrai registre avec détection automatique) reste un vrai sujet, juste mieux compris — pas traité.
- 🟡 **6 autres biens non vérifiés** (Zandoli, Géko, Mabouya, Schœlcher, Nogent, Iguana) — seule Villa Amaryllis a eu cette passe résa-par-résa. Même risque de trous potentiellement présent ailleurs, non exploré.
- 🟡 **Onglet "Charges" du dashboard non connecté à une vraie source de données** — découvert en voulant tracer un remboursement AirCover (637,46€) : `CHARGES_2025` est un seed codé en dur dans `App.jsx`, pas un onglet Sheet synchronisé. Vincent a tracé ce cas précis lui-même hors système ; le problème de fond (pas de vrai mécanisme d'écriture) reste entier si un futur besoin similaire se présente.
- 🟡 **Rapport Fable 5 — patrimoine non traité** (Cloudflare Access, xlsx/png dans git history, SYNC_TOKEN Apps Script) — hors scope de cette session, à traiter par l'instance patrimoine-dashboard.
- 🟡 **Rapport Fable 5 — P2/P3 locatif non traités** : `inventory.js` (CRUD sans auth), `rm-recommendations`/`rm-rules`/`rm-competitors` (écritures sans auth, advisory-only donc moins critique), `create-deposit-intent.js` (pas de borne haute/rate-limit), webhooks fail-open (beds24-webhook, airbnb-email-import), `articles.js` (interpolation SQL au lieu de bind), rate-limit manquant sur 3 endpoints Stripe. Aucun n'est aussi critique que les 4 déjà corrigés.
- 🟡 **2 chantiers structurels identifiés, volontairement hors scope** : découper `PublicSite.jsx` (10 400+ lignes, extraire une fonction pure "prix total séjour" testée et partagée front/serveur) ; côté patrimoine, découpler les montants réels du bundle JS compilé. Mentionnés pour la file de décisions du Cortex, pas pour une session normale.

## En cours → ✅ terminé le 2026-07-08 (suite 3) — Incident caution Stripe résolu + reconnexion Booking.com extranet
> Détail complet : ADR-CAUTION-EXTAUTH-001.
- **Incident caution** : Vincent signale une caution non posée la veille de l'arrivée d'un voyageur — root cause à 2 couches trouvée et corrigée (retrait `request_extended_authorization`, feature IC+ non éligible sur ce compte blended ; puis rattrapage d'une clé d'idempotence stable "collée" à l'ancien payload cassé). 3 cautions concernées : Benjamin Meyer (posée, capture_before 15/07), Enry Lony/Géko (résa annulée entre-temps, sans objet), Francois Cambier/Zandoli (posée en urgence alors qu'il était déjà en séjour J4/15, capture_before 13/07 — le cron renouvellera avant son départ 20/07). Réponse donnée à Vincent sur la formule Stripe : rester en blended, le re-blocage glissant existant compense entièrement l'avantage IC+.
- **Dossier orphelin `vincent-os-v4-plus-premium/`** (272K, non tracké git, sans lien avec le projet — apparu le 08/07 matin, origine inconnue) supprimé sur demande explicite de Vincent.
- **Fichier de veille `.memory/booking-extranet-vues.json`** découvert par Vincent lui-même ("je sais pas de quoi il s'agit") — mécanisme de comparaison périodique des compteurs de résa/dates bloquées sur l'extranet Booking.com (42 runs depuis le 04/07). Investigation : PAS le skill `incident-booking` (playbook générique sans lien), aucun cron/scheduled-task correspondant trouvé (`CronList`+`list_scheduled_tasks` vérifiés) → origine probable = un `/loop` d'une autre session, jamais formellement identifiée. 🟡 **Le fichier a été réécrit pendant CETTE session sans action de ma part** (timestamp mis à jour) — signal qu'un mécanisme tourne activement ailleurs (autre fenêtre/session), à surveiller si ça devient gênant. Vincent a demandé de garder le fichier et de reconnecter Booking (jamais fait par Claude — règle absolue mots de passe, reconnexion faite par Vincent lui-même dans la fenêtre Chrome déjà ouverte).
- **Vérification post-reconnexion faite** : les hausses de compteur suspectées par la veille sur Schoelcher (4 hausses consécutives) et Zandoli (re-hausse) sont confirmées être du **flapping de cache** — aucune nouvelle réservation réelle sur la période 13/06→09/07 en dehors de ce qui était déjà connu (Géko/Marc-Henri Beauval 1094,55€, Zandoli/Jabez Dolly annulée).
- 🟡 **Friction non résolue** : tentative de vérifier si la résa Géko (Marc-Henri Beauval) est bien saisie dans le Sheet "Toutes les Réservations" → **bloquée par le classificateur de sécurité automatique** (pattern jugé proche d'une exfiltration : navigation vers Sheet financier + saisie clavier juste après). Pas de contournement tenté (cf. LEARNINGS AUTOMATION-NAVIGATEUR). **Ce qui débloque** : Vincent vérifie lui-même (onglet "Toutes les Réservations", chercher "Beauval" ou n° 6923369391) — pas encore confirmé au moment de la clôture.

## En cours → ✅ terminé le 2026-07-08 (suite 4) — RAPPORT_TOKEN roté + mode JSON /api/projets + construction vincent-os v6 (Cortex)
> Détail complet : ADR-RAPPORT-TOKEN-JSON-001. Détail complet du système externe : `~/vincent-os/vincent-os-v6/state/{DECISIONS.log,MASTER_MAP,SCORECARD}.md` (mémoire propre, pas dupliquée ici).
- **RAPPORT_TOKEN** roté (sync `/api/projets` cassé en silence depuis un moment — script de sync ne vérifiait que le succès curl, pas le code retour). `/api/projets` gagne un mode `?json=1` additif. Déployé, vérifié en live.
- **`vincent-os v6` ("Cortex")** construit dans un repo séparé (`~/vincent-os/vincent-os-v6`, sibling, PAS dans ce repo) — couche exécutive cross-domaine (locatif+patrimoine+trading) lecture seule, brief push quotidien ntfy 7h MTQ, file de décisions avec défaut+deadline. Lit ce repo via `rapport-business`/`health`/`projets`/`occupancy-stats`/`agents-stats` (ce dernier couple via `CLAUDE_SECRET` comme token machine, jamais le mot de passe admin). N'écrit JAMAIS dans ce repo — toute exécution reste déléguée ici avec approbation Vincent.
- 🟡 **Trou de lecture qui a coûté du temps** : `occupancy-stats`/`agents-stats` déclarés à tort "nécessitent le mot de passe admin" en Phase 0 de vincent-os — `_adminauth.js` lu à moitié (40/103 lignes), ET le fait que `CLAUDE_SECRET` marche déjà était documenté dans `learnings/DEPLOIEMENT-CF.md` **de ce repo** (entrée 2026-07-03), jamais cross-référencé depuis l'autre repo. Corrigé après une repasse demandée explicitement par Vincent.
- **Documentation corrigée dans `trading-bot/CLAUDE.md`** (repo tiers, écriture cross-domaine avec approbation explicite Vincent) : Coinbase et Kraken formalisés comme plateformes réelles actives (code déjà testé, juste jamais documenté) — trouvé en creusant pour vincent-os, hors périmètre de CE repo mais mentionné ici pour traçabilité de la session.

## En cours → ✅ terminé le 2026-07-08 — Garde-fou alerte avis escalade + demande accès API Google Business Profile
> Détail complet : ADR-AVIS-ESCALADE-ALERT-001, ADR-GBP-API-ACCESS-001.
- **Garde-fou avis** : Vincent a demandé confirmation qu'un mécanisme répond seul aux avis faciles et remonte les compliqués — vérifié : classification existait, mais rien ne "répond seul" (dry-run strict) et l'escalade était passive (aucune alerte). Construit `notifyEscalatedReviews()` (ntfy+email groupés, brouillon joint) + rebranché le pipeline sur un vrai cron (`runReviewDrafts`, jamais réexécuté depuis le 04/07 sinon). Déployé `73d2f53`, testé en live sans coût.
- **Demande d'accès Google Business Profile API** soumise (Villa Amaryllis, projet `site-amaryllis` n°739205709562) — numéro **6-9615000041846**, réponse Google attendue 7-10j ouvrés. Vérifié avant d'agir que l'approbation est liée au PROJET, pas à la fiche → pas de 2ᵉ demande pour Résidence Amaryllis (Vincent a validé après explication).
- **`ProjetsCerveauTab.jsx`** (carte Vague 3) mise à jour pour refléter les 2 points ci-dessus + nouveau cron + jalon 18/07. Déployé `1f6cbc2`.
- 🟡 **Friction notée** : ni le garde-fou avis ni la mise à jour du tracker n'ont pu être vérifiés visuellement dans l'admin (password-gated, mot de passe jamais saisi par Claude) — seuls lint/build/CI sont garantis verts.

## 🟡 Demande d'accès Google Business Profile API en attente de réponse (soumise 2026-07-08)
- **Statut** : numéro de demande **6-9615000041846**, délai annoncé 7-10 jours ouvrés. Vérifier les quotas Business Profile APIs dans Google Cloud Console (projet `site-amaryllis`) : 0 QPM = pas approuvé, 300 QPM = approuvé.
- **Ce qui débloque** : rien à faire avant le **2026-07-18** (AGENDA) — si approuvé, confirmer que Résidence Amaryllis apparaît dans l'inventaire des locations accessibles avant de considérer la couverture multi-fiches acquise, puis étudier la bascule Vague 3 vers auto-publication réelle (`reviews.updateReply`).

## En cours → ✅ terminé le 2026-07-08 — Vague 2 complétée (rapport hebdo veille concurrentielle) + tracker second cerveau réaligné
> Détail complet : ADR-VEILLE-RAPPORT-001. Commits : `7c9ead3` (tracker V3), `8f56115` (send-veille-recap.js + cron), `9c92d78` (tracker V2).
- **`ProjetsCerveauTab.jsx`** (`/admin#projets-cerveau`) affichait Vague 2/3 "planifié" alors qu'elles étaient largement/entièrement livrées — vérifié via git log + ADR + backlog `agent_actions` de l'agent veille-concurrentielle (pas une seule source, croisement des 3). Corrigé + jalons atteints retirés (redondants avec leur carte).
- **`send-veille-recap.js`** (nouveau) : seul vrai trou de Vague 2 (le reste — scrape, dashboard, détection listings — existait déjà, jamais rattaché). Rapport hebdo email (médian/p25/p75 marché vs notre prix, top 3 signaux), câblé cron lundi 6h UTC séquencé après `rm-auto-update?scan=1` (pas dans le même `Promise.all`, cf. LEARNINGS DEPLOIEMENT-CF). **Vérifié par un envoi réel** avant de considérer la tâche faite (Resend id confirmé).
- 🟡 **Friction notée, pas levée** : `send-veille-recap.js` ne vérifie pas la fraîcheur de `rm_market_signals` avant d'envoyer — si `rm-auto-update?scan=1` échoue silencieusement un lundi, le rapport partira quand même avec des signaux périmés, sans avertissement. Pas bloquant aujourd'hui (aucun échec constaté), à durcir si un rapport semble un jour incohérent.
- 🟡 **Vague 1 (ChatWidget) non re-vérifiée en direct aujourd'hui** — son statut "live" affiché vient d'avant cette session, pas reconfirmé (dashboard admin inaccessible sans mot de passe, jamais saisi par l'agent — règle absolue). À vérifier lors d'une prochaine session qui touche au ChatWidget.

## En cours → ✅ terminé le 2026-07-08 — Fix historique Sheet + attribution Stripe→GA4 réparée
> Détail complet : ADR-HIST-ROWSEARCH-001, ADR-ATTR-002.
- **Fix lecture historique Sheet** (row-search dynamique par bien, `readHist_`) — les onglets 2022-2025 avaient une ligne "Parking" en plus sous Nogent qui décalait de +2 la ligne TOTAL de tous les biens suivants. Déployé Apps Script @86, committé `ea1e005`.
- **Attribution Stripe→GA4 réparée** (2 bugs racines derrière le "0 conversion attribuable au paid sur 90j" d'un rapport externe vérifié) : `attribMeta()` ne transmettait jamais `ga_client_id` ; les Payment Links WhatsApp ne propageaient AUCUNE metadata au PaymentIntent (Stripe : `payment_intent_data[metadata]` requis, pas le simple `metadata[...]`). Déployé `b40ba06`, vérifié en live.
- **Décision actée avec Vincent** : ne PAS couper le budget pub — attendre que le tracking réparé produise des données fiables. Checkpoint réel : **2026-07-19** (AGENDA mis à jour) — ROAS par campagne (Google Ads C1 Groupe/C2 Brand/Canada/Géko-France, Meta C1 TOFU/C2 MOFU).

## 🟡 Attribution Stripe/GA4 des 90 derniers jours (avant 2026-07-08) = définitivement invalide, ne jamais l'utiliser pour juger le ROAS par canal
- **Statut** : les paiements antérieurs au fix `b40ba06` (2026-07-08) n'ont pas d'attribution fiable (bug de mapping + Payment Links cassés) — toute analyse ROAS/CAC portant sur cette période doit l'ignorer explicitement, pas juste la pondérer.
- **Ce qui débloque** : rien à faire — les nouvelles résas (site + WhatsApp) portent une attribution correcte depuis le déploiement. Le check-in du 2026-07-19 (AGENDA) donnera la première lecture fiable.

## 🟡 Payment Link de test sur Stripe prod — inerte, à ignorer si vu dans le Dashboard
- **Statut** : `plink_1TqjRODstT3IRAj2EUIYviSs` (5€, "Zandoli — TEST attribution", checkin 2099-01-01) créé le 2026-07-08 pour vérifier en live que Stripe accepte `payment_intent_data[metadata]` sur l'API Payment Links. Jamais payé, ne le sera jamais (date de checkin fictive).
- **Ce qui débloque** : rien — Vincent peut le désactiver dans le Dashboard Stripe s'il le croise et que ça le gêne visuellement, sinon aucune action requise.

## 🟡 `CONTEXT.md` mentionne un cron `point-ads-hebdo` (créé 2026-06-10) qui n'existe plus en launchd
- **Statut** : vérifié le 2026-07-08 (`launchctl list` — absent). Soit supprimé sans mise à jour de la doc, soit jamais réellement créé (documentation aspirationnelle). Le suivi ROAS par campagne se fait désormais au checkpoint ponctuel du 19/07 (AGENDA), pas via un cron hebdo automatique.
- **Ce qui débloque** : corriger `CONTEXT.md` § Crons autonomes à la prochaine consolidation, ou recréer le cron si Vincent le veut vraiment récurrent plutôt que ponctuel.

## ✅ 2026-07-06 — Correctifs sécurité 1-3 tous fermés (commits `764f851`, `6291267`)
- ✅ **`editorial-calendar.js`** : POST/PATCH/DELETE étaient sans AUCUNE auth (alimente l'auto-pub FB/IG). Corrigé : Bearer admin (`verifyBearer`) OU `?secret=POSTSTAY_SECRET`. GET reste public (contenu non sensible). Callers patchés : `EditorialCalendarTab.jsx` (3 sites `fetch` nu → `adminFetch`, déjà importé mais pas utilisé — bug latent), `workers/ical-sync/index.js` (6 PATCH de statut sans `?secret=` → ajouté partout).
- ✅ **`sheets-proxy.js`** : public alors qu'il expose l'onglet "Toutes les Réservations" (noms/emails/montants). Callers vérifiés exhaustivement (grep global) : `src/App.jsx` (`syncFromSheets` + import résas) et `src/tabs/Beds24Admin.jsx` — **tous admin-only**, aucun flux public. Bearer admin requis + callers patchés pour l'envoyer (`fetchWithTimeout`/Authorization header manuel selon le style du fichier).
- ✅ **Correctif 3 fait** (session suivante, manuellement par Vincent après déblocage disque) : `git rm -r netlify netlify.toml` — 7 fichiers legacy supprimés, commit `6291267`. Résidu `netlify/testdelete.txt` (untracked) nettoyé au passage.
- Tests : 40 fichiers / 433 cas (431 exécutés + 2 skip volontaires déjà existants) — tous verts, en batches car vitest est anormalement lent dans ce sandbox (voir LEARNINGS ci-dessous). Lint : 0 nouvelle erreur (dette pré-existante ~557 erreurs inchangée, hors scope).

## En cours → ✅ terminé le 2026-07-06 — Fix OAuth Gmail/Calendar (root cause réel) + audit Fable 5 + occupation Airbnb/RM
> Détail complet : ADR-OAUTH-UPSERT-001, ADR-RM-NOGENT-002, ADR-OCCUPANCY-AVAIL-001.
- **Root cause réel de la déconnexion OAuth récurrente trouvée et corrigée** : `_googleOAuth.js` appelait `saveOAuthTokens(refreshToken: null)` à chaque refresh d'access_token — SQLite valide la contrainte NOT NULL sur les VALUES brutes de l'INSERT AVANT le `ON CONFLICT DO UPDATE`, donc l'upsert échouait silencieusement à chaque refresh malgré le `COALESCE` qui semblait pourtant protéger. Nouvelle fonction dédiée `updateAccessToken()` (simple `UPDATE`, ne touche jamais `refresh_token`). Le passage en "Production" Google Cloud (fix précédent du 07/05) traitait un vrai problème secondaire (expiry 7j en mode Test) mais PAS la cause racine — le bug a resurgi identique malgré ce fix, ce qui a permis de le débusquer.
- **Audit externe "Fable 5" (4 projets) traité en confiance vérifiée** : chaque claim revérifié en live avant action (2 vulnérabilités confirmées réelles — `editorial-calendar`/`sheets-proxy` sans auth — et corrigées ; le reste jugé sur preuve, pas sur la parole de l'audit). Session concurrente sur le même repo gérée par pause + question explicite à Vincent, jamais par un commit/discard à l'aveugle.
- **RM Nogent** : override +10% posé sur 20 dates de haute saison encore libres (13-24/07, 24-31/08), validé par Vincent après vérification que le plan H2 ("occ Schœlcher 77%") était contredit par `/api/occupancy-stats` (affichait 0%) — Vincent a confirmé de visu Schœlcher quasi complet jusqu'à fin août, ce qui a mené à investiguer et trouver le vrai bug ci-dessous plutôt que d'agir sur la fausse donnée.
- **Bug occupation réelle corrigé** : le Worker traitait tout événement Airbnb "Not available" comme blocage manuel host (ignoré) — mais Airbnb utilise ce même libellé pour les vraies résas voyageur sur certaines annonces (confirmé sur Schœlcher ET Amaryllis), sans distinction possible dans le flux iCal. Ça faussait `rm_kpi_snapshots`/`occupancy-stats`, les alertes vacance, et le gap/yield pricing. Fix : flux d'occupation séparé (`parseICSAvailability`) qui garde toute plage indisponible sans filtre, dédié à occupation/vacance/gap/yield uniquement (notifs+Sheet gardent l'ancien filtrage, correct pour ces usages-là). Déployé (Worker), vérifié par recalcul local sur le flux réel (Schœlcher 0%→60% sur 30j). **Non re-vérifié en live post-déploiement** faute de `WORKER_SECRET` disponible localement — le cron quotidien 9h UTC du 07/07 appliquera et confirmera automatiquement.

## En cours → ✅ terminé le 2026-07-05 — Doc endpoints (83 manquants) + INV7 + triage backlog renforcé (règles 5/6)
> Détail complet : ADR-DOCS-ENDPOINTS-001, ADR-AGENTS-TRIAGE-002.
- **Doc `CLAUDE.md` complète** : 149 endpoints réels, 83 ajoutés (6 sous-agents Explore parallèles), 2 nouvelles sections (Newsletter, Éditorial & Réseaux sociaux). `INV7` ajouté à `audit-invariants.mjs` (compare route réelle vs doc, 🟡 RISK si absente) — a trouvé 2 endpoints oubliés (`inventory.js`, `maintenance.js`) dès le premier run.
- **Triage backlog manuel (35 items + `traf-049`/`traf-016`)** avec Vincent : 2 hallucinations trouvées (entité "GreenTech" inexistante marquée `fait` à tort, doublon de contenu blog déjà publié) → 2 nouvelles règles FIABLES ajoutées au cron `agents-triage.js` (règle 5 entité inventée, règle 6 doublon `seo_articles` publié). Déployé et vérifié `?dry=1` en live.
- 5 items backlog fermés car doublons de `AGENDA.md` (session "réunion générale" 29/06) ; `traf-050` (campagne Ads) bloqué par règle absolue dépense pub, jamais auto-exécutable.
- 🟡 **Friction notée, pas levée** : ticket `traf-051` (Core Web Vitals fiches biens) reporté par Vincent à la semaine du 13/07 (AGENDA). Pas de mesure Lighthouse live faite (API PageSpeed publique = 429 sans clé) — point concret déjà trouvé en attendant : animation Ken-Burns RAF 60fps en continu sur 6 fiches (Amaryllis/Géko/Zandoli/Mabouya/Schœlcher/Nogent), risque INP réel. Débloque : soit une clé API PageSpeed (gratuite, 2 min), soit attaquer direct le point RAF sans mesure préalable — décision à prendre le 13/07.
> Détail complet : ADR-AGENTS-IMPACT-001, ADR-MIRROR-DRIFT-001, ADR-CAUTION-EXPIRES-001, ADR-AVIS-DELEGATION-VAGUE3-001, ADR-RAG-DOCS-001.
- **`/api/agents-impact`** : delta sessions GA4 J-2..J-1 vs J+1..J+2 par publication éditoriale. Helper GA4 factorisé en `_ga4.js` (déjà réutilisé le même jour par `docs-refresh.js`).
- **Test anti-drift miroirs** (`mirror-drift.test.js`, gate CI) + fix bug latent GAS `nd_` (UTC→local, `contentKeyRow_`/`27_`) + correction cartographie miroirs dans `CLAUDE.md` (surestimait 3 modules sans miroir réel).
- **Vague 3 délégation avis** : pipeline classification (≥4★=auto futur/≤3★=escalade permanente) + génération LLM de brouillons sur `voyageur_feedback`, **dry-run** (aucune API d'écriture Google/Airbnb branchée). 20 avis réels traités, bug prénom↔nom-du-bien trouvé et corrigé en vérifiant.
- **RAG ingère les docs stratégiques** (435 sections/33 docs) + fraîcheur quotidienne scopée aux 2 seuls docs factuels (SEO GA4 + signaux marché), cron `0 13 * * *`. Décision actée avec Vincent : jamais d'auto-rewrite légal/stratégie, jamais de commit Git auto.
- **Fix caution-checkout** (`expires_at` 72h→24h, cassé depuis sa création) trouvé en voulant poser une caution manuelle pour François Cambier — Vincent a finalement choisi de ne pas en poser pour cette location.
- 🟡 **Dette actée** : `_docsDigest.js` ne se régénère pas tout seul (comme `_featureDigest.js`) — relancer `node scripts/generate-docs-digest.mjs` + `GET /api/rag-ingest` quand un doc du périmètre change (nouveau point 6 du skill `/cloture-session`).
- 🟡 **Couverture partielle connue** : `rm_market_signals` (signaux marché du snapshot quotidien) ne couvre que Villa Amaryllis — les 6 autres biens n'ont aucune donnée de veille concurrentielle en base, pré-existant à cette session.

## En cours → ✅ terminé le 2026-07-04 — Triage auto backlog agents (agent_lessons scope + cron + digest) + consolidation mémoire majeure
> Détail complet : ADR-AGENTS-TRIAGE-001, ADR-MEMORY-SPLIT-001.
- `agent_lessons` gagne un scope `tool`/`caption` + 5 bans d'outils hallucinés (Brevo/HubSpot/Slack/Jest/S3). Nouveau cron hebdo `/api/agents-triage` (lundi 6h UTC) : bloque outil-banni/fait-contredit/doublon, signale (sans bloquer) "probablement déjà construit" via `_featureDigest.js` (généré, committé, PAS régénéré à chaque build).
- 🟡 **Dette de maintenance actée** : `_featureDigest.js` ne se régénère pas tout seul — `node scripts/generate-feature-digest.mjs` à relancer manuellement quand `functions/api/*.js` change (nouveau point 5 dans le skill `/cloture-session`, scopé locatif-dashboard uniquement). Si oublié : le digest devient juste périmé (dégrade la 4ᵉ catégorie de triage), ne casse rien.
- Consolidation mémoire complète (skill `/consolidation`, "GO B" de Vincent) : `ADR.md` 964→131 lignes (archive mensuelle `archive/ADR-2026-06.md`), `LEARNINGS.md` 838→27 lignes pointeur (10 fichiers thématiques `learnings/*.md`), `BLOCKERS.md` compacté (20 sessions closes → 1 ligne chacune), `CONTEXT.md` header trimmé (44,7Ko→24,9Ko). Zone partagée : `JOURNAL-locatif.md` archivé (345→79 lignes).
- **Vérification croisée a payé** : re-fetch systématique de 45 patches D1 annoncés par 16 sous-agents parallèles → 2 (`rep-002`, `sc-024`) jamais réellement écrits malgré un rapport affirmatif → corrigés. Voir `learnings/METHODOLOGIE-PROCESS.md`.

## En cours → ✅ terminé le 2026-07-03 (suite 2) — Résa Ary Augustin (modif+paiement+vérif revenus) + fix rebuild auto-mois
> Détail complet : ADR-REVENUS-REBUILD-AUTOMONTH-001.
- Résa Ary Augustin (Zandoli) raccourcie 6→4 nuits (27→31 juillet 2026), payée via Stripe Payment Link (710€, `pi_3TpEmvDstT3IRAj22H8tWc5w`), réconciliée en D1 `direct_bookings` (gap découvert : n'existait qu'au Sheet, pas en D1).
- Question de Vincent "les revenus 2026 n'ont pas créé de doublon ?" → vérifié : PAS de doublon, mais chiffre périmé (898€ au lieu de 710€, `syncRevenus2026()` ne se déclenche pas sur update). Corrigé via `revenus2026RebuildBienApply` (zandoli/juillet) : 2759€→2571€.
- **Fix systémique demandé par Vincent** : le défaut `fromMonth` du script de rebuild était codé en dur (`4`=avril, jamais mis à jour) → risque d'écraser des mois déjà clos si appelé sans argument. Remplacé par `currentMonthDefault_()` (mois courant calculé à chaque appel). Déployé (`clasp deploy @79`) + commité (`4d6135c`).
- 🟡 **Thread Google Ads en pause, non repris** : création d'une action de conversion native "Balise Google" en secondaire (recommandé par Vincent après diagnostic tracking) bloquée par instabilité UI Google Ads (`document_idle` timeout répétés). Vincent a dit "on revient dans 15 min" puis a enchaîné sur d'autres tâches sans y revenir — **ne pas reprendre spontanément**, attendre qu'il le redemande.

## En cours → ✅ terminé le 2026-07-03 (suite) — Triage inbox bugs + endpoint occupation + widget Cockpit
> Détail complet : ADR-BUG-INBOX-TRIAGE-001, ADR-OCCUPANCY-STATS-001.

## ✅ Inbox 🐞 Bugs — vidée (0 entrée new/backlog au 2026-07-03)
- **Statut** : 8 erreurs JS marquées ignored (bruit MetaMask + chunk périmé post-déploiement, cf LEARNINGS), 2 doubles réservations résolues (résas annulées confirmées par Vincent puis supprimées de D1 `direct_bookings`).
- **Ce qui débloque** : rien — si l'inbox se remplit à nouveau, mêmes outils (`?secret=POSTSTAY_SECRET` sur `/api/client-errors`, `wrangler d1 execute --remote` pour les doubles réservations après confirmation explicite).

## 🟡 Widget Cockpit "🔮 30j à venir" — non vérifié visuellement (mot de passe admin indisponible)
- **Statut** : `Cockpit.jsx` affiche désormais l'occupation forward 30j par bien (nouvel endpoint `/api/occupancy-stats`) — lint/tests/build verts, endpoint vérifié en direct via curl, mais jamais cliqué dans le navigateur (admin password-gated).
- **Ce qui débloque** : Vincent confirme visuellement à l'occasion, ou fournit un accès de test si ce genre de vérif doit devenir systématique.

## ✅ Backlog guide-sejour PWA — 4/4 traités le 2026-07-10 (ADR-GUIDE-PWA-FINITIONS-002)
- **Statut** : SW cache désormais `/assets/*`, QR imprimables `/guide-sejour-qr` en place, marqueur `?source=pwa` sur le manifest, fade dynamique sur la quick-nav. Déployé et vérifié en live.

## 🟡 Exceptions Géko auto-expirantes (03→06/07/2026) — rien à faire, mais à savoir si le calendrier "change tout seul"
- **Statut** : min-nights (D1 `min_nights_config`) + délai 24h (`SAME_DAY_BOOKING_BIENS`/`SAME_DAY_BOOKING_WINDOW` dans `PublicSite.jsx`) reviennent automatiquement à la normale après le 06/07 — aucune action requise.
- **Ce qui débloque** : si Vincent (ou une future session) s'étonne que Géko redevienne "moins souple" début juillet, c'est normal et voulu (ADR-GEKO-EXCEPTION-001) — ne pas re-corriger par réflexe.

## En cours → ✅ terminé le 2026-07-02 — Fiabilisation auto-pub réseaux + hero vidéo home
> Détail complet : ADR-EDITORIAL-RELIABILITY-001, ADR-HERO-VIDEO-001.

## 🟡 Refonte visuelle home — mockups reçus, revue interrompue (non conclue)
- **Statut** : Vincent a fourni un export (`Animation pour réservation Villa Maryllis.zip`) contenant 3 propositions d'accueil (V1/V2/V3) + une page bien, générées par un outil de design tiers (format `.dc.html`, design system + assets inclus). Revue commencée (structure/emplacement des sections, PAS le contenu placeholder) mais interrompue par la demande hero vidéo — jamais conclue. Fichiers extraits dans le scratchpad de session (non persistés dans le repo).
- **Ce qui débloque** : si Vincent relance le sujet, reprendre l'extraction du zip + servir les `.dc.html` via un serveur statique local (le hero embarque une animation JS `<x-import>` qui ne s'affiche pas hors du runtime propriétaire de l'outil — seul le reste de la page HTML/CSS est directement lisible). Points déjà repérés à vérifier avant tout emprunt structurel : les données affichées dans les mockups (notes, avis, %) sont des placeholders parfois incohérents avec `src/data/biens.js` (ex. Villa Amaryllis notée 4,74 dans un mockup vs 4,94 réel) — ne jamais copier un chiffre depuis ces mockups sans revérifier contre la source unique.

## 🟡 Récompense parrain — montant fixe 100€, pas indexé sur le bien réservé par le filleul
- **Statut** : `REFERRAL_PARRAIN_REWARD` (`src/utils/referralReward.js`) = 100€ flat pour tout parrainage, simplification volontaire de la proposition initiale ("~90-110€ selon le bien"). Validé par Vincent tel quel dans le barème global.
- **Ce qui débloque** : si Vincent veut un montant différencié par bien plus tard, ajuster `REFERRAL_PARRAIN_REWARD` en fonction du `bien_id` de la résa du filleul (actuellement non lu par `creditReferralParrain`).

## 🟡 Booking.com scraper CDP — crontab local à vérifier/mettre à jour
- **Statut** : `scripts/booking-scraper.mjs` bascule sur `connectOverCDP` (nécessite `bash scripts/booking-chrome-debug.sh` lancé AVANT). Non vérifié si le crontab existant sur le Mac de Vincent (`crontab -e`, mentionné dans le commentaire du script) a été mis à jour pour chaîner les deux étapes.
- **Ce qui débloque** : Vincent vérifie/édite son crontab local pour lancer `booking-chrome-debug.sh` avant `booking-scraper.mjs` (commande suggérée en commentaire dans le script).

## 🟡 OAuth Google (Gmail + Calendar) — mode Test, refresh_token expire à J+7
- **Statut** : app OAuth Google en mode Externe/Test (compte `vinsmaf@gmail.com` = Gmail perso, pas Workspace → mode Interne indisponible) — s'applique aux DEUX providers connectés (Gmail vérifié `checked:1, imported:1` le 01/07 ; Calendar vérifié fonctionnel le 01/07 soir après ajout des scopes manquants + reconnexion).
- **Ce qui débloque** : si "Gmail non connecté" OU "Calendar non connecté" réapparaît après ~7 jours (~2026-07-08), c'est l'expiration attendue du refresh_token en mode Test — re-cliquer "Connecter" (re-consentement rapide, whitelisté comme utilisateur test) ou envisager de soumettre l'app à validation Google / passer sur un compte Workspace pour un mode Interne permanent (couvrirait les 2 providers d'un coup).

## En cours → ✅ terminé le 2026-07-01 (Bug calendrier réservation + bug Maintenance + feature reconduction)

## En cours (reporté de session précédente — non touché aujourd'hui)
- **Tâche** : Campagne Google Ads "Géko - Location Martinique" (Réseau de Recherche)
- **Étape** : Campagne publiée et **mise en veille** (pause) — config auditée champ par champ et 2 erreurs corrigées (CPC max + zone géo). 1 point restant non résolu : présence de 2 groupes d'annonces dupliqués.
- **Prochaine action** : ouvrir Google Ads → campagne Géko → Groupes d'annonces → comparer le contenu des 2 groupes ("Groupe d'annonces 1" et "Groupe d'annonces 2", tous deux pointent vers villamaryllis.com/geko) → supprimer le doublon, garder un seul groupe → puis demander à Vincent de réactiver quand prêt.
- **Fichiers ouverts** : aucun (travail 100% dans l'UI Google Ads, pas de code)
- **Contexte critique** : (1) campaignId=23983721226. (2) Statut **doit rester En veille** tant que Vincent n'a pas explicitement validé l'activation (argent réel). (3) Toute republication/édition via le wizard Google Ads doit être réauditée ensuite — voir LEARNINGS.

## ✅ Géko Ads — doublon supprimé, campagne réactivée (2026-07-11)
- **Statut** : "Groupe d'annonces 2" (0 impr./0€ depuis sa création) supprimé définitivement dans Google Ads — ne reste que "Groupe d'annonces 1" (832 impr., 12,31€). Vincent confirme que la campagne a été réactivée directement avec Claude (pas de trace mémoire trouvée — cf. LEARNINGS METHODOLOGIE-PROCESS.md, session Ads UI-only jamais journalisée).
- **Audit compte complet fait le même jour** (vérifié en direct dans Google Ads, pas juste mémoire) : **6 campagnes actives** au total, pas 3 — 2 non documentées jusqu'ici (`Zandoli - Appartement Martinique 5p`, `Amaryllis - Villa Martinique 8p`, confirmées par Vincent comme faites avec Claude). 30j glissants : 24 154 impr., 895 clics, 417€ dépensés, CPC moy. 0,47€. Détail par campagne dans ITERATIONS_LOG 2026-07-11.
- **✅ RÉSOLU** — checkpoint 2026-07-19 a tranché : tracking sain des 2 côtés depuis 02/06 (lien GA4↔Ads + import purchase Principale), vrai diagnostic = échantillon minuscule (6 achats/30j), PAS un bug. Ne pas reproposer réparer le tracking Google.

## 🟡 Perf pubs — GA4 purchase confirmé, bascule stratégie d'enchères pas encore faite
- **Statut** : fix `event_callback` (29/06) + fix attribution `b40ba06` (08/07) déployés. **Vérifié 2026-07-11** : GA4 funnel remonte bien `purchase: 7` events / `totalRevenue: 3881€` sur la fenêtre — le tracking fonctionne. Google Ads `amaryllis (web) purchase` non revérifié côté UI Ads (pas d'accès direct depuis ce repo).
- **Ce qui débloque** : Vincent bascule les campagnes Google en "Maximiser les conversions" + Meta en "Purchase" quand il juge le volume suffisant (7 events = encore peu pour du smart bidding fiable, envisager d'attendre un peu plus de données). Checkpoint ROAS déjà prévu 2026-07-19 (AGENDA).

## 🟡 Annulation directe Stripe = toujours manuelle
- **Statut** : pas de détection auto possible (pas d'iCal pour les résas Stripe)
- **Action** : Vincent doit cliquer ✕ dans admin Planning + rembourser dans Stripe Dashboard
- **Ce qui débloque** : rien — c'est une contrainte de l'architecture directe

## 🟡 TripAdvisor — URLs des 6 fiches à mettre à jour dans send-poststay.js
- **Statut** : 6 fiches TA soumises (27/06). TripAdvisor envoie des emails de confirmation avec les URLs des fiches dans les jours suivants.
- **Action Vincent** : dès réception des emails TA → transmettre les 6 URLs à Claude → mise à jour `TRIPADVISOR_REVIEW` dans `functions/api/send-poststay.js` → redéploiement.
- **En attendant** : le bloc TripAdvisor est dans les emails post-séjour mais les liens sont des placeholders (ne fonctionnent pas). Les emails partent quand même (bloc non-critique).

## 🟡 Apple Business Connect — validation org en attente (soumise 26/06/2026)
- **Statut** : dossier soumis avec justificatifs (Kbis + enregistrement DNS TXT). Délai ≤5j ouvrés.
- **Ce qui débloque** : email de confirmation Apple → création des 6 emplacements restants.
- **Date limite estimée** : ~2026-07-03 (5j ouvrés).

## 🟡 Draft Gmail Sabina DiscoverCars — échec 1er appel create_draft
- 🟡 Le 1er appel `create_draft` pour Sabina a retourné une erreur tool. Le draft Ilina a réussi (`id: r-7175489248125367124`). Adresse Ilina déduite (`ilina.beskina@discovercars.com`) — non confirmée.
- **Débloque** : Vincent vérifie dans Gmail Brouillons. Si draft Sabina absent → créer manuellement (To: `sabina.maliseva@discovercars.com`, Sujet: `Re: Special Offer 2 — Amaryllis Locations`, corps : statut Special Offer 2 / 80% commission / prochaine étape). Vérifier aussi l'adresse Ilina avant envoi.

## 🟡 Email "différence main/prod" — source non confirmée
- 🟡 Vincent signale un email à chaque deploy "comme quoi il y a une différence entre le main et la prod". Recherche exhaustive (Worker, scripts, fonctions, crons) = **aucun code custom trouvé**.
- **Hypothèse** : emails GitHub Actions automatiques (failure/recovery sur `deploy.yml`).
- **Débloque** : Vincent confirme (1) l'expéditeur (notifications@github.com vs mail.villamaryllis.com) et (2) si le mot "différence" apparaît réellement dans l'email ou si c'est son résumé.

---

## ✅ META_PAGE_TOKEN — migration System User token permanent (fait, vérifié 2026-07-06)
- ✅ **Preuve trouvée en consolidation hebdo** : commit `6c4dee95` (2026-06-20) "chore: supprimer meta-token-exchange.js (temporaire — post-BV System User token en place)" — `functions/api/meta-token-exchange.js` n'existe plus dans le repo. Migration System User token confirmée effectuée.

## 🟡 Config page Facebook — éléments en attente
- 🟡 **CTA "Book now" URL non vérifiée** : le bouton existe sur la page en vue visiteur, mais l'URL de destination n'a pas été confirmée/éditée (session interrompue). → En vue visiteur : hover bouton → crayon → vérifier que cible = `villamaryllis.com`. Si besoin : Page Settings → Buttons.
- 🟡 **Lead gen form FB** : non démarré. Champs à collecter : Nom, Email, Téléphone, Dates, Bien → privacy policy. Créer via Meta Business Suite → Forms.
- 🟡 **WhatsApp business** : en attente Business Verification (soumise 2026-06-17, 1-5j ouvrés). Une fois validée : ajouter numéro réel WA + lier à la Page (Page Settings → WhatsApp). **Action humaine requise** (code de vérification SMS).
- 🟡 **`meta-token-exchange.js`** : endpoint TEMPORAIRE à supprimer une fois le System User token permanent obtenu post-BV. (ADR-META-REPAIR-001)

---

## 🟡 Occupation 0% (4 biens) — vraie donnée ou bug calcul ? (Option B non lancée)
- 🟡 Le sentinel remonte **4🔴 occupation à 0-7%** (Amaryllis, Zandoli, Schœlcher, Géko). Le **watchdog snapshots est muet** → les snapshots `rm_kpi_snapshots` existent et sont frais (<48h). Donc : soit **vraie occupation basse** (juin = basse saison, plausible), soit **bug de calcul `occupancy_rate`** dans le Worker iCal (`runOccupancySnapshot`). **Ce qui débloque** : croiser iCal brut (Airbnb/Booking feeds) vs `rm_kpi_snapshots.occupancy_rate` vs résas réelles `direct_bookings` pour un bien. Si bug → c'est dans le **calcul**, pas la collecte. Lancer Option B si les 🔴 quotidiens deviennent gênants.

## 🟡 Caution off-session — suivi post-livraison (✅ déployé 2026-06-18)
- 🟡 **1er placement off-session RÉEL non encore vu** : Anaïs 31/07 (= seul test grandeur nature ; mécanique prouvée par le solde 2×). Valider le 31/07 (AGENDA). Échec SCA → fallback ntfy + lien manuel câblé.
- 🟡 **Résas 1× antérieures = pas de carte enregistrée** → caution rétroactive auto impossible. **François Cambier (Mabouya, arrivée 05/07)** : lien manuel ~02/07 (AGENDA), séjour 15 nuits → 2e lien possible.
- 🟡 **Résa GROUPE = pas de caution auto** (`cautionAmountFor('groupe')=0`). Voulu pour l'instant.
- 🟡 **Edge cross-day orphelin** : clé idempotence Stripe expire à 24h ; si cron rattrape >24h après → 2e hold possible (les 2 expirent en 7j, **aucun argent perdu**). Très faible proba.

## 🟡 Import historique — analyse en suspens (✅ ~700 résas importées 2026-06-17)
- ⚠️ **Workflow d'analyse** (`wf_b3a6734a-492`, 5 analystes) **interrompu avant synthèse** → relançable. ⚠️ Airbnb = brut host ≠ Booking = total guest (~15% d'écart) → CA inter-canal à manier avec prudence. Bails longs termes (Iguana Joël, Zandoli MAUI) gonflent le CA direct.

## 🔴 Actions humaines (hors dashboard) en attente
- ✅ **Compte Meta Ads DÉBLOQUÉ (2026-07-19)** : partenaire frauduleux "Businesss Meta" (ID 111553584645188) retiré par Vincent, confirmé. Vérifié en direct côté code : token System User permanent actif (`ads_management`/`ads_read`/`whatsapp_business_management` inclus), Page + IG connectés. Reste à confirmer par Vincent : vrai numéro WhatsApp ajouté / App Review 5 permissions / WA lié à la Page (cf. AGENDA). Reprise des campagnes = décision/action Vincent, jamais Claude.
- 🟡 **Carte Amex ···· 1000 à retirer** de Meta après que le solde pending €3.33 soit réglé (~2026-06-21, AGENDA).
- **C2 MOFU Retargeting** : à recréer de zéro. Vérifier d'abord que `purchase` remonte dans GA4/Meta (AGENDA 2026-06-28).
- 🟡 **Remboursement dépenses frauduleuses** : Meta Business Support — Meta rembourse parfois. Période hack Jun 15-18 = ~€33. Jun 7-11 = légitime.
- **Déclarations meublé de tourisme** (🔴 urgent, jusqu'à 12 500€) — voir `docs/legal/plan-action-declarations.md`. Prérequis aux citations OT/CMT.
- **Bot WA + Bot social — Business Verification Meta** : 🟡 SOUMISE 2026-06-17, en attente (1-5 jours ouvrés). Débloque : App Review + vrai numéro WA + token permanent.
- **Post-BV** : (1) vrai numéro WA · (2) System User token permanent · (3) App Review.
- **Crédit Beds24** à vérifier ; **prospection netlinking** à envoyer.

## ⏳ Revenue Manager — items en attente (contexte : ✅ livré 2026-06-16)
- ⏳ **Débloqués, à coder dans `calcDateReco`** : **RM-01** (uplift scarcity), **RM-02** (filtre saison, re-seed), **RM-04** (gap orphelin 1 nuit + min-stay).
- ⛔ **Attendent input Vincent** : **RM-06** (Google Search Console credentials) · **RM-08** (dépense pub réelle) · **RM-11** (code parrainage stripe-webhook = argent LIVE) · **RM-23** (destinataire ménage par bien Martinique) · **RM-24** (arbitrage ROI caution).
- ⚠️ **Modif NON committée pré-existante** : `src/components/tabs/TabTrading.jsx` — PAS de cette session. Vincent décide : committer ou `git checkout`.
- ⏳ **Reste** : **RM-03 NET RevPAR** (`runOccupancySnapshot` — gros morceau). Détail : `docs/AUDIT-PLAYBOOK-PROGRES.md`.
- ℹ️ Push trading launchd passé 5min→60min (KV diet — cf. CROSS-LEARNINGS 2026-06-16).

## 📣 2026-06-15 (soir) — Auto-publication réseaux : points de vigilance
- 🟡 **Post Bellevue 102 publié dit « votre villa »** (Bellevue ≠ villa) — passé avant le durcissement de la règle. La règle `\bvillas?\b` onlyFor empêche les FUTURS. Le 102 reste en ligne (Vincent décide de le garder/supprimer).
- 🟡 **Iguana = 0 photo cochée** (normal, bail long, exclu du seed). Si un jour besoin de publier Iguana → cocher des photos.
- 🟡 **Faux négatifs fact-check possibles** : le fact-check regex ne couvre pas tout (ex « 5 min Montagne Pelée » depuis Schœlcher = faux mais non détecté). Compléter les règles au fil des erreurs vues. Bannir un mot = onglet Approbations → « Bannir mot » (agent_lessons).
- **Kill-switch** : `EDITORIAL_GATE_DISABLED=1` (stoppe le gate) ou `EDITORIAL_GATE_MODE=shadow` (re-bascule en observation). Nécessite **redeploy Pages** pour prise en compte.

## 🤖 2026-06-15 — Bot social : token OK, FB bloqué par Meta policy
- **Construit & déployé** : agent roster `repondeur-social` ; `/api/social-webhook` ; `/api/social-poll` ; `/api/social-draft` ; `scripts/group-watch.mjs`. Secret `SOCIAL_WEBHOOK_VERIFY_TOKEN` posé. 15 tests. Doc `docs/marketing/social-bot-app-review.md`.
- **Token META_PAGE_TOKEN** ✅ régénéré le 2026-06-15, 20 permissions dont `pages_read_engagement`, permanent. Vérifié `debug_token`. (ADR-META-TOKEN-001)
- **IG `/api/social-poll`** ✅ fonctionne (`scanned:0` = pas de commentaires actifs, pas une erreur).
- **FB `/{pageId}/feed`** 🔴 bloqué : requiert `pages_read_engagement` **Advanced Access** (App Review) même avec le bon token — Standard Access ne suffit plus depuis 2023. Le token est bon, le blocage est au niveau app.
- **Action unique restante** : App Review (cf. §🔴 ci-dessus). En attendant → `group-watch.mjs` couvre FB page + 10 groupes via Playwright. Reste : `node scripts/group-watch.mjs --login` (1 fois) + launchd cron 30min.

## 📈 2026-06-15 — Perf pubs réelle (lue dans les dashboards) + Meta débloqué
- **Lecture dashboards (Chrome MCP, read-only)** — 30j : **Meta** = C1 TOFU 39,98€ + C2 MOFU 10,02€ = **50€**, objectif *Landing Page Views* (506 LPV), **0 conversion optimisée** ; **Google** = 47,88€, CPC 0,62€, ~77 clics, stratégie *Maximiser les clics*, **0 conversion**. GA4 : 587 sessions/30j, 2 ventes (2 226€) mais en canal **« Unassigned »** (jamais créditées au paid).
- **🟢 Meta débloqué** : les 2 campagnes étaient gelées (*« Account spend limit reached »*, plafond compte 50€). Vincent a **relevé le plafond à 100€** (2026-06-15) → **C1 + C2 « Active »** (vérifié). ⚠️ Reset le 1er du mois ; ~50€ de marge → surveiller, peut re-toucher 100€ avant le 1er juillet.
- **Google conversion = déjà bien configurée** : action *« amaryllis (web) purchase »*, Source GA4, **Principale**, 90j — mais **0,00 / « Aucune conversion récente »** = trou d'attribution (Unassigned), corrigé par le code du 2026-06-15. **Ménage optionnel** : conversion *« Pages vues »* comptée en Vente (valeur bidon 1,00) → passer en Secondaire.
- **⏳ Lever 2 (bid → conversions) DIFFÉRÉ** : NE PAS basculer Google « Max conversions » ni Meta « Purchase » tant que purchase = 0 (l'algo crève sans historique). Déclencheur : quand `purchase` se remplit (post-fix). Re-check AGENDA 2026-06-28.

## 🟡 2026-06-15 — Tracking serveur : reste à valider la santé du token CAPI
- **Reste à valider** : validité du **`META_CAPI_TOKEN`** (peut être expiré ~60j, valeur non lisible). Vérif Vincent = Meta Events Manager → Pixel 1648064656415946 → *Événements* : events **Serveur** récents + score **EMQ** Purchase. Si 0/erreurs → régénérer (Conversions API → générer) + `wrangler pages secret put META_CAPI_TOKEN --project-name dashboard-amaryllis`.
- **Account-side (advisory)** : (1) vérifier **dédup** Navigateur+Serveur sur un Purchase test + EMQ Purchase (cible >6/10) ; (2) Google Ads conversion `purchase` en Principale + valeurs d'enchères + Enhanced Conversions ; (3) optionnel : action conversion Google Ads directe (`AW-XXXX/label`) → à ajouter dans `Merci.jsx`. Réf : ADR-TRACKING-001.

## 🟡 2026-06-14 — Prix de réservation falsifiable côté client (mitigé par alerte, pas fermé)
- **Trou** : `create-payment-intent.js` (+ `create-deposit-intent.js`) sont **publics, sans auth, font confiance au `amount` du navigateur** (seule borne : 0,50€–5000€). Quelqu'un de technique peut payer 1€ pour une vraie résa via requête trafiquée. Confirmé par audit adversarial.
- **Pourquoi pas de rejet serveur** : prix nuitées dynamiques (saison/RM) + promos jusqu'à −99% → une vraie résa peut légitimement coûter quelques € (cf. ADR-PRICE-001). Aucun seuil de rejet sûr.
- **Mitigation livrée** : alerte hôte non bloquante (`priceGuard.js` + `stripe-webhook.js notifyHostOnce`) → ⚠️ email+ntfy si montant < 20% de nuits×prix_base. Détectable, pas fermé.
- **Débloque (fix robuste, différé)** : **jeton de prix signé HMAC** — endpoint signe `{bienId,checkin,checkout,amount,exp}` au devis ; `create-payment-intent` vérifie la signature. Décision A/B (2026-06-14) : A (alerte) choisi, B (jeton) à proposer si Vincent veut du blindé.

## 🟡 Booking.com nom+prix auto : LIVRÉ — reste `--login` initial (action humaine)
- **Airbnb** ✅ pont email `Outlook→Gmail→Apps Script→enrich` (ADR-MAIL-001, trigger 15min actif). **Booking** ✅ scraper local `scripts/booking-sync.mjs` (ADR-BOOKING-001, test e2e NINA GRUBO 696,48€ OK).
- **Reste** : Vincent doit faire `node scripts/booking-sync.mjs --login` **une fois** (ouvre l'extranet, entre creds, Entrée → profil `~/.amaryllis-booking-profile` persiste).
- **Déclenchement auto** (différé) : Worker → ntfy iCal ligne incomplète → launchd local. Voir `docs/booking-sync.md §"Reste à brancher"`.

## 🟡 SEO hors-page — autorité de domaine = LE levier (diagnostic Search Console 2026-06-04)
- **Le SEO technique est bon (position 5,8) mais le site manque d'autorité** → seules 3 pages reçoivent des impressions, les 47 guides + 5 landings ~0. **Ne PAS produire de contenu tant que l'autorité ne monte pas** (ferait plus de pages à 0 impression). **Débloque** : citations + netlinking + GBP (kits prêts), mesurer à 4-8 sem (Search Console → Liens).
- **Citations off-page (Top 5 « semaine 1 »)** :
  - ⏸️ **Bing Places** : l'import a pris la mauvaise fiche (diversifiersonpatrimoine) ; Villa Amaryllis pas indexée. **Débloque** : reprendre l'ajout des 2 fiches Amaryllis.
  - ⏸️ **Apple Business Connect** : revendiquer la fiche depuis l'app iPhone Plans, ou Business Connect avec Apple ID dédié.
  - 📧 **3 emails institutionnels prêts** (`docs/marketing/emails-prospection-institutionnels-2026-06.md`) : CMT, Mairie Sainte-Luce, OT Sainte-Luce (tél 0596 62 53 53). Vincent envoie.
  - ⬜ PagesJaunes + Petit Futé (création compte = Vincent).
- ⚠️ **Logements PAS encore déclarés ni classés** → les citations ne doivent affirmer aucun classement (seule la note 4,8★ est réelle). Cf. `docs/legal/plan-action-declarations.md`.
- **Limite pilotage navigateur** : la plupart des citations = création de compte (prohibé Claude) + soumission formulaire (mains de Vincent). Claude prépare, Vincent exécute.

## 🔄 Ports entrants de synchro — périmètre locatif — cf. `docs/OPERATING-MODEL.md` §8
- **Carte source-de-vérité déclarative** : formaliser quels champs sont canoniques (`src/data/biens.js`) vs Sheet → module `src/data/biensSource.js` + test d'invariant.
- **Réintégrer le lint au gate** : `npm run lint` = ~629 problèmes réels (l'entrée « 0 erreur » était stale). Delta-check par fichier déjà dans `deploy-pages.sh` (empêche d'ajouter des erreurs). Gate « full lint = 0 » différé au chantier eslint dédié.
- **Monter la couverture de tests** (zone à risque : miroirs, RM).
- 🤝 **CHANTIER COMMUN — drift miroirs GAS/Worker** : locatif conçoit le test de cohérence des miroirs, puis partage le pattern à patrimoine.

## 🟢 Google Ads LANCÉ (2026-06-04) — suivi
- **C1 « Offre Groupe Sainte-Luce »** (campaignId **23904365229**) : 8€/j, CPC max 0,80€, landing `/location-groupe-sainte-luce`, 13 mots-clés. **C2 « Brand »** (**23913930124**) : 2€/j, landing `/`, 7 mots-clés marque. Liste « Négatifs globaux » (120 mots) sur les 2. Conversion GA4 `purchase` = Principale.
- 📌 **À surveiller** : termes de recherche → négatifs ; bascule objectif « Ventes » + retargeting en septembre. Backlog tech : routes explicites des 3 landings dans `main.jsx` (marchent via fallback `KNOWN`).

## 🟡 Dettes & frictions techniques (latentes)
- **Drift miroir GAS/Worker** : `src/utils/{pricing,coherenceRules,resaDedup,occupancy,rmOccupancyAdjust}.js` dupliqués à la main dans `appscript/*.gs` + `workers/ical-sync/index.js`. Modifier l'util sans répercuter = bug silencieux. **Débloque** : checklist + à terme un test qui compare les implémentations.
- **Lint delta crash sur `[slug].js`** (crochets = glob bash). Contournement : `SKIP_LINT=1`. Débloque : échapper les crochets dans `deploy-pages.sh`. Chip `task_cef1560f`.
- **Visual-review Playwright rapport vide** (`scripts/visual-review.mjs` → 0 pages crawlées, probable timeout/rate-limit nuit). Débloque : relancer en journée / augmenter timeout / `npx playwright install chromium`.
- **Findings audit 06-04** : prix en dur dans la prose marketing de `functions/[slug].js` (« dès 110€/nuit » en texte libre → drift si tarif change, harmoniser au prochain changement de prix). Inclut homepage prerender « Dès 85€/nuit » (aligner sur Nogent 90€ si Vincent confirme).
- **Warnings smoke /mabouya + /guide-hub** (titres) : bénins — la Function de meta-injection met 30-60s à s'activer post-deploy alors que le smoke teste à 30s. Titres vérifiés corrects. Non bloquant.
- **Résas groupe passées (`group_biens` NULL)** : le blocage auto par-bien (ADR-GROUP-001) ne couvre que les nouvelles. Anciennes déjà bloquées à la main par Vincent ; sinon remplir `group_biens` en D1.
- **`caffeinate` LaunchAgent redondant** : `~/Library/LaunchAgents/com.vincentsalomon.caffeinate.plist` installé pour l'ancienne règle Mail (devenue côté serveur Outlook). Débloque : `launchctl unload … && rm` pour laisser le Mac redormir (proposé, en attente go Vincent).
- **`RESEND_FROM` du Worker cassée** (dashboard CF, domaine manquant) — contournée par `resendFrom(env)`. Débloque : Vincent corrige/supprime la variable. Non urgent.
- 🟡 **Findings sécurité #4-13 en backlog** (audit architecte-réseau 2026-06-20, non demandés) : rate-limit `/api/ai-summary`, webhook Beds24 fail-open, logs PII emails dans 8 endpoints, rate-limits paiement, notify-booking test ouvert. À adresser si Vincent le demande.

## 🟡 Vérifs en attente côté Vincent (livré, non re-validé par lui)
- Sync 📊 → onglet « Toutes les Réservations » sans nouveau doublon + revenus cohérents (imports idempotents).
- Meta Pixel : confirmer le flux d'events via Pixel Helper / Events Manager (beacons /tr invisibles en headless).
- Bugs inbox 🐞 : findings `[revue code]` LLM = majoritairement faux positifs vérifiés (code déjà gardé) ; traiter le reste en lot « ignoré » sauf re-signalement.

## ⏳ Décisions différées — à RAPPELER à Vincent quand le déclencheur est atteint
- **Passer l'audit d'invariants BLOQUANT au deploy** (aujourd'hui non-bloquant, ADR-S-003).
  - **Déclencheur** : `scripts/audit-invariants.mjs` a tourné sur **≥5 déploiements** consécutifs avec **0 faux 🔴**. Idéalement après correction des 2 findings 🟡 (doc « 557 erreurs » + prix en prose).
  - **Action** : dans `deploy-pages.sh`, sortir `audit-invariants.mjs` du bloc non-bloquant → `node scripts/audit-invariants.mjs || exit 1` (ou flag `--strict`). MAJ ADR-S-003 + CLAUDE.md.
  - **Qui rappelle** : `/audit` et `/cloture-session` surfacent cette ligne tant qu'elle est ouverte. ➡️ **Signaler dès ≥5 deploys propres constatés.**

---

## ✅ Archivé (levé — gardé pour traçabilité, 1 ligne chacun)
- En cours → ✅ terminé le 2026-06-30 (Veille concurrentielle RM — sélection + import 18 concurrents)
- En cours → ✅ terminé le 2026-06-30 (Cerveau AGENDA cleanup + UI note d'impact agents)
- En cours → ✅ terminé le 2026-06-29 (Header SEO + conversion + iguana noindex + aggregateRating home)
- En cours → ✅ terminé le 2026-06-29 (Audit prod ultracode 24 findings + session tracking + LLM)
- En cours → ✅ terminé le 2026-06-29 (Session tracking + LLM + backlog agents)
- En cours → ✅ terminé le 2026-06-27 (Session pipeline sécurité réservations — 4 gaps comblés)
- ✅ 2026-06-26 — Session Apple Business Connect — résidence Amaryllis configurée — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-26 — Session RM plancher CalendrierTarifs — fix complet server+UI — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-26 — Session revenus — corrections chirurgicales Sheet « revenus locatifs 2026 » — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ Schœlcher direct juillet — 2585.71€ → 1600€ (Éléonore BEVON uniquement, 2026-06-26)
- ✅ 2026-06-25 — Session UI visuelle — nav 8→6 groupes + 5 améliorations visuelles admin — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-24 — Session dashboard UX — Charges Évolution + Pilotage consolidation + ROI pub — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-24 — Feature contacts : base guest_contacts WhatsApp+Sheet + onglet — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-24 — Incident deploy agent : drift réparé + garde anti-agent + division instances — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-23 — Session CRM : Phase 0/1 + 1ère campagne réelle — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-23 — Session articles SEO : portage + maillage + optimisations — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-23 — Session backlog agents 61-76 + data-056/060 — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-23 — Session guides : 4 gaps résolus + 11 guides 404 corrigés + Gmail drafts — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-23 — Session Pubs — campagne Google Ads Canada LIVE, Meta toujours bloqué — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-23 — Session reels tous biens — GekoReel + 5 nouveaux déployés — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-23 — Session immersification guides — 20 guides déployés — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-22 — Session affiliate GYG + nav fixes + widget embed — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-22 — Session git sync + CI fix + spam + gate rewrite — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-21 — Session organisation société d'agents + crons — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-21 — Session sync permanent main=prod + couche monitoring live — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-21 — Session calendrier compact + auto-scroll + Leaflet ESM — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ 2026-06-20 — Session sécurité : 3 trous fermés + 2 bugs CSP + audit multimédia — détail complet : `.memory/ITERATIONS_LOG.md`
- ✅ **Sécurité #1-3 fermés** (2026-06-20) : manage-deposit gate Bearer+CORS, social gate Bearer|secret, beds24 cache private. ADR-SEC-001.
- ✅ **CSP #8-9 débloqués** (2026-06-20) : api.open-meteo.com (météo /explorer) + unpkg style-src (CSS Leaflet). ADR-CSP-001.
- ✅ **Tracking purchase LEVÉ** (2026-06-20) : 4 purchases trackées 2 894€. Reste : attribution (3/4 en "Unassigned"). Source vive = `npm run funnel`.
- ✅ **Système auto-pub complet en live** (2026-06-15, ADR-SOCIAL-AUTOPUB-001) : re-seed→gate(4 filtres)→publie. Token publie FB+IG. Seuil 85 atteint (88/100 Amaryllis). Posts 16-19/06 passés sans dérapage.
- ✅ **META_CAPI_TOKEN + GA4_API_SECRET posés** (2026-06-15) : vérifié `wrangler pages secret list`.
- ✅ **Fix consentement Google Ads** (2026-06-04) : `ad_storage=granted` confirmé live. 2 campagnes Smart supprimées.
- ✅ **Post GBP « Studio Mabouya »** publié 04/06. Les 3 fiches GBP (patrimoine + Villa Amaryllis + Résidence) sous vinsmaf@gmail.com.
- ✅ **generateDevis crash FB IAB** (2026-06-19) : guard `if (!bien?.id) return` ajouté + 3 bugs D1 triagés. PublicSite.jsx L1724.
- ✅ **Caution UNIFIÉE différée + durcie** (2026-06-18, ADR-CAUTION-DEFERRED-001) : tunnel 100% différé, 8 correctifs argent-réel, `_caution.js`, 308 tests. Commits `ae1922f`/`f07d17e`/`8b73794`.
- ✅ **Import historique OTA+directes** (2026-06-17, ADR-IMPORT-OTA-001 + DIRECTES + JOEL-OVERLAP) : ~700 résas 2022-2027. Fix Joël BAILLEUL chevauchement Iguana.
- ✅ **2FA Facebook + compte pub Meta fermé** (2026-06-17/18) : MDP changé, 2FA actif, bilan dépenses €69.33.
- ✅ **Bot WhatsApp test mode LIVE** (2026-06-17) : App ID `1783600126154478` · WABA `982907091270661` · test `+1 555 006 0804`.
- ✅ **CSP workers.dev+ntfy.sh + null-guards toFixed() + paiement 2× LIVE** (2026-06-16).
- ✅ **Token Meta double-comptage Purchase + fantômes solde 2×** (2026-06-15) → `eventID=pi.id` + guard `kind=solde-2x`. Commits `f5b1784→9a30660`.
- ✅ **Session 06-14 soir** : devis R/O (`da82843`), priceGuard (`327c2d5`), Booking scraper (`a813185`), rapport-business V4 (`d077f37`), chat escalade Mistral.
- ✅ **Résa Booking NINA GRUBO (Zandoli)** (2026-06-14) : fix préservation `9fdcc92`.
- ✅ **Changeset session non commité** (2026-06-13) → réglé commit `1ec6a06`.
- ✅ **Resend domaine `villamaryllis.com`** (2026-06-11) : Verified ; `resendFrom()` → `contact@villamaryllis.com` OK.
- ✅ **Placeholder téléphone guides** (2026-06-11) : UPDATE 6 lignes D1 → `+33 6 10 88 07 72`.
- ✅ **AI-Ops modèle Groq.smart aberrant** (2026-06-11) → auto-corrigé.
- ✅ **Prix en prose `slug.js`** (2026-06-13) : 9 prix corrigés (source `src/data/biens.js`). Commit `14c817d`.
- ✅ **Résa Laurent Maignan total=340€ < caution=500€** (2026-06-11) : VALIDÉ NORMAL — court séjour, caution fixe.
- ✅ **Rename `beds24Amount` → `chargeAmount`** : fait PublicSite.jsx ~L1340.
- ✅ **iCal null guard checkin/checkout** : `ical-export.js` L71-72 + guard.
- ✅ **`sessionStorage` guards** (2026-06-11) : 5 accès → `ssGet`/`ssSet`. 172 tests.
- ✅ **Findings « [revue code] » LLM triagés** (2026-06-11) : 72 entrées, 4 fixed / 67 ignored.
- ✅ **Meta Ads LANCÉ** (2026-06-05) : compte `act_853205825762332`, Pixel `714189639771397`, C1 TOFU + C2 MOFU.
- ✅ **Doublons docs archivés** (2026-06-11) : `google-ads-kit.md` + `google-business-profiles-kit.md` → `docs/_archive/`.
- ✅ **Keepalive tokens** (2026-06-11) : `runMonitor` + `runTokenRotationReminder` actifs.
- ✅ **Crons hebdo créés** (2026-06-10) : `consolidation-memoire-hebdo` + `point-ads-hebdo` (lundi 6h/7h MTQ).
- ✅ **Smoke test renforcé** (2026-06-07/11) : `admin-smoke.mjs` + sentinel anti-chunk-périmé.
- ✅ **Chunk périmé v2** (2026-06-07) → `[[asset]].js` + sentinel (`524fb3d`).
- ✅ **notify-booking.js + get-availability.js** DDL/bien_id → corrigés `14771f1`.
- ✅ **CLAUDE.md « no tests » / PROJECT_MEMORY 52KB / index ADR** (2026-06-04) → corrigés.

### À surveiller (résiduel, bénin)
- **Cache CDN Cloudflare** : peut retenir temporairement de vieux chunks (`text/html`) — le filet client renforcé déclenche le reload ; expire au TTL ou purge manuelle.
- **Sentry « Importing a module script failed » /amaryllis** (FB in-app browser iOS) : signature chunk périmé, fix déployé → bruit CDN résiduel. Purger si récurrence sur sessions récentes non-fbclid.
- **HTTP 401 sur /admin** (~03/06) : probable expiration normale de token de session (`apiFetch.notifyUnauthorized`). Vincent confirme si reproductible.
