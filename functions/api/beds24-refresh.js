// Cloudflare Pages Function — GET /api/beds24-refresh
// arch-009 : Rotation automatique du token Beds24 V2.
// Vérifie l'expiration, rafraîchit si < 30 jours, stocke en D1.
// beds24-bookings.js lit le token D1 en priorité (via getActiveBeds24Token).
//
// Appel cron-job.org : 9h UTC chaque matin
// Auth : ?secret=BEDS24_REFRESH_SECRET (stocké comme secret Cloudflare)
//
// Secrets requis :
//   BEDS24_TOKEN            — token initial (Cloudflare Pages secret)
//   revenue_manager         — binding D1
//   BEDS24_REFRESH_SECRET   — clé cron (à créer dans Cloudflare)
//   NTFY_TOPIC              — push si refresh réussi ou alerte (optionnel)
//
// POST ?action=setToken (2026-07-23) : dépose un token frais directement en D1, Bearer admin
// requis. Nécessaire pour remplacer un token existant — getActiveBeds24Token() lit D1 EN
// PRIORITÉ sur env.BEDS24_TOKEN, donc changer le seul secret Cloudflare ne suffit pas tant
// que la ligne D1 n'a pas expiré (jusqu'à ~60j). Le token ne transite QUE par cet appel
// (fait par Vincent lui-même, jamais par Claude) — jamais lu/reproduit dans la réponse.

import { verifyBearer } from "./_adminauth.js";

const THRESHOLD_DAYS = 30; // on rafraîchit quand il reste < 30 jours

async function ensureTokenTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS beds24_tokens (
      id           INTEGER PRIMARY KEY,
      token        TEXT    NOT NULL,
      expires_at   INTEGER NOT NULL,
      refreshed_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `).run();
}

export async function onRequestGet(context) {
  const { env, request } = context;

  // ── Auth secret ───────────────────────────────────────────────────────────
  const refreshSecret = env.BEDS24_REFRESH_SECRET;
  if (refreshSecret) {
    const url = new URL(request.url);
    if (url.searchParams.get("secret") !== refreshSecret) {
      return json({ error: "Non autorisé" }, 401);
    }
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  // ── Obtenir le token actif (D1 > env) ────────────────────────────────────
  const currentToken = await getActiveBeds24Token(env, db);
  if (!currentToken) return json({ error: "BEDS24_TOKEN manquant" }, 503);

  try {
    await ensureTokenTable(db);

    // ── 1. Vérifier l'expiration ──────────────────────────────────────────
    const detailsRes = await fetch("https://beds24.com/api/v2/authentication/details", {
      headers: { token: currentToken },
      signal: AbortSignal.timeout(8000),
    });
    const details = await detailsRes.json();

    if (!details.validToken) {
      return json({ ok: false, error: "Token actuel invalide", raw: details }, 400);
    }

    const expiresIn = details.token?.expiresIn ?? null;
    const daysLeft = expiresIn !== null ? Math.round(expiresIn / 86400) : null;

    // ── 2. Pas besoin de rafraîchir encore ───────────────────────────────
    if (daysLeft !== null && daysLeft > THRESHOLD_DAYS) {
      return json({
        ok: true,
        action: "skipped",
        daysLeft,
        message: `Token valide encore ${daysLeft}j — refresh pas nécessaire (seuil ${THRESHOLD_DAYS}j)`,
      });
    }

    // ── 3. Appel refresh Beds24 V2 ────────────────────────────────────────
    const refreshRes = await fetch("https://beds24.com/api/v2/authentication/refresh", {
      method: "GET",
      headers: { token: currentToken },
      signal: AbortSignal.timeout(8000),
    });

    if (!refreshRes.ok) {
      const errText = await refreshRes.text();
      return json({ ok: false, error: `Beds24 refresh HTTP ${refreshRes.status}`, detail: errText.slice(0, 200) }, 502);
    }

    const refreshData = await refreshRes.json();
    const newToken = refreshData.token?.token ?? refreshData.refreshToken ?? null;
    const newExpiresIn = refreshData.token?.expiresIn ?? null;

    if (!newToken) {
      return json({ ok: false, error: "Refresh OK mais pas de nouveau token dans la réponse", raw: refreshData }, 502);
    }

    // ── 4. Stocker en D1 ──────────────────────────────────────────────────
    const expiresAt = Math.floor(Date.now() / 1000) + (newExpiresIn ?? 60 * 86400);
    const now       = Math.floor(Date.now() / 1000);

    // Upsert : on garde toujours 1 seule ligne (id=1)
    await db.prepare(`
      INSERT INTO beds24_tokens (id, token, expires_at, refreshed_at)
      VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET token=excluded.token, expires_at=excluded.expires_at, refreshed_at=excluded.refreshed_at
    `).bind(newToken, expiresAt, now).run();

    console.log(`[beds24-refresh] Token renouvelé — expire dans ${Math.round((expiresAt - now) / 86400)}j`);

    // ── 5. Alerte ntfy ────────────────────────────────────────────────────
    if (env.NTFY_TOPIC) {
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=utf-8", "Title": "🔑 Beds24 token renouvelé", "Tags": "key,refresh", "Priority": "low" },
        body: `Nouveau token actif — expire dans ${Math.round((expiresAt - now) / 86400)} jours`,
      }).catch(() => {});
    }

    return json({
      ok: true,
      action: "refreshed",
      daysLeft: daysLeft,
      newExpiresIn: Math.round((expiresAt - now) / 86400),
      message: "Token Beds24 renouvelé et stocké en D1",
    });

  } catch (err) {
    console.error("[beds24-refresh] erreur:", err);
    return json({ ok: false, error: err.message }, 500);
  }
}

// ── Helper partagé : token actif (D1 si frais, sinon env) ──────────────────
// Exporté pour usage dans beds24-bookings.js
export async function getActiveBeds24Token(env, db) {
  if (db) {
    try {
      const row = await db.prepare(
        "SELECT token, expires_at FROM beds24_tokens WHERE id=1 LIMIT 1"
      ).first();
      if (row && row.token && row.expires_at > Math.floor(Date.now() / 1000) + 3600) {
        return row.token; // token D1 valide (plus d'1h de marge)
      }
    } catch { /* table pas encore créée → fallback env */ }
  }
  return env.BEDS24_TOKEN || null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS, POST" },
  });
}

// POST ?action=setToken — dépose directement un token (issu de l'échange d'un invite code
// Beds24, write:bookings) en D1, en écrasant toute ligne existante. Seul moyen de faire
// primer un nouveau token sur celui déjà en D1 (cf. commentaire d'en-tête). Bearer admin
// obligatoire — jamais appelé par Claude, uniquement par Vincent depuis son terminal.
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (url.searchParams.get("action") !== "setToken") {
    return json({ error: "action inconnue (attendu ?action=setToken)" }, 400);
  }

  const auth = await verifyBearer(request, env);
  if (!auth.ok) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  const token = String(body.token || "").trim();
  if (!token) return json({ error: "Champ requis : token" }, 400);

  // Valide le token auprès de Beds24 avant de l'adopter — jamais stocker une valeur invalide.
  let details;
  try {
    const res = await fetch("https://beds24.com/api/v2/authentication/details", {
      headers: { token },
      signal: AbortSignal.timeout(8000),
    });
    details = await res.json();
  } catch (e) {
    return json({ error: `Vérification Beds24 échouée : ${e.message}` }, 502);
  }
  if (!details.validToken) return json({ error: "Token rejeté par Beds24 (invalide)", raw: details }, 400);

  const expiresIn = details.token?.expiresIn ?? 60 * 86400;
  const scopes = details.token?.scopes || null;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + expiresIn;

  try {
    await ensureTokenTable(db);
    await db.prepare(`
      INSERT INTO beds24_tokens (id, token, expires_at, refreshed_at)
      VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET token=excluded.token, expires_at=excluded.expires_at, refreshed_at=excluded.refreshed_at
    `).bind(token, expiresAt, now).run();
  } catch (e) {
    return json({ error: `Écriture D1 échouée : ${e.message}` }, 500);
  }

  // Jamais renvoyer le token dans la réponse — seulement sa validité et ses scopes.
  return json({ ok: true, action: "setToken", scopes, expiresInDays: Math.round(expiresIn / 86400) });
}
