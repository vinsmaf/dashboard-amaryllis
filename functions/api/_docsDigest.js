// GÉNÉRÉ par scripts/generate-docs-digest.mjs — snapshot périodique (PAS live, PAS à chaque build).
// But : donner au RAG (rag-ingest.js) un accès au contenu des docs stratégiques
// (docs/marketing, strategie, revenue-manager, crm, service-client, seo, legal) —
// sinon invisibles pour toute la fleet d'agents (files_hint = chemins texte
// seulement, jamais le contenu ; pas d'accès filesystem en prod Cloudflare).
// Régénérer manuellement (node scripts/generate-docs-digest.mjs) quand un doc de
// ce périmètre change significativement — un oubli dégrade juste la fraîcheur.
// Dernière génération : 2026-07-04 — 33 docs, 435 sections.

export const DOCS_DIGEST = [
  {
    "id": "doc-docs-crm-gestion-reclamations-md-0",
    "text": "[docs/crm/gestion-reclamations.md § Introduction] # Gestion des réclamations — Amaryllis Locations\n\n> Document opérationnel · Version 1.0 · Juin 2026 · backlog crm-020\n> Objectif : transformer chaque réclamation en occasion de fidéliser. Une réclamation bien traitée crée plus de loyauté qu'un séjour sans accroc.\n> Références : `docs/sla-reponse.md` (SLA), `docs/programme-fidelite.md` (gestes fidélité), `docs/crm/templates-reclamations.md` (templates).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-1",
    "text": "[docs/crm/gestion-reclamations.md § Principe directeur] Une réclamation n'est pas un problème, c'est une information. Le voyageur qui réclame nous donne une chance de réparer — la majorité des mécontents partent en silence et laissent un avis négatif. Notre promesse : **accuser réception vite, qualifier juste, résoudre concrètement, et faire un geste à la hauteur**.\n\nTon : chaleureux mais professionnel, `vous` formel (cf. `docs/voice.md`). Jamais sur la défensive, jamais de justification corporate. On reconnaît, on agit, on tient informé.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-2",
    "text": "[docs/crm/gestion-reclamations.md § 1. Canaux d'entrée] Une réclamation peut arriver par n'importe lequel de ces canaux. Tous convergent vers un traitement unique.\n\n| Canal | Typique de | Action de capture |\n|---|---|---|\n| **WhatsApp** (+33 6 10 88 07 72) | Voyageur en séjour, incident en cours | Réponse immédiate, c'est le canal le plus chaud |\n| **Airbnb / Booking Messaging** | Réclamation pré/post-séjour, menace d'avis | Répondre SUR la plateforme (tracé), tracker la satisfaction |\n| **Email** (contact@villamaryllis.com) | Réclamation post-séjour, demande de remboursement | Accusé de réception sous SLA |\n| **Avis public négatif** (Airbnb, Google, Booking) | Mécontentement déjà rendu publ",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-3",
    "text": "[docs/crm/gestion-reclamations.md § 2. Qualification de la gravité] On classe chaque réclamation en trois niveaux. Le niveau détermine le SLA, le circuit de résolution et le barème du geste commercial.",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-4",
    "text": "[docs/crm/gestion-reclamations.md § 2. Qualification de la gravité › 🟢 Mineure] Désagrément réel mais sans impact majeur sur le séjour. Résoluble rapidement, n'entame pas durablement la satisfaction.\n*Exemples : ampoule grillée, Wi-Fi lent ponctuel, ustensile manquant, propreté perfectible sur un point, bruit ponctuel de voisinage, information du guide d'accueil pas à jour.*",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-5",
    "text": "[docs/crm/gestion-reclamations.md § 2. Qualification de la gravité › 🟠 Majeure] Affecte sensiblement le confort ou l'usage du logement pendant une partie du séjour, mais le séjour reste possible.\n*Exemples : climatisation en panne (Martinique), piscine indisponible/sale, panne de chauffe-eau, électroménager essentiel HS, ménage incomplet à l'arrivée, problème de literie, nuisances répétées.*",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-6",
    "text": "[docs/crm/gestion-reclamations.md § 2. Qualification de la gravité › 🔴 Critique] Compromet la sécurité, rend le logement partiellement ou totalement inutilisable, ou touche à l'argent du voyageur (caution, double facturation).\n*Exemples : coupure d'eau ou d'électricité prolongée, serrure/accès défaillant, dégât des eaux, problème de sécurité (gaz, électrique), intrusion, litige de caution contesté, surbooking, logement non conforme à l'annonce.*\n\n> En cas de doute entre deux niveaux, **toujours retenir le niveau supérieur**. Sous-estimer une réclamation coûte plus cher que la sur-traiter.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-7",
    "text": "[docs/crm/gestion-reclamations.md § 3. Délais de réponse (SLA)] Cohérents avec `docs/sla-reponse.md`. Le SLA porte sur la **première réponse** (accusé de réception), pas sur la résolution complète.\n\n| Gravité | Première réponse (accusé) | Plan d'action communiqué | Canal prioritaire |\n|---|---|---|---|\n| 🟢 Mineure | < 2 h (saison) / < 4 h | < 24 h | WhatsApp / plateforme |\n| 🟠 Majeure | < 1 h | < 4 h | WhatsApp |\n| 🔴 Critique | < 30 min | < 1 h | WhatsApp + téléphone |\n\n**Règle d'or (héritée de sla-reponse.md §4)** : le voyageur doit toujours connaître le statut de son incident dans l'heure, même sans solution finale. « Nous avons bien noté, un technicien intervient demain matin » vaut in",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-8",
    "text": "[docs/crm/gestion-reclamations.md § 4. Étapes de résolution] Process en 5 temps, applicable à toute gravité (l'intensité varie).\n\n1. **Accuser réception** (templates a) — immédiatement, dans le SLA. Reconnaître, remercier d'avoir signalé, rassurer sur la prise en charge. Ne jamais minimiser ni se justifier à ce stade.\n2. **Qualifier & comprendre** (template b si besoin) — déterminer la gravité, demander précisions/photos si nécessaire. Identifier : qu'est-ce qui ne va pas, depuis quand, quel impact concret sur le séjour ?\n3. **Agir** — déclencher la résolution :\n   - 🟢 Mineure : solution à distance ou intervention sous 24 h.\n   - 🟠 Majeure : escalade prestataire terrain (cf. sla-reponse.md",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-9",
    "text": "[docs/crm/gestion-reclamations.md § 5. Geste commercial (barème indicatif)] Le geste répare le préjudice ET protège la relation. Il est **indicatif** : à moduler selon la durée du séjour, l'impact réel, le profil du voyageur (membre fidèle = plus généreux) et l'historique. Un membre Amaryllis Club mécontent justifie systématiquement le haut de la fourchette.\n\n| Gravité | Geste indicatif | Plafond indicatif |\n|---|---|---|\n| 🟢 Mineure | Excuses sincères + petit geste (panier de produits locaux, bouteille de rhum, café/petit-déjeuner offert) ; remise -5 % à -10 % sur un prochain séjour si insatisfaction persiste | ~30 € en nature ou -10 % retour |\n| 🟠 Majeure | Remboursement partiel proporti",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-10",
    "text": "[docs/crm/gestion-reclamations.md § 6. Suivi, clôture & relance] 1. **Clôturer** (template e) — une fois résolu et le geste appliqué : message de clôture chaleureux, invitation à revenir, mention de l'offre fidélité (« tarif ancien client » / Amaryllis Club si éligible). Marquer la réclamation `résolue` dans le log avec la résolution apportée et le geste accordé.\n2. **Relance avis / NPS** — **après** résolution réussie seulement, et avec doigté : inviter le voyageur à mettre à jour ou laisser un avis. Un mécontent bien traité devient souvent un excellent ambassadeur. Si la réclamation a généré un avis public négatif, vérifier s'il peut être mis à jour.\n   > ⚠️ Ne jamais relancer pour un avis",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-11",
    "text": "[docs/crm/gestion-reclamations.md § 7. Qui fait quoi] | Acteur | Rôle |\n|---|---|\n| **Co-hôte / gestionnaire principal** | Capture, accusé de réception, qualification, résolution mineure/majeure, tenue du log, gestes jusqu'au plafond majeur |\n| **Propriétaire (Vincent)** | Escalade critique, validation des gestes au-delà du plafond majeur, litiges de caution, relations avec les membres Turquoise/Diamant |\n| **Prestataire terrain (Martinique)** | Interventions physiques (clim, piscine, serrurerie, plomberie) selon délais sla-reponse.md §4 niveau 3 |\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-gestion-reclamations-md-12",
    "text": "[docs/crm/gestion-reclamations.md § 8. Mini arbre de décision] ```\nRéclamation reçue (n'importe quel canal)\n        │\n        ▼\n  ┌─────────────────────────┐\n  │ Consigner dans le log    │  (date, canal, bien, voyageur, nature)\n  └─────────────────────────┘\n        │\n        ▼\n  Sécurité / accès / argent du voyageur en jeu ? ─── OUI ──► 🔴 CRITIQUE\n        │ NON                                              │  · Accusé < 30 min (WhatsApp + tél)\n        ▼                                                  │  · Escalade propriétaire immédiate\n  Confort/usage fortement affecté                          │  · Intervention urgente + repli (relogement/rembours.)\n  pendant une partie du séjour ? ──── OU",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/gestion-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-0",
    "text": "[docs/crm/sequence-reactivation.md § Introduction] # Séquence de réactivation des anciens voyageurs — Amaryllis Locations\n\n> Document opérationnel · Version 1.0 · Juin 2026 · backlog crm-020\n> Objectif : faire revenir les anciens voyageurs via une **séquence structurée à 6 et 12 mois**, articulée avec l'offre fidélité « tarif ancien client ».\n>\n> **Ce document COMPLÈTE, il ne remplace pas :**\n> - `docs/email-reactivation.md` — contient l'email HTML Brevo-ready complet (FR/EN), le segment, les paramètres d'envoi, la logique `{{bien_precedent}}`. **C'est l'asset de l'envoi 12 mois.**\n> - `docs/programme-fidelite.md` — l'Amaryllis Club (4 niveaux, remises -5 % à -15 %), source des avantages « a",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-1",
    "text": "[docs/crm/sequence-reactivation.md § 1. Vue d'ensemble de la séquence] Deux points de contact, deux intentions distinctes. On ne « spamme » pas : on rappelle qu'on existe, au bon moment, avec une vraie raison.\n\n| Touchpoint | Délai depuis dernier séjour | Intention | Offre | Asset |\n|---|---|---|---|---|\n| **Post-séjour** | J+1 / J+3 | Remercier, demander un avis, semer le retour | Mention Amaryllis Club (Sable -5 %) | `/api/send-poststay` (existant) |\n| **Réactivation 6 mois** | 6 mois | « On pense à vous » — réactivation douce, anniversaire de séjour | Tarif ancien client (Club Sable -5 % à -8 %) | ce doc §3 |\n| **Réactivation 12 mois** | 12 mois | Relance forte avec offre chiffrée | Code ",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-2",
    "text": "[docs/crm/sequence-reactivation.md § 2. Articulation avec l'existant (anti-doublon)] ```\n1er séjour terminé\n   │\n   ├─ J+1/J+3 ── Post-séjour (existant) ── demande d'avis + entrée Amaryllis Club (Sable)\n   │\n   ├─ 6 mois ──── Email réactivation 6 mois (NOUVEAU, §3) ── « tarif ancien client » Club\n   │\n   ├─ 12 mois ─── Email réactivation 12 mois (email-reactivation.md) ── RETOUR10 -10%\n   │                 │\n   │                 └─ +14 j si non-ouvert ── relance courte (email-reactivation.md)\n   │\n   └─ > 36 mois ── sortie de séquence (contact froid)\n```\n\n**Règles de cadence (ne pas sur-solliciter) :**\n- Si le voyageur **rouvre une réservation** à tout moment → il sort de la séquence de réac",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-3",
    "text": "[docs/crm/sequence-reactivation.md § 3. Email de réactivation 6 mois (NOUVEAU)] Touchpoint intermédiaire absent de l'existant. Ton plus doux que le 12 mois : pas de grosse promo, on réactive le lien affectif et on rappelle le tarif ancien client. Réutilise le **même gabarit HTML Brevo** que `email-reactivation.md` (mêmes styles, header, footer) — seuls le héro, le corps et l'offre changent.",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-4",
    "text": "[docs/crm/sequence-reactivation.md § 3. Email de réactivation 6 mois (NOUVEAU) › Objets — variantes A/B] | Variante | FR | EN |\n|---|---|---|\n| A | {{prenom}}, six mois déjà depuis la Martinique | {{prenom}}, six months already since Martinique |\n| B | Votre tarif ancien voyageur vous attend, {{prenom}} | Your returning-guest rate is waiting, {{prenom}} |",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-5",
    "text": "[docs/crm/sequence-reactivation.md § 3. Email de réactivation 6 mois (NOUVEAU) › Préheader] > FR : *On pense à vous — votre tarif ancien voyageur reste actif sur villamaryllis.com.*\n> EN : *Thinking of you — your returning-guest rate is still active at villamaryllis.com.*",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-6",
    "text": "[docs/crm/sequence-reactivation.md § 3. Email de réactivation 6 mois (NOUVEAU) › Corps (FR)] > **Héro** : « Six mois, déjà. » — sous-titre : « La Martinique, elle, n'a pas changé. »\n>\n> Cher(e) {{prenom}},\n>\n> Il y a six mois, vous quittiez {{bien_precedent | \"nos rivages martiniquais\"}}. Le temps file — mais les alizés, eux, soufflent toujours, et la baie de Sainte-Luce reste fidèle au souvenir que vous en avez gardé.\n>\n> Nous voulions simplement vous dire que vous nous manquez, et vous rappeler qu'en tant qu'ancien voyageur, vous bénéficiez de notre **tarif privilégié en réservation directe** — sans frais de service, avec la même équipe joignable en moins d'une heure.\n>\n> *(Bloc offre)* Vo",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-7",
    "text": "[docs/crm/sequence-reactivation.md § 3. Email de réactivation 6 mois (NOUVEAU) › Corps (EN)] > **Hero** : \"Six months already.\" — subtitle: \"Martinique, though, hasn't changed.\"\n>\n> Dear {{prenom}},\n>\n> Six months ago, you left {{bien_precedent | \"our shores in Martinique\"}}. Time flies — but the trade winds still blow, and Sainte-Luce bay remains faithful to the memory you kept of it.\n>\n> We simply wanted to say you're missed, and to remind you that, as a returning guest, you enjoy our **preferred direct-booking rate** — no service fee, same team reachable within the hour.\n>\n> *(Offer block)* Your returning-guest benefit: **5% off direct bookings** at villamaryllis.com, on top of your Amary",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-8",
    "text": "[docs/crm/sequence-reactivation.md § 3. Email de réactivation 6 mois (NOUVEAU) › Personnalisation `{{bien_precedent}}`] Réutiliser la table de correspondance nom canonique → formule évocatrice de `email-reactivation.md §Notes de personnalisation` (Villa Amaryllis, Zandoli, Iguana, Géko, Mabouya, T2 Schœlcher, Aux Portes de Paris). **Note Nogent** : si `bien_precedent = \"Aux Portes de Paris\"`, retirer les références Martinique/Sainte-Luce (héro : « Six mois, déjà. » / sous-titre : « La Marne vous attend toujours. », eyebrow « Locations d'exception · Île-de-France »).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-9",
    "text": "[docs/crm/sequence-reactivation.md § 4. Paramètres Brevo (delta vs email-reactivation.md)] `email-reactivation.md §Paramètres Brevo` couvre le segment 12 mois. Pour le 6 mois, créer un segment et une automation distincts :",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-10",
    "text": "[docs/crm/sequence-reactivation.md § 4. Paramètres Brevo (delta vs email-reactivation.md) › Segment 6 mois] ```\nContacts où :\n  - Tag = \"voyageur_direct\"\n  - ET date_dernier_sejour entre [aujourd'hui − 7 mois] et [aujourd'hui − 5 mois]\n  - ET PAS de réservation active/future\n  - ET statut_abonnement = \"abonné\"\n```\n> La fenêtre 5–7 mois évite les chevauchements et capte les contacts au bon moment même si l'automation tourne en batch.",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-11",
    "text": "[docs/crm/sequence-reactivation.md § 4. Paramètres Brevo (delta vs email-reactivation.md) › Heure d'envoi] Mardi ou jeudi, 10h00 (Paris) pour le segment FR ; mardi 08h00 UTC pour l'EN (mêmes benchmarks que email-reactivation.md).",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-12",
    "text": "[docs/crm/sequence-reactivation.md § 4. Paramètres Brevo (delta vs email-reactivation.md) › Tags à appliquer] | Tag | Moment |\n|---|---|\n| `reactivation_6m_envoye` | À l'envoi |\n| `reactivation_6m_clique` | Si clic CTA |\n| (puis 6 mois plus tard) | bascule naturelle vers le segment 12 mois `RETOUR10` |",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-13",
    "text": "[docs/crm/sequence-reactivation.md § 4. Paramètres Brevo (delta vs email-reactivation.md) › Automation recommandée] Scénario Brevo déclenché sur « contact entre dans le segment 6 mois » → envoi auto. Pas d'action manuelle. Un contact qui réserve sort automatiquement de tous les segments de réactivation.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-sequence-reactivation-md-14",
    "text": "[docs/crm/sequence-reactivation.md § 5. Mesure] | Indicateur | Cible | Source |\n|---|---|---|\n| Taux d'ouverture email 6 mois | > 35 % | Brevo |\n| Taux de clic 6 mois | > 4 % | Brevo |\n| Taux de réactivation global (retour ≤ 18 mois) | de ~10 % → ~25 % | Beds24 / Stripe (cf. ROI programme-fidelite.md §6) |\n| Réservations directes attribuées à la séquence | suivi (UTM `campaign=reactivation_6m` / `_12m`) | GA4 |\n\nRevue trimestrielle conjointe avec le suivi du programme de fidélité (`programme-fidelite.md §6`).\n\n---\n\n*Document à réviser chaque année en novembre · contact@villamaryllis.com*",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/sequence-reactivation.md"
    }
  },
  {
    "id": "doc-docs-crm-templates-reclamations-md-0",
    "text": "[docs/crm/templates-reclamations.md § Introduction] # Templates de réclamation — Amaryllis Locations\n\n> Ton chaleureux mais professionnel · `vous` formel (cf. `docs/voice.md`).\n> Process associé : `docs/crm/gestion-reclamations.md`.\n> Ces templates sont aussi intégrés dans l'onglet **Messages voyageurs → catégorie « Réclamations »** du dashboard admin (`src/tabs/MessageTemplates.jsx`).\n>\n> Variables : `[Prénom]`, `[bien]`, `[problème]`, `[délai]`, `[geste]`, `[CODE]`, `[date limite]`. Signature : « Vincent » (ou « L'équipe Amaryllis Locations » selon le canal).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/templates-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-templates-reclamations-md-1",
    "text": "[docs/crm/templates-reclamations.md § (a) Accusé de réception immédiat] > *À envoyer dans le SLA (cf. gestion-reclamations.md §3). Reconnaître, remercier, rassurer. Ne rien promettre encore.*\n\n**FR**\n\n> Bonjour [Prénom],\n>\n> Merci de nous avoir signalé ce point concernant [bien]. Je comprends que cela puisse être contrariant, et je vous remercie de nous en faire part directement — cela nous permet d'agir vite.\n>\n> Je prends votre message en charge personnellement. Je reviens vers vous très rapidement avec une solution.\n>\n> À tout de suite,\n> Vincent\n\n**EN**\n\n> Hello [Prénom],\n>\n> Thank you for letting us know about this at [bien]. I completely understand it's frustrating, and I'm grateful yo",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/templates-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-templates-reclamations-md-2",
    "text": "[docs/crm/templates-reclamations.md § (b) Demande de précisions] > *Quand la qualification nécessite plus d'informations (nature exacte, photos, impact). Reste rassurant, montre qu'on est déjà en mouvement.*\n\n**FR**\n\n> Bonjour [Prénom],\n>\n> Pour résoudre cela au plus vite, pourriez-vous me préciser quelques éléments ?\n>\n> • La nature exacte du problème et depuis quand vous le constatez\n> • Une photo si possible (cela aide beaucoup le technicien)\n> • Si cela affecte votre confort dès maintenant ou si nous avons un peu de temps\n>\n> Dès votre retour, j'organise l'intervention. Je reste joignable sur WhatsApp en attendant.\n>\n> Merci,\n> Vincent\n\n**EN**\n\n> Hello [Prénom],\n>\n> So we can fix this as",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/templates-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-templates-reclamations-md-3",
    "text": "[docs/crm/templates-reclamations.md § (c) Résolution + excuses] > *Le problème est réglé. Confirmer, présenter des excuses sincères, vérifier que tout est bon. (Geste éventuel : voir template d.)*\n\n**FR**\n\n> Bonjour [Prénom],\n>\n> [problème] est désormais résolu — [détail de l'action menée, ex. « le technicien est passé ce matin et la climatisation fonctionne »]. Pouvez-vous me confirmer que tout est rentré dans l'ordre de votre côté ?\n>\n> Je vous présente mes excuses pour ce désagrément. Ce n'est pas le séjour que nous voulions vous offrir, et je vous remercie de votre patience.\n>\n> N'hésitez pas si le moindre point reste à régler — je reste à votre entière disposition jusqu'à votre départ.\n",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/templates-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-templates-reclamations-md-4",
    "text": "[docs/crm/templates-reclamations.md § (d) Excuses + geste commercial] > *Pour les réclamations majeures/critiques, ou mineures persistantes. Le geste répare et fait revenir. Adapter à la gravité (barème §5). Préférer un geste « prochain séjour ».*\n\n**FR**\n\n> Bonjour [Prénom],\n>\n> Encore une fois, je suis sincèrement désolé pour [problème] qui a perturbé votre séjour à [bien]. Vous avez été d'une grande compréhension, et je tiens à ce que cela ne reste pas sans suite.\n>\n> Pour me faire pardonner, je vous offre [geste — ex. « le remboursement d'une nuit » / « -20 % sur votre prochain séjour avec le code EXCUSE-[CODE] » / « une nuit offerte lors de votre retour »].\n>\n> J'espère sincèrement avoi",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/templates-reclamations.md"
    }
  },
  {
    "id": "doc-docs-crm-templates-reclamations-md-5",
    "text": "[docs/crm/templates-reclamations.md § (e) Clôture + invitation à revenir (offre fidélité)] > *Réclamation résolue, voyageur satisfait. Tourner la page sur une note positive et ouvrir la porte au retour via l'offre fidélité (cf. programme-fidelite.md / sequence-reactivation.md).*\n\n**FR**\n\n> Bonjour [Prénom],\n>\n> Je suis ravi que tout soit rentré dans l'ordre. Merci encore pour votre patience et votre bienveillance — c'est exactement ce qui rend notre métier humain et agréable.\n>\n> Si vous repensez à un séjour en Martinique, sachez que nos anciens voyageurs bénéficient d'un **tarif privilégié en réservation directe** sur villamaryllis.com. Ce sera un plaisir de vous accueillir à nouveau, et de",
    "metadata": {
      "source": "doc",
      "doc": "docs/crm/templates-reclamations.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-0",
    "text": "[docs/legal/cgv-audit.md § Introduction] # Audit de la page CGV — `src/ConditionsGenerales.jsx`\n\n> ⚠️ **MODÈLE / AIDE — PAS UN AVIS D'AVOCAT.** Audit du code réel (`src/ConditionsGenerales.jsx`, en vigueur depuis le 24 mai 2026, route `/conditions-generales`). À faire valider par un professionnel. **Aucune modification de code n'est faite ici** — uniquement des recommandations + textes prêts à coller (Vincent décide).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-1",
    "text": "[docs/legal/cgv-audit.md § Verdict global] CGV **solides et bien structurées** : 14 articles couvrant l'essentiel. Pas de manque critique bloquant. **3 corrections de fond** à traiter (dont 1 erreur factuelle sur Iguana) + quelques compléments. Détail ci-dessous.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-2",
    "text": "[docs/legal/cgv-audit.md § Ce qui est BIEN couvert ✅] | Sujet | Article | Note |\n|---|---|---|\n| Identité prestataire | 1 | OK (manque SIRET — voir plus bas) |\n| Formation du contrat / paiement Stripe immédiat | 3, 4 | Clair |\n| Taxe de séjour (distinction OTA vs direct) | 4 | Très bien traité |\n| Pas de stockage carte (Stripe) | 4 | OK |\n| **Caution** (pré-autorisation, levée J+3, contestation 8 j) | 5 | Complet |\n| **Annulation** (barème + force majeure + rétractation L.221-28) | 6 | Complet et cohérent |\n| Obligations voyageur / propriétaire | 7, 8 | OK |\n| **Responsabilités** (panne équipements, dommages voyageur) | 9 | OK |\n| Animaux | 10 | OK |\n| Check-in 17h / check-out 12h | 11 | OK ",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-3",
    "text": "[docs/legal/cgv-audit.md § Ce qui MANQUE ou est à CORRIGER › 🔴 F1 — Erreur factuelle : Villa Iguana (art. 2, ligne 136)] La CGV indique : *« Villa Iguana — Sainte-Luce (97228) — **location longue durée uniquement** »*.\n**Problème** : Iguana est une **location saisonnière** (résidence Amaryllis, Sainte-Luce), capacité 6, prix saisonnier (`_biens.js`). La mention « longue durée uniquement » est fausse et contredit le reste du site (tunnel direct, fiche bien).\n**Correctif** — remplacer la ligne par :\n> `<Li><strong>Villa Iguana</strong> — Sainte-Luce, Martinique (97228)</Li>`",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-4",
    "text": "[docs/legal/cgv-audit.md § Ce qui MANQUE ou est à CORRIGER › 🔴 F2 — Acompte / solde absents (art. 4)] Le tunnel direct applique **40 % à la réservation / 60 % à J-30**, mais la CGV ne mentionne que « paiement débité immédiatement » (art. 3). Incohérence avec le produit réel et le contrat (`contrat-PRET-A-REMPLIR.md` art. 6).\n**Correctif** — ajouter dans l'article 4 (Prix et paiement) :\n> **Acompte et solde :** Pour les réservations en direct, un **acompte de 40 %** du montant total est prélevé à la réservation pour la confirmer. Le **solde de 60 %** est prélevé automatiquement **au plus tard 30 jours avant l'arrivée**. Pour une réservation effectuée à moins de 30 jours de l'arrivée, la tota",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-5",
    "text": "[docs/legal/cgv-audit.md § Ce qui MANQUE ou est à CORRIGER › 🟠 F3 — Cohérence du barème caution / annulation entre CGV et contrat] La CGV (annulation ≥30 j / 15-29 j / <15 j ; caution levée J+3 ; contestation 8 j) et le contrat prêt-à-remplir ont été **alignés** sur ces mêmes valeurs. ✅ Bon point — **à maintenir** : toute évolution doit être répercutée dans les deux documents simultanément.",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-6",
    "text": "[docs/legal/cgv-audit.md § Ce qui MANQUE ou est à CORRIGER › 🟠 F4 — RGPD (art. 12) trop léger vs le traitement réel] L'art. 12 ne liste ni les **durées de conservation** (10 ans comptable / 3 ans relation client) ni les **sous-traitants** (Stripe, Beds24, Cloudflare, Google), alors que le contrat et le registre les détaillent.\n**Correctif** — compléter l'art. 12 :\n> Les données sont conservées **3 ans** après le dernier contact (relation client) et **10 ans** pour les pièces comptables (art. L.123-22 C. com.). Sous-traitants : Stripe (paiement), Beds24 (réservations), Cloudflare (hébergement), Google Workspace. Réclamation possible auprès de la **CNIL**.",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-7",
    "text": "[docs/legal/cgv-audit.md § Ce qui MANQUE ou est à CORRIGER › 🟡 F5 — Mentions légales / SIRET] Art. 1 renvoie l'adresse « sur demande » (acceptable pour un particulier) mais **aucun SIRET** n'apparaît. Dès l'immatriculation (cf. `plan-action-declarations.md`), ajouter le **SIRET** à l'art. 1 — obligatoire pour un professionnel encaissant en ligne (art. L.111-1 Code conso).",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-8",
    "text": "[docs/legal/cgv-audit.md § Ce qui MANQUE ou est à CORRIGER › 🟡 F6 — N° de déclaration de meublé] Les CGV ne mentionnent pas le n° de déclaration. Ce n'est pas le rôle des CGV (il va sur chaque **fiche bien** + annonces), mais on peut ajouter une phrase générique à l'art. 2 :\n> Chaque hébergement fait l'objet d'une déclaration de meublé de tourisme ; le numéro est indiqué sur la fiche du bien concerné.",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-9",
    "text": "[docs/legal/cgv-audit.md § Ce qui MANQUE ou est à CORRIGER › 🟡 F7 — Heures check-in CGV (17h/12h) vs contrat (16h dans l'ancien modèle)] La CGV dit **17h / 12h**. Le contrat prêt-à-remplir a été aligné sur **17h / 12h**. ✅ Cohérent. *(L'ancien modèle `contrat-location-meuble-tourisme.md` mentionnait 16h/11h — à harmoniser si encore utilisé.)*\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-cgv-audit-md-10",
    "text": "[docs/legal/cgv-audit.md § Synthèse priorisée] | # | Sujet | Gravité | Action |\n|---|---|---|---|\n| F1 | Iguana « longue durée uniquement » = faux | 🔴 | Corriger art. 2 |\n| F2 | Acompte 40 % / solde 60 % J-30 absent | 🔴 | Ajouter à l'art. 4 |\n| F4 | RGPD sans durées ni sous-traitants | 🟠 | Compléter art. 12 |\n| F5 | SIRET absent | 🟡 | Ajouter dès immatriculation |\n| F3/F7 | Cohérence CGV ↔ contrat | 🟠 | Déjà alignés — à maintenir |\n| F6 | N° déclaration | 🟡 | Phrase générique optionnelle art. 2 |\n\n> Validation avocat recommandée avant mise en production des modifications, notamment art. 4 (acompte/solde) et art. 6 (annulation).",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/cgv-audit.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-0",
    "text": "[docs/legal/checklist-declarations-meuble.md § Introduction] # Checklist des déclarations & obligations — 7 meublés de tourisme\n\n> ⚠️ **AVERTISSEMENT — AIDE OPÉRATIONNELLE, PAS UN AVIS D'AVOCAT.**\n> Checklist actionnable par bien, à jour au 2026-06-02. Sources : Code du tourisme (art. L.324-1-1 et s., R.324-1-2), loi n° 2024-1039 du 19/11/2024 (« loi Le Meur »), CCH (art. L.631-7 et s.). Les **tarifs de taxe de séjour ne sont pas chiffrés ici** : ils dépendent de délibérations locales (cf. `docs/taxe-sejour-note.md` — ne jamais inventer un montant). À valider par un professionnel du droit / expert-comptable.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-1",
    "text": "[docs/legal/checklist-declarations-meuble.md § 0. Légende statuts] - 🔴 **À FAIRE — urgent** (risque d'amende immédiat)\n- 🟠 **À FAIRE — court terme**\n- 🟡 **À vérifier / arbitrer**\n- ✅ **Fait** (à confirmer par Vincent)\n\n> ⚠️ **Point bloquant transverse : localisation de Villa Iguana.** `functions/api/_biens.js` situe Iguana à **Sainte-Luce**, mais le brief et le routing SEO (`guide-le-diamant`) la situent **au Diamant**. La commune de déclaration ET de taxe de séjour en dépend. **À trancher avant toute déclaration.** Ci-dessous, Iguana est listée « Le Diamant (à confirmer) ».\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-2",
    "text": "[docs/legal/checklist-declarations-meuble.md § 1. Tableau de synthèse — déclaration mairie & numéro] | Bien | Commune | Déclaration mairie (L.324-1-1) | N° déclaration / enregistrement | N° affiché sur annonces (site + OTA) | Changement d'usage | Statut |\n|---|---|---|---|---|---|---|\n| Villa Amaryllis | Sainte-Luce (972) | Obligatoire (Cerfa 14004 / téléservice) | **[à obtenir]** | **[à intégrer]** | Non requis (hors zone tendue) | 🔴 |\n| Villa Iguana | Le Diamant (972) *(à confirmer)* | Obligatoire | **[à obtenir]** | **[à intégrer]** | Non requis | 🔴 |\n| Zandoli | Sainte-Luce (972) | Obligatoire | **[à obtenir]** | **[à intégrer]** | Non requis | 🔴 |\n| Géko | Sainte-Luce (972) | Obligat",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-3",
    "text": "[docs/legal/checklist-declarations-meuble.md § 2. Détail par bien › 2.1 — Villa Amaryllis (Sainte-Luce, 972) · capacité 8 · piscine débordement eau salée] - 🔴 Déclarer en mairie de Sainte-Luce → obtenir le **n° de déclaration**.\n- 🟠 Intégrer le n° sur la fiche site + Airbnb + Booking.\n- 🟠 **DPE** : faire réaliser un diagnostic (loi Le Meur — passoires interdites progressivement).\n- 🟡 **Classement Atout France** : à arbitrer (impact fiscal micro-BIC + taxe de séjour).\n- 🟠 **Taxe de séjour** Sainte-Luce : confirmer l'autorité bénéficiaire (commune vs Espace Sud/CAESM) + tarif ; collecter sur les **résas directes**.",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-4",
    "text": "[docs/legal/checklist-declarations-meuble.md § 2. Détail par bien › 2.2 — Villa Iguana (Le Diamant ?, 972) · capacité 6 · piscine eau salée] - 🔴 **Trancher la commune réelle** (Le Diamant vs Sainte-Luce) — corriger `_biens.js` si Le Diamant.\n- 🔴 Déclarer dans la **bonne** mairie → n° de déclaration.\n- 🟠 N° sur annonces · 🟠 DPE · 🟡 Classement.\n- 🟠 Taxe de séjour de la commune retenue (Le Diamant relève d'un EPCI distinct de Sainte-Luce — **ne pas reverser à la mauvaise collectivité**).",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-5",
    "text": "[docs/legal/checklist-declarations-meuble.md § 2. Détail par bien › 2.3 — Zandoli (Sainte-Luce, 972) · capacité 5 · piscine cascade] - 🔴 Déclaration mairie Sainte-Luce → n°. · 🟠 N° annonces · 🟠 DPE · 🟡 Classement.\n- 🟠 Taxe de séjour Sainte-Luce (résas directes).",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-6",
    "text": "[docs/legal/checklist-declarations-meuble.md § 2. Détail par bien › 2.4 — Géko (Sainte-Luce, 972) · capacité 4 · piscine cascade] - 🔴 Déclaration mairie Sainte-Luce → n°. · 🟠 N° annonces · 🟠 DPE · 🟡 Classement.\n- 🟠 Taxe de séjour Sainte-Luce (résas directes).",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-7",
    "text": "[docs/legal/checklist-declarations-meuble.md § 2. Détail par bien › 2.5 — Mabouya (Sainte-Luce, 972) · capacité 2 · jacuzzi (aucune piscine)] - 🔴 Déclaration mairie Sainte-Luce → n°. · 🟠 N° annonces · 🟠 DPE · 🟡 Classement.\n- 🟠 Taxe de séjour Sainte-Luce (résas directes).",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-8",
    "text": "[docs/legal/checklist-declarations-meuble.md § 2. Détail par bien › 2.6 — Bellevue (Schœlcher, 972) · appartement de standing · vue baie] - 🔴 Déclaration : **confirmer l'autorité** — commune de Schœlcher **ou CACEM** (la compétence taxe de séjour est souvent à l'agglomération). Déclarer auprès de la bonne entité → n°.\n- 🟠 N° annonces · 🟠 DPE · 🟡 Classement.\n- 🟠 **Taxe de séjour** : confirmer en priorité si collectée/reversée par la **CACEM** (≠ commune) — voir `docs/taxe-sejour-note.md`.\n- 🟡 Capacité max à renseigner (`_biens.js` ne la précise pas).",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-9",
    "text": "[docs/legal/checklist-declarations-meuble.md § 2. Détail par bien › 2.7 — Appartement Nogent-sur-Marne (94) · jardin + terrasse — CAS PARTICULIER] - 🔴 **Déclaration + n° d'enregistrement** via la téléprocédure de Nogent (commune avec procédure d'enregistrement).\n- 🔴 **Plafond 120 nuits/an** : c'est la **résidence principale** de Vincent → location meublé de tourisme limitée à **120 nuits/an** (L.324-1-1). Au-delà : perte de l'exemption de changement d'usage + risque accru.\n  - **Action** : tenir un **compteur de nuitées** (toutes plateformes confondues + direct) et bloquer au-delà de 120.\n- 🟠 N° d'enregistrement sur **toutes** les annonces.\n- 🟠 **DPE** : prioritaire ici (zone tendue IDF,",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-10",
    "text": "[docs/legal/checklist-declarations-meuble.md § 3. Obligations transverses (tous biens)] | Obligation | Détail | Statut |\n|---|---|---|\n| **SIRET / immatriculation** | Activité de location meublée régulière = activité commerciale → immatriculation requise (guichet unique INPI). Conditionne CFE, micro-BIC, déclarations. | 🔴 (à voir avec expert-comptable) |\n| **Régime fiscal micro-BIC** | Loi Le Meur : non classé = abattement **30 %** (plafond 15 000 €) ; classé = **50 %** (plafond 77 700 €). → arbitrer classement Atout France. | 🟡 |\n| **CFE** | Cotisation foncière des entreprises due même sans local dédié dès activité régulière. | 🟠 |\n| **Taxe de séjour — registre** | Tenir un état récapitu",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-checklist-declarations-meuble-md-11",
    "text": "[docs/legal/checklist-declarations-meuble.md § 4. Plan d'action priorisé (ordre conseillé)] 1. 🔴 **Trancher la commune de Villa Iguana** (Le Diamant vs Sainte-Luce) — bloque sa déclaration et sa taxe de séjour.\n2. 🔴 **Déclarer les 7 biens en mairie** (Sainte-Luce, Le Diamant, Schœlcher/CACEM, Nogent) → obtenir les **n°** (risque 450 €/bien).\n3. 🔴 **Nogent** : obtenir le n° d'enregistrement **+ mettre en place le compteur < 120 nuits/an**.\n4. 🟠 **Afficher chaque n° sur le site + Airbnb + Booking** dès obtention (risque 12 500 €). *(Intégration technique : fiches biens + footer.)*\n5. 🟠 **Clarifier l'autorité de taxe de séjour** par commune (Sainte-Luce, Le Diamant, Schœlcher→CACEM, Nogent",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/checklist-declarations-meuble.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-0",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Introduction] # Contrat de location saisonnière — PRÊT À REMPLIR\n\n> ⚠️ **MODÈLE / AIDE — PAS UN AVIS D'AVOCAT.** À faire valider par un professionnel du droit avant usage en production (clauses annulation, caution, responsabilité). Version dérivée de `docs/legal/contrat-location-meuble-tourisme.md`. Faits par bien : `functions/api/_biens.js`.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-1",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Comment l'utiliser (3 étapes)] 1. **Copier** ce contrat, **remplir uniquement les champs `[À COMPLÉTER : …]`** (identité voyageur, dates, montants, caution, n° de déclaration du bien). Le reste du texte est figé — ne pas y toucher.\n2. **Choisir le barème** : acompte **40 %** à la réservation, **solde 60 % à J-30** (déjà branché dans le tunnel direct). Calculer le ménage, la taxe de séjour (ligne distincte) et la caution selon le bien.\n3. **Envoyer pour signature** (PDF ou signature électronique). Garder un exemplaire signé + l'inventaire d'entrée (Annexe 1).\n\n> 📌 **Sans n° de déclaration du meublé sur le contrat ET sur les annonces, vous êtes en infra",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-2",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Entre les soussignés] **LE BAILLEUR**\n- Vincent SALOMON — **Amaryllis Locations**\n- Adresse : `[À COMPLÉTER : adresse du bailleur]`, Martinique\n- SIRET : `[À COMPLÉTER : n° SIRET]`\n- Email : contact@villamaryllis.com — Tél. / WhatsApp : +33 6 10 88 07 72\n- Qualité : propriétaire louant en direct, sans intermédiaire (hors loi Hoguet)\n\nCi-après « **le Bailleur** ».\n\n**LE LOCATAIRE**\n- Nom et prénom : `[À COMPLÉTER : nom du locataire]`\n- Adresse : `[À COMPLÉTER : adresse complète]`\n- Email : `[À COMPLÉTER : email]` — Téléphone : `[À COMPLÉTER : téléphone]`\n- Pièce d'identité (type + n°) : `[À COMPLÉTER]`\n\nCi-après « **le Locataire** ».\n\nIl a été convenu c",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-3",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 1 — Désignation du logement] - Désignation : **`[À COMPLÉTER : nom du bien — ex. Villa Amaryllis]`**\n- Adresse exacte : `[À COMPLÉTER : adresse]`, `[À COMPLÉTER : code postal]` `[À COMPLÉTER : commune]`\n- Type / surface / chambres : `[À COMPLÉTER]`\n- Équipements principaux : `[À COMPLÉTER — conforme à _biens.js, ne pas surévaluer]`\n- **Numéro de déclaration de meublé de tourisme : `[À COMPLÉTER : n° de déclaration en mairie]`**\n- DPE : classe `[À COMPLÉTER : A à G]` — Classement Atout France : `[À COMPLÉTER : non classé / N étoiles]`\n\nLe logement est loué **meublé et équipé** pour un usage d'habitation **temporaire et de loisirs**. Cette locati",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-4",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 2 — Durée et dates du séjour] - Arrivée (check-in) : **`[À COMPLÉTER : JJ/MM/AAAA]` à partir de 17h00**\n- Départ (check-out) : **`[À COMPLÉTER : JJ/MM/AAAA]` avant 12h00**\n- Durée totale : **`[À COMPLÉTER : N]` nuit(s)**\n\nLe séjour est ferme. Toute prolongation nécessite l'accord écrit préalable du Bailleur et une facturation complémentaire.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-5",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 3 — Nombre d'occupants] Le logement ne peut être occupé que par **`[À COMPLÉTER : N]` personne(s) maximum** (capacité de couchage du bien, enfants et nourrissons compris). Tout dépassement non autorisé permet au Bailleur de refuser l'accès ou de résilier sans remboursement. Sous-location et cession interdites.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-6",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 4 — Prix et détail des sommes dues] | Poste | Montant |\n|---|---|\n| Loyer (`[À COMPLÉTER : N]` nuits) | **`[À COMPLÉTER : montant]` €** |\n| Forfait ménage de fin de séjour | **`[À COMPLÉTER : montant]` €** |\n| Charges incluses (eau, électricité usage normal, wifi) | incluses |\n| **Sous-total séjour** | **`[À COMPLÉTER : montant]` €** |\n| Taxe de séjour (art. 5) | **`[À COMPLÉTER : montant]` €** |\n| **TOTAL À PAYER** | **`[À COMPLÉTER : montant TTC]` €** |\n| Dépôt de garantie / caution (non débité — art. 7) | **`[À COMPLÉTER : montant]` €** |\n\nLe prix s'entend **sans frais de service ni commission d'intermédiaire** (réservation en direct).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-7",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 5 — Taxe de séjour] La taxe de séjour est **due par le Locataire** et **perçue par le Bailleur** pour le compte de la collectivité bénéficiaire `[À COMPLÉTER : commune / EPCI — Sainte-Luce, CACEM-Schœlcher, EPT Nogent]`, puis reversée.\n\n- Tarif applicable : `[À COMPLÉTER : € / nuitée / personne]` × `[À COMPLÉTER : N nuitées]` × `[À COMPLÉTER : N personnes assujetties]`.\n- Personnes exonérées : `[À COMPLÉTER : mineurs et autres cas légaux]`.\n- **Montant total taxe de séjour : `[À COMPLÉTER : montant]` €** (ligne distincte du loyer).\n\n*Réservation via Airbnb/Booking : la plateforme collecte et reverse elle-même — ne pas collecter en direct (évite",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-8",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 6 — Modalités de paiement (acompte 40 % / solde 60 %)] - **Acompte : 40 % du total séjour, soit `[À COMPLÉTER : montant]` €**, à la réservation, pour confirmer la réservation.\n- **Solde : 60 %, soit `[À COMPLÉTER : montant]` €**, au plus tard **à J-30 avant l'arrivée** (`[À COMPLÉTER : date limite JJ/MM/AAAA]`).\n- Moyens de paiement : carte bancaire via **Stripe** (sécurisé) ou virement.\n- À défaut de paiement du solde à l'échéance, le Bailleur peut considérer la réservation comme **annulée par le Locataire** (art. 8) et conserver l'acompte.\n\n*Les sommes versées d'avance sont qualifiées d'**arrhes** (art. 1590 Code civil), sauf mention « acompt",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-9",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 7 — Dépôt de garantie (caution)] - Montant : **`[À COMPLÉTER : montant]` €**.\n- Modalité : **pré-autorisation bancaire via Stripe** (empreinte de carte) — somme **non débitée**, seulement bloquée puis libérée.\n- Libération sous **3 jours** après le départ, déduction faite (sur justificatifs) des dégradations, casses, pertes, ménage excessif ou nuitées supplémentaires.\n- En cas de litige, le Bailleur fournit le **détail chiffré et les justificatifs**. Toute contestation par écrit dans les **8 jours** suivant la notification.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-10",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 8 — Conditions d'annulation] | Annulation par le Locataire | Conséquence |\n|---|---|\n| **≥ 30 jours** avant l'arrivée | Remboursement intégral (hors frais bancaires éventuels) |\n| **Entre 15 et 29 jours** avant l'arrivée | Remboursement de **50 %** du total |\n| **< 15 jours** avant l'arrivée ou no-show | **Aucun remboursement** (100 % dû) |\n\n**Annulation par le Bailleur** (force majeure, sinistre rendant le logement indisponible) : **remboursement intégral** des sommes versées, sans autre indemnité.\n\n**Force majeure côté Locataire** (catastrophe naturelle, fermeture administrative, épidémie reconnue) : au choix du Locataire, **report** du séjou",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-11",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 9 — État des lieux et inventaire] Un **état des lieux et un inventaire** sont établis contradictoirement à l'entrée puis à la sortie (photos datées / fiche signée acceptées). À défaut d'observation du Locataire dans les **24 heures** suivant l'arrivée, le logement est réputé conforme. Inventaire en **Annexe 1**.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-12",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 10 — Règlement intérieur (Annexe 2)] - **Non-fumeur** à l'intérieur.\n- **Fêtes, soirées et événements interdits** ; nuisances sonores proscrites, surtout la nuit.\n- **Animaux** : non acceptés sauf accord écrit préalable du Bailleur.\n- **Capacité max** strictement respectée (art. 3).\n- Piscine / jacuzzi (selon le bien) sous la **surveillance et la responsabilité du Locataire**, notamment pour les enfants. Aucune baignade non surveillée.\n- Tri des déchets et consignes locales respectés.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-13",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 11 — Assurance et responsabilité] Le Locataire est **responsable** des dommages causés au logement, au mobilier et aux équipements. Il déclare détenir une **assurance responsabilité civile / villégiature** et s'engage à en justifier sur demande. Le Bailleur **décline toute responsabilité** en cas de vol, perte ou dommage aux effets personnels du Locataire, ou d'accident résultant d'un usage non conforme des équipements.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-14",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 12 — Données personnelles (RGPD)] Données traitées (identité, coordonnées, dates, bien, données de paiement via Stripe) par le Bailleur **responsable de traitement**, pour la gestion de la réservation, du séjour, de la facturation et des obligations comptables/fiscales/taxe de séjour.\n\n- **Bases légales** : exécution du contrat (6.1.b) + obligation légale (6.1.c).\n- **Conservation** : relation client 3 ans après dernier contact ; factures/pièces comptables 10 ans (art. L.123-22 C. com.).\n- **Sous-traitants** : Stripe, Beds24, Cloudflare, Google Workspace.\n- **Droits** (accès, rectification, effacement, opposition, portabilité) : contact@villama",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-15",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 13 — Spécificité Nogent-sur-Marne (à conserver uniquement pour ce bien)] Le logement de Nogent est la **résidence principale de l'exploitant** : sa location en meublé de tourisme est limitée à **120 nuits par année civile** (art. L.324-1-1). Le Bailleur tient un compteur des nuitées (toutes plateformes + direct) et peut refuser une réservation portant le total au-delà de ce plafond.\n\n*Supprimer cet article pour les biens de Martinique.*\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-16",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Article 14 — Loi applicable, médiation et litiges] Droit français. En cas de litige, recherche d'une solution amiable ; à défaut, recours **gratuit à un médiateur de la consommation** (coordonnées : economie.gouv.fr/mediation-conso) + plateforme européenne de règlement en ligne des litiges.\n\nTribunal compétent : **Tribunal judiciaire de Fort-de-France** (biens Martinique) ou **de Créteil** (Nogent).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-17",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Signatures] Fait à `[À COMPLÉTER : lieu]`, le `[À COMPLÉTER : date]`, en deux exemplaires *(ou signé électroniquement)*.\n\n| Le Bailleur | Le Locataire |\n|---|---|\n| Vincent Salomon — Amaryllis Locations | `[À COMPLÉTER : nom]` |\n| Signature : | Signature *(« Lu et approuvé »)* : |",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-pret-a-remplir-md-18",
    "text": "[docs/legal/contrat-PRET-A-REMPLIR.md § Signatures › Annexes] - **Annexe 1** — Inventaire et état des lieux d'entrée\n- **Annexe 2** — Règlement intérieur du logement\n- **Annexe 3** — Justificatif de classement Atout France (le cas échéant)\n\n> **Rappel** : tenir à jour le n° de déclaration par bien (`docs/legal/plan-action-declarations.md`). Sans lui, contrat et annonces sont en infraction.",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-PRET-A-REMPLIR.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-0",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Introduction] # Modèle de contrat de location saisonnière — Meublé de tourisme\n\n> ⚠️ **AVERTISSEMENT — MODÈLE, PAS UN AVIS D'AVOCAT.**\n> Ce document est un **gabarit réutilisable** rédigé à titre informatif pour les 7 biens d'Amaryllis Locations. Il **doit être relu et validé par un avocat ou un notaire** avant tout usage en production, en particulier les clauses d'annulation, de caution et de responsabilité, qui engagent juridiquement le bailleur. Rédigé le 2026-06-02. Sources : Code du tourisme (art. L.324-1-1 et s.), loi n° 2024-1039 du 19/11/2024 dite « loi Le Meur », loi n° 70-9 du 02/01/1970 dite « loi Hoguet », Code civil, Code de la c",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-1",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Notice d'emploi (à supprimer du contrat envoyé au voyageur) › Champs variables — à renseigner par bien à chaque location] Tous les champs entre `[crochets]` sont à compléter. Référentiel des faits par bien : `functions/api/_biens.js` (source de vérité — capacités, équipements). **Ne jamais surévaluer la capacité max** (mensonge contractuel + risque assurance).\n\n| Bien (id) | Désignation officielle | Commune | Capacité max | Équipement clé | Interdits à ne pas promettre |\n|---|---|---|---|---|---|\n| `amaryllis` | Villa Amaryllis | Sainte-Luce (972) | **8** (3 ch.) | Piscine à débordement eau salée 4×7 m | Pas de jacuzzi |\n| `iguana` | Villa Ig",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-2",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Notice d'emploi (à supprimer du contrat envoyé au voyageur) › Quel jeu de clauses appliquer ?] - **Biens Martinique (Amaryllis, Iguana, Zandoli, Géko, Mabouya, Bellevue)** → utiliser la **VARIANTE A — Meublé de tourisme (location saisonnière courte durée)**, qui inclut la collecte de la taxe de séjour pour les réservations en direct.\n- **Nogent-sur-Marne** → deux cas, voir **VARIANTE B** :\n  - *B1* : location **saisonnière** (courte durée, meublé de tourisme) → résidence principale de l'exploitant, **plafond 120 nuits/an** à respecter, taxe de séjour applicable.\n  - *B2* : location **longue durée** (bail meublé loi ALUR > 1 an, ou bail mobili",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-3",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Notice d'emploi (à supprimer du contrat envoyé au voyageur) › Loi Hoguet — bailleur en direct] Vincent Salomon loue **ses propres biens en direct**, sans mandat d'agence immobilière. Il n'exerce donc **pas** l'activité d'intermédiaire réglementée par la loi Hoguet (pas de carte professionnelle requise). Le contrat est conclu **directement entre le propriétaire-bailleur et le voyageur**. À ne pas confondre avec les réservations via OTA (Airbnb/Booking), qui relèvent des CGU de la plateforme et non du présent contrat.\n\n---\n\n# CONTRAT DE LOCATION SAISONNIÈRE D'UN MEUBLÉ DE TOURISME",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-4",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Entre les soussignés] **LE BAILLEUR**\n- Nom / dénomination : **Vincent SALOMON — Amaryllis Locations**\n- Adresse : [adresse du bailleur], 97228 Sainte-Luce, Martinique\n- SIRET : [n° SIRET — à immatriculer, voir checklist déclarations]\n- Email : contact@villamaryllis.com — Téléphone : [téléphone]\n- Qualité : propriétaire louant en direct, sans intermédiaire (hors loi Hoguet)\n\nCi-après « **le Bailleur** »,\n\n**LE LOCATAIRE**\n- Nom et prénom : [nom du locataire]\n- Adresse : [adresse complète]\n- Email : [email] — Téléphone : [téléphone]\n- Pièce d'identité (type + n°) : [à renseigner pour les besoins du registre éventuel]\n\nCi-après « **le Locataire",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-5",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 1 — Désignation du logement] Le Bailleur loue au Locataire le meublé de tourisme suivant :\n- Désignation : **[nom du bien — ex. Villa Amaryllis]**\n- Adresse exacte : [adresse complète], [code postal] [commune]\n- Type : [villa / logement / studio / appartement]\n- Surface habitable : [m²] — Nombre de pièces / chambres : [nb]\n- Équipements principaux : [ex. piscine à débordement eau salée 4×7 m] (conforme à `_biens.js`)\n- **Numéro de déclaration de meublé de tourisme** : **[n° de déclaration en mairie]**\n  *(obligatoire — art. L.324-1-1 IV Code du tourisme ; doit aussi figurer sur toutes les annonces)*\n- Classement Atout France (le cas é",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-6",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 2 — Durée et dates du séjour] - Date d'arrivée (check-in) : **[JJ/MM/AAAA] à partir de [16h00]**\n- Date de départ (check-out) : **[JJ/MM/AAAA] avant [11h00]**\n- Durée totale : **[N] nuit(s)**\n\nLe séjour est ferme. Toute prolongation doit faire l'objet d'un accord écrit préalable du Bailleur et donne lieu à facturation complémentaire.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-7",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 3 — Nombre d'occupants] Le logement ne peut être occupé que par **[N] personne(s) maximum** (capacité de couchage de [nom du bien] = **[capacité de `_biens.js`]**), enfants et nourrissons compris sauf mention contraire.\n\nTout dépassement non autorisé du nombre d'occupants autorise le Bailleur à **refuser l'accès** ou à **résilier le contrat sans remboursement**. La sous-location et la cession du contrat sont interdites.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-8",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 4 — Prix et détail des sommes dues] | Poste | Montant |\n|---|---|\n| Loyer de la location ([N] nuits) | **[montant] €** |\n| Forfait ménage (fin de séjour) | **[montant] €** |\n| Charges incluses (eau, électricité, wifi, …) | **incluses** *(ou : [montant])* |\n| **Sous-total séjour** | **[montant] €** |\n| Taxe de séjour (voir art. 5) | **[montant] €** |\n| **TOTAL À PAYER** | **[montant TTC] €** |\n| Dépôt de garantie / caution (non encaissé — voir art. 7) | **[montant] €** |\n\nLe prix s'entend **sans frais de service** ni commission d'intermédiaire (réservation en direct).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-9",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 5 — Taxe de séjour] > Référence : note `docs/taxe-sejour-note.md` (tarifs à confirmer auprès de chaque commune/EPCI — ne jamais inventer un montant).",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-10",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 5 — Taxe de séjour › VARIANTE A — Biens Martinique + Nogent en courte durée] La **taxe de séjour est due par le Locataire** (voyageur hébergé à titre onéreux). Elle est **perçue par le Bailleur** pour le compte de **[commune / EPCI bénéficiaire : Sainte-Luce / CACEM-Schœlcher / Espace Sud / Nogent-EPT — à confirmer]**, puis reversée à la collectivité.\n\n- Mode de calcul : **tarif par nuitée et par personne** × nombre de nuitées × nombre de personnes assujetties.\n- Tarif applicable : **[tarif officiel] € / nuitée / personne** *(dépend du classement Atout France — barème de la délibération en vigueur)*.\n- Personnes exonérées : [mineurs e",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-11",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 5 — Taxe de séjour › VARIANTE B2 — Nogent en bail longue durée] Sans objet : la taxe de séjour ne s'applique pas à une location d'habitation longue durée. *(Dans ce cas, utiliser un bail d'habitation dédié, pas ce gabarit.)*\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-12",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 6 — Modalités de paiement (acompte / solde)] - **Acompte / arrhes** : **[30] %** du total séjour, soit **[montant] €**, à la réservation, pour confirmer la réservation.\n- **Solde** : **[montant] €**, au plus tard **[à J-30 / J-7]** avant l'arrivée.\n- Moyens de paiement : carte bancaire via **Stripe** (paiement sécurisé) ou [virement].\n- À défaut de paiement du solde à l'échéance, le Bailleur peut considérer la réservation comme **annulée par le Locataire** (art. 8) et conserver l'acompte.\n\n*Nature des sommes versées d'avance : qualifiées d'**arrhes** (art. 1590 Code civil), sauf mention « acompte » expresse. Préciser le régime retenu,",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-13",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 7 — Dépôt de garantie (caution)] - Montant : **[montant] €**.\n- Modalité : **pré-autorisation bancaire via Stripe** (empreinte de carte). La somme **n'est pas débitée** ; elle est seulement bloquée puis libérée.\n- Restitution / libération : sous **[7] jours** après l'état des lieux de sortie, déduction faite, le cas échéant et sur justificatifs, du coût des **dégradations, casses, pertes, ménage excessif ou nuitées supplémentaires** constatés.\n- En cas de litige sur une retenue, le Bailleur fournit au Locataire le **détail chiffré et les justificatifs** des sommes retenues.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-14",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 8 — Conditions d'annulation] | Annulation par le Locataire | Conséquence |\n|---|---|\n| Plus de **[30] jours** avant l'arrivée | Remboursement de l'acompte, **hors** frais bancaires éventuels |\n| Entre **[30] et [7] jours** avant l'arrivée | Acompte conservé par le Bailleur |\n| Moins de **[7] jours** avant l'arrivée ou no-show | **100 %** du séjour dû |\n\n**Annulation par le Bailleur** : en cas d'impossibilité de fournir le logement (force majeure, sinistre), le Bailleur **rembourse l'intégralité des sommes versées**, sans autre indemnité.\n\n**Information précontractuelle** : pour une réservation conclue à distance entre un professionnel",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-15",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 9 — État des lieux et inventaire] Un **état des lieux et un inventaire** du mobilier et des équipements sont établis **contradictoirement à l'entrée** puis **à la sortie** (ou par tout moyen probant : photos datées, fiche signée). À défaut d'observation du Locataire dans les **[24] heures** suivant l'arrivée, le logement est réputé conforme à l'inventaire d'entrée.\n\nL'inventaire est annexé au présent contrat (**Annexe 1**). *Référence opérationnelle interne : `docs/checklist-etat-des-lieux.md`.*\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-16",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 10 — Règlement intérieur] Le Locataire s'engage à respecter le règlement intérieur (**Annexe 2**), et notamment :\n- **Non-fumeur** à l'intérieur du logement.\n- **Fêtes, soirées et événements interdits** ; nuisances sonores proscrites, en particulier la nuit (respect du voisinage).\n- **Animaux** : [autorisés sous conditions / interdits — à préciser par bien].\n- **Capacité max** strictement respectée (art. 3).\n- Usage des équipements (piscine / jacuzzi selon le bien — voir `_biens.js`) sous la **surveillance et la responsabilité du Locataire**, notamment pour les enfants. Aucune baignade non surveillée.\n- Tri des déchets et respect des ",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-17",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 11 — Assurance et responsabilité] Le Locataire est **responsable** des dommages causés au logement, à son mobilier et à ses équipements pendant le séjour. Il déclare être **titulaire d'une assurance responsabilité civile** couvrant les risques locatifs (ou « villégiature ») et s'engage à en justifier sur demande. Le Bailleur **décline toute responsabilité** en cas de vol, perte ou dommage aux effets personnels du Locataire, ainsi qu'en cas d'accident résultant d'un usage non conforme des équipements.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-18",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 12 — Données personnelles (RGPD)] Les données collectées (identité, coordonnées, dates et bien réservé, données de paiement traitées par Stripe) sont traitées par le Bailleur, **responsable de traitement**, aux fins de **gestion de la réservation, du séjour, de la facturation et du respect de ses obligations comptables, fiscales et de collecte de la taxe de séjour**.\n\n- **Bases légales** : exécution du contrat (art. 6.1.b RGPD) et obligation légale (art. 6.1.c).\n- **Durées de conservation** : données de réservation/relation client jusqu'à **3 ans** après le dernier contact ; **factures et pièces comptables : 10 ans** (art. L.123-22 Co",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-19",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 13 — Spécificité Nogent-sur-Marne (VARIANTE B1 uniquement)] Le logement de Nogent-sur-Marne constitue la **résidence principale** de l'exploitant. À ce titre, sa location en meublé de tourisme est limitée à **120 nuits par année civile** (art. L.324-1-1 Code du tourisme). Le Bailleur tient un **compteur des nuitées** et se réserve le droit de refuser une réservation portant le total au-delà de ce plafond. Le logement est situé en zone d'**encadrement des loyers d'Île-de-France** (pertinent pour une location longue durée — VARIANTE B2).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-20",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Article 14 — Loi applicable, médiation et litiges] Le présent contrat est soumis au **droit français**. La Martinique relève intégralement du droit français (collectivité territoriale unique).\n\nEn cas de litige, le Locataire consommateur peut recourir **gratuitement à un médiateur de la consommation** : **[nom et coordonnées du médiateur — à désigner ; obligatoire pour un professionnel, art. L.612-1 Code de la consommation]**, ainsi qu'à la plateforme européenne de règlement en ligne des litiges (RLL).\n\nÀ défaut de résolution amiable, **[le tribunal compétent / le tribunal du lieu de situation de l'immeuble]** est saisi.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-21",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Signatures] Fait à [lieu], le [date], en deux exemplaires *(ou signé électroniquement via [Yousign / Dropbox Sign])*.\n\n| Le Bailleur | Le Locataire |\n|---|---|\n| Vincent Salomon — Amaryllis Locations | [Nom] |\n| Signature : | Signature *(précédée de « Lu et approuvé »)* : |\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-contrat-location-meuble-tourisme-md-22",
    "text": "[docs/legal/contrat-location-meuble-tourisme.md § Signatures › Annexes] - **Annexe 1** — Inventaire et état des lieux d'entrée (réf. `docs/checklist-etat-des-lieux.md`)\n- **Annexe 2** — Règlement intérieur du logement\n- **Annexe 3** — Justificatif de classement Atout France (le cas échéant)\n\n---\n\n> **Rappel final** : faire valider ce gabarit par un professionnel du droit avant mise en production (clauses d'annulation, médiation, caution, responsabilité). Tenir à jour le **n° de déclaration de meublé de tourisme** par bien (cf. `docs/legal/checklist-declarations-meuble.md`) — sans lui le contrat et les annonces sont en infraction (art. L.324-1-1).",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/contrat-location-meuble-tourisme.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-0",
    "text": "[docs/legal/plan-action-declarations.md § Introduction] # Plan d'action — Déclarer & classer les meublés de tourisme (étape par étape)\n\n> ⚠️ **AIDE OPÉRATIONNELLE — PAS UN AVIS D'AVOCAT.** Sources : Code du tourisme (art. L.324-1-1 et s., R.324-1-2), loi n° 2024-1039 du 19/11/2024 (« loi Le Meur »), décret n° 2026-196 du 19/03/2026 (enregistrement national), CGI art. 50-0 (micro-BIC), CGCT (taxe de séjour), CCH. **Tarifs de taxe de séjour à confirmer auprès des collectivités** (`docs/taxe-sejour-note.md`) — ne jamais inventer un montant. À valider par un avocat / expert-comptable.\n>\n> 🗓️ **Mis à jour le 2026-06-04.** Changement majeur depuis la version précédente : l'**enregistrement nation",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-1",
    "text": "[docs/legal/plan-action-declarations.md § 🎯 Périmètre : 6 meublés de tourisme (PAS 7)] | Bien | Commune | Statut location | Dans ce plan ? |\n|---|---|---|---|\n| **Villa Amaryllis** | Sainte-Luce (972) | Courte durée saisonnière | ✅ Oui |\n| **Zandoli** | Sainte-Luce (972) | Courte durée saisonnière | ✅ Oui |\n| **Géko** | Sainte-Luce (972) | Courte durée saisonnière | ✅ Oui |\n| **Mabouya** | Sainte-Luce (972) | Courte durée saisonnière | ✅ Oui |\n| **Bellevue** | Schœlcher (972) | Courte durée saisonnière | ✅ Oui |\n| **Appartement Nogent** | Nogent-sur-Marne (94) | Courte durée saisonnière | ✅ Oui |\n| **Villa Iguana** | Sainte-Luce (972) | **Bail longue durée** | ❌ **HORS périmètre** |\n\n> **Vi",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-2",
    "text": "[docs/legal/plan-action-declarations.md § ⚡ Risque & ordre de priorité (lire en premier)] | Manquement | Sanction (base légale) | Priorité |\n|---|---|---|\n| **Numéro d'enregistrement absent des annonces** (site + Airbnb + Booking) | **jusqu'à 12 500 €** (art. L.324-1-1) | 🔴 **#1 — le plus cher** |\n| Défaut de déclaration / d'enregistrement en mairie | jusqu'à **450 €** ; jusqu'à **5 000 €** en cas de fausse déclaration ou défaut d'enregistrement (loi Le Meur) — *à confirmer selon la procédure communale applicable* | 🔴 #2 |\n| Échéance nationale du **20/05/2026 dépassée** sans enregistrement | Aggrave le risque ci-dessus (le dispositif est désormais opposable) | 🔴 #2 bis |\n| Nogent : dépass",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-3",
    "text": "[docs/legal/plan-action-declarations.md § Étape 1 — Déclarer / enregistrer chaque bien à la bonne mairie] **QUOI** : déclaration de meublé de tourisme (Cerfa **14004*04** « Déclaration en mairie des meublés de tourisme », ou téléservice communal / national selon la commune).\n**OÙ** : commune où se trouve le bien.\n**RÉSULTAT À OBTENIR** : le **numéro de déclaration / d'enregistrement** (récépissé). Gratuit. Conserver le récépissé.\n\n**Pièces / informations à préparer** (selon Cerfa 14004*04 et téléservices) :\n- Identité + coordonnées du déclarant (Vincent Salomon).\n- Adresse précise du meublé + identification du logement.\n- Statut du logement (résidence principale du déclarant ou non — détermi",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-4",
    "text": "[docs/legal/plan-action-declarations.md § Étape 2 — Afficher le numéro PARTOUT (priorité absolue, risque 12 500 €)] Dès qu'un numéro est obtenu, il doit figurer sur **toutes** les annonces du bien :\n1. **Fiche du bien sur villamaryllis.com** (+ footer) — *Vincent fournit le n°, l'intégration technique suit.*\n2. **Annonce Airbnb** du bien.\n3. **Annonce Booking.com** du bien.\n4. **Contrat** de location (`docs/legal/contrat-PRET-A-REMPLIR.md`, art. 1).\n\n> La loi Le Meur **renforce le contrôle** : les plateformes doivent vérifier la présence du numéro et peuvent retirer les annonces non conformes. Un numéro absent = annonce potentiellement désindexée **+** amende jusqu'à 12 500 €.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-5",
    "text": "[docs/legal/plan-action-declarations.md § Étape 3 — DPE par bien] **QUOI** : DPE réalisé par un diagnostiqueur certifié, pour chaque meublé de tourisme. La loi Le Meur (art. L.126-32 CCH) **aligne progressivement la décence énergétique du meublé de tourisme sur la location longue durée**.\n- **Priorité Nogent** (zone tendue IDF, contrôle plus strict).\n- Calendrier d'interdiction des passoires : **G**, puis **F**, puis **E** selon échéances — **confirmer le calendrier exact applicable au meublé de tourisme** (il diffère selon zone tendue / hors zone tendue et selon la date d'entrée en location). → vérifier auprès d'un diagnostiqueur / de la mairie.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-6",
    "text": "[docs/legal/plan-action-declarations.md § Étape 4 — Taxe de séjour (résas DIRECTES uniquement)] **QUOI** : confirmer l'autorité bénéficiaire + le barème par commune, puis collecter / déclarer / reverser **sur les résas du site**. Les OTA (Airbnb/Booking) **collectent et reversent eux-mêmes** → ne **pas** double-collecter ; conserver leurs attestations de reversement.\n\n| Commune | Autorité bénéficiaire à confirmer | Barème | Reversement |\n|---|---|---|---|\n| Sainte-Luce | Commune **ou** Espace Sud / CAESM ❓ | Délibération locale (au réel par nuitée/personne ; barème **non classé** vs **classé** distinct) | Périodicité locale |\n| Schœlcher | Commune **ou CACEM** ❓ (souvent l'agglo) | Délibérat",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-7",
    "text": "[docs/legal/plan-action-declarations.md § Étape 5 — Classement meublé de tourisme (étoiles)] **QUOI** : démarche **volontaire** de classement 1 à 5 étoiles (grille Atout France, **133 critères**), réalisée par un **organisme accrédité COFRAC** (ex. **Bureau Veritas**, LCIE Bureau Veritas, Qualitère, etc. — *liste à jour sur classement.atout-france.fr*).\n\n**Procédure** :\n1. Contacter un organisme accrédité (cabinet de visite agréé Atout France).\n2. **Visite d'inspection** (1 à 2 h, en présence du propriétaire/représentant) sur la grille de contrôle.\n3. Le cabinet établit le **certificat de visite** ; **Atout France** prononce le classement.\n4. **Validité 5 ans.**\n\n**Coût indicatif** : ordre d",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-8",
    "text": "[docs/legal/plan-action-declarations.md § Étape 6 — Cadrer avec l'expert-comptable (en parallèle)] - **SIRET / immatriculation** (guichet unique INPI) — conditionne CFE, micro-BIC, déclarations. Vincent n'a **pas de SIRET déclaré** aujourd'hui → **à régulariser en priorité**, activité de location meublée régulière = activité commerciale.\n- **Régime micro-BIC vs réel** : arbitrer après classement (voir Étape 5).\n- **CFE** (cotisation foncière des entreprises) : due dès activité régulière, même sans local dédié.\n- **Seuil LMP / LMNP** : vérifier le franchissement éventuel (recettes > 23 000 € **et** > autres revenus du foyer).\n- **Assurance** PNO / exploitation meublé de tourisme par bien.\n\n--",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-9",
    "text": "[docs/legal/plan-action-declarations.md § 📊 Synthèse priorisée — action → qui → coût → délai → priorité] | # | Action | Commune / Organisme | Coût | Délai cible | Priorité |\n|---|---|---|---|---|---|\n| 1 | **Confirmer le canal de déclaration** (national vs communal) par commune | Mairies Sainte-Luce, Schœlcher, Nogent | 0 € | Cette semaine | 🔴 |\n| 2 | **Déclarer / enregistrer les 6 biens** → obtenir les numéros | Mairies / téléservice | 0 € (gratuit) | 2–3 semaines | 🔴 |\n| 3 | **Afficher chaque numéro** : site + Airbnb + Booking + contrat | Vincent + intégration site | 0 € | Dès obtention | 🔴 (risque 12 500 €) |\n| 4 | **Vérifier changement d'usage / quotas** par délibération communale | ",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-10",
    "text": "[docs/legal/plan-action-declarations.md § Tableau de suivi bien par bien (cases à cocher) › Villa Amaryllis — Sainte-Luce · capacité 8] - [ ] Canal de déclaration confirmé · [ ] Déclaration/enregistrement → n° : __________\n- [ ] N° affiché : site · [ ] Airbnb · [ ] Booking · [ ] contrat\n- [ ] Changement d'usage vérifié · [ ] DPE (classe : ____) · [ ] Taxe de séjour cadrée · [ ] Classement arbitré",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-11",
    "text": "[docs/legal/plan-action-declarations.md § Tableau de suivi bien par bien (cases à cocher) › Zandoli — Sainte-Luce · capacité 5] - [ ] Déclaration/enregistrement → n° : __________\n- [ ] N° affiché : site · [ ] Airbnb · [ ] Booking · [ ] contrat\n- [ ] DPE (classe : ____) · [ ] Taxe de séjour cadrée · [ ] Classement arbitré",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-12",
    "text": "[docs/legal/plan-action-declarations.md § Tableau de suivi bien par bien (cases à cocher) › Géko — Sainte-Luce · capacité 4] - [ ] Déclaration/enregistrement → n° : __________\n- [ ] N° affiché : site · [ ] Airbnb · [ ] Booking · [ ] contrat\n- [ ] DPE (classe : ____) · [ ] Taxe de séjour cadrée · [ ] Classement arbitré",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-13",
    "text": "[docs/legal/plan-action-declarations.md § Tableau de suivi bien par bien (cases à cocher) › Mabouya — Sainte-Luce · capacité 2] - [ ] Déclaration/enregistrement → n° : __________\n- [ ] N° affiché : site · [ ] Airbnb · [ ] Booking · [ ] contrat\n- [ ] DPE (classe : ____) · [ ] Taxe de séjour cadrée · [ ] Classement arbitré",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-14",
    "text": "[docs/legal/plan-action-declarations.md § Tableau de suivi bien par bien (cases à cocher) › Bellevue — Schœlcher] - [ ] Autorité confirmée (Schœlcher vs CACEM) · [ ] Déclaration/enregistrement → n° : __________\n- [ ] N° affiché : site · [ ] Airbnb · [ ] Booking · [ ] contrat\n- [ ] DPE (classe : ____) · [ ] Taxe de séjour cadrée (CACEM ?) · [ ] Classement arbitré · [ ] Capacité max à renseigner",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-15",
    "text": "[docs/legal/plan-action-declarations.md § Tableau de suivi bien par bien (cases à cocher) › Appartement Nogent — Nogent-sur-Marne (94, zone tendue)] - [ ] N° d'enregistrement via téléprocédure Nogent → n° : __________\n- [ ] N° affiché : site · [ ] Airbnb · [ ] Booking · [ ] contrat\n- [ ] Statut résidence principale ? → si oui, **compteur de nuitées** en place (plafond légal) · sinon, changement d'usage à vérifier\n- [ ] DPE (classe : ____) · [ ] Taxe de séjour cadrée (EPT ?) · [ ] Capacité max à renseigner",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-plan-action-declarations-md-16",
    "text": "[docs/legal/plan-action-declarations.md § Tableau de suivi bien par bien (cases à cocher) › Villa Iguana — Sainte-Luce · BAIL LONGUE DURÉE — HORS meublé de tourisme] - [ ] **NE PAS déclarer comme meublé de tourisme**\n- [ ] Vérifier conformité bail meublé classique : état des lieux · DPE décence · diagnostics annexés · dépôt de garantie\n\n---\n\n> **Qui consulter** : **avocat droit immobilier** (statut Nogent, changement d'usage, quotas communaux) · **expert-comptable** (SIRET, micro-BIC vs réel, seuils 2026, classement, CFE, LMP/LMNP) · **mairies / EPCI** (canal de déclaration, n° d'enregistrement, taxe de séjour) · **cabinet accrédité COFRAC** (classement Atout France).\n>\n> **Sources de mise à",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/plan-action-declarations.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-0",
    "text": "[docs/legal/rgpd-check-formulaires.md § Introduction] # Audit RGPD — Formulaires & collectes de données du site\n\n> ⚠️ **AVERTISSEMENT — AIDE À LA CONFORMITÉ, PAS UN AVIS D'AVOCAT/DPO.**\n> Audit réalisé le 2026-06-02 sur le code réel des fonctions de collecte. À faire valider par un avocat/DPO avant arbitrage définitif. **Complète** (sans le dupliquer) le registre des traitements `docs/registre-traitements-rgpd.md` : ce document se concentre sur le **côté formulaires/collecte** (ce que le code collecte réellement, ce qui est affiché à l'utilisateur, ce qui manque).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-1",
    "text": "[docs/legal/rgpd-check-formulaires.md § 0. Périmètre audité (code réel)] | Collecte | Fichier(s) | Stockage | Traitement registre |\n|---|---|---|---|\n| Formulaire de contact | `functions/api/contact.js` (+ UI `src/PublicSite.jsx`, `src/GuideReservationDirecte.jsx`, `src/GuideSeminaires.jsx`) | D1 `contacts` + email Resend | **T1** |\n| Tunnel de réservation directe + paiement | `functions/api/notify-booking.js`, `create-payment-intent.js`, `create-deposit-intent.js`, `stripe-webhook.js` | D1 `direct_bookings` + Stripe + Beds24 + Sheets | **T2** |\n| Newsletter | `src/Guide.jsx` (guide-hub) → Resend | Resend | **T3** |\n| Emails voyageurs (pré-arrivée / post-séjour / relance panier) | `send-prea",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-2",
    "text": "[docs/legal/rgpd-check-formulaires.md § 1. Formulaire de contact — `functions/api/contact.js` › Données réellement collectées (vérifié dans le code)] - `nom`, `email`, `message` (obligatoires — ligne 65), `bien` (optionnel), `source`.\n- Métadonnée serveur : **IP** lue (`CF-Connecting-IP`, ligne 52) — utilisée pour le rate limiting, **pas stockée** dans la table `contacts` (DDL lignes 17-29 : `nom, email, message, source, bien, status, notes, created_at`). ✅ Bon point : l'IP ne persiste pas.\n- Email envoyé à l'hôte via Resend avec `reply_to: email` du prospect.",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-3",
    "text": "[docs/legal/rgpd-check-formulaires.md § 1. Formulaire de contact — `functions/api/contact.js` › Analyse RGPD] | Critère | État | Commentaire |\n|---|---|---|\n| Base légale | ✅ OK | Mesures précontractuelles (art. 6.1.b) — cohérent avec T1. |\n| Mention d'information avant collecte | ✅ Présente | Lien politique de confidentialité ajouté (cf. `compliance-rgpd-lemeur.md` jur-012). |\n| Checkbox de consentement | ➖ Non requise | Pour un simple contact, pas de case obligatoire. **MAIS** voir finding F1. |\n| Minimisation | ✅ Bonne | IP non persistée, pas de champ superflu. |\n| Durée de conservation | ⚠️ **Non appliquée en base** | Registre prévoit 3 ans après dernier contact, mais **aucune purge auto",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-4",
    "text": "[docs/legal/rgpd-check-formulaires.md § 1. Formulaire de contact — `functions/api/contact.js` › Findings] - **F1 — Champ « bien » + message libre = données mêlées au marketing.** Si le message du prospect alimente plus tard une prospection (newsletter, relance), la base légale bascule de « précontractuel » vers « consentement ». Vérifier qu'un lead contact **n'est pas automatiquement** ajouté à la newsletter sans opt-in distinct. **Correctif** : ne jamais importer un email du formulaire contact vers la liste newsletter sans consentement séparé.\n- **F2 — Pas de purge des leads (rétention non technique).** **Correctif** : ajouter un cron de purge/anonymisation des lignes `contacts` dont `creat",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-5",
    "text": "[docs/legal/rgpd-check-formulaires.md § 2. Tunnel de réservation directe — `functions/api/notify-booking.js` (+ Stripe) › Données réellement collectées (vérifié dans le code)] - `paymentIntentId`, `bienNom`, `voyageur` (nom), `total`, `checkin`, `checkout`, `depot` (lignes 87-88).\n- Stockées en clair dans D1 `direct_bookings` (DDL lignes 18-27) : `voyageur`, montants, dates, `payment_intent_id`.\n- **Aucune donnée de carte** côté Amaryllis : tout passe par Stripe (PCI-DSS). ✅ Conforme à T2.\n- Vérification anti-spam : appel Stripe pour confirmer `status = succeeded` (lignes 94-100). ✅",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-6",
    "text": "[docs/legal/rgpd-check-formulaires.md § 2. Tunnel de réservation directe — `functions/api/notify-booking.js` (+ Stripe) › Analyse RGPD] | Critère | État | Commentaire |\n|---|---|---|\n| Base légale | ✅ OK | Exécution du contrat (6.1.b) + obligation comptable (6.1.c). |\n| Pas de stockage carte | ✅ Excellent | Tokenisation Stripe, rien en local. |\n| **CORS** | 🔴 **Finding F3** | `notify-booking.js` ligne 12 : `\"Access-Control-Allow-Origin\": \"*\"` — **wildcard**, contrairement à `contact.js` qui restreint aux domaines villamaryllis. |\n| Information du voyageur | ⚠️ **F4** | La collecte se fait au paiement ; vérifier que la **clause RGPD du tunnel** (mention ajoutée en jur-012 sur `PublicSite.jsx",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-7",
    "text": "[docs/legal/rgpd-check-formulaires.md § 2. Tunnel de réservation directe — `functions/api/notify-booking.js` (+ Stripe) › Findings] - **F3 — CORS wildcard sur `notify-booking.js` (`Allow-Origin: \"*\"`).** Endpoint qui écrit en base et déclenche emails/push. Même si l'écriture exige un `paymentIntentId` Stripe valide (ce qui limite l'abus), le wildcard est une **incohérence de posture** avec `contact.js`. **Correctif** : restreindre l'origine à la whitelist villamaryllis (réutiliser le pattern `ALLOWED_ORIGINS` de `contact.js`). Risque : faible (protégé par la vérif Stripe) mais à aligner. *(À traiter aussi côté sécurité réseau — voir note plus bas.)*\n- **F4 — Moment d'affichage de l'info RGPD",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-8",
    "text": "[docs/legal/rgpd-check-formulaires.md § 3. Emails voyageurs (pré-arrivée / post-séjour / relance panier) › Données traitées] - Réutilisent `direct_bookings` (résas directes) et `abandoned_carts` (paniers abandonnés), + Beds24 pour Nogent.\n- `send-relance-panier.js` : relance d'un **panier abandonné** = email saisi sans réservation finalisée.",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-9",
    "text": "[docs/legal/rgpd-check-formulaires.md § 3. Emails voyageurs (pré-arrivée / post-séjour / relance panier) › Findings] - **F6 — Relance panier abandonné = base légale fragile.** Relancer par email une personne qui a saisi son email **sans finaliser** relève de la **prospection**. Pour un prospect (non-client), la relance d'un panier abandonné nécessite en principe un **consentement** ou, a minima, repose sur l'**intérêt légitime** avec information claire et opt-out. **Correctifs** :\n  1. Afficher, au moment où l'email est saisi dans le tunnel, une mention : *« Nous pourrons vous envoyer un rappel de votre réservation en cours. »*\n  2. Inclure un **lien de désinscription / opposition** dans l'e",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-10",
    "text": "[docs/legal/rgpd-check-formulaires.md § 4. Newsletter — `src/Guide.jsx` → Resend (T3) › Findings] - **F8 — Consentement explicite requis.** Cohérent avec T3 (base légale = consentement). **Correctif** : la collecte newsletter doit avoir une **case à cocher non pré-cochée** distincte du simple bouton « télécharger le guide » (un guide PDF en échange de l'email = il faut découpler le consentement marketing du téléchargement, sinon consentement non libre). Vérifier que l'inscription newsletter n'est pas la **condition** d'accès au guide.\n- **F9 — Double opt-in & preuve.** Recommandé : double opt-in + conservation de la preuve du consentement (horodatage). Lien de désinscription obligatoire dans",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-11",
    "text": "[docs/legal/rgpd-check-formulaires.md § 5. Chat IA public — `functions/api/chat.js` (T6) › Findings] - **F10 — Saisie libre = risque de données personnelles/sensibles non maîtrisées.** L'utilisateur peut taper nom/email/téléphone dans le chat. **Correctifs** (cohérents avec T6 du registre) :\n  1. Afficher un avertissement visible : *« Vous échangez avec un assistant IA — ne saisissez pas de données sensibles. »*\n  2. Purge périodique des logs de conversation (fixer 6–12 mois).\n  3. Sous-traitants Groq/Anthropic : **DPA + clause de non-réutilisation pour l'entraînement** (voir liste DPA du registre — `Groq` et `Anthropic` marqués « à signer ❌ »).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-12",
    "text": "[docs/legal/rgpd-check-formulaires.md § 6. Synthèse — findings priorisés] | # | Finding | Gravité | Fichier(s) | Correctif |\n|---|---|---|---|---|\n| F3 | CORS wildcard `*` sur notify-booking | 🟠 Moyen | `notify-booking.js` | Restreindre aux origines villamaryllis (pattern de `contact.js`) |\n| F2 | Pas de purge des leads contact (3 ans) | 🟠 Moyen | `contact.js` / D1 `contacts` | Cron purge/anonymisation `created_at < −3 ans` |\n| F6 | Relance panier = base légale fragile | 🟠 Moyen | `send-relance-panier.js` | Mention à la saisie + lien opt-out + purge panier |\n| F8 | Newsletter : consentement non découplé du guide | 🟠 Moyen | `src/Guide.jsx` | Case non pré-cochée, accès guide non condition",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-13",
    "text": "[docs/legal/rgpd-check-formulaires.md § 6. Synthèse — findings priorisés › Bons points confirmés (à conserver)] - ✅ Aucune donnée de carte stockée (Stripe tokenise — `notify-booking.js`).\n- ✅ IP non persistée dans `contacts` (minimisation).\n- ✅ Échappement HTML + rate limiting + CORS restreint sur `contact.js`.\n- ✅ Mentions / liens politique de confidentialité ajoutés sur les 4 formulaires (jur-012 corrigé).\n- ✅ Bandeau cookies + Consent Mode v2 (consentement 13 mois CNIL).",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-legal-rgpd-check-formulaires-md-14",
    "text": "[docs/legal/rgpd-check-formulaires.md § 6. Synthèse — findings priorisés › Cohérence avec le registre] Les traitements T1–T6 de `docs/registre-traitements-rgpd.md` couvrent ces collectes. **Ce document n'ajoute aucun nouveau traitement** : il documente les **écarts d'implémentation** (rétention non technique, CORS, consentement newsletter, avertissement chat) à corriger pour rendre le registre effectif dans le code.\n\n> ⚠️ La gravité indiquée est indicative. Aucune non-conformité grave détectée ; ce sont des **renforcements** à planifier. Validation avocat/DPO recommandée avant arbitrage final.",
    "metadata": {
      "source": "doc",
      "doc": "docs/legal/rgpd-check-formulaires.md"
    }
  },
  {
    "id": "doc-docs-marketing-00-synthese-campagnes-2026-06-md-0",
    "text": "[docs/marketing/00-SYNTHESE-campagnes-2026-06.md § Introduction] # 🎯 Synthèse — Plan CEO + Campagnes pub (juin 2026)\n\n> Préparé pendant la nuit du 2 juin 2026, à lire en premier.\n> 3 livrables détaillés (liens en bas). Ici = la vue d'ensemble + ce que TU as à décider/faire.\n> ⚠️ Rappel : tout est **préparé, prêt à lancer**. Rien n'a été dépensé, aucune connexion à tes comptes. **C'est toi qui lances.**\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/00-SYNTHESE-campagnes-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-00-synthese-campagnes-2026-06-md-1",
    "text": "[docs/marketing/00-SYNTHESE-campagnes-2026-06.md § 1. Le constat en 3 phrases] 1. **Le problème n°1 n'est pas l'offre ni le site** (funnel direct Stripe + livret + tracking GA4 = prêts) — c'est une **famine de trafic** : ~5 visiteurs/jour, 0 visite organique sur les pages commerciales. On a construit une autoroute de réservation directe que personne n'emprunte.\n2. **Des biens premium dorment** : Villa Amaryllis à **33 % d'occupation** (ADR 312 €), Mabouya à 28 %, Géko 39 %, Schœlcher 37 %. Les remplir = le plus gros gisement de CA (≈ +25 k€/an rien que sur Amaryllis à 55 %, *est.*).\n3. **La pub est LE levier court terme** pour amener du trafic qualifié pendant que le SEO (gratuit, mais lent)",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/00-SYNTHESE-campagnes-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-00-synthese-campagnes-2026-06-md-2",
    "text": "[docs/marketing/00-SYNTHESE-campagnes-2026-06.md § 2. La stratégie retenue (cohérente sur les 3 plans)] - **Concentrer, pas disperser.** Avec ~400 € : tout miser sur **l'OFFRE GROUPE Sainte-Luce** (le cluster de villas proches loge une grande famille/tribu — panier 2 500-4 000 €, concurrence pub quasi nulle, 1 résa rembourse 6-10× la mise).\n- **Google = intention** (les gens qui cherchent déjà) → on capte la demande groupe + le Brand.\n- **Meta = désir** (Martinique, villa piscine, jacuzzi couple = produit ultra-visuel) → on crée l'envie + on construit le retargeting.\n- **Timing :** juin est un **creux de réservation** mais c'est le bon moment pour lancer (les groupes réservent 4-8 mois avant",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/00-SYNTHESE-campagnes-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-00-synthese-campagnes-2026-06-md-3",
    "text": "[docs/marketing/00-SYNTHESE-campagnes-2026-06.md § 3. ⚠️ LE prérequis avant de dépenser 1 €] **Importer la conversion `purchase` dans Google Ads** (et poser le Pixel Meta + event Purchase). Sans ça, on optimise la pub à l'aveugle.\n- ✅ **Bonne nouvelle : le code est prêt** — l'event `purchase` (avec valeur €, devise, id transaction, anti-doublon) se déclenche déjà à chaque réservation payée. Vérifié cette nuit.\n- ⏳ **Ce qu'il reste (toi, dans l'UI) :** importer cet event comme conversion dans Google Ads + créer le Pixel/CAPI Meta. Procédure pas-à-pas dans les 2 kits.\n- 🔒 **Règle d'or :** importer l'event **client `purchase`**, PAS `booking_completed` (serveur, non attribuable).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/00-SYNTHESE-campagnes-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-00-synthese-campagnes-2026-06-md-4",
    "text": "[docs/marketing/00-SYNTHESE-campagnes-2026-06.md § 4. Plan de lancement recommandé (séquence)] | Quand | Quoi | Budget |\n|---|---|---|\n| **Cette semaine** | Vérifier le crédit ~400 € (palier + expiration). Importer la conversion `purchase`. Poser le Pixel Meta. | 0 € |\n| **Semaine +1 (juin)** | Lancer **Google C1 « Offre groupe »** (Search, CPC manuel) + **C2 Brand**. Lancer **Meta** en objectif *Trafic/Notoriété* (5-10 €/j) pour construire les audiences. | ~150 € Google + ~150 € Meta test |\n| **Septembre** (pic de recherche haute saison) | Activer **Remarketing** (Google Display + Meta retargeting, audiences mûres) + pousser **haute saison déc-avril** sur les biens sous-occupés. | reste du ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/00-SYNTHESE-campagnes-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-00-synthese-campagnes-2026-06-md-5",
    "text": "[docs/marketing/00-SYNTHESE-campagnes-2026-06.md § 5. ✅ Ce que TU dois décider / faire (handoff)] **Décisions (rapides) :**\n- [ ] Valider l'enveloppe pub (le ~400 € Google suffit pour démarrer ; veux-tu ajouter ~150 € Meta en test ?).\n- [ ] Valider le **tarif plancher de l'offre groupe** (le pivot de toute la campagne).\n- [ ] Valider les **prix basse saison** dans l'admin (bloquant côté revenue management — toujours en attente).\n- [ ] Confirmer la conformité meublé (déclarations + n°, DPE) avant de scaler la visibilité.\n\n**Actions UI (toi seul peux) :**\n- [ ] Vérifier le crédit Google Ads (compte 226-428-3778).\n- [ ] Importer la conversion `purchase` dans Google Ads.\n- [ ] Poser le Pixel Met",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/00-SYNTHESE-campagnes-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-00-synthese-campagnes-2026-06-md-6",
    "text": "[docs/marketing/00-SYNTHESE-campagnes-2026-06.md § 6. Attentes réalistes (pas de promesse en l'air)] - Le 1ᵉʳ mois sert surtout à **collecter de la donnée** (conversions, mots-clés/audiences qui marchent) et **construire le retargeting**. Le ROAS se juge sur 2-3 mois, pas sur 2 semaines.\n- L'offre groupe a un **cycle long** (résa 4-8 mois avant) : un lead en juin = une résa pour l'hiver. Patience.\n- Avec un budget modeste, **discipline** : couper vite ce qui ne convertit pas, scaler ce qui marche (seuils chiffrés dans les kits).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/00-SYNTHESE-campagnes-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-00-synthese-campagnes-2026-06-md-7",
    "text": "[docs/marketing/00-SYNTHESE-campagnes-2026-06.md § 📎 Les 3 livrables détaillés] | Doc | Contenu |\n|---|---|\n| [`docs/strategie/plan-ceo-2026-06.md`](../strategie/plan-ceo-2026-06.md) | Plan stratégique CEO : diagnostic, priorités, plan 90 jours, KPIs, décisions, risques |\n| [`docs/marketing/campagne-google-ads-2026-06.md`](campagne-google-ads-2026-06.md) | Google Ads clé en main : structure, mots-clés, annonces RSA, négatifs, mapping landing, checklist tracking, pilotage |\n| [`docs/marketing/campagne-meta-ads-2026-06.md`](campagne-meta-ads-2026-06.md) | Meta Ads clé en main : funnel, audiences, angles créatifs, copy, briefs visuels, pixel/CAPI, KPIs |\n\n*(Le kit historique `docs/google-ads-k",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/00-SYNTHESE-campagnes-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-runbook-lancement-md-0",
    "text": "[docs/marketing/RUNBOOK-lancement.md § Introduction] # 🚀 RUNBOOK — Lancer Google Ads + Meta Ads (ce soir)\n\n> **But :** une seule feuille, ordonnée, copier-collable, pour créer et lancer les 2 campagnes sans rouvrir les kits de 30 pages.\n> Détails complets si besoin : `campagne-google-ads-2026-06.md` · `campagne-meta-ads-2026-06.md`.\n> ⚠️ **Je (Claude) ne me connecte pas à tes comptes.** Tout ci-dessous = TES clics. Le tracking site (GA4 + Pixel Meta) est déjà posé et vérifié.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/RUNBOOK-lancement.md"
    }
  },
  {
    "id": "doc-docs-marketing-runbook-lancement-md-1",
    "text": "[docs/marketing/RUNBOOK-lancement.md § 0) État & prérequis (lire 1 min)] | Élément | État |\n|---|---|\n| Event GA4 **`purchase`** (valeur €, attribuable) | ✅ posé & vérifié |\n| **Pixel Meta** `714189639771397` (consent-gated) | ✅ posé, init OK (config 200) |\n| CSP (bloquait Pixel + GA4 régional) | ✅ corrigé |\n| Campagnes créées DANS Google/Meta | ❌ **à faire (toi)** ← ce runbook |\n\n**Stratégie en 1 phrase :** concentrer ~400 € Google sur l'**offre Groupe** (1 résa = 6-10× le budget) + Brand ; Meta à petit budget (5-10 €/j) en **découverte** pour charger le retargeting (qui convertira en septembre). **On ne juge rien sur l'occupation de juin.**\n**Exclus de toute pub :** Iguana (bail long), Nog",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/RUNBOOK-lancement.md"
    }
  },
  {
    "id": "doc-docs-marketing-runbook-lancement-md-2",
    "text": "[docs/marketing/RUNBOOK-lancement.md § A) GOOGLE ADS — compte 226-428-3778 (~20 min)] **A1. Crédit** → Facturation → *Promotions* : note le **palier de déblocage** (« dépensez X € ») + la **date d'expiration**. Cale le rythme pour ne pas le perdre.\n\n**A2. Importer la conversion (BLOQUANT)** → Objectifs → Conversions → **+ Nouvelle** → *Importer* → **Google Analytics 4 (Web)** → coche **`purchase`** (⚠️ PAS `booking_completed`) → Importer → ouvre-la → **Objectif = Principal**, valeur = *Utiliser les valeurs de l'event*.\n\n**A3. Réglages communs C1 + C2 :** Recherche **uniquement** (❌ décoche *Réseau Display* + *Partenaires Recherche*) · Géo **France métropolitaine**, **exclure DOM** (Martiniqu",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/RUNBOOK-lancement.md"
    }
  },
  {
    "id": "doc-docs-marketing-runbook-lancement-md-3",
    "text": "[docs/marketing/RUNBOOK-lancement.md § B) META ADS — Facebook + Instagram (~20 min)] **B1. Pixel** → Events Manager → vérifie que `714189639771397` est **Actif** (Pixel Helper sur villamaryllis.com après acceptation cookies → PageView ; ouvre une fiche → ViewContent).\n\n**B2. Compte pub** → Business Manager → crée/confirme un **compte publicitaire** + moyen de paiement.\n\n**B3. CAMPAGNE 1 — Découverte** · Objectif **Trafic** (PAS « Ventes » au début : volume trop faible → resterait en apprentissage). Budget au niveau **ad set (ABO)**. Placements **Advantage+ (auto, FB+IG)**.\n\n**B4. Ad set A1 — Amaryllis premium** — 5 €/j · landing `/amaryllis` · Audience : **France métropole**, 30-60 ans, inté",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/RUNBOOK-lancement.md"
    }
  },
  {
    "id": "doc-docs-marketing-runbook-lancement-md-4",
    "text": "[docs/marketing/RUNBOOK-lancement.md § C) Après lancement (les 2 premières semaines)] - **Google, chaque semaine :** Insights → **Termes de recherche** → ajoute en négatif tout le hors-sujet (c'est là que fuit 80 % du budget).\n- **Règle kill/scale :** couper un mot-clé/angle à **>2× le CPA cible sans conversion** après ~50 clics ; scaler (+20 %/3j) ce qui convertit.\n- **Meta :** ne juge pas avant ~1 semaine (apprentissage). On cherche du **trafic qualifié + ViewContent** (pas la résa immédiate en juin).\n- **Bascule Ventes :** en **septembre**, quand le Pixel a accumulé des events → objectif Ventes + retargeting + lookalike.\n- **Suivi conversions :** onglet **Analytics** admin (funnel view_it",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/RUNBOOK-lancement.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-0",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § Introduction] <!-- Généré par workshop multi-agents (12 agents) le 2026-06-21. Baseline funnel LIVE — source vivante = npm run funnel, ce doc périme. -->\n\n# 🎯 Atelier — Attirer le bon public & maximiser le ROI",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-1",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § Introduction › Amaryllis Locations · juin 2026 · document de pilotage hebdomadaire] > **Cadre de lecture.** Baseline funnel LIVE 2026-06-21 (30j) : **739 sessions, 887 view_item, 64 begin_checkout (7,2 %), 4 purchase (0,5 %), ~2 894 €**, pub ~540 €/mois. Source vivante = `npm run funnel` (jamais ce document, il périme). **RM = advisory only** : Claude prépare des recos chiffrées, Vincent applique tout prix/budget/publication/fiche GBP.\n>\n> **Le verrou central, dit franchement.** Le problème n'est ni le tunnel (techniquement abouti) ni l'idée d'origine — c'est **(1) la qualité du trafic** (51 % Martinique non-acheteur), **(2) une fuite haut",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-2",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 1. TL;DR — les 5 décisions à prendre cette semaine] | # | Décision | Pourquoi maintenant | Qui agit |\n|---|---|---|---|\n| **1** | **Réparer `geko.json`** (virgule traînante L85 → JSON invalide) | Bug confirmé : le catalogue extras + le fallback guide de Géko (cœur de gamme, 4.83) sont **silencieusement morts**. Fix 2 min. C'est la preuve vivante de la dette de maintenance invisible. | Claude |\n| **2** | **Instrumenter la fuite n°1** : events GA4 `availability_ready` + `date_selected` | 93 % des visiteurs de fiche ne touchent jamais le calendrier — et on ne sait pas s'ils *ne le voient pas*, *le voient sans cliquer* ou *butent sur un calend",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-3",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 2. Le bon public — personas / ICP par segment de biens] Les 7 biens ne se vendent pas au même public. Le budget se concentre sur les **gros paniers** (Amaryllis, Zandoli) et la **diaspora**, jamais en moyenne (RM-03/08/21).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-4",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 2. Le bon public — personas / ICP par segment de biens › 🏖️ Persona A — « La tribu retrouvailles » → **Villa Amaryllis** (280 €, 8p, 4.94)] - **Qui :** familles élargies, groupes d'amis 30-55 ans, retrouvailles/anniversaires. Décideuse = l'organisatrice CSP+ métropole (IDF/Lyon/Bordeaux).\n- **Budget séjour :** 1 700–2 600 €. **LE bien où le payant est rentable** (~179 € de commission OTA évitée/résa).\n- **Déclencheur :** événement daté, réserve **4–6 mois à l'avance** (régime TENIR, RM-02). Cherche capacité ≥8, piscine sécurisée, vue mer.\n- **Canal :** Google Ads non-brand haute intention + Meta lookalike acheteurs + retargeting + **diasp",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-5",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 2. Le bon public — personas / ICP par segment de biens › 👨‍👩‍👧 Persona B — « Famille nucléaire + amis » → **Zandoli** (110 €, 5p, 4.5) & **Géko** (110 €, 4p, 4.83)] - **Qui :** couples 30-45 ans + 1-2 enfants, ou 2 couples. Confort + piscine, budget maîtrisé.\n- **Budget séjour :** 770–1 100 €. **Cœur de gamme volume** — là où le flux direct se concentre en nombre.\n- **Déclencheur :** vacances scolaires, « villa avec piscine à prix raisonnable ». Compare activement Airbnb. Sensible à la piscine privative à cascade et à la note (Géko 4.83 en avant ; Zandoli mené par **verbatim qualitatif**, pas le 4.5 brut, RM-13).\n- **Canal :** Google Ad",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-6",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 2. Le bon public — personas / ICP par segment de biens › 💑 Persona C — « Le couple escapade » → **Mabouya** (70 €, 2p, 4.55) & **Schœlcher** (90 €, 2p, 4.8)] - **Qui :** couples 28-50 ans, lune de miel, week-end. Mabouya = seul jacuzzi privatif vue mer. Schœlcher = city break Fort-de-France.\n- **Budget séjour :** 280–630 €. **Panier faible → commission évitée trop mince pour du paid dédié** (~15-23 €/nuit). **CAC visé ≈ 0.**\n- **Canal :** SEO local + cross-sell depuis la base CRM + remplissage OTA en creux (RM-09). **Zéro paid.** Mener par l'émotion + le verbatim.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-7",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 2. Le bon public — personas / ICP par segment de biens › 🏙️ Persona D — « Pro / famille en transit » → **Nogent-sur-Marne** (90 €, 2p, 4.8, Beds24)] - **Qui :** pros en déplacement IDF, familles visitant un proche, moyenne durée. **Saisonnalité INVERSE de la Martinique** — jamais calquer le calendrier Sainte-Luce (RM-22).\n- **Canal :** SEO local pur (« meublé Nogent-sur-Marne », « bord de Marne RER A ») + **GBP Nogent dédié**. **Pas de Meta, pas de Google Ads** (volume géo trop étroit, commission trop mince).\n\n> **Iguana = hors scope acquisition** (bail long Joël Bailleul, `bookable:false`). Jamais en campagne.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-8",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 2. Le bon public — personas / ICP par segment de biens › 🎯 Segment transverse prioritaire — la **DIASPORA antillaise**] Métropolitains d'origine antillaise rentrant à Noël/l'été. Réservent **tôt et longtemps**, sensibles au bouche-à-oreille, LTV haute, **basculent en direct facilement.** Cible Meta + CRM prioritaire pour Amaryllis/Zandoli, **à activer T-3/T-4 mois avant Noël = dès maintenant pour la saison déc-avr.**\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-9",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 3. Stratégie d'acquisition ciblée — par canal + filtres anti-mauvais-trafic › 🔍 SEO local — capter l'intention haute (autorité hors-page, pas la technique)] La couche technique est saine (prerender 63 URLs, JSON-LD, hreflang). Manque = **autorité hors-page.**\n\n| Cluster mots-clés | Requêtes | Page cible |\n|---|---|---|\n| Villa + piscine + lieu | `location villa Martinique piscine privée`, `villa Sainte-Luce piscine`, `villa Martinique 8 personnes` | Amaryllis |\n| Direct propriétaire | `location vacances Martinique direct propriétaire`, `villa Martinique sans frais` | Home + Amaryllis/Zandoli |\n| Longue traîne expérience | `villa vue mer d",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-10",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 3. Stratégie d'acquisition ciblée — par canal + filtres anti-mauvais-trafic › 🎯 Google Ads — concentrer le budget, filtrer les curieux (plafond CAC = 50 % de la commission évitée par bien)] | Campagne | Mots-clés | Landing | Budget indicatif |\n|---|---|---|---|\n| **C-Brand (défensif)** | `villa amaryllis`, `villamaryllis` | Home / fiche Amaryllis | **Plancher ~30 €/mois** (Billboard Effect, RM-06) |\n| **C-NonBrand Villa premium** | `location villa Martinique piscine`, `villa 8 personnes` | **Fiche Amaryllis, dates pré-suggérées** (pas la home) | **Gros du budget ~120 €/mois** |\n| **C-NonBrand Famille** | `villa familiale Martinique piscin",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-11",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 3. Stratégie d'acquisition ciblée — par canal + filtres anti-mauvais-trafic › 📱 Meta Ads — intérêts précis, lookalike acheteurs, retargeting] | Niveau | Audience | Bien |\n|---|---|---|\n| TOFU | Intérêts Caraïbes/Martinique + CSP+ 30-55 ans, **France/Québec (PAS MTQ)** | Amaryllis |\n| TOFU Diaspora | Affinité culture antillaise + résidents métropole | Amaryllis/Zandoli |\n| MOFU Lookalike | **Lookalike 1-3 % acheteurs Stripe** (à activer une fois attribution propre) | Amaryllis/Zandoli |\n| BOFU Retargeting | Visiteurs fiche 30j non convertis + paniers abandonnés | Le bien vu |",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-12",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 3. Stratégie d'acquisition ciblée — par canal + filtres anti-mauvais-trafic › 🎬 Reels — attirer des PROSPECTS, pas des vues] Organic Social = 1er canal en volume (239 sessions) mais **0 conversion** et **non taggé UTM** (angle mort total).\n1. **Tagger TOUS les liens bio + Reels en UTM** (`utm_source=instagram&utm_medium=organic_social&utm_campaign=reel_<bien>`). Sans ça, canal invisible à vie.\n2. Formats orientés prospect avec **CTA daté** : « POV : ton réveil à la Villa Amaryllis — dispos pour Noël, lien en bio », carrousel cluster, témoignage diaspora. **Jamais un Reel joli sans appel à l'action.**\n3. Mesurer si le social ramène du loca",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-13",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 3. Stratégie d'acquisition ciblée — par canal + filtres anti-mauvais-trafic › 🧲 Filtres anti-mauvais-public] | Filtre | Action | Effet |\n|---|---|---|\n| Exclusion géo MTQ (paid séjour) | Retirer MTQ du ciblage acquisition | -51 % trafic non-acheteur |\n| Négatifs Google | Liste ci-dessus | Filtre bail/curieux/emploi |\n| Segmentation funnel par pays | Recalculer la conversion **hors MTQ** (dès le 03/07) | Vrai taux acheteur, débloque le budget |\n| UTM partout | Reels, bio, rebook OTA→direct, emails | Rend visibles les 418 sessions aveugles |\n| Landing alignée intention | Paid Search → fiche du bien (dates pré-suggérées), pas la home | Monte",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-14",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 4. 🎛️ Objectifs hebdomadaires — 2 niveaux, cibles réalistes] > Paliers : on ne vise pas 75 % direct du jour au lendemain. On **double le débit haut-de-tunnel d'abord.** Le KPI roi = **sessions qualifiées (hors MTQ)**, pas le total.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-15",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 4. 🎛️ Objectifs hebdomadaires — 2 niveaux, cibles réalistes › NIVEAU A — VISITEURS (le débit qualifié)] | KPI | Baseline 30j | Hebdo actuel ≈ | 🎯 T1 (4-6 sem) | 🎯 T2 (saison haute) | Source |\n|---|---|---|---|---|---|\n| Sessions totales | 739 | ~185 | 220 | 300+ | `funnel` byChannel |\n| **Sessions qualifiées (hors MTQ)** | ~364 (49 %) | ~91 | 120 | 175 | `funnel` byPays |\n| **begin_checkout / sem** | ~16 | ~16 | 28 | 45 | `funnel` events |\n| **view_item → begin_checkout** | **7,2 %** | 7,2 % | **12 %** | 15 % | `funnel` |\n| Coût / visiteur qualifié (Ads) | aveugle | — | < 3 € | < 2,5 € | `funnel` ÷ spend |",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-16",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 4. 🎛️ Objectifs hebdomadaires — 2 niveaux, cibles réalistes › NIVEAU B — RÉSERVATIONS (l'argent)] | KPI | Baseline 30j | Hebdo actuel ≈ | 🎯 T1 | 🎯 T2 | Source |\n|---|---|---|---|---|---|\n| `generate_lead` (devis/contact/WhatsApp) | 2 | ~0,5 | 3 | 5 | `funnel` |\n| **Résas directes / sem** | ~1 | ~1 | **2** | **3-4** | `funnel` purchase |\n| Conv. visiteur qualifié → résa | ~1,1 % | — | 1,7 % | 2,2 % | calc |\n| **Panier moyen direct** | ~720 € | 720 € | 800 € | 850 € (+upsell) | `funnel` revenue |\n| Part directe vs OTA (nuitées) | ~8 % | — | 12 % | 18 % | ConversionTab |\n| **ROAS** (post-03/07) | aveugle | — | >2 | >3 | `funnel` ÷ 540 € |\n",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-17",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 5. 📋 Playbook « Si résultat → Alors action »] Chaque lundi : pour chaque KPI sous-cible, descendre dans sa branche, activer **1-2 actions max** (débit faible = peu de signal, on teste une chose à la fois). Ordre : **haut du tunnel avant le bas.**",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-18",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 5. 📋 Playbook « Si résultat → Alors action » › 🔵 Déclencheur 1 — Sessions qualifiées < cible (débit / mauvais public)] | Symptôme | → Alors |\n|---|---|\n| **>50 % trafic Martinique** | 1. Vérifier ciblage géo Meta/Google (exclure MTQ acquisition). 2. Concentrer budget France métropole + Québec (nov-avr). *(advisory budget)* |\n| **Sessions en baisse** | 1. Vérifier ruptures budget/refus (point-ads-hebdo). 2. Pousser 1-2 Reels les plus vus, lien fiche bio taggé UTM. 3. Landing guide-destination en ad group générique. |\n| **Organic Search 0 vente (72 sess)** | 1. GBP par zone, NAP cohérent *(Vincent valide)*. 2. Citations annuaires DOM. 3. C",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-19",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 5. 📋 Playbook « Si résultat → Alors action » › 🟡 Déclencheur 2 — view_item → begin_checkout < 12 % (la fuite #1, 93 %)] | Symptôme | → Alors |\n|---|---|\n| **Calendrier lent/vide au moment décisif** | 1. **Pré-charger l'availability au mount** (widget <1s). 2. Pré-remplir 2 dates suggérées. |\n| **Segment aveugle (vu calendrier ou pas ?)** | 1. **Câbler `availability_ready`/`date_selected`** — sans ça on optimise à l'aveugle. |\n| **Pas de preuve externe à Airbnb** | 1. Brancher avis Google `place=residence` sur les 6 biens hors Amaryllis. 2. Renforcer le « −15 % vs Airbnb ». |\n| **Paid 0 achat (179 sess)** | 1. Router Paid Search → fiche d",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-20",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 5. 📋 Playbook « Si résultat → Alors action » › 🟠 Déclencheur 3 — begin_checkout → purchase < 30 % (fuite paiement)] | Symptôme | → Alors |\n|---|---|\n| **Abandon avant l'écran carte** | 1. Créer le PaymentIntent en arrière-plan dès l'étape 2. 2. Ajouter Apple Pay / Google Pay (70 % mobile). |\n| **add_payment_info → purchase chute** | 1. Vérifier feedback + état d'échec. 2. Tester 3DS sur réseau DOM lent (surveiller post-03/07). |\n| **Paniers abandonnés** | 1. Vérifier que le cron relance tourne et exclut les convertis. 2. Relance J+1 + code promo first-booking. |\n| **Devis pris, pas de résa** | 1. Mesurer `generate_lead → résa`. 2. Séquen",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-21",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 5. 📋 Playbook « Si résultat → Alors action » › 🟢 Déclencheur 4 — Panier moyen < cible] | Symptôme | → Alors |\n|---|---|\n| AOV bas | 1. 2-3 extras forte marge (champagne, transfert, panier créole) dans pré-arrivée + récap. 2. Enrichir le catalogue. |\n| Séjours courts | 1. LOS sur pics (min 4-5 nuits Amaryllis/Zandoli si pickup J-45 confirme, RM-04). 2. « 7 nuits → late check-out offert ». |\n| Pas d'upsell visible | 1. Vérifier le volume `service_orders` (onglet Ventes). 2. QR écran TV + bloc récap. |",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-22",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 5. 📋 Playbook « Si résultat → Alors action » › 🟣 Déclencheur 5 — Part directe vs OTA < cible (désintermédiation)] | Symptôme | → Alors |\n|---|---|\n| OTA→direct invisible | 1. **Tagger les liens rebook** (emails post-séjour, TV, QR) `utm_source=poststay_email&utm_medium=rebook`. |\n| Repeaters non relancés | 1. Builder auto `crm_clients`. 2. Relance saison haute dès septembre. 3. Cross-sell Mabouya/Géko → Amaryllis/Zandoli (CAC ~0). |\n| Pic saturé, OTA ouverte | 1. **Séquencer** : ne restreindre l'OTA Amaryllis/Zandoli déc-avr **que** quand le direct tient (voir angle mort #5). *(advisory)* |\n| Creux invendu | 1. Rouvrir OTA 100 % juil-oct",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-23",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 5. 📋 Playbook « Si résultat → Alors action » › 🔴 Déclencheur 6 — ROAS aveugle / sous 2] | Symptôme | → Alors |\n|---|---|\n| **>80 % CA en Unassigned** | 1. **Ne PAS lever « Max conversions » ni monter les budgets.** 2. Le 03/07 : vérifier la sortie d'Unassigned ; sinon débugger pourquoi `ga_client_id` n'arrive pas au webhook. |\n| **bien_id (not set)** | 1. Vérifier le param top-level `bien_id` dans le purchase server-side. |\n| **Spend sans begin_checkout** | 1. Négativer les requêtes non transformables, rebasculer sur non-brand gros tickets *(advisory)*. |\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-24",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 6. 💰 Catalogue d'upsells pendant le séjour] > **Le gisement le plus rentable** car il **ne dépend PAS du débit d'acquisition** (séjours déjà acquis) et la marge est quasi nette. **Réserve : le volume réel n'est pas ~700 séjours mais ~250-400** (6 biens bookables, 5-7 nuits, saisonnalité DOM). Le « 700 » = nuitées/OTA brut. **Diviser les projections d'origine par ~2.** Cible réaliste consolidée **+400-900 €/mois** la 1ʳᵉ année, montant en charge avec les partenariats.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-25",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 6. 💰 Catalogue d'upsells pendant le séjour › 🟢 P0 — Activer l'existant (7 extras déjà codés, sous-exploités)] | Extra | Prix | Marge nette | Timing | Gain/résa pondéré |\n|---|---|---|---|---|\n| **Départ tardif / arrivée anticipée** | 50-80 € | ~45 € | **Pré-départ J-1** | **~9 €** (le meilleur single) |\n| Champagne + fruits | 50 € | ~30 € | Pré-arrivée J-3 + récap | ~5 € |\n| Planteur maison | 15 € | ~12 € | Récap + QR TV | ~3,5 € |\n| Kit plage | 20 € | ~17 € | Pré-arrivée + J1 | ~3 € |\n| Ménage mid-stay | 50-90 € | ~25-40 € | Pré-arrivée (séjours ≥7 nuits) | ~3 € |\n| Kit bébé | 20 € | ~18 € | Au checkout (si enfant) | ~2 € |\n| Capsules N",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-26",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 6. 💰 Catalogue d'upsells pendant le séjour › 🔵 P1 — Commission zéro-stock (marge ~90 %, meilleur ROI/effort)] | Extra | Prix voyageur | Commission | Timing | Gain/résa pondéré | À construire |\n|---|---|---|---|---|---|\n| **Transfert aéroport** | 60-80 € A/R | 15-25 € | Pré-arrivée | ~7 € | Partenaire VTC + extra `transfert` |\n| **Location voiture** | (chez le loueur) | 20-40 €/résa | Checkout + pré-arrivée | ~12 € | Lien tracké (besoin quasi universel MTQ) |\n| Excursion catamaran | 60-90 €/pers | ~8-12 € | In-stay J1-J2 | ~4 € | Partenaire + lien tracké |\n| Chef à domicile / traiteur créole | 40-70 €/pers | ~15-30 € | Pré-arrivée + in-st",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-27",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 6. 💰 Catalogue d'upsells pendant le séjour › 🟣 P2 — Packs forte valeur (AOV élevé) · 🟠 P3 — Flexibilité monétisée] | Extra | Prix | Marge | Timing | À construire |\n|---|---|---|---|---|\n| **Late-checkout GARANTI** (créneau bloqué) | 40-60 € | ~40 € | Checkout + pré-départ | Variante de l'existant (se vend mieux : supprime l'incertitude) |\n| Panier d'accueil créole | 35-50 € | ~20-25 € | Pré-arrivée | Sourcing local + extra |\n| Pack romantique (champagne+fleurs+déco) | 90-120 € | ~50-60 € | Champ « occasion » au checkout | **Bundler l'existant** — ⚠️ logistique physique réelle pour un solo, gain marginal |\n| Assurance annulation (Koala/C",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-28",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 7. 🆕 Revenus annexes HORS séjour — du meilleur ratio au moins bon] > **Fil rouge :** ne pas créer de nouveaux business, **monétiser des actifs déjà payés** (trafic touristique, villa premium, savoir-faire conciergerie). **⚠️ Toutes les « marges nettes » ci-dessous sont BRUTES avant fiscalité** — voir angle mort #1.\n\n| Piste | Impact €/mois | Effort | À construire | Légal/fiscal DOM |\n|---|---|---|---|---|\n| **Capture email + nurturing (lead magnet PDF)** | +400-700 | moyen | Compil des 8 guides existants (0 prod) + exit-intent + `generate_lead` | RGPD double opt-in. ✅ faible risque |\n| **Affiliation excursions/transfert/voiture** (newslet",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-29",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 8. 🔁 Fidélisation & monétisation de l'audience] > À CAC ≈ 0, chaque résa rapatriée en direct vaut **+15-18 % de marge**, et un repeater coûte 5-7× moins cher qu'un inconnu. Tout est branché sur l'existant (`send-bulk-email.js`, `promo-codes.js`, vue `guests`, crons 9h/6h UTC). **Du câblage et du copywriting, pas de brique majeure.**\n\n**Le levier n°1, dédupliqué : la bascule OTA→direct du segment capturé.** ~250-400 séjours/an dont les emails post-séjour passent. Chaque email capturé et basculé = commission économisée **à vie** sur ce client. Invisible aujourd'hui faute de séquence déclenchée. **C'est la seule mécanique qui change vraiment",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-30",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 9. 🗺️ Plan de marche 90 jours › 🚀 Semaine 1 — réparer le mesurable et le gratuit (zéro risque, ROI/temps max)] | Action | Qui |\n|---|---|\n| Réparer `geko.json` (L85) | Claude |\n| Events GA4 `availability_ready` + `date_selected` | Claude |\n| Pré-charger l'availability au mount + cache CDN 5-10 min | Claude |\n| Tagger UTM Reels/bio/rebook/emails | Claude |\n| Refondre bloc upsell `pre-arrivee.html` | Claude |\n| Code RETOUR-8 dans post-séjour J+1 + segments `repeaters`/`past_guests`/`all` à send-bulk | Claude (envoi groupé = OK Vincent) |\n| **Exclure Martinique du paid de séjour + négatifs Google** | **Vincent** |",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-31",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 9. 🗺️ Plan de marche 90 jours › 📅 Mois 1 — débloquer la conversion et la mesure] | Action | Qui |\n|---|---|\n| Cron pré-départ J-1 (late-checkout) | Claude |\n| Apple Pay / Google Pay (Payment Element, domaine vérifié) | Claude |\n| Dates pré-remplies « prochain dispo » (dépend du pré-chargement) | Claude |\n| Avis Google `place=residence` sur les 6 biens | Claude |\n| Lead magnet PDF + capture exit-intent | Claude |\n| Builder auto `crm_clients` (6 segments RFM) | Claude |\n| Instrumenter `service_orders` (onglet Ventes) | Claude |\n| **Verdict attribution 03/07** → segmenter le funnel hors-MTQ → 1er ROAS réel par bien → décider budgets | Vince",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-32",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 9. 🗺️ Plan de marche 90 jours › 📆 Trimestre — leviers à dépendances (partenaires, légal, fiscal)] | Action | Qui · pré-requis |\n|---|---|\n| **GBP Sainte-Luce + Nogent** + router avis Google | **Vincent valide la fiche** |\n| Étendre catalogue extras[] (transfert, voiture, panier créole, late-checkout garanti, assurance) | Claude (code) + **Vincent (4 partenariats)** |\n| Programme Cercle + séquences J+30/J+365/off-saison + bascule OTA→direct | Claude · builder crm_clients |\n| Relance panier 2 vagues, WhatsApp contextuel, rebond cluster, ChatWidget objections | Claude |\n| Version EN des 3 fiches premium | Claude |\n| **Cadrage comptable/juri",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-33",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 10. ⚠️ Garde-fous & angles morts (issus de la critique)] 1. **Double-comptage des projections.** Fidélisation (CA rebooké) + acquisition (commission évitée sur ces mêmes résas) + upsell (sur ces mêmes séjours) comptent **les mêmes euros 3 fois.** L'affiliation excursions est dans P1 **et** dans les revenus hors-séjour. **Ne jamais additionner les lentilles.** Potentiel consolidé dédupliqué réaliste : **+8 à 15 k€ net/an la 1ʳᵉ année** (pas +60-90 k€), et gourmand en temps.\n\n2. **Mur fiscal/administratif DOM (le plus grave, jamais chiffré).** Vincent est en LMP. Les **commissions d'affiliation = BIC services hors LMP** (compta séparée, risq",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-atelier-acquisition-roi-2026-06-md-34",
    "text": "[docs/marketing/atelier-acquisition-roi-2026-06.md § 🏆 Top 15 actions par priorité] | # | Action | Catégorie | Impact €/mois | Effort | Délai |\n|---|---|---|---|---|---|\n| 1 | Corriger `geko.json` (JSON cassé L85) | upsell-séjour | 100-200 | faible | cette semaine |\n| 2 | Events GA4 `availability_ready`/`date_selected` | conversion | indirect (mesure) | faible | cette semaine |\n| 3 | Pré-charger l'availability au mount (calendrier <1s) | conversion | 800-1500 | faible | cette semaine |\n| 4 | Tagger UTM Reels/bio/rebook/emails | kpi-pilotage | indirect (mesure) | faible | cette semaine |\n| 5 | Refondre bloc upsell `pre-arrivee.html` | upsell-séjour | 400-700 | faible | cette semaine |\n| 6 | ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/atelier-acquisition-roi-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-0",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § Introduction] # Campagne Google Ads — Amaryllis Locations — Juin 2026 (PRÊTE À LANCER)\n\n> **Version actualisée et complète. Remplace `docs/google-ads-kit.md`.**\n> Préparée le **2026-06-01** par le traffic-manager (sur la base perfs réelles 2025, code tracking corrigé, landing pages live vérifiées).\n> Vincent : tu **prépares dans Google Ads et tu lances toi-même**. Ce doc est copier-collable bloc par bloc.\n> ⚠️ **NE RIEN LANCER avant d'avoir coché la CHECKLIST TRACKING §7 (bloquante)** ET vérifié le crédit (§0).\n>\n> Compte Ads **226-428-3778** · GA4 **G-N9BM709ZBL** (lié ✅) · Audience remarketing **RMKT_Vu_fiche_calendrier_sans_resa** (créée ✅)",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-1",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 0) Stratégie & timing (résumé décisionnel) › Le constat (données réelles 2025)] | Bien | Type | Occ. 2025 | ADR € | RevPAR € | Décision pub |\n|---|---|---|---|---|---|\n| **Villa Amaryllis** | villa premium piscine, Sainte-Luce, 8 pers | **33 %** | 312 | 104 | **CIBLE n°1** — nuits vides + haut panier |\n| **Studio Mabouya** | jacuzzi, couples, Sainte-Luce, 2 pers | 28 % | 82 | 23 | CIBLE — angle couples |\n| **Géko** | cocon court séjour, Sainte-Luce, 4 pers | 39 % | 139 | 55 | CIBLE |\n| **T2 Schœlcher** (Bellevue) | appart vue mer | 37 % | 93 | 35 | CIBLE |\n| Zandoli | logement, Sainte-Luce, 5 pers | 68 % | — | — | sain — ne pas surpayer |\n| No",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-2",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 0) Stratégie & timing (résumé décisionnel) › Les 3 décisions stratégiques] 1. **L'OFFRE GROUPE est l'axe n°1.** Cluster Sainte-Luce (Amaryllis + Zandoli + Géko + Mabouya, mitoyens) = jusqu'à 11 pers, **panier 2 500–4 000 €**, concurrence pub **quasi nulle**, différenciateur unique (« un seul paiement, une seule adresse »). **1 résa groupe rembourse 6 à 10× tout le budget.** → C1 prioritaire dès juin.\n2. **Juin = creux de réservation individuelle, mais c'est MAINTENANT qu'on prépare la haute saison.** Les groupes réservent **4–8 mois avant** (donc juin = bon timing pour vendre déc-avril). Le pic de recherche individuelle est **sept-oct** (lead-",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-3",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 0) Stratégie & timing (résumé décisionnel) › Contexte trafic (à avoir en tête)] Le site est en **famine de trafic** (~5 visiteurs/jour, ~5 sessions SEO/mois). Google Ads est donc **le levier le plus rapide** pour générer des résas directes ce trimestre. Mais : **volume de conversions faible au départ → enchères MANUELLES obligatoires** (l'algo « Maximiser les conversions » a besoin de ≥15 conv./mois pour apprendre, on n'y est pas encore).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-4",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 0) Stratégie & timing (résumé décisionnel) › Vérifier le crédit AVANT tout (bloquant budget)] Le **crédit ~400 €** doit être confirmé dans Ads → Facturation → **Promotions**. Note :\n- le **palier de dépense minimum** pour débloquer le crédit (souvent « dépensez X € → recevez 400 € »),\n- la **date d'expiration** (souvent 60 jours).\n→ Caler le rythme de dépense pour **ne pas perdre le crédit** (ni le sous-dépenser, ni le cramer trop vite). Si le crédit n'est pas confirmé : lancer **C1 seule à petit budget** et attendre.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-5",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 0) Stratégie & timing (résumé décisionnel) › Répartition du budget (~400 €)] | Phase | Campagne | Montant | Quand |\n|---|---|---|---|\n| **Juin** | C1 Offre Groupe | **~150 €** (test) | dès tracking validé |\n| **Juin** | C2 Brand défensif | **~30 €** | en même temps (quasi gratuit) |\n| **Septembre** | C1 Groupe (scale) | **~120 €** | si CPA tient |\n| **Septembre** | C3 Remarketing | **~70 €** | audience >100 users remplie |\n| **Septembre** | C2 Brand (continu) | **~30 €** | — |\n| *Réserve* | ajustements / scale gagnant | ~0–40 € | — |\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-6",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 1) Structure des campagnes] 3 campagnes **séparées** (Google ne mélange jamais Search acquisition / Brand / Remarketing — réseaux et logiques d'enchères différents).\n\n| # | Campagne | Réseau | Type d'enchères (démarrage) | Budget/jour | Budget total | Lancement |\n|---|---|---|---|---|---|---|\n| **C1** | **Offre Groupe Sainte-Luce** | Search seul (Display OFF, partenaires OFF) | **CPC manuel** → « Maximiser la valeur de conv. » à ≥15 conv. | **8 €/j** | ~150 € (juin) +120 € (sept) | **Juin** |\n| **C2** | **Brand défensif** | Search seul | **CPC manuel**, plafond bas | **2 €/j** | ~60 € | **Juin** |\n| **C3** | **Remarketing** | Display (réseau D",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-7",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 2) Mots-clés par ad group] > Syntaxe : `[exact]` = correspondance exacte · `\"phrase\"` = expression. **On évite le large** (broad) au départ : il crame le budget sur des requêtes hors sujet tant qu'on n'a pas d'historique de conversion.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-8",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 2) Mots-clés par ad group › C1 — Offre Groupe Sainte-Luce → `/location-groupe-sainte-luce`] **Ad group 1A — Villa groupe / grande capacité**\n```\n[location villa groupe martinique]\n[location villa martinique 10 personnes]\n[villa 11 personnes martinique]\n[grande villa martinique]\n\"location villa groupe martinique\"\n\"villa grande capacité martinique\"\n\"location villa martinique 10 personnes\"\n\"location villa martinique 12 personnes\"\n\"location maison vacances martinique groupe\"\n\"grande villa martinique vacances\"\n```\n\n**Ad group 1B — Villa entre amis / famille**\n```\n[location villa martinique entre amis]\n[location villa famille martinique]\n\"location v",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-9",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 2) Mots-clés par ad group › C2 — Brand défensif → `/` (accueil)] ```\n[villa amaryllis]\n[villamaryllis]\n[amaryllis locations]\n[villa amaryllis martinique]\n\"villa amaryllis martinique\"\n\"villa amaryllis sainte luce\"\n\"amaryllis location martinique\"\n\"villa amaryllis avis\"\n```\n→ CPC plafonné **0,30–0,60 €** (marque peu disputée, ROI quasi garanti, empêche un concurrent/OTA d'enchérir sur ton nom).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-10",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 2) Mots-clés par ad group › C3 — Remarketing → pas de mots-clés (ciblage par **audience**, voir §6).] > **Réserve pour septembre (à activer en push haute saison)** — nouveaux ad groups Search acquisition individuels :\n> - *Villa piscine* → `/location-villa-martinique-piscine` : `[location villa martinique piscine]`, `\"location villa martinique piscine privée\"`, `\"villa martinique vue mer débordement\"`.\n> - *Sainte-Luce* → `/sainte-luce-martinique` : `[location villa sainte-luce martinique]`, `\"location vacances sainte luce martinique\"`.\n> - *Couples / Mabouya* → `/mabouya` : `\"location studio jacuzzi martinique\"`, `\"week-end romantique martini",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-11",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 3) Mots-clés négatifs — **à appliquer au niveau COMPTE** (Outils → Mots-clés négatifs → liste partagée « Négatifs globaux Amaryllis »)] ```\n-emploi -recrutement -recrute -job -salaire -stage -saisonnier -\"offre d'emploi\" -cdd -cdi\n-achat -acheter -vente -vendre -\"à vendre\" -immobilier -investir -investissement -rentabilité\n-\"prix m2\" -\"agence immobilière\" -notaire -syndic -bail -colocation -\"longue durée\" -\"au mois\"\n-croisière -bateau -ferry -\"location bateau\" -voilier -catamaran\n-hotel -hôtel -resort -\"club med\" -\"all inclusive\" -\"tout compris\" -\"village vacances\"\n-camping -\"mobil home\" -gite -gîte -auberge -\"chambre d'hôte\"\n-\"pas cher\" -grat",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-12",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 4) Annonces RSA finalisées (copier-collables)] > Règles : **Titres ≤ 30 caractères · Descriptions ≤ 90 caractères.** Fournir **15 titres + 4 descriptions** par ad group. Épingler **2 titres max par position** (au-delà, ça bride l'optimisation RSA).\n> ✅ Conforme nomenclature : seules **Amaryllis** et **Iguana** sont des « villas » ; Zandoli=logement, Géko=cocon, Mabouya=studio. (Pour l'offre groupe on parle de « villas » au pluriel = OK car Amaryllis en fait partie ; éviter « la villa Zandoli ».)",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-13",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 4) Annonces RSA finalisées (copier-collables) › C1 — Offre Groupe → `/location-groupe-sainte-luce`] **15 Titres** (≤30 car.)\n```\n1.  Villas Groupe Sainte-Luce        (← épingler position 1)\n2.  Jusqu'à 11 Personnes Réunies\n3.  3 Villas, Un Seul Paiement        (← épingler position 2)\n4.  Réservez en Direct, Sans Frais\n5.  Une Résidence Privée Entière\n6.  Piscines et Jacuzzi Privés\n7.  Idéal Familles et Amis\n8.  Une Adresse pour Tout le Groupe\n9.  Sans Commission Airbnb\n10. Sainte-Luce, Sud Martinique\n11. Réserver Votre Séjour Groupe\n12. Vue Mer, Terrasses au Soleil\n13. Le Grand Format en Direct\n14. Paiement Sécurisé Stripe\n15. Contact Direct a",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-14",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 4) Annonces RSA finalisées (copier-collables) › C2 — Brand défensif → `/` (accueil)] **15 Titres** (≤30 car.)\n```\n1.  Villa Amaryllis Officiel          (← épingler position 1)\n2.  Site Direct Amaryllis             (← épingler position 2)\n3.  Amaryllis Locations Direct\n4.  Réservez au Meilleur Prix\n5.  Sans Commission, Sans Frais\n6.  Contact Direct avec l'Hôte\n7.  La Martinique en Direct\n8.  Réservation Sans Intermédiaire\n9.  Logements Premium Sainte-Luce\n10. Réponse de l'Hôte Sous 1h\n11. Le Tarif Direct Propriétaire\n12. Réserver sur le Site Officiel\n13. Découvrir Villa Amaryllis\n14. Piscine Privée, Vue Mer\n15. Noté 5 sur 5 par les Voyageurs\n``",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-15",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 4) Annonces RSA finalisées (copier-collables) › C3 — Remarketing (Display, ton doux, pas d'urgence agressive) → fiche vue ou `/reservation-directe-martinique`] **15 Titres** (≤30 car.)\n```\n1.  Votre Séjour Vous Attend          (← épingler position 1)\n2.  Finalisez Votre Réservation       (← épingler position 2)\n3.  Dispos Mises à Jour en Direct\n4.  Réservez Sans Frais Airbnb\n5.  Reprenez Là où Vous Étiez\n6.  Vos Dates Sont Encore Libres\n7.  Paiement en Ligne Sécurisé\n8.  Contact Direct avec l'Hôte\n9.  La Martinique Vous Attend\n10. Réserver en Quelques Clics\n11. Vue Mer et Piscine Privée\n12. Au Meilleur Tarif Direct\n13. Découvrir les Disponibil",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-16",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 4) Annonces RSA finalisées (copier-collables) › Extensions (= Composants — à ajouter au niveau COMPTE, héritées par toutes les campagnes)] **Accroches / Callouts** (≤25 car.) :\n```\nSans frais Airbnb\nContact direct hôte\nRéponse sous 1h\nPiscine privée\nVue mer\nRéservation en direct\nPaiement sécurisé Stripe\nJusqu'à 11 personnes\nLivret digital inclus\nNoté 5/5 par les voyageurs\n```\n\n**Liens annexes / Sitelinks** (vérifiés sur routes live) :\n| Titre du lien (≤25c) | Description 1 (≤35c) | Description 2 (≤35c) | URL |\n|---|---|---|---|\n| Offre groupe Sainte-Luce | 3 villas, jusqu'à 11 pers. | Un seul paiement direct | `/location-groupe-sainte-luce` |\n",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-17",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 5) Mapping mots-clés → landing page exacte] | Ad group / intention | Mots-clés | Landing page (URL exacte, live ✅) |\n|---|---|---|\n| C1 — Groupe / grande capacité | `villa groupe`, `10/11/12 personnes`, `entre amis`, `famille` | `/location-groupe-sainte-luce` |\n| C2 — Brand | `villa amaryllis`, `villamaryllis`, `amaryllis locations` | `/` (accueil) |\n| C3 — Remarketing | (audience) | fiche déjà vue, sinon `/reservation-directe-martinique` |\n| *Sept* — Villa piscine | `villa martinique piscine`, `vue mer débordement` | `/location-villa-martinique-piscine` |\n| *Sept* — Sainte-Luce | `location vacances sainte-luce`, `villa sainte-luce` | `/sainte",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-18",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 6) Plan de lancement ÉTAPE PAR ÉTAPE] > Légende : ⚙️ = réglage exact dans l'interface Google Ads. Fais-le dans l'ordre.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-19",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 6) Plan de lancement ÉTAPE PAR ÉTAPE › Étape 0 — Pré-requis (bloquant)] - ☐ **Crédit ~400 € confirmé** (Facturation → Promotions : palier + expiration notés).\n- ☐ **CHECKLIST TRACKING §7 entièrement cochée** ← **bloquant, ne pas sauter**.\n- ☐ Liste de mots-clés négatifs §3 créée en **liste partagée** appliquée au compte.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-20",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 6) Plan de lancement ÉTAPE PAR ÉTAPE › Étape 1 — Créer C1 « Offre Groupe Sainte-Luce »] 1. **Nouvelle campagne** → Objectif **« Ventes »** (ou « Créer sans objectif »).\n2. Type **« Search / Réseau de Recherche »**.\n3. ⚙️ Réseaux : **décocher** « Réseau Display » ET « Partenaires du Réseau de Recherche ».\n4. ⚙️ **Zones géo** : ajouter **France** → puis **Paramètres avancés de localisation** → exclure **Martinique, Guadeloupe, Guyane, La Réunion, Mayotte, Saint-Martin, Saint-Barthélemy** → cocher **« Présence : personnes se trouvant dans vos zones ciblées »**.\n5. ⚙️ **Langue** : Français.\n6. ⚙️ **Budget** : **8 €/jour**.\n7. ⚙️ **Enchères** : cho",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-21",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 6) Plan de lancement ÉTAPE PAR ÉTAPE › Étape 2 — Créer C2 « Brand défensif »] 1. Nouvelle campagne Search, mêmes réglages géo/langue/réseau qu'en Étape 1.\n2. ⚙️ Budget **2 €/jour**, **CPC manuel plafonné 0,30–0,60 €**.\n3. 1 ad group « Brand », mots-clés §2, RSA Brand §4, URL `https://villamaryllis.com/`.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-22",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 6) Plan de lancement ÉTAPE PAR ÉTAPE › Étape 3 — (Septembre) Créer C3 « Remarketing »] 1. Vérifier que l'audience **RMKT_Vu_fiche_calendrier_sans_resa** est passée >100 utilisateurs/30j (Gestionnaire d'audiences).\n2. Nouvelle campagne **Display** → objectif Ventes.\n3. ⚙️ Géo/langue identiques (France, DOM exclus).\n4. ⚙️ Budget **2,30 €/jour**, enchères **CPC manuel** (ou vCPM bas).\n5. ⚙️ **Audience** : cibler **RMKT_Vu_fiche_calendrier_sans_resa** (et exclure les convertisseurs via `/merci` — déjà géré dans la définition de l'audience).\n6. ⚙️ **Plafond de fréquence** : **3 impressions/jour/utilisateur**.\n7. ⚙️ **Exclusions de contenu Display**",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-23",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 6) Plan de lancement ÉTAPE PAR ÉTAPE › Étape 4 — Planning horaire (après ~1 semaine de data)] ⚙️ Calendrier de diffusion → ajuster les enchères : **+15 %** les **vendredi–dimanche** et **tous les jours 19h–23h** (pic recherche voyage). Ne pas restreindre les horaires au début (on a besoin de volume pour voir où sont les conversions).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-24",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 6) Plan de lancement ÉTAPE PAR ÉTAPE › Étape 5 — Lancer] - Activer **C1 + C2** (juin). Laisser tourner **sans toucher pendant 4–5 jours** (le temps d'accumuler des données ; modifier trop tôt = on réinitialise l'apprentissage).\n- C3 reste en brouillon jusqu'à septembre.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-25",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 7) ✅ CHECKLIST TRACKING PRÉ-LANCEMENT (BLOQUANTE — ne rien lancer tant que ce n'est pas vert)] > ⚠️ **LE POINT LE PLUS IMPORTANT DU DOC.** Une campagne sans conversion attribuable = de l'argent jeté sans pouvoir piloter.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-26",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 7) ✅ CHECKLIST TRACKING PRÉ-LANCEMENT (BLOQUANTE — ne rien lancer tant que ce n'est pas vert) › Rappel technique (vérifié dans le code)] - ❌ **`booking_completed`** = event **serveur** (Measurement Protocol, `stripe-webhook.js`). Il utilise un **`client_id` synthétique** + `non_personalized_ads:true` → **non rattaché au clic pub (pas de gclid)** → **INUTILISABLE pour l'attribution Ads**. À garder seulement comme journal serveur de secours.\n- ✅ **`purchase`** = event **client** (gtag, déclenché au succès du paiement dans le tunnel villa **et** le modal groupe : `window.gtag('event','purchase',{value,currency,transaction_id})`). Il porte le **vr",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-27",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 7) ✅ CHECKLIST TRACKING PRÉ-LANCEMENT (BLOQUANTE — ne rien lancer tant que ce n'est pas vert) › Checklist (cocher dans l'ordre)] 1. ☐ **Lien GA4 ↔ Google Ads actif** — Ads → Outils → Comptes associés → GA4 lié (✅ fait 30/05, compte 226-428-3778). Publicité personnalisée ON.\n2. ☐ **Faire un VRAI test de bout en bout** : une réservation test (mode test Stripe ou petite vraie résa) sur `/location-groupe-sainte-luce` ET sur une fiche villa, en cliquant depuis une annonce ou avec un `?gclid=test` simulé.\n3. ☐ **GA4 DebugView** (Admin → DebugView, avec l'extension GA Debugger ou `?_dbg=1`) : vérifier que l'event **`purchase`** arrive **AVEC** :\n   -",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-28",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 8) Pilotage : quoi regarder, seuils de bascule, couper / scaler › Cadence de revue] | Quand | Quoi regarder | Action |\n|---|---|---|\n| **Chaque jour S1** | Que ça dépense (budget consommé), 0 erreur d'annonce/refus, clics arrivent | Corriger refus / URL cassée. **Ne PAS toucher les enchères avant J5.** |\n| **Fin S1 (J7)** | **Rapport Termes de recherche** | Ajouter en négatif tout le hors-sujet. **Priorité n°1** (c'est là que fuit le budget). |\n| **S2** | CPC moyen, CTR, taux de conv. clic→résa, 1ères conversions | Affiner CPC max, mettre en pause les mots-clés sans clic/cher. |\n| **S4** | CPA réel, ROAS, quels ad groups/mots-clés convertissen",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-29",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 8) Pilotage : quoi regarder, seuils de bascule, couper / scaler › KPIs cibles (ESTIMATIONS marché FR tourisme — recalibrer sur tes données)] | KPI | Cible estimée | Lecture |\n|---|---|---|\n| **CPC moyen** | C1 ~0,40–0,90 € · Brand <0,60 € | au-delà → améliorer annonces / Quality Score |\n| **CTR** | Search >4 % (Brand >10 %) · Display >0,4 % | CTR bas = annonce ou ciblage à revoir |\n| **Taux conv. (clic→résa)** | ~1,5–3 % | <1 % sur >100 clics = problème landing/ciblage |\n| **CPA** | **≤ 40–60 €** (groupe : peut monter à 150 € et rester ultra-rentable vu le panier) | comparer à la **commission OTA évitée** (15–20 % du panier) |\n| **ROAS** | **≥",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-30",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 8) Pilotage : quoi regarder, seuils de bascule, couper / scaler › Règles de décision (chiffrées)] - **Couper un mot-clé** : **>25–30 clics et 0 conversion** → pause.\n- **Couper une campagne** : après **~150 € dépensés**, si **CPA > commission OTA évitée** (≈ 15–20 % du panier) → stop, retour analyse.\n- **Baisser une enchère** : CPC moyen > cible **et** taux de conv. faible → −15 % et observer 3 jours.\n- **Monter une enchère** : mot-clé qui convertit mais **taux d'impressions perdues (rang) élevé** (>30 %) → +15 %.\n- **Scaler** : CPA ≤ cible **ET** ROAS ≥ 8× sur **≥ 5 conversions** → **+20 % de budget tous les 3–4 jours** (jamais doubler d'un c",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-31",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § 8) Pilotage : quoi regarder, seuils de bascule, couper / scaler › Premier KPI de succès du trimestre] **1 seule résa groupe** (panier 2 500–4 000 €) sur le crédit ~400 € = objectif atteint et ROAS >6×. Tout le reste (Brand, individuels) est du bonus. **Concentrer, ne pas disperser.**\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-google-ads-2026-06-md-32",
    "text": "[docs/marketing/campagne-google-ads-2026-06.md § Annexe — Différences vs `docs/google-ads-kit.md` (ce qui a changé)] - Intégration des **perfs réelles 2025** (occ/ADR/RevPAR) → priorisation des biens à cibler ; **Nogent et Iguana explicitement exclus**.\n- C1 passe à **2 ad groups** (capacité vs amis/famille) pour des annonces plus serrées.\n- **Mapping landing pages élargi et vérifié live** (8 routes confirmées dans le code).\n- **Checklist tracking renforcée et rendue bloquante** avec test bout-en-bout obligatoire AVANT lancement.\n- **Plan de lancement étape par étape** avec réglages d'interface exacts (présence vs intérêt, réseau Display/partenaires OFF, plafond fréquence, exclusions Display",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-google-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-0",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § Introduction] # Campagne Meta Ads (Facebook + Instagram) — Amaryllis Locations — Juin 2026 (PRÊTE À LANCER)\n\n> Préparée le **2026-06-01**. Vincent : tu **prépares dans Meta Ads Manager et tu lances/dépenses toi-même**. Ce doc est **copier-collable bloc par bloc**.\n> ⚠️ **NE RIEN LANCER avant d'avoir coché la CHECKLIST TRACKING §7 (bloquante)** — sans le Pixel + l'event Purchase à valeur €, tu pilotes à l'aveugle et tu ne pourras jamais construire de retargeting ni de lookalike.\n> Complément de la campagne Google Ads (`docs/marketing/campagne-google-ads-2026-06.md`). **Google = intention / Meta = découverte & désir.** Les deux sont complémentaire",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-1",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 0) Pourquoi Meta, et pourquoi maintenant (résumé décisionnel) › Le bon outil pour ce produit] Meta n'est pas un canal d'intention (on n'y « cherche » pas une villa). C'est un canal de **découverte et de désir** : on fait défiler, on tombe sur une photo de piscine à débordement face à la mer, on rêve, on clique. **C'est exactement le terrain d'Amaryllis** : produit visuellement spectaculaire (villa piscine, jacuzzi privatif, vue mer turquoise) + destination de rêve (Martinique). Là où Google capte une demande existante, Meta **crée la demande**.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-2",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 0) Pourquoi Meta, et pourquoi maintenant (résumé décisionnel) › Les 4 décisions stratégiques] 1. **Meta = étape 2 / complément, pas remplacement de Google.** Google reste prioritaire pour les conversions immédiates (intention forte, offre groupe). Meta vient **construire la notoriété + alimenter le retargeting**, qui mettra des semaines à se charger. Budget Meta volontairement **modeste au départ** (5–10 €/j) à côté du ~400 € Google.\n2. **Juin = creux de réservation individuelle → fenêtre IDÉALE pour Meta.** On ne cherche pas la résa immédiate en juin (pic de recherche individuelle = sept-oct, groupes = 4–8 mois avant). On profite du creux pour ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-3",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 0) Pourquoi Meta, et pourquoi maintenant (résumé décisionnel) › Cibles publicitaires (par bien — données réelles 2025)] | Bien | Type (nomenclature stricte) | Occ. 2025 | ADR € | Angle Meta | Landing |\n|---|---|---|---|---|---|\n| **Villa Amaryllis** | **villa** premium piscine, Sainte-Luce, 8 pers | **33 %** | 312 | **Rêve premium / vue / piscine** — CIBLE n°1 (visuels spectaculaires) | `/amaryllis` |\n| **Studio Mabouya** | **studio** jacuzzi, Sainte-Luce, 2 pers | 28 % | 82 | **Romantique / couple / jacuzzi** | `/mabouya` |\n| **Géko** | **cocon** court séjour, Sainte-Luce, 4 pers | 39 % | 139 | **Évasion express / Sud Martinique** | `/sainte-lu",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-4",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 0) Pourquoi Meta, et pourquoi maintenant (résumé décisionnel) › USP à marteler dans tous les créatifs] - **Réservation DIRECTE → ~15 % moins cher qu'Airbnb** (pas de frais de service).\n- **Contact direct avec le propriétaire**, réponse rapide.\n- **Paiement sécurisé** (Stripe) + **livret digital** d'accueil.\n- **4,79★ / 97 avis** (preuve sociale — à afficher).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-5",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 1) Stratégie & funnel Meta (TOFU → MOFU → BOFU)] ```\n┌─ TOFU (froid · Notoriété/Découverte) ──────────────────────────────┐\n│  Objectif : être vu par des voyageurs FR métropole qui rêvent       │\n│  Martinique / villa piscine / lune de miel. Beaux visuels.          │\n│  → Génère le trafic site + le viewing de fiches qui REMPLIT le       │\n│    retargeting. Lancé EN JUIN.                                       │\n└────────────────────────────────────────────────────────────────────┘\n                 │ (ceux qui cliquent / regardent ≥50 % vidéo)\n                 ▼\n┌─ MOFU (considération) ─────────────────────────────────────────────┐\n│  Engageurs vi",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-6",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 1) Stratégie & funnel Meta (TOFU → MOFU → BOFU) › Calendrier — quand lancer quoi] | Période | Ce qu'on lance | Pourquoi |\n|---|---|---|\n| **Avant tout** | Checklist tracking §7 (Pixel + CAPI + Purchase €) | Bloquant. Sans ça, pas de retargeting ni lookalike possible. |\n| **Juin (semaines 1-2)** | **C1-TOFU Notoriété/Trafic** : 2 angles (Amaryllis premium + Mabouya couple), 5–10 €/j | Remplir le Pixel, tester les angles pas cher, construire les audiences chaudes pour septembre. |\n| **Juin (semaines 3-4)** | Garder le gagnant, ajouter angle **Groupe** (lead-time long → juin = bon moment pour vendre déc-avril) | Le groupe se réserve 4–8 mois avant ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-7",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 2) Structure de compte (campagnes / ensembles / objectifs)] > **Recommandation honnête vu le faible volume initial** : ne commence **PAS** par l'objectif « Ventes » (Sales). Meta a besoin de **~50 conversions/semaine par ad set** pour sortir de l'apprentissage. À ton volume (résas rares au départ), un ad set « Ventes » resterait coincé en « apprentissage limité » et dépenserait mal. **Commence par « Trafic » (clics vers le site) ou « Notoriété »** — objectifs à signal abondant — puis bascule vers « Ventes » en septembre quand le Pixel aura accumulé des events.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-8",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 2) Structure de compte (campagnes / ensembles / objectifs) › Arborescence (CBO ou ABO ?)] Au démarrage, **budget au niveau de l'ad set (ABO)** — tu gardes le contrôle pour comparer les angles. Passe en **CBO (budget de campagne)** seulement quand un angle gagnant est identifié et que tu scales.\n\n```\nCOMPTE PUBLICITAIRE (à confirmer par Vincent)\n│\n├── CAMPAGNE 1 — TOFU Découverte  [Objectif: TRAFIC]   ← JUIN\n│   ├── Ad set A1 — Froid · Amaryllis premium (audience A, §3)   5 €/j\n│   │     └── 3 créas (1:1, 4:5, 9:16) — angle \"Rêve premium\"\n│   └── Ad set A2 — Froid · Mabouya couple/jacuzzi (audience B)   5 €/j\n│         └── 3 créas — angle \"Romant",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-9",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 3) Audiences — détaillées et copier-collables] > Légende : 🟢 **PRÊTE MAINTENANT (juin)** · 🟡 **PLUS TARD (sept, quand chargée)**",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-10",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 3) Audiences — détaillées et copier-collables › 🟢 Paramètres communs à toutes les audiences froides] - **Lieu** : **France** → **réglage « Personnes vivant à cet endroit »** (PAS « récemment dans cette zone »). **EXCLURE les DOM** : Martinique, Guadeloupe, Guyane, La Réunion, Mayotte (ce sont des résidents, pas des touristes). Dans Meta : ajouter France, puis en **Exclure** : « Martinique », « Guadeloupe », « Guyane française », « La Réunion », « Mayotte ».\n- **Langue** : Français (optionnel — souvent inutile si géo = France).\n- **Âge** : 30–60 ans (cœur de cible CSP+). Mabouya : élargir 28–55.\n- **Sexe** : tous (laisser l'algo arbitrer).\n- **P",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-11",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 3) Audiences — détaillées et copier-collables › 🟢 AUDIENCE A — Froide « Rêve Martinique / Voyage Caraïbes » (pour Amaryllis premium, Géko)] Centres d'intérêt (à coller un par un dans « Centres d'intérêt détaillés ») :\n```\nMartinique\nAntilles françaises\nCaraïbes\nVacances (voyage)\nLocation de vacances\nTourisme\nVoyage de luxe\nVilla (hébergement) / Maison de vacances\nPlongée avec tuba\nPlage\nAntilles\nGuadeloupe (intérêt voyage — pas géo)\n```\nAffiner (option, « Restreindre l'audience » → CSP+) :\n```\nVoyageurs fréquents\nComportement: Voyages internationaux\nRevenu élevé / CSP+ (si dispo selon compte)\n```\nTaille visée : large (1–5 M) — laisse Advantage+",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-12",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 3) Audiences — détaillées et copier-collables › 🟢 AUDIENCE B — Froide « Lune de miel / Couple romantique » (pour Mabouya jacuzzi)] ```\nLune de miel\nVoyage de noces\nRomantisme\nCouples\nSaint-Valentin\nWeek-end en amoureux\nSpa\nJacuzzi / Bain à remous\nMartinique\nCaraïbes\nVacances (voyage)\n```\nÉvénements de vie (très puissant ici) :\n```\nFiançailles récentes (1 an)\nMariage récent (6 mois) / Anniversaire de mariage à venir\n```\nÂge 28–55. **Angle romantique = meilleur ROAS attendu sur Meta** (émotion forte, panier accessible 82 €/nuit).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-13",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 3) Audiences — détaillées et copier-collables › 🟢 AUDIENCE C — Froide « Groupe / Famille / Tribu » (pour Offre Groupe)] ```\nVacances en famille\nVoyage en groupe\nRéunion de famille\nMartinique\nLocation de vacances\nGrande famille\nAnniversaire (événement)\nEnterrement de vie de jeune fille / garçon (EVJF/EVG)\nVacances entre amis\n```\nÂge 30–55 (organisateurs de séjours de groupe). Panier élevé → tolère un CPC plus haut.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-14",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 3) Audiences — détaillées et copier-collables › 🟢 AUDIENCE D — Froide « Vue mer / Évasion » (pour Schœlcher, activable sept)] ```\nMartinique\nBord de mer / Front de mer\nVue sur l'océan\nVacances (voyage)\nLocation de vacances\nTourisme balnéaire\n```",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-15",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 3) Audiences — détaillées et copier-collables › 🟡 RETARGETING (nécessite le Pixel actif — voir §7) — PRÊTES EN SEPT] À créer dès que le Pixel tourne (les audiences se rempliront pendant l'été) :\n| Audience | Définition (Audience personnalisée → Site web) | Fenêtre |\n|---|---|---|\n| **R1 — Visiteurs fiche sans résa** | Personnes ayant déclenché `ViewContent` (ou visité une URL contenant `/amaryllis`, `/mabouya`, `/schoelcher`, `/location-groupe-sainte-luce`) **ET exclure** ceux ayant déclenché `Purchase` | 30 j |\n| **R2 — Checkout abandonné** | `InitiateCheckout` **SANS** `Purchase` | 14 j |\n| **R3 — Engageurs** | Engagement Page FB + Compte IG ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-16",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 3) Audiences — détaillées et copier-collables › 🟡 LOOKALIKE — À ACTIVER QUAND ASSEZ DE DONNÉES (sept+)] - **Source idéale** : audience d'acheteurs (`Purchase`) — mais nécessite **≥100 personnes** dans la source. Tu n'y seras probablement pas avant l'automne.\n- **Source de repli (plus tôt)** : Lookalike sur **visiteurs de fiche (R1)** ou **engageurs vidéo (R3)** dès qu'ils dépassent 100 personnes.\n- Réglage : **Lookalike 1 %** France d'abord (le plus ressemblant), puis tester **1–3 %** pour élargir. Réinjecter en **TOFU** (objectif Trafic ou Ventes).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-17",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 4) Angles créatifs par bien/offre] > Chaque angle = **promesse + émotion + preuve**. Le visuel fait 80 % du job (briefs §6).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-18",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 4) Angles créatifs par bien/offre › ANGLE 1 — Villa Amaryllis « Le rêve premium » (CIBLE n°1)] - **Promesse** : une villa privée avec piscine face à la Martinique, rien que pour vous (jusqu'à 8).\n- **Émotion** : l'évasion, le luxe accessible, « et si c'était vous, là, dans cette eau ? ».\n- **Preuve** : 4,79★ · 97 avis · réservation directe ~15 % moins chère qu'Airbnb.\n- **Visuel hero** : piscine + vue mer + ciel des Antilles (la photo la plus spectaculaire du portefeuille).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-19",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 4) Angles créatifs par bien/offre › ANGLE 2 — Studio Mabouya « Parenthèse à deux » (meilleur ROAS attendu)] - **Promesse** : un cocon avec **jacuzzi privatif** et jardin, pour deux, en Martinique.\n- **Émotion** : intimité, romantisme, reconnexion du couple.\n- **Preuve** : 4,79★ · contact direct avec l'hôte · dès 82 €/nuit (accessible).\n- **Visuel hero** : jacuzzi fumant au crépuscule / deux verres / lumière chaude (PAS de personnes reconnaissables).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-20",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 4) Angles créatifs par bien/offre › ANGLE 3 — T2 Schœlcher « Réveil face au lagon »] - **Promesse** : un appartement de standing avec **vue mer**, café du matin sur la terrasse.\n- **Émotion** : la sérénité, le calme du front de mer.\n- **Preuve** : 4,79★ · paiement sécurisé · livret digital d'accueil.\n- **Visuel hero** : terrasse + horizon mer au lever du jour.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-21",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 4) Angles créatifs par bien/offre › ANGLE 4 — Offre Groupe « Toute la tribu, une seule adresse »] - **Promesse** : réunissez jusqu'à 11 proches dans une résidence privée à Sainte-Luce — **un seul paiement, une seule adresse**.\n- **Émotion** : les retrouvailles, la grande tablée, le rire collectif.\n- **Preuve** : différenciateur unique (cluster mitoyen, piscines + jacuzzi) · sans commission Airbnb · contact direct.\n- **Visuel hero** : grande tablée extérieure / piscine partagée / groupe joyeux (carousel des 3-4 logements).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-22",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 5) COPY finalisée (copier-collable)] > **Ton de marque** : haut de gamme **chaleureux**, jamais tape-à-l'œil. On vend une émotion + la réassurance « réservation directe ». Limites Meta : primary text idéalement **≤125 caractères** (avant le « … voir plus »), titre **≤40 car.**, description **≤30 car.**",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-23",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 5) COPY finalisée (copier-collable) › ANGLE 1 — Villa Amaryllis (→ `/amaryllis`)] **Primary text — variante 1**\n```\nUne villa privée, une piscine, et la Martinique pour horizon. À vous seuls, jusqu'à 8. Réservez en direct — sans frais Airbnb. ☀️\n```\n**Primary text — variante 2**\n```\nImaginez votre matin ici : café sur la terrasse, eau turquoise à vos pieds. La Villa Amaryllis vous attend en Martinique. 4,79★ · 97 avis.\n```\n**Primary text — variante 3**\n```\nPourquoi payer les frais de service Airbnb ? Réservez la Villa Amaryllis en direct : même villa, ~15 % moins cher, contact direct avec l'hôte.\n```\n**Titres (≤40 car.)**\n```\nVotre villa privée ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-24",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 5) COPY finalisée (copier-collable) › ANGLE 2 — Studio Mabouya (→ `/mabouya`)] **Primary text — variante 1**\n```\nUn jacuzzi privatif, un jardin, et juste vous deux. La parenthèse romantique se vit en Martinique. Dès 82 €/nuit, en direct. 💛\n```\n**Primary text — variante 2**\n```\nOffrez-vous une vraie parenthèse à deux : jacuzzi privatif sous les étoiles des Antilles. Réservez en direct, sans frais de service.\n```\n**Primary text — variante 3**\n```\nLune de miel, anniversaire, ou simplement s'évader ensemble. Le studio Mabouya, son jacuzzi et son jardin vous attendent. 4,79★.\n```\n**Titres**\n```\nParenthèse à deux en Martinique\nJacuzzi privatif · just",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-25",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 5) COPY finalisée (copier-collable) › ANGLE 3 — T2 Schœlcher (→ `/schoelcher`)] **Primary text — variante 1**\n```\nLe réveil face au lagon : votre café du matin, la mer pour décor. Appartement de standing avec vue mer en Martinique. En direct.\n```\n**Primary text — variante 2**\n```\nVue mer, terrasse, calme du front de mer. L'appartement de standing à Schœlcher, réservé en direct — sans frais Airbnb. 4,79★.\n```\n**Primary text — variante 3**\n```\nEt si vos vacances commençaient par cette vue ? Appartement de standing face à la mer en Martinique. Paiement sécurisé, contact direct.\n```\n**Titres**\n```\nVue mer en Martinique\nRéveil face au lagon\nApparteme",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-26",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 5) COPY finalisée (copier-collable) › ANGLE 4 — Offre Groupe (→ `/location-groupe-sainte-luce`)] **Primary text — variante 1**\n```\nToute la tribu, une seule adresse. Réunissez jusqu'à 11 proches dans une résidence privée à Sainte-Luce. Un seul paiement. ☀️\n```\n**Primary text — variante 2**\n```\nFamille nombreuse ? Bande d'amis ? Réservez la résidence entière en Martinique : piscines, jacuzzi, et tout le monde réuni. En direct.\n```\n**Primary text — variante 3**\n```\nLe grand format en direct : jusqu'à 11 personnes, plusieurs logements mitoyens, une seule réservation. Sans commission Airbnb.\n```\n**Titres**\n```\nToute la tribu en Martinique\nJusqu'à 11",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-27",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 6) Briefs visuels (formats, do & don't, accroche 1ʳᵉ seconde)] > Tu as un portefeuille photo existant — l'essentiel est de **choisir les bonnes** et d'en **décliner les formats**. Produire 1-2 Reels verticaux serait le gros gain.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-28",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 6) Briefs visuels (formats, do & don't, accroche 1ʳᵉ seconde) › Formats à fournir par annonce (décliner CHAQUE visuel)] | Placement | Ratio | Usage | Priorité |\n|---|---|---|---|\n| Feed FB/IG | **1:1** (1080×1080) ou **4:5** (1080×1350) | image principale feed | ✅ indispensable |\n| Stories / Reels | **9:16** (1080×1920) | full-screen, fort impact | ✅ fort (ce produit y brille) |\n| Carousel | 1:1 par carte | offre groupe / tour des pièces | utile |\n\n> **4:5 prend plus de place dans le feed que 1:1** → privilégier 4:5 en feed. **9:16 obligatoire** pour Stories/Reels (le placement le moins cher et le plus immersif pour du voyage).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-29",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 6) Briefs visuels (formats, do & don't, accroche 1ʳᵉ seconde) › Sélection photo par angle] - **Amaryllis** : LA photo piscine + vue mer (la plus « waouh »). En 2ᵉ : terrasse au coucher de soleil, intérieur lumineux. Carousel possible : piscine → terrasse → chambre → vue.\n- **Mabouya** : jacuzzi (idéalement crépuscule, eau qui fume, lumière chaude), jardin, détail cosy (linge, plantes). Ambiance intime.\n- **Schœlcher** : terrasse + horizon mer au lever du jour, table petit-déj face à la mer.\n- **Groupe** : grande tablée extérieure, piscine partagée, vue d'ensemble de la résidence. **Carousel** = montrer les logements mitoyens.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-30",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 6) Briefs visuels (formats, do & don't, accroche 1ʳᵉ seconde) › Reel / Story — accroche 1ʳᵉ seconde (déterminante)] - **Seconde 0** : la plus belle image en mouvement (travelling lent sur la piscine face mer, ou l'eau du jacuzzi). **Pas de logo, pas de texte d'intro** : on montre le rêve immédiatement.\n- **Secondes 1-3** : 1 phrase texte à l'écran (« Votre villa privée en Martinique » / « Juste vous deux, et un jacuzzi »).\n- **Secondes 4-10** : 2-3 plans (intérieur, terrasse, détail), texte « Réservez en direct · sans frais Airbnb · 4,79★ ».\n- **Fin** : CTA visuel « Lien en bio / Réservez » + URL villamaryllis.com.\n- Format **vertical natif, lum",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-31",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 6) Briefs visuels (formats, do & don't, accroche 1ʳᵉ seconde) › DO] - ✅ Lumière naturelle, couleurs chaudes, eau turquoise saturée juste ce qu'il faut.\n- ✅ Montrer **l'expérience** (le bain, le café face mer) plutôt que juste l'architecture.\n- ✅ Incruster discrètement **4,79★** ou **« sans frais Airbnb »** sur 1 visuel/angle (preuve).\n- ✅ Garder un cadre cohérent avec l'identité chaleureuse premium d'Amaryllis.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-32",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 6) Briefs visuels (formats, do & don't, accroche 1ʳᵉ seconde) › DON'T] - ❌ Pas de photos sombres, désordonnées, ou avec des personnes reconnaissables sans accord (droit à l'image).\n- ❌ Pas de texte couvrant >20 % de l'image (pénalise la diffusion, brouille le message).\n- ❌ Pas de stock photos génériques « Caraïbes » : uniquement les vrais biens (authenticité = conversion).\n- ❌ Ne pas écrire « villa » pour Mabouya/Géko/Schœlcher/Zandoli.\n- ❌ Pas de promesse prix littérale invérifiable (« -15 % » chiffré dans l'image) → préférer « sans frais de service ».\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-33",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 7) CHECKLIST TRACKING (BLOQUANTE — à valider AVANT toute dépense)] > Sans ceci, **aucun retargeting ni lookalike possible**, et tu ne sauras jamais quelle pub génère une résa. Le site a déjà l'event `purchase` côté client (GA4) — il faut son équivalent **Meta Pixel + CAPI**.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-34",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 7) CHECKLIST TRACKING (BLOQUANTE — à valider AVANT toute dépense) › A. Pixel Meta (navigateur)] - [ ] **Créer/identifier le Pixel** dans Meta **Gestionnaire d'événements** (Events Manager). Noter le **Pixel ID**.\n- [ ] **Poser le code de base du Pixel** sur tout le site (dans le `<head>`, toutes pages). Le site est une SPA (Cloudflare Pages) → vérifier que `PageView` se déclenche aussi aux **changements de route** (pas seulement au 1ᵉʳ chargement).\n- [ ] Vérifier avec l'extension **Meta Pixel Helper** (Chrome) que `PageView` remonte sur `/`, `/amaryllis`, `/mabouya`, `/schoelcher`, `/location-groupe-sainte-luce`.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-35",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 7) CHECKLIST TRACKING (BLOQUANTE — à valider AVANT toute dépense) › B. Events standard à câbler (mapper sur les events site existants)] | Event Meta | Quand le déclencher | Paramètres requis |\n|---|---|---|\n| `PageView` | toutes les pages | — |\n| `ViewContent` | ouverture d'une fiche bien | `content_name` (= bien), `content_ids` |\n| `InitiateCheckout` | ouverture/début du formulaire de paiement | `value` (estimé), `currency: 'EUR'` |\n| **`Purchase`** ✅ | résa payée confirmée (même endroit que l'event `purchase` GA4 existant) | **`value` (montant € de la résa)**, **`currency: 'EUR'`**, `content_name` |\n\n> ⚠️ **Le `Purchase` AVEC `value` en € est ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-36",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 7) CHECKLIST TRACKING (BLOQUANTE — à valider AVANT toute dépense) › C. Conversions API (CAPI) — recommandé (fiabilise vs adblock/iOS)] - [ ] Activer la **Conversions API** (server-side) pour au moins `Purchase`. Le site tourne sur **Cloudflare Pages Functions** → une `functions/api/meta-capi.js` peut POSTer l'event `Purchase` vers le **Graph API Meta** au moment du webhook Stripe (`stripe-webhook.js`, là où `booking_completed`/`purchase` est déjà géré). Secrets `META_APP_SECRET` / `META_PAGE_TOKEN` existent déjà → il faudra en plus un **token CAPI du dataset** + le **Pixel/Dataset ID**.\n- [ ] Mettre en place la **déduplication** : envoyer le **m",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-37",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 7) CHECKLIST TRACKING (BLOQUANTE — à valider AVANT toute dépense) › D. Réglages compte / conformité] - [ ] **Vérifier le domaine** `villamaryllis.com` dans Meta Business (Sécurité de la marque → Domaines) — requis pour l'optimisation des conversions (Aggregated Event Measurement).\n- [ ] **Configurer les 8 événements prioritaires** (AEM) avec **`Purchase` en priorité 1**.\n- [ ] **Bandeau de consentement (RGPD)** : le Pixel ne doit se déclencher qu'après consentement cookies (cohérent avec `ad_storage` / Consent Mode déjà au backlog — cf. data-002). Le **Mode de consentement** Meta doit être respecté.\n- [ ] Confirmer le **compte publicitaire** + *",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-38",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 7) CHECKLIST TRACKING (BLOQUANTE — à valider AVANT toute dépense) › E. Validation finale avant lancement] - [ ] **Test Events** (Events Manager → Tester les événements) : faire une vraie résa test (ou simulateur) et voir `Purchase` arriver **avec `value` + `currency=EUR`**, **sans doublon** (dédup OK), **navigateur + serveur**.\n- [ ] Pixel **« Actif »** (vert) dans Events Manager depuis ≥24-48 h avant de scaler.\n\n> **Si le Pixel n'est pas encore posé** : à poser = (1) code de base Pixel dans le `<head>` SPA-aware, (2) `ViewContent` à l'ouverture de fiche, (3) `InitiateCheckout` à l'ouverture du paiement, (4) **`Purchase` avec `value`/`currency`*",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-39",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 8) Budget, calendrier de test, KPIs, règles d'optimisation › Budget (test réaliste, complément du ~400 € Google)] | Phase | Campagne / ad set | Budget/j | Durée | Total |\n|---|---|---|---|---|\n| **Juin sem 1-2** | C1-TOFU : A1 Amaryllis (5 €) + A2 Mabouya (5 €) | **10 €/j** | 14 j | ~140 € |\n| **Juin sem 3-4** | garder gagnant (5 €) + A3 Groupe (5 €) | **10 €/j** | 14 j | ~140 € |\n| **Septembre** | + C2-BOFU Retargeting (5 €) + scale gagnant (jusqu'à 15 €) | **15–20 €/j** | mensuel | à cadrer |\n\n> **Minimum viable** : 5 €/j par ad set pendant ≥7 j avant de juger (sous ce seuil, Meta n'a pas de quoi optimiser). Si budget serré : **1 seul angle à ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-40",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 8) Budget, calendrier de test, KPIs, règles d'optimisation › KPIs attendus (ESTIMATIONS — marché FR tourisme/voyage 2025-2026)] | Métrique | TOFU froid (Trafic/Notoriété) | BOFU Retargeting (Ventes) | Lecture |\n|---|---|---|---|\n| **CPM** | 6–12 € | 8–15 € | coût/1000 impressions |\n| **CTR (lien)** | 0,8–1,8 % | 1,5–3,5 % | <0,8 % froid = créa faible |\n| **CPC (lien)** | 0,40–1,20 € | 0,30–0,90 € | — |\n| **Coût/ViewContent** | 1–3 € | — | engagement fiche |\n| **CPA (résa)** | difficile à juger en juin (peu de volume) | viser **< 15 % du panier** | Mabouya panier ~250-500 € → CPA cible <40-75 € ; Groupe 2 500-4 000 € → CPA cible <300-500 € |\n| **",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-41",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 8) Budget, calendrier de test, KPIs, règles d'optimisation › Règles d'optimisation] **Quand COUPER une pub / un ad set :**\n- CTR lien < 0,6 % après **≥3 000 impressions** → créa faible, coupe ou remplace le visuel.\n- CPC > 1,50 € (TOFU) après 7 j et budget dépensé > 30 € sans engagement → coupe l'angle/l'audience.\n- Ad set en « apprentissage limité » > 7 j sans sortir → fusionne ou élargis l'audience (ne le laisse pas saigner).\n\n**Quand SCALER :**\n- Un angle avec CTR > 1,5 %, CPC bas, fréquence < 2 et coût/ViewContent < 2 € → augmente le budget de **+20-30 % tous les 3-4 jours** (jamais doubler d'un coup : ça relance l'apprentissage).\n- Au scale",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-campagne-meta-ads-2026-06-md-42",
    "text": "[docs/marketing/campagne-meta-ads-2026-06.md § 9) Récap actions Vincent (ordre d'exécution)] 1. **Tracking d'abord** : cocher toute la checklist §7 (Pixel + `Purchase` value € + idéalement CAPI). **Bloquant.**\n2. Confirmer le **compte publicitaire** + moyen de paiement + limite de dépense.\n3. Vérifier le **domaine** `villamaryllis.com` + configurer les 8 events AEM (`Purchase` priorité 1).\n4. Créer **C1-TOFU** (objectif **Trafic**), 2 ad sets (Amaryllis + Mabouya), 3 créas chacun (1:1/4:5/9:16), audiences A & B (§3), 10 €/j.\n5. Laisser tourner **≥7 jours** sans toucher. Juger sur CTR/CPC/ViewContent (pas sur résas).\n6. Couper le perdant, garder le gagnant, ajouter **angle Groupe** (sem 3-4).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/campagne-meta-ads-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-emails-prospection-institutionnels-2026-06-md-0",
    "text": "[docs/marketing/emails-prospection-institutionnels-2026-06.md § Introduction] # Emails de prospection — Référencements & backlinks institutionnels/locaux\n\n> Objectif : bâtir l'**autorité de domaine** de villamaryllis.com (levier SEO n°1 — le site manque de backlinks).\n> Ces 6 emails sont **prêts à envoyer** : personnaliser les `[crochets]`, copier-coller, envoyer depuis l'adresse pro.\n> Complète le template **D** du `netlinking-plan-2026.md` (institutionnel) avec des versions dédiées par cible.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/emails-prospection-institutionnels-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-emails-prospection-institutionnels-2026-06-md-1",
    "text": "[docs/marketing/emails-prospection-institutionnels-2026-06.md § Mode d'emploi (à lire avant d'envoyer)] 1. **Personnaliser tous les `[crochets]`** : `[Prénom]`/`[Nom]` du destinataire, `[email]`, `[titre/URL de l'article]`, `[nom du créateur]`. Ne pas envoyer un email qui contient encore un crochet.\n   ⚠️ **Statut déclaration (maj 2026-06-04)** : les logements ne sont **pas encore déclarés ni classés** en meublé de tourisme → les emails n'affirment AUCUN classement/déclaration (on ne garde que la note voyageurs 4,8★, réelle). Une fois la **déclaration en mairie (cerfa 14004)** faite, on pourra l'ajouter ; le **classement (étoiles)** ouvrirait l'abattement micro-BIC 71 % + est souvent requis ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/emails-prospection-institutionnels-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-emails-prospection-institutionnels-2026-06-md-2",
    "text": "[docs/marketing/emails-prospection-institutionnels-2026-06.md § 1. Comité Martiniquais du Tourisme — martinique.org] **À : ** [email du CMT — service hébergements / référencement, à récupérer sur martinique.org]\n**Objet : ** Référencement hébergements de tourisme — Amaryllis Locations (Sainte-Luce & Schœlcher)\n\nBonjour [Prénom / « Madame, Monsieur »],\n\nNous gérons **Amaryllis Locations**, un ensemble de 7 hébergements de vacances en Martinique (Sainte-Luce et Schœlcher), commercialisés en réservation directe sur [villamaryllis.com](https://villamaryllis.com).\n\nNous souhaiterions figurer dans votre annuaire officiel des hébergements touristiques de l'île. Nos logements sont notés en moyenne *",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/emails-prospection-institutionnels-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-emails-prospection-institutionnels-2026-06-md-3",
    "text": "[docs/marketing/emails-prospection-institutionnels-2026-06.md § 2. Office de Tourisme de Sainte-Luce / Sud Martinique] **À : ** [email de l'OT de Sainte-Luce / Sud Martinique]\n**Objet : ** Hébergements à Sainte-Luce — demande de fiche sur votre site\n\nBonjour [Prénom / « Madame, Monsieur »],\n\nActeur local de l'hébergement à **Sainte-Luce**, nous proposons plusieurs logements de vacances (piscine, vue mer, dès 85 €/nuit) en réservation directe sur [villamaryllis.com](https://villamaryllis.com).\n\nNous aimerions être référencés parmi les hébergements recommandés sur le site de l'Office. Nos voyageurs nous notent **4,8★** en moyenne, et nous orientons systématiquement nos clients vers les activit",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/emails-prospection-institutionnels-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-emails-prospection-institutionnels-2026-06-md-4",
    "text": "[docs/marketing/emails-prospection-institutionnels-2026-06.md § 3. Petit Futé Martinique — petitfute.com] **À : ** [email Petit Futé — partenariats / référencement hébergement]\n**Objet : ** Inscription guide Petit Futé Martinique — Amaryllis Locations\n\nBonjour [Prénom / « Madame, Monsieur »],\n\nLecteurs du **Petit Futé Martinique**, nous gérons à Sainte-Luce et Schœlcher des hébergements de vacances en réservation directe, présentés sur [villamaryllis.com](https://villamaryllis.com) (piscine, vue mer, note moyenne 4,8★).\n\nNous souhaiterions être inscrits — et idéalement mis en avant — dans votre guide en ligne, rubrique hébergements du Sud.\n\nPourriez-vous m'indiquer les modalités d'inscriptio",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/emails-prospection-institutionnels-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-emails-prospection-institutionnels-2026-06-md-5",
    "text": "[docs/marketing/emails-prospection-institutionnels-2026-06.md § 4. GuideMartinique / annuaires tourisme MQ] **À : ** [email de l'annuaire — GuideMartinique ou équivalent]\n**Objet : ** Demande de fiche hébergement — Amaryllis Locations (Sud Martinique)\n\nBonjour [Prénom / « Madame, Monsieur »],\n\nVotre annuaire est une référence pour les voyageurs qui préparent leur séjour en Martinique. Nous proposons à Sainte-Luce et Schœlcher 7 hébergements de vacances en réservation directe : [villamaryllis.com](https://villamaryllis.com).\n\nNous aimerions y créer une fiche avec un lien vers notre site. Nos atouts : réservation en direct (~15 % moins cher que les plateformes), piscine, vue mer, dès 85 €/nuit",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/emails-prospection-institutionnels-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-emails-prospection-institutionnels-2026-06-md-6",
    "text": "[docs/marketing/emails-prospection-institutionnels-2026-06.md § 5. Blogueur / créateur voyage Antilles (séjour découverte)] > ⚠️ **À personnaliser fortement** : remplacer `[nom du créateur]` et citer 1 contenu précis qu'il a publié (preuve que tu le suis vraiment).\n\n**À : ** [email du créateur]\n**Objet : ** Séjour découverte à Sainte-Luce pour [nom du créateur] ?\n\nBonjour [Prénom],\n\nJe suis votre contenu voyage [Antilles / Martinique] avec plaisir — [mentionner ici 1 publication précise : ex. « votre vidéo sur Les Salines »].\n\nJe gère **Amaryllis Locations**, des hébergements de vacances à Sainte-Luce ([villamaryllis.com](https://villamaryllis.com)). Nous serions ravis de vous accueillir pou",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/emails-prospection-institutionnels-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-emails-prospection-institutionnels-2026-06-md-7",
    "text": "[docs/marketing/emails-prospection-institutionnels-2026-06.md § 6. Listicle « où dormir / meilleures villas Sainte-Luce » (inclusion dans un article existant)] > ⚠️ **À personnaliser** : remplacer `[titre/URL de l'article]` par l'article réel repéré, et citer un détail qui prouve que tu l'as lu.\n\n**À : ** [email de l'auteur / rédaction]\n**Objet : ** Suggestion pour votre article « [titre de l'article] »\n\nBonjour [Prénom / « Madame, Monsieur »],\n\nJ'ai lu votre article **« [titre/URL de l'article] »** — une sélection vraiment utile pour qui cherche où dormir à Sainte-Luce.\n\nNous proposons à Sainte-Luce des hébergements de vacances en réservation directe (piscine, vue mer, dès 85 €/nuit, **4,8★",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/emails-prospection-institutionnels-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-emails-prospection-institutionnels-2026-06-md-8",
    "text": "[docs/marketing/emails-prospection-institutionnels-2026-06.md § Récap des ancres (à varier dans le temps)] | # | Cible | Ancres proposées |\n|---|---|---|\n| 1 | Comité Martiniquais du Tourisme | Amaryllis Locations · hébergements de vacances en Martinique · villamaryllis.com |\n| 2 | OT Sainte-Luce / Sud | location villa Sainte-Luce · hébergements de vacances à Sainte-Luce · Amaryllis Locations |\n| 3 | Petit Futé Martinique | Amaryllis Locations · louer une villa en Martinique · villamaryllis.com |\n| 4 | GuideMartinique / annuaires | hébergements de vacances en Martinique · villamaryllis.com · location villa Sainte-Luce |\n| 5 | Blogueur / créateur | Amaryllis Locations · hébergements de vacanc",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/emails-prospection-institutionnels-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-0",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § Introduction] # Optimisation Google Business Profile — 2 fiches existantes (juin 2026)\n\n> Décision : on garde **Villa Amaryllis** + **Résidence Amaryllis** (pas de nouvelle fiche Bellevue/Nogent).\n> Objectif : SEO local + conversion. ⚠️ Nomenclature : « villa » = Amaryllis uniquement ; la Résidence regroupe des **logements** (studio/appartements), jamais « villas ».\n> Avis : 44/44 répondus (02/06) ✅.\n>\n> ⚠️⚠️ **CONSTAT 02/06 (vérifié dans l'éditeur GBP)** : pour la catégorie **« Maison de vacances » (hébergement)**, Google **n'expose PAS de champ « Description »** ni la plupart des attributs (l'onglet « Plus » ne propose que des horaires + « Clie",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-1",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 1) Villa Amaryllis (Sainte-Luce — chemin Bois Grillé, Clos de Bellevue) › Description (à coller dans « Description de l'entreprise », ≤ 750 car.)] > Villa Amaryllis — villa de standing avec piscine à débordement (eau salée) et vue mer, sur les hauteurs de Sainte-Luce, dans le Sud de la Martinique. 3 chambres climatisées avec salle de bain, vaste terrasse, carbet traditionnel, cuisine équipée et coin barbecue. Idéale pour une famille ou un petit groupe (jusqu'à 6 personnes) en quête de calme et d'intimité, à quelques minutes des plus belles plages. Réservation en direct avec le propriétaire sur villamaryllis.com : environ 15 % moins cher qu'Airbnb",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-2",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 1) Villa Amaryllis (Sainte-Luce — chemin Bois Grillé, Clos de Bellevue) › Catégories] - **Principale** : Maison de vacances *(déjà en place)*\n- Secondaires : Hébergement de vacances · Location de vacances",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-3",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 1) Villa Amaryllis (Sainte-Luce — chemin Bois Grillé, Clos de Bellevue) › Attributs à cocher (s'ils existent pour la catégorie)] Piscine · Wi-Fi gratuit · Parking gratuit sur place · Climatisation · Vue sur la mer · Cuisine équipée · Barbecue · Animaux (selon ta politique) · Espace extérieur/terrasse",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-4",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 1) Villa Amaryllis (Sainte-Luce — chemin Bois Grillé, Clos de Bellevue) › Lien site (champ « Site Web »)] `https://villamaryllis.com/amaryllis`",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-5",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 1) Villa Amaryllis (Sainte-Luce — chemin Bois Grillé, Clos de Bellevue) › Post Google (type « Nouveautés » — à publier)] > 🌴 Envie de la Martinique côté Sud ? Villa Amaryllis vous attend à Sainte-Luce : piscine à débordement vue mer, carbet, calme absolu. **Réservez en direct sur villamaryllis.com et économisez ~15 % vs Airbnb**, sans frais de service. La haute saison (déc–avril) se réserve tôt !\n> **Bouton : « Réserver »** → https://villamaryllis.com/amaryllis\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-6",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 2) Résidence Amaryllis (Sainte-Luce — quartier Montravail) › Description (≤ 750 car.)] > Résidence Amaryllis — résidence privée au calme, quartier Montravail à Sainte-Luce (Martinique). Plusieurs logements indépendants joliment équipés (studio et appartements), piscine, terrasses et jardin tropical, à proximité des plages, commerces et distilleries du Sud. Parking sur place, Wi-Fi, climatisation. Parfait pour un séjour reposant en couple, en famille ou entre amis ; possibilité de réunir plusieurs logements pour un grand groupe (jusqu'à 11 personnes). Accueil chaleureux avec cocktail de bienvenue. Réservation en direct sur villamaryllis.com : envi",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-7",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 2) Résidence Amaryllis (Sainte-Luce — quartier Montravail) › Catégories] - **Principale** : Maison de vacances *(ou « Résidence de tourisme » si proposé)*\n- Secondaires : Hébergement de vacances · Location de vacances",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-8",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 2) Résidence Amaryllis (Sainte-Luce — quartier Montravail) › Attributs à cocher] Piscine · Wi-Fi gratuit · Parking gratuit · Climatisation · Cuisine équipée · Espace extérieur/jardin · Animaux (selon politique)",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-9",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 2) Résidence Amaryllis (Sainte-Luce — quartier Montravail) › Lien site (champ « Site Web »)] `https://villamaryllis.com/location-groupe-sainte-luce`\n*(la page groupe met en avant Zandoli + Géko + Mabouya ensemble ; ou pointer vers `/sainte-luce-martinique` si tu préfères une page plus générale)*",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-10",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 2) Résidence Amaryllis (Sainte-Luce — quartier Montravail) › Post Google (à publier)] > ☀️ Un séjour au calme à Sainte-Luce ? La Résidence Amaryllis propose studio et appartements avec piscine, à 5 min des plages du Sud. En famille, en couple ou en groupe (jusqu'à 11 pers. en combinant les logements). **Réservez en direct sur villamaryllis.com**, ~15 % moins cher qu'Airbnb, sans frais de service.\n> **Bouton : « Réserver »** → https://villamaryllis.com/location-groupe-sainte-luce\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-11",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 3) Photos (action Vincent — upload de tes fichiers)] Pour les 2 fiches, ajouter **5–10 photos récentes et nettes** (Google favorise les fiches avec photos fraîches) :\n- Villa : extérieur/vue mer, piscine à débordement, carbet, une chambre, terrasse au coucher du soleil, cuisine.\n- Résidence : piscine, un logement type, jardin/extérieur, façade, détail accueil.\n- Bonus : 1 photo de couverture + 1 logo carré.\n> Je ne peux pas uploader tes fichiers locaux (dialogue système) — c'est la seule partie 100 % manuelle.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-optimisation-2026-06-md-12",
    "text": "[docs/marketing/gbp-optimisation-2026-06.md § 4) Rappels] - **Posts Google** = signal de fraîcheur fort → en publier ~1 toutes les 2-3 semaines (saison, dispo, offre). Je peux te les pré-rédiger en série.\n- **Q&R** : ajoute toi-même 2-3 questions/réponses fréquentes (accès, parking, animaux) — ça enrichit la fiche.\n- Cohérence **NAP** (nom/adresse/téléphone) identique entre les 2 fiches, le site et les annonces.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-optimisation-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-posts-serie-2026-md-0",
    "text": "[docs/marketing/gbp-posts-serie-2026.md § Introduction] # Série de Posts Google Business — Amaryllis (2026)\n\n> Cadence reco : **1 post toutes les ~2 semaines** par fiche (signal de fraîcheur GBP). Alterner Villa / Résidence.\n> Comment publier : business.google.com → ligne de la fiche → 3ᵉ icône (actualité) **ou** « Voir la fiche » → « Ajouter une actualité ». Coller le texte, choisir le bouton + lien, ajouter 1 photo, Publier.\n> ⚠️ Nomenclature : « villa » = Amaryllis uniquement. Limite ~1 500 caractères/post. Ajouter une **photo** à chaque post (très recommandé).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-posts-serie-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-posts-serie-2026-md-1",
    "text": "[docs/marketing/gbp-posts-serie-2026.md § Introduction › Post 1 — Villa Amaryllis ✅ (publié le 02/06)] **Texte :**\n> 🌴 Votre villa avec piscine et vue mer à Sainte-Luce vous attend. Villa Amaryllis : piscine à débordement (eau salée), carbet traditionnel, terrasse face à la mer des Caraïbes, dans le calme des hauteurs du Sud de la Martinique. Réservez en direct sur villamaryllis.com — environ 15 % moins cher qu'Airbnb, sans frais de service, contact direct avec votre hôte. La haute saison (déc–avril) part vite : réservez tôt 🌅\n\n**Bouton :** Réserver → `https://villamaryllis.com/amaryllis`\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-posts-serie-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-posts-serie-2026-md-2",
    "text": "[docs/marketing/gbp-posts-serie-2026.md § Introduction › Post 2 — Résidence Amaryllis (calme / groupe) ✅ (publié le 02/06)] > ☀️ Un séjour ressourçant à Sainte-Luce ? La Résidence Amaryllis propose studio et appartements au calme, piscine et jardin tropical, à 5 min des plages du Sud. Parfait en couple, en famille, ou en réunissant plusieurs logements pour un grand groupe (jusqu'à 11 personnes). Accueil chaleureux avec cocktail de bienvenue 🍹 Réservation en direct sur villamaryllis.com, sans frais de service.\n\n**Bouton :** Réserver → `https://villamaryllis.com/location-groupe-sainte-luce`\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-posts-serie-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-posts-serie-2026-md-3",
    "text": "[docs/marketing/gbp-posts-serie-2026.md § Introduction › Post 3 — Studio Mabouya (couple / jacuzzi) → fiche Résidence ✅ (publié le 04/06, carrousel 4 photos)] > 💚 Escapade en amoureux en Martinique ? Le studio Mabouya, son jacuzzi privatif et son jardin fleuri sont faits pour vous. Calme absolu, plage d'Anse Mabouya à 5 min : l'adresse des couples à Sainte-Luce. Réservez en direct sur villamaryllis.com — sans frais, contact direct avec l'hôte.\n\n**Bouton :** Réserver → `https://villamaryllis.com/mabouya`\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-posts-serie-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-posts-serie-2026-md-4",
    "text": "[docs/marketing/gbp-posts-serie-2026.md § Introduction › Post 4 — Quand venir (saison) → fiche Villa] > 📅 Quand partir en Martinique ? La saison sèche (décembre à avril) offre le meilleur climat : soleil, mer chaude, peu de pluie. C'est aussi la période la plus demandée — anticipez ! Toutes nos disponibilités en direct sur villamaryllis.com.\n\n**Bouton :** En savoir plus → `https://villamaryllis.com/meilleure-saison-martinique`\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-posts-serie-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-posts-serie-2026-md-5",
    "text": "[docs/marketing/gbp-posts-serie-2026.md § Introduction › Post 5 — Plages & activités → fiche Résidence] > 🏝️ À 5–20 min de nos logements : Anse Mabouya, Anse Corps de Garde, les Salines, snorkeling avec les tortues, distilleries de rhum AOC… Le Sud de la Martinique a tout pour un séjour inoubliable. Réservez votre pied-à-terre à Sainte-Luce sur villamaryllis.com.\n\n**Bouton :** En savoir plus → `https://villamaryllis.com/sainte-luce-martinique`\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-posts-serie-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-posts-serie-2026-md-6",
    "text": "[docs/marketing/gbp-posts-serie-2026.md § Introduction › Post 6 — Offre groupe → fiche Résidence] > 👨‍👩‍👧‍👦 Vous partez en tribu ? Réunissez jusqu'à 11 proches à Sainte-Luce en combinant plusieurs logements de la Résidence Amaryllis (Zandoli, Géko, Mabouya), avec piscines privées. Idéal familles élargies, groupes d'amis, anniversaires. Devis rapide en direct sur villamaryllis.com.\n\n**Bouton :** Réserver → `https://villamaryllis.com/location-groupe-sainte-luce`\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-posts-serie-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-posts-serie-2026-md-7",
    "text": "[docs/marketing/gbp-posts-serie-2026.md § Introduction › Post 7 — Vue mer Schœlcher → fiche Résidence (ou Villa)] > 🌊 Côté nord : notre appartement vue mer à Schœlcher, dernier étage, panorama sur la baie de Fort-de-France. Idéal pour 2, à 10 min du centre. Réservation directe sur villamaryllis.com, sans frais de service.\n\n**Bouton :** Réserver → `https://villamaryllis.com/location-appartement-vue-mer-schoelcher`\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-posts-serie-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-gbp-posts-serie-2026-md-8",
    "text": "[docs/marketing/gbp-posts-serie-2026.md § Introduction › Post 8 — Preuve sociale (avis 5★) → fiche Villa] > ⭐ « Villa magnifique, vue à couper le souffle, accueil parfait » — nos voyageurs nous notent 5/5. Vivez l'expérience Amaryllis en Martinique et réservez en direct sur villamaryllis.com pour le meilleur tarif, sans frais de service. Merci à tous nos hôtes 💛\n\n**Bouton :** Réserver → `https://villamaryllis.com/amaryllis`\n\n---\n\n> 🔁 Après le post 8, recommencer le cycle (les posts récents prennent le dessus). Adapter selon saison/offres ponctuelles. Je peux régénérer une série à thème (Noël, vacances scolaires, dernière minute) sur demande.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/gbp-posts-serie-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-meta-lancement-checklist-md-0",
    "text": "[docs/marketing/meta-lancement-checklist.md § Introduction] # Meta Ads — Checklist de lancement « DEMAIN » (C1-TOFU juin)\n\n> Condensé actionnable de `campagne-meta-ads-2026-06.md` (copy/audiences détaillées y sont). Cadre : **Claude prépare, Vincent lance/dépense** (paiement + Publier = Vincent).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/meta-lancement-checklist.md"
    }
  },
  {
    "id": "doc-docs-marketing-meta-lancement-checklist-md-1",
    "text": "[docs/marketing/meta-lancement-checklist.md § ✅ Prérequis (état au 2026-06-04)] - **Tracking** : Meta Pixel `714189639771397` installé (consent-gated) + events `PageView`/`ViewContent`/`InitiateCheckout`/**`Purchase` avec valeur €** (fiabilisé le 04/06). → **OK pour un objectif Trafic.** (CAPI = bonus, non bloquant.)\n- 🟡 **À FAIRE par Vincent avant de publier :**\n  1. **Compte publicitaire** = « Amaryllis corp » `act_853205825762332` (PAS le DIMA 308 restreint). Confirmer le **moyen de paiement** + poser une **limite de dépense du compte** (sécurité anti-dérapage, ex. 200 €).\n  2. (Recommandé, pas bloquant pour Trafic) **Vérifier le domaine** `villamaryllis.com` dans Meta Business → Sécurit",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/meta-lancement-checklist.md"
    }
  },
  {
    "id": "doc-docs-marketing-meta-lancement-checklist-md-2",
    "text": "[docs/marketing/meta-lancement-checklist.md § 🎯 La campagne à créer (juin)] **Campagne 1 — TOFU Découverte · Objectif : TRAFIC · budget au niveau ad set (ABO)**",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/meta-lancement-checklist.md"
    }
  },
  {
    "id": "doc-docs-marketing-meta-lancement-checklist-md-3",
    "text": "[docs/marketing/meta-lancement-checklist.md § 🎯 La campagne à créer (juin) › Ad set A1 — Amaryllis « rêve premium » · **5 €/j**] - **Audience A** (Rêve Martinique / Voyage Caraïbes) — intérêts § dans le doc (Martinique, Caraïbes, Voyage de luxe, Location de vacances…).\n- **Lieu** : France, « Personnes vivant à cet endroit », **EXCLURE** Martinique/Guadeloupe/Guyane/Réunion/Mayotte. **Âge** 30-60. Placements **Advantage+**.\n- **Créas (3)** : `~/Downloads/meta-ads/amaryllis-premium/` (01 piscine vue mer, 02, 05). Upload + recadrer par placement (4:5 feed, 9:16 stories).\n- **Copy** : Angle 1 du doc (3 variantes primary text + 3 titres + descriptions). CTA `En savoir plus`. Landing **`/amarylli",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/meta-lancement-checklist.md"
    }
  },
  {
    "id": "doc-docs-marketing-meta-lancement-checklist-md-4",
    "text": "[docs/marketing/meta-lancement-checklist.md § 🎯 La campagne à créer (juin) › Ad set A2 — Mabouya « parenthèse à deux » · **5 €/j**] - **Audience B** (Lune de miel / Couple) — intérêts + événements de vie (fiançailles, mariage récent). **Âge** 28-55.\n- **Lieu/placements** : idem A1.\n- **Créas (3)** : `~/Downloads/meta-ads/mabouya-couple/` (12 jacuzzi, 02 terrasse coucher soleil vertical = top 9:16). Upload + recadrer.\n- **Copy** : Angle 2 du doc. CTA `En savoir plus`. Landing **`/mabouya`**.\n\n**Total : 10 €/j.**",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/meta-lancement-checklist.md"
    }
  },
  {
    "id": "doc-docs-marketing-meta-lancement-checklist-md-5",
    "text": "[docs/marketing/meta-lancement-checklist.md § 🚫 Ne PAS faire en juin] - Pas d'objectif « Ventes » (volume trop faible → reste en apprentissage). Trafic d'abord.\n- Pas de pub sur Zandoli / Iguana / Nogent (se remplissent seuls / exclus).\n- Pas de retargeting/lookalike (audiences encore vides) — **mais créer dès maintenant** les audiences R1-R4 (§3 du doc) pour qu'elles se remplissent cet été.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/meta-lancement-checklist.md"
    }
  },
  {
    "id": "doc-docs-marketing-meta-lancement-checklist-md-6",
    "text": "[docs/marketing/meta-lancement-checklist.md § ▶️ Après le lancement] - Laisser tourner **≥ 7 jours sans toucher**.\n- Juger sur **CTR (>0,8%), CPC, coût/ViewContent** — PAS sur les résas (lead-time long, volume faible en juin).\n- Couper le perdant, garder le gagnant, ajouter l'angle **Groupe** (sem 3-4).\n- Hygiène hebdo : Pixel actif, fréquence < 2,5, rafraîchir une créa si CTR chute.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/meta-lancement-checklist.md"
    }
  },
  {
    "id": "doc-docs-marketing-meta-lancement-checklist-md-7",
    "text": "[docs/marketing/meta-lancement-checklist.md § 🎬 Gros gain optionnel (avant ou après lancement)] 1-2 **Reels verticaux 9:16** (travelling lent piscine Amaryllis / eau du jacuzzi Mabouya) — sur Meta, le Reel vidéo surperforme l'image fixe pour ce produit visuel. Brief § « Reel / Story » du doc.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/meta-lancement-checklist.md"
    }
  },
  {
    "id": "doc-docs-marketing-netlinking-plan-2026-md-0",
    "text": "[docs/marketing/netlinking-plan-2026.md § Introduction] # Plan Netlinking & Partenariats — Amaryllis Locations (2026)\n\n> Objectif : bâtir l'**autorité de domaine** de villamaryllis.com (facteur SEO n°1 hors-site) via des **backlinks éditoriaux pertinents** + des partenariats locaux qui génèrent aussi des **réservations**.\n> Règle d'or : **white-hat** (liens pertinents, mérités). On évite l'achat de liens en masse / fermes de liens (PBN) → pénalité Google. **Qualité > quantité** : 10 bons liens locaux valent mieux que 100 liens spam.\n> ⚠️ Variez les **ancres** (texte du lien) : « Amaryllis Locations », « location villa Sainte-Luce », « villamaryllis.com », « louer une villa en Martinique »… —",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/netlinking-plan-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-netlinking-plan-2026-md-1",
    "text": "[docs/marketing/netlinking-plan-2026.md § 1. Cibles priorisées] | Priorité | Catégorie | Exemples concrets | Type de lien visé | Difficulté |\n|---|---|---|---|---|\n| 🔴 Haute | Office de tourisme / institutionnel | Office de tourisme de Sainte-Luce, Comité Martiniquais du Tourisme (martinique.org), mairie | Fiche « hébergements » / annuaire officiel | Moyenne (souvent gratuit, formulaire) |\n| 🔴 Haute | Prestataires recommandés (échange) | Distilleries (Trois-Rivières, La Mauny), clubs de plongée, restos, excursions bateau, loueurs de voiture | Échange : « nos partenaires » ↔ « où loger » | Faible (relation gagnant-gagnant) |\n| 🔴 Haute | Annuaires tourisme MQ | GuideMartinique, Petit Futé M",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/netlinking-plan-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-netlinking-plan-2026-md-2",
    "text": "[docs/marketing/netlinking-plan-2026.md § 2. Templates de prospection (à personnaliser, puis TU envoies) › A. Échange de liens — prestataire local (distillerie, plongée, resto…)] > Objet : Partenariat Amaryllis Locations × [Nom]\n>\n> Bonjour [Prénom],\n> Nous gérons Amaryllis Locations, des logements de vacances en direct à Sainte-Luce (villamaryllis.com). Nous recommandons régulièrement [Nom] à nos voyageurs, et nous aimerions vous ajouter à notre page « Nos partenaires » avec un lien vers votre site.\n> Seriez-vous d'accord pour, en retour, nous mentionner parmi vos hébergements/partenaires recommandés ? C'est gagnant-gagnant : visibilité croisée + recommandation à nos clients respectifs.\n> B",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/netlinking-plan-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-netlinking-plan-2026-md-3",
    "text": "[docs/marketing/netlinking-plan-2026.md § 2. Templates de prospection (à personnaliser, puis TU envoies) › B. Inclusion dans un listicle / article « où dormir »] > Objet : Suggestion pour votre article « [titre] »\n>\n> Bonjour [Prénom],\n> J'ai lu votre article « [titre/URL] » — très utile pour les voyageurs en Martinique. Nous proposons à Sainte-Luce des logements en réservation directe (piscine, vue mer, dès 100€/nuit) qui pourraient compléter votre sélection : villamaryllis.com. Si cela a du sens pour vos lecteurs, nous serions honorés d'y figurer. Je peux fournir photos et descriptif.\n> Merci pour votre travail, [Vincent]",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/netlinking-plan-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-netlinking-plan-2026-md-4",
    "text": "[docs/marketing/netlinking-plan-2026.md § 2. Templates de prospection (à personnaliser, puis TU envoies) › C. Blogueur / créateur (séjour découverte)] > Objet : Séjour découverte à Sainte-Luce ?\n>\n> Bonjour [Prénom],\n> Nous suivons votre contenu voyage [Martinique/Antilles]. Nous serions ravis de vous accueillir dans l'un de nos logements de Sainte-Luce pour un séjour découverte, en échange d'un retour authentique (article/vidéo) si l'expérience vous plaît. Aucune obligation de ton positif — juste votre regard sincère.\n> Au plaisir d'échanger, [Vincent] — villamaryllis.com",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/netlinking-plan-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-netlinking-plan-2026-md-5",
    "text": "[docs/marketing/netlinking-plan-2026.md § 2. Templates de prospection (à personnaliser, puis TU envoies) › D. Office de tourisme / annuaire institutionnel] > Objet : Référencement hébergement — Amaryllis Locations (Sainte-Luce)\n>\n> Bonjour,\n> Nous gérons plusieurs hébergements de tourisme à Sainte-Luce (et Schœlcher). Comment être référencés dans votre annuaire des hébergements / sur votre site ? Vous trouverez toutes nos informations sur villamaryllis.com. Nous sommes en règle [préciser n° de déclaration une fois obtenu].\n> Merci d'avance, [Vincent]\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/netlinking-plan-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-netlinking-plan-2026-md-6",
    "text": "[docs/marketing/netlinking-plan-2026.md § 3. Page « Nos partenaires » (sur le site)] But : (1) offrir des liens sortants aux partenaires (carburant des échanges), (2) rassurer/crédibiliser, (3) page utile aux voyageurs (bonnes adresses).\nContenu : sections par thème (activités, restauration, bien-être, mobilité), chaque partenaire = nom + 1 ligne + lien. + bloc « Devenir partenaire » (mailto contact). → Construite et reliée au maillage.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/netlinking-plan-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-netlinking-plan-2026-md-7",
    "text": "[docs/marketing/netlinking-plan-2026.md § 4. Press-kit (à fournir aux blogueurs / médias)] - Présentation courte d'Amaryllis Locations (7 logements, Sud Martinique + Nogent, réservation directe).\n- 3-4 chiffres clés (note moyenne ~4,8★, X avis, économie ~15% vs Airbnb).\n- 6-8 photos HD libres d'usage presse (par bien).\n- Lien site + contact + réseaux.\n> Je peux assembler ce press-kit (texte + sélection photos) sur demande.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/netlinking-plan-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-netlinking-plan-2026-md-8",
    "text": "[docs/marketing/netlinking-plan-2026.md § 5. Suivi (à tenir à jour)] | Cible | Contact | Date envoi | Statut | Lien obtenu |\n|---|---|---|---|---|\n| (ex.) Distillerie Trois-Rivières | … | … | en attente / accepté / refusé | … |\n\n> Mesure : suivre l'évolution des **domaines référents** (Search Console → Liens) et l'autorité au fil des mois.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/netlinking-plan-2026.md"
    }
  },
  {
    "id": "doc-docs-marketing-plan-execution-semaine1-2026-06-md-0",
    "text": "[docs/marketing/plan-execution-semaine1-2026-06.md § Introduction] # Plan d'exécution « Semaine 1 » — SEO hors-page Amaryllis Locations (juin 2026)\n\n> **Pourquoi cette semaine, et pas du contenu.** Diagnostic Search Console du 04/06/2026 : le site est techniquement bon (position moyenne 5,8) mais **manque d'autorité de domaine**. Seules 3 pages reçoivent des impressions (accueil 165, /amaryllis 166, le reste ~0). 47 guides + 5 landings sont indexés mais invisibles. 65% des requêtes sont déjà sur la marque. Seul générique qui décolle : « location sainte luce martinique » (11 impr).\n> **Conclusion : le levier n°1 n'est PAS d'écrire plus de contenu, c'est de gagner de l'autorité hors-page** (ba",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/plan-execution-semaine1-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-plan-execution-semaine1-2026-06-md-1",
    "text": "[docs/marketing/plan-execution-semaine1-2026-06.md § Kits déjà écrits (à utiliser, NE PAS réécrire)] | Kit | Fichier | Sert à |\n|---|---|---|\n| NAP canonique + checklist plateformes | `docs/seo/off-page-citations-kit.md` | Citations off-page (copier-coller le NAP à l'identique) |\n| Plan netlinking + 4 templates emails (A/B/C/D) | `docs/marketing/netlinking-plan-2026.md` | Emails de prospection institutionnels & partenaires |\n| Optimisation GBP (2 fiches) | `docs/marketing/gbp-optimisation-2026-06.md` | Leviers GBP réels = Posts + Photos + lien Site + Catégories |\n| Série de 8 posts GBP pré-rédigés | `docs/marketing/gbp-posts-serie-2026.md` | Texte + bouton + lien de chaque post, prêt à colle",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/plan-execution-semaine1-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-plan-execution-semaine1-2026-06-md-2",
    "text": "[docs/marketing/plan-execution-semaine1-2026-06.md § ⭐ TOP 5 à faire cette semaine (le plus rentable d'abord)] Ces 5 actions = citations gratuites à fort signal + 1 post GBP + 3 emails institutionnels. ~2h30 cumulées, 100% déjà préparé.\n\n| # | Action | Levier | Où | Temps | Qui | Impact attendu |\n|---|---|---|---|---|---|---|\n| 1 | Créer la fiche **Bing Places** (import depuis GBP possible) | Citation NAP | bingplaces.com | 15 min | Vincent (exécute) | Citation à fort signal + visibilité Bing/Copilot. Lien dofollow site. |\n| 2 | Créer la fiche **Apple Business Connect** | Citation NAP | businessconnect.apple.com | 20 min | Vincent (exécute) | Visibilité Apple Plans/Siri/Spotlight ; signal NA",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/plan-execution-semaine1-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-plan-execution-semaine1-2026-06-md-3",
    "text": "[docs/marketing/plan-execution-semaine1-2026-06.md § Backlog priorisé (suite de la semaine / semaine 2 si temps) › Levier — Citations off-page (NAP) — gratuit, fort signal, faible effort] | Action | Levier | Où | Temps | Qui | Impact |\n|---|---|---|---|---|---|\n| Créer fiche **TripAdvisor** (Owners) pour Villa + Résidence | Citation NAP | tripadvisor.com/Owners | 30 min | Vincent (exécute) | Citation + canal avis post-séjour (déjà liée aux emails post-stay). |\n| S'inscrire **GuideMartinique** + **ATR Martinique** + **Antilles-info-tourisme** | Citation NAP | annuaires MQ | 30 min | Vincent (exécute) | Citations locales ciblées « Sainte-Luce / Martinique ». |\n| **Yelp** (biz.yelp.fr) — option",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/plan-execution-semaine1-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-plan-execution-semaine1-2026-06-md-4",
    "text": "[docs/marketing/plan-execution-semaine1-2026-06.md § Backlog priorisé (suite de la semaine / semaine 2 si temps) › Levier — Netlinking — emails déjà rédigés, Vincent personnalise & envoie] | Action | Levier | Où | Temps | Qui | Impact |\n|---|---|---|---|---|---|\n| Envoyer **template A** (échange de liens) à 2-3 prestataires **que Vincent connaît déjà** (distillerie, club plongée, resto, excursion bateau) | Netlinking | Email (template A) | 30 min | **🟡 Vincent décide** quels prestataires | Liens locaux pertinents + recos croisées = réservations. |\n| Repérer 2 articles « où dormir Sainte-Luce / villas Martinique piscine » et envoyer **template B** (inclusion listicle) | Netlinking | Email (t",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/plan-execution-semaine1-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-plan-execution-semaine1-2026-06-md-5",
    "text": "[docs/marketing/plan-execution-semaine1-2026-06.md § Backlog priorisé (suite de la semaine / semaine 2 si temps) › Levier — Google Business Profile — quasi tout est prêt] | Action | Levier | Où | Temps | Qui | Impact |\n|---|---|---|---|---|---|\n| Vérifier le **lien Site** des 2 fiches (Villa → `/amaryllis`, Résidence → `/location-groupe-sainte-luce`) | GBP | business.google.com | 5 min | Vincent (exécute) | Le lien site est un des rares leviers GBP réels — doit être exact. |\n| Ajouter **5–10 photos récentes** par fiche (caméra) | GBP | business.google.com | 20 min | **🟡 Vincent** (ses fichiers — seule partie 100% manuelle) | Google favorise les fiches à photos fraîches → ranking + clics. |\n",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/plan-execution-semaine1-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-plan-execution-semaine1-2026-06-md-6",
    "text": "[docs/marketing/plan-execution-semaine1-2026-06.md § Ce qui est « déjà prêt » vs « décision de Vincent »] **Déjà prêt, juste à exécuter (aucune réflexion) :**\n- Tous les **textes de posts GBP** (8 posts, kit série).\n- Le **NAP** à coller sur Bing, Apple, PagesJaunes, TripAdvisor, annuaires MQ.\n- Les **4 templates d'emails** (A échange / B listicle / C blogueur / D institutionnel).\n- Les **liens site** par fiche/plateforme (déjà cartographiés dans le kit citations).\n\n**🟡 Décision ou donnée de Vincent requise :**\n- **Quels prestataires** contacter pour l'échange de liens (template A) — Vincent connaît son réseau local.\n- **Quels articles/blogs** viser pour les listicles (template B).\n- **Phot",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/plan-execution-semaine1-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-plan-execution-semaine1-2026-06-md-7",
    "text": "[docs/marketing/plan-execution-semaine1-2026-06.md § Comment mesurer (à relever, pas à interpréter cette semaine)] **Cette semaine — tenir le suivi :**\n- Cocher chaque fiche créée dans le tableau de `docs/seo/off-page-citations-kit.md`.\n- Remplir le tableau de suivi netlinking (cible / date envoi / statut) dans `docs/marketing/netlinking-plan-2026.md` §5.\n\n**Dans 4 à 8 semaines — vérifier l'effet (les backlinks mettent du temps à être pris en compte) :**\n- **Search Console → Liens → Sites les plus liés / Domaines référents** : surveiller l'apparition des nouveaux domaines (Bing, annuaires, office de tourisme, prestataires).\n- **Search Console → Performances** : suivre l'évolution des **impre",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/plan-execution-semaine1-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-plan-execution-semaine1-2026-06-md-8",
    "text": "[docs/marketing/plan-execution-semaine1-2026-06.md § Récap des 5 prochains gestes (si Vincent ouvre ce doc lundi matin)] 1. bingplaces.com → créer fiche (import GBP) — 15 min\n2. businessconnect.apple.com → créer fiche — 20 min\n3. business.google.com → Résidence → publier Post 3 (Mabouya) + 1 photo — 10 min\n4. 3 emails template D → Office tourisme Sainte-Luce + martinique.org + mairie — 30 min\n5. pagesjaunes.fr (pro) + petitfute.com → inscription — 30 min",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/plan-execution-semaine1-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-press-kit-2026-06-md-0",
    "text": "[docs/marketing/press-kit-2026-06.md § Introduction] # Press-kit — Amaryllis Locations\n\n*Juin 2026 · Dossier presse à destination des blogueurs voyage et des médias*\n\n> **Merci de mentionner villamaryllis.com avec un lien — c'est ce qui nous aide le plus.**\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/press-kit-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-press-kit-2026-06-md-1",
    "text": "[docs/marketing/press-kit-2026-06.md § Qui sommes-nous] Amaryllis Locations, c'est une conciergerie et une collection de 7 logements de vacances en réservation directe, pensés pour ceux qui veulent vivre la Martinique autrement. Nous accompagnons chaque voyageur, de la première question jusqu'au départ, avec l'attention d'un hôte local et l'exigence d'un séjour de standing. Nos adresses se concentrent dans le Sud de la Martinique — à Sainte-Luce et à Schœlcher — ainsi qu'à Nogent-sur-Marne, aux portes de Paris. Réserver chez nous, c'est dialoguer en direct avec celles et ceux qui connaissent chaque maison et chaque crique alentour.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/press-kit-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-press-kit-2026-06-md-2",
    "text": "[docs/marketing/press-kit-2026-06.md § Chiffres clés] - **~4,8★ de note moyenne** sur 44 avis voyageurs\n- **Réservation directe, sans frais d'agence** — soit environ **15 % moins cher** qu'une réservation via Airbnb\n- **7 logements** pouvant accueillir de **2 à 8 personnes**\n- **Paiement 100 % sécurisé** et échange direct avec l'hôte\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/press-kit-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-press-kit-2026-06-md-3",
    "text": "[docs/marketing/press-kit-2026-06.md § Nos logements] - **Villa Amaryllis** — [villamaryllis.com/amaryllis](https://villamaryllis.com/amaryllis) : villa de standing à Sainte-Luce, piscine à débordement à l'eau salée et vue mer à 180°, jusqu'à 8 personnes.\n- **Zandoli** — [villamaryllis.com/zandoli](https://villamaryllis.com/zandoli) : logement avec piscine privative, jusqu'à 5 personnes.\n- **Géko** — [villamaryllis.com/geko](https://villamaryllis.com/geko) : cocon chaleureux et intimiste, jusqu'à 4 personnes.\n- **Mabouya** — [villamaryllis.com/mabouya](https://villamaryllis.com/mabouya) : studio avec jacuzzi, idéal pour 2 personnes.\n- **Bellevue (Schœlcher)** — [villamaryllis.com/schoelcher]",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/press-kit-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-press-kit-2026-06-md-4",
    "text": "[docs/marketing/press-kit-2026-06.md § Angles éditoriaux suggérés] - **« Louer une villa avec piscine en Martinique sans passer par Airbnb »** — la réservation directe, comment ça marche et pourquoi c'est plus avantageux.\n- **« Sainte-Luce, la base idéale pour explorer le Sud de la Martinique »** — à ~20 min des Salines, entre forêt de Montravail et distillerie Trois-Rivières.\n- **« Voyager en Martinique en réservant en direct »** — le retour de la relation humaine entre hôte et voyageur.\n- **« Séjour en famille ou en groupe dans le Sud Martinique »** — des logements de 2 à 8 personnes pour tous les formats de voyage.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/press-kit-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-press-kit-2026-06-md-5",
    "text": "[docs/marketing/press-kit-2026-06.md § Visuels] Pour chaque logement, **6 à 8 photos HD libres de droits presse** sont disponibles **sur simple demande**. Nous les transmettons directement, en haute définition et accompagnées des crédits à mentionner. N'hésitez pas à nous préciser le ou les biens et les formats qui vous intéressent.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/press-kit-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-press-kit-2026-06-md-6",
    "text": "[docs/marketing/press-kit-2026-06.md § Contact presse] **Vincent Salomon**\n- Email : contact@villamaryllis.com\n- Téléphone : +33 6 10 88 07 72\n- Site : [villamaryllis.com](https://villamaryllis.com)\n- Réseaux sociaux : *(à compléter sur demande)*\n\n*Nous répondons rapidement et avec plaisir à toute demande d'interview, de visuels complémentaires ou de précisions. Merci d'avance pour le lien vers villamaryllis.com.*",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/press-kit-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-0",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § Introduction] # SEO — Réveil des 5 landings commerciales orphelines (2026-06)\n\n> Objectif : sortir de l'orphelinat SEO les 5 pages transactionnelles (0 visite organique), sans budget Ads.\n> Levier = (A) métas affûtées + (B) **liens contextuels in-content** depuis les pages déjà crawlées (fiches + guides) + (C) quick wins on-page + (D) ciblage longue traîne.\n>\n> ⚠️ **Double source des métas** (cf. CLAUDE.md §1) :\n> - `prerender.mjs` (`ROUTES`) = baseline crawler, écrit `dist/<slug>.html` au build.\n> - `functions/[slug].js` = injection runtime, **fait foi** UNIQUEMENT pour les slugs interceptés.\n> - Slugs landing interceptés par `functions/[sl",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-1",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § A. Audit méta — page par page › 1. `/sainte-luce-martinique` — **GARDER tel quel**] - T actuel (57c) : `Location villa Sainte-Luce Martinique — piscine & vue mer`\n- D actuel (148c) : `Louez une villa à Sainte-Luce, Martinique : piscine privée, vue mer, dès 110€/nuit en direct sans frais. Plages, activités et conseils de vos hôtes.`\n- **Verdict** : déjà optimale. Mot-clé exact « location villa Sainte-Luce Martinique » en tête, USP prix + direct, intention transactionnelle claire. Ne rien toucher.\n- Source à éditer si jamais : `prerender.mjs` uniquement (non intercepté).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-2",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § A. Audit méta — page par page › 2. `/location-villa-martinique-piscine` — **AMÉLIORER**] - T actuel (47c) : `Location Villa Martinique avec Piscine | Amaryllis`\n- D actuel : OK mais le « | Amaryllis » + casse Title Case gaspillent des pixels SERP et n'apportent rien sur une requête générique.\n- **Nouveau T (54c)** : `Location villa Martinique avec piscine — dès 110€/nuit`\n- **Nouvelle D (142c)** : `Villa avec piscine privée en Martinique à Sainte-Luce : débordement eau salée, cascade ou jacuzzi. Dès 110€/nuit en direct, sans frais Airbnb.`\n- **Justification** : mot-clé principal « location villa Martinique avec piscine » conservé en tête, aj",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-3",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § A. Audit méta — page par page › 3. `/location-appartement-vue-mer-schoelcher` — **AMÉLIORER (les 2 sources)**] - T actuel (53c) : `Location appartement vue mer Schœlcher — Martinique`\n- **Nouveau T (54c)** : `Location appartement vue mer Schœlcher — dès 100€/nuit`\n- **Nouvelle D (155c)** : `Appartement vue mer à Schœlcher, Martinique : panorama sur la baie de Fort-de-France, dernier étage, 2 pers. Réservation directe dès 100€/nuit, sans frais.`\n- **Justification** : on remplace « — Martinique » (redondant, déjà dans l'URL et la D) par le prix d'appel `dès 100€/nuit`, plus motivant au clic. D recentrée sur le bénéfice concret (panorama baie F",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-4",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § A. Audit méta — page par page › 4. `/location-groupe-sainte-luce` — **AMÉLIORER (les 2 sources)**] - T prerender actuel (74c — **TROP LONG, tronqué en SERP**) : `Location grand groupe Martinique — jusqu'à 11 personnes, Sainte-Luce`\n- T `[slug].js` actuel (57c) : `Location grand groupe Martinique — 11 pers, Sainte-Luce` (déjà OK mais on cible mieux)\n- **Nouveau T (59c)** : `Location grande capacité Martinique — 11 pers., Sainte-Luce`\n- **Nouvelle D (143c)** : `Louez 3 logements ensemble à Sainte-Luce (Zandoli, Géko, Mabouya) : jusqu'à 11 personnes, piscines privées, en direct sans frais. Devis rapide.`\n- **Justification** : le title prerender",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-5",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § A. Audit méta — page par page › 5. `/reservation-directe-martinique` — **AMÉLIORER la D seulement**] - T actuel (55c) : `Réservation directe Martinique — Sans frais | Amaryllis` → **GARDER** (marque pertinente ici, requête semi-marque).\n- D actuelle : `…Économisez 12–18%…` — le « 12–18% » est moins percutant qu'un chiffre rond et l'USP « contact hôte » manque.\n- **Nouvelle D (146c)** : `Réservez vos villas en Martinique en direct, sans frais Airbnb ni Booking : −15% en moyenne, contact hôte, paiement Stripe sécurisé. Dès 85€/nuit.`\n- **Justification** : `−15% en moyenne` (cf. USP officielle ~15%) + ajout « contact hôte » (réassurance) + prix",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-6",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § B. Plan de maillage interne contextuel] Principe : **liens IN-CONTENT** (dans une phrase, pas seulement le footer/nav déjà présents) depuis les pages crawlées vers les landings orphelines. Le footer maillage (`PublicSite.jsx` ~L6774-6800) et la nav prerender (`NAV_LANDINGS`) existent déjà → ne PAS les recompter ; ici on ajoute des liens **éditoriaux** à forte valeur de crawl + de pertinence sémantique.\n\n| # | Page source (crawlée) | → Landing cible | Texte d'ancre exact | Où l'insérer (fichier + repère) |\n|---|---|---|---|---|\n| 1 | `/amaryllis` (fiche) | `/location-villa-martinique-piscine` | `villa avec piscine en Martinique` | `PublicSite",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-7",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § B. Plan de maillage interne contextuel › Snippet d'implémentation — lien contextuel par fiche (PublicSite.jsx)] À insérer **juste après le bloc Amenities** (après la fermeture `</div>` de L4046), avant les Tarifs. Map par `bien.id` pour respecter la nomenclature (villa ≠ logement) :\n\n```jsx\n{/* ── Lien contextuel SEO in-content (dé-orpheline les landings) ── */}\n{(() => {\n  const CTX = {\n    amaryllis: <>Amaryllis fait partie de nos <a href=\"/location-villa-martinique-piscine\">villas avec piscine en Martinique</a> ; idéale aussi pour <a href=\"/sainte-luce-martinique\">séjourner à Sainte-Luce</a>.</>,\n    iguana:    <>Découvrez toutes <a href=",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-8",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § C. Quick wins on-page (H1 + intro transactionnelle)] Les H1 existants sont déjà bons (vérifiés dans le code). Ajustements ciblés uniquement :",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-9",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § C. Quick wins on-page (H1 + intro transactionnelle) › `/location-villa-martinique-piscine` (`GuideVillaPiscine.jsx` ~L376)] - H1 actuel : `Location villa Martinique avec piscine` → **GARDER** (mot-clé exact).\n- Intro actuelle : déjà transactionnelle. **OK**, aucun changement requis.",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-10",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § C. Quick wins on-page (H1 + intro transactionnelle) › `/sainte-luce-martinique` (`GuideSainteLuce.jsx` ~L217)] - H1 actuel : `Sainte-Luce Martinique` (stylisé) — **manque l'intention « location »**.\n- **Quick win** : ajouter UNE phrase d'intro transactionnelle sous le H1 (le hero n'en a pas) :\n  > `Louez une villa avec piscine privée et vue mer à Sainte-Luce, dans le Sud de la Martinique — en direct, sans frais Airbnb, dès 110 €/nuit.`\n- (Le H1 stylisé reste « Sainte-Luce / Martinique » pour le design ; l'intro porte le mot-clé transactionnel.)",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-11",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § C. Quick wins on-page (H1 + intro transactionnelle) › `/location-groupe-sainte-luce` (rendu par `PublicSite.jsx` ~L8132)] - H1 à vérifier dans ce bloc — s'assurer qu'il contient « grande capacité » ou « jusqu'à 11 personnes ». Si absent, intro suggérée :\n  > `Réunissez jusqu'à 11 proches à Sainte-Luce en réservant Zandoli, Géko et Mabouya ensemble — résidence privée, 3 piscines, réservation directe sans frais.`",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-12",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § C. Quick wins on-page (H1 + intro transactionnelle) › `/location-appartement-vue-mer-schoelcher` (`PublicSite.jsx` ~L8209) & `/reservation-directe-martinique` (`GuideReservationDirecte.jsx`)] - H1 et intros déjà transactionnels et corrects. **Aucun changement.**\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-13",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § D. Mots-clés cible par landing (longue traîne, intention d'achat, FR) › `/sainte-luce-martinique`] 1. location villa Sainte-Luce Martinique\n2. villa Sainte-Luce piscine vue mer\n3. louer villa Sainte-Luce pas cher\n4. location vacances Sainte-Luce Martinique\n5. hébergement Sainte-Luce sud Martinique",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-14",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § D. Mots-clés cible par landing (longue traîne, intention d'achat, FR) › `/location-villa-martinique-piscine`] 1. location villa Martinique avec piscine\n2. villa Martinique piscine débordement\n3. villa piscine privée Martinique sud\n4. location villa Martinique piscine vue mer\n5. villa Martinique piscine eau salée",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-15",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § D. Mots-clés cible par landing (longue traîne, intention d'achat, FR) › `/location-appartement-vue-mer-schoelcher`] 1. location appartement vue mer Schœlcher\n2. appartement Schœlcher Martinique vue baie\n3. location vacances Schœlcher Fort-de-France\n4. appartement vue mer Martinique nord\n5. location appartement Schœlcher pas cher",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-16",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § D. Mots-clés cible par landing (longue traîne, intention d'achat, FR) › `/location-groupe-sainte-luce`] 1. location grand groupe Martinique\n2. location villa groupe Sainte-Luce\n3. hébergement grande capacité Martinique 11 personnes\n4. louer plusieurs logements Martinique ensemble\n5. location vacances groupe sud Martinique",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-17",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § D. Mots-clés cible par landing (longue traîne, intention d'achat, FR) › `/reservation-directe-martinique`] 1. réservation directe villa Martinique\n2. location villa Martinique sans frais Airbnb\n3. louer villa Martinique en direct propriétaire\n4. location Martinique sans commission\n5. villa Martinique moins cher qu'Airbnb\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-seo-maillage-landings-2026-06-md-18",
    "text": "[docs/marketing/seo-maillage-landings-2026-06.md § Récap fichiers à éditer] | Landing | T | D | Fichier(s) à éditer |\n|---|---|---|---|\n| `/sainte-luce-martinique` | garder | garder | — (rien) |\n| `/location-villa-martinique-piscine` | NEW | NEW | `prerender.mjs` |\n| `/location-appartement-vue-mer-schoelcher` | NEW | NEW | **`functions/[slug].js` (SCHOELCHER_APPART)** + `prerender.mjs` |\n| `/location-groupe-sainte-luce` | NEW | NEW | **`functions/[slug].js` (GROUP_STAY)** + `prerender.mjs` |\n| `/reservation-directe-martinique` | garder | NEW | `prerender.mjs` |\n| Maillage in-content | — | — | `PublicSite.jsx` (snippet fiche L4046), `GuideSainteLuce.jsx`, guides interceptés |\n\nAprès déploieme",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/seo-maillage-landings-2026-06.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-0",
    "text": "[docs/marketing/social-bot-app-review.md § Introduction] # Bot social Amaryllis — Dossier App Review Meta\n\n**App :** Amaryllis Dashboard · App ID `1248539197126557` · Business : Amaryllis Corp (`609408700286001`)  \n**Page FB :** Amaryllis Location (`115471004486809`) · **IG :** @amaryllislocations (`17841450886833537`)  \n**Site :** https://villamaryllis.com · **Webhook :** https://villamaryllis.com/api/social-webhook  \n**Politique de confidentialité :** https://villamaryllis.com/politique-confidentialite (section Meta + suppression ✅ ajoutées 2026-06-16)  \n**URL suppression données (Data Deletion) :** https://villamaryllis.com/politique-confidentialite#suppression-donnees\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-1",
    "text": "[docs/marketing/social-bot-app-review.md § ✅ ÉTAT — préparé en autonome (2026-06-16) vs à faire par Vincent] **Déjà prêt (rien à faire) :**\n- ✅ Politique de confidentialité en ligne + **section « Données Facebook/Instagram »** + **section suppression de données** (ancre dédiée pour l'URL Data Deletion exigée par Meta). Déployé.\n- ✅ Justifications des 5 permissions rédigées (copier-coller, §3) · description de l'app (§2) · script vidéo (§4) · notes reviewer (§5).\n- ✅ Endpoints live et vérifiés : `/api/social-poll` (répond), `/api/social-webhook` (déployé).\n\n**À faire par Vincent (actions compte Meta — non automatisables de l'extérieur) :**\n1. ⬜ **Business Verification** d'Amaryllis Corp (Busi",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-2",
    "text": "[docs/marketing/social-bot-app-review.md § ÉTAPE 0 — Avant tout : activer les permissions en mode développement] Sans cette étape, même le mode dev ne fonctionnera pas.\n\n1. Aller sur https://developers.facebook.com/apps/1248539197126557\n2. Menu gauche → **App Review** → **Permissions and Features**\n3. Pour chaque permission ci-dessous : cliquer **\"Add\"** → choisir **\"In Development\"**\n   - `pages_read_engagement`\n   - `pages_manage_engagement`\n   - `pages_messaging`\n   - `instagram_manage_comments`\n   - `instagram_manage_messages`\n4. Sauvegarder.\n\n→ Le poller API fonctionnera ensuite sans App Review (pour ton compte admin uniquement).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-3",
    "text": "[docs/marketing/social-bot-app-review.md § ÉTAPE 1 — Pré-requis avant de soumettre l'App Review] - [ ] **Business Verification** d'Amaryllis Corp validée (paramètres du compte Business → Vérification)\n- [ ] App en mode **Live** (pas Development) au moment de la soumission\n- [ ] Webhook `https://villamaryllis.com/api/social-webhook` actif et abonné à `feed` (FB) + `comments` (IG)\n- [ ] Page abonnée : `POST /115471004486809/subscribed_apps?subscribed_fields=feed` avec ton page token\n- [x] **Politique de confidentialité** en ligne ✅ : https://villamaryllis.com/politique-confidentialite (section données Meta + suppression ajoutées 2026-06-16)\n- [ ] **Capture vidéo** enregistrée (voir script §4 c",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-4",
    "text": "[docs/marketing/social-bot-app-review.md § ÉTAPE 2 — Description générale de l'app (à coller dans \"App Details\")] **App Name :** Amaryllis Dashboard  \n**App Category :** Business  \n\n**App Description (EN) :**\n\n> Amaryllis Dashboard is the internal management tool for Amaryllis Locations, a vacation rental company operating 7 properties in Martinique and Nogent-sur-Marne, France (website: villamaryllis.com).\n>\n> The app provides two core capabilities:\n> 1. **Social lead detection**: automatically identifies comments on our own Facebook Page and Instagram account from users seeking vacation rentals in Martinique, and sends us a pre-drafted reply for manual review and posting.\n> 2. **Automated ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-5",
    "text": "[docs/marketing/social-bot-app-review.md § ÉTAPE 3 — Justifications par permission (copier-coller dans chaque formulaire) › `pages_read_engagement`] **How will your app use this permission?**\n> Amaryllis Locations uses `pages_read_engagement` to read comments posted by users on our own Facebook Page (Amaryllis Location, Page ID 115471004486809). Our system scans these comments to identify users who are actively looking for vacation rentals in Martinique. When a qualifying comment is detected, a pre-drafted welcome reply is generated and either sent to our team for manual posting, or posted automatically depending on the mode. We do not read comments on any third-party pages. We only access o",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-6",
    "text": "[docs/marketing/social-bot-app-review.md § ÉTAPE 3 — Justifications par permission (copier-coller dans chaque formulaire) › `pages_manage_engagement`] **How will your app use this permission?**\n> Amaryllis Locations uses `pages_manage_engagement` to post a single public reply to comments on our own Facebook Page from users who have expressed interest in renting one of our properties. The reply is a short, templated welcome message (approximately 20 words) containing our website link (villamaryllis.com) so the user can check availability and rates directly. We never reply to comments on third-party pages. We only use this permission on our own Page (Amaryllis Location, Page ID 115471004486809",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-7",
    "text": "[docs/marketing/social-bot-app-review.md § ÉTAPE 3 — Justifications par permission (copier-coller dans chaque formulaire) › `pages_messaging`] **How will your app use this permission?**\n> Amaryllis Locations uses `pages_messaging` to send one private reply (via Facebook's `private_replies` endpoint) to users who comment on our Page expressing interest in renting a property. This private message contains a personalized welcome and a direct link to our booking website. We strictly follow Facebook's policy of one private reply per comment. We never initiate unsolicited messages. We never send messages to users who have not first commented on our Page's content. The private message feature is on",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-8",
    "text": "[docs/marketing/social-bot-app-review.md § ÉTAPE 3 — Justifications par permission (copier-coller dans chaque formulaire) › `instagram_manage_comments`] **How will your app use this permission?**\n> Amaryllis Locations uses `instagram_manage_comments` to read comments on our business Instagram account (@amaryllislocations, IG account ID 17841450886833537) and to reply to comments from users seeking vacation rentals. The system polls our recent media for new comments, classifies them using an AI model (Groq/Mistral), and — when a genuine rental inquiry is detected — posts a public reply with our website link. We only access our own Instagram account. We do not read or interact with any third-p",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-9",
    "text": "[docs/marketing/social-bot-app-review.md § ÉTAPE 3 — Justifications par permission (copier-coller dans chaque formulaire) › `instagram_manage_messages`] **How will your app use this permission?**\n> Amaryllis Locations uses `instagram_manage_messages` to send one direct message to Instagram users who comment on our posts expressing interest in our vacation rentals. The message contains a short welcome and a link to our direct booking website. We only send one message per commenting user and only in response to a comment they have voluntarily posted on our content. We never send unsolicited messages or bulk DMs. All messages are sent as follow-ups to genuine rental inquiries, giving the user a",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-10",
    "text": "[docs/marketing/social-bot-app-review.md § ÉTAPE 4 — Script de la capture vidéo (obligatoire, ~2 min)] **Outil recommandé :** QuickTime (Mac) ou Loom — résolution min. 720p.\n\n```\n0:00 – Ouvrir la page Facebook \"Amaryllis Location\" (page de test).\n0:10 – Publier un commentaire sur un post : \"Bonjour, je cherche une\n       location en Martinique pour cet été, avez-vous des disponibilités ?\"\n0:20 – Montrer le terminal / le log en temps réel :\n       \"social-poll → scanned: 1, leads: 1\"\n0:30 – Revenir sur le post Facebook : une réponse publique est apparue\n       sous le commentaire (message d'accueil + lien villamaryllis.com).\n0:40 – Ouvrir les DMs de la page : 1 message privé envoyé au comment",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-11",
    "text": "[docs/marketing/social-bot-app-review.md § ÉTAPE 5 — Compte de test pour le reviewer] Créer un utilisateur test dans l'App Dashboard (Roles → Test Users) :\n- Email : `meta-reviewer@villamaryllis.com` (à créer)\n- Rôle sur la page : **Editor** (pas Admin — pour tester les scopes minimaux)\n- Accès au dashboard : URL + mot de passe fourni dans les notes de soumission\n\nNotes à inclure dans le champ \"Notes for the reviewer\" :\n> Test environment: https://villamaryllis.com  \n> Admin dashboard: https://villamaryllis.com/admin (password: provided separately)  \n> Social poll test endpoint: https://villamaryllis.com/api/social-poll?secret=[contact us]  \n> The bot is in SHADOW MODE by default (no public ",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-marketing-social-bot-app-review-md-12",
    "text": "[docs/marketing/social-bot-app-review.md § Résumé des permissions et niveau d'accès requis] | Permission | Niveau actuel | Niveau cible | App Review requis |\n|---|---|---|---|\n| `pages_read_engagement` | Standard Access | Advanced Access | ✅ oui |\n| `pages_manage_engagement` | — | Advanced Access | ✅ oui |\n| `pages_messaging` | Standard Access | Advanced Access | ✅ oui |\n| `instagram_manage_comments` | Standard Access | Advanced Access | ✅ oui |\n| `instagram_manage_messages` | — | Advanced Access | ✅ oui |\n\n**Délai estimé :** 5 à 10 jours ouvrés après soumission. Business Verification d'Amaryllis Corp doit être validée avant la soumission (sinon rejet immédiat).",
    "metadata": {
      "source": "doc",
      "doc": "docs/marketing/social-bot-app-review.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-0",
    "text": "[docs/revenue-manager/packages-promotions.md § Introduction] # Packages & Promotions — Advisory RM\n> Agent rev-014. Recommandations pour augmenter le RevPAR moyen sans baisser le prix de base.\n> ⚠️ Advisory only — Vincent applique. RM ne touche jamais un prix tout seul.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-1",
    "text": "[docs/revenue-manager/packages-promotions.md § Pourquoi les packages] Le prix/nuit est une bataille de commodité (comparaison directe Airbnb). Les packages créent de la valeur perçue non comparable et augmentent le panier moyen sans descendre le prix de base.\n\n**Objectif :** +10–15% de revenu par séjour sur 40% des résas.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-2",
    "text": "[docs/revenue-manager/packages-promotions.md § 🎁 Packages recommandés › 1. Package Bienvenue (+30–50€)] **Contenu :** bouteille de rhum AOC Martinique + fruits locaux + petit mot manuscrit  \n**Coût réel :** ~15–20€  \n**Marge nette :** +15–30€/séjour  \n**Cibles :** toutes propriétés Martinique  \n**Quand proposer :** à la confirmation (email pré-arrivée J-3)  \n**Message :** \"Démarrez votre séjour comme il se doit — nous préparons une sélection de produits locaux pour votre arrivée.\"\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-3",
    "text": "[docs/revenue-manager/packages-promotions.md § 🎁 Packages recommandés › 2. Package Romantique (+80–120€)] **Contenu :** décoration chambre (fleurs, bougies, pétales), champagne rosé, plateau petit-déjeuner J+1  \n**Coût réel :** ~35–50€  \n**Marge nette :** +45–70€/séjour  \n**Cibles :** Mabouya (jacuzzi), Géko (piscine privée couple), Zandoli  \n**Quand proposer :** à la résa (1 adulte + 1 adulte = couple probable) ou sur demande  \n**Message :** \"Parfait pour un séjour romantique — nous pouvons préparer votre arrivée.\"\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-4",
    "text": "[docs/revenue-manager/packages-promotions.md § 🎁 Packages recommandés › 3. Package Transfert Aéroport (+60–80€ A/R)] **Contenu :** chauffeur privé depuis/vers l'aéroport Aimé Césaire (45 min)  \n**Coût réel :** prestataire local ~40–55€ A/R  \n**Marge nette :** +15–25€/séjour  \n**Cibles :** toutes propriétés Martinique, voyageurs sans voiture  \n**Quand proposer :** email confirmation (mention absence de voiture = signal)  \n**Note :** À tester d'abord avec 2–3 prestataires locaux fiables (à sourcer)\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-5",
    "text": "[docs/revenue-manager/packages-promotions.md § 🎁 Packages recommandés › 4. Package Barbecue du soir (+40€)] **Contenu :** charbon livré, saucisses créoles + poulet mariné, légumes grillades locaux  \n**Coût réel :** ~20–25€  \n**Marge nette :** +15–20€/séjour  \n**Cibles :** Géko (BBQ inclus), Zandoli, Amaryllis  \n**Quand proposer :** email J-1 avant une nuit mid-semaine creuse (remplissage opportuniste)  \n**Message :** \"Envie de soirée créole ? On vous prépare un kit BBQ local livré à votre villa.\"\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-6",
    "text": "[docs/revenue-manager/packages-promotions.md § 🎁 Packages recommandés › 5. Promo Early Bird (−10% si résa > 90j)] **Mécanisme :** code promo ou prix directement affiché dans le widget  \n**Objectif :** avancer la fenêtre de réservation, réduire les creux de trésorerie  \n**Condition :** uniquement sur biens ayant des creux constatés (Schœlcher, Nogent)  \n**Quand activer :** en basse saison (juin–septembre), retirer dès que taux d'occ > 60%  \n**Advisory RM-37 :** early booking réduit le risque d'inoccupation mais sacrifie le RevPAR de pointe. À utiliser chirurgicalement.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-7",
    "text": "[docs/revenue-manager/packages-promotions.md § 🎁 Packages recommandés › 6. Promo Basse Saison (−15% juin–septembre)] **Mécanisme :** prix affiché réduit directement sur la fiche (pas de code)  \n**Condition :** septembre = creux profond (~30% occ) — cf. REVENUS_CANAL_2025  \n**Biens prioritaires :** Géko, Mabouya (les plus sensibles au prix sur ce segment)  \n**Retirer si :** taux d'occ basse saison dépasse 55%  \n**Advisory RM-36 :** la basse saison martinique a une valeur propre (calme, mer, authenticité) — la communication doit valoriser ça avant de baisser les prix.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-8",
    "text": "[docs/revenue-manager/packages-promotions.md § 📋 Comment implémenter › Phase 1 — Test manuel (2–4 semaines)] 1. Créer le **Package Bienvenue** (déjà faisable avec prestataire local)\n2. L'ajouter dans l'email pré-arrivée J-3 (`send-prearrivee.js`) comme option payante\n3. Mesurer : taux de prise / revenu additionnel / feedback voyageur",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-9",
    "text": "[docs/revenue-manager/packages-promotions.md § 📋 Comment implémenter › Phase 2 — Intégration tunnel (si test positif)] 4. Ajouter un step \"options\" dans le tunnel de résa (`PublicSite.jsx`)\n5. Les options alimentent le `metadata` Stripe (`packageBienvenue: true`)\n6. Le webhook `stripe-webhook.js` notifie Vincent pour préparer le package",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-10",
    "text": "[docs/revenue-manager/packages-promotions.md § 📋 Comment implémenter › Phase 3 — Automatisation] 7. Si prestataire stable → automatiser la commande (WhatsApp automatique)\n8. Tracker les revenus packages en D1 (`direct_bookings.extras_json`)\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-packages-promotions-md-11",
    "text": "[docs/revenue-manager/packages-promotions.md § 💡 Benchmark concurrents] Les locations haut de gamme Martinique proposent généralement :\n- Bienvenue : bouteille + fruits (~80% des villas premium)\n- Transfert : souvent inclus à partir d'un certain prix\n- Petit-déjeuner livré : rare mais très apprécié (voir potentiel Zandoli / Amaryllis)\n\n**Source :** analyse Airbnb listings Sainte-Luce + Sainte-Anne > 200€/nuit",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/packages-promotions.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-0",
    "text": "[docs/revenue-manager/recos-pricing.md § Introduction] # Recommandations Revenue Manager — Pricing 2026\n> Source : données réelles REVENUS_CANAL_2025 + SAISONNALITE (App.jsx) · Advisory only — Vincent applique.\n> Agents : rev-036 (saisonnalité) · rev-037 (early booking) · rev-038 (canal) · rev-041 (long séjour)\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-1",
    "text": "[docs/revenue-manager/recos-pricing.md § rev-036 — Analyse saisonnalité & ajustements prix recommandés › Lecture des données (occupation mensuelle moyenne 2023-2025)] | Bien | Jan | Fév | Mar | Avr | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n| Amaryllis | 82% | 80% | 65% | 75% | 40% | **30%** | 45% | 60% | **30%** | 45% | **30%** | 55% |\n| Zandoli | 60% | 80% | 55% | 70% | 40% | **30%** | 50% | 60% | **30%** | 50% | 45% | 55% |\n| Géko | 40% | 75% | 55% | 50% | 45% | 35% | 50% | 50% | **30%** | 45% | 55% | 40% |\n| Mabouya | 55% | 75% | 40% | 50% | **15%** | 25% | 40% | 50% | **30%** | 40% | 40% | 45% |\n| Schœlcher | 55% | 65% | 75% |",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-2",
    "text": "[docs/revenue-manager/recos-pricing.md § rev-036 — Analyse saisonnalité & ajustements prix recommandés › Recommandations tarifaires par période] **🔴 Creux profonds (juin, septembre) — Martinique**\n- Occ < 35% : baisser les prix de 15-25% vs prix de base\n- Activer le minimum de nuits à 2 (au lieu de 3-4) pour maximiser le remplissage\n- Amaryllis juin : 280€ → **210-230€** · Zandoli : 110€ → **85-90€**\n\n**🟡 Basse saison modérée (mai, novembre)**\n- Occ 30-45% : baisser 10% vs prix de base, maintenir le minimum de nuits\n- Proposer des forfaits semaine attractifs\n\n**🟢 Haute saison (jan-fév, juillet-août)**\n- Occ 65-82% : prix de base ou +10-15%\n- Amaryllis janvier : jusqu'à **310-320€**\n- Bloq",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-3",
    "text": "[docs/revenue-manager/recos-pricing.md § rev-037 — Stratégie Early Booking (réservations 30-60j à l'avance) › Constat] Le tunnel direct actuel ne différencie pas les réservations selon le lead time.\nOr les early bookers ont une disposition à payer plus élevée ET sécurisent le calendrier.",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-4",
    "text": "[docs/revenue-manager/recos-pricing.md § rev-037 — Stratégie Early Booking (réservations 30-60j à l'avance) › Recommandations] **Règle RM suggérée : Early Bird +5% (31-60j) / Standard (0-30j)**\n- Réservation > 60j à l'avance : **prix affiché = prix de base** (pas de remise — ils paieraient de toute façon)\n- Réservation 31-60j : **prix affiché = prix de base** (idem)\n- Réservation 8-30j : **prix de base** (fenêtre standard)\n- Réservation < 7j : **prix de base -10%** (last-minute pour remplir les trous)\n\n**Alternative plus simple : last-minute seulement**\n- Pas de surcharge early bird (risque de décourager)\n- Uniquement remise last-minute < 5j : -10 à -15% (activable manuellement depuis l'ongl",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-5",
    "text": "[docs/revenue-manager/recos-pricing.md § rev-038 — Analyse performance par canal (données 2025) › Répartition des revenus par canal] | Bien | Airbnb | Booking | Direct | Total | % Direct |\n|---|---|---|---|---|---|\n| Amaryllis | 9 447€ (25%) | 14 989€ (39%) | 13 565€ (36%) | 38 001€ | ⭐ 36% |\n| Iguana | — | — | 23 600€ (100%) | 23 600€ | ⭐⭐ 100% |\n| Zandoli | 3 333€ (10%) | 8 242€ (25%) | **21 701€ (65%)** | 33 276€ | ⭐⭐ 65% |\n| Géko | 10 839€ (54%) | 3 858€ (19%) | 5 324€ (27%) | 20 021€ | 27% |\n| Mabouya | 2 075€ (25%) | 3 615€ (43%) | 2 760€ (33%) | 8 450€ | 33% |\n| Schœlcher | 4 746€ (37%) | 5 914€ (47%) | 2 020€ (16%) | 12 680€ | ⚠️ 16% |\n| Nogent | 3 822€ (15%) | 20 008€ (79%) | 153€ (",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-6",
    "text": "[docs/revenue-manager/recos-pricing.md § rev-038 — Analyse performance par canal (données 2025) › Analyse] **🔴 Nogent : quasi-exclusivement Booking.com (79%)**\n- Commission Booking ~18% = ~3 600€ perdus en commissions sur 20 000€\n- Potentiel de direct très sous-exploité (153€ seulement en 2025)\n- Levier : Nesrine à former sur l'envoi du lien de réservation directe + widget Beds24 → villamaryllis.com/nogent\n\n**🔴 Schœlcher : direct très faible (16%)**\n- Aucun effort marketing spécifique sur ce bien\n- Levier : fiche Google Business Profile Schœlcher + photos Instagram dédiées\n\n**🟢 Zandoli & Iguana : champions du direct**\n- Modèle à répliquer : ces voyageurs reviennent et réservent directemen",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-7",
    "text": "[docs/revenue-manager/recos-pricing.md § rev-041 — Optimisation prix séjours longue durée (7j+) › Constat] Pas de remise automatique sur les séjours longs dans le tunnel actuel (remises manuelles uniquement dans `src/utils/pricing.js`).",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-8",
    "text": "[docs/revenue-manager/recos-pricing.md § rev-041 — Optimisation prix séjours longue durée (7j+) › Tarifs longs séjours recommandés] | Durée | Remise conseillée | Exemple Amaryllis (280€/nuit) |\n|---|---|---|\n| 7-13 nuits | -10% | 252€/nuit → 1 764€/semaine |\n| 14-27 nuits | -15% | 238€/nuit → 3 332€/2 semaines |\n| 28+ nuits | -20% à -25% | 210-224€/nuit (quasi-bail) |",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-9",
    "text": "[docs/revenue-manager/recos-pricing.md § rev-041 — Optimisation prix séjours longue durée (7j+) › Implémentation suggérée] Le système `pricing.js` a déjà `REMISES_DUREE` — vérifier les seuils actuels et ajuster si besoin.\nPour les séjours 28j+ : contact direct recommandé (devis personnalisé, pas de tunnel automatique).",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-revenue-manager-recos-pricing-md-10",
    "text": "[docs/revenue-manager/recos-pricing.md § rev-041 — Optimisation prix séjours longue durée (7j+) › Biens les plus concernés] - **Amaryllis** : fort potentiel familles 2 semaines en haute saison\n- **Zandoli** : séjours longue durée déjà fréquents (clientèle fidèle)\n- **Nogent** : séjours professionnels 1-4 semaines (clientèle B2B Ary Augustin type)",
    "metadata": {
      "source": "doc",
      "doc": "docs/revenue-manager/recos-pricing.md"
    }
  },
  {
    "id": "doc-docs-seo-audit-seo-technique-md-0",
    "text": "[docs/seo/audit-seo-technique.md § Introduction] # Audit SEO technique — villamaryllis.com\n> Agent seo-001 · 2026-06-23 · Advisory — à consulter avant toute action SEO",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/audit-seo-technique.md"
    }
  },
  {
    "id": "doc-docs-seo-audit-seo-technique-md-1",
    "text": "[docs/seo/audit-seo-technique.md § 1. Meta & structured data › ✅ En place] - `functions/[slug].js` injecte title/desc via HTMLRewriter sur chaque fiche bien (autorité réelle)\n- JSON-LD `VacationRental` + `@graph` sur chaque fiche via `scripts/prerender.mjs`\n- `sitemap.xml` généré au build (script prerender)\n- Canonical self-referencing sur chaque page\n- Open Graph + Twitter Card sur les fiches",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/audit-seo-technique.md"
    }
  },
  {
    "id": "doc-docs-seo-audit-seo-technique-md-2",
    "text": "[docs/seo/audit-seo-technique.md § 1. Meta & structured data › ⚠️ Points d'amélioration] - **Schœlcher et Nogent** : pas de Place ID Google vérifié → lien avis `default` (Amaryllis)\n- **Guides** (20+ pages) : meta description générée mais non auditée ligne par ligne — certains dépassent 158c\n- **FAQ page** : pas de schema `FAQPage` JSON-LD → opportunité rich snippet Google\n- **Home `/`** : pas de schema `LocalBusiness` → à ajouter",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/audit-seo-technique.md"
    }
  },
  {
    "id": "doc-docs-seo-audit-seo-technique-md-3",
    "text": "[docs/seo/audit-seo-technique.md § 1. Meta & structured data › Règle critique à ne pas oublier] > Modifier title/desc d'une fiche bien = toujours dans `functions/[slug].js` (objet SEO).\n> `prerender.mjs` est écrasé à chaque requête CF par le HTMLRewriter.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/audit-seo-technique.md"
    }
  },
  {
    "id": "doc-docs-seo-audit-seo-technique-md-4",
    "text": "[docs/seo/audit-seo-technique.md § 2. Performance & Core Web Vitals › ✅ En place] - Images en `.webp` (format optimal)\n- Lazy loading sur toutes les images sauf hero\n- CDN Cloudflare avec cache auto\n- Build Vite avec code splitting (lazy imports par composant)",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/audit-seo-technique.md"
    }
  },
  {
    "id": "doc-docs-seo-audit-seo-technique-md-5",
    "text": "[docs/seo/audit-seo-technique.md § 2. Performance & Core Web Vitals › ⚠️ Points d'amélioration] - **LCP** : le hero Amaryllis (photo 01.webp) est en `loading=\"lazy\"` → devrait être `eager` + `fetchpriority=\"high\"`\n- **CLS** : vérifier width/height explicites sur toutes les images du filmstrip\n- **INP** : le composant PublicSite.jsx (~9 000 lignes) pourrait bénéficier d'un découpage plus fin\n- **Bundle size** : react-leaflet chargé sur toutes les fiches même sans carte visible → lazy load conditionnel\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/audit-seo-technique.md"
    }
  },
  {
    "id": "doc-docs-seo-audit-seo-technique-md-6",
    "text": "[docs/seo/audit-seo-technique.md § 3. Maillage interne › ✅ En place] - Footer avec liens vers tous les biens\n- Guides inter-liés (guides locaux → fiches biens)\n- Breadcrumb structuré sur les guides",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/audit-seo-technique.md"
    }
  },
  {
    "id": "doc-docs-seo-audit-seo-technique-md-7",
    "text": "[docs/seo/audit-seo-technique.md § 3. Maillage interne › ⚠️ Points d'amélioration] - **Hub → spokes** : `/guide-hub` existe mais peu lié depuis la home\n- **Fiches biens → guides** : chaque fiche devrait pointer vers les 2-3 guides les plus proches (ex: Amaryllis → guide Sainte-Luce)\n- **Pages orphelines** : vérifier `/nos-partenaires`, `/seminaires` (peu de liens entrants)\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/audit-seo-technique.md"
    }
  },
  {
    "id": "doc-docs-seo-audit-seo-technique-md-8",
    "text": "[docs/seo/audit-seo-technique.md § 4. Contenu & longue traîne › Mots-clés cibles prioritaires (volume + intention)] | Mot-clé | Volume est. | Page cible | Statut |\n|---|---|---|---|\n| villa avec piscine Martinique | fort | `/location-villa-martinique-piscine` | ✅ page dédiée |\n| location Sainte-Luce Martinique | moyen | `/amaryllis` + home | ✅ |\n| location groupe Martinique | moyen | `/location-groupe-sainte-luce` | ✅ |\n| appartement Nogent-sur-Marne | moyen | `/nogent` | ✅ |\n| villa Martinique pas cher | fort | manque landing dédiée | ❌ |\n| studio Martinique bord de mer | moyen | → Mabouya / Géko | ❌ pas de page dédiée |\n| location Schœlcher Martinique | faible | `/schoelcher` | ✅ |\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/audit-seo-technique.md"
    }
  },
  {
    "id": "doc-docs-seo-audit-seo-technique-md-9",
    "text": "[docs/seo/audit-seo-technique.md § 5. Actions prioritaires (par ROI)] 1. **[QUICK WIN]** Ajouter schema `FAQPage` JSON-LD à `/faq` → rich snippet Google\n2. **[QUICK WIN]** Hero image `loading=\"eager\" fetchpriority=\"high\"` → LCP -0.5s\n3. **[MOYEN]** Page `/studio-martinique-pas-cher` (Mabouya + Géko) → longue traîne\n4. **[MOYEN]** Maillage fiches biens → guides locaux (2 liens par fiche)\n5. **[LONG]** Schema `LocalBusiness` sur la home",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/audit-seo-technique.md"
    }
  },
  {
    "id": "doc-docs-seo-baseline-2026-06-02-md-0",
    "text": "[docs/seo/baseline-2026-06-02.md § Introduction] # Baseline SEO — avant programme « Hub & Spoke » (2026-06-02)\n\nSnapshot du trafic (GA4, 30 derniers jours) **avant** le lot 1 du programme SEO guides.\nSource : `/api/analytics` (GA4 Data API). À comparer à **J+30 (02/07)** et **J+60 (02/08)** — focus sessions organiques par cluster.",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/baseline-2026-06-02.md"
    }
  },
  {
    "id": "doc-docs-seo-baseline-2026-06-02-md-1",
    "text": "[docs/seo/baseline-2026-06-02.md § Trafic par page (toutes sources, 30 j)] | Page | Sessions | Users | Durée moy. (s) |\n|---|---|---|---|\n| / | 90 | 71 | 180 |\n| /amaryllis | 65 | 34 | 419 |\n| /geko | 26 | 20 | 315 |\n| /zandoli | 20 | 16 | 519 |\n| /guide | 10 | 2 | 479 |\n| /iguana | 10 | 10 | 20 |\n| /mabouya | 9 | 7 | 300 |\n| /schoelcher | 9 | 8 | 29 |\n| /location-groupe-sainte-luce | 4 | 4 | 171 |\n| /guide-sainte-anne | 3 | 1 | 2415 |\n| /activites-sainte-luce | 2 | 1 | 7 |\n| /admin | 2 | 2 | 27 |\n| /nogent | 2 | 1 | 995 |\n| /explorer | 1 | 1 | 1237 |\n| /guide-hub | 1 | 1 | 106 |",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/baseline-2026-06-02.md"
    }
  },
  {
    "id": "doc-docs-seo-baseline-2026-06-02-md-2",
    "text": "[docs/seo/baseline-2026-06-02.md § Clusters (cible du maillage)] | Hub | URL hub | Guides satellites | Biens |\n|---|---|---|---|\n| Sainte-Luce (Sud) | /sainte-luce-martinique | plus-belles-plages-sud-martinique, activites-sainte-luce, guide-distilleries-martinique, guide-gastronomie-martinique, meilleure-saison-martinique | Amaryllis, Zandoli, Géko, Mabouya |\n| Sud / Diamant | /guide-le-diamant | guide-plongee-martinique, guide-randonnees-martinique, guide-sainte-anne, guide-arlet | Villa Iguana |\n| Organiser son séjour | /guide-hub | meilleure-saison-martinique, reservation-directe-martinique, guide-trois-ilets, guide-saint-pierre-martinique, guide-francois-martinique | tous |\n| Nogent (IDF",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/baseline-2026-06-02.md"
    }
  },
  {
    "id": "doc-docs-seo-baseline-2026-06-02-md-3",
    "text": "[docs/seo/baseline-2026-06-02.md § Constat de départ] - Trafic concentré accueil + fiches biens ; **guides quasi nuls en organique** (/guide 10, /guide-sainte-anne 3, /activites-sainte-luce 2).\n- Objectif lot 1 : fondation technique + maillage + enrichissement pour faire émerger les guides et les connecter aux biens.\n\n> Revue : J+30 / J+60 — comparer les sessions organiques par cluster vs ce snapshot.",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/baseline-2026-06-02.md"
    }
  },
  {
    "id": "doc-docs-seo-calendrier-contenu-guides-md-0",
    "text": "[docs/seo/calendrier-contenu-guides.md § Introduction] # Calendrier contenu SEO — 12 mois (guides + saisonnalité)\n> Agent seo-005 · Advisory · S'appuie sur les guides existants + opportunités longue traîne identifiées",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/calendrier-contenu-guides.md"
    }
  },
  {
    "id": "doc-docs-seo-calendrier-contenu-guides-md-1",
    "text": "[docs/seo/calendrier-contenu-guides.md § Guides existants (base déjà solide)] - /guide-le-diamant · /guide-sainte-anne · /activites-sainte-luce · /guide-proximite\n- /guide-arlet · /guide-trois-ilets · /guide-plongee-martinique · /guide-saint-pierre-martinique\n- /guide-francois-martinique · /guide-distilleries-martinique · /guide-randonnees-martinique\n- /guide-gastronomie-martinique · /guide-nogent-sur-marne · /meilleure-saison-martinique",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/calendrier-contenu-guides.md"
    }
  },
  {
    "id": "doc-docs-seo-calendrier-contenu-guides-md-2",
    "text": "[docs/seo/calendrier-contenu-guides.md § Calendrier 12 mois — contenus à créer] | Mois | Sujet | URL cible | Intention | Lien avec saison |\n|---|---|---|---|---|\n| **Juillet** | Studio pas cher Martinique | `/studio-martinique-pas-cher` | transac | Basse saison = prix attractifs |\n| **Août** | Que faire en famille en Martinique | `/activites-famille-martinique` | info | Vacances scolaires |\n| **Septembre** | Martinique hors saison — le bon plan | `/martinique-hors-saison` | info | Septembre creux = à valoriser |\n| **Octobre** | Séjour bien-être Martinique | `/sejour-bien-etre-martinique` | info | Pré-haute saison |\n| **Novembre** | Noël en Martinique : où séjourner ? | `/noel-martinique` | t",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/calendrier-contenu-guides.md"
    }
  },
  {
    "id": "doc-docs-seo-calendrier-contenu-guides-md-3",
    "text": "[docs/seo/calendrier-contenu-guides.md § Règles de création] - **Format** : s'appuyer sur le composant `GuideBase.jsx` existant\n- **Longueur cible** : 800-1200 mots (assez pour le SEO, pas trop pour la lecture mobile)\n- **CTA systématique** : bouton RÉSERVER vers le bien le plus adapté + `NewsletterForm`\n- **Maillage** : 2-3 liens vers guides existants + 1 lien vers fiche bien\n- **Images** : 3-5 photos webp existantes (photos/{bienId}/) + 1 image hero `fetchpriority=\"high\"`",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/calendrier-contenu-guides.md"
    }
  },
  {
    "id": "doc-docs-seo-calendrier-contenu-guides-md-4",
    "text": "[docs/seo/calendrier-contenu-guides.md § Priorité absolue : `/studio-martinique-pas-cher`] Ciblé Mabouya + Géko · Prix < 120€/nuit · Basse saison à valoriser · Long terme à créer juillet 2026",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/calendrier-contenu-guides.md"
    }
  },
  {
    "id": "doc-docs-seo-off-page-citations-kit-md-0",
    "text": "[docs/seo/off-page-citations-kit.md § Introduction] # Kit citations off-page (NAP) — SEO local Amaryllis\n\n> Objectif : multiplier les **citations cohérentes** (Name-Address-Phone) sur les annuaires et plateformes → renforce le SEO local (« location villa Sainte-Luce », « appartement Nogent ») et la confiance Google.\n> ⚠️ **Cohérence NAP impérative** : copier-coller EXACTEMENT les mêmes infos partout (mêmes orthographes, même format de téléphone). Toute variation dilue le signal.",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/off-page-citations-kit.md"
    }
  },
  {
    "id": "doc-docs-seo-off-page-citations-kit-md-1",
    "text": "[docs/seo/off-page-citations-kit.md § NAP canonique (à coller à l'identique)] **Nom** : Amaryllis Locations\n**Site** : https://villamaryllis.com\n**Téléphone** : +33 6 10 88 07 72\n**Email** : contact@villamaryllis.com\n**Zones** : Sainte-Luce & Schœlcher (Martinique) · Nogent-sur-Marne (Île-de-France)\n**Catégorie** : Maison/location de vacances (hébergement touristique)\n**Description courte (≤ 200 c)** : Location de villas et logements de vacances en direct — Martinique (Sainte-Luce, piscine, vue mer) et Nogent-sur-Marne. Réservation sans frais d'agence.",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/off-page-citations-kit.md"
    }
  },
  {
    "id": "doc-docs-seo-off-page-citations-kit-md-2",
    "text": "[docs/seo/off-page-citations-kit.md § Checklist plateformes (action Vincent — gratuit sauf mention)] | Plateforme | Statut | Lien d'inscription | Note |\n|---|---|---|---|\n| **Google Business Profile** | ✅ 2 fiches (Villa + Résidence) | business.google.com | déjà en place ; garder posts/photos à jour |\n| **Apple Business Connect** | ⬜ à faire (local-002) | businessconnect.apple.com | gratuit ; visibilité Apple Plans/Siri |\n| **Bing Places** | ⬜ à faire | bingplaces.com | gratuit ; import possible depuis GBP |\n| **TripAdvisor** | ⬜ à faire (local-003) | tripadvisor.com/Owners | créer la/les fiche(s) ; lien avis post-séjour |\n| **PagesJaunes** | ⬜ à faire | pagesjaunes.fr (espace pro) | annuair",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/off-page-citations-kit.md"
    }
  },
  {
    "id": "doc-docs-seo-off-page-citations-kit-md-3",
    "text": "[docs/seo/off-page-citations-kit.md § Bonnes pratiques] - Même **nom exact** partout : « Amaryllis Locations » (pas « Villa Amaryllis Locations » ni variantes).\n- Téléphone au **même format** (+33 6 10 88 07 72).\n- Lien site = **https://villamaryllis.com** (avec https, sans slash final).\n- Quand une fiche autorise un lien ciblé : Villa → `/amaryllis`, Résidence/groupe → `/location-groupe-sainte-luce`, Nogent → `/nogent`.\n- Après création, **noter le statut** dans ce tableau (✅) pour suivre.\n\n> Backlog adressé : local-002 (Apple Plans), local-003 (TripAdvisor), local-004 (linter NAP — vérifier la cohérence sur ces annuaires une fois créés).",
    "metadata": {
      "source": "doc",
      "doc": "docs/seo/off-page-citations-kit.md"
    }
  },
  {
    "id": "doc-docs-service-client-faq-disponibilite-acces-md-0",
    "text": "[docs/service-client/faq-disponibilite-acces.md § Introduction] # FAQ — Disponibilité & Accès logements\n> Agent sc-051. À intégrer dans le site (page /faq ou GuestGuide) et à utiliser pour les réponses rapides.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/faq-disponibilite-acces.md"
    }
  },
  {
    "id": "doc-docs-service-client-faq-disponibilite-acces-md-1",
    "text": "[docs/service-client/faq-disponibilite-acces.md § Disponibilités & Réservations] **Q : Comment vérifier si un logement est disponible ?**\nLe calendrier de disponibilités est en temps réel sur chaque fiche de bien sur villamaryllis.com. Sélectionnez vos dates directement sur la page du logement.\n\n**Q : Puis-je réserver pour le jour même ?**\nOui, les réservations de dernière minute sont possibles si le logement est disponible. Contactez-nous par WhatsApp (+33 6 10 88 07 72) pour confirmer rapidement.\n\n**Q : Combien de temps à l'avance peut-on réserver ?**\nVous pouvez réserver jusqu'à 12 mois à l'avance. Les disponibilités sont mises à jour en temps réel depuis Airbnb, Booking.com et les réserv",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/faq-disponibilite-acces.md"
    }
  },
  {
    "id": "doc-docs-service-client-faq-disponibilite-acces-md-2",
    "text": "[docs/service-client/faq-disponibilite-acces.md § Accès & Check-in] **Q : À quelle heure puis-je arriver ?**\nL'arrivée (check-in) est possible **à partir de 17h00**. Un check-in anticipé peut être arrangé sous réserve de disponibilité — contactez-nous 48h à l'avance.\n\n**Q : À quelle heure dois-je quitter le logement ?**\nLe départ (check-out) est avant **12h00**. Un départ tardif jusqu'à 14h00 est parfois possible sur demande (sous réserve de disponibilité).\n\n**Q : Comment récupérer les clés ?**\nL'accès se fait par **boîte à clés / serrure à code**. Le code vous est communiqué par email et WhatsApp dans les **24h précédant votre arrivée**.\n\n**Q : Y a-t-il un accueil en personne ?**\nPour les b",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/faq-disponibilite-acces.md"
    }
  },
  {
    "id": "doc-docs-service-client-faq-disponibilite-acces-md-3",
    "text": "[docs/service-client/faq-disponibilite-acces.md § Annulation & Modification] **Q : Puis-je annuler ma réservation ?**\nOui. Selon notre politique d'annulation :\n- Annulation ≥ 30j avant l'arrivée : **remboursement intégral**\n- Annulation entre 15 et 29j : **remboursement 50%**\n- Annulation < 15j : **aucun remboursement**\n\n**Q : Puis-je modifier mes dates après réservation ?**\nContactez-nous dès que possible par email ou WhatsApp. Les modifications sont acceptées sous réserve de disponibilité. Si les nouvelles dates sont moins chères, un avoir vous est accordé.\n\n**Q : Et en cas de force majeure (cyclone, problème médical) ?**\nNous proposons un report du séjour ou un avoir valable 12 mois. Chaq",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/faq-disponibilite-acces.md"
    }
  },
  {
    "id": "doc-docs-service-client-faq-disponibilite-acces-md-4",
    "text": "[docs/service-client/faq-disponibilite-acces.md § Paiement & Caution] **Q : Comment fonctionne le paiement ?**\nPaiement intégral par carte bancaire (Visa, Mastercard, Amex) via Stripe lors de la réservation. Vos données de paiement ne sont pas stockées sur notre site.\n\n**Q : Qu'est-ce que la caution ?**\nUne pré-autorisation bancaire (empreinte CB) est réalisée **2-3 jours avant votre arrivée**, sans débit immédiat. Elle est libérée automatiquement **3 jours après votre départ** en l'absence de dommages. Aucune action de votre part n'est nécessaire.\n\n**Q : Puis-je payer en espèces sur place ?**\nNon. Le paiement se fait exclusivement en ligne par carte bancaire via notre site sécurisé.",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/faq-disponibilite-acces.md"
    }
  },
  {
    "id": "doc-docs-service-client-guide-depannage-voyageur-md-0",
    "text": "[docs/service-client/guide-depannage-voyageur.md § Introduction] # Guide dépannage — À l'attention des voyageurs\n> Agent sc-060. À intégrer dans le GuestGuide / envoyer avec l'email pré-arrivée.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/guide-depannage-voyageur.md"
    }
  },
  {
    "id": "doc-docs-service-client-guide-depannage-voyageur-md-1",
    "text": "[docs/service-client/guide-depannage-voyageur.md § 🔑 Accès & Serrure] **Problème : le code ne fonctionne pas**\n1. Vérifiez que vous entrez le bon code (envoyé par WhatsApp/email 24h avant)\n2. Tapez le code lentement, chiffre par chiffre\n3. Attendez le signal sonore / lumineux avant d'appuyer sur la poignée\n4. Si toujours bloqué → WhatsApp : +33 6 10 88 07 72 (réponse < 30 min de 8h à 22h)\n\n**Problème : la porte est coincée**\n- Tirez légèrement la poignée vers vous en tournant la clé / en entrant le code\n- En Martinique, l'humidité peut faire gonfler les bois — forcer légèrement puis tourner\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/guide-depannage-voyageur.md"
    }
  },
  {
    "id": "doc-docs-service-client-guide-depannage-voyageur-md-2",
    "text": "[docs/service-client/guide-depannage-voyageur.md § ❄️ Climatisation] **Problème : la clim ne refroidit pas**\n1. Vérifiez que la télécommande est en mode ❄️ (froid) et non ☀️ (chaud) ou auto\n2. Cible : 24-26°C (en dessous = surconsommation sans confort supplémentaire)\n3. Vérifiez que portes et fenêtres sont fermées\n4. Si le filtre est visible et gris → contactez-nous, on passe le nettoyer\n\n**Problème : la télécommande ne répond pas**\n- Changez les piles (format AA, disponibles en supermarché)\n- Pointez directement vers le boîtier mural de la clim (< 3 mètres)\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/guide-depannage-voyageur.md"
    }
  },
  {
    "id": "doc-docs-service-client-guide-depannage-voyageur-md-3",
    "text": "[docs/service-client/guide-depannage-voyageur.md § 🌐 Wi-Fi] **Problème : pas de connexion**\n1. Vérifiez le nom du réseau (SSID) et le mot de passe dans le livret d'accueil / email de bienvenue\n2. Redémarrez votre appareil\n3. Si la box clignote rouge → débranchez-la 30 secondes, rebranchez\n4. Si toujours pas de Wi-Fi → WhatsApp : +33 6 10 88 07 72\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/guide-depannage-voyageur.md"
    }
  },
  {
    "id": "doc-docs-service-client-guide-depannage-voyageur-md-4",
    "text": "[docs/service-client/guide-depannage-voyageur.md § ⚡ Électricité] **Problème : plus d'électricité (tout est coupé)**\n1. Localisez le tableau électrique (généralement dans l'entrée ou couloir)\n2. Remettez les disjoncteurs en position ON (vers le haut)\n3. Si un disjoncteur retombe immédiatement → débranchez les appareils et réessayez\n4. Si la coupure persiste → contactez-nous\n\n**Problème : une prise ne fonctionne pas**\n- Testez avec un autre appareil (la prise peut être protégée par un fusible)\n- Vérifiez si le problème est localisé (une seule prise) ou général (tout l'appartement)\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/guide-depannage-voyageur.md"
    }
  },
  {
    "id": "doc-docs-service-client-guide-depannage-voyageur-md-5",
    "text": "[docs/service-client/guide-depannage-voyageur.md § 🚿 Eau chaude] **Problème : pas d'eau chaude**\n1. Attendez 2-3 minutes que l'eau chauffe (chauffe-eau instantané ou ballon à remonter en température)\n2. Si le chauffe-eau est électrique → vérifiez qu'il n'a pas disjoncté (tableau électrique)\n3. Si toujours froid après 5 minutes → WhatsApp : +33 6 10 88 07 72\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/guide-depannage-voyageur.md"
    }
  },
  {
    "id": "doc-docs-service-client-guide-depannage-voyageur-md-6",
    "text": "[docs/service-client/guide-depannage-voyageur.md § 🏊 Piscine (Villa Amaryllis)] **Problème : eau trouble / verte**\n- Ne pas se baigner, contactez-nous immédiatement\n- Le prestataire piscine intervient sous 24h\n\n**Problème : pompe éteinte**\n- Ne pas redémarrer vous-même → contactez-nous\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/guide-depannage-voyageur.md"
    }
  },
  {
    "id": "doc-docs-service-client-guide-depannage-voyageur-md-7",
    "text": "[docs/service-client/guide-depannage-voyageur.md § 🍳 Cuisine & Électroménager] **Problème : plaques à induction / vitrocéramique ne s'allument pas**\n- Vérifiez que le bouton principal (souvent sur le côté) est en position ON\n- Pour l'induction : utiliser uniquement des casseroles ferromagnétiques (aimant doit coller au fond)\n\n**Problème : réfrigérateur chaud**\n- Vérifiez que le thermostat n'est pas à 0 (minimum)\n- Vérifiez que la porte ferme correctement (joint en bon état)\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/guide-depannage-voyageur.md"
    }
  },
  {
    "id": "doc-docs-service-client-guide-depannage-voyageur-md-8",
    "text": "[docs/service-client/guide-depannage-voyageur.md § 📞 Contacts d'urgence] | Situation | Contact |\n|---|---|\n| **Problème logement** | WhatsApp +33 6 10 88 07 72 (8h-22h) |\n| **Urgence médicale** | 15 (SAMU) · 112 (Europe) · +596 596 75 15 15 (Martinique) |\n| **Pompiers** | 18 · +596 596 70 96 96 (Martinique) |\n| **Police** | 17 |\n| **Electricité panne générale Martinique** | EDF : 0 800 33 2026 (numéro vert) |\n| **Urgence eau Martinique** | SMDS : +596 596 76 08 01 |\n\n> Pour toute question non urgente : contact@villamaryllis.com",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/guide-depannage-voyageur.md"
    }
  },
  {
    "id": "doc-docs-service-client-template-reclamation-sejour-md-0",
    "text": "[docs/service-client/template-reclamation-sejour.md § Introduction] # Templates réponse réclamation — En cours de séjour\n> Agent sc-056. Copier-coller + adapter selon la situation. Toujours répondre < 2h.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/template-reclamation-sejour.md"
    }
  },
  {
    "id": "doc-docs-service-client-template-reclamation-sejour-md-1",
    "text": "[docs/service-client/template-reclamation-sejour.md § 🔴 NIVEAU 1 — Problème critique (logement inhabitable)] *Clim en panne canicule / pas d'eau chaude / serrure bloquée / inondation*\n\n**WhatsApp / Email :**\n> Bonjour [Prénom], je suis vraiment désolé(e) pour ce désagrément. C'est tout à fait inacceptable et je comprends votre frustration.\n>\n> J'interviens personnellement sur ce problème maintenant. [Technicien contacté / Je passe dans l'heure / Solution alternative : ...]\n>\n> Dans l'attente de la résolution, [proposer : hotel de remplacement / remboursement nuit / geste commercial].\n>\n> Je vous rappelle dans 30 minutes pour confirmer la prise en charge.\n> Vincent — +33 6 10 88 07 72\n\n**À f",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/template-reclamation-sejour.md"
    }
  },
  {
    "id": "doc-docs-service-client-template-reclamation-sejour-md-2",
    "text": "[docs/service-client/template-reclamation-sejour.md § 🟠 NIVEAU 2 — Problème important (confort impacté)] *Clim qui chauffe mal / Wi-Fi coupé / appareil défaillant / manque de linge*\n\n**WhatsApp :**\n> Bonjour [Prénom], merci de me le signaler. Je suis désolé(e) pour la gêne occasionnée.\n>\n> Je prends en charge dès maintenant. [Action : technicien programmé demain matin / je dépose ce soir / solution de contournement : ...]\n>\n> N'hésitez pas si vous avez d'autres questions. Bonne soirée !\n> Amaryllis Locations\n\n**À faire :**\n- [ ] Résoudre dans les 24h\n- [ ] Confirmer la résolution au voyageur\n- [ ] Si non résolu < 24h → monter en niveau 1\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/template-reclamation-sejour.md"
    }
  },
  {
    "id": "doc-docs-service-client-template-reclamation-sejour-md-3",
    "text": "[docs/service-client/template-reclamation-sejour.md § 🟡 NIVEAU 3 — Inconfort mineur (pas urgent)] *Ampoule grillée / voisinage bruyant passager / équipement manquant non critique*\n\n**WhatsApp :**\n> Bonjour [Prénom], merci pour votre retour !\n>\n> [Ampoule / équipement] : je passe [demain matin / lors du prochain passage] régler ça. En attendant, [solution de contournement si possible].\n>\n> Pour le reste, profitez bien de votre séjour à [Sainte-Luce / Nogent] ! 🌴\n> Amaryllis Locations\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/template-reclamation-sejour.md"
    }
  },
  {
    "id": "doc-docs-service-client-template-reclamation-sejour-md-4",
    "text": "[docs/service-client/template-reclamation-sejour.md § 🌟 NIVEAU 4 — Demande spéciale (pas une réclamation)] *Early check-in / late check-out / guide local / recommandation resto*\n\n**WhatsApp :**\n> Bonjour [Prénom] ! Avec plaisir.\n>\n> **Check-in anticipé / départ tardif :** [Possible à Xh sous réserve de disponibilité / Malheureusement ce jour-là nous avons une arrivée à 17h] — confirmé(e) !\n>\n> **Recommandation :** [réponse personnalisée selon le bien]\n>\n> Bonne journée ! 🌺\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/template-reclamation-sejour.md"
    }
  },
  {
    "id": "doc-docs-service-client-template-reclamation-sejour-md-5",
    "text": "[docs/service-client/template-reclamation-sejour.md § 📋 Suivi des incidents] Après chaque réclamation, noter dans le dashboard admin (onglet Réservations → Notes) :\n```\n[DATE] INCIDENT [NIVEAU] : [nature du problème] → [action prise] → [résolution]\nGeste commercial : [oui/non — montant]\n```\n\n> ⚠️ Ne jamais promettre un remboursement sans l'avoir validé. Promettre une action, pas un montant.",
    "metadata": {
      "source": "doc",
      "doc": "docs/service-client/template-reclamation-sejour.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-0",
    "text": "[docs/strategie/plan-ceo-2026-06.md § Introduction] # Plan stratégique CEO — Amaryllis Locations\n\n> Rédigé le 2026-06-01 pour Vincent Salomon. Horizon : 90 jours (juin → août 2026) + cap annuel.\n> Données : performances réelles 2025 (occ / ADR / RevPAR / CA / charges). Tout chiffre marqué *(est.)* est une estimation explicite, pas une donnée mesurée.\n> Règle du document : **je prépare et je chiffre, tu décides et tu exécutes.** Aucune dépense, aucune connexion compte lancée par cette analyse.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-1",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 1. Situation en une page › Le portefeuille en chiffres (2025)] | Bien | Type | Occ. | ADR | RevPAR | CA an. | Charges/mois | Lecture |\n|---|---|---:|---:|---:|---:|---:|---|\n| **Amaryllis** | villa premium | 33 % | 312 € | 104 € | 38 001 € | 1 682 € | 🔴 Sous-occupé. La plus grosse fuite de cash du portefeuille. |\n| Zandoli | logement | 68 % | 132 € | 89 € | 32 656 € | 376 € | 🟢 Sain, le meilleur RevPAR exploitable. Modèle à répliquer. |\n| Nogent | appart (94) | 71 % | 98 € | 69 € | 25 281 € | 1 330 € | 🟡 Plafonné légalement à **120 nuits/an** (résidence principale). |\n| Iguana | villa | 100 % | 65 € | 65 € | 23 600 € | 404 € | ⚪ En **bail longue durée",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-2",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 1. Situation en une page › Le vrai problème (par ordre d'importance)] 1. **Famine de trafic, pas un problème d'offre.** ~5 visiteurs/jour, ~4 sessions SEO organiques sur 7 jours, **0 visite organique sur les pages commerciales**. Le funnel direct (Stripe, livret, GA4 corrigé) est techniquement prêt — **il n'y a personne pour l'emprunter.** Le goulot est en haut de l'entonnoir : l'acquisition, pas la conversion.\n2. **Les biens premium sont sous-occupés alors qu'ils portent le plus de potentiel cash.** Amaryllis à 33 % d'occupation, c'est ~67 % de nuits vides sur l'actif le plus cher. Remonter Amaryllis seule de 33 % → 55 % (à ADR constant) = **+25 000 €/a",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-3",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 1. Situation en une page › Forces / Faiblesses] **Forces** — Note Airbnb 4,79/5 (97 avis) = preuve sociale rare et chère à construire. Funnel direct opérationnel (Stripe, livret digital, contact propriétaire). Cluster Sainte-Luce physiquement groupé (offre groupe jusqu'à 11 pers., concurrence pub quasi nulle). Stack technique mature (dashboard, crons emails, revenue manager, ~23 agents IA) → capacité d'exécution démesurée pour un solo.\n\n**Faiblesses** — Trafic quasi nul = aucun volume sur le direct. Gestion solo = temps = goulot réel. SEO à l'abandon (gisement gratuit qui dort). Pas de budget marketing confirmé au-delà de ~400 € de crédit Google. Saisonn",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-4",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 2. Vision & priorités] **Cap 12 mois : faire passer le portefeuille court-séjour de ~38 % d'occupation moyenne sur les biens sous-remplis à 55 %+, en captant la demande via le DIRECT plutôt qu'en payant la dîme OTA.** Le levier n'est pas un 8e bien — c'est remplir les 4 qu'on a déjà à moitié vides.",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-5",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 2. Vision & priorités › 3 priorités, classées par ROI / effort] | # | Priorité | Pourquoi en premier | Effort | Impact *(est.)* |\n|---|---|---|---|---|\n| **P1** | **Remplir Amaryllis + le cluster groupe** | 1 bien = +25 k€/an de potentiel. Concurrence pub faible sur « villa groupe Sainte-Luce ». Le panier groupe 2 500–4 000 € rentabilise n'importe quelle pub. | Moyen | 🟢🟢🟢 |\n| **P2** | **Ouvrir le robinet de trafic (pub ciblée + SEO)** | Sans trafic, rien d'autre ne marche. Google Ads brand+search (crédit dispo) = rapide ; SEO = gratuit mais lent → lancer les deux maintenant. | Moyen | 🟢🟢🟢 |\n| **P3** | **Basculer la demande OTA vers le direct** | R",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-6",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 3. Plan 90 jours (juin → août 2026)] Convention : **[V]** = Vincent fait (décision/validation/action terrain) · **[A]** = automatisé/agents/déjà outillé, Vincent supervise.",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-7",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 3. Plan 90 jours (juin → août 2026) › Juin — Amorcer (creux saisonnier = fenêtre pour préparer sans pression)] **Semaine 1 (2–8 juin)**\n- **[V]** Vérifier le **crédit Google Ads (~400 €)** réel sur le compte (226-428-3778). Décision GO/NO-GO budget pub (voir §6).\n- **[V]** Valider les **prix basse saison** en attente dans l'admin (`docs/pricing-basse-saison-reco.md`) — rien n'est appliqué aujourd'hui, on vend le creux au prix fort = on ne vend rien.\n- **[A]** Corriger le **funnel aveugle** : importer la conversion `purchase` (client, pas `booking_completed` serveur) dans Google Ads. Sans ça la pub optimise à l'aveugle.\n\n**Semaine 2 (9–15 juin)**\n- **[V]*",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-8",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 3. Plan 90 jours (juin → août 2026) › Juillet — Tester & optimiser (la haute saison se prépare 4-8 mois à l'avance → on remplit déjà déc-avril)] - **[V]** **Pousser l'offre GROUPE** (cluster Sainte-Luce, panier 2 500-4 000 €) : la haute saison déc-avril se réserve maintenant. Campagne search dédiée `/location-groupe-sainte-luce` + relance des demandes groupe entrantes sous 2 h.\n- **[A]** **A/B test** hero Amaryllis + CTA (tests déjà câblés `hero_amaryllis`, `cta_label`) — ne jamais A/B le prix (casse le calcul total, cf. piège connu).\n- **[A]** **Séquence email** pré-arrivée / post-séjour / demande d'avis active → faire grossir la base avis + repeat dire",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-9",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 3. Plan 90 jours (juin → août 2026) › Août — Scaler ce qui marche] - **[V]** **Réallouer le budget** vers les 2-3 mots-clés / annonces au meilleur coût par réservation directe. Couper le reste.\n- **[V]** Si la pub groupe a converti ≥1 réservation : **augmenter le budget de cette seule campagne** (ROI prouvé sur gros panier).\n- **[A]** **Bilan 90 jours** : trafic, % direct vs OTA, occupation par bien, coût d'acquisition réservation directe. Décision sur la suite (budget pub Q4, 8e bien à étudier ou non).\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-10",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 4. Leviers de croissance (classés) › (a) Acquisition payante — Google d'abord, Meta ensuite] - **Google Ads en premier** : crédit ~400 € dispo, lien GA4↔Ads fait, intent transactionnel fort (« je cherche une villa Martinique »). Démarrer **Brand** (défensif, très rentable, empêche un concurrent d'acheter ton nom) + **Search « groupe Sainte-Luce »** (concurrence pub quasi nulle, gros panier).\n- **Meta Ads en étape 2** : ⚠️ pas de MCP de gestion campagnes → pilotage Ads Manager au navigateur (option A retenue au backlog). Pertinent pour le **remarketing visuel** (villa = produit photogénique) une fois le pixel chaud. Ne pas ouvrir ce front avant que Google",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-11",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 4. Leviers de croissance (classés) › (b) SEO organique — le gisement gratuit qui dort] - **C'est l'actif le plus sous-exploité du portefeuille.** 30+ guides publiés, ~5 sessions/mois, 0 visite organique sur les pages commerciales. Le travail technique est fait ; ce qui manque = **intent transactionnel + maillage**.\n- Actions : réécrire les meta des fiches (double source `functions/[slug].js` qui écrase `prerender.mjs` — éditer les DEUX, vérité = la fonction ; title ≤60c, desc ≤158c). Créer/optimiser 3-5 pages à intent d'achat. Lier guides → fiches → page groupe.\n- ROI : nul à court terme, **composé et gratuit** à 6-12 mois. À lancer maintenant précisémen",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-12",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 4. Leviers de croissance (classés) › (c) Direct vs OTA — récupérer la marge] - Mécanique : **parité tarifaire** (jamais moins cher sur Airbnb que sur le site) + **avantage direct explicite** (-15 %, pas de frais de service, livret, contact propriétaire) + **incitation au rebooking** (code -5 % en post-séjour).\n- Sur le volume **existant**, basculer ne serait-ce que 20 % des nuits OTA en direct récupère ~15 % de commission sur ce volume = **marge nette immédiate, coût quasi nul**. C'est le levier au meilleur ratio impact/effort une fois qu'il y a du trafic.",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-13",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 4. Leviers de croissance (classés) › (d) Revenue management — remplir les 4 biens à moitié vides] - **Amaryllis (33 %)** : priorité absolue. Pricing dynamique creux/épaule, séjour-min abaissé en basse saison, pousser en offre groupe. 33→55 % = **+25 k€/an *(est.)***.\n- **Géko (39 %)** : bon ADR (139 €), juste un problème de visibilité. 39→55 % = **+8 k€/an *(est.)***.\n- **Schœlcher (37 %, charges 1 190 €/mois)** : marge la plus fragile. Si l'occupation ne décolle pas malgré pub+pricing en 90 j → **poser la question du bail longue durée** (comme Iguana : 100 % d'occupation, charges couvertes, zéro effort). 37→55 % = +6 k€/an *(est.)*.\n- **Mabouya (28 %)**",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-14",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 4. Leviers de croissance (classés) › (e) Offre groupe — le pari à plus fort levier] - Le cluster Sainte-Luce (Amaryllis + Zandoli + Géko + Mabouya, + Iguana) accueille un grand groupe / famille élargie. **Panier 2 500-4 000 €, concurrence pub quasi nulle, page dédiée existante** (`/location-groupe-sainte-luce`).\n- Une seule conversion groupe rentabilise tout le budget pub du trimestre. Réservation 4-8 mois à l'avance → **le travail de juillet remplit la haute saison déc-avril.** C'est le meilleur usage du budget marketing limité.\n\n---",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-15",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 5. KPIs & objectifs chiffrés] | KPI | Aujourd'hui | Cible 90 j (fin août) | Cible 12 mois |\n|---|---|---|---|\n| Trafic site | ~5 visiteurs/j (~150/mois) | 400-600 sessions/mois *(est.)* | 1 500+/mois |\n| Sessions SEO organique | ~4 / 7 j | 50-80 /mois *(est.)* | 300+/mois |\n| Taux de conversion réservation directe | non mesuré (funnel corrigé) | mesuré + ≥1,5 % *(est.)* | 2,5-3 % |\n| Réservations directes | quasi 0 | ≥ 5-8 sur le trimestre *(est.)* | flux régulier |\n| Part direct vs OTA (nuits) | ~OTA dominant | premières bascules visibles | 30-40 % direct |\n| Occupation Amaryllis | 33 % | 45 %+ *(est.)* | 55 %+ |\n| Occupation Géko / Schœlcher / Mabouya ",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-16",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 6. Décisions que Vincent doit prendre (cette semaine)] 1. **Budget pub.** GO/NO-GO sur l'utilisation du crédit ~400 € Google + décision d'un **budget mensuel d'appoint** (proposition réaliste : **150-300 €/mois sur juin-août**, soit ~450-900 € de poche au total, concentré sur Brand + groupe). Sans engagement au-delà, on reste sur le seul crédit.\n2. **Prix basse saison.** Valider (ou ajuster) les recos pricing en attente dans l'admin. Décision bloquante : on ne peut pas remplir le creux en gardant les prix de haute saison.\n3. **Tarif plancher offre groupe.** Fixer le prix du package cluster (2 500-4 000 € selon biens/durée) pour pouvoir lancer la pub grou",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  },
  {
    "id": "doc-docs-strategie-plan-ceo-2026-06-md-17",
    "text": "[docs/strategie/plan-ceo-2026-06.md § 7. Risques & angles morts] - **Saisonnalité.** On lance en juin (creux). Risque : juger les campagnes trop tôt sur un trafic naturellement bas et tout couper. **Garde-fou : le KPI qui compte en juillet, ce sont les réservations groupe pour déc-avril, pas l'occupation de juin.**\n- **Goulot = le temps de Vincent (solo).** Tout ce plan suppose que les tâches [V] (validations, GBP, réponses avis, pricing) se font. Si elles s'empilent, l'automatisation [A] tourne à vide. **Mitigation : limiter les décisions [V] à celles du §6, déléguer le reste aux agents.**\n- **Funnel encore partiellement aveugle.** GA4 conversions = 0 historiquement, attribution `booking_co",
    "metadata": {
      "source": "doc",
      "doc": "docs/strategie/plan-ceo-2026-06.md"
    }
  }
];
