# Déploiement Cloudflare (Pages/Workers/CI) — Learnings locatif-dashboard

> Cloudflare Pages/Workers, CI, CDN, secrets, environnement local
> Extrait de `../LEARNINGS.md` le 2026-07-04 (consolidation mémoire — split thématique).
> 27 entrées, triées par date décroissante.

## Empty commit ne déclenche PAS un workflow avec filtre `paths:` — `workflow_dispatch` pour forcer un redeploy — 2026-07-08
- **Piège** : besoin de forcer un redéploiement sans changement de code (activer un secret tout juste posé). `git commit --allow-empty` + push ne matche AUCUN chemin du filtre `paths:` de `deploy.yml` (zéro fichier changé) → le workflow ne se déclenche JAMAIS, sans erreur, juste silence.
- **Fix** : `gh workflow run "<nom exact du workflow>" --ref main` (le trigger `workflow_dispatch:` existe déjà dans `deploy.yml`) — build+déploie le HEAD actuel de main sans avoir besoin d'un vrai changement de fichier, retourne directement l'URL du run.
- **Au passage** : `sync-projets.sh` (`~/.claude/scripts/`) faisait `curl ... && echo "✅ synced"` — ne vérifie QUE le succès du client HTTP, jamais le code retour serveur (un 401 s'affichait comme un succès). Corrigé pour vérifier `-w "%{http_code}"` explicitement. Réflexe généralisable : tout script de sync avec `&& echo succès` est suspect tant qu'il ne checke pas le vrai code retour.
- **Trou de lecture qui a coûté cher ce jour-là** : `occupancy-stats`/`agents-stats` déclarés à tort "nécessitent le mot de passe admin en clair" alors que `CLAUDE_SECRET` (chemin d'auth machine dédié, `_adminauth.js` L93-94) suffisait — **alors que ce fait exact était déjà documenté juste en dessous dans ce même fichier** (entrée 2026-07-03). Trouvé seulement après qu'un fichier d'auth ait été lu à moitié dans un AUTRE repo (`vincent-os`), sans jamais cross-référencer les learnings DE CE projet-ci. Leçon : avant de conclure qu'un mécanisme d'auth manque, grep les learnings du projet concerné, pas seulement le fichier de code qu'on a sous les yeux.

## 🔴 `verifyBearer` local (dev:cf) échoue TOUJOURS avec CLAUDE_SECRET si `.dev.vars` n'a pas `ADMIN_PASSWORD`/`ADMIN_PWD` — 2026-07-03
- **Piège** : `_adminauth.js` → `verifyBearer()` appelle `resolveSecret(env)` (= `env.ADMIN_PASSWORD || env.ADMIN_PWD || ""`) et **retourne `{ok:false}` immédiatement si ce secret est vide** — AVANT même d'arriver à la vérification `env.CLAUDE_SECRET` (qui est plus bas dans la fonction). Résultat : sous `wrangler pages dev` local, TOUT endpoint admin-gated répond 401 avec un Bearer CLAUDE_SECRET parfaitement valide, tant que `.dev.vars` ne contient ni `ADMIN_PASSWORD` ni `ADMIN_PWD` (ce qui est le cas — ce projet n'a que `CLAUDE_SECRET`/`POSTSTAY_SECRET` en local). Rencontré 2 fois dans la même session (`/api/guides` POST, puis `/api/occupancy-stats` GET) avant diagnostic.
- **La prochaine fois** : ne PAS perdre de temps à déboguer un 401 local sur un endpoint `verifyBearer` — soit ajouter un `ADMIN_PASSWORD=xxx` factice à `.dev.vars` (fichier local, gitignored, sans impact prod) si le test local est indispensable, soit directement tester contre **production** avec `curl + Bearer CLAUDE_SECRET` (déjà le pattern établi cette session pour tous les endpoints admin — fiable, zéro risque puisque lecture ou action ciblée avec confirmation).

## 🕵️ "Cannot read properties of undefined (reading 'default')" récurrent = chunk JS périmé après déploiement, pas un bug de code — 2026-07-03
- **Piège évité** : 6 occurrences de ce message (stack traces `recharts-*.js`/`leaflet-*.js`, chaîne d'appels vendor identique `Ia→Lc→Nu→Au→ku→_u→ld→ae`) sur des pages très différentes (guides, /culture, /security, /zandoli...) auraient pu ressembler à un vrai bug dans `PropertyMap.jsx` ou l'usage Recharts. Vérification : (1) `PropertyMap.jsx` a déjà le guard ESM correct (`LModule.default ?? LModule`) depuis une session précédente — pas la source. (2) Les timestamps des occurrences corrèlent exactement avec des salves de déploiements (5 déploiements le 2026-07-02, erreurs le même jour/lendemain). (3) Le message correspond exactement au symptôme connu de `React.lazy()` quand un chunk dynamique importé résout `undefined` après invalidation de son hash suite à un déploiement — déjà partiellement mitigé dans ce projet (auto-reload sur chunk périmé).
- **La prochaine fois** : avant de chercher un bug de code sur une erreur `.default` récurrente touchant des chunks lazy-loadés (recharts/leaflet/autres), corréler les timestamps avec l'historique des déploiements — si ça coïncide, marquer `ignored` (transitoire, auto-guéri au rechargement) plutôt que chercher un fix de code inexistant.

## 🐞 `wrangler pages dev` (local `dev:cf`) peut 404 sur des assets statiques que Vite seul sert normalement — 2026-07-02/03
- **Piège** : `functions/api/guides/[[path]].js` fait un fallback `fetch(new URL('/guides/x.json', url.origin))` pour lire un JSON statique de `public/`. Sous `wrangler pages dev -- npm run dev`, cette requête (et même un fetch DIRECT vers `/guides/x.json` depuis la page) retourne 404 — alors que la MÊME URL sur le serveur Vite tout seul (`npm run dev`, sans wrangler) répond 200. C'est une limitation du proxy local de `wrangler pages dev` vers le sous-processus Vite pour certains chemins sous `public/`, pas un bug du code.
- **La prochaine fois** : si un endpoint qui lit un fichier statique semble cassé UNIQUEMENT sous `dev:cf` mais fonctionne en prod, vérifier d'abord si la même URL répond en direct sous `npm run dev` seul avant de creuser le code — si oui, c'est une limitation connue de l'environnement local, pas une régression à corriger.
- **Contournement testé** : ajouter `--d1=<binding>` aux args de `wrangler pages dev` (miniflare crée un D1 local automatiquement) permet de tester les endpoints qui LISENT du D1 sans passer par le fallback statique cassé.

## 🎯 Cloudflare Pages : une variable d'env/secret ajoutée ne prend effet qu'au PROCHAIN déploiement — 2026-07-01
Ajouter/modifier une variable dans Settings → Variables and secrets ne l'injecte pas dans le déploiement en cours de prod — il faut redéployer (bouton "Retry deployment" sur le dernier déploiement, ou un nouveau push) pour que les Functions la voient. Signal : l'app renvoie encore l'ancien message d'erreur ("Secrets Google manquants") juste après avoir sauvegardé la variable dans le dashboard.

## 🚫 CF Workers : `cache: "no-store"` + `cf: { cacheTtl: 0 }` = incompatibles — 2026-06-28
- **Piège** : combiner les 2 dans un `fetch()` CF Workers lance une exception silencieuse → l'email ne part jamais, aucun log D1 (le crash est avant `sendEmail`).
- **La prochaine fois** : pour bypass cache CF dans un Worker, utiliser SOIT `cache: "no-store"` SOIT `cf: { cacheTtl: 0, cacheEverything: false }`, jamais les deux ensemble. Le `?cb=Date.now()` dans l'URL suffit pour un cache-bust léger.

## 🔑 Accès admin Claude : CLAUDE_SECRET Bearer — 2026-06-27
- Toute session peut maintenant appeler les endpoints admin directement : `Authorization: Bearer <valeur dans .memory/claude_secret.md>`.
- Créé en Cloudflare Pages prod+preview + .dev.vars. Code dans `functions/api/_adminauth.js` (verifyBearer priorité 2).

## 🚀 RÈGLE ABSOLUE DÉPLOIEMENT — Claude ne fait JAMAIS `npm run deploy:pages` — 2026-06-23
- **Piège vécu** : 2 instances Claude déployaient depuis des états locaux différents (sans pusher sur git) → drift prod≠main répété (vécu 3 fois en 24h le 2026-06-23).
- **La règle** : Claude fait **toujours** `git push origin main` → le CI deploy.yml s'occupe du reste.
- `npm run deploy:pages` = outil d'urgence **Vincent seul** si la CI est cassée (secret absent, wrangler down). Jamais depuis une session Claude.
- **Vérif** : avant tout déploiement, `git status` + `git push` est le seul chemin valide.

## 📦 Git untracked `??` ≠ modified `M` : les nouveaux fichiers doivent être stagés explicitement — 2026-06-22
- **Piège vécu** : commit des `M` (modifiés) sans les `??` (untracked). `NewsletterForm.jsx` + `NewsletterTab.jsx` importés dans `App.jsx` mais jamais stagés → build local OK (fichiers sur disque), CI GitHub FAIL (`UNRESOLVED_IMPORT`).
- **La prochaine fois** : `git status --short | grep "^??"` avant tout commit. Stagér explicitement les nouveaux fichiers : `git add src/NouveauFichier.jsx`. `git diff HEAD --name-only` ne montre PAS les untracked.

## 📧 Emails GitHub Actions automated (failure+recovery) = notifications@github.com, pas du code custom — 2026-06-22
- Tout workflow GitHub (`deploy.yml`) envoie un email auto à l'owner en cas d'échec ET de re-succès. Ce n'est pas du code custom.
- **Pour les désactiver** : GitHub → Settings → Notifications → Email → ajuster les préférences workflow.

## ⏰ CF Workers crons : limite 5 = plan gratuit, plan payant = 250 — 2026-06-22
- La limite de 5 crons par Worker s'applique au **plan gratuit** (Workers Free). Le plan Workers Paid = 250 crons/Worker. Ne pas confondre.
- Actuellement : 7 crons sur `amaryllis-ical-sync` (`*/10`, `0 9`, `0 11 1`, `0 12`, `0 13`, `0 6 1`, `0 1 1`). Marge confortable.

## 🏛️ Réunion générale : `FLEET_SECRET` Worker = condition critique — 2026-06-22
- Si `FLEET_SECRET` est absent des secrets du Worker `amaryllis-ical-sync`, la fleet patrimoine n'est PAS appelée → la réunion tourne en mode locatif-only sans erreur visible.
- **La prochaine fois** : avant tout re-déploiement du Worker, vérifier que `FLEET_SECRET` est listé dans les secrets CF (dashboard Workers → Settings → Variables → Secrets). Si absent : `echo "valeur" | npx wrangler secret put FLEET_SECRET --name amaryllis-ical-sync`.

## 🐛 Vite worktree : toujours vérifier `lsof -p <pid> | grep cwd` avant d'éditer — 2026-06-21
- **Piège** : le serveur Vite (port 5173) tournait depuis le **worktree** (`/.claude/worktrees/sad-bartik-02a3c2`), pas le repo principal. J'ai édité les fichiers du repo principal → aucun effet, HMR silencieux. Perdu ~30 min à diagnostiquer.
- **La prochaine fois** : dès la première session dans un worktree, lancer `lsof -p $(pgrep -f "vite$") | grep cwd` pour confirmer quel chemin le serveur sert. Éditer UNIQUEMENT les fichiers dans ce chemin.

## ⏰ Cron-job.org : vérifier l'état réel avant de planifier une migration — 2026-06-21
- **Découverte** : lors de la migration cron-job.org→CF Worker, 6 des 7 jobs locatif étaient déjà supprimés dans les sessions précédentes. Seul `charge-balance` restait. J'avais prévu une migration de 7 jobs, il n'en restait qu'un.
- **La prochaine fois** : avant toute migration de service, faire un `GET /jobs` (ou équivalent) sur le service source pour lister l'état réel. Ne pas supposer que tous les jobs listés dans la mémoire existent encore.

## 2026-06-21 — Sync main = prod

- **La prochaine fois : un deploy manuel depuis une branche ≠ main = drift silencieux assuré.** `wrangler pages deploy` ne sait pas quelle branche est "prod" — il envoie ce qu'il a. La garde dans `deploy-pages.sh` + la CI sont les seuls garde-fous.
- **CI smoke test : ne jamais tester un endpoint qui dépend d'un secret externe** (OpenWeatherMap) sur l'alias preview CF Pages. Les secrets CF Pages ne s'appliquent qu'à l'env `production`. Tester uniquement les routes statiques React (/ et /amaryllis) dans la CI ; les APIs avec clés externes = test depuis prod directement (curl post-deploy manuel si nécessaire).
- **Token API Cloudflare pour CI** : doit avoir les 2 permissions `Cloudflare Pages: Edit` + `Workers Scripts: Edit`. Le token existant `amaryllis` (Workers AI + Account Settings) est insuffisant pour déployer.
- **Git push origin main déclenche la CI** — mais origin/main était ~100 commits en retard depuis des mois. Penser à pusher régulièrement pour ne pas accumuler ce delta.

## 🚦 CF Pages : >100 Functions → _routes.json auto-généré TRONQUE les routes récentes (SPA fallback silencieux) — 2026-06-19
- **Piège vécu** : nouvelle Function `functions/pay/[code].js` déployée OK mais `/pay/cambier` renvoyait 200 (SPA) au lieu de 302. Cause : le projet a **119 Functions** > **limite 100 routes** du `_routes.json` que CF Pages génère automatiquement. Les routes au-delà de 100 sont **silencieusement exclues** → tombent sur le fallback SPA (aucune erreur, aucun log). La route la plus récemment ajoutée est la victime.
- **Fix canonique** : fournir un `public/_routes.json` MANUEL avec `{"version":1,"include":["/*"],"exclude":[assets...]}`. `include:["/*"]` = toutes les requêtes passent par le runtime Functions (chaque Function décide), le reste tombe en asset/SPA. `exclude` = assets purs (`/assets/*`,`/photos/*`,`/brand/*`,favicon,sitemap…) pour ne pas réveiller le runtime inutilement. La limite de 100 porte sur le NOMBRE DE RÈGLES include+exclude (on en a ~12), pas sur le nombre de Functions. Vite copie `public/_routes.json` → `dist/` au build.
- **Détection** : `curl -sI https://villamaryllis.com/<route-Function-récente>` → si `content-type: text/html` + SPA au lieu du comportement Function = route exclue. `curl https://villamaryllis.com/_routes.json` (souvent SPA, donc pas fiable seul).
- **La prochaine fois** : dès qu'on dépasse ~100 Functions, le `public/_routes.json` manuel est OBLIGATOIRE, sinon chaque nouvelle Function a 1 chance sur 2 d'être muette. Désormais en place dans le repo.

## 🌳 Worktree périmé = déployer depuis lui crée un PREVIEW, pas la prod (ne JAMAIS forcer prod) — 2026-06-19
- **Piège vécu** : session démarrée dans un worktree `.claude/worktrees/sad-bartik-02a3c2` (branche `claude/sad-bartik-02a3c2`) **156 commits derrière `main`**. Il ne contenait PAS le système caution (`_caution.js`, `caution-cron.js`). `npm run deploy:pages` depuis ce worktree → wrangler déploie sur la **branche git courante ≠ main → déploiement PREVIEW** (`<hash>.dashboard-amaryllis.pages.dev`), PAS villamaryllis.com. Mes fixes ne prenaient donc jamais effet en prod (qui sert `main`), ce qui m'a fait tourner en rond.
- **Bon réflexe** : villamaryllis.com = déploiement **production** = dernier `deploy:pages` lancé **depuis `main`**. Tester `curl https://villamaryllis.com/api/<endpoint-récent-de-main>` → si 401/200 (existe) vs catch-all, on sait quelle version tourne. `wrangler pages deployment list --project-name dashboard-amaryllis` montre Environment (Preview vs Production) + branche + commit.
- **La prochaine fois** : pour tout changement de code à mettre en PROD, vérifier `git branch --show-current` AVANT de déployer. Si worktree feature ≠ main → soit basculer sur `~/locatif-dashboard` en `main`, soit merger. **Ne JAMAIS forcer `--branch=main` depuis un worktree périmé** (écraserait la prod avec une version retardée). D1 en revanche est PARTAGÉ preview/prod (un `wrangler d1 execute --remote` touche la vraie base, peu importe la branche).

## ⚠️ `deploy:pages` meurt en silence si on supprime un fichier sans committer d'abord — 2026-06-16
- Le gate lint-delta de `scripts/deploy-pages.sh` (`set -euo pipefail`) calcule `CHANGED_JS=$(git diff … | while read f; do [[ -f "$f" ]] && echo "$f"; done)`. Si un fichier **supprimé** (non committé) est trié en dernier, le `[[ -f ]] && echo` final retourne **1** → la substitution `$()` échoue → `set -e` tue le script juste après l'echo « 🔍 Lint… » (EXIT=1, aucun message d'erreur, déroutant).
- **La prochaine fois** : après un `git rm`, **committer AVANT `deploy:pages`** (arbre clean → `git diff vs HEAD` vide → le gate ne boucle sur rien). Vécu sur RM-03 (suppression des moteurs pricing morts). Fix durable possible (hors scope) : neutraliser le `while` avec `|| true` ou filtrer les suppressions en amont.

## 🚀 CF Pages a une LIMITE de déploiements/jour — grouper les builds — 2026-06-15
- Vincent : « on peut pas déployer avant 19h, limite atteinte » après ~12 déploiements dans la session. **CF Pages limite le nombre de déploiements (≈ rate limit horaire/quotidien).** **La prochaine fois : GROUPER les correctifs et déployer 1 fois**, pas un `deploy:pages` par micro-fix. Tester un max en local (`vitest`, `npm run build`, `node --check`) AVANT de déployer. La limite s'est levée ~1 min après (probablement fenêtre glissante).

## 🐛 Pages Function qui renvoie « error code: 502 » (HTML, pas mon JSON) — 2026-06-15
- Diagnostic différentiel : un GET minimal qui répond (mon JSON 400) = le **module charge bien** (pas un import cassé). Un POST qui 502 **en ~6s** (pas 30s) et **échappe au try/catch global** = ce n'est NI une exception JS (sinon catchée), NI un timeout 30s → **dépassement d'une limite CF** (CPU/mémoire/subrequest) sur le chemin exécuté (ici l'appel LLM + post-traitement). **À élucider via `wrangler pages deployment tail` (read-only, ne déploie pas).** Statut guide-write : moteur `_guideWriter.js` OK (9 tests), endpoint 502 sur le chemin LLM à debugger via logs.

## 🔍 CDN propagation / smoke-test post-deploy : toujours vérifier via l'alias direct avant de conclure que le déploiement est cassé — 2026-06-13 (fusion 2026-06-14)
- Après un `npm run deploy:pages`, la prod `villamaryllis.com` peut servir le contenu précédent encore plusieurs minutes (cache CDN Cloudflare). L'**alias de déploiement direct** (`https://<branch>.dashboard-amaryllis.pages.dev`) ne cache JAMAIS → montre immédiatement le code déployé.
- **La prochaine fois** : vérifier le comportement attendu sur l'alias d'abord, puis attendre quelques minutes pour villamaryllis.com. Ne pas re-déployer si l'alias est OK — c'est le CDN, pas le code.
- **Application smoke-test (2026-06-14)** : tester `villamaryllis.com` juste après deploy = **faux négatifs** (bundle transitoirement en `text/plain`, titres absents) → a causé un hard-fail (exit 1) sur un déploiement pourtant sain. Fix : capturer l'URL alias de la sortie wrangler (`grep -oE "https://[a-z0-9-]+\.<projet>\.pages\.dev"`) et smoke-tester celle-ci, fallback sur le domaine prod si non capturé.
- **Nuance** : même sur l'alias frais, la **Function de meta-injection** (`[slug].js` runtime) met ~30-60s à s'activer → les checks de `<title>` runtime peuvent encore warner brièvement, alors que les checks statiques (bundle, /admin) passent immédiatement. Warnings bénins, non bloquants.

## ⚡ `SKIP_BUILD=1` = réutilise `dist/` existant — inclut les fichiers `public/` si build a déjà tournéavant — 2026-06-13
- `SKIP_BUILD=1 npm run deploy:pages` déploie le `dist/` déjà construit. Si `public/robots.txt` a été modifié ET qu'un `npm run build` a tourné après cette modification, le `dist/robots.txt` est correct → `SKIP_BUILD=1` est safe.
- **Piège** : modifier `public/` APRÈS le build et faire `SKIP_BUILD=1` → la modification n'est pas dans dist/. Toujours builder après toute modif `public/`.

## 🔗 Lazy import React + ESLint `react-refresh/only-export-components` — 2026-06-13
- Convertir un import statique en `lazy(() => import('./X.jsx'))` ajoute une erreur ESLint `react-refresh/only-export-components` si la const est au top level (pas dans un composant). Le delta-check du deploy script le détecte et bloque.
- **Fix** : ajouter `// eslint-disable-line react-refresh/only-export-components` sur la ligne du `lazy()`. Ces constantes sont des composants React différés, pas une vraie violation de règle.

## 🔄 Stale chunk React : `unhandledrejection` ne suffit pas — onError ErrorBoundary requis — 2026-06-12
- Quand React lazy() + Suspense échoue à charger un chunk (hash périmé après déploiement), React attrape l'exception **via l'ErrorBoundary avant** que la Promise soit considérée "unhandled". Le handler `window.addEventListener('unhandledrejection', …)` existant ne se déclenche donc pas.
- **Fix** : ajouter un `onError` sur le `Sentry.ErrorBoundary` racine (`main.jsx`) qui détecte le pattern stale chunk et recharge. Le fallback `({ error }) => …` doit afficher un écran neutre (pas un message d'erreur) pendant le rechargement.
- **Pattern final** : `unhandledrejection` + `vite:preloadError` + `ErrorBoundary.onError` + `console.error` intercept = couverture quasi-totale (Chrome/Firefox/Safari/iOS).

## 2026-06-07 (soir) — Chunk périmé v2 : SPA fallback + cache navigateur

- **`/* /index.html 200` est SAFE pour les routes SPA mais TOXIQUE pour `/assets/*.js`.** Tant que Cloudflare ne sait pas que tel asset n'existe plus, il applique le fallback → renvoie HTML avec content-type `text/html` au lieu d'un vrai 404 → navigateur reçoit HTML quand il attend du JS → erreur silencieuse. **Toujours mettre une Pages Function catch-all sur `/assets/*`** qui détecte ce cas (content-type text/html sur extension JS/CSS/etc.) et force un vrai 404.
- **Le filet `vite:preloadError` seul ne suffit pas.** Selon le navigateur (Safari iOS, Chrome Mobile), l'erreur n'arrive pas toujours sous forme de promesse rejetée. Compléter par : (a) un filet `unhandledrejection` avec une regex LARGE (8+ patterns incluant "is not a valid JavaScript MIME type"), (b) un monkey-patch `console.error` pour les cas où l'erreur est juste loguée. Centraliser les patterns dans une constante `STALE_CHUNK_PATTERNS`.
- **Toute occurrence de "is not a valid JavaScript MIME type" dans `client_errors` = signal rouge** d'un SPA fallback sur asset. À reflexer comme diagnostic prioritaire avant de chercher ailleurs.
- **Smoke test deploy doit tester un chunk SIMULÉ inexistant** (`/assets/__sentinel-stale-${ts}.js`) pour valider qu'on renvoie bien 404 (et pas 200+HTML). Sans ce sentinel, on peut casser la Pages Function `[[asset]].js` sans s'en apercevoir.

## 2026-06-05 (suite) — Chunks périmés + vérifier l'infra avant de construire
- **Chunk périmé après deploy** = page blanche silencieuse : l'ancien `index.html` en cache navigateur référence des bundles dont le hash n'est plus servi → `Failed to fetch dynamically imported module`. La prochaine fois : tout SPA à code-splitting DOIT avoir un handler `vite:preloadError` (+ filet `unhandledrejection`) qui recharge UNE fois (garde anti-boucle 30s). Fait dans `src/main.jsx`.
- **Toujours grep l'infra existante AVANT de coder une feature** : la demande « mots interdits pour les agents » était à 80% déjà là (`agent_lessons` D1 + endpoint CRUD `agent-lessons.js` + `loadLearnedLessons`). Il ne manquait que l'UI + l'injection prompt. Économie énorme en cherchant `interdit|banned|lesson` d'abord.
- **Détecter ≠ éviter** : une liste noire qui ne sert qu'au fact-check post-génération corrige après coup ; pour « rendre les agents plus précis » il faut **l'injecter dans le prompt** (contrainte négative en amont). Les deux ensemble = ceinture + bretelles.

## Admin / auth (onglets vides = bug récurrent résolu 2026-06-04)
- **Onglets admin (🐞 Bugs, backlog agents) « vides » sans message = token de session expiré → 401 silencieux.** Le token signé (`_adminauth.js`) avait un TTL de **12 h** ; passé ce délai, tous les GET admin renvoient 401, mais le front faisait `.catch(()=>setItems([]))` → liste vide trompeuse (la porte admin restait « ok » côté client). **Fix structurel anti-récurrence** : tout 401 sur `/api/*` (dans `apiFetch.js`, couvre `fetchJSON` + `adminFetch`) émet un event `admin-unauthorized` → `App.jsx` purge la session + rouvre `PasswordGate` (« Session expirée ») → ré-auth → token frais → onglets repeuplés (auto-réparant). + TTL 12h→7j + erreurs visibles dans les onglets.
- **Règle** : un GET admin qui peut 401 ne doit JAMAIS afficher une liste vide en silence — soit forcer la ré-auth, soit afficher l'erreur. Token en `sessionStorage` = perdu à la fermeture d'onglet (re-login attendu) ; ne pas confondre avec la porte mot de passe.

## CI / outillage
- **`wrangler ≥ 4.94` exige Node ≥ 22.** La CI GitHub était en Node 20 → l'étape `wrangler pages functions build` plantait (exit 1) **uniquement en CI** (local en Node 22 = OK). Fix : `node-version: "22"` dans `.github/workflows/ci.yml`. **Garder la version Node de la CI alignée sur l'env de dev.**
- **La CI ne tournait quasi jamais** (on pousse rarement sur GitHub car CF Pages = upload direct) → une casse latente n'est visible qu'au moment où on se met à pousser souvent. Pousser régulièrement = détecter tôt.
- **Lire un log CI sans `gh` ni token** : l'API GitHub publique donne le job/étape en échec (`/actions/runs/<id>/jobs`), mais le LOG détaillé nécessite auth → l'ouvrir dans le **navigateur** (Chrome MCP, déjà loggé sur GitHub) et `get_page_text` sur la page du run. Plus rapide que d'installer gh.

## Worker cron — dépendances de données entre appels du même `Promise.all` (2026-07-08)
- **Des fetches qui dépendent des DONNÉES écrites par un autre fetch ne doivent JAMAIS être dans le même `Promise.all`, même s'ils sont tous "hebdo lundi".** Le cron `0 6 * * 1` lance `rm-auto-update?scan=1` (recalcule `rm_market_signals`) ET un nouveau rapport qui LIT ces mêmes signaux, tous les deux dans le même tableau `Promise.all([...])` = concurrents, pas séquentiels. Risque réel : le rapport se termine avant que le recalcul ait écrit ses lignes D1, et lit les signaux de la semaine précédente sans qu'aucune erreur ne le signale. Fix : sortir l'appel dépendant du `Promise.all`, l'`await`er APRÈS (wrapper tout dans une IIFE async passée à `ctx.waitUntil`). Le simple fait que deux tâches soient prévues pour "le même cron" ne garantit RIEN sur leur ordre d'exécution réel si elles sont lancées ensemble.
