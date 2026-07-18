// functions/api/maintenance.js
// Suivi maintenance préventive — D1 table `maintenance`
// GET    /api/maintenance         → liste (filtres: ?bien_id= ?category= ?status=)
// POST   /api/maintenance         → créer une intervention
// PATCH  /api/maintenance?id=     → modifier
// DELETE /api/maintenance?id=     → supprimer

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const VALID_STATUS   = ["a_planifier", "planifie", "fait"];
const VALID_CATEGORY = ["clim", "piscine", "jacuzzi", "jardin", "plomberie", "electricite", "structure", "qualite", "autre"];

// Photos : même convention que sign-contract.js (dataURL JPEG compressée côté client,
// ~300-400Ko, cf. compressImage() dans MaintenanceTab.jsx). Vidéos : jamais uploadées dans
// ce stack (doctrine multimédia du projet — externaliser au-delà de quelques Mo), juste un
// lien externe (Google Photos, WhatsApp, etc.) stocké tel quel.
const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 400_000;

// db.exec() (D1) découpe l'entrée par saut de ligne : un template literal multi-lignes
// classique casse la requête en fragments invalides. Toujours construire le DDL en une
// seule ligne (concaténation), comme client-errors.js / voyageur-feedback.js.
export async function initTable(db) {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS maintenance (" +
    "id TEXT PRIMARY KEY," +
    "bien_id TEXT NOT NULL DEFAULT 'tous'," +
    "category TEXT NOT NULL DEFAULT 'autre'," +
    "titre TEXT NOT NULL," +
    "prestataire TEXT DEFAULT ''," +
    "cost INTEGER DEFAULT 0," +
    "status TEXT NOT NULL DEFAULT 'a_planifier'," +
    "scheduled_at TEXT," +
    "done_at TEXT," +
    "next_due_at TEXT," +
    "notes TEXT DEFAULT ''," +
    "created_at INTEGER NOT NULL DEFAULT (unixepoch())," +
    "updated_at INTEGER NOT NULL DEFAULT (unixepoch())" +
    ")"
  );
  await db.exec("CREATE INDEX IF NOT EXISTS idx_maint_status ON maintenance(status)");
  await db.exec("CREATE INDEX IF NOT EXISTS idx_maint_bien ON maintenance(bien_id)");
  // Ajoutées 2026-07-18 (reco Resp. Logistique) — ALTER guardé pour les tables déjà existantes.
  try { await db.prepare("ALTER TABLE maintenance ADD COLUMN photos TEXT").run(); } catch { /* déjà présente */ }
  try { await db.prepare("ALTER TABLE maintenance ADD COLUMN video_url TEXT").run(); } catch { /* déjà présente */ }
}

function validatePhotos(photos) {
  if (photos === undefined) return { ok: true, value: undefined };
  if (photos === null) return { ok: true, value: null };
  if (!Array.isArray(photos)) return { ok: false, error: "photos doit être un tableau" };
  if (photos.length > MAX_PHOTOS) return { ok: false, error: `Maximum ${MAX_PHOTOS} photos` };
  if (photos.some((p) => typeof p !== "string" || !p.startsWith("data:image/")))
    return { ok: false, error: "Format photo invalide" };
  if (photos.some((p) => p.length > MAX_PHOTO_BYTES))
    return { ok: false, error: "Une photo dépasse la taille maximale" };
  return { ok: true, value: photos.length ? JSON.stringify(photos) : null };
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "DB non configurée" }, 500);

  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  await initTable(db);

  // ── GET ─────────────────────────────────────────────────────────────────
  if (request.method === "GET") {
    const bienId   = url.searchParams.get("bien_id");
    const category = url.searchParams.get("category");
    const status   = url.searchParams.get("status");

    let q = "SELECT * FROM maintenance WHERE 1=1";
    const p = [];
    if (bienId)   { q += " AND bien_id=?";   p.push(bienId); }
    if (category) { q += " AND category=?";  p.push(category); }
    if (status)   { q += " AND status=?";    p.push(status); }
    // Tri : à_planifier > planifié > fait, puis par date prévue
    q += " ORDER BY CASE status WHEN 'a_planifier' THEN 0 WHEN 'planifie' THEN 1 ELSE 2 END, scheduled_at ASC, created_at DESC";

    const { results } = await db.prepare(q).bind(...p).all();
    return json({ ok: true, records: results || [] });
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (request.method === "POST") {
    let body = {};
    try { body = await request.json(); } catch {}
    if (!body.titre?.trim()) return json({ error: "titre requis" }, 400);

    const photosCheck = validatePhotos(body.photos);
    if (!photosCheck.ok) return json({ error: photosCheck.error }, 400);

    const id = "maint-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    await db.prepare(
      "INSERT INTO maintenance (id,bien_id,category,titre,prestataire,cost,status,scheduled_at,done_at,next_due_at,notes,photos,video_url) " +
      "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(
      id,
      body.bien_id || "tous",
      VALID_CATEGORY.includes(body.category) ? body.category : "autre",
      body.titre.trim(),
      body.prestataire || "",
      parseInt(body.cost) || 0,
      VALID_STATUS.includes(body.status) ? body.status : "a_planifier",
      body.scheduled_at || null,
      body.done_at || null,
      body.next_due_at || null,
      body.notes || "",
      photosCheck.value ?? null,
      body.video_url || null,
    ).run();
    return json({ ok: true, id });
  }

  // ── PATCH ────────────────────────────────────────────────────────────────
  if (request.method === "PATCH") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "id requis" }, 400);
    let body = {};
    try { body = await request.json(); } catch {}

    const sets = [], binds = [];
    if (body.bien_id !== undefined)     { sets.push("bien_id=?");      binds.push(body.bien_id); }
    if (body.category !== undefined && VALID_CATEGORY.includes(body.category))
                                         { sets.push("category=?");     binds.push(body.category); }
    if (body.titre !== undefined)        { sets.push("titre=?");        binds.push(body.titre); }
    if (body.prestataire !== undefined)  { sets.push("prestataire=?");  binds.push(body.prestataire); }
    if (body.cost !== undefined)         { sets.push("cost=?");         binds.push(parseInt(body.cost) || 0); }
    if (body.status !== undefined && VALID_STATUS.includes(body.status))
                                         { sets.push("status=?");       binds.push(body.status); }
    if (body.scheduled_at !== undefined) { sets.push("scheduled_at=?"); binds.push(body.scheduled_at || null); }
    if (body.done_at !== undefined)      { sets.push("done_at=?");      binds.push(body.done_at || null); }
    if (body.next_due_at !== undefined)  { sets.push("next_due_at=?");  binds.push(body.next_due_at || null); }
    if (body.notes !== undefined)        { sets.push("notes=?");        binds.push(body.notes); }
    if (body.video_url !== undefined)    { sets.push("video_url=?");    binds.push(body.video_url || null); }
    if (body.photos !== undefined) {
      const photosCheck = validatePhotos(body.photos);
      if (!photosCheck.ok) return json({ error: photosCheck.error }, 400);
      sets.push("photos=?"); binds.push(photosCheck.value ?? null);
    }
    if (!sets.length) return json({ error: "rien à modifier" }, 400);

    sets.push("updated_at=unixepoch()");
    binds.push(id);
    await db.prepare(`UPDATE maintenance SET ${sets.join(",")} WHERE id=?`).bind(...binds).run();
    return json({ ok: true });
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "id requis" }, 400);
    await db.prepare("DELETE FROM maintenance WHERE id=?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Méthode non autorisée" }, 405);
}
