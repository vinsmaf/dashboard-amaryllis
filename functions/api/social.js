/**
 * /api/social — Proxy Meta Graph API pour Instagram + Facebook
 * Actions GET  : ?action=status | ?action=posts&limit=12
 * Actions POST : { action: "publish", caption, imageUrl, channels: ["ig","fb"] }
 *                { action: "schedule", caption, imageUrl, channels, scheduledAt }
 */

import { verifyBearer } from "./_adminauth.js";

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
      scopes: debug?.data?.scopes || [],
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

// Extrait l'URL Amaryllis du caption (1ère URL https://villamaryllis.com/X trouvée)
function extractAmaryllisUrl(caption) {
  if (!caption) return null;
  const m = caption.match(/https?:\/\/villamaryllis\.com\/[a-z\-]+/i);
  return m ? m[0] : null;
}

// POST /api/social — publish
// @amaryllislocations est un Instagram Business Account séparé (pas PBIA).
// Publication indépendante : Facebook via Page, Instagram via container Graph API.
async function handlePublish(env, { caption, imageUrl, channels = ["ig", "fb"], firstComment }) {
  const token  = env.META_PAGE_TOKEN;
  const pageId = env.META_PAGE_ID;
  const igId   = env.META_IG_ACCOUNT_ID;

  if (!token || !pageId) return json({ error: "Secrets non configurés" }, 500);

  const results = {};

  // ── Facebook Page ────────────────────────────────────────────────────────
  let fbPostId = null;
  if (channels.includes("fb")) {
    try {
      if (imageUrl) {
        const r = await graphPost(`${pageId}/photos`, token, { url: imageUrl, caption });
        results.fb = r.error ? { error: r.error.message } : { id: r.id, ok: true };
        if (results.fb.ok) fbPostId = r.post_id || r.id;
      } else {
        const r = await graphPost(`${pageId}/feed`, token, { message: caption });
        results.fb = r.error ? { error: r.error.message } : { id: r.id, ok: true };
        if (results.fb.ok) fbPostId = r.id;
      }
    } catch (e) {
      results.fb = { error: e.message };
    }
  }

  // ── Instagram via Graph API (container + publish) ────────────────────────
  let igPostId = null;
  if (channels.includes("ig")) {
    if (!igId) {
      results.ig = { error: "META_IG_ACCOUNT_ID non configuré" };
    } else if (!imageUrl) {
      results.ig = { error: "Instagram nécessite une image" };
    } else {
      try {
        // Étape 1 : créer le container média
        const container = await graphPost(`${igId}/media`, token, {
          image_url: imageUrl,
          caption,
        });
        if (container.error) {
          results.ig = { error: container.error.message };
        } else {
          // Le container IG a besoin de ~2-5 sec avant d'être publiable
          await new Promise(r => setTimeout(r, 4000));

          // Étape 2 : publier le container
          const publish = await graphPost(`${igId}/media_publish`, token, {
            creation_id: container.id,
          });
          results.ig = publish.error
            ? { error: publish.error.message }
            : { id: publish.id, ok: true };
          if (results.ig.ok) igPostId = publish.id;
        }
      } catch (e) {
        results.ig = { error: e.message };
      }
    }
  }

  // ── Premier commentaire avec le lien direct (Facebook uniquement) ────────
  // Nécessite pages_manage_engagement (non disponible dans l'app actuelle).
  // On tente quand même — si erreur permission, on ignore silencieusement
  // (le lien est déjà dans la caption, c'était juste un bonus de visibilité).
  if (fbPostId) {
    const linkUrl = extractAmaryllisUrl(caption);
    const commentText = firstComment || (linkUrl
      ? `🔗 Réservez directement ici : ${linkUrl}\n\n👉 Ou retrouvez tous nos hébergements : https://villamaryllis.com/links`
      : null);
    if (commentText) {
      try {
        const cr = await graphPost(`${fbPostId}/comments`, token, { message: commentText });
        if (cr.error) {
          // On ne remonte l'erreur que si elle n'est pas liée aux permissions manquantes
          const isPermissionError = /permission|access|scope/i.test(cr.error.message || "");
          if (!isPermissionError) {
            results.first_comment = { error: cr.error.message };
          }
          // sinon : silent skip (le lien est déjà dans la caption)
        } else {
          results.first_comment = { id: cr.id, ok: true };
        }
      } catch (e) {
        // Silent skip réseau aussi — non bloquant
      }
    }
  }

  const hasSuccess = Object.values(results).some(r => r.ok);
  return json({ results, ok: hasSuccess }, hasSuccess ? 200 : 422);
}

// ── Publication d'un Reel Instagram via Graph API ──────────────────────────────
// Flux REELS (différent de l'image) : container media_type=REELS + video_url
// → polling status_code (l'encodage vidéo côté Meta est asynchrone) → media_publish.
// `dryRun` s'arrête à FINISHED sans publier (validation du tuyau sans poster).
// Facebook Reels = flux distinct (video_reels), traité dans une phase ultérieure.
async function pollContainer(containerId, token, { maxTries = 5, intervalMs = 4000 } = {}) {
  for (let i = 0; i < maxTries; i++) {
    const s = await graphGet(`${containerId}?fields=status_code,status`, token);
    const code = s?.status_code;
    if (code === "FINISHED") return { ready: true, status: s };
    if (code === "ERROR" || code === "EXPIRED") return { ready: false, error: s?.status || code, status: s };
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return { ready: false, timeout: true };
}

// Publie un container déjà encodé par Meta (pour reprendre après un timeout de polling)
async function handlePublishContainer(env, { containerId, igAccountId }) {
  const token = env.META_PAGE_TOKEN;
  const igId  = igAccountId || env.META_IG_ACCOUNT_ID;
  if (!token) return json({ error: "META_PAGE_TOKEN manquant" }, 500);
  if (!containerId) return json({ error: "containerId requis" }, 400);
  if (!igId) return json({ error: "META_IG_ACCOUNT_ID manquant" }, 500);

  // Vérifier que l'encodage est terminé
  const status = await graphGet(`${containerId}?fields=status_code,status`, token);
  const code = status?.status_code;
  if (code !== "FINISHED") {
    return json({ ok: false, error: `Container pas prêt : ${code || "inconnu"}`, status_code: code }, 422);
  }
  const publish = await graphPost(`${igId}/media_publish`, token, { creation_id: containerId });
  if (publish.error) return json({ ok: false, error: publish.error.message }, 422);
  return json({ ok: true, id: publish.id, container_id: containerId });
}

async function handlePublishReel(env, { caption, videoUrl, coverUrl, channels = ["ig"], dryRun, igContainerId }) {
  const token = env.META_PAGE_TOKEN;
  const igId  = env.META_IG_ACCOUNT_ID;

  if (!token) return json({ error: "META_PAGE_TOKEN non configuré" }, 500);
  if (!videoUrl) return json({ error: "videoUrl requis (URL MP4 publique)" }, 400);

  const results = {};

  if (channels.includes("ig")) {
    if (!igId) {
      results.ig = { error: "META_IG_ACCOUNT_ID non configuré" };
    } else {
      try {
        let containerId = igContainerId || null;

        if (!containerId) {
          // Étape 1 : créer le container REELS
          const containerBody = { media_type: "REELS", video_url: videoUrl, caption: caption || "", share_to_feed: "true" };
          if (coverUrl) containerBody.cover_url = coverUrl;
          const container = await graphPost(`${igId}/media`, token, containerBody);
          if (container.error) { results.ig = { error: container.error.message }; }
          else { containerId = container.id; }
        }

        if (containerId) {
          // Étape 2 : attendre la fin de l'encodage Meta (asynchrone côté Meta)
          const poll = await pollContainer(containerId, token);
          if (!poll.ready) {
            // Encodage pas encore terminé : renvoyer le container_id pour reprise au prochain cron
            results.ig = {
              error: poll.timeout ? "Encodage Meta non terminé — reprise auto au prochain cron" : `Encodage échoué : ${poll.error}`,
              container_id: containerId,
              retry: !!poll.timeout,
            };
          } else if (dryRun) {
            results.ig = { ok: true, dryRun: true, container_id: containerId, status: "FINISHED", note: "Container prêt — media_publish NON exécuté (dry-run)" };
          } else {
            // Étape 3 : publier le container encodé
            const publish = await graphPost(`${igId}/media_publish`, token, { creation_id: containerId });
            results.ig = publish.error ? { error: publish.error.message } : { id: publish.id, ok: true };
          }
        }
      } catch (e) {
        results.ig = { error: e.message };
      }
    }
  }

  if (channels.includes("fb")) {
    const fbPageId = env.META_PAGE_ID;
    if (!fbPageId) {
      results.fb = { error: "META_PAGE_ID non configuré" };
    } else {
      try {
        // Facebook Reels — upload en 3 phases (API Graph exige upload_phase)
        // Phase 1 : initialiser → obtenir video_id + upload_url
        const initResp = await graphPost(`${fbPageId}/video_reels`, token, { upload_phase: "start" });
        if (initResp.error) {
          results.fb = { error: `Phase start: ${initResp.error.message || JSON.stringify(initResp.error)}` };
        } else {
          const { video_id: fbVideoId, upload_url: uploadUrl } = initResp;
          if (!fbVideoId || !uploadUrl) {
            results.fb = { error: "Phase start : video_id ou upload_url manquant" };
          } else {
            // Phase 2 : stream la vidéo depuis notre CDN → upload_url FB (binaire)
            const videoResp = await fetch(videoUrl);
            if (!videoResp.ok) throw new Error(`Fetch vidéo: HTTP ${videoResp.status}`);
            const fileSize = videoResp.headers.get("content-length") || "0";
            const transferResp = await fetch(uploadUrl, {
              method: "POST",
              headers: {
                "Authorization": `OAuth ${token}`,
                "Content-Type": "video/mp4",
                "offset": "0",
                "file_size": fileSize,
              },
              body: videoResp.body,
            });
            const transferData = await transferResp.json().catch(() => ({}));
            if (!transferResp.ok || transferData.error) {
              results.fb = { error: `Phase transfer: ${transferData.error?.message || transferResp.status}` };
            } else {
              // Phase 3 : finish → publier (ou passer en DRAFT pour dry-run)
              const finishResp = await graphPost(`${fbPageId}/video_reels`, token, {
                upload_phase: "finish",
                video_id: fbVideoId,
                video_state: dryRun ? "DRAFT" : "PUBLISHED",
                description: caption || "",
                title: caption ? caption.split("\n")[0].slice(0, 100) : "Reel",
              });
              if (finishResp.error) {
                results.fb = { error: `Phase finish: ${finishResp.error.message || JSON.stringify(finishResp.error)}` };
              } else {
                results.fb = { ok: !dryRun, id: fbVideoId, dryRun: !!dryRun };
              }
            }
          }
        }
      } catch (e) {
        results.fb = { error: e.message };
      }
    }
  }

  const hasSuccess = Object.values(results).some(r => r.ok);
  return json({ results, ok: hasSuccess }, hasSuccess ? 200 : 422);
}

// Insights d'un post publié — IG media + FB video
async function handleInsights(env, { igId: igMediaId, fbId: fbVideoId }) {
  const token = env.META_PAGE_TOKEN;
  if (!token) return json({ error: "META_PAGE_TOKEN non configuré" }, 500);
  const out = {};
  if (igMediaId) {
    try {
      const r = await graphGet(`${igMediaId}/insights?metric=reach,impressions,likes,comments,shares,saved`, token);
      if (r.error) { out.ig = { error: r.error.message }; }
      else {
        const m = {};
        (r.data || []).forEach(({ name, values }) => { m[name] = values?.[0]?.value ?? values ?? 0; });
        out.ig = m;
      }
    } catch (e) { out.ig = { error: e.message }; }
  }
  if (fbVideoId) {
    try {
      const r = await graphGet(`${fbVideoId}?fields=reactions.summary(true),comments.summary(true),views`, token);
      if (r.error) { out.fb = { error: r.error.message }; }
      else { out.fb = { reactions: r.reactions?.summary?.total_count ?? 0, comments: r.comments?.summary?.total_count ?? 0, views: r.views ?? 0 }; }
    } catch (e) { out.fb = { error: e.message }; }
  }
  return json({ ok: true, insights: out });
}

export async function onRequestGet({ request, env }) {
  const url    = new URL(request.url);
  const action = url.searchParams.get("action") || "status";
  const limit  = parseInt(url.searchParams.get("limit") || "12");

  if (action === "status")   return handleStatus(env);
  if (action === "posts")    return handlePosts(env, limit);
  if (action === "insights") return handleInsights(env, { igId: url.searchParams.get("ig_id"), fbId: url.searchParams.get("fb_id") });
  return json({ error: "action inconnue" }, 400);
}

export async function onRequestPost({ request, env }) {
  // 🔒 Écriture publique (publie sur FB/IG, change la photo de profil Page) :
  //    admin (Bearer) OU appel serveur interne (?secret=POSTSTAY_SECRET, ex. agent-drafts).
  //    Sans ça, un tiers pourrait publier du contenu arbitraire sur les réseaux.
  const secret = new URL(request.url).searchParams.get("secret");
  const internalOk = !!secret && !!env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  if (!internalOk) {
    const auth = await verifyBearer(request, env);
    if (!auth.ok) return json({ error: "Non autorisé" }, 401);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "Body JSON invalide" }, 400); }

  if (body.action === "publish") return handlePublish(env, body);
  if (body.action === "publish_reel") return handlePublishReel(env, body);
  if (body.action === "publish_container") return handlePublishContainer(env, body);
  if (body.action === "update-profile-pic") return handleUpdateProfilePic(env, body);
  return json({ error: "action inconnue" }, 400);
}

// ── Update Facebook Page profile picture ──────────────────────────────────────
// Requiert pages_manage_metadata sur le PAGE token.
// Instagram : impossible via API (limitation Meta), faire manuellement via l'app.
async function handleUpdateProfilePic(env, { imageUrl }) {
  const token  = env.META_PAGE_TOKEN;
  const pageId = env.META_PAGE_ID;
  if (!token || !pageId) return json({ error: "Secrets META non configurés" }, 500);
  if (!imageUrl) return json({ error: "imageUrl requis" }, 400);

  try {
    // L'API Meta accepte directement l'URL dans le champ `picture`
    const set = await graphPost(`${pageId}/picture`, token, {
      picture: imageUrl,
    });

    return json({
      ok: !set.error,
      result: set,
      instagram_note: "Instagram doit être mis à jour manuellement via l'app mobile — l'API Meta ne permet pas de changer la photo de profil IG.",
    }, set.error ? 422 : 200);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
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
