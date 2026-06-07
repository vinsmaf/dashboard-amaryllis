# Messagerie admin — Niveau 1 (historique emails sortants)

**Status:** Approved — ready for implementation
**Date:** 2026-06-07
**Scope:** `functions/api/_sendEmail.js` (nouveau helper), refactor de 4 endpoints client critiques, table D1 `emails_log`, onglet admin `MessagerieTab` + intégration dans le panneau résa Planning.

---

## Contexte & problème

Aujourd'hui le système envoie **~5-15 emails par réservation** (confirmation, codes d'accès, pré-arrivée, post-séjour, etc.) via **19 points d'appel `fetch("https://api.resend.com/emails")`** dispersés dans 15 fichiers. **Aucune trace** de ces envois n'est conservée :
- Impossible de savoir ce qui a été envoyé à un client donné
- Impossible de relire l'email exact en cas de litige ou question
- Pas de visibilité sur les échecs Resend silencieux (déjà arrivé avec `RESEND_FROM` cassé)

Le user veut une **messagerie admin** pour voir l'historique complet par client/résa.

**Niveau 1 (ce spec) :** logging + UI lecture seule. Pas de réponse depuis l'admin, pas de webhook open/click.
**Niveau 2 (futur, hors scope) :** boîte 2 voies (IMAP/webhook inbound).
**Backlog confirmé :** webhook Resend opens/clicks → ajoute statut "lu / cliqué" sur les emails déjà loggés.

---

## Décisions de design

1. **Helper centralisé `_sendEmail.js`** — wrap unique autour de l'API Resend, log auto en D1 à chaque envoi. Remplace progressivement les `fetch` directs.
2. **Catégorisation `client` vs `internal`** — chaque envoi passe une catégorie. La UI Messagerie n'affiche que `category="client"`. Les emails internes (alertes hôte, digest agents, alertes prix) sont loggés mais invisibles.
3. **Refactor par vagues** — vague 1 = 4 endpoints client critiques (`notify-booking`, `stripe-webhook`, `send-poststay`, `send-prearrivee`). Vague 2 = autres endpoints client (`send-guest-email`, `contact`, `sign-contract`). Les 11 endpoints internes restent inchangés (zéro risque).
4. **Rattachement par email + booking_id optionnel** — clé primaire = `to_email` (marche partout). Si l'envoi connaît `booking_id` (cas Stripe webhook), c'est encore plus précis.
5. **Logs en best-effort** — l'insertion en D1 n'échoue jamais l'envoi : si D1 plante, l'email part quand même, l'erreur D1 est logguée console.
6. **HTML complet stocké** — pour relire exactement ce que le client a reçu (utile litige/support). Volume estimé ~1.5 MB/an, négligeable.

---

## Architecture

```
┌─ Helper centralisé ────────────────────────────────────────┐
│ functions/api/_sendEmail.js  (NOUVEAU)                      │
│   sendEmail(env, { to, subject, html, template, category,   │
│                    bien_id?, booking_id?, ... })            │
│   → fetch Resend                                            │
│   → INSERT emails_log (best-effort)                         │
│   → return { ok, id, resendId, error }                      │
└────────────────────────────────────────────────────────────┘
              ▲                              ▲
              │ vague 1                      │ vague 2
              │                              │
   notify-booking.js               send-guest-email.js
   stripe-webhook.js               contact.js
   send-poststay.js                sign-contract.js
   send-prearrivee.js              (autres endpoints client)

┌─ Endpoint lecture ─────────────────────────────────────────┐
│ functions/api/emails-log.js  (NOUVEAU)                      │
│   GET /api/emails-log?group=clients  → agrégat par email    │
│   GET /api/emails-log?to=<email>     → fil d'un client      │
│   GET /api/emails-log?booking_id=<>  → fil d'une résa       │
│   GET /api/emails-log/body?id=<>     → HTML complet         │
│   (admin auth Bearer)                                       │
└────────────────────────────────────────────────────────────┘

┌─ UI admin ─────────────────────────────────────────────────┐
│ src/tabs/MessagerieTab.jsx  (NOUVEAU)                       │
│   Onglet "📧 Messagerie" en haut niveau                     │
│                                                              │
│ src/tabs/messagerie/EmailDrawer.jsx  (NOUVEAU)              │
│   Drawer latéral : fil chronologique d'un client            │
│                                                              │
│ src/tabs/messagerie/ResaEmailList.jsx  (NOUVEAU)            │
│   Panneau compact intégré dans Planning (détail résa)       │
└────────────────────────────────────────────────────────────┘
```

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `functions/api/_sendEmail.js` | Création (helper centralisé) |
| `functions/api/emails-log.js` | Création (endpoint lecture admin) |
| `functions/api/notify-booking.js` | Refactor — utilise `sendEmail()` |
| `functions/api/stripe-webhook.js` | Refactor — utilise `sendEmail()` |
| `functions/api/send-poststay.js` | Refactor — utilise `sendEmail()` |
| `functions/api/send-prearrivee.js` | Refactor — utilise `sendEmail()` |
| `migrations/0001_emails_log.sql` | Création (schéma D1) |
| `src/tabs/MessagerieTab.jsx` | Création (onglet global) |
| `src/tabs/messagerie/EmailDrawer.jsx` | Création (drawer fil) |
| `src/tabs/messagerie/ResaEmailList.jsx` | Création (composant intégré Planning) |
| `src/App.jsx` | Modification — ajoute onglet "📧 Messagerie" |
| `src/tabs/Planning.jsx` | Modification — insère `<ResaEmailList>` dans détail résa |

**Hors scope vague 1 (refactor plus tard) :**
`send-guest-email.js`, `contact.js`, `sign-contract.js`, `send-vacancy-alert.js`, `send-menage-alert.js`, `send-prix-alert.js`, `send-prix-recap.js`, `agent-drafts.js`, `agents-digest.js`, `devis-solde-cron.js`, `beds24-token-watch.js`, `workers/ical-sync/index.js` (4 appels).

---

## Schéma D1 `emails_log`

```sql
-- migrations/0001_emails_log.sql
CREATE TABLE IF NOT EXISTS emails_log (
  id          TEXT PRIMARY KEY,           -- ULID généré localement
  resend_id   TEXT,                       -- ID Resend (pour matcher futurs webhooks)
  to_email    TEXT NOT NULL,              -- destinataire (clé de rattachement principale)
  from_email  TEXT,
  subject     TEXT NOT NULL,
  template    TEXT,                       -- ex: "poststay_j1", "prearrivee", "confirmation", "contact", "manual"
  category    TEXT NOT NULL,              -- "client" | "internal"
  bien_id     TEXT,                       -- amaryllis | mabouya | ... (NULL si non rattachable)
  booking_id  TEXT,                       -- payment_intent_id si résa directe (NULL sinon)
  html        TEXT,                       -- corps HTML complet
  text        TEXT,                       -- corps text fallback
  status      TEXT NOT NULL,              -- "sent" | "failed"
  error       TEXT,                       -- message d'erreur Resend si status="failed"
  sent_at     INTEGER NOT NULL,           -- unix ms
  -- Champs futurs pour webhooks Resend (NULL pour l'instant, ajoutés ici pour éviter migration)
  opened_at   INTEGER,
  clicked_at  INTEGER,
  bounced_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_emails_to ON emails_log(to_email, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_booking ON emails_log(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_client ON emails_log(category, sent_at DESC);
```

---

## Helper `_sendEmail.js`

**Signature :**
```js
import { sendEmail } from "./_sendEmail.js";

const { ok, id, resendId, error } = await sendEmail(env, {
  to: "client@example.com",          // string ou string[]
  subject: "Votre arrivée demain",
  html: "<p>...</p>",
  text: "...",                       // optionnel
  from: "Amaryllis <contact@…>",     // optionnel, fallback resendFrom(env)
  reply_to: "contact@villamaryllis.com",  // optionnel
  template: "prearrivee",            // libre, sert au filtrage UI
  category: "client",                // "client" (default) | "internal"
  bien_id: "amaryllis",              // optionnel
  booking_id: "pi_abc123",           // optionnel
});
```

**Comportement :**
1. Envoi via `fetch("https://api.resend.com/emails")`
2. Insert en D1 `emails_log` (try/catch — n'échoue jamais l'appel)
3. Retourne `{ ok, id (interne), resendId, error }`

**Backward-compat :** les endpoints non encore refactorés continuent à appeler `fetch` directement → aucun risque de régression. Le refactor se fait endpoint par endpoint.

**Test unitaire (vitest) :** mock `fetch` + mock D1 prepare/bind/run → vérifier que les bons champs sont insérés selon les paramètres, que `category=client` est par défaut, que l'échec Resend ne bloque pas le log.

---

## Endpoint `/api/emails-log`

**Méthodes :** GET uniquement, auth Bearer admin.

```js
// GET /api/emails-log?group=clients
// → { clients: [{ email, last_sent, count, last_subject, last_status, bien_id, booking_id }] }

// GET /api/emails-log?to=marie@example.com&limit=50
// → { emails: [{ id, sent_at, subject, template, status, bien_id, booking_id, opened_at, ... }] }

// GET /api/emails-log?booking_id=pi_abc123
// → { emails: [...] } (même shape que ci-dessus, filtré sur booking_id)

// GET /api/emails-log/body?id=<emailId>
// → { html, text, subject, sent_at, to, from }
```

Toutes les requêtes filtrent automatiquement `category = 'client'` — la UI Messagerie ne voit jamais les emails internes.

---

## UI Messagerie

### MessagerieTab.jsx — vue principale

**Layout :** liste verticale des destinataires (groupés par `to_email`), triée par `MAX(sent_at) DESC`. Chaque ligne :
- Badge couleur (🔵 = a un booking_id rattaché, ⚪ = juste un email)
- `to_email` (cliquable)
- Bien rattaché (si dispo)
- Nombre d'emails
- Date du dernier
- Aperçu sujet du dernier
- Statut du dernier (envoyé / échec)

Recherche par email/sujet en haut. Pas de pagination v1 (limite 200 lignes — au-delà on ajoutera).

**Clic ligne → EmailDrawer s'ouvre à droite.**

### EmailDrawer.jsx — fil détaillé

Drawer latéral 480px, fermeture par X ou clic backdrop. Affiche :
- En-tête : `to_email`, bien, lien vers la résa Planning si `booking_id`
- Fil chronologique (plus récent en haut) de tous les emails envoyés à ce client
- Chaque email = carte compacte (date relative, template, sujet, statut)
- Clic sur une carte → expand inline (charge le HTML via `/api/emails-log/body?id=…`)
- HTML rendu dans un iframe sandboxed (sécurité)

### ResaEmailList.jsx — intégré Planning

Composant compact (~200px de haut max) intégré dans le panneau de détail d'une réservation Planning. Affiche les emails envoyés à `resa.email` (filtrage par `to_email` ou `booking_id`). Format : liste courte cliquable, ouvre EmailDrawer au clic.

---

## Refactor des 4 endpoints vague 1

Pour chaque endpoint, remplacer le pattern `fetch("https://api.resend.com/emails", ...)` par `await sendEmail(env, { ... })`.

**Exemple — avant** (`notify-booking.js` ligne ~55) :
```js
const r = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: resendFrom(env), to: [hostEmail], subject, html }),
});
```

**Après :**
```js
const result = await sendEmail(env, {
  to: hostEmail,
  subject,
  html,
  template: "notify_booking_host",
  category: "internal",  // ⚠️ alerte hôte = internal, pas client
  booking_id: paymentIntentId,
  bien_id: bienId,
});
```

⚠️ **Attention catégories par endpoint :**
- `notify-booking.js` → email à l'**hôte** = `category: "internal"`
- `stripe-webhook.js` → email de confirmation au **client** = `category: "client"`
- `send-poststay.js` → email demande d'avis au **client** = `category: "client"`
- `send-prearrivee.js` → email arrivée au **client** = `category: "client"`

---

## Tests

- **Unitaires `_sendEmail`** : mock fetch + mock D1 → 5 cas (succès, échec Resend, échec D1, catégorie par défaut, booking_id optionnel)
- **Endpoint `/api/emails-log`** : test auth Bearer rejette sans token, GET group=clients renvoie shape correct, filtre `category='client'` toujours actif
- **Runtime UI** : `npm run dev` + preview MCP → ouvrir MessagerieTab, vérifier rendu, ouvrir EmailDrawer, vérifier qu'aucune erreur console
- **Migration D1** : exécuter `wrangler d1 execute revenue-manager --remote --file=migrations/0001_emails_log.sql` AVANT le deploy des endpoints qui écrivent dedans (sinon échec INSERT)

---

## Ordre d'exécution (8 tâches)

```
T1. Migration D1 emails_log + index
T2. Helper _sendEmail.js + tests unitaires vitest
T3. Endpoint /api/emails-log (GET liste + détail + body)
T4. Refactor vague 1 : notify-booking + stripe-webhook + send-poststay + send-prearrivee
T5. Test runtime local (preview MCP) : envoi test, vérif insert D1, lecture endpoint
T6. UI MessagerieTab + EmailDrawer + onglet App.jsx
T7. ResaEmailList intégré Planning (détail résa)
T8. Test runtime local UI complet + deploy + vérif live
```

Chaque tâche se commit séparément. Les refactors d'endpoints (T4) peuvent être commit/déployés un par un si on veut être prudent (vague micro).

---

## Sécurité & contraintes

- **Auth admin obligatoire** sur `/api/emails-log` (Bearer token, comme `client-errors.js`)
- **HTML stocké rendu dans iframe sandboxed** côté UI (pas de `dangerouslySetInnerHTML` direct)
- **RGPD** : les emails contiennent des données personnelles (nom, email, séjour). Stockés en D1 EU (Cloudflare US/EU edge selon région). À noter dans la politique de confidentialité si pas déjà fait — mais pas bloquant pour le déploiement (les emails sont DÉJÀ envoyés, on les indexe juste).
- **Pas d'exposition publique** : aucun endpoint public ne lit `emails_log`. Bearer admin only.

---

## Non-scope (futur)

- Webhook Resend `email.opened` / `email.clicked` → table déjà prête (`opened_at`, `clicked_at`)
- Réponse depuis l'admin (IMAP / Postmark inbound) → Niveau 2
- Refactor des 11 autres endpoints (`send-guest-email`, `contact`, alertes internes, Worker iCal) → vague 2 quand vague 1 est stable
- Export CSV des emails → utile si demandé
- Recherche full-text dans le HTML → utile si volume grossit
