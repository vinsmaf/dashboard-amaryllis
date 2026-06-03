# Imports idempotents + audit locale — Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Étapes en `- [ ]`.
> ⚠️ Apps Script (GAS) : NON testable en vitest, NON exécutable en local. La logique PURE est testée (vitest) ; le GAS la mirroir à l'identique. Déploiement = `clasp` (Sheet live) → changement conservateur + vérif Vincent.

**Goal :** rendre l'import des réservations et le comptage des revenus idempotents par **clé-contenu** (`bienId|checkin|checkout`), pour tuer la classe « même nuitée comptée plusieurs fois ».

---

## Task 1 : Module pur `src/utils/resaDedup.js` + tests

**Files:** Create `src/utils/resaDedup.js` · Create `src/utils/resaDedup.test.js`

- [ ] **Step 1 : Créer `src/utils/resaDedup.js`**
```js
// src/utils/resaDedup.js
// Clé de dédoublonnage stable d'une réservation, par CONTENU (indépendante de l'id).
// Une nuitée ne peut pas être légitimement double-bookée → même clé = même séjour.
// ⚠️ Cette logique est MIRROIRÉE à l'identique dans appscript/SCRIPT_SHEETS.js et
//    appscript/REVENUS_AUTO_2026.gs (GAS ne peut pas importer Node) — garder synchronisé.

// Normalise une date en "YYYY-MM-DD" (accepte string ISO, "YYYY-MM-DD...", ou Date).
export function normDate(v) {
  if (v == null) return "";
  if (v instanceof Date && !isNaN(v)) {
    return v.getUTCFullYear() + "-" +
      String(v.getUTCMonth() + 1).padStart(2, "0") + "-" +
      String(v.getUTCDate()).padStart(2, "0");
  }
  return String(v).slice(0, 10);
}

export function dedupKey({ bienId, checkin, checkout }) {
  return String(bienId || "").toLowerCase().trim() + "|" + normDate(checkin) + "|" + normDate(checkout);
}

// Garde une seule réservation par clé-contenu (la dernière l'emporte). Préserve l'ordre.
export function dedupeReservations(list) {
  const seen = new Map();
  for (const r of (Array.isArray(list) ? list : [])) {
    seen.set(dedupKey(r), r);
  }
  return [...seen.values()];
}
```
- [ ] **Step 2 : Créer `src/utils/resaDedup.test.js`**
```js
import { describe, it, expect } from "vitest";
import { dedupKey, normDate, dedupeReservations } from "./resaDedup.js";

describe("normDate", () => {
  it("string ISO -> YYYY-MM-DD", () => { expect(normDate("2026-07-01")).toBe("2026-07-01"); expect(normDate("2026-07-01T12:00:00Z")).toBe("2026-07-01"); });
  it("Date -> YYYY-MM-DD (UTC)", () => { expect(normDate(new Date(Date.UTC(2026, 6, 1)))).toBe("2026-07-01"); });
  it("vide", () => { expect(normDate(null)).toBe(""); expect(normDate("")).toBe(""); });
});

describe("dedupKey", () => {
  it("stable, insensible à la casse du bien", () => {
    expect(dedupKey({ bienId: "Geko", checkin: "2026-07-01", checkout: "2026-07-04" }))
      .toBe(dedupKey({ bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" }));
  });
  it("clé identique pour la même nuitée à ids différents (le cas ami coco)", () => {
    const a = { id: "uuid-123", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" };
    const b = { id: "beds24-999", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" };
    expect(dedupKey(a)).toBe(dedupKey(b));
  });
  it("clés différentes si dates ou bien diffèrent", () => {
    expect(dedupKey({ bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" }))
      .not.toBe(dedupKey({ bienId: "geko", checkin: "2026-07-02", checkout: "2026-07-04" }));
    expect(dedupKey({ bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" }))
      .not.toBe(dedupKey({ bienId: "zandoli", checkin: "2026-07-01", checkout: "2026-07-04" }));
  });
});

describe("dedupeReservations", () => {
  it("fusionne les doublons de contenu (3 -> 1)", () => {
    const list = [
      { id: "a", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" },
      { id: "b", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" },
      { id: "c", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" },
    ];
    expect(dedupeReservations(list)).toHaveLength(1);
  });
  it("garde les distincts", () => {
    const list = [
      { id: "a", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" },
      { id: "b", bienId: "zandoli", checkin: "2026-07-01", checkout: "2026-07-04" },
    ];
    expect(dedupeReservations(list)).toHaveLength(2);
  });
});
```
- [ ] **Step 3 : Lancer** — `npm run test:run -- resaDedup 2>&1 | tail -15` → PASS.
- [ ] **Step 4 : Commit** — `git add src/utils/resaDedup.js src/utils/resaDedup.test.js && git commit -m "feat(resa): clé de dédoublonnage par contenu (pure, testée) — mirroir GAS"`

---

## Task 2 : Dédup-contenu dans `importAllReservations_` (GAS)

**Files:** Modify `appscript/SCRIPT_SHEETS.js`

- [ ] **Step 1 : Ajouter un helper GAS** (en haut du fichier ou juste avant `importAllReservations_`), mirroir de `resaDedup.js` :
```js
// ── Clé de dédoublonnage par contenu (mirroir src/utils/resaDedup.js) ──
function normDate_(v) {
  if (v == null) return "";
  if (v instanceof Date && !isNaN(v)) {
    return v.getUTCFullYear() + "-" + String(v.getUTCMonth() + 1).padStart(2, "0") + "-" + String(v.getUTCDate()).padStart(2, "0");
  }
  return String(v).slice(0, 10);
}
function dedupKey_(bienId, checkin, checkout) {
  return String(bienId || "").toLowerCase().trim() + "|" + normDate_(checkin) + "|" + normDate_(checkout);
}
```
- [ ] **Step 2 : Dans `importAllReservations_`**, après la construction de `existingIds` (l.454-460), lire les colonnes utiles et bâtir un index **par clé-contenu**. Remplacer le bloc d'index existant par :
```js
  // Index des lignes existantes — par ID ET par clé-contenu (bien|checkin|checkout)
  var lastRow = sheet.getLastRow();
  var existingIds = {}, existingByContent = {};
  // map label -> bienId (inverse de BIEN_LABELS défini plus bas — dupliqué ici pour l'index)
  var LABEL_TO_BIENID = { "T2 Nogent":"nogent", "Villa Amaryllis":"amaryllis", "Villa Iguana":"iguana", "Geko":"geko", "Zandoli":"zandoli", "Mabouya":"mabouya", "T2 Schoelcher":"schoelcher" };
  if (lastRow > 1) {
    var existRows = sheet.getRange(2, 1, lastRow - 1, 6).getValues(); // ID, Propriété, Voyageur, Canal, Arrivée, Départ
    existRows.forEach(function(er, i) {
      var rowNum = i + 2;
      if (er[0]) existingIds[String(er[0])] = rowNum;
      var bId = LABEL_TO_BIENID[er[1]] || String(er[1] || "").toLowerCase();
      var ck = dedupKey_(bId, er[4], er[5]);
      if (ck && ck !== "||") existingByContent[ck] = rowNum;
    });
  }
```
- [ ] **Step 3 : Dans la boucle `reservations.forEach`**, calculer la clé-contenu et chercher par id OU contenu. Remplacer `var existingRow = existingIds[id];` (l.508) par :
```js
    var contentK = dedupKey_(r.bienId, r.checkin || r.arrival, r.checkout || r.departure);
    var existingRow = existingIds[id] || (contentK && contentK !== "||" ? existingByContent[contentK] : null);
```
  Et après l'`appendRow` (branche else, après `existingIds[id] = sheet.getLastRow();`), enregistrer aussi la clé-contenu :
```js
      if (contentK && contentK !== "||") existingByContent[contentK] = sheet.getLastRow();
```
- [ ] **Step 4 : Vérif syntaxe locale** — `node -e "require('fs').readFileSync('appscript/SCRIPT_SHEETS.js','utf8'); console.log('lecture OK')"` puis `node --check appscript/SCRIPT_SHEETS.js && echo "syntaxe JS OK"` (le fichier est du JS GAS classique, node --check valide la syntaxe sans exécuter).
- [ ] **Step 5 : Commit** — `git add appscript/SCRIPT_SHEETS.js && git commit -m "fix(resa): importAllReservations idempotent par clé-contenu (anti-doublon id)"`

---

## Task 3 : Memo idempotent par contenu dans REVENUS_AUTO (GAS)

**Files:** Modify `appscript/REVENUS_AUTO_2026.gs`

- [ ] **Step 1 : Ajouter le helper** `normDate_`/`contentKeyRow_` (mirroir) en haut du fichier (s'il n'existe pas déjà `normDate_` ; sinon réutiliser). `contentKeyRow_(row, C)` calcule la clé depuis une ligne brute :
```js
function normDate_(v) {
  if (v == null) return "";
  if (v instanceof Date && !isNaN(v)) {
    return v.getUTCFullYear() + "-" + String(v.getUTCMonth() + 1).padStart(2, "0") + "-" + String(v.getUTCDate()).padStart(2, "0");
  }
  return String(v).slice(0, 10);
}
function contentKeyRow_(row, C) {
  var bienId = BIEN_BY_LABEL[String(row[C.prop] || "").toLowerCase().trim()] || String(row[C.prop] || "").toLowerCase().trim();
  return bienId + "|" + normDate_(row[C.arrivee]) + "|" + normDate_(row[C.depart]);
}
```
- [ ] **Step 2 : Dans `scanSheet_`** (l.160-166), déduper par clé-contenu en plus de l'id. Remplacer :
```js
    var id = String(row[C.id] || ""); if (!id || processed[id]) return;
```
  par :
```js
    var id = String(row[C.id] || "");
    var ck = contentKeyRow_(row, C);
    if ((!id && !ck) || processed[id] || processed[ck]) return;
```
  et la marque `processed[id] = true;` (l.163) →
```js
    processed[id] = true;
    if (ck) processed[ck] = true;       // idempotence par contenu (même séjour, id différent)
```
  et `newIds.push(id)` → pousser AUSSI la clé-contenu pour la persister dans le memo :
```js
    if (!dryRun) { if (id) newIds.push(id); if (ck) newIds.push(ck); }
```
- [ ] **Step 3 : Dans `baselineSheet_`** (l.182-187), marquer l'existant par clé-contenu AUSSI (sinon les séjours déjà comptés seraient recomptés par leur clé). Remplacer le corps du forEach :
```js
  sh.getRange(2, 1, sh.getLastRow() - 1, C.ncols).getValues().forEach(function(r) {
    var id = String(r[C.id] || "");
    var ck = contentKeyRow_(r, C);
    if (id && !processed[id]) { processed[id] = true; baseline.push(id); }
    if (ck && !processed[ck]) { processed[ck] = true; baseline.push(ck); }
  });
```
  ⚠️ `baselineSheet_` lit aujourd'hui seulement la colonne 1 (`sh.getRange(2,1,...,1)`) — il faut lire `C.ncols` colonnes pour avoir prop/arrivée/départ. Adapter la signature : `baselineSheet_(ss, name, C, processed, baseline)` et l'appel dans `setupRevenus2026` (passer `COL_TOUTES`/`COL_RESA`). ⚠️ `setupRevenus2026` est exécuté une fois (déjà fait) — ce changement n'a d'effet qu'à un futur re-setup ; documenter qu'un re-setup n'est PAS nécessaire (le memo existant reste valide, les nouvelles clés s'ajoutent au fil de l'eau via scanSheet_).
- [ ] **Step 4 : Vérif syntaxe** — `node --check appscript/REVENUS_AUTO_2026.gs && echo "syntaxe OK"`.
- [ ] **Step 5 : Commit** — `git add appscript/REVENUS_AUTO_2026.gs && git commit -m "fix(revenus): idempotence par clé-contenu (anti double-comptage même séjour)"`

---

## Task 4 : Audit locale + déploiement clasp + vérification

**Files:** (audit) `appscript/*` · déploiement

- [ ] **Step 1 : Audit locale FR** — `grep -nE "setFormula|setValue\(.*\.|toFixed|\"\\.\"|replace\(" appscript/*.js appscript/*.gs | grep -iE "formula|\\." | head -30`. Si un `setFormula` écrit un décimal à point non converti → ajouter `frNum_(n)` (`return String(Math.round(n*100)/100).replace(".", ",");`) et l'utiliser. Sinon : noter « locale déjà OK » (appendCell_ couvert).
- [ ] **Step 2 : Suite vitest** (gate) — `npm run test:run 2>&1 | tail -5` → vert (resaDedup inclus).
- [ ] **Step 3 : Déployer le GAS** — `cd /Users/vincentsalomon/locatif-dashboard && node_modules/.bin/clasp push -f 2>&1 | tail -8` (push les 2 .gs). Puis web app : `node_modules/.bin/clasp deploy -i AKfycbw-t5kd_0f3OsEoDkOJHzYPHIBhWzz34aj7yagP57-Cj-7pLj6TiuRaUuusrCwAiA30Gg -d "imports idempotents clé-contenu" 2>&1 | tail -5`. ⚠️ Le trigger 15 min REVENUS_AUTO prend le HEAD dès le push.
- [ ] **Step 4 : Vérification (ACTION VINCENT)** — lui fournir la checklist : (a) lancer un sync 📊 depuis l'admin ; (b) onglet « Toutes les Réservations » = aucune nouvelle ligne doublon (même bien+dates) ; (c) onglet revenus 2026 cohérent (pas de saut de montant) ; (d) ajouter une résa de test 2× avec ids différents → doit rester 1 ligne. **Rollback** si souci : `git checkout HEAD~N -- appscript/ && clasp push -f && clasp deploy -i <id>`.
- [ ] **Step 5 : Mémoire** — `PROJECT_MEMORY.md` + `docs/ERREURS-LOG.md` : import + revenus désormais idempotents par clé-contenu `bienId|checkin|checkout` ; logique pure testée `src/utils/resaDedup.js` mirroir GAS ; locale déjà OK. Commit.

---

## Self-review
- Clé pure + tests → Task 1 ✅ · import idempotent → Task 2 ✅ · revenus idempotents → Task 3 ✅ · audit locale + deploy + vérif → Task 4 ✅.
- Cohérence : `dedupKey({bienId,checkin,checkout})` (JS) ≡ `dedupKey_(bienId,checkin,checkout)` (GAS) ≡ `contentKeyRow_` (REVENUS) — même formule `bienId.lower.trim | normDate(ci) | normDate(co)`. Mirroir à garder synchronisé (noté en commentaire dans les 3 fichiers).
- ⚠️ GAS non testé en local — couverture = logique pure (vitest) + changement conservateur + vérif Vincent post-deploy.
