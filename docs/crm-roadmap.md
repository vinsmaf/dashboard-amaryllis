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

### Phase 0 — Quick wins (fait / en cours)
- [x] Vue segments dans l'onglet CRM (2026-06-23).
- [ ] **Nettoyer `contacts`** : marquer les 8 test/spam (`status='ignore'`). 1 vrai lead → suivi manuel.
- [x] Décision : ne PAS blaster DIRECT10 (cible = adresses bidon).

### Phase 1 — Réactivation saisonnière (Must — RM-10/RM-19) · **build juillet-août**
> ⏰ La relance haute saison déc-avr part **dès septembre** (T-6/8 sem). Donc construire en juillet-août.
- Cron `runCrmLifecycle` (segmente + déclenche, mode `dry` d'abord).
- Séquence **"Accès prioritaire anciens"** : nominatif, tarif fidélité direct, avant ouverture publique. Cible : diaspora + locaux.
- Séquence **win-back dormants** (12–24 mois) : offre de retour.
- Templates : `fidelite-acces.html`, `winback.html`.

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
