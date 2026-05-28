// Cloudflare Pages Function — POST /api/notify-booking
// Alerte fiable de NOUVELLE RÉSERVATION DIRECTE, déclenchée côté client juste
// après un paiement Stripe réussi (indépendant de la config webhook Stripe).
//
// Body : { paymentIntentId, bienNom, voyageur, total, checkin, checkout, depot }
// 1. Vérifie le PaymentIntent auprès de Stripe (status=succeeded) — anti-spam
// 2. Email à l'hôte (Resend) + push mobile (ntfy)
// 3. Enregistre la résa en D1 (table direct_bookings) pour le dashboard

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const DDL = `CREATE TABLE IF NOT EXISTS direct_bookings (
  payment_intent_id TEXT PRIMARY KEY,
  bien_nom   TEXT,
  voyageur   TEXT,
  total      INTEGER,
  depot      INTEGER,
  checkin    TEXT,
  checkout   TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);`;

const fmtDate = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || "?";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

async function sendEmail(env, subject, html, text) {
  if (!env.RESEND_API_KEY) return false;
  // Destinataires : NOTIFICATION_EMAIL (liste séparée par virgules) si défini,
  // sinon les 2 adresses de Vincent par défaut.
  // NOTE : tant que le domaine n'est pas vérifié dans Resend, l'envoi via
  // onboarding@resend.dev n'atteint QUE l'email du compte Resend (vinsmaf@hotmail.com).
  // Pour ajouter contact@villamaryllis.com + un expéditeur brandé : vérifier le
  // domaine sur resend.com/domains, puis définir RESEND_FROM + NOTIFICATION_EMAIL.
  const to = env.NOTIFICATION_EMAIL
    ? env.NOTIFICATION_EMAIL.split(",").map(s => s.trim()).filter(Boolean)
    : ["vinsmaf@hotmail.com"];
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM || "Amaryllis <onboarding@resend.dev>",
        to, subject, html, text,
      }),
    });
    return r.ok;
  } catch { return false; }
}

async function sendNtfy(env, title, body) {
  const topic = env.NTFY_TOPIC;
  if (!topic) return false;
  try {
    const r = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: { "Title": title, "Priority": "high", "Tags": "tada,money_with_wings" },
      body,
    });
    return r.ok;
  } catch { return false; }
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "POST requis" }, 405);

  // Mode test : POST ?test=1 → envoie une alerte de démonstration (sans Stripe, sans D1)
  const url0 = new URL(request.url);
  if (url0.searchParams.get("test") === "1") {
    const emailSent = await sendEmail(env, "🧪 Test alerte réservation — Amaryllis",
      "<div style='font-family:Georgia,serif'><h2 style='color:#0e3b3a'>🧪 Test d'alerte</h2><p>Si vous lisez ceci, les notifications email de nouvelle réservation fonctionnent ✅</p></div>",
      "Test alerte réservation Amaryllis — si vous lisez ceci, l'email fonctionne.");
    const ntfySent = await sendNtfy(env, "🧪 Test alerte résa Amaryllis", "Test push — si vous voyez ça, ntfy fonctionne ✅");
    return json({ test: true, emailSent, ntfySent });
  }

  const body = await request.json().catch(() => ({}));
  const { paymentIntentId, bienNom = "?", voyageur = "", total = 0, checkin = "", checkout = "", depot = 0 } = body;

  // ── 1. Vérification anti-spam : le paiement existe-t-il vraiment et est-il réussi ? ──
  const sk = env.STRIPE_SECRET_KEY;
  if (!paymentIntentId || !sk) return json({ error: "paymentIntentId requis" }, 400);
  try {
    const r = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`, {
      headers: { Authorization: `Bearer ${sk}` },
    });
    const pi = await r.json();
    if (!r.ok || pi.status !== "succeeded") {
      return json({ error: "Paiement non confirmé", status: pi.status || "unknown" }, 402);
    }
  } catch (e) {
    return json({ error: "Vérification Stripe échouée: " + e.message }, 502);
  }

  // ── 2. Idempotence : ne pas notifier 2× le même paiement ──
  const db = env.revenue_manager;
  if (db) {
    try {
      await db.prepare(DDL).run();
      const exists = await db.prepare("SELECT 1 FROM direct_bookings WHERE payment_intent_id = ?").bind(paymentIntentId).first();
      if (exists) return json({ ok: true, already: true });
      await db.prepare(
        "INSERT INTO direct_bookings (payment_intent_id, bien_nom, voyageur, total, depot, checkin, checkout) VALUES (?,?,?,?,?,?,?)"
      ).bind(paymentIntentId, bienNom, voyageur, Math.round(total), Math.round(depot), checkin, checkout).run();
    } catch { /* non bloquant */ }
  }

  // ── 3. Notifications ──
  const titre = `🎉 NOUVELLE RÉSA — ${bienNom}`;
  const ligne = `${voyageur || "Voyageur"} · ${fmtDate(checkin)} → ${fmtDate(checkout)} · ${total} €${depot ? ` (caution ${depot}€)` : ""}`;
  const html = `<div style="font-family:Georgia,serif;color:#2b2b2b;line-height:1.7">
    <h2 style="color:#0e3b3a">🎉 Nouvelle réservation directe</h2>
    <p style="font-size:16px"><strong>${bienNom}</strong></p>
    <table style="font-size:15px;border-collapse:collapse">
      <tr><td style="padding:3px 16px 3px 0">Voyageur</td><td><strong>${voyageur || "—"}</strong></td></tr>
      <tr><td style="padding:3px 16px 3px 0">Dates</td><td>${fmtDate(checkin)} → ${fmtDate(checkout)}</td></tr>
      <tr><td style="padding:3px 16px 3px 0">Montant payé</td><td><strong>${total} €</strong></td></tr>
      ${depot ? `<tr><td style="padding:3px 16px 3px 0">Caution</td><td>${depot} € (pré-autorisée)</td></tr>` : ""}
    </table>
    <p style="background:rgba(245,158,11,0.12);border-radius:8px;padding:10px 14px;font-size:14px;color:#92400e;margin-top:16px">
      🚨 Pense à <strong>bloquer ces dates sur Airbnb + Booking</strong> (pas de sync auto pour les villas Martinique).</p>
  </div>`;

  const emailSent = await sendEmail(env, titre, html, ligne);
  const ntfySent  = await sendNtfy(env, titre, ligne + "\n\n🚨 Bloquer les dates sur Airbnb + Booking");

  return json({ ok: true, emailSent, ntfySent });
}
