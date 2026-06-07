# Messagerie admin — Feature A : Compositeur email + génération codes promo

**Status:** Approved — ready for implementation
**Date:** 2026-06-07
**Scope:** Nouveau compositeur d'email manuel dans l'admin avec templates pré-remplis, génération de codes promo à la volée et insertion automatique. Construit sur le système de messagerie niveau 1 (commit `b87b3df...8399b8d`).

---

## Contexte

Le système Messagerie niveau 1 permet de voir l'historique des emails sortants par client. Mais pour pouvoir **agir** (relances commerciales, offres ciblées), il manque la capacité d'envoyer un email depuis l'admin.

Ce spec ajoute :
1. Un **compositeur** complet (modal, templates, aperçu live)
2. La **génération de codes promo uniques** (stockés en D1, prêts pour le tracking conversion en feature D)
3. L'**envoi tracé** via le helper `_sendEmail.js` existant

C'est la **brique de base** que B (auto relances), C (envoi en masse) et D (tracking) réutiliseront.

---

## Décisions de design

1. **Templates HTML servis comme assets** — même pattern que `send-guest-email.js` existant. Variables `{{name}}` interpolées côté serveur. Cohérence assurée.
2. **Templates optionnels** — sélecteur permet "Aucun" (édition libre) + 3 modèles. Le user peut éditer librement par-dessus.
3. **Code promo généré à la demande** — bouton "+ Générer code promo" déclenche un mini-modal (type, valeur, validité, bien). Code créé en D1 puis bloc HTML inséré dans le corps. Une génération par compositeur (re-générer = annuler + recommencer).
4. **Aperçu live iframe sandboxed** — debounce 300ms, mise à jour automatique du HTML final.
5. **Sanitization HTML serveur** — whitelist tags basiques avant Resend (jamais `<script>`). Module `_sanitizeHtml.js` réutilisable.
6. **Rate limiting** — 20 envois manuels/h/IP via `_ratelimit.js` existant (anti-abus si compromission).
7. **Logs auto** — réutilise `_sendEmail.js` → log dans `emails_log` avec `template="manual_custom"`, `category="client"`, `booking_id` si rattaché. Visible immédiatement dans la Messagerie.

---

## Architecture

```
┌─ UI (NOUVEAU) ─────────────────────────────────────────┐
│ src/tabs/messagerie/EmailComposer.jsx                   │
│   ├── Modal plein écran (overlay)                       │
│   ├── Bouton "✉ Nouveau mail" dans MessagerieTab        │
│   ├── Bouton "✉ Nouveau mail" dans EmailDrawer          │
│   ├── Sélecteur template (4 options : Aucun, 3 modèles) │
│   ├── Input destinataire (pré-rempli si depuis drawer)  │
│   ├── Input sujet                                       │
│   ├── Textarea corps (avec variables auto)              │
│   ├── Bouton "+ Générer code promo" → PromoCodeModal    │
│   ├── Iframe aperçu live (sandbox)                      │
│   └── Bouton Envoyer                                    │
│                                                          │
│ src/tabs/messagerie/PromoCodeModal.jsx                  │
│   ├── Type (%, €)                                       │
│   ├── Valeur                                            │
│   ├── Validité (jours, default 14)                      │
│   ├── Bien (Tous / un spécifique)                       │
│   └── POST /api/promo-codes → retourne code             │
└──────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─ Backend (NOUVEAUX endpoints) ──────────────────────────┐
│ functions/api/send-custom-email.js                       │
│   POST { to, subject, html, bien_id?, booking_id?,      │
│          promo_code?, template_name? }                  │
│   ├── Auth Bearer admin                                 │
│   ├── Rate limit 20/h/IP                                │
│   ├── Sanitize HTML                                     │
│   ├── Appelle sendEmail() helper (log D1 auto)          │
│   └── Retourne { ok, email_id }                         │
│                                                          │
│ functions/api/promo-codes.js                             │
│   POST { type, value, validity_days, bien_id, for_email }│
│   ├── Génère code unique (PREFIX-RANDOM)                │
│   ├── INSERT INTO promo_codes                           │
│   └── Retourne { code, expires_at }                     │
│                                                          │
│   GET ?active=1 → liste codes actifs (admin Bearer)     │
│                                                          │
│ functions/api/_sanitizeHtml.js (utilitaire partagé)     │
│   sanitizeHtml(rawHtml) → HTML safe (whitelist tags)    │
└──────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─ Storage ───────────────────────────────────────────────┐
│ D1 emails_log     → déjà en place (log auto)            │
│ D1 promo_codes    → NOUVELLE (codes générés)            │
│                                                          │
│ public/email-templates/                                  │
│   manual-decouverte.html  (offre découverte)            │
│   manual-relance.html     (relance courtoise)           │
│   manual-question.html    (question/suivi)              │
│   _promo-block.html       (snippet réutilisable pour    │
│                            insertion code promo)        │
└──────────────────────────────────────────────────────────┘
```

---

## Schéma D1 `promo_codes`

```sql
-- migrations/0002_promo_codes.sql
CREATE TABLE IF NOT EXISTS promo_codes (
  code         TEXT PRIMARY KEY,          -- ex: "CAMBIER-A8F2"
  type         TEXT NOT NULL,             -- "percent" | "amount_eur"
  value        INTEGER NOT NULL,          -- 10 (= -10%) ou 50 (= -50€)
  bien_id      TEXT,                      -- limite à un bien (NULL = tous)
  expires_at   INTEGER NOT NULL,          -- unix ms
  max_uses     INTEGER DEFAULT 1,         -- 1 = single use (default)
  used_count   INTEGER DEFAULT 0,         -- incrémenté à chaque conversion (feature D)
  created_at   INTEGER NOT NULL,          -- unix ms
  created_for  TEXT,                      -- email du destinataire (pour tracer)
  note         TEXT                       -- libre, ex: "relance panier Cambier"
);
CREATE INDEX IF NOT EXISTS idx_promo_expires ON promo_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_promo_for ON promo_codes(created_for);
```

**Format du code :**
- `PREFIX-RANDOM` où PREFIX = 6 premiers chars du nom destinataire en MAJ (extrait du local-part de l'email avant `@`, fallback `AMARYLLIS`)
- RANDOM = 4 chars alphanumériques uppercase (générés via `crypto.getRandomValues`)
- Exemple : `cambierfrancois@gmail.com` → `CAMBIE-A8F2` (7+4 = 11 chars, mémorable)
- Si collision (existe déjà en D1) → re-roll (max 3 essais)

---

## Templates HTML

3 fichiers + 1 snippet partagé dans `public/email-templates/` :

### Variables disponibles (toujours)
- `{{prenom}}` (du booking si dispo, sinon "")
- `{{bien_nom}}` (du booking, sinon "votre logement")
- `{{bien_url}}` (https://villamaryllis.com/{bien_id})
- `{{checkin}}`, `{{checkout}}` (si booking)
- `{{promo_block}}` ⭐ — vide par défaut, remplacé par le snippet `_promo-block.html` si code promo généré

### Template 1 : `manual-decouverte.html`
Tonalité chaleureuse, sans urgence. Présente le bien, propose d'en discuter, bloc promo optionnel.

### Template 2 : `manual-relance.html`
Pour panier abandonné. Rappelle le bien visité, propose de finaliser, bloc promo optionnel pour inciter.

### Template 3 : `manual-question.html`
Pour question pré/post séjour. Conversationnel, pas de bloc promo.

### Snippet `_promo-block.html`
```html
<div style="background:#fef3c7;border:2px dashed #f59e0b;padding:18px;margin:20px 0;text-align:center;border-radius:10px;">
  <div style="font-size:11px;color:#92400e;font-weight:600;letter-spacing:1px;">VOTRE CODE EXCLUSIF</div>
  <div style="font-size:26px;font-weight:800;color:#0e3b3a;letter-spacing:2px;margin:8px 0;">{{promo_code}}</div>
  <div style="font-size:13px;color:#92400e;">{{promo_text}}</div>
</div>
```

Où :
- `{{promo_code}}` = code généré (ex: `CAMBIE-A8F2`)
- `{{promo_text}}` = ex: "−10% sur votre séjour · valable jusqu'au 21/06/2026"

---

## Helper `_sanitizeHtml.js`

```js
// functions/api/_sanitizeHtml.js
// Sanitization HTML minimale pour les emails envoyés depuis le compositeur admin.
// Whitelist : tags structurels + style inline. PAS de <script>, PAS de event handlers.

const ALLOWED_TAGS = new Set([
  "p", "br", "div", "span", "a", "img", "strong", "em", "b", "i", "u",
  "h1", "h2", "h3", "h4", "ul", "ol", "li", "blockquote",
  "table", "tr", "td", "th", "tbody", "thead", "hr"
]);

export function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";
  // Stripper TOUS les <script>...</script> et leurs contenus
  let out = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Stripper TOUS les attributs onXXX="..."
  out = out.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\s+on\w+\s*=\s*'[^']*'/gi, "");
  // Stripper javascript: dans href/src
  out = out.replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"');
  // (Pas de stripper de tags hors whitelist en v1 — on garde si HTML est cohérent.
  //  Le user admin contrôle ce qu'il colle, c'est pas du UGC public.)
  return out;
}
```

Note : la sanitization v1 est volontairement minimale (anti-XSS basique). Elle ne casse pas les emails HTML complexes générés par les templates. Si on ouvre un jour la composition à des non-admins, on passera à DOMPurify.

---

## Endpoint `/api/promo-codes`

```js
// POST /api/promo-codes  (admin Bearer)
// Body: { type: "percent"|"amount_eur", value: 10, validity_days: 14, bien_id?: "amaryllis", for_email?: "x@y.com", note?: "..." }
// Réponse: { ok: true, code: "CAMBIE-A8F2", expires_at: 1782380000000, valid_for_days: 14 }

// GET /api/promo-codes?active=1  (admin Bearer)
// Réponse: { codes: [{ code, type, value, bien_id, expires_at, used_count, max_uses, created_for, note }, ...] }
```

**Génération du code :**
- PREFIX = 6 premiers chars de `email.split("@")[0]`, nettoyé en `[A-Z0-9]+`, fallback `AMARYL`
- RANDOM = 4 chars de `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sans 0/O/1/I/L pour lisibilité)
- Code = `PREFIX-RANDOM`
- Insertion avec `INSERT OR IGNORE` → si collision, re-roll (max 3 essais), sinon erreur

---

## Endpoint `/api/send-custom-email`

```js
// POST /api/send-custom-email  (admin Bearer + rate limit 20/h/IP)
// Body: {
//   to: "client@example.com",
//   subject: "Votre séjour à Mabouya",
//   html: "<p>Corps complet du mail...</p>",
//   bien_id?: "mabouya",          // pour rattacher au bien
//   booking_id?: "pi_xxx",         // pour rattacher à une résa précise
//   template_name?: "manual-relance",  // pour logger quel template a servi de base
//   promo_code?: "CAMBIE-A8F2"     // pour logger le code promo associé
// }
// Réponse: { ok: true, email_id: "<ulid>", resend_id: "<resend_uuid>" }
```

**Validation :**
- `to` : valide email regex
- `subject` : 1-200 chars
- `html` : 1-30000 chars
- HTML sanitisé avant Resend

**Comportement :**
1. Rate limit check (D1 `rate_limits`)
2. Auth Bearer admin
3. Validation
4. Sanitize HTML
5. `sendEmail()` helper → log auto `emails_log` avec `template = template_name || "manual_custom"`, `category="client"`
6. Si `promo_code` fourni, l'ajouter dans `emails_log.template` comme suffixe (ex: `manual_custom|promo:CAMBIE-A8F2`) pour faciliter le traçage

---

## UI `EmailComposer.jsx`

### Props
```jsx
<EmailComposer
  isOpen={true}
  onClose={() => ...}
  defaultTo="cambierfrancois@gmail.com"    // optionnel
  defaultBookingId="pi_xxx"                // optionnel
  defaultBienId="mabouya"                  // optionnel
  defaultPrenom="François"                 // optionnel (extrait du booking si dispo)
/>
```

### Workflow user
1. Ouvre modal (depuis MessagerieTab ou EmailDrawer)
2. Choisit un template (ou Aucun)
3. Édite sujet + corps librement (variables `{{prenom}}` interpolées côté serveur AU MOMENT DE L'ENVOI, pas dans l'éditeur — pour ne pas perdre la possibilité d'éditer la variable)
4. Optionnellement : "+ Générer code promo" → mini-modal → code généré + bloc inséré à la fin du corps
5. Aperçu live (iframe sandbox) en bas du modal
6. Clic "✉ Envoyer" → POST → toast OK → fermeture modal

### Templates Loading (côté client)
Au mount, fetch `/email-templates/manual-decouverte.html` etc. en parallèle. Cache en `useState`.

### Aperçu live
Iframe `sandbox=""` avec `srcDoc={previewHtml}`. `previewHtml` = template rempli avec variables (depuis le booking si dispo) + bloc promo si généré.

### Bouton dans MessagerieTab
Ajouter en haut à droite : `<button onClick={() => setComposerOpen(true)}>✉ Nouveau mail</button>`.

### Bouton dans EmailDrawer
Ajouter dans le header (à côté de "Fermer ✕") : `<button onClick={onCompose}>✉ Nouveau mail à ce client</button>`.

---

## UI `PromoCodeModal.jsx`

### Props
```jsx
<PromoCodeModal
  isOpen={true}
  onClose={() => ...}
  defaultBienId="mabouya"   // pré-rempli
  defaultForEmail="x@y.com" // pré-rempli (pour PREFIX du code)
  onGenerated={(code, text) => ...}  // callback avec le code + le texte à afficher
/>
```

### Champs
- Type : ⚫% ⚪€
- Valeur : input number (1-99 si %, 1-9999 si €)
- Validité : input number jours (1-365, default 14)
- Bien : select avec "Tous les biens" + liste depuis biens.js

### Submit
POST `/api/promo-codes` → reçoit code → calcule le texte ("−10% sur votre séjour · valable jusqu'au DD/MM/YYYY") → `onGenerated(code, text)` → ferme.

---

## Fichiers touchés

| Fichier | Action | Rôle |
|---|---|---|
| `migrations/0002_promo_codes.sql` | Créer | Table promo_codes |
| `functions/api/_sanitizeHtml.js` | Créer | Sanitization HTML basique |
| `functions/api/send-custom-email.js` | Créer | Endpoint envoi manuel |
| `functions/api/promo-codes.js` | Créer | CRUD codes promo |
| `public/email-templates/manual-decouverte.html` | Créer | Template 1 |
| `public/email-templates/manual-relance.html` | Créer | Template 2 |
| `public/email-templates/manual-question.html` | Créer | Template 3 |
| `public/email-templates/_promo-block.html` | Créer | Snippet promo |
| `src/tabs/messagerie/EmailComposer.jsx` | Créer | Modal compositeur |
| `src/tabs/messagerie/PromoCodeModal.jsx` | Créer | Modal mini promo |
| `src/tabs/MessagerieTab.jsx` | Modifier | Bouton "✉ Nouveau mail" + state composer |
| `src/tabs/messagerie/EmailDrawer.jsx` | Modifier | Bouton "✉ Nouveau mail à ce client" |

---

## Tests

- **Unitaires `_sanitizeHtml`** : 4 cas (script stripped, onXXX stripped, javascript: stripped, HTML normal intact)
- **Unitaires `promo-codes` génération** : format code valide, collision → re-roll, INSERT D1 correct
- **Endpoint /api/send-custom-email** : auth Bearer rejette sans token, validation email/sujet, sanitize appliqué, log emails_log avec bonne catégorie
- **Endpoint /api/promo-codes** : POST génère + insert, GET filtre actifs uniquement
- **Runtime UI** : preview MCP — ouvrir modal, sélectionner template, taper sujet/corps, vérifier aperçu live, fermer modal

---

## Sécurité & garde-fous

- **Auth Bearer admin obligatoire** sur `send-custom-email` et `promo-codes` (POST/GET)
- **Rate limit 20/h/IP** sur `send-custom-email` (via `_ratelimit.js`)
- **Sanitization HTML serveur** avant Resend (whitelist + strip script/onXXX/javascript:)
- **Aperçu iframe sandboxed** côté UI (pas de `dangerouslySetInnerHTML`)
- **Validation email + longueurs**
- **Code promo unique** (re-roll max 3 essais)
- **Stockage HTML complet dans emails_log** → traçabilité litige
- **RGPD** : pas de nouvelle donnée perso collectée (emails déjà connus via direct_bookings/abandoned_carts)

---

## Ordre d'exécution (8 tâches)

```
T1. Migration D1 promo_codes
T2. Helper _sanitizeHtml.js + tests vitest
T3. Endpoint /api/promo-codes (POST + GET) + tests
T4. Endpoint /api/send-custom-email (avec rate limit) + tests
T5. Templates HTML (3 templates + snippet promo) + variables
T6. UI EmailComposer.jsx + PromoCodeModal.jsx
T7. Intégration dans MessagerieTab + EmailDrawer (boutons)
T8. Tests runtime preview MCP + deploy + vérif live
```

---

## Non-scope (futur — features B, C, D)

- **B — Auto relances paniers** : réutilisera send-custom-email + promo-codes
- **C — Envoi en masse** : sélection multi-destinataires + même endpoint
- **D — Tracking conversion** : le système checkout appliquera la réduction quand un code promo est utilisé + incrémente `used_count` + log conversion
- Application réelle du code au checkout : prévu pour feature D
- Webhook Resend opens/clicks : déjà prévu (colonnes en place)
- Pièces jointes : non
- Programmation différée (envoi dans 2h) : non
