# PROJECT_MEMORY — Amaryllis Locations (villamaryllis.com)

> Mémoire long terme du projet. Complète `CLAUDE.md` (architecture technique de référence).
> Ici : état, décisions, contraintes de Vincent, faits opérationnels (crons, secrets, IDs), pièges, et historique.
> **Tenir à jour** à chaque session significative (ajouter en bas la date + ce qui a changé).
> Dernière mise à jour : **2026-06-04**.
>
> 🧭 **Index de toute la doc → `docs/INDEX.md`** · 🏛️ **Décisions d'architecture (ADR) → `docs/superpowers/specs/README.md`** · 🚨 **Erreurs & garde-fous → `docs/ERREURS-LOG.md`** · 🗄️ **Journal historique → `docs/_archive/`**.

---

## 1. Le projet en une phrase
Conciergerie + site de réservation directe pour **7 logements** (Martinique + Nogent-sur-Marne), avec un **site public marketing** (villamaryllis.com) et un **dashboard admin** privé (cartographie de flux, dark theme), opéré par **Vincent Salomon**.

### Les 7 biens (nomenclature STRICTE — ne jamais confondre)
| Bien | Type (mot exact) | Lieu | Prix base | Capacité |
|---|---|---|---|---|
| Amaryllis | **villa** | Sainte-Luce | 280 €/nuit | 8 |
| Iguana | **villa** | Sainte-Luce (Résidence Amaryllis) | 180 € | 6 |
| Zandoli | **logement** (PAS villa) | Sainte-Luce | 220 € | 5 |
| Géko | **cocon** (PAS villa) | Sainte-Luce | 150 € | 4 |
| Mabouya | **studio** (jacuzzi) | Sainte-Luce | 110 € | 2 |
| Bellevue / Schœlcher | **appartement de standing** | Schœlcher (œ ligature) | 100 € | — |
| Nogent | **appartement** | Nogent-sur-Marne (94) | 85 € | — |

- **Seuls Amaryllis et Iguana sont des « villas ».** Le fact-checker (`functions/api/_factcheck.js`) rejette « villa Zandoli/Géko/Mabouya/Bellevue ».
- Offre **groupée** : coupler Zandoli + Géko + Mabouya (et Iguana) → jusqu'à **11 pers** via `/location-groupe-sainte-luce`.
- Le cluster Sainte-Luce est physiquement la **« Résidence le Clos de Bellevue, Chem. Bois Grillé, 97228 Sainte-Luce »** (adresse réelle GBP Villa Amaryllis) / **quartier Montravail, 1170, 97228 Sainte-Luce** (adresse GBP Résidence).

---

## 2. URLs, comptes, déploiement
- **Prod** : https://villamaryllis.com (Cloudflare Pages, projet **`dashboard-amaryllis`**, account `3c031c79a864a3e1f0d8c17c433b2247`). Alias : dashboard-amaryllis.pages.dev.
- **Repo** : github.com/vinsmaf/dashboard-amaryllis · local `/Users/vincentsalomon/locatif-dashboard`.
- **Déploiement** : `npm run deploy:pages` = **gate tests vitest** (bloque si rouge, `SKIP_TESTS=1` pour bypass) → `wrangler pages deploy dist` → **smoke test** + revue code + crawl. ⚠️ **Ne build PAS** : il déploie `dist/` tel quel → **faire `npm run build` AVANT** (sinon dist périmé déployé). ⚠️ **JAMAIS** déployer sur `patrimoine-dashboard` (autre projet Claude, garde-fou dans `scripts/deploy-pages.sh`).
- **Filet de tests (03/06, chantier 2 Robustesse)** : suite vitase **118 tests** ; gate au déploiement. Calculs argent voyageur extraits+testés : `src/utils/pricing.js` (getDiscount/discountLabel/computeStayTotal ← ex-PublicSite) + `pricing.test.js` ; `canauxCommissions.test.js` (taux canal/bien + net). Spec/plan : `docs/superpowers/{specs,plans}/2026-06-03-filet-tests-gate*`.
- **Contrôles de cohérence (03/06, chantier 2)** : moteur pur `src/utils/coherenceRules.js` (`checkReservations` : dates_invalides / total_aberrant / bien_inconnu / double_booking) + tests ; endpoint cron **`/api/coherence-check?secret=POSTSTAY_SECRET`** (`?dry=1` simule) lit `direct_bookings`, écrit les findings dans l'inbox `client_errors` (`kind:"coherence"`, visibles onglet 🐞 Bugs) + push **ntfy** si double-booking. **🔴 ACTION VINCENT : créer le cron quotidien** sur cron-job.org → `GET https://villamaryllis.com/api/coherence-check?secret=<POSTSTAY_SECRET>`. Source phase 1 = `direct_bookings` ; phase 2 (à faire) = injecter résas Sheet/Beds24/iCal dans le même moteur. Spec/plan : `docs/superpowers/{specs,plans}/2026-06-03-coherence-checks*`. **Le cron tourne déjà** (greffé dans le Worker `0 9 * * *`, pas besoin de cron-job.org).
- **Imports idempotents (03/06, chantier 2)** : `importAllReservations_` (SCRIPT_SHEETS.js) ET le memo revenus (`scanSheet_`/`baselineSheet_` de REVENUS_AUTO_2026.gs) dédupliquent désormais par **clé-contenu `bienId|checkin|checkout`** (en + de l'id) → tue la classe « même nuitée comptée 2-3× » (ex. ami coco). Logique pure testée `src/utils/resaDedup.js` (`dedupKey`/`normDate`/`dedupeReservations`) **mirroir** des helpers GAS `dedupKey_`/`contentKeyRow_` (⚠️ garder synchro). Locale FR = déjà OK (1 seul setFormula, déjà `.replace(".",",")`). **Déployé via clasp** (push + deploy @32). **🔴 VÉRIF VINCENT** : un sync 📊 → onglet « Toutes les Réservations » sans nouveau doublon + revenus cohérents ; **rollback** = `git checkout <SHA> -- appscript/ && clasp push -f && clasp deploy -i <id>`. Spec/plan : `docs/superpowers/{specs,plans}/2026-06-03-imports-idempotents*`.
- **CI GitHub (03/06, chantier 3)** : `.github/workflows/ci.yml` — sur push/PR `main` : `npm run test:run` + `vite build` + `prerender` + `wrangler pages functions build`. Complète le gate de `deploy-pages.sh` (attrape les régressions dès le commit). **Lint exclu** (code historique = 557 erreurs eslint → nettoyage = chantier séparé). ⚠️ **Cloudflare Pages = upload direct via wrangler, PAS connecté à GitHub** (preuve : origin/main était 70 commits en retard alors que la prod était à jour) → pousser sur GitHub ne déclenche AUCUN déploiement CF, juste la CI.
- **Worker iCal** séparé : `npx wrangler deploy` (`amaryllis-ical-sync`).
- **Occupation réelle → RM (03/06, phase 1 « voir »)** : le Worker calcule l'occupation forward par bien (**30j/90j** = nuits réservées iCal / horizon) dans `runOccupancySnapshot` (cron `0 9 * * *`) et **persiste dans `rm_kpi_snapshots`** (binding D1 `revenue_manager`, `period_type` ∈ '30d'/'90d', `calculated_at` NOT NULL requis). Exposé par `rm-dashboard.js` (`occupancy:{d30,d90}`) + badge dans `RevenueManagerPro.jsx`. Calcul pur testé `src/utils/occupancy.js` (mirroir inline Worker). **Trigger manuel** : `GET <worker>/occupancy-snapshot?token=<WORKER_SECRET>` (sinon peuplé au cron 9h UTC). Spec/plan : `docs/superpowers/{specs,plans}/2026-06-03-occupation-rm-phase1*`.
- **Occupation → moteur reco (03/06, phase 2 « agir » — LIVRÉE)** : `calcDateReco` (rm-recommendations) intègre NOTRE occupation via `ownOccupancy {rate30,rate90}` (lu de `rm_kpi_snapshots`) → barème pur testé `src/utils/rmOccupancyAdjust.js` (≥85%→+10% ; 70-85%→+5% ; 15-30%→−7% ; ≤15%→−12%+min-stay ; fenêtre ≤30j=rate30, 30-90j=rate90). Ajuste prix (clampé [min,max]) + vacancy_risk/premium + flag `own_occ_*` + note summary (« occupation 0% → −12% »). **Advisory** (status pending, Vincent publie). Vérifié : Mabouya 0%→50€ `own_occ_very_low` / Schœlcher 100%→premium `own_occ_high`. Recompute = `POST /api/rm-recommendations/calculate {property_id}` (sans auth). Spec/plan : `…/2026-06-03-occupation-rm-phase2*`.
- **Raffinement dates réservées (03/06)** : `calcDateReco` reçoit `bookedDates` (Set chargé de `/api/get-availability?bienId=X` → `blockedDates`) → dates vendues = flag **`already_booked`**, `vacancy_risk=0`, `premium=0`, pas d'ajustement occupation, note « 🔒 déjà réservé ». L'occupation ne nudge donc que les dates LIBRES. Testé `src/__tests__/rm-booked.test.js`. Vérifié : Schœlcher (plein) → toutes ses dates proches = `already_booked`/vacancy 0. Plan : `…/2026-06-03-occupation-rm-phase3-dates-reservees.md`.
- **Mot de passe admin** : stocké côté user (localStorage `ldb_auth_v1`), non versionné. Auth serveur via `/api/admin-auth` (rate-limited, token signé).

### Apps Script (Google Sheets bridge)
- Projet **« Site web Amaryllis »**, scriptId `1PJVUdEra…`, deployment id `AKfycbw-t5kd_0f3OsEoDkOJHzYPHIBhWzz34aj7yagP57-Cj-7pLj6TiuRaUuusrCwAiA30Gg`.
- Source **`appscript/SCRIPT_SHEETS.js`** (le `SCRIPT_SHEETS.gs` racine est OBSOLÈTE). Déploiement : `clasp push -f` puis `clasp deploy -i <deployment id> -d "msg"` (toujours le **même** deployment id pour garder l'URL).
- Spreadsheet ID : `1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U`. Onglet unique réservations : **« Toutes les Réservations »** (**15 colonnes** depuis 31/05 : A-M + N=Téléphone + O=Email), action `importAllReservations`. Lecture multi-appareils : `read` renvoie `reservations[]` (via `doGet` ET `doPost`), front lit via `/api/sheets-proxy` (jamais fetch direct script.google = CORS cassé, cf E9). ⚠️ Les résas stockées AVANT le 31/05 ont N/O vides → re-sauver pour peupler tél/email.

### Beds24
- API **V2 uniquement** (V1 morte = errorCode 1000). Compte louerpremium@gmail.com (ID 46819). **Nogent = propId 158192** (seul bien sur Beds24 ; les biens Martinique sont gérés iCal). Secret `BEDS24_TOKEN`.

---

## 3. Faits opérationnels (à connaître avant d'agir)

### Secrets Cloudflare Pages (production) — vérifiés présents
`POSTSTAY_SECRET`, `GA4_API_SECRET`, `CONTACTS_ALERT_SECRET`, `MENAGE_ALERT_SECRET`, `META_APP_SECRET`, `META_PAGE_TOKEN`, `PRIX_RECAP_SECRET`, `PURGE_SECRET`, `RESEND_FROM`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (webhook ACTIF, renvoie 400 sur signature invalide), `RESEND_API_KEY` (variable, fonctionne — testée OK), `BEDS24_TOKEN`, `APPS_SCRIPT_URL`, `GOOGLE_PLACES_API_KEY`, `GA4_*`, `APIFY_TOKEN`, `NTFY_TOPIC`, iCal URLs.
- ⚠️ Un secret modifié via `wrangler pages secret put` n'est pris en compte qu'après un **nouveau déploiement** (`npm run deploy:pages`).
- `POSTSTAY_SECRET` sert d'auth à **tous** les crons emails (poststay, prearrivee, relance-panier) + send-guest-email. Valeur connue de Vincent (présente dans les URLs cron-job.org). Ne pas la réinitialiser sans mettre à jour les crons.

### D1 — base `revenue-manager` (binding `env.revenue_manager`)
- Tables clés : `direct_bookings`, `abandoned_carts`, `agent_actions`, `agent_drafts`, `editorial_calendar`, `llm_outputs`, `contacts`, RM (`rm_*`), rate-limit.
- ⚠️ **`direct_bookings`** : créée à l'origine par `notify-booking.js` (PK `payment_intent_id` ; colonnes paiement). On a **ajouté par ALTER** `email, prenom, bien_id, prearrivee_sent, poststay_sent`. `storeDirectBooking` (stripe-webhook) fait un **upsert par payment_intent_id**. Les crons clés = `rowid` + filtre `email IS NOT NULL`.

### Crons (cron-job.org, compte de Vincent, fuseau America/Martinique)
| Tâche | URL `?secret=POSTSTAY_SECRET` | Fréquence |
|---|---|---|
| Pré-arrivée J-3 | `/api/send-prearrivee` | quotidien 9h |
| Post-séjour J+1/J+3 | `/api/send-poststay` | quotidien 10h |
| Relance panier abandonné | `/api/send-relance-panier` | horaire |
| Récap prix hebdo | `/api/send-prix-recap` | lundi 4h |
| Alerte ménage | `/api/send-menage-alert` | quotidien 8h |
Autres crons via le **Worker** (`workers/ical-sync`) : sync iCal horaire, drafts éditoriaux J-2 (`0 12 * * *`), auto-publish réseaux horaire (`0 * * * *`), rappel rotation tokens (trimestriel).

### Google Business Profile (Place IDs, dans `google-reviews.js`)
- Villa Amaryllis : `ChIJWbeKdLghQIwRCppz2lJ39Jk` (⭐5,0 · 20 avis)
- Résidence Amaryllis : `ChIJc2hlO7chQIwRQaczraCwlNs` (⭐4,7 · 24 avis)
- Schœlcher & Nogent : **fiches pas encore créées** (kit prêt : `docs/google-business-profiles-kit.md`).
- 30/05 : noms recapitalisés + **catégorie principale → « Maison de vacances »** sur les 2 fiches (en attente Google). ⚠️ Cette catégorie **n'expose AUCUN attribut** (piscine/WiFi/etc.) ni horaires standards → équipements à mettre dans description + photos.

### Paiement (Stripe)
- `create-payment-intent` (capture immédiate) → enregistre le **panier** en D1. `notify-booking` (client, après paiement) → alerte hôte email+ntfy + enregistre la résa. `stripe-webhook` → confirme Beds24 + email confirmation voyageur + `storeDirectBooking` (avec email) + event GA4 `booking_completed`. Caution = pré-autorisation séparée (`create-deposit-intent`). **Gestion caution = `/api/manage-deposit`** (POST `{action}`) : `list` (cautions actives `requires_capture`), `capture` (débiter en cas de dommage, `{paymentIntentId, amount?}`), `cancel` (libérer), **`history`** (toutes cautions tous statuts, filtre `{bienId}` optionnel — sert à VÉRIFIER qu'une caution est bien `canceled`=libérée vs `requires_capture`=encore bloquée ; `requires_payment_method`=formulaire ouvert jamais bloqué, normal). ⚠️ Une caution « libérée » = `canceled` côté Stripe ; le déblocage banque du client prend 1-5 j.

---

## 4. Système emails voyageurs (CRM) — branché 30/05
- **Seules les résas DIRECTES** (Stripe) reçoivent ces emails. Airbnb/Booking gèrent leurs propres comms (consigne Vincent).
- `functions/api/send-guest-email.js` = envoi générique (templates servis depuis `public/email-templates/*.html` : `pre-arrivee`, `post-sejour`, `relance-panier`, `newsletter-hiver`). Auth header `X-Send-Secret` ou `?secret=`.
- Pré-arrivée J-3 : **n'envoie PAS le code d'accès** (« communiqué 24h avant »). Post-séjour : 2 boutons avis (Google par bien + Airbnb). Relance panier : lien de reprise pré-rempli, exclut les paniers convertis.
- Resend : expéditeur `RESEND_FROM` (domaine `mail.villamaryllis.com` — vérifier DNS si envois échouent). Alertes hôte par défaut → `vinsmaf@hotmail.com` / `contact@villamaryllis.com`.

---

## 4bis. Auto-remplissage « revenus locatif 2026 » — ACTIVÉ 02/06
- **Fichier** : `appscript/REVENUS_AUTO_2026.gs` (même projet clasp que SCRIPT_SHEETS, scriptId `1PJVUdEra…`). Remplit la grille `revenus locatif 2026` à partir de l'onglet **« Toutes les Réservations »** (+ « réservations » legacy).
- **Ce qu'il écrit, par bien × canal (air bnb/booking/direct) × mois d'arrivée** :
  - **Montant €** sur la ligne du canal (TOUS canaux ; Direct = net, **Airbnb/Booking = brut OTA assumé**). ⚠️ **Airbnb iCal ne transmet pas le prix → montant = 0** (seuls nb résa + nuits se remplissent pour Airbnb ; € réel uniquement Booking via Beds24 + Direct).
  - **Nb réservations** (bloc lignes 35-64) sur le canal.
  - **Nb nuits** = ligne « jours occupés » (1/bien : nogent 68, amaryllis 75, iguana 81, geko 87, zandoli 93, mabouya 99, schoelcher 105).
  - Séjour à cheval sur 2 mois : **nuits réparties au mois réel, montant au prorata**. Blocages (« not available »/« bloqué ») exclus.
  - Lignes *total* + grands totaux (32/33/64) = **formules** → mises à jour automatiquement, ne PAS y écrire.
- **Mapping lignes** (col = mois+2, C=janv…N=déc) : REV_ROWS / CNT_ROWS / NIGHTS_ROW dans le fichier. Vérifié visuellement 02/06.
- **Anti-doublon** : journal masqué **`rev2026_traites`** (1 ligne/id déjà compté). **Baseline déjà posée** = les ~21 résas existantes sont marquées « comptées » → jamais re-ajoutées (préserve l'historique manuel jan-juin).
- **Déclenchement TEMPS RÉEL** (pas de trigger temporisé — `ScriptApp` indispo via web app/502) : `syncRevenus2026()` est appelé en fin d'`importAllReservations_` (webhook Beds24 + sync horaire iCal + 📊) **et** d'`addReservation_` (saisie directe). Chaque nouvelle résa se remplit aussitôt, une seule fois.
- **⚠️ CHANGEMENT DE MÉTHODE (décidé par Vincent 02/06)** : il **n'entre plus les NOUVELLES réservations à la main** dans la grille → l'auto s'en charge (sinon doublon). Le passé/manuel reste intact.
- **Limite** : append-only → une **annulation** ne retire pas auto la valeur (à corriger à la main, ou via `revenus2026Undo`).
- **Actions de maintenance** (via `/api/sheets-proxy` POST `{action}`) : `revenus2026Status` (journal/source), `revenus2026Recent` (n dernières), `revenus2026DryRun` (en attente, n'écrit rien), `revenus2026Sync` (applique les pending), `revenus2026Forget {ids}` (sort un id du journal), `revenus2026Undo {ids}` (resoustrait les deltas d'une résa), `revenus2026FromMonth {month,apply,ignoreMemo}` (rattrapage mois). `setupRevenus2026()` (baseline+trigger 15 min) = **uniquement depuis l'éditeur Apps Script** (scope ScriptApp).

---

## 4ter. Programme SEO « Hub & Spoke » — LOT 1 livré 02/06
- **Spec/plan** : `docs/superpowers/specs/2026-06-02-seo-hub-spoke-guides-design.md` + `docs/superpowers/plans/2026-06-02-seo-hub-spoke-guides.md`. Baseline : `docs/seo/baseline-2026-06-02.md` (revue J+30/J+60).
- **Clusters** : `src/data/seoClusters.js` = source unique (4 hubs : sainte-luce, diamant, sejour, nogent → guides + biens). `clusterForGuide(slug)` / `clusterForBien(id)`.
- **Maillage** : composant `src/components/seo/MaillageCluster.jsx` (client, câblé 12 guides + fiches biens) **ET** maillage **pré-rendu crawlable** dans `scripts/prerender.mjs` (`buildSeoBody` → nav « À lire aussi »/« Où loger »). ⚠️ Le composant React seul ne suffit pas (curl ne voit que le HTML statique) → c'est le prerender qui porte le SEO.
- **Meta runtime + JSON-LD** : 12 guides ont meta (title ≤60c) + JSON-LD **Article + FAQPage + BreadcrumbList** via la table `GUIDE_META` dans `functions/[slug].js` (handler générique ; `onRequest` n'a pas de whitelist → fallback `context.next()`). Prerender synchronisé. Helpers : `src/lib/seo/jsonld.js`.
- **FAQ visible** : `<details>` sur guide-distilleries/gastronomie/meilleure-saison (miroir JSON-LD).
- **Sitemap** : hubs à priority 0.9.
- ⚠️ Les guides ont `Cache-Control: max-age=3600` → après deploy, l'edge sert l'ancien HTML ~1h ; vérifier l'origine via cache-bust `?v=ts`.
- **LOT 2 livré 02/06** : 6 nouveaux guides longue-traîne via le système data-driven **`GUIDES_POI`** (`src/data/guidesPoi.js` + `guidesPoiSlugs.js` + template `GuidePOI.jsx`) : `guide-martinique-en-famille-sud`, `guide-sainte-luce-jour-de-pluie`, `guide-se-deplacer-martinique-sud`, `guide-ou-loger-martinique-secteur`, `guide-que-faire-nogent-sur-marne`, `guide-ou-dormir-est-paris-nogent`. Rattachés aux clusters (sainte-luce/sejour/nogent → **cluster Nogent désormais peuplé**). `MaillageCluster` ajouté à `GuidePOI.jsx` (bonus : tous les POI). **Bonus** : JSON-LD **Article + Breadcrumb** ajouté à TOUS les guides POI (`buildArticleLd` dans prerender ; avant : seul le VacationRental accueil par défaut). 56 routes prérendues. Vérifié live (titre/Article/FAQ/Breadcrumb/maillage). **Créer un nouveau guide POI = ajouter 1 objet dans guidesPoi.js + son slug + son cluster** (le prerender génère meta+JSON-LD+sitemap auto).
- **LOT 3 livré 02/06** : 5 guides POI de plus (couple Sud, itinéraire 1 semaine Sud, snorkeling tortues, budget Martinique, guinguettes Nogent) → **61 routes prérendues** ; tous Article+FAQPage+Breadcrumb+maillage vérifiés live. FAQ ajoutée à `activites-sainte-luce` (faq dans GUIDE_ACTIVITES de `functions/[slug].js` → FAQPage + section visible dans GuideActivites.jsx). **Kit citations off-page** : `docs/seo/off-page-citations-kit.md` (NAP canonique + checklist Apple Business Connect/Bing/TripAdvisor/PagesJaunes — action Vincent, adresse backlog local-002/003/004).
- **SEO — total au 02/06** : 11 guides longue-traîne créés (lots 2+3) + fondation hub & spoke (clusters/maillage crawlable/meta runtime/JSON-LD). **Prochaine étape = piloter par les données GSC à J+30** (baseline `docs/seo/baseline-2026-06-02.md`).
- **Netlinking / off-page (02/06)** : plan `docs/marketing/netlinking-plan-2026.md` (cibles priorisées + 4 templates de prospection + press-kit + suivi) — **action Vincent : envoyer la prospection**. Page **`/nos-partenaires`** créée (`src/Partenaires.jsx`, route dans main.jsx, prerender) = infrastructure pour offrir des backlinks aux partenaires + maillage vers les 7 biens ; recommandations locales en texte (Vincent y ajoute les liens partenaires au fil des accords). Kit citations annuaires : `docs/seo/off-page-citations-kit.md`.

---

## 5. Pièges connus (footguns) — lire avant SEO/résa/réseaux
1. **SEO meta fiches = DOUBLE SOURCE** au niveau du *rendu* : `functions/[slug].js` (HTMLRewriter runtime) **écrase** `scripts/prerender.mjs`. La vérité de rendu = la fonction. Title ≤60c, desc ≤158c.
   - ✅ **SOURCE UNIQUE DES FAITS livrée 03/06 (phase 1)** : `src/data/biens.js` (module pur : id/nom/type/prix/capacite/chambres/lieu/postal/coords/rating/reviews/bookable/photos/seoTitle/seoDesc + `ALL_BIENS`/`VILLAS`/`getBien`/`isMartinique`). Importé par `functions/[slug].js` (meta+JSON-LD), `scripts/prerender.mjs` (JSON-LD+meta), `functions/api/_biens.js` (faits cœur + grounding equip/interdit conservé). Import depuis `src/` validé au bundling Functions (esbuild). Plus AUCUN prix/fait codé en dur dans `[slug].js`/prerender → **ajouter un bien = éditer le canonique** (sauf display riche PublicSite, **phase 2**). Test garde-fou : `src/__tests__/biens-consistency.test.js`. Spec/plan : `docs/superpowers/{specs,plans}/2026-06-03-biens-source-unique*`.
   - ⚠️ **Notes/avis** : référence = `PublicSite.jsx` (vu par les clients). Iguana 4,75/4 · Nogent 4,8/18 (anciennes valeurs divergentes 4.92/25 et 4.85/12 de `[slug].js` corrigées). **Vrais chiffres d'avis à confirmer par Vincent.**
   - ✅ **Phase 2 livrée 03/06** : `PublicSite.jsx` `const BIENS` dérive les FAITS du canonique via `canonFacts(id)` (spread : prix/capacite/chambres/lieu/coords/rating/reviews/bookable) ; le display riche (descFull/avis/photos/FR-EN/couleur/lits/sdb) reste local (ne drift pas) ; `nom` affiché conservé (décision produit). Coords canonique réalignées sur les vraies valeurs PublicSite. JSON-LD client PublicSite lisait déjà `bien.*` → OK. `App.jsx` seeds **hors périmètre par design** (données financières + libellés admin, pas de duplication de faits). Test étendu (intégrité canonique + anti-régression faits littéraux). **Ajouter un bien = 1 entrée canonique + 1 bloc display PublicSite.**
   - ✅ **Phase 3 livrée 03/06 — `index.html` `@graph` généré** : le bloc statique des 7 VacationRental (`traf-010`, qui contenait des **notes inventées** : iguana 42 avis, nogent 4.95/42) est SUPPRIMÉ, remplacé par le marqueur `<!--SEO_RENTALS_GRAPH-->`. `scripts/prerender.mjs` génère le `@graph` depuis le canonique (`rentalNode`/`buildRentalsGraph` ; facts ← canonique, contenu SEO `amenityFeature`/horaires dans la carte locale `RENTAL_CONTENT`) et l'injecte dans chaque page. Corrige aussi Schœlcher (ligature + postal 97233). **→ Plus AUCUNE des sources biens (functions/[slug].js, prerender per-bien, _biens.js, PublicSite, index.html) ne code les faits en dur : tout vient de `src/data/biens.js`.** Pour ajouter un bien : 1 entrée canonique (+ amenityFeature dans RENTAL_CONTENT de prerender pour le rich snippet).
2. **Réservations** : un seul onglet Sheet « Toutes les Réservations », action `importAllReservations`. `importBeds24` et l'onglet « Réservations Nogent » n'existent plus. Comparaisons d'id en `String`.
3. **Réseaux** : un draft `social_post` doit avoir `payload.channels = ["ig","fb"]` sinon **Facebook est silencieusement zappé**. Forcé dans `agents-run.js`. Statut `approved` requis pour publication par le cron.
4. **Image Resizing Cloudflare (`/cdn-cgi/image/...`) NON activé** (404) → on génère des **variantes statiques** (`scripts/gen-image-variants.mjs`, 480/800/1200/1600w webp) au build. ⚠️ **Piège 1600w (corrigé 30/05)** : `gen-image-variants.mjs` utilise `withoutEnlargement` → la variante `-1600w` n'existe QUE pour les originaux ≥1600px (17/477 photos). Pour les autres, `/photos/.../XX-1600w.webp` renvoie la **SPA en HTML avec un 200** (pas un 404). Le `srcset` de `RImg`/`cfImg` (`src/primitives.jsx`) ne doit donc proposer QUE `[480,800,1200]` — sinon la **hero** (grande, retina) pioche le faux 1600w et affiche du HTML = photo cassée (les vignettes piochent 480/800 → OK, d'où « seule la 1ère photo casse »). Ne JAMAIS remettre 1600 dans `_VARIANT_WIDTHS` ni dans le srcset sans générer les vraies variantes.
5. **A/B testing** : ne jamais A/B le prix via `bien.prix` (casse le calcul total). Tests actifs : `cta_label`, `hero_amaryllis`.
6. **`booking_completed` serveur** utilise un client_id synthétique → pour l'attribution Google Ads, importer l'event **`purchase`** client, pas `booking_completed`.

---

## 6. Contraintes & décisions de Vincent (impératives)
- **Revenue Manager : RECO uniquement.** Jamais appliquer prix/séjour-min en direct sans validation.
- **Emails voyageurs : résas directes only.**
- **Jamais de connexion à ses comptes ; jamais lancer de dépense pub / créer un compte / valider une fiche GBP à sa place.** Claude prépare, Vincent valide/lance.
- **Mailto** : ouvrir une nouvelle fenêtre (`target="_blank"`).
- Déploiement Pages uniquement via `npm run deploy:pages` (jamais patrimoine-dashboard).
- Pour piloter le navigateur (GA4, GBP, cron-job.org) : autorisation « Pilote mon navigateur » via l'extension Chrome MCP.

---

## 7. Marketing / acquisition — état
- **Google Ads** : kit prêt (`docs/google-ads-kit.md`, 10 RSA + 5 Meta Ads rédigées). ✅ **02/06 : compte RÉACTIVÉ (était fermé/inactif depuis 2016) + conversion `purchase` IMPORTÉE** (« amaryllis (web) purchase », source GA4 538182418, catégorie Achat, Principale). Prérequis tracking levé. Reste à faire au lancement : créer la campagne offre groupe + définir budget. ⚠️ **PAS de crédit Google Ads (confirmé Vincent 02/06) — tout est argent réel.** Budget par phase (cf. `docs/marketing/00-SYNTHESE-campagnes-2026-06.md`) : Phase 0 = 0 € (SEO+GBP+tracking) ; Phase 1 = ~120-150 € test offre groupe ; Phase 2 = +150-300 €/mois sur le gagnant si ROI prouvé. Ne rien dépenser avant import conversion `purchase`. Lien GA4↔Ads créé (compte 226-428-3778). Audience remarketing GA4 **`RMKT_Vu_fiche_calendrier_sans_resa`** créée (regex 7 fiches + page groupe, exclusion /merci, 30 j). Google Signals actif.
- **Meta/Facebook Ads** : ⚠️ **pas de MCP de gestion de campagnes**. Zapier = seulement « Facebook Lead Ads » (capture leads). Options : A) Ads Manager piloté navigateur (reco, étape 2 après Google), B) Lead Ads→D1 via Zapier, C) coder `functions/api/meta-ads-*` (Marketing API, compte pub + token `ads_management` requis). **Au backlog** (Traffic Manager, à-planifier).
- **GBP** : voir §3. Kit complet `docs/google-business-profiles-kit.md`.

---

## 8. Backlog & agents
- **~23 agents IA** (`agents-run.js`, via **LLM multi-provider** `callLLM` — voir §AI-Ops) → table D1 `agent_actions` (statuts FR : `a-planifier`, `backlog`, `bloqué`, `fait`). API `/api/agents-actions`. (`ai-summary.js` utilise encore Anthropic Haiku, payant.)
- **Backlog classé + normalisé (31/05)** : 453 actions (275 fait, 146 backlog, 31 à-planifier, 1 bloqué). Doc de référence `docs/backlog-agents-classification.md` (tableaux statut/catégorie/agent/priorité/effort + matrice priorité×effort + quick wins). Catégories normalisées (21 std : content/seo/ux/business/performance/conversion/tracking/ops/securite/crm/legal/ads/veille/research/technique/growth/feature/test/bug/strategie/doc). **PATCH `/api/agents-actions` accepte `category` + `effort`** (en plus de status/notes/action/priority) ⚠️ **PATCH se fait par `?id=` en query string, PAS dans le body** (sinon « id is required »). Anomalie corrigée : 1 ligne `id` NULL (Meta Ads) → `traf-020` via D1 direct. Top quick-wins haute/critique ≤1h : data-002 (ad_storage consent), traf-001 (Stripe async LCP).
- Sortie LLM logguée en D1 `llm_outputs` (opt-in `logSource`).
- Lots backlog déjà traités : SEO meta, sécurité (rate-limit, token signé, HMAC webhook Beds24), Growth A/B, Perf images/API, Conversion (avis sur fiches), CRM (newsletter, relance), Observabilité, Compliance RGPD/Loi Le Meur, Admin logistique (checklists docs), QA (70 tests Vitest).
- Docs livrables clés dans `docs/` : `google-business-profiles-kit.md`, `google-ads-kit.md`, `cron-emails-setup.md`, `checklist-etat-des-lieux.md`, `alerte-reappro-consommables.md`, `registre-traitements-rgpd.md`, `compliance-rgpd-lemeur.md`, `runbook-rotation-tokens.md`, `revenue-mabouya-minstay-reco.md`.

---

## 9. À faire (côté Vincent / prochaines sessions)
- **🔒 SÉCU (session dédiée)** : ajouter auth/rate-limit aux ~11 endpoints sensibles encore ouverts (liste + méthode dans `docs/audit-coherence-2026-06-01.md` §RESTANTS). Le helper `apiFetch` est prêt côté front. Faire endpoint par endpoint, tester l'admin + le checkout après chaque. NE PAS patcher `window.fetch` global.
- **PRIORITÉ reprise 31/05** : finir le scrape avis Airbnb (run Apify `WMQVMTBpHdU9hyx6N` jamais terminé → relancer `/api/voyageur-feedback?action=ingest` puis `?action=collect`). Infra prête.
- ✅ **Prix basse saison VALIDÉS (02/06)** : Vincent a appliqué une grille juin sur les 3 sous-occupés — Zandoli 110/130€, Géko 110/130€, Mabouya 70/80€ (30/30 j chacun) ; Amaryllis (280-292€) et Schœlcher (90-93€) laissés au SEED. Conforme à la reco (sauf Zandoli volontairement plus bas que la reco 176€ — choix assumé de Vincent). **Point clos.**
- Importer la conversion **`purchase`** (pas booking_completed) dans Google Ads + corriger funnel aveugle (GA4 conversions=0).
- Vérifier crédit 400 € Google Ads → lancer campagne Brand/Search.
- Réveiller le **SEO organique** (~5 sessions/mois pour 30+ guides = gisement gratuit).
- ⚠️ **Décision Vincent (02/06)** : NE PAS créer de fiches GBP Bellevue/Schœlcher ni Nogent pour l'instant. On garde les **2 fiches existantes** (Villa Amaryllis + Résidence Amaryllis), à optimiser si nécessaire. (Avis : 44/44 répondus le 02/06.)
- Répondre à tous les avis Villa Amaryllis (1/20).
- Valider docs compliance avec un avocat.
- Plus tard : Meta Ads (option A), fiches Google Business Profile cluster.

---

## Agent AI-Ops (gestion auto des sources LLM gratuites)
- **`functions/api/ai-ops.js`** : agent qui (1) auto-découvre les modèles dispo par provider (`/v1/models`), (2) choisit le meilleur par provider×tier via classement, (3) teste leur santé en isolation, (4) écrit un **plan** en D1 (table `ai_ops`, clé `plan`) que **`_llm.js` applique en LIVE** (bascule de modèle **sans redéploiement**), (5) désactive les providers totalement KO, (6) se **rafraîchit seul** si > 20 h.
- Déclenché en tâche de fond (`context.waitUntil`) au début de **chaque `agents-run`** → self-forming sans intervention. Aussi : `GET /api/ai-ops?secret=POSTSTAY_SECRET` (état + refresh si périmé), `POST {action:'refresh'|'reset'}`.
- `_llm.js` : ordre modèle = `opts.model` (test isolé) > **plan AI-Ops (D1, cache 10 min)** > `MODELS` statique. Providers `plan.disabled` skippés.
- **Gemini** = provider câblé (endpoint OpenAI-compat) mais **NON activé** : l'API Gemini gratuite est **restreinte géographiquement** (indisponible depuis la Martinique / le compte de Vincent). Stub inerte sans clé ; ne pas chercher à l'activer. Si jamais une clé géo-bloquée était posée, l'AI-Ops la désactiverait automatiquement.
- **max_tokens agents = 4096** (débridé depuis 2048 le 30/05) pour des réponses plus complètes.
- **Historique transmis** débridé (`fetchAgentHistory`) : 120 non-faits + 80 faits (était 80/40) → agents mieux contextualisés. Contexte « Gemini ~1M » non dispo (géo-restreint).
- Premier run : Groq smart auto-upgradé vers **`openai/gpt-oss-120b`** ; 12/12 modèles verts. Inspiré du moteur `ai-ops.js` du patrimoine-dashboard (version KV) — ici en D1.

## Amélioration des agents — programme 8 points : **8/8 LIVRÉS** ✅ (30/05)
| # | Quoi | Endpoint / fichier |
|---|---|---|
| #7 | Observabilité (backlog, impacts, usage LLM, qualité, modèles) | `GET /api/agents-stats` |
| #4 | Harness d'éval qualité (LLM-juge → table `llm_evals`) | `GET /api/agents-eval` |
| #3 | Vérif adversariale (challenger Mistral, agents à enjeu juriste/revenue/consultant → notes ⚠️ VÉRIF) | `GET /api/agents-verify` |
| #8 | Source unique des faits (côté agents ; SEO `[slug].js`/prerender encore à migrer) | `functions/api/_biens.js` |
| #1 | **Orchestrateur** : objectif → décompose → dispatche aux agents (réutilise `AGENTS` exporté) → plan ordonné avec dépendances (D1 `orchestrations`) | `POST /api/agents-orchestrate {objectif}` |
| #6 | Déclencheurs réactifs (avis/note/résas → réveil agent ; baseline anti-faux-positif ; état D1 `agent_triggers`) | `GET /api/agents-triggers` |
| #5 | Bras exécutant : livrables prêts (`meta-seo` validé+fact-checké, `email-sequence`, `pricing-reco`=RECO) | `POST /api/agents-deliver {type}` |
| #2 | **RAG** : grounding sur vraies données (avis/guides/drafts) | voir ci-dessous |

**#2 RAG (détail)** : index Vectorize `amaryllis-knowledge` (1024 dims) + embeddings `@cf/baai/bge-m3` (REST, `CF_AI_TOKEN`). Binding **`VECTORIZE`** ajouté au projet Pages **via l'API Cloudflare** (PATCH merge — secrets/D1/KV préservés, sans dashboard). Helpers `_rag.js` (`embed`/`ragUpsert`/`ragSearch`/`ragBlock`). `GET /api/rag-ingest` (faits+avis+drafts→vecteurs) ; `GET /api/rag-search?q=` (+`?debug=1`). Branché (fail-open) dans 5 agents content : community-manager, seo-content-writer, voyageur-research, crm-manager, commercial-publicite. **Ingestion auto chaque lundi** (Worker `amaryllis-ical-sync`, `runRagIngest` sur cron `0 6 * * 1`, `POSTSTAY_SECRET` ajouté aux secrets du Worker). ⚠️ Vectorize indexe en **différé** (~30s après ingestion).

**Améliorations transverses (même journée)** : Cerebras réparé (`gpt-oss-120b`), agent **AI-Ops** (auto-gestion modèles, voir §dédiée), débridage agents (max_tokens 4096, historique 120/80). **Reste possible** : router `ai-summary` vers le gratuit ; ingérer les avis Airbnb dans le RAG (quand en D1).

## Journal des mises à jour

> 🗄️ **L'historique daté antérieur au 2026-06-04 est archivé** → `docs/_archive/PROJECT_MEMORY-journal-2026-05.md` (sessions mai → début juin : agents 8/8, AI-Ops, RAG, sync multi-appareils, bugs A/B/C, plan CEO, fixes hero photos…).
> Garder ici uniquement les entrées récentes ; archiver par lot quand la section dépasse ~10 entrées.

## Tracking pub (03/06)
- **Meta Pixel** : `src/lib/metaPixel.js` (ID **714189639771397**), **consent-gated RGPD** (chargé seulement après le « oui » du `CookieBanner`, comme GA4 Consent Mode ; `initMetaPixelIfConsented()` dans main.jsx). Events câblés aux mêmes points que GA4 : `ViewContent` (fiche), `InitiateCheckout` (begin_checkout), `Purchase` (×4 tunnels, valeur €). Vérifié live : init OK (`signals/config/<id>` → 200). Confirmer le flux d'events via **Meta Pixel Helper** / Events Manager → Test Events (les beacons /tr ne se voient pas en headless).
- **⚠️ CSP corrigé (`public/_headers`)** : ajout `connect.facebook.net` (script-src) + `www.facebook.com`/`connect.facebook.net` (connect-src) pour le Pixel ; **ET** endpoints GA4 régionaux qui étaient bloqués (`*.google-analytics.com`, `*.analytics.google.com`, `stats.g.doubleclick.net`) → certaines conversions GA4 ne remontaient pas avant. Tout nouveau domaine tiers tracking = à ajouter au CSP sinon silencieusement bloqué.
