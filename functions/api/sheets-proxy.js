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

// Cache KV sur action="read" (trouvé 2026-07-15 : cette action calcule revenus/occ/adr/
// revpar/cashflow pour 9 entités × 12 mois + relit "Toutes les Réservations" (706+ lignes) —
// 15-35s+ par appel, déclenchée automatiquement à CHAQUE ouverture du dashboard (App.jsx
// autoSyncDone, aucun debounce). Volume cumulé épuise le quota Apps Script du compte
// (déjà corrigé une fois côté GAS le jour même — fetchNameCols_, commit 44479b3 — mais le vrai
// problème est le VOLUME d'appels, pas seulement leur coût unitaire). Stale-while-revalidate
// identique à /api/revenue-summary (même KV CROSS_BRAIN_KV) : sert le cache immédiatement même
// expiré (sous HARD_TTL), rafraîchit en tâche de fond dès que SOFT_TTL est dépassé. Si l'appel
// Apps Script échoue (quota épuisé) ET qu'un cache existe (même hors HARD_TTL), on sert quand
// même ce cache plutôt que de remonter l'erreur — c'est ce qui empêchait le fallback "⚠ Seed
// local" côté client de ne jamais se déclencher qu'au tout premier appel à froid.
const READ_CACHE_KEY = "cache:sheets-read:v1";
const READ_SOFT_TTL_MS = 3 * 60 * 1000;   // au-delà : servir le cache mais rafraîchir en fond
const READ_HARD_TTL_MS = 24 * 60 * 60 * 1000; // au-delà (et refresh en fond jamais retenté avec succès) : calcul synchrone

async function fetchReadLive(scriptUrl) {
  const res = await fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "read" }),
    redirect: "follow",
  });
  const text = await res.text();
  const data = JSON.parse(text); // throws si HTML/erreur — traité par l'appelant
  if (data.error) throw new Error("Apps Script: " + data.error);
  return data;
}

async function refreshReadCache(scriptUrl, env) {
  const data = await fetchReadLive(scriptUrl);
  await env.CROSS_BRAIN_KV.put(READ_CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() }), { expirationTtl: 172800 });
  return data;
}

async function handleReadAction(scriptUrl, env, context) {
  let cached = null;
  if (env.CROSS_BRAIN_KV) {
    try {
      const raw = await env.CROSS_BRAIN_KV.get(READ_CACHE_KEY);
      if (raw) cached = JSON.parse(raw);
    } catch { /* cache corrompu — traité comme absent */ }
  }

  const age = cached ? Date.now() - cached.cachedAt : Infinity;
  if (cached && age < READ_HARD_TTL_MS) {
    if (age > READ_SOFT_TTL_MS) {
      context.waitUntil(refreshReadCache(scriptUrl, env).catch(() => {})); // échec silencieux, on retente au prochain appel
    }
    return json(cached.data, 200, { "X-Cache": age > READ_SOFT_TTL_MS ? "STALE" : "HIT" });
  }

  try {
    const data = env.CROSS_BRAIN_KV ? await refreshReadCache(scriptUrl, env) : await fetchReadLive(scriptUrl);
    return json(data, 200, { "X-Cache": "MISS" });
  } catch (e) {
    // Apps Script injoignable/quota épuisé : dernier recours, servir le cache même périmé
    // plutôt que de renvoyer une erreur (le client retomberait sur le seed local).
    if (cached) return json(cached.data, 200, { "X-Cache": "STALE-FALLBACK" });
    return json({ error: `Apps Script injoignable: ${e.message}` }, 502);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // sec (2026-07-06) : le gate Bearer admin ci-dessous cassait silencieusement 5 appelants
  // SERVEUR légitimes (Worker iCal, patch-booking, enrich-from-emails, trigger-sync,
  // beds24-webhook — aucun n'envoie de Bearer, ce sont des appels internes cron/webhook,
  // pas des requêtes admin depuis le navigateur) — trouvé le 2026-07-07 sur une résa Nogent
  // jamais remontée au Sheet. `?secret=POSTSTAY_SECRET` autorise ces appels internes,
  // Bearer admin reste le chemin pour les appels navigateur (App.jsx, Beds24Admin.jsx).
  const secretOk = !!env.POSTSTAY_SECRET && new URL(request.url).searchParams.get("secret") === env.POSTSTAY_SECRET;
  if (!secretOk && (env.ADMIN_PASSWORD || env.ADMIN_PWD)) {
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

  // ── Lecture principale du dashboard (coûteuse, appelée à chaque ouverture) → cache KV
  if (parsed && parsed.action === "read") {
    return handleReadAction(scriptUrl, env, context);
  }

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

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", ...extraHeaders },
  });
}
