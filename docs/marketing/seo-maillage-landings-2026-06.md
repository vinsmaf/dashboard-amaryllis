# SEO — Réveil des 5 landings commerciales orphelines (2026-06)

> Objectif : sortir de l'orphelinat SEO les 5 pages transactionnelles (0 visite organique), sans budget Ads.
> Levier = (A) métas affûtées + (B) **liens contextuels in-content** depuis les pages déjà crawlées (fiches + guides) + (C) quick wins on-page + (D) ciblage longue traîne.
>
> ⚠️ **Double source des métas** (cf. CLAUDE.md §1) :
> - `prerender.mjs` (`ROUTES`) = baseline crawler, écrit `dist/<slug>.html` au build.
> - `functions/[slug].js` = injection runtime, **fait foi** UNIQUEMENT pour les slugs interceptés.
> - Slugs landing interceptés par `functions/[slug].js` → **`location-groupe-sainte-luce`** (objet `GROUP_STAY`) et **`location-appartement-vue-mer-schoelcher`** (objet `SCHOELCHER_APPART`). Pour ces 2-là : éditer les **DEUX** fichiers.
> - Les 3 autres (`sainte-luce-martinique`, `location-villa-martinique-piscine`, `reservation-directe-martinique`) **ne sont PAS interceptés** → éditer **uniquement `prerender.mjs`**.
> - Vérif live après déploiement : `curl -s https://villamaryllis.com/<slug> | grep -oE "<title>[^<]*</title>"`.

---

## A. Audit méta — page par page

### 1. `/sainte-luce-martinique` — **GARDER tel quel**
- T actuel (57c) : `Location villa Sainte-Luce Martinique — piscine & vue mer`
- D actuel (148c) : `Louez une villa à Sainte-Luce, Martinique : piscine privée, vue mer, dès 110€/nuit en direct sans frais. Plages, activités et conseils de vos hôtes.`
- **Verdict** : déjà optimale. Mot-clé exact « location villa Sainte-Luce Martinique » en tête, USP prix + direct, intention transactionnelle claire. Ne rien toucher.
- Source à éditer si jamais : `prerender.mjs` uniquement (non intercepté).

### 2. `/location-villa-martinique-piscine` — **AMÉLIORER**
- T actuel (47c) : `Location Villa Martinique avec Piscine | Amaryllis`
- D actuel : OK mais le « | Amaryllis » + casse Title Case gaspillent des pixels SERP et n'apportent rien sur une requête générique.
- **Nouveau T (54c)** : `Location villa Martinique avec piscine — dès 110€/nuit`
- **Nouvelle D (142c)** : `Villa avec piscine privée en Martinique à Sainte-Luce : débordement eau salée, cascade ou jacuzzi. Dès 110€/nuit en direct, sans frais Airbnb.`
- **Justification** : mot-clé principal « location villa Martinique avec piscine » conservé en tête, ajout du déclencheur de clic prix (`dès 110€`) qui manquait au title ; retrait du branding inutile sur une requête non-marque ; casse normalisée (Google peut pénaliser le sur-Title-Case perçu comme spam).
- Source à éditer : `prerender.mjs` uniquement (non intercepté).

### 3. `/location-appartement-vue-mer-schoelcher` — **AMÉLIORER (les 2 sources)**
- T actuel (53c) : `Location appartement vue mer Schœlcher — Martinique`
- **Nouveau T (54c)** : `Location appartement vue mer Schœlcher — dès 100€/nuit`
- **Nouvelle D (155c)** : `Appartement vue mer à Schœlcher, Martinique : panorama sur la baie de Fort-de-France, dernier étage, 2 pers. Réservation directe dès 100€/nuit, sans frais.`
- **Justification** : on remplace « — Martinique » (redondant, déjà dans l'URL et la D) par le prix d'appel `dès 100€/nuit`, plus motivant au clic. D recentrée sur le bénéfice concret (panorama baie FDF) + signal transactionnel prix/direct.
- ⚠️ **DOUBLE SOURCE** : éditer `functions/[slug].js` (objet `SCHOELCHER_APPART`, **fait foi**) **ET** `prerender.mjs` (route `/location-appartement-vue-mer-schoelcher`, cohérence crawler).

### 4. `/location-groupe-sainte-luce` — **AMÉLIORER (les 2 sources)**
- T prerender actuel (74c — **TROP LONG, tronqué en SERP**) : `Location grand groupe Martinique — jusqu'à 11 personnes, Sainte-Luce`
- T `[slug].js` actuel (57c) : `Location grand groupe Martinique — 11 pers, Sainte-Luce` (déjà OK mais on cible mieux)
- **Nouveau T (59c)** : `Location grande capacité Martinique — 11 pers., Sainte-Luce`
- **Nouvelle D (143c)** : `Louez 3 logements ensemble à Sainte-Luce (Zandoli, Géko, Mabouya) : jusqu'à 11 personnes, piscines privées, en direct sans frais. Devis rapide.`
- **Justification** : le title prerender dépasse 60c (tronqué) → à aligner. « grande capacité » capte une longue traîne complémentaire à « grand groupe » sans perdre le « 11 pers. ». D nettoyée (nomenclature : ce sont des **logements**, pas des villas — Zandoli/Géko/Mabouya ≠ villa).
- ⚠️ **DOUBLE SOURCE** : éditer `functions/[slug].js` (objet `GROUP_STAY`, **fait foi**) **ET** `prerender.mjs` (route `/location-groupe-sainte-luce`).

### 5. `/reservation-directe-martinique` — **AMÉLIORER la D seulement**
- T actuel (55c) : `Réservation directe Martinique — Sans frais | Amaryllis` → **GARDER** (marque pertinente ici, requête semi-marque).
- D actuelle : `…Économisez 12–18%…` — le « 12–18% » est moins percutant qu'un chiffre rond et l'USP « contact hôte » manque.
- **Nouvelle D (146c)** : `Réservez vos villas en Martinique en direct, sans frais Airbnb ni Booking : −15% en moyenne, contact hôte, paiement Stripe sécurisé. Dès 85€/nuit.`
- **Justification** : `−15% en moyenne` (cf. USP officielle ~15%) + ajout « contact hôte » (réassurance) + prix plancher `dès 85€` (déclencheur). Title inchangé.
- Source à éditer : `prerender.mjs` uniquement (non intercepté).

---

## B. Plan de maillage interne contextuel

Principe : **liens IN-CONTENT** (dans une phrase, pas seulement le footer/nav déjà présents) depuis les pages crawlées vers les landings orphelines. Le footer maillage (`PublicSite.jsx` ~L6774-6800) et la nav prerender (`NAV_LANDINGS`) existent déjà → ne PAS les recompter ; ici on ajoute des liens **éditoriaux** à forte valeur de crawl + de pertinence sémantique.

| # | Page source (crawlée) | → Landing cible | Texte d'ancre exact | Où l'insérer (fichier + repère) |
|---|---|---|---|---|
| 1 | `/amaryllis` (fiche) | `/location-villa-martinique-piscine` | `villa avec piscine en Martinique` | `PublicSite.jsx`, après le bloc Amenities (~L4046), phrase contextuelle par bien (voir snippet ci-dessous) |
| 2 | `/iguana` (fiche) | `/location-villa-martinique-piscine` | `nos villas avec piscine à Sainte-Luce` | idem snippet par bien |
| 3 | `/geko` (fiche) | `/location-groupe-sainte-luce` | `réserver Géko, Zandoli et Mabouya ensemble` | idem snippet par bien |
| 4 | `/zandoli` (fiche) | `/location-groupe-sainte-luce` | `location pour un grand groupe à Sainte-Luce` | idem snippet par bien |
| 5 | `/mabouya` (fiche) | `/location-groupe-sainte-luce` | `combiner 3 logements jusqu'à 11 personnes` | idem snippet par bien |
| 6 | `/schoelcher` (fiche) | `/location-appartement-vue-mer-schoelcher` | `appartement vue mer à Schœlcher` | idem snippet par bien |
| 7 | `/zandoli`,`/geko`,`/mabouya`,`/amaryllis`,`/iguana` (fiches) | `/sainte-luce-martinique` | `séjourner à Sainte-Luce` | idem snippet par bien (2ᵉ lien de la phrase) |
| 8 | Toutes fiches (bloc paiement) | `/reservation-directe-martinique` | `réservation directe sans frais` | `PublicSite.jsx` widget réservation (~L2371, près du texte « En réservant… ») |
| 9 | `/sainte-luce-martinique` (`GuideSainteLuce.jsx`) | `/location-villa-martinique-piscine` | `villas avec piscine privée` | section « 6 villas à Sainte-Luce » (~L264) |
| 10 | `/sainte-luce-martinique` | `/location-groupe-sainte-luce` | `location pour un groupe` | même section hébergements |
| 11 | `/activites-sainte-luce` (`GuideActivites.jsx`, intercepté `[slug].js`) | `/location-villa-martinique-piscine` | `villa avec piscine à Sainte-Luce` | bloc de clôture « réservez en direct » (le CTA fiches existe déjà ~L8365 — ajouter la landing) |
| 12 | `/plus-belles-plages-sud-martinique` (`PublicSite.jsx` ~L8319) | `/sainte-luce-martinique` | `louer une villa à Sainte-Luce` | déjà un lien `Séjourner à Sainte-Luce` dans relatedLinks L8313 — **OK, garder**, ajouter ancre prose |
| 13 | `/meilleure-saison-martinique` (`GuideMeilleureSaison.jsx`) | `/reservation-directe-martinique` | `réservez en direct sans frais` | section CTA de fin |
| 14 | `/guide-le-diamant` (intercepté) | `/sainte-luce-martinique` | `nos locations à Sainte-Luce` | bloc « depuis Sainte-Luce » du guide |
| 15 | `/guide-sainte-anne` (intercepté) | `/sainte-luce-martinique` | `villa à Sainte-Luce, à 20 min des Salines` | intro/CTA du guide |
| 16 | `/seminaires` (`GuideSeminaires.jsx`) | `/location-groupe-sainte-luce` | `louer plusieurs logements ensemble` | section hébergement du groupe |

**Bilan liens entrants in-content par landing (hors footer/nav existants) :**
- `/location-villa-martinique-piscine` : #1, #2, #9, #11 → **4**
- `/location-groupe-sainte-luce` : #3, #4, #5, #10, #16 → **5** (en réduire à 4 si besoin : garder #3,#4,#5,#16)
- `/sainte-luce-martinique` : #7, #12, #14, #15 → **4**
- `/location-appartement-vue-mer-schoelcher` : #6 (+ footer + le bloc dédié `/schoelcher` qui pointe déjà vers la fiche) → **renforcer** : ajouter un 2ᵉ lien depuis `/guide-trois-ilets` ancre `appartement vue baie de Fort-de-France` (la baie est face aux Trois-Îlets). → **2**
- `/reservation-directe-martinique` : #8, #13 → **2** (suffisant, page semi-marque ; le footer la porte déjà partout).

### Snippet d'implémentation — lien contextuel par fiche (PublicSite.jsx)

À insérer **juste après le bloc Amenities** (après la fermeture `</div>` de L4046), avant les Tarifs. Map par `bien.id` pour respecter la nomenclature (villa ≠ logement) :

```jsx
{/* ── Lien contextuel SEO in-content (dé-orpheline les landings) ── */}
{(() => {
  const CTX = {
    amaryllis: <>Amaryllis fait partie de nos <a href="/location-villa-martinique-piscine">villas avec piscine en Martinique</a> ; idéale aussi pour <a href="/sainte-luce-martinique">séjourner à Sainte-Luce</a>.</>,
    iguana:    <>Découvrez toutes <a href="/location-villa-martinique-piscine">nos villas avec piscine à Sainte-Luce</a>, ou <a href="/sainte-luce-martinique">séjourner à Sainte-Luce</a> côté sud.</>,
    geko:      <>Géko peut se <a href="/location-groupe-sainte-luce">réserver avec Zandoli et Mabouya ensemble</a> pour un grand groupe, à <a href="/sainte-luce-martinique">Sainte-Luce</a>.</>,
    zandoli:   <>Pour une <a href="/location-groupe-sainte-luce">location pour un grand groupe à Sainte-Luce</a>, combinez Zandoli avec Géko et Mabouya. Tout savoir sur <a href="/sainte-luce-martinique">Sainte-Luce</a>.</>,
    mabouya:   <>Mabouya se <a href="/location-groupe-sainte-luce">combine avec 2 logements jusqu'à 11 personnes</a> ; à <a href="/sainte-luce-martinique">Sainte-Luce</a>, plages à 5 min.</>,
    schoelcher:<>En savoir plus sur cet <a href="/location-appartement-vue-mer-schoelcher">appartement vue mer à Schœlcher</a>.</>,
  }[bien.id];
  return CTX ? (
    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: 15, color: MUTED, margin: "0 0 32px", lineHeight: 1.6 }}>
      {CTX}
    </p>
  ) : null;
})()}
```
> Styler les `<a>` en `color: CORAL` si besoin via CSS global, ou ajouter `style={{ color: CORAL }}` sur chaque lien. Nogent exclu (pas de landing Martinique pertinente). Iguana = bail long → lien SEO informatif OK, pas de push « réservez ».

---

## C. Quick wins on-page (H1 + intro transactionnelle)

Les H1 existants sont déjà bons (vérifiés dans le code). Ajustements ciblés uniquement :

### `/location-villa-martinique-piscine` (`GuideVillaPiscine.jsx` ~L376)
- H1 actuel : `Location villa Martinique avec piscine` → **GARDER** (mot-clé exact).
- Intro actuelle : déjà transactionnelle. **OK**, aucun changement requis.

### `/sainte-luce-martinique` (`GuideSainteLuce.jsx` ~L217)
- H1 actuel : `Sainte-Luce Martinique` (stylisé) — **manque l'intention « location »**.
- **Quick win** : ajouter UNE phrase d'intro transactionnelle sous le H1 (le hero n'en a pas) :
  > `Louez une villa avec piscine privée et vue mer à Sainte-Luce, dans le Sud de la Martinique — en direct, sans frais Airbnb, dès 110 €/nuit.`
- (Le H1 stylisé reste « Sainte-Luce / Martinique » pour le design ; l'intro porte le mot-clé transactionnel.)

### `/location-groupe-sainte-luce` (rendu par `PublicSite.jsx` ~L8132)
- H1 à vérifier dans ce bloc — s'assurer qu'il contient « grande capacité » ou « jusqu'à 11 personnes ». Si absent, intro suggérée :
  > `Réunissez jusqu'à 11 proches à Sainte-Luce en réservant Zandoli, Géko et Mabouya ensemble — résidence privée, 3 piscines, réservation directe sans frais.`

### `/location-appartement-vue-mer-schoelcher` (`PublicSite.jsx` ~L8209) & `/reservation-directe-martinique` (`GuideReservationDirecte.jsx`)
- H1 et intros déjà transactionnels et corrects. **Aucun changement.**

---

## D. Mots-clés cible par landing (longue traîne, intention d'achat, FR)

### `/sainte-luce-martinique`
1. location villa Sainte-Luce Martinique
2. villa Sainte-Luce piscine vue mer
3. louer villa Sainte-Luce pas cher
4. location vacances Sainte-Luce Martinique
5. hébergement Sainte-Luce sud Martinique

### `/location-villa-martinique-piscine`
1. location villa Martinique avec piscine
2. villa Martinique piscine débordement
3. villa piscine privée Martinique sud
4. location villa Martinique piscine vue mer
5. villa Martinique piscine eau salée

### `/location-appartement-vue-mer-schoelcher`
1. location appartement vue mer Schœlcher
2. appartement Schœlcher Martinique vue baie
3. location vacances Schœlcher Fort-de-France
4. appartement vue mer Martinique nord
5. location appartement Schœlcher pas cher

### `/location-groupe-sainte-luce`
1. location grand groupe Martinique
2. location villa groupe Sainte-Luce
3. hébergement grande capacité Martinique 11 personnes
4. louer plusieurs logements Martinique ensemble
5. location vacances groupe sud Martinique

### `/reservation-directe-martinique`
1. réservation directe villa Martinique
2. location villa Martinique sans frais Airbnb
3. louer villa Martinique en direct propriétaire
4. location Martinique sans commission
5. villa Martinique moins cher qu'Airbnb

---

## Récap fichiers à éditer

| Landing | T | D | Fichier(s) à éditer |
|---|---|---|---|
| `/sainte-luce-martinique` | garder | garder | — (rien) |
| `/location-villa-martinique-piscine` | NEW | NEW | `prerender.mjs` |
| `/location-appartement-vue-mer-schoelcher` | NEW | NEW | **`functions/[slug].js` (SCHOELCHER_APPART)** + `prerender.mjs` |
| `/location-groupe-sainte-luce` | NEW | NEW | **`functions/[slug].js` (GROUP_STAY)** + `prerender.mjs` |
| `/reservation-directe-martinique` | garder | NEW | `prerender.mjs` |
| Maillage in-content | — | — | `PublicSite.jsx` (snippet fiche L4046), `GuideSainteLuce.jsx`, guides interceptés |

Après déploiement (`npm run deploy:pages` + Worker à part), vérifier en live chaque title via curl (l'injection runtime `[slug].js` fait foi pour les 2 slugs interceptés).
