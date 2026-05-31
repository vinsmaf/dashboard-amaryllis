# 🗂️ Classification du backlog des agents — Amaryllis Locations

> Généré le 2026-05-31. Source : `/api/agents-actions` (table D1 `agent_actions`).
> **Total : 453 actions** — 275 faites, 178 actives.
> Backlog **normalisé** : 0 id null, 0 catégorie/effort/priorité non-standard.

## 1. Par statut

| Statut | Nb |
|---|---|
| fait | 275 |
| backlog | 146 |
| a-planifier | 31 |
| bloqué | 1 |

## 2. Par catégorie (toutes)

| Catégorie | Nb |
|---|---|
| content | 71 |
| seo | 62 |
| ux | 42 |
| business | 42 |
| performance | 35 |
| conversion | 31 |
| tracking | 29 |
| ops | 26 |
| securite | 23 |
| crm | 21 |
| legal | 18 |
| technique | 14 |
| ads | 9 |
| growth | 5 |
| bug | 5 |
| veille | 5 |
| research | 5 |
| test | 5 |
| feature | 2 |
| doc | 2 |
| strategie | 1 |

## 3. Par agent (actives)

| Agent | Nb |
|---|---|
| Photographe DA | 21 |
| Community Manager | 19 |
| Resp. Logistique | 16 |
| SEO Content Writer | 15 |
| Data Analyst | 12 |
| Revenue Manager | 12 |
| Architecte Réseau | 11 |
| Juriste Compliance | 9 |
| CRM Manager | 7 |
| Dév. Multimédia | 7 |
| Traffic Manager | 7 |
| SEO Local | 5 |
| Veille Conc. | 5 |
| Voy. Research | 5 |
| Webdesigner | 5 |
| Commercial / Pub | 4 |
| Chef Produit Web | 3 |
| Prompt Eng. | 3 |
| Webmaster | 2 |
| Growth / A/B | 2 |
| Consultant e-biz | 2 |
| QA Tester | 2 |
| Service Client | 2 |
| e-Business | 1 |
| Juriste | 1 |

## 4. Par priorité (actives)

| Priorité | Nb |
|---|---|
| moyenne | 82 |
| haute | 63 |
| basse | 24 |
| critique | 9 |

## 5. Par effort (actives)

| Effort | Nb |
|---|---|
| 2h | 61 |
| 4h | 51 |
| 1h | 33 |
| 3h | 11 |
| ext | 9 |
| 8h | 6 |
| 30min | 3 |
| 6h | 2 |
| 12h | 1 |
| 10h | 1 |

## 6. Matrice priorité × effort (actives)

| Effort \ Priorité | critique | haute | moyenne | basse | Total |
|---|---|---|---|---|---|
| **Quick (≤1h)** | 1 | 5 | 23 | 7 | 36 |
| **Moyen (2-4h)** | 6 | 45 | 55 | 17 | 123 |
| **Lourd (6-12h)** | 1 | 8 | 1 | 0 | 10 |
| **Externe/?** | 1 | 5 | 3 | 0 | 9 |
| **Total** | 9 | 63 | 82 | 24 | 178 |

## 7. Quick wins prioritaires (haute/critique + ≤1h, actives)

_6 actions_

- `log-023` **critique** · 1h · securite — Mettre en place un système de sauvegarde des données de maintenance et de ménage
- `growth-002` **haute** · 30min · growth — A/B test prix psychologique : 179€ vs 180€ sur fiches villas (hypothèse +5% conv)
- `data-049` **haute** · 1h · tracking — Enrichir les événements GA4 de l’app avec ID bien et niveau tarifaire pour analyser ROI par can
- `jur-012` **haute** · 1h · legal — Vérifier la conformité des formulaires avec le RGPD et la Loi Informatique et Libertés
- `log-032` **haute** · 1h · tracking — Créer template photo standardisé pour contrôle qualité (5 angles)
- `rev-026` **haute** · 1h · tracking — Mettre en place un système de suivi des prix des concurrents pour ajuster les prix de la platef

## 8. Actions critiques (actives)

- `log-023` · 1h · securite — Mettre en place un système de sauvegarde des données de maintenance et de ménage
- `crm-020` · 2h · crm — Mettre en place un système de gestion des réclamations pour améliorer la satisfaction client
- `jur-101` · 2h · legal — Vérifier et mettre à jour les déclarations de meublé tourisme pour chaque propriété en Martinique et
- `web-014` · 2h · business — Configurer les notifications pour les réservations et les paiements en temps réel
- `veille-001` · 3h · veille — Identifier 20 concurrents directs MQ (Sainte-Luce + Trois-Îlets) + 10 Nogent — stocker D1 rm_competi
- `voyageur-001` · 3h · research — Extraire et stocker en D1 tous les avis Airbnb des 7 biens (~150 avis) dans table voyageur_feedback
- `log-007` · 4h · securite — Mettre en place un système de suivi des interventions de maintenance avec photos et vidéos pour chaq
- `local-001` · 6h · seo — Créer/optimiser 7 fiches Google Business Profile (1 par bien) avec NAP cohérent + 30 photos chacune
- `photo-001` · ext · business — Shooting photo nuit jacuzzi Mabouya (argument commercial principal — aucune photo de nuit)

## 9. Normalisation effectuée (2026-05-31)

- `secirute` → `securite` (typo) · `conformite` → `legal` · `expe` → `growth` · `prompt` → `technique` · `Acquisition payante` → `ads`
- Efforts `ext pour externe` / `ext (2 jours)` → `ext` · `M` → `4h`
- Ligne à `id` NULL (Évaluer Meta/Facebook Ads) → `traf-020` (corrigé en D1)
- API PATCH `/api/agents-actions` étendue pour accepter `category` et `effort`
