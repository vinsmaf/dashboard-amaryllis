// Cloudflare Pages Function — POST /api/sheets-proxy
// Proxy serveur → Apps Script pour éviter les CORS sur les gros payloads
// Le APPS_SCRIPT_URL peut venir de l'env OU du header X-Script-Url (depuis admin)
//
// ⚠️  Apps Script redirige les POST et supprime le body → les actions qui écrivent
//     des données sont envoyées en GET paginé (chunks) pour contourner ce bug Google.
//
// sec (2026-07-06) : ce proxy donne accès à l'onglet "Toutes les Réservations"
// (noms/emails/montants voyageurs) et était public. Tous les appelants identifiés
// (src/App.jsx syncFromSheets + import résas, src/tabs/Beds24Admin.jsx) sont admin-only
// (routés sous /admin, password-gated) — aucun flux public ne l'utilise. Auth
// Bearer admin requise (pattern contacts.js / _adminauth.js).

import { verifyBearer } from "./_adminauth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (env.ADMIN_PASSWORD || env.ADMIN_PWD) {
    const { ok } = await verifyBearer(request, env);
    if (!ok) return json({ error: "Non autorisé" }, 401);
  }

  // URL Apps Script : env Cloudflare en priorité, sinon header envoyé par l'admin
  const headerUrl = request.headers.get("X-Script-Url");
  let scriptUrl = env.APPS_SCRIPT_URL;
  if (!scriptUrl && headerUrl) {
    try {
      const p = new URL(headerUrl);
      if (p.hostname === "script.google.com" && p.protocol === "https:") scriptUrl = headerUrl;
    } catch {}
  }
  if (!scriptUrl) return json({ error: "APPS_SCRIPT_URL manquante" }, 500);

  let body;
  try { body = await request.text(); }
  catch { return json({ error: "Body invalide" }, 400); }

  let parsed;
  try { parsed = JSON.parse(body); } catch { parsed = null; }

  // ── Actions qui écrivent des tableaux → chunked GET (Apps Script redirect bug)
  if (parsed && parsed.action === "importAllReservations" && Array.isArray(parsed.reservations)) {
    return forwardChunked(scriptUrl, "importAllReservations", parsed.reservations);
  }

  // ── Toutes les autres actions → forwarding POST classique ──
  try {
    const res = await fetch(scriptUrl, {
      method:   "POST",
      headers:  { "Content-Type": "application/json" },
      body,
      redirect: "follow",
    });
    const text = await res.text();
    // Si la réponse est du JSON valide → la retourner telle quelle
    try {
      JSON.parse(text);
      return new Response(text, {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } catch (_) {
      // Apps Script a retourné du HTML (erreur) → encapsuler pour debug
      return json({
        error: "Apps Script returned non-JSON",
        status: res.status,
        preview: text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400),
      }, 502);
    }
  } catch (err) {
    return json({ error: err.message }, 502);
  }
}

// ── Envoi paginé en GET (contourne le bug redirect Apps Script POST) ──────────
// Limite URL Apps Script : ~2000 chars. On chunk dynamiquement pour ne jamais dépasser.
const APPS_SCRIPT_URL_LIMIT = 1800; // marge de sécurité

async function forwardChunked(scriptUrl, action, items) {
  // Découpe les items en chunks dont l'URL encodée reste sous la limite Apps Script
  const chunks = [];
  let current = [];
  for (const item of items) {
    current.push(item);
    const testUrl = `${scriptUrl}?action=${action}&data=${encodeURIComponent(JSON.stringify(current))}`;
    if (testUrl.length > APPS_SCRIPT_URL_LIMIT && current.length > 1) {
      chunks.push(current.slice(0, -1));
      current = [item];
    }
  }
  if (current.length > 0) chunks.push(current);

  let totalAdded = 0, totalUpdated = 0, errors = [];

  for (let ci = 0; ci < chunks.length; ci++) {
    const params = new URLSearchParams({
      action,
      data: JSON.stringify(chunks[ci]),
    });
    const url = `${scriptUrl}?${params}`;
    try {
      const r = await fetch(url, { redirect: "follow" });
      const t = await r.text();
      try {
        const d = JSON.parse(t);
        totalAdded   += d.added   || 0;
        totalUpdated += d.updated || 0;
        if (d.error) errors.push(`chunk ${ci}: ${d.error}`);
      } catch (_) {
        errors.push(`chunk ${ci}: non-JSON response`);
      }
    } catch (err) {
      errors.push(`chunk ${ci}: ${err.message}`);
    }
  }

  const result = {
    ok:      errors.length === 0,
    added:   totalAdded,
    updated: totalUpdated,
    total:   items.length,
    chunks:  chunks.length,
  };
  if (errors.length) result.errors = errors;
  return json(result);
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Script-Url",
    },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
