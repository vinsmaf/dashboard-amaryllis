// functions/api/seo-report.js — Rapport SEO hebdomadaire via GA4 Data API.
//
// Source : GA4 (le service account a déjà accès — pas besoin d'ajouter quoi que ce soit).
// Suit le TRAFIC ORGANIQUE Google (meilleur signal que les impressions Search Console,
// et contourne la limitation "service account refusé" des propriétés domaine SC) :
//   • sessions organiques Google, semaine vs semaine précédente (tendance) ;
//   • sessions organiques par page d'atterrissage → voir les landing commerciales décoller.
//
// Accès : admin (Bearer) OU ?secret=POSTSTAY_SECRET (cron Worker hebdo).

import { verifyBearer } from "./_adminauth.js";

// Pages commerciales suivies (on met en avant celles qui captent de l'organique).
const COMMERCIAL = new Set([
  "/sainte-luce-martinique", "/location-villa-martinique-piscine",
  "/location-appartement-vue-mer-schoelcher", "/location-groupe-sainte-luce",
  "/reservation-directe-martinique", "/seminaires", "/villa-rental-martinique",
]);

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const ORGANIC_FILTER = {
  filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { value: "Organic Search" } },
};

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type,Authorization" } });
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);
  const propertyId = env.GA4_PROPERTY_ID;
  if (!env.GA4_CLIENT_EMAIL || !env.GA4_PRIVATE_KEY || !propertyId) return json({ ok: false, error: "Service account / GA4_PROPERTY_ID non configuré" }, 200);

  try {
    const token = await getAccessToken(env.GA4_CLIENT_EMAIL, env.GA4_PRIVATE_KEY);
    const [cur, prev, landings] = await Promise.all([
      runReport(token, propertyId, {
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
        dimensionFilter: ORGANIC_FILTER,
      }),
      runReport(token, propertyId, {
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges: [{ startDate: "14daysAgo", endDate: "8daysAgo" }],
        dimensionFilter: ORGANIC_FILTER,
      }),
      runReport(token, propertyId, {
        dimensions: [{ name: "landingPagePlusQueryString" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
        dimensionFilter: ORGANIC_FILTER,
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 20,
      }),
    ]);

    const sessOf = rep => Number(rep?.rows?.[0]?.metricValues?.[0]?.value || 0);
    const curSess = sessOf(cur), prevSess = sessOf(prev);
    const deltaPct = prevSess ? Math.round((curSess - prevSess) / prevSess * 100) : null;

    const pages = (landings?.rows || []).map(r => {
      const path = (r.dimensionValues?.[0]?.value || "").split("?")[0];
      return { page: path, sessions: Number(r.metricValues?.[0]?.value || 0), commercial: COMMERCIAL.has(path) };
    });
    const commercialSessions = pages.filter(p => p.commercial).reduce((s, p) => s + p.sessions, 0);

    return json({
      ok: true,
      periode: { actuelle: "7 derniers jours", precedente: "8-14 j" },
      organique: { sessions: curSess, sessionsPrec: prevSess, deltaPct },
      pagesCommercialesOrganique28j: commercialSessions,   // organique 28j sur les landing commerciales
      topPagesOrganique: pages.slice(0, 12),               // top pages d'atterrissage organiques (28j)
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 200);
  }
}

// ── GA4 Data API ─────────────────────────────────────────────────────────────
async function runReport(token, propertyId, body) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GA4 API ${res.status}: ${JSON.stringify(d).slice(0, 200)}`);
  return d;
}

// ── Service Account JWT (scope Analytics readonly) ──
async function getAccessToken(clientEmail, rawKey) {
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600, iat: now,
  }));
  const signingInput = `${header}.${payload}`;
  const key = await importPrivateKey(rawKey);
  const sigBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${b64urlBuf(sigBuf)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token Google refusé : " + JSON.stringify(data).slice(0, 200));
  return data.access_token;
}
async function importPrivateKey(pem) {
  const normalized = pem.replace(/\\n/g, "\n");
  const b64 = normalized.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return crypto.subtle.importKey("pkcs8", buf.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}
function b64url(str) { return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"); }
function b64urlBuf(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"); }
