# Gestion des réclamations — Amaryllis Locations

> Document opérationnel · Version 1.0 · Juin 2026 · backlog crm-020
> Objectif : transformer chaque réclamation en occasion de fidéliser. Une réclamation bien traitée crée plus de loyauté qu'un séjour sans accroc.
> Références : `docs/sla-reponse.md` (SLA), `docs/programme-fidelite.md` (gestes fidélité), `docs/crm/templates-reclamations.md` (templates).

---

## Principe directeur

Une réclamation n'est pas un problème, c'est une information. Le voyageur qui réclame nous donne une chance de réparer — la majorité des mécontents partent en silence et laissent un avis négatif. Notre promesse : **accuser réception vite, qualifier juste, résoudre concrètement, et faire un geste à la hauteur**.

Ton : chaleureux mais professionnel, `vous` formel (cf. `docs/voice.md`). Jamais sur la défensive, jamais de justification corporate. On reconnaît, on agit, on tient informé.

---

## 1. Canaux d'entrée

Une réclamation peut arriver par n'importe lequel de ces canaux. Tous convergent vers un traitement unique.

| Canal | Typique de | Action de capture |
|---|---|---|
| **WhatsApp** (+33 6 10 88 07 72) | Voyageur en séjour, incident en cours | Réponse immédiate, c'est le canal le plus chaud |
| **Airbnb / Booking Messaging** | Réclamation pré/post-séjour, menace d'avis | Répondre SUR la plateforme (tracé), tracker la satisfaction |
| **Email** (contact@villamaryllis.com) | Réclamation post-séjour, demande de remboursement | Accusé de réception sous SLA |
| **Avis public négatif** (Airbnb, Google, Booking) | Mécontentement déjà rendu public | Réponse publique mesurée + tentative de contact privé |
| **Formulaire de contact** du site | Ancien voyageur, litige caution | Lead taggé « réclamation » |
| **Téléphone** | Urgence vécue comme grave | Noter par écrit immédiatement après l'appel |

**Règle de capture** : toute réclamation, quel que soit le canal, est consignée par écrit (un log Google Sheets ou note Beds24 sur la réservation) avec : date/heure d'entrée, canal, voyageur, bien, nature, gravité estimée, statut. Pas de réclamation traitée « de tête » : ce qui n'est pas tracé n'est pas suivi.

---

## 2. Qualification de la gravité

On classe chaque réclamation en trois niveaux. Le niveau détermine le SLA, le circuit de résolution et le barème du geste commercial.

### 🟢 Mineure
Désagrément réel mais sans impact majeur sur le séjour. Résoluble rapidement, n'entame pas durablement la satisfaction.
*Exemples : ampoule grillée, Wi-Fi lent ponctuel, ustensile manquant, propreté perfectible sur un point, bruit ponctuel de voisinage, information du guide d'accueil pas à jour.*

### 🟠 Majeure
Affecte sensiblement le confort ou l'usage du logement pendant une partie du séjour, mais le séjour reste possible.
*Exemples : climatisation en panne (Martinique), piscine indisponible/sale, panne de chauffe-eau, électroménager essentiel HS, ménage incomplet à l'arrivée, problème de literie, nuisances répétées.*

### 🔴 Critique
Compromet la sécurité, rend le logement partiellement ou totalement inutilisable, ou touche à l'argent du voyageur (caution, double facturation).
*Exemples : coupure d'eau ou d'électricité prolongée, serrure/accès défaillant, dégât des eaux, problème de sécurité (gaz, électrique), intrusion, litige de caution contesté, surbooking, logement non conforme à l'annonce.*

> En cas de doute entre deux niveaux, **toujours retenir le niveau supérieur**. Sous-estimer une réclamation coûte plus cher que la sur-traiter.

---

## 3. Délais de réponse (SLA)

Cohérents avec `docs/sla-reponse.md`. Le SLA porte sur la **première réponse** (accusé de réception), pas sur la résolution complète.

| Gravité | Première réponse (accusé) | Plan d'action communiqué | Canal prioritaire |
|---|---|---|---|
| 🟢 Mineure | < 2 h (saison) / < 4 h | < 24 h | WhatsApp / plateforme |
| 🟠 Majeure | < 1 h | < 4 h | WhatsApp |
| 🔴 Critique | < 30 min | < 1 h | WhatsApp + téléphone |

**Règle d'or (héritée de sla-reponse.md §4)** : le voyageur doit toujours connaître le statut de son incident dans l'heure, même sans solution finale. « Nous avons bien noté, un technicien intervient demain matin » vaut infiniment mieux que le silence.

Hors horaires (22h–8h) : accusé automatique (cf. sla-reponse.md §5), sauf 🔴 critique qui justifie un contact direct.

---

## 4. Étapes de résolution

Process en 5 temps, applicable à toute gravité (l'intensité varie).

1. **Accuser réception** (templates a) — immédiatement, dans le SLA. Reconnaître, remercier d'avoir signalé, rassurer sur la prise en charge. Ne jamais minimiser ni se justifier à ce stade.
2. **Qualifier & comprendre** (template b si besoin) — déterminer la gravité, demander précisions/photos si nécessaire. Identifier : qu'est-ce qui ne va pas, depuis quand, quel impact concret sur le séjour ?
3. **Agir** — déclencher la résolution :
   - 🟢 Mineure : solution à distance ou intervention sous 24 h.
   - 🟠 Majeure : escalade prestataire terrain (cf. sla-reponse.md §4 niveau 3), intervention prioritaire ≤ 24 h.
   - 🔴 Critique : escalade propriétaire immédiate, intervention urgente, solution de repli si logement inutilisable (relogement, remboursement).
4. **Tenir informé** — point de statut proactif tant que ce n'est pas résolu. Ne jamais laisser le voyageur relancer.
5. **Confirmer la résolution & présenter des excuses** (templates c/d) — valider avec le voyageur que c'est réglé, présenter des excuses sincères, proposer le geste commercial adapté à la gravité.

---

## 5. Geste commercial (barème indicatif)

Le geste répare le préjudice ET protège la relation. Il est **indicatif** : à moduler selon la durée du séjour, l'impact réel, le profil du voyageur (membre fidèle = plus généreux) et l'historique. Un membre Amaryllis Club mécontent justifie systématiquement le haut de la fourchette.

| Gravité | Geste indicatif | Plafond indicatif |
|---|---|---|
| 🟢 Mineure | Excuses sincères + petit geste (panier de produits locaux, bouteille de rhum, café/petit-déjeuner offert) ; remise -5 % à -10 % sur un prochain séjour si insatisfaction persiste | ~30 € en nature ou -10 % retour |
| 🟠 Majeure | Remboursement partiel proportionnel (ex. 1 nuit sur la part affectée), OU remise -15 % à -20 % sur prochain séjour, OU 1 nuit offerte sur prochain séjour | ~1 nuit du séjour concerné |
| 🔴 Critique | Remboursement substantiel à total des nuits affectées + relogement si nécessaire ; geste de réconciliation fort (1 à 2 nuits offertes sur prochain séjour, surclassement) | À la discrétion du propriétaire, jusqu'au remboursement total + nuit(s) offerte(s) |

**Principes :**
- Le geste « prochain séjour » (remise/nuit offerte) est préférable au remboursement sec quand c'est possible : il fait revenir le voyageur et coûte moins en trésorerie.
- Ne jamais promettre un geste avant d'avoir qualifié et, idéalement, résolu. Un geste prématuré dévalorise et peut être perçu comme un aveu disproportionné.
- Toute remise/nuit offerte est tracée comme un code dédié (ex. `EXCUSE-[CODE]`) pour suivi, distinct de `RETOUR10` ou des codes Club.
- Au-delà du plafond critique, **décision propriétaire (Vincent) obligatoire**.

---

## 6. Suivi, clôture & relance

1. **Clôturer** (template e) — une fois résolu et le geste appliqué : message de clôture chaleureux, invitation à revenir, mention de l'offre fidélité (« tarif ancien client » / Amaryllis Club si éligible). Marquer la réclamation `résolue` dans le log avec la résolution apportée et le geste accordé.
2. **Relance avis / NPS** — **après** résolution réussie seulement, et avec doigté : inviter le voyageur à mettre à jour ou laisser un avis. Un mécontent bien traité devient souvent un excellent ambassadeur. Si la réclamation a généré un avis public négatif, vérifier s'il peut être mis à jour.
   > ⚠️ Ne jamais relancer pour un avis tant que la réclamation n'est pas réellement close et le voyageur satisfait — sinon on provoque l'avis négatif qu'on voulait éviter.
3. **Boucle d'amélioration** — chaque réclamation 🟠/🔴 alimente une note dans le carnet de bord du bien (cause racine + action préventive). Revue mensuelle : récurrences ? Un même problème qui revient (ex. clim Mabouya) appelle une action de fond, pas un énième geste commercial.

**KPIs réclamations à tracker** (mensuel, en complément de sla-reponse.md §7) :

| Indicateur | Cible |
|---|---|
| Taux de réclamation (réclamations / séjours) | < 8 % |
| Délai moyen de première réponse (réclamation) | < 1 h |
| Taux de résolution sous 24 h | > 85 % |
| Réclamations converties en avis ≥ 4★ après résolution | > 50 % |
| Avis publics négatifs (≤ 3★) | < 2 % des séjours |
| Coût moyen du geste commercial par réclamation | suivi (budget) |

---

## 7. Qui fait quoi

| Acteur | Rôle |
|---|---|
| **Co-hôte / gestionnaire principal** | Capture, accusé de réception, qualification, résolution mineure/majeure, tenue du log, gestes jusqu'au plafond majeur |
| **Propriétaire (Vincent)** | Escalade critique, validation des gestes au-delà du plafond majeur, litiges de caution, relations avec les membres Turquoise/Diamant |
| **Prestataire terrain (Martinique)** | Interventions physiques (clim, piscine, serrurerie, plomberie) selon délais sla-reponse.md §4 niveau 3 |

---

## 8. Mini arbre de décision

```
Réclamation reçue (n'importe quel canal)
        │
        ▼
  ┌─────────────────────────┐
  │ Consigner dans le log    │  (date, canal, bien, voyageur, nature)
  └─────────────────────────┘
        │
        ▼
  Sécurité / accès / argent du voyageur en jeu ? ─── OUI ──► 🔴 CRITIQUE
        │ NON                                              │  · Accusé < 30 min (WhatsApp + tél)
        ▼                                                  │  · Escalade propriétaire immédiate
  Confort/usage fortement affecté                          │  · Intervention urgente + repli (relogement/rembours.)
  pendant une partie du séjour ? ──── OUI ──► 🟠 MAJEURE   │  · Geste : remboursement nuits affectées + 1-2 nuits offertes
        │ NON                              │  · Accusé < 1 h (WhatsApp)
        ▼                                  │  · Escalade prestataire ≤ 24 h
  Désagrément ponctuel,                    │  · Geste : rembours. partiel OU -15/-20% OU 1 nuit offerte
  séjour peu impacté                       │
        │                                  ▼
        ▼                            (suite commune)
  🟢 MINEURE                                │
  · Accusé < 2 h                            │
  · Résolution à distance / ≤ 24 h          │
  · Geste : excuses + petit geste / -10%    │
        │                                  │
        └──────────────┬───────────────────┘
                       ▼
        Tenir informé jusqu'à résolution
                       ▼
        Confirmer résolution + excuses + geste
                       ▼
        Clôturer + inviter à revenir (offre fidélité)
                       ▼
        Si voyageur satisfait → relance avis / NPS
                       ▼
        Note carnet de bord (cause racine) + revue mensuelle
```

---

*Document à réviser chaque année en novembre (avant la haute saison) · contact@villamaryllis.com*
