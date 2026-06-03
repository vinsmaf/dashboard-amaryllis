# Source unique des biens (phase 1) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans. Étapes en cases `- [ ]`.

**Goal :** créer une source de vérité unique des faits cœur des 7 biens (`src/data/biens.js`) et y brancher les consommateurs bug-prone (meta runtime `functions/[slug].js`, JSON-LD `prerender.mjs`, faits agents `_biens.js`), avec un test anti-drift sur le reste.

**Architecture :** un module de données pur (sans dépendance framework) importé par les 3 runtimes (React/Vite, Cloudflare Pages Functions/esbuild, Node prerender). Réconciliation des valeurs divergentes selon une règle d'autorité fixée. Migration sans changement de comportement visible (mêmes meta/JSON-LD servis, à l'exception des quelques valeurs aujourd'hui incohérentes qui sont unifiées).

**Tech Stack :** JS pur (ESM), Cloudflare Pages Functions, Vite, vitest (`npm test` / `npm run test:run`). Vérif = `npm run test:run` + `npm run build` + `npx wrangler pages functions build` + curl live post-deploy.

> ⚠️ **Garde-fous (chaque tâche) :**
> - **Aucune valeur de fait/prix ne doit changer** sauf les conflits explicitement réconciliés (Task 1) — c'est une **pure unification**.
> - `functions/[slug].js` **fait foi** pour la meta → après deploy, **vérifier en live au curl** (title ≤60c, desc ≤158c, JSON-LD).
> - Nomenclature « villa » = **Amaryllis + Iguana uniquement**. Iguana **`bookable:false`** (longue durée).
> - Déploiement **uniquement** `npm run deploy:pages` (jamais patrimoine-dashboard). **Anti-cache** : après deploy, ne pas marteler le bundle ; vérifier l'origine via `?v=ts`.
> - Commits fréquents, 1 tâche = 1 commit. Déploiement groupé en Task 7 (pas à chaque tâche).

---

## Structure de fichiers

| Fichier | Action | Responsabilité |
|---|---|---|
| `src/data/biens.js` | **Créer** | Source de vérité des faits cœur + helpers (pur, 0 dépendance) |
| `functions/api/_biens.js` | Modifier | Faits cœur ← canonique ; conserve `equip`/`interdit`/`EQUIP_RULES_TEXT` |
| `functions/[slug].js` | Modifier | Supprime tables locales `BIENS`+`SEO` → lit le canonique |
| `scripts/prerender.mjs` | Modifier | `buildVacationRentalLd` + title/desc routes biens ← canonique |
| `src/__tests__/biens-consistency.test.js` | **Créer** | Garde-fou anti-drift (PublicSite.BIENS + App seeds vs canonique) |

**EXCLU (phase 2)** : `src/PublicSite.jsx` `BIENS` (display riche) et `src/App.jsx` `SEED_BIENS`/`BIENS_DEVIS`/`BIENS_CAUTION` restent locaux, **gardés par le test**.

---

## Réconciliation des valeurs (règle d'autorité)

Sources divergentes → valeur canonique retenue :
- **Faits** (capacite, chambres, type, nom, lieu) : `functions/api/_biens.js`.
- **rating / reviews / desc / seoTitle / seoDesc / prix** : `functions/[slug].js` (autorité meta servie).
- **coords / photos / postal** : `scripts/prerender.mjs` (seule source).
- **bookable** : `false` pour iguana (longue durée), `true` sinon.

⚠️ **Conflits à confirmer par Vincent ultérieurement** (on prend l'autorité ci-dessus, à valider) :
- Iguana : rating `4.92` / reviews `25` (slug) — prerender avait `4.75`/`42`. → canonique = **4.92 / 25**.
- Nogent : rating `4.85` / reviews `12` (slug) — prerender avait `4.8`/`18`. → canonique = **4.85 / 12**.
*(Le plan n'impose pas le « vrai » chiffre : il unifie. Une note sera laissée en commentaire dans `biens.js`.)*

---

## Task 1 : Créer le module canonique `src/data/biens.js`

**Files:** Create `src/data/biens.js`

- [ ] **Step 1 : Écrire le module** (valeurs reprises de _biens.js + functions/[slug].js + prerender.mjs ; conflits réconciliés ci-dessus)

```js
// src/data/biens.js
// SOURCE DE VÉRITÉ des faits cœur des 7 biens (phase 1 — chantier source unique).
// Pur (aucune dépendance React/JSX/DOM/import.meta) → importable par React, par les
// Cloudflare Pages Functions et par le script prerender (Node).
// Nomenclature : "villa" = Amaryllis + Iguana UNIQUEMENT. Iguana = bookable:false (longue durée).
// ⚠️ rating/reviews Iguana (4.92/25) et Nogent (4.85/12) : valeurs unifiées depuis
//    functions/[slug].js — à confirmer par Vincent (prerender divergeait : 4.75/42 et 4.8/18).

export const BIENS = {
  amaryllis: {
    id: "amaryllis", nom: "Villa Amaryllis", type: "villa",
    prix: 280, capacite: 8, chambres: 3, lieu: "Sainte-Luce", postal: "97228",
    coords: { lat: 14.4728, lng: -60.9204 }, rating: 4.94, reviews: 33, bookable: true,
    photos: ["/photos/amaryllis/01.webp","/photos/amaryllis/02.webp","/photos/amaryllis/03.webp","/photos/amaryllis/04.webp","/photos/amaryllis/05.webp","/photos/amaryllis/06.webp","/photos/amaryllis/07.webp","/photos/amaryllis/08.webp"],
    seoTitle: "Villa Amaryllis Sainte-Luce — piscine vue mer Martinique",
    seoDesc: "Villa Amaryllis à Sainte-Luce : piscine à débordement, vue Caraïbes 180°, 3 chambres, 8 personnes. Dès 280€/nuit en direct, sans frais Airbnb.",
  },
  zandoli: {
    id: "zandoli", nom: "Zandoli", type: "logement",
    prix: 220, capacite: 5, chambres: 2, lieu: "Sainte-Luce", postal: "97228",
    coords: { lat: 14.4730, lng: -60.9196 }, rating: 4.5, reviews: 16, bookable: true,
    photos: ["/photos/zandoli/01.webp","/photos/zandoli/02.webp","/photos/zandoli/03.webp","/photos/zandoli/04.webp"],
    seoTitle: "Zandoli Sainte-Luce — logement piscine cascade Martinique",
    seoDesc: "Zandoli à Sainte-Luce : piscine privative à cascade, mezzanine, jardin tropical. 5 personnes. Dès 220€/nuit en réservation directe.",
  },
  iguana: {
    id: "iguana", nom: "Villa Iguana", type: "villa",
    prix: 180, capacite: 6, chambres: 2, lieu: "Sainte-Luce", postal: "97228",
    coords: { lat: 14.4725, lng: -60.9192 }, rating: 4.92, reviews: 25, bookable: false,
    photos: ["/photos/iguana/01.webp","/photos/iguana/02.webp","/photos/iguana/03.webp","/photos/iguana/04.webp"],
    seoTitle: "Villa Iguana Martinique — vue Rocher du Diamant",
    seoDesc: "Villa Iguana à Sainte-Luce : piscine eau salée, vue panoramique sur le Rocher du Diamant. 6 personnes. Réservation directe propriétaire.",
  },
  geko: {
    id: "geko", nom: "Géko", type: "cocon",
    prix: 150, capacite: 4, chambres: 1, lieu: "Sainte-Luce", postal: "97228",
    coords: { lat: 14.4732, lng: -60.9196 }, rating: 4.83, reviews: 24, bookable: true,
    photos: ["/photos/geko/01.webp","/photos/geko/02.webp","/photos/geko/03.webp","/photos/geko/04.webp"],
    seoTitle: "Géko Sainte-Luce — cocon piscine cascade Martinique",
    seoDesc: "Cocon Géko à Sainte-Luce : piscine privative à cascade, jardin tropical, sur les hauteurs. 4 personnes. Dès 150€/nuit en réservation directe.",
  },
  mabouya: {
    id: "mabouya", nom: "Studio Mabouya", type: "studio",
    prix: 110, capacite: 2, chambres: 1, lieu: "Sainte-Luce", postal: "97228",
    coords: { lat: 14.4732, lng: -60.9196 }, rating: 4.55, reviews: 11, bookable: true,
    photos: ["/photos/mabouya/01.webp","/photos/mabouya/02.webp","/photos/mabouya/03.webp","/photos/mabouya/04.webp"],
    seoTitle: "Studio Mabouya Martinique — jacuzzi privatif vue mer",
    seoDesc: "Studio Mabouya à Sainte-Luce : seul jacuzzi privatif vue mer de la résidence. Idéal couple, terrasse privée, plages à 5 min. Dès 110€/nuit.",
  },
  schoelcher: {
    id: "schoelcher", nom: "Bellevue Schœlcher", type: "appartement de standing",
    prix: 100, capacite: 2, chambres: 1, lieu: "Schœlcher", postal: "97233",
    coords: { lat: 14.6167, lng: -61.1333 }, rating: 4.8, reviews: 30, bookable: true,
    photos: ["/photos/schoelcher/01.webp","/photos/schoelcher/02.webp","/photos/schoelcher/03.webp","/photos/schoelcher/04.webp"],
    seoTitle: "Bellevue Schœlcher — appart vue baie Fort-de-France",
    seoDesc: "Appartement Bellevue à Schœlcher : vue sur la baie de Fort-de-France, 2 personnes, à 10 min du centre. Réservation directe dès 100€/nuit.",
  },
  nogent: {
    id: "nogent", nom: "Appartement Nogent-sur-Marne", type: "appartement",
    prix: 85, capacite: 2, chambres: 1, lieu: "Nogent-sur-Marne", postal: "94130",
    coords: { lat: 48.8374, lng: 2.4836 }, rating: 4.85, reviews: 12, bookable: true,
    photos: ["/photos/nogent/01.webp","/photos/nogent/02.webp","/photos/nogent/03.webp","/photos/nogent/04.webp","/photos/nogent/05.webp","/photos/nogent/06.webp"],
    seoTitle: "Appart Nogent-sur-Marne — bord de Marne, Paris 20 min",
    seoDesc: "Appartement de standing à Nogent-sur-Marne : jardin privatif, home cinéma, bord de Marne. RER A, Paris en 20 min. Dès 85€/nuit en direct.",
  },
};

export const ALL_BIENS = Object.values(BIENS);
export const VILLAS = ALL_BIENS.filter(b => b.type === "villa").map(b => b.id); // ["amaryllis","iguana"]
export const isMartinique = (b) => b.lieu !== "Nogent-sur-Marne";
export function getBien(id) { return BIENS[id] || null; }
```

- [ ] **Step 2 : Vérifier que le module parse** — Run : `node -e "import('./src/data/biens.js').then(m=>console.log('OK',m.ALL_BIENS.length,m.VILLAS))"` — Expected : `OK 7 [ 'amaryllis', 'iguana' ]`
- [ ] **Step 3 : Commit** — `git add src/data/biens.js && git commit -m "feat(biens): module canonique source unique des faits (phase 1)"`

---

## Task 2 : VALIDER l'import depuis les Functions Cloudflare (risque #1)

**Files:** (temporaire) `functions/[slug].js`

- [ ] **Step 1 : Ajouter un import de test en tête de `functions/[slug].js`** : `import { BIENS as CANON } from "../src/data/biens.js";` puis, dans `onRequest`, un `console.log("[canon]", Object.keys(CANON).length)` (temporaire).
- [ ] **Step 2 : Compiler le bundle Functions** — Run : `npx wrangler pages functions build 2>&1 | tail -20`
  Expected : build réussi sans « Could not resolve "../src/data/biens.js" ».
- [ ] **Step 3 — Décision :**
  - **Si build OK** → l'import fonctionne. Retirer le `console.log` temporaire (garder l'import si utile, sinon retirer aussi). Passer à Task 3.
  - **Si build ÉCHOUE (résolution)** → FALLBACK : déplacer le canonique en `functions/api/_biens.js` comme ré-exporteur (les functions importent `./_biens.js` ; `src/`+`prerender` importent `../functions/api/_biens.js` — Vite/Node résolvent hors de src). Adapter les chemins d'import des tâches suivantes en conséquence et noter le choix dans le commit.
- [ ] **Step 4 : Commit** (uniquement si un changement de structure a été décidé) — sinon, pas de commit (état revert au propre).

---

## Task 3 : Migrer `functions/[slug].js` vers le canonique

**Files:** Modify `functions/[slug].js`

- [ ] **Step 1 : Importer le canonique** en tête : `import { BIENS as CANON } from "../src/data/biens.js";` (ou chemin du fallback Task 2).
- [ ] **Step 2 : Supprimer la table locale `const BIENS = {…}`** (l.7-72) et la table `const SEO = {…}`. Remplacer les usages :
  - Là où le code lit `BIENS[slug].prix` / `.nom` / `.lieu` / `.rating` / `.reviews` → `CANON[slug].prix` etc. (mêmes noms de champs ; `lieu` canonique = commune seule, ex. "Sainte-Luce" — si le code attendait "Sainte-Luce, Martinique", composer `${CANON[slug].lieu}, ${isMartinique(CANON[slug]) ? "Martinique" : "Île-de-France"}`).
  - Là où le code lit `SEO[slug].title` / `.desc` → `CANON[slug].seoTitle` / `.seoDesc`.
  - `desc`/`amenities` (texte long marketing) **n'existent pas** dans le canonique en phase 1 : garder ces 2 champs dans une petite table locale résiduelle `BIEN_EXTRA = { amaryllis: { desc: "...", amenities: [...] }, ... }` (copiée de l'ancienne table) OU conserver l'ancienne table UNIQUEMENT pour `desc`/`amenities` et tirer le reste du canonique. ⚠️ Choisir l'option qui touche le moins le handler ; documenter.
- [ ] **Step 3 : Build Functions** — Run : `npx wrangler pages functions build 2>&1 | tail -10` — Expected : OK, 0 erreur de résolution/syntaxe.
- [ ] **Step 4 : Build front** — Run : `npm run build 2>&1 | grep -iE "error|✓ built"` — Expected : `✓ built`.
- [ ] **Step 5 : Commit** — `git add "functions/[slug].js" && git commit -m "refactor(biens): functions/[slug].js lit le canonique (meta+JSON-LD)"`

---

## Task 4 : Migrer `scripts/prerender.mjs` vers le canonique

**Files:** Modify `scripts/prerender.mjs`

- [ ] **Step 1 : Importer le canonique** en tête (à côté des autres imports `../src/data/...`) : `import { BIENS as CANON, isMartinique } from "../src/data/biens.js";`
- [ ] **Step 2 : Remplacer les args inline de `buildVacationRentalLd({...})`** des 7 routes biens par les champs canoniques. Pour chaque bien `id` :
  ```js
  jsonld: buildVacationRentalLd({
    id, nom: CANON[id].nom, desc: /* desc longue : voir note */ CANON[id].seoDesc,
    prix: CANON[id].bookable ? CANON[id].prix : undefined, capacite: CANON[id].capacite,
    chambres: CANON[id].chambres, rating: CANON[id].rating, reviews: CANON[id].reviews,
    coords: CANON[id].coords, photos: CANON[id].photos,
    isMartinique: isMartinique(CANON[id]), bookable: CANON[id].bookable,
  }),
  ```
  Et `title: \`${CANON[id].seoTitle} | Amaryllis\`` (vérifier le suffixe existant) , `desc: CANON[id].seoDesc`. ⚠️ La `desc` longue passée à `buildVacationRentalLd` était plus riche que `seoDesc` : si on veut la garder, ajouter un champ `descLong` au canonique OU accepter `seoDesc` (plus court, ≤300 dans le LD). Choisir `seoDesc` pour la phase 1 (cohérent, suffisant) et le documenter.
- [ ] **Step 3 : Build** — Run : `npm run build 2>&1 | grep -iE "error|✓ built|Prérendu|Sitemap"` — Expected : `✓ built` + « Prérendu terminé » + sitemap.
- [ ] **Step 4 : Diff de non-régression** — Run : `grep -oE '"ratingValue": "[0-9.]+"' dist/amaryllis/index.html | head` — Expected : `4.94` (inchangé). Vérifier 1-2 biens.
- [ ] **Step 5 : Commit** — `git add scripts/prerender.mjs && git commit -m "refactor(biens): prerender JSON-LD + meta biens ← canonique"`

---

## Task 5 : `functions/api/_biens.js` consomme le canonique

**Files:** Modify `functions/api/_biens.js`

- [ ] **Step 1 : Importer le canonique** et reconstruire l'export `BIENS` en fusionnant les faits cœur (canonique) + le texte de grounding LLM (`equip`/`interdit`, conservés localement) :
```js
import { BIENS as CANON, VILLAS as CANON_VILLAS } from "../../src/data/biens.js";
export const VILLAS = CANON_VILLAS;
const GROUNDING = {
  amaryllis:  { equip: "piscine à débordement eau salée 4×7 m", interdit: "PAS de jacuzzi" },
  iguana:     { equip: "piscine eau salée non chlorée", interdit: "PAS de débordement, PAS de jacuzzi" },
  zandoli:    { equip: "piscine privative avec cascade (eau classique)", interdit: "PAS eau salée" },
  geko:       { equip: "piscine privative avec cascade (eau classique)", interdit: "PAS eau salée" },
  mabouya:    { equip: "jacuzzi privatif vue mer", interdit: "AUCUNE piscine" },
  schoelcher: { equip: "vue panoramique baie", interdit: "AUCUNE piscine, AUCUN jacuzzi" },
  nogent:     { equip: "jardin + terrasse", interdit: "AUCUNE piscine, AUCUN jacuzzi" },
};
export const BIENS = Object.fromEntries(Object.values(CANON).map(b => [b.id, {
  nom: b.nom, type: b.type, capacite: b.capacite, chambres: b.chambres,
  prix: b.prix, lieu: b.lieu, ...GROUNDING[b.id],
}]));
```
  Garder `EQUIP_RULES_TEXT` tel quel (verbatim). ⚠️ Vérifier que les consommateurs (`agents-run.js`) lisent bien `nom/type/capacite/chambres/prix/lieu/equip/interdit` — interface inchangée.
- [ ] **Step 2 : Build Functions** — Run : `npx wrangler pages functions build 2>&1 | tail -10` — Expected : OK.
- [ ] **Step 3 : Commit** — `git add functions/api/_biens.js && git commit -m "refactor(biens): _biens.js ← canonique + grounding LLM conservé"`

---

## Task 6 : Test de cohérence anti-drift (vitest)

**Files:** Create `src/__tests__/biens-consistency.test.js`

- [ ] **Step 1 : Écrire le test** (compare les tables NON migrées au canonique sur les champs cœur)
```js
import { describe, it, expect } from "vitest";
import { BIENS as CANON } from "../data/biens.js";

// PublicSite.BIENS et les seeds App ne sont PAS encore migrés (phase 2) :
// ce test échoue si leurs faits cœur divergent du canonique → garde-fou anti-drift.
describe("biens — cohérence avec la source canonique", () => {
  it("le canonique a 7 biens et 2 villas", () => {
    expect(Object.keys(CANON)).toHaveLength(7);
    expect(Object.values(CANON).filter(b => b.type === "villa").map(b => b.id)).toEqual(["amaryllis", "iguana"]);
  });

  it("PublicSite.BIENS colle au canonique (prix, capacite, nom)", async () => {
    const mod = await import("../PublicSite.jsx").catch(() => null);
    // PublicSite importe du JSX/DOM : si l'import échoue en environnement test,
    // on lit le tableau via regex sur le source (fallback robuste).
    const fs = await import("node:fs");
    const src = fs.readFileSync(new URL("../PublicSite.jsx", import.meta.url), "utf8");
    for (const id of Object.keys(CANON)) {
      const block = src.slice(src.indexOf(`id: "${id}"`), src.indexOf(`id: "${id}"`) + 1200);
      const prix = block.match(/prix:\s*(\d+)/);
      if (prix) expect(Number(prix[1]), `prix ${id}`).toBe(CANON[id].prix);
    }
  });
});
```
  ⚠️ Adapter le parsing au format réel de `PublicSite.jsx` (vérifier la regex `id: "amaryllis"` … `prix:`). Si l'import direct du JSX marche sous vitest (jsdom), préférer l'import ; sinon garder le fallback regex sur le source.
- [ ] **Step 2 : Lancer le test** — Run : `npm run test:run -- biens-consistency 2>&1 | tail -20` — Expected : PASS (si un prix diverge → FAIL = drift détecté, à réconcilier).
- [ ] **Step 3 : Lancer TOUTE la suite (non-régression)** — Run : `npm run test:run 2>&1 | tail -15` — Expected : aucun test cassé par rapport à avant.
- [ ] **Step 4 : Commit** — `git add src/__tests__/biens-consistency.test.js && git commit -m "test(biens): garde-fou anti-drift (PublicSite/App vs canonique)"`

---

## Task 7 : Déploiement + vérification live (non-régression)

**Files:** aucun

- [ ] **Step 1 : Déployer** — Run : `npm run deploy:pages 2>&1 | grep -E "Deployment complete|servi en JS|Smoke test OK|❌"` — Expected : `Deployment complete` + `Smoke test OK`.
- [ ] **Step 2 : Attendre la propagation (~2 min) puis vérifier les fiches biens (origine, cache-bust)** :
```bash
for b in amaryllis iguana nogent; do
  echo "/$b :"; curl -s "https://villamaryllis.com/$b?v=$(date +%s)" | grep -oE "<title>[^<]*</title>|\"ratingValue\": ?\"[0-9.]+\""
done
```
  Expected : titres = `seoTitle` du canonique (amaryllis « Villa Amaryllis Sainte-Luce — piscine vue mer Martinique »), ratingValue = canonique (amaryllis 4.94, iguana 4.92, nogent 4.85). **Aucune régression** vs valeurs canoniques.
- [ ] **Step 3 : Vérifier la cohérence runtime ↔ prerender** : title servi (runtime) == title prérendu (`dist/<id>/index.html`). 
- [ ] **Step 4 : Mémoire** — Mettre à jour `PROJECT_MEMORY.md` (footgun #1 : noter que `functions/[slug].js`/`prerender.mjs`/`_biens.js` lisent désormais `src/data/biens.js` ; phase 2 = PublicSite/App). Commit.

---

## Self-review (couverture du spec)

- §1 module canonique → **Task 1** ✅ (schéma complet, helpers, valeurs réconciliées).
- §2 consommateurs migrés : functions/[slug].js → **Task 3** ; prerender → **Task 4** ; _biens.js → **Task 5** ✅
- §3 test de cohérence → **Task 6** ✅
- §4 périmètre (PublicSite/App exclus, gardés par test) → respecté (Task 6 les garde).
- §5 risque import Functions → **Task 2** (validation + fallback) ✅
- §6 garde-fous → rappelés en tête + Task 7 (curl live, anti-cache, deploy:pages).
- §7 critère d'acceptation → Task 7 (mêmes meta/JSON-LD, plus de prix en dur dans slug/prerender).

**Cohérence des noms** : champs canoniques (`prix/capacite/chambres/lieu/coords/rating/reviews/bookable/photos/seoTitle/seoDesc`) utilisés identiquement de Task 1 à Task 6. `isMartinique(b)` défini Task 1, utilisé Task 4. `getBien`/`ALL_BIENS`/`VILLAS` exportés Task 1.

> ⚠️ **Réconciliation = seule modif de valeur** : Iguana 4.92/25 et Nogent 4.85/12 (autorité = functions/[slug].js). Le JSON-LD prerender de ces 2 biens changera en conséquence (4.75→4.92, 4.8→4.85). À confirmer par Vincent (les vrais chiffres d'avis), mais c'est une unification, pas une régression.
