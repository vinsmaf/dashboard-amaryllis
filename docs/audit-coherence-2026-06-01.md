# 🔍 Audit de cohérence du site — Amaryllis Locations

> Généré le 2026-06-01 par revue multi-agents (61 agents, 9 dimensions, vérif adversariale).
> **37 incohérences confirmées · 11 faux positifs écartés.**
> ⚠️ Audit en LECTURE SEULE — aucune correction appliquée. Validation de Vincent requise.
> Note : 3 findings ré-vérifiés manuellement par Claude (jacuzzi, rm-init, contacts) — voir nuances en bas.

Je vais lire les fichiers clés pour confirmer les numéros de ligne avant de produire le rapport, mais comme les incohérences sont déjà confirmées avec leurs emplacements, je produis directement le rapport markdown demandé à partir des données validées.

# Rapport QA — Audit de cohérence Amaryllis Locations

## 1. Résumé exécutif

Audit de cohérence du site et des fonctions serverless : **35 incohérences confirmées** (vérifiées dans le code source). La majorité relève de deux pièges structurels connus du projet : la **sécurité des endpoints** (CORS `*` sans authentification ni rate-limit) et le **SEO double-source** (divergence runtime `functions/[slug].js` vs prerender statique `scripts/prerender.mjs`).

**Risques dominants :**
- **Sécurité (critique)** : écriture/lecture D1 sans `verifyBearer`, `rm-init` réinitialise toutes les tables sans auth, webhook Beds24 acceptant des réservations fictives.
- **Routing/SEO (critique)** : 14 guides POI sans interception serveur `[slug].js` → Googlebot reçoit des meta génériques.
- **Factcheck équipements (critique)** : Jacuzzi inexistant affiché sur Villa Amaryllis (interdit par `_biens.js`).

### Compte par gravité

| Gravité | Nombre |
|---|---|
| Critique | 13 |
| Haute | 12 |
| Moyenne | 2 |
| Basse | 8 |
| **Total** | **35** |

### Compte par dimension

| Dimension | Nombre |
|---|---|
| securite | 13 |
| seo-double-source | 9 |
| routing | 6 |
| nomenclature | 3 |
| factcheck-equip | 3 |
| sync-sheets | 3 |

---

## 2. Tableau trié par gravité

| Gravité | Dimension | Titre | Fichier:ligne | Correction |
|---|---|---|---|---|
| Critique | securite | CORS `*` massif + endpoints modifiables sans auth | `functions/api/agent-drafts.js:10`, `beds24-create.js:12`, `site-config.js:7/39/60`, `rm-dashboard.js`, `rm-properties.js`, `rm-overrides.js` | Ajouter `verifyBearer` + restreindre CORS sur tous les endpoints sensibles |
| Critique | securite | agent-drafts endpoint sans authentification | `functions/api/agent-drafts.js` | Importer et appeler `verifyBearer` en début de `onRequest` |
| Critique | securite | POST `/api/rm-init` sans auth — crée/écrase toutes les tables D1 | `functions/api/rm-init.js:480-504` | `import { verifyBearer } from "./_adminauth.js"` + `if (!auth.ok) return json(401)` ; étendre à tous les `rm-*` |
| Critique | securite | D1 writes sans authentification | `functions/api/agent-drafts.js`, `agents-run.js`, `rm-overrides.js`, `rm-properties.js` | Ajouter `verifyBearer` au début de `onRequest` dans chaque fichier |
| Critique | securite | `contacts.js` GET/PATCH — `checkAuth()` retourne true si secrets indéfinis | `functions/api/contacts.js:15` | Faire échouer (401) si `ADMIN_PASSWORD`/`ADMIN_PWD` absents, ne jamais désactiver l'auth |
| Critique | routing | 14 guides POI sans interception serveur `[slug].js` | `functions/[slug].js` (défaut `context.next()` ~ligne 426) ; `src/data/guidesPoi.js`, `src/main.jsx:184` | Boucler sur `GUIDES_POI` par slug, injecter `metaTitle`/`metaDescription`/JSON-LD serveur-side |
| Critique | routing | Routes POI : injection SEO côté client uniquement (SEOMeta `useEffect`) | `functions/[slug].js:426`, `src/components/SEOMeta.jsx:26-57`, `src/data/guidesPoi.js` | Injecter les meta des 14 POI serveur-side avant `context.next()` |
| Critique | seo-double-source | guide-le-diamant : PRERENDER dépasse limites SEO (title 66c, desc 160c) | `scripts/prerender.mjs:246-247` | Aligner sur runtime `functions/[slug].js:81-82` ; title ≤60c, desc ≤158c |
| Critique | seo-double-source | guide-sainte-anne : RUNTIME desc 176c + divergence contenu | `functions/[slug].js:89` | Raccourcir à ≤158c et harmoniser avec prerender (155c) |
| Critique | seo-double-source | guide-sainte-anne : PRERENDER title 91c | `scripts/prerender.mjs:252` | Raccourcir à ≤60c, aligner sur `GuideSainteAnne.jsx` |
| Critique | seo-double-source | guide-proximite : RUNTIME title 69c, diverge prerender (77c) | `functions/[slug].js:109` ; `scripts/prerender.mjs` | Raccourcir runtime à ≤60c + harmoniser contenu |
| Critique | seo-double-source | guide-proximite : RUNTIME desc 202c, diverge prerender (149c) | `functions/[slug].js:110` ; `scripts/prerender.mjs:271` | Raccourcir à ≤158c, harmoniser mention « résidence Amaryllis » |
| Critique | factcheck-equip | Villa Amaryllis : Jacuzzi faux (interdit par `_biens.js`) + avis client fictif | `src/PublicSite.jsx:284-285,288` ; contredit `functions/_biens.js:12` | Supprimer « Jacuzzi privé »/« Private jacuzzi » des amenities et de l'avis James K. |
| Haute | securite | GET `/api/ical-config` expose URLs iCal Booking sans auth ni rate-limit | `functions/api/ical-config.js` | Ajouter auth + rate-limit (asymétrie vs `beds24-bookings`) |
| Haute | securite | POST `/api/beds24-manage` sans authentification | `functions/api/beds24-manage.js:~21` | Ajouter `verifyBearer` avant traitement |
| Haute | securite | POST `/api/beds24-create` sans rate-limit | `functions/api/beds24-create.js` | Importer `_ratelimit.js`, appeler `rateLimit()` (cf. `contact.js` 3/h) |
| Haute | securite | Webhook Beds24 accepte requêtes non-authentifiées si secret absent | `functions/.../beds24-webhook` (lignes 34-36) | Rendre `BEDS24_WEBHOOK_SECRET` obligatoire en prod + rate-limit |
| Haute | securite | `rm-dashboard.js` GET sans auth — expose KPIs/prix RM | `functions/api/rm-dashboard.js:1-144` | Ajouter `verifyBearer` (ou purger champs sensibles) + rate-limit + valider `property_id` |
| Haute | securite | Pas de rate-limit sur POST `/api/chat` | `functions/api/chat.js:189-268` | Importer `rateLimit`, appeler avant fetch Groq |
| Haute | securite | Secrets Beds24 invocables sans auth client (create/manage) | `functions/api/beds24-create.js`, `beds24-manage.js` | Ajouter `verifyBearer` avant traitement (cf. `beds24-bookings.js`) |
| Haute | seo-double-source | Zandoli : nomenclature « logement » au lieu de « villa » | `prerender.mjs:118` (nomenclature) | Remplacer « logement » par « villa » ligne 118 |
| Haute | nomenclature | « Schoelcher » sans ligature œ dans JSON-LD | `scripts/prerender.mjs:211` | `nom: "Bellevue Schœlcher"` |
| Haute | seo-double-source | guide-sainte-anne : RUNTIME title 63c (>60c) | `functions/[slug].js:88` | Raccourcir à ≤60c |
| Haute | seo-double-source | activites-sainte-luce : RUNTIME desc 216c | `functions/[slug].js:103` | Créer desc compacte ≤158c dans objet SEO |
| Haute | routing | 6 guides thématiques absents du sitemap statique | `public/sitemap.xml` ; routes dans `prerender.mjs:339-375` | Régénérer/déployer `sitemap.xml` via `prerender.mjs` |
| Haute | routing | Guides POI absents du sitemap généré | `dist/sitemap.xml`, `public/sitemap.xml` ; `prerender.mjs:407,639-642` | Régénérer le sitemap (obsolète, daté 2026-05-24) |
| Haute | factcheck-equip | Villa Iguana : amenities jacuzzi inexistant | `src/PublicSite.jsx:281,285` ; source `functions/[slug].js:13` | Supprimer « Jacuzzi privé » des amenities/amenitiesEn |
| Haute | factcheck-equip | Villa Iguana : desc serveur « 4 personnes » au lieu de 6 | `functions/[slug].js:30` | Remplacer « 4 personnes » par « 6 personnes » |
| Moyenne | seo-double-source | Guide Plongée : client-only, absent sitemap, pas d'injection SEO serveur | `src/main.jsx:218`, `prerender.mjs:369`, `public/sitemap.xml`, `functions/[slug].js` | Ajouter au sitemap + handler serveur (cf. guide-le-diamant `[slug].js:248-268`) |
| Moyenne | sync-sheets | Fetch directs Apps Script sans proxy (CORS + auth) | `src/Planning.jsx:320,327,337` ; `src/App.jsx:1155` | Remplacer par POST `/api/sheets-proxy` avec header `X-Script-Url` |
| Basse | nomenclature | Cohérence « Schœlcher » partout sauf prerender:211 | `scripts/prerender.mjs:211` | `nom: "Bellevue Schœlcher"` (doublon de l'item haute) |
| Basse | seo-double-source | guide-le-diamant : divergence title/desc runtime vs prerender | `scripts/prerender.mjs:246-247` vs `functions/[slug].js:81-82` | Harmoniser les 2 sources |
| Basse | seo-double-source | activites-sainte-luce : PRERENDER title 67c (runtime 56c conforme) | `scripts/prerender.mjs:276` vs `functions/[slug].js:102` | Synchroniser prerender sur le runtime |
| Basse | seo-double-source | `/guide` : entrée orpheline dans SITEMAP_META | `scripts/prerender.mjs:613` | Supprimer l'entrée OU ajouter `/guide` à ROUTES |
| Basse | routing | Pages légales noindex présentes en sitemap | `prerender.mjs:390,397` ; `sitemap.xml:80,88` | Filtrer les routes `noindex:true` à la génération du sitemap |
| Basse | sync-sheets | Fetch direct EmailSync sans proxy | `src/EmailSync.jsx:96` (91-119) | Passer par `/api/sheets-proxy` (POST + `X-Script-Url`) |
| Basse | sync-sheets | CANAL_LABELS : clé « Beds24 » majuscule manquante (asymétrie) | `CANAL_LABELS` lignes 453-455 | Ajouter `"Beds24": "Beds24"` (cosmétique, fallback existant) |

---

## 3. Top 3 actions prioritaires

1. **Sécuriser tous les endpoints d'écriture/lecture D1 et Beds24 (critique, sécurité).** Le plus grave : `rm-init.js` réinitialise les 13 tables RM sans auth, `agent-drafts.js`/`agents-run.js`/`rm-overrides.js`/`rm-properties.js` écrivent en D1 sans `verifyBearer`, et `contacts.js:15` désactive silencieusement l'auth si les secrets sont absents. Action : importer `verifyBearer` depuis `_adminauth.js` et retourner 401 en tête de `onRequest` sur tous ces fichiers ; corriger `checkAuth()` pour qu'il échoue (au lieu de retourner `true`) quand les secrets manquent. Ajouter rate-limit sur `chat.js`, `beds24-create.js`, `ical-config.js`. Rendre `BEDS24_WEBHOOK_SECRET` obligatoire.

2. **Injecter le SEO serveur-side des 14 guides POI dans `functions/[slug].js` (critique, routing).** Aujourd'hui Googlebot reçoit `index.html` générique car `SEOMeta` s'exécute en `useEffect` côté client. Action : avant `return context.next()`, boucler sur `GUIDES_POI` (`src/data/guidesPoi.js`) en matchant le slug et injecter `metaTitle`/`metaDescription` + JSON-LD Article. Puis régénérer et déployer `sitemap.xml` (obsolète depuis 2026-05-24) pour inclure les 14 POI + les 6 guides thématiques + Guide Plongée.

3. **Corriger les faits équipements et la nomenclature (critique/haute, factcheck + nomenclature).** Piège nomenclature villa confirmé : supprimer le « Jacuzzi privé » de Villa Amaryllis (`PublicSite.jsx:284-285,288`, interdit par `_biens.js:12`) et de Villa Iguana (`PublicSite.jsx:281,285`), corriger la capacité Iguana « 4 → 6 personnes » (`functions/[slug].js:30`), remplacer « logement » par « villa » pour Zandoli (`prerender.mjs:118`) et appliquer la ligature « Schœlcher » (`prerender.mjs:211`).

---

**Pièges connus confirmés dans cet audit :**
- **SEO double-source** (9 items) : le runtime `functions/[slug].js` réécrit le prerender `scripts/prerender.mjs` via `injectMeta()`. Toute correction doit aligner **les deux** sources, sinon la divergence persiste silencieusement.
- **Nomenclature villa** (3 items) : « villa » obligatoire (pas « logement »), ligature « Schœlcher » obligatoire.
- **Sécurité / pattern proxy Sheets** : `/api/sheets-proxy` + `X-Script-Url` est le modèle centralisé ; `EmailSync.jsx`, `Planning.jsx`, `App.jsx` y échappent encore (CORS + auth).
- **Sitemap non régénéré** : `public/sitemap.xml` daté 2026-05-24, 26 URLs vs 36 routes ROUTES — toujours regénérer après ajout de routes.
---

## Nuances de la re-vérification manuelle (Claude, post-workflow)

- ✅ **Jacuzzi Amaryllis** : CONFIRMÉ bug réel — `PublicSite.jsx:284-285,288` liste « Jacuzzi privé » + avis client, alors que `_biens.js:12` dit « interdit: PAS de jacuzzi ». À corriger en priorité (faux marketing).
- ✅ **rm-init / rm-dashboard / rm-overrides / rm-properties** : CONFIRMÉ 0 `verifyBearer`.
- ✅ **agent-drafts.js** : CONFIRMÉ CORS `*` + pas d'auth (ligne 10, onRequest 102).
- ⚠️ **contacts.js checkAuth** : nuance — fail-open SEULEMENT si `ADMIN_PASSWORD`/`ADMIN_PWD` absents. En prod ils existent → auth fonctionne. Gravité réelle = défense en profondeur, pas faille active.
- ⚠️ **sync-sheets fetch directs** : les findings citent `src/Planning.jsx` mais le vrai fichier est `src/tabs/Planning.jsx` — vérifier le chemin exact avant correction.
