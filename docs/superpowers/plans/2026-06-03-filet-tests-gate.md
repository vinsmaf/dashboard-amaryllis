# Filet de tests + gate deploy — Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Étapes en `- [ ]`.

**Goal :** lancer la suite vitest comme barrière au déploiement + couvrir par des tests les calculs argent côté voyageur (remises, total séjour, commissions).

**Tech Stack :** vitest (`npm run test:run`), bash (deploy-pages.sh), React/Vite.

> Garde-fous : extraction = valeurs identiques (zéro changement de comportement) ; build vert ; `npm run deploy:pages` uniquement ; pas de `git add -A`.

---

## Task 1 : Extraire les calculs prix dans `src/utils/pricing.js`

**Files:** Create `src/utils/pricing.js` · Modify `src/PublicSite.jsx`

- [ ] **Step 1 : Créer `src/utils/pricing.js`** (logique reprise À L'IDENTIQUE de PublicSite l.62-72 + l.1234-1237) :
```js
// src/utils/pricing.js — calculs argent côté voyageur (purs, testables).
// Remises par durée de séjour, appliquées sur le sous-total.
export function getDiscount(nights) {
  if (nights >= 28) return 0.15; // -15% pour 28+ nuits
  if (nights >= 14) return 0.10; // -10% pour 14+ nuits
  if (nights >= 7)  return 0.05; // -5%  pour 7+  nuits
  return 0;
}
export function discountLabel(nights) {
  if (nights >= 28) return "mensuel";
  if (nights >= 14) return "2 semaines";
  return "semaine";
}
// Total séjour : somme des prix nuitées − remise (arrondie) + frais de ménage.
// nightlyPrices : tableau des prix par nuit (déjà résolus depuis Beds24 ou fallback).
export function computeStayTotal(nightlyPrices, fraisMenage = 0) {
  const nights = Array.isArray(nightlyPrices) ? nightlyPrices.length : 0;
  if (nights <= 0) return { nights: 0, rawTotal: 0, discountRate: 0, discountAmt: 0, total: 0 };
  const rawTotal = nightlyPrices.reduce((s, p) => s + (p || 0), 0);
  const discountRate = getDiscount(nights);
  const discountAmt = Math.round(rawTotal * discountRate);
  const total = rawTotal - discountAmt + (fraisMenage || 0);
  return { nights, rawTotal, discountRate, discountAmt, total };
}
```
- [ ] **Step 2 : Câbler `PublicSite.jsx`** : importer `{ getDiscount, discountLabel, computeStayTotal }` depuis `./utils/pricing.js` ; SUPPRIMER les définitions locales `getDiscount`/`discountLabel` (l.62-72) ; remplacer le calcul inline (l.1234-1237 `discountRate`/`discountAmt`/`computedTotal`) en réutilisant `getDiscount` (garder `rawTotal` via useMemo tel quel, c'est React). ⚠️ Comportement identique : `computedTotal = nights>0 ? rawTotal - Math.round(rawTotal*getDiscount(nights)) + fraisMenage : 0`. (Utiliser `computeStayTotal` n'est pas obligatoire dans PublicSite si `rawTotal` reste un useMemo ; au minimum réutiliser `getDiscount`/`discountLabel` importés et NE PAS garder de copie locale.)
- [ ] **Step 3 : Build** — `npm run build 2>&1 | grep -iE "error|✓ built"` → `✓ built`, 0 erreur.
- [ ] **Step 4 : Vérifier qu'aucune déf locale ne subsiste** — `grep -nE "^function getDiscount|^function discountLabel" src/PublicSite.jsx` → vide.
- [ ] **Step 5 : Commit** — `git add src/utils/pricing.js "src/PublicSite.jsx" && git commit -m "refactor(pricing): extrait getDiscount/discountLabel/computeStayTotal dans utils (testable)"`

---

## Task 2 : Tests `src/utils/pricing.test.js`

**Files:** Create `src/utils/pricing.test.js`

- [ ] **Step 1 : Écrire les tests**
```js
import { describe, it, expect } from "vitest";
import { getDiscount, discountLabel, computeStayTotal } from "./pricing.js";

describe("getDiscount — bornes", () => {
  it("0% sous 7 nuits", () => { expect(getDiscount(1)).toBe(0); expect(getDiscount(6)).toBe(0); });
  it("5% à 7 nuits", () => { expect(getDiscount(7)).toBe(0.05); expect(getDiscount(13)).toBe(0.05); });
  it("10% à 14 nuits", () => { expect(getDiscount(14)).toBe(0.10); expect(getDiscount(27)).toBe(0.10); });
  it("15% à 28 nuits", () => { expect(getDiscount(28)).toBe(0.15); expect(getDiscount(60)).toBe(0.15); });
});

describe("discountLabel", () => {
  it("semaine / 2 semaines / mensuel", () => {
    expect(discountLabel(6)).toBe("semaine");
    expect(discountLabel(14)).toBe("2 semaines");
    expect(discountLabel(28)).toBe("mensuel");
  });
});

describe("computeStayTotal", () => {
  it("0 nuit -> tout à 0", () => {
    expect(computeStayTotal([], 60)).toEqual({ nights: 0, rawTotal: 0, discountRate: 0, discountAmt: 0, total: 0 });
  });
  it("3 nuits à 100 sans remise + ménage 60", () => {
    const r = computeStayTotal([100, 100, 100], 60);
    expect(r.rawTotal).toBe(300); expect(r.discountRate).toBe(0); expect(r.total).toBe(360);
  });
  it("7 nuits à 200 -> -5% arrondi + ménage", () => {
    const r = computeStayTotal(Array(7).fill(200), 50);
    expect(r.rawTotal).toBe(1400); expect(r.discountRate).toBe(0.05);
    expect(r.discountAmt).toBe(70); expect(r.total).toBe(1400 - 70 + 50);
  });
  it("prix nuitées variables (Beds24)", () => {
    const r = computeStayTotal([180, 220, 200], 0);
    expect(r.rawTotal).toBe(600); expect(r.total).toBe(600);
  });
  it("arrondi de la remise (banker-free, Math.round)", () => {
    const r = computeStayTotal(Array(14).fill(111), 0); // 1554 * 0.10 = 155.4 -> 155
    expect(r.discountAmt).toBe(155); expect(r.total).toBe(1554 - 155);
  });
});
```
- [ ] **Step 2 : Lancer** — `npm run test:run -- pricing 2>&1 | tail -15` → PASS.
- [ ] **Step 3 : Commit** — `git add src/utils/pricing.test.js && git commit -m "test(pricing): remises durée + total séjour + arrondi"`

---

## Task 3 : Tests `src/config/canauxCommissions.test.js`

**Files:** Create `src/config/canauxCommissions.test.js`

- [ ] **Step 1 : Écrire les tests** (d'après les exports réels de `canauxCommissions.js`)
```js
import { describe, it, expect } from "vitest";
import { airbnbComm, commissionTaux, AIRBNB_COMM_DEFAUT, BOOKING_COMM, FRAIS_STRIPE } from "./canauxCommissions.js";

describe("airbnbComm — par bien", () => {
  it("15% pour amaryllis et nogent", () => { expect(airbnbComm("amaryllis")).toBe(0.15); expect(airbnbComm("nogent")).toBe(0.15); });
  it("3% pour geko/zandoli/mabouya/schoelcher/iguana", () => {
    ["geko","zandoli","mabouya","schoelcher","iguana"].forEach(id => expect(airbnbComm(id)).toBe(0.03));
  });
  it("défaut 15% pour bien inconnu", () => { expect(airbnbComm("inconnu")).toBe(AIRBNB_COMM_DEFAUT); expect(AIRBNB_COMM_DEFAUT).toBe(0.15); });
});

describe("commissionTaux — par canal", () => {
  it("airbnb = taux par bien", () => { expect(commissionTaux("airbnb","amaryllis")).toBe(0.15); expect(commissionTaux("airbnb","geko")).toBe(0.03); });
  it("booking = 17% partout", () => { expect(commissionTaux("booking","geko")).toBe(0.17); expect(BOOKING_COMM).toBe(0.17); });
  it("direct/beds24/autre = 0%", () => { expect(commissionTaux("direct","amaryllis")).toBe(0); expect(commissionTaux("beds24","geko")).toBe(0); });
});

describe("net encaissé", () => {
  it("net direct = total - frais Stripe", () => {
    const total = 1000; const net = total * (1 - FRAIS_STRIPE);
    expect(FRAIS_STRIPE).toBe(0.015); expect(net).toBe(985);
  });
  it("net Airbnb amaryllis = total * (1 - 0.15)", () => {
    expect(1000 * (1 - commissionTaux("airbnb","amaryllis"))).toBe(850);
  });
});
```
- [ ] **Step 2 : Lancer** — `npm run test:run -- canauxCommissions 2>&1 | tail -15` → PASS.
- [ ] **Step 3 : Commit** — `git add src/config/canauxCommissions.test.js && git commit -m "test(commissions): taux par canal/bien + net encaissé"`

---

## Task 4 : Gate vitest dans `deploy-pages.sh`

**Files:** Modify `scripts/deploy-pages.sh`

- [ ] **Step 1 : Repérer le début du script** (après `set -euo pipefail` et le garde anti-projet, AVANT le `npm run build`). Insérer le bloc gate :
```bash
# ── 0. GATE TESTS — barrière dure : aucun déploiement si la suite échoue ──
echo "🧪 Tests unitaires (gate)…"
if ! npm run test:run >/tmp/vitest-gate.log 2>&1; then
  echo "❌ Tests en échec — déploiement ANNULÉ. Détail :"
  tail -30 /tmp/vitest-gate.log
  exit 1
fi
echo "   ✅ Suite de tests verte"
```
  (Placer ce bloc juste avant l'étape de build. Repérer la ligne `npm run build` ou équivalente dans le script et insérer au-dessus.)
- [ ] **Step 2 : Vérifier la syntaxe bash** — `bash -n scripts/deploy-pages.sh && echo "syntaxe OK"`.
- [ ] **Step 3 : Test du gate (échec simulé)** — créer un test bidon qui échoue, lancer `npm run test:run` pour confirmer exit≠0 : `npx vitest run -t "___nope___" 2>&1 | tail -3 || echo "exit non-zero OK"`. (Ne PAS casser un vrai test ; juste confirmer que `test:run` renvoie non-zéro quand un test échoue — connu.)
- [ ] **Step 4 : Commit** — `git add scripts/deploy-pages.sh && git commit -m "ci(deploy): gate vitest — bloque le déploiement si un test échoue"`

---

## Task 5 : Déploiement (le gate s'exécute) + vérification

**Files:** aucun

- [ ] **Step 1 : Lancer la suite complète localement** — `npm run test:run 2>&1 | tail -6` → tout vert (sinon corriger avant deploy).
- [ ] **Step 2 : Déployer** — `npm run deploy:pages 2>&1 | grep -iE "Tests unitaires|Suite de tests verte|Deployment complete|Smoke test OK|❌"` → doit afficher « Suite de tests verte » PUIS « Deployment complete ».
- [ ] **Step 3 : Mémoire** — noter dans `PROJECT_MEMORY.md` : le déploiement a désormais un gate vitest (tests rouges = deploy bloqué) ; calculs argent (remises/total/commissions) couverts. Commit.

---

## Self-review
- Gate deploy → Task 4 ✅ · calculs argent extraits+testés → Task 1/2 ✅ · commissions → Task 3 ✅ · acompte/solde → optionnel (noté Task hors-périmètre si pas de logique existante) · deploy+vérif → Task 5 ✅.
- Cohérence : `getDiscount`/`discountLabel`/`computeStayTotal` définis Task 1, importés/testés Task 2 ; exports `airbnbComm`/`commissionTaux`/`BOOKING_COMM`/`FRAIS_STRIPE` testés Task 3 = ceux réellement exportés par canauxCommissions.js.
