// Cloudflare Pages Function — /api/editorial-photos
// Whitelist des photos AUTORISÉES à la publication réseaux (les « plus belles »,
// choisies par Vincent dans l'onglet « Photos publiables »). Le gate d'auto-publication
// (_editorialGate.js) refuse tout post dont la photo n'est pas dans cette liste.
// La liste des photos DISPONIBLES vient du manifeste statique public/photos-manifest.json.
//
// GET                       → { ok, photos: { bien: ["01","03",...] } }  (toute la whitelist)
// POST ?bien=amaryllis      body { photos: ["01","03",...] } → REMPLACE la sélection du bien
//
// Auth : admin (Bearer) OU ?secret=POSTSTAY_SECRET (cron/serveur).

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const BIENS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];
const norm = (p) => String(parseInt(p, 10)).padStart(2, "0"); // "5" → "05", "03" → "03"

const DDL = `
CREATE TABLE IF NOT EXISTS editorial_photos (
  bien_id    TEXT NOT NULL,
  photo      TEXT NOT NULL,                       -- numéro de base "01".."NN" (cf. photos-manifest.json)
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (bien_id, photo)
);`;

async function ensureTable(db) {
  try { await db.prepare(DDL).run(); } catch {}
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' introuvable" }, 503);
  await ensureTable(db);

  if (request.method === "GET") {
    const { results } = await db.prepare("SELECT bien_id, photo FROM editorial_photos").all();
    const photos = {};
    for (const b of BIENS) photos[b] = [];
    for (const r of results || []) (photos[r.bien_id] ||= []).push(r.photo);
    for (const b of Object.keys(photos)) photos[b].sort((a, z) => Number(a) - Number(z));
    return json({ ok: true, photos });
  }

  if (request.method === "POST") {
    const bien = url.searchParams.get("bien");
    if (!BIENS.includes(bien)) return json({ error: "param bien invalide" }, 400);
    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body.photos)) return json({ error: "body.photos[] requis" }, 400);

    const list = [...new Set(body.photos.map(norm).filter((p) => /^\d{2,}$/.test(p)))];
    // Remplace intégralement la sélection du bien (toggle UI → save complet)
    await db.prepare("DELETE FROM editorial_photos WHERE bien_id=?").bind(bien).run();
    for (const p of list) {
      await db.prepare("INSERT OR IGNORE INTO editorial_photos (bien_id, photo) VALUES (?,?)").bind(bien, p).run();
    }
    return json({ ok: true, bien, count: list.length, photos: list });
  }

  return json({ error: "méthode non supportée" }, 405);
}
