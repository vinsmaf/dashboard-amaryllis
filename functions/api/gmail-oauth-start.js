// GET /api/gmail-oauth-start?token=<admin_session_token>
// Démarre le flow OAuth Gmail — redirige vers l'écran de consentement Google.
// Auth admin via ?token= (pas de header Authorization possible sur une navigation
// plein-écran) : on reconstruit une Request avec le header pour réutiliser verifyBearer.
// Cliqué depuis MessagerieTab (bouton "Connecter Gmail").

import { verifyBearer } from "./_adminauth.js";
import { buildAuthUrl, signOAuthState } from "./_googleOAuth.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";

  const fakeReq = new Request(request.url, { headers: { Authorization: `Bearer ${token}` } });
  const { ok, role } = await verifyBearer(fakeReq, env);
  if (!ok || role !== "admin") {
    return new Response("Non autorisé — reconnecte-toi à l'admin puis réessaie.", { status: 401 });
  }

  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return new Response(
      "Secrets Google manquants (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET) — voir docs/GMAIL-SETUP.md",
      { status: 503 }
    );
  }

  const state = await signOAuthState(env);
  return Response.redirect(buildAuthUrl(env, state), 302);
}
