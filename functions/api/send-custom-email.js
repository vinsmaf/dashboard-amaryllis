// functions/api/send-custom-email.js
// POST /api/send-custom-email
// Envoi manuel d'un email depuis le compositeur admin.
//
// Body: {
//   to: "client@example.com",       // requis
//   subject: "...",                  // requis (1-200 chars)
//   html: "<p>...</p>",              // requis (1-30000 chars)
//   text?: "...",                    // optionnel
//   bien_id?: "mabouya",
//   booking_id?: "pi_xxx",
//   template_name?: "manual-relance",
//   promo_code?: "CAMBIE-A8F2"
// }
//
// Réponse: { ok, email_id, resend_id }
//
// Auth : Bearer admin OU ?secret=<POSTSTAY_SECRET>
// Rate limit : 20/h/IP

import { verifyBearer } from "./_adminauth.js";
import { sendEmail } from "./_sendEmail.js";
import { sanitizeHtml } from "./_sanitizeHtml.js";
import { rateLimit } from "./_ratelimit.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

function isValidEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "POST requis" }, 405);

  try {
    // Auth
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
    const { ok: adminOk } = await verifyBearer(request, env);
    if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

    const db = env.revenue_manager;
    if (!db) return json({ error: "D1 indisponible" }, 503);

    // Rate limit 20/h/IP (fail-open si module rate manquant ou échec)
    try {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rl = await rateLimit(db, { key: `send-custom-email:${ip}`, limit: 20, windowSec: 3600 });
      if (!rl.ok) return json({ error: "Rate limit dépassé (20/h)" }, 429);
    } catch (e) {
      console.warn("[send-custom-email] rate limit check failed (fail-open):", e?.message);
    }

    // Parse + validation
    const body = await request.json().catch(() => ({}));
    const to = String(body.to || "").trim();
    const subject = String(body.subject || "").trim();
    const html = String(body.html || "");
    const text = body.text ? String(body.text) : null;
    const bienId = body.bien_id || null;
    const bookingId = body.booking_id || null;
    const templateName = body.template_name || "manual_custom";
    const promoCode = body.promo_code || null;

    if (!isValidEmail(to)) return json({ error: "to invalide (email)" }, 400);
    if (!subject || subject.length > 200) return json({ error: "subject vide ou > 200 chars" }, 400);
    if (!html || html.length > 30000) return json({ error: "html vide ou > 30000 chars" }, 400);

    // Sanitize HTML
    const safeHtml = sanitizeHtml(html);

    // Suffixe promo dans le template name pour traçage
    const finalTemplate = promoCode ? `${templateName}|promo:${promoCode}` : templateName;

    // Envoi via helper (log auto D1)
    const result = await sendEmail(env, {
      to,
      subject,
      html: safeHtml,
      text,
      reply_to: "contact@villamaryllis.com",
      template: finalTemplate,
      category: "client",
      bien_id: bienId,
      booking_id: bookingId,
    });

    if (!result.ok) {
      return json({ error: "Envoi Resend échoué", details: result.error }, 502);
    }

    return json({ ok: true, email_id: result.id, resend_id: result.resendId });
  } catch (e) {
    return json({ error: e.message, stack: (e.stack || "").slice(0, 300) }, 500);
  }
}
