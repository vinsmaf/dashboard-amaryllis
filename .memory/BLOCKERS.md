# BLOCKERS — Frictions, dettes & points bloquants (locatif-dashboard)

> Ce qui reviendra nous embêter si on ne le documente pas. Format : statut · sujet · ce qui débloque.
> 🔴 bloquant fort · 🟡 contourné / dette latente · ✅ levé (gardé un temps pour traçabilité).
> _Consolidé le 2026-06-20 : ✅ levés dispersés regroupés dans `## Archivé`._

## En cours → ✅ terminé le 2026-07-05 — Doc endpoints (83 manquants) + INV7 + triage backlog renforcé (règles 5/6)
> Détail complet : ADR-DOCS-ENDPOINTS-001, ADR-AGENTS-TRIAGE-002.
- **Doc `CLAUDE.md` complète** : 149 endpoints réels, 83 ajoutés (6 sous-agents Explore parallèles), 2 nouvelles sections (Newsletter, Éditorial & Réseaux sociaux). `INV7` ajouté à `audit-invariants.mjs` (compare route réelle vs doc, 🟡 RISK si absente) — a trouvé 2 endpoints oubliés (`inventory.js`, `maintenance.js`) dès le premier run.
- **Triage backlog manuel (35 items + `traf-049`/`traf-016`)** avec Vincent : 2 hallucinations trouvées (entité "GreenTech" inexistante marquée `fait` à tort, doublon de contenu blog déjà publié) → 2 nouvelles règles FIABLES ajoutées au cron `agents-triage.js` (règle 5 entité inventée, règle 6 doublon `seo_articles` publié). Déployé et vérifié `?dry=1` en live.
- 5 items backlog fermés car doublons de `AGENDA.md` (session "réunion générale" 29/06) ; `traf-050` (campagne Ads) bloqué par règle absolue dépense pub, jamais auto-exécutable.
- 🟡 **Friction notée, pas levée** : ticket `traf-051` (Core Web Vitals fiches biens) reporté par Vincent à la semaine du 13/07 (AGENDA). Pas de mesure Lighthouse live faite (API PageSpeed publique = 429 sans clé) — point concret déjà trouvé en attendant : animation Ken-Burns RAF 60fps en continu sur 6 fiches (Amaryllis/Géko/Zandoli/Mabouya/Schœlcher/Nogent), risque INP réel. Débloque : soit une clé API PageSpeed (gratuite, 2 min), soit attaquer direct le point RAF sans mesure préalable — décision à prendre le 13/07.
> Détail complet : ADR-AGENTS-IMPACT-001, ADR-MIRROR-DRIFT-001, ADR-CAUTION-EXPIRES-001, ADR-AVIS-DELEGATION-VAGUE3-001, ADR-RAG-DOCS-001.
- **`/api/agents-impact`** : delta sessions GA4 J-2..J-1 vs J+1..J+2 par publication éditoriale. Helper GA4 factorisé en `_ga4.js` (déjà réutilisé le même jour par `docs-refresh.js`).
- **Test anti-drift miroirs** (`mirror-drift.test.js`, gate CI) + fix bug latent GAS `nd_` (UTC→local, `contentKeyRow_`/`27_`) + correction cartographie miroirs dans `CLAUDE.md` (surestimait 3 modules sans miroir réel).
- **Vague 3 délégation avis** : pipeline classification (≥4★=auto futur/≤3★=escalade permanente) + génération LLM de brouillons sur `voyageur_feedback`, **dry-run** (aucune API d'écriture Google/Airbnb branchée). 20 avis réels traités, bug prénom↔nom-du-bien trouvé et corrigé en vérifiant.
- **RAG ingère les docs stratégiques** (435 sections/33 docs) + fraîcheur quotidienne scopée aux 2 seuls docs factuels (SEO GA4 + signaux marché), cron `0 13 * * *`. Décision actée avec Vincent : jamais d'auto-rewrite légal/stratégie, jamais de commit Git auto.
- **Fix caution-checkout** (`expires_at` 72h→24h, cassé depuis sa création) trouvé en voulant poser une caution manuelle pour François Cambier — Vincent a finalement choisi de ne pas en poser pour cette location.
- 🟡 **Dette actée** : `_docsDigest.js` ne se régénère pas tout seul (comme `_featureDigest.js`) — relancer `node scripts/generate-docs-digest.mjs` + `GET /api/rag-ingest` quand un doc du périmètre change (nouveau point 6 du skill `/cloture-session`).
- 🟡 **Couverture partielle connue** : `rm_market_signals` (signaux marché du snapshot quotidien) ne couvre que Villa Amaryllis — les 6 autres biens n'ont aucune donnée de veille concurrentielle en base, pré-existant à cette session.

## En cours → ✅ terminé le 2026-07-04 — Triage auto backlog agents (agent_lessons scope + cron + digest) + consolidation mémoire majeure
> Détail complet : ADR-AGENTS-TRIAGE-001, ADR-MEMORY-SPLIT-001.
- `agent_lessons` gagne un scope `tool`/`caption` + 5 bans d'outils hallucinés (Brevo/HubSpot/Slack/Jest/S3). Nouveau cron hebdo `/api/agents-triage` (lundi 6h UTC) : bloque outil-banni/fait-contredit/doublon, signale (sans bloquer) "probablement déjà construit" via `_featureDigest.js` (généré, committé, PAS régénéré à chaque build).
- 🟡 **Dette de maintenance actée** : `_featureDigest.js` ne se régénère pas tout seul — `node scripts/generate-feature-digest.mjs` à relancer manuellement quand `functions/api/*.js` change (nouveau point 5 dans le skill `/cloture-session`, scopé locatif-dashboard uniquement). Si oublié : le digest devient juste périmé (dégrade la 4ᵉ catégorie de triage), ne casse rien.
- Consolidation mémoire complète (skill `/consolidation`, "GO B" de Vincent) : `ADR.md` 964→131 lignes (archive mensuelle `archive/ADR-2026-06.md`), `LEARNINGS.md` 838→27 lignes pointeur (10 fichiers thématiques `learnings/*.md`), `BLOCKERS.md` compacté (20 sessions closes → 1 ligne chacune), `CONTEXT.md` header trimmé (44,7Ko→24,9Ko). Zone partagée : `JOURNAL-locatif.md` archivé (345→79 lignes).
- **Vérification croisée a payé** : re-fetch systématique de 45 patches D1 annoncés par 16 sous-agents parallèles → 2 (`rep-002`, `sc-024`) jamais réellement écrits malgré un rapport affirmatif → corrigés. Voir `learnings/METHODOLOGIE-PROCESS.md`.

## En cours → ✅ terminé le 2026-07-03 (suite 2) — Résa Ary Augustin (modif+paiement+vérif revenus) + fix rebuild auto-mois
> Détail complet : ADR-REVENUS-REBUILD-AUTOMONTH-001.
- Résa Ary Augustin (Zandoli) raccourcie 6→4 nuits (27→31 juillet 2026), payée via Stripe Payment Link (710€, `pi_3TpEmvDstT3IRAj22H8tWc5w`), réconciliée en D1 `direct_bookings` (gap découvert : n'existait qu'au Sheet, pas en D1).
- Question de Vincent "les revenus 2026 n'ont pas créé de doublon ?" → vérifié : PAS de doublon, mais chiffre périmé (898€ au lieu de 710€, `syncRevenus2026()` ne se déclenche pas sur update). Corrigé via `revenus2026RebuildBienApply` (zandoli/juillet) : 2759€→2571€.
- **Fix systémique demandé par Vincent** : le défaut `fromMonth` du script de rebuild était codé en dur (`4`=avril, jamais mis à jour) → risque d'écraser des mois déjà clos si appelé sans argument. Remplacé par `currentMonthDefault_()` (mois courant calculé à chaque appel). Déployé (`clasp deploy @79`) + commité (`4d6135c`).
- 🟡 **Thread Google Ads en pause, non repris** : création d'une action de conversion native "Balise Google" en secondaire (recommandé par Vincent après diagnostic tracking) bloquée par instabilité UI Google Ads (`document_idle` timeout répétés). Vincent a dit "on revient dans 15 min" puis a enchaîné sur d'autres tâches sans y revenir — **ne pas reprendre spontanément**, attendre qu'il le redemande.

## En cours → ✅ terminé le 2026-07-03 (suite) — Triage inbox bugs + endpoint occupation + widget Cockpit
> Détail complet : ADR-BUG-INBOX-TRIAGE-001, ADR-OCCUPANCY-STATS-001.

## ✅ Inbox 🐞 Bugs — vidée (0 entrée new/backlog au 2026-07-03)
- **Statut** : 8 erreurs JS marquées ignored (bruit MetaMask + chunk périmé post-déploiement, cf LEARNINGS), 2 doubles réservations résolues (résas annulées confirmées par Vincent puis supprimées de D1 `direct_bookings`).
- **Ce qui débloque** : rien — si l'inbox se remplit à nouveau, mêmes outils (`?secret=POSTSTAY_SECRET` sur `/api/client-errors`, `wrangler d1 execute --remote` pour les doubles réservations après confirmation explicite).

## 🟡 Widget Cockpit "🔮 30j à venir" — non vérifié visuellement (mot de passe admin indisponible)
- **Statut** : `Cockpit.jsx` affiche désormais l'occupation forward 30j par bien (nouvel endpoint `/api/occupancy-stats`) — lint/tests/build verts, endpoint vérifié en direct via curl, mais jamais cliqué dans le navigateur (admin password-gated).
- **Ce qui débloque** : Vincent confirme visuellement à l'occasion, ou fournit un accès de test si ce genre de vérif doit devenir systématique.

## 🟡 Backlog guide-sejour PWA — 4 améliorations identifiées, non traitées (voir SPRINT_2026_07.md #11-14)
- **Statut** : offline fragile (SW ne cache pas `/assets/*`), aucun QR physique vers `/guide-sejour/<bien>` (seul chemin actuel = emails), pas de tracking d'adoption PWA (`?source=pwa`), fade visuel manquant sur la quick-nav.
- **Ce qui débloque** : prochaine session, reprendre les tasks #40-43 (déjà détaillées, prêtes à l'emploi).

## 🟡 Exceptions Géko auto-expirantes (03→06/07/2026) — rien à faire, mais à savoir si le calendrier "change tout seul"
- **Statut** : min-nights (D1 `min_nights_config`) + délai 24h (`SAME_DAY_BOOKING_BIENS`/`SAME_DAY_BOOKING_WINDOW` dans `PublicSite.jsx`) reviennent automatiquement à la normale après le 06/07 — aucune action requise.
- **Ce qui débloque** : si Vincent (ou une future session) s'étonne que Géko redevienne "moins souple" début juillet, c'est normal et voulu (ADR-GEKO-EXCEPTION-001) — ne pas re-corriger par réflexe.

## En cours → ✅ terminé le 2026-07-02 — Fiabilisation auto-pub réseaux + hero vidéo home
> Détail complet : ADR-EDITORIAL-RELIABILITY-001, ADR-HERO-VIDEO-001.

## 🟡 Refonte visuelle home — mockups reçus, revue interrompue (non conclue)
- **Statut** : Vincent a fourni un export (`Animation pour réservation Villa Maryllis.zip`) contenant 3 propositions d'accueil (V1/V2/V3) + une page bien, générées par un outil de design tiers (format `.dc.html`, design system + assets inclus). Revue commencée (structure/emplacement des sections, PAS le contenu placeholder) mais interrompue par la demande hero vidéo — jamais conclue. Fichiers extraits dans le scratchpad de session (non persistés dans le repo).
- **Ce qui débloque** : si Vincent relance le sujet, reprendre l'extraction du zip + servir les `.dc.html` via un serveur statique local (le hero embarque une animation JS `<x-import>` qui ne s'affiche pas hors du runtime propriétaire de l'outil — seul le reste de la page HTML/CSS est directement lisible). Points déjà repérés à vérifier avant tout emprunt structurel : les données affichées dans les mockups (notes, avis, %) sont des placeholders parfois incohérents avec `src/data/biens.js` (ex. Villa Amaryllis notée 4,74 dans un mockup vs 4,94 réel) — ne jamais copier un chiffre depuis ces mockups sans revérifier contre la source unique.

## 🟡 Récompense parrain — montant fixe 100€, pas indexé sur le bien réservé par le filleul
- **Statut** : `REFERRAL_PARRAIN_REWARD` (`src/utils/referralReward.js`) = 100€ flat pour tout parrainage, simplification volontaire de la proposition initiale ("~90-110€ selon le bien"). Validé par Vincent tel quel dans le barème global.
- **Ce qui débloque** : si Vincent veut un montant différencié par bien plus tard, ajuster `REFERRAL_PARRAIN_REWARD` en fonction du `bien_id` de la résa du filleul (actuellement non lu par `creditReferralParrain`).

## 🟡 Booking.com scraper CDP — crontab local à vérifier/mettre à jour
- **Statut** : `scripts/booking-scraper.mjs` bascule sur `connectOverCDP` (nécessite `bash scripts/booking-chrome-debug.sh` lancé AVANT). Non vérifié si le crontab existant sur le Mac de Vincent (`crontab -e`, mentionné dans le commentaire du script) a été mis à jour pour chaîner les deux étapes.
- **Ce qui débloque** : Vincent vérifie/édite son crontab local pour lancer `booking-chrome-debug.sh` avant `booking-scraper.mjs` (commande suggérée en commentaire dans le script).

## 🟡 OAuth Google (Gmail + Calendar) — mode Test, refresh_token expire à J+7
- **Statut** : app OAuth Google en mode Externe/Test (compte `vinsmaf@gmail.com` = Gmail perso, pas Workspace → mode Interne indisponible) — s'applique aux DEUX providers connectés (Gmail vérifié `checked:1, imported:1` le 01/07 ; Calendar vérifié fonctionnel le 01/07 soir après ajout des scopes manquants + reconnexion).
- **Ce qui débloque** : si "Gmail non connecté" OU "Calendar non connecté" réapparaît après ~7 jours (~2026-07-08), c'est l'expiration attendue du refresh_token en mode Test — re-cliquer "Connecter" (re-consentement rapide, whitelisté comme utilisateur test) ou envisager de soumettre l'app à validation Google / passer sur un compte Workspace pour un mode Interne permanent (couvrirait les 2 providers d'un coup).

## En cours → ✅ terminé le 2026-07-01 (Bug calendrier réservation + bug Maintenance + feature reconduction)

## En cours (reporté de session précédente — non touché aujourd'hui)
- **Tâche** : Campagne Google Ads "Géko - Location Martinique" (Réseau de Recherche)
- **Étape** : Campagne publiée et **mise en veille** (pause) — config auditée champ par champ et 2 erreurs corrigées (CPC max + zone géo). 1 point restant non résolu : présence de 2 groupes d'annonces dupliqués.
- **Prochaine action** : ouvrir Google Ads → campagne Géko → Groupes d'annonces → comparer le contenu des 2 groupes ("Groupe d'annonces 1" et "Groupe d'annonces 2", tous deux pointent vers villamaryllis.com/geko) → supprimer le doublon, garder un seul groupe → puis demander à Vincent de réactiver quand prêt.
- **Fichiers ouverts** : aucun (travail 100% dans l'UI Google Ads, pas de code)
- **Contexte critique** : (1) campaignId=23983721226. (2) Statut **doit rester En veille** tant que Vincent n'a pas explicitement validé l'activation (argent réel). (3) Toute republication/édition via le wizard Google Ads doit être réauditée ensuite — voir LEARNINGS.

## 🟡 Géko Ads — 2 groupes d'annonces dupliqués à nettoyer
- **Statut** : la campagne "Géko - Location Martinique" (campaignId=23983721226) a 2 groupes d'annonces quasi-identiques, créés lors d'un retry après crash du wizard de création.
- **Action** : avant d'activer la campagne, comparer le contenu des 2 groupes et supprimer le doublon (garder le plus complet/cohérent).
- **Ce qui débloque** : 5 minutes de vérification manuelle dans Google Ads.

## En cours → ✅ terminé le 2026-06-30 (Veille concurrentielle RM — sélection + import 18 concurrents)

## En cours → ✅ terminé le 2026-06-30 (Cerveau AGENDA cleanup + UI note d'impact agents)

## En cours → ✅ terminé le 2026-06-29 (Header SEO + conversion + iguana noindex + aggregateRating home)

## En cours → ✅ terminé le 2026-06-29 (Audit prod ultracode 24 findings + session tracking + LLM)

## En cours → ✅ terminé le 2026-06-29 (Session tracking + LLM + backlog agents)

## 🟡 Perf pubs — attendre conversion purchase dans GA4 + Google Ads
- **Statut** : fix `event_callback` déployé (commit `42d9ba9`, 2026-06-29). GA4 n'avait aucun event `purchase` depuis juin (race condition beacon vs redirect).
- **Prochaine vérif** : 2026-07-07 → GA4 Events (purchase doit apparaître) + Google Ads `amaryllis (web) purchase` > 0.
- **Si OK** : basculer campagnes Google en "Maximiser les conversions" + Meta en "Purchase". **Si toujours 0** : envisager Measurement Protocol server-side dans stripe-webhook.js (client_id GA4 via cookie `_ga`).

## En cours → ✅ terminé le 2026-06-27 (Session pipeline sécurité réservations — 4 gaps comblés)

## 🟡 Annulation directe Stripe = toujours manuelle
- **Statut** : pas de détection auto possible (pas d'iCal pour les résas Stripe)
- **Action** : Vincent doit cliquer ✕ dans admin Planning + rembourser dans Stripe Dashboard
- **Ce qui débloque** : rien — c'est une contrainte de l'architecture directe

## 🟡 TripAdvisor — URLs des 6 fiches à mettre à jour dans send-poststay.js
- **Statut** : 6 fiches TA soumises (27/06). TripAdvisor envoie des emails de confirmation avec les URLs des fiches dans les jours suivants.
- **Action Vincent** : dès réception des emails TA → transmettre les 6 URLs à Claude → mise à jour `TRIPADVISOR_REVIEW` dans `functions/api/send-poststay.js` → redéploiement.
- **En attendant** : le bloc TripAdvisor est dans les emails post-séjour mais les liens sont des placeholders (ne fonctionnent pas). Les emails partent quand même (bloc non-critique).

## ✅ 2026-06-26 — Session Apple Business Connect — résidence Amaryllis configurée — détail complet : `.memory/ITERATIONS_LOG.md`

## 🟡 Apple Business Connect — validation org en attente (soumise 26/06/2026)
- **Statut** : dossier soumis avec justificatifs (Kbis + enregistrement DNS TXT). Délai ≤5j ouvrés.
- **Ce qui débloque** : email de confirmation Apple → création des 6 emplacements restants.
- **Date limite estimée** : ~2026-07-03 (5j ouvrés).

## ✅ 2026-06-26 — Session RM plancher CalendrierTarifs — fix complet server+UI — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-26 — Session revenus — corrections chirurgicales Sheet « revenus locatifs 2026 » — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ Schœlcher direct juillet — 2585.71€ → 1600€ (Éléonore BEVON uniquement, 2026-06-26)

## ✅ 2026-06-25 — Session UI visuelle — nav 8→6 groupes + 5 améliorations visuelles admin — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-24 — Session dashboard UX — Charges Évolution + Pilotage consolidation + ROI pub — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-24 — Feature contacts : base guest_contacts WhatsApp+Sheet + onglet — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-24 — Incident deploy agent : drift réparé + garde anti-agent + division instances — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-23 — Session CRM : Phase 0/1 + 1ère campagne réelle — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-23 — Session articles SEO : portage + maillage + optimisations — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-23 — Session backlog agents 61-76 + data-056/060 — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-23 — Session guides : 4 gaps résolus + 11 guides 404 corrigés + Gmail drafts — détail complet : `.memory/ITERATIONS_LOG.md`

## 🟡 Draft Gmail Sabina DiscoverCars — échec 1er appel create_draft
- 🟡 Le 1er appel `create_draft` pour Sabina a retourné une erreur tool. Le draft Ilina a réussi (`id: r-7175489248125367124`). Adresse Ilina déduite (`ilina.beskina@discovercars.com`) — non confirmée.
- **Débloque** : Vincent vérifie dans Gmail Brouillons. Si draft Sabina absent → créer manuellement (To: `sabina.maliseva@discovercars.com`, Sujet: `Re: Special Offer 2 — Amaryllis Locations`, corps : statut Special Offer 2 / 80% commission / prochaine étape). Vérifier aussi l'adresse Ilina avant envoi.

## ✅ 2026-06-23 — Session Pubs — campagne Google Ads Canada LIVE, Meta toujours bloqué — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-23 — Session reels tous biens — GekoReel + 5 nouveaux déployés — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-23 — Session immersification guides — 20 guides déployés — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-22 — Session affiliate GYG + nav fixes + widget embed — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-22 — Session git sync + CI fix + spam + gate rewrite — détail complet : `.memory/ITERATIONS_LOG.md`

## 🟡 Email "différence main/prod" — source non confirmée
- 🟡 Vincent signale un email à chaque deploy "comme quoi il y a une différence entre le main et la prod". Recherche exhaustive (Worker, scripts, fonctions, crons) = **aucun code custom trouvé**.
- **Hypothèse** : emails GitHub Actions automatiques (failure/recovery sur `deploy.yml`).
- **Débloque** : Vincent confirme (1) l'expéditeur (notifications@github.com vs mail.villamaryllis.com) et (2) si le mot "différence" apparaît réellement dans l'email ou si c'est son résumé.

---

## ✅ 2026-06-21 — Session organisation société d'agents + crons — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-21 — Session sync permanent main=prod + couche monitoring live — détail complet : `.memory/ITERATIONS_LOG.md`

## ✅ 2026-06-21 — Session calendrier compact + auto-scroll + Leaflet ESM — détail complet : `.memory/ITERATIONS_LOG.md`

## 🟡 META_PAGE_TOKEN — migration System User token permanent
- 🟡 **Token actuel ≈ 60j (page token long-lived)** : renouvellement via `meta-token-exchange.js` (D1 `kv_store`). Le seul chemin "jamais expire" = **System User token** (Meta Business Manager → Business Settings → System Users → Create → Admin → Générer token avec toutes les permissions Meta). Disponible seulement après Business Verification complète.
- **Débloque** : BV validée (soumise 2026-06-17) → créer System User → générer token sans date d'expiration → remplacer `META_PAGE_TOKEN` dans les secrets CF (Pages + Worker). Supprimer `meta-token-exchange.js` ensuite.
- **Action AGENDA ajoutée** : 2026-06-25 (dès validation BV).

## ✅ 2026-06-20 — Session sécurité : 3 trous fermés + 2 bugs CSP + audit multimédia — détail complet : `.memory/ITERATIONS_LOG.md`

## 🟡 Config page Facebook — éléments en attente
- 🟡 **CTA "Book now" URL non vérifiée** : le bouton existe sur la page en vue visiteur, mais l'URL de destination n'a pas été confirmée/éditée (session interrompue). → En vue visiteur : hover bouton → crayon → vérifier que cible = `villamaryllis.com`. Si besoin : Page Settings → Buttons.
- 🟡 **Lead gen form FB** : non démarré. Champs à collecter : Nom, Email, Téléphone, Dates, Bien → privacy policy. Créer via Meta Business Suite → Forms.
- 🟡 **WhatsApp business** : en attente Business Verification (soumise 2026-06-17, 1-5j ouvrés). Une fois validée : ajouter numéro réel WA + lier à la Page (Page Settings → WhatsApp). **Action humaine requise** (code de vérification SMS).
- 🟡 **`meta-token-exchange.js`** : endpoint TEMPORAIRE à supprimer une fois le System User token permanent obtenu post-BV. (ADR-META-REPAIR-001)

---

## 🟡 Occupation 0% (4 biens) — vraie donnée ou bug calcul ? (Option B non lancée)
- 🟡 Le sentinel remonte **4🔴 occupation à 0-7%** (Amaryllis, Zandoli, Schœlcher, Géko). Le **watchdog snapshots est muet** → les snapshots `rm_kpi_snapshots` existent et sont frais (<48h). Donc : soit **vraie occupation basse** (juin = basse saison, plausible), soit **bug de calcul `occupancy_rate`** dans le Worker iCal (`runOccupancySnapshot`). **Ce qui débloque** : croiser iCal brut (Airbnb/Booking feeds) vs `rm_kpi_snapshots.occupancy_rate` vs résas réelles `direct_bookings` pour un bien. Si bug → c'est dans le **calcul**, pas la collecte. Lancer Option B si les 🔴 quotidiens deviennent gênants.

## 🟡 Caution off-session — suivi post-livraison (✅ déployé 2026-06-18)
- 🟡 **1er placement off-session RÉEL non encore vu** : Anaïs 31/07 (= seul test grandeur nature ; mécanique prouvée par le solde 2×). Valider le 31/07 (AGENDA). Échec SCA → fallback ntfy + lien manuel câblé.
- 🟡 **Résas 1× antérieures = pas de carte enregistrée** → caution rétroactive auto impossible. **François Cambier (Mabouya, arrivée 05/07)** : lien manuel ~02/07 (AGENDA), séjour 15 nuits → 2e lien possible.
- 🟡 **Résa GROUPE = pas de caution auto** (`cautionAmountFor('groupe')=0`). Voulu pour l'instant.
- 🟡 **Edge cross-day orphelin** : clé idempotence Stripe expire à 24h ; si cron rattrape >24h après → 2e hold possible (les 2 expirent en 7j, **aucun argent perdu**). Très faible proba.

## 🟡 Import historique — analyse en suspens (✅ ~700 résas importées 2026-06-17)
- ⚠️ **Workflow d'analyse** (`wf_b3a6734a-492`, 5 analystes) **interrompu avant synthèse** → relançable. ⚠️ Airbnb = brut host ≠ Booking = total guest (~15% d'écart) → CA inter-canal à manier avec prudence. Bails longs termes (Iguana Joël, Zandoli MAUI) gonflent le CA direct.

## 🔴 Actions humaines (hors dashboard) en attente
- 🔴 **Compte Meta Ads TOUJOURS BLOQUÉ (2026-06-23)** : partenaire frauduleux "Businesss Meta" (ID 111553584645188) + carte Amex hack. Pas de campagne Meta possible avant le 28/06. UTM Meta fix reporté. Campagne Canada uniquement sur Google Ads pour l'instant.
- 🟡 **"Businesss Meta" (ID 111553584645188)** — partenaire frauduleux encore dans Business Manager. Supprimer le **2026-06-28** (AGENDA). Path : Settings → Partners → « ... » → « Remove from business portfolio ».
- 🟡 **Carte Amex ···· 1000 à retirer** de Meta après que le solde pending €3.33 soit réglé (~2026-06-21, AGENDA).
- **C2 MOFU Retargeting** : à recréer de zéro. Vérifier d'abord que `purchase` remonte dans GA4/Meta (AGENDA 2026-06-28).
- 🟡 **Remboursement dépenses frauduleuses** : Meta Business Support — Meta rembourse parfois. Période hack Jun 15-18 = ~€33. Jun 7-11 = légitime.
- **Déclarations meublé de tourisme** (🔴 urgent, jusqu'à 12 500€) — voir `docs/legal/plan-action-declarations.md`. Prérequis aux citations OT/CMT.
- **Bot WA + Bot social — Business Verification Meta** : 🟡 SOUMISE 2026-06-17, en attente (1-5 jours ouvrés). Débloque : App Review + vrai numéro WA + token permanent.
- **Post-BV** : (1) vrai numéro WA · (2) System User token permanent · (3) App Review.
- **Crédit Beds24** à vérifier ; **prospection netlinking** à envoyer.

## ⏳ Revenue Manager — items en attente (contexte : ✅ livré 2026-06-16)
- ⏳ **Débloqués, à coder dans `calcDateReco`** : **RM-01** (uplift scarcity), **RM-02** (filtre saison, re-seed), **RM-04** (gap orphelin 1 nuit + min-stay).
- ⛔ **Attendent input Vincent** : **RM-06** (Google Search Console credentials) · **RM-08** (dépense pub réelle) · **RM-11** (code parrainage stripe-webhook = argent LIVE) · **RM-23** (destinataire ménage par bien Martinique) · **RM-24** (arbitrage ROI caution).
- ⚠️ **Modif NON committée pré-existante** : `src/components/tabs/TabTrading.jsx` — PAS de cette session. Vincent décide : committer ou `git checkout`.
- ⏳ **Reste** : **RM-03 NET RevPAR** (`runOccupancySnapshot` — gros morceau). Détail : `docs/AUDIT-PLAYBOOK-PROGRES.md`.
- ℹ️ Push trading launchd passé 5min→60min (KV diet — cf. CROSS-LEARNINGS 2026-06-16).

## 📣 2026-06-15 (soir) — Auto-publication réseaux : points de vigilance
- 🟡 **Post Bellevue 102 publié dit « votre villa »** (Bellevue ≠ villa) — passé avant le durcissement de la règle. La règle `\bvillas?\b` onlyFor empêche les FUTURS. Le 102 reste en ligne (Vincent décide de le garder/supprimer).
- 🟡 **Iguana = 0 photo cochée** (normal, bail long, exclu du seed). Si un jour besoin de publier Iguana → cocher des photos.
- 🟡 **Faux négatifs fact-check possibles** : le fact-check regex ne couvre pas tout (ex « 5 min Montagne Pelée » depuis Schœlcher = faux mais non détecté). Compléter les règles au fil des erreurs vues. Bannir un mot = onglet Approbations → « Bannir mot » (agent_lessons).
- **Kill-switch** : `EDITORIAL_GATE_DISABLED=1` (stoppe le gate) ou `EDITORIAL_GATE_MODE=shadow` (re-bascule en observation). Nécessite **redeploy Pages** pour prise en compte.

## 🤖 2026-06-15 — Bot social : token OK, FB bloqué par Meta policy
- **Construit & déployé** : agent roster `repondeur-social` ; `/api/social-webhook` ; `/api/social-poll` ; `/api/social-draft` ; `scripts/group-watch.mjs`. Secret `SOCIAL_WEBHOOK_VERIFY_TOKEN` posé. 15 tests. Doc `docs/marketing/social-bot-app-review.md`.
- **Token META_PAGE_TOKEN** ✅ régénéré le 2026-06-15, 20 permissions dont `pages_read_engagement`, permanent. Vérifié `debug_token`. (ADR-META-TOKEN-001)
- **IG `/api/social-poll`** ✅ fonctionne (`scanned:0` = pas de commentaires actifs, pas une erreur).
- **FB `/{pageId}/feed`** 🔴 bloqué : requiert `pages_read_engagement` **Advanced Access** (App Review) même avec le bon token — Standard Access ne suffit plus depuis 2023. Le token est bon, le blocage est au niveau app.
- **Action unique restante** : App Review (cf. §🔴 ci-dessus). En attendant → `group-watch.mjs` couvre FB page + 10 groupes via Playwright. Reste : `node scripts/group-watch.mjs --login` (1 fois) + launchd cron 30min.

## 📈 2026-06-15 — Perf pubs réelle (lue dans les dashboards) + Meta débloqué
- **Lecture dashboards (Chrome MCP, read-only)** — 30j : **Meta** = C1 TOFU 39,98€ + C2 MOFU 10,02€ = **50€**, objectif *Landing Page Views* (506 LPV), **0 conversion optimisée** ; **Google** = 47,88€, CPC 0,62€, ~77 clics, stratégie *Maximiser les clics*, **0 conversion**. GA4 : 587 sessions/30j, 2 ventes (2 226€) mais en canal **« Unassigned »** (jamais créditées au paid).
- **🟢 Meta débloqué** : les 2 campagnes étaient gelées (*« Account spend limit reached »*, plafond compte 50€). Vincent a **relevé le plafond à 100€** (2026-06-15) → **C1 + C2 « Active »** (vérifié). ⚠️ Reset le 1er du mois ; ~50€ de marge → surveiller, peut re-toucher 100€ avant le 1er juillet.
- **Google conversion = déjà bien configurée** : action *« amaryllis (web) purchase »*, Source GA4, **Principale**, 90j — mais **0,00 / « Aucune conversion récente »** = trou d'attribution (Unassigned), corrigé par le code du 2026-06-15. **Ménage optionnel** : conversion *« Pages vues »* comptée en Vente (valeur bidon 1,00) → passer en Secondaire.
- **⏳ Lever 2 (bid → conversions) DIFFÉRÉ** : NE PAS basculer Google « Max conversions » ni Meta « Purchase » tant que purchase = 0 (l'algo crève sans historique). Déclencheur : quand `purchase` se remplit (post-fix). Re-check AGENDA 2026-06-28.

## 🟡 2026-06-15 — Tracking serveur : reste à valider la santé du token CAPI
- **Reste à valider** : validité du **`META_CAPI_TOKEN`** (peut être expiré ~60j, valeur non lisible). Vérif Vincent = Meta Events Manager → Pixel 1648064656415946 → *Événements* : events **Serveur** récents + score **EMQ** Purchase. Si 0/erreurs → régénérer (Conversions API → générer) + `wrangler pages secret put META_CAPI_TOKEN --project-name dashboard-amaryllis`.
- **Account-side (advisory)** : (1) vérifier **dédup** Navigateur+Serveur sur un Purchase test + EMQ Purchase (cible >6/10) ; (2) Google Ads conversion `purchase` en Principale + valeurs d'enchères + Enhanced Conversions ; (3) optionnel : action conversion Google Ads directe (`AW-XXXX/label`) → à ajouter dans `Merci.jsx`. Réf : ADR-TRACKING-001.

## 🟡 2026-06-14 — Prix de réservation falsifiable côté client (mitigé par alerte, pas fermé)
- **Trou** : `create-payment-intent.js` (+ `create-deposit-intent.js`) sont **publics, sans auth, font confiance au `amount` du navigateur** (seule borne : 0,50€–5000€). Quelqu'un de technique peut payer 1€ pour une vraie résa via requête trafiquée. Confirmé par audit adversarial.
- **Pourquoi pas de rejet serveur** : prix nuitées dynamiques (saison/RM) + promos jusqu'à −99% → une vraie résa peut légitimement coûter quelques € (cf. ADR-PRICE-001). Aucun seuil de rejet sûr.
- **Mitigation livrée** : alerte hôte non bloquante (`priceGuard.js` + `stripe-webhook.js notifyHostOnce`) → ⚠️ email+ntfy si montant < 20% de nuits×prix_base. Détectable, pas fermé.
- **Débloque (fix robuste, différé)** : **jeton de prix signé HMAC** — endpoint signe `{bienId,checkin,checkout,amount,exp}` au devis ; `create-payment-intent` vérifie la signature. Décision A/B (2026-06-14) : A (alerte) choisi, B (jeton) à proposer si Vincent veut du blindé.

## 🟡 Booking.com nom+prix auto : LIVRÉ — reste `--login` initial (action humaine)
- **Airbnb** ✅ pont email `Outlook→Gmail→Apps Script→enrich` (ADR-MAIL-001, trigger 15min actif). **Booking** ✅ scraper local `scripts/booking-sync.mjs` (ADR-BOOKING-001, test e2e NINA GRUBO 696,48€ OK).
- **Reste** : Vincent doit faire `node scripts/booking-sync.mjs --login` **une fois** (ouvre l'extranet, entre creds, Entrée → profil `~/.amaryllis-booking-profile` persiste).
- **Déclenchement auto** (différé) : Worker → ntfy iCal ligne incomplète → launchd local. Voir `docs/booking-sync.md §"Reste à brancher"`.

## 🟡 SEO hors-page — autorité de domaine = LE levier (diagnostic Search Console 2026-06-04)
- **Le SEO technique est bon (position 5,8) mais le site manque d'autorité** → seules 3 pages reçoivent des impressions, les 47 guides + 5 landings ~0. **Ne PAS produire de contenu tant que l'autorité ne monte pas** (ferait plus de pages à 0 impression). **Débloque** : citations + netlinking + GBP (kits prêts), mesurer à 4-8 sem (Search Console → Liens).
- **Citations off-page (Top 5 « semaine 1 »)** :
  - ⏸️ **Bing Places** : l'import a pris la mauvaise fiche (diversifiersonpatrimoine) ; Villa Amaryllis pas indexée. **Débloque** : reprendre l'ajout des 2 fiches Amaryllis.
  - ⏸️ **Apple Business Connect** : revendiquer la fiche depuis l'app iPhone Plans, ou Business Connect avec Apple ID dédié.
  - 📧 **3 emails institutionnels prêts** (`docs/marketing/emails-prospection-institutionnels-2026-06.md`) : CMT, Mairie Sainte-Luce, OT Sainte-Luce (tél 0596 62 53 53). Vincent envoie.
  - ⬜ PagesJaunes + Petit Futé (création compte = Vincent).
- ⚠️ **Logements PAS encore déclarés ni classés** → les citations ne doivent affirmer aucun classement (seule la note 4,8★ est réelle). Cf. `docs/legal/plan-action-declarations.md`.
- **Limite pilotage navigateur** : la plupart des citations = création de compte (prohibé Claude) + soumission formulaire (mains de Vincent). Claude prépare, Vincent exécute.

## 🔄 Ports entrants de synchro — périmètre locatif — cf. `docs/OPERATING-MODEL.md` §8
- **Carte source-de-vérité déclarative** : formaliser quels champs sont canoniques (`src/data/biens.js`) vs Sheet → module `src/data/biensSource.js` + test d'invariant.
- **Réintégrer le lint au gate** : `npm run lint` = ~629 problèmes réels (l'entrée « 0 erreur » était stale). Delta-check par fichier déjà dans `deploy-pages.sh` (empêche d'ajouter des erreurs). Gate « full lint = 0 » différé au chantier eslint dédié.
- **Monter la couverture de tests** (zone à risque : miroirs, RM).
- 🤝 **CHANTIER COMMUN — drift miroirs GAS/Worker** : locatif conçoit le test de cohérence des miroirs, puis partage le pattern à patrimoine.

## 🟢 Google Ads LANCÉ (2026-06-04) — suivi
- **C1 « Offre Groupe Sainte-Luce »** (campaignId **23904365229**) : 8€/j, CPC max 0,80€, landing `/location-groupe-sainte-luce`, 13 mots-clés. **C2 « Brand »** (**23913930124**) : 2€/j, landing `/`, 7 mots-clés marque. Liste « Négatifs globaux » (120 mots) sur les 2. Conversion GA4 `purchase` = Principale.
- 📌 **À surveiller** : termes de recherche → négatifs ; bascule objectif « Ventes » + retargeting en septembre. Backlog tech : routes explicites des 3 landings dans `main.jsx` (marchent via fallback `KNOWN`).

## 🟡 Dettes & frictions techniques (latentes)
- **Drift miroir GAS/Worker** : `src/utils/{pricing,coherenceRules,resaDedup,occupancy,rmOccupancyAdjust}.js` dupliqués à la main dans `appscript/*.gs` + `workers/ical-sync/index.js`. Modifier l'util sans répercuter = bug silencieux. **Débloque** : checklist + à terme un test qui compare les implémentations.
- **Lint delta crash sur `[slug].js`** (crochets = glob bash). Contournement : `SKIP_LINT=1`. Débloque : échapper les crochets dans `deploy-pages.sh`. Chip `task_cef1560f`.
- **Visual-review Playwright rapport vide** (`scripts/visual-review.mjs` → 0 pages crawlées, probable timeout/rate-limit nuit). Débloque : relancer en journée / augmenter timeout / `npx playwright install chromium`.
- **Findings audit 06-04** : prix en dur dans la prose marketing de `functions/[slug].js` (« dès 110€/nuit » en texte libre → drift si tarif change, harmoniser au prochain changement de prix). Inclut homepage prerender « Dès 85€/nuit » (aligner sur Nogent 90€ si Vincent confirme).
- **Warnings smoke /mabouya + /guide-hub** (titres) : bénins — la Function de meta-injection met 30-60s à s'activer post-deploy alors que le smoke teste à 30s. Titres vérifiés corrects. Non bloquant.
- **Résas groupe passées (`group_biens` NULL)** : le blocage auto par-bien (ADR-GROUP-001) ne couvre que les nouvelles. Anciennes déjà bloquées à la main par Vincent ; sinon remplir `group_biens` en D1.
- **`caffeinate` LaunchAgent redondant** : `~/Library/LaunchAgents/com.vincentsalomon.caffeinate.plist` installé pour l'ancienne règle Mail (devenue côté serveur Outlook). Débloque : `launchctl unload … && rm` pour laisser le Mac redormir (proposé, en attente go Vincent).
- **`RESEND_FROM` du Worker cassée** (dashboard CF, domaine manquant) — contournée par `resendFrom(env)`. Débloque : Vincent corrige/supprime la variable. Non urgent.
- 🟡 **Findings sécurité #4-13 en backlog** (audit architecte-réseau 2026-06-20, non demandés) : rate-limit `/api/ai-summary`, webhook Beds24 fail-open, logs PII emails dans 8 endpoints, rate-limits paiement, notify-booking test ouvert. À adresser si Vincent le demande.

## 🟡 Vérifs en attente côté Vincent (livré, non re-validé par lui)
- Sync 📊 → onglet « Toutes les Réservations » sans nouveau doublon + revenus cohérents (imports idempotents).
- Meta Pixel : confirmer le flux d'events via Pixel Helper / Events Manager (beacons /tr invisibles en headless).
- Bugs inbox 🐞 : findings `[revue code]` LLM = majoritairement faux positifs vérifiés (code déjà gardé) ; traiter le reste en lot « ignoré » sauf re-signalement.

## ⏳ Décisions différées — à RAPPELER à Vincent quand le déclencheur est atteint
- **Passer l'audit d'invariants BLOQUANT au deploy** (aujourd'hui non-bloquant, ADR-S-003).
  - **Déclencheur** : `scripts/audit-invariants.mjs` a tourné sur **≥5 déploiements** consécutifs avec **0 faux 🔴**. Idéalement après correction des 2 findings 🟡 (doc « 557 erreurs » + prix en prose).
  - **Action** : dans `deploy-pages.sh`, sortir `audit-invariants.mjs` du bloc non-bloquant → `node scripts/audit-invariants.mjs || exit 1` (ou flag `--strict`). MAJ ADR-S-003 + CLAUDE.md.
  - **Qui rappelle** : `/audit` et `/cloture-session` surfacent cette ligne tant qu'elle est ouverte. ➡️ **Signaler dès ≥5 deploys propres constatés.**

---

## ✅ Archivé (levé — gardé pour traçabilité, 1 ligne chacun)
- ✅ **Sécurité #1-3 fermés** (2026-06-20) : manage-deposit gate Bearer+CORS, social gate Bearer|secret, beds24 cache private. ADR-SEC-001.
- ✅ **CSP #8-9 débloqués** (2026-06-20) : api.open-meteo.com (météo /explorer) + unpkg style-src (CSS Leaflet). ADR-CSP-001.
- ✅ **Tracking purchase LEVÉ** (2026-06-20) : 4 purchases trackées 2 894€. Reste : attribution (3/4 en "Unassigned"). Source vive = `npm run funnel`.
- ✅ **Système auto-pub complet en live** (2026-06-15, ADR-SOCIAL-AUTOPUB-001) : re-seed→gate(4 filtres)→publie. Token publie FB+IG. Seuil 85 atteint (88/100 Amaryllis). Posts 16-19/06 passés sans dérapage.
- ✅ **META_CAPI_TOKEN + GA4_API_SECRET posés** (2026-06-15) : vérifié `wrangler pages secret list`.
- ✅ **Fix consentement Google Ads** (2026-06-04) : `ad_storage=granted` confirmé live. 2 campagnes Smart supprimées.
- ✅ **Post GBP « Studio Mabouya »** publié 04/06. Les 3 fiches GBP (patrimoine + Villa Amaryllis + Résidence) sous vinsmaf@gmail.com.
- ✅ **generateDevis crash FB IAB** (2026-06-19) : guard `if (!bien?.id) return` ajouté + 3 bugs D1 triagés. PublicSite.jsx L1724.
- ✅ **Caution UNIFIÉE différée + durcie** (2026-06-18, ADR-CAUTION-DEFERRED-001) : tunnel 100% différé, 8 correctifs argent-réel, `_caution.js`, 308 tests. Commits `ae1922f`/`f07d17e`/`8b73794`.
- ✅ **Import historique OTA+directes** (2026-06-17, ADR-IMPORT-OTA-001 + DIRECTES + JOEL-OVERLAP) : ~700 résas 2022-2027. Fix Joël BAILLEUL chevauchement Iguana.
- ✅ **2FA Facebook + compte pub Meta fermé** (2026-06-17/18) : MDP changé, 2FA actif, bilan dépenses €69.33.
- ✅ **Bot WhatsApp test mode LIVE** (2026-06-17) : App ID `1783600126154478` · WABA `982907091270661` · test `+1 555 006 0804`.
- ✅ **CSP workers.dev+ntfy.sh + null-guards toFixed() + paiement 2× LIVE** (2026-06-16).
- ✅ **Token Meta double-comptage Purchase + fantômes solde 2×** (2026-06-15) → `eventID=pi.id` + guard `kind=solde-2x`. Commits `f5b1784→9a30660`.
- ✅ **Session 06-14 soir** : devis R/O (`da82843`), priceGuard (`327c2d5`), Booking scraper (`a813185`), rapport-business V4 (`d077f37`), chat escalade Mistral.
- ✅ **Résa Booking NINA GRUBO (Zandoli)** (2026-06-14) : fix préservation `9fdcc92`.
- ✅ **Changeset session non commité** (2026-06-13) → réglé commit `1ec6a06`.
- ✅ **Resend domaine `villamaryllis.com`** (2026-06-11) : Verified ; `resendFrom()` → `contact@villamaryllis.com` OK.
- ✅ **Placeholder téléphone guides** (2026-06-11) : UPDATE 6 lignes D1 → `+33 6 10 88 07 72`.
- ✅ **AI-Ops modèle Groq.smart aberrant** (2026-06-11) → auto-corrigé.
- ✅ **Prix en prose `slug.js`** (2026-06-13) : 9 prix corrigés (source `src/data/biens.js`). Commit `14c817d`.
- ✅ **Résa Laurent Maignan total=340€ < caution=500€** (2026-06-11) : VALIDÉ NORMAL — court séjour, caution fixe.
- ✅ **Rename `beds24Amount` → `chargeAmount`** : fait PublicSite.jsx ~L1340.
- ✅ **iCal null guard checkin/checkout** : `ical-export.js` L71-72 + guard.
- ✅ **`sessionStorage` guards** (2026-06-11) : 5 accès → `ssGet`/`ssSet`. 172 tests.
- ✅ **Findings « [revue code] » LLM triagés** (2026-06-11) : 72 entrées, 4 fixed / 67 ignored.
- ✅ **Meta Ads LANCÉ** (2026-06-05) : compte `act_853205825762332`, Pixel `714189639771397`, C1 TOFU + C2 MOFU.
- ✅ **Doublons docs archivés** (2026-06-11) : `google-ads-kit.md` + `google-business-profiles-kit.md` → `docs/_archive/`.
- ✅ **Keepalive tokens** (2026-06-11) : `runMonitor` + `runTokenRotationReminder` actifs.
- ✅ **Crons hebdo créés** (2026-06-10) : `consolidation-memoire-hebdo` + `point-ads-hebdo` (lundi 6h/7h MTQ).
- ✅ **Smoke test renforcé** (2026-06-07/11) : `admin-smoke.mjs` + sentinel anti-chunk-périmé.
- ✅ **Chunk périmé v2** (2026-06-07) → `[[asset]].js` + sentinel (`524fb3d`).
- ✅ **notify-booking.js + get-availability.js** DDL/bien_id → corrigés `14771f1`.
- ✅ **CLAUDE.md « no tests » / PROJECT_MEMORY 52KB / index ADR** (2026-06-04) → corrigés.

### À surveiller (résiduel, bénin)
- **Cache CDN Cloudflare** : peut retenir temporairement de vieux chunks (`text/html`) — le filet client renforcé déclenche le reload ; expire au TTL ou purge manuelle.
- **Sentry « Importing a module script failed » /amaryllis** (FB in-app browser iOS) : signature chunk périmé, fix déployé → bruit CDN résiduel. Purger si récurrence sur sessions récentes non-fbclid.
- **HTTP 401 sur /admin** (~03/06) : probable expiration normale de token de session (`apiFetch.notifyUnauthorized`). Vincent confirme si reproductible.
