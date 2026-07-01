// GET /api/gmail-oauth-callback — retour du consentement Google (redirect_uri déclaré
// UNE FOIS dans les identifiants OAuth Google Cloud, partagé par tous les providers).
// Échange le code contre un refresh_token, le stocke en D1 (oauth_tokens, clé = provider
// lu depuis `state`), puis redirige vers /admin.

import { exchangeCodeForTokens, verifyOAuthState, saveOAuthTokens, fetchGoogleAccountEmail } from "./_googleOAuth.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const adminUrl = `${env.SITE_URL || "https://villamaryllis.com"}/admin`;
  const redirectErr = (provider, reason) =>
    Response.redirect(`${adminUrl}?gmail_oauth=error&provider=${encodeURIComponent(provider || "")}&reason=${encodeURIComponent(reason)}`, 302);

  const { valid, provider } = await verifyOAuthState(env, state);

  if (errorParam) return redirectErr(provider, errorParam);
  if (!code || !valid) return redirectErr(provider, "state_invalide");

  const db = env.revenue_manager;
  if (!db) return redirectErr(provider, "d1_indisponible");

  try {
    const tokens = await exchangeCodeForTokens(env, code);
    if (!tokens.refresh_token) {
      // Arrive si le compte avait déjà consenti sans prompt=consent — normalement
      // buildAuthUrl force prompt=consent donc ne devrait pas se produire.
      return redirectErr(provider, "pas_de_refresh_token");
    }

    const accountEmail = await fetchGoogleAccountEmail(tokens.access_token);

    await saveOAuthTokens(db, provider, {
      accountEmail,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresAt: Date.now() + (tokens.expires_in || 3500) * 1000,
      scope: tokens.scope,
    });

    return Response.redirect(
      `${adminUrl}?gmail_oauth=ok&provider=${encodeURIComponent(provider)}&account=${encodeURIComponent(accountEmail || "")}`,
      302
    );
  } catch (e) {
    return redirectErr(provider, e.message);
  }
}
