/**
 * /api/meta-token-exchange — TEMPORAIRE — à SUPPRIMER après usage.
 * Échange un user token court-terme → long-terme → page token non-expirant,
 * en utilisant META_APP_ID + META_APP_SECRET déjà présents dans l'env CF.
 *
 * Auth : ?secret=POSTSTAY_SECRET (réutilise un secret existant pour ne rien exposer)
 *
 * GET  ?secret=...                      → diagnostic : révèle quel App ID / Page ID / IG ID est configuré
 * GET  ?secret=...&user_token=EAAB...   → fait l'échange complet et retourne le page token non-expirant
 */

const GV = "v25.0";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (!env.POSTSTAY_SECRET || secret !== env.POSTSTAY_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  const appId = env.META_APP_ID;
  const appSecret = env.META_APP_SECRET;
  const pageId = env.META_PAGE_ID;
  const igId = env.META_IG_ACCOUNT_ID;

  // Mode test diagnostic : tente des actions de publication ciblées pour isoler les erreurs de permission
  if (url.searchParams.get("test") === "perms") {
    const t = env.META_PAGE_TOKEN;
    const out = {};
    // 1. Qui suis-je sur cette page ? (tasks/roles)
    const meRes = await fetch(`https://graph.facebook.com/${GV}/${pageId}?fields=name,tasks&access_token=${t}`);
    out.page_tasks = await meRes.json();
    // 2. Quelle page est liée à l'IG configuré ?
    const igLinkRes = await fetch(`https://graph.facebook.com/${GV}/${igId}?fields=username,name&access_token=${t}`);
    out.ig_read = await igLinkRes.json();
    // 3. Token type (page ou user ?)
    const dbgRes = await fetch(`https://graph.facebook.com/${GV}/debug_token?input_token=${t}&access_token=${appId}|${appSecret}`);
    const dbg = await dbgRes.json();
    out.token_type = dbg?.data?.type;
    out.token_profile_id = dbg?.data?.profile_id;
    out.token_app_id = dbg?.data?.app_id;
    return json(out);
  }

  // Diagnostic mode : pas de user_token → on révèle juste la config (app_id public, pas le secret)
  const userToken = url.searchParams.get("user_token");
  if (!userToken) {
    // Scopes du token page actuel (non sensible)
    let currentScopes = null, currentValid = null;
    if (env.META_PAGE_TOKEN && appId && appSecret) {
      try {
        const dbgRes = await fetch(
          `https://graph.facebook.com/${GV}/debug_token?input_token=${env.META_PAGE_TOKEN}&access_token=${appId}|${appSecret}`
        );
        const dbg = await dbgRes.json();
        currentScopes = dbg?.data?.scopes || null;
        currentValid = dbg?.data?.is_valid ?? null;
      } catch (e) { /* noop */ }
    }
    return json({
      mode: "diagnostic",
      META_APP_ID: appId || "(absent)",
      META_APP_SECRET_present: !!appSecret,
      META_PAGE_ID: pageId || "(absent)",
      META_IG_ACCOUNT_ID: igId || "(absent)",
      current_page_token_valid: currentValid,
      current_page_token_scopes: currentScopes,
      hint: "Génère un User Token depuis l'app dont l'ID = META_APP_ID ci-dessus, puis rappelle avec &user_token=...",
    });
  }

  if (!appId || !appSecret) {
    return json({ error: "META_APP_ID ou META_APP_SECRET absent de l'env CF" }, 500);
  }

  // Helper : écrit un diagnostic dans D1 (lisible en terminal — contourne le filtre navigateur)
  const writeDebug = async (obj) => {
    if (!env.revenue_manager) return;
    try {
      await env.revenue_manager
        .prepare("CREATE TABLE IF NOT EXISTS kv_store (k TEXT PRIMARY KEY, v TEXT, updated_at INTEGER)")
        .run();
      await env.revenue_manager
        .prepare("INSERT OR REPLACE INTO kv_store (k, v, updated_at) VALUES (?, ?, ?)")
        .bind("meta_exchange_debug", JSON.stringify(obj), Date.now())
        .run();
    } catch (e) { /* noop */ }
  };

  // Étape 1 : échange court → long-terme
  const llRes = await fetch(
    `https://graph.facebook.com/${GV}/oauth/access_token?grant_type=fb_exchange_token` +
      `&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(userToken)}`
  );
  const ll = await llRes.json();
  if (ll.error) {
    await writeDebug({ step: "exchange_long_lived", error_code: ll.error.code, error_subcode: ll.error.error_subcode, message: ll.error.message });
    return json({ step: "exchange_long_lived", error: ll.error }, 400);
  }
  const longLivedUserToken = ll.access_token;

  // Étape 2 : récupérer le page token (dérivé d'un user token long-terme = non-expirant)
  const accRes = await fetch(
    `https://graph.facebook.com/${GV}/me/accounts?fields=name,id,access_token&access_token=${longLivedUserToken}`
  );
  const acc = await accRes.json();
  if (acc.error) {
    await writeDebug({ step: "me_accounts", error_code: acc.error.code, message: acc.error.message });
    return json({ step: "me_accounts", error: acc.error }, 400);
  }

  // Trouver la page configurée (META_PAGE_ID) ou lister toutes les pages
  const pages = (acc.data || []).map((p) => ({
    name: p.name,
    id: p.id,
    is_configured_page: p.id === pageId,
    page_token: p.access_token,
  }));

  const target = pages.find((p) => p.is_configured_page);

  // Étape 3 : vérifier l'expiration du page token cible
  let tokenCheck = null;
  if (target) {
    const dbgRes = await fetch(
      `https://graph.facebook.com/${GV}/debug_token?input_token=${target.page_token}&access_token=${appId}|${appSecret}`
    );
    const dbg = await dbgRes.json();
    tokenCheck = {
      expires_at: dbg?.data?.expires_at,
      is_non_expiring: dbg?.data?.expires_at === 0,
      scopes: dbg?.data?.scopes,
    };
  }

  // Étape 4 : persister le page token en D1 (jamais retourné en clair) — récupéré ensuite en terminal
  let persisted = false;
  if (target?.page_token && env.revenue_manager) {
    await env.revenue_manager
      .prepare("CREATE TABLE IF NOT EXISTS kv_store (k TEXT PRIMARY KEY, v TEXT, updated_at INTEGER)")
      .run();
    await env.revenue_manager
      .prepare("INSERT OR REPLACE INTO kv_store (k, v, updated_at) VALUES (?, ?, ?)")
      .bind("meta_page_token_pending", target.page_token, Date.now())
      .run();
    persisted = true;
  }

  await writeDebug({
    step: "complete",
    page_found: !!target,
    persisted,
    non_expiring: tokenCheck?.is_non_expiring,
    expires_at: tokenCheck?.expires_at,
    pages: pages.map((p) => ({ name: p.name, id: p.id, configured: p.is_configured_page })),
  });

  return json({
    mode: "exchange_complete",
    long_lived_user_token_expires_in_days: ll.expires_in ? Math.round(ll.expires_in / 86400) : null,
    configured_page_id: pageId,
    target_page_found: !!target,
    target_page_token_preview: target?.page_token ? target.page_token.slice(0, 12) + "…" : null,
    target_token_check: tokenCheck,
    persisted_to_d1: persisted,
    all_pages: pages.map((p) => ({ name: p.name, id: p.id, is_configured_page: p.is_configured_page })),
  });
}
