# Contrôles de cohérence données — Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Étapes en `- [ ]`.

**Goal :** moteur de règles pur (testé) + endpoint cron qui détecte les incohérences de réservations (`direct_bookings`) et alerte (inbox bugs + ntfy).

**Tech Stack :** Cloudflare Pages Functions (D1 `revenue_manager`), vitest, ntfy, `client_errors`.

> Garde-fous : règles PURES testées ; `?dry=1` n'écrit rien ; endpoint `?secret=POSTSTAY_SECRET` ; fail-soft ; `npm run deploy:pages` uniquement ; pas de `git add -A`.

---

## Task 1 : Moteur de règles pur + tests

**Files:** Create `src/utils/coherenceRules.js` · Create `src/utils/coherenceRules.test.js`

- [ ] **Step 1 : Créer `src/utils/coherenceRules.js`**
```js
// src/utils/coherenceRules.js
// Moteur de cohérence des réservations — PUR, source-agnostique, testable.
// reservation : { id, bien, voyageur, total, depot, checkin, checkout }  (dates "YYYY-MM-DD")
const MAX_TOTAL = 50000; // borne saine € (au-delà = aberrant)

function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}
function matchBien(bien, validBiens) {
  const b = norm(bien);
  return validBiens.some((t) => b.includes(t));
}
function validDates(r) {
  return /^\d{4}-\d{2}-\d{2}$/.test(r.checkin || "") &&
         /^\d{4}-\d{2}-\d{2}$/.test(r.checkout || "") &&
         r.checkin < r.checkout;
}
function overlaps(a, b) { // intervalle demi-ouvert [checkin, checkout)
  return a.checkin < b.checkout && b.checkin < a.checkout;
}

export function checkReservations(reservations, { validBiens = [] } = {}) {
  const findings = [];
  const list = Array.isArray(reservations) ? reservations : [];

  for (const r of list) {
    const who = r.voyageur || r.id || "?";
    if (!validDates(r)) {
      findings.push({ rule: "dates_invalides", severity: "haute", bien: r.bien || "—",
        message: `Dates invalides (${r.checkin || "?"} → ${r.checkout || "?"}) — ${who}`, key: `dates:${r.id}` });
    }
    const total = Number(r.total), depot = Number(r.depot);
    if (!(total > 0) || depot < 0 || depot > total || total > MAX_TOTAL) {
      findings.push({ rule: "total_aberrant", severity: "haute", bien: r.bien || "—",
        message: `Montant aberrant : total=${r.total}€ dépôt=${r.depot}€ — ${who}`, key: `total:${r.id}` });
    }
    if (validBiens.length && !matchBien(r.bien, validBiens)) {
      findings.push({ rule: "bien_inconnu", severity: "moyenne", bien: r.bien || "—",
        message: `Bien non reconnu : "${r.bien}" — ${who}`, key: `bien:${r.id}` });
    }
  }

  const dated = list.filter(validDates);
  for (let i = 0; i < dated.length; i++) {
    for (let j = i + 1; j < dated.length; j++) {
      const a = dated[i], b = dated[j];
      if (norm(a.bien) === norm(b.bien) && norm(a.bien) !== "" && overlaps(a, b)) {
        findings.push({ rule: "double_booking", severity: "critique", bien: a.bien || "—",
          message: `Double réservation ${a.bien} : ${a.checkin}→${a.checkout} (${a.voyageur || a.id}) chevauche ${b.checkin}→${b.checkout} (${b.voyageur || b.id})`,
          key: `overlap:${[a.id, b.id].sort().join("~")}` });
      }
    }
  }
  return findings;
}
export const COHERENCE_MAX_TOTAL = MAX_TOTAL;
```

- [ ] **Step 2 : Créer `src/utils/coherenceRules.test.js`**
```js
import { describe, it, expect } from "vitest";
import { checkReservations } from "./coherenceRules.js";

const BIENS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent", "bellevue"];
const ok = { id: "a1", bien: "Villa Amaryllis", voyageur: "Sophie", total: 1200, depot: 1500, checkin: "2026-07-01", checkout: "2026-07-08" };

describe("checkReservations", () => {
  it("résa saine -> 0 finding", () => {
    expect(checkReservations([ok], { validBiens: BIENS })).toEqual([]);
  });
  it("dates invalides (checkin >= checkout)", () => {
    const f = checkReservations([{ ...ok, checkin: "2026-07-08", checkout: "2026-07-01" }], { validBiens: BIENS });
    expect(f.some((x) => x.rule === "dates_invalides")).toBe(true);
  });
  it("dates manquantes", () => {
    const f = checkReservations([{ ...ok, checkin: "", checkout: "" }], { validBiens: BIENS });
    expect(f.some((x) => x.rule === "dates_invalides")).toBe(true);
  });
  it("total <= 0 ou dépôt > total", () => {
    expect(checkReservations([{ ...ok, total: 0 }], { validBiens: BIENS }).some((x) => x.rule === "total_aberrant")).toBe(true);
    expect(checkReservations([{ ...ok, total: 100, depot: 200 }], { validBiens: BIENS }).some((x) => x.rule === "total_aberrant")).toBe(true);
  });
  it("total absurde (> borne)", () => {
    expect(checkReservations([{ ...ok, total: 99999 }], { validBiens: BIENS }).some((x) => x.rule === "total_aberrant")).toBe(true);
  });
  it("bien inconnu", () => {
    expect(checkReservations([{ ...ok, bien: "Chalet Mystère" }], { validBiens: BIENS }).some((x) => x.rule === "bien_inconnu")).toBe(true);
  });
  it("noms d'affichage variés reconnus (Studio Mabouya, Bellevue)", () => {
    expect(checkReservations([{ ...ok, bien: "Studio Mabouya" }], { validBiens: BIENS }).some((x) => x.rule === "bien_inconnu")).toBe(false);
    expect(checkReservations([{ ...ok, bien: "Bellevue Schœlcher" }], { validBiens: BIENS }).some((x) => x.rule === "bien_inconnu")).toBe(false);
  });
  it("double-booking : chevauchement même bien", () => {
    const a = { ...ok, id: "a", checkin: "2026-07-01", checkout: "2026-07-08" };
    const b = { ...ok, id: "b", checkin: "2026-07-05", checkout: "2026-07-10" };
    const f = checkReservations([a, b], { validBiens: BIENS });
    expect(f.filter((x) => x.rule === "double_booking")).toHaveLength(1);
  });
  it("PAS de double-booking si dates jointives (checkout == checkin)", () => {
    const a = { ...ok, id: "a", checkin: "2026-07-01", checkout: "2026-07-08" };
    const b = { ...ok, id: "b", checkin: "2026-07-08", checkout: "2026-07-12" };
    expect(checkReservations([a, b], { validBiens: BIENS }).some((x) => x.rule === "double_booking")).toBe(false);
  });
  it("PAS de double-booking si biens différents", () => {
    const a = { ...ok, id: "a", bien: "Villa Amaryllis", checkin: "2026-07-01", checkout: "2026-07-08" };
    const b = { ...ok, id: "b", bien: "Zandoli", checkin: "2026-07-03", checkout: "2026-07-06" };
    expect(checkReservations([a, b], { validBiens: BIENS }).some((x) => x.rule === "double_booking")).toBe(false);
  });
});
```
- [ ] **Step 3 : Lancer** — `npm run test:run -- coherenceRules 2>&1 | tail -20` → PASS. (Si un attendu diverge du comportement réel du module, c'est le module qui fait foi : corriger l'attendu, sauf vrai bug logique.)
- [ ] **Step 4 : Commit** — `git add src/utils/coherenceRules.js src/utils/coherenceRules.test.js && git commit -m "feat(coherence): moteur de règles réservations pur + tests"`

---

## Task 2 : Endpoint `functions/api/coherence-check.js`

**Files:** Create `functions/api/coherence-check.js`

- [ ] **Step 1 : Créer l'endpoint**
```js
// functions/api/coherence-check.js — contrôle de cohérence des réservations (cron).
// GET ?secret=POSTSTAY_SECRET   → exécute, écrit les findings dans l'inbox client_errors,
//                                 push ntfy si finding critique. ?dry=1 = simulation (rien écrit).
import { ensureClientErrorsTable, clientErrorFingerprint } from "./client-errors.js";
import { BIENS as CANON } from "../../src/data/biens.js";
import { checkReservations } from "../../src/utils/coherenceRules.js";

// ids canoniques + alias d'affichage (Bellevue = schoelcher)
const VALID_BIENS = [...Object.keys(CANON), "bellevue"];

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }
  const dry = url.searchParams.get("dry") === "1";
  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 500);

  let reservations = [];
  try {
    const { results } = await db.prepare(
      "SELECT payment_intent_id AS id, bien_nom AS bien, voyageur, total, depot, checkin, checkout FROM direct_bookings"
    ).all();
    reservations = results || [];
  } catch (e) {
    return json({ ok: false, error: "lecture direct_bookings: " + e.message });
  }

  const findings = checkReservations(reservations, { validBiens: VALID_BIENS });
  const critical = findings.filter((f) => f.severity === "critique");

  if (!dry && findings.length) {
    try {
      await ensureClientErrorsTable(db);
      for (const f of findings) {
        const path = "/coherence/" + (f.rule || "");
        const id = await clientErrorFingerprint("coherence", f.message, path);
        const existing = await db.prepare("SELECT id FROM client_errors WHERE id=?").bind(id).first();
        if (existing) {
          await db.prepare(
            "UPDATE client_errors SET count=count+1, last_seen=unixepoch(), severity=?, " +
            "status=CASE WHEN status IN ('ignored','fixed') THEN status ELSE 'new' END WHERE id=?"
          ).bind(f.severity, id).run();
        } else {
          await db.prepare(
            "INSERT INTO client_errors (id, kind, message, path, severity, status) VALUES (?,?,?,?,?, 'new')"
          ).bind(id, "coherence", String(f.message).slice(0, 600), path, f.severity).run();
        }
      }
    } catch (e) {
      return json({ ok: false, error: "écriture inbox: " + e.message, findings: findings.length });
    }
    if (critical.length && env.NTFY_TOPIC) {
      try {
        await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
          method: "POST",
          headers: { Title: `⚠️ Cohérence : ${critical.length} alerte(s) critique(s)`, Priority: "high", Tags: "warning,rotating_light" },
          body: critical.map((c) => c.message).join("\n").slice(0, 800),
        });
      } catch { /* ntfy best-effort */ }
    }
  }

  return json({ ok: true, checked: reservations.length, findings: findings.length, critical: critical.length, ...(dry ? { items: findings } : {}) });
}
```
- [ ] **Step 2 : Build Functions** — `npx wrangler pages functions build --outdir /tmp/_cohb 2>&1 | tail -8` → « Compiled Worker successfully ». Puis `rm -rf /tmp/_cohb`.
- [ ] **Step 3 : Vérif export client-errors** — confirmer que `client-errors.js` exporte bien `ensureClientErrorsTable` et `clientErrorFingerprint` : `grep -nE "export async function ensureClientErrorsTable|export async function clientErrorFingerprint" functions/api/client-errors.js` → 2 lignes. (Si les noms diffèrent, adapter l'import.)
- [ ] **Step 4 : Commit** — `git add functions/api/coherence-check.js && git commit -m "feat(coherence): endpoint cron /api/coherence-check (direct_bookings -> inbox + ntfy)"`

---

## Task 3 : Déploiement + vérif (dry) + mémoire

**Files:** aucun

- [ ] **Step 1 : Suite locale** — `npm run test:run 2>&1 | tail -5` → tout vert (le gate l'exigera).
- [ ] **Step 2 : Déployer** — `npm run deploy:pages 2>&1 | grep -iE "Suite de tests verte|Prérendu|Deployment complete|Smoke test OK|❌"` → gate vert + build + deploy + smoke.
- [ ] **Step 3 : Vérif live en mode DRY** (n'écrit rien) — récupérer le secret est une action Vincent ; à défaut, vérifier le 401 sans secret :
  `curl -s -o /dev/null -w "%{http_code}\n" "https://villamaryllis.com/api/coherence-check"` → **401** (protégé). Avec secret (Vincent) : `...?secret=<POSTSTAY_SECRET>&dry=1` → JSON `{ ok, checked, findings, critical, items }`.
- [ ] **Step 4 : Mémoire + action cron** — `PROJECT_MEMORY.md` : noter l'endpoint `/api/coherence-check` (cron quotidien à activer sur cron-job.org : GET `https://villamaryllis.com/api/coherence-check?secret=<POSTSTAY_SECRET>`), findings → inbox 🐞 Bugs (kind coherence) + ntfy si critique. **Action Vincent** : créer le cron quotidien. Commit.

---

## Self-review
- Règles pures + tests → Task 1 ✅ · endpoint cron (direct_bookings → inbox + ntfy, dry) → Task 2 ✅ · deploy+vérif+mémoire+action cron → Task 3 ✅.
- Cohérence : `checkReservations(reservations,{validBiens})` signature identique Task 1↔2 ; `ensureClientErrorsTable`/`clientErrorFingerprint` = exports réels de `client-errors.js` (vérif Task 2 Step 3) ; secret = `POSTSTAY_SECRET` (pattern cron existant) ; `kind:"coherence"` (colonne libre, visible BugsTab).
