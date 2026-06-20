// functions/api/promo-codes.js
// Gestion des codes promo : génération + listing
//
// GET  /api/promo-codes?validate=CODE&bien_id=X → public, rate-limited (widget réservation)
// GET  /api/promo-codes?active=1  → liste codes (auth requise)
// POST /api/promo-codes           → génère un code unique + insert D1 (auth requise)
//   Body: { type: "percent"|"amount_eur", value: 10, validity_days: 14,
//           bien_id?: "amaryllis", for_email?: "x@y.com", note?: "...", max_uses?: 1 }

import { verifyBearer } from "./_adminauth.js";
import { rateLimit } from "./_ratelimit.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const RANDOM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I/L

function randomSuffix(len = 4) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += RANDOM_ALPHABET[bytes[i] % RANDOM_ALPHABET.length];
  return out;
}

function buildPrefix(email) {
  if (!email) return "AMARYL";
  const local = String(email).split("@")[0] || "";
  const clean = local.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.slice(0, 6) || "AMARYL";
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  // ── Route publique : GET ?validate=CODE — pas d'auth requise ──────────────
  if (request.method === "GET" && url.searchParams.get("validate")) {
    try {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const rl = await rateLimit(db, { key: `promo_validate:${ip}`, limit: 10, windowSec: 60 });
      if (!rl.ok) return json({ error: "Trop de tentatives, réessayez dans 1 minute" }, 429);

      const code = url.searchParams.get("validate").trim().toUpperCase();
      const bienId = url.searchParams.get("bien_id") || null;
      const now = Date.now();

      const row = await db.prepare(
        `SELECT code, type, value, bien_id, expires_at, max_uses, used_count
         FROM promo_codes WHERE code = ? LIMIT 1`
      ).bind(code).first();

      if (!row) return json({ valid: false, error: "Code invalide" }, 404);
      if (row.expires_at < now) return json({ valid: false, error: "Code expiré" }, 410);
      if (row.used_count >= row.max_uses) return json({ valid: false, error: "Code déjà utilisé" }, 410);
      if (row.bien_id && bienId && row.bien_id !== bienId)
        return json({ valid: false, error: "Code non valable pour ce logement" }, 409);

      return json({
        valid: true,
        code: row.code,
        type: row.type,
        value: row.value,
        bien_id: row.bien_id,
      });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── Routes protégées (auth Bearer ou ?secret) ──────────────────────────────
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  try {
    if (request.method === "GET") {
      const onlyActive = url.searchParams.get("active") === "1";
      const now = Date.now();
      const sql = onlyActive
        ? `SELECT code, type, value, bien_id, expires_at, max_uses, used_count, created_at, created_for, note
           FROM promo_codes
           WHERE expires_at > ? AND used_count < max_uses
           ORDER BY created_at DESC LIMIT 200`
        : `SELECT code, type, value, bien_id, expires_at, max_uses, used_count, created_at, created_for, note
           FROM promo_codes
           ORDER BY created_at DESC LIMIT 200`;

      const stmt = onlyActive ? db.prepare(sql).bind(now) : db.prepare(sql);
      const { results } = await stmt.all();
      return json({ codes: results || [] });
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const type = body.type === "amount_eur" ? "amount_eur" : "percent";
      const value = parseInt(body.value, 10);
      const validityDays = parseInt(body.validity_days, 10) || 14;
      const bienId = body.bien_id || null;
      const forEmail = body.for_email || null;
      const note = body.note || null;
      const maxUses = parseInt(body.max_uses, 10) || 1;

      if (!value || value < 1 || value > 9999) return json({ error: "value invalide (1-9999)" }, 400);
      if (type === "percent" && value > 99) return json({ error: "percent max 99" }, 400);
      if (validityDays < 1 || validityDays > 365) return json({ error: "validity_days 1-365" }, 400);
      if (maxUses < 1 || maxUses > 999) return json({ error: "max_uses 1-999" }, 400);

      const prefix = buildPrefix(forEmail);
      const now = Date.now();
      const expiresAt = now + validityDays * 86400_000;
      let code = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const candidate = `${prefix}-${randomSuffix(4)}`;
        try {
          await db
            .prepare(
              `INSERT INTO promo_codes (code, type, value, bien_id, expires_at, max_uses, used_count, created_at, created_for, note)
             VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
            )
            .bind(candidate, type, value, bienId, expiresAt, maxUses, now, forEmail, note)
            .run();
          code = candidate;
          break;
        } catch (e) {
          if (!/UNIQUE|already exists/i.test(String(e.message || ""))) throw e;
        }
      }
      if (!code) return json({ error: "Impossible de générer un code unique (3 collisions)" }, 500);

      return json({
        ok: true,
        code,
        expires_at: expiresAt,
        valid_for_days: validityDays,
        type,
        value,
        bien_id: bienId,
      });
    }

    return json({ error: "Méthode non supportée" }, 405);
  } catch (e) {
    return json({ error: e.message, stack: (e.stack || "").slice(0, 300) }, 500);
  }
}
