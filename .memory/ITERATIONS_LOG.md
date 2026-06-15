# ITERATIONS_LOG — Journal des sessions (rolling)

> 1 entrée par session : date · ce qui a été fait · commits clés. Le plus récent en haut.
> **Archive des sessions antérieures : `../PROJECT_MEMORY.md` + `../docs/_archive/`.**

---

## 2026-06-15 (soir) — Auto-publication réseaux SANS validation humaine (gate de qualité) → LIVE
Vincent : « automatiser les publications réseaux, de bonnes publications validées et publiées sans mon intervention » → « on passe en live, je choisis les photos ».
- **Diagnostic** : tout le pipeline éditorial était DÉJÀ auto (génération J-2, publication horaire des approved) ; seul le clic « Approuver » restait manuel. Construit le **gate de qualité** qui le remplace (ADR-SOCIAL-AUTOPUB-001).
- **Livré & déployé** : `_editorialGate.js` (moteur pur, 4 filtres, 20 tests) · `editorial-gate.js` (orchestrateur shadow/live + ntfy) · `editorial-photos.js` + `EditorialPhotosTab.jsx` (whitelist photos, onglet « Photos publiables ») · `photos-manifest.mjs` (114 photos) · Worker : génération pioche dans la whitelist + `runEditorialReseed` (horizon 30j) + appel gate.
- **Passé en LIVE** : `EDITORIAL_GATE_MODE=live` (var CF, nécessite redeploy). Vincent a coché **42 photos**.
- **Test grandeur réelle RÉUSSI** : token Meta publie bien FB+IG (post Bellevue id 102, FB `986487064137992` / IG `17861211021649749`) — mon inquiétude sur les scopes était infondée.
- **3 pièges fact-check trouvés & corrigés** (défense en profondeur — fact-check BLOQUANT remis dans `agent-drafts` executeDraft) : (1) faux positif hashtag `#AmaryllisLocations` → strip hashtags ; (2) aveuglement au bien → `okFor`/`onlyFor` + bienId ; (3) « villa » pour bien non-villa → règle `\bvillas?\b` onlyFor 5 biens ; + règle nb chambres (« Quatre suites » faux pour Amaryllis=3ch).
- **Nettoyage approved** : 1 post Amaryllis « Quatre suites » renvoyé en régénération ; 4 propres conservés (Géko 16/06, Nogent 17/06, Zandoli 19/06, Nogent 20/06).
- 258 tests verts. Commits multiples (gate, garde-fou, factcheck, reseed). Kill-switch `EDITORIAL_GATE_DISABLED=1`.

## 2026-06-15 (suite) — Token Meta permanent + diagnostic blocage FB feed
Contexte : `/api/social-poll` retournait `Session has expired` sur les 2 sources (FB + IG).
- **Token renouvelé** : Graph API Explorer avec URL params `?permissions=pages_read_engagement,...` → token court → endpoint temporaire `meta-refresh-token.js` → échange `META_APP_SECRET` CF → page token permanent → mis à jour CF Pages via `wrangler pages secret put META_PAGE_TOKEN`.
- **Token vérifié** via `debug_token` → 20 scopes listés dont `pages_read_engagement: True`.
- **Diagnostic final** : IG (`/{igId}/media`) ✅ fonctionne. FB (`/{pageId}/feed`) 🔴 bloqué par Meta policy → Advanced Access (App Review) obligatoire depuis 2023, quel que soit le token.
- **Nettoyage** : `meta-refresh-token.js` supprimé après usage (token dans URL = risque log).
- **Page abonnée** (`POST /{pageId}/subscribed_apps?subscribed_fields=feed`) — fait, ne débloque pas le Advanced Access.
- **BLOCKERS mis à jour** + ADR-META-TOKEN-001 posé. Dossier App Review prêt (`docs/marketing/social-bot-app-review.md`).

## 2026-06-15 — Optimisation tracking pub Meta/Google (audit adversarial → 7 fichiers déployés)
Workflow d'audit 6 dimensions (Pixel client, CAPI, GA4/Ads, consent/CSP, attribution, funnel) × vérif adversariale → 50 findings confirmés, 2 faux positifs écartés. Correctifs livrés (ADR-TRACKING-001) :
- **Anti double-comptage** : `eventID=pi.id` sur les 3 Purchase Pixel inline (dédup CAPI) + guard `kind=solde-2x` dans le webhook (le solde 2× créait une fausse conversion + fausse alerte hôte + faux `direct_booking`) + `transaction_id=pi.id` (parité Nogent/Beds24).
- **Match quality CAPI** : user_data enrichi (fbc/fbp/tél/prénom/nom/external_id hachés) → EMQ ~15-40%→~60-75%. Chaîne : `_fbp`/`_fbc` lus à chaud + gclid/fbclid → metadata Stripe (allowlist `create-payment-intent` élargie, elle jetait tout) → webhook → CAPI.
- **Compléments** : events Meta `Lead` (contact/alerte/WhatsApp), items GA4 résa groupe, CSP googleads/googleadservices/td.doubleclick, CAPI v19→v21, test trackingAttribution (4 cas).
- **Cœur paiement intouché** (Vincent a demandé confirmation) : prix, débit Stripe, Beds24, caution, acompte 2× = identiques.
- 223 tests ✅, audit 🟢, smoke OK, CSP vérifié live. Commits `f5b1784`→`9a30660`. Déployé alias `cca5555d`.
- **Secrets** : vérifié `wrangler pages secret list` → `META_CAPI_TOKEN` **ET** `GA4_API_SECRET` déjà posés (l'audit qui les disait absents = faux positif). GA4 MP prouvé fonctionnel (purchases en « Unassigned »).
- **Perf pubs lue dans les dashboards** (Chrome MCP read-only) : Meta 50€/30j (objectif LPV, 0 conv), Google 47,88€ (CPC 0,62€, Max clics, 0 conv), 2 ventes GA4 (2 226€) en « Unassigned ». **Meta était gelé** (plafond compte 50€ atteint) → Vincent l'a relevé à **100€** → C1+C2 repassées **Active** (vérifié). Google conversion « amaryllis (web) purchase » déjà GA4/Principale mais 0 (attribution). **Lever 2 (Max conversions) DIFFÉRÉ** → AGENDA 28/06. Cf. ADR-TRACKING-001 + BLOCKERS « Perf pubs réelle ».

## 2026-06-14 (soir long) — Sécurité devis + priceGuard + Booking scraper + Chat Mistral
Session longue pilotée par Vincent : 4 livrables.
- **Devis client R/O** (`da82843`) : éditeur de remise supprimé de `generateDevis()` (client voyait et pouvait modifier la remise, imprimer un prix arbitraire). ADR-DEVIS-001.
- **priceGuard alerte** (`327c2d5`) : `src/utils/priceGuard.js` (11 tests) + `stripe-webhook.js` — ⚠️ email + ntfy `urgent` si montant Stripe < 20% de nuits×prix_base (6% pour acompte 2×). Alerte non bloquante (prix dynamiques + promos légitimes). ADR-PRICE-001.
- **Booking.com scraper** (`a813185`) : `src/utils/parseBookingReservation.js` (19 tests, données réelles NINA GRUBO + Ferry Vergeer) + `scripts/booking-sync.mjs` (Playwright session persistante, ntfy si expirée) + `docs/booking-sync.md` + GAS `enrichReservation_` flag `force` déployé @41. Testé e2e : NINA GRUBO/Zandoli 696,48 € ✅. ADR-BOOKING-001. Convention montant = NET = total−commission (Vincent).
- **Chat Mistral + escalade** (`1614d68`, `4695081`, `9f992f3`, `d5a79b4`) : ChatWidget bascule sur Mistral medium (FR-natif, cascade Groq/CF) · escalade ntfy + flag `notified` · kill-switch `CHAT_DISABLED`.
- **219 tests ✅**. Rapport-business V4 + page projets (session précédente, commits `d077f37`, `a95a014`).

## 2026-06-15 — Autonomie réseau d'agents : 3 boucles (A éval auto + B bus + distillation)
Objectif Vincent : "peaufiner le second cerveau, plus autonome/puissant, réseau clair, façon d'interagir/apprendre/s'améliorer". Workflow de cartographie (5 lecteurs //) puis A puis B.
- **Cartographie** : workflow `comprendre-agents-amaryllis` (5 agents Explore //) → constats clés : `agents-eval` existait mais DORMAIT (aucun cron) ; `agent_memory` injectée dans les prompts MAIS silo (chaque agent ne lit que la sienne) ; `llm_outputs` journalise via `logSource`.
- **A — Évaluateur auto + feedback** (ADR-BRAIN-002) : `agents-eval.js` sélectionne 1 sortie/agent → note 0-10 → si faible, consigne corrective dans `agent_memory(eval_feedback)` mise en exergue au prompt ; supprimée quand l'agent repasse ≥8. Cron quotidien `runAgentsEval` (worker 0 9). Vérifié : 22 agents notés, moyenne **7,9/10**.
- **B1 — Bus inter-agents** : champ JSON `signal` optionnel → `agent_memory('_shared','signal:<id>')` lu par tous (section `📡 SIGNAUX`). Prouvé prod : data-analyst "Mabouya sous-performe" → revenue-manager le reprend.
- **B2 — Agent-mémoire** : `memory-distill.js` (NOUVEAU) distille evals+impacts+signaux → 3-5 `_shared/learning:N` injectés partout. Cron hebdo `runMemoryDistill` (worker 0 6 lun). Prouvé : 3 learnings distillés.
- **Dashboard** : section "Boucles d'autonomie" dans ProjetsCerveauTab.
- **Bugs corrigés en cours de route** : sélection 25-plus-récentes monopolisée par community-manager → 1/agent ; écrasement feedback même-batch → garde `Set` ; lints `no-empty`.
- Déploiements : Pages ×4 + Worker ×3. Commits A, B, dashboard. Tests 219 verts à chaque gate.

## 2026-06-14 (nuit) — V4 rapport-business + page Projets Cerveau
Session de clôture + test autonomie. Vincent au cinéma jusqu'au soir.
- **Scheduled task vérifiée** : `rapport-business-amaryllis-18h` déjà créée en session précédente malgré le message d'erreur `/schedule`. Leçon : toujours vérifier avec `list_scheduled_tasks` avant de recréer.
- **Page admin "🧩 Projets cerveau"** créée (`src/tabs/ProjetsCerveauTab.jsx`) : roadmap V1→V4 avec statuts, jalons countdown, crons actifs, section rapport business en live. Intégrée dans App.jsx sous le groupe "Équipe".
- **Deploy** : 219 tests ✅, audit 🟢, smoke OK. Alias `5e2cca40.dashboard-amaryllis.pages.dev`.
- **ADR-BRAIN-001** : composant statique (données embarquées) → pas d'API (PROJETS.md = local).
- **Test ce soir** : scheduled task tire à 18h MTQ en autonomie complète → ntfy "Rapport business Amaryllis" attendu.

## 2026-06-14 (soir) — Nom+prix Airbnb AUTO via pont email (Zapier abandonné)
Session pilotée à la main avec Vincent (computer-use + Chrome MCP). Objectif : récupérer auto le nom+prix des résas Airbnb (l'iCal ne les donne pas).
- **Zapier abandonné** : Zap à 3 étapes (Outlook→Formatter→Sheets) = Formatter « Pro » payant. Le Formatter servait à stripper le HTML (> limite 50k cellule Sheets).
- **Pivot → pont email gratuit possédé** (ADR-MAIL-001) : **Cloudflare Email Routing écarté** (`dig MX villamaryllis.com` = `smtp.google.com` Google Workspace → Email Routing aurait cassé la réception). **Retenu** : règle **serveur Outlook.com** (expéditeur airbnb ET objet confirmed → Transférer vers `vinsmaf@gmail.com`) → **Apps Script `ingestAirbnbEmails_`** (trigger 15 min, `getPlainBody`, label idempotent) → onglet « Emails » → `enrich-from-emails` (cron Worker) → `parseAirbnbMail`+`enrichReservation_` (non destructif).
- **Exécuté** : code Apps Script poussé (`clasp push`), worker `enrich` redéployé, `setupAirbnbIngest` lancé depuis l'éditeur (trigger 15 min **actif vérifié**). Règle **app Mail désactivée** (anti-double-transfert). **Mac forcé allumé** (LaunchAgent caffeinate) puis noté redondant. Outlook a exigé une **re-vérif d'identité** pour autoriser le transfert externe (faite par Vincent).
- **Git** : 5 fichiers déployés-mais-non-commités rattrapés sur `main` (`parseAirbnbMail.js`+test, `appscript/SCRIPT_SHEETS.js`, `workers/ical-sync/index.js`, `scripts/deploy-pages.sh`).
- **Reste** : confirmer end-to-end à la prochaine vraie résa Airbnb ; appliquer le **même pont à Booking.com**.

## 2026-06-14 — Fiabilité tunnel résa + résas OTA (10 commits)
Grosse session, partie d'une résa réelle (Anaïs Chouteau, Zandoli, paiement 2×, bug page caution).
- **Diagnostic résa Anaïs** : solde 695€ programmé 03/07 OK ; caution 500€ pré-autorisée OK (2 tentatives, la 1ʳᵉ échouée = le « bug ») ; mail voyageur reçu ; MAIS pas de notif hôte (front-end interrompu) + CA août=0€ au Sheet. CA corrigé à la main (pipeline `revenus2026Undo`→`importAllReservations`→`Forget`→`Sync`, montant 993€ en août, vérifié).
- **Fix tunnel** (`e1cf7d1`,`692d5e4`) : webhook = autorité pour alerte hôte (dédup `host_notified`) + total séjour ; mail 2× détaillé.
- **Résa groupe** (`df95587`) : `group_biens` → blocage par-bien (iCal OTA + site public). 3 lecteurs patchés.
- **Diag prerender /guide+/mabouya** (workflow 4 investigateurs + vérif adversariale) : /mabouya OK (faux-positif timing) ; /guide = vrai bug (stub 200 sans redirection) → 301 (`5bfea81`,`82897f5`).
- **Badge Booking** (`8542890`) + **préservation saisies iCal** (`9fdcc92`) + **rappel à-compléter** admin+Worker (`5d3e4e5`).
- **Smoke-test sur alias** (`98e368c`) : fin des faux hard-fail CDN (déclenché par un hard-fail bundle text/plain sur un deploy sain).
- **Rattrapage git** (`1ec6a06`) : 19 fichiers de sessions précédentes commités + graphify-out gitignoré.
**Migrations D1** : `host_notified`, `group_biens` (prod). **Cap demain** : connectivité Booking.com (nom+prix auto).

## 2026-06-13 (soir) — SEO 5 chantiers : VacationRental · hreflang · robots · LCP
5 chantiers SEO exécutés et déployés sur branche `claude/sad-bartik-02a3c2` → merge main :
- **A** : 9 prix corrigés dans `functions/[slug].js` (BIEN_EXTRA descs + guide meta). Prix validés par Vincent : Zandoli 110€, Géko 110€, Mabouya 70€, Schœlcher 90€, Nogent 90€.
- **B** : JSON-LD `LodgingBusiness` → `VacationRental` + BreadcrumbList · check-in/out MTQ vs Nogent · ISO countryCode MQ/FR · 4 ImageObject · priceRange conditionnel (bookable).
- **C** : hreflang injecté dans le runtime (`injectMeta()`). Était 0% en prod avant (le prerender l'injectait mais le runtime l'écrasait sans réinjecter). MTQ : fr+en+x-default ; Nogent : fr+x-default. Vérifié live ✅.
- **D** : `public/sitemap.xml` (26 URLs) supprimé (prerender = 63 URLs fraîches). `public/robots.txt` sécurisé (Disallow /admin /api/ /bienvenue/ /landing/).
- **E** : `lcpPreload` sur 6 biens (vs 1 avant) · Google Fonts dédupliqué · CookieBanner+ChatWidget lazy-loaded.
**Deploy** : `SKIP_BUILD=1` après `npm run build` manuel (échec lint delta sur lazy imports → fix `// eslint-disable-line`). 178 tests ✅. CDN propagation en cours (alias OK, villamaryllis.com lag normal).
**Commit** : `14c817d` (11 fichiers, 604+/337-).

## Sessions antérieures (résumé 1 ligne / session — détail `../PROJECT_MEMORY.md` + `../docs/_archive/` + git)

> Condensé le 2026-06-15 (consolidation). Les 8 sessions ci-dessus = clair ; ci-dessous = archive 1 ligne.

- **2026-06-13** — Pub point (Meta+Google C1/C2 actifs) · fix ViewContent race (`meta-pixel-ready` + deferred listeners) · webhook Beds24 V1→V2 réécrit · règle revenus 100% mois d'arrivée. ⚠️ incident `rebuildRevenus2026_` a détruit les données manuelles Apr-Dec (restaurées à la main) → jamais de zéro global sur un Sheet mixte.
- **2026-06-13 (graphify)** — Graphify installé (uv), 3 knowledge graphs (locatif 2153N/3719E), post-commit hooks rebuild AST. `/graphify query`. God nodes locatif : `fetch()` 128 arêtes, `verifyBearer()` 65, `useAppData()` 55.
- **2026-06-12c** — Audit visuel multi-agents (11 agents/10 pages, ~8min) → 5 fixes code (og:image:alt, Iguana hors @graph, VILLAS dérivé ALL_BIENS, favicon, hreflang Nogent) + 4 fixes texte FAQ prix (validés Vincent). 178 tests.
- **2026-06-12b** — Patrimoine uniquement (7 features, commit `66fc595`). Clôture locatif = mémoire.
- **2026-06-12** — YouTube (bande-annonce + 3 playlists + 7 scripts visite virtuelle) · fix Sentry chunk périmé via `onError` Sentry.ErrorBoundary → reload auto.
- **2026-06-11 (nuit)** — CRO : prix dans cases calendrier · rebond inter-biens (`e493142`) · bloc « À proximité » (`d3892a0`) · POI carte→guides (`9209fa2`) · CTA avis Google in-situ (`de6acf3`) · 2 titres SEO recalés Search Console (`5124b55`) · fix routes guide-sejour/services 404 · placeholder tél → D1. Plan paiement 2× écrit (ADR-PAY-001, `249caee`).
- **2026-06-11 (soir)** — CRO multi-biens (trust bars FR/EN, sticky bar mobile) + bilan trafic GA4 (170 users +278%) + section Perf Pub 7j AnalyticsTab. Commits `9c624ea`/`5257d24`/`d2012b4`. ⚠️ Leçon : UI publique = présenter AVANT de déployer (recadrage Vincent).
- **2026-06-11 (nuit)** — Signal preuve sociale (`socialProofMsg`) + galerie Mabouya réchauffée (jacuzzi en hero, `photos[0]` au lieu de `01.webp` hardcodé).
- **2026-06-11 (soir)** — Fix GA4 MP (`Content-Type: application/json` dans `stripe-webhook ga4Event()`, cause des 0 purchases depuis 28/05) + audit résa (RAS) + blocker Resend fermé.
- **2026-06-11 (après-midi)** — sessionStorage guards (`ssGet`/`ssSet`) · triage 72 findings LLM · archivage docs kits · fermeture BLOCKERS stales.
- **2026-06-11 (matin)** — `REVENUS_AUTO_2027.gs` (miroir 2026) + dispatchers · bug fixes DDL `notify-booking` (`j1_acces_sent`) + `get-availability` (`bienId` hardcodé Nogent). Commits `1911197`/`14771f1`.
- **2026-06-10 (soir)** — Domaine Meta vérifié · CAPI Meta `_metaCapi.js` (Purchase server-side, score 8.0/10) · crons hebdo consolidation+ads · VINCENT.md enrichi. Commits `1c5b98e`/`af1d0b9`.
- **2026-06-10** — Guide séjour in-stay (`GuideSejour.jsx`) · bot WhatsApp (`whatsapp.js`) · email J-1 · coherence-check multi-canaux · fix `parseInt` NaN guard (`8e2ab98`).
- **2026-06-07 (soir)** — Incident chunk périmé v2 résolu : `functions/assets/[[asset]].js` force vrai 404 sur JS servi en HTML (SPA fallback toxique) + sentinel smoke test (`524fb3d`).
- **2026-06-07 (suite soir)** — Messagerie Feature A : compositeur email (`EmailComposer.jsx`) + codes promo (D1 `promo_codes`, `_sanitizeHtml.js`, `/api/send-custom-email` rate-limited). 171 tests.
- **2026-06-07 (soir)** — Messagerie niveau 1 : `_sendEmail.js` + `/api/emails-log` + D1 `emails_log` + refactor 4 endpoints (category client/internal). 166 tests.
- **2026-06-07** — Pub/Ads : budgets €25→€18/j · Meta C2 MOFU (audience 30j) · iCal export RFC 5545 (7 biens) · `trackingAttribution.js` (UTM/fbclid/gclid first-click). Commit `2f4d6da`.
- **2026-06-05 (soir)** — Bugs inbox passe 2 + helper `safeStorage` (ADR-S-013), 161 tests.
- **2026-06-05 (suite)** — Emails Worker réparés (RESEND_FROM) + fix chunk admin + « mots interdits agents » (ADR-S-011).
- **2026-06-05** — Sync iCal fiabilisée + prix source unique + Google Ads C1 + Meta Pixel aligné. Commit `a2658cf`.
- **2026-06-04** — Grosse journée : tracking purchase réparé · TV Phases 1-3 (TvScreen + ventes Stripe) · SEO hors-page (autorité domaine) · dashboard Analytics · Google Ads LIVE · système mémoire `.memory/` (ADR-S-001→006) · audit gouvernance. (8 sous-sessions, détail PROJECT_MEMORY.)
