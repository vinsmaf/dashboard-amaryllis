// functions/api/articles.js — CRUD articles SEO
// GET  /api/articles              → liste (published seulement, ou tous si admin)
// GET  /api/articles?slug=...     → article par slug
// GET  /api/articles?category=... → filtre par catégorie
// POST /api/articles              → créer (admin)
// PATCH /api/articles?slug=...    → mettre à jour (admin)

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS seo_articles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL,
      meta_title  TEXT,
      meta_desc   TEXT,
      category    TEXT NOT NULL DEFAULT 'general',
      content_html TEXT NOT NULL DEFAULT '',
      keywords    TEXT,
      status      TEXT NOT NULL DEFAULT 'draft',
      image_url   TEXT,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      views       INTEGER NOT NULL DEFAULT 0
    )
  `).run().catch(() => {});
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "DB unavailable" }, 503);
  await ensureTable(db);

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const category = url.searchParams.get("category");
  const isAdmin = url.searchParams.get("admin") === "1";

  // ── GET ─────────────────────────────────────────────────────────────────
  if (request.method === "GET") {
    // Par slug
    if (slug) {
      const row = await db.prepare(
        "SELECT * FROM seo_articles WHERE slug = ?"
      ).bind(slug).first();
      if (!row) return json({ error: "not found" }, 404);
      // Incrémenter vues si public
      if (!isAdmin && row.status === "published") {
        db.prepare("UPDATE seo_articles SET views = views + 1 WHERE slug = ?").bind(slug).run().catch(() => {});
      }
      return json(row);
    }

    // Liste
    const adminOk = await verifyBearer(request, env).catch(() => ({ ok: false })).then(r => r?.ok);
    const statusFilter = adminOk ? "" : "WHERE status = 'published'";
    const catFilter = category ? (statusFilter ? ` AND category = '${category.replace(/'/g,"''")}'` : `WHERE category = '${category.replace(/'/g,"''")}'`) : "";

    const rows = await db.prepare(
      `SELECT id, slug, title, meta_title, meta_desc, category, status, image_url, keywords, created_at, updated_at, views
       FROM seo_articles ${statusFilter}${catFilter}
       ORDER BY created_at DESC LIMIT 200`
    ).all();
    return json({ articles: rows.results || [] });
  }

  // ── POST — créer ─────────────────────────────────────────────────────────
  if (request.method === "POST") {
    const authResult = await verifyBearer(request, env).catch(() => ({ ok: false }));
    if (!authResult?.ok) return json({ error: "unauthorized" }, 401);

    const body = await request.json().catch(() => null);
    if (!body?.slug || !body?.title) return json({ error: "slug + title required" }, 400);

    const { slug: s, title, meta_title, meta_desc, category: cat = "general",
      content_html = "", keywords = "", status = "draft", image_url = "" } = body;

    await db.prepare(`
      INSERT INTO seo_articles (slug, title, meta_title, meta_desc, category, content_html, keywords, status, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(s, title, meta_title || title, meta_desc || "", cat, content_html, keywords, status, image_url).run();

    return json({ ok: true, slug: s });
  }

  // ── PATCH — mettre à jour ────────────────────────────────────────────────
  if (request.method === "PATCH") {
    const authResult = await verifyBearer(request, env).catch(() => ({ ok: false }));
    if (!authResult?.ok) return json({ error: "unauthorized" }, 401);
    if (!slug) return json({ error: "slug required" }, 400);

    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "body required" }, 400);

    const fields = [];
    const vals = [];
    const allowed = ["title", "meta_title", "meta_desc", "category", "content_html", "keywords", "status", "image_url"];
    for (const k of allowed) {
      if (k in body) { fields.push(`${k} = ?`); vals.push(body[k]); }
    }
    if (!fields.length) return json({ error: "nothing to update" }, 400);
    fields.push("updated_at = unixepoch()");
    vals.push(slug);

    await db.prepare(`UPDATE seo_articles SET ${fields.join(", ")} WHERE slug = ?`).bind(...vals).run();
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
}
