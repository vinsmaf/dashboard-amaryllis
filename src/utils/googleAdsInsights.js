// src/utils/googleAdsInsights.js
// Logique pure : normalise la réponse GAQL de l'API Google Ads (GoogleAdsService.searchStream)
// en KPIs exploitables par l'agent budget pub — MÊME forme de sortie que metaAdsInsights.js
// pour que l'agent traite les 2 canaux uniformément. Aucun appel réseau ici (testable).
//
// Brique 1b (MESURE, canal Google) du chantier agent budget pub. READ-ONLY : uniquement du
// reporting, jamais de mutate.

// La requête GAQL utilisée par l'endpoint (lecture seule, agrégée sur la fenêtre demandée) :
//   SELECT campaign.name, metrics.cost_micros, metrics.impressions, metrics.clicks,
//          metrics.conversions, metrics.conversions_value
//   FROM campaign WHERE segments.date DURING <window>
export function buildGaql(dateRange = "LAST_30_DAYS") {
  return (
    "SELECT campaign.id, campaign.name, campaign.advertising_channel_type, " +
    "metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, " +
    "metrics.conversions_value FROM campaign WHERE segments.date DURING " + dateRange
  );
}

function safeRatio(num, den, digits = 2) {
  if (!den || den <= 0) return null;
  const r = num / den;
  return Number.isFinite(r) ? Number(r.toFixed(digits)) : null;
}

// Une ligne GAQL (objet {campaign:{...}, metrics:{...}}) → KPIs normalisés.
// cost_micros = coût en millionièmes de la devise du compte → ÷ 1e6 pour des euros.
export function normalizeGaqlRow(row) {
  const c = row.campaign || {};
  const m = row.metrics || {};
  const spend = Number(m.costMicros ?? m.cost_micros ?? 0) / 1e6;
  const impressions = Number(m.impressions || 0);
  const clicks = Number(m.clicks || 0);
  const purchases = Number(m.conversions || 0); // conversions = "Achat" importé depuis GA4
  const revenue = Number(m.conversionsValue ?? m.conversions_value ?? 0);
  return {
    name: c.name || "—",
    id: c.id || null,
    channelType: c.advertisingChannelType || c.advertising_channel_type || null,
    spend: Number(spend.toFixed(2)),
    impressions,
    clicks,
    purchases: Number(purchases.toFixed(2)),
    revenue: Number(revenue.toFixed(2)),
    cpa: safeRatio(spend, purchases),
    roas: safeRatio(revenue, spend),
    ctr: safeRatio(clicks * 100, impressions),
    cpc: safeRatio(spend, clicks),
  };
}

// searchStream renvoie un TABLEAU de batches, chacun `{results:[...]}`. On aplatit.
export function parseGoogleAdsStream(streamResponse) {
  const batches = Array.isArray(streamResponse) ? streamResponse : [streamResponse];
  const rows = [];
  for (const b of batches) {
    for (const r of b?.results || []) rows.push(normalizeGaqlRow(r));
  }
  return rows;
}

export function aggregateGoogleAds(rows) {
  const acc = { spend: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0 };
  for (const r of rows) {
    acc.spend += r.spend || 0;
    acc.impressions += r.impressions || 0;
    acc.clicks += r.clicks || 0;
    acc.purchases += r.purchases || 0;
    acc.revenue += r.revenue || 0;
  }
  return {
    ...acc,
    spend: Number(acc.spend.toFixed(2)),
    revenue: Number(acc.revenue.toFixed(2)),
    cpa: safeRatio(acc.spend, acc.purchases),
    roas: safeRatio(acc.revenue, acc.spend),
    ctr: safeRatio(acc.clicks * 100, acc.impressions),
    cpc: safeRatio(acc.spend, acc.clicks),
  };
}

// Même sémantique honnête que côté Meta : ne pas laisser l'agent arbitrer sur un ROAS
// non mesurable. Google Ads a le tracking conversion "Achat" (import GA4) déjà en place,
// donc `ok` dès qu'il y a de la dépense + des conversions.
export function googleAdsHealth(totals) {
  const hasSpend = totals.spend > 0;
  const hasConv = totals.purchases > 0 || totals.revenue > 0;
  if (!hasSpend) return { status: "no_spend", canComputeRoas: false, message: "Aucune dépense Google Ads sur la fenêtre." };
  if (!hasConv) return { status: "traffic_only", canComputeRoas: false, message: "Dépense Google Ads sans conversion trackée sur la fenêtre — ROAS non calculable." };
  return { status: "ok", canComputeRoas: true, message: "Dépense + conversions Google Ads : ROAS/CAC exploitables." };
}

// Fenêtres GAQL supportées (mappées depuis ?window= côté endpoint).
export const GAQL_RANGES = { "7d": "LAST_7_DAYS", "14d": "LAST_14_DAYS", "30d": "LAST_30_DAYS", "90d": "LAST_90_DAYS" };
