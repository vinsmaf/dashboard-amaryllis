// Cloudflare Pages Function — GET /api/analytics
// Proxy vers Google Analytics Data API v1beta (GA4)
// Auth : Service Account JWT → Bearer token
//
// Secrets requis dans Cloudflare Pages :
//   GA4_PROPERTY_ID   — ID numérique GA4 (ex: 123456789)
//   GA4_CLIENT_EMAIL  — email du service account
//   GA4_PRIVATE_KEY   — clé privée PEM (avec \n littéraux)
//
// Helpers GA4 (JWT service account, runReport, parse) factorisés dans _ga4.js
// (partagés avec /api/agents-impact).

import { getAccessToken, runReport, runReportSafe, parseReport } from "./_ga4.js";

export async function onRequestGet(context) {
  const { env } = context;

  const propertyId  = env.GA4_PROPERTY_ID;
  const clientEmail = env.GA4_CLIENT_EMAIL;
  const privateKey  = env.GA4_PRIVATE_KEY;

  if (!propertyId || !clientEmail || !privateKey) {
    return json({ error: "GA4 non configuré — secrets manquants", missing: { propertyId: !propertyId, clientEmail: !clientEmail, privateKey: !privateKey } }, 503);
  }

  try {
    const token = await getAccessToken(clientEmail, privateKey);

    // Exécuter les rapports en parallèle (data-006 : conversions par bien ; data-046 : funnel events)
    const [overview, pages, countries, sources, devices, bienConversions, funnel, revenue, byBien, byChannel, byChannel7d, funnelByBien] = await Promise.all([
      runReport(token, propertyId, {
        dimensions:  [{ name: "date" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "bounceRate" }, { name: "averageSessionDuration" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }, { startDate: "60daysAgo", endDate: "31daysAgo" }],
        orderBys:    [{ dimension: { dimensionName: "date" } }],
      }),
      runReport(token, propertyId, {
        dimensions:  [{ name: "pagePath" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }, { name: "averageSessionDuration" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
        limit:       15,
      }),
      runReport(token, propertyId, {
        dimensions:  [{ name: "country" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
        limit:       10,
      }),
      runReport(token, propertyId, {
        dimensions:  [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
        limit:       10,
      }),
      runReport(token, propertyId, {
        dimensions:  [{ name: "deviceCategory" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
      }),
      // data-006 : trafic + events par page bien (/amaryllis, /zandoli, etc.)
      runReport(token, propertyId, {
        dimensions:  [{ name: "pagePath" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "averageSessionDuration" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            inListFilter: { values: ["/amaryllis","/zandoli","/iguana","/geko","/mabouya","/schoelcher","/nogent"] },
          },
        },
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
      // data-046 : funnel complet (view_item → availability_ready → date_selected → begin_checkout → add_payment_info → purchase)
      runReport(token, propertyId, {
        dimensions:  [{ name: "eventName" }],
        metrics:     [{ name: "eventCount" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: { values: ["view_item", "availability_ready", "date_selected", "begin_checkout", "add_payment_info", "purchase", "generate_lead"] },
          },
        },
      }),
      // data-049 : revenu total 30j (€) — somme des "value" des events purchase
      runReportSafe(token, propertyId, {
        metrics:    [{ name: "totalRevenue" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      }),
      // data-049 : réservations + revenu PAR BIEN (dim custom bien_id, créée 2026-06-04 ;
      //            se remplit sous ~24-48h, vide avant — non bloquant grâce à runReportSafe)
      runReportSafe(token, propertyId, {
        dimensions: [{ name: "customEvent:bien_id" }],
        metrics:    [{ name: "eventCount" }, { name: "totalRevenue" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "purchase" } } },
        orderBys:   [{ metric: { metricName: "eventCount" }, desc: true }],
        limit:      20,
      }),
      // data-049 : sessions + réservations + revenu PAR CANAL d'acquisition
      runReportSafe(token, propertyId, {
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics:    [{ name: "sessions" }, { name: "ecommercePurchases" }, { name: "totalRevenue" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys:   [{ metric: { metricName: "sessions" }, desc: true }],
        limit:      12,
      }),
      // data-pub : canal 7j — pour la section "Performance Pub" (ads lancés récemment)
      runReportSafe(token, propertyId, {
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics:    [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        orderBys:   [{ metric: { metricName: "sessions" }, desc: true }],
        limit:      12,
      }),
      // data-funnel-bien : funnel complet × bien_id (disponible ~24h après déploiement events)
      runReportSafe(token, propertyId, {
        dimensions:  [{ name: "eventName" }, { name: "customEvent:bien_id" }],
        metrics:     [{ name: "eventCount" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: { values: ["view_item", "availability_ready", "date_selected", "begin_checkout", "add_payment_info", "purchase"] },
          },
        },
        orderBys: [{ dimension: { dimensionName: "eventName" } }],
        limit:    200,
      }),
    ]);

    // traf-011 : stale-while-revalidate — sert le cache pendant le refresh background
    return new Response(JSON.stringify({
      ok: true,
      overview:         parseReport(overview),
      pages:            parseReport(pages),
      countries:        parseReport(countries),
      sources:          parseReport(sources),
      devices:          parseReport(devices),
      bienConversions:  parseReport(bienConversions), // data-006
      funnel:           parseReport(funnel),           // data-046
      revenue:          parseReport(revenue),          // data-049 : revenu total €
      byBien:           parseReport(byBien),           // data-049 : résas + revenu / bien
      byChannel:        parseReport(byChannel),        // data-049 : résas + revenu / canal
      byChannel7d:      parseReport(byChannel7d),      // data-pub : canal 7j (perf pub)
      funnelByBien:     parseReport(funnelByBien),     // data-funnel-bien : funnel × bien_id
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });

  } catch (err) {
    return json({ error: err.message }, 502);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "s-maxage=300" },
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } });
}
