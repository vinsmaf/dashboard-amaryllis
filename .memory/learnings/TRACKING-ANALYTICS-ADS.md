# Tracking, Analytics & Ads — Learnings locatif-dashboard

> GA4, Meta Pixel/CAPI, Google Ads/Meta Ads
> Extrait de `../LEARNINGS.md` le 2026-07-04 (consolidation mémoire — split thématique).
> 14 entrées, triées par date décroissante.

## 🎯 Google Ads via automatisation Chrome — toujours réauditer après publication — 2026-06-30
- **Piège** : le wizard de création de campagne Google Ads peut crasher silencieusement ("Un problème est survenu") et perdre le brouillon entièrement (campagne disparue de Brouillons ET Campagnes) sans message d'erreur clair. Pire : même une fois republiée avec succès, des champs configurés pendant le wizard peuvent diverger une fois la campagne réellement live — vécu sur "Géko - Location Martinique" : la case "Limite d'enchère au CPC maximale" était décochée (alors que cochée+remplie pendant le wizard) et la zone géographique avait "France" en plus de "Canada" (jamais demandé).
- **La prochaine fois** : ne JAMAIS faire confiance à ce qui a été saisi pendant le wizard de création. Après publication, toujours rouvrir la campagne et auditer champ par champ via les sous-pages dédiées (Paramètres de la campagne, Zones, Langues, Mots clés, Annonces, Groupes d'annonces) — pas juste la page de vérification finale du wizard qui peut afficher des résumés obsolètes ("Annonces: Aucune" alors que les annonces existent bien).
- **Piège secondaire** : un retry après crash peut créer des **doublons silencieux** (2 groupes d'annonces quasi-identiques sur Géko) — vérifier aussi la structure (nb de groupes d'annonces) pas seulement le contenu des champs.
- **Popup "Confirmez votre identité"** apparaît systématiquement au moment de publier/sauvegarder certaines actions sensibles — Claude ne peut jamais la valider (règle absolue), il faut la passer la main à Vincent et reprendre la vérification après.

## 🔴 gtag("event", "purchase") + window.location.href = race condition mortelle — 2026-06-29
- **Piège** : appeler `window.gtag("event", "purchase", {...})` puis `window.location.href = "/merci"` dans la même tick JS → le browser annule les requêtes XHR/beacon en cours avant qu'ils partent → 0 events GA4, 0 conversions Google Ads.
- **Symptôme** : event absent du top-events GA4 sur 28j (confirmé console GA4 2026-06-29 après 2 semaines de campagnes 253€/488 clics).
- **La prochaine fois** : utiliser `event_callback` pour déclencher le redirect APRÈS confirmation d'envoi. Pattern :
  ```js
  let done = false;
  const go = (tracked) => { if (!done) { done = true; if (tracked) ssSet(guardKey, "1"); window.location.href = "/merci"; } };
  window.gtag("event", "purchase", { ..., event_callback: () => go(true) });
  setTimeout(() => go(false), 800); // failsafe si callback ne revient pas
  ```
  La guardKey est posée DANS le callback (pas avant) → si timeout sans callback, Merci.jsx peut retenter.
- **Corollaire** : toujours vérifier dans GA4 Events que l'event apparaît (au moins 1 fois) avant de croire que le tracking est OK. `purchase` absent du top-10 sur 28j = signal d'alarme immédiat.

## 🔍 GA4 pour diagnostiquer un tracking brisé — 2026-06-29
- **La prochaine fois** : aller dans GA4 → Rapports → Événements → voir si `purchase`/`begin_checkout` apparaissent. Si absent du top-10 sur 28j avec un trafic significatif → tracking entier cassé, pas juste "peu de ventes".
- **Indicateur clé** : "Événements clés = 0 (-100%)" sur la vue d'ensemble GA4 = aucun event de conversion n'est tagué comme Key Event. Vérifier aussi dans GA4 Admin → Key Events.

## 2026-06-23 — Google Ads Angular UI

- **Les descriptions (90c) sont des `<textarea>`, les titres (30c) sont des `<input type="text">`.** Ne pas confondre — si tu mets 90c dans un input title tu as une erreur "90/30" silencieuse.
- **Display path (chemin d'affichage) = max 15 chars** (pas 20 comme on suppose). "villa-martinique" = 16c → invalide. Utiliser "martinique" (10c) ou "villa-martin" (12c).
- **`document.execCommand('insertText')` REMPLACE le contenu** (pas d'append). Si le champ est déjà rempli, il faut `inp.select()` avant, sinon le texte s'ajoute à la fin. Côté fiabilité : l'execCommand trigger le change-detection Angular là où le native setter seul ne le fait pas. Règle : setter natif pour initialiser, execCommand si Angular ne réagit pas.
- **AI Max Google Ads** : sur la page AI Max, les cases "Adaptation du texte" et "Extension d'URL finale" sont pré-cochées. Cliquer Suivant sans les décocher = AI Max activé. Si on veut le désactiver, il faut décocher AVANT de cliquer Suivant.
- **L'adblocker bloque le POST de publication de campagne Google Ads.** Le draft peut être entièrement configuré (il se sauvegarde partiellement à chaque étape), mais le bouton "Enregistrer" final échoue avec "Échec de l'enregistrement" si un adblocker tourne. → Vincent doit désactiver l'adblocker sur ads.google.com pour publier.
- **Google Ads Angular = Angular Material web components.** `button[text="Suivant"]` ne fonctionne pas — utiliser `Array.from(document.querySelectorAll('button, [role="button"], material-button')).find(b => b.textContent.trim() === 'Suivant')`.

## 📊 Funnel/trafic : un chiffre volatil figé en mémoire MENT — toujours `npm run funnel` — 2026-06-20
- **Piège vécu** : j'ai resservi à Vincent le funnel noté dans `CONTEXT.md` au 04/06 (« ~5 visiteurs/j, 240 view_item → 16 begin_checkout ») comme « actuel ». Réalité live (`/api/analytics`) : ~24 sessions/j, 900 view_item, 63 begin_checkout, 4 purchases, 2 894€. **Faux d'un facteur ~4-10.** Un chiffre volatil copié hors de sa source périme et diverge (ADR-G-001).
- **La prochaine fois** : avant TOUTE reco conversion/pricing/roadmap → `npm run funnel` (lit GA4 30j, public sans auth, jamais cache client). Ne JAMAIS citer un chiffre funnel de `.memory`. Source = GA4, point.

## 🛒 `begin_checkout` émis au clic dates+prix = dénominateur GONFLÉ (intérêt ≠ paiement) — 2026-06-20
- **Vérité** : `begin_checkout` (PublicSite.jsx) part au clic « Continuer » qui ferme l'étape dates+prix — AVANT le formulaire contact, AVANT le PaymentIntent, AVANT la carte. C'est un clic d'INTÉRÊT, pas un départ de paiement. Le ratio begin_checkout→purchase surestime donc l'abandon de paiement.
- **Fix** : nouvel event `add_payment_info` à l'arrivée écran carte (infos remplies + PaymentIntent créé) = vrai dénominateur de paiement. Isole 2 fuites : begin_checkout→add_payment_info (formulaire/technique) vs add_payment_info→purchase (saisie CB/3DS). Garde anti-doublon via `useRef`.
- **Corollaire mesure** : ne jamais conclure sur la conversion juste après un correctif tunnel — la fenêtre 30j glissante mélange avant/après. Attendre ~2 semaines de données propres (ici verdict 03/07).

## 🎯 GA4 server-side (Measurement Protocol) : client_id synthétique = vente « Unassigned » — 2026-06-20
- **Piège** : `stripe-webhook.js` envoyait le purchase MP avec `client_id: booking-<id>` (aléatoire) → GA4 voit un nouvel utilisateur sans source d'acquisition → **canal « Unassigned »**. Et `items[].item_id` ne nourrit PAS la dimension custom `bien_id` (il faut un **param top-level** `bien_id`) → bien « (not set) ».
- **Fix réutilisable** : capturer le vrai `client_id` GA4 depuis le cookie `_ga` (`GA1.1.<a>.<b>` → `<a>.<b>`) côté client → le passer en metadata Stripe → l'utiliser comme `client_id` du MP. Toujours envoyer les dimensions custom en **param top-level**, pas seulement dans `items[]`.

## 2026-06-19 — FB page Business Suite, token Meta, pipeline auto-pub

- **La limite de la Bio FB = 101 caractères STRICTEMENT.** Pas de troncature silencieuse : le champ bloque à 101. Pour vider une textarea remplie via Business Suite avec computer-use : `Ctrl+A` sélectionne TOUTE la page (pas le champ), et `super+a` + Delete ne supprime que les derniers caractères. La seule voie fiable = demander à Vincent de coller le texte exact (≤ 101 chars).
- **Deux stores CF secrets distincts : Pages vs Worker.** `wrangler pages secret put --project-name X` ≠ `wrangler secret put --name worker-name`. Un secret posé côté Pages n'est pas visible par le Worker et vice versa. Toujours vérifier les deux si un secret est partagé entre les deux runtimes.
- **Le CTA "Book now" FB n'est PAS éditable en mode "Manage Page".** En mode gestion, le bouton disparaît de la vue. Pour modifier l'URL cible → passer en vue visiteur (icône œil) → hover sur le bouton → crayon d'édition. Ou passer par Page Settings → Buttons.
- **Business Suite "Edit Page" modal = seul endroit pour Social Links et Bio.** Onglet "À propos" de la page = lecture seule. Pour éditer : business.facebook.com → Pages → Amaryllis → Edit Page → sections "Links" et "About".
- **`meta-token-exchange.js` = runbook de renouvellement token Meta.** Endpoint temporaire (auth POSTSTAY_SECRET). Flow : short-lived user token → `oauth/access_token?grant_type=fb_exchange_token` → long-lived → `/me/accounts` → page token non expirant → stocké en D1 `kv_store`. Jamais renvoyé en clair. À supprimer après Business Verification → System User token permanent.
- **Auto-publication pipeline confirmé fonctionnel.** Post Zandoli a été publié automatiquement par le Worker pendant la session (37min après le début). Le cron `runEditorialAutoPublish` (horaire) publie les drafts `approved`. Statut `drafted` ≠ publié : `approved` requis.

## 🐛 iCal parseICS `descGet` peut capturer des numéros de référence (12-15 chiffres) comme montant → toujours cap — 2026-06-18
- **Piège vécu** : `CpaCanalTab` affichait CPA 62G€ / CA 262T€ pour Booking.com. Cause : le regex `descGet(["Montant", "Total", …])` dans `parseICS` capturait les numéros de référence Booking.com (ex. `BOOKING#1234567890123`) présents en DESCRIPTION iCal, `parseFloat` après strip des non-numériques = un montant de 12+ chiffres. **La prochaine fois** : après tout `parseFloat` sur un montant iCal, ajouter `&& montantParsed <= 50000` avant d'accepter la valeur. Sinon le bug est invisible (aucune erreur JS, juste une valeur aberrante stockée en localStorage).
- **Corollaire** : la logique de préservation `prev.montant > 0 ? prev.montant : e.montant` gardait la valeur corrompue **indéfiniment** (re-sync ne corrigeait pas). Toujours écrire `prev.montant > 0 && prev.montant <= CAP ? prev.montant : e.montant` pour les deux branches.
- **Migration startup** : les vieilles valeurs localStorage survivent aux déploiements → ajouter une migration au `useState` init : `parsed.map(x => ({ ...x, montant: Number(x.montant) > CAP ? 0 : … }))`.

## 🔴 Piratage compte pub Meta — pattern reconnaissable — 2026-06-17
- **Signal d'alerte** : email Meta « nouvelles campagnes approuvées » que tu n'as pas créées + nom de campagnes bizarres/langue étrangère dans Ads Manager. **Réflexe immédiat** : aller dans Ads Manager → vérifier TOUTES les campagnes (pas seulement les nouvelles visibles) → désactiver les suspectes AVANT de supprimer (pour prendre des captures).
- **Pattern vietnamien** : campagnes avec 🪴 emojis + noms en majuscules + produits e-commerce asiatiques diffusées sous ta page = piratage classique. Aucune confusion possible avec tes propres campagnes si tu vérifies les visuels.
- **Piège** : une campagne avec "quelques clics et quelques €" de dépense ≠ forcément légitime. Toujours ouvrir l'aperçu publicitaire avant de conclure que c'est une campagne à toi.
- **Portfolio pirate** : Meta peut créer un 2e Business Portfolio sous ton nom sans que tu le saches (via une app compromise). Vérifier régulièrement `business.facebook.com` → switcher de portfolio en haut à gauche pour voir si un portfolio inconnu existe.
- **Meta bloque la suppression du portfolio frauduleux** pendant enquête interne — comportement normal, ne pas s'inquiéter. Le portfolio devient inoffensif une fois vidé.
- **Prochaine fois** : activer le 2FA DÈS l'ouverture d'un compte Meta Business (jamais remettre à plus tard).

## 🤖 Meta Graph API — Scopes vs Advanced Access — 2026-06-15
- **Token avec `pages_read_engagement` ≠ accès au `/{pageId}/feed`.** Depuis 2023, Meta exige **Advanced Access** (App Review approuvé) pour ce endpoint, même en mode Développement avec le bon scope. Le token est correct, le blocage est au niveau app.
- **Seul `/api/social-poll` IG** (`/{igId}/media?fields=comments`) fonctionne avec Standard Access pour son propre compte. Pas d'App Review nécessaire pour ses propres médias IG.
- **Endpoint temporaire `meta-refresh-token.js`** (GET → échange user token → page token permanent via `META_APP_SECRET` serveur) = pattern à reproduire quand on doit renouveler le token page. À créer → utiliser → supprimer (le token apparaît dans les logs d'URL CF si non supprimé).
- **`debug_token` est la source de vérité des scopes** : `GET /debug_token?input_token=<tok>&access_token=<app_id|app_secret>`. Le champ `scopes[]` liste les permissions réellement octroyées. Un scope listé ≠ Advanced Access accordé.
- **Page abonnée** (`POST /{pageId}/subscribed_apps?subscribed_fields=feed`) est nécessaire mais non suffisant pour recevoir les events webhook — l'App Review reste obligatoire pour les apps en Développement.
- **`pbpaste` sur Mac** = lire le presse-papier depuis un terminal après « Copy Token » dans Graph Explorer. Plus fiable que de demander à Chrome MCP de lire le clipboard (non disponible comme action).

## 📣 Tracking pub + lecture des dashboards Ads — 2026-06-15
- **Toujours `wrangler pages secret list --project-name <projet>` AVANT d'affirmer qu'un secret manque en prod.** Un sous-agent d'audit a *déduit* « GA4_API_SECRET absent » en lisant le code (`if(!apiSecret) …`) → FAUX : les 2 secrets (`META_CAPI_TOKEN`, `GA4_API_SECRET`) étaient bien posés. Ne jamais relayer une déduction de sous-agent sur l'état prod sans le vérifier (corollaire du « relire le vrai code avant de corriger un finding LLM »).
- **GA4 « Unassigned » + conversions = signature des events serveur Measurement Protocol** avec `client_id` synthétique (`booking-${pi.id}`). Ça prouve que le MP marche MAIS casse l'attribution canal → les ventes ne sont jamais créditées au paid. Le client_id réel (`_ga`) faudrait le capturer pour rattacher.
- **Ne JAMAIS basculer une enchère sur « Maximiser les conversions » (Google) / « Purchase » (Meta) tant que le compteur de conversions = 0** : sans historique, l'algo n'a rien pour optimiser → il étouffe la diffusion. Garder « Max clics » / « Landing Page Views » jusqu'à ce que les conversions remontent.
- **Lecture des dashboards via Chrome MCP** : **Meta Ads Manager** → `get_page_text` lit le tableau campagnes (delivery/spend/results) en read-only, MAIS `screenshot` **dans un browser_batch est bloqué** (`permission_required`) → appeler `screenshot` **en standalone** (l'utilisateur est prompté). **Google Ads** → grilles campagnes/conversions en **canvas** (absentes de `innerText`/`get_page_text`) → lire par **screenshot** ; les scorecards/headers passent en `innerText`. Les liens « Afficher toutes les actions de conversion » sont des navigations read-only sûres.
- **Meta « Account spend limit »** (plafond compte, distinct du seuil de facturation et de la limite quotidienne fixée par Meta) : quand atteint → toutes les campagnes passent « Account spend limit reached » et **arrêtent de diffuser**. Le relever (Facturation → Comptes → Account spending limit → …) **relance la diffusion immédiatement**. Reset le 1er du mois.

## 2026-06-10 — Meta AEM (Aggregated Event Measurement) en 2024-2026

- **L'écran de config AEM "8 event slots" n'existe plus dans l'interface Meta.** Présent jusqu'en 2023, il a été retiré de Events Manager Settings, Business Settings, et du dataset Overview. Ne pas passer du temps à le chercher.
- **AEM iOS 14+ = automatiquement couvert si** : (1) domaine vérifié dans Meta Business (Brand Safety → Domains), (2) Conversions API active pour l'event principal (Purchase). Ces deux conditions suffisent — le score qualité Meta le confirme (8.0/10 vs objectif 7.66).
- **Vérification domaine Meta = meta tag HTTP** : méthode la plus rapide (5 min). Token récupéré dans Business Suite → Brand Safety → Domains → Add → Create → copy `content=`. Coller dans `<head>` de `index.html`. Deploy. Cliquer "Verify". Résultat immédiat.
- **La vérification domaine débloque** : CAPI quality score · AEM attribution · audiences Pixel fiables. C'est un prérequis souvent oublié qui améliore silencieusement la mesure.

- **L'inbox `client_errors` D1 est le vrai diagnostic post-deploy** : quand le user a dit « erreur sur l'admin », `wrangler d1 execute revenue-manager --remote --command="SELECT * FROM client_errors ORDER BY last_seen DESC LIMIT 5"` m'a donné le message exact en 5 secondes (`Cannot read properties of undefined (reading 'filter')`). Reflex à conserver : avant de paniquer/rollback, **interroger `client_errors`** pour avoir le vrai message capté côté navigateur.

## 2026-06-07 — Ads + iCal + Attribution

- **Budget Meta = ad set level, pas campagne** : avec 3 ad sets à €5/j chacun dans C1, le total était €15/j (pas €5/j). La prochaine fois : toujours vérifier combien d'ad sets actifs avant d'estimer le budget total.
- **Créer l'audience custom AVANT l'ad set MOFU** : l'audience "visiteurs 30j" n'existait pas → tentative d'assignation échouée silencieusement. Ordre correct : Audiences Manager → Custom → Website → 30j → sauver → puis créer/modifier l'ad set.
- **Google Ads en "apprentissage" ≠ dépense réelle = budget théorique** : C1 à €8/j n'a dépensé que €15 sur 30 jours (~€0.50/j réel). Baisser le budget théorique a peu d'impact immédiat. Laisser tourner 2-3 semaines avant d'optimiser.
- **Erreur Meta "Required field: link" est au niveau AD (créatif), pas ad set** : chercher dans Edit Ad → section Destination → Website URL. Ne pas chercher dans les paramètres de l'ad set.
- **iCal: les OTA (Airbnb, Booking) exigent que l'URL se termine par `.ics`** : un paramètre `?bienId=amaryllis` est refusé. Utiliser une route dynamique `[file].js` avec `params.file.replace('.ics', '')` est le bon pattern.
- **Toujours tester le Pixel fbclid/gclid en sessionStorage avec navigation privée** : `sessionStorage` lève `SecurityError` en mode strict (ADR-S-013 déjà appliqué). `trackingAttribution.js` wrappé en `try/catch` — penser à le vérifier sur toute implémentation future de web-storage.
