# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 🗺️ **CARTE VIVANTE DU SYSTÈME → [`.memory/ARCHITECTURE.md`](./.memory/ARCHITECTURE.md)** (site public + admin + backend + RM + IA + D1, 2 schémas Mermaid, inventaire D1, table des crons). À lire pour comprendre l'ensemble ; tenue à jour à chaque `/cloture-session`.
> 📌 **Mémoire long terme du projet → lire `PROJECT_MEMORY.md`** (état, décisions, secrets, crons cron-job.org + Worker, Place IDs GBP, système d'agents IA + RAG, contraintes de Vincent, backlog). Ce fichier-ci (`CLAUDE.md`) = référence **architecture/technique**.
> 🚨 **Lire aussi `docs/ERREURS-LOG.md`** (journal des erreurs déjà commises + garde-fous) — pour ne pas les reproduire. **Y ajouter une entrée à chaque nouvelle erreur.**

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
npm run test          # Vitest en watch
npm run test:run      # Vitest one-shot (utilisé par le gate de déploiement + la CI)
npm run visual-review # Crawl Playwright (débordement/sticky) → screenshots bug-reports/
```

**Tests :** suite **vitest** (~427 tests sur 40 fichiers, dont 9 sous `functions/api/`, `npm run test:run`). Lancer un seul fichier : `npx vitest run src/utils/pricing.test.js`. Le gate de `scripts/deploy-pages.sh` **bloque le déploiement si les tests sont rouges** (bypass d'urgence `SKIP_TESTS=1` ; `SKIP_BUILD=1` saute le build). La CI GitHub (`.github/workflows/ci.yml`) rejoue `test:run` + build + prerender sur chaque push/PR `main`. **Lint exclu de la CI** (code historique = ~600 erreurs historiques (source vive : `npm run lint`), nettoyage = chantier séparé). Voir la section « Source unique des biens & filet qualité » ci-dessous.

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
| `/api/beds24-refresh` | GET | `beds24-refresh.js` | Rotation automatique du token Beds24 V2 — vérifie l'expiration, rafraîchit si < 30 jours, stocke en D1. Cron 9h UTC. Auth : `?secret=BEDS24_REFRESH_SECRET`. |
| `/api/beds24-token-watch` | GET | `beds24-token-watch.js` | Surveillance quotidienne de l'expiration du token Beds24 V2 — alerte email (Resend) si < 7 jours avant expiration. Cron 7h UTC. Auth : `?secret=TOKEN_WATCH_SECRET`. |

**iCal & Disponibilités**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/fetch-ical` | GET | `fetch-ical.js` | CORS proxy serveur pour les URLs iCal Airbnb/Booking.com. Param : `url=<encoded-url>`. Whitelist de domaines autorisés. |
| `/api/get-availability` | GET | `get-availability.js` | Fusionne les iCal Airbnb + Booking.com pour un bien donné. Param : `bienId`, `bookingUrl`. |
| `/api/ical-config` | GET | `ical-config.js` | Retourne les URLs iCal Booking.com par bien depuis les secrets Cloudflare. |
| `/api/ical-export` | GET | `ical-export.js` | Génère un flux iCal (RFC 5545) des réservations directes (D1 `direct_bookings`) pour un bien donné, à destination d'Airbnb/Booking (anti double-booking). Auth : `?secret=ICAL_EXPORT_SECRET`. |
| `/api/ical/<bienId>.ics` | GET | `ical/[file].js` | Variante par bien du flux iCal ci-dessus, au format `.ics` directement parsable par Airbnb/Booking.com comme calendrier externe. Auth : `?secret=ICAL_EXPORT_SECRET`. |

**Google & Analytics**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/sheets-proxy` | POST | `sheets-proxy.js` | Proxy vers Google Apps Script — contourne CORS + bug redirect POST d'Apps Script (tableaux envoyés en GET paginé). Header optionnel `X-Script-Url` pour URL dynamique. |
| `/api/revenue-summary` | GET | `revenue-summary.js` | Endpoint stable/versionné `{version,generated_at,months[],ytd}` — par bien par mois (12 derniers mois + YTD) : `ca/nuits/occ/charges/cashflow/adr`, pour consommation externe (patrimoine-dashboard, tue le scraping interne). Source : action Apps Script `revenueSummarySource` (`SCRIPT_SHEETS.js` — `BIENS_MAP` pour ca/nuits année courante, `findHistTotalRow_`/`findHistNightsRow_` pour l'année précédente, `findChargesTotalRow_`/`readChargesBlock_` pour charges/cashflow des 2 années — recherche dynamique, **pas** `BIENS_MAP.cfRow`, cf. footgun #1ter). Payload étendu à 2 entités patrimoine hors location (`muscade`, `t4_amaryllis`) toujours présentes en plus des 7 biens — `ca`/`nuits`/`occ` à `null` (non trackés) sauf `t4_amaryllis.ca=0` (résidence perso, jamais louée — 0 connu). `adr` = `ca/nuits` borné à `[0.3×,3×]` le prix de base (`src/data/biens.js`), `null` sinon (séjour à cheval sur 2 mois → ratio non représentatif, cf. `computeAdr` dans `src/utils/revenueSummary.js`). `total_ca`/`total_nuits` scopés aux 7 biens location ; `total_charges`/`total_cashflow` couvrent les 9 entités. **Cache KV** (`CROSS_BRAIN_KV`, clé `cache:revenue-summary:v1`, TTL doux 20min/dur 24h, stale-while-revalidate via `waitUntil` — trouvé 07/2026 : le calcul live prenait 15-24s, trop lent pour le timeout 3s de `/api/locatif` côté patrimoine qui retombait systématiquement sur son fallback Sheet). Auth `?secret=POSTSTAY_SECRET` ou Bearer admin. |
| `/api/site-config` | GET/POST | `site-config.js` | Proxy bidirectionnel vers Apps Script (PropertiesService) — lit/écrit la config du site (séjour minimum par bien et par période). |
| `/api/analytics` | GET | `analytics.js` | Proxy vers Google Analytics Data API v1beta (GA4) — retourne 4 rapports en parallèle (overview, pages, pays, sources, devices) sur 30 jours. Auth Service Account. Cache CDN `s-maxage=60` (arch-011, était 5min) + `stale-while-revalidate=300`. |
| `/api/google-reviews` | GET | `google-reviews.js` | Proxy sécurisé vers Google Places API v1 — récupère les avis Google pour Amaryllis ou Résidence. Param : `place=amaryllis\|residence`. |
| `/api/cache-purge` | POST | `cache-purge.js` | arch-011 : purge manuelle du cache CDN Cloudflare (API "Purge Files by URL") — force un refresh immédiat de `/api/analytics` sans attendre le TTL. Body optionnel `{urls:[...]}`. Auth Bearer admin. Requiert secrets `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ZONE_ID` (503 si absents). |

**Paiement & Caution (Stripe)**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/create-payment-intent` | POST | `create-payment-intent.js` | Crée un PaymentIntent Stripe (capture immédiate). Body : `{ amount, currency, metadata, bookingId }`. |
| `/api/create-deposit-intent` | POST | `create-deposit-intent.js` | Crée un PaymentIntent Stripe en pré-autorisation (`capture_method: "manual"`) pour caution. Body : `{ amount, currency, metadata }`. |
| `/api/caution-checkout` | POST | `caution-checkout.js` | Crée une Stripe Checkout Session en pré-autorisation — retourne une URL Stripe hébergée à envoyer au voyageur. |
| `/api/manage-deposit` | POST | `manage-deposit.js` | Gère les cautions pré-autorisées. Body : `{ action: "capture"\|"cancel"\|"list", paymentIntentId, amount }`. |
| `/api/stripe-webhook` | POST | `stripe-webhook.js` | Reçoit les événements Stripe (`payment_intent.succeeded`, `checkout.session.completed`) — confirme la réservation Beds24 correspondante et notifie l'hôte par email. |
| `/api/stripe-reconcile` | GET | `stripe-reconcile.js` | Rapprochement Stripe (chantier connecteurs 2026-07) — liste les derniers virements bancaires (`/v1/payouts`), détaille les transactions (`/v1/balance_transactions`, frais/net), rattache chaque charge à `direct_bookings` via `payment_intent_id`. `?inspect=pi_xxx` : détail complet d'un PaymentIntent (description/metadata/receipt_email) pour élucider une charge non rattachée — utile pour les soldes 2× (`metadata.kind="solde-2x"`), qui utilisent un PI différent de celui stocké sur la résa et apparaissent donc toujours `matched:false` dans la vue payouts (comportement normal, pas un bug). Bearer admin. Onglet 🏦 Rapprochement Stripe (Finance). Aucun secret supplémentaire (réutilise `STRIPE_SECRET_KEY`). |
| `/api/cancel-booking` | POST | `cancel-booking.js` | Annule une réservation directe — remboursement Stripe, libération caution, sync Beds24 (Nogent), email au voyageur. Auth Bearer admin. |
| `/api/direct-bookings` | GET | `direct-bookings.js` | Liste les réservations directes (Stripe) au format Planning unifié. Avec `?view=guests`, retourne les voyageurs répétants triés par LTV. Auth Bearer admin. |
| `/api/patch-booking` | POST | `patch-booking.js` | Met à jour une réservation iCal (nom + montant manquants) et recalcule les revenus du mois. Auth Bearer admin. |
| `/api/booking-session` | GET/POST | `booking-session.js` | GET : statut de la session Booking.com stockée (validité < 30j). POST : enregistre un token `ses=` depuis admin.booking.com. Auth `?secret=POSTSTAY_SECRET`. |
| `/api/complement-checkout` | POST | `complement-checkout.js` | Crée une Stripe Checkout Session pour un complément de prix (changement logement, sur-occupation) — enregistre la carte du voyageur off-session pour la caution différée. |
| `/api/service-checkout` | POST | `service-checkout.js` | Crée un Stripe Payment Link pour l'achat d'un service additionnel (depuis `/services/<bien>` ou QR TV) — prix validé serveur depuis le catalogue du livret. Rate-limited. |
| `/api/service-orders` | GET | `service-orders.js` | Liste les commandes de services enregistrées en D1. Auth Bearer admin. |
| `/api/sign-contract` | POST | `sign-contract.js` | Stocke une signature électronique manuscrite du contrat (PNG dataURL), nom, acceptation, IP, horodatage — alerte email à l'hôte. Rate-limited par IP. |
| `/api/promo-codes` | GET/POST | `promo-codes.js` | `?validate=CODE&bien_id=X` : validation publique rate-limitée. `?active=1` : listing codes (auth). POST : génère un code promo unique en D1 (auth Bearer ou `?secret`). |
| `/api/create-payment-link` | POST | `create-payment-link.js` | Crée un Stripe Payment Link pour devis WhatsApp (montant en centimes, bien, dates, type acompte/solde/total). Auth Bearer admin. |
| `/api/charge-balance` | GET | `charge-balance.js` | Cron quotidien : débite off-session les soldes dus (paiement en 2 fois). Auth `?secret=POSTSTAY_SECRET`. `?dry=1` pour aperçu. |
| `/api/devis-solde-cron` | GET | `devis-solde-cron.js` | Cron quotidien : gère le solde des devis en 2 fois (lien Stripe génération J-30, relances J-25/J-20, annulation auto J-15). Auth `?secret`. `?dry=1`. |
| `/api/caution-cron` | GET | `caution-cron.js` | Cron quotidien : réconcilie les cautions off-session (pose J-2, renouvellement avant expiration, libération J+3). Auth `?secret=POSTSTAY_SECRET`. `?dry=1`. |

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
| `/api/veille-zone-scan` | GET/POST | `veille-zone-scan.js` | Détecte les nouveaux listings Airbnb apparus dans une zone (diff snapshot S vs S-1). GET liste le dernier scan, POST lance le scan (toutes zones), crée une action `agent_actions` par nouveau listing. Auth `?secret=POSTSTAY_SECRET` ou Bearer admin. |
| `/api/fc-competitors-scan` | GET/POST | `fc-competitors-scan.js` | Scan Firecrawl des prix/notes des concurrents connus (Airbnb + Booking). GET retourne l'état du dernier scan, POST en lance un nouveau, stocke les snapshots en D1 `rm_competitor_snapshots`. Auth Bearer admin. |
| `/api/rm-auto-update` | GET | `rm-auto-update.js` | Orchestre le recalcul quotidien des recommandations RM pour tous les biens. `&scan=1` déclenche aussi le scan Firecrawl hebdo (lundi). Auth `?secret=POSTSTAY_SECRET`. |
| `/api/coherence-check` | GET | `coherence-check.js` | Contrôle de cohérence des réservations — compare D1 `direct_bookings` vs iCal Airbnb/Booking, écrit les anomalies en `client_errors`, push ntfy si critique. `?dry=1` = simulation. Auth `?secret=POSTSTAY_SECRET`. |
| `/api/seasonal-update` | GET | `seasonal-update.js` | Agrège `rm_kpi_snapshots` → `seasonal_memory` (par bien × mois × année) le 1er de chaque mois, pour construire la mémoire saisonnière historique. Auth `?secret=POSTSTAY_SECRET`. |
| `/api/rm-price-digest` | GET | `rm-price-digest.js` | Digest hebdo RM : sur les ~2500 recommandations stockées (14 mois glissants × 6 biens), n'isole que les écarts **significatifs** (≥12%, logique pure `src/utils/rmPriceDigest.js`) entre `recommended_price_cents` et le prix **réellement affiché** — résolution `resolveLivePrice()` : override serveur (`/api/site-config?type=prices` + `/api/beds24-rates`) **??** seed calibré (`SEED_DAILY_PRICES`, `src/seedPrices.js`) **??** flat `bien.prix` en dernier recours (jamais `currently_published_cents`, colonne jamais peuplée par le moteur). ⚠️ Piège vécu 2026-07-18 : la 1ère version sautait le seed et comparait directement au flat `bien.prix` (280€ pour Amaryllis), annonçant un écart de +121% qui était en réalité +26% une fois comparé au vrai prix saisonnier affiché — cf. CLAUDE.md §1bis. Sur la fenêtre actionnable (≤30j lead time). Exclut les dates déjà vendues (`already_booked`). Push ntfy uniquement (pas d'email), anti-fatigue : silence si 0 écart significatif. RM reste 100% advisory, aucun prix modifié. Cron Worker lundi (séquencé après `rm-auto-update?scan=1`, même contrainte que `send-veille-recap`). Auth `?secret=POSTSTAY_SECRET`, `?dry=1` = aperçu JSON. |
| `/api/rm-seed-drift` | GET | `rm-seed-drift.js` | **Garde-fou permanent (2026-07-18)** — le modèle saisonnier propre du RM (`rm_seasonal_profiles.base_price_override`) est **indépendant** de `SEED_DAILY_PRICES` (calibré à la main par Vincent) : rien ne garantit qu'ils restent synchronisés. Compare chaque profil actif à la moyenne seed réelle sur sa fenêtre de dates (logique pure `src/utils/rmSeedDrift.js`), flag tout écart ≥15%. Trouvé une première fois 2026-07-18 : dérive +50% (Jan-Avr) à -45% (Sep-Déc) selon le bien, corrigée par une mise à jour D1 des 60 lignes `rm_seasonal_profiles`. Écrit les drifts dans l'inbox `client_errors` (`kind:"rm-seed-drift"`), push ntfy si ≥1 dérive détectée. Un profil sans aucune date couverte par le seed est reporté séparément (`noCoverage`), jamais compté comme un drift. Cron Worker mensuel (`0 1 1 * *`, aux côtés de `seasonal-update` — cadence suffisante, ces deux couches ne bougent pas au jour le jour). Auth `?secret=POSTSTAY_SECRET`, `?dry=1` = aperçu JSON. |

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
| `/api/gmail-oauth-start` | GET | `gmail-oauth-start.js` | Démarre le consentement OAuth Google — multi-provider via `?provider=gmail\|calendar` (boutons "Connecter Gmail"/"Connecter Calendar"). Auth admin via `?token=`. |
| `/api/gmail-oauth-callback` | GET | `gmail-oauth-callback.js` | Callback **unique et partagé** pour tous les providers Google (le provider est encodé/signé dans `state`) : échange le code contre un refresh_token, le stocke en D1 (`oauth_tokens`, clé = provider). |
| `/api/gmail-sync` | GET | `gmail-sync.js` | Poll `contact@villamaryllis.com` (lecture seule) → importe les réponses voyageurs dans `emails_log` (`direction='in'`). `?secret=POSTSTAY_SECRET` (cron 10 min) ou Bearer admin (bouton "Sync"). `?status=1` = simple check de connexion. Voir `docs/GMAIL-SETUP.md`. |
| `/api/calendar-sync` | GET/POST | `calendar-sync.js` | GET `?status=1` = statut connexion Calendar (Bearer admin). POST = crée/MAJ un event Google Calendar par ménage (liste envoyée par MenageTab, dédup D1 `menage_calendar_events`). Bouton manuel "📅 Sync calendrier", pas de cron. Voir `docs/GMAIL-SETUP.md`. |
| `/api/send-prearrivee` | GET | `send-prearrivee.js` | Cron J-3 : email pré-arrivée aux résas directes (D1 `direct_bookings`). |
| `/api/send-poststay` | GET | `send-poststay.js` | Séquence post-séjour **2 touches MAXIMUM** (jamais plus, demande Vincent 2026-07-04) : J+2 (`ask`, remerciement + avis Google/TripAdvisor) puis J+7 (`reminder`, dernière relance — satisfaction + code fidélité RETOUR10, `post-sejour-relance.html`), pour Nogent/Beds24 + résas directes. `?touch=ask\|reminder` pour forcer une seule touche, `?dry=1` simule. |
| `/api/send-relance-panier` | GET | `send-relance-panier.js` | Cron horaire : relance panier abandonné (D1 `abandoned_carts`, exclut convertis). |
| `/api/notify-booking` | POST | `notify-booking.js` | Alerte hôte fiable (email+ntfy) post-paiement + enregistre la résa directe en D1. |
| `/api/send-j1-acces` | GET | `send-j1-acces.js` | Cron J-1 arrivée : envoie le code d'accès réel au voyageur. Lit la section « access » du guide JSON du bien (D1 direct, contourne la redaction publique de `/api/guides`). Auth `?secret=POSTSTAY_SECRET`. |
| `/api/send-pre-depart` | GET | `send-pre-depart.js` | Cron J-1 départ : email veille de départ (heure, late check-out 80€/19h, remise fidélité -10%, avis Google). Auth `?secret=POSTSTAY_SECRET`. |
| `/api/send-verif-arrivee` | GET | `send-verif-arrivee.js` | Cron J+1 arrivée : email court « tout se passe bien ? » le lendemain du check-in, pour tous les séjours (contrairement au rappel « Mi-séjour » interne du Worker, réservé aux 5+ nuits). Auth `?secret=POSTSTAY_SECRET`. |
| `/api/send-menage-alert` | GET | `send-menage-alert.js` | Cron J-2 arrivée : alerte ménage au prestataire via Resend. Lit les arrivées Beds24 (propId 158192, Nogent). Auth `?secret=MENAGE_ALERT_SECRET`. |
| `/api/send-vacancy-alert` | GET | `send-vacancy-alert.js` | Cron vacance J+14→J+30 : alerte si > 10 nuits libres sur l'Appartement Nogent — calcule le RevPAR, suggère prix/promo. Auth `?secret=VACANCY_ALERT_SECRET`. |
| `/api/send-leads-promo` | GET | `send-leads-promo.js` | Cron promo leads : envoie une offre -10% (code DIRECT10) aux leads « nouveau » non répondus, marque « répondu » après envoi. Auth `?secret=POSTSTAY_SECRET`. |
| `/api/email-templates-admin` | GET/POST/DELETE | `email-templates-admin.js` | Éditeur admin des paragraphes éditables (texte simple) des 4 templates automatiques (confirmation, verif-arrivee, j1-acces, pre-depart). GET liste + valeurs, POST enregistre les champs, DELETE réinitialise aux valeurs par défaut. Auth Bearer admin. |
| `/api/send-bulk-email` | POST | `send-bulk-email.js` | Envoi groupé/segmenté (segment `hot_carts`/`all_carts`/`custom`, template + code promo optionnel), max 50 destinataires. Auth Bearer admin obligatoire. |
| `/api/send-custom-email` | POST | `send-custom-email.js` | Envoi manuel d'un email (to/subject/html requis, bien_id/booking_id/promo_code optionnels). Rate limit 20/h/IP. Auth Bearer admin ou `?secret=POSTSTAY_SECRET`. |
| `/api/emails-log` | GET | `emails-log.js` | Interroge l'historique des emails (par destinataire, par email, par résa ou détail complet) — catégorie `client` uniquement. Auth Bearer admin ou `?secret=POSTSTAY_SECRET`. |
| `/api/emails-import-resend` | POST | `emails-import-resend.js` | Import rétroactif des emails Resend dans `emails_log` (dédup par `resend_id`, matching booking, récupération HTML). Auth Bearer admin ou `?secret=POSTSTAY_SECRET`. |
| `/api/enrich-from-emails` | GET | `enrich-from-emails.js` | Auto-complétion des résas OTA Airbnb — parse les confirmations dans l'onglet Emails du Sheet, enrichit la résa correspondante (nom/prix, non destructif). Auth `?secret=POSTSTAY_SECRET`. `?dry=1`. |
| `/api/airbnb-email-import` | POST | `airbnb-email-import.js` | Webhook Zapier recevant une confirmation email Airbnb/Booking — insère en D1 `direct_bookings` via upsert idempotent (platform+bookingId). Auth `?secret=ZAPIER_WEBHOOK_SECRET`. |
| `/api/guest-contacts` | GET/POST/PATCH/DELETE | `guest-contacts.js` | CRUD contacts (table `crm_clients`) — POST crée ou fusionne (`action=merge`). Auth Bearer admin. |
| `/api/contacts-alert` | GET | `contacts-alert.js` | Alerte ntfy pour les leads `status='nouveau'` depuis plus de 24h. Auth `?secret=CONTACTS_ALERT_SECRET`. |
| `/api/contacts-purge` | DELETE | `contacts-purge.js` | RGPD : purge les contacts de plus de 2 ans. Auth Bearer `PURGE_SECRET`. |
| `/api/crm-clients` | GET/POST/PATCH | `crm-clients.js` | Gestion CRM clients — GET liste paginée ou fiche, PATCH met à jour notes/tags/statut, POST upsert manuel. Auth Bearer admin. |
| `/api/crm-lifecycle` | GET | `crm-lifecycle.js` | Phase CRM réactivation/fidélisation/anniversaire/parrainage, filtrée par segment. `?dry=1` (défaut) prévisualise. Auth `?secret=POSTSTAY_SECRET`. |
| `/api/reclamations` | GET/POST/PATCH | `reclamations.js` | CRUD réclamations — GET liste (admin), POST crée (public, rate-limité 20/h), PATCH met à jour statut/notes/geste (admin). |
| `/api/whatsapp` | GET/POST | `whatsapp.js` | Webhook du bot WhatsApp Business (Meta Cloud API) — GET vérifie le webhook, POST reçoit/répond aux messages entrants (LLM contextuel par bien), enregistre les échanges en D1. **⚠️ Bug corrigé 2026-07-17** : le bien était deviné UNIQUEMENT par mots-clés du message, avec `"amaryllis"` en **défaut silencieux** → un voyageur Nogent écrivant « le wifi ne marche pas » recevait le code wifi/adresse de la Villa Amaryllis. Désormais `resolveGuestContext(phone)` fait autorité (résa directe rattachée au numéro) ; `detectBien()` n'est plus qu'un repli (voyageur OTA/prospect inconnu). Le contexte du séjour est aussi injecté dans le prompt quand le voyageur est identifié. |
| `/api/concierge` | POST | `concierge.js` | **I-10 — Concierge IA qui AGIT**. Distinct de `/api/chat` et `/api/whatsapp` (qui *répondent*) : contexte réel du séjour + capacité à déclencher une action. **Garde-fous** : `CONCIERGE_MODE` = `shadow` **par défaut** (rien de réel) / `live` explicite · kill-switch `CONCIERGE_DISABLED=1|true` · **une SEULE action exécutable en live = le code promo** (aucun argent ne sort : remise sur futur séjour, nominatif, `max_uses:1`, plafonné `CONCIERGE_MAX_PROMO_EUR` défaut 50€ borné à 200€, réversible) · refund/intervention/service = **proposés seulement** → ntfy. **Le LLM ne décide rien** : il émet une intention JSON (`json_object`, pas de tool-calling — absent du projet, et l'ajouter casserait la cascade 7 providers de `_llm.js`), `decideAction()` (`src/utils/conciergeRules.js`, 23 tests dont adversariaux) tranche. Un dépassement de plafond **escalade sans écrêter en silence**. `?dry=1` force le shadow. Trace D1 `concierge_log`. Auth Bearer admin ou `?secret`. |
| `/api/whatsapp-conversations` | GET | `whatsapp-conversations.js` | Liste les conversations WhatsApp stockées en D1, filtrable par bien et numéro émetteur. Auth Bearer admin. |
| `/api/meta-insights` | GET | `meta-insights.js` | Agrège les données d'audience Meta (Facebook + Instagram) — fans, reach, impressions, followers, top pays. Cache CDN 4h. Auth `?secret` ou Bearer admin. |

**Newsletter**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/newsletter-subscribe` | POST | `newsletter-subscribe.js` | Lead magnet — capture email+prénom+source (guide_id/property_id). Double opt-in RGPD, rate-limité 3 req/IP/h. |
| `/api/newsletter-confirm` | GET | `newsletter-confirm.js` | Double opt-in : confirme l'inscription via token, envoie l'email de bienvenue, publie une alerte ntfy (premiers abonnés/jalons). Redirige. |
| `/api/newsletter-unsubscribe` | GET | `newsletter-unsubscribe.js` | Désabonnement one-click via token — marque `unsubscribed_at`. Redirige. |
| `/api/newsletter-admin` | GET/POST | `newsletter-admin.js` | Admin newsletter — liste/stats/filtrage des abonnés (pagination), broadcast (4 templates autorisés), renvoi de confirmation, suppression. Auth `?secret=POSTSTAY_SECRET` ou `X-Admin-Auth`. |

**Agents IA**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/agents-actions` | GET/POST/PATCH | `agents-actions.js` | CRUD pour les actions des ~23 agents Amaryllis — stockage D1 (`agent_actions`). |
| `/api/agents-run` | POST | `agents-run.js` | Déclenche l'analyse autonome des ~23 agents via **LLM multi-provider** (`callLLM` : Groq/Cloudflare/Mistral/Cerebras). Body `{agents:["id"]\|"all", brief?}`. Self-refresh AI-Ops (waitUntil). Grounding RAG pour les agents content. |
| `/api/agents-orchestrate` | POST | `agents-orchestrate.js` | **Orchestrateur** : objectif → décompose → dispatche aux agents → plan coordonné (D1 `orchestrations`). |
| `/api/agents-triggers` | GET | `agents-triggers.js` | **Déclencheurs réactifs** : avis/note/résas → réveille le bon agent (état D1 `agent_triggers`). Cron conseillé. |
| `/api/agents-deliver` | POST | `agents-deliver.js` | **Livrables prêts** : `meta-seo` (title/desc validés), `email-sequence`, `pricing-reco`. |
| `/api/agents-stats` | GET | `agents-stats.js` | Observabilité **de la machine** (backlog, impacts, usage LLM 7j, qualité, plan modèles). |
| `/api/ota-cost` | GET | `ota-cost.js` | **I-04 — Le vrai coût des OTA** : chiffre le coût OTA au-delà de la commission affichée (que `NetRevParTab` couvre déjà). Deux FAITS réels : (1) commission OTA 2025 payée = CA par canal réel (`REVENUS_CANAL_2025`) × taux réel (`canauxCommissions.js`) ; (2) segmentation `crm_clients` en **réactivables** (email réel) vs **captifs OTA** (fidèles sans email exploitable, jamais recontactables en direct) + leads sans séjour exclus. Le manque à gagner de réactivation est une **projection réglable côté client** (curseurs taux réactivation / valeur séjour), jamais un fait. Logique pure testée `src/utils/otaCost.js` (13 tests, séparation stricte fait/hypothèse). UI : onglet 💸 « Coût réel OTA » (Finance, `CoutOtaTab.jsx`) — bleu=fait, ambre=estimé. Expose `blind_spots[]` (ventilation canal = 2025 seul, pas 2026). Advisory pur, lecture seule, aucun LLM. Auth Bearer admin ou `?secret`. ⚠️ Verdict réel 2025 : 12 247€ commission OTA (57% du CA via OTA), 28 clients OTA captifs sans email dont 23 fidèles. |
| `/api/pnl-sejour` | GET | `pnl-sejour.js` | **I-03 — P&L par séjour (pas CA par séjour)** : décompose chaque réservation VIVANTE du Sheet (même `fetchReservations` que `ota-cost.js`, bénéficie du cache KV) en coûts variables directs → **marge de CONTRIBUTION** = `CA − commission OTA réelle (canauxCommissions par bien) − frais Stripe (1,5% si direct) − coût ménage (`src/config/fraisMenage.js`, source unique partagée avec `PublicSite.jsx`)`. Révèle que le CA ment : à CA égal, un Booking (17%+ménage) nette bien moins qu'un direct, et un séjour court à l'Amaryllis se fait manger par le ménage fixe 180€. Agrège par canal et par bien + top/flop séjours. Filtre les blocs iCal « CLOSED » et annulations (`isSejourReel`). Logique pure testée `src/utils/pnlSejour.js` (16 tests). L'allocation de **charges fixes** (`appliqueChargesFixes`, curseur €/nuit, off par défaut) est une **HYPOTHÈSE** appliquée côté client, jamais fondue dans le FAIT. UI : onglet 🧮 « P&L par séjour » (Finance, `PnlSejourTab.jsx`) — sélecteur d'année. Advisory pur, lecture seule, aucun LLM. Auth Bearer admin ou `?secret`. |
| `/api/delegation-stats` | GET | `delegation-stats.js` | **I-09 — Runbook de délégation** : observabilité de **l'OPÉRATEUR** (ce que Vincent fait encore à la main), pendant humain d'`agents-stats`. Agrège 9 traces déjà loguées (`action_outcomes.completed_at`, `rm_recommendations.reviewed_at` +statut approved/**overridden**, `agent_drafts.approved_at` filtré du gate auto, `emails_log.template LIKE 'manual%'`, `reclamations.resolved_at`, `suggestion_acks.acked_at`, `agent_lessons.created_at`, bugs triés, `config_edits`) → volume/semaine, tendance orientée délégation (baisse = bon), candidats à l'automatisation (fréquents **ET** réguliers). SQL pur, lecture seule, aucun LLM. `?weeks=8` (2-26). Auth Bearer admin ou `?secret=POSTSTAY_SECRET`. Logique pure testée : `src/utils/delegation.js` (20 tests). UI : panneau « 🧍 Dépendance opérationnelle » dans `AgentsKanban.jsx` (bouton stats). ⚠️ 3 formats d'horodatage mélangés (s/ms/texte ISO heure Martinique) — tout passe par `toEpochSeconds()`. ⚠️ Ne JAMAIS baser un signal humain sur `agent_actions.updated_at` (pollué par `agents-triage` + upsert). Expose `blind_spots[]` : le total est un **plancher**, pas un total réel (leads sans horodatage, travaux en localStorage, emails manuels détectés par convention de nommage). |
| `/api/backlog-verify` | GET/POST | `backlog-verify.js` | **I-11 — Machine qui ferme le backlog elle-même.** Constat `delegation-stats` : `action_cochee` (Vincent coche un item backlog IA "fait") = poste #1 de sa charge manuelle (194/318 traces/8 semaines, 61%). Le backlog réel est à majorité production physique/créative (photos, Reels) — pas vérifiable par une machine — mais un sous-ensemble concret l'est. Pipeline : LLM classifie chaque item `backlog`/`a-planifier` des catégories seo/tracking/content/technique/performance en `{checkable, checkType, params}` (défaut `false`) → `normalizeClassification()` rejette tout `checkType` non reconnu + valide les params contre une whitelist anti-SSRF de paths connus → `applyKeywordGuard()` **rétrograde en `checkable:false` toute classification sans appui textuel réel** dans l'item (garde ajoutée après un faux positif vu en dry-run prod : un item "Core Web Vitals" mappé à tort sur une vérification meta SEO d'une page non liée) → un checker **déterministe** (jamais le LLM) tranche contre la réalité déployée : `live_meta` (fetch la page live, vérifie title/meta description publiés et non génériques), `ga4_event` (`_ga4.js`, event vu ≥1× sur 30j), `jsonld_schema` (fetch + grep `@type` dans les blocs JSON-LD, y compris `@graph`). Seul un positif ferme l'item (`UPDATE agent_actions SET status='fait'`, note préfixée `🤖 Auto-vérifié`) — le reste (photo/vidéo/process/jugement humain) reste et doit rester 100% manuel. **Volontairement PAS d'insert dans `action_outcomes`** : cette table alimente `action_cochee`, qui mesure la charge de VINCENT — une fermeture autonome n'en fait pas partie, sinon la métrique ne refléterait jamais l'effet de la délégation. Log dédié `backlog_autoverify_log` (traçabilité indépendante). Logique pure testée `src/utils/backlogVerify.js` (37 tests). Cron Worker hebdo lundi 6h UTC (aux côtés de bug-triage/agents-triage), silence si 0 fermé. `?dry=1` classifie+vérifie sans écrire. Auth `?secret=POSTSTAY_SECRET` ou Bearer admin. |
| `/api/client-errors` | POST/GET/PATCH | `client-errors.js` | Inbox bugs (table `client_errors`). POST **public** rate-limité (capteur JS `src/lib/bugCapture.js` + bouton `BugReporter.jsx`) ; GET/PATCH admin ou `?secret=`. PATCH `?id=` + `{tobacklog}` crée action `agent_actions`. Onglet 🐞 Bugs = `BugsTab.jsx`. |
| `/api/bug-triage` | GET/POST | `bug-triage.js` | Agent triage hebdo : LLM classe gravité + ignore bruit → pousse au backlog + résumé. Cron Worker lundi `runBugTriage`. `?dry=1` simule. Revue visuelle proactive : `npm run visual-review` (`scripts/visual-review.mjs`, Playwright). |
| `/api/code-review` | POST | `code-review.js` | Revue LLM **du diff** (callLLM tier smart) → findings bugs JSON. `?post=1` pousse dans l'inbox (dédup). Lancé par `deploy-pages.sh` (`scripts/code-review-diff.mjs`) à chaque déploiement si `POSTSTAY_SECRET` exporté. **Vérifs au moment du changement** : `deploy-pages.sh` fait aussi un crawl visuel en arrière-plan (post-smoke-test). `SKIP_BUG_CHECKS=1` pour désactiver. |
| `/api/agents-eval` | GET | `agents-eval.js` | LLM-juge note les sorties (table `llm_evals`). |
| `/api/agents-verify` | GET | `agents-verify.js` | Vérif adversariale (challenger Mistral) pour agents à enjeu → annote `notes ⚠️ VÉRIF`. |
| `/api/ack-suggestion` | GET | `ack-suggestion.js` | Enregistre l'ack (done/ignore/later) d'une suggestion KPI depuis ntfy. Pas d'auth forte (ID difficile à deviner). |
| `/api/agent-drafts` | GET/POST/PATCH | `agent-drafts.js` | Brouillons générés par les agents IA en attente d'approbation humaine — PATCH approve/reject/publish avec exécution (`social_post`/`price_change`/`email_campaign`). Auth Bearer. |
| `/api/agent-lessons` | GET/POST/DELETE | `agent-lessons.js` | Mots/expressions interdits appris par les agents — injectés en amont des prompts et en fact-check après génération. Auth Bearer ou `?secret`. |
| `/api/agent-memory` | GET/POST/DELETE | `agent-memory.js` | CRUD persistant des mémoires des agents IA (clé-valeur, expiration optionnelle). |
| `/api/agents-digest` | GET | `agents-digest.js` | Digest hebdo du statut des agents (drafts prêts, actions à valider, bloquées, faites) — push ntfy + email. Auth `?secret=POSTSTAY_SECRET`. |
| `/api/agents-execute` | GET | `agents-execute.js` | Orchestration L3 : prépare les actions `risk=auto` en brouillons (`agent_drafts`, `status=drafted`), ne publie jamais directement. Cron hebdo ou appel manuel. Auth `?secret` ou Bearer. |
| `/api/agents-triage` | GET/POST | `agents-triage.js` | Triage hebdo automatique du backlog (~28 agents) — détecte mots bannis, contradictions factuelles, doublons, features déjà construites. `?dry=1` simule. Auth `?secret` ou Bearer. |
| `/api/orchestrator` | GET/POST | `orchestrator.js` | Orchestrateur multi-agents (Claude Sonnet) coordonnant les ~28 agents spécialisés. GET liste les 20 derniers runs, POST déclenche une orchestration complète. |
| `/api/memory-distill` | GET | `memory-distill.js` | Agent-mémoire : distille l'expérience des 7 derniers jours (`llm_evals`, `action_outcomes`, signaux) en 3-5 apprentissages durables, injectés dans les prompts de tous les agents. Auth `?secret=POSTSTAY_SECRET`. |
| `/api/kpi-sentinel` | GET | `kpi-sentinel.js` | Sentinelle KPI — détecte les anomalies par les données, 9 signaux (occupation, paniers abandonnés, cautions, RevPAR, saisonnalité, historique, éditorial, **conversion funnel** — arch-monitoring). Cron quotidien 9h UTC, ntfy si anomalie ≥ 🟡. Auth `?secret=POSTSTAY_SECRET`. |
| `/api/morning-brief` | GET | `morning-brief.js` | Brief matinal locatif (arrivées/départs du jour, cautions, occupation semaine, revenus, posts planifiés) — push ntfy 6h Martinique. Auth `?secret=POSTSTAY_SECRET`. |
| `/api/rapport-business` | GET | `rapport-business.js` | Rapport business autonome (lecture seule `direct_bookings`) → synthèse LLM → ntfy Vincent. Aucune action sortante. Auth `?token=RAPPORT_TOKEN`. |
| `/api/qa-run` | GET/POST | `qa-run.js` | Déclenche un run QA manuel par type (`weekly`\|`monthly`\|`all`) — lance les agents QA spécialisés, push ntfy du résultat. Auth Bearer ou `?secret=POSTSTAY_SECRET`. |

**LLM multi-provider, AI-Ops & RAG**

| Endpoint / module | Role |
|---|---|
| `functions/api/_llm.js` | `callLLM(env, {provider?, tier, messages, ...})` — cascade Groq→Cloudflare→Mistral→Cerebras(+Gemini si clé). Modèle = `opts.model` > plan AI-Ops (D1 `ai_ops`) > `MODELS` statique. |
| `/api/ai-ops` | `ai-ops.js` — **agent AI-Ops** : auto-découvre/teste/bascule les modèles gratuits, écrit un plan D1 appliqué en live par `_llm.js`. Self-refresh si >20h. |
| `/api/llm-ping` | `llm-ping.js` — health-check par provider isolé + `?list=1` (modèles `/v1/models`). |
| `/api/llm-bench` | `llm-bench.js` — **bench cost/qualité** (reco Prompt Eng., 2026-07-18) : Groq vs Cerebras vs Mistral sur 5 tâches types représentatives de l'usage réel de la fleet (extraction JSON, résumé, rédaction Instagram, tri lead, calcul pricing — vérificateurs déterministes, `src/utils/llmBenchTasks.js`, pas de LLM-juge). Réutilise `logLLMTrace` (déjà dans `_llm.js`, table `llm_traces`) pour le coût/tokens réels au lieu de ré-estimer. `?tier=` (défaut `medium`). Outil ponctuel Bearer admin, pas de cron. |
| `/api/llm-generate` | `llm-generate.js` — proxy générique vers `callLLM` (cascade Groq/Cloudflare/Mistral/Cerebras) pour les appels serveur-à-serveur internes (Worker→Pages). `{prompt,maxTokens,tier}` → `{text}`. Auth `?secret=POSTSTAY_SECRET`. |
| `functions/api/_biens.js` | **Source unique des faits** des 7 biens (nomenclature/équipements/capacités) + `EQUIP_RULES_TEXT`. |
| `functions/api/_rag.js` | RAG : `embed`/`ragUpsert`/`ragSearch`/`ragBlock` (Vectorize `VECTORIZE` + embeddings `@cf/baai/bge-m3`). |
| `functions/api/_ga4.js` | Helper GA4 partagé (JWT service account, `runReport`/`runReportSafe`/`parseReport`) — extrait d'`analytics.js`, réutilisé par `agents-impact.js` et `docs-refresh.js`. |
| `functions/api/_docsDigest.js` | Snapshot statique COMMITTÉ (généré par `scripts/generate-docs-digest.mjs`) des docs stratégiques `docs/{marketing,strategie,revenue-manager,crm,service-client,seo,legal}/*.md`, découpés par section H2/H3 (435 sections/33 docs) — ingéré par `rag-ingest.js`. À régénérer manuellement si ces docs changent. |
| `/api/rag-ingest` | `rag-ingest.js` — ingère faits+avis+drafts+docs stratégiques+snapshots factuels quotidiens → vecteurs. Auto chaque lundi (Worker cron) + chaque jour après `docs-refresh`. |
| `/api/rag-search` | `rag-search.js` — retrieval test (`?q=`, `?debug=1`). |
| `/api/docs-refresh` | `docs-refresh.js` — rafraîchit quotidiennement 2 SEULS docs stratégiques factuels (trafic SEO 30j GA4, signaux marché D1 `rm_market_signals`) dans D1 `docs_snapshots`. Cron Worker `0 13 * * *`. Jamais les docs légaux/stratégie/campagnes (pas d'auto-rewrite décisionnel), aucun commit Git (pas d'accès filesystem prod). |
| `/api/agents-impact` | `agents-impact.js` — pour chaque publication éditoriale `published`, delta sessions GA4 J-2/J-1 vs J+1/J+2 (absolu+%), résumé meilleure/pire pub. |

**Guides & Divers**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/guides` | GET/POST | `guides/[[path]].js` | Guides par propriété — GET : lit depuis D1 avec fallback `/public/guides/{id}.json`. POST : sauvegarde en D1. Param : `property_id`. |
| `/api/geo` | GET | `geo.js` | Retourne pays/ville du visiteur via headers Cloudflare — suggère la langue (FR/EN) et détecte contexte Caraïbes/métropole. |
| `/api/weather` | GET | `weather.js` | Proxy sécurisé vers OpenWeatherMap. Param : `loc=martinique\|nogent`. Cache CDN 30min. |
| `/api/airbnb-test` | GET | `airbnb-test.js` | Test READ-ONLY de l'authentification Airbnb + lecture des prix actuels (aucune modification). |
| `/api/health` | GET | `health.js` | Santé du système avec vérification config (env vars, bindings D1/Stripe/Resend/Apps Script). `?deep=1` active les pings réseau. Auth `?secret=POSTSTAY_SECRET`. |
| `/api/health-check` | GET | `health-check.js` | Statut des services critiques (D1, Beds24, Resend), sans auth — HTTP 503 si un service est down. |
| `/api/occupancy-stats` | GET | `occupancy-stats.js` | Occupation réelle 30j glissants par bien actif, depuis le dernier snapshot D1 `rm_kpi_snapshots`. Auth Bearer admin. |
| `/api/projets` | GET/POST | `projets.js` | Tableau de bord d'avancement des projets du second cerveau (synchronisé depuis `~/.claude/memory`). Auth `?token=RAPPORT_TOKEN`. |
| `/api/seo-report` | GET | `seo-report.js` | Rapport SEO hebdomadaire via GA4 — sessions organiques, tendance vs semaine précédente, landing pages commerciales (28j). Auth Bearer ou `?secret=POSTSTAY_SECRET`. |
| `/api/shorten` | GET/POST | `shorten.js` | Liens courts pour devis (`villamaryllis.com/r/{code}`). POST crée (admin Bearer), GET `?code=` résout + incrémente le compteur. |
| `/api/tv-context` | GET | `tv-context.js` | Contexte de séjour en cours pour l'écran d'accueil TV (`?p=<bien>`) — priorité `direct_bookings`, fallback iCal Airbnb/Booking. Renvoie `source:"direct"\|"ota"`, consommé par `GuestGuide.jsx` (voir ci-dessous) pour cibler l'invitation directe. |
| `/api/articles` | GET/POST/PATCH | `articles.js` | CRUD articles SEO — GET liste (published seul sauf admin), `?slug=`/`?category=` filtrage. POST/PATCH admin Bearer. |
| `/api/voyageur-feedback` | GET/POST/PATCH | `voyageur-feedback.js` | Avis Airbnb (D1 `voyageur_feedback`) — `?action=stats\|public\|report\|ingest\|draft\|code-themes`. PATCH `?action=moderate`. |
| `/api/trigger-sync` | GET/POST | `trigger-sync.js` | Force une re-sync manuelle — `?type=direct` (D1→Sheet résas Stripe) ou `?type=full` (+ sync Worker complet). Auth Bearer `CLAUDE_SECRET`. |
| `/api/inventory` | GET/POST/PATCH/DELETE | `inventory.js` | Gestion centralisée stocks/linge/consommables (log-008) — seuils min/max, alertes rupture, prédiction ETA. `?action=init` crée tables+seed (6 biens MQ, Nogent exclu — conciergerie externe), `?action=alerts` liste les items en rupture imminente, `?action=movement&id=N` enregistre une conso/réappro. |
| `/api/maintenance` | GET/POST/PATCH/DELETE | `maintenance.js` | Suivi maintenance préventive (D1 `maintenance`) — clim/piscine/jacuzzi/jardin/plomberie/électricité/structure, statut à_planifier/planifié/fait. Auth Bearer admin. |
| `/api/quality-check-draw` | GET/POST | `quality-check-draw.js` | **Contrôle qualité aléatoire** (reco Resp. Logistique, 2026-07-18) — tire un bien au hasard (bookable, pas déjà en cours, pas contrôlé depuis <21j — logique pure `src/utils/qualityCheck.js`) et crée une entrée `maintenance` (`category='qualite'`, déjà dans son enum — pas de nouvelle table/UI) avec la checklist en `notes`. GET `?secret=POSTSTAY_SECRET` = cron hebdo (lundi), `?dry=1` = aperçu. POST Bearer admin = tirage manuel depuis le bouton 🎲 de l'onglet Maintenance. |
| `/api/prestataires` | GET/POST/PATCH/DELETE | `prestataires.js` | **I-10 (prérequis)** — carnet prestataires en D1 (ménage/plomberie/électricité/jardinage/piscine/serrurerie/peinture/autre). **Migré du localStorage** (`amaryllis_prestataires_v1`) le 2026-07-17 : les contacts n'existaient que dans le navigateur de Vincent → aucune sauvegarde, et surtout **invisibles côté serveur**, ce qui rendait impossible toute action serveur les impliquant (c'était le blocage matériel n°1 du concierge IA). `?categorie=` / `?bien=` (filtre bien appliqué en JS : `biens` est un tableau JSON en TEXT, un LIKE SQL ferait des faux positifs). `POST {import:[...]}` = migration idempotente non destructive (dédup nom+tél, n'écrase jamais). DELETE = suppression douce (`actif=0`, l'historique reste référençable). Écritures Bearer admin ; **GET aussi via `?secret=POSTSTAY_SECRET`** pour que les crons/agents serveur résolvent un contact sans token admin. UI : onglet Prestataires (bandeau de migration explicite tant que des contacts locaux ne sont pas repris — le localStorage n'est jamais purgé, il reste le filet). |

**Éditorial & Réseaux sociaux**

| Endpoint | Méthode | File | Purpose |
|---|---|---|---|
| `/api/editorial-calendar` | GET/POST/PATCH/DELETE | `editorial-calendar.js` | CRUD complet du calendrier éditorial — planification des posts FB/IG (thèmes, variantes, photos, CTA), auto-seed 30j selon rotation hebdo canonique. |
| `/api/editorial-gate` | GET/POST | `editorial-gate.js` | Gate de qualité avant auto-publication réseaux — évalue les drafts prêts (`status='drafted'`), applique le fact-check, approve/escalade selon le mode (live/shadow). Auth Bearer ou `?secret`. |
| `/api/editorial-photos` | GET/POST | `editorial-photos.js` | Whitelist des photos autorisées à la publication réseaux — l'admin sélectionne les « plus belles » par bien ; le gate refuse tout post avec une photo non whitelistée. |
| `/api/editorial-videos` | GET/POST | `editorial-videos.js` | Whitelist des vidéos autorisées à la génération de Reels — admin sélectionne par bien depuis le manifeste statique `public/videos-manifest.json`. |
| `/api/guide-write` | GET/POST | `guide-write.js` | Auto-rédaction des guides voyageurs — réécrit uniquement `welcome_message` + `tagline` via LLM (grounded, fact-checké), applique en D1. Mode shadow/live, kill-switch `GUIDE_WRITE_DISABLED`. |
| `/api/reel-gen` | POST | `reel-gen.js` | Génération à la demande d'un draft `reel_post` — reçoit `{bienId, theme, variante}`, retourne la caption via LLM (cascade Groq→Mistral→Cerebras). Auth Bearer admin. |
| `/api/social` | GET/POST | `social.js` | Proxy Meta Graph API (Instagram + Facebook) — `?action=status\|posts`, POST publish/schedule (caption, imageUrl, channels, scheduledAt). Gère les containers REELS et le polling d'encodage Meta. |
| `/api/social-draft` | POST | `social-draft.js` | Analyse d'un verdict de répondeur social — reçoit un texte libre (commentaire groupe FB), retourne `{lead, confidence, lang, reply?}` via l'agent voix grounded. Auth `?secret`. |
| `/api/social-poll` | GET | `social-poll.js` | Détecteur de leads SANS webhook (mode dev, aucun App Review) — lit les commentaires récents FB Page + IG, détecte les vrais leads « location Martinique », rédige une réponse via agent, push ntfy. Dédup D1. |
| `/api/social-webhook` | GET/POST | `social-webhook.js` | Bot social auto-répondeur — GET vérifie `hub.challenge` Meta, POST reçoit les événements commentaires, tri LLM (vrai lead ?), répond en public + DM avec lien site. Modes shadow/live, anti-boucle, kill-switch `SOCIAL_BOT_DISABLED`. |

**Utilitaire interne**

| Fichier | Role |
|---|---|
| `_ratelimit.js` | Module partagé — rate limiter léger basé sur D1. Usage : `await rateLimit(db, { key, limit, windowSec })`. Non exposé comme endpoint HTTP. |

The `netlify/functions/` directory is a duplicate/legacy copy — the active functions are in `functions/api/`.

Environment secrets are set in Cloudflare Pages dashboard (production) or `.dev.vars` (local). See `.dev.vars.example` for all required keys: `BEDS24_TOKEN`, `APPS_SCRIPT_URL`, `STRIPE_SECRET_KEY`, iCal URLs per property per platform.

### Cloudflare Worker (separate deploy)

`workers/ical-sync/index.js` is a standalone Cloudflare Worker deployed via `wrangler.toml` (name: `amaryllis-ical-sync`). It dispatches on `event.cron` (see `wrangler.toml` `[triggers] crons`) — **8 real cron entries** (verified 2026-07-06):

| Cron | Fréquence | Ce qu'il déclenche |
|---|---|---|
| `*/10 * * * *` | toutes les 10 min (branche `else`) | `runSync` (iCal + annulations Beds24 non payées) · `runEditorialAutoPublish` (posts `approved` dus → FB+IG) · `send-relance-panier` · sync Gmail entrant |
| `0 9 * * *` | 9h UTC / 5h Martinique | Brief matinal, KPI sentinel, AI-Ops refresh, monitor, rappels hôte, occupancy snapshot, gap/yield pricing, caution-cron, inventaire, emails voyageurs (prearrivee/verif-arrivee/j1-acces/pre-depart), poststay, devis-solde, coherence-check, agents-run(all) + orchestrateur + digest IA |
| `0 11 * * 1` | lundi 11h UTC / 7h MTQ | `runReunioneGenerale` — accountability cross-fleet + synthèse LLM |
| `0 12 * * *` | 12h UTC / 8h MTQ | `runEditorialReseed` + `runEditorialDraftGen` (drafts J+2) + alerte ménage |
| `0 13 * * *` | 13h UTC / 9h MTQ | `charge-balance` (soldes 2× J-30 — migré cron-job.org 7798126) · `docs-refresh` → `rag-ingest` |
| `0 6 * * 1` | lundi 6h UTC | Rapport hebdo, prix-recap, QA hebdo, agents-execute + digest, token health check, SEO report, bug-triage, agents-triage, memory-distill, guide-write |
| `0 1 1 * *` | 1er du mois 1h UTC | Export comptable, article SEO long-tail mensuel, rappel rotation tokens, refresh avis (Apify), QA mensuel, `seasonal-update`, `rm-seed-drift` |
| `0 20 * * 7` | dimanche 20h UTC / 16h MTQ | `runAccountability` — accountability hebdo (prépare la Réunion Générale du lundi) |

- Fetches iCal from Airbnb + Booking.com for all properties
- Detects new bookings by comparing UIDs against Cloudflare KV (`ICAL_STORE`)
- Sends email notifications via Resend API
- Pushes data to Google Apps Script (`APPS_SCRIPT_URL` secret)

Deploy separately: `wrangler deploy` from project root.

### Source unique des biens & filet qualité (ajouté 06/2026)

**`src/data/biens.js` = source unique des FAITS des 7 biens** (module pur, importable par les 3 runtimes : Functions, prerender Node, front Vite). Champs : `id/nom/type/prix/capacite/chambres/lieu/postal/coords/rating/reviews/bookable/photos/seoTitle/seoDesc` + helpers `ALL_BIENS`/`VILLAS`/`getBien`/`isMartinique`. Consommé par `functions/[slug].js` (meta+JSON-LD fiches), `scripts/prerender.mjs` (meta + `@graph` VacationRental via `buildRentalsGraph`), `functions/api/_biens.js` (faits + grounding agents) et `PublicSite.jsx` (`canonFacts()` spread les faits ; le display riche reste local). Import depuis `src/` validé au bundling esbuild des Functions. Garde-fou : `src/__tests__/biens-consistency.test.js`. **Nomenclature : seuls Amaryllis & Iguana = « villas »** ; Iguana `bookable:false` (bail long).

**Pattern « logique pure testée + miroir GAS/Worker »** : la logique métier est extraite dans `src/utils/*.js` avec tests vitest, puis **dupliquée à l'identique** inline dans Apps Script (clasp) ou le Worker (esbuild) qui ne peuvent pas importer de modules Node. ⚠️ Garder les miroirs synchronisés. **Cartographie vérifiée (2026-07-04, `src/__tests__/mirror-drift.test.js`)** : seuls `resaDedup.js` (dédup `bienId|checkin|checkout` — miroirs `SCRIPT_SHEETS.js` `normDate_`/`dedupKey_` + `REVENUS_AUTO_2026/2027.gs` `nd_`) et `occupancy.js` (miroir `workers/ical-sync/index.js` `addDays`/`diffDays`/`nightsBooked`) ont un vrai miroir dupliqué. `pricing.js`, `coherenceRules.js` et `rmOccupancyAdjust.js` n'en ont **aucun** — les Functions/PublicSite importent le module `src` directement (pas de copie), le test pose des gardes anti-fork si ça change un jour. Drift volontaire documenté (test skip) : `normDate(Date)` lit UTC en `src` vs heure locale dans `SCRIPT_SHEETS.normDate_` (assumé pour la dédup Sheet).

**Contrôles de cohérence** : `/api/coherence-check?secret=POSTSTAY_SECRET` (`?dry=1` simule) lit `direct_bookings`, écrit les anomalies (dates invalides / total aberrant / bien inconnu / double-booking) dans l'inbox `client_errors` (`kind:"coherence"`, onglet 🐞 Bugs) + push ntfy si critique. **Cron quotidien greffé dans le Worker** (`0 9 * * *`), pas sur cron-job.org.

**Occupation réelle → Revenue Manager** : le Worker calcule l'occupation forward 30j/90j par bien (`runOccupancySnapshot`) et la persiste dans D1 `rm_kpi_snapshots` (`period_type` '30d'/'90d', `calculated_at` NOT NULL). `functions/api/rm-recommendations/[[path]].js` (`calcDateReco`) ajuste le prix conseillé selon notre propre occupation (`ownOccupancy`, barème `rmOccupancyAdjust.js`) et **neutralise les dates déjà vendues** (`bookedDates` → flag `already_booked`, vacancy_risk=0). **Advisory only** (Vincent publie ; RM ne change jamais un prix tout seul). Trigger manuel : `GET <worker>/occupancy-snapshot?token=<WORKER_SECRET>`.

**Tracking pub** : `src/lib/metaPixel.js` (Meta Pixel `714189639771397`, **consent-gated RGPD** comme GA4 — chargé après acceptation cookies via `CookieBanner.jsx`). Events miroir de GA4 : `ViewContent`/`InitiateCheckout`/`Purchase`. ⚠️ **Tout domaine tiers de tracking doit être ajouté au CSP de `public/_headers`** sinon silencieusement bloqué (le Pixel ET des endpoints GA4 régionaux l'étaient avant le fix : `connect.facebook.net`, `*.google-analytics.com`, `stats.g.doubleclick.net`).

**⚠️ Paiement en 2 fois & valeur de conversion (depuis 06/2026)** : quand un voyageur paie en 2× (acompte 30 % + solde J-30), la conversion `purchase` (GA4 `purchase`/`booking_completed` + Meta Pixel/CAPI) DOIT remonter la **valeur TOTALE** de la réservation, **jamais l'acompte** — sinon le ROAS est sous-compté de ~70 % et Google/Meta optimisent à tort. Mécanique : `create-payment-intent.js` pose `metadata.full_total` ; `stripe-webhook.js` calcule `piValue = (pay_plan==='2x' && full_total>0) ? full_total : pi.amount/100`. **La valeur totale est comptée UNE seule fois** (à la confirmation = acompte) ; `charge-balance.js` (débit du solde plus tard) **ne déclenche aucun event** → zéro double comptage. Le client (`BookingModal`) envoie déjà `total` avec le même `event_id`/`transaction_id` → dédup cohérente. **Toute modification du flux 2× doit préserver cet invariant** : valeur = total, comptée une seule fois.

### Data Sources

All financial data flows from a single Google Sheets file (ID: `1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U`). The bridge is a Google Apps Script deployed as a web app — its URL is stored as `APPS_SCRIPT_URL`. The source for the Apps Script is `SCRIPT_SHEETS.gs`.

Data loading in `App.jsx`:
1. On mount, calls `syncFromSheets` → POSTs to `/api/sheets-proxy` → Apps Script reads Sheets and returns JSON
2. Falls back to hardcoded seeds if sync fails: `SEED_BIENS` (current-year data per property), `HIST_SEED` (2022–2025 historical), `CHARGES_2025`, `REVENUS_CANAL_2025`
3. Daily prices are stored in `localStorage` via `seedPrices.js` (`loadDailyPrices`/`saveDailyPrices`)
4. Reservations come from Beds24 V2 API (via `/api/beds24-bookings`) or iCal sync

### App.jsx Structure

~1920 lines (down from ~3000+ after extraction of tabs to `src/tabs/`, 53 top-level entries incl. `tarifs/`+`messagerie/` subfolders). **`src/PublicSite.jsx` (~9780 lines) is now the largest file in the codebase**, not `App.jsx`. Key sections of `App.jsx` in order:
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
`src/GuestGuide.jsx` (`/bienvenue/<bien>`) — livret d'accueil voyageur + écran TV (mode `?tv=1`). **Invitation directe voyageurs OTA** (reco Service Client, 2026-07-18) : le composant `OtaDirectInvite` s'affiche uniquement quand `/api/tv-context` renvoie `source:"ota"` (jamais pour un séjour direct, jamais un email marketing envoyé — canal 100% livret/QR, dans le périmètre "gestion de séjour" des CGU Airbnb/Booking). Contenu : question satisfaction (lien `mailto:`, contact guest-initié) + code promo `AMARYL-FF98` (-15%, 365j, tous biens, à renouveler avant ~2027-07-18 via `/api/promo-codes`).

---

## ⚠️ Footguns & pièges connus (à lire avant de toucher au SEO, aux résas ou aux réseaux)

### 1. SEO meta des fiches — DOUBLE SOURCE (le piège n°1)

Le `<title>` / `<meta description>` / `og:*` / JSON-LD des **fiches villas et de certains guides** existent à **DEUX endroits**, et c'est le **2ᵉ qui gagne** :

| Source | Fichier | Quand | Autorité |
|---|---|---|---|
| **Prerender statique** | `scripts/prerender.mjs` (tableau `ROUTES`) | au build (`npm run build`) → écrit dans `dist/<slug>.html` | ⚠️ **écrasé** pour les slugs interceptés |
| **Injection runtime** | `functions/[slug].js` (HTMLRewriter `injectMeta`) | à **chaque requête** Cloudflare Pages | ✅ **fait foi** (réécrit le `<title>` de l'HTML servi) |

**Conséquence :** modifier un titre/description de villa **uniquement dans `prerender.mjs` n'a AUCUN effet en prod** — `functions/[slug].js` le réécrit par-dessus.

**Slugs interceptés par `functions/[slug].js`** (liste complète vérifiée 2026-07-06) : les 7 biens (`amaryllis, zandoli, iguana, geko, mabouya, schoelcher, nogent`) + `guide` (301 vers `/guide-hub`) + `guide-le-diamant`, `guide-sainte-anne`, `villa-rental-martinique`, `activites-sainte-luce`, `guide-proximite`, `location-groupe-sainte-luce`, `location-appartement-vue-mer-schoelcher`, `plus-belles-plages-sud-martinique` + les 12 entrées de la table `GUIDE_META` : `guide-distilleries-martinique`, `guide-gastronomie-martinique`, `guide-plongee-martinique`, `guide-randonnees-martinique`, `guide-trois-ilets`, `guide-saint-pierre-martinique`, `guide-francois-martinique`, `guide-arlet`, `meilleure-saison-martinique`, `reservation-directe-martinique`, `sainte-luce-martinique`, `guide-hub`.

**Règle :** pour ces slugs, éditer le titre/desc dans **`functions/[slug].js`** (objet `SEO` pour les biens, ou les constantes `GUIDE_*`). Garder `prerender.mjs` cohérent en parallèle (baseline crawler + routes non interceptées), mais la vérité = la fonction.

**Vérif live obligatoire** (curl ne sépare pas les 2 sources, mais montre ce qui est servi) :
```bash
curl -s https://villamaryllis.com/mabouya | grep -oE "<title>[^<]*</title>"
```
- Cibles SEO : **title ≤ 60c**, **meta description ≤ 158c** (au-delà → tronqué en SERP).
- ✅ **Plus de prix codés en dur (depuis 03/06)** : `functions/[slug].js`, `scripts/prerender.mjs`, `functions/api/_biens.js` et `PublicSite.jsx` lisent désormais **la source unique `src/data/biens.js`** (cf. section « Source unique des biens & filet qualité »). **Changer le prix DE BASE d'un bien (fallback, cf. §1bis ci-dessous) = éditer `src/data/biens.js` uniquement.** Seul le contenu SEO riche (amenityFeature du rich snippet) reste dans la carte `RENTAL_CONTENT` de `prerender.mjs`.

### 1bis. Pricing — 3 notions à ne JAMAIS confondre (piège vécu plusieurs fois, 07/2026)

Le mot « prix » recouvre 3 choses complètement différentes dans ce projet. Avant de répondre « le prix c'est X », identifier LAQUELLE est en jeu :

| Notion | Où | Nature | Utilisé pour |
|---|---|---|---|
| **Prix de base** | `src/data/biens.js` → `bien.prix` | 1 seul chiffre statique par bien, committé dans le code | SEO (meta/JSON-LD), et **fallback** si aucun prix journalier n'est défini pour une date |
| **Reco RM** | `/api/rm-recommendations` | Suggestion calculée (saisonnalité, occupation, règles) | **Advisory only** — n'est PAS le prix affiché tant que Vincent ne l'a pas appliqué à la main |
| **Prix réel affiché** ⭐ | `/api/site-config?type=prices` (6 biens Martinique) · `/api/beds24-rates` (Nogent) | Prix journalier par date, éditable depuis l'onglet Tarifs admin (`CalendrierTarifs.jsx`) | **LE prix que voit le visiteur et qui sert au calcul du total** — seule source à utiliser pour comparer/auditer/alerter sur un « vrai prix » |

**Le calcul exact que fait le site public** (`PublicSite.jsx`) : `dailyPricesMap[date] ?? bien.prix` — le prix journalier a toujours priorité, le prix de base n'est qu'un filet de sécurité pour les dates non couvertes. **Toute question du type « quel est le prix du bien X à la date Y » doit lire `/api/site-config?type=prices` (avec fallback `biens.js` si absent), jamais `rm-recommendations` ni le seul `biens.js`.**

### 1ter. `BIENS_MAP.cfRow` (Sheet "revenus locatif 2026") pointait sur la ligne CHARGES, pas cashflow (trouvé et corrigé 07/2026)

`appscript/SCRIPT_SHEETS.js` → `BIENS_MAP[i].cfRow` est censé désigner la ligne "cashflow" de chaque bien, consommée par `readAll_()` → `biens[i].cashflow` → **affichée en prod dans `Cockpit.jsx`** ("CF YTD" KPI top-level, alerte cashflow négatif Nogent, `statutBien()` pour le badge vert/jaune/rouge). Vérifié en live le 2026-07-10 (chantier `/api/revenue-summary` charges/cashflow) : `cfRow` pointait en fait sur la ligne **"total X"** du bloc dépenses (le total des CHARGES, pas `ca-charges`), et `getVals(sheet, b.cfRow, 2, 12)` lisait en plus à partir de la colonne **B** (le libellé texte, ex. "total nogent") au lieu de C (janvier) — décalage d'un mois **et** décembre jamais lu. Conséquence observée avant fix : le tableau `cashflow` était une série de charges à peu près stables et **toujours positives** (jamais négatif même hors-saison), biaisant `statutBien()` vers "vert" et rendant l'alerte "cashflow négatif consécutif" de Nogent quasi inerte. **Corrigé** dans `readAll_()` : recherche dynamique de la ligne "total X" (`findChargesTotalRow_`, même mécanique que `/api/revenue-summary`) + ligne cashflow = total+1 + lecture depuis la colonne 3. Vérifié en live : le cashflow oscille désormais correctement avec l'occupation (ex. Nogent 2026 : -32€ à +3264€ selon le mois, y compris négatif hors-saison). Apps Script @91.

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
- Le **Worker** (`workers/ical-sync/index.js`) génère les drafts à J-2 (`runEditorialDraftGen`, cron `0 12 * * *`) et **publie les entrées `approved`** dont l'heure est due (`runEditorialAutoPublish`, appelé dans la branche `else` du cron **`*/10 * * * *`** — toutes les 10 min, PAS horaire).
- La publication délègue à `/api/agent-drafts?action=publish` → `/api/social` (FB + IG via Graph API).
- ⚠️ **Canaux** : un draft `social_post` doit avoir `payload.channels = ["ig","fb"]`. Si le LLM n'émet que `["ig"]`, **Facebook est silencieusement zappé** (pas d'erreur). Corrigé dans `agents-run.js` (force les 2 canaux), mais vérifier sur tout nouveau draft. Statut `drafted` ≠ publié : il faut `approved` pour que le cron le sorte.

### 4. Sécurité / exploitation

- **Rate limiting** : module partagé `functions/api/_ratelimit.js` (`rateLimit(db, {key, limit, windowSec})`, D1, fail-open). Déjà sur `/api/admin-auth`, `/api/contact`, `/api/beds24-bookings` (60/min/IP). DB = `env.revenue_manager`.
- **Rotation des tokens** : runbook `docs/runbook-rotation-tokens.md` + rappel email trimestriel auto (`runTokenRotationReminder`, jan/avr/juil/oct). `META_PAGE_TOKEN` = System User token **permanent depuis 2026-06-20** (commit `6c4dee95`, suppression de l'endpoint temporaire `meta-token-exchange.js` post-migration) ; rotation trimestrielle = pour les autres tokens (Beds24, etc.).

### 5. A/B testing

Infra : `src/utils/abTest.js` — `getVariant("nom_test")` (cookie 50/50 + GA4 `ab_variant_assigned`), `trackConversion("nom_test", {…})` (GA4 `ab_conversion`). Tests actifs : `cta_label`, `hero_amaryllis`.
⚠️ **Ne jamais A/B le prix via `bien.prix`** : il alimente le calcul du total de réservation (incohérence checkout). Un test charm-pricing nécessiterait un champ d'affichage `prixAffiche` découplé du calcul.

### 6. Messagerie Gmail entrante (depuis 07/2026)

`emails_log` contient maintenant des lignes `direction='in'` (réponses voyageurs importées
depuis `contact@villamaryllis.com` via `gmail-sync.js`, voir `docs/GMAIL-SETUP.md`) EN PLUS
des lignes `direction='out'` (envois Resend, comportement historique).
⚠️ **Piège** : pour ces lignes entrantes, `to_email` vaut toujours `"contact@villamaryllis.com"`
(la boîte réceptrice) et c'est `from_email` qui contient l'adresse du voyageur. Toute nouvelle
requête D1 sur `emails_log` qui groupe/filtre par voyageur **doit** utiliser l'expression
`CASE WHEN direction = 'in' THEN from_email ELSE to_email END` (déjà appliquée dans
`functions/api/emails-log.js`) — grouper naïvement par `to_email` ferait disparaître toutes
les réponses voyageurs sous un unique bucket `contact@villamaryllis.com`.

⚠️ **OAuth multi-provider** : la table D1 `oauth_tokens` a une ligne par provider
(`gmail`, `calendar`, ...) — se connecter à l'un ne connecte PAS l'autre, même si c'est
le même compte Google physique et le même Client ID/Secret. Toujours préciser le bon
`provider` dans `getValidAccessToken(env, db, provider)`. Le callback OAuth
(`/api/gmail-oauth-callback`) est partagé et lit le provider cible depuis `state`
(signé côté serveur, voir `_googleOAuth.js`) — ne jamais faire confiance à un `?provider=`
en clair dans l'URL du callback lui-même (il n'y en a pas, justement pour ça).

### 7. Déploiement & vérif

- `npm run deploy:pages` rebuild + déploie + **smoke test** (home/villa/admin, bundle JS, kill-switch SW, anti-asset-gelé `/guide-hub`, API `get-config`/`social`, `sitemap.xml`, meta prérendue). Échec smoke = exit 1.
- **Audit d'invariants au déploiement** (non bloquant) : `scripts/audit-invariants.mjs` (post-smoke) vérifie source unique des biens, miroirs GAS/Worker, CSP vs tracking, longueurs meta, mémoire `.memory/` → verdict 🟢/🟡/🔴 + rapport `docs/_audits/AUDIT-latest.md` (gitignoré). **Ne bloque jamais** (`SKIP_AUDIT=1` pour désactiver). Pour un audit riche piloté : skill **`auditeur`** (manuelle).
- Le **Worker** se déploie séparément : `npx wrangler deploy`.
- Après tout changement SEO/résa/réseaux : **vérifier en live** (curl + endpoints), le build local ne reflète pas l'injection runtime.
