# BLOCKERS — Frictions, dettes & points bloquants (locatif-dashboard)

> Ce qui reviendra nous embêter si on ne le documente pas. Format : statut · sujet · ce qui débloque.
> 🔴 bloquant fort · 🟡 contourné / dette latente · ✅ levé (gardé un temps pour traçabilité).
> _Consolidé le 2026-06-15 : ✅ levés regroupés en bas, doublons fusionnés._

## En cours → ✅ terminé le 2026-06-18 (CPA bug 3-layer defense + CRO 8 chantiers déployés & vérifiés en prod)

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
- 🟡 **"Businesss Meta" (ID 111553584645188)** — partenaire frauduleux encore dans Business Manager. Supprimer le **2026-06-20** (AGENDA). Path : Settings → Partners → « ... » → « Remove from business portfolio ».
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

## 📣 2026-06-15 (soir) — Auto-publication réseaux : LIVE, points de vigilance
- ✅ **Système complet en live** (ADR-SOCIAL-AUTOPUB-001) : re-seed→génère(photos cochées)→gate(4 filtres)→publie. Zéro clic. Token publie FB+IG (vérifié).
- ✅ **Seuil 85 validé atteignable** : un post Amaryllis frais a obtenu 88/100 → gate PASS → auto-approuvé en live (pipeline prouvé end-to-end 2026-06-15 soir). Le système publie réellement, pas que des escalades. Reste à surveiller le TAUX de passage sur la durée (`EDITORIAL_GATE_MIN_SCORE` ajustable si trop d'escalades).
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

## 🟡 2026-06-15 — Tracking serveur : 2 secrets posés, reste à valider la santé du token CAPI
- ✅ Vérifié `wrangler pages secret list --project-name dashboard-amaryllis` : **`META_CAPI_TOKEN` ET `GA4_API_SECRET` posés** (l'audit qui les disait absents = faux positif d'un sous-agent). GA4 MP fonctionne (purchases en « Unassigned »).
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
  - ✅ **Post GBP « Studio Mabouya »** publié 04/06. Les 3 fiches GBP (patrimoine + Villa Amaryllis + Résidence) sous vinsmaf@gmail.com.
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
- ✅ Fix consentement déployé (`ad_storage=granted` confirmé live). 2 anciennes campagnes Smart supprimées (ménage 06-04).
- 📌 **À surveiller** : termes de recherche → négatifs ; bascule objectif « Ventes » + retargeting en septembre. Backlog tech : routes explicites des 3 landings dans `main.jsx` (marchent via fallback `KNOWN`).

## 🟡 Dettes & frictions techniques (latentes)
- **Drift miroir GAS/Worker** : `src/utils/{pricing,coherenceRules,resaDedup,occupancy,rmOccupancyAdjust}.js` dupliqués à la main dans `appscript/*.gs` + `workers/ical-sync/index.js`. Modifier l'util sans répercuter = bug silencieux. **Débloque** : checklist + à terme un test qui compare les implémentations.
- **Lint delta crash sur `[slug].js`** (crochets = glob bash). Contournement : `SKIP_LINT=1`. Débloque : échapper les crochets dans `deploy-pages.sh`. Chip `task_cef1560f`.
- **Visual-review Playwright rapport vide** (`scripts/visual-review.mjs` → 0 pages crawlées, probable timeout/rate-limit nuit). Débloque : relancer en journée / augmenter timeout / `npx playwright install chromium`.
- **Findings audit 06-04** : doc « 557 erreurs eslint » périmée (mesure réelle ~0 err / ~17 warnings) ; prix en dur dans la prose marketing de `functions/[slug].js` (« dès 110€/nuit » en texte libre → drift si tarif change, harmoniser au prochain changement de prix). Inclut homepage prerender « Dès 85€/nuit » (aligner sur Nogent 90€ si Vincent confirme).
- **Warnings smoke /mabouya + /guide-hub** (titres) : bénins — la Function de meta-injection met 30-60s à s'activer post-deploy alors que le smoke teste à 30s. Titres vérifiés corrects. Non bloquant.
- **Résas groupe passées (`group_biens` NULL)** : le blocage auto par-bien (ADR-GROUP-001) ne couvre que les nouvelles. Anciennes déjà bloquées à la main par Vincent ; sinon remplir `group_biens` en D1.
- **`caffeinate` LaunchAgent redondant** : `~/Library/LaunchAgents/com.vincentsalomon.caffeinate.plist` installé pour l'ancienne règle Mail (devenue côté serveur Outlook). Débloque : `launchctl unload … && rm` pour laisser le Mac redormir (proposé, en attente go Vincent).
- **`RESEND_FROM` du Worker cassée** (dashboard CF, domaine manquant) — contournée par `resendFrom(env)`. Débloque : Vincent corrige/supprime la variable. Non urgent.

## 🟡 Tracking `purchase` — historique 16 begin_checkout / 0 purchase (data-049, 2026-06-04)
- GA4 30j (au 06-04) : 240 view_item → 16 begin_checkout → 0 purchase. Hypothèses : (a) aucune résa **directe** ce mois (OTA ne passent pas par notre checkout = normal) ou (b) trou de tracking sur `/merci`. Le fix du 14-15/06 (eventID, attribution) doit faire remonter les ventes directes. **Suivi** : AGENDA 2026-06-28 — vérifier que `purchase` quitte « Unassigned ».

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
- ✅ **generateDevis crash FB IAB** (2026-06-19) : guard `if (!bien?.id) return` ajouté + 3 bugs D1 triagés (Java object gone → `ignored`, `.slice`/`.map` → `fixed`). PublicSite.jsx L1724. Déployé.
- ✅ **Caution UNIFIÉE différée + durcie** (2026-06-18, ADR-CAUTION-DEFERRED-001) : tunnel 100% différé, 8 correctifs argent-réel, `_caution.js`, 308 tests. Commits `ae1922f`/`f07d17e`/`8b73794`.
- ✅ **Import historique OTA+directes** (2026-06-17, ADR-IMPORT-OTA-001 + DIRECTES + JOEL-OVERLAP) : ~700 résas 2022-2027. Fix Joël BAILLEUL chevauchement Iguana.
- ✅ **2FA Facebook + compte pub Meta fermé** (2026-06-17/18) : MDP changé, 2FA actif, bilan dépenses €69.33. (Détail : JOURNAL-locatif [2026-06-18])
- ✅ **Bot WhatsApp test mode LIVE** (2026-06-17) : App ID `1783600126154478` · WABA `982907091270661` · test number `+1 555 006 0804` · webhook vérifié · test validé Vincent.
- ✅ **CSP workers.dev+ntfy.sh + null-guards toFixed() + paiement 2× LIVE** (2026-06-16).
- ✅ **Token Meta double-comptage Purchase + fantômes solde 2×** (2026-06-15) → `eventID=pi.id` + guard `kind=solde-2x` + `transaction_id=pi.id`. Commits `f5b1784`→`9a30660`.
- ✅ **Session 06-14 soir** (tunnels OTA + sécurité devis) : devis R/O (`da82843`), priceGuard (`327c2d5`), Booking scraper (`a813185`), rapport-business V4 (`d077f37`), page projets cerveau (`a95a014`), chat escalade Mistral (`1614d68`,`4695081`).
- ✅ **Résa Booking NINA GRUBO (Zandoli)** (2026-06-14) : Vincent a re-saisi nom+prix à la main, fix de préservation `9fdcc92` déployé → re-sync ne l'effacera plus. Sheet complet. _(fusion de 2 entrées contradictoires le 2026-06-15.)_
- ✅ **Changeset session non commité** (2026-06-13) : 4 fichiers déployés mais hors git → réglé par commit `1ec6a06` « aligner git sur l'état déployé ».
- ✅ **Resend domaine `villamaryllis.com`** (2026-06-11) : Verified ; `mail.villamaryllis.com` n'a jamais existé. `resendFrom()` → `contact@villamaryllis.com` OK.
- ✅ **Placeholder téléphone guides** (2026-06-11) : la vraie source = D1 `property_guides` (pas le JSON public) ; UPDATE des 6 lignes → `+33 6 10 88 07 72`. Vérifié live.
- ✅ **AI-Ops modèle Groq.smart aberrant** (2026-06-11) → auto-corrigé par AI-Ops (`groq.smart=llama-3.3-70b-versatile`, cerebras disabled).
- ✅ **Prix en prose `slug.js`** (2026-06-13, chantier SEO A) : 9 prix corrigés (source `src/data/biens.js`). Commit `14c817d`. (Reste homepage prerender → voir Findings audit ci-dessus.)
- ✅ **Résa Laurent Maignan total=340€ < caution=500€** (2026-06-11) : VALIDÉ NORMAL — court séjour, caution = montant fixe. `coherenceRules.js` n'a jamais flaggé ce cas (correct). Réf LEARNINGS « total < caution ». _(3 entrées fusionnées.)_
- ✅ **Rename `beds24Amount` → `chargeAmount`** : déjà fait (`PublicSite.jsx` ~L1340, commentaire Beds24=Nogent). _(2 entrées fusionnées.)_
- ✅ **iCal null guard checkin/checkout** : `ical-export.js` L71-72 `WHERE … IS NOT NULL` + guard. Pas de `functions/ical/` côté locatif. _(2 entrées fusionnées.)_
- ✅ **`sessionStorage` guards** (2026-06-11) : 5 derniers accès migrés vers `ssGet`/`ssSet`. 172 tests verts.
- ✅ **Findings « [revue code] » LLM triagés** (2026-06-11) : 72 entrées D1, 4 fixed / 67 ignored / 1 faux positif. Inbox propre.
- ✅ **Meta Ads LANCÉ** (2026-06-05, confirmé 06-11) : compte « Amaryllis corp » `act_853205825762332`, Pixel `714189639771397`, C1 TOFU + C2 MOFU. (Suivi perf actuel → §📈 ci-dessus.)
- ✅ **Doublons docs archivés** (2026-06-11) : `google-ads-kit.md` + `google-business-profiles-kit.md` → `docs/_archive/`.
- ✅ **Keepalive tokens** (2026-06-11) : `runMonitor` (alerte expiration Beds24) + `runTokenRotationReminder` (rappel mensuel) actifs.
- ✅ **Crons hebdo créés** (2026-06-10) : `consolidation-memoire-hebdo` (lundi 6h MTQ) + `point-ads-hebdo` (lundi 7h MTQ).
- ✅ **Smoke test renforcé** (2026-06-07/11) : `admin-smoke.mjs` (Playwright `/admin`) + sentinel anti-chunk-périmé dans `deploy-pages.sh`.
- ✅ **Chunk périmé v2** (2026-06-07) → `[[asset]].js` + sentinel (`524fb3d`). Crash Redesign Tarifs → rollback `1b6dd02`.
- ✅ **notify-booking.js + get-availability.js** DDL/bien_id (2026-06-07) → corrigés `14771f1`.
- ✅ **CLAUDE.md « no tests » / PROJECT_MEMORY 52KB / index ADR** (2026-06-04) → corrigés (vitest documenté, dégraissé 35KB, `docs/INDEX.md` + specs créés). Hook SessionStart actif (ADR-S-004).

### À surveiller (résiduel, bénin)
- **Cache CDN Cloudflare** : peut retenir temporairement de vieux chunks (`text/html`) — le filet client renforcé déclenche le reload ; expire au TTL ou purge manuelle.
- **Sentry « Importing a module script failed » /amaryllis** (FB in-app browser iOS) : signature chunk périmé, fix déployé → bruit CDN résiduel. Purger si récurrence sur sessions récentes non-fbclid.
- **HTTP 401 sur /admin** (~03/06) : probable expiration normale de token de session (`apiFetch.notifyUnauthorized`). Vincent confirme si reproductible.
