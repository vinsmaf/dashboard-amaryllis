# Audit de la page CGV — `src/ConditionsGenerales.jsx`

> ⚠️ **MODÈLE / AIDE — PAS UN AVIS D'AVOCAT.** Audit du code réel (`src/ConditionsGenerales.jsx`, en vigueur depuis le 24 mai 2026, route `/conditions-generales`). À faire valider par un professionnel. **Aucune modification de code n'est faite ici** — uniquement des recommandations + textes prêts à coller (Vincent décide).

---

## Verdict global

CGV **solides et bien structurées** : 14 articles couvrant l'essentiel. Pas de manque critique bloquant. **3 corrections de fond** à traiter (dont 1 erreur factuelle sur Iguana) + quelques compléments. Détail ci-dessous.

---

## Ce qui est BIEN couvert ✅

| Sujet | Article | Note |
|---|---|---|
| Identité prestataire | 1 | OK (manque SIRET — voir plus bas) |
| Formation du contrat / paiement Stripe immédiat | 3, 4 | Clair |
| Taxe de séjour (distinction OTA vs direct) | 4 | Très bien traité |
| Pas de stockage carte (Stripe) | 4 | OK |
| **Caution** (pré-autorisation, levée J+3, contestation 8 j) | 5 | Complet |
| **Annulation** (barème + force majeure + rétractation L.221-28) | 6 | Complet et cohérent |
| Obligations voyageur / propriétaire | 7, 8 | OK |
| **Responsabilités** (panne équipements, dommages voyageur) | 9 | OK |
| Animaux | 10 | OK |
| Check-in 17h / check-out 12h | 11 | OK |
| **RGPD** + lien politique de confidentialité | 12 | OK (léger — voir F4) |
| Droit applicable + tribunaux + **médiation conso** | 13 | OK |
| Modification des CGV / version datée | 14 | OK |

---

## Ce qui MANQUE ou est à CORRIGER

### 🔴 F1 — Erreur factuelle : Villa Iguana (art. 2, ligne 136)
La CGV indique : *« Villa Iguana — Sainte-Luce (97228) — **location longue durée uniquement** »*.
**Problème** : Iguana est une **location saisonnière** (résidence Amaryllis, Sainte-Luce), capacité 6, prix saisonnier (`_biens.js`). La mention « longue durée uniquement » est fausse et contredit le reste du site (tunnel direct, fiche bien).
**Correctif** — remplacer la ligne par :
> `<Li><strong>Villa Iguana</strong> — Sainte-Luce, Martinique (97228)</Li>`

### 🔴 F2 — Acompte / solde absents (art. 4)
Le tunnel direct applique **40 % à la réservation / 60 % à J-30**, mais la CGV ne mentionne que « paiement débité immédiatement » (art. 3). Incohérence avec le produit réel et le contrat (`contrat-PRET-A-REMPLIR.md` art. 6).
**Correctif** — ajouter dans l'article 4 (Prix et paiement) :
> **Acompte et solde :** Pour les réservations en direct, un **acompte de 40 %** du montant total est prélevé à la réservation pour la confirmer. Le **solde de 60 %** est prélevé automatiquement **au plus tard 30 jours avant l'arrivée**. Pour une réservation effectuée à moins de 30 jours de l'arrivée, la totalité est due immédiatement. À défaut de paiement du solde à l'échéance, la réservation peut être considérée comme annulée par le Voyageur et l'acompte conservé (cf. art. 6).

### 🟠 F3 — Cohérence du barème caution / annulation entre CGV et contrat
La CGV (annulation ≥30 j / 15-29 j / <15 j ; caution levée J+3 ; contestation 8 j) et le contrat prêt-à-remplir ont été **alignés** sur ces mêmes valeurs. ✅ Bon point — **à maintenir** : toute évolution doit être répercutée dans les deux documents simultanément.

### 🟠 F4 — RGPD (art. 12) trop léger vs le traitement réel
L'art. 12 ne liste ni les **durées de conservation** (10 ans comptable / 3 ans relation client) ni les **sous-traitants** (Stripe, Beds24, Cloudflare, Google), alors que le contrat et le registre les détaillent.
**Correctif** — compléter l'art. 12 :
> Les données sont conservées **3 ans** après le dernier contact (relation client) et **10 ans** pour les pièces comptables (art. L.123-22 C. com.). Sous-traitants : Stripe (paiement), Beds24 (réservations), Cloudflare (hébergement), Google Workspace. Réclamation possible auprès de la **CNIL**.

### 🟡 F5 — Mentions légales / SIRET
Art. 1 renvoie l'adresse « sur demande » (acceptable pour un particulier) mais **aucun SIRET** n'apparaît. Dès l'immatriculation (cf. `plan-action-declarations.md`), ajouter le **SIRET** à l'art. 1 — obligatoire pour un professionnel encaissant en ligne (art. L.111-1 Code conso).

### 🟡 F6 — N° de déclaration de meublé
Les CGV ne mentionnent pas le n° de déclaration. Ce n'est pas le rôle des CGV (il va sur chaque **fiche bien** + annonces), mais on peut ajouter une phrase générique à l'art. 2 :
> Chaque hébergement fait l'objet d'une déclaration de meublé de tourisme ; le numéro est indiqué sur la fiche du bien concerné.

### 🟡 F7 — Heures check-in CGV (17h/12h) vs contrat (16h dans l'ancien modèle)
La CGV dit **17h / 12h**. Le contrat prêt-à-remplir a été aligné sur **17h / 12h**. ✅ Cohérent. *(L'ancien modèle `contrat-location-meuble-tourisme.md` mentionnait 16h/11h — à harmoniser si encore utilisé.)*

---

## Synthèse priorisée

| # | Sujet | Gravité | Action |
|---|---|---|---|
| F1 | Iguana « longue durée uniquement » = faux | 🔴 | Corriger art. 2 |
| F2 | Acompte 40 % / solde 60 % J-30 absent | 🔴 | Ajouter à l'art. 4 |
| F4 | RGPD sans durées ni sous-traitants | 🟠 | Compléter art. 12 |
| F5 | SIRET absent | 🟡 | Ajouter dès immatriculation |
| F3/F7 | Cohérence CGV ↔ contrat | 🟠 | Déjà alignés — à maintenir |
| F6 | N° déclaration | 🟡 | Phrase générique optionnelle art. 2 |

> Validation avocat recommandée avant mise en production des modifications, notamment art. 4 (acompte/solde) et art. 6 (annulation).
