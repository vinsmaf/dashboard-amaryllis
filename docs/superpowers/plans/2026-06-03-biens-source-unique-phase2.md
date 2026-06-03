# Source unique des biens — phase 2 (PublicSite) — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Étapes en `- [ ]`.

**Goal :** faire dériver les FAITS de `src/PublicSite.jsx` `BIENS` (prix/capacité/chambres/lieu/coords/rating/reviews/bookable) du canonique `src/data/biens.js`, sans toucher au contenu d'affichage riche ni aux noms affichés.

**Architecture :** fusion minimale — chaque objet `BIENS` de PublicSite garde ses champs d'affichage locaux et reçoit les faits partagés via `...canonFacts(id)` (spread du canonique en fin d'objet). Prérequis : aligner les coords du canonique sur les vraies coords PublicSite.

**Tech Stack :** React/Vite, vitest (`npm run test:run`), Cloudflare Pages. Vérif : build + tests + curl live.

> ⚠️ **Garde-fous :** zéro changement visible attendu (sauf coords JSON-LD → vraies valeurs) ; `rating` reste au format « 4,94 » ; `nom` PublicSite NON touché ; déploiement `npm run deploy:pages` uniquement + anti-cache ; commits par tâche.

---

## Structure de fichiers

| Fichier | Action | Responsabilité |
|---|---|---|
| `src/data/biens.js` | Modifier | Aligner `coords` sur les vraies valeurs PublicSite (7 biens) |
| `src/PublicSite.jsx` | Modifier | Import canonique + `canonFacts(id)` + spread dans les 7 `BIENS` ; retirer les faits dupliqués ; recâbler JSON-LD client sur `BIENS` |
| `src/__tests__/biens-consistency.test.js` | Modifier | Étendre : comparer aussi coords + rating + reviews PublicSite↔canonique |

---

## Task 1 : Aligner les coords du canonique sur PublicSite

**Files:** Modify `src/data/biens.js`

- [ ] **Step 1 : Mettre à jour `coords` des 7 biens** avec les vraies valeurs PublicSite :

```
amaryllis : { lat: 14.4732, lng: -60.9196 }
zandoli   : { lat: 14.4725, lng: -60.9201 }
iguana    : { lat: 14.4718, lng: -60.9188 }
geko      : { lat: 14.4729, lng: -60.9194 }
mabouya   : { lat: 14.4741, lng: -60.9209 }
schoelcher: { lat: 14.6121, lng: -61.0887 }
nogent    : { lat: 48.8374, lng: 2.4836 }   (déjà OK)
```
(Édite chaque ligne `coords: { lat: ..., lng: ... }` du fichier. Ne touche à rien d'autre.)

- [ ] **Step 2 : Vérifier le parse** — Run : `node -e "import('./src/data/biens.js').then(m=>console.log(m.BIENS.amaryllis.coords, m.BIENS.schoelcher.coords))"` — Expected : `{ lat: 14.4732, lng: -60.9196 } { lat: 14.6121, lng: -61.0887 }`
- [ ] **Step 3 : Build (prerender utilise ces coords)** — Run : `npm run build 2>&1 | grep -iE "error|✓ built|Prérendu"` — Expected : `✓ built` + prérendu OK.
- [ ] **Step 4 : Commit** — `git add src/data/biens.js && git commit -m "fix(biens): coords canonique alignées sur les vraies valeurs PublicSite"`

---

## Task 2 : Fusionner les faits dans PublicSite.BIENS + recâbler le JSON-LD client

**Files:** Modify `src/PublicSite.jsx`

- [ ] **Step 1 : Ajouter l'import + le helper `canonFacts`** juste AVANT `const BIENS = [` (l.245). Repérer la ligne d'import relative correcte (PublicSite.jsx est dans `src/`, donc `./data/biens.js`) :

```js
import { BIENS as CANON, isMartinique } from "./data/biens.js";

// Faits partagés tirés du canonique (source unique). N'inclut PAS `nom` (display PublicSite conservé).
function canonFacts(id) {
  const c = CANON[id];
  return {
    prix: c.prix,
    capacite: c.capacite,
    chambres: c.chambres,
    lieu: `${c.lieu}, ${isMartinique(c) ? "Martinique" : "Île-de-France"}`,
    coords: c.coords,
    rating: String(c.rating).replace(".", ","),
    reviews: c.reviews,
    bookable: c.bookable,
  };
}
```
⚠️ Vérifier qu'il n'y a pas déjà un import default/nommé en conflit. Si un import existe déjà depuis `./data/...`, ajouter proprement la ligne.

- [ ] **Step 2 : Pour CHACUN des 7 objets de `BIENS`** (amaryllis, zandoli, iguana, geko, mabouya, schoelcher, nogent) :
  - **Supprimer** les clés désormais fournies par le canonique : `prix`, `capacite`, `chambres`, `lieu`, `coords`, `rating`, `reviews` (et `bookable` si présent).
  - **Conserver** toutes les autres clés (`id`, `nom`, `airbnbTitle`, `tag`/`tagEn`, `desc`/`descEn`, `descFull`, `lits`, `sdb`, `couleur`, `photos`, `mapsEmbed`, `amenities`/`amenitiesEn`, `avis`).
  - **Ajouter `...canonFacts("<id>")` en DERNIÈRE propriété** de l'objet (avant `}`), pour que les faits canoniques fassent foi.
  - Exemple (amaryllis) — après transformation l'objet ressemble à :
    ```js
    {
      id: "amaryllis", nom: "Villa Amaryllis", airbnbTitle: "...", tag: "...", tagEn: "...",
      desc: "...", descEn: "...", descFull: [ ... ],
      lits: 3, sdb: "3,5", couleur: "#e91e8c",
      photos: [ ... ], mapsEmbed: "...", amenities: [ ... ], amenitiesEn: [ ... ], avis: [ ... ],
      ...canonFacts("amaryllis"),
    },
    ```
  ⚠️ NE PAS toucher `nom`, `lits`, `sdb`, ni le contenu d'affichage. Garder `lieu` UNIQUEMENT via canonFacts (retirer le `lieu:` littéral).

- [ ] **Step 3 : Recâbler le JSON-LD client** (`application/ld+json`, ~l.7963-8090). Inspecter ces blocs : si des faits y sont codés en dur (coords lat/lng, ratingValue, reviewCount, prix), les remplacer par des lectures de l'objet bien correspondant dans `BIENS` (donc du canonique). Si ces blocs lisent DÉJÀ depuis `BIENS`/un objet bien, ne rien changer (la fusion suffit). Laisser les `aggregateRating` génériques « 5 / 20 » de l'org/page (non liés à un bien) tels quels.

- [ ] **Step 4 : Build** — Run : `npm run build 2>&1 | grep -iE "error|✓ built|Prérendu"` — Expected : `✓ built` + prérendu OK, 0 erreur.
- [ ] **Step 5 : Vérifier qu'aucun fait partagé n'est resté littéral dans BIENS** — Run : `sed -n '245,700p' src/PublicSite.jsx | grep -nE "prix:|capacite:|chambres:|rating:|reviews:|coords:" | head` — Expected : AUCUNE occurrence (tous remplacés par canonFacts). (Si `coords:`/`prix:` apparaissent encore dans un objet bien, les retirer.) NB : les occurrences hors objets BIENS (ex. mapping d'avis `rating: a.note`) ne sont pas concernées — limiter l'inspection au tableau BIENS.
- [ ] **Step 6 : Commit** — `git add src/PublicSite.jsx && git commit -m "refactor(biens): PublicSite.BIENS dérive les faits du canonique (fusion minimale)"`

---

## Task 3 : Étendre le test de cohérence (coords + rating + reviews)

**Files:** Modify `src/__tests__/biens-consistency.test.js`

- [ ] **Step 1 : Ajouter un `it`** comparant coords/rating/reviews PublicSite↔canonique. Comme PublicSite stocke `rating` au format « 4,94 » (string virgule), comparer en normalisant : `Number(String(pubRating).replace(",", "."))` === `CANON[id].rating`. Pour coords, extraire `lat`/`lng` du bloc source de chaque bien et comparer aux coords canoniques. Adapter la regex au format réel (réutiliser la stratégie d'extraction par bloc déjà en place dans le fichier). Exemple de squelette :
```js
it("PublicSite.BIENS — coords/rating/reviews collent au canonique", () => {
  const fs = require("node:fs");
  const src = fs.readFileSync(new URL("../PublicSite.jsx", import.meta.url), "utf8");
  // NB : depuis la fusion, prix/capacite/coords ne sont plus littéraux par bien ;
  // ce test garde la cohérence des FAITS encore lisibles + protège contre une régression.
  for (const id of Object.keys(CANON)) {
    // … extraire et comparer ce qui reste extractible ; sinon skip + console.warn.
  }
  expect(true).toBe(true);
});
```
⚠️ Après la fusion (Task 2), les faits ne sont PLUS écrits littéralement dans PublicSite (ils viennent de canonFacts). Le test doit donc surtout **garantir l'intégrité du canonique** (7 biens, coords numériques valides, rating ∈ [4,5], reviews ≥ 0) et vérifier qu'il n'existe plus de `prix:`/`coords:` littéral résiduel dans le tableau BIENS (anti-régression : empêche quelqu'un de re-coder un fait en dur). Implémente CES assertions plutôt qu'une comparaison de valeurs devenues absentes.

- [ ] **Step 2 : Lancer le test ciblé** — Run : `npm run test:run -- biens-consistency 2>&1 | tail -15` — Expected : PASS.
- [ ] **Step 3 : Lancer toute la suite** — Run : `npm run test:run 2>&1 | tail -12` — Expected : aucune régression.
- [ ] **Step 4 : Commit** — `git add src/__tests__/biens-consistency.test.js && git commit -m "test(biens): intégrité canonique + anti-régression faits littéraux PublicSite"`

---

## Task 4 : Déploiement + vérification live

**Files:** aucun

- [ ] **Step 1 : Déployer** — Run : `npm run deploy:pages 2>&1 | grep -E "Deployment complete|servi en JS|Smoke test OK|❌"` — Expected : `Deployment complete` + `Smoke test OK`.
- [ ] **Step 2 : Vérif live (cache-bust)** que l'affichage des fiches est inchangé et les coords correctes :
```bash
ts=$(date +%s)
for b in amaryllis iguana; do
  echo "/$b :"; curl -s "https://villamaryllis.com/$b?v=$ts" | grep -oE '"latitude": ?"?[0-9.]+|"ratingValue": ?"?[0-9.]+"?' | head -4
done
```
  Expected : latitude amaryllis ≈ 14.4732 (vraie valeur), ratingValue cohérent (amaryllis 4.94, iguana 4.75). Aucune page cassée.
- [ ] **Step 3 : Vérif visuelle rapide** : ouvrir https://villamaryllis.com/amaryllis et confirmer prix « 280 € », « 8 voyageurs », note « 4,94 » affichés normalement (pas de NaN/undefined).
- [ ] **Step 4 : Mémoire** — Mettre à jour `PROJECT_MEMORY.md` (footgun #1 : phase 2 livrée, PublicSite dérive les faits du canonique ; App.jsx hors périmètre par design). Commit.

---

## Self-review (couverture spec phase 2)

- §1 coords reconcile → **Task 1** ✅
- §2 fusion minimale PublicSite → **Task 2** (import + canonFacts + spread + suppression faits dupliqués) ✅
- §3 JSON-LD client → **Task 2 Step 3** ✅
- §4 garde-fous (rating « 4,94 », nom intact, deploy:pages) → rappelés + Task 4 ✅
- §5 table coords → Task 1 ✅
- §6 critère d'acceptation → Task 4 (live inchangé affichage, coords réelles, ajout 8e bien simplifié) ✅
- Test → **Task 3** (réorienté vers intégrité canonique + anti-régression, car les faits ne sont plus littéraux dans PublicSite après fusion).

**Cohérence des noms :** `canonFacts(id)` défini Task 2 et utilisé dans les 7 objets ; champs `prix/capacite/chambres/lieu/coords/rating/reviews/bookable` cohérents avec le canonique (Task 1). `isMartinique` importé depuis le canonique (déjà exporté en phase 1).
