// functions/api/_googleAds.js
// Helper partagé (google-ads-insights + ad-budget-agent) : appelle l'API Google Ads en
// lecture (GoogleAdsService.searchStream, GAQL) et renvoie des KPIs normalisés. READ-ONLY.
// Ne throw JAMAIS — renvoie toujours un objet {ok, ...} pour que l'appelant décide.

import { getValidAccessToken } from "./_googleOAuth.js";
import { buildGaql, parseGoogleAdsStream, aggregateGoogleAds, googleAdsHealth, GAQL_RANGES } from "../../src/utils/googleAdsInsights.js";

const GADS_VERSION = "v18";
const normId = (v) => String(v || "").replace(/[^0-9]/g, "");

export async function fetchGoogleAdsInsights(env, db, windowKey) {
  const devToken = env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const loginCid = normId(env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  const customerId = normId(env.GOOGLE_ADS_CUSTOMER_ID);
  if (!devToken || !customerId) {
    return { ok: false, configured: false, error: "Config Google Ads incomplète (GOOGLE_ADS_DEVELOPER_TOKEN / GOOGLE_ADS_CUSTOMER_ID à renseigner en variables Cloudflare)." };
  }
  let accessToken;
  try { accessToken = await getValidAccessToken(env, db, "googleads"); }
  catch (e) { return { ok: false, connected: false, error: "Google Ads non connecté (OAuth). " + (e.message || "") }; }
  if (!accessToken) return { ok: false, connected: false, error: "Google Ads non connecté — cliquer « Connecter Google Ads »." };

  const dateRange = GAQL_RANGES[windowKey] || "LAST_30_DAYS";
  const headers = { Authorization: `Bearer ${accessToken}`, "developer-token": devToken, "Content-Type": "application/json" };
  if (loginCid) headers["login-customer-id"] = loginCid;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(
      `https://googleads.googleapis.com/${GADS_VERSION}/customers/${customerId}/googleAds:searchStream`,
      { method: "POST", headers, body: JSON.stringify({ query: buildGaql(dateRange) }), signal: ctrl.signal }
    );
    const text = await r.text();
    let res;
    try { res = JSON.parse(text); }
    catch { return { ok: false, error: `Réponse Google Ads non-JSON (HTTP ${r.status})`, body: text.slice(0, 300) }; }
    const apiErr = res.error || (Array.isArray(res) && res[0]?.error);
    if (apiErr) {
      // Avant l'accès Basic, l'API renvoie typiquement DEVELOPER_TOKEN_NOT_APPROVED / PERMISSION_DENIED.
      return { ok: false, error: apiErr, hint: "Si DEVELOPER_TOKEN_NOT_APPROVED ou PERMISSION_DENIED : l'accès Basic n'est pas encore validé par Google (~5 j) — le reste est prêt, ça marchera dès validation." };
    }
    const rows = parseGoogleAdsStream(res);
    const totals = aggregateGoogleAds(rows);
    return { ok: true, connected: true, window: dateRange, health: googleAdsHealth(totals), totals, rows };
  } catch (e) {
    return { ok: false, error: `Appel Google Ads échoué : ${e.name} ${e.message}` };
  } finally {
    clearTimeout(t);
  }
}
