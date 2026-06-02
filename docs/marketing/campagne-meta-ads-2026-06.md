# Campagne Meta Ads (Facebook + Instagram) — Amaryllis Locations — Juin 2026 (PRÊTE À LANCER)

> Préparée le **2026-06-01**. Vincent : tu **prépares dans Meta Ads Manager et tu lances/dépenses toi-même**. Ce doc est **copier-collable bloc par bloc**.
> ⚠️ **NE RIEN LANCER avant d'avoir coché la CHECKLIST TRACKING §7 (bloquante)** — sans le Pixel + l'event Purchase à valeur €, tu pilotes à l'aveugle et tu ne pourras jamais construire de retargeting ni de lookalike.
> Complément de la campagne Google Ads (`docs/marketing/campagne-google-ads-2026-06.md`). **Google = intention / Meta = découverte & désir.** Les deux sont complémentaires, pas concurrents.
> Tous les chiffres CPM/CPC/CTR/CPA/ROAS sont des **ESTIMATIONS** (marché FR tourisme/voyage 2025-2026), à recalibrer sur tes vraies données après 2 semaines.
>
> Page FB/IG existante (`META_PAGE_ID` configuré) · Compte publicitaire Meta **à confirmer/créer par Vincent** · Budget Google en parallèle ~400 €.

---

## 0) Pourquoi Meta, et pourquoi maintenant (résumé décisionnel)

### Le bon outil pour ce produit
Meta n'est pas un canal d'intention (on n'y « cherche » pas une villa). C'est un canal de **découverte et de désir** : on fait défiler, on tombe sur une photo de piscine à débordement face à la mer, on rêve, on clique. **C'est exactement le terrain d'Amaryllis** : produit visuellement spectaculaire (villa piscine, jacuzzi privatif, vue mer turquoise) + destination de rêve (Martinique). Là où Google capte une demande existante, Meta **crée la demande**.

### Les 4 décisions stratégiques
1. **Meta = étape 2 / complément, pas remplacement de Google.** Google reste prioritaire pour les conversions immédiates (intention forte, offre groupe). Meta vient **construire la notoriété + alimenter le retargeting**, qui mettra des semaines à se charger. Budget Meta volontairement **modeste au départ** (5–10 €/j) à côté du ~400 € Google.
2. **Juin = creux de réservation individuelle → fenêtre IDÉALE pour Meta.** On ne cherche pas la résa immédiate en juin (pic de recherche individuelle = sept-oct, groupes = 4–8 mois avant). On profite du creux pour **(a)** poser le Pixel et le faire mûrir, **(b)** remplir l'audience de retargeting (les visiteurs site mettent du temps à s'accumuler), **(c)** tester les angles créatifs pas chers avant le rush de septembre. **En septembre, on aura des audiences chaudes prêtes à convertir.**
3. **Le visuel porte tout.** Sur Meta, 80 % de la performance = le créatif (la photo/vidéo dans la 1ʳᵉ seconde). Le ciblage compte moins que sur Google. → On investit dans **4 angles forts** plutôt que 20 audiences.
4. **On ne pousse PAS ce qui se remplit seul.** Zandoli (68 %), Iguana (100 % 🚫 bail long), Nogent (71 % 🚫 plafond 120 nuits) = **zéro pub Meta**. On concentre sur les **nuits vides à fort désir visuel** : Villa Amaryllis, Mabouya (couple/jacuzzi), Géko, Schœlcher (vue mer), + l'offre **Groupe** (panier 2 500–4 000 €).

### Cibles publicitaires (par bien — données réelles 2025)
| Bien | Type (nomenclature stricte) | Occ. 2025 | ADR € | Angle Meta | Landing |
|---|---|---|---|---|---|
| **Villa Amaryllis** | **villa** premium piscine, Sainte-Luce, 8 pers | **33 %** | 312 | **Rêve premium / vue / piscine** — CIBLE n°1 (visuels spectaculaires) | `/amaryllis` |
| **Studio Mabouya** | **studio** jacuzzi, Sainte-Luce, 2 pers | 28 % | 82 | **Romantique / couple / jacuzzi** | `/mabouya` |
| **Géko** | **cocon** court séjour, Sainte-Luce, 4 pers | 39 % | 139 | **Évasion express / Sud Martinique** | `/sainte-luce-martinique` |
| **T2 Schœlcher** (Bellevue) | **appartement de standing**, vue mer | 37 % | 93 | **Vue mer / réveil face au lagon** | `/schoelcher` |
| **Offre Groupe** | cluster Sainte-Luce (Amaryllis+Zandoli+Géko+Mabouya) | — | panier 2 500–4 000 € | **Tribu réunie / une seule adresse** | `/location-groupe-sainte-luce` |
| Zandoli | logement, Sainte-Luce | 68 % | — | 🚫 pas de pub (sain) | — |
| Iguana | villa, Sainte-Luce | 100 % | — | 🚫 EXCLU (bail long) | — |
| Nogent | appartement (94) | 71 % | — | 🚫 EXCLU (plafond 120 nuits) | — |

> ⚠️ **Nomenclature stricte** (fact-checker du site) : seuls **Amaryllis et Iguana** sont des « villas ». Mabouya = **studio**, Géko = **cocon**, Schœlcher = **appartement de standing**, Zandoli = **logement**. Ne jamais écrire « villa Mabouya/Géko/Schœlcher » dans une pub.

### USP à marteler dans tous les créatifs
- **Réservation DIRECTE → ~15 % moins cher qu'Airbnb** (pas de frais de service).
- **Contact direct avec le propriétaire**, réponse rapide.
- **Paiement sécurisé** (Stripe) + **livret digital** d'accueil.
- **4,79★ / 97 avis** (preuve sociale — à afficher).

---

## 1) Stratégie & funnel Meta (TOFU → MOFU → BOFU)

```
┌─ TOFU (froid · Notoriété/Découverte) ──────────────────────────────┐
│  Objectif : être vu par des voyageurs FR métropole qui rêvent       │
│  Martinique / villa piscine / lune de miel. Beaux visuels.          │
│  → Génère le trafic site + le viewing de fiches qui REMPLIT le       │
│    retargeting. Lancé EN JUIN.                                       │
└────────────────────────────────────────────────────────────────────┘
                 │ (ceux qui cliquent / regardent ≥50 % vidéo)
                 ▼
┌─ MOFU (considération) ─────────────────────────────────────────────┐
│  Engageurs vidéo + visiteurs site → on enfonce la PREUVE            │
│  (4,79★, 97 avis, -15 % vs Airbnb, contact direct). Activé quand     │
│  l'audience d'engagement dépasse ~300-500 personnes (sept).          │
└────────────────────────────────────────────────────────────────────┘
                 │ (visiteurs fiche sans résa, paniers abandonnés)
                 ▼
┌─ BOFU (retargeting / conversion) ──────────────────────────────────┐
│  Visiteurs de fiche sans résa + ViewContent + InitiateCheckout      │
│  sans Purchase → offre + réassurance + urgence douce. C'est ICI      │
│  que tombent les conversions. Activé dès que l'audience >1 000       │
│  personnes (≈ sept, après que le TOFU ait tourné l'été).            │
└────────────────────────────────────────────────────────────────────┘
                 │ (quand assez de Purchase / trafic qualifié)
                 ▼
        LOOKALIKE 1-3 % (FR) sur acheteurs / visiteurs fiche → réinjecté en TOFU
```

### Calendrier — quand lancer quoi
| Période | Ce qu'on lance | Pourquoi |
|---|---|---|
| **Avant tout** | Checklist tracking §7 (Pixel + CAPI + Purchase €) | Bloquant. Sans ça, pas de retargeting ni lookalike possible. |
| **Juin (semaines 1-2)** | **C1-TOFU Notoriété/Trafic** : 2 angles (Amaryllis premium + Mabouya couple), 5–10 €/j | Remplir le Pixel, tester les angles pas cher, construire les audiences chaudes pour septembre. |
| **Juin (semaines 3-4)** | Garder le gagnant, ajouter angle **Groupe** (lead-time long → juin = bon moment pour vendre déc-avril) | Le groupe se réserve 4–8 mois avant ; panier énorme. |
| **Septembre** | **C2-BOFU Retargeting/Ventes** (audiences enfin chargées) + scale du TOFU gagnant + angle **Vue mer Schœlcher** | Pic de recherche individuelle sept-oct ; les audiences chaudes sont mûres → on convertit. |
| **Septembre+** | **Lookalike** sur acheteurs/visiteurs (si ≥100 events source) | L'algo a enfin de la data pour cloner tes meilleurs prospects. |

---

## 2) Structure de compte (campagnes / ensembles / objectifs)

> **Recommandation honnête vu le faible volume initial** : ne commence **PAS** par l'objectif « Ventes » (Sales). Meta a besoin de **~50 conversions/semaine par ad set** pour sortir de l'apprentissage. À ton volume (résas rares au départ), un ad set « Ventes » resterait coincé en « apprentissage limité » et dépenserait mal. **Commence par « Trafic » (clics vers le site) ou « Notoriété »** — objectifs à signal abondant — puis bascule vers « Ventes » en septembre quand le Pixel aura accumulé des events.

### Arborescence (CBO ou ABO ?)
Au démarrage, **budget au niveau de l'ad set (ABO)** — tu gardes le contrôle pour comparer les angles. Passe en **CBO (budget de campagne)** seulement quand un angle gagnant est identifié et que tu scales.

```
COMPTE PUBLICITAIRE (à confirmer par Vincent)
│
├── CAMPAGNE 1 — TOFU Découverte  [Objectif: TRAFIC]   ← JUIN
│   ├── Ad set A1 — Froid · Amaryllis premium (audience A, §3)   5 €/j
│   │     └── 3 créas (1:1, 4:5, 9:16) — angle "Rêve premium"
│   └── Ad set A2 — Froid · Mabouya couple/jacuzzi (audience B)   5 €/j
│         └── 3 créas — angle "Romantique"
│   (option sem 3-4) Ad set A3 — Froid · Offre Groupe (audience C)  5 €/j
│
├── CAMPAGNE 2 — BOFU Retargeting  [Objectif: VENTES]   ← SEPTEMBRE
│   ├── Ad set R1 — Retarget visiteurs fiche sans résa (30 j)
│   ├── Ad set R2 — Retarget InitiateCheckout sans Purchase (14 j)
│   └── Ad set R3 — Engageurs vidéo ≥50 % + engageurs page/IG (180 j)
│
└── CAMPAGNE 3 — Scale Lookalike  [Objectif: VENTES/TRAFIC]  ← SEPT+
    └── Ad set L1 — Lookalike 1-3 % FR (source: acheteurs/visiteurs fiche)
```

> **Une page, deux placements** : laisse Meta diffuser sur **Facebook ET Instagram** (placements « Advantage+ » / automatiques) au départ — l'algo trouve le moins cher. Tu pourras isoler IG Reels/Stories plus tard si c'est là que ça performe (probable pour ce produit visuel).

---

## 3) Audiences — détaillées et copier-collables

> Légende : 🟢 **PRÊTE MAINTENANT (juin)** · 🟡 **PLUS TARD (sept, quand chargée)**

### 🟢 Paramètres communs à toutes les audiences froides
- **Lieu** : **France** → **réglage « Personnes vivant à cet endroit »** (PAS « récemment dans cette zone »). **EXCLURE les DOM** : Martinique, Guadeloupe, Guyane, La Réunion, Mayotte (ce sont des résidents, pas des touristes). Dans Meta : ajouter France, puis en **Exclure** : « Martinique », « Guadeloupe », « Guyane française », « La Réunion », « Mayotte ».
- **Langue** : Français (optionnel — souvent inutile si géo = France).
- **Âge** : 30–60 ans (cœur de cible CSP+). Mabouya : élargir 28–55.
- **Sexe** : tous (laisser l'algo arbitrer).
- **Placements** : Advantage+ (automatiques) au départ.

### 🟢 AUDIENCE A — Froide « Rêve Martinique / Voyage Caraïbes » (pour Amaryllis premium, Géko)
Centres d'intérêt (à coller un par un dans « Centres d'intérêt détaillés ») :
```
Martinique
Antilles françaises
Caraïbes
Vacances (voyage)
Location de vacances
Tourisme
Voyage de luxe
Villa (hébergement) / Maison de vacances
Plongée avec tuba
Plage
Antilles
Guadeloupe (intérêt voyage — pas géo)
```
Affiner (option, « Restreindre l'audience » → CSP+) :
```
Voyageurs fréquents
Comportement: Voyages internationaux
Revenu élevé / CSP+ (si dispo selon compte)
```
Taille visée : large (1–5 M) — laisse Advantage+ détailler. **Estimation CPM FR voyage : 6–12 €.**

### 🟢 AUDIENCE B — Froide « Lune de miel / Couple romantique » (pour Mabouya jacuzzi)
```
Lune de miel
Voyage de noces
Romantisme
Couples
Saint-Valentin
Week-end en amoureux
Spa
Jacuzzi / Bain à remous
Martinique
Caraïbes
Vacances (voyage)
```
Événements de vie (très puissant ici) :
```
Fiançailles récentes (1 an)
Mariage récent (6 mois) / Anniversaire de mariage à venir
```
Âge 28–55. **Angle romantique = meilleur ROAS attendu sur Meta** (émotion forte, panier accessible 82 €/nuit).

### 🟢 AUDIENCE C — Froide « Groupe / Famille / Tribu » (pour Offre Groupe)
```
Vacances en famille
Voyage en groupe
Réunion de famille
Martinique
Location de vacances
Grande famille
Anniversaire (événement)
Enterrement de vie de jeune fille / garçon (EVJF/EVG)
Vacances entre amis
```
Âge 30–55 (organisateurs de séjours de groupe). Panier élevé → tolère un CPC plus haut.

### 🟢 AUDIENCE D — Froide « Vue mer / Évasion » (pour Schœlcher, activable sept)
```
Martinique
Bord de mer / Front de mer
Vue sur l'océan
Vacances (voyage)
Location de vacances
Tourisme balnéaire
```

### 🟡 RETARGETING (nécessite le Pixel actif — voir §7) — PRÊTES EN SEPT
À créer dès que le Pixel tourne (les audiences se rempliront pendant l'été) :
| Audience | Définition (Audience personnalisée → Site web) | Fenêtre |
|---|---|---|
| **R1 — Visiteurs fiche sans résa** | Personnes ayant déclenché `ViewContent` (ou visité une URL contenant `/amaryllis`, `/mabouya`, `/schoelcher`, `/location-groupe-sainte-luce`) **ET exclure** ceux ayant déclenché `Purchase` | 30 j |
| **R2 — Checkout abandonné** | `InitiateCheckout` **SANS** `Purchase` | 14 j |
| **R3 — Engageurs** | Engagement Page FB + Compte IG + **Vidéo vue ≥50 %** | 180 j |
| **R4 — Tous visiteurs site** | Tout le trafic site (pixel « Tous les visiteurs du site web ») exclure acheteurs | 180 j |

> Ces audiences sont **vides aujourd'hui**. Plus le TOFU tourne tôt (juin), plus elles seront grosses en septembre → plus le retargeting sera rentable. C'est tout l'intérêt de lancer maintenant.

### 🟡 LOOKALIKE — À ACTIVER QUAND ASSEZ DE DONNÉES (sept+)
- **Source idéale** : audience d'acheteurs (`Purchase`) — mais nécessite **≥100 personnes** dans la source. Tu n'y seras probablement pas avant l'automne.
- **Source de repli (plus tôt)** : Lookalike sur **visiteurs de fiche (R1)** ou **engageurs vidéo (R3)** dès qu'ils dépassent 100 personnes.
- Réglage : **Lookalike 1 %** France d'abord (le plus ressemblant), puis tester **1–3 %** pour élargir. Réinjecter en **TOFU** (objectif Trafic ou Ventes).

---

## 4) Angles créatifs par bien/offre

> Chaque angle = **promesse + émotion + preuve**. Le visuel fait 80 % du job (briefs §6).

### ANGLE 1 — Villa Amaryllis « Le rêve premium » (CIBLE n°1)
- **Promesse** : une villa privée avec piscine face à la Martinique, rien que pour vous (jusqu'à 8).
- **Émotion** : l'évasion, le luxe accessible, « et si c'était vous, là, dans cette eau ? ».
- **Preuve** : 4,79★ · 97 avis · réservation directe ~15 % moins chère qu'Airbnb.
- **Visuel hero** : piscine + vue mer + ciel des Antilles (la photo la plus spectaculaire du portefeuille).

### ANGLE 2 — Studio Mabouya « Parenthèse à deux » (meilleur ROAS attendu)
- **Promesse** : un cocon avec **jacuzzi privatif** et jardin, pour deux, en Martinique.
- **Émotion** : intimité, romantisme, reconnexion du couple.
- **Preuve** : 4,79★ · contact direct avec l'hôte · dès 82 €/nuit (accessible).
- **Visuel hero** : jacuzzi fumant au crépuscule / deux verres / lumière chaude (PAS de personnes reconnaissables).

### ANGLE 3 — T2 Schœlcher « Réveil face au lagon »
- **Promesse** : un appartement de standing avec **vue mer**, café du matin sur la terrasse.
- **Émotion** : la sérénité, le calme du front de mer.
- **Preuve** : 4,79★ · paiement sécurisé · livret digital d'accueil.
- **Visuel hero** : terrasse + horizon mer au lever du jour.

### ANGLE 4 — Offre Groupe « Toute la tribu, une seule adresse »
- **Promesse** : réunissez jusqu'à 11 proches dans une résidence privée à Sainte-Luce — **un seul paiement, une seule adresse**.
- **Émotion** : les retrouvailles, la grande tablée, le rire collectif.
- **Preuve** : différenciateur unique (cluster mitoyen, piscines + jacuzzi) · sans commission Airbnb · contact direct.
- **Visuel hero** : grande tablée extérieure / piscine partagée / groupe joyeux (carousel des 3-4 logements).

---

## 5) COPY finalisée (copier-collable)

> **Ton de marque** : haut de gamme **chaleureux**, jamais tape-à-l'œil. On vend une émotion + la réassurance « réservation directe ». Limites Meta : primary text idéalement **≤125 caractères** (avant le « … voir plus »), titre **≤40 car.**, description **≤30 car.**

### ANGLE 1 — Villa Amaryllis (→ `/amaryllis`)
**Primary text — variante 1**
```
Une villa privée, une piscine, et la Martinique pour horizon. À vous seuls, jusqu'à 8. Réservez en direct — sans frais Airbnb. ☀️
```
**Primary text — variante 2**
```
Imaginez votre matin ici : café sur la terrasse, eau turquoise à vos pieds. La Villa Amaryllis vous attend en Martinique. 4,79★ · 97 avis.
```
**Primary text — variante 3**
```
Pourquoi payer les frais de service Airbnb ? Réservez la Villa Amaryllis en direct : même villa, ~15 % moins cher, contact direct avec l'hôte.
```
**Titres (≤40 car.)**
```
Votre villa privée en Martinique
Villa Amaryllis · Piscine & vue mer
Réservez en direct, sans frais Airbnb
```
**Descriptions (≤30 car.)**
```
4,79★ · 97 avis vérifiés
Jusqu'à 8 · piscine privée
```
**CTA bouton** : `Réserver` (ou `En savoir plus` en TOFU froid)

### ANGLE 2 — Studio Mabouya (→ `/mabouya`)
**Primary text — variante 1**
```
Un jacuzzi privatif, un jardin, et juste vous deux. La parenthèse romantique se vit en Martinique. Dès 82 €/nuit, en direct. 💛
```
**Primary text — variante 2**
```
Offrez-vous une vraie parenthèse à deux : jacuzzi privatif sous les étoiles des Antilles. Réservez en direct, sans frais de service.
```
**Primary text — variante 3**
```
Lune de miel, anniversaire, ou simplement s'évader ensemble. Le studio Mabouya, son jacuzzi et son jardin vous attendent. 4,79★.
```
**Titres**
```
Parenthèse à deux en Martinique
Jacuzzi privatif · juste vous deux
Évasion romantique dès 82 €/nuit
```
**Descriptions**
```
Jardin & jacuzzi privatif
4,79★ · réservation directe
```
**CTA** : `En savoir plus` (froid) / `Réserver`

### ANGLE 3 — T2 Schœlcher (→ `/schoelcher`)
**Primary text — variante 1**
```
Le réveil face au lagon : votre café du matin, la mer pour décor. Appartement de standing avec vue mer en Martinique. En direct.
```
**Primary text — variante 2**
```
Vue mer, terrasse, calme du front de mer. L'appartement de standing à Schœlcher, réservé en direct — sans frais Airbnb. 4,79★.
```
**Primary text — variante 3**
```
Et si vos vacances commençaient par cette vue ? Appartement de standing face à la mer en Martinique. Paiement sécurisé, contact direct.
```
**Titres**
```
Vue mer en Martinique
Réveil face au lagon
Appartement de standing · vue mer
```
**Descriptions**
```
Terrasse vue mer · 4,79★
Réservation directe sécurisée
```
**CTA** : `En savoir plus` / `Réserver`

### ANGLE 4 — Offre Groupe (→ `/location-groupe-sainte-luce`)
**Primary text — variante 1**
```
Toute la tribu, une seule adresse. Réunissez jusqu'à 11 proches dans une résidence privée à Sainte-Luce. Un seul paiement. ☀️
```
**Primary text — variante 2**
```
Famille nombreuse ? Bande d'amis ? Réservez la résidence entière en Martinique : piscines, jacuzzi, et tout le monde réuni. En direct.
```
**Primary text — variante 3**
```
Le grand format en direct : jusqu'à 11 personnes, plusieurs logements mitoyens, une seule réservation. Sans commission Airbnb.
```
**Titres**
```
Toute la tribu en Martinique
Jusqu'à 11 personnes · une adresse
Résidence privée à Sainte-Luce
```
**Descriptions**
```
Piscines & jacuzzi privés
Un seul paiement, en direct
```
**CTA** : `En savoir plus`

> **Note légale/cohérence** : ne jamais écrire « villa Mabouya/Géko/Schœlcher » (fact-checker). Garder « ~15 % moins cher qu'Airbnb » formulé comme « sans frais de service » pour éviter une comparaison prix littérale contestable. 4,79★/97 avis = chiffres réels à garder à jour.

---

## 6) Briefs visuels (formats, do & don't, accroche 1ʳᵉ seconde)

> Tu as un portefeuille photo existant — l'essentiel est de **choisir les bonnes** et d'en **décliner les formats**. Produire 1-2 Reels verticaux serait le gros gain.

### Formats à fournir par annonce (décliner CHAQUE visuel)
| Placement | Ratio | Usage | Priorité |
|---|---|---|---|
| Feed FB/IG | **1:1** (1080×1080) ou **4:5** (1080×1350) | image principale feed | ✅ indispensable |
| Stories / Reels | **9:16** (1080×1920) | full-screen, fort impact | ✅ fort (ce produit y brille) |
| Carousel | 1:1 par carte | offre groupe / tour des pièces | utile |

> **4:5 prend plus de place dans le feed que 1:1** → privilégier 4:5 en feed. **9:16 obligatoire** pour Stories/Reels (le placement le moins cher et le plus immersif pour du voyage).

### Sélection photo par angle
- **Amaryllis** : LA photo piscine + vue mer (la plus « waouh »). En 2ᵉ : terrasse au coucher de soleil, intérieur lumineux. Carousel possible : piscine → terrasse → chambre → vue.
- **Mabouya** : jacuzzi (idéalement crépuscule, eau qui fume, lumière chaude), jardin, détail cosy (linge, plantes). Ambiance intime.
- **Schœlcher** : terrasse + horizon mer au lever du jour, table petit-déj face à la mer.
- **Groupe** : grande tablée extérieure, piscine partagée, vue d'ensemble de la résidence. **Carousel** = montrer les logements mitoyens.

### Reel / Story — accroche 1ʳᵉ seconde (déterminante)
- **Seconde 0** : la plus belle image en mouvement (travelling lent sur la piscine face mer, ou l'eau du jacuzzi). **Pas de logo, pas de texte d'intro** : on montre le rêve immédiatement.
- **Secondes 1-3** : 1 phrase texte à l'écran (« Votre villa privée en Martinique » / « Juste vous deux, et un jacuzzi »).
- **Secondes 4-10** : 2-3 plans (intérieur, terrasse, détail), texte « Réservez en direct · sans frais Airbnb · 4,79★ ».
- **Fin** : CTA visuel « Lien en bio / Réservez » + URL villamaryllis.com.
- Format **vertical natif, lumineux, son léger (musique douce)**, sous-titres si voix.

### DO
- ✅ Lumière naturelle, couleurs chaudes, eau turquoise saturée juste ce qu'il faut.
- ✅ Montrer **l'expérience** (le bain, le café face mer) plutôt que juste l'architecture.
- ✅ Incruster discrètement **4,79★** ou **« sans frais Airbnb »** sur 1 visuel/angle (preuve).
- ✅ Garder un cadre cohérent avec l'identité chaleureuse premium d'Amaryllis.

### DON'T
- ❌ Pas de photos sombres, désordonnées, ou avec des personnes reconnaissables sans accord (droit à l'image).
- ❌ Pas de texte couvrant >20 % de l'image (pénalise la diffusion, brouille le message).
- ❌ Pas de stock photos génériques « Caraïbes » : uniquement les vrais biens (authenticité = conversion).
- ❌ Ne pas écrire « villa » pour Mabouya/Géko/Schœlcher/Zandoli.
- ❌ Pas de promesse prix littérale invérifiable (« -15 % » chiffré dans l'image) → préférer « sans frais de service ».

---

## 7) CHECKLIST TRACKING (BLOQUANTE — à valider AVANT toute dépense)

> Sans ceci, **aucun retargeting ni lookalike possible**, et tu ne sauras jamais quelle pub génère une résa. Le site a déjà l'event `purchase` côté client (GA4) — il faut son équivalent **Meta Pixel + CAPI**.

### A. Pixel Meta (navigateur)
- [ ] **Créer/identifier le Pixel** dans Meta **Gestionnaire d'événements** (Events Manager). Noter le **Pixel ID**.
- [ ] **Poser le code de base du Pixel** sur tout le site (dans le `<head>`, toutes pages). Le site est une SPA (Cloudflare Pages) → vérifier que `PageView` se déclenche aussi aux **changements de route** (pas seulement au 1ᵉʳ chargement).
- [ ] Vérifier avec l'extension **Meta Pixel Helper** (Chrome) que `PageView` remonte sur `/`, `/amaryllis`, `/mabouya`, `/schoelcher`, `/location-groupe-sainte-luce`.

### B. Events standard à câbler (mapper sur les events site existants)
| Event Meta | Quand le déclencher | Paramètres requis |
|---|---|---|
| `PageView` | toutes les pages | — |
| `ViewContent` | ouverture d'une fiche bien | `content_name` (= bien), `content_ids` |
| `InitiateCheckout` | ouverture/début du formulaire de paiement | `value` (estimé), `currency: 'EUR'` |
| **`Purchase`** ✅ | résa payée confirmée (même endroit que l'event `purchase` GA4 existant) | **`value` (montant € de la résa)**, **`currency: 'EUR'`**, `content_name` |

> ⚠️ **Le `Purchase` AVEC `value` en € est non négociable** : c'est lui qui permet le ROAS et l'optimisation « Ventes » + lookalike acheteurs. Brancher exactement là où le site envoie déjà l'event `purchase` client (cf. PROJECT_MEMORY §5.6 : utiliser l'event `purchase` **client**, pas `booking_completed` serveur).

### C. Conversions API (CAPI) — recommandé (fiabilise vs adblock/iOS)
- [ ] Activer la **Conversions API** (server-side) pour au moins `Purchase`. Le site tourne sur **Cloudflare Pages Functions** → une `functions/api/meta-capi.js` peut POSTer l'event `Purchase` vers le **Graph API Meta** au moment du webhook Stripe (`stripe-webhook.js`, là où `booking_completed`/`purchase` est déjà géré). Secrets `META_APP_SECRET` / `META_PAGE_TOKEN` existent déjà → il faudra en plus un **token CAPI du dataset** + le **Pixel/Dataset ID**.
- [ ] Mettre en place la **déduplication** : envoyer le **même `event_id`** côté Pixel (navigateur) et côté CAPI (serveur) pour le même Purchase, sinon double comptage.
- [ ] Renseigner un maximum de **paramètres de correspondance** (email haché, etc.) pour améliorer le matching (RGPD : email **haché SHA-256**, jamais en clair).

### D. Réglages compte / conformité
- [ ] **Vérifier le domaine** `villamaryllis.com` dans Meta Business (Sécurité de la marque → Domaines) — requis pour l'optimisation des conversions (Aggregated Event Measurement).
- [ ] **Configurer les 8 événements prioritaires** (AEM) avec **`Purchase` en priorité 1**.
- [ ] **Bandeau de consentement (RGPD)** : le Pixel ne doit se déclencher qu'après consentement cookies (cohérent avec `ad_storage` / Consent Mode déjà au backlog — cf. data-002). Le **Mode de consentement** Meta doit être respecté.
- [ ] Confirmer le **compte publicitaire** + **moyen de paiement** + **limite de dépense du compte** (sécurité anti-dérapage).

### E. Validation finale avant lancement
- [ ] **Test Events** (Events Manager → Tester les événements) : faire une vraie résa test (ou simulateur) et voir `Purchase` arriver **avec `value` + `currency=EUR`**, **sans doublon** (dédup OK), **navigateur + serveur**.
- [ ] Pixel **« Actif »** (vert) dans Events Manager depuis ≥24-48 h avant de scaler.

> **Si le Pixel n'est pas encore posé** : à poser = (1) code de base Pixel dans le `<head>` SPA-aware, (2) `ViewContent` à l'ouverture de fiche, (3) `InitiateCheckout` à l'ouverture du paiement, (4) **`Purchase` avec `value`/`currency`** au même endroit que l'event `purchase` GA4 client déjà en place. CAPI = bonus fortement recommandé via une nouvelle Pages Function branchée sur le webhook Stripe.

---

## 8) Budget, calendrier de test, KPIs, règles d'optimisation

### Budget (test réaliste, complément du ~400 € Google)
| Phase | Campagne / ad set | Budget/j | Durée | Total |
|---|---|---|---|---|
| **Juin sem 1-2** | C1-TOFU : A1 Amaryllis (5 €) + A2 Mabouya (5 €) | **10 €/j** | 14 j | ~140 € |
| **Juin sem 3-4** | garder gagnant (5 €) + A3 Groupe (5 €) | **10 €/j** | 14 j | ~140 € |
| **Septembre** | + C2-BOFU Retargeting (5 €) + scale gagnant (jusqu'à 15 €) | **15–20 €/j** | mensuel | à cadrer |

> **Minimum viable** : 5 €/j par ad set pendant ≥7 j avant de juger (sous ce seuil, Meta n'a pas de quoi optimiser). Si budget serré : **1 seul angle à 7-10 €/j** plutôt que 2 angles sous-financés.

### KPIs attendus (ESTIMATIONS — marché FR tourisme/voyage 2025-2026)
| Métrique | TOFU froid (Trafic/Notoriété) | BOFU Retargeting (Ventes) | Lecture |
|---|---|---|---|
| **CPM** | 6–12 € | 8–15 € | coût/1000 impressions |
| **CTR (lien)** | 0,8–1,8 % | 1,5–3,5 % | <0,8 % froid = créa faible |
| **CPC (lien)** | 0,40–1,20 € | 0,30–0,90 € | — |
| **Coût/ViewContent** | 1–3 € | — | engagement fiche |
| **CPA (résa)** | difficile à juger en juin (peu de volume) | viser **< 15 % du panier** | Mabouya panier ~250-500 € → CPA cible <40-75 € ; Groupe 2 500-4 000 € → CPA cible <300-500 € |
| **ROAS** | non pertinent en TOFU | viser **≥ 3-4×** une fois mûr | 1 résa groupe = ROAS énorme |
| **Hook rate (Reel)** | ≥ 25 % (vues 3s/impressions) | — | qualité 1ʳᵉ seconde |
| **Fréquence** | garder **< 2-2,5** sur 7 j | < 3 (retarget tolère +) | au-delà = fatigue créa |

> En juin, **ne juge PAS sur les résas** (volume trop faible, lead-time long) : juge sur **CTR, CPC, coût/ViewContent, hook rate** + le **remplissage des audiences de retargeting**. Les résas se matérialisent en septembre.

### Règles d'optimisation
**Quand COUPER une pub / un ad set :**
- CTR lien < 0,6 % après **≥3 000 impressions** → créa faible, coupe ou remplace le visuel.
- CPC > 1,50 € (TOFU) après 7 j et budget dépensé > 30 € sans engagement → coupe l'angle/l'audience.
- Ad set en « apprentissage limité » > 7 j sans sortir → fusionne ou élargis l'audience (ne le laisse pas saigner).

**Quand SCALER :**
- Un angle avec CTR > 1,5 %, CPC bas, fréquence < 2 et coût/ViewContent < 2 € → augmente le budget de **+20-30 % tous les 3-4 jours** (jamais doubler d'un coup : ça relance l'apprentissage).
- Au scale, envisage CBO + **dupliquer le gagnant** sur une audience lookalike.

**Fatigue créative (rafraîchir) :**
- Quand la **fréquence dépasse ~2,5 sur 7 j** OU que le CTR chute de >30 % vs le pic → **rafraîchir le créatif** (nouvelle photo/Reel, nouveau primary text). Prévoir **1 nouveau visuel toutes les ~2-3 semaines** par angle actif.
- Garde toujours **3 créas par ad set** en rotation : l'algo en privilégie un, mais les autres prennent le relais quand il fatigue.

**Hygiène hebdo (10 min) :**
- Vérifier Pixel toujours « Actif » + `Purchase` avec value.
- Regarder fréquence, CTR, coût/ViewContent par créa → couper/rafraîchir.
- Noter la taille des audiences de retargeting qui se remplissent (objectif : >1 000 d'ici septembre).

---

## 9) Récap actions Vincent (ordre d'exécution)
1. **Tracking d'abord** : cocher toute la checklist §7 (Pixel + `Purchase` value € + idéalement CAPI). **Bloquant.**
2. Confirmer le **compte publicitaire** + moyen de paiement + limite de dépense.
3. Vérifier le **domaine** `villamaryllis.com` + configurer les 8 events AEM (`Purchase` priorité 1).
4. Créer **C1-TOFU** (objectif **Trafic**), 2 ad sets (Amaryllis + Mabouya), 3 créas chacun (1:1/4:5/9:16), audiences A & B (§3), 10 €/j.
5. Laisser tourner **≥7 jours** sans toucher. Juger sur CTR/CPC/ViewContent (pas sur résas).
6. Couper le perdant, garder le gagnant, ajouter **angle Groupe** (sem 3-4).
7. **Créer dès maintenant** les audiences de retargeting R1-R4 (elles se rempliront, même si on ne diffuse pas encore dessus).
8. **Septembre** : activer **C2-BOFU Retargeting** (objectif Ventes) + scaler le gagnant + lancer **Lookalike** dès ≥100 personnes source.

> Rappel cadre : Claude **prépare**, Vincent **lance et dépense**. Aucun chiffre de perf ici n'est garanti — ce sont des **estimations** à recalibrer sur tes vraies données.
