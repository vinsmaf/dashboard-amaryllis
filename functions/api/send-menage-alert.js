import { resendFrom } from "./_email.js";
// Cloudflare Pages Function — GET /api/send-menage-alert
// log-005 : Alerte automatique prestataire ménage J-2 avant arrivée
//
// Lit les arrivées Beds24 dans 2 jours (Nogent, propId 158192) et envoie
// un email formaté au prestataire ménage via Resend.
//
// Auth : ?secret=MENAGE_ALERT_SECRET
// Secrets requis : BEDS24_TOKEN (ou D1 via beds24-refresh), RESEND_API_KEY,
//                  MENAGE_EMAIL, MENAGE_ALERT_SECRET
// Cron-job.org   : GET https://villamaryllis.com/api/send-menage-alert?secret=<SECRET>
//                  chaque jour à 08h00 UTC

import { getActiveBeds24Token } from "./beds24-refresh.js";

const BEDS24_V2_URL = "https://beds24.com/api/v2/bookings";
const PROP_ID       = "158192"; // Appartement Nogent — seul bien Beds24 de ce compte

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

// ── Maps roomId → label interne ─────────────────────────────────────────────
// À compléter selon la config Beds24 (les IDs s'affichent dans l'URL Beds24)
const ROOM_LABELS = {
  default: "Appartement Nogent-sur-Marne",
};
function roomLabel(roomId) {
  return ROOM_LABELS[roomId] || ROOM_LABELS.default;
}

// ── Formatter date FR ───────────────────────────────────────────────────────
function fmt(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function dayOfWeek(iso) {
  if (!iso) return "";
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  return days[new Date(iso + "T12:00:00").getDay()];
}

// ── Calcul J+2 ──────────────────────────────────────────────────────────────
function targetDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ── Email HTML ───────────────────────────────────────────────────────────────
function buildHtml(arrivals, alertDate) {
  const rows = arrivals.map(b => {
    const nom       = `${b.firstName || ""} ${b.lastName || ""}`.trim() || "Voyageur";
    const bien      = roomLabel(b.roomId);
    const depBefore = b.departure ? b.departure : null;

    return `
      <div style="background:#fff;border:1px solid #e8dcc8;border-radius:10px;padding:20px 24px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c47254;font-weight:600;">${bien}</p>
            <h2 style="margin:0 0 8px;font-size:18px;color:#0e3b3a;font-weight:600;">${nom}</h2>
            <p style="margin:0;font-size:13px;color:#555;">
              📅 Arrivée : <strong>${dayOfWeek(b.arrival)} ${fmt(b.arrival)}</strong>
              &nbsp;&nbsp;→&nbsp;&nbsp;
              Départ : <strong>${dayOfWeek(b.departure)} ${fmt(b.departure)}</strong>
            </p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0 0 4px;font-size:13px;color:#0e3b3a;font-weight:700;">
              👥 ${b.numGuests || 1} voyageur${(b.numGuests || 1) > 1 ? "s" : ""}
            </p>
            <p style="margin:0;font-size:12px;color:#7a6b5a;">${b.nights || "?"} nuit${(b.nights || 1) > 1 ? "s" : ""}</p>
          </div>
        </div>
        ${b.notes ? `
        <div style="margin-top:14px;padding:10px 14px;background:#faf5e9;border-left:3px solid #c47254;border-radius:0 6px 6px 0;font-size:12px;color:#555;line-height:1.5;">
          <strong style="color:#0e3b3a;">Notes :</strong> ${b.notes}
        </div>` : ""}
        ${depBefore ? `
        <p style="margin:12px 0 0;font-size:12px;color:#7a6b5a;">
          ⏰ Le logement est libre à partir du départ du séjour précédent — vérifiez le planning pour le créneau ménage.
        </p>` : ""}
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#faf5e9;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09);">

    <!-- Header -->
    <div style="background:#0e3b3a;padding:28px 32px 22px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(250,247,242,0.5);">Rappel automatique · J-2</p>
      <h1 style="margin:0;font-size:22px;color:#faf5e9;font-weight:300;letter-spacing:0.04em;">🧹 Ménage à prévoir</h1>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(250,247,242,0.6);">Arrivée(s) le ${fmt(alertDate)} — ${arrivals.length} logement${arrivals.length > 1 ? "s" : ""} à préparer</p>
    </div>

    <!-- Corps -->
    <div style="padding:28px 28px 8px;">
      <p style="margin:0 0 20px;font-size:14px;color:#0e3b3a;line-height:1.6;">
        Bonjour,<br>
        Voici le${arrivals.length > 1 ? "s" : ""} arrivée${arrivals.length > 1 ? "s" : ""} prévue${arrivals.length > 1 ? "s" : ""} dans <strong>2 jours</strong> (le <strong>${fmt(alertDate)}</strong>).
        Merci de vérifier la disponibilité du logement et de planifier le ménage en conséquence.
      </p>
      ${rows}
    </div>

    <!-- Footer -->
    <div style="padding:18px 28px 22px;text-align:center;">
      <a href="https://villamaryllis.com/admin" style="display:inline-block;background:#c47254;color:#fff;text-decoration:none;padding:11px 28px;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:0.04em;">
        Voir le planning complet →
      </a>
      <p style="margin:14px 0 0;font-size:11px;color:#a09080;">Amaryllis Locations · Alerte automatique · Ne pas répondre à cet email</p>
    </div>

  </div>
</body>
</html>`;
}

// ── Handler principal ────────────────────────────────────────────────────────
export async function onRequestGet(context) {
  const { env, request } = context;

  // ── Auth secret ──────────────────────────────────────────────────────────
  const secret = new URL(request.url).searchParams.get("secret");
  if (env.MENAGE_ALERT_SECRET && secret !== env.MENAGE_ALERT_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }

  // ── Secrets requis ───────────────────────────────────────────────────────
  const resendKey  = env.RESEND_API_KEY;
  const menageEmail = env.MENAGE_EMAIL;
  if (!resendKey || !menageEmail) {
    return json({ error: "RESEND_API_KEY et MENAGE_EMAIL requis dans les secrets Cloudflare" }, 500);
  }

  // ── Token Beds24 ─────────────────────────────────────────────────────────
  const token = await getActiveBeds24Token(env, env.revenue_manager);
  if (!token) {
    return json({ error: "BEDS24_TOKEN manquant" }, 500);
  }

  // ── Date cible : dans 2 jours ────────────────────────────────────────────
  // Possibilité de surcharger via ?date=YYYY-MM-DD pour tests
  const forceDate = new URL(request.url).searchParams.get("date");
  const alertDate = forceDate || targetDate(2);

  // ── Fetch Beds24 arrivées = alertDate ────────────────────────────────────
  let arrivals = [];
  try {
    const qp = new URLSearchParams({
      propId:      PROP_ID,
      arrivalFrom: alertDate,
      arrivalTo:   alertDate,
      numId:       50,
      pageNum:     0,
    });
    const res = await fetch(`${BEDS24_V2_URL}?${qp}`, { headers: { token } });
    if (!res.ok) throw new Error(`Beds24 ${res.status}`);
    const data = await res.json();

    const raw = Array.isArray(data) ? data : (data.data || data.bookings || []);
    // Garde uniquement les réservations confirmées (status 1 = confirmed)
    arrivals = raw
      .filter(b => b.status === 1 || b.status === "1")
      .map(b => ({
        bookingId: b.id,
        firstName: b.firstName || "",
        lastName:  b.lastName  || "",
        arrival:   b.arrival   || alertDate,
        departure: b.departure || "",
        roomId:    b.roomId    || "",
        numGuests: (b.numAdult || 1) + (b.numChild || 0),
        nights:    b.arrival && b.departure
          ? Math.round((new Date(b.departure) - new Date(b.arrival)) / 86400000)
          : null,
        notes: b.comments || b.notes || "",
      }));
  } catch (err) {
    return json({ error: `Beds24 fetch error: ${err.message}` }, 502);
  }

  // ── Aucune arrivée — ne pas envoyer d'email ──────────────────────────────
  if (arrivals.length === 0) {
    return json({ ok: true, sent: false, reason: `Aucune arrivée le ${alertDate}`, alertDate });
  }

  // ── Envoi email via Resend ───────────────────────────────────────────────
  const html    = buildHtml(arrivals, alertDate);
  const subject = `🧹 Ménage J-2 · ${arrivals.length} arrivée${arrivals.length > 1 ? "s" : ""} le ${fmt(alertDate)}`;

  let emailOk = false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    resendFrom(env),
        to:      [menageEmail],
        subject,
        html,
      }),
    });
    emailOk = r.ok;
    if (!r.ok) {
      const err = await r.text();
      return json({ error: `Resend error: ${err}` }, 502);
    }
  } catch (err) {
    return json({ error: `Email send failed: ${err.message}` }, 502);
  }

  return json({
    ok:        true,
    sent:      emailOk,
    alertDate,
    arrivals:  arrivals.length,
    to:        menageEmail,
    bookings:  arrivals.map(b => ({
      id:        b.bookingId,
      guest:     `${b.firstName} ${b.lastName}`.trim(),
      nights:    b.nights,
      numGuests: b.numGuests,
    })),
  });
}

export async function onRequest(context) {
  return onRequestGet(context);
}
