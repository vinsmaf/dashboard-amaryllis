// GET /api/gmail-oauth-callback — retour du consentement Google (redirect_uri déclaré
// dans les identifiants OAuth Google Cloud). Échange le code contre un refresh_token,
// le stocke en D1 (oauth_tokens), puis redirige vers /admin.

import { exchangeCodeForTokens, verifyOAuthState, saveOAuthTokens } from "./_googleOAuth.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const adminUrl = `${env.SITE_URL || "https://villamaryllis.com"}/admin`;

  if (errorParam) {
    return Response.redirect(`${adminUrl}?gmail_oauth=error&reason=${encodeURIComponent(errorParam)}`, 302);
  }
  if (!code || !(await verifyOAuthState(env, state))) {
    return Response.redirect(`${adminUrl}?gmail_oauth=error&reason=state_invalide`, 302);
  }

  const db = env.revenue_manager;
  if (!db) return Response.redirect(`${adminUrl}?gmail_oauth=error&reason=d1_indisponible`, 302);

  try {
    const tokens = await exchangeCodeForTokens(env, code);
    if (!tokens.refresh_token) {
      // Arrive si le compte avait déjà consenti sans prompt=consent — normalement
      // buildAuthUrl force prompt=consent donc ne devrait pas se produire.
      return Response.redirect(`${adminUrl}?gmail_oauth=error&reason=pas_de_refresh_token`, 302);
    }

    // Récupère l'adresse du compte connecté (informatif, affiché dans l'UI)
    let accountEmail = null;
    try {
      const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        accountEmail = profile.emailAddress || null;
      }
    } catch { /* non bloquant */ }

    await saveOAuthTokens(db, "gmail", {
      accountEmail,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresAt: Date.now() + (tokens.expires_in || 3500) * 1000,
      scope: tokens.scope,
    });

    return Response.redirect(`${adminUrl}?gmail_oauth=ok&account=${encodeURIComponent(accountEmail || "")}`, 302);
  } catch (e) {
    return Response.redirect(`${adminUrl}?gmail_oauth=error&reason=${encodeURIComponent(e.message)}`, 302);
  }
}
