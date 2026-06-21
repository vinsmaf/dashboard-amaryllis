# ITERATIONS_LOG — Journal des sessions (rolling)

> 1 entrée par session : date · ce qui a été fait · commits clés. Le plus récent en haut.
> **Archive des sessions antérieures : `../PROJECT_MEMORY.md` + `../docs/_archive/`.**

- **2026-06-21** — **Session organisation société d'agents + migration crons** — (1) **Patrimoine fleet 10→23 agents** (`FLEET_DEFAULT` élargi à tous les agents, commité `754401f`, déployé). (2) **7 skills de réunion** créés (`/reunion-generale` cross-fleet + 5 depts + `/conseil`). (3) **Stale prices community-manager** corrigés (Zandoli 220→110, Géko 150→110, Mabouya 110→70, Schœlcher 100→90, Nogent 85→90) + `_skills.js` rebuild (17 skills, 76.1KB). (4) **Migration crons** : `charge-balance` (cron-job.org 7798126) → CF Worker `0 13 * * *` ; iCal sync `*/15→*/10` ; 6 autres jobs déjà supprimés de cron-job.org lors de sessions précédentes. (5) **11 fiches agents interactives** créées (qa-tester, growth-experiments, veille-concurrentielle, prompt-engineer, seo-local, voyageur-research, repondeur-social, fiscaliste, controleur-fiscal, comptable, notaire-assurance). (6) **V2 réunions live** : trigger POST `/api/agents-run` + sleep 90s ajouté aux 6 skills avant lecture KV. Commits locatif : `a037883` (deploy:pages) · `6c163e7` (deploy:worker). Commits cerveau : `5c22bc0` `f9eaae3` `3d760ed` `3398a26` `b4b015e` `e142f5b`. ADR-CRON-MIGRATION-001 · ADR-AGENTS-COMPLETS-001 · ADR-REUNIONS-V2-001.

- **2026-06-21** — **Session Reels IG+FB + pipeline auto-pub** — (1) **Pipeline Reels IG complet** : container_id stocké si timeout CF Pages (30s < encodage Meta 60s), retry `publish_container` au lieu de re-créer, bouton « 🔄 Réessayer » pour status `failed` (`ReelsTab.jsx`). (2) **Facebook Reels** : `social.js` → `/{page-id}/video_reels` (endpoint distinct, `description`+`title`+`published`+`video_url`). (3) **7 biens × MP4 Ken Burns** générés et déployés (`public/videos/reel-{bien}.mp4`, 1080×1920, 5 photos chacun). (4) **`reel-gen.js`** nouveau endpoint (POST admin, caption LLM Mistral, scoring auto, draft D1). (5) **43 entrées `editorial_calendar`** reels juin-sept 2026 insérées (D1 wrangler). (6) **5 posts bloqués purgés** (manuellement : drafts 101/91/64/103 + entries 133-135-124). (7) **Fenêtre auto-publish 14j → 90j** (Worker). Commits : `484d5b6` `67ceba3` `042ce8c`→`294da7c`. ADR-REELS-001 · ADR-EDITORIAL-WINDOW-001.

- **2026-06-20** — **Session sécurité + CSP** — (1) **3 findings audit sécurité** : `manage-deposit` gate Bearer+CORS (CRITIQUE, argent réel LIVE), `social` POST gate Bearer|secret (ÉLEVÉE, publication FB/IG), `beds24-bookings` cache public→private (ÉLEVÉE, PII CDN). Frontend : Bearer ajouté `Cautions.jsx` + `SocialTab.jsx` ; `agent-drafts.js` passe `?secret`. (2) **2 bugs CSP** : `connect-src` +`api.open-meteo.com` (météo `/explorer` silencieusement bloquée), `style-src` +`https://unpkg.com` (CSS Leaflet cartes). (3) **Audit multimédia** : fetchPriority déjà en place partout, 100% webp, rien à faire. (4) **Nettoyage AGENDA** : auto-pub réseaux cochée ✅. Commits : `439744a` · `89f3f03`. ADR-SEC-001 · ADR-CSP-001.
- **2026-06-20** — **Session CRO conversion (skill `/chef-produit-web`)** — 5 déploiements prod (tous smoke verts). (1) **Mécanisme anti-périmé** : créé `scripts/funnel.mjs` (`npm run funnel` = funnel GA4 live, source unique) ; purgé 19 chiffres figés de `.memory` → pointeurs ; ligne RECALL déclencheur. Cause racine : j'avais resservi le funnel du 04/06 figé (faux ×4-10). (2) **`add_payment_info`** : 4e étape funnel (begin_checkout = clic intérêt = dénominateur gonflé) → isole abandon-formulaire vs abandon-CB. (3) **Attribution** : purchase MP server-side via vrai `client_id` GA4 (cookie `_ga`→metadata Stripe) + param `bien_id` → fin "Unassigned"/"(not set)". (4) **Friction paiement** : feedback explicite chargement Stripe + état `stripeFailed`. (5) **Galerie Géko 4→9 HD** (masters 16-23 @2000px, hero crépuscule 01.webp gardé sur choix Vincent ; HEIC→sips JPG→sharp webp). Diagnostic clé : le "63→4" était un trompe-l'œil (dénominateur gonflé + fenêtre polluée par correctifs 18-19/06) → verdict propre repoussé au 03/07 (tâche programmée `funnel-verdict-propre-locatif`). Commits : `a0012ad` `620fbd0` `70d445a` `4d89f0d` `a3bbfc2`. ADR-FUNNEL-LIVE-001 · ADR-ATTR-001.
- **2026-06-19/20** — Config FB page Amaryllis Location : (1) Pipeline auto-pub réparé (3 root causes : token Meta invalidé post-hack → régénéré via `meta-token-exchange.js` · POSTSTAY_SECRET mismatch Pages vs Worker → resync · FB page access downgraded → corrigé) · 6 posts Jun15-20 reschedulés. (2) FB page : Bio 101 chars confirmée + Social Links IG (`@amaryllislocations`) + YT (`UC76I8BM3dCr5zgFAHt-q2oA`) confirmés. CTA "Book now" existe mais URL non vérifiée (session interrompue). Lead gen form + WhatsApp = en attente BV. ADR-META-REPAIR-001 · ADR-FB-PAGE-001.

---

## 2026-06-18 (session 26) — Bug CPA canal (fix 3 couches) + Audit CRO ultracode (8 chantiers)
- **CPA bug fix** : `parseICS` capturait les numéros de référence Booking.com (12-15 chiffres) comme montant → CPA 62G€ dans CpaCanalTab. Fix 3 couches : cap 50k€ dans `Planning.jsx` + `workers/ical-sync/index.js`, cap 100k€ dans `CpaCanalTab.jsx`, migration startup `App.jsx`. GAS `fixMontantsAberrants_` → `{fixed:0}` (Sheet propre, pollution localStorage uniquement). → ADR-CPA-BUG-001.
- **CRO ultracode audit** : workflow 9 dimensions (66 agents, 50 findings confirmés) → Vincent choisit 8 quick wins. Implémentés en 1 session : (1) récap prix mobile sticky, (2) argument -15% vs Airbnb, (3) preuve sociale dans le tunnel, (5) early/late check-in checkboxes, (6) avis Google étendus (Zandoli/Géko/Mabouya), (7) CTA verbe+prix above-the-fold, (9) bouton step 1 dynamique, (10) filmstrip universel toutes fiches. → ADR-CRO-QW-001.
- **Prix périmés corrigés** : Mabouya 110→70€, Géko 150→110€, Zandoli 220→110€ (confirmé Vincent), Nogent 85→90€, commission 14→15%. Correction dans 11 fichiers (guides, FAQ, prerender, [slug].js, i18n).
- **Commit** : `d5c36e4` ("feat(cro): audit CRO — 8 chantiers conversion directe + correction prix périmés"). Smoke 🟢, audit invariants 🟢, vérifié live curl + browser.

## 2026-06-19 (session 25) — Couche proactive monitoring (4 axes) + audit ultracode
- **Couche intelligence** : 4 endpoints ntfy data-driven déployés — `morning-brief` (brief matinal), `kpi-sentinel` (8 signaux + watchdog snapshots), `ack-suggestion` (feedback loop boutons ntfy → `suggestion_acks`), `seasonal-update` (mémoire saisonnière `seasonal_memory`). Greffés sur crons existants `0 9 * * *` et `0 1 1 * *` (limite 5 crons CF free atteinte). DDL partagé `_schema.js`. → ADR-INTEL-LAYER-001.
- **Audit ultracode** : workflow 50 agents (4 dim review × vérif adversariale × fix) → 45 findings → 36 confirmés → corrigés & déployés. Auth fail-closed sur les 3 endpoints (bypass si secret absent), XSS ack-suggestion, Signal 4 `created_at`, Signal 5 RevPAR dédup, Signal 8 pipeline éditorial. → ADR-INTEL-AUDIT-001.
- **Re-vérif manuelle** : fix timezone de l'agent incohérent (DDL DEFAULT mort) → corrigé en alignant l'INSERT sur MTQ. Colonne `created_at` confirmée existante (`PRAGMA`). Auth présent en prod (BOGUS→401).
- **Reste ouvert** : occupation 0% sur 4 biens = vraie donnée (snapshots <48h présents, watchdog muet) ou bug calcul Worker iCal ? Investigation Option B non lancée.

## 2026-06-19 (session 24) — Bugs dashboard : fix generateDevis guard + triage + consolidation mémoire
- **Bug generateDevis** : guard `if (!bien?.id) return;` ajouté (`PublicSite.jsx` L1724) — empêche crash `.slice()` sur clic "Devis" sans `bien`. Déployé.
- **Triage bugs** : 3 entrées `client_errors` fermées (Java object gone → `ignored` ; `.slice()` + `.map()` → `fixed`). Bug section propre.
- **Consolidation mémoire** : ITERATIONS_LOG archivé (9 sessions condensées), CROSS-LEARNINGS 4 boucles fermées, JOURNAL-locatif archivé (9 sessions → `_archive/`).

## 2026-06-18 (session 23) — Hack Facebook / Meta Ads (réponse incident sécurité)
- **Contexte** : 3 pubs frauduleuses vietnamiennes (€17/j/pub) créées par le hacker. MDP changé 2026-06-17, 2FA activé 2026-06-18.
- **Actions** : pubs OFF (JS ariaChecked) + campagne supprimée + compte pub fermé. Partenaire frauduleux "Businesss Meta" identifié mais impossible à supprimer (blocage Meta 24-48h) → relance 20/06 (AGENDA).
- **Bilan dépenses** : €69.33 total — €36 campagne légitime Jun 7-11, €30 période hack Jun 15-18, €3.33 pending.
- **Aucun changement code locatif-dashboard.**

## 2026-06-18 (session 22 soir) — Caution UNIFIÉE + durcissement (revue adversariale)
- **Unification** (demande Vincent : un seul visuel) : tunnel 100% différé, étape caution retirée de `PublicSite.jsx` (3 étapes pour tous). Pose immédiate si arrivée ≤1 j. Module partagé `_caution.js`.
- **Revue adversariale Workflow (2 rounds)** : round 1 a lu le worktree périmé (faux NO_GO) ; round 2 en chemins absolus → GO. **8 correctifs argent-réel** : garde atomique anti-double-hold, Idempotency-Key, fallback capture_before, reauth 2j, garde séjour-terminé, exclusion devis (anti-double), checkout invalide→release (anti fonds-gelés), clé place anti-orphelin.
- 308 tests, déployé (Pages), cron vérifié (noop). Commits `ae1922f`/`f07d17e`/`8b73794`.

## 2026-06-18 (session 22) — Caution différée off-session (carte enregistrée → hold avant l'arrivée)
- **Déclencheur** : résa Antoine FENAERT (Zandoli) → écran d'erreur caution (Link réaffiche une carte refusée) + constat qu'un hold Stripe ne dure que ~7 j → inutile pour les séjours lointains (caution Anaïs réservée juin, séjour août, expire 21/06).
- **Investigation Stripe (données réelles)** : `capture_before` Anaïs = création +7,0 j pile ; `extended_authorization:disabled` ; compte **blended** (pas IC+) → extended-auth 30 j indispo. Les 2 messages d'erreur du checkout = rendus par l'iframe Stripe (absents du repo). Antoine ≠ Anaïs (lui = vrai refus carte Link ; elle = tunnel réinitialisé, pas de refus).
- **Livré (ADR-CAUTION-DEFERRED-001)** : système de caution différée complet — carte enregistrée à la résa (`create-payment-intent`, toutes résas, gracieux 1×) → `caution-cron` (mirror `charge-balance`) pose/re-bloque/libère off-session → `decideCautionAction` (machine à états pure, 21 tests) → répartition inline/différé par `isNearBooking` (seuil 3 j) → CGV §5 consentement → cron Worker 9h. Carte-only sur les 2 flux caution (ADR-CAUTION-CARDONLY-001). 306 tests, Pages+Worker déployés, dry+vrai run OK.
- **Backfill** : caution Anaïs insérée en D1 (`caution_schedule`, pose 31/07) via wrangler d1 execute. François/Mabouya = lien manuel (carte non enregistrée) → AGENDA 02/07. Checkpoint 1er placement réel : AGENDA 31/07.

## 2026-06-17 (session 21) — Import directes + fix chevauchement Joël Bailleul Iguana
- **Directes Rentila** : 6 fichiers XLSX (Amaryllis/Géko/Mabouya/Schœlcher/Iguana/Zandoli) → `scripts/direct-historique.tsv` → import chunked GET GAS. ~56 résas directes 2022→2025, dont bails longs termes (Joël BAILLEUL x3 Iguana, Société MAUI ENTERTAINMENT Zandoli). Protection overlap : pull Sheet avant chaque bien → filtre `checkin|checkout` → skip les 2025-2026 déjà en base. Total Sheet : **~700 résas**.
- **Fix Joël BAILLEUL (Iguana)** : Ligne 1 (31/10 → 19/12/2024) chevauchait Ligne 2 (19/11/2024 → 31/10/2025) sur 30 nuits. Méthode : relevé bancaire → 1er virement = 04/11/2024 → checkout Ligne 1 corrigé à **03/11/2024** (3 nuits). GAS : delete `direct-iguana-2024-10-31` + re-import → `updated:1`. ADR-JOEL-OVERLAP-001.

## 2026-06-17 (session 19) — Import historique OTA complet (Booking + Airbnb) dans le Sheet
- **Booking** : 12 PDF vue groupe → `scripts/booking-historique.tsv` (355 résas, IDs synthétiques `booking-BK-<bien>-<date>`). Action GAS `importFromBooking` redéployée via clasp **@43**. Résultat : added 132 + updated 223.
- **Airbnb** : 2 comptes hôte → `scripts/airbnb-historique.tsv`, vrais codes `airbnb-<code>`. Import **chunked GET direct vers GAS** (contournement du **403 WAF** sur `/api/sheets-proxy` POST). 281 résas.
- **Résultat** : Sheet « Toutes les Réservations » = **664 résas 2022-2027** (Booking 370, Airbnb 284, direct 8). ConversionTab multi-années réel. ADR-IMPORT-OTA-001.

---

## Sessions antérieures (résumé 1 ligne / session — détail `../PROJECT_MEMORY.md` + `../docs/_archive/` + git)

> Condensé le 2026-06-20 (consolidation). Les 8 sessions ci-dessus = clair ; ci-dessous = archive 1 ligne.

- **2026-06-16 (s18)** — CSP connect-src workers.dev+ntfy.sh (gap-prices silencieux). Paiement 2× confirmé LIVE. Null-guards toFixed(). 285 tests. Commits `a354cac`/`0439281`.
- **2026-06-16 (s17)** — Audit Playbook RM : suppression `pricingEngine.js`+`minStayEngine.js` (morts). ADR-PRICING-SOT-001. RM-22 wording Sainte-Luce. RM-26 runbooks. Commits `2563378`/`8f1fdb5`.
- **2026-06-15 (nuit)** — Auto-rédaction guides D1 → `runGuideWrite` LIVE, cron lundi 6h UTC, escalade fact-check. 1er passage 22/06. Commit `7072da4`.
- **2026-06-15 (soir)** — Auto-publication réseaux SANS validation humaine (gate de qualité ADR-SOCIAL-AUTOPUB-001) → LIVE. `_editorialGate.js` (4 filtres, 20 tests) · whitelist 42 photos · test grandeur réelle OK (FB+IG). 258 tests.
- **2026-06-15 (suite)** — Token Meta permanent renouvelé (20 scopes) · diagnostic FB feed bloqué par Advanced Access (App Review) · ADR-META-TOKEN-001.
- **2026-06-15** — Tracking pub Meta/Google : audit adversarial → 50 findings confirmés · anti double-comptage (eventID=pi.id) · CAPI enrichi (EMQ 60-75%) · CSP Ads · 223 tests. Commits `f5b1784→9a30660`.
- **2026-06-14 (soir long)** — Devis R/O (ADR-DEVIS-001) · priceGuard ntfy (ADR-PRICE-001) · Booking scraper Playwright (ADR-BOOKING-001, NINA GRUBO ✅) · Chat Mistral + escalade. 219 tests.
- **2026-06-15** — Autonomie agents : 3 boucles (A éval auto + B bus inter-agents + B2 distillation hebdo). ADR-BRAIN-002. 22 agents notés moy 7,9/10. Dashboard "🧩 Projets cerveau". Pages ×4 + Worker ×3.
- **2026-06-14 (nuit)** — V4 rapport-business + page ProjetsCerveauTab. Scheduled task vérifiée (existait malgré le msg d'erreur /schedule). ADR-BRAIN-001. 219 tests.
- **2026-06-14 (soir)** — Pont email Airbnb (Outlook→Gmail→Apps Script `ingestAirbnbEmails_`, trigger 15 min actif). ADR-MAIL-001. Booking.com scraper = chantier suivant.
- **2026-06-14** — Fiabilité tunnel résa (Anaïs Chouteau 993€ corrigé) · résa groupe par-bien · /guide 301 · badge Booking · smoke-test sur alias (fin faux hard-fail CDN). 10 commits. Migrations D1 `host_notified`/`group_biens`.
- **2026-06-13 (soir)** — SEO 5 chantiers : VacationRental JSON-LD · hreflang runtime · robots.txt · LCP 6 biens · Fonts dédup. Commit `14c817d`. 178 tests.
- **2026-06-13** — Pub (Meta+Google C1/C2) · fix ViewContent race · webhook Beds24 V1→V2 · revenus 100% mois arrivée. ⚠️ `rebuildRevenus2026_` a détruit les données manuelles (restaurées à la main).
- **2026-06-13 (graphify)** — Graphify installé, 3 knowledge graphs (locatif 2153N/3719E), post-commit hooks. God nodes : `fetch()` 128 arêtes, `verifyBearer()` 65.
- **2026-06-12c** — Audit visuel multi-agents (11 agents/10 pages) → 5 fixes code + 4 fixes texte FAQ. 178 tests.
- **2026-06-12b** — Patrimoine uniquement (7 features, commit `66fc595`). Clôture locatif = mémoire.
- **2026-06-12** — YouTube (bande-annonce + 3 playlists + 7 scripts visite virtuelle) · fix Sentry chunk périmé (ErrorBoundary onError → reload auto).
- **2026-06-11 (nuit)** — CRO : prix dans cases calendrier · rebond inter-biens · bloc « À proximité » · POI carte→guides · CTA avis Google in-situ · 2 titres SEO · fix routes 404 · placeholder tél D1. Plan paiement 2× (ADR-PAY-001).
- **2026-06-11 (soir)** — CRO multi-biens (trust bars FR/EN, sticky mobile) · bilan trafic GA4 170 users +278% · AnalyticsTab.
- **2026-06-11 (nuit)** — Signal preuve sociale (`socialProofMsg`) · galerie Mabouya réchauffée.
- **2026-06-11 (soir)** — Fix GA4 MP (`Content-Type` webhook, cause 0 purchases depuis 28/05) · audit résa RAS.
- **2026-06-11 (après-midi)** — sessionStorage guards (`ssGet`/`ssSet`) · triage 72 findings LLM · archivage docs kits · BLOCKERS stales fermés.
- **2026-06-11 (matin)** — `REVENUS_AUTO_2027.gs` + dispatchers · fix DDL `notify-booking` + `get-availability`. Commits `1911197`/`14771f1`.
- **2026-06-10 (soir)** — Domaine Meta vérifié · CAPI Meta `_metaCapi.js` (score 8.0/10) · crons hebdo · VINCENT.md enrichi.
- **2026-06-10** — Guide séjour in-stay · bot WhatsApp · email J-1 · coherence-check multi-canaux.
- **2026-06-07 (soir)** — Incident chunk périmé v2 résolu (`functions/assets/[[asset]].js` 404 forcé + sentinel smoke test).
- **2026-06-07 (suite)** — Messagerie Feature A : compositeur email + codes promo (D1 `promo_codes`). 171 tests.
- **2026-06-07 (soir)** — Messagerie niveau 1 : `_sendEmail.js` + `/api/emails-log` + D1 `emails_log`. 166 tests.
- **2026-06-07** — Pub/Ads : budgets réduits · Meta C2 MOFU · iCal export RFC 5545 · `trackingAttribution.js`.
- **2026-06-05 (soir)** — Bugs inbox passe 2 + `safeStorage` (ADR-S-013). 161 tests.
- **2026-06-05 (suite)** — Emails Worker (RESEND_FROM) · fix chunk admin · « mots interdits agents ».
- **2026-06-05** — Sync iCal fiabilisée · prix source unique · Google Ads C1 · Meta Pixel aligné.
- **2026-06-04** — Grosse journée : tracking purchase · TV Phases 1-3 · SEO hors-page · Analytics · Google Ads LIVE · système mémoire `.memory/` (ADR-S-001→006) · audit gouvernance.

## 2026-06-21 — Session sync permanent main = prod + couche monitoring live

**Quoi :** Résolution du drift prod (monitoring layer absent 3 jours). Réconciliation merge Reels→main (10 conflits). 3 garde-fous CI déployés. LLM observabilité. Secrets GitHub posés. 1er run CI.

**Pourquoi :** morning-brief/kpi-sentinel/ack-suggestion répondaient HTML au lieu de JSON en prod → la couche monitoring était inexistante. Cause racine : deploy manuel depuis le worktree `claude/sad-bartik-02a3c2` jamais mergé dans main.

**Commits clés :** `bf9851c` (llm traces + llms.txt) · `33df642` (merge Reels→main) · `9d8661c` (CI deploy + drift detector + garde branche) · `b04a8ec` (imageVariants) + fix smoke test CI (à committer)
