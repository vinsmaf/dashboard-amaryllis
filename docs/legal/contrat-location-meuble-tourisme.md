# Modèle de contrat de location saisonnière — Meublé de tourisme

> ⚠️ **AVERTISSEMENT — MODÈLE, PAS UN AVIS D'AVOCAT.**
> Ce document est un **gabarit réutilisable** rédigé à titre informatif pour les 7 biens d'Amaryllis Locations. Il **doit être relu et validé par un avocat ou un notaire** avant tout usage en production, en particulier les clauses d'annulation, de caution et de responsabilité, qui engagent juridiquement le bailleur. Rédigé le 2026-06-02. Sources : Code du tourisme (art. L.324-1-1 et s.), loi n° 2024-1039 du 19/11/2024 dite « loi Le Meur », loi n° 70-9 du 02/01/1970 dite « loi Hoguet », Code civil, Code de la consommation.

---

## Notice d'emploi (à supprimer du contrat envoyé au voyageur)

### Champs variables — à renseigner par bien à chaque location
Tous les champs entre `[crochets]` sont à compléter. Référentiel des faits par bien : `functions/api/_biens.js` (source de vérité — capacités, équipements). **Ne jamais surévaluer la capacité max** (mensonge contractuel + risque assurance).

| Bien (id) | Désignation officielle | Commune | Capacité max | Équipement clé | Interdits à ne pas promettre |
|---|---|---|---|---|---|
| `amaryllis` | Villa Amaryllis | Sainte-Luce (972) | **8** (3 ch.) | Piscine à débordement eau salée 4×7 m | Pas de jacuzzi |
| `iguana` | Villa Iguana | Le Diamant (972)* | **6** (2 ch.) | Piscine eau salée non chlorée | Pas de débordement, pas de jacuzzi |
| `zandoli` | Zandoli | Sainte-Luce (972) | **5** | Piscine privative avec cascade (eau classique) | Pas d'eau salée |
| `geko` | Géko | Sainte-Luce (972) | **4** | Piscine privative avec cascade (eau classique) | Pas d'eau salée |
| `mabouya` | Mabouya | Sainte-Luce (972) | **2** | Jacuzzi privatif vue mer | Aucune piscine |
| `schoelcher` | Bellevue | Schœlcher (972) | [à confirmer] | Vue panoramique baie | Aucune piscine, aucun jacuzzi |
| `nogent` | Appartement Nogent | Nogent-sur-Marne (94) | [à confirmer] | Jardin + terrasse | Aucune piscine, aucun jacuzzi |

\* `_biens.js` indique `lieu: "Sainte-Luce"` pour Iguana, mais le brief projet et le routing SEO (`guide-le-diamant`) situent Villa Iguana **au Diamant**. **À trancher avant signature** : l'adresse réelle du bien conditionne la commune de déclaration ET la taxe de séjour. Ne pas signer un contrat avec une commune erronée.

### Quel jeu de clauses appliquer ?
- **Biens Martinique (Amaryllis, Iguana, Zandoli, Géko, Mabouya, Bellevue)** → utiliser la **VARIANTE A — Meublé de tourisme (location saisonnière courte durée)**, qui inclut la collecte de la taxe de séjour pour les réservations en direct.
- **Nogent-sur-Marne** → deux cas, voir **VARIANTE B** :
  - *B1* : location **saisonnière** (courte durée, meublé de tourisme) → résidence principale de l'exploitant, **plafond 120 nuits/an** à respecter, taxe de séjour applicable.
  - *B2* : location **longue durée** (bail meublé loi ALUR > 1 an, ou bail mobilité 1–10 mois) → **ce gabarit ne convient pas**, utiliser un bail d'habitation dédié + encadrement des loyers IDF. Pas de taxe de séjour.

### Loi Hoguet — bailleur en direct
Vincent Salomon loue **ses propres biens en direct**, sans mandat d'agence immobilière. Il n'exerce donc **pas** l'activité d'intermédiaire réglementée par la loi Hoguet (pas de carte professionnelle requise). Le contrat est conclu **directement entre le propriétaire-bailleur et le voyageur**. À ne pas confondre avec les réservations via OTA (Airbnb/Booking), qui relèvent des CGU de la plateforme et non du présent contrat.

---

# CONTRAT DE LOCATION SAISONNIÈRE D'UN MEUBLÉ DE TOURISME

## Entre les soussignés

**LE BAILLEUR**
- Nom / dénomination : **Vincent SALOMON — Amaryllis Locations**
- Adresse : [adresse du bailleur], 97228 Sainte-Luce, Martinique
- SIRET : [n° SIRET — à immatriculer, voir checklist déclarations]
- Email : contact@villamaryllis.com — Téléphone : [téléphone]
- Qualité : propriétaire louant en direct, sans intermédiaire (hors loi Hoguet)

Ci-après « **le Bailleur** »,

**LE LOCATAIRE**
- Nom et prénom : [nom du locataire]
- Adresse : [adresse complète]
- Email : [email] — Téléphone : [téléphone]
- Pièce d'identité (type + n°) : [à renseigner pour les besoins du registre éventuel]

Ci-après « **le Locataire** »,

Il a été convenu ce qui suit.

---

## Article 1 — Désignation du logement

Le Bailleur loue au Locataire le meublé de tourisme suivant :
- Désignation : **[nom du bien — ex. Villa Amaryllis]**
- Adresse exacte : [adresse complète], [code postal] [commune]
- Type : [villa / logement / studio / appartement]
- Surface habitable : [m²] — Nombre de pièces / chambres : [nb]
- Équipements principaux : [ex. piscine à débordement eau salée 4×7 m] (conforme à `_biens.js`)
- **Numéro de déclaration de meublé de tourisme** : **[n° de déclaration en mairie]**
  *(obligatoire — art. L.324-1-1 IV Code du tourisme ; doit aussi figurer sur toutes les annonces)*
- Classement Atout France (le cas échéant) : [ ] Non classé · [ ] Classé **[1 à 5] étoiles**, décision n° [réf], valable jusqu'au [date]
- Diagnostic de performance énergétique (DPE) : classe **[A à G]**, réalisé le [date]

Le logement est loué **meublé et équipé** pour un usage d'habitation **temporaire et de loisirs**. La présente location **ne constitue pas la résidence principale** du Locataire et ne lui ouvre aucun droit au maintien dans les lieux à l'expiration du contrat.

---

## Article 2 — Durée et dates du séjour

- Date d'arrivée (check-in) : **[JJ/MM/AAAA] à partir de [16h00]**
- Date de départ (check-out) : **[JJ/MM/AAAA] avant [11h00]**
- Durée totale : **[N] nuit(s)**

Le séjour est ferme. Toute prolongation doit faire l'objet d'un accord écrit préalable du Bailleur et donne lieu à facturation complémentaire.

---

## Article 3 — Nombre d'occupants

Le logement ne peut être occupé que par **[N] personne(s) maximum** (capacité de couchage de [nom du bien] = **[capacité de `_biens.js`]**), enfants et nourrissons compris sauf mention contraire.

Tout dépassement non autorisé du nombre d'occupants autorise le Bailleur à **refuser l'accès** ou à **résilier le contrat sans remboursement**. La sous-location et la cession du contrat sont interdites.

---

## Article 4 — Prix et détail des sommes dues

| Poste | Montant |
|---|---|
| Loyer de la location ([N] nuits) | **[montant] €** |
| Forfait ménage (fin de séjour) | **[montant] €** |
| Charges incluses (eau, électricité, wifi, …) | **incluses** *(ou : [montant])* |
| **Sous-total séjour** | **[montant] €** |
| Taxe de séjour (voir art. 5) | **[montant] €** |
| **TOTAL À PAYER** | **[montant TTC] €** |
| Dépôt de garantie / caution (non encaissé — voir art. 7) | **[montant] €** |

Le prix s'entend **sans frais de service** ni commission d'intermédiaire (réservation en direct).

---

## Article 5 — Taxe de séjour

> Référence : note `docs/taxe-sejour-note.md` (tarifs à confirmer auprès de chaque commune/EPCI — ne jamais inventer un montant).

### VARIANTE A — Biens Martinique + Nogent en courte durée
La **taxe de séjour est due par le Locataire** (voyageur hébergé à titre onéreux). Elle est **perçue par le Bailleur** pour le compte de **[commune / EPCI bénéficiaire : Sainte-Luce / CACEM-Schœlcher / Espace Sud / Nogent-EPT — à confirmer]**, puis reversée à la collectivité.

- Mode de calcul : **tarif par nuitée et par personne** × nombre de nuitées × nombre de personnes assujetties.
- Tarif applicable : **[tarif officiel] € / nuitée / personne** *(dépend du classement Atout France — barème de la délibération en vigueur)*.
- Personnes exonérées : [mineurs et autres cas légaux à appliquer].
- Montant total de taxe de séjour pour ce séjour : **[montant] €** (ligne distincte du loyer).

*Réservations via Airbnb/Booking : la plateforme collecte et reverse elle-même la taxe — le présent article ne s'applique alors pas (éviter toute double collecte).*

### VARIANTE B2 — Nogent en bail longue durée
Sans objet : la taxe de séjour ne s'applique pas à une location d'habitation longue durée. *(Dans ce cas, utiliser un bail d'habitation dédié, pas ce gabarit.)*

---

## Article 6 — Modalités de paiement (acompte / solde)

- **Acompte / arrhes** : **[30] %** du total séjour, soit **[montant] €**, à la réservation, pour confirmer la réservation.
- **Solde** : **[montant] €**, au plus tard **[à J-30 / J-7]** avant l'arrivée.
- Moyens de paiement : carte bancaire via **Stripe** (paiement sécurisé) ou [virement].
- À défaut de paiement du solde à l'échéance, le Bailleur peut considérer la réservation comme **annulée par le Locataire** (art. 8) et conserver l'acompte.

*Nature des sommes versées d'avance : qualifiées d'**arrhes** (art. 1590 Code civil), sauf mention « acompte » expresse. Préciser le régime retenu, car il détermine les conséquences en cas de désistement (cf. art. 8).*

---

## Article 7 — Dépôt de garantie (caution)

- Montant : **[montant] €**.
- Modalité : **pré-autorisation bancaire via Stripe** (empreinte de carte). La somme **n'est pas débitée** ; elle est seulement bloquée puis libérée.
- Restitution / libération : sous **[7] jours** après l'état des lieux de sortie, déduction faite, le cas échéant et sur justificatifs, du coût des **dégradations, casses, pertes, ménage excessif ou nuitées supplémentaires** constatés.
- En cas de litige sur une retenue, le Bailleur fournit au Locataire le **détail chiffré et les justificatifs** des sommes retenues.

---

## Article 8 — Conditions d'annulation

| Annulation par le Locataire | Conséquence |
|---|---|
| Plus de **[30] jours** avant l'arrivée | Remboursement de l'acompte, **hors** frais bancaires éventuels |
| Entre **[30] et [7] jours** avant l'arrivée | Acompte conservé par le Bailleur |
| Moins de **[7] jours** avant l'arrivée ou no-show | **100 %** du séjour dû |

**Annulation par le Bailleur** : en cas d'impossibilité de fournir le logement (force majeure, sinistre), le Bailleur **rembourse l'intégralité des sommes versées**, sans autre indemnité.

**Information précontractuelle** : pour une réservation conclue à distance entre un professionnel et un consommateur, le **droit de rétractation de 14 jours ne s'applique pas** aux prestations d'hébergement fournies à une date déterminée (art. L.221-28 12° Code de la consommation). Le Locataire en est informé.

---

## Article 9 — État des lieux et inventaire

Un **état des lieux et un inventaire** du mobilier et des équipements sont établis **contradictoirement à l'entrée** puis **à la sortie** (ou par tout moyen probant : photos datées, fiche signée). À défaut d'observation du Locataire dans les **[24] heures** suivant l'arrivée, le logement est réputé conforme à l'inventaire d'entrée.

L'inventaire est annexé au présent contrat (**Annexe 1**). *Référence opérationnelle interne : `docs/checklist-etat-des-lieux.md`.*

---

## Article 10 — Règlement intérieur

Le Locataire s'engage à respecter le règlement intérieur (**Annexe 2**), et notamment :
- **Non-fumeur** à l'intérieur du logement.
- **Fêtes, soirées et événements interdits** ; nuisances sonores proscrites, en particulier la nuit (respect du voisinage).
- **Animaux** : [autorisés sous conditions / interdits — à préciser par bien].
- **Capacité max** strictement respectée (art. 3).
- Usage des équipements (piscine / jacuzzi selon le bien — voir `_biens.js`) sous la **surveillance et la responsabilité du Locataire**, notamment pour les enfants. Aucune baignade non surveillée.
- Tri des déchets et respect des consignes locales.

---

## Article 11 — Assurance et responsabilité

Le Locataire est **responsable** des dommages causés au logement, à son mobilier et à ses équipements pendant le séjour. Il déclare être **titulaire d'une assurance responsabilité civile** couvrant les risques locatifs (ou « villégiature ») et s'engage à en justifier sur demande. Le Bailleur **décline toute responsabilité** en cas de vol, perte ou dommage aux effets personnels du Locataire, ainsi qu'en cas d'accident résultant d'un usage non conforme des équipements.

---

## Article 12 — Données personnelles (RGPD)

Les données collectées (identité, coordonnées, dates et bien réservé, données de paiement traitées par Stripe) sont traitées par le Bailleur, **responsable de traitement**, aux fins de **gestion de la réservation, du séjour, de la facturation et du respect de ses obligations comptables, fiscales et de collecte de la taxe de séjour**.

- **Bases légales** : exécution du contrat (art. 6.1.b RGPD) et obligation légale (art. 6.1.c).
- **Durées de conservation** : données de réservation/relation client jusqu'à **3 ans** après le dernier contact ; **factures et pièces comptables : 10 ans** (art. L.123-22 Code de commerce).
- **Destinataires / sous-traitants** : Stripe (paiement), Beds24 (gestion des réservations), Cloudflare (hébergement), Google Workspace (suivi).
- **Droits** : accès, rectification, effacement, opposition, portabilité — exerçables à **contact@villamaryllis.com**. Réclamation possible auprès de la **CNIL**.
- Politique complète : **villamaryllis.com/politique-confidentialite**.

---

## Article 13 — Spécificité Nogent-sur-Marne (VARIANTE B1 uniquement)

Le logement de Nogent-sur-Marne constitue la **résidence principale** de l'exploitant. À ce titre, sa location en meublé de tourisme est limitée à **120 nuits par année civile** (art. L.324-1-1 Code du tourisme). Le Bailleur tient un **compteur des nuitées** et se réserve le droit de refuser une réservation portant le total au-delà de ce plafond. Le logement est situé en zone d'**encadrement des loyers d'Île-de-France** (pertinent pour une location longue durée — VARIANTE B2).

---

## Article 14 — Loi applicable, médiation et litiges

Le présent contrat est soumis au **droit français**. La Martinique relève intégralement du droit français (collectivité territoriale unique).

En cas de litige, le Locataire consommateur peut recourir **gratuitement à un médiateur de la consommation** : **[nom et coordonnées du médiateur — à désigner ; obligatoire pour un professionnel, art. L.612-1 Code de la consommation]**, ainsi qu'à la plateforme européenne de règlement en ligne des litiges (RLL).

À défaut de résolution amiable, **[le tribunal compétent / le tribunal du lieu de situation de l'immeuble]** est saisi.

---

## Signatures

Fait à [lieu], le [date], en deux exemplaires *(ou signé électroniquement via [Yousign / Dropbox Sign])*.

| Le Bailleur | Le Locataire |
|---|---|
| Vincent Salomon — Amaryllis Locations | [Nom] |
| Signature : | Signature *(précédée de « Lu et approuvé »)* : |

---

### Annexes
- **Annexe 1** — Inventaire et état des lieux d'entrée (réf. `docs/checklist-etat-des-lieux.md`)
- **Annexe 2** — Règlement intérieur du logement
- **Annexe 3** — Justificatif de classement Atout France (le cas échéant)

---

> **Rappel final** : faire valider ce gabarit par un professionnel du droit avant mise en production (clauses d'annulation, médiation, caution, responsabilité). Tenir à jour le **n° de déclaration de meublé de tourisme** par bien (cf. `docs/legal/checklist-declarations-meuble.md`) — sans lui le contrat et les annonces sont en infraction (art. L.324-1-1).
