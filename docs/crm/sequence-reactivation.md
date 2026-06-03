# Séquence de réactivation des anciens voyageurs — Amaryllis Locations

> Document opérationnel · Version 1.0 · Juin 2026 · backlog crm-020
> Objectif : faire revenir les anciens voyageurs via une **séquence structurée à 6 et 12 mois**, articulée avec l'offre fidélité « tarif ancien client ».
>
> **Ce document COMPLÈTE, il ne remplace pas :**
> - `docs/email-reactivation.md` — contient l'email HTML Brevo-ready complet (FR/EN), le segment, les paramètres d'envoi, la logique `{{bien_precedent}}`. **C'est l'asset de l'envoi 12 mois.**
> - `docs/programme-fidelite.md` — l'Amaryllis Club (4 niveaux, remises -5 % à -15 %), source des avantages « ancien client ».
> - `docs/crm/gestion-reclamations.md` — la clôture d'une réclamation (template e) renvoie vers cette séquence.

---

## 1. Vue d'ensemble de la séquence

Deux points de contact, deux intentions distinctes. On ne « spamme » pas : on rappelle qu'on existe, au bon moment, avec une vraie raison.

| Touchpoint | Délai depuis dernier séjour | Intention | Offre | Asset |
|---|---|---|---|---|
| **Post-séjour** | J+1 / J+3 | Remercier, demander un avis, semer le retour | Mention Amaryllis Club (Sable -5 %) | `/api/send-poststay` (existant) |
| **Réactivation 6 mois** | 6 mois | « On pense à vous » — réactivation douce, anniversaire de séjour | Tarif ancien client (Club Sable -5 % à -8 %) | ce doc §3 |
| **Réactivation 12 mois** | 12 mois | Relance forte avec offre chiffrée | Code `RETOUR10` (-10 %) | `docs/email-reactivation.md` |
| **Relance 12 mois +14 j** | +14 j si non-ouvert | Rappel court de l'offre | `RETOUR10` | `email-reactivation.md` §Fréquence |

> Au-delà de 36 mois sans séjour : sortir de la séquence (données obsolètes, cf. segment Brevo dans `email-reactivation.md`).

L'offre « tarif ancien client » mentionnée ici **EST** l'Amaryllis Club niveau Sable (attribué automatiquement après le 1er séjour). On évite d'inventer un nouveau code : on s'appuie sur l'écosystème existant (`CLUB-[CODE]` pour le Club, `RETOUR10` pour la relance 12 mois).

---

## 2. Articulation avec l'existant (anti-doublon)

```
1er séjour terminé
   │
   ├─ J+1/J+3 ── Post-séjour (existant) ── demande d'avis + entrée Amaryllis Club (Sable)
   │
   ├─ 6 mois ──── Email réactivation 6 mois (NOUVEAU, §3) ── « tarif ancien client » Club
   │
   ├─ 12 mois ─── Email réactivation 12 mois (email-reactivation.md) ── RETOUR10 -10%
   │                 │
   │                 └─ +14 j si non-ouvert ── relance courte (email-reactivation.md)
   │
   └─ > 36 mois ── sortie de séquence (contact froid)
```

**Règles de cadence (ne pas sur-solliciter) :**
- Si le voyageur **rouvre une réservation** à tout moment → il sort de la séquence de réactivation et repasse en parcours « réservation » normal.
- Un voyageur **membre actif du Club** (séjour < 6 mois) ne reçoit PAS l'email 6 mois.
- Si un envoi a généré un **clic** (intérêt) → ne pas enchaîner mécaniquement l'envoi suivant trop vite ; laisser respirer.
- Respecter le statut RGPD (`statut_abonnement = abonné`) et le lien de désabonnement (cf. email-reactivation.md).

---

## 3. Email de réactivation 6 mois (NOUVEAU)

Touchpoint intermédiaire absent de l'existant. Ton plus doux que le 12 mois : pas de grosse promo, on réactive le lien affectif et on rappelle le tarif ancien client. Réutilise le **même gabarit HTML Brevo** que `email-reactivation.md` (mêmes styles, header, footer) — seuls le héro, le corps et l'offre changent.

### Objets — variantes A/B

| Variante | FR | EN |
|---|---|---|
| A | {{prenom}}, six mois déjà depuis la Martinique | {{prenom}}, six months already since Martinique |
| B | Votre tarif ancien voyageur vous attend, {{prenom}} | Your returning-guest rate is waiting, {{prenom}} |

### Préheader

> FR : *On pense à vous — votre tarif ancien voyageur reste actif sur villamaryllis.com.*
> EN : *Thinking of you — your returning-guest rate is still active at villamaryllis.com.*

### Corps (FR)

> **Héro** : « Six mois, déjà. » — sous-titre : « La Martinique, elle, n'a pas changé. »
>
> Cher(e) {{prenom}},
>
> Il y a six mois, vous quittiez {{bien_precedent | "nos rivages martiniquais"}}. Le temps file — mais les alizés, eux, soufflent toujours, et la baie de Sainte-Luce reste fidèle au souvenir que vous en avez gardé.
>
> Nous voulions simplement vous dire que vous nous manquez, et vous rappeler qu'en tant qu'ancien voyageur, vous bénéficiez de notre **tarif privilégié en réservation directe** — sans frais de service, avec la même équipe joignable en moins d'une heure.
>
> *(Bloc offre)* Votre avantage ancien voyageur : **-5 % en réservation directe** sur villamaryllis.com, cumulable avec votre statut Amaryllis Club. Mentionnez votre code membre **CLUB-[CODE]** lors de votre demande.
>
> *(CTA)* Revoir nos villas →
>
> Quand l'envie d'un retour se fera sentir, vous saurez où nous trouver.
>
> Chaleureusement,
> L'équipe Amaryllis Locations

### Corps (EN)

> **Hero** : "Six months already." — subtitle: "Martinique, though, hasn't changed."
>
> Dear {{prenom}},
>
> Six months ago, you left {{bien_precedent | "our shores in Martinique"}}. Time flies — but the trade winds still blow, and Sainte-Luce bay remains faithful to the memory you kept of it.
>
> We simply wanted to say you're missed, and to remind you that, as a returning guest, you enjoy our **preferred direct-booking rate** — no service fee, same team reachable within the hour.
>
> *(Offer block)* Your returning-guest benefit: **5% off direct bookings** at villamaryllis.com, on top of your Amaryllis Club status. Mention your member code **CLUB-[CODE]** with your request.
>
> *(CTA)* See our villas →
>
> Whenever the urge to return strikes, you'll know where to find us.
>
> Warmly,
> The Amaryllis Locations team

### Personnalisation `{{bien_precedent}}`
Réutiliser la table de correspondance nom canonique → formule évocatrice de `email-reactivation.md §Notes de personnalisation` (Villa Amaryllis, Zandoli, Iguana, Géko, Mabouya, T2 Schœlcher, Aux Portes de Paris). **Note Nogent** : si `bien_precedent = "Aux Portes de Paris"`, retirer les références Martinique/Sainte-Luce (héro : « Six mois, déjà. » / sous-titre : « La Marne vous attend toujours. », eyebrow « Locations d'exception · Île-de-France »).

---

## 4. Paramètres Brevo (delta vs email-reactivation.md)

`email-reactivation.md §Paramètres Brevo` couvre le segment 12 mois. Pour le 6 mois, créer un segment et une automation distincts :

### Segment 6 mois
```
Contacts où :
  - Tag = "voyageur_direct"
  - ET date_dernier_sejour entre [aujourd'hui − 7 mois] et [aujourd'hui − 5 mois]
  - ET PAS de réservation active/future
  - ET statut_abonnement = "abonné"
```
> La fenêtre 5–7 mois évite les chevauchements et capte les contacts au bon moment même si l'automation tourne en batch.

### Heure d'envoi
Mardi ou jeudi, 10h00 (Paris) pour le segment FR ; mardi 08h00 UTC pour l'EN (mêmes benchmarks que email-reactivation.md).

### Tags à appliquer
| Tag | Moment |
|---|---|
| `reactivation_6m_envoye` | À l'envoi |
| `reactivation_6m_clique` | Si clic CTA |
| (puis 6 mois plus tard) | bascule naturelle vers le segment 12 mois `RETOUR10` |

### Automation recommandée
Scénario Brevo déclenché sur « contact entre dans le segment 6 mois » → envoi auto. Pas d'action manuelle. Un contact qui réserve sort automatiquement de tous les segments de réactivation.

---

## 5. Mesure

| Indicateur | Cible | Source |
|---|---|---|
| Taux d'ouverture email 6 mois | > 35 % | Brevo |
| Taux de clic 6 mois | > 4 % | Brevo |
| Taux de réactivation global (retour ≤ 18 mois) | de ~10 % → ~25 % | Beds24 / Stripe (cf. ROI programme-fidelite.md §6) |
| Réservations directes attribuées à la séquence | suivi (UTM `campaign=reactivation_6m` / `_12m`) | GA4 |

Revue trimestrielle conjointe avec le suivi du programme de fidélité (`programme-fidelite.md §6`).

---

*Document à réviser chaque année en novembre · contact@villamaryllis.com*
