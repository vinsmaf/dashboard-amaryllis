// Cloudflare Pages Function — GET /api/send-pre-depart
// Cron J-1 checkout : email la veille du départ — heure de départ, late check-out
// (80€/19h), remise fidélité -10%, avis Google.
// Auth : ?secret=<POSTSTAY_SECRET>
// Cron Worker : déclenché dans scheduled() 0 9 * * *

import { sendGuestEmail } from "./send-guest-email.js";
import { getBien } from "../../src/data/biens.js";
import { redactEmail } from "./_log.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const GOOGLE_REVIEW = {
  amaryllis:  "https://search.google.com/local/writereview?placeid=ChIJWbeKdLghQIwRCppz2lJ39Jk",
  zandoli:    "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  geko:       "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  mabouya:    "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  iguana:     "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  schoelcher: "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  nogent:     "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  default:    "https://search.google.com/local/writereview?placeid=ChIJWbeKdLghQIwRCppz2lJ39Jk",
};

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

  // ?date=YYYY-MM-DD pour déclencher manuellement sur une date donnée
  const dateParam = url.searchParams.get("date");
  const target = dateParam || dateStrPlusDays(1); // départs demain par défaut

  try {
    await db.prepare("ALTER TABLE direct_bookings ADD COLUMN pre_depart_sent INTEGER DEFAULT 0").run().catch(() => {});
    await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN status TEXT DEFAULT 'confirmed'`).run().catch(() => {});

    // Exclut les résas annulées (cf. cancel-booking.js).
    const { results } = await db.prepare(
      "SELECT rowid AS rid, * FROM direct_bookings WHERE checkout = ? AND pre_depart_sent = 0 AND email IS NOT NULL AND email != '' AND (status IS NULL OR status != 'cancelled')"
    ).bind(target).all();

    let sent = 0, failed = 0;
    for (const b of results || []) {
      const bien = getBien(b.bien_id || "amaryllis");
      const photoPath = bien?.photos?.[0];

      const r = await sendGuestEmail(env, url.origin, {
        template: "pre-depart",
        to: b.email,
        subject: `${b.prenom ? b.prenom + ", v" : "V"}otre départ de ${b.bien_nom || "Amaryllis"} est demain`,
        vars: {
          prenom: b.prenom || "",
          bien_nom: b.bien_nom || "votre logement",
          checkout: b.checkout || target,
          photo_url: photoPath ? `${url.origin}${photoPath}` : `${url.origin}/photos/amaryllis/01.webp`,
          wa_hote: "33610880772",
          lien_avis_google: GOOGLE_REVIEW[b.bien_id] || GOOGLE_REVIEW.default,
          // sc-023 (2026-07-16) : lien état des lieux de sortie — protège le voyageur
          // en cas de litige sur la caution.
          lien_etat_lieux: `https://villamaryllis.com/etat-des-lieux?bien=${encodeURIComponent(b.bien_id || "")}&type=sortie&checkin=${encodeURIComponent(b.checkin || "")}&checkout=${encodeURIComponent(b.checkout || target)}&voyageur=${encodeURIComponent(b.prenom || "")}&email=${encodeURIComponent(b.email || "")}`,
        },
      });

      if (r.ok) {
        await db.prepare("UPDATE direct_bookings SET pre_depart_sent = 1 WHERE rowid = ?").bind(b.rid).run();
        sent++;
      } else {
        console.error(`[pre-depart] échec ${redactEmail(b.email)}: ${r.error}`);
        failed++;
      }
    }
    return json({ ok: true, target, candidats: (results || []).length, sent, failed });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
