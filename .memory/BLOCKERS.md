# BLOCKERS — Frictions, dettes & points bloquants (locatif-dashboard)

> Ce qui reviendra nous embêter si on ne le documente pas. Format : statut · sujet · ce qui débloque.
> 🔴 bloquant fort · 🟡 contourné / dette latente · ✅ levé (gardé un temps pour traçabilité).

## En cours → ✅ terminé le 2026-06-14 (nuit — session cinéma)
- **V4 rapport-business** : endpoint LIVE + scheduled task `rapport-business-amaryllis-18h` fire à 18h MTQ automatiquement. Test autonomie hors-session.
- **Page projets cerveau** : `src/tabs/ProjetsCerveauTab.jsx` déployée dans admin sous "🧩 Projets cerveau".
- **Prochaine action** : vérifier la notif ntfy reçue ce soir + lire le rapport généré.

## ⬜ Booking.com nom+prix auto (prochaine cible après Airbnb)
- **Contexte** : Airbnb = FAIT (ADR-MAIL-001). Booking.com : même mécanique — leurs emails de confirmation contiennent nom + montant, arrivent sur Hotmail. Écrire `parseBookingMail.js` + élargir règle Outlook « booking.com » → même Gmail → `enrichReservation_`.

- **✅ Airbnb (livré)** : pont email **règle serveur Outlook.com → Gmail → Apps Script `ingestAirbnbEmails_` (15 min) → onglet « Emails » → enrich** (cf. ADR-MAIL-001). Live, trigger actif vérifié. Plus de saisie manuelle nom+prix Airbnb.
- **⬜ Booking.com (prochaine cible)** : appliquer la **même mécanique** — les emails de confirmation Booking arrivent aussi sur Hotmail. Écrire un `parseBookingMail.js` (les mails Booking ont le nom du client + le montant), élargir la règle serveur Outlook (ou en ajouter une « booking.com » → même Gmail), et router vers `enrichReservation_`. Alternative lourde écartée pour l'instant : Booking Connectivity API (réservé partenaires).
- **Contexte critique** : l'iCal Booking/Airbnb ne donne NI nom NI prix (structurel). Pour Airbnb c'est désormais le **mail** qui les apporte (pont ci-dessus). Pour Booking, idem à construire. Préservation des saisies manuelles déjà en place (ADR-ICAL-001).

## 🟡 2026-06-14 (soir) — Prix de réservation falsifiable côté client (mitigé par alerte, pas fermé)
- **Trou** : `create-payment-intent.js` (+ `create-deposit-intent.js`) sont **publics, sans auth, et font confiance au `amount` envoyé par le navigateur** — le serveur ne recalcule jamais le prix (seule borne : 0,50€–5000€). Quelqu'un de technique peut payer 1€ pour une vraie résa via requête trafiquée. Confirmé par audit adversarial (workflow `audit-prix-paiement`).
- **Pourquoi pas de rejet serveur** : prix nuitées **dynamiques** (saison/RM, hors serveur) + promos **jusqu'à −99%** → une vraie résa peut légitimement coûter ~quelques €. Aucun seuil de rejet sûr (cf. ADR-PRICE-001). Un rejet casserait de vraies résas.
- **Mitigation livrée (2026-06-14)** : **alerte hôte non bloquante** (`priceGuard.js` + `stripe-webhook.js` `notifyHostOnce`) → ⚠️ email + ntfy `urgent` si montant < 20% de nuits×prix_base (6% pour acompte 2×). Vincent voit + annule manuellement. **Détectable, pas fermé.**
- **Débloque (fix robuste, différé)** : **jeton de prix signé HMAC** — un endpoint signe `{bienId,checkin,checkout,amount,exp}` au moment du devis/quote ; `create-payment-intent` vérifie la signature → montant infalsifiable. Changement plus large (nouvel endpoint + modif tunnel `handleBook`/2×/groupe) à dérouler prudemment. Decision A/B prise le 2026-06-14 : **A (alerte) choisi**, B (jeton) à proposer si Vincent veut du blindé.

## 🟡 2026-06-14 — Mac forcé allumé (caffeinate) = devenu redondant
- LaunchAgent `~/Library/LaunchAgents/com.vincentsalomon.caffeinate.plist` (`caffeinate -dimsu`, RunAtLoad+KeepAlive) installé à la demande de Vincent pour fiabiliser l'ancienne règle **app Mail**. Depuis que le transfert est **côté serveur Outlook.com**, le Mac n'a plus besoin de rester allumé. **Débloque** : `launchctl unload ~/Library/LaunchAgents/com.vincentsalomon.caffeinate.plist && rm` pour laisser le Mac redormir (proposé à Vincent, en attente de son go).

## ⚠️ Résa Booking NINA GRUBO (Zandoli) — Vincent doit la re-remplir UNE fois — 2026-06-14
- La ligne existe dans le Sheet « Toutes les Réservations » **sans nom ni prix** (effacée par l'ancien bug de re-sync). Le fix de préservation (`9fdcc92`) est déployé → **Vincent doit re-saisir nom + prix une fois** dans l'admin, puis 📊. Cette fois ça tiendra (re-sync + push ne l'effaceront plus). Statut : 🟡 action humaine.

## 🟡 2026-06-14 — Warnings smoke /mabouya + /guide-hub (titres) : bénins
- Persistent à chaque deploy même sur l'alias frais : la **Function de meta-injection** runtime met ~30-60s à s'activer post-deploy, alors que le smoke teste à ~30s. **Titres vérifiés corrects** (prod = alias). Non bloquant. **Débloque** : si ça gêne, tester ces 2 titres uniquement après un `sleep` plus long, ou les sortir du smoke (le prerender/code les couvre déjà). Pas prioritaire.

## 🟡 2026-06-14 — Résas groupe passées (group_biens NULL) restent à bloquer à la main
- Le blocage auto par-bien (ADR-GROUP-001) ne couvre que les **nouvelles** résas groupe (avec `group_biens` rempli). Les résas résidence déjà encaissées avant le 2026-06-14 ont `group_biens=NULL` → invisibles au blocage par-bien. **Débloque** : Vincent les a déjà bloquées manuellement à l'époque ; sinon, remplir `group_biens` à la main en D1 si une ancienne résa groupe pose problème.

## En cours (SEO) → ✅ terminé le 2026-06-13 (SEO 5 chantiers)

---

## 🟡 2026-06-13 — Changeset session non commité (worktree sad-bartik-02a3c2)
- **Sujet** : 4 fichiers modifiés et déployés (manuellement `--branch=main`) mais pas commités en git :
  - `functions/api/beds24-webhook.js` (V1→V2 complet)
  - `src/PublicSite.jsx` (ViewContent deferred listener x2)
  - `src/lib/metaPixel.js` (dispatch `meta-pixel-ready`)
  - `appscript/REVENUS_AUTO_2026.gs` + `REVENUS_AUTO_2027.gs` + `appscript/SCRIPT_SHEETS.js` (règle 100% + rebuild functions)
- **Prod = OK** (déployé), mais git `main` ne reflète pas les changements → rollback accidentel possible au prochain deploy.
- **Débloque** : commiter les 4 fichiers sur `main` dans le worktree → `git commit` + push ou merge.

---

## ✅ 2026-06-11 — Resend domaine villamaryllis.com : DÉJÀ VÉRIFIÉ
- **Vérif 2026-06-11** : `villamaryllis.com` est **Verified** dans Resend (North Virginia, créé il y a 17 jours). `mail.villamaryllis.com` n'a jamais existé dans Resend — c'était une idée abandonnée, pas un domaine réellement ajouté.
- **Emails = fonctionnels** : `resendFrom()` utilise `contact@villamaryllis.com` → livraison OK. Blocker stale, fermé.

## ✅ 2026-06-11 (soir) — Placeholder téléphone guides : la VRAIE source était D1, corrigée
- ⚠️ Le JSON `public/guides/*.json` (fallback) était propre, MAIS `/api/guides` lit **D1 d'abord** :
  les 6 lignes `property_guides` contenaient encore `"+33 6 XX XX XX XX"`. Vu en live via Chrome.
- **Fix 2026-06-11** : `UPDATE property_guides SET content_json = REPLACE(..., '+33 6 XX XX XX XX', '+33 6 10 88 07 72')` sur les 6 biens (wrangler d1 --remote). 0 placeholder restant. Vérifié live.
- **Leçon** : pour les guides, la source de vérité = **D1 `property_guides`**, pas le JSON public.

## ✅ 2026-06-11 — AI-Ops : modèle Groq.smart aberrant → AUTO-CORRIGÉ par AI-Ops
- Plan D1 vérifié : `groq.smart = "llama-3.3-70b-versatile"` ✅ · `cerebras` → `disabled` ✅. L'agent AI-Ops a redécouvert et corrigé seul.

## ✅ 2026-06-13 — Prix en prose dans slug.js corrigés (chantier SEO A — 2026-06-13)
- Chantier A du 2026-06-13 a corrigé les 9 prix incorrects dans `functions/[slug].js` (BIEN_EXTRA descs + guide meta). Confirmés par Vincent avant correction.
- Prix validés (source `src/data/biens.js`) : Amaryllis 280€ · Zandoli 110€ · Géko 110€ · Mabouya 70€ · Schœlcher 90€ · Nogent 90€ · Iguana 180€.
- `scripts/prerender.mjs` homepage "Dès 85€/nuit" → **reste à corriger** si homepage meta doit aligner sur Nogent 90€ (confirmation Vincent différée). Commit `14c817d`.

## 🟡 2026-06-12 — Lint delta check crash sur fichiers [slug].js (crochets)
- **Sujet** : `deploy-pages.sh` lint delta section crash quand `functions/[slug].js` (crochets dans le nom) apparaît dans la liste des fichiers modifiés — bash interprète `[slug]` comme un glob.
- **Contournement actif** : `SKIP_LINT=1 bash scripts/deploy-pages.sh` (à utiliser jusqu'au fix).
- **Débloque** : corriger le loop dans `deploy-pages.sh` pour échapper les crochets ou utiliser un test `-f` au lieu d'un glob. Background chip spawned `task_cef1560f`.

## 🟡 2026-06-10 — Visual-review Playwright retourne rapport vide
- **Sujet** : `node scripts/visual-review.mjs` se termine sans erreur mais `rapport.json` = `{summary:[]}` (0 pages crawlées). Probable cause : timeouts Playwright sur les pages prod (Cloudflare rate-limit la nuit, ou réseau).
- **Débloque** : relancer en journée / augmenter le timeout dans le script / vérifier que Playwright est bien installé (`npx playwright install chromium`).

## 🟡 SEO hors-page — autorité de domaine = LE levier (diagnostic Search Console 2026-06-04)
- **Le SEO technique est bon (position 5,8) mais le site manque d'autorité** → seules 3 pages reçoivent des impressions (accueil, /amaryllis), les 47 guides + 5 landings ~0. **Ne PAS produire de contenu/EN tant que l'autorité ne monte pas** : produire ferait juste plus de pages à 0 impression. **Débloque** : exécution des citations + netlinking + GBP (kits prêts), puis mesurer dans 4-8 sem (Search Console → Liens → domaines référents).
- **Citations off-page — état d'exécution (Top 5 « semaine 1 »)** :
  - ✅ **Post GBP « Studio Mabouya » publié** 04/06 (fiche Résidence, 4 photos). Les **3 fiches GBP (patrimoine + Villa Amaryllis + Résidence) sont sous vinsmaf@gmail.com** (vérifié).
  - ⏸️ **Bing Places** : l'import Google a pris la fiche **diversifiersonpatrimoine** (mauvaise) ; Villa Amaryllis pas dans l'index Bing. **Débloque** : reprendre l'ajout des 2 fiches Amaryllis (même compte Google) via « Ajouter une entreprise » → import Google en sélectionnant les bonnes, ou création manuelle (NAP prêt, vérif par courrier = lent).
  - ⏸️ **Apple Business Connect** : produit SÉPARÉ de l'Apple Business Manager (org « Amaryllis » existe déjà) ; businessconnect.apple.com rebondit sur business.apple.com + 404. **Débloque** : revendiquer la fiche depuis **iPhone app Plans** (« Revendiquer cette entreprise »), ou Business Connect avec Apple ID dédié.
  - 📧 **3 emails institutionnels prêts** (`docs/marketing/emails-prospection-institutionnels-2026-06.md`) : CMT `web@martiniquetourisme.com`, Mairie `bienvenue@mairie-sainte-luce.fr` (à confirmer), OT Sainte-Luce **tél 0596 62 53 53** (pas d'email public). Vincent envoie.
  - ⬜ PagesJaunes + Petit Futé (création de compte = Vincent).
- ⚠️ **Logements PAS encore déclarés ni classés** → les emails/citations ne doivent affirmer aucun classement (seule la note voyageurs 4,8★ est réelle). Cf. plan `docs/legal/plan-action-declarations.md` (déclaration mairie = prérequis OT/CMT + urgent légal).
- **Limite du pilotage navigateur** : la plupart des citations = **création de compte** (prohibé pour Claude) + saisie/soumission de formulaire (mains de Vincent). Claude prépare (NAP, textes, navigation) ; Vincent exécute. Le post GBP a marché car l'accès existait déjà.

## ✅ Meta Ads — LANCÉ (2026-06-05, confirmé 2026-06-11)
- **Tout préparé** : plan complet `docs/marketing/campagne-meta-ads-2026-06.md` + checklist 1 page `docs/marketing/meta-lancement-checklist.md` + **visuels** dans `~/Downloads/meta-ads/` (amaryllis-premium + mabouya-couple).
- **Tracking OK** (prérequis §7 levé) : Meta Pixel `714189639771397` + event `Purchase` valeur € (fiabilisé 04/06). Confirmé côté Meta (notice rétention audience purchase = events remontent). CAPI = bonus non fait.
- **Compte** : « Amaryllis corp » `act_853205825762332` (business 609408700286001) — actif. ⚠️ **BLOQUEUR restant = moyen de paiement** à confirmer + poser une limite de compte (Vincent).
- **Campagne à monter** : C1-TOFU objectif **Trafic**, ABO, 2 ad sets — A1 Amaryllis 5€/j (audience A) `/amaryllis` + A2 Mabouya 5€/j (audience B couple) `/mabouya` = 10€/j. Copy = angles 1 & 2 du doc.
- ⚠️ **Meta bloque le pilotage navigateur** sur adsmanager.facebook.com (clics/screenshots = `permission_required`, navigate hang ; `get_page_text` marche en lecture seule). → **Mode guidé/self-serve obligatoire** : Claude ne peut PAS construire la campagne, Vincent la monte (checklist prête).

## 🔄 Ports entrants de synchro — À FAIRE ICI (côté locatif) — cf. `docs/OPERATING-MODEL.md` §8
> Répartition actée 2026-06-04 : patrimoine fait ses ports de son côté ; **ces items sont le périmètre de locatif**.
- **Carte source-de-vérité déclarative** (inspiré `PATRIMOINE_SOURCE`) : formaliser quels champs sont canoniques (`src/data/biens.js`) vs pilotés Sheet, au lieu du seed ad-hoc dans `App.jsx`. **Débloque** : un module `src/data/biensSource.js` (par champ : `canon` vs `sheet`) + test d'invariant.
- **Réintégrer le lint au gate** : `npm run lint` = **629 problèmes (608 erreurs)** réels aujourd'hui (entrée « 0 erreur » était stale). Un delta-check par fichier est déjà dans `deploy-pages.sh` (empêche d'ajouter de nouvelles erreurs). Gate « full lint = 0 » différé au chantier de nettoyage eslint dédié.
- ✅ **Keepalive proactif des tokens** → **DÉJÀ FAIT** (2026-06-11 vérif) : `runMonitor` (alerte expiration Beds24, appelé depuis `scheduled()`) + `runTokenRotationReminder` (rappel mensuel META/STRIPE/RESEND/GROQ/ANTHROPIC par email). Stale.
- **Monter la couverture de tests** (118 → +), priorité sur la zone à risque (miroirs, RM).
- 🤝 **CHANTIER COMMUN — drift des miroirs GAS/Worker** : 1 solution, 2 repos. **Coordination** : locatif conçoit le test de cohérence des miroirs (extrait la fonction des 2 côtés + compare la logique normalisée), puis partage le pattern à patrimoine. (Voir aussi la dette ci-dessous.)

## 🟡 Tracking `purchase` — 16 begin_checkout / 0 purchase sur 30j (data-049, 2026-06-04)
- GA4 30j : **240 view_item → 16 begin_checkout → 0 purchase → 1 generate_lead**. Donc `revenue`/`byBien`/`byChannel.revenu` du nouveau dashboard restent à 0. **Deux hypothèses** : (a) aucune résa **directe** ce mois (les résas OTA Airbnb/Booking ne passent pas par notre checkout → normal qu'il n'y ait pas de `purchase`) ; (b) trou de tracking : l'event `purchase` ne se déclenche pas sur `/merci` après paiement Stripe. **Débloque** : demander à Vincent s'il a eu des résas **directes** sur 30j. Si oui → auditer le firing de `purchase` (page `/merci`, `src/lib/` gtag/metaPixel, webhook Stripe). Si non → RAS, c'est attendu. ⚠️ Important car c'est la conversion **Principale** de Google Ads : si elle ne remonte pas, l'optim Ads est aveugle.

## 🟡 Findings audit 2026-06-04 (skill auditeur — rapport `docs/_audits/AUDIT-2026-06-04.md`)
- **Doc périmée « 557 erreurs eslint ».** CLAUDE.md + PROJECT_MEMORY justifient l'exclusion du lint par ~557 erreurs ; `npm run lint` mesure aujourd'hui **0 erreur / ~17-19 warnings**. **Débloque** : corriger le wording (et envisager de réintégrer le lint au gate puisqu'il est propre).
- **Prix en dur dans la prose marketing.** Les champs `desc` de `functions/[slug].js` écrivent « dès 110€/nuit » en texte libre (pas le champ prix, donc pas de bug de calcul, mais drift si le tarif change). **Débloque** : harmoniser à la main au prochain changement de prix.

## 🟡 Bugs remontés (inbox 🐞) — restants après la passe 2026-06-05
- ✅ **`sessionStorage` guards — COMPLÉTÉ 2026-06-11** : 5 derniers accès directs non gardés migrés vers `ssGet`/`ssSet` (guardKeys GA purchase × 3 flows, `deposit_cs`, `amaryllis_exit_shown`). 172 tests verts. Tous les accès sessionStorage dans `PublicSite.jsx` sont maintenant soit via `ssGet`/`ssSet` soit en `try/catch`.
- ✅ **`coherence/total_aberrant` résa Laurent Maignan : total=340€ < dépôt=500€** → **VALIDÉ NORMAL 2026-06-11** : court séjour où total < caution = comportement attendu. Réf : LEARNINGS.md « total < caution ».
- **`report` "HTTP 401 sur /admin"** → ✅ non-bug : expiration normale du token de session (géré par `apiFetch.notifyUnauthorized`). À marquer « ignoré » dans l'inbox.
- **Findings `[revue code]` (LLM `/api/code-review`)** : cluster `GuestGuide.jsx` (5) + `service-checkout.js` = **faux positifs vérifiés** (code déjà gardé). Les autres (Faq/Services/TvScreen/analytics…) non vérifiés un par un → probablement bruit, à traiter en lot « ignoré » sauf re-signalement.

## 🟡 Dettes techniques latentes (cassera si on oublie le contexte)
- **Drift du pattern miroir GAS/Worker.** `src/utils/{pricing,coherenceRules,resaDedup,occupancy,rmOccupancyAdjust}.js` sont **dupliqués à la main** dans `appscript/*.gs` et `workers/ical-sync/index.js` (impossible d'importer un module Node là-bas). Modifier l'util sans répercuter le miroir = bug silencieux non couvert par les tests. **Débloque** : checklist « j'ai touché un util → ai-je mis à jour le(s) miroir(s) ? » ; à terme, un test qui compare les deux implémentations.
- ✅ **Doublons de docs archivés — 2026-06-11** : `docs/google-ads-kit.md` + `docs/google-business-profiles-kit.md` → `docs/_archive/`.
- **Lint exclu de la CI** (~557 erreurs eslint sur code historique). La CI ne protège pas contre les régressions de style/no-undef. **Débloque** : chantier de nettoyage eslint dédié, puis réintégrer le lint au gate.

## 🟢 Google Ads LANCÉ (2026-06-04) — suivi
- **C1 « Offre Groupe Sainte-Luce »** (campaignId **23904365229**) : 8 €/j, CPC max 0,80 €, landing `/location-groupe-sainte-luce`, 13 mots-clés, 7 titres/3 desc.
- **C2 « Brand »** (campaignId **23913930124**) : 2 €/j, CPC max 0,40 € (~0,11 € réel), landing `/`, 7 mots-clés marque, 6 titres/2 desc.
- **Liste négatifs « Négatifs globaux Amaryllis » (120 mots)** appliquée aux 2 campagnes. Conversion GA4 `purchase` = Principale.
- ✅ **Fix consentement déployé** : double-bannière supprimée (inline PublicSite neutralisée) + `index.html` restaure les 4 signaux → **`ad_storage=granted` confirmé live** (les conversions remontent bien à Google Ads ; Meta Pixel charge). Commit consent.
- 🧹 **Ménage fait 2026-06-04** : 2 anciennes campagnes Smart en veille **supprimées** (« Villa Amaryllis » 5 €/j + « location villa amaryllis luxe vue mer piscine » 0,50 €/j) — ne dépensaient rien, autorisé par Vincent. **Reste 2 campagnes actives** : C1 (8 €/j) + C2 (2 €/j) = **10 €/j compte**.
- ⏳ **CONTRÔLE À FAIRE ~2026-06-05** : vérifier que **C1 passe de « annonces en cours d'examen » → « Diffuse »** (validation Google < 1 j ouvré). Si **refus** → lire motif + corriger. Vérifier premières impressions/clics. **Le planificateur distant (/schedule) était KO ce jour → tâche auto non créée** ; à refaire au prochain essai, sinon contrôle manuel (procédure donnée à Vincent). État au 06-04 : C1 « en cours d'examen », C2 « enchères en apprentissage », 0 impr (normal, J+1).
- 📌 **À surveiller** : (a) sous 2-3 j → C1 *Termes de recherche* → ajouter négatifs hors-sujet ; (b) ne pas juger avant ~1 semaine (apprentissage) ; (c) bascule objectif « Ventes » + retargeting en septembre.
- 📌 **Actions Vincent** : (1) **vérifier domaine Resend `mail.villamaryllis.com`** (sinon email confirmation voyageur ne part pas — n'impacte ni débit ni tracking) ; (2) ✅ **2 dims GA4 créées 2026-06-04** (`bien_id` + `niveau_tarifaire`, portée Événement, propriété amaryllis p538182418) ; (3) **Meta Ads — reporté** (constats 2026-06-04) : ✅ **bon compte = « Amaryllis corp » act `853205825762332`** (business_id 609408700286001) ; ⚠️ affiche *« Get set up to run ads »* → **finaliser moyen de paiement** dans Account Overview (action Vincent, prérequis avant publication) ; 🔴 l'ancien compte **DIMA 308 (22171358) est RESTREINT par Meta** (« can't run ads », campagnes NZ/HU — pas le bon, ignorer) ; ⚠️ **Meta bloque l'automatisation** : sur `adsmanager.facebook.com` l'extension voit (captures) mais **les clics échouent** → **mode guidé obligatoire** (Vincent clique, Claude dicte le runbook §B). Campagne prête : objectif Trafic, ad set Amaryllis 5 €/j + Mabouya 5 €/j, textes+visuels dans `docs/marketing/RUNBOOK-lancement.md §B`.
- 📌 **Backlog tech (non urgent)** : routes explicites des 3 landings dans `main.jsx` (marchent via fallback `KNOWN` aujourd'hui).

## ✅ 2026-06-11 — Résa Laurent Maignan total=340€ < caution=500€ — VALIDÉ NORMAL
- **Constat** : `/api/coherence-check` avait remonté 2 findings `total_aberrant` sur la résa Laurent Maignan (total=340€, caution=500€).
- **Verdict Vincent (2026-06-11)** : c'est **tout à fait normal**. Un court séjour peut coûter moins que la caution (montant fixe indépendant de la durée). Aucune correction de donnée nécessaire.
- **Règle journalisée** : `total < caution` est LÉGITIME pour les courts séjours → voir LEARNINGS.md. La règle `coherenceRules.js` n'a jamais flaggé ce cas (pas de check `total < depot` dans le code) → comportement correct.

## ✅ 2026-06-11 — Rename beds24Amount → chargeAmount — DÉJÀ FAIT
- `src/PublicSite.jsx` L1340 contient déjà `const chargeAmount = ...` avec le commentaire Beds24=Nogent. Blocker stale.

## ✅ 2026-06-11 — iCal null guard checkin/checkout — DÉJÀ FAIT
- `functions/api/ical-export.js` L71-72 : `WHERE checkin IS NOT NULL AND checkout IS NOT NULL` + guard `if (!row.checkin || !row.checkout) continue`. Pas de `functions/ical/` côté locatif. Blocker stale.

## 🔴 Actions humaines (hors dashboard) en attente
- **Déclarations meublé de tourisme** (🔴 urgent, jusqu'à 12 500€ d'enjeu) — Vincent, voir `docs/legal/plan-action-declarations.md`.
- **Confirmer le report « HTTP 401 sur /admin »** (~18:00 le 03/06) — probablement auth transitoire ; Vincent confirme si reproductible.
- **Crédit Beds24** à vérifier ; **prospection netlinking** à envoyer ; **2 dims GA4 custom** à créer (bien_id, niveau_tarifaire).

## 🟡 Vérifs en attente côté Vincent (livré, non re-validé par lui)
- Sync 📊 → onglet « Toutes les Réservations » sans nouveau doublon + revenus cohérents (imports idempotents).
- Meta Pixel : confirmer le flux d'events via Meta Pixel Helper / Events Manager (les beacons /tr ne se voient pas en headless).


## ⏳ Décisions différées — à RAPPELER à Vincent quand le déclencheur est atteint
- ~~**Créer la routine planifiée `consolidation-memoire-hebdo`**~~ ✅ **CRÉÉE le 2026-06-10** (cron `0 6 * * 1`, lundi 6h MTQ).
- ~~**point-ads-hebdo**~~ ✅ **CRÉÉE le 2026-06-10** (cron `0 7 * * 1`, lundi 7h MTQ). Résumé perf Meta+Google + 1 reco actionnable.
- **Passer l'audit d'invariants BLOQUANT au deploy** (aujourd'hui non-bloquant, ADR-S-003).
  - **Déclencheur (déterministe)** : `scripts/audit-invariants.mjs` a tourné sur **≥5 déploiements** consécutifs avec **0 faux 🔴** (aucun FAIL qui se révèle erroné). Idéalement après avoir aussi corrigé les 2 findings 🟡 ouverts (doc « 557 erreurs » + prix en prose).
  - **Action quand atteint** : dans `scripts/deploy-pages.sh`, sortir `audit-invariants.mjs` du bloc non-bloquant et faire `node scripts/audit-invariants.mjs || exit 1` (ou ajouter un flag `--strict` au script qui `exit 1` sur FAIL). Mettre à jour ADR-S-003 + CLAUDE.md.
  - **Qui rappelle** : la skill `/audit` et `/cloture-session` doivent surfacer cette ligne tant qu'elle est ouverte. ➡️ **Claude : signaler ce rappel dès que tu constates ≥5 deploys propres.**


## 2026-06-05 (suite)
- 🟡 **Var dashboard Cloudflare `RESEND_FROM` du Worker = cassée** (`Amaryllis <notifications@>`, domaine manquant). Contournée par `resendFrom(env)` (code robuste, emails repartent). **Débloque** : Vincent corrige/supprime la variable dans le dashboard Worker `amaryllis-ical-sync` → conf propre. Non urgent.
- ✅ **Findings « [revue code] » LLM triagés — 2026-06-11** : 72 entrées D1 passées en revue. 4 `fixed`, 67 `ignored`, 1 faux positif → `ignored`. Inbox propre.
- ✅ **Règle de cohérence faux positif `total < caution`** → **VALIDÉ NORMAL 2026-06-11** : `total < caution` est LÉGITIME pour les courts séjours (caution = montant fixe indépendant de la durée). `coherenceRules.js` n'a jamais implémenté ce check → comportement correct, rien à corriger. Réf : LEARNINGS.md « total < caution ».

## 2026-06-07 — Post-deploy Pub/Ads

- ✅ **ical-export.js + ical/[file].js null guard** — vérifié 2026-06-11 : `WHERE checkin IS NOT NULL AND checkout IS NOT NULL` + guard `if (!row.checkin || !row.checkout) continue` déjà en place. Stale.
- 🟡 **Meta C2 MOFU sans créatif visuel** — l'annonce tourne avec texte seul. **Débloque** : ajouter une image de villa (format 1080×1080 recommandé) + texte retargeting ("Vous avez visité Amaryllis...") dans l'ad B1.
- 🟡 **Limite de dépense compte Meta €50** — alerte dans ~15 jours avec €540/mois de budget. **Débloque** : si campagnes performantes, relever la limite dans Meta Ads Manager → Paramètres du compte → Limite de dépense.

## 2026-06-07 (soir) — Redesign Tarifs : crash circularité, rollbacké

- ✅ **Smoke test deploy-pages.sh à renforcer** → **RÉSOLU 2026-06-11** : `scripts/admin-smoke.mjs` (Playwright headless `/admin`, détecte `pageerror`/`console.error`/chunks HTTP 4xx) déjà créé et branché dans `deploy-pages.sh` lignes 118-128 (non-bloquant, set `SMOKE_FAIL=1`).
- 🟢 **Mémoire à jour** : LEARNINGS.md contient la règle « zéro top-level sur imports App.jsx » (voir entrée 2026-06-07 suite).

## 2026-06-07 (soir) — Chunk périmé v2 : RÉSOLU + smoke test renforcé

- 🟡 **Cache CDN Cloudflare retient encore temporairement** les vieux chunks périmés avec leur ancien content-type `text/html` (cache immutable d'avant le fix). Pour les visiteurs qui hit ces caches, le filet client renforcé prend le relai et déclenche le reload. Le cache CDN expire naturellement avec TTL ou peut être purgé manuellement (token API Cache Purge).
- 🟢 **Anti-régression** : `scripts/deploy-pages.sh` teste maintenant un sentinel `/assets/__sentinel-stale-{ts}.js` → si HTTP 200 au lieu de 404, le smoke fail. Empêche de redéployer sans la Pages Function.

## 2026-06-08 — Rename beds24Amount → chargeAmount

- 🟡 **[basse] `beds24Amount` dans `handleBook()` (PublicSite.jsx ~l.1339)** — nom trompeur : pour les biens Martinique la valeur = `computedTotal` (pas Beds24). Fonctionnellement correct (fallback géré dans beds24-create.js) mais source de confusion à la maintenance.
- **Débloque** : renommer en `chargeAmount` + commentaire « Nogent : prix Beds24 confirmé / Martinique : calcul local ». 5 min de travail.
- **Note** : Beds24 = Nogent UNIQUEMENT — **ne jamais créer de réservation Beds24 pour un bien Martinique**.

## 2026-06-08 — Sentry : "Importing a module script failed" /amaryllis (19h08 UTC)

- 🟡 **[à surveiller]** Facebook in-app browser (iPhone, iOS 18.5) via lien fbclid → `/amaryllis`. Erreur "Importing a module script failed" = signature du chunk périmé. Fix `[[asset]].js` est déployé ET smoke test sentinel valide → probablement un cache CDN résiduel ou cache navigateur Facebook.
- **Débloque** : surveiller les 24h suivantes. Si l'erreur se répète sur d'autres users/sessions récentes (pas fbclid historique) → purger le cache CDN Cloudflare. Si isolé = bruit CDN résiduel.

## ✅ Archivé (levé — gardé pour traçabilité)
- ✅ **CLAUDE.md mentait « There are no tests »** (2026-06-04) → corrigé (vitest ~148 tests documentés).
- ✅ **PROJECT_MEMORY.md gonflait (52KB)** (2026-06-04) → dégraissé à 35KB, journal archivé.
- ✅ **Index in-repo / ADR non formalisés** (2026-06-04) → `docs/INDEX.md` + `docs/superpowers/specs/README.md` créés.
- ✅ **Hook SessionStart actif** (ADR-S-004) — injecté à chaque session depuis 2026-06-04.
- ✅ **notify-booking.js DDL `direct_bookings`** (2026-06-07) — corrigé 2026-06-11 (commit `14771f1`).
- ✅ **get-availability.js `bien_id` hardcodé** (2026-06-07) — corrigé 2026-06-11 (commit `14771f1`).
- ✅ **Crash admin Redesign Tarifs** (2026-06-07) → rollback `1b6dd02`.
- ✅ **Chunk périmé v2** (2026-06-07) → `524fb3d` + sentinel smoke test.
- ✅ **Crons hebdo créés** (2026-06-10) : `consolidation-memoire-hebdo` (lundi 6h MTQ) + `point-ads-hebdo` (lundi 7h MTQ).
