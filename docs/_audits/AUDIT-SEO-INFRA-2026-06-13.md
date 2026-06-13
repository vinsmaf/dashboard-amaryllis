# Audit SEO Infra — villamaryllis.com — 2026-06-13

> Audit multi-agents (9 dimensions parallèles + synthèse, 10 agents, ~990k tokens).
> 3 findings P0 vérifiés manuellement (prix biens.js, hreflang runtime, robots.txt admin) = confirmés réels.
> ⚠️ P0-2 (prix) : divergence code/mémoire CONFIRMÉE mais le prix "correct" doit être tranché par Vincent.

## BILAN GLOBAL

| Dimension | Score | Statut |
|---|---|---|
| SEO technique — injection runtime | 5/10 | Prix divergents, titres trop longs, Cache-Control inadapté |
| Données structurées schema.org | 4/10 | LodgingBusiness vs VacationRental, prix incohérents, Iguana bookable |
| Crawlabilité | 6/10 | public/sitemap.xml obsolète, noindex dans sitemap, /guide-nogent orpheline |
| SEO Images | 5/10 | 2 bugs LCP P0, og:image:width/height non mis à jour, preload discordant |
| Maillage interne | 5/10 | BienCards non crawlables, 5 guides sans lien direct vers fiches |
| Web Performance / CWV | 5/10 | LCP home faux preload, Sentry statique, Google Fonts en double |
| SEO multilingue | 3/10 | Hreflang absent sur toutes les fiches, lang="fr" sur page EN |
| SEO on-page | 5/10 | H1 invisible côté serveur, hiérarchie incohérente mobile/desktop |
| Architecture de rendu | 6/10 | /admin indexable, /devis cassée, JSON-LD incohérent prerender vs runtime |

**Score global : 4.9/10 — A AMELIORER**

Justification : l'architecture est bien pensée (hybride SSG+SSR edge, source unique biens.js, MaillageCluster) mais 6 bugs P0 bloquants cassent des mécanismes entiers : les hreflang ne sont propagés sur aucune fiche, le JSON-LD est sous-optimal partout, les prix SERP sont faux pour 5 biens, et les preloads LCP sont mal câblés. Ces bugs annulent en grande partie le travail déjà fait.

---

## PROBLEMES CRITIQUES P0 (bloquants — priorité absolue)

### P0-1 — Hreflang absent sur toutes les fiches villas
**Impact :** Google ignore l'intégralité du dispositif hreflang. Signal bilingue FR/EN nul sur les 7 pages les plus importantes.
**Solution :** Dans `injectMeta` de `functions/[slug].js`, ajouter le remplacement des 3 balises `<link rel="alternate" hreflang="...">`. Pour les biens : fr=`/{slug}`, en=`/villa-rental-martinique`, x-default=`/`. Pour `/villa-rental-martinique` : fr=`/`, en=`/villa-rental-martinique` (self-ref), x-default=`/`.
**Fichier :** `functions/[slug].js`

### P0-2 — Prix divergents entre biens.js et tarifs réels
**Impact :** Google affiche "Dès 70€/nuit" pour Mabouya (réel : 110€). Taux de rebond élevé + risque pratique commerciale trompeuse.
**Divergences à corriger dans `src/data/biens.js` :**
- Zandoli : 110 → 220
- Géko : 110 → 150
- Mabouya : 70 → 110
- Schœlcher : 90 → 100
- Nogent : 90 → 85 (et aligner BIEN_EXTRA desc dans `functions/[slug].js`)

Après correction, regénérer les seoDesc pour qu'elles reflètent le bon prix.
**Fichiers :** `src/data/biens.js`, `functions/[slug].js` (BIEN_EXTRA)

### P0-3 — Preload LCP home pointe vers la mauvaise image
**Impact :** Le browser précharge `01.webp` inutilement, puis doit redécouvrir `02.webp` (hero réel). La ressource LCP n'est jamais préchargée → score LCP dégradé.
**Solution :** Dans `scripts/prerender.mjs`, aligner le preload sur `02.webp` pour la homepage OU refactoriser HeroBrand pour utiliser `<img fetchpriority="high">` au lieu d'un background CSS (les backgrounds ne profitent pas du preload scanner natif).
**Fichiers :** `scripts/prerender.mjs`, `src/PublicSite.jsx`

### P0-4 — /admin/* indexable sans noindex
**Impact :** Googlebot crawle /admin, l'indexe avec le titre de la homepage → contenu dupliqué dans l'index Google.
**Solution (double verrou) :**
1. `public/robots.txt` : ajouter `Disallow: /admin`
2. `src/App.jsx` : ajouter `<meta name="robots" content="noindex, nofollow">` dans le head de la vue admin

**Fichiers :** `public/robots.txt`, `src/App.jsx`

### P0-5 — H1 des fiches biens invisible côté serveur
**Impact :** Googlebot sans JS ne voit aucun H1 sur les 7 fiches les plus importantes. Hiérarchie H2 sur mobile. Signal sémantique manquant pour la requête principale.
**Solution :** Dans `functions/[slug].js`, via HTMLRewriter, injecter un `<h1>` visible dans le body avec le seoTitle du bien. Exemple : après `<div id="root">`, insérer `<h1 style="position:absolute;left:-9999px">${bien.seoTitle}</h1>` ou mieux, l'intégrer dans le bloc sr-only déjà présent dans le prerender.
**Fichiers :** `functions/[slug].js`, `scripts/prerender.mjs`

### P0-6 — Preload LCP manquant sur 5 fiches biens
**Impact :** geko, mabouya, schoelcher, nogent, iguana : le browser découvre l'image hero uniquement après hydratation React → LCP dégradé sur ces pages.
**Solution :** Dans `scripts/prerender.mjs`, passer `lcpPreload: true` sur les 5 entrées biens manquantes dans le tableau `ROUTES`.
**Fichier :** `scripts/prerender.mjs`

---

## CHANTIERS PRIORITAIRES P1 (impact fort, semaine 1)

### P1-1 — JSON-LD : LodgingBusiness → VacationRental dans `[slug].js`
VacationRental donne accès aux rich results Google Vacation Rentals (bouton Réserver). Aligner `functions/[slug].js` sur le même type que `prerender.mjs`. Ajouter en même temps : `checkinTime`, `checkoutTime`, `petsAllowed` (amaryllis + zandoli), `worstRating: "1"` dans AggregateRating, `BreadcrumbList`, tableau `ImageObject` avec les 8 photos.
**Fichier :** `functions/[slug].js`

### P1-2 — Iguana : corriger le priceRange dans le JSON-LD runtime
`bookable: false` mais le runtime injecte quand même `'À partir de 180€/nuit'`. Fix : `...(bien.bookable ? { priceRange: ... } : {})` dans `functions/[slug].js`. Idem pour l'ItemList de `index.html` : exclure Iguana ou ajouter une note.
**Fichiers :** `functions/[slug].js`, `index.html`

### P1-3 — Supprimer `public/sitemap.xml` statique obsolète
Risque concret : un deploy `SKIP_BUILD=1` sert le vieux sitemap 26 URLs à la place des 62 générées. Supprimer le fichier ou le passer en `.gitignore`. Vérifier en prod : `curl https://villamaryllis.com/sitemap.xml | grep '<loc>' | wc -l`.
**Fichier :** `public/sitemap.xml` (à supprimer)

### P1-4 — Filtrer les pages noindex du sitemap généré
`prerender.mjs` inclut `/mentions-legales` et `/politique-confidentialite` dans le sitemap malgré leur `noindex: true`. Ajouter un filtre `r.noindex !== true` dans la génération `sitemapEntries`.
**Fichier :** `scripts/prerender.mjs`

### P1-5 — Ajouter le prerender pour `/guide-nogent-sur-marne`
Page orpheline : active dans `main.jsx`, absente de `prerender.mjs` et de `[slug].js`. Googlebot reçoit la home meta. Ajouter une entrée dans `ROUTES[]` avec title/desc dédiés.
**Fichiers :** `scripts/prerender.mjs`

### P1-6 — Cache-Control : différencier biens (no-cache) vs guides (max-age=86400)
Appliquer `no-cache` uniquement aux 7 biens (D1 en temps réel). Pour les 21 guides statiques : `Cache-Control: public, max-age=3600, s-maxage=86400`. Réduction de la consommation Worker et amélioration TTFB.
**Fichier :** `functions/[slug].js`

### P1-7 — robots.txt : ajouter les Disallow manquants
```
Disallow: /admin
Disallow: /api/
Disallow: /bienvenue/
Disallow: /landing/
Disallow: /guide-menage
Disallow: /stories-template
```
**Fichier :** `public/robots.txt`

### P1-8 — Corriger les titres de guides trop longs dans `[slug].js`
3 slugs dépassent 60 caractères en prod (slug.js fait foi) :
- `/guide-sainte-anne` [88c] → raccourcir à ≤60c
- `/guide-proximite` [77c] → raccourcir
- `/activites-sainte-luce` [65c] → raccourcir de 5c

**Fichier :** `functions/[slug].js`

### P1-9 — Google Fonts : supprimer la double injection dans PublicSite.jsx
`index.html` charge déjà Jost + Cormorant Garamond. `PublicSite.jsx` réinjecte dynamiquement les mêmes. Supprimer l'injection JS (lignes 174-181).
**Fichier :** `src/PublicSite.jsx`

### P1-10 — Sentry : lazy-init pour sortir du chunk d'entrée
Sentry (~80 KB gzippé) est dans `index.js` (chunk d'entrée). Passer en `requestIdleCallback(() => import('@sentry/react').then(...))` ou via `manualChunks` dans `vite.config.js`.
**Fichiers :** `src/main.jsx`, `vite.config.js`

### P1-11 — Leaflet : retirer du modulepreload générique
Le modulepreload de Leaflet (164 KB) est injecté sur toutes les pages y compris FAQ, guides texte, CGV. Le supprimer du bloc générique dans `prerender.mjs` — Leaflet est déjà lazy-loaded, laisser le browser le découvrir à la demande.
**Fichier :** `scripts/prerender.mjs`

### P1-12 — `<html lang>` : passer à "en" pour `/villa-rental-martinique`
`index.html` est figé à `lang="fr"`. La page EN doit avoir `lang="en"`. Ajouter dans `injectMeta` / `patchHtml` un remplacement `<html lang="fr">` → `<html lang="en">` quand slug = `villa-rental-martinique`.
**Fichiers :** `functions/[slug].js`, `scripts/prerender.mjs`

### P1-13 — `addressCountry` : `MQ` pour les biens Martinique dans `[slug].js`
Ligne 339 : `'FR'` pour tous sans distinction. Fix : `isMartinique(bien) ? 'MQ' : 'FR'` (la fonction existe déjà dans `prerender.mjs`).
**Fichier :** `functions/[slug].js`

### P1-14 — CookieBanner et ChatWidget : passer en lazy imports
Dans `src/main.jsx`, les deux composants sont importés statiquement. Les passer en `lazy(() => import(...))` pour alléger le chunk d'entrée.
**Fichier :** `src/main.jsx`

### P1-15 — Supprimer `SearchAction` WebSite ou implémenter la page de résultats
`index.html` déclare `potentialAction.target = '/?q={search_term_string}'` mais aucune page de résultats n'existe. Google peut invalider l'ensemble du bloc WebSite. Retirer ce `potentialAction` jusqu'à implémentation réelle.
**Fichier :** `index.html`

---

## AMELIORATIONS P2 (impact moyen, semaine 2-4)

- **og:locale** : passer à `en_US` pour `/villa-rental-martinique` dans `injectMeta` + ajouter `og:locale:alternate en_US` sur les pages FR
- **og:image:width/height/alt** : injecter des valeurs par bien dans `[slug].js` (nogent = 1024×595, pas 1200×800)
- **BreadcrumbList** : ajouter dans le JSON-LD des fiches biens dans `[slug].js` (présent dans prerender mais absent du runtime)
- **petsAllowed** : propager dans le JSON-LD runtime (`functions/[slug].js`) pour amaryllis et zandoli
- **datePublished/dateModified** : ajouter sur les JSON-LD Article de tous les guides
- **FAQPage** sur `/faq` : injecter JSON-LD structuré dans `prerender.mjs`
- **Zandoli RENTAL_CONTENT** : corriger `pets: false` → `true` dans `prerender.mjs` (la FAQ confirme l'acceptation des animaux)
- **AggregateRating Organisation** dans `index.html` : soit dynamiser (pointer vers D1), soit supprimer le `ratingValue: 5` figé
- **GuideDiamant, GuideSainteAnne, GuideSainteLuce, GuideSeminaires, GuideProximite** : ajouter `<a href="/iguana">`, `<a href="/amaryllis">` etc. dans les CTA finaux + remplacer "Voir toutes nos villas" par des ancres contextuelles
- **Cluster diamant** dans `seoClusters.js` : ajouter Amaryllis et Zandoli (à 15-25 min du Diamant)
- **BienCards homepage** : wrapper dans `<a href="/{id}">` crawlable (ou au minimum enrichir les ancres du bloc sr-only avec description+prix)
- **`/guide` dans prerender** : ajouter une entrée ROUTE dédiée (actuellement dans SITEMAP_META mais pas dans ROUTES)
- **`/location-groupe-sainte-luce` et `/plus-belles-plages-sud-martinique`** : ajouter dans prerender.mjs ROUTES
- **`/devis`** : supprimer de KNOWN ou créer le composant associé (page cassée)
- **fetchpriority='high'** sur le hero mobile (PropertyDetail carousel)
- **alt** des images : popup Leaflet (chaîne HTML), miniature sticky header, thumbnails alt={id} → alt={bien.nom}
- **Priorités GUIDES_POI dans sitemap** : attribuer 0.80+ aux guides à fort volume (snorkeling tortues, randonnées, gastronomie)
- **Cache photos** : passer de 7 jours à 30 jours dans `public/_headers`
- **og:image** : discordance cdn-cgi/image (preload) vs variantes statiques (RImg runtime) — unifier la stratégie

---

## OPPORTUNITES P3 (long terme)

- **Pages EN par bien** : `/en/amaryllis`, `/en/zandoli`, etc. pour capter les marchés anglophones caribéens (UK, US, Barbade, Sainte-Lucie) — la traduction existe dans `i18n.jsx`, il manque les URLs et hreflang
- **`hreflang="fr-MQ"`** : cibler explicitement les Martiniquais résidents pour le Local SEO
- **hreflang dans le sitemap** : ajouter `xmlns:xhtml` + `<xhtml:link rel="alternate">` dans `prerender.mjs`
- **FAQPage par fiche bien** : extraire les Q/R "Infos pratiques" (check-in, animaux, caution) en JSON-LD structuré
- **numberOfBedrooms** : normaliser en `Number` (pas String) dans `prerender.mjs`
- **Format AVIF** : migrer RImg vers `cdn-cgi/image/format=auto` pour +20-30% compression + simplifier le pipeline (supprimer `gen-image-variants.mjs`)
- **og:image dédiée 1200×630** : variante crop social par bien
- **Split PublicSite.jsx** (367 KB) en sous-chunks home/fiche pour gains INP/TTI mobile
- **Guides POI sans données dynamiques** : envisager un mécanisme de refresh D1 rating (actuellement uniquement dans `[slug].js` pour les 7 biens)
- **`/seminaires`** : ajouter schema Service ou Event dans `prerender.mjs`
- **Schœlcher** : créer un cluster dédié et un guide géographique `/guide-schoelcher`

---

## ROADMAP STRUCTURÉE

### Chantier A — Correction des prix et signaux de confiance (Effort : 2h, Impact : fort)
Prix faux en SERP = problème de confiance critique + risque légal.
1. Corriger `src/data/biens.js` : 5 prix à aligner
2. Aligner `BIEN_EXTRA` dans `functions/[slug].js` (Nogent 85€)
3. Corriger RENTAL_CONTENT Zandoli `pets: false` → `true` dans `prerender.mjs`
4. Corriger priceRange Iguana conditionnel dans `[slug].js`

**Fichiers :** `src/data/biens.js`, `functions/[slug].js`, `scripts/prerender.mjs`

---

### Chantier B — Upgrade JSON-LD runtime (Effort : 4h, Impact : fort — rich snippets)
Un seul bloc de travail dans `functions/[slug].js` pour aligner tout le JSON-LD sur ce que Google attend :
- `@type: 'VacationRental'`
- `addressCountry: isMartinique ? 'MQ' : 'FR'`
- `image: tableau ImageObject` (8 photos)
- `checkinTime/checkoutTime` (récupérer RENTAL_CONTENT ou hard-coder par bien)
- `petsAllowed` conditionnel
- `worstRating: "1"` dans AggregateRating
- `BreadcrumbList` (Accueil > Nom du bien)
- `priceRange` conditionnel sur `bookable`
- Supprimer `SearchAction` de `index.html`

**Fichiers :** `functions/[slug].js`, `index.html`

---

### Chantier C — Hreflang + signaux langue (Effort : 3h, Impact : critique pour trafic EN)
Sans ce chantier, Google ignore complètement le dispositif bilingue.
1. `functions/[slug].js` : dans `injectMeta`, remplacer les 3 balises hreflang pour chaque slug
2. Pour `/villa-rental-martinique` : self-ref EN + fr=`/`
3. Passer `<html lang="en">` pour la page EN
4. `og:locale: en_US` pour `/villa-rental-martinique`
5. Ajouter `xmlns:xhtml` + `<xhtml:link>` dans le sitemap généré par `prerender.mjs`

**Fichiers :** `functions/[slug].js`, `scripts/prerender.mjs`, `index.html`

---

### Chantier D — LCP et Performance (Effort : 3h, Impact : fort sur CWV)
1. Aligner preload homepage sur `02.webp` (ou passer hero en `<img>`)
2. Activer `lcpPreload: true` sur 5 fiches manquantes dans `prerender.mjs`
3. Supprimer Leaflet du modulepreload générique
4. Lazy-init Sentry dans `main.jsx`
5. Lazy `CookieBanner` et `ChatWidget` dans `main.jsx`
6. Supprimer double injection Google Fonts dans `PublicSite.jsx`

**Fichiers :** `scripts/prerender.mjs`, `src/main.jsx`, `src/PublicSite.jsx`, `vite.config.js`

---

### Chantier E — Crawlabilité et maillage (Effort : 3h, Impact : moyen-fort)
1. Supprimer `public/sitemap.xml` statique
2. Filtrer `noindex` du sitemap dans `prerender.mjs`
3. Ajouter `/guide-nogent-sur-marne` dans `prerender.mjs` ROUTES
4. `robots.txt` : Disallow /admin, /api/, /bienvenue/, /landing/
5. `App.jsx` : noindex sur la vue admin
6. Titres guides trop longs : 3 corrections dans `[slug].js`
7. Guides sans lien direct : ajouter `<a href="/amaryllis">` dans GuideSeminaires, GuideDiamant → `/iguana`

**Fichiers :** `public/sitemap.xml` (supprimer), `scripts/prerender.mjs`, `public/robots.txt`, `src/App.jsx`, `functions/[slug].js`, `src/GuideSeminaires.jsx`, `src/GuideDiamant.jsx`

---

## POINTS FORTS (à ne pas casser)

- **Source unique `src/data/biens.js`** : architecture correcte, consommée par les 3 runtimes (Functions, prerender, front). Ne pas réintroduire de valeurs en dur ailleurs.
- **AggregateRating dynamique depuis D1** avec fallback — les avis réels en temps réel dans le JSON-LD est excellent.
- **Architecture hybride SSG + SSR edge + corps SEO dans #root** : Googlebot voit du contenu sans JS. Ne pas casser ce filet.
- **MaillageCluster** sur 12/18 guides avec liens `<a href>` réels et ancres avec prix : bien conçu.
- **Code splitting Vite** : recharts, leaflet, PublicSite en chunks séparés — garder cette configuration.
- **Scripts tiers consent-gated** : Meta Pixel jamais chargé sans consentement, GA4 async, Stripe defer.
- **WebP natif + srcset via RImg** sur toutes les photos de bien.
- **FAQPage JSON-LD** sur toutes les fiches biens et nombreux guides : base solide pour les rich snippets.
- **Cache assets immutable** : hash Vite + `max-age=31536000` — correct, ne pas toucher.
- **seoTitle des 7 biens** : tous dans 47-57c, différenciés, avec lieu + atout unique.