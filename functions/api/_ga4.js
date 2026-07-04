// _ga4.js — helper partagé Google Analytics Data API v1beta (GA4).
// Extrait de analytics.js (2026-07) pour être réutilisé par agents-impact.js
// (et à terme seo-report.js, qui garde encore sa copie locale).
//
// Secrets requis : GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY
// (clé privée PEM du service account, avec \n littéraux acceptés).

// ── GA4 Report ────────────────────────────────────────────────────────────────
export async function runReport(token, propertyId, body) {
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
export async function runReportSafe(token, propertyId, body) {
  try { return await runReport(token, propertyId, body); }
  catch { return null; }
}

export function parseReport(raw) {
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
export async function getAccessToken(clientEmail, rawKey) {
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
