# Contrat de location saisonnière — PRÊT À REMPLIR

> ⚠️ **MODÈLE / AIDE — PAS UN AVIS D'AVOCAT.** À faire valider par un professionnel du droit avant usage en production (clauses annulation, caution, responsabilité). Version dérivée de `docs/legal/contrat-location-meuble-tourisme.md`. Faits par bien : `functions/api/_biens.js`.

---

## Comment l'utiliser (3 étapes)

1. **Copier** ce contrat, **remplir uniquement les champs `[À COMPLÉTER : …]`** (identité voyageur, dates, montants, caution, n° de déclaration du bien). Le reste du texte est figé — ne pas y toucher.
2. **Choisir le barème** : acompte **40 %** à la réservation, **solde 60 % à J-30** (déjà branché dans le tunnel direct). Calculer le ménage, la taxe de séjour (ligne distincte) et la caution selon le bien.
3. **Envoyer pour signature** (PDF ou signature électronique). Garder un exemplaire signé + l'inventaire d'entrée (Annexe 1).

> 📌 **Sans n° de déclaration du meublé sur le contrat ET sur les annonces, vous êtes en infraction** (art. L.324-1-1 IV — amende jusqu'à 12 500 €). Voir `docs/legal/plan-action-declarations.md`.

---

# CONTRAT DE LOCATION SAISONNIÈRE D'UN MEUBLÉ DE TOURISME

## Entre les soussignés

**LE BAILLEUR**
- Vincent SALOMON — **Amaryllis Locations**
- Adresse : `[À COMPLÉTER : adresse du bailleur]`, Martinique
- SIRET : `[À COMPLÉTER : n° SIRET]`
- Email : contact@villamaryllis.com — Tél. / WhatsApp : +33 6 10 88 07 72
- Qualité : propriétaire louant en direct, sans intermédiaire (hors loi Hoguet)

Ci-après « **le Bailleur** ».

**LE LOCATAIRE**
- Nom et prénom : `[À COMPLÉTER : nom du locataire]`
- Adresse : `[À COMPLÉTER : adresse complète]`
- Email : `[À COMPLÉTER : email]` — Téléphone : `[À COMPLÉTER : téléphone]`
- Pièce d'identité (type + n°) : `[À COMPLÉTER]`

Ci-après « **le Locataire** ».

Il a été convenu ce qui suit.

---

## Article 1 — Désignation du logement

- Désignation : **`[À COMPLÉTER : nom du bien — ex. Villa Amaryllis]`**
- Adresse exacte : `[À COMPLÉTER : adresse]`, `[À COMPLÉTER : code postal]` `[À COMPLÉTER : commune]`
- Type / surface / chambres : `[À COMPLÉTER]`
- Équipements principaux : `[À COMPLÉTER — conforme à _biens.js, ne pas surévaluer]`
- **Numéro de déclaration de meublé de tourisme : `[À COMPLÉTER : n° de déclaration en mairie]`**
- DPE : classe `[À COMPLÉTER : A à G]` — Classement Atout France : `[À COMPLÉTER : non classé / N étoiles]`

Le logement est loué **meublé et équipé** pour un usage d'habitation **temporaire et de loisirs**. Cette location **ne constitue pas la résidence principale** du Locataire et ne lui ouvre aucun droit au maintien dans les lieux.

---

## Article 2 — Durée et dates du séjour

- Arrivée (check-in) : **`[À COMPLÉTER : JJ/MM/AAAA]` à partir de 17h00**
- Départ (check-out) : **`[À COMPLÉTER : JJ/MM/AAAA]` avant 12h00**
- Durée totale : **`[À COMPLÉTER : N]` nuit(s)**

Le séjour est ferme. Toute prolongation nécessite l'accord écrit préalable du Bailleur et une facturation complémentaire.

---

## Article 3 — Nombre d'occupants

Le logement ne peut être occupé que par **`[À COMPLÉTER : N]` personne(s) maximum** (capacité de couchage du bien, enfants et nourrissons compris). Tout dépassement non autorisé permet au Bailleur de refuser l'accès ou de résilier sans remboursement. Sous-location et cession interdites.

---

## Article 4 — Prix et détail des sommes dues

| Poste | Montant |
|---|---|
| Loyer (`[À COMPLÉTER : N]` nuits) | **`[À COMPLÉTER : montant]` €** |
| Forfait ménage de fin de séjour | **`[À COMPLÉTER : montant]` €** |
| Charges incluses (eau, électricité usage normal, wifi) | incluses |
| **Sous-total séjour** | **`[À COMPLÉTER : montant]` €** |
| Taxe de séjour (art. 5) | **`[À COMPLÉTER : montant]` €** |
| **TOTAL À PAYER** | **`[À COMPLÉTER : montant TTC]` €** |
| Dépôt de garantie / caution (non débité — art. 7) | **`[À COMPLÉTER : montant]` €** |

Le prix s'entend **sans frais de service ni commission d'intermédiaire** (réservation en direct).

---

## Article 5 — Taxe de séjour

La taxe de séjour est **due par le Locataire** et **perçue par le Bailleur** pour le compte de la collectivité bénéficiaire `[À COMPLÉTER : commune / EPCI — Sainte-Luce, CACEM-Schœlcher, EPT Nogent]`, puis reversée.

- Tarif applicable : `[À COMPLÉTER : € / nuitée / personne]` × `[À COMPLÉTER : N nuitées]` × `[À COMPLÉTER : N personnes assujetties]`.
- Personnes exonérées : `[À COMPLÉTER : mineurs et autres cas légaux]`.
- **Montant total taxe de séjour : `[À COMPLÉTER : montant]` €** (ligne distincte du loyer).

*Réservation via Airbnb/Booking : la plateforme collecte et reverse elle-même — ne pas collecter en direct (éviter la double collecte).*

---

## Article 6 — Modalités de paiement (acompte 40 % / solde 60 %)

- **Acompte : 40 % du total séjour, soit `[À COMPLÉTER : montant]` €**, à la réservation, pour confirmer la réservation.
- **Solde : 60 %, soit `[À COMPLÉTER : montant]` €**, au plus tard **à J-30 avant l'arrivée** (`[À COMPLÉTER : date limite JJ/MM/AAAA]`).
- Moyens de paiement : carte bancaire via **Stripe** (sécurisé) ou virement.
- À défaut de paiement du solde à l'échéance, le Bailleur peut considérer la réservation comme **annulée par le Locataire** (art. 8) et conserver l'acompte.

*Les sommes versées d'avance sont qualifiées d'**arrhes** (art. 1590 Code civil), sauf mention « acompte » expresse.*

---

## Article 7 — Dépôt de garantie (caution)

- Montant : **`[À COMPLÉTER : montant]` €**.
- Modalité : **pré-autorisation bancaire via Stripe** (empreinte de carte) — somme **non débitée**, seulement bloquée puis libérée.
- Libération sous **3 jours** après le départ, déduction faite (sur justificatifs) des dégradations, casses, pertes, ménage excessif ou nuitées supplémentaires.
- En cas de litige, le Bailleur fournit le **détail chiffré et les justificatifs**. Toute contestation par écrit dans les **8 jours** suivant la notification.

---

## Article 8 — Conditions d'annulation

| Annulation par le Locataire | Conséquence |
|---|---|
| **≥ 30 jours** avant l'arrivée | Remboursement intégral (hors frais bancaires éventuels) |
| **Entre 15 et 29 jours** avant l'arrivée | Remboursement de **50 %** du total |
| **< 15 jours** avant l'arrivée ou no-show | **Aucun remboursement** (100 % dû) |

**Annulation par le Bailleur** (force majeure, sinistre rendant le logement indisponible) : **remboursement intégral** des sommes versées, sans autre indemnité.

**Force majeure côté Locataire** (catastrophe naturelle, fermeture administrative, épidémie reconnue) : au choix du Locataire, **report** du séjour ou **avoir valable 12 mois**.

**Droit de rétractation** : le délai de 14 jours **ne s'applique pas** aux hébergements à date déterminée (art. L.221-28 12° Code de la consommation). Le Locataire en est informé.

> ⚠️ **Cohérence** : ce barème (≥30 j / 15-29 j / <15 j) est aligné sur les CGV du site (`src/ConditionsGenerales.jsx`). Ne pas le diverger.

---

## Article 9 — État des lieux et inventaire

Un **état des lieux et un inventaire** sont établis contradictoirement à l'entrée puis à la sortie (photos datées / fiche signée acceptées). À défaut d'observation du Locataire dans les **24 heures** suivant l'arrivée, le logement est réputé conforme. Inventaire en **Annexe 1**.

---

## Article 10 — Règlement intérieur (Annexe 2)

- **Non-fumeur** à l'intérieur.
- **Fêtes, soirées et événements interdits** ; nuisances sonores proscrites, surtout la nuit.
- **Animaux** : non acceptés sauf accord écrit préalable du Bailleur.
- **Capacité max** strictement respectée (art. 3).
- Piscine / jacuzzi (selon le bien) sous la **surveillance et la responsabilité du Locataire**, notamment pour les enfants. Aucune baignade non surveillée.
- Tri des déchets et consignes locales respectés.

---

## Article 11 — Assurance et responsabilité

Le Locataire est **responsable** des dommages causés au logement, au mobilier et aux équipements. Il déclare détenir une **assurance responsabilité civile / villégiature** et s'engage à en justifier sur demande. Le Bailleur **décline toute responsabilité** en cas de vol, perte ou dommage aux effets personnels du Locataire, ou d'accident résultant d'un usage non conforme des équipements.

---

## Article 12 — Données personnelles (RGPD)

Données traitées (identité, coordonnées, dates, bien, données de paiement via Stripe) par le Bailleur **responsable de traitement**, pour la gestion de la réservation, du séjour, de la facturation et des obligations comptables/fiscales/taxe de séjour.

- **Bases légales** : exécution du contrat (6.1.b) + obligation légale (6.1.c).
- **Conservation** : relation client 3 ans après dernier contact ; factures/pièces comptables 10 ans (art. L.123-22 C. com.).
- **Sous-traitants** : Stripe, Beds24, Cloudflare, Google Workspace.
- **Droits** (accès, rectification, effacement, opposition, portabilité) : contact@villamaryllis.com. Réclamation : CNIL.
- Politique complète : villamaryllis.com/politique-confidentialite.

---

## Article 13 — Spécificité Nogent-sur-Marne (à conserver uniquement pour ce bien)

Le logement de Nogent est la **résidence principale de l'exploitant** : sa location en meublé de tourisme est limitée à **120 nuits par année civile** (art. L.324-1-1). Le Bailleur tient un compteur des nuitées (toutes plateformes + direct) et peut refuser une réservation portant le total au-delà de ce plafond.

*Supprimer cet article pour les biens de Martinique.*

---

## Article 14 — Loi applicable, médiation et litiges

Droit français. En cas de litige, recherche d'une solution amiable ; à défaut, recours **gratuit à un médiateur de la consommation** (coordonnées : economie.gouv.fr/mediation-conso) + plateforme européenne de règlement en ligne des litiges.

Tribunal compétent : **Tribunal judiciaire de Fort-de-France** (biens Martinique) ou **de Créteil** (Nogent).

---

## Signatures

Fait à `[À COMPLÉTER : lieu]`, le `[À COMPLÉTER : date]`, en deux exemplaires *(ou signé électroniquement)*.

| Le Bailleur | Le Locataire |
|---|---|
| Vincent Salomon — Amaryllis Locations | `[À COMPLÉTER : nom]` |
| Signature : | Signature *(« Lu et approuvé »)* : |

### Annexes
- **Annexe 1** — Inventaire et état des lieux d'entrée
- **Annexe 2** — Règlement intérieur du logement
- **Annexe 3** — Justificatif de classement Atout France (le cas échéant)

> **Rappel** : tenir à jour le n° de déclaration par bien (`docs/legal/plan-action-declarations.md`). Sans lui, contrat et annonces sont en infraction.
