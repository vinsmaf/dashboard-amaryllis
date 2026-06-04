// Cloudflare Pages Function — /api/guides
// Lit depuis D1 (revenue_manager) avec fallback vers /public/guides/{id}.json
// GET  /api/guides?property_id=xxx  → retourne le guide
// POST /api/guides                   → body: { property_id, guide } — sauvegarde en D1 (AUTH admin requise)

import { verifyBearer } from "../_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS property_guides (
      property_id  TEXT PRIMARY KEY,
      content_json TEXT NOT NULL,
      updated_at   INTEGER NOT NULL
    )
  `).run().catch(() => {});
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);
  const property_id = url.searchParams.get("property_id");

  // ── GET ─────────────────────────────────────────────────────────────────────
  if (request.method === "GET") {
    if (!property_id) return json({ error: "property_id required" }, 400);

    let guide = null;
    let source = "static";

    // 1. Try D1
    const db = env.revenue_manager;
    if (db) {
      try {
        await ensureTable(db);
        const row = await db
          .prepare("SELECT content_json FROM property_guides WHERE property_id = ?")
          .bind(property_id)
          .first();
        if (row?.content_json) {
          guide = JSON.parse(row.content_json);
          source = "db";
        }
      } catch (_) {}
    }

    // 2. Fall back to static file
    if (!guide) {
      try {
        const staticRes = await fetch(new URL(`/guides/${property_id}.json`, url.origin));
        if (staticRes.ok) {
          guide = await staticRes.json();
          source = "static";
        }
      } catch (_) {}
    }

    if (!guide) return json({ error: "Guide not found", property_id }, 404);

    return json({ ok: true, guide, source });
  }

  // ── POST (AUTH admin requise — écrit le contenu public des livrets/prix) ─────
  if (request.method === "POST") {
    const { ok } = await verifyBearer(request, env);
    if (!ok) return json({ error: "Non autorisé" }, 401);

    const db = env.revenue_manager;
    if (!db) return json({ error: "D1 binding not found" }, 503);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid JSON body" }, 400); }

    const { property_id: pid, guide } = body;
    if (!pid || !guide) return json({ error: "property_id and guide required" }, 400);

    await ensureTable(db);

    const now = Date.now();
    guide.updated_at = new Date().toISOString().slice(0, 10);
    const content_json = JSON.stringify(guide);

    await db.prepare(`
      INSERT INTO property_guides (property_id, content_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(property_id) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at
    `).bind(pid, content_json, now).run();

    return json({ ok: true, property_id: pid, saved_at: now });
  }

  return json({ error: "Method not allowed" }, 405);
}
