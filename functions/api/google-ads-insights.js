/**
 * /api/google-ads-insights — Lecture READ-ONLY des perfs des campagnes Google Ads
 * (spend/impressions/clics/conversions/ROAS) via l'API Google Ads (GAQL searchStream).
 *
 * Brique 1b (MESURE, canal Google) de l'agent budget pub. Symétrique de meta-ads-insights.
 * Toute la logique d'appel vit dans `_googleAds.js` (partagée avec ad-budget-agent).
 *
 * GET ?window=7d|30d (défaut 30d). Auth Bearer admin.
 * Renvoie {ok, health, totals, rows} (même forme que Meta) ou {ok:false, error} lisible
 * (ex. "Google Ads non connecté", "accès Basic pas encore validé").
 */

import { verifyBearer } from "./_adminauth.js";
import { fetchGoogleAdsInsights } from "./_googleAds.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json" } });
}

export async function onRequestGet({ request, env }) {
  try {
    const auth = await verifyBearer(request, env);
    if (!auth.ok) return json({ error: "Non autorisé" }, 401);

    const url = new URL(request.url);
    const out = await fetchGoogleAdsInsights(env, env.revenue_manager, url.searchParams.get("window"));
    return json({ channel: "google_ads", generated_at: new Date().toISOString(), ...out });
  } catch (e) {
    return json({ ok: false, error: { message: `${e.name}: ${e.message}` } }, 200);
  }
}
