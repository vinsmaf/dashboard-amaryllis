/**
 * /api/ad-budget-agent — Agent budget pub, brique 2 (DÉCISION, ADVISORY).
 *
 * Croise le modèle CAC par bien (commission Booking évitée, RM-08) avec les perfs réelles
 * Meta (via Graph insights au niveau ad set) pour produire :
 *   - la VISION BUDGET : CAC plafond + budget mensuel recommandé PAR BIEN (dispo même sans
 *     campagne active — c'est le "combien je peux dépenser" que Vincent cherchait) ;
 *   - l'ARBITRAGE : pour chaque ad set qui tourne, CAC réel vs plafond → scale/hold/cut.
 *
 * ⚠️ ADVISORY STRICT : cet endpoint ne modifie AUCUN budget, ne dépense RIEN. Il recommande.
 * L'application (changer un budget dans Ads Manager) reste un geste manuel de Vincent — c'est
 * la brique 3 (exécution plafonnée opt-in), pas celle-ci. Règle absolue : jamais de dépense
 * déclenchée par ce code.
 *
 * GET ?budget=600 (plafond mensuel, défaut 600) &window=7d|30d (défaut 30d)
 * Auth : Bearer admin uniquement.
 */

import { verifyBearer } from "./_adminauth.js";
import { CAMPAIGNS, AD_ACCOUNT_ID } from "../../src/config/metaCampaignBrief.js";
import { ALL_BIENS, getBien } from "../../src/data/biens.js";
import { parseInsights, measurementHealth, aggregateInsights } from "../../src/utils/metaAdsInsights.js";
import { cacCeiling, allocateBudget, evaluateAdset, bienIdFromGoogleCampaignName, GOOGLE_CAMPAIGN_POOLS, multiBienPoolCeiling } from "../../src/utils/adBudgetAgent.js";
import { fetchGoogleAdsInsights } from "./_googleAds.js";

const GV = "v25.0";
const WINDOWS = { "7d": "last_7d", "30d": "last_30d", "14d": "last_14d", "90d": "last_90d", maximum: "maximum" };
const WINDOW_DAYS = { "7d": 7, "30d": 30, "14d": 14, "90d": 90 };
// 2026-07-21 : même fix que meta-ads-insights.js — date_preset sert des insights périmés sur
// ce compte, time_range explicite est correct (vérifié en direct, cf. ADR-META-INSIGHTS-STALE).
function computeRange(windowKey) {
  const days = WINDOW_DAYS[windowKey];
  if (!days) return null;
  const now = new Date();
  const since = new Date(now.getTime() - days * 86400000);
  return { since: since.toISOString().slice(0, 10), until: now.toISOString().slice(0, 10) };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json" } });
}

async function graphGet(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(`https://graph.facebook.com/${GV}/${path}${sep}access_token=${token}`, { signal: ctrl.signal });
    const text = await r.text();
    try { return JSON.parse(text); } catch { return { error: { message: `Réponse Graph non-JSON (HTTP ${r.status})` } }; }
  } catch (e) {
    return { error: { message: `Appel Graph échoué : ${e.name} ${e.message}` } };
  } finally {
    clearTimeout(t);
  }
}

// Mappe un nom d'ad set Meta → bienId, via le brief (dernier segment de la landingUrl).
// Null si l'ad set ne cible pas un bien connu (ex. offre groupe) → pas de plafond applicable.
function bienIdFromAdset(adsetName) {
  for (const camp of Object.values(CAMPAIGNS)) {
    for (const a of camp.adsets || []) {
      if (a.name === adsetName) {
        const seg = (a.creative?.landingUrl || "").split("?")[0].split("/").filter(Boolean).pop();
        return ALL_BIENS.some((b) => b.id === seg) ? seg : null;
      }
    }
  }
  return null;
}

export async function onRequestGet({ request, env }) {
  try {
    const auth = await verifyBearer(request, env);
    if (!auth.ok) return json({ error: "Non autorisé" }, 401);

    const url = new URL(request.url);
    const budgetMax = Math.min(5000, Math.max(100, parseInt(url.searchParams.get("budget"), 10) || 600));
    const windowKey = url.searchParams.get("window") || "30d";
    const datePreset = WINDOWS[windowKey] || "last_30d";
    const range = computeRange(windowKey);
    const rangeParam = range
      ? `time_range=${encodeURIComponent(JSON.stringify(range))}`
      : `date_preset=${datePreset}`;

    // 1) VISION BUDGET — toujours dispo, ne dépend d'aucune donnée live.
    const plan = allocateBudget(budgetMax);

    // 2) ARBITRAGE Meta — seulement si on a un token + des perfs. Sans, on le dit honnêtement.
    let meta = { available: false, note: "META_PAGE_TOKEN absent — arbitrage Meta indisponible." };
    const token = env.META_PAGE_TOKEN;
    if (token) {
      const res = await graphGet(
        `${AD_ACCOUNT_ID}/insights?level=adset&${rangeParam}&fields=${encodeURIComponent("adset_name,adset_id,spend,impressions,clicks,actions,action_values")}&time_increment=all_days&limit=200`,
        token
      );
      if (res.error) {
        meta = { available: false, error: res.error };
      } else {
        const rows = parseInsights(res.data);
        const totals = aggregateInsights(rows);
        const health = measurementHealth(totals);
        const adsets = rows.map((r) => {
          const bienId = bienIdFromAdset(r.name);
          const bien = bienId ? getBien(bienId) : null;
          const ceiling = bien ? cacCeiling(bien) : null;
          const evalResult = ceiling != null
            ? evaluateAdset(r, ceiling, health.canComputeRoas)
            : { verdict: "unmapped", note: "Ad set non rattaché à un bien connu — pas de plafond CAC applicable." };
          return { adset: r.name, bienId, spend: r.spend, purchases: r.purchases, revenue: r.revenue, ...evalResult };
        });
        meta = { available: true, window: range ? `${range.since}..${range.until}` : datePreset, health, totals, adsets };
      }
    }

    // 2b) Google Ads — lecture best-effort via le helper partagé. Échoue proprement (message
    // lisible) tant que l'accès Basic n'est pas validé ou que le compte n'est pas connecté en
    // OAuth ("Connecter Google Ads"). Le reste de l'agent reste utilisable sans.
    // Une fois les KPIs récupérés, on les fait passer par le MÊME moteur de décision (CAC
    // plafond par bien) que Meta — même modèle RM-08, même verdict scale/hold/cut, pour que
    // l'agent juge les 2 canaux payants de façon uniforme (2026-07-21, suite accès Basic accordé).
    const googleAds = await fetchGoogleAdsInsights(env, env.revenue_manager, url.searchParams.get("window"));
    if (googleAds.ok && Array.isArray(googleAds.rows)) {
      googleAds.campaigns = googleAds.rows.map((r) => {
        const bienId = bienIdFromGoogleCampaignName(r.name);
        const isPool = !bienId && GOOGLE_CAMPAIGN_POOLS.has(r.name);
        const bien = bienId ? getBien(bienId) : null;
        const ceiling = bien ? cacCeiling(bien) : isPool ? multiBienPoolCeiling() : null;
        const evalResult = ceiling != null
          ? evaluateAdset(r, ceiling, googleAds.health.canComputeRoas)
          : { verdict: "unmapped", note: "Campagne non rattachée à un bien connu (multi-biens/géo) — pas de plafond CAC applicable." };
        return {
          campaign: r.name, bienId, spend: r.spend, purchases: r.purchases, revenue: r.revenue,
          ...(isPool ? { pool: true, poolBiens: ["amaryllis", "zandoli", "geko"] } : {}),
          ...evalResult,
        };
      });
    }

    return json({
      advisory: true,
      disclaimer: "Recommandations seulement. Aucun budget modifié, aucune dépense déclenchée. L'application reste manuelle.",
      budgetMax,
      generated_at: new Date().toISOString(),
      visionBudget: plan,
      measurement: { meta, googleAds },
    });
  } catch (e) {
    return json({ ok: false, error: { message: `${e.name}: ${e.message}` } }, 200);
  }
}
