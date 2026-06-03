# Design — Source unique des biens (phase 2 : PublicSite)

**Date :** 2026-06-03
**Suite de :** `2026-06-03-biens-source-unique-design.md` (phase 1 livrée : canonique `src/data/biens.js` consommé par functions/[slug].js, prerender, _biens.js + test).
**Approche retenue :** Fusion minimale (validée). Noms d'affichage publics inchangés (validé).

## 0. Problème (résiduel après phase 1)

`src/PublicSite.jsx` `const BIENS = [...]` (l.245) reste la **dernière source dupliquée des FAITS** des biens (prix, capacité, chambres, lieu, coords, rating, reviews) — elle alimente l'affichage public ET le JSON-LD client (l.7963+). C'est un risque de drift (déjà constaté : coords PublicSite ≠ coords que la phase 1 a mises dans le canonique). Objectif : que ces faits viennent du canonique, sans réécrire le contenu d'affichage riche.

## 1. Périmètre

**INCLUS :**
- `src/PublicSite.jsx` `const BIENS` : les **faits partagés** sont injectés depuis le canonique par fusion ; le contenu d'affichage riche reste local.
- Le **JSON-LD client** de PublicSite (VacationRental/aggregateRating/coords, l.7963+) : doit lire les faits depuis `BIENS` fusionné (donc du canonique). Si des faits y sont codés en dur, les recâbler sur `BIENS`.
- **Prérequis** : aligner les `coords` du canonique sur les vraies coords de PublicSite (7 biens) — corrige aussi le micro-écart introduit en phase 1.

**EXCLU (et pourquoi) :**
- **Contenu d'affichage** (`descFull`, `desc`/`descEn`, `avis`, galeries `photos`, `amenities`/`amenitiesEn`, `airbnbTitle`, `tag`/`tagEn`, `couleur`, `mapsEmbed`, `lits`, `sdb`) : présent **nulle part ailleurs** → ne drift pas → reste local dans PublicSite. L'y centraliser ne résoudrait aucun bug et gonflerait le canonique.
- **`src/App.jsx` `SEED_BIENS`/`BIENS_DEVIS`/`BIENS_CAUTION`** : données **financières** (revenus/cashflow/occ/adr) + libellés admin volontairement distincts (« T2 Nogent », « Geko »), sans prix/capacité. Ne duplique pas les faits du canonique → **hors périmètre**.
- **`nom`** affiché : décision = garder l'affichage actuel de PublicSite (« Mabouya », « Bellevue », « Appartement Nogent »). Le merge **n'injecte pas `nom`**. Le canonique conserve ses noms précis (« Studio Mabouya »…) pour le SEO/JSON-LD serveur. Écart assumé display↔structured-data.

## 2. Mécanique de fusion

Dans `PublicSite.jsx` :
```js
import { BIENS as CANON, isMartinique } from "./data/biens.js";

// Faits partagés tirés du canonique (source unique). N'inclut PAS `nom` (display conservé).
function canonFacts(id) {
  const c = CANON[id];
  return {
    prix: c.prix,
    capacite: c.capacite,
    chambres: c.chambres,
    lieu: `${c.lieu}, ${isMartinique(c) ? "Martinique" : "Île-de-France"}`,
    coords: c.coords,
    rating: String(c.rating).replace(".", ","), // format d'affichage FR conservé (« 4,94 »)
    reviews: c.reviews,
    bookable: c.bookable,
  };
}

const BIENS = [
  { id: "amaryllis", nom: "Villa Amaryllis", airbnbTitle: "...", desc: "...", descFull: [...],
    lits: 3, sdb: "3,5", couleur: "#e91e8c", photos: [...], mapsEmbed: "...",
    amenities: [...], amenitiesEn: [...], avis: [...], ...canonFacts("amaryllis") },
  // … 6 autres biens, chacun : champs d'affichage locaux + ...canonFacts(id)
];
```
Le spread `...canonFacts(id)` en **fin d'objet** garantit que les faits partagés écrasent toute valeur résiduelle. On **retire** des objets PublicSite les clés désormais fournies par `canonFacts` (prix/capacite/chambres/lieu/coords/rating/reviews) pour qu'il n'y ait qu'une définition.

## 3. JSON-LD client PublicSite

Vérifier les blocs `application/ld+json` (l.7963-8090) : ils doivent dériver les faits (coords, rating, reviewCount, prix) de `BIENS` (donc du canonique). Tout fait codé en dur y est recâblé sur l'objet bien. Les `aggregateRating` « 5 / 20 » génériques de l'org (non liés à un bien précis) sont hors périmètre.

## 4. Garde-fous

- **Zéro changement visible** attendu (hors correction des coords vers les vraies valeurs) : prix/capacité/notes affichés identiques. `rating` reste au format « 4,94 ».
- Le test `src/__tests__/biens-consistency.test.js` doit **continuer à passer** ; l'enrichir pour comparer aussi `coords` PublicSite↔canonique (désormais alignés) et idéalement `rating`/`reviews`.
- Build vert (vite + prerender + wrangler functions) ; suite vitest verte.
- `nom` PublicSite **non touché** (décision produit).
- Déploiement `npm run deploy:pages` uniquement + anti-cache + vérif live curl (coords/rating fiche bien inchangés côté affichage).

## 5. Réconciliation coords (canonique ← PublicSite, valeurs réelles)

| Bien | coords canonique (à mettre) |
|---|---|
| amaryllis | 14.4732, -60.9196 |
| zandoli | 14.4725, -60.9201 |
| iguana | 14.4718, -60.9188 |
| geko | 14.4729, -60.9194 |
| mabouya | 14.4741, -60.9209 |
| schoelcher | 14.6121, -61.0887 |
| nogent | 48.8374, 2.4836 (déjà OK) |

## 6. Critère d'acceptation

`PublicSite.BIENS` n'a plus de définition propre des faits partagés (ils viennent de `canonFacts`/canonique) ; le JSON-LD client lit ces faits ; coords canonique = coords réelles PublicSite ; build + tests verts ; site live inchangé à l'affichage (prix/capacité/notes), coords JSON-LD = valeurs réelles. Ajouter un 8e bien = 1 entrée canonique + 1 bloc d'affichage PublicSite (plus aucune resaisie de prix/capacité/coords/note).
