# Occupation → moteur de reco RM (phase 2) — Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Étapes en `- [ ]`.

**Goal :** injecter NOTRE occupation réelle dans `calcDateReco` (advisory) pour que les prix conseillés tiennent compte du remplissage du bien.

> Garde-fous : advisory (status pending) ; prix clampé [min,max] ; logique pure testée ; ne touche QUE le moteur + son chargement de données.

---

## Task 1 : Module pur `src/utils/rmOccupancyAdjust.js` + tests

**Files:** Create `src/utils/rmOccupancyAdjust.js` · Create `src/utils/rmOccupancyAdjust.test.js`

- [ ] **Step 1 : Créer `src/utils/rmOccupancyAdjust.js`**
```js
// src/utils/rmOccupancyAdjust.js — ajustement prix conseillé selon NOTRE occupation réelle (advisory, pur).
// rate30/rate90 ∈ [0,1] ou null ; leadTimeDays = jours avant la date ; basePriceCents = prix de base (cents).
export function pickRate(rate30, rate90, leadTimeDays) {
  if (leadTimeDays <= 30) return rate30 == null ? null : rate30;
  if (leadTimeDays <= 90) return rate90 == null ? null : rate90;
  return null;
}

export function occupancyAdjustment({ rate30 = null, rate90 = null, leadTimeDays = 0, basePriceCents = 0 }) {
  const rate = pickRate(rate30, rate90, leadTimeDays);
  const none = { adjCents: 0, vacancyDelta: 0, premiumDelta: 0, label: null, suggestMinStay: false, pct: 0, rate: null };
  if (rate == null) return none;
  let pct = 0, vacancyDelta = 0, premiumDelta = 0, suggestMinStay = false, label = null;
  if (rate >= 0.85)      { pct = 0.10;  premiumDelta = 30; vacancyDelta = -20; label = "occ_high"; }
  else if (rate >= 0.70) { pct = 0.05;  premiumDelta = 15; vacancyDelta = -10; label = "occ_mid_high"; }
  else if (rate <= 0.15) { pct = -0.12; vacancyDelta = 30; suggestMinStay = true; label = "occ_very_low"; }
  else if (rate <= 0.30) { pct = -0.07; vacancyDelta = 15; label = "occ_low"; }
  const adjCents = Math.round(basePriceCents * pct);
  return { adjCents, vacancyDelta, premiumDelta, label, suggestMinStay, pct, rate };
}
```
- [ ] **Step 2 : Créer `src/utils/rmOccupancyAdjust.test.js`**
```js
import { describe, it, expect } from "vitest";
import { pickRate, occupancyAdjustment } from "./rmOccupancyAdjust.js";

describe("pickRate", () => {
  it("≤30j -> rate30", () => { expect(pickRate(0.5, 0.9, 10)).toBe(0.5); expect(pickRate(0.5, 0.9, 30)).toBe(0.5); });
  it("30-90j -> rate90", () => { expect(pickRate(0.5, 0.9, 31)).toBe(0.9); expect(pickRate(0.5, 0.9, 90)).toBe(0.9); });
  it(">90j -> null", () => { expect(pickRate(0.5, 0.9, 120)).toBe(null); });
  it("rate null -> null", () => { expect(pickRate(null, 0.9, 10)).toBe(null); });
});

describe("occupancyAdjustment — barème", () => {
  const base = 20000; // 200€
  it("≥85% -> +10% premium", () => {
    const r = occupancyAdjustment({ rate30: 0.9, leadTimeDays: 10, basePriceCents: base });
    expect(r.adjCents).toBe(2000); expect(r.premiumDelta).toBe(30); expect(r.vacancyDelta).toBe(-20); expect(r.label).toBe("occ_high");
  });
  it("70-85% -> +5%", () => {
    expect(occupancyAdjustment({ rate30: 0.75, leadTimeDays: 10, basePriceCents: base }).adjCents).toBe(1000);
  });
  it("30-70% -> neutre", () => {
    const r = occupancyAdjustment({ rate30: 0.5, leadTimeDays: 10, basePriceCents: base });
    expect(r.adjCents).toBe(0); expect(r.label).toBe(null);
  });
  it("15-30% -> -7%", () => {
    expect(occupancyAdjustment({ rate30: 0.2, leadTimeDays: 10, basePriceCents: base }).adjCents).toBe(-1400);
  });
  it("≤15% -> -12% + min-stay", () => {
    const r = occupancyAdjustment({ rate30: 0.0, leadTimeDays: 10, basePriceCents: base });
    expect(r.adjCents).toBe(-2400); expect(r.vacancyDelta).toBe(30); expect(r.suggestMinStay).toBe(true); expect(r.label).toBe("occ_very_low");
  });
  it("utilise rate90 pour lead-time 30-90j", () => {
    const r = occupancyAdjustment({ rate30: 0.0, rate90: 0.9, leadTimeDays: 60, basePriceCents: base });
    expect(r.label).toBe("occ_high"); // 90j window
  });
  it("pas de donnée -> 0", () => {
    expect(occupancyAdjustment({ rate30: null, rate90: null, leadTimeDays: 10, basePriceCents: base }).adjCents).toBe(0);
  });
});
```
- [ ] **Step 3 : Lancer** — `npm run test:run -- rmOccupancyAdjust 2>&1 | tail -15` → PASS.
- [ ] **Step 4 : Commit** — `git add src/utils/rmOccupancyAdjust.js src/utils/rmOccupancyAdjust.test.js && git commit -m "feat(rm): barème d'ajustement prix selon occupation réelle (pur, testé)"`

---

## Task 2 : Injection dans `calcDateReco` + chargement occupation

**Files:** Modify `functions/api/rm-recommendations/[[path]].js`

- [ ] **Step 1 : Importer** en tête : `import { occupancyAdjustment } from "../../../src/utils/rmOccupancyAdjust.js";` (vérifier le bon nombre de `../` selon la profondeur réelle du fichier `functions/api/rm-recommendations/[[path]].js` → `src/` à la racine ; depuis `functions/api/rm-recommendations/` c'est `../../../src/...`).
- [ ] **Step 2 : Ajouter le param** `ownOccupancy = null` dans la destructuration de `calcDateReco({ ... })` (≈ l.69-79, à côté de `signalMap`, `today`).
- [ ] **Step 3 : Appliquer l'ajustement** juste APRÈS le bloc « 7. Market signal adjustment » (≈ l.240) :
```js
  // 7b. Ajustement selon NOTRE occupation réelle (advisory)
  let adjOccupancy = 0;
  let occInfo = null;
  if (ownOccupancy) {
    occInfo = occupancyAdjustment({ rate30: ownOccupancy.rate30 ?? null, rate90: ownOccupancy.rate90 ?? null, leadTimeDays, basePriceCents: basePrice });
    if (occInfo.adjCents) {
      adjOccupancy += occInfo.adjCents;
      factors.push({ type: "own_occupancy", adj: occInfo.adjCents, label: occInfo.label, rate: occInfo.rate });
    }
  }
```
- [ ] **Step 4 : Ajouter `adjOccupancy` au prix** (ligne « 9. Final price computation », ≈ l.246) :
  `let finalPrice = basePrice + adjWeekend + adjHoliday + adjEvent + adjLeadTime + adjMarket + adjGapFill + adjOccupancy;`
- [ ] **Step 5 : Ajuster vacancyRisk & premiumOpportunity** (après leurs `clamp`, ≈ l.273 et l.284) :
  `vacancyRisk = Math.max(0, Math.min(100, vacancyRisk + (occInfo ? occInfo.vacancyDelta : 0)));`
  `premiumOpportunity = Math.max(0, Math.min(100, premiumOpportunity + (occInfo ? occInfo.premiumDelta : 0)));`
- [ ] **Step 6 : Alert flag + summary** : dans la section alertFlags (≈ l.287) ajouter `if (occInfo && occInfo.label) alertFlags.push("own_" + occInfo.label);` et dans summary (≈ l.303) :
```js
  if (occInfo && occInfo.label) summary += ` · occupation ${Math.round((occInfo.rate||0)*100)}% → ${occInfo.pct>0?"+":""}${Math.round(occInfo.pct*100)}%${occInfo.suggestMinStay ? " (min-stay réduit conseillé)" : ""}`;
```
  Optionnel : `adj_premium_cents: adjOccupancy` dans l'objet retourné (traçabilité de la colonne, sinon laisser 0 — c'est déjà dans finalPrice).
- [ ] **Step 7 : Charger l'occupation dans le recompute** : juste après la construction de `signalMap` (≈ l.410), ajouter :
```js
  let ownOccupancy = null;
  try {
    const { results: occRows } = await db.prepare(
      "SELECT period_type, occupancy_rate FROM rm_kpi_snapshots WHERE property_id=? AND period_type IN ('30d','90d') ORDER BY snapshot_date DESC"
    ).bind(property_id).all();
    const seenOcc = {};
    for (const r of (occRows || [])) { if (!(r.period_type in seenOcc)) seenOcc[r.period_type] = r.occupancy_rate; }
    ownOccupancy = { rate30: seenOcc["30d"] ?? null, rate90: seenOcc["90d"] ?? null };
  } catch {}
```
  puis passer `ownOccupancy` dans l'appel `calcDateReco({ ..., signalMap, today, ownOccupancy })` (≈ l.429-437).
- [ ] **Step 8 : Builds** — `npm run build 2>&1 | grep -iE "error|✓ built"` + `npx wrangler pages functions build --outdir /tmp/rmrec 2>&1 | tail -5` → OK. `rm -rf /tmp/rmrec`.
- [ ] **Step 9 : Commit** — `git add "functions/api/rm-recommendations/[[path]].js" && git commit -m "feat(rm): calcDateReco intègre notre occupation réelle (advisory, clampé)"`

---

## Task 3 : Déploiement + vérification + mémoire

**Files:** aucun

- [ ] **Step 1 : Tests (gate)** — `npm run test:run 2>&1 | tail -5` → vert.
- [ ] **Step 2 : Déployer** — `npm run deploy:pages 2>&1 | grep -iE "Suite de tests verte|Deployment complete|Smoke test OK|❌"`.
- [ ] **Step 3 : Recompute + vérif d'un bien contrasté** (Mabouya 0% et Schœlcher 100%) : déclencher le recompute (endpoint POST `rm-recommendations` recompute — repérer la route/param exacts dans le fichier, ex. `POST ?property_id=mabouya&action=recompute` ou body) puis :
  `npx wrangler d1 execute revenue-manager --remote --command "SELECT date, recommended_price_cents, vacancy_risk_score, premium_opportunity, alert_flags FROM rm_recommendations WHERE property_id='mabouya' ORDER BY date LIMIT 5" 2>&1 | tail` → vérifier que les recos ≤90j portent un `own_occ_*` flag + prix baissé (Mabouya) ; idem Schœlcher (prix monté). ⚠️ Si le recompute exige une route/secret particuliers, le noter ; sinon il tourne aussi via cron RM.
- [ ] **Step 4 : Mémoire** — `PROJECT_MEMORY.md` : phase 2 livrée — `calcDateReco` intègre l'occupation réelle (advisory) via `rmOccupancyAdjust.js` (barème ±12%) ; flags `own_occ_*` + note summary. Commit + push.

---

## Self-review
- Barème pur + tests → Task 1 ✅ · injection moteur + chargement occupation → Task 2 ✅ · deploy + vérif bien contrasté → Task 3 ✅.
- Cohérence : `occupancyAdjustment({rate30,rate90,leadTimeDays,basePriceCents})` signature identique Task 1↔2 ; `ownOccupancy {rate30,rate90}` chargé depuis rm_kpi_snapshots = ce que la phase 1 écrit ; prix reste clampé ; advisory (status pending).
