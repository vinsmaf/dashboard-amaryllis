// GET /api/ical/<bienId>.ics?secret=<ICAL_EXPORT_SECRET>
//
// Génère un flux iCal (RFC 5545) à partir des réservations directes (D1
// `direct_bookings`) pour un bien donné. URL se terminant en .ics requise
// par Airbnb et Booking.com pour accepter l'import de calendrier externe.

const BIENS_VALIDES = [
  "amaryllis",
  "schoelcher",
  "geko",
  "mabouya",
  "zandoli",
  "iguana",
  "nogent",
];

function toIcalDate(dateStr) {
  return dateStr.replace(/-/g, "");
}

function escapeIcal(str) {
  return String(str ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function nowIcal() {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // Auth
  const secret = url.searchParams.get("secret");
  if (!secret || secret !== env.ICAL_EXPORT_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Extraire bienId depuis "amaryllis.ics" → "amaryllis"
  const file = params.file ?? "";
  const bienId = file.replace(/\.ics$/i, "");
  if (!bienId || !BIENS_VALIDES.includes(bienId)) {
    return new Response("Fichier invalide — utiliser ex: amaryllis.ics", { status: 400 });
  }

  const db = env.revenue_manager;
  if (!db) return new Response("D1 non disponible", { status: 500 });

  let rows;
  try {
    const result = await db
      .prepare(
        // Inclut les résas groupées (offre résidence) dont ce bien fait partie
        // (group_biens = CSV des bien_ids, encadré de virgules pour un match exact).
        `SELECT payment_intent_id, voyageur, checkin, checkout
         FROM direct_bookings
         WHERE (bien_id = ? OR (bien_id = 'groupe' AND (',' || group_biens || ',') LIKE '%,' || ? || ',%'))
           AND checkin  IS NOT NULL
           AND checkout IS NOT NULL
           AND (status IS NULL OR status != 'cancelled')
         ORDER BY checkin ASC`
      )
      .bind(bienId, bienId)
      .all();
    rows = result.results ?? [];
  } catch (err) {
    return new Response("Erreur D1 : " + err.message, { status: 500 });
  }

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
    // Garde défensive : ne jamais générer un VEVENT sans dates (iCal invalide)
    if (!row.checkin || !row.checkout) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:direct-${escapeIcal(row.payment_intent_id)}@villamaryllis.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${toIcalDate(row.checkin)}`,
      `DTEND;VALUE=DATE:${toIcalDate(row.checkout)}`,
      `SUMMARY:${escapeIcal("Réservation directe - " + (row.voyageur ?? ""))}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n") + "\r\n", {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${bienId}.ics"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
