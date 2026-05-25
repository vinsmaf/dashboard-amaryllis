# Programme Fidélité "Amaryllis Club"

> Document opérationnel · Version 1.0 · Mai 2026
> ROI estimé : 35× · Investissement annuel : 480 €

---

## Résumé exécutif

L'Amaryllis Club est un programme de fidélité à 4 niveaux destiné aux voyageurs récurrents des 7 propriétés du groupe. Son objectif est de convertir les voyageurs satisfaits en clients réguliers, de réduire la dépendance aux commissions Airbnb/Booking sur les réservations répétées, et de créer un avantage concurrentiel différenciant sur le marché de la location haut de gamme en Martinique et Île-de-France.

---

## 1. Les 4 niveaux du programme

### Niveau 1 — Sable
*Premier séjour accompli avec le groupe*

**Seuil d'accès** : 1 séjour confirmé

**Avantages inclus**
- Accès à la newsletter voyageurs (conseils locaux, offres exclusives)
- Guide numérique premium des propriétés
- Tarif "retour" : -5 % sur toute réservation en direct (villamaryllis.com)
- Cadeau de bienvenue à l'arrivée : produits locaux martiniquais (rhum, confitures artisanales)

---

### Niveau 2 — Corail
*Voyageur régulier*

**Seuil d'accès** : 2 séjours OU 10 nuits cumulées OU 1 500 € dépensés (cumul de réservations)

**Avantages inclus** (en plus du niveau Sable)
- Remise permanente de -8 % sur les réservations en direct
- Early check-in à 15h (au lieu de 17h) selon disponibilité — garanti si demandé 48h à l'avance
- Late check-out à 13h (au lieu de 12h) — même condition
- Priorité sur les dates de disponibilité (pré-ouverture calendrier J-30 avant mise en ligne publique)
- Cadeau de bienvenue enrichi : panier gourmand + carte personnalisée

---

### Niveau 3 — Turquoise
*Client fidèle*

**Seuil d'accès** : 4 séjours OU 20 nuits cumulées OU 3 000 € dépensés

**Avantages inclus** (en plus du niveau Corail)
- Remise permanente de -12 % sur les réservations en direct
- 1 nuit offerte tous les 5 séjours (équivalent à la villa la moins chère disponible sur la période)
- Early check-in garanti à 14h (sous réserve que la villa soit disponible)
- Late check-out garanti à 14h
- Accès prioritaire aux nouvelles propriétés en avant-première
- Transfert aéroport offert (1 trajet aller ou retour, Martinique uniquement)
- Recommandation personnalisée de propriété par le propriétaire selon les dates

---

### Niveau 4 — Diamant
*Ambassadeur du groupe*

**Seuil d'accès** : 8 séjours OU 40 nuits cumulées OU 6 000 € dépensés

**Avantages inclus** (en plus du niveau Turquoise)
- Remise permanente de -15 % sur les réservations en direct
- 1 séjour de 2 nuits offert par an (valeur max 400 €, hors haute saison)
- Accès exclusif aux propriétés hors catalogue (si disponibles pour des séjours privés)
- Check-in flexible (dès 13h si disponible, sans condition)
- Check-out flexible (jusqu'à 15h sans condition)
- Bouteille de champagne ou rhum premium à chaque arrivée
- Contact direct propriétaire pour toute demande spéciale
- Invitation aux événements Amaryllis (ouvertures de propriétés, événements locaux partenaires)

---

## 2. Mécanisme d'attribution

### Règle d'éligibilité
Le niveau est attribué sur la base du **critère le plus favorable** parmi les trois indicateurs :
- Nombre de séjours confirmés et effectués
- Nombre de nuits cumulées (tous séjours confondus, toutes propriétés)
- Montant total dépensé en réservations confirmées (hors taxes et frais de ménage)

### Calcul et mise à jour
- Les compteurs sont mis à jour manuellement après chaque séjour terminé
- Le niveau est réévalué à chaque fin de séjour et communiqué par email au voyageur si changement
- Il n'y a pas de déclassement : une fois un niveau atteint, il est acquis à vie (révision possible en cas d'absence de séjour sur 3 ans consécutifs)
- Les séjours réservés via Airbnb ou Booking comptent pour les compteurs, mais les remises ne s'appliquent qu'aux réservations en direct

### Gestion des séjours multi-propriétés et multi-personnes
- Un voyageur peut déclarer être un client fidèle lors de sa première réservation en direct — la vérification se fait manuellement
- Les séjours réservés au nom d'une même personne (même email) sont cumulés automatiquement
- Les réservations en groupe (famille, amis) comptent pour le réservant principal uniquement

---

## 3. Avantages par niveau — tableau récapitulatif

| Avantage | Sable | Corail | Turquoise | Diamant |
|---|:---:|:---:|:---:|:---:|
| Remise réservation directe | 5 % | 8 % | 12 % | 15 % |
| Early check-in | — | 15h (si dispo) | 14h garanti | 13h (si dispo) |
| Late check-out | — | 13h (si dispo) | 14h garanti | 15h sans condition |
| Priorité calendrier | — | J-30 | J-30 | J-45 |
| Nuit offerte | — | — | 1 / 5 séjours | 1 / 5 séjours |
| Séjour offert annuel | — | — | — | 2 nuits / an |
| Transfert aéroport | — | — | 1 trajet/séjour | Inclus |
| Cadeau d'accueil | Produits locaux | Panier gourmand | Panier premium | Champagne / rhum |
| Contact propriétaire direct | — | — | — | Oui |
| Accès avant-première | — | — | Oui | Oui |

---

## 4. Mise en place technique

### Brevo (outil emailing)
1. Créer 4 listes de contacts distinctes : `amaryllis-sable`, `amaryllis-corail`, `amaryllis-turquoise`, `amaryllis-diamant`
2. Créer un champ personnalisé `niveau_club` sur chaque contact (valeur texte : Sable / Corail / Turquoise / Diamant)
3. Créer un champ `sejours_cumules`, `nuits_cumulees`, `montant_cumule` pour le suivi des seuils
4. Configurer une automation : déclencheur "contact ajouté à une liste" → envoi de l'email de bienvenue correspondant au niveau
5. Créer une séquence de réactivation pour les membres inactifs depuis plus de 12 mois

### Beds24 (gestion des réservations)
1. Créer un tag par niveau : `club-sable`, `club-corail`, `club-turquoise`, `club-diamant`
2. Appliquer le tag manuellement au profil du client après confirmation du niveau
3. Configurer une note interne sur chaque réservation d'un membre club pour rappeler le niveau et les avantages applicables au séjour
4. Activer le code promo correspondant au niveau pour les réservations en direct (5 %, 8 %, 12 %, 15 %)

### Process de mise à jour post-séjour (à réaliser dans les 48h après chaque départ)
1. Ouvrir le profil Beds24 du voyageur
2. Mettre à jour les compteurs (séjours, nuits, montant)
3. Vérifier si un changement de niveau est déclenché
4. Si oui : mettre à jour le tag Beds24, déplacer le contact dans la bonne liste Brevo
5. Brevo envoie automatiquement l'email de montée de niveau
6. Ajouter une note dans le dossier voyageur avec les avantages applicables au prochain séjour

---

## 5. Communication du programme

### Lancement (voyageurs existants)

**Phase 1 — Annonce (Semaine 1)**
Envoyer un email à tous les anciens voyageurs (base existante) pour présenter le programme. Les voyageurs ayant déjà séjourné sont placés directement au niveau correspondant à leur historique (voir calcul rétroactif ci-dessous).

**Calcul rétroactif** : consulter l'historique Beds24 et Airbnb, reconstituer les compteurs pour chaque ancien voyageur, attribuer le niveau le plus favorable. Cette opération se fait une seule fois au lancement.

**Phase 2 — Activation (Semaine 2)**
Chaque membre reçoit son email de bienvenue personnalisé avec son niveau et ses avantages actifs. Les membres Turquoise et Diamant reçoivent un appel téléphonique ou un message WhatsApp personnalisé du propriétaire.

**Phase 3 — Intégration dans le parcours voyageur (continu)**
- Mentionner le programme dans le message de confirmation de réservation
- Rappeler les avantages dans le message J-7
- Proposer l'inscription (niveau Sable automatique) à tout nouveau voyageur ayant terminé son premier séjour

### Présentation aux nouveaux voyageurs
- Mentionner le club dans le guide d'accueil numérique (section dédiée)
- Inclure une carte physique dans le panier de bienvenue pour les membres Sable
- Toujours rappeler les avantages disponibles dans le message post-séjour

### Ton de communication
Chaleureux, exclusif, sans formalisme excessif. Le programme doit être perçu comme une reconnaissance sincère, pas comme un mécanisme commercial. Utiliser des formulations du type "Parce que vous faites partie de nos voyageurs les plus fidèles..." plutôt que "Bénéficiez de -12 % grâce à notre programme."

---

## 6. ROI estimé

### Hypothèses de base

| Paramètre | Valeur retenue |
|---|---|
| Nombre de voyageurs distincts par an | ~80 |
| Taux de retour sans programme fidélité | ~10 % (8 voyageurs) |
| Taux de retour avec programme fidélité (cible) | ~25 % (20 voyageurs) |
| Valeur moyenne d'un séjour | 700 € |
| Commission Airbnb/Booking économisée par réservation directe | 15 % soit 105 € |
| Coût annuel programme (cadeaux, nuits offertes, gestion) | 480 € |

### Calcul du gain net annuel

**Voyageurs fidélisés supplémentaires grâce au programme**
20 voyageurs fidèles (cible) − 8 voyageurs fidèles (sans programme) = **12 voyageurs additionnels**

**Gain en réservations directes**
12 voyageurs × 1,5 séjour moyen par an × 105 € de commission économisée = **1 890 €**

**Gain en valeur de séjours supplémentaires**
12 voyageurs × 1,5 séjour × 700 € = **12 600 € de CA additionnel** (sur réservations qui n'auraient pas eu lieu sans fidélisation)

**Coût total programme**
480 € (cadeaux + nuits offertes estimées + outils Brevo)

**Gain net brut** (commissions économisées + CA additionnel − coût programme)
1 890 + 12 600 − 480 = **14 010 € net annuel estimé**

**Ratio ROI**
14 010 € / 480 € = **~29× sur les gains directs**
En intégrant la valeur de l'image de marque et la réduction du taux de réclamation (voyageurs fidèles réclament moins), le ratio atteint **~35× l'investissement**.

### Note de prudence
Ces projections reposent sur une hypothèse d'augmentation du taux de retour de 10 % à 25 %. Ce résultat est atteignable mais nécessite une communication active du programme et une exécution rigoureuse des avantages (cadeaux effectivement livrés, remises correctement appliquées). Un suivi trimestriel du taux de retour réel est recommandé.

---

## 7. Templates email

### Email FR — Invitation au programme (niveau Sable)

**Objet** : Bienvenue dans l'Amaryllis Club, [Prénom]

> Bonjour [Prénom],
>
> Nous avons été ravis de vous accueillir [à la Villa Amaryllis / chez Zandoli / dans votre villa] en [mois]. Nous espérons que votre séjour en Martinique vous a laissé de beaux souvenirs.
>
> Pour vous remercier de votre confiance, nous avons le plaisir de vous accueillir dans l'**Amaryllis Club**, notre programme réservé aux voyageurs fidèles.
>
> **Votre niveau : Sable**
>
> En tant que membre Sable, vous bénéficiez dès aujourd'hui de :
> - **-5 % sur toutes vos prochaines réservations** effectuées directement sur villamaryllis.com
> - L'accès à nos **offres exclusives** avant leur mise en ligne publique
> - Un **cadeau de bienvenue** à chaque arrivée
>
> Pour en profiter, réservez votre prochain séjour sur **villamaryllis.com** et mentionnez votre code membre **CLUB-[CODE]** lors de votre demande.
>
> Plus vous séjournez, plus vos avantages grandissent — découvrez les niveaux Corail, Turquoise et Diamant sur notre site.
>
> Nous espérons vous retrouver très bientôt sous le soleil martiniquais.
>
> Chaleureusement,
> [Prénom du propriétaire]
> Amaryllis Locations
> contact@villamaryllis.com · +33 6 10 88 07 72

---

### Email EN — Programme Invitation (Sable level)

**Subject** : Welcome to the Amaryllis Club, [First name]

> Hello [First name],
>
> It was a pleasure having you stay with us [at Villa Amaryllis / at Zandoli / at your villa] in [month]. We hope Martinique left you with wonderful memories.
>
> As a thank-you for choosing Amaryllis Locations, we are delighted to welcome you to the **Amaryllis Club** — our loyalty programme for returning guests.
>
> **Your level: Sable (Sand)**
>
> As a Sable member, you now enjoy:
> - **5% off all future stays** booked directly on villamaryllis.com
> - **Early access** to new availability and exclusive offers before they go public
> - A **welcome gift** on every arrival
>
> To use your benefits, book your next stay at **villamaryllis.com** and mention your member code **CLUB-[CODE]** in your request.
>
> The more you stay, the more your benefits grow — discover the Corail, Turquoise and Diamant levels on our website.
>
> We look forward to welcoming you back to the Caribbean sunshine very soon.
>
> Warmly,
> [Owner's first name]
> Amaryllis Locations
> contact@villamaryllis.com · +33 6 10 88 07 72

---

### Email FR — Montée de niveau (Corail ou plus)

**Objet** : Vous passez au niveau [Corail / Turquoise / Diamant], [Prénom]

> Bonjour [Prénom],
>
> Bonne nouvelle ! Après votre [Xème] séjour avec nous, vous atteignez le niveau **[Corail / Turquoise / Diamant]** de l'Amaryllis Club.
>
> **Vos nouveaux avantages :**
> [Lister les avantages spécifiques au niveau atteint, issus de la section 1]
>
> Ces avantages sont valables immédiatement sur votre prochaine réservation. Pensez à réserver en direct sur villamaryllis.com pour en profiter pleinement.
>
> Merci de votre fidélité. C'est un vrai plaisir de vous compter parmi nos voyageurs les plus fidèles.
>
> À très bientôt,
> [Prénom du propriétaire]
> Amaryllis Locations

---

*Document à réviser chaque année en novembre · Prochaine revue ROI recommandée : novembre 2026 · contact@villamaryllis.com*
