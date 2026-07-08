// TEMPORAIRE — À SUPPRIMER APRÈS USAGE.
// GET /api/debug-caution-retry?secret=POSTSTAY_SECRET&pi=<booking_pi_id>
// Repose un hold pour UN booking_pi_id ciblé avec une clé d'idempotence NEUVE
// (contourne une clé d'idempotence "collée" à un ancien payload cassé, cf.
// fix _caution.js du 2026-07-08 — retrait de request_extended_authorization).
import { createHold } from "./_caution.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) return json({ error: "Non autorisé" }, 401);
  const piId = url.searchParams.get("pi");
  if (!piId) return json({ error: "pi requis" }, 400);
  const db = env.revenue_manager;
  const row = await db.prepare("SELECT * FROM caution_schedule WHERE booking_pi_id=?").bind(piId).first();
  if (!row) return json({ error: "introuvable" }, 404);

  const idemKey = `caution-place-fix-${piId}-${Date.now()}`;
  const { pi, captureBefore, error } = await createHold(env.STRIPE_SECRET_KEY, row, idemKey);
  if (error) return json({ ok: false, error });

  await db.prepare(
    `UPDATE caution_schedule SET status='held', caution_pi_id=?, capture_before=?, attempts=0, last_error=NULL WHERE booking_pi_id=?`
  ).bind(pi.id, captureBefore, piId).run();

  return json({ ok: true, caution_pi_id: pi.id, captureBefore });
}
