// functions/api/_sendEmail.js
// Helper centralisé : envoi email via Resend + log automatique en D1 (emails_log).
//
// Tous les nouveaux envois doivent passer par cette fonction (au lieu de fetch direct).
// Backward-compat : les 11 endpoints non encore refactorés continuent à fonctionner.
//
// Comportement :
//   1. Envoi via Resend
//   2. INSERT en D1 emails_log (best-effort — n'échoue jamais l'appel principal)
//   3. Retourne { ok, id, resendId, error }

import { resendFrom } from "./_email.js";

// ULID-lite : 26 chars triables temporellement (10 chars time + 16 chars random)
function generateUlid() {
  const time = Date.now().toString(36).padStart(10, "0");
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(36).padStart(2, "0").slice(-2))
    .join("");
  return (time + rand).slice(0, 26);
}

export async function sendEmail(env, {
  to,
  subject,
  html,
  text,
  from,
  reply_to,
  template,
  category = "client",
  bien_id,
  booking_id,
}) {
  const fromAddr = from || resendFrom(env);
  const toArr = Array.isArray(to) ? to : [to];
  const toStr = toArr.join(",");
  const id = generateUlid();
  const now = Date.now();

  // 1. Envoi via Resend
  let resendId = null, error = null, status = "sent";
  if (!env.RESEND_API_KEY) {
    status = "failed";
    error = "RESEND_API_KEY manquante";
  } else {
    try {
      const body = { from: fromAddr, to: toArr, subject, html };
      if (text) body.text = text;
      if (reply_to) body.reply_to = reply_to;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        status = "failed";
        error = data.message || data.error || `HTTP ${r.status}`;
      } else {
        resendId = data.id || null;
      }
    } catch (e) {
      status = "failed";
      error = e?.message || String(e);
    }
  }

  // 2. Log en D1 (best-effort)
  try {
    const db = env.revenue_manager;
    if (db) {
      await db.prepare(
        `INSERT INTO emails_log
          (id, resend_id, to_email, from_email, subject, template, category, bien_id, booking_id, html, text, status, error, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        resendId,
        toStr,
        fromAddr,
        subject,
        template || null,
        category,
        bien_id || null,
        booking_id || null,
        html || null,
        text || null,
        status,
        error,
        now
      ).run();
    }
  } catch (e) {
    console.error("[_sendEmail] emails_log insert failed:", e?.message || e);
  }

  return { ok: status === "sent", id, resendId, error };
}
