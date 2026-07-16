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
import { loadLearnedLessons, factCheckCaption } from "./_factcheck.js";
import { evaluateGate, parsePhotoUrl } from "./_editorialGate.js";
import { callLLM } from "./_llm.js";

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
  const minScore = parseInt(env.EDITORIAL_GATE_MIN_SCORE || "75", 10) || 75;
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 50);
  const now = Math.floor(Date.now() / 1000);

  // Contexte commun (1 lecture chacun)
  const allowedPhotosByBien = {};
  try {
    const { results } = await db.prepare("SELECT bien_id, photo FROM editorial_photos").all();
    for (const r of results || []) (allowedPhotosByBien[r.bien_id] ||= []).push(r.photo);
  } catch { /* table absente = whitelist vide → tout escaladé (sûr) */ }

  const learnedRules = await loadLearnedLessons(db).catch(() => []);

  // Publications récentes (bien_id + published_at) : l'anti-doublon se calcule
  // PAR ENTRÉE, relatif à SON créneau (scheduled_at - 4j), pas à l'heure du run —
  // sinon une entrée à J+2 est bloquée par un post qui aura >4j au moment de partir.
  let recentPubRows = [];
  try {
    const since = now - 10 * 86400;
    const { results } = await db.prepare(
      "SELECT bien_id, published_at FROM editorial_calendar WHERE status='published' AND published_at >= ?"
    ).bind(since).all();
    recentPubRows = results || [];
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
    try { payload = JSON.parse(draft.payload || "{}"); } catch (e1) { console.error("[gate-payload]", e1.message); }
    try { reviews = JSON.parse(draft.reviews || "{}"); } catch (e2) { console.error("[gate-reviews]", e2.message); }

    // Idempotence : ne re-notifie pas si évalué il y a moins de 4h (sauf dry)
    // TTL court (4h) pour permettre la réévaluation quand les règles changent ou qu'un draft stagne.
    const GATE_TTL = 4 * 3600;
    if (reviews.gate && !dry && reviews.gate.at && (now - reviews.gate.at) < GATE_TTL) { out.skipped++; continue; }
    // Décision précédente (avant écrasement) — sert à ne pas re-notifier une escalade identique.
    const prevGate = reviews.gate || null;

    // Pour les reels (reel_post) : pas d'imageUrl unique → dériver de la 1ère clip du plan
    const reelImageUrl = draft.type === "reel_post" && payload.plan?.bienId && payload.plan?.clips?.[0]?.src
      ? `/photos/${payload.plan.bienId}/${payload.plan.clips[0].src}`
      : null;
    // Anti-doublon relatif au créneau de CETTE entrée : biens publiés dans les 4j
    // précédant le moment de publication EFFECTIF (créneau futur = scheduled_at ;
    // créneau passé = rattrapage → publication imminente = maintenant).
    const effectiveAt = Math.max(now, e.scheduled_at || now);
    const recentBienPosts = new Set(
      recentPubRows.filter(r => r.published_at >= effectiveAt - 4 * 86400 && r.published_at <= effectiveAt)
        .map(r => r.bien_id)
    );
    const verdict = evaluateGate({
      caption: payload.caption,
      imageUrl: payload.imageUrl || reelImageUrl,
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

    const short = (payload.caption || "").split("\n")[0].slice(0, 80);

    // ── Boucle de réécriture ───────────────────────────────────────────────────
    // Si le seul blocage est score/verdict (pas doublon / mots_interdits / photo),
    // l'agent réécrit le caption avec les recommandations, puis on re-score.
    // Max 1 tentative (budget CPU CF Pages Function).
    if (!verdict.pass) {
      const blockingFilters = new Set(verdict.fails.map(f => f.filter));
      // Réécriture si blocage = score/verdict/mots_interdits UNIQUEMENT. Les filtres
      // "photo" (image hors whitelist/hallucinée), "forme" (canaux) et "doublon" ne sont
      // PAS réparables par une réécriture de caption → escalade directe.
      // ⚠️ Les noms doivent matcher evaluateGate() (_editorialGate.js) : l'ancien
      // ["missing_photo","channels"] ne matchait jamais → un draft à photo invalide
      // pouvait être auto-approuvé par la boucle de réécriture (incident #151, image
      // hallucinée /images/*.jpg publiée → FB "Invalid parameter").
      const hardBlock = ["doublon", "photo", "forme"].some(f => blockingFilters.has(f));

      if (!hardBlock && !reviews.rewrite_attempted) {
        const failReasons = verdict.fails.map(f => `• ${f.reason}`).join("\n");
        const currentScore = reviews.score ?? 0;
        const forbiddenHints = verdict.fails
          .filter(f => f.filter === "mots_interdits")
          .map(f => f.reason).join("; ");

        const rewritePrompt = `Tu es un expert Instagram & Facebook pour une conciergerie de location saisonnière en Martinique.

Ce caption a obtenu un score de ${currentScore}/100 (seuil requis : ${minScore}/100).${forbiddenHints ? `\n\n⚠️ PHRASES INTERDITES à éliminer absolument : ${forbiddenHints}` : ""}

Caption actuel :
"""
${payload.caption || ""}
"""

Raisons de l'échec :
${failReasons}

Critères de notation (total 100 pts) :
- Hook stop-scroll sensoriel (première ligne accroche) : 20 pts
- Immersion sensorielle (vue, lumière, chaleur, sons, ambiance) : 25 pts
- CTA clair avec URL villamaryllis.com : 15 pts
- Hashtags stratégiques 8-10 (#martinique #locationvacances…) : 20 pts
- Voix formelle "vous" (jamais "tu") : 10 pts
- Aucune erreur factuelle (biens sur les hauteurs, PAS en bord de mer direct) : 10 pts

Réécris ce caption pour atteindre ${minScore}/100 minimum.
Réponds UNIQUEMENT avec le texte du caption réécrit, sans explication ni balises.`;

        try {
          // callLLM (cascade multi-provider) et non /api/ai-summary : ce dernier dépend
          // d'ANTHROPIC_API_KEY, absente en prod → la réécriture échouait SILENCIEUSEMENT
          // depuis toujours (chaque draft imparfait escaladait au lieu de s'auto-réparer).
          const rw = await callLLM(env, {
            tier: "smart", max_tokens: 700, temperature: 0.4, logSource: "editorial-gate:rewrite",
            messages: [{ role: "user", content: rewritePrompt }],
          });
          const newCaption = (rw.text || "").trim();

          if (newCaption && newCaption.length > 80) {
            // Re-score le nouveau caption
            const scorePrompt = `Tu es un expert Instagram. Note ce caption de 0 à 100.
CAPTION :
"""
${newCaption}
"""
Critères (total 100pts) :
- Hook stop-scroll sensoriel : 20pts
- Immersion (vue/lumière/ambiance) : 25pts
- CTA clair avec URL villamaryllis.com : 15pts
- Hashtags stratégiques (8-10) : 20pts
- Voix formelle "vous" respectée : 10pts
- Pas d'erreurs factuelles (biens sur hauteurs, pas bord de mer) : 10pts
Retourne UNIQUEMENT : {"score":0-100,"verdict":"approve"|"reject"|"needs_edits","reason":"1 phrase"}`;

            const sc = await callLLM(env, {
              tier: "smart", max_tokens: 120, temperature: 0.1, logSource: "editorial-gate:rescore",
              messages: [{ role: "user", content: scorePrompt }],
            });
            const scText = sc.text || "{}";
            let newJudge = { score: 0, verdict: "reject", reason: "parse error" };
            try { newJudge = JSON.parse(scText.match(/\{[\s\S]*\}/)?.[0] || "{}"); } catch (parseErr) { console.error("[gate-rescore]", parseErr.message); }

            const newScore = Math.min(100, Math.max(0, Number(newJudge.score) || 0));
            // Le fact-check déterministe (filtre BLOQUANT n°1) doit repasser sur le
            // caption RÉÉCRIT — le juge LLM seul ne suffit pas (exigence Vincent).
            const newFactErrors = factCheckCaption(newCaption, learnedRules, parsePhotoUrl(payload.imageUrl)?.bien || e.bien_id);
            const newPass = newScore >= minScore && newJudge.verdict === "approve" && newFactErrors.length === 0;

            // Stocker le résultat de réécriture dans reviews
            reviews.rewrite_attempted = true;
            reviews.score = newScore;
            reviews.verdict = newJudge.verdict;
            reviews.reason = newJudge.reason;

            if (newPass) {
              // Réécriture réussie → met à jour le payload + approuve
              payload.caption = newCaption;
              reviews.gate = { decision: mode === "live" ? "approved" : "would_publish", mode, at: now, rewritten: true, originalScore: currentScore, newScore };
              await db.prepare("UPDATE agent_drafts SET payload=?, reviews=?, status=?, approved_at=?, updated_at=? WHERE id=?")
                .bind(JSON.stringify(payload), JSON.stringify(reviews), mode === "live" ? "approved" : "pending", mode === "live" ? now : null, now, e.draft_id).run().catch(() => {});
              if (mode === "live") {
                await db.prepare("UPDATE editorial_calendar SET status='approved', updated_at=? WHERE id=?").bind(now, e.id).run().catch(() => {});
                out.queued_for_publish++;
                detail.pass = true;
                detail.rewritten = true;
                detail.newScore = newScore;
                await notify(env, `✅ Post réécrit & approuvé — ${e.bien_id}`, `Score ${currentScore}→${newScore}/100 ✍️\n${newCaption.split("\n")[0].slice(0, 80)}…\n\nPublication automatique à l'heure prévue.`, "low");
              } else {
                out.would_publish++;
                await notify(env, `👁 SHADOW réécrit — ${e.bien_id}`, `Score ${currentScore}→${newScore}/100 ✍️\n${newCaption.split("\n")[0].slice(0, 80)}…`, "low");
              }
              continue;
            }

            // Réécriture insuffisante → on escalade avec le nouveau score
            reviews.gate = { decision: "escalated", mode, at: now, fails: verdict.fails, rewrite_score: newScore };
            await db.prepare("UPDATE agent_drafts SET reviews=?, updated_at=? WHERE id=?")
              .bind(JSON.stringify(reviews), now, e.draft_id).run().catch(() => {});
            out.escalated++;
            const why = verdict.fails.map((f) => `• ${f.filter}: ${f.reason}`).join("\n");
            await notify(env, `⚠️ Post à valider — ${e.bien_id}`, `${short}…\n\nRéécriture tentée : ${currentScore}→${newScore}/100 (seuil ${minScore})\n${why}\n\n→ onglet Approbations`, "high");
            continue;
          }
        } catch (rwErr) {
          console.error("[editorial-gate] rewrite error:", rwErr.message);
        }
      }
    }
    // ── Fin boucle réécriture ──────────────────────────────────────────────────

    // Marque la décision dans reviews (idempotence + traçabilité)
    reviews.gate = { decision: verdict.pass ? (mode === "live" ? "approved" : "would_publish") : "escalated", mode, at: now, fails: verdict.fails };
    await db.prepare("UPDATE agent_drafts SET reviews=?, updated_at=? WHERE id=?")
      .bind(JSON.stringify(reviews), now, e.draft_id).run().catch(() => {});

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
      // FAIL → escalade à valider à la main. Re-notifie seulement si l'escalade a
      // CHANGÉ depuis la dernière évaluation (le gate repasse toutes les 10 min, cf. cron
      // */10 * * * * du Worker — corrigé 2026-07-16, ce commentaire disait "toutes les heures").
      out.escalated++;
      const sameAsBefore = prevGate?.decision === "escalated"
        && JSON.stringify(prevGate.fails || []) === JSON.stringify(verdict.fails);
      if (!sameAsBefore) {
        const why = verdict.fails.map((f) => `• ${f.filter}: ${f.reason}`).join("\n");
        await notify(env, `⚠️ Post à valider — ${e.bien_id}`, `${short}…\n\nNon auto-publié :\n${why}\n\n→ onglet Approbations`, "default");
      }
    }
  }

  return json(out);
}
