// Netlify Function — POST /api/sheets-proxy

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Script-Url",
};

function resp(data, statusCode = 200) {
  return { statusCode, headers: CORS, body: JSON.stringify(data) };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS };
  }
  if (event.httpMethod !== "POST") {
    return resp({ error: "Méthode non autorisée" }, 405);
  }

  // Restrict X-Script-Url to script.google.com only (prevent SSRF)
  const headerUrl = event.headers?.["x-script-url"];
  let scriptUrl = process.env.APPS_SCRIPT_URL;
  if (!scriptUrl && headerUrl) {
    try {
      const p = new URL(headerUrl);
      if (p.hostname === "script.google.com" && p.protocol === "https:") scriptUrl = headerUrl;
    } catch {}
  }
  if (!scriptUrl) return resp({ error: "APPS_SCRIPT_URL manquante" }, 500);

  const body = event.body || "";
  let parsed = null;
  try { parsed = JSON.parse(body); } catch {}

  if (parsed && parsed.action === "importAllReservations" && Array.isArray(parsed.reservations)) {
    return forwardChunked(scriptUrl, "importAllReservations", parsed.reservations);
  }
  if (parsed && parsed.action === "importBeds24" && Array.isArray(parsed.bookings)) {
    return forwardChunked(scriptUrl, "importBeds24", parsed.bookings);
  }

  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      redirect: "follow",
    });
    const text = await res.text();
    try {
      JSON.parse(text);
      return { statusCode: 200, headers: CORS, body: text };
    } catch {
      return resp({
        error: "Apps Script returned non-JSON",
        status: res.status,
        preview: text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400),
      }, 502);
    }
  } catch (err) {
    return resp({ error: err.message }, 502);
  }
};

async function forwardChunked(scriptUrl, action, items) {
  const CHUNK_SIZE = 15;
  const chunks = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) chunks.push(items.slice(i, i + CHUNK_SIZE));

  let totalAdded = 0, totalUpdated = 0, errors = [];

  for (let ci = 0; ci < chunks.length; ci++) {
    const params = new URLSearchParams({ action, data: JSON.stringify(chunks[ci]) });
    try {
      const r = await fetch(`${scriptUrl}?${params}`, { redirect: "follow" });
      const t = await r.text();
      try {
        const d = JSON.parse(t);
        totalAdded   += d.added   || 0;
        totalUpdated += d.updated || 0;
        if (d.error) errors.push(`chunk ${ci}: ${d.error}`);
      } catch { errors.push(`chunk ${ci}: non-JSON response`); }
    } catch (err) {
      errors.push(`chunk ${ci}: ${err.message}`);
    }
  }

  const result = { ok: errors.length === 0, added: totalAdded, updated: totalUpdated, total: items.length, chunks: chunks.length };
  if (errors.length) result.errors = errors;
  return resp(result);
}
