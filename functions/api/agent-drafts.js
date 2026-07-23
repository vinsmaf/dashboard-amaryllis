import { resendFrom } from "./_email.js";
// Cloudflare Pages Function — /api/agent-drafts
// Système de brouillons générés par les agents IA, en attente d'approbation humaine
// GET   ?status=pending|approved|... → liste les drafts
// POST  → créer un draft (appelé par les agents)
// PATCH ?id=N&action=approve|reject|publish → modifier le statut + exécuter
// D1 binding : revenue_manager

import { verifyBearer } from "./_adminauth.js";
import { factCheckCaption, loadLearnedLessons } from "./_factcheck.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const DDL = `
CREATE TABLE IF NOT EXISTS agent_drafts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  agent       TEXT NOT NULL,
  agent_label TEXT,
  agent_emoji TEXT,
  type        TEXT NOT NULL,
  payload     TEXT NOT NULL,
  rationale   TEXT,
  preview     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  result      TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  approved_at INTEGER,
  published_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON agent_drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_agent  ON agent_drafts(agent);
CREATE INDEX IF NOT EXISTS idx_drafts_type   ON agent_drafts(type);
`;

async function ensureTable(db) {
  try { for (const s of DDL.split(";").filter(Boolean)) await db.prepare(s).run(); } catch (ddlErr) { console.error("[agent-drafts] DDL:", ddlErr.message); }
}

// ── Exécuteurs de drafts par type ─────────────────────────────────────────────
async function executeDraft(env, draft) {
  const payload = JSON.parse(draft.payload);

  if (draft.type === "social_post") {
    // 🛡️ Garde-fou fact-check de DERNIÈRE MINUTE (défense en profondeur) : toute publication
    // passe ici — y compris les drafts approuvés à la main avant le gate, et le « Publier maintenant ».
    // Un caption qui matche une règle factuelle ou un mot banni → publication REFUSÉE.
    try {
      const learned = await loadLearnedLessons(env.revenue_manager).catch(() => []);
      const bienId = (payload.imageUrl || "").match(/\/photos\/([a-z]+)\//i)?.[1]?.toLowerCase() || null;
      const factErrors = factCheckCaption(payload.caption || "", learned, bienId);
      if (factErrors.length) {
        return { ok: false, error: "fact-check: " + factErrors.map((e) => e.reason).slice(0, 3).join(" · "), factErrors, blocked: true };
      }
    } catch { /* en cas d'erreur du fact-check, on ne bloque pas (fail-open) */ }

    // Délègue à /api/social (publication multi-channels FB + IG)
    const channels = Array.isArray(payload.channels) && payload.channels.length
      ? payload.channels
      : ["fb", "ig"];

    const origin = new URL(env.PAGES_URL || "https://dashboard-amaryllis.pages.dev").origin;
    const siteOrigin = "https://villamaryllis.com";
    // Normalise imageUrl : chemin relatif → URL absolue villamaryllis.com
    const rawImageUrl = payload.imageUrl || null;
    let imageUrl = rawImageUrl
      ? (rawImageUrl.startsWith("http") ? rawImageUrl : `${siteOrigin}${rawImageUrl.startsWith("/") ? "" : "/"}${rawImageUrl}`)
      : null;
    // 🛡️ Garde image de DERNIÈRE MINUTE : une URL hallucinée (ex. /images/xxx.jpg) renvoie
    // 200 mais en text/html (fallback SPA de CF Pages) → Graph API rejette avec un message
    // opaque (FB "Invalid parameter", IG "image format not supported" — incident entry #151).
    // On vérifie le Content-Type réel ; si invalide → fallback photo planifiée du calendrier.
    if (imageUrl) {
      const isRealImage = async (u) => {
        try {
          const res = await fetch(u, { method: "HEAD" });
          return res.ok && (res.headers.get("content-type") || "").startsWith("image/");
        } catch { return false; }
      };
      if (!(await isRealImage(imageUrl))) {
        let fallback = null;
        try {
          const row = await env.revenue_manager?.prepare(
            "SELECT photo_url, bien_id FROM editorial_calendar WHERE draft_id=?"
          ).bind(draft.id).first();
          // La photo_url planifiée est parfois cross-bien (bug d'anciens seeds, ex. entry
          // schoelcher → photo zandoli) : n'accepter le fallback que s'il montre LE bon bien.
          if (row?.photo_url && row?.bien_id && row.photo_url.includes(`/photos/${row.bien_id}/`)) {
            fallback = row.photo_url;
          }
        } catch { /* pas d'entrée calendrier liée */ }
        if (fallback && await isRealImage(fallback)) {
          console.warn(`[executeDraft] imageUrl invalide (${imageUrl}) → fallback photo planifiée ${fallback}`);
          imageUrl = fallback;
        } else {
          return { ok: false, error: `image invalide : ${imageUrl} ne sert pas une image (Content-Type non image/*)`, blocked: true };
        }
      }
    }
    // /api/social POST est gaté (verifyBearer OU ?secret=) → appel interne signé par le secret partagé
    const r = await fetch(`${origin}/api/social?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "publish",
        caption: payload.caption,
        imageUrl,
        channels,
        firstComment: payload.firstComment,
      }),
    });
    const data = await r.json();
    if (!data.ok) {
      return { ok: false, error: "Aucune publication réussie", results: data.results };
    }
    return { ok: true, results: data.results };
  }

  if (draft.type === "price_change") {
    // payload: { property_id, date, price, reason }
    // Appel interne → authentifié via secret partagé (rm-overrides est admin-only).
    const ovrUrl = `${new URL(env.PAGES_URL || "https://villamaryllis.com").origin}/api/rm-overrides`
      + (env.POSTSTAY_SECRET ? `?secret=${encodeURIComponent(env.POSTSTAY_SECRET)}` : "");
    const r = await fetch(ovrUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return r.ok ? { ok: true } : { ok: false, error: `HTTP ${r.status}` };
  }

  if (draft.type === "email_campaign") {
    // payload: { to, subject, html }
    const resend = env.RESEND_API_KEY;
    if (!resend) return { ok: false, error: "RESEND_API_KEY non configuré" };
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: resendFrom(env),
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });
    const data = await r.json();
    return r.ok ? { ok: true, id: data.id } : { ok: false, error: data.message };
  }

  if (draft.type === "reel_post") {
    // payload: { caption, videoUrl, coverUrl, channels, igContainerId? }
    if (!payload.videoUrl) return { ok: false, error: "videoUrl manquant — rendre la vidéo d'abord" };
    const channels = Array.isArray(payload.channels) && payload.channels.length
      ? [...payload.channels]
      : ["ig", "fb"];
    // YouTube Shorts : OPT-IN explicite (YOUTUBE_AUTOPUBLISH=1). Sans ce flag, activer YouTube
    // ferait publier en silence sur un nouveau canal public à chaque Reel — exactement le type
    // d'élargissement qu'on ne fait jamais par défaut. Le MP4 vertical est déjà compatible Short.
    const ytOn = env.YOUTUBE_AUTOPUBLISH === "1" || env.YOUTUBE_AUTOPUBLISH === "true";
    if (ytOn && !channels.includes("yt") && !channels.includes("youtube")) channels.push("yt");
    const origin = new URL(env.PAGES_URL || "https://dashboard-amaryllis.pages.dev").origin;
    const r = await fetch(`${origin}/api/social?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "publish_reel",
        caption: payload.caption,
        videoUrl: payload.videoUrl,
        coverUrl: payload.coverUrl || null,
        channels,
        igContainerId: payload.igContainerId || null,
      }),
    });
    const data = await r.json();
    const hasSuccess = data.ok || Object.values(data.results || {}).some(r => r.ok);
    // Si IG a renvoyé un container_id (encodage en cours), le propager pour persistence
    if (data.results?.ig?.container_id) return { ok: hasSuccess, results: data.results, igContainerId: data.results.ig.container_id };
    return hasSuccess ? { ok: true, results: data.results } : { ok: false, error: data.error || "Aucune publication reel réussie", results: data.results };
  }

  return { ok: false, error: `Type "${draft.type}" non supporté` };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  // sec : drafts + publish réseaux → admin (Bearer) OU secret partagé (cron Worker).
  const _u = new URL(request.url);
  const _secretOk = env.POSTSTAY_SECRET && _u.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: _adminOk } = await verifyBearer(request, env);
  if (!_secretOk && !_adminOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  await ensureTable(db);

  const url = new URL(request.url);
  const now = Math.floor(Date.now() / 1000);

  // ── GET — liste les drafts ────────────────────────────────────────────────
  if (request.method === "GET") {
    const status = url.searchParams.get("status");
    const agent  = url.searchParams.get("agent");
    const limit  = parseInt(url.searchParams.get("limit") || "50");

    let q = "SELECT * FROM agent_drafts WHERE 1=1";
    const params = [];
    if (status) { q += " AND status = ?"; params.push(status); }
    if (agent)  { q += " AND agent = ?";  params.push(agent); }
    q += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    try {
      const { results } = await db.prepare(q).bind(...params).all();
      return json({ drafts: results || [], total: (results || []).length });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── POST — créer un draft ────────────────────────────────────────────────
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { agent, agent_label, agent_emoji, type, payload, rationale, preview } = body;
    if (!agent || !type || !payload) return json({ error: "agent, type, payload requis" }, 400);

    try {
      const r = await db.prepare(`
        INSERT INTO agent_drafts (agent, agent_label, agent_emoji, type, payload, rationale, preview, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).bind(
        agent, agent_label || agent, agent_emoji || "🤖",
        type, JSON.stringify(payload), rationale || null, preview || null,
        now, now
      ).run();
      return json({ ok: true, id: r.meta?.last_row_id });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── PATCH — approuver / rejeter / publier ─────────────────────────────────
  if (request.method === "PATCH") {
    const id     = parseInt(url.searchParams.get("id"));
    const action = url.searchParams.get("action");
    if (!id || !action) return json({ error: "id + action requis" }, 400);

    const draft = await db.prepare("SELECT * FROM agent_drafts WHERE id = ?").bind(id).first();
    if (!draft) return json({ error: "Draft introuvable" }, 404);

    if (action === "reject") {
      await db.prepare("UPDATE agent_drafts SET status='rejected', updated_at=? WHERE id=?").bind(now, id).run();
      // Si lié à une entrée du calendrier éditorial → reset à 'planned' pour permettre regen
      await db.prepare("UPDATE editorial_calendar SET status='planned', draft_id=NULL, updated_at=? WHERE draft_id=?")
        .bind(now, id).run().catch(() => {});
      return json({ ok: true, status: "rejected" });
    }

    if (action === "approve") {
      await db.prepare("UPDATE agent_drafts SET status='approved', approved_at=?, updated_at=? WHERE id=?").bind(now, now, id).run();
      // Propage le statut approved au calendrier (pour cron de publication auto)
      await db.prepare("UPDATE editorial_calendar SET status='approved', updated_at=? WHERE draft_id=?")
        .bind(now, id).run().catch(() => {});
      return json({ ok: true, status: "approved" });
    }

    if (action === "publish") {
      // Guard anti-doublon : un draft déjà publié ne peut pas être republié
      if (draft.published_at) {
        return json({ ok: false, error: "Déjà publié", published_at: draft.published_at });
      }
      // Exécute la publication réelle
      const result = await executeDraft(env, draft);

      // IG async : si un container_id est renvoyé (encodage en cours), sauvegarder dans le payload
      // et garder le draft en 'approved' pour que le prochain cron reprenne automatiquement
      if (result.igContainerId && !result.ok) {
        const updatedPayload = { ...JSON.parse(draft.payload), igContainerId: result.igContainerId };
        await db.prepare("UPDATE agent_drafts SET payload=?, result=?, updated_at=? WHERE id=?")
          .bind(JSON.stringify(updatedPayload), JSON.stringify(result), now, id).run();
        await db.prepare("UPDATE editorial_calendar SET result=?, updated_at=? WHERE draft_id=?")
          .bind(JSON.stringify(result), now, id).run().catch(() => {});
        return json({ ok: false, status: "approved", retry: true, igContainerId: result.igContainerId });
      }

      const newStatus = result.ok ? "published" : "failed";
      await db.prepare(`
        UPDATE agent_drafts SET status=?, result=?, published_at=?, updated_at=?
        WHERE id=?
      `).bind(newStatus, JSON.stringify(result), result.ok ? now : null, now, id).run();
      // Propage au calendrier
      await db.prepare("UPDATE editorial_calendar SET status=?, published_at=?, result=?, updated_at=? WHERE draft_id=?")
        .bind(newStatus, result.ok ? now : null, JSON.stringify(result), now, id).run().catch(() => {});
      return json({ ok: result.ok, status: newStatus, result });
    }

    if (action === "edit") {
      // Permet de modifier le payload avant publication.
      // reset_gate=true : efface reviews.gate (force une re-évaluation au prochain passage du gate).
      const body = await request.json().catch(() => ({}));
      if (!body.payload && !body.reset_gate) return json({ error: "payload ou reset_gate requis" }, 400);
      if (body.payload) {
        await db.prepare("UPDATE agent_drafts SET payload=?, updated_at=? WHERE id=?")
          .bind(JSON.stringify(body.payload), now, id).run();
      }
      if (body.reset_gate) {
        let reviews = {};
        try { reviews = JSON.parse(draft.reviews || "{}"); } catch {}
        delete reviews.gate;
        delete reviews.rewrite_attempted;
        await db.prepare("UPDATE agent_drafts SET reviews=?, updated_at=? WHERE id=?")
          .bind(JSON.stringify(reviews), now, id).run();
      }
      return json({ ok: true });
    }

    // ── action=improve : régénère un caption amélioré en intégrant les
    //    conseils des agents reviewers (traffic-manager + seo-writer)
    //    + corrige les erreurs détectées par le fact-checker
    if (action === "improve") {
      if (draft.type !== "social_post") return json({ error: "Only social_post drafts can be improved" }, 400);

      const payload = JSON.parse(draft.payload);
      let reviews = {};
      try { reviews = JSON.parse(draft.reviews || "{}"); } catch (rErr) { console.error("[agent-drafts] reviews parse:", rErr.message); }

      const currentCaption = payload.caption || "";
      const trafficFb = reviews.traffic_manager?.feedback || "";
      const seoFb     = reviews.seo_writer?.feedback || "";
      const currentScore = reviews.score || 0;
      const factErrors = reviews.fact_check?.errors || [];
      const factErrorsList = factErrors.length
        ? factErrors.map(e => `  - "${e.phrase}" → ${e.reason}`).join("\n")
        : "(aucune)";

      // Appel LLM avec prompt d'amélioration ciblée
      const { callLLM } = await import("./_llm.js");
      const improvePrompt = `Tu es un éditeur expert qui réécrit un caption Instagram/Facebook pour Amaryllis Locations en intégrant les retours d'experts.

CAPTION ACTUELLE (score ${currentScore}/100) :
"""
${currentCaption}
"""

RETOURS DES EXPERTS :
📈 Traffic Manager : ${trafficFb || "(aucun)"}
✍️ SEO Writer : ${seoFb || "(aucun)"}

🚨 ERREURS FACTUELLES À CORRIGER IMPÉRATIVEMENT :
${factErrorsList}

🎯 MISSION : Réécris cette caption pour viser 100/100 en intégrant chaque retour ET en corrigeant TOUTES les erreurs factuelles ci-dessus.
Conserve :
  - La structure 5 blocs (hook, description sensorielle, bénéfice, CTA, hashtags)
  - L'URL exacte du CTA : ${payload.imageUrl?.match(/photos\/([a-z]+)/)?.[1] ? `https://villamaryllis.com/${payload.imageUrl.match(/photos\/([a-z]+)/)[1]}` : "URL existante"}
  - La voix Amaryllis : "vous" formel, sensoriel, jamais pub Meta Ads

Améliore :
  - Hook plus stop-scroll (sensoriel + court)
  - Description plus immersive (vue/son/parfum/lumière)
  - Bénéfice plus concret pour le voyageur
  - 8-12 hashtags stratégiques (marque + lieu + audience)

🚫 INTERDIT (les biens MQ sont sur les hauteurs, PAS bord de mer) :
  - "clapotis des vagues", "bruit/chant des vagues", "pieds dans l'eau"
  - "plage privée", "à Xm de la plage", "lagon devant"
  - "vagues qui chantent/caressent", "écume", "ressac"

Retourne UNIQUEMENT un JSON :
{
  "improved_blocks": {
    "hook": "...",
    "description": "...",
    "benefice": "...",
    "cta": "Réservez sur https://villamaryllis.com/{bienId} ⤴️",
    "hashtags": "#... #... (8-12 hashtags séparés par espace)"
  },
  "score_estimated": 0-100,
  "what_changed": "1-2 phrases sur les améliorations apportées"
}`;

      const llmResult = await callLLM(env, {
        provider: "mistral",
        tier: "smart",
        max_tokens: 1500,
        temperature: 0.4,
        responseFormat: { type: "json_object" },
        messages: [{ role: "user", content: improvePrompt }],
      });

      if (!llmResult.ok) return json({ error: "LLM amélioration échoué", details: llmResult.errors }, 500);

      let parsed;
      try {
        parsed = JSON.parse(llmResult.text);
      } catch {
        const match = llmResult.text.match(/\{[\s\S]*\}/);
        if (!match) return json({ error: "Parse JSON échoué", raw: String(llmResult.text ?? "").slice(0, 200) }, 500);
        try { parsed = JSON.parse(match[0]); } catch { return json({ error: "JSON invalide" }, 500); }
      }

      const b = parsed.improved_blocks;
      if (!b) return json({ error: "improved_blocks manquant" }, 500);

      const newCaption = [b.hook, b.description, b.benefice, b.cta, b.hashtags]
        .filter(x => x && typeof x === "string" && x.trim())
        .map(x => x.trim())
        .join("\n\n");

      // Update payload
      payload.caption = newCaption;

      // ── Re-fact-check après amélioration ────────────────────────────────
      const { factCheckCaption, loadLearnedLessons } = await import("./_factcheck.js");
      const learned = await loadLearnedLessons(db);
      const newFactErrors = factCheckCaption(newCaption, learned);

      reviews.previous_score = currentScore;
      reviews.score_after_improve = parsed.score_estimated || null;
      reviews.improvement_notes = parsed.what_changed || null;
      reviews.fact_check = newFactErrors.length
        ? { passed: false, errors: newFactErrors }
        : { passed: true };

      await db.prepare(`
        UPDATE agent_drafts SET payload = ?, reviews = ?, updated_at = ? WHERE id = ?
      `).bind(JSON.stringify(payload), JSON.stringify(reviews), now, id).run();

      return json({
        ok: true,
        previous_score: currentScore,
        new_score: parsed.score_estimated,
        what_changed: parsed.what_changed,
        fact_check_passed: newFactErrors.length === 0,
        fact_check_errors: newFactErrors,
      });
    }

    return json({ error: `action "${action}" inconnue` }, 400);
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (request.method === "DELETE") {
    const id = parseInt(url.searchParams.get("id"));
    if (!id) return json({ error: "id requis" }, 400);
    await db.prepare("DELETE FROM agent_drafts WHERE id=?").bind(id).run();
    // Reset calendrier éditorial si entrée liée → permet de regénérer
    await db.prepare("UPDATE editorial_calendar SET status='planned', draft_id=NULL, updated_at=? WHERE draft_id=?")
      .bind(now, id).run().catch(() => {});
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
}
