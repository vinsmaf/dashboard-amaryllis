/**
 * Rate limiter léger basé sur D1
 * Usage : await rateLimit(db, { key, limit, windowSec })
 * Retourne { ok: boolean, remaining: number, retryAfter: number }
 *
 * Table créée automatiquement (idempotent).
 * Nettoyage auto des entrées expirées à chaque appel.
 */

export async function rateLimit(db, { key, limit = 5, windowSec = 900 }) {
  if (!db) return { ok: true, remaining: limit, retryAfter: 0 };

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSec;

  try {
    // Créer la table si elle n'existe pas
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS rate_limits_v2 (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        key        TEXT NOT NULL,
        ts         INTEGER NOT NULL
      )
    `).run();
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_rate_limits_v2_key_ts ON rate_limits_v2 (key, ts)
    `).run();

    // Nettoyage des entrées expirées (probabilistique : 1/10 pour éviter le surcoût)
    if (Math.random() < 0.1) {
      await db.prepare("DELETE FROM rate_limits_v2 WHERE ts < ?").bind(windowStart).run();
    }

    // Compter les tentatives dans la fenêtre
    const { results } = await db
      .prepare("SELECT COUNT(*) as cnt FROM rate_limits_v2 WHERE key = ? AND ts >= ?")
      .bind(key, windowStart)
      .all();

    const count = results[0]?.cnt ?? 0;

    if (count >= limit) {
      // Trouver quand la plus ancienne tentative expire
      const oldest = await db
        .prepare("SELECT MIN(ts) as t FROM rate_limits_v2 WHERE key = ? AND ts >= ?")
        .bind(key, windowStart)
        .first();
      const retryAfter = oldest?.t ? (oldest.t + windowSec) - now : windowSec;
      return { ok: false, remaining: 0, retryAfter: Math.max(1, retryAfter) };
    }

    // Enregistrer la tentative
    await db.prepare("INSERT INTO rate_limits_v2 (key, ts) VALUES (?, ?)").bind(key, now).run();
    return { ok: true, remaining: limit - count - 1, retryAfter: 0 };

  } catch (err) {
    // En cas d'erreur D1, on laisse passer (fail-open — mieux que bloquer tous les users)
    console.error("[ratelimit] erreur D1:", err.message);
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
}
