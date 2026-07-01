# LEARNINGS — Enseignements réutilisables (locatif-dashboard)

> Pièges déjà rencontrés + comment les éviter. 1 entrée = 1 leçon actionnable « la prochaine fois ».
> Le journal d'erreurs exhaustif reste `../docs/ERREURS-LOG.md`.

## 🎯 Avant de proposer un barème chiffré (fidélité, promo, seuils), interroger les VRAIES données — pas une moyenne agrégée aveugle — 2026-07-01
- **Piège évité** : en préparant le barème du programme fidélité, `AVG(ltv_total)` groupé par `nb_sejours` montrait un LTV moyen de 9863€ pour les clients "3 séjours" — un chiffre qui aurait fait exploser n'importe quel palier basé dessus. En creusant (`SELECT ... WHERE nb_sejours >= 3`), ce chiffre était en fait UN SEUL client : Joël Bailleul, locataire longue durée Iguana (3400€/mois), pas un vrai repeat customer de courts séjours — sa LTV de 46090€ écrasait la moyenne des 4 autres clients réels (~572-969€ chacun).
- **La prochaine fois** : dès qu'une moyenne groupée sert de base à une décision chiffrée (barème, seuil, tarif), toujours vérifier la liste des lignes individuelles derrière un groupe à faible effectif (n<10) avant de s'y fier — un seul outlier structurel (bail long, résa test, doublon) peut fausser toute la proposition.

## 🎯 Avant de construire un nouveau mécanisme (parrainage, crédit, code promo…), vérifier si l'infra existe déjà à 90% — 2026-07-01
- **Contexte** : le programme de parrainage (Phase 3 fidélité) semblait nécessiter un système de codes + application de remise au checkout entièrement nouveau. Un grep rapide (`functions/api/promo-codes.js` + le champ "Code promo" déjà présent dans `PublicSite.jsx`) a montré que la validation, l'application de la remise ET l'incrément `used_count` au paiement (`stripe-webhook.js`) existaient déjà et fonctionnaient en prod.
- **La prochaine fois** : avant de concevoir un nouveau mécanisme de code/remise/crédit, chercher `promo_codes`/`validate=` dans le repo — la réutilisation (juste 2 colonnes ajoutées par migration : `referrer_client_id`, `reward_credited`) a réduit un "plus gros chantier" annoncé à quelques heures de travail.

## 🔴 OAuth Google multi-scope : chaque NOUVEAU scope doit être déclaré dans "Accès aux données" — sinon "insufficient authentication scopes" silencieux — 2026-07-01
- **Piège** : sur un projet Google Cloud qui a déjà un provider OAuth fonctionnel (ex: Gmail avec `gmail.readonly`), ajouter un DEUXIÈME provider avec un nouveau scope (ex: Calendar avec `calendar.events`) dans le code (`buildAuthUrl(env, state, scope)`) NE SUFFIT PAS — même avec l'API activée (Library) et l'utilisateur whitelisté (Audience/Test users). Il faut EN PLUS déclarer explicitement le nouveau scope dans **Google Auth Platform → Accès aux données → "Ajouter ou supprimer des niveaux d'accès"**. Sans ça, Google délivre quand même un token (le consentement a l'air normal, `accountEmail` est même correctement résolu) mais SANS le scope demandé — l'erreur n'apparaît qu'au premier appel API réel : `"Request had insufficient authentication scopes"`.
- **Symptôme trompeur** : la connexion semble réussie (statut `connected:true`, bon `accountEmail`), donc le réflexe naturel est de soupçonner un bug côté code (mauvais scope dans l'URL, mauvais provider stocké) — alors que le vrai problème est une case à cocher manquante côté Google Cloud Console.
- **Fix si déjà dans ce cas** : (1) ajouter le scope manquant dans Accès aux données → Save, (2) **supprimer la ligne D1 `oauth_tokens` du provider concerné** (`DELETE FROM oauth_tokens WHERE provider='X'`) pour forcer le bouton "Connecter" à réapparaître côté UI (sinon il reste sur "Sync" et ne redemande jamais le consentement), (3) re-cliquer "Connecter" pour obtenir un token frais avec le bon scope.
- **La prochaine fois** : avant même de tester un nouveau provider OAuth (Calendar, Drive, Sheets, ...), aller déclarer TOUS ses scopes dans Accès aux données AVANT le premier clic "Connecter" — pas après.

## 🔴 OAuth Google : activer l'écran de consentement ≠ activer l'API — 403 garanti si oublié — 2026-07-01
- **Piège** : créer l'écran de consentement OAuth + l'ID client dans Google Cloud Console ne suffit PAS. Il faut en plus activer explicitement l'API concernée dans **APIs & Services → Library** (ex: "Gmail API" → bouton "Activer"). Sans ça, tout appel API renvoie un **403** même avec un access_token valide et un consentement accepté — le premier réflexe (soupçonner le scope ou le refresh_token) est un faux chemin.
- **La prochaine fois** : après tout setup OAuth Google, avant de déboguer un 403, vérifier en premier `console.cloud.google.com/apis/library/<api>.googleapis.com` → statut "Activé" ou bouton "Activer" encore visible.

## 🎯 OAuth Google en mode Externe/Test : whitelister l'utilisateur AVANT de tenter le consentement — 2026-07-01
- **Piège** : un compte Google personnel (pas Workspace) ne peut pas passer l'écran de consentement en mode "Interne" — seul "Externe" est disponible. En mode Externe + statut "Test" (avant validation Google), **seuls les comptes explicitement ajoutés dans Audience → Utilisateurs tests** peuvent compléter le flow OAuth ; sinon Google bloque l'accès silencieusement côté utilisateur.
- **La prochaine fois** : avant de cliquer "Connecter" côté app, aller dans `console.cloud.google.com/auth/audience` et vérifier/ajouter le compte cible (ex: la boîte mail à connecter, si différente du compte propriétaire du projet Cloud) dans la liste des utilisateurs tests.
- **Point de vigilance à surveiller** : en mode Test (non "Production"), le refresh_token expire au bout de 7 jours — si Vincent voit "Gmail non connecté" réapparaître après une semaine, c'est probablement ça (voir `docs/GMAIL-SETUP.md` §Dépannage).

## 🎯 Cloudflare Pages : une variable d'env/secret ajoutée ne prend effet qu'au PROCHAIN déploiement — 2026-07-01
Ajouter/modifier une variable dans Settings → Variables and secrets ne l'injecte pas dans le déploiement en cours de prod — il faut redéployer (bouton "Retry deployment" sur le dernier déploiement, ou un nouveau push) pour que les Functions la voient. Signal : l'app renvoie encore l'ancien message d'erreur ("Secrets Google manquants") juste après avoir sauvegardé la variable dans le dashboard.

## 🎯 Computer-use : les navigateurs sont accordés en tier "read" — utiliser claude-in-chrome pour interagir — 2026-07-01
`request_access` sur un navigateur (Chrome/Safari/etc.) via l'outil `computer-use` ne donne qu'un accès lecture (screenshots) — clics/frappe bloqués par design. Pour naviguer/remplir des formulaires dans un navigateur, charger et utiliser les outils `mcp__claude-in-chrome__*` (navigate/computer/find/form_input) à la place, en créant un nouvel onglet dans le même profil Chrome (les cookies/session de l'utilisateur sont partagés). **Règle absolue conservée dans les deux cas** : ne jamais saisir un secret/token/mot de passe dans un champ, même via claude-in-chrome — laisser ces champs vides pour que l'utilisateur les remplisse lui-même.

## 🎯 Le plan AI-Ops (D1) prime TOUJOURS sur `MODELS` statique de `_llm.js` — 2026-07-01
`callLLM()` résout le modèle via `opts.model || plan.models?.[providerId]?.[tier] || MODELS[providerId]?.[tier]` — le plan D1 (construit par `/api/ai-ops` via discovery live + `RANK` de `ai-ops.js`) **écrase toujours** le fallback statique. Corriger `MODELS.groq` dans `_llm.js` après une dépréciation provider est nécessaire (filet de sécurité si le plan est absent/périmé) mais **insuffisant seul** — si le plan D1 existant référence encore l'ancien modèle, il continue à être utilisé jusqu'au prochain refresh (auto si `age_h > 20`, ou manuel `POST /api/ai-ops?secret=...&action=refresh`). **Réflexe après toute dépréciation Groq/provider : (1) corriger `RANK` dans `ai-ops.js` (retire l'entrée dépréciée) ET `MODELS` dans `_llm.js`, (2) forcer un refresh du plan, (3) vérifier `GET /api/ai-ops?secret=...` que le plan ne référence plus l'ancien modèle.** Vécu 2026-07-01 : `medium` pointait encore vers `llama-3.3-70b-versatile` dans le plan D1 malgré la correction statique, jusqu'au refresh manuel.

## 🎯 `GROQ_MODELS` dans `agents-run.js` = code mort, ne pas le confondre avec le vrai routage — 2026-07-01
`functions/api/agents-run.js` déclare son propre tableau `GROQ_MODELS` (ligne ~413) qui n'est **référencé nulle part ailleurs dans le fichier** — vestige d'une ancienne implémentation. Le routage réel passe par `_llm.js` → `callLLM()` avec `AGENT_TIERS` (tier par agent) + `AGENT_PREFERRED_PROVIDER` (provider préféré par agent, ex: `community-manager` → `mistral` pour la qualité FR, PAS Groq) + `MODELS`/plan AI-Ops (modèle par tier). Avant de corriger un modèle dans `agents-run.js`, vérifier s'il est réellement consommé (`grep -n "GROQ_MODELS"`) — sinon la correction est cosmétique, sans effet.

## 🔴 D1 `db.exec()` casse tout DDL multi-lignes (saut de ligne = délimiteur) — 2026-07-01
- **Piège** : `env.revenue_manager.exec(\`CREATE TABLE ...\`)` avec un template literal multi-lignes fait planter le Worker (Cloudflare 1101 "threw exception") sur CHAQUE requête, GET compris — car `initTable()` s'exécute avant tout dispatch de méthode. Le plus trompeur : `CREATE TABLE IF NOT EXISTS` semble "sûr", mais D1 re-parse la requête cassée à chaque appel, table existante ou non.
- **Signal qui a permis de le débusquer** : `wrangler d1 execute --remote` (API HTTP D1) exécute la MÊME requête SANS problème — ça prouve que le SQL est valide, et isole le bug à la méthode `.exec()` du binding JS Workers spécifiquement (deux moteurs différents, pas le même parseur).
- **La prochaine fois** : ne JAMAIS écrire de DDL D1 en template literal multi-lignes. Toujours construire la requête en **une seule ligne** via concaténation `+` (chaque colonne = un fragment de string, comme dans `client-errors.js`/`voyageur-feedback.js`) — c'est déjà la convention établie dans 2 fichiers du repo, `maintenance.js` avait juste dévié.
- **Debug efficace** : quand un endpoint D1 renvoie une page HTML (`error code: 1101`) au lieu de JSON, tester le payload minimal (`{}`) et un GET simple d'abord — si même un GET basique plante, le problème est dans l'init/setup partagé (avant le dispatch de méthode), pas dans la logique métier spécifique.

## 🗓️ Calendrier réservation — le "checkout confirmé" doit primer sur "date bloquée" au rendu — 2026-06-30/07-01
- **Piège (suite du fix ADR précédent)** : après avoir autorisé une date bloquée comme date de DÉPART valide (jour de turnover), un second bug est apparu : au rendu SUIVANT la confirmation, `checkout` n'est plus `null` → `pickingCheckout` redevient `false` → le check `blockedSet.has(ds)` reprend la main AVANT le check `ds === checkout` → la date se réaffiche comme "bloquée" alors que la sélection interne reste valide. Symptôme : "les dates sont bien sélectionnées mais le 14 se désélectionne visuellement".
- **La prochaine fois** : dans une state machine de rendu avec plusieurs conditions qui se chevauchent (bloqué / sélectionné / en cours de sélection), toujours vérifier "est-ce l'état FINAL déjà confirmé ?" en tout premier, avant toute règle de validité générique — sinon un état transitoire (`pickingCheckout`) qui redevient faux après confirmation fait perdre la priorité au bon état.

## 🐚 Boucles bash `for x in $VAR` non fiables dans ce tool — préférer les appels explicites — 2026-07-01
- **Piège** : `for b in $CLIM_BIENS; do curl ... done` (avec `CLIM_BIENS="amaryllis zandoli iguana..."`) n'a itéré qu'UNE fois, avec `$b` contenant la chaîne entière non découpée → création d'entrées avec un `bien_id` invalide ("amaryllis zandoli iguana geko mabouya schoelcher" comme une seule valeur).
- **La prochaine fois** : pour créer plusieurs entrées via API en une session, faire un appel Bash **séparé et explicite par entrée** (pas de boucle shell sur une liste espacée) — plus verbeux mais fiable à 100%, et permet de vérifier chaque résultat individuellement.

## 🎯 Google Ads via automatisation Chrome — toujours réauditer après publication — 2026-06-30
- **Piège** : le wizard de création de campagne Google Ads peut crasher silencieusement ("Un problème est survenu") et perdre le brouillon entièrement (campagne disparue de Brouillons ET Campagnes) sans message d'erreur clair. Pire : même une fois republiée avec succès, des champs configurés pendant le wizard peuvent diverger une fois la campagne réellement live — vécu sur "Géko - Location Martinique" : la case "Limite d'enchère au CPC maximale" était décochée (alors que cochée+remplie pendant le wizard) et la zone géographique avait "France" en plus de "Canada" (jamais demandé).
- **La prochaine fois** : ne JAMAIS faire confiance à ce qui a été saisi pendant le wizard de création. Après publication, toujours rouvrir la campagne et auditer champ par champ via les sous-pages dédiées (Paramètres de la campagne, Zones, Langues, Mots clés, Annonces, Groupes d'annonces) — pas juste la page de vérification finale du wizard qui peut afficher des résumés obsolètes ("Annonces: Aucune" alors que les annonces existent bien).
- **Piège secondaire** : un retry après crash peut créer des **doublons silencieux** (2 groupes d'annonces quasi-identiques sur Géko) — vérifier aussi la structure (nb de groupes d'annonces) pas seulement le contenu des champs.
- **Popup "Confirmez votre identité"** apparaît systématiquement au moment de publier/sauvegarder certaines actions sensibles — Claude ne peut jamais la valider (règle absolue), il faut la passer la main à Vincent et reprendre la vérification après.

## 🏠 Firecrawl airbnb.fr → fichier toujours trop gros — 2026-06-30
- **Piège** : `firecrawl_search site:airbnb.fr` retourne des fichiers de 100-260 k chars → overflow automatique dans un fichier texte, jamais lisible directement.
- **La prochaine fois** : grep le fichier résultant immédiatement — `grep -oE "https://www.airbnb.fr/rooms/[0-9]+"` pour extraire les URLs, puis `grep -B5 "room_id"` pour les titres. Ne jamais lire le fichier en entier.

## 🚫 Ton propre listing peut apparaître dans une recherche concurrent — 2026-06-30
- **Piège** : lors du search Mabouya jacuzzi, le premier résultat était `rooms/1046596752160926069` = "Mabouya | Jacuzzi privatif" = le listing Airbnb de Vincent lui-même.
- **La prochaine fois** : avant d'ajouter un concurrent, vérifier que le nom ne correspond pas à un bien de la résidence (Amaryllis / Iguana / Zandoli / Géko / Mabouya / Schœlcher / Nogent).

## 🔄 `import-listings` est un UPSERT sûr — 2026-06-30
- **Fait** : `/api/rm-competitors/import-listings` fait un `COALESCE((SELECT id ... WHERE property_id=? AND platform_listing_id=?), ?)` → si le listing existe déjà, il est mis à jour sans perte des snapshots de prix liés. Safe à relancer plusieurs fois.

## 🔍 Vérifier le code AVANT d'implémenter une "amélioration" — 2026-06-29
- **Piège** : proposer 7 améliorations SEO/perf → 5/7 étaient déjà en place (FAQ Schema, preload hero, Fonts preconnect+swap, Nogent SEO). Implémenter sans vérifier = travail en double ou régression.
- **La prochaine fois** : grep/read EN PARALLÈLE pour chaque item avant de coder. 5 min de vérif évitent 30 min de "fix" inutile.

## 🔗 Logo header = `<a href="/">`, jamais `<button onClick>` — 2026-06-29
- **Piège** : logo en `<button onClick>` → Google ne suit pas les onClick JS, aucun PageRank transmis vers la home.
- **La prochaine fois** : tout élément nav qui pointe vers une URL = `<a href>`. Si le bouton ouvre aussi un dropdown, séparer le `<a>` du bouton `▾`.

## 🤖 noindex = double couche (prerender statique + runtime Functions) — 2026-06-29
- **Piège** : CF Pages Functions exécute `injectMeta()` à chaque requête et peut écraser un `<meta robots>` injecté uniquement par prerender.
- **La prochaine fois** : tout meta critique (noindex, canonical) = injecté dans les DEUX couches. Sinon survivance non garantie selon le chemin de serving CF Pages.

## 🔧 manualChunks vite + lazy() = piège Rolldown (leaflet sur critical path) — 2026-06-29
- **Piège** : épingler un paquet dans `manualChunks` (ex. `"leaflet"`) force Rolldown à créer une référence statique depuis l'entry chunk pour satisfaire le graphe de modules — même si tous les imports consommateurs sont derrière `lazy()`. Résultat : modulepreload + CSS render-blocking sur toutes les pages.
- **La prochaine fois** : ne pas mettre dans `manualChunks` les paquets qui sont UNIQUEMENT importés par des composants lazy. Les laisser suivre naturellement leurs chunks lazy. Vérifier : `grep "leaflet" dist/index.html` après build → doit retourner 0.

## 🔒 Tout endpoint avec écriture D1 publique = rate limit obligatoire — 2026-06-29
- **Piège** : `sign-contract.js` stockait des PNG base64 (~300 Ko) dans D1 sans rate limit → flood possible (mail + remplissage D1 + pollution base contrats).
- **La prochaine fois** : avant tout endpoint public qui écrit en D1 ou envoie un email, ajouter `rateLimit(db, { key: \`prefix:\${ip}\`, limit: N, windowSec: 3600 })`. Pattern = `_ratelimit.js` déjà présent et réutilisable.

## 📋 hreflang : cluster many-to-one = invalide Google — 2026-06-29
- **Piège** : pointer plusieurs pages FR vers une même page EN (`/villa-rental-martinique`) via hreflang crée un cluster invalide ignoré par Google.
- **La prochaine fois** : hreflang EN uniquement si la page EN existe vraiment en 1:1. Sinon, ne garder que `fr` + `x-default`. Les fiches biens n'ont pas de page EN by-property.

## 📦 prerender.mjs @graph VacationRental = conditionner au type de page — 2026-06-29
- **Piège** : le marqueur `<!--SEO_RENTALS_GRAPH-->` était remplacé inconditionnellement → 6 `VacationRental` injectés sur chaque guide/article. Données produit sur page éditoriale = risque action manuelle Google.
- **La prochaine fois** : toute injection JSON-LD de type produit doit être conditionnée à `routePath === "/" || BIEN_SLUGS.has(slug)`.

## ♿ WCAG 2.1 tunnel réservation — 3 patterns à retenir — 2026-06-29
- **Calendrier** : les cellules jours cliquables DOIVENT avoir `role="button"` + `tabIndex=0` + `onKeyDown (Enter/Space)` + `aria-label` + `aria-disabled`. Sans ça = invisible aux AT et clavier.
- **Modales** : `role="dialog"` + `aria-modal="true"` + `aria-labelledby` sur le container interne (pas l'overlay). Sans ça le SR lit le fond pendant que la modale est ouverte.
- **Erreurs dynamiques** : `role="alert"` + `aria-live="polite"` sur les div d'erreur → annonce automatique aux AT sans déplacement de focus (WCAG 4.1.3).

## 🔴 gtag("event", "purchase") + window.location.href = race condition mortelle — 2026-06-29
- **Piège** : appeler `window.gtag("event", "purchase", {...})` puis `window.location.href = "/merci"` dans la même tick JS → le browser annule les requêtes XHR/beacon en cours avant qu'ils partent → 0 events GA4, 0 conversions Google Ads.
- **Symptôme** : event absent du top-events GA4 sur 28j (confirmé console GA4 2026-06-29 après 2 semaines de campagnes 253€/488 clics).
- **La prochaine fois** : utiliser `event_callback` pour déclencher le redirect APRÈS confirmation d'envoi. Pattern :
  ```js
  let done = false;
  const go = (tracked) => { if (!done) { done = true; if (tracked) ssSet(guardKey, "1"); window.location.href = "/merci"; } };
  window.gtag("event", "purchase", { ..., event_callback: () => go(true) });
  setTimeout(() => go(false), 800); // failsafe si callback ne revient pas
  ```
  La guardKey est posée DANS le callback (pas avant) → si timeout sans callback, Merci.jsx peut retenter.
- **Corollaire** : toujours vérifier dans GA4 Events que l'event apparaît (au moins 1 fois) avant de croire que le tracking est OK. `purchase` absent du top-10 sur 28j = signal d'alarme immédiat.

## 🔍 GA4 pour diagnostiquer un tracking brisé — 2026-06-29
- **La prochaine fois** : aller dans GA4 → Rapports → Événements → voir si `purchase`/`begin_checkout` apparaissent. Si absent du top-10 sur 28j avec un trafic significatif → tracking entier cassé, pas juste "peu de ventes".
- **Indicateur clé** : "Événements clés = 0 (-100%)" sur la vue d'ensemble GA4 = aucun event de conversion n'est tagué comme Key Event. Vérifier aussi dans GA4 Admin → Key Events.

## 📅 GAS : les cellules Date sont des objets JS, pas des strings — 2026-06-27
- **Piège** : `r[4]` (colonne checkin) dans GAS retourne un objet `Date` JS, pas une chaîne. `String(dateObject)` → "Sat Aug 15 2026 00:00:00 GMT+0000 (UTC)" → `parseInt` sur les 4 premiers chars = NaN.
- **La prochaine fois** : toujours tester `if (raw instanceof Date)` et utiliser `Utilities.formatDate(raw, "UTC", "yyyy-MM-dd")`. Sinon `String(raw || "")` pour les autres types. Affecte toutes les fonctions GAS qui lisent des colonnes de dates (`deleteReservation_`, `cancelReservations_`, etc.).

## ⚡ CF Pages Function : `context.waitUntil` pour GAS en background après webhook — 2026-06-27
- **Pattern** : webhook Beds24 doit répondre vite (timeout 10s). GAS `rebuildRevenus` prend >5s → répondre 200 immédiatement, puis pousser le rebuild en background avec `context.waitUntil(Promise.all(jobs))`.
- **La prochaine fois** : chaque fois qu'une Pages Function reçoit un webhook et doit déclencher une opération lente (GAS, sync longue), utiliser `context.waitUntil` avec `fetch(sheetsProxy, ...)` → le CF runtime maintient la Function vivante jusqu'à la fin du rebuild, sans bloquer la réponse.

## ⏱ GAS via proxy CF = timeout sur opérations lourdes — 2026-06-27
- **Piège** : `cancelReservations_` (delete + rebuild en 1 appel GAS) appelé via `/api/sheets-proxy` → 502 timeout. Pages Functions ont un timeout court.
- **La prochaine fois** : pour les appels manuels Claude, TOUJOURS séparer en 2 : `deleteReservation` puis `revenus2026RebuildBienApply`. Le Worker appelle GAS directement (pas via proxy) → pas de timeout pour les vraies annulations auto.

## 🔴 GAS revenus : revenus2026FromMonth(ignoreMemo:true) = INTERDIT — 2026-06-27
- **Piège vécu (grave)** : appeler `revenus2026FromMonth` avec `ignoreMemo:true` quand des cellules ont déjà des valeurs → double-compte TOUT (18 IDs, juin-déc, tous biens). Symptôme : "5 résas alors qu'il y en a qu'une, 12 jours au lieu de 2".
- **La prochaine fois** : utiliser UNIQUEMENT `revenus2026RebuildBienApply` (zero + recalcul idempotent). La fonction `ignoreMemo` est maintenant BLOQUÉE côté GAS (retourne une erreur 400). `patch-booking.js` utilise désormais `RebuildBienApply`.

## 🔴 GAS cancelReservations : syncRevenus2026 ne soustrait pas — 2026-06-27
- **Piège** : l'ancien `cancelReservations_` appelait `revenus2026Forget + syncRevenus2026` après suppression. `syncRevenus2026` est additif (ajoute des deltas), ne soustrait jamais → revenus restaient au niveau pré-annulation.
- **La prochaine fois** : après suppression d'une résa, toujours appeler `rebuildRevenus2026_(true, month, bienId)` pour le bien+mois affecté. `cancelReservations_` fait maintenant ça automatiquement (capture cols A+B+E avant delete, rebuild par bien/mois).

## 🔑 Accès admin Claude : CLAUDE_SECRET Bearer — 2026-06-27
- Toute session peut maintenant appeler les endpoints admin directement : `Authorization: Bearer <valeur dans .memory/claude_secret.md>`.
- Créé en Cloudflare Pages prod+preview + .dev.vars. Code dans `functions/api/_adminauth.js` (verifyBearer priorité 2).

## 🚫 CF Workers : `cache: "no-store"` + `cf: { cacheTtl: 0 }` = incompatibles — 2026-06-28
- **Piège** : combiner les 2 dans un `fetch()` CF Workers lance une exception silencieuse → l'email ne part jamais, aucun log D1 (le crash est avant `sendEmail`).
- **La prochaine fois** : pour bypass cache CF dans un Worker, utiliser SOIT `cache: "no-store"` SOIT `cf: { cacheTtl: 0, cacheEverything: false }`, jamais les deux ensemble. Le `?cb=Date.now()` dans l'URL suffit pour un cache-bust léger.

## 📸 Editorial : le brief LLM DOIT imposer l'imageUrl EXACTE, pas un hint — 2026-06-27
- **Piège vécu (3j)** : les briefs disaient "utilise une vraie photo de ce bien" → le LLM inventait des URLs plausibles mais inexistantes (`/images/schoelcher-vue-panoramique.jpg` au lieu de `/photos/schoelcher/01.webp`) → Meta rejetait avec "image not found".
- **La prochaine fois** : dans tout brief générant un draft social_post, inclure `RÈGLE ABSOLUE : imageUrl DOIT être EXACTEMENT "https://villamaryllis.com/photos/{bien}/01.webp"` — le LLM doit copier-coller, pas interpréter. En plus, post-processing : après génération, vérifier/corriger l'imageUrl en D1 avant d'approuver.

## 🔍 Fact-check : les patterns D1 `agent_lessons` doivent avoir des word boundaries \b — 2026-06-27
- **Piège vécu** : pattern `villa` (sans `\b`) stocké dans `agent_lessons` pour `schoelcher` bloquait aussi `villamaryllis.com` dans les URLs des captions. Le domaine contient "villa" mais ce n'est pas l'intention de la règle.
- **La prochaine fois** : tout pattern d'interdiction de mot isolé = `\bvilla\b`, `\bapartement\b`, etc. (word boundaries). Vérifier via un test regex avant d'insérer dans `agent_lessons`. Et : `factCheckCaption()` strip maintenant les URLs avant de checker (même protection côté code).

## 📅 iCal Worker : stocker {uid, checkout}, pas juste uid — 2026-06-27
- **Piège vécu** : Géko a reçu une fausse alerte d'annulation (UID dont le préfixe était le même qu'une résa terminée). Root cause : KV stockait des UIDs sans date → impossible de savoir si la résa était terminée ou si Airbnb avait juste roté l'UID.
- **La prochaine fois** : `ICAL_STORE` key `uids:{bienId}:{canal}` = array de `{uid, checkout}`. Deux filtres à appliquer avant de marquer une annulation : (1) même préfixe (avant `-`) dans les résas actuelles = rotation UID ignorée ; (2) checkout < today = séjour terminé ignoré. Backward-compatible : old strings → `{uid, checkout: null}`.

## 🗺️ Apple Business Connect : fuseaux + photo de couverture + 2 validations séparées — 2026-06-26
- **Martinique (America/Martinique) absente** de la liste Apple. Utiliser "Amérique/Porto Rico (GMT -04:00)" = UTC-4 sans DST, identique en pratique.
- **2 validations séparées** : (1) validation org (business entity, SIRET/Kbis + DNS TXT) — peut prendre ≤5j ouvrés. (2) validation emplacement (Apple vérifie l'existence physique) — soumis en avril pour résidence Amaryllis, peut prendre plus longtemps. Les 2 avancent indépendamment.
- **Photo de couverture** : minimum 1600×1040 px, formats PNG/JPG/HEIF. Convertir avec `sips /path/in.webp --out /path/out.jpg -s format jpeg -s formatOptions 90`. Photos géko 16-23 (`public/photos/geko/`) = 2000×1125, idéales.
- **Ne jamais confondre résidence Amaryllis et Villa Amaryllis** : la fiche "résidence Amaryllis" = le complexe (Zandoli, Géko, Mabouya, Schœlcher). Photo de couverture = complex, PAS la piscine villa.
- **La prochaine fois** : avant d'uploader un logo ou une photo via Apple Business, vérifier que c'est bien le bon bien — l'UI Apple ne prévient pas des erreurs de contexte.

## 🏷️ RM : passer `daily_floors` au `/calculate` = pattern correct pour respecter les prix réels — 2026-06-26
- **Pattern validé** : passer `{ daily_floors: { "2026-07-01": 280, ... } }` dans le body du POST `/api/rm-recommendations/calculate` → `calcDateReco` reçoit `calFloorCents` comme 5ème couche du `hardFloor`. D1 stocke les vraies valeurs.
- **La prochaine fois** : tout recalcul RM depuis le frontend doit inclure `daily_floors: calendrierPrices` (bien seul) ou `allPrices[bienId]` (bulk). Si un cron côté Worker doit recalculer, il devra charger les prix depuis une autre source (seedPrices.js n'est pas disponible server-side) → à prévoir si besoin.
- **Ne pas confondre avec l'UI-floor** (`effectiveCents()`) qui reste utile pour les recos pré-existantes en D1 avant ce fix.

## 🏷️ RM D1 `rm_properties` : base_price_* = NULL par défaut — plancher = siteMinCents seulement — 2026-06-26
- **Découverte** : tous les champs `base_price_low/mid/high`, `price_min`, `price_max` = NULL dans `rm_properties` (jamais configurés). Le moteur `calcDateReco` remplace les NULL par 0 → `hardFloor = max(0, 0, siteMinCents, 0) = siteMinCents` (prix biens.js uniquement). Le fix `basePrice` dans `hardFloor` (session précédente) était sans effet car `base_price_mid = NULL → 0`.
- **La prochaine fois** : pour que les recos RM respectent les saisons, 2 options — (A) Alimenter `rm_properties` avec la grille via `/api/rm-properties` (Bearer auth + JSON) ; (B) Plancher UI-side via `loadDailyPrices` (option choisie 26/06). Option B = 0 D1 touch, toujours à jour avec le CalendrierTarifs réel.

## 🏷️ RM `/api/rm-properties` : auth = Bearer token (session) pas `?secret=` — 2026-06-26
- L'endpoint `/api/rm-properties` utilise `verifyBearer` (token de session `ldb_tok`) et non `?secret=POSTSTAY_SECRET`. Pour l'appeler en curl → extraire le `ldb_tok` depuis sessionStorage admin après login.

## 💰 Revenus Apps Script : toujours lire la cellule AVANT de patcher — 2026-06-26
- **Piège vécu** : Géko airbnb juin avait Rabia (378.3€) déjà en cellule. Appel `manualPatch add 378.3€` → doublon à 756.6€. Seule Esméralda (320€) manquait réellement. Fix : set à 698.3€ = 320 + 378.3.
- **La prochaine fois** : avant tout `mode=add`, appeler `mode=add&value=0` pour lire le "before". Confirmer que la valeur en cellule = ce qu'on pense, PUIS faire le vrai add.

## 💰 Revenus Apps Script : division égale par mois pour longs séjours — 2026-06-26
- **Piège** : implémentation initiale utilisait prorata par nuits → résultats non entiers (985.71€ au lieu de 975€). Vincent a explicitement rejeté.
- **La prochaine fois** : séjour long (>30 nuits) = `equalShare = Math.round(montant / nMonths * 100) / 100` sur chaque mois touché. Logique identique dans les deux GS (`applyOne_` 2026 et `applyOne27_` 2027) — si on modifie l'un, modifier l'autre.

## 💰 Revenus Apps Script : MIN_AUTO_MONTH=6 — les arrivées avant juin jamais auto-traitées — 2026-06-26
- `syncRevenus2026_()` ignore les arrivées < juin même après `PurgeZero`. Pour corriger une résa avec arrivalMonth < 6 : soit `revenus2026ManualPatch_` (cellule unique), soit `rebuildRevenus2026_(apply, fromMonth, bienFilter)` (rebuild chirurgical par bien).

## 💰 Revenus Apps Script : le memo empêche le re-sync des résas supprimées — 2026-06-26
- Supprimer une résa du Sheet via `deleteReservation` NE retire PAS son ID du memo → le sync ne la retraitera jamais. C'est voulu pour les annulations (ex: Amaryllis Booking déc annulée → reste à 0€ même si l'iCal la repousse).
- Si on veut forcer le re-traitement d'une résa → purger son ID du memo (`revenus2026PurgeZero_` ou DELETE D1 direct).

## 🎨 SubTabBar dans primitives.jsx, jamais inline — 2026-06-25
- **Piège** : Charges et Pilotage avaient chacun leur propre pill de sous-onglets avec des styles légèrement différents (accent `#ef4444` vs `#0ea5e9`, padding divergent).
- **La prochaine fois** : tout sous-onglet admin = `import { SubTabBar } from "../primitives.jsx"`. Props : `tabs=[{id, label}]`, `active`, `onChange`, `accent` (optionnel, défaut `#0ea5e9`). Jamais recoder les boutons pills inline.

## 🧭 Nav admin : tout nouvel onglet → ranger dans les 6 groupes existants — 2026-06-25
- Structure actée : **Quotidien** (usage quotidien Cockpit+Planning+Ménage+RevMgr+Tarifs) · **Opérations** (logistique+outils+comms) · **Finance** · **Analyses** · **Marketing** · **Admin** (IA+Équipe).
- **La prochaine fois** : avant d'ajouter un onglet, identifier d'abord le groupe. Si aucun ne convient → soulever la question, pas créer un 7ème groupe de suite.

## 🗂️ Déduplication d'onglets admin : vérifier la donnée avant de créer un onglet — 2026-06-24
- **Piège** : "CPA canal" et "Canaux 2025" dans Pilotage étaient des doublons (Historique > Canal 2025 avait déjà les mêmes données REVENUS_CANAL_2025 ; CPA canal réutilisait les mêmes résas live que Canaux live).
- **La prochaine fois** : avant d'ajouter un onglet ou un sous-onglet avec des données, vérifier si (1) ces données n'existent pas déjà dans un autre onglet/groupe et (2) si la différence de contexte (filtering, métrique) justifie vraiment la coexistence. Si la seule différence est cosmétique → intégrer comme sous-tab.
- **Règle** : 1 source = 1 endroit d'affichage principal. Les autres vues = sous-tabs du même onglet parent, pas des onglets frères.

## 📇 Recouper des contacts : clé = téléphone normalisé, JAMAIS le nom — 2026-06-24
- **Piège vécu** : recouper guest_contacts × Sheet par nom voyageur → faux positifs en cascade (« Ary »→« Gird**ary** Élodie », « lemaya »→« **Jean** François », « Laure »→« **Laure**nt Billon »). Un token de prénom commun suffit à matcher 2 personnes différentes.
- **La prochaine fois** : recoupement/dédoublonnage = **téléphone normalisé (9 derniers chiffres significatifs : retire indicatif +33/+596/+590 et le 0 local → mobiles FR/MQ/GP convergent)** + email exact. Le nom = signal d'appoint à confirmer humainement, jamais clé d'écriture automatique. Surtout ici : contacts WhatsApp nommés « Prénom + Bien » (pas de nom de famille) = inappariables aux noms complets du Sheet.
- **Corollaire fusion** : ne jamais fusionner 2 contacts en masse sur match de nom → fusion manuelle validée (l'onglet montre les candidats, l'humain tranche).

## 🟢 WhatsApp Web : `get_page_text` du panneau infos > screenshots — 2026-06-24
- Pour extraire en masse depuis WhatsApp Web (Chrome MCP) : ouvrir la conversation, cliquer l'en-tête (panneau « Infos du contact »), puis **`get_page_text`** → renvoie le **numéro de téléphone** + tout l'historique texte en 1 appel, fiable et bien plus rapide que des screenshots à lire.
- Pièges : (1) recherche par nom complet imprécise → taper le nom + **attendre 2 s** avant de cliquer le 1er résultat (sinon clic sur la liste pas encore filtrée → mauvais contact) ; (2) si le panneau infos reste ouvert, un re-clic sur le résultat peut être nécessaire (décalage) — `get_page_text` révèle toujours QUI est ouvert, donc vérifier le nom avant de noter. (3) Historique ancien non chargé (« récupérer les anciens messages du téléphone ») → la **période est souvent dans le NOM du contact** (« Locataire Zandoli Juillet »), pas dans la conversation.

## 🏷️ Injecter de la meta SEO = RETIRER celle du shell d'abord (sinon double balise) — 2026-06-23
- **Piège vécu** : `functions/article/[slug].js` ajoutait `og:image/og:title/canonical` sans retirer ceux du shell prérendu → 2 balises og:image, le crawler prend souvent la 1ère (= défaut amaryllis, fausse).
- **Piège dans le piège** : le 1er regex `<meta\s+property="og:image"` ne matchait pas car le shell a `<meta id="og-image" property="og:image">` (id AVANT property). **Toujours `<meta\b[^>]*\bproperty="..."` (ordre des attributs libre).**
- **La prochaine fois** : toute injection meta runtime doit STRIP les balises homonymes du shell (title, description, og:*, twitter:*, canonical) avant d'ajouter les siennes. Vérif live : `curl … | grep -c 'property="og:image"'` doit valoir 1.

## 🗺️ Sitemap d'un contenu D1 : dumper le statut depuis D1, jamais lire le seed SQL — 2026-06-23
- **Piège vécu** : le sitemap des articles lisait `scripts/seed-articles-30.sql` (32 slugs) alors que D1 avait 42 articles (37 publiés). Résultat : 10 publiés absents du sitemap + risque d'indexer des slugs dépubliés. Double source de vérité (MÉTA-A/ADR-G-001).
- **La prochaine fois** : pour tout contenu dont le STATUT vit en D1 (publié/draft), générer la liste sitemap depuis D1 (`scripts/dump-articles-published.mjs` → `articles-published.json`), jamais depuis le seed/fixture qui périme dès la 1ère édition admin.
- **Après toute (dé)publication d'article via l'admin** : relancer `node scripts/dump-articles-published.mjs` puis redéployer, sinon le sitemap ment.

## 🎯 Articles vs Guides : 2 systèmes, intentions distinctes (anti-cannibalisation) — 2026-06-23
- **Guides** (fichiers JSX, ~57) = inspiration/lieux/expériences. **Articles** (D1, 37) = conseils pratiques + recherche logement commerciale. Ne PAS créer un article sur le même mot-clé qu'un guide/landing existant → Google divise les signaux, les 2 rankent moins bien.
- **Vécu** : 5 articles dupliquaient à 100% une page établie (ex. `meilleure-saison-martinique` article ↔ landing) → dépubliés (`status=draft`), la page forte garde le jus.
- **Avant de publier un article** : `grep` le mot-clé cible dans les slugs guides (`main.jsx` KNOWN) + landings. Chevauchement ≥60% = cannibalisation, différencier l'angle ou ne pas créer.
- **Maillage interne entrant = priorité n°1** : un contenu SEO sans lien depuis les pages à autorité (home/footer/fiches) est orphelin → ne ranke pas. Toujours lier depuis footer + pages fortes.

## 📧 Envoi email de masse = API batch Resend, jamais une boucle de fetch — 2026-06-23
- **Piège vécu** : `crm-lifecycle` envoyait en boucle `POST /emails` → **6/26 en 429 rate_limit_exceeded** (Resend ~2 req/s). Les destinataires en fin de liste sautent silencieusement.
- **La prochaine fois** : utiliser `POST https://api.resend.com/emails/batch` (tableau de 100 max, personnalisation par message conservée) = 1 appel, zéro rate-limit, pas de timeout Worker. Marquer l'anti-doublon par chunk réussi.
- Corollaire : un envoi partiel ne doit JAMAIS marquer les non-envoyés → re-run ne cible que les ratés (clé `client_id+campaign`).

## 🧪 Toujours un dry run avant un envoi réel à des clients — 2026-06-23
- **Vécu** : le dry run `?dry=1` de la campagne winback a révélé **Joel BAILLEUL (locataire à l'année d'Iguana, 3400€/mois)** dans la cible "votre villa vous attend, re-réservez" — envoi gênant évité. Fix : exclure Iguana (`biens NOT LIKE '%iguana%'`, RM-19).
- **La prochaine fois** : tout endpoint d'envoi de masse expose `?dry=1` (liste sans envoi) ; le lancer + relire la cible AVANT le vrai envoi. Les exclusions métier (Iguana bookable:false, locataires longue durée) doivent être dans le WHERE, pas supposées.

## 🚀 RÈGLE ABSOLUE DÉPLOIEMENT — Claude ne fait JAMAIS `npm run deploy:pages` — 2026-06-23
- **Piège vécu** : 2 instances Claude déployaient depuis des états locaux différents (sans pusher sur git) → drift prod≠main répété (vécu 3 fois en 24h le 2026-06-23).
- **La règle** : Claude fait **toujours** `git push origin main` → le CI deploy.yml s'occupe du reste.
- `npm run deploy:pages` = outil d'urgence **Vincent seul** si la CI est cassée (secret absent, wrangler down). Jamais depuis une session Claude.
- **Vérif** : avant tout déploiement, `git status` + `git push` est le seul chemin valide.

## 🔄 Import circulaire App.jsx : extraire les données dans src/data/ — 2026-06-23
- **Piège vécu** : `NetRevParTab.jsx` importait `REVENUS_CANAL_2025` depuis `App.jsx`. App.jsx importe NetRevParTab. Résultat = import circulaire → crash React silencieux au démarrage admin (écran blanc, aucun message clair).
- **Fix** : extraire la donnée partagée dans `src/data/revenusCanal.js` (module pur, zéro import React). Re-exporter depuis App.jsx pour backward compat.
- **La prochaine fois** : tout tab d'admin qui partage des données avec d'autres tabs → données dans `src/data/`, jamais dans `App.jsx`. Check : « A importe B qui importe A ? » → import circulaire garanti.

## 🤖 Hallucinations agents backlog : croiser avec biens.js avant d'implémenter — 2026-06-23
- **Piège vécu** : agent seo-026 avait proposé "Location villa avec piscine à Schœlcher" — Schœlcher est un **appartement sans piscine**. Implémentation directe = mensonge voyageur.
- **La prochaine fois** : tout item agent qui mentionne un équipement/type/bien → vérifier `src/data/biens.js` avant d'exécuter. Marquer `bloqué` avec note si hallucination détectée.

## 💰 Fichiers sans import biens.js = dette de prix périmés — 2026-06-23
- **Piège vécu** : `src/GuideEn.jsx` avait des prix hardcodés périmés depuis des mois (Zandoli 220→110, Géko 150→110, Mabouya 110→70, Nogent 85→90) et "Bellevue" au lieu de "Schœlcher".
- **La prochaine fois** : `grep -r '[0-9]\+€' src/ --include="*.jsx" --include="*.js" | grep -v biens.js | grep -v DEFAULT_PRIX` → tout résultat = suspect à corriger.

## 🗺️ MaillageCluster — seuls currentSlug/bienId/bienNames sont des props valides — 2026-06-23
- `MaillageCluster` n'accepte PAS `titre`, `intro`, `biens` (props silently ignored → cluster vide, 0 erreur visible).
- **La prochaine fois** : toujours `currentSlug="<slug>"` pour un guide, ou `bienId="<id>"` pour une villa.
- Piège vécu : `GuideLocationVoiture` avait `titre="..." intro="..." biens={[...]}` → cluster absent en prod sans alerte.

## 🗺️ Créer un guide = 3 actions atomiques, aucune optionnelle — 2026-06-23
- Un slug ajouté seulement dans `seoClusters.js` ou `guidesIndex.js` → il apparaît dans le sitemap mais `Component = NotFound` (route absente). Piège vécu : 10 guides en 404 pré-existants.
- **La prochaine fois** : (1) `guidesIndex.js` + `dist` si villa fiche, (2) `src/GuideName.jsx` (structure ADR-GUIDES-STD-001), (3) `main.jsx` (import lazy + else if + KNOWN[]). Les 3 en une seule commit.
- Vérif : `grep -n "mon-slug" src/main.jsx` doit retourner **3 lignes** (import + else if + KNOWN).

## 🎬 Pattern composant générique + wrappers fins > duplication × N — 2026-06-23
- Quand N variantes d'un composant partagent la même logique (RAF, IntersectionObserver, hooks) mais des données différentes : **créer 1 générique paramétré + N wrappers fins** (35 lignes chacun). Coût de mise à jour : O(1) au lieu de O(N).
- **La prochaine fois** : dès qu'on veut créer la 3e variante d'un composant, sortir la logique en générique. Les 2 premiers peuvent rester standalone pour ne pas risquer la régression.
- Appliqué pour ReelPlayer + 4 wrappers (vs dupliquer 600 lignes × 4).

## 🎬 Citations reels : éviter les claims factuels non vérifiables — 2026-06-23
- Mabouya : éviter "vue mer" dans les citations (affirmation fragile côté voyageur). Privilégier l'expérience sensorielle (jacuzzi sous les étoiles) plutôt que la localisation/vue.
- **La prochaine fois** : pour les biens de résidence (Mabouya, Géko, Zandoli) = expérience + rapport qualité-prix. Pour les biens vue mer confirmée (Amaryllis, Iguana) = la vue peut être mentionnée.

## 🌐 GYG partner portal : navigation JS uniquement — 2026-06-22
- Les URLs directes (`/en-us/tools`, `/en-us/storefront`, `/en-us/solutions/link-builder`) retournent 404. La vraie navigation passe par le bouton "Tools" dans le sidebar JS.
- **La prochaine fois** : pour explorer un portail partenaire similaire, cliquer sur les boutons nav JS pour révéler le sous-menu avec les vrais hrefs (via JS `.click()` + récupérer `document.querySelectorAll('nav a')`).

## 📦 Widget tiers embed : CSP = 3 directives distinctes — 2026-06-22
- Un widget embed tiers (ex: GYG `widget.getyourguide.com`) nécessite d'ajouter son domaine dans **3 directives CSP séparées** : `script-src` (le script .js), `frame-src` (l'iframe rendu), `connect-src` (les appels XHR/fetch du widget).
- Oublier une → le widget charge silencieusement mais ne rend rien (ou erreur console bloquée). 
- **La prochaine fois** : à chaque nouvelle intégration widget, mettre à jour les 3 directives d'un coup.

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

## 📐 Layout 100dvh : `window.scrollTo()` est inutile si `overflowY: auto` est sur un div interne — 2026-06-21
- **Piège** : wrapper externe `height: 100dvh` → `document.scrollHeight ≈ 675px`, `maxScroll ≈ 58px`. `window.scrollTo({top: 300})` se clamp à 58, silencieusement. Le vrai container scrollable est le div interne (`infoPanelRef`) avec `overflowY: auto`.
- **La prochaine fois** : si `window.scrollY` ne bouge pas malgré `scrollTo()`, chercher le vrai scrollable avec `el => getComputedStyle(el).overflowY === 'auto'` ou vérifier `document.scrollingElement.scrollHeight`.
- **Formule sticky** : `target = contentOffset - stickyTop + margin` où `contentOffset = elRect.top - panelRect.top + panel.scrollTop`.

## 🌿 Leaflet + Vite prod : `import L from "leaflet"` → crash CJS/ESM — 2026-06-21
- **Piège** : en prod Vite, le chunk Leaflet peut exposer `undefined` comme export default → `L.divIcon()` crash. Sentry `handled=yes` masque l'impact réel.
- **La prochaine fois** : `import * as LModule from "leaflet"; const L = LModule.default ?? LModule` pour tout import CJS dans Vite. Valable aussi pour d'autres libs CJS (Moment, lodash, etc.).

## 🤖 Registre agents : fleet + interactive doivent rester synchronisés — 2026-06-21
- **Piège** : 11 agents existaient dans la fleet (`agents-run.js`) mais n'avaient pas de fiche `~/.claude/agents/*.md` → impossibles à convoquer en session par nom ; le registre dans ORG.md signalait "fleet only pour l'instant" mais ça crée une dette invisible.
- **La prochaine fois** : quand on crée un agent fleet → créer la fiche interactive en même temps. Les deux registres (fleet + `~/.claude/agents/`) DOIVENT rester synchronisés. L'ORG.md est le single source of truth.

## ⏰ Cron-job.org : vérifier l'état réel avant de planifier une migration — 2026-06-21
- **Découverte** : lors de la migration cron-job.org→CF Worker, 6 des 7 jobs locatif étaient déjà supprimés dans les sessions précédentes. Seul `charge-balance` restait. J'avais prévu une migration de 7 jobs, il n'en restait qu'un.
- **La prochaine fois** : avant toute migration de service, faire un `GET /jobs` (ou équivalent) sur le service source pour lister l'état réel. Ne pas supposer que tous les jobs listés dans la mémoire existent encore.

## 📊 Funnel/trafic : un chiffre volatil figé en mémoire MENT — toujours `npm run funnel` — 2026-06-20
- **Piège vécu** : j'ai resservi à Vincent le funnel noté dans `CONTEXT.md` au 04/06 (« ~5 visiteurs/j, 240 view_item → 16 begin_checkout ») comme « actuel ». Réalité live (`/api/analytics`) : ~24 sessions/j, 900 view_item, 63 begin_checkout, 4 purchases, 2 894€. **Faux d'un facteur ~4-10.** Un chiffre volatil copié hors de sa source périme et diverge (ADR-G-001).
- **La prochaine fois** : avant TOUTE reco conversion/pricing/roadmap → `npm run funnel` (lit GA4 30j, public sans auth, jamais cache client). Ne JAMAIS citer un chiffre funnel de `.memory`. Source = GA4, point.
## 🛒 `begin_checkout` émis au clic dates+prix = dénominateur GONFLÉ (intérêt ≠ paiement) — 2026-06-20
- **Vérité** : `begin_checkout` (PublicSite.jsx) part au clic « Continuer » qui ferme l'étape dates+prix — AVANT le formulaire contact, AVANT le PaymentIntent, AVANT la carte. C'est un clic d'INTÉRÊT, pas un départ de paiement. Le ratio begin_checkout→purchase surestime donc l'abandon de paiement.
- **Fix** : nouvel event `add_payment_info` à l'arrivée écran carte (infos remplies + PaymentIntent créé) = vrai dénominateur de paiement. Isole 2 fuites : begin_checkout→add_payment_info (formulaire/technique) vs add_payment_info→purchase (saisie CB/3DS). Garde anti-doublon via `useRef`.
- **Corollaire mesure** : ne jamais conclure sur la conversion juste après un correctif tunnel — la fenêtre 30j glissante mélange avant/après. Attendre ~2 semaines de données propres (ici verdict 03/07).
## 🎯 GA4 server-side (Measurement Protocol) : client_id synthétique = vente « Unassigned » — 2026-06-20
- **Piège** : `stripe-webhook.js` envoyait le purchase MP avec `client_id: booking-<id>` (aléatoire) → GA4 voit un nouvel utilisateur sans source d'acquisition → **canal « Unassigned »**. Et `items[].item_id` ne nourrit PAS la dimension custom `bien_id` (il faut un **param top-level** `bien_id`) → bien « (not set) ».
- **Fix réutilisable** : capturer le vrai `client_id` GA4 depuis le cookie `_ga` (`GA1.1.<a>.<b>` → `<a>.<b>`) côté client → le passer en metadata Stripe → l'utiliser comme `client_id` du MP. Toujours envoyer les dimensions custom en **param top-level**, pas seulement dans `items[]`.
## 🖼️ Process photos HD : HEIC → webp master en 2 temps (sips puis sharp) — 2026-06-20
- **Vérité outils** : `sips` (macOS) lit le HEIC mais **n'écrit PAS le webp** (`-s format webp` échoue). Chaîne qui marche : `sips -s format jpeg -Z 2000 in.heic --out tmp.jpg` puis `sharp(tmp.jpg).webp({quality:86}).toFile(master.webp)`. Les variantes responsive (-480/-800/-1200/-1600w) sont **gitignorées et régénérées au build** (`gen-image-variants.mjs`, jamais d'agrandissement) → ne committer que les masters `NN.webp`.
- **Galerie d'un bien** = tableau `photos[]` dans `src/data/biens.js` (ordre = affichage, hero en 1er). Ajouter de NOUVEAUX numéros de master (ex. 16-23) plutôt qu'écraser les anciens → préserve la whitelist sociale D1 (`editorial-photos`, référence les photos par numéro via `photos-manifest.json`).
## ⚠️ Apps Script revenus2026 : `apply:false` via sheets-proxy N'EST PAS un dry-run fiable — 2026-06-19
- **Piège vécu (donnée compta corrompue)** : appel `{"action":"revenus2026FromMonth","apply":"false","ignoreMemo":"true"}` via `/api/sheets-proxy` → la réponse a retourné `mode:"applied"` (PAS dry !) et a recompté 11 résas juillet→déc en **ignorant la mémoire anti-doublon** → **double comptage** (le système `appendCell_` ADDITIONNE, n'écrase pas). Le param `apply` n'a pas été respecté par le routing proxy/doGet/doPost.
- **La prochaine fois** : NE JAMAIS lancer une action GAS d'écriture potentielle « pour voir » en se fiant à `apply:false`. Lire d'abord le code de la fonction (`appscript/REVENUS_AUTO_2026.gs`) pour savoir ce que fait vraiment le param. Tester sur une copie ou demander à Vincent.
- **Réparation propre** = `revenus2026Rebuild` (`rebuildRevenus2026_(apply,fromMonth)`) : il **ZÉROISE** les colonnes fromMonth→déc puis **recompte chaque résa 1× (dédup id+contenu)** → annule tout double comptage ET ne peut pas aggraver (au pire dry=no-op). Réparé juillet→déc 2026 (49 lignes zéroées, 8 résas recomptées, Nogent témoin stable).
- **Sheet revenus = source-dérivé** : "revenus locatif 2026" est recalculé depuis "Toutes les Réservations" + "réservations" (montant 100% sur mois d'ARRIVÉE, dédup mémoire `rev2026_traites`). Un fix de montant (ex. Ludo Savoye Amaryllis Booking déc 2805,08€) doit être dans la SOURCE pour survivre à un rebuild — un ajustement direct dans le Sheet revenus serait écrasé.

## 💳 Stripe Checkout : setup_future_usage NE crée PAS le Customer sans customer_creation:always — 2026-06-19
- **Piège vécu** : `complement-checkout.js` posait `payment_intent_data[setup_future_usage]=off_session` SANS `customer_creation:always` (je l'avais retiré en croyant un conflit "only one of these parameters"). Résultat : paiement Cambier 628€ **succeeded** mais `pi.customer = null` → `storeCautionSchedule` fait `return` sur `!pi.customer` → **caution jamais programmée, sans aucune erreur visible**.
- **Vérité** : en Stripe Checkout `mode:payment`, `customer_creation` (param de la Session) et `setup_future_usage` (param du payment_intent_data) sont à des **niveaux différents et COMPATIBLES**. Le conflit "only one of these parameters" concerne les PaymentIntents directs, PAS les Checkout Sessions. **Pour enregistrer une carte réutilisable off-session via Checkout : il FAUT `customer_creation:always`** — setup_future_usage seul ne suffit pas à matérialiser le Customer.
- **Rattrapage d'un PM orphelin** (paiement réussi mais customer null) : POST `/v1/customers` (créer) → POST `/v1/payment_methods/{pm}/attach` (rattacher) → INSERT `caution_schedule`. ⚠️ un PM confirmé SANS customer attaché au moment du paiement **peut** ne pas être réutilisable off-session (3DS au hold) → garder le repli lien manuel J-2.
- **Diag Stripe sans clé live en local** : endpoint temporaire protégé par `POSTSTAY_SECRET` qui lit `/v1/checkout/sessions` + `/v1/payment_intents` (clé live = en prod). Toujours le SUPPRIMER après usage.

## 🚦 CF Pages : >100 Functions → _routes.json auto-généré TRONQUE les routes récentes (SPA fallback silencieux) — 2026-06-19
- **Piège vécu** : nouvelle Function `functions/pay/[code].js` déployée OK mais `/pay/cambier` renvoyait 200 (SPA) au lieu de 302. Cause : le projet a **119 Functions** > **limite 100 routes** du `_routes.json` que CF Pages génère automatiquement. Les routes au-delà de 100 sont **silencieusement exclues** → tombent sur le fallback SPA (aucune erreur, aucun log). La route la plus récemment ajoutée est la victime.
- **Fix canonique** : fournir un `public/_routes.json` MANUEL avec `{"version":1,"include":["/*"],"exclude":[assets...]}`. `include:["/*"]` = toutes les requêtes passent par le runtime Functions (chaque Function décide), le reste tombe en asset/SPA. `exclude` = assets purs (`/assets/*`,`/photos/*`,`/brand/*`,favicon,sitemap…) pour ne pas réveiller le runtime inutilement. La limite de 100 porte sur le NOMBRE DE RÈGLES include+exclude (on en a ~12), pas sur le nombre de Functions. Vite copie `public/_routes.json` → `dist/` au build.
- **Détection** : `curl -sI https://villamaryllis.com/<route-Function-récente>` → si `content-type: text/html` + SPA au lieu du comportement Function = route exclue. `curl https://villamaryllis.com/_routes.json` (souvent SPA, donc pas fiable seul).
- **La prochaine fois** : dès qu'on dépasse ~100 Functions, le `public/_routes.json` manuel est OBLIGATOIRE, sinon chaque nouvelle Function a 1 chance sur 2 d'être muette. Désormais en place dans le repo.

## 🌳 Worktree périmé = déployer depuis lui crée un PREVIEW, pas la prod (ne JAMAIS forcer prod) — 2026-06-19
- **Piège vécu** : session démarrée dans un worktree `.claude/worktrees/sad-bartik-02a3c2` (branche `claude/sad-bartik-02a3c2`) **156 commits derrière `main`**. Il ne contenait PAS le système caution (`_caution.js`, `caution-cron.js`). `npm run deploy:pages` depuis ce worktree → wrangler déploie sur la **branche git courante ≠ main → déploiement PREVIEW** (`<hash>.dashboard-amaryllis.pages.dev`), PAS villamaryllis.com. Mes fixes ne prenaient donc jamais effet en prod (qui sert `main`), ce qui m'a fait tourner en rond.
- **Bon réflexe** : villamaryllis.com = déploiement **production** = dernier `deploy:pages` lancé **depuis `main`**. Tester `curl https://villamaryllis.com/api/<endpoint-récent-de-main>` → si 401/200 (existe) vs catch-all, on sait quelle version tourne. `wrangler pages deployment list --project-name dashboard-amaryllis` montre Environment (Preview vs Production) + branche + commit.
- **La prochaine fois** : pour tout changement de code à mettre en PROD, vérifier `git branch --show-current` AVANT de déployer. Si worktree feature ≠ main → soit basculer sur `~/locatif-dashboard` en `main`, soit merger. **Ne JAMAIS forcer `--branch=main` depuis un worktree périmé** (écraserait la prod avec une version retardée). D1 en revanche est PARTAGÉ preview/prod (un `wrangler d1 execute --remote` touche la vraie base, peu importe la branche).

## 💶 Caution voyageur : posée à J-2 par le cron, JAMAIS au paiement (sauf arrivée ≤ 3j) — 2026-06-19
- **Vérité métier** : un blocage Stripe ne dure ~7j → la caution est posée **off-session ~2j avant l'arrivée** (`placeDateFor` = checkin−2), re-posée glissante, libérée 3j après départ (`src/utils/caution.js`). Le webhook crée la ligne `caution_schedule` (pending) sur `payment_intent.succeeded` via `storeCautionSchedule`, le cron `caution-cron.js` pose le hold le jour J-2. Nécessite carte enregistrée (`pi.customer` + `pi.payment_method`, via `setup_future_usage`).
- **Pattern complément/changement de bien** : endpoint `complement-checkout.js` (créé cette session) = Checkout `mode:payment` + `setup_future_usage:off_session` + `metadata.kind="complement"`. Le webhook a une garde `kind==="complement"` → encaisse + `storeCautionSchedule` (caution J-2) MAIS PAS de `storeDirectBooking` (évite doublon résa) ni conversion GA4/Meta (évite fausse valeur). ⚠️ Stripe refuse `customer_creation` + `setup_future_usage` ENSEMBLE ("only one of these parameters") → ne mettre que `setup_future_usage` (crée le customer tout seul).
- **Checkout Session `expires_at`** : Stripe exige STRICTEMENT < 24h. Ne pas le passer du tout = défaut 24h (robuste). Une valeur ≥ 24h OU une borne edge fragile (Date.now() CF) → erreur "must be less than 24 hours".

## 💶 Prix = prix journaliers du calendrier UNIQUEMENT — jamais `biens.js prix` ni API RM — 2026-06-19 (fusion 2026-06-05)
- **Piège récurrent (3x vécu)** : utiliser `bien.prix` (ex. 110€ Zandoli) ou `rm-recommendations.recommended_price_cents` → montants faux. Le vrai Zandoli juillet = 133€/nuit moy = 1 861€/15 nuits.
- **Source de vérité = prix journaliers du calendrier admin** (`loadDailyPrices()` = `SEED_DAILY_PRICES` + overrides `/api/site-config?type=prices`). **Devis juste = lien tunnel `…/<bien>?checkin=&checkout=` OU onglet Tarifs OU onglet Devis.** Réf : `docs/PRICING.md`. Je ne peux pas accéder au localStorage directement → dire à Vincent "fais le test sur le site".
- `biens.js` `prix` = **plancher réel** (min des tarifs) + fallback SEO "dès X€" → jamais facturable directement. À ré-aligner si les tarifs changent fortement.
- `/api/rm-recommendations` = prix conseillés RM → advisory only, Vincent ne les applique pas forcément.

## 🐛 iCal parseICS `descGet` peut capturer des numéros de référence (12-15 chiffres) comme montant → toujours cap — 2026-06-18
- **Piège vécu** : `CpaCanalTab` affichait CPA 62G€ / CA 262T€ pour Booking.com. Cause : le regex `descGet(["Montant", "Total", …])` dans `parseICS` capturait les numéros de référence Booking.com (ex. `BOOKING#1234567890123`) présents en DESCRIPTION iCal, `parseFloat` après strip des non-numériques = un montant de 12+ chiffres. **La prochaine fois** : après tout `parseFloat` sur un montant iCal, ajouter `&& montantParsed <= 50000` avant d'accepter la valeur. Sinon le bug est invisible (aucune erreur JS, juste une valeur aberrante stockée en localStorage).
- **Corollaire** : la logique de préservation `prev.montant > 0 ? prev.montant : e.montant` gardait la valeur corrompue **indéfiniment** (re-sync ne corrigeait pas). Toujours écrire `prev.montant > 0 && prev.montant <= CAP ? prev.montant : e.montant` pour les deux branches.
- **Migration startup** : les vieilles valeurs localStorage survivent aux déploiements → ajouter une migration au `useState` init : `parsed.map(x => ({ ...x, montant: Number(x.montant) > CAP ? 0 : … }))`.

## 📊 Quand on change un prix dans `biens.js`, sweeper TOUS les endroits de prose — 2026-06-18
- **Piège vécu** : Zandoli affiché 220€ sur 5 pages de guides + Faq.jsx + [slug].js + prerender.mjs + Guide.jsx alors que `biens.js` = 110€ depuis des sessions. La source unique pilote le calcul Stripe mais la **prose marketing** (textes libres, FAQ, meta descriptions guides) n'est pas générée dynamiquement → elle périme silencieusement. **La prochaine fois qu'un prix change dans `biens.js`** : greper `grep -r "<vieux_prix>€" src/ functions/ scripts/` et corriger toute occurrence de prose. Fichiers à surveiller en priorité : `GuideArlet.jsx`, `GuideSainteAnne.jsx`, `GuideNogent.jsx`, `GuideDiamant.jsx`, `GuideReservationDirecte.jsx`, `Guide.jsx`, `Faq.jsx`, `functions/[slug].js`, `scripts/prerender.mjs`, `src/i18n.jsx`.
- **Note** : `App.jsx DEFAULT_PRIX` (admin seed, ligne ~725) a encore les anciens prix (Zandoli 220, Géko 150, Mabouya 110, Nogent 85) — c'est VOULU pour l'historique admin, ne pas changer sans comprendre l'impact sur les seeds d'histogramme.

## 🔒 Auth `if (env.SECRET && secret !== env.SECRET)` = BYPASS si secret absent → toujours fail-closed — 2026-06-19
- **Piège (audit ultracode)** : ce pattern d'auth, présent sur 3 endpoints, **ouvre l'accès** quand la variable d'env n'est pas définie (le `&&` court-circuite le check). **La prochaine fois** : toujours écrire `if (!env.SECRET || secret !== env.SECRET) return 401` — fail-**closed** (secret absent = refus). Vérifier avant déploiement que le secret EST présent en prod (test : `curl ...?secret=BOGUS` doit renvoyer 401) sinon le passage en fail-closed casse les crons. Cross-projet → `CROSS-LEARNINGS`.

## 🤖 Les fix-agents d'un workflow appliquent les findings SANS vérifier les dépendances → re-vérifier soi-même — 2026-06-19
- **Piège (audit ultracode)** : l'agent fix a (a) changé Signal 4 vers `created_at` alors que le finding lui-même disait « check the D1 schema first » (heureusement la colonne existait — vérifié `PRAGMA table_info`) ; (b) appliqué un fix timezone **incohérent** : DDL DEFAULT de `acked_at` mis en MTQ (`-4 hours`), mais l'INSERT force `datetime('now')` (UTC) → le DEFAULT est **mort** (jamais appliqué si l'INSERT fournit la colonne). **La prochaine fois** : après un workflow de fix auto, **relire chaque fichier touché** — surtout schéma D1 (colonne existe ?) et DEFAULT vs INSERT explicite. Fix correct : aligner l'INSERT sur MTQ, pas le DEFAULT.

## 📱 FB in-app browser : appelle les onClick sans props valides → guard défensif obligatoire — 2026-06-19
- **Piège vécu** : `generateDevis()` crashait en prod (`.slice()` sur `bien.id`) uniquement sur FB IAB Android (vieux FBAV/565). Cause : un événement click peut être déclenché par le browser sans que les props React soient settés correctement (navigation interne FB = contexte isolé, re-rendu partiel). **La prochaine fois** : toute fonction liée à un `onClick` qui consomme des props d'un composant parent (`bien`, `selection`, etc.) **doit commencer par** `if (!bien?.id) return;` (ou l'équivalent). Particulièrement risqué : les exports PDF/devis, les calculs de prix (`.toFixed()`), les fonctions appelées à partir d'un état intermédiaire. FB IAB = user réel, pas un bot → bug visible en production.

## 🐞 BugsTab filtre par défaut = "new" → toujours basculer sur "toutes" pour diagnostiquer — 2026-06-19
- **Piège vécu** : Vincent ne voyait qu'1 bug en cours dans le dashboard alors qu'il y en avait 3. Cause : filtre `fStatus = "new"` (état initial, `BugsTab.jsx` L28), et les 2 vrais bugs étaient en `triaged`. **La prochaine fois** : quand on investigate le 🐞 Bugs tab, **toujours ouvrir le filtre sur "toutes" avant de conclure** qu'il n'y a pas de bug actif. Les bugs auto-triagés (agent triage hebdo) passent en `triaged`, jamais en `new`.

## 🤖 Workflow multi-agents : chemins ABSOLUS quand le code vit ailleurs que le cwd — 2026-06-18
- **Piège vécu** : une revue adversariale (Workflow) a rendu un **faux NO_GO** « le code n'existe pas / régression » parce que les agents ont lu, en chemins **relatifs**, le **worktree périmé** (`.claude/worktrees/...` resté à un vieux commit) au lieu du vrai code (édité dans le repo principal `~/locatif-dashboard`, committé sur `main`). Cette session a tout édité via chemins absolus du repo principal → le worktree (cwd de session) ne contient PAS les changements. **La prochaine fois** : dans le prompt des agents de workflow, **donner les chemins ABSOLUS** du vrai code (`/Users/vincentsalomon/locatif-dashboard/...`) et leur dire d'ignorer tout worktree. Sinon leur cwd = worktree → lecture stale → verdict faux. (Corollaire du « relire le vrai code avant de corriger un finding LLM ».)
- **La revue reste utile sur le fond** : même en lisant la mauvaise copie (round 1), elle a sorti 5 vraies faiblesses ; relancée en absolu (round 2), 3 de plus. **Valeur réelle de l'adversarial review sur du code argent** — mais toujours **vérifier chaque finding dans le vrai code** avant de corriger (certains blockers étaient des artefacts de chemin).

## 💳 Caution différée — 3 pièges argent-réel trouvés en revue adversariale — 2026-06-18
- **Double caution sur un flux annexe** : un nouveau système auto (storeCautionSchedule sur `payment_intent.succeeded`) peut **doublonner** un flux qui pose DÉJÀ sa propre caution. Ici le **flux devis** (`type:"devis"`, carte enregistrée + caution manuelle `create-deposit-intent`) → 2 holds. **Toujours énumérer TOUS les flux qui passent par `payment_intent.succeeded`** (tunnel normal, groupe, devis/short-link, capture de caution) et exclure explicitement ceux qui ne doivent pas déclencher l'auto (`meta.type` / `meta.kind`).
- **Fonds gelés à vie** : une machine à états de hold doit avoir une **porte de sortie ABSOLUE**. Si la libération dépend d'un `checkout` et que `checkout` est vide/invalide → la branche `held` boucle en `reauth` perpétuel → la CB reste pré-autorisée à l'infini. Fix double : valider `checkout` à la création (ne pas créer la ligne) **ET** garde « checkout invalide → release » dans la logique. Tester explicitement le cas `checkout=''`.
- **Double-hold sur crash entre Stripe et la DB** : si `createHold` réussit mais l'`UPDATE` D1 échoue, un re-run pose un 2e hold. Mitiger avec une **clé d'idempotence Stripe STABLE** (sans date) pour l'action 'place', **partagée** entre les 2 points qui peuvent poser (webhook immédiat + cron) → Stripe renvoie le même PI. La datation de la clé ne vaut que pour les répétitions VOULUES (reauth glissant).
- **Garde anti-double atomique** : `SELECT existing → if exists return → INSERT` a une fenêtre de course (2 exécutions concurrentes passent le SELECT). Préférer **INSERT d'abord** (`ON CONFLICT DO NOTHING`) puis tester `meta.changes===0` → la PRIMARY KEY arbitre atomiquement qui « gagne » et pose le hold.

## 🔒 Caution différée off-session : réutiliser le pattern 2× éprouvé, pas réinventer — 2026-06-18
- **Un hold Stripe ne dure ~7 jours** (réseau carte). Confirmé sur le compte : `charge.payment_method_details.card.capture_before` = création **+ 604 800 s = 7,0 j pile** (caution Anaylis Mastercard). `extended_authorization` (30 j) = **réservé à la tarification IC+** ; compte Amaryllis = **blended** → indispo (doc Stripe : « if you're on blended… contact us »). Donc pour un séjour lointain, **bloquer à la résa ne sert à rien** → poser la caution juste avant l'arrivée.
- **Le pattern off-session existait déjà** : `charge-balance.js` prélève le solde 2× off-session (`off_session:true, confirm:true, customer, payment_method`). **La caution = le MÊME appel + `capture_method:manual`** → un hold au lieu d'un débit. **La prochaine fois qu'on a besoin d'une opé off-session : chercher si le pattern existe (2×) et le copier**, ne pas repartir de zéro. Idempotence garantie en pilotant l'action par une fonction pure (`decideCautionAction`) sur l'état stocké, mis à jour après chaque opé.
- **Re-blocage glissant pour les longs séjours** (idée Vincent, = pattern Stripe "reauthorization") : avant l'expiration du hold (`capture_before - 1 j`), en poser un neuf off-session puis **annuler l'ancien APRÈS succès** → le voyageur ne voit qu'un seul blocage à la fois. Couvre n'importe quelle durée. Libérer 1× = priorité sur re-bloquer dans la machine à états (sinon on re-bloque le jour de la libération).
- **Carte enregistrée = prérequis absolu du off-session** : `setup_future_usage:off_session` + Customer sur le PI du séjour. **Étendre à TOUTES les résas** (pas que 2×), mais de façon **gracieuse en 1×** (échec création Customer → on continue le paiement sans carte → fallback lien manuel) ; **strict en 2×** (le solde en dépend → on bloque). ⚠️ Les résas **antérieures payées en 1×** n'ont pas de carte enregistrée → caution rétroactive impossible en auto (lien manuel only). Vu sur François Cambier (Mabouya).
- **Répartition inline vs différé par délai d'arrivée** (`isNearBooking`, seuil 3 j), appliqué AU MÊME endroit par le tunnel ET le webhook → complémentarité stricte, **zéro double caution** : near → inline au paiement (pas de ligne `caution_schedule`) ; far → pas d'inline (étape masquée) + ligne différée. Frontière exacte : lead=3 inline, lead=4 différé.
- **Backfill D1 d'une résa existante** : `npx wrangler d1 execute revenue-manager --remote --command "INSERT … ON CONFLICT DO NOTHING"`. Récupérer le couple `customer_id`/`payment_method_id` **prouvé** depuis `payment_schedule` (celui qui sert déjà au solde 2×), pas le deviner. `--remote` = prod, SELECT d'abord (lecture seule) pour vérifier.

## 💳 Caution Stripe : les messages d'erreur viennent de l'IFRAME Stripe, pas de notre code — 2026-06-17
- **Symptôme** : sur l'étape caution, le voyageur voit « Votre moyen de paiement a échoué. Veuillez en utiliser un autre » + « Une erreur de traitement est survenue » — **même sur la session qui finit par réussir**. Ces 2 messages **n'existent NULLE PART dans `src/`/`functions/`** (grep = 0). Ils sont rendus par **Stripe à l'intérieur du Payment Element (iframe)** → impossible à supprimer via notre state `depositError`. **La prochaine fois : grep la string AVANT de croire qu'on contrôle un message** — si absent du repo, c'est du Stripe natif.
- **Cause racine** : **Stripe Link** auto-remplit une carte enregistrée **déjà refusée** (la Mastercard débit d'Antoine FENAERT) sur les étapes suivantes → écran anxiogène persistant tant que le client n'en change pas. **Fix** : caution = **carte uniquement** (`payment_method_types:['card']`, retirer `automatic_payment_methods`) dans `create-deposit-intent.js` ET `caution-checkout.js`. Plus de Link = plus d'autofill d'une carte cassée. Le **séjour garde Link** (décision Vincent : conversion > cohérence).
- **Vérifier un fix paiement sur la VRAIE donnée Stripe** : (a) l'onglet admin Cautions appelle `manage-deposit action:list` qui ne renvoie QUE `status:'requires_capture'` → **si une caution y apparaît, elle est RÉELLEMENT bloquée** (fonds tenus), pas un fantôme ; (b) prouver le card-only en créant un PI test 0,50€ via l'endpoint prod → lire `payment_method_types` via Stripe MCP → **annuler le PI** (`manage-deposit action:cancel`).
- **Hypothèse FAUSSE écartée** : « les cartes de débit ne supportent pas la pré-autorisation ». FAUX — la caution d'Antoine a finalement été pré-autorisée **sur cette même carte de débit** (`requires_capture`). Le 1er échec = `generic_decline` (refus ponctuel banque), pas une incapacité de la carte. **Toujours lire `last_payment_error.decline_code` avant de conclure sur la nature d'un refus.**
- **UX défensive (déployée)** : un échec de caution intervient APRÈS paiement séjour → ne JAMAIS bloquer/inquiéter. Bloc rassurant « réservation confirmée » + bouton « Finaliser » + **alerte hôte best-effort** (`/api/contact` source `caution-skipped`, email+ntfy) pour relancer un lien caution. Appliqué aux 2 chemins (inline `PublicSite.jsx` + 3DS `Merci.jsx`). `deposit_voyageur`/`deposit_email` stockés en sessionStorage pour que le chemin Merci ait les données de l'alerte.

## 🏦 Fix chevauchement bail : le 1er virement bancaire = date de démarrage réel — 2026-06-17
- Quand les dates Rentila d'un bail se chevauchent avec le bail suivant, **ouvrir le relevé bancaire** → la date du **1er virement locataire = démarrage effectif du bail** (plus précis que la date Rentila qui couvre parfois la prise de possession). Tronquer la Ligne précédente à `1er virement - 1j` = fix propre, ancré dans la réalité, pas une décision arbitraire. Confirmé sur Joël BAILLEUL (1er virement 04/11/2024 → checkout Ligne 1 = 03/11/2024).
- **Protection overlap lors d'import Rentila** : toujours pull le Sheet avant chaque bien → filtrer sur `checkin|checkout` par bienId → sauter les entrées qui matchent une resa déjà en base (protège les contact data Stripe). L'import `importAllReservations_` overwrite TOUTES les colonnes (y compris email/tél) si le key content match.

## 📥 Import de données dans le Sheet : pré-transformer en TSV propre, ne pas compter sur `buildColMap_` — 2026-06-17
- Le CSV brut d'un export (Airbnb « Historique des transactions ») **ne mappe pas** : entêtes « Date de début/fin » ≠ alias `arrivée/départ` (et l'alias `arrivée` matche par erreur « Arrivée au plus tard le », vide pour les résas) ; le **nom d'annonce ne contient pas le bienId** (« Appartement de standing avec jardin, proche Paris » ≠ nogent ; « …splendide vue mer » = schoelcher). `guessAirbnbBienId_` échoue. **La prochaine fois** : pré-transformer en TSV avec entêtes reconnues + **bienId écrit en clair** dans la colonne logement + dates ISO + montant nettoyé. Filtrer `Type=Réservation` (exclure Payout/résolutions) et **agréger par code de confirmation** (les altérations = 2-3 lignes du même séjour à sommer).
- IDs : code exposé (Airbnb `Code de confirmation`) → `airbnb-<code>` ; aucun code (Booking vue groupe) → **ID synthétique stable** `booking-BK-<bien>-<checkin>`. La dédup `importAllReservations_` (par ID **et** clé `bien|checkin|checkout`) rend l'import **idempotent** → relançable sans doublon, et **met à jour en place** les résas iCal déjà présentes (enrichit nom voyageur + montant).

## 🚫 `/api/sheets-proxy` POST = 403 WAF depuis un script → écrire en GET direct vers la web app GAS — 2026-06-17
- POST programmatique (`urllib`, UA par défaut) sur `/api/sheets-proxy` **bloqué 403 par le WAF Cloudflare**. **Contournement** : répliquer `forwardChunked` côté script → chunks **GET** directs vers `script.google.com/.../exec?action=importAllReservations&data=<json>` (~1800 chars/chunk). La web app GAS est publique, hors WAF.
- Upsert `importAllReservations_` **O(n²)** → sur 355+ lignes Google **coupe le HTTP à ~2 min** mais **continue côté serveur jusqu'à 6 min** → vérifier le compte via `?action=read` avant de relancer (idempotent). Imports en **arrière-plan**.
- Nouvelle action GAS exposée seulement après `clasp push` **+ `clasp deploy -i <même deployment id>`** (sinon `{"error":"action inconnue"}`).

## 🔴 Piratage compte pub Meta — pattern reconnaissable — 2026-06-17
- **Signal d'alerte** : email Meta « nouvelles campagnes approuvées » que tu n'as pas créées + nom de campagnes bizarres/langue étrangère dans Ads Manager. **Réflexe immédiat** : aller dans Ads Manager → vérifier TOUTES les campagnes (pas seulement les nouvelles visibles) → désactiver les suspectes AVANT de supprimer (pour prendre des captures).
- **Pattern vietnamien** : campagnes avec 🪴 emojis + noms en majuscules + produits e-commerce asiatiques diffusées sous ta page = piratage classique. Aucune confusion possible avec tes propres campagnes si tu vérifies les visuels.
- **Piège** : une campagne avec "quelques clics et quelques €" de dépense ≠ forcément légitime. Toujours ouvrir l'aperçu publicitaire avant de conclure que c'est une campagne à toi.
- **Portfolio pirate** : Meta peut créer un 2e Business Portfolio sous ton nom sans que tu le saches (via une app compromise). Vérifier régulièrement `business.facebook.com` → switcher de portfolio en haut à gauche pour voir si un portfolio inconnu existe.
- **Meta bloque la suppression du portfolio frauduleux** pendant enquête interne — comportement normal, ne pas s'inquiéter. Le portfolio devient inoffensif une fois vidé.
- **Prochaine fois** : activer le 2FA DÈS l'ouverture d'un compte Meta Business (jamais remettre à plus tard).

## ⚠️ `deploy:pages` meurt en silence si on supprime un fichier sans committer d'abord — 2026-06-16
- Le gate lint-delta de `scripts/deploy-pages.sh` (`set -euo pipefail`) calcule `CHANGED_JS=$(git diff … | while read f; do [[ -f "$f" ]] && echo "$f"; done)`. Si un fichier **supprimé** (non committé) est trié en dernier, le `[[ -f ]] && echo` final retourne **1** → la substitution `$()` échoue → `set -e` tue le script juste après l'echo « 🔍 Lint… » (EXIT=1, aucun message d'erreur, déroutant).
- **La prochaine fois** : après un `git rm`, **committer AVANT `deploy:pages`** (arbre clean → `git diff vs HEAD` vide → le gate ne boucle sur rien). Vécu sur RM-03 (suppression des moteurs pricing morts). Fix durable possible (hors scope) : neutraliser le `while` avec `|| true` ou filtrer les suppressions en amont.

## 📁 RM-22 — wording SEO local : « maisons » et non « villas » (nomenclature stricte) — 2026-06-16
- MaillageCluster est **générique** (le cluster n'est pas toujours Sainte-Luce) ET seuls Amaryllis+Iguana sont des « villas ». L'audit suggérait « Nos villas à Sainte-Luce » = doublement faux. Solution : map préposition par cluster géo (`à Sainte-Luce`/`au Diamant`/`à Nogent`, fallback `à proximité`) + terme « maisons ». **Toujours vérifier la nomenclature + la généricité d'un composant avant d'appliquer un wording suggéré par un audit.**

## 🚀 CF Pages a une LIMITE de déploiements/jour — grouper les builds — 2026-06-15
- Vincent : « on peut pas déployer avant 19h, limite atteinte » après ~12 déploiements dans la session. **CF Pages limite le nombre de déploiements (≈ rate limit horaire/quotidien).** **La prochaine fois : GROUPER les correctifs et déployer 1 fois**, pas un `deploy:pages` par micro-fix. Tester un max en local (`vitest`, `npm run build`, `node --check`) AVANT de déployer. La limite s'est levée ~1 min après (probablement fenêtre glissante).

## 🐛 Pages Function qui renvoie « error code: 502 » (HTML, pas mon JSON) — 2026-06-15
- Diagnostic différentiel : un GET minimal qui répond (mon JSON 400) = le **module charge bien** (pas un import cassé). Un POST qui 502 **en ~6s** (pas 30s) et **échappe au try/catch global** = ce n'est NI une exception JS (sinon catchée), NI un timeout 30s → **dépassement d'une limite CF** (CPU/mémoire/subrequest) sur le chemin exécuté (ici l'appel LLM + post-traitement). **À élucider via `wrangler pages deployment tail` (read-only, ne déploie pas).** Statut guide-write : moteur `_guideWriter.js` OK (9 tests), endpoint 502 sur le chemin LLM à debugger via logs.

## 📣 Auto-publication réseaux — pièges du fact-check & du pipeline — 2026-06-15 (soir)
- **Le `META_PAGE_TOKEN` publie bien FB+IG** (`pages_manage_posts` / `instagram_content_publish` présents) MALGRÉ la régénération du matin pour le bot social — vérifié par un VRAI test de publication (post Bellevue id FB `986487064137992`). `debug_token` sur un **page token** renvoie `scopes:[]` (non concluant) → le seul test fiable des droits de publication = publier réellement. Ne jamais conclure « token ne peut pas publier » sans test live.
- **Le hashtag `#AmaryllisLocations` est un faux-positif systématique** pour toute règle fact-check `équipement.*amaryllis` (cascade/piscine + le mot « amaryllis » du hashtag de marque). Fix : **stripper les hashtags** (`/#[^\s#]+/g`) AVANT d'appliquer les règles factuelles — les hashtags sont du marketing, pas des affirmations.
- **Fact-check générique = aveugle au bien → faux positifs.** « piscine à débordement » est VRAI pour Amaryllis mais la règle flaguait tout. Solution : passer le `bienId` à `factCheckCaption(caption, rules, bienId)` + 2 mécaniques : `okFor:[biens]` (équipement légitime → skip) et `onlyFor:[biens]` (règle ciblée, ex « quatre suites » faux seulement pour amaryllis=3ch). Le `bienId` se dérive de l'imageUrl `/photos/{bien}/`.
- **Les mots bannis par bien (`agent_lessons.bien_id`) fuyaient en global** : `loadLearnedLessons` chargeait `pattern,reason` SANS `bien_id` → un « villa » banni pour Schœlcher bloquait TOUS les posts (dont Amaryllis qui EST une villa). Fix : charger `bien_id` → `rule.onlyFor=[bien_id]`. **Tout filtre/ban contextuel doit propager son scope bien jusqu'au point d'application**, sinon faux positifs massifs. Validé end-to-end : post Amaryllis frais score 88 → gate PASS → auto-approuvé en live (pipeline prouvé).
- **Les drafts « approved » ne repassent PAS le gate** (le cron `runEditorialAutoPublish` publie les approved tels quels). Donc tout post approuvé AVANT la mise en place du gate peut être faux. **Défense en profondeur indispensable** : remettre le fact-check BLOQUANT au point de passage unique = `executeDraft`/action publish dans `agent-drafts.js` (toute publication le traverse : cron, manuelle, gate).
- **Nomenclature villas (règle métier confirmée Vincent)** : SEULES Villa Amaryllis ET Villa Iguana sont des « villas ». Zandoli/Géko/Mabouya/Schœlcher(Bellevue)/Nogent ne le sont pas → règle `\bvillas?\b` onlyFor ces 5 biens.
- **CF Pages : un secret/var posé via `wrangler pages secret put` n'est actif qu'APRÈS un redéploiement** (vu avec `EDITORIAL_GATE_MODE` : resté shadow jusqu'au redeploy). Toujours redéployer après avoir posé une var Pages.
- **`handleSeed30Days` est idempotent** (anti-doublon sur dates déjà planifiées + exclut Iguana) → le re-seeder chaque jour à partir d'aujourd'hui maintient un horizon glissant 30j sans doublon = auto-reseed trivial.

## 🤖 Meta Graph API — Scopes vs Advanced Access — 2026-06-15
- **Token avec `pages_read_engagement` ≠ accès au `/{pageId}/feed`.** Depuis 2023, Meta exige **Advanced Access** (App Review approuvé) pour ce endpoint, même en mode Développement avec le bon scope. Le token est correct, le blocage est au niveau app.
- **Seul `/api/social-poll` IG** (`/{igId}/media?fields=comments`) fonctionne avec Standard Access pour son propre compte. Pas d'App Review nécessaire pour ses propres médias IG.
- **Endpoint temporaire `meta-refresh-token.js`** (GET → échange user token → page token permanent via `META_APP_SECRET` serveur) = pattern à reproduire quand on doit renouveler le token page. À créer → utiliser → supprimer (le token apparaît dans les logs d'URL CF si non supprimé).
- **`debug_token` est la source de vérité des scopes** : `GET /debug_token?input_token=<tok>&access_token=<app_id|app_secret>`. Le champ `scopes[]` liste les permissions réellement octroyées. Un scope listé ≠ Advanced Access accordé.
- **Page abonnée** (`POST /{pageId}/subscribed_apps?subscribed_fields=feed`) est nécessaire mais non suffisant pour recevoir les events webhook — l'App Review reste obligatoire pour les apps en Développement.
- **`pbpaste` sur Mac** = lire le presse-papier depuis un terminal après « Copy Token » dans Graph Explorer. Plus fiable que de demander à Chrome MCP de lire le clipboard (non disponible comme action).

## 📣 Tracking pub + lecture des dashboards Ads — 2026-06-15
- **Toujours `wrangler pages secret list --project-name <projet>` AVANT d'affirmer qu'un secret manque en prod.** Un sous-agent d'audit a *déduit* « GA4_API_SECRET absent » en lisant le code (`if(!apiSecret) …`) → FAUX : les 2 secrets (`META_CAPI_TOKEN`, `GA4_API_SECRET`) étaient bien posés. Ne jamais relayer une déduction de sous-agent sur l'état prod sans le vérifier (corollaire du « relire le vrai code avant de corriger un finding LLM »).
- **GA4 « Unassigned » + conversions = signature des events serveur Measurement Protocol** avec `client_id` synthétique (`booking-${pi.id}`). Ça prouve que le MP marche MAIS casse l'attribution canal → les ventes ne sont jamais créditées au paid. Le client_id réel (`_ga`) faudrait le capturer pour rattacher.
- **Ne JAMAIS basculer une enchère sur « Maximiser les conversions » (Google) / « Purchase » (Meta) tant que le compteur de conversions = 0** : sans historique, l'algo n'a rien pour optimiser → il étouffe la diffusion. Garder « Max clics » / « Landing Page Views » jusqu'à ce que les conversions remontent.
- **Lecture des dashboards via Chrome MCP** : **Meta Ads Manager** → `get_page_text` lit le tableau campagnes (delivery/spend/results) en read-only, MAIS `screenshot` **dans un browser_batch est bloqué** (`permission_required`) → appeler `screenshot` **en standalone** (l'utilisateur est prompté). **Google Ads** → grilles campagnes/conversions en **canvas** (absentes de `innerText`/`get_page_text`) → lire par **screenshot** ; les scorecards/headers passent en `innerText`. Les liens « Afficher toutes les actions de conversion » sont des navigations read-only sûres.
- **Meta « Account spend limit »** (plafond compte, distinct du seuil de facturation et de la limite quotidienne fixée par Meta) : quand atteint → toutes les campagnes passent « Account spend limit reached » et **arrêtent de diffuser**. Le relever (Facturation → Comptes → Account spending limit → …) **relance la diffusion immédiatement**. Reset le 1er du mois.

## 🤖 Réseau d'agents : boucles d'autonomie — pièges rencontrés — 2026-06-15
- **`agent_memory` est injectée dans le prompt** (`buildPrompt` memorySection, agents-run.js) → écrire une clé dans `agent_memory(agent=<id>)` = le faire lire à l'agent au run suivant. C'est le canal de feedback le plus simple (utilisé pour `eval_feedback`). Le bus inter-agents = même mécanique avec `agent='_shared'`.
- **Sélection des sorties à évaluer : 1 par agent, pas les N plus récentes.** community-manager génère ~12 drafts/jour → il monopolisait les 25 places de `agents-eval` (les autres agents jamais notés). Fix : `JOIN (SELECT source, MAX(id) ... GROUP BY source)` → dernière sortie de CHAQUE source.
- **Batch d'éval : ordonner DESC + garde anti-écrasement.** En traitant plusieurs sorties du même agent dans un batch (ordre DESC), une vieille bonne note **supprimait** la correction d'une sortie récente faible. Fix : `Set` des agents déjà traités → seule la sortie la plus récente fait foi (vu en prod : feedback=1 puis effacé dans la même passe).
- **`no-empty` ESLint accepte un bloc avec commentaire.** Tout `catch {}` vide = +1 erreur lint → bloque le deploy (gate delta). Toujours mettre `catch { /* raison */ }`. Idem nouveau fichier : il part d'un baseline 0, donc 0 erreur tolérée.
- **Émettre un signal/donnée structurée d'un agent = champ JSON explicite, pas du parsing de prose.** On a ajouté un champ `signal` optionnel au schéma de sortie (parsé via `parsed.signal`), fiable et additif (absent = rien ne casse).

## 🗓️ Scheduled tasks : créé même quand /schedule affiche une erreur de connexion — 2026-06-14
- La skill `/schedule` peut afficher « trouble connecting with remote claude.ai account » **ET avoir quand même créé la tâche** en arrière-plan. **La prochaine fois : toujours vérifier avec `list_scheduled_tasks` avant de recréer** — évite les doublons et les surprises.
- Pattern vérifié : tâche `rapport-business-amaryllis-18h` apparue dans la liste malgré le message d'erreur affiché à l'écran.

## 📧 Pont email OTA → Sheet : pièges à connaître — 2026-06-14
- **Cloudflare Email Routing pose un MX au niveau de la zone** → il **écrase** un MX existant. `villamaryllis.com` a `MX smtp.google.com` (Google Workspace) → activer Email Routing aurait cassé la réception email. **Toujours `dig MX <domaine>` avant** d'envisager Email Routing ; sur un domaine qui reçoit déjà, c'est exclu.
- **Apple Mail (et toute règle client) ne tourne que si l'app est ouverte** → pas fiable pour de l'auto 24/7. Pour du robuste → **règle côté serveur** (Outlook.com : Paramètres → Courrier → Règles).
- **Outlook.com exige une re-vérification d'identité** (bouton « Se connecter ») **avant de créer toute règle de transfert externe** (anti-abus). Claude ne peut pas (mot de passe) → **étape humaine obligatoire**, puis la règle se finalise.
- **Limite cellule Google Sheets = 50 000 caractères** : le « Body Content » HTML d'un mail Outlook dépasse → **stripper le HTML / `getPlainBody()`** avant d'écrire. (C'est ce qui faisait planter le Zap.)
- **Forward vs Redirect** : pour un transfert vers Gmail qui doit atterrir en boîte de réception (pas spam) → **Transférer** (part de TON adresse, SPF OK). **Rediriger** garde l'expéditeur d'origine (airbnb) → SPF fail → spam → `GmailApp.search` le rate (ne lit pas le spam sans `in:anywhere`).
- **Apps Script GmailApp : le scope `https://mail.google.com/` est large** — si le projet utilise déjà `GmailApp.sendEmail`, ajouter `GmailApp.search` (lecture) ne redéclenche **aucun** consentement OAuth (scope déjà couvert). `clasp push` met à jour le HEAD sans toucher la version web déployée (URL `APPS_SCRIPT_URL` préservée).

## 🖱️ Pilotage navigateur SPA (Chrome MCP) : ref > coordonnées, Return pour activer — 2026-06-14
- **Cliquer par `ref`** (outil `computer`, param `ref` issu de `find`/`read_page`) est **fiable** ; cliquer par **coordonnées** rate souvent (l'espace du screenshot ≠ viewport CSS → un clic « sur le bouton » tombe à côté / sur le backdrop et ferme la modale).
- Les **boutons React/SPA** (Apps Script, Outlook web) sont parfois **inertes au clic synthétique** : faire **clic (focus) + touche `Return`** pour les activer (vécu : « Ajouter une règle » Outlook, « Exécuter » Apps Script). ⚠️ Mais `Return` sur un **menu déroulant** sélectionne le 1er item → pour un dropdown, ouvrir au **clic simple** puis sélectionner l'option par `ref`.
- **Saisie de texte = `form_input` par ref** (fiable, déclenche l'event input). Les champs « chip » se valident en cliquant ailleurs / `Return`.

## 🏨 iCal OTA = ni nom ni prix : saisie manuelle obligatoire (biens Martinique) — 2026-06-14
- **Les flux iCal Airbnb ET Booking.com ne transmettent NI le nom du client NI le prix** — juste les dates (DTSTART/DTEND) + un `SUMMARY` générique (« CLOSED - Not available » côté Booking, « Reserved » côté Airbnb). C'est structurel aux OTA, pas un bug. **Seul Nogent remonte les prix** (API Beds24, une vraie API). Pour les 6 biens Martinique en OTA → le nom et le prix se saisissent à la main (sinon CA sous-compté).
- **La prochaine fois** : ne jamais s'attendre à un prix/nom depuis une résa `fromIcal`. Le rappel « ✏️ à compléter » (badge admin + push Worker) existe pour ça. Piste de fond : connectivité Booking.com (API/Connectivity Partner) pour automatiser.

## 🏨 Booking extranet : session = token `ses=` dans l'URL, pas navigable directement — 2026-06-14 (soir)
- L'URL de l'extranet Booking (liste des résas ou fiche détail) contient un token `ses=` qui identifie la session. **Naviguer vers `admin.booking.com/.../reservations/index.html` sans ce token → 502 ou redirect oauth2 immédiat** (session invalidée). Le scraper Playwright doit utiliser l'URL COMPLÈTE de la fiche détail (`booking.html?lang=fr&res_id=...&hotel_id=...`) mémorisée à l'avance — **pas** naviguer "normalement" depuis l'accueil. Alternative fiable : copier l'URL depuis l'extranet en session ouverte.
- **Chrome MCP `find`/`screenshot` inopérants sur l'extranet Booking** : l'extranet maintient des connexions persistantes → `document_idle` n'est jamais atteint et les outils `find` attendent indéfiniment. **Utiliser `javascript_tool` pour tous les reads DOM** (`document.body.innerText`, `document.title`, etc.) — pas de `find`/`screenshot` sur les SPA persistantes.

## 🔄 GAS `addReservation` = uniquement via `doGet`, pas `doPost` body — 2026-06-14 (soir)
- L'action `addReservation` est dispatchée dans `doGet` (paramètre URL) mais **n'est pas dans le switch `doPost`** → `POST` avec body `{action:"addReservation"}` retourne `{"error":"action POST inconnue: addReservation"}`. **La prochaine fois** : pour enrichir/ajouter une réservation depuis un script → utiliser `enrichReservation` (POST, prise en charge) avec `force:true` si on veut écraser ; ne jamais supposer que toutes les actions sont disponibles en POST.

## 📊 revenus2026 mémo Sheets : déduplication = id ET content-key — 2026-06-14 (soir)
- Le mémo `revenus2026` (Apps Script) déduplique les résas par **DEUX clés** : l'id de la résa ET la content-key `bien|checkin|checkout`. **Faire un `Forget id` seul ne suffit pas** — la content-key bloque quand même le re-sync. Il faut `Forget id` + `Forget bien|checkin|checkout` PUIS relancer le sync. Cas vécu : NINA GRUBO — Forget n'avait effacé que l'id, la content-key persistait.

## 🔒 Webhook Stripe = autorité, pas le front-end (garanti de tourner) — 2026-06-14
- Le webhook Stripe est **rejoué jusqu'à succès** par Stripe → garanti. Le front-end (`notify-booking`, push au Sheet) **ne tourne pas** si le voyageur quitte la page (ex: bug page caution). → **mettre les actions critiques côté webhook** : alerte hôte, stockage du total (CA), confirmation. Vécu : résa Anaïs Chouteau → ni notif hôte ni CA car front-end interrompu sur la caution.
- **Dédup atomique D1 sans lock** : `UPDATE t SET flag=1 WHERE id=? AND flag=0` puis tester `meta.changes` → un seul des deux flux (webhook OU front-end) « gagne » et agit (D1 sérialise les statements). Pattern réutilisable pour tout « exactly-once » entre deux chemins concurrents.

## 🌐 Smoke-test post-deploy : viser l'alias de déploiement, pas le domaine CDN — 2026-06-14
- Tester `villamaryllis.com` juste après deploy = **faux négatifs** : le CDN met >30s à propager → bundle servi transitoirement en `text/plain`, titres absents. Ça a causé un **hard-fail** (exit 1) sur un déploiement pourtant sain → danger (masque les vrais problèmes).
- **Fix** : capturer l'URL alias `<hash>.dashboard-amaryllis.pages.dev` de la sortie wrangler (`grep -oE "https://[a-z0-9-]+\.<projet>\.pages\.dev"`) et smoke-tester celle-ci (live immédiatement, zéro cache). Fallback sur le domaine prod si non capturé.
- **Nuance** : même sur l'alias frais, la **Function de meta-injection** (`[slug].js` runtime) met ~30-60s à s'activer → les checks de `<title>` runtime peuvent encore warner brièvement, alors que les checks statiques (bundle, /admin) passent immédiatement. Warnings bénins, non bloquants.

## 🏷️ `fromIcal` ≠ Airbnb : Booking.com a aussi un iCal — 2026-06-14
- Coder « Airbnb » en dur pour toute résa `fromIcal` est faux depuis l'ajout de l'iCal Booking.com → une résa Booking affichait « airbnb » collé au nom du client. **La prochaine fois** : dériver le libellé/couleur du **canal réel** (`r.canal`), pas de `fromIcal`. Idem pour les compteurs (« X Airbnb » → « X iCal »).
- **Éditer une résa `fromIcal` était fragile** : le re-sync iCal réécrasait toutes les résas du bien par le parse brut → effaçait les éditions (nom/prix), puis le push 📊 propageait la perte au Sheet. Fix : préserver par UID les champs manuels + l'état opé au moment du merge.

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

## 2026-06-21 — Reels IG+FB, pipeline auto-pub

- **IG Reels timeout ≠ échec définitif** : Meta prend jusqu'à 60s pour encoder une vidéo côté serveur ; CF Pages timeout = 30s → le container est créé MAIS le polling expire avant `FINISHED`. Solution : stocker le `container_id` dès l'étape 1 dans le résultat D1 ; au retry, appeler `publish_container` directement (container déjà encodé entre temps). Ne JAMAIS recréer le container à chaque tentative.
- **FB Reels = endpoint séparé** : `POST /{page-id}/video_reels` (pas `/{pageId}/feed`, pas `/{igId}/media`). Corps : `{ video_url, description, title, published }`. Distinct des posts photo/texte FB. `META_PAGE_ID` requis (déjà dans les secrets).
- **Dual-gate serveur-à-serveur** (confirmé) : `social.js POST` accepte Bearer admin OU `?secret=POSTSTAY_SECRET`. Quand `agent-drafts.js` appelle `/api/social` en interne, passer `?secret=` — le Bearer ne se propage pas entre Functions CF.
- **Fenêtre auto-publish : mettre ≥30j, idéalement 90j** — une fenêtre de 14j laisse silencieusement orphelins tous les drafts `approved` planifiés > 14j en arrière (typique après backlog ou pause). Symptôme : cron tourne mais ne publie rien. Diagnostic : simuler la query de sélection D1 manuellement.
- **`callLLM` retourne `{ok, text}` jamais une string** — ne JAMAIS écrire `captionRes.trim()` ou `captionRes.split()` directement sur le résultat. Toujours `captionRes.text.trim()` après avoir vérifié `captionRes.ok`.

- **`rebuildRevenus2026_` = DESTRUCTIF si le Sheet contient des données mixtes (système + manuel).** La fonction zéro TOUTES les lignes data des colonnes cibles AVANT de re-appliquer depuis les onglets source. Toute donnée saisie manuellement hors des onglets source (Airbnb historique, corrections, données hors-système) est définitivement perdue. **La prochaine fois : NE JAMAIS faire de zéro global sans avoir exporté une copie du Sheet.** L'alternative safe = trigger `syncRevenus2026` (mémo-based = incremental, jamais destructif).

- **Le trigger `syncRevenus2026` (15 min) est la seule voie safe pour les incréments.** Il utilise le mémo `rev2026_traites` pour ne traiter que les résas nouvelles, jamais les existantes. Il ne touche jamais les cellules qui n'ont pas de delta à appliquer. Utiliser TOUJOURS cette voie pour les nouveaux enregistrements ; la fonction rebuild est réservée à un reset total sur données 100% système.

- **Avant tout rebuild rétroactif sur un Sheet Google, demander : "ces données viennent-elles toutes d'un onglet source ?"** Si la réponse est "non" (données manuelles, corrections, imports externes), un rebuild qui zéro+reapply va détruire les données orphelines sans avertissement.

## 2026-06-19 — FB page Business Suite, token Meta, pipeline auto-pub

- **La limite de la Bio FB = 101 caractères STRICTEMENT.** Pas de troncature silencieuse : le champ bloque à 101. Pour vider une textarea remplie via Business Suite avec computer-use : `Ctrl+A` sélectionne TOUTE la page (pas le champ), et `super+a` + Delete ne supprime que les derniers caractères. La seule voie fiable = demander à Vincent de coller le texte exact (≤ 101 chars).
- **Deux stores CF secrets distincts : Pages vs Worker.** `wrangler pages secret put --project-name X` ≠ `wrangler secret put --name worker-name`. Un secret posé côté Pages n'est pas visible par le Worker et vice versa. Toujours vérifier les deux si un secret est partagé entre les deux runtimes.
- **Le CTA "Book now" FB n'est PAS éditable en mode "Manage Page".** En mode gestion, le bouton disparaît de la vue. Pour modifier l'URL cible → passer en vue visiteur (icône œil) → hover sur le bouton → crayon d'édition. Ou passer par Page Settings → Buttons.
- **Business Suite "Edit Page" modal = seul endroit pour Social Links et Bio.** Onglet "À propos" de la page = lecture seule. Pour éditer : business.facebook.com → Pages → Amaryllis → Edit Page → sections "Links" et "About".
- **`meta-token-exchange.js` = runbook de renouvellement token Meta.** Endpoint temporaire (auth POSTSTAY_SECRET). Flow : short-lived user token → `oauth/access_token?grant_type=fb_exchange_token` → long-lived → `/me/accounts` → page token non expirant → stocké en D1 `kv_store`. Jamais renvoyé en clair. À supprimer après Business Verification → System User token permanent.
- **Auto-publication pipeline confirmé fonctionnel.** Post Zandoli a été publié automatiquement par le Worker pendant la session (37min après le début). Le cron `runEditorialAutoPublish` (horaire) publie les drafts `approved`. Statut `drafted` ≠ publié : `approved` requis.

## 2026-06-16 (audit Playbook)
- **`BIENS[].lieu` est ENRICHI** ("…, Martinique") → `isMartinique(b)` se trompe sur un élément BIENS. Pour le marché d'un bien, passer par le canonique BRUT `CANON[id]` (RM-20).
- **Donnée saisie puis JETÉE** : `form.tel` collecté mais jamais transmis (metadata/INSERT). Avant de "capturer", vérifier si c'est déjà saisi côté front et juste perdu en aval (RM-10).
- **A/B = proxy ≠ conversion** : câbler `trackConversion(step:"purchase")` à la résa confirmée (Merci.jsx), n'attribuer qu'aux tests EXPOSÉS (`listActiveVariants`).
- **Findings sur réalité d'une donnée = confirmation humaine** : RM-13 (avis statiques) faux positif (réels). Demander la provenance à Vincent avant de "corriger".

## 2026-06-20 — Sécurité & CSP

- **CSP : domaine racine ≠ sous-domaine** — `connect-src: https://open-meteo.com` ne couvre PAS `https://api.open-meteo.com`. Toujours lister le sous-domaine exact utilisé par le code (vérifier les appels fetch réels, pas juste le domaine marketing).
- **Cache `public` sur réponse avec PII = faille** — `Cache-Control: public, s-maxage=300` sur `beds24-bookings` permettait à Cloudflare CDN de mettre en cache email/téléphone d'un voyageur et de le servir à un autre. Toute réponse personnalisée (auth requise, données user) doit être `private`.
- **Dual-gate serveur-à-serveur** — quand un endpoint a deux appelants légitimes (admin humain via Bearer + script interne via secret), utiliser `secret === env.SECRET || verifyBearer(ok)` plutôt que choisir l'un ou l'autre. Voir `social.js onRequestPost`.
- **Vérifier avant de proposer un chantier média** — j'ai proposé d'ajouter `fetchPriority="high"` sur les heroes (Chantier C) sans vérifier le code : c'était déjà en place pour tous les biens depuis la session précédente. Toujours `grep -n "fetchPriority"` avant de le mettre au plan.

## 2026-06-23 — Google Ads Angular UI

- **Les descriptions (90c) sont des `<textarea>`, les titres (30c) sont des `<input type="text">`.** Ne pas confondre — si tu mets 90c dans un input title tu as une erreur "90/30" silencieuse.
- **Display path (chemin d'affichage) = max 15 chars** (pas 20 comme on suppose). "villa-martinique" = 16c → invalide. Utiliser "martinique" (10c) ou "villa-martin" (12c).
- **`document.execCommand('insertText')` REMPLACE le contenu** (pas d'append). Si le champ est déjà rempli, il faut `inp.select()` avant, sinon le texte s'ajoute à la fin. Côté fiabilité : l'execCommand trigger le change-detection Angular là où le native setter seul ne le fait pas. Règle : setter natif pour initialiser, execCommand si Angular ne réagit pas.
- **AI Max Google Ads** : sur la page AI Max, les cases "Adaptation du texte" et "Extension d'URL finale" sont pré-cochées. Cliquer Suivant sans les décocher = AI Max activé. Si on veut le désactiver, il faut décocher AVANT de cliquer Suivant.
- **L'adblocker bloque le POST de publication de campagne Google Ads.** Le draft peut être entièrement configuré (il se sauvegarde partiellement à chaque étape), mais le bouton "Enregistrer" final échoue avec "Échec de l'enregistrement" si un adblocker tourne. → Vincent doit désactiver l'adblocker sur ads.google.com pour publier.
- **Google Ads Angular = Angular Material web components.** `button[text="Suivant"]` ne fonctionne pas — utiliser `Array.from(document.querySelectorAll('button, [role="button"], material-button')).find(b => b.textContent.trim() === 'Suivant')`.

## 2026-06-21 — Sync main = prod

- **La prochaine fois : un deploy manuel depuis une branche ≠ main = drift silencieux assuré.** `wrangler pages deploy` ne sait pas quelle branche est "prod" — il envoie ce qu'il a. La garde dans `deploy-pages.sh` + la CI sont les seuls garde-fous.
- **CI smoke test : ne jamais tester un endpoint qui dépend d'un secret externe** (OpenWeatherMap) sur l'alias preview CF Pages. Les secrets CF Pages ne s'appliquent qu'à l'env `production`. Tester uniquement les routes statiques React (/ et /amaryllis) dans la CI ; les APIs avec clés externes = test depuis prod directement (curl post-deploy manuel si nécessaire).
- **Token API Cloudflare pour CI** : doit avoir les 2 permissions `Cloudflare Pages: Edit` + `Workers Scripts: Edit`. Le token existant `amaryllis` (Workers AI + Account Settings) est insuffisant pour déployer.
- **Git push origin main déclenche la CI** — mais origin/main était ~100 commits en retard depuis des mois. Penser à pusher régulièrement pour ne pas accumuler ce delta.

## 📅 AGENDA = engagements humains datés seulement, jamais de récurrences auto — 2026-06-30
- **Piège** : 31 items `[QA hebdo/mensuel]` pour des crons automatiques ajoutés dans AGENDA.md → hook session-brain les injectait à T-7j chaque session pendant 6 mois.
- **La prochaine fois** : avant d'ajouter dans AGENDA.md, vérifier : "Est-ce une action que VINCENT doit faire à une date précise ?" Non → zéro entrée AGENDA. Documenter dans le Worker/cron lui-même.

## 🔄 Hook auto-commit brain = ne pas re-commiter après Edit mémoire — 2026-06-30
- **Piège** : après Edit sur `~/.claude/memory/AGENDA.md`, tentative de `git commit` → "nothing to commit" — le hook PostToolUse auto-brain avait déjà tout commité instantanément.
- **La prochaine fois** : après Edit d'un fichier `~/.claude/memory/`, le hook a déjà commité. Juste `git push` si nécessaire pour envoyer sur remote.

## ⚛️ React prop async + local state : `useEffect` de synchro obligatoire — 2026-06-30
- **Cas** : note d'impact initialisée depuis `userNote` prop (chargé depuis API). Après changement de statut → `load()` recharge → `userNote` change → local state `note` doit se resynchroniser.
- **La prochaine fois** : `useEffect(() => { setNote(userNote || ""); }, [userNote])` à côté de `useState(userNote || "")`. Sans cet effet, le state local reste "stale" même après re-fetch parent.

## 🤖 Recos agents ignorées : toujours envoyer le "pourquoi" à l'agent — 2026-06-25
- **Règle** : quand on ignore une reco d'agent, relancer cet agent avec un `brief` expliquant pourquoi → il apprend et affine ses prochaines recos.
- **Format brief** : "RECO IGNORÉE [id] : [action]. RAISON : [pourquoi ignorée]. CONTEXTE ACTUEL : [ce qui existe déjà ou pourquoi c'est inadapté]. Génère une reco plus précise/pertinente ou confirme qu'il n'y a rien à faire."
