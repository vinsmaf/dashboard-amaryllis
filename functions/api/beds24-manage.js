// Cloudflare Pages Function — POST /api/beds24-manage
// Actions : find | confirm | cancel (publiques, tunnel voyageur) | restoreGuest (admin)
// Sécurisé : token Beds24 jamais exposé côté navigateur.

import { rateLimit } from "./_ratelimit.js";
import { verifyBearer } from "./_adminauth.js";

const BEDS24_V2_BOOKINGS = "https://beds24.com/api/v2/bookings";
const PROP_ID = "158192";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Rate-limit anti-abus (endpoint PUBLIC, tunnel de résa) — généreux, fail-open.
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rl = await rateLimit(env.revenue_manager, { key: `b24manage:${ip}`, limit: 30, windowSec: 60 });
  if (!rl.ok) return json({ error: "Trop de tentatives, réessayez dans un instant." }, 429);

  const token = env.BEDS24_TOKEN;
  if (!token) return json({ error: "BEDS24_TOKEN manquant" }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const { action } = body;

  // ── FIND ─────────────────────────────────────────────────────────────────
  if (action === "find") {
    const { email, lastName, checkin } = body;
    if (!email && !lastName) return json({ error: "email ou lastName requis" }, 400);

    const qp = new URLSearchParams({ propId: PROP_ID, numId: "50" });

    if (checkin) {
      // Réservation pour une date précise
      qp.set("arrivalFrom", checkin);
      qp.set("arrivalTo",   checkin);
    } else {
      // Pas de date : chercher dans les 6 dernières heures
      const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
      qp.set("modifiedFrom", since);
    }

    try {
      const res = await fetch(`${BEDS24_V2_BOOKINGS}?${qp}`, { headers: { token } });
      const data = await res.json();
      if (!data.success) return json({ error: "Erreur Beds24 find", raw: data }, 502);

      const bookings = (data.data || []).filter(b => b.status !== "cancelled");

      // Correspondance : email exact (priorité) ou nom de famille
      const byEmail = email
        ? bookings.find(b => b.email && b.email.toLowerCase() === email.toLowerCase())
        : null;
      const byName = lastName
        ? bookings.find(b => b.lastName && b.lastName.toLowerCase() === lastName.toLowerCase())
        : null;

      const match = byEmail || byName;
      if (!match) {
        return json({ error: "Réservation Beds24 non trouvée", tried: bookings.length }, 404);
      }

      // Use totalPrice (includes cleaning fee + taxes) if available, fallback to price
      const totalAmount = match.totalPrice ?? match.invoiceAmount ?? match.price;

      return json({
        ok: true,
        bookingId: match.id,
        arrival:   match.arrival,
        departure: match.departure,
        guestName: `${match.firstName || ""} ${match.lastName || ""}`.trim(),
        price:     totalAmount,
        status:    match.status,
      });

    } catch (e) {
      return json({ error: e.message }, 502);
    }
  }

  // ── CONFIRM / CANCEL ─────────────────────────────────────────────────────
  // Sécurité (audit 2026-07-15) : ces 2 actions publiques ne vérifiaient RIEN d'autre
  // qu'un bookingId — confirm pouvait valider une résa Nogent sans paiement Stripe réel
  // (2 requêtes publiques suffisaient), cancel pouvait annuler n'importe quelle résa
  // réelle avec juste un bookingId trouvé via find() (IDOR). Les 2 vérifications
  // ci-dessous ferment ces trous sans changer le comportement du tunnel légitime.
  if (action === "confirm" || action === "cancel") {
    const { bookingId } = body;
    if (!bookingId) return json({ error: "bookingId requis" }, 400);

    if (action === "confirm") {
      const { paymentIntentId } = body;
      if (!paymentIntentId) return json({ error: "paymentIntentId requis" }, 400);
      const sk = env.STRIPE_SECRET_KEY;
      if (!sk) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500);

      try {
        const piRes = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
          headers: { Authorization: `Bearer ${sk}` },
        });
        const pi = await piRes.json();
        if (!piRes.ok || pi.error) return json({ error: "PaymentIntent introuvable" }, 403);
        if (pi.status !== "succeeded") return json({ error: "Paiement non confirmé" }, 403);
        const tiedBookingId = pi.metadata?.beds24Id || pi.metadata?.bookingId;
        if (String(tiedBookingId) !== String(bookingId)) {
          return json({ error: "Ce paiement ne correspond pas à cette réservation" }, 403);
        }
      } catch (e) {
        return json({ error: `Vérification Stripe échouée: ${e.message}` }, 502);
      }
    }

    if (action === "cancel") {
      const { email, lastName } = body;
      if (!email && !lastName) return json({ error: "email ou lastName requis" }, 400);

      try {
        // Même fenêtre/forme que l'action find() ci-dessus — cancel() n'est appelé que
        // juste après la création de la résa dans ce tunnel (échec paiement / fermeture
        // sans payer), donc "modifiée dans les 6 dernières heures" couvre le cas réel.
        const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
        const qp = new URLSearchParams({ propId: PROP_ID, numId: "50", modifiedFrom: since });
        const res = await fetch(`${BEDS24_V2_BOOKINGS}?${qp}`, { headers: { token } });
        const data = await res.json();
        if (!data.success) return json({ error: "Erreur Beds24 (vérification annulation)", raw: data }, 502);

        const match = (data.data || []).find(b => String(b.id) === String(bookingId));
        if (!match) return json({ error: "Réservation introuvable ou trop ancienne pour vérification" }, 404);

        const emailOk = email && match.email && match.email.toLowerCase() === email.toLowerCase();
        const nameOk  = lastName && match.lastName && match.lastName.toLowerCase() === lastName.toLowerCase();
        if (!emailOk && !nameOk) return json({ error: "Vérification d'identité échouée" }, 403);
      } catch (e) {
        return json({ error: `Vérification échouée: ${e.message}` }, 502);
      }
    }

    const newStatus = action === "confirm" ? "confirmed" : "cancelled";

    // Beds24 V2 : PUT /api/v2/bookings avec tableau de mises à jour
    const payload = [{ id: String(bookingId), status: newStatus }];

    try {
      const res = await fetch(BEDS24_V2_BOOKINGS, {
        method: "PUT",
        headers: { token, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (!res.ok || data.success === false) {
        // Fallback : essai avec PATCH sur la ressource individuelle
        const res2 = await fetch(`${BEDS24_V2_BOOKINGS}/${bookingId}`, {
          method: "PUT",
          headers: { token, "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const data2 = await res2.json().catch(() => ({}));
        if (!res2.ok) return json({ error: `Beds24 ${action} échoué`, raw: data2 }, 502);
      }

      return json({ ok: true, bookingId, status: newStatus });

    } catch (e) {
      return json({ error: e.message }, 502);
    }
  }

  // ── RESTORE GUEST (admin) ────────────────────────────────────────────────
  // Repose nom + prix + statut confirmé sur une résa Beds24 — ex. quand un bloc
  // calendrier manuel ("black"/Bloqué, sans nom ni prix) doit redevenir une vraie
  // résa voyageur (cf. incident 2026-07-15, Ines Dali/Nogent, dates prolongées mais
  // nom/prix perdus). Distinct de confirm/cancel (publics) : celui-ci écrit des
  // données arbitraires sur une résa → réservé admin.
  if (action === "restoreGuest") {
    const auth = await verifyBearer(request, env);
    if (!auth.ok) return json({ error: "Accès refusé" }, 401);

    const { bookingId, firstName, lastName, price } = body;
    if (!bookingId || !firstName || !lastName || price == null) {
      return json({ error: "Champs requis : bookingId, firstName, lastName, price" }, 400);
    }

    const payload = [{ id: String(bookingId), status: "confirmed", firstName, lastName, price: Number(price) }];

    try {
      const res = await fetch(BEDS24_V2_BOOKINGS, {
        method: "PUT",
        headers: { token, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      // 500 et non 502 : Cloudflare intercepte les 502/503/504 émis par le Worker et les
      // remplace par SA PROPRE page d'erreur HTML (comportement par défaut de la zone,
      // famille "Bad Gateway") — le JSON ci-dessous n'atteignait jamais le navigateur,
      // d'où "Unexpected token '<', <!DOCTYPE" côté admin (trouvé en direct 2026-07-16,
      // via wrangler pages deployment tail sur une tentative réelle de Vincent).
      if (!res.ok || data.success === false) {
        return json({ error: "Beds24 restoreGuest échoué", raw: data }, 500);
      }

      return json({ ok: true, bookingId, firstName, lastName, price: Number(price), status: "confirmed" });

    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  return json({ error: `Action inconnue: ${action}` }, 400);
}
