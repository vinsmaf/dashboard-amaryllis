import { resendFrom } from "./_email.js";
import { sendEmail as sendEmailHelper } from "./_sendEmail.js";
// Cloudflare Pages Function — GET /api/send-poststay
// crm-006 : Email post-séjour J+3 — demande d'avis Google + NPS 1 question
//
// Lit les départs Beds24 d'il y a 3 jours et envoie un email personnalisé
// à chaque voyageur (si email disponible) avec :
//   - Lien Google review (Places de la propriété correspondante)
//   - 1 question NPS (lien vers formulaire ou réponse directe par email)
//
// Auth : ?secret=POSTSTAY_SECRET
// Secrets requis  : BEDS24_TOKEN (D1 ou env), RESEND_API_KEY, POSTSTAY_SECRET
// Cron-job.org    : GET https://villamaryllis.com/api/send-poststay?secret=<SECRET>
//                   chaque jour à 10h UTC

import { getActiveBeds24Token } from "./beds24-refresh.js";
import { sendGuestEmail } from "./send-guest-email.js";

const BEDS24_V2_URL = "https://beds24.com/api/v2/bookings";
const PROP_ID       = "158192"; // Appartement Nogent — seul bien Beds24

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
// À personnaliser avec l'URL de votre formulaire NPS
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

function targetDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ── Email HTML post-séjour ───────────────────────────────────────────────────
function buildHtml({ firstName, bienNom, bienId, arrival, departure, reviewUrl, taUrl, npsUrl }) {
  const prenom = firstName || "cher(e) voyageur(se)";

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
        Merci, ${prenom} 🌴
      </h1>
      <p style="margin:10px 0 0;font-size:13px;color:rgba(250,247,242,0.58);">Votre séjour à <strong style="color:rgba(250,247,242,0.82);">${bienNom}</strong> — du ${fmt(arrival)} au ${fmt(departure)}</p>
    </div>

    <!-- Corps -->
    <div style="padding:32px 32px 24px;">
      <p style="margin:0 0 18px;font-size:15px;color:#0e3b3a;line-height:1.7;">
        Nous espérons que votre séjour a été à la hauteur de vos attentes.
        C'est toujours un plaisir d'accueillir des voyageurs dans nos propriétés, et votre avis nous aide à nous améliorer.
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

// ── Handler principal ────────────────────────────────────────────────────────
// crm — post-séjour J+1 aux RÉSERVATIONS DIRECTES (D1 direct_bookings),
// avec le nouveau template on-brand (2 boutons avis Google + Airbnb).
async function sendDirectPostStay(env, origin) {
  const db = env.revenue_manager;
  if (!db) return { sent: 0, failed: 0, candidats: 0 };
  const y = new Date(); y.setUTCDate(y.getUTCDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS direct_bookings (
      payment_intent_id TEXT PRIMARY KEY, bien_nom TEXT, voyageur TEXT,
      total INTEGER, depot INTEGER, checkin TEXT, checkout TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      email TEXT, prenom TEXT, bien_id TEXT,
      prearrivee_sent INTEGER DEFAULT 0, poststay_sent INTEGER DEFAULT 0)`).run();
    const { results } = await db.prepare(
      "SELECT rowid AS rid, * FROM direct_bookings WHERE checkout = ? AND poststay_sent = 0 AND email IS NOT NULL AND email != ''"
    ).bind(yesterday).all();
    let sent = 0, failed = 0;
    for (const b of results || []) {
      const r = await sendGuestEmail(env, origin, {
        template: "post-sejour",
        to: b.email,
        subject: `Merci pour votre séjour à ${b.bien_nom || "Amaryllis"}`,
        vars: {
          prenom: b.prenom || "", bien_nom: b.bien_nom || "votre logement",
          checkin: b.checkin || "", checkout: b.checkout || "",
          lien_avis_google: GOOGLE_REVIEW[b.bien_id] || GOOGLE_REVIEW.default,
          lien_avis_tripadvisor: TRIPADVISOR_REVIEW[b.bien_id] || TRIPADVISOR_REVIEW.default,
          lien_avis_airbnb: "https://villamaryllis.com/avis",
        },
      });
      if (r.ok) { await db.prepare("UPDATE direct_bookings SET poststay_sent = 1 WHERE rowid = ?").bind(b.rid).run(); sent++; }
      else { console.error(`[poststay-direct] échec ${b.email}: ${r.error}`); failed++; }
    }
    return { sent, failed, candidats: (results || []).length };
  } catch (e) {
    console.error("[poststay-direct]", e.message);
    return { sent: 0, failed: 0, candidats: 0, error: e.message };
  }
}

export async function onRequestGet(context) {
  const { env, request } = context;

  // ── Auth ─────────────────────────────────────────────────────────────────
  const url    = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (env.POSTSTAY_SECRET && secret !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }

  // ── Réservations DIRECTES (D1) — nouveau template on-brand ──
  const directResult = await sendDirectPostStay(env, url.origin);

  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) {
    return json({ error: "RESEND_API_KEY manquante" }, 500);
  }

  // ── Token Beds24 ─────────────────────────────────────────────────────────
  const token = await getActiveBeds24Token(env, env.revenue_manager);
  if (!token) return json({ error: "BEDS24_TOKEN manquant" }, 500);

  // ── Date cible : départs d'il y a 3 jours ────────────────────────────────
  const forceDate  = url.searchParams.get("date");
  const targetDep  = forceDate || targetDate(-3);
  const dryRun     = url.searchParams.get("dry") === "1"; // ?dry=1 pour simuler sans envoyer

  // ── Fetch Beds24 départs = targetDep ────────────────────────────────────
  let departures = [];
  try {
    const qp = new URLSearchParams({
      propId:         PROP_ID,
      departureFrom:  targetDep,
      departureTo:    targetDep,
      numId:          50,
      pageNum:        0,
    });
    const res = await fetch(`${BEDS24_V2_URL}?${qp}`, { headers: { token } });
    if (!res.ok) throw new Error(`Beds24 HTTP ${res.status}`);
    const data = await res.json();
    const raw  = Array.isArray(data) ? data : (data.data || data.bookings || []);
    // Garde uniquement les confirmées avec un email voyageur
    departures = raw
      .filter(b => (b.status === 1 || b.status === "1") && b.email && b.email.includes("@"))
      .map(b => ({
        bookingId: b.id,
        firstName: (b.firstName || "").trim(),
        lastName:  (b.lastName  || "").trim(),
        email:     b.email,
        arrival:   b.arrival   || "",
        departure: b.departure || targetDep,
        roomId:    b.roomId    || "",
        bienId:    "nogent", // seul bien sur ce compte Beds24
      }));
  } catch (err) {
    return json({ error: `Beds24 fetch error: ${err.message}` }, 502);
  }

  if (departures.length === 0) {
    return json({ ok: true, sent: 0, skipped: 0, reason: `Aucun départ Beds24 le ${targetDep} avec email`, targetDep, dryRun, direct: directResult });
  }

  // ── Envoi emails ──────────────────────────────────────────────────────────
  const results = [];
  for (const b of departures) {
    const bienNom   = "Appartement Nogent-sur-Marne";
    const reviewUrl = GOOGLE_REVIEW[b.bienId] || GOOGLE_REVIEW.default;
    const taUrl     = TRIPADVISOR_REVIEW[b.bienId] || TRIPADVISOR_REVIEW.default;
    const npsUrl    = `${NPS_BASE_URL}`;

    const html    = buildHtml({ firstName: b.firstName, bienNom, bienId: b.bienId, arrival: b.arrival, departure: b.departure, reviewUrl, taUrl, npsUrl });
    const subject = `Merci pour votre séjour à ${bienNom} ${b.firstName ? ", " + b.firstName : ""} 🌴`;

    if (dryRun) {
      results.push({ bookingId: b.bookingId, email: b.email, status: "dry-run (not sent)" });
      continue;
    }

    try {
      const result = await sendEmailHelper(env, {
        to: b.email,
        subject,
        html,
        reply_to: "contact@villamaryllis.com",
        template: "poststay_voyageur",
        category: "client",
        bien_id: b.bienId || null,
        booking_id: b.bookingId ? String(b.bookingId) : null,
      });
      const r = { ok: result.ok };
      results.push({ bookingId: b.bookingId, email: b.email, status: r.ok ? "sent" : `error ${result.error}` });
    } catch (err) {
      results.push({ bookingId: b.bookingId, email: b.email, status: `error: ${err.message}` });
    }
  }

  const sent    = results.filter(r => r.status === "sent").length;
  const errors  = results.filter(r => r.status.startsWith("error")).length;

  return json({ ok: true, targetDep, dryRun, sent, errors, skipped: departures.length - sent - errors, results, direct: directResult });
}

export async function onRequest(context) {
  return onRequestGet(context);
}
