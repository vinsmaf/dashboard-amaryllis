// GET /api/meta-insights — Évolution followers FB + IG (30j / 90j)
// Auth : ?secret=POSTSTAY_SECRET  OU Bearer admin
// Cache CDN 4h (stats journalières, pas besoin de temps réel)

import { verifyBearer } from "./_adminauth.js";

const GV   = "v25.0";
const BASE = `https://graph.facebook.com/${GV}`;

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=14400", // 4h
  },
});

async function gGet(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${BASE}/${path}${sep}access_token=${token}`);
  return r.json();
}

// Retourne un tableau [{ end_time, value }] sur les N derniers jours
async function getInsight(id, metric, period, days, token) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - days * 86400;
  const data = await gGet(
    `${id}/insights?metric=${metric}&period=${period}&since=${since}&until=${until}`,
    token
  );
  if (data.error) return { error: data.error.message, data: [] };
  const series = (data.data?.[0]?.values || []).map(v => ({
    date: (v.end_time || "").slice(0, 10),
    value: v.value || 0,
  }));
  return { data: series };
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

  // Parallel : FB fans + IG followers + counts actuels
  const [fbSeries, igSeries, fbNow, igNow] = await Promise.all([
    getInsight(pageId, "page_fans_total", "day", days, token),
    igId ? getInsight(igId, "follower_count", "day", days, token) : Promise.resolve({ data: [] }),
    gGet(`${pageId}?fields=fan_count,followers_count,name`, token),
    igId ? gGet(`${igId}?fields=followers_count,username`, token) : Promise.resolve(null),
  ]);

  // Delta J-7 / J-30
  function delta(series, n) {
    const s = series.data || [];
    if (s.length < 2) return null;
    const last  = s[s.length - 1]?.value || 0;
    const ref   = s[Math.max(0, s.length - n)]?.value || last;
    return last - ref;
  }

  return json({
    ok: true,
    generated_at: new Date().toISOString().slice(0, 16).replace("T", " "),
    days,
    facebook: {
      name:      fbNow.name || "Amaryllis Locations",
      fans:      fbNow.fan_count || fbNow.followers_count || 0,
      delta_7j:  delta(fbSeries, 7),
      delta_30j: delta(fbSeries, 30),
      series:    fbSeries.data || [],
      error:     fbSeries.error || null,
    },
    instagram: {
      username:  igNow?.username || "amaryllislocations",
      followers: igNow?.followers_count || 0,
      delta_7j:  delta(igSeries, 7),
      delta_30j: delta(igSeries, 30),
      series:    igSeries.data || [],
      error:     igSeries.error || null,
    },
  });
}
