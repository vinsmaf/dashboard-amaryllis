// GET /api/direct-bookings → liste des résas directes (Stripe) au format
// unifié attendu par l'admin Planning (`reservations` array).
//
// Pourquoi : sans ça, une résa Stripe Martinique sans bookingId Beds24 reste
// invisible dans l'admin (le Planning lit Sheet + Beds24 uniquement).
// App.jsx fusionne cette source dans son état local au sync.

import { verifyBearer } from "./_adminauth.js";

const NOMS = {
  amaryllis:  "Villa Amaryllis",
  schoelcher: "Bellevue Schœlcher",
  geko:       "Géko",
  mabouya:    "Mabouya",
  zandoli:    "Zandoli",
  iguana:     "Villa Iguana",
  nogent:     "Appartement Nogent",
};

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  },
});

export async function onRequestGet(context) {
  const { request, env } = context;

  // Auth : Bearer token admin (signé) OU password rétro-compat — cf. /api/contacts
  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "unauthorized" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ reservations: [], reason: "D1 non liée" });

  try {
    const rows = await db.prepare(
      `SELECT payment_intent_id, bien_id, bien_nom, voyageur, email, total, depot, checkin, checkout
       FROM direct_bookings
       WHERE checkout >= date('now', '-90 days')
       ORDER BY checkin DESC`
    ).all();

    const reservations = (rows?.results || []).map(r => {
      const nights = (() => {
        if (!r.checkin || !r.checkout) return 0;
        const a = new Date(r.checkin + "T12:00:00Z"), b = new Date(r.checkout + "T12:00:00Z");
        return Math.round((b - a) / 86400000);
      })();
      return {
        id:        "direct-" + r.payment_intent_id,
        bienId:    r.bien_id || "",
        voyageur:  r.voyageur || "—",
        canal:     "Direct",
        checkin:   r.checkin,
        checkout:  r.checkout,
        nights,
        montant:   r.total || 0,
        depot:     r.depot || 0,
        nb_guests: 1,
        notes:     r.email ? `Email: ${r.email}` : "",
        source:    "Stripe direct",
        status:    "Confirmé",
        bienNom:   r.bien_nom || NOMS[r.bien_id] || "",
        email:     r.email || "",
      };
    });

    return json({ reservations, count: reservations.length });
  } catch (e) {
    return json({ error: e.message, reservations: [] }, 500);
  }
}
