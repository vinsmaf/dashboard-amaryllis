# Runbooks de crise — Amaryllis Locations

> Fiches d'intervention opérationnelle. Une crise = on ouvre la fiche, on suit les étapes dans l'ordre.
> Objectif : ne pas réfléchir à froid pendant l'incident. Tout le contexte est ici.
> (RM-26 du playbook locatif. Source de vérité de la résolution double-booking = `functions/api/coherence-check.js`.)

## Index

| Fiche | Quand l'ouvrir |
|---|---|
| [cyclone.md](cyclone.md) | Alerte météo (vigilance orange/rouge), passage cyclonique — inclut le tier **crise corrélée Sainte-Luce** (plusieurs biens touchés en même temps) |
| [double-booking.md](double-booking.md) | Deux résas se chevauchent sur le même bien (alerte `coherence-check` ntfy, ou repéré à la main) |
| [no-show.md](no-show.md) | Un voyageur ne se présente pas / injoignable le jour d'arrivée |
| [stripe-down.md](stripe-down.md) | Paiement direct impossible (Stripe en panne, webhook muet, caution bloquée) |

## Réflexes communs à toute crise

1. **Canal voyageur** : WhatsApp Business **+33 6 10 88 07 72** (prioritaire), sinon Airbnb/Booking messaging, sinon contact@villamaryllis.com. SLA en `docs/sla-reponse.md`.
2. **Alertes système** : push **ntfy** topic `amaryllis-alertes-7r4k9` (le Worker + coherence-check y poussent les incidents).
3. **Contact terrain** : Nogent → **Nesrine** (La Fine Conciergerie, +33 6 06 44 92 06). Martinique → prestataires ménage/technique (voir cyclone.md).
4. **Argent** : Stripe est en mode **LIVE** — tout remboursement/capture est réel. Vérifier 2× avant d'exécuter.
5. **Périmètre Beds24** : Nogent **uniquement** (propId 158192). Jamais de manip Beds24 sur un bien Martinique.

> Mettre à jour une fiche dès qu'un incident révèle une étape manquante (« on documente pour ne pas y revenir »).
