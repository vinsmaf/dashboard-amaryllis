# Paiement en 2 fois (acompte + solde) — OPTIONNEL — design validé

> **Statut : validé par Vincent le 2026-06-11, à exécuter en session suivante.**
> Argent réel (Stripe LIVE) → tester en mode TEST avant LIVE. Présenter le plan
> d'implémentation (writing-plans) avant de coder la moindre charge.

## Exigence clé (Vincent, 2026-06-11)
- **Optionnel et PROPOSÉ au client, jamais imposé.** Par défaut = paiement total.
- **Ne touche PAS** au système d'acompte des devis (admin-set, existant) — c'est un
  flux distinct, côté résa directe publique.

## UX (au récap de réservation, avant paiement)
> Comment souhaitez-vous payer ?
> ⚪ La totalité maintenant — {total} € *(coché par défaut)*
> ⚪ En 2 fois — {30%} aujourd'hui, puis {70%} le {date arrivée −30j}

Le client choisit. Si non choisi → comportement actuel inchangé.

## Conditions d'apparition de l'option (sinon masquée)
- Total ≥ **800 €** (inutile sur petit séjour)
- Arrivée à **> 35 jours** (sinon pas le temps de débiter le solde à J-30)

## Technique (Stripe LIVE)
1. Acompte 30 % débité maintenant + **carte enregistrée** (`setup_future_usage:
   'off_session'`, conforme SCA).
2. Échéance stockée en D1 → **nouvelle table `payment_schedule`** :
   `booking_id, payment_intent_id (acompte), customer_id, payment_method_id,
   solde_amount, due_date (= checkin −30j), status (pending|paid|failed), created_at`.
3. **Cron quotidien** (cron-job.org ou Worker) → SELECT soldes dus
   (`due_date <= today AND status='pending'`) → crée un PaymentIntent off-session
   avec le PM enregistré → `status='paid'`.
4. Échec de débit (SCA/3DS/carte expirée) → `status='failed'` + email client (lien
   pour mettre à jour la carte / repayer) + alerte ntfy à Vincent.
5. **Caution = inchangée** (pré-autorisation séparée comme aujourd'hui).

## Garde-fous
- Tests Vitest : calcul acompte/solde (arrondis), date due, conditions d'éligibilité.
- **Mode Stripe TEST de bout en bout avant LIVE.**
- Rollback simple : un flag masque l'option (ex. `PAY_2X_ENABLED`).
- Politique d'annulation existante protège déjà (acompte non remboursable <7j).

## Fichiers concernés (à confirmer au plan)
- `functions/api/create-payment-intent.js` (acompte + setup_future_usage)
- nouveau `functions/api/charge-balance.js` (cron, off-session)
- nouveau migration D1 `payment_schedule`
- `src/PublicSite.jsx` (choix UX dans le récap résa / handleBook)
- cron-job.org (nouvel item) ou Worker
- email template « solde débité » / « échec paiement solde »

## Coût
- Aucun frais supplémentaire vs aujourd'hui (carte ~1,5 %, juste réparti sur 2 débits).
- Klarna écarté : surcharge interdite par les CGV Klarna + réglementation EU ;
  absorber le frais BNPL ne convient pas à Vincent (regardant sur le coût).
