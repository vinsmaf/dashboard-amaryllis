/**
 * /api/social — Proxy Meta Graph API pour Instagram + Facebook
 * Actions GET  : ?action=status | ?action=posts&limit=12
 * Actions POST : { action: "publish", caption, imageUrl, channels: ["ig","fb"] }
 *                { action: "schedule", caption, imageUrl, channels, scheduledAt }
 */

const GV = "v25.0";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function graphGet(path, token) {
  const r = await fetch(`https://graph.facebook.com/${GV}/${path}&access_token=${token}`);
  return r.json();
}

async function graphPost(path, token, body) {
  const params = new URLSearchParams({ ...body, access_token: token });
  const r = await fetch(`https://graph.facebook.com/${GV}/${path}`, {
    method: "POST",
    body: params,
  });
  return r.json();
}

// GET /api/social?action=status
async function handleStatus(env) {
  const token   = env.META_PAGE_TOKEN;
  const pageId  = env.META_PAGE_ID;
  const igId    = env.META_IG_ACCOUNT_ID;

  if (!token || !pageId) return json({ error: "META_PAGE_TOKEN ou META_PAGE_ID non configuré" }, 500);

  const [pageInfo, igInfo] = await Promise.all([
    graphGet(`${pageId}?fields=name,followers_count,fan_count`, token),
    igId ? graphGet(`${igId}?fields=username,followers_count,media_count`, token) : Promise.resolve(null),
  ]);

  // Vérifier expiration du token
  const debugRes = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`
  );
  const debug = await debugRes.json();
  const expiresAt = debug?.data?.expires_at || 0;

  return json({
    page: pageInfo,
    ig: igInfo,
    token: {
      expiresAt,
      expiresIn: expiresAt ? Math.floor((expiresAt * 1000 - Date.now()) / 86400000) : null,
      isValid: !debug?.data?.error,
    },
  });
}

// GET /api/social?action=posts&limit=12
async function handlePosts(env, limit = 12) {
  const token  = env.META_PAGE_TOKEN;
  const pageId = env.META_PAGE_ID;
  const igId   = env.META_IG_ACCOUNT_ID;

  if (!token || !pageId) return json({ error: "Secrets non configurés" }, 500);

  const fields = "id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink";
  const [igPosts, fbPosts] = await Promise.all([
    igId
      ? graphGet(`${igId}/media?fields=${fields}&limit=${limit}`, token)
      : Promise.resolve({ data: [] }),
    graphGet(`${pageId}/posts?fields=id,message,created_time,attachments{media},full_picture&limit=${limit}`, token),
  ]);

  return json({
    ig: igPosts?.data || [],
    fb: fbPosts?.data || [],
  });
}

// POST /api/social — publish
// Note: le compte Instagram est un PBIA (page-backed Instagram account).
// Poster sur la Page Facebook publie automatiquement sur Instagram aussi.
// Donc "ig" et "fb" envoient tous les deux vers la Page Facebook.
async function handlePublish(env, { caption, imageUrl, channels = ["ig", "fb"] }) {
  const token  = env.META_PAGE_TOKEN;
  const pageId = env.META_PAGE_ID;

  if (!token || !pageId) return json({ error: "Secrets non configurés" }, 500);

  const results = {};

  // Un seul post vers la Page Facebook publie sur FB + Instagram (PBIA)
  const shouldPost = channels.includes("fb") || channels.includes("ig");
  if (shouldPost) {
    try {
      if (imageUrl) {
        const r = await graphPost(`${pageId}/photos`, token, { url: imageUrl, caption });
        const result = r.error ? { error: r.error.message } : { id: r.id, ok: true };
        if (channels.includes("fb")) results.fb = result;
        if (channels.includes("ig")) results.ig = { ...result, note: "Via Page Facebook (PBIA)" };
      } else {
        const r = await graphPost(`${pageId}/feed`, token, { message: caption });
        const result = r.error ? { error: r.error.message } : { id: r.id, ok: true };
        if (channels.includes("fb")) results.fb = result;
        if (channels.includes("ig")) results.ig = { error: "Instagram nécessite une image" };
      }
    } catch (e) {
      if (channels.includes("fb")) results.fb = { error: e.message };
      if (channels.includes("ig")) results.ig = { error: e.message };
    }
  }

  // ── Instagram Graph API (si jamais instagram_content_publish est accordé) ──
  if (false) {
    try {
      if (!imageUrl) {
        results.ig = { error: "Instagram nécessite une image" };
      } else {
        // Étape 1 : créer le container
        const igId = env.META_IG_ACCOUNT_ID;
        const container = await graphPost(`${igId}/media`, token, {
          image_url: imageUrl,
          caption,
        });

        if (container.error) {
          results.ig = { error: container.error.message };
        } else {
          // Étape 2 : publier
          const publish = await graphPost(`${igId}/media_publish`, token, {
            creation_id: container.id,
          });
          results.ig = publish.error
            ? { error: publish.error.message }
            : { id: publish.id, ok: true };
        }
      }
    } catch (e) {
      results.ig = { error: e.message };
    }
  } // end if(false)

  const hasSuccess = Object.values(results).some(r => r.ok);
  return json({ results, ok: hasSuccess }, hasSuccess ? 200 : 422);
}

export async function onRequestGet({ request, env }) {
  const url    = new URL(request.url);
  const action = url.searchParams.get("action") || "status";
  const limit  = parseInt(url.searchParams.get("limit") || "12");

  if (action === "status") return handleStatus(env);
  if (action === "posts")  return handlePosts(env, limit);
  return json({ error: "action inconnue" }, 400);
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Body JSON invalide" }, 400); }

  if (body.action === "publish") return handlePublish(env, body);
  return json({ error: "action inconnue" }, 400);
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
