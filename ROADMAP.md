# Roadmap — Amaryllis / locatif-dashboard
*Mise à jour : 30 juin 2026 · Format : Now / Next / Later*

---

## Now — engagé, en cours

| Initiative | Priorité | Statut | Note |
|---|---|---|---|
| Revenue Manager — snapshots occupation daily (Worker cron) | P0 | On track | `runOccupancySnapshot`, D1 `rm_kpi_snapshots` en place |
| Bug triage automatisé + visual review au déploiement | P0 | On track | `bug-triage.js` + Playwright crawl post-deploy |
| Calendrier éditorial — auto-publish FB + IG | P1 | On track | Worker cron horaire, statut `approved` → publication |
| Fix SEO double-source (`functions/[slug].js` écrase le prerender) | P1 | On track | Documenté CLAUDE.md §Footgun #1 |
| Tracking conversion 2× — valeur totale (pas acompte) | P1 | On track | Invariant documenté, `stripe-webhook.js` |
| Tests vitest ~148 — maintien couverture au déploiement | P1 | On track | Gate bloquant dans `deploy-pages.sh` |

---

## Next — planifié, pas encore démarré

| Initiative | Priorité | Impact | Note |
|---|---|---|---|
| **Réservations directes : améliorer la conversion** | P0 | Haut | Réduire dépendance Airbnb/Booking → marge +15-25 %. Tunnel direct à optimiser (abandon cart déjà suivi) |
| **RM v2 : pricing autonome avec approbation 1-clic** | P0 | Haut | Aujourd'hui advisory-only. Prochaine étape : Vincent valide en 1 clic depuis l'admin |
| A/B testing — extension (hero images, prix affichés, urgence) | P1 | Moyen | Infra en place (`abTest.js`). Tests actifs : `cta_label`, `hero_amaryllis`. Étendre |
| RAG — enrichissement base de connaissances | P1 | Moyen | Avis, guides, FAQ. Améliore chatbot public + agents |
| Analytics admin — intégrer GA4 dans dashboard admin | P2 | Moyen | API GA4 connectée (`/api/analytics`), pas encore exposée dans l'UI admin |
| Rotation tokens automatisée | P1 | Haut | `META_PAGE_TOKEN` expire ~60j. Runbook existe, automatiser les rappels |
| Séquences email voyageurs — A/B + personnalisation par marché | P2 | Moyen | Templates existants, enrichir par segment (Martinique vs Nogent) |

---

## Later — stratégique, horizon 6+ mois

| Initiative | Horizon | Note |
|---|---|---|
| RM autonome — publication prix sans validation manuelle | 6-9 mois | Nécessite confiance élevée dans les modèles |
| Programme fidélité / retour voyageur | 6-9 mois | Identifier récurrents, offres de retour |
| Scraping concurrents en temps réel (Apify) | 6-9 mois | `rm-scrape.js` existe, automatiser + alerter sur écarts |
| Extension nouveaux biens ou nouveaux marchés | 9-12 mois | Architecture multi-biens déjà prête |
| Iguana (bail long) → conversion locatif saisonnier ? | À qualifier | Actuellement `bookable: false` |

---

## Top priorités immédiates

1. **Améliorer la conversion réservations directes** — chaque résa directe = +15-25 % de marge
2. **RM v2 pricing 1-clic** — la valeur du Revenue Manager reste sous-exploitée en advisory-only
3. **Extension A/B testing** — l'infra est prête, les tests manquent
