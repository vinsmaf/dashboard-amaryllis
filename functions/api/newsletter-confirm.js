// GET /api/newsletter-confirm?token=XXX
// Double opt-in — confirme l'inscription et envoie l'email de bienvenue.
// Redirige vers villamaryllis.com?newsletter=confirmed (ou error/invalid/already).

import { sendEmail } from "./_sendEmail.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") || "").trim();
  const db = env.revenue_manager;
  const site = env.SITE_URL || "https://villamaryllis.com";

  if (!token || !db) return Response.redirect(`${site}?newsletter=error`, 302);

  const row = await db.prepare(`
    SELECT id, email, first_name, confirmed_at, unsubscribed_at, unsub_token
    FROM newsletter_subscribers WHERE confirm_token = ?
  `).bind(token).first().catch(() => null);

  if (!row) return Response.redirect(`${site}?newsletter=invalid`, 302);
  if (row.confirmed_at && !row.unsubscribed_at) {
    return Response.redirect(`${site}?newsletter=already`, 302);
  }

  await db.prepare(
    "UPDATE newsletter_subscribers SET confirmed_at=?, sequence_step=0, unsubscribed_at=NULL WHERE id=?"
  ).bind(Date.now(), row.id).run();

  // Welcome email J+0
  const prenom = row.first_name || "Voyageur";
  const unsubUrl = `${url.origin}/api/newsletter-unsubscribe?token=${row.unsub_token}`;
  try {
    const tplRes = await fetch(`${url.origin}/email-templates/newsletter-welcome?cb=${Date.now()}`, {
      cache: "no-store",
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    const raw = tplRes.ok ? await tplRes.text() : null;
    const html = raw
      ? raw.replace(/\{\{(\w+)\}\}/g, (_, k) => ({ prenom, unsub_url: unsubUrl })[k] ?? "")
      : `<p>Bienvenue ${prenom} ! Découvrez nos guides Martinique sur villamaryllis.com</p>`;

    await sendEmail(env, {
      to: row.email,
      subject: `Bienvenue chez Amaryllis Locations — vos guides Martinique`,
      html,
      template: "newsletter-welcome",
      category: "newsletter",
    });
  } catch (e) {
    console.error("[newsletter-confirm] welcome email error:", e?.message);
  }

  // Alerte ntfy premier abonné (ou chaque confirmation)
  try {
    const { results: all } = await db.prepare(
      "SELECT COUNT(*) as cnt FROM newsletter_subscribers WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL"
    ).all().catch(() => ({ results: [{ cnt: 0 }] }));
    const cnt = all?.[0]?.cnt ?? 0;
    const ntfyTopic = env.NTFY_TOPIC || "amaryllis-alertes-7r4k9";
    const isFirst = cnt === 1;
    const milestone = cnt % 10 === 0 && cnt > 0;
    if (isFirst || milestone) {
      await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=utf-8", Title: `Newsletter — ${cnt} abonné${cnt > 1 ? "s" : ""}` },
        body: isFirst
          ? `🎉 Premier abonné confirmé : ${row.email} (source: ${row.source || "?"}) — la base démarre !`
          : `📬 ${cnt} abonnés newsletter confirmés ! Dernier : ${row.email}`,
      }).catch(() => {});
    }
  } catch (e) {
    console.error("[newsletter-confirm] ntfy error:", e?.message);
  }

  return Response.redirect(`${site}?newsletter=confirmed`, 302);
}
