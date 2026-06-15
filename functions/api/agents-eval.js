// Cloudflare Pages Function — GET/POST /api/agents-eval
// #4 Harness d'évaluation : un LLM-juge note les sorties d'agents récentes
// (llm_outputs) sur 4 axes → table llm_evals. Permet l'A/B MESURÉ des modèles/prompts
// (croiser avec /api/agents-stats qualite_7j).
//
// GET  /api/agents-eval?secret=...&limit=8   → évalue les N dernières sorties non notées
// Auth : ?secret=POSTSTAY_SECRET

import { callLLM } from "./_llm.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const RUBRIC = `Tu es un évaluateur qualité STRICT pour les agents IA d'Amaryllis Locations (location de villas/logements en Martinique).
Note la SORTIE ci-dessous de 0 à 10 sur 4 axes :
- factualite : aucune invention de chiffre/équipement/fait non fourni
- actionnabilite : propositions concrètes, faisables, spécifiques
- nomenclature : SEULS "Amaryllis" et "Iguana" sont des "villas". Zandoli=logement, Géko=cocon, Mabouya=studio, Bellevue & Nogent=appartement. Toute "villa Zandoli/Géko/Mabouya" = faute grave.
- clarte : structure, concision, exploitable
Réponds UNIQUEMENT en JSON compact :
{"factualite":n,"actionnabilite":n,"nomenclature":n,"clarte":n,"global":n,"commentaire":"<1 phrase>"}`;

function parseScore(text) {
  try {
    const m = String(text).match(/\{[\s\S]*\}/);
    if (!m) return null;
    const o = JSON.parse(m[0]);
    const g = Number(o.global ?? Math.round(((+o.factualite || 0) + (+o.actionnabilite || 0) + (+o.nomenclature || 0) + (+o.clarte || 0)) / 4));
    return { ...o, global: g };
  } catch { return null; }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);
  const limit = Math.min(30, Math.max(1, parseInt(url.searchParams.get("limit") || "8", 10)));

  await db.prepare(`CREATE TABLE IF NOT EXISTS llm_evals (
    id INTEGER PRIMARY KEY AUTOINCREMENT, output_id INTEGER UNIQUE, source TEXT, provider TEXT, model TEXT,
    factualite INTEGER, actionnabilite INTEGER, nomenclature INTEGER, clarte INTEGER, global INTEGER,
    commentaire TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run();
  // La boucle de feedback écrit dans agent_memory (déjà injectée dans les prompts agents).
  await db.prepare(`CREATE TABLE IF NOT EXISTS agent_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT, agent TEXT, key TEXT, value TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()), expires_at INTEGER, UNIQUE(agent, key))`).run().catch(() => {});

  // Sorties pas encore évaluées. On prend la DERNIÈRE sortie de CHAQUE source (1 par agent)
  // → couverture de TOUS les agents par run, pas seulement le plus bavard (community-manager
  //   génère ~12 drafts/jour et monopolisait sinon les 25 places — vu en prod le 2026-06-15).
  let candidates = [];
  try {
    const r = await db.prepare(
      `SELECT o.id, o.source, o.provider, o.model, o.output
       FROM llm_outputs o
       JOIN (SELECT source, MAX(id) AS mid FROM llm_outputs GROUP BY source) latest ON o.id = latest.mid
       LEFT JOIN llm_evals e ON e.output_id = o.id
       WHERE e.id IS NULL AND o.output IS NOT NULL AND length(o.output) > 40
       ORDER BY o.created_at DESC LIMIT ?`
    ).bind(limit).all();
    candidates = r.results || [];
  } catch (e) { return json({ error: "llm_outputs absent ? " + e.message }, 500); }

  let scored = 0, failed = 0, feedback = 0;
  const results = [];
  // Les candidats sont triés du plus récent au plus ancien : seule la sortie LA PLUS
  // RÉCENTE d'un agent doit piloter sa consigne (sinon une vieille bonne note effacerait
  // la correction d'une sortie plus récente et faible — vu en prod le 2026-06-15).
  const fbSeen = new Set();
  for (const c of candidates) {
    // Juge = modèle instruct fiable (medium, non-raisonnement) → JSON propre garanti.
    const r = await callLLM(env, {
      tier: "medium", max_tokens: 700, temperature: 0,
      messages: [{ role: "user", content: `${RUBRIC}\n\nSORTIE À NOTER :\n"""${String(c.output).slice(0, 4000)}"""` }],
    });
    const s = r.ok ? parseScore(r.text) : null;
    if (!s) results.push({ source: c.source, model: c.model, error: r.ok ? `parse: ${String(r.text).slice(0, 80)}` : (r.errors?.slice(-1)[0]?.error || "llm fail") });
    if (s) {
      await db.prepare(`INSERT OR IGNORE INTO llm_evals
        (output_id, source, provider, model, factualite, actionnabilite, nomenclature, clarte, global, commentaire)
        VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .bind(c.id, c.source, c.provider, c.model, +s.factualite || 0, +s.actionnabilite || 0, +s.nomenclature || 0, +s.clarte || 0, +s.global || 0, String(s.commentaire || "").slice(0, 200)).run();
      scored++;
      results.push({ source: c.source, model: c.model, global: s.global, nomenclature: s.nomenclature });

      // ── Boucle de feedback : la note revient à l'agent (au lieu de dormir en D1) ──
      // source = "agent:<id>" → on cible la mémoire de cet agent, injectée dans son prochain prompt.
      const agentId = String(c.source || "").startsWith("agent:") ? c.source.slice(6) : null;
      if (agentId && !fbSeen.has(agentId)) {
        fbSeen.add(agentId); // la plus récente sortie de cet agent fait foi pour ce batch
        const g = +s.global || 0, fa = +s.factualite || 0, no = +s.nomenclature || 0;
        const faible = g < 6 || fa < 5 || no < 6;
        try {
          if (faible) {
            const axes = [];
            if (fa < 5) axes.push("factualité (n'invente aucun chiffre/équipement non fourni)");
            if (no < 6) axes.push("nomenclature (SEULS Amaryllis & Iguana = villas)");
            if (g < 6 && !axes.length) axes.push("qualité globale (sois plus concret et exploitable)");
            const corrective = `⚠️ Ton run précédent a été noté ${g}/10 (factualité ${fa}, nomenclature ${no}). À corriger en priorité : ${axes.join(" · ")}. ${String(s.commentaire || "").slice(0, 120)}`;
            await db.prepare(`INSERT INTO agent_memory (agent, key, value) VALUES (?,?,?)
              ON CONFLICT(agent, key) DO UPDATE SET value=excluded.value, created_at=unixepoch()`)
              .bind(agentId, "eval_feedback", corrective.slice(0, 400)).run();
            feedback++;
          } else if (g >= 8) {
            // L'agent s'est corrigé → on retire la consigne pour ne pas la laisser périmer.
            await db.prepare("DELETE FROM agent_memory WHERE agent=? AND key='eval_feedback'").bind(agentId).run();
          }
        } catch { /* fail-soft : la note reste écrite, seul le feedback saute */ }
      }
    } else { failed++; }
  }
  return json({ ok: true, candidats: candidates.length, scored, failed, feedback, results });
}

export const onRequestPost = onRequestGet;
