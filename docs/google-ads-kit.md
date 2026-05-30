# Kit Google Ads — Amaryllis Locations (prêt à activer)

> Budget : ~400€ (crédit à confirmer). Compte GA4 `G-N9BM709ZBL`. Conversion Ads = event client **`purchase`** (attribuable) — voir §6.
> **Ne rien lancer avant d'avoir coché la checklist §6 et vérifié le crédit (conditions + expiration).**
> Préparé d'après la reco des agents traffic-manager, commercial-publicité, revenue-manager, consultant e-business (29/05/2026).

---

## 0) Stratégie & timing (résumé décisionnel)

- **Concentrer, ne pas disperser** : avec 400€, le meilleur pari = **l'offre groupée** (panier 2 500–4 000€, faible concurrence pub, différenciateur « paiement unique »). 1 résa groupe rembourse 10× la mise.
- **Deux fenêtres de lancement** :
  - **Juin (maintenant)** : campagne **Offre groupée** seule (les groupes réservent 4–8 mois à l'avance) + **créer l'audience remarketing dès aujourd'hui** (elle met ~30 j à se remplir).
  - **Septembre** : push **haute saison déc-avril** (lead-time individuel 3–5 mois, pic de recherche sept-oct) → activer Brand + Remarketing, monter le groupe.
- **Ne pas payer** pour Villa Amaryllis / Iguana en haute saison (se remplissent seules). Privilégier groupe + entrée de gamme à aider.
- ⚠️ **Conversion = l'event `purchase` (client, attribuable), PAS `booking_completed` (serveur, client_id synthétique → non attribuable)**. Voir §6. Vérifier en DebugView que `purchase` remonte avec `value` (€) + `currency=EUR` dès la 1ʳᵉ vraie résa.

Répartition : C1 Groupe ~240€ · C2 Brand ~90€ · C3 Remarketing ~70€.

---

## 1) Structure des campagnes

3 campagnes séparées (Google ne mélange pas Search acquisition / Brand / Remarketing dans une seule) :

| Campagne | Réseau | Enchères (démarrage) | Budget/j | Budget |
|---|---|---|---|---|
| **C1 — Offre groupée Sainte-Luce** | Search seul (Display OFF, partenaires OFF) | CPC manuel → Max. valeur conv. à ≥15 conv. | 8€/j | ~240€ |
| **C2 — Brand défensif** | Search seul | CPC manuel, plafond bas | 3€/j | ~90€ |
| **C3 — Remarketing** | Display | CPC manuel / vCPM bas | 2,30€/j | ~70€ |

- **Géo** : France métropole. **Exclure les DOM** (Martinique/Guadeloupe/Guyane/Réunion/Mayotte). Paramètre **« Présence : personnes dans la zone ciblée »** (pas « présence ou intérêt »). Langue : Français.
- **Planning** : C1 dès juin (test, ~150€) ; C2 + C3 début septembre (~250€). Majorer +15% les soirs 19h-23h et week-ends.
- **CPC manuel d'abord** : l'algo « Max conversions » n'a pas assez de données sous 15-30 conv./mois. Basculer ensuite.

---

## 2) Mots-clés (exact `[]` / phrase `""`)

### C1 — Offre groupée → `/location-groupe-sainte-luce`
```
[location villa groupe martinique]
[villa 11 personnes martinique]
[location villa sainte-luce martinique]
"location villa groupe martinique"
"villa grande capacité martinique"
"location villa martinique 10 personnes"
"villa martinique piscine groupe"
"location maison vacances martinique groupe"
"villa sainte luce piscine"
"location villa famille martinique"
"grande villa martinique vacances"
"location villa martinique entre amis"
```

### C2 — Brand défensif → accueil / fiches
```
[villa amaryllis]
[villamaryllis]
[amaryllis locations]
"villa amaryllis martinique"
"villa amaryllis sainte luce"
"amaryllis location martinique"
```
CPC plafonné 0,30–0,60€ (brand peu disputé, ROI quasi garanti).

### C3 — Remarketing : pas de mots-clés (ciblage audience, §5).

---

## 3) Mots-clés négatifs (niveau compte)
```
-emploi -recrutement -job -salaire -stage -saisonnier
-achat -acheter -vente -"à vendre" -immobilier -investir -investissement
-"prix m2" -"agence immobilière" -notaire -syndic -bail -colocation -"longue durée"
-croisière -bateau -ferry -"location bateau"
-hotel -hôtel -resort -"club med" -"all inclusive" -"tout compris"
-camping -"mobil home" -gîte
-"pas cher" -gratuit -"petit budget"
-airbnb -booking -abritel
-déménagement -"location voiture" -"location utilitaire"
-guadeloupe -reunion -"saint martin" -"republique dominicaine"
-recette -météo -carte -plage
```
> Après 2 semaines, enrichir via le rapport **Termes de recherche** (c'est là que fuit le budget).

---

## 4) Annonces RSA (titres ≤30 car · descriptions ≤90 car)

### C1 — Offre groupée → `/location-groupe-sainte-luce`
**Titres**
1. Villas Groupe Sainte-Luce *(épingler pos. 1)*
2. Jusqu'à 11 Personnes Réunies
3. 3 Villas, Un Seul Paiement *(épingler pos. 2)*
4. Réservez en Direct, Sans Frais
5. Résidence Privée en Martinique
6. Piscines et Jacuzzi Privés
7. Zandoli, Géko et Mabouya
8. Idéal Familles et Amis
9. Une Adresse pour Tout le Groupe
10. Sans Commission Airbnb
11. Sainte-Luce, Sud Martinique
12. Réserver Votre Séjour Groupe
13. Découvrir la Résidence
14. Vue Mer, Terrasses au Soleil
15. Le Grand Format en Direct

**Descriptions**
1. Réunissez jusqu'à 11 proches dans une résidence privée à Sainte-Luce. Réservez en direct.
2. Trois villas, piscines et jacuzzi, un seul paiement. Sans frais Airbnb. Découvrez l'offre.
3. Le Sud de la Martinique pour votre tribu. Contact direct avec l'hôte, réponse sous 1h.
4. Terrasses au soleil, eau turquoise à 20 min. Réservez la résidence entière en ligne.

### C2 — Brand défensif → `/` (accueil)
**Titres**
1. Villa Amaryllis Officiel *(épingler pos. 1)*
2. Site Direct Amaryllis *(épingler pos. 2)*
3. Amaryllis Locations Direct
4. Réservez au Meilleur Prix
5. Sans Commission, Sans Frais
6. Contact Direct avec l'Hôte
7. La Martinique en Direct
8. Réservation Sans Intermédiaire
9. 7 Logements Premium, Sainte-Luce
10. Réponse de l'Hôte Sous 1h
11. Le Tarif Direct Propriétaire
12. Réserver sur le Site Officiel
13. Découvrir Villa Amaryllis
14. Piscine Privée, Vue Mer
15. Mieux qu'une Plateforme

**Descriptions**
1. Réservez Villa Amaryllis en direct, au meilleur prix. Sans commission de plateforme.
2. Le site officiel Amaryllis Locations. Contact direct hôte, réponse sous une heure.
3. Sept logements premium à Sainte-Luce, piscine et vue mer. Réservez sans intermédiaire.
4. Parlez directement à votre hôte. Tarif direct, flexibilité, paiement sécurisé.

### C3 — Remarketing (ton doux, pas d'urgence agressive)
**Titres**
1. Votre Villa Vous Attend *(épingler pos. 1)*
2. Finalisez Votre Réservation *(épingler pos. 2)*
3. Dispos Mises à Jour en Direct
4. Réservez Sans Frais Airbnb
5. Reprenez Là où Vous Étiez
6. Vos Dates Sont Encore Libres
7. Paiement en Ligne Sécurisé
8. Contact Direct avec l'Hôte
9. La Martinique Vous Attend
10. Réserver en Quelques Clics
11. Vue Mer et Piscine Privée
12. Au Meilleur Tarif Direct
13. Découvrir les Disponibilités
14. Sainte-Luce, Sud Martinique
15. Encore une Question ? Écrivez

**Descriptions**
1. Vos dates sont peut-être encore libres. Vérifiez les disponibilités en temps réel.
2. Finalisez votre séjour en direct, sans frais Airbnb. Paiement en ligne sécurisé.
3. Une question avant de réserver ? Votre hôte vous répond sous une heure.
4. Reprenez votre réservation là où vous l'aviez laissée. Vue mer, piscine privée.

> Épinglage : 2 titres max par position, sinon ça bride l'optimisation RSA.

---

## 5) Extensions (toutes campagnes)

**Callouts** (≤25 car) : `Sans frais Airbnb` · `Contact direct hôte` · `Réponse sous 1h` · `Piscine privée` · `Vue mer` · `Réservation en direct` · `Paiement sécurisé` · `Jusqu'à 11 personnes`

**Sitelinks** (URLs corrigées vers les vraies routes) :
| Titre | Desc 1 | Desc 2 | URL |
|---|---|---|---|
| Offre groupée | 3 villas, jusqu'à 11 pers. | Un seul paiement direct | `/location-groupe-sainte-luce` |
| Villa Amaryllis | 8 personnes, piscine privée | Séminaires et séjours | `/amaryllis` |
| Avis voyageurs | 97 avis vérifiés | Note moyenne 4,79 sur 5 | `/avis` |
| Réservation directe | Sans commission, meilleur prix | Disponibilités en temps réel | `/reservation-directe-martinique` |

**Structured snippet** — En-tête « Équipements » : `Piscine privée · Jacuzzi · Vue mer · Terrasse · Wifi · Climatisation · Parking · Cuisine équipée`

**Extension de prix** : ajouter le prix « à partir de » par logement (Amaryllis 280€ … Mabouya 110€).

---

## 6) Paramétrage conversion — ⚠️ utiliser `purchase`, PAS `booking_completed`

> **Correctif important (vérifié 30/05/2026, lecture du code `stripe-webhook.js`)** :
> - L'event **serveur `booking_completed`** (Measurement Protocol) utilise un **`client_id` synthétique** (bookingId/aléatoire) + `non_personalized_ads:true` → il **n'est PAS rattaché au clic pub (gclid)** → **inutilisable pour l'attribution par campagne**. À garder seulement comme enregistrement serveur de secours.
> - L'event **client `purchase`** (gtag, déclenché au succès du paiement dans le tunnel villa ET le modal groupe : `window.gtag('event','purchase',{value,currency,transaction_id})`) porte le **vrai client_id + gclid** → **c'est LUI la conversion attribuable**. → **Importer `purchase` dans Google Ads.**
> - Vérifier aussi le secret **`GA4_API_SECRET`** dans Cloudflare Pages (sinon l'event serveur est silencieusement ignoré — non bloquant pour Ads puisqu'on utilise `purchase`).
> - Au 30/05, ni `purchase` ni `booking_completed` ne sont encore dans GA4 (aucune vraie résa depuis le déploiement) → ils apparaîtront à la 1ʳᵉ vraie résa / 1ᵉʳ test Stripe.

**A. Lier GA4 ↔ Google Ads** : ✅ **FAIT le 30/05** (compte Ads 226-428-3778, publicité personnalisée ON, diffusion sous 24 h).

**B. Événement clé** : GA4 → Admin → Événements clés → marquer **`purchase`** (dès qu'il apparaît). Vérifier en **DebugView** qu'il arrive avec `value` (€) + `currency=EUR` + `transaction_id`.

**C. Importer dans Ads** : Objectifs → Conversions → Nouvelle action → Importer → GA4 Web → cocher **`purchase`**. Réglages :
- Catégorie : **Achat**
- Valeur : **« utiliser les différentes valeurs »** (= montant résa, pas de valeur fixe)
- Comptabilisation : **Une seule**
- Fenêtre de conversion : **30 jours**
- Inclure dans « Conversions » : Oui

**D. Objectif d'enchère** : par campagne → Paramètres → Objectifs de conversion → uniquement **`purchase`**. Basculer C1 en **« Maximiser la valeur de conversion »** à ≥15 conversions/30j.

---

## 7) Audience remarketing — ✅ CRÉÉE le 30/05/2026

**A.** Google signals : ✅ **déjà actif** (autorisé 307/307 régions).

**B. Audience** : ✅ **créée & publiée** — `RMKT_Vu_fiche_calendrier_sans_resa`
- Inclure : **Emplacement de la page** correspond à la **regex** `/(amaryllis|zandoli|iguana|geko|mabouya|schoelcher|nogent|location-groupe-sainte-luce)` — à tout moment
- Exclure : **Emplacement de la page contient `/merci`** → exclusion **définitive** (proxy fiable pour « a réservé », car `booking_completed`/`purchase` pas encore catalogués)
- Durée d'adhésion : **30 j**
- Démarre à 0, se remplit dès maintenant → prête pour septembre (>100 users/30j requis pour diffusion).
- 💡 Optionnel : créer une 2ᵉ audience 45 j dédiée `/location-groupe-sainte-luce`.

**C.** À FAIRE au lancement : l'audience apparaîtra dans Ads → Gestionnaire d'audiences (sous ~24-48h, lien GA4↔Ads actif). L'ajouter à C3 (Remarketing Display). Bannières responsives (piscine/vue mer + CTA « Réservez en direct »), plafond 3 impressions/j/utilisateur.

---

## 8) Checklist pré-lancement (10 points)
1. ☑ Lien GA4 ↔ Ads actif (fait 30/05) + Google signals ON (fait) + audience remarketing créée (fait)
2. ☐ `purchase` = Événement clé + `value`/`currency` vérifiés en DebugView (à la 1ʳᵉ vraie résa)
3. ☐ Conversion `purchase` importée (Achat, valeurs dynamiques, comptage « une seule », 30j)
4. ☐ Objectif de conversion = uniquement `purchase` par campagne
4b. ☐ Vérifier le secret `GA4_API_SECRET` dans Cloudflare (record serveur booking_completed)
5. ☐ Display + partenaires recherche **OFF** sur C1/C2
6. ☐ Géo France métro, **DOM exclus**, paramètre « Présence »
7. ☐ Négatifs appliqués au niveau compte
8. ☐ `/location-groupe-sainte-luce` mobile OK, CTA visible, LCP < 2,5s
9. ☐ Auto-tagging `gclid` activé (UTM manuels ne l'écrasent pas)
10. ☐ Budgets/dates programmés + ≥3 RSA par ad group + extensions

## 9) KPIs & seuils de décision
| KPI | Cible | Lecture |
|---|---|---|
| CPC moyen | C1 0,40-0,90€ · Brand <0,60€ | au-delà → annonces/score qualité |
| Taux conv. (clic→résa) | 1,5-3% | <1% sur >100 clics = landing/ciblage |
| CPA | ≤ 40-60€ | à comparer à la commission OTA évitée (15-20%) |
| ROAS | ≥ 8-10× | panier groupe élevé → doit être très >1 |

- **Couper un mot-clé** : >25-30 clics, 0 conversion.
- **Couper une campagne** : après 150€, si CPA > commission OTA évitée.
- **Scaler** : CPA ≤ cible ET ROAS ≥ 8× sur ≥5 conv. → +20% budget tous les 3-4 j (jamais doubler d'un coup).
- **Garde-fou crédit** : vérifier palier de dépense minimum + date d'expiration, caler le rythme pour ne pas le perdre.
