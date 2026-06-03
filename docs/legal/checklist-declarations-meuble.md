# Checklist des déclarations & obligations — 7 meublés de tourisme

> ⚠️ **AVERTISSEMENT — AIDE OPÉRATIONNELLE, PAS UN AVIS D'AVOCAT.**
> Checklist actionnable par bien, à jour au 2026-06-02. Sources : Code du tourisme (art. L.324-1-1 et s., R.324-1-2), loi n° 2024-1039 du 19/11/2024 (« loi Le Meur »), CCH (art. L.631-7 et s.). Les **tarifs de taxe de séjour ne sont pas chiffrés ici** : ils dépendent de délibérations locales (cf. `docs/taxe-sejour-note.md` — ne jamais inventer un montant). À valider par un professionnel du droit / expert-comptable.

---

## 0. Légende statuts
- 🔴 **À FAIRE — urgent** (risque d'amende immédiat)
- 🟠 **À FAIRE — court terme**
- 🟡 **À vérifier / arbitrer**
- ✅ **Fait** (à confirmer par Vincent)

> ⚠️ **Point bloquant transverse : localisation de Villa Iguana.** `functions/api/_biens.js` situe Iguana à **Sainte-Luce**, mais le brief et le routing SEO (`guide-le-diamant`) la situent **au Diamant**. La commune de déclaration ET de taxe de séjour en dépend. **À trancher avant toute déclaration.** Ci-dessous, Iguana est listée « Le Diamant (à confirmer) ».

---

## 1. Tableau de synthèse — déclaration mairie & numéro

| Bien | Commune | Déclaration mairie (L.324-1-1) | N° déclaration / enregistrement | N° affiché sur annonces (site + OTA) | Changement d'usage | Statut |
|---|---|---|---|---|---|---|
| Villa Amaryllis | Sainte-Luce (972) | Obligatoire (Cerfa 14004 / téléservice) | **[à obtenir]** | **[à intégrer]** | Non requis (hors zone tendue) | 🔴 |
| Villa Iguana | Le Diamant (972) *(à confirmer)* | Obligatoire | **[à obtenir]** | **[à intégrer]** | Non requis | 🔴 |
| Zandoli | Sainte-Luce (972) | Obligatoire | **[à obtenir]** | **[à intégrer]** | Non requis | 🔴 |
| Géko | Sainte-Luce (972) | Obligatoire | **[à obtenir]** | **[à intégrer]** | Non requis | 🔴 |
| Mabouya | Sainte-Luce (972) | Obligatoire | **[à obtenir]** | **[à intégrer]** | Non requis | 🔴 |
| Bellevue | Schœlcher (972) | Obligatoire | **[à obtenir]** | **[à intégrer]** | Non requis | 🔴 |
| Appart. Nogent | Nogent-sur-Marne (94) | **Obligatoire + n° enregistrement** (téléprocédure) | **[à obtenir]** | **[à intégrer]** | Non requis *(résidence principale)* | 🔴 |

**Sanctions** : défaut de déclaration → amende jusqu'à **450 €/bien** (art. R.324-1-2) ; **absence du n° sur les annonces** → amende jusqu'à **12 500 €** (art. L.324-1-1 IV). → priorité absolue.

---

## 2. Détail par bien

### 2.1 — Villa Amaryllis (Sainte-Luce, 972) · capacité 8 · piscine débordement eau salée
- 🔴 Déclarer en mairie de Sainte-Luce → obtenir le **n° de déclaration**.
- 🟠 Intégrer le n° sur la fiche site + Airbnb + Booking.
- 🟠 **DPE** : faire réaliser un diagnostic (loi Le Meur — passoires interdites progressivement).
- 🟡 **Classement Atout France** : à arbitrer (impact fiscal micro-BIC + taxe de séjour).
- 🟠 **Taxe de séjour** Sainte-Luce : confirmer l'autorité bénéficiaire (commune vs Espace Sud/CAESM) + tarif ; collecter sur les **résas directes**.

### 2.2 — Villa Iguana (Le Diamant ?, 972) · capacité 6 · piscine eau salée
- 🔴 **Trancher la commune réelle** (Le Diamant vs Sainte-Luce) — corriger `_biens.js` si Le Diamant.
- 🔴 Déclarer dans la **bonne** mairie → n° de déclaration.
- 🟠 N° sur annonces · 🟠 DPE · 🟡 Classement.
- 🟠 Taxe de séjour de la commune retenue (Le Diamant relève d'un EPCI distinct de Sainte-Luce — **ne pas reverser à la mauvaise collectivité**).

### 2.3 — Zandoli (Sainte-Luce, 972) · capacité 5 · piscine cascade
- 🔴 Déclaration mairie Sainte-Luce → n°. · 🟠 N° annonces · 🟠 DPE · 🟡 Classement.
- 🟠 Taxe de séjour Sainte-Luce (résas directes).

### 2.4 — Géko (Sainte-Luce, 972) · capacité 4 · piscine cascade
- 🔴 Déclaration mairie Sainte-Luce → n°. · 🟠 N° annonces · 🟠 DPE · 🟡 Classement.
- 🟠 Taxe de séjour Sainte-Luce (résas directes).

### 2.5 — Mabouya (Sainte-Luce, 972) · capacité 2 · jacuzzi (aucune piscine)
- 🔴 Déclaration mairie Sainte-Luce → n°. · 🟠 N° annonces · 🟠 DPE · 🟡 Classement.
- 🟠 Taxe de séjour Sainte-Luce (résas directes).

### 2.6 — Bellevue (Schœlcher, 972) · appartement de standing · vue baie
- 🔴 Déclaration : **confirmer l'autorité** — commune de Schœlcher **ou CACEM** (la compétence taxe de séjour est souvent à l'agglomération). Déclarer auprès de la bonne entité → n°.
- 🟠 N° annonces · 🟠 DPE · 🟡 Classement.
- 🟠 **Taxe de séjour** : confirmer en priorité si collectée/reversée par la **CACEM** (≠ commune) — voir `docs/taxe-sejour-note.md`.
- 🟡 Capacité max à renseigner (`_biens.js` ne la précise pas).

### 2.7 — Appartement Nogent-sur-Marne (94) · jardin + terrasse — CAS PARTICULIER
- 🔴 **Déclaration + n° d'enregistrement** via la téléprocédure de Nogent (commune avec procédure d'enregistrement).
- 🔴 **Plafond 120 nuits/an** : c'est la **résidence principale** de Vincent → location meublé de tourisme limitée à **120 nuits/an** (L.324-1-1). Au-delà : perte de l'exemption de changement d'usage + risque accru.
  - **Action** : tenir un **compteur de nuitées** (toutes plateformes confondues + direct) et bloquer au-delà de 120.
- 🟠 N° d'enregistrement sur **toutes** les annonces.
- 🟠 **DPE** : prioritaire ici (zone tendue IDF, encadrement plus strict).
- 🟡 **Encadrement des loyers IDF** : pertinent **uniquement** si le bien bascule en **location longue durée** (bail meublé/bail mobilité). En meublé de tourisme courte durée, c'est le plafond 120 nuits qui prime.
- 🟡 **Taxe de séjour Nogent** : applicable **seulement** en courte durée ; confirmer autorité (commune vs EPT Paris Est Marne & Bois). En bail longue durée → **pas de taxe de séjour**.
- 🟡 Capacité max à renseigner (`_biens.js` ne la précise pas).

---

## 3. Obligations transverses (tous biens)

| Obligation | Détail | Statut |
|---|---|---|
| **SIRET / immatriculation** | Activité de location meublée régulière = activité commerciale → immatriculation requise (guichet unique INPI). Conditionne CFE, micro-BIC, déclarations. | 🔴 (à voir avec expert-comptable) |
| **Régime fiscal micro-BIC** | Loi Le Meur : non classé = abattement **30 %** (plafond 15 000 €) ; classé = **50 %** (plafond 77 700 €). → arbitrer classement Atout France. | 🟡 |
| **CFE** | Cotisation foncière des entreprises due même sans local dédié dès activité régulière. | 🟠 |
| **Taxe de séjour — registre** | Tenir un état récapitulatif des nuitées (par bien, nb personnes, nb nuitées, montant collecté, exonérations) + conserver les justificatifs ; reverser selon périodicité locale. | 🟠 |
| **Double collecte taxe de séjour** | Airbnb/Booking collectent et reversent eux-mêmes → ne collecter en direct **que** sur les résas du site. Conserver les attestations de reversement OTA. | 🟠 |
| **DPE par bien** | Loi Le Meur — passoires thermiques interdites progressivement (G interdit, montée en charge). | 🟠 |
| **Enregistrement national généralisé (loi Le Meur)** | Téléprocédure d'enregistrement en déploiement 2025-2026 dans toutes les communes → s'enregistrer dès activation locale. | 🟡 surveiller |
| **Contrat de location saisonnière** | Utiliser le gabarit `docs/legal/contrat-location-meuble-tourisme.md` (à valider par avocat) avec le n° de déclaration de chaque bien. | 🟠 |
| **Assurance** | Vérifier couverture PNO/exploitation meublé de tourisme par bien. | 🟡 |

---

## 4. Plan d'action priorisé (ordre conseillé)

1. 🔴 **Trancher la commune de Villa Iguana** (Le Diamant vs Sainte-Luce) — bloque sa déclaration et sa taxe de séjour.
2. 🔴 **Déclarer les 7 biens en mairie** (Sainte-Luce, Le Diamant, Schœlcher/CACEM, Nogent) → obtenir les **n°** (risque 450 €/bien).
3. 🔴 **Nogent** : obtenir le n° d'enregistrement **+ mettre en place le compteur < 120 nuits/an**.
4. 🟠 **Afficher chaque n° sur le site + Airbnb + Booking** dès obtention (risque 12 500 €). *(Intégration technique : fiches biens + footer.)*
5. 🟠 **Clarifier l'autorité de taxe de séjour** par commune (Sainte-Luce, Le Diamant, Schœlcher→CACEM, Nogent→EPT) avant tout reversement.
6. 🟠 **DPE par bien** (priorité Nogent, zone tendue).
7. 🟡 **Arbitrer le classement Atout France** + le régime micro-BIC avec l'expert-comptable (gain fiscal significatif).
8. 🟡 **Immatriculation/SIRET + CFE** : cadrer avec l'expert-comptable.

> **Quand consulter un professionnel** : avocat droit immobilier (statut Nogent, changement d'usage) ; expert-comptable (SIRET, micro-BIC, classement, seuil LMP/LMNP, CFE) ; mairies/EPCI (taxe de séjour, n° de déclaration).
