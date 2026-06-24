// GET    /api/guest-contacts            → liste (filtres: ?statut= ?bien= ?q= ?limit=)
// POST   /api/guest-contacts            → créer un contact { nom, telephone, ... }
// PATCH  /api/guest-contacts?id=xxx     → mettre à jour (statut/notes/email/dates/...)
// DELETE /api/guest-contacts?id=xxx     → supprimer
//
// Base de contacts voyageurs/locataires (table guest_contacts). Admin uniquement.
// Binding D1 requis : revenue_manager · Auth : token admin (verifyBearer)

import { verifyBearer } from "./_adminauth.js";

const json = (d, s = 200) => Response.json(d, {
  status: s,
  headers: { "Content-Type": "application/json" },
});

async function checkAuth(context) {
  if (!context.env.ADMIN_PASSWORD && !context.env.ADMIN_PWD) return true; // dev
  const { ok } = await verifyBearer(context.request, context.env);
  return ok;
}

const FIELDS = ["nom", "telephone", "email", "bien", "date_arrivee", "date_depart",
  "montant_eur", "canal", "pays", "statut", "notes", "source"];

export async function onRequestGet(context) {
  if (!(await checkAuth(context))) return json({ error: "Non autorisé" }, 401);
  const db = context.env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  try {
    const url    = new URL(context.request.url);
    const statut = url.searchParams.get("statut") || "";
    const bien   = url.searchParams.get("bien") || "";
    const q      = url.searchParams.get("q") || "";
    const limit  = Math.min(parseInt(url.searchParams.get("limit") || "500"), 1000);

    let query = "SELECT * FROM guest_contacts";
    const where = [], params = [];
    if (statut) { where.push("statut = ?"); params.push(statut); }
    if (bien)   { where.push("bien = ?");   params.push(bien); }
    if (q)      { where.push("(nom LIKE ? OR telephone LIKE ? OR email LIKE ?)");
                  params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (where.length) query += " WHERE " + where.join(" AND ");
    query += " ORDER BY nom COLLATE NOCASE ASC LIMIT ?";
    params.push(limit);

    const { results } = await db.prepare(query).bind(...params).all();
    return json({ ok: true, contacts: results, total: results.length });
  } catch (err) {
    if (err.message?.includes("no such table"))
      return json({ ok: true, contacts: [], total: 0, hint: "no_table" });
    console.error("[guest-contacts] GET error:", err);
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  if (!(await checkAuth(context))) return json({ error: "Non autorisé" }, 401);
  const db = context.env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  let body;
  try { body = await context.request.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  if (!body.nom) return json({ error: "nom requis" }, 400);

  const cols = ["nom"], vals = [body.nom];
  for (const f of FIELDS) {
    if (f === "nom") continue;
    if (body[f] !== undefined) { cols.push(f); vals.push(body[f]); }
  }
  cols.push("created_at"); vals.push(Date.now());

  try {
    const placeholders = cols.map(() => "?").join(", ");
    const { meta } = await db.prepare(
      `INSERT INTO guest_contacts (${cols.join(", ")}) VALUES (${placeholders})`
    ).bind(...vals).run();
    return json({ ok: true, id: meta.last_row_id });
  } catch (err) {
    if (err.message?.includes("UNIQUE"))
      return json({ error: "Ce numéro existe déjà" }, 409);
    console.error("[guest-contacts] POST error:", err);
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPatch(context) {
  if (!(await checkAuth(context))) return json({ error: "Non autorisé" }, 401);
  const db = context.env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "id requis" }, 400);

  let body;
  try { body = await context.request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const sets = [], params = [];
  for (const f of FIELDS) {
    if (body[f] !== undefined) { sets.push(`${f} = ?`); params.push(body[f]); }
  }
  if (!sets.length) return json({ error: "Rien à mettre à jour" }, 400);
  params.push(id);

  try {
    await db.prepare(`UPDATE guest_contacts SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...params).run();
    return json({ ok: true });
  } catch (err) {
    console.error("[guest-contacts] PATCH error:", err);
    return json({ error: err.message }, 500);
  }
}

export async function onRequestDelete(context) {
  if (!(await checkAuth(context))) return json({ error: "Non autorisé" }, 401);
  const db = context.env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "id requis" }, 400);

  try {
    await db.prepare("DELETE FROM guest_contacts WHERE id = ?").bind(id).run();
    return json({ ok: true });
  } catch (err) {
    console.error("[guest-contacts] DELETE error:", err);
    return json({ error: err.message }, 500);
  }
}
