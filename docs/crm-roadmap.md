# Roadmap CRM — Amaryllis Locations

> Établie le 2026-06-23. KPI Nord (RM-10) : **% de nuitées issues de clients répétés** (croissant chaque trimestre).
> RM = advisory : **tout barème/tarif (remise, nuit créditée) est soumis à Vincent avant activation.**

## État des lieux (ce qui existe déjà)

- **Base clients** D1 `crm_clients` (95) avec `ltv_total`, `nb_sejours`, `premier_sejour`, `dernier_sejour`, `is_recurrent`, `canal_principal`, `biens`, `tags`.
- **Onglet admin CRM** (`src/tabs/CrmTab.jsx`) : recherche, tags, notes, KPIs, **+ barre de segments cliquables** (ajoutée 2026-06-23).
- **Inbox leads** `contacts` — ⚠️ 8/9 sont du test/spam au 2026-06-23 (1 vrai : Isabelle Hartock). À nettoyer.
- **Infra envoi** : `send-bulk-email`, `send-custom-email`, `send-leads-promo` (DIRECT10) + 17 templates `public/email-templates/`.
- **Automations transactionnelles** : pré-arrivée J-3, post-séjour J+1/J+3, relance panier.
- **Worker** ~25 crons (point de greffe pour `runCrmLifecycle`).
- **Agent fleet** `crm-manager` (advisory, prépare les contenus).

## Segmentation (RFM-light, calculée client-side)

| Segment | Critère | Usage |
|---|---|---|
| Récents (<6 mois) | `dernier_sejour` < 6 mois | fidéliser |
| Dormants (6–24 mois) | `dernier_sejour` 6–24 mois | **réactiver** |
| Perdus (>24 mois) | `dernier_sejour` > 24 mois | win-back |
| VIP / LTV ≥3k€ | `tags vip` OU `ltv_total ≥ 3000` | prioritaire (humain) |
| Sans contact | ni email ni mobile | enrichir au check-in |

## Phases

### Phase 0 — Quick wins ✅ (2026-06-23)
- [x] Vue segments dans l'onglet CRM.
- [x] Nettoyé `contacts` : 8 test/spam → `status='archivé'` (CHECK constraint : statut ∈ nouveau/répondu/archivé). Reste 1 vrai lead (Isabelle Hartock) → suivi manuel.
- [x] Décision : promo DIRECT10 NON lancée (cible = adresses bidon).

### Phase 1 — Réactivation (Must — RM-10/RM-19) · **moteur construit 2026-06-23**
- [x] **Endpoint `functions/api/crm-lifecycle.js`** : `GET ?secret&segment=winback|fidelite[&dry=1]`.
  - `winback` : dormants/perdus (dernier_sejour 6–36 mois).
  - `fidelite` : accès prioritaire saisonnier à tous les anciens (`nb_sejours ≥ 1`).
  - Anti-doublon : table D1 `crm_campaigns` (1 client ≠ recontacté 2× / campagne).
  - Secret **fail-closed**. **Aucune remise codée** (argument = direct sans frais d'agence ; barème fidélité = manuel Vincent).
- [ ] **Déclenchement** : manuel pour l'instant (`dry=1` d'abord). ⏰ La campagne `fidelite` part **dès septembre** (T-6/8 sem avant haute saison déc-avr) → greffer un cron Worker `runCrmLifecycle` à ce moment, ou déclencher à la main.
- [ ] Affiner les copies par segment + A/B sujet si volume suffisant.

### Phase 2 — Échelle de fidélité multi-biens (Should — RM-19)
- Cross-sell montée en gamme : Mabouya 2p → Géko 4p → Amaryllis 8p (selon `biens` + capacité).
- Relance **anniversaire de séjour** (1 an après `dernier_sejour`).

### Phase 3 — Parrainage diaspora (Could — RM-11)
- Promoteurs (avis 5★ OU `nb_sejours ≥ 2`) → lien nominatif tracé.
- Barème : nuit créditée parrain / -10% filleul (< commission OTA évitée).
- Infra : table D1 `referrals` + code unique + crédit Stripe. (Plus gros chantier.)

## Garde-fous
- Iguana exclu de toute mécanique (bookable:false) ; Nogent segmenté à part.
- Capture email+tél à 100% au check-in (OTA compris) = carburant de tout le CRM (RM-10).
- Chaque envoi de masse : `dry=1` d'abord, barème validé par Vincent.
