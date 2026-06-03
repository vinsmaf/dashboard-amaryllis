# Design — Source unique des biens (canonique, phase 1)

**Date :** 2026-06-03
**Programme :** Robustesse (chantier 1/3 : Maintenabilité · 2 : Fiabilité données · 3 : Préparer l'avenir).
**Approche retenue :** C — source canonique **phasée** (faits cœur unifiés + migration des consommateurs bug-prone d'abord, le reste protégé par un test, migration complète en phase 2).

## 0. Problème

Les faits des 7 biens (nom, prix, capacité, chambres, lieu, coords, rating, nomenclature) sont **dupliqués sur 5 fichiers** : `functions/api/_biens.js`, `functions/[slug].js` (table `BIENS` + `SEO`), `src/PublicSite.jsx` (`const BIENS`), `src/App.jsx` (`SEED_BIENS`/`BIENS_DEVIS`/`BIENS_CAUTION`), `scripts/prerender.mjs` (args `buildVacationRentalLd`). Le prix « 280 » est codé en dur dans 4-5 fichiers. **Conséquences observées :** incohérence Villa Iguana (« longue durée » dans la fiche/CGV mais retiré ailleurs), risque de drift à chaque modif, ajout d'un 8e bien = éditer 5 fichiers. Cette duplication alimente les 3 chantiers (dette, fiabilité, évolutivité).

Objectif phase 1 : **une source de vérité des faits cœur**, consommée par les composants **les plus sujets aux bugs** (meta runtime + JSON-LD), + un **garde-fou de test** sur le reste, sans réécrire les fichiers géants (PublicSite 9 119 l.).

## 1. Module canonique `src/data/biens.js`

Données **pures** (aucune dépendance React/JSX/`import.meta`/DOM) → importable par les 3 runtimes (React/Vite, Cloudflare Pages Functions/esbuild, script Node prerender).

Schéma par bien (les champs qui drift aujourd'hui) :

| Champ | Type | Note |
|---|---|---|
| `id` | string | clé (amaryllis, zandoli, …) |
| `nom` | string | nom canonique exact (Schœlcher avec œ) |
| `type` | enum | `villa`\|`logement`\|`cocon`\|`studio`\|`appartement` — nomenclature (villa = Amaryllis + Iguana uniquement) |
| `prix` | number | €/nuit de référence |
| `capacite` | number | personnes max |
| `chambres` | number | |
| `sdb` | number | salles de bain (optionnel) |
| `lieu` | string | commune (Sainte-Luce / Schœlcher / Nogent-sur-Marne) |
| `postal` | string | code postal |
| `coords` | `{lat,lng}` | géo |
| `rating` | number | note moyenne (ex. 4.94) |
| `reviews` | number | nb d'avis |
| `bookable` | bool | réservable court séjour (Iguana = `false`, longue durée) |
| `photos` | string[] | chemins `/photos/<id>/NN.webp` |
| `seoTitle` | string ≤60c | titre meta de la fiche |
| `seoDesc` | string ≤158c | description meta de la fiche |

Exports : `BIENS` (objet keyé par id), `ALL_BIENS` (array ordonné), `VILLAS` (ids type=villa), `getBien(id)`. Valeurs reprises **fidèlement** de l'existant (source de référence = combinaison `_biens.js` pour les faits + `prerender.mjs`/`functions/[slug].js` pour coords/rating/SEO ; **Iguana `bookable:false`**).

## 2. Consommateurs migrés en phase 1 (les bug-prone)

1. **`functions/[slug].js`** — supprimer les tables locales `BIENS` (prix) et `SEO` (title/desc) ; importer le canonique et lire `seoTitle`/`seoDesc`/`prix`/coords/rating/etc. Les handlers de fiches biens construisent meta + JSON-LD (VacationRental) depuis le canonique. ⚠️ Footgun #1 : `functions/[slug].js` **fait foi** pour la meta → vérifier en live au curl après deploy.
2. **`scripts/prerender.mjs`** — remplacer les args inline de `buildVacationRentalLd(...)` et les `title`/`desc` des routes biens par les valeurs du canonique. (Cohérence runtime ↔ prerender garantie puisque même source.)
3. **`functions/api/_biens.js`** — importer le canonique pour les faits cœur ; **conserver uniquement** le texte de grounding LLM (`equip`, `interdit`, `EQUIP_RULES_TEXT`). L'export `BIENS` de `_biens.js` reste disponible (interface inchangée pour `agents-run.js` etc.) mais ses valeurs cœur viennent du canonique.

## 3. Garde-fou de cohérence (test)

`src/__tests__/biens-consistency.test.js` (vitest — des tests existent déjà : `calculations.test.js`, `triage.test.js`…). Vérifie que les tables **non encore migrées** collent au canonique sur les champs cœur :
- `src/PublicSite.jsx` `BIENS` : `prix`, `capacite`, `nom`, `type`, `coords` identiques au canonique.
- `src/App.jsx` `BIENS_DEVIS` (et `SEED_BIENS` si comparable) : `prix`/`nom` cohérents.

→ Tant que la phase 2 n'a pas migré ces tables, **tout drift futur échoue le test**. Le test est ajouté au build/CI (chantier 3 ultérieur).

## 4. Périmètre

**INCLUS (phase 1) :** module canonique + migration `functions/[slug].js` + `prerender.mjs` + `_biens.js` + test de cohérence.

**EXCLU (phase 2, spec suivant) :** migrer le display riche de `PublicSite.jsx` (`BIENS`) et les seeds de `App.jsx` (`SEED_BIENS`/`BIENS_DEVIS`/`BIENS_CAUTION`) pour qu'ils dérivent du canonique → un 8e bien = un seul endroit. (En phase 1, ces tables restent locales mais sont **gardées par le test**.)

## 5. Risque technique #1 — à valider en 1ʳᵉ étape

**Les Functions Cloudflare Pages peuvent-elles importer `src/data/biens.js` ?** (bundling esbuild ; aujourd'hui aucun import functions→src n'existe). 
- **Validation (5 min)** : ajouter un import du canonique dans `functions/[slug].js`, lancer `npm run build` + un déploiement de test, vérifier au curl que la fiche bien rend la bonne meta.
- **Fallback si l'import échoue** : placer le canonique à un chemin neutre résolu par les 2 bundlers (ex. garder dans `src/data/` et importer en relatif depuis functions ; ou faire de `functions/api/_biens.js` le ré-exporteur que les functions importent et que `src/`/`prerender` importent aussi). Documenté dans le plan.

## 6. Garde-fous projet (rappels)

- Meta des biens : `functions/[slug].js` **fait foi** → éditer + vérifier live (curl `<title>` ≤60c, desc ≤158c).
- Nomenclature « villa » = Amaryllis + Iguana **uniquement**.
- Iguana = **bookable:false** (longue durée uniquement) — cf. `docs/ERREURS-LOG.md`.
- Déploiement **uniquement** `npm run deploy:pages` ; anti-cache (ne pas marteler le bundle après deploy, vérifier via cache-bust).
- Valeurs canoniques reprises **à l'identique** de l'existant (aucun changement de prix/faits dans ce chantier — pure unification).

## 7. Unités & interfaces

| Unité | Rôle | Dépend de |
|---|---|---|
| `src/data/biens.js` | Source de vérité des faits cœur + helpers | — (pur) |
| `functions/api/_biens.js` | Faits cœur (depuis canonique) + grounding LLM | canonique |
| `functions/[slug].js` | Meta + JSON-LD fiches biens (depuis canonique) | canonique |
| `scripts/prerender.mjs` | JSON-LD + meta prérendus (depuis canonique) | canonique |
| `src/__tests__/biens-consistency.test.js` | Garde-fou anti-drift (PublicSite/App vs canonique) | canonique + tables locales |

**Critère d'acceptation :** build vert (3 runtimes) ; fiches biens en live = mêmes meta/JSON-LD qu'avant (aucune régression — valeurs identiques) ; `functions/[slug].js` et `prerender.mjs` n'ont plus de prix/faits codés en dur (ils lisent le canonique) ; test de cohérence passe ; ajouter un bien fictif au canonique le ferait apparaître côté meta/JSON-LD sans toucher functions/prerender.
