// GET /api/revenue-summary
// Endpoint stable et versionné exposant CA/nuits/occupation par bien par mois — 12 derniers
// mois + YTD. Conçu pour être consommé par patrimoine-dashboard (Chantier B1, remplace le
// scraping interne côté patrimoine par un contrat JSON stable). Auth : ?secret=POSTSTAY_SECRET
// ou Bearer admin (même pattern que send-prix-alert.js).
//
// Ne réinvente pas le calcul : source = action Apps Script "revenueSummarySource" (réutilise
// BIENS_MAP pour l'année courante, findHistTotalRow_/findHistNightsRow_ pour l'année précédente
// — cf. appscript/SCRIPT_SHEETS.js). L'agrégation mensuelle/YTD est en JS pur (src/utils/revenueSummary.js).
import { verifyBearer } from "./_adminauth.js";
import { ALL_BIENS } from "../../src/data/biens.js";
import { buildRevenueSummary } from "../../src/utils/revenueSummary.js";

const json = (d, s = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", ...extraHeaders } });

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const secretOk = !!env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  if (!secretOk) {
    const { ok: adminOk } = await verifyBearer(request, env);
    if (!adminOk) return json({ error: "Non autorisé" }, 401);
  }

  const base = `${url.protocol}//${url.host}`;
  const proxySecret = `secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`;
  let sourceData;
  try {
    const res = await fetch(`${base}/api/sheets-proxy?${proxySecret}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revenueSummarySource" }),
    });
    sourceData = await res.json();
  } catch {
    return json({ error: "Source Apps Script injoignable" }, 502);
  }
  if (!sourceData?.ok) return json({ error: "Source Apps Script invalide", detail: sourceData }, 502);

  const bienIds = ALL_BIENS.map((b) => b.id);
  const summary = buildRevenueSummary(sourceData.years, bienIds, new Date());

  return json(summary, 200, {
    "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  });
}
