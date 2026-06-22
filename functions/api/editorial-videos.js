// Cloudflare Pages Function — /api/editorial-videos
// Whitelist des vidéos AUTORISÉES pour la génération de Reels (sélectionnées
// par Vincent dans l'onglet « Vidéos publiables »). Le catalogue des vidéos
// disponibles vient du manifeste statique public/videos-manifest.json.
//
// GET                       → { ok, videos: { bien: ["reel-geko.mp4",...] } }
// POST ?bien=geko           body { videos: ["reel-geko.mp4"] } → REMPLACE la sélection
//
// Auth : admin (Bearer) OU ?secret=POSTSTAY_SECRET.

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const BIENS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];

const DDL = `
CREATE TABLE IF NOT EXISTS editorial_videos (
  bien_id    TEXT NOT NULL,
  filename   TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (bien_id, filename)
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
    const { results } = await db.prepare("SELECT bien_id, filename FROM editorial_videos").all();
    const videos = {};
    for (const b of BIENS) videos[b] = [];
    for (const r of results || []) (videos[r.bien_id] ||= []).push(r.filename);
    return json({ ok: true, videos });
  }

  if (request.method === "POST") {
    const bien = url.searchParams.get("bien");
    if (!BIENS.includes(bien)) return json({ error: "param bien invalide" }, 400);
    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body.videos)) return json({ error: "body.videos[] requis" }, 400);

    const list = [...new Set(body.videos.filter((f) => typeof f === "string" && f.endsWith(".mp4")))];
    await db.prepare("DELETE FROM editorial_videos WHERE bien_id=?").bind(bien).run();
    for (const f of list) {
      await db.prepare("INSERT OR IGNORE INTO editorial_videos (bien_id, filename) VALUES (?,?)").bind(bien, f).run();
    }
    return json({ ok: true, bien, count: list.length, videos: list });
  }

  return json({ error: "méthode non supportée" }, 405);
}
