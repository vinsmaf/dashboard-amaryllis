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

// Actions qui MODIFIENT le Sheet → le cache de lecture devient faux à la seconde même.
// Sans invalidation, une correction restait invisible jusqu'à 24h (cf. incident ci-dessous).
// (setConfig est volontairement absent : il passe par site-config.js en direct, et n'écrit
// que les prix journaliers — pas les résas/revenus que contient ce cache.)
const WRITE_ACTIONS = new Set([
  "addReservation",
  "deleteReservation",
  "importAllReservations",
  "cancelReservations",
  "revenus2026RebuildBienApply",
  "revenus2026FromMonth",
]);

// INCIDENT 2026-07-17 (trouvé en corrigeant une résa réelle) : le cache est resté figé
// **17,5 heures** sur des données périmées — le dashboard admin affichait un montant faux
// alors que le Sheet était juste, et rien ne le signalait.
//
// Cause : `refreshReadCache` en `waitUntil` ne peut PAS aboutir. L'action "read" prend ~32s
// (mesuré en live : 9 entités × 12 mois + 706 lignes de résas), au-delà de ce que Cloudflare
// laisse tourner en tâche de fond après la réponse. Chaque lecture relançait donc un refresh
// qui se faisait tuer → cache jamais mis à jour → servi tel quel jusqu'au HARD_TTL de 24h.
// Le `.catch(() => {})` rendait l'échec totalement muet : le mécanisme conçu pour être
// tolérant s'était transformé en mensonge silencieux.
//
// Correctif : (1) toute écriture purge le cache — la fraîcheur suit les VRAIS changements
// plutôt qu'une horloge ; (2) l'échec du refresh est loggué ; (3) l'âge du cache est exposé.
// On ne réduit PAS le HARD_TTL : servir du cache vaut mieux qu'un dashboard vide quand
// Apps Script est en quota (comportement voulu à l'origine, toujours pertinent).
async function purgeReadCache(env) {
  if (!env.CROSS_BRAIN_KV) return;
  try { await env.CROSS_BRAIN_KV.delete(READ_CACHE_KEY); }
  catch (e) { console.error("[sheets-proxy] purge du cache échouée", e?.message); }
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
  const ageMin = cached ? Math.round(age / 60000) : null;

  if (cached && age < READ_HARD_TTL_MS) {
    if (age > READ_SOFT_TTL_MS) {
      // Tentative de refresh en fond : elle ABOUTIT rarement (~32s vs budget waitUntil).
      // On la garde — elle réussit quand Apps Script répond vite — mais on ne compte plus
      // dessus : l'invalidation à l'écriture est désormais le vrai garant de fraîcheur.
      context.waitUntil(
        refreshReadCache(scriptUrl, env).catch((e) => {
          console.error(JSON.stringify({
            level: "warn", fn: "sheets-proxy", msg: "refresh cache en fond échoué",
            cache_age_min: ageMin, error: String(e?.message || e), ts: new Date().toISOString(),
          }));
        })
      );
    }
    return json(cached.data, 200, {
      "X-Cache": age > READ_SOFT_TTL_MS ? "STALE" : "HIT",
      "X-Cache-Age-Min": String(ageMin),
    });
  }

  try {
    const data = env.CROSS_BRAIN_KV ? await refreshReadCache(scriptUrl, env) : await fetchReadLive(scriptUrl);
    return json(data, 200, { "X-Cache": "MISS" });
  } catch (e) {
    // Apps Script injoignable/quota épuisé : dernier recours, servir le cache même périmé
    // plutôt que de renvoyer une erreur (le client retomberait sur le seed local).
    if (cached) {
      console.error(JSON.stringify({
        level: "error", fn: "sheets-proxy", msg: "Apps Script injoignable — cache périmé servi",
        cache_age_min: ageMin, error: String(e?.message || e), ts: new Date().toISOString(),
      }));
      return json(cached.data, 200, { "X-Cache": "STALE-FALLBACK", "X-Cache-Age-Min": String(ageMin) });
    }
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

  // ── Purge explicite du cache de lecture ──
  // Pour les appelants qui écrivent dans le Sheet SANS passer par ce proxy : Planning.jsx
  // tape `${scriptUrl}?action=addReservation` en direct (flux historique, laissé intact).
  // Sans ça, éditer une résa depuis le Planning laissait le cache mentir, et le prochain
  // rechargement (« Sheet = source autoritaire ») réécrasait la correction avec du périmé.
  if (parsed && parsed.action === "purgeReadCache") {
    await purgeReadCache(env);
    return json({ ok: true, purged: true });
  }

  // ── Actions qui écrivent des tableaux → chunked GET (Apps Script redirect bug) ──
  // ⚠️ Le "forwarding POST classique" ci-dessous (branche générique) suffit pour la plupart
  // des actions (vérifié en live 2026-07-16 sur revenus2026RebuildBienDry), MAIS PAS pour les
  // actions qui écrivent des TABLEAUX/payloads — bug RESA-001 (redirect Apps Script → POST
  // perd le body) déjà connu pour importAllReservations, et confirmé aussi pour
  // cancelReservations (utilisé par le Worker via sendCancellations, jusqu'ici toujours
  // silencieusement no-op côté Airbnb/Booking.com — trouvé par audit 2026-07-16).
  // Toute écriture rend le cache de lecture faux → on le purge. C'est ce qui garantit
  // la fraîcheur (le refresh en fond, lui, n'aboutit pas — voir handleReadAction).
  // Un DELETE KV est instantané, contrairement au refresh : waitUntil suffit largement.
  const isWrite = parsed && WRITE_ACTIONS.has(parsed.action);

  // ⚠️ importAllReservations = le sync du Worker, toutes les 10 min, et il rejoue
  // TOUT le catalogue (`allEvents`), pas seulement les nouveautés. Purger à chaque
  // passage laisserait le cache froid en permanence → 32s à CHAQUE ouverture du
  // dashboard. On ne purge donc que si de vraies lignes ont été AJOUTÉES.
  // Trade-off assumé : une simple mise à jour de montant par le sync (ex. scrape
  // Booking) n'invalide pas le cache — elle deviendra visible à la prochaine purge
  // (nouvelle résa ou édition manuelle). Reste très supérieur à l'état antérieur,
  // où absolument rien n'invalidait le cache.
  if (parsed && parsed.action === "importAllReservations" && Array.isArray(parsed.reservations)) {
    const res = await forwardChunked(scriptUrl, "importAllReservations", parsed.reservations);
    const body = await res.clone().json().catch(() => ({}));
    if ((body.added || 0) > 0) context.waitUntil(purgeReadCache(env));
    return res;
  }
  if (parsed && parsed.action === "cancelReservations" && Array.isArray(parsed.annulations)) {
    const res = await forwardChunked(scriptUrl, "cancelReservations", parsed.annulations);
    const body = await res.clone().json().catch(() => ({}));
    // Une annulation change les revenus → purge dès qu'au moins une a été traitée.
    if ((body.cancelled || 0) > 0) context.waitUntil(purgeReadCache(env));
    return res;
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
      if (isWrite) context.waitUntil(purgeReadCache(env));
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

  // Accumulateurs génériques : added/updated (importAllReservations), cancelled/ids/rebuilt
  // (cancelReservations) — chaque action ne peuple que ses propres champs, les autres restent 0/[].
  let totalAdded = 0, totalUpdated = 0, totalCancelled = 0, allIds = [], allRebuilt = [], errors = [];

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
        totalAdded     += d.added     || 0;
        totalUpdated   += d.updated   || 0;
        totalCancelled += d.cancelled || 0;
        if (Array.isArray(d.ids))     allIds.push(...d.ids);
        if (Array.isArray(d.rebuilt)) allRebuilt.push(...d.rebuilt);
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
    ...(action === "cancelReservations" ? { cancelled: totalCancelled, ids: allIds, rebuilt: allRebuilt } : {}),
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
