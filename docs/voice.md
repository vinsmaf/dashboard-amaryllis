# Voice & Copy — Amaryllis

Bibliothèque de phrases types pour le site et l'app admin. Lift verbatim, ou adapte légèrement — mais respecte la structure (formel `vous`, ponctuation française, capitales seulement pour les hauteurs de marque).

Chaque entrée est `FR · EN` côte à côte. L'anglais est volontairement plus court (les anglo-saxons aiment less is more, les francophones aiment l'effet bercé).

---

## Tone — anti-patterns

**N'écris jamais ça :**

- `tu` / informal → toujours `vous` / formal "you"
- `super`, `top`, `génial` → trop casual
- `n'hésitez pas à` → cliché administratif
- `notre équipe se fera un plaisir de` → corporate
- `cliquez ici` → mauvaise UX
- emoji en milieu de phrase marketing → réservés aux drapeaux pays + onglets admin
- exclamations multiples → une seule, et avec parcimonie

**Écris plutôt :**

- "Notre équipe vous répond en moins d'une heure."
- "Réservation directe, sans frais de service."
- "Voir la villa →"
- "Caressée par les alizés."

---

## 1 · Eyebrows (sections, hero, navigation)

| FR | EN |
|---|---|
| Locations d'exception | Exceptional rentals |
| Réservation directe | Direct booking |
| Nos sept biens | Seven properties |
| Informations pratiques | Practical information |
| Questions fréquentes | Frequently asked |
| Ils en parlent | What guests say |
| À propos | About us |
| Bord de mer · Martinique | Seafront · Martinique |
| Aux portes de Paris | At the gates of Paris |

---

## 2 · Display titles

| FR | EN |
|---|---|
| Villa Amaryllis | Villa Amaryllis |
| Locations d'exception, sans frais de service | Exceptional rentals, no service fee |
| Choisissez votre séjour | Choose your stay |
| Une question? | A question? |
| 200 voyageurs, une moyenne de 4,94 ★ | 200 guests, a 4.94 ★ average |
| Tout pour préparer votre séjour | Everything you need to plan your stay |
| Caressée par les alizés | Brushed by the trade winds |

---

## 3 · Editorial leads (Cormorant italic)

> *Perchée sur les hauteurs de Sainte-Luce, bercée par les alizés et le parfum des fleurs tropicales, la Villa Amaryllis vous invite à un séjour d'exception.*

> *De la villa avec piscine à l'appartement parisien — chaque adresse est gérée par notre équipe sur place, avec la même exigence.*

> *Notre équipe sur place, attentionnée et discrète, veille à ce que chaque instant soit parfait.*

> *Bienvenue dans un cocon tropical niché au cœur d'un jardin luxuriant, sur les hauteurs paisibles de Sainte-Luce.*

> *Une vue mer exceptionnelle, le calme de la Marne et le RER A à dix minutes — un autre genre d'évasion.*

### EN

> *Perched on the heights of Sainte-Luce, caressed by trade winds and tropical flowers, Villa Amaryllis invites you to an exceptional stay.*

> *From a villa with pool to a Paris-side apartment — each address is run by our on-site team, with the same care.*

> *Our discreet, attentive team makes sure every moment is perfect.*

---

## 4 · CTAs (primary actions)

| Context | FR | EN |
|---|---|---|
| Primary booking | RÉSERVER | BOOK NOW |
| Secondary booking | À partir de 280€/nuit | From 280€/night |
| Explore | DÉCOUVRIR | EXPLORE |
| Contact | CONTACT | CONTACT |
| Open WhatsApp | WHATSAPP | WHATSAPP |
| Search | RECHERCHER | SEARCH |
| Long-stay (Iguana) | NOUS CONTACTER | GET IN TOUCH |
| Show all amenities | Voir tous les équipements → | Show all amenities → |
| See villa | Voir la villa → | See the villa → |
| Compare | COMPARER | COMPARE |
| Back | ← Accueil / ← Retour | ← Home / ← Back |

---

## 5 · Booking flow

| Step | FR | EN |
|---|---|---|
| Date prompt | Quand souhaitez-vous venir? | When would you like to come? |
| Date label | Arrivée / Départ | Check-in / Check-out |
| Guest selector | Voyageurs | Guests |
| Below CTA | Annulation gratuite jusqu'à 7 jours avant l'arrivée | Free cancellation up to 7 days before arrival |
| Trust micro | 🔒 Paiement sécurisé par Stripe | 🔒 Secure payment via Stripe |
| Direct discount | ✓ -15% en réservation directe | ✓ -15% direct booking discount |
| Weekly discount | −5% séjour 7 nuits | −5% on stays of 7 nights |
| Monthly discount | −15% séjour mensuel | −15% on stays of 28 nights+ |
| Min nights | Minimum {n} nuits | {n}-night minimum |
| Sold out | Indisponible sur ces dates | Not available for these dates |
| Alerte alt | Être alerté des disponibilités | Get an availability alert |

---

## 6 · Deposit / caution

> **FR** — *Ce montant sera bloqué sur votre carte mais non débité. Il sera libéré automatiquement 3 jours après votre départ, sans démarche de votre part, si aucun dommage n'est constaté.*

> **EN** — *This amount is held on your card but never charged. It is released automatically 3 days after departure, with no action on your side, if no damage is found.*

---

## 7 · Confirmation copy

| Event | FR | EN |
|---|---|---|
| Booking sent | Votre réservation est confirmée. Vous recevez un e-mail dans la minute. | Your booking is confirmed. You'll receive an email within a minute. |
| Caution OK | Caution enregistrée — aucun montant ne sera débité. | Deposit held — no amount will be charged. |
| Caution canceled | Vous avez annulé la pré-autorisation. | You canceled the pre-authorization. |
| Message sent | Merci. Nous vous répondons en moins d'une heure. | Thank you. We'll reply within the hour. |
| Alert saved | Alerte enregistrée. Nous vous écrivons dès qu'une date se libère. | Alert saved. We'll write as soon as a date opens up. |

---

## 8 · Errors & empty states

| Case | FR | EN |
|---|---|---|
| Generic error | Une erreur est survenue. Réessayez ou contactez-nous sur WhatsApp. | Something went wrong. Try again or reach us on WhatsApp. |
| Date invalid | Cette date n'est pas disponible. | This date is not available. |
| Below minimum | Le séjour minimum est de {n} nuits sur cette période. | The minimum stay is {n} nights for this period. |
| Card declined | Votre carte a été refusée. Essayez une autre carte ou contactez votre banque. | Your card was declined. Try another card or contact your bank. |
| No search result | Aucun bien ne correspond à votre recherche — ajustez vos dates ou contactez-nous. | No property matches your search — adjust your dates or get in touch. |
| Loading | Chargement… | Loading… |
| Sync failed | Synchronisation impossible · réessayer | Sync failed · retry |

---

## 9 · Reviews / social proof

| FR | EN |
|---|---|
| ★ 4,94 · 33 avis | ★ 4.94 · 33 reviews |
| ⭐ Coup de cœur Airbnb | ⭐ Airbnb Guest Favourite |
| Note moyenne sur 200 séjours | Average rating across 200 stays |
| Voir tous les avis ↗ | Read all reviews ↗ |

---

## 10 · Footer / contact

| FR | EN |
|---|---|
| Une question? | A question? |
| Notre équipe vous répond en moins d'une heure, en français ou en anglais. | Our team replies within the hour, in French or English. |
| WhatsApp · 9h–22h | WhatsApp · 9am–10pm |
| Réponse < 24h | Reply within 24h |
| Notre base aux Antilles | Our Caribbean base |
| Aux portes de Paris | At the gates of Paris |
| Mentions légales · CGV · Cookies | Legal · Terms · Cookies |
| Locations d'exception | Exceptional rentals |
| © 2026 Amaryllis Locations | © 2026 Amaryllis Locations |

---

## 11 · Admin dashboard (FR only — internal)

> Le ton interne est plus direct, plus chiffré, plus court. On peut se permettre l'humour sec.

| Context | Phrase |
|---|---|
| Daily greeting | Bonjour. Aujourd'hui : {n} check-ins, {n} check-outs. |
| Empty cockpit | Aucune donnée pour ce mois. Sync Google Sheets pour rafraîchir. |
| AI summary CTA | ✨ Générer le bilan mensuel |
| Alert: undercut | {bien} · sous-coté de ~{n}% vs marché · potentiel +{n}k€/an |
| Alert: gap | {bien} · trou de {n} jours à partir du {date} · {n} biens concurrents disponibles |
| Sync success | Sheets sync · il y a {n} min |
| Sync stale | Sync vieille de {n}h · rafraîchir |
| Booking row label | Bien · Voyageur · Canal · Dates · Montant |
| Saisonnalité title | Heatmap occupation · 2022→2026 |

---

## 12 · Property name guide

Liste des biens avec leur nom canonique (jamais traduit, jamais raccourci côté marketing) :

| Slug | Nom complet | Surnom interne |
|---|---|---|
| `amaryllis` | Villa Amaryllis | Amaryllis |
| `zandoli` | Zandoli | Zandoli |
| `iguana` | Villa Iguana | Iguana |
| `geko` | Géko | Géko |
| `mabouya` | Mabouya | Mabouya |
| `schoelcher` | T2 Schœlcher | Schœlcher (avec œ ligature) |
| `nogent` | Aux Portes de Paris | T2 Nogent |

⚠ "Schœlcher" prend bien la ligature œ. Pas "Schoelcher" en marketing.
