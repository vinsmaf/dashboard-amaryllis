// POST /api/newsletter-subscribe
// Lead magnet newsletter — capture email + prénom + source (guide_id / property_id)
// Double opt-in RGPD. Rate-limité 3 req/IP/h.
// Table D1 `newsletter_subscribers` auto-créée au premier appel.

import { sendEmail } from "./_sendEmail.js";
import { rateLimit } from "./_ratelimit.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

function genToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(20)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function genUlid() {
  const time = Date.now().toString(36).padStart(10, "0");
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(36).padStart(2, "0").slice(-2)).join("");
  return (time + rand).slice(0, 26);
}

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id             TEXT PRIMARY KEY,
      email          TEXT NOT NULL,
      email_lower    TEXT NOT NULL UNIQUE,
      first_name     TEXT,
      source         TEXT,
      confirm_token  TEXT UNIQUE,
      unsub_token    TEXT UNIQUE,
      confirmed_at   INTEGER,
      unsubscribed_at INTEGER,
      sequence_step  INTEGER DEFAULT 0,
      sequence_sent_at INTEGER,
      tags           TEXT DEFAULT '[]',
      created_at     INTEGER NOT NULL
    )
  `).run();
}

async function sendConfirmation(env, origin, { email, firstName, confirmToken }) {
  const confirmUrl = `${origin}/api/newsletter-confirm?token=${confirmToken}`;
  const prenom = firstName || "Voyageur";

  try {
    const tplRes = await fetch(`${origin}/email-templates/newsletter-confirm?cb=${Date.now()}`, {
      cache: "no-store",
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    const raw = tplRes.ok ? await tplRes.text() : null;
    const html = raw
      ? raw.replace(/\{\{(\w+)\}\}/g, (_, k) => ({ prenom, confirm_url: confirmUrl })[k] ?? "")
      : `<p>Bonjour ${prenom},</p><p><a href="${confirmUrl}">Confirmer mon inscription</a></p>`;

    await sendEmail(env, {
      to: email,
      subject: "Confirmez votre inscription — Amaryllis Locations",
      html,
      template: "newsletter-confirm",
      category: "newsletter",
    });
  } catch (e) {
    console.error("[newsletter-subscribe] sendConfirmation error:", e?.message);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 503);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rl = await rateLimit(db, { key: `newsletter:${ip}`, limit: 3, windowSec: 3600 });
  if (!rl.ok) return json({ error: "Trop de demandes, réessayez dans 1h" }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const email = (body.email || "").trim().toLowerCase();
  const firstName = (body.first_name || "").trim().slice(0, 80);
  const source = (body.source || "").trim().slice(0, 100);

  if (!email || !email.includes("@") || email.length > 200) {
    return json({ error: "Email invalide" }, 400);
  }

  await ensureTable(db);

  const existing = await db.prepare(
    "SELECT id, confirmed_at, unsubscribed_at, confirm_token FROM newsletter_subscribers WHERE email_lower = ?"
  ).bind(email).first();

  if (existing) {
    if (existing.confirmed_at && !existing.unsubscribed_at) {
      // Déjà actif — silencieux (évite l'énumération d'emails)
      return json({ ok: true, status: "pending_confirmation" });
    }
    if (!existing.confirmed_at) {
      // Renvoi du lien de confirmation
      await sendConfirmation(env, url.origin, { email, firstName, confirmToken: existing.confirm_token });
      return json({ ok: true, status: "pending_confirmation" });
    }
    if (existing.unsubscribed_at) {
      // Réabonnement
      const confirmToken = genToken();
      const unsubToken = genToken();
      await db.prepare(`
        UPDATE newsletter_subscribers
        SET first_name=?, source=?, confirm_token=?, unsub_token=?,
            confirmed_at=NULL, unsubscribed_at=NULL, sequence_step=0, sequence_sent_at=NULL
        WHERE email_lower=?
      `).bind(firstName || null, source || null, confirmToken, unsubToken, email).run();
      await sendConfirmation(env, url.origin, { email, firstName, confirmToken });
      return json({ ok: true, status: "pending_confirmation" });
    }
  }

  const id = genUlid();
  const confirmToken = genToken();
  const unsubToken = genToken();
  await db.prepare(`
    INSERT INTO newsletter_subscribers (id, email, email_lower, first_name, source, confirm_token, unsub_token, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, email, email, firstName || null, source || null, confirmToken, unsubToken, Date.now()).run();

  await sendConfirmation(env, url.origin, { email, firstName, confirmToken });
  return json({ ok: true, status: "pending_confirmation" });
}

export function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
