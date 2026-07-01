# Setup Gmail — Messagerie voyageurs (chantier connecteurs 2026-07)

Objectif : faire remonter dans `/admin` → 📧 Messagerie les réponses des voyageurs
envoyées à `contact@villamaryllis.com` (jusqu'ici invisibles — seuls les envois
sortants via Resend apparaissaient). Cette boîte reste utilisable normalement dans
l'app Mail du Mac de Vincent en parallèle (scope `gmail.readonly`, aucune écriture).

## Ce qui a déjà été codé (rien à faire ici)

- `functions/api/_googleOAuth.js` — helper OAuth2 (échange code, refresh, stockage D1)
- `functions/api/gmail-oauth-start.js` / `gmail-oauth-callback.js` — flow de connexion
- `functions/api/gmail-sync.js` — poll toutes les 10 min (cron Worker) + bouton "Sync" manuel
- `migrations/0004_emails_log_inbound.sql` — colonnes `direction`/`gmail_msg_id`/... + table `oauth_tokens`
- `MessagerieTab.jsx` / `EmailDrawer.jsx` — bouton "Connecter Gmail", bulles entrant/sortant

## Ce que Vincent doit faire (une seule fois)

### 1. Appliquer la migration D1

Depuis le Mac (le sandbox de cette session ne peut pas exécuter wrangler) :

```bash
npx wrangler d1 execute revenue-manager --remote --file=migrations/0004_emails_log_inbound.sql
```

### 2. Créer les identifiants OAuth dans Google Cloud Console

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com), **connecté avec le
   compte `contact@villamaryllis.com`** (ou un admin du Workspace `villamaryllis.com`).
2. Créer un projet dédié si besoin (ex : `amaryllis-dashboard`).
3. **APIs & Services → Library** → chercher "Gmail API" → **Enable**.
4. **APIs & Services → OAuth consent screen** :
   - Type **Interne** si proposé (disponible car compte Workspace — évite l'expiration
     du refresh_token à 7 jours des apps "externes non vérifiées").
   - Sinon type Externe + ajouter `contact@villamaryllis.com` comme "Test user".
   - Nom de l'app : "Amaryllis Dashboard" (visible uniquement par toi lors du consentement).
5. **APIs & Services → Credentials → Create Credentials → OAuth client ID** :
   - Type d'application : **Application Web**.
   - URI de redirection autorisée : `https://villamaryllis.com/api/gmail-oauth-callback`
   - Cliquer Créer → copier le **Client ID** et le **Client Secret**.

### 3. Ajouter les secrets dans Cloudflare Pages

Dashboard → Pages → `dashboard-amaryllis` → Settings → Environment variables → Production :

| Variable | Valeur |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | le Client ID copié à l'étape 2 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | le Client Secret copié à l'étape 2 |

Redéployer (`npm run deploy:pages`) pour que les secrets soient pris en compte.

### 4. Connecter le compte

Dans `/admin` → 📧 Messagerie → cliquer **"📩 Connecter Gmail"** → se connecter avec
`contact@villamaryllis.com` → accepter le consentement. Redirection automatique vers
l'admin avec la confirmation "Gmail connecté ✓".

À partir de là, le cron Worker (boucle 10 min) importe automatiquement les nouvelles
réponses voyageurs. Le bouton **"🔄 Sync"** permet de forcer une vérification immédiate.

## Dépannage

- **"Gmail non connecté"** persistant après consentement → vérifier que
  `GOOGLE_OAUTH_CLIENT_ID`/`SECRET` sont bien dans Cloudflare (pas seulement `.dev.vars`
  local) et que l'URI de redirection Google Cloud correspond exactement à
  `https://villamaryllis.com/api/gmail-oauth-callback` (schéma + trailing slash comptent).
- **`pas_de_refresh_token`** → le compte avait déjà consenti sans qu'on l'ait redemandé.
  `buildAuthUrl` force `prompt=consent` donc ne devrait pas arriver ; si ça persiste,
  révoquer l'accès dans [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
  puis recommencer.
- **Refresh token expiré après 7 jours** → signe que l'app OAuth est restée en mode
  "Externe / Testing" au lieu de "Interne" (étape 4). Repasser en Interne dans le
  consent screen (nécessite un compte Workspace) ou soumettre l'app à vérification Google.
