// Cloudflare Pages Function — GET /api/send-prearrivee
// crm — Email pré-arrivée J-3 pour les RÉSERVATIONS DIRECTES uniquement.
//
// Lit en D1 (direct_bookings) les arrivées dans 3 jours non encore notifiées,
// envoie le template "pre-arrivee" (SANS le code d'accès réel — communiqué 24h avant),
// puis marque prearrivee_sent = 1.
//
// Auth : ?secret=<POSTSTAY_SECRET>
// Cron-job.org : GET https://villamaryllis.com/api/send-prearrivee?secret=<SECRET> chaque jour ~9h UTC

import { sendGuestEmail } from "./send-guest-email.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const HOST_WA = "33610880772"; // WhatsApp hôte (format international sans +)
const ADDRESSES = {
  amaryllis: "Résidence Amaryllis, hauteurs de Sainte-Luce, Martinique",
  zandoli:   "Résidence Amaryllis, hauteurs de Sainte-Luce, Martinique",
  geko:      "Résidence Amaryllis, hauteurs de Sainte-Luce, Martinique",
  mabouya:   "Résidence Amaryllis, hauteurs de Sainte-Luce, Martinique",
  iguana:    "Résidence Amaryllis, hauteurs de Sainte-Luce, Martinique",
  schoelcher:"Bellevue, hauteurs de Schœlcher, Martinique",
  nogent:    "Nogent-sur-Marne, Île-de-France",
  groupe:    "Résidence Amaryllis, Sainte-Luce, Martinique",
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

  const target = dateStrPlusDays(3); // arrivées dans 3 jours
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS direct_bookings (
      payment_intent_id TEXT PRIMARY KEY, bien_nom TEXT, voyageur TEXT,
      total INTEGER, depot INTEGER, checkin TEXT, checkout TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      email TEXT, prenom TEXT, bien_id TEXT,
      prearrivee_sent INTEGER DEFAULT 0, poststay_sent INTEGER DEFAULT 0)`).run();
    // Email obligatoire : les lignes notify-booking sans email sont ignorées.
    const { results } = await db.prepare(
      "SELECT rowid AS rid, * FROM direct_bookings WHERE checkin = ? AND prearrivee_sent = 0 AND email IS NOT NULL AND email != ''"
    ).bind(target).all();

    let sent = 0, failed = 0;
    for (const b of results || []) {
      const r = await sendGuestEmail(env, url.origin, {
        template: "pre-arrivee",
        to: b.email,
        subject: `Votre séjour à ${b.bien_nom || "Amaryllis"} approche — quelques infos pratiques`,
        vars: {
          prenom: b.prenom || "",
          bien_nom: b.bien_nom || "votre logement",
          checkin: b.checkin, checkout: b.checkout || "",
          code_acces: "communiqué 24 h avant votre arrivée",
          adresse: ADDRESSES[b.bien_id] || "Martinique",
          wa_hote: HOST_WA,
          services_url: `https://villamaryllis.com/services/${b.bien_id || "amaryllis"}`,
        },
      });
      if (r.ok) {
        await db.prepare("UPDATE direct_bookings SET prearrivee_sent = 1 WHERE rowid = ?").bind(b.rid).run();
        sent++;
      } else {
        console.error(`[prearrivee] échec ${b.email}: ${r.error}`);
        failed++;
      }
    }
    return json({ ok: true, target, candidats: (results || []).length, sent, failed });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
