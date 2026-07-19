/**
 * /api/meta-ads-campaign — Création (toujours PAUSED) des campagnes Meta Ads depuis le
 * brief src/config/metaCampaignBrief.js, via la Marketing API.
 *
 * ⚠️ Tout objet créé est TOUJOURS status="PAUSED" — aucune dépense ne démarre depuis cet
 * endpoint. L'activation (passage à ACTIVE dans Ads Manager) est un geste séparé et
 * volontaire de Vincent, jamais fait par ce code ni par Claude.
 *
 * GET  ?campaign=c1_tofu                          → résout intérêts/régions (lecture seule
 *                                                     Marketing API) et retourne les payloads
 *                                                     EXACTS qui seraient envoyés, sans rien
 *                                                     créer. Sûr à répéter.
 * POST { campaign: "c1_tofu", confirm: true }     → crée réellement (PAUSED). Sans
 *                                                     confirm:true, se comporte comme le GET
 *                                                     (aperçu, aucune écriture).
 *
 * Idempotent : si une campagne du même nom existe déjà, elle est réutilisée (pas de doublon).
 * Auth : Bearer admin uniquement (verifyBearer) — jamais de secret partagé, cet endpoint
 * touche un compte pub réel.
 */

import { verifyBearer } from "./_adminauth.js";
import { CAMPAIGNS, AD_ACCOUNT_ID } from "../../src/config/metaCampaignBrief.js";
import {
  buildCampaignPayload,
  buildTargeting,
  buildAdSetPayload,
  buildCreativePayload,
  buildAdPayload,
  checkResolution,
} from "../../src/utils/metaCampaignBuilder.js";

const GV = "v25.0";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function graphGet(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`https://graph.facebook.com/${GV}/${path}${sep}access_token=${token}`);
  return r.json();
}

async function graphPost(path, token, body) {
  const r = await fetch(`https://graph.facebook.com/${GV}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: token }),
  });
  return r.json();
}

async function resolveInterest(name, token) {
  const r = await graphGet(`search?type=adinterest&q=${encodeURIComponent(name)}&limit=1`, token);
  const hit = r?.data?.[0];
  return hit ? { id: hit.id, name: hit.name, matchedName: name } : null;
}

async function resolveRegion(name, token) {
  const locationTypes = encodeURIComponent(JSON.stringify(["region"]));
  const r = await graphGet(
    `search?type=adgeolocation&location_types=${locationTypes}&q=${encodeURIComponent(name)}&limit=1`,
    token
  );
  const hit = r?.data?.[0];
  return hit ? { key: hit.key, name: hit.name, matchedName: name } : null;
}

async function resolveAdSetTargeting(adset, token) {
  const interestResults = await Promise.all(adset.targeting.interests.map((n) => resolveInterest(n, token)));
  const regionResults = await Promise.all((adset.targeting.excludedRegions || []).map((n) => resolveRegion(n, token)));
  const interests = interestResults.filter(Boolean);
  const regions = regionResults.filter(Boolean);
  const interestCheck = checkResolution(adset.targeting.interests, interests);
  const regionCheck = checkResolution(adset.targeting.excludedRegions || [], regions);
  return {
    targeting: buildTargeting(adset, interests, regions),
    warnings: [
      ...(interestCheck.complete ? [] : [`Intérêts non résolus (${adset.key}) : ${interestCheck.missing.join(", ")}`]),
      ...(regionCheck.complete ? [] : [`Régions non résolues (${adset.key}) : ${regionCheck.missing.join(", ")}`]),
    ],
  };
}

// Cherche une campagne existante du même nom — évite les doublons si l'endpoint est rappelé.
async function findExistingCampaign(name, token) {
  const r = await graphGet(`${AD_ACCOUNT_ID}/campaigns?fields=id,name,status&limit=100`, token);
  return (r?.data || []).find((c) => c.name === name) || null;
}

async function buildPlan(campaignKey, env) {
  const token = env.META_PAGE_TOKEN;
  const pageId = env.META_PAGE_ID;
  const campaign = CAMPAIGNS[campaignKey];
  if (!campaign) return { error: `Campagne inconnue : ${campaignKey}` };
  if (!token || !pageId) return { error: "META_PAGE_TOKEN ou META_PAGE_ID non configuré" };

  const existing = await findExistingCampaign(campaign.name, token);
  const adsets = [];
  for (const adset of campaign.adsets) {
    if (!adset.enabled) {
      adsets.push({ key: adset.key, name: adset.name, skipped: true, reason: "enabled:false dans le brief" });
      continue;
    }
    const { targeting, warnings } = await resolveAdSetTargeting(adset, token);
    adsets.push({
      key: adset.key,
      adsetPayload: buildAdSetPayload(adset, existing?.id || "<campaign_id à créer>", targeting),
      creativePayload: buildCreativePayload(adset, pageId),
      warnings,
    });
  }

  return {
    campaignKey,
    existingCampaign: existing,
    campaignPayload: buildCampaignPayload(campaign),
    adsets,
  };
}

async function createCampaign(campaignKey, env) {
  const token = env.META_PAGE_TOKEN;
  const campaign = CAMPAIGNS[campaignKey];
  const plan = await buildPlan(campaignKey, env);
  if (plan.error) return json({ ok: false, error: plan.error }, 400);

  const blockingWarnings = plan.adsets.flatMap((a) => a.warnings || []);
  if (blockingWarnings.length) {
    return json({ ok: false, error: "Ciblage incomplet — rien créé.", warnings: blockingWarnings }, 422);
  }

  // Campagne : réutilise l'existante si trouvée par nom (idempotent), sinon crée.
  let campaignId = plan.existingCampaign?.id;
  if (!campaignId) {
    const created = await graphPost(`${AD_ACCOUNT_ID}/campaigns`, token, plan.campaignPayload);
    if (created.error) return json({ ok: false, step: "campaign", error: created.error.message }, 422);
    campaignId = created.id;
  }

  const results = [];
  for (const a of plan.adsets) {
    if (a.skipped) { results.push(a); continue; }
    const adsetBody = { ...a.adsetPayload, campaign_id: campaignId };
    const adsetRes = await graphPost(`${AD_ACCOUNT_ID}/adsets`, token, adsetBody);
    if (adsetRes.error) { results.push({ key: a.key, error: `adset : ${adsetRes.error.message}` }); continue; }

    const creativeRes = await graphPost(`${AD_ACCOUNT_ID}/adcreatives`, token, a.creativePayload);
    if (creativeRes.error) { results.push({ key: a.key, adsetId: adsetRes.id, error: `créative : ${creativeRes.error.message}` }); continue; }

    const adsetConfig = campaign.adsets.find((x) => x.key === a.key);
    const adRes = await graphPost(`${AD_ACCOUNT_ID}/ads`, token, buildAdPayload(adsetConfig, adsetRes.id, creativeRes.id));
    results.push({
      key: a.key,
      adsetId: adsetRes.id,
      creativeId: creativeRes.id,
      adId: adRes.id || null,
      error: adRes.error ? `ad : ${adRes.error.message}` : null,
    });
  }

  return json({
    ok: true,
    campaignId,
    status: "PAUSED — rien ne dépense tant que tu n'actives pas manuellement dans Ads Manager",
    results,
  });
}

export async function onRequestGet({ request, env }) {
  const auth = await verifyBearer(request, env);
  if (!auth.ok) return json({ error: "Non autorisé" }, 401);

  const url = new URL(request.url);
  const campaignKey = url.searchParams.get("campaign") || "c1_tofu";
  const plan = await buildPlan(campaignKey, env);
  return json(plan);
}

export async function onRequestPost({ request, env }) {
  const auth = await verifyBearer(request, env);
  if (!auth.ok) return json({ error: "Non autorisé" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Body JSON invalide" }, 400); }

  const campaignKey = body.campaign || "c1_tofu";
  if (body.confirm !== true) {
    const plan = await buildPlan(campaignKey, env);
    return json({ ...plan, note: "Aperçu seul (confirm:true manquant) — rien créé." });
  }
  return createCampaign(campaignKey, env);
}
