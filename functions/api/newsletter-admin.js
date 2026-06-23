// GET/POST /api/newsletter-admin
// Admin newsletter : liste abonnés + stats + broadcast.
// Auth : header X-Admin-Auth ou ?secret=POSTSTAY_SECRET

import { sendEmail } from "./_sendEmail.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

function auth(request, env) {
  const url = new URL(request.url);
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) return false;
  const h = request.headers.get("X-Admin-Auth") || url.searchParams.get("secret") || "";
  return h === secret;
}

function fillTemplate(html, vars = {}) {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!auth(request, env)) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 503);

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;
  const search = (url.searchParams.get("search") || "").trim();
  const filter = url.searchParams.get("filter") || "all"; // all | confirmed | pending | unsubscribed

  // Stats
  const stats = await db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN confirmed_at IS NOT NULL AND unsubscribed_at IS NULL THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN confirmed_at IS NULL THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 ELSE 0 END) AS unsubscribed,
      SUM(CASE WHEN sequence_step >= 1 THEN 1 ELSE 0 END) AS had_offer
    FROM newsletter_subscribers
  `).first().catch(() => ({ total: 0, confirmed: 0, pending: 0, unsubscribed: 0, had_offer: 0 }));

  // Requête liste
  let where = "1=1";
  const binds = [];
  if (search) {
    where += " AND (email_lower LIKE ? OR first_name LIKE ?)";
    binds.push(`%${search.toLowerCase()}%`, `%${search}%`);
  }
  if (filter === "confirmed") {
    where += " AND confirmed_at IS NOT NULL AND unsubscribed_at IS NULL";
  } else if (filter === "pending") {
    where += " AND confirmed_at IS NULL";
  } else if (filter === "unsubscribed") {
    where += " AND unsubscribed_at IS NOT NULL";
  }

  const countRow = await db.prepare(`SELECT COUNT(*) as cnt FROM newsletter_subscribers WHERE ${where}`)
    .bind(...binds).first().catch(() => ({ cnt: 0 }));
  const total_filtered = countRow?.cnt ?? 0;

  const { results: rows } = await db.prepare(`
    SELECT id, email, first_name, source, confirmed_at, unsubscribed_at, sequence_step, created_at
    FROM newsletter_subscribers
    WHERE ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...binds, limit, offset).all().catch(() => ({ results: [] }));

  return json({
    stats,
    subscribers: rows,
    pagination: { page, limit, total: total_filtered, pages: Math.ceil(total_filtered / limit) },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!auth(request, env)) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const action = body.action;
  const url = new URL(request.url);

  // ── Broadcast ───────────────────────────────────────────────────────────────
  if (action === "broadcast") {
    const { template, subject } = body;
    if (!template || !subject) return json({ error: "template + subject requis" }, 400);

    const ALLOWED_TPL = ["newsletter-hiver", "newsletter-welcome", "newsletter-offer", "newsletter-confirm"];
    if (!ALLOWED_TPL.includes(template)) return json({ error: "template non autorisé" }, 400);

    // Récupérer les abonnés confirmés actifs
    const { results: subs } = await db.prepare(`
      SELECT id, email, first_name, unsub_token
      FROM newsletter_subscribers
      WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL
    `).all().catch(() => ({ results: [] }));

    if (!subs.length) return json({ ok: true, sent: 0, total: 0 });

    // Charger le template HTML une seule fois
    const tplRes = await fetch(`${url.origin}/email-templates/${template}?cb=${Date.now()}`, {
      cache: "no-store", cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (!tplRes.ok) return json({ error: `template introuvable (${tplRes.status})` }, 400);
    const tplRaw = await tplRes.text();

    let sent = 0, failed = 0;
    for (const sub of subs) {
      try {
        const unsubUrl = `${url.origin}/api/newsletter-unsubscribe?token=${sub.unsub_token}`;
        const prenom = sub.first_name || "Voyageur";
        const html = fillTemplate(tplRaw, { prenom, unsub_url: unsubUrl, confirm_url: "#" });
        const r = await sendEmail(env, {
          to: sub.email,
          subject,
          html,
          template,
          category: "newsletter",
        });
        if (r.ok) sent++; else failed++;
      } catch { failed++; }
    }
    return json({ ok: true, sent, failed, total: subs.length });
  }

  // ── Supprimer abonné ────────────────────────────────────────────────────────
  if (action === "delete") {
    const { id } = body;
    if (!id) return json({ error: "id requis" }, 400);
    await db.prepare("DELETE FROM newsletter_subscribers WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  // ── Renvoyer email de confirmation ──────────────────────────────────────────
  if (action === "resend_confirm") {
    const { id } = body;
    if (!id) return json({ error: "id requis" }, 400);
    const row = await db.prepare(
      "SELECT email, first_name, confirm_token FROM newsletter_subscribers WHERE id = ?"
    ).bind(id).first();
    if (!row) return json({ error: "Abonné introuvable" }, 404);

    const confirmUrl = `${url.origin}/api/newsletter-confirm?token=${row.confirm_token}`;
    const prenom = row.first_name || "Voyageur";
    const tplRes = await fetch(`${url.origin}/email-templates/newsletter-confirm?cb=${Date.now()}`, {
      cache: "no-store", cf: { cacheTtl: 0, cacheEverything: false },
    });
    const raw = tplRes.ok ? await tplRes.text() : null;
    const html = raw
      ? fillTemplate(raw, { prenom, confirm_url: confirmUrl })
      : `<p>Bonjour ${prenom},</p><p><a href="${confirmUrl}">Confirmer mon inscription</a></p>`;

    const r = await sendEmail(env, {
      to: row.email, subject: "Confirmez votre inscription — Amaryllis Locations",
      html, template: "newsletter-confirm", category: "newsletter",
    });
    return json({ ok: r.ok, error: r.error });
  }

  return json({ error: "action inconnue" }, 400);
}

export function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Auth",
    },
  });
}
