// Cloudflare Pages Function — POST /api/beds24-manage
// Actions : find | confirm | cancel
// Sécurisé : token Beds24 jamais exposé côté navigateur.

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

      return json({
        ok: true,
        bookingId: match.id,
        arrival:   match.arrival,
        departure: match.departure,
        guestName: `${match.firstName || ""} ${match.lastName || ""}`.trim(),
        price:     match.price,
        status:    match.status,
      });

    } catch (e) {
      return json({ error: e.message }, 502);
    }
  }

  // ── CONFIRM / CANCEL ─────────────────────────────────────────────────────
  if (action === "confirm" || action === "cancel") {
    const { bookingId } = body;
    if (!bookingId) return json({ error: "bookingId requis" }, 400);

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

  return json({ error: `Action inconnue: ${action}` }, 400);
}
