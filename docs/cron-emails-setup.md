# Activer les emails voyageurs automatiques — procédure pas-à-pas

> Objectif : déclencher chaque jour les emails **pré-arrivée (J-3)** et **post-séjour (J+1)** pour les **réservations directes**.
> Les fonctions sont déjà déployées ; il reste à les appeler quotidiennement via un planificateur (cron-job.org).

---

## 0) Pré-requis à vérifier (2 min)

### a) Le secret `POSTSTAY_SECRET` ✅ déjà configuré
Vérifié le 30/05 : présent dans Cloudflare Pages (Settings → Environment variables → secrets).
👉 **Tu auras besoin de sa VALEUR** pour les URLs cron. Comme la valeur est chiffrée et non lisible :
- Si tu la connais → parfait, utilise-la.
- Si tu l'as oubliée → **réinitialise-la** : Cloudflare Pages → `dashboard-amaryllis` → Settings → Variables and Secrets → `POSTSTAY_SECRET` → modifier, mets une valeur que tu choisis (ex. une longue chaîne aléatoire). ⚠️ Si un cron `send-poststay` existait déjà avec l'ancienne valeur, mets-la à jour aussi.

### b) ⚠️ Vérifier `RESEND_API_KEY` (clé d'envoi email)
Elle n'apparaît PAS dans la liste des *secrets* → soit c'est une **variable simple**, soit elle manque.
👉 Cloudflare Pages → `dashboard-amaryllis` → Settings → **Variables and Secrets** → cherche `RESEND_API_KEY`.
- Présente (variable ou secret) → OK.
- Absente → ajoute-la (clé depuis ton compte Resend → API Keys). **Sans elle, aucun email ne part.**

### c) Domaine d'envoi Resend
Vérifie dans Resend que **`mail.villamaryllis.com`** (ou le domaine de `RESEND_FROM`) est **vérifié** (DNS SPF/DKIM verts). Sinon les envois sont rejetés.

---

## 1) Créer un compte cron-job.org (gratuit)
1. Va sur **cron-job.org** → *Sign up* (gratuit).
2. Confirme ton email, connecte-toi.
3. Tableau de bord → bouton **« Create cronjob »**.

---

## 2) Cron #1 — Pré-arrivée (J-3)
Dans « Create cronjob » :
- **Title** : `Amaryllis — Pré-arrivée J-3`
- **URL** :
  ```
  https://villamaryllis.com/api/send-prearrivee?secret=TA_VALEUR_POSTSTAY_SECRET
  ```
  *(remplace `TA_VALEUR_POSTSTAY_SECRET` par la vraie valeur)*
- **Schedule** : *Every day*, à **09:00** — ⚠️ règle le fuseau sur **UTC** (ou ajuste : 9h UTC = 5h Martinique / 11h Paris été).
- **Request method** : **GET**
- (Optionnel) Notifications → t'alerter si le job échoue.
- **Create**.

---

## 3) Cron #2 — Post-séjour (J+1)
Refais « Create cronjob » :
- **Title** : `Amaryllis — Post-séjour J+1`
- **URL** :
  ```
  https://villamaryllis.com/api/send-poststay?secret=TA_VALEUR_POSTSTAY_SECRET
  ```
- **Schedule** : *Every day*, à **10:00 UTC**.
- **Request method** : **GET**
- **Create**.

> Si un cron `send-poststay` existait déjà (il gérait Nogent/Beds24), garde-le : il envoie maintenant **aussi** le post-séjour des résas directes avec le nouveau template. Pas besoin d'en créer un second.

---

## 4) Tester tout de suite (sans attendre une vraie résa)
1. Dans cron-job.org, ouvre le cron → bouton **« Run now »** (ou « Execute »).
2. Regarde l'onglet **History** : le job doit renvoyer **HTTP 200** avec un JSON du type :
   ```json
   { "ok": true, "target": "2026-06-02", "candidats": 0, "sent": 0, "failed": 0 }
   ```
   - `candidats: 0` = normal s'il n'y a aucune résa directe arrivant dans 3 j (ou partie hier).
   - Si tu vois **401** → la valeur du `secret` dans l'URL ne correspond pas à `POSTSTAY_SECRET`.
   - Si **500 / 502** → souci D1 ou Resend (vérifie RESEND_API_KEY).
3. Vrai test bout-en-bout : fais une **réservation directe test** (mode test Stripe) avec une arrivée dans 3 jours → relance le cron pré-arrivée → tu dois recevoir l'email.

---

## 5) Bon à savoir
- **Seules les résas DIRECTES** (payées via Stripe sur le site) reçoivent ces emails — elles sont stockées en D1 `direct_bookings` par le webhook Stripe. Airbnb/Booking gèrent leurs propres comms.
- **Anti-doublon** : chaque email n'est envoyé qu'une fois (`prearrivee_sent` / `poststay_sent`).
- **Code d'accès** : volontairement PAS envoyé en automatique (l'email dit « communiqué 24h avant »). Tu envoies le code toi-même la veille.
- **Envoi manuel ponctuel** possible via `POST /api/send-guest-email` (header `X-Send-Secret`) avec `{template, to, subject, vars}` — templates : `pre-arrivee`, `post-sejour`, `relance-panier`, `newsletter-hiver`.
