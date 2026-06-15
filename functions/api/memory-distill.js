// Cloudflare Pages Function — GET/POST /api/memory-distill
// Agent-mémoire (B2) : distille l'expérience du réseau (notes qualité llm_evals 7j +
// impacts mesurés action_outcomes + signaux transverses) en 3-5 APPRENTISSAGES durables,
// écrits dans agent_memory('_shared', 'learning:N') → injectés dans le prompt de TOUS les
// agents au run suivant (cf. agents-run.js sharedSection). C'est la couche "s'améliorer".
//
// GET /api/memory-distill?secret=POSTSTAY_SECRET   → distille et remplace les learnings
// Auth : ?secret=POSTSTAY_SECRET

import { callLLM } from "./_llm.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

function parseLearnings(text) {
  try {
    const m = String(text).match(/\{[\s\S]*\}/);
    if (!m) return null;
    const o = JSON.parse(m[0]);
    const arr = Array.isArray(o.learnings) ? o.learnings : [];
    return arr.map(x => String(x || "").trim()).filter(x => x.length > 12).slice(0, 5);
  } catch { return null; }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);
  const dry = url.searchParams.get("dry") === "1";
  const weekAgo = Math.floor(Date.now() / 1000) - 7 * 86400;

  await db.prepare(`CREATE TABLE IF NOT EXISTS agent_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT, agent TEXT, key TEXT, value TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()), expires_at INTEGER, UNIQUE(agent, key))`).run().catch(() => {});

  // ── Matière première (lecture seule, fail-soft) ──────────────────────────
  const ctx = { perAgent: [], lowComments: [], impacts: [], signals: [] };
  try {
    const r = await db.prepare(
      `SELECT source, ROUND(AVG(global),1) g, ROUND(AVG(factualite),1) fa, ROUND(AVG(nomenclature),1) no, COUNT(*) n
       FROM llm_evals WHERE created_at > ? GROUP BY source ORDER BY g ASC LIMIT 20`
    ).bind(weekAgo).all();
    ctx.perAgent = (r.results || []).map(x => `${x.source}: global ${x.g}/10 (factualité ${x.fa}, nomenclature ${x.no}) sur ${x.n} sorties`);
  } catch { /* source absente → on continue avec ce qu'on a, fail-soft */ }
  try {
    const r = await db.prepare(
      `SELECT source, commentaire FROM llm_evals WHERE created_at > ? AND global < 7 AND commentaire IS NOT NULL AND length(commentaire) > 5 ORDER BY global ASC LIMIT 15`
    ).bind(weekAgo).all();
    ctx.lowComments = (r.results || []).map(x => `${x.source}: ${x.commentaire}`);
  } catch { /* source absente → on continue avec ce qu'on a, fail-soft */ }
  try {
    const r = await db.prepare(
      `SELECT agent, impact_label FROM action_outcomes WHERE measured_at IS NOT NULL AND impact_label IS NOT NULL ORDER BY measured_at DESC LIMIT 20`
    ).all();
    ctx.impacts = (r.results || []).map(x => `${x.agent}: ${x.impact_label}`);
  } catch { /* source absente → on continue avec ce qu'on a, fail-soft */ }
  try {
    const r = await db.prepare(
      `SELECT value FROM agent_memory WHERE agent='_shared' AND key LIKE 'signal:%' ORDER BY created_at DESC LIMIT 12`
    ).all();
    ctx.signals = (r.results || []).map(x => x.value);
  } catch { /* source absente → on continue avec ce qu'on a, fail-soft */ }

  const haveMatter = ctx.perAgent.length || ctx.lowComments.length || ctx.impacts.length;
  if (!haveMatter) return json({ ok: true, learnings: [], note: "pas assez de matière (llm_evals/outcomes vides) — relancer après quelques runs", ctx });

  // ── Distillation LLM ─────────────────────────────────────────────────────
  const matter = `NOTES QUALITÉ PAR AGENT (7 derniers jours, du pire au meilleur) :
${ctx.perAgent.join("\n") || "—"}

COMMENTAIRES DES SORTIES FAIBLES (ce que le juge a reproché) :
${ctx.lowComments.join("\n") || "—"}

IMPACTS MESURÉS DES ACTIONS PASSÉES (ce qui a marché ou non) :
${ctx.impacts.join("\n") || "—"}

SIGNAUX TRANSVERSES RÉCENTS :
${ctx.signals.join("\n") || "—"}`;

  const r = await callLLM(env, {
    tier: "medium", max_tokens: 600, temperature: 0.3, logSource: "memory-distill",
    messages: [{
      role: "user",
      content: `Tu es l'agent-mémoire du réseau IA d'Amaryllis Locations (conciergerie, 7 logements, Martinique + Nogent).
À partir des données réelles ci-dessous, distille 3 à 5 APPRENTISSAGES DURABLES qui rendront TOUS les agents meilleurs au prochain run.
Règles :
- Chaque apprentissage = 1 phrase ≤ 160 caractères, GÉNÉRALE et actionnable (pas un one-shot, pas un nom de bien isolé).
- Vise les causes récurrentes des notes faibles ET ce qui a prouvé un impact positif.
- Nomenclature à rappeler si elle pèche : SEULS Amaryllis & Iguana = villas.
- Pas de bla-bla, du concret réutilisable.

DONNÉES :
${matter}

Réponds UNIQUEMENT en JSON compact : {"learnings":["...","...","..."]}`,
    }],
  });

  const learnings = r.ok ? parseLearnings(r.text) : null;
  if (!learnings || !learnings.length) {
    return json({ ok: false, error: "distillation LLM KO", provider: r.provider, raw: String(r.text || "").slice(0, 200), ctx_sizes: { perAgent: ctx.perAgent.length, lowComments: ctx.lowComments.length, impacts: ctx.impacts.length } });
  }

  if (dry) return json({ ok: true, dry: true, learnings, provider: r.provider });

  // ── Remplace les learnings (le réseau garde la sagesse FRAÎCHE, pas un historique mort) ──
  let written = 0;
  try {
    await db.prepare("DELETE FROM agent_memory WHERE agent='_shared' AND key LIKE 'learning:%'").run();
    for (let i = 0; i < learnings.length; i++) {
      await db.prepare(`INSERT INTO agent_memory (agent, key, value) VALUES (?,?,?)
        ON CONFLICT(agent, key) DO UPDATE SET value=excluded.value, created_at=unixepoch()`)
        .bind("_shared", `learning:${i + 1}`, learnings[i].slice(0, 240)).run();
      written++;
    }
  } catch (e) { return json({ ok: false, error: "écriture D1 KO: " + e.message, learnings }); }

  return json({ ok: true, written, learnings, provider: r.provider });
}

export const onRequestPost = onRequestGet;
