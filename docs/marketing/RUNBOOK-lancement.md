# 🚀 RUNBOOK — Lancer Google Ads + Meta Ads (ce soir)

> **But :** une seule feuille, ordonnée, copier-collable, pour créer et lancer les 2 campagnes sans rouvrir les kits de 30 pages.
> Détails complets si besoin : `campagne-google-ads-2026-06.md` · `campagne-meta-ads-2026-06.md`.
> ⚠️ **Je (Claude) ne me connecte pas à tes comptes.** Tout ci-dessous = TES clics. Le tracking site (GA4 + Pixel Meta) est déjà posé et vérifié.

---

## 0) État & prérequis (lire 1 min)

| Élément | État |
|---|---|
| Event GA4 **`purchase`** (valeur €, attribuable) | ✅ posé & vérifié |
| **Pixel Meta** `714189639771397` (consent-gated) | ✅ posé, init OK (config 200) |
| CSP (bloquait Pixel + GA4 régional) | ✅ corrigé |
| Campagnes créées DANS Google/Meta | ❌ **à faire (toi)** ← ce runbook |

**Stratégie en 1 phrase :** concentrer ~400 € Google sur l'**offre Groupe** (1 résa = 6-10× le budget) + Brand ; Meta à petit budget (5-10 €/j) en **découverte** pour charger le retargeting (qui convertira en septembre). **On ne juge rien sur l'occupation de juin.**
**Exclus de toute pub :** Iguana (bail long), Nogent (plafond 120 nuits), Zandoli (déjà 68 %).

---

## A) GOOGLE ADS — compte 226-428-3778 (~20 min)

**A1. Crédit** → Facturation → *Promotions* : note le **palier de déblocage** (« dépensez X € ») + la **date d'expiration**. Cale le rythme pour ne pas le perdre.

**A2. Importer la conversion (BLOQUANT)** → Objectifs → Conversions → **+ Nouvelle** → *Importer* → **Google Analytics 4 (Web)** → coche **`purchase`** (⚠️ PAS `booking_completed`) → Importer → ouvre-la → **Objectif = Principal**, valeur = *Utiliser les valeurs de l'event*.

**A3. Réglages communs C1 + C2 :** Recherche **uniquement** (❌ décoche *Réseau Display* + *Partenaires Recherche*) · Géo **France métropolitaine**, **exclure DOM** (Martinique, Guadeloupe, Guyane, Réunion, Mayotte, St-Martin, St-Barth) · **« Présence : personnes dans vos zones »** (pas « présence ou intérêt ») · Langue **Français** · Enchères **CPC manuel**.

**A4. Négatifs au niveau COMPTE** → Outils → Mots-clés négatifs → liste « Négatifs globaux Amaryllis » → colle :
```
-emploi -recrutement -job -salaire -stage -saisonnier -cdd -cdi
-achat -acheter -vente -vendre -immobilier -investir -rentabilité -notaire -syndic -bail -colocation -"longue durée" -"au mois"
-croisière -bateau -ferry -voilier -catamaran
-hotel -hôtel -resort -"club med" -"all inclusive" -"tout compris" -"village vacances"
-camping -"mobil home" -gite -gîte -auberge -"chambre d'hôte"
-"pas cher" -gratuit -promo -"code promo"
-airbnb -booking -abritel -leboncoin -"le bon coin"
-"location voiture" -"location utilitaire"
-guadeloupe -reunion -réunion -"saint martin" -guyane -mayotte
-recette -météo -meteo -wikipedia
-vol -billet -avion
```

**A5. CAMPAGNE C1 « Offre Groupe »** — Budget **8 €/j** · landing **`/location-groupe-sainte-luce`**
- **Ad group 1A — grande capacité** (mots-clés) :
```
[location villa groupe martinique]
[location villa martinique 10 personnes]
[villa 11 personnes martinique]
[grande villa martinique]
"location villa groupe martinique"
"villa grande capacité martinique"
"location villa martinique 12 personnes"
"location maison vacances martinique groupe"
```
- **Ad group 1B — entre amis / famille** :
```
[location villa martinique entre amis]
[location villa famille martinique]
"villa martinique piscine groupe"
"location villa sainte-luce martinique"
"villa sainte luce piscine"
```
- **Annonce RSA C1** — 15 titres (≤30c) / 4 desc (≤90c) :
```
TITRES : Villas Groupe Sainte-Luce | Jusqu'à 11 Personnes Réunies | 3 Villas, Un Seul Paiement |
Réservez en Direct, Sans Frais | Une Résidence Privée Entière | Piscines et Jacuzzi Privés |
Idéal Familles et Amis | Une Adresse pour Tout le Groupe | Sans Commission Airbnb |
Sainte-Luce, Sud Martinique | Réserver Votre Séjour Groupe | Vue Mer, Terrasses au Soleil |
Le Grand Format en Direct | Paiement Sécurisé Stripe | Contact Direct avec l'Hôte
  (épingler pos.1 : « Villas Groupe Sainte-Luce » · pos.2 : « 3 Villas, Un Seul Paiement »)
DESC :
- Réunissez jusqu'à 11 proches dans une résidence privée à Sainte-Luce. Réservez en direct.
- Trois villas, piscines et jacuzzi, un seul paiement. Sans frais Airbnb. Découvrez l'offre.
- Le Sud de la Martinique pour votre tribu. Contact direct avec l'hôte, réponse sous 1h.
- Terrasses au soleil, eau turquoise à 20 min. Réservez la résidence entière en ligne.
```

**A6. CAMPAGNE C2 « Brand »** — Budget **2 €/j**, CPC plafond **0,30-0,60 €** · landing **`/`**
```
[villa amaryllis]  [villamaryllis]  [amaryllis locations]  [villa amaryllis martinique]
"villa amaryllis martinique"  "villa amaryllis sainte luce"  "villa amaryllis avis"
```
- **Annonce RSA C2** :
```
TITRES : Villa Amaryllis Officiel | Site Direct Amaryllis | Réservez au Meilleur Prix |
Sans Commission, Sans Frais | Contact Direct avec l'Hôte | Réservation Sans Intermédiaire |
Réponse de l'Hôte Sous 1h | Site Officiel Amaryllis | Piscine Privée, Vue Mer | Noté 5/5 par les Voyageurs
DESC :
- Réservez Villa Amaryllis en direct, au meilleur prix. Sans commission de plateforme.
- Le site officiel Amaryllis Locations. Contact direct hôte, réponse sous une heure.
- Logements premium à Sainte-Luce, piscine et vue mer. Réservez sans intermédiaire.
```

**A7. → LANCER C1 + C2.** (C3 Remarketing = septembre, audience pas encore mûre.)

---

## B) META ADS — Facebook + Instagram (~20 min)

**B1. Pixel** → Events Manager → vérifie que `714189639771397` est **Actif** (Pixel Helper sur villamaryllis.com après acceptation cookies → PageView ; ouvre une fiche → ViewContent).

**B2. Compte pub** → Business Manager → crée/confirme un **compte publicitaire** + moyen de paiement.

**B3. CAMPAGNE 1 — Découverte** · Objectif **Trafic** (PAS « Ventes » au début : volume trop faible → resterait en apprentissage). Budget au niveau **ad set (ABO)**. Placements **Advantage+ (auto, FB+IG)**.

**B4. Ad set A1 — Amaryllis premium** — 5 €/j · landing `/amaryllis` · Audience : **France métropole**, 30-60 ans, intérêts *Martinique / Caraïbes / voyage de luxe / location de vacances / villa avec piscine*.
```
Texte principal :
La piscine à débordement. L'horizon caraïbe. Rien entre les deux.
La Villa Amaryllis vous ouvre les hauteurs de Sainte-Luce : 3 chambres, vue mer 180°, terrasse face au soleil.
Réservation en direct — sans frais Airbnb, contact direct avec l'hôte. 4,79★ (97 avis).
Titre : Villa Amaryllis — Sainte-Luce, Martinique
Description : Réservez en direct, ~15 % moins cher qu'Airbnb.
CTA : En savoir plus
```

**B5. Ad set A2 — Mabouya couple / jacuzzi** — 5 €/j · landing `/mabouya` · Audience : **France métropole**, 25-55 ans, intérêts *lune de miel / week-end romantique / Martinique / spa & bien-être*.
```
Texte principal :
Un jacuzzi privatif, la vue mer pour vous deux, le silence des hauteurs.
Le studio Mabouya, c'est l'évasion à deux en Martinique — terrasse, eau turquoise à 5 min, dès 110 €/nuit.
Réservation directe, paiement sécurisé, accueil personnalisé.
Titre : Studio Mabouya — Jacuzzi privatif vue mer
Description : Escapade en couple, réservée en direct.
CTA : Réserver
```
> ⚠️ **Nomenclature** : ne jamais écrire « villa Mabouya/Géko ». Seuls Amaryllis & Iguana = « villas ». Mabouya = **studio**, Géko = **cocon**, Schœlcher = **appartement**.

**B6. (semaines 3-4) Ad set A3 — Offre Groupe** — 5 €/j · landing `/location-groupe-sainte-luce` :
```
Texte principal :
Toute la tribu. Une seule adresse. Un seul paiement.
À Sainte-Luce, réunissez jusqu'à 11 proches dans une résidence privée — piscines, jacuzzi, terrasses face à la mer.
Le grand format en direct, sans frais de plateforme. Réservez 4 à 8 mois avant la haute saison.
Titre : Villas Groupe — Sainte-Luce, Martinique
CTA : En savoir plus
```

**B7. → LANCER Campagne 1.** Visuels : pioche les meilleures photos (`/photos/<bien>/`) — piscine débordement (Amaryllis), jacuzzi terrasse (Mabouya), 3 ratios (1:1, 4:5, 9:16).

---

## C) Après lancement (les 2 premières semaines)

- **Google, chaque semaine :** Insights → **Termes de recherche** → ajoute en négatif tout le hors-sujet (c'est là que fuit 80 % du budget).
- **Règle kill/scale :** couper un mot-clé/angle à **>2× le CPA cible sans conversion** après ~50 clics ; scaler (+20 %/3j) ce qui convertit.
- **Meta :** ne juge pas avant ~1 semaine (apprentissage). On cherche du **trafic qualifié + ViewContent** (pas la résa immédiate en juin).
- **Bascule Ventes :** en **septembre**, quand le Pixel a accumulé des events → objectif Ventes + retargeting + lookalike.
- **Suivi conversions :** onglet **Analytics** admin (funnel view_item → begin_checkout → purchase) + GA4 + Meta Events Manager.

**Ordre conseillé : Google d'abord** (intention → conversions rapides, l'offre groupe peut rembourser tout le budget), **Meta en parallèle à petit budget** pour charger le retargeting.
