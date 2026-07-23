// GET /api/social-impact — Social Growth Manager : BOUCLE DE FEEDBACK (impact abonnés).
//
// Ferme la boucle mesure→décision→contenu→PUBLICATION→MESURE : pour chaque post social publié,
// compare le total d'abonnés (FB+IG) des jours suivants vs précédents. Répond à « ce post a-t-il
// fait gagner des abonnés ? » — et isole les posts issus de l'agent (source:growth-agent) pour
// juger SA performance vs la planification manuelle.
//
// Symétrique de /api/agents-impact (delta sessions GA4) mais sur les abonnés (D1 social_snapshots).
// Source abonnés : social_snapshots (brique 1) — pas d'appel externe, donc rapide et gratuit.
//
// Auth : Bearer admin ou ?secret=POSTSTAY_SECRET. Params : ?days=45 (1..120), ?window=2 (1..7).

import { verifyBearer } from "./_adminauth.js";
import { computeSocialImpacts } from "../../src/utils/socialImpact.js";

const json = (d, s = 200) =>
  new Response(JSON.stringify(d, null, 2), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: bearerOk } = await verifyBearer(request, env);
  if (!secretOk && !bearerOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 (revenue_manager) non lié" }, 500);

  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "45", 10) || 45, 1), 120);
  const windowDays = Math.min(Math.max(parseInt(url.searchParams.get("window") || "2", 10) || 2, 1), 7);
  const now = Math.floor(Date.now() / 1000);
  const since = now - days * 86400;

  try {
    // 1. Publications publiées sur la fenêtre (D1). brief porte le marqueur source:growth-agent.
    const { results: pubs } = await db.prepare(`
      SELECT id, scheduled_at, published_at, bien_id, format, brief
      FROM editorial_calendar
      WHERE status = 'published' AND COALESCE(published_at, scheduled_at) >= ?
      ORDER BY COALESCE(published_at, scheduled_at) ASC LIMIT 300
    `).bind(since).all();

    const publications = (pubs || []).map((r) => ({
      id: r.id,
      publishedAt: r.published_at || r.scheduled_at,
      bien_id: r.bien_id,
      format: r.format || "",
      brief: r.brief || "",
    }));

    // 2. Total abonnés FB+IG par jour (social_snapshots), sur la fenêtre élargie (windowDays de recul).
    //    On somme les plateformes mesurables par jour (jamais YouTube/GBP tant qu'ils ne remontent pas).
    const followersByDate = {};
    if (publications.length) {
      const histSince = new Date((since - (windowDays + 1) * 86400) * 1000).toISOString().slice(0, 10);
      const { results: snaps } = await db.prepare(`
        SELECT snapshot_date, SUM(followers) AS total
        FROM social_snapshots
        WHERE platform IN ('facebook','instagram') AND followers IS NOT NULL AND snapshot_date >= ?
        GROUP BY snapshot_date
      `).bind(histSince).all();
      for (const s of (snaps || [])) followersByDate[s.snapshot_date] = Number(s.total) || 0;
    }

    // 3. Deltas + résumés (global + growth-agent seul) — logique pure testée.
    const impact = computeSocialImpacts(publications, followersByDate, { windowDays });
    // On retire publishedAt (redondant avec date) et brief (peut être verbeux) de la réponse.
    const cleaned = impact.publications.map((p) => {
      const rest = { ...p };
      delete rest.publishedAt;
      delete rest.brief;
      return rest;
    });

    return json({
      ok: true, days, windowDays,
      history_days: Object.keys(followersByDate).length,
      publications: cleaned,
      summary: impact.summary,
      growth_agent: impact.growthAgentSummary,
      note: Object.keys(followersByDate).length < windowDays + 2
        ? "Historique abonnés trop court pour des deltas fiables — se remplit ~1 point/jour depuis le déploiement du tracking."
        : null,
    });
  } catch (err) {
    if (String(err.message || "").includes("no such table")) {
      return json({ ok: true, days, windowDays, publications: [], summary: { count: 0 }, growth_agent: { count: 0 }, hint: "no_table" });
    }
    return json({ error: String(err.message || err) }, 502);
  }
}
