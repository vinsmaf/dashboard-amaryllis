// Cloudflare Pages Function — GET /api/beds24-refresh
// ⚠️ 2026-07-24 : après un `wrangler pages secret put` sur une clé DÉJÀ existante (pas
// seulement une clé neuve, cf. RECALL), le déploiement Production déjà en ligne peut
// continuer à servir l'ANCIENNE valeur tant qu'aucun nouveau déploiement n'a eu lieu.
// Vérifié en direct : BEDS24_TOKEN mis à jour, `?test=1` restait sur les scopes lecture
// seule jusqu'à ce commit (qui force un redeploy). Toujours re-tester après déploiement,
// jamais supposer qu'un secret Cloudflare Pages est pris en compte immédiatement.
// Confirmé une 2e fois le même jour : vaut aussi pour une édition via le dashboard web
// (Settings → Environment variables → Edit), pas seulement `wrangler pages secret put`.
// arch-009 : Rotation automatique du token Beds24 V2.
// Vérifie l'expiration, rafraîchit si < 30 jours, stocke en D1.
// beds24-bookings.js lit le token D1 en priorité (via getActiveBeds24Token).
//
// Appel cron-job.org : 9h UTC chaque matin
// Auth : ?secret=BEDS24_REFRESH_SECRET (stocké comme secret Cloudflare)
//
// Secrets requis :
//   BEDS24_REFRESH_TOKEN    — long durée, SEULE source d'un token frais (cf. mintFromRefreshToken)
//   BEDS24_TOKEN            — token courant, filet si la ligne D1 est absente/périmée
//   revenue_manager         — binding D1
//   BEDS24_REFRESH_SECRET   — clé cron. ⚠️ NON configurée en prod au 2026-07-24 : le bloc
//                             d'auth du GET est conditionnel (`if (refreshSecret)`), donc
//                             l'endpoint est ouvert. Il ne divulgue aucun token, mais
//                             n'importe qui peut déclencher une rotation. À créer.
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
  // Accepte BEDS24_REFRESH_SECRET (clé historique dédiée) OU POSTSTAY_SECRET (idiome
  // serveur-à-serveur de tous les crons du Worker, cf. beds24-bookings.js). Sans ce 2e
  // accepteur l'endpoint était de fait OUVERT : BEDS24_REFRESH_SECRET n'a jamais été créé
  // en prod, donc le `if` ne s'armait jamais (constaté 2026-07-24).
  const accepted = [env.BEDS24_REFRESH_SECRET, env.POSTSTAY_SECRET].filter(Boolean);
  if (accepted.length) {
    const provided = new URL(request.url).searchParams.get("secret");
    if (!accepted.includes(provided)) return json({ error: "Non autorisé" }, 401);
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  try {
    await ensureTokenTable(db);

    // ── 1. Combien de temps reste-t-il au token actif (D1 > env) ? ────────
    // Un token absent ou déjà invalide ne fait PAS échouer la rotation : on repart du
    // refreshToken. Avant (2026-07-24), un `return` sur `!validToken` créait un blocage
    // définitif — le seul moment où on a besoin de renouveler est justement celui où le
    // token ne vaut plus rien.
    const currentToken = await getActiveBeds24Token(env, db);
    let daysLeft = null;

    if (currentToken) {
      const detailsRes = await fetch("https://beds24.com/api/v2/authentication/details", {
        headers: { token: currentToken },
        signal: AbortSignal.timeout(8000),
      });
      const details = await detailsRes.json();
      const expiresIn = details.validToken ? (details.token?.expiresIn ?? null) : null;
      daysLeft = expiresIn !== null ? Math.round(expiresIn / 86400) : null;

      // ── 2. Encore assez de marge → rien à faire ────────────────────────
      if (daysLeft !== null && daysLeft > THRESHOLD_DAYS) {
        return json({
          ok: true,
          action: "skipped",
          daysLeft,
          message: `Token valide encore ${daysLeft}j — refresh pas nécessaire (seuil ${THRESHOLD_DAYS}j)`,
        });
      }
    }

    // ── 3. Renouveler depuis le refreshToken ──────────────────────────────
    const minted = await mintFromRefreshToken(env, db);
    if (minted.error) {
      console.error("[beds24-refresh] rotation échouée", minted.error);
      return json({ ok: false, daysLeft, ...minted }, minted.status || 500);
    }

    console.log(`[beds24-refresh] Token renouvelé — expire dans ${minted.expiresInDays}j`);

    // ── 4. Alerte ntfy ────────────────────────────────────────────────────
    if (env.NTFY_TOPIC) {
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=utf-8", "Title": "🔑 Beds24 token renouvelé", "Tags": "key,refresh", "Priority": "low" },
        body: `Nouveau token actif — expire dans ${minted.expiresInDays} jours`,
      }).catch(() => {});
    }

    return json({
      ok: true,
      action: "refreshed",
      daysLeft,
      newExpiresIn: minted.expiresInDays,
      scopes: minted.scopes,
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

// POST ?action=setToken — dépose un token (issu de l'échange manuel d'un invite code Beds24,
// write:bookings) en D1, Bearer admin requis. Le token ne transite QUE par cet appel — jamais
// lu/saisi par Claude. POST ?action=fromRefreshToken — mint un token depuis
// env.BEDS24_REFRESH_TOKEN déjà configuré, sans aucun input : celui-ci peut être déclenché
// côté serveur sans manipulation de credential par personne.
//
// Valide un token auprès de Beds24 puis l'écrit en D1 (upsert id=1). Jamais de token
// invalide stocké. Ne renvoie que scopes + durée — jamais le token lui-même.
async function validateAndStore(db, token) {
  let details;
  try {
    const res = await fetch("https://beds24.com/api/v2/authentication/details", {
      headers: { token },
      signal: AbortSignal.timeout(8000),
    });
    details = await res.json();
  } catch (e) {
    return { error: `Vérification Beds24 échouée : ${e.message}`, status: 502 };
  }
  if (!details.validToken) return { error: "Token rejeté par Beds24 (invalide)", raw: details, status: 400 };

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
    return { error: `Écriture D1 échouée : ${e.message}`, status: 500 };
  }
  return { ok: true, scopes, expiresInDays: Math.round(expiresIn / 86400) };
}

// Forge un token frais depuis env.BEDS24_REFRESH_TOKEN et le stocke en D1.
// ⚠️ SEUL chemin de renouvellement qui fonctionne sur ce compte : Beds24 répond
// `500 Could not process request` sur /authentication/refresh (constaté en direct le
// 2026-07-24 avec un token pourtant valide et write-capable), alors que
// /authentication/token + header refreshToken marche — c'est déjà l'appel que fait
// beds24-create.js. Aucun credential ne transite par la requête entrante : la valeur
// vient du secret Cloudflare, donc l'appel est déclenchable côté serveur (cron).
async function mintFromRefreshToken(env, db) {
  const refreshToken = env.BEDS24_REFRESH_TOKEN;
  if (!refreshToken) return { error: "BEDS24_REFRESH_TOKEN manquant", status: 503 };

  let fresh;
  try {
    const res = await fetch("https://beds24.com/api/v2/authentication/token", {
      headers: { refreshToken },
      signal: AbortSignal.timeout(8000),
    });
    fresh = await res.json();
  } catch (e) {
    return { error: `Échange refreshToken échoué : ${e.message}`, status: 500 };
  }
  if (!fresh.token) return { error: "refreshToken invalide ou expiré", raw: fresh, status: 400 };

  return validateAndStore(db, fresh.token);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (action !== "setToken" && action !== "fromRefreshToken") {
    return json({ error: "action inconnue (attendu ?action=setToken ou ?action=fromRefreshToken)" }, 400);
  }

  const auth = await verifyBearer(request, env);
  if (!auth.ok) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  // fromRefreshToken (2026-07-24) : mint un NOUVEAU token à partir de env.BEDS24_REFRESH_TOKEN
  // (secret déjà en place, jamais lu/saisi ici) — utile quand le token court a expiré (24h)
  // sans qu'il faille refaire tout l'échange invite-code. Même mécanisme que
  // beds24-create.js:getAccessToken. Aucun input requis, donc déclenchable côté serveur.
  if (action === "fromRefreshToken") {
    const result = await mintFromRefreshToken(env, db);
    if (result.error) return json(result, result.status || 500);
    return json({ ok: true, action: "fromRefreshToken", scopes: result.scopes, expiresInDays: result.expiresInDays });
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  const token = String(body.token || "").trim();
  if (!token) return json({ error: "Champ requis : token" }, 400);

  const result = await validateAndStore(db, token);
  if (result.error) return json(result, result.status || 500);

  // Jamais renvoyer le token dans la réponse — seulement sa validité et ses scopes.
  return json({ ok: true, action: "setToken", scopes: result.scopes, expiresInDays: result.expiresInDays });
}
