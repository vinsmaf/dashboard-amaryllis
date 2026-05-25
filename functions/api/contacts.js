// GET  /api/contacts          → liste des leads (admin uniquement)
// PATCH /api/contacts?id=xxx  → met à jour status/notes d'un lead
//
// Binding D1 requis : revenue_manager
// Auth : même mot de passe que l'admin (ADMIN_PASSWORD)

const json = (d, s = 200) => Response.json(d, {
  status: s,
  headers: { "Content-Type": "application/json" },
});

function checkAuth(context) {
  const authHeader = context.request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const pwd = context.env.ADMIN_PASSWORD;
  if (!pwd) return true; // pas configuré → pas de protection (dev)
  return token === pwd;
}

export async function onRequestGet(context) {
  if (!checkAuth(context)) return json({ error: "Non autorisé" }, 401);

  const db = context.env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  try {
    const url = new URL(context.request.url);
    const status = url.searchParams.get("status") || "";
    const limit  = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);

    let query = "SELECT * FROM contacts";
    const params = [];
    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const { results } = await db.prepare(query).bind(...params).all();
    return json({ ok: true, contacts: results, total: results.length });
  } catch (err) {
    // Table n'existe pas encore
    if (err.message?.includes("no such table")) {
      return json({ ok: true, contacts: [], total: 0, hint: "no_table" });
    }
    console.error("[contacts] GET error:", err);
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPatch(context) {
  if (!checkAuth(context)) return json({ error: "Non autorisé" }, 401);

  const db = context.env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const url  = new URL(context.request.url);
  const id   = url.searchParams.get("id");
  if (!id) return json({ error: "id requis" }, 400);

  try {
    const body = await context.request.json();
    const updates = [];
    const params  = [];

    if (body.status !== undefined) { updates.push("status = ?"); params.push(body.status); }
    if (body.notes  !== undefined) { updates.push("notes = ?");  params.push(body.notes);  }

    if (updates.length === 0) return json({ error: "Aucun champ à mettre à jour" }, 400);
    params.push(id);

    await db.prepare(`UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
    return json({ ok: true });
  } catch (err) {
    console.error("[contacts] PATCH error:", err);
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
