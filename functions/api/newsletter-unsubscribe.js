// GET /api/newsletter-unsubscribe?token=XXX
// Désabonnement one-click — marque unsubscribed_at, redirige vers page de confirmation.

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") || "").trim();
  const db = env.revenue_manager;
  const site = env.SITE_URL || "https://villamaryllis.com";

  if (!token || !db) return Response.redirect(`${site}?newsletter=error`, 302);

  const row = await db.prepare(
    "SELECT id FROM newsletter_subscribers WHERE unsub_token = ?"
  ).bind(token).first().catch(() => null);

  if (!row) return Response.redirect(`${site}?newsletter=invalid`, 302);

  await db.prepare(
    "UPDATE newsletter_subscribers SET unsubscribed_at=? WHERE id=?"
  ).bind(Date.now(), row.id).run();

  return Response.redirect(`${site}?newsletter=unsubscribed`, 302);
}
