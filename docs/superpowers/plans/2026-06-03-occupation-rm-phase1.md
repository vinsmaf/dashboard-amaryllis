# Occupation réelle → RM (phase 1) — Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Étapes en `- [ ]`.

**Goal :** persister l'occupation réelle par bien (30j/90j) dans `rm_kpi_snapshots` (Worker) et l'exposer/afficher (rm-dashboard + onglet RM). Calcul pur testé.

**Tech Stack :** Worker (D1 `revenue_manager`), Cloudflare Pages Functions, vitest.

> Garde-fous : RM advisory (on AFFICHE l'occupation, on ne change pas les prix) ; calcul pur testé ; upsert idempotent ; Worker via `deploy:worker`, Pages via `deploy:pages`.

---

## Task 1 : Module pur `src/utils/occupancy.js` + tests

**Files:** Create `src/utils/occupancy.js` · Create `src/utils/occupancy.test.js`

- [ ] **Step 1 : Créer `src/utils/occupancy.js`**
```js
// src/utils/occupancy.js — occupation forward par bien (pur, testable).
// events: [{ bienId, checkin, checkout }] dates "YYYY-MM-DD" (checkout exclusif).
// ⚠️ Mirroré inline dans workers/ical-sync/index.js (runOccupancySnapshot) — garder synchro.

export function diffDays(a, b) { // nuits entre 2 dates "YYYY-MM-DD"
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
export function addDays(d, n) {
  const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

// Nuits réservées d'un bien dans la fenêtre [fromStr, toStr) (chevauchements clampés).
export function nightsBookedInWindow(events, bienId, fromStr, toStr) {
  let n = 0;
  for (const e of (events || [])) {
    if (e.bienId !== bienId) continue;
    if (!e.checkin || !e.checkout) continue;
    const start = e.checkin > fromStr ? e.checkin : fromStr;
    const end   = e.checkout < toStr ? e.checkout : toStr;
    if (end > start) n += diffDays(start, end);
  }
  return n;
}

// Occupation forward sur `horizonDays` nuits à partir de todayStr.
export function occupancyForWindow(events, bienId, todayStr, horizonDays) {
  const toStr = addDays(todayStr, horizonDays);
  const nightsSold = nightsBookedInWindow(events, bienId, todayStr, toStr);
  const nightsAvailable = horizonDays;
  const rate = nightsAvailable > 0 ? Math.min(1, nightsSold / nightsAvailable) : 0;
  return { nightsSold, nightsAvailable, rate };
}
```
- [ ] **Step 2 : Créer `src/utils/occupancy.test.js`**
```js
import { describe, it, expect } from "vitest";
import { diffDays, addDays, nightsBookedInWindow, occupancyForWindow } from "./occupancy.js";

const today = "2026-07-01";
const ev = (bienId, checkin, checkout) => ({ bienId, checkin, checkout });

describe("helpers dates", () => {
  it("diffDays", () => { expect(diffDays("2026-07-01", "2026-07-08")).toBe(7); });
  it("addDays", () => { expect(addDays("2026-07-01", 30)).toBe("2026-07-31"); });
});

describe("nightsBookedInWindow", () => {
  const events = [ev("geko", "2026-07-03", "2026-07-06"), ev("geko", "2026-07-20", "2026-07-25"), ev("zandoli", "2026-07-01", "2026-07-31")];
  it("compte les nuits du bon bien dans la fenêtre", () => {
    expect(nightsBookedInWindow(events, "geko", today, addDays(today, 30))).toBe(3 + 5);
  });
  it("clampe une résa qui dépasse la fenêtre", () => {
    expect(nightsBookedInWindow([ev("geko", "2026-06-28", "2026-07-04")], "geko", today, addDays(today, 30))).toBe(3); // 1,2,3 juil
  });
  it("ignore les autres biens", () => {
    expect(nightsBookedInWindow(events, "geko", today, addDays(today, 30))).not.toBe(31);
  });
});

describe("occupancyForWindow", () => {
  it("taux = nuits vendues / horizon", () => {
    const r = occupancyForWindow([ev("geko", "2026-07-01", "2026-07-16")], "geko", today, 30);
    expect(r.nightsSold).toBe(15); expect(r.nightsAvailable).toBe(30); expect(r.rate).toBeCloseTo(0.5, 5);
  });
  it("vide -> 0", () => {
    expect(occupancyForWindow([], "geko", today, 30)).toEqual({ nightsSold: 0, nightsAvailable: 30, rate: 0 });
  });
  it("cap à 1 si sur-réservé (chevauchements)", () => {
    const r = occupancyForWindow([ev("geko", "2026-07-01", "2026-07-31"), ev("geko", "2026-07-01", "2026-07-31")], "geko", today, 30);
    expect(r.rate).toBe(1);
  });
});
```
- [ ] **Step 3 : Lancer** — `npm run test:run -- occupancy 2>&1 | tail -15` → PASS.
- [ ] **Step 4 : Commit** — `git add src/utils/occupancy.js src/utils/occupancy.test.js && git commit -m "feat(rm): calcul d'occupation forward pur + tests"`

---

## Task 2 : Worker écrit l'occupation dans `rm_kpi_snapshots`

**Files:** Modify `workers/ical-sync/index.js`

- [ ] **Step 1 : Ajouter `runOccupancySnapshot(env, allEvents)`** (mirroir de `occupancy.js`, réutilise les helpers Worker `today()`/`addDays()`/`diffDays()` déjà présents). Insérer la fonction près de `runOccupancyAlerts` :
```js
// Persiste l'occupation forward (30j/90j) par bien dans rm_kpi_snapshots (RM "voit" l'occupation).
async function runOccupancySnapshot(env, allEvents) {
  if (!env.revenue_manager) return;
  const db = env.revenue_manager;
  const todayStr = today();
  const activeBiens = new Set(Object.keys(getAirbnbUrls(env)));
  // inclure aussi nogent (Beds24) si présent dans NOMS
  Object.keys(NOMS).forEach((id) => activeBiens.add(id));

  function nightsBooked(bienId, fromStr, toStr) {
    let n = 0;
    for (const e of allEvents) {
      if (e.bienId !== bienId || !e.checkin || !e.checkout) continue;
      const start = e.checkin > fromStr ? e.checkin : fromStr;
      const end = e.checkout < toStr ? e.checkout : toStr;
      if (end > start) n += diffDays(start, end);
    }
    return n;
  }

  for (const bienId of activeBiens) {
    for (const [period, horizon] of [["30d", 30], ["90d", 90]]) {
      const to = addDays(todayStr, horizon);
      const sold = Math.min(horizon, nightsBooked(bienId, todayStr, to));
      const rate = horizon > 0 ? sold / horizon : 0;
      const id = `${bienId}-${todayStr}-${period}`;
      try {
        await db.prepare(
          "INSERT INTO rm_kpi_snapshots (id, property_id, snapshot_date, period_type, occupancy_rate, nights_sold, nights_available) " +
          "VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET occupancy_rate=excluded.occupancy_rate, nights_sold=excluded.nights_sold, nights_available=excluded.nights_available"
        ).bind(id, bienId, todayStr, period, rate, sold, horizon).run();
      } catch (e) { console.error("[occupancy] " + bienId + " " + period + ": " + e.message); }
    }
  }
  console.log("[occupancy] snapshot écrit pour " + activeBiens.size + " biens");
}
```
  ⚠️ Vérifier les noms réels des helpers Worker (`today`, `addDays`, `diffDays`) et de `getAirbnbUrls`/`NOMS` — adapter si différents (ils existent déjà, utilisés par `runOccupancyAlerts`).
- [ ] **Step 2 : Appeler dans le cron quotidien** `0 9 * * *` (après `runOccupancyAlerts(env, allEvents)`), dans le `ctx.waitUntil` :
```js
        await runOccupancySnapshot(env, allEvents);
```
- [ ] **Step 3 : Ajouter un déclencheur manuel** (pour vérifier sans attendre 9h) dans le handler `fetch` du Worker — repérer un trigger existant (ex. `?run=occupancy-alerts`) et ajouter une branche `?run=occupancy` : `const { allEvents } = await runSync(env); await runOccupancySnapshot(env, allEvents); return new Response("occupancy ok");`. Protéger comme les autres triggers (token `WORKER_SECRET` si le pattern existe).
- [ ] **Step 4 : Dry-run** — `npx wrangler deploy --dry-run 2>&1 | grep -iE "Total Upload|error|binding|revenue_manager"` → compile OK + binding D1 listé.
- [ ] **Step 5 : Commit** — `git add workers/ical-sync/index.js && git commit -m "feat(rm): Worker persiste l'occupation forward (30j/90j) dans rm_kpi_snapshots"`

---

## Task 3 : `rm-dashboard` expose l'occupation + affichage minimal

**Files:** Modify `functions/api/rm-dashboard.js` · Modify l'onglet RM (chercher où `rm-dashboard` est consommé : `src/tabs/*` ou `src/App.jsx`)

- [ ] **Step 1 : Lire `functions/api/rm-dashboard.js`** (structure de la réponse, comment `property_id` est lu). Ajouter une requête : dernier snapshot d'occupation du bien :
```js
  // Occupation réelle (dernier snapshot par période)
  let occupancy = null;
  try {
    const { results } = await db.prepare(
      "SELECT period_type, occupancy_rate, nights_sold, nights_available, snapshot_date FROM rm_kpi_snapshots " +
      "WHERE property_id=? AND period_type IN ('30d','90d') ORDER BY snapshot_date DESC"
    ).bind(propertyId).all();
    const seen = {};
    for (const r of (results || [])) { if (!seen[r.period_type]) seen[r.period_type] = r; }
    occupancy = { d30: seen["30d"] || null, d90: seen["90d"] || null };
  } catch {}
```
  et ajouter `occupancy` au payload JSON retourné. (Adapter `propertyId`/`db` aux noms réels du fichier.)
- [ ] **Step 2 : Affichage minimal** dans l'onglet RM (là où les données `rm-dashboard` sont rendues) : un badge « Occupation réelle — 30j : {Math.round(d30.occupancy_rate*100)}% · 90j : {Math.round(d90.occupancy_rate*100)}% ». Si `occupancy` absent → ne rien afficher (gracieux).
- [ ] **Step 3 : Build** — `npm run build 2>&1 | grep -iE "error|✓ built"` + `npx wrangler pages functions build --outdir /tmp/rmb 2>&1 | tail -5` → OK. `rm -rf /tmp/rmb`.
- [ ] **Step 4 : Commit** — `git add functions/api/rm-dashboard.js <fichier-onglet-RM> && git commit -m "feat(rm): rm-dashboard expose l'occupation réelle + affichage onglet RM"`

---

## Task 4 : Déploiement + vérification + mémoire

**Files:** aucun

- [ ] **Step 1 : Tests (gate local)** — `npm run test:run 2>&1 | tail -5` → vert.
- [ ] **Step 2 : Déployer le Worker** — `npm run deploy:worker 2>&1 | grep -iE "Deployed|schedule|error"`.
- [ ] **Step 3 : Déclencher le snapshot** (manuel) — appeler le trigger ajouté (Task 2 Step 3), ex. `curl "https://amaryllis-ical-sync.<...>.workers.dev/?run=occupancy&token=<WORKER_SECRET>"`. Si pas de domaine workers.dev public ou token requis non dispo → attendre le cron 9h ; le noter.
- [ ] **Step 4 : Vérifier en D1** — `npx wrangler d1 execute revenue-manager --remote --command "SELECT property_id, period_type, ROUND(occupancy_rate*100) pct, nights_sold FROM rm_kpi_snapshots WHERE snapshot_date=date('now') ORDER BY property_id, period_type" 2>&1 | tail -20` → lignes 30d/90d par bien avec des % plausibles.
- [ ] **Step 5 : Déployer Pages** — `npm run deploy:pages` (gate tests) → vérifier `rm-dashboard?property_id=<bien>` renvoie `occupancy`.
- [ ] **Step 6 : Mémoire** — `PROJECT_MEMORY.md` : occupation réelle persistée (Worker → rm_kpi_snapshots 30d/90d) + exposée (rm-dashboard + onglet RM) ; calcul pur testé `src/utils/occupancy.js`. **Phase 2 = brancher dans le moteur de reco.** Commit.

---

## Self-review
- Calcul pur + tests → Task 1 ✅ · Worker écrit snapshots → Task 2 ✅ · dashboard expose + affiche → Task 3 ✅ · deploy + vérif D1 → Task 4 ✅.
- Cohérence : `occupancyForWindow` (JS testé) ≡ `runOccupancySnapshot` (Worker inline, même formule sold/horizon, cap implicite via Math.min). `period_type` ∈ {'30d','90d'} (respecte le CHECK). `property_id` = bienId canonique.
