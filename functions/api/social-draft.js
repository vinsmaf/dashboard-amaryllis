// Cloudflare Pages Function — POST /api/social-draft?secret=POSTSTAY_SECRET
// Reçoit un texte libre (un post de groupe Facebook capté par la veille locale group-watch.mjs)
// et renvoie le verdict de l'agent Répondeur Social : { lead, confidence, lang, reply? }.
// Garde la voix de l'agent en UN seul endroit (serveur) ; le script local reste un simple lecteur.

import { draftReply } from "./social-webhook.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== env.POSTSTAY_SECRET) return json({ error: "unauthorized" }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }
  const txt = String(body?.text || "").trim().slice(0, 1000);
  if (txt.length < 3) return json({ lead: false });
  try {
    return json(await draftReply(env, txt));
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
}
