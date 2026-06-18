# ADR — Décisions structurantes (locatif-dashboard)

> 1 entrée par décision qui engage la suite. Format 5 lignes : **Choix · Alternatives refusées · Conséquences attendues · Périmètre · Statut**.
> Décisions d'archi détaillées (specs complets) → `../docs/superpowers/specs/README.md` (ADR-001→010). Ici = log curaté de session.

---

## ADR-CAUTION-CARDONLY-001 · 2026-06-17 · Caution = carte uniquement (pas de Link)
1. **Choix** : forcer `payment_method_types:['card']` (retrait de `automatic_payment_methods`) sur les 2 flux de caution — `create-deposit-intent.js` (inline) + `caution-checkout.js` (lien admin). Le **paiement du séjour garde Link** (décision Vincent : conversion > cohérence).
2. **Alternatives refusées** : (a) tenter de masquer les messages d'erreur côté front — impossible, ils sont rendus dans l'iframe Stripe (Payment Element), pas dans notre code (grep = 0) ; (b) passer AUSSI le séjour en card-only — refusé par Vincent (Link = checkout plus rapide = conversion) ; (c) supprimer l'étape caution inline — trop gros, l'admin a déjà le lien de secours.
3. **Conséquences attendues** : sur la caution, Stripe Link ne peut plus réafficher une carte enregistrée déjà refusée (cause de l'écran anxiogène de la résa Antoine FENAERT). Caution réussie = écran propre ; carte réellement refusée = message Stripe correct MAIS géré (bloc rassurant + bouton Finaliser + alerte hôte `caution-skipped`). Prouvé en prod : PI test → `payment_method_types:["card"]`.
4. **Périmètre** : `functions/api/create-deposit-intent.js`, `functions/api/caution-checkout.js`, `src/PublicSite.jsx` (handleDeposit + bloc rassurant + alerte + stockage voyageur/email), `src/Merci.jsx` (même UX, retrait `errStyle` orphelin).
5. **Statut** : ✅ acté & déployé 2026-06-17. 285 tests, smoke OK, audit 🟢.

## ADR-JOEL-OVERLAP-001 · 2026-06-17 · Fix chevauchement bail Joël BAILLEUL (Iguana Ligne 1)
1. **Choix** : raccourcir la **Ligne 1** (Rentila 31/10/2024 → 19/12/2024) pour qu'elle se termine le **03/11/2024** (la veille du 1er virement bancaire : 04/11/2024). Résultat : 3 nuits, 3 400€, zéro chevauchement avec Ligne 2 (19/11/2024 → 31/10/2025). Gap de 16 jours (04→18 nov) = période de transition / prise de possession avant le bail formel.
2. **Alternatives refusées** : (a) raccourcir Ligne 1 jusqu'au 18/11 (veille Ligne 2) — écarté, artificiel (ne reflète pas la réalité bancaire) ; (b) supprimer Ligne 1 — écarté, la prise de possession d'octobre est réelle ; (c) laisser le chevauchement en l'état — écarté, comptait 30 nuits en double dans les stats.
3. **Conséquences attendues** : Sheet Iguana sans double-compte sur nov-déc 2024. **Méthode retenue : le 1er virement bancaire = date de démarrage réel du bail** (plus fiable que les dates Rentila qui couvrent la prise de possession).
4. **Périmètre** : ID `direct-iguana-2024-10-31` · Sheet « Toutes les Réservations » · GAS `importAllReservations_` (delete + re-import).
5. **Statut** : ✅ acté & exécuté 2026-06-17. Confirmation GAS : `updated:1`.

## ADR-IMPORT-DIRECTES-001 · 2026-06-17 · Import résas directes 2022→2026 via Rentila XLSX
1. **Choix** : importer **~56 résas directes** (6 biens Martinique) via 6 fichiers Rentila XLSX → TSV propre → GAS `importAllReservations` en GET chunké. Bails longs termes (Joël BAILLEUL Iguana 3 lignes, Société MAUI ENTERTAINMENT Zandoli) importés comme `canal:direct`. **Protection overlap** : pull du Sheet avant chaque bien → filtre `checkin|checkout` par bienId → jamais re-importer une résa 2025-2026 déjà en base (preserve contact data Stripe).
2. **Alternatives refusées** : (a) coller en TSV dans Google Sheets → conversion date −1j (déjà vécu sur Booking) ; (b) importer les bails longs comme canal séparé — trop compliqué, Vincent a choisi `direct`.
3. **Conséquences attendues** : Sheet = **~700 résas 2022-2027** (Booking ~370, Airbnb ~284, direct ~56). CA direct 2022→2024 enfin visible dans ConversionTab. ⚠️ Les **bails longs termes gonflent le CA direct et distordent l'ADR/nuitée** des biens concernés (Iguana Joël: ~46 k€/an, Zandoli MAUI: 19 620€). Interpréter les métriques `direct` Iguana/Zandoli avec précaution. **Nogent directes** : non fournies (Nogent = Beds24 → déjà synced).
4. **Périmètre** : `scripts/direct-historique.tsv` · Sheet « Toutes les Réservations ». GAS non modifié (même action `importAllReservations_`).
5. **Statut** : ✅ acté & exécuté 2026-06-17. Total validé ~700 résas.

## ADR-IMPORT-OTA-001 · 2026-06-17 · Import de tout l'historique OTA (Booking + Airbnb) dans le Sheet
1. **Choix** : importer l'historique complet 2022-2026 — **Booking 355** (12 PDF vue groupe) + **Airbnb 281** sur **2 comptes hôte** (compte 1 Amaryllis+Nogent = 176 ; compte 2 Céline Hartog/5 villas Martinique = 105) — via pré-transformation en **TSV propre** puis action GAS `importAllReservations` en **GET chunké direct vers la web app**. IDs : `booking-BK-<bien>-<date>` (synthétiques, la vue groupe Booking n'expose aucun code) · `airbnb-<code>` (vrais codes de confirmation). Montants : Booking = paiement total brut guest ; Airbnb = colonne « Revenus bruts » (host).
2. **Alternatives refusées** : (a) `/api/sheets-proxy` POST → **403 Cloudflare WAF** (urllib bloqué) ; (b) onglet « Import Airbnb » + `importFromAirbnb` GET → **`buildColMap_` ne mappe pas le CSV brut Airbnb** (entêtes « Date de début/fin » ≠ alias, nom d'annonce Nogent/Schœlcher ne contient pas le bienId) ; (c) IDs Booking via n° de résa → indisponibles en vue groupe.
3. **Conséquences** : Sheet « Toutes les Réservations » = **664 résas 2022-2027** (Booking 370, Airbnb 284, direct 8). ConversionTab affiche enfin du multi-années réel + base historique exploitable (RM/analyse). ⚠️ **Montant Airbnb (brut host) ≠ Booking (total guest)** → ~15% d'écart de base, comparaison CA **inter-canal** imparfaite (intra-canal/ADR/saisonnalité = fiables).
4. **Périmètre** : `scripts/booking-historique.tsv`, `scripts/airbnb-historique.tsv`, `appscript/SCRIPT_SHEETS.js` (action `importFromBooking` déployée clasp **@43**), Sheet « Toutes les Réservations ».
5. **Statut** : ✅ acté & exécuté 2026-06-17. **Reste : résas DIRECTES 2022→aujourd'hui** (Vincent doit les fournir — seules 8 en base).

## ADR-SECURITY-META-001 · 2026-06-17 · Gestion incident piratage compte pub Meta
1. **Choix** : nettoyage manuel direct (supprimer les campagnes frauduleuses + page H U), NE PAS toucher C1 légitime, NE PAS créer de nouvelle campagne C2 en urgence, laisser Meta bloquer le portfolio pirate.
2. **Alternatives refusées** : (a) supprimer TOUT le compte pub — écarté (C1 TOFU Découverte juin est légitime et en cours) ; (b) recréer C2 d'urgence — écarté (trop de risque d'erreur sous pression, à faire à froid) ; (c) tenter de supprimer le portfolio `282577832488612` — impossible, Meta bloque pendant enquête interne.
3. **Conséquences attendues** : C2 MOFU Retargeting est à recréer de zéro avec des visuels Amaryllis légitimes. Portfolio pirate `282577832488612` reste figé/bloqué chez Meta (inoffensif). 2FA à finaliser impérativement pour éviter la récidive.
4. **Périmètre** : Ads Manager `act=853205825762332` · Business Portfolio `609408700286001` (légitime, intact) · Portfolio pirate `282577832488612` (bloqué Meta, vide).
5. **Statut** : acté 2026-06-17. Actions restantes : 2FA (Vincent) + recréer C2 MOFU + contacter Meta Support pour remboursement dépenses frauduleuses.

## ADR-WHATSAPP-001 · 2026-06-17 · Architecture 3 apps Meta pour WhatsApp Business
1. **Choix** : 3e app Meta dédiée "Amaryllis Conciergerie" (ID `1783600126154478`) pour WhatsApp Cloud API — les 2 apps existantes (App 1 Ads + App 2 Instagram) sont incompatibles avec WhatsApp API. Aucune des 3 n'est supprimée.
2. **Alternatives refusées** : (a) ajouter WhatsApp à App 1 (Ads) — impossible, verrouillée sur use-case Marketing ; (b) ajouter à App 2 (Instagram classic) — galerie produits n'offre pas WhatsApp ; (c) supprimer une app existante — écarté (casse les ads + social publishing).
3. **Conséquences** : bot WhatsApp live en test mode (test number `+1 555 006 0804`, recipient `+33 6 10 88 07 72`). Pour la prod : Business Verification → App Review → vrai numéro → token permanent (60j actuellement). Webhook `villamaryllis.com/api/whatsapp` déjà vérifié.
4. **Périmètre** : `functions/api/whatsapp.js` (code existant, non modifié) · secrets CF Pages (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`).
5. **Statut** : acté, test live validé par Vincent.

## ADR-PREMORTEM-001 · 2026-06-18 · Pré-mortem Gary Klein — 3 risques critiques retenus
1. **Choix** : suite au pré-mortem (horizon 2029), 3 risques critiques actés avec mesures : (1) **CAC tracker** → bloc "résas directes 30j" ajouté au rapport hebdo Worker (🟢/🟡/🔴, seuil ≥3/mois) ; (2) **Éparpillement** → AGENDA mensuel "vidage backlog actions Vincent" ; (3) **Fiscal DAC7** → deadline 30/06 ajoutée AGENDA. 2 risques secondaires planifiés : bus factor (20/07) + assurance cyclone (20/07).
2. **Alternatives refusées** : (a) ignorer le pré-mortem comme exercice théorique — écarté, 3 items directement actionnables trouvés ; (b) tout coder en une session — écarté, les mesures humaines (fiscal, assurance) ne se codent pas.
3. **Conséquences attendues** : le rapport hebdo lundi montre désormais le ratio direct en tête d'email (couleur selon seuil). Si 🔴 plusieurs semaines = signal d'alarme pour couper les pubs et retravailler le funnel.
4. **Périmètre** : `workers/ical-sync/index.js` (`runWeeklyReport` + requête D1 `direct_bookings`) · `~/.claude/memory/AGENDA.md` (4 items ajoutés).
5. **Statut** : ✅ acté 2026-06-18. Worker à redéployer.

## ADR-PRICING-SOT-001 · 2026-06-16 · Source de vérité unique du pricing = calcDateReco (suppression moteurs morts)
1. **Choix** : SUPPRIMER `src/lib/pricingEngine.js` + `src/lib/minStayEngine.js` (RM-03). Vérifié 0 import en prod (Functions/src/Worker). Le seul moteur de pricing = `calcDateReco` dans `functions/api/rm-recommendations/[[path]].js`. Décision de Vincent (supprimer plutôt que promouvoir).
2. **Alternatives refusées** : (a) promouvoir les libs comme moteur unique et retirer calcDateReco — refusé (le live tourne déjà, plus risqué) ; (b) les garder « au cas où » — refusé, ce sont des doublons à logique DIVERGENTE = footgun (RM-04 voulait justement câbler `findGaps` de minStayEngine, on aurait codé dans le mauvais moteur).
3. **Conséquences** : RM-01 (scarcity par capacité), RM-02 (filtre saison sur règles lead-time, nécessite re-seed), RM-04 (gap orphelin 1 nuit + min-stay) doivent être implémentés **directement dans calcDateReco**, jamais dans des libs séparées. RM advisory only (Vincent valide les prix).
4. **Périmètre** : `src/lib/pricingEngine.js` (supprimé) · `src/lib/minStayEngine.js` (supprimé) · moteur vivant `functions/api/rm-recommendations/[[path]].js`. Commit `2563378`.
5. **Statut** : ✅ acté & déployé `efa6e259`. 285 tests verts.

## ADR-GUIDE-WRITE-001 · 2026-06-15 (nuit) · Auto-rédaction guides voyageurs D1 — mode live + cron hebdo
1. **Choix** : activer l'auto-rédaction des guides voyageurs en **mode live** (`GUIDE_WRITE_MODE=live`, secret CF Pages) et brancher `runGuideWrite(env)` sur le cron Worker lundi 6h UTC (`0 6 * * 1`). L'IA réécrit UNIQUEMENT `welcome_message` + `tagline` (prose pure) — les champs critiques (wifi/code/horaires/contacts) sont intouchables. Fact-check bien-aware bloquant avant toute écriture. Biens validés en dry-run : Amaryllis ✅, Nogent ✅, Mabouya ❌ (piscine → escalade ntfy, jamais appliqué).
2. **Alternatives refusées** : (a) mode shadow indéfini — écarté, le dry-run en fonctionnait bien et le fait-check est robuste ; (b) cron quotidien — trop fréquent pour des textes d'accueil (les biens ne changent pas chaque jour) ; (c) déclenchement manuel seul — écarté, Vincent veut de l'automatisation.
3. **Conséquences attendues** : chaque lundi, les guides de 7 biens tentent une réécriture de leur prose d'accueil (welcome_message + tagline). Les biens avec un guide en D1 sont améliorés silencieusement (ntfy `✅ low`) ; ceux dont le LLM hallucine sont escaladés (ntfy `📝 default`). Kill-switch : `GUIDE_WRITE_DISABLED=1` en secret CF Pages. Irréversibilité faible : les textes anciens peuvent être restaurés depuis git (guides statiques dans `public/guides/`).
4. **Périmètre** : `functions/api/guide-write.js` · `functions/api/_guideWriter.js` · `workers/ical-sync/index.js` (`runGuideWrite` + cron lundi) · secret CF Pages `GUIDE_WRITE_MODE=live`. Commit `7072da4`.
5. **Statut** : ✅ déployé 2026-06-15 nuit. Premier passage automatique : **lundi 22 juin 2026, 6h UTC**. À surveiller.

## ADR-BACKLOG-AUTO-001 · 2026-06-15 (soir) · Protection du critique au triage du backlog agents (charte graphique + paiement)
1. **Choix** : avant d'auto-exécuter le backlog des agents, sécuriser le critique. Le paiement était déjà `blocked` (`_triage.js` : catégories revenue/ads/legal + mots prix/stripe/paiement/caution/budget). Ajout de la **charte graphique** comme critique (Vincent 2026-06-15) : tokens globaux + refonte/structure de page + composants partagés → `blocked` (mots `tokens.css`/`palette`/`typographie`/`logo`/`primitives`/`refonte`/`redesign`/`design system`… + catégorie `design`). Biais assumé vers le blocage (faux positif = escalade inoffensive). Endpoint `agents-actions?action=retriage` recalcule `risk` de tout le backlog.
2. **Alternatives refusées** : (a) bloquer toute la catégorie `ux` — non, Vincent veut autoriser les features fonctionnelles (filtres, zoom galerie), seul le VISUEL structurel est critique ; (b) auto-exécuter naïvement tout ce qui est `risk='auto'` — REFUSÉ : le backlog est hétérogène, beaucoup d'actions « auto » (content/seo ≤2h) sont en fait physiques (shooting photo) ou humaines (créer un compte Apple Plans) → inexécutables mécaniquement ; (c) niveau d'autonomie « applique tout le code via déploiement auto » — écarté (risque de casser le site).
3. **Conséquences attendues** : backlog actif re-classé → 10 blocked / 18 auto / 65 review (global 489 actions : 80 blocked / 79 auto / 330 review). Le critique (paiement + charte) ne peut JAMAIS être auto-traité. **Reste à construire** : le moteur d'auto-traitement CONSERVATEUR (ne traite que les types réellement exécutables : posts [déjà via gate auto-pub], guides D1, emails, meta) — l'`agents-execute` actuel ne fait que meta-seo. Niveau d'autonomie retenu = « applique le sûr (data-only) + prépare le reste prêt-à-valider + escalade le critique ».
4. **Périmètre** : `functions/api/_triage.js` (DESIGN_CRITICAL_KEYWORDS + catégorie design, 12 tests `_triage.test.js`) · `agents-actions.js` (action `retriage`) · `src/__tests__/triage.test.js` (MAJ).
5. **Statut** : ✅ socle livré & déployé 2026-06-15. Moteur d'auto-traitement = à construire (prochaine étape).

## ADR-SOCIAL-AUTOPUB-001 · 2026-06-15 (soir) · Auto-publication réseaux SANS validation humaine (gate de qualité)
1. **Choix** : remplacer le clic « Approuver » humain par un **gate de qualité automatique**. Un post FB/IG part seul SI 4 filtres cumulatifs passent : (1) fact-check = 0 erreur (mots interdits/faits faux, BLOQUANT), (2) photo ∈ whitelist Vincent, (3) score LLM-juge ≥ 85 + verdict approve, (4) forme (channels=[ig,fb], anti-doublon 7j). Sinon → escalade ntfy. Passé en **mode live** (var CF `EDITORIAL_GATE_MODE=live`) à la demande de Vincent.
2. **Alternatives refusées** : (a) phase shadow d'abord (recommandée mais Vincent a voulu le live direct) ; (b) publier tous les drafts approuvés tels quels — refusé car certains pré-gate contenaient des erreurs factuelles (« Quatre suites » pour Amaryllis=3ch) ; (c) gate sans whitelist photo — Vincent veut choisir « les plus belles » lui-même.
3. **Conséquences attendues** : publication 100% autonome (re-seed→génère sur photos cochées→gate→publie), zéro clic. **Défense en profondeur** : le fact-check est AUSSI appliqué en bloquant au moment de la publication (`agent-drafts` executeDraft) → même un post approuvé à la main ne part pas s'il est faux. Irréversibilité = posts publics réels. Kill-switch : `EDITORIAL_GATE_DISABLED=1` ou retour shadow. **Token Meta publie bien FB+IG** (vérifié en prod, post Bellevue 102).
4. **Périmètre** : `functions/api/_editorialGate.js` (moteur pur, 20 tests) · `editorial-gate.js` (orchestrateur) · `editorial-photos.js` (whitelist D1) · `_factcheck.js` (okFor/onlyFor + strip hashtags) · `agent-drafts.js` (garde-fou publication) · `src/tabs/EditorialPhotosTab.jsx` (onglet sélection) · `scripts/photos-manifest.mjs` · Worker `runEditorialDraftGen` (pioche whitelist + appelle gate) + `runEditorialReseed`.
5. **Statut** : ✅ livré & déployé 2026-06-15, mode **live**. 258 tests. Vincent a coché 42 photos. À surveiller : seuil 85 (escalades), premiers posts auto (Géko 16/06).

## ADR-META-TOKEN-001 · 2026-06-15 · Token Meta permanent + diagnostic blocage FB feed
1. **Choix** : régénérer `META_PAGE_TOKEN` avec 20 permissions (incl. `pages_read_engagement`) via Graph API Explorer URL params → endpoint temporaire `meta-refresh-token.js` (supprimé post-usage) échange user token → page token permanent via `META_APP_SECRET` CF. Token mis à jour dans Cloudflare.
2. **Alternatives refusées** : mettre à jour le token manuellement dans le dashboard CF sans passer par le serveur → impossible : `META_APP_SECRET` non lisible depuis l'extérieur ; garder l'ancien token → expirait (session courte ~1h).
3. **Conséquences attendues** : `META_PAGE_TOKEN` = permanent (ne périme pas). IG `/media` lit OK. FB `/{pageId}/feed` toujours bloqué → nécessite App Review Advanced Access (Meta policy 2023). `/api/social-poll` : IG silencieusement OK (0 commentaires récents), FB renvoie `(#10)`.
4. **Périmètre** : `functions/api/meta-refresh-token.js` (créé + supprimé après usage) · `META_PAGE_TOKEN` dans CF Pages secrets (`dashboard-amaryllis`).
5. **Statut** : ✅ token OK. 🔴 FB feed bloqué jusqu'à App Review → voir BLOCKERS.

## ADR-TRACKING-001 · 2026-06-15 · Optimisation pub Meta/Google : dédup + match quality + anti double-comptage
1. **Choix** : audit adversarial 6 dimensions (50 findings confirmés) → correctifs tracking déployés. (a) **eventID=pi.id** sur les 3 `Purchase` Pixel inline (`PublicSite.jsx`) → dédup Pixel↔CAPI ; (b) **guard `kind=solde-2x`** dans le webhook → le prélèvement du solde 2× ne refait plus NI conversion NI alerte hôte NI `direct_booking` (3 fantômes supprimés) ; (c) **CAPI user_data enrichi** (fbc/fbp/tél/prénom/nom/external_id hachés SHA-256, `_metaCapi.js`) → EMQ ~15-40 %→~60-75 % ; (d) chaîne attribution `_fbp`/`_fbc` lus à chaud + gclid/fbclid → metadata Stripe (allowlist `create-payment-intent` élargie, elle jetait tout avant) → webhook → CAPI ; (e) `transaction_id`=pi.id (parité Nogent) ; (f) events Meta `Lead`, CSP googleads/googleadservices/td.doubleclick, CAPI v19→v21.
2. **Alternatives refusées** : `AddToCart`/`AddPaymentInfo` (redondants avec `InitiateCheckout` qui porte déjà la vraie valeur séjour) et `Search` (mauvais signal sur « voir le logement ») → écartés pour ne pas bruiter à ~5 visiteurs/j. Balise Google Ads directe `AW-` → différée (besoin que Vincent crée l'action conversion + me donne l'ID/label) ; aujourd'hui import GA4.
3. **Conséquences attendues** : fin du double-comptage Purchase Meta (ROAS cesse d'être gonflé ×2-3) → l'algo Meta optimise sur des vraies conversions ; attribution Meta fiabilisée à faible volume. **Cœur paiement INCHANGÉ** (prix, débit Stripe, confirmation Beds24, caution, acompte 2×) — seul ajout dans `create-payment-intent` = étiquettes metadata (n'affectent pas le débit).
4. **Périmètre** : `src/PublicSite.jsx`, `src/Merci.jsx`, `src/lib/trackingAttribution.js` (+test 4 cas), `functions/api/_metaCapi.js`, `functions/api/stripe-webhook.js`, `functions/api/create-payment-intent.js`, `public/_headers`. Commits `f5b1784`→`9a30660`.
5. **Statut** : ✅ livré & déployé 2026-06-15 (223 tests, audit 🟢, smoke OK, CSP live vérifié). **Dépend de 2 secrets CF Pages côté Vincent** (cf. BLOCKERS) — sinon CAPI/GA4-MP silencieux.

## ADR-BRAIN-003 · 2026-06-15 · « Armée commune » : spécialistes fiscaux des 2 cerveaux + cerveau fiscal partagé
1. **Choix** : Vincent veut « une seule armée d'agents agissant des 2 côtés ». Réponse pragmatique (runtime unique impossible) : **mêmes RÔLES de spécialistes des deux cerveaux + un contexte fiscal UNIFIÉ partagé**. (a) `~/.claude/memory/FISCAL.md` = cerveau fiscal cross-brain (statut LMP, échéances DGFiP/meublé tourisme/régime réel déc 2026, stratégie) ; (b) côté **locatif**, 4 spécialistes ajoutés à `agents-run` (`fiscaliste`, `controleur-fiscal`, `comptable`, `notaire-assurance`) grounded sur `FISCAL_CONTEXT` (miroir embarqué de FISCAL.md) → rejoignent auto le cron quotidien + boucles A/B ; (c) côté **patrimoine**, ces 4 rôles existent DÉJÀ (`agentsConfig.js`) → pollinisation pour qu'il les aligne sur FISCAL.md (je n'y déploie pas).
2. **Alternatives refusées** : (a) **runtime unique partagé** — impossible : règle absolue no-deploy patrimoine + 2 stacks/D1 séparés + CF Function ne peut pas importer cross-repo ; (b) **bridge HTTP cross-brain** — casse l'indépendance bicéphale, fragile ; (c) **scoper au seul locatif** — un fiscaliste aveugle au patrimoine est faux (Vincent = 1 contribuable, déclaration unique).
3. **Conséquences attendues** : le réseau locatif gagne la profondeur fiscale manquante (il n'avait que `juriste-compliance`). `FISCAL_CONTEXT` = **miroir** de FISCAL.md (comme miroirs GAS/Worker) → resync + redéploy si FISCAL.md change. +4 agents/jour (gratuits). **Advisory strict** — aucune déclaration/paiement auto.
4. **Périmètre** : `functions/api/agents-run.js` (AGENTS +4, TIERS, PROVIDER, FISCAL_AGENTS, FISCAL_CONTEXT, injection buildPrompt) · `~/.claude/memory/FISCAL.md` (NOUVEAU partagé) · `CROSS-LEARNINGS.md` (handoff patrimoine).
5. **Statut** : ✅ livré & déployé 2026-06-15 (locatif). Vérifié prod : 8 actions fiscales ancrées (meublé tourisme, amortissement LMP, seuil 23k, TVA para-hôtelier, DOM). **Action patrimoine (hors moi)** : aligner ses 4 spécialistes sur FISCAL.md.

## ADR-BRAIN-002 · 2026-06-15 · Autonomie réseau d'agents : 3 boucles (éval auto + bus + distillation)
1. **Choix** : 3 boucles greffées sur l'infra existante pour que le réseau de 23 agents s'améliore SEUL. **(A) Évaluateur auto** : `agents-eval.js` (qui dormait) appelé en cron quotidien ; sélectionne la **dernière sortie de CHAQUE agent** (1/agent, pas les 25 plus bavardes), la note 0-10, et sur score faible **réinjecte une consigne corrective** dans `agent_memory(eval_feedback)` (mise en exergue dans le prompt). **(B1) Bus inter-agents** : chaque agent émet un `signal` transverse (champ JSON optionnel) → `agent_memory('_shared','signal:<id>')` → lu par TOUS les autres au run suivant (section `📡 SIGNAUX` dans `buildPrompt`). **(B2) Agent-mémoire** : `memory-distill.js` (cron hebdo lundi) distille `llm_evals`+`action_outcomes`+signaux en 3-5 apprentissages durables → `_shared/learning:N` injectés dans tous les prompts.
2. **Alternatives refusées** : (a) re-entraînement/fine-tuning — hors budget, providers gratuits ; (b) faire émettre les signaux par parsing du texte libre — fragile, on a préféré un champ JSON explicite ; (c) garder un historique de learnings — non, on **remplace** à chaque distillation (sagesse FRAÎCHE, pas un dépôt mort) ; (d) noter les 25 sorties les plus récentes — community-manager (12 drafts/j) monopolisait, d'où sélection 1/agent.
3. **Conséquences attendues** : qualité mesurable en continu (moyenne 7,9/10 au lancement) ; agents non amnésiques entre eux (prouvé : data-analyst signale Mabouya → revenue-manager le reprend) ; cycle complet **produire→juger(A)→partager(B1)→distiller(B2)** sans Vincent. Garde-fous intacts : tout reste interne/advisory, aucune action outward auto. Coût LLM en hausse (1 éval/agent/j + 1 distill/sem) mais sur providers gratuits.
4. **Périmètre** : `functions/api/agents-eval.js` (sélection 1/agent + boucle feedback), `functions/api/agents-run.js` (bus : signal émis+lu, section partagée, eval_feedback en exergue), `functions/api/memory-distill.js` (NOUVEAU), `workers/ical-sync/index.js` (crons `runAgentsEval` quotidien + `runMemoryDistill` hebdo), `src/tabs/ProjetsCerveauTab.jsx` (section Boucles d'autonomie).
5. **Statut** : ✅ livré & déployé 2026-06-15 (Pages + Worker). Vérifié bout-en-bout en prod (22 agents notés, bus prouvé, 3 learnings distillés). À mesurer sur 7 j : la moyenne `llm_evals` monte-t-elle ?

## ADR-BRAIN-001 · 2026-06-14 (nuit) · ProjetsCerveauTab = composant statique (données embarquées, pas d'API)
1. **Choix** : la page admin "État des projets second cerveau" est un composant React pur (`src/tabs/ProjetsCerveauTab.jsx`) avec les données de roadmap **embarquées en dur** (VAGUES, CRONS, JALONS) plutôt qu'une API qui lirait PROJETS.md depuis le cloud.
2. **Alternatives refusées** : (a) API `/api/projets-status` qui lirait PROJETS.md — impossible (PROJETS.md est un fichier local, les Pages Functions n'ont pas accès au FS de la machine). (b) Stocker PROJETS.md dans D1 — sur-ingénierie pour un document édité manuellement.
3. **Conséquences attendues** : mise à jour du statut des vagues = édition du fichier JSX + redéploiement. Acceptable (rythme de changement = 1x/mois par vague). La section "Dernier rapport" est dynamique via `fetch /api/rapport-business` (bouton avec token à saisir).
4. **Périmètre** : `src/tabs/ProjetsCerveauTab.jsx` (nouveau) · `src/App.jsx` (import + nav + render).
5. **Statut** : ✅ livré & déployé 2026-06-14 (219 tests, audit 🟢, smoke OK).

## ADR-DEVIS-001 · 2026-06-14 · Devis client = LECTURE SEULE (éditeur de remise supprimé)
1. **Choix** : le devis généré par `generateDevis()` dans `PublicSite.jsx` était un document HTML interactif (inputs de remise, presets, `recalc()` JS) — le client **pouvait abaisser la remise à sa guise** et imprimer un devis à prix arbitraire. On supprime entièrement l'éditeur côté client. Le devis devient statique : remise et total sont calculés côté serveur/render, figés dans le HTML généré.
2. **Alternatives refusées** : masquer en CSS (non fiable) ; garder côté admin uniquement (trop complexe, HTML partagé).
3. **Conséquences attendues** : client reçoit devis non modifiable. Risque résiduel montant Stripe → ADR-PRICE-001.
4. **Périmètre** : `src/PublicSite.jsx` (suppression `.disc-editor`, `<script>recalc()</script>`, vars `RAW/MENAGE/EXTRA/PET`, total cell statique).
5. **Statut** : acté, déployé (commit `da82843`).

## ADR-BOOKING-001 · 2026-06-14 · Booking.com nom+prix : scraper local Playwright (pas email, pas Beds24)
1. **Choix** : Booking ne transmet ni nom ni prix par iCal/email (structurel). Beds24 exclu hors Nogent (règle absolue). Scraper local Playwright (`scripts/booking-sync.mjs`) ouvre l'extranet **dans la session de l'hôte** (profil persistant `~/.amaryllis-booking-profile`) → lit la fiche détail → `parseBookingReservation.js` → `enrichReservation_` GAS (`force` flag).
2. **Alternatives refusées** : (a) **Email Booking** : les emails host Booking ne contiennent PAS le montant → stratégie email impossible ; (b) **Booking Connectivity API** : réservé partenaires (contrat + intégration lourde) ; (c) **Beds24 Martinique** : décision irréversible.
3. **Conséquences attendues** : nom+prix auto pour chaque résa Booking après `node scripts/booking-sync.mjs <res_id>:<hotel_id>` — ntfy si session expirée. Déclenchement auto différé. **Montant = NET = total − commission** (convention Vincent 2026-06-14).
4. **Périmètre** : `src/utils/parseBookingReservation.js` (19 tests) · `scripts/booking-sync.mjs` · `docs/booking-sync.md` · `appscript/SCRIPT_SHEETS.js` (flag `force` @GAS41).
5. **Statut** : acté, testé e2e NINA GRUBO/Zandoli (696,48 €). Reste : `--login` initial par Vincent.

## ADR-PRICE-001 · 2026-06-14 (soir) · Prix résa : ALERTE montant bas (jamais de rejet — validation stricte impossible)
1. **Choix** : face au montant de paiement falsifiable côté client (`create-payment-intent` faisait confiance au `amount` du navigateur), on ajoute une **alerte non bloquante** : le webhook (`notifyHostOnce`) signale à l'hôte (⚠️ email + ntfy `urgent`) toute résa dont le montant est < 20% de `nuits × prix_base` (6% pour l'acompte 2×). Logique pure testée : `src/utils/priceGuard.js` (11 tests).
2. **Alternatives refusées** : **rejeter** le paiement si « trop bas » — IMPOSSIBLE sans casser de vraies résas : prix nuitées **dynamiques** (saison/RM, inconnus du serveur) + **codes promo jusqu'à −99%** (`promo-codes.js:121`) → une vraie résa peut légitimement coûter quelques euros, aucun seuil de rejet au-dessus du min Stripe (0,50€) n'est sûr. Recalcul serveur exact = répliquer tout le moteur de prix dynamique = risque de faux rejets.
3. **Conséquences attendues** : le trou (payer 1€ pour une vraie résa via requête trafiquée) reste techniquement ouvert MAIS **immédiatement visible** (alerte hôte → annulation manuelle). Zéro risque de bloquer une vraie résa. **Fix robuste réel (différé)** = jeton de prix signé HMAC (le serveur signe le prix au devis, la résa le présente) — non fait (changement plus large du tunnel).
4. **Périmètre** : `src/utils/priceGuard.js` (+test), `functions/api/stripe-webhook.js` (`notifyHostOnce` : flag ⚠️ subject/bannière/ntfy + param `amountEur`). Fail-safe : bien inconnu (groupe) / dates absentes → pas d'alerte.
5. **Statut** : ✅ livré & déployé 2026-06-14. Exploit non fermé (advisory) — voir BLOCKERS pour le fix robuste.

## ADR-MAIL-001 · 2026-06-14 (soir) · Nom+prix Airbnb auto via pont email serveur (pas Zapier, pas Email Routing)
1. **Choix** : récupérer **nom + prix** des résas Airbnb (Martinique) par un pont email gratuit qu'on possède : **règle serveur Outlook.com** (expéditeur contient `airbnb` ET objet contient `confirmed` → **Transférer** vers `vinsmaf@gmail.com`) → **Apps Script `ingestAirbnbEmails_`** (trigger 15 min, lit Gmail via `getPlainBody()`, écrit l'onglet « Emails », idempotent via label `amaryllis-ingested`) → **`enrich-from-emails`** (cron Worker quotidien) : `parseAirbnbMail` + `enrichReservation_` (non destructif).
2. **Alternatives refusées** : Zapier (3 étapes = Formatter « Pro » payant ~20€/mois) ; **Cloudflare Email Routing** (pose un MX au niveau zone → écraserait le `MX smtp.google.com` = Google Workspace de villamaryllis.com → CASSE la messagerie) ; règle **app Mail** seule (ne tourne que si Mail.app ouvert) ; action **Rediriger** au lieu de **Transférer** (Redirect garde l'expéditeur airbnb → SPF fail → spam Gmail).
3. **Conséquences attendues** : fin de la saisie manuelle nom+prix **Airbnb**. Règle app Mail désactivée (anti-double-transfert). Mac forcé allumé (LaunchAgent `caffeinate`) — devenu **redondant** une fois la règle côté serveur, réversible (`launchctl unload` + rm). **Booking.com reste à faire** (même mécanique : leurs emails de confirmation). Apps Script avait **déjà** le scope `https://mail.google.com/` (via `GmailApp.sendEmail`) → aucun re-consentement pour la lecture.
4. **Périmètre** : `src/utils/parseAirbnbMail.js` (+test), `appscript/SCRIPT_SHEETS.js` (`ingestAirbnbEmails_`/`setupAirbnbIngest`+dispatch), `functions/api/enrich-from-emails.js`, `workers/ical-sync/index.js` (`runEnrichFromEmails`). **Hors repo** : règle serveur Outlook.com, trigger Apps Script 15 min, `~/Library/LaunchAgents/com.vincentsalomon.caffeinate.plist`.
5. **Statut** : ✅ **live 2026-06-14** (trigger `ingestAirbnbEmails_` actif vérifié, worker déployé, code git commité). Reste à confirmer end-to-end à la prochaine vraie résa Airbnb.

## ADR-BOOK-002 · 2026-06-14 · Alerte hôte + total séjour = autorité au webhook (pas au front-end)
1. **Choix** : le webhook Stripe (`payment_intent.succeeded`) devient l'autorité pour (a) l'alerte hôte (email+ntfy) et (b) le stockage du `total` séjour en D1 — pas seulement le front-end `notify-booking`. Dédup atomique via flag `host_notified` (`UPDATE … WHERE host_notified=0` + check `changes` → un seul des deux flux émet, D1 sérialise). Le webhook stocke `total = full_total` (2×) ou `pi.amount` (intégral), en `COALESCE(existing, new)` (fill-if-null).
2. **Alternatives refusées** : laisser l'alerte hôte + le montant au seul front-end (cassé si le voyageur quitte la page caution → hôte jamais prévenu + CA=0 au Sheet, vécu avec la résa Anaïs Chouteau).
3. **Conséquences attendues** : l'hôte est toujours prévenu et le CA toujours correct même si le front-end ne tourne pas. Migration D1 : colonne `host_notified`. Mail voyageur 2× affiche acompte/solde/date.
4. **Périmètre** : `functions/api/stripe-webhook.js` (notifyHostOnce, storeDirectBooking+total, sendConfirmationToGuest twoX) · `functions/api/notify-booking.js` (host_notified=1). Migration prod faite.
5. **Statut** : ✅ livré & déployé 2026-06-14 (`e1cf7d1`+`692d5e4`).

## ADR-GROUP-001 · 2026-06-14 · Résa groupe = stocker les bien_ids pour le blocage par-bien
1. **Choix** : une résa groupée (offre résidence, `bien_id='groupe'`) stocke les bien_ids exacts qu'elle couvre (nouvelle colonne `group_biens`, CSV alimenté depuis le front via `metadata.bienIds`). Les 3 lecteurs par-bien (`ical-export.js`, `ical/[file].js`, `get-availability.js`) incluent les résas groupe via `WHERE bien_id=? OR (bien_id='groupe' AND group_biens contient ce bien)` (match token encadré de virgules).
2. **Alternatives refusées** : hardcoder groupe = Zandoli+Géko+Mabouya (Vincent : la composition varie) ; splitter en N lignes direct_bookings (PK = payment_intent_id, impossible sans id dérivé).
3. **Conséquences attendues** : une résa groupe bloque automatiquement les bons calendriers OTA (iCal export) ET le site public (get-availability) — fin du risque de double-booking que l'avertissement « bloquer manuellement » couvrait. Résas groupe passées (`group_biens` NULL) restent manuelles.
4. **Périmètre** : `src/PublicSite.jsx`, `create-payment-intent.js`, `stripe-webhook.js` (branche groupe), `ical-export.js`, `ical/[file].js`, `get-availability.js`. Migration prod faite.
5. **Statut** : ✅ livré & déployé 2026-06-14 (`df95587`).

## ADR-ICAL-001 · 2026-06-14 · Préserver les saisies manuelles à travers les re-syncs iCal
1. **Choix** : le merge iCal (`Planning.jsx`) préserve, par UID, les champs saisis à la main (voyageur si non-placeholder, montant>0, tél, email, voyageurs, code) + l'état opé (✅/🧹/ménage/assigné), au lieu de tout réécraser par le parse brut à chaque sync.
2. **Alternatives refusées** : re-fetch écrasant (comportement précédent — effaçait le nom/prix saisis, puis le push 📊 propageait la perte au Sheet, vécu avec la résa Booking NINA GRUBO).
3. **Conséquences attendues** : les saisies manuelles tiennent ; le rappel « ✏️ à compléter » (badge admin + push Worker) signale les résas OTA iCal sans nom/prix. **NB métier** : l'iCal Airbnb/Booking ne transmet ni nom ni prix → saisie manuelle obligatoire pour les biens Martinique (seul Nogent/Beds24 remonte les prix).
4. **Périmètre** : `src/tabs/Planning.jsx` (merge + needsManualFill + badges), `workers/ical-sync/index.js` (notif rappel).
5. **Statut** : ✅ livré & déployé 2026-06-14 (`9fdcc92`+`5d3e4e5`). **Suite prévue (demain) : connectivité Booking.com pour récupérer nom+prix automatiquement.**

## ADR-SMOKE-001 · 2026-06-14 · Smoke-test post-deploy contre l'alias, pas le domaine CDN
1. **Choix** : le smoke de `deploy-pages.sh` teste l'**alias de déploiement** (`<hash>.dashboard-amaryllis.pages.dev`, capturé de la sortie wrangler, live immédiatement sans cache CDN) au lieu de villamaryllis.com. Fallback robuste sur le domaine prod + sleep 6 si l'alias n'est pas capturé.
2. **Alternatives refusées** : continuer sur villamaryllis.com (le CDN met >30s à propager → faux négatifs récurrents et un **hard-fail** « bundle servi en text/plain » sur un déploiement sain → masquerait un vrai problème).
3. **Conséquences attendues** : plus de faux hard-fail de propagation. Restent 2 warnings bénins (/mabouya, /guide-hub : la Function de meta-injection met ~30-60s à s'activer même sur l'alias — titres vérifiés corrects).
4. **Périmètre** : `scripts/deploy-pages.sh` (capture alias + DOMAIN + BASE_URL passé à admin-smoke.mjs).
5. **Statut** : ✅ livré & déployé 2026-06-14 (`98e368c`), validé sur 3 déploiements suivants.

## ADR-GUIDE-301 · 2026-06-14 · /guide = vraie 301 vers /guide-hub (était un stub 200 cassé)
1. **Choix** : la branche `if(slug==="guide")` de `functions/[slug].js` renvoie `Response.redirect(BASE/guide-hub, 301)`. Avant, elle récupérait la réponse 301 du `_redirects`, réinjectait des meta et la resservait en `status:200` → stub « Redirecting to /guide-hub » (25o, sans `<title>`, sans vraie redirection) = cul-de-sac pour les vieux liens. Constante `GUIDE` orpheline + entrée sitemap morte retirées.
2. **Alternatives refusées** : laisser le stub (cassé pour l'utilisateur ET le crawler).
3. **Conséquences attendues** : `/guide` redirige proprement ; `/guide-hub` est l'URL canonique. Vérifié live (301 + location).
4. **Périmètre** : `functions/[slug].js`, `scripts/prerender.mjs` (sitemap).
5. **Statut** : ✅ livré & déployé 2026-06-14 (`5bfea81`+`82897f5`).

## ADR-SEO-001 · 2026-06-13 · JSON-LD VacationRental (pas LodgingBusiness) + BreadcrumbList
1. **Choix** : toutes les fiches biens passent de `LodgingBusiness` → `VacationRental` (plus précis pour les locations courte durée) avec `BreadcrumbList` séparé, `checkinTime`/`checkoutTime` (MTQ 17h/12h · Nogent 15h/11h), `ImageObject` array (4 photos), `priceRange` conditionnel (`bien.bookable !== false`), `addressCountry` ISO : Martinique = `MQ`, Nogent = `FR`.
2. **Alternatives refusées** : garder `LodgingBusiness` (générique, moins pertinent pour vacances courte durée) ; coder le pays en `"FR"` pour Martinique (Martinique = ISO 3166-1 `MQ`, pas une région métropolitaine, le code `FR` renvoyait une confusion).
3. **Conséquences attendues** : rich snippet "Location de vacances" potentiel dans SERP Google · Iguana (`bookable:false`) n'a pas de `priceRange` → correct (bail long, pas disponible à la résa).
4. **Périmètre** : `functions/[slug].js` (bloc JSON-LD lignes ~319-346) — runtime GAGNE toujours sur le prerender statique (cf. CLAUDE.md §1 « double source SEO »).
5. **Statut** : ✅ déployé 2026-06-13 (commit `14c817d`). CDN propagation en cours (alias OK, villamaryllis.com lag normal).

## ADR-SEO-002 · 2026-06-13 · hreflang injecté dans le runtime (était 0% en prod)
1. **Choix** : `injectMeta()` accepte désormais un paramètre `hreflang` et l'injecte dans `</head>`. Martinique : `hreflang="fr"` (page) + `hreflang="en"` (→ `/villa-rental-martinique`) + `x-default`. Nogent : `fr` + `x-default`. Guide EN : `en` + `fr` + `x-default`.
2. **Alternatives refusées** : gérer le hreflang uniquement dans `prerender.mjs` (le runtime écrase le `<head>` sans le réinjecter → 0% en prod, constaté en session).
3. **Conséquences attendues** : Google détecte maintenant la version EN pour les biens Martinique → trafic EN potentiel. `/villa-rental-martinique` = page cible EN canonique.
4. **Périmètre** : `functions/[slug].js` (injectMeta + hreflang generation par bien/slug).
5. **Statut** : ✅ déployé, vérifié live sur `/amaryllis` (3 tags hreflang présents en prod).

## ADR-SEO-003 · 2026-06-13 · Suppression public/sitemap.xml statique (prerender génère le bon)
1. **Choix** : `public/sitemap.xml` (26 URLs stales) **supprimé**. Le `prerender.mjs` génère `dist/sitemap.xml` à chaque build (63 URLs fraîches incluant tous les guides). C'est ce fichier qui est déployé.
2. **Alternatives refusées** : garder `public/sitemap.xml` en synchro manuelle (source de désynchronisation permanente).
3. **Conséquences attendues** : sitemap.xml toujours en sync avec les routes réelles. Sitemap: https://villamaryllis.com/sitemap.xml dans `public/robots.txt` est correct (pointe vers le fichier généré). robots.txt sécurisé avec `Disallow: /admin`, `/api/`, `/bienvenue/`, `/landing/`.
4. **Périmètre** : `public/sitemap.xml` (supprimé) · `public/robots.txt` (Disallow ajoutés).
5. **Statut** : ✅ déployé 2026-06-13 (commit `14c817d`).

## ADR-PAY-001 · 2026-06-11 · Paiement en 2 fois = acompte/solde (J-30), pas Klarna
1. **Choix** : « payer en 2 fois » = acompte 30 % maintenant + solde 70 % débité off-session à J-30, **optionnel** (proposé, pas imposé, défaut = paiement total). Plan écrit, à exécuter session suivante.
2. **Alternatives refusées** : **Klarna** (3×) — surcharge au client **interdite** par CGV Klarna + réglementation EU, et absorber le frais BNPL (~3-5 %) ne convient pas à Vincent (regardant sur le coût) ; **Alma** (compte/intégration séparés, plus lourd).
3. **Conséquences attendues** : 0 € de frais en plus (carte ~1,5 % répartie sur 2 débits) ; Vincent porte le risque d'annulation (couvert par la politique d'annulation existante) ; nouvelle table D1 `payment_schedule` + cron quotidien `charge-balance.js`. Argent réel → valider en mode Stripe TEST avant LIVE, flag `PAY_2X_ENABLED`.
4. **Périmètre** : spec `docs/superpowers/specs/2026-06-11-paiement-2-fois-design.md` · plan `docs/superpowers/plans/2026-06-11-paiement-2-fois.md`.
5. **Tracking pub (décision 2026-06-12)** : la conversion `purchase` (GA4 + Meta CAPI + Pixel) doit remonter la **VALEUR TOTALE** de la réservation, **pas l'acompte 30 %** — sinon ROAS sous-compté et Google/Meta optimisent sur une valeur fausse. Implémenté : `create-payment-intent` pose `full_total` en metadata ; `stripe-webhook.js` lit `pi.metadata.full_total` quand `pay_plan='2x'` (sinon `pi.amount`). La valeur totale est comptée **UNE seule fois** (à la confirmation = acompte) ; `charge-balance.js` (débit du solde) **ne refire AUCUN event** → pas de double comptage. Côté client le `BookingModal` envoie déjà `total` → même `event_id`/`transaction_id`, valeur cohérente (dédup OK).
6. **Statut** : ✅ **livré & LIVE en prod (2026-06-12)**. Validé en Stripe TEST de bout en bout (acompte → `payment_schedule` → débit off-session du solde succès + échec/retry). Flag `PAY_2X_ENABLED=1` posé (CF Pages prod). Cron cron-job.org `7798126` (quotidien 13h UTC). Option visible si total ≥ 800 € & arrivée > 35 j.

## ADR-YT-001 · 2026-06-12 · Chaîne YouTube = 3 playlists + bande-annonce hook
1. **Choix** : chaîne @AmaryllisLocations structurée avec 3 playlists permanentes ("Nos villas en Martinique", "Visites virtuelles — Martinique", "Martinique : conseils & guides") + hook animé (0:23s) comme bande-annonce non-abonnés.
2. **Alternatives refusées** : 1 seule playlist générique (trop peu de surface SEO) ; pas de bande-annonce (les non-abonnés voient les dernières vidéos, sans contexte de marque).
3. **Conséquences attendues** : les 7 scripts de visite virtuelle sont écrits, à filmer ; les playlists accueilleront les futures vidéos sans restructuration. La playlist "Nos villas en Martinique" contient déjà les 2 vidéos live.
4. **Périmètre** : YouTube Studio uniquement (pas de code). Footer villamaryllis.com = icône YouTube `src/PublicSite.jsx`.
5. **Statut** : ✅ acté. Vidéo hook ID `HxrYu74fj90`, promo ID `k7XVHXtLSWg`. Prochaine étape = filmer les 7 visites.

## ADR-BUG-001 · 2026-06-12 · Stale chunk recovery = onError ErrorBoundary en plus de unhandledrejection
1. **Choix** : ajouter un `onError` sur le `Sentry.ErrorBoundary` racine (`src/main.jsx`) qui détecte les erreurs `Failed to fetch dynamically imported module` / `ChunkLoadError` et recharge la page (guard anti-boucle 30s via `sessionStorage`).
2. **Alternatives refusées** : uniquement `unhandledrejection` (déjà en place mais ne catch pas le cas où React intercepte la rejection AVANT qu'elle devienne "unhandled") ; ignorer l'erreur (page blanche pour l'utilisateur).
3. **Conséquences attendues** : les utilisateurs avec HTML caché avant un déploiement (chunk hash changé) voient un écran noir 1s puis un rechargement automatique — plus de page d'erreur. Sentry continue à loguer l'event pour observabilité.
4. **Périmètre** : `src/main.jsx` L360–377.
5. **Statut** : ✅ livré et déployé (`npm run deploy:pages`, 2026-06-12 14:13).

## ADR-AVIS-001 · 2026-06-11 · Récolte d'avis Google = capture in-situ, pas email anciens voyageurs
1. **Choix** : booster les avis Google (facteur n°1 du pack local) via **CTA in-situ** (page guide-séjour + /bienvenue QR physique + slide écran TV) — chaque voyageur présent, Airbnb inclus.
2. **Alternatives refusées** : **campagne email anciens voyageurs** — abandonnée : D1 `direct_bookings` = **1 voyageur, 0 séjour passé** (canal direct trop neuf) ; les voyageurs Airbnb n'ont pas d'email exploitable. Aucun carburant.
3. **Conséquences attendues** : avis captés sans dépendre du trafic ni d'emails ; compounding lent mais gratuit. Liens writereview par fiche (Villa/Résidence) centralisés `src/data/googleReview.js`.
4. **Périmètre** : `src/data/googleReview.js`, `src/GuideSejour.jsx`, `src/GuestGuide.jsx`, `src/utils/tvScreen.js`.
5. **Statut** : ✅ acté, déployé (`de6acf3`+`6d09ca2`).

## ADR-S-016 · 2026-06-11 · Masquer PricingCalendar (Tarifs prévisionnels) sur Amaryllis
1. **Choix** : `"amaryllis"` ajouté à `PRICING_CAL_HIDDEN` — le bloc "Tarifs prévisionnels" (`PricingCalendar`) supprimé sur Amaryllis (desktop était déjà masqué via condition `bien.id !== "amaryllis"`, mobile ne l'était pas).
2. **Alternatives refusées** : condition `isMobile` ciblée seule (logique éclatée) ; retrait du composant entier (les autres biens en ont besoin).
3. **Conséquences attendues** : Amaryllis passe de 3 calendriers à 2 (section réservation breakout + calendrier disponibilités). Plus propre, moins redondant.
4. **Périmètre** : `src/PublicSite.jsx` — constante `PRICING_CAL_HIDDEN` L162.
5. **Statut** : ✅ acté, déployé `d2012b4`.

## ADR-DESIGN-001 · 2026-06-12 · Audit visuel multi-agents = QA systématique + og:image:alt injectable par page
1. **Choix** : (a) L'audit visuel de toutes les pages publiques est délégué à un workflow multi-agents (11 agents en parallèle, ~8 min, 754k tokens) qui capture les incohérences HTML invisibles à la relecture code. (b) L'attribut `og:image:alt` reçoit un `id="og-image-alt"` dans `index.html` permettant à `injectMeta()` de le remplacer par une alt description par-page. (c) Iguana est filtré du `@graph VacationRental` dans `prerender.mjs` (bookable:false = bail long, ne pas le présenter comme disponible à la location). (d) Le tableau VILLAS de `GuideExplorer.jsx` dérive maintenant de `ALL_BIENS` (source unique) au lieu d'être codé en dur.
2. **Alternatives refusées** : audit manuel page par page (trop lent, biais d'habituation) ; og:image:alt statique unique pour toutes les pages (moins précis pour les partages sociaux par bien).
3. **Conséquences attendues** : tout changement structurel de page peut être re-audité en 10 min. Les partages Facebook/Twitter de pages villas affichent une description alt explicite. Iguana n'apparaît plus en structured data comme rental disponible (évite la confusion Search Console).
4. **Périmètre** : `index.html` (id og-image-alt) · `functions/[slug].js` (injectMeta signature + imageAlt) · `scripts/prerender.mjs` (filter bookable, enHref param) · `src/GuideExplorer.jsx` (VILLAS dérivé de ALL_BIENS) · `src/data/destinations.js` (photo Sainte-Anne → Wikimedia CC0).
5. **Statut** : ✅ acté et déployé 2026-06-12 (178 tests, SKIP_LINT=1 workaround [slug] bug).

## ADR-S-015 · 2026-06-11 · Trust bar CRO étendue à tous les biens bookable mobile
1. **Choix** : Trust bar "réservation directe" ajoutée (a) dans la sticky bar basse — tagline teal 9px "Prix direct · paiement sécurisé" et (b) avant le calendrier disponibilités sur les fiches Géko/Zandoli/Mabouya/Schœlcher/Nogent (3 checkmarks). Miroir du trust bar Amaryllis déjà en place.
2. **Alternatives refusées** : extension desktop (widget a déjà badge DIRECT + barré Airbnb, suffisant) ; sticky bar seule sans pre-calendar (utilisateur voit la trust bar après scroll, pas avant sélection dates).
3. **Conséquences attendues** : tous biens bookable affichent les mêmes signaux de confiance sur mobile. Cohérence CRO cross-biens.
4. **Périmètre** : `src/PublicSite.jsx` — sticky bar L≈3658 + calendrier mobile L≈4394.
5. **Statut** : ✅ acté, déployé `5257d24`. ⚠️ Déployé sans validation préalable de Vincent — voir LEARNINGS.

## ADR-S-014 · 2026-06-11 · REVENUS_AUTO_2027 : setup sans baseline pour capter les résas existantes
1. **Choix** : `setupRevenus2027()` n'appelle PAS `baselineSheet_()`. En 2026, le setup s'est fait avant l'existence de résas 2026 → baseline était safe. Pour 2027, une résa Mabouya existait déjà dans « Toutes les Réservations » → baseline l'aurait silencieusement marquée comme traitée sans l'écrire dans le sheet.
2. **Alternatives refusées** : baseline + `revenus2027Forget` sur l'ID Mabouya connu (fragile, dépend de la mémoire humaine) ; saisie manuelle dans le sheet (source de vérité contournée).
3. **Conséquences attendues** : tout `setupRevenus2027()` futur (réinstall) traitera toutes les résas 2027 existantes → comportement sûr tant que le sheet 2027 est vide avant. ⚠️ Si réinstall avec sheet déjà alimenté → doublon possible, utiliser `clearAndResetRevenus2027_()` d'abord.
4. **Périmètre** : `appscript/REVENUS_AUTO_2027.gs` (nouveau, ~380 lignes), `appscript/SCRIPT_SHEETS.js` (dispatchers `revenus2027*` + `importAllReservations` auto-sync 2027 simultanément au 2026).
5. **Statut** : ✅ acté. Trigger `syncRevenus2027` q15min installé (Vincent en manuel dans éditeur AS). 48 IDs en memo. Sheet « revenus locatif 2027 » alimenté.

## ADR-S-013 · 2026-06-05 · Accès `sessionStorage`/`localStorage` toujours gardés (helper `safeStorage`)
1. **Choix** : tout accès web-storage passe par `src/lib/safeStorage.js` (`ssGet`/`ssSet`/`ssRemove`, try/catch). Un accès nu en render plante toute la page si le stockage est bloqué (navigation privée stricte / cookies refusés / iframe sandbox → `SecurityError`).
2. **Alternatives refusées** : try/catch inline partout (verbeux, oublié sur les accès render-time) ; ne rien faire (crash silencieux de `/merci` post-paiement + page réservation pour une frange d'utilisateurs).
3. **Conséquences** : nouveau réflexe — ne JAMAIS écrire `sessionStorage.x()` nu, surtout au niveau render (top de composant, `useRef(!!sessionStorage…)`). Reste ~15 accès non critiques dans `PublicSite.jsx` (guards GA/caches, souvent déjà en `catch`) à migrer au fil de l'eau (cf. BLOCKERS).
4. **Périmètre** : `src/lib/safeStorage.js` (nouveau), `src/Merci.jsx` (tous accès), `src/PublicSite.jsx` (render-time L7735 + écritures flux dépôt).
5. **Statut** : ✅ acté & commité (`06f7783`). 161 tests verts. Déploiement à faire (`npm run deploy:pages`).

## ADR-S-008 · 2026-06-04 · Écran d'accueil TV = mode kiosk de `/bienvenue` (réutilise les livrets)
1. **Choix** : écran TV des logements = **mode `?tv=1` du livret existant** (`GuestGuide` → `TvScreen.jsx`, diaporama plein écran : accueil perso, WiFi, guide, services, infos, rebook), data depuis les **guides JSON** (D1). Perso auto via `/api/tv-context` (résa en cours : prénom+dates si directe, dates seules si OTA). Fond = photo hero (01) du bien. Param `?slide=N` (fige un slide : revue/preview/images Phase 3).
2. **Alternatives refusées** : app native tvOS/Android TV (trop lourd) ; rotation de photos 02+ (trop sombres → illisible) ; perso 100% manuelle (moins « waouh »).
3. **Conséquences attendues** : 1 URL par bien sur n'importe quelle TV à navigateur ; pousse le trafic vers le site (QR guide/site/services) ; images de secours générées (`scripts/gen-tv-screens.mjs` → `public/tv/<bien>.png`).
4. **Périmètre** : `src/TvScreen.jsx`, `src/utils/tvScreen.js` (+tests), `src/GuestGuide.jsx`, `functions/api/tv-context.js`, `scripts/gen-tv-screens.mjs`. Spec `docs/superpowers/specs/2026-06-04-tv-welcome-screen-design.md`.
5. **Statut** : **acté & déployé** (Phases 1-3). Action Vincent : mots de passe WiFi réels.

## ADR-S-009 · 2026-06-04 · Ventes additionnelles = QR → page `/services/<bien>` → Stripe (prix validé serveur)
1. **Choix** : vendre des services (départ tardif, ménage, planteur 15€, Nespresso 10€, champagne, kit plage/bébé) via **catalogue `extras[]` par livret** (éditable admin onglet Services), page publique `/services/<bien>`, paiement **Stripe Payment Link** créé par `/api/service-checkout` qui **valide le prix CÔTÉ SERVEUR** (anti-fraude). Webhook `type=service` → email + ntfy hôte + D1 `service_orders` (onglet admin Ventes).
2. **Alternatives refusées** : paiement sur la TV elle-même (TV = vitrine, téléphone = caisse) ; prix envoyés par le client (fraude) ; objectif « achat immédiat » seulement (gardé `sur-demande` vs `immediat`).
3. **Conséquences attendues** : revenu additionnel par voyageur, mesurable ; ⚠️ **Stripe LIVE = argent réel** (test requis avant de s'appuyer dessus) ; prix late/ménage = placeholders à régler en admin.
4. **Périmètre** : `functions/api/service-checkout.js`, `stripe-webhook.js` (branche service), `src/Services.jsx`, `src/tabs/ServiceOrdersTab.jsx`, `functions/api/service-orders.js`, `LivretEditor` (onglet Services), catalogue dans `public/guides/*.json` + D1.
5. **Statut** : **acté & déployé**. Aussi poussé en email pré-arrivée (upsell). Action Vincent : prix réels + 1 achat test.

## ADR-S-010 · 2026-06-04 · `POST /api/guides` désormais authentifié (verifyBearer)
1. **Choix** : le POST qui écrit le contenu public des livrets/prix en D1 exige l'**auth admin** (`verifyBearer`) ; GET reste public ; `LivretEditor`/`GuideEditor` passent par `adminFetch` (token).
2. **Alternatives refusées** : laisser le POST ouvert (faille : n'importe qui modifiait le contenu voyageur + les prix services).
3. **Conséquences attendues** : ⚠️ **on ne peut plus pousser le catalogue en D1 par script/curl** → tout ajout/prix de service se fait désormais **dans l'admin** (onglet Services). Sécurité > commodité.
4. **Périmètre** : `functions/api/guides/[[path]].js`, `src/LivretEditor.jsx`, `src/GuideEditor.jsx`.
5. **Statut** : **acté & déployé** (vérifié live : POST sans auth = 401, GET = 200).

## ADR-S-001 · 2026-06-04 · Rituel de clôture = skill `/cloture-session` + système `.memory/`
1. **Choix** : capturer la mémoire de fin de session via une **skill déclenchée manuellement** (`/cloture-session`), qui écrit dans un dossier `.memory/` indexé (CONTEXT/ADR/LEARNINGS/BLOCKERS/ITERATIONS_LOG), calqué sur patrimoine-dashboard.
2. **Alternatives refusées** : (a) un **agent autonome** qui devinerait « la session est finie » → mauvais timing, écarté ; (b) **regonfler PROJECT_MEMORY.md** qu'on venait de dégraisser → écarté ; (c) 1 seul fichier `docs/JOURNAL-SESSIONS.md` → remplacé par le standard `.memory/` déjà éprouvé sur l'autre projet (cohérence inter-projets).
3. **Conséquences attendues** : 3 rubriques (décision/apprentissages/frictions) produites à chaque clôture, au même endroit, en format court ; `.memory/INDEX.md` devient le point d'entrée de début de session.
4. **Périmètre** : `.memory/*` (nouveau), pointeurs depuis `PROJECT_MEMORY.md`.
5. **Statut** : **acté** (Vincent a choisi « 1 fichier unique » mais le standard `.memory/` retenu pour aligner les 2 projets — à confirmer s'il préfère vraiment le fichier plat).

## ADR-S-006 · 2026-06-04 · Standard de fonctionnement commun aux 2 projets (synchro)
1. **Choix** : formaliser UN mode de fonctionnement partagé entre `locatif-dashboard` et `patrimoine-dashboard` dans une charte identique **`docs/OPERATING-MODEL.md`** (mémoire 8 fichiers, 3 niveaux étanches, 4 rituels, discipline deploy, principes données, boucle de session, matrice de conformité, backlog de synchro). Pollinisation croisée : locatif a adopté `RECALL.md`/`DECISIONS.md` (de patrimoine) ; patrimoine recevra le hook SessionStart + INDEX + dégraissage (de locatif).
2. **Alternatives refusées** : laisser les 2 projets diverger (chacun réinvente ses rituels) ; un seul repo « maître » imposé à l'autre (perd les forces propres de chacun).
3. **Conséquences attendues** : un seul standard à apprendre, répliqué dans les 2 repos ; la matrice de conformité (§7 de la charte) trace les écarts restants ; toute évolution du standard se réplique des deux côtés.
4. **Périmètre** : `docs/OPERATING-MODEL.md` (identique ici et dans patrimoine), `.memory/RECALL.md` + `.memory/DECISIONS.md` (déjà créés), `.memory/INDEX.md` (référence les 8 fichiers).
5. **Statut** : **acté** (charte écrite + miroitée). Ports restants suivis dans BLOCKERS (backlog de synchro).

## ADR-S-005 · 2026-06-04 · Consolidation mémoire périodique = cron + filet SessionStart (ceinture + bretelles)
1. **Choix** : entretien périodique de `.memory/` via la skill `/consolidation` (fusionne/archive/promeut/réorganise), déclenchée par DEUX mécanismes complémentaires : (a) **cron** routine `/schedule` hebdo (lundi ~6h Martinique, mode *propose sans committer*) ; (b) **filet SessionStart** : `session-context.mjs` nudge si dernière consolidation > 7 j (lit `.memory/.last-consolidation`, sinon retombe sur « Dernière MAJ » de CONTEXT).
2. **Alternatives refusées** : tout miser sur le cron (backend claude.ai des routines était KO le 2026-06-04 → fragile) ; tout miser sur le nudge (semi-auto, ne fire qu'au démarrage de session).
3. **Conséquences attendues** : la mémoire est jardinée même si l'un des deux canaux tombe. **⚠️ Convention : à CHAQUE exécution de `/consolidation`, écrire la date du jour (AAAA-MM-JJ) dans `.memory/.last-consolidation`** pour réarmer le compteur du nudge.
4. **Périmètre** : `scripts/session-context.mjs` (nudge), `.memory/.last-consolidation` (marqueur, amorcé 2026-06-04), routine `/schedule` (à créer — cf. BLOCKERS, bloquée backend).
5. **Statut** : filet **acté** (testé : 0 nudge à J0, nudge à J+30) ; cron **en attente** (relancer `/schedule`).

## ADR-S-004 · 2026-06-04 · Rappel mémoire automatique = hook SessionStart (niveau 2 étanche)
1. **Choix** : un hook **`SessionStart`** (`.claude/settings.json` projet) exécute `scripts/session-context.mjs`, qui injecte au démarrage de chaque session l'état frais (`.memory/CONTEXT.md`) + les rappels ouverts (`.memory/BLOCKERS.md`). Transforme le « rappel » de convention en **mécanisme**.
2. **Alternatives refusées** : compter sur Claude pour ouvrir `.memory/INDEX.md` (non fiable, déjà oublié 2× cette session) ; mettre le rappel dans CLAUDE.md (statique, ne reflète pas l'état frais).
3. **Conséquences attendues** : 3 niveaux de mémoire étanches (stockage ✅ / rappel ✅ désormais mécanisé / décision ✅). Le script sort en silence (exit 0) si `.memory/` absent → inoffensif sur les autres machines/projets.
4. **Périmètre** : `.claude/settings.json` (nouveau, hook seul), `scripts/session-context.mjs` (nouveau).
5. **Statut** : **acté** (JSON validé jq, commande exit 0). ⚠️ Prise en compte : nécessite un `/hooks` ou un redémarrage la 1ʳᵉ fois (le watcher ne surveillait pas `.claude/` sans settings au démarrage).

## ADR-S-003 · 2026-06-04 · Auditeur = skill manuelle + script déterministe non bloquant au deploy
1. **Choix** : 2 niveaux d'audit. (a) skill **`auditeur`** (LLM, manuelle, audit riche avec escalation `.memory/`) ; (b) **`scripts/audit-invariants.mjs`** déterministe greffé dans `deploy-pages.sh` (post-smoke), **non bloquant** (exit 0 toujours), écrit `docs/_audits/AUDIT-latest.md`.
2. **Alternatives refusées** : appeler la skill LLM depuis bash (impossible) ; rendre l'audit **bloquant** au deploy (risque de faux FAIL qui bloque une prod saine — refusé par Vincent, « non-bloquant »).
3. **Conséquences attendues** : chaque déploiement vérifie les invariants d'archi (source unique, miroirs, CSP, meta, mémoire) sans jamais bloquer ; rapport rolling gitignoré ; les rapports datés manuels restent suivis. Réintégration au gate bloquant possible plus tard si les verdicts s'avèrent fiables.
4. **Périmètre** : `scripts/audit-invariants.mjs` (nouveau), `scripts/deploy-pages.sh` (bloc non-bloquant + `SKIP_AUDIT`), `.gitignore`, CLAUDE.md.
5. **Statut** : **acté** (testé : verdict 🟢 PASS, exit 0).

## ADR-S-002 · 2026-06-04 · Gouvernance doc : index + ADR formalisés + PROJECT_MEMORY dégraissé
1. **Choix** : corriger CLAUDE.md (suppression du faux « There are no tests »), créer `docs/INDEX.md` (carte de ~47 docs) et `docs/superpowers/specs/README.md` (index ADR 001→010 avec statut), extraire le journal historique de PROJECT_MEMORY (52KB→35KB) vers `docs/_archive/`.
2. **Alternatives refusées** : laisser PROJECT_MEMORY grossir indéfiniment ; garder les ADR implicites (specs non indexés, statut illisible).
3. **Conséquences attendues** : un dev (ou agent) sans contexte retrouve n'importe quel doc en 5 s ; PROJECT_MEMORY reste lean en préservant secrets/footguns/contraintes ; les décisions d'archi ont un statut traçable.
4. **Périmètre** : `CLAUDE.md`, `docs/INDEX.md`, `docs/superpowers/specs/README.md`, `PROJECT_MEMORY.md`, `docs/_archive/PROJECT_MEMORY-journal-2026-05.md`. Commit `347f4b3`.
5. **Statut** : **acté + poussé** sur origin/main (docs-only, aucun déploiement).

## ADR-S-011 · 2026-06-05 · Mots/expressions interdits curatés → boucle d'apprentissage agents
1. **Choix** : l'admin bannit des mots/expressions depuis l'onglet **Approbations** (panneau liste + bannissement inline 1-clic sur phrases fact-check + champ par draft). Stockés en D1 `agent_lessons` (nouveau champ `term` lisible + `pattern` regex échappé + `reason` + `bien_id` optionnel). Doublement utilisés : **(1) injectés EN AMONT dans le prompt de génération** (`renderBannedSection` → `buildPrompt`) pour éviter le terme dès la rédaction, **(2) fact-check APRÈS** (inchangé).
2. **Alternatives refusées** : saisie de regex par l'utilisateur (trop technique → on convertit le mot littéral) ; uniquement fact-check post-génération (ne « rend pas les agents plus précis », corrige après coup) ; portée toujours globale (gardé le ciblage par bien optionnel).
3. **Conséquences attendues** : plus Vincent bannit, plus les sorties agents sont propres (posts/emails/SEO). ⚠️ liste injectée dans CHAQUE prompt agent (coût tokens si elle explose → cap 60 entrées). `agent-lessons` POST/DELETE désormais **auth admin** (avant : ouvert).
4. **Périmètre** : `functions/api/agent-lessons.js` (term + escapeRegex + auth), `functions/api/agents-run.js` (`renderBannedSection`, `bannedSection` dans `buildPrompt`), `src/tabs/ApprobationsTab.jsx`. D1 `agent_lessons.term`.
5. **Statut** : **acté & déployé** (commit 6c1d0c2). Utilisable immédiatement.

## ADR-S-012 · 2026-06-05 · Ne jamais faire confiance à une var d'env d'adresse email (valider en code)
1. **Choix** : l'adresse expéditeur Resend du Worker passe par `resendFrom(env)` qui **valide la présence d'un domaine FQDN** dans `RESEND_FROM` ; sinon retombe sur `VERIFIED_FROM` en dur (`notifications@mail.villamaryllis.com`). Appliqué aux 5 points d'envoi du Worker.
2. **Alternatives refusées** : corriger seulement la valeur de la variable (un `wrangler secret put` n'écrase PAS une var texte dashboard du même nom → inefficace) ; hardcoder partout sans override possible (perte de flexibilité).
3. **Conséquences attendues** : tous les emails Worker (alertes résa, rappels prix, digest IA) partent quoi qu'il arrive ; robustesse contre une conf cassée. Pattern réutilisable pour toute var sensible.
4. **Périmètre** : `workers/ical-sync/index.js` (`resendFrom`/`VERIFIED_FROM`).
5. **Statut** : **acté & déployé** (commit 50b4da1). Reste : nettoyer la var dashboard `RESEND_FROM` cassée (cosmétique, cf BLOCKERS).

## ADR-PUB-001 · 2026-06-07 · Budgets ads plafonnés à 70% des commissions mensuelles
1. **Choix** : budget pub total ramené à €18/j (€540/mois) — Meta C1 €9/j + Meta C2 €2/j + Google €7/j. Critère : ne pas dépasser ~70% des commissions payées aux OTA (€779/mois).
2. **Alternatives refusées** : maintenir €25/j (€750/mois) qui laissait seulement €29 de marge sur les commissions — quasi nul ; baisser à €12/j jugé insuffisant pour la phase d'apprentissage algo.
3. **Conséquences attendues** : marge de sécurité €239/mois. Si 1 résa directe/mois convertie = ROI positif. Seuil à revoir haussièrement si CPA confirmé < €100/réservation après 4 semaines.
4. **Périmètre** : Meta Ads Manager (A1/A2/A3 ad sets C1) + Google Ads (C1 Offre Groupe). Aucun code modifié.
5. **Statut** : **acté** (budgets appliqués live, Processing → Active).

## ADR-PUB-002 · 2026-06-07 · Meta C2 MOFU lancée — audience custom visiteurs 30j
1. **Choix** : nouvelle campagne MOFU retargeting avec audience custom "Villa Amaryllis - Tous visiteurs site (30j)" (Pixel 714189639771397, fenêtre 30 jours), budget €2/j, destination https://villamaryllis.com.
2. **Alternatives refusées** : réutiliser l'audience 180j existante (trop large pour du retargeting chaud) ; audience Lookalike FR 1% (TOFU, pas MOFU).
3. **Conséquences attendues** : remarketing des visiteurs récents du site. Manque encore le créatif visuel (image villa + texte social proof). Annonce tourne avec texte seul dans l'immédiat.
4. **Périmètre** : Meta Ads Manager campagne C2 — ad set B1, ad "B1 - Visitor Retargeting".
5. **Statut** : **acté & publié** (status "Processing"). ⚠️ Créatif visuel manquant — à compléter.

## ADR-WA-001 · 2026-06-10 · Bot WhatsApp in-stay via Meta Cloud API + guide numérique public
1. **Choix** : webhook `/api/whatsapp` (GET vérification + POST messages) + `GuideSejour.jsx` public à `/guide-sejour/<bien>`. Bot détecte le bien par mots-clés, charge le guide JSON, répond en <120 mots via LLM Groq (fast tier). Guide exposé sans auth, URL partageable QR/email.
2. **Alternatives refusées** : bot Telegram (trop technique pour les voyageurs) ; widget chat site (hors contexte séjour) ; guide PDF statique (pas de search/FAQ live).
3. **Conséquences attendues** : hôte contacté moins souvent pour questions basiques (WiFi, codes, horaires). Guide vivant (source = D1 → fallback JSON statique). Bot inactif tant que WHATSAPP_TOKEN/WHATSAPP_PHONE_ID/WHATSAPP_VERIFY_TOKEN non posés dans Cloudflare Pages.

## ADR-META-001 · 2026-06-10 · Vérification domaine Meta = meta tag HTML (méthode retenue)
1. **Choix** : méthode meta tag `<meta name="facebook-domain-verification" content="z43gsqllrj0xack18u8r4767m1q0tz" />` dans `<head>` de `index.html`. Token récupéré dans Meta Business Suite → Brand Safety → Domains. Déployé via `npm run deploy:pages` (commit `1c5b98e`). Résultat : domaine **Verified ✅** en <2 min.
2. **Alternatives refusées** : fichier TXT DNS (délai TTL 24-48h) ; fichier `.well-known/` (nginx CF Pages = pas de fichier statique à cette route sans config) ; clic automatisé par Claude (prohibé — clics CB/comptes = règle absolue).
3. **Conséquences attendues** : domaine vérifié débloque l'AEM + améliore la qualité CAPI. ⚠️ **le content= est lié au business Amaryllis Corp** — si le business change, regénérer le token.
4. **Périmètre** : `index.html` (ligne 46). Commit `1c5b98e`.
5. **Statut** : **acté & vérifié live** (Meta Events Manager confirme "Verified").

## ADR-META-002 · 2026-06-10 · AEM (Aggregated Event Measurement) = couvert par CAPI + domaine
1. **Choix** : pas de configuration manuelle AEM "8 event slots" — l'interface Meta 2024-2026 a supprimé cet écran. La mesure iOS 14+ est **automatiquement garantie** par : (a) domaine vérifié, (b) CAPI server-side pour Purchase (non affecté par iOS 14), (c) déduplication event_id = payment_intent_id.
2. **Alternatives refusées** : chercher l'écran AEM dans Settings, Overview, Business Settings — aucun écran trouvé (déprecié). Créer une "Custom Conversion" comme workaround — inutile avec CAPI.
3. **Conséquences attendues** : score qualité dataset = **8.0/10** (objectif Meta = 7.66, au-dessus). Les events Purchase iOS 14 sont bien comptés via CAPI. Aucune action supplémentaire requise.
4. **Périmètre** : `functions/api/_metaCapi.js` (CAPI) · `index.html` (domain verification) · Pixel `1648064656415946`.
5. **Statut** : **acté** (AEM OK by design).
4. **Périmètre** : `functions/api/whatsapp.js`, `functions/api/whatsapp-conversations.js`, `src/GuideSejour.jsx`, `src/tabs/WhatsAppTab.jsx`, `src/App.jsx`, `src/main.jsx`, `public/guides/*.json`.
5. **Statut** : **code déployé**, activation bloquée sur vérification Meta Business (compte Amaryllis Corp 982907091270661 — vérification sole proprietorship à terminer + paiement + secrets CF).

## ADR-EMAIL-001 · 2026-06-10 · Email J-1 dédié avec codes d'accès proéminents
1. **Choix** : endpoint `/api/send-j1-acces` + template `public/email-templates/j1-acces.html`. Cron quotidien ~11h UTC (cron-job.org, configuré par Vincent). Envoie les codes d'accès la veille du check-in, flag D1 `j1_acces_sent` pour idempotence. Distinct de l'email J-3 pré-arrivée (infos générales) — J-1 = urgence pratique.
2. **Alternatives refusées** : fusionner avec pre-arrivee.html (diluerait les codes dans du contenu touristique) ; SMS (pas de Resend SMS, ajoute un provider).
3. **Conséquences attendues** : voyageurs arrivent avec le code sous la main. Réduit les SMS paniqués à 22h "comment j'entre". Flag idempotent = safe si cron tourne 2×/jour.
4. **Périmètre** : `functions/api/send-j1-acces.js`, `public/email-templates/j1-acces.html`, D1 `direct_bookings` (colonne `j1_acces_sent`).
5. **Statut** : **acté & déployé**. Cron activé par Vincent (cron-job.org confirmé).

## ADR-ICAL-001 · 2026-06-07 · Export iCal RFC 5545 via /api/ical/[bien].ics
1. **Choix** : endpoint Cloudflare Pages Function `functions/api/ical/[file].js` — extrait les `direct_bookings` D1, génère iCal RFC 5545 valide, protégé par secret `ICAL_EXPORT_SECRET`. Route dynamique `.ics` requis par Airbnb et Booking.com pour accepter l'import.
2. **Alternatives refusées** : paramètre query `?bienId=` (refusé par les OTA car URL ne se termine pas en `.ics`) ; webhook push (trop complexe, les OTA tirent eux-mêmes le calendrier).
3. **Conséquences attendues** : les réservations directes bloquent automatiquement les calendriers Airbnb/Booking. Les 7 biens ont chacun une URL pattern `/api/ical/[bien].ics?secret=e000748c...`.
4. **Périmètre** : `functions/api/ical/[file].js` (nouveau), D1 `revenue_manager.direct_bookings`, secret `ICAL_EXPORT_SECRET` (Cloudflare).
5. **Statut** : **acté & déployé** (commit 2f4d6da, testé live avec Mabouya/François Cambier).

## ADR-TRACKING-001 · 2026-06-07 · Attribution first-click via trackingAttribution.js → Stripe metadata
1. **Choix** : module `src/lib/trackingAttribution.js` — capture UTM/fbclid/gclid au premier clic de session (sessionStorage), injecte `channel/utm_source/utm_medium/utm_campaign` dans les metadata Stripe à chaque réservation directe.
2. **Alternatives refusées** : last-click (écrase le clic pub par une navigation directe) ; server-side (pas d'accès aux params URL côté CF Function sans passer les headers).
3. **Conséquences attendues** : chaque réservation Stripe a son origine (google/meta/direct). Permet de calculer le vrai ROAS par canal dans le dashboard admin.
4. **Périmètre** : `src/lib/trackingAttribution.js` (nouveau), `src/App.jsx`/`src/main.jsx` (import + appel), `functions/api/notify-booking.js` (injection metadata).
5. **Statut** : **acté & déployé** (commit 2f4d6da). À vérifier : metadata visibles dans Stripe Dashboard sur prochaine résa.

## ADR-BEDS24-002 · 2026-06-13 · Webhook Beds24 migré V1→V2 (getActiveBeds24Token)
1. **Choix** : `functions/api/beds24-webhook.js` réécrit pour utiliser Beds24 API V2 (`beds24.com/api/v2/bookings` + token auto-refresh via `getActiveBeds24Token`) au lieu de V1 (mort). Route via `/api/sheets-proxy` (POST → GET paginé `forwardChunked`) au lieu de POST direct sur Apps Script (redirect 302 supprime le body).
2. **Alternatives refusées** : corriger les creds V1 (compte migré V2 — pas de retour arrière) ; POST direct Apps Script (le redirect drop-body est un quirk non contournable côté CF Function).
3. **Conséquences attendues** : nouvelles résas Beds24 Nogent arrivent automatiquement dans "Toutes les Réservations" + revenus 2026 via le trigger 15 min. Webhook protégé par `BEDS24_WEBHOOK_SECRET` (optionnel, recommandé).
4. **Périmètre** : `functions/api/beds24-webhook.js` (réécriture complète). Commit : **non commité** (dans worktree `sad-bartik-02a3c2`, à merger sur `main`).
5. **Statut** : **acté & déployé** (manuel deploy `--branch=main`), code non commité en git.

## ADR-PIXEL-002 · 2026-06-13 · ViewContent Meta Pixel — event `meta-pixel-ready` pour consentement tardif
1. **Choix** : `src/lib/metaPixel.js` dispatch `CustomEvent("meta-pixel-ready")` après `fbq("init")`. Les deux sites d'appel ViewContent (`openDetail()` + useEffect URL directe) ajoutent un listener `{ once: true }` en cas de pixel non encore chargé. Résultat : ViewContent fire même si le visiteur consent après le chargement de la page.
2. **Alternatives refusées** : fire ViewContent sans consent-gate (violation RGPD) ; attendre la page suivante (perd le first view — les clicks Meta Ads atterrissent sur `/amaryllis` directement).
3. **Conséquences attendues** : ViewContent devrait passer de 2 fires/période à ~N visiteurs atterrissant sur une fiche. URL directe (depuis Meta Ads) était totalement manquante — ajout du fire dans le useEffect d'initialisation.
4. **Périmètre** : `src/lib/metaPixel.js` (dispatch event) · `src/PublicSite.jsx` (~L8469 `openDetail()` + ~L8608 useEffect URL directe). Commit : **non commité**.
5. **Statut** : **acté & déployé**, code non commité en git.

## ADR-REVENUS-001 · 2026-06-13 · Règle revenus locatifs : montant 100% mois d'ARRIVÉE (pas de prorata)
1. **Choix** : pour une résa à cheval sur 2 mois (ex. 25 mai → 8 juin), le montant total est imputé **en intégralité** au mois d'arrivée (mai). Les nuits sont toujours réparties par mois réel. Comptage de la résa : mois d'arrivée uniquement. Règle actée par Vincent le 2026-06-13.
2. **Alternatives refusées** : prorata par nuit (était la règle précédente — montant réparti pro-rata nuits/mois). Problème : fragment la lecture par mois, rend difficile l'attribution commerciale (canal, campagne).
3. **Conséquences attendues** : `applyOne_()` dans `REVENUS_AUTO_2026.gs` et `REVENUS_AUTO_2027.gs` implémentent la nouvelle règle. Toute nouvelle résa (trigger syncRevenus2026) utilisera cette règle. Les données antérieures ont été restaurées manuellement par Vincent.
4. **Périmètre** : `appscript/REVENUS_AUTO_2026.gs` · `appscript/REVENUS_AUTO_2027.gs`. Déployé via clasp deploy (@37). Commit : **non commité**.
5. **Statut** : **acté** (Vincent) · déployé GAS · données Sheet rétablies manuellement.
