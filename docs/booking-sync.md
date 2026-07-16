# Booking.com — récupération auto nom + prix

> Mis à jour 2026-07-16 (audit) — ce doc décrivait un pipeline local Playwright qui n'est plus
> le chemin actif en prod depuis le commit `18adc63` (2026-06-30, "feat: auto-import Booking.com
> sur détection iCal"). Voir « Historique » en bas pour l'ancien mécanisme (orphelin).

Booking ne transmet **ni nom ni prix** par iCal ni par email (le mail « Nouvelle réservation »
ne contient qu'un n° de résa + un lien extranet). Seule la **fiche extranet** porte ces données.
Pas de Beds24 hors Nogent (décision Vincent) — jamais de Beds24 pour Booking.com.

## Pipeline actuel (automatique, serveur)

```
Nouvelle résa Booking détectée dans l'iCal (cron Worker, toutes les 10 min)
  └─→ autoImportNewBookings() (workers/ical-sync/index.js)
        └─→ scrapeBookingDetails() : GET admin.booking.com (session ses= stockée en D1,
            timeout 12s) → parseBookingAdminHtml() extrait nom + prix + bookingId
              └─→ upsertBookingReservation() : écrit direct_bookings (D1), id
                  "booking.com-<bookingId>" (ou "booking.com-ical-<uid>" si pas encore scrapé)
                    └─→ pushToSheets() (même cycle) → Sheet "Toutes les Réservations"
```

Si la session `ses=` est expirée/absente : la résa est quand même créée (nom="Voyageur Booking",
montant=0€) et une alerte ntfy urgente prévient qu'il faut rafraîchir le token. Le prochain cycle
`*/10 * * * *` retentera automatiquement — pas besoin d'intervention manuelle pour relancer le
scrape, seulement pour renouveler le token si besoin.

## Rafraîchir le token de session (bookmarklet)

Le token `ses=` n'est jamais vérifié proactivement contre son vrai TTL — seulement découvert
expiré réactivement (401/403/redirect signin) au moment d'un scrape. `GET /api/booking-session`
donne un indicateur (`valid`, `days_since`) basé sur la dernière fois qu'il a été enregistré, pas
sur un test réel de validité.

```
1. Ouvrir admin.booking.com (être connecté)
2. Copier le token ses=XXXX depuis l'URL
3. POST /api/booking-session?secret=<POSTSTAY_SECRET>  { "ses": "XXXX" }
```

Stocké en D1 `app_config` (clé `booking_ses`). `hotel_id` connus : Zandoli `9438450` ·
Nogent `8741457` · Amaryllis `8227852` (les autres se lisent dans l'URL extranet de chaque bien).

## Convention montant

`montant = Montant total − Commission et frais` (= le **virement net** que Booking te fait).

## Historique — ancien pipeline local (orphelin, non branché en prod)

Avant le 2026-06-30, l'enrichissement passait par un script Playwright local
(`scripts/booking-sync.mjs` + `src/utils/parseBookingReservation.js`, 19 tests), déclenché
manuellement (`node scripts/booking-sync.mjs <res_id>:<hotel_id>`), lisant la session Booking
directement sur le Mac de Vincent (profil persistant `~/.amaryllis-booking-profile`). Ce script
existe toujours dans le repo mais n'est plus référencé par le chemin critique — gardé pour
référence/dépannage si le scrape serveur venait à casser durablement (anti-bot Booking renforcé,
etc.), pas pour un usage courant.
