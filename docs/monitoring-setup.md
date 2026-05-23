# Monitoring — Sentry + UptimeRobot

## 1. Sentry (suivi d'erreurs front-end)

### Créer le projet

1. Aller sur [sentry.io](https://sentry.io) → créer un compte gratuit (plan Free : 5 000 erreurs/mois)
2. Créer un nouveau projet : **React** (JavaScript)
3. Nom du projet : `locatif-dashboard`
4. Copier le **DSN** affiché lors de la création

### Configurer la variable dans Cloudflare Pages

1. CF Pages dashboard → projet `villamaryllis` → **Settings → Environment variables**
2. Ajouter (Production + Preview) :
   - Variable : `VITE_SENTRY_DSN`
   - Valeur : le DSN copié ci-dessus (format `https://xxx@oyyy.ingest.sentry.io/zzz`)
3. Redéployer le projet (un push suffit)

### Configurer en local (optionnel)

```bash
cp .env.example .env.local
# Remplir VITE_SENTRY_DSN dans .env.local
```

> Sentry est désactivé automatiquement si `VITE_SENTRY_DSN` est vide — pas d'erreur en local sans DSN.

---

## 2. UptimeRobot (monitoring de disponibilité)

Plan gratuit : jusqu'à 50 monitors, intervalle minimum 5 minutes.

### Créer un compte

[uptimerobot.com](https://uptimerobot.com) → Sign up gratuit

### Configurer les 3 monitors

#### Monitor 1 — API disponibilité Nogent

| Champ | Valeur |
|---|---|
| Type | HTTP(s) |
| URL | `https://villamaryllis.com/api/get-availability?bienId=nogent` |
| Friendly Name | `API availability Nogent` |
| Monitoring Interval | 5 minutes |
| Alert conditions | Status code ≠ 200 |

#### Monitor 2 — Site public

| Champ | Valeur |
|---|---|
| Type | HTTP(s) |
| URL | `https://villamaryllis.com/` |
| Friendly Name | `Site public` |
| Monitoring Interval | 5 minutes |
| Alert conditions | Site down |

#### Monitor 3 — Dashboard admin

| Champ | Valeur |
|---|---|
| Type | HTTP(s) |
| URL | `https://villamaryllis.com/admin` |
| Friendly Name | `Admin dashboard` |
| Monitoring Interval | 5 minutes |
| Alert conditions | Site down |

### Configurer les alertes

Dans UptimeRobot → **Alert Contacts** :
- Ajouter un contact **Email** (notification immédiate)
- Optionnel : ajouter un contact **SMS** (intégration Twilio, payant au-delà du free tier)

Assigner les 3 alert contacts à chaque monitor.

---

## 3. Logs structurés Cloudflare Pages Functions

Les fonctions `beds24-create.js` et `create-payment-intent.js` émettent des logs JSON sur stdout.

Format :
```json
{ "level": "info|error", "fn": "nom-fonction", "msg": "...", "bookingId": "...", "ts": "ISO8601" }
```

Consulter dans CF Dashboard → Pages → projet → **Functions** → **Real-time Logs**.
