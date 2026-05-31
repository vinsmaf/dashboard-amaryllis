# Design — Triage Autonome des agents IA (Amaryllis Locations)

> Spec validée le 2026-05-31. Issue d'un brainstorming avec Vincent.
> Approche retenue : **A — Le Triage Autonome**.

## 1. Problème

Le système des ~23 agents IA génère beaucoup (453 actions cumulées) mais souffre de 3 douleurs liées, qui forment une **boucle cassée** `générer → valider → appliquer → mesurer` :

1. **Ça produit, rien n'atterrit** — le backlog gonfle, peu d'actions deviennent réelles (publiées/appliquées).
2. **Je ne sais pas quoi valider** — trop de sorties, pas de tri par valeur.
3. **Je ne fais pas confiance** — peur des hallucinations ; `llm_outputs` est vide → pilotage à l'aveugle.

Contrainte cardinale de Vincent : **« quasi zéro » temps de pilotage**. Le système doit tourner en autonomie sur le sûr, et ne solliciter que pour l'argent / le légal / l'irréversible.

Données observées (31/05) : 177 actions actives, **7 % seulement avec métrique chiffrée**, **14 % vagues**, `llm_outputs` = 0 ligne.

## 2. Principe directeur

**Classer chaque action par niveau de risque, auto-exécuter le sûr (en préparation, jamais en public), et ne remonter à Vincent que l'argent/légal/irréversible.**

Prudent par construction : une action est `review` **par défaut**. Elle ne devient `auto` que si une règle explicite de sûreté matche ; elle devient `blocked` si une règle de danger matche. « auto » = **préparer un livrable** (draft fact-checké), **jamais le rendre public**. Pire cas d'une erreur `auto` = un brouillon à jeter.

## 3. Architecture

```
agents-run (génère candidats)
      │
      ▼
[_triage.js]  ── filtre qualité (rejette vague/doublon/court, retry 1× à l'agent)
      │          puis classify() → risk ∈ {auto, review, blocked}
      │          + log dans llm_outputs (traçabilité)
      ▼  (insertion en base seulement si "keep")
┌──────────────┬───────────────────┬──────────────────────┐
│  risk=auto   │   risk=review     │    risk=blocked      │
│ agents-      │  file "À valider" │  jamais auto         │
│ execute      │  (admin, max 5,   │  (€/légal/pub/       │
│ → drafts     │   trié par valeur)│   irréversible)      │
│ (drafted,    │                   │                      │
│  non public) │                   │                      │
└──────────────┴───────────────────┴──────────────────────┘
      │
      ▼
[digest hebdo] (cron Worker, lundi) → email/ntfy : préparés / à valider / publiés / qualité
```

### Réutilisation de l'existant (≈80 %)
- `functions/api/agents-deliver.js` — bras exécutant (`meta-seo`, `email-sequence`, `pricing-reco`), fact-checké. **Réutilisé tel quel.**
- `functions/api/agent-drafts.js` + table `agent_drafts` — workflow `drafted → approved → published`. **Réutilisé.**
- `functions/api/_factcheck.js` — fact-checker. **Réutilisé** dans le filtre qualité.
- Worker `workers/ical-sync` — crons hebdo. **Étendu** d'un cron digest.
- Onglet admin **Approbations** — **réutilisé** comme file « À valider ».

### Modules neufs
- `functions/api/_triage.js` — helper pur : `classify(action, existingActions) → { keep, risk, reason, isDuplicateOf? }`. Une responsabilité, testable Vitest en isolation. Constantes de mots-clés exportées et ajustables.
- `functions/api/agents-execute.js` — endpoint (cron) qui traite les actions `risk=auto` via `agents-deliver`.
- Colonne `risk` sur `agent_actions` (+ valeur par défaut `review`).
- Étape digest dans le Worker.

## 4. Grille de risque (déterministe, ordre : blocked → auto → review)

### 🔴 blocked (jamais automatique)
- **catégorie** ∈ { `legal`, `ads`, `revenue` }
- **OU mot-clé** ∈ { prix, tarif, appliquer, publier prix, dépense, budget, campagne, lancer, Google Ads, Meta Ads, caution, Stripe, paiement, RGPD, CGV, déclaration, contrat, supprimer, GBP, fiche Google }
- Cohérent avec les contraintes mémoire : RM = reco only ; jamais lancer de pub ; jamais valider une fiche GBP à la place de Vincent.

### 🟢 auto (niveau **prudent** retenu — élargissable)
Une action est `auto` **seulement si** :
- type livrable = `meta-seo` (→ draft, pas prod), **OU** action de catégorie `content`/`seo` produisant un **draft réseau** (`social_post`, canaux `["ig","fb"]` forcés, statut `drafted`)
- **ET** effort ≤ 2h
- **ET** aucun mot-clé blocked
- **ET** la sortie passe le fact-checker (sinon → `review`)
- *Exclus du niveau prudent (→ review)* : `email-sequence`, `pricing-reco`, tout le reste. (Élargissables aux niveaux modéré/large plus tard.)

### 🟡 review (défaut)
Tout le reste. File plafonnée à 5, triée par valeur (priorité × proxy €).

## 5. Filtre qualité (à l'entrée, avant insertion)

3 tests déterministes sur chaque action candidate :
1. **Vague** : commence par/contient un verbe mou (améliorer, optimiser, mettre en place un système, développer une stratégie, renforcer…) **sans** cible concrète (bien nommé, chiffre, %, €, endpoint connu : GA4/D1/GBP/Airbnb/Stripe/Beds24).
2. **Doublon** : forte similarité de mots-clés avec une action active existante → fusionnée (garde l'existante).
3. **Sous-spécifiée** : < 45 caractères.

**Sort des rejets : retry à l'agent.** Une action vague/courte déclenche **un seul** réessai avec consigne « sois concret : nomme le bien, chiffre la cible, cite l'endpoint ». Si le réessai échoue encore → loggé dans `llm_outputs` (audit) et non inséré. (Coût LLM acceptable car providers gratuits via AI-Ops.)

**Traçabilité** : chaque sortie (gardée ou rejetée) est écrite dans `llm_outputs` avec verdict fact-check → résout la douleur « confiance ».

## 6. Exécution autonome (`agents-execute`, cron hebdo)

Parcourt les actions `risk=auto` non traitées et appelle `agents-deliver` :
- action SEO meta → `meta-seo` → `agent_drafts` statut `drafted` (title/desc fact-checkés, prêts pour `functions/[slug].js`).
- action réseau → draft `social_post` (`channels=["ig","fb"]`) statut `drafted`.

**Aucune publication.** Le livrable attend dans la file. Garde-fou : si fact-check échoue → l'action repasse `review` au lieu d'être préparée.

## 7. Boucle de résultat & digest

- Validation review → publish → action `fait` + `agent_outcomes` (impact mesuré si dispo).
- Auto préparé → trace « préparé le {date} ».
- **Digest hebdo** (cron Worker, lundi) → email/ntfy :
  > 📊 Semaine : X drafts auto-préparés (prêts à publier) · Y à valider (€/légal) · Z publiées · note qualité moyenne.

C'est l'**unique point de contact** de Vincent. Lecture ~30 s, validation en 1 clic depuis l'admin.

## 8. Nettoyage rétroactif (one-shot)

Passer les **146 actions backlog existantes** au filtre `_triage.js` :
- vagues/doublons → statut `bloqué` + note « triage auto 31/05 : vague/doublon » (réversible, rien supprimé).
- les autres → reçoivent leur `risk`.

## 9. Plan de découpage (4 lots indépendants)

| Lot | Contenu | Risque | Valeur |
|---|---|---|---|
| **L1 — Triage** | `_triage.js` + colonne `risk` + branchement dans `agents-run` + retry agent + remplir `llm_outputs` + tests Vitest | Très faible | Backlog cesse de gonfler ; traçabilité |
| **L2 — Nettoyage rétroactif** | Script one-shot sur les 146 backlog | Faible (réversible) | Backlog propre |
| **L3 — Exécution auto** | `agents-execute` (cron) → drafts meta-SEO + réseaux | Moyen (pire cas = brouillon) | « Ça atterrit » |
| **L4 — Digest + file** | Cron digest hebdo + file « À valider » plafonnée (onglet Approbations) | Faible | « Quasi zéro » réel |

Ordre : L1 → L2 → L3 → L4. Chaque lot livrable/testable seul ; arrêt possible après n'importe lequel avec gain acquis.

## 10. Hors scope (YAGNI)

- Pas de ML de scoring (règles déterministes suffisent).
- Pas de refonte des 23 agents (fusion/suppression = sujet séparé).
- Pas de nouveau dashboard lourd (réutilise Approbations + agents-stats).
- Élargissement du niveau `auto` (modéré/large) = itération future, pas v1.

## 11. Tests & validation

- `_triage.js` : tests Vitest unitaires (vague/concret/doublon/court ; blocked/auto/review par cas). Cible : couvrir chaque branche de la grille.
- `agents-execute` : test que rien ne devient `published` automatiquement (invariant de sûreté).
- Smoke : déploiement via `npm run deploy:pages` (suite existante).
- Garde-fous mémoire respectés : aucun prix appliqué, aucune dépense, aucun envoi email auto, aucun publish auto.

## 12. Risques & mitigations

| Risque | Mitigation |
|---|---|
| LLM instable | Déjà géré par AI-Ops (bascule modèle) ; fact-check fail-open. |
| Faux négatif du filtre (bonne action rejetée) | Retry 1× ; rejets loggés dans `llm_outputs` (repêchables). |
| Mot-clé blocked manquant → action sensible passe auto | Défaut = review (pas auto) ; auto exige règle positive ; pire cas = brouillon non public. |
| Sur-blocage (tout en review) | Acceptable au démarrage prudent ; on élargit `auto` après observation. |
