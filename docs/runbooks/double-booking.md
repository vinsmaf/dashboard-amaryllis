# Runbook — Double-booking (chevauchement de réservations)

> Deux réservations se chevauchent sur le même bien. Source de détection automatique :
> **`functions/api/coherence-check.js` Check 4** (`cross-canal-overlap`) — compare les résas directes D1
> aux événements iCal (Airbnb/Booking). Finding écrit dans l'inbox `client_errors` (kind `coherence`, onglet 🐞 Bugs)
> + **push ntfy** si critique (topic `amaryllis-alertes-7r4k9`). Cron quotidien dans le Worker.

## 1. Confirmer le conflit (5 min)
1. Ouvrir le finding (ntfy → onglet 🐞 Bugs, ou `GET /api/coherence-check?secret=POSTSTAY_SECRET&dry=1`).
2. Identifier les 2 résas : bien, dates exactes, **canal de chacune** (direct D1 / Airbnb / Booking) et l'antériorité (qui a réservé en premier).
3. Vérifier que ce n'est pas un faux positif : même voyageur, dates adjacentes non chevauchantes, résa annulée non purgée.

## 2. Décider qui reste, qui bouge
Critères, dans l'ordre :
1. **Antériorité** : la résa la plus ancienne est prioritaire (équitable + défendable).
2. **Canal** : à antériorité proche, privilégier garder la **résa directe** (pas de commission, relation client) — mais ne jamais léser un voyageur OTA qui a réservé en premier (impact note/SuperHost).
3. **Faisabilité du relogement** : peut-on déplacer l'un vers un **autre bien équivalent libre** sur les mêmes dates ? (Sainte-Luce : Amaryllis/Zandoli/Géko/Mabouya souvent interchangeables par capacité.)

## 3. Reloger / résoudre
- **Relogement interne** (idéal) : proposer un bien équivalent ou supérieur sur les mêmes dates. Surclassement offert = meilleur geste commercial, garde le CA.
- **Pas de bien interne** : aider à trouver une alternative + geste commercial / remboursement.
- Toujours WhatsApp (+33 6 10 88 07 72) + écrit (email récap) pour la traçabilité.

## 4. Geste commercial / compensation (barème indicatif — à valider Vincent)
> Brouillon, à ajuster selon la situation. Ne pas appliquer en aveugle.
- Relogement équivalent même prix : pas de compensation, surclassement si possible.
- Relogement inférieur / désagrément : remboursement de la différence + ~10-15 % de geste.
- Aucune solution (voyageur doit se reloger ailleurs) : **remboursement intégral** + geste (nuit offerte sur séjour futur / bon).

## 5. Remboursement Stripe (LIVE — argent réel)
- Résa directe → Stripe Dashboard ou `manage-deposit` / refund sur le PaymentIntent. **Vérifier le montant 2×.**
- Caution pré-autorisée → annuler la pré-autorisation (`manage-deposit` action `cancel`).
- Résa OTA → le remboursement passe par la plateforme (Airbnb/Booking), pas par Stripe.

## 6. Clôturer
1. Bloquer/aligner les calendriers pour que le conflit ne se reproduise pas (override + resync iCal).
2. Marquer le finding `coherence` résolu dans l'inbox 🐞 Bugs.
3. Si cause systémique (lag iCal, sync manquante) → noter dans `docs/ERREURS-LOG.md`.

## Prévention
- Le cron coherence-check tourne tous les jours — ne pas ignorer une alerte ntfy `cross-canal-overlap`.
- Délai de sync iCal Airbnb/Booking ≈ quelques heures : une résa directe prise sur un créneau « libre » côté iCal mais déjà vendu OTA est le scénario classique → confirmer la dispo temps réel avant d'encaisser un direct sur dates serrées.
