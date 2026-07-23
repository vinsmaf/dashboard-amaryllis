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

// Taux de conversion moyen appliqué au CPC sortant pour dériver un CPA IMPLICITE quand le
// tracking purchase est encore muet. C'est une HYPOTHÈSE, jamais un fait mesuré — surchargeable
// par `META_ASSUMED_CVR` et toujours exposée à côté du chiffre pour qu'elle reste lisible.
export const DEFAULT_ASSUMED_CVR = 0.02;

// Arrondi monétaire/ratio sûr : jamais NaN/Infinity qui casserait un calcul en aval.
function safeRatio(num, den, digits = 2) {
  if (!den || den <= 0) return null;
  const r = num / den;
  if (!Number.isFinite(r)) return null;
  return Number(r.toFixed(digits));
}

// Normalise une ligne d'insight (une campagne, ou un ad set, ou tout le compte) en KPIs.
export function normalizeInsightRow(row, opts = {}) {
  const assumedCvr = Number(opts.assumedCvr) > 0 ? Number(opts.assumedCvr) : DEFAULT_ASSUMED_CVR;
  const spend = Number(row.spend) || 0;
  const impressions = Number(row.impressions) || 0;
  const clicks = Number(row.clicks) || 0;
  // Personnes UNIQUES touchées (≠ impressions, qui recomptent chaque affichage).
  const reach = Number(row.reach) || 0;
  // Meta renvoie outbound_clicks comme tableau d'actions ; les clics sortants (vers le site)
  // sont le seul clic qui traduit une intention — les autres restent dans l'écosystème Meta.
  const outboundClicks = Array.isArray(row.outbound_clicks)
    ? row.outbound_clicks.reduce((s, a) => s + (Number(a.value) || 0), 0)
    : Number(row.outbound_clicks) || 0;
  const landingPageViews = firstAction(row.actions, "landing_page_view");
  const linkClicks = firstAction(row.actions, "link_click");
  const purchases = sumActions(row.actions, PURCHASE_TYPES);
  const revenue = sumActions(row.action_values, PURCHASE_TYPES);
  // Dimensions de ventilation (présentes uniquement si ?breakdown= est demandé). Sans elles, toutes
  // les lignes d'un breakdown retomberaient sur le même `name` et seraient indistinguables.
  const breakdown = [row.publisher_platform, row.platform_position, row.impression_device, row.country, row.user_segment_key]
    .filter(Boolean).join(" · ") || null;

  return {
    name: row.campaign_name || row.adset_name || row.account_name || "—",
    id: row.campaign_id || row.adset_id || null,
    ...(breakdown ? { breakdown } : {}),
    ...(row.publisher_platform ? { publisherPlatform: row.publisher_platform } : {}),
    ...(row.platform_position ? { platformPosition: row.platform_position } : {}),
    // Segment d'audience (nouvelles audiences / clients existants…) — présent uniquement avec
    // ?breakdown=audience. Alimente l'audit de sur-répétition (`src/utils/audienceSaturation.js`).
    ...(row.user_segment_key ? { userSegment: row.user_segment_key } : {}),
    spend: Number(spend.toFixed(2)),
    // ── MÉTRIQUES DE PILOTAGE (doctrine Vincent 2026-07-23) ─────────────────
    reach,
    frequency: safeRatio(impressions, reach),
    // CPMR = CPM × répétition = coût pour 1000 personnes RÉELLEMENT touchées. Contrairement au
    // CPM, il monte quand l'audience sature (on repaye pour les mêmes gens) → signal de rotation.
    cpmr: safeRatio(spend * 1000, reach),
    outboundClicks,
    // CPC sortant = coût d'un clic qui a réellement quitté Meta pour le site.
    outboundCpc: safeRatio(spend, outboundClicks),
    // CPA implicite = CPC sortant / taux de conversion supposé. HYPOTHÈSE (cvr affiché à côté),
    // utile tant que le tracking purchase est muet ; remplacé par `cpa` dès qu'il parle.
    impliedCpa: safeRatio(spend, outboundClicks * assumedCvr),
    assumedCvr,
    cpa: safeRatio(spend, purchases),
    // ── MÉTRIQUES DE CONTEXTE (à ne PAS utiliser pour arbitrer) ─────────────
    // impressions/clicks/ctr/cpm/roas restent exposés pour lecture et compatibilité, mais ne
    // pilotent aucune décision : ils mesurent l'exposition et la curiosité, pas l'acquisition.
    impressions,
    clicks,
    linkClicks,
    landingPageViews,
    purchases,
    revenue: Number(revenue.toFixed(2)),
    costPerLandingView: safeRatio(spend, landingPageViews),
    roas: safeRatio(revenue, spend),
    ctr: safeRatio(clicks * 100, impressions), // en %
    cpm: safeRatio(spend * 1000, impressions),
    cpc: safeRatio(spend, clicks),
  };
}

export function parseInsights(rawData, opts = {}) {
  return (Array.isArray(rawData) ? rawData : []).map((r) => normalizeInsightRow(r, opts));
}

// Agrège plusieurs lignes (canal Meta global) — sommes réelles, ratios recalculés sur les
// totaux (jamais une moyenne de ratios, qui serait fausse).
export function aggregateInsights(rows, opts = {}) {
  const assumedCvr = Number(opts.assumedCvr) > 0 ? Number(opts.assumedCvr) : DEFAULT_ASSUMED_CVR;
  const acc = { spend: 0, impressions: 0, clicks: 0, outboundClicks: 0, linkClicks: 0, landingPageViews: 0, purchases: 0, revenue: 0 };
  // ⚠️ La couverture N'EST PAS additive : une même personne touchée par 2 campagnes est comptée
  // 2× dans la somme. `reachSum` est donc un PLAFOND, et le CPMR qui en découle un PLANCHER
  // (on divise par trop de monde). Seule une ligne `level=account` donne une couverture dédupliquée.
  let reachSum = 0;
  for (const r of rows) {
    acc.spend += r.spend || 0;
    acc.impressions += r.impressions || 0;
    acc.clicks += r.clicks || 0;
    acc.outboundClicks += r.outboundClicks || 0;
    acc.linkClicks += r.linkClicks || 0;
    acc.landingPageViews += r.landingPageViews || 0;
    acc.purchases += r.purchases || 0;
    acc.revenue += r.revenue || 0;
    reachSum += r.reach || 0;
  }
  return {
    ...acc,
    spend: Number(acc.spend.toFixed(2)),
    revenue: Number(acc.revenue.toFixed(2)),
    reachSum,
    reachIsDeduplicated: false,
    frequencyFloor: safeRatio(acc.impressions, reachSum),
    cpmrFloor: safeRatio(acc.spend * 1000, reachSum),
    outboundCpc: safeRatio(acc.spend, acc.outboundClicks),
    impliedCpa: safeRatio(acc.spend, acc.outboundClicks * assumedCvr),
    assumedCvr,
    cpa: safeRatio(acc.spend, acc.purchases),
    costPerLandingView: safeRatio(acc.spend, acc.landingPageViews),
    roas: safeRatio(acc.revenue, acc.spend),
    ctr: safeRatio(acc.clicks * 100, acc.impressions),
    cpm: safeRatio(acc.spend * 1000, acc.impressions),
    cpc: safeRatio(acc.spend, acc.clicks),
  };
}

// MER d'acquisition = revenu des NOUVEAUX clients / dépense pub totale. Contrairement au ROAS
// (qui recompte le revenu de clients déjà acquis, et dépend d'une attribution plateforme
// auto-complaisante), il mesure ce que la pub fait vraiment ENTRER. Le revenu vient de NOTRE
// base (D1), pas de Meta — donc pas de double-comptage ni de fenêtre d'attribution à négocier.
export function acquisitionMer({ newCustomerRevenue, adSpend }) {
  const rev = Number(newCustomerRevenue) || 0;
  const spend = Number(adSpend) || 0;
  if (spend <= 0) return { mer: null, newCustomerRevenue: rev, adSpend: spend, verdict: "no_spend" };
  const mer = Number((rev / spend).toFixed(2));
  // Seuil : en dessous de 1, la pub coûte plus qu'elle ne rapporte en clients neufs.
  const verdict = mer >= 3 ? "fort" : mer >= 1 ? "viable" : "destructeur";
  return { mer, newCustomerRevenue: Number(rev.toFixed(2)), adSpend: Number(spend.toFixed(2)), verdict };
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
    message = "Dépense détectée mais 0 achat tracké : arbitrer sur le CPC sortant et le CPA implicite (CPC sortant / taux de conversion supposé), en surveillant le CPMR pour détecter la saturation d'audience. Le MER d'acquisition reste calculable depuis nos propres résas (D1), lui.";
  } else {
    status = "ok";
    message = "Dépense + conversions trackées : CPA réel exploitable, à recouper avec le MER d'acquisition (revenu des NOUVEAUX clients / dépense).";
  }
  return { status, canComputeRoas: hasPurchaseTracking && hasSpend, message };
}
