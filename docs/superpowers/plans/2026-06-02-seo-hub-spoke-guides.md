# Programme SEO « Hub & Spoke » — Plan d'implémentation (Lot 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases `- [ ]`.

**Goal :** poser la fondation SEO (clusters + meta runtime + JSON-LD + maillage interne) qui transforme les guides en silos thématiques pointant vers les biens, pour capter la recherche Martinique et la convertir en réservations directes.

**Architecture :** une table de clusters centralisée (`src/data/seoClusters.js`) pilote (a) un composant de maillage `<MaillageCluster>` inséré dans les guides et fiches biens, et (b) la cohérence du maillage. La meta + le JSON-LD des guides non couverts sont ajoutés dans `functions/[slug].js` (qui **fait foi** à l'exécution, footgun #1), avec `scripts/prerender.mjs` tenu cohérent. Un helper JSON-LD centralisé génère Article/FAQ/Breadcrumb.

**Tech Stack :** React 19 + Vite (site), Cloudflare Pages Functions (`functions/[slug].js`, HTMLRewriter via `injectMeta`), JSON-LD schema.org. **Pas de framework de test** dans ce repo → vérification = `npm run build` + smoke test du deploy + `curl` live des `<title>`/JSON-LD + Google Rich Results Test.

> ⚠️ **Garde-fous impératifs (à respecter à CHAQUE tâche) :**
> - Meta des slugs interceptés : **`functions/[slug].js` fait foi** ; éditer aussi `prerender.mjs` pour cohérence ; **vérifier en live au curl** après deploy.
> - Déploiement **uniquement** `npm run deploy:pages` ; **jamais** `patrimoine-dashboard`.
> - **Anti-cache-empoisonné** : après deploy, ne PAS marteler le chemin canonique du bundle ; attendre la propagation, vérifier via cache-bust `?v=ts` (cf. `docs/ERREURS-LOG.md` 02/06).
> - Nomenclature « villa » = **Amaryllis + Iguana uniquement** ; les autres sont « logement/cocon/studio/appartement » (cf. `docs/voice.md`, `_biens.js`).
> - Title ≤ 60 c · meta description ≤ 158 c.
> - **Commits fréquents**, une tâche = un commit. Ne PAS déployer à chaque tâche : grouper le déploiement (Task 9). Le travail est local/testable au build avant déploiement.

---

## Structure de fichiers

| Fichier | Création/Modif | Responsabilité |
|---|---|---|
| `docs/seo/baseline-2026-06-02.md` | Créer | Snapshot trafic organique avant (mesure) |
| `src/data/seoClusters.js` | Créer | Source unique : slug → {hub, guides[], biens[], ancres} |
| `src/components/seo/MaillageCluster.jsx` | Créer | Rend « À lire aussi » + « Où loger » depuis la table |
| `src/lib/seo/jsonld.js` | Créer | Helpers JSON-LD : Article, FAQPage, BreadcrumbList |
| `src/PublicSite.jsx` | Modifier | Insérer `<MaillageCluster>` en bas des fiches biens |
| `src/Guide*.jsx` (composants guides) | Modifier | Insérer `<MaillageCluster>` + FAQ/Breadcrumb |
| `functions/[slug].js` | Modifier | Meta runtime + JSON-LD pour les guides non couverts |
| `scripts/prerender.mjs` | Modifier | Title/desc cohérents pour ces guides + sitemap priorités |

---

## Task 0 : Baseline de mesure (avant toute modif)

**Files:** Create `docs/seo/baseline-2026-06-02.md`

- [ ] **Step 1 : Capturer le trafic organique par page (GA4)**

Run :
```bash
curl -s "https://villamaryllis.com/api/analytics" --max-time 40 \
 | python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join('%s\t%s sessions\t%s users'%(p['pagePath'],p['sessions'],p['totalUsers']) for p in d.get('pages',[])))"
```
Expected : liste pagePath/sessions/users (≈ accueil 90, amaryllis 65, guides faibles).

- [ ] **Step 2 : Écrire le snapshot**

Créer `docs/seo/baseline-2026-06-02.md` avec : date, le tableau ci-dessus collé, et la note « revue à J+30 (02/07) et J+60 (02/08) — comparer sessions organiques par cluster ». Lister les 4 hubs et leurs guides (copier le tableau du spec §1).

- [ ] **Step 3 : Commit**
```bash
git add docs/seo/baseline-2026-06-02.md
git commit -m "docs(seo): baseline trafic organique avant programme hub & spoke"
```

---

## Task 1 : Table de clusters centralisée

**Files:** Create `src/data/seoClusters.js`

- [ ] **Step 1 : Créer la table**

Contenu (ids biens = ceux de `_biens.js` ; slugs = routes réelles de `main.jsx`) :
```js
// src/data/seoClusters.js
// Source unique de vérité du maillage interne SEO (hub & spoke).
// slug d'une page → son cluster. Sert MaillageCluster + cohérence des liens.
// Nomenclature : "villa" = Amaryllis + Iguana uniquement.

export const HUBS = {
  "sainte-luce":   { slug: "sainte-luce-martinique",  label: "Sainte-Luce, Sud Martinique" },
  "diamant":       { slug: "guide-le-diamant",        label: "Le Diamant & nature" },
  "sejour":        { slug: "guide-hub",               label: "Organiser son séjour" },
  "nogent":        { slug: "guide-nogent-sur-marne",  label: "Nogent-sur-Marne" },
};

// Guides (spokes) par cluster
export const CLUSTER_GUIDES = {
  "sainte-luce": [
    "plus-belles-plages-sud-martinique",
    "activites-sainte-luce",
    "guide-distilleries-martinique",
    "guide-gastronomie-martinique",
    "meilleure-saison-martinique",
  ],
  "diamant": [
    "guide-plongee-martinique",
    "guide-randonnees-martinique",
    "guide-sainte-anne",
    "guide-arlet",
  ],
  "sejour": [
    "meilleure-saison-martinique",
    "reservation-directe-martinique",
    "guide-trois-ilets",
    "guide-saint-pierre-martinique",
    "guide-francois-martinique",
  ],
  "nogent": [],
};

// Biens par cluster (ids _biens.js)
export const CLUSTER_BIENS = {
  "sainte-luce": ["amaryllis", "zandoli", "geko", "mabouya"],
  "diamant":     ["iguana"],
  "sejour":      ["amaryllis", "zandoli", "geko", "mabouya", "schoelcher", "iguana"],
  "nogent":      ["nogent"],
};

// Map inverse : slug d'un guide → cluster
const _guideToCluster = {};
for (const [cluster, slugs] of Object.entries(CLUSTER_GUIDES)) {
  for (const s of slugs) (_guideToCluster[s] ||= cluster); // 1er cluster gagne (évite doublons sejour)
}
// Map : id bien → cluster principal
const _bienToCluster = { amaryllis: "sainte-luce", zandoli: "sainte-luce", geko: "sainte-luce", mabouya: "sainte-luce", schoelcher: "sejour", iguana: "diamant", nogent: "nogent" };

export function clusterForGuide(slug) { return _guideToCluster[slug] || "sejour"; }
export function clusterForBien(id)   { return _bienToCluster[id]   || "sejour"; }
```

- [ ] **Step 2 : Vérifier l'import (build ne casse pas)**

Run : `node -e "import('./src/data/seoClusters.js').then(m=>console.log(Object.keys(m.HUBS), m.clusterForGuide('guide-plongee-martinique'), m.clusterForBien('iguana')))"`
Expected : `[ 'sainte-luce', 'diamant', 'sejour', 'nogent' ] diamant diamant`
(Si Node refuse l'import ESM direct, valider plutôt via `npm run build` à la Task 2.)

- [ ] **Step 3 : Commit**
```bash
git add src/data/seoClusters.js
git commit -m "feat(seo): table de clusters centralisée (hub & spoke)"
```

---

## Task 2 : Composant `<MaillageCluster>`

**Files:** Create `src/components/seo/MaillageCluster.jsx`

Pré-requis : connaître les libellés/URLs des guides. Réutiliser les libellés depuis `seoClusters` (ajouter un map `GUIDE_LABELS` dans `seoClusters.js` si absent) et les noms de biens depuis l'export biens de `App.jsx`/`PublicSite.jsx` (suivre le pattern d'import existant `BIENS`/`BIENS_DEVIS`).

- [ ] **Step 1 : Ajouter les libellés guides dans seoClusters.js**

Ajouter à `src/data/seoClusters.js` :
```js
export const GUIDE_LABELS = {
  "plus-belles-plages-sud-martinique": "Les plus belles plages du Sud",
  "activites-sainte-luce": "Que faire à Sainte-Luce",
  "guide-distilleries-martinique": "Distilleries & rhum AOC",
  "guide-gastronomie-martinique": "Gastronomie créole",
  "meilleure-saison-martinique": "Quand partir en Martinique",
  "guide-plongee-martinique": "Plongée & snorkeling",
  "guide-randonnees-martinique": "Randonnées du Sud",
  "guide-sainte-anne": "Sainte-Anne & les Salines",
  "guide-arlet": "Anses-d'Arlet",
  "reservation-directe-martinique": "Réserver en direct (sans frais)",
  "guide-trois-ilets": "Les Trois-Îlets",
  "guide-saint-pierre-martinique": "Saint-Pierre & la Pelée",
  "guide-francois-martinique": "Le François & fonds blancs",
};
```
Commit cette addition avec le composant (Step 4).

- [ ] **Step 2 : Créer le composant**
```jsx
// src/components/seo/MaillageCluster.jsx
// Bloc de maillage interne SEO : "À lire aussi" (guides du cluster) + "Où loger"
// (biens du cluster). Ancres descriptives. Piloté par seoClusters.
import { CLUSTER_GUIDES, CLUSTER_BIENS, GUIDE_LABELS, clusterForGuide, clusterForBien } from "../../data/seoClusters.js";

// `currentSlug` = slug de la page (guide), OU `bienId` = id du bien.
// `bienNames` = map { id: "Nom affiché" } passée par le parent (source: catalogue biens).
export default function MaillageCluster({ currentSlug = null, bienId = null, bienNames = {} }) {
  const cluster = currentSlug ? clusterForGuide(currentSlug) : clusterForBien(bienId);
  const guides = (CLUSTER_GUIDES[cluster] || []).filter((s) => s !== currentSlug).slice(0, 5);
  const biens  = (CLUSTER_BIENS[cluster] || []).filter((id) => id !== bienId).slice(0, 4);
  if (guides.length === 0 && biens.length === 0) return null;

  const linkStyle = { color: "#0e6b63", textDecoration: "none", fontWeight: 600 };
  return (
    <nav aria-label="Liens utiles" style={{ maxWidth: 1100, margin: "48px auto", padding: "0 20px" }}>
      {guides.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>À lire aussi</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {guides.map((s) => (
              <li key={s}><a href={`/${s}`} style={linkStyle}>{GUIDE_LABELS[s] || s}</a></li>
            ))}
          </ul>
        </div>
      )}
      {biens.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Où loger dans le secteur</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {biens.map((id) => (
              <li key={id}><a href={`/${id}`} style={linkStyle}>{bienNames[id] || id}</a></li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 3 : Vérifier le build**

Run : `npm run build 2>&1 | grep -iE "error|✓ built"`
Expected : `✓ built` (aucune `error`).

- [ ] **Step 4 : Commit**
```bash
git add src/data/seoClusters.js src/components/seo/MaillageCluster.jsx
git commit -m "feat(seo): composant MaillageCluster (à lire aussi + où loger)"
```

---

## Task 3 : Insérer le maillage dans les fiches biens et les guides

**Files:** Modify `src/PublicSite.jsx` (fiche bien) + chaque composant guide (`src/Guide.jsx`, `GuidePlongee.jsx`, `GuideDistilleries.jsx`, etc.)

- [ ] **Step 1 : Importer dans PublicSite.jsx**

En tête de `src/PublicSite.jsx`, ajouter : `import MaillageCluster from "./components/seo/MaillageCluster.jsx";`

- [ ] **Step 2 : Insérer dans la fiche bien**

Localiser la fin du rendu d'une fiche bien (juste avant le footer / le JSON-LD VacationRental ~ligne 7948). Insérer :
```jsx
<MaillageCluster bienId={bien.id} bienNames={Object.fromEntries(BIENS.map(b => [b.id, b.nom]))} />
```
(Adapter `BIENS` au nom réel du catalogue dans le scope — vérifier l'import existant en haut du fichier.)

- [ ] **Step 3 : Insérer dans les composants guides**

Pour chaque guide ayant un slug présent dans `CLUSTER_GUIDES`, importer le composant et l'insérer avant le footer :
```jsx
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
// …en bas du rendu :
<MaillageCluster currentSlug="guide-plongee-martinique" bienNames={BIEN_NAMES} />
```
où `BIEN_NAMES = { amaryllis:"Villa Amaryllis", zandoli:"Zandoli", geko:"Géko", mabouya:"Studio Mabouya", schoelcher:"Bellevue Schœlcher", iguana:"Villa Iguana", nogent:"Appartement Nogent-sur-Marne" }` (constante locale ou importée). Respecter la nomenclature « villa ».

- [ ] **Step 4 : Build**

Run : `npm run build 2>&1 | grep -iE "error|✓ built"`
Expected : `✓ built`.

- [ ] **Step 5 : Commit**
```bash
git add src/PublicSite.jsx src/Guide*.jsx
git commit -m "feat(seo): maillage cluster dans fiches biens et guides"
```

---

## Task 4 : Helper JSON-LD centralisé (Article / FAQ / Breadcrumb)

**Files:** Create `src/lib/seo/jsonld.js`

- [ ] **Step 1 : Créer les helpers**
```js
// src/lib/seo/jsonld.js — générateurs JSON-LD réutilisables (guides).
const ORG = { "@type": "Organization", name: "Amaryllis Locations", url: "https://villamaryllis.com" };

export function articleLd({ headline, description, url, image, datePublished, dateModified }) {
  return { "@context": "https://schema.org", "@type": "Article",
    headline, description, image: image ? [image] : undefined,
    author: ORG, publisher: ORG, mainEntityOfPage: url,
    datePublished, dateModified: dateModified || datePublished };
}

export function faqLd(items /* [{q,a}] */) {
  return { "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q,
      acceptedAnswer: { "@type": "Answer", text: a } })) };
}

export function breadcrumbLd(crumbs /* [{name,url}] */) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem",
      position: i + 1, name: c.name, item: c.url })) };
}
```

- [ ] **Step 2 : Build (import valide)**

Run : `npm run build 2>&1 | grep -iE "error|✓ built"`
Expected : `✓ built`.

- [ ] **Step 3 : Commit**
```bash
git add src/lib/seo/jsonld.js
git commit -m "feat(seo): helpers JSON-LD Article/FAQ/Breadcrumb"
```

---

## Task 5 : Meta runtime + JSON-LD pour les guides non couverts

**Files:** Modify `functions/[slug].js` + `scripts/prerender.mjs`

But : que **chaque** guide ait un `<title>`/`description`/`og`/canonical servis à l'exécution (la fonction fait foi) + un JSON-LD Article+FAQ+Breadcrumb. Suit le pattern existant (`GUIDE_*` + handler `if (slug === "...")` + `injectMeta`).

- [ ] **Step 1 : Lister les slugs non couverts**

Run :
```bash
cd /Users/vincentsalomon/locatif-dashboard
echo "Interceptés:"; grep -oE 'slug === "[a-z0-9-]+"' "functions/[slug].js" | sort -u
echo "Prérendus (guides):"; grep -oE '"/(guide[a-z0-9-]*|sainte-luce[a-z-]*|meilleure-saison[a-z-]*|plus-belles[a-z-]*|reservation-directe[a-z-]*|activites[a-z-]*)"' scripts/prerender.mjs | sort -u
```
La différence = slugs à ajouter (ex. `guide-distilleries-martinique`, `guide-gastronomie-martinique`, `guide-plongee-martinique`, `guide-randonnees-martinique`, `guide-trois-ilets`, `guide-saint-pierre-martinique`, `guide-francois-martinique`, `guide-arlet`, `meilleure-saison-martinique`, `reservation-directe-martinique`, `sainte-luce-martinique`, `guide-hub`). Noter la liste exacte produite.

- [ ] **Step 2 : Générer la meta (titre ≤60c / desc ≤158c) via l'agent SEO**

Pour CHAQUE slug listé, produire `{title, desc}` optimisés (mot-clé en tête, intention locale) en invoquant le skill **`seo-content-writer-amaryllis`** avec : le slug, le contenu réel du guide (lire le composant correspondant), le cluster (cf. `seoClusters.js`), et les contraintes (≤60c / ≤158c, nomenclature villa, ne pas inventer de faits). Consigner les paires dans un bloc de constantes `GUIDE_META` (voir Step 3). Pas de copie inventée : la meta doit refléter le contenu réel du guide.

- [ ] **Step 3 : Ajouter un handler générique guides dans `functions/[slug].js`**

Après les handlers existants, ajouter une table + une boucle (pattern aligné sur `injectMeta` déjà présent) :
```js
// Guides couverts génériquement (meta + Article/FAQ/Breadcrumb).
const GUIDE_META = {
  // exemple (remplacer par les paires produites au Step 2) :
  "guide-distilleries-martinique": {
    title: "Distilleries Martinique — rhum AOC à visiter (Sud)",
    desc:  "Les distilleries de rhum AOC à visiter dans le Sud de la Martinique : Trois-Rivières, La Mauny… horaires, dégustation, accès depuis Sainte-Luce.",
    faq: [
      { q: "Quelles distilleries visiter près de Sainte-Luce ?", a: "Trois-Rivières et La Mauny sont à 10–20 min ; HSE et Depaz côté nord." },
      { q: "Les visites sont-elles gratuites ?", a: "La plupart proposent une visite libre gratuite avec dégustation ; certaines visites guidées sont payantes." },
    ],
  },
  // … les autres slugs …
};
// dans onRequest, après les if existants :
if (GUIDE_META[slug]) {
  const g = GUIDE_META[slug];
  const url = `https://villamaryllis.com/${slug}`;
  const meta = { title: g.title, desc: g.desc, url, image: g.image || "https://villamaryllis.com/og-default.jpg" };
  const ld = [
    { "@context":"https://schema.org","@type":"Article", headline: g.title, description: g.desc, mainEntityOfPage: url,
      author:{"@type":"Organization",name:"Amaryllis Locations"}, publisher:{"@type":"Organization",name:"Amaryllis Locations"} },
    ...(g.faq ? [{ "@context":"https://schema.org","@type":"FAQPage", mainEntity: g.faq.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}})) }] : []),
    { "@context":"https://schema.org","@type":"BreadcrumbList", itemListElement:[
      {"@type":"ListItem",position:1,name:"Guides",item:"https://villamaryllis.com/guide-hub"},
      {"@type":"ListItem",position:2,name:g.title,item:url}] },
  ];
  const ldJson = JSON.stringify(ld);
  const html = await fetchOrigin(context); // suivre le pattern existant des autres handlers pour récupérer l'HTML
  return new Response(injectMeta(html, meta, ldJson), responseInit); // aligner sur les autres handlers (headers/init)
}
```
⚠️ Adapter `fetchOrigin`/`responseInit` au **pattern réel** des handlers voisins (lire lignes 278-382 de `functions/[slug].js` pour copier la façon exacte de récupérer `html` et construire la `Response`). Ne pas inventer d'API.

- [ ] **Step 4 : Cohérence `prerender.mjs`**

Pour chaque slug ajouté, vérifier/mettre à jour l'entrée `ROUTES` correspondante dans `scripts/prerender.mjs` avec les **mêmes** `title`/`desc` (baseline crawler). Si l'entrée n'existe pas, l'ajouter (slug, title, desc).

- [ ] **Step 5 : Build**

Run : `npm run build 2>&1 | grep -iE "error|✓ built|✨ Prérendu"`
Expected : `✓ built` + `✨ Prérendu terminé`.

- [ ] **Step 6 : Commit**
```bash
git add "functions/[slug].js" scripts/prerender.mjs
git commit -m "feat(seo): meta runtime + JSON-LD Article/FAQ/Breadcrumb pour tous les guides"
```

---

## Task 6 : ALT images + OG + priorités sitemap

**Files:** Modify guides (`src/Guide*.jsx`) + `scripts/prerender.mjs` (sitemap)

- [ ] **Step 1 : ALT descriptifs**

Dans chaque composant guide modifié, s'assurer que les `<img>` (et `<use href>` décoratifs exclus) ont un `alt` descriptif « sujet + lieu » (ex. `alt="Plage des Salines à Sainte-Anne, Martinique"`). Lister les images sans alt : `grep -nE "<img " src/Guide*.jsx | grep -v "alt="`.

- [ ] **Step 2 : Sitemap — priorités hubs**

Dans `scripts/prerender.mjs` (génération sitemap), donner `priority` plus élevée aux 4 hubs (`sainte-luce-martinique`, `guide-le-diamant`, `guide-hub`, `guide-nogent-sur-marne`) et `lastmod` à jour. Suivre le format existant du sitemap.

- [ ] **Step 3 : Build + vérifier sitemap**

Run : `npm run build 2>&1 | grep -iE "Sitemap|error"` puis `grep -c "<loc>" dist/sitemap.xml`
Expected : sitemap généré, ≥ 51 URLs.

- [ ] **Step 4 : Commit**
```bash
git add src/Guide*.jsx scripts/prerender.mjs
git commit -m "feat(seo): ALT images descriptifs + priorités sitemap (hubs)"
```

---

## Task 7 : Enrichissement des guides existants (contenu)

**Files:** Modify les composants guides minces (priorité cluster Sainte-Luce)

- [ ] **Step 1 : Repérer les guides minces / faible intention**

Critère : guide du cluster avec peu de contenu structuré (peu de H2/H3, pas de FAQ, pas d'infos pratiques). Lister les candidats (commencer par `guide-distilleries-martinique`, `guide-gastronomie-martinique`, `activites-sainte-luce`, `plus-belles-plages-sud-martinique`).

- [ ] **Step 2 : Enrichir via l'agent SEO (par guide)**

Pour chaque guide candidat, invoquer le skill **`seo-content-writer-amaryllis`** (et `seo-local-amaryllis` si requête locale) avec : le contenu actuel du composant, le cluster, l'intention de recherche (People Also Ask), et la consigne : structure **H2/H3 sur les vraies questions**, **bloc FAQ** (3-6 Q/R → alimente le `GUIDE_META[].faq` de Task 5), **infos pratiques** (accès, horaires, tarifs indicatifs, saison), **800-1500 mots utiles**, **fact-check** des faits biens via `_biens.js`, nomenclature villa respectée. Intégrer le contenu produit dans le composant (JSX) + mettre à jour la FAQ correspondante dans `functions/[slug].js`.

- [ ] **Step 3 : Build après chaque guide**

Run : `npm run build 2>&1 | grep -iE "error|✓ built"`
Expected : `✓ built`.

- [ ] **Step 4 : Commit par guide**
```bash
git add src/<GuideModifié>.jsx "functions/[slug].js"
git commit -m "content(seo): enrichir <guide> (H2/H3 + FAQ + infos pratiques)"
```

---

## Task 8 : Déploiement + vérification live + mesure

**Files:** aucun (déploiement)

- [ ] **Step 1 : Déployer**

Run : `npm run deploy:pages 2>&1 | grep -E "Deployment complete|Smoke test OK|❌"`
Expected : `Deployment complete` + `Smoke test OK` (pas de `❌`).

- [ ] **Step 2 : Attendre la propagation puis vérifier les meta (anti-cache)**

Attendre ~2 min. Pour 3-4 guides modifiés :
```bash
for s in guide-distilleries-martinique guide-plongee-martinique meilleure-saison-martinique; do
  echo "/$s :"; curl -s "https://villamaryllis.com/$s" | grep -oE "<title>[^<]*</title>"
done
```
Expected : chaque `<title>` = le titre runtime attendu (≤60c), différent de la baseline.

- [ ] **Step 3 : Valider le JSON-LD**

Pour un guide : `curl -s https://villamaryllis.com/guide-distilleries-martinique | grep -oE 'application/ld\+json[^<]*' | head` (présence Article/FAQ). Idéalement passer l'URL dans Google Rich Results Test (manuel).

- [ ] **Step 4 : Vérifier le maillage rendu**

`curl -s https://villamaryllis.com/guide-plongee-martinique | grep -iE "À lire aussi|Où loger"` → présence des blocs.

- [ ] **Step 5 : Noter la mesure**

Ajouter une ligne à `docs/seo/baseline-2026-06-02.md` : date de déploiement + « revue organique à J+30/J+60 ». Commit.
```bash
git add docs/seo/baseline-2026-06-02.md && git commit -m "docs(seo): déploiement lot 1 + jalons de revue"
```

---

## Self-review (couverture du spec)

- §1 architecture clusters → **Task 1** (seoClusters.js) ✅
- §2 fondation technique : meta runtime tous guides → **Task 5** ; JSON-LD Article/FAQ/Breadcrumb → **Task 4 + Task 5** ; LocalBusiness/VacationRental biens → *déjà présent* (prerender `buildVacationRentalLd` + PublicSite JSON-LD) ; ALT/OG/sitemap → **Task 6** ✅
- §3 maillage → **Task 2 + Task 3** ✅
- §4.1 enrichissement guides → **Task 7** ✅
- §4.2 nouveaux guides → **hors périmètre** (lots suivants, conforme au spec) ✅
- §5 mesure & garde-fous → **Task 0 (baseline) + Task 8** ; garde-fous rappelés en tête ✅

Types/signatures cohérents : `clusterForGuide`/`clusterForBien` (Task 1) réutilisés en Task 2 ; `GUIDE_META[].faq` (Task 5) alimenté par Task 7 ; `MaillageCluster` props `currentSlug`/`bienId`/`bienNames` cohérentes entre Task 2 et Task 3.

> ⚠️ Réalité du repo : **aucun framework de test** → la vérification repose sur `npm run build` + smoke test + `curl` live + Rich Results, et non sur des tests unitaires. Le contenu (meta, FAQ, enrichissement) est délégué aux skills SEO Amaryllis avec fact-check `_biens.js` — c'est volontaire (qualité éditoriale > copie inventée dans le plan).
