// Cloudflare Pages Function — GET /api/send-pre-depart
// Cron J-1 checkout : email la veille du départ — consignes, heure de départ, late check-out, fidélité, avis Google.
// Auth : ?secret=<POSTSTAY_SECRET>
// Cron Worker : déclenché dans scheduled() 0 9 * * *

import { sendGuestEmail } from "./send-guest-email.js";

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

function formatCheckoutSteps(sections) {
  const section = (sections || []).find(s =>
    s.id === "checkout" || s.title?.toLowerCase().includes("départ") || s.title?.toLowerCase().includes("depart")
  );
  if (!section || !Array.isArray(section.items)) return null;
  return section.items
    .map(item => {
      if (typeof item === "string") return `✓ ${item}`;
      return `<strong>${item.label || ""}</strong>${item.value ? ` — ${item.value}` : ""}`;
    })
    .join("<br>");
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
      // Récupérer les instructions de départ depuis le guide
      let instructionsHtml = null;
      try {
        const guideRes = await fetch(`${url.origin}/api/guides?property_id=${b.bien_id || "amaryllis"}`);
        if (guideRes.ok) {
          const guideData = await guideRes.json();
          instructionsHtml = formatCheckoutSteps(guideData?.guide?.sections);
        }
      } catch {}

      const r = await sendGuestEmail(env, url.origin, {
        template: "pre-depart",
        to: b.email,
        subject: `Votre départ de ${b.bien_nom || "Amaryllis"} demain — consignes & informations`,
        vars: {
          prenom: b.prenom || "",
          bien_nom: b.bien_nom || "votre logement",
          checkout: b.checkout || target,
          instructions_depart: instructionsHtml || "Veuillez laisser le logement propre et en ordre. Merci de rassembler le linge sale, de jeter les ordures et d'éteindre toutes les lumières et climatisations.",
          wa_hote: "33610880772",
          lien_avis_google: GOOGLE_REVIEW[b.bien_id] || GOOGLE_REVIEW.default,
        },
      });

      if (r.ok) {
        await db.prepare("UPDATE direct_bookings SET pre_depart_sent = 1 WHERE rowid = ?").bind(b.rid).run();
        sent++;
      } else {
        console.error(`[pre-depart] échec ${b.email}: ${r.error}`);
        failed++;
      }
    }
    return json({ ok: true, target, candidats: (results || []).length, sent, failed });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
