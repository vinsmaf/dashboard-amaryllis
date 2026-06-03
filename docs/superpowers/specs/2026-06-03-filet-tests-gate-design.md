# Design — Filet de tests + gate au déploiement (chantier 2 : Fiabilité données)

**Date :** 2026-06-03 · **Programme Robustesse**, chantier 2/3.

## 0. Problème
`scripts/deploy-pages.sh` exécute build + smoke tests + revue de code, **mais ne lance jamais la suite vitest** : une régression de calcul peut partir en prod. De plus, les **calculs « argent » côté voyageur** (remises durée, total séjour, commissions par canal) ne sont **pas testés** — or ce sont eux qui facturent le client / pilotent la marge.

## 1. Solution
1. **Gate** : `npm run test:run` en **barrière dure** au début de `deploy-pages.sh` (avant le build ; `set -euo pipefail` déjà actif). Tests rouges → déploiement avorté avec message ❌ clair.
2. **Extraction + tests des calculs argent** (pures, mêmes valeurs, zéro changement de comportement) :
   - `src/utils/pricing.js` : `getDiscount(nights)`, `discountLabel(nights)`, `computeStayTotal(nightlyPrices, fraisMenage)` — extraits de `PublicSite.jsx` (l.62-72 + l.1234-1237). `PublicSite` les importe (DRY).
   - Tests `src/utils/pricing.test.js` : bornes de remise (6/7, 13/14, 27/28 nuits), total = `rawTotal − round(rawTotal×taux) + fraisMenage`, 0 nuit → 0, fallback prix.
   - Tests `src/config/canauxCommissions.test.js` : `airbnbComm` par bien (15% amaryllis/nogent, 3% autres), `commissionTaux` par canal (booking 17%, direct 0%), `FRAIS_STRIPE`, calcul net.
   - **Acompte/solde** : si une logique de split (40/60 éditable) existe en clair (App.jsx DevisPage), l'extraire en `splitAcompteSolde(total, acomptePct)` + test ; sinon hors périmètre (pas de code mort).

## 2. Périmètre
INCLUS : gate deploy + `pricing.js`/`pricing.test.js` + `canauxCommissions.test.js` (+ acompte/solde si logique existante). EXCLU : taxe de séjour (n'existe pas dans le code), réécriture large de PublicSite (extraction ciblée de fonctions pures uniquement), autres sous-chantiers fiabilité (imports idempotents, locale FR) → plus tard.

## 3. Garde-fous
- Extraction = **valeurs identiques** (les tests verrouillent ; build vert avant/après).
- Le gate ne doit pas ralentir abusivement : `vitest run` (pas watch), quelques secondes.
- Déploiement `npm run deploy:pages` uniquement.

## 4. Critère d'acceptation
`deploy-pages.sh` bloque si un test échoue (vérifié en cassant volontairement un test puis en relançant) ; `pricing.js` utilisé par PublicSite (plus de défs locales dupliquées) ; suite vitase verte ; nouveaux tests couvrent remises/total/commissions. Une régression sur un calcul argent fait désormais échouer le déploiement.
