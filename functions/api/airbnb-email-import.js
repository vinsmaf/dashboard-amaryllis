// functions/api/airbnb-email-import.js
import { redactName } from "./_log.js";
// POST /api/airbnb-email-import
// Reçoit un webhook Zapier contenant les données structurées d'un email
// de confirmation Airbnb (ou Booking.com) et les insère dans D1 direct_bookings.
//
// Auth : ?secret=<ZAPIER_WEBHOOK_SECRET> (query param)
//
// Body JSON attendu (envoyé par la zap Zapier) :
// {
//   platform:     "Airbnb" | "Booking.com" | "Autre",
//   airbnbId:     "HM8XXXXXX",          // code confirmation Airbnb/Booking
//   guestName:    "Jean Dupont",
//   guestEmail:   "jean@example.com",   // optionnel (Airbnb masque parfois)
//   guestPhone:   "+33612345678",        // optionnel
//   nbGuests:     2,
//   checkin:      "2026-08-15",         // YYYY-MM-DD
//   checkout:     "2026-08-22",         // YYYY-MM-DD
//   bienId:       "amaryllis",          // slug normalisé (voir BIENS map ci-dessous)
//   totalNet:     750.00,               // montant NET reçu par l'hôte (€)
//   rawSubject:   "Réservation confirmée — Jean arrive le 15 août",
//   rawBody:      "...",                // corps brut pour debug/audit
// }
//
// Zapier setup (côté Hotmail → Cloudflare) :
//   Trigger : Gmail/Outlook → New email matching "from:(airbnb) OR from:(booking)"
//   Step 1  : Formatter > Text > Extract pattern  (ou Code by Zapier JS)
//   Step 2  : POST vers https://villamaryllis.com/api/airbnb-email-import?secret={{ZAPIER_WEBHOOK_SECRET}}
//
// Dédup : le couple (platform + airbnbId) est la clé idempotente.
//         Un re-send Zapier ou un email de rappel ne crée pas de doublon.

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

// Normalisation des slugs de biens
// Accepte "Villa Amaryllis", "amaryllis", "AMARYLLIS", "villa amaryllis", etc.
const BIEN_ALIASES = {
  amaryllis:  ["amaryllis", "villa amaryllis"],
  zandoli:    ["zandoli"],
  iguana:     ["iguana", "villa iguana"],
  geko:       ["geko", "gecko"],
  mabouya:    ["mabouya"],
  schoelcher: ["schoelcher", "schœlcher", "bellevue", "bellevue schoelcher"],
  nogent:     ["nogent", "appartement nogent", "suresnes", "hauts-de-seine"],
};
const BIEN_NOMS = {
  amaryllis:  "Villa Amaryllis",
  zandoli:    "Zandoli",
  iguana:     "Villa Iguana",
  geko:       "Géko",
  mabouya:    "Mabouya",
  schoelcher: "Bellevue Schœlcher",
  nogent:     "Appartement Nogent",
};

function normalizeBienId(raw = "") {
  const s = raw.toLowerCase().trim();
  for (const [id, aliases] of Object.entries(BIEN_ALIASES)) {
    if (aliases.some(a => s.includes(a))) return id;
  }
  return null; // bien non reconnu
}

// Validation & nettoyage des données entrantes
function parseBody(body) {
  const errors = [];

  const platform = String(body.platform || "Airbnb").trim();
  const airbnbId = String(body.airbnbId || body.confirmationCode || "").trim();
  if (!airbnbId) errors.push("airbnbId manquant");

  const guestName = String(body.guestName || body.voyageur || "").trim();
  if (!guestName) errors.push("guestName manquant");

  // Dates : accepte YYYY-MM-DD ou DD/MM/YYYY ou MM/DD/YYYY
  const checkin  = parseDate(body.checkin  || body.arrivee || body.checkIn);
  const checkout = parseDate(body.checkout || body.depart  || body.checkOut);
  if (!checkin)  errors.push("checkin invalide");
  if (!checkout) errors.push("checkout invalide");
  if (checkin && checkout && checkout <= checkin) errors.push("checkout <= checkin");

  const bienIdRaw = body.bienId || body.bien_id || body.property || "";
  const bienId    = normalizeBienId(String(bienIdRaw));
  // bienId null = bien non reconnu, on insère quand même pour ne pas perdre la resa

  const totalNet  = parseFloat(String(body.totalNet || body.total || body.montant || "0").replace(",", "."));
  const nbGuests  = Math.max(1, parseInt(body.nbGuests || body.nb_guests || "1", 10));
  const guestEmail = String(body.guestEmail || body.email || "").trim().toLowerCase();
  const guestPhone = String(body.guestPhone || body.phone || "").trim();

  return {
    ok: errors.length === 0,
    errors,
    platform,
    airbnbId,
    guestName,
    guestEmail,
    guestPhone,
    checkin,
    checkout,
    bienId,
    bienNom: BIEN_NOMS[bienId] || bienIdRaw || "—",
    totalNet: isNaN(totalNet) ? 0 : totalNet,
    nbGuests,
    rawSubject: String(body.rawSubject || body.subject || "").slice(0, 500),
    rawBody:    String(body.rawBody    || body.body    || "").slice(0, 5000),
  };
}

function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();

  // YYYY-MM-DD (format préféré)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + "T12:00:00Z");
    return isNaN(d) ? null : s;
  }
  // DD/MM/YYYY (format français)
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const iso = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
    return iso;
  }
  // MM/DD/YYYY (format américain Airbnb EN)
  const mdyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const iso = `${mdyMatch[3]}-${mdyMatch[1].padStart(2, "0")}-${mdyMatch[2].padStart(2, "0")}`;
    return iso;
  }
  // Essai natif (ex: "15 août 2026", "August 15, 2026")
  const d = new Date(s);
  if (!isNaN(d)) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // ─── Auth ───────────────────────────────────────────────────────────────────
  // FAIL-CLOSED (SEC audit Fable 5 2026-07-09, Lot 4) : secret absent ou invalide → 401,
  // jamais d'acceptation silencieuse. Le secret est déjà posé en prod.
  const url    = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (!env.ZAPIER_WEBHOOK_SECRET || !secret || secret !== env.ZAPIER_WEBHOOK_SECRET) {
    return json({ error: "Secret invalide ou manquant" }, 401);
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  // ─── Migrations idempotentes ─────────────────────────────────────────────────
  try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN canal TEXT DEFAULT 'Direct'`).run(); } catch { /* existe déjà */ }
  try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN platform_booking_id TEXT`).run(); } catch { /* existe déjà */ }
  try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN raw_subject TEXT`).run(); } catch { /* existe déjà */ }

  // ─── Parse body ─────────────────────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body JSON invalide" }, 400);
  }

  const d = parseBody(body);
  if (!d.ok) {
    return json({ error: "Données invalides", details: d.errors }, 422);
  }

  // ID unique : platform + bookingId pour éviter les doublons inter-plateformes
  const paymentIntentId = `${d.platform.toLowerCase()}-${d.airbnbId}`;

  // ─── Upsert dans direct_bookings ────────────────────────────────────────────
  // Si la resa existe déjà : mise à jour silencieuse (idempotence Zapier)
  try {
    await db.prepare(`
      INSERT INTO direct_bookings
        (payment_intent_id, bien_id, bien_nom, voyageur, email, phone,
         nb_guests, total, depot, checkin, checkout,
         canal, platform_booking_id, raw_subject)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
      ON CONFLICT(payment_intent_id) DO UPDATE SET
        bien_id             = excluded.bien_id,
        bien_nom            = excluded.bien_nom,
        voyageur            = excluded.voyageur,
        email               = COALESCE(NULLIF(excluded.email, ''), direct_bookings.email),
        phone               = COALESCE(NULLIF(excluded.phone, ''), direct_bookings.phone),
        nb_guests           = excluded.nb_guests,
        total               = excluded.total,
        checkin             = excluded.checkin,
        checkout            = excluded.checkout,
        canal               = excluded.canal,
        platform_booking_id = excluded.platform_booking_id,
        raw_subject         = excluded.raw_subject
    `).bind(
      paymentIntentId,
      d.bienId || "inconnu",
      d.bienNom,
      d.guestName,
      d.guestEmail,
      d.guestPhone,
      d.nbGuests,
      d.totalNet,
      d.checkin,
      d.checkout,
      d.platform,
      d.airbnbId,
      d.rawSubject,
    ).run();

    console.log(`[airbnb-email-import] ✅ ${paymentIntentId} — ${redactName(d.guestName)} — ${d.bienId} ${d.checkin}→${d.checkout}`);

    return json({
      ok: true,
      id: paymentIntentId,
      bien: d.bienId,
      guest: d.guestName,
      checkin: d.checkin,
      checkout: d.checkout,
      total: d.totalNet,
      platform: d.platform,
    });
  } catch (e) {
    console.error("[airbnb-email-import] D1 error:", e?.message);
    return json({ error: "Erreur D1", message: e?.message }, 500);
  }
}
