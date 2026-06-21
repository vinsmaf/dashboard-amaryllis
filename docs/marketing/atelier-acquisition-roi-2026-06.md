<!-- Généré par workshop multi-agents (12 agents) le 2026-06-21. Baseline funnel LIVE — source vivante = npm run funnel, ce doc périme. -->

# 🎯 Atelier — Attirer le bon public & maximiser le ROI
### Amaryllis Locations · juin 2026 · document de pilotage hebdomadaire

> **Cadre de lecture.** Baseline funnel LIVE 2026-06-21 (30j) : **739 sessions, 887 view_item, 64 begin_checkout (7,2 %), 4 purchase (0,5 %), ~2 894 €**, pub ~540 €/mois. Source vivante = `npm run funnel` (jamais ce document, il périme). **RM = advisory only** : Claude prépare des recos chiffrées, Vincent applique tout prix/budget/publication/fiche GBP.
>
> **Le verrou central, dit franchement.** Le problème n'est ni le tunnel (techniquement abouti) ni l'idée d'origine — c'est **(1) la qualité du trafic** (51 % Martinique non-acheteur), **(2) une fuite haut-de-tunnel à 93 %** (les visiteurs de fiche ne sélectionnent jamais de dates), **(3) une attribution aveugle** (88 % du CA en Unassigned, verdict propre attendu **03/07**), et surtout **(4) une seule paire de mains.** Le vrai goulot n'est pas le trafic, c'est **le temps de Vincent**. Ce document est donc séquencé pour un solo : on répare le mesurable et le gratuit d'abord, on n'ouvre aucun chantier à risque légal/fiscal sans cadrage.

---

## 1. TL;DR — les 5 décisions à prendre cette semaine

| # | Décision | Pourquoi maintenant | Qui agit |
|---|---|---|---|
| **1** | **Réparer `geko.json`** (virgule traînante L85 → JSON invalide) | Bug confirmé : le catalogue extras + le fallback guide de Géko (cœur de gamme, 4.83) sont **silencieusement morts**. Fix 2 min. C'est la preuve vivante de la dette de maintenance invisible. | Claude |
| **2** | **Instrumenter la fuite n°1** : events GA4 `availability_ready` + `date_selected` | 93 % des visiteurs de fiche ne touchent jamais le calendrier — et on ne sait pas s'ils *ne le voient pas*, *le voient sans cliquer* ou *butent sur un calendrier vide*. Bloquant pour tout le reste. | Claude |
| **3** | **Pré-charger l'availability au mount de la fiche** (calendrier cliquable <1s) | Levier mécanique le plus rentable du backlog : réseau DOM/Caraïbes lent = calendrier vide au moment décisif. Doubler view_item→begin_checkout double les résas **sans dépenser un euro de pub.** | Claude |
| **4** | **Exclure la Martinique du paid de séjour** (Google + Meta) + négatifs | 51 % du trafic local non-acheteur pollue tous les ratios. Gratuit, zéro risque, gain immédiat sur le CAC réel. | **Vincent** (touche le ciblage) |
| **5** | **Refondre le bloc upsell `pre-arrivee.html`** (champagne/transfert/late-checkout visuels) + **code RETOUR-8 dans l'email post-séjour J+1** | Active deux moteurs qui tournent à vide sur des séjours **déjà acquis** (ne dépend pas du trafic). ~1h chacun, zéro fournisseur. | Claude (Vincent valide l'envoi groupé) |

> **Garde-fou transverse (à graver) :** tant que l'attribution est aveugle (jusqu'au 03/07), **ne PAS lever "Max conversions" ni monter les budgets pub.** On optimiserait un ciblage qu'on ne mesure pas = on brûle du cash.

---

## 2. Le bon public — personas / ICP par segment de biens

Les 7 biens ne se vendent pas au même public. Le budget se concentre sur les **gros paniers** (Amaryllis, Zandoli) et la **diaspora**, jamais en moyenne (RM-03/08/21).

### 🏖️ Persona A — « La tribu retrouvailles » → **Villa Amaryllis** (280 €, 8p, 4.94)
- **Qui :** familles élargies, groupes d'amis 30-55 ans, retrouvailles/anniversaires. Décideuse = l'organisatrice CSP+ métropole (IDF/Lyon/Bordeaux).
- **Budget séjour :** 1 700–2 600 €. **LE bien où le payant est rentable** (~179 € de commission OTA évitée/résa).
- **Déclencheur :** événement daté, réserve **4–6 mois à l'avance** (régime TENIR, RM-02). Cherche capacité ≥8, piscine sécurisée, vue mer.
- **Canal :** Google Ads non-brand haute intention + Meta lookalike acheteurs + retargeting + **diaspora**.
- **Message :** « Toute la famille sous un même toit, vue Caraïbes 180°. En direct, sans les frais Airbnb. » Mettre **4.94** au hero (actif le plus rare du parc).

### 👨‍👩‍👧 Persona B — « Famille nucléaire + amis » → **Zandoli** (110 €, 5p, 4.5) & **Géko** (110 €, 4p, 4.83)
- **Qui :** couples 30-45 ans + 1-2 enfants, ou 2 couples. Confort + piscine, budget maîtrisé.
- **Budget séjour :** 770–1 100 €. **Cœur de gamme volume** — là où le flux direct se concentre en nombre.
- **Déclencheur :** vacances scolaires, « villa avec piscine à prix raisonnable ». Compare activement Airbnb. Sensible à la piscine privative à cascade et à la note (Géko 4.83 en avant ; Zandoli mené par **verbatim qualitatif**, pas le 4.5 brut, RM-13).
- **Canal :** Google Ads non-brand (« villa Sainte-Luce piscine »), Meta intérêt Caraïbes + retargeting, SEO longue traîne.

### 💑 Persona C — « Le couple escapade » → **Mabouya** (70 €, 2p, 4.55) & **Schœlcher** (90 €, 2p, 4.8)
- **Qui :** couples 28-50 ans, lune de miel, week-end. Mabouya = seul jacuzzi privatif vue mer. Schœlcher = city break Fort-de-France.
- **Budget séjour :** 280–630 €. **Panier faible → commission évitée trop mince pour du paid dédié** (~15-23 €/nuit). **CAC visé ≈ 0.**
- **Canal :** SEO local + cross-sell depuis la base CRM + remplissage OTA en creux (RM-09). **Zéro paid.** Mener par l'émotion + le verbatim.

### 🏙️ Persona D — « Pro / famille en transit » → **Nogent-sur-Marne** (90 €, 2p, 4.8, Beds24)
- **Qui :** pros en déplacement IDF, familles visitant un proche, moyenne durée. **Saisonnalité INVERSE de la Martinique** — jamais calquer le calendrier Sainte-Luce (RM-22).
- **Canal :** SEO local pur (« meublé Nogent-sur-Marne », « bord de Marne RER A ») + **GBP Nogent dédié**. **Pas de Meta, pas de Google Ads** (volume géo trop étroit, commission trop mince).

> **Iguana = hors scope acquisition** (bail long Joël Bailleul, `bookable:false`). Jamais en campagne.

### 🎯 Segment transverse prioritaire — la **DIASPORA antillaise**
Métropolitains d'origine antillaise rentrant à Noël/l'été. Réservent **tôt et longtemps**, sensibles au bouche-à-oreille, LTV haute, **basculent en direct facilement.** Cible Meta + CRM prioritaire pour Amaryllis/Zandoli, **à activer T-3/T-4 mois avant Noël = dès maintenant pour la saison déc-avr.**

---

## 3. Stratégie d'acquisition ciblée — par canal + filtres anti-mauvais-trafic

### 🔍 SEO local — capter l'intention haute (autorité hors-page, pas la technique)
La couche technique est saine (prerender 63 URLs, JSON-LD, hreflang). Manque = **autorité hors-page.**

| Cluster mots-clés | Requêtes | Page cible |
|---|---|---|
| Villa + piscine + lieu | `location villa Martinique piscine privée`, `villa Sainte-Luce piscine`, `villa Martinique 8 personnes` | Amaryllis |
| Direct propriétaire | `location vacances Martinique direct propriétaire`, `villa Martinique sans frais` | Home + Amaryllis/Zandoli |
| Longue traîne expérience | `villa vue mer débordement`, `piscine à cascade Sainte-Luce`, `studio jacuzzi privatif Martinique` | Zandoli, Géko, Mabouya |
| Nogent | `appartement Nogent-sur-Marne courte durée`, `meublé bord de Marne RER A` | Nogent |

**Actions hors-page (advisory, Vincent valide la fiche) :** GBP **Sainte-Luce** + GBP **Nogent** (NAP cohérent) ; **router les avis vers Google** (deep-link J+1/J+2 sur le pic de satisfaction — l'avis Google renforce villamaryllis.com, l'avis Airbnb renforce Airbnb) ; citations annuaires DOM ; recycler les guides en aimants.
**Potentiel :** Organic Search 72 → 200 sessions/mois sur 6 mois × ~2 % = ~4 résas directes/mois, ~600-1 000 € de commission évitée/mois sur Amaryllis/Zandoli.

### 🎯 Google Ads — concentrer le budget, filtrer les curieux (plafond CAC = 50 % de la commission évitée par bien)

| Campagne | Mots-clés | Landing | Budget indicatif |
|---|---|---|---|
| **C-Brand (défensif)** | `villa amaryllis`, `villamaryllis` | Home / fiche Amaryllis | **Plancher ~30 €/mois** (Billboard Effect, RM-06) |
| **C-NonBrand Villa premium** | `location villa Martinique piscine`, `villa 8 personnes` | **Fiche Amaryllis, dates pré-suggérées** (pas la home) | **Gros du budget ~120 €/mois** |
| **C-NonBrand Famille** | `villa familiale Martinique piscine`, `villa Sainte-Luce` | Fiche Zandoli / cluster | ~60 €/mois **saison haute seulement** |

- **Géo : EXCLURE la Martinique** des campagnes de séjour. Cibler France métropole (IDF, ARA, N-Aquitaine, PACA) + Québec en saison haute.
- **Calendrier : concentrer nov→avril.** Réduire mai-oct (creux cyclonique → bascule OTA, RM-09).
- **Négatifs à ajouter aux 120 :** `emploi, recrutement, vente, à vendre, achat, immobilier, mairie, camping, auberge, hôtel pas cher, croisière, stage, EHPAD, colocation, à l'année, bail, location longue durée`. Le négatif **`à l'année`/`location longue durée` est crucial** (évite les chercheurs de bail, le mauvais public n°1).

### 📱 Meta Ads — intérêts précis, lookalike acheteurs, retargeting

| Niveau | Audience | Bien |
|---|---|---|
| TOFU | Intérêts Caraïbes/Martinique + CSP+ 30-55 ans, **France/Québec (PAS MTQ)** | Amaryllis |
| TOFU Diaspora | Affinité culture antillaise + résidents métropole | Amaryllis/Zandoli |
| MOFU Lookalike | **Lookalike 1-3 % acheteurs Stripe** (à activer une fois attribution propre) | Amaryllis/Zandoli |
| BOFU Retargeting | Visiteurs fiche 30j non convertis + paniers abandonnés | Le bien vu |

### 🎬 Reels — attirer des PROSPECTS, pas des vues
Organic Social = 1er canal en volume (239 sessions) mais **0 conversion** et **non taggé UTM** (angle mort total).
1. **Tagger TOUS les liens bio + Reels en UTM** (`utm_source=instagram&utm_medium=organic_social&utm_campaign=reel_<bien>`). Sans ça, canal invisible à vie.
2. Formats orientés prospect avec **CTA daté** : « POV : ton réveil à la Villa Amaryllis — dispos pour Noël, lien en bio », carrousel cluster, témoignage diaspora. **Jamais un Reel joli sans appel à l'action.**
3. Mesurer si le social ramène du local (dé-prioriser) ou de la métropole (amplifier).

### 🧲 Filtres anti-mauvais-public

| Filtre | Action | Effet |
|---|---|---|
| Exclusion géo MTQ (paid séjour) | Retirer MTQ du ciblage acquisition | -51 % trafic non-acheteur |
| Négatifs Google | Liste ci-dessus | Filtre bail/curieux/emploi |
| Segmentation funnel par pays | Recalculer la conversion **hors MTQ** (dès le 03/07) | Vrai taux acheteur, débloque le budget |
| UTM partout | Reels, bio, rebook OTA→direct, emails | Rend visibles les 418 sessions aveugles |
| Landing alignée intention | Paid Search → fiche du bien (dates pré-suggérées), pas la home | Monte view_item→begin_checkout |
| CTA daté social | « Dispos pour Noël » > « Découvrez la villa » | Auto-sélectionne les vrais prospects |

---

## 4. 🎛️ Objectifs hebdomadaires — 2 niveaux, cibles réalistes

> Paliers : on ne vise pas 75 % direct du jour au lendemain. On **double le débit haut-de-tunnel d'abord.** Le KPI roi = **sessions qualifiées (hors MTQ)**, pas le total.

### NIVEAU A — VISITEURS (le débit qualifié)

| KPI | Baseline 30j | Hebdo actuel ≈ | 🎯 T1 (4-6 sem) | 🎯 T2 (saison haute) | Source |
|---|---|---|---|---|---|
| Sessions totales | 739 | ~185 | 220 | 300+ | `funnel` byChannel |
| **Sessions qualifiées (hors MTQ)** | ~364 (49 %) | ~91 | 120 | 175 | `funnel` byPays |
| **begin_checkout / sem** | ~16 | ~16 | 28 | 45 | `funnel` events |
| **view_item → begin_checkout** | **7,2 %** | 7,2 % | **12 %** | 15 % | `funnel` |
| Coût / visiteur qualifié (Ads) | aveugle | — | < 3 € | < 2,5 € | `funnel` ÷ spend |

### NIVEAU B — RÉSERVATIONS (l'argent)

| KPI | Baseline 30j | Hebdo actuel ≈ | 🎯 T1 | 🎯 T2 | Source |
|---|---|---|---|---|---|
| `generate_lead` (devis/contact/WhatsApp) | 2 | ~0,5 | 3 | 5 | `funnel` |
| **Résas directes / sem** | ~1 | ~1 | **2** | **3-4** | `funnel` purchase |
| Conv. visiteur qualifié → résa | ~1,1 % | — | 1,7 % | 2,2 % | calc |
| **Panier moyen direct** | ~720 € | 720 € | 800 € | 850 € (+upsell) | `funnel` revenue |
| Part directe vs OTA (nuitées) | ~8 % | — | 12 % | 18 % | ConversionTab |
| **ROAS** (post-03/07) | aveugle | — | >2 | >3 | `funnel` ÷ 540 € |
| Upsell (AOV services) | n/d (~0) | — | 1 vente/sem | 30 % des séjours | onglet Ventes |

> **Garde-fou CAC :** plafond = 50 % de la commission OTA évitée par bien. Amaryllis ≈ 190 € évités → CAC max ~80 €. Mabouya ≈ 35 € évités → CAC max ~17 € → **zéro paid dédié.** Budget = Amaryllis + Zandoli.

---

## 5. 📋 Playbook « Si résultat → Alors action »

Chaque lundi : pour chaque KPI sous-cible, descendre dans sa branche, activer **1-2 actions max** (débit faible = peu de signal, on teste une chose à la fois). Ordre : **haut du tunnel avant le bas.**

### 🔵 Déclencheur 1 — Sessions qualifiées < cible (débit / mauvais public)
| Symptôme | → Alors |
|---|---|
| **>50 % trafic Martinique** | 1. Vérifier ciblage géo Meta/Google (exclure MTQ acquisition). 2. Concentrer budget France métropole + Québec (nov-avr). *(advisory budget)* |
| **Sessions en baisse** | 1. Vérifier ruptures budget/refus (point-ads-hebdo). 2. Pousser 1-2 Reels les plus vus, lien fiche bio taggé UTM. 3. Landing guide-destination en ad group générique. |
| **Organic Search 0 vente (72 sess)** | 1. GBP par zone, NAP cohérent *(Vincent valide)*. 2. Citations annuaires DOM. 3. Capter le Billboard Effect sur « villa Amaryllis Sainte-Luce ». |
| **Anglophone fuit (78 sess CA+US sur du FR)** | 1. Prioriser version EN des 3 fiches premium. 2. Vérifier hreflang. 3. 1 ad group EN Québec saison haute. |

### 🟡 Déclencheur 2 — view_item → begin_checkout < 12 % (la fuite #1, 93 %)
| Symptôme | → Alors |
|---|---|
| **Calendrier lent/vide au moment décisif** | 1. **Pré-charger l'availability au mount** (widget <1s). 2. Pré-remplir 2 dates suggérées. |
| **Segment aveugle (vu calendrier ou pas ?)** | 1. **Câbler `availability_ready`/`date_selected`** — sans ça on optimise à l'aveugle. |
| **Pas de preuve externe à Airbnb** | 1. Brancher avis Google `place=residence` sur les 6 biens hors Amaryllis. 2. Renforcer le « −15 % vs Airbnb ». |
| **Paid 0 achat (179 sess)** | 1. Router Paid Search → fiche du bien recherché (dates suggérées), pas la home. 2. Négativer les requêtes consommant sans begin_checkout *(advisory)*. |

### 🟠 Déclencheur 3 — begin_checkout → purchase < 30 % (fuite paiement)
| Symptôme | → Alors |
|---|---|
| **Abandon avant l'écran carte** | 1. Créer le PaymentIntent en arrière-plan dès l'étape 2. 2. Ajouter Apple Pay / Google Pay (70 % mobile). |
| **add_payment_info → purchase chute** | 1. Vérifier feedback + état d'échec. 2. Tester 3DS sur réseau DOM lent (surveiller post-03/07). |
| **Paniers abandonnés** | 1. Vérifier que le cron relance tourne et exclut les convertis. 2. Relance J+1 + code promo first-booking. |
| **Devis pris, pas de résa** | 1. Mesurer `generate_lead → résa`. 2. Séquence CRM de relance devis. |

### 🟢 Déclencheur 4 — Panier moyen < cible
| Symptôme | → Alors |
|---|---|
| AOV bas | 1. 2-3 extras forte marge (champagne, transfert, panier créole) dans pré-arrivée + récap. 2. Enrichir le catalogue. |
| Séjours courts | 1. LOS sur pics (min 4-5 nuits Amaryllis/Zandoli si pickup J-45 confirme, RM-04). 2. « 7 nuits → late check-out offert ». |
| Pas d'upsell visible | 1. Vérifier le volume `service_orders` (onglet Ventes). 2. QR écran TV + bloc récap. |

### 🟣 Déclencheur 5 — Part directe vs OTA < cible (désintermédiation)
| Symptôme | → Alors |
|---|---|
| OTA→direct invisible | 1. **Tagger les liens rebook** (emails post-séjour, TV, QR) `utm_source=poststay_email&utm_medium=rebook`. |
| Repeaters non relancés | 1. Builder auto `crm_clients`. 2. Relance saison haute dès septembre. 3. Cross-sell Mabouya/Géko → Amaryllis/Zandoli (CAC ~0). |
| Pic saturé, OTA ouverte | 1. **Séquencer** : ne restreindre l'OTA Amaryllis/Zandoli déc-avr **que** quand le direct tient (voir angle mort #5). *(advisory)* |
| Creux invendu | 1. Rouvrir OTA 100 % juil-oct (aspirateur de demande résiduelle, RM-09). |

### 🔴 Déclencheur 6 — ROAS aveugle / sous 2
| Symptôme | → Alors |
|---|---|
| **>80 % CA en Unassigned** | 1. **Ne PAS lever « Max conversions » ni monter les budgets.** 2. Le 03/07 : vérifier la sortie d'Unassigned ; sinon débugger pourquoi `ga_client_id` n'arrive pas au webhook. |
| **bien_id (not set)** | 1. Vérifier le param top-level `bien_id` dans le purchase server-side. |
| **Spend sans begin_checkout** | 1. Négativer les requêtes non transformables, rebasculer sur non-brand gros tickets *(advisory)*. |

---

## 6. 💰 Catalogue d'upsells pendant le séjour

> **Le gisement le plus rentable** car il **ne dépend PAS du débit d'acquisition** (séjours déjà acquis) et la marge est quasi nette. **Réserve : le volume réel n'est pas ~700 séjours mais ~250-400** (6 biens bookables, 5-7 nuits, saisonnalité DOM). Le « 700 » = nuitées/OTA brut. **Diviser les projections d'origine par ~2.** Cible réaliste consolidée **+400-900 €/mois** la 1ʳᵉ année, montant en charge avec les partenariats.

### 🟢 P0 — Activer l'existant (7 extras déjà codés, sous-exploités)
| Extra | Prix | Marge nette | Timing | Gain/résa pondéré |
|---|---|---|---|---|
| **Départ tardif / arrivée anticipée** | 50-80 € | ~45 € | **Pré-départ J-1** | **~9 €** (le meilleur single) |
| Champagne + fruits | 50 € | ~30 € | Pré-arrivée J-3 + récap | ~5 € |
| Planteur maison | 15 € | ~12 € | Récap + QR TV | ~3,5 € |
| Kit plage | 20 € | ~17 € | Pré-arrivée + J1 | ~3 € |
| Ménage mid-stay | 50-90 € | ~25-40 € | Pré-arrivée (séjours ≥7 nuits) | ~3 € |
| Kit bébé | 20 € | ~18 € | Au checkout (si enfant) | ~2 € |
| Capsules Nespresso | 10 € | ~6 € | In-stay QR mi-séjour | ~1,5 € |

**Actions P0 :** (1) éclater le bouton générique de `pre-arrivee.html` en 2-3 extras visuels (champagne + late-checkout en tête) ; (2) **cron pré-départ J-1** miroir de `send-prearrivee.js` poussant **uniquement le late-checkout** ; (3) brancher le QR écran TV in-stay. **Gain P0 : +400-700 €/mois sans rien construire.**

### 🔵 P1 — Commission zéro-stock (marge ~90 %, meilleur ROI/effort)
| Extra | Prix voyageur | Commission | Timing | Gain/résa pondéré | À construire |
|---|---|---|---|---|---|
| **Transfert aéroport** | 60-80 € A/R | 15-25 € | Pré-arrivée | ~7 € | Partenaire VTC + extra `transfert` |
| **Location voiture** | (chez le loueur) | 20-40 €/résa | Checkout + pré-arrivée | ~12 € | Lien tracké (besoin quasi universel MTQ) |
| Excursion catamaran | 60-90 €/pers | ~8-12 € | In-stay J1-J2 | ~4 € | Partenaire + lien tracké |
| Chef à domicile / traiteur créole | 40-70 €/pers | ~15-30 € | Pré-arrivée + in-stay | ~3 € | Partenaire chef |
| Plongée / snorkeling | 50-80 € | ~8-12 € | In-stay | ~2 € | idem |

**Priorité absolue : transfert + voiture** (besoins quasi universels, île sans transport public). Ajouter un `kind:"commission"` au catalogue + liens UTM dédiés. **⚠️ Voir angle mort #2 (droit du travail) avant de facturer chef/ménage : privilégier l'apport d'affaires pur — le client paie le prestataire.**

### 🟣 P2 — Packs forte valeur (AOV élevé) · 🟠 P3 — Flexibilité monétisée
| Extra | Prix | Marge | Timing | À construire |
|---|---|---|---|---|
| **Late-checkout GARANTI** (créneau bloqué) | 40-60 € | ~40 € | Checkout + pré-départ | Variante de l'existant (se vend mieux : supprime l'incertitude) |
| Panier d'accueil créole | 35-50 € | ~20-25 € | Pré-arrivée | Sourcing local + extra |
| Pack romantique (champagne+fleurs+déco) | 90-120 € | ~50-60 € | Champ « occasion » au checkout | **Bundler l'existant** — ⚠️ logistique physique réelle pour un solo, gain marginal |
| Assurance annulation (Koala/Chapka) | 4-6 % séjour | commission | Checkout (case à cocher) | Partenaire assureur (réduit aussi le no-show) |
| Location matériel longue durée | 10-25 € | ~15-20 € | In-stay | Via `inventory.js` |

> **Garde-fou tunnel :** au checkout, **1-2 cases discrètes max** (voiture, assurance, occasion), jamais d'étape bloquante — la fuite est déjà en haut du tunnel.

---

## 7. 🆕 Revenus annexes HORS séjour — du meilleur ratio au moins bon

> **Fil rouge :** ne pas créer de nouveaux business, **monétiser des actifs déjà payés** (trafic touristique, villa premium, savoir-faire conciergerie). **⚠️ Toutes les « marges nettes » ci-dessous sont BRUTES avant fiscalité** — voir angle mort #1.

| Piste | Impact €/mois | Effort | À construire | Légal/fiscal DOM |
|---|---|---|---|---|
| **Capture email + nurturing (lead magnet PDF)** | +400-700 | moyen | Compil des 8 guides existants (0 prod) + exit-intent + `generate_lead` | RGPD double opt-in. ✅ faible risque |
| **Affiliation excursions/transfert/voiture** (newsletter + guides) | +200-500 | moyen | Infra extras Stripe + send-bulk + guides existent | **BIC services hors LMP** → compta séparée, à cadrer comptable |
| **Restreindre OTA pics → pousser direct** (mix canal) | indirect | faible | RM-09, advisory | RM advisory, **séquencer** (angle mort #5) |
| **Amaryllis en décor / shooting** (créneaux journée vides basse saison) | +200-500 | moyen | Marché non-adressé par concurrents Airbnb | **Avenant assurance « tournage » obligatoire** + accord copro (conditionne aussi les panneaux solaires). ROI temps faible |
| **Newsletter mensuelle** (recyclage guides) | +100-250 | faible *(en réalité 2-4h/mois récurrentes)* | Segment `all` à ajouter à send-bulk | RGPD opt-in. Gain marginal vs temps sur base ~150 emails |
| **Conciergerie B2B** (gestion biens tiers, ~18-25 % CA géré) | variable récurrent | **élevé** | Stack tech = avantage | **🔴 2 bloquants durs : (a) loi Hoguet/carte G → juriste ; (b) prouver qu'un bien tourne sans Vincent (test Mabouya, RM-23) AVANT — sinon il se recrée un emploi.** Reporter. |

> **Pistes écartées :** événementiel grand public (mariages, day-pass) = risque ERP/assurance/copropriété en DOM. Gardé seulement en micro sous-seuil (séminaire 8 pers).

---

## 8. 🔁 Fidélisation & monétisation de l'audience

> À CAC ≈ 0, chaque résa rapatriée en direct vaut **+15-18 % de marge**, et un repeater coûte 5-7× moins cher qu'un inconnu. Tout est branché sur l'existant (`send-bulk-email.js`, `promo-codes.js`, vue `guests`, crons 9h/6h UTC). **Du câblage et du copywriting, pas de brique majeure.**

**Le levier n°1, dédupliqué : la bascule OTA→direct du segment capturé.** ~250-400 séjours/an dont les emails post-séjour passent. Chaque email capturé et basculé = commission économisée **à vie** sur ce client. Invisible aujourd'hui faute de séquence déclenchée. **C'est la seule mécanique qui change vraiment l'économie.**

**Programme « Cercle Amaryllis » (2 paliers, codes <15 % pour ne pas cannibaliser le « −15 % vs Airbnb », jamais publics — loi Macron) :**
- **Fidèle :** code `RETOUR-8` (−8 %, 12 mois, `max_uses:1`).
- **Ambassadeur (2+ séjours OU 5★) :** `CERCLE-12` (−12 %) + late-checkout offert + **early-booking déc-avr avant ouverture publique (coût 0 €).** Argument différenciant à marteler : **caution Stripe libérée en 3 jours vs blocage opaque Airbnb.**

**Séquences à greffer sur le cron 9h UTC :** post-séjour J+1 (code RETOUR-8 + bloc parrainage) · réactivation J+30 · **anniversaire J+365** (levier émotionnel fort) · off-saison last-minute aux anciens (comble la vacance à marge réduite plutôt que vide). **Newsletter mensuelle** = recyclage guides (cron lundi 6h UTC).

**Capture du trou béant :** `generate_lead = 2/30j` malgré 300+ sessions/mois. Lead magnet « Guide Secret de la Martinique » (compil guides) → email → nurturing J+0/J+4/J+10 → code `BIENVENUE-10` → newsletter.

**Builder auto `crm_clients`** (job cron) peuplant 6 segments RFM (Ambassadeurs, Fidèles, **OTA capturés**, Prospects tièdes, Dormants, Corporate). Débloque tout le ciblage.

**⚠️ Parrainage (filleul −10 %, parrain avoir 80 €) :** garder en backlog. Trou anti-fraude réel (auto-parrainage croisé dans une diaspora qui se connaît → 160 € offerts sur des séjours qui auraient eu lieu) + le palier « −12 % à vie » érode la marge structurellement et reste traçable en contrôle. À cadrer avant lancement.

---

## 9. 🗺️ Plan de marche 90 jours

### 🚀 Semaine 1 — réparer le mesurable et le gratuit (zéro risque, ROI/temps max)
| Action | Qui |
|---|---|
| Réparer `geko.json` (L85) | Claude |
| Events GA4 `availability_ready` + `date_selected` | Claude |
| Pré-charger l'availability au mount + cache CDN 5-10 min | Claude |
| Tagger UTM Reels/bio/rebook/emails | Claude |
| Refondre bloc upsell `pre-arrivee.html` | Claude |
| Code RETOUR-8 dans post-séjour J+1 + segments `repeaters`/`past_guests`/`all` à send-bulk | Claude (envoi groupé = OK Vincent) |
| **Exclure Martinique du paid de séjour + négatifs Google** | **Vincent** |

### 📅 Mois 1 — débloquer la conversion et la mesure
| Action | Qui |
|---|---|
| Cron pré-départ J-1 (late-checkout) | Claude |
| Apple Pay / Google Pay (Payment Element, domaine vérifié) | Claude |
| Dates pré-remplies « prochain dispo » (dépend du pré-chargement) | Claude |
| Avis Google `place=residence` sur les 6 biens | Claude |
| Lead magnet PDF + capture exit-intent | Claude |
| Builder auto `crm_clients` (6 segments RFM) | Claude |
| Instrumenter `service_orders` (onglet Ventes) | Claude |
| **Verdict attribution 03/07** → segmenter le funnel hors-MTQ → 1er ROAS réel par bien → décider budgets | Vincent (avec reco Claude) |
| **Campagne diaspora Meta + CRM** (T-3 mois avant Noël) | **Vincent** (budget) |

### 📆 Trimestre — leviers à dépendances (partenaires, légal, fiscal)
| Action | Qui · pré-requis |
|---|---|
| **GBP Sainte-Luce + Nogent** + router avis Google | **Vincent valide la fiche** |
| Étendre catalogue extras[] (transfert, voiture, panier créole, late-checkout garanti, assurance) | Claude (code) + **Vincent (4 partenariats)** |
| Programme Cercle + séquences J+30/J+365/off-saison + bascule OTA→direct | Claude · builder crm_clients |
| Relance panier 2 vagues, WhatsApp contextuel, rebond cluster, ChatWidget objections | Claude |
| Version EN des 3 fiches premium | Claude |
| **Cadrage comptable/juriste** (TVA outre-mer, taxe de séjour direct, BIC commissions, Hoguet, avenant tournage) | **Vincent + conseils** |

> **Discipline solo :** **une action par déclencheur à la fois.** À ~25 sessions/j, aucun A/B sur `purchase` n'est significatif — tester uniquement sur métriques amont volumineuses (`date_selected`, `availability_ready`). Le micro-CRO (charm pricing, couleur CTA) est **prématuré** tant que view_item→begin_checkout < 12 %.

---

## 10. ⚠️ Garde-fous & angles morts (issus de la critique)

1. **Double-comptage des projections.** Fidélisation (CA rebooké) + acquisition (commission évitée sur ces mêmes résas) + upsell (sur ces mêmes séjours) comptent **les mêmes euros 3 fois.** L'affiliation excursions est dans P1 **et** dans les revenus hors-séjour. **Ne jamais additionner les lentilles.** Potentiel consolidé dédupliqué réaliste : **+8 à 15 k€ net/an la 1ʳᵉ année** (pas +60-90 k€), et gourmand en temps.

2. **Mur fiscal/administratif DOM (le plus grave, jamais chiffré).** Vincent est en LMP. Les **commissions d'affiliation = BIC services hors LMP** (compta séparée, risque de requalification). Empiler nuitée + upsell + services peut **franchir le seuil de TVA outre-mer** → la « marge quasi nette » fond. **Plus de direct = plus de taxe de séjour à collecter/reverser** (Sainte-Luce ≠ Nogent). **À cadrer avec le comptable AVANT de lancer les services payants.**

3. **Droit du travail / responsabilité (chef, ménage, baby-sitting, spa).** Organiser + facturer un prestataire qu'on rémunère = risque de salariat déguisé + RC pro. **Privilégier l'apport d'affaires pur** (le client paie le prestataire) — ce qui réduit la commission mais sécurise. Sans ça, un incident (intoxication, blessure) se retourne contre le site qui a vendu.

4. **Dette de maintenance pour un solo.** Chaque cron/séquence/builder ajouté est une surface de panne silencieuse. `geko.json` cassé non détecté **en est la preuve.** Ne pas sur-câbler : instrumenter `service_orders` et surveiller les briques, sinon elles se dégradent sans qu'on le voie.

5. **Cannibalisation OTA — séquencer impérativement.** ~92 % du CA passe encore par l'OTA. Restreindre Amaryllis/Zandoli sur l'OTA en pic **dégrade le ranking OTA** et fait perdre l'aspirateur de demande résiduelle (RM-09). **Sécuriser le direct AVANT de restreindre l'OTA** — couper la branche avant que le direct tienne (filet d'eau à 25 sessions/j) = risque existentiel de revenu.

6. **Saisonnalité cyclonique & trésorerie.** Juin-octobre = creux, demande molle. Les séquences « off-saison last-minute » supposent une demande à capter qui est quasi inexistante en saison cyclonique. Dépenses (pub, build) continues vs revenus concentrés sur 5 mois → **gérer le décalage de trésorerie.** Le « +540 €/mois de pub » en juillet sur du trafic local = perte sèche.

7. **Capacité solo non modélisée.** Le cumul des 6 lentilles = ~6 partenariats, 2 GBP, lead magnet, builder CRM, 4 séquences, newsletter, ~20 actions CRO — **pour une personne qui fait aussi ménage, check-in, maintenance, SAV de 6 biens.** Le temps de Vincent est le vrai goulot. **D'où le séquencement : Semaine 1 = uniquement le gratuit/mesurable/sans fournisseur.**

---

## 🏆 Top 15 actions par priorité

| # | Action | Catégorie | Impact €/mois | Effort | Délai |
|---|---|---|---|---|---|
| 1 | Corriger `geko.json` (JSON cassé L85) | upsell-séjour | 100-200 | faible | cette semaine |
| 2 | Events GA4 `availability_ready`/`date_selected` | conversion | indirect (mesure) | faible | cette semaine |
| 3 | Pré-charger l'availability au mount (calendrier <1s) | conversion | 800-1500 | faible | cette semaine |
| 4 | Tagger UTM Reels/bio/rebook/emails | kpi-pilotage | indirect (mesure) | faible | cette semaine |
| 5 | Refondre bloc upsell `pre-arrivee.html` | upsell-séjour | 400-700 | faible | cette semaine |
| 6 | Code RETOUR-8 post-séjour J+1 + bloc parrainage | fidélisation | 300-500 | faible | cette semaine |
| 7 | Exclure Martinique du paid + négatifs Google *(Vincent)* | acquisition | indirect (CAC réel) | faible | cette semaine |
| 8 | Étendre catalogue extras[] (transfert/voiture/panier/late-garanti) | upsell-séjour | 600-1200 | moyen | 2-4 sem |
| 9 | Apple Pay / Google Pay (Payment Element) | conversion | 500-1000 | moyen | 2-4 sem |
| 10 | Lead magnet PDF + capture email exit-intent | acquisition | 400-700 | moyen | 2-4 sem |
| 11 | Segmenter funnel hors-MTQ (vrai taux acheteur) | kpi-pilotage | indirect (décision budget) | faible | dès 03/07 |
| 12 | Avis Google `place=residence` sur les 6 biens | conversion | 300-600 | faible | 2-4 sem |
| 13 | Cron pré-départ J-1 (late-checkout, marge ~45 €) | upsell-séjour | 200-400 | faible | cette semaine |
| 14 | Builder auto `crm_clients` (6 segments RFM) | fidélisation | indirect (ciblage) | moyen | 2-4 sem |
| 15 | Campagne diaspora Meta + CRM (T-3 avant Noël) *(Vincent)* | acquisition | 300-600 | moyen | 2-4 sem |

> **Règles absolues respectées partout :** aucune dépense pub déclenchée/modifiée sans Vincent · aucune fiche GBP validée à sa place · aucune publication réseaux sans accord explicite · RM advisory (recos chiffrées, Vincent applique prix/LOS) · Beds24 = Nogent uniquement · remises CRM jamais publiques (loi Macron) · RGPD double opt-in. Tout ce qui touche budget/GBP/publication/prix attend ton « ok ».