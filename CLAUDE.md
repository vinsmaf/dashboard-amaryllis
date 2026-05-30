# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 📌 **Mémoire long terme du projet → lire `PROJECT_MEMORY.md`** (état, décisions, secrets, crons cron-job.org + Worker, Place IDs GBP, système d'agents IA + RAG, contraintes de Vincent, backlog). Ce fichier-ci (`CLAUDE.md`) = référence **architecture/technique**.

## Project

Rental property management dashboard for 7 properties in France (Martinique + Nogent-sur-Marne). Combined public website (villamaryllis.com) and private `/admin` dashboard. Stack: React 19 + Vite, deployed on Cloudflare Pages.

## Design System

`src/tokens.css` — CSS variables for both surfaces (site = warm ivory/navy/coral, admin = dark slate). Imported globally in `main.jsx`. Token names: `--c-navy`, `--c-coral`, `--c-ivory`, `--c-sand`, `--c-muted`, `--c-gold`, etc.

`src/primitives.jsx` — reusable site components: `<Eyebrow>`, `<Display>`, `<Editorial>`, `<Button>`, `<Chip>`, `<RatingBadge>`, `<Icon>`, `<ThemeToggle>`.

`public/icons.svg` — SVG sprite, 21 icons (bed, bath, wifi, pool, car, star, calendar…). Usage: `<svg><use href="/icons.svg#bed"/></svg>`.

**For all French/English copy in `PublicSite.jsx` or emails, follow `docs/voice.md`.**
- Always `vous` (formal), never `tu`
- CTA canonical: RÉSERVER · DÉCOUVRIR · CONTACT
- Caution copy: see voice.md §6
- Property names canonical: see voice.md §12 (note: Schœlcher with œ ligature)

## Commands

```bash
npm run dev           # Local dev server (Vite HMR)
npm run dev:cf        # Local dev with Cloudflare Pages Functions (wrangler pages dev)
npm run build         # Production build → dist/
npm run lint          # ESLint
npm run preview       # Serve the dist/ build locally
npm run deploy:pages  # Deploy to Cloudflare Pages → dashboard-amaryllis (villamaryllis.com)
npm run deploy:worker # Deploy the iCal sync Worker (amaryllis-ical-sync)
```

There are no tests. No single-test command exists.

For local dev with backend functions (iCal proxy, Sheets proxy, Beds24), use `npm run dev:cf`. Copy `.dev.vars.example` to `.dev.vars` and fill in the secrets — wrangler reads this file automatically.

### ⚠️ Deploy safety — never deploy to `patrimoine-dashboard`

This account hosts **TWO** separate Cloudflare Pages projects :
- **`dashboard-amaryllis`** ✅ → `villamaryllis.com` (this project — locatif-dashboard)
- **`patrimoine-dashboard`** 🚫 → another Claude project (financial dashboard, do NOT touch)

Always use `npm run deploy:pages` which forces the correct project name via `scripts/deploy-pages.sh`. **Never** run `wrangler pages deploy ... --project-name patrimoine-dashboard` from this repo — it would overwrite the other project.

The script `scripts/deploy-pages.sh` has a hard guard that refuses `patrimoine-dashboard` as an argument.

## Architecture

### Routing (manual, no react-router)

`src/main.jsx` implements client-side routing via `window.location.pathname` matching with lazy-loaded components:

- `/admin*` → `App.jsx` (private dashboard, password-gated)
- `/{bienId}` (amaryllis, zandoli, iguana, geko, mabouya, schoelcher, nogent) → `PublicSite.jsx`
- `/guide`, `/guide-le-diamant`, `/guide-sainte-anne`, `/activites-sainte-luce`, `/guide-proximite`, `/guide-arlet`, `/explorer`, `/guide-trois-ilets` → dedicated Guide components
- `/landing*` → `Landing.jsx`
- `/villa-rental-martinique` → `GuideEn.jsx`
- Any unmatched path → `NotFound.jsx`

The `LangProvider` from `src/i18n.jsx` wraps the entire app (FR/EN translations for the public site).

### Backend — Cloudflare Pages Functions

All server-side logic lives in `functions/api/` (Cloudflare Pages Functions format, not Netlify). Each file exports `onRequest` or `onRequestGet`/`onRequestPost`:

**Authentification & Sécurité**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/admin-auth` | POST | `admin-auth.js` | Vérifie le mot de passe admin côté serveur — retourne `{ ok, role: "admin"\|"menage" }`. Rate-limited : 5 tentatives/IP/15min via D1. |
| `/api/get-config` | GET | `get-config.js` | Retourne `APPS_SCRIPT_URL` + URLs iCal Airbnb par bien (secrets jamais exposés dans le bundle JS). |

**Beds24**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/beds24-bookings` | GET | `beds24-bookings.js` | Proxy sécurisé vers l'API Beds24 V2 — liste/filtre les réservations. Params : `test=1` pour vérifier le token, `arrivalFrom`, `arrivalTo`, `departureFrom`, `departureTo`. |
| `/api/beds24-create` | POST | `beds24-create.js` | Crée une réservation Beds24 V2 directement via API (remplace l'iframe). Retourne `bookingId` + prix. |
| `/api/beds24-manage` | POST | `beds24-manage.js` | Actions sur une réservation existante — body: `{ action: "find"\|"confirm"\|"cancel", ... }`. |
| `/api/beds24-prices` | GET | `beds24-prices.js` | Dérive les tarifs journaliers Nogent (propId 158192) depuis les réservations Beds24 (l'endpoint inventory V2 renvoie 500 pour ce compte). |
| `/api/beds24-rates` | GET | `beds24-rates.js` | Récupère les tarifs journaliers Beds24 pour Nogent via `/inventory/rooms/calendar?includePrices=true`. Cache CDN 1h. Retourne `{ "YYYY-MM-DD": price }`. |
| `/api/beds24-webhook` | POST | `beds24-webhook.js` | Reçoit les notifications Beds24 en temps réel et transmet à Apps Script. |

**iCal & Disponibilités**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/fetch-ical` | GET | `fetch-ical.js` | CORS proxy serveur pour les URLs iCal Airbnb/Booking.com. Param : `url=<encoded-url>`. Whitelist de domaines autorisés. |
| `/api/get-availability` | GET | `get-availability.js` | Fusionne les iCal Airbnb + Booking.com pour un bien donné. Param : `bienId`, `bookingUrl`. |
| `/api/ical-config` | GET | `ical-config.js` | Retourne les URLs iCal Booking.com par bien depuis les secrets Cloudflare. |

**Google & Analytics**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/sheets-proxy` | POST | `sheets-proxy.js` | Proxy vers Google Apps Script — contourne CORS + bug redirect POST d'Apps Script (tableaux envoyés en GET paginé). Header optionnel `X-Script-Url` pour URL dynamique. |
| `/api/site-config` | GET/POST | `site-config.js` | Proxy bidirectionnel vers Apps Script (PropertiesService) — lit/écrit la config du site (séjour minimum par bien et par période). |
| `/api/analytics` | GET | `analytics.js` | Proxy vers Google Analytics Data API v1beta (GA4) — retourne 4 rapports en parallèle (overview, pages, pays, sources, devices) sur 30 jours. Auth Service Account. |
| `/api/google-reviews` | GET | `google-reviews.js` | Proxy sécurisé vers Google Places API v1 — récupère les avis Google pour Amaryllis ou Résidence. Param : `place=amaryllis\|residence`. |

**Paiement & Caution (Stripe)**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/create-payment-intent` | POST | `create-payment-intent.js` | Crée un PaymentIntent Stripe (capture immédiate). Body : `{ amount, currency, metadata, bookingId }`. |
| `/api/create-deposit-intent` | POST | `create-deposit-intent.js` | Crée un PaymentIntent Stripe en pré-autorisation (`capture_method: "manual"`) pour caution. Body : `{ amount, currency, metadata }`. |
| `/api/caution-checkout` | POST | `caution-checkout.js` | Crée une Stripe Checkout Session en pré-autorisation — retourne une URL Stripe hébergée à envoyer au voyageur. |
| `/api/manage-deposit` | POST | `manage-deposit.js` | Gère les cautions pré-autorisées. Body : `{ action: "capture"\|"cancel"\|"list", paymentIntentId, amount }`. |
| `/api/stripe-webhook` | POST | `stripe-webhook.js` | Reçoit les événements Stripe (`payment_intent.succeeded`, `checkout.session.completed`) — confirme la réservation Beds24 correspondante et notifie l'hôte par email. |

**Revenue Manager**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/rm-init` | POST | `rm-init.js` | Initialise la base D1 Revenue Manager — crée toutes les tables et seed les données de départ. |
| `/api/rm-dashboard` | GET | `rm-dashboard.js` | Données agrégées du Revenue Manager pour un bien (`property_id`) : recommandations, KPIs, signaux marché. |
| `/api/rm-properties` | GET/POST/PUT | `rm-properties.js` | CRUD sur les propriétés RM — list, get (avec profils saisonniers), update des paramètres de prix. |
| `/api/rm-overrides` | GET/POST/PUT/DELETE | `rm-overrides.js` | Overrides manuels de prix/séjour minimum/blocage pour des dates spécifiques. Params : `property_id`, `from`, `to`. |
| `/api/rm-rules` | GET/POST/PUT/PATCH/DELETE | `rm-rules.js` | CRUD des règles de pricing (lead time, day-of-week, saison, etc.). Params : `property_id`. |
| `/api/rm-recommendations` | GET/POST/PUT/DELETE | `rm-recommendations.js` | CRUD + moteur de pricing complet pour les recommandations RM — calcule le prix suggéré par jour selon profils saisonniers, règles et signaux. |
| `/api/rm-competitors` | GET/POST/PUT/DELETE | `rm-competitors.js` | Gestion des concurrents, snapshots de prix et recalcul des signaux marché (médiane, moyenne, percentiles). |
| `/api/rm-scrape` | GET/POST | `rm-scrape.js` | Déclenche un scraping Apify (acteur Airbnb) pour les listings concurrents. Requiert `APIFY_TOKEN`. |

**Communication & Alertes**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/contact` | POST | `contact.js` | Formulaire de contact public — stocke en D1 + envoie email via Resend. Rate-limited. CORS restreint aux domaines villamaryllis.com. |
| `/api/contacts` | GET/PATCH | `contacts.js` | Liste des leads (admin uniquement, auth Bearer). PATCH pour mettre à jour `status`/`notes` d'un lead. |
| `/api/chat` | POST | `chat.js` | Proxy Cloudflare → Groq API pour le ChatWidget public et l'assistant admin. Inclut le system prompt Amaryllis Locations. |
| `/api/ai-summary` | POST | `ai-summary.js` | Proxy sécurisé vers l'API Anthropic (claude-haiku-4-5) pour les résumés IA du dashboard. Body : `{ prompt, maxTokens }`. |
| `/api/send-prix-alert` | POST | `send-prix-alert.js` | Envoie email + push ntfy quand des prix sont sous le seuil minimum. Appelé depuis le CalendrierTarifs. |
| `/api/send-prix-recap` | GET | `send-prix-recap.js` | Récap email hebdomadaire des prix + liens Airbnb (prévu pour cron-job.org chaque lundi). Auth : `?secret=PRIX_RECAP_SECRET`. |
| `/api/send-guest-email` | POST | `send-guest-email.js` | Envoi générique email voyageur (templates `public/email-templates/*`). Réservé résas DIRECTES. Auth `X-Send-Secret`/`?secret=POSTSTAY_SECRET`. |
| `/api/send-prearrivee` | GET | `send-prearrivee.js` | Cron J-3 : email pré-arrivée aux résas directes (D1 `direct_bookings`). |
| `/api/send-poststay` | GET | `send-poststay.js` | Cron J+1/J+3 : post-séjour (Nogent/Beds24 + résas directes). Liens avis Google par bien. |
| `/api/send-relance-panier` | GET | `send-relance-panier.js` | Cron horaire : relance panier abandonné (D1 `abandoned_carts`, exclut convertis). |
| `/api/notify-booking` | POST | `notify-booking.js` | Alerte hôte fiable (email+ntfy) post-paiement + enregistre la résa directe en D1. |

**Agents IA**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/agents-actions` | GET/POST/PATCH | `agents-actions.js` | CRUD pour les actions des ~23 agents Amaryllis — stockage D1 (`agent_actions`). |
| `/api/agents-run` | POST | `agents-run.js` | Déclenche l'analyse autonome des ~23 agents via **LLM multi-provider** (`callLLM` : Groq/Cloudflare/Mistral/Cerebras). Body `{agents:["id"]\|"all", brief?}`. Self-refresh AI-Ops (waitUntil). Grounding RAG pour les agents content. |
| `/api/agents-orchestrate` | POST | `agents-orchestrate.js` | **Orchestrateur** : objectif → décompose → dispatche aux agents → plan coordonné (D1 `orchestrations`). |
| `/api/agents-triggers` | GET | `agents-triggers.js` | **Déclencheurs réactifs** : avis/note/résas → réveille le bon agent (état D1 `agent_triggers`). Cron conseillé. |
| `/api/agents-deliver` | POST | `agents-deliver.js` | **Livrables prêts** : `meta-seo` (title/desc validés), `email-sequence`, `pricing-reco`. |
| `/api/agents-stats` | GET | `agents-stats.js` | Observabilité (backlog, impacts, usage LLM 7j, qualité, plan modèles). |
| `/api/agents-eval` | GET | `agents-eval.js` | LLM-juge note les sorties (table `llm_evals`). |
| `/api/agents-verify` | GET | `agents-verify.js` | Vérif adversariale (challenger Mistral) pour agents à enjeu → annote `notes ⚠️ VÉRIF`. |

**LLM multi-provider, AI-Ops & RAG**

| Endpoint / module | Role |
|---|---|
| `functions/api/_llm.js` | `callLLM(env, {provider?, tier, messages, ...})` — cascade Groq→Cloudflare→Mistral→Cerebras(+Gemini si clé). Modèle = `opts.model` > plan AI-Ops (D1 `ai_ops`) > `MODELS` statique. |
| `/api/ai-ops` | `ai-ops.js` — **agent AI-Ops** : auto-découvre/teste/bascule les modèles gratuits, écrit un plan D1 appliqué en live par `_llm.js`. Self-refresh si >20h. |
| `/api/llm-ping` | `llm-ping.js` — health-check par provider isolé + `?list=1` (modèles `/v1/models`). |
| `functions/api/_biens.js` | **Source unique des faits** des 7 biens (nomenclature/équipements/capacités) + `EQUIP_RULES_TEXT`. |
| `functions/api/_rag.js` | RAG : `embed`/`ragUpsert`/`ragSearch`/`ragBlock` (Vectorize `VECTORIZE` + embeddings `@cf/baai/bge-m3`). |
| `/api/rag-ingest` | `rag-ingest.js` — ingère faits+avis+drafts → vecteurs. Auto chaque lundi (Worker cron). |
| `/api/rag-search` | `rag-search.js` — retrieval test (`?q=`, `?debug=1`). |

**Guides & Divers**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/guides` | GET/POST | `guides/[[path]].js` | Guides par propriété — GET : lit depuis D1 avec fallback `/public/guides/{id}.json`. POST : sauvegarde en D1. Param : `property_id`. |
| `/api/geo` | GET | `geo.js` | Retourne pays/ville du visiteur via headers Cloudflare — suggère la langue (FR/EN) et détecte contexte Caraïbes/métropole. |
| `/api/weather` | GET | `weather.js` | Proxy sécurisé vers OpenWeatherMap. Param : `loc=martinique\|nogent`. Cache CDN 30min. |
| `/api/airbnb-test` | GET | `airbnb-test.js` | Test READ-ONLY de l'authentification Airbnb + lecture des prix actuels (aucune modification). |

**Utilitaire interne**

| Fichier | Role |
|---|---|
| `_ratelimit.js` | Module partagé — rate limiter léger basé sur D1. Usage : `await rateLimit(db, { key, limit, windowSec })`. Non exposé comme endpoint HTTP. |

The `netlify/functions/` directory is a duplicate/legacy copy — the active functions are in `functions/api/`.

Environment secrets are set in Cloudflare Pages dashboard (production) or `.dev.vars` (local). See `.dev.vars.example` for all required keys: `BEDS24_TOKEN`, `APPS_SCRIPT_URL`, `STRIPE_SECRET_KEY`, iCal URLs per property per platform.

### Cloudflare Worker (separate deploy)

`workers/ical-sync/index.js` is a standalone Cloudflare Worker deployed via `wrangler.toml` (name: `amaryllis-ical-sync`). It runs on cron (`0 * * * *` hourly, `0 9 * * *` daily):
- Fetches iCal from Airbnb + Booking.com for all properties
- Detects new bookings by comparing UIDs against Cloudflare KV (`ICAL_STORE`)
- Sends email notifications via Resend API
- Pushes data to Google Apps Script (`APPS_SCRIPT_URL` secret)

Deploy separately: `wrangler deploy` from project root.

### Data Sources

All financial data flows from a single Google Sheets file (ID: `1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U`). The bridge is a Google Apps Script deployed as a web app — its URL is stored as `APPS_SCRIPT_URL`. The source for the Apps Script is `SCRIPT_SHEETS.gs`.

Data loading in `App.jsx`:
1. On mount, calls `syncFromSheets` → POSTs to `/api/sheets-proxy` → Apps Script reads Sheets and returns JSON
2. Falls back to hardcoded seeds if sync fails: `SEED_BIENS` (current-year data per property), `HIST_SEED` (2022–2025 historical), `CHARGES_2025`, `REVENUS_CANAL_2025`
3. Daily prices are stored in `localStorage` via `seedPrices.js` (`loadDailyPrices`/`saveDailyPrices`)
4. Reservations come from Beds24 V2 API (via `/api/beds24-bookings`) or iCal sync

### App.jsx Structure

Single large file (~3000+ lines). Key sections in order:
- Constants/seed data (`SEED_BIENS`, `ICAL_DEFAULTS`, `HIST_SEED`, `CHARGES_*`, `REVENUS_CANAL_*`)
- Reusable UI components: `Gauge` (SVG circular), `Spark` (sparkline), `PBar` (progress bar), `TodayBanner`, `AISummary`, `FAB`
- Tab components: `Planning`, `Cockpit`, `Previsionnel`, `Charges`, `Pilotage`, `Historique`, `VsAnnee`
- Main `App` component with tab state, sync logic, password gate

### Known Issues (from handoff.md)

1. **OCC scale mismatch**: `SEED_BIENS` stores occupancy as 0–100%; `SCRIPT_SHEETS.gs` returns 0–1 decimals due to `.map(v => v / 100)` at line 59. Defensive fix in `syncFromSheets`: `occ: arr.map(v => v > 1.5 ? v : v * 100)`
2. **HIST is hardcoded**: `HIST_SEED` should become reactive state synced from Google Sheets historical tabs (2022–2025)

### Recharts Gotchas

- Never mix `<Bar>` and `<Line>` inside `<BarChart>` — use `<ComposedChart>` instead
- Always explicitly import every component used (`ComposedChart`, `PieChart`, `Pie`, `Cell`, etc.)
- Avoid `lastIndexOf` on duplicate values in `Spark` — use index-based logic

### Public Site Components

`PublicSite.jsx` — property public pages (booking widget, photos, map via react-leaflet)  
`Landing.jsx` — access portal for Villa Amaryllis  
`EmailSync.jsx` — parses Gmail confirmation emails to extract booking amounts/platforms  
`src/i18n.jsx` — FR/EN translations object + `LangProvider` / `useLang()` hook  
`src/WikiImg.jsx` — Wikipedia image fetcher used in guide pages

---

## ⚠️ Footguns & pièges connus (à lire avant de toucher au SEO, aux résas ou aux réseaux)

### 1. SEO meta des fiches — DOUBLE SOURCE (le piège n°1)

Le `<title>` / `<meta description>` / `og:*` / JSON-LD des **fiches villas et de certains guides** existent à **DEUX endroits**, et c'est le **2ᵉ qui gagne** :

| Source | Fichier | Quand | Autorité |
|---|---|---|---|
| **Prerender statique** | `scripts/prerender.mjs` (tableau `ROUTES`) | au build (`npm run build`) → écrit dans `dist/<slug>.html` | ⚠️ **écrasé** pour les slugs interceptés |
| **Injection runtime** | `functions/[slug].js` (HTMLRewriter `injectMeta`) | à **chaque requête** Cloudflare Pages | ✅ **fait foi** (réécrit le `<title>` de l'HTML servi) |

**Conséquence :** modifier un titre/description de villa **uniquement dans `prerender.mjs` n'a AUCUN effet en prod** — `functions/[slug].js` le réécrit par-dessus.

**Slugs interceptés par `functions/[slug].js`** : les 7 biens (`amaryllis, zandoli, iguana, geko, mabouya, schoelcher, nogent`) + `guide`, `guide-le-diamant`, `guide-sainte-anne`, `villa-rental-martinique`, `activites-sainte-luce`, `guide-proximite`.

**Règle :** pour ces slugs, éditer le titre/desc dans **`functions/[slug].js`** (objet `SEO` pour les biens, ou les constantes `GUIDE_*`). Garder `prerender.mjs` cohérent en parallèle (baseline crawler + routes non interceptées), mais la vérité = la fonction.

**Vérif live obligatoire** (curl ne sépare pas les 2 sources, mais montre ce qui est servi) :
```bash
curl -s https://villamaryllis.com/mabouya | grep -oE "<title>[^<]*</title>"
```
- Cibles SEO : **title ≤ 60c**, **meta description ≤ 158c** (au-delà → tronqué en SERP).
- ⚠️ `functions/[slug].js` a sa **propre table `BIENS`** (nom, prix, desc, rating) **dupliquée** de `PublicSite.jsx` / `prerender.mjs` — prix codés en dur (280, 220, …), pas lus depuis l'admin Tarifs. Mettre à jour les 2-3 endroits si un prix change.

### 2. Réservations — UN SEUL onglet Sheet : « Toutes les Réservations »

Tous les flux convergent vers l'onglet **« Toutes les Réservations »** (13 colonnes) via l'action Apps Script **`importAllReservations`** :
- saisies manuelles directes (admin add/edit/delete) ;
- sync principal 📊 (`App.jsx` → iCal toutes propriétés + Beds24 Nogent) ;
- onglet Beds24 (`src/tabs/Beds24Admin.jsx`) + **webhook temps réel** (`functions/api/beds24-webhook.js`).

Les 3 flux mappent vers le format unifié **côté JS** avec un id `beds24-<bookingId>` (upsert sans doublon). L'action `importBeds24` et l'onglet « Réservations Nogent » **n'existent plus**. Les suppressions comparent l'id **en `String`** (un bug historique number/string est corrigé).

**Source Apps Script** : `appscript/SCRIPT_SHEETS.js` (déployé via `clasp`). ⚠️ Le `SCRIPT_SHEETS.gs` à la racine est une **copie divergente obsolète** — ne pas s'y fier.

**Déploiement Apps Script** (projet **« Site web Amaryllis »**, scriptId `1PJVUdEra…`) :
```bash
node_modules/.bin/clasp push -f
node_modules/.bin/clasp deploy -i AKfycbw-t5kd_0f3OsEoDkOJHzYPHIBhWzz34aj7yagP57-Cj-7pLj6TiuRaUuusrCwAiA30Gg -d "msg"
```
Toujours redéployer sur **ce même deployment id** (= `APPS_SCRIPT_URL`) pour préserver l'URL. Réponse POST directe = page HTML Drive (quirk redirect) ; la vraie réponse passe par `/api/sheets-proxy` (`forwardChunked`).

### 3. Calendrier éditorial réseaux — publication auto + canaux

- Source de vérité = table D1 `editorial_calendar` (pas les docs `docs/planning-*`). API : `/api/editorial-calendar`.
- Le **Worker** (`workers/ical-sync/index.js`) génère les drafts à J-2 (`runEditorialDraftGen`, cron `0 12 * * *`) et **publie les entrées `approved`** dont l'heure est due (`runEditorialAutoPublish`, cron horaire `0 * * * *`).
- La publication délègue à `/api/agent-drafts?action=publish` → `/api/social` (FB + IG via Graph API).
- ⚠️ **Canaux** : un draft `social_post` doit avoir `payload.channels = ["ig","fb"]`. Si le LLM n'émet que `["ig"]`, **Facebook est silencieusement zappé** (pas d'erreur). Corrigé dans `agents-run.js` (force les 2 canaux), mais vérifier sur tout nouveau draft. Statut `drafted` ≠ publié : il faut `approved` pour que le cron le sorte.

### 4. Sécurité / exploitation

- **Rate limiting** : module partagé `functions/api/_ratelimit.js` (`rateLimit(db, {key, limit, windowSec})`, D1, fail-open). Déjà sur `/api/admin-auth`, `/api/contact`, `/api/beds24-bookings` (60/min/IP). DB = `env.revenue_manager`.
- **Rotation des tokens** : runbook `docs/runbook-rotation-tokens.md` + rappel email trimestriel auto (`runTokenRotationReminder`, jan/avr/juil/oct). `META_PAGE_TOKEN` expire ~60j = le plus urgent.

### 5. A/B testing

Infra : `src/utils/abTest.js` — `getVariant("nom_test")` (cookie 50/50 + GA4 `ab_variant_assigned`), `trackConversion("nom_test", {…})` (GA4 `ab_conversion`). Tests actifs : `cta_label`, `hero_amaryllis`.
⚠️ **Ne jamais A/B le prix via `bien.prix`** : il alimente le calcul du total de réservation (incohérence checkout). Un test charm-pricing nécessiterait un champ d'affichage `prixAffiche` découplé du calcul.

### 6. Déploiement & vérif

- `npm run deploy:pages` rebuild + déploie + **smoke test** (home/villa/admin, bundle JS, kill-switch SW, anti-asset-gelé `/guide-hub`, API `get-config`/`social`, `sitemap.xml`, meta prérendue). Échec smoke = exit 1.
- Le **Worker** se déploie séparément : `npx wrangler deploy`.
- Après tout changement SEO/résa/réseaux : **vérifier en live** (curl + endpoints), le build local ne reflète pas l'injection runtime.
