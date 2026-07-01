// GET /api/gmail-sync?secret=POSTSTAY_SECRET   → cron (Worker, boucle 10 min)
// GET /api/gmail-sync                          → Bearer admin (bouton "Sync maintenant")
//
// Poll la boîte Gmail connectée (contact@villamaryllis.com, via OAuth — voir
// _googleOAuth.js) pour les nouveaux messages entrants et les insère dans emails_log
// (direction='in'), dédupliqués par gmail_msg_id. Tente de rattacher chaque message
// à une résa directe via l'email (même logique que emails-import-resend.js).
//
// Ne fait AUCUNE modification côté Gmail (scope gmail.readonly) — l'app Mail de
// Vincent sur son Mac continue de fonctionner normalement en parallèle.

import { verifyBearer } from "./_adminauth.js";
import { getValidAccessToken, getOAuthRow } from "./_googleOAuth.js";

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

// Adresses à ignorer même si elles atterrissent dans la boîte (nos propres envois,
// notifications système, etc.) — évite de "recevoir" nos propres messages sortants.
const IGNORE_FROM_SUBSTRINGS = ["@villamaryllis.com", "mailer-daemon", "postmaster"];

export function decodeBase64Url(data) {
  if (!data) return "";
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  } catch { return ""; }
}

/** Extrait subject/from/date + corps text/html depuis un message Gmail (format=full). */
export function parseGmailMessage(msg) {
  const headers = msg.payload?.headers || [];
  const h = (name) => headers.find((x) => x.name.toLowerCase() === name.toLowerCase())?.value || "";
  const fromRaw = h("From"); // ex: "Jean Dupont <jean@example.com>"
  const emailMatch = fromRaw.match(/<([^>]+)>/);
  const fromEmail = (emailMatch ? emailMatch[1] : fromRaw).toLowerCase().trim();
  const fromName = fromRaw.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || fromEmail;

  let html = "", text = "";
  const walk = (part) => {
    if (!part) return;
    if (part.mimeType === "text/html" && part.body?.data) html = decodeBase64Url(part.body.data);
    if (part.mimeType === "text/plain" && part.body?.data) text = decodeBase64Url(part.body.data);
    if (part.parts) part.parts.forEach(walk);
  };
  walk(msg.payload);
  if (!html && !text && msg.payload?.body?.data) text = decodeBase64Url(msg.payload.body.data);

  return {
    fromEmail,
    fromName,
    subject: h("Subject") || "(sans objet)",
    dateMs: Number(msg.internalDate) || Date.now(),
    html,
    text: text || msg.snippet || "",
    snippet: msg.snippet || "",
  };
}

async function gmailFetch(accessToken, path) {
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`Gmail API ${r.status} sur ${path}`);
  return r.json();
}

async function notifyNewReply(env, { fromName, fromEmail, subject }) {
  if (!env.NTFY_TOPIC) return;
  try {
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      headers: { Title: "📧 Réponse voyageur", Priority: "default" },
      body: `${fromName} (${fromEmail})\n${subject}`,
    });
  } catch { /* best-effort */ }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  let accessToken;
  try {
    accessToken = await getValidAccessToken(env, db, "gmail");
  } catch (e) {
    return json({ ok: false, connected: false, error: e.message }, 200);
  }

  // Mode statut léger (affiché dans MessagerieTab) : confirme juste que le token
  // est valide, sans lister/importer de messages.
  if (url.searchParams.get("status") === "1") {
    const row = await getOAuthRow(db, "gmail");
    return json({ ok: true, connected: true, accountEmail: row?.account_email || null, updatedAt: row?.updated_at || null });
  }

  try {
    // Fenêtre large (dédup gérée en D1) — évite de rater un message si un run cron a échoué.
    const list = await gmailFetch(accessToken, "/messages?q=" + encodeURIComponent("in:inbox newer_than:3d") + "&maxResults=30");
    const ids = (list.messages || []).map((m) => m.id);

    let checked = 0, imported = 0, skipped = 0, ignored = 0;

    // 1. Filtre ceux déjà connus (évite un fetch complet inutile)
    const known = new Set();
    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      const { results } = await db.prepare(
        `SELECT gmail_msg_id FROM emails_log WHERE gmail_msg_id IN (${placeholders})`
      ).bind(...ids).all();
      for (const r of results || []) known.add(r.gmail_msg_id);
    }

    // 2. Bookings pour matching email → bien/résa
    const { results: bookings } = await db.prepare(
      "SELECT email, payment_intent_id, bien_id FROM direct_bookings WHERE email IS NOT NULL AND email != ''"
    ).all();
    const bookingByEmail = {};
    for (const b of bookings || []) {
      const e = String(b.email).toLowerCase().trim();
      if (e && !bookingByEmail[e]) bookingByEmail[e] = b;
    }

    for (const id of ids) {
      checked++;
      if (known.has(id)) { skipped++; continue; }

      const full = await gmailFetch(accessToken, `/messages/${id}?format=full`);
      const parsed = parseGmailMessage(full);

      if (IGNORE_FROM_SUBSTRINGS.some((s) => parsed.fromEmail.includes(s))) { ignored++; continue; }

      const match = bookingByEmail[parsed.fromEmail] || null;

      await db.prepare(
        `INSERT OR IGNORE INTO emails_log
           (id, resend_id, to_email, from_email, subject, template, category, bien_id, booking_id,
            html, text, status, error, sent_at, direction, gmail_msg_id, gmail_thread_id)
         VALUES (?, NULL, ?, ?, ?, NULL, 'client', ?, ?, ?, ?, 'received', NULL, ?, 'in', ?, ?)`
      ).bind(
        `gmail-${id}`,
        "contact@villamaryllis.com",
        parsed.fromEmail,
        parsed.subject,
        match?.bien_id || null,
        match?.payment_intent_id || null,
        parsed.html || null,
        parsed.text || null,
        parsed.dateMs,
        id,
        full.threadId || null
      ).run();

      imported++;
      await notifyNewReply(env, parsed);
    }

    return json({ ok: true, connected: true, checked, imported, skipped, ignored });
  } catch (e) {
    return json({ ok: false, error: e.message, stack: e.stack }, 500);
  }
}
