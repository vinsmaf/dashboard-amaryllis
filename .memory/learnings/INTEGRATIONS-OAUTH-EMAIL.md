# Intégrations OAuth & Email — Learnings locatif-dashboard

> OAuth Google/Meta, email (Resend/Gmail/Outlook)
> Extrait de `../LEARNINGS.md` le 2026-07-04 (consolidation mémoire — split thématique).
> 7 entrées, triées par date décroissante.

## 🎯 Google Business Profile API : l'approbation d'accès est liée au PROJET Cloud, pas à la fiche GBP choisie dans le formulaire — 2026-07-08
- **Contexte** : demande d'accès API soumise pour la fiche "Villa Amaryllis" (une des 2 fiches Amaryllis + 1 fiche patrimoine gérées par le même compte Google). Vincent a demandé de refaire la même démarche pour l'autre fiche (Résidence Amaryllis) "pour tout couvrir".
- **Vérité (doc officielle Google + guide tiers qui la corrobore)** : la fiche GBP demandée dans le formulaire ne sert QUE de preuve d'éligibilité ("gérer une fiche vérifiée et active depuis 60j+") — l'approbation elle-même est accordée au **numéro de projet Google Cloud**. Une fois approuvé, l'API donne accès à TOUTES les fiches gérées par ce compte Google, pas seulement celle citée dans la demande.
- **La prochaine fois** : ne jamais soumettre une 2ᵉ demande d'accès API avec le même projet Cloud pour "couvrir" une fiche supplémentaire du même compte — ça n'apporte rien et risque de créer de la confusion dans l'examen Google (2 tickets pour le même projet). Vérifier après approbation que les autres fiches apparaissent bien dans l'inventaire de l'API avant de conclure définitivement que c'est le cas pour un compte donné.

## 🔴 OAuth Google multi-scope : chaque NOUVEAU scope doit être déclaré dans "Accès aux données" — sinon "insufficient authentication scopes" silencieux — 2026-07-01
- **Piège** : sur un projet Google Cloud qui a déjà un provider OAuth fonctionnel (ex: Gmail avec `gmail.readonly`), ajouter un DEUXIÈME provider avec un nouveau scope (ex: Calendar avec `calendar.events`) dans le code (`buildAuthUrl(env, state, scope)`) NE SUFFIT PAS — même avec l'API activée (Library) et l'utilisateur whitelisté (Audience/Test users). Il faut EN PLUS déclarer explicitement le nouveau scope dans **Google Auth Platform → Accès aux données → "Ajouter ou supprimer des niveaux d'accès"**. Sans ça, Google délivre quand même un token (le consentement a l'air normal, `accountEmail` est même correctement résolu) mais SANS le scope demandé — l'erreur n'apparaît qu'au premier appel API réel : `"Request had insufficient authentication scopes"`.
- **Symptôme trompeur** : la connexion semble réussie (statut `connected:true`, bon `accountEmail`), donc le réflexe naturel est de soupçonner un bug côté code (mauvais scope dans l'URL, mauvais provider stocké) — alors que le vrai problème est une case à cocher manquante côté Google Cloud Console.
- **Fix si déjà dans ce cas** : (1) ajouter le scope manquant dans Accès aux données → Save, (2) **supprimer la ligne D1 `oauth_tokens` du provider concerné** (`DELETE FROM oauth_tokens WHERE provider='X'`) pour forcer le bouton "Connecter" à réapparaître côté UI (sinon il reste sur "Sync" et ne redemande jamais le consentement), (3) re-cliquer "Connecter" pour obtenir un token frais avec le bon scope.
- **La prochaine fois** : avant même de tester un nouveau provider OAuth (Calendar, Drive, Sheets, ...), aller déclarer TOUS ses scopes dans Accès aux données AVANT le premier clic "Connecter" — pas après.

## 🔴 OAuth Google : activer l'écran de consentement ≠ activer l'API — 403 garanti si oublié — 2026-07-01
- **Piège** : créer l'écran de consentement OAuth + l'ID client dans Google Cloud Console ne suffit PAS. Il faut en plus activer explicitement l'API concernée dans **APIs & Services → Library** (ex: "Gmail API" → bouton "Activer"). Sans ça, tout appel API renvoie un **403** même avec un access_token valide et un consentement accepté — le premier réflexe (soupçonner le scope ou le refresh_token) est un faux chemin.
- **La prochaine fois** : après tout setup OAuth Google, avant de déboguer un 403, vérifier en premier `console.cloud.google.com/apis/library/<api>.googleapis.com` → statut "Activé" ou bouton "Activer" encore visible.

## 🎯 OAuth Google en mode Externe/Test : whitelister l'utilisateur AVANT de tenter le consentement — 2026-07-01
- **Piège** : un compte Google personnel (pas Workspace) ne peut pas passer l'écran de consentement en mode "Interne" — seul "Externe" est disponible. En mode Externe + statut "Test" (avant validation Google), **seuls les comptes explicitement ajoutés dans Audience → Utilisateurs tests** peuvent compléter le flow OAuth ; sinon Google bloque l'accès silencieusement côté utilisateur.
- **La prochaine fois** : avant de cliquer "Connecter" côté app, aller dans `console.cloud.google.com/auth/audience` et vérifier/ajouter le compte cible (ex: la boîte mail à connecter, si différente du compte propriétaire du projet Cloud) dans la liste des utilisateurs tests.
- **Point de vigilance à surveiller** : en mode Test (non "Production"), le refresh_token expire au bout de 7 jours — si Vincent voit "Gmail non connecté" réapparaître après une semaine, c'est probablement ça (voir `docs/GMAIL-SETUP.md` §Dépannage).

## 📧 Envoi email de masse = API batch Resend, jamais une boucle de fetch — 2026-06-23
- **Piège vécu** : `crm-lifecycle` envoyait en boucle `POST /emails` → **6/26 en 429 rate_limit_exceeded** (Resend ~2 req/s). Les destinataires en fin de liste sautent silencieusement.
- **La prochaine fois** : utiliser `POST https://api.resend.com/emails/batch` (tableau de 100 max, personnalisation par message conservée) = 1 appel, zéro rate-limit, pas de timeout Worker. Marquer l'anti-doublon par chunk réussi.
- Corollaire : un envoi partiel ne doit JAMAIS marquer les non-envoyés → re-run ne cible que les ratés (clé `client_id+campaign`).

## 📧 Pont email OTA → Sheet : pièges à connaître — 2026-06-14
- **Cloudflare Email Routing pose un MX au niveau de la zone** → il **écrase** un MX existant. `villamaryllis.com` a `MX smtp.google.com` (Google Workspace) → activer Email Routing aurait cassé la réception email. **Toujours `dig MX <domaine>` avant** d'envisager Email Routing ; sur un domaine qui reçoit déjà, c'est exclu.
- **Apple Mail (et toute règle client) ne tourne que si l'app est ouverte** → pas fiable pour de l'auto 24/7. Pour du robuste → **règle côté serveur** (Outlook.com : Paramètres → Courrier → Règles).
- **Outlook.com exige une re-vérification d'identité** (bouton « Se connecter ») **avant de créer toute règle de transfert externe** (anti-abus). Claude ne peut pas (mot de passe) → **étape humaine obligatoire**, puis la règle se finalise.
- **Limite cellule Google Sheets = 50 000 caractères** : le « Body Content » HTML d'un mail Outlook dépasse → **stripper le HTML / `getPlainBody()`** avant d'écrire. (C'est ce qui faisait planter le Zap.)
- **Forward vs Redirect** : pour un transfert vers Gmail qui doit atterrir en boîte de réception (pas spam) → **Transférer** (part de TON adresse, SPF OK). **Rediriger** garde l'expéditeur d'origine (airbnb) → SPF fail → spam → `GmailApp.search` le rate (ne lit pas le spam sans `in:anywhere`).
- **Apps Script GmailApp : le scope `https://mail.google.com/` est large** — si le projet utilise déjà `GmailApp.sendEmail`, ajouter `GmailApp.search` (lecture) ne redéclenche **aucun** consentement OAuth (scope déjà couvert). `clasp push` met à jour le HEAD sans toucher la version web déployée (URL `APPS_SCRIPT_URL` préservée).

## 🔄 GAS `addReservation` = uniquement via `doGet`, pas `doPost` body — 2026-06-14 (soir)
- L'action `addReservation` est dispatchée dans `doGet` (paramètre URL) mais **n'est pas dans le switch `doPost`** → `POST` avec body `{action:"addReservation"}` retourne `{"error":"action POST inconnue: addReservation"}`. **La prochaine fois** : pour enrichir/ajouter une réservation depuis un script → utiliser `enrichReservation` (POST, prise en charge) avec `force:true` si on veut écraser ; ne jamais supposer que toutes les actions sont disponibles en POST.

## 2026-06-05 — Emails Worker silencieusement cassés (RESEND_FROM)
- **Symptôme** : push ntfy reçu mais AUCUN email d'alerte résa (ni rappels prix, ni digest). Le Worker ne plante pas si Resend refuse → échec invisible.
- **Cause racine** : `env.RESEND_FROM` du Worker valait `Amaryllis <notifications@>` (domaine manquant) → Resend rejette tout avec « Domain not verified ». Le log Resend (request body) montre le `from` exact = clé du diagnostic.
- **Piège #1** : `wrangler secret put RESEND_FROM` n'a PAS corrigé → une **variable texte définie dans le dashboard Cloudflare prime sur le secret** du même nom. Ne pas supposer que le secret gagne.
- **Leçon** : ne jamais faire confiance à une var d'env d'adresse email. Valider le format dans le code et retomber sur une valeur vérifiée en dur. Pattern appliqué : `resendFrom(env)` (regex domaine FQDN sinon `VERIFIED_FROM`). Robuste quelle que soit la conf.
- **Diagnostic email** : toujours lire le **request body du log Resend** (montre `from`/`to`/erreur réels) — la dashboard "Loading…" ment, le log dit la vérité.
