// Cloudflare Pages Function — /api/rm-overrides
// Manual price/min_stay/block overrides for specific dates

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

async function handleGet(db, url) {
  const property_id = url.searchParams.get("property_id");
  const from = url.searchParams.get("from") || new Date().toISOString().slice(0, 10);
  const to = url.searchParams.get("to") || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  if (!property_id) return json({ error: "property_id required" }, 400);

  const { results } = await db
    .prepare(
      `SELECT * FROM rm_overrides
       WHERE property_id = ? AND date >= ? AND date <= ? AND is_active = 1
       ORDER BY date ASC`
    )
    .bind(property_id, from, to)
    .all();

  return json({ overrides: results || [], count: (results || []).length });
}

async function handlePost(db, body) {
  const { property_id, date, override_type, value_cents, value_int, reason, expires_at, created_by } = body;

  if (!property_id || !date || !override_type) {
    return json({ error: "property_id, date, and override_type are required" }, 400);
  }

  const validTypes = ["price", "min_stay", "block"];
  if (!validTypes.includes(override_type)) {
    return json({ error: `override_type must be one of: ${validTypes.join(", ")}` }, 400);
  }

  if (override_type === "price" && (value_cents === undefined || value_cents === null)) {
    return json({ error: "value_cents required for price override" }, 400);
  }
  if (override_type === "min_stay" && (value_int === undefined || value_int === null)) {
    return json({ error: "value_int required for min_stay override" }, 400);
  }

  // Verify property exists
  const prop = await db.prepare(`SELECT id FROM rm_properties WHERE id = ?`).bind(property_id).first();
  if (!prop) return json({ error: "Property not found" }, 404);

  const now = Date.now();
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO rm_overrides
        (id, property_id, date, override_type, value_cents, value_int, reason, is_active, expires_at, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,1,?,?,?)`
    )
    .bind(id, property_id, date, override_type, value_cents || null, value_int || null, reason || null, expires_at || null, created_by || "admin", now)
    .run();

  const inserted = await db.prepare(`SELECT * FROM rm_overrides WHERE id = ?`).bind(id).first();
  return json({ ok: true, override: inserted }, 201);
}

async function handleDelete(db, url) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);

  const existing = await db.prepare(`SELECT id FROM rm_overrides WHERE id = ?`).bind(id).first();
  if (!existing) return json({ error: "Override not found" }, 404);

  await db.prepare(`UPDATE rm_overrides SET is_active = 0 WHERE id = ?`).bind(id).run();
  return json({ ok: true, id });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);

  // sec : écrit/lit des overrides prix D1 → admin (Bearer) OU appel interne (secret).
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  try {
    if (request.method === "GET") return handleGet(db, url);

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      return handlePost(db, body);
    }

    if (request.method === "DELETE") return handleDelete(db, url);

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err.message, stack: err.stack }, 500);
  }
}
