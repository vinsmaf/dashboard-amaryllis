# ITERATIONS_LOG — Journal des sessions (rolling)

> 1 entrée par session : date · ce qui a été fait · commits clés. Le plus récent en haut.
> **Archive des sessions antérieures : `../PROJECT_MEMORY.md` + `../docs/_archive/`.**

---

## 2026-06-05 (soir) — 2ᵉ passe sur l'inbox bugs (🐞) + robustesse sessionStorage (ADR-S-013)
- **Re-triage des 19 findings restés en `new`** (lus en read-only via `wrangler d1 execute revenue_manager`). La majorité des `[revue code]` (agent LLM `/api/code-review`) = **faux positifs vérifiés** : cluster `GuestGuide.jsx` (null-deref) déjà gardé par `if (loading) return` + `if (error || !guide) return` ; `service-checkout.js` déjà en try/catch complet. Leçon : **relire le code avant de "corriger" un finding LLM**.
- **Vrai bug corrigé** : `sessionStorage` nu → `SecurityError` si stockage bloqué → **crash render** de `/merci` (post-paiement) et de la page réservation (`PublicSite` L7735). Helper `src/lib/safeStorage.js` (`ssGet/ssSet/ssRemove`) sur Merci.jsx (tous accès) + chemins critiques PublicSite (render-time + écritures dépôt). **161 tests verts**, commit `06f7783`. ⏳ **Déploiement à faire** (`npm run deploy:pages`).
- **Restant (BLOCKERS 🟡)** : ~15 accès sessionStorage non critiques (PublicSite) à migrer ; bug **data** `coherence/total_aberrant` (résa Laurent Maignan total<dépôt) → Vincent à vérifier ; 401 admin = non-bug (token expiré, géré).

## 2026-06-05 (suite) — Emails Worker réparés + passe bugs admin + feature « mots interdits »
- **📧 Emails Worker RÉPARÉS** : `RESEND_FROM` du Worker valait `Amaryllis <notifications@>` (domaine manquant) → Resend rejetait TOUS les emails (alertes résa, rappels prix, digest) silencieusement ; le push ntfy passait → fausse impression que « ça marche ». Le `wrangler secret put` n'a rien changé (var texte dashboard prime). Fix code `resendFrom(env)` (valide FQDN sinon `VERIFIED_FROM`). **Confirmé reçu par Vincent.** Commit 50b4da1.
- **🐞 Passe sur les bugs admin** : 1 vrai bug runtime corrigé+déployé = chunk périmé post-deploy (handler `vite:preloadError` + filet, `src/main.jsx`, commit c82607b). Inbox triée : 3 timeouts crawler + 2 faux positifs SSR/window → `ignored` ; chunk → `fixed`. Restent 19 findings code authentiques en `new`.
- **🧠 Feature « mots/expressions interdits » (onglet Approbations)** : panneau liste + bannissement inline → D1 `agent_lessons` (+ champ `term`) → **injectés en amont dans le prompt des agents** (`renderBannedSection`) + fact-check. Endpoint `agent-lessons` sécurisé (auth admin). Boucle d'apprentissage : Vincent bannit → agents plus précis. Commit 6c1d0c2. Cf ADR-S-011.
- **161 tests verts**, build OK, smoke OK, audit 🟢. Commits jusqu'à **6c1d0c2** (main).
- ⏳ Reste : nettoyer var dashboard `RESEND_FROM` (cosmétique) ; refaire campagne Meta (demain) ; 19 findings code à arbitrer ; règle cohérence faux positif à assouplir si voulu.

## 2026-06-05 — Sync résa iCal fiabilisée + refonte prix (source unique) + Meta/devis
- **🔴 Bug sync résa Airbnb/Booking RÉSOLU** : `pushToSheets` (Worker) POSTait direct vers Apps Script → **body supprimé** (bug redirect Google) → résas jamais écrites dans le Sheet. Fix : routage via `/api/sheets-proxy` (forwardChunked). + cron **15 min** (au lieu de 60) + **notif push ntfy** sur nouvelle résa (avant : email seul). Worker `amaryllis-ical-sync` redéployé. Résa Géko 5-7/06 vérifiée dans admin+Sheet.
- **💶 Refonte prix — SOURCE UNIQUE** : supprimé le 2ᵉ prix éditable « Prix de base — site public » (collision clé `amaryllis_prices` format nombre vs {date:prix} = cause des « 2 prix différents »). Accroche « dès X€ » = **AUTO** (min des prix journaliers, bornée par `biens.js prix`). Planchers réels alignés partout (fiches+guides+FAQ+SEO) : **Zandoli 110, Géko 110, Mabouya 70, Schœlcher 90, Nogent 90** (Amaryllis 280). `docs/PRICING.md` créé. Déployé prod, vérifié live.
- Caution Zandoli 700→500 ; pixel Meta aligné (`1648064656415946`, dataset compte pub) ; `scripts/gen-social-ads.mjs` (rendu PNG des maquettes sociales Claude Design → 12 créas).
- **Meta Ads** : campagne C1 montée (Trafic, ABO, A1 Amaryllis · France Martinique incluse · 30-65 · intérêts) — bloquée par le **bug asset-label IA Advantage+** (#2446173) → annonce à refaire en image simple. **Google Ads C1** : 15 mots-clés « expression » ajoutés (les exacts ultra-niche = 0 impression).
- Commits jusqu'à **a2658cf** (main, poussé GitHub). **161 tests verts**, audit 🟢.
- ⏳ Reste : valider l'alerte auto nouvelle-résa (email Resend + push) sur la prochaine vraie résa ; finir l'annonce Meta A1+A2 ; déclaration meublé mairie (Vincent).

## 2026-06-04 (8) — Améliorations conversion/revenu : tracking purchase + upsell pré-arrivée
- **#1 Tracking `purchase` RÉPARÉ** (cause du « 0 purchase » alors que résas directes existaient) : `confirmPayment` redirige toujours vers `/merci` (3DS) où **gtag pas encore chargé** au mount → event perdu. Fix `Merci.jsx` : **retry jusqu'à gtag prêt** (~10s) + dédup + **vrai montant** via `pending_purchase` (sessionStorage, posé au `begin_checkout` dans PublicSite). Débloque l'optim Google Ads (conversion Principale) + l'Analytics. ⚠️ à confirmer sur la prochaine vraie résa directe. Leçon dans LEARNINGS.
- **#2 Upsell services dans l'email pré-arrivée** : section « Offrez-vous un petit plus » + CTA → `/services/<bien>` dans `public/email-templates/pre-arrivee.html` + var `services_url` (send-prearrivee.js). + `send-guest-email.js` fetch template avec **cache-bust** (l'edge CF fige le `.html` ; l'email utilise l'URL propre qui sert bien la nouvelle version — vérifié).
- **#3 Moteur d'avis Google = DÉJÀ EXISTANT** : `send-poststay.js` envoie J+3 lien Google review par bien (Place IDs Amaryllis/Résidence) + NPS. Schœlcher/Nogent → `/avis` interne (pas de GBP dédié = cohérent). Rien à coder ; juste vérifier le cron cron-job.org.
- **Quirk cache** : l'URL `/x.html` directe peut rester figée à l'edge CF malgré `no-cache`, alors que l'URL propre `/x` sert la dernière version. Toujours vérifier via l'URL réellement consommée.

## 2026-06-04 (7) — Écran TV : Phases 2 (ventes additionnelles) & 3 (images de secours) livrées
**Vente de services additionnels via QR/Stripe + images d'accueil statiques. Plusieurs déploiements.**

- **Phase 2 — VENTES ADDITIONNELLES (revenu)** :
  - **Catalogue `extras[]`** par logement dans le livret (3 services : départ tardif/arrivée anticipée, ménage suppl., bouteille de planteur 15€). ⚠️ Prix late/ménage = **placeholders à ajuster par Vincent** (admin).
  - **Éditeur admin** : onglet **Services** dans `LivretEditor` (label/prix/desc/kind, ajout/suppr) — sauvegarde via le POST /api/guides existant.
  - **Page publique `/services/<bien>`** (`src/Services.jsx`, mobile, surface site) : liste les services → bouton Payer.
  - **Endpoint `/api/service-checkout`** : PUBLIC mais **prix validé CÔTÉ SERVEUR** depuis le catalogue (anti-fraude testé ✅) → crée un **lien Stripe** (product+price+payment_link, pattern de create-payment-link). QR du slide TV « Services » → cette page.
  - **Webhook hôte** : branche `type==="service"` dans `stripe-webhook.js` (checkout.session.completed) → **email hôte** + table D1 `service_orders`.
  - ⚠️ **Stripe LIVE = argent réel** : Vincent doit faire un **test d'achat** (planteur 15€) avant de compter dessus. Lien Stripe créé OK en test (buy.stripe.com).
- **Phase 3 — IMAGES DE SECOURS** : `scripts/gen-tv-screens.mjs` (Playwright) capture le slide d'accueil figé (`?tv=1&slide=0`) en **PNG 1920×1080** par logement → `public/tv/<bien>.png` (servies live). Pour TV sans navigateur / économiseur d'écran. Régénérer : `npm run gen:tv-screens`.
- **Bandeau cookies masqué en mode kiosque** (`?tv=1`) — il polluait l'écran TV + les images.
- **✅ Faille `POST /api/guides` CORRIGÉE** : `verifyBearer` requis sur le POST (GET public). `LivretEditor` + `GuideEditor` passent désormais par `adminFetch` (token). ⚠️ **Conséquence** : on ne peut plus pousser le catalogue en D1 par curl → **futurs ajouts/prix de services = dans l'admin (onglet Services)**, plus par script. Vérifié live : POST sans auth = 401, GET = 200.
- **+ 3 chantiers (subagents)** : 🔔 **push ntfy** sur chaque vente (webhook, env `NTFY_TOPIC`) ; 🛎️ **onglet admin « Ventes »** (`src/tabs/ServiceOrdersTab.jsx`) + endpoint `GET /api/service-orders` (verifyBearer, lit `service_orders`) ; 🔄 **auto-perso TV élargie OTA** : `tv-context` cherche aussi dans `/api/get-availability` (Airbnb/Booking iCal) un séjour englobant aujourd'hui → renvoie dates SANS prénom (direct_bookings reste prioritaire avec prénom). Tolérant (erreur → {}).

## 2026-06-04 (6) — Écran d'accueil TV des logements — Phase 1 livrée (subagent-driven)
**1 chantier produit (brainstorm→spec→plan→implé). Déployé + vérifié live.**

- **Brainstorm → spec → plan** : `docs/superpowers/specs/2026-06-04-tv-welcome-screen-design.md` + `plans/2026-06-04-tv-welcome-screen-phase1.md`. S'appuie sur l'existant `/bienvenue/<bien>` (`GuestGuide` + guides JSON). 3 phases : écran TV (P1, fait) · ventes additionnelles Stripe via QR (P2, attend prix par logement) · images de secours (P3).
- **Phase 1 implémentée en subagent-driven (6 tâches, ~5 sous-agents)** : `src/utils/tvScreen.js` (pur, **12 tests vitest**) + `src/TvScreen.jsx` (diaporama plein écran, QR via lib `qrcode`, system-ui, overscan) + bascule `?tv=1` dans `GuestGuide` + helper admin « Générer l'URL TV » dans `LivretEditor` (onglet QR, variable `propId`). Déployé, **vérifié live** (`/bienvenue/mabouya?tv=1` générique + `?guest=&du=&au=` perso) : diaporama OK, QR scannables.
- **🐛 3ᵉ occurrence du bug `[data-surface="site"] h1`** : le `<h1>` du TvScreen ne fixait pas `color` inline → titre navy invisible sur fond sombre (même sur `/bienvenue`). Corrigé (`color:#fff` inline). **Le code du plan lui-même contenait le piège** → leçon renforcée.
- **Refonte visuelle PREMIUM (skill amaryllis-design)** : `TvScreen.jsx` v2 — fond photo plein écran du logement (rotation 6 clichés `/photos/<bien>/`), effet Ken Burns, dégradé cinématique, typo de marque (Jost 200 + Cormorant italic), cartes glassmorphism (WiFi/QR), transitions fondu, barre de progression, contenu ancré tiers inférieur. Bug h1 illisible re-corrigé (color inline). Tokens : navy #0e3b3a · coral #c47254 · gold #c9a673 · ivory #faf5e9.
- **Auto-perso depuis réservations** : endpoint `functions/api/tv-context.js` (GET `?p=<bien>`) → cherche la résa EN COURS dans D1 `direct_bookings` (prénom via `voyageur` + dates `checkin/checkout`, formatées FR « 5 juin »). `GuestGuide` fetch en mode TV sans prénom URL → merge (URL prime, sinon auto). **Prénom dispo = résas directes/Beds24 ; Airbnb/Booking iCal = anonymisé → générique** (acté avec Vincent). Mapping `pid→bien_nom` par mots-clés. Tolérant (toute erreur → {} → écran générique).
- **Copy livrets réécrite (agent crm-manager)** : 6 messages d'accueil en **voix « nous »** + bon nom (« Bienvenue à la Villa Amaryllis ») + **nomenclature `property_name` corrigée** (Zandoli/Géko n'étaient PAS des villas). ⚠️ Source autoritaire = **D1** (pas le JSON) → poussé via `POST /api/guides` (les 6). 
- **🔴 Faille repérée (tâche spawné)** : `POST /api/guides` n'a AUCUNE auth → n'importe qui peut écraser le contenu des livrets. À sécuriser.
- **Finitions visuelles (revue slide par slide en live)** : fond = **photo hero (01) sur tous les slides** (les photos 02+ d'intérieur étaient trop sombres → illisible) ; voile dégradé fort à gauche (lisibilité garantie) ; titre Jost 300 + ombre (était gris sur fond sombre) ; cartes glass plus claires + libellés or vifs ; **anti-chevauchement QR** (colonne droite réservée au texte quand QR présent). Slide « Bon à savoir » enrichi : **Arrivée 17h / Départ 12h + teaser départ tardif** (prépare la vente Phase 2). Param **`?slide=N`** ajouté (fige un slide : revue/preview/Phase 3). **6 livrets MAJ en D1** : checkin/checkout=17h/12h + **signature « L'équipe Amaryllis »** (au lieu de Vincent).
- ⚠️ **Donnée à compléter par Vincent** : vrais mots de passe WiFi par logement (placeholder `••••••••` actuellement) dans l'admin → Livrets.
- **Bug récurrent (3→4e fois)** : titre `<h1>` clair sur fond sombre = toujours `color` inline + weight ≥300 (Jost 200 paraît gris). Leçon déjà dans LEARNINGS.

## 2026-06-04 (5) — SEO hors-page : diagnostic Search Console + exécution Top 5 (pilotage navigateur)
**3 déploiements prod (page partenaires + fix contraste). Beaucoup de prépa contenu + pilotage navigateur.**

- **🔑 DIAGNOSTIC SEARCH CONSOLE (le constat structurant)** : sur ~2 sem de données, **17 clics / 289 impressions / position moyenne 5,8 / CTR 5,9%**. **Seules 3 pages reçoivent des impressions** (accueil 165, /amaryllis 166, le reste ~0) → les 47 guides + 5 landings sont indexés mais **invisibles**. ~65% des requêtes = marque. Seul générique qui décolle : « location sainte luce martinique » (11 impr). **CONCLUSION : le SEO technique est déjà bon ; le goulot = AUTORITÉ DE DOMAINE (backlinks/citations/GBP), PAS du contenu.** → EN + nouveau contenu = prématurés tant que l'autorité ne monte pas.
- **Vérif état SEO technique = TOUT déjà en place** (l'audit Explore initial était FAUX, lu sur les sources au lieu du live) : sitemap 63 URLs (POI inclus), JSON-LD Article+Breadcrumb+FAQPage sur destinations ET POI, maillage landings fait. Rien à reconstruire.
- **Page `/nos-partenaires`** : enrichie (5 liens sortants distilleries **vérifiés par recherche web** : La Mauny 1ère car la + proche, Trois-Rivières, Clément, Depaz, Neisson) + **désorphelinée** (lien header site-wide). Bug contraste hero corrigé (titre navy invisible → scopé `.pt-hero`). 3 déploiements.
- **Kits off-page préparés** (agents traffic-manager/commercial/seo) : `plan-execution-semaine1`, `emails-prospection-institutionnels` (6 emails, recipients trouvés : web@martiniquetourisme.com, bienvenue@mairie-sainte-luce.fr ; OT = tél 0596625353), `press-kit`. ⚠️ Emails corrigés : logements **pas encore déclarés ni classés** → retirer toute mention déclaration/classement.
- **Plan déclaration/classement MAJ** (agent juriste, sur l'existant `docs/legal/plan-action-declarations.md`) : 6 meublés (Iguana exclue=bail long), loi Le Meur, classement Atout France, micro-BIC. ⚠️ Spécificités légales à CONFIRMER (mairie/expert-comptable).
- **Top 5 exécuté en partie (pilotage navigateur, Vincent fait comptes/clics)** : ✅ **Post GBP « Studio Mabouya » PUBLIÉ** sur fiche Résidence (carrousel 4 photos exportées en JPEG dans ~/Downloads). ⏸️ Bing : import a pris la fiche *patrimoine* par erreur (Amaryllis sous le MÊME compte vinsmaf@gmail.com → reprenable). ⏸️ Apple Business Connect : produit séparé de Business Manager, URL rebondit → à faire via iPhone Plans. 📧 3 emails prêts (Vincent envoie). ⬜ PagesJaunes/Petit Futé (Vincent).

**Commits** : analytics→partenaires→fix contraste + docs marketing/legal + mémoire. **À suivre** : Vincent exécute citations + envoie emails ; reprendre Bing/Apple ; contrôle C1 Ads.

## 2026-06-04 (4) — Dashboard Analytics business (data-049) déployé
**1 déploiement prod. Onglet `/admin` Analytics enrichi de KPIs business.**

- **Backend `functions/api/analytics.js`** : 3 rapports GA4 ajoutés au `Promise.all`, chacun isolé via nouveau wrapper **`runReportSafe`** (try/catch → `null` si échec, `parseReport(null)=[]` → une carte vide ne casse jamais le reste du dashboard) :
  - `revenue` — `totalRevenue` 30j (€).
  - `byBien` — `customEvent:bien_id` × {eventCount, totalRevenue}, filtre `eventName=purchase`.
  - `byChannel` — `sessionDefaultChannelGroup` × {sessions, ecommercePurchases, totalRevenue}.
- **Front `src/tabs/AnalyticsTab.jsx`** : import `getBien`, 3 sections style sombre — KPIs (Revenu 30j · Panier moyen · Taux de conversion) ; tableau **par bien** (barres, fallback « 24-48h » si dim pas propagée) ; tableau **par canal** (canal/sessions/résas/revenu = lecture ROI pub). Accès `data.revenue[0]` blindé (`&&`).
- **Vérif live `/api/analytics`** : `byChannel` ✅ 6 canaux (dont **Paid Search 1** = 1ʳᵉ session Google Ads) ; `revenue`/`byBien` vides = **0 purchase sur 30j** (funnel 240 view_item → 16 begin_checkout → **0 purchase**). Déploiement sain (tests/build/smoke OK, audit invariants 🟢).
- **⚠️ Signal à creuser** : 16 begin_checkout mais 0 purchase trackés sur 30j → soit aucune résa directe ce mois, soit trou de tracking `purchase` côté confirmation Stripe (`/merci`). À vérifier si Vincent a eu des résas directes. (→ BLOCKERS)
- Revue de code a flaggé « gestion d'erreur insuffisante » dans analytics.js = **faux positif** (`runReportSafe` blinde justement chaque rapport).

**Commits** : `feat(analytics): dashboard business`. **À suivre** : trou purchase/Stripe ; byBien se peuple sous 24-48h.

## 2026-06-04 (3) — Lancement acquisition (Google Ads LIVE) + étanchéité tracking + CI verte
**Commits `347f4b3` → `21ceab3`. 1 déploiement prod (fix consentement) — le reste docs/config/CI/GA4.**

- **Google Ads LANCÉ** (pilotage navigateur, Vincent fait les clics money) :
  - **C1 « Offre Groupe Sainte-Luce »** (campaignId 23904365229) : Recherche seule, 8 €/j, CPC max 0,80 €, France/FR, landing `/location-groupe-sainte-luce`, 13 mots-clés, RSA 7 titres/3 desc.
  - **C2 « Brand »** (campaignId 23913930124) : 2 €/j, CPC max 0,40 € (~0,11 € réel), landing `/`, 7 mots-clés marque, 6 titres/2 desc.
  - **Liste « Négatifs globaux Amaryllis » (120 mots)** créée + appliquée aux 2 campagnes. Conversion GA4 `purchase` = Principale (déjà importée le 02/06).
- **Pré-flight vérifié (audit code + live)** : tunnel résa 🟢 (Stripe LIVE, gestion d'erreur robuste, idempotent, /merci+purchase, testé) ; landings 🟢 ; **GA4 🟡→🟢 après fix**.
- **🔴→🟢 Fix consentement déployé** (commit consent) : 2 bannières cookies coexistaient ; l'inline PublicSite n'accordait qu'`analytics_storage` → conversions Google Ads perdues. Bannière inline neutralisée (globale fait foi) + `index.html` restaure les 4 signaux. **Vérifié LIVE** : 1 seule bannière, `ad_storage=granted` après accept, Meta Pixel charge.
- **2 dimensions GA4 créées** (pilotage) : `bien_id` + `niveau_tarifaire` (Événement, propriété amaryllis p538182418).
- **CI GitHub réparée** : échouait depuis qu'on pousse souvent — `wrangler ≥4.94` exige **Node ≥22**, CI était en Node 20 (étape Build Functions). Fix `node-version: "22"` → run vert. N'a jamais impacté la prod. (LEARNINGS + technique de lecture du log CI via navigateur.)
- **ADR-011 rédigé** (matin) : éliminer le drift des miroirs GAS/Worker (hybride import Worker + codegen GAS + test parité) — *Proposé*, pas implémenté.
- **Meta Ads reporté** : bon compte = « Amaryllis corp » act 853205825762332 (paiement à finaliser) ; DIMA 308 restreint ; clics bloqués sur adsmanager → mode guidé. Détails BLOCKERS.

**Décisions** → ADR-011 (specs). **Fixes** → consent (prod), CI node22. **À suivre** : Meta (guidé, après paiement), Resend domaine, surveiller search terms C1 sous 2-3 j.

## 2026-06-04 (2) — Système mémoire complet + audit + synchro inter-projets
**Commits `de21941` → `949bf6b` (locatif) + `6e218bc` (patrimoine, charte). Doc/config/mémoire only — AUCUN déploiement.**

- **Auditeur** : skill `/auditeur` (audit riche, verdict 🟢 PASS) + `scripts/audit-invariants.mjs` déterministe greffé **non bloquant** au deploy (post-smoke) → `docs/_audits/`. ADR-S-003.
- **Rappel mémoire mécanisé** : hook **SessionStart** (`.claude/settings.json` + `scripts/session-context.mjs`) injecte CONTEXT + rappels + nudge consolidation. Niveau 2 passé de convention à mécanisme. ADR-S-004. ⚠️ activer via `/hooks`/redémarrage la 1ʳᵉ fois.
- **Consolidation** : skill `/consolidation` (jardinage) + cron `/schedule` hebdo (BLOQUÉ backend) + filet nudge >7j (`.last-consolidation`). ADR-S-005.
- **Synchro inter-projets** : charte commune `docs/OPERATING-MODEL.md` (identique locatif ↔ patrimoine) ; `.memory/` aligné au standard 8 fichiers (RECALL.md + DECISIONS.md adoptés de patrimoine). ADR-S-006. Ports répartis : chacun fait les siens ; chantier commun = drift miroirs (locatif conçoit, partage).
- **Mémoire = 3 niveaux étanches + 4 rituels.** Findings : doc « 557 erreurs eslint » périmée (lint=0 aujourd'hui).

**À suivre prochaine session** : (1) confirmer injection hook SessionStart ; (2) recréer cron `/consolidation` ; (3) **lancement Google Ads + Meta Ads** (runbook, Vincent aux commandes).

## 2026-06-04 — Audit + cleanup gouvernance/architecture
**Commit `347f4b3` poussé sur origin/main (docs-only, aucun déploiement).**

- **Audit gouvernance** : constitution (CLAUDE.md), agents/skills, fichiers mémoire (ADR, learnings, blockers, iterations log, contexte + indexation). Verdict : gouvernance mature mais CLAUDE.md périmé, PROJECT_MEMORY trop gros, pas d'index in-repo, ADR non formalisés.
- **CLAUDE.md actualisé** : corrigé le faux « There are no tests » → suite vitest ~148 tests + gate deploy + CI ; nouvelle section « Source unique des biens & filet qualité » (biens.js, pattern miroir GAS/Worker, coherence-check, occupation→RM, Meta Pixel/CSP) ; footgun #1 corrigé (plus de prix codés en dur dans [slug].js/prerender).
- **`docs/INDEX.md`** créé (carte d'indexation ~47 docs + fichiers racine).
- **`docs/superpowers/specs/README.md`** créé (index ADR : 10 décisions ADR-001→010, statut + plan lié).
- **`PROJECT_MEMORY.md` dégraissé** 52KB→35KB ; journal historique extrait → `docs/_archive/PROJECT_MEMORY-journal-2026-05.md`.
- **Rituel de clôture** : skill `/cloture-session` (déjà existante) exécutée → création du système **`.memory/`** (INDEX/CONTEXT/ADR/LEARNINGS/BLOCKERS/ITERATIONS_LOG), calqué sur patrimoine-dashboard.

**Décisions** → ADR-S-001 (rituel = skill + `.memory/`), ADR-S-002 (gouvernance doc). **Frictions notées** : drift pattern miroir, doublons docs GBP/Ads à archiver, lint hors CI.

**À suivre** : lancement Google Ads + Meta Ads pas-à-pas (demain matin, Vincent aux commandes).

## 2026-06-07 — Session Pub/Ads + iCal exports + Attribution tracking

**Ce qui a été fait :**
- Optimisation budgets publicitaires : €25/j → €18/j (Meta C1 €5→€3/j×3, Google C1 €8→€5/j)
- Lancement Meta C2 MOFU : audience custom "visiteurs 30j" créée + ad set B1 publié (€2/j)
- Correction 2 erreurs Meta (destination URL manquante C2, "New Traffic Ad" orphelin supprimé)
- Implémentation iCal export RFC 5545 pour sync automatique Airbnb/Booking (7 biens)
- Module trackingAttribution.js : capture UTM/fbclid/gclid → Stripe metadata first-click

**Pourquoi :**
- Aligner le budget pub au ROI réel vs commissions (€779/mois) — éviter margin squeeze
- Retargeting MOFU pour convertir les visiteurs récents du site en réservations directes
- iCal sync pour éviter les doubles réservations quand une résa directe est prise

**Commits clés :**
- `2f4d6da` — feat(pub): iCal export endpoints + tracking attribution + budgets ads optimisés (12 fichiers, 489 insertions)

**État deploy :** 🟢 PASS (audit invariants OK) · 4 points code review en inbox bugs (1 haute, 1 moyenne, 2 basses)

## 2026-06-07 (soir) — Messagerie admin niveau 1 déployée

**Ce qui a été fait :**
- Helper `_sendEmail.js` (envoi Resend + log D1 best-effort) avec 5 tests vitest verts
- Endpoint `/api/emails-log` (auth Bearer admin OU `?secret=POSTSTAY_SECRET`)
- Table D1 `emails_log` (migrations/0001) avec 17 colonnes + 3 index
- Refactor 4 endpoints client critiques :
  - `notify-booking.js` (alerte hôte) → `category: "internal"`, `template: "notify_booking_host"`
  - `stripe-webhook.js` (confirmation client + 4 autres flows) → `category: "client"` ou `"internal"` selon le destinataire
  - `send-guest-email.js` (couvre prearrivee + poststay côté voyageur via paramètre `template`) → `category: "client"`
  - `send-poststay.js` (fetch direct restant) → `category: "client"`, `template: "poststay_voyageur"`
- UI : onglet "📧 Messagerie" + `EmailDrawer` (iframe sandboxed) + `ResaEmailList` intégré dans la modale d'édition résa Planning (bookingId=`reservation_code`, email=`form.email`)

**Pourquoi :** traçabilité complète de la relation client par email. Base pour le niveau 2 (boîte 2 voies IMAP/inbound) plus tard. Webhook Resend opens/clicks dans le backlog (colonnes `opened_at`/`clicked_at`/`bounced_at` déjà prêtes).

**Garde-fous validés (leçons crash Tarifs) :**
- Migration D1 AVANT refactor (pas d'INSERT failures)
- Test runtime obligatoire via preview MCP avant deploy — onglet Messagerie + onglet Planning testés OK
- Aucune opération top-level sur imports App.jsx
- `vitest.config.js` étendu pour inclure `functions/api/*.test.js`

**Tests :** 166/166 vitest verts (5 nouveaux + 161 existants) · Build OK · Audit invariants 🟢 PASS · Code review LLM : 0 bug détecté.

**Commits :** 220fd6b (D1), 13f42d3 (helper), 3a86979 (endpoint), 84c7c92 (refactor 4), c660830 (UI), 145b6a7 (Planning).

**Bundle live :** `index-B_oPTYj1.js` sur https://villamaryllis.com/admin

**Vérification live :** endpoint répond 401 sans auth, table emails_log vide (0 lignes — attend les premiers envois post-deploy). Les prochains emails envoyés (post-séjour J+1, pré-arrivée J-3, confirmation Stripe, alerte notify-booking) seront tracés automatiquement.

**Hors scope futur :** 11 autres endpoints (vague 2 : contact, sign-contract, alertes internes, Worker iCal) + webhook Resend opens/clicks.

## 2026-06-07 (suite soir) — Messagerie Feature A déployée — Compositeur + codes promo

**Ce qui a été fait (8 tâches) :**
- Table D1 `promo_codes` (10 colonnes + 2 index) — migrations/0002
- Helper `_sanitizeHtml.js` + 5 tests vitest (strip script/onXXX/javascript:)
- Endpoint `/api/promo-codes` — POST génère code unique (PREFIX-RANDOM, re-roll si collision), GET liste actifs
- Endpoint `/api/send-custom-email` — envoi via helper `sendEmail`, rate limit 20/h/IP, sanitize HTML, log auto D1 avec `template="manual_custom|promo:CODE"` pour traçage
- 4 templates HTML dans `public/email-templates/` : `manual-decouverte`, `manual-relance`, `manual-question` + snippet réutilisable `_promo-block` (style Amaryllis navy/coral/ivory)
- UI `EmailComposer.jsx` (modal plein écran avec form 2 colonnes + aperçu iframe sandbox temps réel)
- UI `PromoCodeModal.jsx` (mini modal génération code)
- Boutons "✉ Nouveau mail" dans MessagerieTab + EmailDrawer + ResaEmailList (Planning)
- Refresh auto Messagerie via event `amaryllis_emails_log_updated`

**Tests :** 171/171 vitest verts (166 + 5 nouveaux) · Build OK · Audit invariants 🟢 PASS

**Garde-fous respectés (leçons crash Tarifs) :**
- Migration D1 AVANT endpoint qui écrit dedans
- Test runtime via preview MCP avant deploy — composer ouvert, templates chargés, modal promo s'ouvre, 0 erreur console
- Aucune opération top-level sur imports App.jsx
- iframe sandbox pour preview (jamais dangerouslySetInnerHTML)
- Auth Bearer admin sur tous les endpoints + secret POSTSTAY en fallback
- Rate limit 20/h/IP via `_ratelimit.js`

**Vérification live :**
- `/api/promo-codes` sans auth → 401 ✓
- `/api/promo-codes` POST avec secret → code généré `TEST-BDXU` (-10% Mabouya, 14 jours)
- `/api/send-custom-email` sans auth → 401 ✓
- Code test nettoyé proprement

**Commits :** 3a3878e (D1), 5e3ef0d (sanitizer), 2034482 (promo-codes), bd9f9fb (send-custom-email), 25be915 (templates), 0734135 (UI composer+promo), f658f3e (boutons)

**Prochaines features (backlog) :**
- B — Auto relances paniers abandonnés (réutilise send-custom-email + promo-codes + templates)
- C — Envoi en masse / segmentation
- D — Tracking conversion (incrémente `used_count` au checkout quand code utilisé)

## 2026-06-07 (soir) — Incident chunk périmé v2 résolu + journalisation

**Symptôme** : site public cassé pour visiteurs avec vieux index.html en cache (erreurs Sentry + D1 : "Failed to fetch dynamically imported module", "is not a valid JavaScript MIME type", "TypeError e._result.default undefined"). Affecte iOS Safari/Chrome notamment.

**Cause** : règle `_redirects` `/* /index.html 200` applique le SPA fallback sur `/assets/*.js` périmés → CF renvoie HTML avec content-type `text/html` au lieu d'un vrai 404 → erreur module silencieuse, filet `vite:preloadError` ne déclenche pas le reload.

**Fix infra** (commit `524fb3d`) :
- `functions/assets/[[asset]].js` : Pages Function catch-all qui force un vrai 404 + `x-stale-chunk: 1` sur les extensions JS/CSS/etc. servies en HTML.
- `src/main.jsx` : regex `STALE_CHUNK_PATTERNS` étendue (8 patterns) + monkey-patch `console.error` pour Safari.

**Renforcement smoke test deploy** (commit suivant) :
- `scripts/deploy-pages.sh` teste un sentinel `/assets/__sentinel-stale-{ts}.js` → doit renvoyer HTTP 404. Si on perd la Pages Function lors d'un refactor futur, le deploy fail.

**Documentation** :
- `docs/ERREURS-LOG.md` entrée détaillée (référencée dans CLAUDE.md, à lire en début de session).
- `.memory/LEARNINGS.md` règle "SPA fallback toxique sur /assets/*" + reflex diagnostic "is not a valid MIME type".
- `.memory/BLOCKERS.md` ✅ résolu, garde-fou smoke test en place.

**Suite** : reprendre le bug compositeur email (sujet pas pré-rempli + écran blanc aperçu).
