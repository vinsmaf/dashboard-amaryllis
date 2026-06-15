// Cloudflare Pages Function — GET /api/social-poll?secret=POSTSTAY_SECRET
// Détecteur de leads SANS webhook (marche en mode développement, AUCUN App Review requis) :
// lit les commentaires récents de la Page FB + de l'Instagram via le token de page existant,
// et pour chaque vrai lead « cherche une location en Martinique », l'agent Répondeur Social
// rédige la réponse et te l'envoie en ntfy (prête à coller). Dédup via D1 social_bot_log.
//
// NE poste RIEN (détection + brouillon). L'auto-post public = webhook /api/social-webhook
// (nécessite l'app publiée + App Review). À planifier toutes les ~15-30 min (cron-job.org ou Worker).
//
// Manuel : curl "https://villamaryllis.com/api/social-poll?secret=POSTSTAY_SECRET"

import { processLead } from "./social-webhook.js";

const GV = "v25.0";
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

async function graphGet(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`https://graph.facebook.com/${GV}/${path}${sep}access_token=${token}`);
  return r.json().catch(() => ({}));
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== env.POSTSTAY_SECRET) return json({ error: "unauthorized" }, 401);

  const token = env.META_PAGE_TOKEN;
  const pageId = env.META_PAGE_ID;
  const igId = env.META_IG_ACCOUNT_ID;
  if (!token || !pageId) return json({ error: "META_PAGE_TOKEN / META_PAGE_ID manquant" }, 500);

  const postLimit = Math.min(parseInt(url.searchParams.get("posts") || "8", 10) || 8, 25);
  const comments = [];
  const errors = [];

  // Commentaires Facebook : posts récents de la page (organiques + boostés apparaissent dans le feed).
  try {
    const feed = await graphGet(`${pageId}/feed?fields=permalink_url,comments.limit(30){id,message,from,created_time}&limit=${postLimit}`, token);
    if (feed?.error) errors.push({ source: "fb", error: feed.error.message });
    for (const post of feed?.data || []) {
      for (const cm of post?.comments?.data || []) {
        if (!cm?.message) continue;
        comments.push({ platform: "fb", commentId: String(cm.id), text: cm.message, fromId: cm.from?.id ? String(cm.from.id) : "", permalink: post.permalink_url || "" });
      }
    }
  } catch (e) { errors.push({ source: "fb", error: String(e?.message || e) }); }

  // Commentaires Instagram : médias récents.
  if (igId) {
    try {
      const media = await graphGet(`${igId}/media?fields=permalink,comments.limit(30){id,text,username,from}&limit=${postLimit}`, token);
      if (media?.error) errors.push({ source: "ig", error: media.error.message });
      for (const md of media?.data || []) {
        for (const cm of md?.comments?.data || []) {
          if (!cm?.text) continue;
          // anti-boucle IG : ignorer nos propres commentaires (from.id = notre compte)
          if (cm.from?.id && String(cm.from.id) === String(igId)) continue;
          comments.push({ platform: "ig", commentId: String(cm.id), text: cm.text, fromId: cm.from?.id ? String(cm.from.id) : "", permalink: md.permalink || "" });
        }
      }
    } catch (e) { errors.push({ source: "ig", error: String(e?.message || e) }); }
  }

  // Traite chaque commentaire en SHADOW : dédup + tri LLM + brouillon ntfy. Jamais de post.
  let leads = 0, processed = 0;
  for (const c of comments) {
    const r = await processLead(env, c, { mode: "shadow", source: "poll" }).catch(() => null);
    if (r && !r.skipped) processed++;
    if (r?.lead) leads++;
  }

  return json({ ok: true, scanned: comments.length, processed, leads, errors });
}
