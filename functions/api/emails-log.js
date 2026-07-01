// functions/api/emails-log.js
// GET /api/emails-log?group=clients          → liste agrégée par destinataire
// GET /api/emails-log?to=<email>             → fil d'un destinataire
// GET /api/emails-log?booking_id=<id>        → fil d'une résa
// GET /api/emails-log?body=1&id=<emailId>    → HTML complet d'un email
//
// Auth : Bearer admin OU ?secret=<POSTSTAY_SECRET>
// Filtre toujours category='client' (les emails internes sont invisibles ici)

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "GET") return json({ error: "GET requis" }, 405);

  // Auth : admin OU secret
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  try {
    // Mode body : HTML complet d'un email
    if (url.searchParams.get("body") === "1") {
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "id requis" }, 400);
      const row = await db.prepare(
        `SELECT id, resend_id, to_email, from_email, subject, html, text, sent_at, status, error, template, direction
         FROM emails_log WHERE id = ? AND category = 'client'`
      ).bind(id).first();
      if (!row) return json({ error: "introuvable" }, 404);

      // Lazy-load HTML depuis Resend si NULL en D1 (emails importés rétroactivement
      // ont html=NULL parce que le fetch détail a été désactivé pendant l'import).
      // Cache le résultat en D1 pour les prochains accès.
      if ((!row.html || row.html === "") && row.resend_id && env.RESEND_API_KEY) {
        try {
          const r = await fetch(`https://api.resend.com/emails/${row.resend_id}`, {
            headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
          });
          if (r.ok) {
            const detail = await r.json();
            row.html = detail.html || "";
            row.text = detail.text || "";
            // Cache en D1 (best-effort)
            try {
              await db.prepare(
                "UPDATE emails_log SET html = ?, text = ? WHERE id = ?"
              ).bind(row.html, row.text, row.id).run();
            } catch (e) { console.error("[emails-log] cache html failed:", e?.message || e); }
          }
        } catch (e) { console.error("[emails-log] resend fetch failed:", e?.message || e); }
      }
      return json({ email: row });
    }

    // Mode booking_id : tous les emails d'une résa
    // NB : "guest_email" = l'adresse voyageur quelle que soit la direction du message
    // (to_email si direction='out', from_email si direction='in' — cf. migration 0004).
    // Sans cette normalisation, les réponses entrantes se regrouperaient toutes sous
    // "contact@villamaryllis.com" au lieu de rester rattachées à chaque voyageur.
    const GUEST_EMAIL_EXPR = "CASE WHEN direction = 'in' THEN from_email ELSE to_email END";

    const bookingId = url.searchParams.get("booking_id");
    if (bookingId) {
      const { results } = await db.prepare(
        `SELECT id, to_email, from_email, direction, subject, template, status, sent_at, opened_at, clicked_at, bien_id, booking_id
         FROM emails_log
         WHERE booking_id = ? AND category = 'client'
         ORDER BY sent_at DESC
         LIMIT 100`
      ).bind(bookingId).all();
      return json({ emails: results || [] });
    }

    // Mode to : fil d'un voyageur (identifié par son adresse, quel que soit le sens des messages)
    const to = url.searchParams.get("to");
    if (to) {
      const { results } = await db.prepare(
        `SELECT id, to_email, from_email, direction, subject, template, status, sent_at, opened_at, clicked_at, bien_id, booking_id
         FROM emails_log
         WHERE ${GUEST_EMAIL_EXPR} = ? AND category = 'client'
         ORDER BY sent_at DESC
         LIMIT 100`
      ).bind(to).all();
      return json({ emails: results || [] });
    }

    // Mode group=clients : agrégat par voyageur (fusion entrant + sortant)
    if (url.searchParams.get("group") === "clients") {
      const { results } = await db.prepare(
        `SELECT
           ${GUEST_EMAIL_EXPR} as to_email,
           COUNT(*) as count,
           MAX(sent_at) as last_sent,
           MAX(CASE WHEN direction = 'in' THEN sent_at END) as last_inbound_at,
           MAX(bien_id) as bien_id,
           MAX(booking_id) as booking_id
         FROM emails_log
         WHERE category = 'client'
         GROUP BY ${GUEST_EMAIL_EXPR}
         ORDER BY last_sent DESC
         LIMIT 200`
      ).all();
      // Pour chaque voyageur, fetch le sujet + statut + direction du dernier message
      const enriched = [];
      for (const row of results || []) {
        const last = await db.prepare(
          `SELECT subject, status, direction FROM emails_log
           WHERE ${GUEST_EMAIL_EXPR} = ? AND category = 'client'
           ORDER BY sent_at DESC LIMIT 1`
        ).bind(row.to_email).first();
        enriched.push({
          ...row,
          last_subject: last?.subject || "",
          last_status: last?.status || "",
          last_direction: last?.direction || "out",
          has_unread_reply: !!row.last_inbound_at && row.last_inbound_at === row.last_sent,
        });
      }
      return json({ clients: enriched });
    }

    return json({ error: "param requis : group=clients, to=, booking_id=, ou body=1&id=" }, 400);
  } catch (e) {
    return json({ error: e.message, stack: e.stack }, 500);
  }
}
