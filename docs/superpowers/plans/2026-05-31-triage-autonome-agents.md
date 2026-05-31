# Triage Autonome des agents IA — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Classer chaque action d'agent par risque (auto/review/blocked), auto-préparer le sûr en brouillon non-public, et ne remonter à Vincent que l'argent/légal/irréversible — via un digest hebdo.

**Architecture:** Un helper pur `_triage.js` (filtre qualité + classification déterministe) s'intercale dans le flux de génération des agents. Les actions `auto` sont préparées en brouillons (`agent_drafts`, statut `drafted`, jamais publiées) par un nouvel endpoint cron `agents-execute`. Un digest hebdo (Worker) restitue l'état. Réutilise massivement l'existant : `agents-deliver`, `agent_drafts`, `_factcheck`, Worker `ical-sync`, onglet admin Approbations.

**Tech Stack:** Cloudflare Pages Functions (ESM), D1 (SQLite), Vitest, Worker cron (`wrangler.toml`).

**Spec source:** `docs/superpowers/specs/2026-05-31-gestion-agents-triage-autonome-design.md`

> ⚠️ **Lire avant de commencer :** `docs/ERREURS-LOG.md` (garde-fous). Rappels critiques :
> - PATCH `/api/agents-actions` : id en **`?id=` query string**, pas dans le body.
> - Avant tout Edit : `grep -rn` pour localiser le vrai chemin/symbole.
> - Avant un `export const X` : vérifier qu'il n'existe pas déjà un `export { X }`.
> - `/api/*` ne répond JSON qu'en **prod** (ou `wrangler pages dev`), pas sur le dev-server Vite.
> - Tester via `npm run deploy:pages` (build + smoke). Ne pas se fier au cache.

---

## Reconnaissance préalable (à faire AVANT la Task 1)

L'implémenteur doit confirmer 3 points dans le code réel (les commandes shell ont été instables lors de la rédaction du plan) :

- [ ] **R1 — Point d'insertion des actions générées.** Localiser comment `agents-run.js` persiste les actions produites par les agents.
  Run: `grep -n "agent_actions\|action=upsert\|agents-actions\|db.prepare\|INSERT" functions/api/agents-run.js`
  Attendu : soit un INSERT/upsert direct en D1, soit un POST vers `/api/agents-actions?action=upsert`. **Noter le fichier + n° de ligne exact** — c'est là que `_triage.js` sera branché (Task 5).

- [ ] **R2 — Schéma `llm_outputs`.** Confirmer les colonnes.
  Run: `grep -rnA14 "CREATE TABLE IF NOT EXISTS llm_outputs" functions/`
  Attendu : colonnes type `id, source, prompt, output, created_at` (ou similaire). **Noter les noms réels** pour la Task 4.

- [ ] **R3 — Format de retour de `callLLM`.** Confirmer la forme de la valeur de retour.
  Run: `grep -n "return" functions/api/_llm.js | head -20` puis lire la fonction `callLLM`.
  Signature connue : `callLLM(env, { provider, tier="smart", messages, temperature=0.5, max_tokens=2048, model, logSource })`. **Confirmer que le retour expose `.text`** (utilisé par `agents-deliver`).

Si R1/R2/R3 diffèrent des hypothèses ci-dessus, adapter les chemins/colonnes dans les tasks concernées avant de coder.

---

## File Structure

| Fichier | Responsabilité | Statut |
|---|---|---|
| `functions/api/_triage.js` | **NOUVEAU.** Helper pur : `classifyAction()`, `isVague()`, `isDuplicate()`, constantes mots-clés. Aucune I/O, 100% testable. | Créer |
| `src/__tests__/triage.test.js` | **NOUVEAU.** Tests Vitest unitaires de `_triage.js`. | Créer |
| `functions/api/agents-run.js` | Brancher `_triage.js` avant persistance + retry 1× sur action vague. | Modifier (point R1) |
| `functions/api/agents-actions.js` | Ajouter colonne `risk` au schéma + à l'upsert + au PATCH (déjà étendu category/effort). | Modifier |
| `functions/api/agents-execute.js` | **NOUVEAU.** Cron : traite `risk=auto` → `agents-deliver` → `agent_drafts` (drafted). | Créer |
| `functions/api/agents-digest.js` | **NOUVEAU.** Génère + envoie le digest hebdo (réutilise Resend/ntfy). | Créer |
| `workers/ical-sync/index.js` | Ajouter 2 crons : `agents-execute` + `agents-digest`. | Modifier |
| `scripts/triage-backlog-once.mjs` | **NOUVEAU.** Script one-shot : classe rétroactivement les 146 backlog. | Créer |

---

## Task 1 : `_triage.js` — détection des actions vagues

**Files:**
- Create: `functions/api/_triage.js`
- Test: `src/__tests__/triage.test.js`

- [ ] **Step 1 : Écrire le test qui échoue**

```js
// src/__tests__/triage.test.js
import { describe, it, expect } from "vitest";
import { isVague } from "../../functions/api/_triage.js";

describe("isVague", () => {
  it("rejette une action à verbe mou sans cible concrète", () => {
    expect(isVague("Mettre en place un système de suivi des interventions")).toBe(true);
    expect(isVague("Améliorer l'expérience utilisateur")).toBe(true);
    expect(isVague("Optimiser les métadonnées des images")).toBe(true);
  });
  it("garde une action concrète (bien nommé / chiffre / endpoint)", () => {
    expect(isVague("Créer template post last-minute Géko à 119€/nuit")).toBe(false);
    expect(isVague("Configurer scrape Apify hebdo via cron Worker rm-scrape")).toBe(false);
    expect(isVague("Améliorer distribution Mabouya (RevPAR 23€, mois à 0€)")).toBe(false);
  });
  it("traite une chaîne vide comme vague", () => {
    expect(isVague("")).toBe(true);
  });
});
```

- [ ] **Step 2 : Lancer le test pour le voir échouer**

Run: `npx vitest run src/__tests__/triage.test.js`
Expected: FAIL — `Failed to resolve import "../../functions/api/_triage.js"`

- [ ] **Step 3 : Écrire l'implémentation minimale**

```js
// functions/api/_triage.js
// Helper PUR de triage des actions agents — aucune I/O, testable en isolation.

// Verbes "mous" en tête d'action (signal de vague)
const SOFT_VERBS = [
  "améliorer", "optimiser", "mettre en place un système", "développer une stratégie",
  "renforcer", "envisager", "explorer", "réfléchir", "analyser les", "mieux ", "divers",
];

// Marqueurs de concret : bien nommé, chiffre, %, €, endpoint/outil connu
const CONCRETE_RE = /\d|€|%|\b(Nogent|Amaryllis|Zandoli|Mabouya|Géko|Geko|Schoelcher|Schœlcher|Iguana)\b|\b(GA4|D1|GBP|Airbnb|Stripe|Beds24|Apify|RAG|cron|Worker|RevPAR|ADR)\b/i;

export function isVague(action) {
  const t = String(action || "").trim().toLowerCase();
  if (!t) return true;
  const hasSoftVerb = SOFT_VERBS.some(v => t.startsWith(v) || t.slice(0, 35).includes(v));
  const hasConcrete = CONCRETE_RE.test(action || "");
  return hasSoftVerb && !hasConcrete;
}
```

- [ ] **Step 4 : Lancer le test pour le voir passer**

Run: `npx vitest run src/__tests__/triage.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5 : Commit**

```bash
git add functions/api/_triage.js src/__tests__/triage.test.js
git commit -m "feat(triage): isVague — détection des actions agents vagues"
```

---

## Task 2 : `_triage.js` — détection des doublons

**Files:**
- Modify: `functions/api/_triage.js`
- Test: `src/__tests__/triage.test.js`

- [ ] **Step 1 : Ajouter le test qui échoue**

```js
// Ajouter dans src/__tests__/triage.test.js
import { isDuplicate } from "../../functions/api/_triage.js";

describe("isDuplicate", () => {
  const existing = [
    { id: "traf-007", action: "Corriger 11 meta titles > 60 caractères tronqués par Google" },
    { id: "cm-002", action: "Créer calendrier éditorial Instagram juin 2026" },
  ];
  it("détecte un quasi-doublon (mêmes mots-clés)", () => {
    const r = isDuplicate("Corriger les meta titles trop longs tronqués dans Google", existing);
    expect(r).toBe("traf-007");
  });
  it("ne confond pas deux actions distinctes", () => {
    expect(isDuplicate("Recompresser les photos Nogent trop lourdes", existing)).toBe(null);
  });
});
```

- [ ] **Step 2 : Lancer le test pour le voir échouer**

Run: `npx vitest run src/__tests__/triage.test.js`
Expected: FAIL — `isDuplicate is not a function`

- [ ] **Step 3 : Ajouter l'implémentation**

```js
// Ajouter dans functions/api/_triage.js
const STOPWORDS = new Set(["les","des","le","la","de","du","un","une","et","a","à","pour","sur","dans","par","avec","ou","le","au","aux","en","plus","via"]);

function tokens(s) {
  return new Set(
    String(s || "").toLowerCase()
      .match(/[a-zàâéèêîôûç0-9]+/g)
      ?.filter(w => w.length > 2 && !STOPWORDS.has(w)) || []
  );
}

// Jaccard ≥ 0.55 → considéré doublon. Retourne l'id existant, sinon null.
export function isDuplicate(action, existingActions, threshold = 0.55) {
  const a = tokens(action);
  if (a.size === 0) return null;
  for (const ex of existingActions || []) {
    const b = tokens(ex.action);
    if (b.size === 0) continue;
    const inter = [...a].filter(w => b.has(w)).length;
    const union = new Set([...a, ...b]).size;
    if (union > 0 && inter / union >= threshold) return ex.id;
  }
  return null;
}
```

- [ ] **Step 4 : Lancer le test pour le voir passer**

Run: `npx vitest run src/__tests__/triage.test.js`
Expected: PASS

> Si le 1er cas ne passe pas (Jaccard < 0.55 car phrases trop longues), baisser `threshold` à `0.5` dans la fonction ET le test, puis relancer. Ne pas descendre sous 0.45 (risque de faux positifs).

- [ ] **Step 5 : Commit**

```bash
git add functions/api/_triage.js src/__tests__/triage.test.js
git commit -m "feat(triage): isDuplicate — détection des doublons par similarité Jaccard"
```

---

## Task 3 : `_triage.js` — classification du risque (auto/review/blocked)

**Files:**
- Modify: `functions/api/_triage.js`
- Test: `src/__tests__/triage.test.js`

- [ ] **Step 1 : Ajouter le test qui échoue**

```js
// Ajouter dans src/__tests__/triage.test.js
import { classifyRisk } from "../../functions/api/_triage.js";

describe("classifyRisk", () => {
  it("blocked : catégorie sensible", () => {
    expect(classifyRisk({ category: "legal", action: "Vérifier déclarations meublé", effort: "2h" })).toBe("blocked");
    expect(classifyRisk({ category: "ads", action: "Lancer campagne", effort: "2h" })).toBe("blocked");
    expect(classifyRisk({ category: "revenue", action: "Optimiser séjours min", effort: "2h" })).toBe("blocked");
  });
  it("blocked : mot-clé argent/légal/pub même si catégorie neutre", () => {
    expect(classifyRisk({ category: "content", action: "Appliquer le prix de Zandoli", effort: "1h" })).toBe("blocked");
    expect(classifyRisk({ category: "seo", action: "Publier la fiche GBP Nogent", effort: "1h" })).toBe("blocked");
  });
  it("auto : content/seo léger sans mot-clé bloquant", () => {
    expect(classifyRisk({ category: "seo", action: "Rédiger meta description Mabouya", effort: "1h" })).toBe("auto");
    expect(classifyRisk({ category: "content", action: "Créer post Instagram Géko", effort: "2h" })).toBe("auto");
  });
  it("review : tout le reste (défaut)", () => {
    expect(classifyRisk({ category: "ops", action: "Organiser rotation ménage", effort: "4h" })).toBe("review");
    expect(classifyRisk({ category: "seo", action: "Refondre architecture du site", effort: "8h" })).toBe("review"); // effort > 2h
  });
});
```

- [ ] **Step 2 : Lancer le test pour le voir échouer**

Run: `npx vitest run src/__tests__/triage.test.js`
Expected: FAIL — `classifyRisk is not a function`

- [ ] **Step 3 : Ajouter l'implémentation**

```js
// Ajouter dans functions/api/_triage.js
export const BLOCKED_CATEGORIES = new Set(["legal", "ads", "revenue"]);
export const BLOCKED_KEYWORDS = [
  "prix", "tarif", "appliquer", "publier prix", "dépense", "budget", "campagne",
  "lancer", "google ads", "meta ads", "caution", "stripe", "paiement", "rgpd",
  "cgv", "déclaration", "contrat", "supprimer", "gbp", "fiche google",
];
const AUTO_CATEGORIES = new Set(["content", "seo"]);

function effortHours(effort) {
  const e = String(effort || "").toLowerCase();
  if (e.includes("30min")) return 0.5;
  const m = e.match(/^(\d+)\s*h/);
  return m ? Number(m[1]) : 99;
}

// Ordre impératif : blocked → auto → review.
export function classifyRisk(action) {
  const cat = (action.category || "").toLowerCase();
  const text = (action.action || "").toLowerCase();

  // 1. blocked
  if (BLOCKED_CATEGORIES.has(cat)) return "blocked";
  if (BLOCKED_KEYWORDS.some(k => text.includes(k))) return "blocked";

  // 2. auto (doit matcher une règle positive)
  if (AUTO_CATEGORIES.has(cat) && effortHours(action.effort) <= 2) return "auto";

  // 3. review par défaut
  return "review";
}
```

- [ ] **Step 4 : Lancer le test pour le voir passer**

Run: `npx vitest run src/__tests__/triage.test.js`
Expected: PASS (tous les describe)

- [ ] **Step 5 : Commit**

```bash
git add functions/api/_triage.js src/__tests__/triage.test.js
git commit -m "feat(triage): classifyRisk — grille déterministe blocked/auto/review"
```

---

## Task 4 : `_triage.js` — fonction orchestratrice `triageAction`

**Files:**
- Modify: `functions/api/_triage.js`
- Test: `src/__tests__/triage.test.js`

- [ ] **Step 1 : Ajouter le test qui échoue**

```js
// Ajouter dans src/__tests__/triage.test.js
import { triageAction } from "../../functions/api/_triage.js";

describe("triageAction", () => {
  const existing = [{ id: "cm-002", action: "Créer calendrier éditorial Instagram juin 2026" }];
  it("rejette une action vague (keep=false, reason=vague)", () => {
    const r = triageAction({ category: "ops", action: "Améliorer les process" }, existing);
    expect(r.keep).toBe(false);
    expect(r.reason).toBe("vague");
  });
  it("rejette un doublon (keep=false, reason=duplicate, dupOf)", () => {
    const r = triageAction({ category: "content", action: "Créer un calendrier éditorial Instagram pour juin 2026" }, existing);
    expect(r.keep).toBe(false);
    expect(r.reason).toBe("duplicate");
    expect(r.dupOf).toBe("cm-002");
  });
  it("garde une action concrète avec son risk", () => {
    const r = triageAction({ category: "seo", action: "Rédiger meta description Mabouya", effort: "1h" }, existing);
    expect(r.keep).toBe(true);
    expect(r.risk).toBe("auto");
  });
});
```

- [ ] **Step 2 : Lancer le test pour le voir échouer**

Run: `npx vitest run src/__tests__/triage.test.js`
Expected: FAIL — `triageAction is not a function`

- [ ] **Step 3 : Ajouter l'implémentation**

```js
// Ajouter dans functions/api/_triage.js
// Orchestrateur : décide keep + risk + raison. Ordre : court → vague → doublon → classify.
export function triageAction(action, existingActions = []) {
  const text = String(action.action || "").trim();
  if (text.length < 45 && !/\d|€|%/.test(text)) return { keep: false, reason: "court" };
  if (isVague(text)) return { keep: false, reason: "vague" };
  const dupOf = isDuplicate(text, existingActions);
  if (dupOf) return { keep: false, reason: "duplicate", dupOf };
  return { keep: true, risk: classifyRisk(action) };
}
```

- [ ] **Step 4 : Lancer le test pour le voir passer**

Run: `npx vitest run src/__tests__/triage.test.js`
Expected: PASS

- [ ] **Step 5 : Commit**

```bash
git add functions/api/_triage.js src/__tests__/triage.test.js
git commit -m "feat(triage): triageAction — orchestrateur keep/risk/reason"
```

---

## Task 5 : Colonne `risk` sur `agent_actions`

**Files:**
- Modify: `functions/api/agents-actions.js` (schéma CREATE TABLE ~ligne 15-29 ; upsert ~ligne 1235 ; PATCH ~ligne 296-303)

- [ ] **Step 1 : Ajouter la colonne au schéma + migration ALTER idempotente**

Dans `functions/api/agents-actions.js`, après la création de `agent_actions`, ajouter une migration douce (D1 ne supporte pas `ADD COLUMN IF NOT EXISTS` → try/catch) :

```js
// Migration : colonne risk (idempotente). À placer près des autres ensureTable/migrations.
try {
  await db.exec("ALTER TABLE agent_actions ADD COLUMN risk TEXT DEFAULT 'review'");
} catch (_) { /* colonne déjà présente */ }
```

- [ ] **Step 2 : Accepter `risk` dans le PATCH**

Dans le bloc `if (method === "PATCH")`, à côté des lignes `category`/`effort` déjà ajoutées :

```js
    if (body.risk !== undefined) { fields.push("risk = ?"); params.push(body.risk); }
```

- [ ] **Step 3 : Accepter `risk` dans l'upsert (`action=upsert`)**

Repérer l'INSERT `INTO agent_actions (...)` (~ligne 1235) et son `ON CONFLICT`. Ajouter `risk` à la liste des colonnes et `?` correspondant, valeur `a.risk || 'review'`. **Si la structure exacte diffère, adapter en gardant `risk` optionnel avec défaut `'review'`.**

- [ ] **Step 4 : Valider la syntaxe**

Run: `node --input-type=module -e "import('./functions/api/agents-actions.js').then(()=>console.log('OK')).catch(e=>console.log('ERR',e.message))"`
Expected: `OK`

- [ ] **Step 5 : Déployer + vérifier la colonne en D1**

Run:
```bash
npm run deploy:pages
npx wrangler d1 execute revenue-manager --remote --command "SELECT risk, COUNT(*) FROM agent_actions GROUP BY risk"
```
Expected: déploiement sain + la requête s'exécute (les lignes existantes ont `risk=review` par défaut).

- [ ] **Step 6 : Commit**

```bash
git add functions/api/agents-actions.js
git commit -m "feat(triage): colonne risk sur agent_actions (PATCH + upsert + migration)"
```

---

## Task 6 : Brancher le triage dans `agents-run` (+ retry 1×)

**Files:**
- Modify: `functions/api/agents-run.js` (point R1 + bloc d'appel LLM par agent)

- [ ] **Step 1 : Importer le triage**

En tête de `functions/api/agents-run.js` :

```js
import { triageAction } from "./_triage.js";
```

- [ ] **Step 2 : Au moment où un agent renvoie ses actions candidates, filtrer + classer avant persistance**

À l'endroit identifié en R1 (juste avant l'insertion/upsert), pour chaque action candidate `act` produite par l'agent, avec `existingActions` = les actions actives déjà en base (déjà chargées par `fetchAgentHistory`, sinon faire un `SELECT id, action FROM agent_actions WHERE status IN ('backlog','a-planifier')`) :

```js
const verdict = triageAction(act, existingActions);
if (!verdict.keep) {
  // retry 1× UNIQUEMENT si vague/court (pas pour doublon)
  if (verdict.reason === "vague" || verdict.reason === "court") {
    const retry = await callLLM(env, {
      tier: "fast", max_tokens: 200, temperature: 0.4,
      logSource: `triage-retry:${act.agent || "?"}`,
      messages: [{ role: "user", content:
        `Réécris cette action d'agent pour qu'elle soit CONCRÈTE : nomme le bien, chiffre la cible, cite l'endpoint/outil. ` +
        `Une seule phrase, pas de blabla. Action vague : "${act.action}"` }],
    });
    const improved = (retry.text || "").trim().replace(/^["']|["']$/g, "");
    const v2 = triageAction({ ...act, action: improved }, existingActions);
    if (v2.keep) { act.action = improved; act.risk = v2.risk; }
    else { /* loggé via logSource ci-dessus, NON inséré */ continue; }
  } else {
    continue; // doublon → ignoré (loggable)
  }
} else {
  act.risk = verdict.risk;
}
// ... persistance existante de `act` (avec act.risk) ...
```

> ⚠️ Adapter les noms de variables (`act`, `existingActions`) à ceux réellement utilisés dans `agents-run.js`. L'important : (1) appeler `triageAction` avant l'insert, (2) poser `act.risk`, (3) `continue`/skip si `!keep` après retry.

- [ ] **Step 3 : Valider la syntaxe**

Run: `node --input-type=module -e "import('./functions/api/agents-run.js').then(()=>console.log('OK')).catch(e=>console.log('ERR',e.message))"`
Expected: `OK`

- [ ] **Step 4 : Déployer + run un agent de test**

Run:
```bash
npm run deploy:pages
TOKEN=$(curl -sS -X POST https://villamaryllis.com/api/admin-auth -H "Content-Type: application/json" --data '{"password":"<MDP_ADMIN>"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -sS -X POST "https://villamaryllis.com/api/agents-run" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data '{"agents":["seo-content-writer"]}' | head -c 400
```
Expected: réponse OK ; vérifier ensuite que les nouvelles actions ont un `risk` non nul :
`npx wrangler d1 execute revenue-manager --remote --command "SELECT id, risk, substr(action,1,40) FROM agent_actions ORDER BY created_at DESC LIMIT 5"`

- [ ] **Step 5 : Commit**

```bash
git add functions/api/agents-run.js
git commit -m "feat(triage): branche triageAction dans agents-run (filtre + retry 1x + risk)"
```

---

## Task 7 : Script de nettoyage rétroactif (L2)

**Files:**
- Create: `scripts/triage-backlog-once.mjs`

- [ ] **Step 1 : Écrire le script**

Le script lit le backlog via l'API prod, applique `triageAction` à chaque action `backlog`, et PATCH celles jugées vague/doublon en `bloqué` (réversible). **Rien n'est supprimé.**

```js
// scripts/triage-backlog-once.mjs
// Usage: ADMIN_PWD=xxx node scripts/triage-backlog-once.mjs [--apply]
// Sans --apply : dry-run (liste seulement). Avec --apply : PATCH réel.
import { triageAction } from "../functions/api/_triage.js";

const BASE = "https://villamaryllis.com";
const APPLY = process.argv.includes("--apply");
const pwd = process.env.ADMIN_PWD;
if (!pwd) { console.error("ADMIN_PWD requis"); process.exit(1); }

const auth = await (await fetch(`${BASE}/api/admin-auth`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: pwd }),
})).json();
const TOKEN = auth.token;

const data = await (await fetch(`${BASE}/api/agents-actions`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
})).json();
const all = data.actions;
const backlog = all.filter(a => a.status === "backlog");
const active = all.filter(a => ["backlog", "a-planifier"].includes(a.status));

let blocked = 0, risked = 0;
for (const a of backlog) {
  // exclure l'action elle-même de la liste de comparaison doublon
  const others = active.filter(x => x.id !== a.id);
  const v = triageAction(a, others);
  if (!v.keep) {
    console.log(`[${v.reason}] ${a.id} — ${a.action.slice(0, 60)}`);
    if (APPLY) {
      await fetch(`${BASE}/api/agents-actions?id=${a.id}`, {
        method: "PATCH", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "bloqué", notes: `triage auto 31/05 : ${v.reason}${v.dupOf ? " de " + v.dupOf : ""}` }),
      });
      blocked++;
    }
  } else if (APPLY) {
    await fetch(`${BASE}/api/agents-actions?id=${a.id}`, {
      method: "PATCH", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ risk: v.risk }),
    });
    risked++;
  }
}
console.log(`\n${APPLY ? "APPLIQUÉ" : "DRY-RUN"} — bloqués: ${blocked}, risk posé: ${risked}, backlog total: ${backlog.length}`);
```

- [ ] **Step 2 : Dry-run d'abord**

Run: `ADMIN_PWD='<MDP>' node scripts/triage-backlog-once.mjs`
Expected: liste des actions vague/doublon détectées, **sans rien modifier**. Vérifier manuellement que la liste a du sens (pas de faux positif évident).

- [ ] **Step 3 : Appliquer**

Run: `ADMIN_PWD='<MDP>' node scripts/triage-backlog-once.mjs --apply`
Expected: `APPLIQUÉ — bloqués: N, risk posé: M`.

- [ ] **Step 4 : Vérifier**

Run: `npx wrangler d1 execute revenue-manager --remote --command "SELECT status, risk, COUNT(*) FROM agent_actions GROUP BY status, risk"`
Expected: répartition cohérente (backlog avec risk auto/review/blocked, + les nouveaux bloqués doublon/vague).

- [ ] **Step 5 : Commit**

```bash
git add scripts/triage-backlog-once.mjs
git commit -m "feat(triage): script de nettoyage rétroactif du backlog (L2)"
```

---

## Task 8 : `agents-execute` — exécution autonome des `risk=auto` (L3)

**Files:**
- Create: `functions/api/agents-execute.js`

- [ ] **Step 1 : Écrire l'endpoint**

Réutilise `agents-deliver` (meta-seo) et crée des drafts réseau via la même mécanique que `agents-run` (table `agent_drafts`, statut `drafted`). **Aucune publication.**

```js
// functions/api/agents-execute.js
// Cron : prépare les actions risk=auto en brouillons (drafted). JAMAIS de publication.
// Auth : ?secret=POSTSTAY_SECRET OU token admin.
import { verifyBearer } from "./_adminauth.js";

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://villamaryllis.com" };
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.revenue_manager;
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  // Actions auto non encore préparées (on marque via notes pour idempotence)
  const { results } = await db.prepare(
    "SELECT * FROM agent_actions WHERE risk='auto' AND status IN ('backlog','a-planifier') " +
    "AND (notes IS NULL OR notes NOT LIKE '%[auto-préparé]%') LIMIT 10"
  ).all();

  const base = url.origin;
  let prepared = 0;
  const out = [];
  for (const a of results) {
    const cat = (a.category || "").toLowerCase();
    // mapping : seo→meta-seo si bien identifiable, sinon draft réseau pour content
    const bien = ["amaryllis","zandoli","iguana","geko","mabouya","schoelcher","nogent"]
      .find(b => (a.action || "").toLowerCase().includes(b));
    let res = null;
    if (cat === "seo" && bien) {
      res = await fetch(`${base}/api/agents-deliver?secret=${env.POSTSTAY_SECRET}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "meta-seo", bien }),
      }).then(r => r.json()).catch(e => ({ error: String(e) }));
    } else {
      // content → draft réseau : déléguer à agents-deliver email-sequence n'est pas auto au niveau prudent.
      // Au niveau prudent : seuls meta-seo + drafts réseau. Ici, si pas de bien SEO, on laisse en review.
      await db.prepare("UPDATE agent_actions SET risk='review' WHERE id=?").bind(a.id).run();
      out.push({ id: a.id, action: "rebasculé en review (pas de cible auto claire)" });
      continue;
    }
    // Garde-fou : si le livrable n'est pas valide (fact-check), repasser en review
    const valid = res && res.livrable && res.livrable.valid;
    if (!valid) {
      await db.prepare("UPDATE agent_actions SET risk='review' WHERE id=?").bind(a.id).run();
      out.push({ id: a.id, action: "fact-check KO → review" });
      continue;
    }
    // Stocker en agent_drafts (statut drafted) + marquer l'action
    await db.prepare(
      "INSERT INTO agent_drafts (agent, agent_label, agent_emoji, type, payload, rationale, preview, status, created_at, updated_at) " +
      "VALUES (?,?,?,?,?,?,?,'drafted',unixepoch(),unixepoch())"
    ).bind(
      a.agent, a.agent_label, a.agent_emoji, "meta-seo",
      JSON.stringify(res.livrable), `Auto-préparé depuis action ${a.id}`,
      `${res.livrable.title} — ${res.livrable.description}`.slice(0, 200)
    ).run();
    await db.prepare("UPDATE agent_actions SET notes = COALESCE(notes,'') || ' [auto-préparé]', updated_at=unixepoch() WHERE id=?").bind(a.id).run();
    prepared++;
    out.push({ id: a.id, prepared: true, title: res.livrable.title });
  }
  return json({ ok: true, prepared, details: out });
}
```

> ⚠️ Vérifier le nom exact des colonnes de `agent_drafts` (`grep -nA15 "CREATE TABLE IF NOT EXISTS agent_drafts" functions/api/agent-drafts.js`) et adapter l'INSERT. Vérifier aussi le format de retour de `agents-deliver` (champ `livrable.valid`).

- [ ] **Step 2 : Valider la syntaxe**

Run: `node --input-type=module -e "import('./functions/api/agents-execute.js').then(()=>console.log('OK')).catch(e=>console.log('ERR',e.message))"`
Expected: `OK`

- [ ] **Step 3 : Déployer + test manuel (invariant de sûreté)**

Run:
```bash
npm run deploy:pages
TOKEN=$(curl -sS -X POST https://villamaryllis.com/api/admin-auth -H "Content-Type: application/json" --data '{"password":"<MDP>"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -sS "https://villamaryllis.com/api/agents-execute" -H "Authorization: Bearer $TOKEN"
```
Expected: `{ ok: true, prepared: N, ... }`. **Invariant à vérifier** : aucun draft créé n'a le statut `approved` ou `published` :
`npx wrangler d1 execute revenue-manager --remote --command "SELECT status, COUNT(*) FROM agent_drafts GROUP BY status"`
→ les nouveaux doivent être `drafted` uniquement.

- [ ] **Step 4 : Commit**

```bash
git add functions/api/agents-execute.js
git commit -m "feat(triage): agents-execute — prépare les actions auto en drafts (L3, jamais publié)"
```

---

## Task 9 : Digest hebdo (L4)

**Files:**
- Create: `functions/api/agents-digest.js`

- [ ] **Step 1 : Écrire l'endpoint digest**

Agrège l'état et envoie un récap via Resend (réutiliser le pattern d'envoi de `send-poststay.js` / `send-guest-email.js`) + ntfy.

```js
// functions/api/agents-digest.js
// Cron hebdo : récap email/ntfy de l'état des agents. Auth ?secret=POSTSTAY_SECRET.
const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://villamaryllis.com" };
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.revenue_manager;
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET)
    return json({ error: "secret invalide" }, 401);

  const drafts = await db.prepare("SELECT COUNT(*) n FROM agent_drafts WHERE status='drafted'").first();
  const toReview = await db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE risk='review' AND status IN ('backlog','a-planifier')").first();
  const blocked = await db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE risk='blocked' AND status IN ('backlog','a-planifier')").first();
  const doneWeek = await db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE status='fait' AND updated_at > unixepoch()-604800").first();

  const text =
`📊 Digest agents — semaine\n\n` +
`✅ ${drafts.n} brouillons prêts à publier (file Approbations)\n` +
`📋 ${toReview.n} actions à valider (review)\n` +
`🔒 ${blocked.n} bloquées (€/légal — décision manuelle)\n` +
`🏁 ${doneWeek.n} actions terminées cette semaine\n\n` +
`→ Valide en 1 clic : https://villamaryllis.com/admin (onglet Approbations)`;

  // ntfy (best-effort)
  if (env.NTFY_TOPIC) {
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, { method: "POST", body: text, headers: { Title: "Digest agents Amaryllis" } }).catch(() => {});
  }
  // email via Resend (best-effort)
  if (env.RESEND_API_KEY && env.RESEND_FROM) {
    await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM, to: ["vinsmaf@hotmail.com"],
        subject: "📊 Digest agents Amaryllis — semaine",
        text,
      }),
    }).catch(() => {});
  }
  return json({ ok: true, drafts: drafts.n, toReview: toReview.n, blocked: blocked.n, doneWeek: doneWeek.n });
}
```

> ⚠️ Confirmer l'email destinataire (`vinsmaf@hotmail.com` d'après PROJECT_MEMORY) et le pattern Resend exact dans un endpoint email existant.

- [ ] **Step 2 : Valider la syntaxe**

Run: `node --input-type=module -e "import('./functions/api/agents-digest.js').then(()=>console.log('OK')).catch(e=>console.log('ERR',e.message))"`
Expected: `OK`

- [ ] **Step 3 : Déployer + test manuel**

Run:
```bash
npm run deploy:pages
curl -sS "https://villamaryllis.com/api/agents-digest?secret=<POSTSTAY_SECRET>"
```
Expected: `{ ok: true, drafts, toReview, blocked, doneWeek }` + réception ntfy/email.

- [ ] **Step 4 : Commit**

```bash
git add functions/api/agents-digest.js
git commit -m "feat(triage): digest hebdo agents (L4) via Resend + ntfy"
```

---

## Task 10 : Crons Worker (agents-execute + agents-digest)

**Files:**
- Modify: `workers/ical-sync/index.js` (handler `scheduled`)
- Modify: `wrangler.toml` (ou `workers/ical-sync/wrangler.toml`) — section `[triggers] crons`

- [ ] **Step 1 : Confirmer le fichier wrangler du Worker + les crons existants**

Run: `grep -rn "crons\|0 6 \* \* 1\|0 12 \* \* \*" wrangler.toml workers/ical-sync/`
Noter le fichier qui porte `[triggers] crons` et les schedules déjà présents.

- [ ] **Step 2 : Ajouter 2 crons hebdo**

Dans la section `crons = [...]` du wrangler du Worker, ajouter (lundi) :
```toml
  "0 7 * * 1",   # agents-execute : prépare les drafts auto
  "30 7 * * 1",  # agents-digest : récap hebdo
```

- [ ] **Step 3 : Router ces crons dans `scheduled()`**

Dans `workers/ical-sync/index.js`, handler `scheduled(event, env, ctx)`, ajouter selon `event.cron` (suivre le pattern des appels existants `runRagIngest`/`runEditorialDraftGen` qui font des `fetch` authentifiés vers les endpoints Pages) :

```js
    if (event.cron === "0 7 * * 1") {
      ctx.waitUntil(fetch(`https://villamaryllis.com/api/agents-execute?secret=${env.POSTSTAY_SECRET}`));
    }
    if (event.cron === "30 7 * * 1") {
      ctx.waitUntil(fetch(`https://villamaryllis.com/api/agents-digest?secret=${env.POSTSTAY_SECRET}`));
    }
```

> ⚠️ Vérifier que `POSTSTAY_SECRET` est bien dans les secrets du Worker (il a été ajouté pour `runRagIngest` — cf PROJECT_MEMORY). Sinon : `npx wrangler secret put POSTSTAY_SECRET` (dans le dossier du Worker).

- [ ] **Step 4 : Déployer le Worker**

Run: `npm run deploy:worker`
Expected: déploiement OK, les nouveaux crons listés.

- [ ] **Step 5 : Commit**

```bash
git add workers/ical-sync/index.js wrangler.toml
git commit -m "feat(triage): crons hebdo agents-execute + agents-digest (Worker)"
```

---

## Task 11 : Documentation & mémoire

**Files:**
- Modify: `PROJECT_MEMORY.md`, `CLAUDE.md`

- [ ] **Step 1 : Mettre à jour PROJECT_MEMORY (§8 backlog & agents)**

Ajouter un paragraphe : système de triage live (risk auto/review/blocked), `_triage.js`, `agents-execute` (cron lundi 7h, drafts only), `agents-digest` (lundi 7h30), nettoyage rétroactif fait. Noter le niveau prudent (meta-seo + drafts réseau seulement) et comment l'élargir.

- [ ] **Step 2 : Mettre à jour CLAUDE.md (table des endpoints)**

Ajouter `/api/agents-execute` et `/api/agents-digest` + `_triage.js` à la section architecture agents.

- [ ] **Step 3 : Commit**

```bash
git add PROJECT_MEMORY.md CLAUDE.md
git commit -m "docs: triage autonome agents — mémoire + endpoints"
```

---

## Définition de "terminé"

- [ ] `npx vitest run` → tous verts (dont `triage.test.js`).
- [ ] `npm run deploy:pages` → smoke test OK.
- [ ] D1 : `agent_actions.risk` rempli pour le backlog ; nouveaux drafts en `drafted` uniquement (jamais `approved`/`published` auto).
- [ ] Digest reçu (ntfy/email) au déclenchement manuel.
- [ ] Garde-fous respectés : aucun prix appliqué, aucune dépense, aucun email voyageur envoyé auto, aucune publication réseau auto.
