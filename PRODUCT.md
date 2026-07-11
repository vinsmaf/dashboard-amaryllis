# Product

## Register

brand

*(Ce projet a deux surfaces à registre différent : le site public **villamaryllis.com** est
`brand`, le dashboard admin `/admin` est `product`. La valeur ci-dessus est le défaut pour le
site public — pour tout travail sur l'admin, utiliser `register: product` ou laisser la
surface en focus trancher, cf. règle de priorité du skill.)*

## Users

**Site public (brand)** — Voyageurs francophones et anglophones qui veulent louer en direct
l'un des 7 biens (6 en Martinique, 1 à Nogent-sur-Marne) pour des vacances ou un séjour
ponctuel. Ils cherchent l'authenticité antillaise, la confiance (paiement sécurisé, avis
vérifiés) et un tarif net sans commission OTA. Contexte d'usage typique : recherche sur mobile,
comparaison mentale avec Airbnb/Booking.com, décision de réserver en direct motivée par le prix
et la confiance.

**Admin (product)** — Vincent Salomon, propriétaire-exploitant solo de 7 biens de location
saisonnière (conciergerie + réservation directe). Pilote au quotidien depuis le dashboard :
planning des résas, tarifs, communication voyageurs, ménage/maintenance, marketing, finances.
Usage fréquent, souvent en mobilité (Martinique) — besoin de densité d'information et de
rapidité d'action, pas de décoration.

## Product Purpose

Le site public existe pour convertir des voyageurs vers la réservation directe plutôt que via
Airbnb/Booking.com, réduisant les commissions plateforme. Succès = taux de conversion direct en
hausse, occupation optimisée, marge nette meilleure.

L'admin existe pour que Vincent pilote l'ensemble du portefeuille (7 biens) depuis un seul
endroit, sans dépendre d'outils tiers dispersés. Succès = décisions rapides et fiables (prix,
résas, ops) sans changer d'écran.

## Brand Personality

3 mots : **Chaleureux, Authentique, Premium** (sans ostentation). Ton éditorial, toujours
formel (vous), jamais familier. Émotion recherchée : confiance + désir de voyage — « je me
projette déjà là-bas ». Pas exubérant ni tape-à-l'œil : le luxe discret, pas le bling.

## Anti-references

Pas un site générique type template Airbnb/OTA — l'objectif explicite est de se différencier
de l'OTA, pas de lui ressembler visuellement.

Anti-patterns de code déjà actés dans le projet : gradients criards, drop-shadows multi-couches,
bordures de séparation systématiques (préférer l'espacement), icônes Material Design sur le
site marketing (utiliser le sprite SVG maison), animations déclenchées au scroll, couleurs
inventées hors tokens, border-radius incohérent dans une même vue.

## Design Principles

1. **Photo-forward** — toujours de vraies photos, jamais de placeholder SVG : le bien vendu
   EST la photo.
2. **Deux registres, un seul système typographique** — Jost (display/UI) + Cormorant Garamond
   (éditorial italique) + JetBrains Mono (chiffres admin) : cohérence cross-surface sans
   confondre les deux univers visuels.
3. **Prix et disponibilité toujours visibles** — c'est un site de conversion, pas un portfolio.
4. **Mobile-first** — la majorité du trafic recherche/réserve depuis mobile.
5. **Sur l'admin, densité et rapidité priment sur l'esthétique** — pas d'ombres, pas de
   fioritures ; des bordures plutôt que des ombres en dark mode.

## Accessibility & Inclusion

Aucune exigence WCAG formelle documentée à ce jour. Base par défaut retenue : contraste AA,
focus clavier visible, parcours de réservation (jusqu'au paiement Stripe) entièrement
utilisable au clavier — c'est l'étape critique à ne jamais casser. Public voyageur
multi-générationnel (incl. seniors) → privilégier des tailles de police et zones cliquables
confortables sur le site public plutôt que la densité, réservée à l'admin.

---

_Rempli au mieux par Claude à partir du contexte existant du repo (CLAUDE.md, docs/voice.md,
skill webdesigner-amaryllis, skill amaryllis-design) le 2026-07-11 — à affiner au fil de
l'usage plutôt qu'un interview complet a priori._
