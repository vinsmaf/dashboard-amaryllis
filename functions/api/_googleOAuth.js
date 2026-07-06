// _googleOAuth.js — helper partagé OAuth2 "installed/web app" pour les APIs Google.
// Multi-provider depuis le chantier 2 (Calendar) : un même compte Google Cloud
// (GOOGLE_OAUTH_CLIENT_ID/SECRET) sert plusieurs connexions indépendantes — une par
// "provider" (gmail, calendar, ...), chacune avec son propre refresh_token en D1
// (table oauth_tokens, migration 0004) pour ne pas toucher à une connexion qui marche
// déjà quand on en ajoute une nouvelle.
//
// Différent de functions/api/analytics.js (Service Account JWT, pas de consentement
// utilisateur) : ici on lit/écrit sur le compte contact@villamaryllis.com, un compte
// Workspace standard sur lequel Vincent doit donner un consentement OAuth une fois par
// provider (boutons "Connecter Gmail" / "Connecter Calendar"). Le refresh_token obtenu
// ne nécessite plus jamais de re-consentement tant qu'il n'est pas révoqué côté Google.
//
// Secrets Cloudflare requis : GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
// (créés dans Google Cloud Console — voir docs/GMAIL-SETUP.md pour la procédure complète).
// Le même Client ID/Secret sert à TOUS les providers — un seul projet Google Cloud.

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
// "openid email" est ajouté systématiquement (peu importe le provider) pour pouvoir
// afficher quel compte Google est connecté, via l'endpoint userinfo standard.
const IDENTITY_SCOPES = "openid email";
export const SCOPES_BY_PROVIDER = {
  gmail: GMAIL_SCOPE,
  calendar: CALENDAR_SCOPE,
};

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const enc = new TextEncoder();
function b64url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return b64url(new Uint8Array(sig));
}

/**
 * State signé anti-CSRF pour le flow OAuth (5 min de validité), encode aussi le
 * provider ciblé (gmail|calendar) pour que le callback unique sache où stocker le
 * token obtenu. Utilise le même secret que la session admin (_adminauth.js) — pas
 * de stockage nécessaire côté serveur.
 */
export async function signOAuthState(env, provider) {
  const secret = env.ADMIN_PASSWORD || env.ADMIN_PWD || "";
  const exp = Math.floor(Date.now() / 1000) + 300;
  const sig = await hmac(secret, `gmail_oauth.${provider}.${exp}`);
  return `${provider}.${exp}.${sig}`;
}
/** Retourne { valid, provider } — provider absent/invalide si valid=false. */
export async function verifyOAuthState(env, state) {
  const secret = env.ADMIN_PASSWORD || env.ADMIN_PWD || "";
  if (!secret || !state) return { valid: false };
  const [provider, expStr, sig] = String(state).split(".");
  const exp = parseInt(expStr, 10);
  if (!provider || !exp || exp < Math.floor(Date.now() / 1000)) return { valid: false };
  const expected = await hmac(secret, `gmail_oauth.${provider}.${exp}`);
  if (expected !== sig) return { valid: false };
  return { valid: true, provider };
}

/** URL de redirection canonique (doit être ajoutée telle quelle dans les identifiants OAuth Google Cloud). */
export function oauthRedirectUri(env) {
  const site = env.SITE_URL || "https://villamaryllis.com";
  return `${site}/api/gmail-oauth-callback`;
}

/** Construit l'URL de consentement Google pour un provider donné (scope + identité). */
export function buildAuthUrl(env, state, providerScope) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_OAUTH_CLIENT_ID || "",
    redirect_uri: oauthRedirectUri(env),
    response_type: "code",
    access_type: "offline",   // requis pour obtenir un refresh_token
    prompt: "consent",        // force la réémission du refresh_token même si déjà autorisé avant
    scope: `${providerScope} ${IDENTITY_SCOPES}`,
    state: state || "",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/** Récupère l'adresse du compte Google connecté (scope "email" — fonctionne pour tous les providers). */
export async function fetchGoogleAccountEmail(accessToken) {
  try {
    const r = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) return null;
    const data = await r.json();
    return data.email || null;
  } catch { return null; }
}

/** Échange le code d'autorisation contre { access_token, refresh_token, expires_in }. */
export async function exchangeCodeForTokens(env, code) {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_OAUTH_CLIENT_ID || "",
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    redirect_uri: oauthRedirectUri(env),
    grant_type: "authorization_code",
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Échange code Google échoué : ${data.error_description || data.error || r.status}`);
  return data; // { access_token, refresh_token, expires_in, scope, token_type }
}

/** Rafraîchit un access_token à partir du refresh_token stocké. */
async function refreshAccessToken(env, refreshToken) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: env.GOOGLE_OAUTH_CLIENT_ID || "",
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    grant_type: "refresh_token",
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Refresh token Google échoué : ${data.error_description || data.error || r.status}`);
  return data; // { access_token, expires_in, scope, token_type }
}

/** Lit la ligne oauth_tokens pour un provider donné (ex: "gmail"). */
export async function getOAuthRow(db, provider) {
  return db.prepare("SELECT * FROM oauth_tokens WHERE provider = ?").bind(provider).first();
}

/** Enregistre/écrase les tokens pour un provider (upsert) — UNIQUEMENT pour la 1ère
 * connexion (gmail-oauth-callback.js), où refreshToken est TOUJOURS une vraie valeur.
 * ⚠️ Ne jamais appeler avec refreshToken=null : `refresh_token` est NOT NULL en base,
 * et SQLite valide cette contrainte sur les VALUES brutes de l'INSERT AVANT même
 * d'évaluer le ON CONFLICT DO UPDATE — le COALESCE ci-dessous ne protège donc PAS
 * contre un refreshToken null passé en entrée (bug trouvé le 2026-07-06 : la
 * reconnexion Gmail/Calendar cassait à chaque refresh de token silencieusement,
 * malgré ce COALESCE qui semblait pourtant correct à la lecture). Le rafraîchissement
 * d'access_token (sans nouveau refresh_token) doit passer par `updateAccessToken`
 * ci-dessous, qui ne touche jamais la colonne refresh_token. */
export async function saveOAuthTokens(db, provider, { accountEmail, refreshToken, accessToken, expiresAt, scope }) {
  if (!refreshToken) throw new Error("saveOAuthTokens requiert un refreshToken non-null — utiliser updateAccessToken() pour un simple refresh d'access_token");
  await db.prepare(
    `INSERT INTO oauth_tokens (provider, account_email, refresh_token, access_token, expires_at, scope, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(provider) DO UPDATE SET
       account_email = excluded.account_email,
       refresh_token = COALESCE(excluded.refresh_token, oauth_tokens.refresh_token),
       access_token  = excluded.access_token,
       expires_at    = excluded.expires_at,
       scope         = excluded.scope,
       updated_at    = excluded.updated_at`
  ).bind(provider, accountEmail || null, refreshToken, accessToken || null, expiresAt || null, scope || null, Date.now()).run();
}

/** Met à jour UNIQUEMENT access_token/expires_at/scope pour un provider déjà connecté —
 * ne touche jamais refresh_token (colonne NOT NULL). C'est le chemin correct pour un
 * simple rafraîchissement d'access_token (Google ne renvoie pas de nouveau refresh_token
 * à chaque refresh). Suppose que la ligne existe déjà (appelant : getValidAccessToken,
 * après avoir lu un row avec refresh_token non-null). */
async function updateAccessToken(db, provider, { accessToken, expiresAt, scope }) {
  await db.prepare(
    "UPDATE oauth_tokens SET access_token = ?, expires_at = ?, scope = ?, updated_at = ? WHERE provider = ?"
  ).bind(accessToken || null, expiresAt || null, scope || null, Date.now(), provider).run();
}

/**
 * Retourne un access_token valide pour `provider` (par défaut "gmail"), en rafraîchissant
 * si besoin (cache 60s de marge). Lève une erreur explicite si aucun refresh_token n'est
 * stocké (= jamais connecté via /api/gmail-oauth-start).
 */
export async function getValidAccessToken(env, db, provider = "gmail") {
  const row = await getOAuthRow(db, provider);
  if (!row || !row.refresh_token) {
    throw new Error(`Compte Google (${provider}) non connecté — utilise le bouton "Connecter" correspondant dans l'admin`);
  }
  const now = Date.now();
  if (row.access_token && row.expires_at && row.expires_at - 60_000 > now) {
    return row.access_token; // encore valide
  }
  const refreshed = await refreshAccessToken(env, row.refresh_token);
  const expiresAt = now + (refreshed.expires_in || 3500) * 1000;
  await updateAccessToken(db, provider, {
    accessToken: refreshed.access_token,
    expiresAt,
    scope: refreshed.scope || row.scope,
  });
  return refreshed.access_token;
}
