// Cloudflare Pages Function — /api/social-webhook
// Bot social Amaryllis : répond AUTOMATIQUEMENT aux commentaires (Facebook Page + pubs, Instagram)
// des gens qui CHERCHENT une location saisonnière en Martinique → petit message d'accueil + lien
// du site (+ DM privé). Réservé À NOS SURFACES (notre page / nos pubs / notre IG) — jamais chez
// les autres (interdit par les CGU Meta + API Groups fermée).
//
// GET  : vérification du webhook Meta (hub.challenge) — à faire une fois à la config.
// POST : événements de commentaire → vérif signature → tri LLM (vrai lead location ?) → réponse.
//
// Secrets (CF Pages → Settings → Environment variables) :
//   META_PAGE_TOKEN              — token Page avec scopes pages_manage_engagement + pages_messaging
//                                  (+ instagram_manage_comments / instagram_manage_messages pour IG)
//   META_PAGE_ID, META_IG_ACCOUNT_ID
//   META_APP_SECRET             — vérifie la signature X-Hub-Signature-256 (déjà présent)
//   SOCIAL_WEBHOOK_VERIFY_TOKEN — chaîne secrète choisie à la config du webhook Meta
//   SOCIAL_BOT_MODE             — "shadow" (DÉFAUT : log + ntfy, ne poste RIEN) | "live" (poste)
//   SOCIAL_BOT_DISABLED         — "1" → kill-switch total (n'écoute plus rien)
//
// Sécurité : dédup (D1 social_bot_log), anti-boucle (jamais répondre à nos propres commentaires),
// tri LLM strict (≥0,7 de confiance), réponses TEMPLATÉES (aucun prix/dispo généré → on renvoie au site).

import { callLLM } from "./_llm.js";

const GV = "v25.0";
const SITE = "https://villamaryllis.com";
const UTM = "?utm_source=facebook&utm_medium=social_bot&utm_campaign=comment_reply";

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });
const text = (t, s = 200) => new Response(t, { status: s, headers: { "Content-Type": "text/plain" } });

// Réponses publiques templatées (variées, jamais de prix/dispo — tout est sur le site).
const REPLIES = {
  fr: [
    `Bonjour 🌴 Nous avons plusieurs locations en Martinique (Sainte-Luce, Schœlcher, Nogent…). Dispos & tarifs en direct ici 👉 ${SITE}${UTM}`,
    `Coucou ! On loue 6 logements en Martinique, piscine / vue mer selon les biens. Tout est sur 👉 ${SITE}${UTM} 🌺`,
  ],
  en: [
    `Hi 🌴 We have several holiday rentals in Martinique. Live availability & rates here 👉 ${SITE}${UTM}`,
  ],
};
// DM privé (1 par commentaire).
const DM = {
  fr: `Bonjour 🌴 Merci pour votre message ! Toutes nos locations en Martinique, avec dispos en temps réel et réservation directe : ${SITE}${UTM} — dites-moi si vous avez des dates précises en tête, je vous oriente avec plaisir 🌺`,
  en: `Hi 🌴 Thanks for reaching out! All our Martinique rentals with live availability & direct booking: ${SITE}${UTM} — happy to help if you have dates in mind.`,
};

async function ntfy(env, title, body, priority = "default") {
  try {
    if (!env.NTFY_TOPIC) return;
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, { method: "POST", headers: { Title: title, Priority: priority, Tags: "robot" }, body });
  } catch { /* fail-silent */ }
}

async function graphPost(path, token, body) {
  const r = await fetch(`https://graph.facebook.com/${GV}/${path}`, { method: "POST", body: new URLSearchParams({ ...body, access_token: token }) });
  return r.json().catch(() => ({}));
}

// Vérifie X-Hub-Signature-256 = HMAC-SHA256(body brut, app secret).
async function verifySignature(rawBody, header, appSecret) {
  if (!header || !appSecret) return false;
  const expected = String(header).replace(/^sha256=/, "");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // comparaison à longueur constante
  if (hex.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// Parse les événements webhook Meta → commentaires normalisés. PUR (testé).
export function extractComments(body) {
  const out = [];
  for (const entry of body?.entry || []) {
    for (const ch of entry?.changes || []) {
      const v = ch?.value || {};
      if (ch?.field === "feed" && v.item === "comment" && v.verb === "add" && v.comment_id) {
        out.push({ platform: "fb", commentId: String(v.comment_id), text: v.message || "", fromId: v.from?.id ? String(v.from.id) : "", postId: v.post_id || "" });
      } else if (ch?.field === "comments" && v.id) { // Instagram
        out.push({ platform: "ig", commentId: String(v.id), text: v.text || "", fromId: v.from?.id ? String(v.from.id) : "" });
      }
    }
  }
  return out;
}

// Décide si on doit répondre. PUR (testé). selfIds = nos propres ids (anti-boucle).
export function decideReply({ lead, confidence, fromId, text: t, selfIds = [] }) {
  if (fromId && selfIds.map(String).includes(String(fromId))) return false; // jamais nous-mêmes
  if (!t || String(t).trim().length < 3) return false;
  return !!lead && Number(confidence) >= 0.7;
}

function pickReply(lang, seedStr) {
  const arr = REPLIES[lang] || REPLIES.fr;
  let seed = 0;
  for (const c of String(seedStr || "")) seed += c.charCodeAt(0);
  return arr[seed % arr.length];
}

// Tri LLM : est-ce une vraie recherche de location en Martinique ?
async function classify(env, msg) {
  try {
    const r = await callLLM(env, {
      tier: "fast",
      logSource: "social-bot",
      max_tokens: 60,
      temperature: 0,
      messages: [
        { role: "system", content: 'Tu classes des commentaires de réseaux sociaux. Réponds en JSON STRICT {"lead":bool,"lang":"fr"|"en","confidence":0..1}. lead=true UNIQUEMENT si la personne CHERCHE une location saisonnière / un logement / un hébergement / un gîte en Martinique, ou demande dispo/prix/réservation pour un séjour là-bas. lead=false pour : spam, insulte, concurrent qui fait sa pub, question SAV d\'un client déjà en séjour, hors-sujet, ou personne qui PROPOSE elle-même un logement. Sois strict, dans le doute lead=false.' },
        { role: "user", content: String(msg).slice(0, 500) },
      ],
    });
    const raw = r?.ok ? (r.text || "") : "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return { lead: false, lang: "fr", confidence: 0 };
    const o = JSON.parse(m[0]);
    return { lead: !!o.lead, lang: o.lang === "en" ? "en" : "fr", confidence: Number(o.confidence) || 0 };
  } catch { return { lead: false, lang: "fr", confidence: 0 }; }
}

async function ensureTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS social_bot_log (
    platform TEXT, comment_id TEXT, from_id TEXT, txt TEXT, lead INTEGER, confidence REAL,
    action TEXT, mode TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (platform, comment_id))`).run();
}

async function handleComment(env, c) {
  const db = env.revenue_manager;
  const mode = (env.SOCIAL_BOT_MODE || "shadow").toLowerCase();
  if (db) {
    await ensureTable(db);
    const seen = await db.prepare("SELECT 1 FROM social_bot_log WHERE platform=? AND comment_id=?").bind(c.platform, c.commentId).first();
    if (seen) return; // déjà traité (dédup)
  }

  const selfIds = [env.META_PAGE_ID, env.META_IG_ACCOUNT_ID].filter(Boolean);
  const cls = await classify(env, c.text);
  const shouldReply = decideReply({ ...cls, fromId: c.fromId, text: c.text, selfIds });

  const log = (action) => db
    ? db.prepare("INSERT OR IGNORE INTO social_bot_log (platform, comment_id, from_id, txt, lead, confidence, action, mode) VALUES (?,?,?,?,?,?,?,?)")
        .bind(c.platform, c.commentId, c.fromId || "", String(c.text || "").slice(0, 300), cls.lead ? 1 : 0, cls.confidence || 0, action, mode).run()
    : Promise.resolve();

  if (!shouldReply) { await log("ignored"); return; }

  const reply = pickReply(cls.lang, c.commentId);

  // SHADOW : ne poste rien, prévient Vincent avec la réponse qu'il AURAIT postée.
  if (mode !== "live") {
    await ntfy(env, "🤖 Bot social (shadow) — lead détecté", `[${c.platform}] « ${String(c.text).slice(0, 140)} »\n→ réponse prête : ${reply}`, "high");
    await log("shadow");
    return;
  }

  // LIVE : répond publiquement (+ DM privé).
  const token = env.META_PAGE_TOKEN;
  let action = "replied", errMsg = "";
  try {
    if (c.platform === "fb") {
      const pub = await graphPost(`${c.commentId}/comments`, token, { message: reply });
      if (pub?.error) { action = "error"; errMsg = pub.error.message || ""; }
      // DM privé (1 autorisé par commentaire) — best-effort, n'échoue pas la réponse publique.
      await graphPost(`${c.commentId}/private_replies`, token, { message: DM[cls.lang] || DM.fr }).catch(() => {});
    } else if (c.platform === "ig") {
      const pub = await graphPost(`${c.commentId}/replies`, token, { message: reply });
      if (pub?.error) { action = "error"; errMsg = pub.error.message || ""; }
      // DM Instagram (private reply au commentaire) — best-effort.
      if (env.META_IG_ACCOUNT_ID) {
        await graphPost(`${env.META_IG_ACCOUNT_ID}/messages`, token, {
          recipient: JSON.stringify({ comment_id: c.commentId }),
          message: JSON.stringify({ text: DM[cls.lang] || DM.fr }),
        }).catch(() => {});
      }
    }
  } catch (e) { action = "error"; errMsg = String(e?.message || e); }

  await ntfy(env, action === "error" ? "🤖 Bot social — ERREUR réponse" : "🤖 Bot social — réponse postée",
    `[${c.platform}] « ${String(c.text).slice(0, 120) }»${errMsg ? "\n⚠️ " + errMsg : ""}`, action === "error" ? "high" : "default");
  await log(action);
}

// ── Webhook ──────────────────────────────────────────────────────────────────
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get("hub.mode") === "subscribe" &&
      url.searchParams.get("hub.verify_token") &&
      url.searchParams.get("hub.verify_token") === env.SOCIAL_WEBHOOK_VERIFY_TOKEN) {
    return text(url.searchParams.get("hub.challenge") || "");
  }
  return json({ error: "verification failed" }, 403);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (env.SOCIAL_BOT_DISABLED === "1") return json({ ok: true, disabled: true });

  const raw = await request.text();
  if (!(await verifySignature(raw, request.headers.get("X-Hub-Signature-256"), env.META_APP_SECRET))) {
    return json({ error: "bad signature" }, 401);
  }
  let body; try { body = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400); }

  const comments = extractComments(body);
  // On répond 200 tout de suite (Meta rejoue si non-200) ; traitement en tâche de fond.
  context.waitUntil(Promise.all(comments.map((c) => handleComment(env, c).catch(() => {}))));
  return json({ ok: true, received: comments.length });
}
