// Cloudflare Pages Function — GET /api/charge-balance?secret=POSTSTAY_SECRET[&dry=1]
// Cron quotidien : débite off-session les soldes dus (paiement en 2 fois).
import { sendGuestEmail } from "./send-guest-email.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json" },
});

async function ensurePaymentScheduleTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS payment_schedule (
    deposit_pi_id TEXT PRIMARY KEY, bien_id TEXT, bien_nom TEXT, email TEXT, prenom TEXT,
    customer_id TEXT, payment_method_id TEXT, balance_amount INTEGER, currency TEXT DEFAULT 'eur',
    checkin TEXT, checkout TEXT, due_date TEXT, status TEXT DEFAULT 'pending',
    balance_pi_id TEXT, attempts INTEGER DEFAULT 0, last_error TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run();
}

async function notifyNtfy(env, title, msg) {
  if (!env.NTFY_TOPIC) return;
  try {
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, { method: "POST", headers: { Title: title }, body: msg });
  } catch { /* fail-silent */ }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (env.POSTSTAY_SECRET && url.searchParams.get("secret") !== env.POSTSTAY_SECRET)
    return json({ error: "Non autorisé" }, 401);
  const dry = url.searchParams.get("dry") === "1";
  const sk = env.STRIPE_SECRET_KEY;
  const db = env.revenue_manager;
  if (!sk || !db) return json({ error: "Config manquante" }, 500);

  await ensurePaymentScheduleTable(db);
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db.prepare(
    `SELECT * FROM payment_schedule WHERE status='pending' AND due_date <= ? ORDER BY due_date ASC LIMIT 50`
  ).bind(today).all();
  const due = rows?.results || [];
  if (dry) return json({ ok: true, dry: true, due: due.length, rows: due.map(r => ({ pi: r.deposit_pi_id, solde: r.balance_amount, due: r.due_date })) });

  const origin = url.origin;
  let charged = 0, failed = 0;
  for (const r of due) {
    try {
      const piRes = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          amount: String(Math.round(r.balance_amount * 100)),
          currency: r.currency || "eur",
          customer: r.customer_id,
          payment_method: r.payment_method_id,
          off_session: "true",
          confirm: "true",
          "metadata[kind]": "solde-2x",
          "metadata[deposit_pi_id]": r.deposit_pi_id,
          "metadata[bienId]": r.bien_id || "",
        }).toString(),
      });
      const pi = await piRes.json();
      if (pi.error || pi.status !== "succeeded") {
        failed++;
        await db.prepare(
          `UPDATE payment_schedule SET status=CASE WHEN attempts>=2 THEN 'failed' ELSE 'pending' END, attempts=attempts+1, last_error=? WHERE deposit_pi_id=?`
        ).bind(String(pi.error?.message || pi.status || "inconnu"), r.deposit_pi_id).run();
        if (r.email) await sendGuestEmail(env, origin, {
          template: "solde-echec", to: r.email,
          subject: "Action requise — solde de votre séjour",
          vars: { prenom: r.prenom, bienNom: r.bien_nom, checkin: r.checkin, checkout: r.checkout, montant: r.balance_amount },
        }).catch(() => {});
        await notifyNtfy(env, "⚠️ Solde 2x échoué", `${r.bien_nom} ${r.email} ${r.balance_amount}€ — ${pi.error?.message || pi.status}`);
        continue;
      }
      charged++;
      await db.prepare(
        `UPDATE payment_schedule SET status='paid', balance_pi_id=? WHERE deposit_pi_id=?`
      ).bind(pi.id, r.deposit_pi_id).run();
      if (r.email) await sendGuestEmail(env, origin, {
        template: "solde-debite", to: r.email,
        subject: "Solde de votre séjour réglé",
        vars: { prenom: r.prenom, bienNom: r.bien_nom, checkin: r.checkin, checkout: r.checkout, montant: r.balance_amount },
      }).catch(() => {});
    } catch (e) {
      failed++;
      await db.prepare(
        `UPDATE payment_schedule SET attempts=attempts+1, last_error=? WHERE deposit_pi_id=?`
      ).bind(String(e.message), r.deposit_pi_id).run();
    }
  }
  return json({ ok: true, due: due.length, charged, failed });
}
