# Configuration du webhook Stripe

Ce webhook confirme automatiquement la réservation Beds24 dès qu'un paiement Stripe réussit — même si le client a fermé l'onglet avant d'être redirigé vers `/merci`.

## 1. Créer le webhook dans le dashboard Stripe

1. Aller sur [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquer **+ Add endpoint**
3. **URL** : `https://villamaryllis.com/api/stripe-webhook`
4. **Events to listen** : sélectionner `payment_intent.succeeded`
   - Note : `checkout.session.completed` est déjà géré pour les cautions (si tu utilises les deux, coche les deux)
5. Cliquer **Add endpoint**

## 2. Copier le Signing secret

Après création, Stripe affiche un **Signing secret** commençant par `whsec_...`.

Copier cette valeur.

## 3. Ajouter la variable dans Cloudflare Pages

1. Aller sur [dash.cloudflare.com](https://dash.cloudflare.com) → ton projet Pages
2. **Settings** → **Environment variables**
3. Ajouter la variable :
   - Nom : `STRIPE_WEBHOOK_SECRET`
   - Valeur : `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Sauvegarder et **redéployer** (un nouveau deploy est nécessaire pour que la variable soit prise en compte)

## 4. Tester en local

```bash
# Installer la CLI Stripe si besoin
brew install stripe/stripe-cli/stripe

# Écouter les webhooks et les forwarder vers le dev local
stripe listen --forward-to localhost:8788/api/stripe-webhook

# Dans un autre terminal, déclencher un event test
stripe trigger payment_intent.succeeded
```

La CLI affiche le `STRIPE_WEBHOOK_SECRET` temporaire pour les tests locaux — l'ajouter dans `.dev.vars`.

## Fonctionnement technique

- L'événement `payment_intent.succeeded` est reçu par `/api/stripe-webhook`
- La signature HMAC-SHA256 est vérifiée avec `STRIPE_WEBHOOK_SECRET`
- Le `bookingId` Beds24 est lu depuis `event.data.object.metadata.bookingId`
- Un `PATCH https://beds24.com/api/v2/bookings` est envoyé pour passer le booking en `status: "confirmed"`
- En cas d'erreur Beds24, le webhook retourne quand même `200` pour éviter les retries Stripe (l'erreur est loguée dans Cloudflare)

## Flux complet de réservation

```
Client remplit le formulaire
  → POST /api/beds24-create  → booking créé en status "new"
  → POST /api/create-payment-intent  → PaymentIntent avec metadata.bookingId
  → Stripe Elements (paiement)
  → Si succès immédiat : confirmBeds24() côté front (redondant mais rapide)
  → Stripe envoie payment_intent.succeeded au webhook (garanti même si onglet fermé)
  → Webhook confirme Beds24 via PATCH
```
