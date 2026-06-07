// functions/api/emails-import-resend.js
// POST /api/emails-import-resend
// Importe rétroactivement les emails envoyés via Resend dans la table emails_log,
// pour les emails antérieurs au déploiement du helper _sendEmail.js.
//
// Body JSON (tous optionnels) :
//   { to: "client@example.com" }      → filtre par destinataire (substring, case insensitive)
//   { since: 1717718400000 }          → ne traite que les emails depuis cette date (unix ms)
//   { maxPages: 5 }                   → nb de pages Resend à parcourir (default 5, max 10)
//   { category: "client" }            → catégorie à attribuer (default "client")
//
// Auth : Bearer admin OU ?secret=<POSTSTAY_SECRET>
//
// Comportement :
//   1. Récupère les emails Resend (paginés, 100 par page)
//   2. Pour chaque email matchant le filtre :
//      a. Skip si déjà importé (dedup par resend_id)
//      b. Tente de matcher un booking via direct_bookings.email → bien_id + booking_id
//      c. Fetch le HTML complet (Resend /emails/{id})
//      d. INSERT dans emails_log
//   3. Retourne { ok, fetched, imported, skipped, filtered, errors }

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "POST requis" }, 405);

  // Auth
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  if (!env.RESEND_API_KEY) return json({ error: "RESEND_API_KEY manquante" }, 503);
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  const body = await request.json().catch(() => ({}));
  const filterTo = body.to ? String(body.to).toLowerCase().trim() : null;
  const since = Number(body.since) || (Date.now() - 14 * 86400 * 1000); // 14 derniers jours par défaut
  const maxPages = Math.min(10, Number(body.maxPages) || 5);
  const category = body.category === "internal" ? "internal" : "client";

  // 1. Récupère les bookings pour le matching email → booking
  const { results: bookings } = await db.prepare(
    "SELECT email, payment_intent_id, bien_id FROM direct_bookings WHERE email IS NOT NULL AND email != ''"
  ).all();
  const bookingByEmail = {};
  for (const b of bookings || []) {
    const e = String(b.email).toLowerCase().trim();
    if (e && !bookingByEmail[e]) bookingByEmail[e] = b;
  }

  // 2. Paginate Resend
  const allEmails = [];
  let cursor = null;
  let stopReason = "max_pages_reached";
  for (let page = 0; page < maxPages; page++) {
    const listUrl = `https://api.resend.com/emails?limit=100${cursor ? `&after=${cursor}` : ""}`;
    const r = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return json({ error: `Resend API ${r.status}`, details: errText.slice(0, 300) }, 502);
    }
    const data = await r.json();
    const emails = data.data || [];
    if (emails.length === 0) { stopReason = "no_more_emails"; break; }
    allEmails.push(...emails);
    // Stop si on est passé sous la date 'since'
    const last = emails[emails.length - 1];
    const lastDate = new Date(last.created_at).getTime();
    if (lastDate < since) { stopReason = "reached_since"; break; }
    cursor = last.id;
    if (emails.length < 100) { stopReason = "last_page"; break; }
  }

  // 3. Filtre + import
  let imported = 0, skipped = 0, filtered = 0, errors = 0;
  const importedDetails = [];
  for (const e of allEmails) {
    const to = Array.isArray(e.to) ? e.to.join(",") : String(e.to || "");
    const toLower = to.toLowerCase();
    const createdMs = new Date(e.created_at).getTime();

    if (createdMs < since) continue;
    if (filterTo && !toLower.includes(filterTo)) { filtered++; continue; }

    // Dedup par resend_id
    const existing = await db.prepare("SELECT id FROM emails_log WHERE resend_id = ?").bind(e.id).first();
    if (existing) { skipped++; continue; }

    // Match booking
    const firstTo = toLower.split(",")[0].trim();
    const booking = bookingByEmail[firstTo];

    // Ne pas fetch le HTML ici (trop coûteux en CPU/temps) — le HTML sera lazy-chargé
    // par /api/emails-log?body=1&id=... si nécessaire (à implémenter en v2).
    // On stocke juste les métadonnées (subject, to, from, date).
    const html = null;
    const text = null;
    const subject = e.subject || e.last_event || "(sans sujet)";

    // INSERT
    try {
      const id = `resend_${e.id}`;
      await db.prepare(
        `INSERT INTO emails_log
          (id, resend_id, to_email, from_email, subject, template, category, bien_id, booking_id, html, text, status, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        e.id,
        to,
        e.from || "",
        subject,
        "imported_from_resend",
        category,
        booking?.bien_id || null,
        booking?.payment_intent_id || null,
        html || null,
        text || null,
        "sent",
        createdMs
      ).run();
      imported++;
      importedDetails.push({ to, subject, sent_at: new Date(createdMs).toISOString(), bien_id: booking?.bien_id || null, booking_id: booking?.payment_intent_id || null });
    } catch (err) {
      errors++;
      console.error("[import] insert failed:", err?.message || err);
    }
  }

  return json({
    ok: true,
    fetched: allEmails.length,
    imported,
    skipped,
    filtered,
    errors,
    stop_reason: stopReason,
    since: new Date(since).toISOString(),
    filter_to: filterTo,
    samples: importedDetails.slice(0, 5),
  });
}
