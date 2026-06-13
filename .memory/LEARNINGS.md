# LEARNINGS — Enseignements réutilisables (locatif-dashboard)

> Pièges déjà rencontrés + comment les éviter. 1 entrée = 1 leçon actionnable « la prochaine fois ».
> Le journal d'erreurs exhaustif reste `../docs/ERREURS-LOG.md`.

## 🔍 CDN propagation : toujours vérifier via l'alias direct avant de conclure que le déploiement est cassé — 2026-06-13
- Après un `npm run deploy:pages`, la prod `villamaryllis.com` peut servir le contenu précédent encore plusieurs minutes (cache CDN Cloudflare). L'**alias de déploiement direct** (`https://<branch>.dashboard-amaryllis.pages.dev`) ne cache JAMAIS → montre immédiatement le code déployé.
- **La prochaine fois** : vérifier le comportement attendu sur l'alias d'abord, puis attendre quelques minutes pour villamaryllis.com. Ne pas re-déployer si l'alias est OK — c'est le CDN, pas le code.

## ⚡ `SKIP_BUILD=1` = réutilise `dist/` existant — inclut les fichiers `public/` si build a déjà tournéavant — 2026-06-13
- `SKIP_BUILD=1 npm run deploy:pages` déploie le `dist/` déjà construit. Si `public/robots.txt` a été modifié ET qu'un `npm run build` a tourné après cette modification, le `dist/robots.txt` est correct → `SKIP_BUILD=1` est safe.
- **Piège** : modifier `public/` APRÈS le build et faire `SKIP_BUILD=1` → la modification n'est pas dans dist/. Toujours builder après toute modif `public/`.

## 🔗 Lazy import React + ESLint `react-refresh/only-export-components` — 2026-06-13
- Convertir un import statique en `lazy(() => import('./X.jsx'))` ajoute une erreur ESLint `react-refresh/only-export-components` si la const est au top level (pas dans un composant). Le delta-check du deploy script le détecte et bloque.
- **Fix** : ajouter `// eslint-disable-line react-refresh/only-export-components` sur la ligne du `lazy()`. Ces constantes sont des composants React différés, pas une vraie violation de règle.

## 🌐 Vérif UI en prod réelle = Chrome MCP, PAS le preview tool — 2026-06-11
- Le preview tool (localhost:5173) **ne peut pas charger une URL cross-origin** (`window.location='https://villamaryllis.com'` reste sur localhost) ET le dev Vite **ne sert pas les Functions** (`/api/*` → blockedDates vide, guides 404). → toute vérif qui dépend du backend/prod est **faussée** en preview (on a perdu du temps à croire à un bug double-booking inexistant).
- **La bonne méthode** : `mcp__Claude_in_Chrome__*` (vrai navigateur, prod réelle, Vincent loggé Google) → navigate + `javascript_tool`/`get_page_text`. C'est comme ça qu'on a validé le rebond, les CTA avis, et tiré les données Search Console.
- Pièges Chrome MCP : un retour JS contenant une **query string** (`?checkin=…`) est **bloqué** (`BLOCKED: Cookie/query string data`) → renvoyer les URL sans la query (`.split('?')[0]`). `javascript_tool` peut **freezer** sur page lourde → basculer sur `get_page_text`. Naviguer en boucle casse le contexte JS → 1 page à la fois.

## 🗄️ Guides voyageur : la source de vérité = D1 `property_guides`, pas le JSON public — 2026-06-11
- `/api/guides` lit **D1 d'abord**, fallback `public/guides/{id}.json`. Le placeholder tél `+33 6 XX XX XX XX` était propre dans le JSON mais **présent dans D1** → live cassé. Corrigé via `wrangler d1 execute --remote "UPDATE property_guides SET content_json=REPLACE(...)"`.
- **La prochaine fois** : pour tout contenu guide servi en prod, vérifier/éditer **D1**, pas le JSON (qui n'est qu'un fallback).

## 🧭 Route SPA 404 silencieux : la whitelist `isKnown` (main.jsx) doit lister TOUT préfixe — 2026-06-11
- `/guide-sejour/*` et `/services/*` avaient leur handler (main.jsx ~L321-324) mais **manquaient dans `isKnown`** (~L241) → `NotFound` avant d'atteindre le handler. Les liens emails pré-arrivée/J-1 (résas directes) **404aient**.
- **La prochaine fois** : tout nouveau préfixe de route = l'ajouter **à `isKnown` ET au routeur**. Tester un hit direct, pas seulement la nav SPA.

## 💳 BNPL (Klarna) : surcharger le client est INTERDIT — 2026-06-11
- On ne peut pas répercuter le frais Klarna sur le client (CGV Klarna + réglementation EU surcharging). Choix binaire : absorber le frais, ou ne pas proposer Klarna. → on a retenu l'**acompte/solde** (0 € de frais en plus). Cf. ADR-PAY-001.

## 🔍 Diagnostic SEO réel (Search Console, 2026-06-11) : autorité, pas conversion
- ~100 impressions / 3 mois. Le site ne ranke que sur des requêtes **brand** (« amaryllis ») + génériques micro-volume. Sur les vraies requêtes à volume, **invisible** (Booking/OTA dominent même sur la marque « résidence amaryllis »). → Le levier n'est PAS plus d'on-page mais l'**autorité hors-page** (GBP, citations/NAP) + paid. Les quick-wins on-page (titres recalés) restent marginaux en absolu.

## 🚦 Modifications UI publiques = présenter AVANT de déployer — 2026-06-11
- **Règle ferme (rappelée par Vincent)** : tout changement visible sur le site public (UI, CRO, texte, layout) doit être décrit à Vincent **avant de coder et déployer** — même si c'est dans la continuité logique d'un travail en cours.
- **Ce qui s'est passé** : trust bar Amaryllis validée → extension aux autres biens faite et déployée de manière autonome sans présenter le scope. Vincent a demandé une explication après coup.
- **Pattern correct** : décrire ce qu'on propose → attendre go → coder → build+test → `deploie` → prod. Pas de déploiement préemptif "dans la logique du précédent".
- **Exception OK** : fix de bug UI clair (ex: PricingCalendar redondant) peut être décrit brièvement avant deploy sans attendre un go formel.

## 🔄 Stale chunk React : `unhandledrejection` ne suffit pas — onError ErrorBoundary requis — 2026-06-12
- Quand React lazy() + Suspense échoue à charger un chunk (hash périmé après déploiement), React attrape l'exception **via l'ErrorBoundary avant** que la Promise soit considérée "unhandled". Le handler `window.addEventListener('unhandledrejection', …)` existant ne se déclenche donc pas.
- **Fix** : ajouter un `onError` sur le `Sentry.ErrorBoundary` racine (`main.jsx`) qui détecte le pattern stale chunk et recharge. Le fallback `({ error }) => …` doit afficher un écran neutre (pas un message d'erreur) pendant le rechargement.
- **Pattern final** : `unhandledrejection` + `vite:preloadError` + `ErrorBoundary.onError` + `console.error` intercept = couverture quasi-totale (Chrome/Firefox/Safari/iOS).

## 📺 YouTube Studio : pièges opérationnels — 2026-06-12
- **"Remplacer la vidéo"** n'existe plus dans YouTube (supprimé). Seul flux : Créer → Importer des vidéos (nouveau fichier, nouveau hash) → mettre à jour bande-annonce manuellement.
- **COPPA "conçue pour les enfants"** sur une vidéo : désactive silencieusement les commentaires et les notifications. Vérifier la section "Audience" sur chaque vidéo importée/existante. Default = "Non" à confirmer explicitement.
- **`file_upload` Chrome MCP** : ne peut uploader que des fichiers partagés dans la session — pas un path filesystem arbitraire. Pour une vidéo locale, Vincent doit cliquer manuellement "Sélectionner des fichiers" dans le wizard YouTube.
- **`/playlists` URL directe** donnait "Petit problème" sur Firefox/Chrome MCP. Solution fiable : onglet "Playlists" dans l'onglet Contenus → ou le bouton "Créer → Nouvelle playlist" du header.

## ⚠️ BLOCKERS.md stales — vérifier le code avant de proposer — 2026-06-11
- **Pattern répété (3+ fois)** : des entrées BLOCKERS.md semblaient ouvertes mais étaient déjà fixées dans le code (beds24Amount, iCal null guard, smoke test Playwright, total_aberrant). Cause racine : le fix est appliqué mais l'entrée n'est pas fermée dans le même acte.
- **Règle dure** : avant de proposer un item BLOCKERS comme travail à faire, exécuter un grep/read de 30s pour confirmer que le problème existe encore. Si le code a déjà la fix → fermer l'entrée immédiatement.
- **Règle dure** : quand un fix est appliqué → fermer l'entrée BLOCKERS correspondante dans le MÊME élan, pas en clôture de session. Commit de code = fermeture BLOCKERS simultanée.

## 💶 `total < caution` = NORMAL pour les courts séjours — 2026-06-11
- **La caution (dépôt de garantie) est un montant FIXE**, indépendant de la durée du séjour. Un court séjour peut tout à fait coûter moins que la caution. **Ne JAMAIS flagguer `total < depot` comme aberrant.** Exemple validé : Zandoli/Mabouya court séjour 340€ < caution 500€ = légitime. Cette règle n'existe PAS dans `coherenceRules.js` et ne doit pas y être ajoutée.
- **Seuls les cas aberrants à flagguer** : `total <= 0`, `depot < 0`, `total > 50 000€`.

## Apps Script méthodes Auth-only = inutilisables depuis doGet/doPost anonyme — 2026-06-11
- **`ScriptApp.getProjectTriggers()` (et toutes les méthodes `ScriptApp.*` qui touchent les triggers) nécessitent une autorisation utilisateur.** Appelées depuis le endpoint web app anonyme (`doGet`/`doPost`) → HTTP 502. **Règle : toute fonction qui crée/supprime/liste des triggers doit être exécutée depuis l'éditeur Apps Script** (bouton ▶), jamais via `/api/sheets-proxy` ou HTTP direct.

## CF Pages secrets = write-only, inaccessibles localement — 2026-06-11
- **Les secrets CF Pages (`wrangler pages secret put`) sont write-only côté infra.** Impossible à lire via API Cloudflare, wrangler CLI, ou dashboard. La valeur n'est accessible que depuis une CF Function en runtime (`context.env.MA_CLE`). **Conséquence** : pour configurer un service tiers (ex. Resend, Stripe) qui nécessite la clé API, Vincent doit l'extraire depuis le dashboard du service tiers, pas depuis CF. Pour tester localement = `.dev.vars`.

## 💶 Prix : SOURCE UNIQUE = prix journaliers (onglet Tarifs) — 2026-06-05
- **À ne PLUS refaire : faire un devis / lire un prix depuis `biens.js prix` ou l'accroche « dès X€ ».** Ce sont des AFFICHAGES, pas le prix facturé. Le prix réel = les **prix journaliers** (`loadDailyPrices()` = `SEED_DAILY_PRICES` + overrides serveur `/api/site-config?type=prices`) que lit le tunnel. **Devis juste = lien tunnel `…/<bien>?checkin=&checkout=` OU onglet Tarifs OU onglet Devis.** Réf : `docs/PRICING.md`.
- **Cause racine du bug « 2 prix différents » (résolu 2026-06-05)** : un 2ᵉ prix éditable « Prix de base — site public » était fusionné côté public dans `localStorage["amaryllis_prices"]` avec un **format incompatible** (`{bienId:nombre}` vs `{bienId:{date:prix}}`) → collision. **Fix : champ supprimé ; accroche = AUTO (min des prix journaliers, bornée par `biens.js prix`) ; `biens.js prix` = plancher réel + fallback SEO.** Source unique = le calendrier des tarifs.
- **`biens.js prix` = le PLANCHER réel** (min des tarifs), pas un nombre marketing. À ré-aligner si les tarifs changent fortement (sinon le SEO « dès X€ » dérive).

## 🔄 Sync iCal → Sheet & notifications (Worker amaryllis-ical-sync) — 2026-06-05
- **🔴 Apps Script SUPPRIME le body des POST (bug redirect Google).** Tout `fetch(APPS_SCRIPT_URL,{method:"POST",body})` direct n'écrit RIEN. Le Worker `pushToSheets` faisait ça → résas iCal jamais écrites dans le Sheet. **Règle : pour écrire dans le Sheet, TOUJOURS via `/api/sheets-proxy` (forwardChunked = GET paginé), jamais POST direct.**
- **Cron iCal : horaire → toutes les 15 min** (`*/15 * * * *`) ; le `else` du handler `scheduled()` l'attrape.
- **Notif nouvelle résa = email (Resend) + push (ntfy)** : push ntfy AJOUTÉ dans `sendNouvellesResas` (avant : email seul). `NTFY_TOPIC` = `amaryllis-alertes-7r4k9`. Tél doit être abonné au topic + push OS autorisé.
- **iCal Airbnb/Booking ne transmet NI nom NI montant** → résa « Voyageur » / 0 € ; montant saisi ensuite (sauf Nogent = Beds24).
- **CLI wrangler instable ici** (`kv get/delete`, `tail` plantent) → pour tester un cron, **poller** (ntfy `/json?poll=1`, dashboard Resend) plutôt que manipuler le KV.

## Inventaire des capacités (skills/agents)
- **⚠️ ERREUR RÉPÉTÉE 3× DANS LA MÊME SESSION (2026-06-04).** J'ai conclu « ça n'existe pas » pour `/cloture-session`, PUIS `/auditeur`, PUIS `/consolidation` — les trois existaient déjà — parce que je grepais `~/.claude/skills/` au lieu de **lire la LISTE des skills disponibles** (system-reminder / Skill tool). Le grep ne voit pas les skills hébergées ailleurs. **RÈGLE DURE : avant de dire qu'une capacité manque OU d'en construire une, TOUJOURS scanner la liste des skills disponibles.** (Cf. RECALL.md, ligne « Skills / capacités ».)
- **Une skill (LLM) ne peut pas être appelée depuis bash.** Pour automatiser au déploiement un audit/une consolidation, il faut une **version déterministe en script** (`scripts/audit-invariants.mjs`) ; la skill reste pour le riche manuel. Pattern : skill = jugement piloté ; script = invariants déterministes greffés au gate.
- **Un hook `SessionStart` dans un repo sans `.claude/settings.json` préexistant ne se charge qu'après `/hooks` ou un redémarrage** (le watcher ne surveillait pas `.claude/` au démarrage). Le hook est correct, mais inerte la 1ʳᵉ fois.

## CSS / design — collision avec la règle globale `[data-surface="site"] h1`
- **Le CSS global `index.css` impose `[data-surface="site"] h1 { color: var(--fg-1) }` (navy foncé), spécificité (0,1,1).** Une page custom avec son propre `<style>` qui colore son titre de hero via une simple classe `.x-h1 { color: IVORY }` (0,1,0) **PERD** → titre navy foncé invisible sur hero sombre (vécu sur `/nos-partenaires` 2026-06-04). **Règle : tout h1 clair de hero doit soit être en `style={{ color: ... }}` inline (spécificité max), soit scopé `.x-hero .x-h1` (0,2,0) (+ `!important` au besoin), comme le fait déjà `GuidePOI` (`.gp-hero .gp-h1 !important`).** Les guides en inline-style sont safe ; vérifier toute NOUVELLE page custom à hero sombre. **⚠️ Re-frappé une 3ᵉ fois sur `TvScreen` (2026-06-04)** : un `<h1>` sur fond sombre qui compte sur `color` HÉRITÉ du parent (même via `style` sur le parent) est écrasé par la règle globale → **TOUJOURS mettre `color` directement sur le `style` du `<h1>`**, jamais hériter. Réflexe : à chaque `<h1>` clair sur fond sombre, écrire le `color` inline sur le h1 lui-même.
- **Débogage contraste = inspecter le *computed style* dans le navigateur, pas deviner.** `getComputedStyle(el).color` + énumérer `document.styleSheets` (selectorText + style.color) révèle la règle gagnante en 30s. Plus fiable que lire le source.

## Tracking GA4/Pixel — événement perdu après redirection Stripe (le « 0 purchase »)
- **`stripe.confirmPayment({ return_url })` sans `redirect:"if_required"` redirige TOUJOURS** (3DS quasi systématique en EU) → le code après `confirmPayment` (qui fire `purchase` avec le bon montant) **ne s'exécute jamais**. Le `purchase` doit fire sur la **page de retour** (`/merci`).
- **Sur la page de retour, `gtag` est chargé de façon ASYNCHRONE** (après restauration du consentement). Un `useEffect` qui fire `purchase` au mount avec `if (window.gtag)` **échoue silencieusement** si gtag pas encore prêt → événement perdu = **« 0 purchase »** alors que des résas directes existent. **Fix : retry jusqu'à ce que `window.gtag` existe** (setTimeout, ~10s max), dédup par `ga_purchase_fired_<pi>`.
- **Transmettre le contexte d'achat via `sessionStorage`** (`pending_purchase` posé au `begin_checkout` : value/bien/items) car la page de retour n'a plus le state React. NE PAS utiliser le montant de caution (`deposit_amt`) comme valeur du purchase.

## Édition de fichiers
- **Un linter modifie les fichiers entre `Read` et `Edit`** (vu sur `PROJECT_MEMORY.md` : Edit a échoué « file modified since read »). **La prochaine fois : re-`Read` juste avant l'`Edit` sur les gros fichiers .md, ou faire l'edit immédiatement après le read.**
- **Le quoting shell casse sur les apostrophes françaises** dans un `node -e '...'` (l'apostrophe de « L'état » ferme le quote). **La prochaine fois : écrire le script Node dans un fichier `/tmp/*.js` puis `node fichier.js`, plutôt que `-e` inline.**

## Admin / auth (onglets vides = bug récurrent résolu 2026-06-04)
- **Onglets admin (🐞 Bugs, backlog agents) « vides » sans message = token de session expiré → 401 silencieux.** Le token signé (`_adminauth.js`) avait un TTL de **12 h** ; passé ce délai, tous les GET admin renvoient 401, mais le front faisait `.catch(()=>setItems([]))` → liste vide trompeuse (la porte admin restait « ok » côté client). **Fix structurel anti-récurrence** : tout 401 sur `/api/*` (dans `apiFetch.js`, couvre `fetchJSON` + `adminFetch`) émet un event `admin-unauthorized` → `App.jsx` purge la session + rouvre `PasswordGate` (« Session expirée ») → ré-auth → token frais → onglets repeuplés (auto-réparant). + TTL 12h→7j + erreurs visibles dans les onglets.
- **Règle** : un GET admin qui peut 401 ne doit JAMAIS afficher une liste vide en silence — soit forcer la ré-auth, soit afficher l'erreur. Token en `sessionStorage` = perdu à la fermeture d'onglet (re-login attendu) ; ne pas confondre avec la porte mot de passe.

## CI / outillage
- **`wrangler ≥ 4.94` exige Node ≥ 22.** La CI GitHub était en Node 20 → l'étape `wrangler pages functions build` plantait (exit 1) **uniquement en CI** (local en Node 22 = OK). Fix : `node-version: "22"` dans `.github/workflows/ci.yml`. **Garder la version Node de la CI alignée sur l'env de dev.**
- **La CI ne tournait quasi jamais** (on pousse rarement sur GitHub car CF Pages = upload direct) → une casse latente n'est visible qu'au moment où on se met à pousser souvent. Pousser régulièrement = détecter tôt.
- **Lire un log CI sans `gh` ni token** : l'API GitHub publique donne le job/étape en échec (`/actions/runs/<id>/jobs`), mais le LOG détaillé nécessite auth → l'ouvrir dans le **navigateur** (Chrome MCP, déjà loggé sur GitHub) et `get_page_text` sur la page du run. Plus rapide que d'installer gh.

## SEO — vérifier sur le LIVE, jamais sur les sources (piège double-source, vécu 2× le 2026-06-04)
- **Un audit SEO basé sur la lecture des composants `src/*.jsx` est FAUX.** Le `<title>`, le JSON-LD, le sitemap, les meta sont produits au **prerender** (`scripts/prerender.mjs`) et/ou au **runtime** (`functions/[slug].js`), PAS dans les composants React. Un agent Explore a conclu « 25 POI hors sitemap / zéro JSON-LD / maillage non fait » → **les 3 étaient faux** (sitemap live = 63 URLs POI inclus ; destinations ET POI ont Article+Breadcrumb+FAQPage ; landings maillées). **Règle : pour juger l'état SEO, `curl` le live, pas grep le source.**
- **Piège grep n°2 : le JSON-LD POI est indenté** (`JSON.stringify(x, null, 2)` dans `buildArticleLd`) → `grep '"@type":"Article"'` (sans espace) renvoie 0 alors que l'Article EST là (`"@type": "Article"`). **Toujours un pattern tolérant** : `grep -oE '"@type":\s*"Article"'`. Les guides destinations utilisent un stringify compact → d'où l'incohérence trompeuse POI vs destinations.
- **Conséquence projet (juin 2026)** : la couche SEO technique (sitemap, JSON-LD Article/FAQPage/Breadcrumb, maillage, meta runtime) est **déjà en place et saine**. Le levier restant n'est pas technique mais : (a) **mesure réelle** (Search Console : positions/impressions), (b) **version EN** quasi absente (1 page), (c) ALT images. Ne pas reconstruire l'existant.

## Architecture du projet (rappels qui font gagner du temps)
- **`src/data/biens.js` = source unique des FAITS des 7 biens.** Changer un prix/capacité/note/coord = éditer CE fichier uniquement (consommé par functions/[slug].js, prerender.mjs, _biens.js, PublicSite.jsx). Ne plus jamais coder un fait de bien en dur ailleurs.
- **Pattern « logique pure testée + miroir GAS/Worker »** : la logique métier vit dans `src/utils/*.js` (testée vitest) PUIS est dupliquée inline dans Apps Script (clasp) et le Worker (esbuild) qui ne peuvent pas importer de modules Node. Modules concernés : pricing, coherenceRules, resaDedup, occupancy, rmOccupancyAdjust. **La prochaine fois que tu modifies un de ces utils : répercuter le miroir, sinon drift silencieux (cf. BLOCKERS).**
- **CF Pages = upload direct via wrangler, PAS git-connecté.** Pousser sur GitHub ne déclenche aucun déploiement (juste la CI). **Ne jamais déduire l'état de la prod depuis l'état de origin/main** (historiquement 70 commits de retard alors que la prod était à jour).

## Gouvernance mémoire
- **3 niveaux de mémoire à ne pas confondre** : `.memory/` (vive, curatée, début de session) · `PROJECT_MEMORY.md` (long terme détaillé) · `docs/` (livrables + index). Garder chacun dans son rôle ; archiver le journal daté dans `docs/_archive/` quand il dépasse ~10 entrées.

## 2026-06-05 — Emails Worker silencieusement cassés (RESEND_FROM)
- **Symptôme** : push ntfy reçu mais AUCUN email d'alerte résa (ni rappels prix, ni digest). Le Worker ne plante pas si Resend refuse → échec invisible.
- **Cause racine** : `env.RESEND_FROM` du Worker valait `Amaryllis <notifications@>` (domaine manquant) → Resend rejette tout avec « Domain not verified ». Le log Resend (request body) montre le `from` exact = clé du diagnostic.
- **Piège #1** : `wrangler secret put RESEND_FROM` n'a PAS corrigé → une **variable texte définie dans le dashboard Cloudflare prime sur le secret** du même nom. Ne pas supposer que le secret gagne.
- **Leçon** : ne jamais faire confiance à une var d'env d'adresse email. Valider le format dans le code et retomber sur une valeur vérifiée en dur. Pattern appliqué : `resendFrom(env)` (regex domaine FQDN sinon `VERIFIED_FROM`). Robuste quelle que soit la conf.
- **Diagnostic email** : toujours lire le **request body du log Resend** (montre `from`/`to`/erreur réels) — la dashboard "Loading…" ment, le log dit la vérité.

## 2026-06-05 (suite) — Chunks périmés + vérifier l'infra avant de construire
- **Chunk périmé après deploy** = page blanche silencieuse : l'ancien `index.html` en cache navigateur référence des bundles dont le hash n'est plus servi → `Failed to fetch dynamically imported module`. La prochaine fois : tout SPA à code-splitting DOIT avoir un handler `vite:preloadError` (+ filet `unhandledrejection`) qui recharge UNE fois (garde anti-boucle 30s). Fait dans `src/main.jsx`.
- **Toujours grep l'infra existante AVANT de coder une feature** : la demande « mots interdits pour les agents » était à 80% déjà là (`agent_lessons` D1 + endpoint CRUD `agent-lessons.js` + `loadLearnedLessons`). Il ne manquait que l'UI + l'injection prompt. Économie énorme en cherchant `interdit|banned|lesson` d'abord.
- **Détecter ≠ éviter** : une liste noire qui ne sert qu'au fact-check post-génération corrige après coup ; pour « rendre les agents plus précis » il faut **l'injecter dans le prompt** (contrainte négative en amont). Les deux ensemble = ceinture + bretelles.

## 2026-06-05 — Passe sur les bugs (inbox /api/client-errors)
- **L'inbox bugs mélange du SIGNAL et du BRUIT** : les entrées `kind:"console"` préfixées `[revue code]` viennent de l'agent LLM `/api/code-review` (revue du diff au déploiement) → **beaucoup de faux positifs**. Vérifié : tout le cluster `GuestGuide.jsx` (null-deref `buildSlides`/`tvParams`/TvScreen) était DÉJÀ gardé (lignes `if (loading) return` + `if (error || !guide) return` avant tout usage). `service-checkout.js` « exception handling » = déjà try/catch complet. **Règle : toujours relire le code AVANT de "corriger" un finding LLM** — ne jamais le prendre pour argent comptant.
- **`sessionStorage` peut JETER, pas seulement renvoyer null** : accéder à `window.sessionStorage` lève `SecurityError` quand le stockage est bloqué (navigation privée stricte, cookies tiers refusés, iframe sandbox). Un accès **au niveau render** (top de composant, `useRef(!!sessionStorage.getItem(...))`) = **white-screen de toute la page**. Les `localStorage` du projet étaient déjà en `catch {}` ; les `sessionStorage` avaient été oubliés. → helper `safeStorage` (ADR-S-013). Prochaine fois : tout web-storage gardé, surtout en render.
- **Triage des `kind` de l'inbox** : `console`/`[revue code]` = LLM (à vérifier) ; `coherence` = `/api/coherence-check` sur `direct_bookings` = **vraie anomalie data** (ex. résa avec dépôt > total) à traiter côté résa, pas code ; `report` = remontée manuelle (bouton « Signaler un bug »).
- **Un `report` "HTTP 401 sur /admin" n'est pas forcément un bug** : `apiFetch.js` gère déjà le 401 (`notifyUnauthorized` → ré-ouvre la connexion). C'est l'expiration normale du token de session admin, pas un crash.

## 2026-06-07 — Ads + iCal + Attribution

- **Budget Meta = ad set level, pas campagne** : avec 3 ad sets à €5/j chacun dans C1, le total était €15/j (pas €5/j). La prochaine fois : toujours vérifier combien d'ad sets actifs avant d'estimer le budget total.
- **Créer l'audience custom AVANT l'ad set MOFU** : l'audience "visiteurs 30j" n'existait pas → tentative d'assignation échouée silencieusement. Ordre correct : Audiences Manager → Custom → Website → 30j → sauver → puis créer/modifier l'ad set.
- **Google Ads en "apprentissage" ≠ dépense réelle = budget théorique** : C1 à €8/j n'a dépensé que €15 sur 30 jours (~€0.50/j réel). Baisser le budget théorique a peu d'impact immédiat. Laisser tourner 2-3 semaines avant d'optimiser.
- **Erreur Meta "Required field: link" est au niveau AD (créatif), pas ad set** : chercher dans Edit Ad → section Destination → Website URL. Ne pas chercher dans les paramètres de l'ad set.
- **iCal: les OTA (Airbnb, Booking) exigent que l'URL se termine par `.ics`** : un paramètre `?bienId=amaryllis` est refusé. Utiliser une route dynamique `[file].js` avec `params.file.replace('.ics', '')` est le bon pattern.
- **Toujours tester le Pixel fbclid/gclid en sessionStorage avec navigation privée** : `sessionStorage` lève `SecurityError` en mode strict (ADR-S-013 déjà appliqué). `trackingAttribution.js` wrappé en `try/catch` — penser à le vérifier sur toute implémentation future de web-storage.

## 2026-06-07 (suite) — Crash admin sur redesign Tarifs (circularité top-level)

- **Règle « zéro top-level » sur imports d'App.jsx** : tout `.filter()`, `.map()`, `Object.keys()` ou accès à un export d'App.jsx **DANS LE SCOPE MODULE** d'un fichier `src/tabs/*.jsx` = crash garanti à l'évaluation. App.jsx importe les onglets en haut (~ligne 15) AVANT d'exporter ses constantes (lignes 700+) → le module enfant voit `CAL_BIEN_IDS = undefined` et `.filter()` crash.  
  ✅ Safe : `import { CAL_BIEN_IDS }` + utilisation **DANS** le composant (JSX/fonctions) → React n'évalue qu'au render, quand App.jsx a fini.  
  ❌ Crash : `const FOO = CAL_BIEN_IDS.filter(...)` au top-level du module.  
  La prochaine fois : si je dois dériver une constante depuis un import App.jsx, c'est **dans le composant** ou **via un getter lazy**, jamais au top-level. Le pattern existant (CalendrierTarifs.jsx) ne fait JAMAIS d'opération top-level sur ses imports — c'est pour ça qu'il marche.

- **`npm run build` ne détecte PAS ce type de bug** : Vite/Rollup tree-shake et bundle sans exécuter React. Le crash se produit uniquement au runtime client. **Avant tout deploy d'un nouveau composant onglet, OBLIGATOIRE : `npm run dev` + ouvrir `/admin` dans Chrome avec console ouverte + cliquer sur l'onglet concerné.** Le smoke test deploy-pages.sh charge `/admin` mais ne déclenche pas le render React des onglets.

## 2026-06-10 — Meta AEM (Aggregated Event Measurement) en 2024-2026

- **L'écran de config AEM "8 event slots" n'existe plus dans l'interface Meta.** Présent jusqu'en 2023, il a été retiré de Events Manager Settings, Business Settings, et du dataset Overview. Ne pas passer du temps à le chercher.
- **AEM iOS 14+ = automatiquement couvert si** : (1) domaine vérifié dans Meta Business (Brand Safety → Domains), (2) Conversions API active pour l'event principal (Purchase). Ces deux conditions suffisent — le score qualité Meta le confirme (8.0/10 vs objectif 7.66).
- **Vérification domaine Meta = meta tag HTTP** : méthode la plus rapide (5 min). Token récupéré dans Business Suite → Brand Safety → Domains → Add → Create → copy `content=`. Coller dans `<head>` de `index.html`. Deploy. Cliquer "Verify". Résultat immédiat.
- **La vérification domaine débloque** : CAPI quality score · AEM attribution · audiences Pixel fiables. C'est un prérequis souvent oublié qui améliore silencieusement la mesure.

- **L'inbox `client_errors` D1 est le vrai diagnostic post-deploy** : quand le user a dit « erreur sur l'admin », `wrangler d1 execute revenue-manager --remote --command="SELECT * FROM client_errors ORDER BY last_seen DESC LIMIT 5"` m'a donné le message exact en 5 secondes (`Cannot read properties of undefined (reading 'filter')`). Reflex à conserver : avant de paniquer/rollback, **interroger `client_errors`** pour avoir le vrai message capté côté navigateur.

## 2026-06-07 (soir) — Chunk périmé v2 : SPA fallback + cache navigateur

- **`/* /index.html 200` est SAFE pour les routes SPA mais TOXIQUE pour `/assets/*.js`.** Tant que Cloudflare ne sait pas que tel asset n'existe plus, il applique le fallback → renvoie HTML avec content-type `text/html` au lieu d'un vrai 404 → navigateur reçoit HTML quand il attend du JS → erreur silencieuse. **Toujours mettre une Pages Function catch-all sur `/assets/*`** qui détecte ce cas (content-type text/html sur extension JS/CSS/etc.) et force un vrai 404.
- **Le filet `vite:preloadError` seul ne suffit pas.** Selon le navigateur (Safari iOS, Chrome Mobile), l'erreur n'arrive pas toujours sous forme de promesse rejetée. Compléter par : (a) un filet `unhandledrejection` avec une regex LARGE (8+ patterns incluant "is not a valid JavaScript MIME type"), (b) un monkey-patch `console.error` pour les cas où l'erreur est juste loguée. Centraliser les patterns dans une constante `STALE_CHUNK_PATTERNS`.
- **Toute occurrence de "is not a valid JavaScript MIME type" dans `client_errors` = signal rouge** d'un SPA fallback sur asset. À reflexer comme diagnostic prioritaire avant de chercher ailleurs.
- **Smoke test deploy doit tester un chunk SIMULÉ inexistant** (`/assets/__sentinel-stale-${ts}.js`) pour valider qu'on renvoie bien 404 (et pas 200+HTML). Sans ce sentinel, on peut casser la Pages Function `[[asset]].js` sans s'en apercevoir.

## 2026-06-08 — Promo codes checkout : beds24Amount ≠ Martinique

- **RÈGLE ABSOLUE : Beds24 = Nogent UNIQUEMENT.** (`MEMORY.md` project_beds24_scope.md). Les biens Martinique (amaryllis, zandoli, geko, mabouya, schoelcher) n'utilisent JAMAIS Beds24.
- **beds24-create.js est appelé pour TOUS les biens** dans `handleBook()`. Pour les biens Martinique, `cd.price` vaut `localAmount` (fallback ligne 166-167 de beds24-create.js) = notre `computedTotal`. La variable `beds24Amount` est donc en réalité `computedTotal` pour Martinique.
- **La logique promo est fonctionnellement correcte** (fallback → `amount` = `computedTotal` si `cd.price == 0`), mais le **nommage est trompeur**. À renommer `confirmedAmount` ou `chargeAmount` avec commentaire expliquant les deux cas.
- **À fixer prochain chantier** : renommer `beds24Amount` → `chargeAmount` dans `handleBook()` + ajouter un commentaire inline « Nogent: prix Beds24 confirmé / Martinique: notre calcul local ».

## 2026-06-12 — Audit visuel multi-agents + double-source SEO + pièges HTML

- **`lits` ≠ `chambres` dans les BIENS de PublicSite.jsx.** Deux champs distincts coexistent dans le tableau `BIENS` local de `PublicSite.jsx` : `lits` = total couchages (inclut canapé-lit, utilisé sur la carte du logement L3242) ; `chambres` = nombre de chambres stricto sensu (vient de `biens.js`, utilisé dans l'overlay de réservation L3962). Zandoli `lits:3` + `chambres:2` = cohérent (3 personnes dorment via 2 ch + canapé). **Ne jamais flagguer ce delta comme bug sans vérifier les deux champs.**
- **Audit visuel multi-agents = QA systématique.** Lancer 11 agents en parallèle (1 par page) via un workflow multi-agents détecte des incohérences HTML invisibles à la relecture de code (attributs `id` manquants, Iguana dans JSON-LD alors que bookable:false, VILLAS hardcodées en dehors de la source unique, photo placeholder en prod). Rentable en ~8 min vs des heures de revue manuelle. Pattern : 1 agent = 1 page = 1 rapport structuré → synthèse en loop.
- **`og:image:alt` doit avoir un `id` pour être ciblé par `injectMeta()`.** La fonction `injectMeta()` dans `functions/[slug].js` remplace des tags par regex sur le HTML brut. Si le tag `<meta property="og:image:alt">` n'a pas d'attribut `id`, aucune regex ne peut le cibler de façon fiable. **Pattern : ajouter `id="og-image-alt"` dans `index.html`, puis la regex cible `<meta id="og-image-alt"[^>]*>`.** À reproduire pour tout autre meta-tag qu'on veut injecter par page.
- **Bash glob casse sur les crochets dans un nom de fichier.** Dans `deploy-pages.sh`, le lint delta check fait un `grep` sur les fichiers modifiés puis boucle sur eux. `functions/[slug].js` contient `[slug]` qui est interprété comme un glob bash même entre guillemets dans certains contextes → le script plante. **Workaround : `SKIP_LINT=1 bash scripts/deploy-pages.sh`**. Fix propre = échapper les crochets ou utiliser `--` dans le grep. Puce de background créée (task_cef1560f).
- **Wikimedia `Special:FilePath/<nom-exact-du-fichier>` = URL directe CC0 pour les photos POI.** Pattern : `https://commons.wikimedia.org/wiki/Special:FilePath/Grande_Anse_des_Salines_(Sainte-Anne,_Martinique)_-_01.jpg`. Pas besoin de créer ni héberger la photo. Rechercher sur commons.wikimedia.org, copier le nom exact du fichier, composer l'URL. Licence CC0 = libre de droits.
- **Règle de déploiement réaffirmée : montrer les changements site public AVANT de committer.** (Rappel Vincent, acté dans LEARNINGS 2026-06-11 - voir entrée "Modifications UI publiques"). Cette session : 4 corrections textuelles présentées et validées avant déploiement ✅.

## 2026-06-10 — Audit, WhatsApp bot, emails automatiques

- **Toujours grep les placeholders dans les guides JSON avant de livrer.** `contacts[].phone = "+33 6 XX XX XX XX"` était en prod — voyageurs n'auraient pu joindre l'hôte en urgence. Pattern : après tout `Edit` sur un `public/guides/*.json`, lancer `grep -E "XX|TODO|TBD|placeholder" <fichier>`.
- **`Math.min(parseInt(str || "100") || 100, max)` = pattern correct pour params URL numériques.** `parseInt("abc")` = NaN, `Math.min(NaN, 500)` = NaN → erreur SQL D1. Le double fallback couvre chaîne vide ET NaN.
- **Le plan AI-Ops D1 peut se contaminer avec des modèles du mauvais provider.** Après un run AI-Ops, vérifier `SELECT v FROM ai_ops WHERE k='plan'` et contrôler que chaque modèle existe bien chez son provider déclaré (ex: `groq.smart` ne doit pas contenir `openai/gpt-oss-120b` = Cerebras).
- **Les findings `[revue code]` LLM = taux de faux positifs ~80%.** Sur 6 findings : 5 FP, 1 vrai (limit NaN). Avant de corriger : lire le code. Avant de déployer : marquer les FP en `ignored` dans `client_errors` D1 pour ne pas re-trier à la prochaine session.

## 2026-06-13 — Webhook Beds24, Pixel, Revenus Sheet

- **Toujours vérifier la version API utilisée dans CHAQUE endpoint, pas seulement dans le flux principal.** Le webhook `beds24-webhook.js` était resté en V1 (api.beds24.com/json + BEDS24_API_KEY/PROP_KEY) alors que tout le reste avait migré en V2. Les creds V1 n'existant plus en CF Pages → échec silencieux (aucune résa Nogent dans le Sheet).

- **Nogent n'est PAS dans le Worker iCal.** `getBookingUrls()` dans `workers/ical-sync/index.js` exclut Nogent (pas d'iCal Airbnb Nogent). Les **seuls chemins d'écriture Sheet pour Nogent** = webhook Beds24 + bouton 📊 admin. Si l'un est cassé → résa silencieusement perdue.

- **Meta Pixel consent-gating = race condition ViewContent.** `loadMetaPixel()` charge le pixel APRÈS acceptation cookies. `ViewContent` appelé avant = no-op (fbq pas encore dispo). Fix : dispatch `CustomEvent("meta-pixel-ready")` depuis `loadMetaPixel()`, ajouter listener `{ once: true }` aux call sites. Pour les URLs directes (click Meta Ads → `/amaryllis`), le fire ViewContent était totalement absent — l'ajouter dans le useEffect d'initialisation de la route.

- **`rebuildRevenus2026_` = DESTRUCTIF si le Sheet contient des données mixtes (système + manuel).** La fonction zéro TOUTES les lignes data des colonnes cibles AVANT de re-appliquer depuis les onglets source. Toute donnée saisie manuellement hors des onglets source (Airbnb historique, corrections, données hors-système) est définitivement perdue. **La prochaine fois : NE JAMAIS faire de zéro global sans avoir exporté une copie du Sheet.** L'alternative safe = trigger `syncRevenus2026` (mémo-based = incremental, jamais destructif).

- **Le trigger `syncRevenus2026` (15 min) est la seule voie safe pour les incréments.** Il utilise le mémo `rev2026_traites` pour ne traiter que les résas nouvelles, jamais les existantes. Il ne touche jamais les cellules qui n'ont pas de delta à appliquer. Utiliser TOUJOURS cette voie pour les nouveaux enregistrements ; la fonction rebuild est réservée à un reset total sur données 100% système.

- **Avant tout rebuild rétroactif sur un Sheet Google, demander : "ces données viennent-elles toutes d'un onglet source ?"** Si la réponse est "non" (données manuelles, corrections, imports externes), un rebuild qui zéro+reapply va détruire les données orphelines sans avertissement.
