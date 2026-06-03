# Design — Source unique des biens (phase 3 : bloc JSON-LD index.html)

**Date :** 2026-06-03 · **Suite de :** phases 1 & 2 livrées.
**Décision Vincent :** générer le bloc depuis le canonique + supprimer le bloc statique.

## 0. Problème
`index.html` (`<head>`, ~l.50-60, tag `traf-010`) contient un `<script application/ld+json>` avec un `@graph` de **7 VacationRental codés en dur** — 4ᵉ source non migrée, servie sur TOUTES les pages (structured-data principal vu par Google). **Données fausses** : iguana 4,75/**42** (réel 4), nogent **4,95/42** (réel 4,8/18), coords obsolètes (phase-1), « Schoelcher » sans ligature œ, postal/region figés.

## 1. Solution
- **Supprimer** le bloc statique de `index.html`, le remplacer par un marqueur `<!--SEO_RENTALS_GRAPH-->`.
- **`scripts/prerender.mjs`** : nouvelle fonction `buildRentalsGraph()` qui génère le `<script>` `@graph[7]` depuis :
  - **Faits ← canonique** (`src/data/biens.js`) : `name` (nom canonique), `url`, `geo` (coords réelles), `occupancy.maxValue` (capacite), `numberOfRooms` (chambres), `aggregateRating` (rating/reviews **réels**), `address` (locality=lieu, region/postal/country dérivés — corrige Schœlcher 97233 + ligature), `description` (seoDesc).
  - **Contenu SEO local** (carte `RENTAL_CONTENT` dans prerender, n'existe que là, ne drift pas) : `amenityFeature[]`, `checkinTime`/`checkoutTime`, `petsAllowed`.
  - Injecter via `html.replace("<!--SEO_RENTALS_GRAPH-->", RENTALS_GRAPH)` dans `patchHtml` (calcul une fois, réutilisé pour toutes les routes ; comme `TMPL` est la base de toutes les pages, le marqueur est remplacé partout, y c. `dist/index.html` homepage = fallback SPA).

## 2. Garde-fous
- **Plus aucune note inventée** : reviews/rating viennent du canonique (iguana 4 avis, nogent 18). 
- Ligature œ (Schœlcher) + postal 97233 corrects.
- Le 2ᵉ bloc `ld-main` (Organization + ItemList) : corriger juste les `name` de l'ItemList si incohérents (Schœlcher ligature) — sinon laissé (pas de faits sensibles).
- Build vert ; vérif `dist` : 7 VacationRental générés, iguana reviewCount=4, nogent 4.8/18, schoelcher Schœlcher/97233. Curl live après deploy.
- Déploiement `npm run deploy:pages` uniquement.

## 3. Critère d'acceptation
`index.html` n'a plus de faits biens en dur (marqueur) ; le bloc est généré par prerender depuis le canonique ; aucune note/avis inventé en prod ; ajouter un bien = 1 entrée canonique (+ amenityFeature dans RENTAL_CONTENT). Plus AUCUNE des 4 sources (functions/[slug].js, prerender per-bien, _biens.js, PublicSite, index.html) ne code les faits en dur — tout vient de `src/data/biens.js`.
