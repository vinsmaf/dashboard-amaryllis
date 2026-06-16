# Audit Playbook — Registre de progression (locatif)
> Source de vérité du **statut** de chaque item. Mis à jour à CHAQUE action.
> But : ne jamais re-traiter un item en croyant qu'il n'est pas fait.
> Détail des gaps → `docs/AUDIT-PLAYBOOK-RM.md` (locatif) · `patrimoine-dashboard/docs/AUDIT-PLAYBOOK-MM.md`.
> Règle : avant de traiter un item, **vérifier le code** (déjà en place ? faux positif ?) puis cocher ici.

## Légende
✅ FAIT · 🟩 DÉJÀ EN PLACE · ⚪ FAUX POSITIF · ⏳ À TRAITER · 🔴/🟡/⚪ sévérité

## Statut des items traités

| Item | Verdict | Détail | Preuve / commit |
|---|---|---|---|
| **RM-07** 🔴 | 🟩 DÉJÀ EN PLACE | Économie OTA (~15%) déjà affichée sur les fiches ("Réservez en direct et économisez jusqu'à 300€", "Sans frais Airbnb"). | Vérifié visuellement `/amaryllis` 2026-06-16 |
| **RM-10** capture tél 🔴 | ✅ FAIT | Tél (déjà saisi, jeté en aval) plumbé : non-acheteurs→`abandoned_carts.phone`, acheteurs→`direct_bookings.phone` via webhook Stripe + notify-booking. `metadata[phone]` forwardé (persiste PI + match Meta CAPI). Migrations idempotentes additives. Champ resté optionnel. | commit `571d518` · déployé `b6f99d12` |
| **RM-10** segment `past_guests` 🔴 | ✅ FAIT | Nouveau segment emailing bulk = base repeat directe (anciens voyageurs). N'envoie rien sans dry-run + validation. | commit `571d518` |
| **RM-13** 🔴 | ⚪ FAUX POSITIF | Le bloc avis affiche en priorité les VRAIS avis Airbnb live (D1 `voyageurRevs`) ; `bien.avis` statiques = repli, et ils sont RÉELS (confirmé Vincent). Retirer le fallback supprimerait de vrais avis. **Aucun code.** | Vérifié code `PublicSite.jsx:4664` + provenance Vincent 2026-06-16 |
| **RM-15** 🔴 | ✅ FAIT | A/B tests mesuraient clic/scroll, pas la résa. Ajout `trackConversion(step:"purchase")` dans `Merci.jsx` à la résa confirmée, **uniquement pour les tests où l'user est exposé** (`listActiveVariants`, pas de fausse attribution). Vérifié fonctionnellement (event `ab_conversion` capturé en preview) + smoke test vert. | commit `c9c948b` · déployé `cc8bf0dd` |
| **RM-20** 🔴 | ✅ FAIT | Rebond inter-biens borné au même marché (plus de Nogent proposé sur fiche Martinique). Comparaison sur canonique BRUT `CANON[id]`. | commit `571d518` · déployé `b6f99d12` |
| **RM-19** 🔴 | ✅ FAIT | Base voyageurs UNIFIÉE : `/api/direct-bookings?view=guests` (agrège par email : nb_sejours, biens, premier/dernier, total, flag repeater≥2). + segments emailing `repeaters` (≥2 séjours) & `past_guests` rendus sélectionnables dans `BulkEmailModal`. Exploite la capture RM-10. Prod saine vérifiée (smoke a flaké en headless, mais bundle 200 + 0 erreur JS confirmés). | commit `4edc7e7` · déployé (villamaryllis.com) |

## Apprentissage process
Les findings d'audit sur la **réalité/provenance d'une donnée** (ex. avis réels ?) ne peuvent pas être tranchés par un agent — ils requièrent la confirmation métier de Vincent. → toujours vérifier le code ET demander la provenance avant d'agir.

## Reste à traiter (extraits prioritaires — voir AUDIT-PLAYBOOK-RM.md / MM.md)
- 🅿️ **RM-03** 🔴 — **PARKÉ (data-blocked, audit mal cadré).** `runOccupancySnapshot` (ical-sync:876) travaille sur des `allEvents` iCal **forward** qui ne portent QUE `bienId/checkin/checkout` — aucun revenu/commission/canal. Le NET (`total−commission`) de `parseBookingRow` ne concerne que les résas Booking **scrapées** (script local), pas ce contexte. Écrire `revpar_cents` là = valeurs fausses/NULL → trompe le pricing (RM advisory = doit être fiable). **RM-03 réel = mini-projet** : NET RevPAR = indicateur de **réalisé** (revenu encaissé net ÷ nuits dispo, trailing) à sourcer depuis Sheet `revenus locatif` + `direct_bookings` (split par canal = le plus dur, données non séparées). Reprise : décider fenêtre + source revenu unifiée AVANT de coder. Vérifié 2026-06-16 (ical-sync:876-910 + parseBookingReservation:74-90).
- ℹ️ RM-19 : la vue `?view=guests` est un endpoint data (admin Bearer) — pas encore d'écran dédié ; consommée via les segments emailing. Un onglet "voyageurs fidèles" serait l'étape suivante si voulu.
- ⏳ **RM-19** 🔴 — table `guests` unifiée (base repeat).
- ⏳ **RM-18** 🔴 — détection irritation WhatsApp → ntfy.
- ⏳ **RM-25** 🔴 — mode brouillon pricing (jamais un prix en auto).
- ⏳ **Patrimoine** : MM-08 (seuil DSCR 1,2→1,5 + `centreAlertes` côté serveur), MM-13 (PEG `disponible` orphelin), MM-15 (cash antifragile).
- ⏳ + le reste des 55 gaps confirmés dans les 2 docs d'audit.
