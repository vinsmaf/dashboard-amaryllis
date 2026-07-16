// Cloudflare Pages Function — GET /api/sync-health
// Agrège la santé du pipeline de synchro résas (4 canaux) pour l'onglet admin
// "Santé synchro" (2026-07-16) : heartbeat du Worker (D1 sync_heartbeat, écrit par
// runSync() toutes les 10 min), anomalies de cohérence ouvertes (client_errors), annulations
// 7 jours glissants (Direct D1 + Nogent API Beds24 — même sources que le digest hebdo Worker),
// et santé du token Beds24. Lecture seule, aucune écriture.
import { verifyBearer } from "./_adminauth.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

async function authOk(request, env) {
  const secretOk = !!env.POSTSTAY_SECRET && new URL(request.url).searchParams.get("secret") === env.POSTSTAY_SECRET;
  if (secretOk) return true;
  const { ok } = await verifyBearer(request, env);
  return ok;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await authOk(request, env))) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  // ── Heartbeat Worker (dernière exécution de runSync, toutes les 10 min) ──
  let heartbeat = null;
  try {
    const row = await db.prepare(
      "SELECT last_run_at, events_count, new_count, cancelled_count, direct_count, failed_feeds FROM sync_heartbeat WHERE id=1"
    ).first();
    if (row) {
      const ageMinutes = Math.round((Date.now() / 1000 - row.last_run_at) / 60);
      let failedFeeds = [];
      try { failedFeeds = JSON.parse(row.failed_feeds || "[]"); } catch { /* legacy/vide */ }
      heartbeat = {
        lastRunAt: row.last_run_at,
        ageMinutes,
        eventsCount: row.events_count,
        newCount: row.new_count,
        cancelledCount: row.cancelled_count,
        directCount: row.direct_count,
        failedFeeds,
        // Cron toutes les 10 min — au-delà de 20 min, 2 exécutions manquées.
        healthy: ageMinutes <= 20 && failedFeeds.length === 0,
      };
    }
  } catch (e) { console.error("[sync-health] heartbeat:", e.message); }

  // ── Anomalies de cohérence ouvertes (dernier run cron 9h UTC) ──
  let coherence = { openCount: 0, criticalCount: 0, recent: [] };
  try {
    await db.prepare(
      "CREATE TABLE IF NOT EXISTS client_errors (id TEXT PRIMARY KEY, kind TEXT NOT NULL, message TEXT, stack TEXT, path TEXT, url TEXT, ua TEXT, viewport TEXT, comment TEXT, screenshot TEXT, severity TEXT, status TEXT NOT NULL DEFAULT 'new', count INTEGER NOT NULL DEFAULT 1, backlog_id TEXT, first_seen INTEGER NOT NULL DEFAULT (unixepoch()), last_seen INTEGER)"
    ).run();
    const rows = await db.prepare(
      "SELECT id, message, severity, last_seen FROM client_errors WHERE kind='coherence' AND status NOT IN ('fixed','ignored') ORDER BY last_seen DESC LIMIT 5"
    ).all();
    const list = rows?.results || [];
    coherence = {
      openCount: list.length,
      criticalCount: list.filter(r => r.severity === "critique").length,
      recent: list.map(r => ({ message: r.message, severity: r.severity, lastSeen: r.last_seen })),
    };
  } catch (e) { console.error("[sync-health] coherence:", e.message); }

  // ── Annulations 7j — Direct (D1) + Nogent (API Beds24 live) ──
  // Airbnb/Booking (comptage KV cancel_log) volontairement absent ici : ce KV n'est bindé
  // que sur le Worker, pas sur ce projet Pages — déjà couvert par le digest hebdo email.
  let cancelDirect = { count: 0, eur: 0 };
  try {
    const row = await db.prepare(
      `SELECT COUNT(*) as cnt, COALESCE(SUM(CAST(total AS REAL) / 100.0), 0) as rev
       FROM direct_bookings WHERE status='cancelled' AND cancelled_at >= unixepoch('now', '-7 days')`
    ).first();
    cancelDirect = { count: row?.cnt || 0, eur: Math.round(row?.rev || 0) };
  } catch (e) { console.error("[sync-health] cancelDirect:", e.message); }

  let cancelNogent = { count: 0, eur: 0 };
  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const siteUrl = env.SITE_URL || new URL(request.url).origin;
    const r = await fetch(`${siteUrl}/api/beds24-bookings?modifiedFrom=${since}&status=2&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
    const data = await r.json().catch(() => ({}));
    const list = Array.isArray(data.bookings) ? data.bookings : [];
    cancelNogent = { count: list.length, eur: Math.round(list.reduce((s, b) => s + (b.price || 0), 0)) };
  } catch (e) { console.error("[sync-health] cancelNogent:", e.message); }

  // ── Token Beds24 ──
  let beds24Token = null;
  try {
    const row = await db.prepare("SELECT expires_at FROM beds24_tokens WHERE id=1 LIMIT 1").first();
    if (row?.expires_at) {
      const expiresInDays = Math.round((row.expires_at - Date.now() / 1000) / 86400);
      beds24Token = { expiresInDays, healthy: expiresInDays > 7 };
    }
  } catch (e) { console.error("[sync-health] beds24Token:", e.message); }

  return json({
    ok: true,
    fetchedAt: new Date().toISOString(),
    heartbeat,
    coherence,
    cancellations7d: { direct: cancelDirect, nogent: cancelNogent },
    beds24Token,
  });
}
