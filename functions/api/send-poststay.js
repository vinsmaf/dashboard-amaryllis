import { sendEmail as sendEmailHelper } from "./_sendEmail.js";
// Cloudflare Pages Function — GET /api/send-poststay
// crm-006 / growth-005 : séquence post-séjour à 2 touches MAXIMUM (demande Vincent
// 2026-07-04 — "je veux bien des rappels mais pas plus de 2, au meilleur moment") :
//   - touch "ask"      : J+2 après le départ — remerciement + demande avis Google/TripAdvisor.
//   - touch "reminder" : J+7 après le départ — DERNIÈRE relance (jamais une 3e) — satisfaction
//                        + offre fidélité RETOUR10. N'est envoyée QUE si "ask" a déjà été envoyé.
// Les 2 touches tournent sur le même cron quotidien (chacune ne matche qu'un jour précis).
//
// Auth : ?secret=POSTSTAY_SECRET
// Secrets requis  : BEDS24_TOKEN (D1 ou env), RESEND_API_KEY, POSTSTAY_SECRET
// Cron-job.org    : GET https://villamaryllis.com/api/send-poststay?secret=<SECRET>
//                   chaque jour à 10h UTC
// Params debug    : ?dry=1 (simule, n'envoie rien) · ?touch=ask|reminder (une seule touche)
//                   · ?date=YYYY-MM-DD (force la date cible Beds24, sinon calculée)

import { getActiveBeds24Token } from "./beds24-refresh.js";
import { sendGuestEmail } from "./send-guest-email.js";
import { redactEmail } from "./_log.js";

const BEDS24_V2_URL = "https://beds24.com/api/v2/bookings";
const PROP_ID       = "158192"; // Appartement Nogent — seul bien Beds24

// Décalage (jours après le départ) par touche — au-delà de "reminder", plus rien n'est envoyé.
const TOUCH_OFFSETS = { ask: -2, reminder: -7 };

// Google Review links — Place IDs (Places v1 API)
const GOOGLE_REVIEW = {
  // Amaryllis et résidence (Zandoli, Géko, Mabouya, Iguana) partagent l'une des 2 places
  amaryllis:  "https://search.google.com/local/writereview?placeid=ChIJWbeKdLghQIwRCppz2lJ39Jk",
  zandoli:    "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  geko:       "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  mabouya:    "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  iguana:     "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  // Schœlcher & Nogent : pas (encore) de fiche Google Business dédiée.
  // On évite d'envoyer ces voyageurs noter une fiche d'une autre localité (trompeur + filtré
  // par Google). Fallback page avis interne. ➜ À remplacer par le writereview de leur Place ID
  // dès que les fiches GBP Bellevue/Nogent sont créées et validées.
  schoelcher: "https://villamaryllis.com/avis",
  nogent:     "https://villamaryllis.com/avis",
  default:    "https://search.google.com/local/writereview?placeid=ChIJWbeKdLghQIwRCppz2lJ39Jk",
};

// TripAdvisor Review links — placeholders à remplacer après création des fiches TA
const TRIPADVISOR_REVIEW = {
  amaryllis:  "https://www.tripadvisor.fr/Review-gXXXXX-dXXXXXX", // ← à remplacer après création fiche TA
  zandoli:    "https://www.tripadvisor.fr/Review-gXXXXX-dXXXXXX",
  geko:       "https://www.tripadvisor.fr/Review-gXXXXX-dXXXXXX",
  mabouya:    "https://www.tripadvisor.fr/Review-gXXXXX-dXXXXXX",
  schoelcher: "https://www.tripadvisor.fr/Review-gXXXXX-dXXXXXX",
  nogent:     "https://www.tripadvisor.fr/Review-gXXXXX-dXXXXXX",
  default:    "https://www.tripadvisor.fr/Review-gXXXXX-dXXXXXX",
};

// NPS — lien de réponse directe (peut pointer vers un Typeform, Tally, ou Google Form)
const NPS_BASE_URL = "https://villamaryllis.com/avis";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

function fmt(iso) {
  if (!iso) return "?";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// "20 juin 2026" — pour {{check_out_date}} du template post-sejour-relance.
function formatDateFr(iso) {
  if (!iso) return "";
  try {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  } catch { return iso; }
}

function targetDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ── Email HTML post-séjour (segment Beds24/Nogent) ──────────────────────────
function buildHtml({ firstName, bienNom, bienId, arrival, departure, reviewUrl, taUrl, npsUrl, reminder }) {
  const prenom = firstName || "cher(e) voyageur(se)";
  const introText = reminder
    ? "Nous espérons que vous gardez un excellent souvenir de votre séjour. Un petit mot de votre part — même quelques jours après votre retour — nous aide énormément."
    : "Nous espérons que votre séjour a été à la hauteur de vos attentes. C'est toujours un plaisir d'accueillir des voyageurs dans nos propriétés, et votre avis nous aide à nous améliorer.";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Merci pour votre séjour — Amaryllis</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#faf5e9;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09);">

    <!-- Header -->
    <div style="background:#0e3b3a;padding:36px 32px 28px;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(250,247,242,0.45);">Amaryllis Locations</p>
      <h1 style="margin:0;font-size:26px;color:#faf5e9;font-weight:300;letter-spacing:0.03em;line-height:1.2;">
        ${reminder ? `Un petit mot, ${prenom} ?` : `Merci, ${prenom} 🌴`}
      </h1>
      <p style="margin:10px 0 0;font-size:13px;color:rgba(250,247,242,0.58);">Votre séjour à <strong style="color:rgba(250,247,242,0.82);">${bienNom}</strong> — du ${fmt(arrival)} au ${fmt(departure)}</p>
    </div>

    <!-- Corps -->
    <div style="padding:32px 32px 24px;">
      <p style="margin:0 0 18px;font-size:15px;color:#0e3b3a;line-height:1.7;">
        ${introText}
      </p>

      <!-- Avis Google -->
      <div style="background:#fff;border:1px solid #e8dcc8;border-radius:12px;padding:22px 24px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <div style="width:36px;height:36px;background:#fbbf24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">⭐</div>
          <div>
            <p style="margin:0;font-size:14px;font-weight:700;color:#0e3b3a;">Laissez un avis Google</p>
            <p style="margin:2px 0 0;font-size:12px;color:#7a6b5a;">2 minutes · Impact direct sur notre visibilité</p>
          </div>
        </div>
        <p style="margin:0 0 16px;font-size:13px;color:#555;line-height:1.6;">
          Votre expérience compte énormément pour nous et pour les futurs voyageurs. Un mot sincère, même court, fait toute la différence.
        </p>
        <a href="${reviewUrl}" target="_blank" rel="noopener"
          style="display:inline-block;background:#0e3b3a;color:#faf5e9;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:0.04em;">
          ✍️ Écrire un avis →
        </a>
      </div>

      <!-- TripAdvisor -->
      <div style="background:#fff;border:1px solid #e8dcc8;border-radius:12px;padding:22px 24px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <div style="width:36px;height:36px;background:#00af87;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🦉</div>
          <div>
            <p style="margin:0;font-size:14px;font-weight:700;color:#0e3b3a;">Laissez un avis TripAdvisor</p>
            <p style="margin:2px 0 0;font-size:12px;color:#7a6b5a;">2 minutes · Lu par des millions de voyageurs</p>
          </div>
        </div>
        <p style="margin:0 0 16px;font-size:13px;color:#555;line-height:1.6;">
          TripAdvisor est la référence mondiale des voyageurs. Votre avis booste notre visibilité internationale.
        </p>
        <a href="${taUrl}" target="_blank" rel="noopener"
          style="display:inline-block;background:#00af87;color:#fff;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:0.04em;">
          🦉 Écrire un avis TripAdvisor →
        </a>
      </div>

      <!-- NPS -->
      <div style="background:#fff4ed;border:1px solid #f2c99a;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#c47254;">Une seule question :</p>
        <p style="margin:0 0 18px;font-size:15px;color:#0e3b3a;font-weight:600;line-height:1.4;">
          De 0 à 10, recommanderiez-vous Amaryllis Locations à vos proches ?
        </p>
        <!-- Boutons NPS 0–10 -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${[0,1,2,3,4,5,6,7,8,9,10].map(n => {
            const bg = n >= 9 ? "#10b981" : n >= 7 ? "#f59e0b" : "#ef4444";
            return `<a href="${npsUrl}?score=${n}&bien=${bienId}&name=${encodeURIComponent(firstName || '')}"
              style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;background:${bg};color:#fff;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">${n}</a>`;
          }).join("")}
        </div>
      </div>

      <p style="margin:0;font-size:13px;color:#7a6b5a;line-height:1.65;">
        Si vous avez eu la moindre difficulté pendant votre séjour, n'hésitez pas à nous en parler directement par email ou WhatsApp — nous préférons toujours l'apprendre de vous plutôt que de le lire sur les plateformes.
      </p>
    </div>

    <!-- CTA réservation future -->
    <div style="margin:0 24px 24px;background:#0e3b3a;border-radius:10px;padding:20px 24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;color:rgba(250,247,242,0.45);letter-spacing:0.12em;text-transform:uppercase;">Revenez nous voir</p>
      <p style="margin:0 0 14px;font-size:14px;color:#faf5e9;font-weight:300;">Réservez en direct et économisez 15% vs Airbnb</p>
      <a href="https://villamaryllis.com?utm_source=email&utm_medium=email&utm_campaign=post-sejour" style="display:inline-block;background:#c47254;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;">
        Voir nos disponibilités →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#e8dcc8;text-align:center;">
      <p style="margin:0;font-size:11px;color:#7a6b5a;">Amaryllis Locations · villamaryllis.com<br>Vous recevez cet email car vous avez séjourné dans l'une de nos propriétés.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Réservations DIRECTES (D1 direct_bookings) ───────────────────────────────
// touch "ask" (J+2) → template post-sejour · touch "reminder" (J+7, dernière) →
// template post-sejour-relance. La reminder n'est envoyée QUE si "ask" est déjà passée.
async function sendDirectPostStay(env, origin, touch, dryRun) {
  const db = env.revenue_manager;
  if (!db) return { sent: 0, failed: 0, candidats: 0 };
  const targetCheckout = targetDate(TOUCH_OFFSETS[touch]);
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS direct_bookings (
      payment_intent_id TEXT PRIMARY KEY, bien_nom TEXT, voyageur TEXT,
      total INTEGER, depot INTEGER, checkin TEXT, checkout TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      email TEXT, prenom TEXT, bien_id TEXT,
      prearrivee_sent INTEGER DEFAULT 0, poststay_sent INTEGER DEFAULT 0)`).run();
    try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN status TEXT DEFAULT 'confirmed'`).run(); } catch { /* déjà présente */ }
    // Colonne 2e touche — jamais de 3e (demande Vincent 2026-07-04, max 2 relances).
    try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN poststay_reminder_sent INTEGER DEFAULT 0`).run(); } catch { /* déjà présente */ }

    const cond = touch === "ask"
      ? "poststay_sent = 0"
      : "poststay_sent = 1 AND poststay_reminder_sent = 0";
    // Exclut les résas annulées (cf. cancel-booking.js) — pas de demande d'avis pour un séjour annulé.
    const { results } = await db.prepare(
      `SELECT rowid AS rid, * FROM direct_bookings WHERE checkout = ? AND ${cond} AND email IS NOT NULL AND email != '' AND (status IS NULL OR status != 'cancelled')`
    ).bind(targetCheckout).all();

    let sent = 0, failed = 0, skipped = 0;
    for (const b of results || []) {
      if (dryRun) { skipped++; continue; }
      const template = touch === "ask" ? "post-sejour" : "post-sejour-relance";
      const subject = touch === "ask"
        ? `Merci pour votre séjour à ${b.bien_nom || "Amaryllis"}`
        : `${b.prenom ? b.prenom + ", votre" : "Votre"} avis sur ${b.bien_nom || "votre séjour"} nous intéresse`;
      const r = await sendGuestEmail(env, origin, {
        template,
        to: b.email,
        subject,
        vars: {
          prenom: b.prenom || "", bien_nom: b.bien_nom || "votre logement",
          checkin: b.checkin || "", checkout: b.checkout || "",
          bien_url: `https://villamaryllis.com/${b.bien_id || ""}`,
          check_out_date: formatDateFr(b.checkout),
          lien_avis_google: GOOGLE_REVIEW[b.bien_id] || GOOGLE_REVIEW.default,
          lien_avis_tripadvisor: TRIPADVISOR_REVIEW[b.bien_id] || TRIPADVISOR_REVIEW.default,
          lien_avis_airbnb: "https://villamaryllis.com/avis",
        },
      });
      const col = touch === "ask" ? "poststay_sent" : "poststay_reminder_sent";
      if (r.ok) { await db.prepare(`UPDATE direct_bookings SET ${col} = 1 WHERE rowid = ?`).bind(b.rid).run(); sent++; }
      else { console.error(`[poststay-direct-${touch}] échec ${redactEmail(b.email)}: ${r.error}`); failed++; }
    }
    return { sent, failed, skipped, candidats: (results || []).length, targetCheckout };
  } catch (e) {
    console.error(`[poststay-direct-${touch}]`, e.message);
    return { sent: 0, failed: 0, candidats: 0, error: e.message };
  }
}

// ── Réservations Beds24/Nogent — pas de table locale, idempotence via un log dédié ──
async function ensureBeds24Log(db) {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS beds24_poststay_log (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
    "booking_id TEXT NOT NULL," +
    "touch TEXT NOT NULL," +
    "sent_at INTEGER NOT NULL," +
    "UNIQUE(booking_id, touch)" +
    ")"
  );
}

async function sendBeds24PostStay(env, touch, forceDate, dryRun) {
  const db = env.revenue_manager;
  if (!db) return { error: "D1 indisponible" };
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) return { error: "RESEND_API_KEY manquante" };
  const token = await getActiveBeds24Token(env, db);
  if (!token) return { error: "BEDS24_TOKEN manquant" };
  await ensureBeds24Log(db);

  const targetDep = forceDate || targetDate(TOUCH_OFFSETS[touch]);

  let departures;
  try {
    const qp = new URLSearchParams({ propId: PROP_ID, departureFrom: targetDep, departureTo: targetDep, numId: 50, pageNum: 0 });
    const res = await fetch(`${BEDS24_V2_URL}?${qp}`, { headers: { token } });
    if (!res.ok) throw new Error(`Beds24 HTTP ${res.status}`);
    const data = await res.json();
    const raw  = Array.isArray(data) ? data : (data.data || data.bookings || []);
    departures = raw
      .filter(b => (b.status === 1 || b.status === "1") && b.email && b.email.includes("@"))
      .map(b => ({
        bookingId: b.id,
        firstName: (b.firstName || "").trim(),
        lastName:  (b.lastName  || "").trim(),
        email:     b.email,
        arrival:   b.arrival   || "",
        departure: b.departure || targetDep,
        bienId:    "nogent",
      }));
  } catch (err) {
    return { error: `Beds24 fetch error: ${err.message}`, targetDep, touch };
  }

  if (departures.length === 0) {
    return { ok: true, sent: 0, skipped: 0, errors: 0, targetDep, touch, reason: `Aucun départ Beds24 le ${targetDep} avec email` };
  }

  const results = [];
  for (const b of departures) {
    const already = await db.prepare("SELECT 1 FROM beds24_poststay_log WHERE booking_id=? AND touch=?").bind(String(b.bookingId), touch).first();
    if (already) { results.push({ bookingId: b.bookingId, email: b.email, status: "skip (déjà envoyé)" }); continue; }

    const bienNom   = "Appartement Nogent-sur-Marne";
    const reviewUrl = GOOGLE_REVIEW[b.bienId] || GOOGLE_REVIEW.default;
    const taUrl     = TRIPADVISOR_REVIEW[b.bienId] || TRIPADVISOR_REVIEW.default;
    const npsUrl    = NPS_BASE_URL;
    const reminder  = touch === "reminder";
    const html      = buildHtml({ firstName: b.firstName, bienNom, bienId: b.bienId, arrival: b.arrival, departure: b.departure, reviewUrl, taUrl, npsUrl, reminder });
    const subject   = reminder
      ? `Un petit rappel — votre avis sur ${bienNom} nous intéresse${b.firstName ? ", " + b.firstName : ""}`
      : `Merci pour votre séjour à ${bienNom}${b.firstName ? ", " + b.firstName : ""} 🌴`;

    if (dryRun) { results.push({ bookingId: b.bookingId, email: b.email, status: "dry-run (not sent)" }); continue; }

    try {
      const result = await sendEmailHelper(env, {
        to: b.email,
        subject,
        html,
        reply_to: "contact@villamaryllis.com",
        template: `poststay_voyageur_${touch}`,
        category: "client",
        bien_id: b.bienId || null,
        booking_id: b.bookingId ? String(b.bookingId) : null,
      });
      if (result.ok) {
        await db.prepare("INSERT INTO beds24_poststay_log (booking_id, touch, sent_at) VALUES (?,?,?)")
          .bind(String(b.bookingId), touch, Date.now()).run().catch(() => {});
      }
      results.push({ bookingId: b.bookingId, email: b.email, status: result.ok ? "sent" : `error ${result.error}` });
    } catch (err) {
      results.push({ bookingId: b.bookingId, email: b.email, status: `error: ${err.message}` });
    }
  }

  const sent    = results.filter(r => r.status === "sent").length;
  const errors  = results.filter(r => r.status.startsWith("error")).length;
  const skipped = results.length - sent - errors;

  return { ok: true, targetDep, touch, sent, errors, skipped, results };
}

export async function onRequestGet(context) {
  const { env, request } = context;

  // ── Auth ─────────────────────────────────────────────────────────────────
  const url    = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (env.POSTSTAY_SECRET && secret !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }

  const forceDate = url.searchParams.get("date");
  const dryRun    = url.searchParams.get("dry") === "1";
  const onlyTouch = url.searchParams.get("touch"); // "ask" | "reminder" — sinon les deux
  const touches   = (onlyTouch === "ask" || onlyTouch === "reminder") ? [onlyTouch] : ["ask", "reminder"];

  // ── Réservations DIRECTES (D1) ──────────────────────────────────────────
  const direct = {};
  for (const t of touches) direct[t] = await sendDirectPostStay(env, url.origin, t, dryRun);

  // ── Réservations Beds24/Nogent ──────────────────────────────────────────
  const beds24 = {};
  for (const t of touches) beds24[t] = await sendBeds24PostStay(env, t, forceDate, dryRun);

  return json({ ok: true, dryRun, touches, direct, beds24 });
}

export async function onRequest(context) {
  return onRequestGet(context);
}
