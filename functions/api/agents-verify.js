// Cloudflare Pages Function — GET /api/agents-verify
// #3 Vérification adversariale pour les agents à ENJEU (juridique, financier).
// Un modèle CHALLENGER (provider différent de l'agent) conteste les actions ouvertes :
// repère erreurs factuelles, risques juridiques/financiers, affirmations non fondées,
// et annote l'action (notes ⚠️ VÉRIF) pour que Vincent voie la mise en garde.
// Additif : ne touche pas la boucle de génération des agents.
//
// GET /api/agents-verify?secret=POSTSTAY_SECRET[&agent=juriste-compliance][&limit=6]

import { callLLM } from "./_llm.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

// Agents dont les sorties ont un coût d'erreur élevé → relecture adverse systématique.
const VERIFY_AGENTS = ["juriste-compliance", "revenue-manager", "consultant-ebusiness"];

const CHALLENGER = (agentLabel, actionsText) => `Tu es un RELECTEUR ADVERSE expert (droit des locations meublées de tourisme France/DOM + finance/pricing).
On te donne des recommandations produites par un agent "${agentLabel}" pour Amaryllis Locations (location de villas/logements en Martinique).
Pour CHAQUE action, repère SANS COMPLAISANCE : erreur factuelle, risque juridique, hypothèse financière douteuse, ou affirmation non fondée.
Sois bref. Si une action est saine, dis-le.
Réponds UNIQUEMENT en JSON : [{"id":<id>,"risque":"haut|moyen|aucun","critique":"<≤20 mots>"}]

ACTIONS :
${actionsText}`;

function parseArr(text) {
  try { const m = String(text).match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]) : null; } catch { return null; }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  const onlyAgent = url.searchParams.get("agent");
  const limit = Math.min(12, Math.max(1, parseInt(url.searchParams.get("limit") || "6", 10)));
  const agents = onlyAgent ? [onlyAgent] : VERIFY_AGENTS;

  const summary = [];
  for (const agent of agents) {
    // Actions ouvertes récentes, pas déjà vérifiées
    const { results } = await db.prepare(
      `SELECT id, agent_label, action, notes FROM agent_actions
       WHERE agent = ? AND status IN ('a-planifier','backlog')
         AND (notes IS NULL OR notes NOT LIKE '%⚠️ VÉRIF%')
       ORDER BY updated_at DESC LIMIT ?`
    ).bind(agent, limit).all();
    if (!results?.length) { summary.push({ agent, checked: 0, flagged: 0 }); continue; }

    const label = results[0].agent_label || agent;
    const actionsText = results.map(r => `#${r.id} ${String(r.action).slice(0, 220)}`).join("\n");

    // Challenger = Mistral (FR-native, JSON fiable) — provider DIFFÉRENT des agents groq/cf/cerebras
    const r = await callLLM(env, {
      provider: "mistral", tier: "smart", max_tokens: 900, temperature: 0,
      messages: [{ role: "user", content: CHALLENGER(label, actionsText) }],
    });
    const verdicts = r.ok ? parseArr(r.text) : null;
    if (!verdicts) { summary.push({ agent, checked: results.length, flagged: 0, error: r.ok ? "parse" : "llm" }); continue; }

    let flagged = 0;
    for (const v of verdicts) {
      if (!v.id || !v.risque || v.risque === "aucun") continue;
      const note = ` ⚠️ VÉRIF[${v.risque}]: ${String(v.critique || "").slice(0, 160)}`;
      await db.prepare("UPDATE agent_actions SET notes = COALESCE(notes,'') || ?, updated_at = unixepoch() WHERE id = ?")
        .bind(note, v.id).run();
      flagged++;
    }
    summary.push({ agent, checked: results.length, flagged, model: r.model });
  }
  return json({ ok: true, summary });
}

export const onRequestPost = onRequestGet;
