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
  pickBestMatch,
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

async function graphDelete(id, token) {
  const r = await fetch(`https://graph.facebook.com/${GV}/${id}?access_token=${token}`, { method: "DELETE" });
  return r.json();
}

// Un intérêt français se traduit souvent en anglais côté Meta ("Location de vacances" →
// "Vacation rental") SANS aucun mot en commun — une comparaison de chaînes ne peut pas
// juger une traduction. On ne filtre donc PAS le rang 0 ici ; à la place on remonte les
// candidats suivants en clair (`alternates`) pour qu'un humain (Vincent ou Claude en
// review) repère un mauvais match d'un coup d'œil — c'est comme ça que "Caraïbes" →
// "Airline" a été repéré en prod, pas par un algorithme.
async function resolveInterest(name, token) {
  const r = await graphGet(`search?type=adinterest&q=${encodeURIComponent(name)}&limit=6`, token);
  const data = r?.data || [];
  const hit = data[0];
  if (!hit) return null;
  return {
    id: hit.id,
    name: hit.name,
    matchedName: name,
    alternates: data.slice(1).map((d) => d.name),
  };
}

// Les DOM (Martinique, Guadeloupe, ...) peuvent être typés "region" OU "country" selon
// l'entité Meta — on cherche large (sans filtrer par type) et on exige un match EXACT
// (mode "exact", précision géo > rappel) : contrairement aux intérêts, un nom de lieu
// n'a pas de problème de traduction, donc l'exiger exact élimine directement les faux
// positifs du type "Martinique" → "Petite Martinique" (île de Grenade sans rapport).
async function resolveRegion(name, token) {
  const r = await graphGet(`search?type=adgeolocation&q=${encodeURIComponent(name)}&limit=10`, token);
  const hit = pickBestMatch(name, r?.data, "exact");
  return hit ? { key: hit.key, name: hit.name, type: hit.type, matchedName: name } : null;
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
    // Nom choisi + alternatives Meta pour chaque intérêt — à relire avant confirm:true,
    // aucun filtre automatique ne protège contre un mauvais rang 0 ici (cf. commentaire
    // resolveInterest).
    interestMatches: interests.map((i) => ({ query: i.matchedName, chosen: i.name, alternates: i.alternates })),
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

// Même logique pour les ad sets (sous la campagne) et les créatives (niveau compte) — sans
// ça, chaque nouvelle tentative après un fix créerait des doublons PAUSED orphelins au lieu
// de reprendre là où la précédente s'était arrêtée (vécu : 5 itérations de correctifs avant
// que la création complète passe).
async function findExistingAdSets(campaignId, token) {
  const r = await graphGet(`${campaignId}/adsets?fields=id,name,status&limit=100`, token);
  return r?.data || [];
}

async function findExistingCreatives(token) {
  const r = await graphGet(`${AD_ACCOUNT_ID}/adcreatives?fields=id,name&limit=200`, token);
  return r?.data || [];
}

// Ads existantes sous la campagne — sans dédup côté ads, chaque relance recréerait des
// annonces en doublon (le moteur crée toujours une ad). Sert aussi au mode refresh.
async function findExistingAds(campaignId, token) {
  const r = await graphGet(`${campaignId}/ads?fields=id,name&limit=100`, token);
  return r?.data || [];
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
    const { targeting, warnings, interestMatches } = await resolveAdSetTargeting(adset, token);
    adsets.push({
      key: adset.key,
      adsetPayload: buildAdSetPayload(adset, existing?.id || "<campaign_id à créer>", targeting),
      creativePayload: buildCreativePayload(adset, pageId),
      interestMatches,
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

async function createCampaign(campaignKey, env, opts = {}) {
  const token = env.META_PAGE_TOKEN;
  const campaign = CAMPAIGNS[campaignKey];
  const refresh = opts.refresh === true; // remplace créative+annonce existantes (ex. image simple → carrousel)
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
    // Meta ne renvoie pas grand-chose avec juste .message ("Invalid parameter" ne dit pas
    // QUEL paramètre) — on remonte l'objet erreur complet (error_subcode/error_user_msg/
    // fbtrace_id), bien plus parlant pour diagnostiquer.
    if (created.error) return json({ ok: false, step: "campaign", error: created.error, payloadSent: plan.campaignPayload }, 422);
    campaignId = created.id;
  }

  const existingAdSets = await findExistingAdSets(campaignId, token);
  const existingCreatives = await findExistingCreatives(token);
  const existingAds = await findExistingAds(campaignId, token);

  const results = [];
  for (const a of plan.adsets) {
    if (a.skipped) { results.push(a); continue; }

    let adsetId = existingAdSets.find((x) => x.name === a.adsetPayload.name)?.id;
    if (!adsetId) {
      const adsetBody = { ...a.adsetPayload, campaign_id: campaignId };
      const adsetRes = await graphPost(`${AD_ACCOUNT_ID}/adsets`, token, adsetBody);
      if (adsetRes.error) { results.push({ key: a.key, error: `adset`, detail: adsetRes.error, payloadSent: adsetBody }); continue; }
      adsetId = adsetRes.id;
    } else {
      // Ad set déjà existant : re-synchroniser son budget sur le brief (l'idempotence ne mettait
      // jamais à jour le daily_budget d'un ad set créé — un changement de budget dans le brief
      // restait sans effet). Idempotent, l'ad set reste PAUSED (aucune dépense déclenchée).
      await graphPost(adsetId, token, { daily_budget: a.adsetPayload.daily_budget });
    }

    const adsetConfig = campaign.adsets.find((x) => x.key === a.key);
    const adName = buildAdPayload(adsetConfig, adsetId, "x").name;
    let existingAd = existingAds.find((x) => x.name === adName);
    let existingCr = existingCreatives.find((x) => x.name === a.creativePayload.name);

    // Refresh : supprimer l'ancienne annonce PUIS sa créative (une créative rattachée à une
    // ad vivante ne peut pas être supprimée), pour forcer la recréation avec le nouveau
    // payload (carrousel). Sans refresh, on réutilise l'existant (idempotent).
    let refreshed = false;
    if (refresh) {
      if (existingAd) { await graphDelete(existingAd.id, token); existingAd = null; refreshed = true; }
      if (existingCr) { await graphDelete(existingCr.id, token); existingCr = null; refreshed = true; }
    }

    let creativeId = existingCr?.id;
    if (!creativeId) {
      const creativeRes = await graphPost(`${AD_ACCOUNT_ID}/adcreatives`, token, a.creativePayload);
      if (creativeRes.error) { results.push({ key: a.key, adsetId, error: `créative`, detail: creativeRes.error, payloadSent: a.creativePayload }); continue; }
      creativeId = creativeRes.id;
    }

    let adId = existingAd?.id;
    if (!adId) {
      const adPayload = buildAdPayload(adsetConfig, adsetId, creativeId);
      const adRes = await graphPost(`${AD_ACCOUNT_ID}/ads`, token, adPayload);
      if (adRes.error) { results.push({ key: a.key, adsetId, creativeId, error: "ad", detail: adRes.error }); continue; }
      adId = adRes.id;
    }

    const cardCount = a.creativePayload.object_story_spec?.link_data?.child_attachments?.length || 1;
    results.push({ key: a.key, adsetId, creativeId, adId, refreshed, format: cardCount > 1 ? `carrousel ${cardCount} photos` : "image simple" });
  }

  return json({
    ok: true,
    campaignId,
    status: "PAUSED — rien ne dépense tant que tu n'actives pas manuellement dans Ads Manager",
    results,
  });
}

// Recherche brute (lecture seule) pour vérifier à la main qu'un terme du brief matche
// bien la BONNE entité Meta avant de l'ajouter à metaCampaignBrief.js — utile pour
// Supprime les ad sets "parasites" d'une campagne = tout ad set dont le nom ne figure PAS dans
// le brief (CAMPAIGNS[key].adsets[].name). Garde-fou dur : filtre par nom EXACT du brief, donc
// A1/A2/A3/A4 (noms curés) sont protégés — seuls tombent les orphelins (doublons d'anciens tests,
// ad sets auto-générés type "C1 — TOFU Découverte - -"). Dry-run par défaut ; confirm:true pour
// supprimer réellement. Irréversible côté Meta (supprime aussi les annonces des ad sets visés).
async function pruneParasiteAdSets(env, campaignKey, { confirm }) {
  const token = env.META_PAGE_TOKEN;
  if (!token) return json({ ok: false, error: "META_PAGE_TOKEN non configuré" }, 400);
  const campaign = CAMPAIGNS[campaignKey];
  if (!campaign) return json({ ok: false, error: `Campagne inconnue : ${campaignKey}` }, 400);

  const camp = await findExistingCampaign(campaign.name, token);
  if (!camp) return json({ ok: false, error: `Campagne "${campaign.name}" introuvable côté Meta` }, 404);

  const validNames = new Set(campaign.adsets.map((a) => a.name));
  const asRes = await graphGet(`${camp.id}/adsets?fields=name,effective_status,daily_budget&limit=100`, token);
  const all = asRes?.data || [];
  const eur = (b) => (b ? Number(b) / 100 : null);
  const parasites = all.filter((a) => !validNames.has(a.name));
  const kept = all.filter((a) => validNames.has(a.name)).map((a) => ({ id: a.id, name: a.name, effective_status: a.effective_status, daily_budget_eur: eur(a.daily_budget) }));

  if (!confirm) {
    return json({
      ok: true, dryRun: true,
      wouldDelete: parasites.map((a) => ({ id: a.id, name: a.name, effective_status: a.effective_status, daily_budget_eur: eur(a.daily_budget) })),
      wouldKeep: kept,
      note: "Aperçu — rien supprimé. Renvoyer avec confirm:true pour supprimer.",
    });
  }
  const deleted = [];
  for (const p of parasites) {
    // Meta refuse DELETE sur un ad set dont une annonce a une créative cassée (post FB
    // supprimé → error_subcode 2446289 "Ad Creative Is Incomplete"). Contournement : purger
    // d'abord les annonces enfants, puis l'ad set devient supprimable.
    const adsRes = await graphGet(`${p.id}/ads?fields=id&limit=100`, token);
    let adsDeleted = 0;
    for (const ad of adsRes?.data || []) {
      const ra = await graphDelete(ad.id, token);
      if (!ra.error) adsDeleted++;
    }
    const r = await graphDelete(p.id, token);
    deleted.push({ id: p.id, name: p.name, adsDeleted, ok: !r.error, error: r.error || null });
  }
  return json({ ok: true, deleted, kept });
}

// Lit l'état RÉEL de diffusion côté Meta (effective_status = agrège campagne+adset+ad+compte —
// le seul champ qui dit si ça tourne vraiment). ?debug=status&campaign=c1_tofu. Réutilisable
// par l'onglet Budget Pub pour afficher "campagne ACTIVE, N ad sets actifs".
async function debugStatus(env, campaignKey) {
  const token = env.META_PAGE_TOKEN;
  if (!token) return { error: "META_PAGE_TOKEN non configuré" };
  const campaign = CAMPAIGNS[campaignKey];
  if (!campaign) return { error: `Campagne inconnue : ${campaignKey}` };

  const camp = await findExistingCampaign(campaign.name, token);
  if (!camp) return { error: `Campagne "${campaign.name}" introuvable côté Meta` };

  const campDetail = await graphGet(`${camp.id}?fields=name,effective_status,status`, token);
  const asRes = await graphGet(`${camp.id}/adsets?fields=name,effective_status,status,daily_budget&limit=100`, token);
  const adRes = await graphGet(`${camp.id}/ads?fields=name,effective_status,configured_status&limit=100`, token);

  const adsets = (asRes?.data || []).map((a) => ({
    name: a.name,
    effective_status: a.effective_status,
    daily_budget_eur: a.daily_budget ? Number(a.daily_budget) / 100 : null,
  }));
  const ads = (adRes?.data || []).map((a) => ({ name: a.name, effective_status: a.effective_status }));

  return {
    campaign: { name: campDetail?.name, effective_status: campDetail?.effective_status },
    adsets,
    ads,
  };
}

// maintenir le brief dans le temps sans deviner à l'aveugle. ?debug=search&q=...&type=adinterest|adgeolocation
async function debugSearch(env, q, type) {
  const token = env.META_PAGE_TOKEN;
  if (!token) return { error: "META_PAGE_TOKEN non configuré" };
  const t = type === "adgeolocation" ? "adgeolocation" : "adinterest";
  const r = await graphGet(`search?type=${t}&q=${encodeURIComponent(q)}&limit=10`, token);
  return { query: q, type: t, results: r?.data || r };
}

// Lecture "vivante" des ad sets d'une campagne, restreinte aux noms du brief (même allowlist
// que pruneParasiteAdSets) — utilisée par l'agent d'exécution budget pub (brique 3) pour savoir
// sur quel ad set agir. Ne retourne JAMAIS un objet hors brief.
export async function getLiveAdSets(env, campaignKey) {
  const token = env.META_PAGE_TOKEN;
  if (!token) return { error: "META_PAGE_TOKEN non configuré" };
  const campaign = CAMPAIGNS[campaignKey];
  if (!campaign) return { error: `Campagne inconnue : ${campaignKey}` };
  const camp = await findExistingCampaign(campaign.name, token);
  if (!camp) return { error: `Campagne "${campaign.name}" introuvable côté Meta` };
  const keyByName = new Map(campaign.adsets.map((a) => [a.name, a.key]));
  const asRes = await graphGet(`${camp.id}/adsets?fields=id,name,effective_status,daily_budget&limit=100`, token);
  const adsets = (asRes?.data || [])
    .filter((a) => keyByName.has(a.name))
    .map((a) => ({
      id: a.id,
      key: keyByName.get(a.name),
      name: a.name,
      effective_status: a.effective_status,
      daily_budget_cents: a.daily_budget ? Number(a.daily_budget) : null,
    }));
  return { campaignId: camp.id, adsets };
}

// Met un ad set en pause — action DÉFENSIVE (réduit/coupe une dépense EN COURS), jamais
// l'inverse. Aucune fonction de ce fichier ne réactive un ad set : c'est la garantie
// structurelle que l'agent budget pub (brique 3) ne peut PAS déclencher une dépense nouvelle,
// seulement la réduire — l'activation reste un geste manuel de Vincent dans Ads Manager.
export async function pauseAdSet(env, adsetId) {
  const token = env.META_PAGE_TOKEN;
  if (!token) return { ok: false, error: "META_PAGE_TOKEN non configuré" };
  const r = await graphPost(adsetId, token, { status: "PAUSED" });
  return { ok: !r.error, error: r.error || null };
}

// Ajuste le budget journalier d'un ad set déjà connu du brief — ne crée rien, ne réactive rien.
// L'appelant (ad-budget-execute.js) plafonne newBudgetCents au plafond CAC du bien avant appel.
export async function setAdSetBudgetCents(env, adsetId, cents) {
  const token = env.META_PAGE_TOKEN;
  if (!token) return { ok: false, error: "META_PAGE_TOKEN non configuré" };
  const r = await graphPost(adsetId, token, { daily_budget: Math.round(cents) });
  return { ok: !r.error, error: r.error || null };
}

export async function onRequestGet({ request, env }) {
  const auth = await verifyBearer(request, env);
  if (!auth.ok) return json({ error: "Non autorisé" }, 401);

  const url = new URL(request.url);
  if (url.searchParams.get("debug") === "search") {
    const out = await debugSearch(env, url.searchParams.get("q") || "", url.searchParams.get("type"));
    return json(out);
  }
  if (url.searchParams.get("debug") === "status") {
    const out = await debugStatus(env, url.searchParams.get("campaign") || "c1_tofu");
    return json(out);
  }
  if (url.searchParams.get("debug") === "list") {
    const token = env.META_PAGE_TOKEN;
    if (!token) return json({ error: "META_PAGE_TOKEN non configuré" });
    const r = await graphGet(`${AD_ACCOUNT_ID}/campaigns?fields=id,name,effective_status,created_time&limit=200`, token);
    return json({ campaigns: (r?.data || []).map((c) => ({ id: c.id, name: c.name, effective_status: c.effective_status, created_time: c.created_time })), error: r?.error || null });
  }
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
  if (body.action === "prune") {
    return pruneParasiteAdSets(env, campaignKey, { confirm: body.confirm === true });
  }
  if (body.confirm !== true) {
    const plan = await buildPlan(campaignKey, env);
    return json({ ...plan, note: "Aperçu seul (confirm:true manquant) — rien créé." });
  }
  // refreshCreatives:true → remplace les créatives/annonces existantes (ex. passer d'une
  // image simple à un carrousel). Sans ce flag, la création reste purement idempotente.
  return createCampaign(campaignKey, env, { refresh: body.refreshCreatives === true });
}
