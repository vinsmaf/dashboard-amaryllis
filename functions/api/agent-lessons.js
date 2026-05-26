// Cloudflare Pages Function — /api/agent-lessons
// Stockage des "leçons apprises" par les agents IA.
// Chaque leçon = un pattern regex à interdire avec sa raison.
// Les leçons sont chargées par agents-run.js et utilisées comme fact-check.
//
// GET    → liste les leçons
// POST   { pattern, reason, bien_id? } → ajoute une leçon
// DELETE ?id=N → supprime une leçon

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const DDL = `
CREATE TABLE IF NOT EXISTS agent_lessons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern     TEXT NOT NULL,
  reason      TEXT NOT NULL,
  bien_id     TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_lessons_bien ON agent_lessons(bien_id);
`;

async function ensureTable(db) {
  try { for (const s of DDL.split(";").filter(Boolean)) await db.prepare(s).run(); } catch {}
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);
  await ensureTable(db);

  const url = new URL(request.url);

  // ── GET — liste des leçons ────────────────────────────────────────────
  if (request.method === "GET") {
    try {
      const { results } = await db.prepare(
        "SELECT id, pattern, reason, bien_id, created_at FROM agent_lessons ORDER BY created_at DESC LIMIT 200"
      ).all();
      return json({ lessons: results || [], total: (results || []).length });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── POST — ajouter une leçon ──────────────────────────────────────────
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { pattern, reason, bien_id } = body;
    if (!pattern || !reason) return json({ error: "pattern + reason requis" }, 400);

    // Validation : la regex doit être compilable
    try { new RegExp(pattern, "i"); }
    catch (e) { return json({ error: `regex invalide: ${e.message}` }, 400); }

    try {
      const r = await db.prepare(
        "INSERT INTO agent_lessons (pattern, reason, bien_id) VALUES (?, ?, ?)"
      ).bind(pattern, reason, bien_id || null).run();
      return json({ ok: true, id: r.meta?.last_row_id });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── DELETE ────────────────────────────────────────────────────────────
  if (request.method === "DELETE") {
    const id = parseInt(url.searchParams.get("id"));
    if (!id) return json({ error: "id requis" }, 400);
    try {
      await db.prepare("DELETE FROM agent_lessons WHERE id = ?").bind(id).run();
      return json({ ok: true });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  return json({ error: "Method not allowed" }, 405);
}
