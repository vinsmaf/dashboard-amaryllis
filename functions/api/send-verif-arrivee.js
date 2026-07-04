// Cloudflare Pages Function — GET /api/send-verif-arrivee
// Cron J+1 arrivée : email court "tout se passe bien ?" le lendemain du check-in.
// Contrairement au rappel "Mi-séjour" interne (Worker, J+3, réservé aux séjours
// 5+ nuits, envoyé À VINCENT pour relance manuelle), celui-ci part directement
// au voyageur, dès J+1, pour TOUS les séjours.
// Auth : ?secret=<POSTSTAY_SECRET>
// Cron Worker : déclenché dans scheduled() 0 9 * * *

import { sendGuestEmail } from "./send-guest-email.js";
import { getBien } from "../../src/data/biens.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

function dateStrMinusDays(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
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

  // ?date=YYYY-MM-DD pour déclencher manuellement sur une date d'arrivée donnée
  const dateParam = url.searchParams.get("date");
  const target = dateParam || dateStrMinusDays(1); // arrivées d'hier par défaut

  try {
    await db.prepare("ALTER TABLE direct_bookings ADD COLUMN arrivee_verif_sent INTEGER DEFAULT 0").run().catch(() => {});
    await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN status TEXT DEFAULT 'confirmed'`).run().catch(() => {});

    const { results } = await db.prepare(
      "SELECT rowid AS rid, * FROM direct_bookings WHERE checkin = ? AND arrivee_verif_sent = 0 AND email IS NOT NULL AND email != '' AND (status IS NULL OR status != 'cancelled')"
    ).bind(target).all();

    let sent = 0, failed = 0;
    for (const b of results || []) {
      const bien = getBien(b.bien_id || "amaryllis");
      const photoPath = bien?.photos?.[0];

      const r = await sendGuestEmail(env, url.origin, {
        template: "verif-arrivee",
        to: b.email,
        subject: `${b.prenom ? b.prenom + ", t" : "T"}out se passe bien à ${b.bien_nom || "Amaryllis"} ?`,
        vars: {
          prenom: b.prenom || "",
          bien_nom: b.bien_nom || "votre logement",
          photo_url: photoPath ? `${url.origin}${photoPath}` : `${url.origin}/photos/amaryllis/01.webp`,
          wa_hote: "33610880772",
        },
      });

      if (r.ok) {
        await db.prepare("UPDATE direct_bookings SET arrivee_verif_sent = 1 WHERE rowid = ?").bind(b.rid).run();
        sent++;
      } else {
        console.error(`[verif-arrivee] échec ${b.email}: ${r.error}`);
        failed++;
      }
    }
    return json({ ok: true, target, candidats: (results || []).length, sent, failed });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
