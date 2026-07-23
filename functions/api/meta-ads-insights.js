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
const WINDOW_DAYS = { "7d": 7, "30d": 30, "14d": 14, "90d": 90 };
const isoDate = (d) => d.toISOString().slice(0, 10);

// 2026-07-21 : `date_preset` sert des insights PÉRIMÉS sur ce compte (spend figé à 0,03€
// alors qu'Ads Manager montrait 13,48€ dépensés le jour même) — un `time_range` explicite
// contourne le problème (vérifié en direct). Devenu le comportement PAR DÉFAUT : calculé depuis
// `window` (ou surchargeable via ?since=&until= pour du debug ciblé). `date_preset` gardé en
// filet uniquement pour "maximum" (pas de borne "since" raisonnable à calculer).
function computeRange(windowKey) {
  const days = WINDOW_DAYS[windowKey];
  if (!days) return null;
  const now = new Date();
  const since = new Date(now.getTime() - days * 86400000);
  return { since: isoDate(since), until: isoDate(now) };
}

export async function onRequestGet({ request, env }) {
  try {
    const auth = await verifyBearer(request, env);
    if (!auth.ok) return json({ error: "Non autorisé" }, 401);

    const token = env.META_PAGE_TOKEN;
    if (!token) return json({ error: "META_PAGE_TOKEN non configuré" }, 503);

    const url = new URL(request.url);
    const windowKey = url.searchParams.get("window") || "30d";
    const datePreset = WINDOWS[windowKey] || "last_30d";
    const level = url.searchParams.get("level") === "adset" ? "adset" : "campaign";
    const explicitSince = url.searchParams.get("since");
    const explicitUntil = url.searchParams.get("until");
    const computed = explicitSince && explicitUntil ? null : computeRange(windowKey);
    const since = explicitSince || computed?.since;
    const until = explicitUntil || computed?.until;
    const useTimeRange = Boolean(since && until);
    const rangeParam = useTimeRange
      ? `time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`
      : `date_preset=${datePreset}`;

    const nameField = level === "adset" ? "adset_name,adset_id" : "campaign_name,campaign_id";
    const fields = `${nameField},spend,impressions,clicks,ctr,cpc,actions,action_values`;

    // ?breakdown=placement — ventile la dépense par plateforme/position de diffusion.
    // Diagnostic ajouté 2026-07-23 : Meta déclarait 348 vues de page pour 6 sessions GA4 seulement,
    // avec un CPC à 0,08 € (anormalement bas). Les liens portaient bien les UTM (audité) → l'écart ne
    // vient PAS de l'attribution mais probablement de placements à très faible intention
    // (Audience Network / Reels). Lecture seule, ne modifie aucune campagne.
    const BREAKDOWNS = { placement: "publisher_platform,platform_position", device: "impression_device", country: "country" };
    const breakdown = BREAKDOWNS[url.searchParams.get("breakdown")] || null;
    const breakdownParam = breakdown ? `&breakdowns=${encodeURIComponent(breakdown)}` : "";

    const res = await graphGet(
      `${AD_ACCOUNT_ID}/insights?level=${level}&${rangeParam}&fields=${encodeURIComponent(fields)}${breakdownParam}&time_increment=all_days&limit=200`,
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
