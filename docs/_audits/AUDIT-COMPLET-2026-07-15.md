# Audit complet — villamaryllis.com (site public + dashboard admin)

**Date** : 2026-07-15 (nuit) · **Demandé par** : Vincent, avant de dormir ("audit complet et total de tout le site et de tout le dashboard pour demain matin")
**Méthode** : 8 agents spécialisés lancés en parallèle, 100% lecture seule, + vérifications indépendantes croisées sur les findings les plus sévères. Rien n'a été corrigé côté code fonctionnel — seules 4 incohérences de documentation (`ARCHITECTURE.md`, 1 commentaire de code périmé) ont été corrigées en direct, car détectées par les audits eux-mêmes et sans risque.

**Bilan** : 0 incendie actif nécessitant un réveil en pleine nuit, mais **3 failles de sécurité exploitables dès maintenant** et **1 bug de conversion silencieux qui tourne sur tout le site depuis un moment** — à traiter en priorité ce matin.

---

## 🔴 P0 — à faire en premier (sécurité + conversion active)

### Sécurité (touche le tunnel de paiement réel — à corriger AVEC toi, pas testé seul cette nuit)

1. **`beds24-manage.js` action `confirm` : aucune vérification de paiement Stripe.** Deux requêtes publiques (`POST /api/beds24-create` puis `POST /api/beds24-manage {action:"confirm"}`) suffisent à confirmer une réservation Nogent gratuitement, bloquant les vraies dates sans qu'aucune alerte hôte ne se déclenche (celle-ci ne part que sur `stripe-webhook.js`).
2. **Même fichier, action `cancel` : pas de vérification de propriété (IDOR).** Un `bookingId` valide — obtenu via l'action `find` avec juste un nom de famille — suffit à annuler n'importe quelle réservation Nogent réelle et payée.
3. **`tv-context.js` : fuite de PII sans authentification, confirmée exploitable en live cette nuit.** `GET /api/tv-context?p=nogent` a renvoyé le vrai prénom et les vraies dates de séjour d'un voyageur actuellement présent. RGPD + risque de repérage de logement vacant (cambriolage).

*Fichiers* : `functions/api/beds24-manage.js`, `functions/api/tv-context.js`, appels côté client dans `src/PublicSite.jsx` (~L1465-1482).

### Conversion & argent (bugs de code identifiés, fix connu, à tester avant déploiement)

4. **Chaque clic sur le CTA réservation réinitialise l'URL et le `<title>` vers la home, sur TOUTES les fiches biens.** `openBien()` (`src/PublicSite.jsx` ~L9301) appelle `openDetail(null)`, qui fait `pushState("/")` + réécrit le `<title>`/meta vers les valeurs homepage — effet de bord d'une fonction écrite pour un tout autre usage (fermer un aperçu rapide). Conséquences : attribution GA4/Meta cassée PAR BIEN (impacte directement le checkpoint ROAS du 19/07 déjà dans l'AGENDA), perte de la progression si le voyageur rafraîchit la page, partage du mauvais lien. **Fix identifié** : ne pas appeler `openDetail(null)` depuis `openBien()`.
5. **Le header sticky ne colle pas réellement — site entier, homepage et fiches biens.** Mesuré en direct : `top:-301px` au scroll au lieu de `0`. Cause : `overflow-x:hidden` sur `<body>` (`src/index.css:72-75`) transforme silencieusement `<body>` en scroll container et casse la chaîne sticky (comportement du spec CSS overflow : un seul axe déclaré force l'autre en `auto`). Le CTA réservation disparaît dès qu'on scroll sur une fiche bien. **Fix identifié** : `overflow-x:clip` au lieu de `hidden`, ou déplacer sur un wrapper.
6. **Le bouton WhatsApp flottant n'apparaît JAMAIS sur les fiches biens chargées directement** (`/amaryllis`, `/zandoli`, etc. — donc tout visiteur venant de Google/pub/réseaux sociaux). Il ne se déclenche qu'après scroll sur la home. `src/PublicSite.jsx` ~L10360-10382.

---

## 🟠 P1 — à faire cette semaine

7. **Nogent affiche 3 totaux différents pour le même séjour** : 145€ dans le header CTA vs 135€ dans la modale de réservation ET sur le bouton "Réserver et payer". À re-tester sur d'autres dates/biens pour mesurer l'ampleur.
8. **Politique d'annulation contradictoire dans le MÊME flow** (Amaryllis) : "7 jours" affiché en étape 1, "J-14" (la vraie politique, structure à paliers) affiché juste en dessous et en étape 2. Risque de litige voyageur réel.
9. **628€ reçus (Francois Cambier, Zandoli, lien de paiement WhatsApp) jamais enregistrés dans `direct_bookings`.** Séjour EN COURS (05→20 juillet). **Vérifié indépendamment** : le calendrier lui-même est SAIN (les 15 nuits sont bien bloquées côté `get-availability`, pas de risque de double-booking — probablement bloqué à la main sur Airbnb/Booking au moment de l'accord). Mais les revenus et les automatisations voyageur (écran TV d'accueil, email code d'accès J-1) restent aveugles à ce séjour.
10. **2 autres virements Stripe non expliqués** : 695€ (débité 03/07, viré 07/07) et 5€ (débité 17/05, viré 24/05). Aucune trace dans `direct_bookings`, `pay_links` ni `devis_paiements`. À vérifier directement dans le dashboard Stripe (la clé locale disponible pour l'audit était en mode test, pas la clé live).
11. **Traduction EN très incomplète** : les descriptions de logement (chambres, espaces de vie, extérieurs) restent quasi 100% en français même avec le switch EN activé sur une fiche bien.
12. **Dark mode : texte du header quasi invisible sur les 4 fiches biens testées** (fond navy inversé en quasi-blanc + texte nav en blanc cassé non-inversant) — même famille de bug que le fix "contact" de cette semaine, sur un composant différent qui n'avait pas été couvert.
13. **3 onglets admin tournent en `localStorage` pur, sans aucune synchro serveur** : `InterventionsTab.jsx`, `Travaux.jsx`, `Prestataires.jsx` — données perdues si changement d'appareil/navigation privée/purge cache. `InterventionsTab` fait en plus doublon fonctionnel avec `MaintenanceTab.jsx` (celui-ci bien persisté en D1) — risque de saisir au mauvais endroit sans le savoir.

---

## 🟡 P2 — dette réelle, pas urgent

- **Logs PII en clair** : 12 lignes / 8 fichiers `functions/api/*.js` (noms/emails de voyageurs visibles via `wrangler tail`). Le fix du 04/07 n'a couvert que le Worker (`_logger.js`), jamais les Pages Functions (`_log.js`).
- **CSP bloque 2 des 5 repli iCal admin** (`corsproxy.io`, `api.allorigins.win`) — et ces repli envoient en plus l'URL iCal privée (avec token) à des proxies tiers non maîtrisés. À supprimer plutôt qu'à whitelister.
- **Iguana** : double balise `noindex` (prerender + runtime sans garde anti-doublon) + reste soumise dans le sitemap malgré le noindex (pollue Search Console) + JSON-LD la type toujours "VacationRental" réservable (inerte tant que noindex actif, risque dormant si retiré un jour).
- **robots.txt bloque GPTBot/ClaudeBot/CCBot/Google-Extended** — probablement un bloc auto-généré Cloudflare par défaut, pas un choix délibéré (contredit le `llms.txt` publié sur le même site). À confirmer si voulu.
- **`GuestContactsTab.jsx` retiré du menu admin le 24/06** (délibéré, doublon CRM) mais l'API + 88 fiches contacts restent actives sans AUCUNE UI pour les consulter/éditer.
- **Couverture Airbnb très faible dans `direct_bookings`** (1 ligne sur 27, vs 18 Booking.com) — un backfill du 30/06 a écrasé la proportion ; toute analyse de mix-canal basée sur cette table sous-compte Airbnb.
- **Dette de lint en hausse** : 738 erreurs actuellement vs ~600 documenté dans `CLAUDE.md` — pas bloquant (gate CI = delta uniquement) mais la tendance mérite un œil.
- 1 ligne `direct_bookings` avec `bien_id NULL` (Laurent Maignan / Géko, la plus ancienne ligne de la table).

---

## 🟢 P3 — mineur / cosmétique

- Aria-label du bouton de thème inversé (dit "passer en mode clair" quand le bouton affiche "SOMBRE", et vice-versa) — trompeur pour les lecteurs d'écran.
- Header mobile fiches biens : lien retour + bouton partager quasi invisibles (contraste ~1:1) ; titre du bien écrasé à 1 lettre visible sur les biens à nom long + CTA prix (Nogent).
- `/guide-hub` annonce "27 guides" alors que 40 sont réellement listés.
- Pluriel manquant : "1 nuits" au lieu de "1 nuit" quand le séjour = 1 nuit.
- `/api/beds24-rates` (censé être Nogent-only) appelé 4× sur une même page Amaryllis et à nouveau sur Mabouya — fetch superflu.
- Bandeau "reprendre votre recherche" ignore le switch de langue (reste en français en mode EN).
- Chat bubble mobile recouvre le CTA hero + le pill "reprendre recherche" sur la home (régression partielle d'une coexistence non gérée avec un composant plus récent).
- 3 liens légaux du footer (CGV, Mentions légales, Confidentialité) sous 44px de cible tactile — oubliés du passage tactile de la semaine dernière.
- ~32 pages guides utilisent `#2c2c2c` au lieu du token `--c-navy` pour le texte — dérive de palette cohérente mais hors-token.
- `sitemap.xml` : `lastmod` identique (date du jour) sur les 102 URLs, aucune vraie valeur de priorisation crawl pour Google.
- Quelques hero/galerie-crossfade qui peuvent se figer sur une image noire en cas de changement d'onglet prolongé — probablement lié à `document.hidden`, un pattern de reprise existe déjà pour la vidéo hero mais pas pour les crossfades photo.

---

## ✅ Vérifié sain (pas besoin d'y retoucher)

- **Paiement** : tunnel Amaryllis testé bout en bout jusqu'à l'écran Stripe (sans payer réellement) — prix cohérent (1980€) sur les 3 étapes, `create-payment-intent` répond 200.
- **CI/déploiement** : 10/10 derniers runs verts, prod synchronisée avec `main`, aucun cron orphelin (8 crons `wrangler.toml` ↔ code Worker 1:1).
- **Secrets** : 0 secret codé en dur trouvé (grep élargi Stripe/Google/GitHub/AWS/clés privées).
- **Webhooks** : signatures Stripe/Beds24/Meta toutes vérifiées correctement.
- **Rate limiting** : présent sur tous les endpoints publics attendus (contact, newsletter, admin-auth, promo-codes).
- **Titles/descriptions SEO** : 7/7 fiches biens dans les clous (aucun dépassement 60/158 caractères).
- **JSON-LD** : valide, `Organization` complet (adresse, réseaux sociaux, notation).
- **Sitemap** : 102 URLs, XML valide, échantillon de 10 URLs → 10/10 en 200.
- **Performance** : ~0,29s / 28 Ko pour une fiche bien type — rien à signaler.
- **Données D1** : aucun doublon de réservation, aucune ligne placeholder non enrichie en dehors du cas déjà connu, endpoints admin testés tous sains.
- **Onglets admin** : aucun crash, aucun TODO/FIXME abandonné, endpoints (27 testés) tous répondent 200 avec des données plausibles.

---

## Ce qui n'a PAS été fait cette nuit (et pourquoi)

- **Aucun correctif de code fonctionnel appliqué** — convention du projet (skill `auditeur` : "ne corrige rien, il constate"), et surtout : les corrections les plus importantes (sécurité, `openBien`, header sticky) touchent soit le tunnel de paiement réel soit un comportement site-wide — à tester avec toi avant de déployer, pas à la légère pendant que tu dors.
- **Seules 4 corrections de documentation** ont été faites (`ARCHITECTURE.md` ×3 + 1 commentaire de code périmé) — détectées par les audits eux-mêmes, zéro risque, zéro comportement changé.
- Les 3 charges Stripe non expliquées n'ont pas pu être confirmées côté Stripe directement (clé locale en mode test) — à vérifier par toi dans le dashboard Stripe.

**Fichiers/commits de cette session** : corrections mémoire dans `28c2e6a` et `a9703da`. Rapport complet également disponible en artifact interactif dans la conversation.
