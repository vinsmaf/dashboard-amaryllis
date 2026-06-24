// Cloudflare Pages Function — /api/orchestrator
// Orchestrateur multi-agents : utilise claude-sonnet pour coordonner les 28 agents
// GET  : liste les 20 derniers runs d'orchestration
// POST : déclenche une orchestration complète
// D1 binding : revenue_manager

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const AGENT_IDS = [
  "juriste-compliance",
  "architecte-reseau",
  "webmaster",
  "traffic-manager",
  "data-analyst",
  "revenue-manager",
  "developpeur-multimedia",
  "photographe-da",
  "webdesigner",
  "chef-produit-web",
  "community-manager",
  "repondeur-social",
  "commercial-publicite",
  "crm-manager",
  "consultant-ebusiness",
  "responsable-service-client",
  "responsable-logistique",
  "seo-content-writer",
  "qa-tester",
  "growth-experiments",
  "veille-concurrentielle",
  "prompt-engineer",
  "seo-local",
  "voyageur-research",
  "fiscaliste",
  "controleur-fiscal",
  "comptable",
  "notaire-assurance",
];

const SYSTEM_PROMPT = `Tu es l'orchestrateur IA d'Amaryllis Locations, plateforme de 7 propriétés de location premium.
Tu coordonnes 28 agents spécialisés. Ton rôle : analyser la situation globale, identifier les synergies entre agents, prioriser les actions cross-fonctionnelles.

AGENTS DISPONIBLES : ${AGENT_IDS.join(", ")}`;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  const method = request.method;

  // ── GET — liste les runs récents ──────────────────────────────────────────
  if (method === "GET") {
    try {
      const { results } = await db.prepare(
        "SELECT * FROM orchestrator_runs ORDER BY created_at DESC LIMIT 20"
      ).all();
      return json({ runs: results || [], total: (results || []).length });
    } catch (e) {
      if (e.message?.includes("no such table")) {
        return json({ runs: [], total: 0, hint: "Table orchestrator_runs not yet created — run POST /api/agents-actions?action=init" });
      }
      return json({ error: e.message }, 500);
    }
  }

  // ── POST — déclenche une orchestration ────────────────────────────────────
  if (method === "POST") {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) return json({ error: "GROQ_API_KEY not configured" }, 503);

    const body = await request.json().catch(() => ({}));
    const trigger    = body.trigger    || "manual";
    const event_data = body.event_data || {};
    const startMs    = Date.now();
    const now        = Math.floor(startMs / 1000);

    // 1. Créer un run avec status='running'
    let runId;
    try {
      const inserted = await db.prepare(`
        INSERT INTO orchestrator_runs (trigger, event_data, status, created_at)
        VALUES (?, ?, 'running', ?)
      `).bind(trigger, JSON.stringify(event_data), now).run();
      runId = inserted.meta?.last_row_id;
    } catch (e) {
      return json({ error: `Failed to create run: ${e.message}` }, 500);
    }

    // 2. Charger le contexte
    let actionsContext = "(aucune action chargée)";
    let memoryContext  = "(aucune mémoire chargée)";

    try {
      // 10 dernières actions critiques ou hautes non faites
      const { results: pendingActions } = await db.prepare(`
        SELECT id, agent, agent_label, action, priority, category, status
        FROM agent_actions
        WHERE priority IN ('critique','haute') AND status != 'fait'
        ORDER BY CASE priority WHEN 'critique' THEN 1 WHEN 'haute' THEN 2 END, updated_at DESC
        LIMIT 10
      `).all();
      if (pendingActions && pendingActions.length > 0) {
        actionsContext = pendingActions.map(a =>
          `[${a.id}] (${a.priority}) ${a.agent_label} — ${a.action} [${a.status}]`
        ).join("\n");
      }
    } catch {}

    try {
      // Mémoires récentes de tous les agents
      const { results: mems } = await db.prepare(`
        SELECT agent, key, value, created_at
        FROM agent_memory
        ORDER BY created_at DESC
        LIMIT 30
      `).all();
      if (mems && mems.length > 0) {
        memoryContext = mems.map(m =>
          `[${m.agent}] ${m.key}: ${m.value}`
        ).join("\n");
      }
    } catch {}

    const event_data_str = Object.keys(event_data).length > 0
      ? `\nDonnées événement : ${JSON.stringify(event_data)}`
      : "";

    const userMessage = `Analyse la situation globale de la plateforme Amaryllis Locations.

CONTEXTE ACTUEL :
Actions prioritaires en attente :
${actionsContext}

Mémoires agents (observations récentes) :
${memoryContext}

Trigger : ${trigger}${event_data_str}

Identifie :
1. Les actions critiques à traiter en urgence
2. Les synergies entre agents (ex: SEO + content writer doivent se coordonner sur les guides)
3. Ta décision d'orchestration

Retourne un JSON strict (aucun texte avant ou après) :
{
  "summary": "synthèse en 2-3 phrases de la situation globale",
  "urgences": [{"action_id": "id", "raison": "pourquoi urgent"}],
  "synergies": [{"agents": ["agent1","agent2"], "opportunite": "description de la synergie"}],
  "decisions": [{"type": "prioritize|coordinate|notify", "details": "description de la décision"}]
}`;

    // 3. Appel claude-sonnet
    let summary    = null;
    let decisions  = null;
    let urgences   = null;
    let synergies  = null;
    let agentsConsulted = AGENT_IDS.join(",");

    // Modèle dédié orchestrateur — bucket SÉPARÉ des agents (évite 429 post-run)
    // llama3-70b-8192 = bucket différent de llama-3.3-70b-versatile utilisé par juriste/revenue-manager
    const ORCH_MODELS = [
      "llama3-70b-8192",                           // bucket propre à l'orchestrateur
      "llama-3.3-70b-versatile",                    // fallback Groq confirmé actif
      "llama3-8b-8192",                            // fallback rapide
    ];

    const groqBody = JSON.stringify({
      max_tokens: 2048,
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    // Essaye chaque modèle jusqu'à succès (rotation si 429/400)
    for (const model of ORCH_MODELS) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 25000); // 25s timeout
        let res;
        try {
          res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({ ...JSON.parse(groqBody), model }),
            signal: ctrl.signal,
          });
        } finally { clearTimeout(timer); }

        if (res.status === 429 || res.status === 400) {
          const errText = await res.text().catch(() => "");
          // Modèle rate-limité ou décommissionné → essayer le suivant
          if (errText.includes("DECOMMISSIONED") || res.status === 429) continue;
          summary = `Groq ${res.status} (${model}): ${errText.slice(0, 200)}`;
          break;
        }

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || "";
          try {
            const match = text.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(match ? match[0] : text);
            summary   = parsed.summary   || null;
            urgences  = parsed.urgences  ? JSON.stringify(parsed.urgences)  : null;
            synergies = parsed.synergies ? JSON.stringify(parsed.synergies) : null;
            decisions = parsed.decisions ? JSON.stringify(parsed.decisions) : null;
          } catch {
            summary = text.slice(0, 500);
          }
          break; // succès → on arrête
        } else {
          const errText = await res.text().catch(() => "");
          summary = `Groq ${res.status} (${model}): ${errText.slice(0, 200)}`;
          break;
        }
      } catch (e) {
        if (e.name === "AbortError") { summary = `Timeout 25s (${model})`; break; }
        summary = `Erreur réseau (${model}): ${e.message}`;
        break;
      }
    }

    // 4. Mettre à jour le run avec le résultat
    const durationMs = Date.now() - startMs;
    const completedAt = Math.floor(Date.now() / 1000);

    try {
      await db.prepare(`
        UPDATE orchestrator_runs SET
          status           = 'done',
          summary          = ?,
          decisions        = ?,
          agents_consulted = ?,
          duration_ms      = ?,
          completed_at     = ?
        WHERE id = ?
      `).bind(
        summary,
        decisions,
        agentsConsulted,
        durationMs,
        completedAt,
        runId
      ).run();
    } catch {}

    // 5. Retourner le run complet
    let finalRun;
    try {
      finalRun = await db.prepare("SELECT * FROM orchestrator_runs WHERE id = ?").bind(runId).first();
    } catch {}

    return json({
      ok: true,
      run: finalRun || {
        id: runId,
        trigger,
        status: "done",
        summary,
        decisions,
        agents_consulted: agentsConsulted,
        duration_ms: durationMs,
        created_at: now,
        completed_at: completedAt,
      },
      context: {
        actions_loaded: actionsContext !== "(aucune action chargée)",
        memories_loaded: memoryContext !== "(aucune mémoire chargée)",
      },
    });
  }

  return json({ error: "Method not allowed" }, 405);
}
