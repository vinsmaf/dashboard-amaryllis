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

// GET ?status=1 — vérifie UNIQUEMENT que la chaîne est connectée (lecture seule).
// Existe pour ne plus jamais avoir à "sonder" la connexion en déclenchant le chemin d'upload
// (incident YOUTUBE-001 du 2026-07-23 : un probe avec une URL bidon a publié une vraie vidéo).
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: bearerOk } = await verifyBearer(request, env);
  if (!secretOk && !bearerOk) return json({ error: "Non autorisé" }, 401);

  // `capabilities` = marqueur de VERSION déployée. Vérifier un déploiement en attendant une
  // réponse générique ne prouve RIEN : le même endpoint existait avant le changement, donc le
  // check passe sur l'ANCIENNE build (vécu 2026-07-23 : upload testé sur la version d'avant le
  // défaut "privé" → vidéo publiée en public). Toujours attendre la capacité NOUVELLE, pas une
  // réponse 200. Ajouter ici un identifiant à chaque évolution du contrat de cet endpoint.
  const capabilities = ["status", "privacyStatus", "mp4-validation", "delete", "autopublish-flag"];
  // État d'activation de l'auto-publication YouTube, LISIBLE sans effet de bord : permet de
  // vérifier que le secret YOUTUBE_AUTOPUBLISH est bien pris en compte sans publier de vidéo.
  const autopublish = env.YOUTUBE_AUTOPUBLISH === "1" || env.YOUTUBE_AUTOPUBLISH === "true";

  try {
    await getValidAccessToken(env, env.revenue_manager, "youtube");
    return json({ ok: true, connected: true, autopublish, capabilities });
  } catch (e) {
    return json({ ok: true, connected: false, autopublish, capabilities, reason: String(e.message || e) });
  }
}

// DELETE ?videoId=xxx — supprime une vidéo de la chaîne (réparation d'une publication erronée).
// Nécessite le scope youtube.force-ssl : un token obtenu AVANT l'ajout de ce scope (donc avec
// youtube.upload seul, insert-only) renverra 403 — il faut alors recliquer "Connecter YouTube".
export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: bearerOk } = await verifyBearer(request, env);
  if (!secretOk && !bearerOk) return json({ error: "Non autorisé" }, 401);

  const videoId = String(url.searchParams.get("videoId") || "").trim();
  if (!videoId) return json({ error: "videoId requis" }, 400);

  let accessToken;
  try {
    accessToken = await getValidAccessToken(env, env.revenue_manager, "youtube");
  } catch (e) {
    return json({ error: String(e.message || e) }, 409);
  }

  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 204) return json({ ok: true, deleted: videoId });

  const detail = await res.text().catch(() => "");
  return json({
    ok: false,
    status: res.status,
    error: res.status === 403
      ? "Scope insuffisant : le token actuel est insert-only (youtube.upload). Recliquer « Connecter YouTube » pour accorder la suppression."
      : `Suppression refusée (${res.status})`,
    detail: detail.slice(0, 400),
  }, res.status === 403 ? 403 : 502);
}

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
  // ⚠️ GARDE-FOU CRITIQUE (incident 2026-07-23) : une URL inexistante sur villamaryllis.com ne
  // renvoie PAS 404 — le site est une SPA, le fallback sert index.html en 200. Sans vérifier le
  // Content-Type, on envoie du HTML à YouTube… qui l'accepte et publie une vidéo corrompue
  // PUBLIQUE sur la chaîne. `res.ok` ne suffit donc JAMAIS : il faut valider le type réel.
  const vid = await fetch(videoUrl);
  if (!vid.ok) return json({ error: `MP4 introuvable (${vid.status}) : ${videoUrl}` }, 502);

  const ctype = (vid.headers.get("content-type") || "").toLowerCase();
  if (!ctype.startsWith("video/") && ctype !== "application/octet-stream") {
    return json({
      error: "La ressource n'est pas une vidéo — upload refusé",
      detail: `Content-Type reçu : "${ctype || "(absent)"}" pour ${videoUrl}. Une URL inexistante sur une SPA renvoie du HTML en 200.`,
    }, 422);
  }

  const bytes = await vid.arrayBuffer();
  if (!bytes.byteLength) return json({ error: "MP4 vide" }, 502);
  // Un vrai MP4 fait au minimum quelques dizaines de Ko — en dessous, c'est une page d'erreur.
  if (bytes.byteLength < 50_000) {
    return json({ error: `Fichier trop petit pour une vidéo (${bytes.byteLength} octets) — upload refusé` }, 422);
  }
  // Signature MP4 : les boîtes ISO-BMFF ont "ftyp" aux octets 4..8.
  const head = new Uint8Array(bytes.slice(0, 12));
  const ftyp = String.fromCharCode(head[4], head[5], head[6], head[7]);
  if (ftyp !== "ftyp") {
    return json({ error: "Le fichier n'a pas une signature MP4 valide (boîte 'ftyp' absente) — upload refusé" }, 422);
  }

  const metadata = {
    snippet: {
      title,
      description: description || title,
      tags: tags.length ? tags : ["Martinique", "location", "villa", "Amaryllis"],
      categoryId: CATEGORY_TRAVEL,
    },
    status: {
      // DÉFAUT PRUDENT : "private". Publier publiquement doit être un choix EXPLICITE de l'appelant
      // (le pipeline éditorial passe "public" après le gate qualité) — même doctrine que
      // CONCIERGE_MODE=shadow / AD_AGENT_MODE=shadow. Un appel nu ne peut pas exposer la chaîne.
      privacyStatus: ["public", "unlisted", "private"].includes(body.privacyStatus) ? body.privacyStatus : "private",
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
