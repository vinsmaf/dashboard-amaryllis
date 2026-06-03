# Raffinement — dates déjà réservées dans les recos RM — Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Étapes en `- [ ]`.

**Goal :** neutraliser les dates déjà réservées dans `calcDateReco` (flag `already_booked`, pas de fausse alerte vacance/last-minute, pas d'ajustement occupation), et alimenter le moteur avec les dates réservées du bien.

**Contexte :** `calcDateReco({...})` exporté dans `functions/api/rm-recommendations/[[path]].js`. Le recompute (`handleCalculate`) charge profils/règles/signaux + `ownOccupancy` (phase 2) et boucle `calcDateReco`. `/api/get-availability?bienId=X` renvoie `{ blockedDates: ["YYYY-MM-DD", ...] }` (dates réservées/bloquées).

> Garde-fous : advisory inchangé ; `calcDateReco` testé ; fail-soft (si get-availability échoue → `bookedDates` vide, comportement actuel).

---

## Task 1 : `calcDateReco` gère les dates réservées

**Files:** Modify `functions/api/rm-recommendations/[[path]].js`

- [ ] **Step 1 : Param** : ajouter `bookedDates = null` dans la destructuration de `calcDateReco({ ... ownOccupancy = null })`.
- [ ] **Step 2 : Calcul `isBooked`** en tête de la fonction (après le calcul de `leadTimeDays`, ≈ l.82) :
```js
  const isBooked = bookedDates && typeof bookedDates.has === "function" ? bookedDates.has(dateStr) : false;
```
- [ ] **Step 3 : Ne pas ajuster l'occupation sur une date réservée** — dans le bloc « 7b. Ajustement occupation », gater sur `!isBooked` :
```js
  if (ownOccupancy && !isBooked) {
    occInfo = occupancyAdjustment({ ... });
    ...
  }
```
- [ ] **Step 4 : Neutraliser risque/premium si réservé** — APRÈS le calcul de `vacancyRisk` (son clamp, ≈ l.273) et de `premiumOpportunity` (≈ l.284) :
```js
  if (isBooked) { vacancyRisk = 0; premiumOpportunity = 0; }
```
  (placer ces deux lignes après leurs clamps respectifs, ou une ligne combinée juste avant la section « 13. Alert flags ».)
- [ ] **Step 5 : Flag + summary** — section alertFlags : `if (isBooked) alertFlags.push("already_booked");` (les flags `vacancy_risk_high`/`last_minute_unbooked` ne se déclencheront plus car vacancyRisk=0). Dans summary, en tête de la partie « état » :
```js
  if (isBooked) summary += " 🔒 déjà réservé";
```
- [ ] **Step 6 : Champ retour** (optionnel, traçabilité) : ajouter `is_booked: isBooked ? 1 : 0` à l'objet retourné si la colonne existe ; sinon ne pas ajouter (le flag dans alert_flags suffit). NE PAS inventer de colonne DB.
- [ ] **Step 7 : Charger les dates réservées dans `handleCalculate`** — après le chargement de `ownOccupancy` (≈ l.418), avant la boucle :
```js
  let bookedDates = null;
  try {
    const base = (typeof BASE !== "undefined" && BASE) || "https://villamaryllis.com";
    const av = await fetch(`${base}/api/get-availability?bienId=${encodeURIComponent(property_id)}`);
    const j = await av.json();
    if (Array.isArray(j.blockedDates)) bookedDates = new Set(j.blockedDates);
  } catch {}
```
  ⚠️ Le moteur tourne dans une Function Cloudflare : `fetch` absolu vers villamaryllis.com fonctionne. Pas de `BASE` défini dans ce fichier → utiliser le littéral `"https://villamaryllis.com"` directement (simplifier le snippet). Puis passer `bookedDates` à `calcDateReco({ ..., ownOccupancy, bookedDates })`.
- [ ] **Step 8 : Builds** — `npm run build 2>&1 | grep -iE "error|✓ built"` + `npx wrangler pages functions build --outdir /tmp/rmrec2 2>&1 | tail -4` → OK. `rm -rf /tmp/rmrec2`.
- [ ] **Step 9 : Commit** — `git add "functions/api/rm-recommendations/[[path]].js" && git commit -m "feat(rm): neutralise les dates déjà réservées dans les recos (flag already_booked)"`

---

## Task 2 : Test `calcDateReco` — comportement date réservée

**Files:** Create `src/__tests__/rm-booked.test.js`

- [ ] **Step 1 : Écrire le test** (importe `calcDateReco` exporté ; fournit un `property` minimal + maps vides ; vérifie le flag + vacancy 0 + pas de own_occ sur une date réservée vs libre)
```js
import { describe, it, expect } from "vitest";
import { calcDateReco } from "../../functions/api/rm-recommendations/[[path]].js";

const property = { id: "geko", price_min: 5000, price_max: 30000, base_price_low: 12000, base_price_mid: 15000, base_price_high: 18000, min_stay_default: 2 };
const common = { property, profiles: [], rules: [], overridesMap: {}, holidayMap: {}, eventsForDate: [], signalMap: {}, today: "2026-07-01" };

describe("calcDateReco — dates réservées", () => {
  it("date réservée → flag already_booked + vacancy_risk 0", () => {
    const booked = new Set(["2026-07-05"]);
    const r = calcDateReco({ ...common, dateStr: "2026-07-05", ownOccupancy: { rate30: 0, rate90: 0 }, bookedDates: booked });
    const flags = JSON.parse(r.alert_flags);
    expect(flags).toContain("already_booked");
    expect(r.vacancy_risk_score).toBe(0);
    expect(flags).not.toContain("last_minute_unbooked");
    expect(flags.some((f) => String(f).startsWith("own_occ"))).toBe(false); // pas d'ajustement occupation sur date réservée
  });
  it("date libre (même bien occ 0%) → pas de already_booked, ajustement occupation appliqué", () => {
    const booked = new Set(["2026-07-05"]);
    const r = calcDateReco({ ...common, dateStr: "2026-07-10", ownOccupancy: { rate30: 0, rate90: 0 }, bookedDates: booked });
    const flags = JSON.parse(r.alert_flags);
    expect(flags).not.toContain("already_booked");
    expect(flags).toContain("own_occ_very_low"); // occ 0% sur date libre → ajustement
  });
  it("sans bookedDates → comportement inchangé (pas de already_booked)", () => {
    const r = calcDateReco({ ...common, dateStr: "2026-07-10", ownOccupancy: null, bookedDates: null });
    expect(JSON.parse(r.alert_flags)).not.toContain("already_booked");
  });
});
```
  ⚠️ Adapter le `property` minimal aux champs réellement lus par `getBasePrice`/`getMinStay` (lire ces helpers dans le fichier si le test échoue sur un prix `undefined`). Le `today` et `dateStr` choisissent le lead-time (>0).
- [ ] **Step 2 : Lancer** — `npm run test:run -- rm-booked 2>&1 | tail -20` → PASS. Si échec dû à des champs `property` manquants (NaN prix), compléter le mock d'après `getBasePrice` ; si échec dû à un vrai comportement, signaler.
- [ ] **Step 3 : Commit** — `git add src/__tests__/rm-booked.test.js && git commit -m "test(rm): calcDateReco neutralise les dates réservées"`

---

## Task 3 : Déploiement + vérification + mémoire

**Files:** aucun

- [ ] **Step 1 : Tests (gate)** — `npm run test:run 2>&1 | tail -5` → vert.
- [ ] **Step 2 : Déployer** — `npm run deploy:pages 2>&1 | grep -iE "Suite de tests verte|Deployment complete|Smoke test OK|❌"`.
- [ ] **Step 3 : Recompute Schœlcher (plein) + vérif** — `curl -s -X POST "https://villamaryllis.com/api/rm-recommendations/calculate" -H "Content-Type: application/json" -d '{"property_id":"schoelcher"}'` puis :
  `npx wrangler d1 execute revenue-manager --remote --command "SELECT date, vacancy_risk_score, alert_flags FROM rm_recommendations WHERE property_id='schoelcher' AND date >= date('now') ORDER BY date LIMIT 5"` → les dates réservées portent `already_booked` + `vacancy_risk_score=0`, plus de `last_minute_unbooked` sur celles-ci.
- [ ] **Step 4 : Mémoire** — `PROJECT_MEMORY.md` : raffinement livré (dates réservées neutralisées dans les recos via `get-availability` → `bookedDates`). Commit + push.

---

## Self-review
- `calcDateReco` gère booked → Task 1 ✅ · test → Task 2 ✅ · deploy+vérif → Task 3 ✅.
- Cohérence : `bookedDates` (Set) chargé depuis `get-availability` (mêmes blockedDates que phase 1) ; gate occupation sur `!isBooked` ; vacancy/premium=0 si booked ; fail-soft.
