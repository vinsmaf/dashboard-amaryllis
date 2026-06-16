# Runbook — No-show (voyageur absent / injoignable à l'arrivée)

> Le voyageur ne se présente pas le jour du check-in et/ou est injoignable.

## 1. Le jour J, avant de conclure au no-show
1. Vérifier l'heure d'arrivée prévue + le message pré-arrivée (envoyé J-3 par `send-prearrivee` pour les directes).
2. Relancer sur **tous les canaux** : WhatsApp (+33 6 10 88 07 72), SMS, email, + canal OTA si résa Airbnb/Booking.
3. Vérifier un éventuel retard de transport (vol FDF retardé, correspondance) avant de déclencher la procédure.

## 2. Confirmer le no-show (fin de journée J)
- Toujours pas de contact ni de présence après plusieurs relances espacées → no-show acté.
- **Tracer par écrit** (horodaté) chaque tentative de contact : indispensable en cas de litige / réclamation plateforme.

## 3. Conséquences selon le canal
- **Résa directe (Stripe)** : le séjour a été payé → pas de remboursement automatique d'un no-show (selon CGV). Décider d'un éventuel geste si motif légitime (hospitalisation, deuil…). Caution pré-autorisée → annuler (`manage-deposit` cancel) si rien à retenir.
- **Airbnb / Booking** : appliquer la politique d'annulation de la plateforme ; déclarer le no-show côté plateforme dans les délais pour préserver le paiement et la note.

## 4. Libérer / revaloriser les nuits
- Si le voyageur confirme renoncer (ou délai dépassé) : remettre les nuits en vente (débloquer calendrier + resync iCal). Le yield/gap pricing du Worker reprendra automatiquement sur les dates libérées.
- Prévenir le ménage/terrain que l'arrivée est annulée (éviter une rotation inutile).

## 5. Clôturer
- Noter l'issue (no-show confirmé / retard résolu / geste accordé) pour l'historique voyageur.
- Si pattern (no-shows répétés sur un canal) → remonter en réflexion pricing/CGV (acompte plus ferme).

## Garde-fous
- Ne jamais conclure au no-show sans avoir épuisé les relances + laissé une marge pour les aléas de transport.
- Stripe LIVE : toute retenue/remboursement est réel et doit être justifiable par écrit.
