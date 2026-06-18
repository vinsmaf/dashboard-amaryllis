// Cloudflare Pages Function — GET /api/caution-cron?secret=POSTSTAY_SECRET[&dry=1]
//
// Cron quotidien : réconcilie les cautions (dépôts de garantie) en pré-autorisation off-session.
// Un blocage Stripe ne dure ~7 j → on POSE la caution ~2 j avant l'arrivée, on la RE-POSE avant
// chaque expiration (couvre les séjours de toute durée), puis on LIBÈRE 3 j après le départ.
// Tout est off-session sur la carte enregistrée à la réservation → zéro action voyageur.
//
// Mécanique 100 % calquée sur charge-balance.js (prouvé en prod pour le solde 2×), avec
// capture_method=manual au lieu d'un débit. Idempotent : l'action est décidée par decideCautionAction
// sur l'état stocké, qui est mis à jour après chaque opération → relançable sans risque.
import { decideCautionAction } from "../../src/utils/caution.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json" },
});

async function ensureCautionTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS caution_schedule (
    booking_pi_id TEXT PRIMARY KEY, bien_id TEXT, bien_nom TEXT, email TEXT, prenom TEXT,
    customer_id TEXT, payment_method_id TEXT, amount INTEGER, currency TEXT DEFAULT 'eur',
    checkin TEXT, checkout TEXT, place_date TEXT,
    status TEXT DEFAULT 'pending', caution_pi_id TEXT, capture_before TEXT,
    attempts INTEGER DEFAULT 0, last_error TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run();
}

async function notifyNtfy(env, title, msg, priority = "default") {
  if (!env.NTFY_TOPIC) return;
  try {
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, { method: "POST", headers: { Title: title, Priority: priority }, body: msg });
  } catch { /* fail-silent */ }
}

// Crée une pré-autorisation (hold) off-session sur la carte enregistrée. Renvoie {pi, captureBefore} ou {error}.
// expand=latest_charge pour lire capture_before (date d'expiration réelle du hold) en une requête.
async function createHold(sk, r) {
  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      amount: String(Math.round(r.amount * 100)),
      currency: r.currency || "eur",
      customer: r.customer_id,
      payment_method: r.payment_method_id,
      capture_method: "manual",
      off_session: "true",
      confirm: "true",
      "payment_method_options[card][request_extended_authorization]": "if_available",
      "metadata[type]": "deposit",
      "metadata[kind]": "caution-auto",
      "metadata[booking_pi_id]": r.booking_pi_id,
      "metadata[bienId]": r.bien_id || "",
      "metadata[voyageur]": r.prenom || "",
      "metadata[checkin]": r.checkin || "",
      "metadata[checkout]": r.checkout || "",
      "metadata[email]": r.email || "",
      "expand[0]": "latest_charge",
    }).toString(),
  });
  const pi = await res.json();
  if (pi.error) return { error: pi.error.message };
  if (pi.status !== "requires_capture") return { error: `statut inattendu: ${pi.status}` };
  const cb = pi.latest_charge?.payment_method_details?.card?.capture_before;
  const captureBefore = cb ? new Date(cb * 1000).toISOString().slice(0, 10) : null;
  return { pi, captureBefore };
}

// Annule un hold (libère les fonds). Best-effort — un hold déjà expiré renvoie une erreur sans gravité.
async function cancelHold(sk, piId) {
  if (!piId) return;
  try {
    await fetch(`https://api.stripe.com/v1/payment_intents/${piId}/cancel`, {
      method: "POST", headers: { Authorization: `Bearer ${sk}` },
    });
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

  await ensureCautionTable(db);
  const today = new Date().toISOString().slice(0, 10);
  const rows = (await db.prepare(
    `SELECT * FROM caution_schedule WHERE status IN ('pending','held') ORDER BY place_date ASC LIMIT 100`
  ).all())?.results || [];

  const plan = rows.map(r => ({
    booking_pi_id: r.booking_pi_id, bien: r.bien_id, voyageur: r.prenom,
    action: decideCautionAction({
      status: r.status, placeDate: r.place_date, captureBefore: r.capture_before,
      checkout: r.checkout, today,
    }),
  }));

  if (dry) return json({ ok: true, dry: true, today, total: rows.length, plan: plan.filter(p => p.action !== "noop") });

  let placed = 0, reauthed = 0, released = 0, failed = 0;
  for (const r of rows) {
    const action = decideCautionAction({
      status: r.status, placeDate: r.place_date, captureBefore: r.capture_before,
      checkout: r.checkout, today,
    });
    if (action === "noop") continue;

    try {
      if (action === "release") {
        await cancelHold(sk, r.caution_pi_id);
        await db.prepare(`UPDATE caution_schedule SET status='released' WHERE booking_pi_id=?`).bind(r.booking_pi_id).run();
        released++;
        continue;
      }

      // place ou reauth : on crée un nouveau hold sur la carte enregistrée.
      const { pi, captureBefore, error } = await createHold(sk, r);
      if (error) {
        failed++;
        // place : échec → on retente (attempts), puis on escalade à l'hôte. L'ancien hold (reauth)
        // reste actif jusqu'à sa propre expiration → fenêtre de grâce, jamais de trou immédiat.
        const giveUp = (r.attempts || 0) >= 2;
        await db.prepare(
          `UPDATE caution_schedule SET status=CASE WHEN ? AND status='pending' THEN 'failed' ELSE status END,
             attempts=attempts+1, last_error=? WHERE booking_pi_id=?`
        ).bind(giveUp ? 1 : 0, String(error).slice(0, 300), r.booking_pi_id).run();
        await notifyNtfy(env, "⚠️ Caution auto échouée",
          `${r.bien_nom || r.bien_id} · ${r.prenom || ""} · ${r.amount}€ · ${action} · ${error}\n→ envoyer le lien caution manuel (onglet Cautions)`,
          giveUp ? "high" : "default");
        continue;
      }

      // Succès : on enregistre IMMÉDIATEMENT le nouveau hold (avant d'annuler l'ancien) →
      // fenêtre d'incohérence minimale en cas de crash.
      const oldPi = r.caution_pi_id;
      await db.prepare(
        `UPDATE caution_schedule SET status='held', caution_pi_id=?, capture_before=?, attempts=0, last_error=NULL WHERE booking_pi_id=?`
      ).bind(pi.id, captureBefore, r.booking_pi_id).run();

      if (action === "reauth" && oldPi && oldPi !== pi.id) {
        await cancelHold(sk, oldPi); // libère l'ancien → le voyageur ne voit qu'un seul blocage
        reauthed++;
      } else {
        placed++;
      }
    } catch (e) {
      failed++;
      await db.prepare(`UPDATE caution_schedule SET attempts=attempts+1, last_error=? WHERE booking_pi_id=?`)
        .bind(String(e.message).slice(0, 300), r.booking_pi_id).run();
    }
  }

  return json({ ok: true, today, total: rows.length, placed, reauthed, released, failed });
}
