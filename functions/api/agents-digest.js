import { resendFrom } from "./_email.js";
// functions/api/agents-digest.js
// L4 — Digest hebdo de l'état des agents (drafts prêts, file à valider, bloquées, fait).
// Auth ?secret=POSTSTAY_SECRET. Best-effort email (Resend) + push (ntfy).
const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://villamaryllis.com" };
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 500);
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "secret invalide" }, 401);
  }

  const drafts   = await db.prepare("SELECT COUNT(*) n FROM agent_drafts WHERE status='drafted'").first().catch(() => ({ n: 0 }));
  const toReview = await db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE risk='review' AND status IN ('backlog','a-planifier')").first().catch(() => ({ n: 0 }));
  const blocked  = await db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE risk='blocked' AND status IN ('backlog','a-planifier')").first().catch(() => ({ n: 0 }));
  const doneWeek = await db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE status='fait' AND updated_at > unixepoch()-604800").first().catch(() => ({ n: 0 }));

  const d = drafts.n || 0, r = toReview.n || 0, b = blocked.n || 0, dw = doneWeek.n || 0;
  const text =
`📊 Digest agents Amaryllis — semaine

✅ ${d} brouillon(s) prêt(s) à publier (onglet Approbations)
📋 ${r} action(s) à valider (review)
🔒 ${b} bloquée(s) — décision manuelle (€/légal)
🏁 ${dw} action(s) terminée(s) cette semaine

→ Valider en 1 clic : https://villamaryllis.com/admin (Approbations)`;

  // ntfy (best-effort)
  if (env.NTFY_TOPIC) {
    try {
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST", body: text,
        headers: { "Title": "Digest agents Amaryllis", "Priority": "default" },
      });
    } catch (_) { /* best-effort */ }
  }
  // email (best-effort)
  if (env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: resendFrom(env),
          to: [env.NOTIFICATION_EMAIL || "vinsmaf@hotmail.com"],
          subject: "📊 Digest agents Amaryllis — semaine",
          text,
        }),
      });
    } catch (_) { /* best-effort */ }
  }
  return json({ ok: true, drafts: d, toReview: r, blocked: b, doneWeek: dw });
}
