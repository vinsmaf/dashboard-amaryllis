// functions/api/attribution-survey.js
// NIVEAU 3 de la mesure pub (doctrine Vincent 2026-07-23) : le questionnaire post-achat.
//
// Les plateformes s'auto-attribuent leurs résultats et sont aveugles à tout ce qui se passe
// hors de leur écosystème (bouche-à-oreille, retour d'un ancien voyageur, recommandation d'un
// concierge). Demander directement au client « comment nous avez-vous connu ? » est la seule
// source d'attribution qu'aucune plateforme n'a intérêt à biaiser — et c'est elle qui doit
// arbitrer la répartition du budget entre Google / Meta / autre.
//
// POST : public (le voyageur répond depuis /merci), rate-limité, une seule réponse par résa.
// GET  : admin — ventilation agrégée (logique pure `src/utils/adFinanceKpis.js`).

import { verifyBearer } from "./_adminauth.js";
import { rateLimit } from "./_ratelimit.js";
import { declaredAttribution } from "../../src/utils/adFinanceKpis.js";

// Liste fermée : une saisie libre produirait 40 orthographes du même canal, inexploitables.
// `autre` porte un texte libre séparé (`detail`), lu à la main, jamais agrégé automatiquement.
export const SOURCES = [
  "google", "instagram", "facebook", "youtube", "airbnb", "booking",
  "bouche-a-oreille", "deja-client", "panneau-local", "autre",
];

const DDL = `CREATE TABLE IF NOT EXISTS attribution_survey (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_ref  TEXT,
  source       TEXT NOT NULL,
  detail       TEXT,
  bien_id      TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function ensureTable(db) {
  try { await db.prepare(DDL).run(); } catch { /* déjà créée */ }
  try { await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_attrib_ref ON attribution_survey(booking_ref)").run(); } catch { /* idem */ }
}

export async function onRequestPost({ request, env }) {
  const db = env.revenue_manager;
  if (!db) return json({ error: "Base indisponible" }, 503);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rl = await rateLimit(db, { key: `attrib-survey:${ip}`, limit: 10, windowSec: 3600 });
  if (!rl.ok) return json({ error: "Trop de requêtes" }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const source = String(body.source || "").trim().toLowerCase();
  if (!SOURCES.includes(source)) return json({ error: "Source inconnue" }, 400);

  const bookingRef = String(body.booking_ref || "").trim().slice(0, 120) || null;
  const detail = source === "autre" ? String(body.detail || "").trim().slice(0, 200) || null : null;
  const bienId = String(body.bien_id || "").trim().slice(0, 40) || null;

  await ensureTable(db);
  try {
    // Une seule réponse par réservation (index unique) — un client qui recharge la page de
    // confirmation ne doit pas peser deux fois dans la ventilation.
    await db.prepare(
      "INSERT INTO attribution_survey (booking_ref, source, detail, bien_id) VALUES (?, ?, ?, ?)"
    ).bind(bookingRef, source, detail, bienId).run();
  } catch {
    return json({ ok: true, already: true }); // réponse déjà enregistrée : succès idempotent
  }
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: bearerOk } = await verifyBearer(request, env);
  if (!secretOk && !bearerOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "Base indisponible" }, 503);
  await ensureTable(db);

  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "365", 10) || 365, 7), 1095);
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const { results } = await db.prepare(
    "SELECT source, COUNT(*) AS count FROM attribution_survey WHERE created_at >= ? GROUP BY source"
  ).bind(since).all();

  const { results: libres } = await db.prepare(
    "SELECT detail, created_at FROM attribution_survey WHERE source = 'autre' AND detail IS NOT NULL AND created_at >= ? ORDER BY created_at DESC LIMIT 30"
  ).bind(since).all();

  return json({
    ok: true,
    days,
    ...declaredAttribution(results || []),
    reponses_libres: (libres || []).map((r) => r.detail),
    niveau: 3,
    usage: "Arbitrer l'allocation du budget entre canaux. Non biaisé par les plateformes, mais déclaratif.",
  });
}
