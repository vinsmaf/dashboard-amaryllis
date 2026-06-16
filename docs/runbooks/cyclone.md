# Runbook — Cyclone / alerte météo majeure

> Saison cyclonique Antilles : **juin → novembre**. Déclencheur : vigilance orange/rouge Météo-France Martinique.
> Particularité Amaryllis : forte **concentration géographique Sainte-Luce** → un seul système peut toucher
> plusieurs biens à la fois (voir tier « crise corrélée » en bas).

## 0. Pré-saison (à faire une fois, en mai)
- [ ] Vérifier les contacts prestataires Martinique (technicien, piscine, jardinage) à jour.
- [ ] Confirmer le backup opérateur terrain Martinique (cf. `docs/sla-reponse.md`).
- [ ] Kit sécurité par bien : volets/anti-cyclonique OK, coupures eau/élec connues, point de rassemblement.

## 1. Vigilance jaune/orange annoncée (J-3 à J-1)
1. Lister les **séjours en cours + arrivées sous 72h** (admin → Planning, ou iCal/Beds24).
2. Message proactif aux voyageurs concernés (WhatsApp +33 6 10 88 07 72) : consignes sécurité, contact d'urgence, position des volets/kit.
3. Vérifier les arrivées : décaler / proposer report si l'aéroport (FDF) ferme. Pas d'annulation unilatérale tant que la vigilance n'est pas rouge.

## 2. Vigilance rouge / passage (J0)
1. **Sécurité d'abord** : consigne de confinement aux voyageurs en place, couper si nécessaire (eau/gaz). Ne demander à personne de se déplacer.
2. Suspendre les ménages/rotations et les arrivées tant que la vigilance est rouge.
3. Centraliser les retours terrain des prestataires sur l'état de chaque bien.

## 3. Après le passage
1. **État des lieux par bien** (prestataire ou sur place) : structure, eau/élec, piscine, accès route. Photos horodatées.
2. Pour chaque bien **non habitable** : bloquer les dates impactées (override RM `rm-overrides` / blocage calendrier + iCal), prévenir les arrivées, proposer report ou remboursement (voir double-booking.md §remboursement pour le geste Stripe).
3. Déclencher les réparations prioritaires. Consigner coûts.

## TIER — Crise corrélée Sainte-Luce (RM-26 #2)
> Si **plusieurs biens Sainte-Luce** sont touchés simultanément (cas le plus probable vu la concentration).

- **Biens corrélés (réservables)** : Amaryllis, Zandoli, Géko, Mabouya (+ Schœlcher selon localisation). **Iguana = hors scope CA** (bail long Joël Bailleul) mais à inspecter physiquement quand même.
- **Communication de masse** : un seul message gabarit, personnalisé par bien, envoyé à TOUS les voyageurs en cours + arrivées proches (ne pas traiter bien par bien à froid).
- **Prestataires groupés** : mobiliser technicien/piscine en **tournée multi-biens** (tous à <15 min les uns des autres) plutôt qu'en appels séparés — gagner du temps sur la remise en état.
- **Priorisation** : remettre en service d'abord le bien à plus forte valeur / prochaine arrivée la plus proche.
- **Suivi** : tableau « bien · état · habitable O/N · arrivée suivante · action » tenu à jour jusqu'à retour normal.

## Garde-fous
- Beds24 = Nogent uniquement (Nogent n'est pas concerné par les cyclones Antilles).
- Remboursements Stripe = LIVE, vérifier le montant avant capture/refund.
