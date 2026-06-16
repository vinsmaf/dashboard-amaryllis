# Audit Playbook RM → Réalité — Locatif
> Généré 2026-06-16 (nuit) · 38 gaps confirmés (10 high) · vérifiés adversarialement contre le code + site live.
> Méthode : 6 auditeurs (RM-01→26) → 3 vérificateurs adversariaux re-checkant le vrai code. Faux positifs éliminés.
> ⚠️ ADVISORY : ce sont des propositions. Rien n'a été déployé/modifié. RM advisory only.

## Constat global
Le socle revenue management est solide (moteur pricing, occupancy, A/B, emails, tracking 2×). Les gaps réels sont concentrés sur la **désintermédiation** (priorité #1) : la capture de contacts voyageurs et la base repeat sont sous-exploitées, et le NET RevPAR par canal n'est pas matérialisé. Quelques vrais bugs de garde-fou (RM-20 Nogent/Martinique).

## Pricing & Yield (RM-01→05)

### RM-03 · 🔴 HIGH
Étendre runOccupancySnapshot (workers/ical-sync/index.js:896-908) pour remplir revpar_cents/adr_cents NET par bien (le NET est déjà calculé à l'ingestion dans parseBookingReservation.js:84), puis faire consommer ce signal par occupancyAdjustment (src/utils/rmOccupancyAdjust.js) — advisory only, jamais d'application auto.
- 📍 **Fix** : `workers/ical-sync/index.js:903-905 (runOccupancySnapshot — étendre pour calculer revpar_cents/adr_cents NET) ; src/utils/rmOccupancyAdjust.js + functions/api/rm-recommendations/[[path]].js:246-256 (consommer un signal NET RevPAR).`
- 🔎 *Vérif* : CONFIRMÉ. rm_kpi_snapshots a bien les colonnes revpar_cents/adr_cents/total_revenue_cents (rm-init.js:302-313), mais runOccupancySnapshot (ical-sync/index.js:903-905) n'INSERT QUE occupancy_rate/nights_sold/nights_available → revpar/adr restent NULL. occupancyAdjustment (rmOccupancyAdjust.js:9-19) n

### RM-01 · 🟡 MED
Dans functions/api/rm-recommendations/[[path]].js:234-238, pondérer l'uplift market par la capacité/unicité du bien ; côté rm-competitors/[[path]].js:232-236, le highSimMedian (similarity≥70) est déjà calculé mais sert au prix, pas à un scarcity par segment — le réutiliser pour différencier. Advisory only.
- 📍 **Fix** : `functions/api/rm-recommendations/[[path]].js:234-243 (moduler adjMarket par capacité/positioning) ; functions/api/rm-competitors/[[path]].js:232-236 (highSimMedian existe déjà — l'exploiter pour un scarcity segment-spécifique).`
- 🔎 *Vérif* : CONFIRMÉ. scarcity (rm-competitors/[[path]].js:241-246) dérive du seul availRate ; market_pressure = (1−availRate)×100 (l.239). calcDateReco applique +5% si pressure>70 (rm-recommendations/[[path]].js:234-238), uplift identique pour tous les biens. premiumPositioningPct est plat (rmConfig.js:32/43 =

### RM-02 · 🟡 MED
Dans functions/api/rm-init.js:425-426, renseigner condition_season (col. 9 du bind) sur rule_lm_7/rule_lm_14 (ex. 'low,mid' uniquement) ou créer un 2e jeu de règles ; le moteur calcDateReco supporte déjà le filtre saison (rm-recommendations/[[path]].js:126-129). Seed-only : nécessite un re-seed/migration des règles existantes.
- 📍 **Fix** : `functions/api/rm-init.js:425-426 (ajouter condition_season aux règles lead-time) ; idem miroir src/lib/pricingEngine.js:91-101.`
- 🔎 *Vérif* : CONFIRMÉ. Ordre des colonnes rm_pricing_rules vérifié (rm-init.js:65-85) : condition_season est la 9e. Le bind de rule_lm_7 (l.425) et rule_lm_14 (l.426) passe null en position 9 → pas de filtre saison. Le moteur LIT pourtant condition_season (rm-recommendations/[[path]].js:126-129) — c'est juste no

### RM-03 · 🟡 MED
Décider la source de vérité : soit supprimer src/lib/pricingEngine.js + src/lib/minStayEngine.js (morts, vérifié : zéro import prod), soit les promouvoir et retirer calcDateReco. Aligner aussi la source des base_prices (rmConfig.js PROPERTY_CONFIGS en dur vs rm_properties D1). À faire AVANT RM-01/02/04 pour ne pas coder dans le mauvais moteur.
- 📍 **Fix** : `src/lib/pricingEngine.js + src/lib/minStayEngine.js (code mort — supprimer ou promouvoir comme moteur unique) ; clarifier la source unique des base_prices entre rmConfig.js (en dur) et rm_properties (D1).`
- 🔎 *Vérif* : CONFIRMÉ. grep 'pricingEngine' et 'minStayEngine' hors tests = 0 import en prod (functions/, src/, workers/). Le moteur déployé est calcDateReco dans rm-recommendations/[[path]].js. pricingEngine.js a bien une logique plus riche (lead-time, market signal data_confidence>=40, premium) divergente du d

### RM-04 · 🟡 MED
Dans workers/ical-sync/index.js:runGapPricing (l.1604-1615), distinguer gapLen===1 (orphan) et émettre un flag dédié + suggestion d'abaissement min-stay ; brancher la logique findGaps de src/lib/minStayEngine.js (actuellement morte) dans calcDateReco au lieu de laisser adjGapFill=0 (rm-recommendations/[[path]].js:257). Advisory only.
- 📍 **Fix** : `src/lib/minStayEngine.js (code mort — câbler findGaps dans calcDateReco) ; functions/api/rm-recommendations/[[path]].js:257-258 ; workers/ical-sync/index.js:1609 (distinguer gapLen===1 = orphan).`
- 🔎 *Vérif* : CONFIRMÉ. rm-recommendations/[[path]].js:257-258 contient bien le commentaire 'adjGapFill stays 0' et la valeur reste 0. runGapPricing (ical-sync/index.js:1591-1623) décote 1-2 nuits=−25%, 3-4=−15%, jamais de traitement orphan spécifique ni d'abaissement min-stay. grep confirme : minStayEngine.js et

### RM-05 · ⚪ LOW
Créer un calc displacement advisory (nouvel endpoint ou agent) projetant le RevPAR CT d'Iguana en high/peak vs le loyer net Joël Bailleul, déclenché à T-90j de l'échéance. NUANCE : RM-05 figure déjà comme INSTRUCTION dans le prompt fleet (agents-run.js:37) mais n'a aucune implémentation code — c'est de l'advisory LLM, pas un calcul.
- 📍 **Fix** : `Nouveau calc displacement (revenu CT projeté via profils saisonniers high/peak × occupation comparable Amaryllis/Zandoli) vs loyer annuel bail, déclenché à T-90j. À greffer en advisory. Donnée d'échéance bail à sourcer (Rentila, signé oct 2024).`
- 🔎 *Vérif* : CONFIRMÉ avec nuance. Iguana figé : rm-init.js:334 (60000 flat, min_stay 30) et rmConfig.js:68-78 (basePrices 600 partout, tous uplifts 0). Aucune logique de displacement codée. L'audit prétend 'grep displacement|renouvel|bail = 0' — INEXACT : agents-run.js:37 contient 'RM-05 Displacement Iguana...'


## Désintermédiation & Direct (RM-06→11)

### RM-10 · 🔴 HIGH
Ajouter colonne phone à direct_bookings (DDL notify-booking.js:31), la binder dans l'INSERT (notify-booking.js:132-133) et l'upsert (stripe-webhook.js:332-339) à partir de meta.phone déjà disponible. Migration ALTER TABLE pour les lignes existantes.
- 📍 **Fix** : `functions/api/notify-booking.js:31-37 (DDL) + l.132-133 (INSERT) ; functions/api/stripe-webhook.js:332-339 (upsert).`
- 🔎 *Vérif* : CONFIRMÉ. DDL direct_bookings (notify-booking.js:31-47) : colonnes payment_intent_id/bien_id/bien_nom/voyageur/prenom/email/total/depot/checkin/checkout/...+flags, AUCUN phone. INSERT (l.132-133) bind email mais pas tél. stripe-webhook upsert (l.332-339) idem. meta.phone n'apparaît qu'en l.454/532 (

### RM-10 · 🔴 HIGH
Étendre parseAirbnbMail.js (actuellement n'extrait que guestName/dates/montant, l.98-110) pour capter email/tél quand présents dans le mail, et router dans une table contacts depuis enrich-from-emails.js:34-44. NB : Airbnb masque souvent l'email réel (alias relais) — capacité réelle à vérifier sur des mails échantillons.
- 📍 **Fix** : `functions/api/enrich-from-emails.js:34-44, src/utils/parseAirbnbMail.js (à étendre pour extraire le contact), nouvelle table/colonnes contacts.`
- 🔎 *Vérif* : CONFIRMÉ. enrich-from-emails.js:38-39 construit entry = {bienId, checkin, checkout, voyageur, montant} uniquement, envoyé via proxy 'enrichReservation' vers la Sheet. parseAirbnbMail.js extrait guestName (l.98-110) mais aucun email/tél. La table contacts (contact.js) n'est alimentée que par le formu

### RM-10 · 🔴 HIGH
Ajouter un segment 'past_guests' dans send-bulk-email.js (SELECT email,prenom FROM direct_bookings, déjà la table) entre les branches l.55-82, et un cron saisonnier déclenchant newsletter-hiver (déjà déclaré ALLOWED dans send-guest-email.js:21) vers cette audience.
- 📍 **Fix** : `functions/api/send-bulk-email.js:55-82 (ajouter audience 'past_guests' depuis direct_bookings), template newsletter-hiver (send-guest-email.js:21), cron Worker saisonnier.`
- 🔎 *Vérif* : CONFIRMÉ. send-bulk-email.js gère 3 segments : custom (l.56), hot_carts/all_carts (l.64-78, SELECT sur abandoned_carts), sinon erreur (l.80-81). Aucun SELECT sur direct_bookings. direct_bookings n'est lu par le worker que pour pousser vers la Sheet (ical-sync/index.js:1339), pas pour du marketing. n

### RM-06 · 🟡 MED
Connecter Google Search Console (TODO déjà tracé : agents-actions.js traf-005, SEOAuditTab.jsx:180) et ajouter une dimension 'requêtes de marque' dans functions/api/seo-report.js (qui aujourd'hui ne suit que le trafic organique GA4, cf. l.4-7).
- 📍 **Fix** : `Connecter GSC (data source), functions/api/seo-report.js (ajouter dimension requêtes de marque), tableau de bord SEO admin.`
- 🔎 *Vérif* : CONFIRMÉ. seo-report.js:4 dit explicitement suivre le trafic organique GA4 'meilleur signal que les impressions Search Console' et contourner SC. GSC listé NON FAIT dans agents-actions.js:116 (traf-005) et SEOAuditTab.jsx:180 (id gsc, impact 🔥🔥🔥). Aucun suivi brand-search/requête de marque trouvé.

### RM-08 · 🟡 MED
Remplacer la saisie manuelle 'mkt' localStorage (CpaCanalTab.jsx:63,90) par un CAC réel = dépense pub réelle Google/Meta ÷ résas directes attribuées (via getAttributionMetadata posé sur le PaymentIntent, PublicSite.jsx:6068), pour calculer le CAC par canal/résa et vérifier la règle des 50%.
- 📍 **Fix** : `src/tabs/CpaCanalTab.jsx (croiser dépense pub réelle avec résas directes attribuées via attribution metadata), functions/api/analytics.js / seo-report.js.`
- 🔎 *Vérif* : CONFIRMÉ. CpaCanalTab.jsx:110-119 calcule un seuil basé sur ADR moyen × airbnbComm('amaryllis'), affiché l.214-220 ('coûte moins que la commission Airbnb évitée'). Le coût mkt vient d'un useState/localStorage MANUEL (l.63,66,90 : mktCost=Number(mkt[canal])) ; cpaMkt=mktCost/count (l.95) = divide gro

### RM-11 · 🟡 MED
Étendre functions/api/promo-codes.js (aujourd'hui codes manuels admin) pour générer un code parrainage auto + récompense, l'injecter dans public/email-templates/post-sejour.html (qui a déjà un CTA 'Revenir en direct' l.122-126 mais aucun code), créditer à l'usage côté stripe-webhook.
- 📍 **Fix** : `functions/api/promo-codes.js (étendre : code parrainage auto + récompense), public/email-templates/post-sejour.html (injecter code/lien), functions/api/stripe-webhook.js (crédit à l'usage).`
- 🔎 *Vérif* : CONFIRMÉ. grep parrain/referral/filleul/RETOUR10 → uniquement skill prompts (_skills.js:19-20, agents-run.js:44 = ligne de playbook LLM) et AnalyticsTab.jsx:158 (couleur GA4 medium=referral, sans rapport). promo-codes.js = admin Bearer/secret only. post-sejour.html (l.11/114-126) a un encart 'en dir


## Conversion & Persuasion (RM-12→15)

### RM-13 · 🔴 HIGH
Supprimer le fallback `bien.avis` dans src/PublicSite.jsx (l.4672) : n'afficher le bloc avis QUE si voyageurRevs ou googleRevs réels existent, et retirer le mot 'vérifiés' (l.4700) tant que le compte n'est pas sourcé. Fix : src/PublicSite.jsx l.4656-4701 + supprimer les tableaux `avis:` l.313-645.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ. src/PublicSite.jsx l.313-645 contient 7 tableaux `avis:[...]` codés en dur, tous note:5, noms/pays/dates plausibles mais inventés (Sophie M. 🇫🇷, James K. 🇬🇧, etc.). Le rendu l.4661-4681 utilise les VRAIS avis Airbnb (voyageurRevs via /api/voyageur-feedback) SI dispo, sinon retombe sur `(bi

### RM-15 · 🔴 HIGH
Appeler trackConversion('cta_label') ET trackConversion('hero_amaryllis') dans src/Merci.jsx au moment du purchase confirmé (réutiliser le guard ga_purchase_fired_<pi> pour éviter le double comptage). Fix : src/Merci.jsx ~l.115.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ. grep trackConversion = 3 appels réels seulement : l.3805 (clic CTA header), l.5004 (clic CTA calendrier), l.6453 (hero_amaryllis sur scroll 50%). src/Merci.jsx émet bien un GA4 `purchase` (l.115) à la confirmation de paiement mais N'appelle PAS trackConversion → l'event ab_conversion n'est

### RM-13 · 🟡 MED
Étendre le useEffect Google (src/PublicSite.jsx l.3420-3427) aux biens rattachés à la Résidence : fetch `/api/google-reviews?place=residence` pour zandoli/geko/mabouya quand isGoogleReview(bien.id) est vrai. Fix : src/PublicSite.jsx l.3420-3427.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ. src/PublicSite.jsx l.3421-3427 : `if (bien.id !== 'amaryllis') return;` — le fetch /api/google-reviews ne tourne que pour Amaryllis. src/data/googleReview.js confirme que zandoli/geko/mabouya pointent vers RESIDENCE_REVIEW (fiche GBP Résidence partagée existante), donc des avis Google réel

### RM-13 · 🟡 MED
Pour bien.rating < 4.7 (zandoli, mabouya), mener par le meilleur verbatim réel et atténuer le badge chiffré (le garder accessible, pas en hero). Fix : src/PublicSite.jsx RatingBadge l.3164/3787/3894 + entête l.4699-4701, conditionné sur bien.rating.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ sur le mécanisme, mais chiffres de l'audit partiellement erronés. RatingBadge est rendu inconditionnellement à 3 endroits (src/PublicSite.jsx l.3164, 3787, 3894) + l'entête 'avis vérifiés' l.4700, toujours avec bien.rating/bien.reviews, sans aucune logique <4,7 (le seul '4.7' du fichier est

### RM-12 · ⚪ LOW
Caler le coefficient sur le vrai taux de service voyageur observé et le différencier Martinique vs Nogent (idéalement un champ par bien). Fix : src/PublicSite.jsx l.4756/4862 (et 0.15 l.4153/4587/4993/5812).
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ et conforme ADR (dérivé de la source unique bien.prix, multiplicateur d'AFFICHAGE seulement, jamais réinjecté dans le calcul du total). src/PublicSite.jsx l.4756/4862 `airbnbPrice = Math.round(bien.prix * 1.142)` ; l.4153/4587/4993/5812/3128 économie ~15% du total. Constante uniforme appliq

### RM-14 · ⚪ LOW
Aucune action. Préserver le pattern dérivé-du-calendrier ; ne pas introduire de compteur d'avis/urgence synthétique. Fichier de référence : src/PublicSite.jsx l.2796-2890.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ CONFORME (le finding 'applied' est exact). src/PublicSite.jsx useAvailBadge l.2796-2890 : fetch /api/get-availability (iCal Airbnb+Booking fusionnés) → blocked = new Set(data.blockedDates). Tous les badges/nudges ('Quelques dates libres' si blocked30<10, 'Très demandé en X' si >80% bloqué, 

### RM-15 · ⚪ LOW
Documenter un seuil minimal de résas/variant avant lecture et exposer le compte par variante (listActiveVariants existe déjà) dans l'admin pour éviter une décision UX prématurée. Fix : src/utils/abTest.js + un petit panneau admin.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ. src/utils/abTest.js : la règle 'pas d'arrêt avant 14j OU 2× taille minimale' + 'définir AVANT KPI + critère d'arrêt' n'existe qu'en commentaire d'entête (l.33-38). Aucune fonction ne calcule la taille d'échantillon ni ne garde un test endormi. Pas de cockpit n/variant ni p-value. Sur un si


## Expérience & Fidélisation (RM-16→19)

### RM-18 · 🔴 HIGH
Dans functions/api/whatsapp.js (avant/après logConversation l.156-176), détecter des mots-clés d'irritation → push ntfy haute priorité à l'hôte + flag 'plainte' en log ; optionnellement table recovery_tickets pour mesurer le SLA. Fix : functions/api/whatsapp.js l.200-240.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ ABSENT. RM-18 (process chronométré + escalade humaine) n'existe qu'en prompt (agents-run.js, _skills.js responsable-service-client). functions/api/whatsapp.js : fonctions detectBien, fetchGuide, buildSystemPrompt, sendWhatsAppMessage, logConversation — mais grep ntfy|escalad|plainte|réclam|

### RM-19 · 🔴 HIGH
Créer une vue/table D1 `guests` (clé email normalisée) agrégeant direct_bookings (nb_sejours, biens, dernier séjour), consommée par send-poststay.js pour segmenter le CTA rebooking. DB init dans rm-init.js. Fix : rm-init.js + functions/api/send-poststay.js.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ ABSENT. Le schéma direct_bookings (send-poststay.js l.154-159, send-prearrivee.js l.46-51, create-payment-intent.js) est clé par payment_intent_id ; il stocke email/prenom mais aucun flag repeat. grep returning|repeat|times_stayed|nb_sejour|GROUP BY email sur functions/ = 0 hit hors prompts

### RM-16 · 🟡 MED
Ajouter un cron 'arrivées du jour J-1' poussant ntfy à l'hôte avec la liste des arrivées + flag prioritaire si bien.rating < 4.7 (lecture src/data/biens.js). Fix : nouveau cron léger ou extension de send-prearrivee.js + push ntfy hôte.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ ABSENT. RM-16 ('1 geste humain par arrivée, prioriser notes planchers') n'existe qu'en prompt (agents-run.js, _skills.js J-7 'pack romantique'). functions/api/send-prearrivee.js (J-3) envoie un email générique identique pour tous les biens (vars l.63-71), sans variable 'geste' ni lecture de

### RM-17 · 🟡 MED
Pour les résas directes, faire de Google le CTA unique/dominant : supprimer le bouton 'Airbnb' (ou le remplacer par un lien secondaire texte) dans post-sejour.html, et ne plus passer lien_avis_airbnb dans send-poststay.js l.173. Fix : public/email-templates/post-sejour.html l.88-98 + functions/api/send-poststay.js l.173.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ. functions/api/send-poststay.js l.172-173 passe pour les résas DIRECTES `lien_avis_google` ET `lien_avis_airbnb: 'https://villamaryllis.com/avis'`. public/email-templates/post-sejour.html l.77-98 rend 2 boutons strictement 50/50 (width=50%) : 'Laisser un avis Google' (navy #1f2a3d) + 'Laiss

### RM-17 · 🟡 MED
Faire lire le param `score` par src/Avis.jsx et POSTer vers un endpoint qui persiste le NPS (ex. voyageur-feedback action=nps ou table dédiée) ; router détracteur→formulaire privé, promoteur→Google. Fix : src/Avis.jsx (l.266) + nouvel action dans functions/api/voyageur-feedback.js + send-poststay.js l.114-118.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ ABSENT. send-poststay.js l.114-118 génère des boutons NPS 0-10 → `${npsUrl}?score=${n}&bien=...` avec npsUrl=NPS_BASE_URL='https://villamaryllis.com/avis' (l.41). MAIS src/Avis.jsx ne lit que le param `bien` (l.266), jamais `score` (grep score/searchParams sur Avis.jsx → 1 seul hit, sur bie

### RM-19 · 🟡 MED
Ajouter un cron J+30 (send-poststay variant) injectant un code repeat à usage unique (table promo_codes existante) dans le mail des voyageurs identifiés, après validation de Vincent. Fix : nouveau cron + functions/api/send-poststay.js + post-sejour.html (bloc code).
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ ABSENT. RETOUR10 et l'email J+30 rebooking n'apparaissent QUE dans le prompt CRM (_skills.js, template théorique). migrations/0002_promo_codes.sql = table promo_codes générique (codes admin ad hoc), aucun code repeat seedé. Les emails post-séjour réels (post-sejour.html 'Revenir en direct' 

### RM-16 · ⚪ LOW
Exposer un helper côté code lisant bien.rating (src/data/biens.js, déjà importable par les Functions) pour brancher un seuil <4,7 réutilisé par RM-13 (bascule verbatim) et RM-16 (geste ciblé). Fix : src/data/biens.js (helper) consommé par send-prearrivee.js + src/PublicSite.jsx.
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ (l'audit était 'unknown', maintenant tranché). Valeurs RÉELLES src/data/biens.js : amaryllis 4.94, zandoli 4.5, iguana 4.75 (hors scope), geko 4.83, mabouya 4.55, schoelcher 4.8, nogent 4.8. Les notes plancher de l'audit (mabouya 4.55, zandoli 4.5) sont exactes. Mais aucune logique ne lit b

### RM-17 · ⚪ LOW
Tracer dans AGENDA la création des fiches GBP Bellevue (Schœlcher) + Nogent, puis remplacer les 2 URLs par leur writereview Place ID. Fix : functions/api/send-poststay.js l.34-35 (+ src/data/googleReview.js à garder synchro).
- 📍 **Fix** : `?`
- 🔎 *Vérif* : CONFIRMÉ. functions/api/send-poststay.js l.34-35 : schoelcher et nogent → fallback 'https://villamaryllis.com/avis' (commentaire l.30-33 : pas encore de fiche GBP dédiée). Les Place IDs ne couvrent que la fiche Villa (Amaryllis) + une fiche Résidence partagée (zandoli/geko/mabouya/iguana). 2 biens s


## Distribution & Positionnement (RM-20→22)

### RM-20 · 🔴 HIGH
Dans src/PublicSite.jsx findFreeAlternatives L3293, ajouter au filtre `&& isMartiniqueCanon(b) === isMartiniqueCanon(current)` (import déjà présent L16) pour ne jamais proposer Nogent à une fiche Martinique et vice-versa ; bonus : trier par proximité de capacité. Effort S.
- 📍 **Fix** : `src/PublicSite.jsx — findFreeAlternatives (3285-3329) : ajouter un guard isMartinique(current)===isMartinique(candidate) + tri par proximité de capacité`
- 🔎 *Vérif* : VÉRIFIÉ avec PRÉCISION. findFreeAlternatives L3285-3329 : candidates = tous les biens sauf currentBienId et BOOKING_DISABLED (Iguana exclu — garde-fou Iguana respecté). Le tri L3322-3327 trie par `a.bien.lieu === current.lieu` puis prix — il ne FILTRE pas par île, donc Nogent EST éligible pour une f

### RM-20 · 🟡 MED
Ajouter une card/section 'villa signature' Amaryllis en tête de la grille home (src/PublicSite.jsx ~L9242) OU forcer Amaryllis en 1re position du tri (L8954-8964) hors contexte IDF — à valider par A/B test plutôt qu'en aveugle.
- 📍 **Fix** : `src/PublicSite.jsx — HeroBrand (6436) + section #properties (~9242) + tri filtered (8954-8964) + BienCard (2895)`
- 🔎 *Vérif* : VÉRIFIÉ. HeroBrand existe (L6436). Grille home : filtered.map(b => BienCard) L9242, cards uniformes. Le tri (L8954-8964) est strictement géo : `if (geo.isIDF) return a.id==='nogent' ? -1 : ...` — aucune mise en tête d'Amaryllis. grep phare/featured/fleuron/vedette = 0 (les hits 'signature' L7582+ co

### RM-22 · 🟡 MED
Soit monter MaillageCluster sur la home, soit affûter le wording de src/components/seo/MaillageCluster.jsx L57/L62 ('Nos villas à Sainte-Luce' plutôt que 'Dans le secteur') ; la section home #offre-groupee couvre déjà le combo>8 donc éviter la redondance.
- 📍 **Fix** : `src/PublicSite.jsx home (~9242) : ajouter un bloc cluster Sainte-Luce ; src/components/seo/MaillageCluster.jsx L57/L62 : wording orienté moat`
- 🔎 *Vérif* : VÉRIFIÉ. MaillageCluster importé (L15), monté seulement L5108 (fiche) + L8930 (guide plages) — absent de la home (le rendu home #offre-groupee L9285 est une AUTRE section, orientée groupe>8, pas le cluster des 4 biens). Wording 'Dans le secteur' (L57) / 'Où loger dans le secteur' (L62) confirmé. CLU

### RM-21 · ⚪ LOW
Opportunité growth (non urgente) : tester un angle 'réservez en direct depuis la métropole' (bloc home + guide retour-au-pays) — à valider d'abord par la donnée GA4 (part de trafic métropole→Martinique récurrent) avant d'investir en copy/dev.
- 📍 **Fix** : `Absent — à créer : bloc/hub home + angle copy hero/QuickBook + guide dédié ciblant le retour au pays`
- 🔎 *Vérif* : VÉRIFIÉ (absence factuelle confirmée). Aucun positionnement commercial diaspora dans src/. Les 2 seuls hits sont du contenu informatif (FAQ formalités, libellé saison). MAIS j'abaisse à severity LOW : (1) l'audit AFFIRME que la diaspora est 'la cible n°1 du direct' sans preuve dans le repo — c'est u

### RM-21 · ⚪ LOW
Petite itération UX (faible priorité) : ajouter un champ `segment` par bien dans src/data/biens.js + badge sur BienCard (src/PublicSite.jsx L2895) ; les THEME_FILTERS capacité couvrent déjà l'essentiel.
- 📍 **Fix** : `src/PublicSite.jsx — descFull des biens (256+) + BienCard (2895) : ajouter un 'segment dominant' affiché par card`
- 🔎 *Vérif* : VÉRIFIÉ. THEME_FILTERS L8944-8952 confirmé : famille=capacite>=5, couple=capacite<=2, + vue-mer/piscine/géo. Les descs portent un angle persona ponctuel (Mabouya L488-491 'couples', Zandoli L328 'familles, couples ou amis'). Pas de champ structuré 'segment dominant' par bien ni d'affichage card. Fin

### RM-22 · ⚪ LOW
Aucune action — point fort confirmé. Garder l'invariant : ne jamais inclure Iguana (bail long) ni Nogent dans les combos groupe Sainte-Luce.
- 📍 **Fix** : `src/PublicSite.jsx GroupBookingBuilder (5837+), home #offre-groupee (~9285) ; fonctionnel en prod`
- 🔎 *Vérif* : VÉRIFIÉ ET CONFIRMÉ 'applied'. Page live HTTP 200 (curl). Stripe single-payment groupé confirmé (L6068, metadata type:group + bienIds), alerte hôte L6090. Section home L9285-9295. Combos dispo réels L5581-5609 (cap >= gFilter). GARDE-FOUS RESPECTÉS : le combo groupe utilise strictement Zandoli/Géko/


## Systèmes & Scalabilité (RM-23→26)

### RM-25 · 🔴 HIGH
Mode brouillon : faire écrire runGapPricing/runYieldPricing dans une clé KV `gap_prices_pending` + email récap avec bouton 'appliquer', OU au minimum exclure Amaryllis de la boucle gap/yield ET ajouter la vérif price_min dans runGapPricing (workers/ical-sync/index.js L1591-1623, aujourd'hui sans plancher).
- 📍 **Fix** : `workers/ical-sync/index.js (runGapPricing L1591, runYieldPricing L1633, cron L2310-2311) + src/PublicSite.jsx L1966-1998`
- 🔎 *Vérif* : VÉRIFIÉ contre le code. Cron `0 9 * * *` exécute bien runGapPricing+runYieldPricing (L2293-2311) sans dry-run. gap_prices écrit en KV (L1619/1749), servi public (/gap-prices L2517), consommé live par le widget (PublicSite.jsx L1966-1998 setDailyPricesMap). NUANCE IMPORTANTE qui RENFORCE le finding :

### RM-23 · 🟡 MED
Généraliser send-menage-alert.js aux biens Martinique (param bienId + destinataire prestataire par bien) pour répliquer le modèle Nesrine/Nogent ; documenter un backup opérateur Martinique dans docs/sla-reponse.md.
- 📍 **Fix** : `functions/api/send-menage-alert.js (généraliser aux biens Martinique / par bien) + docs/sla-reponse.md (documenter backup opérateur Martinique)`
- 🔎 *Vérif* : VÉRIFIÉ. send-menage-alert.js : PROP_ID='158192' figé (L17), labellisé Nogent uniquement (L5, L27). admin-auth.js : rôle 'menage' bien présent (L65-67). Worker runReminders (L348) : le canal ménage Martinique = WhatsApp via CallMeBot (sendWhatsApp L163) + checklist texte (L484-493) à J-1, PAS un ema

### RM-24 · 🟡 MED
Ajouter dans src/tabs/MenageTab.jsx un champ items-checklist + upload photo (binding R2) horodaté, et un flag `rotation_validee` ; mais effort L — à arbitrer vs ROI (volume de litiges caution réels d'abord).
- 📍 **Fix** : `src/tabs/MenageTab.jsx (à enrichir : items checklist + upload photo R2 horodaté + flag bloquant) ; docs/checklist-etat-des-lieux.md (source à digitaliser)`
- 🔎 *Vérif* : VÉRIFIÉ. MenageTab.jsx = 133 lignes, ne contient que `menage_done` (toggle bool, L18) et `assigne` (texte libre, L42-44). grep upload/R2/photo/input file = 0 résultat dans le fichier. docs/checklist-etat-des-lieux.md existe bien (papier). Le toggle n'a aucun effet sur le calendrier (juste un flag vi

### RM-26 · 🟡 MED
Créer docs/runbooks/ avec 4 fiches (cyclone, double-booking, no-show, Stripe down) ; pour le double-booking, documenter le flux de résolution déclenché par coherence-check.js (qui déplacer, barème compensation, remboursement Stripe).
- 📍 **Fix** : `Créer .memory/RUNBOOKS.md ou docs/runbooks/ (cyclone, double-booking, no-show, Stripe down) ; relier au coherence-check existant pour le double-booking`
- 🔎 *Vérif* : VÉRIFIÉ. .memory/ ne contient pas RUNBOOKS.md (ls : ADR/BLOCKERS/CONTEXT/DECISIONS/INDEX/ITERATIONS_LOG/LEARNINGS/RECALL). docs/runbooks/ n'existe pas. Seuls runbooks réels = runbook-rotation-tokens.md + marketing/RUNBOOK-lancement.md (ni l'un ni l'autre = crise opé). coherence-check.js Check 4 (ove

### RM-26 · 🟡 MED
Fusionner dans le runbook cyclone (finding RM-26 précédent) un tier 'crise corrélée Sainte-Luce' : ~4 biens réservables corrélés (Iguana hors scope CA car bail long), communication de masse voyageurs, contacts techniciens groupés.
- 📍 **Fix** : `docs/sla-reponse.md (ajouter tier 'crise corrélée multi-biens') + futur runbook cyclone`
- 🔎 *Vérif* : PARTIELLEMENT VÉRIFIÉ. La concentration géographique Sainte-Luce est réelle et structurante (5 biens corrélés). docs/sla-reponse.md existe (vu via ls). Nuance garde-fou : Iguana (bookable:false, bail long Joël Bailleul) compte dans la concentration PHYSIQUE/sinistre mais PAS dans le risque CA locati
