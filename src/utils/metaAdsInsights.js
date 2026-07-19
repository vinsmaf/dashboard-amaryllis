// src/utils/metaAdsInsights.js
// Logique pure : normalise la réponse Graph API "insights" (perfs des campagnes Meta Ads)
// en KPIs exploitables par l'agent budget pub. Aucun appel réseau ici — testable sans mock.
//
// Brique 1 (MESURE) du chantier "agent budget pub" : sans perfs réelles par canal, aucun
// arbitrage n'est possible. Cet endpoint est la source de vérité côté Meta.

// Meta encode les résultats dans un tableau `actions` [{action_type, value}]. Les types utiles
// varient selon l'objectif : trafic → "landing_page_view"/"link_click" ; conversion → un des
// types "purchase" (le pixel peut remonter sous plusieurs alias selon la config).
const PURCHASE_TYPES = [
  "purchase",
  "offsite_conversion.fb_pixel_purchase",
  "onsite_web_purchase",
  "web_in_store_purchase",
];

function sumActions(actions, types) {
  if (!Array.isArray(actions)) return 0;
  let total = 0;
  for (const a of actions) {
    if (types.includes(a.action_type)) total += Number(a.value) || 0;
  }
  return total;
}

function firstAction(actions, type) {
  if (!Array.isArray(actions)) return 0;
  const hit = actions.find((a) => a.action_type === type);
  return hit ? Number(hit.value) || 0 : 0;
}

// Arrondi monétaire/ratio sûr : jamais NaN/Infinity qui casserait un calcul en aval.
function safeRatio(num, den, digits = 2) {
  if (!den || den <= 0) return null;
  const r = num / den;
  if (!Number.isFinite(r)) return null;
  return Number(r.toFixed(digits));
}

// Normalise une ligne d'insight (une campagne, ou un ad set, ou tout le compte) en KPIs.
export function normalizeInsightRow(row) {
  const spend = Number(row.spend) || 0;
  const impressions = Number(row.impressions) || 0;
  const clicks = Number(row.clicks) || 0;
  const landingPageViews = firstAction(row.actions, "landing_page_view");
  const linkClicks = firstAction(row.actions, "link_click");
  const purchases = sumActions(row.actions, PURCHASE_TYPES);
  const revenue = sumActions(row.action_values, PURCHASE_TYPES);
  return {
    name: row.campaign_name || row.adset_name || row.account_name || "—",
    id: row.campaign_id || row.adset_id || null,
    spend: Number(spend.toFixed(2)),
    impressions,
    clicks,
    linkClicks,
    landingPageViews,
    purchases,
    revenue: Number(revenue.toFixed(2)),
    // Coût par vue de page (objectif trafic) — le KPI actionnable tant qu'il n'y a pas d'achats.
    costPerLandingView: safeRatio(spend, landingPageViews),
    // Coût par acquisition + ROAS — n'ont de sens QUE si le tracking purchase remonte.
    cpa: safeRatio(spend, purchases),
    roas: safeRatio(revenue, spend),
    ctr: safeRatio(clicks * 100, impressions), // en %
    cpc: safeRatio(spend, clicks),
  };
}

export function parseInsights(rawData) {
  return (Array.isArray(rawData) ? rawData : []).map(normalizeInsightRow);
}

// Agrège plusieurs lignes (canal Meta global) — sommes réelles, ratios recalculés sur les
// totaux (jamais une moyenne de ratios, qui serait fausse).
export function aggregateInsights(rows) {
  const acc = { spend: 0, impressions: 0, clicks: 0, linkClicks: 0, landingPageViews: 0, purchases: 0, revenue: 0 };
  for (const r of rows) {
    acc.spend += r.spend || 0;
    acc.impressions += r.impressions || 0;
    acc.clicks += r.clicks || 0;
    acc.linkClicks += r.linkClicks || 0;
    acc.landingPageViews += r.landingPageViews || 0;
    acc.purchases += r.purchases || 0;
    acc.revenue += r.revenue || 0;
  }
  return {
    ...acc,
    spend: Number(acc.spend.toFixed(2)),
    revenue: Number(acc.revenue.toFixed(2)),
    costPerLandingView: safeRatio(acc.spend, acc.landingPageViews),
    cpa: safeRatio(acc.spend, acc.purchases),
    roas: safeRatio(acc.revenue, acc.spend),
    ctr: safeRatio(acc.clicks * 100, acc.impressions),
    cpc: safeRatio(acc.spend, acc.clicks),
  };
}

// Diagnostic honnête : l'agent NE DOIT PAS arbitrer si le tracking conversion est muet — il
// piloterait à l'aveugle. On expose explicitement l'état de la mesure plutôt que de le masquer.
export function measurementHealth(totals) {
  const hasSpend = totals.spend > 0;
  const hasPurchaseTracking = totals.purchases > 0 || totals.revenue > 0;
  let status, message;
  if (!hasSpend) {
    status = "no_spend";
    message = "Aucune dépense sur la fenêtre — campagnes en pause ou pas encore lancées. Rien à mesurer.";
  } else if (!hasPurchaseTracking) {
    status = "traffic_only";
    message = "Dépense détectée mais 0 achat tracké : le ROAS n'est pas calculable. Optimiser sur le coût/vue tant que le tracking purchase (Google Ads import + Pixel/CAPI Meta) n'est pas confirmé.";
  } else {
    status = "ok";
    message = "Dépense + conversions trackées : ROAS/CAC exploitables pour l'arbitrage.";
  }
  return { status, canComputeRoas: hasPurchaseTracking && hasSpend, message };
}
