// Cloudflare Pages Function — /api/editorial-gate
// Gate de qualité d'AUTO-PUBLICATION réseaux. Remplace le clic « Approuver » humain :
// scanne les drafts prêts (editorial_calendar.status='drafted'), applique evaluateGate()
// et, selon le mode, auto-approuve (→ le cron de publication les sort) ou escalade à Vincent.
//
//   mode=live   : un draft qui PASSE les 4 filtres → status 'approved' → publié seul à l'heure prévue.
//   mode=shadow : ne publie RIEN — envoie un ntfy « ce post serait parti seul » (phase de confiance).
//   FAIL (tout mode) : reste en attente + ntfy « à valider : <raison> ».
//
// Sûr par construction : tant que Vincent n'a coché AUCUNE photo (/api/editorial-photos),
// le filtre photo échoue → rien ne part. Kill-switch : EDITORIAL_GATE_DISABLED=1.
//
// GET/POST ?secret=POSTSTAY_SECRET [&dry=1] [&mode=shadow|live] [&limit=N]
// Auth : admin (Bearer) OU secret. Appelé par le Worker après runEditorialDraftGen.

import { verifyBearer } from "./_adminauth.js";
import { loadLearnedLessons } from "./_factcheck.js";
import { evaluateGate } from "./_editorialGate.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

async function notify(env, title, body, priority = "default") {
  const topic = env.NTFY_TOPIC;
  if (!topic) return;
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: { Title: title, Priority: priority, Tags: "newspaper" },
      body,
    });
  } catch { /* best-effort */ }
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  if (env.EDITORIAL_GATE_DISABLED === "1" || env.EDITORIAL_GATE_DISABLED === "true") {
    return json({ ok: true, disabled: true, message: "Gate désactivé (kill-switch)" });
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' introuvable" }, 503);

  const dry = url.searchParams.get("dry") === "1";
  const mode = (url.searchParams.get("mode") || env.EDITORIAL_GATE_MODE || "shadow").toLowerCase();
  const minScore = parseInt(env.EDITORIAL_GATE_MIN_SCORE || "85", 10) || 85;
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 50);
  const now = Math.floor(Date.now() / 1000);

  // Contexte commun (1 lecture chacun)
  const allowedPhotosByBien = {};
  try {
    const { results } = await db.prepare("SELECT bien_id, photo FROM editorial_photos").all();
    for (const r of results || []) (allowedPhotosByBien[r.bien_id] ||= []).push(r.photo);
  } catch { /* table absente = whitelist vide → tout escaladé (sûr) */ }

  const learnedRules = await loadLearnedLessons(db).catch(() => []);

  const recentBienPosts = new Set();
  try {
    const since = now - 7 * 86400;
    const { results } = await db.prepare(
      "SELECT DISTINCT bien_id FROM editorial_calendar WHERE status='published' AND published_at >= ?"
    ).bind(since).all();
    for (const r of results || []) recentBienPosts.add(r.bien_id);
  } catch { /* ignore */ }

  // Drafts prêts à juger : entrées calendrier 'drafted' avec un draft_id
  let entries = [];
  try {
    const { results } = await db.prepare(
      "SELECT id, bien_id, draft_id, scheduled_at FROM editorial_calendar WHERE status='drafted' AND draft_id IS NOT NULL ORDER BY scheduled_at ASC LIMIT ?"
    ).bind(limit).all();
    entries = results || [];
  } catch (e) { return json({ error: e.message }, 500); }

  const out = { ok: true, mode, dry, evaluated: 0, queued_for_publish: 0, would_publish: 0, escalated: 0, skipped: 0, details: [] };

  for (const e of entries) {
    const draft = await db.prepare("SELECT * FROM agent_drafts WHERE id=?").bind(e.draft_id).first();
    if (!draft) { out.skipped++; continue; }

    let payload = {}, reviews = {};
    try { payload = JSON.parse(draft.payload || "{}"); } catch {}
    try { reviews = JSON.parse(draft.reviews || "{}"); } catch {}

    // Idempotence : déjà jugé par le gate → on ne re-notifie pas (sauf dry)
    if (reviews.gate && !dry) { out.skipped++; continue; }

    const verdict = evaluateGate({
      caption: payload.caption,
      imageUrl: payload.imageUrl,
      channels: payload.channels,
      score: reviews.score,
      verdict: reviews.verdict,
      allowedPhotosByBien,
      recentBienPosts,
      learnedRules,
      minScore,
      expectedBien: e.bien_id,
    });
    out.evaluated++;

    const detail = { draft_id: e.draft_id, bien: e.bien_id, pass: verdict.pass, fails: verdict.fails };
    out.details.push(detail);

    if (dry) continue;

    // Marque la décision dans reviews (idempotence + traçabilité)
    reviews.gate = { decision: verdict.pass ? (mode === "live" ? "approved" : "would_publish") : "escalated", mode, at: now, fails: verdict.fails };
    await db.prepare("UPDATE agent_drafts SET reviews=?, updated_at=? WHERE id=?")
      .bind(JSON.stringify(reviews), now, e.draft_id).run().catch(() => {});

    const short = (payload.caption || "").split("\n")[0].slice(0, 80);

    if (verdict.pass && mode === "live") {
      // Auto-approbation → le cron runEditorialAutoPublish publiera à l'heure prévue
      await db.prepare("UPDATE agent_drafts SET status='approved', approved_at=?, updated_at=? WHERE id=?").bind(now, now, e.draft_id).run();
      await db.prepare("UPDATE editorial_calendar SET status='approved', updated_at=? WHERE id=?").bind(now, e.id).run().catch(() => {});
      out.queued_for_publish++;
      await notify(env, `✅ Post auto-approuvé — ${e.bien_id}`, `${short}…\n\nPublication automatique à l'heure prévue.`, "low");
    } else if (verdict.pass) {
      // shadow : aurait publié
      out.would_publish++;
      await notify(env, `👁 SHADOW — aurait publié (${e.bien_id})`, `${short}…\n\nEn mode live, ce post serait parti seul. Vérifie qu'il est bon.`, "low");
    } else {
      // FAIL → escalade à valider à la main
      out.escalated++;
      const why = verdict.fails.map((f) => `• ${f.filter}: ${f.reason}`).join("\n");
      await notify(env, `⚠️ Post à valider — ${e.bien_id}`, `${short}…\n\nNon auto-publié :\n${why}\n\n→ onglet Approbations`, "default");
    }
  }

  return json(out);
}
