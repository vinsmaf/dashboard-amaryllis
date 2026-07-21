/**
 * /api/meta-ads-insights — Lecture READ-ONLY des performances des campagnes Meta Ads
 * (spend, impressions, clics, vues de page, conversions, ROAS) via Graph API insights.
 *
 * Brique 1 (MESURE) du chantier "agent budget pub" : l'agent d'arbitrage ne peut rien
 * décider sans perfs réelles par canal. Cet endpoint est la source de vérité côté Meta.
 * Google Ads (2e canal) sera branché séparément.
 *
 * GET ?window=7d|30d|maximum (défaut 30d) &level=campaign|adset (défaut campaign)
 * Auth : Bearer admin uniquement (touche un compte pub réel, lecture seule).
 *
 * Expose un bloc `health` qui dit honnêtement si la mesure est exploitable : campagnes en
 * pause → "no_spend" ; dépense sans achat tracké → "traffic_only" (ROAS incalculable, ne
 * pas arbitrer sur le ROAS). L'agent lira ce flag AVANT d'arbitrer.
 */

import { verifyBearer } from "./_adminauth.js";
import { AD_ACCOUNT_ID } from "../../src/config/metaCampaignBrief.js";
import { parseInsights, aggregateInsights, measurementHealth } from "../../src/utils/metaAdsInsights.js";

const GV = "v25.0";

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
    try { return JSON.parse(text); }
    catch { return { error: { message: `Réponse Graph non-JSON (HTTP ${r.status})`, body: text.slice(0, 300) } }; }
  } catch (e) {
    return { error: { message: `Appel Graph échoué : ${e.name} ${e.message}` } };
  } finally {
    clearTimeout(t);
  }
}

const WINDOWS = { "7d": "last_7d", "30d": "last_30d", "14d": "last_14d", "90d": "last_90d", maximum: "maximum" };

export async function onRequestGet({ request, env }) {
  try {
    const auth = await verifyBearer(request, env);
    if (!auth.ok) return json({ error: "Non autorisé" }, 401);

    const token = env.META_PAGE_TOKEN;
    if (!token) return json({ error: "META_PAGE_TOKEN non configuré" }, 503);

    const url = new URL(request.url);
    const datePreset = WINDOWS[url.searchParams.get("window")] || "last_30d";
    const level = url.searchParams.get("level") === "adset" ? "adset" : "campaign";
    // Diagnostic 2026-07-21 : date_preset semble servir un résultat Graph API périmé sur ce
    // compte (spend figé alors qu'Ads Manager montre une vraie dépense). ?since=&until= (YYYY-
    // MM-DD) force un time_range explicite à la place — à garder si ça contourne le problème.
    const since = url.searchParams.get("since");
    const until = url.searchParams.get("until");
    const useTimeRange = since && until;
    const rangeParam = useTimeRange
      ? `time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`
      : `date_preset=${datePreset}`;

    const nameField = level === "adset" ? "adset_name,adset_id" : "campaign_name,campaign_id";
    const fields = `${nameField},spend,impressions,clicks,ctr,cpc,actions,action_values`;
    const res = await graphGet(
      `${AD_ACCOUNT_ID}/insights?level=${level}&${rangeParam}&fields=${encodeURIComponent(fields)}&time_increment=all_days&limit=200`,
      token
    );
    if (res.error) return json({ ok: false, error: res.error }, 200);

    const rows = parseInsights(res.data);
    const totals = aggregateInsights(rows);
    const health = measurementHealth(totals);

    return json({ ok: true, window: useTimeRange ? `${since}..${until}` : datePreset, level, generated_at: new Date().toISOString(), health, totals, rows });
  } catch (e) {
    // Jamais crasher en 502 muet — remonter l'erreur exploitable.
    return json({ ok: false, error: { message: `${e.name}: ${e.message}` } }, 200);
  }
}
