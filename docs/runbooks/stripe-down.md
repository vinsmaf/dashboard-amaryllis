# Runbook — Stripe / paiement direct indisponible

> Le paiement de réservation directe ne fonctionne plus : Stripe en panne, PaymentIntent en échec,
> webhook muet, ou caution impossible. Impact : on perd des résas directes (le canal le plus rentable).

## 1. Diagnostiquer (où ça casse ?)
1. **Statut Stripe** : vérifier status.stripe.com (panne globale ?).
2. **Côté création** : `/api/create-payment-intent` répond-il ? (tester un parcours résa en preview / regarder les logs Functions).
3. **Côté confirmation** : le webhook `/api/stripe-webhook` reçoit-il les events ? Symptôme = paiement débité mais résa **non enregistrée** en D1 (`direct_bookings`) et hôte non notifié.
4. **Caution** : `create-deposit-intent` / `caution-checkout` répondent-ils ?

## 2. Si panne Stripe globale
- Rien à corriger côté code. **Basculer temporairement les voyageurs en attente** vers : virement / lien de paiement alternatif, ou réserver le créneau manuellement et encaisser dès le rétablissement.
- Message voyageur clair (WhatsApp) : « petit souci technique de paiement, on vous tient le créneau, on revient vers vous sous peu » — ne pas perdre la résa.
- Ne pas confirmer une résa comme payée tant que l'encaissement n'est pas réel.

## 3. Si webhook muet (paiement OK mais résa fantôme)
> Cas le plus dangereux : l'argent est pris, le système ne le sait pas.
1. Repérer les PaymentIntent `succeeded` côté Stripe **sans** ligne correspondante dans `direct_bookings` (D1).
2. Pour chacun : enregistrer la résa manuellement (ou rejouer le webhook depuis le Dashboard Stripe : *Developers → Webhooks → resend*), vérifier que l'hôte est notifié et le calendrier bloqué.
3. **Invariant à préserver** (cf. CLAUDE.md) : la valeur de conversion remontée = **total** de la résa, comptée **une seule fois** (jamais l'acompte). Ne pas double-compter en rejouant.

## 4. Vérifier le calendrier / double-booking
- Une résa payée mais non enregistrée = créneau qui apparaît **libre** → risque de double-booking. Après récupération, vérifier qu'aucune autre résa n'a été prise entre-temps (voir [double-booking.md](double-booking.md)).

## 5. Clôturer
- Confirmer chaque résa orpheline récupérée (D1 + notif hôte + calendrier).
- Noter l'incident dans `docs/ERREURS-LOG.md` (cause + fenêtre de panne + résas impactées).

## Garde-fous
- Stripe est en mode **LIVE** : ne jamais « tester » un remboursement/capture pour debuguer en prod.
- Ne jamais exposer/committer la `STRIPE_SECRET_KEY` (secret Cloudflare).
