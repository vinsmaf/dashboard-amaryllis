import { resendFrom } from "./_email.js";
import { sendEmail as sendEmailHelper } from "./_sendEmail.js";
import { sendGuestEmail } from "./send-guest-email.js";
// Cloudflare Pages Function — POST /api/notify-booking
// Alerte fiable de NOUVELLE RÉSERVATION DIRECTE, déclenchée côté client juste
// après un paiement Stripe réussi (indépendant de la config webhook Stripe).
//
// Body : { paymentIntentId, bienNom, voyageur, total, checkin, checkout, depot }
// 1. Vérifie le PaymentIntent auprès de Stripe (status=succeeded) — anti-spam
// 2. Email à l'hôte (Resend) + push mobile (ntfy)
// 3. Enregistre la résa en D1 (table direct_bookings) pour le dashboard

// RGPD/sécu (finding F3) : origine restreinte aux domaines villamaryllis (plus de wildcard).
const ALLOWED_ORIGINS = ["https://villamaryllis.com", "https://www.villamaryllis.com", "https://dashboard-amaryllis.pages.dev"];
function corsHeaders(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.some(o => origin === o) || origin.endsWith(".dashboard-amaryllis.pages.dev");
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowed ? origin : "https://villamaryllis.com",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
const json = (d, s = 200, request) => new Response(JSON.stringify(d), { status: s, headers: corsHeaders(request) });

// DDL complet — doit rester en sync avec le schéma D1 de production.
// Colonnes bien_id/prenom/email : nécessaires pour get-availability (blocage dispo)
// et pour les séquences email pré-arrivée/post-séjour (send-prearrivee, send-poststay).
// prearrivee_sent / poststay_sent : flags pour éviter les doublons de relance cron.
const DDL = `CREATE TABLE IF NOT EXISTS direct_bookings (
  payment_intent_id TEXT PRIMARY KEY,
  bien_id    TEXT,
  bien_nom   TEXT,
  voyageur   TEXT,
  prenom     TEXT,
  email      TEXT,
  phone      TEXT,
  nb_guests  INTEGER DEFAULT 1,
  nb_pets    INTEGER DEFAULT 0,
  total      INTEGER,
  depot      INTEGER,
  checkin    TEXT,
  checkout   TEXT,
  prearrivee_sent INTEGER DEFAULT 0,
  poststay_sent   INTEGER DEFAULT 0,
  j1_acces_sent   INTEGER DEFAULT 0,
  host_notified   INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);`;

const fmtDate = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || "?";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

async function sendEmail(env, subject, html, text, ctx = {}) {
  if (!env.RESEND_API_KEY) return false;
  const to = env.NOTIFICATION_EMAIL
    ? env.NOTIFICATION_EMAIL.split(",").map(s => s.trim()).filter(Boolean)
    : ["vinsmaf@hotmail.com", "contact@villamaryllis.com"];
  const result = await sendEmailHelper(env, {
    to,
    subject,
    html,
    text,
    template: "notify_booking_host",
    category: "internal",
    bien_id: ctx.bien_id || null,
    booking_id: ctx.booking_id || null,
  });
  return result.ok;
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
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json({ error: "POST requis" }, 405, request);

  const url0 = new URL(request.url);
  // Mode test : POST ?test=1 → envoie une alerte de démonstration (sans Stripe, sans D1)
  if (url0.searchParams.get("test") === "1") {
    const emailSent = await sendEmail(env, "🧪 Test alerte réservation — Amaryllis",
      "<div style='font-family:Georgia,serif'><h2 style='color:#0e3b3a'>🧪 Test d'alerte</h2><p>Si vous lisez ceci, les notifications email de nouvelle réservation fonctionnent ✅</p></div>",
      "Test alerte réservation Amaryllis — si vous lisez ceci, l'email fonctionne.");
    const ntfySent = await sendNtfy(env, "🧪 Test alerte résa Amaryllis", "Test push — si vous voyez ça, ntfy fonctionne ✅");
    return json({ test: true, emailSent, ntfySent }, 200, request);
  }

  const body = await request.json().catch(() => ({}));
  const { paymentIntentId, bienId = "", bienNom = "?", voyageur = "", total = 0, checkin = "", checkout = "", depot = 0, email = "", phone = "", nb_guests = "1", nb_pets = "0" } = body;

  // ── 1. Vérification anti-spam : le paiement existe-t-il vraiment et est-il réussi ? ──
  const sk = env.STRIPE_SECRET_KEY;
  if (!paymentIntentId || !sk) return json({ error: "paymentIntentId requis" }, 400, request);
  let fullTotal = total;
  try {
    const r = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`, {
      headers: { Authorization: `Bearer ${sk}` },
    });
    const pi = await r.json();
    if (!r.ok || pi.status !== "succeeded") {
      return json({ error: "Paiement non confirmé", status: pi.status || "unknown" }, 402, request);
    }
    // Paiement 2x : full_total dans les metadata Stripe = source de vérité si body manquant
    if (!fullTotal && pi.metadata?.full_total) fullTotal = parseFloat(pi.metadata.full_total) || 0;
  } catch (e) {
    return json({ error: "Vérification Stripe échouée: " + e.message }, 502, request);
  }

  // ── 2. Idempotence : ne pas notifier 2× le même paiement ──
  const db = env.revenue_manager;
  if (db) {
    try {
      await db.prepare(DDL).run();
      // Migrations idempotentes sur table live créée avant certains champs.
      try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN phone TEXT`).run(); } catch { /* déjà présente */ }
      try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN nb_guests INTEGER DEFAULT 1`).run(); } catch { /* déjà présente */ }
      try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN nb_pets INTEGER DEFAULT 0`).run(); } catch { /* déjà présente */ }
      const exists = await db.prepare("SELECT 1 FROM direct_bookings WHERE payment_intent_id = ?").bind(paymentIntentId).first();
      if (exists) return json({ ok: true, already: true }, 200, request);
      // Inclut bien_id + email pour que get-availability bloque bien les dates au site public,
      // et que les emails pré-arrivée / post-séjour partent (cf. send-prearrivee, send-poststay).
      const prenom = String(voyageur || "").trim().split(/\s+/)[0] || "";
      // host_notified=1 dès l'insert : ce flux envoie l'alerte hôte juste après (lignes ci-dessous).
      // Le webhook stripe (notifyHostOnce) verra host_notified=1 → ne re-notifiera pas (dédup).
      await db.prepare(
        "INSERT INTO direct_bookings (payment_intent_id, bien_id, bien_nom, voyageur, prenom, email, phone, nb_guests, nb_pets, total, depot, checkin, checkout, host_notified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)"
      ).bind(paymentIntentId, bienId || null, bienNom, voyageur, prenom, email || null, String(phone || "").trim() || null, parseInt(nb_guests, 10) || 1, parseInt(nb_pets, 10) || 0, Math.round(fullTotal), Math.round(depot), checkin, checkout).run();
    } catch { /* non bloquant */ }
  }

  // ── 3. Email de confirmation au voyageur ──
  if (email) {
    sendGuestEmail(env, url0.origin, {
      template: "confirmation",
      to: email,
      subject: `✓ Votre séjour à ${bienNom} est confirmé`,
      vars: {
        prenom: String(voyageur || "").trim().split(/\s+/)[0] || "",
        bien_nom: bienNom,
        checkin, checkout,
        nb_guests: String(nb_guests || 1),
        total: String(Math.round(fullTotal)),
        wa_hote: "33610880772",
      },
    }).catch(() => {}); // non bloquant
  }

  // ── 4. Notifications hôte ──
  const titre = `🎉 NOUVELLE RÉSA — ${bienNom}`;
  const ligne = `${voyageur || "Voyageur"} · ${fmtDate(checkin)} → ${fmtDate(checkout)} · ${fullTotal} €${depot ? ` (caution ${depot}€)` : ""}`;
  const html = `<div style="font-family:Georgia,serif;color:#2b2b2b;line-height:1.7">
    <h2 style="color:#0e3b3a">🎉 Nouvelle réservation directe</h2>
    <p style="font-size:16px"><strong>${bienNom}</strong></p>
    <table style="font-size:15px;border-collapse:collapse">
      <tr><td style="padding:3px 16px 3px 0">Voyageur</td><td><strong>${voyageur || "—"}</strong></td></tr>
      <tr><td style="padding:3px 16px 3px 0">Dates</td><td>${fmtDate(checkin)} → ${fmtDate(checkout)}</td></tr>
      <tr><td style="padding:3px 16px 3px 0">Montant payé</td><td><strong>${fullTotal} €</strong></td></tr>
      ${depot ? `<tr><td style="padding:3px 16px 3px 0">Caution</td><td>${depot} € (pré-autorisée)</td></tr>` : ""}
    </table>
    <p style="font-size:14px;color:#0e7a5a;margin-top:16px">✅ Dates bloquées automatiquement sur Airbnb + Booking (sync iCal).</p>
  </div>`;

  const emailSent = await sendEmail(env, titre, html, ligne, { booking_id: paymentIntentId, bien_id: bienId });
  const ntfySent  = await sendNtfy(env, titre, ligne);

  return json({ ok: true, emailSent, ntfySent }, 200, request);
}
