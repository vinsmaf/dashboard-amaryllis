# Booking.com — récupération auto nom + prix (scraper local)

Booking ne transmet **ni nom ni prix** par iCal ni par email (le mail « Nouvelle réservation »
ne contient qu'un n° de résa + un lien extranet). Seule la **fiche extranet** porte ces données.
Pas de Beds24 hors Nogent (décision Vincent). → On lit l'extranet dans **ta session connectée**,
sur **ton Mac** (aucun cloud ne peut s'authentifier : login + 2FA + anti-bot + token `ses=`).

## Pipeline

```
Nouvelle résa Booking  →  arrive déjà via iCal dans le Sheet (bien + dates, SANS nom/prix = ligne "à compléter")
     └─→ scripts/booking-sync.mjs (TA session, profil Playwright persistant)
           └─→ ouvre la fiche extranet de la résa  →  lit nom + dates + NET (total − commission)
                 └─→ enrichReservation_ (GAS, NON destructif, ±1 j de tolérance)  →  ligne complétée
                       └─→ si session expirée / parse KO  →  ntfy "à re-loguer / saisir à la main"
```

Réutilise **tout** l'aval déjà construit et testé pour Airbnb : `enrichReservation_`, la détection
« à compléter », la sync iCal. Nouveau : juste le parseur (`src/utils/parseBookingReservation.js`,
19 tests) + ce script local.

## Convention montant

`montant = Montant total − Commission et frais` (= le **virement net** que Booking te fait).
Ex. NINA GRUBO : 830,68 − 134,20 = **696,48 €**.

## Setup (1 fois)

```bash
# 1) Se connecter à l'extranet UNE fois (ouvre un navigateur ; email + mot de passe + 2FA — toi seul) :
node scripts/booking-sync.mjs --login
#    → quand ton tableau de bord Booking s'affiche, reviens au terminal et appuie sur Entrée.
#    La session est mémorisée dans ~/.amaryllis-booking-profile (re-login quand elle expire).
```

## Usage

```bash
# Enrichir une (ou plusieurs) réservation(s) — format res_id:hotel_id :
node scripts/booking-sync.mjs 6191917019:9438450

# Debug (voir le navigateur) :
HEADED=1 node scripts/booking-sync.mjs 6191917019:9438450
```

Codes de sortie : `0` OK · `2` session expirée (ntfy envoyé, refaire `--login`) · `1` erreur.

hotel_id connus : Zandoli `9438450` · Nogent `8741457` · Amaryllis `8227852` (les autres se lisent
dans l'URL extranet de chaque bien ; le parseur mappe aussi par nom d'établissement).

## Reste à brancher (déclenchement automatique)

Aujourd'hui le script prend les `res_id:hotel_id` en argument. Pour l'auto :
1. **Source des res_id** : capter le `res_id` du mail Booking « Nouvelle réservation » (déjà dans
   le lien extranet) OU matcher les lignes « à compléter » (bien+dates) à la liste extranet.
2. **Déclencheur** : le Worker pousse un ntfy quand l'iCal crée une ligne Booking incomplète → un
   petit agent local lance `booking-sync.mjs` (ntfy n'ouvre Booking **que** sur une vraie résa).
3. **Planif** : `launchd` (Mac forcé allumé) en filet de sécurité.

## Limites assumées (Vincent OK)

- Session Booking **fragile** : expire souvent → re-login manuel (ntfy prévient).
- **Anti-bot / CGU** : zone grise, mais ce sont **tes** données, à la demande, dans ta session.
- Fragile aux changements d'UI Booking → le parseur a 19 tests calés sur le format réel 06/2026.
