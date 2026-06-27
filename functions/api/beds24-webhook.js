// Cloudflare Pages Function — POST /api/beds24-webhook
// Reçoit les notifications Beds24 en temps réel → transmet à Apps Script
//
// ⚠️ MIGRÉ V1 → V2 (2026-06-13) — bug RESA-001 : le webhook utilisait encore
//   l'API Beds24 **V1** (api.beds24.com/json + BEDS24_API_KEY/BEDS24_PROP_KEY)
//   alors que tout le reste de l'app est passé en **V2** (token auto-refresh).
//   Les creds V1 n'étant plus valides, la résa fraîche n'était jamais récupérée
//   → bookings vide → rien écrit dans « Toutes les Réservations » ni « Revenus 2026 ».
//   Nogent ne passe PAS par le Worker iCal (getBookingUrls l'exclut) : le webhook
//   et le bouton 📊 manuel sont les SEULS chemins d'écriture sheet pour Nogent.
//   Désormais le webhook lit Beds24 V2 (getActiveBeds24Token) comme /api/beds24-bookings.
//
// Sécurité (arch-053) — vérification d'authenticité du webhook :
//   Configurer le secret Cloudflare `BEDS24_WEBHOOK_SECRET`, puis dans Beds24
//   ajouter le secret à l'URL du webhook : .../api/beds24-webhook?secret=XXXX
//   (ou header X-Webhook-Secret, ou signature HMAC-SHA256 dans X-Signature).
//   Tant que le secret n'est pas configuré → on log un warning mais on accepte
//   (rétro-compatibilité, migration en douceur).

import { getActiveBeds24Token } from "./beds24-refresh.js";
import { clog, timer } from "./_log.js";

const BEDS24_V2_URL = "https://beds24.com/api/v2/bookings";
const PROP_ID       = "158192";

// Comparaison à temps constant (anti timing-attack)
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// HMAC-SHA256(rawBody, secret) en hex — pour vérifier X-Signature si fourni
async function hmacHex(secret, rawBody) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Retourne { ok:true } si authentifié, sinon { ok:false, reason }
async function verifyWebhook(request, url, rawBody, secret) {
  if (!secret) {
    console.warn("[beds24-webhook] ⚠️ BEDS24_WEBHOOK_SECRET non configuré — webhook NON protégé");
    return { ok: true, unprotected: true };
  }
  // 1. Secret en query param ?secret=
  const qSecret = url.searchParams.get("secret");
  if (qSecret && safeEqual(qSecret, secret)) return { ok: true, via: "query" };
  // 2. Header X-Webhook-Secret
  const hSecret = request.headers.get("X-Webhook-Secret");
  if (hSecret && safeEqual(hSecret, secret)) return { ok: true, via: "header" };
  // 3. Signature HMAC-SHA256 dans X-Signature
  const sigHeader = request.headers.get("X-Signature") || request.headers.get("X-Beds24-Signature");
  if (sigHeader) {
    const expected = await hmacHex(secret, rawBody);
    const provided = sigHeader.replace(/^sha256=/i, "").trim().toLowerCase();
    if (safeEqual(provided, expected)) return { ok: true, via: "hmac" };
  }
  return { ok: false, reason: "secret/signature invalide ou absent" };
}

export async function onRequestPost(context) {
  const t = timer();
  const { request, env } = context;
  const url = new URL(request.url);

  const scriptUrl    = env.APPS_SCRIPT_URL;
  const webhookSecret = env.BEDS24_WEBHOOK_SECRET; // optionnel (recommandé)

  // V2 : token auto-refresh (D1 en priorité, env var en fallback) — même source que /api/beds24-bookings
  const token = await getActiveBeds24Token(env, env.revenue_manager);
  if (!token)                return json({ error: "BEDS24_TOKEN manquant (V2)" }, 500);
  if (!scriptUrl)            return json({ error: "APPS_SCRIPT_URL manquante" }, 500);

  // ── Lire le body brut (nécessaire pour la vérification HMAC) ──
  const rawBody = await request.text();

  // ── Sécurité : vérifier l'authenticité du webhook ──
  const auth = await verifyWebhook(request, url, rawBody, webhookSecret);
  if (!auth.ok) {
    console.warn("[beds24-webhook] 🚫 Webhook rejeté :", auth.reason);
    return json({ error: "Unauthorized" }, 401);
  }

  // ⚡ Anti double-réservation : purge IMMÉDIATE du cache de disponibilité Nogent.
  // get-availability met la dispo Nogent en cache (KV) ; sans purge, le site
  // pourrait vendre en direct des dates fraîchement réservées sur Booking.com
  // pendant la durée du cache. On purge dès qu'une notif Beds24 arrive
  // (création / modif / annulation), avant même de synchroniser le Sheet.
  try { if (env.AVAIL_CACHE) await env.AVAIL_CACHE.delete("avail_nogent"); } catch (e) { console.warn("[beds24-webhook] purge cache:", e.message); }

  // ── Parser le payload Beds24 ──
  let payload;
  try { payload = rawBody ? JSON.parse(rawBody) : {}; }
  catch { payload = {}; }

  console.log("[beds24-webhook] reçu:", JSON.stringify(payload));

  // Beds24 envoie { bookId, propId, ... } ou juste une notification de changement
  // On récupère le bookingId depuis le payload (plusieurs formats possibles)
  const bookingId = payload.bookId || payload.bookingId || payload.id;

  // ── Beds24 V2 : récupérer les résas Nogent récemment modifiées (2 jours) ──
  // On lit toujours par `modifiedFrom` (param prouvé, auto-réparant : rattrape un
  // éventuel webhook manqué). Si le payload porte un bookId, on cible cette résa ;
  // sinon on pousse toutes les résas récentes (upsert idempotent par `beds24-<id>`).
  const since = new Date(Date.now() - 2 * 86400 * 1000).toISOString().slice(0, 10);
  let bookings = [];
  try {
    const qp = new URLSearchParams({ propId: PROP_ID, modifiedFrom: since, numId: "50" });
    const res = await fetch(`${BEDS24_V2_URL}?${qp}`, { headers: { token } });
    const data = await res.json();
    if (data && data.success && Array.isArray(data.data)) {
      bookings = data.data;
    } else {
      console.warn("[beds24-webhook] V2 réponse inattendue:", JSON.stringify(data).slice(0, 300));
    }
  } catch (err) {
    console.error("[beds24-webhook] fetch V2 error:", err.message);
  }

  // Ciblage : si un bookId est fourni et présent dans le lot, ne pousser que lui.
  if (bookingId) {
    const one = bookings.filter(b => String(b.id) === String(bookingId));
    if (one.length > 0) bookings = one;
  }

  if (bookings.length === 0) {
    return json({ ok: true, msg: "Webhook reçu, aucune réservation à synchroniser" });
  }

  // ── Normaliser → format unifié "Toutes les Réservations" et envoyer à Apps Script ──
  const normalized = bookings.map(normalizeBooking);
  // id "beds24-<bookingId>" identique au sync principal → upsert sans doublon, un seul onglet.
  const reservations = normalized.map((b) => ({
    id:         "beds24-" + b.bookingId,
    bienId:     "nogent",
    voyageur:   b.guestName,
    canal:      b.channel || "Beds24",
    checkin:    b.arrival,
    checkout:   b.departure,
    nights:     b.nights,
    montant:    b.price,
    nb_guests:  b.numGuests,
    notes:      b.notes || "",
    source:     "Beds24",
    status:     b.status || "Confirmé",
    modifiedOn: b.modifiedOn || b.arrival || "",
  }));

  // ⚠️ Bug RESA-001 (2026-06-13) — NE PAS POSTer directement vers scriptUrl :
  //   Apps Script redirige les POST (302) et le redirect **supprime le body**
  //   (fetch repasse en GET) → Apps Script reçoit un postData vide → RIEN n'est écrit.
  //   On passe par /api/sheets-proxy (même origine) qui envoie en GET paginé
  //   (forwardChunked), exactement comme le Worker iCal et le bouton 📊 admin.
  const origin = new URL(request.url).origin;
  try {
    const r = await fetch(`${origin}/api/sheets-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "importAllReservations", reservations }),
    });
    const txt = await r.text();
    console.log("[beds24-webhook] sheets-proxy response:", txt.slice(0, 300));
    clog('beds24-webhook', 'info', { synced: normalized.length, ms: t() });

    // Rebuild revenus pour les résas annulées — importAllReservations est additif,
    // il ne soustrait jamais : sans rebuild, les revenus Nogent restent gonflés.
    const cancelledMonths2026 = [...new Set(
      reservations
        .filter(res => res.status === "Annulé" && res.checkin && res.checkin.startsWith("2026"))
        .map(res => parseInt(res.checkin.slice(5, 7), 10))
        .filter(Boolean)
    )];
    const cancelledMonths2027 = [...new Set(
      reservations
        .filter(res => res.status === "Annulé" && res.checkin && res.checkin.startsWith("2027"))
        .map(res => parseInt(res.checkin.slice(5, 7), 10))
        .filter(Boolean)
    )];

    if (cancelledMonths2026.length > 0 || cancelledMonths2027.length > 0) {
      const rebuildJobs = [];
      if (cancelledMonths2026.length > 0) {
        rebuildJobs.push(fetch(`${origin}/api/sheets-proxy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revenus2026RebuildBienApply", fromMonth: Math.min(...cancelledMonths2026), bien: "nogent" }),
        }).then(r2 => r2.text()).then(t2 => console.log("[beds24-webhook] rebuild 2026 Nogent:", t2.slice(0, 200)))
          .catch(e => console.error("[beds24-webhook] rebuild 2026 error:", e.message)));
      }
      if (cancelledMonths2027.length > 0) {
        rebuildJobs.push(fetch(`${origin}/api/sheets-proxy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revenus2027RebuildBienApply", fromMonth: Math.min(...cancelledMonths2027), bien: "nogent" }),
        }).then(r2 => r2.text()).then(t2 => console.log("[beds24-webhook] rebuild 2027 Nogent:", t2.slice(0, 200)))
          .catch(e => console.error("[beds24-webhook] rebuild 2027 error:", e.message)));
      }
      // waitUntil : répondre à Beds24 immédiatement, rebuild en arrière-plan
      context.waitUntil(Promise.all(rebuildJobs));
      console.log("[beds24-webhook] rebuild revenus planifié pour mois:", { 2026: cancelledMonths2026, 2027: cancelledMonths2027 });
    }

    return json({ ok: true, synced: normalized.length, script: txt.slice(0, 500) });
  } catch (err) {
    clog('beds24-webhook', 'error', { err: err.message, ms: t() });
    console.error("[beds24-webhook] sheets-proxy error:", err.message);
    return json({ error: err.message }, 502);
  }
}

// ── GET : endpoint de test / vérification Beds24 ──
export async function onRequestGet(context) {
  return json({ ok: true, msg: "Beds24 webhook endpoint actif", prop: PROP_ID });
}

// V2 booking → format unifié. Mirror de la normalisation de /api/beds24-bookings.
// (V2 : id, firstName/lastName, arrival/departure ISO, price string, status string,
//  referer canal, numAdult/numChild, bookingTime/modifiedTime, comments.)
function normalizeBooking(b) {
  const arrival   = b.arrival   || "";
  const departure = b.departure || "";
  const nights = (() => {
    if (!arrival || !departure) return 0;
    const a = new Date(arrival   + "T12:00:00Z");
    const c = new Date(departure + "T12:00:00Z");
    return Math.round((c - a) / 86400000);
  })();
  return {
    bookingId:   String(b.id || ""),
    guestName:   `${b.firstName || ""} ${b.lastName || ""}`.trim() || "—",
    email:       b.email || "",
    phone:       b.phone || b.mobile || "",
    arrival,
    departure,
    nights,
    channel:     channelLabel(b.referer || b.channel),
    price:       parseFloat(b.price) || 0,   // même champ que le sync 📊 → dedup cohérent
    status:      statusLabel(b.status),
    statusCode:  String(b.status),
    createdOn:   b.bookingTime  || "",
    modifiedOn:  b.modifiedTime || "",
    numGuests:   (parseInt(b.numAdult) || 1) + (parseInt(b.numChild) || 0),
    notes:       b.comments || b.notes || "",
  };
}

// V2 status (string) → libellé FR
function statusLabel(status) {
  const labels = {
    "new": "Nouveau", "confirmed": "Confirmé", "cancelled": "Annulé",
    "request": "Demande", "black": "Bloqué", "closed": "Fermé", "archived": "Archivé",
  };
  return labels[status] || status || "Inconnu";
}

function channelLabel(r) {
  if (!r) return "Direct";
  const s = r.toLowerCase();
  if (s.includes("airbnb"))  return "Airbnb";
  if (s.includes("booking")) return "Booking.com";
  if (s.includes("expedia")) return "Expedia";
  if (s.includes("vrbo"))    return "VRBO";
  if (s.includes("direct"))  return "Direct";
  return r;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
