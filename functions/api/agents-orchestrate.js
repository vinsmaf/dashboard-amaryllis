// Cloudflare Pages Function — POST /api/agents-orchestrate
// #1 ORCHESTRATEUR (chef d'orchestre) : reçoit un OBJECTIF transverse, le décompose,
// dispatche chaque sous-tâche au bon agent spécialiste, puis synthétise un plan coordonné.
// Passe d'agents-en-silos à une vraie ÉQUIPE.
//
// POST /api/agents-orchestrate?secret=POSTSTAY_SECRET
//   { "objectif": "Lancer la commercialisation du studio Mabouya", "save": true }
//
// Pipeline : décompose (smart) → dispatch parallèle aux agents (medium) → synthèse (smart).

import { callLLM } from "./_llm.js";
import { AGENTS } from "./agents-run.js";
import { EQUIP_RULES_TEXT } from "./_biens.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const AGENT_IDS = new Set(AGENTS.map(a => a.id));
const AGENT_BY_ID = Object.fromEntries(AGENTS.map(a => [a.id, a]));
const DIRECTORY = AGENTS.map(a => `- ${a.id} (${a.label}) : ${a.focus}`).join("\n");

const NOMENCLATURE = `RAPPEL NOMENCLATURE STRICTE : seuls "Amaryllis" et "Iguana" sont des VILLAS ; Zandoli=logement, Géko=cocon, Mabouya=studio, Bellevue=appartement de standing (Schœlcher), Nogent=appartement.`;

const parseJSON = (text, fallback) => {
  try { const m = String(text).match(/[\[{][\s\S]*[\]}]/); return m ? JSON.parse(m[0]) : fallback; }
  catch { return fallback; }
};

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const body = await request.json().catch(() => ({}));
  const objectif = String(body.objectif || "").trim();
  if (!objectif) return json({ error: "objectif requis" }, 400);

  // ── 1. DÉCOMPOSITION ──────────────────────────────────────────────────────
  const decomp = await callLLM(env, {
    tier: "smart", max_tokens: 700, temperature: 0.2, logSource: "orchestrator:decompose",
    messages: [{ role: "user", content:
`Tu es le CHEF D'ORCHESTRE de l'équipe IA d'Amaryllis Locations (location de villas/logements en Martinique + Nogent).
${NOMENCLATURE}

OBJECTIF À ATTEINDRE : "${objectif}"

Décompose-le en 3 à 6 sous-tâches, chacune confiée à UN agent (utilise son id EXACT de la liste).
Choisis les agents les plus pertinents, évite les doublons.
Réponds UNIQUEMENT en JSON : [{"agent":"<id>","brief":"<consigne précise et actionnable, ≤25 mots>"}]

AGENTS DISPONIBLES :
${DIRECTORY}` }],
  });
  let tasks = (parseJSON(decomp.text, []) || []).filter(t => t && AGENT_IDS.has(t.agent) && t.brief).slice(0, 6);
  if (!tasks.length) return json({ error: "décomposition échouée", raw: String(decomp.text).slice(0, 300) }, 502);

  // ── 2. DISPATCH parallèle aux agents spécialistes ────────────────────────
  const contributions = await Promise.all(tasks.map(async (t) => {
    const a = AGENT_BY_ID[t.agent];
    const r = await callLLM(env, {
      tier: "medium", max_tokens: 600, temperature: 0.3, logSource: `orchestrator:dispatch:${t.agent}`,
      messages: [{ role: "user", content:
`Tu es l'agent "${a.label}" d'Amaryllis Locations. Domaine : ${a.focus}.
${NOMENCLATURE}
${EQUIP_RULES_TEXT}

OBJECTIF GLOBAL : "${objectif}"
TA MISSION CIBLÉE : ${t.brief}

Donne 2 à 4 actions CONCRÈTES, spécifiques à ton domaine, faisables. JSON : {"actions":["...","..."]}` }],
    });
    const out = parseJSON(r.text, { actions: [] });
    return { agent: t.agent, label: a.label, brief: t.brief, actions: Array.isArray(out.actions) ? out.actions.slice(0, 4) : [], model: r.model };
  }));

  // ── 3. SYNTHÈSE coordonnée ────────────────────────────────────────────────
  const contribText = contributions.map(c => `[${c.agent}] ${c.brief}\n${(c.actions || []).map(x => `  - ${x}`).join("\n")}`).join("\n\n");
  const synth = await callLLM(env, {
    tier: "smart", max_tokens: 1100, temperature: 0.3, logSource: "orchestrator:synthesize",
    messages: [{ role: "user", content:
`OBJECTIF : "${objectif}"
Voici les contributions des agents spécialistes :
${contribText}

Produis un PLAN D'ACTION COORDONNÉ : étapes ORDONNÉES (avec dépendances logiques), qui fait quoi, jalons.
Réponds UNIQUEMENT en JSON :
{"synthese":"<2 phrases>","plan":[{"etape":1,"agent":"<id>","action":"<quoi>","depend_de":[]}]}` }],
  });
  const synthesis = parseJSON(synth.text, { synthese: "", plan: [] });

  const result = { objectif, taches: tasks.length, contributions, synthese: synthesis.synthese, plan: synthesis.plan };

  // ── 4. Persistance (optionnelle) ─────────────────────────────────────────
  if (body.save !== false && env.revenue_manager) {
    try {
      await env.revenue_manager.prepare(
        "CREATE TABLE IF NOT EXISTS orchestrations (id INTEGER PRIMARY KEY AUTOINCREMENT, objectif TEXT, result TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))"
      ).run();
      await env.revenue_manager.prepare("INSERT INTO orchestrations (objectif, result) VALUES (?,?)")
        .bind(objectif, JSON.stringify(result)).run();
    } catch { /* non bloquant */ }
  }

  return json({ ok: true, ...result });
}
