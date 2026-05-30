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
  const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get("limit") || "8", 10)));

  await db.prepare(`CREATE TABLE IF NOT EXISTS llm_evals (
    id INTEGER PRIMARY KEY AUTOINCREMENT, output_id INTEGER UNIQUE, source TEXT, provider TEXT, model TEXT,
    factualite INTEGER, actionnabilite INTEGER, nomenclature INTEGER, clarte INTEGER, global INTEGER,
    commentaire TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run();

  // Sorties pas encore évaluées
  let candidates = [];
  try {
    const r = await db.prepare(
      `SELECT o.id, o.source, o.provider, o.model, o.output
       FROM llm_outputs o LEFT JOIN llm_evals e ON e.output_id = o.id
       WHERE e.id IS NULL AND o.output IS NOT NULL AND length(o.output) > 40
       ORDER BY o.created_at DESC LIMIT ?`
    ).bind(limit).all();
    candidates = r.results || [];
  } catch (e) { return json({ error: "llm_outputs absent ? " + e.message }, 500); }

  let scored = 0, failed = 0;
  const results = [];
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
    } else { failed++; }
  }
  return json({ ok: true, candidats: candidates.length, scored, failed, results });
}

export const onRequestPost = onRequestGet;
