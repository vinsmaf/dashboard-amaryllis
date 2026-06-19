// GET  /api/crm-clients            → liste paginée (admin)
// GET  /api/crm-clients?id=xxx     → fiche client
// PATCH /api/crm-clients?id=xxx    → update notes/tags
// POST  /api/crm-clients           → upsert manuel

import { verifyBearer } from "./_adminauth.js";

const json = (d, s = 200) => Response.json(d, {
  status: s,
  headers: { "Content-Type": "application/json" },
});

async function checkAuth(context) {
  if (!context.env.ADMIN_PASSWORD && !context.env.ADMIN_PWD) return true;
  const { ok } = await verifyBearer(context.request, context.env);
  return ok;
}

export async function onRequestGet(context) {
  if (!(await checkAuth(context))) return json({ error: "Non autorisé" }, 401);
  const db = context.env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const url     = new URL(context.request.url);
  const id      = url.searchParams.get("id");
  const search  = url.searchParams.get("q") || "";
  const recOnly = url.searchParams.get("recurrent") === "1";
  const withContact = url.searchParams.get("contact") === "1";
  const bien    = url.searchParams.get("bien") || "";
  const limit   = Math.min(parseInt(url.searchParams.get("limit") || "200"), 500);
  const offset  = parseInt(url.searchParams.get("offset") || "0");

  try {
    if (id) {
      const client = await db.prepare("SELECT * FROM crm_clients WHERE id=?").bind(id).first();
      if (!client) return json({ error: "Client introuvable" }, 404);
      return json({ ok: true, client });
    }

    let where = "1=1";
    const params = [];

    if (search) {
      where += " AND (prenom LIKE ? OR nom LIKE ? OR email LIKE ?)";
      const q = `%${search}%`;
      params.push(q, q, q);
    }
    if (recOnly) { where += " AND is_recurrent=1"; }
    if (withContact) { where += " AND (email IS NOT NULL OR mobile IS NOT NULL)"; }
    if (bien) { where += " AND biens LIKE ?"; params.push(`%${bien}%`); }

    const countRow = await db.prepare(`SELECT COUNT(*) n FROM crm_clients WHERE ${where}`)
      .bind(...params).first();
    const total = countRow?.n || 0;

    const { results } = await db.prepare(
      `SELECT * FROM crm_clients WHERE ${where}
       ORDER BY ltv_total DESC, nb_sejours DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();

    return json({ ok: true, clients: results, total, limit, offset });
  } catch (err) {
    if (err.message?.includes("no such table")) return json({ ok: true, clients: [], total: 0 });
    console.error("[crm-clients] GET:", err);
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPatch(context) {
  if (!(await checkAuth(context))) return json({ error: "Non autorisé" }, 401);
  const db = context.env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const url = new URL(context.request.url);
  const id  = url.searchParams.get("id");
  if (!id) return json({ error: "id requis" }, 400);

  try {
    const body = await context.request.json();
    const fields = [];
    const vals   = [];

    if (body.notes !== undefined) { fields.push("notes=?"); vals.push(body.notes); }
    if (body.tags  !== undefined) { fields.push("tags=?");  vals.push(JSON.stringify(body.tags)); }
    if (body.email !== undefined) { fields.push("email=?"); vals.push(body.email); }
    if (body.mobile !== undefined){ fields.push("mobile=?");vals.push(body.mobile); }

    if (!fields.length) return json({ error: "Aucun champ à modifier" }, 400);
    fields.push("updated_at=datetime('now')");
    vals.push(id);

    await db.prepare(`UPDATE crm_clients SET ${fields.join(",")} WHERE id=?`).bind(...vals).run();
    return json({ ok: true });
  } catch (err) {
    console.error("[crm-clients] PATCH:", err);
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  if (!(await checkAuth(context))) return json({ error: "Non autorisé" }, 401);
  const db = context.env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  try {
    const body = await context.request.json();
    const { prenom, nom, email, mobile, notes, tags, source = "manuel" } = body;
    if (!prenom && !nom) return json({ error: "prenom ou nom requis" }, 400);

    const raw = `${prenom || ""} ${nom || ""}`.toLowerCase().trim();
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    const id  = "crm-" + [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 12);

    await db.prepare(`
      INSERT INTO crm_clients (id,prenom,nom,email,mobile,notes,tags,source,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        email=COALESCE(excluded.email, email),
        mobile=COALESCE(excluded.mobile, mobile),
        notes=COALESCE(excluded.notes, notes),
        updated_at=datetime('now')
    `).bind(id, prenom||null, nom||null, email||null, mobile||null,
             notes||null, JSON.stringify(tags||[]), source).run();

    return json({ ok: true, id });
  } catch (err) {
    console.error("[crm-clients] POST:", err);
    return json({ error: err.message }, 500);
  }
}
