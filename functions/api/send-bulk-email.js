// functions/api/send-bulk-email.js
// Envoi groupé / segmenté depuis l'admin messagerie.
//
// POST /api/send-bulk-email
//   Body: {
//     segment: "hot_carts" | "all_carts" | "custom",
//     custom_emails?: ["a@b.com", ...],   // si segment=custom
//     bien_id?: "geko",                   // filtre optionnel sur le bien
//     template_name: "manual-relance",    // nom du fichier sans .html
//     subject: "...",
//     html: "...",                        // HTML déjà interpolé
//     promo_code?: "XXXX-YYYY",           // optionnel, loggué pour traçabilité
//   }
//   Réponse: { ok, total, sent, failed, skipped, errors }
//
// Auth : Bearer admin obligatoire (pas de secret query param — envoi groupé sensible).

import { verifyBearer } from "./_adminauth.js";
import { sendEmail } from "./_sendEmail.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

// Max destinataires par appel (sécurité anti-spam accidentel)
const MAX_RECIPIENTS = 50;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "POST uniquement" }, 405);

  const { ok: adminOk } = await verifyBearer(request, env);
  if (!adminOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  const body = await request.json().catch(() => ({}));
  const { segment = "hot_carts", custom_emails = [], bien_id, template_name, subject, html, promo_code, dry_run } = body;

  // dry_run=true : résout les destinataires sans envoyer (pour preview dans le modal)
  if (!dry_run) {
    if (!subject?.trim()) return json({ error: "subject requis" }, 400);
    if (!html?.trim())    return json({ error: "html requis" }, 400);
    if (!template_name)   return json({ error: "template_name requis" }, 400);
  }

  // ── Résolution du segment ─────────────────────────────────────────────────
  let recipients = []; // [{ email, prenom, bien_id }]

  if (segment === "custom") {
    if (!Array.isArray(custom_emails) || !custom_emails.length)
      return json({ error: "custom_emails requis pour segment=custom" }, 400);
    recipients = custom_emails
      .filter(e => typeof e === "string" && e.includes("@"))
      .map(e => ({ email: e.trim().toLowerCase(), prenom: "", bien_id: bien_id || null }));

  } else if (segment === "hot_carts" || segment === "all_carts") {
    // Paniers abandonnés non convertis (relance_sent < 2)
    // hot_carts = avec dates futures uniquement
    const today = new Date().toISOString().slice(0, 10);
    let sql = `SELECT DISTINCT email, prenom, bien_id FROM abandoned_carts
               WHERE email IS NOT NULL AND email != '' AND relance_sent < 2`;
    if (segment === "hot_carts") sql += ` AND (checkin IS NULL OR checkin > '${today}')`;
    if (bien_id) sql += ` AND bien_id = '${bien_id.replace(/'/g, "''")}'`;
    sql += ` ORDER BY created_at DESC LIMIT ${MAX_RECIPIENTS}`;

    const { results } = await db.prepare(sql).all();
    recipients = (results || []).map(r => ({
      email: r.email.trim().toLowerCase(),
      prenom: r.prenom || "",
      bien_id: r.bien_id || null,
    }));

  } else if (segment === "past_guests") {
    // Voyageurs ayant séjourné (direct_bookings, checkout < aujourd'hui)
    const today = new Date().toISOString().slice(0, 10);
    let sql = `SELECT DISTINCT email, prenom, bien_id FROM direct_bookings
               WHERE email IS NOT NULL AND email != '' AND checkout < '${today}'`;
    if (bien_id) sql += ` AND bien_id = '${bien_id.replace(/'/g, "''")}'`;
    sql += ` ORDER BY checkout DESC LIMIT ${MAX_RECIPIENTS}`;
    const { results } = await db.prepare(sql).all();
    recipients = (results || []).map(r => ({
      email: r.email.trim().toLowerCase(),
      prenom: r.prenom || "",
      bien_id: r.bien_id || null,
    }));

  } else if (segment === "repeaters") {
    // Voyageurs ayant séjourné 2+ fois (priorité fidélisation)
    const today = new Date().toISOString().slice(0, 10);
    let sql = `SELECT email, prenom, bien_id, COUNT(*) AS cnt FROM direct_bookings
               WHERE email IS NOT NULL AND email != '' AND checkout < '${today}'`;
    if (bien_id) sql += ` AND bien_id = '${bien_id.replace(/'/g, "''")}'`;
    sql += ` GROUP BY LOWER(TRIM(email)) HAVING cnt >= 2 ORDER BY cnt DESC LIMIT ${MAX_RECIPIENTS}`;
    const { results } = await db.prepare(sql).all();
    recipients = (results || []).map(r => ({
      email: r.email.trim().toLowerCase(),
      prenom: r.prenom || "",
      bien_id: r.bien_id || null,
    }));

  } else {
    return json({ error: `segment inconnu: ${segment}` }, 400);
  }

  // Dédoublonner par email
  const seen = new Set();
  recipients = recipients.filter(r => { if (seen.has(r.email)) return false; seen.add(r.email); return true; });

  if (!recipients.length) return json({ ok: true, total: 0, sent: 0, failed: 0, skipped: 0, recipients: [], message: "Aucun destinataire" });
  if (recipients.length > MAX_RECIPIENTS) return json({ error: `Trop de destinataires (max ${MAX_RECIPIENTS})` }, 400);

  // dry_run : retourne juste la liste des destinataires (pour preview)
  if (dry_run) {
    return json({ ok: true, dry_run: true, total: recipients.length, recipients: recipients.map(r => r.email) });
  }

  // ── Envoi séquentiel (pas de parallel — Resend rate limit 10/s) ───────────
  let sent = 0, failed = 0, skipped = 0;
  const errors = [];

  for (const rec of recipients) {
    try {
      const result = await sendEmail(env, {
        to: rec.email,
        subject,
        html,
        template: template_name,
        category: "client",
        bien_id: rec.bien_id || bien_id || null,
        booking_id: null,
        // Note dans le template loggué si promo
        ...(promo_code ? { template: `${template_name}|promo:${promo_code}` } : {}),
      });
      if (result.ok) { sent++; }
      else { failed++; errors.push({ email: rec.email, error: result.error || "échec Resend" }); }
    } catch (e) {
      failed++;
      errors.push({ email: rec.email, error: e.message });
    }
    // Délai léger pour respecter rate limit Resend (10 emails/s max)
    if (recipients.length > 5) await new Promise(r => setTimeout(r, 120));
  }

  return json({
    ok: true,
    total: recipients.length,
    sent,
    failed,
    skipped,
    errors: errors.slice(0, 10), // max 10 erreurs dans la réponse
  });
}
