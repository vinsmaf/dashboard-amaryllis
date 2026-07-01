// _googleOAuth.js — helper partagé OAuth2 "installed/web app" pour les APIs Google
// (Gmail pour l'instant ; réutilisable pour Google Calendar — chantier 2 du plan
// connecteurs 2026-07, voir PROJECT_MEMORY.md).
//
// Différent de functions/api/analytics.js (Service Account JWT, pas de consentement
// utilisateur) : ici on lit la boîte contact@villamaryllis.com, un compte Workspace
// standard sur lequel Vincent doit donner un consentement OAuth une fois via le
// bouton "Connecter Gmail" (MessagerieTab). Le refresh_token obtenu est stocké en
// D1 (table oauth_tokens, migration 0004) et ne nécessite plus jamais de re-consentement
// tant qu'il n'est pas révoqué côté Google.
//
// Secrets Cloudflare requis : GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
// (créés dans Google Cloud Console — voir docs/GMAIL-SETUP.md pour la procédure complète).

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

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
 * State signé anti-CSRF pour le flow OAuth (5 min de validité). Utilise le même secret
 * que la session admin (_adminauth.js) — pas de stockage nécessaire côté serveur.
 */
export async function signOAuthState(env) {
  const secret = env.ADMIN_PASSWORD || env.ADMIN_PWD || "";
  const exp = Math.floor(Date.now() / 1000) + 300;
  const sig = await hmac(secret, `gmail_oauth.${exp}`);
  return `${exp}.${sig}`;
}
export async function verifyOAuthState(env, state) {
  const secret = env.ADMIN_PASSWORD || env.ADMIN_PWD || "";
  if (!secret || !state) return false;
  const [expStr, sig] = String(state).split(".");
  const exp = parseInt(expStr, 10);
  if (!exp || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmac(secret, `gmail_oauth.${exp}`);
  return expected === sig;
}

/** URL de redirection canonique (doit être ajoutée telle quelle dans les identifiants OAuth Google Cloud). */
export function oauthRedirectUri(env) {
  const site = env.SITE_URL || "https://villamaryllis.com";
  return `${site}/api/gmail-oauth-callback`;
}

/** Construit l'URL de consentement Google. `state` sert à vérifier l'origine au retour (anti-CSRF léger). */
export function buildAuthUrl(env, state) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_OAUTH_CLIENT_ID || "",
    redirect_uri: oauthRedirectUri(env),
    response_type: "code",
    access_type: "offline",   // requis pour obtenir un refresh_token
    prompt: "consent",        // force la réémission du refresh_token même si déjà autorisé avant
    scope: GMAIL_SCOPE,
    state: state || "",
  });
  return `${AUTH_URL}?${params.toString()}`;
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

/** Enregistre/écrase les tokens pour un provider (upsert). */
export async function saveOAuthTokens(db, provider, { accountEmail, refreshToken, accessToken, expiresAt, scope }) {
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
  ).bind(provider, accountEmail || null, refreshToken || null, accessToken || null, expiresAt || null, scope || null, Date.now()).run();
}

/**
 * Retourne un access_token valide pour `provider` (par défaut "gmail"), en rafraîchissant
 * si besoin (cache 60s de marge). Lève une erreur explicite si aucun refresh_token n'est
 * stocké (= jamais connecté via /api/gmail-oauth-start).
 */
export async function getValidAccessToken(env, db, provider = "gmail") {
  const row = await getOAuthRow(db, provider);
  if (!row || !row.refresh_token) {
    throw new Error(`Gmail non connecté — utilise le bouton "Connecter Gmail" dans Messagerie (provider=${provider})`);
  }
  const now = Date.now();
  if (row.access_token && row.expires_at && row.expires_at - 60_000 > now) {
    return row.access_token; // encore valide
  }
  const refreshed = await refreshAccessToken(env, row.refresh_token);
  const expiresAt = now + (refreshed.expires_in || 3500) * 1000;
  await saveOAuthTokens(db, provider, {
    accountEmail: row.account_email,
    refreshToken: null, // ne pas écraser le refresh_token existant (Google n'en renvoie pas à chaque refresh)
    accessToken: refreshed.access_token,
    expiresAt,
    scope: refreshed.scope || row.scope,
  });
  return refreshed.access_token;
}
