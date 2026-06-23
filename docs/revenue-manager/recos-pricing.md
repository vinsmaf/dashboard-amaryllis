# Recommandations Revenue Manager — Pricing 2026
> Source : données réelles REVENUS_CANAL_2025 + SAISONNALITE (App.jsx) · Advisory only — Vincent applique.
> Agents : rev-036 (saisonnalité) · rev-037 (early booking) · rev-038 (canal) · rev-041 (long séjour)

---

## rev-036 — Analyse saisonnalité & ajustements prix recommandés

### Lecture des données (occupation mensuelle moyenne 2023-2025)

| Bien | Jan | Fév | Mar | Avr | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Amaryllis | 82% | 80% | 65% | 75% | 40% | **30%** | 45% | 60% | **30%** | 45% | **30%** | 55% |
| Zandoli | 60% | 80% | 55% | 70% | 40% | **30%** | 50% | 60% | **30%** | 50% | 45% | 55% |
| Géko | 40% | 75% | 55% | 50% | 45% | 35% | 50% | 50% | **30%** | 45% | 55% | 40% |
| Mabouya | 55% | 75% | 40% | 50% | **15%** | 25% | 40% | 50% | **30%** | 40% | 40% | 45% |
| Schœlcher | 55% | 65% | 75% | 55% | 40% | 40% | 40% | 55% | **30%** | 40% | 50% | 55% |
| Nogent | 70% | 75% | 68% | 75% | 75% | 70% | 75% | 65% | 70% | 72% | 68% | 72% |

### Recommandations tarifaires par période

**🔴 Creux profonds (juin, septembre) — Martinique**
- Occ < 35% : baisser les prix de 15-25% vs prix de base
- Activer le minimum de nuits à 2 (au lieu de 3-4) pour maximiser le remplissage
- Amaryllis juin : 280€ → **210-230€** · Zandoli : 110€ → **85-90€**

**🟡 Basse saison modérée (mai, novembre)**
- Occ 30-45% : baisser 10% vs prix de base, maintenir le minimum de nuits
- Proposer des forfaits semaine attractifs

**🟢 Haute saison (jan-fév, juillet-août)**
- Occ 65-82% : prix de base ou +10-15%
- Amaryllis janvier : jusqu'à **310-320€**
- Bloquer les arrivées < 3 nuits en haute saison (minimise les trous)

**Nogent : saisonnalité très stable (65-75% toute l'année)**
- Prix constant conseillé, légère hausse juillet (+5-8%) pour coïncider avec vacances scolaires

---

## rev-037 — Stratégie Early Booking (réservations 30-60j à l'avance)

### Constat
Le tunnel direct actuel ne différencie pas les réservations selon le lead time.
Or les early bookers ont une disposition à payer plus élevée ET sécurisent le calendrier.

### Recommandations

**Règle RM suggérée : Early Bird +5% (31-60j) / Standard (0-30j)**
- Réservation > 60j à l'avance : **prix affiché = prix de base** (pas de remise — ils paieraient de toute façon)
- Réservation 31-60j : **prix affiché = prix de base** (idem)
- Réservation 8-30j : **prix de base** (fenêtre standard)
- Réservation < 7j : **prix de base -10%** (last-minute pour remplir les trous)

**Alternative plus simple : last-minute seulement**
- Pas de surcharge early bird (risque de décourager)
- Uniquement remise last-minute < 5j : -10 à -15% (activable manuellement depuis l'onglet RM)

**Priorité : implémenter la remise last-minute dans rm-overrides pour les dates non réservées à J-5.**

---

## rev-038 — Analyse performance par canal (données 2025)

### Répartition des revenus par canal

| Bien | Airbnb | Booking | Direct | Total | % Direct |
|---|---|---|---|---|---|
| Amaryllis | 9 447€ (25%) | 14 989€ (39%) | 13 565€ (36%) | 38 001€ | ⭐ 36% |
| Iguana | — | — | 23 600€ (100%) | 23 600€ | ⭐⭐ 100% |
| Zandoli | 3 333€ (10%) | 8 242€ (25%) | **21 701€ (65%)** | 33 276€ | ⭐⭐ 65% |
| Géko | 10 839€ (54%) | 3 858€ (19%) | 5 324€ (27%) | 20 021€ | 27% |
| Mabouya | 2 075€ (25%) | 3 615€ (43%) | 2 760€ (33%) | 8 450€ | 33% |
| Schœlcher | 4 746€ (37%) | 5 914€ (47%) | 2 020€ (16%) | 12 680€ | ⚠️ 16% |
| Nogent | 3 822€ (15%) | 20 008€ (79%) | 153€ (1%) | 25 303€ | ⚠️ 1% |

### Analyse

**🔴 Nogent : quasi-exclusivement Booking.com (79%)**
- Commission Booking ~18% = ~3 600€ perdus en commissions sur 20 000€
- Potentiel de direct très sous-exploité (153€ seulement en 2025)
- Levier : Nesrine à former sur l'envoi du lien de réservation directe + widget Beds24 → villamaryllis.com/nogent

**🔴 Schœlcher : direct très faible (16%)**
- Aucun effort marketing spécifique sur ce bien
- Levier : fiche Google Business Profile Schœlcher + photos Instagram dédiées

**🟢 Zandoli & Iguana : champions du direct**
- Modèle à répliquer : ces voyageurs reviennent et réservent directement
- Programme fidélisation prioritaire sur ces 2 biens

**💰 Estimation économie commissions si Nogent passe à 30% direct :**
- ~6 000€ de direct (vs 153€) = +5 800€ net (commissions économisées ~900€)

---

## rev-041 — Optimisation prix séjours longue durée (7j+)

### Constat
Pas de remise automatique sur les séjours longs dans le tunnel actuel (remises manuelles uniquement dans `src/utils/pricing.js`).

### Tarifs longs séjours recommandés

| Durée | Remise conseillée | Exemple Amaryllis (280€/nuit) |
|---|---|---|
| 7-13 nuits | -10% | 252€/nuit → 1 764€/semaine |
| 14-27 nuits | -15% | 238€/nuit → 3 332€/2 semaines |
| 28+ nuits | -20% à -25% | 210-224€/nuit (quasi-bail) |

### Implémentation suggérée
Le système `pricing.js` a déjà `REMISES_DUREE` — vérifier les seuils actuels et ajuster si besoin.
Pour les séjours 28j+ : contact direct recommandé (devis personnalisé, pas de tunnel automatique).

### Biens les plus concernés
- **Amaryllis** : fort potentiel familles 2 semaines en haute saison
- **Zandoli** : séjours longue durée déjà fréquents (clientèle fidèle)
- **Nogent** : séjours professionnels 1-4 semaines (clientèle B2B Ary Augustin type)
