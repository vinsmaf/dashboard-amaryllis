// GET /api/meta-insights — Données audience Meta complètes (FB + IG)
// Auth : ?secret=POSTSTAY_SECRET  OU Bearer admin
// Cache CDN 4h (stats journalières)
//
// Retourne :
//  facebook  : fans + reach + impressions (organic/paid) avec séries
//  instagram : followers + profile_views + website_clicks + reach + impressions + saves + accounts_engaged
//  audience  : top pays des followers IG (démographie)

import { verifyBearer } from "./_adminauth.js";

const GV   = "v25.0";
const BASE = `https://graph.facebook.com/${GV}`;

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=14400",
  },
});

async function gGet(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${BASE}/${path}${sep}access_token=${token}`);
  return r.json();
}

// Série journalière pour un ensemble de métriques en un seul appel
async function getInsights(id, metrics, days, token) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - days * 86400;
  const data = await gGet(
    `${id}/insights?metric=${metrics.join(",")}&period=day&since=${since}&until=${until}`,
    token
  );
  if (data.error) return { error: data.error.message };
  const result = {};
  for (const item of (data.data || [])) {
    result[item.name] = (item.values || []).map(v => ({
      date: (v.end_time || "").slice(0, 10),
      value: v.value || 0,
    }));
  }
  return result;
}

function delta(series, n) {
  if (!series || series.length < 2) return null;
  const last = series[series.length - 1]?.value || 0;
  const ref  = series[Math.max(0, series.length - n)]?.value || last;
  return last - ref;
}

function wrapSeries(series) {
  if (!series) return null;
  return { series, delta_7j: delta(series, 7), delta_30j: delta(series, 30) };
}

// Démographie followers IG par pays (API v17+)
async function getCountries(igId, token) {
  try {
    const data = await gGet(
      `${igId}/insights?metric=follower_demographics&period=lifetime&timeframe=last_30_days&breakdown=country`,
      token
    );
    if (data.error) return null;
    const vals = data.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];
    if (!vals.length) return null;
    const total = vals.reduce((s, v) => s + (v.value || 0), 0) || 1;
    return vals
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map(v => ({ country: v.dimension_values?.[0] || "?", count: v.value || 0, pct: Math.round((v.value / total) * 100) }));
  } catch { return null; }
}

export async function onRequestGet({ request, env }) {
  const url      = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: bearerOk } = await verifyBearer(request, env);
  if (!secretOk && !bearerOk) return json({ error: "Non autorisé" }, 401);

  const token  = env.META_PAGE_TOKEN;
  const pageId = env.META_PAGE_ID;
  const igId   = env.META_IG_ACCOUNT_ID;

  if (!token || !pageId) return json({ error: "META_PAGE_TOKEN ou META_PAGE_ID non configuré" }, 500);

  const days = parseInt(url.searchParams.get("days") || "30", 10);

  const [
    fbFansSeries,
    fbPageInsights,
    fbNow,
    igFollowerSeries,
    igInsights,
    igNow,
    countries,
  ] = await Promise.all([
    getInsights(pageId, ["page_fans_total"], days, token),
    getInsights(pageId, ["page_impressions", "page_impressions_organic", "page_impressions_paid", "page_reach", "page_post_engagements"], days, token),
    gGet(`${pageId}?fields=fan_count,followers_count,name`, token),
    igId ? getInsights(igId, ["follower_count"], days, token) : Promise.resolve({}),
    igId ? getInsights(igId, ["profile_views", "website_clicks", "reach", "impressions", "saves", "accounts_engaged"], days, token) : Promise.resolve({}),
    igId ? gGet(`${igId}?fields=followers_count,media_count,username`, token) : Promise.resolve(null),
    igId ? getCountries(igId, token) : Promise.resolve(null),
  ]);

  const fbFans = fbFansSeries.page_fans_total || [];

  return json({
    ok: true,
    generated_at: new Date().toISOString().slice(0, 16).replace("T", " "),
    days,
    facebook: {
      name:      fbNow.name || "Amaryllis Locations",
      fans:      fbNow.fan_count || fbNow.followers_count || 0,
      ...wrapSeries(fbFans),
      reach:              wrapSeries(fbPageInsights.page_reach),
      impressions:        wrapSeries(fbPageInsights.page_impressions),
      impressions_organic:wrapSeries(fbPageInsights.page_impressions_organic),
      impressions_paid:   wrapSeries(fbPageInsights.page_impressions_paid),
      post_engagements:   wrapSeries(fbPageInsights.page_post_engagements),
      error: fbFansSeries.error || null,
    },
    instagram: {
      username:  igNow?.username || "amaryllislocations",
      followers: igNow?.followers_count || 0,
      media_count: igNow?.media_count || 0,
      ...wrapSeries(igFollowerSeries.follower_count),
      profile_views:    wrapSeries(igInsights.profile_views),
      website_clicks:   wrapSeries(igInsights.website_clicks),
      reach:            wrapSeries(igInsights.reach),
      impressions:      wrapSeries(igInsights.impressions),
      saves:            wrapSeries(igInsights.saves),
      accounts_engaged: wrapSeries(igInsights.accounts_engaged),
      error: igInsights.error || igFollowerSeries.error || null,
    },
    audience: {
      countries,
    },
  });
}
