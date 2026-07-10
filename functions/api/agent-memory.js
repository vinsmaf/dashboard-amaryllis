// Cloudflare Pages Function — /api/agent-memory
// CRUD pour les mémoires persistantes des agents IA
// GET  ?agent=X           → liste les mémoires de l'agent X (ou tous si absent)
// POST {agent,key,value,expires_in_days} → upsert une mémoire
// DELETE ?agent=X&key=Y   → supprime une mémoire spécifique
// D1 binding : revenue_manager
//
// GET public (lecture). POST/DELETE gated (Bearer admin ou ?secret=POSTSTAY_SECRET) —
// sinon empoisonnement persistant possible des prompts de tous les agents
// (SEC audit Fable 5 2026-07-09).

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  const url = new URL(request.url);
  const method = request.method;

  // ── GET — liste les mémoires ──────────────────────────────────────────────
  if (method === "GET") {
    const agent = url.searchParams.get("agent");
    try {
      let q = "SELECT * FROM agent_memory WHERE 1=1";
      const params = [];
      if (agent) { q += " AND agent = ?"; params.push(agent); }
      q += " ORDER BY created_at DESC LIMIT 100";
      const { results } = await db.prepare(q).bind(...params).all();
      return json({ memories: results || [], total: (results || []).length });
    } catch (e) {
      if (e.message?.includes("no such table")) {
        return json({ memories: [], total: 0, hint: "Table agent_memory not yet created — run POST /api/agents-actions?action=init" });
      }
      return json({ error: e.message }, 500);
    }
  }

  // ── POST — upsert une mémoire ─────────────────────────────────────────────
  if (method === "POST") {
    const secretOk = !!env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
    if (!secretOk) {
      const { ok: adminOk } = await verifyBearer(request, env);
      if (!adminOk) return json({ error: "Non autorisé" }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const { agent, key, value, expires_in_days } = body;

    if (!agent || !key || value === undefined) {
      return json({ error: "agent, key et value sont requis" }, 400);
    }

    const now = Math.floor(Date.now() / 1000);
    const expires_at = expires_in_days ? now + expires_in_days * 86400 : null;

    try {
      await db.prepare(`
        INSERT INTO agent_memory (agent, key, value, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(agent, key) DO UPDATE SET
          value      = excluded.value,
          created_at = excluded.created_at,
          expires_at = excluded.expires_at
      `).bind(agent, key, String(value), now, expires_at).run();
      return json({ ok: true, agent, key });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── DELETE — supprime une mémoire spécifique ──────────────────────────────
  if (method === "DELETE") {
    const secretOk = !!env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
    if (!secretOk) {
      const { ok: adminOk } = await verifyBearer(request, env);
      if (!adminOk) return json({ error: "Non autorisé" }, 401);
    }

    const agent = url.searchParams.get("agent");
    const key   = url.searchParams.get("key");

    if (!agent) return json({ error: "agent est requis" }, 400);

    try {
      if (key) {
        await db.prepare("DELETE FROM agent_memory WHERE agent = ? AND key = ?").bind(agent, key).run();
        return json({ ok: true, deleted: `${agent}/${key}` });
      } else {
        // Supprime toutes les mémoires de l'agent
        await db.prepare("DELETE FROM agent_memory WHERE agent = ?").bind(agent).run();
        return json({ ok: true, deleted: `all memories for ${agent}` });
      }
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  return json({ error: "Method not allowed" }, 405);
}
