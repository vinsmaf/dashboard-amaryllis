# Écran d'accueil TV des logements — Design

**Date :** 2026-06-04 · **Statut :** Proposé (validé cadrage Vincent) · **Périmètre :** site public + admin

> Objectif : afficher sur les TV des logements un **écran d'accueil personnalisable** qui (1) accueille le voyageur, (2) donne le WiFi, (3) met en avant le guide local, (4) **vend des services additionnels** (late check-out, ménage, chef…) et (5) pousse la **réservation directe** (fidélisation). On s'appuie au maximum sur l'existant ; on ne reconstruit rien.

---

## 1. Contexte & existant (à réutiliser, NE PAS refaire)

- **`/bienvenue/<bien>` → composant `GuestGuide.jsx`** : livret d'accueil digital déjà en place, par logement, thème sombre, palette par bien (`PROP_COLORS`). Sélection du bien via le **path** (`/bienvenue/mabouya`), défaut `amaryllis`. Charge le contenu via `GET /api/guides?property_id=<bien>` (fallback `public/guides/<bien>.json`).
- **Guides JSON par bien** (`public/guides/<bien>.json` + D1) contiennent déjà : `property_name`, `emoji`, `tagline`, `welcome_message`, `host_signature`, `address`, `maps_url`, `checkin_time`, `checkout_time`, `wifi_ssid`, `wifi_password`, `sections[]`, `contacts`, `faq[]`. **Toutes les données de l'écran existent déjà** sauf le catalogue de services (à ajouter).
- **Édition admin** : onglet **Livrets** (`LivretEditor.jsx`) + **Guides** (`GuideEditor.jsx`). Le catalogue de services s'éditera là.
- **Paiement** : `functions/api/create-payment-link.js` (lien de paiement Stripe — idéal pour un QR), + `create-payment-intent.js`, `notify-booking.js` (alerte hôte email + ntfy), `stripe-webhook.js`.
- **Matériel TV (confirmé)** : toutes les TV ont un **navigateur web** (Villa Amaryllis = Apple TV branché sur une smart TV connectée). Donc **livraison uniforme = ouvrir une URL dans le navigateur de la TV**. Les images de secours (phase 3) couvrent toute TV sans navigateur.

---

## 2. Architecture

### 2.1 Mode « TV / kiosk »
- **URL** : `villamaryllis.com/bienvenue/<bien>?tv=1`
  - Paramètres de **personnalisation optionnels** : `&guest=<Prénom>&du=<JJ-MM>&au=<JJ-MM>`.
  - Sans `guest` → message générique (« Bienvenue à la Villa Mabouya »).
- **Rendu** : quand `tv=1`, `GuestGuide` rend un nouveau sous-composant **`<TvKiosk guide={…} colors={…} params={…} />`** (fichier `src/TvScreen.jsx`) **au lieu** du livret défilant. Plein écran (100vw×100vh), gros texte lisible du canapé, aucune barre/nav, pas de ChatWidget (déjà exclu pour `/bienvenue`).
- **Diaporama auto** : slides en boucle, ~12 s chacun, transition douce (fade). Pause possible (touche/clic). Boucle infinie.
- **Robustesse TV** : pas de dépendance souris ; police système large ; respecter l'overscan (safe-area padding ~5%) ; éviter les polices web lentes (fallback system-ui) ; garder le JS léger (les navigateurs TV sont lents).

### 2.2 QR codes
- Générés **côté client** (lib légère type `qrcode` en dépendance, ou un petit générateur SVG maison ; pas d'appel réseau).
- Types : WiFi (`WIFI:T:WPA;S:<ssid>;P:<pwd>;;`), guide complet (`/bienvenue/<bien>` sans `tv=1`), services (`/services/<bien>`), site (`/<bien>` ou `/`), WhatsApp hôte (`https://wa.me/<num>`).

---

## 3. Les slides (Phase 1)

| # | Slide | Source de données | QR |
|---|---|---|---|
| 1 | **Bienvenue** — « Bienvenue [Prénom \| à la Villa X] », tagline, signature hôte, (dates si fournies) | `welcome_message`, `tagline`, `host_signature`, `property_name`, params `guest/du/au` | — |
| 2 | **WiFi** — réseau + mot de passe en très grand | `wifi_ssid`, `wifi_password` | QR connexion WiFi auto |
| 3 | **Bonnes adresses** — 3-4 highlights | extrait de `sections[]` (type lieux) ou liste curatée | QR → guide complet sur tél |
| 4 | **Services & extras** — vitrine (Phase 1 : liste + « demandez à votre hôte »/contact ; Phase 2 : prix + achat) | `extras[]` (nouveau, voir §5) | QR → `/services/<bien>` (Phase 2) ou WhatsApp (Phase 1) |
| 5 | **Infos pratiques** — heure de départ, contact hôte, (météo optionnelle) | `checkout_time`, `contacts` | QR WhatsApp hôte |
| 6 | **Revenez en direct** — « -15% vs Airbnb, réservez en direct » | statique + `property_name` | QR → `villamaryllis.com/<bien>` |

Ordre et activation des slides **configurables** (un slide vide/sans données est sauté automatiquement).

---

## 4. Personnalisation (générique + perso optionnelle)

- **Par défaut générique** par logement (aucune saisie par séjour).
- **Perso par URL** : `?tv=1&guest=Vincent&du=05-06&au=12-06`.
- **Helper admin** (petit, dans `LivretEditor`) : un mini-formulaire « Générer l'URL TV » → choisir le bien + (optionnel) prénom + dates → produit l'URL `…/bienvenue/<bien>?tv=1&guest=…` à copier/coller sur la TV. Évite de taper l'URL à la main.
- Pas d'intégration réservation automatique en Phase 1 (pas de pull Beds24/direct_bookings) — **YAGNI** : la saisie manuelle de prénom/dates suffit et reste simple. Auto-perso = évolution future éventuelle.

---

## 5. Phase 2 — Ventes additionnelles (le levier revenu)

### 5.1 Catalogue de services (données)
- Nouveau champ `extras[]` dans le guide JSON par bien (éditable via `LivretEditor`) :
  ```json
  "extras": [
    { "id": "late-checkout", "label": "Départ tardif (jusqu'à 15h)", "price": 30, "desc": "Profitez du logement quelques heures de plus." },
    { "id": "menage-suppl", "label": "Ménage supplémentaire", "price": 45, "desc": "Un ménage en cours de séjour." },
    { "id": "chef", "label": "Chef à domicile (soirée créole)", "price": 120, "desc": "Un dîner préparé sur place." }
  ]
  ```
- Prix en € TTC, par logement (un même service peut avoir un prix différent selon le bien).

### 5.2 Parcours d'achat (la TV = vitrine, le téléphone = caisse)
1. Slide 4 affiche les services + un **QR → `/services/<bien>`** (page mobile).
2. **`/services/<bien>`** (nouveau, mobile-first) : liste les `extras[]`, le voyageur choisit → bouton « Payer ».
3. Le paiement passe par **`create-payment-link.js`** (Stripe Payment Link) ou un PaymentIntent dédié → page de paiement Stripe hébergée.
4. Au succès (`stripe-webhook.js`) : **notifier l'hôte** (email + ntfy via le mécanisme `notify-booking`) avec bien + service + voyageur, et stocker la commande (table D1 `service_orders` : id, bien, service_id, montant, contact, statut, ts).
5. Onglet admin (réutiliser/étendre un onglet existant) pour voir les commandes de services.

### 5.3 Garde-fous
- **Stripe LIVE = argent réel** : tester en montant minime d'abord. Claude ne déclenche jamais de paiement ; Vincent valide la mise en LIVE.
- Idempotence webhook (déjà en place pour les résas — réutiliser le pattern).
- Les services dépendant de dispo (chef, late check-out) = **demande**, pas garantie immédiate : le paiement vaut réservation du service, l'hôte confirme. Wording clair sur `/services`.

---

## 6. Phase 3 — Images de secours (TV sans navigateur / économiseur d'écran)

- Génération d'une **image d'accueil par logement** (PNG 16:9, ex. 1920×1080) : nom du logement + « Bienvenue » + WiFi + 1 QR (guide ou site) + photo de fond + palette du bien.
- Mécanisme : un **script** (`scripts/gen-tv-screens.mjs`, rendu HTML→image via Playwright déjà présent dans le repo) OU une route serverless qui rend l'image. Sortie dans `public/tv/<bien>.png`.
- Usage : diaporama / économiseur d'écran (Apple TV photos, clé USB sur TV, etc.). Figé (pas de live).
- **Phase optionnelle** — à faire seulement si un besoin réel apparaît (toutes les TV ayant un navigateur aujourd'hui).

---

## 7. Hors périmètre (non-goals)

- Pas d'app native tvOS/Android TV (trop lourd ; le navigateur TV suffit).
- Pas de pull automatique des réservations en Phase 1 (perso = manuelle par URL).
- Pas de gestion de stock/planning des services (Phase 2 = paiement + notif ; la logistique reste hôte).
- Pas de multilingue TV en v1 (FR d'abord ; EN = évolution, cohérent avec le constat SEO « pas d'EN prématuré »).

---

## 8. Tests & vérif

- **Phase 1** : vitest sur la logique de sélection/saut de slides + parsing des params (`guest/du/au`) + génération des payloads QR (WiFi/URL). Vérif visuelle plein écran (1920×1080 et un format TV 16:9) via `npm run visual-review` ou capture manuelle. Vérif live `/bienvenue/mabouya?tv=1`.
- **Phase 2** : test du flux paiement en **mode test Stripe** d'abord (montant minime), idempotence webhook, notif hôte reçue. Pas de LIVE sans validation Vincent.
- Lisibilité : contraster le texte (cf. leçon `[data-surface="site"] h1` — la page `/bienvenue` n'est pas en `data-surface="site"`, mais vérifier le contraste réel en live).

---

## 9. Découpage en livrables

- **Phase 1 — Écran TV (MVP)** : `TvScreen.jsx` + branche `tv=1` dans `GuestGuide` + slides 1/2/3/5/6 + slide 4 « vitrine » (QR contact) + helper URL admin. Déployable, utilisable immédiatement.
- **Phase 2 — Ventes additionnelles** : `extras[]` éditable + page `/services/<bien>` + paiement Stripe (QR) + notif hôte + commandes D1 + vue admin.
- **Phase 3 — Images de secours** : générateur d'images d'accueil par logement (optionnel).

Chaque phase produit un logiciel fonctionnel et testable seul.
