// src/utils/metaCampaignBuilder.js
// Logique pure : construit les payloads Marketing API depuis le brief
// (src/config/metaCampaignBrief.js) + les intérêts/régions déjà résolus en IDs Meta.
// Aucun appel réseau ici — testable sans mock HTTP. Tout objet reste status="PAUSED" :
// l'activation (dépense réelle) est un geste séparé, jamais construit par ce module.

export function buildCampaignPayload(campaign) {
  return {
    name: campaign.name,
    objective: campaign.objective,
    status: "PAUSED",
    special_ad_categories: [],
  };
}

export function buildTargeting(adset, resolvedInterests, resolvedRegions) {
  const targeting = {
    geo_locations: { countries: adset.targeting.countries },
    age_min: adset.targeting.ageMin,
    age_max: adset.targeting.ageMax,
  };
  if (resolvedRegions?.length) {
    targeting.excluded_geo_locations = { regions: resolvedRegions.map((r) => ({ key: r.key, name: r.name })) };
  }
  if (resolvedInterests?.length) {
    targeting.interests = resolvedInterests.map((i) => ({ id: i.id, name: i.name }));
  }
  return targeting;
}

export function buildAdSetPayload(adset, campaignId, targeting) {
  return {
    name: adset.name,
    campaign_id: campaignId,
    daily_budget: adset.dailyBudgetCents,
    billing_event: "IMPRESSIONS",
    optimization_goal: "LANDING_PAGE_VIEWS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    status: "PAUSED",
    targeting,
  };
}

export function buildCreativePayload(adset, pageId) {
  const cr = adset.creative;
  return {
    name: `${adset.name} — créa`,
    object_story_spec: {
      page_id: pageId,
      link_data: {
        message: cr.primaryText,
        link: cr.landingUrl,
        name: cr.title,
        description: cr.description,
        picture: cr.imageUrl,
        call_to_action: { type: cr.cta, value: { link: cr.landingUrl } },
      },
    },
  };
}

export function buildAdPayload(adset, adsetId, creativeId) {
  return {
    name: `${adset.name} — annonce`,
    adset_id: adsetId,
    creative: { creative_id: creativeId },
    status: "PAUSED",
  };
}

// Un intérêt/une région demandé dans le brief mais jamais résolu par Meta (nom introuvable,
// renommé, faute de frappe) doit BLOQUER la création plutôt que produire un ciblage tronqué
// sans que personne ne s'en aperçoive.
export function checkResolution(requestedNames, resolvedList) {
  const resolvedNames = new Set((resolvedList || []).map((r) => r.matchedName));
  const missing = (requestedNames || []).filter((n) => !resolvedNames.has(n));
  return { complete: missing.length === 0, missing };
}
