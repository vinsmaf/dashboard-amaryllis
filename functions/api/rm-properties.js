// Cloudflare Pages Function — /api/rm-properties
// Property settings: list, get, update

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

async function handleGet(db, url) {
  const id = url.searchParams.get("id");

  if (id) {
    // Single property with seasonal profiles + competitor set counts
    const [prop, profiles, competitorCount] = await Promise.all([
      db.prepare(`SELECT * FROM rm_properties WHERE id = ?`).bind(id).first(),
      db.prepare(`SELECT * FROM rm_seasonal_profiles WHERE property_id = ? AND is_active = 1 ORDER BY year DESC, date_start ASC`).bind(id).all(),
      db
        .prepare(
          `SELECT COUNT(*) as cnt FROM rm_competitor_listings cl
           JOIN rm_competitor_sets cs ON cs.id = cl.set_id
           WHERE cl.property_id = ? AND cl.is_active = 1`
        )
        .bind(id)
        .first(),
    ]);

    if (!prop) return json({ error: "Property not found" }, 404);

    return json({
      property: prop,
      seasonal_profiles: profiles.results || [],
      competitor_count: competitorCount ? competitorCount.cnt : 0,
    });
  }

  // All active properties with seasonal profile counts
  const { results: properties } = await db
    .prepare(`SELECT * FROM rm_properties WHERE is_active = 1 ORDER BY type, name`)
    .all();

  if (!properties || !properties.length) return json({ properties: [] });

  // Attach profile counts
  const propIds = properties.map((p) => p.id);
  const placeholders = propIds.map(() => "?").join(",");
  const { results: profileCounts } = await db
    .prepare(
      `SELECT property_id, COUNT(*) as cnt
       FROM rm_seasonal_profiles
       WHERE property_id IN (${placeholders}) AND is_active = 1
       GROUP BY property_id`
    )
    .bind(...propIds)
    .all();

  const pcMap = {};
  for (const pc of profileCounts || []) pcMap[pc.property_id] = pc.cnt;

  const enriched = properties.map((p) => ({
    ...p,
    seasonal_profile_count: pcMap[p.id] || 0,
  }));

  return json({ properties: enriched, count: enriched.length });
}

async function handlePut(db, body) {
  const { id, ...fields } = body;
  if (!id) return json({ error: "id required" }, 400);

  const existing = await db.prepare(`SELECT * FROM rm_properties WHERE id = ?`).bind(id).first();
  if (!existing) return json({ error: "Property not found" }, 404);

  const allowed = [
    "name", "short_name", "type", "capacity", "bedrooms", "bathrooms",
    "location", "latitude", "longitude", "currency", "timezone",
    "base_price_low", "base_price_mid", "base_price_high",
    "price_min", "price_max",
    "min_stay_default", "min_stay_low", "min_stay_mid", "min_stay_high", "min_stay_last_minute",
    "positioning", "beds24_property_id", "is_active",
  ];

  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (key in fields) {
      updates.push(`${key} = ?`);
      values.push(fields[key] !== undefined ? fields[key] : null);
    }
  }

  if (!updates.length) return json({ error: "No valid fields to update" }, 400);

  const now = Date.now();
  updates.push("updated_at = ?");
  values.push(now, id);

  await db
    .prepare(`UPDATE rm_properties SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await db.prepare(`SELECT * FROM rm_properties WHERE id = ?`).bind(id).first();
  return json({ ok: true, property: updated });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  // sec : config biens RM (lecture + écriture D1) → admin uniquement.
  const { ok: authOk } = await verifyBearer(request, env);
  if (!authOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  const url = new URL(request.url);

  try {
    if (request.method === "GET") return handleGet(db, url);
    if (request.method === "PUT") {
      const body = await request.json().catch(() => ({}));
      return handlePut(db, body);
    }
    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err.message, stack: err.stack }, 500);
  }
}
