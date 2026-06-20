// Cloudflare Pages Function — GET /api/analytics
// Proxy vers Google Analytics Data API v1beta (GA4)
// Auth : Service Account JWT → Bearer token
//
// Secrets requis dans Cloudflare Pages :
//   GA4_PROPERTY_ID   — ID numérique GA4 (ex: 123456789)
//   GA4_CLIENT_EMAIL  — email du service account
//   GA4_PRIVATE_KEY   — clé privée PEM (avec \n littéraux)

export async function onRequestGet(context) {
  const { env } = context;

  const propertyId  = env.GA4_PROPERTY_ID;
  const clientEmail = env.GA4_CLIENT_EMAIL;
  const privateKey  = env.GA4_PRIVATE_KEY;

  if (!propertyId || !clientEmail || !privateKey) {
    return json({ error: "GA4 non configuré — secrets manquants", missing: { propertyId: !propertyId, clientEmail: !clientEmail, privateKey: !privateKey } }, 503);
  }

  try {
    const token = await getAccessToken(clientEmail, privateKey);

    // Exécuter les rapports en parallèle (data-006 : conversions par bien ; data-046 : funnel events)
    const [overview, pages, countries, sources, devices, bienConversions, funnel, revenue, byBien, byChannel, byChannel7d] = await Promise.all([
      runReport(token, propertyId, {
        dimensions:  [{ name: "date" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "bounceRate" }, { name: "averageSessionDuration" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }, { startDate: "60daysAgo", endDate: "31daysAgo" }],
        orderBys:    [{ dimension: { dimensionName: "date" } }],
      }),
      runReport(token, propertyId, {
        dimensions:  [{ name: "pagePath" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }, { name: "averageSessionDuration" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
        limit:       15,
      }),
      runReport(token, propertyId, {
        dimensions:  [{ name: "country" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
        limit:       10,
      }),
      runReport(token, propertyId, {
        dimensions:  [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
        limit:       10,
      }),
      runReport(token, propertyId, {
        dimensions:  [{ name: "deviceCategory" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys:    [{ metric: { metricName: "sessions" }, desc: true }],
      }),
      // data-006 : trafic + events par page bien (/amaryllis, /zandoli, etc.)
      runReport(token, propertyId, {
        dimensions:  [{ name: "pagePath" }],
        metrics:     [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "averageSessionDuration" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            inListFilter: { values: ["/amaryllis","/zandoli","/iguana","/geko","/mabouya","/schoelcher","/nogent"] },
          },
        },
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
      // data-046 : funnel events (view_item → begin_checkout → add_payment_info → purchase) — global (non ventilé bien)
      // Pas de dimension custom bien_id ici → fonctionne sans déclaration GA4 préalable.
      runReport(token, propertyId, {
        dimensions:  [{ name: "eventName" }],
        metrics:     [{ name: "eventCount" }],
        dateRanges:  [{ startDate: "30daysAgo", endDate: "today" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: { values: ["view_item", "begin_checkout", "add_payment_info", "purchase", "generate_lead"] },
          },
        },
      }),
      // data-049 : revenu total 30j (€) — somme des "value" des events purchase
      runReportSafe(token, propertyId, {
        metrics:    [{ name: "totalRevenue" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      }),
      // data-049 : réservations + revenu PAR BIEN (dim custom bien_id, créée 2026-06-04 ;
      //            se remplit sous ~24-48h, vide avant — non bloquant grâce à runReportSafe)
      runReportSafe(token, propertyId, {
        dimensions: [{ name: "customEvent:bien_id" }],
        metrics:    [{ name: "eventCount" }, { name: "totalRevenue" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "purchase" } } },
        orderBys:   [{ metric: { metricName: "eventCount" }, desc: true }],
        limit:      20,
      }),
      // data-049 : sessions + réservations + revenu PAR CANAL d'acquisition
      runReportSafe(token, propertyId, {
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics:    [{ name: "sessions" }, { name: "ecommercePurchases" }, { name: "totalRevenue" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys:   [{ metric: { metricName: "sessions" }, desc: true }],
        limit:      12,
      }),
      // data-pub : canal 7j — pour la section "Performance Pub" (ads lancés récemment)
      runReportSafe(token, propertyId, {
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics:    [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        orderBys:   [{ metric: { metricName: "sessions" }, desc: true }],
        limit:      12,
      }),
    ]);

    // traf-011 : stale-while-revalidate — sert le cache pendant le refresh background
    return new Response(JSON.stringify({
      ok: true,
      overview:         parseReport(overview),
      pages:            parseReport(pages),
      countries:        parseReport(countries),
      sources:          parseReport(sources),
      devices:          parseReport(devices),
      bienConversions:  parseReport(bienConversions), // data-006
      funnel:           parseReport(funnel),           // data-046
      revenue:          parseReport(revenue),          // data-049 : revenu total €
      byBien:           parseReport(byBien),           // data-049 : résas + revenu / bien
      byChannel:        parseReport(byChannel),        // data-049 : résas + revenu / canal
      byChannel7d:      parseReport(byChannel7d),      // data-pub : canal 7j (perf pub)
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });

  } catch (err) {
    return json({ error: err.message }, 502);
  }
}

// ── GA4 Report ────────────────────────────────────────────────────────────────
async function runReport(token, propertyId, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method:  "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ ...body, keepEmptyRows: false }),
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GA4 API ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

// Variante tolérante : un rapport secondaire (revenu/par bien/par canal) qui échoue
// — ex. dimension custom pas encore propagée, métrique indisponible — renvoie null
// au lieu de faire planter tout le dashboard. parseReport(null) → [].
async function runReportSafe(token, propertyId, body) {
  try { return await runReport(token, propertyId, body); }
  catch { return null; }
}

function parseReport(raw) {
  if (!raw || !raw.rows) return [];
  const dimNames = (raw.dimensionHeaders || []).map(h => h.name);
  const metNames = (raw.metricHeaders  || []).map(h => h.name);
  return raw.rows.map(row => {
    const obj = {};
    (row.dimensionValues || []).forEach((v, i) => { obj[dimNames[i]] = v.value; });
    (row.metricValues    || []).forEach((v, i) => { obj[metNames[i]] = parseFloat(v.value) || 0; });
    return obj;
  });
}

// ── Service Account JWT ───────────────────────────────────────────────────────
async function getAccessToken(clientEmail, rawKey) {
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss:   clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud:   "https://oauth2.googleapis.com/token",
    exp:   now + 3600,
    iat:   now,
  }));

  const signingInput = `${header}.${payload}`;
  const key = await importPrivateKey(rawKey);
  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );
  const sig = b64urlBuf(sigBuf);
  const jwt = `${signingInput}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token GA4 refusé : " + JSON.stringify(data));
  return data.access_token;
}

async function importPrivateKey(pem) {
  // Accepte les \n littéraux ou les vrais sauts de ligne
  const normalized = pem.replace(/\\n/g, "\n");
  const b64 = normalized.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return crypto.subtle.importKey(
    "pkcs8",
    buf.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function b64url(str) {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64urlBuf(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "s-maxage=300" },
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } });
}
