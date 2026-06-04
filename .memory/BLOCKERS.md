# BLOCKERS — Frictions, dettes & points bloquants (locatif-dashboard)

> Ce qui reviendra nous embêter si on ne le documente pas. Format : statut · sujet · ce qui débloque.
> 🔴 bloquant fort · 🟡 contourné / dette latente · ✅ levé (gardé un temps pour traçabilité).

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

## 🔄 Ports entrants de synchro — À FAIRE ICI (côté locatif) — cf. `docs/OPERATING-MODEL.md` §8
> Répartition actée 2026-06-04 : patrimoine fait ses ports de son côté ; **ces items sont le périmètre de locatif**.
- **Carte source-de-vérité déclarative** (inspiré `PATRIMOINE_SOURCE`) : formaliser quels champs sont canoniques (`src/data/biens.js`) vs pilotés Sheet, au lieu du seed ad-hoc dans `App.jsx`. **Débloque** : un module `src/data/biensSource.js` (par champ : `canon` vs `sheet`) + test d'invariant.
- **Réintégrer le lint au gate** : `npm run lint` = 0 erreur aujourd'hui → l'ajouter à `deploy-pages.sh` (et/ou la CI), corriger la mention « 557 ». Lié au déclencheur « audit bloquant ».
- **Keepalive proactif des tokens fragiles** (inspiré finary-keepalive) : cron qui ping + alerte avant expiration de `META_PAGE_TOKEN` (~60j) / Beds24. **Débloque** : un cron Worker + email/ntfy si proche expiration.
- **Monter la couverture de tests** (118 → +), priorité sur la zone à risque (miroirs, RM).
- 🤝 **CHANTIER COMMUN — drift des miroirs GAS/Worker** : 1 solution, 2 repos. **Coordination** : locatif conçoit le test de cohérence des miroirs (extrait la fonction des 2 côtés + compare la logique normalisée), puis partage le pattern à patrimoine. (Voir aussi la dette ci-dessous.)

## 🟡 Tracking `purchase` — 16 begin_checkout / 0 purchase sur 30j (data-049, 2026-06-04)
- GA4 30j : **240 view_item → 16 begin_checkout → 0 purchase → 1 generate_lead**. Donc `revenue`/`byBien`/`byChannel.revenu` du nouveau dashboard restent à 0. **Deux hypothèses** : (a) aucune résa **directe** ce mois (les résas OTA Airbnb/Booking ne passent pas par notre checkout → normal qu'il n'y ait pas de `purchase`) ; (b) trou de tracking : l'event `purchase` ne se déclenche pas sur `/merci` après paiement Stripe. **Débloque** : demander à Vincent s'il a eu des résas **directes** sur 30j. Si oui → auditer le firing de `purchase` (page `/merci`, `src/lib/` gtag/metaPixel, webhook Stripe). Si non → RAS, c'est attendu. ⚠️ Important car c'est la conversion **Principale** de Google Ads : si elle ne remonte pas, l'optim Ads est aveugle.

## 🟡 Findings audit 2026-06-04 (skill auditeur — rapport `docs/_audits/AUDIT-2026-06-04.md`)
- **Doc périmée « 557 erreurs eslint ».** CLAUDE.md + PROJECT_MEMORY justifient l'exclusion du lint par ~557 erreurs ; `npm run lint` mesure aujourd'hui **0 erreur / ~17-19 warnings**. **Débloque** : corriger le wording (et envisager de réintégrer le lint au gate puisqu'il est propre).
- **Prix en dur dans la prose marketing.** Les champs `desc` de `functions/[slug].js` écrivent « dès 110€/nuit » en texte libre (pas le champ prix, donc pas de bug de calcul, mais drift si le tarif change). **Débloque** : harmoniser à la main au prochain changement de prix.

## 🟡 Dettes techniques latentes (cassera si on oublie le contexte)
- **Drift du pattern miroir GAS/Worker.** `src/utils/{pricing,coherenceRules,resaDedup,occupancy,rmOccupancyAdjust}.js` sont **dupliqués à la main** dans `appscript/*.gs` et `workers/ical-sync/index.js` (impossible d'importer un module Node là-bas). Modifier l'util sans répercuter le miroir = bug silencieux non couvert par les tests. **Débloque** : checklist « j'ai touché un util → ai-je mis à jour le(s) miroir(s) ? » ; à terme, un test qui compare les deux implémentations.
- **Doublons de docs à arbitrer (créés avant la décision contraire de Vincent).**
  - `docs/google-ads-kit.md` est **remplacé** par `docs/marketing/campagne-google-ads-2026-06.md` (le 2e le dit en en-tête).
  - `docs/google-business-profiles-kit.md` propose de créer 2 fiches GBP Bellevue/Nogent → **contredit** la décision du 02/06 de NE PAS créer de nouvelles fiches. **Débloque** : décision Vincent → archiver les 2 dans `docs/_archive/`.
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

## 🔴 Actions humaines (hors dashboard) en attente
- **Déclarations meublé de tourisme** (🔴 urgent, jusqu'à 12 500€ d'enjeu) — Vincent, voir `docs/legal/plan-action-declarations.md`.
- **Confirmer le report « HTTP 401 sur /admin »** (~18:00 le 03/06) — probablement auth transitoire ; Vincent confirme si reproductible.
- **Crédit Beds24** à vérifier ; **prospection netlinking** à envoyer ; **2 dims GA4 custom** à créer (bien_id, niveau_tarifaire).

## 🟡 Vérifs en attente côté Vincent (livré, non re-validé par lui)
- Sync 📊 → onglet « Toutes les Réservations » sans nouveau doublon + revenus cohérents (imports idempotents).
- Meta Pixel : confirmer le flux d'events via Meta Pixel Helper / Events Manager (les beacons /tr ne se voient pas en headless).

## ✅ Levé cette session
- **CLAUDE.md mentait « There are no tests »** → corrigé (suite vitest ~148 tests documentée).
- **PROJECT_MEMORY.md gonflait (52KB)** → dégraissé à 35KB, journal archivé.
- **Pas d'index in-repo des docs / ADR non formalisés** → `docs/INDEX.md` + `docs/superpowers/specs/README.md` créés.

## ✅ À VÉRIFIER une fois — hook SessionStart actif ?
- **Vérifier que le rappel mémoire s'est bien injecté au démarrage** (hook SessionStart, ADR-S-004). **Auto-vérifiant** : si le hook marche, ce texte (`🧠 RAPPEL MÉMOIRE …`) est apparu en haut de session via `scripts/session-context.mjs`. Si tu ne l'as PAS vu → le hook ne s'est pas chargé : Vincent doit ouvrir `/hooks` une fois ou redémarrer Claude Code. ➡️ **Claude : à la prochaine session, confirme à Vincent que l'injection a eu lieu, puis retire cette ligne.**

## ⏳ Décisions différées — à RAPPELER à Vincent quand le déclencheur est atteint
- **Créer la routine planifiée `consolidation-memoire-hebdo`** (skill `/schedule`) : lundi ~6h America/Martinique → exécute `/consolidation` en mode **propose sans committer** (périmètre `.memory/` + `docs/_archive/`, jamais supprimer secret/footgun/contrainte, append/archive non destructif). **Bloqué le 2026-06-04** : le backend claude.ai des routines ne se connectait pas. ➡️ **Claude : relancer `/schedule` à la prochaine session pour finaliser ce cron.**
- **Passer l'audit d'invariants BLOQUANT au deploy** (aujourd'hui non-bloquant, ADR-S-003).
  - **Déclencheur (déterministe)** : `scripts/audit-invariants.mjs` a tourné sur **≥5 déploiements** consécutifs avec **0 faux 🔴** (aucun FAIL qui se révèle erroné). Idéalement après avoir aussi corrigé les 2 findings 🟡 ouverts (doc « 557 erreurs » + prix en prose).
  - **Action quand atteint** : dans `scripts/deploy-pages.sh`, sortir `audit-invariants.mjs` du bloc non-bloquant et faire `node scripts/audit-invariants.mjs || exit 1` (ou ajouter un flag `--strict` au script qui `exit 1` sur FAIL). Mettre à jour ADR-S-003 + CLAUDE.md.
  - **Qui rappelle** : la skill `/audit` et `/cloture-session` doivent surfacer cette ligne tant qu'elle est ouverte. ➡️ **Claude : signaler ce rappel dès que tu constates ≥5 deploys propres.**

## 📌 Prochaine session (demain matin)
- **Lancement Google Ads + Meta Ads pas-à-pas** : runbook `docs/marketing/RUNBOOK-lancement.md` ouvert, Vincent connecté à Google Ads (226-428-3778) + Meta Business Manager. **Vincent fait les clics, Claude guide.** Bloquant Google : importer la conversion `purchase` (PAS `booking_completed`) avant toute dépense.
