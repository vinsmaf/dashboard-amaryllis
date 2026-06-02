# Campagne Google Ads — Amaryllis Locations — Juin 2026 (PRÊTE À LANCER)

> **Version actualisée et complète. Remplace `docs/google-ads-kit.md`.**
> Préparée le **2026-06-01** par le traffic-manager (sur la base perfs réelles 2025, code tracking corrigé, landing pages live vérifiées).
> Vincent : tu **prépares dans Google Ads et tu lances toi-même**. Ce doc est copier-collable bloc par bloc.
> ⚠️ **NE RIEN LANCER avant d'avoir coché la CHECKLIST TRACKING §7 (bloquante)** ET vérifié le crédit (§0).
>
> Compte Ads **226-428-3778** · GA4 **G-N9BM709ZBL** (lié ✅) · Audience remarketing **RMKT_Vu_fiche_calendrier_sans_resa** (créée ✅) · Google Signals actif ✅.
> Tous les chiffres de coût/CTR/CPA ci-dessous sont des **ESTIMATIONS** (marché FR tourisme), à recalibrer sur tes vraies données après 2 semaines.

---

## 0) Stratégie & timing (résumé décisionnel)

### Le constat (données réelles 2025)
| Bien | Type | Occ. 2025 | ADR € | RevPAR € | Décision pub |
|---|---|---|---|---|---|
| **Villa Amaryllis** | villa premium piscine, Sainte-Luce, 8 pers | **33 %** | 312 | 104 | **CIBLE n°1** — nuits vides + haut panier |
| **Studio Mabouya** | jacuzzi, couples, Sainte-Luce, 2 pers | 28 % | 82 | 23 | CIBLE — angle couples |
| **Géko** | cocon court séjour, Sainte-Luce, 4 pers | 39 % | 139 | 55 | CIBLE |
| **T2 Schœlcher** (Bellevue) | appart vue mer | 37 % | 93 | 35 | CIBLE |
| Zandoli | logement, Sainte-Luce, 5 pers | 68 % | — | — | sain — ne pas surpayer |
| Nogent | appart 94 | 71 % | — | — | 🚫 **EXCLU** (résidence principale, plafond 120 nuits) |
| Iguana | villa, Sainte-Luce, 6 pers | 100 % | — | — | 🚫 **EXCLU** (bail long) |

### Les 3 décisions stratégiques
1. **L'OFFRE GROUPE est l'axe n°1.** Cluster Sainte-Luce (Amaryllis + Zandoli + Géko + Mabouya, mitoyens) = jusqu'à 11 pers, **panier 2 500–4 000 €**, concurrence pub **quasi nulle**, différenciateur unique (« un seul paiement, une seule adresse »). **1 résa groupe rembourse 6 à 10× tout le budget.** → C1 prioritaire dès juin.
2. **Juin = creux de réservation individuelle, mais c'est MAINTENANT qu'on prépare la haute saison.** Les groupes réservent **4–8 mois avant** (donc juin = bon timing pour vendre déc-avril). Le pic de recherche individuelle est **sept-oct** (lead-time 3–5 mois). → En juin : **Groupe + Brand + on remplit le remarketing.** En **septembre** : on pousse la haute saison (individuels) et on monte le budget.
3. **Ne pas gaspiller sur ce qui se remplit seul.** Zandoli (68 %), Iguana (100 %), Nogent : **zéro pub**. On met l'argent sur les **nuits vides à fort RevPAR potentiel** (Villa Amaryllis) et sur l'angle groupe.

### Contexte trafic (à avoir en tête)
Le site est en **famine de trafic** (~5 visiteurs/jour, ~5 sessions SEO/mois). Google Ads est donc **le levier le plus rapide** pour générer des résas directes ce trimestre. Mais : **volume de conversions faible au départ → enchères MANUELLES obligatoires** (l'algo « Maximiser les conversions » a besoin de ≥15 conv./mois pour apprendre, on n'y est pas encore).

### Vérifier le crédit AVANT tout (bloquant budget)
Le **crédit ~400 €** doit être confirmé dans Ads → Facturation → **Promotions**. Note :
- le **palier de dépense minimum** pour débloquer le crédit (souvent « dépensez X € → recevez 400 € »),
- la **date d'expiration** (souvent 60 jours).
→ Caler le rythme de dépense pour **ne pas perdre le crédit** (ni le sous-dépenser, ni le cramer trop vite). Si le crédit n'est pas confirmé : lancer **C1 seule à petit budget** et attendre.

### Répartition du budget (~400 €)
| Phase | Campagne | Montant | Quand |
|---|---|---|---|
| **Juin** | C1 Offre Groupe | **~150 €** (test) | dès tracking validé |
| **Juin** | C2 Brand défensif | **~30 €** | en même temps (quasi gratuit) |
| **Septembre** | C1 Groupe (scale) | **~120 €** | si CPA tient |
| **Septembre** | C3 Remarketing | **~70 €** | audience >100 users remplie |
| **Septembre** | C2 Brand (continu) | **~30 €** | — |
| *Réserve* | ajustements / scale gagnant | ~0–40 € | — |

---

## 1) Structure des campagnes

3 campagnes **séparées** (Google ne mélange jamais Search acquisition / Brand / Remarketing — réseaux et logiques d'enchères différents).

| # | Campagne | Réseau | Type d'enchères (démarrage) | Budget/jour | Budget total | Lancement |
|---|---|---|---|---|---|---|
| **C1** | **Offre Groupe Sainte-Luce** | Search seul (Display OFF, partenaires OFF) | **CPC manuel** → « Maximiser la valeur de conv. » à ≥15 conv. | **8 €/j** | ~150 € (juin) +120 € (sept) | **Juin** |
| **C2** | **Brand défensif** | Search seul | **CPC manuel**, plafond bas | **2 €/j** | ~60 € | **Juin** |
| **C3** | **Remarketing** | Display (réseau Display Google) | **CPC manuel / vCPM bas** | **2,30 €/j** | ~70 € | **Septembre** |

**Paramètres communs à toutes les campagnes Search (C1, C2) :**
- **Réseau** : Search **uniquement**. ❌ Décocher « Inclure le Réseau Display ». ❌ Décocher « Inclure les partenaires du Réseau de Recherche » (trafic de moindre qualité, draine le budget).
- **Géo** : **France métropolitaine**. **EXCLURE les DOM** : Martinique, Guadeloupe, Guyane, La Réunion, Mayotte, Saint-Martin, Saint-Barthélemy. Raison : ce sont des résidents (présence physique), pas des touristes en intention de voyage.
  - ⚙️ **Réglage critique** : Paramètres de localisation → choisir **« Présence : personnes se trouvant dans vos zones ciblées »** (PAS « Présence ou intérêt » — sinon des Martiniquais qui « s'intéressent » à la Martinique reçoivent les annonces).
- **Langue** : **Français**.
- **Planning de diffusion** : 24h/24 au départ ; après data, majorer **+15 %** les **soirs 19h–23h** et **week-ends** (pic de recherche voyage loisirs). Voir §6.
- **Rotation des annonces** : « Optimiser : privilégier les annonces les plus performantes ».
- **Appareils** : tous au départ ; surveiller le mobile (souvent +volume / −conv. sur du panier élevé).

---

## 2) Mots-clés par ad group

> Syntaxe : `[exact]` = correspondance exacte · `"phrase"` = expression. **On évite le large** (broad) au départ : il crame le budget sur des requêtes hors sujet tant qu'on n'a pas d'historique de conversion.

### C1 — Offre Groupe Sainte-Luce → `/location-groupe-sainte-luce`

**Ad group 1A — Villa groupe / grande capacité**
```
[location villa groupe martinique]
[location villa martinique 10 personnes]
[villa 11 personnes martinique]
[grande villa martinique]
"location villa groupe martinique"
"villa grande capacité martinique"
"location villa martinique 10 personnes"
"location villa martinique 12 personnes"
"location maison vacances martinique groupe"
"grande villa martinique vacances"
```

**Ad group 1B — Villa entre amis / famille**
```
[location villa martinique entre amis]
[location villa famille martinique]
"location villa martinique entre amis"
"location villa famille martinique"
"villa martinique piscine groupe"
"location villa sainte-luce martinique"
"villa sainte luce piscine"
"location maison martinique entre amis"
```

### C2 — Brand défensif → `/` (accueil)
```
[villa amaryllis]
[villamaryllis]
[amaryllis locations]
[villa amaryllis martinique]
"villa amaryllis martinique"
"villa amaryllis sainte luce"
"amaryllis location martinique"
"villa amaryllis avis"
```
→ CPC plafonné **0,30–0,60 €** (marque peu disputée, ROI quasi garanti, empêche un concurrent/OTA d'enchérir sur ton nom).

### C3 — Remarketing → pas de mots-clés (ciblage par **audience**, voir §6).

> **Réserve pour septembre (à activer en push haute saison)** — nouveaux ad groups Search acquisition individuels :
> - *Villa piscine* → `/location-villa-martinique-piscine` : `[location villa martinique piscine]`, `"location villa martinique piscine privée"`, `"villa martinique vue mer débordement"`.
> - *Sainte-Luce* → `/sainte-luce-martinique` : `[location villa sainte-luce martinique]`, `"location vacances sainte luce martinique"`.
> - *Couples / Mabouya* → `/mabouya` : `"location studio jacuzzi martinique"`, `"week-end romantique martinique"`.
> - *Vue mer Schœlcher* → `/location-appartement-vue-mer-schoelcher` : `"location appartement vue mer martinique"`, `"location schoelcher martinique"`.
> - *Direct propriétaire* → `/reservation-directe-martinique` : `"location vacances martinique direct propriétaire"`.

---

## 3) Mots-clés négatifs — **à appliquer au niveau COMPTE** (Outils → Mots-clés négatifs → liste partagée « Négatifs globaux Amaryllis »)

```
-emploi -recrutement -recrute -job -salaire -stage -saisonnier -"offre d'emploi" -cdd -cdi
-achat -acheter -vente -vendre -"à vendre" -immobilier -investir -investissement -rentabilité
-"prix m2" -"agence immobilière" -notaire -syndic -bail -colocation -"longue durée" -"au mois"
-croisière -bateau -ferry -"location bateau" -voilier -catamaran
-hotel -hôtel -resort -"club med" -"all inclusive" -"tout compris" -"village vacances"
-camping -"mobil home" -gite -gîte -auberge -"chambre d'hôte"
-"pas cher" -gratuit -"petit budget" -"moins cher" -promo -"code promo"
-airbnb -booking -abritel -leboncoin -"le bon coin"
-déménagement -"location voiture" -"location utilitaire" -"location matériel"
-guadeloupe -reunion -réunion -"saint martin" -"république dominicaine" -guyane -mayotte
-recette -météo -meteo -carte -plage -photos -wikipedia -"que faire" -guide
-vol -billet -avion -"vol pas cher"
```
> ⚠️ Surveiller `-"que faire"` et `-guide` sur C1/C2 (utile contre les requêtes purement infos), mais **ne pas les mettre** sur les futurs ad groups guides si tu décides un jour de capter ce trafic.
> **Action récurrente (toutes les semaines au début)** : ouvrir le rapport **Termes de recherche** (Insights & rapports → Termes de recherche) et ajouter en négatif tout ce qui est hors intention. **C'est là que fuit 80 % du budget gaspillé.**

---

## 4) Annonces RSA finalisées (copier-collables)

> Règles : **Titres ≤ 30 caractères · Descriptions ≤ 90 caractères.** Fournir **15 titres + 4 descriptions** par ad group. Épingler **2 titres max par position** (au-delà, ça bride l'optimisation RSA).
> ✅ Conforme nomenclature : seules **Amaryllis** et **Iguana** sont des « villas » ; Zandoli=logement, Géko=cocon, Mabouya=studio. (Pour l'offre groupe on parle de « villas » au pluriel = OK car Amaryllis en fait partie ; éviter « la villa Zandoli ».)

### C1 — Offre Groupe → `/location-groupe-sainte-luce`

**15 Titres** (≤30 car.)
```
1.  Villas Groupe Sainte-Luce        (← épingler position 1)
2.  Jusqu'à 11 Personnes Réunies
3.  3 Villas, Un Seul Paiement        (← épingler position 2)
4.  Réservez en Direct, Sans Frais
5.  Une Résidence Privée Entière
6.  Piscines et Jacuzzi Privés
7.  Idéal Familles et Amis
8.  Une Adresse pour Tout le Groupe
9.  Sans Commission Airbnb
10. Sainte-Luce, Sud Martinique
11. Réserver Votre Séjour Groupe
12. Vue Mer, Terrasses au Soleil
13. Le Grand Format en Direct
14. Paiement Sécurisé Stripe
15. Contact Direct avec l'Hôte
```

**4 Descriptions** (≤90 car.)
```
1. Réunissez jusqu'à 11 proches dans une résidence privée à Sainte-Luce. Réservez en direct.
2. Trois villas, piscines et jacuzzi, un seul paiement. Sans frais Airbnb. Découvrez l'offre.
3. Le Sud de la Martinique pour votre tribu. Contact direct avec l'hôte, réponse sous 1h.
4. Terrasses au soleil, eau turquoise à 20 min. Réservez la résidence entière en ligne.
```

### C2 — Brand défensif → `/` (accueil)

**15 Titres** (≤30 car.)
```
1.  Villa Amaryllis Officiel          (← épingler position 1)
2.  Site Direct Amaryllis             (← épingler position 2)
3.  Amaryllis Locations Direct
4.  Réservez au Meilleur Prix
5.  Sans Commission, Sans Frais
6.  Contact Direct avec l'Hôte
7.  La Martinique en Direct
8.  Réservation Sans Intermédiaire
9.  Logements Premium Sainte-Luce
10. Réponse de l'Hôte Sous 1h
11. Le Tarif Direct Propriétaire
12. Réserver sur le Site Officiel
13. Découvrir Villa Amaryllis
14. Piscine Privée, Vue Mer
15. Noté 5 sur 5 par les Voyageurs
```

**4 Descriptions** (≤90 car.)
```
1. Réservez Villa Amaryllis en direct, au meilleur prix. Sans commission de plateforme.
2. Le site officiel Amaryllis Locations. Contact direct hôte, réponse sous une heure.
3. Logements premium à Sainte-Luce, piscine et vue mer. Réservez sans intermédiaire.
4. Parlez directement à votre hôte. Tarif direct, flexibilité, paiement sécurisé.
```

### C3 — Remarketing (Display, ton doux, pas d'urgence agressive) → fiche vue ou `/reservation-directe-martinique`

**15 Titres** (≤30 car.)
```
1.  Votre Séjour Vous Attend          (← épingler position 1)
2.  Finalisez Votre Réservation       (← épingler position 2)
3.  Dispos Mises à Jour en Direct
4.  Réservez Sans Frais Airbnb
5.  Reprenez Là où Vous Étiez
6.  Vos Dates Sont Encore Libres
7.  Paiement en Ligne Sécurisé
8.  Contact Direct avec l'Hôte
9.  La Martinique Vous Attend
10. Réserver en Quelques Clics
11. Vue Mer et Piscine Privée
12. Au Meilleur Tarif Direct
13. Découvrir les Disponibilités
14. Sainte-Luce, Sud Martinique
15. Une Question ? Écrivez-nous
```

**4 Descriptions** (≤90 car.)
```
1. Vos dates sont peut-être encore libres. Vérifiez les disponibilités en temps réel.
2. Finalisez votre séjour en direct, sans frais Airbnb. Paiement en ligne sécurisé.
3. Une question avant de réserver ? Votre hôte vous répond sous une heure.
4. Reprenez votre réservation là où vous l'aviez laissée. Vue mer, piscine privée.
```

### Extensions (= Composants — à ajouter au niveau COMPTE, héritées par toutes les campagnes)

**Accroches / Callouts** (≤25 car.) :
```
Sans frais Airbnb
Contact direct hôte
Réponse sous 1h
Piscine privée
Vue mer
Réservation en direct
Paiement sécurisé Stripe
Jusqu'à 11 personnes
Livret digital inclus
Noté 5/5 par les voyageurs
```

**Liens annexes / Sitelinks** (vérifiés sur routes live) :
| Titre du lien (≤25c) | Description 1 (≤35c) | Description 2 (≤35c) | URL |
|---|---|---|---|
| Offre groupe Sainte-Luce | 3 villas, jusqu'à 11 pers. | Un seul paiement direct | `/location-groupe-sainte-luce` |
| Villa Amaryllis | 8 personnes, piscine privée | Idéale familles et séminaires | `/amaryllis` |
| Studio Mabouya | Jacuzzi privé, pour 2 | Escapade en couple | `/mabouya` |
| Réservation directe | Sans commission, meilleur prix | Disponibilités en temps réel | `/reservation-directe-martinique` |

**Extraits structurés / Structured snippets** — En-tête **« Équipements »** :
```
Piscine privée · Jacuzzi · Vue mer · Terrasse · Wifi · Climatisation · Parking · Cuisine équipée
```

**Extension de prix** (En-tête « Hébergements », à partir de — devise EUR) :
```
Villa Amaryllis  — à partir de 280 €/nuit  → /amaryllis
Logement Zandoli — à partir de 220 €/nuit  → (fiche zandoli)
Cocon Géko       — à partir de 150 €/nuit  → /geko
Studio Mabouya   — à partir de 110 €/nuit  → /mabouya
Appart Schœlcher — à partir de 100 €/nuit  → /location-appartement-vue-mer-schoelcher
```

**Extension de lieu** : ⚠️ **NE PAS** lier le compte Google Business Profile si l'adresse exacte du bien n'est pas censée être publique (les biens Sainte-Luce sont en résidence privée). Si tu actives l'extension de lieu, vérifie qu'elle pointe sur la fiche GBP « Résidence Amaryllis » (zone, pas adresse porte). Par défaut : **laisser OFF** sur Search acquisition.

---

## 5) Mapping mots-clés → landing page exacte

| Ad group / intention | Mots-clés | Landing page (URL exacte, live ✅) |
|---|---|---|
| C1 — Groupe / grande capacité | `villa groupe`, `10/11/12 personnes`, `entre amis`, `famille` | `/location-groupe-sainte-luce` |
| C2 — Brand | `villa amaryllis`, `villamaryllis`, `amaryllis locations` | `/` (accueil) |
| C3 — Remarketing | (audience) | fiche déjà vue, sinon `/reservation-directe-martinique` |
| *Sept* — Villa piscine | `villa martinique piscine`, `vue mer débordement` | `/location-villa-martinique-piscine` |
| *Sept* — Sainte-Luce | `location vacances sainte-luce`, `villa sainte-luce` | `/sainte-luce-martinique` |
| *Sept* — Couples | `studio jacuzzi martinique`, `week-end romantique` | `/mabouya` |
| *Sept* — Vue mer Schœlcher | `appartement vue mer martinique`, `location schoelcher` | `/location-appartement-vue-mer-schoelcher` |
| *Sept* — Direct propriétaire | `location martinique direct propriétaire` | `/reservation-directe-martinique` |

> **Règle d'or** : 1 ad group = 1 intention = 1 landing page. Ne jamais envoyer une requête « groupe » vers la fiche d'un seul bien. **Vérifier chaque URL en navigation privée** avant lancement (mobile + desktop, CTA réservation visible, LCP < 2,5 s).

---

## 6) Plan de lancement ÉTAPE PAR ÉTAPE

> Légende : ⚙️ = réglage exact dans l'interface Google Ads. Fais-le dans l'ordre.

### Étape 0 — Pré-requis (bloquant)
- ☐ **Crédit ~400 € confirmé** (Facturation → Promotions : palier + expiration notés).
- ☐ **CHECKLIST TRACKING §7 entièrement cochée** ← **bloquant, ne pas sauter**.
- ☐ Liste de mots-clés négatifs §3 créée en **liste partagée** appliquée au compte.

### Étape 1 — Créer C1 « Offre Groupe Sainte-Luce »
1. **Nouvelle campagne** → Objectif **« Ventes »** (ou « Créer sans objectif »).
2. Type **« Search / Réseau de Recherche »**.
3. ⚙️ Réseaux : **décocher** « Réseau Display » ET « Partenaires du Réseau de Recherche ».
4. ⚙️ **Zones géo** : ajouter **France** → puis **Paramètres avancés de localisation** → exclure **Martinique, Guadeloupe, Guyane, La Réunion, Mayotte, Saint-Martin, Saint-Barthélemy** → cocher **« Présence : personnes se trouvant dans vos zones ciblées »**.
5. ⚙️ **Langue** : Français.
6. ⚙️ **Budget** : **8 €/jour**.
7. ⚙️ **Enchères** : choisir **« Sélectionner directement une stratégie d'enchères » → CPC manuel** (décocher « Optimiser le CPC » au démarrage, ou laisser eCPC léger). CPC max de départ : **0,80 €** sur 1A, **0,70 €** sur 1B.
8. ⚙️ **Objectifs de conversion (campagne)** : retirer tout sauf **`purchase`** (importé en §7). *(Si `purchase` n'apparaît pas encore : laisser le compte par défaut MAIS noter que l'optimisation sera aveugle tant qu'aucune conversion n'est remontée — d'où enchères manuelles.)*
9. Créer **2 ad groups** (1A, 1B) avec les mots-clés §2.
10. Coller **les 15 titres + 4 descriptions** de C1 (§4), épingler T1→pos1 et T3→pos2.
11. URL finale : `https://villamaryllis.com/location-groupe-sainte-luce` (sur les deux ad groups).
12. ⚙️ **Auto-tagging** : Paramètres compte → cocher **« Marquer automatiquement l'URL (gclid) »**. Ne PAS ajouter d'UTM manuels qui écraseraient le gclid.

### Étape 2 — Créer C2 « Brand défensif »
1. Nouvelle campagne Search, mêmes réglages géo/langue/réseau qu'en Étape 1.
2. ⚙️ Budget **2 €/jour**, **CPC manuel plafonné 0,30–0,60 €**.
3. 1 ad group « Brand », mots-clés §2, RSA Brand §4, URL `https://villamaryllis.com/`.

### Étape 3 — (Septembre) Créer C3 « Remarketing »
1. Vérifier que l'audience **RMKT_Vu_fiche_calendrier_sans_resa** est passée >100 utilisateurs/30j (Gestionnaire d'audiences).
2. Nouvelle campagne **Display** → objectif Ventes.
3. ⚙️ Géo/langue identiques (France, DOM exclus).
4. ⚙️ Budget **2,30 €/jour**, enchères **CPC manuel** (ou vCPM bas).
5. ⚙️ **Audience** : cibler **RMKT_Vu_fiche_calendrier_sans_resa** (et exclure les convertisseurs via `/merci` — déjà géré dans la définition de l'audience).
6. ⚙️ **Plafond de fréquence** : **3 impressions/jour/utilisateur**.
7. ⚙️ **Exclusions de contenu Display** : exclure contenus sensibles, applications/jeux mobiles (souvent clics accidentels), « emplacements non couverts par une marque ».
8. Annonces responsives Display : images **piscine / vue mer** + logo + titres/desc C3 §4, CTA « Réservez en direct ».

### Étape 4 — Planning horaire (après ~1 semaine de data)
⚙️ Calendrier de diffusion → ajuster les enchères : **+15 %** les **vendredi–dimanche** et **tous les jours 19h–23h** (pic recherche voyage). Ne pas restreindre les horaires au début (on a besoin de volume pour voir où sont les conversions).

### Étape 5 — Lancer
- Activer **C1 + C2** (juin). Laisser tourner **sans toucher pendant 4–5 jours** (le temps d'accumuler des données ; modifier trop tôt = on réinitialise l'apprentissage).
- C3 reste en brouillon jusqu'à septembre.

---

## 7) ✅ CHECKLIST TRACKING PRÉ-LANCEMENT (BLOQUANTE — ne rien lancer tant que ce n'est pas vert)

> ⚠️ **LE POINT LE PLUS IMPORTANT DU DOC.** Une campagne sans conversion attribuable = de l'argent jeté sans pouvoir piloter.

### Rappel technique (vérifié dans le code)
- ❌ **`booking_completed`** = event **serveur** (Measurement Protocol, `stripe-webhook.js`). Il utilise un **`client_id` synthétique** + `non_personalized_ads:true` → **non rattaché au clic pub (pas de gclid)** → **INUTILISABLE pour l'attribution Ads**. À garder seulement comme journal serveur de secours.
- ✅ **`purchase`** = event **client** (gtag, déclenché au succès du paiement dans le tunnel villa **et** le modal groupe : `window.gtag('event','purchase',{value,currency,transaction_id})`). Il porte le **vrai client_id + gclid** → **C'EST LUI la conversion à importer dans Ads.**

### Checklist (cocher dans l'ordre)
1. ☐ **Lien GA4 ↔ Google Ads actif** — Ads → Outils → Comptes associés → GA4 lié (✅ fait 30/05, compte 226-428-3778). Publicité personnalisée ON.
2. ☐ **Faire un VRAI test de bout en bout** : une réservation test (mode test Stripe ou petite vraie résa) sur `/location-groupe-sainte-luce` ET sur une fiche villa, en cliquant depuis une annonce ou avec un `?gclid=test` simulé.
3. ☐ **GA4 DebugView** (Admin → DebugView, avec l'extension GA Debugger ou `?_dbg=1`) : vérifier que l'event **`purchase`** arrive **AVEC** :
   - `value` = montant de la résa en **€** (pas vide, pas 0),
   - `currency` = **`EUR`**,
   - `transaction_id` présent (déduplication),
   - et idéalement `gclid`/session attribuée à google/cpc.
4. ☐ **Marquer `purchase` comme Événement clé** : GA4 → Admin → Événements clés → activer **`purchase`**.
5. ☐ **Importer la conversion dans Ads** : Ads → Objectifs → Conversions → **Nouvelle action** → **Importer** → **GA4 (Web)** → cocher **`purchase`**. Réglages :
   - Catégorie : **Achat**
   - Valeur : **« Utiliser des valeurs différentes pour chaque conversion »** (= montant réel de la résa)
   - Comptabilisation : **Une seule** (une résa = une conversion, pas par produit)
   - Fenêtre de conversion : **30 jours** (clic) — *envisager 60–90 j car lead-time long, mais 30 j suffit pour démarrer*
   - Inclure dans « Conversions » : **Oui**
6. ☐ **Objectif d'enchère par campagne = uniquement `purchase`** : C1 et C2 → Paramètres → Objectifs de conversion → décocher tout sauf `purchase`. (Évite que l'algo optimise sur un event parasite.)
7. ☐ **Vérifier le secret `GA4_API_SECRET`** dans Cloudflare Pages (sinon l'event serveur `booking_completed` est silencieusement ignoré — **non bloquant** pour Ads car on utilise `purchase`, mais utile pour le journal serveur).
8. ☐ **Auto-tagging gclid activé** + s'assurer qu'aucun UTM manuel n'écrase le gclid sur les URLs finales.
9. ☐ **Cohérence valeur** : 24–48 h après une vraie résa, vérifier dans Ads → Conversions que la **valeur en € remonte** (pas « 0,00 € » ni « valeur par défaut »).

> ⚠️ Au 01/06, ni `purchase` ni `booking_completed` ne sont encore catalogués dans GA4 (aucune vraie résa depuis le déploiement du funnel corrigé). **Ils apparaîtront à la 1ʳᵉ résa / 1ᵉʳ test Stripe.** → **Faire le test de l'étape 2 AVANT de lancer**, sinon on lance à l'aveugle.

---

## 8) Pilotage : quoi regarder, seuils de bascule, couper / scaler

### Cadence de revue
| Quand | Quoi regarder | Action |
|---|---|---|
| **Chaque jour S1** | Que ça dépense (budget consommé), 0 erreur d'annonce/refus, clics arrivent | Corriger refus / URL cassée. **Ne PAS toucher les enchères avant J5.** |
| **Fin S1 (J7)** | **Rapport Termes de recherche** | Ajouter en négatif tout le hors-sujet. **Priorité n°1** (c'est là que fuit le budget). |
| **S2** | CPC moyen, CTR, taux de conv. clic→résa, 1ères conversions | Affiner CPC max, mettre en pause les mots-clés sans clic/cher. |
| **S4** | CPA réel, ROAS, quels ad groups/mots-clés convertissent | Couper les perdants, réallouer vers les gagnants, décider scale. |

### KPIs cibles (ESTIMATIONS marché FR tourisme — recalibrer sur tes données)
| KPI | Cible estimée | Lecture |
|---|---|---|
| **CPC moyen** | C1 ~0,40–0,90 € · Brand <0,60 € | au-delà → améliorer annonces / Quality Score |
| **CTR** | Search >4 % (Brand >10 %) · Display >0,4 % | CTR bas = annonce ou ciblage à revoir |
| **Taux conv. (clic→résa)** | ~1,5–3 % | <1 % sur >100 clics = problème landing/ciblage |
| **CPA** | **≤ 40–60 €** (groupe : peut monter à 150 € et rester ultra-rentable vu le panier) | comparer à la **commission OTA évitée** (15–20 % du panier) |
| **ROAS** | **≥ 8–10×** | panier groupe 2 500–4 000 € → 1 résa = ROAS énorme |

### Règles de décision (chiffrées)
- **Couper un mot-clé** : **>25–30 clics et 0 conversion** → pause.
- **Couper une campagne** : après **~150 € dépensés**, si **CPA > commission OTA évitée** (≈ 15–20 % du panier) → stop, retour analyse.
- **Baisser une enchère** : CPC moyen > cible **et** taux de conv. faible → −15 % et observer 3 jours.
- **Monter une enchère** : mot-clé qui convertit mais **taux d'impressions perdues (rang) élevé** (>30 %) → +15 %.
- **Scaler** : CPA ≤ cible **ET** ROAS ≥ 8× sur **≥ 5 conversions** → **+20 % de budget tous les 3–4 jours** (jamais doubler d'un coup, ça casse l'apprentissage).
- **Basculer en « Maximiser la valeur de conversion »** : uniquement quand C1 atteint **≥15 conversions/30 j**. Avant : rester en CPC manuel.
- **Garde-fou crédit** : surveiller le rythme pour **dépenser le palier minimum avant l'expiration** sans cramer plus vite que les résas n'entrent.

### Premier KPI de succès du trimestre
**1 seule résa groupe** (panier 2 500–4 000 €) sur le crédit ~400 € = objectif atteint et ROAS >6×. Tout le reste (Brand, individuels) est du bonus. **Concentrer, ne pas disperser.**

---

## Annexe — Différences vs `docs/google-ads-kit.md` (ce qui a changé)
- Intégration des **perfs réelles 2025** (occ/ADR/RevPAR) → priorisation des biens à cibler ; **Nogent et Iguana explicitement exclus**.
- C1 passe à **2 ad groups** (capacité vs amis/famille) pour des annonces plus serrées.
- **Mapping landing pages élargi et vérifié live** (8 routes confirmées dans le code).
- **Checklist tracking renforcée et rendue bloquante** avec test bout-en-bout obligatoire AVANT lancement.
- **Plan de lancement étape par étape** avec réglages d'interface exacts (présence vs intérêt, réseau Display/partenaires OFF, plafond fréquence, exclusions Display).
- Sitelinks Mabouya ajouté (angle couples), accroches enrichies (livret digital, noté 5/5).
- Seuils de pilotage S1/S2/S4 explicités + règle de bascule enchères chiffrée.
