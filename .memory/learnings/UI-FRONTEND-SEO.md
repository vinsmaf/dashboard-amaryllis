# UI, Frontend & SEO — Learnings locatif-dashboard

> React/CSS/UX/layout/video/SEO meta/prerender/sitemap/a11y
> Extrait de `../LEARNINGS.md` le 2026-07-04 (consolidation mémoire — split thématique).
> 32 entrées, triées par date décroissante.

## 🔍 Un libellé KPI "vague" peut carrément MENTIR — vérifier le calcul avant de blâmer la formulation — 2026-07-03
- **Piège évité** : Vincent a demandé à clarifier un libellé "Ce mois" (top/flop biens) qu'il ne comprenait plus. En creusant le code (pas juste en reformulant le texte), le calcul (`sumN(revenus, n)`) était en fait un cumul YTD (janvier→mois courant), pas le mois seul — le libellé ne manquait pas de clarté, il était FAUX. Indice qui aurait dû alerter plus tôt : les montants (43k€ pour une villa, 4,2k€ pour un studio) étaient invraisemblables pour un seul mois mais parfaitement plausibles en cumul 6-7 mois.
- **La prochaine fois** : quand un utilisateur dit "je ne comprends plus ce que ça représente", ne pas se contenter de rendre le texte plus explicite — retracer le calcul jusqu'à la source et vérifier qu'il correspond VRAIMENT à ce que dit le libellé. Un panneau voisin avec un libellé cohérent ("YTD · Cashflow" à côté de "Ce mois" pour le même type de calcul) est un signal fort d'incohérence à ne pas ignorer.

## 🎥 `<video autoPlay muted loop>` en React : forcer `.muted` + `.play()` impérativement — 2026-07-02
- **Piège** : React ne synchronise pas toujours à temps la PROPRIÉTÉ `.muted` (juste l'attribut HTML JSX) avant que le navigateur évalue l'autoplay → lecture silencieusement refusée, la vidéo reste figée sur le poster (aucune erreur console). Constaté en prod alors que ça semblait fonctionner en preview locale — le timing diffère selon l'environnement, donc toujours vérifier en LIVE, pas juste en dev.
- **La prochaine fois** : pour toute vidéo de fond autoplay, poser un `ref` + `useEffect(() => { ref.current.muted = true; ref.current.play().catch(() => {}); }, [])` plutôt que de compter sur les attributs JSX seuls.
- **2e piège lié** : le navigateur peut aussi SUSPENDRE une vidéo de fond en cours de lecture (économie d'énergie, indépendant de la visibilité de l'onglet) → prévoir un listener `pause` qui relance `.play()` automatiquement, sinon la vidéo se fige en plein milieu sans jamais planter.

## 🗓️ Calendrier réservation — le "checkout confirmé" doit primer sur "date bloquée" au rendu — 2026-06-30/07-01
- **Piège (suite du fix ADR précédent)** : après avoir autorisé une date bloquée comme date de DÉPART valide (jour de turnover), un second bug est apparu : au rendu SUIVANT la confirmation, `checkout` n'est plus `null` → `pickingCheckout` redevient `false` → le check `blockedSet.has(ds)` reprend la main AVANT le check `ds === checkout` → la date se réaffiche comme "bloquée" alors que la sélection interne reste valide. Symptôme : "les dates sont bien sélectionnées mais le 14 se désélectionne visuellement".
- **La prochaine fois** : dans une state machine de rendu avec plusieurs conditions qui se chevauchent (bloqué / sélectionné / en cours de sélection), toujours vérifier "est-ce l'état FINAL déjà confirmé ?" en tout premier, avant toute règle de validité générique — sinon un état transitoire (`pickingCheckout`) qui redevient faux après confirmation fait perdre la priorité au bon état.

## ⚛️ React prop async + local state : `useEffect` de synchro obligatoire — 2026-06-30
- **Cas** : note d'impact initialisée depuis `userNote` prop (chargé depuis API). Après changement de statut → `load()` recharge → `userNote` change → local state `note` doit se resynchroniser.
- **La prochaine fois** : `useEffect(() => { setNote(userNote || ""); }, [userNote])` à côté de `useState(userNote || "")`. Sans cet effet, le state local reste "stale" même après re-fetch parent.

## 🔗 Logo header = `<a href="/">`, jamais `<button onClick>` — 2026-06-29
- **Piège** : logo en `<button onClick>` → Google ne suit pas les onClick JS, aucun PageRank transmis vers la home.
- **La prochaine fois** : tout élément nav qui pointe vers une URL = `<a href>`. Si le bouton ouvre aussi un dropdown, séparer le `<a>` du bouton `▾`.

## 🔧 manualChunks vite + lazy() = piège Rolldown (leaflet sur critical path) — 2026-06-29
- **Piège** : épingler un paquet dans `manualChunks` (ex. `"leaflet"`) force Rolldown à créer une référence statique depuis l'entry chunk pour satisfaire le graphe de modules — même si tous les imports consommateurs sont derrière `lazy()`. Résultat : modulepreload + CSS render-blocking sur toutes les pages.
- **La prochaine fois** : ne pas mettre dans `manualChunks` les paquets qui sont UNIQUEMENT importés par des composants lazy. Les laisser suivre naturellement leurs chunks lazy. Vérifier : `grep "leaflet" dist/index.html` après build → doit retourner 0.

## 📋 hreflang : cluster many-to-one = invalide Google — 2026-06-29
- **Piège** : pointer plusieurs pages FR vers une même page EN (`/villa-rental-martinique`) via hreflang crée un cluster invalide ignoré par Google.
- **La prochaine fois** : hreflang EN uniquement si la page EN existe vraiment en 1:1. Sinon, ne garder que `fr` + `x-default`. Les fiches biens n'ont pas de page EN by-property.

## 📦 prerender.mjs @graph VacationRental = conditionner au type de page — 2026-06-29
- **Piège** : le marqueur `<!--SEO_RENTALS_GRAPH-->` était remplacé inconditionnellement → 6 `VacationRental` injectés sur chaque guide/article. Données produit sur page éditoriale = risque action manuelle Google.
- **La prochaine fois** : toute injection JSON-LD de type produit doit être conditionnée à `routePath === "/" || BIEN_SLUGS.has(slug)`.

## ♿ WCAG 2.1 tunnel réservation — 3 patterns à retenir — 2026-06-29
- **Calendrier** : les cellules jours cliquables DOIVENT avoir `role="button"` + `tabIndex=0` + `onKeyDown (Enter/Space)` + `aria-label` + `aria-disabled`. Sans ça = invisible aux AT et clavier.
- **Modales** : `role="dialog"` + `aria-modal="true"` + `aria-labelledby` sur le container interne (pas l'overlay). Sans ça le SR lit le fond pendant que la modale est ouverte.
- **Erreurs dynamiques** : `role="alert"` + `aria-live="polite"` sur les div d'erreur → annonce automatique aux AT sans déplacement de focus (WCAG 4.1.3).

## 🎨 SubTabBar dans primitives.jsx, jamais inline — 2026-06-25
- **Piège** : Charges et Pilotage avaient chacun leur propre pill de sous-onglets avec des styles légèrement différents (accent `#ef4444` vs `#0ea5e9`, padding divergent).
- **La prochaine fois** : tout sous-onglet admin = `import { SubTabBar } from "../primitives.jsx"`. Props : `tabs=[{id, label}]`, `active`, `onChange`, `accent` (optionnel, défaut `#0ea5e9`). Jamais recoder les boutons pills inline.

## 🧭 Nav admin : tout nouvel onglet → ranger dans les 6 groupes existants — 2026-06-25
- Structure actée : **Quotidien** (usage quotidien Cockpit+Planning+Ménage+RevMgr+Tarifs) · **Opérations** (logistique+outils+comms) · **Finance** · **Analyses** · **Marketing** · **Admin** (IA+Équipe).
- **La prochaine fois** : avant d'ajouter un onglet, identifier d'abord le groupe. Si aucun ne convient → soulever la question, pas créer un 7ème groupe de suite.

## 🗂️ Déduplication d'onglets admin : vérifier la donnée avant de créer un onglet — 2026-06-24
- **Piège** : "CPA canal" et "Canaux 2025" dans Pilotage étaient des doublons (Historique > Canal 2025 avait déjà les mêmes données REVENUS_CANAL_2025 ; CPA canal réutilisait les mêmes résas live que Canaux live).
- **La prochaine fois** : avant d'ajouter un onglet ou un sous-onglet avec des données, vérifier si (1) ces données n'existent pas déjà dans un autre onglet/groupe et (2) si la différence de contexte (filtering, métrique) justifie vraiment la coexistence. Si la seule différence est cosmétique → intégrer comme sous-tab.
- **Règle** : 1 source = 1 endroit d'affichage principal. Les autres vues = sous-tabs du même onglet parent, pas des onglets frères.

## 🏷️ Injecter de la meta SEO = RETIRER celle du shell d'abord (sinon double balise) — 2026-06-23
- **Piège vécu** : `functions/article/[slug].js` ajoutait `og:image/og:title/canonical` sans retirer ceux du shell prérendu → 2 balises og:image, le crawler prend souvent la 1ère (= défaut amaryllis, fausse).
- **Piège dans le piège** : le 1er regex `<meta\s+property="og:image"` ne matchait pas car le shell a `<meta id="og-image" property="og:image">` (id AVANT property). **Toujours `<meta\b[^>]*\bproperty="..."` (ordre des attributs libre).**
- **La prochaine fois** : toute injection meta runtime doit STRIP les balises homonymes du shell (title, description, og:*, twitter:*, canonical) avant d'ajouter les siennes. Vérif live : `curl … | grep -c 'property="og:image"'` doit valoir 1.

## 🗺️ Sitemap d'un contenu D1 : dumper le statut depuis D1, jamais lire le seed SQL — 2026-06-23
- **Piège vécu** : le sitemap des articles lisait `scripts/seed-articles-30.sql` (32 slugs) alors que D1 avait 42 articles (37 publiés). Résultat : 10 publiés absents du sitemap + risque d'indexer des slugs dépubliés. Double source de vérité (MÉTA-A/ADR-G-001).
- **La prochaine fois** : pour tout contenu dont le STATUT vit en D1 (publié/draft), générer la liste sitemap depuis D1 (`scripts/dump-articles-published.mjs` → `articles-published.json`), jamais depuis le seed/fixture qui périme dès la 1ère édition admin.
- **Après toute (dé)publication d'article via l'admin** : relancer `node scripts/dump-articles-published.mjs` puis redéployer, sinon le sitemap ment.

## 🎯 Articles vs Guides : 2 systèmes, intentions distinctes (anti-cannibalisation) — 2026-06-23
- **Guides** (fichiers JSX, ~57) = inspiration/lieux/expériences. **Articles** (D1, 37) = conseils pratiques + recherche logement commerciale. Ne PAS créer un article sur le même mot-clé qu'un guide/landing existant → Google divise les signaux, les 2 rankent moins bien.
- **Vécu** : 5 articles dupliquaient à 100% une page établie (ex. `meilleure-saison-martinique` article ↔ landing) → dépubliés (`status=draft`), la page forte garde le jus.
- **Avant de publier un article** : `grep` le mot-clé cible dans les slugs guides (`main.jsx` KNOWN) + landings. Chevauchement ≥60% = cannibalisation, différencier l'angle ou ne pas créer.
- **Maillage interne entrant = priorité n°1** : un contenu SEO sans lien depuis les pages à autorité (home/footer/fiches) est orphelin → ne ranke pas. Toujours lier depuis footer + pages fortes.

## 🔄 Import circulaire App.jsx : extraire les données dans src/data/ — 2026-06-23
- **Piège vécu** : `NetRevParTab.jsx` importait `REVENUS_CANAL_2025` depuis `App.jsx`. App.jsx importe NetRevParTab. Résultat = import circulaire → crash React silencieux au démarrage admin (écran blanc, aucun message clair).
- **Fix** : extraire la donnée partagée dans `src/data/revenusCanal.js` (module pur, zéro import React). Re-exporter depuis App.jsx pour backward compat.
- **La prochaine fois** : tout tab d'admin qui partage des données avec d'autres tabs → données dans `src/data/`, jamais dans `App.jsx`. Check : « A importe B qui importe A ? » → import circulaire garanti.

## 🗺️ MaillageCluster — seuls currentSlug/bienId/bienNames sont des props valides — 2026-06-23
- `MaillageCluster` n'accepte PAS `titre`, `intro`, `biens` (props silently ignored → cluster vide, 0 erreur visible).
- **La prochaine fois** : toujours `currentSlug="<slug>"` pour un guide, ou `bienId="<id>"` pour une villa.
- Piège vécu : `GuideLocationVoiture` avait `titre="..." intro="..." biens={[...]}` → cluster absent en prod sans alerte.

## 🗺️ Créer un guide = 3 actions atomiques, aucune optionnelle — 2026-06-23
- Un slug ajouté seulement dans `seoClusters.js` ou `guidesIndex.js` → il apparaît dans le sitemap mais `Component = NotFound` (route absente). Piège vécu : 10 guides en 404 pré-existants.
- **La prochaine fois** : (1) `guidesIndex.js` + `dist` si villa fiche, (2) `src/GuideName.jsx` (structure ADR-GUIDES-STD-001), (3) `main.jsx` (import lazy + else if + KNOWN[]). Les 3 en une seule commit.
- Vérif : `grep -n "mon-slug" src/main.jsx` doit retourner **3 lignes** (import + else if + KNOWN).

## 🎬 Pattern composant générique + wrappers fins > duplication × N — 2026-06-23
- Quand N variantes d'un composant partagent la même logique (RAF, IntersectionObserver, hooks) mais des données différentes : **créer 1 générique paramétré + N wrappers fins** (35 lignes chacun). Coût de mise à jour : O(1) au lieu de O(N).
- **La prochaine fois** : dès qu'on veut créer la 3e variante d'un composant, sortir la logique en générique. Les 2 premiers peuvent rester standalone pour ne pas risquer la régression.
- Appliqué pour ReelPlayer + 4 wrappers (vs dupliquer 600 lignes × 4).

## 🎬 Citations reels : éviter les claims factuels non vérifiables — 2026-06-23
- Mabouya : éviter "vue mer" dans les citations (affirmation fragile côté voyageur). Privilégier l'expérience sensorielle (jacuzzi sous les étoiles) plutôt que la localisation/vue.
- **La prochaine fois** : pour les biens de résidence (Mabouya, Géko, Zandoli) = expérience + rapport qualité-prix. Pour les biens vue mer confirmée (Amaryllis, Iguana) = la vue peut être mentionnée.

## 📐 Layout 100dvh : `window.scrollTo()` est inutile si `overflowY: auto` est sur un div interne — 2026-06-21
- **Piège** : wrapper externe `height: 100dvh` → `document.scrollHeight ≈ 675px`, `maxScroll ≈ 58px`. `window.scrollTo({top: 300})` se clamp à 58, silencieusement. Le vrai container scrollable est le div interne (`infoPanelRef`) avec `overflowY: auto`.
- **La prochaine fois** : si `window.scrollY` ne bouge pas malgré `scrollTo()`, chercher le vrai scrollable avec `el => getComputedStyle(el).overflowY === 'auto'` ou vérifier `document.scrollingElement.scrollHeight`.
- **Formule sticky** : `target = contentOffset - stickyTop + margin` où `contentOffset = elRect.top - panelRect.top + panel.scrollTop`.

## 🌿 Leaflet + Vite prod : `import L from "leaflet"` → crash CJS/ESM — 2026-06-21
- **Piège** : en prod Vite, le chunk Leaflet peut exposer `undefined` comme export default → `L.divIcon()` crash. Sentry `handled=yes` masque l'impact réel.
- **La prochaine fois** : `import * as LModule from "leaflet"; const L = LModule.default ?? LModule` pour tout import CJS dans Vite. Valable aussi pour d'autres libs CJS (Moment, lodash, etc.).

## 📱 FB in-app browser : appelle les onClick sans props valides → guard défensif obligatoire — 2026-06-19
- **Piège vécu** : `generateDevis()` crashait en prod (`.slice()` sur `bien.id`) uniquement sur FB IAB Android (vieux FBAV/565). Cause : un événement click peut être déclenché par le browser sans que les props React soient settés correctement (navigation interne FB = contexte isolé, re-rendu partiel). **La prochaine fois** : toute fonction liée à un `onClick` qui consomme des props d'un composant parent (`bien`, `selection`, etc.) **doit commencer par** `if (!bien?.id) return;` (ou l'équivalent). Particulièrement risqué : les exports PDF/devis, les calculs de prix (`.toFixed()`), les fonctions appelées à partir d'un état intermédiaire. FB IAB = user réel, pas un bot → bug visible en production.

## 📊 Quand on change un prix dans `biens.js`, sweeper TOUS les endroits de prose — 2026-06-18 (fusion 2026-06-23)
- **Piège vécu** : Zandoli affiché 220€ sur 5 pages de guides + Faq.jsx + [slug].js + prerender.mjs + Guide.jsx alors que `biens.js` = 110€ depuis des sessions. La source unique pilote le calcul Stripe mais la **prose marketing** (textes libres, FAQ, meta descriptions guides) n'est pas générée dynamiquement → elle périme silencieusement. **La prochaine fois qu'un prix change dans `biens.js`** : greper `grep -r "<vieux_prix>€" src/ functions/ scripts/` et corriger toute occurrence de prose. Fichiers à surveiller en priorité : `GuideArlet.jsx`, `GuideSainteAnne.jsx`, `GuideNogent.jsx`, `GuideDiamant.jsx`, `GuideReservationDirecte.jsx`, `Guide.jsx`, `Faq.jsx`, `functions/[slug].js`, `scripts/prerender.mjs`, `src/i18n.jsx`.
- **Note** : `App.jsx DEFAULT_PRIX` (admin seed, ligne ~725) a encore les anciens prix (Zandoli 220, Géko 150, Mabouya 110, Nogent 85) — c'est VOULU pour l'historique admin, ne pas changer sans comprendre l'impact sur les seeds d'histogramme.
- **Commande généralisée (2026-06-23)**, réapparu sur `src/GuideEn.jsx` (mêmes prix périmés + "Bellevue" au lieu de "Schœlcher") : `grep -r '[0-9]\+€' src/ --include="*.jsx" --include="*.js" | grep -v biens.js | grep -v DEFAULT_PRIX` → tout résultat = suspect à corriger, plus systématique que de chercher un prix précis.

## 📁 RM-22 — wording SEO local : « maisons » et non « villas » (nomenclature stricte) — 2026-06-16
- MaillageCluster est **générique** (le cluster n'est pas toujours Sainte-Luce) ET seuls Amaryllis+Iguana sont des « villas ». L'audit suggérait « Nos villas à Sainte-Luce » = doublement faux. Solution : map préposition par cluster géo (`à Sainte-Luce`/`au Diamant`/`à Nogent`, fallback `à proximité`) + terme « maisons ». **Toujours vérifier la nomenclature + la généricité d'un composant avant d'appliquer un wording suggéré par un audit.**

## 2026-06-12 — Audit visuel multi-agents + double-source SEO + pièges HTML

- **`lits` ≠ `chambres` dans les BIENS de PublicSite.jsx.** Deux champs distincts coexistent dans le tableau `BIENS` local de `PublicSite.jsx` : `lits` = total couchages (inclut canapé-lit, utilisé sur la carte du logement L3242) ; `chambres` = nombre de chambres stricto sensu (vient de `biens.js`, utilisé dans l'overlay de réservation L3962). Zandoli `lits:3` + `chambres:2` = cohérent (3 personnes dorment via 2 ch + canapé). **Ne jamais flagguer ce delta comme bug sans vérifier les deux champs.**
- **Audit visuel multi-agents = QA systématique.** Lancer 11 agents en parallèle (1 par page) via un workflow multi-agents détecte des incohérences HTML invisibles à la relecture de code (attributs `id` manquants, Iguana dans JSON-LD alors que bookable:false, VILLAS hardcodées en dehors de la source unique, photo placeholder en prod). Rentable en ~8 min vs des heures de revue manuelle. Pattern : 1 agent = 1 page = 1 rapport structuré → synthèse en loop.
- **`og:image:alt` doit avoir un `id` pour être ciblé par `injectMeta()`.** La fonction `injectMeta()` dans `functions/[slug].js` remplace des tags par regex sur le HTML brut. Si le tag `<meta property="og:image:alt">` n'a pas d'attribut `id`, aucune regex ne peut le cibler de façon fiable. **Pattern : ajouter `id="og-image-alt"` dans `index.html`, puis la regex cible `<meta id="og-image-alt"[^>]*>`.** À reproduire pour tout autre meta-tag qu'on veut injecter par page.
- **Bash glob casse sur les crochets dans un nom de fichier.** Dans `deploy-pages.sh`, le lint delta check fait un `grep` sur les fichiers modifiés puis boucle sur eux. `functions/[slug].js` contient `[slug]` qui est interprété comme un glob bash même entre guillemets dans certains contextes → le script plante. **Workaround : `SKIP_LINT=1 bash scripts/deploy-pages.sh`**. Fix propre = échapper les crochets ou utiliser `--` dans le grep. Puce de background créée (task_cef1560f).
- **Wikimedia `Special:FilePath/<nom-exact-du-fichier>` = URL directe CC0 pour les photos POI.** Pattern : `https://commons.wikimedia.org/wiki/Special:FilePath/Grande_Anse_des_Salines_(Sainte-Anne,_Martinique)_-_01.jpg`. Pas besoin de créer ni héberger la photo. Rechercher sur commons.wikimedia.org, copier le nom exact du fichier, composer l'URL. Licence CC0 = libre de droits.
- **Règle de déploiement réaffirmée : montrer les changements site public AVANT de committer.** (Rappel Vincent, acté dans LEARNINGS 2026-06-11 - voir entrée "Modifications UI publiques"). Cette session : 4 corrections textuelles présentées et validées avant déploiement ✅.

## 🗄️ Guides voyageur : la source de vérité = D1 `property_guides`, pas le JSON public — 2026-06-11
- `/api/guides` lit **D1 d'abord**, fallback `public/guides/{id}.json`. Le placeholder tél `+33 6 XX XX XX XX` était propre dans le JSON mais **présent dans D1** → live cassé. Corrigé via `wrangler d1 execute --remote "UPDATE property_guides SET content_json=REPLACE(...)"`.
- **La prochaine fois** : pour tout contenu guide servi en prod, vérifier/éditer **D1**, pas le JSON (qui n'est qu'un fallback).

## 🧭 Route SPA 404 silencieux : la whitelist `isKnown` (main.jsx) doit lister TOUT préfixe — 2026-06-11
- `/guide-sejour/*` et `/services/*` avaient leur handler (main.jsx ~L321-324) mais **manquaient dans `isKnown`** (~L241) → `NotFound` avant d'atteindre le handler. Les liens emails pré-arrivée/J-1 (résas directes) **404aient**.
- **La prochaine fois** : tout nouveau préfixe de route = l'ajouter **à `isKnown` ET au routeur**. Tester un hit direct, pas seulement la nav SPA.

## 🔍 Diagnostic SEO réel (Search Console, 2026-06-11) : autorité, pas conversion
- ~100 impressions / 3 mois. Le site ne ranke que sur des requêtes **brand** (« amaryllis ») + génériques micro-volume. Sur les vraies requêtes à volume, **invisible** (Booking/OTA dominent même sur la marque « résidence amaryllis »). → Le levier n'est PAS plus d'on-page mais l'**autorité hors-page** (GBP, citations/NAP) + paid. Les quick-wins on-page (titres recalés) restent marginaux en absolu.

## 2026-06-07 (suite) — Crash admin sur redesign Tarifs (circularité top-level)

- **Règle « zéro top-level » sur imports d'App.jsx** : tout `.filter()`, `.map()`, `Object.keys()` ou accès à un export d'App.jsx **DANS LE SCOPE MODULE** d'un fichier `src/tabs/*.jsx` = crash garanti à l'évaluation. App.jsx importe les onglets en haut (~ligne 15) AVANT d'exporter ses constantes (lignes 700+) → le module enfant voit `CAL_BIEN_IDS = undefined` et `.filter()` crash.  
  ✅ Safe : `import { CAL_BIEN_IDS }` + utilisation **DANS** le composant (JSX/fonctions) → React n'évalue qu'au render, quand App.jsx a fini.  
  ❌ Crash : `const FOO = CAL_BIEN_IDS.filter(...)` au top-level du module.  
  La prochaine fois : si je dois dériver une constante depuis un import App.jsx, c'est **dans le composant** ou **via un getter lazy**, jamais au top-level. Le pattern existant (CalendrierTarifs.jsx) ne fait JAMAIS d'opération top-level sur ses imports — c'est pour ça qu'il marche.

- **`npm run build` ne détecte PAS ce type de bug** : Vite/Rollup tree-shake et bundle sans exécuter React. Le crash se produit uniquement au runtime client. **Avant tout deploy d'un nouveau composant onglet, OBLIGATOIRE : `npm run dev` + ouvrir `/admin` dans Chrome avec console ouverte + cliquer sur l'onglet concerné.** Le smoke test deploy-pages.sh charge `/admin` mais ne déclenche pas le render React des onglets.

## SEO — vérifier sur le LIVE, jamais sur les sources (piège double-source, vécu 2× le 2026-06-04)
- **Un audit SEO basé sur la lecture des composants `src/*.jsx` est FAUX.** Le `<title>`, le JSON-LD, le sitemap, les meta sont produits au **prerender** (`scripts/prerender.mjs`) et/ou au **runtime** (`functions/[slug].js`), PAS dans les composants React. Un agent Explore a conclu « 25 POI hors sitemap / zéro JSON-LD / maillage non fait » → **les 3 étaient faux** (sitemap live = 63 URLs POI inclus ; destinations ET POI ont Article+Breadcrumb+FAQPage ; landings maillées). **Règle : pour juger l'état SEO, `curl` le live, pas grep le source.**
- **Piège grep n°2 : le JSON-LD POI est indenté** (`JSON.stringify(x, null, 2)` dans `buildArticleLd`) → `grep '"@type":"Article"'` (sans espace) renvoie 0 alors que l'Article EST là (`"@type": "Article"`). **Toujours un pattern tolérant** : `grep -oE '"@type":\s*"Article"'`. Les guides destinations utilisent un stringify compact → d'où l'incohérence trompeuse POI vs destinations.
- **Conséquence projet (juin 2026)** : la couche SEO technique (sitemap, JSON-LD Article/FAQPage/Breadcrumb, maillage, meta runtime) est **déjà en place et saine**. Le levier restant n'est pas technique mais : (a) **mesure réelle** (Search Console : positions/impressions), (b) **version EN** quasi absente (1 page), (c) ALT images. Ne pas reconstruire l'existant.

## CSS / design — collision avec la règle globale `[data-surface="site"] h1`
- **Le CSS global `index.css` impose `[data-surface="site"] h1 { color: var(--fg-1) }` (navy foncé), spécificité (0,1,1).** Une page custom avec son propre `<style>` qui colore son titre de hero via une simple classe `.x-h1 { color: IVORY }` (0,1,0) **PERD** → titre navy foncé invisible sur hero sombre (vécu sur `/nos-partenaires` 2026-06-04). **Règle : tout h1 clair de hero doit soit être en `style={{ color: ... }}` inline (spécificité max), soit scopé `.x-hero .x-h1` (0,2,0) (+ `!important` au besoin), comme le fait déjà `GuidePOI` (`.gp-hero .gp-h1 !important`).** Les guides en inline-style sont safe ; vérifier toute NOUVELLE page custom à hero sombre. **⚠️ Re-frappé une 3ᵉ fois sur `TvScreen` (2026-06-04)** : un `<h1>` sur fond sombre qui compte sur `color` HÉRITÉ du parent (même via `style` sur le parent) est écrasé par la règle globale → **TOUJOURS mettre `color` directement sur le `style` du `<h1>`**, jamais hériter. Réflexe : à chaque `<h1>` clair sur fond sombre, écrire le `color` inline sur le h1 lui-même.
- **Débogage contraste = inspecter le *computed style* dans le navigateur, pas deviner.** `getComputedStyle(el).color` + énumérer `document.styleSheets` (selectorText + style.color) révèle la règle gagnante en 30s. Plus fiable que lire le source.

## Retouche photo automatisée — gray-world/highlight white-balance échouent sur un cast localisé multi-couleurs — 2026-07-11
- **Gray-world WB (moyenne globale RGB forcée au gris)** fonctionne pour un cast UNIFORME sur toute l'image (photo piscine avec cyan généralisé) mais **surcorrige violemment** dès que l'image contient de vraies zones colorées dominantes (bois marron + piscine turquoise) — a produit un cast orange/rose pire que l'original en force pleine.
- **Highlight-based WB (référence = pixels les plus lumineux, censés être neutres)** échoue si les hautes lumières sont déjà cramées/neutres (ciel blanc surexposé) : les gains calculés tombent ≈1.0 et ne touchent jamais le vrai problème, qui est dans les tons moyens.
- **Cast localisé multi-couleurs (ex. éclairage LED bleu ET vert réels dans la même photo, scène de terrasse au crépuscule)** : aucun gain de canal global ne peut corriger 2 teintes opposées à la fois. Seule une **désaturation ciblée par bande de teinte en HSV** (masque = teinte dans une plage + seuil saturation/luminosité, réduction progressive pondérée par la distance au seuil) neutralise chaque zone sans toucher le reste de l'image.
- **La prochaine fois** : identifier D'ABORD si le cast est uniforme (→ gray-world/gains de canal simples suffisent) ou localisé/multi-teintes (→ HSV par bande de teinte, pas de raccourci global). Toujours comparer avant/après à la MÊME résolution que celle réellement servie (une correction tunée sur une preview 480px peut révéler des artefacts différents à 1200px — vécu ici, mais confirmé au final non-problématique après comparaison directe).

## Sweep de couleurs hex "orphelines" — le scope réel dépasse toujours le grep initial — 2026-07-11
- Consolidation de 7 couleurs identifiées en conversation → le grep exhaustif sur UNE SEULE d'entre elles (`#6ee7b7`) a révélé **8 fichiers admin supplémentaires** (Reels, emails, Stripe, agents) jamais mentionnés au départ, tous avec le même usage sémantique exact (texte succès sur fond sombre).
- **La prochaine fois** : après tout remplacement de couleur "connue", relancer un `grep -rn` du hex EXACT sur `src/` entier (pas juste le fichier initialement suspecté) avant de considérer la tâche terminée — le premier signalement (conversation, audit) n'est qu'un échantillon, jamais l'inventaire complet.
- **Piège associé, déjà vécu 2× cette session sur d'autres couleurs plus tôt** : vérifier `grep "COULEUR[0-9a-fA-F]{2}"` (suffixe alpha 8 chiffres) avant tout remplacement en masse — un hex 6 chiffres peut être un sous-string d'un hex+alpha 8 chiffres, un remplacement naïf casse la valeur (`var(--x)30` invalide).
