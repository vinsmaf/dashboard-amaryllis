# Paiement en 2 fois (acompte + solde) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proposer (jamais imposer) au client de payer une réservation directe en 2 fois — acompte 30 % maintenant + solde 70 % débité automatiquement à J-30 avant l'arrivée, via une carte enregistrée (off-session Stripe).

**Architecture:** Logique pure testée (`src/utils/paymentPlan.js`) → `create-payment-intent.js` crée un Customer + `setup_future_usage:'off_session'` quand `payPlan='2x'` → le webhook `payment_intent.succeeded` persiste une ligne `payment_schedule` (D1) → un cron quotidien `charge-balance.js` débite les soldes dus off-session. UI : un choix radio dans le BookingModal, visible seulement si éligible.

**Tech Stack:** Cloudflare Pages Functions · Stripe REST API (`x-www-form-urlencoded`) · D1 (`revenue_manager`) · Vitest · cron-job.org · React 19 (Stripe.js elements).

**⚠️ Argent réel : Stripe LIVE.** Toute la chaîne se valide en **mode Stripe TEST** (clés test) avant bascule LIVE — voir Task 7. Tant que `PAY_2X_ENABLED` (var CF Pages) ≠ `"1"`, l'option reste masquée (rollback instantané).

**Spec source :** `docs/superpowers/specs/2026-06-11-paiement-2-fois-design.md`

---

## File Structure

- `src/utils/paymentPlan.js` — **créé** — logique pure : montants acompte/solde, date d'échéance, éligibilité. Zéro dépendance, 100 % testable.
- `src/utils/paymentPlan.test.js` — **créé** — tests vitest de la logique pure.
- `functions/api/create-payment-intent.js` — **modifié** — accepte `payPlan`; pour `'2x'` crée un Customer + `setup_future_usage` + metadata échéancier.
- `functions/api/stripe-webhook.js` — **modifié** — sur `payment_intent.succeeded` avec `pay_plan='2x'`, persiste `payment_schedule`.
- `functions/api/charge-balance.js` — **créé** — cron : débite les soldes dus off-session, met à jour le statut, notifie en cas d'échec.
- `public/email-templates/solde-debite.html` — **créé** — email « solde débité » (succès).
- `public/email-templates/solde-echec.html` — **créé** — email « échec paiement solde » (lien repayer).
- `src/PublicSite.jsx` — **modifié** — `BookingModal` : choix radio « total / 2× » (si éligible), envoie `payPlan` + montant acompte.

---

### Task 1 : Logique pure `paymentPlan.js` (montants, date, éligibilité)

**Files:**
- Create: `src/utils/paymentPlan.js`
- Test: `src/utils/paymentPlan.test.js`

- [ ] **Step 1 : Écrire le test qui échoue**

```js
// src/utils/paymentPlan.test.js
import { describe, it, expect } from "vitest";
import { depositAmount, balanceAmount, balanceDueDate, isTwoPartEligible } from "./paymentPlan.js";

describe("paymentPlan", () => {
  it("acompte = 30% arrondi à l'euro", () => {
    expect(depositAmount(2000)).toBe(600);
    expect(depositAmount(833)).toBe(250); // 249.9 -> 250
  });
  it("solde = total - acompte (somme exacte = total)", () => {
    expect(balanceAmount(2000)).toBe(1400);
    expect(depositAmount(833) + balanceAmount(833)).toBe(833);
  });
  it("date d'échéance = arrivée - 30 jours (ISO yyyy-mm-dd)", () => {
    expect(balanceDueDate("2026-08-15")).toBe("2026-07-16");
  });
  it("éligible si total >= 800 ET arrivée > 35 jours", () => {
    expect(isTwoPartEligible({ total: 2000, checkin: "2026-08-15", today: "2026-06-11" })).toBe(true);
  });
  it("non éligible si total < 800", () => {
    expect(isTwoPartEligible({ total: 700, checkin: "2026-08-15", today: "2026-06-11" })).toBe(false);
  });
  it("non éligible si arrivée <= 35 jours", () => {
    expect(isTwoPartEligible({ total: 2000, checkin: "2026-07-10", today: "2026-06-11" })).toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer le test → échec attendu**

Run: `npx vitest run src/utils/paymentPlan.test.js`
Expected: FAIL — `Failed to resolve import "./paymentPlan.js"`.

- [ ] **Step 3 : Implémenter le module**

```js
// src/utils/paymentPlan.js
// Logique pure du paiement en 2 fois (acompte 30% + solde à J-30). Testable sans DOM/Stripe.
// ⚠️ Les montants sont en EUROS entiers (comme finalTotal côté UI). Stripe = ×100 ailleurs.

const DEPOSIT_RATE = 0.30;
export const MIN_TOTAL_2X = 800;      // sous ce total, option masquée
export const MIN_DAYS_AHEAD = 35;     // arrivée doit être > 35 j pour laisser le temps du débit J-30
export const BALANCE_LEAD_DAYS = 30;  // solde débité à arrivée - 30 j

export function depositAmount(total) {
  return Math.round(Number(total) * DEPOSIT_RATE);
}

export function balanceAmount(total) {
  return Math.round(Number(total)) - depositAmount(total);
}

// "2026-08-15" -> "2026-07-16" (arrivée - 30 j). Calcul UTC pour éviter les décalages.
export function balanceDueDate(checkinIso) {
  const d = new Date(checkinIso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - BALANCE_LEAD_DAYS);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso, toIso) {
  const a = new Date(fromIso + "T12:00:00Z");
  const b = new Date(toIso + "T12:00:00Z");
  return Math.round((b - a) / 86400000);
}

export function isTwoPartEligible({ total, checkin, today }) {
  if (!total || !checkin || !today) return false;
  if (Number(total) < MIN_TOTAL_2X) return false;
  if (daysBetween(today, checkin) <= MIN_DAYS_AHEAD) return false;
  return true;
}
```

- [ ] **Step 4 : Lancer le test → succès attendu**

Run: `npx vitest run src/utils/paymentPlan.test.js`
Expected: PASS — 6 tests verts.

- [ ] **Step 5 : Commit**

```bash
git add src/utils/paymentPlan.js src/utils/paymentPlan.test.js
git commit -m "feat(paiement-2x): logique pure acompte/solde/éligibilité + tests"
```

---

### Task 2 : Table D1 `payment_schedule` (DDL idempotent partagé)

**Files:**
- Modify: `functions/api/stripe-webhook.js` (ajout d'un helper DDL réutilisable, appelé aussi par `charge-balance.js`)

> Pattern du repo : pas de fichier de migration ; chaque endpoint fait `CREATE TABLE IF NOT EXISTS` au runtime (cf. `direct_bookings` dans `notify-booking.js`, `abandoned_carts` dans `create-payment-intent.js`). On suit ce pattern.

- [ ] **Step 1 : Ajouter le helper DDL en tête de `stripe-webhook.js`** (après les imports, avant `verifyStripeSignature`)

```js
// DDL idempotent — échéancier des paiements en 2 fois (acompte déjà payé, solde à venir).
async function ensurePaymentScheduleTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS payment_schedule (
    deposit_pi_id     TEXT PRIMARY KEY,
    bien_id           TEXT,
    bien_nom          TEXT,
    email             TEXT,
    prenom            TEXT,
    customer_id       TEXT,
    payment_method_id TEXT,
    balance_amount    INTEGER,
    currency          TEXT DEFAULT 'eur',
    checkin           TEXT,
    checkout          TEXT,
    due_date          TEXT,
    status            TEXT DEFAULT 'pending',
    balance_pi_id     TEXT,
    attempts          INTEGER DEFAULT 0,
    last_error        TEXT,
    created_at        INTEGER NOT NULL DEFAULT (unixepoch())
  )`).run();
}
```

- [ ] **Step 2 : Vérifier que le build ne casse pas**

Run: `npm run build 2>&1 | tail -2`
Expected: `✨ Prérendu terminé`. (le helper n'est pas encore appelé — juste défini)

- [ ] **Step 3 : Commit**

```bash
git add functions/api/stripe-webhook.js
git commit -m "feat(paiement-2x): DDL idempotent table payment_schedule"
```

---

### Task 3 : `create-payment-intent.js` — mode `payPlan:'2x'` (Customer + off-session)

**Files:**
- Modify: `functions/api/create-payment-intent.js`

> Le client envoie déjà `{ amount, currency, metadata, bookingId }`. On ajoute `payPlan` (`'full'` par défaut, `'2x'`). Pour `'2x'` : `amount` reçu = **l'acompte** (calculé côté client via `depositAmount`). On crée un Customer Stripe (pour réutiliser la carte) et on pose `setup_future_usage:'off_session'`. On passe l'échéancier en metadata pour que le webhook le persiste.

- [ ] **Step 1 : Étendre la destructuration du body** (remplacer la ligne `const { amount, currency = "eur", metadata = {}, bookingId = "" } = body;`)

```js
  const { amount, currency = "eur", metadata = {}, bookingId = "", payPlan = "full" } = body;
```

- [ ] **Step 2 : Avant la construction du `payload`, créer le Customer si `payPlan==='2x'`**

Insérer juste avant `const payload = new URLSearchParams({` :

```js
  // Paiement en 2 fois : on crée un Customer pour pouvoir débiter le solde plus tard
  // (off-session). L'acompte = `amount` reçu. Garde-fous montant déjà validés au-dessus.
  let customerId = "";
  if (payPlan === "2x") {
    try {
      const cRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: metadata.email || "",
          name:  metadata.voyageur || "",
          "metadata[bienId]": metadata.bienId || "",
        }).toString(),
      });
      const c = await cRes.json();
      if (c.error) return json({ error: c.error.message }, 400);
      customerId = c.id;
    } catch (e) {
      return json({ error: "Création client Stripe échouée: " + e.message }, 500);
    }
  }
```

- [ ] **Step 3 : Ajouter les champs 2x au `payload`** (ajouter ces lignes dans l'objet `new URLSearchParams({ ... })`, après `"metadata[guests]"`)

```js
    ...(payPlan === "2x" ? {
      customer: customerId,
      setup_future_usage: "off_session",
      "metadata[pay_plan]": "2x",
      "metadata[balance_amount]": String(metadata.balance_amount || ""),
      "metadata[due_date]": String(metadata.due_date || ""),
      "metadata[full_total]": String(metadata.full_total || ""),
    } : {}),
```

- [ ] **Step 4 : Renvoyer aussi le `customerId`** (remplacer `return json({ clientSecret: parsed.client_secret });`)

```js
    return json({ clientSecret: parsed.client_secret, customerId });
```

- [ ] **Step 5 : Lint delta + build**

Run: `npx eslint functions/api/create-payment-intent.js 2>&1 | grep -c error; npm run build 2>&1 | tail -1`
Expected: 0 nouvelle erreur lint ; build OK.

- [ ] **Step 6 : Commit**

```bash
git add functions/api/create-payment-intent.js
git commit -m "feat(paiement-2x): create-payment-intent crée Customer + off-session si payPlan=2x"
```

---

### Task 4 : Webhook — persister `payment_schedule` sur acompte réussi

**Files:**
- Modify: `functions/api/stripe-webhook.js` (bloc `payment_intent.succeeded`, ~L264)

> Quand l'acompte 2x réussit, le PaymentIntent contient `customer` et `payment_method` (le PM enregistré via `setup_future_usage`). On lit `pi.metadata.pay_plan`, et si `'2x'`, on insère la ligne d'échéancier. Le `payment_method` est sur `pi.payment_method` (string id après succès).

- [ ] **Step 1 : Ajouter le helper de persistance** (près de `storeDirectBooking` dans le fichier)

```js
// Persiste l'échéancier d'un paiement en 2 fois après réussite de l'acompte.
async function storePaymentSchedule(env, pi) {
  const db = env.revenue_manager;
  if (!db || !pi || pi.metadata?.pay_plan !== "2x") return;
  try {
    await ensurePaymentScheduleTable(db);
    const balance = parseInt(pi.metadata.balance_amount || "0", 10); // euros
    if (!balance || !pi.customer || !pi.payment_method) {
      console.warn("[webhook] 2x schedule incomplet", pi.id, !!pi.customer, !!pi.payment_method, balance);
      return;
    }
    const prenom = String(pi.metadata.voyageur || "").trim().split(/\s+/)[0] || "";
    await db.prepare(`INSERT INTO payment_schedule
        (deposit_pi_id, bien_id, bien_nom, email, prenom, customer_id, payment_method_id,
         balance_amount, currency, checkin, checkout, due_date, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'pending')
      ON CONFLICT(deposit_pi_id) DO NOTHING`)
      .bind(
        pi.id, pi.metadata.bienId || "", pi.metadata.bienNom || pi.metadata.logements || "",
        pi.metadata.email || "", prenom, pi.customer, pi.payment_method,
        balance, pi.currency || "eur",
        pi.metadata.checkin || "", pi.metadata.checkout || "", pi.metadata.due_date || ""
      ).run();
    console.log("[webhook] payment_schedule créé", pi.id, "solde", balance, "due", pi.metadata.due_date);
  } catch (e) { console.error("[webhook] payment_schedule:", e.message); }
}
```

- [ ] **Step 2 : Appeler le helper dans le bloc `payment_intent.succeeded`**

Dans `if (event.type === "payment_intent.succeeded") {`, juste après la ligne qui récupère `const pi = ...` (et avant le `return json(...)` du bloc), ajouter :

```js
    await storePaymentSchedule(env, pi).catch(() => {});
```

- [ ] **Step 3 : Build + lint delta**

Run: `npm run build 2>&1 | tail -1; npx eslint functions/api/stripe-webhook.js 2>&1 | grep -c error`
Expected: build OK ; 0 nouvelle erreur.

- [ ] **Step 4 : Commit**

```bash
git add functions/api/stripe-webhook.js
git commit -m "feat(paiement-2x): webhook persiste payment_schedule sur acompte réussi"
```

---

### Task 5 : Cron `charge-balance.js` — débit off-session des soldes dus

**Files:**
- Create: `functions/api/charge-balance.js`
- Create: `public/email-templates/solde-debite.html`
- Create: `public/email-templates/solde-echec.html`

> Pattern d'auth des crons du repo : `?secret=POSTSTAY_SECRET` (cf. `send-poststay.js`). Le débit off-session se fait via `POST /v1/payment_intents` avec `customer`, `payment_method`, `off_session:true`, `confirm:true`. Idempotent : on ne traite que `status='pending'` et `due_date <= today`.

- [ ] **Step 1 : Créer l'email succès** `public/email-templates/solde-debite.html`

```html
<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2a3d;max-width:560px;margin:auto;padding:24px">
  <h2 style="color:#0e3b3a">Solde de votre séjour réglé ✅</h2>
  <p>Bonjour {{prenom}},</p>
  <p>Le solde de votre réservation à <strong>{{bienNom}}</strong> ({{checkin}} → {{checkout}})
  vient d'être débité : <strong>{{montant}} €</strong>. Votre séjour est intégralement réglé.</p>
  <p>Nous avons hâte de vous accueillir ! — L'équipe Amaryllis</p>
</body></html>
```

- [ ] **Step 2 : Créer l'email échec** `public/email-templates/solde-echec.html`

```html
<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2a3d;max-width:560px;margin:auto;padding:24px">
  <h2 style="color:#c47254">Action requise — solde de votre séjour</h2>
  <p>Bonjour {{prenom}},</p>
  <p>Nous n'avons pas pu débiter le solde de <strong>{{montant}} €</strong> pour votre réservation
  à <strong>{{bienNom}}</strong> ({{checkin}} → {{checkout}}) — votre carte a peut-être expiré.</p>
  <p>Merci de nous recontacter pour régulariser : <a href="https://villamaryllis.com/#contact">villamaryllis.com</a>
  ou par retour d'email. Sans règlement, la réservation pourra être annulée selon nos conditions.</p>
  <p>— L'équipe Amaryllis</p>
</body></html>
```

- [ ] **Step 3 : Créer l'endpoint cron** `functions/api/charge-balance.js`

```js
// Cloudflare Pages Function — GET /api/charge-balance?secret=POSTSTAY_SECRET[&dry=1]
// Cron quotidien : débite off-session les soldes dus (paiement en 2 fois).
import { sendEmail } from "./_sendEmail.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json" },
});

async function ensurePaymentScheduleTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS payment_schedule (
    deposit_pi_id TEXT PRIMARY KEY, bien_id TEXT, bien_nom TEXT, email TEXT, prenom TEXT,
    customer_id TEXT, payment_method_id TEXT, balance_amount INTEGER, currency TEXT DEFAULT 'eur',
    checkin TEXT, checkout TEXT, due_date TEXT, status TEXT DEFAULT 'pending',
    balance_pi_id TEXT, attempts INTEGER DEFAULT 0, last_error TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run();
}

async function notifyNtfy(env, title, msg) {
  if (!env.NTFY_TOPIC) return;
  try {
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, { method: "POST", headers: { Title: title }, body: msg });
  } catch { /* fail-silent */ }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (env.POSTSTAY_SECRET && url.searchParams.get("secret") !== env.POSTSTAY_SECRET)
    return json({ error: "Non autorisé" }, 401);
  const dry = url.searchParams.get("dry") === "1";
  const sk = env.STRIPE_SECRET_KEY;
  const db = env.revenue_manager;
  if (!sk || !db) return json({ error: "Config manquante" }, 500);

  await ensurePaymentScheduleTable(db);
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db.prepare(
    `SELECT * FROM payment_schedule WHERE status='pending' AND due_date <= ? ORDER BY due_date ASC LIMIT 50`
  ).bind(today).all();
  const due = rows?.results || [];
  if (dry) return json({ ok: true, dry: true, due: due.length, rows: due.map(r => ({ pi: r.deposit_pi_id, solde: r.balance_amount, due: r.due_date })) });

  let charged = 0, failed = 0;
  for (const r of due) {
    try {
      const piRes = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          amount: String(Math.round(r.balance_amount * 100)),
          currency: r.currency || "eur",
          customer: r.customer_id,
          payment_method: r.payment_method_id,
          off_session: "true",
          confirm: "true",
          "metadata[kind]": "solde-2x",
          "metadata[deposit_pi_id]": r.deposit_pi_id,
          "metadata[bienId]": r.bien_id || "",
        }).toString(),
      });
      const pi = await piRes.json();
      if (pi.error || pi.status !== "succeeded") {
        failed++;
        await db.prepare(`UPDATE payment_schedule SET status=CASE WHEN attempts>=2 THEN 'failed' ELSE 'pending' END, attempts=attempts+1, last_error=? WHERE deposit_pi_id=?`)
          .bind(String(pi.error?.message || pi.status || "inconnu"), r.deposit_pi_id).run();
        if (r.email) await sendEmail(env, { to: r.email, subject: "Action requise — solde de votre séjour", template: "solde-echec", category: "client", bien_id: r.bien_id, vars: { prenom: r.prenom, bienNom: r.bien_nom, checkin: r.checkin, checkout: r.checkout, montant: r.balance_amount } }).catch(() => {});
        await notifyNtfy(env, "⚠️ Solde 2x échoué", `${r.bien_nom} ${r.email} ${r.balance_amount}€ — ${pi.error?.message || pi.status}`);
        continue;
      }
      charged++;
      await db.prepare(`UPDATE payment_schedule SET status='paid', balance_pi_id=? WHERE deposit_pi_id=?`).bind(pi.id, r.deposit_pi_id).run();
      if (r.email) await sendEmail(env, { to: r.email, subject: "Solde de votre séjour réglé", template: "solde-debite", category: "client", bien_id: r.bien_id, vars: { prenom: r.prenom, bienNom: r.bien_nom, checkin: r.checkin, checkout: r.checkout, montant: r.balance_amount } }).catch(() => {});
    } catch (e) {
      failed++;
      await db.prepare(`UPDATE payment_schedule SET attempts=attempts+1, last_error=? WHERE deposit_pi_id=?`).bind(String(e.message), r.deposit_pi_id).run();
    }
  }
  return json({ ok: true, due: due.length, charged, failed });
}
```

> **À confirmer à l'exécution** : la signature exacte de `sendEmail(env, {...})` dans `functions/api/_sendEmail.js` (notamment le passage des variables de template — ici supposé `vars:{}`). Lire `_sendEmail.js` au Step 4 et aligner le payload (`vars` vs interpolation) avant de coder l'appel. Si le helper n'interpole pas `{{var}}`, rendre le HTML inline comme le fait `send-bulk-email.js`.

- [ ] **Step 4 : Vérifier la signature `sendEmail` et aligner**

Run: `grep -nE "export (async )?function sendEmail|template|vars|{{" functions/api/_sendEmail.js | head`
Action: ajuster l'appel `sendEmail(...)` du Step 3 pour matcher l'API réelle (variables de template). Re-tester le build.

- [ ] **Step 5 : Build**

Run: `npm run build 2>&1 | tail -1`
Expected: build OK.

- [ ] **Step 6 : Commit**

```bash
git add functions/api/charge-balance.js public/email-templates/solde-debite.html public/email-templates/solde-echec.html
git commit -m "feat(paiement-2x): cron charge-balance (débit off-session) + emails solde"
```

---

### Task 6 : UI BookingModal — choix « total / 2× » (si éligible)

**Files:**
- Modify: `src/PublicSite.jsx` (composant `BookingModal`, ~L1953-2200 : état, récap paiement, appel `create-payment-intent` ~L2139)

> L'option n'apparaît que si `isTwoPartEligible({ total, checkin, today })`. Par défaut `payPlan='full'`. Si `'2x'`, l'`amount` envoyé = `depositAmount(total)` et on ajoute `balance_amount`/`due_date`/`full_total` dans `metadata`, plus `payPlan:'2x'` au body.

- [ ] **Step 1 : Importer la logique pure** (en tête de `src/PublicSite.jsx`, près des autres imports utils)

```js
import { depositAmount, balanceAmount, balanceDueDate, isTwoPartEligible } from "./utils/paymentPlan.js";
```

- [ ] **Step 2 : Ajouter l'état `payPlan` dans `BookingModal`** (près des autres `useState` du composant, ex. après `const [elements, setElements] = useState(null);` ~L1998)

```js
  const [payPlan, setPayPlan] = useState("full");
  const todayIso = new Date().toISOString().slice(0, 10);
  const twoPartOk = isTwoPartEligible({ total, checkin, today: todayIso });
```

> `total` et `checkin` sont déjà dans la portée du composant (utilisés à L2139/L2142). Confirmer le nom exact de la variable du montant total à l'exécution (`total`).

- [ ] **Step 3 : Afficher le sélecteur** (dans le récap, juste avant le bouton qui déclenche le paiement / l'appel `create-payment-intent`)

```jsx
{twoPartOk && (
  <div style={{ margin: "14px 0", border: `1px solid ${SAND}`, borderRadius: 12, padding: 12 }}>
    <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", marginBottom: 8 }}>
      <input type="radio" name="payplan" checked={payPlan === "full"} onChange={() => setPayPlan("full")} />
      <span style={{ fontSize: 14, color: NAVY }}>Payer la totalité maintenant — <strong>{total} €</strong></span>
    </label>
    <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
      <input type="radio" name="payplan" checked={payPlan === "2x"} onChange={() => setPayPlan("2x")} />
      <span style={{ fontSize: 14, color: NAVY }}>
        En 2 fois — <strong>{depositAmount(total)} €</strong> aujourd'hui, puis <strong>{balanceAmount(total)} €</strong> le {balanceDueDate(checkin).split("-").reverse().join("/")}
      </span>
    </label>
  </div>
)}
```

- [ ] **Step 4 : Adapter l'appel `create-payment-intent`** (~L2139). Remplacer le montant et enrichir le body :

```jsx
const isTwoX = twoPartOk && payPlan === "2x";
const chargeNow = isTwoX ? depositAmount(total) : total;
const res = await fetch("/api/create-payment-intent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: chargeNow * 100,
    currency: "eur",
    payPlan: isTwoX ? "2x" : "full",
    metadata: {
      bienId: bien.id, bienNom: bien.nom, checkin, checkout,
      voyageur: `${form.prenom} ${form.nom}`, email: form.email,
      ...(upsellsStr ? { upsells: upsellsStr } : {}),
      ...(isTwoX ? { balance_amount: String(balanceAmount(total)), due_date: balanceDueDate(checkin), full_total: String(total) } : {}),
      ...getAttributionMetadata(),
    },
  }),
});
```

> ⚠️ Adapter aux noms réels présents à L2142 (`bien.id`, `form.prenom`, `upsellsStr`, `getAttributionMetadata`) — confirmer à l'exécution en relisant le bloc.

- [ ] **Step 5 : Build + lint delta + tests**

Run: `npm run build 2>&1 | tail -1; npx vitest run 2>&1 | grep -E "Tests "; npx eslint src/PublicSite.jsx 2>&1 | grep -c error`
Expected: build OK ; 172+ tests verts ; 0 nouvelle erreur (delta vs baseline).

- [ ] **Step 6 : Commit**

```bash
git add src/PublicSite.jsx
git commit -m "feat(paiement-2x): UI choix total/2x dans BookingModal si éligible"
```

---

### Task 7 : Validation Stripe TEST → bascule LIVE + cron + flag

**Files:**
- Modify: aucun code nouveau ; configuration (CF Pages vars, cron-job.org) + tests manuels.

- [ ] **Step 1 : Gating par flag** — entourer l'affichage du sélecteur (Task 6, Step 3) d'un test du flag exposé via `/api/get-config`.

Action: ajouter `pay2xEnabled: env.PAY_2X_ENABLED === "1"` dans la réponse de `functions/api/get-config.js`, lire ce flag côté client (le BookingModal charge déjà get-config — confirmer), et ne montrer le sélecteur que si `pay2xEnabled && twoPartOk`. Par défaut le flag est absent → option masquée (rollback).

```bash
git add functions/api/get-config.js src/PublicSite.jsx
git commit -m "feat(paiement-2x): gating via flag PAY_2X_ENABLED (off par défaut)"
```

- [ ] **Step 2 : Test mode Stripe TEST (local `npm run dev:cf`)** — avec des clés Stripe **test** dans `.dev.vars` (`STRIPE_SECRET_KEY` test) :
  1. Réserver un séjour total ≥ 800 € et arrivée > 35 j → l'option « 2× » apparaît.
  2. Choisir « 2× », payer l'acompte avec la carte test `4242 4242 4242 4242`.
  3. Vérifier en D1 test : une ligne `payment_schedule` avec `customer_id`, `payment_method_id`, `balance_amount`, `due_date`.
  4. Forcer `due_date` à aujourd'hui : `UPDATE payment_schedule SET due_date=date('now') WHERE deposit_pi_id='pi_...'`.
  5. Appeler `GET /api/charge-balance?secret=...&dry=1` → voit 1 échéance. Puis sans `dry` → `charged:1`, ligne passe `status='paid'`, email reçu (logs).
  6. Tester l'échec : carte test `4000 0000 0000 0341` (échec off-session) → `status` repasse pending puis `failed` après 3 essais + email échec.

Expected: les 6 étapes OK en mode TEST.

- [ ] **Step 3 : Déployer en prod** (flag encore OFF)

```bash
npm run deploy:pages
```

- [ ] **Step 4 : Enregistrer le cron** sur cron-job.org (API key dans `.memory/CONTEXT.md`) : `GET https://villamaryllis.com/api/charge-balance?secret=<POSTSTAY_SECRET>` quotidien à 9h MTQ (`0 13 * * *` UTC). Vérifier un run `?dry=1` → `due:0` attendu (aucune échéance encore).

- [ ] **Step 5 : Activer en LIVE** — poser `PAY_2X_ENABLED=1` dans CF Pages (production), redéployer (ou re-trigger). Faire **une vraie résa 2× de test à toi-même** (petit montant ≥ 800 € si possible, ou abaisser temporairement `MIN_TOTAL_2X`) carte réelle → vérifier acompte débité + ligne `payment_schedule` + (en forçant `due_date`) un débit de solde réel, puis rembourser depuis Stripe. Argent réel : valider AVANT de communiquer l'option.

- [ ] **Step 6 : Mémoire** — `/cloture-session` : ADR (acompte/solde retenu vs Klarna), CONTEXT (feature live + flag), retirer l'item de BLOCKERS « En cours ».

---

## Self-Review

**Spec coverage :**
- ✅ Optionnel, proposé pas imposé → Task 6 (radio, défaut `full`) + Task 7 flag.
- ✅ Conditions ≥800 € / >35 j → Task 1 `isTwoPartEligible`, appliqué Task 6.
- ✅ Acompte 30 % + carte off-session → Task 3 (`setup_future_usage`, Customer).
- ✅ D1 `payment_schedule` → Task 2 (DDL) + Task 4 (insert).
- ✅ Cron débit solde J-30 → Task 5 (`charge-balance.js`).
- ✅ Échec → email + ntfy → Task 5.
- ✅ Caution inchangée → aucun fichier caution touché (vérifié : create-deposit-intent / manage-deposit non modifiés).
- ✅ N'impacte pas l'acompte des devis admin → flux distinct (BookingModal public uniquement).
- ✅ Tests vitest + mode TEST avant LIVE → Task 1 + Task 7.

**Placeholder scan :** 2 points marqués « à confirmer à l'exécution » (signature `sendEmail`, noms de variables exacts du BookingModal) — ce sont des **vérifications de lecture**, pas des trous de code : le code complet est fourni, à aligner sur l'existant. Aucun « TODO / fill-in » laissé dans le code livré.

**Type consistency :** `payPlan` (`'full'|'2x'`), `depositAmount/balanceAmount/balanceDueDate/isTwoPartEligible` cohérents Task 1 → 6. Colonnes `payment_schedule` identiques Task 2 / 4 / 5. Metadata `pay_plan/balance_amount/due_date/full_total` cohérentes Task 3 → 4.

---

## Notes d'exécution
- **Le repo n'a pas de migration framework** : `CREATE TABLE IF NOT EXISTS` au runtime (pattern confirmé `abandoned_carts`/`direct_bookings`).
- **Deploy** : `npm run deploy:pages` uniquement (jamais `patrimoine-dashboard`).
- **Gate** : `scripts/deploy-pages.sh` (tests → lint delta → build → smoke). Lint sort 1 sous `set -e` malgré delta 0 (fragilité connue) → `SKIP_LINT=1` si delta vérifié 0 manuellement.
- **Ordre de bascule** : code en prod **flag OFF** d'abord, puis TEST, puis `PAY_2X_ENABLED=1`.
