// Cloudflare Pages Function — GET /api/whatsapp-conversations
// Lit la table whatsapp_conversations depuis D1 (revenue_manager).
// Auth : Bearer token admin (même que les autres endpoints admin).
// Params : ?limit=50&bien=amaryllis&from=+596...

import { verifyBearer } from "./_adminauth.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

export async function onRequestGet(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  const auth = await verifyBearer(request, env);
  if (!auth.ok) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
  const bien = url.searchParams.get("bien") || null;
  const from = url.searchParams.get("from") || null;

  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS whatsapp_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_wa TEXT NOT NULL,
      bien TEXT,
      user_msg TEXT,
      bot_reply TEXT,
      provider TEXT,
      ok INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`).run();

    let query = "SELECT * FROM whatsapp_conversations";
    const bindings = [];
    const conditions = [];
    if (bien) { conditions.push("bien = ?"); bindings.push(bien); }
    if (from) { conditions.push("from_wa LIKE ?"); bindings.push(`%${from}%`); }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY created_at DESC LIMIT ?";
    bindings.push(limit);

    const { results } = await db.prepare(query).bind(...bindings).all();
    return json({ ok: true, total: results.length, conversations: results });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
