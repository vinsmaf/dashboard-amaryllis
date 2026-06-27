// GET    /api/reclamations               → liste (admin)
// POST   /api/reclamations               → créer une réclamation (public, rate-limited)
// PATCH  /api/reclamations?id=xxx        → mettre à jour statut/notes/geste (admin)
//
// Table D1 `reclamations` auto-créée au premier appel.

import { rateLimit } from "./_ratelimit.js";
import { verifyBearer } from "./_adminauth.js";

const DDL = `
CREATE TABLE IF NOT EXISTS reclamations (
  id TEXT PRIMARY KEY,
  voyageur_email TEXT,
  voyageur_nom TEXT,
  bien_id TEXT,
  booking_id TEXT,
  canal TEXT NOT NULL DEFAULT 'direct',
  objet TEXT NOT NULL,
  description TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ouvert',
  priorite TEXT NOT NULL DEFAULT 'normale',
  geste_commercial TEXT,
  notes_internes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  resolved_at INTEGER
)`;

const json = (d, s = 200) => Response.json(d, {
  status: s,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

function uid() {
  return "rec_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function ensureTable(db) {
  await db.exec(DDL);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  await ensureTable(db);

  const url = new URL(request.url);
  const statut = url.searchParams.get("statut") || "";
  const bien = url.searchParams.get("bien") || "";
  const canal = url.searchParams.get("canal") || "";

  let q = "SELECT * FROM reclamations";
  const params = [];
  const conds = [];
  if (statut) { conds.push("statut=?"); params.push(statut); }
  if (bien)   { conds.push("bien_id=?"); params.push(bien); }
  if (canal)  { conds.push("canal=?"); params.push(canal); }
  if (conds.length) q += " WHERE " + conds.join(" AND ");
  q += " ORDER BY created_at DESC LIMIT 200";

  try {
    const { results } = await db.prepare(q).bind(...params).all();
    return json({ items: results || [] });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  await ensureTable(db);

  // Rate limit : 3 soumissions / IP / heure
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rl = await rateLimit(db, { key: `reclamation:${ip}`, limit: 3, windowSec: 3600 });
  if (!rl.ok) return json({ error: "Trop de soumissions, réessayez dans 1h." }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const { voyageur_email, voyageur_nom, bien_id, booking_id, canal = "direct", objet, description, priorite = "normale" } = body;

  if (!objet?.trim() || !description?.trim()) {
    return json({ error: "objet et description requis" }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const id = uid();

  try {
    await db.prepare(
      `INSERT INTO reclamations (id, voyageur_email, voyageur_nom, bien_id, booking_id, canal, objet, description, statut, priorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ouvert', ?, ?, ?)`
    ).bind(id, voyageur_email || null, voyageur_nom || null, bien_id || null, booking_id || null, canal, objet.trim(), description.trim(), priorite, now, now).run();

    // Alerte ntfy si priorite urgente
    if (priorite === "urgente" && env.NTFY_TOPIC) {
      fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain", "Title": `⚠️ Réclamation urgente — ${bien_id || "bien inconnu"}`, "Priority": "urgent" },
        body: `De : ${voyageur_nom || voyageur_email || "anonyme"}\n${objet}\n${description.slice(0, 200)}`,
      }).catch(() => {});
    }

    return json({ ok: true, id });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPatch(context) {
  const { env, request } = context;
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "id requis" }, 400);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const allowed = ["statut", "priorite", "geste_commercial", "notes_internes"];
  const updates = [];
  const params = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(body[key]);
    }
  }

  if (!updates.length) return json({ error: "Rien à mettre à jour" }, 400);

  const now = Math.floor(Date.now() / 1000);
  updates.push("updated_at = ?");
  params.push(now);

  // resolved_at si on passe à résolu
  if (body.statut === "resolu") {
    updates.push("resolved_at = ?");
    params.push(now);
  }

  params.push(id);

  try {
    await db.prepare(
      `UPDATE reclamations SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...params).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
