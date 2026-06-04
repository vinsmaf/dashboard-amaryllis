# 🗺️ INDEX — Documentation & gouvernance Amaryllis Locations

> Carte d'indexation de toute la doc du projet (villamaryllis.com). But : retrouver n'importe quel document en 5 secondes.
> Liens relatifs depuis `docs/`. Pour les fichiers racine, le lien remonte d'un cran (`../`).

## Comment lire ce projet

Quatre points d'entrée racine à connaître :

- **[`../CLAUDE.md`](../CLAUDE.md)** — référence **architecture / technique** (stack, design system, conventions). À lire pour coder.
- **[`../PROJECT_MEMORY.md`](../PROJECT_MEMORY.md)** — **mémoire long terme** : état, décisions, secrets, crons, IDs, contraintes de Vincent, backlog. À tenir à jour à chaque session.
- **[`ERREURS-LOG.md`](ERREURS-LOG.md)** — journal des **erreurs déjà commises + garde-fous**. À lire au début de chaque session ; y ajouter une entrée à chaque nouvelle erreur.
- **[`superpowers/`](superpowers/)** — **décisions (specs/ADR) + plans** d'implémentation (10 specs + 10 plans). Voir section dédiée plus bas.

---

## Gouvernance / mémoire (racine)

| Fichier | Description |
| --- | --- |
| [`../CLAUDE.md`](../CLAUDE.md) | Guide technique de référence pour Claude Code (stack React 19 + Vite + Cloudflare Pages, design system, conventions). |
| [`../PROJECT_MEMORY.md`](../PROJECT_MEMORY.md) | Mémoire long terme : état, décisions, secrets, crons, Place IDs, agents IA + RAG, contraintes, backlog. |
| [`../CONTEXT.md`](../CONTEXT.md) | Handoff historique Claude.ai → Claude Code : contexte business, décisions techniques, roadmap initiale. |
| [`../README.md`](../README.md) | README technique générique du template React + Vite (peu spécifique au projet). |
| [`../handoff.md`](../handoff.md) | Handoff daté du 16/05/2026 : trois correctifs/features en cours (planification faite, implémentation en attente). |
| [`../canvas-philosophy.md`](../canvas-philosophy.md) | Philosophie de design « Cartographie de Flux » (mouvement esthétique du dashboard admin dark). |

## Gouvernance / mémoire (docs)

| Fichier | Description |
| --- | --- |
| [`ERREURS-LOG.md`](ERREURS-LOG.md) | Journal des erreurs & solutions (symptôme → cause → solution → garde-fou) + tentatives d'injection de prompt. |
| [`journal-2026-05-29.md`](journal-2026-05-29.md) | Journal de session du 29/05/2026 : tout ce qui a été livré/déployé (site + Apps Script + Worker). |
| [`RAPPORT_QA_2026-05-28.md`](RAPPORT_QA_2026-05-28.md) | Rapport QA automatisé du site public + admin (crawl Chrome réel, console, Vitest, santé API) nuit du 27→28 mai. |
| [`REFACTOR_2026.md`](REFACTOR_2026.md) | Refactor du monolithe `src/App.jsx` (10 597 lignes) en modules par onglet. |
| [`audit-coherence-2026-06-01.md`](audit-coherence-2026-06-01.md) | Audit de cohérence multi-agents (61 agents, 9 dimensions) : 37 incohérences confirmées, lecture seule. |
| [`backlog-agents-classification.md`](backlog-agents-classification.md) | Classification du backlog des agents (453 actions, source D1 `agent_actions`) par statut/catégorie/effort. |

## Stratégie

| Fichier | Description |
| --- | --- |
| [`strategie/plan-ceo-2026-06.md`](strategie/plan-ceo-2026-06.md) | Plan stratégique CEO sur 90 jours (juin→août 2026) basé sur les perfs réelles 2025 (occ/ADR/RevPAR/CA). |

## Marketing / Ads / SEO local

| Fichier | Description |
| --- | --- |
| [`marketing/00-SYNTHESE-campagnes-2026-06.md`](marketing/00-SYNTHESE-campagnes-2026-06.md) | Synthèse à lire en premier : vue d'ensemble Plan CEO + campagnes Ads + décisions à prendre. |
| [`marketing/RUNBOOK-lancement.md`](marketing/RUNBOOK-lancement.md) | Runbook copier-collable d'une page pour lancer Google Ads + Meta Ads (tes clics, pas de connexion compte). |
| [`marketing/campagne-google-ads-2026-06.md`](marketing/campagne-google-ads-2026-06.md) | Campagne Google Ads prête à lancer (juin 2026), copier-collable bloc par bloc. Remplace `google-ads-kit.md`. |
| [`marketing/campagne-meta-ads-2026-06.md`](marketing/campagne-meta-ads-2026-06.md) | Campagne Meta Ads (Facebook + Instagram) prête à lancer, complément découverte/désir de Google Ads. |
| [`marketing/gbp-optimisation-2026-06.md`](marketing/gbp-optimisation-2026-06.md) | Optimisation des 2 fiches Google Business Profile existantes (Villa + Résidence) pour SEO local + conversion. |
| [`marketing/gbp-posts-serie-2026.md`](marketing/gbp-posts-serie-2026.md) | Série de posts Google Business prêts à publier (cadence ~1/2 semaines, alternance Villa/Résidence). |
| [`marketing/netlinking-plan-2026.md`](marketing/netlinking-plan-2026.md) | Plan netlinking & partenariats white-hat pour bâtir l'autorité de domaine de villamaryllis.com. |
| [`marketing/seo-maillage-landings-2026-06.md`](marketing/seo-maillage-landings-2026-06.md) | Réveil SEO des 5 landings commerciales orphelines via métas + liens in-content + longue traîne. |
| [`google-ads-kit.md`](google-ads-kit.md) | Kit Google Ads initial (~400€ budget). Antérieur — remplacé par `marketing/campagne-google-ads-2026-06.md`. |
| [`google-business-profiles-kit.md`](google-business-profiles-kit.md) | Kit GBP initial : créer 2 fiches + optimiser 2 existantes (contenu prêt-à-coller). |

## SEO contenu

| Fichier | Description |
| --- | --- |
| [`seo/baseline-2026-06-02.md`](seo/baseline-2026-06-02.md) | Snapshot GA4 (30 j) avant le programme SEO « Hub & Spoke » — base de comparaison J+30 / J+60. |
| [`seo/off-page-citations-kit.md`](seo/off-page-citations-kit.md) | Kit citations off-page (NAP) : infos Name-Address-Phone canoniques à coller à l'identique pour SEO local. |
| [`guide-plages-sud-martinique-content.md`](guide-plages-sud-martinique-content.md) | Contenu rédigé du guide « Plus belles plages du Sud de la Martinique » (slug, title, méta, corps). |
| [`data/plan-tracking-roi.md`](data/plan-tracking-roi.md) | Plan tracking ROI par canal/bien (snippets prêts à coller, non déployés) avant lancement Ads. |

## CRM / service client

| Fichier | Description |
| --- | --- |
| [`crm/gestion-reclamations.md`](crm/gestion-reclamations.md) | Process opérationnel de gestion des réclamations voyageurs (transformer une plainte en fidélisation). |
| [`crm/sequence-reactivation.md`](crm/sequence-reactivation.md) | Séquence structurée de réactivation des anciens voyageurs à 6 et 12 mois (offre tarif ancien client). |
| [`crm/templates-reclamations.md`](crm/templates-reclamations.md) | Templates de réponse aux réclamations (ton chaleureux/`vous`), aussi intégrés dans l'admin. |
| [`email-reactivation.md`](email-reactivation.md) | Email de réactivation pour voyageurs inactifs ≥12 mois (code promo `RETOUR10`, −10% direct). |
| [`programme-fidelite.md`](programme-fidelite.md) | Programme fidélité « Amaryllis Club » (ROI estimé 35×, investissement 480 €/an). |
| [`sla-reponse.md`](sla-reponse.md) | SLA de réponse aux voyageurs (délais cibles par canal/situation). |
| [`calendrier-editorial-instagram.md`](calendrier-editorial-instagram.md) | Calendrier éditorial Instagram @amaryllis_villa (juin–août 2026, Martinique + Paris). |
| [`planning-editorial-30j.md`](planning-editorial-30j.md) | Planning éditorial 30 jours Facebook + Instagram (27 mai→25 juin), 30 posts sur 7 biens. |

## Légal / conformité

| Fichier | Description |
| --- | --- |
| [`legal/cgv-audit.md`](legal/cgv-audit.md) | Audit de la page CGV (`src/ConditionsGenerales.jsx`) avec recommandations + textes prêts à coller. |
| [`legal/checklist-declarations-meuble.md`](legal/checklist-declarations-meuble.md) | Checklist des déclarations/obligations par bien pour les 7 meublés de tourisme (Code du tourisme, loi Le Meur). |
| [`legal/contrat-PRET-A-REMPLIR.md`](legal/contrat-PRET-A-REMPLIR.md) | Contrat de location saisonnière prêt à remplir (dérivé du modèle, à faire valider par un pro). |
| [`legal/contrat-location-meuble-tourisme.md`](legal/contrat-location-meuble-tourisme.md) | Modèle/gabarit de contrat de location saisonnière meublé de tourisme (modèle, pas un avis d'avocat). |
| [`legal/plan-action-declarations.md`](legal/plan-action-declarations.md) | Plan d'action étape par étape pour déclarer les 7 meublés de tourisme. |
| [`legal/rgpd-check-formulaires.md`](legal/rgpd-check-formulaires.md) | Audit RGPD côté formulaires/collecte (ce que le code collecte réellement vs ce qui est affiché/manque). |
| [`compliance/meuble-tourisme-2026.md`](compliance/meuble-tourisme-2026.md) | Note de conformité 2026 : déclarations meublé, loi Le Meur, contrat type, RGPD. |
| [`compliance-rgpd-lemeur.md`](compliance-rgpd-lemeur.md) | Audit conformité RGPD & loi Le Meur (jur-012/jur-014) : statut corrigé/à appliquer. |
| [`registre-traitements-rgpd.md`](registre-traitements-rgpd.md) | Registre des traitements de données personnelles (RGPD art. 30), version de travail interne. |
| [`taxe-sejour-note.md`](taxe-sejour-note.md) | Note sur la taxe de séjour par commune (montants à confirmer auprès des autorités locales). |

## Revenue management

| Fichier | Description |
| --- | --- |
| [`pricing-basse-saison-reco.md`](pricing-basse-saison-reco.md) | Recommandations pricing basse saison (30 mai→28 juin), source RM live, reco non publiée. |
| [`revenue-mabouya-minstay-reco.md`](revenue-mabouya-minstay-reco.md) | Reco distribution & séjour minimum du Studio Mabouya (cibles à arbitrer, rien de modifié). |

## Opérations

| Fichier | Description |
| --- | --- |
| [`checklist-etat-des-lieux.md`](checklist-etat-des-lieux.md) | Checklist état des lieux terrain (mobile/papier) réutilisable sur les 7 logements. |
| [`alerte-reappro-consommables.md`](alerte-reappro-consommables.md) | Process d'alerte réapprovisionnement consommables (déclencheur WhatsApp, sans logiciel dédié). |

## Setup technique / runbooks

| Fichier | Description |
| --- | --- |
| [`cron-emails-setup.md`](cron-emails-setup.md) | Procédure pas-à-pas pour activer les emails voyageurs auto (pré-arrivée J-3, post-séjour J+1) via cron-job.org. |
| [`kv-cache-setup.md`](kv-cache-setup.md) | Setup du cache KV `AVAIL_CACHE` pour les disponibilités iCal/Beds24 (10 min, anti-timeout/double résa). |
| [`monitoring-setup.md`](monitoring-setup.md) | Setup monitoring : Sentry (erreurs front) + UptimeRobot (disponibilité). |
| [`rag-vectorize-setup.md`](rag-vectorize-setup.md) | Marche à suivre RAG Vectorize : ancrer les agents dans les vraies données (avis, guides) pour citer au lieu d'inventer. |
| [`stripe-webhook-setup.md`](stripe-webhook-setup.md) | Configuration du webhook Stripe (confirme la résa Beds24 dès paiement réussi). |
| [`runbook-rotation-tokens.md`](runbook-rotation-tokens.md) | Runbook de rotation des tokens critiques tous les 90 jours (rappel email auto via Worker). |

## Design / voix

| Fichier | Description |
| --- | --- |
| [`voice.md`](voice.md) | Bibliothèque de phrases types FR·EN pour le site et l'admin (formel `vous`, ponctuation française). |

## Décisions & plans (ADR)

Les décisions de conception et leurs plans d'implémentation vivent dans **[`superpowers/`](superpowers/)** :

- **[`superpowers/specs/`](superpowers/specs/)** — 10 specs de design (ADR : problème, options, décision). Ex. triage autonome des agents, SEO hub & spoke, biens source unique, checks de cohérence, occupation→RM.
- **[`superpowers/plans/`](superpowers/plans/)** — 10 plans d'implémentation correspondants (tâches T0…Tn, gates de test, déploiement).

Chaque plan est apparié à sa spec par date et slug (`YYYY-MM-DD-<sujet>.md` côté plans, `<…>-design.md` côté specs).
