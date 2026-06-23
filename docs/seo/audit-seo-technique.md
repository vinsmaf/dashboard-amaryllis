# Audit SEO technique — villamaryllis.com
> Agent seo-001 · 2026-06-23 · Advisory — à consulter avant toute action SEO

## 1. Meta & structured data

### ✅ En place
- `functions/[slug].js` injecte title/desc via HTMLRewriter sur chaque fiche bien (autorité réelle)
- JSON-LD `VacationRental` + `@graph` sur chaque fiche via `scripts/prerender.mjs`
- `sitemap.xml` généré au build (script prerender)
- Canonical self-referencing sur chaque page
- Open Graph + Twitter Card sur les fiches

### ⚠️ Points d'amélioration
- **Schœlcher et Nogent** : pas de Place ID Google vérifié → lien avis `default` (Amaryllis)
- **Guides** (20+ pages) : meta description générée mais non auditée ligne par ligne — certains dépassent 158c
- **FAQ page** : pas de schema `FAQPage` JSON-LD → opportunité rich snippet Google
- **Home `/`** : pas de schema `LocalBusiness` → à ajouter

### Règle critique à ne pas oublier
> Modifier title/desc d'une fiche bien = toujours dans `functions/[slug].js` (objet SEO).
> `prerender.mjs` est écrasé à chaque requête CF par le HTMLRewriter.

---

## 2. Performance & Core Web Vitals

### ✅ En place
- Images en `.webp` (format optimal)
- Lazy loading sur toutes les images sauf hero
- CDN Cloudflare avec cache auto
- Build Vite avec code splitting (lazy imports par composant)

### ⚠️ Points d'amélioration
- **LCP** : le hero Amaryllis (photo 01.webp) est en `loading="lazy"` → devrait être `eager` + `fetchpriority="high"`
- **CLS** : vérifier width/height explicites sur toutes les images du filmstrip
- **INP** : le composant PublicSite.jsx (~9 000 lignes) pourrait bénéficier d'un découpage plus fin
- **Bundle size** : react-leaflet chargé sur toutes les fiches même sans carte visible → lazy load conditionnel

---

## 3. Maillage interne

### ✅ En place
- Footer avec liens vers tous les biens
- Guides inter-liés (guides locaux → fiches biens)
- Breadcrumb structuré sur les guides

### ⚠️ Points d'amélioration
- **Hub → spokes** : `/guide-hub` existe mais peu lié depuis la home
- **Fiches biens → guides** : chaque fiche devrait pointer vers les 2-3 guides les plus proches (ex: Amaryllis → guide Sainte-Luce)
- **Pages orphelines** : vérifier `/nos-partenaires`, `/seminaires` (peu de liens entrants)

---

## 4. Contenu & longue traîne

### Mots-clés cibles prioritaires (volume + intention)
| Mot-clé | Volume est. | Page cible | Statut |
|---|---|---|---|
| villa avec piscine Martinique | fort | `/location-villa-martinique-piscine` | ✅ page dédiée |
| location Sainte-Luce Martinique | moyen | `/amaryllis` + home | ✅ |
| location groupe Martinique | moyen | `/location-groupe-sainte-luce` | ✅ |
| appartement Nogent-sur-Marne | moyen | `/nogent` | ✅ |
| villa Martinique pas cher | fort | manque landing dédiée | ❌ |
| studio Martinique bord de mer | moyen | → Mabouya / Géko | ❌ pas de page dédiée |
| location Schœlcher Martinique | faible | `/schoelcher` | ✅ |

---

## 5. Actions prioritaires (par ROI)

1. **[QUICK WIN]** Ajouter schema `FAQPage` JSON-LD à `/faq` → rich snippet Google
2. **[QUICK WIN]** Hero image `loading="eager" fetchpriority="high"` → LCP -0.5s
3. **[MOYEN]** Page `/studio-martinique-pas-cher` (Mabouya + Géko) → longue traîne
4. **[MOYEN]** Maillage fiches biens → guides locaux (2 liens par fiche)
5. **[LONG]** Schema `LocalBusiness` sur la home
