// GET    /api/guest-contacts            → liste depuis crm_clients (mapping colonnes)
// POST   /api/guest-contacts            → créer dans crm_clients
// PATCH  /api/guest-contacts?id=xxx     → mettre à jour
// DELETE /api/guest-contacts?id=xxx     → supprimer
//
// ⚠️ guest_contacts est archivée. Source unique = crm_clients.
// Ce endpoint maintient le même format API pour compatibilité avec GuestContactsTab.jsx.

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

// Mapping crm_clients → format attendu par GuestContactsTab
const SELECT_AS_CONTACT = `
  SELECT
    id,
    TRIM(COALESCE(prenom,'') || CASE WHEN nom IS NOT NULL AND nom != '' THEN ' ' || nom ELSE '' END) AS nom,
    mobile    AS telephone,
    email,
    biens     AS bien,
    premier_sejour AS date_arrivee,
    dernier_sejour AS date_depart,
    ltv_total AS montant_eur,
    canal_principal AS canal,
    pays,
    COALESCE(statut, 'locataire') AS statut,
    notes,
    source,
    created_at
  FROM crm_clients
`;

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

    const where = [], params = [];
    if (statut) { where.push("COALESCE(statut,'locataire') = ?"); params.push(statut); }
    if (bien)   { where.push("biens LIKE ?"); params.push(`%${bien}%`); }
    if (q)      {
      where.push("(prenom LIKE ? OR nom LIKE ? OR mobile LIKE ? OR email LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";
    const { results } = await db.prepare(
      `${SELECT_AS_CONTACT} ${whereClause} ORDER BY TRIM(COALESCE(prenom,'') || ' ' || COALESCE(nom,'')) COLLATE NOCASE ASC LIMIT ?`
    ).bind(...params, limit).all();

    return json({ ok: true, contacts: results, total: results.length });
  } catch (err) {
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

  const action = new URL(context.request.url).searchParams.get("action");

  // ── Fusion de 2 contacts ──
  if (action === "merge") {
    const { keepId, dropId } = body;
    if (!keepId || !dropId || keepId === dropId)
      return json({ error: "keepId et dropId distincts requis" }, 400);
    try {
      const keep = await db.prepare("SELECT * FROM crm_clients WHERE id=?").bind(keepId).first();
      const drop = await db.prepare("SELECT * FROM crm_clients WHERE id=?").bind(dropId).first();
      if (!keep || !drop) return json({ error: "Contact introuvable" }, 404);

      const n1 = (keep.notes || "").trim(), n2 = (drop.notes || "").trim();
      const mergedNotes = n1 && n2 && n1 !== n2 ? `${n1} | (fusion) ${n2}` : (n1 || n2);

      await db.prepare("DELETE FROM crm_clients WHERE id=?").bind(dropId).run();
      await db.prepare(`UPDATE crm_clients SET
        email   = COALESCE(email, ?),
        mobile  = COALESCE(mobile, ?),
        statut  = COALESCE(statut, ?),
        notes   = ?,
        biens   = COALESCE(biens, ?),
        pays    = COALESCE(pays, ?),
        updated_at = datetime('now')
      WHERE id=?`).bind(
        drop.email, drop.mobile, drop.statut, mergedNotes,
        drop.biens, drop.pays, keepId
      ).run();

      return json({ ok: true, kept: keepId, dropped: dropId });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // ── Création ──
  if (!body.nom) return json({ error: "nom requis" }, 400);

  const parts = (body.nom || "").trim().split(" ");
  const prenom = parts[0] || null;
  const nom    = parts.slice(1).join(" ") || null;
  const id     = "gc-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  try {
    await db.prepare(`
      INSERT INTO crm_clients
        (id, prenom, nom, email, mobile, pays, canal_principal, statut, notes, source, biens,
         nb_sejours, ltv_total, premier_sejour, dernier_sejour, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
      ON CONFLICT(id) DO NOTHING
    `).bind(
      id, prenom, nom,
      body.email || null,
      body.telephone || null,
      body.pays || null,
      body.canal || null,
      body.statut || "locataire",
      body.notes || null,
      body.source || "manuel",
      body.bien || null,
      1,
      body.montant_eur || 0,
      body.date_arrivee || null,
      body.date_depart || null,
    ).run();
    return json({ ok: true, id });
  } catch (err) {
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
  const MAP = {
    nom:          null, // split handled below
    telephone:    "mobile",
    email:        "email",
    bien:         "biens",
    canal:        "canal_principal",
    pays:         "pays",
    statut:       "statut",
    notes:        "notes",
    date_arrivee: "premier_sejour",
    date_depart:  "dernier_sejour",
    montant_eur:  "ltv_total",
  };

  if (body.nom !== undefined) {
    const parts = (body.nom || "").trim().split(" ");
    sets.push("prenom=?", "nom=?");
    params.push(parts[0] || null, parts.slice(1).join(" ") || null);
  }
  for (const [src, dst] of Object.entries(MAP)) {
    if (src === "nom") continue;
    if (body[src] !== undefined && dst) { sets.push(`${dst}=?`); params.push(body[src]); }
  }
  if (!sets.length) return json({ error: "Rien à mettre à jour" }, 400);
  sets.push("updated_at=datetime('now')");
  params.push(id);

  try {
    await db.prepare(`UPDATE crm_clients SET ${sets.join(",")} WHERE id=?`).bind(...params).run();
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
    await db.prepare("DELETE FROM crm_clients WHERE id=?").bind(id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
