// GET /api/revenue-summary
// Endpoint stable et versionné exposant CA/nuits/occupation/charges/cashflow/adr par bien par
// mois — 12 derniers mois + YTD. Conçu pour être consommé par patrimoine-dashboard (Chantier B1,
// remplace le scraping interne côté patrimoine par un contrat JSON stable). Auth :
// ?secret=POSTSTAY_SECRET ou Bearer admin (même pattern que send-prix-alert.js).
//
// Ne réinvente pas le calcul : source = action Apps Script "revenueSummarySource" (réutilise
// BIENS_MAP pour l'année courante, findHistTotalRow_/findHistNightsRow_/findChargesTotalRow_ pour
// l'année précédente — cf. appscript/SCRIPT_SHEETS.js). L'agrégation mensuelle/YTD est en JS pur
// (src/utils/revenueSummary.js).
//
// Cache KV (trouvé 07/2026 : ~15-24s par appel, l'endpoint recalculait tout en live à chaque
// requête — trop lent pour le timeout 3s de /api/locatif côté patrimoine, qui retombait
// systématiquement sur son fallback Sheet et n'utilisait jamais cet endpoint en pratique).
// Réutilise CROSS_BRAIN_KV (déjà bindé côté Pages, cf. agents-run.js) plutôt qu'un nouveau
// namespace. Stale-while-revalidate : sert le cache immédiatement même expiré (sous HARD_TTL),
// rafraîchit en arrière-plan via waitUntil dès que SOFT_TTL est dépassé — aucun appelant ne
// retombe sur le calcul synchrone après le tout premier appel (ou après HARD_TTL d'inactivité).
import { verifyBearer } from "./_adminauth.js";
import { ALL_BIENS } from "../../src/data/biens.js";
import { buildRevenueSummary } from "../../src/utils/revenueSummary.js";

const json = (d, s = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", ...extraHeaders } });

const CACHE_KEY = "cache:revenue-summary:v1";
const SOFT_TTL_MS = 20 * 60 * 1000;      // au-delà : servir le cache mais rafraîchir en tâche de fond
const HARD_TTL_MS = 24 * 60 * 60 * 1000; // au-delà : trop vieux, calcul synchrone obligatoire

async function computeSummary(base, env) {
  const proxySecret = `secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`;
  const res = await fetch(`${base}/api/sheets-proxy?${proxySecret}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "revenueSummarySource" }),
  });
  const sourceData = await res.json();
  if (!sourceData?.ok) throw new Error("Source Apps Script invalide: " + JSON.stringify(sourceData));

  const bienIds = ALL_BIENS.map((b) => b.id);
  return buildRevenueSummary(sourceData.years, bienIds, new Date());
}

async function refreshCache(base, env) {
  const summary = await computeSummary(base, env);
  await env.CROSS_BRAIN_KV.put(CACHE_KEY, JSON.stringify({ data: summary, cachedAt: Date.now() }), { expirationTtl: 86400 });
  return summary;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const secretOk = !!env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  if (!secretOk) {
    const { ok: adminOk } = await verifyBearer(request, env);
    if (!adminOk) return json({ error: "Non autorisé" }, 401);
  }

  const base = `${url.protocol}//${url.host}`;
  const cacheHeaders = { "Cache-Control": "public, max-age=1200, s-maxage=1200" };

  let cached = null;
  if (env.CROSS_BRAIN_KV) {
    try {
      const raw = await env.CROSS_BRAIN_KV.get(CACHE_KEY);
      if (raw) cached = JSON.parse(raw);
    } catch { /* cache corrompu — traité comme absent, recalcul normal */ }
  }

  const age = cached ? Date.now() - cached.cachedAt : Infinity;
  if (cached && age < HARD_TTL_MS) {
    if (age > SOFT_TTL_MS) {
      context.waitUntil(refreshCache(base, env).catch(() => {})); // échec silencieux : on retente au prochain appel
    }
    return json(cached.data, 200, { ...cacheHeaders, "X-Cache": age > SOFT_TTL_MS ? "STALE" : "HIT" });
  }

  let summary;
  try {
    summary = env.CROSS_BRAIN_KV ? await refreshCache(base, env) : await computeSummary(base, env);
  } catch (e) {
    return json({ error: "Source Apps Script injoignable ou invalide", detail: String(e) }, 502);
  }

  return json(summary, 200, { ...cacheHeaders, "X-Cache": "MISS" });
}
