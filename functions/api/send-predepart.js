// Cloudflare Pages Function — GET /api/send-predepart
// crm — Email pré-départ J-1 pour les RÉSERVATIONS DIRECTES uniquement.
//
// Lit en D1 (direct_bookings) les départs demain non encore notifiés,
// envoie le template "pre-depart" (checklist + late-checkout push),
// puis marque predepart_sent = 1.
//
// Auth : ?secret=<POSTSTAY_SECRET>
// Cron : appelé depuis le Worker amaryllis-ical-sync (cron 0 9 * * *)

import { sendGuestEmail } from "./send-guest-email.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const HOST_WA = "33610880772";

function dateStrPlusDays(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  const target = dateStrPlusDays(1); // départs demain
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS direct_bookings (
      payment_intent_id TEXT PRIMARY KEY, bien_nom TEXT, voyageur TEXT,
      total INTEGER, depot INTEGER, checkin TEXT, checkout TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      email TEXT, prenom TEXT, bien_id TEXT,
      prearrivee_sent INTEGER DEFAULT 0, poststay_sent INTEGER DEFAULT 0)`).run();

    // Ajouter la colonne predepart_sent si absente (migration non destructive)
    try {
      await db.prepare("ALTER TABLE direct_bookings ADD COLUMN predepart_sent INTEGER DEFAULT 0").run();
    } catch { /* colonne déjà présente */ }

    const { results } = await db.prepare(
      "SELECT rowid AS rid, * FROM direct_bookings WHERE checkout = ? AND predepart_sent = 0 AND email IS NOT NULL AND email != ''"
    ).bind(target).all();

    let sent = 0, failed = 0;
    for (const b of results || []) {
      const r = await sendGuestEmail(env, url.origin, {
        template: "pre-depart",
        to: b.email,
        subject: `${b.prenom ? b.prenom + ", v" : "V"}otre départ de ${b.bien_nom || "Amaryllis"} est demain`,
        vars: {
          prenom:           b.prenom || "",
          bien_nom:         b.bien_nom || "votre logement",
          bien_id:          b.bien_id || "amaryllis",
          checkout:         b.checkout || target,
          wa_hote:          HOST_WA,
          late_checkout_url: `https://villamaryllis.com/guide-sejour/${b.bien_id || "amaryllis"}?utm_source=email&utm_medium=email&utm_campaign=pre-depart#late-checkout`,
        },
      });
      if (r.ok) {
        await db.prepare("UPDATE direct_bookings SET predepart_sent = 1 WHERE rowid = ?").bind(b.rid).run();
        sent++;
      } else {
        console.error(`[predepart] échec ${b.email}: ${r.error}`);
        failed++;
      }
    }
    return json({ ok: true, target, candidats: (results || []).length, sent, failed });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
