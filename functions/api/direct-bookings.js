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

  // RM-19 — base voyageurs UNIFIÉE (1 ligne par email, repeaters en tête). Échelle de fidélité :
  // détecte les clients revenus en DIRECT (canal 0% commission), leurs biens et leur LTV.
  if (new URL(request.url).searchParams.get("view") === "guests") {
    try {
      const g = await db.prepare(
        `SELECT lower(trim(email)) AS email, MAX(prenom) AS prenom, MAX(phone) AS phone,
                COUNT(*) AS nb_sejours, GROUP_CONCAT(DISTINCT bien_id) AS biens,
                MIN(checkin) AS premier_sejour, MAX(checkin) AS dernier_sejour,
                SUM(total) AS total_cumule
         FROM direct_bookings
         WHERE email IS NOT NULL AND email != ''
         GROUP BY lower(trim(email))
         ORDER BY nb_sejours DESC, dernier_sejour DESC`
      ).all();
      const guests = (g?.results || []).map(r => ({
        ...r,
        biens: r.biens ? r.biens.split(",").filter(Boolean) : [],
        repeater: (r.nb_sejours || 0) >= 2,
      }));
      return json({ guests, count: guests.length, repeaters: guests.filter(x => x.repeater).length });
    } catch (e) {
      return json({ error: e.message, guests: [] }, 500);
    }
  }

  try {
    // Migrations idempotentes : ajoute les colonnes si absentes de la table live.
    try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN phone TEXT`).run(); } catch { /* déjà présente */ }
    try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN nb_guests INTEGER DEFAULT 1`).run(); } catch { /* déjà présente */ }
    try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN nb_pets INTEGER DEFAULT 0`).run(); } catch { /* déjà présente */ }
    const rows = await db.prepare(
      `SELECT payment_intent_id, bien_id, bien_nom, voyageur, email, phone, nb_guests, nb_pets, total, depot, checkin, checkout
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
        nb_guests: r.nb_guests || 1,
        nb_pets:   r.nb_pets || 0,
        phone:     r.phone || "",
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
