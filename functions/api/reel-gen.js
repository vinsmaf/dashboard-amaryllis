// POST /api/reel-gen — génère un draft reel_post à la demande (même logique que generateReelDraft dans le Worker)
// Body : { bienId, theme, variante }
// Auth : Bearer admin
import { verifyBearer } from "./_adminauth.js";
import { callLLM } from "./_llm.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const BIEN_NAMES = {
  amaryllis: "Villa Amaryllis", iguana: "Villa Iguana",
  zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya",
  schoelcher: "Schœlcher", nogent: "Nogent",
};
const PHOTO_SETS = {
  amaryllis:  ["01.webp","03.webp","05.webp","07.webp","09.webp"],
  iguana:     ["01.webp","02.webp","03.webp","04.webp","05.webp"],
  zandoli:    ["01.webp","02.webp","03.webp","04.webp","05.webp"],
  geko:       ["01.webp","02.webp","03.webp","04.webp","05.webp"],
  mabouya:    ["01.webp","02.webp","03.webp","04.webp","05.webp"],
  schoelcher: ["01.webp","02.webp","03.webp","04.webp","05.webp"],
  nogent:     ["01.webp","02.webp","03.webp","04.webp","05.webp"],
};
const KB_CYCLE = ["in","out","left","in","right"];
const SCORE_THRESHOLD = 75;

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding manquant" }, 503);

  const body    = await request.json().catch(() => ({}));
  const bienId  = body.bienId  || "amaryllis";
  const theme   = body.theme   || "logement";
  const variante = body.variante || "";

  const bienName = BIEN_NAMES[bienId] || bienId;

  // 1. Caption LLM via callLLM (cascade Groq→Mistral→Cerebras) ─────────────
  const captionPrompt = `Tu es le community manager d'Amaryllis Locations (conciergerie Martinique). Rédige un caption Instagram Reel pour "${bienName}", thème "${theme}"${variante ? `, angle "${variante}"` : ""}.

Structure OBLIGATOIRE (5 blocs séparés par \\n\\n) :
1. HOOK (1 ligne sensorielle stop-scroll — pas de question)
2. DESCRIPTION (2-3 lignes immersives, vue/lumière/ambiance)
3. BÉNÉFICE voyageur (1 ligne concrète)
4. CTA : "Réservez sur https://villamaryllis.com/${bienId} ⤴️"
5. HASHTAGS (8-10 hashtags : #martinique #villamaryllis + lieu + ambiance)

VOIX : "vous" formel, sensoriel, jamais pub Meta.
INTERDIT (biens sur les hauteurs) : vagues, clapotis, plage privée, pieds dans l'eau.

Retourne UNIQUEMENT le caption brut.`;

  const captionRes = await callLLM(env, {
    provider: "mistral",
    tier: "fast",
    messages: [{ role: "user", content: captionPrompt }],
    max_tokens: 600,
  });
  if (!captionRes.ok) return json({ error: `LLM erreur: ${captionRes.errors?.[0]?.error || "provider unavailable"}` }, 502);
  const caption = captionRes.text.trim();
  if (!caption) return json({ error: "LLM caption vide" }, 500);

  // 2. Plan déterministe ───────────────────────────────────────────────────
  const photos = PHOTO_SETS[bienId] || PHOTO_SETS.amaryllis;
  const clips  = photos.map((src, i) => ({ src, duration: 3, kenburns: KB_CYCLE[i % KB_CYCLE.length] }));
  const plan   = {
    bienId, title: bienName,
    fps: 30, width: 1080, height: 1920,
    transition: "fade", transitionDuration: 0.5,
    clips, audio: null,
  };

  // 3. Draft reel_post en D1 ───────────────────────────────────────────────
  const siteUrl  = new URL(request.url).origin;
  const videoUrl = `${siteUrl}/videos/reel-${bienId}.mp4`;
  const now = Math.floor(Date.now() / 1000);
  const r   = await db.prepare(`
    INSERT INTO agent_drafts (agent, agent_label, agent_emoji, type, payload, rationale, preview, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).bind(
    "community-manager", "Community Manager", "🎬",
    "reel_post",
    JSON.stringify({ caption, videoUrl, coverUrl: null, channels: ["ig", "fb"], plan, bienId }),
    `Reel ${bienName} — ${theme}${variante ? " / " + variante : ""}`,
    caption.slice(0, 200),
    now, now,
  ).run();

  const draftId = r.meta?.last_row_id;
  if (!draftId) return json({ error: "Insertion D1 échouée" }, 500);

  // 4. Scoring auto ─────────────────────────────────────────────────────────
  let score = null, verdict = "pending", reason = "";
  try {
    const judgePrompt = `Note ce caption Instagram Reel de 0 à 100.
CAPTION : """${caption}"""
Critères : hook stop-scroll(20) · immersion(25) · CTA(15) · hashtags(20) · voix "vous"(10) · pas d'erreurs factuelles(10).
Retourne UNIQUEMENT : {"score":0-100,"verdict":"approve"|"reject","reason":"1 phrase"}`;
    const jRes2 = await callLLM(env, {
      provider: "mistral",
      tier: "fast",
      messages: [{ role: "user", content: judgePrompt }],
      max_tokens: 120,
    });
    let judge = {};
    try { judge = JSON.parse((jRes2.text || "{}").match(/\{[\s\S]*\}/)?.[0] || "{}"); } catch (e) { void e; }
    score   = Math.min(100, Math.max(0, Number(judge.score) || 0));
    verdict = judge.verdict || "reject";
    reason  = judge.reason  || "";

    // Mettre à jour le payload avec les reviews
    await db.prepare("UPDATE agent_drafts SET payload=?, updated_at=? WHERE id=?")
      .bind(
        JSON.stringify({ caption, videoUrl: null, coverUrl: null, channels: ["ig", "fb"], plan, bienId, reviews: { score, verdict, reason } }),
        now, draftId,
      ).run();

    // Auto-approuver si score suffisant
    if (score >= SCORE_THRESHOLD && verdict === "approve") {
      await db.prepare("UPDATE agent_drafts SET status='approved', approved_at=?, updated_at=? WHERE id=?")
        .bind(now, now, draftId).run();
    }
  } catch (e) { void e; }

  return json({ ok: true, id: draftId, score, verdict, reason, bienId, theme });
}
