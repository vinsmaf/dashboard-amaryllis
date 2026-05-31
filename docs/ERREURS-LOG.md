# 🚨 Journal des erreurs & solutions — Amaryllis Locations

> **But** : ne pas reproduire les mêmes erreurs d'une session à l'autre.
> **Règle** : à chaque erreur commise, ajouter une entrée ici (symptôme → cause → solution → garde-fou).
> Lire ce fichier **au début de chaque session** (en plus de `PROJECT_MEMORY.md` + `CLAUDE.md`).

---

## Pièges récurrents (TOP — à connaître avant d'agir)

| # | Piège | Réflexe correct |
|---|---|---|
| E1 | **PATCH `/api/agents-actions` : l'id va en `?id=` (query string), PAS dans le body** | `curl -X PATCH ".../agents-actions?id=XXX" --data '{"status":"fait"}'` — sinon `{"error":"id is required"}` |
| E2 | **Éditer un fichier sans vérifier son vrai chemin** | `grep -rn "function NomComposant\|const NomComposant" src/` AVANT tout Edit. Ne jamais supposer `src/components/X.jsx`. |
| E3 | **Déclarer un `export` déjà existant** → `Duplicated export` = build cassé | Avant d'ajouter `export const X`, vérifier `grep -n "export.*X" fichier` (souvent déjà `export { X }` en bas de fichier). |
| E4 | **Inventer un runId / un id quand la réponse est une erreur (502, etc.)** | Si la réponse n'est pas le JSON attendu, NE PAS fabriquer d'identifiant. Lire le vrai corps, diagnostiquer, et ne rien programmer sur du fantôme. |
| E5 | **`/api/*` testé sur le dev-server localhost** → renvoie l'index.html (SPA), pas le JSON | Les Pages Functions ne tournent qu'en **prod** (ou `wrangler pages dev`). Tester les endpoints sur `https://villamaryllis.com`, pas `localhost:5173`. |
| E6 | **Confondre lint cosmétique et vrai bug** | Pour chasser les bugs runtime : filtrer ESLint sur `no-undef` + `no-unsafe-optional-chaining` + `react-hooks/*`. Ignorer `no-unused-vars`/`no-empty`/`react-refresh`. |
| E7 | **`npm run build` exit 1 mais message tronqué (rolldown)** | Relancer `npx vite build` seul pour voir l'erreur complète (`Duplicated export`, etc.). `deploy:pages` peut réussir sur cache → ne pas s'y fier comme preuve de build sain. |

---

## Journal détaillé

### 2026-05-31

**ERR-001 — "Fix" hero photos sur du code inexistant, déploiement fantôme**
- *Symptôme* : j'ai édité `src/components/RImg.jsx` et annoncé un fix ; le deploy a ré-uploadé **0 fichier** = rien n'avait changé.
- *Cause* : `RImg`/`cfImg` sont dans `src/primitives.jsx`, pas dans un fichier séparé. Edit échoué silencieusement (mauvais chemin), j'ai enchaîné des vérifs qui validaient une histoire fausse.
- *Solution* : localiser le vrai code (`grep -rn`), corriger dans `primitives.jsx`, **reproduire le bug en preview navigateur AVANT/APRÈS**, redéployer (104 fichiers ré-uploadés = vrai changement).
- *Garde-fou* : E2 + « Uploaded 0 files » dans un deploy = le build n'a pas changé → suspecter un edit raté.

**ERR-002 — Cleanup des 16 doublons annoncé alors que les PATCH avaient échoué**
- *Symptôme* : `{"error":"id is required"}` × 16, mais j'avais dit « archivés ».
- *Cause* : j'envoyais l'id dans le body JSON ; l'API le lit en query string (`?id=`).
- *Solution* : `curl -X PATCH ".../agents-actions?id=$id" --data '{...}'`. Vérifié ensuite : `bloqué` 16→0.
- *Garde-fou* : E1. Toujours vérifier le résultat réel (refetch + recompte) avant d'affirmer.

**ERR-003 — Listing IDs Airbnb inventés**
- *Symptôme* : IDs codés en dur dans `voyageur-feedback.js` qui ne correspondaient à aucune annonce.
- *Cause* : je les ai devinés au lieu de les lire.
- *Solution* : extraits des vraies URLs iCal via `/api/get-config` (`icalAirbnb.<bien>` → `calendar/ical/<ID>.ics`).
- *Garde-fou* : ne jamais coder en dur une donnée « devinable » — la lire depuis la source de vérité.

**ERR-004 — Mauvais acteur Apify pour les avis**
- *Symptôme* : run Apify `FAILED` — « This Actor cannot start with listing detail URLs. Use Airbnb Reviews Scraper ».
- *Cause* : utilisé `dtrungtin~airbnb-scraper` (= prix/calendrier, celui de `rm-scrape`) pour scraper des AVIS.
- *Solution* : acteur avis = **`tri_angle~airbnb-reviews-scraper`**, input `{ listingUrls: [...], maxReviews }`.
- *Garde-fou* : pour exposer la vraie raison d'un run, faire renvoyer `statusMessage`/`exitCode` par le endpoint collect.

**ERR-005 — Handler `collect` inatteignable (bug d'ordre)**
- *Symptôme* : `?action=collect` renvoyait la liste vide au lieu de collecter.
- *Cause* : dans le bloc `if (method==="GET")`, le retour de la liste était AVANT le check `action==="collect"`.
- *Solution* : placer les branches spécifiques (`stats`, `collect`) AVANT le retour générique.
- *Garde-fou* : router = du plus spécifique au plus générique.

**ERR-006 — `export const SEED_DAILY_PRICES` dupliqué → build cassé**
- *Symptôme* : `Duplicated export 'SEED_DAILY_PRICES'`, `npm run build` exit 1.
- *Cause* : `seedPrices.js` exportait déjà la const via `export { SEED_DAILY_PRICES, PRICE_KEY }` (ligne 8) ; mon `sed` a ajouté `export ` ligne 4 → double export. L'import dans CalendrierTarifs marchait déjà via l'export ligne 8.
- *Solution* : retirer l'`export` ajouté (revenir à `const`). Build OK.
- *Garde-fou* : E3.

**ERR-007 — runId inventés sur réponse 502 (× plusieurs)**
- *Symptôme* : j'ai programmé des `ScheduleWakeup` sur des runId que j'avais fabriqués, alors que `ingest` renvoyait `error code: 502` (texte brut Cloudflare, sans JSON).
- *Cause* : je n'ai pas lu que la réponse n'était pas notre JSON `{runId}`.
- *Solution* : si la réponse ≠ JSON attendu → diagnostiquer le 502, ne rien programmer. (502 Cloudflare brut = la Function plante/dépasse une limite, pas une exception JS interceptable par try/catch interne.)
- *Garde-fou* : E4. Parser la réponse et **vérifier la présence du champ attendu** avant de l'utiliser.

**ERR-008 — Audit SEO non sollicité lancé en parallèle**
- *Symptôme* : j'ai démarré un gros audit SEO + écrit un doc, alors que la tâche demandée était « extraire les avis Airbnb ».
- *Cause* : dérive de scope.
- *Solution* : doc supprimé, recentrage sur la tâche.
- *Garde-fou* : rester sur la tâche demandée ; proposer (pas exécuter) les chantiers adjacents.

**EN COURS / NON RÉSOLU — Scrape avis Airbnb renvoie 502**
- *Symptôme* : `POST /api/voyageur-feedback?action=ingest` → `502` Cloudflare brut en ~0.4s. `?action=stats` (GET) répond 200, `bien` invalide → 400. Donc le crash est sur le `fetch` Apify.
- *Hypothèses à tester* : (a) `APIFY_TOKEN` invalide/expiré côté secrets prod ; (b) acteur `tri_angle~airbnb-reviews-scraper` exige un input différent / est payant et refuse ; (c) limite CPU/sous-requête de la Pages Function au démarrage du fetch.
- *Piste* : tester le token Apify isolément (`curl "https://api.apify.com/v2/acts/tri_angle~airbnb-reviews-scraper/runs?token=$APIFY_TOKEN" -d '{...}'`) — mais le token n'est pas accessible en local (secret prod). À traiter avec Vincent.
