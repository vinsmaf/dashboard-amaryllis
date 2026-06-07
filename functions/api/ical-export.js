// GET /api/ical-export?bienId=<id>&secret=<ICAL_EXPORT_SECRET>
//
// Génère un flux iCal (RFC 5545) à partir des réservations directes (D1
// `direct_bookings`) pour un bien donné. Destiné à être souscrit comme
// "calendrier externe" par Airbnb et Booking.com afin de bloquer
// automatiquement les dates — évite le double-booking.
//
// Protection : query param `secret` (pas de Bearer, car Airbnb/Booking.com
// font un GET simple sans header custom).

const BIENS_VALIDES = [
  "amaryllis",
  "schoelcher",
  "geko",
  "mabouya",
  "zandoli",
  "iguana",
  "nogent",
];

// Formate une date YYYY-MM-DD en YYYYMMDD (format iCal DATE).
function toIcalDate(dateStr) {
  return dateStr.replace(/-/g, "");
}

// Échappe les caractères spéciaux dans les valeurs de propriétés iCal.
function escapeIcal(str) {
  return String(str ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Retourne le timestamp UTC courant au format iCal (DTSTAMP).
function nowIcal() {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // --- Authentification par secret query param ---
  const secret = url.searchParams.get("secret");
  if (!secret || secret !== env.ICAL_EXPORT_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // --- Validation du bienId ---
  const bienId = url.searchParams.get("bienId");
  if (!bienId || !BIENS_VALIDES.includes(bienId)) {
    return new Response("Paramètre bienId manquant ou invalide", {
      status: 400,
    });
  }

  // --- Lecture des réservations dans D1 ---
  const db = env.revenue_manager;
  if (!db) {
    return new Response("D1 non disponible", { status: 500 });
  }

  let rows;
  try {
    const result = await db
      .prepare(
        `SELECT payment_intent_id, voyageur, checkin, checkout
         FROM direct_bookings
         WHERE bien_id = ?
         ORDER BY checkin ASC`
      )
      .bind(bienId)
      .all();
    rows = result.results ?? [];
  } catch (err) {
    return new Response("Erreur lecture D1 : " + err.message, { status: 500 });
  }

  // --- Génération iCal ---
  const dtstamp = nowIcal();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Amaryllis Locations//villamaryllis.com//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Réservations directes - ${bienId}`,
    "X-WR-CALDESC:Blocages automatiques depuis villamaryllis.com",
  ];

  for (const row of rows) {
    const uid = `direct-${row.payment_intent_id}@villamaryllis.com`;
    const summary = `Réservation directe - ${row.voyageur ?? ""}`;
    const dtstart = toIcalDate(row.checkin);
    const dtend = toIcalDate(row.checkout);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcal(uid)}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${escapeIcal(summary)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  // RFC 5545 : lignes séparées par CRLF
  const body = lines.join("\r\n") + "\r\n";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${bienId}.ics"`,
      // Pas de cache : les OTAs doivent toujours avoir les données fraîches.
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
