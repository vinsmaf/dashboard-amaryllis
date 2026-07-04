# D1 & Sécurité — Learnings locatif-dashboard

> Pieges D1 generiques + securite (rate limit, auth, CSP, cache PII)
> Extrait de `../LEARNINGS.md` le 2026-07-04 (consolidation mémoire — split thématique).
> 8 entrées, triées par date décroissante.

## 🔴 D1/SQLite `ALTER TABLE ADD COLUMN col DEFAULT 'x'` BACKFILLE les lignes existantes (contrairement à l'intuition NULL) — 2026-07-04
- **Piège** : ajout d'une colonne `scope TEXT DEFAULT 'caption'` sur `agent_lessons` (pour séparer 2 usages du même mot-clé banni). Attente naïve : les lignes déjà insérées AVANT la migration auraient `scope=NULL`. Réalité SQLite : `ALTER TABLE ADD COLUMN ... DEFAULT val` applique la valeur par défaut à TOUTES les lignes préexistantes, pas seulement aux futures — 5 lignes insérées juste avant la migration se sont donc retrouvées avec `scope='caption'` (le défaut) au lieu du `scope='tool'` attendu, nécessitant un `UPDATE` correctif explicite après coup.
- **La prochaine fois** : après un `ALTER TABLE ADD COLUMN` avec `DEFAULT`, ne jamais supposer que les lignes préexistantes avant la migration sont à NULL — vérifier leur valeur réelle (`SELECT DISTINCT col FROM table`) et les corriger explicitement si elles doivent appartenir à une catégorie différente du défaut choisi.

## 🔍 Les alertes "double_booking" (coherence) lisent D1 `direct_bookings`, PAS le Google Sheet "Toutes les Réservations" — 2026-07-03
- **Piège évité** : cherché une résa signalée en double dans le Sheet "Toutes les Réservations" (703 lignes, via `/api/sheets-proxy` action=read) → aucun résultat. La résa existait bien, mais dans D1 `direct_bookings` — `coherence-check.js` fait `SELECT ... FROM direct_bookings`, une source complètement différente qui inclut aussi les imports email Airbnb/Booking (`payment_intent_id` du type `booking.com-XXXXX` pour ces derniers, pas un vrai PaymentIntent Stripe).
- **La prochaine fois** : pour toute alerte de cohérence (`kind:"coherence"` dans `client_errors`), chercher directement dans D1 `direct_bookings` (via `wrangler d1 execute --remote`), pas dans le Sheet — même si le nom de colonne (`voyageur`) est identique dans les deux sources, ce ne sont pas la même table.

## 🔴 D1 `db.exec()` casse tout DDL multi-lignes (saut de ligne = délimiteur) — 2026-07-01
- **Piège** : `env.revenue_manager.exec(\`CREATE TABLE ...\`)` avec un template literal multi-lignes fait planter le Worker (Cloudflare 1101 "threw exception") sur CHAQUE requête, GET compris — car `initTable()` s'exécute avant tout dispatch de méthode. Le plus trompeur : `CREATE TABLE IF NOT EXISTS` semble "sûr", mais D1 re-parse la requête cassée à chaque appel, table existante ou non.
- **Signal qui a permis de le débusquer** : `wrangler d1 execute --remote` (API HTTP D1) exécute la MÊME requête SANS problème — ça prouve que le SQL est valide, et isole le bug à la méthode `.exec()` du binding JS Workers spécifiquement (deux moteurs différents, pas le même parseur).
- **La prochaine fois** : ne JAMAIS écrire de DDL D1 en template literal multi-lignes. Toujours construire la requête en **une seule ligne** via concaténation `+` (chaque colonne = un fragment de string, comme dans `client-errors.js`/`voyageur-feedback.js`) — c'est déjà la convention établie dans 2 fichiers du repo, `maintenance.js` avait juste dévié.
- **Debug efficace** : quand un endpoint D1 renvoie une page HTML (`error code: 1101`) au lieu de JSON, tester le payload minimal (`{}`) et un GET simple d'abord — si même un GET basique plante, le problème est dans l'init/setup partagé (avant le dispatch de méthode), pas dans la logique métier spécifique.

## 🔄 `import-listings` est un UPSERT sûr — 2026-06-30
- **Fait** : `/api/rm-competitors/import-listings` fait un `COALESCE((SELECT id ... WHERE property_id=? AND platform_listing_id=?), ?)` → si le listing existe déjà, il est mis à jour sans perte des snapshots de prix liés. Safe à relancer plusieurs fois.

## 🔒 Tout endpoint avec écriture D1 publique = rate limit obligatoire — 2026-06-29
- **Piège** : `sign-contract.js` stockait des PNG base64 (~300 Ko) dans D1 sans rate limit → flood possible (mail + remplissage D1 + pollution base contrats).
- **La prochaine fois** : avant tout endpoint public qui écrit en D1 ou envoie un email, ajouter `rateLimit(db, { key: \`prefix:\${ip}\`, limit: N, windowSec: 3600 })`. Pattern = `_ratelimit.js` déjà présent et réutilisable.

## 📦 Widget tiers embed : CSP = 3 directives distinctes — 2026-06-22
- Un widget embed tiers (ex: GYG `widget.getyourguide.com`) nécessite d'ajouter son domaine dans **3 directives CSP séparées** : `script-src` (le script .js), `frame-src` (l'iframe rendu), `connect-src` (les appels XHR/fetch du widget).
- Oublier une → le widget charge silencieusement mais ne rend rien (ou erreur console bloquée). 
- **La prochaine fois** : à chaque nouvelle intégration widget, mettre à jour les 3 directives d'un coup.

## 2026-06-20 — Sécurité & CSP

- **CSP : domaine racine ≠ sous-domaine** — `connect-src: https://open-meteo.com` ne couvre PAS `https://api.open-meteo.com`. Toujours lister le sous-domaine exact utilisé par le code (vérifier les appels fetch réels, pas juste le domaine marketing).
- **Cache `public` sur réponse avec PII = faille** — `Cache-Control: public, s-maxage=300` sur `beds24-bookings` permettait à Cloudflare CDN de mettre en cache email/téléphone d'un voyageur et de le servir à un autre. Toute réponse personnalisée (auth requise, données user) doit être `private`.
- **Dual-gate serveur-à-serveur** — quand un endpoint a deux appelants légitimes (admin humain via Bearer + script interne via secret), utiliser `secret === env.SECRET || verifyBearer(ok)` plutôt que choisir l'un ou l'autre. Voir `social.js onRequestPost`.
- **Vérifier avant de proposer un chantier média** — j'ai proposé d'ajouter `fetchPriority="high"` sur les heroes (Chantier C) sans vérifier le code : c'était déjà en place pour tous les biens depuis la session précédente. Toujours `grep -n "fetchPriority"` avant de le mettre au plan.

## 🔒 Auth `if (env.SECRET && secret !== env.SECRET)` = BYPASS si secret absent → toujours fail-closed — 2026-06-19
- **Piège (audit ultracode)** : ce pattern d'auth, présent sur 3 endpoints, **ouvre l'accès** quand la variable d'env n'est pas définie (le `&&` court-circuite le check). **La prochaine fois** : toujours écrire `if (!env.SECRET || secret !== env.SECRET) return 401` — fail-**closed** (secret absent = refus). Vérifier avant déploiement que le secret EST présent en prod (test : `curl ...?secret=BOGUS` doit renvoyer 401) sinon le passage en fail-closed casse les crons. Cross-projet → `CROSS-LEARNINGS`.

## CF Pages secrets = write-only, inaccessibles localement — 2026-06-11
- **Les secrets CF Pages (`wrangler pages secret put`) sont write-only côté infra.** Impossible à lire via API Cloudflare, wrangler CLI, ou dashboard. La valeur n'est accessible que depuis une CF Function en runtime (`context.env.MA_CLE`). **Conséquence** : pour configurer un service tiers (ex. Resend, Stripe) qui nécessite la clé API, Vincent doit l'extraire depuis le dashboard du service tiers, pas depuis CF. Pour tester localement = `.dev.vars`.
