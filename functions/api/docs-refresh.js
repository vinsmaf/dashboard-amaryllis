// Cloudflare Pages Function — GET /api/docs-refresh
//
// Rafraîchit QUOTIDIENNEMENT les 2 SEULS docs stratégiques "factuels" (données
// ré-dérivables à la demande) : trafic SEO 30j (GA4) et signaux marché actuels
// par bien (D1 rm_market_signals). Stocke en D1 (table docs_snapshots) — AUCUN
// commit Git : une Cloudflare Function n'a pas d'accès filesystem en prod, donc
// ne peut de toute façon pas éditer docs/*.md. rag-ingest.js lit ces snapshots
// en direct (comme les avis/captions), en plus des docs statiques figés.
//
// ⚠️ Les docs légaux, stratégie et campagnes NE SONT JAMAIS auto-réécrits : un
// LLM qui régénère seul du contenu juridique/décisionnel sans nouvelle donnée
// réelle à intégrer ne "rafraîchit" rien, il hallucine une variation — risque
// discuté et écarté avec Vincent le 2026-07-04.
//
// Auth : ?secret=POSTSTAY_SECRET (cron quotidien) ou Bearer admin (déclenchement manuel).
// ?dry=1 calcule sans persister.

import { verifyBearer } from "./_adminauth.js";
import { getAccessToken, runReport, parseReport } from "./_ga4.js";
import { BIENS } from "./_biens.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json" },
});

async function ensureTable(db) {
  await db.exec("CREATE TABLE IF NOT EXISTS docs_snapshots (key TEXT PRIMARY KEY, content TEXT NOT NULL, generated_at INTEGER NOT NULL)");
}

async function buildSeoBaseline(env) {
  const propertyId = env.GA4_PROPERTY_ID, clientEmail = env.GA4_CLIENT_EMAIL, privateKey = env.GA4_PRIVATE_KEY;
  if (!propertyId || !clientEmail || !privateKey) return null;
  const token = await getAccessToken(clientEmail, privateKey);
  const report = await runReport(token, propertyId, {
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "averageSessionDuration" }],
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 15,
  });
  const rows = parseReport(report);
  if (!rows.length) return null;
  const lines = ["Trafic par page, 30 derniers jours (GA4) :", "| Page | Sessions | Users | Durée moy. (s) |", "|---|---|---|---|"];
  for (const r of rows) {
    lines.push(`| ${r.pagePath} | ${r.sessions} | ${r.totalUsers} | ${Math.round(r.averageSessionDuration || 0)} |`);
  }
  return lines.join("\n");
}

async function buildPricingSignals(env) {
  const db = env.revenue_manager;
  if (!db) return null;
  const { results } = await db.prepare(`
    SELECT s.property_id, s.price_median_cents, s.price_mean_cents, s.market_pressure_score,
           s.scarcity_score, s.vacancy_risk, s.market_label
    FROM rm_market_signals s
    INNER JOIN (SELECT property_id, MAX(signal_date) md FROM rm_market_signals GROUP BY property_id) latest
      ON s.property_id = latest.property_id AND s.signal_date = latest.md
    ORDER BY s.property_id
  `).all();
  if (!results?.length) return null;
  const lines = ["Signaux marché actuels par bien (D1 rm_market_signals) :", "| Bien | Prix médian marché | Pression | Rareté | Risque vacance | Label |", "|---|---|---|---|---|---|"];
  for (const r of results) {
    const nom = BIENS[r.property_id]?.nom || r.property_id;
    const prix = r.price_median_cents != null ? `${Math.round(r.price_median_cents / 100)}€` : "?";
    lines.push(`| ${nom} | ${prix} | ${r.market_pressure_score ?? "?"} | ${r.scarcity_score ?? "?"} | ${r.vacancy_risk ?? "?"} | ${r.market_label || "?"} |`);
  }
  return lines.join("\n");
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);
  await ensureTable(db);

  const dry = url.searchParams.get("dry") === "1";
  const now = Math.floor(Date.now() / 1000);
  const content = {};
  const errors = {};

  try {
    const seo = await buildSeoBaseline(env);
    if (seo) content["seo-baseline"] = seo;
  } catch (e) { errors["seo-baseline"] = e.message; }

  try {
    const pricing = await buildPricingSignals(env);
    if (pricing) content["pricing-signals"] = pricing;
  } catch (e) { errors["pricing-signals"] = e.message; }

  if (!dry) {
    for (const [key, text] of Object.entries(content)) {
      await db.prepare(
        "INSERT INTO docs_snapshots (key, content, generated_at) VALUES (?,?,?) " +
        "ON CONFLICT(key) DO UPDATE SET content=excluded.content, generated_at=excluded.generated_at"
      ).bind(key, text, now).run();
    }
  }

  return json({ ok: true, dry, generated: Object.keys(content), errors });
}
