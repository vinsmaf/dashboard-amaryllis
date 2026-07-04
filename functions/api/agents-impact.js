// GET /api/agents-impact — boucle de feedback des agents IA (v1).
// Croise les publications sociales (D1 editorial_calendar, status='published')
// avec les sessions quotidiennes GA4 : pour chaque publication, sessions des
// 2 jours suivants (J+1..J+2) vs baseline des 2 jours précédents (J-2..J-1),
// en absolu et en % — le jour J lui-même est neutre.
//
// Auth  : Bearer admin (token signé _adminauth.js, comme /api/contacts).
// Params: ?days=30 (fenêtre de publications analysée, 1..90)
//         ?window=2 (taille des fenêtres avant/après, 1..7)
//
// Réponse: { ok, days, windowDays, publications: [{ id, date, canaux, bien_id,
//            theme, titre, sessionsAvant, sessionsApres, delta, deltaPct,
//            incomplete }], summary: { count, completeCount, incompleteCount,
//            avgDelta, avgDeltaPct, best, worst } }
//
// Logique pure (fenêtres/deltas) : src/utils/agentsImpact.js (testée vitest).

import { verifyBearer } from "./_adminauth.js";
import { getAccessToken, runReport, parseReport } from "./_ga4.js";
import { computeImpacts, normalizeGa4Date } from "../../src/utils/agentsImpact.js";

const json = (d, s = 200) => Response.json(d, {
  status: s,
  headers: { "Content-Type": "application/json" },
});

// arch-009 : même politique que /api/contacts — bypass seulement si aucun secret (dev)
async function checkAuth(context) {
  if (!context.env.ADMIN_PASSWORD && !context.env.ADMIN_PWD) return true; // dev
  const { ok } = await verifyBearer(context.request, context.env);
  return ok;
}

export async function onRequestGet(context) {
  if (!(await checkAuth(context))) return json({ error: "Non autorisé" }, 401);

  const { env, request } = context;
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  const propertyId  = env.GA4_PROPERTY_ID;
  const clientEmail = env.GA4_CLIENT_EMAIL;
  const privateKey  = env.GA4_PRIVATE_KEY;
  if (!propertyId || !clientEmail || !privateKey) {
    return json({ error: "GA4 non configuré — secrets manquants" }, 503);
  }

  const url        = new URL(request.url);
  const days       = Math.min(Math.max(parseInt(url.searchParams.get("days")   || "30", 10) || 30, 1), 90);
  const windowDays = Math.min(Math.max(parseInt(url.searchParams.get("window") || "2",  10) || 2,  1), 7);

  try {
    // ── 1. Publications publiées sur les N derniers jours (D1) ──────────────
    // published_at est posé par le flux de publication ; fallback scheduled_at
    // pour d'anciennes lignes marquées published sans timestamp.
    const now   = Math.floor(Date.now() / 1000);
    const since = now - days * 86400;
    const { results } = await db.prepare(`
      SELECT id, scheduled_at, published_at, platform, bien_id, theme, variante, format, brief
      FROM editorial_calendar
      WHERE status = 'published'
        AND COALESCE(published_at, scheduled_at) >= ?
      ORDER BY COALESCE(published_at, scheduled_at) ASC
      LIMIT 200
    `).bind(since).all();

    const publications = (results || []).map(r => ({
      id:          r.id,
      publishedAt: r.published_at || r.scheduled_at,
      canaux:      r.platform,
      bien_id:     r.bien_id,
      theme:       r.theme,
      titre:       [r.theme, r.variante].filter(Boolean).join(" · ") || r.brief || "",
      format:      r.format || "",
    }));

    // ── 2. Sessions quotidiennes GA4 sur la fenêtre élargie ─────────────────
    // Il faut windowDays de recul AVANT la plus ancienne publication.
    let sessionsByDate = {};
    if (publications.length) {
      const token = await getAccessToken(clientEmail, privateKey);
      const report = await runReport(token, propertyId, {
        dimensions: [{ name: "date" }],
        metrics:    [{ name: "sessions" }],
        dateRanges: [{ startDate: `${days + windowDays + 1}daysAgo`, endDate: "today" }],
        orderBys:   [{ dimension: { dimensionName: "date" } }],
        limit:      250,
      });
      for (const row of parseReport(report)) {
        sessionsByDate[normalizeGa4Date(row.date)] = row.sessions || 0;
      }
    }

    // ── 3. Fenêtres avant/après + deltas (logique pure testée) ──────────────
    const impact = computeImpacts(publications, sessionsByDate, { windowDays });

    // publishedAt interne inutile dans la réponse
    const cleaned = impact.publications.map(({ publishedAt, ...rest }) => rest);

    return json({ ok: true, days, windowDays, publications: cleaned, summary: impact.summary });
  } catch (err) {
    // Table editorial_calendar pas encore créée → réponse vide plutôt que 500
    if (err.message?.includes("no such table")) {
      return json({ ok: true, days, windowDays, publications: [], summary: { count: 0, completeCount: 0, incompleteCount: 0, avgDelta: null, avgDeltaPct: null, best: null, worst: null }, hint: "no_table" });
    }
    return json({ error: err.message }, 502);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
