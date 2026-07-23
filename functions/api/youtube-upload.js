// POST /api/youtube-upload — Social Growth Manager : publie une vidéo (Short) sur YouTube.
//
// Réutilise 100% de l'infra existante : OAuth Google multi-provider (_googleOAuth.js, provider
// "youtube", scope youtube.upload) + le rendu MP4 vertical déjà produit pour les Reels FB/IG
// (même fichier = compatible YouTube Shorts : vertical, ≤ 3 min → classé Short automatiquement).
//
// Ne publie JAMAIS tout seul : appelé explicitement (bouton admin) ou, plus tard, par le pipeline
// éditorial APRÈS le gate qualité — jamais en auto-publish direct.
//
// Body : { videoUrl (MP4 requis), title, description?, tags?[] }
// Auth : Bearer admin ou ?secret=POSTSTAY_SECRET. Kill-switch : YOUTUBE_UPLOAD_DISABLED=1.
//
// Étapes (upload resumable YouTube Data API v3) :
//   1. POST métadonnées → récupère l'URL d'upload (header Location)
//   2. fetch du MP4 (R2/URL) → PUT des octets vers l'URL d'upload → { id }

import { verifyBearer } from "./_adminauth.js";
import { getValidAccessToken } from "./_googleOAuth.js";

const json = (d, s = 200) =>
  new Response(JSON.stringify(d, null, 2), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

// Catégorie 19 = "Travel & Events" (la plus pertinente pour de la location saisonnière).
const CATEGORY_TRAVEL = "19";

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: bearerOk } = await verifyBearer(request, env);
  if (!secretOk && !bearerOk) return json({ error: "Non autorisé" }, 401);

  if (env.YOUTUBE_UPLOAD_DISABLED === "1" || env.YOUTUBE_UPLOAD_DISABLED === "true") {
    return json({ ok: true, disabled: true, note: "YOUTUBE_UPLOAD_DISABLED actif — rien publié" });
  }

  const db = env.revenue_manager;
  const body = await request.json().catch(() => ({}));
  const videoUrl = String(body.videoUrl || "").trim();
  const title = String(body.title || "").trim().slice(0, 100) || "Amaryllis Locations";
  const description = String(body.description || "").trim().slice(0, 4900);
  const tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === "string").slice(0, 15) : [];

  if (!/^https?:\/\//.test(videoUrl)) return json({ error: "videoUrl (MP4 http/https) requis" }, 400);

  // 1. Access token YouTube (lève une erreur explicite si la chaîne n'est pas connectée).
  let accessToken;
  try {
    accessToken = await getValidAccessToken(env, db, "youtube");
  } catch (e) {
    return json({ error: String(e.message || e), hint: "Connecter YouTube dans l'admin (onglet Croissance audience)" }, 409);
  }

  // 2. Récupère le MP4 (R2 / URL publique).
  const vid = await fetch(videoUrl);
  if (!vid.ok) return json({ error: `MP4 introuvable (${vid.status}) : ${videoUrl}` }, 502);
  const bytes = await vid.arrayBuffer();
  if (!bytes.byteLength) return json({ error: "MP4 vide" }, 502);

  const metadata = {
    snippet: {
      title,
      description: description || title,
      tags: tags.length ? tags : ["Martinique", "location", "villa", "Amaryllis"],
      categoryId: CATEGORY_TRAVEL,
    },
    status: {
      privacyStatus: "public",
      selfDeclaredMadeForKids: false, // obligatoire depuis COPPA
    },
  };

  // 3. Upload resumable — étape A : initier, récupérer l'URL d'upload.
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/*",
        "X-Upload-Content-Length": String(bytes.byteLength),
      },
      body: JSON.stringify(metadata),
    },
  );
  if (!initRes.ok) {
    const err = await initRes.text().catch(() => "");
    return json({ error: `Init upload YouTube échoué (${initRes.status})`, detail: err.slice(0, 400) }, 502);
  }
  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) return json({ error: "YouTube n'a pas renvoyé d'URL d'upload (Location)" }, 502);

  // Étape B : envoyer les octets de la vidéo.
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/*", "Content-Length": String(bytes.byteLength) },
    body: bytes,
  });
  const result = await putRes.json().catch(() => ({}));
  if (!putRes.ok || !result.id) {
    return json({ error: `Upload YouTube échoué (${putRes.status})`, detail: JSON.stringify(result).slice(0, 400) }, 502);
  }

  return json({
    ok: true,
    videoId: result.id,
    url: `https://www.youtube.com/watch?v=${result.id}`,
    title: result.snippet?.title || title,
  });
}
