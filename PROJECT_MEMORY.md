# PROJECT_MEMORY — Amaryllis Locations (villamaryllis.com)

> Mémoire long terme du projet. Complète `CLAUDE.md` (architecture technique de référence).
> Ici : état, décisions, contraintes de Vincent, faits opérationnels (crons, secrets, IDs), pièges, et historique.
> **Tenir à jour** à chaque session significative (ajouter en bas la date + ce qui a changé).
> Dernière mise à jour : **2026-05-30**.

---

## 1. Le projet en une phrase
Conciergerie + site de réservation directe pour **7 logements** (Martinique + Nogent-sur-Marne), avec un **site public marketing** (villamaryllis.com) et un **dashboard admin** privé (cartographie de flux, dark theme), opéré par **Vincent Salomon**.

### Les 7 biens (nomenclature STRICTE — ne jamais confondre)
| Bien | Type (mot exact) | Lieu | Prix base | Capacité |
|---|---|---|---|---|
| Amaryllis | **villa** | Sainte-Luce | 280 €/nuit | 8 |
| Iguana | **villa** | Sainte-Luce (Résidence Amaryllis) | 180 € | 6 |
| Zandoli | **logement** (PAS villa) | Sainte-Luce | 220 € | 5 |
| Géko | **cocon** (PAS villa) | Sainte-Luce | 150 € | 4 |
| Mabouya | **studio** (jacuzzi) | Sainte-Luce | 110 € | 2 |
| Bellevue / Schœlcher | **appartement de standing** | Schœlcher (œ ligature) | 100 € | — |
| Nogent | **appartement** | Nogent-sur-Marne (94) | 85 € | — |

- **Seuls Amaryllis et Iguana sont des « villas ».** Le fact-checker (`functions/api/_factcheck.js`) rejette « villa Zandoli/Géko/Mabouya/Bellevue ».
- Offre **groupée** : coupler Zandoli + Géko + Mabouya (et Iguana) → jusqu'à **11 pers** via `/location-groupe-sainte-luce`.
- Le cluster Sainte-Luce est physiquement la **« Résidence le Clos de Bellevue, Chem. Bois Grillé, 97228 Sainte-Luce »** (adresse réelle GBP Villa Amaryllis) / **quartier Montravail, 1170, 97228 Sainte-Luce** (adresse GBP Résidence).

---

## 2. URLs, comptes, déploiement
- **Prod** : https://villamaryllis.com (Cloudflare Pages, projet **`dashboard-amaryllis`**, account `3c031c79a864a3e1f0d8c17c433b2247`). Alias : dashboard-amaryllis.pages.dev.
- **Repo** : github.com/vinsmaf/dashboard-amaryllis · local `/Users/vincentsalomon/locatif-dashboard`.
- **Déploiement** : `npm run deploy:pages` (build + déploie + **smoke test**). ⚠️ **JAMAIS** déployer sur `patrimoine-dashboard` (autre projet Claude, garde-fou dans `scripts/deploy-pages.sh`).
- **Worker iCal** séparé : `npx wrangler deploy` (`amaryllis-ical-sync`).
- **Mot de passe admin** : stocké côté user (localStorage `ldb_auth_v1`), non versionné. Auth serveur via `/api/admin-auth` (rate-limited, token signé).

### Apps Script (Google Sheets bridge)
- Projet **« Site web Amaryllis »**, scriptId `1PJVUdEra…`, deployment id `AKfycbw-t5kd_0f3OsEoDkOJHzYPHIBhWzz34aj7yagP57-Cj-7pLj6TiuRaUuusrCwAiA30Gg`.
- Source **`appscript/SCRIPT_SHEETS.js`** (le `SCRIPT_SHEETS.gs` racine est OBSOLÈTE). Déploiement : `clasp push -f` puis `clasp deploy -i <deployment id> -d "msg"` (toujours le **même** deployment id pour garder l'URL).
- Spreadsheet ID : `1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U`. Onglet unique réservations : **« Toutes les Réservations »** (13 colonnes), action `importAllReservations`.

### Beds24
- API **V2 uniquement** (V1 morte = errorCode 1000). Compte louerpremium@gmail.com (ID 46819). **Nogent = propId 158192** (seul bien sur Beds24 ; les biens Martinique sont gérés iCal). Secret `BEDS24_TOKEN`.

---

## 3. Faits opérationnels (à connaître avant d'agir)

### Secrets Cloudflare Pages (production) — vérifiés présents
`POSTSTAY_SECRET`, `GA4_API_SECRET`, `CONTACTS_ALERT_SECRET`, `MENAGE_ALERT_SECRET`, `META_APP_SECRET`, `META_PAGE_TOKEN`, `PRIX_RECAP_SECRET`, `PURGE_SECRET`, `RESEND_FROM`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (webhook ACTIF, renvoie 400 sur signature invalide), `RESEND_API_KEY` (variable, fonctionne — testée OK), `BEDS24_TOKEN`, `APPS_SCRIPT_URL`, `GOOGLE_PLACES_API_KEY`, `GA4_*`, `APIFY_TOKEN`, `NTFY_TOPIC`, iCal URLs.
- ⚠️ Un secret modifié via `wrangler pages secret put` n'est pris en compte qu'après un **nouveau déploiement** (`npm run deploy:pages`).
- `POSTSTAY_SECRET` sert d'auth à **tous** les crons emails (poststay, prearrivee, relance-panier) + send-guest-email. Valeur connue de Vincent (présente dans les URLs cron-job.org). Ne pas la réinitialiser sans mettre à jour les crons.

### D1 — base `revenue-manager` (binding `env.revenue_manager`)
- Tables clés : `direct_bookings`, `abandoned_carts`, `agent_actions`, `agent_drafts`, `editorial_calendar`, `llm_outputs`, `contacts`, RM (`rm_*`), rate-limit.
- ⚠️ **`direct_bookings`** : créée à l'origine par `notify-booking.js` (PK `payment_intent_id` ; colonnes paiement). On a **ajouté par ALTER** `email, prenom, bien_id, prearrivee_sent, poststay_sent`. `storeDirectBooking` (stripe-webhook) fait un **upsert par payment_intent_id**. Les crons clés = `rowid` + filtre `email IS NOT NULL`.

### Crons (cron-job.org, compte de Vincent, fuseau America/Martinique)
| Tâche | URL `?secret=POSTSTAY_SECRET` | Fréquence |
|---|---|---|
| Pré-arrivée J-3 | `/api/send-prearrivee` | quotidien 9h |
| Post-séjour J+1/J+3 | `/api/send-poststay` | quotidien 10h |
| Relance panier abandonné | `/api/send-relance-panier` | horaire |
| Récap prix hebdo | `/api/send-prix-recap` | lundi 4h |
| Alerte ménage | `/api/send-menage-alert` | quotidien 8h |
Autres crons via le **Worker** (`workers/ical-sync`) : sync iCal horaire, drafts éditoriaux J-2 (`0 12 * * *`), auto-publish réseaux horaire (`0 * * * *`), rappel rotation tokens (trimestriel).

### Google Business Profile (Place IDs, dans `google-reviews.js`)
- Villa Amaryllis : `ChIJWbeKdLghQIwRCppz2lJ39Jk` (⭐5,0 · 20 avis)
- Résidence Amaryllis : `ChIJc2hlO7chQIwRQaczraCwlNs` (⭐4,7 · 24 avis)
- Schœlcher & Nogent : **fiches pas encore créées** (kit prêt : `docs/google-business-profiles-kit.md`).
- 30/05 : noms recapitalisés + **catégorie principale → « Maison de vacances »** sur les 2 fiches (en attente Google). ⚠️ Cette catégorie **n'expose AUCUN attribut** (piscine/WiFi/etc.) ni horaires standards → équipements à mettre dans description + photos.

### Paiement (Stripe)
- `create-payment-intent` (capture immédiate) → enregistre le **panier** en D1. `notify-booking` (client, après paiement) → alerte hôte email+ntfy + enregistre la résa. `stripe-webhook` → confirme Beds24 + email confirmation voyageur + `storeDirectBooking` (avec email) + event GA4 `booking_completed`. Caution = pré-autorisation séparée (`create-deposit-intent`).

---

## 4. Système emails voyageurs (CRM) — branché 30/05
- **Seules les résas DIRECTES** (Stripe) reçoivent ces emails. Airbnb/Booking gèrent leurs propres comms (consigne Vincent).
- `functions/api/send-guest-email.js` = envoi générique (templates servis depuis `public/email-templates/*.html` : `pre-arrivee`, `post-sejour`, `relance-panier`, `newsletter-hiver`). Auth header `X-Send-Secret` ou `?secret=`.
- Pré-arrivée J-3 : **n'envoie PAS le code d'accès** (« communiqué 24h avant »). Post-séjour : 2 boutons avis (Google par bien + Airbnb). Relance panier : lien de reprise pré-rempli, exclut les paniers convertis.
- Resend : expéditeur `RESEND_FROM` (domaine `mail.villamaryllis.com` — vérifier DNS si envois échouent). Alertes hôte par défaut → `vinsmaf@hotmail.com` / `contact@villamaryllis.com`.

---

## 5. Pièges connus (footguns) — lire avant SEO/résa/réseaux
1. **SEO meta fiches = DOUBLE SOURCE.** `functions/[slug].js` (HTMLRewriter runtime) **écrase** `scripts/prerender.mjs`. Éditer les DEUX, la vérité = la fonction. Title ≤60c, desc ≤158c. `functions/[slug].js` a sa propre table `BIENS` (prix codés en dur, à synchroniser).
2. **Réservations** : un seul onglet Sheet « Toutes les Réservations », action `importAllReservations`. `importBeds24` et l'onglet « Réservations Nogent » n'existent plus. Comparaisons d'id en `String`.
3. **Réseaux** : un draft `social_post` doit avoir `payload.channels = ["ig","fb"]` sinon **Facebook est silencieusement zappé**. Forcé dans `agents-run.js`. Statut `approved` requis pour publication par le cron.
4. **Image Resizing Cloudflare (`/cdn-cgi/image/...`) NON activé** (404) → on génère des **variantes statiques** (`scripts/gen-image-variants.mjs`, 480/800/1200/1600w webp) au build.
5. **A/B testing** : ne jamais A/B le prix via `bien.prix` (casse le calcul total). Tests actifs : `cta_label`, `hero_amaryllis`.
6. **`booking_completed` serveur** utilise un client_id synthétique → pour l'attribution Google Ads, importer l'event **`purchase`** client, pas `booking_completed`.

---

## 6. Contraintes & décisions de Vincent (impératives)
- **Revenue Manager : RECO uniquement.** Jamais appliquer prix/séjour-min en direct sans validation.
- **Emails voyageurs : résas directes only.**
- **Jamais de connexion à ses comptes ; jamais lancer de dépense pub / créer un compte / valider une fiche GBP à sa place.** Claude prépare, Vincent valide/lance.
- **Mailto** : ouvrir une nouvelle fenêtre (`target="_blank"`).
- Déploiement Pages uniquement via `npm run deploy:pages` (jamais patrimoine-dashboard).
- Pour piloter le navigateur (GA4, GBP, cron-job.org) : autorisation « Pilote mon navigateur » via l'extension Chrome MCP.

---

## 7. Marketing / acquisition — état
- **Google Ads** : kit prêt (`docs/google-ads-kit.md`, 10 RSA + 5 Meta Ads rédigées). ~400 € de crédit à vérifier. Lien GA4↔Ads créé (compte 226-428-3778). Audience remarketing GA4 **`RMKT_Vu_fiche_calendrier_sans_resa`** créée (regex 7 fiches + page groupe, exclusion /merci, 30 j). Google Signals actif.
- **Meta/Facebook Ads** : ⚠️ **pas de MCP de gestion de campagnes**. Zapier = seulement « Facebook Lead Ads » (capture leads). Options : A) Ads Manager piloté navigateur (reco, étape 2 après Google), B) Lead Ads→D1 via Zapier, C) coder `functions/api/meta-ads-*` (Marketing API, compte pub + token `ads_management` requis). **Au backlog** (Traffic Manager, à-planifier).
- **GBP** : voir §3. Kit complet `docs/google-business-profiles-kit.md`.

---

## 8. Backlog & agents
- 17 agents IA (`agents-run.js`, claude-haiku-4-5) → table D1 `agent_actions` (statuts FR : `a-planifier`, `backlog`, `bloqué`, `fait`). API `/api/agents-actions`.
- Sortie LLM logguée en D1 `llm_outputs` (opt-in `logSource`).
- Lots backlog déjà traités : SEO meta, sécurité (rate-limit, token signé, HMAC webhook Beds24), Growth A/B, Perf images/API, Conversion (avis sur fiches), CRM (newsletter, relance), Observabilité, Compliance RGPD/Loi Le Meur, Admin logistique (checklists docs), QA (70 tests Vitest).
- Docs livrables clés dans `docs/` : `google-business-profiles-kit.md`, `google-ads-kit.md`, `cron-emails-setup.md`, `checklist-etat-des-lieux.md`, `alerte-reappro-consommables.md`, `registre-traitements-rgpd.md`, `compliance-rgpd-lemeur.md`, `runbook-rotation-tokens.md`, `revenue-mabouya-minstay-reco.md`.

---

## 9. À faire (côté Vincent / prochaines sessions)
- Créer fiches GBP **Bellevue (Schœlcher) + Nogent** (kit prêt) → puis fournir leurs Place ID pour personnaliser les liens d'avis emails.
- Vérifier crédit 400 € Google Ads → lancer campagne Brand/Search.
- Importer la conversion **`purchase`** (pas booking_completed) dans Google Ads.
- Répondre à tous les avis Villa Amaryllis (1/20).
- Valider docs compliance avec un avocat.
- Plus tard : Meta Ads (option A), avis Airbnb en D1, fiches Google Business Profile cluster.

---

## Agent AI-Ops (gestion auto des sources LLM gratuites)
- **`functions/api/ai-ops.js`** : agent qui (1) auto-découvre les modèles dispo par provider (`/v1/models`), (2) choisit le meilleur par provider×tier via classement, (3) teste leur santé en isolation, (4) écrit un **plan** en D1 (table `ai_ops`, clé `plan`) que **`_llm.js` applique en LIVE** (bascule de modèle **sans redéploiement**), (5) désactive les providers totalement KO, (6) se **rafraîchit seul** si > 20 h.
- Déclenché en tâche de fond (`context.waitUntil`) au début de **chaque `agents-run`** → self-forming sans intervention. Aussi : `GET /api/ai-ops?secret=POSTSTAY_SECRET` (état + refresh si périmé), `POST {action:'refresh'|'reset'}`.
- `_llm.js` : ordre modèle = `opts.model` (test isolé) > **plan AI-Ops (D1, cache 10 min)** > `MODELS` statique. Providers `plan.disabled` skippés.
- **Gemini** = provider câblé (endpoint OpenAI-compat) mais **NON activé** : l'API Gemini gratuite est **restreinte géographiquement** (indisponible depuis la Martinique / le compte de Vincent). Stub inerte sans clé ; ne pas chercher à l'activer. Si jamais une clé géo-bloquée était posée, l'AI-Ops la désactiverait automatiquement.
- **max_tokens agents = 4096** (débridé depuis 2048 le 30/05) pour des réponses plus complètes.
- **Historique transmis** débridé (`fetchAgentHistory`) : 120 non-faits + 80 faits (était 80/40) → agents mieux contextualisés. Contexte « Gemini ~1M » non dispo (géo-restreint).
- Premier run : Groq smart auto-upgradé vers **`openai/gpt-oss-120b`** ; 12/12 modèles verts. Inspiré du moteur `ai-ops.js` du patrimoine-dashboard (version KV) — ici en D1.

## Amélioration des agents (programme 8 points)
État au 30/05 : **8/8 LIVRÉS** ✅ (programme complet). **#2 RAG Vectorize** : index `amaryllis-knowledge` (1024 dims, embeddings `@cf/baai/bge-m3` via REST `CF_AI_TOKEN`), binding **`VECTORIZE`** ajouté au projet Pages **via l'API Cloudflare** (PATCH merge — secrets/D1/KV préservés ; pas de dashboard). `_rag.js` (embed/ragUpsert/ragSearch/ragBlock), `/api/rag-ingest` (faits biens + avis + drafts → vecteurs), `/api/rag-search?q=` (test, `?debug=1`). Branché dans les agents content (community-manager, seo-content-writer, voyageur-research, crm-manager, commercial-publicite) via `ragBlock` (fail-open). ⚠️ Vectorize indexe en **différé** (cohérence éventuelle, ~30s). Cron d'ingestion hebdo à ajouter (`/api/rag-ingest?secret=`). **#6** `/api/agents-triggers` (déclencheurs réactifs : avis/note/résas → réveil agent, baseline anti-faux-positif, cron conseillé). **#5** `/api/agents-deliver` (livrables prêts : `meta-seo` title/desc validés+fact-checkés, `email-sequence` 3 emails, `pricing-reco` grille saisonnière RECO). **Reste #2 RAG Vectorize** (nécessite création d'un index Vectorize côté Vincent). **#1 orchestrateur** `POST /api/agents-orchestrate {objectif}` : décompose un objectif transverse → dispatche aux bons agents (réutilise `AGENTS` exporté) → synthétise un plan ordonné avec dépendances ; stocké en D1 `orchestrations`. #7 `/api/agents-stats` (observabilité), #4 `/api/agents-eval` (LLM-juge → table `llm_evals`), #3 `/api/agents-verify` (challenger Mistral-large pour agents à enjeu juriste/revenue/consultant → annote `notes ⚠️ VÉRIF`), #8 `_biens.js` (source unique faits côté agents ; SEO côté `[slug].js`/prerender encore à migrer). Restants : #1 orchestrateur, #5 bras exécutant élargi, #6 déclencheurs réactifs, #2 RAG Vectorize (**nécessite création d'un index Vectorize côté Vincent**).

## Journal des mises à jour
- **2026-05-30 (soir 3)** : Programme amélioration agents Phases 1-2 (4/8). Endpoints `/api/agents-stats`, `/api/agents-eval` (table `llm_evals`), `/api/agents-verify`. Module `_biens.js` (source unique faits, branché dans agents-run). 70 tests OK.
- **2026-05-30 (soir 2)** : Création **agent AI-Ops** (`/api/ai-ops`) — auto-découverte/choix/santé/bascule des modèles LLM gratuits via plan D1 appliqué en live par `_llm.js`. Gemini ajouté en provider prêt-à-activer. Auto-refresh via `agents-run` (waitUntil). 70 tests OK.
- **2026-05-30 (soir)** : Fix LLM — Cerebras était **cassé** (IDs modèles llama-3.x supprimés du compte → 404 silencieux, fallback Groq). Corrigé : Cerebras = **`gpt-oss-120b`** (fast/medium) + **`zai-glm-4.7`** (smart). Nouvel endpoint **`/api/llm-ping`** (health-check par provider isolé + `?list=1` pour découvrir les modèles via `/v1/models`). Vérifié end-to-end (agent data-analyst sur cerebras OK + log `llm_outputs`). Gotcha : modèles à raisonnement (gpt-oss/glm) → budget ≥ qq centaines de tokens. Providers actifs confirmés : Groq, Cloudflare AI, Mistral (small/medium/large), Cerebras. Distribution réelle : Groq ~10, Cloudflare ~6, Cerebras 4, Mistral 3 agents.
- **2026-05-30** : Création de ce fichier. Branchement complet emails voyageurs (pré-arrivée/post-séjour/relance panier + crons). Fix schéma `direct_bookings`. Optimisation GBP (noms + catégorie « Maison de vacances » sur Villa & Résidence Amaryllis). Constat : GBP n'expose pas d'attributs pour cette catégorie. Kit GBP + audit créés. Facebook Ads ajouté au backlog.
