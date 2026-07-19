/**
 * /api/ad-budget-execute — Agent budget pub, BRIQUE 3 (EXÉCUTION plafonnée, shadow→live).
 *
 * Ferme la boucle des briques 1 (mesure, meta-ads-insights/google-ads-insights) + 2 (décision,
 * ad-budget-agent) : au lieu de seulement recommander, cet endpoint peut AGIR — mais dans un
 * périmètre strictement borné PAR CONSTRUCTION (pas juste par la doc) :
 *
 *   🟢 Autorisé (réversible, ne fait jamais partir un euro de PLUS que ce que Vincent a déjà
 *      autorisé) : mettre en PAUSE un ad set Meta dont le CAC réel dépasse son plafond (RM-08),
 *      augmenter le budget d'un ad set DÉJÀ ACTIF et rentable, plafonné au budget mensuel/30 de
 *      son bien (adBudgetAgent.allocateBudget) — jamais au-delà.
 *   🔴 Structurellement IMPOSSIBLE : activer un ad set en pause, créer une campagne, dépasser
 *      le plafond. Aucune fonction de ce fichier ni de meta-ads-campaign.js ne sait faire ça —
 *      ce sont des gestes qui déclenchent une DÉPENSE NOUVELLE, ils restent le clic manuel de
 *      Vincent dans Ads Manager, sans exception, même en mode "live" (règle absolue).
 *
 * Modes (env.AD_AGENT_MODE, défaut "shadow") :
 *   - shadow : calcule et journalise CE QUI SERAIT FAIT, n'appelle JAMAIS l'API Meta en écriture.
 *   - live   : exécute réellement pause / increase_budget (jamais resume/create).
 *   ?dry=1 force shadow quel que soit le mode. Kill-switch : env.AD_AGENT_DISABLED=1|true.
 *
 * Google Ads : LECTURE SEULE — aucune primitive d'écriture Google Ads n'existe dans ce projet
 * (mutate jamais testé). Toute recommandation Google reste "proposée seulement", quel que soit
 * le mode, avec la raison explicite dans la réponse.
 *
 * GET ?budget=600 (plafond mensuel total, défaut 600) &window=7d|30d &dry=1
 * Auth : ?secret=POSTSTAY_SECRET (cron) ou Bearer admin (déclenchement manuel).
 * D1 (revenue_manager) : table ad_budget_actions (créée si absente) — trace CHAQUE décision.
 */

import { verifyBearer } from "./_adminauth.js";
import { CAMPAIGNS } from "../../src/config/metaCampaignBrief.js";
import { getBien } from "../../src/data/biens.js";
import { allocateBudget, cacCeiling, evaluateAdset, planExecutionAction } from "../../src/utils/adBudgetAgent.js";
import { parseInsights, measurementHealth, aggregateInsights } from "../../src/utils/metaAdsInsights.js";
import { getLiveAdSets, pauseAdSet, setAdSetBudgetCents } from "./meta-ads-campaign.js";
import { fetchGoogleAdsInsights } from "./_googleAds.js";

const GV = "v25.0";
const AD_ACCOUNT_ID = "act_853205825762332";
const CAMPAIGN_KEY = "c1_tofu"; // seule campagne gérée par l'agent pour l'instant
// Mapping ad set → bien, dérivé du brief (dernier segment de landingUrl). a4_groupe n'a pas de
// bien unique (offre transverse) → pas de plafond CAC applicable, jamais d'action dessus.
const BIEN_BY_ADSET_KEY = Object.fromEntries(
  Object.values(CAMPAIGNS).flatMap((c) => c.adsets || []).map((a) => {
    const seg = (a.creative?.landingUrl || "").split("/").filter(Boolean).pop();
    return [a.key, seg];
  })
);

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json" } });
}

async function verifyAuth(request, env) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (secret && env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET) return { ok: true };
  return verifyBearer(request, env);
}

async function fetchAdsetInsights(env, adsetIds, datePreset) {
  const token = env.META_PAGE_TOKEN;
  if (!token || !adsetIds.length) return [];
  const filtering = encodeURIComponent(JSON.stringify([{ field: "adset.id", operator: "IN", value: adsetIds }]));
  const fields = encodeURIComponent("adset_name,adset_id,spend,impressions,clicks,actions,action_values");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(
      `https://graph.facebook.com/${GV}/${AD_ACCOUNT_ID}/insights?level=adset&date_preset=${datePreset}&filtering=${filtering}&fields=${fields}&time_increment=all_days&limit=200&access_token=${token}`,
      { signal: ctrl.signal }
    );
    const j = await r.json();
    return j?.data || [];
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS ad_budget_actions (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      channel           TEXT NOT NULL,
      bien_id           TEXT,
      adset_key         TEXT,
      adset_name        TEXT,
      verdict           TEXT,
      real_cac_cents    INTEGER,
      ceiling_cents     INTEGER,
      action            TEXT NOT NULL,
      old_budget_cents  INTEGER,
      new_budget_cents  INTEGER,
      mode              TEXT NOT NULL,
      executed          INTEGER NOT NULL DEFAULT 0,
      note              TEXT,
      created_at        INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_ad_budget_actions_created ON ad_budget_actions(created_at)").run();
}

export async function onRequestGet({ request, env }) {
  const auth = await verifyAuth(request, env);
  if (!auth.ok) return json({ error: "Non autorisé" }, 401);

  if (env.AD_AGENT_DISABLED === "1" || env.AD_AGENT_DISABLED === "true") {
    return json({ ok: true, disabled: true, message: "Agent budget pub désactivé (kill-switch AD_AGENT_DISABLED)." });
  }

  const url = new URL(request.url);
  const dry = url.searchParams.get("dry") === "1";
  const mode = dry ? "shadow" : (env.AD_AGENT_MODE === "live" ? "live" : "shadow");
  const budgetMax = Math.min(5000, Math.max(100, parseInt(url.searchParams.get("budget"), 10) || 600));
  const datePreset = { "7d": "last_7d", "30d": "last_30d" }[url.searchParams.get("window")] || "last_30d";

  const db = env.revenue_manager;
  if (db) await ensureTable(db);

  // 1) Vision budget (plafond CAC par bien) — logique pure, aucun appel réseau.
  const plan = allocateBudget(budgetMax);
  const monthlyByBien = new Map(plan.allocation.map((a) => [a.id, a.monthlyBudget]));

  // 2) État live des ad sets Meta (id + statut + budget courant), restreint au brief.
  const live = await getLiveAdSets(env, CAMPAIGN_KEY);
  if (live.error) return json({ ok: false, error: live.error }, 200);

  // 3) Perfs Meta sur la fenêtre, uniquement pour les ad sets connus.
  const adsetIds = live.adsets.map((a) => a.id);
  const insightsRows = parseInsights(await fetchAdsetInsights(env, adsetIds, datePreset));
  const health = measurementHealth(aggregateInsights(insightsRows));

  const decisions = [];
  for (const adset of live.adsets) {
    const bienId = BIEN_BY_ADSET_KEY[adset.key] || null;
    const bien = bienId ? getBien(bienId) : null;
    const ceiling = bien ? cacCeiling(bien) : null;
    const perf = insightsRows.find((r) => r.id === adset.id) || { spend: 0, purchases: 0, revenue: 0 };
    const evalResult = ceiling != null
      ? evaluateAdset(perf, ceiling, health.canComputeRoas)
      : { verdict: "unmapped", note: "Ad set non rattaché à un bien connu — pas de plafond CAC applicable." };

    const perBienMonthly = bienId ? monthlyByBien.get(bienId) : null;
    const perBienDailyCeilingCents = perBienMonthly != null ? Math.round((perBienMonthly / 30) * 100) : null;

    const decision = planExecutionAction({
      verdict: evalResult.verdict,
      isActive: adset.effective_status === "ACTIVE",
      currentBudgetCents: adset.daily_budget_cents,
      perBienDailyCeilingCents,
    });

    let executed = false;
    let execError = null;
    if (mode === "live" && decision.action === "pause") {
      const r = await pauseAdSet(env, adset.id);
      executed = r.ok; execError = r.error;
    } else if (mode === "live" && decision.action === "increase_budget") {
      const r = await setAdSetBudgetCents(env, adset.id, decision.newBudgetCents);
      executed = r.ok; execError = r.error;
    }

    const row = {
      channel: "meta",
      bienId,
      adsetKey: adset.key,
      adsetName: adset.name,
      verdict: evalResult.verdict,
      realCacCents: evalResult.realCac != null ? evalResult.realCac * 100 : null,
      ceilingCents: ceiling != null ? ceiling * 100 : null,
      action: decision.action,
      oldBudgetCents: adset.daily_budget_cents,
      newBudgetCents: decision.newBudgetCents ?? null,
      mode,
      executed,
      note: decision.note + (execError ? ` | ERREUR: ${JSON.stringify(execError)}` : ""),
    };
    decisions.push(row);

    if (db) {
      await db.prepare(
        "INSERT INTO ad_budget_actions (channel, bien_id, adset_key, adset_name, verdict, real_cac_cents, ceiling_cents, action, old_budget_cents, new_budget_cents, mode, executed, note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(row.channel, row.bienId, row.adsetKey, row.adsetName, row.verdict, row.realCacCents, row.ceilingCents, row.action, row.oldBudgetCents, row.newBudgetCents, row.mode, row.executed ? 1 : 0, row.note).run();
    }
  }

  // 4) Google Ads — lecture seule, jamais d'action (aucune primitive d'écriture n'existe).
  const googleAds = await fetchGoogleAdsInsights(env, db, url.searchParams.get("window"));

  return json({
    ok: true,
    mode,
    disclaimer: "L'agent peut mettre en pause ou augmenter un budget DÉJÀ actif, jamais activer un ad set ni créer une dépense nouvelle — ça reste ton clic.",
    budgetMax,
    window: datePreset,
    health,
    decisions,
    googleAds: {
      ...googleAds,
      note: "Lecture seule — aucune primitive d'écriture Google Ads n'est implémentée. Toute campagne à couper reste une action manuelle dans Google Ads.",
    },
  });
}
