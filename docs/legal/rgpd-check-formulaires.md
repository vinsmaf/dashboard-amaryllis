# Audit RGPD — Formulaires & collectes de données du site

> ⚠️ **AVERTISSEMENT — AIDE À LA CONFORMITÉ, PAS UN AVIS D'AVOCAT/DPO.**
> Audit réalisé le 2026-06-02 sur le code réel des fonctions de collecte. À faire valider par un avocat/DPO avant arbitrage définitif. **Complète** (sans le dupliquer) le registre des traitements `docs/registre-traitements-rgpd.md` : ce document se concentre sur le **côté formulaires/collecte** (ce que le code collecte réellement, ce qui est affiché à l'utilisateur, ce qui manque).

---

## 0. Périmètre audité (code réel)

| Collecte | Fichier(s) | Stockage | Traitement registre |
|---|---|---|---|
| Formulaire de contact | `functions/api/contact.js` (+ UI `src/PublicSite.jsx`, `src/GuideReservationDirecte.jsx`, `src/GuideSeminaires.jsx`) | D1 `contacts` + email Resend | **T1** |
| Tunnel de réservation directe + paiement | `functions/api/notify-booking.js`, `create-payment-intent.js`, `create-deposit-intent.js`, `stripe-webhook.js` | D1 `direct_bookings` + Stripe + Beds24 + Sheets | **T2** |
| Newsletter | `src/Guide.jsx` (guide-hub) → Resend | Resend | **T3** |
| Emails voyageurs (pré-arrivée / post-séjour / relance panier) | `send-prearrivee.js`, `send-poststay.js`, `send-relance-panier.js`, `send-guest-email.js` | D1 `direct_bookings` / `abandoned_carts` | **T2 (dérivé)** |
| Chat IA public | `functions/api/chat.js` | logs → Groq/Anthropic | **T6** |

---

## 1. Formulaire de contact — `functions/api/contact.js`

### Données réellement collectées (vérifié dans le code)
- `nom`, `email`, `message` (obligatoires — ligne 65), `bien` (optionnel), `source`.
- Métadonnée serveur : **IP** lue (`CF-Connecting-IP`, ligne 52) — utilisée pour le rate limiting, **pas stockée** dans la table `contacts` (DDL lignes 17-29 : `nom, email, message, source, bien, status, notes, created_at`). ✅ Bon point : l'IP ne persiste pas.
- Email envoyé à l'hôte via Resend avec `reply_to: email` du prospect.

### Analyse RGPD
| Critère | État | Commentaire |
|---|---|---|
| Base légale | ✅ OK | Mesures précontractuelles (art. 6.1.b) — cohérent avec T1. |
| Mention d'information avant collecte | ✅ Présente | Lien politique de confidentialité ajouté (cf. `compliance-rgpd-lemeur.md` jur-012). |
| Checkbox de consentement | ➖ Non requise | Pour un simple contact, pas de case obligatoire. **MAIS** voir finding F1. |
| Minimisation | ✅ Bonne | IP non persistée, pas de champ superflu. |
| Durée de conservation | ⚠️ **Non appliquée en base** | Registre prévoit 3 ans après dernier contact, mais **aucune purge automatique** n'existe sur la table `contacts` (pas de `created_at` exploité pour suppression). → **F2**. |
| Sécurité | ✅ OK | Rate limit 3/IP/h, échappement HTML (`esc`, ligne 69), CORS restreint aux domaines villamaryllis. |

### Findings
- **F1 — Champ « bien » + message libre = données mêlées au marketing.** Si le message du prospect alimente plus tard une prospection (newsletter, relance), la base légale bascule de « précontractuel » vers « consentement ». Vérifier qu'un lead contact **n'est pas automatiquement** ajouté à la newsletter sans opt-in distinct. **Correctif** : ne jamais importer un email du formulaire contact vers la liste newsletter sans consentement séparé.
- **F2 — Pas de purge des leads (rétention non technique).** **Correctif** : ajouter un cron de purge/anonymisation des lignes `contacts` dont `created_at < now − 3 ans` ET `status != 'répondu'/converti`. Implémentable dans le Worker (`workers/ical-sync/index.js`) ou un endpoint `/api/contacts-purge?secret=`.

---

## 2. Tunnel de réservation directe — `functions/api/notify-booking.js` (+ Stripe)

### Données réellement collectées (vérifié dans le code)
- `paymentIntentId`, `bienNom`, `voyageur` (nom), `total`, `checkin`, `checkout`, `depot` (lignes 87-88).
- Stockées en clair dans D1 `direct_bookings` (DDL lignes 18-27) : `voyageur`, montants, dates, `payment_intent_id`.
- **Aucune donnée de carte** côté Amaryllis : tout passe par Stripe (PCI-DSS). ✅ Conforme à T2.
- Vérification anti-spam : appel Stripe pour confirmer `status = succeeded` (lignes 94-100). ✅

### Analyse RGPD
| Critère | État | Commentaire |
|---|---|---|
| Base légale | ✅ OK | Exécution du contrat (6.1.b) + obligation comptable (6.1.c). |
| Pas de stockage carte | ✅ Excellent | Tokenisation Stripe, rien en local. |
| **CORS** | 🔴 **Finding F3** | `notify-booking.js` ligne 12 : `"Access-Control-Allow-Origin": "*"` — **wildcard**, contrairement à `contact.js` qui restreint aux domaines villamaryllis. |
| Information du voyageur | ⚠️ **F4** | La collecte se fait au paiement ; vérifier que la **clause RGPD du tunnel** (mention ajoutée en jur-012 sur `PublicSite.jsx`) est bien affichée **avant** la saisie, pas seulement après paiement. |
| Durée de conservation | ⚠️ | `direct_bookings` n'a pas de purge ; **mais** ces données sont liées à la facturation → conservation **10 ans** légitime (art. L.123-22). Distinguer toutefois ce qui est purement commercial (3 ans). |
| Idempotence / intégrité | ✅ OK | `payment_intent_id` en PK, anti-double-notif (lignes 110-111). |

### Findings
- **F3 — CORS wildcard sur `notify-booking.js` (`Allow-Origin: "*"`).** Endpoint qui écrit en base et déclenche emails/push. Même si l'écriture exige un `paymentIntentId` Stripe valide (ce qui limite l'abus), le wildcard est une **incohérence de posture** avec `contact.js`. **Correctif** : restreindre l'origine à la whitelist villamaryllis (réutiliser le pattern `ALLOWED_ORIGINS` de `contact.js`). Risque : faible (protégé par la vérif Stripe) mais à aligner. *(À traiter aussi côté sécurité réseau — voir note plus bas.)*
- **F4 — Moment d'affichage de l'info RGPD dans le tunnel.** **Correctif** : confirmer que la mention « En réservant, vous acceptez notre politique de confidentialité… » est visible **à l'étape de saisie des coordonnées**, avant le paiement Stripe.
- **F5 — Champ `voyageur` libre + dates en clair.** Acceptable (nécessaire au contrat). Pas d'action, juste documenté.

---

## 3. Emails voyageurs (pré-arrivée / post-séjour / relance panier)

### Données traitées
- Réutilisent `direct_bookings` (résas directes) et `abandoned_carts` (paniers abandonnés), + Beds24 pour Nogent.
- `send-relance-panier.js` : relance d'un **panier abandonné** = email saisi sans réservation finalisée.

### Findings
- **F6 — Relance panier abandonné = base légale fragile.** Relancer par email une personne qui a saisi son email **sans finaliser** relève de la **prospection**. Pour un prospect (non-client), la relance d'un panier abandonné nécessite en principe un **consentement** ou, a minima, repose sur l'**intérêt légitime** avec information claire et opt-out. **Correctifs** :
  1. Afficher, au moment où l'email est saisi dans le tunnel, une mention : *« Nous pourrons vous envoyer un rappel de votre réservation en cours. »*
  2. Inclure un **lien de désinscription / opposition** dans l'email de relance.
  3. Durée de vie courte du panier (`abandoned_carts`) + purge après conversion ou délai (déjà : « exclut convertis » d'après CLAUDE.md — à vérifier que la purge temporelle existe).
- **F7 — Post-séjour / demande d'avis (`send-poststay.js`).** Intérêt légitime acceptable (client existant, produit analogue, soft opt-in) — OK, à condition d'un lien de désinscription présent dans le template `public/email-templates/post-sejour.html`. **Correctif** : vérifier la présence du lien de désinscription dans ce template.

---

## 4. Newsletter — `src/Guide.jsx` → Resend (T3)

### Findings
- **F8 — Consentement explicite requis.** Cohérent avec T3 (base légale = consentement). **Correctif** : la collecte newsletter doit avoir une **case à cocher non pré-cochée** distincte du simple bouton « télécharger le guide » (un guide PDF en échange de l'email = il faut découpler le consentement marketing du téléchargement, sinon consentement non libre). Vérifier que l'inscription newsletter n'est pas la **condition** d'accès au guide.
- **F9 — Double opt-in & preuve.** Recommandé : double opt-in + conservation de la preuve du consentement (horodatage). Lien de désinscription obligatoire dans chaque envoi (déjà prévu côté Resend).

---

## 5. Chat IA public — `functions/api/chat.js` (T6)

### Findings
- **F10 — Saisie libre = risque de données personnelles/sensibles non maîtrisées.** L'utilisateur peut taper nom/email/téléphone dans le chat. **Correctifs** (cohérents avec T6 du registre) :
  1. Afficher un avertissement visible : *« Vous échangez avec un assistant IA — ne saisissez pas de données sensibles. »*
  2. Purge périodique des logs de conversation (fixer 6–12 mois).
  3. Sous-traitants Groq/Anthropic : **DPA + clause de non-réutilisation pour l'entraînement** (voir liste DPA du registre — `Groq` et `Anthropic` marqués « à signer ❌ »).

---

## 6. Synthèse — findings priorisés

| # | Finding | Gravité | Fichier(s) | Correctif |
|---|---|---|---|---|
| F3 | CORS wildcard `*` sur notify-booking | 🟠 Moyen | `notify-booking.js` | Restreindre aux origines villamaryllis (pattern de `contact.js`) |
| F2 | Pas de purge des leads contact (3 ans) | 🟠 Moyen | `contact.js` / D1 `contacts` | Cron purge/anonymisation `created_at < −3 ans` |
| F6 | Relance panier = base légale fragile | 🟠 Moyen | `send-relance-panier.js` | Mention à la saisie + lien opt-out + purge panier |
| F8 | Newsletter : consentement non découplé du guide | 🟠 Moyen | `src/Guide.jsx` | Case non pré-cochée, accès guide non conditionné |
| F10 | Chat IA : pas d'avertissement + logs non purgés | 🟡 Faible | `chat.js` | Avertissement IA + purge logs + DPA Groq/Anthropic |
| F1 | Lead contact → newsletter sans opt-in | 🟡 Faible | flux interne | Ne jamais importer sans consentement distinct |
| F4 | Info RGPD affichée trop tard dans le tunnel | 🟡 Faible | `PublicSite.jsx` | Vérifier affichage **avant** paiement |
| F7 | Lien désinscription post-séjour | 🟡 Faible | `email-templates/post-sejour.html` | Vérifier présence du lien |

### Bons points confirmés (à conserver)
- ✅ Aucune donnée de carte stockée (Stripe tokenise — `notify-booking.js`).
- ✅ IP non persistée dans `contacts` (minimisation).
- ✅ Échappement HTML + rate limiting + CORS restreint sur `contact.js`.
- ✅ Mentions / liens politique de confidentialité ajoutés sur les 4 formulaires (jur-012 corrigé).
- ✅ Bandeau cookies + Consent Mode v2 (consentement 13 mois CNIL).

### Cohérence avec le registre
Les traitements T1–T6 de `docs/registre-traitements-rgpd.md` couvrent ces collectes. **Ce document n'ajoute aucun nouveau traitement** : il documente les **écarts d'implémentation** (rétention non technique, CORS, consentement newsletter, avertissement chat) à corriger pour rendre le registre effectif dans le code.

> ⚠️ La gravité indiquée est indicative. Aucune non-conformité grave détectée ; ce sont des **renforcements** à planifier. Validation avocat/DPO recommandée avant arbitrage final.
