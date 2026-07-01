# Setup connecteurs Google — Gmail + Calendar (chantier connecteurs 2026-07)

Ce doc couvre les deux premiers chantiers du plan connecteurs 2026-07 :
1. **Gmail** → faire remonter dans `/admin` → 📧 Messagerie les réponses des voyageurs
   envoyées à `contact@villamaryllis.com` (jusqu'ici invisibles — seuls les envois
   sortants via Resend apparaissaient). Boîte utilisable normalement dans l'app Mail
   du Mac de Vincent en parallèle (scope `gmail.readonly`, aucune écriture).
2. **Calendar** → pousser un événement par ménage (sortie/entrée, fenêtre, prestataire
   assigné avec invitation) dans `/admin` → 🧹 Ménage, sur le Google Calendar du même
   compte (scope `calendar.events`).

Les deux connexions sont **indépendantes** (voir `_googleOAuth.js`, multi-provider) :
se connecter à Gmail ne connecte pas Calendar, et vice-versa. Chacune a son propre
bouton ("Connecter Gmail" / "Connecter Calendar") et son propre refresh_token en D1.
Elles partagent le **même** Client ID/Secret Google Cloud (un seul projet).

## Ce qui a déjà été codé (rien à faire ici)

- `functions/api/_googleOAuth.js` — helper OAuth2 multi-provider (échange code, refresh, stockage D1)
- `functions/api/gmail-oauth-start.js` / `gmail-oauth-callback.js` — flow de connexion partagé (`?provider=gmail|calendar`)
- `functions/api/gmail-sync.js` — poll Gmail toutes les 10 min (cron Worker) + bouton "Sync" manuel
- `functions/api/calendar-sync.js` — POST manuel depuis MenageTab (crée/MAJ un event par ménage)
- `migrations/0004_emails_log_inbound.sql` — colonnes `direction`/`gmail_msg_id`/... + table `oauth_tokens`
- `migrations/0005_menage_calendar_events.sql` — mapping ménage → event Calendar (dédup)
- `MessagerieTab.jsx` / `EmailDrawer.jsx` — bouton "Connecter Gmail", bulles entrant/sortant
- `MenageTab.jsx` — bouton "Connecter Calendar" + "Sync calendrier", résolution email prestataire (annuaire local)

## Gmail — déjà en place

Si tu as suivi les étapes précédentes : migration `0004` appliquée, identifiants OAuth
créés, secrets `GOOGLE_OAUTH_CLIENT_ID`/`GOOGLE_OAUTH_CLIENT_SECRET` dans Cloudflare,
compte connecté via "📩 Connecter Gmail" dans Messagerie. **Rien à refaire.**

## Calendar — ce qu'il reste à faire (une seule fois)

Comme le Client ID/Secret Google Cloud est déjà créé pour Gmail, l'essentiel est déjà
en place. Il ne manque que deux choses :

### 1. Appliquer la migration D1

```bash
npx wrangler d1 execute revenue-manager --remote --file=migrations/0005_menage_calendar_events.sql
```

### 2. Activer l'API Calendar dans le même projet Google Cloud

1. [console.cloud.google.com](https://console.cloud.google.com) → même projet que pour Gmail
   (ex : `amaryllis-dashboard`), connecté avec `contact@villamaryllis.com`.
2. **APIs & Services → Library** → chercher "Google Calendar API" → **Enable**.
3. Rien d'autre à créer — le même OAuth client (`GOOGLE_OAUTH_CLIENT_ID`/`SECRET`, même
   URI de redirection `/api/gmail-oauth-callback`) sert aussi à Calendar. Pas de nouveau
   secret Cloudflare à ajouter.

### 3. Connecter le compte

Dans `/admin` → 🧹 Ménage → cliquer **"📅 Connecter Calendar"** → se connecter avec
`contact@villamaryllis.com` → accepter le consentement (demande maintenant l'accès à
l'agenda en plus de l'email). Redirection vers l'admin avec "Calendar connecté ✓".

Puis clique **"📅 Sync calendrier"** pour pousser tous les ménages des 21 prochains
jours. Si un prestataire a un email renseigné dans l'onglet Prestataires (et que son nom
tapé dans le champ "assigné" correspond), il reçoit une invitation Calendar automatique.
Sinon l'événement est créé sans invité — juste visible sur le calendrier du compte.

⚠️ Pas de cron automatique pour l'instant (contrairement à Gmail) : c'est un bouton
manuel. À automatiser plus tard si l'usage le justifie.

## Dépannage

- **"Gmail non connecté" / "Calendar non connecté"** persistant après consentement →
  vérifier que `GOOGLE_OAUTH_CLIENT_ID`/`SECRET` sont bien dans Cloudflare (pas
  seulement `.dev.vars` local) et que l'URI de redirection Google Cloud correspond
  exactement à `https://villamaryllis.com/api/gmail-oauth-callback` (schéma + trailing
  slash comptent) — ce callback unique sert aux deux providers.
- **Erreur "Calendar API has not been used"** → l'étape "Activer l'API Calendar" (voir
  ci-dessus) n'a pas été faite sur le bon projet Google Cloud.
- **`pas_de_refresh_token`** → le compte avait déjà consenti sans qu'on l'ait redemandé.
  `buildAuthUrl` force `prompt=consent` donc ne devrait pas arriver ; si ça persiste,
  révoquer l'accès dans [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
  puis recommencer.
- **Refresh token expiré après 7 jours** → signe que l'app OAuth est restée en mode
  "Externe / Testing" au lieu de "Interne" (étape 4). Repasser en Interne dans le
  consent screen (nécessite un compte Workspace) ou soumettre l'app à vérification Google.
