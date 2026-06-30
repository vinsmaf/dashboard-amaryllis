// functions/api/booking-session.js
// GET  /api/booking-session       — statut de la session Booking.com stockée
// POST /api/booking-session       — enregistre un token ses= Booking.com
//
// Auth POST : ?secret=<POSTSTAY_SECRET>
//
// Usage (bookmarklet depuis admin.booking.com) :
//   1. Ouvrir admin.booking.com (être connecté)
//   2. Copier le token `ses=XXXX` depuis l'URL
//   3. POST vers cet endpoint avec { "ses": "XXXX" }
//
// Schéma D1 (auto-créé) :
//   CREATE TABLE IF NOT EXISTS app_config (
//     key TEXT PRIMARY KEY, value TEXT, updated_at TEXT
//   );

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

async function ensureTable(db) {
  try {
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )`
    ).run();
  } catch { /* déjà existante */ }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ env }) {
  const db = env.revenue_manager;
  if (!db) return json({ valid: false, error: "D1 indisponible" }, 503);

  try {
    await ensureTable(db);
    const row = await db.prepare(
      "SELECT value, updated_at FROM app_config WHERE key = 'booking_ses'"
    ).first();

    if (!row) return json({ valid: false, message: "Aucune session enregistrée — utilise le bookmarklet depuis admin.booking.com" });

    const updated   = new Date(row.updated_at);
    const daysSince = (Date.now() - updated.getTime()) / (1000 * 86400);
    const fresh     = daysSince < 30;

    return json({
      valid:      fresh,
      updated_at: row.updated_at,
      days_since: Math.round(daysSince),
      message:    fresh
        ? `✅ Session fraîche (${Math.round(daysSince)}j) — scraping auto actif`
        : `⚠️ Session ancienne (${Math.round(daysSince)}j) — à rafraîchir via bookmarklet`,
    });
  } catch (e) {
    return json({ valid: false, error: e.message }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  // Auth
  const url    = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (!secret || (secret !== env.POSTSTAY_SECRET && secret !== env.CLAUDE_SECRET)) {
    return json({ error: "Non autorisé" }, 401);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const ses = String(body.ses || "").trim();
  if (!ses || ses.length < 10) return json({ error: "Token ses invalide ou trop court" }, 422);

  try {
    await ensureTable(db);
    await db.prepare(
      `INSERT INTO app_config (key, value, updated_at)
       VALUES ('booking_ses', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET
         value      = excluded.value,
         updated_at = excluded.updated_at`
    ).bind(ses).run();

    console.log("[booking-session] ✅ Session Booking.com enregistrée");
    return json({ ok: true, updated_at: new Date().toISOString() });
  } catch (e) {
    return json({ error: "Erreur D1", message: e.message }, 500);
  }
}
