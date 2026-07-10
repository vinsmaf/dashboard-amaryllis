// Cloudflare Pages Function — /api/rm-rules
// CRUD for pricing rules
//
// Écriture (POST/PUT/PATCH/DELETE) gated : Bearer admin OU ?secret=POSTSTAY_SECRET
// (SEC audit Fable 5 2026-07-09, Lot 1 — était totalement public). GET reste ouvert.
import { verifyBearer } from "../_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

async function handleGet(db, url) {
  const property_id = url.searchParams.get("property_id");

  let q, binds;
  if (property_id) {
    q = `SELECT * FROM rm_pricing_rules WHERE (property_id = ? OR property_id IS NULL) ORDER BY priority ASC, rule_type`;
    binds = [property_id];
  } else {
    q = `SELECT * FROM rm_pricing_rules ORDER BY priority ASC, rule_type`;
    binds = [];
  }

  const { results } = await db.prepare(q).bind(...binds).all();
  return json({ rules: results || [], count: (results || []).length });
}

async function handlePost(db, body) {
  const {
    property_id, rule_type, name, description, params, adjustment_type, adjustment_value,
    condition_season, condition_lead_time_min, condition_lead_time_max, condition_dow,
    max_adjustment_cents, priority, valid_from, valid_until,
  } = body;

  if (!rule_type || !name || !adjustment_type || adjustment_value === undefined) {
    return json({ error: "rule_type, name, adjustment_type, and adjustment_value are required" }, 400);
  }

  const validAdjTypes = ["fixed_cents", "percent", "replace"];
  if (!validAdjTypes.includes(adjustment_type)) {
    return json({ error: `adjustment_type must be one of: ${validAdjTypes.join(", ")}` }, 400);
  }

  const now = Date.now();
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO rm_pricing_rules
        (id, property_id, rule_type, name, description, params, adjustment_type, adjustment_value,
         condition_season, condition_lead_time_min, condition_lead_time_max, condition_dow,
         max_adjustment_cents, priority, is_active, valid_from, valid_until, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?)`
    )
    .bind(
      id,
      property_id || null,
      rule_type,
      name,
      description || null,
      params ? JSON.stringify(params) : "{}",
      adjustment_type,
      adjustment_value,
      condition_season || null,
      condition_lead_time_min !== undefined ? condition_lead_time_min : null,
      condition_lead_time_max !== undefined ? condition_lead_time_max : null,
      condition_dow || null,
      max_adjustment_cents || null,
      priority !== undefined ? priority : 50,
      valid_from || null,
      valid_until || null,
      now,
      now
    )
    .run();

  const inserted = await db.prepare(`SELECT * FROM rm_pricing_rules WHERE id = ?`).bind(id).first();
  return json({ ok: true, rule: inserted }, 201);
}

async function handlePut(db, body, pathId) {
  // id can come from path segment (PATCH /api/rm-rules/{id}) or from body
  const { id: bodyId, ...fields } = body;
  const id = pathId || bodyId;
  if (!id) return json({ error: "id required" }, 400);

  const existing = await db.prepare(`SELECT * FROM rm_pricing_rules WHERE id = ?`).bind(id).first();
  if (!existing) return json({ error: "Rule not found" }, 404);

  const now = Date.now();

  // Build update dynamically from allowed fields
  const allowed = [
    "name", "description", "params", "adjustment_type", "adjustment_value",
    "condition_season", "condition_lead_time_min", "condition_lead_time_max", "condition_dow",
    "max_adjustment_cents", "priority", "is_active", "valid_from", "valid_until",
  ];

  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (key in fields) {
      updates.push(`${key} = ?`);
      const val = key === "params" && typeof fields[key] === "object"
        ? JSON.stringify(fields[key])
        : fields[key];
      values.push(val !== undefined ? val : null);
    }
  }

  if (!updates.length) return json({ error: "No valid fields to update" }, 400);

  updates.push("updated_at = ?");
  values.push(now, id);

  await db
    .prepare(`UPDATE rm_pricing_rules SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await db.prepare(`SELECT * FROM rm_pricing_rules WHERE id = ?`).bind(id).first();
  return json({ ok: true, rule: updated });
}

async function handleDelete(db, url) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);

  const existing = await db.prepare(`SELECT id FROM rm_pricing_rules WHERE id = ?`).bind(id).first();
  if (!existing) return json({ error: "Rule not found" }, 404);

  // Soft-delete via is_active = 0
  const now = Date.now();
  await db
    .prepare(`UPDATE rm_pricing_rules SET is_active = 0, updated_at = ? WHERE id = ?`)
    .bind(now, id)
    .run();

  return json({ ok: true, id });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  if (request.method !== "GET") {
    const secretOk = !!env.POSTSTAY_SECRET && new URL(request.url).searchParams.get("secret") === env.POSTSTAY_SECRET;
    if (!secretOk) {
      const { ok: adminOk } = await verifyBearer(request, env);
      if (!adminOk) return json({ error: "Non autorisé" }, 401);
    }
  }

  const url = new URL(request.url);
  // Extract optional id from path: /api/rm-rules/{id}
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const pathId = pathSegments.length > 2 ? pathSegments[pathSegments.length - 1] : null;

  try {
    if (request.method === "GET")    return handleGet(db, url);
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      return handlePost(db, body);
    }
    if (request.method === "PUT" || request.method === "PATCH") {
      const body = await request.json().catch(() => ({}));
      return handlePut(db, body, pathId);
    }
    if (request.method === "DELETE") return handleDelete(db, url);

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err.message, stack: err.stack }, 500);
  }
}
