// GET|POST /api/trigger-sync — Force une re-sync manuelle sans attendre le cron Worker.
//
// Deux modes :
//   ?type=direct (défaut) — relit D1 direct_bookings → GAS Sheet (résas Stripe Martinique).
//                           Ne nécessite aucun secret supplémentaire.
//   ?type=full            — appelle aussi le Worker /sync si WORKER_SYNC_URL est configuré.
//                           (iCal Airbnb/Booking + tout le reste)
//
// Auth : Bearer CLAUDE_SECRET (ou token signé admin).
// Usage typique : vérifier qu'une résa directe est bien dans le Sheet sans attendre 15min.
//
//   curl -X POST "https://villamaryllis.com/api/trigger-sync" \
//     -H "Authorization: Bearer <CLAUDE_SECRET>" \
//     -H "Content-Type: application/json" \
//     -d '{"type":"direct"}'

import { verifyBearer } from "./_adminauth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const auth = await verifyBearer(request, env);
  if (!auth.ok) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  let body = {};
  try { body = request.method === "POST" ? await request.json() : {}; } catch {}
  const type = url.searchParams.get("type") || body.type || "direct";

  const origin = url.origin;
  const results = {};

  // ── Sync direct_bookings D1 → GAS Sheet ──────────────────────────────────────
  // Réplique Worker fetchDirectBookingsAsEvents + pushToSheets (résas Stripe sans Beds24)
  if (!env.revenue_manager) {
    results.direct = { ok: false, error: "D1 revenue_manager non lié" };
  } else {
    try {
      const rows = await env.revenue_manager.prepare(
        `SELECT payment_intent_id, bien_id, bien_nom, voyageur, total, checkin, checkout, canal
         FROM direct_bookings
         WHERE checkout >= date('now', '-90 days')`
      ).all();
      const reservations = (rows?.results || [])
        .filter(r => r.bien_id && r.checkin && r.checkout)
        .map(r => ({
          id:       "direct-" + r.payment_intent_id,
          bienId:   r.bien_id,
          voyageur: r.voyageur || "—",
          // Canal réel (cf. workers/ical-sync/index.js fetchDirectBookingsAsEvents, même fix) :
          // les résas importées via airbnb-email-import.js gardent leur vrai canal en D1.
          canal:    r.canal || "Direct",
          checkin:  r.checkin,
          checkout: r.checkout,
          montant:  Math.round(r.total || 0),
          fromIcal: true,
          notes:    "",
        }));

      if (reservations.length === 0) {
        results.direct = { ok: true, synced: 0, msg: "Aucune résa directe dans D1 (90j)" };
      } else {
        const r = await fetch(`${origin}/api/sheets-proxy?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "importAllReservations", reservations }),
        });
        const txt = await r.text();
        let parsed = {};
        try { parsed = JSON.parse(txt); } catch {}
        results.direct = { ok: r.ok, synced: reservations.length, gas: parsed };
      }
    } catch (e) {
      results.direct = { ok: false, error: e.message };
    }
  }

  // ── Full sync via Worker (si WORKER_SYNC_URL configuré) ──────────────────────
  if (type === "full") {
    const workerUrl = env.WORKER_SYNC_URL;
    if (!workerUrl) {
      results.worker = { ok: false, msg: "WORKER_SYNC_URL non configuré — seule la sync direct est disponible" };
    } else {
      try {
        const r = await fetch(workerUrl, { method: "GET", headers: { "Cache-Control": "no-store" } });
        const txt = await r.text();
        let parsed = {};
        try { parsed = JSON.parse(txt); } catch {}
        results.worker = { ok: r.ok, status: r.status, data: parsed };
      } catch (e) {
        results.worker = { ok: false, error: e.message };
      }
    }
  }

  return json({ ok: true, type, results });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
